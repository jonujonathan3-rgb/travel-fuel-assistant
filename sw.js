const CACHE_NAME = "travel-fuel-assistant-v3";

const APP_SHELL = [
    "./",
    "./index.html",
    "./manifest.json",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
];

/* =====================================================
   INSTALL
===================================================== */

self.addEventListener("install", event => {

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );

});


/* =====================================================
   ACTIVATE
===================================================== */

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


/* =====================================================
   FETCH
===================================================== */

self.addEventListener("fetch", event => {

    if (event.request.method !== "GET") {
        return;
    }

    const requestURL = new URL(event.request.url);

    /* Only handle your own website */
    if (requestURL.origin !== self.location.origin) {
        return;
    }


    /*
     * HTML pages:
     * NETWORK FIRST
     *
     * This ensures website updates appear immediately.
     */

    if (
        event.request.destination === "document" ||
        requestURL.pathname.endsWith(".html") ||
        requestURL.pathname === "/" ||
        requestURL.pathname.endsWith("/")
    ) {

        event.respondWith(

            fetch(event.request)

                .then(networkResponse => {

                    if (
                        networkResponse &&
                        networkResponse.status === 200
                    ) {

                        const responseClone =
                            networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {

                                cache.put(
                                    event.request,
                                    responseClone
                                );

                            });

                    }

                    return networkResponse;

                })

                .catch(() => {

                    return caches.match(event.request)
                        .then(cachedResponse => {

                            return cachedResponse ||
                                   caches.match("./index.html");

                        });

                })

        );

        return;
    }


    /*
     * Other files:
     * CACHE FIRST
     *
     * Good for icons and static resources.
     */

    event.respondWith(

        caches.match(event.request)

            .then(cachedResponse => {

                if (cachedResponse) {
                    return cachedResponse;
                }


                return fetch(event.request)

                    .then(networkResponse => {

                        if (
                            networkResponse &&
                            networkResponse.status === 200 &&
                            networkResponse.type === "basic"
                        ) {

                            const responseClone =
                                networkResponse.clone();

                            caches.open(CACHE_NAME)
                                .then(cache => {

                                    cache.put(
                                        event.request,
                                        responseClone
                                    );

                                });

                        }

                        return networkResponse;

                    });

            })

    );

});
