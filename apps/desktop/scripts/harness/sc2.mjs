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
// baseline p95, same machine, same run — because an absolute millisecond
// threshold is a false gate on a harness that runs on varied hardware. A bound
// like that is only honest if the baseline is re-measurable at any time on any
// machine; a number measured once in a discarded scratchpad scenario cannot
// anchor it. So the scenario lives here.
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
// One page of body = 66 - 6 - 6 = 54em = 54 LINES at 6 lpi.
const EM = 16;
const PAGE_H_EM = 66;
const BODY_LINES_PER_PAGE = 54;

// Scene shape below is calibrated, not guessed: measured at 5.94 pages per 10
// scenes at the 1280px reference, so 116 scenes renders ~20 pages. The fixture
// ASSERTS the page count it got rather than trusting this constant — a fixture
// that silently drifts to three pages would make the whole bound a lie.
const SCENES_20_PAGES = 116;
const SCENES_CONTROL = 5;

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
    const fs = parseFloat(getComputedStyle(sheet).fontSize);
    const h = sheet.getBoundingClientRect().height;
    return { els: document.querySelectorAll('.script-el, .script-el-active').length,
             fontPx: +fs.toFixed(2), heightPx: +h.toFixed(1),
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
  const TYPED = 'the quick brown fox jumps over the lazy dog again';

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

  // -- S0 control: the same measurement on a ~1-page document -------------
  // The control exists so the bound survives a change of machine. An absolute
  // millisecond figure cannot be compared across hardware; the RATIO of the
  // 20-page cost to the 1-page cost is a property of the architecture rather
  // than of the CPU, and it is the ratio that a regression would move.
  const small = await measure(app, SCENES_CONTROL, TYPED);

  ok('S0 control gate: the control run\'s keystrokes landed too — the ratio is only meaningful if BOTH of its terms were really measured',
    small.gate.focused === true && small.gate.landed === small.gate.expected, JSON.stringify(small.gate));
  ok(`S0 control: the control document is ~1 page — ${small.geo.pages} pages, ${small.geo.els} elements`,
    small.geo.pages >= 0.9 && small.geo.pages <= 1.5, JSON.stringify(small.geo));

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
    `\n  scaling ratio (20pp p95 / 1pp p95) = ${ratio}` +
    '\n  Amendment 1\'s bound applies to SC2\'s own figure, measured in a later commit' +
    '\n  IN THIS SAME RUN against these numbers: post-SC2 20-page p95 <= 2x the' +
    '\n  20-page p95 above. Recorded, never asserted as an absolute ceiling.');

  ok(`S0 baseline recorded: 20-page p95 = ${big.input.p95}ms, 1-page p95 = ${small.input.p95}ms, scaling ratio = ${ratio} — the reference observation Amendment 1's 2x bound will be measured against, in the same run on the same machine`,
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
