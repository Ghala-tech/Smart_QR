const express = require('express');
const {
  store,
  uid,
  nextReportNumber,
  pushNotification,
  isOverdue,
  typeLabel,
  PROBLEM_TYPE_KEYS,
  PRIORITY_KEYS,
  STATUS_KEYS,
} = require('../store');
const {
  requireString,
  optionalString,
  requireEnum,
  requireInt,
  optionalImageDataUrl,
} = require('../validators');
const { ApiError } = require('../errors');
const { notifyAdmins } = require('../push');

const router = express.Router();

function findReportOr404(id) {
  const rep = store.reports.find((r) => r.id === id);
  if (!rep) throw new ApiError(404, 'البلاغ غير موجود.');
  return rep;
}

/**
 * GET /api/reports
 * Query params: status, priority, type, locationId, technicianId, q (search
 * in report number/description), page, perPage. Pass all=true to skip
 * pagination (used to hydrate the frontend's local cache).
 */
router.get('/', (req, res) => {
  const q = req.query;
  let list = [...store.reports];

  if (q.status) list = list.filter((r) => r.status === q.status);
  if (q.priority) list = list.filter((r) => r.priority === q.priority);
  if (q.type) list = list.filter((r) => r.type === q.type);
  if (q.locationId) list = list.filter((r) => r.locationId === q.locationId);
  if (q.technicianId) list = list.filter((r) => r.technicianId === q.technicianId);
  if (q.reportedById) list = list.filter((r) => r.reportedById === q.reportedById);
  if (q.q) {
    const term = String(q.q).toLowerCase();
    list = list.filter(
      (r) => r.number.toLowerCase().includes(term) || r.description.toLowerCase().includes(term)
    );
  }

  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (q.all === 'true') {
    return res.json({ items: list, total: list.length });
  }

  const page = Math.max(1, parseInt(q.page, 10) || 1);
  const perPage = Math.max(1, Math.min(100, parseInt(q.perPage, 10) || 10));
  const start = (page - 1) * perPage;
  const items = list.slice(start, start + perPage);

  res.json({ items, total: list.length, page, perPage });
});

/** GET /api/reports/analytics — server-computed aggregates for the admin
 * analytics page (fault counts by device/location/type, average repair
 * time, closure rate, average rating). */
router.get('/analytics', (req, res) => {
  const reports = store.reports;
  const closed = reports.filter((r) => r.closedAt);
  const rated = reports.filter((r) => r.rating !== null && r.rating !== undefined);

  const closureRate = reports.length ? Math.round((closed.length / reports.length) * 100) : 0;
  const avgRating = rated.length ? rated.reduce((a, r) => a + r.rating, 0) / rated.length : null;

  res.json({
    total: reports.length,
    closedCount: closed.length,
    closureRate,
    avgRating,
  });
});

router.get('/by-number/:number', (req, res) => {
  const num = String(req.params.number).trim().toUpperCase();
  const rep = store.reports.find((r) => r.number.trim().toUpperCase() === num);
  if (!rep) throw new ApiError(404, 'لم يتم العثور على بلاغ بهذا الرقم.');
  res.json(rep);
});

router.get('/:id', (req, res) => {
  res.json(findReportOr404(req.params.id));
});

router.post('/', (req, res) => {
  const body = req.body || {};

  const locationId = requireString(body.locationId, 'الموقع', { maxLen: 40 });
  if (!store.locations.some((l) => l.id === locationId)) {
    throw new ApiError(400, 'الرمز غير صالح أو غير مرتبط بموقع في النظام.');
  }

  let deviceId = null;
  if (body.deviceId) {
    deviceId = requireString(body.deviceId, 'الجهاز', { maxLen: 40 });
    if (!store.devices.some((d) => d.id === deviceId)) {
      throw new ApiError(400, 'الجهاز المحدد غير موجود.');
    }
  }

  const type = requireEnum(body.type, PROBLEM_TYPE_KEYS, 'نوع المشكلة');
  const priority = requireEnum(body.priority, PRIORITY_KEYS, 'الأولوية');
  const description = requireString(body.description, 'وصف المشكلة', { maxLen: 2000 });
  const image = optionalImageDataUrl(body.image, 'الصورة المرفقة');
  const reportedByName = optionalString(body.reportedByName, 'اسم مقدّم البلاغ', { maxLen: 200 }) || 'زائر';
  const reportedById = body.reportedById ? requireString(body.reportedById, 'رقم مقدّم البلاغ', { maxLen: 40 }) : null;
  const reportedByRole = ['employee', 'technician', 'admin', 'trainee'].includes(body.reportedByRole)
    ? body.reportedByRole
    : 'trainee';

  const report = {
    id: uid('rep'),
    number: nextReportNumber(),
    locationId,
    deviceId,
    type,
    priority,
    description,
    image,
    status: 'new',
    technicianId: null,
    reportedByName,
    reportedById,
    reportedByRole,
    createdAt: new Date().toISOString(),
    acceptedAt: null,
    startedAt: null,
    resolvedAt: null,
    closedAt: null,
    notes: [],
    rating: null,
    ratingResolved: null,
    ratingComment: null,
  };

  store.reports.unshift(report);
  const loc = store.locations.find((l) => l.id === locationId);
  pushNotification('new_report', 'بلاغ جديد رقم ' + report.number + ' — ' + (loc ? loc.name : locationId));

  // Best-effort browser push to the admin's device(s) — never blocks or
  // fails the report creation itself if a push fails to send.
  notifyAdmins({
    title: 'بلاغ جديد — ' + report.number,
    body: (loc ? loc.name : locationId) + ' · ' + typeLabel(type),
    url: '/#/admin/report/' + report.id,
  }).catch(() => {});

  res.status(201).json(report);
});

router.patch('/:id/status', (req, res) => {
  const rep = findReportOr404(req.params.id);
  const status = requireEnum((req.body || {}).status, STATUS_KEYS, 'الحالة');

  rep.status = status;
  const now = new Date().toISOString();
  if (status === 'in_progress' && !rep.startedAt) rep.startedAt = now;
  if (status === 'in_progress' && !rep.acceptedAt) rep.acceptedAt = now;
  if (status === 'resolved') rep.resolvedAt = now;
  if (status === 'closed') rep.closedAt = now;

  const { stLabel } = require('../store');
  pushNotification('status_changed', 'تغيّرت حالة بلاغ ' + rep.number + ' إلى ' + stLabel(status));

  res.json(rep);
});

router.patch('/:id/assign', (req, res) => {
  const rep = findReportOr404(req.params.id);
  const technicianId = requireString((req.body || {}).technicianId, 'الفني', { maxLen: 40 });
  const tech = store.technicians.find((t) => t.id === technicianId);
  if (!tech) throw new ApiError(400, 'الفني المحدد غير موجود.');

  rep.technicianId = technicianId;
  pushNotification('assigned', 'تم إسناد بلاغ ' + rep.number + ' إلى ' + tech.name);

  res.json(rep);
});

router.post('/:id/notes', (req, res) => {
  const rep = findReportOr404(req.params.id);
  const body = req.body || {};
  const text = requireString(body.text, 'الملاحظة', { maxLen: 1000 });
  const authorId = optionalString(body.authorId, 'معرّف الكاتب', { maxLen: 40 });
  const authorName = optionalString(body.authorName, 'اسم الكاتب', { maxLen: 200 });

  rep.notes.push({ id: uid('n'), authorId: authorId || null, authorName, text, at: new Date().toISOString() });
  res.status(201).json(rep);
});

router.post('/:id/rating', (req, res) => {
  const rep = findReportOr404(req.params.id);
  if (rep.status !== 'closed') {
    throw new ApiError(400, 'لا يمكن تقييم الخدمة قبل إغلاق البلاغ.');
  }
  const body = req.body || {};
  const rating = requireInt(body.rating, 'التقييم', { min: 1, max: 5 });
  const resolved = Boolean(body.resolved);
  const comment = optionalString(body.comment, 'التعليق', { maxLen: 500 });

  rep.rating = rating;
  rep.ratingResolved = resolved;
  rep.ratingComment = comment || null;

  res.json(rep);
});

/**
 * GET /api/reports/export — Excel export data source. Returns rows already
 * shaped with the same Arabic column headers the frontend previously built
 * client-side, filtered by an inclusive [from, to] ISO-date range.
 */
router.get('/export/data', (req, res) => {
  const { typeLabel, prLabel, stLabel } = require('../store');
  const { from, to } = req.query;
  if (!from || !to || isNaN(new Date(from)) || isNaN(new Date(to))) {
    throw new ApiError(400, 'فترة التصدير غير صالحة.');
  }
  const fromDate = new Date(from);
  const toDate = new Date(to);

  const list = store.reports.filter((r) => {
    const d = new Date(r.createdAt);
    return d >= fromDate && d <= toDate;
  });

  const fmtDateShort = (iso) => (iso ? new Date(iso).toLocaleDateString('ar-SA', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '—');
  const fmtDate = (iso) =>
    iso
      ? new Date(iso).toLocaleDateString('ar-SA', { year: 'numeric', month: '2-digit', day: '2-digit' }) +
        ' ' +
        new Date(iso).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
      : '—';
  const hoursBetween = (a, b) => (new Date(b) - new Date(a)) / 36e5;

  const rows = list.map((r) => {
    const tech = r.technicianId ? store.technicians.find((t) => t.id === r.technicianId) : null;
    const loc = store.locations.find((l) => l.id === r.locationId);
    return {
      'رقم البلاغ': r.number,
      'التاريخ': fmtDateShort(r.createdAt),
      'الموقع': loc ? loc.name : r.locationId,
      'نوع المشكلة': typeLabel(r.type),
      'الأولوية': prLabel(r.priority),
      'الحالة': stLabel(r.status),
      'الفني': tech ? tech.name : '—',
      'بداية الصيانة': r.startedAt ? fmtDate(r.startedAt) : '—',
      'انتهاء الصيانة': r.resolvedAt ? fmtDate(r.resolvedAt) : '—',
      'مدة المعالجة (ساعة)': r.closedAt ? hoursBetween(r.createdAt, r.closedAt).toFixed(1) : '—',
      'ملاحظات الصيانة': r.notes.map((n) => n.text).join(' | '),
      'تقييم المستخدم': r.rating !== null && r.rating !== undefined ? r.rating : '—',
    };
  });

  res.json(rows);
});

module.exports = router;
