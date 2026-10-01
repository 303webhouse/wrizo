// ITEM 207 (207a steps 1-3) — the roster, the loader and the size ladder, PROVEN WITHOUT A BROWSER.
//   Run: node apps/desktop/scripts/harness/item207-core.mjs
//
// The rendered checks (a real page in a real engine: computed style, control counts, the chars-per-line re-measure)
// are item207.mjs's, on a box turn. This file proves what needs no engine: the size lattice by VALUE, the roster
// table, the resolver, the fallback in kind, "an untouched page is byte-identical", and the BUILD - that the eager
// bundle did not grow and that no proprietary font file ships.
//
// The two store modules are bundled with esbuild (resolved through vite) and imported, so the checks run the SHIPPED
// source, not a copy. Falsification mutates the source text before bundling; every mutation is asserted to have landed.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const desktop = join(here, '..', '..');
const SRC = join(desktop, 'src');
const { build } = createRequire(createRequire(join(desktop, 'package.json')).resolve('vite'))('esbuild');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });

// Bundle store/fontRoster.ts (which pulls fontSize.ts) with optional source overrides; CSS imports resolve to empty.
async function load(overrides = {}) {
  const res = await build({
    stdin: { contents: "export * from './store/fontRoster'; export * from './store/fontSize';", resolveDir: SRC, loader: 'ts' }, bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent',
    loader: { '.css': 'empty' },
    plugins: [{ name: 'ov', setup(b) {
      b.onResolve({ filter: /\.css$/ }, (a) => ({ path: a.path, namespace: 'css-stub' }));
      b.onLoad({ filter: /.*/, namespace: 'css-stub' }, () => ({ contents: '', loader: 'js' }));
      b.onLoad({ filter: /\.ts$/ }, (a) => {
        const rel = relative(SRC, a.path).split('\\').join('/');
        const text = readFileSync(a.path, 'utf8');
        return { contents: overrides[rel] ? overrides[rel](text) : text, loader: 'ts' };
      });
    } }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(res.outputFiles[0].text).toString('base64')}`);
}
const swap = (from, to) => (t) => { if (!t.includes(from)) throw new Error(`mutation anchor missing: ${from}`); return t.replace(from, to); };

// Bundled the same way, the size module alone is what the lattice checks read.
const M = await load();
const walk = (start, step) => { const seq = [start]; let c = start; for (;;) { const n = step(c); if (n === null) break; seq.push(n); c = n; if (seq.length > 200) break; } return seq; };

// ---------------------------------------------------------------------------
// THE LATTICE — by value, never by count (41 is arithmetic, not a fixture)
// ---------------------------------------------------------------------------
const up = walk(11, M.stepUp);
const expectedUp = [11, 12, 13, 14, 15, 16, 17, 18, 20, 22, 24, 26, 28, 30, 34, 38, 42, 46, 50, 54, 58, 62, 66, 70, 74, 78, 82, 86, 90, 94, 98, 102, 106, 110, 114, 118];
ok('LATTICE: from 11, `+` visits 11..18 by ones, 20..30 by twos, 34..118 by fours, and then is inert', JSON.stringify(up) === JSON.stringify(expectedUp), `ends ${up[up.length - 1]}; steps ${up.length}`);
const down = walk(11, M.stepDown);
ok('LATTICE: from 11, `-` walks 10..6 by ones and is inert at 6', JSON.stringify(down) === JSON.stringify([11, 10, 9, 8, 7, 6]), JSON.stringify(down));
const fromTop = walk(118, M.stepDown);
ok('LATTICE: `-` from 118 walks back down every stop (118, 114 ... 34, 30, 28 ... 20, 18 ... 6)', fromTop[1] === 114 && fromTop.includes(30) && fromTop.includes(20) && fromTop[fromTop.length - 1] === 6 && JSON.stringify([...fromTop].reverse()) === JSON.stringify(M.sizeLattice()), `${fromTop.length} stops`);
ok('LATTICE: from an off-lattice typed value the buttons find the neighbouring stops (25: +26 -24 · 32: +34 -30 · 10.5: +11 -10)',
  M.stepUp(25) === 26 && M.stepDown(25) === 24 && M.stepUp(32) === 34 && M.stepDown(32) === 30 && M.stepUp(10.5) === 11 && M.stepDown(10.5) === 10,
  JSON.stringify([M.stepUp(25), M.stepDown(25), M.stepUp(32), M.stepDown(32), M.stepUp(10.5), M.stepDown(10.5)]));
ok('LATTICE: the top of the ladder — `+` at 118 is inert, `+` at 119/120 is inert, `-` from 119 and 120 is 118',
  M.stepUp(118) === null && M.stepUp(119) === null && M.stepUp(120) === null && M.stepDown(119) === 118 && M.stepDown(120) === 118,
  JSON.stringify([M.stepUp(118), M.stepUp(119), M.stepUp(120), M.stepDown(119), M.stepDown(120)]));
ok('LATTICE: the bottom is inert (`-` at 6 and below) and `+` from below the floor goes to 6',
  M.stepDown(6) === null && M.stepDown(5) === null && M.stepUp(3) === 6, JSON.stringify([M.stepDown(6), M.stepDown(5), M.stepUp(3)]));
const N = M.normalizeTypedSize;
ok('TYPED NUMBER: rounds to the nearest half point, clamps to 6..120, and refuses what is not a number (the caller keeps the previous value)',
  N('10.5') === 10.5 && N('10.26') === 10.5 && N('10.24') === 10 && N(5) === 6 && N('121') === 120 && N(119) === 119 && N(120) === 120 && N('abc') === null && N('') === null && N(NaN) === null && N(undefined) === null,
  JSON.stringify([N('10.5'), N('10.26'), N('10.24'), N(5), N('121'), N(119), N(120), N('abc'), N(''), N(NaN)]));
ok('TYPED NUMBER: displays "10.5" and "11", never "10.50" or "11.0"', M.formatSize(10.5) === '10.5' && M.formatSize(11) === '11' && M.formatSize(120) === '120', JSON.stringify([M.formatSize(10.5), M.formatSize(11)]));

// ---------------------------------------------------------------------------
// "11 IS TODAY" — an untouched page emits nothing, so its editor style is the one it always had
// ---------------------------------------------------------------------------
ok('11 = TODAY: a page that never chose (no face, no size) yields an EMPTY style — byte-identical to the prior build', JSON.stringify(M.pageTypeStyle(undefined, undefined)) === '{}', JSON.stringify(M.pageTypeStyle(undefined, undefined)));
ok('11 = TODAY: an explicit 11 yields no font-size either (the default is the absence of a rule)', M.pageTypeStyle(undefined, 11).fontSize === undefined && M.pageTypeStyle(M.storedFaceFor(M.rosterFace('Crimson Pro')), 11).fontSize === undefined, '');
ok('SIZE: 12 renders 17px x 12/11 x the paper scale, and 6 / 120 scale the same way (the number is the printed size; the screen is a uniform zoom)',
  M.pageTypeStyle(undefined, 12).fontSize === `calc(17px * ${12 / 11} * var(--paper-scale))` && M.pageTypeStyle(undefined, 120).fontSize === `calc(17px * ${120 / 11} * var(--paper-scale))`, M.pageTypeStyle(undefined, 12).fontSize);

// ---------------------------------------------------------------------------
// THE ROSTER AND THE RESOLVER
// ---------------------------------------------------------------------------
const NINE = ['Crimson Pro', 'Lora', 'EB Garamond', 'Source Serif 4', 'Times New Roman', 'Figtree', 'Atkinson Hyperlegible', 'Arial', 'Courier Prime'];
ok('ROSTER: exactly the nine approved faces, by name', JSON.stringify(M.ROSTER.map((f) => f.name)) === JSON.stringify(NINE), JSON.stringify(M.ROSTER.map((f) => f.name)));
const TNR = M.rosterFace('Times New Roman'); const ARIAL = M.rosterFace('Arial');
ok('ROSTER: Times New Roman and Arial are NAMED (source "named"), installed-first, with Tinos / Arimo as the metric-compatible fallback in the stack',
  TNR.source === 'named' && TNR.fallback === 'Tinos' && /^'Times New Roman', 'Tinos'/.test(TNR.stack) && ARIAL.source === 'named' && ARIAL.fallback === 'Arimo' && /^'Arial', 'Arimo'/.test(ARIAL.stack),
  JSON.stringify([TNR.stack, ARIAL.stack]));
ok('ROSTER: the stored form of a named face carries its fallback; a bundled one does not', JSON.stringify(M.storedFaceFor(TNR)) === JSON.stringify({ name: 'Times New Roman', generic: 'serif', source: 'named', fallback: 'Tinos' }) && !('fallback' in M.storedFaceFor(M.rosterFace('Lora'))), JSON.stringify(M.storedFaceFor(TNR)));
ok('SIZE-ADJUST (Fable\'s ruling): every face carries sizeAdjust and every one is 1 — the number is literal printed points; the field is the seam', M.ROSTER.every((f) => f.sizeAdjust === 1), '');
ok('RESOLVER: a known face resolves to its stack; an absent face resolves to nothing (the theme/voice face stands)', M.faceStack(M.storedFaceFor(M.rosterFace('Lora'))) === "'Lora Variable', Georgia, serif" && M.faceStack(undefined) === undefined, '');
ok('FALLBACK IN KIND: a face this build does not know still renders — its own name, then its generic class (a serif falls back to a serif, a monospace to a monospace, never a sans)',
  /'Some Device Font', Georgia, serif$/.test(M.faceStack({ name: 'Some Device Font', generic: 'serif', source: 'device' })) && /monospace$/.test(M.faceStack({ name: 'X', generic: 'monospace', source: 'device' })) && /sans-serif$/.test(M.faceStack({ name: 'Y', generic: 'sans-serif', source: 'file' })),
  M.faceStack({ name: 'Some Device Font', generic: 'serif', source: 'device' }));
ok('RESOLVER: a hostile name cannot break out of the font-family value (quotes and backslashes are stripped)', !/[\\]/.test(M.faceStack({ name: "A'; } body { x:", generic: 'serif', source: 'device' })) && (M.faceStack({ name: "A'; } body { x:", generic: 'serif', source: 'device' }).match(/'/g) || []).length === 2, M.faceStack({ name: "A'; } body { x:", generic: 'serif', source: 'device' }));

// ---------------------------------------------------------------------------
// LOAD ON CHOOSE, DEFAULT EAGER — read from main.tsx (the eager list) and the BUILD (what actually ships)
// ---------------------------------------------------------------------------
const mainSrc = readFileSync(join(SRC, 'main.tsx'), 'utf8');
const eagerImports = [...mainSrc.matchAll(/^import '(@fontsource[^']*)';/gm)].map((m) => m[1]);
const NEW_SIX = ['lora', 'eb-garamond', 'source-serif-4', 'atkinson-hyperlegible', 'tinos', 'arimo'];
ok('LOAD-ON-CHOOSE: main.tsx imports NONE of the six new families eagerly (the eager list did not grow)', NEW_SIX.every((n) => !eagerImports.some((i) => i.includes(`/${n}`))), JSON.stringify(eagerImports));
ok('LOAD-ON-CHOOSE: the roster\'s eager faces are exactly the ones main.tsx imports (Crimson Pro, Figtree, Courier Prime), and every other face has a real loader',
  JSON.stringify(M.ROSTER.filter((f) => f.eager).map((f) => f.name).sort()) === JSON.stringify(['Courier Prime', 'Crimson Pro', 'Figtree'])
  && ['crimson-pro', 'figtree', 'courier-prime'].every((n) => eagerImports.some((i) => i.includes(`/${n}`)))
  && M.ROSTER.filter((f) => !f.eager).every((f) => f.load.toString() !== M.ROSTER[0].load.toString()), '');

// The BUILD: run it, then read what shipped.
let buildNote = '';
const dist = join(desktop, 'dist-web');
try { execFileSync('pnpm', ['run', 'build:web'], { cwd: desktop, stdio: 'ignore', shell: true }); } catch (e) { buildNote = `build failed: ${e.message}`; }
const files = []; const scan = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) scan(p); else files.push({ p, rel: relative(dist, p).split('\\').join('/'), size: statSync(p).size }); } };
if (existsSync(dist)) scan(dist);
ok('BUILD: the web build ran and produced output (a scan of an empty directory proves nothing)', files.length > 20 && !buildNote, `${files.length} files ${buildNote}`);
ok('LICENCE GUARD: no Times New Roman or Arial font file ships in the build output — only Tinos and Arimo (open) do', !files.some((f) => /(^|[\/_-])(times|timesnewroman|tnr|arial|arialmt)[\w-]*\.(woff2?|ttf|otf)$/i.test(f.rel)) && files.some((f) => /tinos/i.test(f.rel)) && files.some((f) => /arimo/i.test(f.rel)),
  `tinos ${files.filter((f) => /tinos/i.test(f.rel)).length} · arimo ${files.filter((f) => /arimo/i.test(f.rel)).length} files`);
const html = existsSync(join(dist, 'index.html')) ? readFileSync(join(dist, 'index.html'), 'utf8') : '';
const eagerCss = [...html.matchAll(/(?:href|src)="\.\/(assets\/[^"]+\.css)"/g)].map((m) => m[1]);
const eagerCssText = eagerCss.map((f) => readFileSync(join(dist, f), 'utf8')).join('\n');
ok('LOAD-ON-CHOOSE (the build): the eagerly-loaded CSS carries @font-face for the default faces and NONE of the six new families', eagerCss.length >= 1 && /Crimson Pro Variable/.test(eagerCssText) && NEW_SIX.every((n) => !new RegExp(`font-family:\\s*['"]?${n.replace(/-/g, '[ -]')}`, 'i').test(eagerCssText)), `${eagerCss.length} eager css file(s), ${Math.round(eagerCssText.length / 1024)} KB`);
const cssFiles = files.filter((f) => f.rel.endsWith('.css'));
const lazyFamilies = NEW_SIX.filter((n) => cssFiles.some((f) => !eagerCss.includes(f.rel) && new RegExp(`font-family:\\s*['"]?${n.replace(/-/g, '[ -]')}`, 'i').test(readFileSync(f.p, 'utf8'))));
ok('LOAD-ON-CHOOSE (the build): each of the six new families is in a SEPARATE lazily-fetched CSS chunk, so choosing fetches it and opening the app does not', lazyFamilies.length === 6, JSON.stringify(lazyFamilies));
const eagerBytes = files.filter((f) => eagerCss.includes(f.rel) || /assets\/index-[^/]*\.js$/.test(f.rel)).reduce((n, f) => n + f.size, 0);
ok('REPORT: eager entry bytes (the entry JS + eager CSS) — recorded so the next change can be compared, not judged', true, `${Math.round(eagerBytes / 1024)} KB across ${eagerCss.length + 1} files; lazy font CSS ${cssFiles.length - eagerCss.length} chunk(s)`);

// ---------------------------------------------------------------------------
// HIS LAW, MADE ASSERTABLE STATICALLY — the control's elements and where it is mounted (the rendered counts are item207.mjs's)
// ---------------------------------------------------------------------------
const src = (rel) => readFileSync(join(SRC, rel), 'utf8').replace(/\r\n/g, '\n');
const noComments = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const ctlShape = (t) => {
  const code = noComments(t);
  const inputs = (code.match(/<input\b/g) || []).length;
  const guarded = /form === 'full' && \(\s*<input\b/.test(code);
  return {
    buttons: (code.match(/<button\b/g) || []).length,
    inputs,
    inputGuardedByFullForm: inputs === 0 || guarded,
    addDoor: /add a font|addFont/i.test(code),
    caption: /wz-sliver-h|<label\b|<h[1-6]\b|<legend\b/.test(code),
  };
};
const shape = ctlShape(src('components/TypeControl.tsx'));
ok('MINIMAL (his law): the control is exactly a face button and a `-` `+` pair (3 buttons) plus ONE number input, and that input exists only in the full form',
  shape.buttons === 3 && shape.inputs === 1 && shape.inputGuardedByFullForm, JSON.stringify(shape));
ok('MINIMAL: no caption or heading of any kind in the control (no label, legend or heading element, no eyebrow class) — a control\'s name lives in its aria-label', !shape.caption, JSON.stringify(shape));
ok('NO ADD DOOR (207a): the control carries no "Add a font…" row — it arrives with Route A (207b), and Free Write never gets it (his Q2)', !shape.addDoor, '');
const LBL = M.faceNameFromStack;
ok('LABEL: the unchosen face is named from what ACTUALLY renders — the first family of the resolved --font-prose, quotes and " Variable" removed (Crimson Pro, Figtree, and under the Flux voice Chakra Petch — never the voice dial\'s own word)',
  LBL("'Crimson Pro Variable', Georgia, serif") === 'Crimson Pro' && LBL("'Figtree Variable', system-ui, sans-serif") === 'Figtree' && LBL("'Chakra Petch', sans-serif") === 'Chakra Petch' && LBL('Georgia, serif') === 'Georgia' && LBL('') === null && LBL(null) === null && LBL('  ') === null,
  JSON.stringify([LBL("'Crimson Pro Variable', Georgia, serif"), LBL("'Chakra Petch', sans-serif"), LBL('')]));
ok('LABEL: the control reads the resolved --font-prose, not the voice attribute (no data-voice lookup remains in it)',
  /getPropertyValue\('--font-prose'\)/.test(src('components/TypeControl.tsx')) && !/data-voice/.test(noComments(src('components/TypeControl.tsx'))), '');
const sliverSrc = src('components/Sliver.tsx');
const mount = sliverSrc.match(/content\.type && \(\s*<div className="wz-sliver-section wz-sliver-type">[\s\S]*?<\/div>\s*\)\}/);
ok('MOUNT: the sliver mounts the control on the Free Write, Draft and Revise arms only, in one section with no heading',
  !!mount && /content\.kind === 'freewrite' \|\| content\.kind === 'draft' \|\| content\.kind === 'revise'/.test(sliverSrc) && !/wz-sliver-h/.test(mount[0]), mount ? 'found' : 'mount block not found');
const pe = src('pages/PageEditor.tsx');
ok('FORMS: Free Write passes the SMALL form (and none in INK), Draft and Revise pass the FULL form',
  /type: instrument === 'ink' \? undefined : typeMember\('small'\)/.test(pe) && /kind: 'draft',[\s\S]{0,200}type: typeMember\('full'\)/.test(pe) && /kind: 'revise', type: typeMember\('full'\)/.test(pe), '');
ok('SCREENPLAY: absent, not greyed — the screenplay editor passes no `type` to its sliver content (its face is the format\'s)',
  !/\btype:\s*(typeMember|\{)/.test(noComments(src('components/ScriptEditor.tsx'))), '');
const be = src('components/BoardEditor.tsx');
ok('CARD: the card\'s styling dock mounts the SMALL form (no number), in the popup only', /<TypeControl form="small"/.test(be) && !/<TypeControl form="full"/.test(be), '');
const per = src('store/persistence.ts');
ok('CARD COPY: copyCardToBoard carries fontFace and fontSize (a copy that came back in the everyday font is not the same card)',
  /fontFace !== undefined \? \{ fontFace: box\.fontFace \}/.test(per) && /fontSize !== undefined \? \{ fontSize: box\.fontSize \}/.test(per), '');
ok('NO SCHEMA (207a): the server is untouched — no migration or sync.ts mapper mentions face or size',
  !/fontFace|fontSize|pageSettings\.face/.test(readFileSync(join(desktop, '..', 'server', 'src', 'sync.ts'), 'utf8')) && !/fontFace|font_face/.test(readFileSync(join(desktop, '..', 'server', 'src', 'migrate.ts'), 'utf8')), '');

// ---------------------------------------------------------------------------
// FALSIFICATION — mutate the SHIPPED source in memory; each mutation asserted to land; each must turn a check red
// ---------------------------------------------------------------------------
const mutant = async (name, overrides, red) => {
  let W;
  try { W = await load(overrides); } catch (e) { ok(`FALSIFICATION ${name}: the mutation LANDED`, false, e.message); return; }
  const wentRed = red(W);
  ok(`FALSIFICATION ${name} — must go RED`, wentRed, wentRed ? '' : 'GREEN — the checks above would not notice');
};
await mutant('M1 the ladder\'s two-point band is dropped', { 'store/fontSize.ts': swap('for (let n = 20; n <= 30; n += 2) out.push(n);', '') }, (W) => JSON.stringify(walk(11, W.stepUp)) !== JSON.stringify(expectedUp));
await mutant('M2 `+` is allowed to reach 120', { 'store/fontSize.ts': swap('n <= SIZE_STEP_MAX; n += 4', 'n <= 122; n += 2') }, (W) => W.stepUp(118) !== null);
await mutant('M3 the default is no longer today\'s rendering (an untouched page would emit a rule)', { 'store/fontSize.ts': swap('export const SIZE_DEFAULT = 11;', 'export const SIZE_DEFAULT = 12;') }, (W) => JSON.stringify(W.pageTypeStyle(undefined, undefined)) !== '{}' || W.pageTypeStyle(undefined, 11).fontSize !== undefined);
await mutant('M4 a face is size-adjusted (the literal-points ruling broken)', { 'store/fontRoster.ts': swap("name: 'Arial', generic: 'sans-serif', source: 'named', fallback: 'Arimo', group: 'sans', sizeAdjust: 1", "name: 'Arial', generic: 'sans-serif', source: 'named', fallback: 'Arimo', group: 'sans', sizeAdjust: 0.9") }, (W) => !W.ROSTER.every((f) => f.sizeAdjust === 1));
await mutant('M5 the fallback stops being faithful in kind (a serif falls back to a sans)', { 'store/fontRoster.ts': swap("serif: 'Georgia, serif',", "serif: 'system-ui, sans-serif',") }, (W) => !/serif$/.test(W.faceStack({ name: 'Q', generic: 'serif', source: 'device' })) || /system-ui/.test(W.faceStack({ name: 'Q', generic: 'serif', source: 'device' })));
await mutant('M6 a name is no longer sanitised (a hostile font name breaks out of the value)', { 'store/fontRoster.ts': swap("n.replace(/['\\\\]/g, '')", 'n') }, (W) => (W.faceStack({ name: "A'; } body { x:", generic: 'serif', source: 'device' }).match(/'/g) || []).length !== 2);
await mutant('M7 Times New Roman loses its open fallback', { 'store/fontRoster.ts': swap("stack: \"'Times New Roman', 'Tinos', Times, serif\"", "stack: \"'Times New Roman', Times, serif\"") }, (W) => !/'Tinos'/.test(W.rosterFace('Times New Roman').stack));
await mutant('M11 the unchosen label keeps the " Variable" suffix (the package\'s name leaks to the writer)', { 'store/fontRoster.ts': swap(".replace(/ Variable$/, '')", '') }, (W) => W.faceNameFromStack("'Crimson Pro Variable', Georgia, serif") !== 'Crimson Pro');

{
  const t = src('components/TypeControl.tsx');
  const landed = (mutated) => mutated !== t;
  const extraButton = t.replace('</div>\n  );\n}', '<button type="button">Add a font</button></div>\n  );\n}');
  ok('FALSIFICATION M8 an extra button (an add door) is added to the control — must go RED', landed(extraButton) && (ctlShape(extraButton).buttons !== 3 || ctlShape(extraButton).addDoor), '');
  const unguarded = t.replace("{form === 'full' && (", '{(');
  ok('FALSIFICATION M9 the number input is shown in EVERY form (Free Write would gain it) — must go RED', landed(unguarded) && !ctlShape(unguarded).inputGuardedByFullForm, '');
  const captioned = t.replace('<div className="wz-type"', '<div className="wz-sliver-h">Type</div><div className="wz-type"');
  ok('FALSIFICATION M10 a heading is added above the control — must go RED', landed(captioned) && ctlShape(captioned).caption, '');
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 300)}]` : ''}`);
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // Parks nothing: the roster, loader and ladder are new; no prior assertion is falsified by them.
  console.log(parkedChecks.every((c) => c.pass)
    ? `\nITEM207-CORE PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed; nothing parked`
    : `\nITEM207-CORE PARKED: FAIL — ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}
const all = checks.concat(parkedChecks);
const pass = all.every((c) => c.pass);
console.log(pass ? `\nITEM207-CORE VERIFY: PASS (${all.length} checks)` : `\nITEM207-CORE VERIFY: FAIL — ${all.filter((c) => !c.pass).length}/${all.length} failed`);
process.exit(pass ? 0 : 1);
