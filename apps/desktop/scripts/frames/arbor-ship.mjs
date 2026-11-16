// THE ARBOR SHIP - frames for the Wrizors' pass (the ship brief, gate 7: "the room by day and by night at 1366 and 2000; the light page and the dark page
// with the caret showing; the board card's sheet with its caret; the first key, 0.3 s, mid-burst and the pause plus 3 s; the splash's two doors;
// sign-in"). From the tree that ships, the redesign AS IT SHIPS: no query (on by default in Arbor), no mockup bar, every Mood switch at its ruled
// default. Run: gh workflow run frames.yml --ref ci/actions-harness -f ref=<tip> -f screens_file=apps/desktop/scripts/frames/arbor-ship.mjs
//   -f screens=<the names below> -f themes=plateau -f tones=light,dark -f widths=1366   (the -2000 screens set their own 2000 x 1125 window)
// Sign-in and sign-up are FIX's #87 screens (ci-frames.mjs built-ins `signin`, `signup`, fix-87-signin-frames). Each screen prints what it shows
// ("ARBOR-SHIP <screen> {...}") and throws with its numbers if the page is not what the screen claims.
import { guarded, withRoomPin } from './mockup-kit.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const say = (name, data) => console.log(`ARBOR-SHIP ${name} ${JSON.stringify(data)}`);
const fail = (name, data) => { console.log(`ARBOR-SHIP-FAIL ${name} ${JSON.stringify(data)}`); throw new Error(`${name} FAILED ${JSON.stringify(data)}`.slice(0, 1200)); };
const J = (v) => JSON.stringify(v);
const PAGEW = 'The morning light came in low across the table, and she began to write. The kettle ticked as it cooled, and outside a dog asked the street a question nobody answered.';
const rid = () => Math.random().toString(36).slice(2, 7);
// the redesign as it ships: no query at all (the harness's ?arbor2=0 pin and the mockup's ?arbor2=1 both left behind)
const go = async (app, hash) => {
  await app.evalJs(`history.replaceState(null, '', '/' + ${J(hash)})`); await app.reload();
  await waitSoft(app, "document.documentElement.getAttribute('data-arbor2') === 'true'", { label: 'the redesign', timeout: 15000 });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 25000 });
};
const setRoom = async (app, room) => { await app.evalJs(`document.documentElement.setAttribute('data-room', ${J(room === 'day' ? 'light' : 'dark')})`); await sleep(900); };
const STATE = "(() => { const r = document.documentElement; return { arbor: r.getAttribute('data-arbor2'), room: r.getAttribute('data-arbor2-room'), tone: r.getAttribute('data-page'), off: r.getAttribute('data-arbor2-off'), bar: !!document.querySelector('#arbor2-mockup-bar .arbor2-bar'), writing: r.getAttribute('data-wz-writing'), url: location.pathname + location.search + location.hash }; })()";
const shipState = async (app, name, extra = {}) => { const s = await app.evalJs(STATE); if (s.arbor !== 'true' || s.bar || s.off || /arbor2=/.test(s.url)) fail(name, { notTheShip: s }); say(name, { ...s, ...extra }); return s; };
const openPage = async (app, text = PAGEW) => {
  const id = `arbor-ship-${rid()}`;
  await app.evalJs(`window.wrizoCreateJournalPage(${J({ id, text, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`); await sleep(300);
  await go(app, `#/page/${id}`);
  if (!(await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'page', timeout: 12000 }))) fail('SHIP-OPEN-PAGE', { id });
  await sleep(900);
  await app.evalJs("(() => { const b = [...document.querySelectorAll('.desk-mode-tab')].find((x) => (x.textContent || '').trim().toLowerCase() === 'draft'); if (b) b.click(); return !!b; })()"); await sleep(900);
  return id;
};
const caretEnd = "(() => { const e = document.querySelector('.forward-only-editor'); if (!e) return false; e.focus(); const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()";
const room = (r, wide) => async (app) => { if (wide) await app.emulateDpr(1, 2000, 1125); await openPage(app); await setRoom(app, r); await app.evalJs("document.querySelector('.forward-only-editor')?.blur(); getSelection()?.removeAllRanges()"); await app.mouseMove(600, 300); await sleep(1200); await shipState(app, `ship-room-${r}${wide ? '-2000' : ''}`); };
const caretPage = async (app) => { await openPage(app); await setRoom(app, 'day'); await app.evalJs(caretEnd); await app.mouseMove(40, 700); await sleep(500);
  const c = await app.evalJs("(() => { const e = document.querySelector('.forward-only-editor'); return e ? { caret: getComputedStyle(e).caretColor, focused: document.activeElement === e } : null; })()");
  if (!c || !c.focused) fail('ship-page-caret', { c }); await shipState(app, 'ship-page-caret', c); };
// the first key, 0.3 s after it, mid-burst, and the pause (the chrome's return) plus 3 s - by day
const keyAt = (label, run) => async (app) => { await openPage(app); await setRoom(app, 'day'); await app.evalJs(caretEnd); await sleep(400); await run(app); await shipState(app, label); };
const screens = {
  'ship-room-day': room('day', false),
  'ship-room-night': room('night', false),
  'ship-room-day-2000': room('day', true),
  'ship-room-night-2000': room('night', true),
  'ship-page-caret': caretPage,
  'ship-card-caret': async (app) => {
    const id = `arbor-ship-board-${rid()}`;
    await app.evalJs(`window.wrizoCreateJournalPage(${J({ id, text: 'The ship board', pageType: 'board', boxes: [{ id: `${id}-box`, kind: 'text', x: 0.3, y: 0.2, w: 0.34, h: 0.18, z: 1, text: 'A card on the cream stock' }], createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
    await sleep(300); await go(app, `#/page/${id}`);
    await waitSoft(app, "!!document.querySelector('.board-box')", { label: 'card', timeout: 12000 }); await sleep(800);
    const at = await app.evalJs("(() => { const b = document.querySelector('.board-box'); if (!b) return null; const r = b.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()");
    if (!at) fail('ship-card-caret', { card: false });
    await app.mouseMove(at.x, at.y); for (const clickCount of [1, 2]) { await app.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: at.x, y: at.y, button: 'left', buttons: 1, clickCount }); await app.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: at.x, y: at.y, button: 'left', buttons: 0, clickCount }); }
    await waitSoft(app, "!!document.querySelector('.board-popup-editor')", { label: 'the card open', timeout: 6000 });
    await app.evalJs("(() => { const e = document.querySelector('.board-popup-editor'); if (!e) return false; e.focus(); const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()"); await sleep(500);
    const c = await app.evalJs("(() => { const e = document.querySelector('.board-popup-editor'); return e ? { caret: getComputedStyle(e).caretColor, focused: document.activeElement === e } : null; })()");
    if (!c || !c.focused) fail('ship-card-caret', { c }); await shipState(app, 'ship-card-caret', c);
  },
  'ship-key-first': keyAt('ship-key-first', async (app) => { await app.typeKeys('a'); await sleep(60); }),
  'ship-key-03s': keyAt('ship-key-03s', async (app) => { await app.typeKeys('a'); await sleep(300); }),
  'ship-key-mid-burst': keyAt('ship-key-mid-burst', async (app) => { for (let i = 0; i < 25; i += 1) { await app.typeKeys('a'); await sleep(110); } }),
  'ship-pause-3s': keyAt('ship-pause-3s', async (app) => { for (let i = 0; i < 25; i += 1) { await app.typeKeys('a'); await sleep(110); } await sleep(6500); await app.key('Escape'); await sleep(3000); }),
  'ship-doors': async (app) => {
    await go(app, '#/');
    await waitSoft(app, "(() => { const b = document.querySelector('.arbor2-front-doors .arbor2-door'); if (!b) return false; const r = b.getBoundingClientRect(); const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!t && (t === b || b.contains(t)); })()", { label: 'the doors shown', timeout: 25000 });
    await sleep(1200);
    const doors = await app.evalJs("[...document.querySelectorAll('.arbor2-front-doors .arbor2-door')].map((b) => (b.textContent || '').trim())");
    if (!doors || doors.length !== 2) fail('ship-doors', { doors }); await shipState(app, 'ship-doors', { doors });
  },
};

// every screen under the kit's room pin (midday unless the screen sets its own room), as r23's
export default withRoomPin(guarded(screens, { verdict: ['ARBOR-SHIP'] }));
