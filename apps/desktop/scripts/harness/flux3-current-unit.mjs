// BROWSERLESS CHECK for THE FLUX CURRENT'S DRAWING RULES (Fable, Nov 21, 4:56 pm: "ONE current layer for two things ... (2) the stage current, v2: a 1 px cyan spark ~60 px, one lap per menu, ~0.55 s, gutters only,
// never over the page, nothing stays lit, none under reduced motion"; flux-full-look-for-monday.md §2). The rules are pure functions over rectangles (src/flux3/fluxCurrentPath.ts), so they can be proved without a
// browser, and shown to FAIL: this file runs the REAL module (bundled with esbuild) and then three mutants of it.
//   U0  the module exports stagePaths, pathLength, crossesRect, sparkLayers, SPARK_PX = 60 and SPARK_MS = 550
//   U1  the spark LEAVES THE PRESSED BUTTON along the top bar's lower edge to each side, then runs ONE LAP around the menu's edge (a closed menu: its opener tab): its path has the menu's four corners
//   U2  GUTTERS ONLY: no point and no segment of any path is inside the page's rectangle - on a menu that stands flush against the page, on a menu whose rectangle overlaps the page, and on a page whose top
//       is above the bar's lower edge
//   U3  a side with no menu (Wire In has none) has no path; the other side still has its own
//   U4  the spark is a 60 px streak that fades along its tail: four layers (60, 30, 12 and 3 px) that end at one head, the opacity rising toward the head, the tail 1 px, the head the pale cyan #BEEBFF
//   MUT1  the page clamp removed: U2 goes RED
//   MUT2  the lap's closing edge removed: U1 goes RED
//   MUT3  the bar edge not held above the page: U2 goes RED (the page whose top is above the bar's lower edge)
// RED on the tree without src/flux3/fluxCurrentPath.ts. Run (from apps/desktop): node scripts/harness/flux3-current-unit.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(here, '..', '..', 'src');
const FILE = path.join(SRC, 'flux3/fluxCurrentPath.ts');
const require = createRequire(import.meta.url);
const esbuild = createRequire(require.resolve('vite'))('esbuild');
let fails = 0;
let checks = 0;
const ok = (cond, msg, detail = '') => { checks += 1; console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}${detail ? `  [${detail}]` : ''}`); if (!cond) fails += 1; };

if (!fs.existsSync(FILE)) {
  console.log('INFO tree: flux3/fluxCurrentPath.ts ABSENT');
  ok(false, 'U0..U4 the current\'s drawing rules exist (src/flux3/fluxCurrentPath.ts)');
  console.log(`\nFLUX3-CURRENT-UNIT VERIFY: FAIL - ${fails}/${checks} failed`);
  process.exit(1);
}

async function load(source) {
  const out = await esbuild.build({ stdin: { contents: source, loader: 'ts', resolveDir: path.dirname(FILE), sourcefile: 'fluxCurrentPath.ts' }, bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent' });
  const text = out.outputFiles[0].text;
  return import(`data:text/javascript;base64,${Buffer.from(text).toString('base64')}`);
}
const src = fs.readFileSync(FILE, 'utf8');
const mutate = (from, to) => { if (!src.includes(from)) throw new Error(`mutant anchor missing: ${from.slice(0, 60)}`); return src.replace(from, to); };
const R = (left, top, right, bottom) => ({ left, top, right, bottom });

// a 1920 x 1080 room: the bar's lower edge at 80, the page 500..1300 wide from 100 down, the Front menu to its left and the Back menu to its right
const PAGE = R(500, 100, 1300, 900);
const BTN = R(660, 40, 720, 70);          // the pressed stage button, in the bar
const FRONT = R(100, 100, 480, 900);       // the Front menu's box (flush gutter: 20 px from the page)
const BACK = R(1320, 100, 1700, 900);
const geom = (o = {}) => ({ btn: BTN, barBottom: 80, page: PAGE, left: FRONT, right: BACK, ...o });
const cornersIn = (pts, r) => [[r.left, r.top], [r.right, r.top], [r.left, r.bottom], [r.right, r.bottom]].every(([x, y]) => pts.some(([px, py]) => Math.abs(px - x) <= 1.5 && Math.abs(py - y) <= 1.5));
const clear = (M, g) => ['left', 'right'].every((s) => { const p = M.stagePaths(g)[s]; return !p || (p.every(([x, y]) => !(x > g.page.left && x < g.page.right && y > g.page.top && y < g.page.bottom)) && !M.crossesRect(p, g.page)); });

async function suite(M, label) {
  const r = {};
  const keep = (k, pass, detail = '') => { r[k] = { pass: !!pass, detail }; };
  keep('U0', typeof M.stagePaths === 'function' && typeof M.pathLength === 'function' && typeof M.crossesRect === 'function' && typeof M.sparkLayers === 'function' && M.SPARK_PX === 60 && M.SPARK_MS === 550, JSON.stringify({ SPARK_PX: M.SPARK_PX, SPARK_MS: M.SPARK_MS }));
  const g = geom();
  const P = M.stagePaths(g);
  const startsAtButton = (p, y0) => !!p && Math.abs(p[0][0] - (BTN.left + BTN.right) / 2) <= 1 && Math.abs(p[0][1] - y0) <= 1 && Math.abs(p[1][1] - y0) <= 1;
  keep('U1', !!P.left && !!P.right && startsAtButton(P.left, 80) && startsAtButton(P.right, 80) && cornersIn(P.left, FRONT) && cornersIn(P.right, BACK) && M.pathLength(P.left) > 2 * (380 + 800) && M.pathLength(P.right) > 2 * (380 + 800),
    JSON.stringify({ left: P.left && P.left.length, right: P.right && P.right.length, ll: P.left && Math.round(M.pathLength(P.left)) }));
  const flush = geom({ left: R(100, 100, 500, 900), right: R(1300, 100, 1700, 900) });
  const overlap = geom({ left: R(100, 100, 620, 900), right: R(1180, 100, 1700, 900) });
  const high = geom({ page: R(500, 60, 1300, 900) });
  keep('U2', clear(M, g) && clear(M, flush) && clear(M, overlap) && clear(M, high), JSON.stringify({ g: clear(M, g), flush: clear(M, flush), overlap: clear(M, overlap), high: clear(M, high) }));
  const none = M.stagePaths(geom({ left: null, right: null }));
  const onlyRight = M.stagePaths(geom({ left: null }));
  keep('U3', none.left === null && none.right === null && onlyRight.left === null && !!onlyRight.right && onlyRight.right.length >= 5, JSON.stringify({ none, onlyRight: onlyRight.right && onlyRight.right.length }));
  const closed = geom({ left: R(484, 116, 500, 150) });   // a closed menu: its opener tab, 16 x 34
  const pc = M.stagePaths(closed).left;
  keep('U1b', !!pc && cornersIn(pc, R(484, 116, 499, 150)) && clear(M, closed), JSON.stringify(pc));
  const L = M.sparkLayers(1000);
  const lens = L.map((l) => l.len);
  keep('U4', JSON.stringify(lens) === JSON.stringify([60, 30, 12, 3]) && L.every((l, i) => i === 0 || l.opacity > L[i - 1].opacity) && L[0].width === 1 && L[0].color.toLowerCase() === '#00c2ff' && L[3].color.toLowerCase() === '#beebff' && L[3].width <= 2 && L.every((l) => l.offsetFrom === l.len && l.offsetTo === -1000),
    JSON.stringify(L));
  return r;
}

const real = await suite(await load(src), 'real');
for (const k of Object.keys(real).sort()) ok(real[k].pass, `${k} ${{ U0: 'the module exports its rules and the spark is 60 px, 550 ms', U1: 'the spark leaves the pressed button along the bar\'s lower edge to each side and runs ONE LAP around the menu (its four corners, longer than its perimeter\'s two long sides and two widths)', U1b: 'a closed menu: the lap is its opener tab', U2: 'gutters only: no point or segment is inside the page\'s rectangle (flush menu, overlapping menu, a page above the bar\'s lower edge)', U3: 'a side with no menu has no path (Wire In), the other side keeps its own', U4: 'four layers 60 / 30 / 12 / 3 px ending at one head, brighter toward it, 1 px tail, pale cyan head' }[k]}`, real[k].detail);

// the mutants are written against the module's own anchors (see the comments in fluxCurrentPath.ts: // CLAMP, // LAP-CLOSE, // BAR-EDGE, each on its own line before ONE statement)
const M1 = mutate('// CLAMP', '/* CLAMP */ if (false)');
const M2 = mutate('// LAP-CLOSE', '/* LAP-CLOSE */ if (false)');
const M3 = mutate('// BAR-EDGE', '/* BAR-EDGE */ if (false)');
for (const [name, code, red] of [['MUT1 the page clamp removed', M1, 'U2'], ['MUT2 the lap\'s closing edge removed', M2, 'U1'], ['MUT3 the bar edge not held above the page', M3, 'U2']]) {
  let m;
  try { m = await suite(await load(code), name); } catch (e) { ok(false, `${name}: the mutant did not build`, String(e && e.message)); continue; }
  ok(m[red] && m[red].pass === false, `${name}: ${red} goes RED (the rule can fail)`, m[red] && m[red].detail && m[red].detail.slice(0, 120));
}

console.log(fails ? `\nFLUX3-CURRENT-UNIT VERIFY: FAIL - ${fails}/${checks} failed` : `\nFLUX3-CURRENT-UNIT VERIFY: PASS (${checks} checks)`);
process.exit(fails ? 1 : 0);
