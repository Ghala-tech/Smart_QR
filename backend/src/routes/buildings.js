const express = require('express');
const { store } = require('../store');
const { requireString } = require('../validators');
const { ApiError } = require('../errors');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(store.buildings);
});

router.post('/', (req, res) => {
  const body = req.body || {};
  const id = requireString(body.id, 'رمز المبنى', { maxLen: 40 }).toUpperCase();
  const name = requireString(body.name, 'اسم المبنى', { maxLen: 200 });

  if (store.buildings.some((b) => b.id === id)) {
    throw new ApiError(409, 'رمز المبنى مستخدم مسبقًا.');
  }

  const building = { id, name };
  store.buildings.push(building);
  res.status(201).json(building);
});

module.exports = router;
