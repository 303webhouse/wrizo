// THROWAWAY (INK, Nov 10; never merged): ARMS, ROUND 2, for Fable. Round 1 (control = the Jacked In page with its corridor box removed) found J about +7..+11 ms of clock over C in EVERY arm, with a
// control whose cost reading (~35 ms) did not match flux3-s4c's. Cause of the mismatch: that C was still a Jacked In page (zoomed, veil, compile layer, hints) with only the box away, and with the opaque
// full-window box gone the whole stage behind it is painted again - not the page flux3-s4c's L uses. ROUND 2 uses the REAL control: Flux, flag OFF, the Typewriter on (the same page flux3-s4c's L compares
// against; open() copied from it). Every J arm is Jacked In (flag on) with ONE piece of the work removed, in turn, so the arm that brings J down to C is the cost:
//   DOM:      full | no-box (the whole corridor box removed: the Jacked In machinery alone) | box-empty (the box with all its children gone) | box-empty-transparent | no-mask (the veil mask off the editor)
//   switches (throwaway code in this branch, localStorage wrizo-arms-off): no-pace (the pace listener + tick) | no-compile (the signal compile's listeners and timers) | no-hints (the entry line, the X,
//   the nudge: their listeners) | no-caretn (the n-wide caret measure) ; and bare-jacked = no-box + no-mask + no-pace + no-compile + no-hints + no-caretn (Jacked In with nothing of this lane's per-key work).
// Each arm prints clock and cost, J and C, J-minus-C at median and p95. The method proves itself first (control against itself; +5/+10 ms mutants in the last step).
import { withHarness } from '../runtime-verify.mjs';
import { makeL } from '../lib/l-method.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const LAT_TEXT = Array.from({ length: 150 }, (_, i) => 'word' + i).join(' ');
const CYCLE = 'the signal holds while she writes on ';
const ON_BOX = process.env.GITHUB_ACTIONS !== 'true';
const NOBOX = "(() => { const c = document.querySelector('[data-flux3-corridor]'); if (c) c.remove(); })()";
const NOMASK = "document.querySelectorAll('.forward-only-editor').forEach((e) => { e.style.setProperty('mask-image', 'none', 'important'); e.style.setProperty('-webkit-mask-image', 'none', 'important'); })";
const ARMS = [
  { name: 'full', off: '', dom: '' },
  { name: 'no-box', off: '', dom: NOBOX },
  { name: 'box-empty', off: '', dom: "(() => { const c = document.querySelector('[data-flux3-corridor]'); [...c.children].forEach((e) => e.remove()); })()" },
  { name: 'box-empty-transparent', off: '', dom: "(() => { const c = document.querySelector('[data-flux3-corridor]'); [...c.children].forEach((e) => e.remove()); c.style.setProperty('background', 'transparent', 'important'); })()" },
  { name: 'no-mask', off: '', dom: NOMASK },
  { name: 'no-pace', off: 'pace', dom: '' },
  { name: 'no-compile', off: 'compile', dom: '' },
  { name: 'no-hints', off: 'hints', dom: '' },
  { name: 'no-caretn', off: 'caretn', dom: '' },
  // ROUND 4 (not yet run: waits on Fable's veil ruling): the veil without an offscreen mask surface. clip-only = mask off + a rect clip-path relative to the editor's own box (no dim); clip-band = that + a ground-tinted band over the line above the last (the dim, .4 of the ground).
  { name: 'clip-only', off: '', dom: (() => { const s = document.createElement('style'); s.textContent = "[data-flux3-jacked] .mode-pagecol[data-zoom='true'] .forward-only-editor{ -webkit-mask-image:none !important; mask-image:none !important; clip-path:inset(calc(100% - 2lh) 0 0 0) !important; }"; document.head.appendChild(s); })() },
  { name: 'clip-band', off: '', dom: (() => { const s = document.createElement('style'); s.textContent = "[data-flux3-jacked] .mode-pagecol[data-zoom='true'] .forward-only-editor{ -webkit-mask-image:none !important; mask-image:none !important; clip-path:inset(calc(100% - 2lh) 0 0 0) !important; } [data-flux3-jacked] .mode-pagecol[data-zoom='true'] .forward-only-editor{ position:relative; } [data-flux3-jacked] .mode-pagecol[data-zoom='true'] .forward-only-editor::after{ content:''; position:absolute; left:0; right:0; bottom:1lh; height:1lh; background:rgb(2 12 16 / .4); pointer-events:none; }"; document.head.appendChild(s); })() },
  { name: 'bare-jacked', off: 'pace,compile,hints,caretn', dom: NOBOX + '; ' + NOMASK },
];
const only = process.env.ARMS_ONLY ? process.env.ARMS_ONLY.split(',') : null;
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  // round 3: flux3-s4c's own INSTRUMENT (the flash-verify flags, a keydown recorder and the playbackRate wrapper) goes on every page, as it does in the real L, so the probe's full matches the real turn
  await app.cdp('Page.addScriptToEvaluateOnNewDocument', { source: "(() => { window.__wzVerifyFlashes = true; window.__wzVerifyCompile = true; const keys = []; addEventListener('keydown', () => keys.push(performance.now()), true); const upr = Animation.prototype.updatePlaybackRate; Animation.prototype.updatePlaybackRate = function (r) { return upr.call(this, r); }; })()" });
  await app.emulateDpr(1, 1920, 1080);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','flux');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash', timeout: 15000 }).catch(() => {});
  let seq = 0;
  // flux3-s4c's open(): J = Jacked In (flag on); C = Flux, flag off, the Typewriter on
  const open = async (jacked, off) => {
    const id = `arms2-${Date.now()}-${seq += 1}`;
    await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: LAT_TEXT, createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })})`);
    await sleep(300);
    await ev(`(() => { const p = JSON.parse(localStorage.getItem('wrizo-theme-prefs') || '{}'); p.page = 'dark'; localStorage.setItem('wrizo-theme-prefs', JSON.stringify(p)); localStorage.setItem('wrizo-theme', 'flux'); localStorage.setItem('wrizo-ambiance-dial', '50');
      const w = JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'); Object.assign(w, { flicker: true, progressStyle: 'bar', progress: 'words', instrumentsOn: true, typewriter: ${jacked ? 'false' : 'true'} }); localStorage.setItem('wrizo-writing-settings', JSON.stringify(w));
      localStorage.setItem('wrizo-arms-off', ${JSON.stringify(off || '')});
      localStorage.removeItem('wrizo-mode-page-${id}'); history.replaceState(null, '', ${JSON.stringify(jacked ? '/?flux3=1' : '/')} + '#/page/${id}'); })()`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 15000, label: 'the page' }).catch(() => {});
    await app.waitFor("!document.querySelector('.wz-splash')", { timeout: 15000, label: 'splash' }).catch(() => {});
    await ev("(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const s = getSelection(); s.selectAllChildren(ed); s.collapseToEnd(); return true; })()");
    await app.mouseMove(8, 8);
    await sleep(1600);
  };
  let arm = ARMS[0];
  const L = makeL({
    app, ev, sleep, cycle: CYCLE, rounds: Number(process.env.ARMS_ROUNDS || 6),
    prepare: async (a, on) => {
      const jacked = a === 'J' && on;
      await open(jacked, jacked ? arm.off : '');
      if (jacked && arm.dom) await ev(arm.dom);
      await ev("(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const s = getSelection(); s.selectAllChildren(ed); s.collapseToEnd(); return true; })()");
      await sleep(300);
      const s = await ev("({ flag: document.documentElement.hasAttribute('data-flux3'), jacked: document.documentElement.hasAttribute('data-flux3-jacked'), zoom: (document.querySelector('.mode-pagecol') || {}).getAttribute ? document.querySelector('.mode-pagecol').getAttribute('data-zoom') : null, box: !!document.querySelector('[data-flux3-corridor]') })");
      return s;
    },
    stoodRight: (a, on, s) => !!s && (a === 'J' && on ? s.flag && s.jacked && s.zoom === 'true' : !s.flag && s.zoom === 'true'),
  });
  if (ON_BOX || process.env.FLUX3_L === '1') {
    const c = (x) => (x == null ? 'n/a' : Math.round(x * 10) / 10);
    const green = await L.runArms('the control against itself', { on: false });
    ok(`L-METHOD-GREEN ${green.line}`, green.pass && green.enough && green.stoodRight, '');
    console.log('ARM control-vs-itself: ' + green.line);
    // ARMS_ONLY names the arms IN ORDER and may repeat one (round 3: full / no-mask three times each, interleaved)
    for (const a of (only ? only.map((n) => ARMS.find((x) => x.name === n)).filter(Boolean) : ARMS)) {
      arm = a;
      const r = await L.runArms(`arm ${a.name}`, { on: true });
      console.log(`ARM ${a.name}: clock J median ${c(r.J.clock.median)} p95 ${c(r.J.clock.p95)} max ${c(r.J.clock.max)} | C median ${c(r.C.clock.median)} p95 ${c(r.C.clock.p95)} || cost J median ${c(r.J.cost.median)} p95 ${c(r.J.cost.p95)} | C median ${c(r.C.cost.median)} p95 ${c(r.C.cost.p95)} || J-C clock median ${c(r.J.clock.median - r.C.clock.median)} p95 ${c(r.J.clock.p95 - r.C.clock.p95)}; cost median ${c(r.J.cost.median - r.C.cost.median)} p95 ${c(r.J.cost.p95 - r.C.cost.p95)} || verdict ${r.pass ? 'GREEN' : 'RED'} (${r.enough ? 'keys enough' : 'KEYS SHORT'}, ${r.stoodRight ? 'arms stood' : 'ARMS DID NOT STAND'})`);
      ok(`ARM ${a.name} stood and counted keys`, r.enough && r.stoodRight, r.line);
    }
    for (const extra of (process.env.ARMS_MUTANTS === '1' ? [5, 10] : [])) {
      arm = ARMS[0];
      const m = await L.runArms(`control + ${extra} ms mutant`, { extra, on: false });
      ok(`L-MUT-${extra} the method calls a key ${extra} ms slower RED on the cost reading (${m.line})`, !m.cost.pass && m.enough && m.stoodRight, '');
    }
  } else console.log('INFO ARMS2 (Actions: timing is the box\'s to judge; FLUX3_L=1 runs it here)');
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); checks.push({ name: 'HARNESS', pass: false, detail: String(e && e.message || e) }); }
let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nFLUX3-S4C-ARMS2: FAIL - ${bad}/${checks.length} (information run)` : `\nFLUX3-S4C-ARMS2: DONE (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
