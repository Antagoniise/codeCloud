const CACHE_NAME = 'offline-cache-v1';
const DATA_CACHE_NAME = 'data-cache-v1';

/**
 * Files to cache during the installation of the Service Worker.
 * These are essential files that are required for the application to function offline.
 */
const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/favicon.ico',
    '/images/logo.png',
    '/images/icons/icon-192x192.png',
    '/images/icons/icon-512x512.png',
    // Add additional assets to cache here
];

/**
 * Install Event
 *
 * This event is fired when the Service Worker is first installed.
 * It is used to cache the essential application shell files required for offline functionality.
 */
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Install');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching app shell');
                return cache.addAll(FILES_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

/**
 * Activate Event
 *
 * This event is fired when the Service Worker is activated.
 * It is used to clean up any old caches that are no longer needed.
 */
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activate');
    event.waitUntil(
        caches.keys()
            .then((keyList) => {
                return Promise.all(keyList.map((key) => {
                    if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                        console.log('[Service Worker] Removing old cache:', key);
                        return caches.delete(key);
                    }
                }));
            })
            .then(() => self.clients.claim())
    );
});

/**
 * Fetch Event
 *
 * This event is fired for every network request made by the application.
 * It is used to serve cached content when offline and to manage dynamic caching.
 */
self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('/api/')) {
        // Handle API requests with network-first strategy
        event.respondWith(
            caches.open(DATA_CACHE_NAME).then((cache) => {
                return fetch(event.request)
                    .then((response) => {
                        // If the response is good, clone it and store it in the cache.
                        if (response.status === 200) {
                            cache.put(event.request.url, response.clone());
                        }
                        return response;
                    })
                    .catch(() => {
                        // If the network request failed, try to get it from the cache.
                        return cache.match(event.request);
                    });
            })
        );
        return;
    }

    // Handle non-API requests with cache-first strategy
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                return response || fetch(event.request);
            })
    );
});

/**
 * Push Event
 *
 * This event is fired when a push notification is received.
 * It is used to display notifications to the user.
 */
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push Received.');
    console.log(`[Service Worker] Push Data: "${event.data.text()}"`);

    let notificationData = {};

    try {
        notificationData = event.data.json();
    } catch (e) {
        notificationData = {
            title: 'Default Title',
            body: event.data.text(),
            icon: '/images/icons/icon-192x192.png',
            badge: '/images/icons/badge-72x72.png'
        };
    }

    const title = notificationData.title || 'Notification';
    const options = {
        body: notificationData.body || 'You have a new notification.',
        icon: notificationData.icon || '/images/icons/icon-192x192.png',
        badge: notificationData.badge || '/images/icons/badge-72x72.png',
        data: notificationData.url || '/',
        actions: notificationData.actions || [
            { action: 'open', title: 'Open App' },
            { action: 'dismiss', title: 'Dismiss' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

/**
 * Notification Click Event
 *
 * This event is fired when the user interacts with a notification (e.g., clicks on it).
 * It is used to perform actions based on the user's interaction.
 */
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification click Received.');

    event.notification.close();

    // Handle the action the user clicked on
    if (event.action === 'open') {
        event.waitUntil(
            clients.openWindow(event.notification.data)
        );
    } else {
        // Handle other actions (e.g., 'dismiss')
        // Additional actions can be added here
    }
});

/**
 * Sync Event
 *
 * This event is fired when the browser determines that connectivity has been
 * re-established, allowing the Service Worker to perform background synchronization.
 */
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Sync Event:', event.tag);
    if (event.tag === 'offline-sync') {
        event.waitUntil(performOfflineSync());
    }
});

/**
 * Periodic Sync Event
 *
 * This event is fired periodically, allowing the Service Worker to perform regular background tasks.
 * Note: Periodic Sync requires user permission and is currently supported in some browsers.
 */
self.addEventListener('periodicsync', (event) => {
    console.log('[Service Worker] Periodic Sync Event:', event.tag);
    if (event.tag === 'background-data-sync') {
        event.waitUntil(performPeriodicSync());
    }
});

/**
 * Perform Offline Synchronization
 *
 * This function handles the synchronization of data that was collected while offline.
 * It sends the stored data to the server when connectivity is restored.
 *
 * @returns {Promise<void>} A promise that resolves when synchronization is complete.
 */
async function performOfflineSync() {
    try {
        // Retrieve stored data from IndexedDB or another storage mechanism
        const storedData = await getStoredData();

        if (storedData.length === 0) {
            console.log('[Service Worker] No data to sync.');
            return;
        }

        // Send the stored data to the server
        const response = await fetch('/api/sync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(storedData)
        });

        if (response.ok) {
            console.log('[Service Worker] Offline data synced successfully.');
            // Clear the stored data after successful sync
            await clearStoredData();
        } else {
            console.error('[Service Worker] Server responded with an error during sync.');
        }
    } catch (error) {
        console.error('[Service Worker] Sync failed:', error);
    }
}

/**
 * Perform Periodic Synchronization
 *
 * This function performs regular background tasks, such as fetching updates from the server.
 *
 * @returns {Promise<void>} A promise that resolves when the periodic sync is complete.
 */
async function performPeriodicSync() {
    try {
        // Fetch the latest data from the server
        const response = await fetch('/api/data');
        const data = await response.json();

        // Cache the fetched data or perform necessary actions with it
        const cache = await caches.open(DATA_CACHE_NAME);
        await cache.put('/api/data', new Response(JSON.stringify(data)));

        console.log('[Service Worker] Periodic sync completed successfully.');
    } catch (error) {
        console.error('[Service Worker] Periodic sync failed:', error);
    }
}

/**
 * Initialize Periodic Sync
 *
 * This function registers a periodic sync with a specific tag.
 * It should be called from the main application script after obtaining user permission.
 */
async function initializePeriodicSync() {
    if ('periodicSync' in registration) {
        try {
            await registration.periodicSync.register('background-data-sync', {
                minInterval: 24 * 60 * 60 * 1000, // 1 day
            });
            console.log('[Service Worker] Periodic Sync registered successfully.');
        } catch (error) {
            console.error('[Service Worker] Periodic Sync registration failed:', error);
        }
    } else {
        console.warn('[Service Worker] Periodic Sync is not supported by this browser.');
    }
}

/**
 * Store Data for Offline Use
 *
 * This function stores data that needs to be synced when the user is back online.
 * It uses IndexedDB for storage, but can be adapted to use other storage mechanisms.
 *
 * @param {Object} data - The data to be stored for later synchronization.
 * @returns {Promise<void>} A promise that resolves when the data is stored.
 */
async function storeDataForSync(data) {
    // Implementation for storing data (e.g., using IndexedDB)
    // Placeholder function - implement as needed
    console.log('[Service Worker] Storing data for offline sync:', data);
    // Example: await addToIndexedDB(data);
}

/**
 * Retrieve Stored Data
 *
 * This function retrieves data that was stored for offline synchronization.
 *
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of stored data objects.
 */
async function getStoredData() {
    // Implementation for retrieving stored data (e.g., using IndexedDB)
    // Placeholder function - implement as needed
    console.log('[Service Worker] Retrieving stored data for sync.');
    return []; // Return the retrieved data
}

/**
 * Clear Stored Data After Sync
 *
 * This function clears the stored data after successful synchronization.
 *
 * @returns {Promise<void>} A promise that resolves when the data is cleared.
 */
async function clearStoredData() {
    // Implementation for clearing stored data (e.g., using IndexedDB)
    // Placeholder function - implement as needed
    console.log('[Service Worker] Clearing stored data after sync.');
    // Example: await clearIndexedDB();
}

/**
 * Listen for Messages from the Main Thread
 *
 * This event listener listens for messages sent from the main application thread.
 * It is used to trigger actions such as initializing periodic sync.
 */
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'INIT_PERIODIC_SYNC') {
        initializePeriodicSync();
    }
});





/***


importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.6.1/workbox-sw.js');

const CACHE = "myBeatsCache-v1";
const offlineFallbackPage = "/specialPages/offlineContent/afterHours/index.html";



self.addEventListener('install', (event) => {
    console.log('Service Worker Installed');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker Activated');
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientsArr) => {
            const hadWindow = clientsArr.some((windowClient) => windowClient.url === '/' && windowClient.focus());
            if (!hadWindow) clients.openWindow('/');
        })
    );
});



// Skip waiting when receiving the "SKIP_WAITING" message
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Cache the offline fallback page on install
self.addEventListener('install', async (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.add(offlineFallbackPage))
  );
});

// Enable navigation preload
if (workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}

// Cache MP3 and MP4 files with a max size of 30 MB
workbox.routing.registerRoute(
  new RegExp('.*\\.(?:mp3|mp4)'),
  new workbox.strategies.CacheFirst({
    cacheName: 'media-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50, // Limit to 50 entries
        maxAgeSeconds: 30 * 24 * 60 * 60, // Cache for 30 days
        purgeOnQuotaError: true // Purge old entries when cache quota is reached
      }),
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [0, 200]
      })
    ]
  })
);

// Cache CSS and JavaScript files
workbox.routing.registerRoute(
  new RegExp('.*\\.(?:css|js)'),
  new workbox.strategies.StaleWhileRevalidate()
);

// Offline fallback for HTML pages
workbox.routing.registerRoute(
  new RegExp('.*\\.html'),
  new workbox.strategies.NetworkFirst({
    cacheName: 'page-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 20, // Limit to 20 entries
        maxAgeSeconds: 7 * 24 * 60 * 60, // Cache for 7 days
      })
    ]
  })
);

// Fetch the latest content when the app comes online
self.addEventListener('sync', (event) => {
  if (event.tag === 'fetch-new-content') {
    event.waitUntil(
      fetch('/api/update-content') // Replace with your actual API endpoint
        .then((response) => {
          // Handle the new content as needed (e.g., update the cache)
        })
        .catch((error) => {
          console.error('Error fetching new content:', error);
        })
    );
  }
});

// Register periodic sync (adjust interval as needed)
self.registration.periodicSync.register('fetch-new-content', {
  minInterval: 24 * 60 * 60 * 1000, // 24 hours
});
***/