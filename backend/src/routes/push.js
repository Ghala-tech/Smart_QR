const express = require('express');
const { VAPID_PUBLIC_KEY, addSubscription, removeSubscription } = require('../push');
const { requireString } = require('../validators');
const { ApiError } = require('../errors');

const router = express.Router();

router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

router.post('/subscribe', (req, res) => {
  const sub = req.body || {};
  if (!sub.endpoint || !sub.keys || !sub.keys.auth || !sub.keys.p256dh) {
    throw new ApiError(400, 'بيانات الاشتراك بالإشعارات غير صالحة.');
  }
  addSubscription(sub);
  res.status(201).json({ ok: true });
});

router.post('/unsubscribe', (req, res) => {
  const endpoint = requireString((req.body || {}).endpoint, 'endpoint', { maxLen: 2000 });
  removeSubscription(endpoint);
  res.json({ ok: true });
});

module.exports = router;
