// GLITCH METER - Flux's progress animation, in the real app (brief docs/briefs/flux-flicker-meter-brief.md; plan docs/plans/glitch-meter.md
// @ a1bef99b, approved Oct 17 with Fable's section 8 answers). A Flux writing page, framed, Progress on, the style set to Glitch, a goal set.
// Real time cannot be waited out (5 minutes of idle per check), so the meter's clock is read through ONE seam, as the mockup's ?idle= does:
// window.wrizoGlitchMeter = { setIdle(sec), setLapFrac(f | null), setForceDouble(b), fire(kind), state() }.
//   G1  silent while typing: at peak, one key - the intensity drops to 0 and no meter event starts
//   G2  the ramp: the intensity equals Nick's rule at 20 s / 60 s / 180 s / 300 s / 360 s idle
//   G3  x progress: the real lap progress (words toward the goal) calms it; crossing the goal resets the lap
//   G4  THE FLASH COUNT (the safety floor): at peak, with Signal Loss at Ambiance 100 competing, for 20 s plus three forced bursts - counted
//       TWICE, by the budget's own log and by an independent observer on both layers; <= 3 in every sliding second, both counts equal, and
//       the budget really refused (the bursts guarantee it). Ledger 90: Signal Loss never pulsed on its own here (its loops skip while the
//       writing session reads busy), so it is FORCED through its own seam (window.wrizoFluxFx.fire) - every second, and in every burst beside
//       the meter's six - and the two-system case is really exercised.
//   G5  a double dip and a double sync jump each count 2
//   G6  reduced motion (the OS setting, emulated): no events, the still overlay at intensity x 0.42 - appearing with NO easing (Fable, Oct 17:
//       the global reduced-motion rule, index.css, is honoured); turning it off resumes
//   G7  the Flicker switch, pressed for real in the "..." panel: off means no meter at all (Signal Loss stays); it survives a reload
//   G8  page primacy: the page's rect is the same with the meter at peak and off; a click on the page reaches the page
//   G9  Arbor (plateau): no meter
// Frames (GM_FRAMES=<dir>): taken ON A PULSE, not on a timer (ledger 90: timed frames caught no meter) - the flash budget's grant calls a CDP
// binding, and the frame is taken a short per-kind delay later (the pulse at its brightest): six at peak, two at half progress; plus one under
// reduced motion (a still - no pulse to wait for) and one with Flicker off.
// Run: node scripts/harness/glitch-meter.mjs   (from apps/desktop, dist-web built, box turn granted)
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { withHarness } from '../runtime-verify.mjs';
import { trustedDispatch } from '../trusted-point.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const parkedChecks = [];
const pok = (name, pass, detail = '') => parkedChecks.push({ name, pass: !!pass, detail });
const gmParks = {};   // ledger 90: G6's reading, for its parked record
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const FRAMES = process.env.GM_FRAMES || null;
const frame = async (app, name) => { if (!FRAMES) return; mkdirSync(FRAMES, { recursive: true }); writeFileSync(join(FRAMES, `${name}.png`), Buffer.from(await app.screenshot(), 'base64')); };
const press = (app, expr, what) => trustedDispatch(app, expr, what, { report: ok });
// FRAMES ON A PULSE: the flash budget calls window.__wzOnFlashGrant(kind) on every grant (harness-only hook); this binds it to a CDP binding
// and, for each of the meter's grants, takes one frame after a short per-kind delay - when that pulse is brightest (a tear's lines are
// staggered 45 ms, a shear peaks at ~70 ms, a dip eases in over .28 s). One capture at a time; n frames at most. Returns stop() -> count.
const PULSE_DELAY = { 'gm-tear': 70, 'gm-shear': 60, 'gm-noise': 60, 'gm-macro': 30, 'gm-sync': 20, 'gm-sync2': 20, 'gm-dip': 260, 'gm-dip2': 200 };
const armPulseFrames = async (app, prefix, n) => {
  if (!FRAMES) return { count: () => 0, stop: async () => 0 };
  try { await app.cdp('Runtime.addBinding', { name: '__wzGrantFrame' }); } catch { /* bound already */ }
  await app.evalJs("window.__wzOnFlashGrant = (k) => { if (k.indexOf('gm-') === 0 && typeof window.__wzGrantFrame === 'function') window.__wzGrantFrame(k); }");
  let taken = 0;
  let busy = false;
  const off = app.tap((method, params) => {
    if (method !== 'Runtime.bindingCalled' || !params || params.name !== '__wzGrantFrame' || busy || taken >= n) return;
    busy = true;
    const kind = String(params.payload);
    sleep(PULSE_DELAY[kind] ?? 40).then(() => frame(app, `${prefix}-${taken + 1}-${kind.replace('gm-', '')}`)).then(() => { taken += 1; }, () => {}).finally(() => { busy = false; });
  });
  return { count: () => taken, stop: async () => { off(); await app.evalJs('window.__wzOnFlashGrant = null'); while (busy) await sleep(50); return taken; } };
};
const ED = '.forward-only-editor';
const LAYER = '.glitch-meter-layer';
// the mockup's curve, written out here: the harness checks the app against it, not against itself
const curve = (t) => { if (t < 30) return 0; const u = Math.min(1, (t - 30) / 270); return u * u * 0.4 + u * 0.6; };
const words = (n) => Array.from({ length: n }, (_, i) => ['rain', 'wire', 'neon', 'relay', 'ash'][i % 5]).join(' ') + '.';

const setup = async (app, { id, text, goal = 10, dial = 50, flicker = true }) => {
  await app.emulateDpr(1, 1400, 900);   // framed (the Progress style lives on the framed desk)
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');
    localStorage.setItem('wrizo-writing-settings', JSON.stringify({ progress: 'words', progressStyle: 'rhizome', instrumentsOn: true, typewriter: false, flicker: ${flicker} }));
    localStorage.setItem('wrizo-writing-goal-lines', JSON.stringify({ n: ${goal}, unit: 'words' }));
    localStorage.setItem('wrizo-ambiance-dial', '${dial}');`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.evalJs("window.wrizoTheme.set('flux')");
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await app.evalJs(`localStorage.setItem('wrizo-mode-page-${id}', 'drafting')`);
  await sleep(500);
  await app.evalJs(`location.hash = '#/page/${id}'`);
  const up = await app.waitFor(`!!document.querySelector('${ED}') && !!document.querySelector('${LAYER}')`, { label: 'the Flux page and its meter', timeout: 12000 }).then(() => true, () => false);
  await sleep(600);
  return up;
};
const M = (app, call) => app.evalJs(`(() => { const m = window.wrizoGlitchMeter; return m ? (${call}) : null; })()`);
const state = (app) => M(app, 'm.state()');
// the meter's pulses over a window (a shear's or noise patch's `on` class lingers after its flash, so a snapshot of classes would count old
// flashes): the `data-pulse` stamps on the meter layer while it is watched
const meterPulsesDuring = async (app, ms) => {
  await app.evalJs(`(() => { window.__wzMeterPulses = 0; const root = document.querySelector('${LAYER}'); if (!root) return false;
    const mo = new MutationObserver((recs) => { window.__wzMeterPulses += recs.length; }); mo.observe(root, { subtree: true, attributes: true, attributeFilter: ['data-pulse'] });
    window.__wzMeterStop = () => mo.disconnect(); return true; })()`);
  await sleep(ms);
  return app.evalJs('(() => { window.__wzMeterStop && window.__wzMeterStop(); return window.__wzMeterPulses; })()');
};

// G4's independent observer. Every Signal Loss and meter builder stamps a fresh `data-pulse` value on the element it pulses, at the moment
// it pulses (one per tear storm, cluster, shear, noise patch, jump and dip - and one per SECOND jump or dip). The observer counts those stamps
// from the DOM alone and never reads the budget: so a flash drawn without asking the budget shows up here and not in the log.
const OBSERVE = `(() => {
  const pulses = []; window.__wzPulses = pulses;
  const layerOf = (n) => (n.closest('${LAYER}') ? 'meter' : n.closest('.theme-fx-layer') ? 'signal' : null);
  const mo = new MutationObserver((recs) => { for (const r of recs) {
    const el = r.target; const v = el.getAttribute('data-pulse'); if (!v) continue;
    const layer = layerOf(el); if (layer) pulses.push({ t: performance.now(), kind: v.split(':')[0], layer }); } });
  for (const root of [document.querySelector('${LAYER}'), document.querySelector('.theme-fx-layer')]) if (root) mo.observe(root, { subtree: true, attributes: true, attributeFilter: ['data-pulse'] });
  window.__wzPulseStop = () => mo.disconnect();
  return true; })()`;
const worstWindow = (ts) => { const s = [...ts].sort((a, b) => a - b); let worst = 0; for (let i = 0, j = 0; i < s.length; i++) { while (s[i] - s[j] >= 1000) j++; worst = Math.max(worst, i - j + 1); } return worst; };

await withHarness(async (app) => {
  // ======== a 15-word page against a 10-word goal: lap progress 0.5 (for G3); G1/G2/G4/G5 pin it to 0 through the seam
  const up = await setup(app, { id: 'gm1', text: words(15), goal: 10, dial: 100 });
  ok('(setup) a framed Flux Draft page, Progress on, style Glitch, a goal set: the meter layer is mounted and the seam answers', up && !!(await state(app)), JSON.stringify(await state(app)));
  if (!up) return;
  const s0 = await state(app);
  ok('(premise) the meter is running, Flicker on, not reduced; at page open the last key is NOW, so the meter is silent (rule 1)', !!s0 && s0.running && s0.flicker && !s0.reduced && s0.I === 0, JSON.stringify(s0));

  // ---- G1: silent while typing
  await M(app, 'm.setLapFrac(0)');
  await M(app, 'm.setIdle(299)');
  await sleep(300);
  const g1a = await state(app);
  await app.evalJs(`document.querySelector('${ED}')?.focus()`);
  await app.typeKeys('x');
  const ev1 = await meterPulsesDuring(app, 2000);
  const g1b = await state(app);
  ok('G1: one keystroke silences it - intensity was high at 299 s idle, is 0 after the key, and the meter draws no pulse in the 2 s after it (rule 1)',
    !!g1a && g1a.I > 0.9 && !!g1b && g1b.I === 0 && g1b.idleSec < 3 && ev1 === 0, JSON.stringify({ g1a, g1b, ev1 }));

  // ---- G2: the ramp
  const g2 = [];
  for (const idle of [20, 60, 180, 300, 360]) {
    await M(app, `m.setIdle(${idle})`);
    await sleep(120);
    const s = await state(app);
    g2.push({ idle, s, want: s ? curve(s.idleSec) : null });
  }
  ok('G2: the intensity is Nick\'s rule at 20 / 60 / 180 / 300 / 360 s idle (0 under 30 s, the mockup\'s curve, 1 at 5 minutes)',
    g2.every((x) => x.s && Math.abs(x.s.I - x.want) < 1e-6 && Math.abs(x.s.idleSec - x.idle) < 2) && g2[0].s.I === 0 && g2[3].s.I > 0.999, JSON.stringify(g2.map((x) => [x.idle, x.s && x.s.I])));

  // ---- G3: x progress, from the page's real words
  await M(app, 'm.setLapFrac(null)');
  await M(app, 'm.setIdle(300)');
  await sleep(200);
  const g3a = await state(app);
  ok('G3: the lap progress is read from the page (15 words toward a 10-word goal = half a lap) and halves the intensity at peak (rule 3)',
    !!g3a && Math.abs(g3a.lapFrac - 0.5) < 1e-9 && Math.abs(g3a.I - 0.5) < 1e-6, JSON.stringify(g3a));
  { const pf = await armPulseFrames(app, 'progress-half', 2); for (let w = 0; w < 80 && pf.count() < 2; w++) { await M(app, 'm.setIdle(300)'); await sleep(100); } await pf.stop(); }
  await app.evalJs(`(() => { const ed = document.querySelector('${ED}'); ed.focus(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); })()`);
  await app.typeKeys(' one two three four five');
  await sleep(800);
  await M(app, 'm.setIdle(300)');
  await sleep(200);
  const g3b = await state(app);
  ok('G3: crossing the goal resets the lap (20 words: progress back to 0) - at peak the intensity is whole again',
    !!g3b && g3b.lapFrac === 0 && Math.abs(g3b.I - 1) < 1e-6, JSON.stringify(g3b));

  // ---- G4: THE FLASH COUNT
  await M(app, 'm.setLapFrac(0)');
  await M(app, 'm.setIdle(300)');
  await app.evalJs('window.__wzVerifyFlashes = true; window.__wzFlashLog = [];');
  await app.evalJs(OBSERVE);
  const t0 = await app.evalJs('performance.now()');
  const slSeam = await app.evalJs("!!(window.wrizoFluxFx && typeof window.wrizoFluxFx.fire === 'function')");
  ok('G4 (driver): Signal Loss\'s own seam answers (window.wrizoFluxFx.fire) - it is forced below, since its loops skip while the session reads busy (ledger 90)', slSeam);
  const SL = ['tear', 'shear', 'noise', 'macro', 'sync', 'dip'];
  const peakFrames = await armPulseFrames(app, 'peak', 6);
  for (let i = 0; i < 20; i++) {
    if (i === 4 || i === 10 || i === 16) {
      // a forced burst: BOTH systems' six asks at once
      await app.evalJs("(() => { const m = window.wrizoGlitchMeter, f = window.wrizoFluxFx; const out = []; for (const k of ['tear','shear','noise','macro','sync','dip']) { out.push(m ? m.fire(k) : null); out.push(f && f.fire ? f.fire(k) : null); } return out; })()");
    } else if (slSeam) {
      await app.evalJs(`window.wrizoFluxFx.fire('${SL[i % SL.length]}')`);   // Signal Loss, once a second, competing with the meter's own schedule
    }
    await M(app, 'm.setIdle(300)');
    await sleep(1000);
  }
  await sleep(1200);   // let every event in flight land
  const tEnd = await app.evalJs('(() => { window.__wzPulseStop && window.__wzPulseStop(); return performance.now(); })()');
  const peakTaken = await peakFrames.stop();
  if (FRAMES) ok('G4 (frames): six frames were taken ON meter pulses at peak (GM_FRAMES)', peakTaken === 6, String(peakTaken));
  const log = (await app.evalJs('window.__wzFlashLog || []')).filter((e) => e.t >= t0 && e.t <= tEnd);
  const pulses = (await app.evalJs('window.__wzPulses || []')).filter((e) => e.t >= t0 && e.t <= tEnd);
  const granted = log.filter((e) => e.ok);
  const refused = log.filter((e) => !e.ok);
  const byKind = (xs, f) => xs.reduce((a, x) => { const k = f(x); a[k] = (a[k] || 0) + 1; return a; }, {});
  const detail = { granted: granted.length, refused: refused.length, pulses: pulses.length, worstGranted: worstWindow(granted.map((e) => e.t)), worstPulses: worstWindow(pulses.map((e) => e.t)),
    grantedByKind: byKind(granted, (e) => e.kind), pulsesByKind: byKind(pulses, (e) => `${e.layer}:${e.kind}`) };
  ok('G4 (premise): both systems flashed - the meter and Signal Loss each drew pulses, and the run is long enough to mean something (>= 15 pulses)',
    pulses.some((p) => p.layer === 'meter') && pulses.some((p) => p.layer === 'signal') && pulses.length >= 15, JSON.stringify(detail));
  ok('G4: THE SAFETY FLOOR - never more than 3 flashes in any one second across the whole screen, by the independent observer',
    detail.worstPulses <= 3, JSON.stringify(detail));
  ok('G4: ...and by the budget\'s own log (the two instruments agree on the ceiling)', detail.worstGranted <= 3, JSON.stringify(detail));
  ok('G4: the observer saw exactly the flashes the budget granted - neither instrument is blind (counts equal)', pulses.length === granted.length, JSON.stringify(detail));
  ok('G4: the budget really refused flashes (the three forced bursts guarantee pressure) - a limiter that never refuses proves nothing', refused.length >= 9, JSON.stringify(detail));

  // ---- G5: double events count 2
  await M(app, 'm.setForceDouble(true)');
  const fireUntil = async (kind) => { for (let i = 0; i < 12; i++) { await M(app, 'm.setIdle(300)'); if (await M(app, `m.fire('${kind}')`)) return true; await sleep(350); } return false; };
  await app.evalJs('window.__wzFlashLog = [];');
  const dipFired = await fireUntil('dip');
  await sleep(1000);   // the second dip asks ~750 ms after the first
  const syncFired = await fireUntil('sync');
  await sleep(400);    // the second jump asks ~140 ms after the first
  const g5 = await app.evalJs('window.__wzFlashLog || []');
  await M(app, 'm.setForceDouble(false)');
  const asked = (k) => g5.filter((e) => e.kind === k).length;
  ok('G5: a double backlight dip asks the budget for its second pulse (2 flashes), and so does a double sync jump - granted or refused, each second pulse is counted',
    dipFired && syncFired && asked('gm-dip') >= 1 && asked('gm-dip2') >= 1 && asked('gm-sync') >= 1 && asked('gm-sync2') >= 1, JSON.stringify({ dipFired, syncFired, g5 }));

  // ---- G8: page primacy (before G6/G7 change the state)
  await M(app, 'm.setIdle(300)');
  await sleep(300);
  const rectOn = await app.evalJs(`(() => { const r = document.querySelector('${ED}').getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round); })()`);
  const hit = await app.evalJs(`(() => { const ed = document.querySelector('${ED}'); const r = ed.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + Math.min(40, r.height / 2);
    const el = document.elementFromPoint(x, y); const layer = document.querySelector('${LAYER}');
    return { reachesPage: !!el && ed.contains(el), layerPE: layer ? getComputedStyle(layer).pointerEvents : null, layerFixed: layer ? getComputedStyle(layer).position : null }; })()`);
  ok('G8: the meter takes no input - a point on the page finds the page beneath it; the layer is fixed and pointer-events:none', hit.reachesPage && hit.layerPE === 'none' && hit.layerFixed === 'fixed', JSON.stringify(hit));

  // ---- G6: reduced motion
  await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await M(app, 'm.setIdle(300)');
  await sleep(300);
  await app.evalJs('window.__wzVerifyFlashes = true; window.__wzFlashLog = [];');
  await app.evalJs(OBSERVE);
  const fired6 = await M(app, "['tear','dip','sync'].map((k) => m.fire(k))");
  await sleep(3500);   // the still overlay eases in
  await M(app, 'm.setIdle(300)');
  await sleep(2500);
  const s6 = await state(app);
  const still = await app.evalJs(`(() => { const s = document.querySelector('${LAYER} .glitch-meter-still'); return s ? { opacity: Number(getComputedStyle(s).opacity), transition: getComputedStyle(s).transitionDuration } : null; })()`);
  await app.evalJs('window.__wzPulseStop && window.__wzPulseStop()');
  const meterPulses6 = (await app.evalJs('window.__wzPulses || []')).filter((p) => p.layer === 'meter');
  await frame(app, 'reduced-motion');
  ok('G6: under reduced motion the meter fires NOTHING - no pulse on its layer in 6 s at peak, and even a forced event is refused',
    !!s6 && s6.reduced && meterPulses6.length === 0 && Array.isArray(fired6) && fired6.every((f) => f === false), JSON.stringify({ s6, meterPulses6: meterPulses6.length, fired6 }));
  // ---- PARKED - SUPERSEDED (ledger 90; Fable's ruling, Oct 17: honour the global reduced-motion rule, index.css - under reduced motion every
  // transition is 0.01 ms, so the overlay APPEARS, with no easing; the run read {opacity: 0.42, transition: "1e-05s"}). Kept VERBATIM and no
  // longer run; successor below.
  // ok('G6: ...it shows the faint still overlay instead, its opacity following intensity (1 x 0.42 at peak), eased in, not cut',
  //   !!still && Math.abs(still.opacity - 0.42) < 0.03 && parseFloat(still.transition) >= 2, JSON.stringify(still));
  // ------------------------------------------------------------------
  gmParks.g6 = still;
  ok('G6 [global-rule successor]: ...it shows the faint still overlay instead, its opacity following intensity (1 x 0.42 at peak), appearing with no easing - the global reduced-motion rule honoured (transition <= 0.01 ms)',
    !!still && Math.abs(still.opacity - 0.42) < 0.03 && parseFloat(still.transition) < 0.001, JSON.stringify(still));
  await app.emulateMedia([]);
  await sleep(600);
  const s6b = await state(app);
  ok('G6: turning reduced motion off mid-session is followed live - the meter is no longer reduced', !!s6b && s6b.reduced === false, JSON.stringify(s6b));

  // ---- G7: the Flicker switch, pressed for real
  if ((await app.evalJs("(document.querySelector('.wz-sliver-panel') || {}).dataset && document.querySelector('.wz-sliver-panel').dataset.open")) !== 'true') await press(app, "document.querySelector('.wz-sliver-grip')", 'the drawer grip');
  await sleep(500);
  await press(app, "document.querySelector('.wz-sliver-instruments-btn')", 'the "..." settings button');
  await sleep(400);
  const flickRow = "[...document.querySelectorAll('[data-menus-popout=\"settings\"] .wz-foot-settings-block')].find((s) => (s.querySelector('h4') || {}).textContent === 'Flicker')";
  const rowThere = await app.evalJs(`!!(${flickRow})`);
  ok('G7 (setup): the "..." panel holds a Flicker row beside Typewriter (Flux)', rowThere);
  if (rowThere) {
    await press(app, `[...(${flickRow}).querySelectorAll('button')].find((b) => b.textContent === 'Off')`, 'Flicker: Off');
    await M(app, 'm.setIdle(300)');
    const ev7 = await meterPulsesDuring(app, 2000);
    const s7 = await state(app);
    const sig7 = await app.evalJs("document.querySelectorAll('.theme-fx-layer > *').length");
    const rectOff = await app.evalJs(`(() => { const r = document.querySelector('${ED}').getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round); })()`);
    await frame(app, 'flicker-off');
    ok('G7: Flicker Off means no meter at all - intensity 0 at peak idle, no meter pulse in 2 s; the ambient Signal Loss layer is untouched',
      !!s7 && s7.flicker === false && s7.I === 0 && ev7 === 0 && sig7 > 0, JSON.stringify({ s7, ev7, sig7 }));
    ok('G8: the page\'s rect is the same with the meter at peak and with it off (the meter never displaces the page)', JSON.stringify(rectOn) === JSON.stringify(rectOff), JSON.stringify({ rectOn, rectOff }));
    await app.reload();
    await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'the page after a reload' }).catch(() => {});
    await sleep(800);
    const kept = await app.evalJs("JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}').flicker");
    const s7b = await state(app);
    ok('G7: the switch survives a reload (stored with the other writing settings)', kept === false && (!s7b || s7b.flicker === false), JSON.stringify({ kept, s7b }));
  }

  // ---- G9: Arbor
  await app.evalJs("window.wrizoTheme.set('plateau')");
  await sleep(800);
  const s9 = await state(app);
  const layer9 = await app.evalJs(`document.querySelectorAll('${LAYER}').length`);
  ok('G9: under Arbor there is no meter - no layer, and the seam reports it not running', layer9 === 0 && (!s9 || s9.running === false), JSON.stringify({ layer9, s9 }));
});

if (process.env.HARNESS_PARKED === '1') {
  // LEDGER 90 (2026-10-17) - ONE park: G6's easing. Its record asserts the ruled truth from the default leg's own reading: no easing.
  { const g = gmParks.g6 || null; pok('PARKED (was "G6: ...it shows the faint still overlay instead, its opacity following intensity (1 x 0.42 at peak), eased in, not cut") - Fable, Oct 17: honour the global reduced-motion rule (index.css), so the overlay appears with no easing; live successor: G6 [global-rule successor]',
      !!g && parseFloat(g.transition) < 0.001, JSON.stringify(g)); }
  console.log(JSON.stringify(parkedChecks, null, 2));
  const parkedPass = parkedChecks.every((c) => c.pass);
  console.log(parkedPass ? `\nGLITCH-METER PARKED: PASS (${parkedChecks.length} checks) - HARNESS_PARKED=1 armed; this FILE parks 1: G6's easing (ledger 90)`
    : `\nGLITCH-METER PARKED: FAIL - ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nGLITCH-METER VERIFY: PASS (${checks.length} checks)` : `\nGLITCH-METER VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
