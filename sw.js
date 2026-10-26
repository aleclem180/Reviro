// Reviro · service worker: solo para mostrar los avisos (notificaciones) y abrir la página al tocarlos.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const go = (e.notification.data || {}).go || '';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
    for (const c of cs) { if ('focus' in c) { c.postMessage({ go }); return c.focus(); } }
    const url = go.startsWith('t:') ? 'torneo?id=' + go.slice(2) : './';
    return self.clients.openWindow(url);
  }));
});
