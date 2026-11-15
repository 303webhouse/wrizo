// #13 step 12d (Fable, Nov 12): the fragments CODE goes; the stored `fragments` field stays untouched (Nick's ruling, Oct 29). The real risk
// is not the delete but a silent drop: a product write that rebuilds a project from a field list and leaves `fragments` behind.
// BROWSERLESS: the REAL store and sync modules, bundled with the repo's own esbuild from a copy of src, run on a fake browser.
//   F1 a project carrying a fragments array (seeded through the seam) keeps it byte-identical in local storage after product writes
//      (setProjectDrawer, createStoryPlan, setBeatStatus) and a flush
//   F2 ... after a reload (a fresh module instance hydrates from storage) and a further product write
//   F3 the sync push carries it byte-identical, and the round trip's pull (the server's real answer: nothing newer) leaves it so
//   F4 the server half, recorded: the server has never stored it - its project upsert names no fragments column, and its row reader
//      returns none (bug #88: a pulled newer copy therefore replaces a local project without its fragments; no known victims)
//   MUTANTS (each asserts it LANDED): a saveProject that strips the field turns F1/F2 red; a push payload that strips it turns F3 red
// Holds before the delete and after it: it calls none of the deleted fragment functions.
// Run: node scripts/harness/c13-12d-fragments-field.mjs   (from apps/desktop; no box needed)
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const DESKTOP = join(here, '..', '..');
const ROOT = join(DESKTOP, '..', '..');
const pnpmDir = join(ROOT, 'node_modules', '.pnpm');
const esbuildPkg = existsSync(pnpmDir) ? readdirSync(pnpmDir).find((d) => /^esbuild@/.test(d)) : null;
const esbuildBin = esbuildPkg && join(pnpmDir, esbuildPkg, 'node_modules', 'esbuild', 'bin', 'esbuild');
if (!esbuildBin || !existsSync(esbuildBin)) { console.log('C13-12D FRAGMENTS-FIELD VERIFY: FAIL - esbuild not found under node_modules/.pnpm'); process.exit(1); }
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const J = (v) => JSON.stringify(v);

// ---- a fake browser: storage, a window the seams install on, and a fetch that records the push and answers as the server does ----
const store = new Map();
const pushed = [];
globalThis.window = { addEventListener() {}, removeEventListener() {}, dispatchEvent() { return true }, matchMedia: () => ({ matches: false }), devicePixelRatio: 1 };
globalThis.document = { visibilityState: 'hidden', addEventListener() {}, removeEventListener() {}, querySelectorAll: () => [], querySelector: () => null, documentElement: { getAttribute: () => null } };
globalThis.location = { protocol: 'https:', origin: 'https://app.test', href: 'https://app.test/#/' };
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => { store.set(k, String(v)); }, removeItem: (k) => { store.delete(k); }, clear: () => store.clear(), key: (i) => [...store.keys()][i] ?? null, get length() { return store.size; } };
Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'Mozilla/5.0 Chrome/128', onLine: true }, configurable: true, writable: true });
globalThis.fetch = async (url, init) => {
  const u = String(url);
  if (u.includes('/api/sync')) {
    pushed.push(JSON.parse(init?.body || '{}'));
    // the server's own answer for a push with nothing newer elsewhere: an empty pull (its project rows carry no fragments in any case, F4)
    return { ok: true, status: 200, json: async () => ({ serverTime: new Date().toISOString(), pull: { projects: [], storyPlans: [], sessions: [], drafts: [], drawers: [], journalEntries: [] } }) };
  }
  return { ok: true, status: 200, json: async () => ({}) };
};

// ---- the real modules, bundled from a COPY of src (a mutant edits the copy, never the tree) ----
let n = 0;
const bundle = async (mutate) => {
  const tmp = mkdtempSync(join(tmpdir(), 'wz-12d-'));
  const src = join(tmp, 'src');
  cpSync(join(DESKTOP, 'src'), src, { recursive: true });
  const landed = mutate ? mutate(src) : true;
  const entry = join(tmp, 'entry.ts');
  const s = src.replace(/\\/g, '/');
  writeFileSync(entry, `export * as P from '${s}/store/persistence';\nexport * as S from '${s}/store/sync';\n`);
  const out = join(tmp, 'bundle.mjs');
  try {
    execFileSync(process.execPath, [esbuildBin, entry, '--bundle', '--format=esm', '--platform=neutral', `--outfile=${out}`, '--log-level=error',
      '--external:@fontsource/*', '--external:@fontsource-variable/*', '--loader:.json=json', `--alias:react=${join(DESKTOP, 'node_modules', 'react').replace(/\\/g, '/')}`], { stdio: 'pipe' });
    const code = readFileSync(out, 'utf8');
    return { landed, load: async () => import(`${pathToFileURL(out).href}?n=${n += 1}`), code, cleanup: () => rmSync(tmp, { recursive: true, force: true }) };
  } catch (e) {
    rmSync(tmp, { recursive: true, force: true });
    return { landed, err: String((e && (e.stderr || e.message)) || e).split('\n').slice(0, 3).join(' | ').slice(0, 300) };
  }
};

const FRAGMENTS = [
  { id: 'c13-12d-f1', projectId: '', content: [{ text: 'The opening line, kept.', struck: false }, { text: ' A struck aside.', struck: true }], role: 'spine', spineOrder: 0, links: [{ targetId: 'c13-12d-f2', kind: 'bridge' }], createdAt: '2026-06-24T10:00:00.000Z', updatedAt: '2026-06-24T10:05:00.000Z' },
  { id: 'c13-12d-f2', projectId: '', content: [{ text: 'A loose fragment.', struck: false }], role: 'loose', links: [], createdAt: '2026-06-24T10:01:00.000Z', updatedAt: '2026-06-24T10:01:00.000Z' },
];
const storedFragments = (pid) => { const p = JSON.parse(store.get('writer-studio-projects') || '[]').find((x) => x.id === pid); return p ? J(p.fragments ?? null) : 'NO-ROW'; };

// One run of the scenario on one bundle; returns what each check reads.
const scenario = async (b) => {
  store.clear(); pushed.length = 0;
  store.set('wrizo-first-run-complete', '1');
  const first = await b.load();
  const { P, S } = first;
  const w = globalThis.window;
  const project = w.wrizoCreateProject('C13 12d Fragments Book');
  const frags = FRAGMENTS.map((f) => ({ ...f, projectId: project.id }));
  const want = J(frags);
  w.wrizoPatchProject(project.id, { fragments: frags });
  const seeded = storedFragments(project.id);
  // product writes that rebuild or re-save the project record
  const drawer = w.wrizoCreateDrawer('C13 12d Drawer');
  P.setProjectDrawer(project.id, drawer.id);
  const plan = P.createStoryPlan(project.id, 'story_circle', ['you', 'need']);
  P.setBeatStatus(plan.id, 'need', 'complete');
  P.flushNow();
  const afterWrites = storedFragments(project.id);
  // a reload: a fresh module instance hydrates its cache from storage once, at init
  const second = await b.load();
  const reread = J(second.P.getProject(project.id)?.fragments ?? null);
  second.P.setCurrentBeat(plan.id, 'you');
  second.P.flushNow();
  const afterReload = storedFragments(project.id);
  // the round trip: a push of every dirty record, then the server's answer applied
  await second.S.syncOnce(true);
  const inPush = pushed.flatMap((p) => p.push?.projects ?? []).filter((x) => x.id === project.id);
  second.P.flushNow();
  const afterSync = storedFragments(project.id);
  return { want, seeded, afterWrites, reread, afterReload, inPush: inPush.map((x) => J(x.fragments ?? null)), afterSync, pushes: pushed.length };
};

const holdsStorage = (r) => r.seeded === r.want && r.afterWrites === r.want && r.reread === r.want && r.afterReload === r.want;
const holdsPush = (r) => r.inPush.length > 0 && r.inPush.every((x) => x === r.want) && r.afterSync === r.want;

const real = await bundle(null);
ok('fixture: the real store and sync modules bundle from a copy of src', !real.err, real.err || '');
if (!real.err) {
  const r = await scenario(real);
  ok('fixture: the project was seeded through the seam carrying two fragments (a spine with a struck run and a link, and a loose one)', r.seeded === r.want, r.seeded.slice(0, 120));
  ok('F1: after product writes (setProjectDrawer, createStoryPlan, setBeatStatus) and a flush, the stored fragments are byte-identical', r.afterWrites === r.want, r.afterWrites.slice(0, 120));
  ok('F2: a reload (a fresh module instance) reads them byte-identical, and they stay so in storage after a further product write', r.reread === r.want && r.afterReload === r.want, J({ reread: r.reread === r.want, afterReload: r.afterReload === r.want }));
  ok('F3: the sync push carries them byte-identical, and the round trip (the server\'s answer applied) leaves storage byte-identical', holdsPush(r), J({ pushes: r.pushes, inPush: r.inPush.map((x) => x === r.want), afterSync: r.afterSync === r.want }));
  real.cleanup();
}

// F4 - the server half, recorded (it holds before and after this step: 12d does not touch the server)
const serverSync = readFileSync(join(ROOT, 'apps', 'server', 'src', 'sync.ts'), 'utf8');
const upsert = (/insert into projects\s*\(([^)]*)\)/.exec(serverSync.slice(serverSync.indexOf('async function upsertProjects'))) || [])[1] || '';
const rowTo = (/function rowToProject\([^)]*\)\s*\{[\s\S]*?\n\}/.exec(serverSync) || [''])[0];
ok('F4 (recorded): the server has never stored fragments - its project upsert names no fragments column, and rowToProject returns none (bug #88: no known victims)',
  upsert.length > 0 && !/fragment/i.test(upsert) && rowTo.length > 0 && !/fragment/i.test(rowTo), J({ upsertColumns: upsert.replace(/\s+/g, ' ').trim() }));

// MUTANTS
{
  const SAVE = "upsert('projects', cache.projects, clone(project));";
  const m1 = await bundle((src) => {
    const f = join(src, 'store', 'persistence', 'projects.ts');
    const t = readFileSync(f, 'utf8');
    if (!t.includes(SAVE)) return false;
    writeFileSync(f, t.replace(SAVE, "upsert('projects', cache.projects, (({ fragments: _gone, ...rest }) => rest)(clone(project)) as Project);"));
    return true;
  });
  const r1 = m1.err ? null : await scenario(m1);
  ok('MUTANT: a saveProject that rebuilds the record without fragments LANDED and turns F1/F2 red', m1.landed && !m1.err && r1 && !holdsStorage(r1), m1.err || J({ landed: m1.landed, afterWrites: r1 && r1.afterWrites.slice(0, 60) }));
  if (!m1.err) m1.cleanup();

  const PAY = 'for (const i of batch) (out[i.coll] ??= []).push(i.rec);';
  const m2 = await bundle((src) => {
    const f = join(src, 'store', 'sync.ts');
    const t = readFileSync(f, 'utf8');
    if (!t.includes(PAY)) return false;
    writeFileSync(f, t.replace(PAY, 'for (const i of batch) (out[i.coll] ??= []).push((({ fragments: _gone, ...rest }) => rest)(i.rec as Record<string, unknown>));'));
    return true;
  });
  const r2 = m2.err ? null : await scenario(m2);
  ok('MUTANT: a push payload that drops fragments LANDED and turns F3 red (storage stays green: the two checks see different halves)', m2.landed && !m2.err && r2 && !holdsPush(r2) && holdsStorage(r2), m2.err || J({ landed: m2.landed, inPush: r2 && r2.inPush }));
  if (!m2.err) m2.cleanup();
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : `  ${c.detail}`}`);
const bad = checks.filter((c) => !c.pass).length;
console.log(bad ? `\nC13-12D FRAGMENTS-FIELD VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nC13-12D FRAGMENTS-FIELD VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
