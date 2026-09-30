// ITEM 203 - WHERE IS THE PROXY'S REAL CEILING, ABOVE EXPRESS'S 5 MiB?  The same safe probe, one ladder higher.
//
// WHY THIS IS STILL SAFE (apps/server/src/index.ts, session.ts, auth.ts): every request is UNAUTHENTICATED - no cookie, no
// credentials, no user data; the body is `{"lastSyncAt":null,"push":{}}` padded with trailing WHITESPACE. Above 5 MiB the
// application never even READS it: express.json compares the Content-Length to its limit and refuses (a bare 500 on the code in
// production when this was run; after item 203 a 413 / a 401) before the session middleware or the database is reached. Nothing is written, nothing is
// authenticated. The cost is BANDWIDTH ONLY, so the ladder is small: doubling from 8 MiB, stopping at the first rung that
// is not the application's own answer, never above 64 MiB (at most ~120 MB in total).
//
// HOW A PROXY CEILING SHOWS: the application's answer above 5 MiB is a JSON body ({"error":"Internal server error"} today,
// {"error":"payload too large",...} after 203). A proxy refusing EARLIER shows as anything else - a different status, an HTML
// or empty body, a different server header, or a connection error. The first such rung brackets the ceiling; the rung below
// it, which still got the application's answer, is the largest body the edge is known to carry.
//
// Run: node docs/evidence/item203/proxy-ceiling-probe.mjs [baseUrl]
const BASE = process.argv[2] || 'https://writer-studio-app-production.up.railway.app';
const MiB = 1024 * 1024;
const head = '{"lastSyncAt":null,"push":{}}';
const body = (bytes) => head + ' '.repeat(bytes - head.length);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// The application's own answers: a bare 500 (before item 203), a 413 (after P1), or - after P3, which authenticates /api/sync BEFORE
// it reads a byte - a 401 at every size. Anything else (an HTML page, an empty body, another server header, a dropped connection) is the EDGE.
const isApp = (status, text) => (status === 500 || status === 413 || status === 401) && /"error":"(Internal server error|payload too large|Not authenticated)"/.test(text);
console.log(`target: ${BASE}/api/sync   (unauthenticated; no cookie; bodies above Express's 5 MiB, refused before anything is read)`);
let lastApp = null, firstOther = null;
for (const m of [8, 16, 32, 64]) {
  const bytes = m * MiB;
  const t0 = Date.now();
  let line;
  try {
    const res = await fetch(`${BASE}/api/sync`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body(bytes) });
    const text = (await res.text()).slice(0, 140).replace(/\s+/g, ' ');
    line = { mib: m, status: res.status, server: res.headers.get('server'), type: res.headers.get('content-type'), ms: Date.now() - t0, body: text, application: isApp(res.status, text) };
  } catch (e) {
    const cause = e && e.cause ? `${e.cause.code || e.cause.name}: ${e.cause.message}` : '';
    line = { mib: m, error: String(e && e.message || e).slice(0, 80), cause: cause.slice(0, 100), ms: Date.now() - t0, application: false };
  }
  console.log(JSON.stringify(line));
  if (line.application) lastApp = m; else { firstOther = line; break; }
  await sleep(3000);
}
if (firstOther) console.log(`\nRESULT: the edge answered for itself (or dropped the connection) at ${firstOther.mib} MiB; the largest rung that still reached the application was ${lastApp ?? 'none (below 8)'} MiB. The ceiling is between them.`);
else console.log(`\nRESULT: every rung up to 64 MiB got the APPLICATION's own answer - no ceiling observed at or below 64 MiB (the edge carries at least 64 MiB; Express's own limit is the only ceiling in play).`);
