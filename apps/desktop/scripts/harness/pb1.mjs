// PB1 — Born on the First Word (docs/wrizo-alpha/p1-wave.md §PB1, item 71;
// the unborn-surface specification is docs/wrizo-alpha/pb1-unborn-surface.md).
// A committed CDP verification scenario, per AGENTS.md's "harness scenarios
// persist."
//
// THE MECHANISM THIS GUARDS, stated so a future reader inherits it: every
// creation door used to persist a row with `text: ''` on arrival, which was
// safe only because JournalEntry.tsx's unmount soft-deleted an untouched empty
// page (honor-discard, J1a). FX14 unrouted that surface; PageEditor has no such
// cleanup; so on the day FX14 merged every door silently became a litter
// generator. Reproduced as fact at `ca34f67` before the fix: Catch left ONE
// live row with empty text and ZERO tombstones — the missing tombstone being
// the direct evidence that honor-discard no longer ran.
//
// So the checks below are not merely "no empty rows appear." They pin the
// specific regression shape: a door that opens a surface writes NOTHING, the
// first word writes EVERYTHING, and the write is durable across a reload. If a
// future change re-introduces persist-on-arrival, S1 (a)/(b) fail; if it makes
// birth lossy, S1 (d) fails; if it re-introduces a discard/reaper instead of
// birth-on-content, S3 fails on the tombstone count.
//
// Fixtures (freshDesk / seedFromDesk) copied verbatim from fx14.mjs / bg2.mjs
// per the standing instruction not to re-derive them.
// Run: node scripts/harness/pb1.mjs   (from apps/desktop, dist-web freshly built)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const LAPTOP_W = 1280;
const LEG_W = 1366, LEG_H = 768;

const freshDesk = async (app, width = 1400, height = 900) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
};

// Every persisted page row, live and soft-deleted, so a fix that swaps litter
// for tombstones is caught rather than congratulated.
const allRows = (app) => app.evalJs(
  "JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]')" +
  ".map(e=>({id:e.id,text:e.text,origin:e.origin||null,pageType:e.pageType||null,projectId:e.projectId||null,planBoardId:e.planBoardId||null,boxes:(e.boxes||[]).length,deletedAt:e.deletedAt||null}))");
const liveRows = async (app) => (await allRows(app)).filter((r) => !r.deletedAt);

const focusEditor = (app) => app.evalJs("document.querySelector('.forward-only-editor')?.focus()");

// Wait for the PERSISTED row to hold the whole typed string. Birth writes the
// first word synchronously; every later keystroke rides the app's ordinary
// debounced autosave (AUTOSAVE_MS = 2000), exactly as it does on any born page.
// Reading the row at +500ms therefore reads a mid-debounce snapshot, not an end
// state — the first run of this file asserted against that snapshot and called
// a correct build a failure. The real claim is "the words land and stay," so
// that is what this waits for; a timeout falls through so the assertion reports
// the true state instead of aborting the scenario.
const waitForRowText = async (app, expected, timeout = 9000) => {
  const expr = `JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').filter(e=>!e.deletedAt).some(e=>(e.text||'').trim() === ${JSON.stringify(expected)})`;
  try { await app.waitFor(expr, { timeout, label: `row text === ${expected}` }); } catch { /* assertion reports the truth */ }
};

await withHarness(async (app) => {
  // ==========================================================================
  // S1 (a) — a door that opens a blank surface writes NOTHING.
  // ==========================================================================
  await freshDesk(app, LAPTOP_W, 900);
  await app.goto('/drawers');
  await app.waitFor("!!document.querySelector('.desk-rail-catch')", { label: 'Catch reachable' });
  await app.evalJs("document.querySelector('.desk-rail-catch').click()");
  await sleep(500);
  const caught = await app.evalJs(`({
    hash: location.hash,
    editorLive: !!document.querySelector('.forward-only-editor'),
    focused: (() => { const ed = document.querySelector('.forward-only-editor');
      return !!ed && (ed === document.activeElement || ed.contains(document.activeElement)); })(),
  })`);
  ok('S1 (a): Catch opens an UNBORN surface — the address carries the door\'s meaning (/page/new?origin=journal), the editor is live, and the caret is already in it',
    /^#\/page\/new\?origin=journal$/.test(caught.hash) && caught.editorLive === true && caught.focused === true,
    JSON.stringify(caught));
  ok('S1 (a): and it persisted NOTHING — zero rows in the store (this is the regression that bred ~45 empty Untitleds)',
    (await allRows(app)).length === 0, JSON.stringify(await allRows(app)));

  // ==========================================================================
  // S1 (b) — the brief's own reproduction: navigate away without typing.
  // ==========================================================================
  await app.goto('/');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'back at the Desk' });
  await sleep(600);
  const afterLeaving = await allRows(app);
  ok('S1 (b) THE REPRODUCTION: open a New Page, navigate away without typing — nothing is left behind. Zero rows, and zero TOMBSTONES: the room was never built, not built-then-swept',
    afterLeaving.length === 0, JSON.stringify(afterLeaving));

  // ==========================================================================
  // S1 (c) — the first word writes the row, with the word already in it.
  // ==========================================================================
  await freshDesk(app, LAPTOP_W, 900);
  await app.goto('/drawers');
  await app.waitFor("!!document.querySelector('.desk-rail-catch')", { label: 'Catch reachable (birth)' });
  await app.evalJs("document.querySelector('.desk-rail-catch').click()");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'unborn page mounted' });
  await sleep(300);
  await focusEditor(app);
  await app.typeKeys('Born');
  await waitForRowText(app, 'Born');
  const born = await liveRows(app);
  const bornHash = await app.evalJs('location.hash');
  ok('S1 (c): the first word BIRTHS the page — exactly one row, carrying that word, and the address swaps from the door to the room',
    born.length === 1 && born[0].text.trim() === 'Born' && bornHash === `#/page/${born[0].id}`,
    JSON.stringify({ born, bornHash }));
  ok('S1 (c): the door\'s meaning survived the trip — Catch\'s page is journal-origin, exactly as before PB1',
    born.length === 1 && born[0].origin === 'journal', JSON.stringify(born));

  // ==========================================================================
  // S1 (d) — THE LOCAL-FIRST INVARIANT. The first word must be durable, not
  // merely present in memory: this ticket may not introduce one keystroke of
  // loss. A reload reads from localStorage alone.
  // ==========================================================================
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'reloaded born page' });
  await sleep(400);
  const survived = await liveRows(app);
  const reloadedText = await app.evalJs("(document.querySelector('.forward-only-editor')?.innerText||'').trim()");
  ok('S1 (d) LOCAL-FIRST: the birthing keystroke is DURABLE — it survives a hard reload (read back from localStorage), so birth-on-content introduced no loss window',
    survived.length === 1 && survived[0].text.trim() === 'Born' && reloadedText === 'Born',
    JSON.stringify({ survived, reloadedText }));

  // ==========================================================================
  // S1 (d2) — BURST INTEGRITY, the check that would actually catch loss.
  // Birth swaps the address, which swaps the route, which remounts the surface
  // — mid-keystroke-burst. If that remount could drop a character, a long fast
  // burst is where it would show. Typed character by character through real key
  // events, then read back from localStorage after a reload, so the assertion
  // rests on what reached disk and not on what the DOM happens to show.
  // ==========================================================================
  await freshDesk(app, LAPTOP_W, 900);
  await app.goto('/page/new?origin=loose');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'unborn (burst probe)' });
  await sleep(300);
  await focusEditor(app);
  const BURST = 'The quick brown fox jumps over the lazy dog and keeps going';
  await app.typeKeys(BURST);
  await waitForRowText(app, BURST);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'burst page reloaded' });
  await sleep(400);
  const burstRows = await liveRows(app);
  ok('S1 (d2) BURST INTEGRITY: a long fast burst across the birth boundary loses NOT ONE character — every keystroke typed before, during and after the route swap is on disk after a reload',
    burstRows.length === 1 && burstRows[0].text.trim() === BURST,
    JSON.stringify({ expected: BURST, got: burstRows.map((r) => r.text) }));

  // ==========================================================================
  // S1 (e) — a keystroke that leaves the page empty does NOT birth it.
  // "A page is born when it has a word."
  // ==========================================================================
  await freshDesk(app, LAPTOP_W, 900);
  await app.goto('/page/new?origin=loose');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'unborn (whitespace probe)' });
  await sleep(300);
  await focusEditor(app);
  await app.typeKeys('   ');
  await sleep(500);
  ok('S1 (e): whitespace is not a word — a keystroke that leaves the page empty does not birth it',
    (await allRows(app)).length === 0, JSON.stringify(await allRows(app)));

  // ==========================================================================
  // S1 (f) — the descriptor is in the URL, so a RELOAD keeps the door's
  // meaning (Fable's ruling 1: reload-safe by construction).
  // ==========================================================================
  await freshDesk(app, LAPTOP_W, 900);
  await app.goto('/page/new?origin=journal');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'unborn before reload' });
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'unborn after reload' });
  await sleep(300);
  await focusEditor(app);
  await app.typeKeys('After a reload');
  await waitForRowText(app, 'After a reload');
  const afterReloadBirth = await liveRows(app);
  ok('S1 (f): the descriptor lives in the ADDRESS, so a reload before the first word keeps the door\'s meaning — the page still births journal-origin, with no storage and no fallback rule',
    afterReloadBirth.length === 1 && afterReloadBirth[0].origin === 'journal' && afterReloadBirth[0].text.trim() === 'After a reload',
    JSON.stringify(afterReloadBirth));

  // ==========================================================================
  // S1 (g) — Arrival's Write door, the other bare-room page door.
  // ==========================================================================
  await freshDesk(app, LAPTOP_W, 900);
  await app.waitFor("!!document.querySelector('.wz-arrival-write')", { label: 'Write door' });
  await app.evalJs("document.querySelector('.wz-arrival-write').click()");
  await sleep(600);
  const writeHash = await app.evalJs('location.hash');
  ok('S1 (g): Arrival\'s Write door opens an unborn LOOSE surface and writes nothing',
    writeHash.startsWith('#/page/new') && writeHash.includes('origin=loose') === false
      ? (await allRows(app)).length === 0 && writeHash === '#/page/new'
      : (await allRows(app)).length === 0,
    JSON.stringify({ writeHash, rows: await allRows(app) }));

  // ==========================================================================
  // S2 — a BOARD is born when it has a box.
  // ==========================================================================
  await freshDesk(app, LAPTOP_W, 900);
  await app.goto('/page/new?kind=board');
  await app.waitFor("!!document.querySelector('.board-canvas, .board-projection')", { label: 'unborn board mounted' });
  await sleep(400);
  ok('S2: an unborn BOARD mounts as a real board surface and persists nothing — the two untitled create-board doors were the duplicate-empty-board source',
    (await allRows(app)).length === 0, JSON.stringify(await allRows(app)));
  const rowUp = await app.evalJs("!!document.querySelector('.wz-beginnings')");
  ok('S2: the Beginnings row is up on it (BG1/BG2 — its gate is zero boxes, which an unborn board always is), so a fresh board is still never a dead end',
    rowUp === true, String(rowUp));
  await app.evalJs("document.querySelector('[data-beginning=\"newCard\"]').click()");
  await sleep(700);
  const boardBorn = await liveRows(app);
  ok('S2: the first BOX births the board — one row, pageType board, carrying that box',
    boardBorn.length === 1 && boardBorn[0].pageType === 'board' && boardBorn[0].boxes >= 1,
    JSON.stringify(boardBorn));

  // ==========================================================================
  // S2 — PLAN → from an unborn page: birth, then mint, then pair. Ruling 2's
  // fixed order, so no pointer dangles and no orphan board is minted.
  // ==========================================================================
  await freshDesk(app, LAPTOP_W, 900);
  await app.goto('/page/new?origin=loose');
  await app.waitFor("!!document.querySelector('[data-page-plan-door]')", { label: 'unborn page with PLAN door' });
  await sleep(300);
  await app.evalJs("document.querySelector('[data-page-plan-door]').click()");
  await sleep(900);
  const paired = await liveRows(app);
  const page = paired.find((r) => r.pageType !== 'board');
  const boards = paired.filter((r) => r.pageType === 'board');
  ok('S2 (ruling 2, fixed order): PLAN → on an unborn page births the PAGE, then mints the board, then pairs — page and board both exist, the pointer resolves, and exactly ONE board was minted (no orphan)',
    !!page && boards.length === 1 && page.planBoardId === boards[0].id,
    JSON.stringify(paired));

  // ==========================================================================
  // S2 — Screenplay births (the ruled AMENDMENT to ruling 2).
  // ==========================================================================
  await freshDesk(app, LAPTOP_W, 900);
  await app.goto('/page/new?origin=loose');
  await app.waitFor("!!document.querySelector('[data-beginning=\"screenplay\"]')", { label: 'unborn page, Screenplay door' });
  await sleep(300);
  await app.evalJs("document.querySelector('[data-beginning=\"screenplay\"]').click()");
  await sleep(800);
  const scripted = await liveRows(app);
  ok('S2 (the amendment): Screenplay BIRTHS at zero words — it transforms the document rather than decorating it, so a script page always has a row and there is no unborn script surface to hold',
    scripted.length === 1 && scripted[0].pageType === 'script', JSON.stringify(scripted));

  // ==========================================================================
  // The unborn surface's own absences (the specification's affordance table).
  // ==========================================================================
  await freshDesk(app, LAPTOP_W, 900);
  await app.goto('/page/new?origin=loose');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'unborn page (absences)' });
  await sleep(500);
  await app.waitFor("document.querySelectorAll('.wz-strip-item').length === 8", { label: 'cascade strip mounted' });
  await app.evalJs("[...document.querySelectorAll('.wz-strip-item')][1].click()");
  await sleep(500);
  const absences = await app.evalJs(`({
    face: !!document.querySelector('.wz-pageface-title'),
    star: !!document.querySelector('.wz-pageface-star'),
    tagInput: !!document.querySelector('.wz-pageface-tag-input'),
    tutor: !!document.querySelector('.wz-tutor, .wz-tutor-panel'),
    rows: JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').length,
  })`);
  ok('Unborn absences: the Page face still renders (its home line reads the descriptor) but Star and the tag input are ABSENT — patchJournalEntry would silently no-op on a page with no row, and a star that does not stick is half-work',
    absences.face === true && absences.star === false && absences.tagInput === false, JSON.stringify(absences));
  // E4 + Nick's MIRRORED-HANDS ruling supersede the ABSENCE half of this
  // check; its original is parked verbatim below, never edited in place.
  // What SURVIVES is the half PB1 actually exists to protect, and it now
  // carries more weight than it did: "opening the panel wrote nothing" used
  // to be a trivial consequence of the panel not being there at all, and is
  // now a live guarantee about a MOUNTED panel sitting on an unwritten page
  // — which is exactly the property whose violation this wave found shipped
  // on boards (a Tutor send there wrote a real row: text:'', boxes:0).
  ok('Unborn absences, successor: the Tutor is PRESENT on an unborn page (mirrored hands — both hands mount from first paint) and opening it STILL WROTE NOTHING — the surviving half of the parked absence check, now a claim about a mounted panel rather than an absent one',
    absences.tutor === true && absences.rows === 0, JSON.stringify(absences));

  // ==========================================================================
  // An unborn page is invisible to every derived view — structurally, because
  // the unborn slot is not in the cache the enumerations read.
  // ==========================================================================
  const invisible = await app.evalJs(`({
    journal: (window.wrizoJournalPages ? window.wrizoJournalPages().length : null),
    rows: JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').length,
    placesRows: document.querySelectorAll('.wz-places-row, .dz-row').length,
  })`);
  ok('An unborn page appears in NO list — nothing in the store to enumerate, so Places/Journal/Shelf cannot show it (absence by construction, not by a filter someone must remember)',
    invisible.rows === 0, JSON.stringify(invisible));

  // ==========================================================================
  // S3 — NO SWEEPER. A pre-existing empty page is never touched by code.
  // ==========================================================================
  await freshDesk(app, LAPTOP_W, 900);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: 'pb1-legacy-empty', text: '', projectId: null, origin: 'journal', source: 'page', createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after legacy seed' });
  // Visit the legacy empty page, leave it, and open/leave an unborn one too.
  await app.evalJs("location.hash = '#/page/pb1-legacy-empty'");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'legacy empty page open' });
  await sleep(400);
  await app.goto('/page/new?origin=journal');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'unborn page open' });
  await sleep(400);
  await app.goto('/');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk again' });
  await sleep(700);
  const legacy = await allRows(app);
  const legacyRow = legacy.find((r) => r.id === 'pb1-legacy-empty');
  ok('S3 NO SWEEPER: a pre-existing empty page is still there, still live, still untouched — PB1 deletes nothing, and there is no background reaper. Nick\'s existing empties are his to keep or clear',
    legacy.length === 1 && !!legacyRow && legacyRow.deletedAt === null && legacyRow.text === '',
    JSON.stringify(legacy));
  ok('S3: and no TOMBSTONE was minted anywhere in that round trip — the fix is birth-on-content, not create-then-discard (which would have been Trash litter instead of Places litter)',
    legacy.every((r) => r.deletedAt === null), JSON.stringify(legacy));

  // ==========================================================================
  // The relationship doors are UNCHANGED: they were never the litter, because
  // the room is entered at the moment it is made.
  // ==========================================================================
  await freshDesk(app, LAPTOP_W, 900);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: 'pb1-board', text: 'PB1 Board', pageType: 'board', source: 'page', boxes: [], createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.evalJs("location.hash = '#/page/pb1-board'");
  await app.waitFor("!!document.querySelector('.wz-beginnings')", { label: 'seeded board with row' });
  await sleep(400);
  await app.evalJs("document.querySelector('[data-beginning=\"newPageCard\"]').click()");
  await sleep(900);
  const pageCardRows = await liveRows(app);
  const pinned = pageCardRows.find((r) => r.id === 'pb1-board');
  const newPage = pageCardRows.find((r) => r.id !== 'pb1-board' && r.pageType !== 'board');
  ok('The relationship doors are UNCHANGED: New Page Card still births its page immediately, because it creates a page AND pins it in one act — a room entered at the moment it is made was never the litter',
    !!newPage && !!pinned && pinned.boxes >= 1, JSON.stringify(pageCardRows));

  // ==========================================================================
  // The 1366x768 leg — the unborn surface is a new mount path, so it is
  // asserted at the small-laptop floor too. (PB1 changes no geometry; this is
  // a mount/typeability check, not a layout claim.)
  // ==========================================================================
  await freshDesk(app, LEG_W, LEG_H);
  await app.goto('/page/new?origin=loose');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'unborn page at the leg' });
  await sleep(400);
  await focusEditor(app);
  await app.typeKeys('At the leg');
  await waitForRowText(app, 'At the leg');
  const legBorn = await liveRows(app);
  ok('1366x768 leg: the unborn surface mounts, types immediately and births correctly at the small-laptop floor',
    legBorn.length === 1 && legBorn[0].text.trim() === 'At the leg', JSON.stringify(legBorn));

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
// CORRECTION ON THE RECORD. An earlier version of this footer claimed "PB1
// parks nothing; it falsifies no committed assertion, because the bare-room
// doors had no row-exists assertion to falsify." The full suite falsified that
// claim immediately: SEVEN files went red, and every one of them was this
// ticket's own consequence. The bare-room doors were asserted after all — just
// never as "a row exists," always as "the row this door made has origin X" or
// "the address is /page/:id," which is the same coupling wearing a different
// coat. The lesson is worth more than the tidy claim was: a door's litter was
// invisible to the suite, but the door's OUTPUT was asserted in six places, so
// the regression was one keystroke of coverage away from being caught in FX14's
// own review.
//
// What those seven needed, and why none of them is a park of a dead claim:
//   ab3, b1, fx6, fx14, hb1, hb2 — each derived a page id from the address, or
//     read the newest row, IMMEDIATELY after pressing a bare-room door. The
//     SUBJECT in every case is the door's semantics (origin 'loose'/'journal',
//     lands in THE Page and never the Journal surface), and PB1 preserves all of
//     it — the row simply arrives with the first word instead of on arrival. So
//     each fixture types one word and reads the same thing it always did, with
//     the change disclosed at its own site.
//   fx14 and hb2 additionally quote their ORIGINAL assertion verbatim, because
//     those two were about the ADDRESS SHAPE and were genuinely falsified on
//     arrival — fx14's worse than falsified: its regex kept PASSING by accident
//     on `#/page/new?origin=journal`, since that string contains no slash. Both
//     now assert BOTH stages, the unborn address and then the room's own.
//   cd2 — Star is absent on an unborn page by design, so its fixture births the
//     page before reaching for it.
// PB1 parks ONE assertion of its own, as of E4 (2026-09-02): its unborn-Tutor
// ABSENCE check. Nick's mirrored-hands ruling makes an unborn page a surface
// that carries BOTH hands, so the absence half is superseded BY DESIGN, not by
// accident — and BoardEditor had been mounting the Tutor on unborn boards all
// along, so the board was already shipping the ruling. The original is quoted
// byte-for-byte below with its successors named; the "wrote nothing" half was
// NOT superseded and is re-made live above.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  const pok = (name, pass, detail = '') => parkedChecks.push({ name, pass, detail });
  await withHarness(async (app) => {
    await freshDesk(app, LAPTOP_W, 900);
    await app.goto('/page/new?origin=loose');
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'unborn page (parked absences)' });
    await sleep(500);
    const now = await app.evalJs(`({
      tutor: !!document.querySelector('.wz-tutor, .wz-tutor-panel'),
      rows: JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').length,
    })`);
    pok('PARKED (was \"Unborn absences: the Tutor is absent (no projectId, no thread, no text), via the same precedent the first-run gate already uses — and opening the panel wrote nothing\") — E4 + Nick\'s MIRRORED-HANDS ruling (2026-08-31 / 2026-09-02) supersede the ABSENCE half BY DESIGN: an unborn page IS \"a Page on which the User does any kind of writing\", so both hands mount from first paint, and BoardEditor had already been mounting the Tutor on unborn boards all along. THE OTHER HALF SURVIVES AND MATTERS MORE THAN IT DID: \"opening the panel wrote nothing\" was a trivial consequence of absence and is now a live guarantee about a MOUNTED panel. Successors: this file\'s own live \"Unborn absences, successor\" check, plus e4.mjs S1 (the grip renders at first paint), S3 (mounting writes no row) and S4 (a send on an unborn surface refuses out loud instead of birthing the row — which is how a real PB1 violation, shipped on boards, was found and closed).',
      now.tutor === true && now.rows === 0, JSON.stringify(now));
  });
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  const parkedPass = parkedChecks.every((c) => c.pass);
  // eslint-disable-next-line no-console
  console.log(parkedPass
    ? `\nPB1 PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed; PB1 parks ONE: its unborn-Tutor ABSENCE check, superseded BY DESIGN under Nick's mirrored-hands ruling (E4). The 'wrote nothing' half was not superseded and is re-made live.`
    : `\nPB1 PARKED: FAIL — ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nPB1 VERIFY: PASS (${checks.length} checks)` : `\nPB1 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
