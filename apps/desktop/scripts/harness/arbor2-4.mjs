// ARBOR v2 MOCKUP - §14 items 2-3 (the cloth tabs, visual half) and item 4 (the drawer pull), behind ?arbor2=1.
//
// Nick (Oct 29, on the first preview): "none of the popout menus are working for me to see the new drawer animations/tabs". Fable's ruling 4:
// dress the SHARED motion seam (--drawer-dur / --drawer-ease) with Arbor values, no new JS animation path, <= 300 ms, transform/opacity only,
// reduced motion = a cut. Ruling 3 + the Oct 7 menu-tab law: the tabs never move.
//
//   K1  the hands' edge tabs are cloth (left walnut, right sea) and the drawers' tabs are cloth per place; lettering cream
//   K2  THE TABS NEVER MOVE: the two edge tabs' rects are byte-equal flag-off vs flag-on (both rooms), drawers shut and open
//   M1  the shared tokens carry Arbor's pull: --drawer-dur 240ms, --drawer-ease cubic-bezier(.2,.8,.2,1); the pop-out runs arbor2-pull-in
//   M2  the front edge: the pop-out and the drawers wear a 2 px inset --arbor-line rule (box-shadow inset, so no box size changes)
//   M3  a closing pop-out is gone (removed) within --drawer-dur + 150 ms
//   M4  reduced motion: the pop-out does NOT run the pull (the existing short fade)
//   P1  THE PAGE NEVER MOVES: the .mode-page rect is identical with the Tools drawer, the Tutor drawer and each rail pop-out open, both rooms
//   S1  scope: flag OFF, the tokens are main's (--drawer-dur .2s) and the grip is not walnut
import fs from 'node:fs';
import path from 'node:path';
import { withHarness } from '../runtime-verify.mjs';

const SHOTS = process.env.ARBOR_SHOTS || null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// r9 DRIVER PIN (not an assertion): unset, the room now follows the CLOCK (Fable, Nov 1: Follow the clock / Always day / Always night) and
// the runner's clock is UTC. This file's checks were written for the room the page tone gave (dark = night, light = day), so after every
// flagged reload it chooses that room explicitly (data-room: Always night / Always day). The clock itself is proven in frames/arbor2-r9.mjs.
const pinRoom = (app) => app.evalJs("(() => { const r = document.documentElement; if (/[?&]arbor2=1/.test(location.search)) r.setAttribute('data-room', r.getAttribute('data-page') === 'dark' ? 'dark' : 'light'); })()");
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sameRect = (a, b) => !!a && !!b && ['x', 'y', 'w', 'h'].every((k) => Math.abs(a[k] - b[k]) <= 0.5);
const snap = async (app, name) => { if (SHOTS) fs.writeFileSync(path.join(SHOTS, `${name}.png`), Buffer.from((await app.cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64')); };
const splashGone = (app) => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 20000, label: 'splash gone' }).catch(() => {});
const setFlag = async (app, on) => {
  await app.evalJs(`history.replaceState(null, '', ${JSON.stringify(on ? '/?arbor2=1' : '/')} + location.hash)`);
  await app.reload(); await pinRoom(app); await splashGone(app); await sleep(400);
};
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
const clickSel = (app, sel) => app.evalJs(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (b) b.click(); return !!b; })()`);
const openRail = (app, label) => app.evalJs(`(() => { const b = [...document.querySelectorAll('.wz-strip-item')].find((x) => (x.textContent || '').trim().toLowerCase() === ${JSON.stringify(label.toLowerCase())}); if (b) b.click(); return !!b; })()`);

const READ = `(() => {
  const rect = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) }; };
  const cs = (sel) => { const el = document.querySelector(sel); return el ? getComputedStyle(el) : null; };
  const rs = getComputedStyle(document.documentElement);
  const tab = (id) => { const c = cs('#' + id); return c ? { bg: c.backgroundColor, color: c.color } : null; };
  const pop = cs('.wz-cascade-panel');
  const slide = cs('.wz-sliver .wz-drawer-slide');
  return {
    page: rect(document.querySelector('.mode-page')),
    gripL: rect(document.querySelector('.wz-sliver-grip')), gripR: rect(document.querySelector('.wz-tutor-grip')), panelL: rect(document.querySelector('.wz-sliver-panel')),
    gripLbg: cs('.wz-sliver-grip')?.backgroundColor, gripLcolor: cs('.wz-sliver-grip')?.color, gripRbg: cs('.wz-tutor-grip')?.backgroundColor,
    tabs: { text: tab('wz-sliver-tab-text'), type: tab('wz-sliver-tab-type'), format: tab('wz-sliver-tab-format'), presets: tab('wz-sliver-tab-presets'), ink: tab('wz-sliver-tab-ink'), tutor: tab('wz-tutor-tab-tutor'), links: tab('wz-tutor-tab-links'), board: tab('wz-tutor-tab-board') },
    dur: rs.getPropertyValue('--drawer-dur').trim(), ease: rs.getPropertyValue('--drawer-ease').trim(),
    pop: pop ? { anim: pop.animationName, shadow: pop.boxShadow } : null, slideShadow: slide ? slide.boxShadow : null,
    popCount: document.querySelectorAll('.wz-cascade-panel').length,
  };
})()`;
const read = (app) => app.evalJs(READ);
const WALNUT = 'rgb(26, 18, 6)', SEA = 'rgb(23, 69, 78)', OXBLOOD = 'rgb(107, 31, 28)', CREAM = 'rgb(232, 220, 194)';
// r5 (spec §9c): the openers olive / brass, the cloths olive (a measured deeper step), cold blue, madder; cream and walnut lettering
const OLIVE = 'rgb(107, 122, 58)', BRASS = 'rgb(255, 152, 0)', OLIVE_CLOTH = 'rgb(86, 99, 46)', BLUE = 'rgb(127, 160, 188)', MADDER = 'rgb(168, 57, 47)', CREAM5 = 'rgb(239, 228, 203)', WALNUT5 = 'rgb(43, 29, 18)';

await withHarness(async (app) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4');");
  await app.reload(); await pinRoom(app);
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted' });
  await splashGone(app); await sleep(600);

  // ---- baseline, flag off: shut, then each drawer open
  const off = await read(app);
  ok('S1 flag OFF: the shared tokens are main\'s (--drawer-dur .2s) and the left tab is not walnut', off.dur === '.2s' && off.gripLbg !== WALNUT, JSON.stringify({ dur: off.dur, bg: off.gripLbg }));
  await clickSel(app, '.wz-sliver-grip'); await sleep(500);
  const offL = await read(app);
  await clickSel(app, '.wz-sliver-grip'); await sleep(500);
  await clickSel(app, '.wz-tutor-grip'); await sleep(500);
  const offR = await read(app);
  await clickSel(app, '.wz-tutor-grip'); await sleep(500);

  await setFlag(app, true);
  for (const room of ['night', 'day']) {
    await pickBar(app, room === 'night' ? 'Night' : 'Day'); await sleep(300);
    const shut = await read(app);
    ok(`K2 [${room}] the edge tabs never move: both tab rects equal flag-off, drawers shut`, sameRect(shut.gripL, off.gripL) && sameRect(shut.gripR, off.gripR), JSON.stringify({ on: [shut.gripL, shut.gripR], off: [off.gripL, off.gripR] }));
    // PARKED 2026-10-30 (SUPERSEDED, first run on INK's shards, run 41014396358, night only: §6.2 Dim the room (Fable, Oct 29) dims an
    // unreached tab by night and letters it in --text-hi - "switching dimmed labels to the top text colour is the right fix" - so at rest the
    // night tab is not cream by design). Original, verbatim:
    // ok(`K1 [${room}] the hands' tabs are cloth: left walnut, right sea, cream lettering`, shut.gripLbg === WALNUT && shut.gripRbg === SEA && shut.gripLcolor === CREAM, JSON.stringify({ l: shut.gripLbg, r: shut.gripRbg, c: shut.gripLcolor }));
    // SUCCESSOR K1e: the tabs are cloth (left walnut, right sea) in both rooms; by day the lettering is cream; by night an unreached tab is
    // dimmed (.6) and lettered in --text-hi, and the moment the keyboard reaches it, it is cream at full strength.
    // (each read waits out the tab's own `transition:.15s` - a read straight after focus() sees the colour it is leaving)
    const AT = `(() => { const g = document.querySelector('.wz-sliver-grip'); return g ? { c: getComputedStyle(g).color, o: getComputedStyle(g).opacity } : null; })()`;
    const restL = await app.evalJs(AT);
    await app.evalJs("document.querySelector('.wz-sliver-grip')?.focus()"); await sleep(450);
    const reachedL = await app.evalJs(AT);
    await app.evalJs("document.activeElement && document.activeElement.blur()"); await sleep(450);
    const reach = restL && reachedL ? { rest: restL, reached: reachedL } : null;
    const HI = 'rgb(237, 230, 218)';
    const lettering = !!reach && (room === 'day'
      ? reach.rest.c === CREAM
      : reach.rest.c === HI && Math.abs(parseFloat(reach.rest.o) - 0.6) < 0.011 && reach.reached.c === CREAM && reach.reached.o === '1');
    // PARKED 2026-10-31 (SUPERSEDED, r5, run 41240761804: spec §9c - one opener per side, OLIVE closed and BRASS open, and the openers are not dimmed by
    // night (olive at .6 drew its arrow at 2.7:1)). Original, verbatim:
    // ok(`K1e [${room}] the hands' tabs are cloth: left walnut, right sea; lettering cream${room === 'night' ? ' when reached (dimmed at rest: .6, --text-hi)' : ''}`, shut.gripLbg === WALNUT && shut.gripRbg === SEA && lettering, JSON.stringify({ l: shut.gripLbg, r: shut.gripRbg, reach }));
    // SUCCESSOR K1f: both openers olive when closed, cream arrows, full strength at rest and when reached, in both rooms.
    const lit5 = !!reach && reach.rest.c === CREAM5 && reach.rest.o === '1' && reach.reached.c === CREAM5 && reach.reached.o === '1';
    ok(`K1f [${room}] the openers are olive when closed, cream arrows, never dimmed (rest and reached)`, shut.gripLbg === OLIVE && shut.gripRbg === OLIVE && lit5, JSON.stringify({ l: shut.gripLbg, r: shut.gripRbg, reach }));
    // PARKED 2026-10-29 (SUPERSEDED, the matcher read the spelling, not the sense): the built bundle's minifier rewrites 240ms as .24s
    // (measured on the green build: dur ".24s"), the same duration. Original, verbatim:
    // ok(`M1 [${room}] the shared motion tokens carry Arbor's pull (240ms, cubic-bezier(.2,.8,.2,1))`, shut.dur === '240ms' && /cubic-bezier\(\s*\.2,\s*\.8,\s*\.2,\s*1\s*\)/.test(shut.ease), JSON.stringify({ dur: shut.dur, ease: shut.ease }));
    // SUCCESSOR M1b: the duration in milliseconds, whatever its spelling.
    const durMs = /ms$/.test(shut.dur) ? parseFloat(shut.dur) : parseFloat(shut.dur) * 1000;
    ok(`M1b [${room}] the shared motion tokens carry Arbor's pull (240 ms in any spelling, cubic-bezier(.2,.8,.2,1))`, Math.abs(durMs - 240) < 0.5 && /cubic-bezier\(\s*0?\.2,\s*0?\.8,\s*0?\.2,\s*1\s*\)/.test(shut.ease), JSON.stringify({ dur: shut.dur, durMs, ease: shut.ease }));
    await snap(app, `item2-${room}-tabs-shut`);

    // Tools drawer
    await clickSel(app, '.wz-sliver-grip'); await sleep(110);
    await snap(app, `item4-${room}-tools-mid-pull`);
    await sleep(400);
    const l = await read(app);
    ok(`P1 [${room}] Tools drawer open: the page rect is identical`, sameRect(l.page, off.page), JSON.stringify({ on: l.page, off: off.page }));
    // PARKED 2026-11-04 (SUPERSEDED, harness 41849650962, Arbor 7b881a6f: the Wrizors (md5 d1c1dcc2, via Fable, Nov 4) put Free Write's Tools opener on the open drawer's
    // OUTER edge - it sat inside, over "Font" - so open it no longer stands where it does flag-off: on x 96, off x 209). Original, verbatim:
    // ok(`K2 [${room}] Tools drawer open: the left tab is where it is flag-off`, sameRect(l.gripL, offL.gripL), JSON.stringify({ on: l.gripL, off: offL.gripL }));
    // SUCCESSOR K2c: open, the left tab rides the drawer's outer edge - its right edge on the panel's left edge (within 1 px), at its flag-off height.
    const rides = !!l.gripL && !!l.panelL && !!offL.gripL && Math.abs(l.gripL.x + l.gripL.w - l.panelL.x) <= 1 && Math.abs(l.gripL.y - offL.gripL.y) <= 1 && Math.abs(l.gripL.h - offL.gripL.h) <= 1;
    ok(`K2c [${room}] Tools drawer open on Free Write: the left tab rides the drawer's outer edge, at its flag-off height`, rides, JSON.stringify({ on: l.gripL, panel: l.panelL, off: offL.gripL }));
    ok(`M2 [${room}] the Tools drawer's leading edge is a 2 px inset --arbor-line rule`, /inset/.test(String(l.slideShadow)) && /2px/.test(String(l.slideShadow)), String(l.slideShadow));
    // PARKED 2026-10-29 (SUPERSEDED by items 2-3's structural half, Fable's ruling 3: under the flag the Tools tabs are Font · Format · Presets · Ink,
    // so there is no TEXT tab - and this line's own `if` would have skipped it SILENTLY, a check that can never fail). Original, verbatim:
    //     if (l.tabs.text) ok(`K1 [${room}] Tools' tabs are cloth: TEXT walnut, INK sea`, l.tabs.text.bg === WALNUT && l.tabs.ink?.bg === SEA, JSON.stringify(l.tabs));
    // SUCCESSOR K1b: unconditional - on Free Write the Tools tabs are FONT (walnut) and INK (sea), and there is no TEXT tab.
    // PARKED 2026-10-31 (SUPERSEDED, r5, run 41240761804: spec §9c - Free Write's cloths are FORMAT (olive) and INK (madder); no Font tab). Original, verbatim:
    // ok(`K1b [${room}] Tools' tabs are cloth on Free Write: FONT walnut, INK sea, no TEXT tab`, !l.tabs.text && l.tabs.type?.bg === WALNUT && l.tabs.ink?.bg === SEA, JSON.stringify(l.tabs));
    // SUCCESSOR K1g: FORMAT olive cloth and INK madder, both lettered cream; no TEXT and no FONT tab; and the open drawer's opener is brass.
    // PARKED 2026-11-03 (SUPERSEDED, r17, run 41589314214: the open folder tab is FILLED brass #FF9800 with a walnut word (Nick, Nov 1: "Just have the tab turn brass when it's active"; the Wrizors' note corrected Nov 2, 11:10 pm, md5 fc26efc3) - the open FORMAT / TUTOR are brass, not olive). Original, verbatim:
    // ok(`K1g [${room}] Tools' cloths on Free Write: FORMAT olive, INK madder (cream lettering), no TEXT or FONT tab; the open opener is brass`,
    //   !l.tabs.text && !l.tabs.type && l.tabs.format?.bg === OLIVE_CLOTH && l.tabs.format?.color === CREAM5 && l.tabs.ink?.bg === MADDER && l.tabs.ink?.color === CREAM5 && l.gripLbg === BRASS, JSON.stringify({ tabs: l.tabs, grip: l.gripLbg }));
    // SUCCESSOR K1j: FORMAT (the open tab) brass with a walnut word, INK madder (cream); no TEXT or FONT tab; the open opener is brass.
    ok(`K1j [${room}] Tools' tabs on Free Write: the open FORMAT brass (walnut word), INK madder (cream), no TEXT or FONT tab; the open opener is brass`,
      !l.tabs.text && !l.tabs.type && l.tabs.format?.bg === BRASS && l.tabs.format?.color === WALNUT5 && l.tabs.ink?.bg === MADDER && l.tabs.ink?.color === CREAM5 && l.gripLbg === BRASS, JSON.stringify({ tabs: l.tabs, grip: l.gripLbg }));
    await snap(app, `item2-${room}-tools-open`);
    await clickSel(app, '.wz-sliver-grip'); await sleep(500);

    // Tutor drawer
    await clickSel(app, '.wz-tutor-grip'); await sleep(500);
    const r = await read(app);
    ok(`P1 [${room}] Tutor drawer open: the page rect is identical`, sameRect(r.page, off.page), JSON.stringify(r.page));
    ok(`K2 [${room}] Tutor drawer open: the right tab is where it is flag-off`, sameRect(r.gripR, offR.gripR), JSON.stringify({ on: r.gripR, off: offR.gripR }));
    // PARKED 2026-10-31 (SUPERSEDED, r5, run 41240761804: spec §9c - Tutor olive (main), Grafts cold blue, Board madder; no walnut, sea, oxblood or iron
    // cloth). Original, verbatim:
    // ok(`K1 [${room}] the Tutor drawer's tabs are cloth: TUTOR sea, GRAFTS oxblood`, r.tabs.tutor?.bg === SEA && r.tabs.links?.bg === OXBLOOD, JSON.stringify(r.tabs));
    // ok(`K1c [${room}] the Tutor drawer's BOARD tab is iron cloth (items 2-3)`, r.tabs.board?.bg === 'rgb(57, 65, 74)', JSON.stringify(r.tabs.board));
    // SUCCESSORS K1h / K1i: TUTOR olive cloth (cream), GRAFTS cold blue (walnut lettering); BOARD madder (cream).
    // PARKED 2026-11-03 (SUPERSEDED, r17, run 41589314214: the open folder tab is FILLED brass #FF9800 with a walnut word (Nick, Nov 1: "Just have the tab turn brass when it's active"; the Wrizors' note corrected Nov 2, 11:10 pm, md5 fc26efc3) - the open FORMAT / TUTOR are brass, not olive). Original, verbatim:
    // ok(`K1h [${room}] the Tutor drawer's cloths: TUTOR olive (cream), GRAFTS cold blue (walnut)`, r.tabs.tutor?.bg === OLIVE_CLOTH && r.tabs.tutor?.color === CREAM5 && r.tabs.links?.bg === BLUE && r.tabs.links?.color === WALNUT5, JSON.stringify(r.tabs));
    // SUCCESSOR K1k: TUTOR (the open tab) brass with a walnut word, GRAFTS cold blue (walnut).
    ok(`K1k [${room}] the Tutor drawer's tabs: the open TUTOR brass (walnut word), GRAFTS cold blue (walnut)`, r.tabs.tutor?.bg === BRASS && r.tabs.tutor?.color === WALNUT5 && r.tabs.links?.bg === BLUE && r.tabs.links?.color === WALNUT5, JSON.stringify(r.tabs));
    ok(`K1i [${room}] the Tutor drawer's BOARD cloth is madder (cream)`, r.tabs.board?.bg === MADDER && r.tabs.board?.color === CREAM5, JSON.stringify(r.tabs.board));
    await snap(app, `item3-${room}-tutor-open`);
    await clickSel(app, '.wz-tutor-grip'); await sleep(500);

    // Rail pop-outs
    for (const label of ['Pages', 'Boards', 'Journal']) {
      const found = await openRail(app, label); await sleep(110);
      if (label === 'Pages') await snap(app, `item4-${room}-pages-mid-pull`);
      await sleep(450);
      const p = await read(app);
      ok(`P1 [${room}] ${label} pop-out open: the page rect is identical`, found && sameRect(p.page, off.page), JSON.stringify({ found, page: p.page }));
      ok(`M1/M2 [${room}] ${label}: the pull (arbor2-pull-in) with a 2 px inset front edge`, !!p.pop && /arbor2-pull-in/.test(p.pop.anim) && /inset/.test(p.pop.shadow), JSON.stringify(p.pop));
      await snap(app, `item4-${room}-${label.toLowerCase()}-open`);
      await openRail(app, label);
      const t0 = Date.now();
      await app.waitFor("document.querySelectorAll('.wz-cascade-panel').length === 0", { timeout: 1500, label: 'pop-out closed' }).catch(() => {});
      const gone = Date.now() - t0;
      ok(`M3 [${room}] ${label}: a closing pop-out is gone within 240 + 150 ms`, gone <= 390 + 120 /* CDP polling slack: waitFor polls every 100 ms */, `${gone}ms`);
      await sleep(250);
    }
  }

  // M4: reduced motion keeps the short fade, never the pull
  await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]); await sleep(150);
  await openRail(app, 'Pages'); await sleep(300);
  const rm = await read(app);
  ok('M4 reduced motion: the pop-out does not run the pull (the existing short fade)', !!rm.pop && !/arbor2-pull/.test(rm.pop.anim), JSON.stringify(rm.pop));
  await openRail(app, 'Pages'); await sleep(300);
  await app.emulateMedia([]);
  await setFlag(app, false);
  return checks;
}, { label: 'arbor2-4' });

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nARBOR2-4 VERIFY: PASS (${checks.length} checks)` : `\nARBOR2-4 VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
