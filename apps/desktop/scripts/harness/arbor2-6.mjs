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
// r9 DRIVER PIN (not an assertion): unset, the room now follows the CLOCK (Fable, Nov 1: Follow the clock / Always day / Always night) and
// the runner's clock is UTC. This file's checks were written for the room the page tone gave (dark = night, light = day), so after every
// flagged reload it chooses that room explicitly (data-room: Always night / Always day). The clock itself is proven in frames/arbor2-r9.mjs.
const pinRoom = (app) => app.evalJs("(() => { const r = document.documentElement; if (/[?&]arbor2=1/.test(location.search)) r.setAttribute('data-room', r.getAttribute('data-page') === 'dark' ? 'dark' : 'light'); })()");
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const snap = async (app, name) => { if (SHOTS) fs.writeFileSync(path.join(SHOTS, `${name}.png`), Buffer.from((await app.cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64')); };
const splashGone = (app) => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 20000, label: 'splash gone' }).catch(() => {});
// (r8: the Room switch lives in the Mood menu, folded by default - the driver opens Mood first when the label is not on screen; no assertion changed)
// (r10 driver fix, no assertion changed: the Room row's buttons read "Day" / "Night" again - the Wrizors, Nov 1, spec §2e - so r9's mapping retires)
// (r17 driver: the Room row left the Mood menu for the Themes menu, under Page - the Wrizors' note, Nov 2 - with the words Light · Dark · By the clock.
// It opens the Themes pop-out, presses the word and closes the pop-out again, as a writer would. No assertion changed.)
const ROOM_WORD = { day: 'Light', night: 'Dark', clock: 'By the clock', Day: 'Light', Night: 'Dark', 'By the clock': 'By the clock' };
// (driver fix after run 41575575711, no assertion changed: opening the Themes menu shuts the Tools drawer - main's Cascade band, requestOpen
// ('cascade') - which the Mood route never did; the picker reopens the Tools drawer when it was open before)
const pickThemesRoom = (app, which) => app.evalJs(`(async () => { const text = ${JSON.stringify(ROOM_WORD[which] ?? which)}; const strip = document.querySelector(".wz-strip-item[data-category='theme']"); if (!strip) return false;
  const tools = !!document.querySelector(".wz-sliver[data-open='true']");
  const was = strip.getAttribute('aria-pressed') === 'true'; if (!was) strip.click(); const t0 = performance.now();
  while (!document.querySelector('.wz-theme-picker') && performance.now() - t0 < 2000) await new Promise((r) => requestAnimationFrame(r));
  const row = [...document.querySelectorAll('.wz-theme-picker .mode-crow')].find((r) => r.querySelector(':scope > span')?.textContent.trim() === 'Room');
  const b = row && [...row.querySelectorAll('.mode-seg button')].find((x) => x.textContent.trim() === text); if (b) b.click(); if (!was) strip.click();
  for (let i = 0; i < 3; i++) await new Promise((r) => requestAnimationFrame(r));
  if (tools && !document.querySelector(".wz-sliver[data-open='true']")) { document.querySelector('.wz-sliver-grip')?.click(); for (let i = 0; i < 3; i++) await new Promise((r) => requestAnimationFrame(r)); }
  return !!b; })()`);
const pickBarMood = async (app, label0) => { const label = label0; await app.evalJs(`(() => { if ([...document.querySelectorAll('.arbor2-bar-opt')].some((x) => x.textContent.trim() === ${JSON.stringify(label)})) return; const m = [...document.querySelectorAll('.arbor2-bar-head')].find((h) => /^Mood/.test(h.textContent.trim()) && h.getAttribute('aria-expanded') !== 'true'); if (m) m.click(); })()`); await new Promise((r) => setTimeout(r, 150)); return app.evalJs(`(() => { const b = [...document.querySelectorAll('.arbor2-bar-opt')].find((x) => x.textContent.trim() === ${JSON.stringify(label)}); if (b) b.click(); return !!b; })()`); };
const pickBar = (app, label) => (['Day', 'Night', 'By the clock'].includes(label) ? pickThemesRoom(app, label) : pickBarMood(app, label));
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
  await app.reload(); await pinRoom(app);
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.emulateDpr(1, 1366, 768);
  await openPage(app);
  await app.reload(); await pinRoom(app); await splashGone(app); await sleep(500);
  await app.waitFor("!!document.querySelector('.arbor2-bar')", { label: 'flagged' }).catch(() => {});

  await pickBar(app, 'Day'); await sleep(300);
  const day = await read(app);
  // PARKED 2026-10-31 (SUPERSEDED, run 41277516402: r5's §7b set the pergola's strength to 18% -> 26% with the afternoon (styles: .18 + .08 t),
  // so the old .10-.22 band fails once t passes .5 - it read .233 at t .667; it had passed only because earlier runs met an earlier clock).
  // Original, verbatim:
  // ok('L1 day: the light layer is drawn, at the afternoon\'s strength (.10-.22)', !!day.sun && day.sun.display === 'block' && day.sun.opacity >= 0.0999 && day.sun.opacity <= 0.2201, JSON.stringify({ sun: day.sun, t: day.t }));
  // SUCCESSOR L1b: the strength is the spec's 18%-26%, and it is the one the afternoon number asks for (.18 + .08 t, to half a percent).
  // PARKED 2026-11-04 (SUPERSEDED by r19, spec draft 35 §18.1 (Nick, Nov 4; handoff-FABLE-arbor-r19.md §1 D), harness run 41904658793, Arbor 8dd766dc: the
  // day light is the Wrizors' painted pergola shadow, drawn as .arbor2-pergola (src/arbor2/pergola.ts) - the old .arbor2-sun layer is no longer
  // drawn (display:none always); the shade's strength is the drawing's own group opacity (#3F4D22 at 20%), not the afternoon's .18-.26). Original, verbatim:
  // ok('L1b day: the light layer is drawn, at the afternoon\'s strength (§7b: .18-.26, = .18 + .08 t)', !!day.sun && day.sun.display === 'block' && day.sun.opacity >= 0.1799 && day.sun.opacity <= 0.2601
  //   && Math.abs(day.sun.opacity - (0.18 + 0.08 * (parseFloat(day.t) || 0))) <= 0.005, JSON.stringify({ sun: day.sun, t: day.t }));
  // SUCCESSOR L1d: by day (at rest) the pergola layer .arbor2-pergola is displayed, fixed, at z-index -1, its opacity the morning handoff's share
  // var(--arbor2-sun-in, 1) (1 at rest; the read waits out the layer's own 3 s opacity transition), and its drawing's g[filter] carries
  // opacity="0.2" (the shade at 20%).
  const PERGOLA = `(() => { const e = document.querySelector('.arbor2-pergola'); if (!e) return null; const cs = getComputedStyle(e), g = e.querySelector('svg g[filter]');
    const v = getComputedStyle(document.documentElement).getPropertyValue('--arbor2-sun-in').trim();
    return { display: cs.display, pos: cs.position, z: cs.zIndex, opacity: +cs.opacity, sunIn: v, want: v === '' ? 1 : parseFloat(v), gOpacity: g ? g.getAttribute('opacity') : null, writing: document.documentElement.getAttribute('data-wz-writing') }; })()`;
  await app.waitFor(`(() => { const p = ${PERGOLA}; return !!p && Math.abs(p.opacity - p.want) <= 0.01; })()`, { timeout: 4000, label: 'pergola settled' }).catch(() => {});
  const perg = await app.evalJs(PERGOLA);
  ok('L1d day: the pergola layer is drawn - displayed, fixed, z-index -1, at opacity var(--arbor2-sun-in, 1) (1 at rest), its shade group at opacity 0.2',
    !!perg && perg.display === 'block' && perg.pos === 'fixed' && perg.z === '-1' && Math.abs(perg.opacity - perg.want) <= 0.01 && perg.gOpacity !== null && Math.abs(parseFloat(perg.gOpacity) - 0.2) < 1e-9, JSON.stringify(perg));
  // PARKED 2026-10-29 (SUPERSEDED: it passed while INK's CI frames showed the slats THROUGH Free Write's zoomed page - an opaque paper is
  // not "never over the prose column" when Typewriter's band mask makes the page see-through, and this leg only ever opened a Draft chapter,
  // which is not zoomed). Original, verbatim:
  // ok('L2 never over the prose column: fixed, z-index -1, a child of body (behind every surface), and the paper is opaque', !!day.sun && day.sun.z === '-1' && day.sun.pos === 'fixed' && day.sun.parent === 'BODY' && day.paper === 'rgb(243, 237, 225)', JSON.stringify({ sun: day.sun, paper: day.paper }));
  // SUCCESSOR: L2's own layer facts stay here as L2a; the prose-column claim is L2b, measured on the zoomed Free Write page below.
  // PARKED 2026-10-30 (SUPERSEDED, first run on INK's shards, run 41014396358: this leg's page IS the zoomed Free Write page there, and under
  // Fable's unframed ruling that page lets go of its own background - the opaque sheet behind it (paper.ts) is the paper). Original, verbatim:
  // ok('L2a the light layer is fixed, z-index -1, a child of body (behind every surface), and the paper is opaque', !!day.sun && day.sun.z === '-1' && day.sun.pos === 'fixed' && day.sun.parent === 'BODY' && day.paper === 'rgb(243, 237, 225)', JSON.stringify({ sun: day.sun, paper: day.paper }));
  // SUCCESSOR L2e: the same layer facts, and the paper is opaque wherever it is drawn - the page's own, or (zoomed) the sheet standing in.
  const sh = await app.evalJs(`(() => { const p = document.querySelector('.mode-page'), k = document.querySelector('.arbor2-paper'); const kc = k ? getComputedStyle(k) : null;
    return { sheetOn: document.documentElement.getAttribute('data-arbor2-sheet'), sheetBg: kc && kc.display !== 'none' ? kc.backgroundColor : null, pageBg: p ? getComputedStyle(p).backgroundColor : null }; })()`);
  const paperThere = !!sh && (sh.pageBg === 'rgb(243, 237, 225)' || (sh.sheetOn === 'on' && sh.sheetBg === 'rgb(243, 237, 225)' && sh.pageBg === 'rgba(0, 0, 0, 0)'));
  // r19 (Fable's ruling, Nov 4: "park the three checks reading the retired sun layer with successors that see the pergola"): the day light is
  // .arbor2-pergola (src/arbor2/pergola.ts, appended to body) - its drift on the wrapper .arbor2-pergola-drift, its 115 leaf clusters (.wz-leaf,
  // the Wrizors' drawing) on the breeze. Read at rest (not writing), with a liveness half: what is read is displayed and has a size.
  const PERG = `(() => { const e = document.querySelector('.arbor2-pergola'); if (!e) return null; const cs = getComputedStyle(e), r = e.getBoundingClientRect();
    const d = e.querySelector('.arbor2-pergola-drift'), dcs = d ? getComputedStyle(d) : null, dr = d ? d.getBoundingClientRect() : null;
    const t = (a) => { const x = a.effect.getTiming(); return { name: a.animationName, dur: Number(x.duration), inf: x.iterations === Infinity, dir: x.direction, delay: Number(x.delay), play: a.playState }; };
    const dA = d ? d.getAnimations().map(t) : [];
    const leaves = [...e.querySelectorAll('.wz-leaf')], lA = leaves.map((l) => l.getAnimations().map(t)[0] || null);
    return { display: cs.display, pos: cs.position, z: cs.zIndex, parent: e.parentElement ? e.parentElement.tagName : null, anim: cs.animationName, w: r.width, h: r.height,
      drift: dcs ? { display: dcs.display, w: dr.width, h: dr.height, anims: dA } : null,
      leaves: leaves.length, breeze: lA.filter((a) => !!a && a.name === 'arbor2-breeze' && a.dur === 16000 && a.inf).length,
      delays: [...new Set(lA.filter(Boolean).map((a) => a.delay))].sort((a, b) => a - b), paused: lA.filter((a) => !!a && a.play === 'paused').length + dA.filter((a) => a.play === 'paused').length,
      writing: document.documentElement.getAttribute('data-wz-writing') }; })()`;
  const pg = await app.evalJs(PERG);
  const pgLive = !!pg && pg.display !== 'none' && pg.w > 0 && pg.h > 0;
  // PARKED 2026-11-04 (SUPERSEDED by r19, spec draft 35 §18.1 (handoff-FABLE-arbor-r19.md §1 D) and Fable's ruling, Nov 4; harness run 41904658793's leg,
  // Arbor 8dd766dc: it read .arbor2-sun, which r19 never draws (display:none always) - it passed BLIND, the computed position and z-index of a
  // hidden layer). Original, verbatim:
  // ok('L2e the light layer is fixed, z-index -1, a child of body (behind every surface), and the paper is opaque (the page\'s own, or the zoomed page\'s sheet)', !!day.sun && day.sun.z === '-1' && day.sun.pos === 'fixed' && day.sun.parent === 'BODY' && paperThere, JSON.stringify({ sun: day.sun, ...sh }));
  // SUCCESSOR L2g: the pergola layer is displayed with a size (liveness), fixed, z-index -1, a child of body, and the paper is opaque (the same paper read).
  // (renamed L2f -> L2g before any green, r21: "L2f" is already the zoomed-page successor's name below; a name is never reused)
  // PARKED 2026-11-08 (SUPERSEDED - r22, Fable's ruling 1 on Nick's walk: "while Typewriter is on, Arbor's page draws no fill or edge of its own;
  // the words sit on the room's ground" - the zoomed page has no paper and no sheet stands in, so "the paper is opaque" is false there by design).
  // Original, verbatim:
  // ok('L2g the pergola layer is drawn (displayed, a non-zero rect), fixed, z-index -1, a child of body (behind every surface), and the paper is opaque (the page\'s own, or the zoomed page\'s sheet)',
  //   pgLive && pg.z === '-1' && pg.pos === 'fixed' && pg.parent === 'BODY' && paperThere, JSON.stringify({ pergola: pg && { display: pg.display, w: pg.w, h: pg.h, z: pg.z, pos: pg.pos, parent: pg.parent }, ...sh }));
  // SUCCESSOR L2h: the same pergola facts, and the page is as its mode makes it - a page off the zoom has its own opaque paper; the zoomed page
  // is bare (a transparent background) and nothing stands in for it (no .arbor2-paper, no data-arbor2-sheet). The zoom is read, not assumed.
  const sh2 = await app.evalJs(`(() => { const p = document.querySelector('.mode-page'), col = p && p.closest('.mode-pagecol');
    return { zoomed: !!col && col.getAttribute('data-zoom') === 'true', pageBg: p ? getComputedStyle(p).backgroundColor : null,
      sheetEl: !!document.querySelector('.arbor2-paper'), sheetAttr: document.documentElement.getAttribute('data-arbor2-sheet') }; })()`);
  const pageAsMode = !!sh2 && sh2.pageBg !== null && !sh2.sheetEl && sh2.sheetAttr === null
    && (sh2.zoomed ? sh2.pageBg === 'rgba(0, 0, 0, 0)' : sh2.pageBg === 'rgb(243, 237, 225)');
  // PARKED 2026-11-08 (SUPERSEDED - Nick's correction via Fable, Nov 8: "page-less Typewriter is NIGHT/dark ONLY. Day/light Typewriter stays exactly
  // as before (the page's paper stays)" - this read is the day room's (the pergola is drawn only by day), where the sheet stands in again). Original, verbatim:
  // ok('L2h the pergola layer is drawn (displayed, a non-zero rect), fixed, z-index -1, a child of body (behind every surface), and the page is as its mode makes it (its own paper; zoomed, bare with no sheet)',
  //   pgLive && pg.z === '-1' && pg.pos === 'fixed' && pg.parent === 'BODY' && pageAsMode, JSON.stringify({ pergola: pg && { display: pg.display, w: pg.w, h: pg.h, z: pg.z, pos: pg.pos, parent: pg.parent }, ...sh2 }));
  // SUCCESSOR L2j: by day, L2g's own claim again - the pergola facts, and the paper is opaque: the page's own, or (zoomed) the sheet standing in for
  // it in the paper colour, the page's own background clear (the same paper read as L2g's, above).
  ok('L2j the pergola layer is drawn (displayed, a non-zero rect), fixed, z-index -1, a child of body (behind every surface), and the paper is opaque (the page\'s own, or the zoomed page\'s sheet)',
    pgLive && pg.z === '-1' && pg.pos === 'fixed' && pg.parent === 'BODY' && paperThere, JSON.stringify({ pergola: pg && { display: pg.display, w: pg.w, h: pg.h, z: pg.z, pos: pg.pos, parent: pg.parent }, ...sh, zoomed: sh2 && sh2.zoomed }));
  // PARKED 2026-11-04 (SUPERSEDED with L2e above: it read the retired sun layer's drift sheet - arbor2-sun-drift on a hidden layer, passing BLIND).
  // Original, verbatim:
  // ok('L1c with motion: the drift runs on the inner sheet and the layer itself holds still', !!day.sun && day.sun.driftAnim === 'arbor2-sun-drift' && day.sun.anim === 'none', JSON.stringify(day.sun));
  // SUCCESSOR L1e: with motion, the drift runs on the inner wrapper and the layer itself holds still - the wrapper (displayed, a non-zero rect)
  // runs one arbor2-pergola-drift, 20 s, forever, alternate; and the leaves stir rarely: all 115 clusters on the 16 s arbor2-breeze, forever,
  // staggered (their own delays, spread over >= 2 s); at rest nothing of it is paused.
  // PARKED 2026-11-07 (SUPERSEDED by Nick's no-drift ruling, Nov 7, via Fable: the swap kept, the drift dropped - the wrapper carries no
  // animation, so this check reads a drift that is no longer drawn). Original, verbatim:
  // const dr0 = pg && pg.drift && pg.drift.anims.length === 1 ? pg.drift.anims[0] : null;
  // ok('L1e with motion: the pergola\'s drift runs on its wrapper (arbor2-pergola-drift, 20 s, infinite, alternate) and the layer holds still; 115 leaf clusters on the 16 s breeze, staggered; none paused at rest',
  //   pgLive && pg.anim === 'none' && !!pg.drift && pg.drift.display !== 'none' && pg.drift.w > 0 && pg.drift.h > 0 && !!dr0 && dr0.name === 'arbor2-pergola-drift' && dr0.dur === 20000 && dr0.inf && dr0.dir === 'alternate'
  //     && pg.leaves === 115 && pg.breeze === 115 && pg.delays.length >= 2 && pg.delays[pg.delays.length - 1] - pg.delays[0] >= 2000 && pg.writing !== 'true' && pg.paused === 0,
  //   JSON.stringify(pg && { ...pg, delays: [pg.delays.length, pg.delays[0], pg.delays[pg.delays.length - 1]] }));
  // SUCCESSOR L1f: NO DRIFT - the wrapper is there (displayed, a non-zero rect) and runs NO animation, the layer holds still; and the leaves
  // still stir: all 115 clusters on the 16 s arbor2-breeze, forever, staggered (>= 2 s), none paused at rest (the liveness half: the breeze runs).
  ok('L1f with motion, NO DRIFT (Nick, Nov 7): the pergola\'s wrapper is drawn and runs no animation, the layer holds still; 115 leaf clusters on the 16 s breeze, staggered; none paused at rest',
    pgLive && pg.anim === 'none' && !!pg.drift && pg.drift.display !== 'none' && pg.drift.w > 0 && pg.drift.h > 0 && pg.drift.anims.length === 0
      && pg.leaves === 115 && pg.breeze === 115 && pg.delays.length >= 2 && pg.delays[pg.delays.length - 1] - pg.delays[0] >= 2000 && pg.writing !== 'true' && pg.paused === 0,
    JSON.stringify(pg && { ...pg, delays: [pg.delays.length, pg.delays[0], pg.delays[pg.delays.length - 1]] }));
  await snap(app, 'item6-day-shadows-1366');

  await app.evalJs(`(() => { window.__flut = []; const seen = new Map(); window.__fo && window.__fo.disconnect(); window.__fo = new MutationObserver((ms) => { for (const m of ms) { const el = m.target; const on = el.getAttribute('data-flutter') === 'true'; if (on) seen.set(el, performance.now()); else if (seen.has(el)) { window.__flut.push([Math.round(seen.get(el)), Math.round(performance.now() - seen.get(el)), document.querySelectorAll('.arbor2-sun-leaf[data-flutter="true"]').length]); seen.delete(el); } } }); document.querySelectorAll('.arbor2-sun-leaf').forEach((l) => window.__fo.observe(l, { attributes: true, attributeFilter: ['data-flutter'] })); })()`);
  await sleep(20000);
  const flut = await app.evalJs('window.__flut');
  const after = await read(app);
  const starts = flut.map((f) => f[0]);
  const gaps = starts.slice(1).map((s, i) => s - starts[i]);
  // PARKED 2026-11-05 (SUPERSEDED: Fable's ruling, Nov 4 (r21) - the pergola replaced the sun layer in r19 (spec draft 35 §18.1); this counted the
  // flutters of .arbor2-sun-leaf, which r19 never draws (the hidden layer kept fluttering, so it passed BLIND to anything the writer sees)).
  // Original, verbatim (its driver above - the observer and the 20 s watch - still runs, for L4):
  // ok('L3 flutter budget: each flutter 300-600 ms, one at a time, starts >= 6 s apart', flut.length >= 1 && flut.every((f) => f[1] >= 250 && f[1] <= 700 && f[2] === 0) && gaps.every((g) => g >= 5900), JSON.stringify({ flut, gaps }));
  // SUCCESSOR L3b: the breeze's budget on the pergola, from the animations' own timing and the stylesheet's arbor2-breeze keyframes (no sampling):
  // every .wz-leaf cluster runs arbor2-breeze, 16 s, forever; its shiver is the keyframes' moving part, 0% -> 8.75% (~1.4 s of the 16 s), the
  // rest (8.75%-100%) still; the clusters' delays spread over <= 3 s, so one breeze crosses the room and is done well inside each 16 s (one
  // shiver per cluster per 16 s). Liveness: the layer is displayed with a size.
  const BREEZE = `(() => { const e = document.querySelector('.arbor2-pergola'); if (!e) return null; const r = e.getBoundingClientRect();
    const leaves = [...e.querySelectorAll('.wz-leaf')]; const an = leaves.map((l) => l.getAnimations()[0] || null);
    const t = an.filter(Boolean).map((a) => { const x = a.effect.getTiming(); return { name: a.animationName, dur: Number(x.duration), inf: x.iterations === Infinity, delay: Number(x.delay) }; });
    let kf = null; for (const ss of document.styleSheets) { let rules; try { rules = ss.cssRules; } catch { continue; } for (const rule of rules) { if (rule.type === 7 && rule.name === 'arbor2-breeze') { kf = rule; break; } } if (kf) break; }
    const frames = kf ? [...kf.cssRules].flatMap((f) => f.keyText.split(',').map((k) => ({ at: parseFloat(k) / 100, still: /^rotate\\((0|0deg)\\)$/.test(f.style.transform.trim()) }))).sort((a, b) => a.at - b.at) : [];
    const moving = frames.filter((f) => !f.still), lastMove = moving.length ? Math.max(...moving.map((f) => f.at)) : null;
    const stillFrom = lastMove == null ? null : Math.min(...frames.filter((f) => f.still && f.at > lastMove).map((f) => f.at));
    const delays = t.map((x) => x.delay);
    return { display: getComputedStyle(e).display, w: r.width, h: r.height, leaves: leaves.length, breeze: t.filter((x) => x.name === 'arbor2-breeze' && x.dur === 16000 && x.inf).length,
      keyframes: !!kf, frames: frames.map((f) => [f.at, f.still]), stillFrom, endsStill: frames.length > 0 && frames[frames.length - 1].at === 1 && frames[frames.length - 1].still,
      spread: delays.length ? Math.max(...delays) - Math.min(...delays) : null }; })()`;
  const bz = await app.evalJs(BREEZE);
  const shiverMs = bz && bz.stillFrom != null ? bz.stillFrom * 16000 : null;
  ok('L3b the breeze\'s budget: 115 clusters on arbor2-breeze (16 s, infinite); each shiver ~1.4 s (the keyframes move 0% -> 8.75%, then still to 100%); delays spread <= 3 s, so one breeze crosses per 16 s',
    !!bz && bz.display !== 'none' && bz.w > 0 && bz.h > 0 && bz.leaves === 115 && bz.breeze === 115 && bz.keyframes && Math.abs(bz.stillFrom - 0.0875) < 0.0005 && bz.endsStill
      && shiverMs >= 1200 && shiverMs <= 1600 && bz.spread != null && bz.spread <= 3000 && bz.spread + shiverMs < 16000,
    JSON.stringify({ ...bz, shiverMs }));
  ok('L4 nothing stored: localStorage byte-equal across 20 s of the day room', after.ls === day.ls, '');

  await pickBar(app, 'Night'); await sleep(250);
  const night = await read(app);
  // PARKED 2026-11-05 (SUPERSEDED: Fable's ruling, Nov 4 (r21) - the pergola replaced the sun layer in r19; .arbor2-sun is display:none in BOTH
  // rooms, so "not drawn at night" passed BLIND). Original, verbatim:
  // ok('L1 night: the light layer is not drawn', !!night.sun && night.sun.display === 'none', JSON.stringify(night.sun));
  // SUCCESSOR L1f: the night room draws no pergola - .arbor2-pergola is there but display:none (or at opacity 0) - and in this same run the day
  // read saw it drawn (L2g's liveness: displayed, a non-zero rect), so the night's absence is not a blind read.
  const pgN = await app.evalJs(PERG);
  const nightOp = await app.evalJs("(() => { const e = document.querySelector('.arbor2-pergola'); return e ? Number(getComputedStyle(e).opacity) : null; })()");
  ok('L1f night: the pergola is not drawn (display none or opacity 0), while the same run\'s day read saw it drawn',
    pgLive && !!pgN && (pgN.display === 'none' || nightOp === 0), JSON.stringify({ night: pgN && { display: pgN.display, w: pgN.w, h: pgN.h }, nightOp, dayLive: pgLive }));

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
  // PARKED 2026-10-29 (SUPERSEDED, never run: Fable ruled "Feather the pergola's page hole with a ~24 px soft edge (§7.1), never over the
  // prose column" - the sun's hard clip is gone, and zoomProof reports sunEdge in place of hole). Original, verbatim:
  // // SUCCESSOR L2c: the same page, night and day - a whole sheet with no visible edge (it fades out at every side, the page draws none of its
  // // own, the vignette is its exact complement), and by day the sun's hole still covers it.
  // for (const room of ['Night', 'Day']) {
  //   await pickBar(app, room); await sleep(500);
  //   const z = await app.evalJs(`(${zoomProof.toString()})(${holeOf.toString()}, ${stopsOf.toString()})`);
  //   ok(`L2c [${room.toLowerCase()}] zoomed Free Write: a whole paper sheet with no visible edge behind the visible page (above the progress row)${room === 'Day' ? ', and the sun layer has a hole over it' : ''}`,
  //     zoomed && !!z && z.pass && z.sheet && z.bare && z.edgeless && z.whole && z.seamless && (room === 'Day' ? z.hole === true : z.hole === null), JSON.stringify({ zoomed, z }));
  //   await snap(app, `item6-${room.toLowerCase()}-zoomed-freewrite`);
  // }
  // SUCCESSOR L2d: the same page, night and day - the unframed sheet as L2c, and by day the pergola's light reaches the page's edge and fades
  // out within 24 px, never over the prose column.
  // PARKED 2026-10-31 (SUPERSEDED, r5, run 41240761804: spec §10b, Fable Oct 31 - "No diffused or vignetted paper edges on the zoomed page"; the sheet is
  // hard now, and the proof is zoomProof V6 (scripts/frames/arbor2.mjs; V5 kept there as zoomProofV5)). Original, verbatim:
  // for (const room of ['Night', 'Day']) {
  //   await pickBar(app, room); await sleep(500);
  //   const z = await app.evalJs(`(${zoomProof.toString()})(${holeOf.toString()}, ${stopsOf.toString()})`);
  //   ok(`L2d [${room.toLowerCase()}] zoomed Free Write: a whole paper sheet with no visible edge behind the visible page (above the progress row)${room === 'Day' ? ', and the light has a 24 px soft edge, never over the prose' : ''}`,
  //     zoomed && !!z && z.pass && z.sheet && z.bare && z.edgeless && z.whole && z.seamless && (room === 'Day' ? z.sunEdge === true && z.proseMax === 0 : z.sunEdge === null), JSON.stringify({ zoomed, z }));
  //   await snap(app, `item6-${room.toLowerCase()}-zoomed-freewrite`);
  // }
  // SUCCESSOR L2f: the same page, night and day - a HARD, unframed sheet exactly over the visible page, the vignette's hole hard over it, and
  // by day the pergola's 24 px soft edge, never over the prose, and nothing on the count row.
  // PARKED 2026-11-08 (SUPERSEDED - r22, Fable's ruling 1 on Nick's walk: "while Typewriter is on, Arbor's page draws no fill or edge of its own;
  // the words sit on the room's ground under the lamplight glow" - the sheet and the vignette's hole over it retired; the proof is zoomProof V7
  // (scripts/frames/arbor2.mjs; V6 kept there as zoomProofV6)). Original, verbatim:
  // for (const room of ['Night', 'Day']) {
  //   await pickBar(app, room); await sleep(500);
  //   const z = await app.evalJs(`(${zoomProof.toString()})(${holeOf.toString()}, ${stopsOf.toString()})`);
  //   ok(`L2f [${room.toLowerCase()}] zoomed Free Write: a hard, unframed paper sheet behind the visible page (above the progress row), the vignette's hole hard${room === 'Day' ? ', and the light has a 24 px soft edge, never over the prose or the count' : ''}`,
  //     zoomed && !!z && z.pass && z.sheet && z.bare && z.hard && z.seamless && (room === 'Day' ? z.sunEdge === true && z.proseMax === 0 : z.sunEdge === null), JSON.stringify({ zoomed, z }));
  //   await snap(app, `item6-${room.toLowerCase()}-zoomed-freewrite`);
  // }
  // SUCCESSOR L2i: the same page, night and day - no sheet, the page bare, the room's shade unbroken over it, the words in the room's ink, and
  // by day the pergola's soft hole still keeps every slat off the prose and the count row.
  // PARKED 2026-11-08 (SUPERSEDED - Nick's correction via Fable, Nov 8: "page-less Typewriter is NIGHT/dark ONLY. Day/light Typewriter stays exactly
  // as before (the page's paper stays)" - L2i read both rooms page-less; the proof is zoomProof V9, by room). Original, verbatim:
  // for (const room of ['Night', 'Day']) {
  //   await pickBar(app, room); await sleep(500);
  //   const z = await app.evalJs(`(${zoomProof.toString()})(${holeOf.toString()}, ${stopsOf.toString()})`);
  //   ok(`L2i [${room.toLowerCase()}] zoomed Free Write: the page draws no fill or edge and nothing stands in for it, the room's shade crosses it unbroken, and the words are the room's ink${room === 'Day' ? ', and no slat reaches the prose or the count' : ''}`,
  //     zoomed && !!z && z.pass && z.noSheet && z.bare && z.unbroken && z.inkOk && (room === 'Day' ? z.sunEdge === true && z.proseMax === 0 : z.sunEdge === null), JSON.stringify({ zoomed, z }));
  //   await snap(app, `item6-${room.toLowerCase()}-zoomed-freewrite`);
  // }
  // SUCCESSOR L2k: the same page, by room (zoomProof V9) - by night page-less (no sheet at full night, the page bare, no vignette hole, cream
  // words); by day as before r22 (the hard sheet in the page's paper exactly over the visible page, the vignette's hard hole, the page's own ink).
  for (const room of ['Night', 'Day']) {
    await pickBar(app, room); await sleep(500);
    const z = await app.evalJs(`(${zoomProof.toString()})(${holeOf.toString()}, ${stopsOf.toString()})`);
    ok(`L2k [${room.toLowerCase()}] zoomed Free Write: ${room === 'Night' ? 'page-less - no sheet, the page bare, the room\'s shade unbroken, the words cream' : 'the hard sheet in the page\'s paper over the visible page, the vignette\'s hole hard over it, the page\'s own ink'}`,
      zoomed && !!z && z.pass && z.room === room.toLowerCase() && z.bare && z.sheet && z.vignette && z.inkOk && (room === 'Night' ? z.sheetOn === false : z.sheetOn === true), JSON.stringify({ zoomed, z }));
    await snap(app, `item6-${room.toLowerCase()}-zoomed-freewrite`);
  }

  // L5: reduced motion from the load (sun.ts reads it once at mount)
  await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await app.reload(); await pinRoom(app); await splashGone(app); await sleep(500);
  await pickBar(app, 'Day'); await sleep(300);
  await app.evalJs("window.__f2 = 0; new MutationObserver(() => { window.__f2++; }).observe(document.querySelector('.arbor2-sun'), { subtree: true, attributes: true, attributeFilter: ['data-flutter'] })");
  await sleep(14000);
  const rm = await read(app);
  const f2 = await app.evalJs('window.__f2');
  // PARKED 2026-10-29 (SUPERSEDED: the drift moved from the layer to its inner sheet so the page hole holds still - `rm.sun.anim` is now
  // 'none' WITH motion too, so this check went blind to the drift). Original, verbatim:
  // ok('L5 reduced motion: a still frame - no drift, no leaf animation, no flutter in 14 s', !!rm.sun && rm.sun.still === 'true' && rm.sun.anim === 'none' && rm.sun.leafAnim === 'none' && f2 === 0, JSON.stringify({ sun: rm.sun, flutters: f2 }));
  // SUCCESSOR L5b: the same, plus the drift sheet itself is still.
  // PARKED 2026-11-05 (SUPERSEDED: Fable's ruling, Nov 4 (r21) - the pergola replaced the sun layer in r19; this read the hidden .arbor2-sun, its
  // drift sheet and its leaves, so it passed BLIND to the pergola). Original, verbatim (its driver above still runs):
  // ok('L5b reduced motion: a still frame - no drift (layer AND drift sheet), no leaf animation, no flutter in 14 s', !!rm.sun && rm.sun.still === 'true' && rm.sun.anim === 'none' && rm.sun.driftAnim === 'none' && rm.sun.leafAnim === 'none' && f2 === 0, JSON.stringify({ sun: rm.sun, flutters: f2 }));
  // SUCCESSOR L5c: under reduced motion no animation runs on the pergola's drift wrapper or any leaf cluster (none in document.getAnimations()
  // for those targets, in the room or on the page), and the layer is still drawn by day (displayed, a non-zero rect).
  const rmP = await app.evalJs(PERG);
  const rmAnims = await app.evalJs("document.getAnimations().filter((a) => { const t = a.effect && a.effect.target; return !!t && !!t.closest && !!t.closest('.arbor2-pergola-drift, .wz-leaf'); }).map((a) => [a.animationName || a.transitionProperty || '', a.playState])");
  ok('L5c reduced motion: the pergola holds still - no drift and no leaf animation at all - and it is still drawn by day',
    !!rmP && rmP.display !== 'none' && rmP.w > 0 && rmP.h > 0 && rmP.leaves === 115 && Array.isArray(rmAnims) && rmAnims.length === 0, JSON.stringify({ pergola: rmP && { display: rmP.display, w: rmP.w, h: rmP.h, leaves: rmP.leaves }, anims: rmAnims && rmAnims.slice(0, 6), n: rmAnims && rmAnims.length }));
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
