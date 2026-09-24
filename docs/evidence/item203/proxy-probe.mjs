// ITEM 203 - IS THERE A PROXY LIMIT UPSTREAM OF EXPRESS?  A safe, read-only probe of production.
//
// WHY THIS IS SAFE, from the source (apps/server/src/index.ts, session.ts, auth.ts):
//   * every request is UNAUTHENTICATED: no cookie, no credentials, no user data - the body is `{"lastSyncAt":null,
//     "push":{}}` padded with trailing WHITESPACE to an exact byte size (valid, empty JSON);
//   * express.json parses first (so the body size is judged before anything else), then the session middleware runs
//     with `saveUninitialized: false` and NO cookie, so it neither reads nor writes the session table, then
//     requireAuth answers 401. NO database is touched, nothing is written, nothing is authenticated as anyone;
//   * SIX requests, sequential, ~21 MB in total, once each. It is a ladder up to Express's own 5 MiB ceiling.
//
// WHAT IT CAN AND CANNOT TELL: below Express's limit an app-level answer is 401 {"error":"Not authenticated"}; a
// proxy refusing EARLIER would answer with a different status / body / server header. At/above 5 MiB the request never
// matters to a proxy limit >= 5 MiB, because Express refuses first - so a proxy limit ABOVE 5 MiB is unobservable
// and irrelevant, and a proxy limit BELOW it shows up as the first non-401 rung.
//
// Run: node docs/evidence/item203/proxy-probe.mjs [baseUrl]
const BASE = process.argv[2] || 'https://writer-studio-app-production.up.railway.app';
const MiB = 1024 * 1024;
const head = '{"lastSyncAt":null,"push":{}}';
const body = (bytes) => head + ' '.repeat(bytes - head.length);
const sizes = [1, 2, 3, 4, 4.9, 5.25].map((m) => Math.round(m * MiB));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
console.log(`target: ${BASE}/api/sync   (unauthenticated; no cookie)`);
let firstOdd = null;
for (const bytes of sizes) {
  const t0 = Date.now();
  let line;
  try {
    const res = await fetch(`${BASE}/api/sync`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body(bytes) });
    const text = (await res.text()).slice(0, 110).replace(/\s+/g, ' ');
    line = { bytes, mib: +(bytes / MiB).toFixed(2), status: res.status, server: res.headers.get('server'), type: res.headers.get('content-type'), via: res.headers.get('x-railway-edge') || res.headers.get('x-railway-request-id') ? 'railway-edge-headers-present' : null, ms: Date.now() - t0, body: text };
  } catch (e) {
    line = { bytes, mib: +(bytes / MiB).toFixed(2), error: String(e && e.message || e).slice(0, 120), ms: Date.now() - t0 };
  }
  console.log(JSON.stringify(line));
  const expected = bytes < 5 * MiB ? 401 : 500;
  if (line.status !== expected && !firstOdd) firstOdd = line;
  await sleep(2000);
}
console.log(firstOdd
  ? `\nRESULT: the first rung that did NOT get the application's own answer was ${firstOdd.mib} MiB (status ${firstOdd.status ?? firstOdd.error}) - an upstream limit BELOW Express's 5 MiB exists.`
  : '\nRESULT: every rung got the APPLICATION\'s own answer (401 below 5 MiB, Express\'s 500 at 5.25 MiB): no proxy limit below 5 MiB was observed. Express\'s 5 MiB is the effective ceiling.');
