// ARBOR v2 MOCKUP - §14 item 6, BROWSER half: the day room's pergola light (src/arbor2/sun.ts + styles/arbor-v2.css). The arithmetic of
// the afternoon is arbor2-6-unit.mjs.
//   L1  day: the light layer is drawn, at the afternoon's strength (.10-.22); night: not drawn
//   L2  never over the prose column: the layer is fixed at z-index -1 under body (behind every surface) and the page paints an opaque paper
//   L3  flutter budget: over 20 s every flutter is one cluster at a time, 300-600 ms long, starts >= 6 s apart (<= 1 event/s)
//   L4  nothing stored: localStorage byte-equal across the watch; the afternoon is a number on <html>, never in storage
//   L5  reduced motion: a still frame - the layer and its leaves run no animation, and no flutter fires
import fs from 'node:fs';
import path from 'node:path';
import { withHarness } from '../runtime-verify.mjs';

const SHOTS = process.env.ARBOR_SHOTS || null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const snap = async (app, name) => { if (SHOTS) fs.writeFileSync(path.join(SHOTS, `${name}.png`), Buffer.from((await app.cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64')); };
const splashGone = (app) => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 20000, label: 'splash gone' }).catch(() => {});
const pickBar = (app, label) => app.evalJs(`(() => { const b = [...document.querySelectorAll('.arbor2-bar-opt')].find((x) => x.textContent.trim() === ${JSON.stringify(label)}); if (b) b.click(); return !!b; })()`);
const READ = `(() => {
  const s = document.querySelector('.arbor2-sun'), p = document.querySelector('.mode-page');
  const cs = s ? getComputedStyle(s) : null, leaf = s && s.querySelector('.arbor2-sun-leaf');
  return { sun: cs ? { display: cs.display, opacity: +cs.opacity, z: cs.zIndex, pos: cs.position, parent: s.parentElement.tagName, anim: cs.animationName, leafAnim: leaf ? getComputedStyle(leaf).animationName : null, still: s.getAttribute('data-still') } : null,
    paper: p ? getComputedStyle(p).backgroundColor : null, t: document.documentElement.style.getPropertyValue('--arbor2-afternoon'),
    ls: JSON.stringify(Object.keys(localStorage).sort().map((k) => [k, localStorage.getItem(k)])) };
})()`;
const read = (app) => app.evalJs(READ);
const openPage = async (app) => {
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted' });
  await splashGone(app); await sleep(500);
  await app.evalJs("history.replaceState(null, '', '/?arbor2=1' + location.hash)");
};

await withHarness(async (app) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.emulateDpr(1, 1366, 768);
  await openPage(app);
  await app.reload(); await splashGone(app); await sleep(500);
  await app.waitFor("!!document.querySelector('.arbor2-bar')", { label: 'flagged' }).catch(() => {});

  await pickBar(app, 'Day'); await sleep(300);
  const day = await read(app);
  ok('L1 day: the light layer is drawn, at the afternoon\'s strength (.10-.22)', !!day.sun && day.sun.display === 'block' && day.sun.opacity >= 0.0999 && day.sun.opacity <= 0.2201, JSON.stringify({ sun: day.sun, t: day.t }));
  ok('L2 never over the prose column: fixed, z-index -1, a child of body (behind every surface), and the paper is opaque', !!day.sun && day.sun.z === '-1' && day.sun.pos === 'fixed' && day.sun.parent === 'BODY' && day.paper === 'rgb(243, 237, 225)', JSON.stringify({ sun: day.sun, paper: day.paper }));
  await snap(app, 'item6-day-shadows-1366');

  await app.evalJs(`(() => { window.__flut = []; const seen = new Map(); window.__fo && window.__fo.disconnect(); window.__fo = new MutationObserver((ms) => { for (const m of ms) { const el = m.target; const on = el.getAttribute('data-flutter') === 'true'; if (on) seen.set(el, performance.now()); else if (seen.has(el)) { window.__flut.push([Math.round(seen.get(el)), Math.round(performance.now() - seen.get(el)), document.querySelectorAll('.arbor2-sun-leaf[data-flutter="true"]').length]); seen.delete(el); } } }); document.querySelectorAll('.arbor2-sun-leaf').forEach((l) => window.__fo.observe(l, { attributes: true, attributeFilter: ['data-flutter'] })); })()`);
  await sleep(20000);
  const flut = await app.evalJs('window.__flut');
  const after = await read(app);
  const starts = flut.map((f) => f[0]);
  const gaps = starts.slice(1).map((s, i) => s - starts[i]);
  ok('L3 flutter budget: each flutter 300-600 ms, one at a time, starts >= 6 s apart', flut.length >= 1 && flut.every((f) => f[1] >= 250 && f[1] <= 700 && f[2] === 0) && gaps.every((g) => g >= 5900), JSON.stringify({ flut, gaps }));
  ok('L4 nothing stored: localStorage byte-equal across 20 s of the day room', after.ls === day.ls, '');

  await pickBar(app, 'Night'); await sleep(250);
  const night = await read(app);
  ok('L1 night: the light layer is not drawn', !!night.sun && night.sun.display === 'none', JSON.stringify(night.sun));

  // L5: reduced motion from the load (sun.ts reads it once at mount)
  await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await app.reload(); await splashGone(app); await sleep(500);
  await pickBar(app, 'Day'); await sleep(300);
  await app.evalJs("window.__f2 = 0; new MutationObserver(() => { window.__f2++; }).observe(document.querySelector('.arbor2-sun'), { subtree: true, attributes: true, attributeFilter: ['data-flutter'] })");
  await sleep(14000);
  const rm = await read(app);
  const f2 = await app.evalJs('window.__f2');
  ok('L5 reduced motion: a still frame - no drift, no leaf animation, no flutter in 14 s', !!rm.sun && rm.sun.still === 'true' && rm.sun.anim === 'none' && rm.sun.leafAnim === 'none' && f2 === 0, JSON.stringify({ sun: rm.sun, flutters: f2 }));
  await snap(app, 'item6-day-shadows-reduced-motion');
  await app.emulateMedia([]);
  return checks;
}, { label: 'arbor2-6' });

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nARBOR2-6 VERIFY: PASS (${checks.length} checks)` : `\nARBOR2-6 VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
