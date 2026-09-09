const STATIC_CACHE = 'weatherwise-static-v1';
const RUNTIME_CACHE = 'weatherwise-runtime-v1';
const APP_SHELL = [
    './',
    './index.html',
    './auth.html',
    './styles.css',
    './auth.css',
    './app.js',
    './auth.js',
    './cities.js',
    './config.js',
    './translations.js',
    './weatherMap.js',
    './weatherUtils.js',
    './pwa.js',
    './manifest.json',
    './icons/icon-192.svg',
    './icons/icon-512.svg'
];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(STATIC_CACHE).then(cache => cache.addAll(APP_SHELL)));
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(key => ![STATIC_CACHE, RUNTIME_CACHE].includes(key))
                .map(key => caches.delete(key))
        ))
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);
    if (event.request.method !== 'GET') return;

    if (requestUrl.origin === self.location.origin && event.request.mode === 'navigate') {
        event.respondWith(networkFirst(event.request, './index.html'));
        return;
    }

    if (requestUrl.origin === self.location.origin) {
        event.respondWith(cacheFirst(event.request));
    }
});

async function networkFirst(request, fallbackUrl) {
    const cache = await caches.open(RUNTIME_CACHE);
    try {
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
    } catch (error) {
        const cached = await cache.match(request);
        if (cached) return cached;
        if (fallbackUrl) return caches.match(fallbackUrl);
        throw error;
    }
}

async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response.ok) {
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(request, response.clone());
    }
    return response;
}
