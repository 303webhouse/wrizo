// #140 ROUND TWO - ONE EASED RAMP UP, ONE EASED RAMP DOWN, AND A STOP THAT ONLY EVER SLOWS (Nick, Nov 26: "both the slowdown and the speedup are happening too quickly after the User starts or stops writing. It should be more of a ramp
// up and ramp down with a bit more of a buffer ... as it slows to a stop, it has like a false stop and then lurches and fully stops well after I finished typing"; Fable, Nov 27, Q2: A, about 1 s of wait, one ramp up and one down of about 3 s).
// Flux, Wire In, 1366 x 768. The corridor's speed is read from the animations' playbackRate calls; its REAL motion from a frame animation's currentTime, sampled every 100 ms. A key's time is the keydown's.
//   U1  from rest she writes: nothing moves for the first 0.8 s, and it is moving within 2.5 s
//   U2  one ramp up: it takes at least 1.5 s to reach 90% of her steady speed, never slowing on the way, with no plateau (a new setting at least every 0.6 s)
//   D1  she stops: the speed holds for at least 0.9 s after her last key
//   D2  it only ever slows: no setting after her last key is higher than the one before, and the real motion never speeds up or runs backwards
//   D3  one ramp down: from the first drop to rest takes at least 1.8 s with no plateau, and it is at rest 2.5 to 6.5 s after her last key
//   D4  it comes to rest on a slot (the video's picture) without a jump: the final correction is under 40 ms of its 1.1 s step
//   R   she writes again during the slow-down: it goes on slowing for about a second, never stops, then ramps back up
//   B   every single change of speed is at most 0.5, and it is set at most 4 times a second
//   K   nothing on the key path: the key handler only stamps the time (read from the source)
//   MUT the judges go RED on a stepped trace, on one that lurches before stopping, and on one that jumps
// D1 to D4 are judged on two separate stops (14 s and 6 s of writing).
// Run: node scripts/harness/wirein-tunnel-ramp.mjs (from apps/desktop; Actions or the box).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
process.env.WS_ARBOR2 = 'default';
process.env.WS_MACHINA2 = 'default';
const { withHarness } = await import('../runtime-verify.mjs');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? '  ' + String(detail).slice(0, 900) : ''}`); };
const J = (v) => JSON.stringify(v);
const r2 = (v) => (v == null ? null : Math.round(v * 100) / 100);
const STEP = 1100;   // a frame's step, ms of animation time
// one value per setting moment (a tick sets every animation at once)
const settings = (rates) => rates.reduce((a, [t, r]) => { if (!a.length || t - a[a.length - 1][0] > 60) a.push([t, r]); else a[a.length - 1][1] = r; return a; }, []);
const at = (s, t) => { let v = 0; for (const [x, r] of s) { if (x <= t) v = r; else break; } return v; };
const within = (s, from, to) => s.filter(([t]) => t >= from && t <= to);

// ---- the judges ----------------------------------------------------------------------------------------------------------------------------------
const judgeUp = (s, first, steady) => {
  const start = s.find(([t, r]) => t >= first && r > 0);
  if (!start) return { moving: null, to90: null, dips: null, gap: null };
  const reach = s.find(([t, r]) => t >= start[0] && r >= steady * 0.9);
  const run = reach ? within(s, start[0], reach[0]) : [];
  let dips = 0, gap = 0;
  for (let i = 1; i < run.length; i += 1) { if (run[i][1] < run[i - 1][1] - 0.05) dips += 1; gap = Math.max(gap, run[i][0] - run[i - 1][0]); }
  return { moving: start[0] - first, to90: reach ? reach[0] - start[0] : null, dips, gap };
};
const U1 = (u) => u.moving != null && u.moving >= 800 && u.moving <= 2500;
const U2 = (u) => u.to90 != null && u.to90 >= 1500 && u.dips === 0 && u.gap <= 600;
const judgeDown = (s, last, until) => {
  const r0 = at(s, last);
  const after = within(s, last, until);
  let prev = r0, rise = 0;
  for (const [, r] of after) { rise = Math.max(rise, r - prev); prev = r; }
  const drop = after.find(([, r]) => r < r0 * 0.95);
  const rest = after.find(([, r]) => r === 0);
  let gap = 0;
  if (drop && rest) { const run = within(s, drop[0], rest[0]); for (let i = 1; i < run.length; i += 1) gap = Math.max(gap, run[i][0] - run[i - 1][0]); }
  return { r0, hold: drop ? drop[0] - last : null, rise, gap, ramp: drop && rest ? rest[0] - drop[0] : null, rest: rest ? rest[0] - last : null };
};
const D1 = (d) => d.r0 > 0 && d.hold != null && d.hold >= 900;
const D3 = (d) => d.ramp != null && d.ramp >= 1800 && d.gap <= 600 && d.rest >= 2500 && d.rest <= 6500;
// the real motion: speed over 300 ms windows of the sampled currentTime
const judgeMotion = (samples, from, to) => {
  const v = samples.filter(([t]) => t >= from && t <= to);
  const speeds = [];
  for (let i = 3; i < v.length; i += 1) speeds.push((v[i][1] - v[i - 3][1]) / (v[i][0] - v[i - 3][0]));
  let rise = 0, low = Infinity, back = 0;
  for (let i = 0; i < speeds.length; i += 1) { if (low < Infinity) rise = Math.max(rise, speeds[i] - low); low = Math.min(low, speeds[i]); }
  for (let i = 1; i < v.length; i += 1) back = Math.max(back, v[i - 1][1] - v[i][1]);
  return { windows: speeds.length, rise, back };
};
const D2 = (d, m) => d.rise <= 0.02 && m.windows > 20 && m.rise <= 0.25 && m.back <= 40;

const INSTRUMENT = `(() => { if (window.__p142) return; const I = window.__p142 = { rates: [], keys: [], motion: [], snaps: [] };
  const inCor = (a) => { const tg = a.effect && a.effect.target; return !!(tg && tg.closest && tg.closest('[data-flux3-corridor]')); };
  const upr = Animation.prototype.updatePlaybackRate;
  Animation.prototype.updatePlaybackRate = function (r) { if (inCor(this)) I.rates.push([performance.now(), r]); return upr.call(this, r); };
  const d = Object.getOwnPropertyDescriptor(Animation.prototype, 'currentTime');
  Object.defineProperty(Animation.prototype, 'currentTime', { configurable: true, enumerable: true, get: d.get, set: function (v) { if (inCor(this)) I.snaps.push([performance.now(), v - d.get.call(this), v]); d.set.call(this, v); } });
  window.addEventListener('keydown', () => I.keys.push(performance.now()), true);
  let anim = null;
  setInterval(() => { const c = document.querySelector('[data-flux3-corridor]'); if (!c) return; if (!anim || !anim.effect || !anim.effect.target.isConnected) anim = c.getAnimations({ subtree: true }).find((a) => 'animationName' in a && a.effect.getTiming().iterations === Infinity) || null; if (anim) I.motion.push([performance.now(), d.get.call(anim)]); }, 100);
})()`;

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const soft = async (expr, timeout = 20000) => { try { await app.waitFor(expr, { label: expr.slice(0, 60), timeout }); return true; } catch { return false; } };
  await app.cdp('Page.addScriptToEvaluateOnNewDocument', { source: INSTRUMENT });
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','flux'); true");
  await app.reload();
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams', timeout: 20000 });
  await ev(`window.wrizoCreateJournalPage(${J({ id: 'p142', text: 'The tunnel waits for her.', createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })}); window.wrizoFlushNow(); true`);
  await ev("history.replaceState(null, '', '/#/page/p142'); true");
  await app.reload();
  await soft("!!document.querySelector('[data-flux3-corridor]')");
  await soft("!document.querySelector('.wz-splash')");
  await sleep(4600);
  await ev("document.querySelector('.forward-only-editor').focus({ preventScroll: true }); true");
  const now = () => ev('performance.now()');
  const GAPS = [450, 600, 350, 900, 500, 400, 700, 450];   // steady writing, about 4 keys a second
  const write = async (ms) => { const end = Date.now() + ms; let i = 0; while (Date.now() < end) { for (const ch of 'words') { await app.typeKeys(ch); await sleep(150); } await app.typeKeys(' '); await sleep(GAPS[i % GAPS.length]); i += 1; } };
  const read = () => ev('({ rates: window.__p142.rates.slice(), keys: window.__p142.keys.slice(), motion: window.__p142.motion.slice(), snaps: window.__p142.snaps.slice() })');
  const burst = async (ms) => {
    const t0 = await now();
    await write(ms);
    await sleep(9000);
    const t1 = await now();
    const data = await read();
    const keys = data.keys.filter((t) => t >= t0 && t <= t1);
    return { t0, t1, first: keys[0], last: keys[keys.length - 1], data };
  };

  const a = await burst(14000);
  const b = await burst(6000);
  // R: she comes back during the slow-down
  const c0 = await now();
  await write(8000);
  const cLast = (await read()).keys.slice(-1)[0];
  // she comes back 1.9 s after her last key: early in the slow-down. (Timed from the key, not from the loop's end: the loop ends on a breath of 0.35 to 0.9 s, and a return that late found the tunnel already
  // at rest on one leg of run 46032563996. A return that comes as it is settling lets it rest a moment and ramp up again.)
  await sleep(Math.max(0, cLast + 1900 - (await now())));
  const cBack = await now();
  await write(7000);
  const c1 = await now();
  await sleep(9000);

  const all = await read();
  const s = settings(all.rates);
  const steady = (() => { const v = within(s, a.first + 7000, a.last).map(([, r]) => r); v.push(at(s, a.first + 7000)); return v.reduce((m, x) => m + x, 0) / v.length; })();
  const up = judgeUp(s, a.first, steady);
  console.log(`MEASURE steady ${r2(steady)}; up ${J(up)}`);
  ok(`U1 from rest it waits, then moves (${r2(up.moving)} ms after her first key)`, U1(up), J(up));
  ok(`U2 one ramp up (${r2(up.to90)} ms to 90%, ${up.dips} dips, longest gap ${r2(up.gap)} ms)`, U2(up), J(within(s, a.first, a.first + 6000).map(([t, r]) => [Math.round(t - a.first), r2(r)])));

  for (const [n, x] of [[1, a], [2, b]]) {
    const d = judgeDown(s, x.last, x.t1);
    const m = judgeMotion(all.motion, x.last, x.last + 8000);
    const trace = J(within(s, x.last - 300, x.t1).map(([t, r]) => [Math.round(t - x.last), r2(r)]));
    console.log(`MEASURE stop ${n}: ${J(d)} motion ${J(m)}`);
    ok(`D1.${n} the speed holds after her last key (${r2(d.hold)} ms)`, D1(d), trace);
    ok(`D2.${n} it only ever slows (biggest rise set ${r2(d.rise)}; real motion rise ${r2(m.rise)}, back ${r2(m.back)} ms)`, D2(d, m), trace);
    ok(`D3.${n} one ramp down (${r2(d.ramp)} ms, longest gap ${r2(d.gap)} ms), at rest ${r2(d.rest)} ms after her last key`, D3(d), trace);
    const snap = all.snaps.filter(([t]) => t >= x.last && t <= x.t1);
    const rested = all.motion.filter(([t]) => t <= x.t1).slice(-1)[0];
    const off = rested ? Math.min(rested[1] % STEP, STEP - (rested[1] % STEP)) : null;
    ok(`D4.${n} at rest on a slot (${r2(off)} ms off), without a jump (largest correction ${r2(Math.max(0, ...snap.map(([, j]) => Math.abs(j))))} ms)`, off != null && off <= 8 && snap.every(([, j]) => Math.abs(j) <= 40), J(snap));
  }

  const rBefore = at(s, cLast + 900);   // the speed it holds before it starts to slow
  const resumed = all.keys.find((t) => t >= cBack);
  const dipWindow = within(s, cLast, resumed + 4000);
  const low = Math.min(rBefore, ...dipWindow.map(([, r]) => r));
  const atResume = at(s, resumed);
  const soon = at(s, resumed + 800);
  const later = at(s, resumed + 5000);
  ok(`R she writes again during the slow-down: still slowing 0.8 s later (${r2(atResume)} then ${r2(soon)}), never stops (low ${r2(low)}), then back up (${r2(later)} of ${r2(rBefore)})`,
    atResume > 0 && atResume < rBefore && soon <= atResume + 0.02 && low > 0 && later >= rBefore * 0.7, J(within(s, cLast, resumed + 6000).map(([t, r]) => [Math.round(t - resumed), r2(r)])));

  let step = 0;
  for (let i = 1; i < s.length; i += 1) step = Math.max(step, Math.abs(s[i][1] - s[i - 1][1]));
  const perSec = within(s, a.first, a.last).length / ((a.last - a.first) / 1000);
  ok(`B every change is small (largest ${r2(step)}), set at most 4 times a second (${r2(perSec)}/s)`, step <= 0.5 && perSec <= 4.6, '');
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); ok('HARNESS ' + String(e && e.message || e).slice(0, 300), false); }

const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'flux3', 'FluxCorridor.tsx'), 'utf8').replace(/\r\n/g, '\n');
ok('K nothing on the key path: the key handler only stamps the time', /const onKey = \(e: KeyboardEvent\) => \{ if \(e\.key\.length === 1 \|\| e\.key === 'Enter' \|\| e\.key === 'Backspace'\) keys\.push\(performance\.now\(\)\); \};/.test(src));

// MUT: a stepped ramp, a false stop with a lurch, and a jump
const stepped = [[0, 1.6], [1200, 1.6], [1500, 1.0], [3300, 1.0], [3550, 0.4], [5200, 0]];
const lurch = [[0, 1.6], [1250, 1.4], [1500, 1.0], [1750, 0.6], [2000, 0.2], [2250, 0.5], [3000, 0]];
const smooth = [[0, 1.6], [1250, 1.5], [1500, 1.35], [1750, 1.15], [2000, 0.95], [2250, 0.75], [2500, 0.55], [2750, 0.4], [3000, 0.27], [3250, 0.16], [3500, 0.08], [3750, 0.03], [4000, 0]];
const jumpMotion = judgeMotion([...Array(30)].map((_, i) => [i * 100, i < 20 ? 1000 - (30 - i) : 900]), 0, 3000);
ok('MUT the judges go RED on a stepped trace, on a lurch and on a jump, and pass a smooth stop',
  !D3(judgeDown(stepped, 100, 9000)) && judgeDown(lurch, 100, 9000).rise > 0.02 && jumpMotion.back > 40 && D1(judgeDown(smooth, 100, 9000)) && D3(judgeDown(smooth, 100, 9000)) && judgeDown(smooth, 100, 9000).rise <= 0.02);

const bad = checks.filter((c) => !c.pass).length;
if (process.env.HARNESS_PARKED === '1') console.log('\nWIREIN-TUNNEL-RAMP PARKED: PASS (0 records) - a new file; it parks nothing of its own');
console.log(bad ? `\nWIREIN-TUNNEL-RAMP VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nWIREIN-TUNNEL-RAMP VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
