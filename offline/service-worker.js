const CACHE = "chicken-cat-offline-v2";

/** Same-origin assets required for choice-mode offline play (verified on disk). */
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

const CRITICAL = new Set([
  "./index.html",
  "./js/game.js",
  "./js/choices-data.js",
  "./css/pixel.css",
]);

function scopeBase() {
  return new URL("./", self.location.href).href;
}

function resolvePrecacheUrl(path) {
  return new URL(path, scopeBase()).href;
}

function absolutePrecacheUrls() {
  return PRECACHE.map((path) => resolvePrecacheUrl(path));
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
    const rootIndex = resolvePrecacheUrl("./index.html");
    const byRootIndex = await cache.match(rootIndex, matchOpts);
    if (byRootIndex) return byRootIndex;
  }

  const relFromRoot = `.${pathname}`;
  const byRel = await cache.match(new URL(relFromRoot, base).href, matchOpts);
  if (byRel) return byRel;

  for (const abs of absolutePrecacheUrls()) {
    const absUrl = new URL(abs);
    if (abs === href || absUrl.pathname === pathname) {
      const hit = await cache.match(abs, matchOpts);
      if (hit) return hit;
    }
  }

  return null;
}

async function putPrecacheEntry(cache, path) {
  const url = resolvePrecacheUrl(path);
  try {
    const response = await fetch(path, { cache: "reload" });
    if (!response || !response.ok) {
      console.warn("[SW] precache skip (bad response):", path, response?.status);
      return { path, ok: false };
    }
    await cache.put(url, response);
    if (path === "./" || path === "./index.html") {
      await cache.put(resolvePrecacheUrl("./index.html"), response.clone());
    }
    return { path, ok: true };
  } catch (err) {
    console.warn("[SW] precache failed:", path, err);
    return { path, ok: false };
  }
}

async function populatePrecache(cache) {
  const results = await Promise.all(PRECACHE.map((p) => putPrecacheEntry(cache, p)));
  const failedCritical = results.filter(
    (r) => !r.ok && CRITICAL.has(r.path)
  );
  if (failedCritical.length) {
    console.error("[SW] critical precache missing:", failedCritical.map((r) => r.path));
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => populatePrecache(cache))
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
          const indexUrl = resolvePrecacheUrl("./index.html");
          const fallback =
            (await cache.match(indexUrl, { ignoreSearch: true })) ||
            (await cache.match("./index.html", { ignoreSearch: true })) ||
            (await matchCached(cache, new Request(indexUrl)));
          if (fallback) return fallback;
        }
        const retry = await matchCached(cache, event.request);
        if (retry) return retry;
        return new Response("Offline — not cached", {
          status: 503,
          statusText: "Offline",
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }
    })()
  );
});
