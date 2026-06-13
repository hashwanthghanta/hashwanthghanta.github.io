/* ============================================================
   KILL-SWITCH service worker.
   The old portfolio registered a cache-first SW ("hg-portfolio-v3")
   that cached files which no longer exist (app.js, styles.css, the
   old index.html). That stale cache broke the rebuilt site.
   This replacement deletes every cache, unregisters itself, and
   reloads open tabs so visitors get the fresh, un-cached site.
   The browser always revalidates sw.js on navigation, so this
   propagates even to clients still controlled by the old worker.
============================================================ */
self.addEventListener('install', function () {
    self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    event.waitUntil((async function () {
        try {
            const keys = await caches.keys();
            await Promise.all(keys.map(function (k) { return caches.delete(k); }));
        } catch (e) {}
        try { await self.registration.unregister(); } catch (e) {}
        try {
            const clients = await self.clients.matchAll({ type: 'window' });
            clients.forEach(function (c) { try { c.navigate(c.url); } catch (e) {} });
        } catch (e) {}
    })());
});

/* No fetch handler — let everything go straight to the network. */
