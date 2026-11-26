// #133 (Nick, Nov 25: "on a small screen the page is too small"; Fable's order, orders-nov25.md POLISH) - BROWSERLESS checks of the page's size law
// (src/store/pageScale.ts). No browser, no box turn. The real-page twin is page-small-133.mjs.
//   The stage sizes are the ones the app draws (measured, Draft: the window less 80 x 167, and never wider than 1720).
//   S1  at 1366x768, 1536x864 and a 1600 window the page is 62% of the stage's width (today: 48%, 43%, 41%)
//   S2  at 1920x1080 it is bigger than today and still no more than 62% of the stage
//   S3  at 2560 and wider it is exactly today's size (today = the largest letter page the stage holds, never below 620 px)
//   S4  never smaller than today, at any window
//   S5  at 1600 and below the size comes from the width alone: the window's height changes nothing
//   S6  it eases: the page's share never rises as the window widens, and no 1px of width jumps the scale
//   S7  the Typewriter zoom is never smaller than today's zoom, nor than the normal page; from 2560 it is exactly today's
//   S8  one side panel at a time at 1600 and below, today's behaviour above (the width test the drawers read)
//   MUT1 the share at 0.43 (today's) - S1 must go red.   MUT2 today's floor dropped from the blend - S4 must go red.
//   MUT3 the old law (the window's width ignored) - S1 must go red.
// Run: node apps/desktop/scripts/harness/page-small-133-source.mjs  ->  "PAGE-SMALL-133-SOURCE VERIFY: PASS (n checks)" or FAIL.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.resolve(here, '..', '..');
const SCALE = path.join(DESKTOP, 'src', 'store', 'pageScale.ts');
const results = [];
const ok = (name, pass, detail = '') => { results.push({ name, pass: !!pass }); console.log(`${pass ? 'ok  ' : 'FAIL'} ${name}${detail ? ' :: ' + detail : ''}`); };

const require = createRequire(path.join(DESKTOP, 'package.json'));
const { transform } = createRequire(require.resolve('vite'))('esbuild');
let nonce = 0;
const load = async (src) => {
  const out = await transform(src, { loader: 'ts', format: 'esm' });
  nonce += 1;
  return import('data:text/javascript;base64,' + Buffer.from(`${out.code}\n//${nonce}`).toString('base64'));
};

const PAGE_W = 620;
const PAGE_H = (620 / 8.5) * 11;
const stageOf = (w, h) => ({ w: Math.min(w - 80, 1720), h: h - 167 });
// today's law, written out here so the check does not borrow the product's own arithmetic
const todayK = (sw, sh) => Math.max(1, Math.min((sh - 40) / PAGE_H, (sw - 640) / PAGE_W));
const todayZoom = (sw, k) => Math.max(1, Math.min(1.6, (sw - 96) / (PAGE_W * k)));

const judge = (M) => {
  const kAt = (w, h) => { const s = stageOf(w, h); return M.pageScaleFor(s.w, s.h, 0, w); };
  const share = (w, h) => (kAt(w, h) * PAGE_W) / stageOf(w, h).w;
  const out = {};
  const small = [[1366, 768], [1536, 864], [1600, 900]].map(([w, h]) => [w, h, share(w, h)]);
  out.s1 = small.every(([, , s]) => Math.abs(s - 0.62) < 0.005);
  out.s1d = small.map(([w, h, s]) => `${w}x${h} ${(s * 100).toFixed(1)}%`).join(', ');
  {
    const s = stageOf(1920, 1080);
    const k = kAt(1920, 1080);
    out.s2 = k > todayK(s.w, s.h) + 0.1 && share(1920, 1080) <= 0.62 + 1e-9;
    out.s2d = `k ${k.toFixed(3)} (today ${todayK(s.w, s.h).toFixed(3)}), ${(share(1920, 1080) * 100).toFixed(1)}%`;
  }
  const big = [[2560, 1440], [2560, 1080], [3840, 2160]];
  out.s3 = big.every(([w, h]) => { const s = stageOf(w, h); return Math.abs(kAt(w, h) - todayK(s.w, s.h)) < 1e-9; });
  const grid = [];
  for (let w = 1100; w <= 3840; w += 20) for (let h = 600; h <= 2160; h += 120) grid.push([w, h]);
  const smaller = grid.filter(([w, h]) => { const s = stageOf(w, h); return kAt(w, h) < todayK(s.w, s.h) - 1e-9; });
  out.s4 = smaller.length === 0;
  out.s4d = `${grid.length} windows, ${smaller.length} smaller`;
  out.s5 = [1100, 1366, 1536, 1600].every((w) => [600, 730, 864, 1200].every((h) => Math.abs(kAt(w, h) - kAt(w, 768)) < 1e-9));
  {
    // the share as the window widens, at a height where today's page is at its floor (the case the ruling is about)
    let rises = 0; let jump = 0; let prev = null;
    for (let w = 1366; w <= 3000; w += 1) {
      const k = kAt(w, 864);
      const sh = (k * PAGE_W) / stageOf(w, 864).w;
      if (prev) { if (sh > prev.sh + 1e-9) rises += 1; jump = Math.max(jump, Math.abs(k - prev.k)); }
      prev = { k, sh };
    }
    out.s6 = rises === 0 && jump < 0.01;
    out.s6d = `rises ${rises}, largest 1px step ${jump.toFixed(4)}`;
  }
  {
    const cases = [[1366, 768], [1536, 864], [1920, 1080], [2560, 1440], [3840, 2160]];
    const rows = cases.map(([w, h]) => {
      const s = stageOf(w, h);
      const k = kAt(w, h);
      const t = todayK(s.w, s.h);
      const painted = k * M.zoomFor(s.w, k, 0, t) * PAGE_W;
      const before = t * todayZoom(s.w, t) * PAGE_W;
      return { w, painted, before, normal: k * PAGE_W };
    });
    out.s7 = rows.every((r) => r.painted >= r.before - 0.5 && r.painted >= r.normal - 0.5 && r.painted <= Math.max(r.before, r.normal) + 0.5 && (r.w < 2560 || Math.abs(r.painted - r.before) < 0.5));
    out.s7d = rows.map((r) => `${r.w}: ${Math.round(r.painted)} (today ${Math.round(r.before)})`).join(', ');
  }
  out.s8 = typeof M.onePanelAt === 'function' && [1100, 1366, 1536, 1600].every((w) => M.onePanelAt(w) === true) && [1601, 1920, 2560].every((w) => M.onePanelAt(w) === false);
  return out;
};

const src = fs.readFileSync(SCALE, 'utf8').replace(/\r\n?/g, '\n');
const T = judge(await load(src));
ok('S1 62% of the stage at 1366, 1536x864 and 1600', T.s1, T.s1d);
ok('S2 1920: bigger than today, no more than 62%', T.s2, T.s2d);
ok('S3 2560 and wider: exactly today', T.s3);
ok('S4 never smaller than today', T.s4, T.s4d);
ok('S5 at 1600 and below the height changes nothing', T.s5);
ok('S6 the size eases between 1600 and 2560', T.s6, T.s6d);
ok('S7 the Typewriter zoom: never smaller than today or the normal page', T.s7, T.s7d);
ok('S8 one side panel at 1600 and below, not above', T.s8);

const mutant = async (name, from, to, key) => {
  const landed = src.includes(from);
  const M = landed ? judge(await load(src.replace(from, to))) : null;
  ok(`${name} (landed=${landed})`, landed && M[key] === false);
};
await mutant('MUT1 the share at 0.43 turns S1 red', 'SMALL_SHARE = 0.62', 'SMALL_SHARE = 0.43', 's1');
await mutant('MUT2 no floor at today turns S4 red', 'return Math.max(today, eased)', 'return eased', 's4');
await mutant('MUT3 the old law turns S1 red', 'return Math.max(today, eased)', 'return today', 's1');

// P (follow-on): the prose page is painted by a transform, so each place that turns a screen distance into a distance inside it reads the painted scale
// (store/paintScale.ts). The real-page twin is page-small-133-scroll.mjs.
for (const [file, line] of [
  ['store/caretInView.ts', 'delta / paintScaleOf(scroller)'],
  ['components/useWarmStart.ts', 'paintScaleOf(relativeTo)'],
  ['reorg/search/searchMarks.ts', 'paintScaleOf(scroller)'],
  ['reorg/BeforeExport.tsx', 'paintScaleOf(sc)'],
]) {
  const src = fs.readFileSync(path.join(DESKTOP, 'src', file), 'utf8');
  ok(`P ${file} converts screen distances by the page's painted scale`, src.includes(line));
}

const failed = results.filter((r) => !r.pass).length;
console.log(`PAGE-SMALL-133-SOURCE VERIFY: ${failed ? `FAIL (${failed} of ${results.length})` : `PASS (${results.length} checks)`}`);
process.exit(failed ? 1 : 0);
