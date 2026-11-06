// ARBOR v2 MOCKUP - THE SHADE LOOK TRADE, as pictures for Nick (Fable, Nov 6: "if only the bitmap build goes green, the shade and the breeze must
// change. That's a LOOK trade for Nick: hand it up with before/after frames (day + night), and build nothing until he rules").
// The SAME screens on two branches: BEFORE = arbor/mockup-r21 (the room and the page copy are the live drawing: blur, breeze, drift) and AFTER =
// the all-bitmap TEST BUILD (one bitmap of the same drawing everywhere: the drift stays, the breeze goes). A still frame cannot show the breeze;
// the pictures show the SHADE ITSELF is the same. Picture screens only (no verdict): INK's frames job,
//   -f themes=plateau -f tones=light -f screens_file=apps/desktop/scripts/frames/arbor2-shade-look.mjs -f screens=<the names below>
import { guarded } from './mockup-kit.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const PAGEW = 'The morning light came in low across the table, and she began to write. The kettle ticked as it cooled, and outside a dog asked the street a question nobody answered.';
const openPage = async (app, id) => {
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: PAGEW, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await sleep(300);
  await app.evalJs(`history.replaceState(null, '', '/?arbor2=1#/page/${id}')`); await app.reload();
  await waitSoft(app, "document.documentElement.getAttribute('data-arbor2') === 'true'", { label: 'flag', timeout: 15000 });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 });
  await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'page' }); await sleep(900);
  await app.evalJs("(() => { const b = [...document.querySelectorAll('.desk-mode-tab')].find((x) => (x.textContent || '').trim().toLowerCase() === 'draft'); if (b) b.click(); return !!b; })()"); await sleep(900);
  await app.evalJs("document.querySelector('.forward-only-editor')?.blur(); getSelection()?.removeAllRanges()");
};
// the Room row's own choice (data-room: light = Always day, dark = Always night), then the room's fade has landed and the bitmap is drawn
const setRoom = async (app, room) => {
  await app.evalJs(`document.documentElement.setAttribute('data-room', ${JSON.stringify(room === 'day' ? 'light' : 'dark')})`);
  await sleep(3400);
  if (room === 'day') await waitSoft(app, "[...document.querySelectorAll('.arbor2-pergola-drift')].every((d) => !!d.querySelector('svg') || /^url\\(\"blob:/.test(getComputedStyle(d).backgroundImage))", { label: 'shade drawn', timeout: 5000 });
};
const openDrawer = async (app) => { await app.evalJs("(() => { const g = document.querySelector('.wz-tutor-grip'); if (g) g.click(); return !!g; })()"); await sleep(900); };

const screens = {
  'shade-pic-day-rest': async (app) => { await openPage(app, 'arbor-shade-day'); await setRoom(app, 'day'); },
  'shade-pic-day-drawer': async (app) => { await openPage(app, 'arbor-shade-drawer'); await setRoom(app, 'day'); await openDrawer(app); },
  'shade-pic-night-rest': async (app) => { await openPage(app, 'arbor-shade-night'); await setRoom(app, 'night'); },
  'shade-pic-night-drawer': async (app) => { await openPage(app, 'arbor-shade-ndrawer'); await setRoom(app, 'night'); await openDrawer(app); },
};

export default guarded(screens, { verdict: ['ARBOR-SHADE'] });
