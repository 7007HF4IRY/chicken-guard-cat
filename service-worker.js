const CACHE = "chicken-cat-static-v23";

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

function scopeBase() {
  return new URL("./", self.location.href).href;
}

function absolutePrecacheUrls() {
  const base = scopeBase();
  return PRECACHE.map((path) => new URL(path, base).href);
}

async function matchCached(cache, request) {
  const url = new URL(request.url);
  const base = scopeBase();
  const matchOpts = { ignoreSearch: true };

  const direct = await cache.match(request, matchOpts);
  if (direct) return direct;

  const href = url.href.split("#")[0];
  const byHref = await cache.match(href, matchOpts);
  if (byHref) return byHref;

  const pathname = url.pathname;
  const byPath = await cache.match(pathname, matchOpts);
  if (byPath) return byPath;

  if (pathname.endsWith("/")) {
    const indexPath = `${pathname}index.html`;
    const byIndex = await cache.match(indexPath, matchOpts);
    if (byIndex) return byIndex;
  }

  if (pathname === "/" || pathname.endsWith("/")) {
    const rootIndex = new URL("./index.html", base).href;
    const byRootIndex = await cache.match(rootIndex, matchOpts);
    if (byRootIndex) return byRootIndex;
  }

  const relFromRoot = `.${pathname}`;
  const byRel = await cache.match(new URL(relFromRoot, base).href, matchOpts);
  if (byRel) return byRel;

  for (const abs of absolutePrecacheUrls()) {
    if (abs === href || abs.endsWith(pathname)) {
      const hit = await cache.match(abs, matchOpts);
      if (hit) return hit;
    }
  }

  return null;
}

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
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await matchCached(cache, event.request);
      if (cached) return cached;

      try {
        const response = await fetch(event.request);
        if (response.ok && response.type === "basic") {
          cache.put(event.request, response.clone());
        }
        return response;
      } catch {
        if (event.request.mode === "navigate") {
          const indexUrl = new URL("./index.html", scopeBase()).href;
          const fallback =
            (await cache.match(indexUrl, { ignoreSearch: true })) ||
            (await cache.match("./index.html", { ignoreSearch: true }));
          if (fallback) return fallback;
        }
        const retry = await matchCached(cache, event.request);
        if (retry) return retry;
        throw new Error("offline and not in cache");
      }
    })()
  );
});
