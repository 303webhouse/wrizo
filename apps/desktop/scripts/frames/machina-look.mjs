// MACHINA'S LOOK - frames for the Wrizors' blockers-only pass (Fable, Nov 20, 7:55 am: "Send the Wrizors the frames now: rooms light/dark, both
// casts, 1366 and 1920, a Doc, a Board, the Typewriter page"). From machina/look AS IT SHIPS: no query (on by default in Machina), no mockup bar.
// THE ROOM FOLLOWS THE RUN'S TONE: tone light = the Day room on the light page, tone dark = the Night room on the dark page (the room is set the way
// every Room row sets it, <html data-room>; the page tone is the frames job's own). THE CAST is the screen's: -cool / -neutral (Machina's stored
// cast, the key setCast writes, set before the load).
// Run: gh workflow run frames.yml --ref ci/actions-harness -f ref=<sha> -f screens_file=apps/desktop/scripts/frames/machina-look.mjs
//   -f screens=machina-doc-cool,machina-doc-neutral,machina-board-cool,machina-board-neutral,machina-typewriter-cool,machina-typewriter-neutral
//   -f themes=machina -f tones=light,dark -f widths=1366,1920
// Each screen prints what it shows ("MACHINA-FRAMES <screen> {...}") and throws with its numbers if the page is not what the screen claims.
import { guarded } from './mockup-kit.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const J = (v) => JSON.stringify(v);
const say = (name, data) => console.log(`MACHINA-FRAMES ${name} ${J(data)}`);
const fail = (name, data) => { console.log(`MACHINA-FRAMES-FAIL ${name} ${J(data)}`); throw new Error(`${name} FAILED ${J(data)}`.slice(0, 1200)); };
const rid = () => Math.random().toString(36).slice(2, 7);
const DOC = 'The morning light came in low across the table, and she began to write.\nThe kettle ticked as it cooled, and outside a dog asked the street a question nobody answered.\nShe kept going. The second page is always easier than the first, and the third is easier still, if she does not stop to read the first two.';

// the look as it ships: the address carries no query (the harness's pin left behind); the cast and any writing setting are set before the load
const load = async (app, cast, extra = '') => {
  await app.evalJs(`localStorage.setItem('wrizo-machina-cast', ${J(cast)}); ${extra} true`);
  await app.evalJs("history.replaceState(null, '', '/#/')"); await app.reload();
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 25000 });
  await waitSoft(app, "document.documentElement.getAttribute('data-machina2') === 'true'", { label: 'the look', timeout: 15000 });
};
const seed = async (app, row) => { await app.evalJs(`!!window.wrizoCreateJournalPage(${J({ createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page', ...row })})`); await sleep(300); };
const setRoom = async (app, tone) => {
  const want = tone === 'dark' ? 'dark' : 'light';
  await app.evalJs(`document.documentElement.setAttribute('data-room', ${J(want)})`);
  await waitSoft(app, `document.documentElement.getAttribute('data-machina2-room') === ${J(want)}`, { label: 'the room', timeout: 5000 }); await sleep(700);
};
const STATE = `(() => { const r = document.documentElement; return { look: r.getAttribute('data-machina2'), theme: r.getAttribute('data-theme'), cast: r.getAttribute('data-cast'),
  room: r.getAttribute('data-machina2-room'), choice: r.getAttribute('data-room'), page: r.getAttribute('data-page'), bar: !!document.querySelector('#machina2-mockup .machina2-bar'),
  zoom: document.querySelector('.mode-pagecol')?.getAttribute('data-zoom') === 'true', url: location.pathname + location.search + location.hash }; })()`;
const check = async (app, name, ctx, cast, want) => {
  await app.mouseMove(Math.round(ctx.width / 2), 40); await sleep(600);   // chrome returns on pointer intent
  const s = await app.evalJs(STATE);
  const room = ctx.tone === 'dark' ? 'dark' : 'light';
  const bad = s.look !== 'true' || s.theme !== 'machina' || s.cast !== cast || s.room !== room || s.page !== ctx.tone || s.bar || /machina2=/.test(s.url) || !want(s);
  if (bad) fail(name, { notTheLook: s, wanted: { cast, room, page: ctx.tone } });
  say(name, s);
};

const doc = (cast) => async (app, ctx) => {
  const name = `machina-doc-${cast}`;
  await load(app, cast);
  const id = `mframes-doc-${rid()}`;
  await seed(app, { id, text: DOC });
  await app.evalJs(`localStorage.setItem('wrizo-mode-page-${id}', 'drafting'); location.hash = '#/page/${id}'; true`);
  if (!(await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'the doc', timeout: 15000 }))) fail(name, { page: false });
  await sleep(1200); await setRoom(app, ctx.tone);
  await check(app, name, ctx, cast, (s) => s.zoom === false && /#\/page\//.test(s.url));
};
const board = (cast) => async (app, ctx) => {
  const name = `machina-board-${cast}`;
  await load(app, cast);
  const id = `mframes-board-${rid()}`;
  const boxes = [
    { id: `${id}-a`, kind: 'text', x: 0.08, y: 0.12, w: 0.26, h: 0.16, z: 1, text: 'She keeps the letters in a tin.' },
    { id: `${id}-b`, kind: 'text', x: 0.40, y: 0.20, w: 0.26, h: 0.16, z: 2, text: 'The brother arrives on the Tuesday train.' },
    { id: `${id}-c`, kind: 'text', x: 0.20, y: 0.48, w: 0.30, h: 0.18, z: 3, text: 'What the town remembers is not what happened.' },
  ];
  await seed(app, { id, text: 'The Machina board', pageType: 'board', boxes });
  await app.evalJs(`location.hash = '#/page/${id}'; true`);
  if (!(await waitSoft(app, "document.querySelectorAll('.board-box').length >= 3", { label: 'the board', timeout: 15000 }))) fail(name, { cards: await app.evalJs("document.querySelectorAll('.board-box').length") });
  await sleep(1200); await setRoom(app, ctx.tone);
  await check(app, name, ctx, cast, (s) => /#\/page\//.test(s.url));
};
const typewriter = (cast) => async (app, ctx) => {
  const name = `machina-typewriter-${cast}`;
  await load(app, cast, "localStorage.setItem('wrizo-writing-settings', JSON.stringify({ typewriter: true }));");
  const id = `mframes-tw-${rid()}`;
  await seed(app, { id, text: DOC });
  await app.evalJs(`localStorage.setItem('wrizo-mode-page-${id}', 'journal'); location.hash = '#/page/${id}'; true`);
  if (!(await waitSoft(app, "document.querySelector('.mode-pagecol')?.getAttribute('data-zoom') === 'true'", { label: 'the Typewriter page', timeout: 15000 }))) fail(name, { zoom: false, s: await app.evalJs(STATE) });
  await sleep(1200); await setRoom(app, ctx.tone);
  await check(app, name, ctx, cast, (s) => s.zoom === true);
};

const screens = {};
for (const cast of ['cool', 'neutral']) {
  screens[`machina-doc-${cast}`] = doc(cast);
  screens[`machina-board-${cast}`] = board(cast);
  screens[`machina-typewriter-${cast}`] = typewriter(cast);
}
export default guarded(screens, { verdict: ['MACHINA-FRAMES'] });
