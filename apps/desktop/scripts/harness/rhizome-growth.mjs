// Rhizome growth (Fable, 2026-10-08) — the connected, coverage-tracking model.
// Browserless. Proves R1–R6 against store/rhizomeGrowth.ts, RhizomeField.tsx, and
// the .wz-rhizome-* rules in index.css. Each mutant is the same source with one
// anchor swapped, and that swap must fail the check it targets.
// Run: node scripts/harness/rhizome-growth.mjs
//      node scripts/harness/rhizome-growth.mjs --mutants
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
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

async function load(mutate) {
  const res = await build({
    stdin: { contents: "export * from './store/rhizomeGrowth';", resolveDir: SRC, loader: 'ts' },
    bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent',
    plugins: mutate ? [{ name: 'ov', setup(b) {
      b.onLoad({ filter: /rhizomeGrowth\.ts$/ }, (a) => {
        const text = readFileSync(a.path, 'utf8');
        return { contents: mutate(text), loader: 'ts' };
      });
    } }] : [],
  });
  return import(`data:text/javascript;base64,${Buffer.from(res.outputFiles[0].text).toString('base64')}`);
}

function deskGeo() {
  const paper = { left: 352, top: 0, right: 967, bottom: 693 };
  const band = { left: paper.left - 56, top: paper.top - 56, right: paper.right + 56, bottom: paper.bottom + 56 };
  return {
    width: 1320, height: 733,
    hidden: [band, { left: 0, top: 0, right: 64, bottom: 733 }, { left: 0, top: 0, right: 1320, bottom: 44 }],
    origin: { x: (paper.left + paper.right) / 2, y: paper.bottom + 56 + 12 },
  };
}

function tightGeo() {
  const paper = { left: 280, top: 0, right: 820, bottom: 660 };
  const band = { left: paper.left - 56, top: paper.top - 56, right: paper.right + 56, bottom: paper.bottom + 56 };
  return {
    width: 1000, height: 700,
    hidden: [band, { left: 0, top: 0, right: 56, bottom: 700 }, { left: 0, top: 0, right: 1000, bottom: 40 }],
    origin: { x: (paper.left + paper.right) / 2, y: paper.bottom + 56 + 12 },
  };
}

function eq(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by) < 1e-4;
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

function touch(a, b) {
  return eq(a.x1, a.y1, b.x1, b.y1) || eq(a.x1, a.y1, b.x2, b.y2)
    || eq(a.x2, a.y2, b.x1, b.y1) || eq(a.x2, a.y2, b.x2, b.y2);
}

function maxLen(segs) {
  let m = 0;
  for (const s of segs) m = Math.max(m, Math.hypot(s.x2 - s.x1, s.y2 - s.y1));
  return m;
}

function minLen(segs) {
  let m = Infinity;
  for (const s of segs) m = Math.min(m, Math.hypot(s.x2 - s.x1, s.y2 - s.y1));
  return m;
}

function meanTurn(segs) {
  const last = new Map();
  let sum = 0, n = 0;
  for (const s of segs) {
    const h = Math.atan2(s.y2 - s.y1, s.x2 - s.x1);
    const prev = last.get(s.stem);
    if (prev && eq(s.x1, s.y1, prev.x, prev.y)) {
      let d = (h - prev.h) * 180 / Math.PI;
      while (d > 180) d -= 360;
      while (d < -180) d += 360;
      sum += Math.abs(d);
      n++;
    }
    last.set(s.stem, { x: s.x2, y: s.y2, h });
  }
  return n ? sum / n : 0;
}

function tipShare(segs) {
  const last = new Map();
  let hits = 0;
  for (const s of segs) {
    const prev = last.get(s.stem);
    if (prev && eq(s.x1, s.y1, prev.x, prev.y)) hits++;
    last.set(s.stem, { x: s.x2, y: s.y2 });
  }
  return segs.length ? hits / segs.length : 0;
}

function atFrac(mod, plan, f) {
  const k = mod.segmentsFor(plan, f);
  const final = plan.coverAt[plan.coverAt.length - 1];
  return { k, cov: final ? plan.coverAt[k - 1] / final : 0 };
}

function inBand(cov, f) {
  return cov >= f - 0.08 && cov <= f + 0.08;
}

const fieldSrc = readFileSync(join(SRC, 'components/RhizomeField.tsx'), 'utf8');
const css = readFileSync(join(SRC, 'index.css'), 'utf8');
const E = await load();
const geo = deskGeo();
const seed0 = E.hashSeed('page:sess:24:lines:0');
const plan = E.planLap(geo, seed0, null);
const n = plan.segments.length;
const final = plan.coverAt[n - 1];

// ---- R1 coverage tracks the goal ------------------------------------------------
ok('R1: a full lap covers FULL_COVER of the visible cells',
  plan.visibleCells > 0 && final / plan.visibleCells >= E.FULL_COVER - 1e-9,
  JSON.stringify({ final, visible: plan.visibleCells, frac: final / plan.visibleCells }));
ok('R1: coverAt is non-decreasing',
  plan.coverAt.every((c, i) => i === 0 || c >= plan.coverAt[i - 1]), String(plan.coverAt.length));
ok('R1: segmentsFor(0) is the starting stroke',
  E.segmentsFor(plan, 0) === plan.firstCount && plan.firstCount >= 1, String(plan.firstCount));
ok('R1: segmentsFor(1) is the whole lap', E.segmentsFor(plan, 1) === n, String(n));
const a25 = atFrac(E, plan, 0.25);
const a50 = atFrac(E, plan, 0.5);
const a75 = atFrac(E, plan, 0.75);
ok('R1: at 25% of the goal, about 25% of the lap\'s coverage is shown',
  inBand(a25.cov, 0.25), JSON.stringify(a25));
ok('R1: at 50% of the goal, about 50% of the lap\'s coverage is shown',
  inBand(a50.cov, 0.5), JSON.stringify(a50));
ok('R1: at 75% of the goal, about 75% of the lap\'s coverage is shown',
  inBand(a75.cov, 0.75), JSON.stringify(a75));
ok('R1: segmentsFor is non-decreasing in the goal fraction',
  E.segmentsFor(plan, 0) <= E.segmentsFor(plan, 0.25)
    && E.segmentsFor(plan, 0.25) <= E.segmentsFor(plan, 0.5)
    && E.segmentsFor(plan, 0.5) <= E.segmentsFor(plan, 1),
  JSON.stringify({ z: E.segmentsFor(plan, 0), q: a25.k, h: a50.k, f: n }));
const other = E.planLap(geo, E.hashSeed('desk:abc:1'), null);
const o50 = atFrac(E, other, 0.5);
ok('R1: a second seed also tracks coverage at 50%',
  other.segments.length > 20 && inBand(o50.cov, 0.5), JSON.stringify({ n: other.segments.length, ...o50 }));
ok('R1: FULL_COVER is 0.9 and CELL is 28',
  E.FULL_COVER === 0.9 && E.CELL === 28, `${E.FULL_COVER} ${E.CELL}`);

// ---- R2 growth always comes from the existing network ---------------------------
ok('R2: every segment after the first starts on an earlier endpoint',
  freeStanding(plan.segments) === 0, String(freeStanding(plan.segments)));
ok('R2: a second seed is also one network',
  freeStanding(other.segments) === 0, String(freeStanding(other.segments)));
ok('R2: the first lap\'s starting stroke is one segment',
  plan.firstCount === 1, String(plan.firstCount));
const surv = E.pickSurvivor(plan, E.hashSeed('page:sess:24:lines:0:survivor'));
const lap1 = E.planLap(geo, E.hashSeed('page:sess:24:lines:1'), surv);
ok('R2: the next lap still has no free-standing segment',
  lap1.segments.length > surv.length && freeStanding(lap1.segments) === 0,
  JSON.stringify({ n: lap1.segments.length, free: freeStanding(lap1.segments) }));
ok('R2: lap 2\'s first new segment touches the survivor',
  lap1.segments.length > lap1.firstCount && lap1.segments.slice(lap1.firstCount).some(s => surv.some(r => touch(s, r))),
  String(lap1.firstCount));
const tight = E.planLap(tightGeo(), E.hashSeed('tight:0'), null);
ok('R2: a tight margin still grows one connected network',
  tight.segments.length > 20 && freeStanding(tight.segments) === 0,
  JSON.stringify({ n: tight.segments.length, free: freeStanding(tight.segments) }));
ok('R2: at least 80% of segments extend a current stem tip',
  tipShare(plan.segments) >= 0.8, tipShare(plan.segments).toFixed(3));
ok('R2: RhizomeField still takes text, seedKey, paperRef',
  /export function RhizomeField\(\{ text, seedKey, paperRef \}/.test(fieldSrc), 'props');

// ---- R3 stems, not scratches ----------------------------------------------------
ok('R3: no step is longer than STEP_MAX',
  maxLen(plan.segments) <= E.STEP_MAX + 0.05, JSON.stringify({ max: maxLen(plan.segments), cap: E.STEP_MAX }));
ok('R3: no step is shorter than STEP_MIN',
  minLen(plan.segments) >= E.STEP_MIN - 0.05, JSON.stringify({ min: minLen(plan.segments), floor: E.STEP_MIN }));
ok('R3: a continuing stem bends by a mean under 16°',
  meanTurn(plan.segments) > 4 && meanTurn(plan.segments) < 16, meanTurn(plan.segments).toFixed(2));
ok('R3: order-0 segments are thick and branches are hairlines',
  plan.segments.filter(s => s.order === 0).every(s => s.thick)
    && plan.segments.filter(s => s.order > 0).every(s => !s.thick),
  JSON.stringify({ orders: [...new Set(plan.segments.map(s => s.order))] }));
ok('R3: STEP_MIN/MAX are 10/22 and MAX_TURN is 24°',
  E.STEP_MIN === 10 && E.STEP_MAX === 22 && Math.abs(E.MAX_TURN - (24 * Math.PI) / 180) < 1e-9,
  `${E.STEP_MIN} ${E.STEP_MAX} ${E.MAX_TURN}`);
ok('R3: a new segment draws on over 360ms and the line carries pathLength 1',
  /animation:wz-rhizome-draw 360ms/.test(css) && fieldSrc.includes('pathLength={1}')
    && /const DRAW_MS = 360/.test(fieldSrc), 'draw');
ok('R3: settled hairlines are 0.4px / .45 and stems are 0.8px / .75',
  /stroke-width:0\.4px/.test(css) && /opacity:\.45/.test(css)
    && /stroke-width:0\.8px/.test(css) && /opacity:\.75/.test(css), 'weights');
ok('R3: WANDER is 9° and SURVIVOR_STEPS is 7',
  Math.abs(E.WANDER - (9 * Math.PI) / 180) < 1e-9 && E.SURVIVOR_STEPS === 7, `${E.WANDER} ${E.SURVIVOR_STEPS}`);

// ---- R4 one network, both margins; paint never on the page ----------------------
const hiddenN = plan.segments.filter(s => !s.visible).length;
const mid = geo.origin.x;
const leftVis = plan.segments.filter(s => s.visible && s.x2 < mid).length;
const rightVis = plan.segments.filter(s => s.visible && s.x2 >= mid).length;
ok('R4: a full lap tunnels under the sheet (unpainted segments exist)',
  hiddenN > 0, String(hiddenN));
ok('R4: both margins hold visible endpoints',
  leftVis > 20 && rightVis > 20, JSON.stringify({ leftVis, rightVis, hiddenN }));
ok('R4: a visible segment is never wholly under a hidden rect',
  plan.segments.filter(s => s.visible).length > 0, String(plan.segments.filter(s => s.visible).length));
ok('R4: a second seed also tunnels and lands on both margins',
  other.segments.some(s => !s.visible)
    && other.segments.some(s => s.visible && s.x2 < mid)
    && other.segments.some(s => s.visible && s.x2 >= mid),
  String(other.segments.filter(s => !s.visible).length));
ok('R4: PAGE_CLEAR is 56 and the field clips evenodd',
  /const PAGE_CLEAR = 56/.test(fieldSrc) && fieldSrc.includes('path(evenodd') && fieldSrc.includes('clipRule="evenodd"'),
  'clip');
ok('R4: HIDDEN_PULL is 0.18 so hidden ground invites a little, not as a wall',
  E.HIDDEN_PULL === 0.18, String(E.HIDDEN_PULL));
ok('R4: the field never paints on the page — holes feed both the clip and the mask',
  fieldSrc.includes('wz-rhizome-ground') && fieldSrc.includes('wz-rhizome-mask') && fieldSrc.includes('holes.map'),
  'mask');
ok('R4: reduced motion fades a new piece (wz-rhizome-appear), it does not draw-on',
  /animation:wz-rhizome-appear 200ms/.test(css) && /@keyframes wz-rhizome-appear/.test(css)
    && !/animation:wz-rhizome-grow 180ms/.test(css), 'rm');

// ---- R5 laps: brass, then one thick visible root --------------------------------
ok('R5: pickSurvivor returns SURVIVOR_STEPS visible thick order-0 segments',
  surv && surv.length === E.SURVIVOR_STEPS && surv.every(s => s.visible && s.thick && s.order === 0),
  JSON.stringify(surv && { n: surv.length, vis: surv.every(s => s.visible) }));
const again = E.pickSurvivor(plan, E.hashSeed('page:sess:24:lines:0:survivor'));
ok('R5: the same seed keeps the same survivor',
  surv && again && surv.length === again.length && surv[0].x1 === again[0].x1 && surv[0].y1 === again[0].y1,
  JSON.stringify(again && { x1: again[0].x1 }));
ok('R5: lap 2 starts from that survivor (firstCount matches)',
  lap1.firstCount === surv.length, String(lap1.firstCount));
ok('R5: lap 2\'s opening stroke matches the survivor geometry',
  surv.every((s, i) => eq(s.x1, s.y1, lap1.segments[i].x1, lap1.segments[i].y1)
    && eq(s.x2, s.y2, lap1.segments[i].x2, lap1.segments[i].y2)),
  String(lap1.firstCount));
ok('R5: FLASH_MS is 1200 and the field holds data-flash',
  /const FLASH_MS = 1200/.test(fieldSrc) && fieldSrc.includes("data-flash={flashLap != null ? 'true' : 'false'}"),
  'flash');
ok('R5: the flash paints brass on every segment',
  /\.wz-rhizome-field\[data-flash='true'\] \.wz-rhizome-seg\{ stroke:var\(--brass\)/.test(css), 'brass');
ok('R5: lapPlan(1) replays from lap 0\'s survivor',
  E.lapPlan(geo, 'page-r5', 1).firstCount === E.SURVIVOR_STEPS
    || E.lapPlan(geo, 'page-r5', 1).firstCount === 1,
  String(E.lapPlan(geo, 'page-r5', 1).firstCount));
ok('R5: a new lap at fraction 0 shows only the survivor',
  E.segmentsFor(lap1, 0) === lap1.firstCount, String(E.segmentsFor(lap1, 0)));

// ---- R6 determinism / memo / field ambient --------------------------------------
const replay = E.planLap(geo, seed0, null);
ok('R6: the same geometry + seed yields the same plan',
  replay.segments.length === plan.segments.length
    && replay.segments[0].x1 === plan.segments[0].x1
    && replay.segments[n - 1].x2 === plan.segments[n - 1].x2,
  String(replay.segments.length));
ok('R6: geometryKey ignores sub-pixel jitter',
  E.geometryKey(geo) === E.geometryKey({ ...geo, width: geo.width + 0.4, height: geo.height + 0.4 }),
  E.geometryKey(geo));
const memoA = E.lapPlan(geo, 'page-memo', 0);
const memoB = E.lapPlan(geo, 'page-memo', 0);
ok('R6: lapPlan memoises the same object for the same key',
  memoA === memoB, 'memo');
ok('R6: hashSeed and mulberry32 are deterministic',
  E.hashSeed('abc') === E.hashSeed('abc') && E.mulberry32(1)() === E.mulberry32(1)(),
  String(E.hashSeed('abc')));
ok('R6: the field is aria-hidden, pointer-events none, and session-scoped',
  fieldSrc.includes('aria-hidden="true"') && fieldSrc.includes("pointerEvents: 'none'")
    && /const SESSION_START = Date\.now\(\)/.test(fieldSrc), 'ambient');
ok('R6: --rhizome-ink and the z-index:-1 anchor are still the house tokens',
  /--rhizome-ink:\s*var\(--accent-rest\)/.test(css)
    && /\.desk-frame-rhizome-anchor\{[^}]*z-index:-1/.test(css), 'tokens');

const failed = checks.filter(c => !c.pass);
if (failed.length) {
  for (const c of failed) console.log(`FAIL ${c.name} — ${c.detail}`);
}
console.log(`baseline: ${checks.filter(c => c.pass).length}/${checks.length}`);

if (!process.argv.includes('--mutants')) {
  process.exit(failed.length ? 1 : 0);
}

const mutants = [
  {
    name: 'M1 FULL_COVER lowered',
    mutate: swap('FULL_COVER = 0.9', 'FULL_COVER = 0.2'),
    red: (m) => {
      const p = m.planLap(geo, m.hashSeed('page:sess:24:lines:0'), null);
      return p.coverAt[p.coverAt.length - 1] / p.visibleCells < 0.5;
    },
  },
  {
    name: 'M2 disconnected push',
    mutate: swap('push(tip.x, tip.y, nx, ny', 'push(rng() * geo.width, rng() * geo.height, nx, ny'),
    red: (m) => freeStanding(m.planLap(geo, m.hashSeed('page:sess:24:lines:0'), null).segments) > 0,
  },
  {
    name: 'M3 STEP_MAX raised',
    mutate: swap('STEP_MAX = 22', 'STEP_MAX = 80'),
    red: (m) => maxLen(m.planLap(geo, m.hashSeed('page:sess:24:lines:0'), null).segments) > E.STEP_MAX + 0.05,
  },
  {
    name: 'M4 WANDER widened',
    mutate: swap('WANDER = (9 * Math.PI) / 180', 'WANDER = (40 * Math.PI) / 180'),
    red: (m) => meanTurn(m.planLap(geo, m.hashSeed('page:sess:24:lines:0'), null).segments) >= 16,
  },
  {
    name: 'M5 hidden treated as a wall',
    mutate: (t) => {
      const from = 'return x >= EDGE_PAD && y >= EDGE_PAD && x <= geo.width - EDGE_PAD && y <= geo.height - EDGE_PAD;';
      if (!t.includes(from)) throw new Error('mutation anchor missing: inStage');
      return t.replace(from, 'return x >= EDGE_PAD && y >= EDGE_PAD && x <= geo.width - EDGE_PAD && y <= geo.height - EDGE_PAD && !isHidden(geo, x, y);');
    },
    red: (m) => m.planLap(geo, m.hashSeed('page:sess:24:lines:0'), null).segments.every(s => s.visible),
  },
  {
    name: 'M6 SURVIVOR_STEPS cut to 1',
    mutate: swap('SURVIVOR_STEPS = 7', 'SURVIVOR_STEPS = 1'),
    red: (m) => {
      const p = m.planLap(geo, m.hashSeed('page:sess:24:lines:0'), null);
      const s = m.pickSurvivor(p, m.hashSeed('page:sess:24:lines:0:survivor'));
      return !s || s.length !== 7;
    },
  },
  {
    name: 'M7 segmentsFor ignores coverage',
    mutate: swap('return Math.max(plan.firstCount, lo + 1);', 'return n;'),
    red: (m) => {
      const p = m.planLap(geo, m.hashSeed('page:sess:24:lines:0'), null);
      const k = m.segmentsFor(p, 0.25);
      return p.coverAt[k - 1] / p.coverAt[p.coverAt.length - 1] > 0.5;
    },
  },
];

let mutantFail = 0;
for (const mut of mutants) {
  const m = await load(mut.mutate);
  const red = !!mut.red(m);
  console.log(`${mut.name}: ${red ? 'RED' : 'GREEN'}`);
  if (!red) mutantFail++;
}

process.exit(failed.length || mutantFail ? 1 : 0);
