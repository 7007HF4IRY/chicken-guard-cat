const CACHE = "chicken-cat-static-v18";

const PRECACHE = [
  "./",
  "./index.html",
  "./css/pixel.css",
  "./js/game.js",
  "./js/choices-data.js",
  "./manifest.webmanifest",
  "./service-worker.js",
  "./fonts/pixel.woff2",
  "./img/box.png",
  "./img/tired.png",
  "./img/sus.png",
  "./img/int.png",
  "./img/tsun.png",
  "./img/love.png",
  "./img/mad.png",
  "./img/icons/chicken.png",
  "./img/icons/chicken-wing.png",
  "./img/icons/chicken-leg.png",
  "./img/icons/chicken-drum.png",
  "./img/icons/win.svg",
  "./img/icons/lose.svg",
  "./audio/bgm.mp3",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        Promise.allSettled(PRECACHE.map((url) => cache.add(url)))
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(event.request);
      if (cached) return cached;

      try {
        const response = await fetch(event.request);
        if (response.ok) {
          cache.put(event.request, response.clone());
        }
        return response;
      } catch (err) {
        if (event.request.mode === "navigate") {
          const fallback = await cache.match("./index.html");
          if (fallback) return fallback;
        }
        const pathFallback = await cache.match(url.pathname);
        if (pathFallback) return pathFallback;
        throw err;
      }
    })
  );
});
