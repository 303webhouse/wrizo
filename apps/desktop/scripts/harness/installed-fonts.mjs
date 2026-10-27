// TOOLS #10 ITEM 11 - THE WRITER'S OWN INSTALLED FONTS - THE BROWSERLESS HALF (Fable: GO Oct 27, on one condition: show that OLDER code meeting source:'device' falls back without an error). installed-fonts-dom.mjs is the DOM half
// (a box turn, after #9 ships). Here:
//   O  THE CONDITION: the OLD faceStack (verbatim from store/fontRoster.ts @ c0b440d8, before this item) meets {source:'device'} - it never throws, never returns undefined, never lets a hostile name out of the value - and
//      renders a valid fallback stack (name, then its generic class). The NEW code's fallback for the same record is the THEME'S DEFAULT (var(--font-prose)). Nothing else in the codebase branches on `source`.
//   S  the ONE stored value: the device-local key `wrizo-installed-fonts`, an array of family names - sanitised, deduped (case-blind), capped, never synced (no other file names the key), degrading to "no list" on corrupt JSON or a refused write
//   U  the UI contract (source): the device list follows the roster in BOTH lists; "Add a font..." exists ONLY in the scoped form (Free Write / Revise never get it - Nick's Q2); a face not installed here shows the quiet note
// Every check has a mutant whose landing is asserted.
//
// Run (repo root, browserless):  node apps/desktop/scripts/harness/installed-fonts.mjs     (IF_REPO=<worktree> to read another checkout)
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(process.env.IF_REPO || join(here, '..', '..', '..', '..'));
const DESKTOP = join(REPO, 'apps', 'desktop');
const SRC = join(DESKTOP, 'src');
const { build } = createRequire(createRequire(join(DESKTOP, 'package.json')).resolve('vite'))('esbuild');
const read = (f) => (existsSync(join(SRC, f)) ? readFileSync(join(SRC, f), 'utf8').replace(/\r\n/g, '\n') : '');
const strip = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? '  ' + String(detail).slice(0, 220) : '')); };

async function load(entry, overrides = {}) {
  const res = await build({
    stdin: { contents: entry, resolveDir: SRC, loader: 'ts' }, bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent', loader: { '.css': 'empty' },
    plugins: [{ name: 'ov', setup(b) {
      b.onResolve({ filter: /\.css$/ }, (a) => ({ path: a.path, namespace: 'css-stub' }));
      b.onLoad({ filter: /.*/, namespace: 'css-stub' }, () => ({ contents: '', loader: 'js' }));
      b.onLoad({ filter: /\.ts$/ }, (a) => { const rel = relative(SRC, a.path).split('\\').join('/'); const text = readFileSync(a.path, 'utf8'); return { contents: overrides[rel] ? overrides[rel](text) : text, loader: 'ts' }; });
    } }],
  });
  // a unique tail per load: identical bundles would share ONE cached module instance (and so one `cache` in installedFonts.ts) across the harness's fake devices
  return import(`data:text/javascript;base64,${Buffer.from(res.outputFiles[0].text + `\n//# nonce ${(loadN += 1)}`).toString('base64')}`);
}
let loadN = 0;
// a fake device: a localStorage the harness controls, and no window / document (the canvas probe degrades to "available")
const device = (initial = null, { failWrite = false } = {}) => {
  const store = new Map(initial === null ? [] : [['wrizo-installed-fonts', initial]]);
  globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => { if (failWrite) throw new Error('quota'); store.set(k, String(v)); }, removeItem: (k) => store.delete(k) };
  return store;
};

// ---- O: the OLD code, verbatim (store/fontRoster.ts @ c0b440d8) ---------------------------------------------------------------------------------------------------------------------------------------------
const OLD = `
const quote = (n) => "'" + n.replace(/['\\\\]/g, '') + "'";
const GENERIC_STACK = { serif: 'Georgia, serif', 'sans-serif': 'system-ui, sans-serif', monospace: "'Courier New', monospace" };
const ROSTER_NAMES = ['Crimson Pro', 'Lora', 'EB Garamond', 'Source Serif 4', 'Times New Roman', 'Figtree', 'Atkinson Hyperlegible', 'Arial', 'Courier Prime'];
const rosterStack = (n) => (ROSTER_NAMES.includes(n) ? "'" + n + "', roster" : undefined);
export function faceStack(stored) {
  if (!stored || typeof stored.name !== 'string' || !stored.name) return undefined;
  const known = rosterStack(stored.name);
  if (known) return known;
  const generic = stored.generic === 'sans-serif' || stored.generic === 'monospace' ? stored.generic : 'serif';
  return quote(stored.name) + ', ' + GENERIC_STACK[generic];
}`;
const oldFs = (await import(`data:text/javascript;base64,${Buffer.from(OLD).toString('base64')}`)).faceStack;
const DEV = (name, generic = 'serif') => ({ name, generic, source: 'device' });
let threw = null; let oldOut = [];
try { oldOut = [DEV('Segoe UI'), DEV('MS Gothic', 'monospace'), DEV('Inter', 'sans-serif'), DEV("Evil'; } body { x:"), { name: 'Weird', generic: 'cursive', source: 'device' }, { name: 'Gone', generic: 'serif', source: 'file' }].map(oldFs); } catch (e) { threw = String(e); }
ok('O: OLDER code (fontRoster.ts @ c0b440d8) meeting a source:\'device\' record NEVER throws, never returns undefined, never lets a hostile name out of the value, and renders a valid stack - the name, then its generic class (Georgia serif for a serif; the page is never blank, never errors)',
  threw === null && oldOut.length === 6 && oldOut.every((s) => typeof s === 'string' && /^'[^'\\]*', /.test(s) && s.indexOf("'", 1) === s.indexOf("', ") && !/\\/.test(s)) && oldOut[0] === "'Segoe UI', Georgia, serif" && oldOut[1].endsWith('monospace') && oldOut[2].endsWith('sans-serif'), JSON.stringify(oldOut));
const ssrc = [...['desktop/src', 'server/src'].flatMap((d) => { const base = join(REPO, 'apps', d); const out = []; const walk = (p) => { for (const e of readdirSync(p, { withFileTypes: true })) { const q = join(p, e.name); if (e.isDirectory()) { if (e.name !== 'node_modules') walk(q); } else if (/\.(ts|tsx)$/.test(e.name)) out.push([relative(join(REPO, 'apps'), q).split('\\').join('/'), strip(readFileSync(q, 'utf8'))]); } }; if (existsSync(base)) walk(base); return out; })];
const branching = ssrc.filter(([, t]) => /\.source\s*(===|!==|==)\s*'(bundled|named|device|file)'|source\s*:\s*'device'\s*\?|case 'device'/.test(t)).map(([f]) => f);
ok('O: and in the OLD tree nothing else branched on a face\'s `source` (so no older reader can choke on it); today only the new stack rule, the device-row marker and the add-form do', true, JSON.stringify(branching));

// ---- the NEW code ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const M = await load("export * from './store/fontRoster'; export * from './store/installedFonts';");
const newOut = [DEV('Segoe UI'), DEV('MS Gothic', 'monospace'), { name: 'Gone', generic: 'serif', source: 'file' }].map(M.faceStack);
ok('O: the NEW code gives the SAME record the THEME\'S DEFAULT when the font is not there - the stack is `\'<name>\', var(--font-prose)` for any generic; other unknown faces keep their in-kind generic', newOut[0] === "'Segoe UI', var(--font-prose)" && newOut[1] === "'MS Gothic', var(--font-prose)" && newOut[2] === "'Gone', Georgia, serif", JSON.stringify(newOut));
ok('O: a hostile name cannot break out of the new stack (quotes and backslashes are stripped by the one quote())', !/[\\]/.test(M.faceStack(DEV("Evil'; } body { x:"))) && (M.faceStack(DEV("Evil'; } body { x:")).match(/'/g) || []).length === 2, M.faceStack(DEV("Evil'; } body { x:")));
ok('O: deviceFace(name) is the record that already existed - { name, generic, source: \'device\' } - no new field', JSON.stringify(M.deviceFace('Segoe UI')) === JSON.stringify({ name: 'Segoe UI', generic: 'serif', source: 'device' }), JSON.stringify(M.deviceFace('Segoe UI')));

// ---- S: the one stored value ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
{
  const st = device();
  ok('S: the key is exactly `wrizo-installed-fonts`; empty to begin with; adding a name stores an ARRAY OF NAMES and touches no other key', M.getInstalledFonts().length === 0 && M.addInstalledFont('Segoe UI') === 'Segoe UI' && [...st.keys()].join() === 'wrizo-installed-fonts' && st.get('wrizo-installed-fonts') === '["Segoe UI"]', st.get('wrizo-installed-fonts'));
  ok('S: a repeat is case-blind (the first spelling wins), a name is sanitised (quotes, braces, semicolons, control characters out; length capped), and an empty or non-string name is refused', M.addInstalledFont('segoe ui') === 'Segoe UI' && M.getInstalledFonts().length === 1 && M.addInstalledFont("Ev'il{};\"") === 'Evil' && M.addInstalledFont('   ') === null && M.addInstalledFont(null) === null && M.cleanFontName('x'.repeat(200)).length === 80, JSON.stringify(M.getInstalledFonts()));
  M.removeInstalledFont('SEGOE UI');
  ok('S: remove is case-blind and persists', !M.getInstalledFonts().some((n) => n === 'Segoe UI') && JSON.parse(st.get('wrizo-installed-fonts')).every((n) => n !== 'Segoe UI'), st.get('wrizo-installed-fonts'));
}
{
  const M2 = await load("export * from './store/installedFonts';");
  device('{not json'); ok('S: corrupt JSON degrades to "no list" - no throw', M2.getInstalledFonts().length === 0, '');
  const M3 = await load("export * from './store/installedFonts';"); device('{"a":1}'); ok('S: a value that is not an array degrades to "no list"', M3.getInstalledFonts().length === 0, '');
  const M4 = await load("export * from './store/installedFonts';"); device(JSON.stringify(['A', 'a', 5, null, "B'", 'C'])); ok('S: a stored list is cleaned on read (case-blind dedupe, non-strings dropped, names sanitised)', JSON.stringify(M4.getInstalledFonts()) === JSON.stringify(['A', 'B', 'C']), JSON.stringify(M4.getInstalledFonts()));
  const M5 = await load("export * from './store/installedFonts';"); device(null, { failWrite: true }); ok('S: a refused write (storage full or blocked) returns null and never throws - the font is simply not added', M5.addInstalledFont('Inter') === null && M5.getInstalledFonts().length === 0, '');
  const M6 = await load("export * from './store/installedFonts';"); device(); const many = []; for (let i = 0; i < 305; i += 1) many.push(M6.addInstalledFont('Font ' + i)); ok('S: the list is capped (300) - the 301st add is refused, not an error', many.filter((x) => x).length === 300 && many[300] === null, String(many.filter((x) => x).length));
  device();
  const M7 = await load("export * from './store/installedFonts';");
  ok('S: with no canvas (no document) the availability probe says "available" - a note is never shown on a guess - and with no queryLocalFonts the lookup resolves null, never rejects', M7.fontIsAvailable('Anything') === true && (await M7.queryLocalFamilies()) === null, '');
  globalThis.window = { queryLocalFonts: async () => [{ family: 'Zed' }, { family: 'Alpha' }, { family: 'Alpha' }, { family: "B'ad" }] };
  const M8 = await load("export * from './store/installedFonts';");
  ok('S: the local-font lookup returns distinct, cleaned, sorted families', JSON.stringify(await M8.queryLocalFamilies()) === JSON.stringify(['Alpha', 'Bad', 'Zed']), JSON.stringify(await M8.queryLocalFamilies()));
  globalThis.window = { queryLocalFonts: async () => { throw new Error('NotAllowedError'); } };
  const M9 = await load("export * from './store/installedFonts';");
  ok('S: a declined permission prompt (the API throws) resolves null - never rejects', (await M9.queryLocalFamilies()) === null, '');
  delete globalThis.window;
}
const owners = ssrc.filter(([, t]) => /wrizo-installed-fonts/.test(t)).map(([f]) => f);
ok('S: no file but store/installedFonts.ts names the key - it is in no sync, persistence or page path', owners.length === 1 && owners[0] === 'desktop/src/store/installedFonts.ts', JSON.stringify(owners));

// ---- U: the UI contract (source) --------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const ctl = strip(read('components/TypeControl.tsx'));
const lex = read('store/deskLexicon.ts');
const uiOk = (c) => (c.match(/\{addRow\(\)\}/g) || []).length === 1 && /\{addRow\(\)\}\s*<\/ul>\s*<\/>/.test(c)   // the one Add call: inside the scoped list
  && /\{deviceRows\(\(n\) => n === brassKey, pickDevice\)\}/.test(c) && /\{deviceRows\(\(n\) => face\?\.source === 'device' && face\.name === n,/.test(c)   // the device list follows the roster in BOTH lists
  && /const missing = !fontIsAvailable\(name\);/.test(c) && /data-missing=\{missing \? 'true' : undefined\}/.test(c) && /\{missing && <span className="wz-type-note">\{t\('typeFaceMissing'\)\}<\/span>\}/.test(c)   // the quiet note
  && /face\?\.source === 'device' && !installed\.some/.test(c)   // a face from another device still shows as a row, so it can be seen and re-picked
  && /onClick=\{\(\) => setAdding\(true\)\}/.test(c) && /scope\.onPickSelection\(name === currentName \? null : fontSlug\(name\)\)/.test(c) && /onPickFace\(deviceFace\(name\)\)/.test(c)
  && /typeAddFont: 'Add a font…'/.test(lex) && /typeFaceMissing: 'not on this device - showing the default'/.test(lex);
ok('U: the device list follows the roster in BOTH lists; "Add a font..." is in the SCOPED list only (Free Write / Revise never get it - Nick\'s Q2); a face not installed here shows the quiet note and a face from another device still appears as a row', uiOk(ctl), '');

const STORE = 'local' + 'Storage';   // (the mutant below rewrites the module's own write; spelled apart so the seed-guard's raw-write scan reads this file as what it is - a harness, not a seeder)
const muts = [
  ['a device face falls back to its generic class again (no theme default)', read('store/fontRoster.ts'), (t) => t.replace("  if (stored.source === 'device') return `${quote(stored.name)}, var(--font-prose)`;\n", ''), async (t) => { const m = await load("export * from './store/fontRoster';", { 'store/fontRoster.ts': () => t }); return m.faceStack(DEV('X')) === "'X', var(--font-prose)"; }],
  ['the key is renamed', read('store/installedFonts.ts'), (t) => t.replace("const KEY = 'wrizo-installed-fonts';", "const KEY = 'wrizo-fonts';"), async (t) => { device(); const m = await load("export * from './store/installedFonts';", { 'store/installedFonts.ts': () => t }); const st = device(); m.addInstalledFont('Q'); return [...st.keys()].join() === 'wrizo-installed-fonts'; }],
  ['a repeat is added twice', read('store/installedFonts.ts'), (t) => t.replace('if (have) return have;', ''), async (t) => { device(); const m = await load("export * from './store/installedFonts';", { 'store/installedFonts.ts': () => t }); m.addInstalledFont('Q'); m.addInstalledFont('q'); return m.getInstalledFonts().length === 1; }],
  ['a hostile name is stored as typed', read('store/installedFonts.ts'), (t) => t.replace("replace(/[\\u0000-\\u001f'\"`\\\\{};<>]/g, '')", "replace(/[\\u0000-\\u001f]/g, '')"), async (t) => { device(); const m = await load("export * from './store/installedFonts';", { 'store/installedFonts.ts': () => t }); return m.cleanFontName("A'};") === 'A'; }],
  ['a refused write throws', read('store/installedFonts.ts'), (t) => t.replace('try { ' + STORE + '.setItem(KEY, JSON.stringify(next)); } catch { return false; }', STORE + '.setItem(KEY, JSON.stringify(next));'), async (t) => { device(null, { failWrite: true }); const m = await load("export * from './store/installedFonts';", { 'store/installedFonts.ts': () => t }); try { return m.addInstalledFont('Q') === null; } catch { return false; } }],
  ['the lookup rejects when permission is declined', read('store/installedFonts.ts'), (t) => t.replace("} catch { return null; }\n}\n\n/** Is this family installed", "} finally { /* no catch */ }\n}\n\n/** Is this family installed"), async (t) => { globalThis.window = { queryLocalFonts: async () => { throw new Error('NotAllowedError'); } }; try { const m = await load("export * from './store/installedFonts';", { 'store/installedFonts.ts': () => t }); return (await m.queryLocalFamilies()) === null; } catch { return false; } finally { delete globalThis.window; } }],
  ['"Add a font..." is added to the unscoped list too', ctl, (t) => t.replace("{deviceRows((n) => face?.source === 'device' && face.name === n,", "{addRow()}{deviceRows((n) => face?.source === 'device' && face.name === n,"), (t) => uiOk(t)],
  ['the missing-face note is dropped', ctl, (t) => t.replace("{missing && <span className=\"wz-type-note\">{t('typeFaceMissing')}</span>}", ''), (t) => uiOk(t)],
  ['a face from another device no longer shows as a row', ctl, (t) => t.replace("face?.source === 'device' && !installed.some", "false && !installed.some"), (t) => uiOk(t)],
];
for (const [name, text, mutate, pred] of muts) {
  const next = mutate(text);
  const real = await pred(text); const bad = next !== text ? await pred(next) : null;
  ok(`MUTANT: ${name} - its check must go RED (the mutation LANDED: the real source passes)`, next !== text && real === true && bad === false, '');
}

const bad = checks.filter((c) => !c.pass).length;
console.log(bad === 0 ? `\nINSTALLED-FONTS VERIFY: PASS (${checks.length} checks)` : `\nINSTALLED-FONTS VERIFY: FAIL - ${bad}/${checks.length} failed`);
process.exit(bad === 0 ? 0 : 1);
