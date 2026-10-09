// DRAFTS INTEGRITY, part B (client only, no schema, no ruling needed) - A RECORD IS IDENTIFIED BY ITS COLLECTION AND ITS ID.
//
// A project draft is stored under its project's id, so project P and draft P are two records that share one id. Three places keyed
// on the bare id and so confused them:
//   markClean(ids)     cleared an id from ALL SIX dirty sets - landing project P also cleared draft P's dirty mark, so a draft edit whose own
//                      request then failed (or that was edited meanwhile) was never retried and stayed on this device only;
//   stampMap           id -> updatedAt across collections - one record's stamp overwrote the other's (hidden until markClean was fixed:
//                      project P would then stay dirty for ever, re-pushed on every sync);
//   rejectedIdSet      the server's refusal of draft P also held project P (and the reverse).
// Now markClean takes {collection, id}, and the stamp map and the refusal set are keyed by recordKey(collection, id).
//
// This file runs the REAL persistence.ts and sync.ts (bundled with esbuild against a fake browser) with one module replaced: api.ts, a
// controllable network. Browserless. Run: node scripts/harness/drafts-integrity.mjs   (from apps/desktop)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.resolve(here, '..', '..');
const SRC = path.join(DESKTOP, 'src');
const require = createRequire(path.join(DESKTOP, 'package.json'));
const { build } = createRequire(require.resolve('vite'))('esbuild');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const noCR = (t) => t.replace(/\r\n?/g, '\n');

const STUB_API = `
export class SyncHttpError extends Error { constructor(status) { super('sync failed: ' + status); this.status = status; } }
export const net = { calls: [], responder: null, hold: false, pending: [] };
const empty = () => ({ serverTime: '2026-01-01T00:00:00.000Z', pull: { projects: [], storyPlans: [], sessions: [], drafts: [], drawers: [], journalEntries: [] } });
export function apiSync(payload) {
  net.calls.push(payload);
  if (net.hold) return new Promise((resolve, reject) => { net.pending.push({ payload, resolve, reject }); });
  try { return Promise.resolve(net.responder ? net.responder(payload, net.calls.length) : empty()); } catch (e) { return Promise.reject(e); }
}
`;
let nonce = 0;
let previous = null;
async function load(overrides = {}) {
  nonce += 1;
  if (previous) { try { previous.sync.stopSync(); previous.persistence.resetLocalData(); } catch { /* best effort */ } previous = null; }
  const res = await build({
    stdin: { contents: `export const __nonce = ${nonce};\nexport * from './store/persistence';\nexport * from './store/sync';\nexport { net } from 'stub-api';`, resolveDir: SRC, loader: 'ts' },
    bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent',
    nodePaths: [path.join(DESKTOP, 'node_modules')],
    plugins: [{ name: 'ov', setup(b) {
      b.onResolve({ filter: /^stub-api$/ }, () => ({ path: 'stub-api', namespace: 'stub' }));
      b.onResolve({ filter: /\/api$/ }, (a) => (a.resolveDir.endsWith('store') ? { path: 'stub-api', namespace: 'stub' } : undefined));
      b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: STUB_API, loader: 'js' }));
      b.onLoad({ filter: /\.ts$/ }, (args) => {
        const rel = path.relative(SRC, args.path).split('\\').join('/');
        const text = noCR(fs.readFileSync(args.path, 'utf8'));
        return { contents: overrides[rel] ? overrides[rel](text) : text, loader: 'ts' };
      });
    } }],
  });
  const map = new Map();
  map.set('writer-studio-journal-resync-v1', '1');   // no backfill sync to blur the request counts
  globalThis.window = { addEventListener() {}, removeEventListener() {} };
  globalThis.document = { visibilityState: 'visible', addEventListener() {}, removeEventListener() {}, querySelectorAll: () => [] };
  globalThis.location = { protocol: 'https:', origin: 'https://app.test', href: 'https://app.test/#/' };
  Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'Mozilla/5.0 Chrome/128' }, configurable: true, writable: true });
  globalThis.localStorage = { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => { map.set(k, String(v)); }, removeItem: (k) => { map.delete(k); }, clear: () => map.clear() };
  const mod = await import('data:text/javascript;base64,' + Buffer.from(res.outputFiles[0].text).toString('base64'));
  previous = { sync: mod, persistence: mod };
  return { m: mod, net: mod.net };
}
const swap = (from, to) => (t) => { if (!t.includes(from)) throw new Error('mutation anchor missing: ' + JSON.stringify(from.slice(0, 90))); return t.replace(from, () => to); };
const compose = (...fns) => (t) => fns.reduce((acc, f) => f(acc), t);

const NOW = '2026-01-01T00:00:00.000Z';
const project = (over = {}) => ({ id: 'P', title: 'A project', type: 'creative', createdAt: NOW, updatedAt: NOW, ...over });
const dirtyIds = (m) => { const d = m.getDirtyRecords(); return { projects: d.projects.map((r) => r.id), drafts: d.drafts.map((r) => r.id) }; };
const reply = (rejected) => ({ serverTime: '2026-01-02T00:00:00.000Z', pull: { projects: [], storyPlans: [], sessions: [], drafts: [], drawers: [], journalEntries: [] }, ...(rejected ? { rejected } : {}) });

// ---- S1 - landing project P must NOT clean draft P: its own request fails afterwards -------------------------------------------
async function s1(overrides = {}) {
  const { m, net } = await load(overrides);
  m.saveProject(project({ sprintText: 'p'.repeat(700_000) }));
  m.saveDraft('P', 'd'.repeat(700_000));
  const before = dirtyIds(m);
  let n = 0;
  net.responder = () => { n += 1; if (n === 2) throw new Error('network died on the second chunk'); return reply(); };
  await m.syncOnce();
  // Which record travelled FIRST is the packer's business; the claim is about the pair: the first chunk's collection is clean, the other still dirty.
  const first = Object.keys(net.calls[0].push || {}).find((k) => (net.calls[0].push[k] || []).length > 0);
  const other = first === 'projects' ? 'drafts' : 'projects';
  return { before, after: dirtyIds(m), requests: net.calls.length, first, other };
}
// ---- S2 - draft P cleaning must NOT clean project P's mid-flight re-edit --------------------------------------------------------
async function s2(overrides = {}) {
  const { m, net } = await load(overrides);
  const p = project();
  m.saveProject(p);
  m.saveDraft('P', 'draft text');
  net.hold = true;
  const run = m.syncOnce();
  await sleep(30);
  await sleep(5);
  m.saveProject({ ...p, title: 'edited while the request was in flight' });     // a new updatedAt, after the request left
  net.pending[0].resolve(reply());
  await run;
  return { after: dirtyIds(m) };
}
// ---- S3 - the server refusing draft P must not hold project P (and the reverse) ----------------------------------------------------
async function s3(overrides = {}) {
  const out = {};
  for (const [tag, rejected] of [['draftRefused', { drafts: ['P'] }], ['projectRefused', { projects: ['P'] }]]) {
    const { m, net } = await load(overrides);
    m.saveProject(project());
    m.saveDraft('P', 'draft text');
    net.responder = () => reply(rejected);
    await m.syncOnce();
    out[tag] = dirtyIds(m);
    out[tag + 'Listed'] = m.getRejectedRecords().length;
  }
  return out;
}
// ---- S4 - CONTROL: an ordinary sync of both cleans both -------------------------------------------------------------------------
async function s4(overrides = {}) {
  const { m, net } = await load(overrides);
  m.saveProject(project());
  await sleep(6);                                   // the two records must carry DIFFERENT stamps for a shared bare-id stamp to matter
  m.saveDraft('P', 'draft text');
  const before = dirtyIds(m);
  await m.syncOnce();
  const afterOne = dirtyIds(m);
  await m.syncOnce();
  return { before, afterOne, requests: net.calls.length };
}

{
  const a = await s1();
  ok('(S1a) fixture: project P and draft P are both dirty, and the push is chunked (two requests carry them)', a.before.projects.includes('P') && a.before.drafts.includes('P'), JSON.stringify(a));
  ok('(S1b) landing one of the pair cleans THAT collection\'s P only: when the other\'s own request then fails, its P is STILL dirty (it will be retried)',
    a.requests === 2 && (a.first === 'projects' || a.first === 'drafts') && a.after[a.first].includes('P') === false && a.after[a.other].includes('P') === true, JSON.stringify(a));

  const b = await s2();
  ok('(S2) cleaning draft P does not clean project P: a project edited while the request was in flight stays dirty, the draft (unchanged) is clean',
    b.after.projects.includes('P') === true && b.after.drafts.includes('P') === false, JSON.stringify(b));

  const c = await s3();
  ok('(S3a) the server refusing DRAFT P holds draft P dirty and listed - and project P (landed) is clean',
    c.draftRefused.drafts.includes('P') && !c.draftRefused.projects.includes('P') && c.draftRefusedListed === 1, JSON.stringify(c.draftRefused));
  ok('(S3b) and the reverse: refusing PROJECT P holds project P dirty and listed - and draft P (landed) is clean',
    c.projectRefused.projects.includes('P') && !c.projectRefused.drafts.includes('P') && c.projectRefusedListed === 1, JSON.stringify(c.projectRefused));

  const d = await s4();
  ok('(S4) CONTROL: an ordinary sync cleans BOTH records that share the id, and the next sync has nothing to push (the project does not stay dirty for ever)',
    d.before.projects.includes('P') && d.before.drafts.includes('P') && d.afterOne.projects.length === 0 && d.afterOne.drafts.length === 0, JSON.stringify(d));
}

// ---- source: no bare-id key is left in the sync engine's record bookkeeping ------------------------------------------------------------
{
  const sync = noCR(fs.readFileSync(path.join(SRC, 'store/sync.ts'), 'utf8'));
  const pers = noCR(fs.readFileSync(path.join(SRC, 'store/persistence.ts'), 'utf8'));
  ok('(S5) markClean takes the collection with every id and clears ONLY that collection\'s dirty set',
    /export function markClean\(items: ReadonlyArray<\{ collection: DirtyCollection; id: string \}>\): void \{\n  for \(const \{ collection, id \} of items\) dirty\[collection\]\.delete\(id\);/.test(pers)
      && !/dirty\.projects\.delete\(id\);\n    dirty\.storyPlans\.delete\(id\)/.test(pers), '');
  ok('(S6) the stamp map, the refusal set and the item lookup are keyed by recordKey(collection, id)',
    /map\.set\(recordKey\(k, r\.id\), r\.updatedAt\)/.test(sync) && /ids\.add\(recordKey\(coll, id\)\)/.test(sync) && /still\.get\(key\)/.test(sync)
      && /new Map\(items\.map\(i => \[recordKey\(i\.coll, i\.rec\.id\), i\] as const\)\)/.test(sync), '');
}

// ---- MUTATIONS ------------------------------------------------------------------------------------------------------------------------
async function mutant(name, overrides, run, expectRed) {
  let res; let landed = true;
  try { res = await run(overrides); } catch (e) { if (/mutation anchor missing/.test(String(e))) landed = false; else res = { error: String(e) }; }
  if (!landed) { ok(`(M) ${name}: THE MUTATION LANDED`, false, 'anchor missing'); return; }
  ok(`(M) ${name}: the proof goes RED`, expectRed(res) === true, JSON.stringify(res).slice(0, 220));
}
await mutant('markClean clears the id from all six collections again',
  { 'store/persistence.ts': swap('for (const { collection, id } of items) dirty[collection].delete(id);',
    "for (const { id } of items) { dirty.projects.delete(id); dirty.storyPlans.delete(id); dirty.sessions.delete(id); dirty.drafts.delete(id); dirty.journalEntries.delete(id); dirty.drawers.delete(id); }") },
  s1, (r) => r.after[r.other].includes('P') === false);
await mutant('markClean clears all collections (the mid-flight re-edit of project P is lost)',
  { 'store/persistence.ts': swap('for (const { collection, id } of items) dirty[collection].delete(id);',
    "for (const { id } of items) { dirty.projects.delete(id); dirty.storyPlans.delete(id); dirty.sessions.delete(id); dirty.drafts.delete(id); dirty.journalEntries.delete(id); dirty.drawers.delete(id); }") },
  s2, (r) => r.after.projects.includes('P') === false);
await mutant('the stamp map is keyed by the bare id again (project P stays dirty for ever beside its draft)',
  { 'store/sync.ts': compose(swap('map.set(recordKey(k, r.id), r.updatedAt)', 'map.set(r.id, r.updatedAt)'), swap('const cur = still.get(key);', 'const cur = still.get(i.rec.id);')) },
  s4, (r) => r.afterOne.projects.includes('P') === true);
await mutant('a refusal is matched by the bare id again (refusing draft P also holds project P)',
  { 'store/sync.ts': compose(swap('ids.add(recordKey(coll, id));', 'ids.add(recordKey(coll, id)); ids.add(id);'), swap('if (rejectedIds.has(key)) return false;', 'if (rejectedIds.has(key) || rejectedIds.has(i.rec.id)) return false;')) },
  s3, (r) => r.draftRefused.projects.includes('P') === true);

let failed = 0;
for (const c of checks) {
  if (!c.pass) failed += 1;
  console.log((c.pass ? 'PASS ' : 'FAIL ') + c.name + (c.pass ? '' : ' | ' + String(c.detail).slice(0, 300)));
}
console.log(failed === 0 ? `\nDRAFTS-INTEGRITY VERIFY: PASS (${checks.length} checks)` : `\nDRAFTS-INTEGRITY VERIFY: FAIL — ${failed}/${checks.length}`);
process.exit(failed === 0 ? 0 : 1);
