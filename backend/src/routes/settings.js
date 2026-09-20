const express = require('express');
const { store } = require('../store');
const { requireString, requireInt } = require('../validators');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ ...store.settings, adminEmail: store.admin.email });
});

router.put('/', (req, res) => {
  const body = req.body || {};
  const facilityName = requireString(body.facilityName, 'اسم المنشأة (عربي)', { maxLen: 200 });
  const facilityNameEn = requireString(body.facilityNameEn, 'اسم المنشأة (English)', { maxLen: 200 });
  const escalationHours = requireInt(body.escalationHours, 'مدة تصعيد البلاغ المتأخر', { min: 1, max: 24 * 30 });

  store.settings.facilityName = facilityName;
  store.settings.facilityNameEn = facilityNameEn;
  store.settings.escalationHours = escalationHours;

  res.json({ ...store.settings, adminEmail: store.admin.email });
});

module.exports = router;
