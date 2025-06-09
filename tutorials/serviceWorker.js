if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}



const siteCache = 'wuaze-pwa-v1.2.3';
const runTimeCache = 'wuaze-runtime-v1.2.3';
const staticContent = 'wuaze-static-v1.2.3';

// Files to NEVER cache (always fetch fresh)
const NEVER_CACHE = [
    './index.html'
    './styles.css',
    './script.js',
    '/gitHub/styles.css',
    '/gitHub/script.js'
];

// Critical files to cache for offline functionality
const STATIC_ASSETS = [
    './manifest.json',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png',
    './icons/icon-maskable-192x192.png',
    './offline.html'
];

// Dynamic cache patterns
const CACHE_STRATEGIES = {
    images: {
        pattern: /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i,
        strategy: 'cache-first',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        maxEntries: 100
    },
    fonts: {
        pattern: /\.(woff|woff2|ttf|eot)$/i,
        strategy: 'cache-first',
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
        maxEntries: 30
    },
    api: {
        pattern: /\/api\//,
        strategy: 'network-first',
        maxAge: 5 * 60 * 1000, // 5 minutes
        maxEntries: 50
    },
    external: {
        pattern: /^https:/,
        strategy: 'stale-while-revalidate',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        maxEntries: 200
    }
};

// Advanced logging system
class SWLogger {
    static log(message, data = null) {
        if (self.registration && self.registration.scope.includes('dev.wuaze.com')) {
            console.log(`[SW] ${new Date().toISOString()}: ${message}`, data || '');
        }
    }
    
    static error(message, error = null) {
        console.error(`[SW ERROR] ${new Date().toISOString()}: ${message}`, error || '');
    }
    
    static warn(message, data = null) {
        console.warn(`[SW WARN] ${new Date().toISOString()}: ${message}`, data || '');
    }
}

// Performance metrics tracker
class PerformanceTracker {
    static trackCacheHit(url, source) {
        SWLogger.log(`Cache HIT: ${url} (${source})`);
        self.clients.matchAll().then(clients => {
            clients.forEach(client => {
                client.postMessage({
                    type: 'CACHE_HIT',
                    url: url,
                    source: source,
                    timestamp: Date.now()
                });
            });
        });
    }
    
    static trackCacheMiss(url, reason) {
        SWLogger.log(`Cache MISS: ${url} (${reason})`);
        self.clients.matchAll().then(clients => {
            clients.forEach(client => {
                client.postMessage({
                    type: 'CACHE_MISS',
                    url: url,
                    reason: reason,
                    timestamp: Date.now()
                });
            });
        });
    }
    
    static trackNetworkTime(url, duration) {
        if (duration > 3000) { // Log slow requests
            SWLogger.warn(`Slow network request: ${url} (${duration}ms)`);
        }
    }
}

// Cache management utilities
class CacheManager {
    static async cleanupOldCaches() {
        const cacheNames = await caches.keys();
        const currentCaches = [siteCache, runTimeCache, staticContent];
        
        const deletePromises = cacheNames
            .filter(cacheName => !currentCaches.includes(cacheName))
            .map(cacheName => {
                SWLogger.log(`Deleting old cache: ${cacheName}`);
                return caches.delete(cacheName);
            });
            
        return Promise.all(deletePromises);
    }
    
    static async trimCache(cacheName, maxEntries) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        
        if (keys.length > maxEntries) {
            const deleteCount = keys.length - maxEntries;
            const keysToDelete = keys.slice(0, deleteCount);
            
            await Promise.all(
                keysToDelete.map(key => {
                    SWLogger.log(`Trimming cache entry: ${key.url}`);
                    return cache.delete(key);
                })
            );
        }
    }
    
    static async expireEntries(cacheName, maxAge) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        const now = Date.now();
        
        for (const key of keys) {
            const response = await cache.match(key);
            const cachedTime = response.headers.get('sw-cached-time');
            
            if (cachedTime && (now - parseInt(cachedTime)) > maxAge) {
                SWLogger.log(`Expiring cache entry: ${key.url}`);
                await cache.delete(key);
            }
        }
    }
}

// SERVICE WORKER PART 2 - Advanced Fetch Strategies & Never-Cache Logic

// Network-first strategy with intelligent fallbacks
class NetworkStrategies {
    static async networkFirst(request, cacheName, options = {}) {
        const startTime = performance.now();
        
        try {
            const networkResponse = await fetch(request.clone());
            const endTime = performance.now();
            
            PerformanceTracker.trackNetworkTime(request.url, endTime - startTime);
            
            if (networkResponse.ok) {
                // Clone response and add custom headers for cache management
                const responseToCache = networkResponse.clone();
                const cache = await caches.open(cacheName);
                
                // Add timestamp header for expiration tracking
                const headers = new Headers(responseToCache.headers);
                headers.set('sw-cached-time', Date.now().toString());
                headers.set('sw-cache-strategy', 'network-first');
                
                const modifiedResponse = new Response(responseToCache.body, {
                    status: responseToCache.status,
                    statusText: responseToCache.statusText,
                    headers: headers
                });
                
                await cache.put(request, modifiedResponse);
                PerformanceTracker.trackCacheHit(request.url, 'network-fresh');
                
                return networkResponse;
            }
        } catch (error) {
            SWLogger.warn(`Network failed for ${request.url}:`, error.message);
        }
        
        // Fallback to cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            PerformanceTracker.trackCacheHit(request.url, 'network-failed-fallback');
            return cachedResponse;
        }
        
        PerformanceTracker.trackCacheMiss(request.url, 'network-and-cache-failed');
        return new Response('Offline - Resource unavailable', { 
            status: 503, 
            statusText: 'Service Unavailable' 
        });
    }
    
    static async cacheFirst(request, cacheName, options = {}) {
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            // Check if cache entry is expired
            const cachedTime = cachedResponse.headers.get('sw-cached-time');
            const maxAge = options.maxAge || 24 * 60 * 60 * 1000; // Default 24 hours
            
            if (cachedTime && (Date.now() - parseInt(cachedTime)) < maxAge) {
                PerformanceTracker.trackCacheHit(request.url, 'cache-first-hit');
                return cachedResponse;
            }
        }
        
        // Fetch from network and update cache
        try {
            const networkResponse = await fetch(request.clone());
            
            if (networkResponse.ok) {
                const cache = await caches.open(cacheName);
                const headers = new Headers(networkResponse.headers);
                headers.set('sw-cached-time', Date.now().toString());
                headers.set('sw-cache-strategy', 'cache-first');
                
                const responseToCache = new Response(networkResponse.body, {
                    status: networkResponse.status,
                    statusText: networkResponse.statusText,
                    headers: headers
                });
                
                await cache.put(request, responseToCache.clone());
                PerformanceTracker.trackCacheHit(request.url, 'cache-first-updated');
                
                return networkResponse;
            }
        } catch (error) {
            SWLogger.warn(`Cache-first network failed for ${request.url}:`, error.message);
        }
        
        // Return stale cache if available
        if (cachedResponse) {
            PerformanceTracker.trackCacheHit(request.url, 'cache-first-stale');
            return cachedResponse;
        }
        
        PerformanceTracker.trackCacheMiss(request.url, 'cache-first-no-cache');
        return new Response('Resource unavailable', { status: 404 });
    }
    
    static async staleWhileRevalidate(request, cacheName, options = {}) {
        const cachedResponse = await caches.match(request);
        
        // Always try to update in background
        const fetchPromise = fetch(request.clone())
            .then(async (networkResponse) => {
                if (networkResponse.ok) {
                    const cache = await caches.open(cacheName);
                    const headers = new Headers(networkResponse.headers);
                    headers.set('sw-cached-time', Date.now().toString());
                    headers.set('sw-cache-strategy', 'stale-while-revalidate');
                    
                    const responseToCache = new Response(networkResponse.body, {
                        status: networkResponse.status,
                        statusText: networkResponse.statusText,
                        headers: headers
                    });
                    
                    await cache.put(request, responseToCache);
                    SWLogger.log(`Background updated: ${request.url}`);
                }
                return networkResponse;
            })
            .catch(error => {
                SWLogger.warn(`Background fetch failed for ${request.url}:`, error.message);
                return null;
            });
        
        // Return cached version immediately if available
        if (cachedResponse) {
            PerformanceTracker.trackCacheHit(request.url, 'stale-while-revalidate');
            
            // Don't await the background update
            fetchPromise.catch(() => {}); // Prevent unhandled promise rejection
            
            return cachedResponse;
        }
        
        // No cache available, wait for network
        try {
            const networkResponse = await fetchPromise;
            if (networkResponse && networkResponse.ok) {
                PerformanceTracker.trackCacheHit(request.url, 'stale-while-revalidate-fresh');
                return networkResponse;
            }
        } catch (error) {
            SWLogger.error(`Stale-while-revalidate failed for ${request.url}:`, error);
        }
        
        PerformanceTracker.trackCacheMiss(request.url, 'stale-while-revalidate-failed');
        return new Response('Resource unavailable', { status: 404 });
    }
    
    // CRITICAL: Never-cache strategy for CSS/JS files
    static async neverCache(request) {
        const startTime = performance.now();
        
        try {
            // Add cache-busting parameters
            const url = new URL(request.url);
            url.searchParams.set('_t', Date.now().toString());
            url.searchParams.set('_r', Math.random().toString(36).substring(7));
            
            const noCacheRequest = new Request(url.toString(), {
                method: request.method,
                headers: {
                    ...Object.fromEntries(request.headers.entries()),
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                },
                mode: request.mode,
                credentials: request.credentials,
                redirect: request.redirect
            });
            
            const response = await fetch(noCacheRequest);
            const endTime = performance.now();
            
            PerformanceTracker.trackNetworkTime(request.url, endTime - startTime);
            SWLogger.log(`Never-cached fetch: ${request.url} (${Math.round(endTime - startTime)}ms)`);
            
            if (response.ok) {
                // Ensure response headers prevent caching
                const headers = new Headers(response.headers);
                headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
                headers.set('Pragma', 'no-cache');
                headers.set('Expires', '0');
                headers.set('sw-strategy', 'never-cache');
                
                return new Response(response.body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: headers
                });
            }
            
            return response;
        } catch (error) {
            SWLogger.error(`Never-cache fetch failed for ${request.url}:`, error);
            PerformanceTracker.trackCacheMiss(request.url, 'never-cache-network-failed');
            
            return new Response(`/* Error loading ${request.url}: ${error.message} */`, {
                status: 503,
                statusText: 'Service Unavailable',
                headers: {
                    'Content-Type': request.url.endsWith('.css') ? 'text/css' : 'application/javascript',
                    'Cache-Control': 'no-cache'
                }
            });
        }
    }
}

// SERVICE WORKER PART 3 - Event Listeners & Core Functionality

// Install Event - Optimized precaching with error handling
self.addEventListener('install', event => {
    SWLogger.log('Service Worker installing...');
    
    event.waitUntil(
        (async () => {
            try {
                // Open multiple caches concurrently for better performance
                const [staticCache, runtimeCache] = await Promise.all([
                    caches.open(staticContent),
                    caches.open(runTimeCache)
                ]);
                
                // Precache critical static assets with detailed error handling
                const cachePromises = STATIC_ASSETS.map(async (asset) => {
                    try {
                        const response = await fetch(asset);
                        if (response.ok) {
                            await staticCache.put(asset, response);
                            SWLogger.log(`Precached: ${asset}`);
                        } else {
                            SWLogger.warn(`Failed to precache ${asset}: ${response.status}`);
                        }
                    } catch (error) {
                        SWLogger.error(`Error precaching ${asset}:`, error.message);
                    }
                });
                
                await Promise.allSettled(cachePromises);
                
                // Create offline fallback page if it doesn't exist
                await self.createOfflinePage();
                
                SWLogger.log('Service Worker installation completed successfully');
                
                // Force activation of new service worker
                self.skipWaiting();
                
            } catch (error) {
                SWLogger.error('Service Worker installation failed:', error);
                throw error;
            }
        })()
    );
});

// Activate Event - Comprehensive cleanup and client management
self.addEventListener('activate', event => {
    SWLogger.log('Service Worker activating...');
    
    event.waitUntil(
        (async () => {
            try {
                // Clean up old caches
                await CacheManager.cleanupOldCaches();
                
                // Trim caches to prevent excessive storage usage
                await Promise.all([
                    CacheManager.trimCache(runTimeCache, 200),
                    CacheManager.expireEntries(runTimeCache, 7 * 24 * 60 * 60 * 1000) // 7 days
                ]);
                
                // Take control of all clients immediately
                await self.clients.claim();
                
                // Notify all clients about the activation
                const clients = await self.clients.matchAll();
                clients.forEach(client => {
                    client.postMessage({
                        type: 'SW_ACTIVATED',
                        timestamp: Date.now(),
                        version: siteCache
                    });
                });
                
                SWLogger.log(`Service Worker activated successfully. Managing ${clients.length} clients.`);
                
            } catch (error) {
                SWLogger.error('Service Worker activation failed:', error);
                throw error;
            }
        })()
    );
});

// Fetch Event - Intelligent request routing with performance optimization
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests and chrome-extension requests
    if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
        return;
    }
    
    event.respondWith(
        (async () => {
            try {
                // CRITICAL: Never cache CSS/JS files - always fetch fresh
                if (NEVER_CACHE.some(pattern => 
                    request.url.includes(pattern) || 
                    request.url.endsWith(pattern)
                )) {
                    SWLogger.log(`Using never-cache strategy for: ${request.url}`);
                    return await NetworkStrategies.neverCache(request);
                }
                
                // Route requests based on intelligent pattern matching
                const strategy = determineStrategy(request, url);
                
                switch (strategy.type) {
                    case 'static':
                        return await handleStaticAssets(request);
                    
                    case 'image':
                        return await NetworkStrategies.cacheFirst(
                            request, 
                            runTimeCache, 
                            CACHE_STRATEGIES.images
                        );
                    
                    case 'font':
                        return await NetworkStrategies.cacheFirst(
                            request, 
                            runTimeCache, 
                            CACHE_STRATEGIES.fonts
                        );
                    
                    case 'api':
                        return await NetworkStrategies.networkFirst(
                            request, 
                            runTimeCache, 
                            CACHE_STRATEGIES.api
                        );
                    
                    case 'external':
                        return await NetworkStrategies.staleWhileRevalidate(
                            request, 
                            runTimeCache, 
                            CACHE_STRATEGIES.external
                        );
                    
                    case 'navigation':
                        return await handleNavigation(request);
                    
                    default:
                        return await NetworkStrategies.networkFirst(request, runTimeCache);
                }
                
            } catch (error) {
                SWLogger.error(`Fetch handler error for ${request.url}:`, error);
                return await handleFetchError(request, error);
            }
        })()
    );
});

// Strategic request classification with performance considerations
function determineStrategy(request, url) {
    // Static assets from same origin
    if (url.origin === self.location.origin) {
        if (CACHE_STRATEGIES.images.pattern.test(url.pathname)) {
            return { type: 'image', priority: 'high' };
        }
        if (CACHE_STRATEGIES.fonts.pattern.test(url.pathname)) {
            return { type: 'font', priority: 'high' };
        }
        if (request.destination === 'document') {
            return { type: 'navigation', priority: 'critical' };
        }
        return { type: 'static', priority: 'medium' };
    }
    
    // External resources
    if (CACHE_STRATEGIES.api.pattern.test(url.pathname)) {
        return { type: 'api', priority: 'high' };
    }
    
    // CDN resources
    if (url.hostname.includes('cdn') || url.hostname.includes('static')) {
        if (CACHE_STRATEGIES.images.pattern.test(url.pathname)) {
            return { type: 'image', priority: 'medium' };
        }
        if (CACHE_STRATEGIES.fonts.pattern.test(url.pathname)) {
            return { type: 'font', priority: 'high' };
        }
    }
    
    return { type: 'external', priority: 'low' };
}

// Optimized static asset handling with intelligent fallbacks
async function handleStaticAssets(request) {
    try {
        // Try static cache first for core assets
        const staticResponse = await caches.match(request, { cacheName: staticContent });
        if (staticResponse) {
            PerformanceTracker.trackCacheHit(request.url, 'static-cache');
            return staticResponse;
        }
        
        // Fallback to network with caching
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(runTimeCache);
            await cache.put(request, networkResponse.clone());
            PerformanceTracker.trackCacheHit(request.url, 'static-network-fresh');
            return networkResponse;
        }
        
        return networkResponse;
        
    } catch (error) {
        SWLogger.warn(`Static asset handler failed for ${request.url}:`, error.message);
        return new Response('Static asset unavailable', { status: 404 });
    }
}

// Advanced navigation handling with offline support
async function handleNavigation(request) {
    try {
        // Always try network first for navigation requests
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache successful navigation responses
            const cache = await caches.open(runTimeCache);
            await cache.put(request, networkResponse.clone());
            PerformanceTracker.trackCacheHit(request.url, 'navigation-fresh');
            return networkResponse;
        }
        
        // Fallback to cached version
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            PerformanceTracker.trackCacheHit(request.url, 'navigation-cached');
            return cachedResponse;
        }
        
        // Ultimate fallback to offline page
        const offlinePage = await caches.match('./offline.html');
        return offlinePage || new Response('Offline', { status: 503 });
        
    } catch (error) {
        SWLogger.warn(`Navigation handler network failed for ${request.url}:`, error.message);
        
        // Try cached version of the specific page
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            PerformanceTracker.trackCacheHit(request.url, 'navigation-offline-fallback');
            return cachedResponse;
        }
        
        // Return offline page
        const offlinePage = await caches.match('./offline.html');
        return offlinePage || new Response('You are offline', { 
            status: 503,
            headers: { 'Content-Type': 'text/html' }
        });
    }
}

// SERVICE WORKER PART 4 - Advanced PWA Features & Error Handling

// Error handling with intelligent recovery strategies
async function handleFetchError(request, error) {
    SWLogger.error(`Fetch error for ${request.url}:`, error.message);
    
    // Attempt cached fallback first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        PerformanceTracker.trackCacheHit(request.url, 'error-fallback-cached');
        return cachedResponse;
    }
    
    // Generate appropriate error responses based on request type
    const url = new URL(request.url);
    
    // CSS files - return empty stylesheet to prevent layout breaks
    if (url.pathname.endsWith('.css')) {
        return new Response('/* Offline - CSS unavailable */', {
            status: 503,
            headers: { 'Content-Type': 'text/css' }
        });
    }
    
    // JavaScript files - return empty script with error logging
    if (url.pathname.endsWith('.js')) {
        return new Response(`console.warn('Offline - Script unavailable: ${url.pathname}');`, {
            status: 503,
            headers: { 'Content-Type': 'application/javascript' }
        });
    }
    
    // Images - return placeholder or cached offline image
    if (CACHE_STRATEGIES.images.pattern.test(url.pathname)) {
        const offlineImage = await caches.match('./icons/offline-placeholder.svg');
        return offlineImage || new Response('', { status: 404 });
    }
    
    // Navigation requests - return offline page
    if (request.destination === 'document') {
        const offlinePage = await caches.match('./offline.html');
        return offlinePage || createFallbackOfflinePage();
    }
    
    return new Response('Resource unavailable offline', { status: 503 });
}

// Dynamic offline page creation with enhanced functionality
self.createOfflinePage = async function() {
    const offlineHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Offline - Wuaze GitHub</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
            }
            .offline-container {
                text-align: center;
                max-width: 500px;
                padding: 2rem;
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            }
            .offline-icon {
                font-size: 4rem;
                margin-bottom: 1rem;
                animation: pulse 2s infinite;
            }
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            h1 { font-size: 2rem; margin-bottom: 1rem; }
            p { margin-bottom: 1.5rem; opacity: 0.9; line-height: 1.6; }
            .retry-btn {
                background: #4CAF50;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 25px;
                cursor: pointer;
                font-size: 1rem;
                transition: all 0.3s ease;
            }
            .retry-btn:hover {
                background: #45a049;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            }
            .status-indicator {
                margin-top: 2rem;
                padding: 1rem;
                background: rgba(255,255,255,0.1);
                border-radius: 10px;
                font-size: 0.9rem;
            }
            .online { color: #4CAF50; }
            .offline { color: #f44336; }
        </style>
    </head>
    <body>
        <div class="offline-container">
            <div class="offline-icon">📡</div>
            <h1>You're Offline</h1>
            <p>It looks like you've lost your internet connection. Don't worry, we've cached some content for you to browse offline.</p>
            <button class="retry-btn" onclick="window.location.reload()">Try Again</button>
            <div class="status-indicator">
                <div id="connection-status">Checking connection...</div>
                <div id="last-updated">Last updated: <span id="timestamp">${new Date().toLocaleString()}</span></div>
            </div>
        </div>
        
        <script>
            // Connection monitoring with visual feedback
            function updateConnectionStatus() {
                const status = document.getElementById('connection-status');
                if (navigator.onLine) {
                    status.innerHTML = '<span class="online">🟢 Back Online!</span>';
                    setTimeout(() => window.location.reload(), 2000);
                } else {
                    status.innerHTML = '<span class="offline">🔴 Still Offline</span>';
                }
            }
            
            // Monitor connection changes
            window.addEventListener('online', updateConnectionStatus);
            window.addEventListener('offline', updateConnectionStatus);
            
            // Initial check
            updateConnectionStatus();
            
            // Periodic connection checks
            setInterval(updateConnectionStatus, 5000);
            
            // Service Worker communication
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.addEventListener('message', event => {
                    if (event.data.type === 'SW_ACTIVATED') {
                        console.log('Service Worker reactivated, refreshing...');
                        window.location.reload();
                    }
                });
            }
        </script>
    </body>
    </html>`;
    
    try {
        const cache = await caches.open(staticContent);
        await cache.put('./offline.html', new Response(offlineHTML, {
            headers: { 'Content-Type': 'text/html' }
        }));
        SWLogger.log('Offline page created and cached successfully');
    } catch (error) {
        SWLogger.error('Failed to create offline page:', error);
    }
};

// Fallback offline page for extreme cases
function createFallbackOfflinePage() {
    const fallbackHTML = `
    <!DOCTYPE html>
    <html><head><title>Offline</title></head>
    <body style="font-family:sans-serif;text-align:center;padding:2rem;">
        <h1>You're Offline</h1>
        <p>Please check your internet connection and try again.</p>
        <button onclick="location.reload()">Retry</button>
    </body></html>`;
    
    return new Response(fallbackHTML, {
        headers: { 'Content-Type': 'text/html' }
    });
}

// Background Sync for enhanced offline functionality
self.addEventListener('sync', event => {
    SWLogger.log(`Background sync triggered: ${event.tag}`);
    
    switch (event.tag) {
        case 'cache-cleanup':
            event.waitUntil(performCacheCleanup());
            break;
        case 'prefetch-critical':
            event.waitUntil(prefetchCriticalResources());
            break;
        case 'update-check':
            event.waitUntil(checkForUpdates());
            break;
        default:
            SWLogger.warn(`Unknown sync tag: ${event.tag}`);
    }
});

// Comprehensive cache cleanup with performance optimization
async function performCacheCleanup() {
    try {
        SWLogger.log('Starting comprehensive cache cleanup...');
        
        // Clean expired entries from all caches
        const cacheNames = await caches.keys();
        const cleanupPromises = cacheNames.map(async (cacheName) => {
            if (cacheName.includes('wuaze')) {
                await CacheManager.expireEntries(cacheName, 24 * 60 * 60 * 1000);
                await CacheManager.trimCache(cacheName, 100);
            }
        });
        
        await Promise.all(cleanupPromises);
        
        // Calculate and report cache usage
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            const usedMB = (estimate.usage / 1024 / 1024).toFixed(2);
            const quotaMB = (estimate.quota / 1024 / 1024).toFixed(2);
            
            SWLogger.log(`Cache cleanup completed. Storage: ${usedMB}MB / ${quotaMB}MB used`);
            
            // Notify clients about storage status
            const clients = await self.clients.matchAll();
            clients.forEach(client => {
                client.postMessage({
                    type: 'STORAGE_STATUS',
                    used: estimate.usage,
                    quota: estimate.quota,
                    percentage: Math.round((estimate.usage / estimate.quota) * 100)
                });
            });
        }
        
    } catch (error) {
        SWLogger.error('Cache cleanup failed:', error);
    }
}

// Intelligent prefetching of critical resources
async function prefetchCriticalResources() {
    const criticalResources = [
        './manifest.json',
        './icons/icon-192x192.png',
        './icons/icon-512x512.png'
    ];
    
    try {
        const cache = await caches.open(staticContent);
        const prefetchPromises = criticalResources.map(async (resource) => {
            const cached = await cache.match(resource);
            if (!cached) {
                try {
                    const response = await fetch(resource);
                    if (response.ok) {
                        await cache.put(resource, response);
                        SWLogger.log(`Prefetched: ${resource}`);
                    }
                } catch (error) {
                    SWLogger.warn(`Failed to prefetch ${resource}:`, error.message);
                }
            }
        });
        
        await Promise.allSettled(prefetchPromises);
        SWLogger.log('Critical resource prefetching completed');
        
    } catch (error) {
        SWLogger.error('Prefetch operation failed:', error);
    }
}

// Proactive update checking mechanism
async function checkForUpdates() {
    try {
        // Check if main page has been updated
        const response = await fetch('./', { 
            cache: 'no-cache',
            headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (response.ok) {
            const cache = await caches.open(runTimeCache);
            const cached = await cache.match('./');
            
            if (cached) {
                const cachedText = await cached.text();
                const freshText = await response.text();
                
                if (cachedText !== freshText) {
                    SWLogger.log('Page update detected, refreshing cache...');
                    await cache.put('./', new Response(freshText, {
                        headers: response.headers
                    }));
                    
                    // Notify clients about the update
                    const clients = await self.clients.matchAll();
                    clients.forEach(client => {
                        client.postMessage({
                            type: 'PAGE_UPDATED',
                            timestamp: Date.now()
                        });
                    });
                }
            }
        }
        
    } catch (error) {
        SWLogger.warn('Update check failed:', error.message);
    }
}

// Message handling for client communication
self.addEventListener('message', event => {
    const { data } = event;
    
    switch (data.type) {
        case 'SKIP_WAITING':
            SWLogger.log('Received skip waiting message');
            self.skipWaiting();
            break;
            
        case 'CACHE_STATUS_REQUEST':
            handleCacheStatusRequest(event.source);
            break;
            
        case 'FORCE_UPDATE':
            handleForceUpdate(event.source);
            break;
            
        case 'CLEAR_CACHE':
            handleClearCache(data.cacheNames, event.source);
            break;
            
        default:
            SWLogger.warn(`Unknown message type: ${data.type}`);
    }
});

// Detailed cache status reporting
async function handleCacheStatusRequest(client) {
    try {
        const cacheNames = await caches.keys();
        const cacheStatus = {};
        
        for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const keys = await cache.keys();
            cacheStatus[cacheName] = {
                entryCount: keys.length,
                entries: keys.slice(0, 10).map(req => req.url) // First 10 entries
            };
        }
        
        client.postMessage({
            type: 'CACHE_STATUS_RESPONSE',
            caches: cacheStatus,
            timestamp: Date.now()
        });
        
    } catch (error) {
        SWLogger.error('Failed to get cache status:', error);
        client.postMessage({
            type: 'CACHE_STATUS_ERROR',
            error: error.message
        });
    }
}

// Force update mechanism
async function handleForceUpdate(client) {
    try {
        SWLogger.log('Force update requested');
        
        // Clear runtime cache
        await caches.delete(runTimeCache);
        
        // Recreate caches
        await caches.open(runTimeCache);
        
        client.postMessage({
            type: 'FORCE_UPDATE_COMPLETE',
            timestamp: Date.now()
        });
        
        SWLogger.log('Force update completed');
        
    } catch (error) {
        SWLogger.error('Force update failed:', error);
        client.postMessage({
            type: 'FORCE_UPDATE_ERROR',
            error: error.message
        });
    }
}

// Selective cache clearing
async function handleClearCache(cacheNames, client) {
    try {
        const results = {};
        
        for (const cacheName of cacheNames || [runTimeCache]) {
            const deleted = await caches.delete(cacheName);
            results[cacheName] = deleted;
            
            if (deleted) {
                SWLogger.log(`Cleared cache: ${cacheName}`);
                // Recreate the cache
                await caches.open(cacheName);
            }
        }
        
        client.postMessage({
            type: 'CLEAR_CACHE_COMPLETE',
            results: results,
            timestamp: Date.now()
        });
        
    } catch (error) {
        SWLogger.error('Cache clearing failed:', error);
        client.postMessage({
            type: 'CLEAR_CACHE_ERROR',
            error: error.message
        });
    }
}