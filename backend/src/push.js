/**
 * Browser push notifications for the admin, so a new report reaches the
 * admin's device even if the site tab isn't open (as long as the browser
 * itself is running and notification permission was granted once).
 *
 * No database: subscriptions live in memory only, exactly like the rest of
 * the store (store.js). This means they are lost on server restart — the
 * frontend re-subscribes silently on every admin page load when permission
 * was already granted, so this self-heals without bothering the admin.
 *
 * VAPID keys default to a fixed pair for local/dev use and can be
 * overridden with SQRM_VAPID_PUBLIC_KEY / SQRM_VAPID_PRIVATE_KEY env vars
 * for a real deployment (the keys just identify this server to push
 * services — they are not secrets tied to any user data).
 */
const webpush = require('web-push');

const VAPID_PUBLIC_KEY =
  process.env.SQRM_VAPID_PUBLIC_KEY ||
  'BEdBartbrQ5YhD6HNhx9nELvxXUhiomUMYV12cnk4c5VDzZOEZ_ZdDZUbrhrDgphc_FFhtmzOvkQfVcCzfZu2Us';
const VAPID_PRIVATE_KEY =
  process.env.SQRM_VAPID_PRIVATE_KEY || 'e1GBptgwvXYeelnvzZiGmjlBJE1potrrKDbphpN4dUo';

webpush.setVapidDetails('mailto:admin@example.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// In-memory subscriptions, keyed by endpoint (each browser/device that
// enabled notifications gets one entry).
const subscriptions = new Map();

function addSubscription(sub) {
  if (!sub || !sub.endpoint) return;
  subscriptions.set(sub.endpoint, sub);
}

function removeSubscription(endpoint) {
  subscriptions.delete(endpoint);
}

async function notifyAdmins(payload) {
  const body = JSON.stringify(payload);
  const sends = Array.from(subscriptions.values()).map((sub) =>
    webpush.sendNotification(sub, body).catch((err) => {
      // 404/410 = the subscription is gone (browser data cleared, etc.) —
      // drop it so we stop trying. Other errors are logged but ignored so
      // one bad subscription never blocks the report from being created.
      if (err && (err.statusCode === 404 || err.statusCode === 410)) {
        removeSubscription(sub.endpoint);
      } else {
        console.error('push send failed:', err && err.message); // eslint-disable-line no-console
      }
    })
  );
  await Promise.all(sends);
}

module.exports = { VAPID_PUBLIC_KEY, addSubscription, removeSubscription, notifyAdmins };
