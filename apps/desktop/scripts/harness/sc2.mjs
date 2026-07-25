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
// Five pages puts the denominator near 2ms, clear of the floor, and the ratio's
// spread falls from 3.3x to about 1.4x (1.84-2.63 over four runs). Stated
// precisely because an earlier draft of this very comment claimed "+/-10%" on
// three runs and the fourth run broke it: 1.4x is the honest figure, and a 2x
// secondary gate has real but NOT generous margin against it. If the tip's
// ratio ever lands between 1x and 2x of baseline, that is inside the noise and
// must be re-run rather than read — the gate catches a doubling, not a drift.
// Raising n from 49 to 240 was necessary and did tighten the absolute; it could
// not fix the ratio, because the ratio's problem was never the sample size — it
// was the denominator.
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

// Scene shape below is calibrated, not guessed: measured at 5.94 pages per 10
// scenes at the 1280px reference, so 116 scenes renders ~20 pages. The fixture
// ASSERTS the page count it got rather than trusting this constant — a fixture
// that silently drifts to three pages would make the whole bound a lie.
const SCENES_20_PAGES = 116;
const SCENES_CONTROL = 29;   // ~5 pages — see the control note below

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

await withHarness(async (app) => {
  // 240 keystrokes, not 49. At n=49 the 95th percentile IS the second-worst
  // sample, so a single GC pause owns it; 240 puts a dozen samples above the
  // p95 line and makes the figure a property of the architecture rather than of
  // one unlucky frame.
  const TYPED = 'the quick brown fox jumps over the lazy dog again and again '.repeat(4).slice(0, 240);

  // -- S0 baseline: the 20-page document ----------------------------------
  const big = await measure(app, SCENES_20_PAGES, TYPED);

  // THE CORRECTNESS GATE, asserted BEFORE any timing claim is made.
  ok('S0 gate: the caret was genuinely in the script element when the keys were sent (a contenteditable that is not focused sends every keystroke to <body>, where the timings still look plausible)',
    big.gate.focused === true, JSON.stringify(big.gate));
  ok(`S0 gate: every keystroke LANDED in the document — ${TYPED.length} sent, the element's own text grew by the same amount (the measured work actually occurred)`,
    big.gate.landed === big.gate.expected, JSON.stringify(big.gate));
  ok('S0 gate: the input event fired once per keystroke — the React work was genuinely sampled, not inferred',
    big.input !== null && big.input.n >= TYPED.length - 2, JSON.stringify({ samples: big.input && big.input.n, typed: TYPED.length }));

  // THE FIXTURE IS THE SIZE IT CLAIMS. A fixture that quietly drifted to three
  // pages would leave the bound anchored to nothing.
  ok(`S0 fixture: the baseline document is genuinely ~20 pages — ${big.geo.pages} pages, ${big.geo.els} elements, ${big.geo.lines} lines at ${BODY_LINES_PER_PAGE} body lines/page`,
    big.geo.pages >= 18 && big.geo.pages <= 22, JSON.stringify(big.geo));
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
  const small = await measure(app, SCENES_CONTROL, TYPED);

  ok('S0 control gate: the control run\'s keystrokes landed too — the ratio is only meaningful if BOTH of its terms were really measured',
    small.gate.focused === true && small.gate.landed === small.gate.expected, JSON.stringify(small.gate));
  ok(`S0 control: the control document is ~5 pages — ${small.geo.pages} pages, ${small.geo.els} elements`,
    small.geo.pages >= 4 && small.geo.pages <= 6, JSON.stringify(small.geo));

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
    `\n  samples: ${big.input.n} keystrokes per document (n>=200, so the p95 is not one GC pause)` +
    '\n  HOW TO JUDGE THE TIP: check out THIS COMMIT on the judging machine and' +
    '\n  measure; measure the tip in the SAME session, interleaved rather than' +
    '\n  back to back; the tip\'s 20-page p95 must be <= 2x the baseline p95 THAT' +
    '\n  MACHINE just re-derived. Secondary gate, no checkout needed: the tip\'s' +
    `\n  scaling ratio must be <= 2x ${ratio}. Both hold, every run — the absolute` +
    '\n  catches "typing got slower generally", the ratio catches "cost now scales' +
    '\n  with document length", and a change can regress either one alone.');

  ok(`S0 baseline recorded: 20-page p95 = ${big.input.p95}ms, 5-page control p95 = ${small.input.p95}ms, scaling ratio = ${ratio} — the reference observation Amendment 1's 2x bound will be measured against, in the same run on the same machine`,
    big.input.p95 > 0 && small.input.p95 > 0 && ratio !== null,
    JSON.stringify({ big: big.input, small: small.input, ratio }));
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
  console.log('\nSC2 PARKED: PASS (0 checks) — HARNESS_PARKED=1 armed; the baseline-fixture commit is purely additive and falsifies nothing. SC2\'s park cycles land with S2 (the sheet sequence), in the files they falsify — sc1.mjs\'s single-sheet height assertion first among them.');
}

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nSC2 VERIFY: PASS (${checks.length} checks)` : `\nSC2 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
