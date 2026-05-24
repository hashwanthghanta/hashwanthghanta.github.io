const CACHE_NAME = 'hg-portfolio-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/now.html',
    '/now-de.html',
    '/uses.html',
    '/uses-de.html',
    '/projects/co2-simulation.html',
    '/projects/co2-simulation-de.html',
    '/projects/stockwatch.html',
    '/projects/stockwatch-de.html',
    '/projects/iot-helmet.html',
    '/projects/iot-helmet-de.html',
    '/manifest.webmanifest',
    '/Images/hash.jpeg',
    '/Images/favicon/icon-16.png',
    '/Images/favicon/icon-32.png',
    '/Images/favicon/icon-180.png',
    '/Images/favicon/icon-192.png',
    '/Images/favicon/icon-512.png',
    '/Images/co2-simulation.gif',
    '/Images/co2-preview.jpg',
    '/Images/stockwatch-thumb-sm.jpg',
    '/Images/v6_grid_dark-sm.jpg'
];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', e => {
    // Only cache GET requests (ignore chrome-extension URLs and POST submissions)
    if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) {
        return;
    }
    e.respondWith(
        caches.match(e.request).then(cachedResponse => {
            if (cachedResponse) {
                // Return cached response, fetch update in background
                fetch(e.request).then(networkResponse => {
                    if (networkResponse.status === 200) {
                        caches.open(CACHE_NAME).then(cache => cache.put(e.request, networkResponse));
                    }
                }).catch(() => {}); // ignore network failures
                return cachedResponse;
            }
            return fetch(e.request).then(networkResponse => {
                if (networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(e.request, responseClone));
                }
                return networkResponse;
            });
        })
    );
});
