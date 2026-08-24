// ITEM 104 (+ ITEM 101 S0) — THE DOORWAY: the room a door opens must be the
// room you end up in. A committed CDP verification scenario, per AGENTS.md's
// "harness scenarios persist."
//
// THE MECHANISM, proven by reading BEFORE this file was written, and stated so
// a future reader inherits it rather than re-deriving it.
//
// Nick reported Screenplay selection as a SILENT NO-OP on an unborn page — both
// the New Page "Screenplay" door and the Draft panel's Structure toggle. His own
// live diagnosis then REFINED it: the doc kind SAVES, and an F5 after the switch
// mounts the script surface correctly, with elements and pagination. So nothing
// is dead and nothing is lost; only the LIVE swap fails.
//
// The cause is one line of dispatch. `UnbornPage` (pages/PageEditor.tsx) routes
// on `descriptor.kind` — what the ADDRESS said the door meant — while
// `PageEditor` (the born route) routes on `entry.pageType` — what the ROW says
// the page IS. And `birthWith` corrects the address with `history.replaceState`
// ON PURPOSE (components/UnbornSurface.tsx): a real `navigate()` there unmounts
// the surface mid-keystroke and drops a typing burst, which PB1's own
// burst-integrity check caught once already. `replaceState` never notifies
// HashRouter, so no route change occurs — exactly right for prose birth, and
// exactly wrong here: the row becomes `pageType:'script'` while `UnbornPage`
// keeps rendering `PageEditorView`, because the descriptor still says `prose`
// and always will. F5 re-reads `#/page/<id>`, lands on the BORN route, and
// mounts ScriptEditor correctly — precisely the asymmetry Nick measured.
//
// So the three reported symptoms are ONE defect: the door's intent outranking
// the room's truth after the room exists.
//
// WHAT THIS FILE SETTLES THAT READING COULD NOT. Two claims were still unproven
// when it was written, and it is built to answer them either way rather than to
// confirm a hope:
//   - 104(a) on a BORN page. The born route re-reads getJournalEntry every
//     render and App.tsx force-renders the whole routed tree on every write, so
//     the born swap SHOULD already work. S2 measures it. If S2 is green
//     PRE-FIX, then (a) is not a separate defect at all — it is the unborn case
//     wearing a different hat, and this file says so out loud.
//   - ITEM 101 (Page panel's New Page "did nothing"). Suspected: invoking New
//     Page while ALREADY on /page/new is a same-route navigation, so
//     UnbornProvider never remounts and the minted id never changes — the
//     writer clicks a door and gets the room they were already standing in.
//     S4 measures that directly.
//
// Run: node scripts/harness/item104.mjs  (from apps/desktop, dist-web freshly built)
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

// The script surface's own marks. The prose surface never renders these.
const onScriptSurface = (app) => app.evalJs(
  "!!document.querySelector('.script-sheet, .script-page, .script-el')");
const onProseSurface = (app) => app.evalJs("!!document.querySelector('.forward-only-editor')");
const hash = (app) => app.evalJs('location.hash');

const rows = (app) => app.evalJs(
  `JSON.parse(localStorage.getItem(${JSON.stringify(ROWS_KEY)}) || '[]')`
  + '.map(e => ({ id: e.id, pageType: e.pageType || null }))');

// The Beginnings row's Screenplay door — Nick's "New Page template icon".
// Clicked by its stable data-beginning KEY, never by themed label text.
const clickScreenplayDoor = (app) => app.evalJs(
  '(() => { const b = document.querySelector(\'.wz-beginning[data-beginning="screenplay"]\');'
  + " if (!b) throw new Error('no Screenplay beginnings door'); b.click(); return true; })()");

const beginningKeys = (app) => app.evalJs(
  "[...document.querySelectorAll('.wz-beginning')].map(n => n.dataset.beginning)");

await withHarness(async (app) => {
  // ==========================================================================
  // S1 — 104(b)+(c): the Screenplay door on an UNBORN page must land the writer
  // ON the script surface. This is the reported defect.
  // ==========================================================================
  await freshDesk(app);
  await app.goto('/page/new?mode=draft');
  await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'unborn page' });
  await sleep(300);
  const doorPresent = await beginningKeys(app);
  ok('S1 (a) — the unborn page offers the Screenplay door (Nick\'s "template icon")',
    Array.isArray(doorPresent) && doorPresent.includes('screenplay'),
    `doors=${JSON.stringify(doorPresent)}`);

  await clickScreenplayDoor(app);
  await sleep(900);

  const rowsAfter = await rows(app);
  ok('S1 (b) — the kind SAVES: a script row exists (Nick\'s refinement — nothing is lost)',
    Array.isArray(rowsAfter) && rowsAfter.some(r => r.pageType === 'script'),
    `rows=${JSON.stringify(rowsAfter)}`);

  const scripted = await onScriptSurface(app);
  const stillProse = await onProseSurface(app);
  ok('S1 (c) — and the SURFACE SWAPS LIVE to the script room [ITEM 104, THE REGRESSION]',
    scripted === true && stillProse === false,
    `scriptSurface=${scripted} proseSurface=${stillProse} hash=${await hash(app)}`);

  // Nick's F5 finding, kept as a standing control: the born route was always
  // right. If this ever goes red the defect has moved, not been fixed.
  await app.reload();
  await waitSoft(app, "!!document.querySelector('.script-sheet, .script-page, .script-el')",
    { label: 'script surface after reload' });
  const scriptedAfterReload = await onScriptSurface(app);
  ok('S1 (d) — CONTROL (Nick\'s F5): a reload mounts the script surface correctly',
    scriptedAfterReload === true, `scriptSurface=${scriptedAfterReload}`);

  // ==========================================================================
  // S2 — 104(a): the same switch on a BORN page. UNPROVEN before this file.
  // ==========================================================================
  await freshDesk(app);
  const bornId = await app.evalJs('window.wrizoCreateJournalPage().id');
  await app.evalJs(`location.hash = '#/page/${bornId}'`);
  await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'born prose page' });
  await sleep(400);
  const doorsOnBorn = await beginningKeys(app);
  if (Array.isArray(doorsOnBorn) && doorsOnBorn.includes('screenplay')) {
    await clickScreenplayDoor(app);
  }
  await sleep(900);
  const bornRow = await app.evalJs(
    `(JSON.parse(localStorage.getItem(${JSON.stringify(ROWS_KEY)}) || '[]')`
    + `.find(e => e.id === ${JSON.stringify(bornId)}) || {}).pageType || null`);
  const bornScripted = await onScriptSurface(app);
  ok('S2 — on a BORN page the kind-switch swaps the surface live',
    bornRow === 'script' && bornScripted === true,
    `pageType=${bornRow} scriptSurface=${bornScripted} doors=${JSON.stringify(doorsOnBorn)}`
    + ' — if GREEN pre-fix, 104(a) is the unborn case in a different hat');

  // ==========================================================================
  // S3 — PB1 IS NOT TRADED AWAY. The fix must not make a door write on arrival,
  // and must not remount the prose surface on ordinary first-word birth (the
  // burst-integrity property replaceState exists to protect).
  // ==========================================================================
  await freshDesk(app);
  await app.goto('/page/new?mode=draft');
  await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'unborn page (PB1)' });
  await sleep(500);
  const rowsOnArrival = await rows(app);
  ok('S3 (a) — CONTROL: opening the door still writes NOTHING (PB1 intact)',
    Array.isArray(rowsOnArrival) && rowsOnArrival.length === 0,
    `rows=${JSON.stringify(rowsOnArrival)}`);

  await app.evalJs("document.querySelector('.forward-only-editor')?.focus()");
  await app.typeKeys('Ordinary prose birth.');
  await waitSoft(app,
    `JSON.parse(localStorage.getItem(${JSON.stringify(ROWS_KEY)}) || '[]').some(e => (e.text||'').includes('Ordinary prose birth'))`,
    { label: 'prose birth', timeout: 9000 });
  await sleep(500);
  const proseStill = await onProseSurface(app);
  const proseNotScript = await onScriptSurface(app);
  ok('S3 (b) — CONTROL: ordinary first-word birth stays on the PROSE surface (no remount, no dropped burst)',
    proseStill === true && proseNotScript === false,
    `proseSurface=${proseStill} scriptSurface=${proseNotScript}`);

  // ==========================================================================
  // S4 — ITEM 101 S0: New Page invoked while ALREADY on an unborn page.
  //
  // Driven through the CASCADE'S OWN New Page door — the control Nick actually
  // used — not a browser navigation, so what is measured is the product path.
  // This is a MEASUREMENT, not a defect claim: the ledger itself flags item 101
  // as "Repro PENDING … Confirm the reproduction before attributing a defect."
  // The suspicion is that the click is a same-route navigation onto an
  // identical blank door, so nothing observable changes and nothing is lost —
  // which would make it a FEEDBACK gap, not a data defect. These checks assert
  // that mechanism precisely, so a green S4 CONFIRMS the benign reading and a
  // red S4 means something else is happening and item 101 is real.
  // ==========================================================================
  await freshDesk(app);
  await app.goto('/page/new?mode=draft');
  await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'unborn page (101)' });
  await sleep(400);
  const hashBefore101 = await hash(app);
  const rowsBefore101 = await rows(app);

  await app.waitFor("document.querySelectorAll('.wz-strip-item').length === 8", { label: 'cascade strip (101)' });
  if (!(await app.evalJs("!!document.querySelector('.wz-pageface-title')"))) {
    await app.evalJs("[...document.querySelectorAll('.wz-strip-item')][1].click()");
    await waitSoft(app, "!!document.querySelector('.wz-pageface-title')", { label: 'Page category (101)' });
  }
  const doorFound = await app.evalJs(
    "(() => { const b = [...document.querySelectorAll('.wz-cascade-action-door')]"
    + ".find(n => /new page/i.test(n.textContent)); if (!b) return false; b.click(); return true; })()");
  await sleep(800);

  const hashAfter101 = await hash(app);
  const rowsAfter101 = await rows(app);
  ok('S4 (a) — ITEM 101 S0: the cascade New Page door was reachable from an unborn page',
    doorFound === true, `doorFound=${doorFound}`);
  ok('S4 (b) — ITEM 101 S0: it writes NO row (nothing is lost — this is not a data defect)',
    Array.isArray(rowsAfter101) && rowsAfter101.length === 0,
    `before=${JSON.stringify(rowsBefore101)} after=${JSON.stringify(rowsAfter101)}`);
  ok('S4 (c) — ITEM 101 S0: and the writer is left on an unborn door either way (the "nothing happened" read)',
    /\/page\/new/.test(String(hashAfter101)),
    `hashBefore=${hashBefore101} hashAfter=${hashAfter101} — same-route navigation onto an identical blank door`);

  // ==========================================================================
  // S5 — 104(c): A DOOR THAT DECLARES SCREENPLAY OPENS THE SCREENPLAY ROOM.
  // Nick's verdict: "Screenplay mode should be auto-selected anyway when a user
  // comes from a New Page where the 'Screenplay' template icon was selected."
  // The descriptor now carries STRUCTURE, so the intent rides the ADDRESS and
  // survives a reload — the same property that makes the rest of PB1
  // reload-safe by construction.
  // ==========================================================================
  await freshDesk(app);
  await app.goto('/page/new?structure=screenplay');
  await waitSoft(app, "!!document.querySelector('.script-sheet, .script-page, .script-el')",
    { label: 'screenplay declared by the door' });
  await sleep(500);
  const declaredScript = await onScriptSurface(app);
  ok('S5 (a) — ?structure=screenplay lands the writer ON the script surface [ITEM 104(c)]',
    declaredScript === true, `scriptSurface=${declaredScript} hash=${await hash(app)}`);

  const declaredRows = await rows(app);
  ok('S5 (b) — and exactly ONE script row was born (the latch holds; no double birth)',
    Array.isArray(declaredRows) && declaredRows.length === 1 && declaredRows[0].pageType === 'script',
    `rows=${JSON.stringify(declaredRows)}`);

  // The intent is in the address, so it survives a reload of the DOOR itself.
  await freshDesk(app);
  await app.goto('/page/new?structure=screenplay');
  await waitSoft(app, "!!document.querySelector('.script-sheet, .script-page, .script-el')",
    { label: 'screenplay door before reload' });
  await app.reload();
  await waitSoft(app, "!!document.querySelector('.script-sheet, .script-page, .script-el')",
    { label: 'screenplay door after reload' });
  await sleep(400);
  const reloadScript = await onScriptSurface(app);
  ok('S5 (c) — the declared kind survives a reload (it rides the address, not storage)',
    reloadScript === true, `scriptSurface=${reloadScript}`);

  // ==========================================================================
  // S6 — THE HOOKS-ORDER CRASH (item 104 REOPEN, 2026-08-24). Live on
  // production before this fix; React error #300, whole tree blanked.
  //
  // THE MECHANISM. PageEditorView carries hooks BELOW its `if (!entry) return`
  // guard. React counts hooks per render, so the instant `entry` flips from a
  // row to null the count changes and React throws "rendered fewer hooks than
  // expected". The trigger is not a cold load and not a route: it is THE PAGE
  // YOU ARE LOOKING AT BECOMING ABSENT WHILE YOU ARE STILL ON IT — reproduced
  // here the way production reaches it, a tombstone arriving on a sync pull
  // because another device deleted the page.
  //
  // WHY 59/59 PASSED AND SHIPPED IT ANYWAY — the coverage gap, named so it is
  // fixed rather than re-suffered: NO committed scenario had ever driven
  // `entry` non-null -> null while a surface stayed MOUNTED. Every file either
  // sits on a page that exists or navigates away (which unmounts, and an
  // unmount is exactly what makes the fault invisible). The harness could not
  // even express "make this row vanish under the writer" until the armable
  // sync pull landed with item 97 the week before. That is item 109's ticket.
  //
  // WHAT THE FIX IS, and why it is not only the obvious lift: a census of
  // PageEditorView found THREE hooks below that guard, and `useCascade` is one
  // of them — a position OLDER than the doorway ship. Lifting only this
  // ticket's two hooks would have left the crash live, which the pre-doorway
  // baseline proved by still crashing without them. So the vanished-page
  // decision moved UP into the dispatchers, whose own hooks all sit above every
  // return: the page unmounts instead of re-rendering short, which removes the
  // CLASS rather than the instance.
  // ==========================================================================
  await freshDesk(app);
  const doomedId = await app.evalJs('window.wrizoCreateJournalPage().id');
  await app.evalJs(`location.hash = '#/page/${doomedId}'`);
  await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'the page about to vanish' });
  await app.evalJs("window.__hookErrs = []; window.addEventListener('error', e => window.__hookErrs.push(String(e.message)));");

  // Push and clean first: applyCollection refuses a remote row whose id is
  // still locally dirty ("local unsynced edit wins"), so a just-made page
  // cannot be tombstoned until the server has it.
  await app.evalJs("window.dispatchEvent(new Event('online'))");
  await waitSoft(app,
    `fetch('/api/_state').then(r => r.json()).then(s => s.pushedJournalIds.includes(${JSON.stringify(doomedId)}))`,
    { label: 'page pushed and cleaned', timeout: 15000 });
  await sleep(600);

  const doomedRow = await app.evalJs(
    `JSON.parse(localStorage.getItem(${JSON.stringify(ROWS_KEY)}) || '[]').find(e => e.id === ${JSON.stringify(doomedId)})`);
  await app.evalJs(
    "fetch('/api/_sync_mode', { method: 'POST', body: JSON.stringify({ pull: { journalEntries: ["
    + JSON.stringify({ ...(doomedRow || {}), deletedAt: '2026-12-31T00:00:00.000Z', updatedAt: '2026-12-31T00:00:00.000Z' })
    + "] } }) }).then(r => r.json()).then(() => true)");
  await app.evalJs("window.dispatchEvent(new Event('online'))");
  await sleep(2500);
  await app.evalJs("fetch('/api/_sync_mode', { method: 'POST', body: '{}' })");

  const after = await app.evalJs(`(() => ({
    rootKids: (document.getElementById('root') || { children: [] }).children.length,
    errs: (window.__hookErrs || []).slice(0, 3),
    arrival: !!document.querySelector('.wz-arrival'),
  }))()`);
  ok('S6 (a) — the page vanishing under the writer does NOT throw a hooks-order error [ITEM 104 REOPEN]',
    Array.isArray(after.errs) && after.errs.length === 0,
    `errs=${JSON.stringify(after.errs)}`);
  ok('S6 (b) — and the tree is NOT blanked: the writer is carried somewhere real',
    after.rootKids > 0,
    `rootKids=${after.rootKids} arrival=${after.arrival}`);
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  // eslint-disable-next-line no-console
  console.log('\nITEM104 PARKED: PASS (0 checks) — HARNESS_PARKED=1 armed; item 104 parks nothing: no committed assertion covered the unborn surface\'s dispatch, which is why a door that never opened its room survived to a founder session.');
}

const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nITEM104 VERIFY: PASS (${checks.length} checks)`
  : `\nITEM104 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
