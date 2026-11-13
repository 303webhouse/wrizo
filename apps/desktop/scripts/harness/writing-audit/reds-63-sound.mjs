// RED-FIRST CHECK for #63's page-turn sound switch (the left rail's Settings, "Page-turn sound: On / Off", remembered per theme on the device; Arbor on, Flux on, Machina off; nothing stored until she touches it; once per page per sitting).
// A ring is counted at the sound itself: the page's AudioContext buffer sources and any audio element played are counted from a hook the script installs. The page turns when the text crosses the sheet's height
// (14 lines, then Shift+Enter four times); the writing makes the turn.
//   S1  the default: Arbor and Flux ring once, Machina is quiet; opening a page that is already long rings nothing
//   S2  once per page per sitting: Backspace back over the line and write past it again: no second ring; a page further on: one more
//   S3  nothing is stored until she touches the switch (the storage key is absent)
//   S4  she presses the other value in Settings: only this theme is stored; the next turn follows it (on becomes quiet; Machina's off becomes a ring); the other themes' defaults are untouched
//   S5  after a reload the choice is still there
// RED on main today (no switch exists: S1's default rings need a switch to read, S4 cannot find it). Run: node scripts/harness/writing-audit/reds-63-sound.mjs (from apps/desktop; on Actions via writing-audit.yml, script=reds-63-sound.mjs; strict)
import { withHarness } from '../../runtime-verify.mjs';
import { makeDriver, sleep, THEMES } from './lib/driver.mjs';

const env = process.env;
const cfg = { theme: env.WA_THEME || 'plateau', flag: env.WA_FLAG || 'off', tone: env.WA_TONE || 'light', width: Number(env.WA_W || 1366), height: Number(env.WA_H || 768), out: env.WA_OUT || null };
if (!THEMES[cfg.theme]) { console.error('WA_THEME must be plateau, flux or machina'); process.exit(2); }
const TAG = `${THEMES[cfg.theme].label}/${cfg.flag}/${cfg.tone}/${cfg.width}`;
const NL = String.fromCharCode(10);
const DEFAULT_ON = cfg.theme !== 'machina';
const KEY = 'wrizo-page-turn-sound';
let bad = 0;

await withHarness(async (app) => {
  const d = makeDriver(app, cfg);
  console.log(`RED-63-SOUND [${TAG}] (${new Date().toISOString()})`);
  await d.boot();
  const ev = d.ev;
  const lines = (n) => Array.from({ length: n }, (_, i) => `Line ${i + 1}`).join(NL);
  const hook = () => ev(`(() => { if (window.__ringHook) return true; window.__ringHook = true; window.__rings = 0; window.__srcs = []; const C = window.AudioContext || window.webkitAudioContext; if (C) { const o = C.prototype.createBufferSource; C.prototype.createBufferSource = function () { window.__rings++; return o.apply(this, arguments); }; } const op = HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play = function () { window.__rings++; window.__srcs.push(this.currentSrc || this.src || ''); return op.apply(this, arguments); }; return true; })()`);
  const rings = () => ev('window.__rings || 0');
  // which file rang last, and does it load (the bundle serves it, as audio, with bytes)
  const lastFile = () => ev(`(async () => { const u = (window.__srcs || []).slice(-1)[0] || ''; if (!u) return { url: '' }; try { const r = await fetch(u); const b = await r.arrayBuffer(); return { url: u, ok: r.ok, type: r.headers.get('content-type') || '', bytes: b.byteLength }; } catch (e) { return { url: u, error: String(e) }; } })()`);
  const wantFile = cfg.theme === 'flux' ? 'flux-line-feed' : 'arbor-page-turn';
  const fileFails = (f, want, fails, label) => { if (!f || !f.url) { fails.push(`${label}: no sound file was played`); return; } if (!f.url.includes(want)) fails.push(`${label}: the file played is ${f.url}, want ${want}`); if (!f.ok || f.bytes < 5000 || !/audio|wav|octet/i.test(f.type)) fails.push(`${label}: the file did not load as audio (${JSON.stringify({ ok: f.ok, type: f.type, bytes: f.bytes })})`); };
  const open = async (text) => { await d.surface('.forward-only-editor', false); await d.openPage(text, 'drafting', { typewriter: 'off' }); await d.place(text.length); await sleep(500); await hook(); };
  const shiftEnters = async (n) => { for (let i = 0; i < n; i++) { await d.key('Enter', { shift: true }); await sleep(70); } await sleep(900); };
  const backspaces = async (n) => { for (let i = 0; i < n; i++) { await d.key('Backspace'); await sleep(70); } await sleep(900); };
  const stored = () => ev(`localStorage.getItem(${JSON.stringify(KEY)})`);
  const check = (name, fails) => { if (fails.length) bad++; console.log(`${fails.length ? 'FAIL' : 'PASS'}  ${name} [${TAG}]${fails.length ? ': ' + fails.join(' || ') : ''}`); };
  // the switch lives in the left rail's Settings (the cascade panel the page's own strip opens), two buttons like the Cast row: data-turn-sound-option on / off
  const openSettings = async () => { const r = await ev(`(() => { const b = document.querySelector('.wz-strip [data-category="settings"]') || document.querySelector('[data-category="settings"]'); if (!b) return 'no Settings entry on the page strip'; b.click(); return 'ok'; })()`); await sleep(700); return r; };
  const press = (value) => ev(`(() => { const row = document.querySelector('.wz-cascade-turnsound'); if (!row) return 'no Page-turn sound row in the rail Settings'; const b = row.querySelector('[data-turn-sound-option=' + JSON.stringify(${JSON.stringify(value.toLowerCase())}) + ']'); if (!b) return 'no ' + ${JSON.stringify(value)} + ' button'; b.click(); return 'ok'; })()`);
  const closeSettings = async () => { await d.key('Escape'); await sleep(400); };

  // S1 - the default, and a long page opening rings nothing
  const f1 = [];
  try {
    await open(lines(40));
    const r0 = await rings(); if (r0 !== 0) f1.push(`opening a page that is already 40 lines long rang ${r0} time(s)`);
    await open(lines(14));
    const before = await rings();
    await shiftEnters(4);
    const got = (await rings()) - before;
    const want = DEFAULT_ON ? 1 : 0;
    if (got !== want) f1.push(`the page turned and the default (${DEFAULT_ON ? 'on' : 'off'}) rang ${got} time(s), want ${want}`);
    if (DEFAULT_ON) fileFails(await lastFile(), wantFile, f1, 'the default turn');
  } catch (e) { f1.push('harness: ' + String((e && e.message) || e).slice(0, 200)); }
  check('S1 the default and a long page opening', f1);

  // S2 - once per page per sitting (the page just turned is the open one)
  const f2 = [];
  try {
    const a = await rings();
    await backspaces(4); await shiftEnters(4);
    const again = (await rings()) - a;
    if (again !== 0) f2.push(`going back over the line and writing past it again rang ${again} time(s), want 0`);
    const b = await rings();
    await shiftEnters(18);
    const next = (await rings()) - b;
    const want = DEFAULT_ON ? 1 : 0;
    if (next !== want) f2.push(`a page further on rang ${next} time(s), want ${want}`);
  } catch (e) { f2.push('harness: ' + String((e && e.message) || e).slice(0, 200)); }
  check('S2 once per page per sitting', f2);

  // S3 - nothing stored until touched
  const f3 = [];
  const s3 = await stored(); if (s3 !== null) f3.push(`the storage key holds ${JSON.stringify(s3)} before she touched the switch`);
  check('S3 nothing is stored until she touches the switch', f3);

  // S4 - she presses the other value
  const f4 = [];
  try {
    await open(lines(14));
    const op = await openSettings(); if (op !== 'ok') f4.push(op);
    const other = DEFAULT_ON ? 'Off' : 'On';
    const res = await press(other);
    if (res !== 'ok') f4.push(res);
    await closeSettings();
    const st = JSON.parse((await stored()) || 'null');
    const want = DEFAULT_ON ? 'off' : 'on';
    if (!st || st[cfg.theme] !== want || Object.keys(st).length !== 1) f4.push(`the stored choice is ${JSON.stringify(st)}, want only ${cfg.theme}:${want}`);
    for (const t of ['plateau', 'flux', 'machina']) { if (t === cfg.theme) continue; const g = await ev(`window.wrizoTurnSound ? window.wrizoTurnSound.get(${JSON.stringify(t)}) : null`); const dw = t === 'machina' ? 'off' : 'on'; if (g !== dw) f4.push(`${t} reads ${g}, its default is ${dw}`); }
    await open(lines(14));
    const b = await rings();
    await shiftEnters(4);
    const got = (await rings()) - b;
    const wantRings = DEFAULT_ON ? 0 : 1;
    if (got !== wantRings) f4.push(`after pressing ${other} the turn rang ${got} time(s), want ${wantRings}`);
    if (wantRings === 1) fileFails(await lastFile(), wantFile, f4, `after pressing ${other}`);
  } catch (e) { f4.push('harness: ' + String((e && e.message) || e).slice(0, 200)); }
  check('S4 pressing the other value (stored per theme, followed at once)', f4);

  // S5 - after a reload
  const f5 = [];
  try {
    await app.reload();
    await app.waitFor("!!document.body", { timeout: 20000, label: 'reload' }); await sleep(900);
    const g = await ev(`window.wrizoTurnSound ? window.wrizoTurnSound.get(${JSON.stringify(cfg.theme)}) : null`);
    const want = DEFAULT_ON ? 'off' : 'on';
    if (g !== want) f5.push(`after a reload the switch reads ${g}, want ${want}`);
  } catch (e) { f5.push('harness: ' + String((e && e.message) || e).slice(0, 200)); }
  check('S5 the choice survives a reload', f5);
});
console.log(`RED-63-SOUND [${TAG}] ${bad ? `FAIL - ${bad}` : 'PASS'}`);
process.exit(bad ? 1 : 0);
