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
// Run: node scripts/harness/rhizome-latency.mjs   (from apps/desktop; PART 2 needs a box turn)      BROWSERLESS_ONLY=1 runs PART 1 alone
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(here, '..', '..', 'src');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const noCR = (t) => t.replace(/\r\n?/g, '\n');
const read = (rel) => noCR(fs.readFileSync(path.join(SRC, rel), 'utf8'));
const sleepMs = (ms) => new Promise((r) => setTimeout(r, ms));

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
      const kd = () => { t0 = performance.now(); };
      const bi = () => { const t = t0; requestAnimationFrame(() => requestAnimationFrame(() => { const f = document.querySelector('.wz-rhizome-field'); const now = performance.now(); window.__lat.push({ ms: now - t, flash: f ? f.dataset.flash : null, key: t, at: now }); })); };
      document.addEventListener('keydown', kd, true); document.addEventListener('beforeinput', bi, true);
      window.__latOff = () => { document.removeEventListener('keydown', kd, true); document.removeEventListener('beforeinput', bi, true); };
      return true; })()`);
    const typeSteady = async (n, gap = 90) => { for (let i = 0; i < n; i += 1) { await app.typeKeys('a'); await sleep(gap); } };
    const lat = (flash) => app.evalJs(`window.__lat.filter((x) => ${flash === 'any' ? 'true' : `x.flash === ${JSON.stringify(flash)}`}).map((x) => x.ms)`);
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
    const restSt = stat(await lat('false'));
    ok(`A the rest numbers: ${MIN_KEYS}+ keys with the field at rest are measured (the baseline every flash number is held against)`, restSt.n >= MIN_KEYS, show(restSt));
    const restFilter = await app.evalJs("getComputedStyle(document.querySelector('.wz-rhizome-field')).filter");
    ok('A at rest the field carries NO filter (the drop-shadow is the flash\'s alone)', restFilter === 'none', String(restFilter));

    // B + C) the crossing, in ROUNDS: the 8th word lands, the flash HOLDS (about 1.2 s) and then the finished plant FADES (2.2 s). One crossing gives a dozen keys per phase at best, so the
    // crossing is repeated (the page is re-seeded to 7 words each time) until each phase has MIN_KEYS painted samples. A key only counts for the phase its frame was painted in (the flash
    // attribute is read at the frame), so a flash that was over before a key landed certifies nothing. Every round types HOLD_KEYS inside the hold, then FADE_KEYS as fast as the box takes them.
    const HOLD_KEYS = 14, FADE_KEYS = 22, MAX_ROUNDS = 8;
    const holdAll = [], fadeAll = [], slowAll = [], rounds = [];
    let flashPremise = true, filterPremise = true, savedAll = true, lastSaved = '';
    for (let round = 1; round <= MAX_ROUNDS && (holdAll.length < MIN_KEYS || fadeAll.length < MIN_KEYS); round += 1) {
      await seedAndReopen(pageId, 7, { n: 8, unit: 'words' });
      await arm();
      await app.typeKeys(' tail');
      const flashOn = await waitSoft("document.querySelector('.wz-rhizome-field')?.dataset.flash === 'true'", { label: 'brass flash on goal', timeout: 4000 });
      const flashFilter = flashOn ? await app.evalJs("getComputedStyle(document.querySelector('.wz-rhizome-field')).filter") : null;
      if (!(flashOn && /drop-shadow/.test(String(flashFilter)))) { flashPremise = false; filterPremise = false; rounds.push({ round, flashOn, flashFilter }); break; }
      await typeSteady(HOLD_KEYS, 85);
      await waitSoft("document.querySelector('.wz-rhizome-field')?.dataset.flash === 'fading'", { label: 'the fade begins', timeout: 3000 });
      await typeSteady(FADE_KEYS, 25);
      // wait for the page to settle (the fade's end), then read this round's samples out of the page
      await waitSoft("document.querySelector('.wz-rhizome-field')?.dataset.flash === 'false'", { label: 'the fade ends', timeout: 5000 });
      const h = await lat('true'), f = await lat('fading');
      holdAll.push(...h); fadeAll.push(...f);
      // WHERE the slow frames fell: a fade key more than 20 ms over that round's fade median (or over 50 ms outright), with its offset from the moment the fade began and from the moment it ended
      const att = await app.evalJs(`(() => {
        const fl = window.__fl, tF = (fl.find((x) => x[1] === 'fading') || [null])[0], iT = fl.findIndex((x) => x[1] === 'true');
        const tE = iT >= 0 ? (fl.slice(iT).find((x) => x[1] === 'false') || [null])[0] : null;
        const f = window.__lat.filter((x) => x.flash === 'fading'); const ms = f.map((x) => x.ms).sort((a, b) => a - b); const med = ms.length ? ms[Math.floor(ms.length / 2)] : null;
        const slow = f.filter((x) => med !== null && (x.ms > med + 20 || x.ms > 50)).map((x) => ({ ms: Math.round(x.ms * 10) / 10, sinceFadeStart: tF === null ? null : Math.round(x.key - tF), beforeFadeEnd: tE === null ? null : Math.round(tE - x.at) }));
        const holdSlow = window.__lat.filter((x) => x.flash === 'true' && x.ms > 50).map((x) => ({ ms: Math.round(x.ms * 10) / 10, phase: 'hold' }));
        return { fadeMs: tF !== null && tE !== null ? Math.round(tE - tF) : null, median: med === null ? null : Math.round(med * 10) / 10, slow, holdSlow };
      })()`);
      for (const k of att.slow || []) slowAll.push({ round, ...k });
      rounds.push({ round, hold: h.length, fade: f.length, fadeMs: att.fadeMs, fadeMedian: att.median, holdSlow: att.holdSlow });
      // D, per round) nothing was lost: every key is in the stored page. Read AFTER the debounced save lands (wait on the STORED value, never on a flush call)
      const typedA = HOLD_KEYS + FADE_KEYS;
      const want = ' tail' + 'a'.repeat(typedA);
      const saved = await waitSoft(`(((JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((e) => e.id === ${JSON.stringify(pageId)})) || {}).text || '').includes(${JSON.stringify(want)})`, { label: 'the typed text has been saved', timeout: 10000 });
      lastSaved = String(await stored(pageId)).slice(-60);
      if (!saved) savedAll = false;
    }
    const holdSt = stat(holdAll), fadeSt = stat(fadeAll);
    ok('B premise: every round crossed the goal and the flash was HOLDING with the drop-shadow actually applied to the full field', flashPremise && filterPremise, JSON.stringify(rounds.slice(-1)));
    ok(`B premise: at least ${MIN_KEYS} keys were painted while data-flash was true (${rounds.length} round(s); a flash that was over before the keys landed certifies nothing)`, holdSt.n >= MIN_KEYS, show(holdSt));
    ok(`B typing inside the flash is as fast as typing at rest: median within ${MEDIAN_SLACK} ms and p95 within ${P95_SLACK} ms of the rest numbers, and no key over ${MAX_MS} ms`,
      holdSt.n >= MIN_KEYS && restSt.n >= MIN_KEYS && holdSt.median <= restSt.median + MEDIAN_SLACK && holdSt.p95 <= restSt.p95 + P95_SLACK && holdSt.max <= MAX_MS, `rest ${show(restSt)} | flash ${show(holdSt)}`);
    ok(`C premise: at least ${MIN_KEYS} keys were painted during the fade (enough that a percentile means something)`, fadeSt.n >= MIN_KEYS, show(fadeSt));
    ok('C typing inside the fade is as fast as at rest (same budgets)', fadeSt.n >= MIN_KEYS && restSt.n >= MIN_KEYS && fadeSt.median <= restSt.median + MEDIAN_SLACK && fadeSt.p95 <= restSt.p95 + P95_SLACK && fadeSt.max <= MAX_MS, `rest ${show(restSt)} | fade ${show(fadeSt)}`);
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
