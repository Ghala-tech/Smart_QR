/* Service worker for Smart QR Maintenance — only handles push notifications
 * (new report alerts for the admin) and opening/focusing the site when a
 * notification is clicked. It does not cache anything or work offline. */

self.addEventListener('push', function (event) {
  let data = { title: 'بلاغ جديد', body: 'يوجد بلاغ جديد في النظام', url: '/#/admin' };
  try {
    if (event.data) data = Object.assign(data, event.data.json());
  } catch (e) {
    /* ignore malformed payloads */
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: undefined,
      data: { url: data.url || '/#/admin' },
      dir: 'rtl',
      lang: 'ar',
    })
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/#/admin';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate ? client.navigate(targetUrl) : null;
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
