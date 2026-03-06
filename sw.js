const CACHE_NAME = "EL-TOUFAN-v4";
const OFFLINE_URL = "offline.html";

const PRECACHE_ASSETS = [
    "./",
    "index.html",
    "style.css",
    "main.js",
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
    "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Orbitron:wght@400;700;900&display=swap"
];

// Install Event
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("Caching assets...");
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
    const url = event.request.url;

    // ❌ تجاهل favicon.ico لتجنب أخطاء الشبكة في الكونسول
    if (url.includes("favicon.ico") || url.endsWith(".ico")) {
        return;
    }

    // ❌ تجاهل requests من extensions المتصفح أو غير http/https
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return;
    }

    // ❌ تجاهل POST requests
    if (event.request.method !== "GET") {
        return;
    }

    // ✅ Check if navigation request (HTML page)
    if (event.request.mode === "navigate") {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match(OFFLINE_URL);
            })
        );
        return;
    }

    // ✅ Default Cache Strategy (Stale-While-Revalidate)
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200 && networkResponse.type !== "opaque") {
                    const cacheCopy = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, cacheCopy).catch(() => { });
                    });
                }
                return networkResponse;
            }).catch(() => {
                return cachedResponse || new Response("Network error occurred", { status: 408, statusText: "Request Timeout" });
            });

            return cachedResponse || fetchPromise;
        })
    );
});
