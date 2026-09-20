const express = require('express');
const { store } = require('../store');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(store.notifications);
});

router.post('/mark-all-read', (req, res) => {
  store.notifications.forEach((n) => (n.read = true));
  res.json(store.notifications);
});

module.exports = router;
