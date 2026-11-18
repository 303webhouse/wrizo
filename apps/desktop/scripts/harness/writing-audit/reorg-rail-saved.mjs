// BROWSERLESS CHECK for the reorg rail's saved data (POLISH; Nick's ruling Nov 18, 1:56 pm: her pinned Projects and their order, each Project's
// box - letters, colour, picture - and the list-or-boxes switch are SAVED WITH THE ACCOUNT; Fable accepted the storage plan and said GO,
// Nov 18, 2:45 pm: "red first on 3584a574 (two devices acting at once), then the fix").
//
// THE REAL CODE, TWO (AND MORE) DEVICES. Each device is its own copy of the app's modules (src/reorg/railMemory.ts - the rail's one door - with
// the persistence layer and the sync engine), bundled with the esbuild that ships with vite, each with its OWN storage, window, fetch and
// timers (bound per bundle, so devices can interleave across awaits without sharing anything). The SERVER is the real rules module
// (apps/server/src/rail.ts: compare-and-swap, the purge filter, the picture checks) over an in-memory store that keeps the SQL's contract
// (railRoutes.ts: jsonb equality is semantic; a picture is last-picked-wins per Project; a purge strips the Project's pin, box and bytes),
// plus a /sync double for drawers. A fake clock makes every "at once" exact. NOT covered here: the SQL itself (no Postgres on the box or
// on Actions); the rules it runs are this file's.
//
//   R1  a reload keeps her pins, their order, the view, letters, colour and picture (offline: the local copy alone)
//   R2  a second device sees all of it, the picture as the server's bytes under its sha
//   R3  two devices pin DIFFERENT Projects at once: both pins everywhere, in one order
//   R4  letters on one device, a colour on the other, same Project, at once: both kept
//   R5  a Project renamed on one device while the other pins it: the name and the pin both stand
//   R6  two devices' rounds interleave (GET, GET, PUT, PUT): the second PUT is refused 409, merged again, and nothing is lost
//   R7  a Project deleted for good loses its pin, box and picture on the server, and a stale device cannot send them back
//   R8  a Project in the Trash keeps its pin (the rail hides it at read time) and Restore brings it back
//   R9  the picture's rules: over 64 KB 413, SVG 415, GIF 415, a JSON body 415, a PNG 200; a rail over 256 KB 413
//   R10 sign-out clears the local copy and the rail
//   R11 switch off: no storage key, no rail request
//   R12 the wiring: an act made signed in reaches the server by itself one second later
//   U1-U3 the merge: same result from either side, merging twice changes nothing, a tie settles by value, a stamped empty wins
// RED on 3584a574 (the rail held memory only). Run: node scripts/harness/writing-audit/reorg-rail-saved.mjs (from apps/desktop; on Actions via
// writing-audit.yml, script=reorg-rail-saved.mjs). Exit 1 on any failure.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(here, '..', '..', '..', 'src');
const SERVER_RAIL = path.resolve(here, '..', '..', '..', '..', 'server', 'src', 'rail.ts');
const require = createRequire(import.meta.url);
const esbuild = createRequire(require.resolve('vite'))('esbuild');
const NL = String.fromCharCode(10);

let fails = 0;
let checks = 0;
const ok = (cond, msg) => { checks += 1; console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`); if (!cond) fails += 1; };

const hasSaved = fs.existsSync(path.join(SRC, 'reorg/railSaved.ts'));
const hasServer = fs.existsSync(SERVER_RAIL);
console.log(`INFO tree: railSaved.ts ${hasSaved ? 'present' : 'ABSENT'}; server rail.ts ${hasServer ? 'present' : 'ABSENT'}`);

// ---- the clock ---------------------------------------------------------------------------------------------------------
let fakeNow = Date.parse('2026-11-18T15:00:00.000Z');
const RealDate = Date;
globalThis.Date = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(fakeNow); } static now() { return fakeNow; } };
const tick = (ms = 1000) => { fakeNow += ms; };
const turns = async (n = 40) => { for (let i = 0; i < n; i += 1) await new Promise((r) => setImmediate(r)); };
const clone = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
const canon = (v) => {
  if (Array.isArray(v)) return `[${v.map(canon).join(',')}]`;
  if (v && typeof v === 'object') return `{${Object.keys(v).sort().filter((k) => v[k] !== undefined).map((k) => `${JSON.stringify(k)}:${canon(v[k])}`).join(',')}}`;
  return JSON.stringify(v ?? null);
};

// ---- the server: the real rules over an in-memory store ----------------------------------------------------------------
const USER = 'user-1';
const db = { rail: null, pictures: new Map(), purged: new Set(), casFails: 0, railPuts: 0, rows: { drawers: new Map(), projects: new Map(), journalEntries: new Map() } };
let rules = null;
if (hasServer) {
  const built = await esbuild.build({ entryPoints: [SERVER_RAIL], bundle: true, format: 'esm', write: false, platform: 'node', logLevel: 'silent' });
  rules = await import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].text).toString('base64'));
}
const memStore = {
  async getRail() { return clone(db.rail); },
  // `rail is not distinct from $base::jsonb`: jsonb equality is semantic, so key order does not count
  async casRail(_u, base, next) { if (canon(db.rail) !== canon(base)) { db.casFails += 1; return false; } db.rail = clone(next); return true; },
  async purgedDrawerIds(_u, ids) { return new Set(ids.filter((i) => db.purged.has(i))); },
  async getPicture(_u, id) { return db.pictures.get(id) || null; },
  async putPicture(_u, id, pic) { const cur = db.pictures.get(id); if (cur && !(pic.pickedAt > cur.pickedAt)) return 'older'; db.pictures.set(id, { ...pic, bytes: new Uint8Array(pic.bytes) }); return 'stored'; },
  async pictureCount() { return db.pictures.size; },
  async deletePictureIfOlder(_u, id, at) { const cur = db.pictures.get(id); if (cur && cur.pickedAt < at) db.pictures.delete(id); },
};
// railRoutes.purgeRailDrawer, as writeShell calls it for a drawer deleted for good
function purgeRailDrawer(id) {
  db.purged.add(id);
  if (db.rail) { if (db.rail.pins) delete db.rail.pins[id]; if (db.rail.boxes) delete db.rail.boxes[id]; }
  db.pictures.delete(id);
}
const reply = (r) => new Response(r.bytes ? r.bytes : JSON.stringify(r.json ?? {}), { status: r.status, headers: r.headers || { 'Content-Type': 'application/json' } });
const requests = [];
async function serve(tag, url, opts = {}) {
  const u = new URL(url, 'http://wrizo.test');
  const method = (opts.method || 'GET').toUpperCase();
  requests.push(`${tag} ${method} ${u.pathname}`);
  if (!rules || db.down) return new Response('{"error":"not found"}', { status: 404 });
  const hdr = (k) => { const h = opts.headers || {}; const key = Object.keys(h).find((x) => x.toLowerCase() === k.toLowerCase()); return key ? h[key] : undefined; };
  if (u.pathname === '/api/rail' && method === 'GET') return reply(await rules.railGet(memStore, USER));
  if (u.pathname === '/api/rail' && method === 'PUT') { db.railPuts += 1; return reply(await rules.railPut(memStore, USER, JSON.parse(opts.body))); }
  const m = /^\/api\/box-picture\/([^/]+)$/.exec(u.pathname);
  if (m && method === 'GET') return reply(await rules.pictureGet(memStore, USER, decodeURIComponent(m[1]), u.searchParams.get('v') ?? undefined));
  if (m && method === 'PUT') return reply(await rules.picturePut(memStore, USER, decodeURIComponent(m[1]), opts.body instanceof Uint8Array ? opts.body : JSON.parse(opts.body || 'null'), hdr('X-Picked-At')));
  return new Response('{"error":"not found"}', { status: 404 });
}
// the /sync double (the server's rule: a pushed record replaces the stored row only when strictly newer; a pull answers what changed since the cursor)
globalThis.__apiSync = async ({ lastSyncAt, push, pull }) => {
  const now = new Date().toISOString();
  for (const coll of Object.keys(db.rows)) {
    for (const rec of (push && push[coll]) || []) {
      const cur = db.rows[coll].get(rec.id);
      if (!cur || rec.updatedAt > cur.rec.updatedAt || (rec.purgedAt && !cur.rec.purgedAt)) {
        db.rows[coll].set(rec.id, { rec: clone(rec), syncedAt: now });
        if (coll === 'drawers' && rec.purgedAt) purgeRailDrawer(rec.id);   // writeShell -> purgeRailDrawer
      }
    }
  }
  const out = {};
  if (pull !== false) for (const coll of Object.keys(db.rows)) out[coll] = [...db.rows[coll].values()].filter((r) => lastSyncAt === null || r.syncedAt > lastSyncAt).map((r) => clone(r.rec));
  return { serverTime: now, pull: out };
};

// ---- the devices -------------------------------------------------------------------------------------------------------
const stores = {};
const devs = {};
const stubApi = { name: 'stub-api', setup(b) {
  b.onResolve({ filter: /(^|\/)api$/ }, (a) => (a.importer.includes(`${path.sep}store${path.sep}`) || a.importer.includes('/store/') ? { path: 'api-stub', namespace: 'stub-api' } : null));
  b.onLoad({ filter: /.*/, namespace: 'stub-api' }, () => ({ contents: 'export class SyncHttpError extends Error { constructor(status) { super("sync failed: " + status); this.status = status; } } export const apiSync = (p) => globalThis.__apiSync(p); export const postJson = async () => ({ ok: true, json: async () => ({}) });', loader: 'js' }));
} };
let bundleCode = null;
async function bundle() {
  if (bundleCode) return bundleCode;
  const entry = ["export * as mem from './reorg/railMemory';", "export * as persist from './store/persistence';", "export { syncOnce } from './store/sync';", hasSaved ? "export * as saved from './reorg/railSaved';" : ''].join(NL);
  const built = await esbuild.build({ stdin: { contents: entry, resolveDir: SRC, sourcefile: 'entry-rail.ts', loader: 'ts' }, bundle: true, format: 'esm', write: false, platform: 'node', plugins: [stubApi], logLevel: 'silent', define: { 'process.env.NODE_ENV': '"production"' } });
  bundleCode = built.outputFiles[0].text;
  return bundleCode;
}
/** A device: its own module copy over storage `store` (a second copy over the same storage is a reload). `reorg` = the ?reorg=1 switch. */
async function loadDevice(tag, store = tag, { reorg = true } = {}) {
  if (!stores[store]) stores[store] = new Map([['writer-studio-journal-resync-v1', '1']]);
  const ls = stores[store];
  const timers = [];
  const listeners = {};
  const dev = {
    tag,
    hold: null,          // a promise the device's fetch waits on after a GET /api/rail (R6)
    gotRail: null,       // called when that GET has answered
    timers,
    localStorage: { getItem: (k) => (ls.has(k) ? ls.get(k) : null), setItem: (k, v) => ls.set(k, String(v)), removeItem: (k) => ls.delete(k), get length() { return ls.size; }, key: (i) => [...ls.keys()][i] ?? null },
    location: { search: reorg ? '?reorg=1' : '', hash: '', href: `http://wrizo.test/${reorg ? '?reorg=1' : ''}` },
    setTimeout: (fn, ms = 0) => { const t = { fn, ms, done: false }; timers.push(t); return t; },
    clearTimeout: (t) => { if (t) t.done = true; },
    async fetch(url, opts) {
      const res = await serve(tag, url, opts);
      if (dev.hold && String(url).endsWith('/api/rail') && (!opts || !opts.method || opts.method === 'GET')) { const h = dev.hold; dev.hold = null; if (dev.gotRail) dev.gotRail(); await h; }
      return res;
    },
  };
  dev.window = { addEventListener: (t, f) => { (listeners[t] ||= []).push(f); }, removeEventListener() {}, setTimeout: dev.setTimeout, clearTimeout: dev.clearTimeout, localStorage: dev.localStorage, location: dev.location };
  dev.document = { addEventListener() {}, removeEventListener() {}, visibilityState: 'visible', documentElement: { setAttribute() {}, getAttribute() { return null; } } };
  globalThis.__dev = globalThis.__dev || {};
  globalThis.__dev[tag] = dev;
  const prelude = ['localStorage', 'location', 'window', 'document', 'setTimeout', 'clearTimeout'].map((n) => `const ${n} = globalThis.__dev[${JSON.stringify(tag)}].${n};`).join(NL)
    + `${NL}const fetch = (u, o) => globalThis.__dev[${JSON.stringify(tag)}].fetch(u, o);${NL}`;
  const code = prelude + (await bundle()) + `${NL}// device ${tag}`;
  dev.mod = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
  /** run the device's due timers (the rail's own scheduled rounds), then let them finish */
  dev.runTimers = async () => { for (let pass = 0; pass < 5; pass += 1) { const due = timers.filter((t) => !t.done); if (!due.length) break; for (const t of due) { t.done = true; t.fn(); } await turns(); } };
  devs[tag] = dev;
  return dev;
}
const round = async (d) => { if (d.mod.saved) await d.mod.saved.syncRail(); };
const pinsOf = (d) => [...d.mod.mem.getRailMemory().pins];
const viewOf = (d) => d.mod.mem.getRailMemory().pinView;
const lookOf = (d, id) => d.mod.mem.getBoxes()[id] || {};
const syncDev = async (d) => { await d.mod.syncOnce(); d.timers.forEach((t) => { t.done = true; }); };   // its status goes 'synced'; the round it schedules is run by hand below
const serverPins = () => (db.rail && db.rail.pins ? Object.entries(db.rail.pins).filter(([, p]) => !(p.removedAt && p.removedAt >= p.at)).map(([id]) => id).sort() : []);
const sorted = (a) => [...a].sort();

// a tiny but real WebP (RIFF....WEBP) - the server sniffs its first bytes, so a picture's header must be the real thing
const webp = (seed) => { const b = new Uint8Array(64); b.set([0x52, 0x49, 0x46, 0x46, 56, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]); for (let i = 12; i < b.length; i += 1) b[i] = (seed * 31 + i) & 255; return b; };
async function setPicture(d, id, bytes) {
  if (d.mod.saved) await d.mod.saved.setBoxPictureSaved(id, bytes, 'image/webp');
  else d.mod.mem.setBoxLook(id, { picture: `data:image/webp;base64,${Buffer.from(bytes).toString('base64')}` });
}
const shaOf = async (bytes) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map((x) => x.toString(16).padStart(2, '0')).join('');

// ---- the fixture: five Projects on A, synced to the server and to B ----------------------------------------------------------
const A = await loadDevice('A');
const B = await loadDevice('B');
const P = [];
await A.mod.persist.createDrawer('Novel');
for (const name of ['Thesis', 'Letters', 'Stories', 'Scripts', 'Essays']) { tick(); A.mod.persist.createDrawer(name); }
A.mod.persist.flushNow();
for (const d of A.mod.persist.getDrawers()) P.push(d.id);
tick(); await syncDev(A); tick(); await syncDev(B); tick();
ok(P.length === 6 && B.mod.persist.getDrawers().length === 6, `FIXTURE six Projects on A, the same six on B (A ${P.length}, B ${B.mod.persist.getDrawers().length})`);
const [P1, P2, P3, P4, P5, P6] = P;

// R1 - a reload keeps them (no round: the local copy alone)
A.mod.mem.togglePin(P1); tick();
A.mod.mem.togglePin(P2); tick();
A.mod.mem.setPinView('list'); tick();
A.mod.mem.setBoxLook(P1, { letters: 'XY' }); tick();
A.mod.mem.setBoxLook(P1, { colour: '#41658A' }); tick();
const pic1 = webp(1);
await setPicture(A, P2, pic1); tick();
const A2 = await loadDevice('A2', 'A');
ok(canon(pinsOf(A2)) === canon([P1, P2]), `R1 a reload keeps her pins in her order: ${JSON.stringify(pinsOf(A2).map((x) => P.indexOf(x) + 1))}`);
ok(viewOf(A2) === 'list', `R1 a reload keeps the view: ${viewOf(A2)}`);
ok(lookOf(A2, P1).letters === 'XY' && lookOf(A2, P1).colour === '#41658A', `R1 a reload keeps the box's letters and colour: ${JSON.stringify(lookOf(A2, P1))}`);
ok(typeof lookOf(A2, P2).picture === 'string' && lookOf(A2, P2).picture.length > 0, `R1 a reload keeps the picture: ${String(lookOf(A2, P2).picture).slice(0, 40)}`);

// R2 - a second device sees it all (A2 is device A from here on)
await syncDev(A2);
await round(A2); tick();
await round(B); tick();
ok(canon(pinsOf(B)) === canon([P1, P2]), `R2 device B sees A's pins in A's order: ${JSON.stringify(pinsOf(B).map((x) => P.indexOf(x) + 1))}`);
ok(viewOf(B) === 'list', `R2 device B sees A's view: ${viewOf(B)}`);
ok(lookOf(B, P1).letters === 'XY' && lookOf(B, P1).colour === '#41658A', `R2 device B sees A's letters and colour: ${JSON.stringify(lookOf(B, P1))}`);
{
  const sha = await shaOf(pic1);
  const url = lookOf(B, P2).picture;
  const served = url && url.startsWith('/api/') ? await serve('B', url) : null;
  const bytes = served && served.ok ? new Uint8Array(await served.arrayBuffer()) : null;
  ok(!!url && url.includes(`v=${sha}`) && !!bytes && Buffer.from(bytes).equals(Buffer.from(pic1)), `R2 device B draws the picture from the server, the same bytes under its sha: ${String(url).slice(0, 60)}`);
}

// R3 - two devices pin different Projects at once
A2.mod.mem.togglePin(P3);
B.mod.mem.togglePin(P4);
tick();
await round(A2); tick(); await round(B); tick(); await round(A2); tick();
ok(sorted(pinsOf(A2)).join() === sorted([P1, P2, P3, P4]).join() && sorted(pinsOf(B)).join() === sorted([P1, P2, P3, P4]).join(), `R3 both devices hold both new pins (A ${pinsOf(A2).length}, B ${pinsOf(B).length})`);
ok(serverPins().join() === sorted([P1, P2, P3, P4]).join(), `R3 the server holds both new pins (${serverPins().length})`);
ok(canon(pinsOf(A2)) === canon(pinsOf(B)), 'R3 both devices show the pins in one order');

// R4 - letters on A, a colour on B, the same Project, at once
A2.mod.mem.setBoxLook(P3, { letters: 'QZ' });
B.mod.mem.setBoxLook(P3, { colour: '#FF9800' });
tick();
await round(A2); tick(); await round(B); tick(); await round(A2); tick();
ok(lookOf(A2, P3).letters === 'QZ' && lookOf(A2, P3).colour === '#FF9800' && lookOf(B, P3).letters === 'QZ' && lookOf(B, P3).colour === '#FF9800', `R4 the letters and the colour both stand on both devices: A ${JSON.stringify(lookOf(A2, P3))} B ${JSON.stringify(lookOf(B, P3))}`);

// R5 - a Project renamed on A while B pins it
A2.mod.persist.renameDrawer(P5, 'Short stories'); A2.mod.persist.flushNow();
B.mod.mem.togglePin(P5);
tick();
await syncDev(A2); tick(); await round(B); tick(); await syncDev(B); tick(); await round(A2); tick();
ok(B.mod.persist.getDrawer(P5)?.name === 'Short stories' && A2.mod.persist.getDrawer(P5)?.name === 'Short stories', `R5 the rename stands on both devices (A "${A2.mod.persist.getDrawer(P5)?.name}", B "${B.mod.persist.getDrawer(P5)?.name}")`);
ok(pinsOf(A2).includes(P5) && pinsOf(B).includes(P5) && serverPins().includes(P5), 'R5 the pin stands on both devices and the server');

// R6 - two rounds interleave: A GETs, B GETs and PUTs, then A PUTs over a base that is no longer there
if (!hasSaved) ok(false, 'R6 no saved rail (src/reorg/railSaved.ts): nothing goes to the server, so there is no round to interleave');
else {
  A2.mod.mem.setBoxLook(P4, { letters: 'AA' });
  B.mod.mem.setPinView('boxes');
  tick();
  const fails0 = db.casFails;
  let release;
  A2.hold = new Promise((r) => { release = r; });
  const gotIt = new Promise((r) => { A2.gotRail = r; });
  const pa = round(A2);
  await gotIt;                     // A has its GET's answer and waits before it PUTs
  await round(B);                  // B: GET, merge, PUT - lands
  A2.gotRail = null;
  release();
  await pa;                        // A: PUT refused 409, GET, merge, PUT
  // read BEFORE B rounds again: B's next round would put its own act back and hide a write-over (the gap compare-and-swap closes)
  const both = !!db.rail && db.rail.view === 'boxes' && !!db.rail.boxes && !!db.rail.boxes[P4] && db.rail.boxes[P4].letters === 'AA';
  tick(); await round(B); tick();
  ok(db.casFails > fails0, `R6 A's stale PUT was refused (409s: ${db.casFails - fails0})`);
  ok(both, 'R6 the server holds both acts right after A\'s round, before B rounds again (nothing written over)');
  ok(lookOf(A2, P4).letters === 'AA' && lookOf(B, P4).letters === 'AA' && viewOf(A2) === 'boxes' && viewOf(B) === 'boxes', `R6 both acts stand on both devices: A letters ${lookOf(A2, P4).letters} view ${viewOf(A2)}; B letters ${lookOf(B, P4).letters} view ${viewOf(B)}`);
  ok(db.rail && db.rail.view === 'boxes' && db.rail.boxes && db.rail.boxes[P4] && db.rail.boxes[P4].letters === 'AA', 'R6 both acts stand on the server');
}

// R7 - a Project deleted for good (P2: pinned, with a picture)
{
  const C = await loadDevice('C');   // a third device, signed in, holding P2 pinned from an earlier round
  await syncDev(C); await round(C); tick();
  const hadIt = pinsOf(C).includes(P2);
  A2.mod.persist.softDeleteDrawer(P2); tick();
  A2.mod.persist.purgeDrawer(P2); A2.mod.persist.flushNow(); tick();
  await syncDev(A2); tick();
  ok(hadIt && !serverPins().includes(P2) && !(db.rail && db.rail.boxes && db.rail.boxes[P2]) && !db.pictures.has(P2), `R7 the server dropped its pin, its box and its picture (stale device held it: ${hadIt})`);
  C.mod.mem.setBoxLook(P2, { letters: 'ZZ' }); tick();   // the stale device even dresses it
  await round(C); tick();
  // (both hold only on the premise that the stale device HAD the pin: an app that never saved it would pass them having sent nothing)
  ok(hadIt && !serverPins().includes(P2) && !(db.rail && db.rail.boxes && db.rail.boxes[P2]), 'R7 a stale device cannot send them back');
  ok(hadIt && !pinsOf(C).includes(P2) && !(C.mod.saved && C.mod.saved.getSavedRail().boxes[P2]), 'R7 the stale device forgets them once told');
}

// R8 - the Trash keeps the pin; Restore brings it back
{
  const before = A2.mod.persist.getDrawer(P1);
  A2.mod.persist.softDeleteDrawer(P1); A2.mod.persist.flushNow(); tick();
  await syncDev(A2); await round(A2); tick();
  ok(!!before && A2.mod.persist.getDrawer(P1) === null && pinsOf(A2).includes(P1) && serverPins().includes(P1), 'R8 a trashed Project keeps its pin (hidden: getDrawer is null; kept on the device and the server)');
  // a restore is the drawer saved again without its deletedAt (there is no drawer restore seam; the record is the app's own, taken before the Trash)
  if (before) { A2.mod.persist.saveDrawer({ ...before, updatedAt: new Date().toISOString() }); A2.mod.persist.flushNow(); }
  tick(); await syncDev(A2); await round(A2); tick();
  ok(!!A2.mod.persist.getDrawer(P1) && pinsOf(A2).includes(P1), 'R8 Restore brings the pinned Project back to the rail');
}

// R9 - the picture's rules (and the rail's own size)
if (!rules) ok(false, 'R9 no server rules (apps/server/src/rail.ts): nothing refuses anything');
else {
  const put = async (body, ct) => (await serve('R9', `/api/box-picture/${P6}`, { method: 'PUT', headers: { 'Content-Type': ct, 'X-Picked-At': new Date().toISOString() }, body })).status;
  const big = new Uint8Array(65 * 1024); big.set(webp(9).subarray(0, 12));
  const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
  const gif = new TextEncoder().encode('GIF89a' + 'x'.repeat(40));
  const png = new Uint8Array(40); png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  tick(); const s413 = await put(big, 'image/webp');
  tick(); const sSvg = await put(svg, 'image/svg+xml');
  tick(); const sGif = await put(gif, 'image/gif');
  tick(); const sJson = await put(JSON.stringify({ a: 1 }), 'application/json');
  tick(); const sPng = await put(png, 'image/png');
  ok(s413 === 413 && sSvg === 415 && sGif === 415 && sJson === 415 && sPng === 200, `R9 65 KB ${s413}, SVG ${sSvg}, GIF ${sGif}, JSON ${sJson}, PNG ${sPng} (want 413 415 415 415 200)`);
  const huge = { pins: {}, boxes: { x: { letters: 'y'.repeat(300 * 1024), lettersAt: new Date().toISOString() } } };
  const sRail = (await serve('R9', '/api/rail', { method: 'PUT', body: JSON.stringify({ rail: huge, base: db.rail }) })).status;
  ok(sRail === 413, `R9 a rail over 256 KB is refused: ${sRail}`);
}

// R10 - sign-out takes it all
B.mod.persist.resetLocalData();
ok(!stores.B.has('writer-studio-rail') && pinsOf(B).length === 0 && Object.keys(B.mod.mem.getBoxes()).length === 0, `R10 sign-out clears the local copy and the rail (key ${stores.B.has('writer-studio-rail') ? 'KEPT' : 'gone'}, pins ${pinsOf(B).length})`);

// R11 - switch off: nothing stored, nothing asked
{
  const O = await loadDevice('O', 'O', { reorg: false });
  await syncDev(O);
  O.mod.mem.togglePin(P3); O.mod.mem.setBoxLook(P3, { letters: 'OO' }); O.mod.mem.setPinView('list');
  await O.runTimers(); await round(O);
  ok(!stores.O.has('writer-studio-rail') && !requests.some((r) => r.startsWith('O ')), `R11 switch off: no storage key, no rail request (${requests.filter((r) => r.startsWith('O ')).length} requests)`);
}

// R12 - the wiring: an act made signed in reaches the server by itself
{
  const W = await loadDevice('W');
  await W.mod.syncOnce();           // status 'synced': signed in
  await W.runTimers(); tick();      // the round a finished sync schedules
  const puts0 = db.railPuts;
  W.mod.mem.togglePin(P6);
  const queued = W.timers.filter((t) => !t.done).map((t) => t.ms);
  tick(1000);
  await W.runTimers();
  ok(queued.includes(1000) && db.railPuts > puts0 && serverPins().includes(P6), `R12 a pin made signed in is on the server one second later (queued ${JSON.stringify(queued)}, PUTs ${db.railPuts - puts0})`);
}

// R13 - switch on, nothing touched: no key, even after rounds that reach no rail (a browser harness under ?reorg=1 reads storage byte for byte);
// a round stores what it learned; a round that learns nothing leaves it byte-identical
{
  const N = await loadDevice('N');
  const fresh = !stores.N.has('writer-studio-rail');
  await syncDev(N); tick();
  db.down = true;
  await round(N); tick(); await round(N); tick();
  db.down = false;
  const untouched = !stores.N.has('writer-studio-rail');
  await round(N); tick();
  const learned = stores.N.get('writer-studio-rail');
  await round(N); tick();
  ok(fresh && untouched && typeof learned === 'string' && learned.includes(P3) && stores.N.get('writer-studio-rail') === learned,
    `R13 switch on and untouched, the device stores nothing (at load ${fresh}, after two rounds that reached no rail ${untouched}); a round stores what it learned (${typeof learned === 'string'}); a round that learns nothing leaves it byte-identical`);
}

// U1-U3 - the merge itself
if (!hasSaved) ok(false, 'U1 U2 U3 no merge (src/reorg/railSaved.ts)');
else {
  const { mergeRail } = A2.mod.saved;
  const t = (s) => `2026-11-18T16:00:${String(s).padStart(2, '0')}.000Z`;
  const x = { pins: { a: { order: 1, at: t(1) }, b: { order: 2, at: t(2), removedAt: t(5) } }, boxes: { a: { letters: 'AB', lettersAt: t(3), colour: '#111111', colourAt: t(3) } }, view: 'list', viewAt: t(4) };
  const y = { pins: { b: { order: 2, at: t(6) }, c: { order: 1, at: t(2) } }, boxes: { a: { letters: 'CD', lettersAt: t(3), colour: '', colourAt: t(9) } }, view: 'boxes', viewAt: t(4) };
  const xy = mergeRail(x, y);
  const yx = mergeRail(y, x);
  ok(canon(xy) === canon(yx), 'U1 merge(a,b) equals merge(b,a)');
  ok(canon(mergeRail(xy, xy)) === canon(xy) && canon(mergeRail(xy, x)) === canon(xy) && canon(mergeRail(xy, y)) === canon(xy), 'U2 merging again changes nothing');
  ok(xy.boxes.a.letters === 'CD' && xy.view === 'list' && xy.boxes.a.colour === '' && !xy.pins.b.removedAt && !!xy.pins.c, `U3 a tie settles by value (letters ${xy.boxes.a.letters}, view ${xy.view}), a stamped empty wins (colour "${xy.boxes.a.colour}"), a later re-pin beats the unpin`);
}

// R14 - the picture queue: a removed picture leaves it, an uploaded one leaves it and is sent once (reorg-rails B2 [successor] found a removed
// picture still queued in the stored copy, run 44410467853 on 3f18ce12)
{
  const Q = await loadDevice('Q');
  await syncDev(Q); tick();
  const queued = () => { try { return Object.keys(JSON.parse(stores.Q.get('writer-studio-rail') || '{}').pending || {}); } catch { return ['unreadable']; } };
  await setPicture(Q, P5, webp(5)); tick();
  const was = queued().includes(P5);
  Q.mod.mem.setBoxLook(P5, { colour: '#41658A', picture: undefined }); tick();   // a swatch pick removes the picture (R5)
  const afterRemove = queued();
  await setPicture(Q, P6, webp(6)); tick();
  const puts = () => requests.filter((r) => r === `Q PUT /api/box-picture/${P6}`).length;
  await round(Q); tick();
  const afterUpload = queued();
  await round(Q); tick(); await round(Q); tick();
  ok(hasSaved && was && afterRemove.length === 0 && afterUpload.length === 0 && puts() === 1,
    `R14 a removed picture leaves the stored queue (${JSON.stringify(afterRemove)}); an uploaded one leaves it (${JSON.stringify(afterUpload)}) and is sent once in three rounds (${puts()})`);
}

// U4 - acts inside one millisecond keep the order she made them in (no tick between them)
{
  const T = await loadDevice('T');
  T.mod.mem.togglePin(P4); T.mod.mem.togglePin(P4); T.mod.mem.togglePin(P4);
  const three = pinsOf(T).includes(P4);
  T.mod.mem.togglePin(P4);
  const four = pinsOf(T).includes(P4);
  T.mod.mem.setBoxLook(P4, { letters: 'AB' }); T.mod.mem.setBoxLook(P4, { letters: 'AA' });
  const T2 = await loadDevice('T2', 'T');   // what was kept says the same
  ok(three && !four && lookOf(T, P4).letters === 'AA' && pinsOf(T2).includes(P4) === false && lookOf(T2, P4).letters === 'AA',
    `U4 pin, unpin, pin in one millisecond leaves it pinned (${three}), a fourth unpins it (${!four}); letters AB then AA in one millisecond read AA (${lookOf(T, P4).letters}, kept ${lookOf(T2, P4).letters})`);
}

console.log(`INFO checks ${checks}, failing ${fails}`);
console.log(`REORG-RAIL-SAVED: ${fails ? `FAIL - ${fails}` : 'PASS'}`);
process.exit(fails ? 1 : 0);
