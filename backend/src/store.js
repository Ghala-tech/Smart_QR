/**
 * In-memory data store for Smart QR Maintenance.
 *
 * IMPORTANT: there is no database and no JSON fixture files here, per the
 * project's requirements. All data lives in plain JS objects/arrays in this
 * module's memory for the lifetime of the Node process. Restarting the
 * server resets everything back to the initial reference/configuration data
 * below (buildings, locations, devices, technicians, employees, settings) —
 * this is the SAME structural/reference data that already existed in the
 * project's frontend (nothing new was invented), kept here only because a
 * real backend needs *some* initial configuration to be useful. Reports and
 * notifications intentionally start EMPTY: they are meant to be produced by
 * real usage of the app (submit a report, assign it, resolve it, ...), not
 * by seeded demo/mock transactions.
 */

function pad(n, l) {
  n = String(n);
  while (n.length < l) n = '0' + n;
  return n;
}

function uid(prefix) {
  return prefix + '_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

const PROBLEM_TYPES = [
  { key: 'device', label: 'أجهزة' },
  { key: 'ac', label: 'تكييف' },
  { key: 'lighting', label: 'إضاءة' },
  { key: 'network', label: 'شبكة وإنترنت' },
  { key: 'furniture', label: 'أثاث' },
  { key: 'cleaning', label: 'نظافة' },
  { key: 'electricity', label: 'كهرباء' },
  { key: 'plumbing', label: 'سباكة' },
  { key: 'other', label: 'أخرى' },
];
const PRIORITIES = [
  { key: 'low', label: 'منخفضة' },
  { key: 'medium', label: 'متوسطة' },
  { key: 'high', label: 'عالية' },
  { key: 'urgent', label: 'عاجلة' },
];
const STATUSES = [
  { key: 'new', label: 'جديد' },
  { key: 'in_progress', label: 'قيد التنفيذ' },
  { key: 'resolved', label: 'تم الحل' },
  { key: 'closed', label: 'مغلق' },
];
const DEVICE_STATUSES = ['working', 'needs_maintenance', 'out_of_order', 'out_of_service'];

const PROBLEM_TYPE_KEYS = PROBLEM_TYPES.map((t) => t.key);
const PRIORITY_KEYS = PRIORITIES.map((t) => t.key);
const STATUS_KEYS = STATUSES.map((t) => t.key);

function typeLabel(k) {
  return (PROBLEM_TYPES.find((t) => t.key === k) || {}).label || k;
}
function prLabel(k) {
  return (PRIORITIES.find((t) => t.key === k) || {}).label || k;
}
function stLabel(k) {
  return (STATUSES.find((t) => t.key === k) || {}).label || k;
}

/** Builds the initial reference/configuration data (buildings, locations,
 * device catalogue, technicians, employees, admin, settings). This mirrors
 * exactly what already existed as the project's structural configuration —
 * it is not new demo/mock data, and it excludes any report/notification
 * history. */
function buildInitialConfig() {
 
    const buildings = [
    { id: 'B1', name: 'المبنى الرئيسي' },
  ];
   const locations = [
    { id: 'HALL-A', name: 'قاعة A', buildingId: 'B1', floor: 1, type: 'room' },
    { id: 'HALL-B', name: 'قاعة B', buildingId: 'B1', floor: 1, type: 'room' },
    { id: 'HALL-C', name: 'قاعة C', buildingId: 'B1', floor: 1, type: 'room' },
    { id: 'HALL-D', name: 'قاعة D', buildingId: 'B1', floor: 1, type: 'room' },
    { id: 'ADMIN-OFFICE', name: 'مكتب الإدارة', buildingId: 'B1', floor: 2, type: 'room' },
    { id: 'STAFF-OFFICE', name: 'مكتب الموظفات', buildingId: 'B1', floor: 2, type: 'room' },
    { id: 'RECEPTION', name: 'الاستقبال', buildingId: 'B1', floor: 1, type: 'room' },
    { id: 'STUDENTS-HALL', name: 'قاعة الطالبات', buildingId: 'B1', floor: 1, type: 'room' },
  ];

const deviceTypes = ['الإضاءة', 'مكيف', 'جهاز مكتبي', 'كيبورد', 'ماوس', 'لوحة الماوس', 'المعالج', 'الشبكة والإنترنت'];
  const brands = ['Dell', 'HP', 'Lenovo', 'Epson', 'Cisco', 'Midea'];
  const devices = [];
  let dNum = 1;
  locations.forEach((loc) => {
    const count = 3; // ~30 devices total across 10 locations (same catalogue as before)
    for (let i = 0; i < count; i++) {
      const id = 'PC-' + pad(dNum, 3);
      devices.push({
        id,
        name: deviceTypes[dNum % deviceTypes.length],
        type: 'computer',
        locationId: loc.id,
        brand: brands[dNum % brands.length],
        model: 'MDL-' + (2000 + dNum),
        serial: 'SN' + (100000 + dNum),
        status: ['working', 'working', 'working', 'needs_maintenance', 'out_of_order'][dNum % 5],
      });
      dNum++;
    }
  });

  const technicians = [
    { id: 'T1', name: 'خالد المطيري', email: 'technician@example.com', role: 'technician', specialties: ['device', 'network'] },
    { id: 'T2', name: 'سعيد القحطاني', email: 'technician2@example.com', role: 'technician', specialties: ['ac', 'electricity', 'plumbing'] },
  ];  
  const employees = [
    { id: 'E1', name: 'رباب الهلال', email: 'employee1@example.com', role: 'employee' },
    { id: 'E2', name: 'اريج الراشد', email: 'employee2@example.com', role: 'employee' },
    { id: 'E3', name: 'بيان العزيب', email: 'employee3@example.com', role: 'employee' },
    { id: 'E4', name: 'رحمه البلادي', email: 'employee4@example.com', role: 'employee' },
    { id: 'E5', name: 'نورا الحرز', email: 'employee5@example.com', role: 'employee' },
    { id: 'E6', name: 'هيا الكرود', email: 'employee6@example.com', role: 'employee' },
    { id: 'E7', name: 'داوود الخزعل', email: 'employee7@example.com', role: 'employee' },
    { id: 'E8', name: 'حسين الحربي', email: 'employee8@example.com', role: 'employee' },
    { id: 'E9', name: 'احمد المشعل', email: 'employee9@example.com', role: 'employee' },
  ];
  const admin = { id: 'A1', name: 'جواهر الجريش', email: 'admin@example.com', role: 'admin' };

  const settings = {
    escalationHours: 24,
    facilityName: 'المعهد الوطني للرواد للتدريب العالي',
    facilityNameEn: 'Al Ruwad National Higher Training Institute',
    notificationsEnabled: true,
  };

  return { buildings, locations, devices, technicians, employees, admin, settings };
}

// Admin password lives only as a server-side constant (no database), and can
// be overridden with an environment variable for real deployments.
const bcrypt = require('bcryptjs');
const ADMIN_PASSWORD_PLAIN = process.env.SQRM_ADMIN_PASSWORD || 'Admin@2026';
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(ADMIN_PASSWORD_PLAIN, 10);
const store = {
  ...buildInitialConfig(),
  reports: [],
  notifications: [],
};

function resetOperational() {
  // Restores everything (reference config + clears transactional data) back
  // to the initial state. Admin credentials are unaffected (server config).
  const fresh = buildInitialConfig();
  store.buildings = fresh.buildings;
  store.locations = fresh.locations;
  store.devices = fresh.devices;
  store.technicians = fresh.technicians;
  store.employees = fresh.employees;
  store.admin = fresh.admin;
  store.settings = fresh.settings;
  store.reports = [];
  store.notifications = [];
}

function nextReportNumber() {
  const year = new Date().getFullYear();
  const countThisYear = store.reports.filter((r) => r.number.includes('-' + year + '-')).length;
  return 'REQ-' + year + '-' + pad(countThisYear + 1, 5);
}

function pushNotification(type, text) {
  store.notifications.unshift({ id: uid('nt'), type, text, at: new Date().toISOString(), read: false });
  if (store.notifications.length > 40) store.notifications.length = 40;
}

function isOverdue(report, settings) {
  if (report.status === 'resolved' || report.status === 'closed') return false;
  const hours = (new Date() - new Date(report.createdAt)) / 36e5;
  return hours > settings.escalationHours;
}

module.exports = {
  store,
  uid,
  pad,
  ADMIN_PASSWORD_HASH,  PROBLEM_TYPES,
  PRIORITIES,
  STATUSES,
  DEVICE_STATUSES,
  PROBLEM_TYPE_KEYS,
  PRIORITY_KEYS,
  STATUS_KEYS,
  typeLabel,
  prLabel,
  stLabel,
  nextReportNumber,
  pushNotification,
  isOverdue,
  resetOperational,
};
