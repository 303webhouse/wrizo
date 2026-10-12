// ITEM 224(a) — SYNC INTEGRITY. The server names which pushed records it
// could NOT store (per collection, by id); the client keeps exactly those
// ids dirty instead of marking the whole successful batch clean, and names
// them in the sync notice — like 203's quarantine, but a different
// population (sent-and-refused, not withheld-for-size) and a different
// disposition (retried, not excluded).
//
// Two halves, both browserless, both loaded from the REAL files (transpiled
// with the repo's own TypeScript, never re-typed):
//   PART A — the server's real POST /sync handler, a fake `./db` pool
//   (modeling exactly its own insert statements, never its logic) that can
//   be told to fail for one chosen id, proving the response names it.
//   PART B — the client's real syncOnce()/cleanBatch(), with ./persistence,
//   ./api and ./entryText stubbed (the three things it talks to) and a
//   trivial in-memory localStorage polyfill (Node has none), proving a
//   rejected id is excluded from markClean and ends up in getRejectedRecords().
//
// Run: node scripts/harness/item224a-sync-integrity.mjs   (from apps/desktop).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.resolve(here, '..', '..');
const DESKTOP_SRC = path.join(DESKTOP, 'src');
const SERVER = path.resolve(DESKTOP, '..', 'server');
const SERVER_SRC = path.join(SERVER, 'src');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });

const dtRequire = createRequire(path.join(DESKTOP, 'package.json'));
const svRequire = createRequire(path.join(SERVER, 'package.json'));
const ts = dtRequire('typescript');

// Two SEPARATE scratch roots, each inside its own package — a file's own
// location is what Node walks up from to find node_modules (express,
// typescript, …), independent of which `createRequire` base loaded it.
const tmpServer = path.join(SERVER, '.item224a-harness-scratch');
const tmpDesktop = path.join(DESKTOP, '.item224a-harness-scratch');
fs.rmSync(tmpServer, { recursive: true, force: true });
fs.rmSync(tmpDesktop, { recursive: true, force: true });
fs.mkdirSync(tmpServer, { recursive: true });
fs.mkdirSync(tmpDesktop, { recursive: true });

function stripTypes(reqFn, src) {
  return ts.transpileModule(src, { compilerOptions: { module: reqFn === svRequire ? ts.ModuleKind.CommonJS : ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
}

// =============================================================================
// PART A — the server's real /sync route.
// =============================================================================
function makeFakeDb(failIds) {
  const calls = [];
  return {
    calls,
    async query(sql, params = []) {
      calls.push(sql.trim().split('\n')[0]);
      // dbNow() reads rows[0].t directly (no params) — a real row, or it
      // throws on `undefined.t`, unrelated to anything this proof is about.
      if (/select now\(\) as t/i.test(sql)) return { rows: [{ t: new Date().toISOString() }] };
      // pull() (`select * from <table> where user_id = ...`) only ever
      // reads the rows ARRAY, never rows[0] — empty is a valid, honest
      // "nothing to pull" answer.
      if (/^select \* from/i.test(sql.trim())) return { rows: [] };
      // Every upsert's own first bound param is the record's id (checked
      // against each function's own signature above — projects/storyPlans/
      // sessions/drafts/drawers/journalEntries all bind id as $1).
      const id = params[0];
      if (failIds.has(id)) { const e = new Error('simulated DB failure'); e.code = 'HARNESS_FAIL'; throw e; }
      return { rows: [] };
    },
  };
}
function loadSyncRouter(failIds, { sourceOverride } = {}) {
  for (const p of Object.keys(svRequire.cache || {})) { if (p.startsWith(tmpServer)) delete svRequire.cache[p]; }
  function write(rel, text) {
    const dest = path.join(tmpServer, rel.replace(/\.ts$/, '.js'));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, text);
    return dest;
  }
  write('env.ts', stripTypes(svRequire, fs.readFileSync(path.join(SERVER_SRC, 'env.ts'), 'utf8')));
  write('asyncHandler.ts', stripTypes(svRequire, fs.readFileSync(path.join(SERVER_SRC, 'asyncHandler.ts'), 'utf8')));
  // logError (server-hardening, merged in) — sync.ts now imports it.
  write('logSafe.ts', stripTypes(svRequire, fs.readFileSync(path.join(SERVER_SRC, 'logSafe.ts'), 'utf8')));
  // B10.1 — sync.ts now imports ./build (the served client build). Loaded for real; with no dist-web beside the scratch copy it reports null.
  write('build.ts', stripTypes(svRequire, fs.readFileSync(path.join(SERVER_SRC, 'build.ts'), 'utf8')));
  fs.writeFileSync(path.join(tmpServer, 'auth.js'), 'exports.requireAuth = (req, res, next) => next();\r\n');
  const dbDest = path.join(tmpServer, 'db.js');
  fs.writeFileSync(dbDest, '');
  svRequire.cache[dbDest] = { id: dbDest, filename: dbDest, loaded: true, exports: { pool: makeFakeDb(failIds) } };
  const src = sourceOverride ?? fs.readFileSync(path.join(SERVER_SRC, 'sync.ts'), 'utf8');
  const dest = write('sync.ts', stripTypes(svRequire, src));
  return svRequire(dest).syncRouter;
}
function findHandler(router, routePath, method) {
  for (const layer of router.stack) {
    if (layer.route && layer.route.path === routePath && layer.route.methods[method]) {
      const stack = layer.route.stack;
      return stack[stack.length - 1].handle;
    }
  }
  throw new Error(`route not found: ${method.toUpperCase()} ${routePath}`);
}
async function callSync(router, body) {
  const req = { body, session: { userId: 'harness-user' } };
  return new Promise((resolve) => {
    const res = { statusCode: 200 };
    res.status = (c) => { res.statusCode = c; return res; };
    res.json = (b) => { resolve({ status: res.statusCode, body: b }); return res; };
    findHandler(router, '/sync', 'post')(req, res, (err) => resolve({ status: 599, body: { thrown: String(err) } }));
  });
}
process.env.SESSION_SECRET = 'harness-secret';
process.env.DATABASE_URL = 'postgres://unused/unused';

const NOW = '2026-10-01T00:00:00.000Z';
const project = (id, title) => ({ id, title, type: 'creative', createdAt: NOW, updatedAt: NOW });

{
  const router = loadSyncRouter(new Set(['bad-project']));
  const r = await callSync(router, { lastSyncAt: null, push: { projects: [project('good-project', 'Good'), project('bad-project', 'Bad')] }, pull: false });
  ok('(A1) a per-record DB failure is NAMED in the response — rejected.projects contains exactly the failing id',
    r.status === 200 && Array.isArray(r.body?.rejected?.projects) && r.body.rejected.projects.length === 1 && r.body.rejected.projects[0] === 'bad-project',
    JSON.stringify(r.body?.rejected));
  ok('(A1) the GOOD record in the SAME push is NOT named as rejected',
    !(r.body?.rejected?.projects ?? []).includes('good-project'), JSON.stringify(r.body?.rejected));

  const malformed = { id: 'no-dates-project', title: 'Missing dates' }; // no createdAt/updatedAt
  const r2 = await callSync(router, { lastSyncAt: null, push: { projects: [malformed] }, pull: false });
  ok('(A2) a MALFORMED record (missing required fields, previously silently dropped with no signal at all) is also named by id',
    (r2.body?.rejected?.projects ?? []).includes('no-dates-project'), JSON.stringify(r2.body?.rejected));

  const r3 = await callSync(router, { lastSyncAt: null, push: { projects: [project('clean-project', 'Clean')] }, pull: false });
  ok('(A3) when NOTHING is rejected, the `rejected` key is ABSENT entirely — not an empty object — the same "absence is the healthy state" convention delta/bible/selection already use',
    r3.status === 200 && !('rejected' in (r3.body ?? {})), JSON.stringify(Object.keys(r3.body ?? {})));

  const realSrc = fs.readFileSync(path.join(SERVER_SRC, 'sync.ts'), 'utf8');
  const anchor = "    } catch (err) {\r\n      logError('sync', err, { kind: 'project', id: p.id });\r\n      rejected.push(p.id);\r\n    }\r\n  }\r\n  return rejected;\r\n}";
  if (!realSrc.includes(anchor)) throw new Error('(A) mutation anchor not found — update this harness');
  const mutatedSrc = realSrc.replace(anchor, "    } catch (err) {\r\n      logError('sync', err, { kind: 'project', id: p.id });\r\n    }\r\n  }\r\n  return rejected;\r\n}");
  const mutRouter = loadSyncRouter(new Set(['mutant-bad']), { sourceOverride: mutatedSrc });
  const rMut = await callSync(mutRouter, { lastSyncAt: null, push: { projects: [project('mutant-bad', 'Bad')] }, pull: false });
  ok('(A) MUTATION KILLED: with the rejection push removed from the catch block, the SAME failing record no longer appears anywhere in the response — confirms the real line is what surfaces it',
    !('rejected' in (rMut.body ?? {})), JSON.stringify(rMut.body));
}

// =============================================================================
// PART B — the client's real syncOnce()/cleanBatch().
// =============================================================================
globalThis.localStorage = (() => {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: (k) => { store.delete(k); },
    clear: () => store.clear(),
  };
})();

function emptyRecords() { return { projects: [], storyPlans: [], sessions: [], drafts: [], journalEntries: [], drawers: [] }; }

function loadSyncClient() {
  for (const p of Object.keys(dtRequire.cache || {})) { if (p.startsWith(tmpDesktop)) delete dtRequire.cache[p]; }
  function write(rel, text) {
    const dest = path.join(tmpDesktop, rel.replace(/\.ts$/, '.mjs'));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    text = text.replace(/from (['"])(\.\.?\/[^'"]+)\1/g, (m, q, spec) => `from ${q}${spec}.mjs${q}`);
    fs.writeFileSync(dest, text);
    return dest;
  }
  // Stub persistence.ts: a tiny real in-memory store, not a re-implementation
  // of sync.ts's own logic — getDirtyRecords/markClean/applyRemoteRecords/
  // markAllJournalEntriesDirty are ALL sync.ts needs from it.
  let store = emptyRecords();
  const cleaned = [];
  write('store/persistence.ts', [
    "let __store = " + JSON.stringify(emptyRecords()) + ";",
    "export function __setStore(s) { __store = s; }",
    "export function __cleaned() { return __cleanedIds; }",
    "export function __resetCleaned() { __cleanedIds.length = 0; }",
    "export const __cleanedIds = [];",
    "export function getDirtyRecords() { return JSON.parse(JSON.stringify(__store)); }",
    "export function markClean(items) { __cleanedIds.push(...items.map((i) => i.id)); }",
    "export function applyRemoteRecords() {}",
    "export function markAllJournalEntriesDirty() {}",
    // B10.1 - the safety net reads these two; this proof's fixtures never pull journal entries.
    "export function getJournalEntries() { return []; }",
    "export function getSystemKind() { return undefined; }",
  ].join('\n'));
  // Stub entryText.ts: sync.ts's titleFor() reads boardName() only for the
  // journalEntries branch, which this proof's fixtures never exercise.
  write('store/entryText.ts', "export function boardName(text, fallback) { const line = (text || '').split('\\n')[0]; return line || fallback; }");
  // Stub api.ts: a scriptable apiSync(), and the real SyncHttpError SHAPE
  // (sync.ts's own instanceof check needs a real class, not a plain object).
  write('store/api.ts', [
    "export class SyncHttpError extends Error { constructor(status) { super('sync failed: ' + status); this.status = status; } }",
    "let __next = null;",
    "export const __calls = [];",
    "export function __setNextResponse(r) { __next = r; }",
    "export async function apiSync(payload) { __calls.push(payload); if (__next instanceof Error) throw __next; return __next; }",
  ].join('\n'));
  // storageHealth (storage-full, merged in) — the real file, transpiled; it has no imports.
  write('store/storageHealth.ts', stripTypes(dtRequire, fs.readFileSync(path.join(DESKTOP_SRC, 'store/storageHealth.ts'), 'utf8')));
  // B10.1 - the stale-client guard's two leaf modules, the real files. No build is known here, so the guard never trips.
  write('store/clientBuild.ts', stripTypes(dtRequire, fs.readFileSync(path.join(DESKTOP_SRC, 'store/clientBuild.ts'), 'utf8')));
  write('store/staleClient.ts', stripTypes(dtRequire, fs.readFileSync(path.join(DESKTOP_SRC, 'store/staleClient.ts'), 'utf8')));
  const dest = write('store/sync.ts', stripTypes(dtRequire,fs.readFileSync(path.join(DESKTOP_SRC, 'store/sync.ts'), 'utf8')));
  return { mod: import(`file://${dest.replace(/\\/g, '/')}?t=${Date.now()}`), persistencePath: path.join(tmpDesktop, 'store/persistence.mjs'), apiPath: path.join(tmpDesktop, 'store/api.mjs') };
}

{
  const { mod, persistencePath, apiPath } = loadSyncClient();
  const syncMod = await mod;
  const persistenceMod = await import(`file://${persistencePath.replace(/\\/g, '/')}`);
  const apiMod = await import(`file://${apiPath.replace(/\\/g, '/')}`);

  persistenceMod.__setStore({ ...emptyRecords(), projects: [
    { id: 'good-local', title: 'Good Local', type: 'creative', createdAt: NOW, updatedAt: NOW },
    { id: 'bad-local', title: 'Bad Local', type: 'creative', createdAt: NOW, updatedAt: NOW },
  ] });
  persistenceMod.__resetCleaned();
  apiMod.__setNextResponse({
    serverTime: NOW,
    rejected: { projects: ['bad-local'] },
    pull: emptyRecords(),
  });

  await syncMod.syncOnce();

  const cleanedIds = persistenceMod.__cleaned();
  ok('(B1) the GOOD record IS marked clean after a successful sync',
    cleanedIds.includes('good-local'), JSON.stringify(cleanedIds));
  ok('(B1) the REJECTED record is NOT marked clean, even though the request itself succeeded (200) — it stays dirty and will be sent again',
    !cleanedIds.includes('bad-local'), JSON.stringify(cleanedIds));

  const rejectedList = syncMod.getRejectedRecords();
  ok('(B2) getRejectedRecords() names the rejected record with its OWN title (read the same way the too-large notice already does, titleFor) — not a bare id',
    rejectedList.length === 1 && rejectedList[0].id === 'bad-local' && rejectedList[0].title === 'Bad Local',
    JSON.stringify(rejectedList));

  // A second sync with NOTHING rejected clears the notice (the list is
  // rebuilt fresh each cycle, the same discipline item 203's own tooLarge
  // list already uses).
  persistenceMod.__setStore({ ...emptyRecords(), projects: [{ id: 'good-local', title: 'Good Local', type: 'creative', createdAt: NOW, updatedAt: NOW }] });
  apiMod.__setNextResponse({ serverTime: NOW, pull: emptyRecords() });
  await syncMod.syncOnce();
  ok('(B3) once nothing is rejected, the notice clears — rebuilt fresh each cycle, never a sticky flag',
    syncMod.getRejectedRecords().length === 0, JSON.stringify(syncMod.getRejectedRecords()));

  // FALSIFIED: call the real cleanBatch-adjacent path with an EMPTY
  // rejected set (simulating the pre-fix behaviour where nothing was ever
  // excluded) by resending the first scenario but with an EMPTY rejected
  // object in the response — proving the exclusion is driven by the
  // response, not some independent local guess.
  persistenceMod.__setStore({ ...emptyRecords(), projects: [
    { id: 'good-local-2', title: 'Good', type: 'creative', createdAt: NOW, updatedAt: NOW },
    { id: 'bad-local-2', title: 'Bad', type: 'creative', createdAt: NOW, updatedAt: NOW },
  ] });
  persistenceMod.__resetCleaned();
  apiMod.__setNextResponse({ serverTime: NOW, pull: emptyRecords() }); // no `rejected` field at all this time
  await syncMod.syncOnce();
  const cleanedNoRejection = persistenceMod.__cleaned();
  ok('(B) MUTATION-EQUIVALENT: when the server reports NO rejections at all, BOTH records are cleaned — confirms the exclusion in (B1) was driven by the response naming "bad-local", not some other local rule silently excluding it',
    cleanedNoRejection.includes('good-local-2') && cleanedNoRejection.includes('bad-local-2'), JSON.stringify(cleanedNoRejection));
}

// =============================================================================
// PART C — syncNotice.ts's pure 3-state text (no store, no I/O).
// =============================================================================
{
  const noticeSrc = fs.readFileSync(path.join(DESKTOP_SRC, 'store/syncNotice.ts'), 'utf8');
  const dest = path.join(tmpDesktop, 'store', 'syncNotice.mjs');
  fs.writeFileSync(dest, stripTypes(dtRequire, noticeSrc).replace(/from (['"])\.\/sync\1/, "from './sync.mjs'"));
  const { syncNoticeText } = await import(`file://${dest.replace(/\\/g, '/')}`);
  const t = (k) => ({
    syncTooLargeOne: '"{title}" too large', syncTooLargeMany: '{n} too large',
    syncRejectedOne: '"{title}" rejected', syncRejectedMany: '{n} rejected',
  })[k];
  ok('(C1) offline wins over everything else',
    syncNoticeText('offline', [{ id: 'x', title: 'X', bytes: 1 }], [{ id: 'y', title: 'Y' }], false, false, false, true, t) === 'Offline — saved here', '');
  ok('(C2) too-large is shown when present, even if something is also rejected',
    syncNoticeText('synced', [{ id: 'x', title: 'X', bytes: 1 }], [{ id: 'y', title: 'Y' }], false, false, false, true, t) === '"X" too large', '');
  ok('(C3) rejected shows on its own when nothing is too large',
    syncNoticeText('synced', [], [{ id: 'y', title: 'Y' }], false, false, false, true, t) === '"Y" rejected', '');
  ok('(C4) nothing to report reads as null (no notice at all)',
    syncNoticeText('synced', [], [], false, false, false, true, t) === null, '');
  ok('(C5) the many-form is used for 2+ rejected records',
    syncNoticeText('synced', [], [{ id: 'a', title: 'A' }, { id: 'b', title: 'B' }], false, false, false, true, t) === '2 rejected', '');
}

fs.rmSync(tmpServer, { recursive: true, force: true });
fs.rmSync(tmpDesktop, { recursive: true, force: true });

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log('\nITEM224A PARKED: PASS (0 checks) — HARNESS_PARKED=1 armed; this file parks nothing: sync integrity is new this commit, falsifying no earlier check.');
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nITEM224A VERIFY: PASS (${checks.length} checks)`
  : `\nITEM224A VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
