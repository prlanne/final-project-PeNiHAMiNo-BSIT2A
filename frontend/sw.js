const CACHE_VERSION = 'bentaboard-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const STATIC_ASSETS = [
    '/',
    '/role-select.html',
    '/login.html',
    '/register.html',
    '/admin-login.html',
    '/index.html',
    '/dashboard.html',
    '/inventory.html',
    '/saleslogs.html',
    '/expenses.html',
    '/purchases.html',
    '/analytics.html',
    '/reports.html',
    '/weather.html',
    '/settings.html',
    '/admin-dashboard.html',
    '/admin-users.html',
    '/admin-reports.html',
    '/admin-settings.html',
    '/css/style.css',
    '/js/admin-script.js',
    '/js/analytics.js',
    '/js/auth.js',
    '/js/dashboard.js',
    '/js/expenses.js',
    '/js/hub.js',
    '/js/inventory.js',
    '/js/main.js',
    '/js/notifications.js',
    '/js/purchases.js',
    '/js/reports.js',
    '/js/role-select.js',
    '/js/sales.js',
    '/js/saleslogs.js',
    '/js/settings.js',
    '/js/shared.js',
    '/js/weatherAPI.js',
    '/js/pwa-register.js',
    '/js/pwa-install.js',
    '/manifest.json',
    '/img/bentaboard.png',
    '/img/icons/icon-192.png',
    '/img/icons/icon-512.png',
    '/img/icons/maskable-512.png',
    '/fonts/poppins-300.ttf',
    '/fonts/poppins-400.ttf',
    '/fonts/poppins-500.ttf',
    '/fonts/poppins-600.ttf',
    '/fonts/poppins-700.ttf'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(
                keys
                    .filter((key) => ![STATIC_CACHE, RUNTIME_CACHE].includes(key))
                    .map((key) => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

async function networkFirst(request) {
    const cache = await caches.open(RUNTIME_CACHE);

    try {
        const response = await fetch(request);
        if (response && response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (err) {
        const cached = await cache.match(request);
        if (cached) return cached;

        if (request.mode === 'navigate') {
            return caches.match('/role-select.html');
        }

        throw err;
    }
}

async function staleWhileRevalidate(request) {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(request);
    const fetchPromise = fetch(request)
        .then((response) => {
            if (response && response.ok) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => cached);

    return cached || fetchPromise;
}

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (request.method !== 'GET') return;
    if (url.origin !== self.location.origin) return;
    if (url.pathname.startsWith('/api/')) return;

    if (request.mode === 'navigate' || url.pathname.endsWith('.html')) {
        event.respondWith(networkFirst(request));
        return;
    }

    event.respondWith(staleWhileRevalidate(request));
});
