// FLUX-ZOOM1-LOGIC (Flux zoom, step 1; the Wrizors' spec claude/wrizors/flux-zoom-step1.md; Nick's go, Nov 11). BROWSERLESS: no box turn, no browser. It runs the REAL pure functions of
// src/flux3/boardZoom.ts (esbuild bundle) and reads the integration's SOURCE, each with mutants that must LAND and turn their check RED.
//   Z1  the figure: 1.00 x 10^0 at true size, 2.50 x 10^-1 at a quarter, 4.00 x 10^0 at the inner limit, 1.00 x 10^-1 at the floor; a figure that rounds up to 10.00 carries into the exponent
//   Z2  the outer limit: the whole board's longer side fills 60% of the stage's shorter side; never below 0.10; never above 1.00 (a small board is not zoomed out further); junk in -> 1.00
//   Z3  the camera stops at a limit (no bounce): clamp holds 4.00 from above and the outer limit from below, and passes everything between
//   Z4  the wheel: Ctrl + wheel up (deltaY < 0) zooms in, down zooms out, symmetric; a mouse notch (about 100) and a trackpad pinch (small deltas) both give a sane step
//   Z5  a key notch is x1.25 and its inverse returns exactly; Ctrl+0 is 1.00
//   Z6  the store: session only (it starts at 1, a set is read back, a bad value is ignored, listeners run in the order they subscribed)
//   S1  the Schema wiring: the camera is set up BEFORE the layer's effect (paint, then the layer is told), the layer's view carries the live scale, the readout is the live figure (no typed 1.00)
//   S2  the pointer maths: no pointer delta in the board's gestures or its canvas handle is divided by the page width alone (each carries the scale), and the scale module is imported there
//   S3  the camera: Ctrl/Cmd + wheel is taken (preventDefault, passive: false), keys +, =, -, _, 0, a two-finger pinch, zoom off under the Stack, the frame's height held while zoomed, the scale put back to 1 on the way out
//   S4  nothing saved: boardZoom.ts and the camera touch no storage; the Schema's only new word is the existing flux3ReadZoom key (no new lexicon key)
//   S5  the hairline rule: the node brackets are never drawn thinner than 1 px (the CSS rule widening them below a half)
// Mutants (each must land and turn its check RED): the inner limit 5; the floor 0.01; the fill 0.7; the wheel direction flipped; the notch 1.5; the figure's carry removed; the clamp's floor dropped; a
// listener order reversed; the camera moved after the layer's effect; the gestures' divisor put back to the page width; preventDefault removed; the frame height not held; the bracket rule removed.
// Run: node scripts/harness/flux-zoom1-logic.mjs   (from apps/desktop)
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { srcText } from '../global-css.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.resolve(HERE, '..', '..');
const ROOT = path.resolve(DESKTOP, '..', '..');
const SRC = path.join(DESKTOP, 'src');
const results = [];
const ok = (name, pass, detail = '') => { results.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${pass || !detail ? '' : `  [${detail}]`}`); };
const read = (rel) => srcText(SRC, rel).replace(/\r\n/g, '\n');   // the shared source reader (c13-6)

// ---- bundle the real module (react is external: only the hook uses it)
const pnpmDir = path.join(ROOT, 'node_modules', '.pnpm');
const esb = fs.readdirSync(pnpmDir).find((d) => /^esbuild@/.test(d));
const bin = path.join(pnpmDir, esb, 'node_modules', 'esbuild', 'bin', 'esbuild');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wz-fluxzoom-'));
let n = 0;
const load = async (mutate) => {
  const out = path.join(tmp, `m${n++}.mjs`);
  execFileSync(process.execPath, [bin, path.join(SRC, 'flux3', 'boardZoom.ts'), '--bundle', '--format=esm', '--platform=node', `--outfile=${out}`, '--log-level=error', '--external:react'], { stdio: 'pipe' });
  let code = fs.readFileSync(out, 'utf8');
  for (const [from, to] of mutate || []) { const next = code.replace(from, to); if (next === code) throw new Error('mutation did not land: ' + String(from)); code = next; }
  fs.writeFileSync(out, code);
  return import(pathToFileURL(out).href + `?t=${n}`);
};
// react is imported by the bundle (useSyncExternalStore): give it a stub so the module loads without it
fs.mkdirSync(path.join(tmp, 'node_modules', 'react'), { recursive: true });
fs.writeFileSync(path.join(tmp, 'node_modules', 'react', 'package.json'), '{"name":"react","version":"0.0.0","main":"index.js","type":"commonjs"}');
fs.writeFileSync(path.join(tmp, 'node_modules', 'react', 'index.js'), 'exports.useSyncExternalStore = (s, g) => g();');

const near = (a, b, e = 1e-9) => Math.abs(a - b) <= e;
const checks = (M) => {
  const fig = (s) => `${M.zoomFigure(s).mant}|${M.zoomFigure(s).exp}`;
  const z1 = fig(1) === '1.00|0' && fig(0.25) === '2.50|-1' && fig(4) === '4.00|0' && fig(0.1) === '1.00|-1' && fig(0.9999) === '1.00|0' && fig(2) === '2.00|0' && fig(0.512) === '5.12|-1';
  const z2 = near(M.outerLimit(1000, 700, 1000, 1800), 0.6 * 700 / 1800) && M.outerLimit(1000, 700, 1000, 1e6) === 0.1 && M.outerLimit(1000, 700, 300, 200) === 1 && M.outerLimit(0, 0, 0, 0) === 1 && M.outerLimit(1000, 700, 1000, 560) <= 1;
  const out = 0.3;
  const z3 = M.clampScale(9, out) === 4 && M.clampScale(4.0001, out) === 4 && M.clampScale(0.01, out) === out && M.clampScale(2, out) === 2 && M.clampScale(out, out) === out && M.clampScale(4, out) === 4;
  const z4 = M.wheelFactor(-100) > 1 && M.wheelFactor(100) < 1 && near(M.wheelFactor(-100) * M.wheelFactor(100), 1) && M.wheelFactor(-3) > 1 && M.wheelFactor(-3) < 1.1 && M.wheelFactor(-100) < 1.5 && M.wheelFactor(0) === 1;
  const z5 = M.ZOOM_NOTCH === 1.25 && near(1 * M.ZOOM_NOTCH / M.ZOOM_NOTCH, 1, 1e-15) && near(M.clampScale(1 * M.ZOOM_NOTCH, 0.1), 1.25);
  return { z1, z2, z3, z4, z5, fig };
};
const M0 = await load();
const c0 = checks(M0);
ok('Z1 the figure: 1.00×10⁰ at true size, 2.50×10⁻¹ at a quarter, 4.00×10⁰ at the inner limit, 1.00×10⁻¹ at the floor, and a rounding carry (0.9999 -> 1.00×10⁰)', c0.z1, [1, 0.25, 4, 0.1, 0.9999].map(c0.fig).join(' '));
ok('Z2 the outer limit: the longer side of the board fills 60% of the stage\'s shorter side; never below 0.10; never above 1.00; junk in gives 1.00', c0.z2);
ok('Z3 the camera stops at a limit: 4.00 from above, the outer limit from below, everything between passes (no bounce)', c0.z3);
ok('Z4 the wheel: up zooms in, down zooms out, symmetric; a mouse notch and a trackpad pinch each give a sane step', c0.z4);
ok('Z5 a key notch is ×1.25 and its inverse returns exactly; one notch from true size lands at 1.25', c0.z5);
{
  const m = await load();
  const seen = [];
  const a = m.subscribeBoardScale(() => seen.push('a')); const b = m.subscribeBoardScale(() => seen.push('b'));
  const start = m.getBoardScale();
  m.setBoardScale(2); m.setBoardScale(2); m.setBoardScale(-1); m.setBoardScale(NaN); m.setBoardScale(0);
  const afterBad = m.getBoardScale();
  a(); b();
  m.setBoardScale(1);
  ok('Z6 the store: starts at 1 (session only), a set is read back, a repeated or bad value (0, negative, NaN) is ignored, listeners run once per change in the order they subscribed', start === 1 && afterBad === 2 && seen.join('') === 'ab' && m.getBoardScale() === 1, JSON.stringify({ start, afterBad, seen }));
}

// ---- the source reads
const schema = read('flux3/FluxSchema.tsx'), cam = read('flux3/useFluxCamera.ts'), gest = read('components/board/useBoardGestures.ts'), editor = read('components/BoardEditor.tsx');
const css = read('flux3/flux-v3.css'), zoomMod = read('flux3/boardZoom.ts');
const S = {
  s1: (t) => { const iCam = t.indexOf('useFluxCamera({'), iLayer = t.indexOf('const layer = new FluxLayer(host)'); return iCam > 0 && iLayer > iCam && /s: getBoardScale\(\)/.test(t) && /subscribeBoardScale\(place\)/.test(t) && /zoomFigure\(zoom\)/.test(t) && !/1\.00×10<sup>0<\/sup>/.test(t) && /boardId=\{id\}/.test(editor); },
  s2: (g, e) => !/\(e\.client[XY] - start[XY]\) \/ pageWidthPx\b/.test(g) && (g.match(/getBoardScale\(\)/g) || []).length >= 5 && /from '..\/..\/flux3\/boardZoom'/.test(g) && !/\(e\.client[XY] - start\.[xy]\)(?! \/ zs)\)?;?$/m.test(e.slice(e.indexOf('onCanvasHandleMove'), e.indexOf('onCanvasHandleMove') + 700).split('\n').filter((l) => /const d[xy] = /.test(l)).join('\n')),
  s3: (t) => /addEventListener\('wheel', onWheel, \{ passive: false \}\)/.test(t) && /if \(!\(e\.ctrlKey \|\| e\.metaKey\)\) return;[^\n]*\n\s*e\.preventDefault\(\)/.test(t) && /e\.key === '\+' \|\| e\.key === '='/.test(t) && /e\.key === '-' \|\| e\.key === '_'/.test(t) && /e\.key === '0'/.test(t)
    && /touchmove', onTouchMove, \{ passive: false \}/.test(t) && /activeRef\.current/.test(t) && /wrap\.style\.height = `\$\{frozenH\}px`/.test(t) && /if \(!active\) setBoardScale\(1\)/.test(t) && /setBoardScale\(1\);[^\n]*\n\s*paint\(\)/.test(t),
  s4: (t, z, sch) => !/localStorage|sessionStorage|indexedDB|saveBoard|upsert|persist/i.test(t + z) && !/lexicon|store\/lexicon/.test(t + z) && /t\('flux3ReadZoom'\)/.test(sch),
  s5: (t) => /\.flux3-node::after\{ border-width:max\(2px, calc\(1px \/ var\(--f3-zoom, 1\)\)\); \}/.test(t.replace(/\n/g, ' ')) || /flux3-node::after\{ border-width:max\(2px, calc\(1px \/ var\(--f3-zoom, 1\)\)\); \}/.test(t),
};
ok('S1 the Schema wiring: the camera comes BEFORE the layer\'s effect, the layer\'s view carries the live scale and follows every change, the readout is the live figure (no typed 1.00), the board passes its id', S.s1(schema));
ok('S2 the pointer maths: no gesture delta is divided by the page width alone (each carries the scale), the canvas handle likewise', S.s2(gest, editor), `${(gest.match(/getBoardScale\(\)/g) || []).length} reads`);
ok('S3 the camera: Ctrl/Cmd+wheel is taken (passive: false, preventDefault), + = - _ 0, the two-finger pinch, off under the Stack, the frame\'s height held, the scale put back to 1 on the way out', S.s3(cam));
ok('S4 nothing saved: no storage in the camera or the store; the only word is the existing flux3ReadZoom key', S.s4(cam, zoomMod, schema));
ok('S5 the hairline rule: the node brackets are widened below a half so they are drawn 1 px at least (--f3-zoom)', S.s5(css));

// ---- mutants
const mut = async (label, mutate, which, expectRed) => {
  const m = await load(mutate); const c = checks(m);
  ok(`MUT ${label}: lands and ${which} goes RED`, !c[which], JSON.stringify({ [which]: c[which] }));
};
await mut('inner limit 5', [[/ZOOM_IN_MAX = 4/, 'ZOOM_IN_MAX = 5']], 'z3');
await mut('floor 0.01', [[/ZOOM_OUT_FLOOR = 0\.1/, 'ZOOM_OUT_FLOOR = 0.01']], 'z2');
await mut('fill 0.7', [[/ZOOM_OUT_FILL = 0\.6/, 'ZOOM_OUT_FILL = 0.7']], 'z2');
await mut('wheel direction flipped', [[/Math\.exp\(-deltaY/, 'Math.exp(deltaY']], 'z4');
await mut('notch 1.5', [[/ZOOM_NOTCH = 1\.25/, 'ZOOM_NOTCH = 1.5']], 'z5');
await mut('figure carry removed', [[/if \(mant >= 10\)/, 'if (mant >= 1e9)']], 'z1');
await mut('clamp floor dropped', [[/Math\.max\(out, s\)/, 'Math.max(0, s)']], 'z3');
{
  const m = await load([[/for \(const f of \[\.\.\.subs\]\) f\(\);/, 'for (const f of [...subs].reverse()) f();']]);
  const seen = []; m.subscribeBoardScale(() => seen.push('a')); m.subscribeBoardScale(() => seen.push('b')); m.setBoardScale(2);
  ok('MUT listener order reversed: lands and Z6\'s order goes RED', seen.join('') !== 'ab', seen.join(''));
}
const swapOrder = (t) => { const i = t.indexOf('  useFluxCamera({'); if (i < 0) return t; const e = t.indexOf('\n', i) + 1, line = t.slice(i, e); return (t.slice(0, i) + t.slice(e)).replace('  const lastBox =', line + '  const lastBox ='); };
ok('MUT camera moved after the layer\'s effect: lands and S1 goes RED', (() => { const sw = swapOrder(schema); return sw !== schema && !S.s1(sw); })());
ok('MUT gesture divisor put back to the page width: lands and S2 goes RED', (() => { const g2 = gest.replace('(e.clientX - startX) / (pageWidthPx * getBoardScale());   // the Schema', '(e.clientX - startX) / pageWidthPx;   // the Schema'); return g2 !== gest && !S.s2(g2, editor); })());
ok('MUT canvas handle divisor dropped: lands and S2 goes RED', (() => { const e2 = editor.replace('const dx = (e.clientX - start.x) / zs;', 'const dx = (e.clientX - start.x);'); return e2 !== editor && !S.s2(gest, e2); })());
ok('MUT preventDefault removed: lands and S3 goes RED', (() => { const c2 = cam.replace(/(if \(!\(e\.ctrlKey \|\| e\.metaKey\)\) return;[^\n]*\n)\s*e\.preventDefault\(\);/, '$1'); return c2 !== cam && !S.s3(c2); })());
ok('MUT wheel listener made passive: lands and S3 goes RED', (() => { const c2 = cam.replace("wrap.addEventListener('wheel', onWheel, { passive: false })", "wrap.addEventListener('wheel', onWheel, { passive: true })"); return c2 !== cam && !S.s3(c2); })());
ok('MUT frame height not held: lands and S3 goes RED', (() => { const c2 = cam.replace('wrap.style.height = `${frozenH}px`;', ''); return c2 !== cam && !S.s3(c2); })());
ok('MUT zoom left on under the Stack: lands and S3 goes RED', (() => { const c2 = cam.replace('if (!active) setBoardScale(1);', ''); return c2 !== cam && !S.s3(c2); })());
ok('MUT a storage write added: lands and S4 goes RED', (() => { const c2 = cam + '\nlocalStorage.setItem("z", "1");\n'; return !S.s4(c2, zoomMod, schema); })());
ok('MUT bracket rule removed: lands and S5 goes RED', (() => { const css2 = css.replace(/:root\[data-flux3\]\[data-theme='flux'\] \.flux3-node::after\{ border-width:max\(2px, calc\(1px \/ var\(--f3-zoom, 1\)\)\); \}\n/, ''); return css2 !== css && !S.s5(css2); })());

fs.rmSync(tmp, { recursive: true, force: true });
const failed = results.filter((r) => !r.pass).length;
console.log(`\nFLUX-ZOOM1-LOGIC VERIFY: ${failed ? `FAIL - ${failed}/${results.length} failed` : `PASS (${results.length} checks)`}`);
process.exit(failed ? 1 : 0);
