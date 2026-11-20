// PentHouse AK37 Web Push Service Worker v2
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (err) {
    data = {
      title: 'PentHouse AK37',
      body: event.data ? event.data.text() : 'New transaction logged',
    };
  }

  const title = data.title || 'PentHouse AK37';
  const options = {
    body: data.body || 'A new transaction was logged in your ledger.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || `ak37-${Date.now()}`,
    renotify: true,
    data: {
      url: data.url || '/',
    },
    vibrate: [150, 80, 150],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
