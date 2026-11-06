// ARBOR v2 MOCKUP - r21 latency fix (Fable's ruling, Nov 5): THE PREMISE OF A PINNED-ROOM RUN, and the bitmap copies it measures.
// A guard run under WS_URL_SEARCH='?arbor2=1&arbor2room=day' (or night) certifies the room it claims ONLY if the pin took. This file is run in
// the same turn, under the same WS_URL_SEARCH, before and after the guard. It FAILS (never passes blind) when the URL carries no pin.
//   P1  the URL carries the flag and a pin (arbor2room=day|night) - else every check below is about nothing
//   P2  the room in force (<html data-arbor2-room>) is the pinned room, whatever the box's clock says
//   P3  nothing stored: no localStorage key or value names the pin
//   by day only:
//   P4  the room's pergola is r20's live drawing: its svg, 115 leaf clusters, its drift animation running
//   P5  the page's copy is r20's live drawing (svg, g[filter] at 0.034)
//   P6  the top bar's and the rail's copies draw the ONE bitmap: no svg inside, a blob: background, the drift box at 0.034, the literal-pixel
//       drift (arbor2-pergola-drift-px) started at the room drift's own start time, the box on the room's drift box (+-1.5 px)
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const splashGone = (app) => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 20000, label: 'splash gone' }).catch(() => {});
const q = process.env.WS_URL_SEARCH || '';
const want = (/[?&]arbor2room=(day|night)\b/.exec(q) || [])[1] || null;

const READ = `(() => {
  const root = document.documentElement, room = document.querySelector('.arbor2-pergola'), rd = room && room.querySelector('.arbor2-pergola-drift'), rr = rd && rd.getBoundingClientRect();
  const ra = rd ? rd.getAnimations().find((a) => a.animationName === 'arbor2-pergola-drift') : null;
  const host = (sel) => [...document.querySelectorAll(sel)].find((e) => e.getBoundingClientRect().width > 0);
  const copy = (sel) => { const h = host(sel); if (!h) return null; const c = [...h.children].find((e) => e.classList.contains('arbor2-pagesh')); if (!c) return { none: true };
    const d = c.querySelector('.arbor2-pergola-drift'), b = d && d.getBoundingClientRect(), a = d && d.getAnimations()[0], cs = getComputedStyle(c), g = c.querySelector('svg g[filter]');
    return { bitmap: c.getAttribute('data-bitmap'), svg: !!c.querySelector('svg'), g: g ? Number(g.getAttribute('opacity')) : null, bg: d ? getComputedStyle(d).backgroundImage.slice(0, 12) : null,
      alpha: d ? Number(getComputedStyle(d).opacity) : null, display: cs.display, anim: a ? a.animationName : null, dt: a && ra && a.startTime != null && ra.startTime != null ? a.startTime - ra.startTime : null,
      box: b && rr ? [b.left - rr.left, b.top - rr.top, b.width - rr.width, b.height - rr.height].map((v) => Math.round(v * 10) / 10) : null }; };
  const ls = Object.keys(localStorage).map((k) => k + '=' + localStorage.getItem(k)).join('|');
  return { search: location.search, room: root.getAttribute('data-arbor2-room'), hour: new Date().getHours(), stored: /arbor2room/.test(ls),
    pergola: room ? { display: getComputedStyle(room).display, svg: !!room.querySelector('svg'), leaves: room.querySelectorAll('.wz-leaf').length, anim: ra ? ra.playState : null } : null,
    page: copy('.desk-frame-stage .mode-page'), bar: copy('.chrome-top.sprint-nav'), rail: copy('.desk-frame-strip') };
})()`;

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
  await splashGone(app);
  await app.waitFor("!!document.querySelector('.arbor2-bar')", { label: 'flagged', timeout: 10000 }).catch(() => {});
  // the copies attach on the next frame and the bitmap is drawn once, asynchronously: wait on it (observable state), at most 5 s
  if (want === 'day') await app.waitFor("[...document.querySelectorAll(\".arbor2-pagesh[data-bitmap='true'] .arbor2-pergola-drift\")].some((d) => /^url\\(\"blob:/.test(getComputedStyle(d).backgroundImage))", { label: 'bitmap drawn', timeout: 5000 }).catch(() => {});
  await sleep(600);
  const s = await app.evalJs(READ);
  ok('P1 the URL carries the flag and a room pin (arbor2room=day|night): a pinned run certifies nothing without one', /[?&]arbor2=1\b/.test(s.search) && !!want && s.search.includes(`arbor2room=${want}`), JSON.stringify({ env: q, search: s.search }));
  ok(`P2 the room in force is the pinned room (${want}) whatever the clock says`, !!want && s.room === want, JSON.stringify({ room: s.room, localHour: s.hour }));
  ok('P3 nothing stored: no localStorage key or value names the pin', s.stored === false, String(s.stored));
  if (want === 'day') {
    const p = s.pergola, pg = s.page, bar = s.bar, rail = s.rail;
    ok('P4 the room\'s pergola is r20\'s live drawing: shown, its svg, 115 leaf clusters, its drift running', !!p && p.display !== 'none' && p.svg && p.leaves === 115 && p.anim === 'running', JSON.stringify(p));
    ok('P5 the page\'s copy is r20\'s live drawing (svg, g[filter] at 0.034)', !!pg && pg.bitmap === null && pg.svg === true && pg.g != null && Math.abs(pg.g - 0.034) < 0.0005, JSON.stringify(pg));
    const bmpOk = (c) => !!c && c.bitmap === 'true' && c.svg === false && c.bg === 'url("blob:ht' && c.alpha != null && Math.abs(c.alpha - 0.034) < 0.0005 && c.display !== 'none'
      && c.anim === 'arbor2-pergola-drift-px' && c.dt != null && Math.abs(c.dt) < 1 && !!c.box && c.box.every((v, i) => Math.abs(v) <= (i < 2 ? 1.5 : 2));
    ok('P6 the top bar\'s and the rail\'s copies draw the one bitmap (no svg, blob: background, 0.034), on the literal-pixel drift in step with the room\'s, on the room\'s drift box', bmpOk(bar) && bmpOk(rail), JSON.stringify({ bar, rail }));
  }
  return checks;
}, { label: 'arbor2-roompin' });

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.length >= 3 && checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nARBOR2-ROOMPIN VERIFY: PASS (${checks.length} checks)` : `\nARBOR2-ROOMPIN VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
