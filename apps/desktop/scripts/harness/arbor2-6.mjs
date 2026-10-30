// ARBOR v2 MOCKUP - §14 item 6, BROWSER half: the day room's pergola light (src/arbor2/sun.ts + styles/arbor-v2.css). The arithmetic of
// the afternoon is arbor2-6-unit.mjs.
//   L1  day: the light layer is drawn, at the afternoon's strength (.10-.22); night: not drawn
//   L2  never over the prose column: the layer is fixed at z-index -1 under body (behind every surface) and the page paints an opaque paper
//   L3  flutter budget: over 20 s every flutter is one cluster at a time, 300-600 ms long, starts >= 6 s apart (<= 1 event/s)
//   L4  nothing stored: localStorage byte-equal across the watch; the afternoon is a number on <html>, never in storage
//   L5  reduced motion: a still frame - the layer and its leaves run no animation, and no flutter fires
//   (Oct 29, after INK's CI frames showed the slats through Free Write's zoomed page - Fable: "NEVER cross the prose column, including
//   through the page's see-through fades; the night fade must not turn the paper into a band". L2 and L5 are parked below with successors.)
//   L2b on the ZOOMED Free Write page (Typewriter, the see-through band mask), night and day: an opaque sheet in the page's paper colour lies
//       behind the whole visible page (stopping at the progress row); the room's vignette has a hole over it; by day the sun layer's evenodd
//       clip has a hole covering it (scripts/frames/arbor2.mjs zoomProof)
//   L1c with motion, the drift runs on the inner sheet and the layer itself holds still (so the hole never drifts onto the page)
//   L5b reduced motion: the drift sheet is still too
//   L2c (Fable, Oct 29: "the zoomed page is unframed, so give the opaque night sheet no visible edge") replaces L2b: the sheet fades out at
//       every side, the page draws no edge of its own, the vignette is the sheet's exact complement; by day the sun's hole still covers it
import fs from 'node:fs';
import path from 'node:path';
import { withHarness } from '../runtime-verify.mjs';
import { zoomProof, holeOf, stopsOf } from '../frames/arbor2.mjs';

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
  const cs = s ? getComputedStyle(s) : null, leaf = s && s.querySelector('.arbor2-sun-leaf'), drift = s && s.querySelector('.arbor2-sun-drift');
  return { sun: cs ? { display: cs.display, opacity: +cs.opacity, z: cs.zIndex, pos: cs.position, parent: s.parentElement.tagName, anim: cs.animationName, leafAnim: leaf ? getComputedStyle(leaf).animationName : null, driftAnim: drift ? getComputedStyle(drift).animationName : null, still: s.getAttribute('data-still') } : null,
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
  // PARKED 2026-10-29 (SUPERSEDED: it passed while INK's CI frames showed the slats THROUGH Free Write's zoomed page - an opaque paper is
  // not "never over the prose column" when Typewriter's band mask makes the page see-through, and this leg only ever opened a Draft chapter,
  // which is not zoomed). Original, verbatim:
  // ok('L2 never over the prose column: fixed, z-index -1, a child of body (behind every surface), and the paper is opaque', !!day.sun && day.sun.z === '-1' && day.sun.pos === 'fixed' && day.sun.parent === 'BODY' && day.paper === 'rgb(243, 237, 225)', JSON.stringify({ sun: day.sun, paper: day.paper }));
  // SUCCESSOR: L2's own layer facts stay here as L2a; the prose-column claim is L2b, measured on the zoomed Free Write page below.
  ok('L2a the light layer is fixed, z-index -1, a child of body (behind every surface), and the paper is opaque', !!day.sun && day.sun.z === '-1' && day.sun.pos === 'fixed' && day.sun.parent === 'BODY' && day.paper === 'rgb(243, 237, 225)', JSON.stringify({ sun: day.sun, paper: day.paper }));
  ok('L1c with motion: the drift runs on the inner sheet and the layer itself holds still', !!day.sun && day.sun.driftAnim === 'arbor2-sun-drift' && day.sun.anim === 'none', JSON.stringify(day.sun));
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

  // L2b: the ZOOMED Free Write page (seeded through the seam; the flag stays, it sits before the hash)
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'arbor6-zoom', text: 'The morning light came in low across the table, and she began to write. The kettle ticked as it cooled.', createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await app.evalJs("location.hash = '#/page/arbor6-zoom'");
  const zoomed = await app.waitFor("!!document.querySelector('.mode-pagecol[data-zoom=\"true\"]')", { label: 'typewriter zoom', timeout: 6000 }).then(() => true, () => false);
  await sleep(700);
  // PARKED 2026-10-29 (SUPERSEDED, never run: Fable ruled the zoomed page unframed - "give the opaque night sheet no visible edge" - so the
  // hard sheet and the vignette's hard hole it certified are gone; zoomProof now takes (holeOf, stopsOf) and reports sheet/bare/edgeless/
  // whole/seamless). Original, verbatim:
  // for (const room of ['Night', 'Day']) {
  //   await pickBar(app, room); await sleep(500);
  //   const z = await app.evalJs(`(${zoomProof.toString()})(${holeOf.toString()})`);
  //   ok(`L2b [${room.toLowerCase()}] zoomed Free Write: an opaque paper sheet behind the whole visible page (above the progress row), the vignette cut over it${room === 'Day' ? ', and the sun layer has a hole over it' : ''}`,
  //     zoomed && !!z && z.pass && z.paper === true && z.vignette === true && (room === 'Day' ? z.hole === true : z.hole === null), JSON.stringify({ zoomed, z }));
  //   await snap(app, `item6-${room.toLowerCase()}-zoomed-freewrite`);
  // }
  // SUCCESSOR L2c: the same page, night and day - a whole sheet with no visible edge (it fades out at every side, the page draws none of its
  // own, the vignette is its exact complement), and by day the sun's hole still covers it.
  for (const room of ['Night', 'Day']) {
    await pickBar(app, room); await sleep(500);
    const z = await app.evalJs(`(${zoomProof.toString()})(${holeOf.toString()}, ${stopsOf.toString()})`);
    ok(`L2c [${room.toLowerCase()}] zoomed Free Write: a whole paper sheet with no visible edge behind the visible page (above the progress row)${room === 'Day' ? ', and the sun layer has a hole over it' : ''}`,
      zoomed && !!z && z.pass && z.sheet && z.bare && z.edgeless && z.whole && z.seamless && (room === 'Day' ? z.hole === true : z.hole === null), JSON.stringify({ zoomed, z }));
    await snap(app, `item6-${room.toLowerCase()}-zoomed-freewrite`);
  }

  // L5: reduced motion from the load (sun.ts reads it once at mount)
  await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await app.reload(); await splashGone(app); await sleep(500);
  await pickBar(app, 'Day'); await sleep(300);
  await app.evalJs("window.__f2 = 0; new MutationObserver(() => { window.__f2++; }).observe(document.querySelector('.arbor2-sun'), { subtree: true, attributes: true, attributeFilter: ['data-flutter'] })");
  await sleep(14000);
  const rm = await read(app);
  const f2 = await app.evalJs('window.__f2');
  // PARKED 2026-10-29 (SUPERSEDED: the drift moved from the layer to its inner sheet so the page hole holds still - `rm.sun.anim` is now
  // 'none' WITH motion too, so this check went blind to the drift). Original, verbatim:
  // ok('L5 reduced motion: a still frame - no drift, no leaf animation, no flutter in 14 s', !!rm.sun && rm.sun.still === 'true' && rm.sun.anim === 'none' && rm.sun.leafAnim === 'none' && f2 === 0, JSON.stringify({ sun: rm.sun, flutters: f2 }));
  // SUCCESSOR L5b: the same, plus the drift sheet itself is still.
  ok('L5b reduced motion: a still frame - no drift (layer AND drift sheet), no leaf animation, no flutter in 14 s', !!rm.sun && rm.sun.still === 'true' && rm.sun.anim === 'none' && rm.sun.driftAnim === 'none' && rm.sun.leafAnim === 'none' && f2 === 0, JSON.stringify({ sun: rm.sun, flutters: f2 }));
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
