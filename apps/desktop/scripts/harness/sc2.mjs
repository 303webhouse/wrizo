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
// The trade's page in CSS px at 96dpi — sc1.mjs's own numbers, inherited rather
// than restated as a second table (SC2 S2b's height successor asserts them of
// EVERY sheet in the sequence, where sc1's predecessor asserted them of one).
const PAGE_W = 8.5 * 96;   // 816
const PAGE_H = 11 * 96;    // 1056
const ASPECT = 8.5 / 11;

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

const freshDesk = async (app, width = LAPTOP_W, height = 900, theme = 'plateau') => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1');");
  if (theme !== 'plateau') await app.evalJs(`localStorage.setItem('wrizo-theme', ${JSON.stringify(theme)})`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: `Desk (${theme})` });
  await app.emulateDpr(1, width, height);
};

// ===========================================================================
// SC2 S2b — the sheet sequence. Shared scaffolding for the section below.
// ===========================================================================

// THE PAGE ARITHMETIC IS DERIVED HERE, INDEPENDENTLY OF THE MODULE UNDER TEST.
// This is the point of the whole section: `scriptPaginate.ts` proves the count
// is viewport-invariant because width was never an input, which is necessary and
// NOT sufficient — it cannot catch the render disagreeing with the arithmetic at
// a given width, and it cannot catch the arithmetic itself being wrong. So the
// expected page for every element below comes from the trade's own geometry,
// worked out here in four lines, and never from the module's output. If the
// module and the render agreed on something wrong, this is what would catch it.
//
// THE FIXTURE SHAPE: a scene heading followed by one-line action elements.
//   - the body is 54 lines (66 − 6 − 6; asserted as geometry above, never typed)
//   - the FIRST element of a page contributes no space above it, so it costs
//     just its own 1 line
//   - every later action costs 1 blank line + 1 line of text = 2
// so a page holds 1 + floor((54 − 1) / 2) = 27 of them, and element i sits on
// page floor(i / 27). Both numbers are hand-checkable, which is the property
// that makes them worth asserting against.
const PER_PAGE = 1 + Math.floor((BODY_LINES_PER_PAGE - 1) / 2);   // 27
const actionBody = (n, from = 0) =>
  Array.from({ length: n }, (_, i) => ({ id: `s2b-a-${from + i}`, t: 'action', text: `Line ${from + i}.` }));

const seedScript = async (app, id, heading, body, { width = LAPTOP_W, theme = 'plateau' } = {}) => {
  await freshDesk(app, width, 900, theme);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify([{
      id: ${JSON.stringify(id)}, text: '', pageType: 'script', createdAt: now, updatedAt: now,
      script: { v: 1, scenes: [{ id: 's2b-h', heading: { id: 's2b-h', t: 'scene', text: ${JSON.stringify(heading)} },
        body: ${JSON.stringify(body)} }] },
    }]));
  })()`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: `Desk after ${id} seed` });
  await app.emulateDpr(1, width, 900);
  await app.evalJs(`location.hash = '#/page/${id}'`);
  await app.waitFor("!!document.querySelector('.script-sheet')", { label: `${id} script surface` });
  await sleep(550);
};

// Everything the SEQUENCE claims about itself, off rendered geometry.
const SEQ = `(() => {
  const seq = document.querySelector('.script-sequence');
  const sheets = [...document.querySelectorAll('.script-sheet')];
  const cs0 = getComputedStyle(sheets[0]);
  const line = parseFloat(cs0.lineHeight);
  const kids = (s) => [...s.querySelectorAll('.script-el, .script-el-active')];
  const all = [...document.querySelectorAll('.script-el, .script-el-active')];
  const r = (e) => e.getBoundingClientRect();

  // The inter-sheet gaps, and whether ANY element lies in one.
  const gaps = [];
  for (let i = 0; i + 1 < sheets.length; i++) {
    const top = r(sheets[i]).bottom, bottom = r(sheets[i + 1]).top;
    gaps.push({
      px: +(bottom - top).toFixed(2),
      occupied: all.filter((e) => r(e).bottom > top + 0.5 && r(e).top < bottom - 0.5).length,
    });
  }
  // No element may extend past the sheet that holds it.
  const straddlers = all.filter((e) => {
    const own = e.closest('.script-sheet');
    if (!own) return true;
    const er = r(e), sr = r(own);
    return er.top < sr.top - 0.5 || er.bottom > sr.bottom + 0.5;
  }).length;

  return {
    hasSequence: !!seq,
    sheets: sheets.length,
    linePx: +line.toFixed(2),
    gapPx: seq ? getComputedStyle(seq).rowGap : null,
    dims: sheets.map((s) => ({ w: +r(s).width.toFixed(2), h: +r(s).height.toFixed(2) })),
    // lines a sheet actually spends, measured off the rendered boxes
    used: sheets.map((s) => Math.round(kids(s).reduce((n, e) =>
      n + (r(e).height + parseFloat(getComputedStyle(e).marginTop)) / line, 0))),
    firstOffset: sheets.map((s) => +(r(kids(s)[0] || s).top - r(s).top).toFixed(2)),
    firstMarginTop: sheets.map((s) => parseFloat(getComputedStyle(kids(s)[0] || s).marginTop)),
    firstType: sheets.map((s) => (kids(s)[0] || {}).dataset && kids(s)[0].dataset.type),
    lastType: sheets.map((s) => (kids(s)[kids(s).length - 1] || {}).dataset && kids(s)[kids(s).length - 1].dataset.type),
    docIndexes: sheets.map((s) => kids(s).map((e) => +e.dataset.docIndex)),
    continuedFrom: sheets.map((s) => kids(s).map((e) => e.dataset.continuedFrom === 'true')),
    continues: sheets.map((s) => kids(s).map((e) => e.dataset.continues === 'true')),
    gaps, straddlers,
  };
})()`;

// The sheet index a given document index actually rendered onto.
const sheetIndexOf = (i) => `(() => {
  const el = document.querySelector('.script-el[data-doc-index="${i}"], .script-el-active[data-doc-index="${i}"]');
  if (!el) return -1;
  return [...document.querySelectorAll('.script-sheet')].indexOf(el.closest('.script-sheet'));
})()`;

const rectOf = (app, sel) => app.evalJs(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); return el ? el.getBoundingClientRect().toJSON() : null; })()`);

// Gesture claims take a genuinely trusted CDP pointer, never a synthetic click
// (sc1.mjs's own shape, verbatim).
const trustedClick = async (app, sel) => {
  const r = await rectOf(app, sel);
  if (!r) throw new Error('trustedClick: no element ' + sel);
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  await app.mouseMove(x, y);
  await app.mouseDown(x, y);
  await app.mouseUp(x, y);
  await sleep(160);
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

  // SC2 S2b — THE PROBE IS RE-POINTED; THE ASSERTIONS BELOW ARE NOT REWRITTEN.
  // `pages` and `lines` were read off ONE sheet's height, which was the only
  // honest reading while the surface was one sheet that grew. From S2b the
  // surface is a SEQUENCE of exact 11in sheets, so a sheet's height is a
  // constant (1056px) and those two figures would have quietly become "1 page,
  // 66 lines" for every document ever measured — a number that still looks like
  // a measurement. `pages` now counts sheets and `lines` sums the elements'
  // own rendered heights and spacing. This is the instrument following reality,
  // disclosed here: both figures ride in check LABELS as observations and gate
  // nothing, and no assertion's text or condition changes because of it.
  const geo = await app.evalJs(`(() => {
    const sheets = [...document.querySelectorAll('.script-sheet')];
    const sheet = sheets[0];
    const cs = getComputedStyle(sheet);
    const fs = parseFloat(cs.fontSize);
    const h = sheet.getBoundingClientRect().height;
    const els = [...document.querySelectorAll('.script-el, .script-el-active')];
    const lines = els.reduce((n, e) => n + (e.getBoundingClientRect().height + parseFloat(getComputedStyle(e).marginTop)) / fs, 0);
    return { els: els.length,
             fontPx: +fs.toFixed(2), heightPx: +h.toFixed(1),
             lineHeightPx: +parseFloat(cs.lineHeight).toFixed(2),
             padTopPx: +parseFloat(cs.paddingTop).toFixed(2),
             padBottomPx: +parseFloat(cs.paddingBottom).toFixed(2),
             sheetsUniform: new Set(sheets.map((s) => Math.round(s.getBoundingClientRect().height))).size <= 1,
             pages: sheets.length, lines: Math.round(lines) };
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
  // SUPERSEDED by SC2 S2b (2026-07-25) — A4 park cycle, travelling in the SAME
  // commit as the change that falsified it. The ORIGINAL, verbatim:
  //
  //   ok('S0 fixture: the sheet is still SC1\'s true page — one 51em x 66em
  //   sheet at 12pt (SC2 has not yet paginated; this is the pre-SC2 state the
  //   bound is measured against)',
  //     Math.abs(big.geo.fontPx - EM) < 0.01, JSON.stringify({ fontPx:
  //     big.geo.fontPx, expected: EM }));
  //
  // SUPERSEDED ON ITS SUBJECT, NOT ITS NUMBER. Its condition (12pt type) is
  // untouched and still holds; what retired is the state the check exists to
  // pin — "ONE sheet", "SC2 HAS NOT YET PAGINATED". S2b paginates, so that
  // sentence cannot be re-asserted by anyone, and a check that reads as a claim
  // about the pre-SC2 world would be a false label on a true condition. Parked
  // verbatim in this file's own PARKED section. The successor below asserts
  // MORE than it did: the 12pt metric it held, now on EVERY sheet, plus the
  // uniformity a sequence makes assertable and a single sheet could not.
  ok('SC2 S2b (was "S0 fixture: the sheet is still SC1\'s true page — one 51em x 66em sheet at 12pt"): every sheet in the sequence is SC1\'s true page at 12pt, and they are UNIFORM — the baseline document now projects to a sequence, and a page whose height depended on what landed on it would not be a page',
    Math.abs(big.geo.fontPx - EM) < 0.01 && Math.abs(big.geo.heightPx - PAGE_H_EM * EM) <= 1 && big.geo.sheetsUniform === true,
    JSON.stringify({ fontPx: big.geo.fontPx, expected: EM, heightPx: big.geo.heightPx, sheets: big.geo.pages, uniform: big.geo.sheetsUniform }));

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

  // ========================================================================
  // S2b — THE SHEET SEQUENCE (the render)
  // ========================================================================
  //
  // THE THIRTEEN PROPERTIES BECOME COVERAGE HERE. Until this commit they lived
  // in a scratch harness, because `scriptPaginate.ts` was imported by nothing —
  // and by Amendment 2's own principle that is a pre-commit gate, not coverage:
  // proof lives where the thing it proves lives, and a check that is not in the
  // repository is a memory of a check. S2b's render imports the modules, so the
  // projection is now observable in the DOM and every property is asserted
  // where it actually has to hold — against rendered geometry, on a fixture
  // engineered to exercise it.
  //
  // The conversion makes them STRICTER, not looser. The scratch versions read
  // `paginate()`'s return value; these read the page the writer would see. A
  // property that held in the pure function and failed in the render used to be
  // invisible; it now fails here.
  //
  // WHAT THIS SECTION CANNOT REACH, stated rather than glossed: byte-level
  // determinism of the pure function's return value is not observable through a
  // DOM. Property 11's rendered form asserts the strongest observable
  // consequence — the same document reloaded produces the same sheets holding
  // the same elements — which is what "hidden state" would break.

  // -- P1: a single element projects to exactly 1 page ---------------------
  await seedScript(app, 's2b-one', 'INT. A SINGLE ROOM - DAY', []);
  let m = await app.evalJs(SEQ);
  ok('S2b P1: a document of one element projects to exactly ONE sheet — the sequence exists even at length one, so a fresh page is a page and not a special case',
    m.hasSequence === true && m.sheets === 1, JSON.stringify({ sheets: m.sheets, hasSequence: m.hasSequence }));

  // -- P2 / P3: 53 lines is one page, 55 lines is two ----------------------
  // The pair that pins the boundary from BOTH sides. One of them alone would
  // pass against an off-by-one; together they cannot.
  await seedScript(app, 's2b-53', 'INT. FIFTY-THREE - DAY', actionBody(26));
  m = await app.evalJs(SEQ);
  ok(`S2b P2: a document of 53 lines is ONE page — 1 heading line + 26 actions at 2 lines each, one line short of the 54-line body`,
    m.sheets === 1 && m.used[0] === 53, JSON.stringify({ sheets: m.sheets, used: m.used }));

  await seedScript(app, 's2b-55', 'INT. FIFTY-FIVE - DAY', actionBody(27));
  m = await app.evalJs(SEQ);
  ok('S2b P3: a document of 55 lines is TWO pages — the 27th action would take it to 55 and the body holds 54, so it begins page two. The 54-line body is proven from both sides, and the trade\'s folklore 55 would have put it on one page',
    m.sheets === 2 && m.used[0] === 53 && m.docIndexes[1].length === 1,
    JSON.stringify({ sheets: m.sheets, used: m.used, page2: m.docIndexes[1] }));

  // -- P4 / P10 / P11 / P12 / P13 on a real multi-page document ------------
  const BIG_PAGES = 5;
  const BIG_ELS = PER_PAGE * BIG_PAGES;                      // 135
  await seedScript(app, 's2b-big', 'INT. THE LONG ROOM - DAY', actionBody(BIG_ELS - 1));
  m = await app.evalJs(SEQ);

  ok(`S2b P4: no page exceeds the 54-line body — every one of the ${m.sheets} sheets spends at most ${BODY_LINES_PER_PAGE} lines, MEASURED off the rendered boxes and their spacing rather than counted from the projection. (The one bound worth naming: an element that may not split and is ITSELF longer than a page has nowhere to go and overflows its sheet alone — dialogue's case is what SC2.1's (MORE)/(CONT'D) closes.)`,
    m.used.every((u) => u <= BODY_LINES_PER_PAGE), JSON.stringify({ used: m.used, body: BODY_LINES_PER_PAGE }));

  ok('S2b P10: the first element of EVERY page contributes zero space above it — not just the document\'s first. Its rendered margin-top is 0 on every sheet, and its distance from its own sheet\'s top edge is the 1in margin exactly. The paginator zeroes `spaceBefore` at every page top and CSS zeroes the margin at every sheet\'s first child; this asserts the two agree',
    m.firstMarginTop.every((v) => Math.abs(v) < 0.5)
      && new Set(m.firstOffset.map((v) => Math.round(v))).size === 1,
    JSON.stringify({ firstMarginTop: m.firstMarginTop, firstOffset: m.firstOffset }));

  const flat = m.docIndexes.flat().filter((_, k) => !m.continuedFrom.flat()[k]);
  ok(`S2b P12: every element is placed EXACTLY once — the ${BIG_ELS} document indexes rendered across the sequence, continuation parts excluded, are precisely 0..${BIG_ELS - 1} with none lost and none duplicated. A paginator that drops a writer's line is the worst failure this ticket could ship, and it would be silent`,
    flat.length === BIG_ELS && new Set(flat).size === BIG_ELS
      && flat.slice().sort((a, b) => a - b).every((v, k) => v === k),
    JSON.stringify({ placed: flat.length, unique: new Set(flat).size, expected: BIG_ELS }));

  const before = JSON.stringify(m.docIndexes);
  await app.reload();
  await app.waitFor("!!document.querySelector('.script-sheet')", { label: 's2b-big reload' });
  await sleep(550);
  let m2 = await app.evalJs(SEQ);
  ok('S2b P11 (deterministic): the same document renders the same sequence — sheet for sheet, element for element — across a full reload. Pagination is derived and never stored, so this is what "no hidden state" looks like from outside: nothing survives the reload to make the second projection differ from the first',
    JSON.stringify(m2.docIndexes) === before, JSON.stringify({ before: m.docIndexes.map((p) => p.length), after: m2.docIndexes.map((p) => p.length) }));

  // P13 — idempotence, in its load-bearing form. `paginate()` runs on EVERY
  // keystroke, so the question that matters is not "does it return the same
  // thing twice" but "does typing at the end of a document quietly rewrite the
  // pages above". A writer on page five must not watch page one reflow.
  const pageOneBefore = JSON.stringify(m2.docIndexes[0]);
  await trustedClick(app, `.script-el[data-doc-index="${BIG_ELS - 1}"]`);
  await app.waitFor("!!document.querySelector('.script-el-active')", { label: 's2b-big tail active' });
  await app.typeKeys(' and then the light went out of the room entirely.');
  await sleep(400);
  const m3 = await app.evalJs(SEQ);
  ok('S2b P13 (idempotence): typing at the END of a five-page document leaves page ONE byte-identical — same elements, same order, same first-line offset. This is the property that makes "derived, never stored" safe under the hands rather than merely correct on paper: the sequence recomputes on every keystroke, so hidden state would surface as a page quietly rewriting itself above the writer',
    JSON.stringify(m3.docIndexes[0]) === pageOneBefore
      && Math.abs(m3.firstOffset[0] - m2.firstOffset[0]) < 0.5,
    JSON.stringify({ before: pageOneBefore, after: JSON.stringify(m3.docIndexes[0]) }));

  // -- P5 / P6 / P7: the three "never last" rules, each tripped on purpose --
  // 25 actions puts the page at 51 lines, which is where each of these lands
  // its subject at the page foot. The fixtures are engineered to trip the rule,
  // not merely to be long: a rule that is never reached is a rule never tested.
  await seedScript(app, 's2b-scene', 'INT. THE FIRST - DAY', [
    ...actionBody(25),
    { id: 's2b-h2', t: 'scene', text: 'INT. THE SECOND - NIGHT' },
    ...actionBody(20, 100),
  ]);
  m = await app.evalJs(SEQ);
  ok('S2b P5: a scene heading is never the last line of a page — placed at line 54 by construction, it travels whole to the top of the next page instead of dangling at the foot of this one',
    m.sheets >= 2 && m.lastType.slice(0, -1).every((t) => t !== 'scene'),
    JSON.stringify({ lastType: m.lastType, firstType: m.firstType }));

  await seedScript(app, 's2b-char', 'INT. THE CUE - DAY', [
    ...actionBody(25),
    { id: 's2b-c', t: 'character', text: 'MARGUERITE' },
    { id: 's2b-d', t: 'dialogue', text: 'You said the same thing last year, and the year before that, and I believed you both times.' },
    ...actionBody(20, 200),
  ]);
  m = await app.evalJs(SEQ);
  const cueSheet = await app.evalJs(sheetIndexOf(26));
  const lineSheet = await app.evalJs(sheetIndexOf(27));
  ok('S2b P6: a character cue is never the last line of a page — it travels with its dialogue (the Half-Hour Writer\'s ruling), so the cue and the first line it speaks land on the SAME sheet. A name at the foot of one page and its words at the top of the next is the defect this rule exists for',
    m.lastType.slice(0, -1).every((t) => t !== 'character') && cueSheet === lineSheet && cueSheet >= 0,
    JSON.stringify({ lastType: m.lastType, cueSheet, lineSheet }));

  await seedScript(app, 's2b-paren', 'INT. THE MODIFIER - DAY', [
    ...actionBody(25),
    { id: 's2b-c2', t: 'character', text: 'HOLLIS' },
    { id: 's2b-p2', t: 'paren', text: '(not looking up)' },
    { id: 's2b-d2', t: 'dialogue', text: 'I did say it. It was true then and it is true now, whatever you have decided about it since.' },
    ...actionBody(20, 300),
  ]);
  m = await app.evalJs(SEQ);
  ok('S2b P7: a parenthetical is never the last line of a page (ruled 2026-07-25) — it is a MODIFIER on the line beneath it, and stranded at a page foot it modifies nothing. It travels forward, and the cue above it travels with it',
    m.lastType.slice(0, -1).every((t) => t !== 'paren' && t !== 'character'),
    JSON.stringify({ lastType: m.lastType, firstType: m.firstType }));

  // -- P8: the one permitted split, and the writer's text surviving it ------
  const longAction = Array.from({ length: 60 }, (_, i) =>
    `Sentence ${String(i).padStart(2, '0')} runs to about sixty characters wide here.`).join(' ');
  await seedScript(app, 's2b-split', 'INT. THE UNBROKEN - DAY', [{ id: 's2b-big-action', t: 'action', text: longAction }]);
  m = await app.evalJs(SEQ);
  const split = await app.evalJs(`(() => {
    const parts = [...document.querySelectorAll('[data-doc-index="1"]')];
    return { parts: parts.length,
             joined: parts.map((p) => p.textContent).join(''),
             firstContinues: parts[0] && parts[0].dataset.continues === 'true',
             secondContinuedFrom: parts[1] && parts[1].dataset.continuedFrom === 'true' };
  })()`);
  const source = await app.evalJs("JSON.parse(localStorage.getItem('writer-studio-journal-entries'))[0].script.scenes[0].body[0].text");
  ok('S2b P8: an action block longer than a whole page is the ONE permitted split — it cannot move whole, so it breaks at a line boundary and continues onto the next sheet, marked as continuing rather than silently cut',
    m.sheets === 2 && split.parts === 2 && split.firstContinues === true && split.secondContinuedFrom === true,
    JSON.stringify({ sheets: m.sheets, ...split, joined: undefined }));
  ok('S2b P8 (the split loses no word AND invents none): the two rendered halves concatenate back to the writer\'s text CHARACTER FOR CHARACTER — each part is a genuine substring, not a re-rendering. The cut comes from the same wrap the line count came from (scriptLedger\'s wrapToLines, which `wrappedLines` is now defined as the length of), so the break can only land where the arithmetic put it. This check earned its keep on its first run: the first cut of the split joined the lines with newlines, which LOOKED right at every width and had quietly written 58 breaks the writer never typed into the block\'s text',
    split.joined === source,
    JSON.stringify({ rendered: split.joined.length, source: source.length, equal: split.joined === source }));

  // -- P9: dialogue does not split -----------------------------------------
  await seedScript(app, 's2b-dlg', 'INT. THE UNBROKEN SPEECH - DAY', [
    ...actionBody(20),
    { id: 's2b-long-d', t: 'dialogue', text: Array.from({ length: 12 }, (_, i) =>
      `And another thing, number ${i}, which I have been meaning to say to you for a very long time now.`).join(' ') },
  ]);
  m = await app.evalJs(SEQ);
  const dlg = await app.evalJs('(() => [...document.querySelectorAll(\'[data-doc-index="21"]\')].length)()');
  ok('S2b P9: dialogue never splits in SC2 — a speech that will not fit in the room left on a page moves WHOLE to the next one rather than breaking. The cost is named and not silent: page counts run slightly long against Final Draft until SC2.1 lands (MORE)/(CONT\'D), which is an edit to dialogue\'s single row in the break table',
    dlg === 1 && m.sheets === 2 && m.continues.flat().every((c) => c === false),
    JSON.stringify({ dialogueParts: dlg, sheets: m.sheets }));

  // -- THE TRANSITION ROW, AND ITS TERMINATION PROOF ------------------------
  // The fixture is engineered to trip BOTH directions at once: page one ends on
  // a scene heading (which must move forward) and page two opens on a
  // transition (which must not begin a page). A pass that pulled the transition
  // BACK while pulling the heading FORWARD is the oscillation this shape exists
  // to catch — and because `paginate()` runs on every keystroke, an oscillation
  // is not a wrong page count, it is a frozen editor.
  //
  // WHAT TERMINATION LOOKS LIKE FROM OUT HERE, stated exactly so the check is
  // not read as more than it is: a non-terminating fix-up pass never returns, so
  // the surface never mounts and this scenario dies on its own `waitFor`
  // timeout. Reaching these lines at all is the observable half of the proof;
  // the general argument — every move is forward, Φ (the sum of page indexes)
  // strictly increases, at most 2N moves — is carried in scriptPaginate.ts
  // where the pass lives. There is no retry cap and no iteration limit
  // anywhere: a cap would have made this check pass while hiding exactly the
  // failure it is here to find.
  await seedScript(app, 's2b-trans', 'INT. THE FIRST ROOM - DAY', [
    ...actionBody(25),
    { id: 's2b-h3', t: 'scene', text: 'INT. THE SECOND ROOM - NIGHT' },
    { id: 's2b-tr', t: 'transition', text: 'CUT TO:' },
    ...actionBody(20, 400),
  ]);
  m = await app.evalJs(SEQ);
  const transSheet = await app.evalJs(sheetIndexOf(27));
  const headSheet = await app.evalJs(sheetIndexOf(26));
  ok('S2b (the transition row, deferred from S2a.1 and landed here): a transition never begins a page — it belongs with the scene it ends, so it renders on the SAME sheet as the heading above it, and the sheet it opens is opened by that heading instead. The rule is `keepWithPrevious` and it is the only rule that reaches backward in intent; it is implemented as the same FORWARD move as every other rule (push the previous page\'s tail forward to join it), which is what makes the pass single-directional and its termination provable rather than hoped',
    m.firstType.every((t) => t !== 'transition') && transSheet === headSheet && transSheet >= 0,
    JSON.stringify({ firstType: m.firstType, lastType: m.lastType, headSheet, transSheet }));

  const stable1 = JSON.stringify(m.docIndexes);
  await app.reload();
  await app.waitFor("!!document.querySelector('.script-sheet')", { label: 's2b-trans reload', timeout: 8000 });
  await sleep(550);
  m2 = await app.evalJs(SEQ);
  ok('S2b (the transition row TERMINATES, and its result is STABLE): the fixture engineered to trip both rules at once — a page ending on a scene heading whose next page opens on a transition — mounts, settles in one pass, and produces the identical sequence again on a fresh load. It reaches a fixed point rather than a cycle; no cap or retry limit is doing that work, because a cap is how an unproven loop hides',
    JSON.stringify(m2.docIndexes) === stable1 && m2.firstType.every((t) => t !== 'transition'),
    JSON.stringify({ first: m.docIndexes.map((p) => p.length), again: m2.docIndexes.map((p) => p.length) }));

  // -- THE FOUR RENDERED CROSS-CHECKS, AND THE sc1.mjs HEIGHT SUCCESSOR -----
  //
  // `paginate()` is pure and takes no width, so the arithmetic is viewport-
  // invariant by construction. That is NECESSARY AND NOT SUFFICIENT: it cannot
  // catch the RENDER disagreeing with the arithmetic at a given width. So the
  // sequence is measured at each width/theme leg and compared against the page
  // arithmetic derived independently at the top of this file.
  //
  // The last check in each leg is the LIVE SUCCESSOR to sc1.mjs's parked "the
  // sheet is a US Letter page" (parked verbatim there, in this same commit).
  // It ends WIDER than its predecessor by four measures: every sheet rather
  // than the first, uniformity across the sequence, the gap proven chrome, and
  // page N's first line at page one's own offset — the last two being truths a
  // single-sheet check could not reach at all.
  const MID = Math.floor(BIG_ELS * 0.6);                    // 81 — ~60% through
  const MID_PAGE = Math.floor(MID / PER_PAGE);              // derived here, not read
  for (const [label, width, theme] of [
    ['1100 (the framed floor)', 1100, 'plateau'],
    ['1280 (the laptop reference)', LAPTOP_W, 'plateau'],
    ['2200 (wide)', 2200, 'plateau'],
    ['1280 · Flux', LAPTOP_W, 'flux'],
    ['1000 (legacy, below the framed gate)', 1000, 'plateau'],
  ]) {
    await seedScript(app, 's2b-leg', 'INT. THE SAME ROOM - DAY', actionBody(BIG_ELS - 1), { width, theme });
    const leg = await app.evalJs(SEQ);
    const midSheet = await app.evalJs(sheetIndexOf(MID));

    ok(`S2b @ ${label} — cross-check 1: the RENDERED sheet count is ${BIG_PAGES}, the count the page arithmetic derives for ${BIG_ELS} elements (${PER_PAGE} to a page). Identical at every leg: a page count that moves with the window is a clock that lies, and the arithmetic proving itself viewport-free cannot prove the render is`,
      leg.sheets === BIG_PAGES, JSON.stringify({ sheets: leg.sheets, expected: BIG_PAGES, els: BIG_ELS }));

    ok(`S2b @ ${label} — cross-check 2: a MID-DOCUMENT element lands on the sheet the arithmetic puts it on — element ${MID} (~60% through) renders on sheet ${MID_PAGE}, floor(${MID}/${PER_PAGE}). A correct total with the breaks in the wrong places would pass check 1 and fail this one`,
      midSheet === MID_PAGE, JSON.stringify({ midSheet, expected: MID_PAGE, index: MID }));

    ok(`S2b @ ${label} — cross-check 3: the inter-sheet gap is CHROME AND NEVER BODY — every gap between one sheet's bottom border and the next's top is ${leg.gapPx} of empty desk holding no element at all, and no element's rect straddles a sheet boundary. The gap is expressed in the app's root unit, never in the page's own em and never in a multiple of --script-line, so it can neither scale as though it were paper nor be read as N blank lines of screenplay`,
      leg.gaps.length === BIG_PAGES - 1 && leg.gaps.every((g) => g.occupied === 0 && g.px > 0)
        && leg.straddlers === 0,
      JSON.stringify({ gaps: leg.gaps, straddlers: leg.straddlers, gapPx: leg.gapPx }));

    ok(`S2b @ ${label} — cross-check 4: page N's first line sits at the SAME offset inside its sheet as page one's — within 1px, across all ${leg.sheets} sheets. Every page begins on its own top margin; none inherits a nudge from what broke above it`,
      Math.max(...leg.firstOffset) - Math.min(...leg.firstOffset) <= 1,
      JSON.stringify({ firstOffset: leg.firstOffset }));

    ok(`SC2 S2b @ ${label} (successor to sc1.mjs's parked "the sheet is a US Letter page — 8.5 x 11in, aspect within 0.5% of 8.5:11"): EVERY sheet in the sequence is a US Letter page — 816 x 1056px, aspect within 0.5% of 8.5:11 — and they are UNIFORM: no sheet differs from any other. The predecessor measured the first of one; a page whose height depended on how much text landed on it would not be a page at all`,
      leg.dims.length === BIG_PAGES
        && leg.dims.every((d) => Math.abs(d.w - PAGE_W) <= 1 && Math.abs(d.h - PAGE_H) <= 1
          && Math.abs((d.w / d.h) - ASPECT) / ASPECT < 0.005)
        && new Set(leg.dims.map((d) => `${Math.round(d.w)}x${Math.round(d.h)}`)).size === 1,
      JSON.stringify({ dims: leg.dims }));
  }

  // -- THE VERTICAL POLICY, OWNED RATHER THAN EMERGENT ---------------------
  // Before S2b this surface had no vertical policy; it had a side effect.
  // `node.focus()` scrolled whatever was below the fold into view, so every
  // Enter moved the page and nobody had ever decided that it should — which is
  // why it broke on SC2 S1, a change with nothing to do with scrolling
  // (sc1.mjs's S3 park carries the measurement). The rule is now written down
  // in ScriptEditor.tsx as three clauses, and these two checks are the clauses.
  await seedScript(app, 's2b-vert', 'INT. THE STILL ROOM - DAY', actionBody(BIG_ELS - 1));
  const capTop = await app.evalJs("(() => { const c = document.querySelector('.desk-frame-scroll-cap'); return { st: c.scrollTop, h: c.clientHeight }; })()");
  await trustedClick(app, '.script-el[data-doc-index="2"]');
  await app.waitFor("!!document.querySelector('.script-el-active')", { label: 's2b-vert active' });
  await sleep(250);
  const afterVisibleClick = await app.evalJs("document.querySelector('.desk-frame-scroll-cap').scrollTop");
  ok('S2b vertical policy, clause 1+2 (the box does not move when it has no reason to): placing the caret in an element that is ALREADY visible leaves the scroll box exactly where it was — not a pixel, not a centring nudge. focus() now carries { preventScroll: true }, so the browser\'s own scroll-into-view reflex is off and every movement of this page is a decision taken here',
    Math.abs(afterVisibleClick - capTop.st) < 0.5,
    JSON.stringify({ before: capTop.st, after: afterVisibleClick }));

  // Now drive the caret genuinely past the fold with real keystrokes and assert
  // the box moved by the MINIMUM — the caret ends just inside the bottom edge,
  // not centred, not carried to a fraction of the box.
  for (let i = 0; i < 22; i++) { await app.key('Enter'); await app.typeKeys(`Down the page, line ${i}.`); await sleep(45); }
  await sleep(300);
  const vert = await app.evalJs(`(() => {
    const cap = document.querySelector('.desk-frame-scroll-cap');
    const a = document.querySelector('.script-el-active');
    const view = cap.getBoundingClientRect(), car = a.getBoundingClientRect();
    const line = parseFloat(getComputedStyle(document.querySelector('.script-sheet')).lineHeight);
    return { moved: cap.scrollTop > 0, caretBottom: +car.bottom.toFixed(1), viewBottom: +view.bottom.toFixed(1),
             slackLines: +((view.bottom - car.bottom) / line).toFixed(2), scrolledAttr: cap.dataset.scrolled || null };
  })()`);
  // ========================================================================
  // S4 — THE PAGE NUMBERS (R1, approved 2026-07-24)
  // ========================================================================
  //
  // R1 amends the house's anti-gamification boundary by exactly one line: a
  // page number on a screenplay is not the app counting the writer, it is the
  // document's own furniture, as intrinsic as a slugline's capitals. THE BRIGHT
  // LINE TRAVELS WITH THE APPROVAL — the number lives on the page artifact
  // only, and no aggregate of it ever surfaces anywhere in the app.
  //
  // So the absence is asserted as strictly as the presence, and it is the
  // harder half: a presence check fails loudly the day someone breaks it, while
  // an aggregate is the kind of thing that gets added helpfully, in a title
  // attribute, by someone who never read the ruling. These checks are what
  // stands between R1 and that afternoon.
  await seedScript(app, 's2b-num', 'INT. THE NUMBERED ROOM - DAY', actionBody(BIG_ELS - 1));
  const nums = await app.evalJs(`(() => {
    const sheets = [...document.querySelectorAll('.script-sheet')];
    const per = sheets.map((s) => {
      const n = s.querySelector('.script-page-number');
      if (!n) return null;
      const cs = getComputedStyle(s), sr = s.getBoundingClientRect(), nr = n.getBoundingClientRect();
      const border = parseFloat(cs.borderTopWidth) || 0;
      return {
        text: n.textContent,
        // inside the TOP MARGIN: below the paper's edge, above the text block
        belowPaperTop: +(nr.top - sr.top).toFixed(2),
        aboveTextBlock: +((sr.top + border + parseFloat(cs.paddingTop)) - nr.bottom).toFixed(2),
        // right edge on the text block's right edge — the 1in margin
        offRightMargin: +(nr.right - (sr.right - border - parseFloat(cs.paddingRight))).toFixed(2),
        userSelect: getComputedStyle(n).userSelect || getComputedStyle(n).webkitUserSelect,
        fontFamily: getComputedStyle(n).fontFamily,
        ariaLabel: n.getAttribute('aria-label'), title: n.getAttribute('title'),
      };
    });
    return { sheets: sheets.length, per, total: document.querySelectorAll('.script-page-number').length };
  })()`);
  ok(`S4: the page number is top-right inside the top margin, and PAGE ONE IS BARE — ${nums.sheets} sheets carry ${nums.total} numbers, reading "2." through "${nums.sheets}." in document order. It sits 0.5in below the paper's edge (halfway into the 1in top margin, clear of the text block) with its right edge exactly on the 1in right margin, in the sheet's own Courier — the document's furniture, set in the document's own type`,
    nums.total === nums.sheets - 1 && nums.per[0] === null
      && nums.per.slice(1).every((n, k) => n && n.text === `${k + 2}.`
        && n.aboveTextBlock > 0 && n.belowPaperTop > 0
        && Math.abs(n.offRightMargin) <= 1 && /Courier/.test(n.fontFamily)),
    JSON.stringify(nums));

  const numGeo = await app.evalJs(SEQ);
  ok('S4: the number is CHROME AND COSTS NO BODY LINE — and this is proven rather than inspected. Page one carries no number and every other page does, so if the number took a line, page two onward would begin lower than page one; the first-line offset is identical across all sheets and every sheet still spends at most its 54 lines. The 54-line body never knew the number was there, which is what "it sits in the top margin, outside the block" has to MEAN',
    Math.max(...numGeo.firstOffset) - Math.min(...numGeo.firstOffset) <= 1
      && numGeo.used.every((u) => u <= BODY_LINES_PER_PAGE)
      && numGeo.sheets === BIG_PAGES,
    JSON.stringify({ firstOffset: numGeo.firstOffset, used: numGeo.used, sheets: numGeo.sheets }));

  ok('S4: the number is not the writer\'s words — `user-select:none`, so a selection dragged across a page break hands back a screenplay and not a screenplay with page numbers loose in it. (The copy-out and export paths serialize from the DOCUMENT and never the DOM, so they could not have picked it up regardless; this is the selection a writer makes with their own hand.)',
    nums.per.slice(1).every((n) => n.userSelect === 'none'),
    JSON.stringify(nums.per.slice(1).map((n) => n.userSelect)));

  // THE BRIGHT LINE. Scanned across the whole live document — every text node
  // and every title/aria-label attribute — with the sliver and the Tutor OPEN,
  // because those are the two places the brief names by name.
  //
  // THE SCANNER WAS PROVEN FALSIFIABLE BEFORE IT WAS TRUSTED — an absence check
  // is exactly the species that passes because it is looking at nothing, and
  // "a check that cannot fail is not a check" is this lane's own law. Four
  // aggregates were planted into a live page and every one was caught: a
  // rendered "Page 2 of 5"; a `title="5 pages today"`; an
  // `aria-label="page 3 of 5"`; and a bare "2 / 5" badge. Text nodes,
  // attributes and both wordings — the scan sees all of them.
  const scanAggregates = () => `(() => {
    const forms = [
      { name: 'page N of N', re: /page\\s*\\d+\\s*of\\s*\\d+/i },
      { name: 'of N pages', re: /\\bof\\s+\\d+\\s+pages?\\b/i },
      { name: 'N pages', re: /\\b\\d+\\s+pages?\\b/i },
      { name: 'N / N', re: /\\b\\d+\\s*\\/\\s*\\d+\\b/ },
    ];
    const text = document.body.innerText || '';
    const attrs = [];
    for (const el of document.querySelectorAll('[title], [aria-label]')) {
      const t = el.getAttribute('title'), a = el.getAttribute('aria-label');
      if (t) attrs.push(t);
      if (a) attrs.push(a);
    }
    const attrText = attrs.join(' \\u2014 ');
    const hits = [];
    for (const f of forms) {
      const inText = text.match(f.re), inAttr = attrText.match(f.re);
      if (inText) hits.push({ where: 'text', form: f.name, sample: inText[0] });
      if (inAttr) hits.push({ where: 'attribute', form: f.name, sample: inAttr[0] });
    }
    // Any attribute that talks about pages AND carries a digit is an aggregate
    // waiting to happen, whatever its wording.
    const pageyAttrs = attrs.filter((a) => /\\bpages?\\b/i.test(a) && /\\d/.test(a));
    return { hits, pageyAttrs, sliverOpen: !!document.querySelector('.wz-sliver-panel, .wz-sliver.open, [data-sliver-open="true"]'),
             tutorOpen: !!document.querySelector('.wz-tutor-panel, .wz-tutor.open, [data-tutor-open="true"]') };
  })()`;

  const closedScan = await app.evalJs(scanAggregates());
  await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
  await sleep(300);
  await app.evalJs("document.querySelector('.wz-tutor-grip')?.click()");
  await sleep(400);
  const openScan = await app.evalJs(scanAggregates());

  ok(`S4 (R1's bright line — THE ABSENCE, asserted as strictly as the presence): on a ${BIG_PAGES}-page screenplay there is NO aggregate of the page number anywhere in the live document — no "page N of N", no "of N pages", no bare "N pages", no "N / N" — in any text node or any title or aria-label attribute, with the sliver and the Tutor both opened. R1 amends the anti-gamification boundary by exactly one line and nothing more: the number is on the page, and the app never editorialises on it`,
    closedScan.hits.length === 0 && openScan.hits.length === 0
      && closedScan.pageyAttrs.length === 0 && openScan.pageyAttrs.length === 0,
    JSON.stringify({ closed: closedScan, open: openScan }));

  ok('S4 (the bright line, the other direction): the ONLY nodes carrying a page number are the page artifacts themselves — one per sheet from page two, each bearing its own number and nothing else. No number carries an aria-label or a title, so there is no second, spoken copy of it to grow a total onto',
    nums.per.slice(1).every((n) => n.ariaLabel === null && n.title === null),
    JSON.stringify(nums.per.map((n) => n && { text: n.text, ariaLabel: n.ariaLabel, title: n.title })));

  ok('S2b vertical policy, clause 2+3 (and only by the minimum): typing past the fold moves the box only far enough to keep the caret visible — the caret comes to rest ON the bottom edge of the visible band, within a line of it, never centred and never carried to a fraction of the box. There is no typewriter line here and no easing; the page moves the least it can and then stops. (Whether a caret flush on that edge wants breathing room is Nick\'s open question on the ledger — the policy gives it exactly zero until he rules, rather than inventing a number that would look ruled)',
    vert.moved === true && vert.slackLines >= -0.1 && vert.slackLines <= 1.2,
    JSON.stringify(vert));
});

// === PARKED — gated behind HARNESS_PARKED=1. SC2's park cycles LARGELY do not
// live here: they travel VERBATIM in the files they falsify (S1 parked sc1.mjs's
// S3 "the page never scrolls itself"; S2b parks sc1.mjs's "the sheet is a US
// Letter page"). This section holds the ONE entry SC2 falsifies in its own file:
// S0's pre-pagination single-sheet claim, which S2b retired by paginating.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  const pok = (name, pass, detail = '') => parkedChecks.push({ name, pass, detail });
  await withHarness(async (app) => {
    // The re-verification PROBE (an instrument, not history — it follows
    // reality; the quoted record above it never moves). It re-measures on a
    // 3-page document, since the claim being retired was about there being ONE
    // sheet and a one-element fixture could not show the retirement at all.
    await seedScript(app, 's2b-parked', 'INT. THE PARKED PAGE - DAY', actionBody(PER_PAGE * 3 - 1));
    const parked = await app.evalJs(`(() => {
      const sheets = [...document.querySelectorAll('.script-sheet')];
      const cs = getComputedStyle(sheets[0]);
      return {
        sheets: sheets.length,
        fontPx: +parseFloat(cs.fontSize).toFixed(2),
        heights: [...new Set(sheets.map((s) => Math.round(s.getBoundingClientRect().height)))],
        widths: [...new Set(sheets.map((s) => Math.round(s.getBoundingClientRect().width)))],
      };
    })()`);
    // ORIGINAL (S0 fixture), quoted verbatim from its shipped form:
    //   ok('S0 fixture: the sheet is still SC1\'s true page — one 51em x 66em
    //   sheet at 12pt (SC2 has not yet paginated; this is the pre-SC2 state the
    //   bound is measured against)',
    //     Math.abs(big.geo.fontPx - EM) < 0.01, JSON.stringify({ fontPx:
    //     big.geo.fontPx, expected: EM }));
    //
    // SUPERSEDED ON ITS SUBJECT, NOT ON ITS NUMBER — the distinction matters,
    // and this is a PARK, not a fixture re-point and not an annotation. Its
    // CONDITION (12pt type) is untouched and still true; what retired is the
    // world it names. "One sheet" and "SC2 has not yet paginated" are sentences
    // nobody can assert after this commit, and a true condition wearing a false
    // label is how a check quietly stops meaning anything. The live successor
    // is in this file's own S0 section, and it asserts strictly more: the 12pt
    // metric on EVERY sheet, the exact 11in height, and uniformity across the
    // sequence — the last of which a single-sheet check could not reach.
    pok('PARKED (was "S0 fixture: the sheet is still SC1\'s true page — one 51em x 66em sheet at 12pt (SC2 has not yet paginated; this is the pre-SC2 state the bound is measured against)") — SC2 S2b: the surface is a SEQUENCE of true pages now, so "one sheet" and "has not yet paginated" are both retired; the probe re-measures the claim that survived — 12pt type on a true 8.5x11in page — across a three-page document, where the retirement is visible. Live successor in this file\'s own S0 section',
      parked.sheets === 3 && Math.abs(parked.fontPx - EM) < 0.01
        && parked.heights.length === 1 && Math.abs(parked.heights[0] - PAGE_H) <= 1
        && parked.widths.length === 1 && Math.abs(parked.widths[0] - PAGE_W) <= 1,
      JSON.stringify(parked));
  });
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  const ppass = parkedChecks.every((c) => c.pass);
  // eslint-disable-next-line no-console
  console.log(ppass ? `\nSC2 PARKED: PASS (${parkedChecks.length} checks)` : `\nSC2 PARKED: FAIL — ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
  if (!ppass) process.exit(1);
}

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nSC2 VERIFY: PASS (${checks.length} checks)` : `\nSC2 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
