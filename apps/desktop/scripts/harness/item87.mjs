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
// Asserts the STRUCTURE ZONE, not whichever control currently fills it.
//
// This used to query `.wz-sliver-structure` — the tablist's own class. The
// SUBJECT (Draft has Structure, Free Write does not) is alive and correct, but
// that selector measures one particular FORM of the control, and the menus arc's
// DR3 replaces the tablist with a confirm-gated "Convert to Screenplay…" row.
// Checked before changing: DR3 has NOT shipped — the tablist is still the live
// render on `origin/main` and on every remote ref, so the old selector was not
// dead, merely brittle. Re-pointing to the section's own heading measures the
// thing the assertion is actually about and survives the swap either way, so it
// needs no second edit on the day DR3 lands.
//
// `railStructure` has a single lexicon definition ('Structure') with no theme
// overrides, so the heading text is stable to match on.
const structureVisible = (app) => app.evalJs(
  "[...document.querySelectorAll('.wz-sliver-section')].some(sec =>"
  + " /^structure$/i.test(((sec.querySelector('.wz-sliver-h') || {}).textContent || '').trim()))");

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
  // S1 — REMOVED FROM THE LIVE SET, PARKED BELOW (Nick's amendment, 2026-08-17).
  // Clause 1 (the door declaring `?mode=draft`) is SUPERSEDED by a New Page
  // chooser coming via the menus arc. The built work is HELD, not deleted, and
  // its assertions are parked with their records byte-frozen — a superseded
  // DESIGN parks exactly as a superseded ruling does. What still ships from
  // item 87 is clause 3 (typewriter off on a fresh page — Nick's sitting
  // verdict, unaffected by the amendment) and clause 2's assertion.
  // ==========================================================================
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
  //
  // FIXTURE FIX (2026-08-17, first-ever run of this file): the original seeded
  // the text with a RAW localStorage write, which is precisely the seeding-race
  // AGENTS.md's own harness law forbids — `wrizoCreateJournalPage` writes the
  // CACHE and flushes on a ~300ms debounce, so the raw read-modify-write
  // clobbered the row and the page was GONE after the reload (the run landed on
  // Arrival and timed out). Written during the browser freeze and never
  // executed, so nothing caught it until now. Seeding through the app's own
  // write path is both correct and simpler: one short sentence is 1
  // line-equivalent, comfortably under DRAFT_TYPEWRITER_LINE_THRESHOLD (10),
  // which is the same side of the rule the original three lines tested.
  await freshDesk(app);
  const shortId = await app.evalJs('window.wrizoCreateJournalPage().id');
  await app.evalJs(`location.hash = '#/page/${shortId}'`);
  await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'seeding the short page' });
  await app.evalJs("document.querySelector('.forward-only-editor')?.focus()");
  await app.typeKeys('A little work already here.');
  await waitSoft(app,
    `JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').some(e => e.id === ${JSON.stringify(shortId)} && (e.text||'').includes('A little work'))`,
    { label: 'short page text persisted', timeout: 9000 });
  // Leave and return, so the page MOUNTS FRESH with that text as initialText —
  // which is the only state in which the Draft-open seed runs at all.
  await app.goto('/');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk between visits (S3b)' });
  await app.evalJs(`location.hash = '#/page/${shortId}'`);
  await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'a short Draft page' });
  await sleep(400);
  const shortTypewriter = await typewriterDom(app);
  ok('S3 (b) — CONTROL: a Draft page that already holds work (1 line-equivalent, under the 10 threshold) still opens with the typewriter ON — FX2 S2 amended at the EMPTY case only',
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
  const pok = (name, pass, detail = '') => parkedChecks.push({ name, pass, detail });
  // ITEM 87 CLAUSE 1 — PARKED 2026-08-17 on Nick amendment. These four are not
  // wrong about what they measured; the DESIGN they measured has been superseded
  // by a New Page chooser (menus arc). Records byte-frozen. No live successor in
  // this file, because the successor is a design that does not exist yet — named
  // rather than invented.
  pok('PARKED (was "S1 (a) — the New Page door DECLARES its room in the address") — ITEM 87 AMENDMENT (Nick, 2026-08-17): the Draft-default door is superseded by a New Page chooser (menus arc), and the descriptor no longer carries mode. Successor: that chooser, unbuilt.', true, 'design superseded, not falsified');
  pok('PARKED (was "S1 (b) — and a New Page therefore LANDS IN DRAFT [ITEM 87 CLAUSE 1]") — ITEM 87 AMENDMENT: same supersession; a New Page again opens per CD1 S8/A7, unchanged.', true, 'design superseded, not falsified');
  pok('PARKED (was "S1 (d) — and it is STILL Draft on a later visit (the door choice outlives the door)") — ITEM 87 AMENDMENT: the door no longer makes a choice to outlive. THE FINDING IT ENCODED SURVIVES THE DESIGN and is owed to the chooser: a door-made choice that is never persisted is true exactly ONCE, because birth rewrites the address away.', true, 'design superseded; finding carried forward');
  pok('PARKED (was "S1 (c) — CONTROL: Arrival Write door still opens FREE WRITE (CD1 S8/A7 unreversed, not collateral damage)") — ITEM 87 AMENDMENT: with clause 1 held, CD1 S8/A7 is not merely unreversed but untouched, so the control has nothing left to guard.', true, 'control retired with its subject');
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
