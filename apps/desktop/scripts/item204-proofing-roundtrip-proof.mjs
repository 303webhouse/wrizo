// ITEM 204 PART 2 — A REAL ROUND TRIP THROUGH GET/PUT /proofing.
//
// TWO client stores against the REAL routes, built on FIX's 198 instrument's
// method (`sync-incremental-pull-proof.mjs`) rather than a new one:
//   · THE SERVER is the real `apps/server/src/sync.ts` router, bundled with
//     esbuild, its `/proofing` handlers invoked directly.
//   · THE DEVICES are two real instances of `store/proofing.ts`, each with its own
//     localStorage, driven through the real `syncProofing()` — the GET-merge-PUT
//     loop the app itself runs. `fetch` is routed into the handlers, so the client
//     code under test is unmodified.
//   · THE POOL interprets ONLY the two statements these endpoints send, FROM THEIR
//     OWN SQL TEXT, and learns whether `users.proofing` exists by reading
//     `migrate.ts`'s own alter statements. So a missing migration line THROWS
//     exactly as Postgres would ("column does not exist") — the column is
//     load-bearing in this instrument, not decorative.
//
// ⚠ ONE CORRECTION TO THE INSTRUCTION, STATED RATHER THAN QUIETLY RESOLVED. The
// ask was "on real Postgres as FIX's 198 instrument did." 198 does NOT use
// Postgres — its own header says "no box turn, no browser, NO POSTGRES", and its
// pool is a reader of the real SQL. And this repo has no Postgres available to a
// script: no `embedded-postgres`, no `pg-mem`, no testcontainers in any
// package.json. So this follows 198's ACTUAL method, which is the proven
// instrument here. If real Postgres was meant literally, it needs tooling this
// repo does not have and is a decision, not a build step — flagged for routing.
//
// FALSIFICATION IS PART OF THE VERDICT (`--mutants`): each load-bearing edit is
// removed ALONE and every mutant must go red on a dynamic claim.
//
// Run: node apps/desktop/scripts/item204-proofing-roundtrip-proof.mjs [--mutants]
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const RUN_MUTANTS = process.argv.includes('--mutants');
const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..', '..', '..');
const desktopSrc = join(repo, 'apps/desktop/src');
const serverSrc = join(repo, 'apps/server/src');
const SYNC_PATH = join(serverSrc, 'sync.ts');
const MIGRATE_PATH = join(serverSrc, 'migrate.ts');
const PROOFING_PATH = join(desktopSrc, 'store/proofing.ts');

// ⚠ THE TWO-STEP IS REQUIRED, and copying it was not optional. Under pnpm,
// `esbuild` is in the store but linked into NO package's node_modules, so
// `createRequire(apps/desktop/package.json)('esbuild')` throws MODULE_NOT_FOUND.
// 198 resolves `vite` first and then `esbuild` from VITE's own require, which is
// where it actually lives. Taken verbatim from that instrument rather than
// rediscovered — and the first run of this file proved the shortcut fails.
const desktopRequire = createRequire(join(repo, 'apps/desktop/package.json'));
const viteRequire = createRequire(desktopRequire.resolve('vite'));
const esbuild = viteRequire('esbuild');

const tmp = join(tmpdir(), 'wrizo-item204-roundtrip');
mkdirSync(tmp, { recursive: true });
const stubs = join(tmp, 'stubs');
mkdirSync(stubs, { recursive: true });
writeFileSync(join(stubs, 'db.mjs'), `export const pool = { query: (...a) => globalThis.__fakePool.query(...a) };`);
writeFileSync(join(stubs, 'auth.mjs'), `export const requireAuth = (_q, _s, next) => next();`);

const norm = (s) => s.replace(/\s+/g, ' ').trim().toLowerCase();

// --- the pool: it reads the real SQL, and the real migration ---------------
function proofingColumnExists(migrateText) {
  return /alter table users add column if not exists proofing jsonb/i.test(migrateText);
}

function makePool(migrateText) {
  const hasColumn = proofingColumnExists(migrateText);
  const users = new Map([['u1', { id: 'u1' }]]);
  return {
    hasColumn, users, writes: 0, reads: 0,
    async query(sql, params = []) {
      const s = norm(sql);
      const need = () => {
        if (!hasColumn) throw new Error('column "proofing" of relation "users" does not exist');
      };
      if (/^select proofing from users where id = \$1$/.test(s)) {
        need(); this.reads += 1;
        const row = users.get(params[0]);
        return { rows: row ? [{ proofing: row.proofing ?? null }] : [] };
      }
      if (/^update users set proofing = \$2::jsonb where id = \$1$/.test(s)) {
        need(); this.writes += 1;
        const row = users.get(params[0]);
        if (row) row.proofing = params[1] == null ? null : JSON.parse(params[1]);
        return { rows: [] };
      }
      throw new Error(`fake pool: unmodelled statement — ${s}`);
    },
  };
}

// --- builds ---------------------------------------------------------------
let serverN = 0;
async function buildServer(syncText) {
  const out = join(tmp, `server-${serverN += 1}.cjs`);
  await esbuild.build({
    entryPoints: [SYNC_PATH], bundle: true, platform: 'node', format: 'cjs', outfile: out, logLevel: 'silent',
    plugins: [{ name: 'server-stubs', setup(b) {
      b.onResolve({ filter: /^\.\/db$/ }, () => ({ path: join(stubs, 'db.mjs') }));
      b.onResolve({ filter: /^\.\/auth$/ }, () => ({ path: join(stubs, 'auth.mjs') }));
      b.onLoad({ filter: /sync\.ts$/ }, () => ({ contents: syncText, loader: 'ts', resolveDir: serverSrc }));
    } }],
  });
  return createRequire(import.meta.url)(out).syncRouter;
}

let deviceN = 0;
async function buildDevice(proofingText) {
  const out = join(tmp, `device-${deviceN += 1}.mjs`);
  await esbuild.build({
    stdin: { contents: "export * from './store/proofing';", resolveDir: desktopSrc, loader: 'ts' },
    bundle: true, platform: 'node', format: 'esm', outfile: out, logLevel: 'silent',
    plugins: [{ name: 'proofing-src', setup(b) {
      b.onLoad({ filter: /store[\\/]proofing\.ts$/ }, () => ({ contents: proofingText, loader: 'ts', resolveDir: join(desktopSrc, 'store') }));
    } }],
  });
  return import(pathToFileURL(out).href + `?v=${deviceN}`);
}

// Each device gets its OWN storage; the proxy routes by whichever is current.
const storage = { A: new Map(), B: new Map() };
let current = 'A';
globalThis.localStorage = {
  getItem: (k) => (storage[current].has(k) ? storage[current].get(k) : null),
  setItem: (k, v) => { storage[current].set(k, String(v)); },
  removeItem: (k) => { storage[current].delete(k); },
  clear: () => { storage[current].clear(); },
};

// --- the route, invoked directly -----------------------------------------
function handlersFrom(router) {
  const find = (method) => {
    const layer = router.stack.find((l) => l.route && l.route.path === '/proofing' && l.route.methods[method]);
    if (!layer) throw new Error(`the router has no ${method.toUpperCase()} /proofing route`);
    // The stack is [requireAuth?, handler]; the last is the asyncHandler-wrapped one.
    return layer.route.stack[layer.route.stack.length - 1].handle;
  };
  return { get: find('get'), put: find('put') };
}

// The route's errors are routed into a REJECTION rather than thrown loose. The
// first version threw from inside `next`, which escaped the handler's own promise
// chain as an unhandled rejection and crashed the whole run after correctly killing
// the first mutant — so a real finding was nearly lost to the instrument dying
// immediately after reporting it.
async function call(handler, body) {
  return new Promise((resolve, reject) => {
    const req = { session: { userId: 'u1' }, body };
    const res = { json: (v) => resolve(v), status: () => res };
    Promise.resolve(handler(req, res, (e) => (e ? reject(e) : resolve(null)))).catch(reject);
  });
}

// `fetch`, routed into the real handlers. The client code is unmodified.
function installFetch(h) {
  globalThis.fetch = async (url, opts = {}) => {
    if (!String(url).includes('/api/proofing')) throw new Error(`unexpected fetch: ${url}`);
    // A route error becomes a NON-OK RESPONSE, which is what the client would
    // actually see from a 500 — not a thrown exception. That keeps the client's own
    // error handling under test instead of bypassed.
    try {
      if ((opts.method ?? 'GET').toUpperCase() === 'GET') {
        const payload = await call(h.get, undefined);
        return { ok: true, json: async () => payload };
      }
      const payload = await call(h.put, JSON.parse(opts.body));
      return { ok: true, json: async () => payload };
    } catch (e) {
      return { ok: false, status: 500, json: async () => ({ error: String(e && e.message || e) }) };
    }
  };
}

// --- the world ------------------------------------------------------------
async function makeWorld(syncText, migrateText, proofingText) {
  const router = await buildServer(syncText);
  const pool = makePool(migrateText);
  globalThis.__fakePool = pool;
  installFetch(handlersFrom(router));
  storage.A = new Map(); storage.B = new Map();
  const A = await buildDevice(proofingText);
  const B = await buildDevice(proofingText);
  const on = async (dev, fn) => { current = dev; return fn(); };
  return { pool, A, B, on };
}

// --- claims ---------------------------------------------------------------
async function runClaims(w, report) {
  const out = [];
  const ok = (name, pass, detail = '') => { out.push({ name, pass, detail }); if (report) report(name, pass, detail); };

  try {
    // K1 — THE REQUIREMENT: two devices, two words, both survive.
    await w.on('A', async () => { w.A.addProofingWord('Karrowmere'); await w.A.syncProofing(); });
    await w.on('B', async () => { w.B.addProofingWord('Tessaly'); await w.B.syncProofing(); });
    await w.on('A', async () => { await w.A.syncProofing(); });
    const aSet = await w.on('A', () => [...w.A.proofingWordSet(w.A.getProofing())].sort());
    const bSet = await w.on('B', () => [...w.B.proofingWordSet(w.B.getProofing())].sort());
    const col = [...Object.keys(w.pool.users.get('u1').proofing?.words ?? {})].sort();
    ok('K1: a word added on device A and another on device B survive on BOTH devices and in the column — the requirement, through the real routes',
      aSet.join(',') === 'karrowmere,tessaly' && bSet.join(',') === 'karrowmere,tessaly' && col.join(',') === 'karrowmere,tessaly',
      JSON.stringify({ A: aSet, B: bSet, column: col }));

    // K2 — the boot pull MERGES rather than replaces: a device with a local word
    // syncs against a server record that does not have it, and keeps it.
    await w.on('B', async () => { w.B.addProofingWord('Ilmarren'); });
    const bBefore = await w.on('B', () => w.B.proofingWordSet(w.B.getProofing()).has('ilmarren'));
    await w.on('B', async () => { await w.B.syncProofing(); });
    const bAfter = await w.on('B', () => w.B.proofingWordSet(w.B.getProofing()).has('ilmarren'));
    const colHas = 'ilmarren' in (w.pool.users.get('u1').proofing?.words ?? {});
    ok('K2: a word held ONLY on a device survives its own sync and reaches the column — the boot pull merges, it does not replace (this is the page_defaults line that would have destroyed it)',
      bBefore && bAfter && colHas, JSON.stringify({ bBefore, bAfter, colHas }));

    // K3 — a REMOVE travels: the tombstone reaches the other device.
    await w.on('A', async () => { await w.A.syncProofing(); w.A.removeProofingWord('Tessaly'); await w.A.syncProofing(); });
    await w.on('B', async () => { await w.B.syncProofing(); });
    const bHasRemoved = await w.on('B', () => w.B.proofingWordSet(w.B.getProofing()).has('tessaly'));
    const bKeepsTombstone = await w.on('B', () => !!w.B.getProofing().words.tessaly?.removedAt);
    ok('K3: a remove on A reaches B as a TOMBSTONE — the word is gone from the live set and the tombstone is kept, which is what stops the other device resurrecting it',
      bHasRemoved === false && bKeepsTombstone === true, JSON.stringify({ bHasRemoved, bKeepsTombstone }));

    // K4 — the dialect round-trips (a scalar, whole-value).
    await w.on('A', async () => { w.A.setProofingDialect('en-GB'); await w.A.syncProofing(); });
    await w.on('B', async () => { await w.B.syncProofing(); });
    const bDialect = await w.on('B', () => w.B.getProofing().dialect);
    ok('K4: the dialect set on A reaches B through the same round trip', bDialect === 'en-GB', JSON.stringify({ bDialect }));

    // K5 — the column was actually used: reads and writes happened.
    ok('K5: the real SQL ran — the pool served reads and writes it interpreted from the endpoints\' own statements',
      w.pool.reads > 0 && w.pool.writes > 0, JSON.stringify({ reads: w.pool.reads, writes: w.pool.writes }));
  } catch (e) {
    ok('the world threw', false, String(e && e.message || e));
  }
  return out;
}

// --- baseline -------------------------------------------------------------
const syncText = readFileSync(SYNC_PATH, 'utf8');
const migrateText = readFileSync(MIGRATE_PATH, 'utf8');
const proofingText = readFileSync(PROOFING_PATH, 'utf8');

let failures = 0;
console.log('BASELINE — two devices, the real routes, the real client store\n');
{
  const w = await makeWorld(syncText, migrateText, proofingText);
  const results = await runClaims(w, (name, pass, detail) => {
    console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${detail}]` : ''}`);
    if (!pass) failures += 1;
  });
  void results;
}

// --- mutants --------------------------------------------------------------
if (RUN_MUTANTS) {
  console.log('\nMUTANTS — each load-bearing edit removed ALONE; every one must go red\n');
  const MUTANTS = [
    {
      name: 'the migration line removed (the column does not exist)',
      migrate: (t) => t.replace(/await pool\.query\(`alter table users add column if not exists proofing jsonb`\);/,
        '/* mutant: column add removed */'),
    },
    {
      name: 'the PUT stores nothing (the write is dropped)',
      sync: (t) => t.replace(/await pool\.query\(`update users set proofing = \$2::jsonb where id = \$1`,\s*\[userId, JSON\.stringify\(next\)\]\);/s,
        '/* mutant: write dropped */'),
    },
    {
      name: 'the client merge becomes a REPLACE (incoming wins whole)',
      proofing: (t) => t.replace(/export function mergeProofing\(a: ProofingRecord \| null, b: ProofingRecord \| null\): ProofingRecord \{/,
        'export function mergeProofing(a: ProofingRecord | null, b: ProofingRecord | null): ProofingRecord {\n  if (b) return compactProofing(b);   // mutant: replace, not merge'),
    },
    {
      name: 'a remove DELETES instead of tombstoning',
      proofing: (t) => t.replace(/current = \{ \.\.\.current, words: \{ \.\.\.current\.words, \[key\]: \{ \.\.\.existing, removedAt: now \} \} \};/,
        'const { [key]: _gone, ...rest } = current.words; current = { ...current, words: rest };   // mutant: hard delete'),
    },
    {
      name: 'the client PUSHES its own record instead of the merged one',
      proofing: (t) => t.replace(/body: JSON\.stringify\(\{ proofing: merged \}\),/, 'body: JSON.stringify({ proofing: current }),   // mutant'),
    },
  ];

  for (const m of MUTANTS) {
    const s = m.sync ? m.sync(syncText) : syncText;
    const mi = m.migrate ? m.migrate(migrateText) : migrateText;
    const pr = m.proofing ? m.proofing(proofingText) : proofingText;
    // The mutation must LAND, or a green proves nothing.
    const landed = (m.sync && s !== syncText) || (m.migrate && mi !== migrateText) || (m.proofing && pr !== proofingText);
    if (!landed) { console.log(`✗ ${m.name}\n    MUTATION DID NOT LAND — no conclusion drawn`); failures += 1; continue; }
    let red = false;
    let why = '';
    try {
      const w = await makeWorld(s, mi, pr);
      const results = await runClaims(w, null);
      const bad = results.find((r) => !r.pass);
      red = !!bad;
      why = bad ? bad.name.split(':')[0] : '';
    } catch (e) {
      red = true; why = 'threw: ' + String(e && e.message || e).slice(0, 60);
    }
    console.log(`${red ? '+ KILLED' : '* SURVIVED'}  ${m.name}${red ? `  (${why})` : ''}`);
    if (!red) failures += 1;
  }
}

console.log('\n' + (failures === 0
  ? `ITEM 204 ROUND TRIP: CLEAN${RUN_MUTANTS ? ' — and every mutant went red' : ''}`
  : `ITEM 204 ROUND TRIP: ${failures} FAILURE(S)`));
process.exit(failures === 0 ? 0 : 1);
