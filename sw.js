// sw.js (root copy for correct registration scope)

const CACHE_NAME = 'smart-health-patient-v1';
const urlsToCache = [
    'frontend/patient.html',
    'assets/css/patient.css',
    'assets/js/patient.js',
    'frontend/clinicDashboard.html',
    'assets/css/clinicDashboard.css',
    'assets/js/clinicDashboard.js',
    'index.html',
    'assets/css/styles.css'
];

// 1. Installation: Open the cache and save the core files
self.addEventListener('install', event => {
    console.log('Service Worker (root): Install event triggered.');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching essential assets...');
                return cache.addAll(urlsToCache).catch(error => {
                    console.error('Failed to cache all URLs:', error);
                });
            })
    );
});

// 2. Fetching: Intercept network requests and serve from cache if available
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});
