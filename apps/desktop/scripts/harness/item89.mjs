// ITEM 89 — PERSIST THE DIRTY SET (the pre-flight sitting's S8, a P0 that lost
// work). A committed CDP verification scenario, per AGENTS.md's "harness
// scenarios persist."
//
// THE MECHANISM THIS GUARDS, stated so a future reader inherits it without
// re-deriving it. `store/persistence.ts` keeps a per-collection registry of the
// ids changed locally since the last successful push. Before this ticket that
// registry was module-scope memory and nothing else:
//
//     const dirty: Record<CollectionName, Set<string>> = { projects: new Set(), ... }
//
// `getDirtyRecords()` filters the CACHE BY that set, so the set is not a hint —
// it is the sole gate on what sync is even allowed to send. A reload before the
// next successful push therefore did not "delay" a push; it made the push
// impossible. The rows sat on disk, fully intact, permanently unsendable.
//
// The reason this went unseen for so long is the second half of the mechanism,
// and it is the part worth carrying forward: EVERY list in the app reads the
// LOCAL cache. `getJournalPages()`, `getShelfEntries()`, the system boards'
// `reconcileSystemBoard()`, the Everything export — all read `cache` alone; no
// surface in the product queries the server for a page list. So a stranded row
// renders exactly like a synced one on the device that owns it. There was no
// symptom to notice. The loss only became visible on a SECOND device, or never.
//
// Recovery, before this fix, was one hand-cleared localStorage flag — the
// one-shot journal backfill in `store/sync.ts` — which is what Fable ran on
// 2026-08-02 to rescue page `mscqyn48uyxk6p37l`. That flag is kept (it covers a
// disjoint population: rows wrongly marked CLEAN by the pre-D2 server), but it
// is no longer anyone's recovery lever; see its own comment for the reasoning.
//
// ---------------------------------------------------------------------------
// WHY THIS FILE GOES OFFLINE ON PURPOSE — a fixture lesson worth inheriting.
//
// The first draft of this scenario asserted "create a page, reload, the id is
// still dirty" and went RED on the correct build. It was measuring nothing.
// `runtime-verify.mjs`'s server double answers `/auth/me` with a test user and
// `/api/sync` with a valid empty pull (:113-:122, :178-:191), so the harness app
// is AUTHED AND ONLINE: every page it creates is pushed and correctly marked
// clean within a second or two. There was no dirty set left to survive
// anything, and the red said so.
//
// A scenario about unsent work must therefore make the send genuinely fail.
// This one ARMS THE SERVER DOUBLE to answer `/api/sync` with a real 503
// (`/api/_sync_mode`, added to runtime-verify.mjs on the exact precedent of
// TU2's `/api/_tutor_mode`). Auth still succeeds, so the app sits in exactly
// the authed-but-unreachable state a writer on a plane is in.
//
// The second draft trapped `window.fetch` page-side instead, and that was
// wrong in a way worth recording: a page-side trap dies with the page, so the
// reload came back ONLINE and the app pushed and cleaned the set before the
// assertion could read it. Three checks failed against a CORRECT build. The
// state item 89 is actually about is a device still unreachable AFTER a reload
// — close the laptop on the plane, open it at the gate — and only a
// server-side arm can hold that across a navigation. It also means the client
// takes its own genuine catch/backoff branch rather than a stand-in for one.
//
// So each scenario goes offline, writes, RELOADS STILL OFFLINE, and only then
// reconnects. S1(e) is the check that matters most — not "the flag survived"
// but THE PAGE REACHED THE SERVER, unattended, which is the thing that had to
// be done by hand for `mscqyn48uyxk6p37l`. `/api/_state` reports what the
// double was really sent, so that claim is measured on the wire, not inferred.
//
// WHAT THIS FILE DOES NOT ASSERT, stated rather than implied:
//   - `resetLocalData()`'s removal of the journal key on logout is covered by
//     code review at its call site, not here. Driving a real logout would end
//     the authed session the rest of the file depends on.
//   - `markClean()`'s own persistence is asserted only in the direction that
//     can lose work (S2). A dirty id that outlives its clean is a no-op
//     re-push — LWW + stable ids — which is the safe way for this to be wrong.
//
// Fixture (freshDesk) copied verbatim from pb1.mjs per the standing instruction
// not to re-derive fixtures. Seeding goes through `window.wrizoCreateJournalPage`
// per AGENTS.md's harness seeding law — never a raw localStorage write to a
// COLLECTION, whose flush race is the hazard that law exists for.
// Run: node scripts/harness/item89.mjs   (from apps/desktop, dist-web freshly built)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });

const DIRTY_KEY = 'writer-studio-dirty-v1';
const ROWS_KEY = 'writer-studio-journal-entries';

const freshDesk = async (app, width = 1400, height = 900) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
};

// Fail `/api/sync` and nothing else, so the app stays authed but unreachable —
// the plane, not the logout. Armed on the SERVER double, so it survives the
// reload; a page-side fetch trap would die with the page and could not express
// the state this ticket is actually about.
const setSync = (app, mode) => app.evalJs(
  `fetch('/api/_sync_mode', { method: 'POST', body: ${JSON.stringify(JSON.stringify(mode))} })`
  + '.then(r => r.json()).then(s => JSON.stringify(s.syncMode))',
);
const goOffline = (app) => setSync(app, { fail: true });

// Reconnect: un-arm the double, then fire the browser's own `online` event —
// which is the exact listener sync.ts registers (`window.addEventListener
// ('online', onOnline)`), so "pushes on reconnect" is exercised rather than
// assumed. Without it the run would sit through sync's exponential backoff
// (5s, 10s, 20s, 40s…) waiting for a retry that a reconnect is supposed to
// pre-empt — the first version of this file did exactly that and timed out.
const goOnline = async (app) => {
  const armed = await setSync(app, {});
  await app.evalJs("window.dispatchEvent(new Event('online'))");
  return armed;
};

// The registry as the rehydrated MODULE sees it — not as localStorage holds it.
// The distinction is the whole ticket: the bytes on disk were never the
// problem, the boot that ignored them was.
// Null-safe on purpose: on a build without the fix the seam does not exist at
// all, and a raw `window.wrizoDirty.ids()` would throw and abort the file
// before it returned a verdict. Absent seam reads as "nothing is dirty", which
// is precisely the pre-fix truth these checks are meant to catch.
const dirtyIds = (app) => app.evalJs(
  '(window.wrizoDirty ? window.wrizoDirty.ids() : { journalEntries: [] })');
const dirtyJournalRecordIds = (app) => app.evalJs(
  '(window.wrizoDirty ? window.wrizoDirty.records().journalEntries.map(r => r.id) : [])');

const journaledIds = (app) => app.evalJs(
  `(() => { try { return JSON.parse(localStorage.getItem(${JSON.stringify(DIRTY_KEY)}) || '{}'); } catch { return {}; } })()`,
);

const rowIds = (app) => app.evalJs(
  `JSON.parse(localStorage.getItem(${JSON.stringify(ROWS_KEY)}) || '[]').map(e => e.id)`,
);

// What the server double was actually sent — measured on the wire.
const pushedIds = (app) =>
  app.evalJs("fetch('/api/_state').then(r => r.json()).then(s => s.pushedJournalIds)");

const seedPage = (app) => app.evalJs('window.wrizoCreateJournalPage().id');

const journaledExpr = (id) =>
  `(JSON.parse(localStorage.getItem(${JSON.stringify(DIRTY_KEY)}) || '{}').journalEntries || [])`
  + `.includes(${JSON.stringify(id)})`;

// Wait, but never abort the run on a timeout — let the assertion that follows
// report the true state instead. On PRE-FIX code there is no journal at all, so
// a hard waitFor here would kill the file before it returned a single verdict,
// and "no verdict" is a worse red than an accurate list of failures: the suite
// runner could not tell a falsified build from a broken scenario. (pb1.mjs's
// waitForRowText carries the same discipline for the same reason.)
const waitSoft = async (app, expr, opts) => {
  try { await app.waitFor(expr, opts); } catch { /* the assertion reports the truth */ }
};

await withHarness(async (app) => {
  // ==========================================================================
  // S1 — A PAGE WRITTEN OFFLINE REACHES THE SERVER AFTER A RELOAD.
  // The whole arc. (c) is the check that fails on pre-fix code; (e) is the
  // one that states the user-facing truth.
  // ==========================================================================
  await freshDesk(app);

  const seam = await app.evalJs(
    "typeof window.wrizoDirty === 'object' && typeof window.wrizoDirty.ids === 'function'");
  ok('S1 seam — window.wrizoDirty exposes the registry for inspection', seam === true, `seam=${seam}`);

  const trapped = await goOffline(app);
  const bornId = await seedPage(app);
  await waitSoft(app, journaledExpr(bornId), { label: 'dirty id journaled to disk' });

  const liveIds = await dirtyIds(app);
  ok('S1 (a) — a page created while offline is marked dirty in the live registry',
    (liveIds.journalEntries || []).includes(bornId),
    `trap=${trapped} id=${bornId} journalEntries=${JSON.stringify(liveIds.journalEntries)}`);

  const onDisk = await journaledIds(app);
  ok('S1 (b) — that id reaches DISK, alongside the row it describes',
    (onDisk.journalEntries || []).includes(bornId),
    `disk=${JSON.stringify(onDisk.journalEntries)}`);

  const pushedWhileOffline = await pushedIds(app);
  ok('S1 (c) — the offline trap is real: the server has NOT been sent this row',
    !pushedWhileOffline.includes(bornId),
    `pushedJournalIds=${JSON.stringify(pushedWhileOffline)}`);

  // Reload STILL OFFLINE — the laptop closed on the plane and opened at the
  // gate. The registry is read before any push can clean it, so this assertion
  // measures survival and not a race.
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after reload' });

  const afterReload = await dirtyJournalRecordIds(app);
  ok('S1 (d) — AFTER RELOAD the row is still returned by getDirtyRecords() [THE REGRESSION]',
    afterReload.includes(bornId),
    `getDirtyRecords().journalEntries=${JSON.stringify(afterReload)}`);

  // Reconnect.
  await goOnline(app);
  await app.waitFor(
    `fetch('/api/_state').then(r => r.json()).then(s => s.pushedJournalIds.includes(${JSON.stringify(bornId)}))`,
    { label: 'stranded row pushed on reconnect', timeout: 15000 },
  ).catch(() => { /* the assertion below reports the truth either way */ });
  const pushedAfter = await pushedIds(app);
  ok('S1 (e) — the once-stranded page REACHES THE SERVER unattended [THE RECOVERY]',
    pushedAfter.includes(bornId),
    `pushedJournalIds=${JSON.stringify(pushedAfter)}`);

  const survivingRows = await rowIds(app);
  ok('S1 (f) — the row itself survived intact (no fix may trade data for a flag)',
    survivingRows.includes(bornId),
    `rows=${JSON.stringify(survivingRows)}`);

  // ==========================================================================
  // S2 — A SUCCESSFUL PUSH CLEARS THE JOURNAL ON DISK, NOT JUST IN MEMORY.
  // The mirror of S1. If `markClean()` did not persist, every device would
  // re-push its whole history on every boot forever and the journal would grow
  // without bound. S1 alone would pass happily in that world.
  // ==========================================================================
  const cleanOnDisk = await journaledIds(app);
  ok('S2 — once pushed, the id is gone from the ON-DISK journal',
    !(cleanOnDisk.journalEntries || []).includes(bornId),
    `disk=${JSON.stringify(cleanOnDisk.journalEntries)}`);

  // ==========================================================================
  // S3 — AN OFFLINE EDIT TO AN EXISTING PAGE SURVIVES TOO.
  // The sitting log named both halves: "strands offline-born pages AND offline
  // edits." This half drives the real product write path (editor → upsert →
  // debounced flush), so a fix that only journals at birth fails here.
  // ==========================================================================
  await freshDesk(app);
  const editId = await seedPage(app);
  await app.goto(`/page/${editId}`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'page editor' });

  // Offline AFTER the page has been born and pushed, so only the EDIT can put
  // this id back in the journal — the assertion cannot pass on the birth mark.
  await waitSoft(app,
    `fetch('/api/_state').then(r => r.json()).then(s => s.pushedJournalIds.includes(${JSON.stringify(editId)}))`,
    { label: 'page pushed before going offline', timeout: 15000 });
  await goOffline(app);
  await app.evalJs(`localStorage.setItem(${JSON.stringify(DIRTY_KEY)}, '{}')`);

  await app.evalJs("document.querySelector('.forward-only-editor')?.focus()");
  await app.typeKeys('An edit made with no server in sight');
  await waitSoft(app, journaledExpr(editId), { label: 'edit re-journals the id', timeout: 9000 });

  const editedOnDisk = await journaledIds(app);
  ok('S3 (a) — an offline edit re-journals the id after the journal was emptied',
    (editedOnDisk.journalEntries || []).includes(editId),
    `disk=${JSON.stringify(editedOnDisk.journalEntries)}`);

  // A reload keeps the hash, so this one lands back on the page, not the Desk.
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'page after edit reload' });

  const editAfterReload = await dirtyJournalRecordIds(app);
  ok('S3 (b) — AFTER RELOAD the edited row is still pushable',
    editAfterReload.includes(editId),
    `getDirtyRecords().journalEntries=${JSON.stringify(editAfterReload)}`);
  await goOnline(app);

  // ==========================================================================
  // S4 — THE RESTORE IS SELF-HEALING: A PHANTOM ID CANNOT STRAND A ROW.
  // A journaled id with no record is not merely useless — it is actively
  // harmful, because applyCollection() skips any id the dirty set holds
  // ("local unsynced edit wins"). Left unpruned, a phantom would block the
  // SERVER's own copy of that id from ever landing: a second way to lose a
  // page, introduced by the fix for the first. The boot prune is what makes
  // restoring the journal safe, so it gets asserted, not assumed.
  // ==========================================================================
  await freshDesk(app);
  await goOffline(app);
  const realId = await seedPage(app);
  await waitSoft(app, journaledExpr(realId), { label: 'real id journaled' });

  const PHANTOM = 'phantom-no-such-record-89';
  await app.evalJs(
    `(() => { const j = JSON.parse(localStorage.getItem(${JSON.stringify(DIRTY_KEY)}) || '{}');`
    + ` j.journalEntries = [...(j.journalEntries || []), ${JSON.stringify(PHANTOM)}];`
    + ` localStorage.setItem(${JSON.stringify(DIRTY_KEY)}, JSON.stringify(j)); })()`,
  );

  // Still offline across the reload, so the real id cannot be pushed and
  // cleaned out from under the assertion below.
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after phantom reload' });
  const pruned = await dirtyIds(app);

  ok('S4 (a) — a journaled id with no record is pruned on boot',
    !(pruned.journalEntries || []).includes(PHANTOM),
    `journalEntries=${JSON.stringify(pruned.journalEntries)}`);
  ok('S4 (b) — pruning is surgical: the real id beside it survives',
    (pruned.journalEntries || []).includes(realId),
    `realId=${realId} journalEntries=${JSON.stringify(pruned.journalEntries)}`);
  await goOnline(app);

  // ==========================================================================
  // S5 — A CORRUPT JOURNAL MUST NOT COST THE BOOT.
  // hydrate() has always treated unreadable storage as "start empty" rather
  // than crash; the journal inherits that contract. A registry that can brick
  // the app on malformed bytes would be a worse defect than the one being fixed.
  // ==========================================================================
  await freshDesk(app);
  await goOffline(app);
  const keptId = await seedPage(app);
  await waitSoft(app, journaledExpr(keptId), { label: 'id journaled before corruption' });
  await app.evalJs(`localStorage.setItem(${JSON.stringify(DIRTY_KEY)}, '{not json at all')`);

  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk boots on a corrupt journal' });

  const afterCorrupt = await dirtyIds(app);
  ok('S5 (a) — the app boots with a corrupt journal (no crash, Desk renders)',
    !!afterCorrupt && typeof afterCorrupt === 'object' && Array.isArray(afterCorrupt.journalEntries),
    `ids=${JSON.stringify(afterCorrupt)}`);
  const rowsAfterCorrupt = await rowIds(app);
  ok('S5 (b) — and the rows are untouched by the corrupt journal',
    rowsAfterCorrupt.includes(keptId),
    `rows=${JSON.stringify(rowsAfterCorrupt)}`);
  await goOnline(app);
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// ITEM 89 parks no assertion. It falsifies no committed check: before this
// ticket nothing in the suite asserted anything about the dirty registry at
// all, which is precisely why a P0 that made every offline write unsendable
// survived to a device sitting. The absence is the finding.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  // eslint-disable-next-line no-console
  console.log('\nITEM89 PARKED: PASS (0 checks) — HARNESS_PARKED=1 armed; item 89 parks nothing (no committed assertion covered the dirty registry before this file).');
}

const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nITEM89 VERIFY: PASS (${checks.length} checks)`
  : `\nITEM89 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
