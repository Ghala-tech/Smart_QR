const express = require('express');
const { store, ADMIN_PASSWORD } = require('../store');
const { requireString, requireEnum } = require('../validators');
const { ApiError } = require('../errors');

const router = express.Router();

/**
 * Staff login for employees and technicians: no password, matching the
 * project's original mock-auth design (pick your name from a list). The
 * backend is still the source of truth — it validates the id actually
 * exists for the chosen role, and is the seam to swap in real
 * password/JWT-based auth later without touching the frontend's call site.
 */
router.post('/staff-login', (req, res) => {
  const body = req.body || {};
  const role = requireEnum(body.role, ['employee', 'technician'], 'نوع الحساب');
  const id = requireString(body.id, 'الاسم');

  const list = role === 'technician' ? store.technicians : store.employees;
  const user = list.find((p) => p.id === id);
  if (!user) throw new ApiError(404, 'المستخدم غير موجود.');

  res.json({ ...user, role });
});

/**
 * Admin login requires an email + password. The password is a server-side
 * constant/env var (SQRM_ADMIN_PASSWORD) since there is no database.
 */
router.post('/admin-login', (req, res) => {
  const body = req.body || {};
  const email = requireString(body.email, 'البريد الإلكتروني', { maxLen: 200 });
  const password = requireString(body.password, 'كلمة المرور', { maxLen: 200 });

  if (email.toLowerCase() !== store.admin.email.toLowerCase() || password !== ADMIN_PASSWORD) {
    throw new ApiError(401, 'البريد الإلكتروني أو كلمة المرور غير صحيحة.');
  }

  res.json({ ...store.admin, role: 'admin' });
});

module.exports = router;
