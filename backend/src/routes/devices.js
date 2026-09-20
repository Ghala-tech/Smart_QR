const express = require('express');
const { store, DEVICE_STATUSES } = require('../store');
const { requireString, requireEnum, optionalString } = require('../validators');
const { ApiError } = require('../errors');

const router = express.Router();

router.get('/', (req, res) => {
  const { locationId } = req.query;
  let list = store.devices;
  if (locationId) list = list.filter((d) => d.locationId === locationId);
  res.json(list);
});

router.post('/', (req, res) => {
  const body = req.body || {};
  const id = requireString(body.id, 'رمز الجهاز', { maxLen: 40 }).toUpperCase();
  const name = requireString(body.name, 'اسم الجهاز', { maxLen: 200 });
  const locationId = requireString(body.locationId, 'الموقع', { maxLen: 40 });
  const brand = optionalString(body.brand, 'الشركة المصنعة', { maxLen: 120 });
  const model = optionalString(body.model, 'الموديل', { maxLen: 120 });
  const serial = optionalString(body.serial, 'الرقم التسلسلي', { maxLen: 120 });

  if (store.devices.some((d) => d.id === id)) {
    throw new ApiError(409, 'رمز الجهاز مستخدم مسبقًا.');
  }
  if (!store.locations.some((l) => l.id === locationId)) {
    throw new ApiError(400, 'الموقع المحدد غير موجود.');
  }

  const device = { id, name, type: 'computer', locationId, brand, model, serial, status: 'working' };
  store.devices.push(device);
  res.status(201).json(device);
});

router.patch('/:id/status', (req, res) => {
  const device = store.devices.find((d) => d.id === req.params.id);
  if (!device) throw new ApiError(404, 'الجهاز غير موجود.');
  const status = requireEnum((req.body || {}).status, DEVICE_STATUSES, 'حالة الجهاز');
  device.status = status;
  res.json(device);
});

module.exports = router;
