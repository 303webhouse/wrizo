// B2 — the Shelf, the Drawers, and the Places (docs/wrizo-alpha/b2-shelf-and-drawers-brief-v2.md).
// A committed CDP verification scenario (per this project's own "harness
// scenarios persist" convention), modeled on b1.mjs's own structure —
// freshDesk/freshBoard/POINTER_HELPER below are the same shape that file
// already established, copied verbatim per this project's standing
// instruction not to re-derive them.
// Run: node scripts/harness/b2.mjs   (from apps/desktop, with dist-web
// freshly built via `pnpm run build:web`).
//
// Covers this brief's own S8 list: the T3 truth table (each disqualifier
// independently flips Shelf membership — deleted, system, project-homed,
// journal-homed, pinned-anywhere; starred proven irrelevant both ways);
// reconcile idempotence; authored positions surviving reload +
// re-derivation; the Pin-to-a-Board action removing a card at next
// reconcile (full round trip); every inherited system-board inertness
// re-asserted on the Shelf via the SHARED checks pattern; shelved
// retirement both directions; the Places panel's two-zone truth with an
// explicit A16 assert on every single Places action; the superseded Moves
// flow's genuine unreachability; the Existing-page picker's
// membership-not-filing proof; the pop-out roster order; the Drawers
// roster/grouping/anchor/quiet-DOM; lexicon discipline; geometry at both
// reference widths + the 1100px floor; legacy byte-identical.
//
// Trusted-gesture discipline: card selection uses a real pointerdown+
// pointerup sequence (POINTER_HELPER, the SAME shape b1.mjs/j4.mjs/j5.mjs
// already established). Text typed into a controlled React input
// (Places' own New Drawer field) uses real per-character CDP key events
// (app.typeKeys), not a direct .value= write, for the same reason ab3.mjs's
// own B2 fixture disclosed. Every checkbox/radio click below is a plain
// `.click()` on a real <input> — no special fidelity claim beyond a click,
// same standing discipline as B1's own Restore button.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const LAPTOP_W = 1280;
const WIDE_W = 2200;
const LEGACY_W = 1099; // one px below DESKFRAME_MIN_WIDTH (1100) — the floor

const freshDesk = async (app, width = 1400, height = 900) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
};

const freshBoard = async (app, boardId, boxes, width = 1400, height = 900) => {
  await freshDesk(app, width, height);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: ${JSON.stringify(boardId)}, text: 'B2 Board', pageType: 'board', source: 'page', boxes: ${JSON.stringify(boxes)}, createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(boardId)}`);
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'board framed' });
  await sleep(300);
  await app.emulateDpr(1, width, height);
};

// j4.mjs's/j5.mjs's/b1.mjs's own pointer-sequence helper, copied verbatim.
const POINTER_HELPER = `
window.__pointerSeq = function(selector, dx, dy, opts) {
  opts = opts || {};
  const el = document.querySelector(selector);
  if (!el) throw new Error('pointerSeq: not found ' + selector);
  const r = el.getBoundingClientRect();
  const x0 = r.left + r.width/2, y0 = r.top + r.height/2;
  const pid = opts.pointerId || 1;
  const ptype = opts.pointerType || 'mouse';
  const mk = (type, x, y) => new PointerEvent(type, {clientX:x, clientY:y, pointerId:pid, pointerType:ptype, bubbles:true, cancelable:true, isPrimary:true});
  el.dispatchEvent(mk('pointerdown', x0, y0));
  const steps = opts.steps ?? 4;
  for (let i=1;i<=steps;i++) {
    el.dispatchEvent(mk('pointermove', x0 + dx*i/steps, y0 + dy*i/steps));
  }
  el.dispatchEvent(mk('pointerup', x0+dx, y0+dy));
  return true;
};
`;
const selectBox = (app, boxId) => app.evalJs(`window.__pointerSeq('[data-box-id="${boxId}"]', 0, 0)`);

// The Shelf Board's own live boxes, read via the SAME test seam
// BoardEditor.tsx already exposes (window.wrizoBoard) — navigating through
// App.tsx's own bridge route ('/shelf'), find-or-create + mount, exactly
// as a real writer would arrive.
const shelfBoardBoxes = async (app) => {
  await app.goto('/shelf');
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'Shelf Board mounted' });
  await sleep(250);
  return (await app.evalJs('window.wrizoBoard()')) || [];
};
const journalBoardBoxes = async (app) => {
  await app.goto('/journal');
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'Journal Board mounted' });
  await sleep(250);
  return (await app.evalJs('window.wrizoBoard()')) || [];
};
const pinIds = (boxes) => boxes.filter((b) => b.kind === 'page-pin').map((b) => b.entryId);

// b1.mjs's own openPageCategory helper, copied verbatim: index 1 in the
// strip is the Page category.
const openPageCategory = async (app) => {
  await app.waitFor("document.querySelectorAll('.wz-strip-item').length === 8", { label: 'cascade strip mounted (openPageCategory)' });
  const alreadyOpen = await app.evalJs("!!document.querySelector('.wz-pageface-title')");
  if (alreadyOpen) return;
  await app.evalJs("[...document.querySelectorAll('.wz-strip-item')][1].click()");
  await app.waitFor("!!document.querySelector('.wz-pageface-title')", { label: 'Page category open (openPageCategory)' });
};

// A16's own assert, reusable: nothing about a page's projectId/origin
// changed except via the ONE call this fixture just made. Compares two
// snapshots of the SAME entry (before/after one Places action) and
// reports exactly which fields moved.
const a16Diff = (before, after) => ({
  originChanged: before.origin !== after.origin,
  projectIdChanged: before.projectId !== after.projectId,
});

await withHarness(async (app) => {
  await app.evalJs(POINTER_HELPER);

  // ==========================================================================
  // S1 — the Shelf system Board: idempotent find-or-create, no project
  // home, systemKind:'shelf' on its board-meta element, a genuinely
  // different record from the Journal/Trash Boards.
  // ==========================================================================
  await freshDesk(app, LAPTOP_W, 900);
  await app.goto('/shelf');
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'Shelf Board, first approach' });
  await sleep(250);
  const shelfIdFirst = (await app.evalJs('location.hash')).replace(/^#\/page\//, '');
  await app.reload();
  await app.evalJs("location.hash = '#/shelf'");
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'Shelf Board, second approach' });
  await sleep(250);
  const shelfIdSecond = (await app.evalJs('location.hash')).replace(/^#\/page\//, '');
  ok('S1: the Shelf Board is found-or-created IDEMPOTENTLY — two separate approaches resolve to the SAME board id',
    shelfIdFirst === shelfIdSecond && !!shelfIdFirst, JSON.stringify({ shelfIdFirst, shelfIdSecond }));

  const shelfEntryRow = await app.evalJs(`JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === ${JSON.stringify(shelfIdFirst)})`);
  const shelfMeta = (shelfEntryRow?.boxes || []).find((b) => b.kind === 'board-meta');
  ok('S1: the Shelf Board is a REAL board page (pageType \'board\'), origin \'system\', NO project home, systemKind:\'shelf\' on its board-meta element',
    shelfEntryRow?.pageType === 'board' && shelfEntryRow?.origin === 'system' && shelfEntryRow?.projectId == null && shelfMeta?.systemKind === 'shelf',
    JSON.stringify({ pageType: shelfEntryRow?.pageType, origin: shelfEntryRow?.origin, projectId: shelfEntryRow?.projectId, meta: shelfMeta }));

  await app.goto('/journal');
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'Journal Board mounted' });
  await sleep(250);
  const journalId = (await app.evalJs('location.hash')).replace(/^#\/page\//, '');
  ok('S1: the Shelf Board is genuinely a DIFFERENT record from the Journal Board', shelfIdFirst !== journalId, JSON.stringify({ shelfIdFirst, journalId }));

  // ==========================================================================
  // S1/S8 — the T3 truth table: each disqualifier independently flips
  // Shelf membership. Seven pages, seeded directly (each isolating exactly
  // ONE disqualifier), read against the Shelf Board's own derived cards.
  // ==========================================================================
  await freshDesk(app, LAPTOP_W, 900);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const projects = JSON.parse(localStorage.getItem('writer-studio-projects') || '[]');
    projects.push({ id: 'b2-t3-project', title: 'T3 Project', type: 'creative', storyPlanId: null, createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-projects', JSON.stringify(projects));
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    // (1) qualifies: loose-origin, unfiled, unpinned, not deleted, not starred.
    entries.push({ id: 'b2-t3-qualifies', text: 'T3 qualifies', projectId: null, source: 'page', origin: 'loose', createdAt: now, updatedAt: now });
    // (2) qualifies-but-starred: same as (1), starred true — starring must NOT disqualify.
    entries.push({ id: 'b2-t3-starred', text: 'T3 starred', projectId: null, source: 'page', origin: 'loose', starred: true, createdAt: now, updatedAt: now });
    // (3) disqualified: deleted.
    entries.push({ id: 'b2-t3-deleted', text: 'T3 deleted', projectId: null, source: 'page', origin: 'loose', deletedAt: now, createdAt: now, updatedAt: now });
    // (4) disqualified: project-homed.
    entries.push({ id: 'b2-t3-projecthomed', text: 'T3 project-homed', projectId: 'b2-t3-project', pageType: 'manuscript', source: 'page', origin: 'project', createdAt: now, updatedAt: now });
    // (5) disqualified: journal-homed.
    entries.push({ id: 'b2-t3-journalhomed', text: 'T3 journal-homed', projectId: null, source: 'page', origin: 'journal', createdAt: now, updatedAt: now });
    // (6) disqualified: starred AND journal-homed — proves starring is irrelevant the OTHER way too (a starred but otherwise-disqualified page stays OFF the Shelf).
    entries.push({ id: 'b2-t3-starred-disqualified', text: 'T3 starred disqualified', projectId: null, source: 'page', origin: 'journal', starred: true, createdAt: now, updatedAt: now });
    // (7) will be pinned to a user board below (built after the board exists).
    entries.push({ id: 'b2-t3-tobepinned', text: 'T3 to be pinned', projectId: null, source: 'page', origin: 'loose', createdAt: now, updatedAt: now });
    // A user board, with (7) already pinned onto it — disqualified: pinned-anywhere.
    entries.push({ id: 'b2-t3-userboard', text: 'T3 user board', projectId: 'b2-t3-project', pageType: 'board', source: 'page', boxes: [
      { id: 'b2-t3-pin', kind: 'page-pin', x: 0.05, y: 0.05, w: 0.2, h: 0.1, z: 1, entryId: 'b2-t3-tobepinned' },
    ], createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  const shelfBoxesT3 = await shelfBoardBoxes(app);
  const shelfPinnedT3 = pinIds(shelfBoxesT3);
  ok('T3: an unfiled, unpinned, non-deleted, non-journal-homed page QUALIFIES for the Shelf', shelfPinnedT3.includes('b2-t3-qualifies'), JSON.stringify(shelfPinnedT3));
  ok('T3: starring does NOT disqualify — the starred-but-otherwise-qualifying page is ALSO on the Shelf', shelfPinnedT3.includes('b2-t3-starred'), JSON.stringify(shelfPinnedT3));
  ok('T3: a DELETED page never qualifies for the Shelf', !shelfPinnedT3.includes('b2-t3-deleted'), JSON.stringify(shelfPinnedT3));
  ok('T3: a PROJECT-HOMED page never qualifies for the Shelf', !shelfPinnedT3.includes('b2-t3-projecthomed'), JSON.stringify(shelfPinnedT3));
  ok('T3: a JOURNAL-HOMED page never qualifies for the Shelf', !shelfPinnedT3.includes('b2-t3-journalhomed'), JSON.stringify(shelfPinnedT3));
  ok('T3: starring does NOT rescue an otherwise-disqualified (journal-homed) page — it stays OFF the Shelf', !shelfPinnedT3.includes('b2-t3-starred-disqualified'), JSON.stringify(shelfPinnedT3));
  ok('T3: a page PINNED to a user board never qualifies for the Shelf ("zero user-board pins")', !shelfPinnedT3.includes('b2-t3-tobepinned'), JSON.stringify(shelfPinnedT3));
  ok('T3: the Shelf Board itself and the user board never card themselves/each other', !shelfPinnedT3.includes('b2-t3-userboard') && !shelfPinnedT3.some((id) => id === shelfEntryRow?.id), JSON.stringify(shelfPinnedT3));

  // Un-pinning the pinned page (disqualifier lifted) makes it qualify at
  // the NEXT reconcile — the T3 disqualifier is genuinely dynamic, not a
  // one-time snapshot.
  await app.evalJs(`(() => {
    const key = 'writer-studio-journal-entries';
    const list = JSON.parse(localStorage.getItem(key));
    const board = list.find(e => e.id === 'b2-t3-userboard');
    board.boxes = [];
    localStorage.setItem(key, JSON.stringify(list));
  })()`);
  await app.reload();
  const shelfBoxesAfterUnpin = await shelfBoardBoxes(app);
  ok('T3: lifting the ONE disqualifier (unpinning) makes the page qualify for the Shelf at the next reconcile — T3 is dynamic, not a snapshot',
    pinIds(shelfBoxesAfterUnpin).includes('b2-t3-tobepinned'), JSON.stringify(pinIds(shelfBoxesAfterUnpin)));

  // ==========================================================================
  // S1/S8 — reconcile idempotence + authored-position survival, the B1 way.
  // ==========================================================================
  const boxesRunOne = await shelfBoardBoxes(app);
  const shelfIdT3 = (await app.evalJs('location.hash')).replace(/^#\/page\//, '');
  await app.reload();
  const boxesRunTwo = await shelfBoardBoxes(app);
  ok('S1: the Shelf Board\'s reconcile is IDEMPOTENT — two separate mounts against unchanged stored truth produce byte-identical boxes',
    JSON.stringify(boxesRunOne.slice().sort((a, b) => a.id.localeCompare(b.id))) === JSON.stringify(boxesRunTwo.slice().sort((a, b) => a.id.localeCompare(b.id))),
    JSON.stringify({ boxesRunOne, boxesRunTwo }));

  await app.evalJs(`(() => {
    const key = 'writer-studio-journal-entries';
    const list = JSON.parse(localStorage.getItem(key));
    const board = list.find(e => e.id === ${JSON.stringify(shelfIdT3)});
    const box = board.boxes.find(b => b.entryId === 'b2-t3-qualifies');
    box.x = 0.61; box.y = 0.33; box.w = 0.18; box.h = 0.14;
    localStorage.setItem(key, JSON.stringify(list));
  })()`);
  await app.reload();
  const boxesAfterAuthor = await shelfBoardBoxes(app);
  const authoredCard = boxesAfterAuthor.find((b) => b.entryId === 'b2-t3-qualifies');
  ok('S1: authored positions SURVIVE reload + re-derivation — the hand-placed card is at the EXACT authored x/y/w/h, untouched by reconcile',
    authoredCard?.x === 0.61 && authoredCard?.y === 0.33 && authoredCard?.w === 0.18 && authoredCard?.h === 0.14, JSON.stringify(authoredCard));

  // ==========================================================================
  // S2 — the Shelf works for its living: Pin to a Board on card selection;
  // pinning removes the card from the Shelf at the NEXT reconcile.
  // ==========================================================================
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const projects = JSON.parse(localStorage.getItem('writer-studio-projects') || '[]');
    projects.push({ id: 'b2-s2-project', title: 'S2 Project', type: 'creative', storyPlanId: null, createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-projects', JSON.stringify(projects));
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: 'b2-s2-board', text: 'S2 Board', projectId: 'b2-s2-project', pageType: 'board', source: 'page', boxes: [], createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  const shelfBoxesBeforePin = await shelfBoardBoxes(app);
  const cardToPin = shelfBoxesBeforePin.find((b) => b.kind === 'page-pin' && b.entryId === 'b2-t3-qualifies');
  await app.evalJs(POINTER_HELPER); // re-inject — reload() wipes the page's own JS context
  await selectBox(app, cardToPin.id);
  await app.waitFor("!!document.querySelector('.board-action-row')", { label: 'Shelf card selected' });
  const pinBtnPresent = await app.evalJs("[...document.querySelectorAll('.board-action-row button')].some(b => b.textContent.trim() === 'Pin to a Board…')");
  ok('S2: a selected Shelf card offers "Pin to a Board…" in the action row (the existing PinToBoardSheet — nothing new invented)', pinBtnPresent === true, String(pinBtnPresent));
  await app.evalJs("[...document.querySelectorAll('.board-action-row button')].find(b => b.textContent.trim() === 'Pin to a Board…').click()");
  await app.waitFor("!!document.querySelector('.board-sheet')", { label: 'Pin sheet open (Shelf)' });
  await app.evalJs("[...document.querySelectorAll('.board-dest-row')].find(el => el.textContent.includes('S2 Project'))?.click()");
  await sleep(150);
  await app.evalJs("[...document.querySelectorAll('.board-dest-row')].find(el => el.textContent.includes('S2 Board'))?.click()");
  await sleep(300);

  const targetBoardAfterPin = await app.evalJs("JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === 'b2-s2-board')");
  ok('S2: pinning from the Shelf genuinely pins the page onto the chosen board', (targetBoardAfterPin?.boxes ?? []).some((b) => b.kind === 'page-pin' && b.entryId === 'b2-t3-qualifies'), JSON.stringify(targetBoardAfterPin?.boxes));

  const shelfBoxesAfterPin = await shelfBoardBoxes(app);
  ok('S2: the FULL ROUND TRIP — pinning removes the card from the Shelf at the NEXT reconcile (T3 doing its job, felt immediately)',
    !pinIds(shelfBoxesAfterPin).includes('b2-t3-qualifies'), JSON.stringify(pinIds(shelfBoxesAfterPin)));

  // The empty Shelf's own one-line quiet fact.
  await freshDesk(app, LAPTOP_W, 900);
  const emptyShelfBoxes = await shelfBoardBoxes(app);
  ok('S2 precondition: a genuinely fresh Shelf has zero cards', pinIds(emptyShelfBoxes).length === 0, JSON.stringify(emptyShelfBoxes));
  const emptyShelfText = await app.evalJs("document.querySelector('.board-canvas-empty')?.textContent ?? null");
  ok('S2: the empty Shelf carries ONE quiet line ("Nothing waiting.") — a fact, not a celebration', emptyShelfText === 'Nothing waiting.', String(emptyShelfText));

  // ==========================================================================
  // S1 — every inherited B1 system-board law, re-asserted on the Shelf via
  // the SHARED checks pattern (same code paths, not copies).
  // ==========================================================================
  await freshDesk(app, LAPTOP_W, 900);
  const qualifyingId = await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: 'b2-inert-page', text: 'Inertness probe', projectId: null, source: 'page', origin: 'loose', createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
    return 'b2-inert-page';
  })()`);
  await app.reload();
  const inertBoxes = await shelfBoardBoxes(app);
  const inertCard = inertBoxes.find((b) => b.kind === 'page-pin' && b.entryId === qualifyingId);
  ok('S1 precondition: the probe page has a card on the Shelf', !!inertCard, JSON.stringify(inertBoxes));

  // Add structurally absent.
  await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
  await sleep(200);
  const shelfSliverButtons = await app.evalJs("[...document.querySelectorAll('.wz-sliver-item-btn')].map(b => b.textContent.trim())");
  ok('S1: the Shelf Board\'s own sliver carries NO Add control at all — genuinely absent, the same B1 law inherited via the SAME `isSystemBoard` branch',
    !shelfSliverButtons.includes('Add card') && !shelfSliverButtons.includes('New page card') && !shelfSliverButtons.includes('Existing page…'), JSON.stringify(shelfSliverButtons));
  const shelfFooterTogglePresent = await app.evalJs("!!document.querySelector('.wz-sliver-board-footer')");
  ok('S1: the connections-footer toggle STILL works on the Shelf Board — arranging is the full FX5 hand, only Add/Delete are restricted', shelfFooterTogglePresent === true, String(shelfFooterTogglePresent));

  // Delete inert on a derived card.
  await app.evalJs(POINTER_HELPER);
  await selectBox(app, inertCard.id);
  await app.waitFor("!!document.querySelector('.board-action-row')", { label: 'inert card selected' });
  await app.evalJs("[...document.querySelectorAll('.board-action-row button')].find(b => b.textContent.trim() === 'Remove').click()");
  await sleep(300);
  const boxesAfterInertRemove = await app.evalJs('window.wrizoBoard()');
  ok('S1: hand-delete (Remove) on a derived Shelf card is an INERT, quiet no-op — the exact same card set survives the click',
    JSON.stringify(inertBoxes) === JSON.stringify(boxesAfterInertRemove), JSON.stringify({ before: inertBoxes.length, after: boxesAfterInertRemove.length }));

  // Move/Copy retired -> Places absent; Pin inert; on the Shelf Board's OWN Page face.
  await openPageCategory(app);
  await app.waitFor("!!document.querySelector('.wz-pageface-verb-pin')", { label: 'Page face (Shelf board)' });
  const placesAbsentOnShelf = await app.evalJs("!document.querySelector('.wz-places')");
  ok('S1: the Places panel is genuinely ABSENT on the Shelf Board\'s own Page face (Move/Copy\'s own inherited guard, now one layer up)', placesAbsentOnShelf === true, String(placesAbsentOnShelf));
  await app.evalJs("document.querySelector('.wz-pageface-verb-pin').click()");
  await sleep(250);
  const pinOpenedOnShelf = await app.evalJs("!!document.querySelector('.board-sheet')");
  ok('S1: Pin is inert on the Shelf Board\'s own Page face — clicking "Pin to a Board…" opens nothing (Port is untouched: it only ever copies text elsewhere)',
    pinOpenedOnShelf === false, String(pinOpenedOnShelf));

  // Home label truthful.
  const shelfBoardHomeLabel = await app.evalJs("document.querySelector('.wz-pageface-home-label')?.textContent");
  ok('S1: the Shelf Board\'s own Page face names ITS home truthfully ("no project home")', shelfBoardHomeLabel === 'The Shelf Board — has no project home', String(shelfBoardHomeLabel));

  // Never appears in the Pin sheet's board leaves.
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const projects = JSON.parse(localStorage.getItem('writer-studio-projects') || '[]');
    projects.push({ id: 'b2-pinleaf-project', title: 'Pin Leaf Project', type: 'creative', storyPlanId: null, createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-projects', JSON.stringify(projects));
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: 'b2-pinleaf-page', text: 'Pin leaf probe', projectId: 'b2-pinleaf-project', pageType: 'manuscript', source: 'page', origin: 'project', createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.evalJs("location.hash = '#/page/b2-pinleaf-page'");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'Pin-leaf probe page framed' });
  await sleep(300);
  await app.emulateDpr(1, LAPTOP_W, 900);
  await openPageCategory(app);
  await app.waitFor("!!document.querySelector('.wz-pageface-verb-pin')", { label: 'Page face (pin-leaf probe)' });
  await app.evalJs("document.querySelector('.wz-pageface-verb-pin').click()");
  await app.waitFor("!!document.querySelector('.board-sheet')", { label: 'Pin sheet open (leaf probe)' });
  await app.evalJs("document.querySelector('.board-dest-row')?.click()");
  await sleep(200);
  const pinLeafRowsShelf = await app.evalJs("[...document.querySelectorAll('.board-dest-row, .dz-rowtitle')].map(el => el.textContent.trim())");
  ok('S1: the Pin sheet\'s own board leaves NEVER list the Shelf Board as a destination', !pinLeafRowsShelf.some((t) => t.includes('Shelf')), JSON.stringify(pinLeafRowsShelf));
  await app.evalJs("document.querySelector('.btn-quiet')?.click()");

  // Excluded from resume.
  await freshDesk(app, LAPTOP_W, 900);
  await app.goto('/shelf');
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'Shelf Board mounted (resume probe)' });
  await sleep(300);
  const resumeTargetAfterShelfVisit = await app.evalJs('window.wrizoResume ? window.wrizoResume() : null');
  ok('S1: a system Board (visited, reconciled, its own updatedAt bumped) is EXCLUDED from the resume race — visiting the Shelf never becomes "what to resume"',
    resumeTargetAfterShelfVisit === null, JSON.stringify(resumeTargetAfterShelfVisit));

  // Way-back non-participation + backTo '/'.
  const shelfDoneRoute = await app.evalJs(`(() => {
    const btns = [...document.querySelectorAll('.sprint-actions button')];
    return btns.find(b => b.textContent.trim() === 'Done') ? 'has-done' : 'no-done';
  })()`);
  ok('S1 precondition: the Shelf Board carries a Done button (backTo check follows)', shelfDoneRoute === 'has-done', shelfDoneRoute);
  await app.evalJs("[...document.querySelectorAll('.sprint-actions button')].find(b => b.textContent.trim() === 'Done').click()");
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Shelf Board Done -> backTo' });
  const shelfBackToRoute = await app.evalJs('location.hash');
  ok('S1: the Shelf Board\'s own Done button lands backTo \'/\' — the SAME system-board law B1 already proved, inherited by the same `isSystemBoard` branch',
    shelfBackToRoute === '' || shelfBackToRoute === '#/', shelfBackToRoute);

  // ==========================================================================
  // S3 — the legacy `shelved` flag retires: no UI read/write reachable;
  // old-shelved-but-unconnected pages appear on the new Shelf via T3
  // anyway; old-shelved-but-connected pages correctly do not (both
  // directions of the audit, proven live).
  // ==========================================================================
  await freshDesk(app, LAPTOP_W, 900);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const projects = JSON.parse(localStorage.getItem('writer-studio-projects') || '[]');
    projects.push({ id: 'b2-s3-project', title: 'S3 Project', type: 'creative', storyPlanId: null, createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-projects', JSON.stringify(projects));
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    // Legacy shape: shelved:true, no origin field at all (pre-AB3 data, the grandfather clause).
    entries.push({ id: 'b2-s3-legacy-unconnected', text: 'Legacy shelved, unconnected', projectId: null, source: 'page', shelved: true, createdAt: now, updatedAt: now });
    entries.push({ id: 'b2-s3-legacy-connected', text: 'Legacy shelved, connected', projectId: null, source: 'page', shelved: true, createdAt: now, updatedAt: now });
    entries.push({ id: 'b2-s3-userboard', text: 'S3 user board', projectId: 'b2-s3-project', pageType: 'board', source: 'page', boxes: [
      { id: 'b2-s3-pin', kind: 'page-pin', x: 0.05, y: 0.05, w: 0.2, h: 0.1, z: 1, entryId: 'b2-s3-legacy-connected' },
    ], createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  const s3ShelfBoxes = await shelfBoardBoxes(app);
  const s3Pinned = pinIds(s3ShelfBoxes);
  ok('S3 audit (direction 1): an old-shelved-but-UNCONNECTED page appears on the new Shelf via T3 anyway (no shelved read needed — genuinely unfiled, unpinned, not journal-homed)',
    s3Pinned.includes('b2-s3-legacy-unconnected'), JSON.stringify(s3Pinned));
  ok('S3 audit (direction 2): an old-shelved-but-CONNECTED (pinned) page correctly does NOT appear on the Shelf — it was already organized',
    !s3Pinned.includes('b2-s3-legacy-connected'), JSON.stringify(s3Pinned));

  // No UI write: filing a page to Loose via Places never sets `shelved`
  // (the column stays dormant — zero writes, in either direction).
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: 'b2-s3-loose-write-probe', text: 'S3 loose write probe', projectId: 'b2-s3-project', pageType: 'manuscript', source: 'page', origin: 'project', createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.evalJs("location.hash = '#/page/b2-s3-loose-write-probe'");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'S3 loose-write probe framed' });
  await sleep(300);
  await app.emulateDpr(1, LAPTOP_W, 900);
  await openPageCategory(app);
  await app.waitFor("!!document.querySelector('.wz-places-home')", { label: 'Places panel (S3 write probe)' });
  await app.evalJs("[...document.querySelectorAll('.wz-places-home label')].find(l => l.textContent.includes('Loose')).querySelector('input').click()");
  await sleep(400);
  const s3AfterLooseFile = await app.evalJs("JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === 'b2-s3-loose-write-probe')");
  ok('S3: filing to Loose via Places clears projectId but NEVER writes `shelved` (not true, not even false) — the column stays genuinely dormant',
    s3AfterLooseFile?.projectId == null && !('shelved' in s3AfterLooseFile), JSON.stringify(s3AfterLooseFile));

  // No UI read reachable: the retired /shelf list surface (pages/Shelf.tsx,
  // .shelf-row/.shelf-new-page) is genuinely gone, not merely unlinked —
  // '/shelf' now bridges to the Board (S1), the SAME retirement-proof
  // shape b1.mjs's own S5(b) uses for the old Journal list.
  await app.goto('/shelf');
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'Shelf Board via /shelf (retirement proof)' });
  await sleep(200);
  const legacyShelfRoomGone = await app.evalJs("!document.querySelector('.shelf-row') && !document.querySelector('.shelf-new-page') && !document.querySelector('.shelf-bulk')");
  ok('S3: the retired /shelf list room\'s own DOM (.shelf-row/.shelf-new-page/.shelf-bulk) is genuinely absent — not just unlinked, gone',
    legacyShelfRoomGone === true, String(legacyShelfRoomGone));

  // ==========================================================================
  // S4 — the Places panel: the Home zone (single-select), with an explicit
  // A16 assert on EVERY action (checkboxes write ONLY membership; only the
  // Home zone's own explicit act writes projectId; nothing EVER writes
  // origin).
  // ==========================================================================
  await freshDesk(app, LAPTOP_W, 900);
  const journalOriginId = await app.evalJs('window.wrizoCreateJournalPage().id');
  await app.evalJs(`location.hash = '#/journal/${journalOriginId}'`);
  await app.waitFor("!!document.querySelector('.entry-edit')", { label: 'fresh journal-origin page framed' });
  await app.evalJs("document.querySelector('.entry-edit').focus()");
  await app.typeKeys('B2S4 Places probe.');
  await sleep(2400);
  await app.emulateDpr(1, LAPTOP_W, 900);

  const beforeHomeAction = await app.evalJs(`JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === ${JSON.stringify(journalOriginId)})`);
  await openPageCategory(app);
  await app.waitFor("!!document.querySelector('.wz-places-home')", { label: 'Places Home zone (fresh journal page)' });
  const homeZoneInitial = await app.evalJs(`({
    journalChecked: [...document.querySelectorAll('.wz-places-home label')].find(l => l.textContent.trim() === ${JSON.stringify('Journal')})?.querySelector('input')?.checked,
  })`);
  ok('S4: the Home zone shows Journal checked as CURRENT FACT on a fresh journal-origin page', homeZoneInitial.journalChecked === true, JSON.stringify(homeZoneInitial));

  // Selecting a different home (a NEW drawer, inline) performs the real
  // filing act. A16 assert: origin untouched, projectId now set.
  await app.evalJs("document.querySelector('.wz-places-newdrawer-btn').click()");
  await app.waitFor("!!document.querySelector('.wz-places-newdrawer-input')", { label: 'Places New Drawer input (S4)' });
  await app.evalJs("document.querySelector('.wz-places-newdrawer-input').focus()");
  await app.typeKeys('B2S4 Drawer');
  await app.evalJs("document.querySelector('.wz-places-newdrawer-create').click()");
  await sleep(400);
  const afterHomeAction = await app.evalJs(`JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === ${JSON.stringify(journalOriginId)})`);
  const a16Home = a16Diff(beforeHomeAction, afterHomeAction);
  ok('A16 assert (Home zone, New Drawer create-and-file): origin is NEVER touched by this act', a16Home.originChanged === false, JSON.stringify({ before: beforeHomeAction.origin, after: afterHomeAction.origin }));
  ok('S4: New Drawer creates a project row in storage AND files the page into it in ONE act (projectId now set to the new project)',
    !!afterHomeAction.projectId, JSON.stringify(afterHomeAction));
  const newDrawerProjectRow = await app.evalJs(`JSON.parse(localStorage.getItem('writer-studio-projects')||'[]').find(p => p.id === ${JSON.stringify(afterHomeAction.projectId)})`);
  ok('S4: the project New Drawer created is a genuine row in storage, titled "B2S4 Drawer"', newDrawerProjectRow?.title === 'B2S4 Drawer', JSON.stringify(newDrawerProjectRow));
  ok('S4: the one-shot confirmation toast fired for the filing act', (await app.evalJs("!!document.querySelector('.action-toast')")) === true, '');

  // A journal-born page filed to a drawer LEAVES the Journal Board (S7's
  // derivation) — the pinned law, proven live here too (not just ab3.mjs).
  const journalBoxesAfterFile = await journalBoardBoxes(app);
  ok('S4/S7: the journal-born page just filed to a drawer has LEFT the Journal Board — the pinned law (origin \'journal\' AND projectId null)',
    !pinIds(journalBoxesAfterFile).includes(journalOriginId), JSON.stringify(pinIds(journalBoxesAfterFile)));

  // Selecting Loose un-files. A16 assert: origin still untouched.
  await app.evalJs(`location.hash = '#/journal/${journalOriginId}'`);
  await app.waitFor("!!document.querySelector('.entry-edit')", { label: 'refiled page reopened' });
  await sleep(200);
  await openPageCategory(app);
  await app.waitFor("!!document.querySelector('.wz-places-home')", { label: 'Places Home zone (before Loose)' });
  const beforeLoose = await app.evalJs(`JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === ${JSON.stringify(journalOriginId)})`);
  await app.evalJs("[...document.querySelectorAll('.wz-places-home label')].find(l => l.textContent.trim() === 'Loose').querySelector('input').click()");
  await sleep(400);
  const afterLoose = await app.evalJs(`JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === ${JSON.stringify(journalOriginId)})`);
  const a16Loose = a16Diff(beforeLoose, afterLoose);
  ok('A16 assert (Home zone, Loose): origin is NEVER touched', a16Loose.originChanged === false, JSON.stringify({ before: beforeLoose.origin, after: afterLoose.origin }));
  ok('S4: selecting Loose un-files (projectId cleared)', afterLoose.projectId == null, JSON.stringify(afterLoose));

  // Un-filing to Loose returns the page to the Shelf per T3 (this page's
  // origin is 'journal', so — per the pinned law — it actually returns to
  // being JOURNAL-homed, not Shelf-homed; the genuinely-Shelf-bound case
  // for a non-journal-origin page is proven separately below).
  const journalBoxesAfterLoose = await journalBoardBoxes(app);
  ok('S4/S7: un-filing a JOURNAL-origin page returns it to the Journal Board (its own natural un-filed home, per the pinned law)',
    pinIds(journalBoxesAfterLoose).includes(journalOriginId), JSON.stringify(pinIds(journalBoxesAfterLoose)));

  // The genuinely-Shelf-bound case: a PROJECT-origin page, un-filed via
  // Places' own Loose option, lands on the Shelf (T3) — not the Journal.
  await freshDesk(app, LAPTOP_W, 900);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const projects = JSON.parse(localStorage.getItem('writer-studio-projects') || '[]');
    projects.push({ id: 'b2-s4-loose-project', title: 'S4 Loose Project', type: 'creative', storyPlanId: null, createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-projects', JSON.stringify(projects));
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: 'b2-s4-loose-probe', text: 'S4 loose probe', projectId: 'b2-s4-loose-project', pageType: 'manuscript', source: 'page', origin: 'project', createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.evalJs("location.hash = '#/page/b2-s4-loose-probe'");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'S4 loose probe framed' });
  await sleep(300);
  await app.emulateDpr(1, LAPTOP_W, 900);
  await openPageCategory(app);
  await app.waitFor("!!document.querySelector('.wz-places-home')", { label: 'Places Home zone (project-origin loose probe)' });
  const beforeProjectLoose = await app.evalJs("JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === 'b2-s4-loose-probe')");
  await app.evalJs("[...document.querySelectorAll('.wz-places-home label')].find(l => l.textContent.trim() === 'Loose').querySelector('input').click()");
  await sleep(400);
  const afterProjectLoose = await app.evalJs("JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === 'b2-s4-loose-probe')");
  const a16ProjectLoose = a16Diff(beforeProjectLoose, afterProjectLoose);
  ok('A16 assert (Home zone, project-origin -> Loose): origin is NEVER touched', a16ProjectLoose.originChanged === false, JSON.stringify({ before: beforeProjectLoose.origin, after: afterProjectLoose.origin }));
  const shelfBoxesAfterProjectLoose = await shelfBoardBoxes(app);
  ok('S4/T3: un-filing a PROJECT-origin page via Places\' Loose option lands it on the Shelf at the next reconcile (it heads to the Shelf by T3, exactly the brief\'s own wording)',
    pinIds(shelfBoxesAfterProjectLoose).includes('b2-s4-loose-probe'), JSON.stringify(pinIds(shelfBoxesAfterProjectLoose)));

  // ==========================================================================
  // S4 — the Boards zone: true checkboxes, round-tripping pin/unpin, with
  // an explicit A16 assert on every action (the page's own stored truth —
  // origin/projectId — stays byte-identical throughout; ONLY boxes change).
  // ==========================================================================
  await freshDesk(app, LAPTOP_W, 900);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const projects = JSON.parse(localStorage.getItem('writer-studio-projects') || '[]');
    projects.push({ id: 'b2-boards-project-a', title: 'Boards Project A', type: 'creative', storyPlanId: null, createdAt: now, updatedAt: now });
    projects.push({ id: 'b2-boards-project-b', title: 'Boards Project B', type: 'creative', storyPlanId: null, createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-projects', JSON.stringify(projects));
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: 'b2-boards-page', text: 'Boards zone probe', projectId: null, source: 'page', origin: 'loose', createdAt: now, updatedAt: now });
    // Board A (a-project) already has this page pinned; Board B does not.
    entries.push({ id: 'b2-boards-board-a', text: 'Board A', projectId: 'b2-boards-project-a', pageType: 'board', source: 'page', boxes: [
      { id: 'b2-boards-existing-pin', kind: 'page-pin', x: 0.05, y: 0.05, w: 0.2, h: 0.1, z: 1, entryId: 'b2-boards-page' },
    ], createdAt: now, updatedAt: now });
    entries.push({ id: 'b2-boards-board-b', text: 'Board B', projectId: 'b2-boards-project-b', pageType: 'board', source: 'page', boxes: [], createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.evalJs("location.hash = '#/page/b2-boards-page'");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'Boards-zone probe page framed' });
  await sleep(300);
  await app.emulateDpr(1, LAPTOP_W, 900);
  await openPageCategory(app);
  await app.waitFor("!!document.querySelector('.wz-places-boards')", { label: 'Places Boards zone' });

  const boardsZoneLabels = await app.evalJs("[...document.querySelectorAll('.wz-places-checkbox')].map(l => l.textContent.trim())");
  const boardsChecked = await app.evalJs(`({
    aChecked: [...document.querySelectorAll('.wz-places-checkbox')].find(l => l.textContent.includes('Board A'))?.querySelector('input')?.checked,
    bChecked: [...document.querySelectorAll('.wz-places-checkbox')].find(l => l.textContent.includes('Board B'))?.querySelector('input')?.checked,
  })`);
  ok('S4: the Boards zone lists every board the page COULD join (any project, any drawer) — both Board A and Board B present',
    boardsZoneLabels.includes('Board A') && boardsZoneLabels.includes('Board B'), JSON.stringify(boardsZoneLabels));
  ok('S4: current pins are checked (Board A) and non-pins are unchecked (Board B) — the truthful starting state',
    boardsChecked.aChecked === true && boardsChecked.bChecked === false, JSON.stringify(boardsChecked));

  // Check Board B: A16 assert — ONLY membership (boxes) changes.
  const beforeCheckB = await app.evalJs("JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === 'b2-boards-page')");
  await app.evalJs("[...document.querySelectorAll('.wz-places-checkbox')].find(l => l.textContent.includes('Board B')).querySelector('input').click()");
  await sleep(300);
  const afterCheckB = await app.evalJs("JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === 'b2-boards-page')");
  const a16CheckB = a16Diff(beforeCheckB, afterCheckB);
  ok('A16 assert (Boards zone, check): origin is NEVER touched', a16CheckB.originChanged === false, JSON.stringify({ before: beforeCheckB.origin, after: afterCheckB.origin }));
  ok('A16 assert (Boards zone, check): projectId is NEVER touched (checkboxes write ONLY membership)', a16CheckB.projectIdChanged === false, JSON.stringify({ before: beforeCheckB.projectId, after: afterCheckB.projectId }));
  ok('S4: the page\'s own stored record (text/createdAt) is byte-identical — only Board B\'s own boxes array gained a card',
    beforeCheckB.text === afterCheckB.text && beforeCheckB.createdAt === afterCheckB.createdAt, JSON.stringify({ before: beforeCheckB, after: afterCheckB }));
  const boardBAfterCheck = await app.evalJs("JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === 'b2-boards-board-b')");
  ok('S4: check = pinPageToBoard — Board B genuinely gained a page-pin card for this page',
    (boardBAfterCheck?.boxes ?? []).some((b) => b.kind === 'page-pin' && b.entryId === 'b2-boards-page'), JSON.stringify(boardBAfterCheck?.boxes));

  // Uncheck Board A: A16 assert — removes ONLY that board's own card, never
  // the page itself.
  const beforeUncheckA = await app.evalJs("JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === 'b2-boards-page')");
  await app.evalJs("[...document.querySelectorAll('.wz-places-checkbox')].find(l => l.textContent.includes('Board A')).querySelector('input').click()");
  await sleep(300);
  const afterUncheckA = await app.evalJs("JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === 'b2-boards-page')");
  const a16UncheckA = a16Diff(beforeUncheckA, afterUncheckA);
  ok('A16 assert (Boards zone, uncheck): origin is NEVER touched', a16UncheckA.originChanged === false, JSON.stringify({ before: beforeUncheckA.origin, after: afterUncheckA.origin }));
  ok('A16 assert (Boards zone, uncheck): projectId is NEVER touched', a16UncheckA.projectIdChanged === false, JSON.stringify({ before: beforeUncheckA.projectId, after: afterUncheckA.projectId }));
  const stillLive = await app.evalJs("!!JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === 'b2-boards-page' && !e.deletedAt)");
  ok('S4: uncheck removes ONLY that board\'s own card — the PAGE itself is never touched (no checkbox ever deletes)', stillLive === true, String(stillLive));
  const boardAAfterUncheck = await app.evalJs("JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === 'b2-boards-board-a')");
  ok('S4: uncheck = removing that board\'s own page-pin box — Board A genuinely lost its card for this page',
    !(boardAAfterUncheck?.boxes ?? []).some((b) => b.kind === 'page-pin' && b.entryId === 'b2-boards-page'), JSON.stringify(boardAAfterUncheck?.boxes));

  // System boards never listed; no count/badge anywhere in Places' own DOM.
  const placesNoSystemNoCounts = await app.evalJs(`({
    boardsZoneText: document.querySelector('.wz-places-boards')?.innerText ?? '',
    checkboxLabels: [...document.querySelectorAll('.wz-places-checkbox')].map(l => l.textContent.trim()),
  })`);
  ok('S4: system boards NEVER appear in the Boards zone\'s own checkbox list (Journal/Trash/Shelf are all absent by name)',
    !placesNoSystemNoCounts.checkboxLabels.some((l) => l === 'Journal' || l === 'Trash' || l === 'Shelf'), JSON.stringify(placesNoSystemNoCounts.checkboxLabels));
  ok('S4: no digit anywhere in the Boards zone\'s own text — no count, no badge', !/\d/.test(placesNoSystemNoCounts.boardsZoneText), placesNoSystemNoCounts.boardsZoneText);

  // ==========================================================================
  // S4 — the old "Add to…" Moves flow is genuinely unreachable from the
  // Page pop-out now (superseded whole by Places). Reproduced on multiple
  // hosts, per the retirement's own scope.
  // ==========================================================================
  const moveCopyAbsentEverywhere = await app.evalJs("!document.querySelector('.wz-pageface-verb-movecopy')");
  ok('S4: Move/Copy (`.wz-pageface-verb-movecopy`) is genuinely absent from the DOM — not hidden, not disabled, GONE', moveCopyAbsentEverywhere === true, String(moveCopyAbsentEverywhere));
  await freshBoard(app, 'b2-movecopy-board', [], LAPTOP_W, 900);
  await openPageCategory(app);
  const moveCopyAbsentOnBoard = await app.evalJs("!document.querySelector('.wz-pageface-verb-movecopy')");
  ok('S4: Move/Copy is ALSO absent on a Board\'s own Page face (BoardEditor.tsx, a separate host)', moveCopyAbsentOnBoard === true, String(moveCopyAbsentOnBoard));

  // ==========================================================================
  // S5 — the Page pop-out's own roster order: New Journal Entry, New Page,
  // then Places (for the page underfoot).
  // ==========================================================================
  await freshDesk(app, LAPTOP_W, 900);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (S5 roster)' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted (S5 roster)' });
  await openPageCategory(app);
  await app.waitFor("!!document.querySelector('.wz-places')", { label: 'Places mounted (S5 roster)' });
  const rosterOrder = await app.evalJs(`(() => {
    const panel = document.querySelector('.wz-cascade-panel');
    const kids = [...panel.children];
    const doorLabels = [...panel.querySelectorAll('.wz-cascade-action')].map(b => b.textContent.trim());
    const placesIndex = kids.findIndex(k => k.classList.contains('wz-places'));
    const pageFaceIndex = kids.findIndex(k => k.classList.contains('wz-pageface'));
    return { doorLabels, placesAfterPageFace: placesIndex > pageFaceIndex };
  })()`);
  ok('S5: the Page pop-out\'s roster reorders to New Journal Entry, New Page (in that order), before the Page face + Places',
    JSON.stringify(rosterOrder.doorLabels) === JSON.stringify(['New Journal Entry', 'New Page']), JSON.stringify(rosterOrder));
  ok('S5: Places renders for the page underfoot, after the Page face', rosterOrder.placesAfterPageFace === true, JSON.stringify(rosterOrder));

  // "New Journal Entry" genuinely creates a journal-origin page (the SAME
  // act the Journal category's own button performs).
  await app.evalJs("[...document.querySelectorAll('.wz-cascade-action')].find(b => b.textContent.trim() === 'New Journal Entry').click()");
  await app.waitFor("!!document.querySelector('.entry-edit')", { label: 'New Journal Entry door lands on JournalEntry' });
  const newJournalEntryRoute = await app.evalJs('location.hash');
  ok('S5: "New Journal Entry" travels to a fresh untyped page (/journal/:id)', /^#\/journal\/[^/]+$/.test(newJournalEntryRoute), newJournalEntryRoute);
  const newJournalEntryId = newJournalEntryRoute.replace(/^#\/journal\//, '');
  const newJournalEntryRow = await app.evalJs(`JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === ${JSON.stringify(newJournalEntryId)})`);
  ok('S5: "New Journal Entry" stamps origin:\'journal\' — the same door as Catch/the Journal category\'s own button',
    newJournalEntryRow?.origin === 'journal' && newJournalEntryRow?.projectId == null, JSON.stringify(newJournalEntryRow));

  // ==========================================================================
  // S5 — the Board's Add flow gains "Existing page…": a quiet picker that
  // PINS a chosen page — membership, never filing (origin/projectId stay
  // untouched by this action specifically, asserted).
  // ==========================================================================
  await freshDesk(app, LAPTOP_W, 900);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const projects = JSON.parse(localStorage.getItem('writer-studio-projects') || '[]');
    projects.push({ id: 'b2-s5-project', title: 'S5 Project', type: 'creative', storyPlanId: null, createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-projects', JSON.stringify(projects));
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: 'b2-s5-board', text: 'S5 Board', projectId: 'b2-s5-project', pageType: 'board', source: 'page', boxes: [], createdAt: now, updatedAt: now });
    entries.push({ id: 'b2-s5-existing-page', text: 'S5 existing page', projectId: 'b2-s5-project', pageType: 'manuscript', source: 'page', origin: 'project', createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.evalJs("location.hash = '#/page/b2-s5-board'");
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'S5 board framed' });
  await sleep(250);
  await app.emulateDpr(1, LAPTOP_W, 900);
  const beforeExistingPagePin = await app.evalJs("JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === 'b2-s5-existing-page')");
  await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
  await sleep(150);
  const existingPageBtnPresent = await app.evalJs("[...document.querySelectorAll('.wz-sliver-item-btn')].some(b => b.textContent.trim() === 'Existing page…')");
  ok('S5: the Board\'s own Add flow gains "Existing page…" beside New page card', existingPageBtnPresent === true, String(existingPageBtnPresent));
  await app.evalJs("[...document.querySelectorAll('.wz-sliver-item-btn')].find(b => b.textContent.trim() === 'Existing page…').click()");
  await app.waitFor("!!document.querySelector('.board-sheet')", { label: 'Existing-page picker open' });
  await app.evalJs("[...document.querySelectorAll('.board-dest-row')].find(el => el.textContent.includes('S5 existing page'))?.click()");
  await sleep(300);
  const afterExistingPagePin = await app.evalJs("JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === 'b2-s5-existing-page')");
  const a16ExistingPage = a16Diff(beforeExistingPagePin, afterExistingPagePin);
  ok('S5: the Existing-page picker\'s own action NEVER touches origin', a16ExistingPage.originChanged === false, JSON.stringify({ before: beforeExistingPagePin.origin, after: afterExistingPagePin.origin }));
  ok('S5: the Existing-page picker\'s own action NEVER touches projectId (membership, never filing)', a16ExistingPage.projectIdChanged === false, JSON.stringify({ before: beforeExistingPagePin.projectId, after: afterExistingPagePin.projectId }));
  const s5BoardAfterPin = await app.evalJs("JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === 'b2-s5-board')");
  ok('S5: the chosen page genuinely gained a page-pin card on the board', (s5BoardAfterPin?.boxes ?? []).some((b) => b.kind === 'page-pin' && b.entryId === 'b2-s5-existing-page'), JSON.stringify(s5BoardAfterPin?.boxes));

  // ==========================================================================
  // S7 — the Drawers panel: derived grouping (project clusters, boards
  // only), Shelf as the first tile, last-opened anchors first, loose docs
  // via T3, system boards otherwise absent, zero counts/badges/timestamps.
  // ==========================================================================
  await freshDesk(app, LAPTOP_W, 900);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const t = (s) => new Date(Date.now() + s * 1000).toISOString();
    const projects = JSON.parse(localStorage.getItem('writer-studio-projects') || '[]');
    projects.push({ id: 'b2-drawers-project-z', title: 'Zeta Project', type: 'creative', storyPlanId: null, createdAt: now, updatedAt: now });
    projects.push({ id: 'b2-drawers-project-a', title: 'Alpha Project', type: 'creative', storyPlanId: null, createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-projects', JSON.stringify(projects));
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    // Two boards in Zeta (out-of-alpha-order titles, to prove deterministic sort), one in Alpha.
    entries.push({ id: 'b2-drawers-board-z2', text: 'Zulu Board', projectId: 'b2-drawers-project-z', pageType: 'board', source: 'page', boxes: [], createdAt: now, updatedAt: t(1) });
    entries.push({ id: 'b2-drawers-board-z1', text: 'Yankee Board', projectId: 'b2-drawers-project-z', pageType: 'board', source: 'page', boxes: [], createdAt: now, updatedAt: t(2) });
    entries.push({ id: 'b2-drawers-board-a1', text: 'Alpha Board', projectId: 'b2-drawers-project-a', pageType: 'board', source: 'page', boxes: [], createdAt: now, updatedAt: t(3) });
    // A loose doc (T3-qualifying) — the MOST recently touched of everything, so it anchors first.
    entries.push({ id: 'b2-drawers-loose-doc', text: 'Loose Doc', projectId: null, source: 'page', origin: 'loose', createdAt: now, updatedAt: t(100) });
    // A filed, non-board page — must NOT appear as its own tile (only boards + loose docs do).
    entries.push({ id: 'b2-drawers-filed-manuscript', text: 'Filed Manuscript', projectId: 'b2-drawers-project-a', pageType: 'manuscript', source: 'page', origin: 'project', createdAt: now, updatedAt: t(4) });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after Drawers seed' });
  // Land on the Zulu board specifically (NOT Alpha Board, the tile we're
  // about to click) — clicking a tile for the CURRENT route wouldn't
  // navigate at all (no route change), leaving the cascade's own category
  // state exactly as it was instead of proving a real travel.
  await app.evalJs("location.hash = '#/page/b2-drawers-board-z2'");
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'framed page for Drawers panel' });
  await sleep(250);
  await app.waitFor("document.querySelectorAll('.wz-strip-item').length === 8", { label: 'strip mounted (Drawers seed)' });
  await app.evalJs("[...document.querySelectorAll('.wz-strip-item')][3].click()"); // Drawers (index 3: A[0] + B[1,2] + C[3,4,5])
  await app.waitFor("!!document.querySelector('.wz-drawers-tiles')", { label: 'Drawers panel open' });
  await sleep(200);
  const drawersState = await app.evalJs(`(() => {
    const tiles = [...document.querySelectorAll('.wz-drawers-tile')];
    return {
      firstTileTitle: tiles[0]?.querySelector('.wz-drawers-tile-title')?.textContent,
      anchorTitle: document.querySelector('.wz-drawers-tile-anchor .wz-drawers-tile-title')?.textContent,
      clusterTitles: [...document.querySelectorAll('.wz-drawers-cluster-title')].map(t => t.textContent),
      allTileTitles: tiles.map(t => t.querySelector('.wz-drawers-tile-title')?.textContent),
      bodyText: document.querySelector('.wz-cascade-panel-body')?.innerText ?? '',
      manuscriptLeaked: [...document.querySelectorAll('.wz-drawers-tile-title')].some(t => t.textContent === 'Filed Manuscript'),
    };
  })()`);
  ok('S7: the Shelf renders as the FIRST tile, always', drawersState.firstTileTitle === 'Shelf', JSON.stringify(drawersState.firstTileTitle));
  ok('S7: last-opened (most recently touched) anchors first — the loose doc, touched most recently of everything seeded, occupies the anchor slot',
    drawersState.anchorTitle === 'Loose Doc', JSON.stringify(drawersState.anchorTitle));
  ok('S7: grouping is DERIVED by project — Zeta Project and Alpha Project both render as cluster headers, by their OWN titles (no new entity)',
    drawersState.clusterTitles.includes('Zeta Project') && drawersState.clusterTitles.includes('Alpha Project'), JSON.stringify(drawersState.clusterTitles));
  ok('S7: clusters are ordered deterministically by project name — Alpha before Zeta',
    drawersState.clusterTitles.indexOf('Alpha Project') < drawersState.clusterTitles.indexOf('Zeta Project'), JSON.stringify(drawersState.clusterTitles));
  ok('S7: within a cluster, boards are ordered deterministically by title — Yankee before Zulu',
    drawersState.allTileTitles.indexOf('Yankee Board') < drawersState.allTileTitles.indexOf('Zulu Board'), JSON.stringify(drawersState.allTileTitles));
  ok('S7: a filed, non-board page NEVER renders as its own tile — only boards + loose docs do',
    drawersState.manuscriptLeaked === false, JSON.stringify(drawersState.manuscriptLeaked));
  ok('S7: no digit anywhere in the Drawers panel\'s own text — zero counts/badges/timestamps', !/\d/.test(drawersState.bodyText), drawersState.bodyText);

  // A tile tap travels (board tile) — same panel state as the checks above.
  await app.evalJs("[...document.querySelectorAll('.wz-drawers-tile')].find(b => b.textContent.includes('Alpha Board')).click()");
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'Drawers tile travel (Alpha Board)' });
  const alphaBoardRoute = await app.evalJs('location.hash');
  ok('S7: a board tile tap travels to that real board', alphaBoardRoute === '#/page/b2-drawers-board-a1', alphaBoardRoute);

  // A tile tap travels (doc tile) — re-open Drawers on this new host, wait
  // for the tiles to genuinely render before clicking (a fresh BoardEditor
  // mount, useCascade's own state starts closed).
  await app.waitFor("document.querySelectorAll('.wz-strip-item').length === 8", { label: 'strip remounted on Alpha Board' });
  await app.evalJs("[...document.querySelectorAll('.wz-strip-item')][3].click()"); // Drawers
  await app.waitFor("!!document.querySelector('.wz-drawers-tile-anchor')", { label: 'Drawers panel reopened (doc-tile travel)' });
  await app.evalJs("document.querySelector('.wz-drawers-tile-anchor').click()"); // the anchor (Loose Doc)
  await sleep(400);
  const looseDocRoute = await app.evalJs('location.hash');
  ok('S7: a doc tile tap travels to that real page', looseDocRoute.includes('b2-drawers-loose-doc'), looseDocRoute);

  // System boards otherwise absent from the tile roster (Journal/Trash
  // never appear as tiles, even though they genuinely exist).
  await app.goto('/journal'); // find-or-create the Journal Board so it genuinely exists
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'Journal Board exists (Drawers roster probe)' });
  await app.waitFor("document.querySelectorAll('.wz-strip-item').length === 8", { label: 'strip mounted on Journal Board' });
  await app.evalJs("[...document.querySelectorAll('.wz-strip-item')][3].click()"); // Drawers
  await app.waitFor("!!document.querySelector('.wz-drawers-tiles')", { label: 'Drawers panel open (system-board-absence probe)' });
  await sleep(200);
  const drawersNoSystemTiles = await app.evalJs("[...document.querySelectorAll('.wz-drawers-tile-title')].map(t => t.textContent)");
  ok('S7: system boards OTHER than the Shelf never render as tiles — the Journal Board (which genuinely exists now) is absent by name',
    !drawersNoSystemTiles.includes('Journal') && drawersNoSystemTiles.filter((t) => t === 'Shelf').length === 1, JSON.stringify(drawersNoSystemTiles));

  // ==========================================================================
  // S8 — lexicon discipline: every new string this ticket introduces
  // resolves through deskLexicon (window.wrizoDeskLexicon, the established
  // test seam), and the LIVE DOM text matches it exactly (no drift between
  // the lexicon map and what actually renders).
  // ==========================================================================
  const lexiconTerms = await app.evalJs(`(() => {
    const t = window.wrizoDeskLexicon.t;
    return {
      shelfHome: t('boardHomeLabelShelf'),
      shelfEmpty: t('shelfBoardEmpty'),
      shelfOpen: t('cascadeShelfOpen'),
      newJournalEntry: t('cascadePageNewJournalEntry'),
      addExisting: t('boardAddExistingPage'),
      placesTitle: t('placesTitle'),
      placesLoose: t('placesLoose'),
      newDrawer: t('placesNewDrawer'),
      boardsTitle: t('placesBoardsTitle'),
    };
  })()`);
  ok('S8: every new B2 string resolves through deskLexicon (window.wrizoDeskLexicon), the canonical Plateau values',
    lexiconTerms.shelfHome === 'The Shelf Board — has no project home'
      && lexiconTerms.shelfEmpty === 'Nothing waiting.'
      && lexiconTerms.shelfOpen === 'Open the Shelf'
      && lexiconTerms.newJournalEntry === 'New Journal Entry'
      && lexiconTerms.addExisting === 'Existing page…'
      && lexiconTerms.placesTitle === 'Places'
      && lexiconTerms.placesLoose === 'Loose'
      && lexiconTerms.newDrawer === '+ New Drawer'
      && lexiconTerms.boardsTitle === 'Boards',
    JSON.stringify(lexiconTerms));

  // The live DOM actually uses these values (no hardcoded drift) — an
  // ORDINARY page (not a system board, where Places is correctly absent),
  // Page category opened fresh.
  await app.goto('/');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk (lexicon spot-check)' });
  await app.evalJs("document.querySelector('.wz-arrival-write').click()");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'loose page framed (lexicon spot-check)' });
  await sleep(300);
  await app.emulateDpr(1, LAPTOP_W, 900);
  await openPageCategory(app);
  await app.waitFor("!!document.querySelector('.wz-places')", { label: 'Places mounted (lexicon spot-check)' });
  const liveTextMatchesLexicon = await app.evalJs(`(() => {
    const places = document.querySelector('.wz-places-title')?.textContent;
    return { placesTitleLive: places };
  })()`);
  ok('S8: the Places panel\'s own live DOM title matches the lexicon value exactly', liveTextMatchesLexicon.placesTitleLive === lexiconTerms.placesTitle, JSON.stringify(liveTextMatchesLexicon));

  // ==========================================================================
  // S8 — geometry at both reference widths + the 1100px floor. Legacy
  // (<1100px) chrome stays byte-identical: no tile leaks into DeskRail, the
  // rail's own roster is untouched.
  // ==========================================================================
  for (const width of [LAPTOP_W, WIDE_W]) {
    await freshDesk(app, width, 900);
    await app.goto('/shelf');
    await app.waitFor("!!document.querySelector('.board-canvas')", { label: `Shelf Board @ ${width}px` });
    await sleep(200);
    await app.emulateDpr(1, width, 900);
    await sleep(150);
    const shelfFramedShape = await app.evalJs(`({
      deskFramePresent: !!document.querySelector('.desk-frame'),
      stripPresent: !!document.querySelector('.wz-strip'),
      stripCount: document.querySelectorAll('.wz-strip-item').length,
      boardCanvasPresent: !!document.querySelector('.board-canvas'),
    })`);
    ok(`S8 @ ${width}px: the Shelf Board mounts framed (DeskFrame + the 8-category strip) — the same chrome any other Board already gets`,
      shelfFramedShape.deskFramePresent && shelfFramedShape.stripPresent && shelfFramedShape.stripCount === 8 && shelfFramedShape.boardCanvasPresent,
      JSON.stringify(shelfFramedShape));

    await app.evalJs("[...document.querySelectorAll('.wz-strip-item')][3].click()"); // Drawers
    await sleep(200);
    const drawersAtWidth = await app.evalJs("!!document.querySelector('.wz-drawers-tiles')");
    ok(`S8 @ ${width}px: the Drawers panel mounts correctly too (large tiles, same chrome at both reference widths)`, drawersAtWidth === true, String(drawersAtWidth));
  }

  // The 1100px floor: legacy chrome stays byte-identical.
  await freshDesk(app, LEGACY_W, 900);
  await app.goto('/shelf');
  await app.waitFor("!!document.querySelector('.board-page, .board-canvas')", { label: 'Shelf Board at the 1100px floor' });
  await sleep(250);
  const legacyFloorShapeB2 = await app.evalJs(`({
    deskFrameGone: !document.querySelector('.desk-frame'),
    stripGone: !document.querySelector('.wz-strip'),
    tilesGone: !document.querySelector('.wz-drawers-tiles'),
    placesGone: !document.querySelector('.wz-places'),
    boardCanvasPresent: !!document.querySelector('.board-canvas'),
    railLabels: [...document.querySelectorAll('.desk-rail-item .desk-rail-label')].map(el => el.textContent),
  })`);
  ok(`S8 @ ${LEGACY_W}px (one below the 1100 floor): the Shelf Board renders via its LEGACY branch — no DeskFrame, no strip, no tile leak, no Places leak`,
    legacyFloorShapeB2.deskFrameGone && legacyFloorShapeB2.stripGone && legacyFloorShapeB2.tilesGone && legacyFloorShapeB2.placesGone && legacyFloorShapeB2.boardCanvasPresent,
    JSON.stringify(legacyFloorShapeB2));
  ok(`S8 @ ${LEGACY_W}px: DeskRail's own roster is BYTE-IDENTICAL — Catch, Journal, Shelf, Drawers, Library — completely untouched by this ticket`,
    JSON.stringify(legacyFloorShapeB2.railLabels) === JSON.stringify(['Catch', 'Journal', 'Shelf', 'Drawers', 'Library']),
    JSON.stringify(legacyFloorShapeB2.railLabels));

  // DeskRail's own 'shelf' nav item still bridges correctly at the legacy
  // width too (it's a plain navigate('/shelf') call, untouched code).
  await app.evalJs("[...document.querySelectorAll('.desk-rail-item')].find(b => b.textContent.includes('Shelf')).click()");
  await app.waitFor("!!document.querySelector('.board-page, .board-canvas')", { label: 'DeskRail Shelf item lands on the Board (legacy)' });
  const deskRailShelfRoute = await app.evalJs('location.hash');
  ok('S8: DeskRail\'s own "Shelf" nav item — untouched code, same navigate(\'/shelf\') call — now lands on the Shelf Board',
    deskRailShelfRoute.startsWith('#/page/'), deskRailShelfRoute);

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ===========
// b2.mjs is a brand-new file; it parks nothing of its own (this ticket's
// OWN park sweep — the checks its own S3/S4/S7 retirements falsify — lives
// in the FILES it superseded: ab3.mjs, ab4.mjs, cd2.mjs, fx1.mjs (plain
// doorway swap, no park needed), fx4.mjs, fx5.mjs, j5.mjs, b1.mjs, each per
// the A4 convention that a file parks what supersedes ITS OWN checks — see
// this ticket's own build report for the full inventory). This scaffold
// exists so a future ticket that supersedes any of THIS file's checks has
// a documented home, matching every other harness file's own pattern.
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log('\nB2 PARKED: gate is armed (HARNESS_PARKED=1) but empty — nothing has been parked out of b2.mjs. See this file\'s header comment.');
}

const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nB2 VERIFY: PASS (${checks.length} checks)` : `\nB2 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
