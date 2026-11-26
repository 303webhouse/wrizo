// VISUAL 1a.3 - INK WHERE THE PLAN SAYS (VISUAL's kit §3): a Board gets the whole tab; a Page in BUILD and EDIT the short set and the "Draw on a Board" door. The live defaults: this file lifts
// the driver's pins (reorg off, the old Arbor, Machina and Flux) before it loads the driver, because the surfaces it tests exist only in the reorg and the redesigns. Page side: visual-ink/page.js and page-1a3.js. Browserless: visual-1a3-unit.mjs.
//   C1-C2   a Page and a Board where she never opens INK load none of the ink code, and the Board gets no drawing layer
//   P1-P9   the Page: the INK tab in BUILD and EDIT only, only built rows, the door at Studio's foot, a stroke stored with her words untouched, every stage change puts the pen down
//   T1-T3   REAL KEYS: typing lands after drawing in BUILD, after the Board and back, and not one word is missing
//   D1      the door opens this Doc's Board with INK out; Back restores her caret and the Board stands beside the page WITH her drawing on it
//   B1-B8   the Board, in Machina, Arbor and Flux (stroke stored in the Board's strokes, no card made, painted, never taller than the Board, whole and unobstructed)
//   B9      a reload keeps the Board's drawing and paints it, with only the painter loaded
//   L1-L2   a Board whose entry goes away (deleted for good elsewhere) and then arrives while it is on screen never stops the page
// Run: node scripts/harness/visual-1a3.mjs   (from apps/desktop; dist-web built; needs a box turn on the PC)
import fs from 'node:fs';
// the live defaults, asked for before the driver reads them
process.env.WS_REORG = '1';
process.env.WS_ARBOR2 = 'default';
process.env.WS_MACHINA2 = 'default';
process.env.WS_FLUX3 = 'default';
const { withHarness } = await import('../runtime-verify.mjs');

const PAGE = fs.readFileSync(new URL('./visual-ink/page.js', import.meta.url), 'utf8');
const PAGE3 = fs.readFileSync(new URL('./visual-ink/page-1a3.js', import.meta.url), 'utf8');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const run = (app, js) => app.evalJs(`(async () => { ${js} })()`);
const add = (list, tag = '') => { for (const c of list) ok(`${c.name}${tag}`, c.pass, c.detail); };

const boot = async (app, width = 1366, height = 768) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
  await app.evalJs(PAGE);
  await app.evalJs(PAGE3);
};
const reloadHere = async (app, ready) => {
  await app.reload();
  await app.waitFor(`!!document.querySelector(${JSON.stringify(ready)})`, { label: 'after reload' });
  await sleep(1200);
  await app.evalJs(PAGE);
  await app.evalJs(PAGE3);
};
const newBoard = (app, name) => run(app, `location.hash = '#/'; await window.__vi.sleep(700); const b = window.wrizoCreateJournalPage({ pageType: 'board', text: ${JSON.stringify(name)}, boxes: [] }); window.wrizoFlushNow(); location.hash = '#/page/' + b.id; await window.__vi.sleep(2500); return b.id;`);
const caretToEnd = (app) => run(app, "const ed = document.querySelector('.forward-only-editor'); ed.focus(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false); getSelection().removeAllRanges(); getSelection().addRange(r);");
const stored = (app, id) => run(app, `const e = window.__vi3.entry(${JSON.stringify(id)}); return { text: e && e.text, strokes: (e && e.strokes || []).length };`);

await withHarness(async (app) => {
  // ---- cold: a writer who never opens INK ----
  await boot(app);
  const coldPage = await run(app, "return await window.__vi3.buildPage('machina', 'No ink here.');");
  await reloadHere(app, '.forward-only-editor');
  await run(app, 'await window.__vi.openDrawer(); await window.__vi.sleep(600);');
  ok('C1: a Page in BUILD with its drawer out and INK never opened loads none of the ink code', await run(app, 'const l = window.__vi.loads(); return l.painter === 0 && l.tab === 0 && l.capture === 0;'), { coldPage, loads: await run(app, 'return window.__vi.loads();') });
  await newBoard(app, 'Cold board');
  await reloadHere(app, '.board-canvas');
  await run(app, 'await window.__vi.openDrawer(); await window.__vi.sleep(600);');
  const coldBoard = await run(app, "return { loads: window.__vi.loads(), layer: !!document.querySelector('.wz-board-ink-sheet') };");
  ok('C2: a Board where she never opens INK loads none of it, and gets no drawing layer', coldBoard.loads.painter === 0 && coldBoard.loads.tab === 0 && coldBoard.loads.capture === 0 && coldBoard.layer === false, coldBoard);

  // ---- the Page ----
  await boot(app);
  const set = await run(app, "return await window.__vi3.buildPage('machina', 'The train was late and the coat stayed on the seat.');");
  add(await run(app, `return await window.__vi3.pageSet(${JSON.stringify(set)});`));

  // ---- another panel takes the drawer's place (narrow window) ----
  await boot(app, 1120, 760);
  const narrow = await run(app, "return await window.__vi3.buildPage('machina', 'Words.');");
  add(await run(app, `return await window.__vi3.yields(${JSON.stringify(narrow)});`));

  // ---- she closes the drawer herself with the pen down, then types (Fable, Nov 25, 6:35 pm: "keys must never go nowhere: typing lands, always") ----
  await boot(app);
  const own = await run(app, "return await window.__vi3.buildPage('machina', 'One two three four.');");
  await sleep(1500);
  await run(app, 'window.__vi3.caretAt(8); await window.__vi.sleep(300); await window.__vi3.inkOnPaper();');
  await app.evalJs("(() => { const g = document.querySelector('.wz-sliver-grip'); g.focus(); g.click(); })()");   // a real mouse press leaves the focus on the grip
  await sleep(900);
  await app.typeKeys('XYZ ');
  await sleep(2800);
  const byGrip = await stored(app, own);
  ok('K1: closed by the grip with the pen down, then typed with real keys: every character is stored, at the caret she left', byGrip.text === 'One two XYZ three four.', byGrip);
  await app.evalJs("document.querySelector('.wz-sliver-grip').click()");
  await sleep(900);
  await run(app, 'await window.__vi3.inkOnPaper();');
  await app.keyCombo('/');
  await sleep(900);
  const shutByKeys = await run(app, 'return window.__vi3.shown();');
  await app.typeKeys('QRS ');
  await sleep(2800);
  const byKeys = await stored(app, own);
  ok('K2: closed by Ctrl+/ with the pen down, then typed: the pen is down and every character is stored', shutByKeys.open === false && shutByKeys.paper !== 'ink' && byKeys.text === 'One two XYZ QRS three four.', { shutByKeys, byKeys });
  await app.keyCombo('/');
  await sleep(900);
  await run(app, 'await window.__vi3.inkOnPaper();');
  await app.typeKeys('k');
  await sleep(2800);
  const withTab = { ...(await stored(app, own)), ...(await run(app, 'return window.__vi3.shown();')) };
  ok('K3: with the drawer open and the pen down, a typed letter puts the pen down and lands in her words', withTab.text === 'One two XYZ QRS kthree four.' && withTab.paper !== 'ink', withTab);
  add(await run(app, 'return await window.__vi3.keyRules();'));
  await run(app, 'await window.__vi.openDrawer(); await window.__vi3.tab("text"); window.__vi3.caretAt(8); await window.__vi.sleep(300); await window.__vi3.inkOnPaper();');
  await app.evalJs("[...document.querySelectorAll('.wz-drawer-tab')].find((b) => /ink/i.test(b.textContent)).focus()");   // where a real click on the tab leaves her focus
  await app.key('Escape');
  await sleep(900);
  const shutByEsc = await run(app, 'return window.__vi3.shown();');
  await app.typeKeys('EE ');
  await sleep(2800);
  const byEsc = await stored(app, own);
  ok('K9: closed by Escape with the pen down, then typed: every character is stored, at the caret she left', shutByEsc.open === false && shutByEsc.paper !== 'ink' && byEsc.text === 'One two EE XYZ QRS kthree four.', { shutByEsc, byEsc });

  // ---- the same with the pen UP (Fable, Nov 25, 8:30 pm: the grip must not keep the focus) ----
  await run(app, 'await window.__vi.openDrawer(); await window.__vi.sleep(500); window.__vi3.caretAt(8); await window.__vi.sleep(300);');
  const grip = await app.evalJs("(() => { const r = document.querySelector('.wz-sliver-grip').getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()");
  await app.mouseMove(grip.x + 60, grip.y + 60);   // faded chrome comes back for a moving pointer
  await app.mouseMove(grip.x, grip.y);
  await sleep(900);
  await app.mouseDown(grip.x, grip.y);
  await sleep(60);
  await app.mouseUp(grip.x, grip.y);
  await sleep(900);
  const upShut = await run(app, 'return window.__vi3.shown();');
  await app.typeKeys('GG ');
  await sleep(2800);
  const upByGrip = await stored(app, own);
  ok('K10: pen up, closed by a real mouse press on the grip, then typed: every character is stored, at the caret she left', upShut.open === false && upShut.focus && upByGrip.text === 'One two GG EE XYZ QRS kthree four.', { upShut, upByGrip });
  await run(app, 'await window.__vi.openDrawer(); await window.__vi.sleep(500); window.__vi3.caretAt(8); await window.__vi.sleep(300);');
  await app.evalJs("document.querySelector('.wz-drawer-tab').focus()");   // where a click on a tab leaves her focus
  await app.keyCombo('/');
  await sleep(900);
  await app.typeKeys('HH ');
  await sleep(2800);
  const upByKeys = await stored(app, own);
  ok('K11: pen up, the focus in the drawer, closed by Ctrl+/, then typed: every character is stored, at the caret she left', upByKeys.text === 'One two HH GG EE XYZ QRS kthree four.', upByKeys);

  // ---- the Undo arrow stands off her words (the no-overlap rule) ----
  for (const [theme, stageName, width, height] of [['machina', 'draft', 1366, 768], ['plateau', 'revise', 1366, 768], ['flux', 'draft', 1366, 768], ['flux', 'draft', 1100, 700]]) {
    await boot(app, width, height);
    const got = await run(app, `await window.__vi3.buildPage(${JSON.stringify(theme)}, 'The morning light came in low across the table, and she began to write while the kettle ticked. '.repeat(4)); await window.__vi.sleep(1500);
      if (${JSON.stringify(stageName)} === 'revise') { await window.__vi3.stage('revise'); await window.__vi.sleep(900); }
      await window.__vi.openDrawer(); await window.__vi3.tab('ink'); await window.__vi3.until(() => !!document.querySelector('.wz-ink-face')); await window.__vi.sleep(900);
      await window.__vi.draw([{ x: 0.2, y: 0.6 }, { x: 0.5, y: 0.65 }]); await window.__vi.sleep(900); return window.__vi3.undoClear();`);
    if (theme === 'machina') {
      const er = await run(app, "const b = document.querySelector('.wz-ink-eraser'), s = b && b.querySelector('svg'), r = s && s.getBoundingClientRect(); return { text: b && b.textContent.trim(), svg: !!s, icon: r ? [Math.round(r.width), Math.round(r.height)] : null, name: b && b.getAttribute('aria-label') };");
      ok('E1: the eraser is a drawn icon like the brushes, never a typed character, and keeps its name', er.svg && er.text === '' && er.icon[0] === 16 && er.icon[1] === 16 && !!er.name, er);
    }
    ok(`U1: the Undo arrow stands in the page's margin, off her words, pressable, with no sideways scroll (${theme}, ${stageName === 'revise' ? 'EDIT' : 'BUILD'}, ${width})`, got.pass, got.why);
  }

  for (const theme of ['machina', 'plateau', 'flux']) {
    await boot(app);
    await run(app, `window.wrizoTheme.set(${JSON.stringify(theme)});`);
    await newBoard(app, 'Undo board');
    const got = await run(app, `await window.__vi.openDrawer(); await window.__vi3.tab('ink'); await window.__vi3.until(() => !!document.querySelector('.wz-board-ink-sheet')); await window.__vi.sleep(900);
      await window.__vi3.drawOnBoard(); await window.__vi.sleep(900); return window.__vi3.undoOnBoard();`);
    ok(`U2: on a Board the Undo arrow keeps to the corner she can see, however the Board is scrolled, and can be pressed (${theme}, 1366)`, got.pass, got.why);
  }

  // ---- real keys: draw, type, the door, the Board, back, type ----
  await boot(app);
  const id = await run(app, "return await window.__vi3.buildPage('machina', 'Her first line.');");
  await run(app, "await window.__vi3.tab('ink'); await window.__vi3.until(() => !!document.querySelector('.wz-ink-face')); await window.__vi.sleep(900);");
  await app.penStroke('.wz-ink-sheet', [{ x: 0.3, y: 0.5 }, { x: 0.45, y: 0.52 }, { x: 0.6, y: 0.5 }]);
  await sleep(700);
  await run(app, "await window.__vi3.tab('text');");
  await caretToEnd(app);
  await app.typeKeys(' And the second.');
  await sleep(2800);
  const a = await stored(app, id);
  ok('T1: after drawing in BUILD, typing lands and every word is stored, beside the stroke', a.text === 'Her first line. And the second.' && a.strokes === 1, a);

  const bid = await run(app, 'return await window.__vi3.throughTheDoor();');
  await sleep(1200);
  const arrived = await run(app, "return { sheet: document.querySelector('.wz-board-ink-sheet') && document.querySelector('.wz-board-ink-sheet').dataset.ink, tab: !!document.querySelector('.wz-ink-face'), back: [...document.querySelectorAll('button')].some((b) => b.textContent.trim() === 'Back') };");
  ok('D1: the door opens this Doc\'s Board on its canvas with the INK tab out, and a Back button', !!bid && bid !== id && arrived.sheet === 'true' && arrived.tab && arrived.back, { bid, arrived });
  await app.penStroke('.wz-board-ink-sheet', [{ x: 0.1, y: 0.1 }, { x: 0.2, y: 0.15 }, { x: 0.3, y: 0.2 }]);
  await sleep(900);
  await run(app, 'await window.__vi3.back();');
  const beside = await run(app, `return window.__vi3.beside(${JSON.stringify(bid)});`);
  ok('D2: Back returns her to the page with her caret, and the Board stands beside it with her drawing on it', beside.split && beside.focused && beside.painted > 20 && !beside.empty, beside);
  await app.typeKeys(' Third, after the Board.');
  await sleep(2800);
  const b = await stored(app, id);
  ok('T2: and typing lands at her caret - not one word missing', b.text === 'Her first line. And the second. Third, after the Board.', b);
  ok('T3: the Board kept the drawing', (await stored(app, bid)).strokes === 1, await stored(app, bid));

  // ---- a dark sheet: the default ink is the page's text colour (a stand-in, Fable Nov 25); nothing saved changes ----
  for (const theme of ['machina', 'flux']) {
    await boot(app);
    const dark = await run(app, `window.wrizoThemePrefs.set({ page: 'dark' }); const id = await window.__vi3.buildPage(${JSON.stringify(theme)}, 'Words.'); window.wrizoThemePrefs.set({ page: 'dark' }); await window.__vi.sleep(2200); await window.__vi3.inkOnPaper(); return id;`);
    await app.penStroke('.wz-ink-sheet', [{ x: 0.3, y: 0.5 }, { x: 0.6, y: 0.5 }]);
    await sleep(900);
    const page = await run(app, `return window.__vi3.sheetInk(${JSON.stringify(dark)}, '.ink-committed');`);
    ok(`N1 [${theme}]: on a dark page the default ink paints light, the walnut chip matches, and the stroke still says walnut`, page.stored === 'walnut' && page.lum > 0.6 && page.swatchLum > 0.6, page);
    await run(app, "window.wrizoThemePrefs.set({ page: 'light' }); await window.__vi.sleep(900);");
    const relit = await run(app, "return window.__vi3.painted('.ink-committed');");
    ok(`N2 [${theme}]: turning the page light paints the same stroke dark again, without a reload`, /rgb\(\s*2\d, 1\d, \d\)/.test(String(relit)), relit);
  }

  // ---- the ink code does not arrive: one line and a Retry, never an empty tab ----
  await boot(app);
  const lost = await run(app, "return await window.__vi3.buildPage('machina', 'Words.');");
  await app.cdp('Network.enable');
  await app.cdp('Network.setCacheDisabled', { cacheDisabled: true });
  await app.cdp('Network.setBlockedURLs', { urls: ['*InkTab-*'] });
  await run(app, "await window.__vi3.tab('ink'); await window.__vi.sleep(2500);");
  const failed = await run(app, "return { line: (document.querySelector('.wz-ink-fail') || {}).innerText || '', face: !!document.querySelector('.wz-ink-face'), retry: !!document.querySelector('.wz-ink-retry') };");
  ok('O1: when the drawing code cannot be fetched the tab says so in one line and offers Retry', /did not load/.test(failed.line) && failed.retry && !failed.face, failed);
  await app.cdp('Network.setBlockedURLs', { urls: [] });
  await app.evalJs("document.querySelector('.wz-ink-retry').click()");
  await run(app, "await window.__vi3.until(() => !!document.querySelector('.wz-ink-face')); await window.__vi.sleep(1200);");
  await app.penStroke('.wz-ink-sheet', [{ x: 0.3, y: 0.5 }, { x: 0.6, y: 0.5 }]);
  await sleep(900);
  ok('O2: Retry brings the tab in and the next stroke is drawn and stored', (await stored(app, lost)).strokes === 1, await stored(app, lost));
  await app.cdp('Network.setCacheDisabled', { cacheDisabled: false });

  // ---- a Board whose entry is away for a render and then arrives (Chat 1, Nov 25: a hook sat below the Board's early return, and React stopped the whole page). The way a writer gets there: a Board just
  // made on /page/new (that surface keeps the Board mounted without a row), deleted for good on another device while she has it open; the pull arrives. ----
  await boot(app);
  const made = await run(app, "location.hash = '#/page/new?kind=board'; await window.__vi.sleep(2500); [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'New Card').click(); await window.__vi.sleep(3000); const id = location.hash.replace('#/page/', ''); window.__late = window.__vi3.entry(id); return { id, born: !!window.__late };");
  const onScreen = () => run(app, "return { app: document.getElementById('root').childElementCount, board: !!document.querySelector('.board-canvas') };");
  const later = (n) => `new Date(Date.parse(window.__late.updatedAt) + ${n}000).toISOString()`;
  await run(app, `window.wrizoApplyRemoteBoard({ ...window.__late, text: '', boxes: [], deletedAt: ${later(1)}, purgedAt: ${later(1)}, updatedAt: ${later(1)} }); await window.__vi.sleep(1800);`);
  const away = await onScreen();
  ok('L1: a Board deleted for good elsewhere while it is on screen draws nothing, and the app stays up', made.born && away.app > 0 && !away.board, { made, away });
  await run(app, `window.wrizoApplyRemoteBoard({ ...window.__late, updatedAt: ${later(2)} }); await window.__vi.sleep(1800);`);
  const entryBack = await onScreen();
  ok('L2: when the entry arrives after that paint, the Board draws', entryBack.app > 0 && entryBack.board, entryBack);

  // ---- the Board, three themes ----
  for (const theme of ['machina', 'plateau', 'flux']) {
    await boot(app);
    await run(app, `window.wrizoTheme.set(${JSON.stringify(theme)}); await window.__vi.sleep(2500);`);
    const board = await newBoard(app, `Sketch ${theme}`);
    add(await run(app, `return await window.__vi3.boardSet(${JSON.stringify(board)});`), ` [${theme}]`);
    if (theme === 'machina') {
      await reloadHere(app, '.board-canvas');
      const kept = await run(app, `return { ...window.__vi3.readBoard(${JSON.stringify(board)}), loads: window.__vi.loads() };`);
      ok('B9: a reload keeps the Board\'s drawing and paints it, with only the painter loaded', kept.strokes === 1 && !!kept.painted && kept.painted[0] > 100 && kept.loads.painter > 0 && kept.loads.tab === 0 && kept.loads.capture === 0, kept);
    }
  }
  return checks;
});

const pass = checks.length > 0 && checks.every((c) => c.pass);
for (const c of checks) console.log(`${c.pass ? 'ok  ' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail}`);
console.log(pass ? `\nVISUAL 1A3 VERIFY: PASS (${checks.length} checks)` : `\nVISUAL 1A3 VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
