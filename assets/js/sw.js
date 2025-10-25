// sw.js (in your project root folder)

const CACHE_NAME = 'smart-health-patient-v1';
const urlsToCache = [
    'frontend/patient.html',
    'assets/css/patient.css',
    'assets/js/patient.js',
    // Add paths to your Font Awesome file/kit if self-hosted, but we'll ignore it for now
    // because we used the CDN link in patient.html
];

// 1. Installation: Open the cache and save the core files
self.addEventListener('install', event => {
    console.log('Service Worker: Install event triggered.');
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
                // If a match is found in the cache, return it immediately
                if (response) {
                    return response;
                }
                // Otherwise, fetch from the network
                return fetch(event.request);
            })
    );
});