// ITEM 144 — THE BOARD TABS (docs/menus/b144-board-tabs-build-brief.md S2, as
// amended by b144-plus-menu-and-unnest-amendment.md §6).
// Run: node apps/desktop/scripts/harness/i144.mjs   (repo root, dist-web freshly
// built via `pnpm run build:web`; needs a box turn — it opens a real browser).
//
// BUILT SO FAR (stated, never implied): the row, its order and stability, a
// press that travels, the bare "＋" with its two-row menu (Add Board / New
// Board), the connect list's states, item 92's survival at the new door, the
// room law, and item 169's stage-width measurement. NOT BUILT YET, and so NOT
// CHECKED HERE: Unlink on a nested tab (§2), un-nesting by drag (§3, P4-P6),
// double-click-replaces-parent with a back arrow (§4, P7), the third "Connect
// Board" menu row (PLAN DESK's amendment has not landed), T5's tag narrowing
// (gated on item 108). A reader of a short i144.mjs knows it by design.
//
// Standing laws: drivers never assume existence · real pointer events (every
// press is a hit-tested `trustedDispatch`, never `.click()`) · seed through the
// seams · select by NAME (`data-board-tab="<id>"`), never by index.
import { withHarness } from '../runtime-verify.mjs';
import { hittablePointBy, trustedDispatch } from '../trusted-point.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const t = (n) => new Date(Date.UTC(2026, 8, 24, 12, 0, n)).toISOString();

const freshDesk = async (app, width = 1366, height = 768) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
};

// TWO DRAWERS. Novel: Characters (b-cast) ⊃ Plot (b-plot); Lore (b-lore) ⊃ Notes
// (b-notes, which lives in RESEARCH — a connected board from another drawer, so
// its tab wears an "in Research" line). Birth order is t1..t4.
const seed = async (app) => {
  await app.evalJs(`(() => {
    const novel = window.wrizoCreateProject('Novel');
    const research = window.wrizoCreateProject('Research');
    window.__i144 = { novel: novel.id, research: research.id };
    const t = (n) => new Date(Date.UTC(2026, 8, 24, 12, 0, n)).toISOString();
    const board = (id, text, projectId, createdAt, boxes) =>
      window.wrizoCreateJournalPage({ id, text, pageType: 'board', projectId, boxes, createdAt, origin: null });
    board('b-plot', 'Plot', novel.id, t(2), []);
    board('b-notes', 'Notes', research.id, t(4), []);
    board('b-cast', 'Characters', novel.id, t(1),
      [{ id: 'pin-plot', kind: 'page-pin', x: 0.05, y: 0.1, w: 0.32, h: 0.10, z: 1, entryId: 'b-plot', onCanvas: true }]);
    board('b-lore', 'Lore', novel.id, t(3),
      [{ id: 'lore-t1', kind: 'text', x: 0.05, y: 0.05, w: 0.3, h: 0.1, z: 1, text: 'A lore card' },
       { id: 'lore-tall', kind: 'text', x: 0.05, y: 1.4, w: 0.3, h: 0.1, z: 2, text: 'Far below the fold' },
       { id: 'pin-notes', kind: 'page-pin', x: 0.5, y: 0.1, w: 0.32, h: 0.10, z: 3, entryId: 'b-notes', onCanvas: true }]);
  })()`);
};

const openBoard = async (app, id, width = 1366, height = 768) => {
  await app.evalJs(`location.hash = '#/page/${id}'`);
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: `board ${id}` });
  await app.emulateDpr(1, width, height);
  await sleep(300);
};

const tabIds = (app) => app.evalJs("Array.from(document.querySelectorAll('[data-board-tab]')).map(e => e.getAttribute('data-board-tab'))");
const currentTab = (app) => app.evalJs("document.querySelector('[data-board-tab][aria-current=\"page\"]')?.getAttribute('data-board-tab') ?? null");
const rawEntry = (app, id) => app.evalJs(`JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find(e => e.id === ${JSON.stringify(id)}) ?? null`);
const rectOf = (app, sel) => app.evalJs(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; })()`);
const press = (app, sel, what) => trustedDispatch(app, `document.querySelector(${JSON.stringify(sel)})`, what, { report: ok });
const intersects = (a, b) => !(a.r <= b.l || b.r <= a.l || a.b <= b.t || b.b <= a.t);

await withHarness(async (app) => {
  // ==========================================================================
  // 1 · THE SET, THE ORDER. Drawer boards present including the current one; a
  // child immediately after its parent; a board from another drawer present
  // with a second line that begins with "in "; condition boards absent.
  // ==========================================================================
  await freshDesk(app);
  await seed(app);
  await app.reload();
  await openBoard(app, 'b-cast');
  const ids1 = await tabIds(app);
  ok('1: the row is exactly Characters, its child Plot beneath it, Lore, and Lore\'s child Notes — birth order, each board followed by its children (a board appears ONCE)',
    JSON.stringify(ids1) === JSON.stringify(['b-cast', 'b-plot', 'b-lore', 'b-notes']), JSON.stringify(ids1));
  ok('1: the current board is a tab, marked aria-current="page"', (await currentTab(app)) === 'b-cast', String(await currentTab(app)));
  const inLine = await app.evalJs("document.querySelector('[data-board-tab=\"b-notes\"] .board-tab-in')?.textContent ?? null");
  ok('1: a connected board from ANOTHER drawer wears a second line that begins with "in " (item 163\'s one helper)',
    typeof inLine === 'string' && inLine.startsWith('in ') && inLine.includes('Research'), String(inLine));
  const homeLine = await app.evalJs("document.querySelector('[data-board-tab=\"b-lore\"] .board-tab-in')?.textContent ?? null");
  ok('1: a board in the ROW\'S OWN drawer has no location line (it renders only when the board lives elsewhere)', homeLine === null, String(homeLine));
  const navInfo = await app.evalJs(`(() => { const n = document.querySelector('[data-board-tabs]'); return n ? { tag: n.tagName, role: n.getAttribute('role'), label: n.getAttribute('aria-label') } : null; })()`);
  ok('1: the row is a <nav> named for the drawer — a row of doors, never a tablist', !!navInfo && navInfo.tag === 'NAV' && navInfo.role === null && /Novel/.test(navInfo.label || ''), JSON.stringify(navInfo));

  // ==========================================================================
  // 2 · ⛔ STABILITY, by ids. Press a sibling: the sequence is identical; only
  // aria-current moved. 3 · A PRESS TRAVELS: the route changes, and both boards'
  // `boxes` are byte-identical before and after (a press writes no membership).
  // ==========================================================================
  const castBefore = JSON.stringify((await rawEntry(app, 'b-cast'))?.boxes);
  const loreBefore = JSON.stringify((await rawEntry(app, 'b-lore'))?.boxes);
  const pressedLore = await press(app, '[data-board-tab="b-lore"]', 'tab b-lore (Lore)');
  if (pressedLore) {
    await app.waitFor("location.hash === '#/page/b-lore'", { label: 'travelled to b-lore' });
    await app.waitFor("!!document.querySelector('[data-board-tab=\"b-lore\"][aria-current=\"page\"]')", { label: 'row remounted on b-lore' });
    await sleep(300);
    const ids2 = await tabIds(app);
    ok('2 ⛔ STABILITY: after pressing a sibling the tab id SEQUENCE is identical — only aria-current moved (ids, never positions)',
      JSON.stringify(ids2) === JSON.stringify(ids1) && (await currentTab(app)) === 'b-lore', JSON.stringify({ ids2, current: await currentTab(app) }));
    ok('3: a press travels — the route changed to the pressed board', (await app.evalJs('location.hash')) === '#/page/b-lore');
    await sleep(2500); // past AUTOSAVE_MS: any stray write would have landed
    ok('3: and wrote NOTHING — both boards\' `boxes` are byte-identical before and after the press',
      JSON.stringify((await rawEntry(app, 'b-cast'))?.boxes) === castBefore && JSON.stringify((await rawEntry(app, 'b-lore'))?.boxes) === loreBefore);
  }
  const currentNotPressable = await app.evalJs("document.querySelector('[data-board-tab=\"b-lore\"]')?.getAttribute('aria-disabled')");
  ok('3: the current tab is not pressable (aria-disabled), yet still hit-testable', currentNotPressable === 'true', String(currentNotPressable));

  // ==========================================================================
  // 4 · IN VIEW (the room law). At 1366x768 with a board tall enough to scroll,
  // the row's rect lies inside the viewport AND inside the stage; the canvas
  // scrolls inside its wrap and the row never scrolls away.
  // ==========================================================================
  for (const [w, h] of [[1366, 768], [1000, 700]]) {
    await freshDesk(app, w, h);
    await seed(app);
    await app.reload();
    await openBoard(app, 'b-lore', w, h);
    const row = await rectOf(app, '[data-board-tabs]');
    const stage = await rectOf(app, '.desk-frame-stage');
    const inView = !!row && row.t >= 0 && row.b <= h + 1 && row.l >= 0 && row.r <= w + 1;
    ok(`4: at ${w}x${h} the row's rect lies inside the viewport with a board tall enough to scroll (${w < 1100 ? 'the narrow layout — no DeskFrame — renders the row too' : 'framed'})`,
      inView, JSON.stringify({ row, viewport: [w, h] }));
    if (stage) ok(`4: at ${w}x${h} the row lies inside the STAGE (the room law: the wrap's measured height subtracts the row's own rendered height)`,
      row.b <= stage.b + 1, JSON.stringify({ rowBottom: row.b, stageBottom: stage.b }));
  }

  // ==========================================================================
  // P1 · THE "＋": no visible word, the direction in its accessible name; its
  // menu has EXACTLY two rows (Add Board, New Board) and no Unlink.
  // ==========================================================================
  await freshDesk(app);
  await seed(app);
  await app.reload();
  await openBoard(app, 'b-lore');
  const plus = await app.evalJs(`(() => { const b = document.querySelector('[data-board-plus]'); return b ? { text: b.textContent.trim(), name: b.getAttribute('aria-label') } : null; })()`);
  ok('P1: the "＋" carries NO visible word — a bare glyph — and its accessible name states the direction ("Add a board to Lore")',
    !!plus && plus.text === '＋' && plus.name === 'Add a board to Lore', JSON.stringify(plus));
  const besideCurrent = await app.evalJs(`(() => { const p = document.querySelector('[data-board-plus]'); const c = document.querySelector('[data-board-tab][aria-current="page"]'); return !!p && !!c && p.previousElementSibling === c; })()`);
  ok('P1: the "＋" sits beside the CURRENT board\'s tab (not at the row\'s end)', besideCurrent === true);
  if (await press(app, '[data-board-plus]', 'the ＋ beside the current tab')) {
    await sleep(150);
    const menu = await app.evalJs(`(() => { const m = document.querySelector('[data-board-menu]'); return m ? { items: Array.from(m.querySelectorAll('[role=menuitem]')).map(e => e.getAttribute('data-board-menu-item') + ':' + e.textContent.trim()), hasUnlink: /unlink/i.test(m.textContent) } : null; })()`);
    ok('P1: the menu has EXACTLY two rows, Add Board then New Board — and NO Unlink row (Unlink acts on a particular board; the ＋ belongs to the board you stand on)',
      !!menu && JSON.stringify(menu.items) === JSON.stringify(['add:Add Board', 'new:New Board']) && menu.hasUnlink === false, JSON.stringify(menu));

    // ========================================================================
    // Add Board → the connect list, with T4's row states. From Lore: Notes is
    // ALREADY INSIDE; Plot and Characters are pressable (Characters contains
    // Plot, not Lore). No self row.
    // ========================================================================
    if (await press(app, '[data-board-menu-item="add"]', 'Add Board')) {
      await sleep(150);
      const rows = await app.evalJs(`Array.from(document.querySelectorAll('[data-board-connect-row]')).map(e => [e.getAttribute('data-board-connect-row'), e.getAttribute('data-state')])`);
      const m = Object.fromEntries(rows);
      ok('T4: the connect list has NO row for the current board itself (self is ABSENT — nonsense, not a refusal)', !('b-lore' in m), JSON.stringify(rows));
      ok('T4/7: a board already inside is present, inert, and says so', m['b-notes'] === 'already-inside', JSON.stringify(rows));
      ok('T4: any other board is pressable', m['b-cast'] === 'pressable' && m['b-plot'] === 'pressable', JSON.stringify(rows));
      const noteText = await app.evalJs("document.querySelector('[data-board-connect-row=\"b-notes\"] .board-tabs-connect-note')?.textContent ?? null");
      ok('T4/7: the inert row reads "already inside"', noteText === 'already inside', String(noteText));
      // 9 · the band never lays a panel over the canvas (item 166).
      const wrap = await rectOf(app, '.board-canvas-wrap');
      const list = await rectOf(app, '[data-board-connect-list]');
      ok('9: the open list never overlays the canvas — the wrap\'s rect and the list\'s rect do not intersect (item 166; the room law re-measured the wrap)',
        !!wrap && !!list && !intersects(wrap, list), JSON.stringify({ wrap, list }));
      // Pressing an inert row writes nothing.
      const loreNow = JSON.stringify((await rawEntry(app, 'b-lore'))?.boxes);
      await press(app, '[data-board-connect-row="b-notes"]', 'the inert already-inside row');
      await sleep(2500);
      ok('T4/7: pressing an inert row writes nothing', JSON.stringify((await rawEntry(app, 'b-lore'))?.boxes) === loreNow);

      // ======================================================================
      // 5 · ⛔ CONNECT, AND IT SURVIVES (item 92, asserted at the new door).
      // Press Characters: its card is on the canvas WITHOUT a remount; then move
      // ANOTHER card, wait past AUTOSAVE_MS, reload — the pin is still there.
      // ======================================================================
      if (await press(app, '[data-board-connect-row="b-cast"]', 'connect row b-cast')) {
        await sleep(300);
        const live = await app.evalJs("(window.wrizoBoard ? window.wrizoBoard() : []).some(b => b.kind === 'page-pin' && b.entryId === 'b-cast')");
        ok('5: the chosen board\'s card is on the canvas WITHOUT a remount (appended to the component\'s own live boxes — item 92\'s law)', live === true);
        const drag = await hittablePointBy(app, "document.querySelector('[data-box-id=\"lore-t1\"]')");
        if (drag && drag.found) {
          await app.mouseDown(drag.x, drag.y);
          await app.mouseMove(drag.x + 20, drag.y + 12);
          await app.mouseMove(drag.x + 40, drag.y + 24);
          await app.mouseUp(drag.x + 40, drag.y + 24);
        } else {
          ok('5 (driver): a card to edit is reachable by a real pointer', false, JSON.stringify(drag));
        }
        await sleep(2600); // past AUTOSAVE_MS
        await app.reload();
        await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'b-lore after reload' });
        await sleep(300);
        const after = await rawEntry(app, 'b-lore');
        const pinKept = (after?.boxes ?? []).some(b => b.kind === 'page-pin' && b.entryId === 'b-cast');
        const moved = (after?.boxes ?? []).find(b => b.id === 'lore-t1');
        ok('5 ⛔ item 92 at the new door: after editing another card, waiting past AUTOSAVE_MS and reloading, the nested board\'s pin is STILL there (a check that stops at the store write passes while the card is erased)',
          pinKept === true && !!moved && moved.x > 0.05, JSON.stringify({ pinKept, movedX: moved?.x }));
      }
    }
  }

  // ==========================================================================
  // 6 · THE CYCLE, MET. From Plot (inside Characters): Characters is present,
  // inert, "contains this board"; pressing it writes nothing.
  // ==========================================================================
  await freshDesk(app);
  await seed(app);
  await app.reload();
  await openBoard(app, 'b-plot');
  if (await press(app, '[data-board-plus]', 'the ＋ on Plot') && await press(app, '[data-board-menu-item="add"]', 'Add Board (on Plot)')) {
    await sleep(150);
    const rows = Object.fromEntries(await app.evalJs(`Array.from(document.querySelectorAll('[data-board-connect-row]')).map(e => [e.getAttribute('data-board-connect-row'), e.getAttribute('data-state')])`));
    ok('6: an ANCESTOR (Characters contains Plot) is present, inert, reads "contains this board" — item 128\'s invariant met where the writer meets it',
      rows['b-cast'] === 'contains-this-board', JSON.stringify(rows));
    const plotBefore = JSON.stringify((await rawEntry(app, 'b-plot'))?.boxes);
    const castBefore2 = JSON.stringify((await rawEntry(app, 'b-cast'))?.boxes);
    await press(app, '[data-board-connect-row="b-cast"]', 'the inert ancestor row');
    await sleep(2500);
    ok('6: pressing the ancestor row writes nothing — neither board\'s boxes changed',
      JSON.stringify((await rawEntry(app, 'b-plot'))?.boxes) === plotBefore && JSON.stringify((await rawEntry(app, 'b-cast'))?.boxes) === castBefore2);
  }

  // ==========================================================================
  // 8 · NEW BOARD: born in this drawer, nested inside this one, name field
  // focused, and the writer travels to it.
  // ==========================================================================
  await freshDesk(app);
  await seed(app);
  await app.reload();
  await openBoard(app, 'b-lore');
  const idsBefore = await app.evalJs("JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').map(e => e.id)");
  if (await press(app, '[data-board-plus]', 'the ＋ on Lore') && await press(app, '[data-board-menu-item="new"]', 'New Board')) {
    await app.waitFor("location.hash !== '#/page/b-lore'", { label: 'travelled to the new board' });
    await sleep(700);
    const bornId = await app.evalJs("location.hash.replace('#/page/', '')");
    const born = await rawEntry(app, bornId);
    const lore = await rawEntry(app, 'b-lore');
    const novelId = await app.evalJs('window.__i144?.novel ?? null');
    ok('8: the new board is born a BOARD, in THIS drawer',
      !!born && born.pageType === 'board' && !idsBefore.includes(bornId) && born.projectId === (lore?.projectId ?? null), JSON.stringify({ bornId, projectId: born?.projectId, loreProject: lore?.projectId, novelId }));
    ok('8: and NESTED inside the board it was made from — Lore holds a page-pin to it',
      (lore?.boxes ?? []).some(b => b.kind === 'page-pin' && b.entryId === bornId), JSON.stringify((lore?.boxes ?? []).map(b => b.kind + ':' + (b.entryId ?? ''))));
    const focused = await app.evalJs("document.activeElement?.classList?.contains('crumb-rename') === true");
    ok('8: its name field is FOCUSED on arrival (item 136\'s ruling — a nameless board gives a nameless field)', focused === true);
    const state = await app.evalJs('history.state && history.state.usr ? JSON.stringify(history.state.usr) : null');
    ok('8: the one-shot birth flag is consumed — a refresh never re-opens the name field', state === null || !/nameFocus/.test(state), String(state));
  }

  // ==========================================================================
  // 10 · THE MODE STRIP IS UNTOUCHED, and nothing in the row claims a tablist.
  // 11 · COLOUR: the current tab's marker is the OLIVE (--accent-rest).
  // ==========================================================================
  await freshDesk(app);
  await seed(app);
  await app.reload();
  await openBoard(app, 'b-cast');
  const roles = await app.evalJs(`({
    tablists: Array.from(document.querySelectorAll('[role="tablist"]')).map(e => e.className || e.tagName),
    tabsInRow: document.querySelectorAll('[data-board-tabs] [role="tab"], [data-board-tabs] [role="tablist"]').length,
  })`);
  ok('10: the mode strip is untouched — exactly one role="tablist" on the board and it is the mode strip; the row claims none',
    roles.tablists.length === 1 && /board-mode-strip/.test(roles.tablists[0]) && roles.tabsInRow === 0, JSON.stringify(roles));
  const colour = await app.evalJs(`(() => {
    const probe = document.createElement('div'); probe.style.color = 'var(--accent-rest)'; document.body.appendChild(probe);
    const olive = getComputedStyle(probe).color; probe.remove();
    const cur = document.querySelector('[data-board-tab][aria-current="page"]');
    return { olive, marker: cur ? getComputedStyle(cur).borderBottomColor : null };
  })()`);
  ok('11: the current tab\'s where-you-are marker is drawn from --accent-rest (olive) — a where-you-are marker, not a tag or a selection',
    !!colour.marker && colour.marker === colour.olive, JSON.stringify(colour));

  // ==========================================================================
  // S0 (item 169) — THE STAGE WIDTHS, MEASURED, and the pane rule applied to them.
  // Amendment §5: panes = the largest n <= 3 such that n x CANVAS_MIN_W (560) +
  // (n-1) x gutter <= the stage's measured width. The gutter is NOT ruled; this
  // uses --frame-gap (28px), the only gap token the frame has, and states it.
  // The check is that the MEASURED stage width equals the CSS arithmetic
  // (min(viewport - 2 x --frame-host-pad-x, --frame-max = 1720)) — so the
  // derivation the table rests on is itself proved rather than assumed.
  // ==========================================================================
  const CANVAS_MIN_W = 560, GUTTER = 28, FRAME_MAX = 1720;
  const paneRule = (stageW) => { let n = 1; for (const k of [2, 3]) if (k * CANVAS_MIN_W + (k - 1) * GUTTER <= stageW) n = k; return n; };
  const table = [];
  for (const w of [1100, 1280, 1366, 1440, 1680, 1920, 2200]) {
    await freshDesk(app, w, 900);
    await seed(app);
    await app.reload();
    await openBoard(app, 'b-cast', w, 900);
    const m = await app.evalJs(`(() => {
      const s = document.querySelector('.desk-frame-stage'); const h = document.querySelector('.desk-frame-host');
      return { stage: s ? s.getBoundingClientRect().width : null, vw: innerWidth, hostPad: h ? parseFloat(getComputedStyle(h).paddingLeft) : null };
    })()`);
    const expected = Math.min(m.vw - 2 * m.hostPad, FRAME_MAX);
    table.push({ w, vw: m.vw, stage: Math.round(m.stage), expected: Math.round(expected), panes: paneRule(m.stage) });
    ok(`S0 (169) @ ${w}: the measured stage width equals min(viewport - 2 x host padding, --frame-max) — the arithmetic the pane table rests on (±2px); panes by the rule = ${paneRule(m.stage)}`,
      m.stage != null && Math.abs(m.stage - expected) <= 2, JSON.stringify({ stage: m.stage, expected, vw: m.vw, hostPad: m.hostPad }));
  }
  ok('S0 (169) REPORT — stage width and pane count at each tested width (the rule, with a 28px gutter and 560 per pane)', true, JSON.stringify(table));

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// === PARKED — gated behind HARNESS_PARKED=1. ===============================
// NONE in this file: it is new and edits no prior assertion. Parks this build
// may CAUSE in OTHER files (a harness asserting board content geometry, or a
// `role="tablist"` count, now sees a row it never knew) are found by the pair,
// not guessed at here — and are parked verbatim with a successor, never edited.
// Emitted anyway: park COUNT, not green.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  // eslint-disable-next-line no-console
  console.log(`\nI144 PARKED: PASS (${parkedChecks.length} checks) — nothing parked in this file`);
}
const allChecks = checks.concat(parkedChecks);
const pass = allChecks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nI144 VERIFY: PASS (${allChecks.length} checks) — PARTIAL FILE (see header)` : `\nI144 VERIFY: FAIL — ${allChecks.filter((c) => !c.pass).length}/${allChecks.length} failed`);
process.exit(pass ? 0 : 1);
