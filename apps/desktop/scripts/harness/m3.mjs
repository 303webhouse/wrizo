// M3 — the Rhizome Roams (docs/wrizo-alpha/m3-rhizome-roams-brief.md). A
// committed CDP verification scenario. Fixtures (freshDesk/freshProsePage/
// freshRhizomePage/readSegments/geometryReport) adopted from m2.mjs verbatim
// (the "don't re-derive fixtures" law). Run: node scripts/harness/m3.mjs (from
// apps/desktop, dist-web freshly built).
//
// Proves M3's three device verdicts: S1 the warmed ink token (#7A6242); S2 the
// roam — SEVEN blue-noise origins spread across the whole ground, the paper-
// avoidance law (segmentTouchesRect) re-proven at FULL SCALE across a 40-seed
// stress sweep (zero paper violations the only acceptable number), growth
// reaching all four ruled margins at saturation; S3 essay-length saturation —
// coverage = CAP*(1-e^(-words/K)), K=834, 95% of CAP at ~2500 words, monotone,
// <= CAP for any input, stable thereafter. Plus: determinism per seed (the
// scatter AND the growth, against the real engine via __wrizoRhizomeEngine),
// z-order under the paper, reduced-motion, framed-only mounting with legacy
// (<1100) byte-identical, three widths, nothing orange at rest, and Q1 stays
// parked (the framed desk has NO progress row — no answering a parked question
// by the back door). The M2 park sweep (the checks M3's total-word driver
// supersedes) is parked IN m2.mjs, A4-style, with the successors here.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const FLOOR_W = 1100, LAPTOP_W = 1280, WIDE_W = 2200, LEGACY_W = 1000;

const freshDesk = async (app, width = 1400, height = 900, { skipDisclosure = true } = {}) => {
  await app.goto('/');
  await app.evalJs(
    "localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1');"
    + (skipDisclosure ? " localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '3');" : ''),
  );
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
};
const freshProsePage = async (app, width = 1400, height = 900, opts = {}) => {
  await freshDesk(app, width, height, opts);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book)' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, framed' });
  await sleep(400);
};
const freshRhizomePage = async (app, width = 1400, height = 900) => {
  await freshProsePage(app, width, height);
  const pageId = (await app.evalJs('location.hash')).replace(/^#\/page\//, '');
  await app.evalJs("localStorage.setItem('wrizo-writing-settings', JSON.stringify({ ...JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'), progress: 'words', progressStyle: 'rhizome', timer: true }))");
  await app.reload();
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(pageId)}`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'rhizome page reopened' });
  await sleep(300);
  return pageId;
};
// Seed an entry's TEXT to `words` words, then reopen — the component reads
// wordCount(text) as unitCount, so an essay-length page mounts a saturated
// ground (M3's total-word driver, the DoD). Seeded on the Desk (never while a
// flush-on-unmount page is mounted — the harness-seeding law).
const seedWordsAndReopen = async (app, pageId, words) => {
  await app.goto('/');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before word seed' });
  await app.evalJs(`(() => {
    const text = Array.from({length: ${words}}, (_, i) => 'word' + (i % 97)).join(' ');
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    const e = entries.find(x => x.id === ${JSON.stringify(pageId)});
    if (e) { e.text = text; localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries)); }
  })()`);
  await app.reload();
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(pageId)}`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'saturated page reopened' });
  await sleep(500);
};
const geometryReport = (app) => app.evalJs(`(() => {
  const svg = document.querySelector('.wz-rhizome-field');
  const paper = document.querySelector('.mode-page');
  if (!svg || !paper) return { error: 'missing', svg: !!svg, paper: !!paper };
  // Measure in the SVG's OWN frame — the exact frame RhizomeField.tsx computes
  // its geo (and the segment coords) in — so the paper-avoidance scan reads the
  // same coordinate space the engine avoided, not a differently-framed stage.
  const sr = svg.getBoundingClientRect();
  const pr0 = paper.getBoundingClientRect();
  const pr = { left: pr0.left - sr.left, top: pr0.top - sr.top, right: pr0.right - sr.left, bottom: pr0.bottom - sr.top };
  const EPS = 0.5;
  const lines = [...svg.querySelectorAll('.wz-rhizome-seg')];
  let paperHit = 0, maxPen = 0;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const el of lines) {
    for (const [x, y] of [[+el.getAttribute('x1'), +el.getAttribute('y1')], [+el.getAttribute('x2'), +el.getAttribute('y2')]]) {
      if (x > pr.left + EPS && x < pr.right - EPS && y > pr.top + EPS && y < pr.bottom - EPS) {
        paperHit++;
        const pen = Math.min(x - pr.left, pr.right - x, y - pr.top, pr.bottom - y);
        if (pen > maxPen) maxPen = pen;
      }
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
  }
  return { count: lines.length, paperHit, maxPen: Math.round(maxPen * 100) / 100, minX, maxX, minY, maxY, stageW: sr.width, stageH: sr.height,
    svgRect: { l: Math.round(sr.left*100)/100, t: Math.round(sr.top*100)/100, w: Math.round(sr.width*100)/100, h: Math.round(sr.height*100)/100 },
    paper: { l: Math.round(pr.left*100)/100, t: Math.round(pr.top*100)/100, r: Math.round(pr.right*100)/100, b: Math.round(pr.bottom*100)/100 } };
})()`);

await withHarness(async (app) => {
  await freshDesk(app, LAPTOP_W, 900);

  // ── S3 — the saturation curve (pure engine, exact) ────────────────────────
  {
    const s3 = await app.evalJs(`(() => {
      const E = window.__wrizoRhizomeEngine;
      if (!E || !E.saturationTarget) return { missing: true };
      const CAP = E.CAP_SEGMENTS, K = E.SAT_K;
      const c = (w) => E.saturationTarget(w);
      // monotone across a fine sweep
      let mono = true, prev = -1;
      for (let w = 0; w <= 6000; w += 50) { const v = c(w); if (v < prev) mono = false; prev = v; }
      return { CAP, K, c0: c(0), c2500: c(2500), c5000: c(5000), c1e6: c(1000000), mono, ORIGIN_COUNT: E.ORIGIN_COUNT };
    })()`);
    ok('S3: the engine exposes saturationTarget/SAT_K/ORIGIN_COUNT on the test seam', !s3.missing, JSON.stringify(s3));
    ok('S3: coverage(0) === 0 (an unwritten page grows nothing)', s3.c0 === 0, String(s3.c0));
    ok('S3: K === 834 (95% of CAP at ~2500 words, the ruled bounded delta)', s3.K === 834, String(s3.K));
    ok('S3: coverage(2500 words) >= 0.95 * CAP — visually full at an essay',
      s3.c2500 >= 0.95 * s3.CAP, JSON.stringify({ c2500: s3.c2500, floor: 0.95 * s3.CAP, CAP: s3.CAP }));
    ok('S3: coverage(5000) <= CAP and coverage(1e6) <= CAP — never past the hard cap',
      s3.c5000 <= s3.CAP && s3.c1e6 <= s3.CAP, JSON.stringify({ c5000: s3.c5000, c1e6: s3.c1e6, CAP: s3.CAP }));
    ok('S3: the curve is MONOTONE non-decreasing across 0..6000 words — more writing never removes ground',
      s3.mono, String(s3.mono));
    ok('S3: saturation is STABLE — coverage(5000) - coverage(2500) is a small tail (bounded, not unbounded growth past the essay)',
      s3.c5000 - s3.c2500 <= 0.05 * s3.CAP, JSON.stringify({ tail: s3.c5000 - s3.c2500 }));
  }

  // ── S2 — the roam: 7 origins, blue-noise spread, paper-avoiding + the
  //    40-seed full-scale paper-avoidance stress sweep (pure engine) ──────────
  {
    const s2 = await app.evalJs(`(() => {
      const E = window.__wrizoRhizomeEngine;
      const geo = { width: 1600, height: 1000, paper: { left: 600, top: 120, right: 1000, bottom: 860 } };
      const target = E.saturationTarget(2500);
      const inPaper = (x, y, r, eps) => (x > r.left + eps && x < r.right - eps && y > r.top + eps && y < r.bottom - eps);
      // determinism: same seed -> identical origins
      const oA = E.seedOrigins(E.mulberry32(E.hashSeed('seedX')), geo);
      const oB = E.seedOrigins(E.mulberry32(E.hashSeed('seedX')), geo);
      const originsDet = JSON.stringify(oA) === JSON.stringify(oB);
      const o = oA;
      const originOneIsPaperBottomCenter = Math.abs(o[0].x - (geo.paper.left + geo.paper.right) / 2) < 0.001 && Math.abs(o[0].y - geo.paper.bottom) < 0.001;
      const noneInPaper = o.every(p => !inPaper(p.x, p.y, geo.paper, 0));
      // spread: origins' own bounding box covers most of the ground
      const oxs = o.map(p => p.x), oys = o.map(p => p.y);
      const spreadX = (Math.max(...oxs) - Math.min(...oxs)) / geo.width;
      const spreadY = (Math.max(...oys) - Math.min(...oys)) / geo.height;
      // full-ground extent + zero paper violations, growTo saturation
      const rng = E.mulberry32(E.hashSeed('extent'));
      const grown = E.growTo(E.createRhizomeState(), rng, geo, E.seedOrigins(E.mulberry32(E.hashSeed('extent2')), geo), target);
      let gMinX=Infinity,gMaxX=-Infinity,gMinY=Infinity,gMaxY=-Infinity, hit=0;
      for (const s of grown.segments) for (const [x,y] of [[s.x1,s.y1],[s.x2,s.y2]]) {
        gMinX=Math.min(gMinX,x); gMaxX=Math.max(gMaxX,x); gMinY=Math.min(gMinY,y); gMaxY=Math.max(gMaxY,y);
        if (inPaper(x, y, geo.paper, 0.5)) hit++;
      }
      // THE 40-seed stress sweep at FULL SCALE, on a TIGHT ground (the paper
      // filling most of a narrow stage — the exact case that surfaced the
      // inside-origin risk live): zero paper violations, and no origin inside.
      const tight = { width: 1600, height: 1000, paper: { left: 180, top: 40, right: 1420, bottom: 960 } };
      let totalViolations = 0, seedsWithViolations = 0, minSegs = Infinity, originInPaper = 0;
      for (let i = 0; i < 40; i++) {
        const key = 'stress-' + i;
        const origins = E.seedOrigins(E.mulberry32(E.hashSeed(key)), tight);
        for (const p of origins) if (inPaper(p.x, p.y, tight.paper, 0)) originInPaper++;
        const st = E.growTo(E.createRhizomeState(), E.mulberry32(E.hashSeed(key + ':grow')), tight, origins, target);
        let v = 0;
        for (const s of st.segments) for (const [x,y] of [[s.x1,s.y1],[s.x2,s.y2]]) if (inPaper(x, y, tight.paper, 0.5)) v++;
        if (v > 0) seedsWithViolations++;
        totalViolations += v; minSegs = Math.min(minSegs, st.segments.length);
      }
      return {
        count: o.length, originsDet, originOneIsPaperBottomCenter, noneInPaper, spreadX, spreadY,
        target, grownSegs: grown.segments.length, shoots: grown.shoots.length, hit,
        extent: { l: gMinX / geo.width, r: gMaxX / geo.width, t: gMinY / geo.height, b: gMaxY / geo.height },
        totalViolations, seedsWithViolations, minSegs, originInPaper,
      };
    })()`);
    ok('S2: seedOrigins returns exactly SEVEN origins (the ruled count)', s2.count === 7, String(s2.count));
    ok('S2: origin ONE is the paper\'s bottom-center (continuity with every ground grown so far)', s2.originOneIsPaperBottomCenter, JSON.stringify(s2.originOneIsPaperBottomCenter));
    ok('S2: no origin sits inside the paper rect', s2.noneInPaper, String(s2.noneInPaper));
    ok('S2: the origins are SPREAD across the ground (blue noise) — their bounding box spans most of both axes',
      s2.spreadX > 0.5 && s2.spreadY > 0.4, JSON.stringify({ spreadX: s2.spreadX, spreadY: s2.spreadY }));
    ok('S2: the scatter is DETERMINISTIC — the same seed produces byte-identical origins (the same page scatters the same way)', s2.originsDet, String(s2.originsDet));
    ok('S2: growTo(saturation) roots multiple shoots and grows to the target segment count', s2.shoots >= 7 && s2.grownSegs === s2.target, JSON.stringify({ shoots: s2.shoots, grownSegs: s2.grownSegs, target: s2.target }));
    ok('S2: FULL-GROUND extent — at saturation the growth reaches near all four ruled margins (roams the whole ground, not a confined patch)',
      s2.extent.l < 0.15 && s2.extent.r > 0.85 && s2.extent.t < 0.2 && s2.extent.b > 0.85, JSON.stringify(s2.extent));
    ok('S2: the single-fixture grow made ZERO paper violations (the wall holds at full scale)', s2.hit === 0, String(s2.hit));
    ok('S2: THE 40-SEED STRESS SWEEP on a TIGHT ground — no origin lands in the paper AND zero paper violations across all 40 full-scale grounds (the only acceptable number is zero)',
      s2.totalViolations === 0 && s2.seedsWithViolations === 0 && s2.originInPaper === 0, JSON.stringify({ totalViolations: s2.totalViolations, seedsWithViolations: s2.seedsWithViolations, originInPaper: s2.originInPaper, minSegs: s2.minSegs }));
  }

  // ── Determinism (S4) — the whole M3 pipeline (scatter + growTo) per seed ───
  {
    const det = await app.evalJs(`(() => {
      const E = window.__wrizoRhizomeEngine;
      const geo = { width: 1600, height: 1000, paper: { left: 600, top: 120, right: 1000, bottom: 860 } };
      const t = E.saturationTarget(1200);
      const run = () => JSON.stringify(E.growTo(E.createRhizomeState(), E.mulberry32(E.hashSeed('detK:99')), geo, E.seedOrigins(E.mulberry32(E.hashSeed('detK')), geo), t).segments);
      return { same: run() === run() };
    })()`);
    ok('S4: determinism — the same seed reproduces byte-identical growth (scatter + curve, per M2\'s engine discipline)', det.same, String(det.same));
  }

  // ── S1 — the token warmed ─────────────────────────────────────────────────
  {
    const ink = await app.evalJs("getComputedStyle(document.documentElement).getPropertyValue('--rhizome-ink').trim().toLowerCase()");
    ok('S1: --rhizome-ink is warmed to #7a6242 (Nick\'s "too dark" verdict, the bounded delta)', ink === '#7a6242', ink);
  }

  // ── LIVE — framed mounting, saturated extent, z-order, nothing orange, Q1 ──
  {
    const pageId = await freshRhizomePage(app, LAPTOP_W, 900);
    ok('Live: the Rhizome field mounts on the framed desk stage', await app.evalJs("!!document.querySelector('.wz-rhizome-field')"));
    // Q1 stays parked — the framed desk still has NO progress row.
    ok('Q1 stays parked: the framed desk has NO progress row (this ticket answers no parked question by the back door)',
      await app.evalJs("!document.querySelector('.wz-progress-row, .progress-row, [data-progress-row]')"));
    // z-order under the paper.
    const z = await app.evalJs(`(() => {
      const anchor = document.querySelector('.desk-frame-rhizome-anchor');
      const paper = document.querySelector('.mode-page') || document.querySelector('.forward-only-editor');
      const az = anchor ? +getComputedStyle(anchor).zIndex || 0 : null;
      const pz = paper ? +getComputedStyle(paper).zIndex || 0 : null;
      return { az, pz, anchorBeforePaper: anchor && paper ? (anchor.compareDocumentPosition(paper) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0 : null };
    })()`);
    ok('Live: the field\'s anchor is ordered/stacked beneath the paper (z-order under paper)', z.anchorBeforePaper === true || (z.az !== null && z.pz !== null && z.az < z.pz), JSON.stringify(z));

    // Saturate the page (2500 words) -> a full ground on mount (the DoD).
    await seedWordsAndReopen(app, pageId, 2500);
    const g = await geometryReport(app);
    ok('Live: an essay-length page (2500 words) opens with a GROUND ALIVE — a substantial, near-saturated segment count (M3 supersedes M2 mount-empty)',
      !g.error && g.count >= 0.9 * 570, JSON.stringify({ count: g.count }));
    ok('Live: the saturated live ground makes ZERO paper violations', !g.error && g.paperHit === 0, JSON.stringify({ paperHit: g.paperHit }));
    ok('Live: the saturated live ground ROAMS — its rendered extent reaches near all four stage margins',
      !g.error && g.minX < 0.2 * g.stageW && g.maxX > 0.8 * g.stageW && g.minY < 0.25 * g.stageH && g.maxY > 0.8 * g.stageH,
      JSON.stringify({ minX: g.minX, maxX: g.maxX, minY: g.minY, maxY: g.maxY, stageW: g.stageW, stageH: g.stageH }));
    // Nothing orange at rest — the segment stroke resolves to the warm ink, never the ember.
    const strokeAtRest = await app.evalJs(`(() => {
      const el = document.querySelector('.wz-rhizome-seg'); if (!el) return null;
      const cs = getComputedStyle(el); const flash = document.querySelector('.wz-rhizome-field')?.dataset.flash;
      return { stroke: cs.stroke, flash };
    })()`);
    const inkRgb = await app.evalJs("(() => { const d = document.createElement('div'); d.style.color = getComputedStyle(document.documentElement).getPropertyValue('--rhizome-ink').trim(); document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; })()");
    ok('Live: NOTHING ORANGE AT REST — a segment\'s stroke resolves to the warm --rhizome-ink, not the ember, with no flash active',
      strokeAtRest && strokeAtRest.flash === 'false' && strokeAtRest.stroke === inkRgb, JSON.stringify({ strokeAtRest, inkRgb }));
    // Reduced-motion: segments animation:none (appear instantly, no strobe).
    // The env can't toggle the OS reduced-motion setting, so assert the CSS
    // RULE is present (the branch exists): a prefers-reduced-motion media block
    // sets .wz-rhizome-seg's animation to none. Scan the flattened inner cssText
    // so minification/spacing can't hide it.
    const rm = await app.evalJs(`(() => {
      let found = false, sample = '';
      for (const s of document.styleSheets) {
        let rules; try { rules = s.cssRules; } catch { continue; }
        for (const r of rules) {
          if (r.type !== 4) continue;
          const mt = (r.media && r.media.mediaText) || '';
          if (mt.indexOf('reduced-motion') < 0) continue;
          let t = '';
          for (const x of r.cssRules) t += x.cssText + ' ';
          if (t.indexOf('wz-rhizome-seg') < 0) continue;
          if (!sample) sample = t.slice(0, 140);
          // The reduced-motion rhizome block sets animation to none (the browser
          // normalizes 'animation: none' to a longhand whose name token is none),
          // so it suffices that this block names the seg AND nulls its animation.
          if (t.indexOf('animation') >= 0 && t.indexOf('none') >= 0) found = true;
        }
      }
      return { found, sample };
    })()`);
    ok('Reduced-motion: a prefers-reduced-motion rule sets .wz-rhizome-seg animation:none (segments appear instantly, no strobe) — scale-independent, holds at saturation',
      rm && rm.found, JSON.stringify(rm));
  }

  // ── Three widths: the field mounts + grows at 1100/1280/2200 (framed) ──────
  for (const width of [FLOOR_W, LAPTOP_W, WIDE_W]) {
    const pageId = await freshRhizomePage(app, width, 900);
    await seedWordsAndReopen(app, pageId, 1500);
    // Past the field's own ~600ms settle-tail re-fit (the chrome recede on a
    // fresh load settles the paper up over ~500ms; the field re-fits its ground
    // to the settled paper — RhizomeField.tsx), so this reads the STEADY state.
    await app.emulateDpr(1, width, 900); await sleep(700);
    const g = await geometryReport(app);
    ok(`Geometry @${width}px: the field mounts, grows a substantial ground, and makes zero paper violations`,
      !g.error && g.count > 50 && g.paperHit === 0, JSON.stringify({ count: g.count, paperHit: g.paperHit, maxPen: g.maxPen }));
  }

  // ── Successor to m2.mjs's parked determinism-live checks (remount-empty +
  //    replay-shape): under M3's total-word driver a written entry is a
  //    deterministic function of (seed, geo, total words), so an in-app REVISIT
  //    reproduces the SAME saturated ground — byte-identical, normalized to the
  //    first segment's start (the same absolute-offset caution m2.mjs documents).
  {
    const readSegs = () => app.evalJs("[...document.querySelectorAll('.wz-rhizome-seg')].map(el => ({ x1:+el.getAttribute('x1'), y1:+el.getAttribute('y1'), x2:+el.getAttribute('x2'), y2:+el.getAttribute('y2') }))");
    const norm = (segs) => segs.length === 0 ? segs : (() => { const ox = segs[0].x1, oy = segs[0].y1; return segs.map(s => ({ x1: s.x1 - ox, y1: s.y1 - oy, x2: s.x2 - ox, y2: s.y2 - oy })); })();
    const pageId = await freshRhizomePage(app, LAPTOP_W, 900);
    await seedWordsAndReopen(app, pageId, 1200);
    await sleep(800);
    const ground1 = await readSegs();
    await app.evalJs("location.hash = '#/desk'"); await sleep(300);
    await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(pageId)}`);
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'M3 determinism revisit' });
    await sleep(800);
    const ground2 = await readSegs();
    ok('Determinism (live, M3): revisiting a WRITTEN entry reproduces the SAME saturated ground, byte-identical (same seed+geo+total-words => same scatter) — successor to m2.mjs’s parked remount-empty/replay-shape checks',
      ground1.length > 50 && ground2.length === ground1.length && JSON.stringify(norm(ground1)) === JSON.stringify(norm(ground2)),
      JSON.stringify({ n1: ground1.length, n2: ground2.length }));
  }

  // ── Successor to m2.mjs's parked burst checks: crossing the goal LIVE lands
  //    up to +12 burst-flagged segments (inline animation-delay), growth kept
  //    whole. Seeds just BELOW the goal so the crossing happens on THIS fixture's
  //    own keystrokes (the boundary the M2 fixture no longer brackets). ─────────
  {
    const burstCount = () => app.evalJs("[...document.querySelectorAll('.wz-rhizome-seg')].filter(el => !!el.style.animationDelay).length");
    const segKeys = () => app.evalJs("[...document.querySelectorAll('.wz-rhizome-seg')].map(el => el.getAttribute('x1')+','+el.getAttribute('y1')+','+el.getAttribute('x2')+','+el.getAttribute('y2'))");
    const pageId = await freshRhizomePage(app, LAPTOP_W, 900);
    await seedWordsAndReopen(app, pageId, 244); // just below WORD_GOAL (250)
    await sleep(900); // past the settle-tail (burstOrder resets on a refit)
    const growthBefore = await segKeys();
    const burstBefore = await burstCount();
    ok('Burst (M3): a below-goal written page has grown a ground with NO burst-flagged segments before the crossing',
      growthBefore.length > 20 && burstBefore === 0, JSON.stringify({ segs: growthBefore.length, burst: burstBefore }));
    await app.evalJs("document.querySelector('.forward-only-editor').focus()");
    await app.typeKeys('aa bb cc dd ee ff gg '); // 7 words -> 251, crosses 250
    await app.waitFor("document.querySelector('.wz-rhizome-field')?.dataset.flash === 'true'", { label: 'M3 burst flash', timeout: 3000 });
    await sleep(1300); // past the stagger + flash window
    const growthAfter = await segKeys();
    const burstAfter = await burstCount();
    const keptWhole = JSON.stringify(growthAfter.slice(0, growthBefore.length)) === JSON.stringify(growthBefore);
    ok('Burst (M3): crossing the goal lands up to +12 burst-flagged segments, growth kept whole — successor to m2.mjs’s parked delta/addedCount burst checks',
      burstAfter >= 1 && burstAfter <= 12 && keptWhole, JSON.stringify({ burstBefore, burstAfter, before: growthBefore.length, after: growthAfter.length, keptWhole }));
  }

  // ── Legacy (<1100) byte-identical: framed-only mounting ────────────────────
  {
    await freshRhizomePage(app, LEGACY_W, 900);
    await app.emulateDpr(1, LEGACY_W, 900); await sleep(200);
    ok('Legacy (<1100px): the Rhizome field does NOT mount (framed-only) — legacy chrome unconditionally byte-identical',
      await app.evalJs("!document.querySelector('.wz-rhizome-field') && !document.querySelector('.desk-frame-stage')"));
  }

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log('\nM3 PARKED: PASS (0 checks) — HARNESS_PARKED=1 armed; m3.mjs parks nothing of its own (the M2 checks M3 supersedes are parked IN m2.mjs, with the live successors here).');
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nM3 VERIFY: PASS (${checks.length} checks)` : `\nM3 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
