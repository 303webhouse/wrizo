// ITEM 97 — THE TRASHED PLAN BOARD: re-mint is the design; the DANGLE is the
// defect. A committed CDP verification scenario, per AGENTS.md's "harness
// scenarios persist."
//
// THE S0, AND THE CORRECTION IT FORCED. This lane opened item 97 on 2026-08-03
// with the finding that `getJournalEntry` returns null for a SOFT-DELETED row,
// so a trashed plan board leaves the page's `planBoardId` dangling and the next
// PLAN-> flip re-mints a second board. That reasoning came from reading
// `getOrCreatePlanBoard` ALONE, and it was INCOMPLETE: `softDeleteEntry` already
// unpairs a trashed plan board before marking it deleted (BM1 S2 — "deleting a
// plan board unpairs (page's planBoardId nulls, page untouched)"). So THE LOCAL
// TRASH PATH NEVER DANGLES, and never reaches the branch at all. S1 below is the
// control that proves it, so the correction is measured and not merely asserted.
//
// The branch IS reachable, but only where a board becomes absent WITHOUT going
// through `softDeleteEntry` — chiefly a SYNC PULL carrying another device's
// tombstone, which sets `deletedAt` through `applyRemoteRecords` with no unpair.
// That is the path S2 drives, using the sync double's armed pull
// (`/api/_sync_mode` `{ pull }`), so the guard is exercised rather than reviewed.
//
// NICK'S DECISION (2026-08-17), which this implements: re-mint is the DESIGNED
// behaviour — an absent board is treated as absent, soft-deleted included,
// deliberately — and the stale pointer is CLEARED. Trashed boards stay
// recoverable through item 90's future work.
//
// **THIS FILE DOES NOT BITE, AND THAT IS THE FINDING.** Run against the PRE-FIX
// bundle it is 7/7 GREEN. Minting fresh and re-pointing the page already
// happened on this path, so Nick's decision RATIFIES behaviour that was already
// there rather than repairing a defect — which also means this lane's own
// 2026-08-03 item 97 finding ("the next flip re-mints a second board" framed as
// a bug) was describing the design. What the code change adds is intent (the
// soft-deleted case named rather than incidental) and one edge (the pointer
// cleared at DETECTION, so it cannot survive a re-pair that misses). Neither is
// observable here. The file is kept as a STANDING GUARD on behaviour Nick has
// now ruled — if a future change makes a tombstoned board resolve, or leaves the
// page pointing at it, these go red — but it is not evidence of a fix, and is
// not presented as any.
//
// HONEST SCOPE, so no one mistakes what this closes. The re-mint already worked
// before the fix; the end of `getOrCreatePlanBoard` re-points the page at the
// new board. What the fix adds is (i) treating soft-deleted as absent
// DELIBERATELY, in the code rather than by accident, and (ii) clearing the stale
// pointer AT DETECTION, so it cannot outlive the call that noticed it — the
// re-pair at the end is conditional on re-reading the page, and if that read
// misses, the old code left the dangle in place. The residual is named rather
// than hidden: the WINDOW between a tombstone arriving and the next flip is not
// closed by this, and closing it would mean unpairing at apply-time — a larger
// change this lane did not make on its own authority.
//
// Run: node scripts/harness/item97.mjs  (from apps/desktop, dist-web freshly built)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ROWS_KEY = 'writer-studio-journal-entries';

const freshDesk = async (app, width = 1400, height = 900) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
};

const waitSoft = async (app, expr, opts) => {
  try { await app.waitFor(expr, opts); } catch { /* the assertion reports the truth */ }
};

const planBoardId = (app, pageId) =>
  app.evalJs(`window.wrizoPairing.planBoardId(${JSON.stringify(pageId)})`);

const rowOf = (app, id) => app.evalJs(
  `JSON.parse(localStorage.getItem(${JSON.stringify(ROWS_KEY)}) || '[]')`
  + `.find(e => e.id === ${JSON.stringify(id)}) || null`);

// Seed a page and give it a plan board through the STORE's own pairing seam —
// the same door PLAN-> uses, so what is measured is the product's own path.
const bornPageWithPlanBoard = async (app) => {
  const pageId = await app.evalJs('window.wrizoCreateJournalPage().id');
  const boardId = await app.evalJs(
    `(window.wrizoPairing.birth(${JSON.stringify(pageId)}) || {}).id || null`);
  return { pageId, boardId };
};

const armPull = (app, entries) => app.evalJs(
  "fetch('/api/_sync_mode', { method: 'POST', body: JSON.stringify("
  + JSON.stringify({ pull: { journalEntries: entries } })
  + ") }).then(r => r.json()).then(() => true)");
const disarm = (app) => app.evalJs(
  "fetch('/api/_sync_mode', { method: 'POST', body: '{}' }).then(r => r.json()).then(() => true)");

await withHarness(async (app) => {
  const seamOk = await app.evalJs(
    "typeof window.wrizoPairing === 'object' && typeof window.wrizoPairing.birth === 'function'");
  ok('S0 seam — window.wrizoPairing exposes the pairing verbs for inspection',
    seamOk === true, `seam=${seamOk}`);

  // ==========================================================================
  // S1 — the pairing precondition. NOTE WHAT IS **NOT** ASSERTED HERE, and why.
  //
  // The correction this ticket rests on — that the LOCAL trash path already
  // unpairs, so it never dangles — is covered by READING (`softDeleteEntry`
  // calls `unpairPlanBoard` before marking deleted, BM1 S2's own ruling), NOT by
  // a check in this file. `softDeleteEntry` is not exposed on any seam, and
  // re-proving BM1 S2's ruling is not item 97's job; adding production surface
  // to do it would be a worse trade than disclosing it. bm1.mjs already asserts
  // `unpair` itself. Disclosed rather than quietly skipped.
  // ==========================================================================
  await freshDesk(app);
  const local = await bornPageWithPlanBoard(app);
  ok('S1 — a page gets a plan board on first flip, and the page points at it',
    !!local.boardId && (await planBoardId(app, local.pageId)) === local.boardId,
    `page=${local.pageId} board=${local.boardId}`);

  // ==========================================================================
  // S2 — THE REACHABLE DANGLE: a REMOTE tombstone. applyRemoteRecords sets
  // deletedAt with no unpair, so this is the one path into the guard.
  // ==========================================================================
  await freshDesk(app);
  const remote = await bornPageWithPlanBoard(app);
  const boardRow = await rowOf(app, remote.boardId);
  ok('S2 (a) — precondition: the page is paired to a live board',
    (await planBoardId(app, remote.pageId)) === remote.boardId,
    `board=${remote.boardId}`);

  // A remote row can only land on a LOCALLY CLEAN id: `applyCollection` skips
  // anything still in the dirty set ("local unsynced edit wins", persistence.ts),
  // and a just-minted board is dirty by construction. The first draft of this
  // scenario armed the tombstone immediately and measured nothing — the pull was
  // correctly REFUSED, and S2(b) said so with `deletedAt=undefined`. So push and
  // clean first, exactly as a real second device would have done before the
  // delete could ever reach us.
  await app.evalJs("window.dispatchEvent(new Event('online'))");
  await waitSoft(app,
    `fetch('/api/_state').then(r => r.json()).then(s => s.pushedJournalIds.includes(${JSON.stringify(remote.boardId)}))`,
    { label: 'board pushed and cleaned', timeout: 15000 });
  await sleep(600); // markClean lands right after the push resolves

  // Another device trashed it: the same row, tombstoned, with a newer stamp.
  const tombstone = {
    ...(boardRow || {}),
    id: remote.boardId,
    deletedAt: '2026-12-31T00:00:00.000Z',
    updatedAt: '2026-12-31T00:00:00.000Z',
  };
  await armPull(app, [tombstone]);
  await app.evalJs("window.dispatchEvent(new Event('online'))");
  await waitSoft(app,
    `!JSON.parse(localStorage.getItem(${JSON.stringify(ROWS_KEY)}) || '[]')`
    + `.some(e => e.id === ${JSON.stringify(remote.boardId)} && !e.deletedAt)`,
    { label: 'remote tombstone applied', timeout: 15000 });
  await disarm(app);
  await sleep(400);

  const tombstoned = await rowOf(app, remote.boardId);
  ok('S2 (b) — the remote tombstone landed (the board is soft-deleted with NO unpair)',
    !!tombstoned && !!tombstoned.deletedAt,
    `deletedAt=${tombstoned && tombstoned.deletedAt}`);

  const remintedRemote = await app.evalJs(
    `(window.wrizoPairing.birth(${JSON.stringify(remote.pageId)}) || {}).id || null`);
  ok('S2 (c) — the next flip treats the absent board as ABSENT and mints fresh [ITEM 97, the design]',
    !!remintedRemote && remintedRemote !== remote.boardId,
    `old=${remote.boardId} new=${remintedRemote}`);

  const pointerNow = await planBoardId(app, remote.pageId);
  ok('S2 (d) — and the page points at the LIVE board, never at the tombstone [the dangle is cleared]',
    pointerNow === remintedRemote && pointerNow !== remote.boardId,
    `planBoardId=${pointerNow} live=${remintedRemote} tombstone=${remote.boardId}`);

  const stillDeleted = await rowOf(app, remote.boardId);
  ok('S2 (e) — CONTROL: the tombstoned board is NOT destroyed — it stays recoverable (item 90)',
    !!stillDeleted && !!stillDeleted.deletedAt,
    `row still present, deletedAt=${stillDeleted && stillDeleted.deletedAt}`);
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  // eslint-disable-next-line no-console
  console.log('\nITEM97 PARKED: PASS (0 checks) — HARNESS_PARKED=1 armed; item 97 parks nothing. BM1 S2 asserted that trashing a plan board unpairs, and it still does (S1(b) re-proves it live) — this ticket only makes the ABSENT-board branch deliberate and clears the pointer at detection, which no committed check ever covered.');
}

const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nITEM97 VERIFY: PASS (${checks.length} checks)`
  : `\nITEM97 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
