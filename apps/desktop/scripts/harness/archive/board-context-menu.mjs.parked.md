# Parked records archived from board-context-menu.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/board-context-menu.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from board-context-menu.mjs lines 105-110 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 5e93c78ee5f9552dd1b9af622d1f7f6bce8c2ec2

```js
  // ---- PARKED - SUPERSEDED by DELETE FOR GOOD (ledger 107) ----
  // window.wrizoDelete.softAll (store/deleteSeams.ts) sends every live document to Trash for the seed. It does not ask "Send to Trash?": it
  // asks through its OWN gate first - gate() refuses unless the writer completed the in-app typed confirmation this page session
  // (store/destructiveGate.ts). Kept VERBATIM and no longer run; its parked record asserts that seam is the one new caller.
  // ok('S1: every call of softDeleteEntry outside persistence.ts (and a Page\'s own in-page confirm, S3) sits inside requestDelete(...) - the ONE gate: a board (menu, Plan row, Drawers tile) and a card can only be deleted through "Send to Trash?" or with asking turned off', bad.length === 0, JSON.stringify(bad));
  // ------------------------------------------------------------------
```

## Record 2 · from board-context-menu.mjs lines 338-340 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 5e93c78ee5f9552dd1b9af622d1f7f6bce8c2ec2

```js
        // ---- PARKED - SUPERSEDED by DELETE FOR GOOD (ledger 107): a trashed board can now be deleted for good from Trash, so its menu offers
        // Delete after Restore and a separator. Kept VERBATIM and no longer run.
        // ok('K16: its menu offers Restore (and no Delete), and Restore clears deletedAt - the board is back, with every card it had', Array.isArray(m16) && m16.includes('Restore') && !m16.includes('Delete') && !row16.deletedAt && (row16.boxes || []).length === 6, JSON.stringify({ m16, deletedAt: row16.deletedAt, n: (row16.boxes || []).length }));
```

## Record 3 · from board-context-menu.mjs lines 352-366 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 2595656497954d1547c560c7d313aac86494cc79

```js
  // ---- PARKED - SUPERSEDED by BIG PROJECTS 1a (docs/plans/big-projects.md, cleared by Fable 2026-10-18): K12 - a board TILE in the Drawers panel and its right-click "Delete board". The Drawers tab is the place switcher; board entries in the rail return with the Boards pop-out (step 2), which carries this same menu (the delete-for-good plan's connector risk 4).
  // Kept VERBATIM below and no longer run; the live successor follows.
  //
  // const tile = await app.evalJs(`(() => { const t = [...document.querySelectorAll('.wz-drawers-tile')].find((b) => b.textContent.includes('Menu board')); if (!t) return null; const r = t.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
  // if (!tile) ok('K12 fixture: the board\'s tile is in the Drawers panel', false, 'absent');
  // else {
  //   await rightClick(app, tile.x, tile.y);
  //   const mt = await menuItems(app);
  //   ok('K12: a board tile\'s right-click offers Delete board', JSON.stringify(mt) === JSON.stringify(['Delete board']), JSON.stringify(mt));
  //   await pick(app, 'Delete board'); await sleep(350);
  //   ok('K12: and asks "Send to Trash?"', !!(await dialog(app)), '');
  //   await dlgClick(app, 'go'); await sleep(700);
  //   const row2 = await app.evalJs(`(JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((e) => e.id === ${JSON.stringify(f.id)}) || {})`);
  //   ok('K12: the board is soft-deleted and its tile is gone from the panel', !!row2.deletedAt && !(await app.evalJs("[...document.querySelectorAll('.wz-drawers-tile')].some((b) => b.textContent.includes('Menu board'))")), JSON.stringify({ deletedAt: row2.deletedAt }));
  // }
```

## Record 4 · from board-context-menu.mjs lines 490-492 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 5e93c78ee5f9552dd1b9af622d1f7f6bce8c2ec2

```js
        // ---- PARKED - SUPERSEDED by DELETE FOR GOOD (ledger 107): a trashed page can now be deleted for good from Trash, so its menu offers
        // Delete after Restore and a separator. Kept VERBATIM and no longer run.
        // ok('K17: its menu offers Restore (no Delete) and Restore clears deletedAt - the page is back with every word', Array.isArray(mm) && mm.includes('Restore') && !mm.includes('Delete') && !back.deletedAt && back.text === WORDS, JSON.stringify({ mm, deletedAt: back.deletedAt }));
```
