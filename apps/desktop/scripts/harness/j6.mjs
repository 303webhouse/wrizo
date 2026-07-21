// J6 — One Paper (docs/wrizo-alpha/j6-one-paper-brief.md). A committed CDP
// verification scenario (per this project's own "harness scenarios
// persist" convention). `freshDesk`/`freshProsePage`/`freshLoosePage`/
// `rectOf`/`clickAt` below are copied VERBATIM from their most recently
// evolved committed versions (m2.mjs / cd2.mjs / fx8.mjs), per this
// project's own standing instruction not to re-derive these from scratch.
// Run: node scripts/harness/j6.mjs   (from apps/desktop, with dist-web
// freshly built via `pnpm run build:web`).
//
// SECTION A (S1) — the geometry substrate (item 47's fix,
// store/deskFrameActive.ts). REPRODUCE-BEFORE-FIX DISCLOSURE (this file
// can only run against the already-fixed tree, so the actual before/after
// numbers are recorded here in full, not just asserted): a scratch repro
// (freshDesk -> create Page A -> create Page B in-app -> read
// data-desk-frame-active + .app-main padding-left + .mode-page rect ->
// compare against the SAME reading taken after a hard `app.reload()` while
// location.hash already pointed at a framed page) reproduced the defect
// BEFORE the fix: a fresh reload landing directly on an already-framed
// route read `data-desk-frame-active="false"` / `padding-left:64px` /
// `.mode-page` rect `left:364.3125` — while an in-app-only revisit of the
// same page read `data-desk-frame-active="true"` / `padding-left:0px` /
// `left:332.3125` (a confirmed, reproducible ~32px divergence: MATCH:
// false, both directions). AFTER the fix (store/deskFrameActive.ts now on
// useSyncExternalStore), the identical repro reads `true`/`0px`/`332.3125`
// on BOTH sides (MATCH: true). Root cause: the old useState+useEffect
// subscription had a genuine missed-notification race whenever a
// DeskFrame instance and its own subscribers (App.tsx's AppMain/
// GlobalHeader, DeskRail.tsx) mount in the SAME commit — i.e. specifically
// when the app's first-ever render lands directly on an already-framed
// route (a hard reload with location.hash pre-set, e.g. this file's own
// `freshRhizomePage`-shaped fixture, m2.mjs's own repro vector). See
// store/deskFrameActive.ts's own header comment for the full mechanism.
//
// SECTION B (S2) — routeForEntry: behavioral identity, both at the
// function level (a representative entry of every kind, against the
// literal predicate the brief quotes byte-for-byte) and at every migrated
// call site, proven via REAL navigation (not by reading the helper
// twice): BoardEditor.tsx's travelToEntry (both the page-pin AND ported-
// card branches — re-proving the board pin's double-click travel, FX7 S5,
// and a ported card's travel, FX5 S3, unregressed), CascadePanels.tsx's
// own routeFor call sites, ProjectHome.tsx's own pageRoute call sites,
// JournalEntry.tsx's own pageType redirect guard, and Spread.tsx's
// openPage (including the specific edge case this ticket's own S2 commit
// message disclosed: a loose, non-board-typed entry reachable through
// getNotebookPages() now lands directly on /page/:id instead of bouncing
// through /journal/:id first). Both "New Page" doors (Journal's own,
// createLoosePage -> /journal/:id; the cascade Page-section's, via
// createLooseHomePage -> /page/:id) re-proven unregressed — neither call
// site was touched by S2 (both are non-goals: a freshly-created page
// navigating to its own known route is not a predicate).
//
// SECTION C — legacy (<1100px) stays byte-identical: no DeskFrame, no
// gutter change, and every migrated call site still routes correctly
// below the gate too.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const FLOOR_W = 1100; // DESKFRAME_MIN_WIDTH — the mandatory floor, never skipped
const LAPTOP_W = 1280;
const WIDE_W = 2200;
const LEGACY_W = 900;

// --- fixtures, copied verbatim from their most recently evolved committed
// versions (m2.mjs / cd2.mjs / fx8.mjs) -------------------------------------
const freshDesk = async (app, width = 1400, height = 900) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
};

const freshProsePage = async (app, width = 1400, height = 900) => {
  await freshDesk(app, width, height);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book)' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, framed' });
  await sleep(400);
  const hash = await app.evalJs('location.hash');
  return hash.replace(/^#\/page\//, '');
};

// cd2.mjs's own freshLoosePage, copied verbatim: the Desk's start-writing /
// home-base door — a loose page, homing nowhere.
const freshLoosePage = async (app, width = 1400, height = 900) => {
  await freshDesk(app, width, height);
  await app.evalJs("document.querySelector('.wz-arrival-write').click()");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, framed (loose)' });
  await sleep(300);
  const hash = await app.evalJs('location.hash');
  return hash.replace(/^#\/page\//, '');
};

// fx8.mjs's own rectOf/clickAt, copied verbatim.
const rectOf = (app, sel) => app.evalJs(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); return el ? el.getBoundingClientRect().toJSON() : null; })()`);
const clickAt = async (app, x, y) => { await app.mouseDown(x, y); await sleep(30); await app.mouseUp(x, y); };

// AGENTS.md's own harness-seeding law (the flushNow race, MEMORY.md's
// "Harness seeding vs. flushNow race"): seed ONLY while on the Desk (no
// writing surface with a flush-on-unmount effect mounted) to avoid a
// silent clobber on the next reload. Every seeding call below goes through
// this helper, which asserts the precondition.
const seedFromDesk = async (app, mutate) => {
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'seedFromDesk precondition: on the Desk' });
  await app.evalJs(mutate);
};

// The gutter/geometry reading this whole file's S1 section is built on:
// the DeskRail-gutter flag, its CSS effect, and the paper's own absolute
// rect (when a framed writing surface is mounted).
const readGeometry = (app) => app.evalJs(`(() => {
  const main = document.querySelector('.app-main');
  const paper = document.querySelector('.mode-page');
  return {
    deskFrameActive: main ? main.getAttribute('data-desk-frame-active') : null,
    mainPaddingLeft: main ? getComputedStyle(main).paddingLeft : null,
    hasDeskFrame: !!document.querySelector('.desk-frame'),
    paperRect: paper ? (() => { const r = paper.getBoundingClientRect(); return { left: r.left, top: r.top, width: r.width }; })() : null,
  };
})()`);

await withHarness(async (app) => {
  // ==========================================================================
  // SECTION A — S1: the geometry substrate. At each of the three mandatory
  // widths (1100 floor, 1280, 2200): a fresh reload landing DIRECTLY on an
  // already-framed route reads identically to an in-app-only navigation to
  // an equivalent freshly-created framed page — the literal "an absolute
  // paper-rect read after an in-app navigation to a framed route equals a
  // fresh-mount read of the same state" requirement.
  // ==========================================================================
  for (const width of [FLOOR_W, LAPTOP_W, WIDE_W]) {
    // (a) In-app path: Desk -> create Page A (in-app navigation into the
    // FIRST framed route of this app-load, exactly the path every ordinary
    // Write door takes) -> read geometry.
    const pageAId = await freshProsePage(app, width, 900);
    const inAppGeom = await readGeometry(app);

    // (b) Fresh-reload path: reload the WHOLE app while location.hash
    // already points at a framed route -- the exact trigger this ticket's
    // own reproduce-before-fix repro used (and the shape freshRhizomePage-
    // style fixtures across the suite already rely on, e.g. m2.mjs's own
    // determinism fixture). Same page, so this is also literally "revisits
    // a framed route" in the brief's own words.
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: `fresh reload onto Page A @ ${width}` });
    await sleep(300);
    const freshReloadGeom = await readGeometry(app);

    ok(`S1 @ ${width}px: a fresh reload landing directly on an already-framed route reads data-desk-frame-active="true" (DeskFrame genuinely mounted, not stuck reading the pre-navigation value)`,
      freshReloadGeom.deskFrameActive === 'true' && freshReloadGeom.mainPaddingLeft === '0px', JSON.stringify(freshReloadGeom));
    ok(`S1 @ ${width}px: that fresh-reload reading is BYTE-IDENTICAL to the in-app-navigation reading of the same page (the actual S1 requirement) -- no constant horizontal offset`,
      JSON.stringify(freshReloadGeom) === JSON.stringify(inAppGeom), JSON.stringify({ inAppGeom, freshReloadGeom }));

    // (c) The "revisits a framed route" shape more literally: from THIS
    // already-framed page, navigate in-app to a SECOND, freshly-created
    // framed page (a keyed remount, PageEditor's own `key={id}`) -- proves
    // the fix holds across an ordinary page-to-page navigation, not just
    // the single reload-triggered window.
    await app.goto('/project/new');
    await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: `CreateProject picker (book) 2 @ ${width}` });
    await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
    await app.click('Start writing');
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: `PageEditor B mounted @ ${width}` });
    await sleep(300);
    const pageBHash = await app.evalJs('location.hash');
    const revisitGeom = await readGeometry(app);
    ok(`S1 @ ${width}px: an ORDINARY in-app page-to-page navigation (Page A -> a second, freshly-created framed Page B) ALSO reads correctly (data-desk-frame-active="true", padding-left:0px)`,
      revisitGeom.deskFrameActive === 'true' && revisitGeom.mainPaddingLeft === '0px' && pageBHash.includes('/page/') && !pageBHash.includes(pageAId),
      JSON.stringify({ revisitGeom, pageBHash, pageAId }));

    // (d) Cross-check against a genuinely fresh reload directly onto Page B
    // (a SECOND independent "fresh mount" reading) -- proves (c)'s reading
    // isn't coincidentally right only because of A's own earlier state.
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: `fresh reload onto Page B @ ${width}` });
    await sleep(300);
    const freshBGeom = await readGeometry(app);
    ok(`S1 @ ${width}px: Page B's own fresh-mount reading matches its in-app-arrived-at reading too (both directions proven, not just A->B)`,
      JSON.stringify(freshBGeom) === JSON.stringify(revisitGeom), JSON.stringify({ freshBGeom, revisitGeom }));
  }

  // ==========================================================================
  // SECTION B — S2: routeForEntry behavioral identity.
  // ==========================================================================

  // --- B1: function-level, a representative entry of every kind, against
  // the literal predicate the brief quotes byte-for-byte (pageType != null
  // -> /page/:id, else /journal/:id). Via the window.__wrizoRouteForEntry
  // test seam (store/routeForEntry.ts's own header comment) -- proving the
  // CANONICAL SOURCE live, not a second hand re-derivation of the same
  // rule inside this harness. ------------------------------------------------
  await freshDesk(app, LAPTOP_W, 900);
  {
    const kinds = [
      { label: 'plain prose (loose, no pageType, no origin)', entry: { id: 'k-plain-prose' }, expected: '/journal/k-plain-prose' },
      { label: 'journal-homed loose (origin:journal, no pageType)', entry: { id: 'k-journal-loose', origin: 'journal' }, expected: '/journal/k-journal-loose' },
      { label: 'binder manuscript (pageType:manuscript, filed)', entry: { id: 'k-manuscript', pageType: 'manuscript', projectId: 'some-project' }, expected: '/page/k-manuscript' },
      { label: 'board (pageType:board)', entry: { id: 'k-board', pageType: 'board' }, expected: '/page/k-board' },
      { label: 'script (pageType:script)', entry: { id: 'k-script', pageType: 'script' }, expected: '/page/k-script' },
    ];
    for (const k of kinds) {
      const got = await app.evalJs(`window.__wrizoRouteForEntry(${JSON.stringify(k.entry)})`);
      ok(`S2 (function-level): ${k.label} -> routeForEntry returns exactly what today's inline predicate returns ("${k.expected}")`,
        got === k.expected, JSON.stringify({ got, expected: k.expected }));
    }
  }

  // --- B2: BoardEditor.tsx's travelToEntry -- both the page-pin AND
  // ported-card branches, one board fixture covering manuscript / loose /
  // board / script / MISSING kinds via real double-click navigation. Also
  // the FX7 S5 (board pin double-click travel) and FX5 S3 (ported card
  // travel) regression re-proofs S4 explicitly asks for. -------------------
  {
    await freshDesk(app, LAPTOP_W, 900);
    await seedFromDesk(app, `(() => {
      const now = new Date().toISOString();
      const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
      entries.push({ id: 'j6-b2-manuscript', text: 'A Manuscript Page', pageType: 'manuscript', projectId: 'j6-b2-project', source: 'page', createdAt: now, updatedAt: now });
      entries.push({ id: 'j6-b2-loose', text: 'A Loose Journal Page', origin: 'journal', source: 'page', createdAt: now, updatedAt: now });
      entries.push({ id: 'j6-b2-boardtarget', text: 'Another Board', pageType: 'board', boxes: [], source: 'page', createdAt: now, updatedAt: now });
      entries.push({ id: 'j6-b2-script', text: '', pageType: 'script', script: { v: 1, scenes: [{ id: 'j6-b2-heading', heading: { id: 'j6-b2-heading', t: 'scene', text: '' }, body: [] }] }, source: 'page', createdAt: now, updatedAt: now });
      entries.push({
        id: 'j6-b2-board', text: 'J6 Travel Board', pageType: 'board', source: 'page', createdAt: now, updatedAt: now,
        boxes: [
          { id: 'pin-manuscript', kind: 'page-pin', x: 0.05, y: 0.05, w: 0.28, h: 0.12, z: 1, entryId: 'j6-b2-manuscript' },
          { id: 'pin-loose', kind: 'page-pin', x: 0.05, y: 0.20, w: 0.28, h: 0.12, z: 1, entryId: 'j6-b2-loose' },
          { id: 'pin-board', kind: 'page-pin', x: 0.05, y: 0.35, w: 0.28, h: 0.12, z: 1, entryId: 'j6-b2-boardtarget' },
          { id: 'pin-missing', kind: 'page-pin', x: 0.05, y: 0.50, w: 0.28, h: 0.12, z: 1, entryId: 'j6-b2-does-not-exist' },
          { id: 'ported-script', kind: 'text', x: 0.4, y: 0.05, w: 0.28, h: 0.12, z: 1, text: 'Ported excerpt', sourceEntryId: 'j6-b2-script' },
        ],
      });
      localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
    })()`);
    await app.reload();
    await app.evalJs("location.hash = '#/page/j6-b2-board'");
    await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'J6 travel board mounted' });
    await sleep(300);
    await app.emulateDpr(1, LAPTOP_W, 900);

    const travelCases = [
      { box: 'pin-manuscript', expectHash: '#/page/j6-b2-manuscript', label: "S2/FX7 S5 board-pin travel (unregressed): a page-pin to a MANUSCRIPT entry double-click-travels to /page/:id" },
      { box: 'pin-loose', expectHash: '#/journal/j6-b2-loose', label: 'S2/FX7 S5 board-pin travel (unregressed): a page-pin to a LOOSE journal entry double-click-travels to /journal/:id' },
      { box: 'pin-board', expectHash: '#/page/j6-b2-boardtarget', label: 'S2/FX7 S5 board-pin travel (unregressed): a page-pin to a BOARD entry double-click-travels to /page/:id' },
      { box: 'ported-script', expectHash: '#/page/j6-b2-script', label: 'S2/FX5 S3 ported-card travel (unregressed): a ported (sourceEntryId) card to a SCRIPT entry double-click-travels to /page/:id' },
    ];
    for (const tc of travelCases) {
      await app.evalJs("location.hash = '#/page/j6-b2-board'");
      await app.waitFor("!!document.querySelector('.board-canvas')", { label: `back on J6 travel board before ${tc.box}` });
      await sleep(250);
      const r = await rectOf(app, `[data-box-id="${tc.box}"]`);
      await app.doubleClick(Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2));
      await sleep(300);
      const hash = await app.evalJs('location.hash');
      ok(tc.label, hash === tc.expectHash, hash);
    }
    // The missing/deleted entry kind: a page-pin whose target no longer
    // exists (or never did) must not navigate at all -- travelToEntry's own
    // `if (!target) return;` guard, unregressed by the routeForEntry swap.
    await app.evalJs("location.hash = '#/page/j6-b2-board'");
    await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'back on J6 travel board before pin-missing' });
    await sleep(250);
    const hashBeforeMissing = await app.evalJs('location.hash');
    const rMissing = await rectOf(app, '[data-box-id="pin-missing"]');
    await app.doubleClick(Math.round(rMissing.x + rMissing.width / 2), Math.round(rMissing.y + rMissing.height / 2));
    await sleep(300);
    const hashAfterMissing = await app.evalJs('location.hash');
    ok('S2 (missing/deleted kind): a page-pin whose target entry does not exist double-clicks to a no-op (travelToEntry\'s own guard) -- hash unchanged, no crash',
      hashAfterMissing === hashBeforeMissing, JSON.stringify({ hashBeforeMissing, hashAfterMissing }));
  }

  // --- B3: CascadePanels.tsx's routeFor call sites (now routeForEntry) --
  // the Journal category's own "recent" list, for a TYPED entry (proving
  // the migration: this used to be an unconditional /journal/${e.id} in
  // the OLD CascadePanels.tsx-local `routeFor`... no -- CascadePanels.tsx's
  // OWN routeFor already had the correct predicate pre-migration; this
  // proves the MIGRATED call still produces the SAME correct result via
  // real navigation) and an untyped entry. --------------------------------
  for (const [id, entryText, expectHash, label] of [
    ['j6-b3-untyped', 'An Untyped Recent Page', '#/journal/j6-b3-untyped', "S2 CascadePanels.tsx (migrated routeFor -> routeForEntry): the Journal category's own 'recent' list travels an UNTYPED entry to /journal/:id"],
    ['j6-b3-typed', 'A Typed Recent Page', '#/page/j6-b3-typed', "S2 CascadePanels.tsx (migrated routeFor -> routeForEntry): the Journal category's own 'recent' list travels a TYPED entry to /page/:id"],
  ]) {
    // A fully fresh setup per entry (rather than reusing one session across
    // both clicks) -- simpler and more robust than trying to navigate the
    // cascade panel back open after the first click travels away from it.
    await freshDesk(app, LAPTOP_W, 900);
    await seedFromDesk(app, `(() => {
      const now = new Date().toISOString();
      const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
      entries.push({ id: ${JSON.stringify(id)}, text: ${JSON.stringify(entryText)}, ${id === 'j6-b3-typed' ? "pageType: 'note', " : ''}origin: 'journal', source: 'page', createdAt: now, updatedAt: now });
      localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
    })()`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after B3 seed' });
    await app.evalJs("document.querySelector('.wz-arrival-write').click()");
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'B3 scratch loose page mounted' });
    await sleep(300);
    await app.evalJs("[...document.querySelectorAll('.wz-strip-item')][0].click()"); // Journal category, index 0
    await app.waitFor("document.querySelectorAll('.wz-cascade-list-item').length >= 1", { label: 'Journal recent list populated' });
    const idx = await app.evalJs(`[...document.querySelectorAll('.wz-cascade-list-item')].findIndex(el => el.textContent.includes(${JSON.stringify(entryText)}))`);
    if (idx < 0) {
      const titles = await app.evalJs("[...document.querySelectorAll('.wz-cascade-list-title')].map(b => b.textContent)");
      ok(label, false, `list item not found; titles=${JSON.stringify(titles)}`);
      continue;
    }
    await app.evalJs(`[...document.querySelectorAll('.wz-cascade-list-title')][${idx}].click()`);
    await sleep(300);
    const hash = await app.evalJs('location.hash');
    ok(label, hash === expectHash, hash);
  }

  // --- B4: ProjectHome.tsx's pageRoute call sites (now routeForEntry) --
  // a manuscript chapter, a TYPED support page, and a LEGACY UNTYPED filed
  // page (reachable today: ProjectHome's own `support` filter is "not
  // manuscript, not script" -- a pageType-less filed page falls in there
  // too) -- proving all three Link destinations. ---------------------------
  {
    await freshDesk(app, LAPTOP_W, 900);
    await seedFromDesk(app, `(() => {
      const now = new Date().toISOString();
      const projects = JSON.parse(localStorage.getItem('writer-studio-projects') || '[]');
      projects.push({ id: 'j6-b4-project', title: 'J6 ProjectHome Test', type: 'creative', storyPlanId: null, createdAt: now, updatedAt: now });
      localStorage.setItem('writer-studio-projects', JSON.stringify(projects));
      const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
      entries.push({ id: 'j6-b4-chapter', text: 'Chapter One', pageType: 'manuscript', projectId: 'j6-b4-project', source: 'page', createdAt: now, updatedAt: now });
      entries.push({ id: 'j6-b4-support-typed', text: 'A Character', pageType: 'character', projectId: 'j6-b4-project', source: 'page', createdAt: now, updatedAt: now });
      entries.push({ id: 'j6-b4-support-legacy', text: 'A Legacy Filed Page', projectId: 'j6-b4-project', source: 'page', createdAt: now, updatedAt: now });
      localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
    })()`);
    await app.reload();
    await app.evalJs("location.hash = '#/project/j6-b4-project'");
    await app.waitFor("!!document.querySelector('.dz-tree')", { label: 'ProjectHome mounted' });
    await sleep(300);
    for (const [text, expectHash, label] of [
      ['Chapter One', '#/page/j6-b4-chapter', 'S2 ProjectHome.tsx (migrated pageRoute -> routeForEntry): a Manuscript chapter row travels to /page/:id'],
      ['A Character', '#/page/j6-b4-support-typed', 'S2 ProjectHome.tsx (migrated pageRoute -> routeForEntry): a TYPED support-page row travels to /page/:id'],
      ['A Legacy Filed Page', '#/journal/j6-b4-support-legacy', 'S2 ProjectHome.tsx (migrated pageRoute -> routeForEntry): a LEGACY UNTYPED filed-page row (reachable today via the "support" filter\'s own "not manuscript, not script" catch-all) travels to /journal/:id, not /page/:id'],
    ]) {
      const idx = await app.evalJs(`[...document.querySelectorAll('.dz-rowtitle')].findIndex(el => el.textContent.includes(${JSON.stringify(text)}))`);
      if (idx < 0) { ok(label, false, 'row not found'); continue; }
      await app.evalJs(`[...document.querySelectorAll('.dz-rowtitle')][${idx}].click()`);
      await sleep(300);
      const hash = await app.evalJs('location.hash');
      ok(label, hash === expectHash, hash);
      await app.evalJs("location.hash = '#/project/j6-b4-project'");
      await app.waitFor("!!document.querySelector('.dz-tree')", { label: `back on ProjectHome after ${text}` });
      await sleep(250);
    }
  }

  // --- B5: JournalEntry.tsx's own pageType redirect guard (now routed
  // through routeForEntry) -- re-proven unregressed: a typed entry opened
  // at /journal/:id still bounces straight to /page/:id. -------------------
  {
    await freshDesk(app, LAPTOP_W, 900);
    await seedFromDesk(app, `(() => {
      const now = new Date().toISOString();
      const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
      entries.push({ id: 'j6-b5-typed', text: 'A Typed Entry', pageType: 'research', source: 'page', createdAt: now, updatedAt: now });
      localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
    })()`);
    await app.reload();
    await app.evalJs("location.hash = '#/journal/j6-b5-typed'");
    await sleep(400);
    const hash = await app.evalJs('location.hash');
    ok("S2 JournalEntry.tsx's own pageType redirect guard (re-proven unregressed): a typed entry opened at /journal/:id bounces straight to /page/:id",
      hash === '#/page/j6-b5-typed', hash);
  }

  // --- B6: JournalEntry.tsx's own neighbour navigation (keyboard walk +
  // both '<'/'>' chip pairs, now routed through routeForEntry) -- the
  // typical loose-untyped case stays /journal/:id, both framed and legacy. ---
  {
    await freshDesk(app, LAPTOP_W, 900);
    await seedFromDesk(app, `(() => {
      const now = new Date().toISOString();
      const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
      entries.push({ id: 'j6-b6-a', text: 'Notebook A', origin: 'journal', orderIndex: 1000, source: 'page', createdAt: now, updatedAt: now });
      entries.push({ id: 'j6-b6-b', text: 'Notebook B', origin: 'journal', orderIndex: 2000, source: 'page', createdAt: now, updatedAt: now });
      localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
    })()`);
    await app.reload();
    await app.evalJs("location.hash = '#/journal/j6-b6-a'");
    await app.waitFor("!!document.querySelector('.entry-full')", { label: 'J6 B6 notebook page A mounted' });
    await sleep(300);
    // Framed chip.
    await app.evalJs("document.querySelector('.journal-nav-btn:not(.journal-nav-add):not([disabled])').click()");
    await sleep(300);
    const hashAfterChip = await app.evalJs('location.hash');
    ok("S2 JournalEntry.tsx's own neighbour-navigation chip (framed, migrated navigate(`/journal/${...}`) -> routeForEntry): still travels to /journal/:id for an ordinary loose-untyped neighbour",
      hashAfterChip === '#/journal/j6-b6-b', hashAfterChip);

    // Keyboard walk (ArrowLeft, same A/B pair) -- JournalEntry.tsx's own
    // guard bails when an editable is focused (`t.isContentEditable`), and
    // page B's own authored sheet auto-focuses on mount, so the editable
    // must be blurred first to reach the SAME real-user posture (arrow
    // keys pressed while not mid-caret).
    await app.evalJs("document.activeElement && document.activeElement.blur && document.activeElement.blur()");
    await sleep(100);
    await app.key('ArrowLeft');
    await sleep(300);
    const hashAfterArrow = await app.evalJs('location.hash');
    ok("S2 JournalEntry.tsx's own neighbour-navigation keyboard walk (migrated navigate(`/journal/${...}`) -> routeForEntry): ArrowLeft still travels back to /journal/:id for an ordinary loose-untyped neighbour",
      hashAfterArrow === '#/journal/j6-b6-a', hashAfterArrow);
  }

  // --- B7: Spread.tsx's openPage (migrated from an unconditional
  // /journal/${id} to routeForEntry via the already-fetched `pages` list)
  // -- the typical loose-untyped case, AND the specific edge case this
  // ticket's own S2 disclosed: a loose page with a non-board pageType
  // (reachable through getNotebookPages()'s own "not board" filter) now
  // lands DIRECTLY on /page/:id instead of bouncing through /journal/:id
  // first. --------------------------------------------------------------
  {
    await freshDesk(app, LAPTOP_W, 900);
    await seedFromDesk(app, `(() => {
      const now = new Date().toISOString();
      const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
      entries.push({ id: 'j6-b7-plain', text: 'Spread Plain', origin: 'journal', orderIndex: 1000, source: 'page', createdAt: now, updatedAt: now });
      // An unfiled manuscript page, still loose (projectId null) -- the
      // exact reachable-today edge case: getNotebookPages() only excludes
      // pageType:'board', so this DOES appear in the Spread grid.
      entries.push({ id: 'j6-b7-unfiled-manuscript', text: 'Spread Unfiled Manuscript', origin: 'journal', pageType: 'manuscript', orderIndex: 2000, source: 'page', createdAt: now, updatedAt: now });
      localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
    })()`);
    await app.reload();
    await app.evalJs("location.hash = '#/journal/spread'");
    await app.waitFor("document.querySelectorAll('.spread-page button').length > 0", { label: 'Spread mounted' });
    await sleep(300);
    for (const [text, expectHash, label] of [
      ['Spread Plain', '#/journal/j6-b7-plain', "S2 Spread.tsx (migrated openPage -> routeForEntry): an ordinary loose-untyped cell still travels to /journal/:id"],
      ['Spread Unfiled Manuscript', '#/page/j6-b7-unfiled-manuscript', "S2 Spread.tsx (migrated openPage -> routeForEntry): a loose page with a non-board pageType now lands DIRECTLY on /page/:id -- no more bounce through JournalEntry's own redirect guard first"],
    ]) {
      const idx = await app.evalJs(`[...document.querySelectorAll('.spread-page button')].findIndex(el => el.textContent.includes(${JSON.stringify(text)}))`);
      if (idx < 0) { ok(label, false, 'spread cell not found'); continue; }
      await app.evalJs(`[...document.querySelectorAll('.spread-page button')][${idx}].click()`);
      await sleep(300);
      const hash = await app.evalJs('location.hash');
      ok(label, hash === expectHash, hash);
      await app.evalJs("location.hash = '#/journal/spread'");
      await app.waitFor("document.querySelectorAll('.spread-page button').length > 0", { label: `back on Spread after ${text}` });
      await sleep(250);
    }
  }

  // --- Both "New Page" doors, re-proven unregressed (neither touched by
  // S2 -- a freshly-created page navigating to its own known route is not
  // a predicate). -----------------------------------------------------------
  {
    // The Journal's own door: JournalEntry.tsx's own '+' append chip
    // (createLoosePage -> /journal/:id).
    await freshDesk(app, LAPTOP_W, 900);
    await seedFromDesk(app, `(() => {
      const now = new Date().toISOString();
      const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
      entries.push({ id: 'j6-journal-new-page-seed', text: 'Seed', origin: 'journal', orderIndex: 1000, source: 'page', createdAt: now, updatedAt: now });
      localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
    })()`);
    await app.reload();
    await app.evalJs("location.hash = '#/journal/j6-journal-new-page-seed'");
    await app.waitFor("!!document.querySelector('.journal-nav-add')", { label: "Journal's own '+' door present" });
    await sleep(300);
    await app.evalJs("document.querySelector('.journal-nav-add').click()");
    await sleep(400);
    const hashAfterJournalNewPage = await app.evalJs('location.hash');
    ok("Door re-proof: the Journal's own New Page door ('+' append, createLoosePage) still lands on /journal/:id, unregressed",
      hashAfterJournalNewPage.startsWith('#/journal/') && hashAfterJournalNewPage !== '#/journal/j6-journal-new-page-seed', hashAfterJournalNewPage);

    // The cascade's Page-section door (createLooseHomePage -> /page/:id).
    await freshProsePage(app, LAPTOP_W, 900);
    await app.evalJs("[...document.querySelectorAll('.wz-strip-item')][1].click()"); // Page category, index 1
    await app.waitFor("!!document.querySelector('.wz-cascade-action-door')", { label: "cascade Page-section New Page door present" });
    const hashBeforeCascadeNewPage = await app.evalJs('location.hash');
    await app.evalJs("document.querySelector('.wz-cascade-action-door').click()");
    await sleep(400);
    const hashAfterCascadeNewPage = await app.evalJs('location.hash');
    ok("Door re-proof: the cascade's Page-section New Page door (createLooseHomePage) still lands on /page/:id, unregressed",
      hashAfterCascadeNewPage.startsWith('#/page/') && hashAfterCascadeNewPage !== hashBeforeCascadeNewPage, JSON.stringify({ hashBeforeCascadeNewPage, hashAfterCascadeNewPage }));
  }

  // ==========================================================================
  // SECTION C — legacy (<1100px) stays byte-identical.
  // ==========================================================================
  {
    await freshDesk(app, LEGACY_W, 900);
    await seedFromDesk(app, `(() => {
      const now = new Date().toISOString();
      const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
      entries.push({ id: 'j6-legacy-typed', text: 'Legacy Typed', pageType: 'note', source: 'page', createdAt: now, updatedAt: now });
      entries.push({ id: 'j6-legacy-untyped', text: 'Legacy Untyped', origin: 'loose', source: 'page', createdAt: now, updatedAt: now });
      localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
    })()`);
    await app.reload();
    await app.evalJs("location.hash = '#/journal/j6-legacy-untyped'");
    await app.waitFor("!!document.querySelector('.entry-full')", { label: 'legacy untyped entry mounted' });
    await sleep(300);
    const legacyGeom = await readGeometry(app);
    ok('Legacy (<1100px): no DeskFrame ever mounts, and the gutter stays at its own untouched default (data-desk-frame-active="false", padding-left:64px) -- S1\'s fix never engages below the gate',
      !legacyGeom.hasDeskFrame && legacyGeom.deskFrameActive === 'false' && legacyGeom.mainPaddingLeft === '64px', JSON.stringify(legacyGeom));

    // S2's redirect guard still fires below the gate too (JournalEntry.tsx
    // renders its OWN legacy JSX branch, but the guard itself runs before
    // either branch, framed or not).
    await app.evalJs("location.hash = '#/journal/j6-legacy-typed'");
    await sleep(400);
    const legacyRedirectHash = await app.evalJs('location.hash');
    ok('Legacy (<1100px): the pageType redirect guard (now routed through routeForEntry) still bounces a typed entry to /page/:id below the gate',
      legacyRedirectHash === '#/page/j6-legacy-typed', legacyRedirectHash);
  }

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nJ6 VERIFY: PASS (${checks.length} checks)` : `\nJ6 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
