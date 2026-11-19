/*
 * Service worker de VHOA : affiche les notifications du site (Web Push) et ouvre la bonne page
 * au clic. Il ne met rien en cache (le site reste toujours à jour).
 */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'VHOA';
  // Seuls les chemins du site sont acceptés comme destination.
  const url = typeof data.url === 'string' && data.url.startsWith('/') && !data.url.startsWith('//') ? data.url : '/alertes';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: '/icon.png',
      badge: '/icon.png',
      lang: 'fr',
      data: { url },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || '/alertes', self.location.origin).href;
  event.waitUntil(
    (async () => {
      const tabs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      // Un onglet VHOA est déjà ouvert : on l'amène au premier plan sur la bonne page.
      for (const tab of tabs) {
        if (new URL(tab.url).origin === self.location.origin && 'focus' in tab) {
          await tab.focus();
          if ('navigate' in tab) await tab.navigate(url);
          return;
        }
      }
      await self.clients.openWindow(url);
    })(),
  );
});
