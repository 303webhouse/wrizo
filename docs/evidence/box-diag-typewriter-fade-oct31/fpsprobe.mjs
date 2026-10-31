// Frame rate and native smooth-scroll timing in the harness browser, right now.
import { pathToFileURL } from 'node:url';
const { withHarness } = await import(pathToFileURL('C:/Users/nickh/train-12d/apps/desktop/scripts/runtime-verify.mjs').href);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await withHarness(async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await sleep(1500);
  await app.evalJs("(window.__fr = 0, window.__t0 = performance.now(), (function tick(){ window.__fr++; requestAnimationFrame(tick); })(), 1)");
  await sleep(2000);
  const fps = await app.evalJs("JSON.stringify({ frames: window.__fr, ms: Math.round(performance.now() - window.__t0), fps: Math.round(window.__fr / ((performance.now() - window.__t0) / 1000)) })");
  console.log('FPS ' + fps);
  // native smooth scroll of a one-line step (27px), a 5-line step, and 600px, each timed to settle
  await app.evalJs("(() => { const d = document.createElement('div'); d.id = '__sc'; d.style.cssText = 'position:fixed;left:0;top:0;width:300px;height:400px;overflow:auto;z-index:99999;background:#fff'; const i = document.createElement('div'); i.style.height = '5000px'; d.appendChild(i); document.body.appendChild(d); return 1; })()");
  for (const dist of [27, 136, 600]) {
    await app.evalJs("document.getElementById('__sc').scrollTop = 0; 1");
    await sleep(300);
    await app.evalJs(`(() => { const d = document.getElementById('__sc'); window.__s0 = performance.now(); window.__done = 0; d.scrollTo({ top: ${dist}, behavior: 'smooth' }); (function chk(){ if (Math.abs(d.scrollTop - ${dist}) < 1) { window.__done = Math.round(performance.now() - window.__s0); } else requestAnimationFrame(chk); })(); return 1; })()`);
    await sleep(4500);
    console.log('SMOOTH ' + dist + 'px settled in ms: ' + await app.evalJs('window.__done'));
  }
});
