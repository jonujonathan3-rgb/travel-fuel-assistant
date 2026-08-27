const CACHE_NAME = "travel-fuel-assistant-v2";

const APP_SHELL = [
    "./",
    "./index.html",
    "./manifest.json",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
];

/* Install: cache the main app files */
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

/* Activate: remove old Travel Fuel Assistant caches */
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(cacheName => cacheName !== CACHE_NAME)
                        .map(cacheName => caches.delete(cacheName))
                );
            })
            .then(() => self.clients.claim())
    );
});

/* Fetch: cache only your own app files */
self.addEventListener("fetch", event => {

    if (event.request.method !== "GET") {
        return;
    }

    const requestURL = new URL(event.request.url);

    /*
     * Only handle requests belonging to the same origin
     * as the Travel Fuel Assistant.
     */
    if (requestURL.origin !== self.location.origin) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {

                /* Use cached version when available */
                if (cachedResponse) {
                    return cachedResponse;
                }

                /* Otherwise get it from the network */
                return fetch(event.request)
                    .then(networkResponse => {

                        /*
                         * Only cache successful responses.
                         */
                        if (
                            networkResponse &&
                            networkResponse.status === 200 &&
                            networkResponse.type === "basic"
                        ) {
                            const responseClone = networkResponse.clone();

                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseClone);
                                });
                        }

                        return networkResponse;
                    })
                    .catch(() => {

                        /*
                         * If the network is unavailable,
                         * return the main app page.
                         */
                        return caches.match("./index.html");
                    });
            })
    );
});
