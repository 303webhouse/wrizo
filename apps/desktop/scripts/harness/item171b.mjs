// ITEM 171-B — the BROWSERLESS half: the scalable eraser's field and its read-
// boundary clamp, the coordinate-basis conversions, and the census that cleared
// `eraserWidth` to be additive. Browserless in the hooks-order.mjs / seed-guard.mjs
// shape: no browser, no CDP, nothing for another lane's run to collide with.
// (The pen's pointer rule, InkSwitch on boards and cards, and the eraser's size
// control are BROWSER work and are NOT covered here — a later slice.)
//
// It loads the REAL product modules — store/ink.ts and store/strokeBasis.ts — by
// transpiling them with the repo's own `typescript`, so a check can never pass
// against a copy. Both modules are pure and import types only.
//
// Run: node scripts/harness/item171b.mjs   (from apps/desktop, after pnpm install)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.resolve(here, '..', '..');
const SRC = path.join(DESKTOP, 'src');
const require = createRequire(path.join(DESKTOP, 'package.json'));
const ts = require('typescript');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });

// ---- load the real modules ------------------------------------------------
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'item171b-'));
function load(rel) {
  const src = fs.readFileSync(path.join(SRC, rel), 'utf8');
  const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
  const dest = path.join(tmp, path.basename(rel).replace(/\.ts$/, '.mjs'));
  fs.writeFileSync(dest, out);
  return import(pathToFileURL(dest).href);
}
const ink = await load('store/ink.ts');
const basis = await load('store/strokeBasis.ts');

const { ERASER_WIDTH, ERASER_WIDTH_MIN, ERASER_WIDTH_MAX, eraserWidthOf, strokeWidth, translateGroup } = ink;
const { boxToCanvas, canvasToBox } = basis;
const pts = [{ x: 0.1, y: 0.05, p: 0.5 }, { x: 0.2, y: 0.1 }];
const erase = (extra = {}) => ({ points: pts, eraser: true, ...extra });

// ---- the eraser's width: absence is the migration --------------------------
ok('E1: an erase with NO eraserWidth paints at the old fixed ERASER_WIDTH — every erase already on disk renders identically (the migration is absence)',
  strokeWidth(erase()) === ERASER_WIDTH && ERASER_WIDTH === 22, String(strokeWidth(erase())));
ok('E2: an in-range eraserWidth is honoured exactly',
  strokeWidth(erase({ eraserWidth: 40 })) === 40, String(strokeWidth(erase({ eraserWidth: 40 }))));
ok('E3: the clamp holds at BOTH bounds — below MIN reads as MIN, above MAX reads as MAX',
  eraserWidthOf(erase({ eraserWidth: 1 })) === ERASER_WIDTH_MIN && eraserWidthOf(erase({ eraserWidth: 9999 })) === ERASER_WIDTH_MAX,
  JSON.stringify({ lo: eraserWidthOf(erase({ eraserWidth: 1 })), hi: eraserWidthOf(erase({ eraserWidth: 9999 })), MIN: ERASER_WIDTH_MIN, MAX: ERASER_WIDTH_MAX }));
const garbage = [NaN, Infinity, -Infinity, 0, -5, '30', null, {}, [], true];
const garbageReads = garbage.map((g) => eraserWidthOf(erase({ eraserWidth: g })));
ok('E4: garbage (NaN, ±Infinity, 0, negative, a string, null, an object, an array, a boolean) coerces to the DEFAULT, never to a bound and never to NaN — a row written wrongly by another client cannot mis-paint a page',
  garbageReads.every((w) => w === ERASER_WIDTH), JSON.stringify(garbageReads));
ok('E5: eraserWidth is IGNORED on a non-eraser stroke — an ink stroke that somehow carries one paints at its own nib width',
  strokeWidth({ points: pts, tip: 'pen', nib: 'regular', eraserWidth: 60 }) === strokeWidth({ points: pts, tip: 'pen', nib: 'regular' }),
  JSON.stringify({ withField: strokeWidth({ points: pts, tip: 'pen', nib: 'regular', eraserWidth: 60 }), without: strokeWidth({ points: pts, tip: 'pen', nib: 'regular' }) }));
ok('E6: the bounds are sane — MIN < default < MAX, so the default is reachable in both directions',
  ERASER_WIDTH_MIN < ERASER_WIDTH && ERASER_WIDTH < ERASER_WIDTH_MAX, JSON.stringify({ ERASER_WIDTH_MIN, ERASER_WIDTH, ERASER_WIDTH_MAX }));

// ---- the census's claims, EXECUTED (spreads keep the field) ----------------
const moved = translateGroup([erase({ eraserWidth: 33 }), erase()], [0, 1], 0.1, 0.2);
ok('C1: translateGroup (the group-move path) carries eraserWidth through — the field survives a drag, and an erase with none stays with none',
  moved[0].eraserWidth === 33 && !('eraserWidth' in moved[1]), JSON.stringify(moved.map((m) => m.eraserWidth)));
const wire = JSON.parse(JSON.stringify(erase({ eraserWidth: 47 })));
ok('C2: eraserWidth survives the JSON round trip the sync mapper performs (JSON.stringify(e.strokes) out, jsonb back) — a whole-blob mapper has no per-field list to omit it from',
  wire.eraserWidth === 47 && wire.eraser === true, JSON.stringify(wire));

// ---- the coordinate bases ---------------------------------------------------
// A card at canvas (0.2, 0.1), 0.4 wide. Box-local (0.5, 0.25) -> canvas
// (0.2 + 0.5*0.4, 0.1 + 0.25*0.4) = (0.4, 0.2): y scales by the box's WIDTH, not a height.
const frame = { x: 0.2, y: 0.1, w: 0.4 };
const one = boxToCanvas(frame, [{ points: [{ x: 0.5, y: 0.25, p: 0.7 }], tip: 'marker', nib: 'broad', ink: 'sea' }]);
const near = (a, b) => Math.abs(a - b) < 1e-12;
ok('B1: box -> canvas puts a point where the card is, and y scales by the box\'s WIDTH (the penStroke-y trap): (0.5,0.25) in a 0.4-wide card at (0.2,0.1) is (0.4,0.2)',
  near(one[0].points[0].x, 0.4) && near(one[0].points[0].y, 0.2), JSON.stringify(one[0].points[0]));
ok('B2: a basis change keeps EVERY other field — pressure, tip, nib, ink — because it spreads instead of rebuilding by hand',
  one[0].points[0].p === 0.7 && one[0].tip === 'marker' && one[0].nib === 'broad' && one[0].ink === 'sea', JSON.stringify(one[0]));
const eraseIn = boxToCanvas(frame, [erase({ eraserWidth: 55 })]);
ok('B3: an ERASE crossing a basis keeps eraser and eraserWidth, and its width is NOT rescaled (painted width is px, not a coordinate)',
  eraseIn[0].eraser === true && eraseIn[0].eraserWidth === 55, JSON.stringify(eraseIn[0]));
const orig = [{ points: [{ x: 0.13, y: 0.77 }, { x: 0.9, y: 0.02, p: 0.3 }], tip: 'pencil' }, erase({ eraserWidth: 20 })];
const round = canvasToBox(frame, boxToCanvas(frame, orig));
ok('B4: canvasToBox is the exact inverse of boxToCanvas — a round trip returns every point to within floating-point error and every non-coordinate field untouched',
  round.every((s, i) => s.points.every((q, j) => near(q.x, orig[i].points[j].x) && near(q.y, orig[i].points[j].y) && q.p === orig[i].points[j].p)
    && s.tip === orig[i].tip && s.eraser === orig[i].eraser && s.eraserWidth === orig[i].eraserWidth), JSON.stringify(round));
ok('B5: a conversion never mutates its input (the caller\'s stored strokes are not edited in place)',
  orig[0].points[0].x === 0.13 && orig[0].points[0].y === 0.77, JSON.stringify(orig[0].points[0]));
const refused = [0, -1, NaN, Infinity].map((w) => { try { boxToCanvas({ x: 0, y: 0, w }, [{ points: pts }]); return 'no-throw'; } catch (e) { return e instanceof RangeError ? 'refused' : 'wrong-error'; } });
ok('B6: an unusable frame (width 0, negative, NaN, Infinity) is REFUSED with a RangeError — never silently returning strokes in the wrong basis',
  refused.every((r) => r === 'refused'), JSON.stringify(refused));

// ---- the census guard: what BUILDS a Stroke is measured, with coverage ------
function walk(dir, acc = []) {
  for (const n of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, n.name);
    if (n.isDirectory()) walk(p, acc); else if (/\.(ts|tsx)$/.test(n.name)) acc.push(p);
  }
  return acc;
}
const files = walk(SRC);
// A site that reads a source stroke's tip/nib/ink/eraser/eraserWidth INTO a new
// object literal is a hand-rebuild: it would drop any field it does not name.
const REBUILD = /\b(tip|nib|ink|eraser|eraserWidth)\s*:\s*[A-Za-z_$][\w$]*\.(tip|nib|ink|eraser|eraserWidth)\b/;
const rebuilds = [];
let scanned = 0;
for (const f of files) {
  const text = fs.readFileSync(f, 'utf8');
  scanned++;
  text.split('\n').forEach((line, i) => { if (REBUILD.test(line)) rebuilds.push(`${path.relative(SRC, f)}:${i + 1}`); });
}
ok('C3: COVERAGE — the census read the whole client (> 100 source files), so a zero below means something and not blindness',
  scanned > 100, `scanned=${scanned}`);
ok('C4: NO client site rebuilds a Stroke field by field from another stroke (tip/nib/ink/eraser/eraserWidth copied by hand) — so an additive field cannot be dropped in silence; the census found none, and a new one fails this run',
  rebuilds.length === 0, JSON.stringify(rebuilds));
// The census's own instrument must be able to see one: a control line that IS a rebuild.
ok('C5: the census pattern is not blind — it matches a hand-rebuild line (control) and does not match a spread (control)',
  REBUILD.test('const c = { points: s.points, tip: s.tip, nib: s.nib };') && !REBUILD.test('const c = { ...s, points: moved };'), '');

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log('\nITEM171B PARKED: PASS (0 checks) — HARNESS_PARKED=1 armed; this file parks nothing: it asserts new behaviour only, and falsifies no earlier check.');
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nITEM171B VERIFY: PASS (${checks.length} checks)`
  : `\nITEM171B VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* best-effort */ }
process.exit(pass ? 0 : 1);
