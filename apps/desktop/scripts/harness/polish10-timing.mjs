// POLISH #10, FIX item 21 (Nick's live test of #7, Oct 25): THE TUTOR DRAWER OPENS AND CLOSES EXACTLY LIKE THE TOOLS DRAWER - the same slide-and-fade,
// the same durations ("today the Tutor closes faster"). RED-FIRST, on main @ 28aa6aab.
//
// What the writer sees, frame by frame: a sampler starts in the page, then a TRUSTED click lands on the drawer's tab; every animation frame records the
// panel's opacity, its sliding layer's travel (.wz-drawer-slide's translateX) and the panel's box, until all of them hold still. A drawer's OPEN (or
// CLOSE) takes from the click to the last frame that still moved. Arbor, a Draft page, 1920x1080 (both hands fit beside the page), two scenarios:
// at rest, and AFTER TYPING (the dissolve engine writes --fade-dur, which both panels' fades read).
//   T1  OPEN:  the Tutor's open runs on the Tools drawer's COMPUTED durations and delays (panel fade, sliding layer, --fade-dur, --drawer-dur) - no stopwatch (Fable, Oct 28)
//   T2  CLOSE: the same for the close
// Each reading carries both timelines' summaries and the panels' computed transitions and --fade-dur, so a red run is also the diagnosis.
// Mutant (at rest): MT2 the Tutor's close forced to 50ms above every rule - T2 fails.
// Seeding goes through the app's seams. Needs a box turn. Run: WS_BOX_TURN=<token> node scripts/harness/polish10-timing.mjs (apps/desktop, dist-web built)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const J = (v) => JSON.stringify(v);
const TEXT = 'The rope was already there, and the well took the bucket back colder still.\nWhatever is worth carrying is already with you, and the rest the wind can have.';
const HANDS = { tools: { grip: '.wz-sliver-grip', panel: '.wz-sliver-panel', name: 'Tools' }, tutor: { grip: '.wz-tutor-grip', panel: '.wz-tutor-panel', name: 'Tutor' } };

// arm a per-frame sampler on one panel; it starts timing at the grip's own pointerdown (the trusted click) and runs 1.6s past it
const ARM = (h, key) => `(() => { const panel = document.querySelector('${h.panel}'); const grip = document.querySelector('${h.grip}'); if (!panel || !grip) return false;
  const slide = () => panel.querySelector('.wz-drawer-slide');
  const read = () => { const cs = getComputedStyle(panel); const s = slide(); let x = null; if (s) { const tf = getComputedStyle(s).transform; x = tf && tf !== 'none' ? Math.round(new DOMMatrix(tf).m41 * 10) / 10 : 0; }
    const r = panel.getBoundingClientRect(); return { o: Math.round(parseFloat(cs.opacity) * 1000) / 1000, x, l: Math.round(r.left * 10) / 10, w: Math.round(r.width * 10) / 10, vis: cs.visibility }; };
  const style = () => { const cs = getComputedStyle(panel); const s = slide(); return { transition: cs.transition, fadeDur: cs.getPropertyValue('--fade-dur').trim() || null, drawerDur: cs.getPropertyValue('--drawer-dur').trim() || null, slideTransition: s ? getComputedStyle(s).transition : null, open: panel.getAttribute('data-open'),
    panelT: { prop: cs.transitionProperty, dur: cs.transitionDuration, delay: cs.transitionDelay }, slideT: s ? { prop: getComputedStyle(s).transitionProperty, dur: getComputedStyle(s).transitionDuration, delay: getComputedStyle(s).transitionDelay, anim: getComputedStyle(s).animationDuration } : null }; };
  const before = style(); const samples = [{ t: -1, ...read() }]; let t0 = null;
  window.__p10tDone = new Promise((res) => {
    (${key ? 'document' : 'grip'}).addEventListener('${key ? 'keydown' : 'pointerdown'}', () => { t0 = performance.now(); }, { capture: true, once: true });
    const t1 = performance.now();
    const tick = () => { const now = performance.now(); if (t0 != null) samples.push({ t: Math.round(now - t0), ...read() });
      if ((t0 != null && now - t0 > 1600) || now - t1 > 6000) res({ before, after: style(), clicked: t0 != null, samples }); else requestAnimationFrame(tick); };
    requestAnimationFrame(tick); });
  return true; })()`;
// the summary: when it began to move and when it last moved (opacity, travel, box; visibility is recorded, never timed - a hidden panel at opacity 0 shows nothing)
const summarize = (tl) => {
  if (!tl || !tl.samples || tl.samples.length < 3) return null;
  const S = tl.samples; const f = S[S.length - 1]; const z = S[0];
  const same = (a, b) => Math.abs(a.o - b.o) <= 0.005 && (a.x == null || b.x == null || Math.abs(a.x - b.x) <= 0.5) && Math.abs(a.l - b.l) <= 0.5 && Math.abs(a.w - b.w) <= 0.5;
  let last = -1; for (let i = 1; i < S.length; i += 1) if (!same(S[i], f)) last = i;
  const first = S.findIndex((s, i) => i > 0 && !same(s, z));
  return { start: first > 0 ? S[first].t : null, end: last >= 0 && last + 1 < S.length ? S[last + 1].t : (last < 0 ? 0 : null), from: z, to: f, frames: S.length,
    oHalf: (S.find((s, i) => i > 0 && Math.abs(s.o - z.o) >= Math.abs(f.o - z.o) / 2) || {}).t ?? null, before: tl.before, after: tl.after, clicked: tl.clicked };
};
const center = async (app, sel) => app.evalJs(`(() => { const e = document.querySelector('${sel}'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
// `key`: the drawer is closed by a KEYSTROKE on the page, not a click (the Tutor's own vanishing law, A15, closes an undocked Tutor when the writer types -
// Tutor.tsx's keydown listener); the sampler then starts at that keydown. Fable, Oct 28: report it, don't change it - the sequence works around it.
const toggle = async (app, h, key = false) => {
  const c = await center(app, h.grip); if (!c) return null;
  if (!(await app.evalJs(ARM(h, key)))) return null;
  if (key) {
    await app.evalJs("(() => { const e = document.querySelector('.forward-only-editor'); e.focus(); return true; })()");
    await app.typeKeys(' it');
  } else {
    await app.mouseMove(c.x, c.y); await sleep(60);
    await app.mouseDown(c.x, c.y); await app.mouseUp(c.x, c.y);
  }
  return summarize(await app.evalJs('window.__p10tDone'));
};

await withHarness(async (app) => {
  await app.emulateDpr(1, 1920, 1080);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-theme','plateau')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
  const id = 'p10t-page';
  await app.evalJs(`window.wrizoCreateJournalPage(${J({ id, text: TEXT, createdAt: new Date().toISOString(), origin: null, source: 'page' })})`);
  await app.evalJs(`localStorage.setItem('wrizo-mode-page-${id}', 'drafting'); localStorage.setItem('wrizo-typewriter-page-${id}', 'off')`);
  await app.evalJs('window.wrizoFlushNow()'); await sleep(300);
  await app.evalJs(`location.hash = '#/page/${id}'`);
  const opened = await waitSoft(app, "!!document.querySelector('.forward-only-editor') && !!document.querySelector('.wz-sliver-grip') && !!document.querySelector('.wz-tutor-grip')", { label: id, timeout: 10000 });
  ok('fixture: the Draft page opened with both drawer tabs', opened);
  if (!opened) return;
  await sleep(900);

  for (const scenario of ['at rest', 'after typing']) {
    const r = {};
    for (const k of ['tools', 'tutor']) {
      const h = HANDS[k];
      if (scenario === 'after typing') {
        await app.evalJs("(() => { const e = document.querySelector('.forward-only-editor'); e.focus(); const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()");
        await app.typeKeys(' and on'); await sleep(1500);
      }
      r[k] = { open: await toggle(app, h) };
      await sleep(400);
      // after typing, the Tutor closes BY the keystroke (A15's vanishing law); the Tools drawer is typed past, then clicked shut
      if (scenario === 'after typing' && k === 'tools') {
        await app.evalJs("(() => { const e = document.querySelector('.forward-only-editor'); e.focus(); return true; })()");
        await app.typeKeys(' it'); await sleep(1500);
      }
      r[k].close = await toggle(app, h, scenario === 'after typing' && k === 'tutor');
      await sleep(600);
    }
    const prem = ['tools', 'tutor'].every((k) => r[k].open && r[k].close && r[k].open.clicked && r[k].close.clicked && r[k].open.to.o >= 0.99 && r[k].close.to.o <= 0.01);
    const brief = (x) => (x ? { clicked: x.clicked, from: x.from && x.from.o, to: x.to && x.to.o, end: x.end, start: x.start } : null);
    ok(`${scenario} (premise): each tab took a trusted click, and its drawer opened (opacity 1) and closed (opacity 0)`, prem, J(prem ? { tools: r.tools, tutor: r.tutor } : { tools: { open: brief(r.tools.open), close: brief(r.tools.close) }, tutor: { open: brief(r.tutor.open), close: brief(r.tutor.close) } }));
    if (!prem) continue;
    for (const [phase, label] of [['open', 'T1 OPEN'], ['close', 'T2 CLOSE']]) {
      const a = r.tools[phase]; const b = r.tutor[phase];
      // the drawers are timed by the same TOKENS, not by a stopwatch: the panel's fade and the sliding layer's travel carry the same computed durations and
      // delays, open and close, and read the same --fade-dur / --drawer-dur. The line names the first field that differs.
      const fa = a.after; const fb = b.after;
      const fields = fa && fb ? [['--fade-dur', fa.fadeDur, fb.fadeDur], ['--drawer-dur', fa.drawerDur, fb.drawerDur], ['panel transition-property', fa.panelT.prop, fb.panelT.prop], ['panel transition-duration', fa.panelT.dur, fb.panelT.dur], ['panel transition-delay', fa.panelT.delay, fb.panelT.delay],
        ['slide transition-duration', fa.slideT && fa.slideT.dur, fb.slideT && fb.slideT.dur], ['slide transition-delay', fa.slideT && fa.slideT.delay, fb.slideT && fb.slideT.delay], ['slide animation-duration', fa.slideT && fa.slideT.anim, fb.slideT && fb.slideT.anim]] : [];
      const diff = fields.find(([, x, y]) => x !== y);
      ok(`${scenario} ${label}: the Tutor's ${phase} runs on the Tools drawer's durations - ${diff ? `DIFFERS at ${diff[0]}: Tools ${diff[1]} vs Tutor ${diff[2]}` : 'every computed duration and delay is equal'}`,
        fields.length > 0 && !diff, J({ tools: { panel: fa && fa.panelT, slide: fa && fa.slideT, fade: fa && fa.fadeDur, drawer: fa && fa.drawerDur }, tutor: { panel: fb && fb.panelT, slide: fb && fb.slideT, fade: fb && fb.fadeDur, drawer: fb && fb.drawerDur }, wall: { tools: a.end, tutor: b.end } }));
    }
    if (scenario === 'at rest') {
      // MT2: the Tutor's close forced to 50ms, above every rule - T2 must fail
      await toggle(app, HANDS.tutor); await sleep(600);
      await app.evalJs("(() => { const s = document.createElement('style'); s.id = 'p10t-mt2'; s.textContent = \"html body .wz-tutor-panel.wz-tutor-panel:not([data-open='true']), html body .wz-tutor-panel.wz-tutor-panel:not([data-open='true']) .wz-drawer-slide{ transition-duration: .05s !important; transition-delay: 0s !important; }\"; document.head.appendChild(s); return true; })()");
      const m = await toggle(app, HANDS.tutor);
      await app.evalJs("document.getElementById('p10t-mt2')?.remove()");
      const a = r.tools.close;
      ok(`MT2 (mutant): with the Tutor's close forced to 50ms (LANDED: ${m && m.after && m.after.transition}; it took ${m && m.end}ms), T2 fails`,
        !!m && !!m.after && /0\.05s/.test(m.after.transition || '') && !!a.after && m.after.panelT.dur !== a.after.panelT.dur, J({ mutant: m && m.after && m.after.panelT, tools: a.after && a.after.panelT }));
      await sleep(600);
    }
  }
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 1400)}]` : ''}`);
if (process.env.HARNESS_PARKED === '1') console.log('\nPOLISH10-TIMING PARKED: PASS (0 records) - a new file; it parks nothing of its own');
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nPOLISH10-TIMING VERIFY: PASS (${checks.length} checks)` : `\nPOLISH10-TIMING VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
