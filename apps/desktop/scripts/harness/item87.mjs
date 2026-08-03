// ITEM 87 — THE NEW PAGE'S DEFAULTS (Nick's S3, the 2026-08-02 sitting).
// A committed CDP verification scenario, per AGENTS.md's "harness scenarios
// persist."
//
// Three clauses, and they are NOT three bug fixes — that reclassification is
// the whole reason this file exists (ledger, 2026-08-03): "Not a defect-flip: a
// REVERSAL of a ruled default. Owes a full pass WITH PARKED ASSERTIONS."
//
// CLAUSE 1 — "New Page lands in Draft." The obvious patch would flip
// PageEditor's default so a loose-origin page opens in Draft. That would
// REVERSE CD1 S8 (A7), which opens loose pages in Free Write ON PURPOSE to match
// the front-door posture — and Arrival's own Write door rides on exactly that
// rule. A New Page and the Write door produce the SAME loose-origin surface, so
// origin cannot tell them apart. Only the DOOR knows which it is.
//   So the fix is ADDITIVE: the door declares the room (`?mode=draft` on the
//   unborn descriptor). CD1 S8 stands UNREVERSED, every silent door keeps
//   today's behaviour byte-for-byte, and S1(c) below is the control that proves
//   Arrival's Write door was not collateral damage. That is how a ruled default
//   gets amended rather than flipped.
//
// CLAUSE 2 — "Free Write hides Structure presets." ASSERTED, NOT FIXED. The S0
// read found this already true: PageEditor hands the sliver `kind: 'freewrite'`
// in Free Write, and Sliver.tsx renders the Structure section only under
// `content.kind === 'draft'`. Writing a "fix" for a clause that already holds
// would have been a change with no defect under it, and a green check that
// proves nothing. S2 locks the existing behaviour in instead, so the next
// person to touch the sliver cannot quietly undo it.
//
// CLAUSE 3 — "typewriter off on fresh pages." This AMENDS FX2 S2 rather than
// discarding it. FX2 S2 ruled "Draft opens with typewriter ON unless the page
// already holds 10+ line-equivalents," on the reasoning that the line-following
// fade helps someone starting and hinders someone editing. An EMPTY page seeds 0
// line-equivalents, so it landed on the ON side by ARITHMETIC rather than by
// intent — and a page with nothing in it has no lines to follow. Only the empty
// case moves; the threshold rule is untouched wherever it still applies, which
// S3(b) asserts directly (and fx2.mjs's own ~3-line check, unchanged and still
// green, is the standing proof).
//
// PARKS: none owed, and that is a finding rather than a shortcut — see this
// file's PARKED section for the four fresh-page typewriter records that were
// checked one by one and survive, and why.
//
// Fixtures (freshDesk / activeModeTab / typewriterDom) copied verbatim from
// fx2.mjs per the standing instruction not to re-derive fixtures.
// Run: node scripts/harness/item87.mjs  (from apps/desktop, dist-web freshly built)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const freshDesk = async (app, width = 1400, height = 900) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
};

const activeModeTab = (app) => app.evalJs("document.querySelector('.desk-mode-tab.active')?.textContent");
const typewriterDom = (app) => app.evalJs("document.querySelector('.mode-scroll')?.dataset.typewriter");
const structureVisible = (app) => app.evalJs("!!document.querySelector('.wz-sliver-structure')");

const waitSoft = async (app, expr, opts) => {
  try { await app.waitFor(expr, opts); } catch { /* the assertion reports the truth */ }
};

const openCascadePage = async (app) => {
  await app.waitFor("document.querySelectorAll('.wz-strip-item').length === 8", { label: 'cascade strip' });
  if (!(await app.evalJs("!!document.querySelector('.wz-pageface-title')"))) {
    await app.evalJs("[...document.querySelectorAll('.wz-strip-item')][1].click()");
    await app.waitFor("!!document.querySelector('.wz-pageface-title')", { label: 'Page category open' });
  }
};

await withHarness(async (app) => {
  // ==========================================================================
  // S1 — CLAUSE 1: New Page lands in Draft, and Arrival's Write door does not.
  // ==========================================================================
  await freshDesk(app);
  // Reach the cascade's own New Page door from a real page, the way a writer
  // does — not by typing the address, so the DOOR is what is under test.
  const seedId = await app.evalJs('window.wrizoCreateJournalPage().id');
  await app.evalJs(`location.hash = '#/page/${seedId}'`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'a page to start from' });
  await openCascadePage(app);
  await app.evalJs(
    "[...document.querySelectorAll('.wz-cascade-action-door')].find(b => /new page/i.test(b.textContent)).click()");
  await waitSoft(app, "location.hash.includes('/page/new')", { label: 'New Page door -> unborn surface' });
  const newPageHash = await app.evalJs('location.hash');
  ok('S1 (a) — the New Page door DECLARES its room in the address',
    /\/page\/new/.test(newPageHash) && /mode=draft/.test(newPageHash), `hash=${newPageHash}`);

  await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'unborn page surface' });
  await sleep(300);
  const newPageMode = await activeModeTab(app);
  ok('S1 (b) — and a New Page therefore LANDS IN DRAFT [ITEM 87 CLAUSE 1]',
    newPageMode === 'Draft', `activeMode=${String(newPageMode)}`);

  // THE DOOR'S CHOICE MUST OUTLIVE THE DOOR. Found by reading, not by running —
  // this lane was inside a browser freeze when it wrote the fix, so the code was
  // reviewed instead. Without persistence, "New Page lands in Draft" is true
  // exactly ONCE: the descriptor lives in the address, birth rewrites the
  // address to /page/:id, the row is loose-origin, and the NEXT visit falls
  // through to CD1 S8's rule and reopens the writer's Draft page in Free Write.
  await app.evalJs("document.querySelector('.forward-only-editor')?.focus()");
  await app.typeKeys('Draft door persistence.');
  await waitSoft(app,
    "JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').some(e => (e.text||'').trim() === 'Draft door persistence.')",
    { label: 'page born from the New Page door', timeout: 9000 });
  const bornPageId = await app.evalJs(
    "(JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]')"
    + ".find(e => (e.text||'').trim() === 'Draft door persistence.') || {}).id || ''");
  await app.goto('/');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk between visits' });
  await app.evalJs(`location.hash = '#/page/${bornPageId}'`);
  await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'revisiting the born page' });
  await sleep(300);
  const revisitMode = await activeModeTab(app);
  ok('S1 (d) — and it is STILL Draft on a later visit (the door\'s choice outlives the door)',
    !!bornPageId && revisitMode === 'Draft', `bornId=${bornPageId} activeMode=${String(revisitMode)}`);

  // THE CONTROL — CD1 S8 (A7) is unreversed. Arrival's Write door opens the
  // same loose-origin surface and must still open in Free Write; if this ever
  // goes red, the amendment has become the flip it was written to avoid.
  await freshDesk(app);
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Arrival' });
  await app.evalJs(
    "[...document.querySelectorAll('button, a')].find(b => b.textContent.trim() === 'Write')?.click()");
  await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'Write door surface' });
  await sleep(300);
  const writeMode = await activeModeTab(app);
  const writeHash = await app.evalJs('location.hash');
  ok('S1 (c) — CONTROL: Arrival\'s Write door still opens FREE WRITE (CD1 S8/A7 unreversed, not collateral damage)',
    writeMode === 'Free Write' && !/mode=/.test(writeHash), `activeMode=${String(writeMode)} hash=${writeHash}`);

  // ==========================================================================
  // S2 — CLAUSE 2: Free Write hides the Structure presets. Already true; locked
  // in rather than "fixed", so a later sliver change cannot quietly undo it.
  // ==========================================================================
  const structureInFreeWrite = await structureVisible(app);
  ok('S2 (a) — Free Write shows NO Structure presets [CLAUSE 2 — already held; asserted, not fixed]',
    structureInFreeWrite === false, `structureSectionPresent=${structureInFreeWrite}`);

  // And the other half, so the check cannot pass by the section being gone
  // everywhere: Draft still HAS it.
  await freshDesk(app);
  const draftSeed = await app.evalJs('window.wrizoCreateJournalPage().id');
  await app.evalJs(`location.hash = '#/page/${draftSeed}'`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'journal-origin page (Draft)' });
  await sleep(300);
  const draftMode = await activeModeTab(app);
  const structureInDraft = await structureVisible(app);
  ok('S2 (b) — and Draft still HAS them (the presets were hidden, not deleted)',
    draftMode === 'Draft' && structureInDraft === true,
    `activeMode=${String(draftMode)} structureSectionPresent=${structureInDraft}`);

  // ==========================================================================
  // S3 — CLAUSE 3: a FRESH Draft page opens with the typewriter OFF, and a page
  // that already holds work below the threshold still opens ON (FX2 S2 amended
  // at one point, not discarded).
  // ==========================================================================
  const freshTypewriter = await typewriterDom(app);
  ok('S3 (a) — a FRESH Draft page opens with the typewriter OFF [ITEM 87 CLAUSE 3]',
    freshTypewriter === 'false', `data-typewriter=${String(freshTypewriter)}`);

  // A page that already holds a little work: FX2 S2's threshold rule, untouched.
  await freshDesk(app);
  const shortId = await app.evalJs('window.wrizoCreateJournalPage().id');
  await app.evalJs(
    `(() => { const k = 'writer-studio-journal-entries';`
    + ` const rows = JSON.parse(localStorage.getItem(k) || '[]');`
    + ` const r = rows.find(e => e.id === ${JSON.stringify(shortId)});`
    + ` if (r) { r.text = 'one\\ntwo\\nthree'; localStorage.setItem(k, JSON.stringify(rows)); } })()`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after seeding text' });
  await app.evalJs(`location.hash = '#/page/${shortId}'`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'a ~3-line Draft page' });
  await sleep(300);
  const shortTypewriter = await typewriterDom(app);
  ok('S3 (b) — CONTROL: a ~3-line Draft page still opens with the typewriter ON (FX2 S2 amended at the empty case only)',
    shortTypewriter === 'true', `data-typewriter=${String(shortTypewriter)}`);
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// ---------------------------------------------------------------------------
// PARKED — ITEM 87 PARKS NOTHING, and the census is the point.
//
// A reversal of a ruled default normally owes parks, so every committed
// "fresh page + typewriter" record was checked one by one rather than assumed.
// All four survive, for two structural reasons:
//
//   (i) FREE WRITE NEVER SEEDS. PageEditor calls seedTypewriterDefault ONLY
//       when the opening mode is Draft, so a fresh Free Write page takes the
//       global default (true) and is untouched by clause 3. That covers
//       fx2.mjs ("a fresh Free Write page opens with typewriter ON", both the
//       DOM and stored-setting halves), hb2.mjs ("Open with NO last surface
//       degrades to a fresh Free Write page ... typewriter on"), and b1.mjs's
//       cross-reference comment.
//   (ii) fx1.mjs's "a fresh prose page has typewriter ON by default" runs on a
//       MANUSCRIPT chapter (freshProsePage → /project/new → book → Start
//       writing), and a manuscript opens in Free Write by the pageType branch —
//       so it is case (i) as well.
//
// And clause 1 parks nothing BECAUSE it is additive: CD1 S8's rule is not
// touched, so ab3.mjs/cd1.mjs's "origin:'loose' opens in Free Write by default"
// records stay literally true — S1(c) above re-proves that through Arrival's own
// door. If this had been built as the flip it first looked like, all of those
// would have needed parking; the additive shape is what makes the park list
// empty, and the empty list is evidence the shape was right.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  // eslint-disable-next-line no-console
  console.log('\nITEM87 PARKED: PASS (0 checks) — HARNESS_PARKED=1 armed; item 87 parks nothing: Free Write never seeds the typewriter (so every "fresh page ON" record is untouched), and clause 1 is additive (so CD1 S8/A7 stands unreversed). The empty list is the evidence, not an omission.');
}

const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nITEM87 VERIFY: PASS (${checks.length} checks)`
  : `\nITEM87 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
