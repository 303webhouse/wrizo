// ITEM 144 — THE BOARD TABS (docs/menus/b144-board-tabs-build-brief.md S2, as
// amended by b144-plus-menu-and-unnest-amendment.md §6).
// Run: node apps/desktop/scripts/harness/i144.mjs   (repo root, dist-web freshly
// built via `pnpm run build:web`; needs a box turn — it opens a real browser).
//
// BUILT (stated, never implied): the row, its order and stability, a press that
// travels, the bare "＋" with its THREE rows in Nick's literal words (Add Board = a
// NEW board inside; New Board = a NEW board beside; Connect Board = a recents-first
// toggle list connecting BESIDE), beside connections STORED in `besideLinks` (the
// client half; the server column is gated on Fable's S0 review), Unlink on each
// tab's ⋯ (nested and beside), un-nesting by dragging the POINTER off the canvas
// (the card stops — item 118), double-click-replaces-parent with a back arrow, item
// 92's survival at the new door, the room law, and item 169's stage-width
// measurement. NOT BUILT, and so NOT CHECKED: the trash-icon collision (item 168
// owns Delete; `[data-trash-target]` does not exist yet), a release over ANOTHER
// PANE (169 — no second pane exists), T5's tag narrowing (gated on item 108).
// The stage-1 checks for "Add Board picks an existing board" (the connect list's
// already-inside / contains-this-board rows) targeted the alternative reading; that
// build never ran and is rewritten, not parked — the Plan menu's Connect Board
// ("Put inside…") is where that list belongs.
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
  // P9 · THE "＋": no visible word, the direction in its accessible name; its menu
  // has THREE rows in Nick's literal words — Add Board (a NEW board INSIDE), New
  // Board (a NEW board BESIDE), Connect Board (a toggle-open list) — and NO Unlink.
  // (Supersedes the stage-1 "exactly two rows" reading, which was built to the
  // alternative reading before the second amendment landed; it never ran, so it is
  // rewritten rather than parked.)
  // ==========================================================================
  await freshDesk(app);
  await seed(app);
  await app.reload();
  // This device opens Characters, then Plot, then Lore — so the recents list is [Lore, Plot, Characters].
  await openBoard(app, 'b-cast');
  await openBoard(app, 'b-plot');
  await openBoard(app, 'b-lore');
  const plus = await app.evalJs(`(() => { const b = document.querySelector('[data-board-plus]'); return b ? { text: b.textContent.trim(), name: b.getAttribute('aria-label') } : null; })()`);
  ok('P9: the "＋" carries NO visible word — a bare glyph — and its accessible name states the direction ("Add a board to Lore")',
    !!plus && plus.text === '＋' && plus.name === 'Add a board to Lore', JSON.stringify(plus));
  const besideCurrent = await app.evalJs(`(() => { const p = document.querySelector('[data-board-plus]'); const c = document.querySelector('[data-board-tab][aria-current="page"]'); return !!p && !!c && p.previousElementSibling === c; })()`);
  ok('P9: the "＋" sits beside the CURRENT board\'s tab (not at the row\'s end)', besideCurrent === true);
  if (await press(app, '[data-board-plus]', 'the ＋ beside the current tab')) {
    await sleep(150);
    const menu = await app.evalJs(`(() => { const m = document.querySelector('[data-board-menu]'); return m ? { items: Array.from(m.querySelectorAll('[role=menuitem]')).map(e => e.getAttribute('data-board-menu-item') + ':' + e.textContent.trim()), hasUnlink: /unlink/i.test(m.textContent) } : null; })()`);
    ok('P9: the menu has EXACTLY three rows in order — Add Board, New Board, Connect Board — and NO Unlink row (Unlink acts on a particular board; the ＋ belongs to the board you stand on)',
      !!menu && JSON.stringify(menu.items) === JSON.stringify(['add:Add Board', 'new:New Board', 'connect:Connect Board']) && menu.hasUnlink === false, JSON.stringify(menu));

    // ========================================================================
    // P11 · CONNECT BOARD's list order. This device opens Characters, Plot, Lore
    // (in that order, so the fallback tail is by updatedAt). The list on Lore reads
    // by ids: most-recently-opened first (Plot, then Characters), then the boards
    // this device has NEVER opened by updatedAt descending; the current board is
    // ABSENT.
    // ========================================================================
    if (await press(app, '[data-board-menu-item="connect"]', 'Connect Board')) {
      await sleep(150);
      const rows = await app.evalJs(`Array.from(document.querySelectorAll('[data-board-connect-row]')).map(e => [e.getAttribute('data-board-connect-row'), e.getAttribute('data-state')])`);
      const orderIds = rows.map(r => r[0]);
      ok('P11: the list reads Plot, Characters (most-recently OPENED first — opened Characters, then Plot, then Lore), then Notes (never opened here: the updatedAt fallback tail); the current board is ABSENT — read by ids, never positions',
        JSON.stringify(orderIds) === JSON.stringify(['b-plot', 'b-cast', 'b-notes']), JSON.stringify(orderIds));
      // 9 · the band never lays a panel over the canvas (item 166).
      const wrap = await rectOf(app, '.board-canvas-wrap');
      const list = await rectOf(app, '[data-board-connect-list]');
      ok('9: the open list never overlays the canvas — the wrap\'s rect and the list\'s rect do not intersect (item 166; the room law re-measured the wrap)',
        !!wrap && !!list && !intersects(wrap, list), JSON.stringify({ wrap, list }));

      // ======================================================================
      // Connect: press Characters. It is connected BESIDE Lore — a record on
      // LORE's row (where the writer stood), nothing on Characters' row, NO
      // page-pin written in either board — and BOTH boards show the connection:
      // Lore's tab shows Characters as besideCurrent, and Characters (the reverse
      // read) lists Lore as a tab too.
      // ======================================================================
      const castBoxesBefore = JSON.stringify((await rawEntry(app, 'b-cast'))?.boxes);
      if (await press(app, '[data-board-connect-row="b-cast"]', 'connect row b-cast')) {
        await sleep(700);
        const lore = await rawEntry(app, 'b-lore');
        const cast = await rawEntry(app, 'b-cast');
        const rec = (lore?.besideLinks?.links ?? []).filter(l => !l.deletedAt && l.boardId === 'b-cast');
        ok('Connect: the connection is STORED on the board the writer stood on (a live `besideLinks` record on Lore naming Characters)',
          rec.length === 1, JSON.stringify(lore?.besideLinks));
        ok('Connect: the OTHER end stores nothing (Characters\' row has no besideLinks) — both read it by the reverse scan',
          cast?.besideLinks === undefined, JSON.stringify(cast?.besideLinks));
        ok('Connect: it is BESIDE, not INSIDE — no page-pin was written on either board, and Characters\' boxes are byte-identical',
          !(lore?.boxes ?? []).some(b => b.kind === 'page-pin' && b.entryId === 'b-cast') && JSON.stringify(cast?.boxes) === castBoxesBefore);
        const stay = await app.evalJs('location.hash');
        ok('Connect: the writer STAYS on the board (no travel)', stay === '#/page/b-lore', String(stay));
        await sleep(2500);
        await app.reload();
        await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'b-lore after reload' });
        await sleep(300);
        const afterReload = await rawEntry(app, 'b-lore');
        ok('P13: the connection survives a reload on the same device', (afterReload?.besideLinks?.links ?? []).some(l => !l.deletedAt && l.boardId === 'b-cast'));
        // The reverse read: from Characters, Lore is a tab that is beside the current board.
        await openBoard(app, 'b-cast');
        const loreBesideCast = await app.evalJs(`(() => { const t = document.querySelector('[data-board-tab="b-lore"]'); const more = document.querySelector('[data-board-tab-more="b-lore"]'); return { tab: !!t, unlinkable: !!more }; })()`);
        ok('Connect: from CHARACTERS the connection shows too (the reverse read) — Lore\'s tab carries the Unlink ⋯ ("beside the current board")',
          loreBesideCast.tab === true && loreBesideCast.unlinkable === true, JSON.stringify(loreBesideCast));
      }
    }
  }

  // ==========================================================================
  // P10 · ADD BOARD = a NEW board INSIDE this one; NEW BOARD = a NEW board BESIDE.
  // ==========================================================================
  await freshDesk(app);
  await seed(app);
  await app.reload();
  await openBoard(app, 'b-lore');
  const idsBefore = await app.evalJs("JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').map(e => e.id)");
  if (await press(app, '[data-board-plus]', 'the ＋ on Lore') && await press(app, '[data-board-menu-item="add"]', 'Add Board')) {
    await app.waitFor("location.hash !== '#/page/b-lore'", { label: 'travelled to the new inside board' });
    await sleep(700);
    const bornId = await app.evalJs("location.hash.replace('#/page/', '')");
    const born = await rawEntry(app, bornId);
    const lore = await rawEntry(app, 'b-lore');
    ok('P10 Add Board: a NEW board, born a BOARD in THIS drawer',
      !!born && born.pageType === 'board' && !idsBefore.includes(bornId) && born.projectId === (lore?.projectId ?? null), JSON.stringify({ bornId, projectId: born?.projectId, loreProject: lore?.projectId }));
    ok('P10 Add Board: NESTED INSIDE the board it was made from — Lore holds a page-pin to it',
      (lore?.boxes ?? []).some(b => b.kind === 'page-pin' && b.entryId === bornId), JSON.stringify((lore?.boxes ?? []).map(b => b.kind + ':' + (b.entryId ?? ''))));
    ok('P10 Add Board: no BESIDE record was written (inside is not beside)', lore?.besideLinks === undefined, JSON.stringify(lore?.besideLinks));
    const focused = await app.evalJs("document.activeElement?.classList?.contains('crumb-rename') === true");
    ok('P10 Add Board: its name field is FOCUSED on arrival (item 136\'s ruling — a nameless board gives a nameless field)', focused === true);
    const state = await app.evalJs('history.state && history.state.usr ? JSON.stringify(history.state.usr) : null');
    ok('P10 Add Board: the one-shot birth flag is consumed — a refresh never re-opens the name field', state === null || !/nameFocus/.test(state), String(state));
    // ⛔ item 92 at THIS door: edit another card on the parent, wait past AUTOSAVE_MS, reload — the pin holds.
    await openBoard(app, 'b-lore');
    const drag = await hittablePointBy(app, "document.querySelector('[data-box-id=\"lore-t1\"]')");
    if (drag && drag.found) {
      await app.mouseDown(drag.x, drag.y);
      await app.mouseMove(drag.x + 20, drag.y + 12);
      await app.mouseMove(drag.x + 40, drag.y + 24);
      await app.mouseUp(drag.x + 40, drag.y + 24);
    } else ok('P10 (driver): a card to edit is reachable by a real pointer', false, JSON.stringify(drag));
    await sleep(2600);
    await app.reload();
    await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'b-lore after reload' });
    await sleep(300);
    const after = await rawEntry(app, 'b-lore');
    const moved = (after?.boxes ?? []).find(b => b.id === 'lore-t1');
    ok('P10 ⛔ item 92 at the new door: after editing another card, waiting past AUTOSAVE_MS and reloading, the new nested board\'s pin is STILL there (a check that stops at the store write passes while the card is erased)',
      (after?.boxes ?? []).some(b => b.kind === 'page-pin' && b.entryId === bornId) && !!moved && moved.x > 0.05, JSON.stringify({ movedX: moved?.x }));
  }

  await freshDesk(app);
  await seed(app);
  await app.reload();
  await openBoard(app, 'b-lore');
  const idsBefore2 = await app.evalJs("JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').map(e => e.id)");
  const loreBoxesBefore = JSON.stringify((await rawEntry(app, 'b-lore'))?.boxes);
  if (await press(app, '[data-board-plus]', 'the ＋ on Lore') && await press(app, '[data-board-menu-item="new"]', 'New Board')) {
    await sleep(900);
    const newIds = (await app.evalJs("JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').map(e => e.id)")).filter(x => !idsBefore2.includes(x));
    const bornId = newIds[0];
    const born = await rawEntry(app, bornId);
    const lore = await rawEntry(app, 'b-lore');
    ok('P10 New Board: exactly ONE new board, born a BOARD in THIS drawer', newIds.length === 1 && born?.pageType === 'board' && born?.projectId === lore?.projectId, JSON.stringify({ newIds }));
    ok('P10 New Board: NOT nested — no page-pin written in either board (beside is not inside)',
      JSON.stringify(lore?.boxes) === loreBoxesBefore && !(born?.boxes ?? []).some(b => b.kind === 'page-pin'), JSON.stringify(lore?.boxes?.map(b => b.kind + ':' + (b.entryId ?? ''))));
    ok('P10 New Board: CONNECTED beside — a live record on Lore naming the new board',
      (lore?.besideLinks?.links ?? []).some(l => !l.deletedAt && l.boardId === bornId), JSON.stringify(lore?.besideLinks));
    ok('P10 New Board: the writer STAYS put (no travel)', (await app.evalJs('location.hash')) === '#/page/b-lore');
    const tab = await app.evalJs(`!!document.querySelector('[data-board-tab="${bornId}"]')`);
    ok('P10 New Board: its tab is in the row at once', tab === true);
    const whisper = await app.evalJs("document.querySelector('.action-toast')?.textContent ?? null");
    ok('P10 New Board: a whisper says where it went', typeof whisper === 'string' && /added beside Lore/.test(whisper), String(whisper));
  }

  // ==========================================================================
  // P3 · UNLINK, on each tab's own ⋯ — present ONLY on a nested (or beside) tab,
  // reads "Unlink from <parent>", writes MEMBERSHIP ONLY. From Characters: Plot is
  // nested (Unlink from Characters); Lore is a plain drawer sibling (NO ⋯ at all —
  // absent, not greyed).
  // ==========================================================================
  await freshDesk(app);
  await seed(app);
  await app.reload();
  await openBoard(app, 'b-cast');
  const mores = await app.evalJs("Array.from(document.querySelectorAll('[data-board-tab-more]')).map(e => e.getAttribute('data-board-tab-more'))");
  ok('P3: the ⋯ is present ONLY on tabs with something to unlink — Plot (nested in Characters) and Notes (nested in Lore) — and ABSENT on Characters and Lore (absent, not greyed)',
    JSON.stringify(mores.slice().sort()) === JSON.stringify(['b-notes', 'b-plot']), JSON.stringify(mores));
  const plotBefore = JSON.stringify(await rawEntry(app, 'b-plot'));
  const notesBefore = JSON.stringify(await rawEntry(app, 'b-notes'));
  if (await press(app, '[data-board-tab-more="b-plot"]', 'the ⋯ on Plot')) {
    await sleep(150);
    const acts = await app.evalJs("Array.from(document.querySelectorAll('[data-board-unlink-tab=\"b-plot\"]')).map(e => e.textContent.trim())");
    ok('P3: the act reads with its parent NAMED — "Unlink from Characters", never a bare "Unlink"', JSON.stringify(acts) === JSON.stringify(['Unlink from Characters']), JSON.stringify(acts));
    if (await press(app, '[data-board-unlink="nested"][data-board-unlink-tab="b-plot"]', 'Unlink from Characters')) {
      await sleep(2600);
      const cast = await rawEntry(app, 'b-cast');
      ok('P3: it wrote MEMBERSHIP ONLY — Characters no longer holds Plot\'s pin; Plot\'s own record and Notes are byte-identical (nothing deleted)',
        !(cast?.boxes ?? []).some(b => b.kind === 'page-pin' && b.entryId === 'b-plot')
          && JSON.stringify(await rawEntry(app, 'b-plot')) === plotBefore && JSON.stringify(await rawEntry(app, 'b-notes')) === notesBefore);
      const depth = await app.evalJs("document.querySelector('[data-board-tab=\"b-plot\"]')?.closest('.board-tab-wrap')?.getAttribute('data-depth')");
      ok('P3: after Unlink the tab takes its birth-order place at the ROOT of the drawer row (depth 0), still in the row', depth === '0', String(depth));
    }
  }

  // ==========================================================================
  // Unlink a BESIDE connection (Nick answered the storage question: stored, so
  // this is buildable). Connect Lore beside Characters from Lore, then Unlink from
  // the Lore tab's ⋯ on Characters' board.
  // ==========================================================================
  await freshDesk(app);
  await seed(app);
  await app.evalJs(`(() => { const t = new Date().toISOString(); window.wrizoPatchEntry('b-lore', { besideLinks: { links: [{ id: 'seed-beside', boardId: 'b-cast', createdAt: t, updatedAt: t }] } }); })()`);
  await app.reload();
  await openBoard(app, 'b-cast');
  if (await press(app, '[data-board-tab-more="b-lore"]', 'the ⋯ on Lore (beside Characters)')) {
    await sleep(150);
    const acts = await app.evalJs("Array.from(document.querySelectorAll('[data-board-unlink-tab=\"b-lore\"]')).map(e => e.getAttribute('data-board-unlink') + ':' + e.textContent.trim())");
    ok('P3 beside: the act reads "Unlink from Characters" (the CURRENT board named)', JSON.stringify(acts) === JSON.stringify(['beside:Unlink from Characters']), JSON.stringify(acts));
    if (await press(app, '[data-board-unlink="beside"][data-board-unlink-tab="b-lore"]', 'Unlink from Characters (beside)')) {
      await sleep(2600);
      const lore = await rawEntry(app, 'b-lore');
      const rec = (lore?.besideLinks?.links ?? []).find(l => l.id === 'seed-beside');
      ok('P3 beside: the record is SOFT-DELETED (deletedAt set) on the row that stored it — not removed, and no board deleted',
        !!rec && !!rec.deletedAt && !!(await rawEntry(app, 'b-cast')) && !!lore, JSON.stringify(rec));
      const gone = await app.evalJs("!document.querySelector('[data-board-tab-more=\"b-lore\"]')");
      ok('P3 beside: the ⋯ is gone — absent, not greyed — once nothing remains to unlink', gone === true);
    }
  }

  // ==========================================================================
  // P4/P5 · THE DRAG. A nested board's card: the card STOPS at the canvas edge
  // (item 118) and only the POINTER leaves. Real pointer events; released where a
  // writer would release (outside the element).
  // ==========================================================================
  await freshDesk(app);
  await seed(app);
  await app.reload();
  await openBoard(app, 'b-cast');
  const wrapR = await rectOf(app, '.board-canvas-wrap');
  const pinPoint = await hittablePointBy(app, "document.querySelector('[data-box-id=\"pin-plot\"]')");
  if (wrapR && pinPoint && pinPoint.found) {
    const y = pinPoint.y;
    // P5 · NOT armed: to the edge and released INSIDE — nothing written; no band ever.
    await app.mouseDown(pinPoint.x, y);
    await app.mouseMove(pinPoint.x + 30, y + 4);
    await app.mouseMove(wrapR.r - 8, y + 4);
    const bandInside = await app.evalJs("!!document.querySelector('[data-unnest-band]')");
    await app.mouseUp(wrapR.r - 8, y + 4);
    await sleep(2600);
    ok('P5: dragged to the edge and released INSIDE — the band never showed and NOTHING was unlinked (a card dragged TO the edge does nothing)',
      bandInside === false && (await rawEntry(app, 'b-cast'))?.boxes?.some(b => b.kind === 'page-pin' && b.entryId === 'b-plot') === true);
  }

  await freshDesk(app);
  await seed(app);
  await app.reload();
  await openBoard(app, 'b-cast');
  {
    const wr = await rectOf(app, '.board-canvas-wrap');
    const pp = await hittablePointBy(app, "document.querySelector('[data-box-id=\"pin-plot\"]')");
    if (wr && pp && pp.found) {
      const y = pp.y;
      await app.mouseDown(pp.x, y);
      await app.mouseMove(pp.x + 30, y + 4);
      await app.mouseMove(wr.r + 60, y + 4); // the POINTER goes 60px past the canvas's edge
      await sleep(120);
      const armed = await app.evalJs(`(() => {
        const band = document.querySelector('[data-unnest-band]');
        const canvas = document.querySelector('.board-canvas')?.getBoundingClientRect();
        const card = document.querySelector('[data-box-id="pin-plot"]')?.getBoundingClientRect();
        return { band: band ? band.textContent.trim() : null, cardInside: !!card && !!canvas && card.right <= canvas.right + 1 && card.left >= canvas.left - 1 };
      })()`);
      ok('P4: the pointer 60px past the edge ARMS it — a band reading "Release to unlink from Characters" (the parent named)',
        typeof armed.band === 'string' && /Release to unlink from Characters/.test(armed.band), JSON.stringify(armed));
      ok('P4: and the CARD never left the canvas — item 118\'s hard stop holds; only the pointer left', armed.cardInside === true, JSON.stringify(armed));
      await app.mouseUp(wr.r + 60, y + 4); // released OUTSIDE the element
      await sleep(2600);
      const cast = await rawEntry(app, 'b-cast');
      ok('P4: released while armed = UNLINK — Characters no longer holds Plot\'s pin, and Plot\'s own record is untouched',
        !(cast?.boxes ?? []).some(b => b.kind === 'page-pin' && b.entryId === 'b-plot') && !!(await rawEntry(app, 'b-plot')));
      const left = await app.evalJs("({ band: !!document.querySelector('[data-unnest-band]'), armed: document.querySelector('.board-canvas')?.getAttribute('data-unnest-armed') })");
      ok('P4: NOTHING is left armed after release (no band, data-unnest-armed=false)', left.band === false && left.armed === 'false', JSON.stringify(left));
      const undo = await trustedDispatch(app, "Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Undo')", 'the board\'s Undo', { report: ok });
      if (undo) {
        await sleep(2600);
        ok('P4: the board\'s own Undo restores it — the drag\'s start snapshot, the pin is back',
          (await rawEntry(app, 'b-cast'))?.boxes?.some(b => b.kind === 'page-pin' && b.entryId === 'b-plot') === true);
      }
    }
  }
  // A plain TEXT card dragged past the edge arms nothing.
  await freshDesk(app);
  await seed(app);
  await app.reload();
  await openBoard(app, 'b-lore');
  {
    const wr = await rectOf(app, '.board-canvas-wrap');
    const tp = await hittablePointBy(app, "document.querySelector('[data-box-id=\"lore-t1\"]')");
    if (wr && tp && tp.found) {
      await app.mouseDown(tp.x, tp.y);
      await app.mouseMove(tp.x + 30, tp.y + 4);
      await app.mouseMove(wr.r + 60, tp.y + 4);
      await sleep(120);
      const band = await app.evalJs("!!document.querySelector('[data-unnest-band]')");
      await app.mouseUp(wr.r + 60, tp.y + 4);
      ok('P5: a plain TEXT card dragged past the edge arms NOTHING — only a nested board\'s card can', band === false);
    }
  }

  // ==========================================================================
  // P7 · DOUBLE-CLICK a nested board: the child replaces the parent, with a back
  // arrow named for the parent; ONE press returns the parent AS IT WAS LEFT — its
  // canvas scroll and its selection — and the tabs' ids are identical throughout.
  // ==========================================================================
  await freshDesk(app);
  await seed(app);
  await app.reload();
  await openBoard(app, 'b-lore');
  {
    const idsStart = await tabIds(app);
    await app.evalJs("(() => { const w = document.querySelector('.board-canvas-wrap'); w.scrollTop = 180; })()");
    const sel = await hittablePointBy(app, "document.querySelector('[data-box-id=\"lore-t1\"]')");
    if (sel && sel.found) { await app.mouseDown(sel.x, sel.y); await app.mouseUp(sel.x, sel.y); }
    await sleep(150);
    const pin = await hittablePointBy(app, "document.querySelector('[data-box-id=\"pin-notes\"]')");
    // Read AFTER hittablePointBy: it scrolls its target into view, and the frame records the scroll at departure.
    const scrollBefore = await app.evalJs("document.querySelector('.board-canvas-wrap').scrollTop");
    if (pin && pin.found) {
      await app.doubleClick(pin.x, pin.y);
      await app.waitFor("location.hash === '#/page/b-notes'", { label: 'the child replaced the parent' });
      await sleep(400);
      const arrow = await app.evalJs("document.querySelector('[data-board-back]')?.getAttribute('aria-label') ?? null");
      ok('P7: the child replaces the parent and an icon-only back arrow appears, named for the parent ("Back to Lore")', arrow === 'Back to Lore', String(arrow));
      ok('P7: the tabs\' ids are identical throughout — entering the child moved only the olive marker', JSON.stringify(await tabIds(app)) === JSON.stringify(idsStart) && (await currentTab(app)) === 'b-notes');
      if (await press(app, '[data-board-back]', 'the back arrow')) {
        await app.waitFor("location.hash === '#/page/b-lore'", { label: 'returned to the parent' });
        await sleep(600);
        const back = await app.evalJs(`({ scroll: document.querySelector('.board-canvas-wrap').scrollTop, sel: document.querySelector('[data-box-id="pin-notes"]')?.getAttribute('data-selected') ?? null })`);
        ok('P7: ONE press returns the parent AS IT WAS LEFT — canvas scroll and the selection (the card pressed to make the double-click) restored (the stateful return page-primacy asks of every departure)',
          Math.abs(back.scroll - scrollBefore) <= 2 && back.sel === 'true', JSON.stringify({ back, scrollBefore }));
        ok('P7: the tabs\' ids are still identical after the return', JSON.stringify(await tabIds(app)) === JSON.stringify(idsStart));
        ok('P7: the parent has no back arrow of its own (it was not entered through a nested board)', (await app.evalJs("!!document.querySelector('[data-board-back]')")) === false);
      }
    }
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
  // S0 (item 169) — THE STAGE WIDTHS, MEASURED, and the pane rule applied to them
  // with the TUNED constants (store/splitPanes.ts): pane minimum 480, gutter 28
  // (accepted). Nick's counts are the REQUIREMENT — two panes on laptops and
  // tablets, three on desktops. The measured stage width must equal the CSS
  // arithmetic (min(viewport - 2 x host padding, --frame-max = 1720)), so the table
  // rests on a proved derivation. The constants are restated here INDEPENDENTLY of
  // the module, so a change to one cannot quietly move the other's goalposts.
  // ==========================================================================
  const PANE_MIN = 480, GUTTER = 28, FRAME_MAX = 1720;
  const paneRule = (stageW) => { let n = 1; for (const k of [2, 3]) if (k * PANE_MIN + (k - 1) * GUTTER <= stageW) n = k; return n; };
  const wantPanes = { 1100: 2, 1280: 2, 1366: 2, 1440: 2, 1680: 3, 1920: 3, 2200: 3 };
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
    ok(`S0 (169) @ ${w}: the measured stage width equals min(viewport - 2 x host padding, --frame-max) (±2px)`,
      m.stage != null && Math.abs(m.stage - expected) <= 2, JSON.stringify({ stage: m.stage, expected, vw: m.vw, hostPad: m.hostPad }));
    ok(`S0 (169) @ ${w}: Nick's count is REACHABLE — ${wantPanes[w]} panes (${wantPanes[w] === 2 ? 'laptop/tablet' : 'desktop'}); the rule gives ${paneRule(m.stage)} from the MEASURED stage`,
      paneRule(m.stage) === wantPanes[w], JSON.stringify({ stage: m.stage, panes: paneRule(m.stage) }));
  }
  ok('S0 (169) REPORT — measured stage width and pane count at each tested width (pane min 480, gutter 28, frame max 1720)', true, JSON.stringify(table));

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
