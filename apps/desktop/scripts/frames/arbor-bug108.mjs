// #108 (FABLE, Nov 18, 1:45 pm) - the changed frames: the count row on the UNFRAMED page (Typewriter by night, page-less) takes the room's colours
// (no plate, the room's low lettering, the bar's track on the room's surface); a FRAMED page at night keeps the page's plate. The redesign as it
// ships (no query). The runner's tone is the SAVED choice (ci-frames.mjs writes wrizo-theme-prefs.page).
// Run: gh workflow run frames.yml --ref ci/actions-harness -f ref=<tip> -f screens_file=apps/desktop/scripts/frames/arbor-bug108.mjs
//   -f screens=b108-unframed-night,b108-framed-night -f themes=plateau -f tones=light,dark -f widths=1366
import { guarded, withRoomPin } from './mockup-kit.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const say = (name, data) => console.log(`ARBOR-B108 ${name} ${JSON.stringify(data)}`);
const fail = (name, data) => { console.log(`ARBOR-B108-FAIL ${name} ${JSON.stringify(data)}`); throw new Error(`${name} FAILED ${JSON.stringify(data)}`.slice(0, 1200)); };
const J = (v) => JSON.stringify(v);
const PAGEW = 'The morning light came in low across the table, and she began to write. The kettle ticked as it cooled, and outside a dog asked the street a question nobody answered.';
const STATE = "(() => { const r = document.documentElement; const i = document.querySelector('.desk-frame-instrument'); return { arbor: r.getAttribute('data-arbor2'), room: r.getAttribute('data-arbor2-room'), page: r.getAttribute('data-page'), zoom: !!document.querySelector('.mode-pagecol[data-zoom=\"true\"]'), plate: i ? getComputedStyle(i).backgroundColor : null, count: (() => { const s = document.querySelector('.mode-pmeta > span:first-child'); return s ? getComputedStyle(s).color : null; })() }; })()";
const open = async (app, mode) => {
  await app.evalJs("localStorage.setItem('wrizo-writing-settings', JSON.stringify({ progress: 'words', progressStyle: 'bar' })); true");
  const id = `arbor-b108f-${Math.random().toString(36).slice(2, 7)}`;
  await app.evalJs(`window.wrizoCreateJournalPage(${J({ id, text: PAGEW, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`); await sleep(300);
  await app.evalJs(`history.replaceState(null, '', '/#/page/${id}')`); await app.reload();
  await waitSoft(app, "document.documentElement.getAttribute('data-arbor2') === 'true'", { label: 'the redesign', timeout: 15000 });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 25000 });
  if (!(await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'page', timeout: 12000 }))) fail('B108-OPEN', { id });
  await sleep(900);
  await app.evalJs(`(() => { const b = [...document.querySelectorAll('.desk-mode-tab')].find((x) => (x.textContent || '').trim().toLowerCase() === ${J(mode)}); if (b) b.click(); return !!b; })()`); await sleep(1200);
  await app.evalJs("document.documentElement.setAttribute('data-room', 'dark')"); await sleep(1200);
  await app.evalJs("document.querySelector('.forward-only-editor')?.blur(); getSelection()?.removeAllRanges()"); await app.mouseMove(40, 700); await sleep(700);
  return app.evalJs(STATE);
};
const screens = {
  'b108-unframed-night': async (app, ctx) => { const s = await open(app, 'free write');
    if (s.arbor !== 'true' || s.room !== 'night' || !s.zoom || !/rgba\(0, 0, 0, 0\)|transparent/.test(s.plate || '')) fail('b108-unframed-night', s); say('b108-unframed-night', { ...s, tone: ctx.tone }); },
  'b108-framed-night': async (app, ctx) => { const s = await open(app, 'draft');
    if (s.arbor !== 'true' || s.room !== 'night' || s.zoom || /rgba\(0, 0, 0, 0\)|transparent/.test(s.plate || '')) fail('b108-framed-night', s); say('b108-framed-night', { ...s, tone: ctx.tone }); },
};
export default withRoomPin(guarded(screens, { verdict: ['ARBOR-B108'] }));
