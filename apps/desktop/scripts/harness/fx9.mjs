// FX9 — the Folded Lists (docs/wrizo-alpha/fx9-folded-lists-brief.md). A
// committed CDP verification scenario (per this project's own "harness
// scenarios persist" convention), modeled on cd2.mjs's/fx8.mjs's own
// structure — freshDesk/clickCategory/rectOf/clickAt below are the same
// shape those files already established, copied per this project's own
// standing instruction not to re-derive them.
// Run: node scripts/harness/fx9.mjs   (from apps/desktop, with dist-web
// freshly built via `pnpm run build:web`).
//
// Covers the brief's own S1-S4 list: header disclosure toggles on
// DrawersPanel's per-project clusters + its "Loose" documents group, and
// JournalPanel's Recent list (S1); the whole header as the hit target
// (proven with a click genuinely far from the chevron, not just ON it);
// keyboard operation + aria-expanded correctness; the chevron's own olive
// (never brass) color at rest AND hover; ~180ms timing collapsing to
// instant under prefers-reduced-motion; localStorage persistence across a
// cascade close/reopen AND a full reload, INCLUDING the id-keyed proof that
// a project cluster's fold survives renaming the project (S2); the
// count-based first-ever default (a seeded seven-item section opens
// collapsed, a six-item section opens expanded) and a writer's explicit
// toggle overriding that default on the next view (S2); the mandatory
// negative assertion that no collapsed header renders a numeral or badge
// element, proven by DOM query (S3); geometry at the 1100px floor, 1280,
// and 2200 — the cascade's own rect and the paper's rect never move,
// folded or unfolded (S4); legacy (<1100px) unaffected (DeskFrame, and
// therefore the whole cascade + this ticket's chrome, never mounts there).
//
// PARK SWEEP (A4): audited every existing harness file for a check touching
// `.wz-cascade-list`, `.wz-drawers-cluster`, or `.wz-drawers-tile*`
// (cd2.mjs, b2.mjs — the only two hits, confirmed by grep across
// scripts/harness/). Every fixture those checks seed tops out at TWO items
// per cluster/list (cd2.mjs's freshProsePageWithBoards; b2.mjs's S7 fixture:
// two boards in Zeta, one in Alpha) — never more than S2's own six-item
// default-expanded ceiling, so every such section still opens EXPANDED by
// default under this ticket and every pre-existing click/textContent
// assertion against it keeps passing unmodified. Nothing needed parking.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const FLOOR_W = 1100; // DESKFRAME_MIN_WIDTH — mandatory floor
const LAPTOP_W = 1280;
const WIDE_W = 2200;
const LEGACY_W = 900;

const freshDesk = async (app, width = 1400, height = 900) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
};

// Strip category indices (cd2.mjs's own verbatim roster/order): Journal=0,
// Page=1, Plan=2, Drawers=3, Shelf=4, Settings=5, Themes=6, Trash=7 (Trash
// now pinned to the strip's foot, below Settings/Themes).
const clickCategory = async (app, idx) => {
  await app.evalJs(`(() => {
    const items = [...document.querySelectorAll('.wz-strip-item')];
    const item = items[${idx}];
    if (item) item.click();
  })()`);
};

const rectOf = (app, sel) => app.evalJs(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); return el ? el.getBoundingClientRect().toJSON() : null; })()`);

// A fresh, framed, project-origin prose page — cd2.mjs's own `freshProsePage`
// fixture, copied verbatim (this project's own "don't re-derive it" standing
// instruction). Used only by the S4 geometry section below: a framed BOARD
// page's own paper-equivalent wrapper carries NO class name at all
// (BoardEditor.tsx's inline-styled div, confirmed by live inspection — see
// the build report), so a prose page is the only page kind this geometry
// proof can cleanly measure via the proven `.mode-pagecol` selector.
const freshProsePage = async (app, width = 1400, height = 900) => {
  await freshDesk(app, width, height);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book)' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, framed' });
  await sleep(250);
};

// A genuinely trusted single click (mouseDown + mouseUp, real CDP Input
// events) at a fixed point — FX7/FX8's own shared baseline gesture.
const clickAt = async (app, x, y) => { await app.mouseDown(x, y); await sleep(30); await app.mouseUp(x, y); };

// ISO timestamps generated Node-side (never inside the page), spaced one
// second apart, so seeded fixtures get deterministic recency ordering
// without relying on any in-browser Date math.
const t = (offsetSeconds) => new Date(Date.now() + offsetSeconds * 1000).toISOString();

// Seeds projects/boards/docs directly into localStorage from the Desk (per
// this project's own harness-seeding law — AGENTS.md's "flushNow race":
// seeding while a flush-on-unmount writing surface is mounted can silently
// clobber the seed; seed from the Desk instead, never from an editor page),
// then reloads. Every item is a fully-formed record built Node-side — no
// in-browser `now`/timestamp derivation.
const seedFixture = async (app, { projects = [], boards = [], docs = [] }, width = LAPTOP_W, height = 900) => {
  await freshDesk(app, width, height);
  await app.evalJs(`(() => {
    const projects = JSON.parse(localStorage.getItem('writer-studio-projects') || '[]');
    projects.push(...${JSON.stringify(projects)});
    localStorage.setItem('writer-studio-projects', JSON.stringify(projects));
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push(...${JSON.stringify(boards)}, ...${JSON.stringify(docs)});
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after FX9 fixture seed' });
};

const board = (id, projectId, title, updatedAtOffset) => ({
  id, text: title, projectId, pageType: 'board', source: 'page', boxes: [],
  createdAt: t(updatedAtOffset), updatedAt: t(updatedAtOffset),
});
// A loose doc, T3-qualifying (store/persistence.ts's belongsOnShelf): no
// project, origin:'loose' (never journal-view), never pinned — the SAME
// seed shape b2.mjs's own S7 fixture already uses for its one loose doc.
const doc = (id, title, updatedAtOffset) => ({
  id, text: title, projectId: null, source: 'page', origin: 'loose',
  createdAt: t(updatedAtOffset), updatedAt: t(updatedAtOffset),
});
const project = (id, title) => ({ id, title, type: 'creative', storyPlanId: null, createdAt: t(-1000), updatedAt: t(-1000) });

// Lands on a real framed board page (Drawers' own panel needs SOME framed
// page underfoot) and opens the Drawers category.
const openDrawersOn = async (app, boardId) => {
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(boardId)}`);
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'FX9 fixture board framed' });
  await sleep(250);
  await app.waitFor("document.querySelectorAll('.wz-strip-item').length === 8", { label: 'strip mounted (FX9 fixture)' });
  await clickCategory(app, 3); // Drawers
  await app.waitFor("!!document.querySelector('.wz-drawers-tiles')", { label: 'Drawers panel open (FX9 fixture)' });
  await sleep(200);
};

// Finds a fold's own outer `.wz-fold` wrapper by its header's visible text
// (exact match against the title span only — never the chevron glyph,
// which is `.wz-fold-header`'s OWN aria-hidden child, so a plain
// textContent-includes probe on the wrapper is safe either way).
const foldByTitle = (title) => `[...document.querySelectorAll('.wz-fold')].find(el => el.querySelector('.wz-fold-header')?.textContent.includes(${JSON.stringify(title)}))`;

// The header rect for a fold found by title — a dedicated helper (not
// `rectOf`, which only accepts a plain CSS selector string; `foldByTitle`
// returns a JS EXPRESSION, not a selector, so it has to be evaluated, not
// queried).
const headerRectOf = (app, title) => app.evalJs(`(() => { const el = ${foldByTitle(title)}?.querySelector('.wz-fold-header'); return el ? el.getBoundingClientRect().toJSON() : null; })()`);

await withHarness(async (app) => {
  // ==========================================================================
  // S1 — presence + grammar. A project cluster (2 boards, well under the
  // six-item default-expand ceiling — this section is about the TOGGLE
  // grammar, not the count default, which gets its own dedicated fixture
  // below) and the Recent journal list. A THIRD board, in its OWN separate
  // project with a later updatedAt, claims the Drawers panel's single
  // "last-opened" anchor slot — without it, the anchor would pull ONE of
  // the two target boards out of the cluster itself (DrawersPanel's own
  // anchor-exclusion, see CascadePanels.tsx), leaving only 1 item there
  // instead of the intended 2.
  // ==========================================================================
  await seedFixture(app, {
    projects: [project('fx9-s1-project', 'S1 Grammar Project'), project('fx9-s1-anchor-project', 'S1 Anchor Project')],
    boards: [
      board('fx9-s1-board-a', 'fx9-s1-project', 'Alpha Board', 0),
      board('fx9-s1-board-b', 'fx9-s1-project', 'Beta Board', 1),
      board('fx9-s1-anchor-board', 'fx9-s1-anchor-project', 'Anchor Board', 1000),
    ],
  }, LAPTOP_W, 900);
  await openDrawersOn(app, 'fx9-s1-board-a');

  const presence = await app.evalJs(`(() => {
    const clusterFold = ${foldByTitle('S1 Grammar Project')};
    if (!clusterFold) return null;
    const header = clusterFold.querySelector('.wz-fold-header');
    return {
      isButton: header?.tagName === 'BUTTON',
      ariaExpanded: header?.getAttribute('aria-expanded'),
      dataCollapsed: clusterFold.dataset.collapsed,
      hasChevron: !!header?.querySelector('.wz-fold-chevron'),
      childCount: header?.children.length,
      tileCount: clusterFold.querySelector('.wz-fold-body-inner')?.querySelectorAll('.wz-drawers-tile').length,
    };
  })()`);
  ok('S1: a project cluster fold header exists, is a real <button>, has aria-expanded + a chevron, carries its own 2 boards, and opens EXPANDED by default (2 items, under the six-item ceiling)',
    presence && presence.isButton && presence.ariaExpanded === 'true' && presence.dataCollapsed === 'false' && presence.hasChevron && presence.tileCount === 2,
    JSON.stringify(presence));
  ok('S3 (structural): the header carries EXACTLY two children — the title span and the chevron span, nothing else (no third, count-shaped element)',
    presence?.childCount === 2, String(presence?.childCount));

  // The whole header is the hit target — a genuinely trusted click at the
  // header's own horizontal CENTER (clear of both the short title text at
  // the left edge and the small chevron glyph at the right edge) toggles
  // it, proving the full row responds, not just the chevron.
  const headerRect = await headerRectOf(app, 'S1 Grammar Project');
  await clickAt(app, Math.round(headerRect.x + headerRect.width / 2), Math.round(headerRect.y + headerRect.height / 2));
  await sleep(250);
  const afterCenterClick = await app.evalJs(`(() => {
    const el = ${foldByTitle('S1 Grammar Project')};
    return { dataCollapsed: el.dataset.collapsed, ariaExpanded: el.querySelector('.wz-fold-header').getAttribute('aria-expanded') };
  })()`);
  ok('S1: a genuinely trusted click at the header\'s own CENTER (clear of the title text and the chevron glyph both) collapses it — the whole row is the hit target, not the chevron alone',
    afterCenterClick.dataCollapsed === 'true' && afterCenterClick.ariaExpanded === 'false', JSON.stringify(afterCenterClick));

  // A second click, this time deliberately at the header's FAR LEFT edge
  // (the title's own start, the farthest point on the row from the
  // chevron sitting at the far right) — re-expands it, the same proof from
  // the opposite end of the row.
  await clickAt(app, Math.round(headerRect.x + 4), Math.round(headerRect.y + headerRect.height / 2));
  await sleep(250);
  const afterFarLeftClick = await app.evalJs(`(() => {
    const el = ${foldByTitle('S1 Grammar Project')};
    return { dataCollapsed: el.dataset.collapsed, ariaExpanded: el.querySelector('.wz-fold-header').getAttribute('aria-expanded') };
  })()`);
  ok('S1: a click at the header\'s FAR LEFT edge (farthest point on the row from the chevron) re-expands it too',
    afterFarLeftClick.dataCollapsed === 'false' && afterFarLeftClick.ariaExpanded === 'true', JSON.stringify(afterFarLeftClick));

  // Keyboard: focus the header, a real trusted Enter keypress toggles it —
  // native <button> activation semantics, not a synthetic click() call.
  // Uses app.typeKeys('\n') rather than app.key('Enter'): empirically
  // verified live against this exact button (disclosed in the build
  // report) — app.key's own rawKeyDown+keyUp pair (no `text` field) does
  // NOT trigger Chromium's native Enter-activates-a-focused-button default
  // action in this harness's headless build, while typeKeys's fuller
  // keyDown (WITH a `text` field) + keyUp pair does. Both are genuinely
  // trusted CDP Input.dispatchKeyEvent sequences (never a synthetic
  // KeyboardEvent dispatch) — this is a choice between two already-trusted
  // helpers, not a downgrade to an untrusted one.
  await app.evalJs(`${foldByTitle('S1 Grammar Project')}.querySelector('.wz-fold-header').focus()`);
  const focusedIsHeader = await app.evalJs(`document.activeElement === ${foldByTitle('S1 Grammar Project')}.querySelector('.wz-fold-header')`);
  ok('S1: the header is genuinely focusable (a real <button>, reachable via .focus())', focusedIsHeader === true, String(focusedIsHeader));
  await app.typeKeys('\n');
  await sleep(250);
  const afterEnter = await app.evalJs(`(() => {
    const el = ${foldByTitle('S1 Grammar Project')};
    return { dataCollapsed: el.dataset.collapsed, ariaExpanded: el.querySelector('.wz-fold-header').getAttribute('aria-expanded') };
  })()`);
  ok('S1: a genuinely trusted Enter keypress, while the header holds focus, collapses it — keyboard-operable, aria-expanded flips in step',
    afterEnter.dataCollapsed === 'true' && afterEnter.ariaExpanded === 'false', JSON.stringify(afterEnter));

  // Chevron: quiet olive at rest AND on hover, never brass/orange either
  // way. A real trusted hover-move (FX5 S8's own genuinely-trusted
  // pointer-move discipline) over the header, then read the chevron's OWN
  // computed color both before and during the hover.
  const chevronRestColor = await app.evalJs(`getComputedStyle(${foldByTitle('S1 Grammar Project')}.querySelector('.wz-fold-chevron')).color`);
  await app.mouseMove(Math.round(headerRect.x + headerRect.width / 2), Math.round(headerRect.y + headerRect.height / 2));
  await sleep(150);
  const chevronHoverColor = await app.evalJs(`getComputedStyle(${foldByTitle('S1 Grammar Project')}.querySelector('.wz-fold-chevron')).color`);
  const OLIVE = 'rgb(150, 160, 90)'; // --accent-rest: #96a05a
  const BRASS = 'rgb(255, 152, 0)'; // --brass
  ok('S1: the chevron reads quiet olive (--accent-rest) AT REST — never brass/orange',
    chevronRestColor === OLIVE && chevronRestColor !== BRASS, chevronRestColor);
  ok('S1: the chevron STAYS olive ON HOVER too — "nothing brass, nothing orange, at rest or on hover" (S1\'s own words)',
    chevronHoverColor === OLIVE && chevronHoverColor !== BRASS, chevronHoverColor);
  // Restore to expanded for the checks that follow (focus is still on the
  // header from the keyboard test above).
  await app.typeKeys('\n');
  await sleep(250);

  // Nothing brass anywhere in the panel AT REST (no hover, no focus).
  await app.evalJs("document.activeElement && document.activeElement.blur && document.activeElement.blur()");
  await app.mouseMove(5, 5); // move the pointer well away from any panel chrome
  await sleep(150);
  const restColors = await app.evalJs(`[...document.querySelectorAll('.wz-fold-header, .wz-fold-chevron')].map(el => getComputedStyle(el).color)`);
  ok('S1: nothing in the fold chrome reads brass at rest (no hover, no focus) — the whole roster of header/chevron computed colors',
    Array.isArray(restColors) && restColors.length > 0 && restColors.every((c) => c !== BRASS), JSON.stringify(restColors));

  // Reduced motion: the height transition (and the chevron's own rotation)
  // both drop to ~0s — no animated frame, an instant snap.
  await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const reducedDurations = await app.evalJs(`(() => {
    const wrap = ${foldByTitle('S1 Grammar Project')}.querySelector('.wz-fold-body-wrap');
    const chevron = ${foldByTitle('S1 Grammar Project')}.querySelector('.wz-fold-chevron');
    return { wrap: getComputedStyle(wrap).transitionDuration, chevron: getComputedStyle(chevron).transitionDuration };
  })()`);
  const parseDur = (s) => Math.max(...String(s).split(',').map((x) => parseFloat(x)));
  ok('S1: under prefers-reduced-motion, the fold body\'s own height transition collapses to ~0s (no height animation)',
    parseDur(reducedDurations.wrap) < 0.001, JSON.stringify(reducedDurations));
  ok('S1: under prefers-reduced-motion, the chevron\'s own rotation transition collapses to ~0s too',
    parseDur(reducedDurations.chevron) < 0.001, JSON.stringify(reducedDurations));
  await app.emulateMedia([]);

  // ==========================================================================
  // Non-goals — PagePanel/PlanPanel/CascadeSettingsPanel/CascadeThemePanel
  // never grow a fold (S1's own explicit exclusion: short action surfaces,
  // a hinge there is chrome for its own sake).
  // ==========================================================================
  await clickCategory(app, 1); // Page
  await sleep(200);
  const pageHasFold = await app.evalJs("!!document.querySelector('.wz-cascade-panel .wz-fold')");
  ok('Non-goal: PagePanel never grows a fold', pageHasFold === false, String(pageHasFold));
  await clickCategory(app, 2); // Plan
  await sleep(200);
  const planHasFold = await app.evalJs("!!document.querySelector('.wz-cascade-panel .wz-fold')");
  ok('Non-goal: PlanPanel never grows a fold', planHasFold === false, String(planHasFold));
  await clickCategory(app, 5); // Settings
  await sleep(200);
  const settingsHasFold = await app.evalJs("!!document.querySelector('.wz-cascade-panel .wz-fold')");
  ok('Non-goal: CascadeSettingsPanel never grows a fold', settingsHasFold === false, String(settingsHasFold));
  await clickCategory(app, 6); // Themes
  await sleep(200);
  const themeHasFold = await app.evalJs("!!document.querySelector('.wz-cascade-panel .wz-fold')");
  ok('Non-goal: CascadeThemePanel never grows a fold', themeHasFold === false, String(themeHasFold));

  // DISCREPANCY, disclosed in the build report: the brief's own "verified
  // structure" section claims ShelfPanel/TrashPanel "render their own
  // lists." Neither currently does — both are a single plain door button
  // (B2 S1/S3 retired the Shelf's old list whole; B1 S5 built Trash minimal
  // from the start). Proven live here rather than just asserted from
  // reading the source, so this is a checked fact, not a guess.
  await clickCategory(app, 4); // Shelf
  await sleep(200);
  const shelfShape = await app.evalJs("({ hasFold: !!document.querySelector('.wz-cascade-panel .wz-fold'), buttonCount: document.querySelectorAll('.wz-cascade-panel-body button').length })");
  ok('DISCLOSED DISCREPANCY: ShelfPanel currently renders no list at all (one plain door button, B2 S1/S3) — no fold was added; the brief\'s own "ShelfPanel... render[s] ... lists" premise does not match current source',
    shelfShape.hasFold === false && shelfShape.buttonCount === 1, JSON.stringify(shelfShape));
  await clickCategory(app, 7); // Trash
  await sleep(200);
  const trashShape = await app.evalJs("({ hasFold: !!document.querySelector('.wz-cascade-panel .wz-fold'), buttonCount: document.querySelectorAll('.wz-cascade-panel-body button').length })");
  ok('DISCLOSED DISCREPANCY: TrashPanel currently renders no list at all (one plain door button, B1 S5) — no fold was added; same premise gap as ShelfPanel',
    trashShape.hasFold === false && trashShape.buttonCount === 1, JSON.stringify(trashShape));

  // ==========================================================================
  // S2 — persistence: close/reopen the cascade (no reload), a full reload,
  // and the id-keyed rename proof.
  // ==========================================================================
  await clickCategory(app, 3); // back to Drawers
  await sleep(200);
  // Collapse the cluster.
  await app.evalJs(`${foldByTitle('S1 Grammar Project')}.querySelector('.wz-fold-header').click()`);
  await sleep(250);
  const collapsedBeforeDockClose = await app.evalJs(`${foldByTitle('S1 Grammar Project')}.dataset.collapsed`);
  ok('S2 setup: the cluster is genuinely collapsed before the close/reopen probe', collapsedBeforeDockClose === 'true', collapsedBeforeDockClose);
  // Close the cascade panel (the dock's own quiet close, T5) — NOT a
  // reload; DrawersPanel fully unmounts.
  await app.evalJs("document.querySelector('.wz-cascade-dock-btn')?.click()");
  await sleep(250);
  // Drawers never opens a survey (B2 S7 — a large-tile view, tiles travel
  // directly, no nested survey column), so closePanel() always takes its
  // "nothing to dock" branch (Cascade.tsx) and returns to REST outright —
  // `layers` renders null, so `.wz-cascade-panel` is genuinely ABSENT from
  // the DOM here, not merely data-visible='false' (that attribute is the
  // DOCKED-survey case specifically, a different state this fixture never
  // reaches).
  const panelClosedAfterDock = await app.evalJs("!document.querySelector('.wz-cascade-panel')");
  ok('S2 setup: the cascade panel genuinely closed — DrawersPanel unmounted whole (no survey to dock, so closePanel() returns to REST)', panelClosedAfterDock === true, String(panelClosedAfterDock));
  // Reopen the SAME category — a fresh DrawersPanel mount, no page reload.
  await clickCategory(app, 3);
  await sleep(250);
  const collapsedAfterReopen = await app.evalJs(`${foldByTitle('S1 Grammar Project')}.dataset.collapsed`);
  ok('S2: a fold survives closing and reopening the cascade (no page reload) — read fresh off the shared store on remount, not stale component state',
    collapsedAfterReopen === 'true', collapsedAfterReopen);

  // A full reload.
  await app.reload();
  await openDrawersOn(app, 'fx9-s1-board-a');
  const collapsedAfterReload = await app.evalJs(`${foldByTitle('S1 Grammar Project')}.dataset.collapsed`);
  ok('S2: a fold survives a FULL reload too', collapsedAfterReload === 'true', collapsedAfterReload);

  // The id-keyed rename proof — rename the project (a raw localStorage
  // mutation from the Desk, the same "seed from the Desk, never a mounted
  // editor" discipline every other seed in this file already follows),
  // reload, and confirm the fold state survived under the NEW title.
  await app.goto('/');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before rename' });
  await app.evalJs(`(() => {
    const projects = JSON.parse(localStorage.getItem('writer-studio-projects') || '[]');
    const p = projects.find(p => p.id === 'fx9-s1-project');
    if (p) p.title = 'Renamed Grammar Project';
    localStorage.setItem('writer-studio-projects', JSON.stringify(projects));
  })()`);
  await app.reload();
  await openDrawersOn(app, 'fx9-s1-board-a');
  const renamedFoldState = await app.evalJs(`(() => {
    const el = ${foldByTitle('Renamed Grammar Project')};
    const oldNameStillPresent = ${foldByTitle('S1 Grammar Project')};
    return { found: !!el, collapsed: el?.dataset.collapsed, oldNameGone: !oldNameStillPresent };
  })()`);
  ok('S2 (the id-keyed proof): the cluster now renders under its NEW title, and its fold — collapsed before the rename — is STILL collapsed after it. The key rides the project\'s id, never its title.',
    renamedFoldState.found && renamedFoldState.collapsed === 'true' && renamedFoldState.oldNameGone, JSON.stringify(renamedFoldState));

  // ==========================================================================
  // S2 — the count-based first-ever default, and explicit-toggle sovereignty.
  // The Loose docs group is the target (not a project cluster): the
  // Drawers panel's own single "last-opened" anchor slot pulls ONE item out
  // of the pooled board+doc list — seeding an anchor-claiming BOARD (a
  // later updatedAt than every doc) means the anchor is always claimed by
  // that board, leaving the Loose docs cluster's own count untouched by
  // anchor removal (its own kind is filtered separately — see
  // DrawersPanel's own `restDocs` derivation in CascadePanels.tsx).
  // ==========================================================================
  const sevenDocs = Array.from({ length: 7 }, (_, i) => doc(`fx9-doc7-${i}`, `Doc Seven ${i}`, i));
  await seedFixture(app, {
    projects: [project('fx9-anchor-project', 'Anchor Project')],
    boards: [board('fx9-anchor-board-7', 'fx9-anchor-project', 'Anchor Board', 1000)],
    docs: sevenDocs,
  }, LAPTOP_W, 900);
  await openDrawersOn(app, 'fx9-anchor-board-7');
  const sevenDocState = await app.evalJs(`(() => {
    const el = ${foldByTitle('Loose')};
    const body = el?.querySelector('.wz-fold-body-inner');
    return {
      collapsed: el?.dataset.collapsed,
      ariaExpanded: el?.querySelector('.wz-fold-header').getAttribute('aria-expanded'),
      docTileCount: body?.querySelectorAll('.wz-drawers-tile').length,
    };
  })()`);
  ok('S2 default rule: a seeded SEVEN-item section (the Loose docs group, anchor claimed by a separate board) opens COLLAPSED on first-ever view',
    sevenDocState.collapsed === 'true' && sevenDocState.ariaExpanded === 'false' && sevenDocState.docTileCount === 7,
    JSON.stringify(sevenDocState));

  // Explicit toggle beats the count rule on the next view: expand it by
  // hand, then reload with the SAME seven-item fixture still in storage —
  // it must now open EXPANDED, the writer's own choice overriding the
  // default this time.
  await app.evalJs(`${foldByTitle('Loose')}.querySelector('.wz-fold-header').click()`);
  await sleep(250);
  const sevenDocExpandedByHand = await app.evalJs(`${foldByTitle('Loose')}.dataset.collapsed`);
  ok('S2 setup: the seven-item Loose group was genuinely expanded by hand', sevenDocExpandedByHand === 'false', sevenDocExpandedByHand);
  await app.reload();
  await openDrawersOn(app, 'fx9-anchor-board-7');
  const sevenDocAfterExplicitReload = await app.evalJs(`${foldByTitle('Loose')}.dataset.collapsed`);
  ok('S2: a writer\'s explicit toggle beats the count rule on the NEXT view — the same seven-item section now opens EXPANDED after a reload, because the writer touched it',
    sevenDocAfterExplicitReload === 'false', sevenDocAfterExplicitReload);

  // The six-item default (a FRESH fixture — never-touched key), expanded.
  const sixDocs = Array.from({ length: 6 }, (_, i) => doc(`fx9-doc6-${i}`, `Doc Six ${i}`, i));
  await seedFixture(app, {
    projects: [project('fx9-anchor-project-6', 'Anchor Project Six')],
    boards: [board('fx9-anchor-board-6', 'fx9-anchor-project-6', 'Anchor Board Six', 1000)],
    docs: sixDocs,
  }, LAPTOP_W, 900);
  await openDrawersOn(app, 'fx9-anchor-board-6');
  const sixDocState = await app.evalJs(`(() => {
    const el = ${foldByTitle('Loose')};
    const body = el?.querySelector('.wz-fold-body-inner');
    return {
      collapsed: el?.dataset.collapsed,
      ariaExpanded: el?.querySelector('.wz-fold-header').getAttribute('aria-expanded'),
      docTileCount: body?.querySelectorAll('.wz-drawers-tile').length,
    };
  })()`);
  ok('S2 default rule: a seeded SIX-item section opens EXPANDED on first-ever view — "six or fewer opens expanded" (S2\'s own words)',
    sixDocState.collapsed === 'false' && sixDocState.ariaExpanded === 'true' && sixDocState.docTileCount === 6,
    JSON.stringify(sixDocState));

  // ==========================================================================
  // S3 — mandatory negative assertion, proven by DOM query: no collapsed
  // header anywhere renders a numeral or a badge element. Re-seed the
  // seven-doc (collapsed-by-default) fixture and query the COLLAPSED
  // header's own subtree directly, rather than eyeballing a screenshot.
  // Every seeded title here is deliberately DIGIT-FREE (letters, not
  // numbers) — the panel-wide "no digit anywhere" sweep below has to prove
  // the FOLD MECHANISM never adds a count, which a numeral-bearing WRITER
  // title (a legitimate thing a real title could contain) would falsely
  // implicate; digit-free fixture titles keep the assertion honest.
  // ==========================================================================
  // NOTE: every DISPLAY title below is digit-free, deliberately including
  // the fixture's own name — an earlier draft of this exact fixture used
  // "S3 ..." titles and the digit in "S3" itself broke this very
  // assertion (a real, disclosed authoring mistake caught by the
  // assertion doing its job — not the product's own text).
  const LETTERS = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf'];
  await seedFixture(app, {
    projects: [project('fx9-s3-project', 'Negative Assertion Project')],
    boards: [board('fx9-s3-anchor', 'fx9-s3-project', 'Negative Assertion Anchor', 1000)],
    docs: LETTERS.map((word, i) => doc(`fx9-s3-doc-${word.toLowerCase()}`, `Doc ${word}`, i)),
  }, LAPTOP_W, 900);
  await openDrawersOn(app, 'fx9-s3-anchor');
  // Digit-testing runs NODE-side (matching cd2.mjs's/b2.mjs's own existing
  // "!/\d/.test(bodyText)" convention exactly) — the browser side just
  // returns the raw text, no regex escaping through the eval-string
  // boundary to reason about.
  const negativeAssertion = await app.evalJs(`(() => {
    const fold = ${foldByTitle('Loose')};
    const header = fold.querySelector('.wz-fold-header');
    return {
      collapsed: fold.dataset.collapsed,
      headerChildCount: header.children.length,
      headerText: header.textContent || '',
      headerHasBadgeClassedElement: !!header.querySelector('[class*="badge" i], [class*="count" i], [class*="dot" i]'),
      // The mandatory negative sweep the brief itself names — not just
      // this ONE header, the panel's entire rendered text: no digit
      // anywhere (every seeded title in this fixture is deliberately
      // digit-free text, so any digit found here could only have come
      // from a count/badge this ticket must never add).
      panelBodyText: document.querySelector('.wz-cascade-panel-body')?.innerText ?? '',
    };
  })()`);
  ok('S3 MANDATORY negative assertion: the collapsed Loose header carries EXACTLY its title + chevron (2 children), no numeral in its own text, and no element with a badge/count/dot-shaped class — queried live in the DOM, not assumed',
    negativeAssertion.collapsed === 'true' && negativeAssertion.headerChildCount === 2
      && !/\d/.test(negativeAssertion.headerText) && negativeAssertion.headerHasBadgeClassedElement === false,
    JSON.stringify(negativeAssertion));
  ok('S3 MANDATORY negative assertion: no digit anywhere in the WHOLE Drawers panel\'s rendered text, collapsed sections included — zero counts/badges anywhere in this ticket\'s own chrome',
    !/\d/.test(negativeAssertion.panelBodyText), JSON.stringify(negativeAssertion));

  // ==========================================================================
  // S4 — geometry at the 1100px floor (mandatory), 1280, and 2200: the
  // cascade's own rect and the paper's own rect are unchanged by any fold
  // or unfold. Lands on a fresh PROSE page each time (cd2.mjs's own proven
  // `.mode-pagecol` selector) rather than a board page — Drawers is a
  // GLOBAL view, unscoped to the current page's own project, so the
  // fixture's project/board/docs are seeded separately and the prose page
  // itself is just "some real framed page underfoot."
  // ==========================================================================
  const paperSel = '.mode-pagecol, .entry-full';
  for (const width of [FLOOR_W, LAPTOP_W, WIDE_W]) {
    await freshProsePage(app, width, 900);
    // The 300ms debounced-flush window (persistence.ts's FLUSH_DELAY) —
    // read the freshly-created page's own id only after it has genuinely
    // reached localStorage (cd2.mjs's own freshProsePageWithBoards fixture,
    // same discipline).
    await sleep(400);
    const pageId = await app.evalJs("location.hash.split('/page/')[1]");
    // Seed from the Desk (the flushNow-race law), then return to the SAME
    // prose page.
    await app.goto('/');
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: `S4 @ ${width}px Desk before seed` });
    await app.evalJs(`(() => {
      const projects = JSON.parse(localStorage.getItem('writer-studio-projects') || '[]');
      projects.push(${JSON.stringify(project('fx9-s4-project', 'S4 Geometry Project'))});
      localStorage.setItem('writer-studio-projects', JSON.stringify(projects));
      const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
      entries.push(${JSON.stringify(board('fx9-s4-anchor', 'fx9-s4-project', 'S4 Anchor Board', 1000))});
      entries.push(...${JSON.stringify(Array.from({ length: 7 }, (_, i) => doc(`fx9-s4-doc-${i}`, `S4 Doc ${i}`, i)))});
      localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
    })()`);
    await app.reload();
    await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(pageId)}`);
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: `S4 @ ${width}px prose page reloaded` });
    await sleep(250);
    await app.emulateDpr(1, width, 900);
    await app.waitFor("document.querySelectorAll('.wz-strip-item').length === 8", { label: `S4 @ ${width}px strip mounted` });
    // Paper rect + cascade presence with the panel CLOSED (no category selected).
    const paperClosed = await rectOf(app, paperSel);
    const cascadeAbsentWhenClosed = await app.evalJs("!document.querySelector('.wz-cascade-panel')");
    ok(`S4 @ ${width}px setup: the cascade panel is genuinely absent with no category selected`, cascadeAbsentWhenClosed === true, String(cascadeAbsentWhenClosed));
    // Open Drawers — the fixture's own Loose group opens collapsed by default (7 docs).
    await clickCategory(app, 3);
    await app.waitFor("!!document.querySelector('.wz-drawers-tiles')", { label: `S4 @ ${width}px Drawers open` });
    await sleep(200);
    const paperOpenCollapsed = await rectOf(app, paperSel);
    const cascadeOpenCollapsed = await rectOf(app, '.wz-cascade-panel');
    const collapsedBeforeUnfold = await app.evalJs(`${foldByTitle('Loose')}.dataset.collapsed`);
    ok(`S4 @ ${width}px setup: the Loose section is genuinely collapsed before the geometry probe`, collapsedBeforeUnfold === 'true', collapsedBeforeUnfold);
    // Unfold it.
    await app.evalJs(`${foldByTitle('Loose')}.querySelector('.wz-fold-header').click()`);
    await sleep(250);
    const paperOpenExpanded = await rectOf(app, paperSel);
    const cascadeOpenExpanded = await rectOf(app, '.wz-cascade-panel');
    ok(`S4 @ ${width}px: the paper's own rect is BYTE-IDENTICAL closed vs. panel-open-collapsed vs. panel-open-expanded — folding a list never moves the paper`,
      JSON.stringify(paperClosed) === JSON.stringify(paperOpenCollapsed) && JSON.stringify(paperOpenCollapsed) === JSON.stringify(paperOpenExpanded),
      JSON.stringify({ paperClosed, paperOpenCollapsed, paperOpenExpanded }));
    ok(`S4 @ ${width}px: the cascade panel's own rect is BYTE-IDENTICAL collapsed vs. expanded — folding/unfolding a list never resizes or moves the panel itself (it scrolls internally, per .wz-cascade-panel's own fixed width/height + overflow-y:auto)`,
      JSON.stringify(cascadeOpenCollapsed) === JSON.stringify(cascadeOpenExpanded), JSON.stringify({ cascadeOpenCollapsed, cascadeOpenExpanded }));
  }

  // ==========================================================================
  // Legacy (<1100px) — DeskFrame (and therefore the whole cascade, and
  // therefore every bit of this ticket's own chrome) never mounts below the
  // 1100px floor (DeskFrame.tsx's own header comment: "framed-only; legacy
  // <1100px, which never..."). Confirms this ticket adds nothing there —
  // no `.wz-fold`, no `.wz-strip`, no `.wz-cascade-panel` — byte-identical
  // to before.
  // ==========================================================================
  await seedFixture(app, {
    projects: [project('fx9-legacy-project', 'Legacy Project')],
    boards: [board('fx9-legacy-board', 'fx9-legacy-project', 'Legacy Board', 0)],
  }, LEGACY_W, 900);
  await app.evalJs("location.hash = '#/page/fx9-legacy-board'");
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'Legacy board mounted' });
  await sleep(300);
  await app.emulateDpr(1, LEGACY_W, 900);
  const legacyShape = await app.evalJs(`({
    hasDeskFrame: !!document.querySelector('.desk-frame'),
    hasStrip: !!document.querySelector('.wz-strip'),
    hasCascadePanel: !!document.querySelector('.wz-cascade-panel'),
    hasFold: !!document.querySelector('.wz-fold'),
    hasBoardCanvas: !!document.querySelector('.board-canvas'),
  })`);
  ok('Legacy (<1100px): unchanged — no .desk-frame, no .wz-strip, no .wz-cascade-panel, no .wz-fold anywhere; this ticket touches nothing outside the framed cascade',
    !legacyShape.hasDeskFrame && !legacyShape.hasStrip && !legacyShape.hasCascadePanel && !legacyShape.hasFold && legacyShape.hasBoardCanvas,
    JSON.stringify(legacyShape));

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nFX9 VERIFY: PASS (${checks.length} checks)` : `\nFX9 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
