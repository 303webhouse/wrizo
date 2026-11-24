// PRESETS-B items 4-5: the two counted decks Fable named, dealt onto a board, as frames - Timeline and Memory Map at three, five and seven cards, through the frames job's --screens-file.
//   gh workflow run frames.yml --ref ci/actions-harness -f ref=<full sha> -f screens=timeline-three,timeline-five,timeline-seven,memory-map-three,memory-map-five,memory-map-seven -f themes=plateau,machina -f tones=light,dark -f widths=1366,1920 -f screens_file=apps/desktop/scripts/frames/presets-b-decks.mjs
// (Fable, Nov 24, 12:21 am: "Shoot frames of Timeline and Memory Map when the hold lifts." Seven cards in one row are each about 12% of the page's width; the frame is the look.)
// The deal is the app's own: the board's "From a deck..." wizard, the deck's row, the count option. A frame is a LOOK, never a verdict: it writes no assertion.
// Seeded through the app's own seams (window.wrizo*), never raw storage.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const LIFT = 'plateau.front,plateau.top,plateau.back';
const search = (theme) => (theme === 'flux' ? '?flux3=1&reorg=1' : theme === 'plateau' ? `?reorg=1&reorglift=${LIFT}` : '?reorg=1&arbor2=0');

async function board(app, ctx, id) {
  try { await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 }); } catch { /* the frame shows what is there */ }
  await app.evalJs(`(() => {
    const W = window;
    const project = W.wrizoCreateProject('Frames Project');
    W.wrizoCreateJournalPage({ id: ${JSON.stringify(id)}, text: 'Board', projectId: project.id, pageType: 'board', boxes: [], createdAt: '2026-04-01T00:00:00.000Z', origin: null, source: null });
    W.wrizoFlushNow();
    return null;
  })()`);
  await sleep(500);
  await app.evalJs(`history.replaceState(null, '', '/${search(ctx.theme)}#/page/${id}'); null`);
  await app.reload();
  try { await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'the board', timeout: 15000 }); } catch { /* the frame shows what is there */ }
  await sleep(900);
  if (ctx.theme === 'plateau') await app.evalJs(`document.documentElement.setAttribute('data-room', ${JSON.stringify(ctx.tone === 'dark' ? 'dark' : 'light')}); null`);
  await sleep(300);
}
// the wizard: open it from the board's sliver, pick the deck, pick the count
async function deal(app, ctx, deckId, optionId) {
  await board(app, ctx, 'pbd-' + deckId + '-' + optionId);
  if (!(await app.evalJs("document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'"))) { await app.evalJs("document.querySelector('.wz-sliver-grip')?.click(); null"); await sleep(500); }
  await app.evalJs("(() => { const b = [...document.querySelectorAll('.wz-sliver-item-btn, button')].find((x) => /^\\s*From a deck/i.test(x.textContent || '')); if (b) b.click(); return null; })()"); await sleep(600);
  await app.evalJs(`document.querySelector('[data-deck-id="${deckId}"]')?.click(); null`); await sleep(500);
  await app.evalJs(`document.querySelector('[data-option-id="${optionId}"]')?.click(); null`); await sleep(1200);
  // close the sliver so the frame is the board and its cards (the sliver is tools, never the subject)
  if (await app.evalJs("document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'")) { await app.evalJs("document.querySelector('.wz-sliver-grip')?.click(); null"); await sleep(600); }
}
const SCREENS = {
  'timeline-three': (app, ctx) => deal(app, ctx, 'timeline', 'three'),
  'timeline-five': (app, ctx) => deal(app, ctx, 'timeline', 'five'),
  'timeline-seven': (app, ctx) => deal(app, ctx, 'timeline', 'seven'),
  'memory-map-three': (app, ctx) => deal(app, ctx, 'memory-map', 'three'),
  'memory-map-five': (app, ctx) => deal(app, ctx, 'memory-map', 'five'),
  'memory-map-seven': (app, ctx) => deal(app, ctx, 'memory-map', 'seven'),
};
export default SCREENS;
