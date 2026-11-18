// NICK'S RULINGS OF NOV 18 (10:06 am, via Fable 10:12 am) - the changed frames for Fable: (1) the page tone follows the room - by day the page is
// always light and no Page: Dark is offered, at night the choice stays; (2) the leaves flutter in gusts. The redesign as it ships (no query).
// Run: gh workflow run frames.yml --ref ci/actions-harness -f ref=<tip> -f screens_file=apps/desktop/scripts/frames/arbor-tone-gusts.mjs
//   -f screens=tone-room-day,tone-room-night,tone-panel-day,tone-panel-night,gust-peak,gust-still -f themes=plateau -f tones=light,dark -f widths=1366
// The runner's tone is the SAVED choice (ci-frames.mjs freshDesk writes wrizo-theme-prefs.page): by day the light and dark legs draw the same light
// page (the runner's own "byte-identical twins" line names them - that is the ruling, seen), at night they differ. Each screen prints what it
// shows ("ARBOR-TG <screen> {...}") and throws with its numbers if the page is not what the screen claims.
import { guarded, withRoomPin } from './mockup-kit.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const say = (name, data) => console.log(`ARBOR-TG ${name} ${JSON.stringify(data)}`);
const fail = (name, data) => { console.log(`ARBOR-TG-FAIL ${name} ${JSON.stringify(data)}`); throw new Error(`${name} FAILED ${JSON.stringify(data)}`.slice(0, 1200)); };
const J = (v) => JSON.stringify(v);
const PAGEW = 'The morning light came in low across the table, and she began to write. The kettle ticked as it cooled, and outside a dog asked the street a question nobody answered.';
const go = async (app, hash) => {
  await app.evalJs(`history.replaceState(null, '', '/' + ${J(hash)})`); await app.reload();
  await waitSoft(app, "document.documentElement.getAttribute('data-arbor2') === 'true'", { label: 'the redesign', timeout: 15000 });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 25000 });
};
const setRoom = async (app, room) => { await app.evalJs(`document.documentElement.setAttribute('data-room', ${J(room === 'day' ? 'light' : 'dark')})`); await sleep(900); };
const STATE = `(() => { const r = document.documentElement; let saved = null; try { saved = JSON.parse(localStorage.getItem('wrizo-theme-prefs') || 'null'); } catch {}
  const panel = document.querySelector('.wz-theme-picker'); const pageRow = panel ? [...panel.querySelectorAll('.mode-crow > span:first-child')].some((s) => (s.textContent || '').trim() === 'Page') : null;
  return { arbor: r.getAttribute('data-arbor2'), room: r.getAttribute('data-arbor2-room'), dataPage: r.getAttribute('data-page'), saved: saved && saved.page, panel: !!panel, pageRow, url: location.search }; })()`;
const openPage = async (app) => {
  const id = `arbor-tg-${Math.random().toString(36).slice(2, 7)}`;
  await app.evalJs(`window.wrizoCreateJournalPage(${J({ id, text: PAGEW, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`); await sleep(300);
  await go(app, `#/page/${id}`);
  if (!(await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'page', timeout: 12000 }))) fail('TG-OPEN-PAGE', { id });
  await sleep(900);
};
const rest = async (app) => { await app.evalJs("document.querySelector('.forward-only-editor')?.blur(); getSelection()?.removeAllRanges()"); await app.mouseMove(40, 700); await sleep(600); };
const openPanel = async (app, name) => {
  const sel = ".wz-strip-item[data-category='theme']";
  const hit = `(() => { const e = document.querySelector(${J(sel)}); if (!e) return false; const r = e.getBoundingClientRect(); if (!r.width) return false; const h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!h && (h === e || e.contains(h)); })()`;
  if (!(await waitSoft(app, hit, { label: 'the Themes item', timeout: 8000 }))) fail(name, { themesItem: false });
  const at = await app.evalJs(`(() => { const r = document.querySelector(${J(sel)}).getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
  await app.mouseMove(at.x, at.y); await app.mouseDown(at.x, at.y); await app.mouseUp(at.x, at.y);
  if (!(await waitSoft(app, "!!document.querySelector('.wz-theme-picker')", { label: 'the Themes panel', timeout: 5000 }))) fail(name, { panel: false });
  await sleep(700);
};
const PHASE = "(() => { const g = document.querySelector('.arbor2-pergola .arbor2-live .wz-leaf'); const a = g && g.getAnimations().find((x) => x.animationName === 'arbor2-breeze'); if (!a) return null; const d = Number(a.effect.getTiming().delay); return (((Number(a.currentTime) - d) % 16000) + 16000) % 16000; })()";
const ANGLES = "(() => { const xs = [...document.querySelectorAll('.arbor2-pergola .arbor2-live .wz-leaf')].map((g) => { const m = /matrix\\(([^,]+),\\s*([^,]+)/.exec(getComputedStyle(g).transform || ''); return m ? Math.round(Math.atan2(Number(m[2]), Number(m[1])) * 1800 / Math.PI) / 10 : 0; }); return { n: xs.length, min: Math.min(...xs), max: Math.max(...xs) }; })()";
const toPhase = async (app, lo, hi) => { for (let i = 0; i < 400; i += 1) { const p = await app.evalJs(PHASE); if (p != null && p >= lo && p <= hi) return p; await sleep(p != null && (p < lo - 300 || p > hi) ? 150 : 10); } return null; };

const screens = {
  'tone-room-day': async (app, ctx) => { await openPage(app); await setRoom(app, 'day'); await rest(app); const s = await app.evalJs(STATE);
    if (s.arbor !== 'true' || s.room !== 'day' || s.dataPage !== 'light' || s.saved !== ctx.tone) fail('tone-room-day', s); say('tone-room-day', s); },
  'tone-room-night': async (app, ctx) => { await openPage(app); await setRoom(app, 'night'); await rest(app); const s = await app.evalJs(STATE);
    if (s.arbor !== 'true' || s.room !== 'night' || s.dataPage !== ctx.tone || s.saved !== ctx.tone) fail('tone-room-night', s); say('tone-room-night', s); },
  'tone-panel-day': async (app, ctx) => { await openPage(app); await setRoom(app, 'day'); await openPanel(app, 'tone-panel-day'); const s = await app.evalJs(STATE);
    if (s.room !== 'day' || s.dataPage !== 'light' || s.pageRow !== false || s.saved !== ctx.tone) fail('tone-panel-day', s); say('tone-panel-day', s); },
  'tone-panel-night': async (app, ctx) => { await openPage(app); await setRoom(app, 'night'); await openPanel(app, 'tone-panel-night'); const s = await app.evalJs(STATE);
    if (s.room !== 'night' || s.dataPage !== ctx.tone || s.pageRow !== true) fail('tone-panel-night', s); say('tone-panel-night', s); },
  'gust-peak': async (app) => { await openPage(app); await setRoom(app, 'day'); await rest(app); await sleep(1500); const p = await toPhase(app, 240, 300); const a = await app.evalJs(ANGLES);
    if (p == null || a.n !== 115 || a.min < 3 || a.max - a.min > 1) fail('gust-peak', { p, a }); say('gust-peak', { phase: Math.round(p), angles: a, ...(await app.evalJs(STATE)) }); },
  'gust-still': async (app) => { await openPage(app); await setRoom(app, 'day'); await rest(app); await sleep(1500); const p = await toPhase(app, 5000, 13000); const a = await app.evalJs(ANGLES);
    if (p == null || a.n !== 115 || Math.abs(a.min) > 0.05 || Math.abs(a.max) > 0.05) fail('gust-still', { p, a }); say('gust-still', { phase: Math.round(p), angles: a, ...(await app.evalJs(STATE)) }); },
};

export default withRoomPin(guarded(screens, { verdict: ['ARBOR-TG'] }));
