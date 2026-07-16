// AB3 — the Drawer and the Homes (docs/wrizo-alpha/ab3-drawer-and-homes-brief.md).
// A committed CDP verification scenario (per AGENTS.md "Harness scenarios
// persist"), modeled on ab1.mjs/ab2.mjs.
// Run: node apps/desktop/scripts/harness/ab3.mjs   (from apps/desktop, with
// dist-web freshly built via `pnpm run build:web`).
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const rectOf = (sel) => `(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return {left:r.left, top:r.top, width:r.width, height:r.height}; })()`;

const freshDesk = async (app) => {
  await app.goto('/');
  await app.evalJs('localStorage.clear()');
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-desk')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, 1400, 900);
};

// S4 — the Journal/Catch door: a fresh authored Journal page, typed with a
// distinctive marker so later checks can trace it across views. Does NOT
// touch existing localStorage — callers that need a clean slate call
// freshDesk() themselves first (some S5 fixtures deliberately build on
// state from an earlier step, e.g. a Drawer created moments before).
const journalPageHere = async (app, marker) => {
  await app.goto('/journal');
  await app.waitFor("!!document.querySelector('.journal-new-page')", { label: 'Journal list' });
  await app.evalJs("document.querySelector('.journal-new-page').click()");
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
  await app.evalJs("document.querySelector('.wz-start-writing').click()");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, framed (loose)' });
  await sleep(500); // past persistence.ts's 300ms debounced flush
};

await withHarness(async (app) => {
  // === S1/S6 — the Drawer's fixed geometry across EVERY face flip. ==========
  await freshJournalPage(app, 'AB3GEOMETRY');

  const railRect0 = await app.evalJs(rectOf('.desk-frame-toolrail'));
  const drawerRect0 = await app.evalJs(rectOf('.wz-drawer'));
  // The drawer is a content-box child of the bordered .desk-frame-toolrail
  // aside (1px border each side) — its width fills the track minus that
  // border, not byte-identical to the border-box rect.
  ok('S1 geometry: the drawer fills the tool-rail track at its fixed width (200px, --drawer-width)',
    railRect0.width - drawerRect0.width <= 4 && drawerRect0.width > 0, JSON.stringify({ railRect0, drawerRect0 }));

  const flipTo = async (sel) => { await app.evalJs(`document.querySelector(${JSON.stringify(sel)}).click()`); await sleep(220); };

  await flipTo('.wz-drawer-pull-page'); // tools -> page
  const railRect1 = await app.evalJs(rectOf('.desk-frame-toolrail'));
  await flipTo('.wz-drawer-pull-place[data-place="journal"]'); // page -> place:journal
  const railRect2 = await app.evalJs(rectOf('.desk-frame-toolrail'));
  await flipTo('.wz-drawer-pull-place[data-place="shelf"]'); // place:journal -> place:shelf
  const railRect3 = await app.evalJs(rectOf('.desk-frame-toolrail'));
  await flipTo('.wz-drawer-pull-place[data-place="drawers"]'); // place:shelf -> place:drawers
  const railRect4 = await app.evalJs(rectOf('.desk-frame-toolrail'));
  // Toggle the active place off — back to tools.
  await flipTo('.wz-drawer-pull-place[data-place="drawers"]');
  const railRect5 = await app.evalJs(rectOf('.desk-frame-toolrail'));

  const allRects = [railRect0, railRect1, railRect2, railRect3, railRect4, railRect5];
  ok('S1 geometry (ab2.1 lesson, applied day one): the tool-rail track rect is BYTE-IDENTICAL across every face flip (tools->page->place:journal->place:shelf->place:drawers->tools)',
    allRects.every(r => JSON.stringify(r) === JSON.stringify(railRect0)), JSON.stringify(allRects));

  const faceAfterToggleOff = await app.evalJs("document.querySelector('.wz-drawer-face').dataset.face");
  ok('S1: clicking the active place pull again toggles the face back to tools (no dead-end face)', faceAfterToggleOff === 'tools', faceAfterToggleOff);

  // === S1 — the Page pull above a separator, Places below. ==================
  const navShape = await app.evalJs(`({
    pageBeforeSep: !!document.querySelector('.wz-drawer-nav .wz-drawer-pull-page'),
    sepPresent: !!document.querySelector('.wz-drawer-sep'),
    placesCount: document.querySelectorAll('.wz-drawer-pull-place').length,
    placeOrder: [...document.querySelectorAll('.wz-drawer-pull-place')].map(b => b.dataset.place),
  })`);
  ok('S1: the rail carries the Page pull above a separator, three Places below',
    navShape.pageBeforeSep && navShape.sepPresent && navShape.placesCount === 3
      && JSON.stringify(navShape.placeOrder) === JSON.stringify(['journal', 'shelf', 'drawers']),
    JSON.stringify(navShape));

  // === S1 — the `tools` face is AB2's ToolRail, composed verbatim. ==========
  const toolsFaceContent = await app.evalJs(`({
    inFace: !!document.querySelector('.wz-drawer-face[data-face="tools"] .desk-toolrail-body'),
    captureItems: [...document.querySelectorAll('.wz-drawer-face .desk-toolrail-item')].map(i => i.textContent),
  })`);
  ok('S1: the tools face composes ToolRail verbatim (its own .desk-toolrail-body, real capture items)',
    toolsFaceContent.inFace && JSON.stringify(toolsFaceContent.captureItems) === JSON.stringify(['Spark deck', 'Fragments', 'Send → Drawer']),
    JSON.stringify(toolsFaceContent));

  // === S2 — the Page face's content, on a journal-origin, unfiled page. =====
  await flipTo('.wz-drawer-pull-page');
  const pageFace = await app.evalJs(`({
    face: document.querySelector('.wz-drawer-face').dataset.face,
    title: document.querySelector('.wz-pageface-title')?.textContent,
    starPresent: !!document.querySelector('.wz-pageface-star'),
    starredNow: document.querySelector('.wz-pageface-star')?.dataset.starred,
    home: document.querySelector('.wz-pageface-home-label')?.textContent,
    tagInput: !!document.querySelector('.wz-pageface-tag-input'),
    moveCopy: !!document.querySelector('.wz-pageface-verb-movecopy'),
    port: !!document.querySelector('.wz-pageface-verb-port'),
    footer: document.querySelector('.wz-pageface-footer')?.textContent,
  })`);
  ok('S2: the Page face shows title, star (unstarred), Where-it-lives, tags, Move/Copy + Port-to-Board, and the quiet footer',
    pageFace.face === 'page' && pageFace.title === 'AB3GEOMETRY' && pageFace.starPresent && pageFace.starredNow === 'false'
      && pageFace.home === 'In the Journal' && pageFace.tagInput && pageFace.moveCopy && pageFace.port
      && pageFace.footer === 'Saved automatically — even if you never file it to a Drawer or the Shelf.',
    JSON.stringify(pageFace));

  // Star toggling from the Page face actually persists (S2 wires the star).
  await app.evalJs("document.querySelector('.wz-pageface-star').click()");
  await sleep(2300); // past autosave
  const starredAfter = await app.evalJs("document.querySelector('.wz-pageface-star')?.dataset.starred");
  const storedStarred = (await app.localJSON('writer-studio-journal-entries')).find(e => e.text?.includes('AB3GEOMETRY'))?.starred;
  ok('S2: the Page face\'s star toggle actually persists to entry.starred', starredAfter === 'true' && storedStarred === true, `${starredAfter} / ${storedStarred}`);

  // === S6 — the Places faces: Journal/Shelf/Drawers, three verbs, Go to the
  // Room, no counts/badges. ===================================================
  await flipTo('.wz-drawer-pull-place[data-place="journal"]');
  const journalPlace = await app.evalJs(`({
    face: document.querySelector('.wz-drawer-face').dataset.face,
    hasItem: [...document.querySelectorAll('.wz-placeface-item-title')].some(el => el.textContent.includes('AB3GEOMETRY')),
    verbs: (() => {
      const item = [...document.querySelectorAll('.wz-placeface-item')].find(el => el.textContent.includes('AB3GEOMETRY'));
      if (!item) return null;
      return {
        open: !!item.querySelector('.wz-placeface-verb-open'),
        file: !!item.querySelector('.wz-placeface-verb-file'),
        peek: !!item.querySelector('.wz-placeface-verb-peek'),
        peekAriaDisabled: item.querySelector('.wz-placeface-verb-peek')?.getAttribute('aria-disabled'),
        peekNativeDisabled: item.querySelector('.wz-placeface-verb-peek')?.disabled === true,
      };
    })(),
    room: document.querySelector('.wz-placeface-room')?.textContent,
    noBadges: document.querySelectorAll('.wz-placeface .journal-star, .wz-placeface [class*="count"], .wz-placeface [class*="badge"]').length === 0,
  })`);
  ok('S6: the Journal place face lists the current page, with Open/File-Send/Peek — Peek is aria-disabled, NOT natively disabled (no greyed ceremony), and the room door reads "Go to the Room"',
    journalPlace.face === 'place:journal' && journalPlace.hasItem
      && journalPlace.verbs?.open && journalPlace.verbs?.file && journalPlace.verbs?.peek
      && journalPlace.verbs?.peekAriaDisabled === 'true' && journalPlace.verbs?.peekNativeDisabled === false
      && journalPlace.room === 'Go to the Room' && journalPlace.noBadges,
    JSON.stringify(journalPlace));

  await flipTo('.wz-drawer-pull-place[data-place="shelf"]');
  const shelfPlace = await app.evalJs("({ face: document.querySelector('.wz-drawer-face').dataset.face, empty: !!document.querySelector('.wz-placeface-empty') })");
  ok('S6: the Shelf place face mounts (empty — nothing shelved yet), one level deep, no counts',
    shelfPlace.face === 'place:shelf' && shelfPlace.empty, JSON.stringify(shelfPlace));

  await flipTo('.wz-drawer-pull-place[data-place="drawers"]');
  const drawersPlace = await app.evalJs("({ face: document.querySelector('.wz-drawer-face').dataset.face, empty: !!document.querySelector('.wz-placeface-empty') })");
  ok('S6: the Drawers place face mounts (empty — nothing filed yet)', drawersPlace.face === 'place:drawers' && drawersPlace.empty, JSON.stringify(drawersPlace));

  // === S6 guardrail — a keystroke dissolves the face back to the room
  // (tools), and the whole drawer inherits the vanishing law + resurfaces on
  // edge-dwell (the SAME useChromeDissolve engine, no second fade system). ==
  const faceBeforeType = await app.evalJs("document.querySelector('.wz-drawer-face').dataset.face");
  await app.evalJs("document.querySelector('.entry-edit').focus()");
  await app.typeKeys('x');
  await sleep(150);
  const faceAfterType = await app.evalJs("document.querySelector('.wz-drawer-face')?.dataset.face");
  const writingNow = await app.evalJs("document.querySelector('.desk-frame')?.dataset.writing");
  ok('S6: a keystroke dissolves the open place face back to the tools room (was NOT tools before typing)',
    faceBeforeType !== 'tools' && faceAfterType === 'tools', `${faceBeforeType} -> ${faceAfterType}`);
  ok('S1: the whole drawer carries the vanishing law (the SAME .desk-frame[data-writing] the rest of the frame uses)', writingNow === 'true', writingNow);

  await app.evalJs("window.dispatchEvent(new PointerEvent('pointermove', { clientX: 400, clientY: 10, bubbles: true }))");
  await sleep(500); // past EDGE_DWELL_MS (260ms)
  const writingAfterEdge = await app.evalJs("document.querySelector('.desk-frame')?.dataset.writing");
  ok('S6: dwelling at the viewport edge resurfaces the chrome (the drawer included — same engine)', writingAfterEdge === 'false', writingAfterEdge);

  // === A1 — the Page face's subject wiring: a DIFFERENT page shows DIFFERENT
  // face content (subject-driven, not a hardcoded "current page"). ===========
  await freshJournalPage(app, 'AB3SUBJECTB');
  await app.evalJs("document.querySelector('.wz-drawer-pull-page').click()");
  await sleep(220);
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

  // === "the saved-silently footer exists only in the drawer" — its ONLY
  // appearance anywhere once framed. The width round-trip above unmounts and
  // remounts DeskFrame (and the Drawer inside it), so the face resets to
  // 'tools' — reopen the Page face before checking its footer.
  await app.evalJs("document.querySelector('.wz-drawer-pull-page').click()");
  await sleep(220);
  const footerOnlyInDrawer = await app.evalJs(`({
    outsideDrawerNote: !!document.querySelector('body > *:not(.desk-frame) .journal-autosave-note, .desk-frame-stagecol .journal-autosave-note'),
    inPageFace: document.querySelector('.wz-pageface-footer')?.textContent ?? null,
  })`);
  ok('S3/S2: the saved-silently line appears nowhere outside the drawer\'s Page face when framed',
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

  await app.evalJs("document.querySelector('.wz-drawer-pull-page').click()");
  await sleep(220);
  const projectHome = await app.evalJs("document.querySelector('.wz-pageface-home-label')?.textContent");
  ok('S4/S2: the Page face\'s Where-it-lives names the project by title (not the Journal)', projectHome?.startsWith('In ') && projectHome !== 'In the Journal', projectHome);

  await app.goto('/journal');
  await app.waitFor("!!document.querySelector('.journal-new-page')", { label: 'Journal list (project-origin check)' });
  // Scoped to .journal-row / the page container's own text — NOT
  // document.body, which also carries DeskRail's global resume pointer
  // (always the last-edited page, origin-agnostic) as a false-positive risk.
  const journalRowsProject = await app.evalJs(`({
    rowCount: document.querySelectorAll('.journal-row').length,
    pageText: document.querySelector('.page')?.innerText ?? '',
  })`);
  ok('S5: a project-origin page never appears in any Journal view — the Journal has never heard of it',
    journalRowsProject.rowCount === 0 && !journalRowsProject.pageText.includes('AB3ORIGINPROJECT'),
    JSON.stringify(journalRowsProject));

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
  // in ab2.mjs — 'loose' had no guard anywhere. ================================
  const looseRail = await app.evalJs(`({
    ink: !!document.querySelector('.desk-toolrail-inks'),
    forwardLock: !!document.querySelector('.desk-toolrail-forwardlock'),
    captureItems: [...document.querySelectorAll('.desk-toolrail-item')].map(i => i.textContent),
  })`);
  ok('R1(a): a LOOSE-origin page shows none of the journal furniture in Free Write (ink/forward-lock/capture items all absent)',
    !looseRail.ink && !looseRail.forwardLock && looseRail.captureItems.length === 0,
    JSON.stringify(looseRail));

  await app.evalJs("document.querySelector('.wz-drawer-pull-page').click()");
  await sleep(220);
  const looseHomeText = await app.evalJs("document.querySelector('.wz-pageface-home-label')?.textContent");
  ok('S4/DoD: the loose page\'s drawer text reads exactly "Loose — belongs nowhere yet"', looseHomeText === 'Loose — belongs nowhere yet', looseHomeText);

  // Anti-solicitation: no file-it-first prompt anywhere reachable from a
  // loose page (PageEditor.tsx carries no such prompt at all).
  const looseNeverNudged = await app.evalJs("!document.querySelector('.journal-tab-prompt')");
  ok('S4: a loose page is never nudged to file (no file-it-first prompt reachable)', looseNeverNudged);

  await app.goto('/journal');
  await app.waitFor("!!document.querySelector('.journal-new-page')", { label: 'Journal list (loose-origin check)' });
  // freshLoosePage's fixture is a fresh-desk, single-entry state (the loose
  // page itself, no text) — zero rows is the correct, unambiguous signal.
  const journalRowCountLoose = await app.evalJs("document.querySelectorAll('.journal-row').length");
  ok('S5/DoD: a loose page never appears in the Journal either (it homes nowhere, not there)', journalRowCountLoose === 0, String(journalRowCountLoose));

  // === S5 — the Journal forgets nothing: file a journal-born page to a NEW
  // project, assert it lists in BOTH the Journal and that project. ===========
  await freshDesk(app);
  await app.evalJs("document.querySelector('.dz-new').click()");
  await app.waitFor("!!document.querySelector('.dz-rename')", { label: 'new Drawer rename input' });
  await app.evalJs("document.querySelector('.dz-rename').blur()");
  await sleep(200);

  await journalPageHere(app, 'AB3FORGETSNOTHING');
  await app.evalJs("document.querySelector('.wz-drawer-pull-page').click()");
  await app.waitFor("!!document.querySelector('.wz-pageface-verb-movecopy')", { label: 'Page face (forgets-nothing fixture)' });
  await app.evalJs("document.querySelector('.wz-pageface-verb-movecopy').click()");
  await app.waitFor("!!document.querySelector('.board-sheet')", { label: 'Add to… sheet' });
  await app.evalJs("[...document.querySelectorAll('.board-dest-row')].find(el => el.textContent.includes('New Drawer')).click()");
  await app.waitFor("!!document.querySelector('.add-dest-row')", { label: 'drawer level (Add to…)' });
  await app.evalJs("[...document.querySelectorAll('.add-dest-row')].find(el => el.textContent.includes('Standalone')).click()");
  await sleep(400);

  const filedEntries = await app.localJSON('writer-studio-journal-entries');
  const filedEntry = filedEntries.find(e => e.text?.includes('AB3FORGETSNOTHING'));
  ok('S5: filing a journal-born page to a new project sets projectId, but origin stays \'journal\'',
    !!filedEntry?.projectId && filedEntry?.origin === 'journal', JSON.stringify(filedEntry));

  await app.goto('/journal');
  await app.waitFor("!!document.querySelector('.journal-new-page')", { label: 'Journal list (forgets-nothing check)' });
  const journalStillLists = (await app.evalJs("document.querySelector('.page')?.innerText ?? ''")).includes('AB3FORGETSNOTHING');
  ok('S5 DoD: a journal page filed to a project STILL turns up in the Journal (forgets nothing)', journalStillLists);

  await app.goto(`/project/${filedEntry.projectId}`);
  await app.waitFor("!!document.querySelector('.page')", { label: 'ProjectHome (forgets-nothing check)' });
  await sleep(200);
  const projectAlsoLists = (await app.evalJs("document.querySelector('.page')?.innerText ?? ''")).includes('AB3FORGETSNOTHING');
  ok('S5 DoD: the SAME page also lists in its new project — it appears in both places', projectAlsoLists);

  // Where-it-lives now tells BOTH truths. /page/:id always renders
  // PageEditor (its outer component only branches on pageType for board/
  // script) — this untyped-but-now-filed page reopens there.
  await app.goto(`/page/${filedEntry.id}`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'filed page reopened' });
  await sleep(200);
  await app.evalJs("document.querySelector('.wz-drawer-pull-page').click()");
  await sleep(220);
  const bothTruths = await app.evalJs(`({
    home: document.querySelector('.wz-pageface-home-label')?.textContent,
    memberships: [...document.querySelectorAll('.wz-pageface-membership')].map(el => el.textContent),
  })`);
  ok('S5/S2: Where-it-lives tells BOTH truths — homed in the project, "Also in the Journal."',
    bothTruths.home?.startsWith('In ') && bothTruths.home !== 'In the Journal' && bothTruths.memberships.includes('Also in the Journal.'),
    JSON.stringify(bothTruths));

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
  await app.waitFor("!!document.querySelector('.wz-desk')", { label: 'Desk after legacy seed' });
  await app.evalJs("location.hash = '#/page/ab3-legacy-page'");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'legacy null-origin page framed' });
  await sleep(200);
  const legacyRail = await app.evalJs(`({
    ink: !!document.querySelector('.desk-toolrail-inks'),
    forwardLock: !!document.querySelector('.desk-toolrail-forwardlock'),
    captureItems: [...document.querySelectorAll('.desk-toolrail-item')].map(i => i.textContent),
  })`);
  ok('S4 A2 (grandfather clause): a NULL-origin page (pre-AB3 data) keeps TODAY\'S furniture in Free Write — ink/forward-lock/capture items all present',
    legacyRail.ink && legacyRail.forwardLock && JSON.stringify(legacyRail.captureItems) === JSON.stringify(['Spark deck', 'Fragments', 'Send → Drawer']),
    JSON.stringify(legacyRail));

  // === ab3.1 R2 (Fable review) — presence is not function. The forward-lock
  // control's CLICK could unwire while the suite stayed green, since only
  // its presence was ever asserted. This fixture is fresh off freshDesk()
  // (localStorage cleared, reloaded) so wrizo-forward-lock hasn't been
  // written yet — load() falls to DEFAULT (true), matching today's shipped
  // behavior exactly. =========================================================
  const lockBefore = await app.evalJs("document.querySelector('.desk-toolrail-forwardlock')?.dataset.on");
  await app.evalJs("document.querySelector('.desk-toolrail-forwardlock').click()");
  await sleep(100);
  const lockAfter = await app.evalJs("document.querySelector('.desk-toolrail-forwardlock')?.dataset.on");
  const lockStorage = await app.evalJs("localStorage.getItem('wrizo-forward-lock')");
  ok('R2: clicking the forward-lock control actually flips dataset.on AND writes wrizo-forward-lock (function, not just presence)',
    lockBefore === 'true' && lockAfter === 'false' && lockStorage === '0',
    `${lockBefore} -> ${lockAfter}, storage=${lockStorage}`);

  // === ab3.1 R3 (Fable review) — the active pull's olive, the ab2.1 F3
  // pattern: a negative assert while olive stays a working value (graduates
  // to a positive assert when the Plateau token locks). ========================
  await app.evalJs("document.querySelector('.wz-drawer-pull-page').click()");
  await sleep(220);
  const pullColor = await app.evalJs("getComputedStyle(document.querySelector('.wz-drawer-pull.active')).borderColor");
  ok('R3: the drawer\'s active pull is not brass (olive/--accent-rest per the foundations)',
    pullColor !== 'rgb(255, 152, 0)', pullColor);

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ===========
// AB3 parks nothing of its OWN out of this file (every check above reflects
// this ticket's live, current design) — the checks AB3 itself supersedes
// belonged to AB1/AB2 and are parked in THEIR OWN files (ab2.mjs's PARKED
// section), per the established precedent (ab1.mjs parks what AB2
// superseded; ab2.mjs now parks what AB3 supersedes). This scaffold exists
// so a future ticket that supersedes any of THIS file's checks has a
// documented home to move them into, matching ab1.mjs/ab2.mjs's own
// pattern. Nothing to run today.
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log('\nAB3 PARKED: gate is armed (HARNESS_PARKED=1) but empty — nothing has been parked out of ab3.mjs. See this file\'s header comment.');
}

const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nAB3 VERIFY: PASS (${checks.length} checks)` : `\nAB3 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
