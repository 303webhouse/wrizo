// ITEMS 91 + 92 — THE BOARD'S PAGE DOOR, AND THE CARD THAT SURVIVES.
// A committed CDP verification scenario, per AGENTS.md's "harness scenarios
// persist." One file because one S0 proved they are one subject: a page made
// FROM a board must end up linked TO that board, and stay linked.
//
// ITEM 92 — THE MECHANISM, proven before the patch and stated so a future
// reader inherits it. `onAddPageCard` creates a real page and calls
// `pinPageToBoard`, which writes the BOARD's row IN THE STORE. But BoardEditor
// holds its cards in local React state initialized once (`useState(() =>
// initialEntry?.boxes ?? [])`) and, on a USER board, never re-read — the
// `subscribe()` that would refresh it lives inside the system-board-only
// reconcile effect. So local `boxes` still held the PRE-PIN array, and the
// unmount cleanup (`saveBoardBoxes(id, boxesRef.current)` + `flushNow()`) wrote
// that stale array straight back over the pin — fired by the very `navigate`
// the door itself performs. The card was created and then destroyed by the
// surface that created it.
//
// That is the hazard BoardEditor's own deck-wizard comment already names ("a
// direct saveBoardBoxes call here instead would race that same debounced
// autosave — the harness seeding/flushNow race this project has already
// diagnosed once, generalized"). `onAddPageCard` was the one card-creating door
// that reached around it. NOTE the ref detail, because a naive fix does not
// work: `boxesRef.current` is assigned during RENDER, and the handler batches
// its state update with a `navigate` that unmounts the component, so there may
// be no further render — a `setBoxes` alone leaves the ref the unmount guard
// actually reads still stale. The fix assigns both refs directly.
//
// ITEM 91 — Nick's S11, verbatim: "board → Page rail lands on Wrizo landing
// (verdict: New Page auto-linked back to the board)." The landing is literally
// what the old code produced: `backTo` is `'/'` for a system board, so the one
// universal control on the Board ejected the writer out of the room. CD4 S1
// reasoned an exit was honest for a permanently-unpaired board; **Nick has
// overruled that**, so b2.mjs's assertions encoding the old ruling are PARKED
// below with their originals quoted — never silently flipped.
//
// "Auto-linked back" is not one thing, and the split is the load-bearing part:
//   - a USER board's membership is AUTHORED, so the link is a PIN, carried on
//     the unborn descriptor (`?pin=`) and applied by `birth()`;
//   - a SYSTEM board's membership is DERIVED and never authored (A16), and
//     `reconcileSystemBoard` DELETES any pin whose page does not qualify — so a
//     pin there would be erased on the next reconcile, which is item 92's exact
//     defect. The honest link is MEMBERSHIP: give the page the origin that makes
//     it belong and the board adopts it by itself;
//   - TRASH has no creatable membership (a page cannot be authored already
//     deleted) and keeps the old exit.
// S3 and S4 below assert that split, because getting it wrong is invisible until
// a card silently vanishes.
//
// Fixtures (freshDesk / seedEntries / trustedClick) copied verbatim from bm1.mjs
// per the standing instruction not to re-derive fixtures.
// Run: node scripts/harness/item9192.mjs  (from apps/desktop, dist-web freshly built)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ROWS_KEY = 'writer-studio-journal-entries';

const freshDesk = async (app, width = 1400, height = 900) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.emulateDpr(1, width, height);
};

const seedEntries = async (app, rows) => {
  await app.goto('/');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before seed' });
  await app.evalJs(`(() => {
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push(...${JSON.stringify(rows)});
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after seed hydrate' });
};

const rectOf = (app, sel) => app.evalJs(
  `(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null;`
  + ' const r = el.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }; })()');

const trustedClick = async (app, sel) => {
  const r = await rectOf(app, sel);
  if (!r) throw new Error('trustedClick: no element ' + sel);
  const x = (r.left + r.right) / 2, y = (r.top + r.bottom) / 2;
  await app.mouseMove(x, y);
  await app.mouseDown(x, y);
  await app.mouseUp(x, y);
  await sleep(160);
};

// The board's OWN persisted row — the store's truth, not the component's.
const boardPins = (app, boardId) => app.evalJs(
  `(JSON.parse(localStorage.getItem(${JSON.stringify(ROWS_KEY)}) || '[]')`
  + `.find(e => e.id === ${JSON.stringify(boardId)})?.boxes || [])`
  + ".filter(b => b.kind === 'page-pin').map(b => b.entryId)");

const hash = (app) => app.evalJs('location.hash');

// Wait, but never abort the run on a timeout — let the assertion that follows
// report the true state. On a PRE-FIX build the PAGE → door never reaches a page
// surface at all, so a hard waitFor here kills the file before it returns a
// single verdict, and "no verdict" is a worse red than an accurate list of
// failures: the runner could not tell a falsified build from a broken scenario.
const waitSoft = async (app, expr, opts) => {
  try { await app.waitFor(expr, opts); } catch { /* the assertion reports the truth */ }
};

const USER_BOARD = {
  id: 'i9192-user-board', text: 'A user board', projectId: null, pageType: 'board',
  source: 'page', origin: 'loose', boxes: [],
  createdAt: '2026-05-01T00:00:00.000Z', updatedAt: '2026-05-01T00:00:00.000Z',
};

// Click by BeginningsRow's own `data-beginning` KEY, not by label text. Two
// reasons, both learned here: "New Page Card" and "New Card" both match a loose
// /card/i, so a regex fires whichever door comes first and would silently
// invalidate S1b; and the labels run through the desk lexicon, so a theme can
// rename them out from under a text match. The key is the stable identity.
const clickBeginning = (app, key) => app.evalJs(
  `(() => { const b = document.querySelector('.wz-beginning[data-beginning=' + JSON.stringify(${JSON.stringify(key)}) + ']');`
  + ` if (!b) throw new Error('no Beginnings door: ' + ${JSON.stringify(key)}); b.click(); return true; })()`);

// The sliver's board section carries the same three controls at ALL times,
// unlike the Beginnings row (an empty-state affordance that disappears the
// moment the board has a card). Matched on label because these buttons carry no
// data-attribute of their own.
const clickSliver = (app, label) => app.evalJs(
  `(() => { const b = [...document.querySelectorAll('.wz-sliver-item-btn')]`
  + `.find(n => n.textContent.trim() === ${JSON.stringify(label)});`
  + ` if (!b) throw new Error('no sliver control: ' + ${JSON.stringify(label)}); b.click(); return true; })()`);

const openBoard = async (app, boardId) => {
  await app.evalJs(`location.hash = '#/page/${boardId}'`);
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: `board ${boardId} open` });
};

await withHarness(async (app) => {
  // ==========================================================================
  // S1 — ITEM 92: THE NEW PAGE CARD SURVIVES THE DOOR THAT MAKES IT.
  // The door navigates away in the same act, so the unmount is not a separate
  // step the test has to arrange — it is what the door DOES.
  // ==========================================================================
  await freshDesk(app);
  await seedEntries(app, [USER_BOARD]);
  await openBoard(app, USER_BOARD.id);

  await app.waitFor("!!document.querySelector('.wz-beginnings')", { label: 'Beginnings row on a user board' });
  const doorPresent = await app.evalJs(
    "[...document.querySelectorAll('.wz-beginning')].map(n => n.dataset.beginning)");
  ok('S1 (a) — the board offers its New-page-card door',
    Array.isArray(doorPresent) && doorPresent.includes('newPageCard'),
    `doors=${JSON.stringify(doorPresent)}`);

  await clickBeginning(app, 'newPageCard');
  await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'travelled to the new page' });
  const madePageId = await app.evalJs("location.hash.split('/page/')[1] || ''");

  await sleep(700); // past the ~300ms debounced flush, so any clobber has landed
  const pinsAfterTravel = await boardPins(app, USER_BOARD.id);
  ok('S1 (b) — CONTROL: on an untouched board the card already survived, and still does',
    pinsAfterTravel.includes(madePageId),
    `pageId=${madePageId} pins=${JSON.stringify(pinsAfterTravel)}`);

  await openBoard(app, USER_BOARD.id);
  await sleep(400);
  const pinsOnReturn = await boardPins(app, USER_BOARD.id);
  ok('S1 (c) — and it is still there on returning to the board',
    pinsOnReturn.includes(madePageId),
    `pins=${JSON.stringify(pinsOnReturn)}`);

  const cardRendered = await app.evalJs(
    "document.querySelectorAll('.board-pin:not(.board-pin-missing)').length");
  ok('S1 (d) — and the board RENDERS a card, not merely a row in storage',
    typeof cardRendered === 'number' && cardRendered >= 1,
    `renderedPinCards=${cardRendered}`);

  // ==========================================================================
  // S1b — THE PRECONDITION THAT ACTUALLY REPRODUCES ITEM 92, and the reason
  // S1 above is labelled a CONTROL rather than the regression.
  //
  // The first draft of this file asserted the erasure on an untouched board and
  // PASSED against the pre-fix bundle — proving nothing. `lastSavedRef` is
  // initialized to the very same array as `boxes` (`useRef(boxes)`), so with no
  // local edit the unmount guard `boxesRef.current !== lastSavedRef.current` is
  // FALSE and the stale write never happens. The defect needs an unsaved local
  // edit outstanding at the moment the door is used — and the autosave that
  // would close that window is AUTOSAVE_MS = 2000ms away.
  //
  // So the honest reproduction is a writer's own ordinary rhythm: put a card on
  // the board, and within those two seconds reach for New Page Card. That is not
  // a contrived race; it is what arranging a board feels like. The window is
  // narrower than this lane's own S0 first stated, and the ledger says so.
  // ==========================================================================
  await freshDesk(app);
  await seedEntries(app, [USER_BOARD]);
  await openBoard(app, USER_BOARD.id);
  await app.waitFor("!!document.querySelector('.wz-beginnings')", { label: 'Beginnings row (S1b)' });

  // A plain card first: a local `setBoxes` the 2s autosave has NOT written yet.
  // The Beginnings row is an empty-state affordance and disappears once the
  // board has a card, so the second door has to come from the sliver — which
  // carries the same three controls at all times.
  await clickBeginning(app, 'newCard');
  await sleep(150); // well inside AUTOSAVE_MS (2000): the store is still empty
  const storeBeforeDoor = await app.evalJs(
    `(JSON.parse(localStorage.getItem(${JSON.stringify(ROWS_KEY)}) || '[]')`
    + `.find(e => e.id === ${JSON.stringify(USER_BOARD.id)})?.boxes || []).length`);
  ok('S1b (a) — precondition staged: the board has an UNSAVED card (store still empty)',
    storeBeforeDoor === 0, `boxesInStore=${storeBeforeDoor}`);

  await clickSliver(app, 'New page card'); // pins in the store, then navigates
  await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'travelled to the new page (S1b)' });
  const racedPageId = await app.evalJs("location.hash.split('/page/')[1] || ''");

  await sleep(900); // let the unmount write + its flushNow land
  const pinsAfterRace = await boardPins(app, USER_BOARD.id);
  ok('S1b (b) — the card SURVIVES the unmount write of an unsaved board [ITEM 92, THE REGRESSION]',
    !!racedPageId && pinsAfterRace.includes(racedPageId),
    `pageId=${racedPageId} pins=${JSON.stringify(pinsAfterRace)}`);

  // The other half of the same fix: merging must not be assignment. Taking the
  // STORE's boxes as local truth would have preserved the pin and thrown away
  // the writer's unsaved card — one loss traded for another.
  const kindsAfterRace = await app.evalJs(
    `(JSON.parse(localStorage.getItem(${JSON.stringify(ROWS_KEY)}) || '[]')`
    + `.find(e => e.id === ${JSON.stringify(USER_BOARD.id)})?.boxes || []).map(b => b.kind).sort()`);
  ok('S1b (c) — and the UNSAVED plain card survives with it (the merge is not an assignment)',
    Array.isArray(kindsAfterRace) && kindsAfterRace.includes('page-pin') && kindsAfterRace.length >= 2,
    `kinds=${JSON.stringify(kindsAfterRace)}`);

  await openBoard(app, USER_BOARD.id);
  await sleep(400);
  const pinsRaceReturn = await boardPins(app, USER_BOARD.id);
  ok('S1b (d) — and it is still there on returning, cold, from storage',
    !!racedPageId && pinsRaceReturn.includes(racedPageId),
    `pins=${JSON.stringify(pinsRaceReturn)}`);

  // ==========================================================================
  // S2 — ITEM 91: AN UNPAIRED USER BOARD'S PAGE DOOR OPENS A LINKED PAGE.
  // ==========================================================================
  await freshDesk(app);
  await seedEntries(app, [USER_BOARD]);
  await openBoard(app, USER_BOARD.id);

  await trustedClick(app, '.board-door[data-board-door="page"]');
  await sleep(300);
  const afterDoor = await hash(app);
  ok('S2 (a) — PAGE → opens an UNBORN page, not the landing [ITEM 91, THE REGRESSION]',
    /\/page\/new/.test(afterDoor) && !/#\/$/.test(afterDoor),
    `hash=${afterDoor}`);
  ok('S2 (b) — and the address carries this board as the pin target',
    afterDoor.includes(`pin=${USER_BOARD.id}`),
    `hash=${afterDoor}`);

  // Nothing is written until a word — PB1 still holds through the new door.
  const rowsBeforeWord = await app.evalJs(
    `JSON.parse(localStorage.getItem(${JSON.stringify(ROWS_KEY)}) || '[]').length`);
  ok('S2 (c) — the door itself writes NOTHING (PB1 survives item 91)',
    rowsBeforeWord === 1, `rows=${rowsBeforeWord} (the seeded board only)`);

  await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'unborn page surface' });
  await app.evalJs("document.querySelector('.forward-only-editor')?.focus()");
  await app.typeKeys('Born from a board.');
  await app.waitFor(
    `JSON.parse(localStorage.getItem(${JSON.stringify(ROWS_KEY)}) || '[]').some(e => (e.text||'').trim() === 'Born from a board.')`,
    { label: 'page born', timeout: 9000 },
  ).catch(() => {});
  await sleep(600);

  const bornId = await app.evalJs(
    `(JSON.parse(localStorage.getItem(${JSON.stringify(ROWS_KEY)}) || '[]')`
    + ".find(e => (e.text||'').trim() === 'Born from a board.') || {}).id || ''");
  const pinsAfterBirth = await boardPins(app, USER_BOARD.id);
  ok('S2 (d) — the first word births the page ALREADY PINNED to the board it came from',
    !!bornId && pinsAfterBirth.includes(bornId),
    `bornId=${bornId} pins=${JSON.stringify(pinsAfterBirth)}`);

  // ==========================================================================
  // S3 — ITEM 91 ON A SYSTEM BOARD: MEMBERSHIP, NOT A PIN.
  // A pin here would be deleted by reconcile, which is item 92's own defect.
  // The Journal board's link is the page's ORIGIN.
  // ==========================================================================
  await freshDesk(app);
  await app.goto('/journal');
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'Journal system board' });
  const journalBoardId = await app.evalJs("location.hash.split('/page/')[1] || ''");

  await trustedClick(app, '.board-door[data-board-door="page"]');
  await sleep(300);
  const afterJournalDoor = await hash(app);
  ok('S3 (a) — the Journal board\'s PAGE → opens an unborn page, not the landing',
    /\/page\/new/.test(afterJournalDoor),
    `hash=${afterJournalDoor}`);
  ok('S3 (b) — as a JOURNAL-origin page (membership), and NOT as a pin onto a derived board',
    /origin=journal/.test(afterJournalDoor) && !/pin=/.test(afterJournalDoor),
    `hash=${afterJournalDoor}`);

  await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'unborn journal page' });
  await app.evalJs("document.querySelector('.forward-only-editor')?.focus()");
  await app.typeKeys('Born from the Journal board.');
  await app.waitFor(
    `JSON.parse(localStorage.getItem(${JSON.stringify(ROWS_KEY)}) || '[]').some(e => (e.text||'').trim() === 'Born from the Journal board.')`,
    { label: 'journal page born', timeout: 9000 },
  ).catch(() => {});

  await openBoard(app, journalBoardId);
  await sleep(600);
  const journalBornId = await app.evalJs(
    `(JSON.parse(localStorage.getItem(${JSON.stringify(ROWS_KEY)}) || '[]')`
    + ".find(e => (e.text||'').trim() === 'Born from the Journal board.') || {}).id || ''");
  const journalPins = await boardPins(app, journalBoardId);
  ok('S3 (c) — the page the Journal board made appears ON the Journal board, by membership',
    !!journalBornId && journalPins.includes(journalBornId),
    `bornId=${journalBornId} pins=${JSON.stringify(journalPins)}`);

  // ==========================================================================
  // S4 — TRASH KEEPS ITS EXIT. A page cannot be authored already deleted, so
  // there is no membership to create and no pin that would survive. Asserted
  // rather than left to be rediscovered as a bug.
  // ==========================================================================
  await app.goto('/trash');
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'Trash system board' });
  await trustedClick(app, '.board-door[data-board-door="page"]');
  await sleep(400);
  const afterTrashDoor = await hash(app);
  ok('S4 — the Trash board keeps the old exit (no creatable membership there)',
    !/\/page\/new/.test(afterTrashDoor),
    `hash=${afterTrashDoor}`);
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// ---------------------------------------------------------------------------
// PARKS — item 91 REVERSES A RULED DEFAULT (CD4 S1), so the assertions that
// encoded it are parked with their ORIGINALS QUOTED and successors named. They
// are not wrong about what they measured; they are about behaviour Nick has
// since overruled. The immutability law governs a ruled default exactly as it
// governs a check.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  parkedChecks.push({
    name: 'PARKED (was b2.mjs "S1 (CD4 successor): the Shelf Board\'s PAGE → door lands backTo \'/\' — the FX10 named return / cold-load fallback, the SAME system-board law B1 already proved, now via the door instead of Done") — ITEM 91, Nick\'s S11 verdict: an unpaired board\'s PAGE → no longer EXITS; the Shelf Board now opens an unborn loose page (its own derived membership). Live successor: this file\'s S3 (the Journal board\'s equivalent) + S4 (Trash, which does keep the exit).',
    pass: true,
    detail: 'CD4 S1 ruled the exit honest for a permanently-unpaired board; Nick overruled it in the 2026-08-02 sitting. b2.mjs is re-pointed in the same commit.',
  });
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  const parkedPass = parkedChecks.every((c) => c.pass);
  // eslint-disable-next-line no-console
  console.log(parkedPass
    ? `\nITEM9192 PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed; the CD4 S1 exit assertion is parked, original quoted, successor named.`
    : `\nITEM9192 PARKED: FAIL — ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}

const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nITEM9192 VERIFY: PASS (${checks.length} checks)`
  : `\nITEM9192 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
