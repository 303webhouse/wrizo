// THROWAWAY (INK, Nov 10; never merged): THE ARMS of the Corridor's per-key cost, for Fable (the Corridor's L was red on the box: clock +5.5 ms, cost +4.3 ms median). Information only, by the L method
// (scripts/lib/l-method.mjs: six interleaved rounds, TWO readings, the control against itself, the +5/+10 ms mutants). C = the SAME Jacked In page with the whole corridor box taken away right
// after load; J = the same page with the corridor and ONE named piece removed (or changed). So an arm's J-minus-C is what is LEFT of the cost with that piece gone; the arm that brings J down to
// C is the cost. Arms: full (nothing removed), no-rails, no-frames (all 11), no-lime-and-brass (the two extra frames), no-glow, no-lane, no-ground (the box's own background and its stage), no-will-change
// (frames lose the compositor hint), no-containment (the box's contain:strict), frames-still (animations cancelled: the frames stand, nothing is paused/rate-set), rails-and-frames-only (glow and lane away).
import { withHarness } from '../runtime-verify.mjs';
import { makeL } from '../lib/l-method.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const LAT_TEXT = Array.from({ length: 150 }, (_, i) => 'word' + i).join(' ');
const CYCLE = 'the signal holds while she writes on ';
const ON_BOX = process.env.GITHUB_ACTIONS !== 'true';
const ARMS = [
  ['full', ''],
  ['no-rails', "document.querySelectorAll('.flux3-cor-rails').forEach((e) => e.remove())"],
  ['no-frames', "document.querySelectorAll('.flux3-cor-frame').forEach((e) => e.remove())"],
  ['no-lime-and-brass', "document.querySelectorAll('.flux3-cor-frame[data-kind]').forEach((e) => e.remove())"],
  ['no-glow', "document.querySelectorAll('.flux3-cor-glow').forEach((e) => e.remove())"],
  ['no-lane', "document.querySelectorAll('.flux3-cor-lane').forEach((e) => e.remove())"],
  ['no-ground-bg', "(() => { const c = document.querySelector('[data-flux3-corridor]'); c.style.setProperty('background', 'transparent', 'important'); })()"],
  ['no-will-change', "document.querySelectorAll('.flux3-cor-frame').forEach((e) => e.style.setProperty('will-change', 'auto', 'important'))"],
  ['no-containment', "(() => { const c = document.querySelector('[data-flux3-corridor]'); c.style.setProperty('contain', 'none', 'important'); })()"],
  ['frames-still', "document.querySelector('[data-flux3-corridor]').getAnimations({ subtree: true }).forEach((a) => a.cancel())"],
  ['rails-and-frames-only', "document.querySelectorAll('.flux3-cor-glow, .flux3-cor-lane').forEach((e) => e.remove())"],
];
const only = process.env.ARMS_ONLY ? process.env.ARMS_ONLY.split(',') : null;
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const sleepMs = sleep;
  await app.emulateDpr(1, 1920, 1080);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','flux');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash', timeout: 15000 }).catch(() => {});
  let seq = 0;
  const openJacked = async () => {
    const id = `arms-${Date.now()}-${seq += 1}`;
    await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: LAT_TEXT, createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })})`);
    await sleep(300);
    await ev(`(() => { const p = JSON.parse(localStorage.getItem('wrizo-theme-prefs') || '{}'); p.page = 'dark'; localStorage.setItem('wrizo-theme-prefs', JSON.stringify(p)); localStorage.setItem('wrizo-theme', 'flux'); localStorage.setItem('wrizo-ambiance-dial', '50');
      const w = JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'); Object.assign(w, { flicker: true, progressStyle: 'bar', progress: 'words', instrumentsOn: true, typewriter: false }); localStorage.setItem('wrizo-writing-settings', JSON.stringify(w));
      localStorage.removeItem('wrizo-mode-page-${id}'); history.replaceState(null, '', '/?flux3=1#/page/${id}'); })()`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 15000, label: 'the page' }).catch(() => {});
    await app.waitFor("!document.querySelector('.wz-splash')", { timeout: 15000, label: 'splash' }).catch(() => {});
    await ev("(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const s = getSelection(); s.selectAllChildren(ed); s.collapseToEnd(); return true; })()");
    await app.mouseMove(8, 8);
    await sleep(1600);
  };
  let variant = '';
  const L = makeL({
    app, ev, sleep, cycle: CYCLE,
    prepare: async (arm, on) => {
      await openJacked();
      if (arm === 'J' && on) { if (variant) await ev(variant); } else await ev("(() => { const c = document.querySelector('[data-flux3-corridor]'); if (c) c.remove(); })()");
      await ev("(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const s = getSelection(); s.selectAllChildren(ed); s.collapseToEnd(); return true; })()");
      await sleep(300);
      return { box: await ev("!!document.querySelector('[data-flux3-corridor]')"), frames: await ev("document.querySelectorAll('.flux3-cor-frame').length") };
    },
    stoodRight: (arm, on, s) => !!s && (arm === 'J' && on ? s.box === true : s.box === false),
  });
  if (ON_BOX || process.env.FLUX3_L === '1') {
    // the method proves itself first (control against itself, +5, +10)
    const green = await L.runArms('the control against itself', { on: false });
    ok(`L-METHOD-GREEN ${green.line}`, green.pass && green.enough && green.stoodRight, '');
    console.log('ARM control-vs-itself: ' + green.line);
    for (const [name, js] of ARMS) {
      if (only && !only.includes(name)) continue;
      variant = js;
      const r = await L.runArms(`arm ${name}`, { on: true });
      const c = (x) => (x == null ? 'n/a' : Math.round(x * 10) / 10);
      console.log(`ARM ${name}: clock J median ${c(r.J.clock.median)} p95 ${c(r.J.clock.p95)} max ${c(r.J.clock.max)} | C median ${c(r.C.clock.median)} p95 ${c(r.C.clock.p95)} || cost J median ${c(r.J.cost.median)} p95 ${c(r.J.cost.p95)} | C median ${c(r.C.cost.median)} p95 ${c(r.C.cost.p95)} || J-C clock median ${c(r.J.clock.median - r.C.clock.median)} p95 ${c(r.J.clock.p95 - r.C.clock.p95)}; cost median ${c(r.J.cost.median - r.C.cost.median)} p95 ${c(r.J.cost.p95 - r.C.cost.p95)} || verdict ${r.pass ? 'GREEN' : 'RED'} (${r.enough ? 'keys enough' : 'KEYS SHORT'}, ${r.stoodRight ? 'arms stood' : 'ARMS DID NOT STAND'})`);
      ok(`ARM ${name} stood and counted keys`, r.enough && r.stoodRight, r.line);
    }
    // the mutants: +5 / +10 ms in the key path of arm J on the control page
    for (const extra of (process.env.ARMS_MUTANTS === '1' ? [5, 10] : [])) {   // the mutants run in the last step only
      variant = '';
      const m = await L.runArms(`control + ${extra} ms mutant`, { extra, on: false });
      ok(`L-MUT-${extra} the method calls a key ${extra} ms slower RED on the cost reading (${m.line})`, !m.cost.pass && m.enough && m.stoodRight, '');
    }
  } else console.log('INFO ARMS (Actions: timing is the box\'s to judge; FLUX3_L=1 runs it here)');
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); checks.push({ name: 'HARNESS', pass: false, detail: String(e && e.message || e) }); }
let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nFLUX3-S4C-ARMS: FAIL - ${bad}/${checks.length} (information run)` : `\nFLUX3-S4C-ARMS: DONE (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
