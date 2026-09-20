const express = require('express');
const { store } = require('../store');
const { requireString, requireInt } = require('../validators');
const { ApiError } = require('../errors');

const router = express.Router();

router.get('/', (req, res) => {
  const { buildingId } = req.query;
  let list = store.locations;
  if (buildingId) list = list.filter((l) => l.buildingId === buildingId);
  res.json(list);
});

router.post('/', (req, res) => {
  const body = req.body || {};
  const id = requireString(body.id, 'رمز الموقع', { maxLen: 40 }).toUpperCase();
  const name = requireString(body.name, 'اسم الموقع', { maxLen: 200 });
  const buildingId = requireString(body.buildingId, 'المبنى', { maxLen: 40 });
  const floor = requireInt(body.floor, 'الطابق', { min: 0, max: 200 });
  const type = body.type === 'lab' ? 'lab' : 'room';

  if (store.locations.some((l) => l.id === id)) {
    throw new ApiError(409, 'رمز الموقع مستخدم مسبقًا.');
  }
  if (!store.buildings.some((b) => b.id === buildingId)) {
    throw new ApiError(400, 'المبنى المحدد غير موجود.');
  }

  const location = { id, name, buildingId, floor, type };
  store.locations.push(location);
  res.status(201).json(location);
});

module.exports = router;
