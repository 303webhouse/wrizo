// Rhizome goal-fill, browserless half. Connectivity, the one survivor, and
// the keep-outs are proved against the real engine. Each mutant is the same
// source with one anchor swapped, and that swap must fail the check it targets.
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

const FILL = { connected: true, shootCap: 72, hardCap: 800, lenMin: 20, lenMax: 52 };

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

function grow(E, geo, salt, target, start) {
  const rng = E.mulberry32(E.hashSeed(salt));
  const origins = E.seedOrigins(rng, geo);
  return E.growTo(start ?? E.createRhizomeState(), rng, geo, origins, target, FILL);
}

function eq(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by) < 1e-6;
}

function touch(a, b) {
  return eq(a.x1, a.y1, b.x1, b.y1) || eq(a.x1, a.y1, b.x2, b.y2)
    || eq(a.x2, a.y2, b.x1, b.y1) || eq(a.x2, a.y2, b.x2, b.y2);
}

// Segments after the first whose start is not an endpoint already on the network.
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

function keepHits(segs, geo) {
  const walls = [geo.paper, ...(geo.obstacles ?? [])];
  const inside = (x, y, r) => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  let n = 0;
  for (const s of segs) {
    for (const [x, y] of [[s.x1, s.y1], [s.x2, s.y2]]) {
      if (walls.some(r => inside(x, y, r))) n++;
    }
  }
  return n;
}

const E = await load();
const geo = deskGeo();
ok('Engine: fraction 1 is still the 800-segment fill', E.goalFillTarget(1) === 800 && E.goalFillTarget(0) === 0 && E.FILL_SEGMENTS === 800, String(E.goalFillTarget(1)));

const lap0 = grow(E, geo, 'page:sess:24:lines:0', 800);
ok('Engine: a full first lap reaches the 800 cap on a desk with the sheet blocked out', lap0.segments.length === 800, String(lap0.segments.length));
ok('Engine: every segment after the first starts on an earlier endpoint', freeStanding(lap0.segments) === 0, String(freeStanding(lap0.segments)));
ok('Engine: no endpoint of the full lap sits in the sheet, the clear band, the rail, or the header', keepHits(lap0.segments, geo) === 0, String(keepHits(lap0.segments, geo)));

const surv = E.pickLapSurvivor(lap0.segments, 'page:sess:24:lines:0:survivor');
const again = E.pickLapSurvivor(lap0.segments, 'page:sess:24:lines:0:survivor');
ok('Engine: the same seed keeps the same survivor', surv && surv.x1 === again.x1 && surv.y1 === again.y1 && surv.x2 === again.x2 && surv.y2 === again.y2, JSON.stringify(surv && { x1: surv.x1, y1: surv.y1 }));
const start = E.stateFromSurvivor(surv);
ok('Engine: exactly one segment survives a lap', start.segments.length === 1 && start.segments[0].x1 === surv.x1 && start.segments[0].y2 === surv.y2, String(start.segments.length));
const held = grow(E, geo, 'page:sess:24:lines:1', 0, start);
ok('Engine: a new lap at fraction 0 stays the one survivor', held.segments.length === 1, String(held.segments.length));
const lap1 = grow(E, geo, 'page:sess:24:lines:1', 800, start);
ok('Engine: the next lap still fills to 800, counting the survivor', lap1.segments.length === 800, String(lap1.segments.length));
ok('Engine: lap 2\'s first new segment touches the survivor', lap1.segments.length > 1 && touch(lap1.segments[1], lap1.segments[0]), String(lap1.segments.length));
ok('Engine: the next lap grows only from the survivor — no free-standing segment', freeStanding(lap1.segments) === 0, String(freeStanding(lap1.segments)));
ok('Engine: the next lap\'s endpoints stay out of the keep-outs', keepHits(lap1.segments, geo) === 0, String(keepHits(lap1.segments, geo)));

const tight = tightGeo();
const tightLap = grow(E, tight, 'tight:0', 200);
ok('Engine: a tight margin still reaches its target without a new origin', tightLap.segments.length === 200 && freeStanding(tightLap.segments) === 0 && keepHits(tightLap.segments, tight) === 0,
  JSON.stringify({ n: tightLap.segments.length, free: freeStanding(tightLap.segments), keep: keepHits(tightLap.segments, tight) }));

const plain = { width: 2000, height: 1500, paper: { left: 800, top: 0, right: 1200, bottom: 1300 } };
const origins = E.seedOrigins(E.mulberry32(E.hashSeed('m3-still')), plain);
const roam = E.growTo(E.createRhizomeState(), E.mulberry32(E.hashSeed('m3-still:grow')), plain, origins, 180);
let rooted = 0;
for (const o of origins) {
  if (roam.segments.some(s => eq(s.x1, s.y1, o.x, o.y))) rooted++;
}
ok('Engine: growTo without connected still roots more than one origin', rooted >= 2 && origins.length === 7, JSON.stringify({ rooted, origins: origins.length, segs: roam.segments.length }));

const brokenNet = await load({ 'store/rhizomeEngine.ts': swap('opts?.connected === true', 'opts?.connected === false') });
const plainGrow = (mod, salt, target) => {
  const rng = mod.mulberry32(mod.hashSeed(salt));
  const o = mod.seedOrigins(rng, plain);
  return mod.growTo(mod.createRhizomeState(), rng, plain, o, target, FILL);
};
const mutantLap = plainGrow(brokenNet, 'mutant-connected', 200);
ok('Mutant: turning connected growth off leaves a free-standing segment (the check fails)', freeStanding(mutantLap.segments) > 0, JSON.stringify({ free: freeStanding(mutantLap.segments), n: mutantLap.segments.length }));

const brokenKeep = await load({ 'store/rhizomeEngine.ts': swap('return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;', 'return false;') });
const mutantKeep = grow(brokenKeep, geo, 'page:sess:24:lines:0', 40);
ok('Mutant: a keep-out test that never hits lets endpoints land inside (the check fails)', keepHits(mutantKeep.segments, geo) > 0, String(keepHits(mutantKeep.segments, geo)));

const brokenSurv = await load({ 'store/rhizomeEngine.ts': swap('segments: [kept],', 'segments: [],') });
const mutantOne = brokenSurv.stateFromSurvivor(surv);
ok('Mutant: dropping the kept segment leaves none (the check fails)', mutantOne.segments.length !== 1, String(mutantOne.segments.length));

console.log(JSON.stringify(checks, null, 2));
const pass = checks.every(c => c.pass);
console.log(pass ? `\nRHIZOME-GOAL CORE: PASS (${checks.length} checks)` : `\nRHIZOME-GOAL CORE: FAIL — ${checks.filter(c => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
