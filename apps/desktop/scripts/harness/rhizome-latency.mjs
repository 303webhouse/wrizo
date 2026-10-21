// RHIZOME-LATENCY (cursor/rhizome-sprout @ 0d00e2ce, Nick: the tip is FINAL). The goal flash puts a drop-shadow filter on the FULL rhizome field
// (an SVG as large as the stage, behind the page): `.wz-rhizome-field[data-flash='true']{ filter:drop-shadow(...); animation:wz-rhizome-pop }`. A filter on a stage-sized layer
// is the kind of thing that can cost every frame - including the frame that shows the writer's keystroke. This file holds that shut: typing across a goal crossing stays as fast as typing
// before it.
//
//   PART 1 (browserless)  source pins: the drop-shadow lives ONLY in the flash-true rule and its pop keyframes (never on the field at rest, never in the fading hold, never on the
//                         seed root); the flash is a transform-free, layout-free effect (filter + opacity + stroke only); FULL_COVER is gone from the growth module.
//                         One mutant, landing asserted: a drop-shadow on the field AT REST turns the pin red.
//   PART 2 (a box turn)   the real app, real keys, one character every ~90 ms, the latency of each key read IN the page (keydown -> the frame after the one that painted its input):
//                         A) before the goal (the field at rest), B) while the flash is HOLDING (data-flash='true', drop-shadow applied, pop animation running), C) during the fade.
//                         The flash samples are only counted when the flash was on at the frame - a flash that was over before the keys landed does not certify anything.
//                         The budgets are RELATIVE to this machine's own rest numbers (a drop-shadow cost is a difference, not an absolute): median within 10 ms and p95 within 25 ms
//                         of rest, and no key slower than 100 ms. The first box run prints every number; if the box shows a real cost the field's filter is the suspect, not the budget.
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
    // the in-page meter: a key's latency is keydown -> the SECOND animation frame after its input (the first runs before the paint that shows it; the second starts after that paint)
    const arm = () => app.evalJs(`(() => {
      window.__lat = []; let t0 = 0;
      if (window.__latOff) window.__latOff();
      const kd = () => { t0 = performance.now(); };
      const inp = () => { const t = t0; requestAnimationFrame(() => requestAnimationFrame(() => { const f = document.querySelector('.wz-rhizome-field'); window.__lat.push({ ms: performance.now() - t, flash: f ? f.dataset.flash : null }); })); };
      document.addEventListener('keydown', kd, true); document.addEventListener('input', inp, true);
      window.__latOff = () => { document.removeEventListener('keydown', kd, true); document.removeEventListener('input', inp, true); };
      return true; })()`);
    const typeSteady = async (n, gap = 90) => { for (let i = 0; i < n; i += 1) { await app.typeKeys('a'); await sleep(gap); } };
    const lat = (flash) => app.evalJs(`window.__lat.filter((x) => ${flash === 'any' ? 'true' : `x.flash === ${JSON.stringify(flash)}`}).map((x) => x.ms)`);
    const stat = (xs) => { const s = (xs || []).slice().sort((a, b) => a - b); const q = (p) => (s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null); return { n: s.length, median: q(0.5), p95: q(0.95), max: s.length ? s[s.length - 1] : null }; };
    const r1 = (x) => (x === null ? null : Math.round(x * 10) / 10);
    const show = (st) => JSON.stringify({ n: st.n, median: r1(st.median), p95: r1(st.p95), max: r1(st.max) });

    const pageId = await openPage();
    // A) REST: a goal far away, the field drawn, nothing flashing
    await seedAndReopen(pageId, 7, { n: 1000, unit: 'words' });
    await arm();
    await typeSteady(24);
    const restSt = stat(await lat('false'));
    ok('A the rest numbers: 24 keys with the field at rest are measured (the baseline every flash number is held against)', restSt.n >= 20, show(restSt));
    const restFilter = await app.evalJs("getComputedStyle(document.querySelector('.wz-rhizome-field')).filter");
    ok('A at rest the field carries NO filter (the drop-shadow is the flash\'s alone)', restFilter === 'none', String(restFilter));

    // B) the crossing: the 8th word lands, the flash HOLDS (about 1.2 s); keys typed inside the hold are the ones counted
    await seedAndReopen(pageId, 7, { n: 8, unit: 'words' });
    await arm();
    await app.typeKeys(' tail');
    const flashOn = await waitSoft("document.querySelector('.wz-rhizome-field')?.dataset.flash === 'true'", { label: 'brass flash on goal', timeout: 4000 });
    const flashFilter = flashOn ? await app.evalJs("getComputedStyle(document.querySelector('.wz-rhizome-field')).filter") : null;
    ok('B premise: the goal was crossed and the flash is HOLDING with the drop-shadow actually applied to the full field', flashOn && /drop-shadow/.test(String(flashFilter)), String(flashFilter));
    await typeSteady(10, 85);
    const holdSt = stat(await lat('true'));
    ok('B premise: at least 5 of the keys typed during the hold were painted while data-flash was still true (a flash over before the keys landed certifies nothing)', holdSt.n >= 5, show(holdSt));
    ok('B typing inside the flash is as fast as typing at rest: median within 10 ms and p95 within 25 ms of the rest numbers, and no key over 100 ms',
      holdSt.n >= 5 && restSt.n >= 20 && holdSt.median <= restSt.median + 10 && holdSt.p95 <= restSt.p95 + 25 && holdSt.max <= 100, `rest ${show(restSt)} | flash ${show(holdSt)}`);

    // C) the fade: the finished plant fades over ~2.2 s while the seed root stays; keys here too
    await waitSoft("document.querySelector('.wz-rhizome-field')?.dataset.flash === 'fading'", { label: 'the fade begins', timeout: 3000 });
    await typeSteady(12, 100);
    const fadeSt = stat(await lat('fading'));
    ok('C premise: at least 5 keys were painted during the fade', fadeSt.n >= 5, show(fadeSt));
    ok('C typing inside the fade is as fast as at rest (same budgets)', fadeSt.n >= 5 && fadeSt.median <= restSt.median + 10 && fadeSt.p95 <= restSt.p95 + 25 && fadeSt.max <= 100, `rest ${show(restSt)} | fade ${show(fadeSt)}`);

    // D) nothing was lost: every key is in the stored page
    await sleep(900);
    await app.evalJs('window.wrizoFlushNow && window.wrizoFlushNow()');
    const text = await app.evalJs(`(JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((e) => e.id === ${JSON.stringify(pageId)}) || {}).text ?? ''`);
    const typedA = 10 + 12;   // the characters typed after ' tail' in this page's second session
    ok('D no key was dropped across the crossing: the stored text ends with " tail" followed by every typed "a" (22 of them)', text.includes(' tail' + 'a'.repeat(typedA)), String(text).slice(-60));
  });
}

if (process.env.BROWSERLESS_ONLY !== '1') {
  try { await part2(); } catch (err) { ok('PART 2 ran to the end', false, String((err && err.stack) || err).split('\n').slice(0, 3).join(' | ')); }
} else console.log('(BROWSERLESS_ONLY: PART 2 skipped - the live latency run needs a box turn)');

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}${c.pass && c.detail && /median/.test(c.detail) ? '  [' + c.detail + ']' : ''}`);
console.log(failed.length ? `\nRHIZOME-LATENCY VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nRHIZOME-LATENCY VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
