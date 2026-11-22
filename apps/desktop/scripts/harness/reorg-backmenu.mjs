// THE REORG'S BACK MENU, phase 4 (Fable, Nov 19, 6:05 pm: "the Back menu behind ?reorg=1, Machina: Feedback = today's Tutor moved whole; Assets from today's links
// grouped by Board; the Plan tab; then split screen. Red-first."). Plan: reorg-plan.md section 9 and reorg-plan-tech.md section 3; Cursor's frames (reorg/ app.js).
// This file holds the three slices and the split screen's (SP1 to SP11).
//
// The fixture (seeded through the app's own seams, a loose page and four more entries):
//   bm-p     the page she is on, "The thesis page"; its OWN board is bm-own (paired by planBoardId) holding three cards Alpha, Beta, Gamma (seq 0, 1, 2; Beta has a body)
//   bm-x     "X board" with two cards; ONE of them (Xcard one) is linked to bm-p
//   bm-y     "Y board", linked to bm-p whole
//   bm-q     "A linked doc", a page linked to bm-p
//   bm-e     "An empty page": no board, no links
//
// OFF  O1  with the switch off, in Machina, the right drawer's tab row is today's two tabs (Consultant, Assets) and nothing of the Back menu is drawn
//      O2  with the switch ON in Arbor and Flux (the Back menu is Machina's alone), the same two tabs
// TABS T1  on (Machina, a page): the tab row reads Plan, Assets, Feedback in that order, its accessible name is the lexicon's, and the drawer opens on ASSETS
//      T2  the Feedback tab is today's Tutor, moved whole: the same classes, the same controls as the Consultant tab with the switch off
// ASSETS A1  the Assets tab lists today's links GROUPED BY BOARD: the Page's own board first (its three cards, in the board's own order), then the board with a linked card,
//            then the board linked whole (a head, no card), then the Docs linked directly; each row names its kind in Machina's words
//        A2  a board's head opens it ("Open the board": the address becomes that board's)
//        A3  an own-board card's x hides it from this Page's list and nothing else (the board keeps its card), and Undo brings it back
// PLAN P1  the Plan tab on a Page with a board: numbered rows in the board's own order; with none, ONE quiet line and no board born
//      P2  Move down / up reorders, saved as the cards' `seq` (the board's Outline order); the first row cannot go up, the last cannot go down
//      P3  Indent puts a row under the one above it (number 2.1, parentId saved), Outdent puts it back right after its parent
//      P4  Rename changes the first line only; the card's body is untouched; a rename to the same name writes nothing
//      P5  Remove hides the card from this Page's plan (the board keeps it), and Undo brings it back
//      P6  Add: a Page with no board gets NO board until the first row is added; adding then births the board and the row is its card
// SAVE S1  opening the drawer and switching through the three tabs changes nothing stored (a control of the same length has no act)
// SPEED L1 the Plan does not render while she types (window.wrizoPlanRenders, a counter that exists only under the switch)
// PAGE G1  the page's rect is the same with the drawer closed and open on each tab, at 1366, 1920 and 2000
//
// Run (repo root; the Actions harness):  node apps/desktop/scripts/harness/reorg-backmenu.mjs
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${String(detail).slice(0, 600)}]` : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const STORE = "JSON.stringify([localStorage, sessionStorage].map((s) => Object.keys(s).sort().map((k) => [k, s.getItem(k)])))";
const PAGE = "(() => { const els = ['.mode-pagecol', '.mode-page', '.forward-only-editor'].map((s) => document.querySelector(s)); if (!els[1] && !els[0]) return null; return els.map((p) => { if (!p) return '-'; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((n) => Math.round(n * 100) / 100).join(','); }).join('|'); })()";
const ENTRY = (id) => `(() => { if (window.wrizoFlushNow) window.wrizoFlushNow(); const e = (JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]')).find((x) => x.id === ${q(id)}); return e || null; })()`;

const card = (id, text, seq, y) => ({ id, kind: 'text', x: 0.05, y, w: 0.3, h: 0.1, z: seq + 1, text, seq });

async function seed(app) {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.evalJs(`(() => {
    const W = window;
    const mk = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:00.000Z', source: 'page', origin: 'loose', ...extra });
    mk('bm-own', 'Own board', { pageType: 'board', boxes: ${q([card('a1', 'Alpha', 0, 0.05), card('a2', 'Beta\nbody of beta', 1, 0.2), card('a3', 'Gamma', 2, 0.35)])} });
    mk('bm-x', 'X board', { pageType: 'board', boxes: ${q([card('x1', 'Xcard one', 0, 0.05), card('x2', 'Xcard two', 1, 0.2)])} });
    mk('bm-y', 'Y board', { pageType: 'board', boxes: [] });
    mk('bm-q', 'A linked doc', {});
    mk('bm-p', 'The thesis page', {});
    mk('bm-e', 'An empty page', {});
    W.wrizoPatchEntry('bm-p', { planBoardId: 'bm-own' });
    W.wrizoAddPageLink('bm-p', { bEntryId: 'bm-x', bBoxId: 'x1' });
    W.wrizoAddPageLink('bm-p', { bEntryId: 'bm-y' });
    W.wrizoAddPageLink('bm-p', { bEntryId: 'bm-q' });
    W.wrizoFlushNow();
    return true;
  })()`);
}

async function openPage(app, id, { theme = 'machina', reorg = true, mode = 'drafting' } = {}) {
  // the theme seam exists once the app has mounted: wait for it, never assume it (the first look after a reload or a seed can come before it)
  await app.waitFor('!!window.wrizoTheme', { label: 'the theme seam', timeout: 20000 });
  await app.evalJs(`window.wrizoTheme.set('${theme}')`);
  // STAGING (Fable, Nov 20: SPRINT's Back menu locks Plan and Assets): these pages open in BUILD (Draft), where the three tabs are the Back menu this file proves; SPRINT has its own file (reorg-sprint-back.mjs)
  await app.evalJs(`localStorage.setItem('wrizo-mode-page-${id}', '${mode}')`);
  await app.evalJs(`history.replaceState(null, '', '${reorg ? '/?reorg=1&arbor2=0' : '/?arbor2=0'}#/page/${id}')`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.wz-tutor-grip')", { label: 'the page', timeout: 15000 }).catch(() => {});
  await sleep(900);
}
const openDrawer = async (app) => {
  const open = await app.evalJs("document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') === 'true'");
  if (!open) { await app.evalJs("document.querySelector('.wz-tutor-grip')?.click()"); await sleep(700); }
};
const closeDrawer = async (app) => {
  const open = await app.evalJs("document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') === 'true'");
  if (open) { await app.evalJs("document.querySelector('.wz-tutor-grip')?.click()"); await sleep(700); }
};
const tab = async (app, id) => { await app.evalJs(`document.getElementById('wz-tutor-tab-${id}')?.click()`); await sleep(350); };
const click = (app, sel) => app.evalJs(`(() => { const b = document.querySelector(${q(sel)}); if (!b) return false; b.click(); return true; })()`);
const TABS = "(() => { const row = document.querySelector('.wz-tutor-panel .wz-drawer-tabs'); if (!row) return null; return { label: row.getAttribute('aria-label'), tabs: [...row.querySelectorAll('.wz-drawer-tab')].map((b) => [b.id.replace('wz-tutor-tab-', ''), b.textContent, b.getAttribute('aria-selected')]) }; })()";
// the Feedback / Consultant tab's body, as a SHAPE: every class used inside it and the count of its controls (the words differ by theme switch, the structure must not)
const BODY = "(() => { const b = document.querySelector('.wz-tutor-panel .wz-tutor-body'); if (!b) return null; const cls = new Set(); b.querySelectorAll('*').forEach((e) => (e.getAttribute('class') || '').split(/\\s+/).filter(Boolean).forEach((c) => cls.add(c))); return { classes: [...cls].sort(), controls: b.querySelectorAll('button, input, textarea, select').length, composer: !!b.querySelector('input, textarea') }; })()";
// SUPERSEDED (the Plan's groups of cards from other connected Boards, Fable's ruling Nov 21, 12:35 am: below the Page's own rows the Plan now lists each connected Board's cards as a group, and bm-p is connected to bm-x, bm-y and bm-q, so the groups' rows sit inside [data-back-plan] too): these checks read the PAGE'S OWN rows, which are the direct rows of its own list. The original, verbatim:
// const PLAN_ROWS = "(() => [...document.querySelectorAll('[data-back-plan] [data-plan-row]')].map((r) => ({ id: r.dataset.planRow, depth: Number(r.dataset.planDepth), num: r.querySelector('.wz-back-plan-num')?.textContent, name: (r.querySelector('[data-plan-name]')?.value ?? r.querySelector('[data-plan-name]')?.textContent), up: !r.querySelector('[data-plan-up]')?.disabled, down: !r.querySelector('[data-plan-down]')?.disabled, indent: !r.querySelector('[data-plan-indent]')?.disabled, outdent: !r.querySelector('[data-plan-outdent]')?.disabled })))()";
const PLAN_ROWS = "(() => [...document.querySelectorAll('[data-back-plan] > .wz-back-plan-list > [data-plan-row]')].map((r) => ({ id: r.dataset.planRow, depth: Number(r.dataset.planDepth), num: r.querySelector('.wz-back-plan-num')?.textContent, name: (r.querySelector('[data-plan-name]')?.value ?? r.querySelector('[data-plan-name]')?.textContent), up: !r.querySelector('[data-plan-up]')?.disabled, down: !r.querySelector('[data-plan-down]')?.disabled, indent: !r.querySelector('[data-plan-indent]')?.disabled, outdent: !r.querySelector('[data-plan-outdent]')?.disabled })))()";
const boardCards = (e) => ((e && e.boxes) || []).filter((b) => b.kind === 'text' && !b.deletedAt).slice().sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));

await withHarness(async (app) => {
  await seed(app);

  // ---- OFF ----------------------------------------------------------------------------------------------------------------------------
  await openPage(app, 'bm-p', { reorg: false });
  await openDrawer(app);
  const offTabs = await app.evalJs(TABS);
  const offHas = await app.evalJs("!!document.querySelector('[data-back-plan], [data-back-assets], #wz-tutor-tab-plan')");
  ok('O1: switch OFF, Machina - the right drawer\'s tab row is today\'s two tabs (Consultant, Assets) and nothing of the Back menu is drawn',
    !!offTabs && offTabs.tabs.length === 2 && offTabs.tabs[0][1] === 'Consultant' && offTabs.tabs[1][1] === 'Assets' && !offHas, JSON.stringify({ offTabs, offHas }));
  await tab(app, 'tutor');
  const offBody = await app.evalJs(BODY);

  for (const theme of ['plateau', 'flux']) {
    await openPage(app, 'bm-p', { theme, reorg: true });
    await openDrawer(app);
    const t = await app.evalJs(TABS);
    const any = await app.evalJs("!!document.querySelector('[data-back-plan], [data-back-assets], #wz-tutor-tab-plan')");
    ok(`O2 [${theme}]: switch ON in ${theme} - still two tabs and no Back menu (it is Machina's alone)`, !!t && t.tabs.length === 2 && !any, JSON.stringify({ t, any }));
  }

  // ---- TABS ---------------------------------------------------------------------------------------------------------------------------
  await openPage(app, 'bm-p');
  await openDrawer(app);
  const tabs = await app.evalJs(TABS);
  ok('T1: switch on in Machina - the tab row reads Plan, Assets, Feedback in that order, named by the lexicon, and the drawer opens on ASSETS',
    !!tabs && JSON.stringify(tabs.tabs.map((x) => x[1])) === JSON.stringify(['Plan', 'Assets', 'Feedback']) && JSON.stringify(tabs.tabs.map((x) => x[2])) === JSON.stringify(['false', 'true', 'false'])
    && tabs.label === 'Plan, assets and feedback', JSON.stringify(tabs));
  await tab(app, 'tutor');
  const onBody = await app.evalJs(BODY);
  // SUPERSEDED (the FEEDBACK lens frame, Fable, Nov 20, 11:15 pm; Nick's F2: in BUILD the Back menu's FEEDBACK is Structure / Tone / Consistency 'replacing the asks', plus Ask Your Own: the tab is no longer today's Tutor moved whole). The original, verbatim:
  // ok('T2: the Feedback tab is today\'s Tutor, moved whole - the same classes and the same controls as the Consultant tab with the switch off',
  //   !!onBody && !!offBody && onBody.composer && JSON.stringify(onBody.classes) === JSON.stringify(offBody.classes) && onBody.controls === offBody.controls, JSON.stringify({ onBody, offBody }));
  const lensOn = await app.evalJs("(() => ({ lenses: [...document.querySelectorAll('.wz-tutor-panel [data-lens]')].map((s) => s.getAttribute('data-lens')), roster: document.querySelectorAll('.wz-tutor-panel .wz-tutor-draft-roster').length, convoHead: (document.querySelector('.wz-tutor-convo > .wz-tutor-h') || {}).textContent || null }))()");
  ok('T2 [successor: the lens frame]: the Feedback tab is the lens frame and the composer headed "Ask Your Own" (the lenses Structure, Tone and Consistency, no four-ask roster); with the switch off the Consultant tab is untouched (its composer)',
    !!onBody && !!offBody && onBody.composer && JSON.stringify(lensOn.lenses) === JSON.stringify(['structure', 'tone', 'consistency']) && lensOn.roster === 0 && lensOn.convoHead === 'Ask Your Own' && offBody.composer, JSON.stringify({ lensOn, offBody }));

  // ---- ASSETS -------------------------------------------------------------------------------------------------------------------------
  await tab(app, 'links');
  const ASSETS = `(() => [...document.querySelectorAll('[data-back-assets] [data-back-group]')].map((g) => ({ group: g.dataset.backGroup, board: g.dataset.backBoard || null, own: g.dataset.backOwn || null,
    head: g.querySelector('[data-back-board-name]')?.textContent || null, open: !!g.querySelector('[data-back-open-board]'),
    rows: [...g.querySelectorAll('[data-back-asset]')].map((r) => [r.querySelector('.wz-graft-title')?.textContent, r.querySelector('.wz-back-asset-kind')?.textContent]) })))()`;
  const groups = await app.evalJs(ASSETS);
  const shape = (gs) => JSON.stringify(gs.filter(Boolean).map((g) => [g.group, g.board, g.own, g.rows.map((r) => r[0])]));
  const want = JSON.stringify([['board', 'bm-own', 'true', ['Alpha', 'Beta', 'Gamma']], ['board', 'bm-x', 'false', ['Xcard one']], ['board', 'bm-y', 'false', []], ['pages', null, null, ['A linked doc']]]);
  ok('A1: the Assets tab lists today\'s links grouped by board - the Page\'s own board first (Alpha, Beta, Gamma in the board\'s order), then X board with its linked card, then Y board (linked whole, no card), then the Docs linked directly; kinds in Machina\'s words',
    Array.isArray(groups) && shape(groups) === want && /Own board/.test(groups[0].head || '') && groups[1].head === 'X board' && groups[2].head === 'Y board'
    && groups[0].rows.every((r) => r[1] === 'Block') && groups[3].rows[0][1] === 'Doc' && groups.slice(0, 3).every((g) => g.open), JSON.stringify(groups));
  // MUTANT: the groups read in the order the links were made (own board last): A1's read goes RED
  const mutated = Array.isArray(groups) && groups.length ? [...groups.slice(1), groups[0]] : [];
  ok('A1-M: the same read on groups with the Page\'s own board LAST goes red (the mutant is read by A1\'s own predicate)', Array.isArray(groups) && shape(mutated) !== want, shape(mutated));

  await click(app, '[data-back-open-board="bm-x"]'); await sleep(900);
  const hashAfter = await app.evalJs('location.hash');
  ok('A2: a board\'s head opens it ("Open the board": the address becomes that board\'s)', hashAfter === '#/page/bm-x', hashAfter);
  await openPage(app, 'bm-p'); await openDrawer(app); await tab(app, 'links');

  const hideBtn = '[data-back-assets] [data-back-asset="plan:bm-own:a3"] [data-graft-hide]';
  const hid = await click(app, hideBtn); await sleep(500);
  const afterHide = await app.evalJs(ASSETS);
  const pageHid = await app.evalJs(ENTRY('bm-p'));
  const ownAfter = await app.evalJs(ENTRY('bm-own'));
  ok('A3: an own-board card\'s x hides it from this Page\'s list (hiddenPlanCards names it) and the board keeps the card',
    hid && afterHide?.[0]?.rows.map((r) => r[0]).join() === 'Alpha,Beta' && (pageHid?.pageSettings?.hiddenPlanCards || []).includes('a3') && boardCards(ownAfter).length === 3, JSON.stringify({ rows: afterHide?.[0]?.rows, hidden: pageHid?.pageSettings?.hiddenPlanCards, kept: boardCards(ownAfter).length }));
  await app.evalJs("[...document.querySelectorAll('[data-graft-undo] button')].forEach((b) => b.click())"); await sleep(500);
  const afterUndo = await app.evalJs(ASSETS);
  ok('A3b: Undo brings the card back to the list', afterUndo?.[0]?.rows.map((r) => r[0]).join() === 'Alpha,Beta,Gamma', JSON.stringify(afterUndo?.[0]?.rows));

  // ---- PLAN ---------------------------------------------------------------------------------------------------------------------------
  await tab(app, 'plan');
  const rows0 = await app.evalJs(PLAN_ROWS);
  ok('P1: the Plan tab - numbered rows in the board\'s own order (1 Alpha, 2 Beta, 3 Gamma), the first cannot go up and the last cannot go down',
    rows0.length === 3 && rows0.map((r) => `${r.num} ${r.name}`).join('|') === '1 Alpha|2 Beta|3 Gamma' && !rows0[0].up && rows0[0].down && rows0[2].up && !rows0[2].down && !rows0[0].indent && rows0[1].indent && rows0.every((r) => !r.outdent), JSON.stringify(rows0));

  await click(app, '[data-plan-row="a1"] [data-plan-down]'); await sleep(500);
  const rows1 = await app.evalJs(PLAN_ROWS);
  const seqs = boardCards(await app.evalJs(ENTRY('bm-own'))).map((c) => `${c.id}:${c.seq}`).join();
  ok('P2: Move down on Alpha puts the rows Beta, Alpha, Gamma, saved as the cards\' seq (the board\'s Outline order)',
    rows1.map((r) => r.name).join() === 'Beta,Alpha,Gamma' && seqs === 'a2:0,a1:1,a3:2', JSON.stringify({ rows1: rows1.map((r) => r.name), seqs }));
  await click(app, '[data-plan-row="a1"] [data-plan-up]'); await sleep(500);
  const rows1b = await app.evalJs(PLAN_ROWS);
  ok('P2b: Move up puts Alpha back first', rows1b.map((r) => r.name).join() === 'Alpha,Beta,Gamma', JSON.stringify(rows1b.map((r) => r.name)));

  await click(app, '[data-plan-row="a3"] [data-plan-indent]'); await sleep(500);
  const rows2 = await app.evalJs(PLAN_ROWS);
  const own2 = boardCards(await app.evalJs(ENTRY('bm-own')));
  ok('P3: Indent puts Gamma under Beta (number 2.1, depth 1, parentId saved)',
    rows2.map((r) => `${r.num}:${r.depth}`).join() === '1:0,2:0,2.1:1' && own2.find((c) => c.id === 'a3')?.parentId === 'a2', JSON.stringify({ rows2: rows2.map((r) => `${r.num}:${r.depth}`), parent: own2.find((c) => c.id === 'a3')?.parentId }));
  await click(app, '[data-plan-row="a3"] [data-plan-outdent]'); await sleep(500);
  const rows2b = await app.evalJs(PLAN_ROWS);
  const own2b = boardCards(await app.evalJs(ENTRY('bm-own')));
  ok('P3b: Outdent puts Gamma back at the top level, right after Beta (3), and the parent is gone', rows2b.map((r) => `${r.num} ${r.name}`).join('|') === '1 Alpha|2 Beta|3 Gamma' && !own2b.find((c) => c.id === 'a3')?.parentId, JSON.stringify(rows2b.map((r) => `${r.num} ${r.name}`)));

  // rename: type into Beta's name, Enter
  await app.evalJs(`(() => { const i = document.querySelector('[data-plan-row="a2"] [data-plan-name]'); if (!i) return false; i.focus(); i.value = 'Beta two'; i.dispatchEvent(new Event('input', { bubbles: true })); i.blur(); return true; })()`);
  await sleep(500);
  const renamed = boardCards(await app.evalJs(ENTRY('bm-own'))).find((c) => c.id === 'a2');
  ok('P4: Rename changes the first line only - the card\'s text is "Beta two" then its body, untouched', renamed?.text === 'Beta two\nbody of beta', JSON.stringify(renamed?.text));
  const stampBefore = renamed?.updatedAt;
  await app.evalJs(`(() => { const i = document.querySelector('[data-plan-row="a2"] [data-plan-name]'); if (!i) return false; i.focus(); i.blur(); return true; })()`);
  await sleep(500);
  const renamed2 = boardCards(await app.evalJs(ENTRY('bm-own'))).find((c) => c.id === 'a2');
  ok('P4b: a rename to the name it already has writes nothing (the card keeps its own stamp)', renamed2?.updatedAt === stampBefore, JSON.stringify({ stampBefore, now: renamed2?.updatedAt }));

  await click(app, '[data-plan-row="a3"] [data-plan-remove]'); await sleep(500);
  const afterRemove = await app.evalJs(PLAN_ROWS);
  const keptCards = boardCards(await app.evalJs(ENTRY('bm-own'))).length;
  ok('P5: Remove hides Gamma from this Page\'s plan (the board keeps all three cards)', afterRemove.map((r) => r.name).join() === 'Alpha,Beta two' && keptCards === 3, JSON.stringify({ rows: afterRemove.map((r) => r.name), keptCards }));
  await app.evalJs("[...document.querySelectorAll('[data-back-plan] [data-graft-undo] button')].forEach((b) => b.click())"); await sleep(500);
  ok('P5b: Undo brings Gamma back', (await app.evalJs(PLAN_ROWS)).map((r) => r.name).join() === 'Alpha,Beta two,Gamma');

  // add: the empty page first
  await openPage(app, 'bm-e'); await openDrawer(app); await tab(app, 'plan');
  const emptyShown = await app.evalJs("(() => ({ line: document.querySelector('[data-back-plan-empty]')?.textContent || null, rows: document.querySelectorAll('[data-plan-row]').length, board: window.wrizoPairing.planBoardId('bm-e') }))()");
  ok('P1b: a Page with no board - ONE quiet line, no rows, and no board is born by looking', emptyShown.line === 'Nothing is in this doc\'s plan.' && emptyShown.rows === 0 && emptyShown.board === null, JSON.stringify(emptyShown));
  await app.evalJs(`(() => { const i = document.querySelector('[data-plan-add]'); if (!i) return false; i.focus(); return true; })()`);
  await app.typeKeys('Opening scene'); await app.evalJs("document.querySelector('[data-plan-add]')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))"); await sleep(700);
  const added = await app.evalJs("(() => ({ rows: [...document.querySelectorAll('[data-plan-row] [data-plan-name]')].map((n) => n.value ?? n.textContent), board: window.wrizoPairing.planBoardId('bm-e') }))()");
  const born = added.board ? boardCards(await app.evalJs(ENTRY(added.board))) : [];
  ok('P6: adding a row births the Page\'s board then and only then; the row is its card (a text card "Opening scene", seq 0)', added.rows.join() === 'Opening scene' && !!added.board && born.length === 1 && born[0].text === 'Opening scene' && born[0].seq === 0, JSON.stringify({ added, born }));

  // ---- SAVE ---------------------------------------------------------------------------------------------------------------------------
  await openPage(app, 'bm-p'); await sleep(2500);
  const before = await app.evalJs(STORE);
  await sleep(1500);
  const control = await app.evalJs(STORE);
  await openDrawer(app);
  for (const id of ['plan', 'links', 'tutor', 'plan', 'links']) await tab(app, id);
  await sleep(1200);
  const after = await app.evalJs(STORE);
  const keysOf = (j) => Object.fromEntries(JSON.parse(j).flat().map(([k, v]) => [k, v]));
  const diffKeys = (x, y) => { const a = keysOf(x), b = keysOf(y); return [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((k) => a[k] !== b[k]); };
  ok('S1: opening the drawer and switching through the three tabs changes nothing stored beyond what the same wait with no act changes (the control is the baseline)',
    JSON.stringify(diffKeys(control, after).filter((k) => !diffKeys(before, control).includes(k))) === '[]', JSON.stringify({ control: diffKeys(before, control), act: diffKeys(control, after) })); 

  // ---- SPEED --------------------------------------------------------------------------------------------------------------------------
  await tab(app, 'plan');
  await app.evalJs("document.querySelector('.forward-only-editor')?.focus()"); await sleep(300);
  const r0 = await app.evalJs('window.wrizoPlanRenders ? window.wrizoPlanRenders() : null');
  for (const ch of 'the ledgers were kept at the gate') { await app.typeKeys(ch); await sleep(60); }
  await sleep(500);
  const r1 = await app.evalJs('window.wrizoPlanRenders ? window.wrizoPlanRenders() : null');
  ok('L1: the Plan rendered ZERO times while she typed 33 keys (window.wrizoPlanRenders: a counter, not a clock)', r0 !== null && r1 !== null && r1 === r0, JSON.stringify({ r0, r1 }));

  // ---- PAGE ---------------------------------------------------------------------------------------------------------------------------
  for (const w of [1366, 1920, 2000]) {
    await app.emulateDpr(1, w, 900);
    await openPage(app, 'bm-p');
    const closed = await app.evalJs(PAGE);
    await openDrawer(app);
    const rects = [];
    for (const id of ['plan', 'links', 'tutor']) { await tab(app, id); rects.push(await app.evalJs(PAGE)); }
    await closeDrawer(app);
    const closedAgain = await app.evalJs(PAGE);
    ok(`G1 [${w}]: the page's rect is the same with the drawer closed (${closed}) and open on Plan, Assets and Feedback`, !!closed && rects.every((r) => r === closed) && closedAgain === closed, JSON.stringify({ closed, rects, closedAgain }));
  }

  // ---- SPLIT --------------------------------------------------------------------------------------------------------------------------
  await app.emulateDpr(1, 1366, 900);
  const toMode = async (key) => { await app.evalJs(`document.querySelector('[data-mode-key="${key}"]')?.click()`); await sleep(1500); };
  const GEO = "(() => { const a = document.querySelector('.wz-split-asset'); const r = a ? a.getBoundingClientRect() : null; const p = document.querySelector('.desk-frame-stage .mode-page')?.getBoundingClientRect(); const stage = document.querySelector('.desk-frame-stage'); const s = document.querySelector('.desk-frame-strip')?.getBoundingClientRect(); const vis = (sel) => { const e = document.querySelector(sel); return e ? getComputedStyle(e).visibility : null; };"
    + " return { asset: r && [r.left, r.right, r.top, r.height].map((n) => Math.round(n * 100) / 100), page: p && [p.left, p.top, p.width, p.height].map((n) => Math.round(n * 100) / 100), stageMark: stage?.getAttribute('data-split') || null, railRight: s && s.right, win: window.innerWidth, tutorGrip: vis('.desk-frame-tutor-anchor'), sliverGrip: vis('.desk-frame-sliver-anchor') }; })()";
  const pressBeside = (rowTitle) => app.evalJs(`(() => { const row = [...document.querySelectorAll('[data-back-asset]')].find((r) => r.querySelector('.wz-graft-title')?.textContent === ${q(rowTitle)}); const b = row?.querySelector('[data-back-beside]'); if (!b) return null; const was = b.disabled; b.click(); return { disabled: was, title: b.title }; })()`);
  await openPage(app, 'bm-p'); await toMode('draft');
  await openDrawer(app); await tab(app, 'links');
  const pageBefore = (await app.evalJs(GEO)).page;
  const prefsBefore = await app.evalJs("localStorage.getItem('wrizo-reorg-prefs')");
  const KEYS_BUT_PREFS = "JSON.stringify(Object.keys(localStorage).filter((k) => k !== 'wrizo-reorg-prefs').sort().map((k) => [k, localStorage.getItem(k)]))";
  const storeBefore = await app.evalJs(KEYS_BUT_PREFS);
  await pressBeside('Xcard one');
  await sleep(900);
  const sp = await app.evalJs(GEO);
  const [aLeft, aRight] = sp.asset || [0, 0];
  const half = sp.railRight + (sp.win - sp.railRight) / 2;
  const sideMid = sp.page ? sp.page[0] + sp.page[2] / 2 : 0;
  const wantMid = sp.railRight + 16 + (aLeft - 5 - (sp.railRight + 16)) / 2;
  ok(`SP1: Open beside on a linked Block opens it on the RIGHT: its side ends 16 px short of the window (${sp.win}) and starts at half the room right of the rail (${Math.round(half)}) or where the page's own side needs it, with a grip on its edge`,
    !!sp.asset && Math.abs(aRight - (sp.win - 16)) <= 1 && aLeft >= half - 1 && aLeft <= half + 41 && (await app.evalJs("!!document.querySelector('.wz-split-asset [role=separator]')")), JSON.stringify(sp));
  ok('SP2: the page keeps its size and its top and sits in the middle of its own side (a shift, nothing else); the stage is marked',
    !!sp.page && !!pageBefore && sp.page[1] === pageBefore[1] && sp.page[2] === pageBefore[2] && sp.page[3] === pageBefore[3] && Math.abs(sideMid - wantMid) <= 1.5 && sp.stageMark === 'true', JSON.stringify({ before: pageBefore, page: sp.page, sideMid, wantMid }));
  ok("SP3: both menus are off in a split (hidden, not closed): the Tutor's and the Tools' anchors are not visible", sp.tutorGrip === 'hidden' && sp.sliverGrip === 'hidden', JSON.stringify({ t: sp.tutorGrip, s: sp.sliverGrip }));
  const body = await app.evalJs("document.querySelector('.wz-split-asset .wz-link-dock-title')?.textContent + '|' + document.querySelector('.wz-split-asset .wz-link-dock-kind')?.textContent");
  ok("SP4: the asset is read in its side: the Block's name, and its kind in Machina's word", body === 'Xcard one|Block', body);
  // the grip: a key moves it 16 px and the width is kept
  await app.evalJs("document.querySelector('.wz-split-asset [role=separator]')?.focus()");
  await app.evalJs("document.querySelector('.wz-split-asset [role=separator]')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))"); await sleep(600);
  const moved = await app.evalJs(GEO);
  const savedPrefs = await app.evalJs("localStorage.getItem('wrizo-reorg-prefs')");
  ok('SP5: the grip moves 16 px on an arrow key (the page re-centres in its side, size unchanged) and the width is kept in the prefs record { split: { side: "right", width } }',
    !!moved.asset && Math.abs(moved.asset[0] - (aLeft + 16)) <= 1 && moved.page[2] === sp.page[2] && /"split":\{"side":"right","width":0\.\d+/.test(savedPrefs || '') && prefsBefore === null, JSON.stringify({ moved, savedPrefs, prefsBefore }));
  // close: the page is where it was; the menus are as she left them (the drawer open on ASSETS)
  await click(app, '[data-split-close]'); await sleep(900);
  const back = await app.evalJs(GEO);
  const stillOn = await app.evalJs("document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') === 'true' && document.getElementById('wz-tutor-tab-links')?.getAttribute('aria-selected') === 'true'");
  ok('SP6: closing the split gives the page back exactly (its rect equals the one before), takes the mark off, and the menus are as she left them (the drawer open on Assets)',
    !back.asset && JSON.stringify(back.page) === JSON.stringify(pageBefore) && back.stageMark === null && back.tutorGrip === 'visible' && stillOn, JSON.stringify({ pageBefore, back: back.page, mark: back.stageMark, tg: back.tutorGrip, stillOn }));
  // MUTANT: the same rule on a page left shifted (the rect read while the split stood) goes red
  ok("SP6-M: a page left shifted after the close fails SP6's rule (the mutant is read by SP6's own comparison)", JSON.stringify(sp.page) !== JSON.stringify(pageBefore), JSON.stringify({ shifted: sp.page, before: pageBefore }));
  const storeAfter = await app.evalJs(KEYS_BUT_PREFS);
  ok('SP7: opening, moving the grip and closing wrote nothing to any page, board or setting (every key but the prefs record is byte-identical)', storeBefore === storeAfter, `lens ${storeBefore.length}/${storeAfter.length}`);
  // the next split opens at the width she left (the account's record, device-first)
  await pressBeside('Xcard one'); await sleep(900);
  const again = await app.evalJs(GEO);
  ok("SP8: the next split opens at the width she left (the grip's last place), not at half again", !!again.asset && !!moved.asset && Math.abs(again.asset[0] - moved.asset[0]) <= 1, JSON.stringify({ again: again.asset, moved: moved.asset }));
  await click(app, '[data-split-close]'); await sleep(500);
  // a Board beside the page: its cards, in its own order
  await app.evalJs(`document.querySelector('[data-back-board="bm-x"] [data-back-beside]')?.click()`); await sleep(900);
  // SUPERSEDED (Nov 21; §3b ARBOR item 2a, a Board in the split, Fable Nov 20 11:45 pm: the split draws a Board on its own canvas with its views, pans and zooms
  // - reorg/split/SplitBoard.tsx - not as a list of [data-split-card] rows; arbor/reorg-split-board). What SP9 guarded - the Board's cards, in the Board's
  // own order, under the kind "Board" - is SP9-B's: the canvas draws both cards with the Board's own card, and the Outline view lists them in order. Verbatim:
  // const boardBody = await app.evalJs("[...document.querySelectorAll('.wz-split-asset [data-split-card]')].map((c) => c.querySelector('strong')?.textContent).join('|') + '#' + document.querySelector('.wz-split-asset .wz-link-dock-kind')?.textContent");
  // ok("SP9: a Board opens beside the page as its cards in the board's own order", boardBody === 'Xcard one|Xcard two#Board', boardBody);
  const sp9b = async () => {
    const canvas = await app.evalJs("[...document.querySelectorAll('.wz-split-asset [data-split-board] [data-split-box] .board-text')].map((c) => c.textContent.trim()).sort().join('|') + '#' + document.querySelector('.wz-split-asset .wz-link-dock-kind')?.textContent");
    await app.evalJs("document.querySelector('.wz-split-asset [data-split-view=\"outline\"]')?.click(); null"); await sleep(400);
    const outline = await app.evalJs("[...document.querySelectorAll('.wz-split-asset [data-split-board] .board-outline-text')].map((i) => (i.value ?? i.textContent).trim()).join('|')");
    return { canvas, outline };
  };
  const sp9Pass = (r) => r.canvas === 'Xcard one|Xcard two#Board' && r.outline === 'Xcard one|Xcard two';
  const sp9r = await sp9b();
  ok("SP9-B: a Board opens beside the page on its canvas, both its cards drawn by the Board's own card under the kind Board, and its Outline lists them in the board's own order", sp9Pass(sp9r), JSON.stringify(sp9r));
  // MUT-SP9-B: the Outline in the wrong order turns SP9-B red (the mutant LANDED: the reading changed)
  const sp9m = { ...sp9r, outline: sp9r.outline.split('|').reverse().join('|') };
  ok('MUT-SP9-B: the Board\'s cards out of its own order turn SP9-B red', sp9m.outline !== sp9r.outline && !sp9Pass(sp9m), JSON.stringify(sp9m));
  await click(app, '[data-split-close]'); await sleep(500);
  // Free Writing: no split
  await toMode('freewrite');
  await openDrawer(app); await tab(app, 'links');
  const fw = await pressBeside('Xcard one'); await sleep(400);
  const fwOpen = await app.evalJs("!!document.querySelector('.wz-split-asset')");
  const fwTwOn = await app.evalJs("!!document.querySelector('.mode-scroll[data-typewriter=\"true\"], .mode-pagecol[data-zoom=\"true\"]')");   // SP11-M reads the split rule on this state
  // SUPERSEDED (Fable, Nov 20, 3:15 pm; Nick, Nov 20, 1:20 pm: in SPRINT - Free Write - the Back menu keeps only FEEDBACK, and Plan and Assets are greyed with a note), so the Assets tab
  // holds no "Open beside" to grey in Free Writing: the split is unreachable there before the button. Parked, not deleted; the original, verbatim:
  //   ok('SP10: in Free Writing "Open beside" is greyed with its reason and opens nothing (Free Writing is the Typewriter, always)', !!fw && fw.disabled && /Free Writing/.test(fw.title) && !fwOpen, JSON.stringify({ fw, fwOpen }));
  const fwLocked = await app.evalJs("document.querySelector('#wz-tutor-tab-links')?.getAttribute('aria-disabled') === 'true'");
  ok('SP10 [successor]: in Free Writing (SPRINT) the Assets tab is locked, so there is no "Open beside" to press and nothing opens beside the page (Free Writing is the Typewriter, always)', fwLocked === true && !fwOpen, JSON.stringify({ fwLocked, fwOpen }));
  // the Typewriter on (a Draft page whose own setting is on): not offered
  await app.evalJs("localStorage.setItem('wrizo-typewriter-page-bm-p', 'on')");
  await openPage(app, 'bm-p'); await toMode('draft'); await openDrawer(app); await tab(app, 'links');
  const twOn = await app.evalJs("!!document.querySelector('.mode-scroll[data-typewriter=\"true\"], .mode-pagecol[data-zoom=\"true\"]')");
  const tw = await pressBeside('Xcard one'); await sleep(400);
  const twOpen = await app.evalJs("!!document.querySelector('.wz-split-asset')");
  // ORIGINAL, SUPERSEDED Nov 20 (Nick, Nov 19: Free Write is ALWAYS the Typewriter and Draft NEVER: a Draft page's stored Typewriter setting is read by nothing, so a Draft page with the Typewriter on cannot exist and its twOn reads false; the Typewriter in a split is SP10's, on Free Writing). The original, verbatim:
  // ok('SP11: with the Typewriter on, "Open beside" is greyed with its reason and opens nothing (the Typewriter is not available in a split)', twOn && !!tw && tw.disabled && /Typewriter/.test(tw.title) && !twOpen, JSON.stringify({ twOn, tw, twOpen }));
  // SUCCESSOR: the same seeded setting (stored 'on' on a Draft page) runs NO Typewriter, so "Open beside" is offered and opens the split; the rule is one predicate, and SP11-M reads it on Free Writing (the Typewriter) and must reject it
  const splitOffered = (s) => !s.twOn && !!s.tw && !s.tw.disabled;
  ok('SP11 [successor]: a Draft page whose stored Typewriter setting says on runs no Typewriter (Draft never does), so "Open beside" is offered and opens the split', splitOffered({ twOn, tw }) && twOpen, JSON.stringify({ twOn, tw, twOpen }));
  ok('SP11-M [mutant]: the same predicate read on Free Writing (the Typewriter, always) rejects it - SP11\'s rule is the split rule, not a constant', !splitOffered({ twOn: fwTwOn, tw: fw }) && fwTwOn === true, JSON.stringify({ fwTwOn, fw }));
  if (twOpen) { await click(app, '[data-split-close]'); await sleep(500); }
  await app.evalJs("localStorage.removeItem('wrizo-typewriter-page-bm-p')");
  return checks;
});

const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nREORG-BACKMENU VERIFY: PASS (${checks.length} checks)` : `\nREORG-BACKMENU VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
