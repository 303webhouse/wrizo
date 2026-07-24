// CD4 — the Two Retirements (docs/wrizo-alpha/cd4-two-retirements-brief.md). A
// committed CDP verification scenario (this project's "harness scenarios
// persist" convention). freshDesk/seedEntries/trustedClick are the bm1.mjs
// shapes — trustedClick uses the project's own genuinely-trusted CDP pointer
// (app.mouseMove/Down/Up) for the load-bearing door gestures (S1), never a
// coordinate-less synthetic click.
//
// Run: node scripts/harness/cd4.mjs   (from apps/desktop, dist-web freshly
// built via `pnpm run build:web`). HARNESS_PARKED=1: CD4's own park cycles do
// NOT live here — they travel VERBATIM in the SAME commit inside the existing
// files they falsify (b2.mjs S1 Board-Done → PAGE → door; cd1.mjs S2 gen-3 bar
// → gen-4 ['Pages','Plan →'] + the script gen; hb1.mjs/bm1.mjs cross-reference
// disclosures). This file is purely ADDITIVE — it proves the retirements' new
// truths, so its own park section is an empty no-op by design.
//
// What CD4 proves here:
//   S1 — "Done" is gone from every Board's exit chrome; the SAME PAGE → door
//        (Fable's ruling amending the brief) is every board's only exit, system
//        boards (Shelf/Trash/Journal) included, at framed AND legacy widths; the
//        door travels under GENUINE trusted pointer on the paired, unpaired, and
//        system-board (cold-load → backTo '/') paths.
//   S2 — the elder "Plan" flight tab (→ the legacy StructureBoard) is retired
//        from the page bars: prose now reads ['Pages','Plan →'] (its own arrow
//        door the only Plan word), script reads ['Pages'] (it has no PLAN →
//        door), at all three widths + legacy. The StructureBoard route/component
//        /schema are UNTOUCHED (dormant-not-dead is a code-level guarantee,
//        verifiable in the diff, not run here — StructureBoard redirects to '/'
//        without a storyPlan, so a runtime mount check would be a false signal).
//   Publish is untouched — Done's death does not disturb its neighbor.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const FLOOR_W = 1100, LAPTOP_W = 1280, WIDE_W = 2200, LEGACY_W = 1000;

const freshDesk = async (app, width = 1400, height = 900) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.emulateDpr(1, width, height);
};

const seedEntries = async (app, rows) => {
  await app.goto('/');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before seed' });
  await app.evalJs(`(() => {
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push(...${JSON.stringify(rows)});
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after seed hydrate' });
};

const rectOf = async (app, sel) =>
  app.evalJs(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null; const r = el.getBoundingClientRect(); return { left:r.left, right:r.right, top:r.top, bottom:r.bottom }; })()`);

const trustedClick = async (app, sel) => {
  const r = await rectOf(app, sel);
  if (!r) throw new Error('trustedClick: no element ' + sel);
  const x = (r.left + r.right) / 2, y = (r.top + r.bottom) / 2;
  await app.mouseMove(x, y);
  await app.mouseDown(x, y);
  await app.mouseUp(x, y);
  await sleep(160);
};

const openBoard = async (app, id) => {
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(id)}`);
  await app.waitFor("!!document.querySelector('.board-canvas') || !!document.querySelector('.board-projection')", { label: 'board ' + id });
  await sleep(200);
};

// Navigate to a system board via its gate route (/shelf|/trash|/journal ->
// getOrCreateSystemBoard -> /page/:boardId) and read its exit chrome.
const systemBoardExit = async (app, route) => {
  await app.evalJs(`location.hash = '#${route}'`);
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'system board ' + route });
  await sleep(220);
  return app.evalJs(`(() => {
    const door = document.querySelector('.board-door[data-board-door="page"]');
    const done = [...document.querySelectorAll('.sprint-actions button, .board-mode-strip button')].find(b => b.textContent.trim() === 'Done');
    return { hasDoor: !!door, doorLabel: door ? door.textContent.replace(/\\s+/g, ' ').trim() : null, hasDone: !!done };
  })()`);
};

// Create a fresh project of a kind (book|screenplay) through the real wizard and
// land on its writing surface; return the page id from the hash.
const freshProject = async (app, kind, width = LAPTOP_W) => {
  await freshDesk(app, width);
  await app.goto('/project/new');
  await app.waitFor(`!!document.querySelector('[data-kind="${kind}"]')`, { label: 'CreateProject picker (' + kind + ')' });
  await app.evalJs(`document.querySelector('[data-kind="${kind}"]').click()`);
  await app.click('Start writing');
  const readySel = kind === 'screenplay' ? '.script-el-active' : '.forward-only-editor';
  await app.waitFor(`!!document.querySelector('${readySel}')`, { label: kind + ' writing surface' });
  await sleep(250);
  return app.evalJs("location.hash.split('/page/')[1] || location.hash.replace('#','')");
};

const barButtons = async (app) =>
  app.evalJs("[...document.querySelectorAll('.sprint-actions button')].map(b => b.textContent.trim())");

await withHarness(async (app) => {
  // ======================================================================
  // S1 — "Done" dies; the PAGE → door is EVERY board's exit
  // ======================================================================

  // A user (loose) board still carries the door and no Done (framed).
  await freshDesk(app, LAPTOP_W);
  await seedEntries(app, [{ id: 'cd4-uboard', text: 'a user board', projectId: null, pageType: 'board', source: 'page', origin: 'loose', boxes: [], createdAt: '2026-07-01T00:00:00.000Z', updatedAt: '2026-07-01T00:00:00.000Z' }]);
  await openBoard(app, 'cd4-uboard');
  const uboard = await app.evalJs(`(() => {
    const door = document.querySelector('.board-door[data-board-door="page"]');
    const done = [...document.querySelectorAll('.sprint-actions button, .board-mode-strip button')].find(b => b.textContent.trim() === 'Done');
    return { hasDoor: !!door, hasDone: !!done };
  })()`);
  ok('S1: a user board (framed) carries the PAGE → door and NO "Done" button', uboard.hasDoor === true && uboard.hasDone === false, JSON.stringify(uboard));

  // Every SYSTEM board (Shelf, Trash, Journal) framed: the door is present, no Done.
  for (const [route, name] of [['/shelf', 'Shelf'], ['/trash', 'Trash'], ['/journal', 'Journal']]) {
    await freshDesk(app, LAPTOP_W);
    const ex = await systemBoardExit(app, route);
    ok(`S1 (Fable's ruling): the ${name} Board (framed) mounts the SAME PAGE → door and NO "Done"`,
      ex.hasDoor === true && ex.hasDone === false, JSON.stringify(ex));
    ok(`S1: the ${name} Board's door reads exactly "Page →" (one door grammar, no system-board dialect)`,
      ex.doorLabel === 'Page →', String(ex.doorLabel));
  }

  // The Shelf Board's door is present across ALL THREE framed widths + legacy.
  for (const [w, tag] of [[FLOOR_W, 'floor 1100'], [WIDE_W, 'wide 2200'], [LEGACY_W, 'legacy 1000']]) {
    await freshDesk(app, w);
    const ex = await systemBoardExit(app, '/shelf');
    ok(`S1 @${tag}px: the Shelf Board carries the PAGE → door and NO "Done" (framed+legacy consistent)`,
      ex.hasDoor === true && ex.hasDone === false, JSON.stringify(ex));
  }

  // Trusted pointer — the SYSTEM-board (cold-load) path: reached directly, the
  // door's unpaired branch lands backTo '/' (Arrival, itself a page — HB1).
  await freshDesk(app, LAPTOP_W);
  await app.evalJs("location.hash = '#/shelf'");
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'Shelf Board (trusted exit)' });
  await sleep(220);
  await trustedClick(app, '.board-door[data-board-door="page"]');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Shelf PAGE → -> backTo (trusted)' });
  const shelfHash = await app.evalJs('location.hash');
  ok('S1 (trusted pointer): the Shelf Board\'s PAGE → door, cold-loaded, lands backTo \'/\' (the cold-load fallback, Arrival is a page)',
    shelfHash === '' || shelfHash === '#/', shelfHash);

  // Trusted pointer — the PAIRED path: a prose page births its plan board (PLAN →),
  // and the board's PAGE → returns to the paired page.
  const paidPageId = await freshProject(app, 'book', LAPTOP_W);
  await trustedClick(app, '.page-plan-door');
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'flipped to plan board' });
  await trustedClick(app, '.board-door[data-board-door="page"]');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PAGE → back to paired page' });
  const returnedTo = await app.evalJs("location.hash.split('/page/')[1]");
  ok('S1 (trusted pointer): on a PAIRED board the PAGE → door returns to the paired page (unchanged at the new bar)',
    returnedTo === paidPageId, `returned=${returnedTo} expected=${paidPageId}`);

  // Trusted pointer — the UNPAIRED (loose) path: the door leaves the board.
  await freshDesk(app, LAPTOP_W);
  await seedEntries(app, [{ id: 'cd4-unpaired', text: 'unpaired board', projectId: null, pageType: 'board', source: 'page', origin: 'loose', boxes: [], createdAt: '2026-07-02T00:00:00.000Z', updatedAt: '2026-07-02T00:00:00.000Z' }]);
  await openBoard(app, 'cd4-unpaired');
  await trustedClick(app, '.board-door[data-board-door="page"]');
  await sleep(220);
  const leftUnpaired = await app.evalJs("!location.hash.includes('cd4-unpaired')");
  ok('S1 (trusted pointer): on an UNPAIRED loose board the PAGE → door travels the FX10 named return (leaves the board)',
    leftUnpaired === true, await app.evalJs('location.hash'));

  // ======================================================================
  // S2 — the elder "Plan" flight tab retires from the page bars
  // ======================================================================

  // Prose project page: the bar holds ['Pages','Plan →'] — the arrow door is the
  // only Plan word — at ALL THREE framed widths + legacy (reload re-mounts the
  // persisted page at the new viewport).
  const prosePageId = await freshProject(app, 'book', LAPTOP_W);
  const proseLaptop = await barButtons(app);
  ok('S2 @1280px: the prose project bar holds ONLY ["Pages","Plan →"] (the elder Plan flight tab retired)',
    JSON.stringify(proseLaptop) === JSON.stringify(['Pages', 'Plan →']), JSON.stringify(proseLaptop));

  // The .sprint-toggle now holds exactly one button, and nothing in the bar
  // navigates to the legacy /project/:id/board (structural retirement).
  const toggleShape = await app.evalJs(`(() => {
    const toggle = document.querySelector('.sprint-toggle');
    return {
      toggleAria: toggle ? toggle.getAttribute('aria-label') : null,
      toggleBtnCount: toggle ? toggle.querySelectorAll('button').length : null,
      planWordCount: [...document.querySelectorAll('.sprint-actions button')].filter(b => b.textContent.trim() === 'Plan').length,
    };
  })()`);
  ok('S2: the prose .sprint-toggle keeps its "Binder view" aria-label but holds exactly ONE button (Pages); no bare "Plan" flight tab remains',
    toggleShape.toggleAria === 'Binder view' && toggleShape.toggleBtnCount === 1 && toggleShape.planWordCount === 0,
    JSON.stringify(toggleShape));

  // Framed (>=1100) and legacy (<1100) differ ONLY in a pre-existing control
  // unrelated to CD4: the legacy prose bar carries a "Copy page text" button
  // (framed moved it out of top chrome in AB1/AB2). Either way the elder "Plan"
  // flight tab is gone and "Plan →" is present — that is the retirement CD4
  // proves, at every width.
  for (const [w, tag, expected] of [
    [FLOOR_W, 'floor 1100', ['Pages', 'Plan →']],
    [WIDE_W, 'wide 2200', ['Pages', 'Plan →']],
    [LEGACY_W, 'legacy 1000', ['Pages', 'Copy page text', 'Plan →']],
  ]) {
    await app.emulateDpr(1, w, 900);
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'prose page @' + tag });
    await sleep(200);
    const bar = await barButtons(app);
    const noBarePlan = !bar.includes('Plan');
    ok(`S2 @${tag}px: the prose bar is ${JSON.stringify(expected)} — elder "Plan" flight tab retired (no bare "Plan"), "Plan →" present (framed + legacy consistent)`,
      JSON.stringify(bar) === JSON.stringify(expected) && noBarePlan && bar.includes('Plan →'), JSON.stringify(bar));
  }
  void prosePageId;

  // Script project page: it carries no PLAN → door, so retiring the elder Plan
  // leaves ONLY ['Pages'].
  await freshProject(app, 'screenplay', LAPTOP_W);
  const scriptBar = await barButtons(app);
  ok('S2: the script project bar holds ONLY ["Pages"] (no PLAN → door on script; the elder Plan flight tab retired)',
    JSON.stringify(scriptBar) === JSON.stringify(['Pages']), JSON.stringify(scriptBar));

  // ======================================================================
  // Publish untouched — Done's death does not disturb its neighbor.
  // ======================================================================
  await freshProject(app, 'book', LAPTOP_W);
  const publish = await app.evalJs(`(() => {
    const tab = [...document.querySelectorAll('.desk-mode-strip .desk-mode-tab')].find(b => b.textContent === 'Publish');
    return { present: !!tab, inert: !!tab?.closest('[inert]'), ariaDisabled: tab?.getAttribute('aria-disabled') };
  })()`);
  ok('Publish untouched: a framed prose page still carries a reachable Publish tab (Done\'s removal did not disturb it)',
    publish.present === true && publish.inert === false && publish.ariaDisabled === 'false', JSON.stringify(publish));

  // ======================================================================
  // CD4.1 (the Last Two Words) — the no-"Done"-anywhere structural sweep, the
  // standing guard: after the card-edit popup close and the Spread select-mode
  // exit both became "Close", NO control a writer can reach reads exactly "Done".
  // ======================================================================
  const doneCount = async () => app.evalJs(`(() => [...document.querySelectorAll('button, [role="button"], [role="tab"], a')].filter(el => el.textContent.trim() === 'Done').length)()`);

  // (a) the card-edit popup's close button reads "Close", never "Done".
  await freshDesk(app, LAPTOP_W);
  await seedEntries(app, [{ id: 'cd41-sweep-board', text: 'sweep board', projectId: null, pageType: 'board', source: 'page', origin: 'loose', boxes: [{ id: 'cd41-sweep-card', kind: 'text', x: 0.1, y: 0.1, w: 0.25, h: 0.1, z: 1, text: 'Edit me' }], createdAt: '2026-07-03T00:00:00.000Z', updatedAt: '2026-07-03T00:00:00.000Z' }]);
  await openBoard(app, 'cd41-sweep-board');
  // FX7 S5 — onDoubleClick resolves via elementFromPoint(clientX,clientY); supply
  // the card's real center (a coordinate-less dblclick hits (0,0) and misses).
  await app.evalJs('(() => { const el = document.querySelector(\'[data-box-id="cd41-sweep-card"]\'); const r = el.getBoundingClientRect(); el.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 })); })()');
  await app.waitFor("!!document.querySelector('.board-popup')", { label: 'CD4.1 sweep popup open' });
  await sleep(220);
  const popupClose = await app.evalJs(`(() => ({
    label: document.querySelector('.board-popup-done')?.textContent.trim(),
    popupNoDone: [...document.querySelectorAll('.board-popup button')].every(b => b.textContent.trim() !== 'Done'),
  }))()`);
  ok('CD4.1: the card-edit popup\'s close button reads exactly "Close" (never "Done"), and no button in the popup says "Done"',
    popupClose.label === 'Close' && popupClose.popupNoDone === true, JSON.stringify(popupClose));
  ok('CD4.1 sweep: no control reads exactly "Done" on a board with its card-edit popup open', (await doneCount()) === 0, `doneControls=${await doneCount()}`);

  // (b) the Spread's select-mode exit toggle reads "Close", never "Done".
  await freshDesk(app, LAPTOP_W);
  await seedEntries(app, [
    { id: 'cd41-sp-1', text: 'page one', projectId: null, source: 'page', origin: 'journal', createdAt: '2026-07-04T00:00:00.000Z', updatedAt: '2026-07-04T00:00:00.000Z' },
    { id: 'cd41-sp-2', text: 'page two', projectId: null, source: 'page', origin: 'journal', createdAt: '2026-07-05T00:00:00.000Z', updatedAt: '2026-07-05T00:00:00.000Z' },
  ]);
  await app.evalJs("location.hash = '#/journal/spread'");
  await app.waitFor("!!document.querySelector('.spread-select-toggle')", { label: 'Spread (sweep)' });
  await sleep(150);
  const beforeSelect = await app.evalJs("document.querySelector('.spread-select-toggle')?.textContent.trim()");
  await app.click('Select');
  await sleep(180);
  const inSelect = await app.evalJs("document.querySelector('.spread-select-toggle')?.textContent.trim()");
  ok('CD4.1: the Spread select-mode toggle reads Select -> Close (never "Done") — enter the mode, leave the mode; a door word',
    beforeSelect === 'Select' && inSelect === 'Close', JSON.stringify({ beforeSelect, inSelect }));
  ok('CD4.1 sweep: no control reads exactly "Done" on the Spread in select mode', (await doneCount()) === 0, `doneControls=${await doneCount()}`);

  // (c) the surfaces CD4 already cleared stay clear.
  const sweepSurfaces = [
    ['a system board (Shelf)', async () => { await freshDesk(app, LAPTOP_W); await app.evalJs("location.hash = '#/shelf'"); await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'Shelf (sweep)' }); }],
    ['a prose project page', async () => { await freshProject(app, 'book', LAPTOP_W); }],
    ['a script project page', async () => { await freshProject(app, 'screenplay', LAPTOP_W); }],
  ];
  for (const [name, setup] of sweepSurfaces) {
    await setup();
    await sleep(140);
    const n = await doneCount();
    ok(`CD4.1 sweep: no control reads exactly "Done" on ${name}`, n === 0, `doneControls=${n}`);
  }
});

// === PARKED — gated behind HARNESS_PARKED=1. CD4's own park cycles do NOT live
// here: they travel VERBATIM in the SAME commit inside the files they falsify
// (b2.mjs, cd1.mjs, hb1.mjs, bm1.mjs). This file is purely additive. ==========
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log('\nCD4 PARKED: PASS (0 checks) — HARNESS_PARKED=1 armed; CD4\'s own A4 park cycles travel in b2.mjs (S1 Board-Done → PAGE → door), cd1.mjs (S2 gen-3 bar → gen-4 ["Pages","Plan →"] + the script gen + probe updates), and the hb1.mjs/bm1.mjs cross-reference disclosures — all in the SAME commit as the removals. CD4.1 (the Last Two Words) adds the "Done"→"Close" relabels: its own park cycle lives in fx4.mjs (the board-popup-done check), the Spread click fixture in j5.mjs, and this file gained the no-"Done"-anywhere sweep as the standing guard. All still additive here — this file\'s own park section is an empty no-op.');
}

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nCD4 VERIFY: PASS (${checks.length} checks)` : `\nCD4 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
