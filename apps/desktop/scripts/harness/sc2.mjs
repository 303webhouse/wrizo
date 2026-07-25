// SC2 — the Clock (docs/wrizo-alpha/sc2-the-clock-brief.md, as amended by
// sc2-brief-amendment-1.md and sc2-brief-amendment-2.md).
//
// Run: node scripts/harness/sc2.mjs   (from apps/desktop, dist-web freshly
// built via `pnpm run build:web`).
//
// THIS COMMIT IS THE BASELINE FIXTURE ONLY — Amendment 2's requirement 1: the
// 20-page baseline lands here as a first-class fixture in the ticket's FIRST
// commit, BEFORE the pagination work, and survives as a permanent part of the
// check. Nothing about pagination is asserted yet; S1-S6 land on top of this.
//
// WHY A FIXTURE AND NOT A NUMBER. Amendment 1 set SC2's latency gate as a
// REGRESSION BOUND — SC2's p95 at 20 pages must not exceed 2x the pre-SC2
// baseline p95 — because an absolute millisecond threshold is a false gate on a
// harness that runs on varied hardware. A bound like that is only honest if the
// baseline is re-measurable at any time on any machine; a number measured once
// in a discarded scratchpad scenario cannot anchor it. So the scenario lives
// here.
//
// HOW THE BOUND IS EVALUATED (Fable's ruling, 2026-07-25). The gate is NOT
// "2x of 4.0ms" — that figure is the witness of one run on one machine, not a
// law. Because this fixture lands BEFORE any pagination work, the pre-SC2
// baseline is never lost when SC2 ships: product code and measuring harness are
// frozen together at one SHA. So the judging procedure is:
//
//   1. check out THE BASELINE SHA on whatever machine is judging, and measure;
//   2. measure the tip in the SAME session, INTERLEAVED with (1) rather than
//      run back to back, so thermal drift and GC do not land on one side;
//   3. the tip's 20-page p95 must be <= 2x THAT MACHINE'S re-derived baseline.
//
// Portable forever, via the SHA rather than the number. The SCALING RATIO
// (20-page p95 / 5-page p95) rides as a SECONDARY gate that needs no checkout —
// tip ratio <= 2x the baseline ratio recorded below. Both hold, both recorded,
// every run: they catch different failures. The absolute catches "typing got
// slower generally"; the ratio catches "cost now scales with document length".
// A change can regress either without touching the other.
//
// WHY THE CONTROL IS FIVE PAGES AND NOT ONE — a measured finding, not a
// preference. The control was a 1-page document until three runs at n=240
// showed the ratio was the LEAST stable figure in the file, not the most:
//
//     control     20pp p95              control p95           ratio
//     1 page      4.0 / 5.5 / 5.2       1.7 / 0.7 / 0.9       2.35 / 7.86 / 5.78
//     5 pages     3.5 / 4.0 / 5.4 / 4.2 1.9 / 2.0 / 2.4 / 1.6 1.84 / 2.00 / 2.25 / 2.63
//
// A 1-page document's per-keystroke cost is SUB-MILLISECOND, which puts the
// ratio's denominator on the timer's own noise floor; dividing by a noisy small
// number amplifies the noise into the quotient. A tip measuring 7.86 against a
// 2.35 baseline would have failed the "<= 2x" secondary gate on noise alone,
// with no regression whatsoever — a gate that cries wolf gets switched off, and
// then it is not a gate.
//
// Five pages puts the denominator near 2ms, clear of the floor. Raising n from
// 49 to 240 was necessary and did tighten the absolute; it could not fix the
// ratio, because the ratio's problem was never the sample size — it was the
// denominator. Median-of-three then collapses the WITHIN-session spread to
// about 1.4-1.5x on each side (measured: 20-page [4.4, 5.4, 3.6], control
// [1.7, 1.2, 1.3]).
//
// THE RESIDUAL PROBLEM, MEASURED AND NOT YET SOLVED — the ratio does NOT
// survive BETWEEN sessions, so its "no checkout needed" property is unsafe.
// Every 5-page-control ratio observed so far: 1.84, 2.00, 2.25, 2.63, 3.38 —
// a 1.84x spread ACROSS sessions, LARGER than the ~1.45x spread within one.
// The control's own p95 read 1.9-2.4ms one session and 1.2-1.7ms the next; the
// machine's thermal and load state moves the small denominator more than it
// moves the large numerator, and the quotient inherits the difference. A tip
// whose ratio is compared against a ratio RECORDED ON ANOTHER DAY can therefore
// fail a 2x gate on drift alone — the same cry-wolf failure the 1-page control
// had, one level up.
//
// So the secondary gate is subject to the SAME same-session discipline as the
// absolute: re-derive the baseline ratio from the baseline SHA in the session
// that judges the tip, interleaved. It loses the "no checkout" convenience and
// keeps its discriminating power, which is the right trade — a cheap gate that
// misfires is worth less than an expensive one that does not. The recorded
// ratio below is a REFERENCE OBSERVATION for orientation, NOT a value to gate
// against across sessions. The re-run rule stands beneath both gates: a tip
// landing between 1x and 2x of baseline is inside the noise and must be re-run
// rather than read. Flagged to Fable rather than decided here — this narrows a
// ruling, and narrowing one is not the builder's call.
//
// (Stated this precisely because an earlier draft of this comment claimed
// "+/-10%" on three runs and the fourth broke it. This file's whole subject is
// not believing a number too easily; that has to include its own.)
//
// THE BASELINE SHA IS THIS COMMIT, NOT 57bc9f9. The first cut of this fixture
// (57bc9f9) sampled only 49 keystrokes. At n=49 a p95 is essentially the
// second-worst keystroke, so one GC pause moves it — which explains the
// 4.0ms-vs-5.0ms spread between two runs on the SAME machine far better than
// machine identity does. The sample is raised to 240 below. A SHA-pinned
// comparison is only meaningful if BOTH sides run the identical instrument, so
// re-issuing the fixture at the larger sample necessarily moves the frozen
// reference to this commit. 57bc9f9 stands in history, unrewritten, as the
// first cut; it is simply not the reference. This is exactly why the
// re-issue happens now, still before any pagination work, rather than at DoD.
//
// AMENDMENT 1'S CORRECTNESS GATE TRAVELS WITH IT. Every timing figure below is
// gated on the measured work having ACTUALLY OCCURRED — focus asserted held,
// keystrokes asserted landed, the document asserted changed — before any number
// is believed. This is not ceremony: during SC2's pre-build measurement an
// earlier run produced entirely plausible latencies while the keystrokes were
// landing on <body> and nothing was happening. Numbers that look right while
// nothing happened are the measurement form of "presence is not composition".
// (Recorded as a LANE PRACTICE — Nick declined its elevation to the house laws
// on 2026-07-25; it binds this file regardless, by Amendment 2.)
//
// INSTRUMENT THE RIGHT EVENT. The script surface is a CONTENTEDITABLE. A plain
// character `keydown` runs no React work at all — the browser inserts the glyph
// natively and the state update rides the subsequent `input` event
// (ScriptEditor's onInput -> handleInput -> setElements). Measuring keydown
// produced a FLAT 0.1ms curve across a 35x document-size sweep: an artifact, not
// a finding. React 18 treats `input` as discrete and flushes it synchronously
// inside the dispatch, so a capture-phase listener (before React's root
// listener) to a bubble-phase listener (after it) brackets
// handler + reconcile + DOM commit. Layout and paint fall outside that bracket,
// which is what makes the figure attributable to React rather than to a tall
// sheet. Both events are recorded so the difference stays visible.
//
// THE PREMISE THE BRIEF STARTED FROM WAS WRONG, and this file is where the
// correction lives (Amendment 1): `groupIntoScenes` does NOT run per keystroke.
// AUTOSAVE_MS = 2000 and it runs inside the DEBOUNCED autosave effect, plus
// flush/visibility-change and the publish/copy paths. The real per-keystroke
// cost is React reconciling every StaticScriptElement — no React.memo, a fresh
// onActivate closure and a fresh elementStyle() object per render.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const LAPTOP_W = 1280;

// SC1's derivation, which SC2 inherits and must not restate as a second table:
// at 12pt, 1em = 16px = 1/6in, so 1in = 6em. The sheet is 51em x 66em.
//
// 54, DERIVED — NEVER TYPED AS A CONSTANT (Fable, 2026-07-25). The trade's
// "~55 lines" is a rule of thumb whose variance comes from bottom margins that
// differ in practice. The geometry is exact: eleven inches less two one-inch
// margins is a NINE-INCH text block, and at 12pt Courier single-spaced the line
// box is exactly 12pt = 1em = 1/6in, so 54 falls out as a CONSEQUENCE. Assert
// the geometry, not the count — a derived 54 cannot be typo'd, and a constant
// can. The page number is CHROME: it sits in the top margin, outside the body,
// and the line ledger counts the 54-line block only.
const EM = 16;
const PAGE_H_EM = 66;
const MARGIN_EM = 6;                                        // 1in, top and bottom
const BODY_EM = PAGE_H_EM - MARGIN_EM - MARGIN_EM;          // 54em = 9in of text block
const LINE_BOX_EM = 1;                                      // 12pt at 12pt type = 6 lpi
const BODY_LINES_PER_PAGE = BODY_EM / LINE_BOX_EM;          // 54, derived

// THE FIXTURES ARE PINNED BY ELEMENT COUNT, NOT PAGE COUNT (Fable, 2026-07-25).
// A controlled experiment holds its INPUT constant, and page count is an OUTPUT
// of the code under test: S1 gave the page vertical rhythm and the same 928
// elements went from 20 pages to 30. Pinning to pages would have made the
// baseline checkout measure a 928-element document while the tip measured a
// ~600-element one, and the gate would have reported a ~35% improvement caused
// entirely by handing the tip less work (per-keystroke cost is linear in
// element count, ~2.8us each). Element count is the only pinning that keeps both
// sides running the same document.
//
// The control is pinned the same way and for the same reason — it has the
// identical defect otherwise, and the denominator would drift exactly as the
// numerator would have.
//
// Page counts ride as OBSERVATIONS at both SHAs, never as gates:
//   928 elements — 20 pages before S1 gave the page its rhythm, 30 after.
//   232 elements —  5 pages before,                            7.6 after.
const EL_PER_SCENE = 8;              // 1 scene heading + 7 body elements
const ELEMENTS_BIG = 928;
const ELEMENTS_CONTROL = 232;
const SCENES_BIG = ELEMENTS_BIG / EL_PER_SCENE;         // 116
const SCENES_CONTROL = ELEMENTS_CONTROL / EL_PER_SCENE; // 29

// SUITE CITIZENSHIP (Fable, 2026-07-25). The three-run timing measurement holds
// a browser for minutes and starved the next file in the suite — fx1 timed out
// at 480s immediately after it and passed cleanly alone. So the file splits:
// the CORRECTNESS gates and the fixture/geometry assertions run ALWAYS and run
// fast; the three-run timing measurement runs only under SC2_TIMING=1, which is
// what the DoD and any baseline-vs-tip judgement use. The suite stays fast and
// honest; the measurement stays rigorous.
const TIMING = process.env.SC2_TIMING === '1';
const RUNS = TIMING ? 3 : 1;
const TYPED_LEN = TIMING ? 240 : 40;

const freshDesk = async (app, width = LAPTOP_W, height = 900) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.emulateDpr(1, width, height);
};

// A realistic page of screenplay — headings, action that wraps the measure,
// cues, parentheticals, dialogue. Not filler: the element MIX is what drives
// reconcile cost, and a doc of 900 identical one-line actions would measure
// something the writer never meets.
function makeScenes(sceneCount) {
  const scenes = [];
  for (let s = 0; s < sceneCount; s++) {
    const hid = `sc2-h-${s}`;
    const body = [];
    const push = (t, text) => body.push({ id: `sc2-${s}-${body.length}`, t, text });
    push('action', 'The room holds its breath. Light falls across the floorboards in a long bright stripe and does not move for a while.');
    push('character', 'MARGUERITE');
    push('parenthetical', '(not looking up)');
    push('dialogue', 'You said the same thing last year and the year before that.');
    push('action', 'She turns a page. Somewhere below, a door closes.');
    push('character', 'HOLLIS');
    push('dialogue', 'I did. It was true then too.');
    scenes.push({ id: hid, heading: { id: hid, t: 'scene', text: `INT. THE LONG ROOM - ${s % 2 ? 'NIGHT' : 'DAY'}` }, body });
  }
  return scenes;
}

const INSTRUMENT = `(() => {
  window.__lat = { keydown: [], input: [] };
  window.__k0 = 0; window.__i0 = 0;
  window.addEventListener('keydown', () => { window.__k0 = performance.now(); }, true);
  window.addEventListener('keydown', () => { window.__lat.keydown.push(performance.now() - window.__k0); }, false);
  window.addEventListener('input', () => { window.__i0 = performance.now(); }, true);
  window.addEventListener('input', () => { window.__lat.input.push(performance.now() - window.__i0); }, false);
  return true;
})()`;

const stats = (a) => {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y);
  return {
    n: s.length,
    mean: +(s.reduce((t, v) => t + v, 0) / s.length).toFixed(3),
    p50: +s[Math.floor(s.length * 0.5)].toFixed(3),
    p95: +s[Math.floor(s.length * 0.95)].toFixed(3),
    max: +s[s.length - 1].toFixed(3),
  };
};

/**
 * Seed a screenplay doc of `sceneCount` scenes, open it, put the caret in the
 * FIRST element (worst case — every later element is downstream of the edit),
 * type real CDP keystrokes, and return { geo, gate, input, keydown }.
 *
 * Seeding happens from the DESK, never with the script page mounted: this
 * surface flushes on unmount, and a seed written under a mounted page is
 * silently clobbered by that flush.
 */
async function measure(app, sceneCount, typed) {
  await freshDesk(app);
  const scenes = makeScenes(sceneCount);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify([{
      id: 'sc2-perf', text: '', pageType: 'script',
      script: { v: 1, scenes: ${JSON.stringify(scenes)} },
      createdAt: now, updatedAt: now,
    }]));
  })()`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after seed' });
  await app.emulateDpr(1, LAPTOP_W, 900);

  await app.evalJs("location.hash = '#/page/sc2-perf'");
  await app.waitFor("!!document.querySelector('.script-sheet')", { label: 'script surface' });
  await sleep(600);

  const geo = await app.evalJs(`(() => {
    const sheet = document.querySelector('.script-sheet');
    const cs = getComputedStyle(sheet);
    const fs = parseFloat(cs.fontSize);
    const h = sheet.getBoundingClientRect().height;
    return { els: document.querySelectorAll('.script-el, .script-el-active').length,
             fontPx: +fs.toFixed(2), heightPx: +h.toFixed(1),
             lineHeightPx: +parseFloat(cs.lineHeight).toFixed(2),
             padTopPx: +parseFloat(cs.paddingTop).toFixed(2),
             padBottomPx: +parseFloat(cs.paddingBottom).toFixed(2),
             pages: +(h / (${PAGE_H_EM} * fs)).toFixed(2), lines: Math.round(h / fs) };
  })()`);

  await app.evalJs(`(() => {
    const first = document.querySelector('.script-el, .script-el-active');
    if (first && !first.classList.contains('script-el-active')) {
      const r = first.getBoundingClientRect();
      first.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.left + 5, clientY: r.top + 5 }));
    }
    return true;
  })()`);
  await app.waitFor("!!document.querySelector('.script-el-active')", { label: 'active element' });
  await sleep(250);
  // Focus and collapse the caret to the end. Without a genuinely focused
  // contenteditable the keys land on <body> and every figure below is a fiction.
  await app.evalJs(`(() => {
    const a = document.querySelector('.script-el-active');
    a.focus();
    const r = document.createRange(); r.selectNodeContents(a); r.collapse(false);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    return true;
  })()`);

  const focused = await app.evalJs("document.activeElement === document.querySelector('.script-el-active')");
  const before = await app.evalJs("document.querySelector('.script-el-active').textContent.length");
  await app.evalJs(INSTRUMENT);
  await app.typeKeys(typed);
  await sleep(200);
  const after = await app.evalJs("document.querySelector('.script-el-active').textContent.length");

  const lat = JSON.parse(await app.evalJs('JSON.stringify(window.__lat)'));
  return {
    geo,
    gate: { focused, before, after, landed: after - before, expected: typed.length },
    input: stats(lat.input),
    keydown: stats(lat.keydown),
  };
}

/**
 * Run `measure` three times and return the run whose 20-page/control p95 is the
 * MEDIAN, carrying its own gate and geometry with it — so every figure reported
 * belongs to one real run rather than being an average of three that never
 * happened. The three p95s are attached as `spread` so the run-to-run variance
 * stays visible instead of being hidden by the median that tamed it.
 *
 * The gate is asserted on EVERY run, not only the median: a run whose keystrokes
 * missed is not eligible to be anybody's median.
 */
async function measureMedian(app, sceneCount, typed, label) {
  const runs = [];
  for (let i = 0; i < RUNS; i++) {
    runs.push(await measure(app, sceneCount, typed));
    // DF1's inter-pass cleanup, applied WITHIN the median loop: drop the heavy
    // document before the next run so 928 elements' worth of DOM and detached
    // nodes are not still resident while the next measurement starts. Without
    // it the later runs measure a dirtier machine than the first, which is the
    // same contention that starved fx1 in the suite.
    if (i < RUNS - 1) { await app.goto('/'); await sleep(400); }
  }
  const bad = runs.filter((r) => !r.gate.focused || r.gate.landed !== r.gate.expected || !r.input);
  const sorted = [...runs].sort((a, b) => a.input.p95 - b.input.p95);
  const median = sorted[Math.floor(sorted.length / 2)];   // RUNS=1 -> [0]; RUNS=3 -> [1]
  return {
    ...median,
    label,
    allGated: bad.length === 0,
    spread: runs.map((r) => r.input.p95),
    spreadFactor: +(sorted[sorted.length - 1].input.p95 / sorted[0].input.p95).toFixed(2),
  };
}

await withHarness(async (app) => {
  // 240 keystrokes, not 49. At n=49 the 95th percentile IS the second-worst
  // sample, so a single GC pause owns it; 240 puts a dozen samples above the
  // p95 line and makes the figure a property of the architecture rather than of
  // one unlucky frame.
  const TYPED = 'the quick brown fox jumps over the lazy dog again and again '.repeat(5).slice(0, TYPED_LEN);

  // -- S0 baseline: the 20-page document ----------------------------------
  // MEDIAN OF THREE PER SIDE (Fable, 2026-07-25). One outlier cannot move a
  // median, and the ratio is a ratio-of-ratios: it compounds BOTH sides'
  // spread, so a 1.4x spread per side leaves a 2x gate almost no room. Three
  // runs per document collapse that to where the gate can actually
  // discriminate a regression from a noisy afternoon. The re-run rule stays as
  // the floor beneath it, not as a substitute for it.
  const big = await measureMedian(app, SCENES_BIG, TYPED, 'big');

  // THE CORRECTNESS GATE, asserted BEFORE any timing claim is made.
  ok('S0 gate: the caret was genuinely in the script element when the keys were sent (a contenteditable that is not focused sends every keystroke to <body>, where the timings still look plausible)',
    big.gate.focused === true, JSON.stringify(big.gate));
  ok(`S0 gate: every keystroke LANDED in the document — ${TYPED.length} sent, the element's own text grew by the same amount (the measured work actually occurred)`,
    big.gate.landed === big.gate.expected, JSON.stringify(big.gate));
  ok('S0 gate: the input event fired once per keystroke — the React work was genuinely sampled, not inferred',
    big.input !== null && big.input.n >= TYPED.length - 2, JSON.stringify({ samples: big.input && big.input.n, typed: TYPED.length }));
  ok('S0 gate: ALL THREE 20-page runs passed the correctness gate — a run whose keystrokes missed is not eligible to be anybody\'s median, so the gate is asserted per run and not only on the survivor',
    big.allGated === true, JSON.stringify({ spread: big.spread, spreadFactor: big.spreadFactor }));

  // THE FIXTURE IS THE SIZE IT CLAIMS. A fixture that quietly drifted to three
  // pages would leave the bound anchored to nothing.
  ok(`S0 fixture: the baseline document is exactly ${ELEMENTS_BIG} ELEMENTS — the pinned input, held constant so both sides of the bound run the same document. Page count is an OUTPUT of the code under test and rides as an observation only: ${big.geo.pages} pages here, ${big.geo.lines} lines at ${BODY_LINES_PER_PAGE} body lines/page (20 pages before S1 gave the page its vertical rhythm, ~30 after)`,
    big.geo.els === ELEMENTS_BIG, JSON.stringify(big.geo));
  ok('S0 fixture: the sheet is still SC1\'s true page — one 51em x 66em sheet at 12pt (SC2 has not yet paginated; this is the pre-SC2 state the bound is measured against)',
    Math.abs(big.geo.fontPx - EM) < 0.01, JSON.stringify({ fontPx: big.geo.fontPx, expected: EM }));

  // 54 ASSERTED AS GEOMETRY, NOT AS A COUNT. The line box is exactly 12pt and
  // the text block exactly 9in; 54 is what falls out. A check that compared a
  // rendered count against a typed 54 would pass just as happily against a
  // typo'd 55 — this one cannot, because nothing here is typed.
  ok(`S0 derivation: the line box is exactly 12pt (1em, 6 lines/inch) — so a line is 1/6in and the count is a consequence, not a constant`,
    Math.abs(big.geo.lineHeightPx - EM * LINE_BOX_EM) < 0.01,
    JSON.stringify({ lineHeightPx: big.geo.lineHeightPx, expected: EM * LINE_BOX_EM }));
  ok(`S0 derivation: the text block is exactly 9in — 11in less two 1in margins (${MARGIN_EM}em top and bottom, measured) — so the body is ${BODY_EM}em and ${BODY_LINES_PER_PAGE} lines FALLS OUT; the trade's "~55" is a rule of thumb whose variance is bottom margins that differ in practice`,
    Math.abs(big.geo.padTopPx - EM * MARGIN_EM) < 0.5 && Math.abs(big.geo.padBottomPx - EM * MARGIN_EM) < 0.5
      && BODY_LINES_PER_PAGE === 54,
    JSON.stringify({ padTopPx: big.geo.padTopPx, padBottomPx: big.geo.padBottomPx, expectedPad: EM * MARGIN_EM, bodyEm: BODY_EM, derivedLines: BODY_LINES_PER_PAGE }));

  // -- S0 control: the same measurement on a ~5-page document -------------
  // The control exists so the secondary gate survives a change of machine. An
  // absolute millisecond figure cannot be compared across hardware; the RATIO of
  // the 20-page cost to the control's is a property of the architecture rather
  // than of the CPU, and it is the ratio a length-scaling regression moves.
  // FIVE pages, not one, and the reason is measured — see the header table: a
  // 1-page control is sub-millisecond, sits on the timer's noise floor, and made
  // the ratio the least stable number in the file (a 3.3x spread across three
  // runs, enough to fail the secondary gate on noise alone).
  const small = await measureMedian(app, SCENES_CONTROL, TYPED, 'control');

  ok('S0 control gate: the control run\'s keystrokes landed too, on ALL THREE runs — the ratio is only meaningful if BOTH of its terms were really measured',
    small.gate.focused === true && small.gate.landed === small.gate.expected && small.allGated === true,
    JSON.stringify({ gate: small.gate, spread: small.spread, spreadFactor: small.spreadFactor }));
  ok(`S0 control: the control is exactly ${ELEMENTS_CONTROL} ELEMENTS — pinned the same way and for the same reason, or the denominator would drift exactly as the numerator would have. Observation only: ${small.geo.pages} pages (5 before S1's rhythm, ~7.6 after)`,
    small.geo.els === ELEMENTS_CONTROL, JSON.stringify(small.geo));

  const ratio = small.input && big.input ? +(big.input.p95 / small.input.p95).toFixed(2) : null;

  // The keydown/input distinction, asserted rather than left as a comment, so
  // that a future change routing the state update onto keydown cannot silently
  // invalidate the instrument.
  ok('S0 instrument: keydown carries no React work on this contenteditable — its cost stays an order of magnitude under the input event\'s, which is where setElements actually rides (measuring keydown yields a flat curve that is an artifact)',
    big.keydown !== null && big.input !== null && big.keydown.p95 * 4 < big.input.p95,
    JSON.stringify({ keydownP95: big.keydown && big.keydown.p95, inputP95: big.input && big.input.p95 }));

  // -- The baseline of record ---------------------------------------------
  // NOT a gate. Recorded, printed, and left for SC2's own S5 to be measured
  // against once pagination exists. Asserting an absolute ceiling here is
  // exactly the false gate Amendment 1 removed.
  // eslint-disable-next-line no-console
  console.log('\nSC2 S0 BASELINE (pre-pagination, this machine, this run):' +
    `\n  20-page: ${big.geo.pages}pp / ${big.geo.els} els  input mean=${big.input.mean}ms p50=${big.input.p50}ms p95=${big.input.p95}ms max=${big.input.max}ms` +
    `\n   1-page: ${small.geo.pages}pp / ${small.geo.els} els  input mean=${small.input.mean}ms p50=${small.input.p50}ms p95=${small.input.p95}ms max=${small.input.max}ms` +
    `\n  scaling ratio (20pp p95 / control p95) = ${ratio}` +
    `\n  samples: ${big.input.n} keystrokes per run, MEDIAN OF 3 RUNS per document` +
    `\n  run-to-run p95 spread — 20-page ${JSON.stringify(big.spread)} (${big.spreadFactor}x), control ${JSON.stringify(small.spread)} (${small.spreadFactor}x)` +
    '\n  HOW TO JUDGE THE TIP: check out THIS COMMIT on the judging machine and' +
    '\n  measure; measure the tip in the SAME session, interleaved rather than' +
    '\n  back to back; the tip\'s 20-page p95 must be <= 2x the baseline p95 THAT' +
    '\n  MACHINE just re-derived. SECONDARY GATE — the scaling ratio, and it needs' +
    '\n  the SAME same-session re-derivation, not the recorded number: the ratio' +
    `\n  drifts ~1.84x BETWEEN sessions (observed 1.84/2.00/2.25/2.63/${ratio}), more` +
    '\n  than it does within one, so gating against a ratio recorded on another' +
    '\n  day would fail on drift alone. Recorded for orientation, not to gate' +
    '\n  across sessions. Both gates hold, every run — the absolute' +
    '\n  catches "typing got slower generally", the ratio catches "cost now scales' +
    '\n  with document length", and a change can regress either one alone.');

  ok(`S0 baseline recorded: 20-page p95 = ${big.input.p95}ms, 5-page control p95 = ${small.input.p95}ms, scaling ratio = ${ratio} — the reference observation Amendment 1's 2x bound will be measured against, in the same run on the same machine`,
    big.input.p95 > 0 && small.input.p95 > 0 && ratio !== null,
    JSON.stringify({ big: big.input, small: small.input, ratio }));

  // == S1 — THE LINE LEDGER ================================================
  // The arithmetic is the truth; the render is what gets checked against it.
  // Every assertion below compares a RENDERED line count to the ledger's, so a
  // divergence is reported as a defect rather than absorbed as a difference.
  await freshDesk(app);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const hid = 's1-h';
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify([{
      id: 's1-ledger', text: '', pageType: 'script', createdAt: now, updatedAt: now,
      script: { v: 1, scenes: [{ id: hid, heading: { id: hid, t: 'scene', text: 'INT. THE MEASURE - DAY' }, body: [
        { id: 's1-a', t: 'action', text: 'Short line.' },
        { id: 's1-b', t: 'action', text: 'x'.repeat(70) },
        { id: 's1-c', t: 'action', text: 'a'.repeat(125) },
        { id: 's1-d', t: 'action', text: 'Two words here.   ' },
        { id: 's1-e', t: 'dialogue', text: 'This dialogue line is deliberately long enough to wrap across its own thirty-five character measure.' },
        { id: 's1-f', t: 'action', text: '' },
      ] }] },
    }]));
  })()`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after S1 seed' });
  await app.emulateDpr(1, LAPTOP_W, 900);
  await app.evalJs("location.hash = '#/page/s1-ledger'");
  await app.waitFor("!!document.querySelector('.script-sheet')", { label: 'S1 script surface' });
  await sleep(500);

  // The CSS contract the ledger's arithmetic depends on. Asserted, never
  // assumed: under plain `pre` nothing wraps and wrappedLines() changes shape
  // entirely; without overflow-wrap an over-measure word overflows while
  // claiming one line; a browser that hyphenated would break every count by one.
  const css = await app.evalJs(`(() => {
    const el = document.querySelector('.script-el, .script-el-active');
    const sheet = document.querySelector('.script-sheet');
    const cs = getComputedStyle(el), sh = getComputedStyle(sheet);
    return { whiteSpace: cs.whiteSpace, overflowWrap: cs.overflowWrap, hyphens: cs.hyphens || cs.webkitHyphens,
             lineVar: sh.getPropertyValue('--script-line').trim(), lineHeightPx: parseFloat(sh.lineHeight) };
  })()`);
  ok('S1 CSS contract: `.script-el` is white-space:pre-wrap — trailing spaces hang and internal runs are preserved, which is exactly what the ledger assumes (under plain `pre` nothing wraps and the arithmetic would change shape entirely)',
    css.whiteSpace === 'pre-wrap', JSON.stringify(css));
  ok('S1 CSS contract: overflow-wrap:anywhere — the render breaks an over-measure word AT the measure, the same way the ledger counts it',
    css.overflowWrap === 'anywhere', JSON.stringify(css));
  ok('S1 CSS contract: hyphens:none — screenplays do not hyphenate, and a browser that did would break every count by one, silently',
    css.hyphens === 'none', JSON.stringify(css));

  // Rendered line counts, read off client rects, against the ledger's numbers.
  const rows = await app.evalJs(`(() => {
    const els = [...document.querySelectorAll('.script-el, .script-el-active')];
    const sheet = document.querySelector('.script-sheet');
    const line = parseFloat(getComputedStyle(sheet).lineHeight);
    return els.map((e) => {
      const cs = getComputedStyle(e);
      return { type: e.getAttribute('data-type'), text: e.textContent,
               renderedLines: Math.round(e.getBoundingClientRect().height / line),
               marginTopLines: +(parseFloat(cs.marginTop) / line).toFixed(2),
               top: +e.getBoundingClientRect().top.toFixed(1) };
    });
  })()`);

  // The ledger's own arithmetic, recomputed here from the SAME declared
  // constants the module uses — WIDTH_CH action 60, dialogue 35.
  const expect = [
    { t: 'scene', lines: 1, space: 2 },      // first element — space SUPPRESSED by the consumer
    { t: 'action', lines: 1, space: 1 },     // "Short line."
    { t: 'action', lines: 2, space: 1 },     // 70 chars at a 60ch measure -> 2
    { t: 'action', lines: 3, space: 1 },     // 125 chars -> 3
    { t: 'action', lines: 1, space: 1 },     // trailing whitespace hangs, costs nothing
    { t: 'dialogue', lines: 3, space: 0 },   // wraps at its own 35ch measure
    { t: 'action', lines: 1, space: 1 },     // an empty element is one line
  ];
  const mismatches = rows.map((r, i) => ({ i, type: r.type, rendered: r.renderedLines, ledger: expect[i] && expect[i].lines }))
    .filter((m) => m.ledger !== undefined && m.rendered !== m.ledger);
  ok('S1 wrap: every element\'s RENDERED line count equals the ledger\'s arithmetic — the over-measure word breaking at the measure (70ch -> 2 lines, 125ch -> 3), the trailing-whitespace line costing nothing, the empty element costing exactly one, and dialogue wrapping at its OWN 35ch measure rather than the page\'s 60',
    mismatches.length === 0, JSON.stringify({ mismatches, rows: rows.map((r) => ({ t: r.type, rendered: r.renderedLines })) }));

  // Vertical rhythm, in line units.
  const spaceMismatch = rows.map((r, i) => ({ i, type: r.type, rendered: r.marginTopLines, expected: i === 0 ? 0 : (expect[i] && expect[i].space) }))
    .filter((m) => m.expected !== undefined && Math.abs(m.rendered - m.expected) > 0.02);
  ok('S1 rhythm: the page has vertical rhythm at last, and it is expressed in LINE UNITS — every element\'s rendered margin-top is exactly its type\'s SPACE_BEFORE in line-heights (scene 2, action/character/transition/shot/general 1, paren/dialogue 0), so N blank lines of arithmetic render as exactly N line-heights and cannot drift off the 12pt box',
    spaceMismatch.length === 0, JSON.stringify({ spaceMismatch, rows: rows.map((r) => ({ t: r.type, marginTopLines: r.marginTopLines })) }));

  // The suppression rule, and the SC-V4 protection it doubles as.
  const firstTop = await app.evalJs(`(() => {
    const sheet = document.querySelector('.script-sheet');
    const first = sheet.firstElementChild;
    const sr = sheet.getBoundingClientRect(), fr = first.getBoundingClientRect();
    const pad = parseFloat(getComputedStyle(sheet).paddingTop);
    return { gap: +(fr.top - sr.top - pad).toFixed(2), marginTop: getComputedStyle(first).marginTop };
  })()`);
  ok('S1 suppression: the FIRST element of the document contributes no space above it — it sits flush on the top margin despite its type calling for 2 blank lines. This is the consumer\'s rule (CSS at document start, S2\'s paginator at every page top), never the ledger\'s, so the ledger stays position-independent — and it is also what keeps SC1\'s SC-V4 fix intact: a first child\'s margin-top would push the whole sheet down and float the caret off the top margin again',
    Math.abs(firstTop.gap) < 1.5, JSON.stringify(firstTop));
});

// === PARKED — gated behind HARNESS_PARKED=1. This commit is purely ADDITIVE:
// it adds a new file and falsifies no existing assertion, so its park section
// is an empty no-op by design (cd4.mjs's and sc1.mjs's own precedent). SC2's
// real park cycles arrive with S2's sheet sequence, which WILL falsify sc1.mjs's
// "the sheet is a US Letter page ... height within 1px of 1056" at four
// width/theme combinations, and anything else asserting the script sheet's total
// height. Those travel VERBATIM in the same commits as the changes that
// supersede them.
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log('\nSC2 PARKED: PASS (0 checks) — HARNESS_PARKED=1 armed; SC2\'s park cycles do NOT live here, they travel VERBATIM in the files they falsify. S1 (the line ledger + the page\'s vertical rhythm) parks ONE check: sc1.mjs\'s S3 "the page never scrolls itself", superseded on its NUMBER and not its law — the engine is still gone, but a document with real vertical rhythm is ~1.54x taller and now overflows the cap, so the box scrolls to keep the caret visible (root cause: ActiveScriptElement\'s node.focus(), not the typewriter). Its successor is live in sc1.mjs. S2 (the sheet sequence) will park sc1.mjs\'s single-sheet height assertion next.');
}

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nSC2 VERIFY: PASS (${checks.length} checks)` : `\nSC2 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
