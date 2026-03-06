const CACHE_NAME = "EL-TOUFAN-v11";
const OFFLINE_URL = "offline.html";

const PRECACHE_ASSETS = [
    "./",
    "index.html",
    "style.css",
    "main.js?v=41",
    "firebase-config.js",
    "payment-config.js",
    "shipping-config.js",
    "shipping-api.js",
    "offline.html",
    "logo/1.png",
    "logo/icon-192.png",
    "logo/icon-512.png",
    "https://unpkg.com/lucide@latest",
    "https://cdn.jsdelivr.net/npm/chart.js",
    "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js",
    "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Orbitron:wght@400;700;900&display=swap",
    "https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap"
];

// Install Event
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("sw: Caching assets...");
            return cache.addAll(PRECACHE_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate Event
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch Event
self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    // ❌ Ignore non-GET, non-http(s), and browser extensions
    if (event.request.method !== "GET" || !url.protocol.startsWith("http")) {
        return;
    }

    // ❌ Ignore specific problematic paths
    if (url.pathname.includes("favicon.ico") || url.pathname.endsWith(".ico")) {
        return;
    }

    event.respondWith(
        (async () => {
            const cache = await caches.open(CACHE_NAME);

            // Try matching in cache first
            const cachedResponse = await cache.match(event.request);

            if (cachedResponse) {
                // Stale-While-Revalidate: Return cached then fetch updated
                fetch(event.request).then(async (networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        await cache.put(event.request, networkResponse);
                    }
                }).catch(() => { });
                return cachedResponse;
            }

            // Not in cache, try network
            try {
                const networkResponse = await fetch(event.request);

                // Only cache successful standard responses
                if (networkResponse && networkResponse.status === 200) {
                    await cache.put(event.request, networkResponse.clone());
                }

                return networkResponse;
            } catch (error) {
                // Network failed
                if (event.request.mode === "navigate") {
                    const offlineFallback = await cache.match(OFFLINE_URL);
                    if (offlineFallback) return offlineFallback;
                }

                // Return a generic error response instead of letting the promise reject
                return new Response("Offline or Network Error", {
                    status: 503,
                    statusText: "Service Unavailable",
                    headers: new Headers({ "Content-Type": "text/plain" })
                });
            }
        })()
    );
});
