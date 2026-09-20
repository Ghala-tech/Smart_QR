const express = require('express');
const { store, resetOperational } = require('../store');
const { requireString, optionalString, requireInt } = require('../validators');

const router = express.Router();

/**
 * POST /api/admin/reset-operational
 * Clears all reports/notifications and restores the reference/config data
 * (buildings, locations, devices, technicians, employees, settings) back to
 * its initial state. No database involved — this simply rebuilds the
 * in-memory store. Intended to back the admin settings page's
 * "إعادة تعيين البيانات التشغيلية" action.
 */
router.post('/reset-operational', (req, res) => {
  resetOperational();
  res.json({ ok: true });
});

module.exports = router;
