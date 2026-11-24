// THE COMPANION'S OFFLINE HELPER (MOBILE slice 1; scope /m/). It keeps the app's OWN FILES only, so the companion can open with no signal and let her write a note that waits.
// It NEVER keeps sign-in, the account's replies, other writers' pages or the AI's replies: /auth and /api are never touched here, and nothing but same-origin files of the app itself is stored.
// The page (/m/) is fetched fresh whenever there is a signal (so a new deploy shows at once) and read from the kept copy only when there is none. The built files under /assets/ are named by their content, so a kept one is never stale.
const CACHE = 'wrizo-companion-files-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

const isOwnFile = (url) =>
  url.origin === self.location.origin &&
  !url.pathname.startsWith('/api') && !url.pathname.startsWith('/auth') && url.pathname !== '/healthz' &&
  (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/m/') || /\.(png|ico|webmanifest|woff2?)$/.test(url.pathname));

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (!isOwnFile(url)) return;   // everything else (sign-in, the account, the AI) goes straight to the network, untouched

  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        if (fresh.ok) { const c = await caches.open(CACHE); await c.put('/m/', fresh.clone()); }
        return fresh;
      } catch {
        const kept = await caches.match('/m/');
        return kept || Response.error();
      }
    })());
    return;
  }

  const byContent = url.pathname.startsWith('/assets/');   // named by their content: a kept copy is always the right one
  event.respondWith((async () => {
    if (byContent) { const kept = await caches.match(req); if (kept) return kept; }
    try {
      const fresh = await fetch(req);
      if (fresh.ok && fresh.type === 'basic') { const c = await caches.open(CACHE); await c.put(req, fresh.clone()); }
      return fresh;
    } catch {
      const kept = await caches.match(req);
      return kept || Response.error();
    }
  })());
});
