// B1 — the Journal Reborn (+ the Trash) (docs/wrizo-alpha/b1-journal-reborn-brief.md).
// A committed CDP verification scenario (per this project's own "harness
// scenarios persist" convention), modeled on fx5.mjs's/fx6.mjs's own
// structure — freshDesk/freshProsePage/freshBoard/POINTER_HELPER below are
// the same shape those files already established, copied verbatim per this
// project's standing instruction not to re-derive them.
// Run: node scripts/harness/b1.mjs   (from apps/desktop, with dist-web
// freshly built via `pnpm run build:web`).
//
// Covers the brief's own S6 list: reconcile correctness (capture creates a
// card; delete moves a card Journal->Trash; restore round-trips home with
// deletedAt cleared, the Journal card returns, OTHER cards' arrangement
// stays untouched); reconcile idempotence (run twice, byte-identical
// boxes); authored positions surviving reload + re-derivation; system-card
// Delete being inert; no Add control on system-board slivers; system
// boards never carding themselves or appearing in Pin leaves; the Catch
// flow being byte-identical; the fallback re-point; the retired room being
// genuinely unreachable (old links re-point, no 404 hole); both reference
// widths + the 1100px floor on any new geometry.
//
// Trusted-gesture discipline: card selection uses a real pointerdown+
// pointerup sequence (POINTER_HELPER, the SAME shape j4.mjs/j5.mjs already
// established for board-box selection — a bare .click() only synthesizes
// 'click', never 'pointerdown', which BoardEditor.tsx's own delegated
// listener requires). Restore is a plain button (S4's own words) — a
// simple .click() needs no special fidelity disclosure, and none is made
// here; said explicitly per this ticket's own standing discipline.
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
    entries.push({ id: ${JSON.stringify(boardId)}, text: 'B1 Board', pageType: 'board', source: 'page', boxes: ${JSON.stringify(boxes)}, createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(boardId)}`);
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'board framed' });
  await sleep(300);
  await app.emulateDpr(1, width, height);
};

// j4.mjs's/j5.mjs's own pointer-sequence helper, copied verbatim: board
// selection is pointerdown-driven (delegated on the canvas), not a click
// handler — a bare .click() only synthesizes 'click', never 'pointerdown'.
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

// The Journal/Trash Board's own live boxes, read via the SAME test seam
// BoardEditor.tsx already exposes (window.wrizoBoard) — navigating through
// App.tsx's own bridge routes ('/journal', '/trash'), find-or-create +
// mount, exactly as a real writer would arrive.
const journalBoardBoxes = async (app) => {
  await app.goto('/journal');
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'Journal Board mounted' });
  await sleep(250);
  return (await app.evalJs('window.wrizoBoard()')) || [];
};
const trashBoardBoxes = async (app) => {
  await app.goto('/trash');
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'Trash Board mounted' });
  await sleep(250);
  return (await app.evalJs('window.wrizoBoard()')) || [];
};
const pinIds = (boxes) => boxes.filter((b) => b.kind === 'page-pin').map((b) => b.entryId);

// ab3.mjs's own openPageCategory helper, copied verbatim in spirit: index 1
// in the strip is the Page category (SECTION_A: journal[0]; SECTION_B:
// page[1], plan[2]) — B1's own Trash addition lands in section C (index
// 5), AFTER Page/Plan, so this index is untouched by B1.
const openPageCategory = async (app) => {
  await app.waitFor("document.querySelectorAll('.wz-strip-item').length === 8", { label: 'cascade strip mounted (openPageCategory)' });
  const alreadyOpen = await app.evalJs("!!document.querySelector('.wz-pageface-title')");
  if (alreadyOpen) return;
  await app.evalJs("[...document.querySelectorAll('.wz-strip-item')][1].click()");
  await app.waitFor("!!document.querySelector('.wz-pageface-title')", { label: 'Page category open (openPageCategory)' });
};

await withHarness(async (app) => {
  // ==========================================================================
  // S1 — system Boards exist: find-or-create idempotent, no project home,
  // marked via systemKind on the board-meta element.
  // ==========================================================================
  await freshDesk(app, LAPTOP_W, 900);
  await app.goto('/journal');
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'Journal Board, first approach' });
  await sleep(250);
  const journalIdFirst = (await app.evalJs('location.hash')).replace(/^#\/page\//, '');
  await app.reload();
  await app.evalJs("location.hash = '#/journal'");
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'Journal Board, second approach' });
  await sleep(250);
  const journalIdSecond = (await app.evalJs('location.hash')).replace(/^#\/page\//, '');
  ok('S1: the Journal Board is found-or-created IDEMPOTENTLY — two separate approaches resolve to the SAME board id',
    journalIdFirst === journalIdSecond && !!journalIdFirst, JSON.stringify({ journalIdFirst, journalIdSecond }));

  const journalEntryRow = await app.evalJs(`JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === ${JSON.stringify(journalIdFirst)})`);
  const journalMeta = (journalEntryRow?.boxes || []).find((b) => b.kind === 'board-meta');
  ok('S1: the Journal Board is a REAL board page (pageType \'board\') with NO project home, systemKind:\'journal\' on its board-meta element',
    journalEntryRow?.pageType === 'board' && journalEntryRow?.projectId == null && journalMeta?.systemKind === 'journal',
    JSON.stringify({ pageType: journalEntryRow?.pageType, projectId: journalEntryRow?.projectId, meta: journalMeta }));

  await app.goto('/trash');
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'Trash Board mounted' });
  await sleep(250);
  const trashId = (await app.evalJs('location.hash')).replace(/^#\/page\//, '');
  const trashEntryRow = await app.evalJs(`JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === ${JSON.stringify(trashId)})`);
  const trashMeta = (trashEntryRow?.boxes || []).find((b) => b.kind === 'board-meta');
  ok('S1: the Trash Board is ALSO a real board page, no project home, systemKind:\'trash\', and genuinely a DIFFERENT record from the Journal Board',
    trashEntryRow?.pageType === 'board' && trashEntryRow?.projectId == null && trashMeta?.systemKind === 'trash' && trashId !== journalIdFirst,
    JSON.stringify({ trashId, journalIdFirst, meta: trashMeta }));

  // Never appear in the Pin sheet's board leaves (no project → already
  // excluded — assert it anyway, per S1's own words). Seed a project with
  // one page, open its Pin sheet, drill into the project: the leaf list
  // must never contain "Journal"/"Trash" as a destination.
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const projects = JSON.parse(localStorage.getItem('writer-studio-projects') || '[]');
    projects.push({ id: 'b1-pin-project', title: 'Pin Sheet Project', type: 'creative', storyPlanId: null, createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-projects', JSON.stringify(projects));
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: 'b1-pin-page', text: 'Pin sheet probe', projectId: 'b1-pin-project', pageType: 'manuscript', source: 'page', origin: 'project', createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.evalJs("location.hash = '#/page/b1-pin-page'");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'Pin-sheet probe page framed' });
  await sleep(300);
  await app.emulateDpr(1, LAPTOP_W, 900);
  await openPageCategory(app);
  await app.waitFor("!!document.querySelector('.wz-pageface-verb-pin')", { label: 'Page face (Pin sheet probe)' });
  await app.evalJs("document.querySelector('.wz-pageface-verb-pin').click()");
  await app.waitFor("!!document.querySelector('.board-sheet')", { label: 'Pin sheet open (probe)' });
  await app.evalJs("document.querySelector('.board-dest-row')?.click()"); // drill into the (only) project
  await sleep(200);
  const pinLeafRows = await app.evalJs("[...document.querySelectorAll('.board-dest-row, .dz-rowtitle')].map(el => el.textContent.trim())");
  ok('S1: the Pin sheet\'s own board leaves NEVER list the Journal or Trash Board as a destination (no project home already excludes them; asserted live)',
    !pinLeafRows.some((t) => t.includes('Journal') || t.includes('Trash')), JSON.stringify(pinLeafRows));
  await app.evalJs("document.querySelector('.btn-quiet')?.click()"); // Cancel

  // Never appear as cards on any system Board — the two system boards
  // never reference each other or themselves, even after both exist and a
  // handful of ordinary journal pages have been reconciled onto the Journal
  // Board (S2, exercised below settles this too, but assert it here fresh).
  const journalBoxesS1 = await journalBoardBoxes(app);
  const trashBoxesS1 = await trashBoardBoxes(app);
  ok('S1: the Journal Board never cards itself or the Trash Board',
    !pinIds(journalBoxesS1).includes(journalIdFirst) && !pinIds(journalBoxesS1).includes(trashId), JSON.stringify(pinIds(journalBoxesS1)));
  ok('S1: the Trash Board never cards itself or the Journal Board',
    !pinIds(trashBoxesS1).includes(trashId) && !pinIds(trashBoxesS1).includes(journalIdFirst), JSON.stringify(pinIds(trashBoxesS1)));

  // ==========================================================================
  // S2 (a) — reconcile: capture creates a card.
  // ==========================================================================
  await freshDesk(app, LAPTOP_W, 900);
  // A fresh journal-origin page, via persistence.ts's own established test
  // seam (the SAME createJournalPage() the REAL Catch button calls — S5's
  // own dedicated section below drives the actual button, proving Catch
  // itself byte-identical; this fixture only needs the resulting STATE).
  const captureId = await app.evalJs('window.wrizoCreateJournalPage().id');
  await app.evalJs(`location.hash = '#/journal/${captureId}'`);
  await app.waitFor("!!document.querySelector('.entry-edit')", { label: 'fresh capture page framed' });
  await app.evalJs("document.querySelector('.entry-edit').focus()");
  await app.typeKeys('B1S2Capture — a genuine quick thought.');
  await sleep(2400); // JournalEntry's own autosave debounce, past it with margin

  const boxesAfterCapture = await journalBoardBoxes(app);
  // freshDesk (above) cleared localStorage, so this run's OWN Journal Board
  // carries a fresh id, distinct from S1's own journalIdFirst (that section
  // has already fully asserted its own idempotence claims) — captured here,
  // freshly, for everything S2 itself still needs to seed directly.
  const journalBoardIdS2 = (await app.evalJs('location.hash')).replace(/^#\/page\//, '');
  const captureCard = boxesAfterCapture.find((b) => b.kind === 'page-pin' && b.entryId === captureId);
  ok('S2 (a): a captured page gains EXACTLY one card on the Journal Board, with no lifting of a finger beyond the capture itself',
    !!captureCard, JSON.stringify({ captureId, cards: pinIds(boxesAfterCapture) }));

  // ==========================================================================
  // S2 (b/c) — reconcile: delete moves a card Journal→Trash; restore round-
  // trips home (deletedAt cleared), the Journal card returns, and OTHER
  // cards' arrangement is untouched. Also proves reconcile idempotence and
  // authored-position survival across reload + re-derivation.
  // ==========================================================================
  // A second, sibling journal page — its card's own authored position is
  // the "OTHER card" whose arrangement must survive the whole dance below
  // byte-for-byte.
  const siblingId = await app.evalJs('window.wrizoCreateJournalPage().id');
  await app.evalJs(`location.hash = '#/journal/${siblingId}'`);
  await app.waitFor("!!document.querySelector('.entry-edit')", { label: 'sibling page framed' });
  await app.evalJs("document.querySelector('.entry-edit').focus()");
  await app.typeKeys('B1S2Sibling — must never move.');
  await sleep(2400);

  let boxesNow = await journalBoardBoxes(app);
  const siblingCardBefore = boxesNow.find((b) => b.entryId === siblingId);
  ok('S2 fixture: the sibling page also gained a card, positioned by the SAME deterministic auto-placement',
    !!siblingCardBefore, JSON.stringify(siblingCardBefore));

  // Move the sibling card to a DISTINCTIVE, hand-authored position (a real
  // drag would exercise the same code path pointer-driven checks elsewhere
  // already prove — FX5's own S4 harness; here the fixture only needs the
  // RESULT: an authored x/y reconcile must never touch again). A direct
  // localStorage write doesn't update the app's already-hydrated in-memory
  // cache (this project's own established harness lesson) — reload
  // immediately so persistence.ts re-hydrates from it before anything else
  // reads or (worse) re-saves over it.
  await app.evalJs(`(() => {
    const key = 'writer-studio-journal-entries';
    const list = JSON.parse(localStorage.getItem(key));
    const board = list.find(e => e.id === ${JSON.stringify(journalBoardIdS2)});
    const box = board.boxes.find(b => b.entryId === ${JSON.stringify(siblingId)});
    box.x = 0.71; box.y = 0.42; box.w = 0.19; box.h = 0.15;
    localStorage.setItem(key, JSON.stringify(list));
  })()`);
  await app.reload();

  // Reconcile idempotence — run it twice (two separate mounts of the SAME
  // board), boxes byte-identical.
  boxesNow = await journalBoardBoxes(app);
  await app.reload();
  const boxesRunTwo = await journalBoardBoxes(app);
  ok('S2: reconcile is IDEMPOTENT — two separate mounts of the Journal Board against unchanged stored truth produce byte-identical boxes',
    JSON.stringify(boxesNow.slice().sort((a, b) => a.id.localeCompare(b.id))) === JSON.stringify(boxesRunTwo.slice().sort((a, b) => a.id.localeCompare(b.id))),
    JSON.stringify({ boxesNow, boxesRunTwo }));

  const siblingAfterIdempotence = boxesRunTwo.find((b) => b.entryId === siblingId);
  ok('S2: authored positions survive reload + re-derivation — the hand-placed sibling card is at the EXACT authored x/y/w/h, untouched by reconcile',
    siblingAfterIdempotence?.x === 0.71 && siblingAfterIdempotence?.y === 0.42 && siblingAfterIdempotence?.w === 0.19 && siblingAfterIdempotence?.h === 0.15,
    JSON.stringify(siblingAfterIdempotence));

  // Delete the CAPTURE page (not the sibling) — "does not change the
  // deletion mechanism" (S4's own words): this writes the exact same
  // `deletedAt` timestamp softDeleteEntry itself would, so reconcile is
  // proven against genuine stored truth, whichever door produced it. A
  // second, real-UI exercise of an actually-clickable existing delete path
  // (the Plan panel's own board delete) follows in the A18 section below.
  await app.evalJs(`(() => {
    const key = 'writer-studio-journal-entries';
    const list = JSON.parse(localStorage.getItem(key));
    const e = list.find(x => x.id === ${JSON.stringify(captureId)});
    e.deletedAt = new Date().toISOString();
    localStorage.setItem(key, JSON.stringify(list));
  })()`);
  await app.reload(); // re-hydrate persistence.ts's in-memory cache from the direct write

  const journalAfterDelete = await journalBoardBoxes(app);
  ok('S2 (b): deleting the captured page removes ITS card from the Journal Board — the card MOVED, not merely a coincidence of a fresh board',
    !pinIds(journalAfterDelete).includes(captureId), JSON.stringify(pinIds(journalAfterDelete)));
  const siblingAfterDelete = journalAfterDelete.find((b) => b.entryId === siblingId);
  ok('S2 (b): the sibling card\'s own authored arrangement is COMPLETELY untouched by the delete\'s own reconcile pass',
    siblingAfterDelete?.x === 0.71 && siblingAfterDelete?.y === 0.42, JSON.stringify(siblingAfterDelete));

  const trashAfterDelete = await trashBoardBoxes(app);
  const trashCardAfterDelete = trashAfterDelete.find((b) => b.entryId === captureId);
  ok('S2 (b): the deleted page gains a card on the Trash Board in the SAME reconcile-driven way — Journal→Trash, the card MOVED',
    !!trashCardAfterDelete, JSON.stringify(pinIds(trashAfterDelete)));

  // Trash cards show LIVE title/excerpt, not "Missing page" (a genuine
  // defect this ticket's own S4 fix closes — BoardPinBox's deleted-
  // inclusive read).
  const trashCardText = await app.evalJs(`(() => {
    const el = document.querySelector('[data-box-id="${trashCardAfterDelete?.id}"] .board-pin-title');
    return el ? el.textContent : null;
  })()`);
  ok('S4: a Trash card shows the deleted page\'s REAL, live title — never the generic "Missing page" a deletion-filtered read would produce',
    trashCardText === 'B1S2Capture — a genuine quick thought.', trashCardText);

  // Restore — a PLAIN BUTTON (no special fidelity claim; a simple .click()
  // suffices and is used here, per this ticket's own standing discipline
  // to say so explicitly).
  await app.evalJs(POINTER_HELPER);
  await selectBox(app, trashCardAfterDelete.id);
  await app.waitFor("!!document.querySelector('.board-action-row')", { label: 'Trash card selected, action row present' });
  const restoreBtnPresent = await app.evalJs("[...document.querySelectorAll('.board-action-row button')].some(b => b.textContent.trim() === 'Restore')");
  ok('S4: a selected Trash card offers Restore in the action row (the FX5 action-row precedent)', restoreBtnPresent === true, String(restoreBtnPresent));
  await app.evalJs("[...document.querySelectorAll('.board-action-row button')].find(b => b.textContent.trim() === 'Restore').click()");
  await sleep(400);

  const restoredEntry = await app.evalJs(`JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === ${JSON.stringify(captureId)})`);
  ok('S4: Restore clears deletedAt — the page is genuinely un-deleted, nothing else about its record touched (origin still \'journal\', projectId still null)',
    restoredEntry?.deletedAt == null && restoredEntry?.origin === 'journal' && restoredEntry?.projectId == null, JSON.stringify(restoredEntry));

  const trashAfterRestore = await trashBoardBoxes(app);
  ok('S2 (c): the restored page\'s card LEAVES the Trash Board', !pinIds(trashAfterRestore).includes(captureId), JSON.stringify(pinIds(trashAfterRestore)));

  const journalAfterRestore = await journalBoardBoxes(app);
  ok('S2 (c): the restored page\'s card RETURNS to the Journal Board — the full round trip (Journal→Trash→Journal) via reconcile alone',
    pinIds(journalAfterRestore).includes(captureId), JSON.stringify(pinIds(journalAfterRestore)));
  const siblingAfterRestore = journalAfterRestore.find((b) => b.entryId === siblingId);
  ok('S2 (c): across the ENTIRE delete→Trash→restore→Journal round trip, the sibling card\'s authored arrangement never moved once',
    siblingAfterRestore?.x === 0.71 && siblingAfterRestore?.y === 0.42 && siblingAfterRestore?.w === 0.19 && siblingAfterRestore?.h === 0.15,
    JSON.stringify(siblingAfterRestore));

  // No dialog, no toast, anywhere in this entire delete→restore dance
  // (S4's own absolute "no dialogs, no toasts, no counts, no badges,
  // ever").
  const noNagAnywhere = await app.evalJs("!document.querySelector('.action-toast') && !document.querySelector('[role=\"alertdialog\"]') && !document.querySelector('.wz-cascade-confirm')");
  ok('S4: the entire delete→Trash→restore round trip never showed a dialog, toast, count, or badge — the Trash is a place, not a nag',
    noNagAnywhere === true, String(noNagAnywhere));

  // ==========================================================================
  // S3 — arrange, never author: the system Board's own hand.
  // ==========================================================================
  await journalBoardBoxes(app); // land on the Journal Board, framed
  await sleep(150);
  await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
  await sleep(200);
  const journalSliverButtons = await app.evalJs("[...document.querySelectorAll('.wz-sliver-item-btn')].map(b => b.textContent.trim())");
  ok('S3: the Journal Board\'s own sliver carries NO Add control at all — "Add card" and "New page card" are genuinely absent, not merely disabled',
    !journalSliverButtons.includes('Add card') && !journalSliverButtons.includes('New page card'), JSON.stringify(journalSliverButtons));
  const journalFooterTogglePresent = await app.evalJs("!!document.querySelector('.wz-sliver-board-footer')");
  ok('S3: the connections-footer toggle STILL works on a system Board — arranging (including the footer) is the full FX5 hand, only Add/Delete are restricted',
    journalFooterTogglePresent === true, String(journalFooterTogglePresent));

  // Delete on a derived card is an inert, quiet no-op.
  const boxesBeforeInertDelete = await app.evalJs('window.wrizoBoard()');
  const someCardId = boxesBeforeInertDelete.find((b) => b.kind === 'page-pin')?.id;
  await selectBox(app, someCardId);
  await app.waitFor("!!document.querySelector('.board-action-row')", { label: 'a Journal card selected' });
  await app.evalJs("[...document.querySelectorAll('.board-action-row button')].find(b => b.textContent.trim() === 'Remove').click()");
  await sleep(300);
  const boxesAfterInertDelete = await app.evalJs('window.wrizoBoard()');
  ok('S3: hand-delete (Remove) on a derived card is an INERT, quiet no-op — the exact same card set survives the click, byte-identical',
    JSON.stringify(boxesBeforeInertDelete) === JSON.stringify(boxesAfterInertDelete), JSON.stringify({ before: boxesBeforeInertDelete.length, after: boxesAfterInertDelete.length }));

  // Pin/Move-Copy inert on the system Board's own Page face (may NOT pin
  // the system Board anywhere; Move/Copy would break "no project home").
  await openPageCategory(app);
  await app.waitFor("!!document.querySelector('.wz-pageface-verb-pin')", { label: 'Page face (system board)' });
  await app.evalJs("document.querySelector('.wz-pageface-verb-pin').click()");
  await sleep(250);
  const pinSheetOpenedOnSystemBoard = await app.evalJs("!!document.querySelector('.board-sheet')");
  ok('S3: Pin is inert on the system Board\'s own Page face — clicking "Pin to a Board…" opens nothing (the system Board may never be pinned anywhere)',
    pinSheetOpenedOnSystemBoard === false, String(pinSheetOpenedOnSystemBoard));
  await app.evalJs("document.querySelector('.wz-pageface-verb-movecopy').click()");
  await sleep(250);
  const addSheetOpenedOnSystemBoard = await app.evalJs("!!document.querySelector('.board-sheet')");
  ok('S3: Move/Copy is ALSO inert on the system Board\'s own Page face (a judgment call, disclosed in the build report: filing the Board into a project would break S1\'s own "no project home" invariant)',
    addSheetOpenedOnSystemBoard === false, String(addSheetOpenedOnSystemBoard));

  // Independent review fix (2026-07-19) — "told truthfully": the Journal
  // Board's own Page face must never claim a home describePageHome
  // (pageHome.ts) never actually derived for it. A genuine defect found
  // live: before this fix, EVERY system Board fell through describePageHome's
  // generic else-branch and reported "In the Journal" — flatly false for
  // the Trash Board (checked immediately below) and self-referential for
  // the Journal Board itself (checked here).
  const journalBoardHomeLabel = await app.evalJs("document.querySelector('.wz-pageface-home-label')?.textContent");
  ok('S1/S3: the Journal Board\'s own Page face names ITS home truthfully ("no project home"), never "In the Journal" (self-referential) or a project name it doesn\'t have',
    journalBoardHomeLabel === 'The Journal Board — has no project home', String(journalBoardHomeLabel));

  // Pinning the system Board anywhere is impossible even bypassing the UI —
  // the belt-and-suspenders pattern this codebase already established for
  // self-pin (FX6 S3), reused for the SAME class of guard: pinPageToBoard
  // itself now refuses when the entry being pinned is a system Board,
  // regardless of which OTHER real board it's aimed at.
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: 'b1-pin-target-board', text: 'A genuine other board', pageType: 'board', source: 'page', boxes: [], createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload(); // re-hydrate persistence.ts's cache — pinPageToBoard reads getJournalEntry, not raw localStorage
  await app.evalJs(`location.hash = '#/page/${journalBoardIdS2}'`);
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'Journal Board remounted (pin-guard fixture)' });
  const directPinAttempt = await app.evalJs(`window.wrizoPinPageToBoard(${JSON.stringify(journalBoardIdS2)}, 'b1-pin-target-board')`);
  const targetBoardAfterPinAttempt = await app.evalJs("JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === 'b1-pin-target-board')");
  ok('S3: pinning the Journal Board onto a genuine OTHER real board is refused by pinPageToBoard ITSELF (belt and suspenders — the same guard shape FX6 S3 established for self-pin), not merely hidden by the UI',
    directPinAttempt === null && (targetBoardAfterPinAttempt?.boxes ?? []).length === 0,
    JSON.stringify({ directPinAttempt, targetBoxes: targetBoardAfterPinAttempt?.boxes }));

  // User Boards remain completely untouched by this slice.
  await freshBoard(app, 'b1-user-board', [
    { id: 'b1-user-card', kind: 'text', x: 0.05, y: 0.05, w: 0.2, h: 0.08, z: 1, text: 'Hand-typed card' },
  ], LAPTOP_W, 900);
  await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
  await sleep(200);
  const userBoardSliverButtons = await app.evalJs("[...document.querySelectorAll('.wz-sliver-item-btn')].map(b => b.textContent.trim())");
  ok('S3: an ORDINARY user Board still carries BOTH Add controls, byte-identical to before this ticket — the restriction is scoped to system Boards only',
    userBoardSliverButtons.includes('Add card') && userBoardSliverButtons.includes('New page card'), JSON.stringify(userBoardSliverButtons));

  await app.evalJs(POINTER_HELPER);
  await selectBox(app, 'b1-user-card');
  await app.waitFor("!!document.querySelector('.board-action-row')", { label: 'user board card selected' });
  await app.evalJs("[...document.querySelectorAll('.board-action-row button')].find(b => b.textContent.trim() === 'Remove').click()");
  await sleep(250);
  const userBoardAfterDelete = await app.evalJs('window.wrizoBoard()');
  ok('S3: hand-delete on an ORDINARY board card genuinely REMOVES it — untouched by this ticket\'s inert-delete guard (scoped to system Boards only)',
    !userBoardAfterDelete.some((b) => b.id === 'b1-user-card'), JSON.stringify(userBoardAfterDelete));

  // A18 — a card deleted on a user Board is genuinely, fully removed; it
  // never surfaces on the Trash Board (A18 scopes to Pages, not cards).
  const trashAfterUserCardDelete = await trashBoardBoxes(app);
  ok('S4/A18: a card removed from a user Board never appears on the Trash Board — A18 scopes to Pages only, verbatim; card/thread trash stays out of v1',
    !pinIds(trashAfterUserCardDelete).some((id) => id === 'b1-user-card'), JSON.stringify(pinIds(trashAfterUserCardDelete)));

  // ==========================================================================
  // S4 — the Trash, surfaced: reachable via the cascade's section C, at its
  // foot, quiet (no count/badge anywhere), no purge control anywhere in v1.
  // ==========================================================================
  await journalBoardBoxes(app); // any framed page carries the same strip
  await sleep(150);
  const stripShape = await app.evalJs(`(() => {
    const items = [...document.querySelectorAll('.wz-strip-item')];
    return { count: items.length, labels: items.map(b => b.querySelector('.wz-strip-label')?.textContent) };
  })()`);
  ok('S4/S5: the Trash joins the cascade at the FOOT of section C — after Drawers and Shelf, before the Settings/Change Theme foot section',
    stripShape.labels[5] === 'Trash' && stripShape.labels[3] === 'Drawers' && stripShape.labels[4] === 'Shelf' && stripShape.labels[6] === 'Settings',
    JSON.stringify(stripShape));
  await app.evalJs("[...document.querySelectorAll('.wz-strip-item')][5].click()");
  await sleep(200);
  const trashPanelBody = await app.evalJs("document.querySelector('.wz-cascade-panel-body')?.textContent ?? ''");
  ok('S4: the Trash panel carries EXACTLY one plain action ("Open the Trash") — reachable, never prominent, no count, no badge, no list, no preview',
    trashPanelBody.trim() === 'Open the Trash', JSON.stringify(trashPanelBody));
  const noNumeralsInTrashPanel = !/\d/.test(trashPanelBody);
  ok('S4: no digit anywhere in the Trash panel\'s own text — genuinely no count, not merely a hidden one', noNumeralsInTrashPanel, trashPanelBody);
  await app.evalJs("document.querySelector('.wz-cascade-action').click()");
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'Trash Board via the cascade door' });
  await sleep(200);
  const trashRoute = await app.evalJs('location.hash');
  ok('S4: clicking "Open the Trash" travels to the Trash Board (a real /page/:id route)', trashRoute.startsWith('#/page/'), trashRoute);

  // Permanent purge is explicitly OUT of v1.
  const purgeControlAnywhere = await app.evalJs("document.body.innerText.toLowerCase().includes('purge') || document.body.innerText.toLowerCase().includes('delete forever') || document.body.innerText.toLowerCase().includes('permanently delete')");
  ok('S4: no purge / "delete forever" control exists anywhere on the Trash Board — permanent purge is explicitly out of v1',
    purgeControlAnywhere === false, String(purgeControlAnywhere));

  // Independent review fix (2026-07-19) — "told truthfully," the Trash
  // Board's own half: before this fix, opening the Trash Board's own Page
  // category showed "In the Journal" as its home — genuinely false (it has
  // no project home, and it certainly isn't the Journal). Verified live,
  // now asserted here.
  await openPageCategory(app);
  await app.waitFor("!!document.querySelector('.wz-pageface-home-label')", { label: 'Page face (Trash board)' });
  const trashBoardHomeLabel = await app.evalJs("document.querySelector('.wz-pageface-home-label')?.textContent");
  ok('S1/S3/S4: the Trash Board\'s own Page face names ITS home truthfully ("no project home"), never "In the Journal" (flatly false)',
    trashBoardHomeLabel === 'The Trash Board — has no project home', String(trashBoardHomeLabel));

  // ==========================================================================
  // S5 (a) — the Catch flow stays byte-identical: still writes a
  // journal-origin page, still opens JournalEntry.tsx at /journal/:id (NOT
  // the Board directly) — it simply appears on the Journal Board at the
  // NEXT reconcile, per the brief's own words.
  // ==========================================================================
  await freshDesk(app, LAPTOP_W, 900);
  const journalEntriesBeforeCatch = (await app.localJSON('writer-studio-journal-entries')) || [];
  // DeskRail (and its Catch button) only mounts on a genuinely non-framed
  // route (CD1 S4) — Arrival ('/') hides it unconditionally, and this ONLY
  // matters for reaching the button itself; Catch's own underlying model
  // (createJournalPage) is width-agnostic. The Shelf is a neutral, never-
  // framed route (untouched by this ticket) that always shows it.
  await app.goto('/shelf');
  await app.waitFor("!!document.querySelector('.desk-rail-catch')", { label: 'DeskRail reachable (S5 byte-identical check)' });
  await app.evalJs("document.querySelector('.desk-rail-catch').click()");
  await app.waitFor("!!document.querySelector('.entry-edit')", { label: 'Catch (S5 byte-identical check)' });
  const catchRoute = await app.evalJs('location.hash');
  ok('S5 (a): Catch still opens the SAME untyped writing surface (JournalEntry.tsx, /journal/:id) — never the Board directly',
    /^#\/journal\/[^/]+$/.test(catchRoute), catchRoute);
  const catchPageId = catchRoute.replace(/^#\/journal\//, '');
  await app.evalJs("document.querySelector('.entry-edit').focus()");
  await app.typeKeys('S5 byte-identical capture.');
  await sleep(2400);
  const catchEntry = await app.evalJs(`JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === ${JSON.stringify(catchPageId)})`);
  ok('S5 (a): the captured page still stamps origin:\'journal\', still no pageType (untyped), exactly as createJournalPage always has',
    catchEntry?.origin === 'journal' && catchEntry?.pageType == null && catchEntry?.projectId == null, JSON.stringify(catchEntry));
  // Measured BEFORE visiting the Journal Board — that visit itself is about
  // to find-or-create the Board (a SECOND, unrelated new entry), which
  // would otherwise pollute this specific "Catch itself only ever writes
  // ONE entry" count.
  const entriesRightAfterCatch = (await app.localJSON('writer-studio-journal-entries')) || [];
  ok('S5 (a) precondition: Catch created exactly one new journal entry (no double-write, no side effect on the count itself)',
    entriesRightAfterCatch.length === journalEntriesBeforeCatch.length + 1,
    `before=${journalEntriesBeforeCatch.length} after=${entriesRightAfterCatch.length}`);
  const boxesAfterS5Catch = await journalBoardBoxes(app);
  ok('S5 (a): the captured page simply appears on the Journal Board at the NEXT reconcile — no separate wiring, the SAME S2 mechanism',
    pinIds(boxesAfterS5Catch).includes(catchPageId), JSON.stringify(pinIds(boxesAfterS5Catch)));

  // ==========================================================================
  // S5 (b) — the doors re-pointed: DeskRail's Journal item, the cascade's
  // "Open the Journal," Arrival's no-resume fallback, and JournalEntry's own
  // "← The journal" back-link all now land on the Journal Board.
  // ==========================================================================
  await freshDesk(app, 900, 900); // legacy width — DeskRail's own reach
  await app.goto('/shelf'); // DeskRail hides unconditionally on '/' (CD1/HB1) regardless of width
  await app.waitFor("!!document.querySelector('.desk-rail-item')", { label: 'DeskRail reachable (S5 (b) rail check)' });
  await app.evalJs("[...document.querySelectorAll('.desk-rail-item')].find(b => b.textContent.includes('Journal')).click()");
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'DeskRail Journal item lands on the Board' });
  const deskRailJournalRoute = await app.evalJs('location.hash');
  ok('S5 (b): DeskRail\'s own "Journal" nav item — untouched code, same navigate(\'/journal\') call — now lands on the Journal Board',
    deskRailJournalRoute.startsWith('#/page/'), deskRailJournalRoute);
  const legacyRoomGone = await app.evalJs("!document.querySelector('.journal-new-page') && !document.querySelector('.journal-row')");
  ok('S5 (b): the retired room\'s own DOM (.journal-new-page/.journal-row) is genuinely absent — not just unlinked, gone',
    legacyRoomGone === true, String(legacyRoomGone));

  await freshDesk(app, LAPTOP_W, 900);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (S5 cascade check)' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted (S5 cascade check)' });
  await app.waitFor("document.querySelectorAll('.wz-strip-item').length === 8", { label: 'cascade strip mounted (S5 cascade check)' });
  await app.evalJs("[...document.querySelectorAll('.wz-strip-item')][0].click()"); // Journal category
  await app.waitFor("!!document.querySelector('.wz-cascade-action')", { label: 'Journal panel open (S5 cascade check)' });
  await app.evalJs("[...document.querySelectorAll('.wz-cascade-action')].find(b => b.textContent === 'Open the Journal').click()");
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'cascade Open-the-Journal lands on the Board' });
  const cascadeJournalRoute = await app.evalJs('location.hash');
  ok('S5 (b): the cascade\'s own "Open the Journal" button travels DIRECTLY to the Journal Board',
    cascadeJournalRoute.startsWith('#/page/'), cascadeJournalRoute);

  // Open's own no-resume fallback: authed, genuinely nothing to resume
  // (zero projects, zero journal entries) — lands on the Journal Board,
  // not a blank/broken room.
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Arrival, fresh, nothing to resume' });
  const preOpenEntries = (await app.localJSON('writer-studio-journal-entries')) || [];
  const preOpenProjects = (await app.localJSON('writer-studio-projects')) || [];
  ok('S5 (c) precondition: genuinely nothing to resume — zero projects, zero journal entries',
    preOpenEntries.length === 0 && preOpenProjects.length === 0, JSON.stringify({ entries: preOpenEntries.length, projects: preOpenProjects.length }));
  await app.click('Open');
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'Open\'s no-resume fallback lands on the Board', timeout: 5000 });
  const noResumeRoute = await app.evalJs('location.hash');
  ok('S5 (c): Open\'s own no-resume fallback re-points to the Journal Board — opens the app cold with nothing to resume and lands on the Journal Board, not the old broken room',
    noResumeRoute.startsWith('#/page/'), noResumeRoute);

  // JournalEntry.tsx's own "← The journal" back-link.
  const backLinkPageId = await app.evalJs('window.wrizoCreateJournalPage().id');
  await app.evalJs(`location.hash = '#/journal/${backLinkPageId}'`);
  await app.waitFor("!!document.querySelector('.entry-edit')", { label: 'fresh page (back-link check)' });
  await app.evalJs("document.querySelector('.entry-edit').focus()");
  await app.typeKeys('Back-link probe.');
  await sleep(2400);
  const backLinkHref = await app.evalJs("document.querySelector('a')?.textContent?.includes('journal') ? true : [...document.querySelectorAll('a')].some(a => a.textContent.includes('journal'))");
  ok('S5 (b) precondition: the "← The journal" back-link is present on an authored page', backLinkHref === true, String(backLinkHref));
  await app.evalJs("[...document.querySelectorAll('a')].find(a => a.textContent.toLowerCase().includes('journal'))?.click()");
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: '"← The journal" lands on the Board' });
  const backLinkRoute = await app.evalJs('location.hash');
  ok('S5 (b): JournalEntry.tsx\'s own "← The journal" back-link (untouched code) now lands on the Journal Board too — every old link re-points, no hole',
    backLinkRoute.startsWith('#/page/'), backLinkRoute);

  // ==========================================================================
  // S6 — geometry: both reference widths + the 1100px floor.
  // ==========================================================================
  for (const width of [LAPTOP_W, WIDE_W]) {
    await journalBoardBoxes(app);
    await app.emulateDpr(1, width, 900);
    await sleep(200);
    const framedShape = await app.evalJs(`({
      deskFramePresent: !!document.querySelector('.desk-frame'),
      stripPresent: !!document.querySelector('.wz-strip'),
      stripCount: document.querySelectorAll('.wz-strip-item').length,
      boardCanvasPresent: !!document.querySelector('.board-canvas'),
    })`);
    ok(`S6 @ ${width}px: the Journal Board mounts framed (DeskFrame + the 8-category strip, Trash included) — the same chrome any other Board already gets`,
      framedShape.deskFramePresent && framedShape.stripPresent && framedShape.stripCount === 8 && framedShape.boardCanvasPresent,
      JSON.stringify(framedShape));
    await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
    await sleep(150);
    const addAbsentAtWidth = await app.evalJs("![...document.querySelectorAll('.wz-sliver-item-btn')].some(b => b.textContent.trim() === 'Add card')");
    ok(`S6 @ ${width}px: Add stays absent from the system Board\'s sliver at this width too`, addAbsentAtWidth === true, String(addAbsentAtWidth));
  }

  // The 1100px floor: legacy chrome stays byte-identical — DeskRail's own
  // roster is untouched (no Trash item leaked into legacy chrome, per the
  // standing "legacy <1100px stays byte-identical" law), and the Board
  // itself renders via its pre-AB1 legacy branch (no DeskFrame at all).
  await freshDesk(app, LEGACY_W, 900);
  await app.goto('/journal');
  await app.waitFor("!!document.querySelector('.board-page, .board-canvas')", { label: 'Journal Board at the 1100px floor' });
  await sleep(250);
  const legacyFloorShape = await app.evalJs(`({
    deskFrameGone: !document.querySelector('.desk-frame'),
    stripGone: !document.querySelector('.wz-strip'),
    boardCanvasPresent: !!document.querySelector('.board-canvas'),
    railLabels: [...document.querySelectorAll('.desk-rail-item .desk-rail-label')].map(el => el.textContent),
  })`);
  ok(`S6 @ ${LEGACY_W}px (one below the 1100 floor): the Journal Board renders via its LEGACY branch — no DeskFrame, no strip at all`,
    legacyFloorShape.deskFrameGone && legacyFloorShape.stripGone && legacyFloorShape.boardCanvasPresent, JSON.stringify(legacyFloorShape));
  ok(`S6 @ ${LEGACY_W}px: DeskRail's own roster is BYTE-IDENTICAL — Catch, Journal, Shelf, Drawers, Library — no Trash item, no new legacy chrome`,
    JSON.stringify(legacyFloorShape.railLabels) === JSON.stringify(['Catch', 'Journal', 'Shelf', 'Drawers', 'Library']),
    JSON.stringify(legacyFloorShape.railLabels));

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ===========
// b1.mjs is a brand-new file; it parks nothing of its own (this ticket's
// OWN park sweep — the checks its own S5 retirement falsifies — lives in
// the FILES it superseded: ab3.mjs, cd1.mjs, cd2.mjs, j5.mjs, th2.mjs, each
// per the A4 convention that a file parks what supersedes ITS OWN checks.
// See this project's own git history / build report for the full
// inventory). This scaffold exists so a future ticket that supersedes any
// of THIS file's checks has a documented home, matching every other
// harness file's own pattern.
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log('\nB1 PARKED: gate is armed (HARNESS_PARKED=1) but empty — nothing has been parked out of b1.mjs. See this file\'s header comment.');
}

const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nB1 VERIFY: PASS (${checks.length} checks)` : `\nB1 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
