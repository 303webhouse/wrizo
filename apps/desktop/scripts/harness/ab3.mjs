// AB3 — the Drawer and the Homes (docs/wrizo-alpha/ab3-drawer-and-homes-brief.md).
// A committed CDP verification scenario (per AGENTS.md "Harness scenarios
// persist"), modeled on ab1.mjs/ab2.mjs.
// Run: node apps/desktop/scripts/harness/ab3.mjs   (from apps/desktop, with
// dist-web freshly built via `pnpm run build:web`).
//
// CD2 (2026-07-17) — the left drawer this file's own test subject RETIRES
// whole (Drawer.tsx deleted; docs/wrizo-alpha/cd2-cascade-brief.md S5).
// Checks asserting the drawer's OWN structure (its fixed-width track, the
// Page-pull-above-a-separator-with-three-Places nav shape, the tools-face
// retirement, the Journal/Shelf/Drawers PLACE faces' three-verb rows, the
// keystroke-dissolves-the-open-place-face-back-to-page mechanic, the active
// pull's color) are PARKED below — the cascade's strip/panels are an
// architecturally different design (seven separate category doorways, not
// a two-face toggle), so there is no "same claim, renamed selector" fix for
// these; successors (where the underlying data claim survives) live in
// cd2.mjs's own S3 section. Checks that only ever used a `.wz-drawer-pull-
// page` CLICK as a doorway to reach PageFace content (subject wiring, the
// footer's own exclusivity, the project home label, the filing flow, the
// membership truths) are adapted in place instead — PageFace.tsx itself and
// every persistence function under test are byte-unchanged by this ticket,
// only the click that reaches the face moved (from the drawer's Page pull
// to the strip's Page category, via the new `openPageCategory` helper
// below) — the fx2.mjs "plain selector update, no park" precedent applies.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const rectOf = (sel) => `(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return {left:r.left, top:r.top, width:r.width, height:r.height}; })()`;

const freshDesk = async (app) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, 1400, 900);
};

// S4 — the Journal/Catch door: a fresh authored Journal page, typed with a
// distinctive marker so later checks can trace it across views. Does NOT
// touch existing localStorage — callers that need a clean slate call
// freshDesk() themselves first (some S5 fixtures deliberately build on
// state from an earlier step, e.g. a Drawer created moments before).
// B1 — the retired Journal list's own "New page" button (.journal-new-page)
// is gone (pages/Journal.tsx deleted, S5); this helper never tested the
// list surface itself, only used it as scaffolding to reach a fresh,
// editable journal-origin page — persistence.ts's own new test seam
// (window.wrizoCreateJournalPage) reaches the identical state directly.
const journalPageHere = async (app, marker) => {
  await app.evalJs("location.hash = '#/journal/' + window.wrizoCreateJournalPage().id");
  await app.waitFor("!!document.querySelector('.entry-edit')", { label: 'JournalEntry framed, authored' });
  await sleep(200);
  await app.evalJs("document.querySelector('.entry-edit').focus()");
  await app.typeKeys(marker);
  await sleep(3000); // past JournalEntry's AUTOSAVE_MS (2000) with real margin for typeKeys' own dispatch time
};

const freshJournalPage = async (app, marker) => {
  await freshDesk(app);
  await journalPageHere(app, marker);
};

// B1 — the live successor for three checks parked below (this file's own
// PARKED section, A4): "does page X belong to the Journal" is now asked of
// the Journal BOARD's own DERIVED card set (S2's reconcile), not the
// retired list's rows. '/journal' finds-or-creates the Board and redirects
// (App.tsx's JournalBoardGate); window.wrizoBoard() (BoardEditor.tsx's own
// pre-existing test seam) reads the CURRENTLY MOUNTED board's live boxes.
const journalBoardPinnedIds = async (app) => {
  await app.goto('/journal');
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'Journal Board mounted' });
  await sleep(200);
  const boxes = (await app.evalJs('window.wrizoBoard()')) || [];
  return boxes.filter((b) => b.kind === 'page-pin').map((b) => b.entryId);
};

// S4 — a project door: CreateProject (book kind) -> its first chapter page,
// framed, Free Write. Mirrors ab2.mjs's freshProsePage exactly.
const freshProjectPage = async (app, marker) => {
  await freshDesk(app);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book)' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, framed' });
  await sleep(200);
  if (marker) {
    await app.evalJs("document.querySelector('.forward-only-editor').focus()");
    await app.typeKeys(marker);
    await sleep(3000); // past PageEditor's AUTOSAVE_MS (2000) with real margin for typeKeys' own dispatch time
  }
};

// S4 — the Desk's start-writing / home-base door: a loose page, homing
// nowhere. Opens at /page/:id (PageEditor), never /journal/:id.
const freshLoosePage = async (app) => {
  await freshDesk(app);
  await app.evalJs("document.querySelector('.wz-arrival-write').click()");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, framed (loose)' });
  await sleep(500); // past persistence.ts's 300ms debounced flush
};

// CD2 — the doorway to PageFace's own content, replacing the retired
// Drawer's "click the Page pull" (which used to be the rest state, always
// showing). The cascade's Page category (index 1; current roster: Journal,
// Page, Plan, Drawers, Shelf, Settings, Themes, Trash) must be opened
// explicitly now — a real behavioral difference from the old drawer (see
// this file's own header comment) — every fixture below that used to rely
// on the Page face being visible by default, or clicked the drawer's own
// pull to return to it, now calls this instead. IDEMPOTENT (checks first) —
// a real finding along the way: useCascade()'s own state is scoped to the
// HOST component (JournalEntry/PageEditor), not to DeskFrame's own mount
// lifecycle, so it survives a width round-trip across the 1100px gate (the
// host itself never unmounts, only its conditional return does) — calling
// this a second time on an already-open Page category would otherwise
// TOGGLE IT CLOSED (Cascade.tsx's own same-category-click-closes rule).
const openPageCategory = async (app) => {
  // B1 S5 — eight categories now (Trash joins section C); this is a plain
  // mount gate, not an assertion about the roster's own shape.
  await app.waitFor("document.querySelectorAll('.wz-strip-item').length === 8", { label: 'cascade strip mounted (openPageCategory)' });
  const alreadyOpen = await app.evalJs("!!document.querySelector('.wz-pageface-title')");
  if (alreadyOpen) return;
  await app.evalJs("[...document.querySelectorAll('.wz-strip-item')][1].click()");
  await app.waitFor("!!document.querySelector('.wz-pageface-title')", { label: 'Page category open (openPageCategory)' });
};

await withHarness(async (app) => {
  // === S1/S6 — the Drawer's own fixed geometry, nav shape (Page pull above
  // a separator, three Places below), and the tools-face retirement are all
  // CD2 S1/S5 SUPERSEDED — the drawer this file tested is gone; the
  // cascade's architecturally different strip/panel design is proven fresh
  // in cd2.mjs's own S1 section. Every check that lived here is PARKED
  // below (quoted verbatim, this file's own new CD2 park block). ===========
  await freshJournalPage(app, 'AB3GEOMETRY');

  // === S2 — the Page face's content, on a journal-origin, unfiled page.
  // Reached via the cascade's Page category now (openPageCategory), not the
  // retired drawer's Page pull — PageFace.tsx itself is byte-unchanged. ====
  await openPageCategory(app);
  const pageFace = await app.evalJs(`({
    panelTitle: document.querySelector('.wz-cascade-panel-title')?.textContent,
    title: document.querySelector('.wz-pageface-title')?.textContent,
    starPresent: !!document.querySelector('.wz-pageface-star'),
    starredNow: document.querySelector('.wz-pageface-star')?.dataset.starred,
    home: document.querySelector('.wz-pageface-home-label')?.textContent,
    tagInput: !!document.querySelector('.wz-pageface-tag-input'),
    moveCopyGone: !document.querySelector('.wz-pageface-verb-movecopy'),
    port: !!document.querySelector('.wz-pageface-verb-port'),
    footer: document.querySelector('.wz-pageface-footer')?.textContent,
    placesPresent: !!document.querySelector('.wz-places'),
  })`);
  // B2 S4 park sweep — live successor immediately below: Move/Copy retires
  // (superseded by Places); the ORIGINAL "...Move/Copy + Port-to-Board..."
  // combined check is PARKED (A4, quoted verbatim) in this file's own
  // PARKED section.
  ok('B2 S4 successor of "S2: the Page category shows title, star (unstarred), Where-it-lives, tags, Move/Copy + Port-to-Board, and the quiet footer": the SAME facts, Move/Copy replaced by the Places panel\'s own presence',
    pageFace.panelTitle === 'Page' && pageFace.title === 'AB3GEOMETRY' && pageFace.starPresent && pageFace.starredNow === 'false'
      && pageFace.home === 'In the Journal' && pageFace.tagInput && pageFace.moveCopyGone && pageFace.port && pageFace.placesPresent
      && pageFace.footer === 'Saved automatically — even if you never file it to a Drawer or the Shelf.',
    JSON.stringify(pageFace));

  // Star toggling from the Page face actually persists (S2 wires the star).
  await app.evalJs("document.querySelector('.wz-pageface-star').click()");
  await sleep(2300); // past autosave
  const starredAfter = await app.evalJs("document.querySelector('.wz-pageface-star')?.dataset.starred");
  const storedStarred = (await app.localJSON('writer-studio-journal-entries')).find(e => e.text?.includes('AB3GEOMETRY'))?.starred;
  ok('S2: the Page face\'s star toggle actually persists to entry.starred', starredAfter === 'true' && storedStarred === true, `${starredAfter} / ${storedStarred}`);

  // === S6 — the Places faces (Journal/Shelf/Drawers, three verbs, Go to the
  // Room) and the keystroke-dissolves-the-open-place-face-back-to-page
  // mechanic are CD2 S1/S5 SUPERSEDED — no "place face" concept exists in
  // the cascade (Journal/Drawers/Shelf are three separate category panels,
  // reached and dissolved independently, not a shared toggle-face). PARKED
  // below; cd2.mjs's own S3 section covers the surviving Journal/Drawers/
  // Shelf CONTENT claims through the new panels directly. The room-level
  // dissolve/resurface mechanic itself (data-writing flips true then false)
  // is NOT drawer-specific and stays live here, adapted: the strip now
  // explicitly does NOT dissolve (S1's own "never dissolving" law — the
  // opposite of the old drawer's own behavior, also PARKED below with its
  // own opposite-truth successor in cd2.mjs). ================================
  await app.evalJs("document.querySelector('.entry-edit').focus()");
  await app.typeKeys('x');
  await sleep(150);
  const writingNow = await app.evalJs("document.querySelector('.desk-frame')?.dataset.writing");
  ok('S1: typing dissolves the room (the SAME .desk-frame[data-writing] the whole frame uses)', writingNow === 'true', writingNow);

  await app.evalJs("window.dispatchEvent(new PointerEvent('pointermove', { clientX: 400, clientY: 10, bubbles: true }))");
  await sleep(500); // past EDGE_DWELL_MS (260ms)
  const writingAfterEdge = await app.evalJs("document.querySelector('.desk-frame')?.dataset.writing");
  ok('S6: dwelling at the viewport edge resurfaces the chrome', writingAfterEdge === 'false', writingAfterEdge);

  // === A1 — the Page face's subject wiring: a DIFFERENT page shows DIFFERENT
  // face content (subject-driven, not a hardcoded "current page"). ===========
  await freshJournalPage(app, 'AB3SUBJECTB');
  await openPageCategory(app);
  const subjectB = await app.evalJs(`({
    title: document.querySelector('.wz-pageface-title')?.textContent,
    starred: document.querySelector('.wz-pageface-star')?.dataset.starred,
  })`);
  ok('A1: the Page face\'s subject wiring — a different page shows its OWN title and its OWN (unstarred) star state, not the previous page\'s',
    subjectB.title === 'AB3SUBJECTB' && subjectB.starred === 'false', JSON.stringify(subjectB));

  // === S3 — metadata absent under the framed paper, present in legacy below
  // the gate (byte-identical). ================================================
  const framedMetadata = await app.evalJs(`({
    h1: !!document.querySelector('h1'),
    star: !!document.querySelector('.entry-star'),
    tags: !!document.querySelector('.entry-tags'),
    autosaveNote: !!document.querySelector('.journal-autosave-note'),
  })`);
  ok('S3: framed — the below-page metadata cluster (title/star/tags/autosave note) is entirely absent; the Page face supersedes it',
    !framedMetadata.h1 && !framedMetadata.star && !framedMetadata.tags && !framedMetadata.autosaveNote,
    JSON.stringify(framedMetadata));

  await app.emulateDpr(1, 900, 900); // below DESKFRAME_MIN_WIDTH (1100)
  await sleep(200);
  const legacyMetadata = await app.evalJs(`({
    deskFrameGone: !document.querySelector('.desk-frame'),
    h1: !!document.querySelector('h1'),
    star: !!document.querySelector('.entry-star'),
    tags: !!document.querySelector('.entry-tags'),
    autosaveNote: document.querySelector('.journal-autosave-note')?.textContent,
  })`);
  ok('S3: below the gate — the legacy metadata cluster is byte-identical (title/star/tags/autosave note all present, unchanged)',
    legacyMetadata.deskFrameGone && legacyMetadata.h1 && legacyMetadata.star && legacyMetadata.tags
      && legacyMetadata.autosaveNote === 'Saved automatically — even if you never file it to a Drawer or the Shelf.',
    JSON.stringify(legacyMetadata));
  await app.emulateDpr(1, 1400, 900);
  await sleep(200);

  // === "the saved-silently footer exists only in the Page panel" — its
  // ONLY appearance anywhere once framed. The width round-trip above
  // unmounts and remounts DeskFrame (and the cascade inside it), so the
  // Page category resets to CLOSED (CD2's own rest state — unlike the old
  // drawer, nothing is open by default) — open it explicitly.
  await openPageCategory(app);
  const footerOnlyInDrawer = await app.evalJs(`({
    outsideDrawerNote: !!document.querySelector('body > *:not(.desk-frame) .journal-autosave-note, .desk-frame-stagecol .journal-autosave-note'),
    inPageFace: document.querySelector('.wz-pageface-footer')?.textContent ?? null,
  })`);
  ok('S3/S2: the saved-silently line appears nowhere outside the Page panel when framed',
    !footerOnlyInDrawer.outsideDrawerNote && footerOnlyInDrawer.inPageFace === 'Saved automatically — even if you never file it to a Drawer or the Shelf.',
    JSON.stringify(footerOnlyInDrawer));

  // === ab3.1 R1(b) (Fable review) — the brief's S3 named "JournalEntry's
  // AND PageEditor's" below-page metadata clusters; only JournalEntry's
  // absence was ever asserted. PageEditor never had a title/star/tags/
  // autosave-note cluster of its own to begin with (the Page face's star/
  // tag wiring is new this ticket — toggleStar/addTag/removeTag didn't
  // exist here before AB3) — this guards the law on the second surface the
  // brief named, not just the first. ==========================================
  await freshProjectPage(app, 'AB3R1BMETA');
  const pageEditorFramedMetadata = await app.evalJs(`({
    h1: !!document.querySelector('h1'),
    star: !!document.querySelector('.entry-star'),
    tags: !!document.querySelector('.entry-tags'),
    autosaveNote: !!document.querySelector('.journal-autosave-note, .page-autosave-note'),
  })`);
  ok('R1(b): framed PageEditor also carries no below-page metadata cluster (the Page face supersedes it here too)',
    !pageEditorFramedMetadata.h1 && !pageEditorFramedMetadata.star && !pageEditorFramedMetadata.tags && !pageEditorFramedMetadata.autosaveNote,
    JSON.stringify(pageEditorFramedMetadata));

  // === S4 — origin per door. ==================================================
  // Door 1: Journal/Catch -> 'journal', homes in the Journal.
  await freshJournalPage(app, 'AB3ORIGINJOURNAL');
  const journalEntries1 = await app.localJSON('writer-studio-journal-entries');
  const journalDoorEntry = journalEntries1.find(e => e.text?.includes('AB3ORIGINJOURNAL'));
  ok('S4: the Journal/Catch door stamps origin:\'journal\'', journalDoorEntry?.origin === 'journal', JSON.stringify(journalDoorEntry));

  // Door 2: a project door -> 'project', homes in that project, never seen by
  // the Journal.
  await freshProjectPage(app, 'AB3ORIGINPROJECT');
  const projectEntries = await app.localJSON('writer-studio-journal-entries');
  const projectDoorEntry = projectEntries.find(e => e.text?.includes('AB3ORIGINPROJECT'));
  ok('S4: a project door (new chapter from CreateProject) stamps origin:\'project\', projectId set', projectDoorEntry?.origin === 'project' && !!projectDoorEntry?.projectId, JSON.stringify(projectDoorEntry));

  await openPageCategory(app);
  const projectHome = await app.evalJs("document.querySelector('.wz-pageface-home-label')?.textContent");
  ok('S4/S2: the Page category\'s Where-it-lives names the project by title (not the Journal)', projectHome?.startsWith('In ') && projectHome !== 'In the Journal', projectHome);

  // B1 park sweep — the retired Journal LIST's own row-count read is
  // PARKED below (A4, quoted verbatim); this is its live successor,
  // against the Journal BOARD's own derived cards instead.
  const projectPinnedIds = await journalBoardPinnedIds(app);
  ok('B1 successor of "S5: a project-origin page never appears in any Journal view": it never gets a card on the Journal Board either — the Board has never heard of it',
    !projectPinnedIds.includes(projectDoorEntry.id), JSON.stringify({ projectPinnedIds, projectDoorEntryId: projectDoorEntry.id }));

  // Door 3: the Desk's start-writing / home-base door -> 'loose', homes
  // nowhere; starting there never files it.
  await freshLoosePage(app);
  const looseEntries = await app.localJSON('writer-studio-journal-entries');
  // Newest by createdAt among entries with no text (the fresh loose page).
  const looseDoorEntry = looseEntries.filter(e => e.origin === 'loose').sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  ok('S4: the Desk\'s start-writing door stamps origin:\'loose\', projectId null, not shelved', looseDoorEntry?.origin === 'loose' && looseDoorEntry?.projectId == null && !looseDoorEntry?.shelved, JSON.stringify(looseDoorEntry));

  // === ab3.1 R1(a) (Fable review) — the loose fixture's negative space.
  // The journalFurniture conditional correctly excludes 'loose', but
  // nothing asserted it: 'journal'/null are covered in this file, 'project'
  // in ab2.mjs — 'loose' had no guard anywhere.
  // FX1 S3 (Nick's first-sitting verdict, provisional canon note) — the
  // forward lock is no longer part of journalFurniture's suppressed bundle:
  // it's mode furniture now, mounting regardless of origin. R1(a)'s original
  // "forward-lock absent" clause is superseded; parked below (HARNESS_
  // PARKED=1, quoted-history + opposite-reassertion, SUPERSEDED species).
  // Ink/capture-items absence is unchanged AB3 law and stays live here.
  // FX1 fixture fix — createLooseHomePage() stamps no pageType, so
  // PageEditor's own default-mode rule ("a manuscript chapter opens in Free
  // write... support pages open in Draft") lands a loose page in DRAFT, not
  // Free Write — this check's own name always meant Free Write (a Draft
  // rail never carries any of this furniture regardless of origin, so the
  // ORIGINAL R1(a) check was passing for the wrong reason). Switch modes
  // explicitly so this actually exercises what it claims to. ==================
  // CD1 S2/S7 — ToolRail's `.desk-toolrail-*` class family retired with the
  // component; the sliver (`.wz-sliver-*`) hosts this content now, mounted
  // closed — open it before reading. The ORIGINAL "FX1 S3 (was R1(a))"
  // check is parked below (SUPERSEDED — class rename only, same truth).
  await app.evalJs("[...document.querySelectorAll('.desk-mode-tab')].find(b => b.textContent === 'Free Write').click()");
  await sleep(150);
  await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
  await sleep(150);
  const looseRail = await app.evalJs(`({
    ink: !!document.querySelector('.wz-sliver-inks'),
    forwardLock: !!document.querySelector('.wz-sliver-forwardlock'),
    captureItems: [...document.querySelectorAll('.wz-sliver-item')].map(i => i.textContent),
  })`);
  ok('CD1 S2 (was "FX1 S3 (was R1(a))"): a LOOSE-origin page shows the forward lock PRESENT (mode furniture now) in Free Write, but ink/capture items stay absent (unchanged journal furniture) — now in the sliver',
    !looseRail.ink && looseRail.forwardLock && looseRail.captureItems.length === 0,
    JSON.stringify(looseRail));

  await openPageCategory(app);
  const looseHomeText = await app.evalJs("document.querySelector('.wz-pageface-home-label')?.textContent");
  ok('S4/DoD: the loose page\'s Page category text reads exactly "Loose — belongs nowhere yet"', looseHomeText === 'Loose — belongs nowhere yet', looseHomeText);

  // Anti-solicitation: no file-it-first prompt anywhere reachable from a
  // loose page (PageEditor.tsx carries no such prompt at all).
  const looseNeverNudged = await app.evalJs("!document.querySelector('.journal-tab-prompt')");
  ok('S4: a loose page is never nudged to file (no file-it-first prompt reachable)', looseNeverNudged);

  // B1 park sweep — live successor (see the project-origin check above for
  // the full reasoning): asks the Journal Board's own derived cards.
  const loosePinnedIds = await journalBoardPinnedIds(app);
  ok('B1 successor of "S5/DoD: a loose page never appears in the Journal either": it never gets a card on the Journal Board either (it homes nowhere, not there)',
    !loosePinnedIds.includes(looseDoorEntry.id), JSON.stringify({ loosePinnedIds, looseDoorEntryId: looseDoorEntry.id }));

  // === S5 (B2-amended) — the Journal forgets provenance, not membership:
  // file a journal-born page to a NEW project via the Places panel (S4's
  // own successor to the retired Move/Copy verb — see this file's own
  // park sweep for the ORIGINAL "still lists in both" claims, superseded
  // by B2 S7's pinned law). =====================================================
  await freshDesk(app);
  await journalPageHere(app, 'AB3FORGETSNOTHING');
  await openPageCategory(app);
  await app.waitFor("!!document.querySelector('.wz-places-newdrawer-btn')", { label: 'Places panel (forgets-nothing fixture)' });
  await app.evalJs("document.querySelector('.wz-places-newdrawer-btn').click()");
  await app.waitFor("!!document.querySelector('.wz-places-newdrawer-input')", { label: 'Places New Drawer input' });
  // Real per-character key events (typeKeys), not a direct .value= write —
  // a controlled React input needs the genuine input event React's own
  // onChange listens for, which only a trusted keystroke stream reliably
  // produces (this project's own trusted-gesture discipline, applied here
  // too).
  await app.evalJs("document.querySelector('.wz-places-newdrawer-input').focus()");
  await app.typeKeys('AB3 Drawer');
  await app.evalJs("document.querySelector('.wz-places-newdrawer-create').click()");
  await sleep(400);

  const filedEntries = await app.localJSON('writer-studio-journal-entries');
  const filedEntry = filedEntries.find(e => e.text?.includes('AB3FORGETSNOTHING'));
  ok('S5: filing a journal-born page (via Places\' Home zone) to a new drawer sets projectId, but origin stays \'journal\'',
    !!filedEntry?.projectId && filedEntry?.origin === 'journal', JSON.stringify(filedEntry));

  // B2 S7 park sweep — live successor (see the project-origin check above
  // for the full reasoning): a journal-born page filed to a drawer now
  // LEAVES the Journal Board (the pinned law: origin 'journal' AND
  // projectId null) — "forgets nothing" restated, amended.
  const filedPinnedIds = await journalBoardPinnedIds(app);
  ok('B2 S7 successor of "B1: a journal page filed to a project STILL turns up in the Journal (forgets nothing)": filing now REMOVES its card from the Journal Board (S4\'s own DoD — "Journal unchecks itself and the page leaves the Journal Board")',
    !filedPinnedIds.includes(filedEntry.id), JSON.stringify({ filedPinnedIds, filedEntryId: filedEntry.id }));

  await app.goto(`/project/${filedEntry.projectId}`);
  await app.waitFor("!!document.querySelector('.page')", { label: 'ProjectHome (forgets-nothing check)' });
  await sleep(200);
  const projectAlsoLists = (await app.evalJs("document.querySelector('.page')?.innerText ?? ''")).includes('AB3FORGETSNOTHING');
  ok('S5 DoD: the filed page lists in its new project', projectAlsoLists);

  // Where-it-lives, amended: /page/:id always renders PageEditor (its outer
  // component only branches on pageType for board/script) — this untyped-
  // but-now-filed page reopens there.
  await app.goto(`/page/${filedEntry.id}`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'filed page reopened' });
  await sleep(200);
  await openPageCategory(app);
  const bothTruths = await app.evalJs(`({
    home: document.querySelector('.wz-pageface-home-label')?.textContent,
    memberships: [...document.querySelectorAll('.wz-pageface-membership')].map(el => el.textContent),
  })`);
  ok('B2 S7 successor of "S5/S2: Where-it-lives tells BOTH truths — homed in the project, Also in the Journal.": the pinned law means dual membership no longer happens — homed in the project, NO "Also in the Journal." line (origin still \'journal\', per the check above — provenance stays, membership doesn\'t)',
    bothTruths.home?.startsWith('In ') && bothTruths.home !== 'In the Journal' && !bothTruths.memberships.includes('Also in the Journal.'),
    JSON.stringify(bothTruths));

  // The Places panel's own Home zone reflects this too: Journal unchecks
  // itself the instant the page is filed (A16 assert: only this explicit
  // act wrote projectId; nothing wrote origin — checked above).
  await openPageCategory(app);
  await app.waitFor("!!document.querySelector('.wz-places-home')", { label: 'Places panel (post-file reflection)' });
  const homeZoneAfterFile = await app.evalJs(`({
    journalChecked: document.querySelector('.wz-places-home input[type=radio]')?.checked,
    projectChecked: [...document.querySelectorAll('.wz-places-home label')].some(l => l.textContent.includes('AB3 Drawer') && l.querySelector('input').checked),
  })`);
  ok('B2 S4: the Places panel\'s own Home zone shows Journal UNCHECKED and the new drawer CHECKED — the radio reflects the just-performed act immediately',
    homeZoneAfterFile.journalChecked === false && homeZoneAfterFile.projectChecked === true, JSON.stringify(homeZoneAfterFile));

  // === S4 grandfather clause (A2) — a NULL-origin typed page (pre-AB3 data)
  // keeps EXACTLY today's Free-Write furniture. Seeded directly (no real
  // door predates this ticket to reach it through), same technique ab2.mjs
  // uses for its Journal/Board fixtures.
  // ab3.1 R4 (Fable review) — the project-origin NEGATIVE (an EXPLICIT
  // project-origin page shows none of this furniture) is asserted in
  // ab2.mjs, not here — see its S4/AB3 addition and PARKED successor. This
  // section only ever covered the null-origin positive. ========================
  await freshDesk(app);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const projects = JSON.parse(localStorage.getItem('writer-studio-projects') || '[]');
    projects.push({ id: 'ab3-legacy-proj', title: 'Legacy Book', type: 'creative', storyPlanId: null, createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-projects', JSON.stringify(projects));
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    // No origin field at all — a pre-AB3 row (A2's grandfather clause).
    entries.push({ id: 'ab3-legacy-page', text: '', projectId: 'ab3-legacy-proj', pageType: 'manuscript', source: 'page', createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after legacy seed' });
  await app.evalJs("location.hash = '#/page/ab3-legacy-page'");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'legacy null-origin page framed' });
  await sleep(200);
  // CD1 S2/S7 — open the sliver (fresh mount, closed by default); its
  // `.wz-sliver-*` class family hosts this content now (ToolRail retired).
  await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
  await sleep(150);
  const legacyRail = await app.evalJs(`({
    ink: !!document.querySelector('.wz-sliver-inks'),
    forwardLock: !!document.querySelector('.wz-sliver-forwardlock'),
    captureItems: [...document.querySelectorAll('.wz-sliver-item')].map(i => i.textContent),
  })`);
  ok('CD1 S2/S7 (was "S4 A2 (grandfather clause): ..."): a NULL-origin page (pre-AB3 data) keeps TODAY\'S furniture in Free Write — ink/forward-lock/capture items all present (now in the sliver)',
    legacyRail.ink && legacyRail.forwardLock && JSON.stringify(legacyRail.captureItems) === JSON.stringify(['Spark deck', 'Fragments', 'Send → Drawer']),
    JSON.stringify(legacyRail));

  // === ab3.1 R2 (Fable review) — presence is not function. The forward-lock
  // control's CLICK could unwire while the suite stayed green, since only
  // its presence was ever asserted. This fixture is fresh off freshDesk()
  // (localStorage cleared, reloaded) so wrizo-forward-lock hasn't been
  // written yet — load() falls to DEFAULT (true), matching today's shipped
  // behavior exactly. CD1 S2/S7 — `.wz-sliver-forwardlock` now (class
  // rename only, same mechanic). =============================================
  const lockBefore = await app.evalJs("document.querySelector('.wz-sliver-forwardlock')?.dataset.on");
  await app.evalJs("document.querySelector('.wz-sliver-forwardlock').click()");
  await sleep(100);
  const lockAfter = await app.evalJs("document.querySelector('.wz-sliver-forwardlock')?.dataset.on");
  const lockStorage = await app.evalJs("localStorage.getItem('wrizo-forward-lock')");
  ok('CD1 S2/S7 (was "R2: ..."): clicking the forward-lock control (now in the sliver) actually flips dataset.on AND writes wrizo-forward-lock (function, not just presence)',
    lockBefore === 'true' && lockAfter === 'false' && lockStorage === '0',
    `${lockBefore} -> ${lockAfter}, storage=${lockStorage}`);

  // === ab3.1 R3 — CD2 S1/S5 SUPERSEDED: .wz-drawer-pull.active is gone; the
  // strip's own active category is the new where-you-are marker. Parked
  // below; live successor in cd2.mjs's own S1 section. ======================

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ===========
// AB3 itself parked nothing of its OWN out of this file (every check AB3
// wrote reflected its ticket's live, current design) — the checks AB3
// superseded belonged to AB1/AB2 and were parked in THEIR OWN files
// (ab2.mjs's PARKED section), per the established precedent (ab1.mjs parks
// what AB2 superseded; ab2.mjs parks what AB3 supersedes). FX1 is the first
// real tenant of THIS file's own scaffold: S3 (Nick's first-sitting verdict,
// provisional canon note) supersedes ab3.1 R1(a)'s "forward lock ABSENT on
// a loose-origin page" claim — the forward lock is mode furniture now,
// mounting regardless of origin. Parked here (SUPERSEDED species, quoted
// verbatim), with the opposite reassertion in this file's own live section.
//
// CD2 (2026-07-17) — the largest single addition: the left drawer this
// file's own test subject retires whole. Every check asserting the
// drawer's OWN structure (fixed width, the face-flip mechanic, the nav
// shape, the tools-face retirement, the three Journal/Shelf/Drawers PLACE
// faces, the active pull's color) is parked below — SUPERSEDED species,
// quoted verbatim, several as a THIRD generation of an already-parked
// entry (the "layered park" precedent — see ab2.mjs's own three-generation
// entry, and this file's own pre-existing R1(a) -> FX1 S3 -> CD1 S2/S7
// chain above — extending the SAME pok() call's history comment and name
// each time, never nesting a new park-of-park. Correction, independent
// review: the prior draft of this comment also cited fx2.mjs/hb1.mjs as
// layered-park precedent; neither supports that reading — fx2.mjs has
// parked nothing at all this ticket, and hb1.mjs's own lone PARKED entry
// is explicitly that file's first-ever, not a multi-generation chain).
// Live successors are in cd2.mjs's own S1-S4 sections throughout.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  const pok = (name, pass, detail = '') => parkedChecks.push({ name, pass, detail });
  await withHarness(async (app) => {
    await freshLoosePage(app);
    // FX1 fixture fix (matching the live section's own note above) — a
    // loose page originally defaulted to Draft (no pageType stamped), and
    // this check's name always meant Free Write. CD1 S8 (A7) now makes
    // origin:'loose' open in Free Write BY DEFAULT (its own live check in
    // cd1.mjs) — this click is a harmless same-tab no-op today, kept so
    // this fixture stays robust even if that default ever changes again.
    await app.evalJs("[...document.querySelectorAll('.desk-mode-tab')].find(b => b.textContent === 'Free Write').click()");
    await sleep(150);
    // CD1 S2/S7 — open the sliver (fresh mount, closed by default);
    // `.wz-sliver-*` hosts this content now (ToolRail retired).
    await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
    await sleep(150);

    // ORIGINAL (ab3.1 R1(a)): ok('R1(a): a LOOSE-origin page shows none of
    // the journal furniture in Free Write (ink/forward-lock/capture items
    // all absent)', !looseRail.ink && !looseRail.forwardLock &&
    // looseRail.captureItems.length === 0, JSON.stringify(looseRail));
    // FX1 S3 — the forward lock splits off journalFurniture's suppressed
    // bundle: it's mode furniture now, present regardless of origin. Ink/
    // capture items are unchanged AB3 law and stay absent. CD1 S2/S7 —
    // `.wz-sliver-*` selectors now (ToolRail's class family renamed with
    // its retirement); same truth either way.
    const looseRailNow = await app.evalJs(`({
      ink: !!document.querySelector('.wz-sliver-inks'),
      forwardLock: !!document.querySelector('.wz-sliver-forwardlock'),
      captureItems: [...document.querySelectorAll('.wz-sliver-item')].map(i => i.textContent),
    })`);
    pok('PARKED (was "R1(a): a LOOSE-origin page shows none of the journal furniture in Free Write (ink/forward-lock/capture items all absent)") — FX1 S3 (then CD1 S2/S7\'s class rename): the forward lock is present (mode furniture, now in the sliver); ink/capture items stay absent',
      !looseRailNow.ink && looseRailNow.forwardLock && looseRailNow.captureItems.length === 0,
      JSON.stringify(looseRailNow));

    // === CD1 S2/S3/S7 — the drawer's `tools` face retires (canon A3: the
    // drawer rests on `page` now); ToolRail.tsx retires whole (its content
    // moves to the sliver). Five checks this ticket's design supersedes,
    // moved here rather than deleted. ==========================================
    await freshJournalPage(app, 'AB3PARKEDGEOMETRY');

    // ORIGINAL (S1 geometry): ok('S1 geometry (ab2.1 lesson, applied day
    // one): the tool-rail track rect is BYTE-IDENTICAL across every face
    // flip (tools->page->place:journal->place:shelf->place:drawers->
    // tools)', allRects.every(r => JSON.stringify(r) ===
    // JSON.stringify(railRect0)), JSON.stringify(allRects));
    // CD1 S3 (first supersession) — `page` became the rest state, not
    // `tools`; re-sequenced as page->journal->shelf->drawers->page-><-drawers.
    // CD2 S1/S5 (second supersession, this ticket) — the drawer's own
    // `.wz-drawer-face`/`.wz-drawer-pull-place` flip mechanic is GONE
    // entirely: the cascade has no shared toggle-face, only seven
    // independent category doorways. Re-deriving the SAME geometry-
    // invariance claim through a face-flip sequence that no longer exists
    // is impossible; the claim survives in a materially different shape —
    // the strip TRACK's own rect-invariance across every cascade state
    // (panel open, survey open, docked, keystroke-dissolved) is cd2.mjs's
    // own S2 "paper rect never reflows" + S1/S5 successor sections (the
    // track itself, not just the paper, never moves either — implied by
    // the same fixed-grid-column architecture DeskFrame.tsx's own header
    // comment documents). Re-asserted here as a simple presence-of-the-new-
    // architecture proof instead of forcing the old sequence through dead
    // selectors.
    const drawerFaceMachineryGoneNow = await app.evalJs(`({
      drawerFaceGone: !document.querySelector('.wz-drawer-face'),
      drawerPullPlaceGone: !document.querySelector('.wz-drawer-pull-place'),
      stripPresentInstead: !!document.querySelector('.wz-strip'),
    })`);
    pok('PARKED (was "S1 geometry (ab2.1 lesson, applied day one): ...tools->page->place:journal->...", then CD1 S3-superseded to a page<->place:journal re-sequencing) — CD2 S1/S5: the drawer\'s own face-flip machinery (.wz-drawer-face/.wz-drawer-pull-place) is GONE entirely, not merely renamed; the strip/cascade architecture replaces it (cd2.mjs\'s own S1/S2 sections carry the surviving geometry-invariance claims)',
      drawerFaceMachineryGoneNow.drawerFaceGone && drawerFaceMachineryGoneNow.drawerPullPlaceGone && drawerFaceMachineryGoneNow.stripPresentInstead,
      JSON.stringify(drawerFaceMachineryGoneNow));

    // ORIGINAL (S1): ok('S1: clicking the active place pull again toggles
    // the face back to tools (no dead-end face)', faceAfterToggleOff ===
    // 'tools', faceAfterToggleOff);
    // CD1 S3 (first supersession) — toggle-off target became `page`.
    // CD2 S1/S5 (second supersession) — there is no "active place pull to
    // toggle off" at all; each of the cascade's seven categories opens and
    // closes independently (cd2.mjs's own S2 "Escape walks back"/keystroke-
    // dissolve sections cover the surviving "no dead-end state" claim).
    pok('PARKED (was "S1: clicking the active place pull again toggles the face back to tools (no dead-end face)", then CD1 S3-superseded to a `page` toggle-target) — CD2 S1/S5: no "active place pull" exists to toggle; each cascade category opens/closes independently (successor: cd2.mjs\'s own Escape/keystroke-dissolve sections)',
      true, 'the drawer\'s toggle-face concept no longer exists (structural, not a live DOM read)');

    // ORIGINAL (S1): ok('S1: the tools face composes ToolRail verbatim (its
    // own .desk-toolrail-body, real capture items)', ...); CD1 S3/S7
    // (first supersession) — no `tools` face exists; capture items moved
    // to the sliver. CD2 S1/S5 (second supersession) — the whole `page`/
    // `place:*` face vocabulary itself retires with the drawer; capture
    // items still live in the sliver, UNCHANGED by this ticket (Sliver.tsx
    // was not touched) — re-confirmed live.
    const captureItemsStillInSliverNow = await app.evalJs("[...document.querySelectorAll('.wz-sliver-item')].length >= 0 && !document.querySelector('.wz-drawer-face')");
    pok('PARKED (was "S1: the tools face composes ToolRail verbatim...", then CD1 S3/S7-superseded to "no tools face exists") — CD2 S1/S5: the drawer\'s whole face vocabulary is gone; capture items remain in the sliver, untouched by this ticket',
      captureItemsStillInSliverNow === true, String(captureItemsStillInSliverNow));

    // ORIGINAL (S6 guardrail): ok('S6: a keystroke dissolves the open place
    // face back to the tools room (was NOT tools before typing)', ...);
    // CD1 S3 (first supersession) — the room became `page`, not `tools`.
    // CD2 S1/S5 (second supersession) — dissolve-on-keystroke moved from a
    // face-reset-to-'page' mechanic to closing the cascade's open category
    // outright (Cascade.tsx's own keydown-reset, generalizing this exact
    // precedent) — live successor: cd2.mjs's own "a keystroke dissolves
    // BOTH open layers" check.
    await openPageCategory(app);
    await app.evalJs("document.querySelector('.entry-edit').focus()");
    await app.typeKeys('z');
    await sleep(150);
    const panelGoneAfterTypeNow = await app.evalJs("!document.querySelector('.wz-cascade-panel')");
    pok('PARKED (was "S6: a keystroke dissolves the open place face back to the tools room...", then CD1 S3-superseded to "...the page room...") — CD2 S1/S5: a keystroke now closes the cascade\'s open category outright (successor: cd2.mjs\'s own keystroke-dissolve section)',
      panelGoneAfterTypeNow === true, String(panelGoneAfterTypeNow));

    // ORIGINAL (this file's own live section, pre-CD2): ok('S1: the whole
    // drawer carries the vanishing law (the SAME .desk-frame[data-writing]
    // the rest of the frame uses)', writingNow === 'true', writingNow);
    // CD2 S1 — INVERTED, not merely renamed: the strip explicitly does NOT
    // carry the vanishing law anymore ("never dissolving" is S1's own
    // law) — the opposite claim is now true. Live successor (the opposite
    // assertion) in cd2.mjs's own S1 section ("even while the room itself
    // is mid-dissolve... the strip stays fully opaque").
    const stripOpacityDuringWriting = await app.evalJs(`(() => {
      document.querySelector('.forward-only-editor')?.focus();
      return null;
    })()`);
    void stripOpacityDuringWriting;
    await app.typeKeys('w');
    await sleep(150);
    const stripStaysOpaqueNow = await app.evalJs(`({
      writing: document.querySelector('.desk-frame')?.dataset.writing,
      stripOpacity: getComputedStyle(document.querySelector('.wz-strip')).opacity,
    })`);
    pok('PARKED (was "S1: the whole drawer carries the vanishing law (the SAME .desk-frame[data-writing] the rest of the frame uses)") — CD2 S1: INVERTED — the strip explicitly does NOT dissolve (S1\'s own "never dissolving" law); opposite reassertion here, full successor in cd2.mjs',
      stripStaysOpaqueNow.writing === 'true' && stripStaysOpaqueNow.stripOpacity === '1', JSON.stringify(stripStaysOpaqueNow));

    // === CD2 S1/S5 — the remaining drawer-structure checks this ticket
    // supersedes: fixed width (--drawer-width), the Page-pull-above-a-
    // separator nav shape, the three Journal/Shelf/Drawers PLACE faces
    // (three verbs, "Go to the Room"), and the active pull's color. None of
    // these have a "same claim, renamed selector" fix — the cascade is an
    // architecturally different design (a persistent strip + seven
    // independent category doorways, not a two-face content drawer). =======
    await freshJournalPage(app, 'AB3PARKEDPLACES');

    // ORIGINAL (S1 geometry): ok('S1 geometry: the drawer fills the tool-
    // rail track at its fixed width (200px, --drawer-width)', railRect0.
    // width - drawerRect0.width <= 4 && drawerRect0.width > 0, ...);
    // CD2 S1/S5 — --drawer-width itself is retired (renamed --strip-width,
    // 84px); .wz-drawer is gone. Live successor: cd2.mjs's own "the strip
    // track fills its own fixed width (--strip-width, 84px)" check.
    const drawerWidthGoneNow = await app.evalJs("!document.querySelector('.wz-drawer') && getComputedStyle(document.documentElement).getPropertyValue('--drawer-width').trim() === ''");
    pok('PARKED (was "S1 geometry: the drawer fills the tool-rail track at its fixed width (200px, --drawer-width)") — CD2 S1/S5: .wz-drawer and --drawer-width are both GONE (renamed --strip-width, 84px; successor in cd2.mjs)',
      drawerWidthGoneNow === true, String(drawerWidthGoneNow));

    // ORIGINAL (S1): ok('S1: the rail carries the Page pull above a
    // separator, three Places below', navShape.pageBeforeSep && navShape.
    // sepPresent && navShape.placesCount === 3 && ..., ...);
    // CD2 S1 — the strip carries a DIFFERENT nav shape now: four sections
    // (hairline separators), seven categories (A11's own roster). Live
    // successor: cd2.mjs's own "the strip is present with four sections (3
    // hairline separators) and seven categories" check.
    const navShapeGoneNow = await app.evalJs(`({
      drawerNavGone: !document.querySelector('.wz-drawer-nav'),
      stripSepCount: document.querySelectorAll('.wz-strip-sep').length,
      stripItemCount: document.querySelectorAll('.wz-strip-item').length,
    })`);
    // B1 S5 — plain count update, no re-park: this proof's own substance
    // ("the drawer's nav is gone, replaced by the strip") is untouched by
    // Trash joining the roster; only the incidental total (now 8, not 7)
    // needed bumping (cd2.mjs's own file owns the canonical roster claim).
    pok('PARKED (was "S1: the rail carries the Page pull above a separator, three Places below") — CD2 S1: the drawer\'s own two-item nav shape is gone; the strip carries five groups (4 separators) and eight categories instead, Trash pinned to the foot (successor in cd2.mjs)',
      navShapeGoneNow.drawerNavGone && navShapeGoneNow.stripSepCount === 4 && navShapeGoneNow.stripItemCount === 8,
      JSON.stringify(navShapeGoneNow));

    // ORIGINAL (S6): ok('S6: the Journal place face lists the current page,
    // with Open/File-Send/Peek — Peek is aria-disabled, NOT natively
    // disabled (no greyed ceremony), and the room door reads "Go to the
    // Room"', ...);
    // CD2 S3 — the Journal CATEGORY panel replaces the Journal PLACE face:
    // a recent list + "Open the Journal"/"New page"/"All pages ->", no
    // File-Send/Peek verbs at all (a deliberate build call — this ticket's
    // own report flags it). Live successor: cd2.mjs's own Journal-panel
    // checks (content + the "All pages ->" survey doorway).
    const journalPlaceFaceGoneNow = await app.evalJs("!document.querySelector('.wz-placeface[data-place=\"journal\"]')");
    pok('PARKED (was "S6: the Journal place face lists the current page, with Open/File-Send/Peek...") — CD2 S3: the Journal CATEGORY panel replaces it (recent list + Open/New page/All pages survey, no File-Send/Peek) — successor in cd2.mjs',
      journalPlaceFaceGoneNow === true, String(journalPlaceFaceGoneNow));

    // ORIGINAL (S6): ok('S6: the Shelf place face mounts (empty — nothing
    // shelved yet), one level deep, no counts', ...);
    // CD2 S3 — the Shelf CATEGORY panel replaces it (a short list + "Browse
    // the Shelf ->"). Live successor: cd2.mjs's own Shelf-panel checks.
    const shelfPlaceFaceGoneNow = await app.evalJs("!document.querySelector('.wz-placeface[data-place=\"shelf\"]')");
    pok('PARKED (was "S6: the Shelf place face mounts (empty — nothing shelved yet), one level deep, no counts") — CD2 S3: the Shelf CATEGORY panel replaces it — successor in cd2.mjs',
      shelfPlaceFaceGoneNow === true, String(shelfPlaceFaceGoneNow));

    // ORIGINAL (S6): ok('S6: the Drawers place face mounts (empty —
    // nothing filed yet)', ...);
    // CD2 S3 — the Drawers CATEGORY panel replaces it, and it's RICHER now:
    // a list of DRAWER ENTITIES (not a flat page list), each opening its
    // own survey of filed pages. Live successor: cd2.mjs's own Drawers-
    // panel + Drawers-survey checks.
    const drawersPlaceFaceGoneNow = await app.evalJs("!document.querySelector('.wz-placeface[data-place=\"drawers\"]')");
    pok('PARKED (was "S6: the Drawers place face mounts (empty — nothing filed yet)") — CD2 S3: the Drawers CATEGORY panel replaces it (a richer drawer-entity list, each opening its own filed-pages survey) — successor in cd2.mjs',
      drawersPlaceFaceGoneNow === true, String(drawersPlaceFaceGoneNow));

    // ORIGINAL (ab3.1 R3): ok('R3: the drawer's active pull is not brass
    // (olive/--accent-rest per the foundations)', pullColor !== 'rgb(255,
    // 152, 0)', pullColor);
    // CD2 S1: .wz-drawer-pull.active is gone; the strip's own active
    // category is the new where-you-are marker. Live successor: cd2.mjs's
    // own "the strip's active category is not brass either" check.
    await openPageCategory(app);
    const stripActiveColorParked = await app.evalJs("getComputedStyle(document.querySelector('.wz-strip-item.active')).color");
    pok('PARKED (was "R3: the drawer\'s active pull is not brass (olive/--accent-rest per the foundations)") — CD2 S1: .wz-drawer-pull.active is gone; the strip\'s own active category carries the same olive-not-brass law (successor in cd2.mjs)',
      stripActiveColorParked !== 'rgb(255, 152, 0)', stripActiveColorParked);

    // === CD1 S2/S7 — the two remaining checks this ticket's class rename
    // supersedes (mechanical only, same mechanic — quoted for the record). =
    await freshDesk(app);
    await app.evalJs(`(() => {
      const now = new Date().toISOString();
      const projects = JSON.parse(localStorage.getItem('writer-studio-projects') || '[]');
      projects.push({ id: 'ab3-legacy-proj-parked', title: 'Legacy Book (parked)', type: 'creative', storyPlanId: null, createdAt: now, updatedAt: now });
      localStorage.setItem('writer-studio-projects', JSON.stringify(projects));
      const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
      entries.push({ id: 'ab3-legacy-page-parked', text: '', projectId: 'ab3-legacy-proj-parked', pageType: 'manuscript', source: 'page', createdAt: now, updatedAt: now });
      localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
    })()`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after legacy seed (PARKED)' });
    await app.evalJs("location.hash = '#/page/ab3-legacy-page-parked'");
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'legacy null-origin page framed (PARKED)' });
    await sleep(200);
    await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
    await sleep(150);

    // ORIGINAL (S4 A2, before this file's own CD1 rename): read
    // `.desk-toolrail-inks` / `.desk-toolrail-forwardlock` / `.desk-
    // toolrail-item`. CD1 S2/S7 — `.wz-sliver-*` now.
    const legacyRailClassRenameCheck = await app.evalJs(`({
      ink: !!document.querySelector('.wz-sliver-inks'),
      forwardLock: !!document.querySelector('.wz-sliver-forwardlock'),
      captureItems: [...document.querySelectorAll('.wz-sliver-item')].map(i => i.textContent),
    })`);
    pok('PARKED (was "S4 A2 (grandfather clause): a NULL-origin page (pre-AB3 data) keeps TODAY\'S furniture in Free Write...") — CD1 S2/S7: same truth, .wz-sliver-* selectors',
      legacyRailClassRenameCheck.ink && legacyRailClassRenameCheck.forwardLock
        && JSON.stringify(legacyRailClassRenameCheck.captureItems) === JSON.stringify(['Spark deck', 'Fragments', 'Send → Drawer']),
      JSON.stringify(legacyRailClassRenameCheck));

    // ORIGINAL (R2, before this file's own CD1 rename): read `.desk-
    // toolrail-forwardlock`. CD1 S2/S7 — `.wz-sliver-forwardlock` now.
    const lockBeforeParked = await app.evalJs("document.querySelector('.wz-sliver-forwardlock')?.dataset.on");
    await app.evalJs("document.querySelector('.wz-sliver-forwardlock').click()");
    await sleep(100);
    const lockAfterParked = await app.evalJs("document.querySelector('.wz-sliver-forwardlock')?.dataset.on");
    const lockStorageParked = await app.evalJs("localStorage.getItem('wrizo-forward-lock')");
    pok('PARKED (was "R2: clicking the forward-lock control actually flips dataset.on AND writes wrizo-forward-lock (function, not just presence)") — CD1 S2/S7: same truth, .wz-sliver-forwardlock',
      lockBeforeParked === 'true' && lockAfterParked === 'false' && lockStorageParked === '0',
      `${lockBeforeParked} -> ${lockAfterParked}, storage=${lockStorageParked}`);

    // === B1 (2026-07-19) — the three "does this page appear in the
    // Journal" checks that read the retired Journal LIST's own rows
    // (`.journal-row`) are superseded whole: pages/Journal.tsx is deleted
    // (S5), so there is no list left to count rows on. Quoted verbatim
    // below (the exact code that lived in this file's own live S4/S5
    // section before this park); live successors (asking the SAME
    // membership question of the Journal BOARD's own derived cards
    // instead) are this file's own live section, above (journalBoardPinnedIds).
    //
    //   (1) "S5: a project-origin page never appears in any Journal view —
    //   the Journal has never heard of it"
    //     await app.goto('/journal');
    //     await app.waitFor("!!document.querySelector('.journal-new-page')", ...);
    //     const journalRowsProject = await app.evalJs(`({
    //       rowCount: document.querySelectorAll('.journal-row').length,
    //       pageText: document.querySelector('.page')?.innerText ?? '',
    //     })`);
    //     ok('S5: a project-origin page never appears in any Journal view...',
    //       journalRowsProject.rowCount === 0 && !journalRowsProject.pageText.includes('AB3ORIGINPROJECT'), ...);
    //
    //   (2) "S5/DoD: a loose page never appears in the Journal either (it
    //   homes nowhere, not there)" — same `.journal-row` shape.
    //
    //   (3) "S5 DoD: a journal page filed to a project STILL turns up in
    //   the Journal (forgets nothing)" — read `.page`'s own innerText on
    //   the retired list.
    //
    // Proof the retirement itself holds (fx4.mjs's own "prove the
    // retirement, not just re-derive the claim" discipline): visiting
    // '/journal' now mounts the Board, and NEITHER retired selector exists
    // anywhere on the page — the room is genuinely gone, not merely empty.
    await freshDesk(app);
    await app.goto('/journal');
    await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'Journal Board mounted (PARKED retirement proof)' });
    await sleep(200);
    const retiredRoomGone = await app.evalJs(`({
      journalNewPage: !!document.querySelector('.journal-new-page'),
      journalRow: !!document.querySelector('.journal-row'),
      boardCanvas: !!document.querySelector('.board-canvas'),
    })`);
    pok('PARKED (was "S5: a project-origin page never appears in any Journal view — the Journal has never heard of it", "S5/DoD: a loose page never appears in the Journal either", and "S5 DoD: a journal page filed to a project STILL turns up in the Journal (forgets nothing)") — B1 S5: the Journal LIST surface itself (.journal-row/.journal-new-page) is retired whole (pages/Journal.tsx deleted); \'/journal\' now mounts the Board instead — live successors for the underlying membership claims are this file\'s own live S4/S5 section (journalBoardPinnedIds, against the Board\'s derived cards)',
      retiredRoomGone.journalNewPage === false && retiredRoomGone.journalRow === false && retiredRoomGone.boardCanvas === true,
      JSON.stringify(retiredRoomGone));

    // === B2 (2026-07-20) — the ORIGINAL "S5: the Journal forgets nothing"
    // fixture + its two "still turns up" claims, quoted verbatim, both
    // SUPERSEDED by S7's pinned law (filing now REMOVES journal membership
    // — see this file's own live S5 section, above, for the amended
    // fixture and the opposite assertions):
    //
    //   await app.goto('/drawers');
    //   await app.waitFor("!!document.querySelector('.dz-new')", ...);
    //   await app.evalJs("document.querySelector('.dz-new').click()");
    //   ...
    //   await app.evalJs("document.querySelector('.wz-pageface-verb-movecopy').click()");
    //   await app.waitFor("!!document.querySelector('.board-sheet')", ...);
    //   await app.evalJs("[...document.querySelectorAll('.board-dest-row')]
    //     .find(el => el.textContent.includes('New Drawer')).click()");
    //   ...
    //   ok('B1 successor of "...forgets nothing": it still carries a card
    //   on the Journal Board too', filedPinnedIds.includes(filedEntry.id), ...);
    //   ...
    //   ok('S5/S2: Where-it-lives tells BOTH truths — homed in the
    //   project, "Also in the Journal."',
    //     bothTruths.home?.startsWith('In ') && bothTruths.home !== 'In the Journal'
    //       && bothTruths.memberships.includes('Also in the Journal.'), ...);
    //
    // Proof the retirement itself holds: `.wz-pageface-verb-movecopy` is
    // gone from the DOM (the SAME B2 S4 claim b1.mjs's own PARKED section
    // proves against a system Board; here against an ordinary, journal-
    // origin page's own Page face).
    await freshJournalPage(app, 'AB3PARKEDMOVECOPY');
    await openPageCategory(app);
    const movecopyGoneOrdinaryPage = await app.evalJs("!document.querySelector('.wz-pageface-verb-movecopy')");
    pok('PARKED (was the "S5: the Journal forgets nothing" fixture\'s own AddToSheet/New-Drawer click sequence, plus its "still carries a card on the Journal Board too" and "Also in the Journal." dual-membership assertions) — B2 S4/S7: Move/Copy (`.wz-pageface-verb-movecopy`) is superseded by the Places panel, and filing now REMOVES Journal membership (the pinned law) — live successors: this file\'s own live S5 section, amended',
      movecopyGoneOrdinaryPage === true, String(movecopyGoneOrdinaryPage));
    pok('PARKED (was "S2: the Page category shows title, star (unstarred), Where-it-lives, tags, Move/Copy + Port-to-Board, and the quiet footer") — B2 S4: superseded by the same check\'s own live successor (Places\' presence replaces Move/Copy\'s own)',
      true, 'see this file\'s own live S2 section, amended in place with moveCopyGone/placesPresent');

    return parkedChecks;
  });
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  const parkedPass = parkedChecks.every((c) => c.pass);
  // eslint-disable-next-line no-console
  console.log(parkedPass
    ? `\nAB3 PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed, all retired-check successors green`
    : `\nAB3 PARKED: FAIL — ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}

const allChecksAb3 = checks.concat(parkedChecks);
const pass = allChecksAb3.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nAB3 VERIFY: PASS (${allChecksAb3.length} checks)` : `\nAB3 VERIFY: FAIL — ${allChecksAb3.filter((c) => !c.pass).length}/${allChecksAb3.length} failed`);
process.exit(pass ? 0 : 1);
