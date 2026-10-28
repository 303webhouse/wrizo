// POLISH #10 ITEM 15 (INK) - the Tutor's Fragments list shows the same fragment twice. BROWSERLESS: runs the REAL store/tutorLenses.ts computeFragmentItems (bundled with esbuild; the store behind it is a stub that
// hands it a list of entries), so the fix is judged where it is made.
// FINDING (what it was): NOT a display bug in the id sense - the list was already one-per-ENTRY-ID (FX12's V5: `seen` set; React keys by id), so a line repeated on screen is two DIFFERENT entries whose text is
// identical (the same words captured twice / a capture and the same words kept again): duplicate DATA, shown as a duplicate because the row prints only the title. The display fix: an entry whose whole text
// equals one already listed (or the open page's own) is not listed again - the newest stands. No data is touched.
//   D1 two captures with the SAME text list once (the newest)        D2 the same words as the open page itself are not listed
//   D3 the same first line but DIFFERENT text both list (a title alone is not a duplicate)
//   D4 empty-text captures (a photo, a voice note) are never merged  D5 whitespace-only differences are the same text
//   D6 a starred, tag-sharing page whose text matches a listed capture is not listed again     D7 (V5 stands) one entry qualifying for both groups lists once
// Every check has a mutant, its landing asserted.   Run: node scripts/harness/polish10-15.mjs   (from apps/desktop; no box needed)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.resolve(here, '..', '..');
const SRC = path.join(DESKTOP, 'src');
const require = createRequire(path.join(DESKTOP, 'package.json'));
const { build } = createRequire(require.resolve('vite'))('esbuild');
const noCR = (t) => t.replace(/\r\n?/g, '\n');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });

async function load(mutate) {
  const file = path.join(SRC, 'store', 'tutorLenses.ts');
  const src = noCR(fs.readFileSync(file, 'utf8'));
  const text = mutate ? mutate(src) : src;
  const stub = {
    name: 'stub-store',
    setup(b) {
      b.onResolve({ filter: /^\.\/(persistence|pageHome)$/ }, (a) => ({ path: a.path, namespace: 'stub' }));
      b.onLoad({ filter: /.*/, namespace: 'stub' }, (a) => ({
        loader: 'js',
        contents: a.path.endsWith('persistence')
          ? 'export const getJournalEntries = () => globalThis.__entries; export const getBoardsConnecting = () => [];'
          : 'export const describePageHome = () => null;',
      }));
    },
  };
  const out = await build({ stdin: { contents: text, resolveDir: path.dirname(file), loader: 'ts', sourcefile: file }, bundle: true, write: false, format: 'esm', platform: 'neutral', plugins: [stub], logLevel: 'silent' });
  const js = out.outputFiles[0].text;
  return { src: text, M: await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64')), landed: text !== src };
}

const E = (id, text, extra = {}) => ({ id, text, createdAt: `2026-10-${String(10 + Number(id.replace(/\D/g, '')) % 18).padStart(2, '0')}T00:00:00.000Z`, source: 'capture', tags: [], ...extra });
const run = (M, all, entry) => { globalThis.__entries = all; return M.computeFragmentItems(entry).map((f) => f.id); };
const page = (text = 'the open page', extra = {}) => ({ id: 'page0', text, source: 'page', tags: [], ...extra });

function suite(M) {
  const R = {};
  const chk = (id, fn) => { try { const [pass, detail] = fn(); R[id] = { pass: !!pass, detail }; } catch (e) { R[id] = { pass: false, detail: String(e.message || e) }; } };
  chk('D1', () => { const r = run(M, [E('c2', 'She waits at the door.'), E('c1', 'She waits at the door.')], page()); return [JSON.stringify(r) === '["c2"]', `two captures, same words -> one row, the newest (${JSON.stringify(r)})`]; });
  chk('D2', () => { const r = run(M, [E('c1', 'the open page'), E('c2', 'something else')], page('the open page')); return [JSON.stringify(r) === '["c2"]', `the open page's own words are not offered back to it (${JSON.stringify(r)})`]; });
  chk('D3', () => { const r = run(M, [E('c2', 'Hook\nShe waits.'), E('c1', 'Hook\nHe leaves.')], page()); return [JSON.stringify(r) === '["c2","c1"]', `same first line, different text -> both (${JSON.stringify(r)})`]; });
  chk('D4', () => { const r = run(M, [E('c2', ''), E('c1', '')], page()); return [JSON.stringify(r) === '["c2","c1"]', `empty-text captures stay separate (${JSON.stringify(r)})`]; });
  chk('D5', () => { const r = run(M, [E('c2', 'A  quiet\nroom '), E('c1', 'A quiet room')], page()); return [JSON.stringify(r) === '["c2"]', `whitespace-only differences are one fragment (${JSON.stringify(r)})`]; });
  chk('D6', () => { const r = run(M, [E('c2', 'Same words'), E('s1', 'Same words', { source: 'page', starred: true, tags: ['t'] })], page('p', { tags: ['t'] })); return [JSON.stringify(r) === '["c2"]', `a starred page repeating a listed capture's words is not listed again (${JSON.stringify(r)})`]; });
  chk('D7', () => { const r = run(M, [E('c2', 'Both groups', { starred: true, tags: ['t'] })], page('p', { tags: ['t'] })); return [JSON.stringify(r) === '["c2"]', `one entry in both groups lists once - FX12 V5 stands (${JSON.stringify(r)})`]; });
  return R;
}

const MUT = [
  { name: 'no text dedupe at all', find: /if \(shown\.has\(k\)\) return true;/, to: '', red: ['D1', 'D2', 'D5', 'D6'] },
  { name: 'dedupe by TITLE only', find: /const k = textKey\(e\);/, to: 'const k = titleOf(e);', red: ['D3'] },
  { name: 'empty text is merged too', find: /if \(!k\) return false;/, to: '', red: ['D4'] },
  { name: 'whitespace is not normalised', find: /\.replace\(\/\\s\+\/g, ' '\)/, to: '', red: ['D5'] },
];

const base = await load();
const res0 = suite(base.M);
for (const [k, v] of Object.entries(res0)) ok(k, v.pass, v.detail);
let landed = 0, killed = 0;
for (const m of MUT) {
  let did = false, red = [];
  try {
    const mm = await load((t) => { const r = t.replace(m.find, m.to); did = r !== t; return r; });
    if (did) red = Object.entries(suite(mm.M)).filter(([, v]) => !v.pass).map(([k]) => k);
  } catch (e) { red = ['<crash: ' + String(e.message || e).slice(0, 60) + '>']; }
  const dead = did && (m.any ? m.red.some((k) => red.includes(k)) : m.red.every((k) => red.includes(k)));
  if (did) landed++;
  if (dead) killed++;
  ok(`mutant "${m.name}": landed and turns ${m.red.join('+')} RED`, dead, JSON.stringify({ did, red }));
}
ok(`all ${MUT.length} mutations landed and ${MUT.length} were killed`, landed === MUT.length && killed === MUT.length, `${landed} landed / ${killed} killed`);

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
const failed = checks.filter((c) => !c.pass);
console.log(`POLISH10-15 VERIFY: ${failed.length ? `FAIL - ${failed.length}/${checks.length}` : `PASS (${checks.length} checks)`}`);
process.exit(failed.length ? 1 : 0);
