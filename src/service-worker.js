self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  clients.openWindow('/');
});