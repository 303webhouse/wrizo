// Rhizome goal-fill, browserless half. Coverage, stem extension, the thick
// survivor, the draw-on, and the short curved step are proved against the
// real engine. Each mutant is the same source with one anchor swapped, and
// that swap must fail the check it targets.
// Run: node apps/desktop/scripts/harness/rhizome-goal-core.mjs
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const desktop = join(here, '..', '..');
const SRC = join(desktop, 'src');
const { build } = createRequire(createRequire(join(desktop, 'package.json')).resolve('vite'))('esbuild');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const swap = (from, to) => (t) => {
  if (!t.includes(from)) throw new Error(`mutation anchor missing: ${from}`);
  return t.replace(from, to);
};

async function load(overrides = {}) {
  const res = await build({
    stdin: { contents: "export * from './store/rhizomeEngine';", resolveDir: SRC, loader: 'ts' },
    bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent',
    plugins: [{ name: 'ov', setup(b) {
      b.onLoad({ filter: /\.ts$/ }, (a) => {
        const rel = relative(SRC, a.path).split('\\').join('/');
        const text = readFileSync(a.path, 'utf8');
        return { contents: overrides[rel] ? overrides[rel](text) : text, loader: 'ts' };
      });
    } }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(res.outputFiles[0].text).toString('base64')}`);
}

function deskGeo() {
  const paper = { left: 352, top: 0, right: 967, bottom: 693 };
  const band = { left: paper.left - 56, top: paper.top - 56, right: paper.right + 56, bottom: paper.bottom + 56 };
  return {
    width: 1320, height: 733, paper,
    obstacles: [band, { left: 0, top: 0, right: 64, bottom: 733 }, { left: 0, top: 0, right: 1320, bottom: 44 }],
  };
}

function tightGeo() {
  const paper = { left: 280, top: 0, right: 820, bottom: 660 };
  const band = { left: paper.left - 56, top: paper.top - 56, right: paper.right + 56, bottom: paper.bottom + 56 };
  return {
    width: 1000, height: 700, paper,
    obstacles: [band, { left: 0, top: 0, right: 56, bottom: 700 }, { left: 0, top: 0, right: 1000, bottom: 40 }],
  };
}

function fillFor(mod, geo) {
  const lens = mod.scaledFillLength(geo.width, geo.height);
  return {
    connected: true,
    shootCap: mod.FILL_SHOOTS,
    hardCap: mod.FILL_SEGMENTS,
    lenMin: lens.lenMin,
    lenMax: lens.lenMax,
  };
}

function grow(mod, geo, salt, target, start) {
  const rng = mod.mulberry32(mod.hashSeed(salt));
  const origins = mod.seedOrigins(rng, geo);
  return mod.growTo(start ?? mod.createRhizomeState(), rng, geo, origins, target, fillFor(mod, geo));
}

function eq(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by) < 1e-4;
}

function touch(a, b) {
  return eq(a.x1, a.y1, b.x1, b.y1) || eq(a.x1, a.y1, b.x2, b.y2)
    || eq(a.x2, a.y2, b.x1, b.y1) || eq(a.x2, a.y2, b.x2, b.y2);
}

function freeStanding(segs) {
  let n = 0;
  for (let i = 1; i < segs.length; i++) {
    const s = segs[i];
    let shared = false;
    for (let j = 0; j < i; j++) {
      const e = segs[j];
      if (eq(s.x1, s.y1, e.x1, e.y1) || eq(s.x1, s.y1, e.x2, e.y2)) { shared = true; break; }
    }
    if (!shared) n++;
  }
  return n;
}

function heading(s) {
  return (Math.atan2(s.y2 - s.y1, s.x2 - s.x1) * 180) / Math.PI;
}

function angDelta(a, b) {
  let d = a - b;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
}

// A segment starts at a current tip when it continues the previous segment
// of the same shoot. Forks and the first root do not.
function tipShare(segs) {
  const last = new Map();
  let hits = 0;
  for (const s of segs) {
    const prev = last.get(s.shootId);
    if (prev && eq(s.x1, s.y1, prev.x, prev.y)) hits++;
    last.set(s.shootId, { x: s.x2, y: s.y2, h: heading(s) });
  }
  return segs.length ? hits / segs.length : 0;
}

function meanTurn(segs) {
  const last = new Map();
  let sum = 0;
  let n = 0;
  for (const s of segs) {
    const h = heading(s);
    const prev = last.get(s.shootId);
    if (prev && eq(s.x1, s.y1, prev.x, prev.y)) {
      sum += Math.abs(angDelta(h, prev.h));
      n++;
    }
    last.set(s.shootId, { x: s.x2, y: s.y2, h });
  }
  return n ? sum / n : 0;
}

function maxLen(segs) {
  let m = 0;
  for (const s of segs) m = Math.max(m, Math.hypot(s.x2 - s.x1, s.y2 - s.y1));
  return m;
}

// At fraction f of the goal, about f of each margin is touched. The band is
// wide enough for the seeds this file grows, and tight enough that a network
// stuck on one side fails it.
function coverageBand(cov, frac) {
  if (frac <= 0.25) return cov.fraction >= 0.12 && cov.fraction <= 0.36 && cov.left >= 0.08 && cov.right >= 0.08;
  if (frac <= 0.5) return cov.fraction >= 0.25 && cov.fraction <= 0.65 && cov.left >= 0.15 && cov.right >= 0.15;
  return cov.fraction >= 0.7 && cov.fraction <= 1 && cov.left >= 0.6 && cov.right >= 0.6;
}

function margins(segs, geo) {
  const band = 56;
  const L = geo.paper.left - band;
  const R = geo.paper.right + band;
  let left = 0;
  let right = 0;
  let under = 0;
  for (const s of segs) {
    for (const [x, y] of [[s.x1, s.y1], [s.x2, s.y2]]) {
      if (x < L) left++;
      if (x > R) right++;
      if (x > geo.paper.left && x < geo.paper.right && y > geo.paper.top && y < geo.paper.bottom) under++;
    }
  }
  return { left, right, under };
}

function drawOn(cssText) {
  const anim = cssText.match(/animation:wz-rhizome-draw (\d+)ms/);
  const ms = anim ? Number(anim[1]) : 0;
  return /@keyframes wz-rhizome-draw\{/.test(cssText) && ms >= 250 && ms <= 400;
}

const E = await load();
const geo = deskGeo();
const cap = E.scaledFillLength(geo.width, geo.height).lenMax;
ok('Engine: fraction 1 is still the 800-segment fill', E.goalFillTarget(1) === 800 && E.goalFillTarget(0) === 0 && E.FILL_SEGMENTS === 800, String(E.goalFillTarget(1)));

const lap0 = grow(E, geo, 'page:sess:24:lines:0', 800);
ok('Engine: a full first lap reaches the 800 cap', lap0.segments.length === 800, String(lap0.segments.length));
ok('Engine: every segment after the first starts on an earlier endpoint', freeStanding(lap0.segments) === 0, String(freeStanding(lap0.segments)));
const span = margins(lap0.segments, geo);
ok('Engine: a full lap tunnels under the sheet and emerges on both margins', span.left > 0 && span.right > 0 && span.under > 0, JSON.stringify(span));

for (const [n, frac] of [[200, 0.25], [400, 0.5], [800, 1]]) {
  const cov = E.marginCoverage(lap0.segments.slice(0, n), geo);
  ok(`Engine: at ${Math.round(frac * 100)}% of the goal, about that fraction of both margins is touched`,
    coverageBand(cov, frac), JSON.stringify(cov));
}
const other = grow(E, geo, 'desk:abc:1', 800);
for (const [n, frac] of [[200, 0.25], [400, 0.5], [800, 1]]) {
  const cov = E.marginCoverage(other.segments.slice(0, n), geo);
  ok(`Engine: a second seed at ${Math.round(frac * 100)}% stays inside the same coverage band`,
    other.segments.length === 800 && coverageBand(cov, frac), JSON.stringify(cov));
}

const tips = tipShare(lap0.segments);
ok('Engine: at least 80% of segments extend a current tip', tips >= 0.8, tips.toFixed(3));
const turn = meanTurn(lap0.segments);
ok('Engine: continuing a stem bends by a mean of 15–25°', turn >= 15 && turn <= 25, turn.toFixed(2));
const longest = maxLen(lap0.segments);
ok('Engine: no segment is longer than the scaled 12–28px cap', longest <= cap + 0.05, JSON.stringify({ longest, cap }));

const surv = E.pickLapSurvivor(lap0.segments, 'page:sess:24:lines:0:survivor', geo);
const again = E.pickLapSurvivor(lap0.segments, 'page:sess:24:lines:0:survivor', geo);
ok('Engine: the same seed keeps the same survivor', surv && surv.x1 === again.x1 && surv.y1 === again.y1 && surv.x2 === again.x2 && surv.y2 === again.y2, JSON.stringify(surv && { x1: surv.x1, y1: surv.y1 }));
ok('Engine: the survivor sits in the margin the clip will show', surv && E.paintedShare(surv, geo) >= 0.5, String(surv && E.paintedShare(surv, geo)));
const thinSrc = { id: 3, shootId: 4, x1: 40, y1: 80, x2: 58, y2: 86 };
const start = E.stateFromSurvivor(thinSrc);
ok('Engine: the survivor is one thick stem even when the source segment was thin',
  start.segments.length === 1 && start.segments[0].thick === true && start.segments[0].x1 === thinSrc.x1 && !thinSrc.thick,
  JSON.stringify(start.segments[0]));
const held = grow(E, geo, 'page:sess:24:lines:1', 0, E.stateFromSurvivor(surv));
ok('Engine: a new lap at fraction 0 stays the one survivor', held.segments.length === 1 && held.segments[0].thick === true, String(held.segments.length));
const lap1 = grow(E, geo, 'page:sess:24:lines:1', 800, E.stateFromSurvivor(surv));
ok('Engine: the next lap still fills to 800, counting the survivor', lap1.segments.length === 800, String(lap1.segments.length));
ok('Engine: lap 2\'s first new segment touches the survivor', lap1.segments.length > 1 && touch(lap1.segments[1], lap1.segments[0]), String(lap1.segments.length));
ok('Engine: the survivor segment stays thick through the next lap', lap1.segments[0].thick === true, String(lap1.segments[0].thick));
ok('Engine: the next lap grows only from the survivor — no free-standing segment', freeStanding(lap1.segments) === 0, String(freeStanding(lap1.segments)));

const tight = tightGeo();
const tightLap = grow(E, tight, 'tight:0', 200);
ok('Engine: a tight margin still reaches its target without a new origin',
  tightLap.segments.length === 200 && freeStanding(tightLap.segments) === 0,
  JSON.stringify({ n: tightLap.segments.length, free: freeStanding(tightLap.segments) }));

const plain = { width: 2000, height: 1500, paper: { left: 800, top: 0, right: 1200, bottom: 1300 } };
const origins = E.seedOrigins(E.mulberry32(E.hashSeed('m3-still')), plain);
const roam = E.growTo(E.createRhizomeState(), E.mulberry32(E.hashSeed('m3-still:grow')), plain, origins, 180);
let rooted = 0;
for (const o of origins) {
  if (roam.segments.some(s => eq(s.x1, s.y1, o.x, o.y))) rooted++;
}
ok('Engine: growTo without connected still roots more than one origin', rooted >= 2 && origins.length === 7, JSON.stringify({ rooted, origins: origins.length, segs: roam.segments.length }));

const css = readFileSync(join(SRC, 'index.css'), 'utf8');
const fieldSrc = readFileSync(join(SRC, 'components/RhizomeField.tsx'), 'utf8');
ok('Engine: a new segment draws on over 250–400ms and the line carries pathLength 1',
  drawOn(css) && fieldSrc.includes('pathLength={1}'), String(drawOn(css)));
ok('Engine: reduced motion keeps the plain opacity fade',
  css.includes('animation:wz-rhizome-grow 180ms ease'), 'fade');

const brokenNet = await load({ 'store/rhizomeEngine.ts': swap('opts?.connected === true', 'opts?.connected === false') });
const plainGrow = (mod, salt, target) => {
  const rng = mod.mulberry32(mod.hashSeed(salt));
  const o = mod.seedOrigins(rng, plain);
  return mod.growTo(mod.createRhizomeState(), rng, plain, o, target, fillFor(mod, plain));
};
const mutantLap = plainGrow(brokenNet, 'mutant-connected', 200);
ok('Mutant: turning connected growth off leaves a free-standing segment (the check fails)', freeStanding(mutantLap.segments) > 0, JSON.stringify({ free: freeStanding(mutantLap.segments), n: mutantLap.segments.length }));

const walled = await load({ 'store/rhizomeEngine.ts': (t) => {
  if (!t.includes('const open = tunnelGeo(geo);')) throw new Error('mutation anchor missing: tunnelGeo');
  // The sheet is a wall again. place() also rejects a reflected heading, which
  // would stall the lap at zero segments and fail the band for the wrong reason.
  // This mutant keeps those bounces so the network can fill the near margin only.
  let n = t.replace('const open = tunnelGeo(geo);', 'const open = geo;');
  const guard = 'if (Math.abs(angDelta(actual, angle)) > 35) return null;';
  if (!n.includes(guard)) throw new Error('mutation anchor missing: heading guard');
  n = n.replace(guard, 'if (false && Math.abs(angDelta(actual, angle)) > 35) return null;');
  return n;
} });
const walledLap = grow(walled, geo, 'page:sess:24:lines:0', 400);
const walledCov = walled.marginCoverage(walledLap.segments, geo);
ok('Mutant: growth that cannot tunnel under the sheet misses a margin (the coverage band fails)',
  walledLap.segments.length >= 40 && !coverageBand(walledCov, 0.5),
  JSON.stringify({ n: walledLap.segments.length, ...walledCov }));

const forky = await load({ 'store/rhizomeEngine.ts': swap('STEM_FORK_CHANCE = 0.04', 'STEM_FORK_CHANCE = 0.55') });
const forkyLap = grow(forky, geo, 'page:sess:24:lines:0', 200);
const forkyTips = tipShare(forkyLap.segments);
ok('Mutant: forking most steps drops the share that extend a current tip below 80%',
  forkyLap.segments.length > 20 && forkyTips < 0.8, JSON.stringify({ tips: forkyTips, n: forkyLap.segments.length }));

const wide = await load({ 'store/rhizomeEngine.ts': (t) => {
  let n = t;
  for (const [from, to] of [['STEM_WANDER_MIN = 15', 'STEM_WANDER_MIN = 40'], ['STEM_WANDER_MAX = 25', 'STEM_WANDER_MAX = 55']]) {
    if (!n.includes(from)) throw new Error(`mutation anchor missing: ${from}`);
    n = n.replace(from, to);
  }
  return n;
} });
const wideLap = grow(wide, geo, 'page:sess:24:lines:0', 200);
const wideTurn = meanTurn(wideLap.segments);
ok('Mutant: a wider wander leaves the 15–25° band (the check fails)',
  wideTurn < 15 || wideTurn > 25, wideTurn.toFixed(2));

const long = await load({ 'store/rhizomeEngine.ts': swap('FILL_LEN_MAX = 28', 'FILL_LEN_MAX = 80') });
const longLap = grow(long, geo, 'page:sess:24:lines:0', 80);
ok('Mutant: raising the length cap lets a step exceed the real scaled maximum (the check fails)',
  maxLen(longLap.segments) > cap + 0.05, JSON.stringify({ longest: maxLen(longLap.segments), cap }));

const buried = { id: 0, shootId: 0, x1: 500, y1: 200, x2: 518, y2: 214 };
const shown = { id: 1, shootId: 1, x1: 100, y1: 200, x2: 120, y2: 214 };
let buriedSeed = '';
for (let i = 0; i < 30 && !buriedSeed; i++) {
  const seed = `vis:${i}`;
  const raw = E.pickLapSurvivor([buried, shown], seed);
  if (raw && raw.x1 === buried.x1) buriedSeed = seed;
}
const visiblePick = buriedSeed ? E.pickLapSurvivor([buried, shown], buriedSeed, geo) : null;
ok('Engine: a buried segment is not the one a lap keeps when a margin stem exists',
  !!buriedSeed && visiblePick && visiblePick.x1 === shown.x1 && E.paintedShare(shown, geo) >= 0.5 && E.paintedShare(buried, geo) < 0.5,
  JSON.stringify({ buriedSeed, pick: visiblePick && visiblePick.x1, shown: E.paintedShare(shown, geo), buried: E.paintedShare(buried, geo) }));

const blind = await load({ 'store/rhizomeEngine.ts': swap(
  'geo ? segments.filter(s => paintedShare(s, geo) >= 0.5) : segments',
  'segments',
) });
const blindPick = buriedSeed ? blind.pickLapSurvivor([buried, shown], buriedSeed, geo) : null;
ok('Mutant: picking from the whole lap can keep a stem the clip hides (the check fails)',
  blindPick && E.paintedShare(blindPick, geo) < 0.5, JSON.stringify(blindPick));

const brokenSurv = await load({ 'store/rhizomeEngine.ts': swap('thick: true, /* survivor-stem */', '/* survivor-stem */') });
const mutantOne = brokenSurv.stateFromSurvivor(thinSrc);
ok('Mutant: dropping the thick survivor leaves a hairline (the check fails)',
  mutantOne.segments.length === 1 && mutantOne.segments[0].thick !== true, JSON.stringify(mutantOne.segments[0]));

const stripped = css.replace('@keyframes wz-rhizome-draw{ from{ stroke-dashoffset:1; } to{ stroke-dashoffset:0; } }', '/* draw-on removed */');
ok('Mutant: removing the draw-on keyframes fails the draw-on check', !drawOn(stripped), String(drawOn(stripped)));

console.log(JSON.stringify(checks, null, 2));
const pass = checks.every(c => c.pass);
console.log(pass ? `\nRHIZOME-GOAL CORE: PASS (${checks.length} checks)` : `\nRHIZOME-GOAL CORE: FAIL — ${checks.filter(c => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
