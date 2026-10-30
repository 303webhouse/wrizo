// ARBOR v2 MOCKUP - §14 item 1 (the writing page, night and day, drawers closed) + Nick's HIDDEN RHIZOME option (Oct 29).
//
// Fable's brief (handoff-ARBOR-oct29): a working mockup behind ?arbor2=1, all new CSS in styles/arbor-v2.css, the room follows the
// theme's existing Page tone (dark = night, light = day) with an in-session switch, nothing stored. Nick (Oct 29): "the option to see a
// rhizome in dark mode that is hidden until the writer completes the progress goal, at which point the whole rhizome flashes into view
// as a brass orange web and then fades back into invisibility."
//
// Written BEFORE the build is run; on main every flag-on check is red (main has no ?arbor2 at all).
//
//   F1  flag OFF: nothing of the mockup exists (no data-arbor2, no bar, no arbor2 rule in any stylesheet)
//   F2  flag ON: data-arbor2 on <html>, the bar is drawn, the room attribute is set
//   P1  THE PAGE NEVER MOVES: the .mode-page rect is identical flag-off / night / day, at 1366x768 and 1920x1080
//   T1  the room follows the existing Page tone (data-page dark -> night, light -> day)
//   T2  the Room switch overrides it in-session, and NOTHING is stored (localStorage byte-equal before/after every switch)
//   C1  contrast, both rooms, measured from the live tokens: names (--arbor-letter, --text-hi) >= 7:1, labels (--text-mid, --text-low,
//       --arbor-guide) >= 4.5:1 on --ink-950 / 900 / 800
//   L1  night: the lamp layer breathes (arbor2-breath, 9 s) and drifts (arbor2-drift, 40 s); reduced motion: no animation (a still frame)
//   L2  day: the room is the whitewash (--ink-950 #EFE6D2) and the page keeps its paper (#F3EDE1)
//   L3  (Nick, Oct 29: "I can't see that the lamplight is doing anything") the pool is ON SCREEN: at a margin point beside the page's
//       top edge, and inside the page's top fade, nothing between the viewer and body paints an opaque ground; the bar and rail keep theirs
//   N1  (Nick, Oct 29: "Let's keep that in dark mode") night's progress defaults to the hidden rhizome after a fresh load
//   H1  night + LAMP: the rhizome field is never visible, not even at the goal
//   H2  night + HIDDEN RHIZOME: invisible while growing; at the goal visible AND brass; after the fade invisible again;
//       flash budget: data-flash changes <= 3 per second
//   H3  day: the rhizome shows (visible at rest, in the leaf)
//   S1  scope: Flux under the flag keeps its own room (its --ink-950 is byte-equal flag-off vs flag-on)
//   R1  recede: while she types the mockup bar is at opacity 0
import fs from 'node:fs';
import path from 'node:path';
import { withHarness } from '../runtime-verify.mjs';

const SHOTS = process.env.ARBOR_SHOTS || null; // e.g. C:\Users\nickh\Downloads\arbor-mockup-frames
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
// the page's paper, wherever it is drawn: the page's own background, or - on the zoomed Free Write page, under Fable's unframed ruling - the
// opaque sheet (src/arbor2/paper.ts) that stands in for it while the page's own background is transparent
const SHEET = `(() => { const p = document.querySelector('.mode-page'), k = document.querySelector('.arbor2-paper');
  const kc = k ? getComputedStyle(k) : null;
  return { sheetOn: document.documentElement.getAttribute('data-arbor2-sheet'), sheetBg: kc && kc.display !== 'none' ? kc.backgroundColor : null,
    pageBg: p ? getComputedStyle(p).backgroundColor : null }; })()`;
const PAPER_RGB = 'rgb(243, 237, 225)';
const paperThere = (sh) => !!sh && (sh.pageBg === PAPER_RGB || (sh.sheetOn === 'on' && sh.sheetBg === PAPER_RGB && sh.pageBg === 'rgba(0, 0, 0, 0)'));
const sameRect =(a, b) => !!a && !!b && ['x', 'y', 'w', 'h'].every((k) => Math.abs(a[k] - b[k]) <= 0.5);

const snap = async (app, name) => {
  if (!SHOTS) return;
  fs.writeFileSync(path.join(SHOTS, `${name}.png`), Buffer.from((await app.cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
};
// app.goto() navigates to base/#..., which DROPS the query; under the flag every move is a hash change instead.
const hashTo = async (app, hash) => { await app.evalJs(`location.hash = ${JSON.stringify(hash)}`); await sleep(250); };
// Every reload brings the splash back over the page; frames and visual reads wait it out (the first run's frames were all splash).
const splashGone = (app) => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 20000, label: 'splash gone' }).catch(() => {});
const setFlag = async (app, on) => {
  await app.evalJs(`history.replaceState(null, '', ${JSON.stringify(on ? '/?arbor2=1' : '/')} + location.hash)`);
  await app.reload();
  await sleep(250);
  // read while the splash is still up (it holds for seconds after a reload): the splash's own ground and the room it sits in
  const splash = await app.evalJs("(() => { const s = document.querySelector('.wz-splash'); const v = document.querySelector('.wz-splash-veil'); return s ? { bg: getComputedStyle(s).backgroundColor, veilBg: v ? getComputedStyle(v).backgroundColor : null, room: document.documentElement.getAttribute('data-arbor2-room') } : null; })()");
  await splashGone(app);
  await sleep(300);
  return splash;
};
const pickBar = (app, label) => app.evalJs(`(() => { const b = [...document.querySelectorAll('.arbor2-bar-opt')].find((x) => x.textContent.trim() === ${JSON.stringify(label)}); if (b) b.click(); return !!b; })()`);

const STATE = `(() => {
  const root = document.documentElement, cs = getComputedStyle(root), tok = (n) => cs.getPropertyValue(n).trim();
  const p = document.querySelector('.mode-page'), r = p ? p.getBoundingClientRect() : null;
  let arborRule = false;
  for (const ss of document.styleSheets) { try { for (const rule of ss.cssRules) { if (String(rule.cssText).includes('arbor2-')) { arborRule = true; break; } } } catch {} if (arborRule) break; }
  const f = document.querySelector('.wz-rhizome-field'), seg = f && f.querySelector('.wz-rhizome-seg');
  const lamp = getComputedStyle(document.body, '::before');
  const bar = document.querySelector('.arbor2-bar');
  return {
    flag: root.getAttribute('data-arbor2'), room: root.getAttribute('data-arbor2-room'), prog: root.getAttribute('data-arbor2-night-prog'),
    page: root.getAttribute('data-page'), bar: !!bar, barOpacity: bar ? getComputedStyle(bar).opacity : null, arborRule,
    rect: r ? { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) } : null,
    paperBg: p ? getComputedStyle(p).backgroundColor : null,
    tokens: { i950: tok('--ink-950'), i900: tok('--ink-900'), i800: tok('--ink-800'), letter: tok('--arbor-letter'), hi: tok('--text-hi'), mid: tok('--text-mid'), low: tok('--text-low'), guide: tok('--arbor-guide') },
    lampAnim: lamp.animationName, lampContent: lamp.content,
    field: f ? { flash: f.dataset.flash, vis: getComputedStyle(f).visibility, segs: f.querySelectorAll('.wz-rhizome-seg').length, stroke: seg ? getComputedStyle(seg).stroke : null, segVis: seg ? getComputedStyle(seg).visibility : null } : null,
    ls: JSON.stringify(Object.keys(localStorage).sort().map((k) => [k, localStorage.getItem(k)])),
  };
})()`;
const state = (app) => app.evalJs(STATE);

// WCAG contrast from hex or rgb() strings.
const rgb = (s) => { s = String(s).trim(); if (s.startsWith('#')) { const h = s.slice(1); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); } return (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number); };
const lum = (s) => { const [r, g, b] = rgb(s).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return +((x + 0.05) / (y + 0.05)).toFixed(2); };
const nearBrass = (s) => { const n = rgb(s); return n.length >= 3 && Math.abs(n[0] - 255) <= 8 && Math.abs(n[1] - 152) <= 8 && n[2] <= 8; };

const freshDesk = async (app, theme) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4');"
    + (theme ? ` localStorage.setItem('wrizo-theme', '${theme}');` : ''));
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
};
const newPage = async (app) => {
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted' });
  await app.waitFor("!document.querySelector('.wz-splash')", { timeout: 20000, label: 'splash gone' }).catch(() => {});
  await sleep(600);
  return (await app.evalJs('location.hash')).replace(/^#\/page\//, '');
};

await withHarness(async (app) => {
  await freshDesk(app);
  await app.emulateDpr(1, 1366, 768);
  const pageId = await newPage(app);

  // ---- F1 / P1 baseline: flag off
  const rects = {};
  const off = await state(app);
  ok('F1 flag OFF: no data-arbor2, no mockup bar, no arbor2 rule in any stylesheet', off.flag == null && !off.bar && !off.arborRule, JSON.stringify({ flag: off.flag, bar: off.bar, rule: off.arborRule }));
  for (const [w, h] of [[1366, 768], [1920, 1080]]) { await app.emulateDpr(1, w, h); await sleep(400); rects[`off-${w}`] = (await state(app)).rect; }
  await app.emulateDpr(1, 1366, 768); await sleep(300);
  await snap(app, 'item1-flag-off-1366');

  // ---- F2: flag on
  const splashOn = await setFlag(app, true);
  // a missing bar is a FAILED CHECK (F2), never a crash: on main the flag does nothing and the run must still report every check red
  await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.arbor2-bar')", { label: 'flagged page + bar' }).catch(() => {});
  const on = await state(app);
  // PARKED 2026-10-29 (SUPERSEDED, the instrument read the wrong layer): .wz-splash itself is transparent (measured rgba(0,0,0,0) on the
  // green build); its ground is painted by its child .wz-splash-veil (index.css: background:var(--ink-950)). Original, verbatim:
  // ok('SP1 the splash is untouched in the day room: its ground stays the night espresso (rgb 10,5,3), not the whitewash',
  //   !!splashOn && splashOn.room === 'day' && splashOn.bg === 'rgb(10, 5, 3)', JSON.stringify(splashOn));
  // SUCCESSOR SP1b: the same claim, read from the layer that paints it.
  ok('SP1b the splash is untouched in the day room: its veil (the layer that paints its ground) stays the night espresso (rgb 10,5,3)',
    !!splashOn && splashOn.room === 'day' && splashOn.veilBg === 'rgb(10, 5, 3)', JSON.stringify(splashOn));
  ok('F2 flag ON: data-arbor2 set, the bar is drawn, a room is chosen', on.flag === 'true' && on.bar && (on.room === 'night' || on.room === 'day'), JSON.stringify({ flag: on.flag, bar: on.bar, room: on.room }));
  // PARKED 2026-10-29 (SUPERSEDED by Fable's ruling the same day: "One 'Rhizome' style, no new setting" - the mockup's night-progress
  // switch and its data-arbor2-night-prog attribute are gone, so there is no default to read). Original, verbatim:
  // ok('N1 night progress defaults to the hidden rhizome after a fresh load (Nick, Oct 29)', on.prog === 'hidden-rhizome', String(on.prog));
  // SUCCESSOR N1b: there is no progress switch at all (no Lamp / Hidden rhizome option, no attribute); the hidden behaviour is the room's.
  const progOpts = await app.evalJs("[...document.querySelectorAll('.arbor2-bar-opt')].map((b) => b.textContent.trim())");
  // PARKED 2026-10-30 (SUPERSEDED, first run on INK's shards, run 41014396358: item 9 added the bar's Logo row - Brass / Sage, Nick's call on
  // the logo's o - so "the bar offers only the room" is false by design; the claim that matters, no progress switch, stands). Original, verbatim:
  // ok('N1b one Rhizome style, no progress switch: the bar offers only the room, and no night-progress attribute exists (Fable, Oct 29)',
  //   on.prog == null && Array.isArray(progOpts) && progOpts.length === 2 && !progOpts.includes('Lamp') && !progOpts.includes('Hidden rhizome'), JSON.stringify({ prog: on.prog, progOpts }));
  // SUCCESSOR N1c: the bar's choices (the Mood list folded, as on a fresh load) are exactly the room and the logo's o - no progress option of
  // any name - and no night-progress attribute exists.
  ok('N1c one Rhizome style, no progress switch: the bar offers the room (Night/Day) and the logo\'s o (Brass/Sage) only, and no night-progress attribute exists',
    on.prog == null && Array.isArray(progOpts) && progOpts.join() === 'Night,Day,Brass,Sage', JSON.stringify({ prog: on.prog, progOpts }));

  // ---- T1: the room follows the existing Page tone
  await app.evalJs("document.documentElement.setAttribute('data-page', 'dark')"); await sleep(100);
  const t1n = await state(app);
  await app.evalJs("document.documentElement.setAttribute('data-page', 'light')"); await sleep(100);
  const t1d = await state(app);
  ok('T1 the room follows the Page tone: dark -> night, light -> day', t1n.room === 'night' && t1d.room === 'day', JSON.stringify({ dark: t1n.room, light: t1d.room }));

  // ---- T2: the switch overrides in-session, stores nothing
  const lsBefore = (await state(app)).ls;
  await pickBar(app, 'Night'); await sleep(150);
  const t2n = await state(app);
  await pickBar(app, 'Hidden rhizome'); await pickBar(app, 'Lamp'); await sleep(100);
  await pickBar(app, 'Day'); await sleep(150);
  const t2d = await state(app);
  ok('T2 the Room switch overrides the tone in-session (Night, then Day)', t2n.room === 'night' && t2d.room === 'day', JSON.stringify({ n: t2n.room, d: t2d.room }));
  ok('T2 nothing is stored: localStorage byte-equal before and after every switch', t2d.ls === lsBefore && t2n.ls === lsBefore, '');

  // ---- P1 / C1 / L1 / L2 per room, both sizes
  for (const room of ['night', 'day']) {
    await pickBar(app, room === 'night' ? 'Night' : 'Day'); await sleep(250);
    for (const [w, h] of [[1366, 768], [1920, 1080]]) {
      await app.emulateDpr(1, w, h); await sleep(400);
      const s = await state(app);
      rects[`${room}-${w}`] = s.rect;
      ok(`P1 [${room} ${w}x${h}]: the page rect is identical to flag-off`, sameRect(s.rect, rects[`off-${w}`]), JSON.stringify({ on: s.rect, off: rects[`off-${w}`] }));
      await snap(app, `item1-${room}-${w}`);
    }
    await app.emulateDpr(1, 1366, 768); await sleep(300);
    const s = await state(app);
    const t = s.tokens, grounds = { i950: t.i950, i900: t.i900, i800: t.i800 };
    const table = {};
    for (const [name, floor] of [['letter', 7], ['hi', 7], ['mid', 4.5], ['low', 4.5], ['guide', 4.5]]) {
      table[name] = Object.fromEntries(Object.entries(grounds).map(([g, v]) => [g, ratio(t[name], v)]));
      ok(`C1 [${room}] --${name === 'hi' ? 'text-hi' : name === 'mid' ? 'text-mid' : name === 'low' ? 'text-low' : name === 'guide' ? 'arbor-guide' : 'arbor-letter'} ${t[name]} >= ${floor}:1 on 950/900/800`,
        Object.values(table[name]).every((v) => v >= floor), JSON.stringify(table[name]));
    }
    if (room === 'night') {
      ok('L1 night: the lamp breathes (arbor2-breath) and drifts (arbor2-drift)', /arbor2-breath/.test(s.lampAnim) && /arbor2-drift/.test(s.lampAnim), s.lampAnim);
      const cover = await app.evalJs(`(() => {
        const p = document.querySelector('.mode-page').getBoundingClientRect();
        const opaque = (el) => { const c = getComputedStyle(el).backgroundColor; const a = (c.match(/[\\d.]+/g) || []).map(Number); return (a.length === 3 || (a.length === 4 && a[3] > 0.02)) || getComputedStyle(el).backgroundImage !== 'none'; };
        const blockers = (x, y) => { const out = []; let el = document.elementFromPoint(x, y); while (el && el !== document.body && el !== document.documentElement) { if (opaque(el)) out.push(String(el.className).slice(0, 50)); el = el.parentElement; } return out; };
        const bar = document.querySelector('.sprint-nav');
        return { margin: blockers(Math.max(2, p.left - 60), p.top + 30), bar: bar ? getComputedStyle(bar).backgroundColor : null };
      })()`);
      ok('L3 night: the lamp is on screen - nothing opaque covers body beside the page top (the desk host is see-through); the bar keeps its own ground',
        cover.margin.length === 0 && cover.bar === 'rgb(21, 15, 11)', JSON.stringify(cover));      await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]); await sleep(150);
      const rm = await state(app);
      ok('L1 night, reduced motion: the lamp is a still frame (no animation)', rm.lampAnim === 'none', rm.lampAnim);
      await snap(app, 'item1-night-reduced-motion');
      await app.emulateMedia([]); await sleep(100);
    } else {
      // PARKED 2026-10-29 (SUPERSEDED by item 6, ruling 2's afternoon: the whitewash now shades with the session and the clock, #EFE6D2 at
      // noon -> #E3D4B6 at dusk, so it equals #EFE6D2 only before noon on a fresh session). Original, verbatim:
      // ok('L2 day: the room is the whitewash and the page keeps its paper', t.i950.toLowerCase() === '#efe6d2' && s.paperBg === 'rgb(243, 237, 225)', JSON.stringify({ i950: t.i950, paper: s.paperBg }));
      // SUCCESSOR L2b: the room is the whitewash as the afternoon has shaded it - on the line from #EFE6D2 to #E3D4B6 - and the page keeps its paper.
      const g = rgb(t.i950), onLine = g.length === 3 && g[0] >= 0xE3 && g[0] <= 0xEF && g[1] >= 0xD4 && g[1] <= 0xE6 && g[2] >= 0xB6 && g[2] <= 0xD2;
      // PARKED 2026-10-30 (SUPERSEDED, first run on INK's shards, run 41014396358: under Fable's unframed ruling the ZOOMED page lets go of its
      // own background - the opaque sheet behind it (paper.ts) is the paper - so the page's own background reads transparent by design).
      // Original, verbatim:
      // ok('L2b day: the room is the whitewash, shaded by the afternoon (#EFE6D2 -> #E3D4B6), and the page keeps its paper', onLine && s.paperBg === 'rgb(243, 237, 225)', JSON.stringify({ i950: t.i950, paper: s.paperBg }));
      // SUCCESSOR L2c: the same room, and the paper is there: the page's own, or - while the sheet stands in - the sheet's, in the paper colour.
      const sh = await app.evalJs(SHEET);
      ok('L2c day: the room is the whitewash, shaded by the afternoon (#EFE6D2 -> #E3D4B6), and the page has its paper (its own, or the zoomed page\'s sheet)', onLine && paperThere(sh), JSON.stringify({ i950: t.i950, ...sh }));
    }
  }

  // ---- H: the rhizome by room and option. Seed through the seams (AGENTS.md): goal 8 words, 7 written, then type the 8th.
  await hashTo(app, '#/');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before seed' });
  await app.evalJs("localStorage.setItem('wrizo-writing-settings', JSON.stringify({ ...JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'), progress: 'words', progressStyle: 'rhizome' }))");
  const seedTo = async (words) => {
    await hashTo(app, '#/');
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before seed' });
    await app.evalJs(`(() => { window.wrizoSetWritingGoal({ n: 8, unit: 'words' }); window.wrizoPatchEntry(${JSON.stringify(pageId)}, { text: Array.from({ length: ${words} }, (_, i) => 'word' + i).join(' ') }); })()`);
    await app.reload();
    await hashTo(app, '#/page/' + pageId);
    await app.waitFor("!!document.querySelector('.wz-rhizome-field') && !!document.querySelector('.arbor2-bar')", { label: 'rhizome field + bar after seed' });
    await splashGone(app);
    await sleep(900);
  };
  const crossGoal = async () => {
    await app.evalJs("document.querySelector('.forward-only-editor').focus()");
    await app.evalJs(`(() => { window.__fl = []; let last = null; const read = () => { const f = document.querySelector('.wz-rhizome-field'); const v = f ? f.dataset.flash : null; if (v !== last) { last = v; window.__fl.push([Math.round(performance.now()), v]); } }; read(); window.__flo && window.__flo.disconnect(); window.__flo = new MutationObserver(read); window.__flo.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-flash'] }); })()`);
    await app.typeKeys(' tail');
    await app.waitFor("document.querySelector('.wz-rhizome-field')?.dataset.flash === 'true'", { label: 'flash at goal', timeout: 4000 });
    await sleep(200);
  };

  // H2: night + hidden rhizome
  await seedTo(7);
  await pickBar(app, 'Night'); await pickBar(app, 'Hidden rhizome'); await sleep(300);
  const h2rest = await state(app);
  ok('H2 night + hidden rhizome, growing: the field is invisible (and has grown roots to hide)', h2rest.field && h2rest.field.vis === 'hidden' && h2rest.field.segs > 0, JSON.stringify(h2rest.field));
  await snap(app, 'item1-night-hidden-rhizome-rest');
  await crossGoal();
  const h2flash = await state(app);
  ok('H2 at the goal: the whole web shows, in brass', h2flash.field && h2flash.field.vis === 'visible' && h2flash.field.flash === 'true' && nearBrass(h2flash.field.stroke), JSON.stringify(h2flash.field));
  // H5 (Fable, Oct 29: "keep it off the prose column"): at the flash, the field's paint clip has a hole covering the whole page rect
  const h5 = await app.evalJs(`(() => {
    const f = document.querySelector('.wz-rhizome-field'), p = document.querySelector('.mode-page');
    if (!f || !p) return null;
    const sr = f.getBoundingClientRect(), pr = p.getBoundingClientRect();
    const page = { l: pr.left - sr.left, t: pr.top - sr.top, r: pr.right - sr.left, b: pr.bottom - sr.top };
    const clip = String(f.style.clipPath || '');
    const holes = [...clip.matchAll(/M(-?[\\d.]+) (-?[\\d.]+)H(-?[\\d.]+)V(-?[\\d.]+)H/g)].slice(1).map((m) => ({ l: +m[1], t: +m[2], r: +m[3], b: +m[4] }));
    const covered = holes.some((h) => h.l <= page.l + 1 && h.t <= page.t + 1 && h.r >= page.r - 1 && h.b >= Math.min(page.b, sr.height) - 1);
    return { evenodd: clip.includes('evenodd'), holes: holes.length, covered, page };
  })()`);
  // PARKED 2026-10-30 (SUPERSEDED, first run on INK's shards, run 41014396358: BLIND, not red - its reader matched the clip only in the
  // unspaced spelling RhizomeField writes ("M187 107H..."), and Chrome reads a clip back spaced ("M 187 107 H ..."), so it found 0 holes on any
  // clip. The same trap as the frames proof's V1, Oct 29). Original, verbatim:
  // ok('H5 off the prose column: at the flash the web\'s paint clip cuts out the whole page (an evenodd hole >= the page rect)', !!h5 && h5.evenodd && h5.covered, JSON.stringify(h5));
  // SUCCESSOR H5b: the same claim, read by NUMBERS (each subpath is 5 numbers: x y, then H r, V b, H l - whatever the spacing), the first
  // subpath being the whole field; and the reader must find at least one hole, or the check is blind and fails.
  const h5b = await app.evalJs(`(() => {
    const f = document.querySelector('.wz-rhizome-field'), p = document.querySelector('.mode-page');
    if (!f || !p) return null;
    const sr = f.getBoundingClientRect(), pr = p.getBoundingClientRect();
    const page = { l: pr.left - sr.left, t: pr.top - sr.top, r: pr.right - sr.left, b: pr.bottom - sr.top };
    const clip = String(f.style.clipPath || '');
    const d = clip.slice(clip.indexOf('"') + 1, clip.lastIndexOf('"'));
    const n = (d.match(/-?\\d+(?:\\.\\d+)?/g) || []).map(Number);
    const holes = [];
    for (let i = 5; i + 4 < n.length; i += 5) holes.push({ l: n[i], t: n[i + 1], r: n[i + 2], b: n[i + 3] });
    const covered = holes.some((h) => h.l <= page.l + 1 && h.t <= page.t + 1 && h.r >= page.r - 1 && h.b >= Math.min(page.b, sr.height) - 1);
    return { evenodd: clip.includes('evenodd'), nums: n.length, holes: holes.length, covered, page, clip: clip.slice(0, 80) };
  })()`);
  ok('H5b off the prose column: at the flash the web\'s paint clip cuts out the whole page (an evenodd hole >= the page rect), read whatever the spelling', !!h5b && h5b.evenodd && h5b.holes > 0 && h5b.covered, JSON.stringify(h5b));
  await snap(app, 'item1-night-hidden-rhizome-flash');
  await sleep(1500);
  await snap(app, 'item1-night-hidden-rhizome-fading');
  await app.waitFor("document.querySelector('.wz-rhizome-field')?.dataset.flash === 'false'", { label: 'flash over', timeout: 6000 });
  await sleep(200);
  const h2after = await state(app);
  const log = await app.evalJs('window.__fl');
  ok('H2 after the fade: invisible again', h2after.field && h2after.field.vis === 'hidden', JSON.stringify(h2after.field));
  const perSec = Math.max(0, ...log.map(([t]) => log.filter(([u]) => u >= t && u < t + 1000).length - 1));
  ok('H2 flash budget: the web changes state <= 3 times in any second (true -> fading -> false)', perSec <= 3 && log.map((x) => x[1]).join('>').includes('true>fading>false'), JSON.stringify(log));

  // PARKED 2026-10-29 (SUPERSEDED by Fable's ruling: "the lamp is ambience only" - Lamp-as-progress no longer exists, so there is no
  // lamp mode in which to hide the rhizome). Original, verbatim (driver and assertion):
  // // H1: night + lamp (driver fix, assertion unchanged: since Nick's Oct 29 ruling Lamp is no longer the default, so it is picked)
  // await seedTo(7);
  // await pickBar(app, 'Night'); await pickBar(app, 'Lamp'); await sleep(200);
  // const h1rest = await state(app);
  // await crossGoal();
  // const h1flash = await state(app);
  // ok('H1 night + lamp: the rhizome is never visible, not even at the goal', h1rest.field?.vis === 'hidden' && h1flash.field?.vis === 'hidden', JSON.stringify({ rest: h1rest.field, flash: h1flash.field }));
  // await app.waitFor("document.querySelector('.wz-rhizome-field')?.dataset.flash === 'false'", { label: 'flash over', timeout: 6000 }).catch(() => {});
  // SUCCESSOR H1b (the lamp is ambience only): reaching the goal does not touch the lamp - its animation is the same before and after.
  // H4 (Fable: "give it a still frame under reduced motion"): under reduced motion the web shows still - no pop animation, no fade:
  // data-flash goes true -> false, never 'fading' - and it still shows, in brass.
  await seedTo(7);
  await pickBar(app, 'Night'); await sleep(200);
  const h1before = await state(app);
  await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]); await sleep(150);
  await crossGoal();
  const h4 = await app.evalJs("(() => { const f = document.querySelector('.wz-rhizome-field'); const seg = f && f.querySelector('.wz-rhizome-seg'); return f ? { flash: f.dataset.flash, vis: getComputedStyle(f).visibility, anim: getComputedStyle(f).animationName, stroke: seg ? getComputedStyle(seg).stroke : null } : null; })()");
  await snap(app, 'item1-night-hidden-rhizome-reduced-motion');
  await app.waitFor("document.querySelector('.wz-rhizome-field')?.dataset.flash === 'false'", { label: 'flash over (reduced)', timeout: 6000 }).catch(() => {});
  const log4 = await app.evalJs('window.__fl');
  await app.emulateMedia([]); await sleep(150);
  const h1at = await state(app);
  ok('H1b the lamp is ambience only: reaching the goal leaves the lamp\'s own animation as it was', h1before.lampAnim === h1at.lampAnim && /arbor2-breath/.test(h1at.lampAnim), JSON.stringify({ before: h1before.lampAnim, after: h1at.lampAnim }));
  ok('H4 reduced motion: a still frame - the web shows in brass with no animation, then cuts (true -> false, never fading)',
    !!h4 && h4.flash === 'true' && h4.vis === 'visible' && h4.anim === 'none' && nearBrass(h4.stroke) && Array.isArray(log4) && !log4.some((x) => x[1] === 'fading') && log4.map((x) => x[1]).join('>').includes('true>false'),
    JSON.stringify({ h4, log4 }));

  // H3: day
  await seedTo(7);
  await pickBar(app, 'Day'); await sleep(300);
  const h3 = await state(app);
  ok('H3 day: the shoots show at rest, in the leaf (#5F7A3C)', h3.field && h3.field.vis === 'visible' && h3.field.segs > 0 && h3.field.stroke === 'rgb(95, 122, 60)', JSON.stringify(h3.field));
  await snap(app, 'item1-day-rhizome');

  // R1: recede while typing
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys(' and on');
  // the recede runs on its own curve (first run read 0.59 mid-fade at 700 ms): wait for it to settle, up to 3 s, then read
  await app.waitFor("getComputedStyle(document.querySelector('.arbor2-bar')).opacity === '0'", { timeout: 3000, label: 'bar receded' }).catch(() => {});
  const r1 = await state(app);
  ok('R1 while she types the mockup bar is at opacity 0', r1.barOpacity === '0', String(r1.barOpacity));

  // S1: Flux keeps its own room under the flag
  await freshDesk(app, 'flux');
  const fluxOff = await state(app);
  await setFlag(app, true);
  await app.waitFor("!!document.querySelector('.arbor2-bar')", { label: 'bar under flux' });
  await pickBar(app, 'Day'); await sleep(150);
  const fluxOn = await state(app);
  ok('S1 scope: Flux under the flag keeps its own room (--ink-950 and --text-low byte-equal)', fluxOff.tokens.i950 === fluxOn.tokens.i950 && fluxOff.tokens.low === fluxOn.tokens.low, JSON.stringify({ off: fluxOff.tokens.i950, on: fluxOn.tokens.i950 }));
  await setFlag(app, false);
  return checks;
}, { label: 'arbor2-1' });

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nARBOR2-1 VERIFY: PASS (${checks.length} checks)` : `\nARBOR2-1 VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
