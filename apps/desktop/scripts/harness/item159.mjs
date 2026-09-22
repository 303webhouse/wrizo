// ITEM 159 — THE CARD'S STYLING DOCK. From Nick's card note, primary text:
// "The styling tab starts open when a card is opened -- it should be closed by
// default just like on the Page and Board." … "notice that the STYLING tab is
// slightly overlapping the card edge."
// Run: node scripts/harness/item159.mjs   (from apps/desktop, dist-web built)
//
// S0 FOUND THERE WAS NO CLOSED STATE TO FLIP. The dock was always rendered —
// not "open by default", but stateless — so the closed state had to be built.
// `Sliver` is the pattern being matched (useState(false) behind a grip), at
// card scale.
//
// THE OVERLAP IS MEASURED, NOT ASSUMED. The dock carried `margin-right:-1px`,
// pulling it one pixel onto the card to share its border seam — the obvious
// candidate for "slightly overlapping", but a screenshot transcription is not a
// measurement. S3 reads both rects against the card's own and fails on any
// intersection, so the claim rests on geometry rather than on my reading of a
// picture. Item 166's "no pop-out overlaps the page" law does NOT govern this
// pair: it names the Card pop-up and its Styling dock as an exception. This is
// dock-against-CARD, a different pair of rects.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const BOARD = 'i159-board';
const CARD_TEXT = 'Plain card words';

const freshDesk = async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
};

// Seeded through the seam (item 129); read only after the flush lands.
const seedBoard = async (app) => {
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({
    id: BOARD, text: 'Styling board', createdAt: '2026-06-01T00:00:00.000Z',
    origin: 'loose', pageType: 'board', projectId: null,
    boxes: [{ id: 'c1', kind: 'text', x: 0.2, y: 0.2, w: 0.4, h: 0.16, z: 1, text: CARD_TEXT }],
  })})`);
  for (let i = 0; i < 60; i += 1) {
    if (await app.evalJs(`JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').some(e => e.id === '${BOARD}')`)) return true;
    await sleep(100);
  }
  return false;
};

const openCard = async (app) => {
  await app.evalJs(`location.hash = '#/page/${BOARD}'`);
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'board framed' });
  await sleep(700);
  const there = await app.evalJs("!!document.querySelector('[data-box-id=\"c1\"]')");
  if (!there) return false;
  await app.evalJs(`(() => {
    const el = document.querySelector('[data-box-id="c1"]');
    const r = el.getBoundingClientRect();
    el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 }));
  })()`);
  await app.waitFor("!!document.querySelector('.board-popup-editor')", { label: 'card popup open' });
  await sleep(400);
  return true;
};

// A driver that fails a check rather than killing the file, with REAL pointer
// events (the standing law): the gesture under test is a writer pressing a grip.
const realClick = async (app, sel) => {
  const pt = await app.evalJs(`(() => {
    const el = document.querySelector(${JSON.stringify(sel)});
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  })()`);
  if (!pt) return false;
  await app.mouseDown(pt.x, pt.y);
  await app.mouseUp(pt.x, pt.y);
  await sleep(300);
  return true;
};

const dockState = (app) => app.evalJs(`(() => {
  const card = document.querySelector('.board-popup');
  const grip = document.querySelector('.board-popup-dock-grip');
  const dock = document.querySelector('.board-popup-dock');
  const rect = (el) => { if (!el) return null; const r = el.getBoundingClientRect();
    return { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom) }; };
  const intersects = (a, b) => !!a && !!b && a.left < b.right - 0.5 && a.right > b.left + 0.5 && a.top < b.bottom - 0.5 && a.bottom > b.top + 0.5;
  const c = rect(card), g = rect(grip), d = rect(dock);
  return {
    card: !!card, grip: !!grip, dock: !!dock,
    tools: document.querySelectorAll('.board-popup-tool').length,
    expanded: grip ? grip.getAttribute('aria-expanded') : null,
    cardRect: c, gripRect: g, dockRect: d,
    gripOverlapsCard: intersects(g, c),
    dockOverlapsCard: intersects(d, c),
  };
})()`);

const storedCard = (app) => app.evalJs(`(() => {
  const b = JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === '${BOARD}');
  const box = b && (b.boxes || []).find(x => x.id === 'c1');
  return box ? box.text : null;
})()`);

await withHarness(async (app) => {
  await freshDesk(app);
  ok('setup: the board and its one card are seeded through the seam and landed', await seedBoard(app));
  ok('setup: the card opens into its popup', await openCard(app));

  // ==========================================================================
  // S1 — IT STARTS CLOSED, and the grip is what stands in its place.
  // ==========================================================================
  const atOpen = await dockState(app);
  ok('S1 THE TICKET: opening a card shows the Styling dock CLOSED — it used to render always, with no closed state at all to flip',
    atOpen.card === true && atOpen.dock === false && atOpen.tools === 0, JSON.stringify({ card: atOpen.card, dock: atOpen.dock, tools: atOpen.tools }));
  ok('S1: and a grip stands in its place, so the dock is reachable rather than merely gone — the Sliver pattern at card scale',
    atOpen.grip === true && atOpen.expanded === 'false', JSON.stringify({ grip: atOpen.grip, expanded: atOpen.expanded }));

  // ==========================================================================
  // S2 — THE GRIP OPENS AND CLOSES IT.
  // ==========================================================================
  const pressed = await realClick(app, '.board-popup-dock-grip');
  const opened = await dockState(app);
  ok('S2: a REAL press on the grip opens the dock with its three tools',
    pressed && opened.dock === true && opened.tools === 3 && opened.expanded === 'true',
    JSON.stringify({ dock: opened.dock, tools: opened.tools, expanded: opened.expanded }));

  // ==========================================================================
  // S3 — NEITHER PIECE OF CHROME CROSSES THE CARD. Nick's second report,
  // measured: the dock carried margin-right:-1px, one pixel onto the card.
  // ==========================================================================
  ok('S3 THE OVERLAP, MEASURED: with the dock OPEN, its rect does not intersect the card - the pixel Nick saw was a deliberate negative margin sharing the card border seam, and the redesign removes the seam to share',
    opened.dockOverlapsCard === false,
    JSON.stringify({ dockRect: opened.dockRect, cardRect: opened.cardRect, overlaps: opened.dockOverlapsCard }));
  ok('S3: and the GRIP does not cross the card either - it is what a writer sees when the dock is closed, so an overlap there would be the same complaint in a smaller piece of chrome',
    opened.gripOverlapsCard === false,
    JSON.stringify({ gripRect: opened.gripRect, overlaps: opened.gripOverlapsCard }));

  // ==========================================================================
  // S4 — THE DOCK STILL STYLES. The grip must not cost the editor its
  // selection: a card's Bold acts on the SELECTION, and a mousedown that moved
  // focus would collapse the very thing the next click is about to style. Both
  // the grip and the dock prevent mousedown for exactly this reason, so the
  // check drives the whole gesture rather than trusting the attribute.
  // ==========================================================================
  await app.evalJs(`(() => {
    const ed = document.querySelector('.board-popup-editor');
    const node = ed && ed.firstChild ? (ed.firstChild.nodeType === 3 ? ed.firstChild : ed.firstChild.firstChild) : null;
    if (!node) return false;
    const r = document.createRange();
    r.setStart(node, 0); r.setEnd(node, 5);   // "Plain"
    const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    return true;
  })()`);
  await sleep(200);
  const boldPressed = await realClick(app, '.board-popup-tool');
  await sleep(900);   // the write lands before the probe reads (the settled-state law)
  const after = await storedCard(app);
  ok('S4: the dock still styles through the grip - selecting a word and pressing Bold writes the markers, so opening the dock did not cost the editor the selection it acts on',
    boldPressed && typeof after === 'string' && after.includes('**Plain**'),
    JSON.stringify({ stored: after }));

  // ==========================================================================
  // S5 — IT CLOSES AGAIN, so the grip is a toggle and not a one-way door.
  // ==========================================================================
  await realClick(app, '.board-popup-dock-grip');
  const closed = await dockState(app);
  ok('S5: pressing the grip again closes the dock - the state the card opens in is reachable again without reopening the card',
    closed.dock === false && closed.grip === true && closed.expanded === 'false',
    JSON.stringify({ dock: closed.dock, expanded: closed.expanded }));
});

for (const c of checks) {
  // eslint-disable-next-line no-console
  console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nITEM159 VERIFY: PASS (${checks.length} checks)`
  : `\nITEM159 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
