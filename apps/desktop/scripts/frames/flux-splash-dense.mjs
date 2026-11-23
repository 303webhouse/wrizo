// FLUX'S SPLASH AND MARK, A DENSE FRAME PASS (the Wrizors' flash guard; Fable, Nov 23, 2:30 pm): a frame every 33 ms or less through the run's signal loss and through each idle glitch,
// so a reader can count flashes frame by frame. For the frames job (apps/desktop/scripts/ci-frames.mjs), every screen at ?flux3=1&reorg=1:
//   gh workflow run frames.yml --ref ci/actions-harness -f ref=<branch> -f themes=flux -f tones=dark -f widths=1366 -f screens_file=apps/desktop/scripts/frames/flux-splash-dense.mjs
//     -f screens=flux5-dense-run,flux5-dense-door,flux5-dense-app
//   flux5-dense-run    the live opening splash (it declares `liveSplash`, the frames job's opt-in) held and stepped by the product's own seam, window.wrizoFluxSplash.seek(ms):
//                      a frame at every 33 ms from 0 to the doors being live (3,750 ms), the signal loss (2,900 to 3,320 ms) included. Nothing is timed by the runner: the run is read at the instants named.
//   flux5-dense-door   the front door's mark glitching on its own idle clock: the page's clock and animation frames are the harness's (performance.now and requestAnimationFrame), advanced 33 ms a frame,
//   flux5-dense-app    the in-app mark the same, so a glitch (tear, decode, signal) is read at every 33 ms of its 460, whatever the runner's speed. At least one of each mode is taken (up to 12 glitches).
// Each pass writes its frames under <out>/dense/<screen>__<theme>-<tone>__<width>/ as NNNN_<ms>.png, and dense.json beside them (the instants, md5s, and the page's own flash log).
import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const QUERY = 'flux3=1&reorg=1';
const STEP = 33;
const arg = (name, dflt) => { const i = process.argv.indexOf('--' + name); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt; };
const OUT = path.resolve(arg('out', 'frames-out'));
const md5 = (b) => createHash('md5').update(b).digest('hex');

const folder = (name, ctx) => { const d = path.join(OUT, 'dense', `${name}__${ctx.theme}-${ctx.tone}__${ctx.width}`); mkdirSync(d, { recursive: true }); return d; };
const shoot = async (app, dir, n, ms) => {
  const buf = Buffer.from(await app.screenshot(), 'base64');
  const file = `${String(n).padStart(4, '0')}_${String(Math.round(ms)).padStart(5, '0')}.png`;
  writeFileSync(path.join(dir, file), buf);
  return { file, ms: Math.round(ms), md5: md5(buf) };
};
const settle = (app) => app.evalJs('new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true))))');

// the page's clock, handed to the harness: performance.now holds still and moves only by __vstep(ms), which runs the animation frames asked for since, at the new time
const VCLOCK = `(() => {
  if (window.__vstep) return true;
  let vt = performance.now(), q = [], id = 0;
  window.__wzVerifyFlashes = true; window.__wzFlashLog = [];
  performance.now = () => vt;
  window.requestAnimationFrame = (cb) => { id += 1; q.push([id, cb]); return id; };
  window.cancelAnimationFrame = (i) => { q = q.filter((e) => e[0] !== i); };
  window.__vstep = (ms) => { vt += ms; const run = q; q = []; run.forEach((e) => e[1](vt)); return vt; };
  return true; })()`;

const front = async (app) => {
  process.env.WS_ANON = '1';
  await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  await app.evalJs(`history.replaceState(null, '', '/?${QUERY}#/'); null`);
  await app.reload();
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
  if (!(await waitSoft(app, "(() => { const d = document.querySelector('.wz-flux5 [data-flux-door=compose]'); return !!d && !d.hasAttribute('data-wait'); })()", { label: 'the doors', timeout: 10000 }))) throw new Error('the v5 doors did not come up');
  await sleep(500);
};
const page = async (app, id) => {
  process.env.WS_ANON = '0';
  await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: 'The morning light came in low across the table, and she began to write.', createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })}); localStorage.setItem('wrizo-mode-page-${id}', 'journal'); history.replaceState(null, '', '/?${QUERY}#/page/${id}'); null`);
  await app.reload();
  await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'the page', timeout: 15000 });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
  if (!(await waitSoft(app, "!!document.querySelector('[data-flux-appmark]')", { label: 'the in-app mark', timeout: 5000 }))) throw new Error('the in-app mark is not on the page');
  await sleep(700);
};

// glitches, read at 33 ms: the mark is `markSel`; the clock is the harness's.
const glitches = async (app, name, ctx, markSel) => {
  const dir = folder(name, ctx);
  await app.evalJs(VCLOCK);
  await app.evalJs('window.__f3MarkIdleShift = 61; true');
  const seen = {}, takes = [];
  let n = 0;
  for (let g = 0; g < 12 && !(seen.tear && seen.decode && seen.signal); g += 1) {
    // idle: the page's clock goes on six seconds once (the door's own idle period is five), then it is only LOOKED at: the page's own 200 ms interval (real time) decides when a glitch begins,
    // and its first animation frame is run by a step of 0 (a step of a second would end the glitch before it was read)
    let mode = null;
    await app.evalJs('window.__vstep(6000)');
    for (let i = 0; i < 200 && !mode; i += 1) {
      await sleep(60);
      await app.evalJs('window.__vstep(33)');   // a 33 ms step a look: the in-app mark waits out the page's own screen-wide glitch (useJacked), which runs on these steps too
      mode = await app.evalJs(`(() => { const m = document.querySelector(${JSON.stringify(markSel)}); return m ? m.getAttribute('data-glitch') : null; })()`);
    }
    if (!mode) { takes.push({ glitch: g, error: 'no glitch began' }); break; }
    const frames = [];
    let ms = 0;
    for (;;) {
      await sleep(30);   // (animation frames are the harness's here: nothing to wait on but the screenshot)
      // the cursor as the page holds it in this frame: the mark's own visibility (the glitch code sets it) and the computed opacity (the CSS blink, flux5-blink, 1.05 s: on the browser's own clock, which the harness's does not move)
      const cur = await app.evalJs(`(() => { const m = document.querySelector(${JSON.stringify(markSel)}); const c = m && m.querySelector('[data-flux-cursor]'); if (!c) return null; return { visibility: c.getAttribute('visibility'), opacity: getComputedStyle(c).opacity, glitch: m.getAttribute('data-glitch') }; })()`);
      const fr = await shoot(app, dir, n, ms); fr.cursor = cur; frames.push(fr); n += 1;
      await app.evalJs(`window.__vstep(${STEP})`);
      ms += STEP;
      const now = await app.evalJs(`(() => { const m = document.querySelector(${JSON.stringify(markSel)}); return m ? m.getAttribute('data-glitch') : null; })()`);
      if (!now || ms > 900) break;
    }
    seen[mode] = (seen[mode] || 0) + 1;
    takes.push({ glitch: g, mode, stepMs: STEP, frames });
  }
  const flashLog = await app.evalJs('window.__wzFlashLog || []');
  // THE DECODE CURSOR (the Wrizors' REAL 2): a frame where the cursor reads absent - the glitch code, or the blink's off phase? Counted per mode: hidden by the code (visibility), visible by the code but at opacity 0 (the blink), shown.
  const cursorReading = {};
  for (const t of takes) for (const f of t.frames || []) { const c = (cursorReading[t.mode || '?'] ||= { frames: 0, hiddenByCode: 0, offByBlink: 0, shown: 0 }); c.frames += 1; if (f.cursor && f.cursor.visibility === 'hidden') c.hiddenByCode += 1; else if (f.cursor && f.cursor.opacity === '0') c.offByBlink += 1; else c.shown += 1; }
  writeFileSync(path.join(dir, 'dense.json'), JSON.stringify({ screen: name, stepMs: STEP, seen, cursorReading, takes, flashLog }, null, 2) + '\n');
  console.log('DENSE cursor ' + name + ' ' + JSON.stringify(cursorReading));
  if (!(seen.tear && seen.decode && seen.signal)) {
    // what the page said: why no glitch began (the in-app mark glitches only while flicker is on, the ambiance dial is up and no corridor is jacked in; its own flash budget may be spent by the page's)
    const why = await app.evalJs(`(() => { const a = document.querySelector('[data-flux-appmark]'); const m = document.querySelector(${JSON.stringify(markSel)}); return { appmark: !!a, mark: !!m, glitch: m ? m.getAttribute('data-glitch') : null, shift: window.__f3MarkIdleShift, jacked: document.documentElement.hasAttribute('data-flux3-jacked'), hidden: document.hidden, ambiance: document.documentElement.getAttribute('data-ambiance'), flashes: (window.__wzFlashLog || []).slice(-6) }; })()`);
    throw new Error(`glitches seen: ${JSON.stringify(seen)}; page: ${JSON.stringify(why)}`);
  }
};

const run = async (app, ctx) => {
  const dir = folder('flux5-dense-run', ctx);
  // the splash is live (the frames job waited for it). Hold it for the whole read: the floor's own backstop timer is set long, then it is loaded again, and the run is frozen at 0 at once.
  await app.evalJs("localStorage.setItem('wrizo-splash-hold', '120000'); null");
  await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  await app.evalJs(`history.replaceState(null, '', '/?${QUERY}#/'); null`);
  await app.reload();
  if (!(await waitSoft(app, "!!document.querySelector('.wz-splash .wz-flux5') && !!window.wrizoFluxSplash", { label: 'the live v5 run', timeout: 15000 }))) throw new Error('the v5 run is not on screen');
  const done = await app.evalJs('window.wrizoFluxSplash.DONE');
  await app.evalJs('window.__wzVerifyFlashes = true; window.wrizoFluxSplash.seek(0); true');
  const frames = [];
  let n = 0;
  for (let ms = 0; ms < done; ms += STEP) {
    await app.evalJs(`window.wrizoFluxSplash.seek(${ms})`);
    await settle(app);
    frames.push(await shoot(app, dir, n, ms)); n += 1;
  }
  await app.evalJs(`window.wrizoFluxSplash.seek(${done - 1})`);
  await settle(app);
  frames.push(await shoot(app, dir, n, done - 1));
  const flashLog = await app.evalJs('window.__wzFlashLog || []');
  writeFileSync(path.join(dir, 'dense.json'), JSON.stringify({ screen: 'flux5-dense-run', stepMs: STEP, doneMs: done, signalLossMs: [2900, 3320], frames, flashLog }, null, 2) + '\n');
  await app.evalJs(`window.wrizoFluxSplash.seek(${done}); true`);   // the doors are live: the splash hands over, as it does at the end of the run
  await sleep(300);
};
run.liveSplash = true;

export default {
  'flux5-dense-run': run,
  'flux5-dense-door': async (app, ctx) => { await front(app); await glitches(app, 'flux5-dense-door', ctx, '.wz-flux5 [data-flux-mark]'); },
  'flux5-dense-app': async (app, ctx) => { await page(app, `f5-dense-${ctx.tone}-${ctx.width}`); await glitches(app, 'flux5-dense-app', ctx, '[data-flux-appmark] [data-flux-mark]'); },
};
