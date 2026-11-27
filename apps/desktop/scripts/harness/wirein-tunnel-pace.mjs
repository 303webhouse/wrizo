// #140 - WIRE IN'S TUNNEL FOLLOWS HER PACE, NOT EACH KEY (Nick, Nov 26: "the speed of the tunnel is too herky jerky. Almost every keystroke makes the speed of the tunnel vary"; Fable: average the pace over
// a few seconds, change only on a clear step, ease between speeds over a second or more; a pause of a few seconds slows it, a fresh run brings it back up; nothing on the key path).
// Flux, Wire In, 1366 x 768. The corridor's speed is read from the animations' own playbackRate calls. She types at a steady 4 keys a second with ordinary gaps (words of five letters, a breath between).
//   S1  over the steady stretch (after the first 7 s) the speed stays in a narrow band: highest minus lowest at most 1.0 (a rate of 0 to 5)
//   S2  every change of speed is eased: no two settings in a row differ by more than 0.5 while she types
//   S3  she stops: within 5 s it has slowed to under half; within 8 s it holds still (rate 0)
//   S4  she writes again: within 7 s the speed is back (at least 0.7 of the steady speed)
//   S5  it is set at most 4 times a second
//   K   nothing on the key path: the key handler only stamps the time (read from the source)
//   MUT the judges go RED on a jumpy trace and on one that never slows
// Run: node scripts/harness/wirein-tunnel-pace.mjs (from apps/desktop; Actions or the box).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
process.env.WS_ARBOR2 = 'default';
process.env.WS_MACHINA2 = 'default';
const { withHarness } = await import('../runtime-verify.mjs');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? '  ' + String(detail).slice(0, 700) : ''}`); };
const J = (v) => JSON.stringify(v);
const r2 = (v) => (v == null ? null : Math.round(v * 100) / 100);
// one value per setting moment (a tick sets every animation at once)
const settings = (rates) => rates.reduce((a, [t, r]) => { if (!a.length || t - a[a.length - 1][0] > 120) a.push([t, r]); else a[a.length - 1][1] = r; return a; }, []);
const at = (s, t) => { let v = 0; for (const [x, r] of s) { if (x <= t) v = r; else break; } return v; };
const band = (s, from, to) => { const v = [at(s, from), ...s.filter(([t]) => t >= from && t <= to).map(([, r]) => r)]; return { low: Math.min(...v), high: Math.max(...v), mean: v.reduce((m, x) => m + x, 0) / v.length }; };
const biggestStep = (s, from, to) => { let m = 0; let prev = at(s, from); for (const [t, r] of s) { if (t < from || t > to) continue; m = Math.max(m, Math.abs(r - prev)); prev = r; } return m; };
const S1 = (b) => b.low > 0 && b.high - b.low <= 1.0;
const S3 = (steady, at5, at8) => at5 < steady * 0.5 && at8 === 0;

const INSTRUMENT = `(() => { if (window.__p140) return; const I = window.__p140 = { rates: [] };
  const upr = Animation.prototype.updatePlaybackRate;
  Animation.prototype.updatePlaybackRate = function (r) { const tg = this.effect && this.effect.target; if (tg && tg.closest && tg.closest('[data-flux3-corridor]')) I.rates.push([performance.now(), r]); return upr.call(this, r); };
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
  await ev(`window.wrizoCreateJournalPage(${J({ id: 'p140', text: 'The tunnel waits for her.', createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })}); window.wrizoFlushNow(); true`);
  await ev("history.replaceState(null, '', '/#/page/p140'); true");
  await app.reload();
  await soft("!!document.querySelector('[data-flux3-corridor]')");
  await soft("!document.querySelector('.wz-splash')");
  await sleep(4600);
  await ev("document.querySelector('.forward-only-editor').focus({ preventScroll: true }); true");
  const now = () => ev('performance.now()');
  // steady writing: five letters 150 ms apart, a breath after each word (longer now and then): about 4 keys a second
  const GAPS = [450, 600, 350, 900, 500, 400, 700, 450];
  const write = async (ms) => { const end = Date.now() + ms; let i = 0; while (Date.now() < end) { for (const ch of 'words') { await app.typeKeys(ch); await sleep(150); } await app.typeKeys(' '); await sleep(GAPS[i % GAPS.length]); i += 1; } };
  const keysTyped = () => ev("document.querySelector('.forward-only-editor').textContent.length");
  const c0 = await keysTyped();
  const t0 = await now();
  await write(24000);
  const t1 = await now();
  const kps = ((await keysTyped()) - c0) / ((t1 - t0) / 1000);
  await sleep(5000);
  const t5 = await now();
  await sleep(3000);
  const t8 = await now();
  const t9 = await now();
  await write(9000);
  const t10 = await now();
  const s = settings(await ev('window.__p140.rates.slice()'));
  const steady = band(s, t0 + 7000, t1);
  const step = biggestStep(s, t0, t1);
  console.log(`MEASURE ${r2(kps)} keys a second; steady speed ${r2(steady.low)} to ${r2(steady.high)} (mean ${r2(steady.mean)}); biggest single change ${r2(step)}; after 5 s still ${r2(at(s, t5))}, after 8 s ${r2(at(s, t8))}; back to ${r2(at(s, t10))}; ${s.length} settings`);
  ok(`S1 steady writing (${r2(kps)} keys a second): the speed stays in a narrow band (${r2(steady.low)} to ${r2(steady.high)})`, kps > 3 && kps < 5.5 && S1(steady), J(steady));
  ok(`S2 every change of speed is eased (biggest single change ${r2(step)})`, step <= 0.5, J(s.slice(0, 14).map(([t, r]) => [Math.round(t - t0), r2(r)])));
  ok(`S3 she stops: under half within 5 s (${r2(at(s, t5))}), still within 8 s (${r2(at(s, t8))})`, S3(steady.mean, at(s, t5), at(s, t8)), J({ mean: r2(steady.mean) }));
  const back = band(s, t9 + 7000, t10);
  ok(`S4 she writes again: within 7 s the speed is back (${r2(back.mean)} of ${r2(steady.mean)})`, back.mean >= steady.mean * 0.7, J(back));
  const perSec = s.filter(([t]) => t >= t0 && t <= t1).length / ((t1 - t0) / 1000);
  ok(`S5 the speed is set at most 4 times a second (${r2(perSec)}/s)`, perSec <= 4.6, '');
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); ok('HARNESS ' + String(e && e.message || e).slice(0, 300), false); }

const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'flux3', 'FluxCorridor.tsx'), 'utf8').replace(/\r\n/g, '\n');
ok('K nothing on the key path: the key handler only stamps the time', /const onKey = \(e: KeyboardEvent\) => \{ if \(e\.key\.length === 1 \|\| e\.key === 'Enter' \|\| e\.key === 'Backspace'\) keys\.push\(performance\.now\(\)\); \};/.test(src));
const jumpy = settings([[0, 0.4], [300, 2.4], [600, 0.8], [900, 2.1]]);
ok('MUT the judges go RED on a jumpy trace and on one that never slows', !S1(band(jumpy, 0, 1000)) && biggestStep(jumpy, 0, 1000) > 0.5 && !S3(1.6, 1.6, 1.6) && S3(1.6, 0.5, 0) && S1({ low: 1.4, high: 1.9 }));

const bad = checks.filter((c) => !c.pass).length;
if (process.env.HARNESS_PARKED === '1') console.log('\nWIREIN-TUNNEL-PACE PARKED: PASS (0 records) - a new file; it parks nothing of its own');
console.log(bad ? `\nWIREIN-TUNNEL-PACE VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nWIREIN-TUNNEL-PACE VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
