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
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sameRect = (a, b) => !!a && !!b && ['x', 'y', 'w', 'h'].every((k) => Math.abs(a[k] - b[k]) <= 0.5);
const snap = async (app, name) => { if (SHOTS) fs.writeFileSync(path.join(SHOTS, `${name}.png`), Buffer.from((await app.cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64')); };
const splashGone = (app) => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 20000, label: 'splash gone' }).catch(() => {});
const setFlag = async (app, on) => {
  await app.evalJs(`history.replaceState(null, '', ${JSON.stringify(on ? '/?arbor2=1' : '/')} + location.hash)`);
  await app.reload(); await splashGone(app); await sleep(400);
};
const pickBar = (app, label) => app.evalJs(`(() => { const b = [...document.querySelectorAll('.arbor2-bar-opt')].find((x) => x.textContent.trim() === ${JSON.stringify(label)}); if (b) b.click(); return !!b; })()`);
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
    gripL: rect(document.querySelector('.wz-sliver-grip')), gripR: rect(document.querySelector('.wz-tutor-grip')),
    gripLbg: cs('.wz-sliver-grip')?.backgroundColor, gripLcolor: cs('.wz-sliver-grip')?.color, gripRbg: cs('.wz-tutor-grip')?.backgroundColor,
    tabs: { text: tab('wz-sliver-tab-text'), ink: tab('wz-sliver-tab-ink'), tutor: tab('wz-tutor-tab-tutor'), links: tab('wz-tutor-tab-links') },
    dur: rs.getPropertyValue('--drawer-dur').trim(), ease: rs.getPropertyValue('--drawer-ease').trim(),
    pop: pop ? { anim: pop.animationName, shadow: pop.boxShadow } : null, slideShadow: slide ? slide.boxShadow : null,
    popCount: document.querySelectorAll('.wz-cascade-panel').length,
  };
})()`;
const read = (app) => app.evalJs(READ);
const WALNUT = 'rgb(26, 18, 6)', SEA = 'rgb(23, 69, 78)', OXBLOOD = 'rgb(107, 31, 28)', CREAM = 'rgb(232, 220, 194)';

await withHarness(async (app) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4');");
  await app.reload();
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
    ok(`K1 [${room}] the hands' tabs are cloth: left walnut, right sea, cream lettering`, shut.gripLbg === WALNUT && shut.gripRbg === SEA && shut.gripLcolor === CREAM, JSON.stringify({ l: shut.gripLbg, r: shut.gripRbg, c: shut.gripLcolor }));
    ok(`M1 [${room}] the shared motion tokens carry Arbor's pull (240ms, cubic-bezier(.2,.8,.2,1))`, shut.dur === '240ms' && /cubic-bezier\(\s*\.2,\s*\.8,\s*\.2,\s*1\s*\)/.test(shut.ease), JSON.stringify({ dur: shut.dur, ease: shut.ease }));
    await snap(app, `item2-${room}-tabs-shut`);

    // Tools drawer
    await clickSel(app, '.wz-sliver-grip'); await sleep(110);
    await snap(app, `item4-${room}-tools-mid-pull`);
    await sleep(400);
    const l = await read(app);
    ok(`P1 [${room}] Tools drawer open: the page rect is identical`, sameRect(l.page, off.page), JSON.stringify({ on: l.page, off: off.page }));
    ok(`K2 [${room}] Tools drawer open: the left tab is where it is flag-off`, sameRect(l.gripL, offL.gripL), JSON.stringify({ on: l.gripL, off: offL.gripL }));
    ok(`M2 [${room}] the Tools drawer's leading edge is a 2 px inset --arbor-line rule`, /inset/.test(String(l.slideShadow)) && /2px/.test(String(l.slideShadow)), String(l.slideShadow));
    if (l.tabs.text) ok(`K1 [${room}] Tools' tabs are cloth: TEXT walnut, INK sea`, l.tabs.text.bg === WALNUT && l.tabs.ink?.bg === SEA, JSON.stringify(l.tabs));
    await snap(app, `item2-${room}-tools-open`);
    await clickSel(app, '.wz-sliver-grip'); await sleep(500);

    // Tutor drawer
    await clickSel(app, '.wz-tutor-grip'); await sleep(500);
    const r = await read(app);
    ok(`P1 [${room}] Tutor drawer open: the page rect is identical`, sameRect(r.page, off.page), JSON.stringify(r.page));
    ok(`K2 [${room}] Tutor drawer open: the right tab is where it is flag-off`, sameRect(r.gripR, offR.gripR), JSON.stringify({ on: r.gripR, off: offR.gripR }));
    ok(`K1 [${room}] the Tutor drawer's tabs are cloth: TUTOR sea, GRAFTS oxblood`, r.tabs.tutor?.bg === SEA && r.tabs.links?.bg === OXBLOOD, JSON.stringify(r.tabs));
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
