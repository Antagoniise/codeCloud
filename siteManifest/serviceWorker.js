const CACHE_VERSION = 3;
const globalCache = `my-awesome-pwa-cache-v${CACHE_VERSION}`;

const debugScripts = 'https://dev.wuaze.com/javaScript/dev.js';
const debugCSS = 'https://dev.wuaze.com/styleSheets/dev.css';

const networkFailedURL = 'https://dev.wuaze.com/siteManifest/OFFLine.html';

const coreAssets = [
    'https://dev.wuaze.com/',
    'https://dev.wuaze.com/core.css',
    'https://dev.wuaze.com/javaScript/global.js',
    'https://dev.wuaze.com/javaScript/miscellaneous.js',
    'https://dev.wuaze.com/siteManifest/manifest.json',
    networkFailedURL,
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(globalCache)
            .then(cache => {
                return cache.addAll(coreAssets);
            })
            .then(() => {
                return self.skipWaiting();
            })
            .catch(error => {
                console.error(`[Service Worker V${CACHE_VERSION}] Precaching failed:`, error);
            })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.filter(cacheName =>
                        cacheName !== globalCache && cacheName.startsWith('my-awesome-pwa-cache-v')
                    ).map(cacheName => caches.delete(cacheName))
                );
            })
            .then(() => {
                return self.clients.claim();
            })
            .catch(error => {
                console.error(`[Service Worker V${CACHE_VERSION}] Activation failed:`, error);
            })
    );
});

self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);

    // For debug assets, always go network-only with no caching
    if (requestUrl.href === debugScripts || requestUrl.href === debugCSS) {
        event.respondWith(
            fetch(event.request, { cache: 'no-store' })
                .catch(error => {
                    console.error(`[Service Worker V${CACHE_VERSION}] Network fetch failed for ${requestUrl.pathname}:`, error);
                    return new Response(`Network error: Could not fetch ${requestUrl.pathname}. Please check your connection.`, {
                        status: 503,
                        statusText: 'Service Unavailable',
                        headers: { 'Content-Type': 'text/plain' }
                    });
                })
        );
        return;
    }

    // Skip non-GET requests or extension protocols
    if (event.request.method !== 'GET' || requestUrl.protocol.startsWith('chrome-extension')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // For navigation requests (HTML pages)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then(networkResponse => {
                    if (networkResponse && networkResponse.ok) {
                        const responseToCache = networkResponse.clone();
                        caches.open(globalCache)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            })
                            .catch(err => {
                                console.error(`[Service Worker V${CACHE_VERSION}] Cache error:`, err);
                            });
                    }
                    return networkResponse;
                })
                .catch(() => {
                    return caches.match(event.request)
                        .then(cachedResponse => {
                            if (cachedResponse) {
                                return cachedResponse;
                            }
                            // If no cached version of the page is available, show offline page
                            return caches.match(networkFailedURL);
                        });
                })
        );
        return;
    }

    // For all other requests, use cache-first strategy
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    // Return cached response immediately
                    return cachedResponse;
                }

                // If not in cache, fetch from network
                return fetch(event.request)
                    .then(networkResponse => {
                        if (!networkResponse || !networkResponse.ok) {
                            throw new Error(`Network response was not ok: ${networkResponse.status}`);
                        }

                        // Clone the response before using it
                        const responseToCache = networkResponse.clone();

                        // Cache the successful response
                        caches.open(globalCache)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            })
                            .catch(err => {
                                console.error(`[Service Worker V${CACHE_VERSION}] Cache error for ${requestUrl.pathname}:`, err);
                            });

                        return networkResponse;
                    })
                    .catch(error => {
                        console.error(`[Service Worker V${CACHE_VERSION}] Fetch error for ${requestUrl.pathname}:`, error);

                        // Return a custom error response when network request fails
                        return new Response(`Resource unavailable: ${requestUrl.pathname}`, {
                            status: 404,
                            statusText: 'Not Found',
                            headers: { 'Content-Type': 'text/plain' }
                        });
                    });
            })
    );
});

self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
