// RHIZOME-LATENCY (cursor/rhizome-sprout @ 0d00e2ce, Nick: the tip is FINAL). The goal flash puts a drop-shadow filter on the FULL rhizome field
// (an SVG as large as the stage, behind the page): `.wz-rhizome-field[data-flash='true']{ filter:drop-shadow(...); animation:wz-rhizome-pop }`. A filter on a stage-sized layer
// is the kind of thing that can cost every frame - including the frame that shows the writer's keystroke. This file holds that shut: typing across a goal crossing stays as fast as typing
// before it.
//
//   PART 1 (browserless)  source pins: the drop-shadow lives ONLY in the flash-true rule and its pop keyframes (never on the field at rest, never in the fading hold, never on the
//                         seed root); the flash is a transform-free, layout-free effect (filter + opacity + stroke only); FULL_COVER is gone from the growth module.
//                         One mutant, landing asserted: a drop-shadow on the field AT REST turns the pin red.
//   PART 2 (a box turn)   the real app, real keys, one character every ~90 ms, the latency of each key read IN the page (keydown -> the frame after the one that painted its input (hooked on `beforeinput`: this editor never fires `input` on a key)):
//                         A) before the goal (the field at rest), B) while the flash is HOLDING (data-flash='true', drop-shadow applied, pop animation running), C) during the fade.
//                         The flash samples are only counted when the flash was on at the frame - a flash that was over before the keys landed does not certify anything.
//                         The budgets (Fable's final, ledger 120 ruling) are RELATIVE to this machine's own rest numbers (a drop-shadow cost is a difference, not an absolute), over AT LEAST 40
//                         painted keys per phase (the crossing is repeated in rounds until each phase has them): median within 5 ms and p95 within 25 ms of rest, and no key slower than 100 ms.
//                         Every slow fade key is logged against the fade's start: Fable's suspect is the full-field drop-shadow FILTER being dropped at the instant the fade begins (one big repaint).
//
//   STABLE VERDICT (ticket 150, FIX, Nov 2). The budgets above are unchanged; what they are held AGAINST is. The old rest baseline was ONE block of keys typed at a fixed 90 ms cadence on a fresh page
//   (goal 1000, the sprout). On 12 runs of main its median wandered 19.1-24.3 ms while the flash and fade medians stayed at 24.4-26.1 (sd ~0.5): a key's latency is keydown -> the 2nd frame after it
//   (17-33 ms by where the key falls in the 60 Hz frame), a fixed cadence phase-locks to the frame clock, and a fresh page is not the page the flash is on - so the old median was a draw, not a cost.
//   Three of the 12 failed: two median misses (5.4 and 6.3 ms over), one box stall (rest max 67 ms, fade max 129 ms). Now:
//     (1) the baseline is the CONTROL BURSTS of every round, typed on the very page that is about to cross (7 words, goal 8, the sprout) seconds before the 8th word - the same page, the same state,
//         the same minutes as the flash it is held against - pooled over the rounds: PRE_KEYS at the hold's own pace (what B is held against) and FAST_KEYS at the fade's own pace, 25 ms apart (what C is
//         held against: keys that fast queue behind each other, which costs a median ~1.8 ms over the slow pace and is not the flash's). (The A block above stays as the "no filter at rest" premise and for
//         the record.) A burst typed AFTER the fade was tried and is NOT comparable: the finished plant paints a key in one frame (median ~11 ms), which says nothing about the flash.
//     (2) rest and flash keys are JITTERED (a seeded generator: the same gaps every run, but no cadence for the frames to lock to). The fade keys stay at their fixed fast gap: that phase is "as fast as
//         the box takes them", and jittering it makes keys pile up behind each other (queueing, not paint) - measured.
//     (3) a measurement whose own control caught a box stall (a control key over REST_NOISE_MS; normal is <= ~35) says nothing about the flash and is void: taken again. And a RED must be
//         reproduced: a failing measurement is measured again, and the guard fails when two measurements fail (a third settles a split) - a regression on the keystroke path shows in every one
//         (both mutants below do), a one-off the box threw at the fade (1 of 24 runs: a fade median 6.8 ms over its control, the controls and the hold clean) does not. All logged.
//   150b - THE FINER MEASURE: B and C read the frame clock, which hides a per-key main-thread cost under about a frame (below). B2 and C2 read the cost itself: per key, BUSY = keydown -> the end of the
//   task that handled it (a message posted at keydown runs when that task and its React flush are done) plus FRAME = the first rAF after its input -> the end of that frame's rendering (a message posted
//   from the rAF runs after style/layout/paint). Median within +4 ms of the control (no p95: see COST_MEDIAN_SLACK): the flash against the slow control, the fade against the fast one.
//   The mutants: RL_MUTANT_MS=<n> adds n ms of main-thread cost to every key while the flash is holding or fading; RL_MUTANT_STALL_MS=<n> adds one n ms stall at the first key of every fade (the filter
//   drop's suspect). rhizome-latency-mutant.mjs runs both and requires red. MEASURED, and worth knowing: this metric (keydown -> the 2nd frame) HIDES a per-key cost smaller than about a frame - the
//   key still makes the frame it was going to make. 10 and 20 ms per key leave the medians where they were (20: flash 27.2 vs rest 26.9); 40 ms puts every key at ~43 ms (median +18). That was true of
//   the old verdict too; it is what the guard reads, not something the stabilising changed.
//   COARSE C, STABILISED (Nov 6): C and C2 are judged against the fade's REFERENCE SHIFT - the main control's own, of the same turn (RL_REF, from scripts/rhizome-latency-ref.mjs; a default when none) -
//   not against +5/+4 over the fast control (the fade sits ~9 ms / ~2.8 ms behind it on this box on every tree tried; see the REF block). A stalled FAST control now voids a measurement as the slow one does.
//   Still red: the 150 ms stall (the 100 ms ceiling), a per-key cost on the fade (M4: +10 ms per fade key; C2 and, when the frame clock shows it, C).
//
// Run: node scripts/harness/rhizome-latency.mjs   (from apps/desktop; PART 2 needs a box turn)      BROWSERLESS_ONLY=1 runs PART 1 alone
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { srcText } from '../global-css.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(here, '..', '..', 'src');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const noCR = (t) => t.replace(/\r\n?/g, '\n');
const read = (rel) => noCR(srcText(SRC, rel));
const sleepMs = (ms) => new Promise((r) => setTimeout(r, ms));
// a seeded generator (mulberry32): the gaps between keys vary, but the same way every run
const rng = (seed) => () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const MUTANT_MS = Number(process.env.RL_MUTANT_MS || 0);   // the injected regressions (0 = none): a cost on every flash/fade key,
const MUTANT_STALL_MS = Number(process.env.RL_MUTANT_STALL_MS || 0);   // and one stall at the first key of every fade
const MUTANT_FADE_MS = Number(process.env.RL_MUTANT_FADE_MS || 0);   // and (coarse-C stabilising, Nov 5) a MODERATE cost on the fade's keys alone - the case the 100 ms ceiling cannot see
// THE FADE'S REFERENCE SHIFT (coarse-C stabilising, Nov 5/6, Fable: "judge C against the same-turn main control, not the fixed +5 slack"). The fade is NOT free on this box: its keys land a median
// ~9 ms (4.8..11.2) behind the fast control's, p95 ~17.5 (11.5..27.5) and its main-thread cost ~2.8 ms (1.4..5.6) above it - the same on 8aae0c76, 6ea4007f and 8d56e13e (20 runs, three trees,
// interleaved: a box state, not a commit; the first 29 runs of ticket 150 had it at -1.6..+1.8). A budget of +5 over the control sat INSIDE that, so C and C2 flapped. They are now held to the
// MAIN CONTROL'S OWN SHIFT of the same turn plus the same slack as before: RL_REF='{"c":<median shift>,"p95":<p95 shift>,"c2":<cost shift>}', made by `node scripts/rhizome-latency-ref.mjs <main control logs>`
// (the medians of those runs' shifts). With no RL_REF the defaults below (the 20-run medians above) stand, and the check says so.
const REF_DEFAULT = { c: 9, p95: 17.5, c2: 2.8 };
const REF_FROM_ENV = (() => { try { const j = process.env.RL_REF ? JSON.parse(process.env.RL_REF) : null; return j && [j.c, j.p95, j.c2].every((x) => Number.isFinite(x)) ? j : null; } catch { return null; } })();
const REF = REF_FROM_ENV || REF_DEFAULT;
const REF_SRC = REF_FROM_ENV ? 'the same turn\'s main control (RL_REF)' : 'the default (the Nov 6 20-run medians; no RL_REF given)';

// ---- PART 1 ----------------------------------------------------------------------------------------------------------------------------------------------------------------
const css = read('index.css');
const growth = read('store/rhizomeGrowth.ts');
// every line of CSS that names a drop-shadow, with the rule it sits in (the selector text before its `{`, or the keyframes name)
function shadowSites(text) {
  const out = [];
  const lines = text.split('\n');
  let inPop = false;
  lines.forEach((ln, i) => {
    if (/@keyframes wz-rhizome-pop/.test(ln)) inPop = true;
    if (/drop-shadow/.test(ln)) {
      const sel = ln.includes('{') ? ln.slice(0, ln.indexOf('{')).trim() : '';
      if (inPop || /wz-rhizome/.test(sel)) out.push({ line: i + 1, sel, inPop });   // the rhizome's own rules only (the logo and others carry shadows of their own)
    }
    if (inPop && /^\}/.test(ln.trim())) inPop = false;
  });
  return out;
}
const allowed = (s) => s.inPop || /^\.wz-rhizome-field\[data-flash='true'\]$/.test(s.sel);
const pins = (cssText) => {
  const sites = shadowSites(cssText);
  return {
    onlyInFlashTrue: sites.length > 0 && sites.every(allowed),
    flashRuleHasIt: /\.wz-rhizome-field\[data-flash='true'\]\{ filter:drop-shadow\(0 0 3px var\(--brass\)\); animation:wz-rhizome-pop 420ms ease-out; \}/.test(cssText),
    noTransformOrLayout: !/\.wz-rhizome-field\[data-flash[^\]]*\]\s*\{[^}]*(transform|width|height|top|left|margin|padding)\s*:/.test(cssText.replace(/stroke-width/g, 'stroke-w')),
    reducedMotionDropsPop: /\.wz-rhizome-field\[data-flash='true'\]\{ animation:none; \}/.test(cssText),
  };
};
const now = pins(css);
ok('P1 the drop-shadow lives ONLY in the flash-true rule and the pop keyframes - never on the field at rest, in the fading hold, or on the seed root', now.onlyInFlashTrue, JSON.stringify(shadowSites(css)));
ok('P2 the flash rule is the one that carries it (filter, then the 420 ms pop), and under prefers-reduced-motion the pop is off', now.flashRuleHasIt && now.reducedMotionDropsPop, JSON.stringify(now));
ok('P3 the flash states change no geometry (no transform, size, position or margin on the field in any flash state) - only filter, opacity and stroke', now.noTransformOrLayout, '');
const mutCss = css + "\n.wz-rhizome-field{ filter:drop-shadow(0 0 3px var(--brass)); }\n";
ok('P4 (mutant, landed) a drop-shadow on the field AT REST turns P1 red', mutCss !== css && pins(mutCss).onlyInFlashTrue === false, JSON.stringify(shadowSites(mutCss).slice(-1)));
ok('P5 FULL_COVER is gone from the growth module (it was kept "for the old fill-the-ground target" and nothing reads it)', !/FULL_COVER/.test(growth), '');

// ---- PART 2 ----------------------------------------------------------------------------------------------------------------------------------------------------------------
async function part2() {
  const { withHarness } = await import('../runtime-verify.mjs');
  await withHarness(async (app) => {
    const sleep = sleepMs;
    const waitSoft = async (expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
    const fresh = async () => {
      await app.goto('/');
      await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4');");
      await app.reload();
      await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
      await app.emulateDpr(1, 1400, 900);
    };
    const openPage = async () => {
      await fresh();
      await app.goto('/project/new');
      await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker' });
      await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
      await app.click('Start writing');
      await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted' });
      const pageId = (await app.evalJs('location.hash')).replace(/^#\/page\//, '');
      await app.evalJs("localStorage.setItem('wrizo-writing-settings', JSON.stringify({ ...JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'), progress: 'words', progressStyle: 'rhizome' }))");
      await app.reload();
      await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(pageId)}`);
      await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'rhizome page reopened' });
      await sleep(300);
      return pageId;
    };
    const seedAndReopen = async (pageId, words, goal) => {
      await app.goto('/');
      await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before seed' });
      await app.evalJs(`(() => { window.wrizoSetWritingGoal(${JSON.stringify(goal)}); window.wrizoPatchEntry(${JSON.stringify(pageId)}, { text: Array.from({ length: ${words} }, (_, i) => 'word' + i).join(' ') }); })()`);
      await app.reload();
      await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(pageId)}`);
      await app.waitFor("!!document.querySelector('.wz-rhizome-field')", { label: 'rhizome field after seed' });
      await sleep(800);
      await app.evalJs("document.querySelector('.forward-only-editor').focus()");
    };
    // the in-page meter: a key's latency is keydown -> the SECOND animation frame after its input. The editor handles insertion at `beforeinput` and never fires `input` on a key (measured
    // on the box, ledger 120: keydown 24, beforeinput 24, input 0), so the hook is `beforeinput`: the DOM changes in that same task, the first frame after it paints it, the second starts after.
    // Every sample also carries WHEN it was taken, and the flash's own phase changes are timestamped, so a slow frame can be placed against the fade's start and end.
    const arm = () => app.evalJs(`(() => {
      window.__lat = []; window.__fl = []; let t0 = 0, last = null;
      if (window.__latOff) window.__latOff();
      const note = () => { const f = document.querySelector('.wz-rhizome-field'); const v = f ? f.dataset.flash : null; if (v !== last) { last = v; window.__fl.push([performance.now(), v]); } };
      note();
      if (window.__flObs) window.__flObs.disconnect();
      window.__flObs = new MutationObserver(note);
      window.__flObs.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-flash'] });
      let cur = null;
      // THE FINE METER (ticket 150b). The latency above is quantised by the frame clock and HIDES a main-thread cost under about a frame. These two are not: BUSY = keydown -> the end of the task that
      // handled it (a message posted at keydown runs only when the keydown/beforeinput/input task, and the React render it flushes, are done), and FRAME = from the start of the first rAF after the
      // key's input to the end of that frame's rendering (a message posted from the rAF callback runs after style, layout and paint of that frame). Both are main-thread milliseconds the key cost.
      const kd = () => { t0 = performance.now(); const k = { busy: null, frame: null }; cur = k; const s0 = t0; const mc = new MessageChannel(); mc.port1.onmessage = () => { k.busy = performance.now() - s0; mc.port1.close(); }; mc.port2.postMessage(0); };
      window.__stalled = false;
      const spin = () => { const f = document.querySelector('.wz-rhizome-field'); const v = f ? f.dataset.flash : null; let m = 0;
        if ((v === 'true' || v === 'fading') && window.__rlMutantMs) m = window.__rlMutantMs;
        if (v === 'fading' && window.__rlMutantFade) m = Math.max(m, window.__rlMutantFade);   // RL_MUTANT_FADE_MS: a cost on the FADE's keys alone (not the hold's)
        if (v === 'fading' && window.__rlMutantStall && !window.__stalled) { window.__stalled = true; m = Math.max(m, window.__rlMutantStall); }
        if (!m) return; const e = performance.now() + m; while (performance.now() < e) { /* the injected cost */ } };
      const bi = () => { const t = t0, k = cur; requestAnimationFrame(() => {
        const r = performance.now(); const mc = new MessageChannel(); mc.port1.onmessage = () => { if (k) k.frame = performance.now() - r; mc.port1.close(); }; mc.port2.postMessage(0);
        requestAnimationFrame(() => { const f = document.querySelector('.wz-rhizome-field'); const now = performance.now(); window.__lat.push({ ms: now - t, k, flash: f ? f.dataset.flash : null, key: t, at: now }); }); }); };
      // a sample's value by name, read when the round is READ (every message has run by then): ms, busy, frame, or cost = busy + frame (null while either is unanswered)
      window.__val = (x, f) => (f === 'busy' || f === 'frame') ? (x.k ? x.k[f] : null) : f === 'cost' ? ((x.k && x.k.busy != null && x.k.frame != null) ? x.k.busy + x.k.frame : null) : x[f];
      document.addEventListener('keydown', kd, true); document.addEventListener('beforeinput', spin, true); document.addEventListener('beforeinput', bi, true);
      window.__latOff = () => { document.removeEventListener('keydown', kd, true); document.removeEventListener('beforeinput', spin, true); document.removeEventListener('beforeinput', bi, true); };
      window.__rlMutantMs = ${MUTANT_MS}; window.__rlMutantStall = ${MUTANT_STALL_MS}; window.__rlMutantFade = ${MUTANT_FADE_MS};
      return true; })()`);
    const jit = rng(0x7A11);
    const typeSteady = async (n, gap = 90, jitter = true) => { for (let i = 0; i < n; i += 1) { await app.typeKeys('a'); await sleep(jitter ? Math.round(gap * (0.7 + 0.6 * jit())) : gap); } };   // jittered: gap +-30%, seeded
    const lat = (flash, field = 'ms') => app.evalJs(`window.__lat.filter((x) => ${flash === 'any' ? 'true' : `x.flash === ${JSON.stringify(flash)}`}).map((x) => window.__val(x, ${JSON.stringify(field)}))`);
    const stat = (xs) => { const s = (xs || []).slice().sort((a, b) => a - b); const q = (p) => (s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null); return { n: s.length, median: q(0.5), p95: q(0.95), max: s.length ? s[s.length - 1] : null }; };
    const r1 = (x) => (x === null ? null : Math.round(x * 10) / 10);
    const show = (st) => JSON.stringify({ n: st.n, median: r1(st.median), p95: r1(st.p95), max: r1(st.max) });
    const stored = (id) => app.evalJs(`(JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((e) => e.id === ${JSON.stringify(id)}) || {}).text ?? ''`);

    const pageId = await openPage();
    // Fable's final budgets (ledger 120 ruling, Oct 21): AT LEAST 40 keys per phase (a percentile over a dozen is just the worst key), and against this machine's own rest numbers:
    // median within 5 ms, p95 within 25 ms of the rest p95, and no key over 100 ms.
    const MIN_KEYS = 40, MEDIAN_SLACK = 5, P95_SLACK = 25, MAX_MS = 100;
    // A) REST: a goal far away, the field drawn, nothing flashing
    await seedAndReopen(pageId, 7, { n: 1000, unit: 'words' });
    await arm();
    await typeSteady(MIN_KEYS + 4);
    const restA = await lat('false');
    const restASt = stat(restA);
    ok(`A the rest numbers: ${MIN_KEYS}+ keys with the field at rest are measured (the first block of the baseline every flash number is held against; the control bursts around each crossing join it, below)`, restASt.n >= MIN_KEYS, show(restASt));
    const restFilter = await app.evalJs("getComputedStyle(document.querySelector('.wz-rhizome-field')).filter");
    ok('A at rest the field carries NO filter (the drop-shadow is the flash\'s alone)', restFilter === 'none', String(restFilter));

    // B + C) the crossing, in ROUNDS: the 8th word lands, the flash HOLDS (about 1.2 s) and then the finished plant FADES (2.2 s). One crossing gives a dozen keys per phase at best, so the
    // crossing is repeated (the page is re-seeded to 7 words each time) until each phase has MIN_KEYS painted samples - and the CONTROL burst (PRE_KEYS keys on the same page, seconds before the 8th
    // word) has too. A key only counts for the phase its frame was painted in (the flash attribute is read at the frame), so a flash that was over before a key landed certifies nothing. Every round
    // types HOLD_KEYS inside the hold, then FADE_KEYS as fast as the box takes them.
    // THE FINER BUDGET (ticket 150b): the main-thread cost of a key (busy + frame, ms), the flash against the control at its pace, the fade against the fast control. Measured on main
    // (29 runs): the cost's median is ~14-15 ms and a run's flash/fade median differs from its control's by -1.6..+1.8 ms (sd 0.7: +4 is ~6 sd). A per-key cost of 10 ms adds +6.5..+14 to the medians,
    // 15 ms adds +15..+20, 20 ms the same. The MEDIAN is the budget: the cost's p95 is a tail of a bimodal number (sd 3.5-5 ms between runs, -14..+6.5 against the control) and a p95 budget tight enough to
    // mean something flaked the first measurement in 5 of 24 runs, so there is none here - a regression that only some keys carry is B's and C's (their p95 and 100 ms ceiling, on the frame clock).
    // (The frame clock's quantisation, which hid 10-20 ms from B and C above, is not in this number.)
    const COST_MEDIAN_SLACK = 4;
    const HOLD_KEYS = 14, FADE_KEYS = 22, PRE_KEYS = 16, FAST_KEYS = 22, MAX_ROUNDS = 10, MAX_MEASURES = 4, REST_NOISE_MS = 50;
    // The floor is MIN_KEYS (Fable's ruling); the rounds run on to TARGET_KEYS in every set. A median of 40-odd keys that queue behind one another (the fade's are typed 25 ms apart) has a spread of ~1.5 ms
    // - measured over 20 runs - against a 5 ms budget; at 80+ it is ~1.1 ms, and the budget is not near it.
    const TARGET_KEYS = 80;
    const measure = async () => {
      const M = { holdAll: [], fadeAll: [], slowAll: [], rounds: [], restPre: [], restFast: [], fine: { hold: { cost: [] }, fade: { cost: [] }, pre: { cost: [] }, fast: { cost: [] } }, flashPremise: true, filterPremise: true, savedAll: true, lastSaved: '' };
      for (let round = 1; round <= MAX_ROUNDS && (M.holdAll.length < TARGET_KEYS || M.fadeAll.length < TARGET_KEYS || M.restPre.length < TARGET_KEYS || M.restFast.length < TARGET_KEYS); round += 1) {
        // the control for the fade: a round of its own - the same page state (7 words, goal 8, the sprout, freshly opened) and the same fast, fixed gap, no crossing. It is NOT typed inside the crossing
        // round: measured, a fast burst earlier in that round leaves the hold's keys a slow tail (p95 60-90 ms) that has nothing to do with the flash.
        await seedAndReopen(pageId, 7, { n: 8, unit: 'words' });
        await arm();
        await typeSteady(FAST_KEYS, 25, false);
        await sleep(200);
        M.restFast.push(...await lat('false'));
        M.fine.fast.cost.push(...(await lat('false', 'cost')).filter((v) => v !== null));
        await seedAndReopen(pageId, 7, { n: 8, unit: 'words' });
        await arm();
        await typeSteady(PRE_KEYS);   // the control for the hold: its pace, seconds before the 8th word
        const tailAt = await app.evalJs('performance.now()');
        await app.typeKeys(' tail');
        const flashOn = await waitSoft("document.querySelector('.wz-rhizome-field')?.dataset.flash === 'true'", { label: 'brass flash on goal', timeout: 4000 });
        // THE FLASH PREMISE (the guard must be measuring a flash that is really on). On main: the full-field drop-shadow filter on `.wz-rhizome-field`. Under Arbor's vines (?arbor2=1, r20 and on) the field takes NO filter
        // while it flashes; the flash is a brass copy of the vines on its own composited layer (`svg.arbor2-vines-flash`: opacity only, will-change:opacity, the `arbor2-flash-up` animation) - so there the premise is that layer
        // holding, in its animation. The branch is chosen by what the page IS (the root's data-arbor2 and the field's data-vines), never by a flag this file was handed.
        // SUPERSEDED (Nov 2026, Fable): the single premise below required a drop-shadow on the field, which an Arbor page can never show. Kept verbatim:
        // const flashFilter = flashOn ? await app.evalJs("getComputedStyle(document.querySelector('.wz-rhizome-field')).filter") : null;
        // if (!(flashOn && /drop-shadow/.test(String(flashFilter)))) { M.flashPremise = false; M.filterPremise = false; M.rounds.push({ round, flashOn, flashFilter }); break; }
        const flashLive = flashOn ? await app.evalJs(`(() => { const f = document.querySelector('.wz-rhizome-field'); const filter = getComputedStyle(f).filter;
          if (!(document.documentElement.hasAttribute('data-arbor2') && f.dataset.vines === 'true')) return { kind: 'field-filter', filter, ok: /drop-shadow/.test(filter) };
          const l = document.querySelector('.arbor2-vines-flash'); const cs = l ? getComputedStyle(l) : null;
          return { kind: 'arbor-layer', filter, layer: !!l, layerFlash: l ? l.dataset.flash : null, animation: cs ? cs.animationName : null, willChange: cs ? cs.willChange : null,
            ok: !!l && l.dataset.flash === 'true' && /arbor2-flash-up/.test(cs.animationName) && /opacity/.test(cs.willChange) }; })()`) : null;
        if (!(flashOn && flashLive && flashLive.ok)) { M.flashPremise = false; M.filterPremise = false; M.rounds.push({ round, flashOn, flashLive }); break; }
        await typeSteady(HOLD_KEYS, 85);
        await waitSoft("document.querySelector('.wz-rhizome-field')?.dataset.flash === 'fading'", { label: 'the fade begins', timeout: 3000 });
        await typeSteady(FADE_KEYS, 25, false);
        // wait for the page to settle (the fade's end), then read this round's samples out of the page
        await waitSoft("document.querySelector('.wz-rhizome-field')?.dataset.flash === 'false'", { label: 'the fade ends', timeout: 5000 });
        await sleep(200);   // the last key's second frame
        const h = await lat('true'), f = await lat('fading');
        M.holdAll.push(...h); M.fadeAll.push(...f);
        M.fine.hold.cost.push(...(await lat('true', 'cost')).filter((v) => v !== null));
        M.fine.fade.cost.push(...(await lat('fading', 'cost')).filter((v) => v !== null));
        M.fine.pre.cost.push(...(await app.evalJs(`window.__lat.filter((x) => x.key < ${tailAt} && x.flash === 'false').map((x) => window.__val(x, 'cost'))`)).filter((v) => v !== null));
        M.restPre.push(...await app.evalJs(`window.__lat.filter((x) => x.key < ${tailAt} && x.flash === 'false').map((x) => x.ms)`));
        // WHERE the slow frames fell: a fade key more than 20 ms over that round's fade median (or over 50 ms outright), with its offset from the moment the fade began and from the moment it ended
        const att = await app.evalJs(`(() => {
          const fl = window.__fl, tF = (fl.find((x) => x[1] === 'fading') || [null])[0], iT = fl.findIndex((x) => x[1] === 'true');
          const tE = iT >= 0 ? (fl.slice(iT).find((x) => x[1] === 'false') || [null])[0] : null;
          const f = window.__lat.filter((x) => x.flash === 'fading'); const ms = f.map((x) => x.ms).sort((a, b) => a - b); const med = ms.length ? ms[Math.floor(ms.length / 2)] : null;
          const slow = f.filter((x) => med !== null && (x.ms > med + 20 || x.ms > 50)).map((x) => ({ ms: Math.round(x.ms * 10) / 10, sinceFadeStart: tF === null ? null : Math.round(x.key - tF), beforeFadeEnd: tE === null ? null : Math.round(tE - x.at) }));
          const holdSlow = window.__lat.filter((x) => x.flash === 'true' && x.ms > 50).map((x) => ({ ms: Math.round(x.ms * 10) / 10, phase: 'hold' }));
          return { fadeMs: tF !== null && tE !== null ? Math.round(tE - tF) : null, median: med === null ? null : Math.round(med * 10) / 10, slow, holdSlow };
        })()`);
        for (const k of att.slow || []) M.slowAll.push({ round, ...k });
        M.rounds.push({ round, hold: h.length, fade: f.length, fadeMs: att.fadeMs, fadeMedian: att.median, holdSlow: att.holdSlow });
        // D, per round) nothing was lost: every key is in the stored page. Read AFTER the debounced save lands (wait on the STORED value, never on a flush call)
        const want = ' tail' + 'a'.repeat(HOLD_KEYS + FADE_KEYS);
        const saved = await waitSoft(`(((JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((e) => e.id === ${JSON.stringify(pageId)})) || {}).text || '').includes(${JSON.stringify(want)})`, { label: 'the typed text has been saved', timeout: 10000 });
        M.lastSaved = String(await stored(pageId)).slice(-60);
        if (!saved) M.savedAll = false;
      }
      return M;
    };
    // THE MEASUREMENTS. (a) one whose own slow control caught a box stall is VOID and taken again; (b) a RED must be reproduced: the first measurement passing is the verdict; one failing is
    // measured again, and the guard fails only when two measurements fail (a third settles a split). A regression on the keystroke path - the flash's cost, the fade's repaint - shows in every
    // measurement; a one-off the box threw at the fade (measured once in 24: a fade median 6.8 ms over its control with the controls and the hold clean) does not. Every measurement is logged.
    const judge = (m) => {
      const r = stat(m.restPre), f = stat(m.restFast), h = stat(m.holdAll), d = stat(m.fadeAll);
      const within = (x, rest, ref = { c: 0, p95: 0 }) => x.n >= MIN_KEYS && rest.n >= MIN_KEYS && x.median <= rest.median + ref.c + MEDIAN_SLACK && x.p95 <= rest.p95 + ref.p95 + P95_SLACK && x.max <= MAX_MS;
      const fc = (a) => stat(a || []);
      const fine = (x, rest, ref = 0) => x.n >= MIN_KEYS && rest.n >= MIN_KEYS && x.median <= rest.median + ref + COST_MEDIAN_SLACK;
      return { b: within(h, r), c: within(d, f, REF), b2: fine(fc(m.fine.hold.cost), fc(m.fine.pre.cost)), c2: fine(fc(m.fine.fade.cost), fc(m.fine.fast.cost), REF.c2), noisy: r.max > REST_NOISE_MS || f.max > REST_NOISE_MS,control: show(r), controlFast: show(f), flash: show(h), fade: show(d) };
    };
    const attempts = [];
    let M, passes = 0, fails = 0;
    for (let n = 1; n <= MAX_MEASURES; n += 1) {
      M = await measure();
      const j = judge(M);
      const good = j.b && j.c && j.b2 && j.c2 && M.flashPremise && M.savedAll;
      attempts.push({ n, void: j.noisy, ok: good, control: j.control, controlFast: j.controlFast, flash: j.flash, fade: j.fade });
      if (!M.flashPremise) break;
      if (j.noisy) continue;
      if (good) passes += 1; else fails += 1;
      if (passes >= 2 || fails >= 2 || (n === 1 && good)) break;
    }
    const { holdAll, fadeAll, slowAll, rounds, restPre, restFast, flashPremise, filterPremise, savedAll, lastSaved } = M;
    const holdSt = stat(holdAll), fadeSt = stat(fadeAll);
    // the baseline: the control bursts, pooled over the rounds of the attempt that stands
    const restSt = stat(restPre), fastSt = stat(restFast);
    console.log('RL-RAW: ' + JSON.stringify({ mutantMs: MUTANT_MS, mutantStallMs: MUTANT_STALL_MS, mutantFadeMs: MUTANT_FADE_MS, attempts, restA, restPre, restFast, hold: holdAll, fade: fadeAll, fine: M.fine }));
    ok(`A+ the rest baselines are the control bursts typed on the crossing page seconds before the 8th word: ${restSt.n} keys at the hold's pace and ${fastSt.n} at the fade's, over ${rounds.length} round(s), ${attempts.length} measurement(s) (a slow-control key over ${REST_NOISE_MS} ms = a box stall: the measurement is void and taken again; a failing one is measured again to confirm it)`,
      restSt.n >= MIN_KEYS && fastSt.n >= MIN_KEYS && !(restSt.max > REST_NOISE_MS) && !(fastSt.max > REST_NOISE_MS), `control ${show(restSt)} | control fast ${show(fastSt)} | A block ${show(restASt)} | attempts ${JSON.stringify(attempts)}`);
    ok('B premise: every round crossed the goal and the flash was HOLDING - on main with the drop-shadow actually applied to the full field, under Arbor\'s vines with the brass copy\'s composited layer running its animation', flashPremise && filterPremise, JSON.stringify(rounds.slice(-1)));
    ok(`B premise: at least ${MIN_KEYS} keys were painted while data-flash was true (${rounds.length} round(s); a flash that was over before the keys landed certifies nothing)`, holdSt.n >= MIN_KEYS, show(holdSt));
    ok(`B typing inside the flash is as fast as typing at rest: median within ${MEDIAN_SLACK} ms and p95 within ${P95_SLACK} ms of the rest numbers, and no key over ${MAX_MS} ms`,
      holdSt.n >= MIN_KEYS && restSt.n >= MIN_KEYS && holdSt.median <= restSt.median + MEDIAN_SLACK && holdSt.p95 <= restSt.p95 + P95_SLACK && holdSt.max <= MAX_MS, `rest ${show(restSt)} | flash ${show(holdSt)}`);
    ok(`C premise: at least ${MIN_KEYS} keys were painted during the fade (enough that a percentile means something)`, fadeSt.n >= MIN_KEYS, show(fadeSt));
    const costSt = { pre: stat(M.fine.pre.cost), hold: stat(M.fine.hold.cost), fast: stat(M.fine.fast.cost), fade: stat(M.fine.fade.cost) };
    ok(`B2 main-thread time per key inside the flash (the key's handler task + the frame that paints it, ms): the median is within ${COST_MEDIAN_SLACK} ms of the same page's control - a cost the frame clock hides`,
      costSt.hold.n >= MIN_KEYS && costSt.pre.n >= MIN_KEYS && costSt.hold.median <= costSt.pre.median + COST_MEDIAN_SLACK, `control ${show(costSt.pre)} | flash ${show(costSt.hold)}`);
    ok(`C2 main-thread time per key inside the fade: the median is within ${COST_MEDIAN_SLACK} ms of the fast control's PLUS the fade's reference cost (${REF.c2} ms, ${REF_SRC})`,
      costSt.fade.n >= MIN_KEYS && costSt.fast.n >= MIN_KEYS && costSt.fade.median <= costSt.fast.median + REF.c2 + COST_MEDIAN_SLACK, `control ${show(costSt.fast)} | fade ${show(costSt.fade)} | shift ${r1(costSt.fade.median - costSt.fast.median)} vs ref ${REF.c2}`);
    ok(`C typing inside the fade is as fast as at rest at the same pace (the same budgets over the fade's reference shift - median +${REF.c} ms, p95 +${REF.p95} ms, ${REF_SRC} - against the fast control; no key over ${MAX_MS} ms)`, fadeSt.n >= MIN_KEYS && fastSt.n >= MIN_KEYS && fadeSt.median <= fastSt.median + REF.c + MEDIAN_SLACK && fadeSt.p95 <= fastSt.p95 + REF.p95 + P95_SLACK && fadeSt.max <= MAX_MS,
      `rest ${show(fastSt)} | fade ${show(fadeSt)} | shift median ${r1(fadeSt.median - fastSt.median)} p95 ${r1(fadeSt.p95 - fastSt.p95)} vs ref ${REF.c}/${REF.p95}`);
    // The slow keys against the fade's start (information, never a verdict). Fable's suspect: the full-field drop-shadow FILTER is dropped at the instant the fade begins, forcing one big repaint.
    // If the slow keys line up here (sinceFadeStart near 0), the filter is the cause.
    const near = slowAll.filter((k) => k.sinceFadeStart !== null && Math.abs(k.sinceFadeStart) <= 150);
    ok(`C attribution (information, never a verdict): ${slowAll.length} slow fade key(s) over ${rounds.length} round(s), ${near.length} within 150 ms of the fade's start - ${slowAll.length ? (near.length === slowAll.length ? 'ALL line up with the fade start (the filter drop is the suspect)' : near.length ? 'SOME line up with the fade start' : 'NONE line up with the fade start (not the filter drop)') : 'none slow'}`,
      true, JSON.stringify({ perKey: slowAll.map((k) => `r${k.round}: ${k.ms} ms @ ${k.sinceFadeStart} ms after the fade began (${k.beforeFadeEnd} ms before it ended)`), rounds }));
    ok(`D no key was dropped across the crossing: in every round the stored text ends with " tail" followed by every typed "a" (${HOLD_KEYS + FADE_KEYS} of them)`, savedAll, lastSaved);
  });
}

if (process.env.BROWSERLESS_ONLY !== '1') {
  try { await part2(); } catch (err) { ok('PART 2 ran to the end', false, String((err && err.stack) || err).split('\n').slice(0, 3).join(' | ')); }
} else console.log('(BROWSERLESS_ONLY: PART 2 skipped - the live latency run needs a box turn)');

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}${c.pass && c.detail && /median/.test(c.detail) ? '  [' + c.detail + ']' : ''}`);
console.log(failed.length ? `\nRHIZOME-LATENCY VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nRHIZOME-LATENCY VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
