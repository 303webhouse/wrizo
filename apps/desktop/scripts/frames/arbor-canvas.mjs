// ARBOR'S CANVAS - frames for the Wrizors (Fable, Nov 18, 2:45 and 2:50 pm: "Send the Wrizors 2 frames from production: a Canvas menu and the rail, day
// and night"). Built from production's tree (main e606f3aa = train 24, index-CkTw2FEj live) plus this file only. The redesign as it ships (no query);
// the room by the CLOCK (withRoomPin: noon, and each screen's -night leg at midnight). Two canvases are seeded so the menu has rows.
// Run: gh workflow run frames.yml --ref ci/actions-harness -f ref=<sha> -f screens_file=apps/desktop/scripts/frames/arbor-canvas.mjs
//   -f screens=canvas-rail,canvas-rail-night,canvas-menu,canvas-menu-night -f themes=plateau -f tones=light -f widths=1366
// Each screen prints what it shows ("ARBOR-CANVAS <screen> {...}") and throws if the rail or the menu does not read Canvas.
import { guarded, withRoomPin } from './mockup-kit.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const say = (name, data) => console.log(`ARBOR-CANVAS ${name} ${JSON.stringify(data)}`);
const fail = (name, data) => { console.log(`ARBOR-CANVAS-FAIL ${name} ${JSON.stringify(data)}`); throw new Error(`${name} FAILED ${JSON.stringify(data)}`.slice(0, 1200)); };
const J = (v) => JSON.stringify(v);
const PAGEW = 'The morning light came in low across the table, and she began to write. The kettle ticked as it cooled.';
const ITEM = ".wz-strip-item[data-category='plan']";
const STATE = `(() => { const r = document.documentElement; const it = document.querySelector(${J(ITEM)}); const door = document.querySelector('.wz-cascade-action-door');
  const rows = [...document.querySelectorAll('.wz-sections-rows [data-entry-id], .wz-sections-rows button, .wz-sections-rows li')].map((e) => (e.textContent || '').replace(/\\s+/g, ' ').trim()).filter(Boolean).slice(0, 6);
  return { arbor: r.getAttribute('data-arbor2'), room: r.getAttribute('data-arbor2-room'), url: location.search, rail: it ? (it.textContent || '').replace(/\\s+/g, ' ').trim() : null, door: door ? (door.textContent || '').trim() : null, rows }; })()`;
const open = async (app, name) => {
  for (const [i, t] of ['Plot canvas', 'Character canvas'].entries()) {
    await app.evalJs(`window.wrizoCreateJournalPage(${J({ id: `arbor-cvf-b${i}-${Math.random().toString(36).slice(2, 6)}`, text: t, pageType: 'board', boxes: [], createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  }
  const id = `arbor-cvf-${Math.random().toString(36).slice(2, 7)}`;
  await app.evalJs(`window.wrizoCreateJournalPage(${J({ id, text: PAGEW, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`); await sleep(300);
  await app.evalJs(`history.replaceState(null, '', '/#/page/${id}')`); await app.reload();
  await waitSoft(app, "document.documentElement.getAttribute('data-arbor2') === 'true'", { label: 'the redesign', timeout: 15000 });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 25000 });
  if (!(await waitSoft(app, `!!document.querySelector('.forward-only-editor') && !!document.querySelector(${J(ITEM)})`, { label: 'page and rail', timeout: 12000 }))) fail(name, { open: false });
  await sleep(900);
  await app.evalJs("(() => { const b = [...document.querySelectorAll('.desk-mode-tab')].find((x) => (x.textContent || '').trim().toLowerCase() === 'draft'); if (b) b.click(); return !!b; })()"); await sleep(900);
};
const pressItem = async (app, name) => {
  const hit = `(() => { const e = document.querySelector(${J(ITEM)}); if (!e) return false; const r = e.getBoundingClientRect(); if (!r.width) return false; const h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!h && (h === e || e.contains(h)); })()`;
  if (!(await waitSoft(app, hit, { label: 'the Canvases item', timeout: 8000 }))) fail(name, { item: false });
  const at = await app.evalJs(`(() => { const r = document.querySelector(${J(ITEM)}).getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
  await app.mouseMove(at.x, at.y); await app.mouseDown(at.x, at.y); await app.mouseUp(at.x, at.y);
  if (!(await waitSoft(app, "!!document.querySelector('.wz-cascade-action-door')", { label: 'the Canvas menu', timeout: 6000 }))) fail(name, { menu: false });
  await sleep(800);
};
const rail = (name) => async (app) => { await open(app, name); await app.evalJs("document.querySelector('.forward-only-editor')?.blur(); getSelection()?.removeAllRanges()"); await app.mouseMove(40, 700); await sleep(600);
  const s = await app.evalJs(STATE); if (s.arbor !== 'true' || !/\bCanvases\b/.test(s.rail || '') || /arbor2=/.test(s.url)) fail(name, s); say(name, s); };
const menu = (name) => async (app) => { await open(app, name); await pressItem(app, name);
  const s = await app.evalJs(STATE); if (s.arbor !== 'true' || s.door !== 'New Canvas' || /arbor2=/.test(s.url)) fail(name, s); say(name, s); };
const screens = { 'canvas-rail': rail('canvas-rail'), 'canvas-menu': menu('canvas-menu') };
export default withRoomPin(guarded(screens, { verdict: ['ARBOR-CANVAS'] }), { bothRooms: ['canvas-rail', 'canvas-menu'] });
