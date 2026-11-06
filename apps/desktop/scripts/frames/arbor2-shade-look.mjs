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
// NICK'S RULING B (Nov 6): the swap's look. The SAME moment shot twice - the live drawing, then the still picture (a test-only style in this page
// shows the still picture exactly as the writing signal would, without writing, so nothing else moves between the two shots). The shiver pair
// holds every leaf at its shiver's peak (its own delay + 250 ms, paused), the worst moment for a first key to land.
const SHOW_STILL = "(() => { const s = document.createElement('style'); s.textContent = \".arbor2-pergola-drift > .arbor2-still{ display:block !important; } .arbor2-pergola-drift > .arbor2-live{ content-visibility:hidden !important; }\"; document.head.appendChild(s); return true; })()";
const HOLD = (shiver) => `(() => { document.getAnimations().forEach((a) => { const t = a.effect && a.effect.target; if (!t || !t.closest || !t.closest('.arbor2-pergola, .arbor2-pagesh')) return;
  const leaf = t.classList && t.classList.contains('wz-leaf'); a.pause(); a.currentTime = leaf && ${shiver ? 'true' : 'false'} ? (a.effect.getTiming().delay || 0) + 250 : 4000; }); return true; })()`;
const swapPic = async (app, id, shiver, still) => { await openPage(app, id); await setRoom(app, 'day'); await app.evalJs(HOLD(shiver)); await sleep(300); if (still) { await app.evalJs(SHOW_STILL); await sleep(300); } };
// the flash at its hold (Fable, Nov 6: the flash copy's mask pre-rendered - the look identical): a page one word short of its goal, the word, every
// finite animation landed - the brass copy at full
const flashPic = async (app, id, room) => {
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: 'light kettle street table question morning dog', createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await app.evalJs("localStorage.setItem('wrizo-writing-settings', JSON.stringify({ ...JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'), progress: 'words', progressStyle: 'rhizome' }))");
  await app.evalJs(`window.wrizoSetWritingGoal(${JSON.stringify({ n: 8, unit: 'words' })})`); await sleep(300);
  await app.evalJs(`history.replaceState(null, '', '/?arbor2=1#/page/${id}')`); await app.reload();
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 });
  await waitSoft(app, "!!document.querySelector('.wz-rhizome-field')", { label: 'field' }); await sleep(900);
  await setRoom(app, room);
  await app.evalJs("(() => { const e = document.querySelector('.forward-only-editor'); if (!e) return false; e.focus(); const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()");
  for (const ch of ' word') { await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: ch, text: ch, unmodifiedText: ch }); await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: ch }); await sleep(40); }
  await waitSoft(app, "!!document.querySelector('.arbor2-vines-flash')", { label: 'flash', timeout: 3000 }); await sleep(200);
  await app.evalJs("(() => { document.getAnimations().forEach((a) => { try { if (a.effect && Number.isFinite(a.effect.getComputedTiming().endTime)) a.finish(); else a.pause(); } catch {} }); return true; })()"); await sleep(200);
};
const openDrawer = async (app) => { await app.evalJs("(() => { const g = document.querySelector('.wz-tutor-grip'); if (g) g.click(); return !!g; })()"); await sleep(900); };

const screens = {
  'shade-pic-day-rest': async (app) => { await openPage(app, 'arbor-shade-day'); await setRoom(app, 'day'); },
  'shade-pic-day-drawer': async (app) => { await openPage(app, 'arbor-shade-drawer'); await setRoom(app, 'day'); await openDrawer(app); },
  'shade-pic-night-rest': async (app) => { await openPage(app, 'arbor-shade-night'); await setRoom(app, 'night'); },
  'shade-pic-night-drawer': async (app) => { await openPage(app, 'arbor-shade-ndrawer'); await setRoom(app, 'night'); await openDrawer(app); },
  'shade-pic-swap-live': async (app) => { await swapPic(app, 'arbor-swap-live', false, false); },
  'shade-pic-swap-still': async (app) => { await swapPic(app, 'arbor-swap-still', false, true); },
  'shade-pic-swap-live-shiver': async (app) => { await swapPic(app, 'arbor-swap-live-sh', true, false); },
  'shade-pic-swap-still-shiver': async (app) => { await swapPic(app, 'arbor-swap-still-sh', true, true); },
  'shade-pic-flash-night': async (app) => { await flashPic(app, 'arbor-flash-night', 'night'); },
  'shade-pic-flash-day': async (app) => { await flashPic(app, 'arbor-flash-day', 'day'); },
};

export default guarded(screens, { verdict: ['ARBOR-SHADE'] });
