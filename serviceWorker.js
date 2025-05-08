// GitHub Clone PWA - Advanced Service Worker
// Version: 1.0.0

const CACHE_NAME = 'github-clone-cache-v1';
const NEVER_CACHE = [
  /index\.html$/,
  /\.js$/
];

// Assets to cache immediately on service worker installation
const PRECACHE_ASSETS = [
  '/offline.html',
  '/styles/main.css',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - Precache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper function to determine if a request should never be cached
function shouldNeverCache(url) {
  const requestUrl = new URL(url);
  return NEVER_CACHE.some(pattern => pattern.test(requestUrl.pathname));
}

// Fetch event - Network-first strategy for HTML/JS, Cache-first for other assets
self.addEventListener('fetch', (event) => {
  event.respondWith(
    (async () => {
      const url = new URL(event.request.url);
      
      // Skip cross-origin requests
      if (url.origin !== self.location.origin) {
        return fetch(event.request);
      }
      
      // For HTML and JS files - Always fetch from network with no-cache
      if (shouldNeverCache(event.request.url)) {
        try {
          // Use no-cache fetch options to ensure fresh content
          const fetchOptions = {
            method: event.request.method,
            headers: {
              ...Object.fromEntries(event.request.headers),
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            },
            cache: 'no-store'
          };
          
          // Clone the request to avoid consuming it
          const response = await fetch(event.request.clone(), fetchOptions);
          
          // If successful, return the network response
          if (response && response.status === 200) {
            return response;
          }
          
          throw new Error('Network fetch failed for never-cache resource');
        } catch (error) {
          console.error('Failed to fetch never-cache resource:', error);
          
          // For HTML, try to return cached offline page
          if (event.request.destination === 'document') {
            const cache = await caches.open(CACHE_NAME);
            return cache.match('/offline.html');
          }
          
          // For other failures, return a basic error
          return new Response('Network fetch failed', { 
            status: 408, 
            headers: { 'Content-Type': 'text/plain' } 
          });
        }
      }
      
      // For other assets (CSS, images) - Try cache first, then network
      try {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // If not in cache, fetch from network
        const networkResponse = await fetch(event.request);
        
        // Cache the response for future use (if it's valid)
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, networkResponse.clone());
        }
        
        return networkResponse;
      } catch (error) {
        console.error('Cache/network fetch error:', error);
        
        // Return fallback content for images
        if (event.request.destination === 'image') {
          return caches.match('/icons/offline-image.png');
        }
        
        // No fallback available
        return new Response('Resource unavailable', { 
          status: 404, 
          headers: { 'Content-Type': 'text/plain' } 
        });
      }
    })()
  );
});

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

// Synchronize data in the background
async function syncData() {
  try {
    const db = await openDatabase();
    const pendingActions = await db.getAll('pending-actions');
    
    for (const action of pendingActions) {
      try {
        await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        });
        
        // Remove from pending if successful
        await db.delete('pending-actions', action.id);
      } catch (error) {
        console.error('Failed to sync action:', error);
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// Helper function to open IndexedDB
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('github-clone-db', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-actions')) {
        db.createObjectStore('pending-actions', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/notification-badge.png',
      data: data.data
    })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// Periodic background sync for content updates
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-content') {
    event.waitUntil(updateContent());
  }
});

// Update content in the background
async function updateContent() {
  try {
    // Fetch any updated content from the server
    const response = await fetch('/api/updates');
    if (response.ok) {
      const updates = await response.json();
      
      // Process updates
      if (updates.needsRefresh) {
        // Notify any open clients
        const clients = await self.clients.matchAll({ type: 'window' });
        clients.forEach(client => {
          client.postMessage({
            type: 'CONTENT_UPDATE',
            updates: updates.summary
          });
        });
      }
    }
  } catch (error) {
    console.error('Failed to check for updates:', error);
  }
}