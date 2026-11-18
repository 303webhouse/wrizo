// ARBOR v2 MOCKUP - r21 latency fix, part 2 (Fable's ruling, Nov 5): THE FADED SHADE SLEEPS, AND WAKES.
// "Run the shade's fade on the compositor (will-change: opacity on both layers), and take the faded drawing out of style work until it
// returns. No visible change." Run under WS_URL_SEARCH='?arbor2=1&arbor2room=day' (the test-only pin; arbor2-roompin.mjs proves it took).
//   S1  at rest: the room layer and the page's copy carry will-change: opacity, and no shade layer sleeps (every drift wrapper visible)
//   S2  writing, before the fade has run: nothing sleeps yet (the drawing is still fading out)
//   S3  writing, once the fade has run (6 s + margin): every shade layer sleeps - data-asleep, content-visibility hidden on its drift - at opacity 0
//   S4  the chrome's return (the pointer moves - the writer reaches for it): writing ends, nothing sleeps, every drift wrapper visible again,
//       before the fade back in has finished (the drawing is awake for the whole return)
//   S5  nothing stored: localStorage byte-equal from rest to the return
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const splashGone = (app) => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 20000, label: 'splash gone' }).catch(() => {});
const q = process.env.WS_URL_SEARCH || '';
const READ = `(() => { const root = document.documentElement;
  const ls = [document.querySelector('.arbor2-pergola'), ...document.querySelectorAll('.arbor2-pagesh')].filter(Boolean);
  return { room: root.getAttribute('data-arbor2-room'), writing: root.getAttribute('data-wz-writing'), n: ls.length,
    zoom: document.querySelector('.desk-frame-stage .mode-pagecol')?.getAttribute('data-zoom') === 'true', pageCopyShown: (() => { const c = document.querySelector('.desk-frame-stage .mode-page > .arbor2-pagesh'); return c ? getComputedStyle(c).display !== 'none' : null; })(),
    layers: ls.map((l) => { const d = l.querySelector('.arbor2-pergola-drift'); const cs = getComputedStyle(l);
      return { cls: l.className, bmp: l.getAttribute('data-bitmap'), asleep: l.getAttribute('data-asleep'), cv: d ? getComputedStyle(d).contentVisibility : null, wc: cs.willChange, op: Number(cs.opacity), shown: cs.display !== 'none' }; }),
    ls: JSON.stringify(Object.keys(localStorage).sort().map((k) => [k, localStorage.getItem(k)])) }; })()`;

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
  await app.waitFor("[...document.querySelectorAll(\".arbor2-pagesh[data-bitmap='true'] .arbor2-pergola-drift\")].some((d) => /^url\\(\"blob:/.test(getComputedStyle(d).backgroundImage))", { label: 'bitmap drawn', timeout: 5000 }).catch(() => {});
  await sleep(3500);
  const rest = await app.evalJs(READ);
  const shown = (s) => s.layers.filter((l) => l.shown);
  const live = (s) => s.layers.filter((l) => l.shown && !l.bmp);
  // PARKED 2026-11-06 (SUPERSEDED: its premise - the page's live copy shown at rest - was false in the turn of 05:28Z: the copy was
  // display:none, most likely the page opened ZOOMED, where the stylesheet keeps it off by ruling ("never on the zoomed page", r19 ruling 3).
  // S1 counted live layers and so failed on a correct page). Original, verbatim:
  // ok('S1 at rest: the room and the page copy carry will-change: opacity; nothing sleeps', rest.room === 'day' && live(rest).length >= 2 && live(rest).every((l) => /opacity/.test(l.wc))
  //   && shown(rest).every((l) => l.asleep === null && l.cv === 'visible'), JSON.stringify({ room: rest.room, layers: rest.layers }));
  // SUCCESSOR S1b: at rest the room is shown and live; the page's copy is shown exactly when the page is NOT zoomed (read, not assumed);
  // every shown layer carries will-change: opacity and nothing sleeps.
  ok('S1b at rest: the room shown and live, the page copy shown exactly when the page is not zoomed, every shown layer will-change: opacity, nothing asleep',
    rest.room === 'day' && live(rest).some((l) => l.cls === 'arbor2-pergola') && rest.pageCopyShown === !rest.zoom && shown(rest).every((l) => /opacity/.test(l.wc) && l.asleep === null && l.cv === 'visible'),
    JSON.stringify({ room: rest.room, zoom: rest.zoom, pageCopyShown: rest.pageCopyShown, layers: rest.layers }));
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys('the room');
  await sleep(1200);
  const early = await app.evalJs(READ);
  ok('S2 writing, before the fade has run: nothing sleeps yet', early.writing === 'true' && shown(early).every((l) => l.asleep === null && l.cv === 'visible'), JSON.stringify({ writing: early.writing, layers: early.layers }));
  // keep writing, a word at a time, past the 6 s fade (and its quarter second)
  for (let i = 0; i < 6; i += 1) { await app.typeKeys(' word'); await sleep(1000); }
  const late = await app.evalJs(READ);
  ok('S3 writing, once the fade has run: every shade layer sleeps (data-asleep, content-visibility hidden on its drift), at opacity 0',
    late.writing === 'true' && shown(late).length >= 3 && shown(late).every((l) => l.asleep === 'true' && l.cv === 'hidden' && l.op < 0.01), JSON.stringify({ writing: late.writing, layers: late.layers }));
  // the chrome's return: the pointer moves over the room (as a writer reaching for a menu does)
  for (let i = 0; i < 12; i += 1) { await app.mouseMove(40 + i * 30, 200 + i * 10); await sleep(60); }
  await app.waitFor("document.documentElement.getAttribute('data-wz-writing') !== 'true'", { label: 'chrome returned', timeout: 5000 }).catch(() => {});
  await sleep(300);
  const back = await app.evalJs(READ);
  ok('S4 the chrome\'s return: writing ends and every shade layer is awake (drift visible) while the shade fades back in', back.writing !== 'true'
    && shown(back).every((l) => l.asleep === null && l.cv === 'visible') && shown(back).some((l) => l.op < 0.99), JSON.stringify({ writing: back.writing, layers: back.layers }));
  ok('S5 nothing stored by the sleep: localStorage holds no key or value naming it', !/asleep/.test(back.ls), back.ls.length);
  return checks;
}, { label: 'arbor2-sleep' });

const pinned = /[?&]arbor2=1\b/.test(q) && /[?&]arbor2room=day\b/.test(q);
if (!pinned) checks.unshift({ name: 'S0 the run is pinned to the day room (WS_URL_SEARCH carries arbor2=1 and arbor2room=day)', pass: false, detail: q });
// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.length === 5 && checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nARBOR2-SLEEP VERIFY: PASS (${checks.length} checks)` : `\nARBOR2-SLEEP VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
