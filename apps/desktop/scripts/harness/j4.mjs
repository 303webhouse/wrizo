// J4 — the Board + the port. A committed CDP verification scenario (per
// AGENTS.md "Harness scenarios persist" — the first citizen of the rule).
// Run: node apps/desktop/scripts/harness/j4.mjs   (from apps/desktop, with
// dist-web freshly built via `pnpm run build:web`).
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Board selection/drag/resize are pointerdown-driven (delegated on the
// canvas), not click handlers — a bare .click() only synthesizes 'click',
// never 'pointerdown'. This dispatches a real synthetic PointerEvent
// sequence so the app's actual listener code runs (mouse pointerType: the
// threshold-commit path, same as a zero-delta tap for pure selection).
const DRAG_HELPER = `
window.__pointerSeq = function(selector, dx, dy, opts) {
  opts = opts || {};
  const el = document.querySelector(selector);
  if (!el) throw new Error('pointerSeq: not found ' + selector);
  const r = el.getBoundingClientRect();
  const x0 = r.left + r.width/2, y0 = r.top + r.height/2;
  const pid = opts.pointerId || 1;
  const ptype = opts.pointerType || 'mouse';
  const mk = (type, x, y) => new PointerEvent(type, {clientX:x, clientY:y, pointerId:pid, pointerType:ptype, bubbles:true, cancelable:true, isPrimary:true});
  el.dispatchEvent(mk('pointerdown', x0, y0));
  const steps = opts.steps || 4;
  for (let i=1;i<=steps;i++) {
    el.dispatchEvent(mk('pointermove', x0 + dx*i/steps, y0 + dy*i/steps));
  }
  el.dispatchEvent(mk('pointerup', x0+dx, y0+dy));
  return true;
};
`;

await withHarness(async (app) => {
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-desk')", { label: 'Desk' });
  await app.evalJs('localStorage.clear()');
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-desk')", { label: 'Desk after clear' });
  await app.evalJs(DRAG_HELPER);

  // -- create page 1 (text only) --------------------------------------------
  await app.goto('/journal');
  await app.waitFor("!!document.querySelector('.journal-new-page')", { label: 'Journal list' });
  await app.click('New page');
  await app.waitFor("!!document.querySelector('.entry-edit')", { label: 'authored page 1' });
  await app.evalJs("document.querySelector('.entry-edit').focus()");
  await app.typeKeys('Page One text.');
  await sleep(2300);

  // -- create page 2 (text + ink) -------------------------------------------
  await app.goto('/journal');
  await app.click('New page');
  await app.waitFor("!!document.querySelector('.entry-edit')", { label: 'authored page 2' });
  await app.evalJs("document.querySelector('.entry-edit').focus()");
  await app.typeKeys('Page Two text.');
  // A deliberately narrow stroke (bbox width ~0.2 of the sheet) so bbox-fit
  // sizing (review fix 3) is distinguishable from the old flat-max-0.5 bug.
  await app.penStroke('.entry-full', [{ x: 0.3, y: 0.3 }, { x: 0.4, y: 0.35 }, { x: 0.5, y: 0.3 }]);
  await sleep(2300);

  let entries = await app.localJSON('writer-studio-journal-entries');
  const p1 = entries.find((e) => e.text === 'Page One text.');
  const p2 = entries.find((e) => e.text === 'Page Two text.');
  ok('two source pages created', !!p1 && !!p2, JSON.stringify({ p1: !!p1, p2: !!p2 }));
  ok('page 2 carries ink strokes', (p2?.strokes?.length ?? 0) > 0, `strokes=${p2?.strokes?.length}`);
  const p1TextBefore = p1.text, p1UpdatedBefore = p1.updatedAt;
  const p2TextBefore = p2.text, p2UpdatedBefore = p2.updatedAt, p2StrokesBefore = JSON.stringify(p2.strokes);

  // -- Spread: select both, Port with "Text + ink", to a NEW project --------
  await app.goto('/journal/spread');
  await app.waitFor("!!document.querySelector('.spread-select-toggle')", { label: 'Spread' });
  await app.click('Select');
  await app.evalJs(`document.querySelector('[data-page-id="${p1.id}"]').click()`);
  await app.evalJs(`document.querySelector('[data-page-id="${p2.id}"]').click()`);
  await app.waitFor("!!document.querySelector('.spread-port')", { label: 'Port button' });
  await app.evalJs("document.querySelector('.spread-port').click()");
  await app.waitFor("!!document.querySelector('.board-sheet')", { label: 'port sheet' });
  await app.waitFor("[...document.querySelectorAll('button')].some(b => b.textContent.includes('Text + ink'))", { label: 'ink choice' });
  await app.evalJs("[...document.querySelectorAll('button')].find(b => b.textContent.includes('Text + ink')).click()");
  await app.waitFor("[...document.querySelectorAll('button')].some(b => b.textContent.includes('New project'))", { label: 'destination picker' });
  await app.evalJs("[...document.querySelectorAll('button')].find(b => b.textContent.includes('New project')).click()");
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'BoardEditor mounted' });
  await sleep(400);

  const boardHash = await app.evalJs('location.hash');
  const boxes1 = await app.evalJs('window.wrizoBoard ? window.wrizoBoard() : null');
  ok('port created 3 boxes (1 text for p1, text+ink pair for p2)', Array.isArray(boxes1) && boxes1.length === 3, JSON.stringify(boxes1?.map((b) => ({ kind: b.kind, src: b.sourceEntryId, g: b.groupId }))));

  const b1 = boxes1?.find((b) => b.sourceEntryId === p1.id);
  const b2text = boxes1?.find((b) => b.sourceEntryId === p2.id && b.kind === 'text');
  const b2ink = boxes1?.find((b) => b.sourceEntryId === p2.id && b.kind === 'ink');
  ok('box 1 (p1) text + provenance, no group', b1?.text === 'Page One text.' && !!b1?.portedAt && !b1.groupId);
  ok('box 2 text + provenance', b2text?.text === 'Page Two text.' && !!b2text?.portedAt);
  ok('box 2 ink + provenance', !!b2ink && !!b2ink.strokes?.length && !!b2ink.portedAt);
  ok('p2 text+ink share a fresh groupId (locked group)', !!b2text?.groupId && b2text.groupId === b2ink?.groupId);
  ok('selection/notebook order: p1 box sits above the p2 group', b1.y < b2text.y, `y1=${b1.y} y2text=${b2text.y}`);
  ok('ink box re-normalized: bbox origin near 0,0, width scaled to ~1', (() => {
    const xs = b2ink.strokes.flatMap((s) => s.points.map((p) => p.x));
    const ys = b2ink.strokes.flatMap((s) => s.points.map((p) => p.y));
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys);
    return minX < 0.01 && minY < 0.01 && Math.abs((maxX - minX) - 1) < 0.01;
  })());
  // review fix 3 — bbox-fit: the drawn stroke's bbox is ~0.2 of the page
  // width (a 0.3..0.5 x-range in the authored sheet's own normalized coords)
  // — well under the old flat-max 0.5 bug. The box must land near that size.
  ok('review fix 3: ink box lands bbox-fit (~0.2), not flat-maxed at 0.5', Math.abs(b2ink.w - 0.2) < 0.03, `w=${b2ink.w}`);

  entries = await app.localJSON('writer-studio-journal-entries');
  const p1After = entries.find((e) => e.id === p1.id);
  const p2After = entries.find((e) => e.id === p2.id);
  ok('source page 1 byte-untouched (COPY not MOVE)', p1After.text === p1TextBefore && p1After.updatedAt === p1UpdatedBefore);
  ok('source page 2 byte-untouched (text + strokes)', p2After.text === p2TextBefore && p2After.updatedAt === p2UpdatedBefore && JSON.stringify(p2After.strokes) === p2StrokesBefore);

  const projects = await app.localJSON('writer-studio-projects');
  ok("'new' destination births an Untitled binder (kind 'other')", projects.some((p) => p.title === 'Untitled' && p.kind === 'other'));

  // -- Slice 1: round-trip across reload -------------------------------------
  await app.reload();
  await app.evalJs(`location.hash = ${JSON.stringify(boardHash)}`);
  await sleep(300);
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'board after reload' });
  const boxesReloaded = await app.evalJs('window.wrizoBoard ? window.wrizoBoard() : null');
  const norm = (bs) => JSON.stringify(bs.map((b) => ({ id: b.id, kind: b.kind, text: b.text, g: b.groupId, src: b.sourceEntryId })).sort((a, b) => a.id.localeCompare(b.id)));
  ok('boxes round-trip byte-identical across reload', norm(boxesReloaded) === norm(boxes1));
  await app.evalJs(DRAG_HELPER); // helpers don't survive reload

  // -- Slice 3: select a grouped member -> selects the WHOLE group ----------
  await app.evalJs(`__pointerSeq('[data-box-id="${b2text.id}"]', 0, 0)`);
  await sleep(100);
  const groupSelected = await app.evalJs(`[document.querySelector('[data-box-id="${b2text.id}"]').dataset.selected, document.querySelector('[data-box-id="${b2ink.id}"]').dataset.selected]`);
  ok('selecting a grouped member selects the whole group', groupSelected[0] === 'true' && groupSelected[1] === 'true', JSON.stringify(groupSelected));
  const canResizeGrouped = await app.evalJs(`!!document.querySelector('[data-box-id="${b2text.id}"] .board-handle')`);
  ok('a grouped selection has NO resize handle (move-only)', canResizeGrouped === false);

  // -- group-move: dragging one member moves both -----------------------------
  const beforeMove = await app.evalJs('window.wrizoBoard()');
  const b2textBefore = beforeMove.find((b) => b.id === b2text.id);
  const b2inkBefore = beforeMove.find((b) => b.id === b2ink.id);
  await app.evalJs(`__pointerSeq('[data-box-id="${b2text.id}"]', 60, 40)`);
  await sleep(150);
  const afterMove = await app.evalJs('window.wrizoBoard()');
  const b2textAfter = afterMove.find((b) => b.id === b2text.id);
  const b2inkAfter = afterMove.find((b) => b.id === b2ink.id);
  const dxText = b2textAfter.x - b2textBefore.x, dxInk = b2inkAfter.x - b2inkBefore.x;
  ok('group-move: both members shift by the same delta', dxText > 0 && Math.abs(dxText - dxInk) < 0.001, `dxText=${dxText} dxInk=${dxInk}`);

  // -- ungroup: frees both members --------------------------------------------
  await app.evalJs("[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Ungroup').click()");
  await sleep(150);
  const afterUngroup = await app.evalJs('window.wrizoBoard()');
  const g1 = afterUngroup.find((b) => b.id === b2text.id).groupId;
  const g2 = afterUngroup.find((b) => b.id === b2ink.id).groupId;
  ok('ungroup clears groupId on both former members', g1 == null && g2 == null, `g1=${g1} g2=${g2}`);

  // -- resize (now-ungrouped p1 box, text -> width; height reflows) ----------
  await app.evalJs(`__pointerSeq('[data-box-id="${b1.id}"]', 0, 0)`);
  await sleep(100);
  const hasHandle = await app.evalJs(`!!document.querySelector('[data-box-id="${b1.id}"] .board-handle')`);
  ok('an ungrouped selection DOES show a resize handle', hasHandle === true);
  const beforeResize = (await app.evalJs('window.wrizoBoard()')).find((b) => b.id === b1.id);
  await app.evalJs(`__pointerSeq('[data-box-id="${b1.id}"] .board-handle', -120, 0, {steps:3})`);
  await sleep(150);
  const afterResize = (await app.evalJs('window.wrizoBoard()')).find((b) => b.id === b1.id);
  ok('resize changed the text box width', afterResize.w < beforeResize.w, `before=${beforeResize.w} after=${afterResize.w}`);

  // -- text edit (session 1): double-click -> edit -> pen produces ZERO characters
  await app.evalJs(`document.querySelector('[data-box-id="${b1.id}"]').dispatchEvent(new MouseEvent('dblclick', {bubbles:true}))`);
  await app.waitFor(`!!document.querySelector('[data-box-id="${b1.id}"] .board-text-editing')`, { label: 'text box in edit mode' });
  const textBeforePen = await app.evalJs(`document.querySelector('[data-box-id="${b1.id}"] .board-text-editing').innerText`);
  await app.penStroke(`[data-box-id="${b1.id}"] .board-text-editing`, [{ x: 0.1, y: 0.5 }, { x: 0.9, y: 0.5 }]);
  await sleep(150);
  const textAfterPen = await app.evalJs(`document.querySelector('[data-box-id="${b1.id}"] .board-text-editing').innerText`);
  ok('pen on an editing text box produces ZERO characters', textAfterPen === textBeforePen, JSON.stringify({ before: textBeforePen, after: textAfterPen }));

  // a real edit DOES land, and persists
  await app.typeKeys(' EDITED');
  await sleep(150);
  await app.evalJs(`document.querySelector('[data-box-id="${b1.id}"] .board-text-editing').blur()`);
  await sleep(2300); // autosave debounce
  entries = await app.localJSON('writer-studio-journal-entries');
  let boardEntry = entries.find((e) => e.boxes?.some((b) => b.id === b1.id));
  let editedBox = boardEntry?.boxes.find((b) => b.id === b1.id);
  ok('text edit persisted to the board entry', !!editedBox?.text?.includes('EDITED'), editedBox?.text);

  // -- (24) review fix 1: a SECOND edit session seeds from the saved edit, not
  // stale mount-time text — and a keystroke preserves it (not stale+new).
  await app.evalJs(`document.querySelector('[data-box-id="${b1.id}"]').dispatchEvent(new MouseEvent('dblclick', {bubbles:true}))`);
  await app.waitFor(`!!document.querySelector('[data-box-id="${b1.id}"] .board-text-editing')`, { label: 'text box in edit mode (session 2)' });
  const seededSession2 = await app.evalJs(`document.querySelector('[data-box-id="${b1.id}"] .board-text-editing').innerText`);
  await app.typeKeys(' AGAIN');
  await sleep(150);
  const afterKeystrokeSession2 = await app.evalJs(`document.querySelector('[data-box-id="${b1.id}"] .board-text-editing').innerText`);
  ok(
    'review fix 1: a second edit session seeds from the FIRST session\'s saved edit (not stale mount-time text), and a keystroke preserves it',
    seededSession2.includes('EDITED') && afterKeystrokeSession2 === seededSession2 + ' AGAIN',
    JSON.stringify({ seededSession2, afterKeystrokeSession2 }),
  );
  await app.evalJs(`document.querySelector('[data-box-id="${b1.id}"] .board-text-editing').blur()`);
  await sleep(2300);

  // -- (25) review fix 2: copy FROM a board text box -> paste into a Draft
  // surface is ALLOWED (no whisper); a genuinely foreign paste still blocks
  // + whispers (proves the shadow is actually gating, not just always-open).
  const copiedText = await app.evalJs(`
    (() => {
      const el = document.querySelector('[data-box-id="${b1.id}"] .board-text');
      if (!el) return null;
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      const text = String(sel);
      el.dispatchEvent(new ClipboardEvent('copy', { bubbles: true, cancelable: true }));
      return text;
    })()
  `);

  const projectsNow = await app.localJSON('writer-studio-projects');
  const untitled = projectsNow.find((p) => p.title === 'Untitled' && p.kind === 'other');
  await app.goto(`/project/${untitled.id}`);
  await app.waitFor("[...document.querySelectorAll('button')].some(b => b.textContent.includes('New chapter'))", { label: 'ProjectHome' });
  await app.evalJs("[...document.querySelectorAll('button')].find(b => b.textContent.includes('New chapter')).click()");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'chapter editor' });
  await app.click('Draft');
  await sleep(200);

  await app.evalJs(`
    (() => {
      const el = document.querySelector('.forward-only-editor');
      el.focus();
      const dt = new DataTransfer(); dt.setData('text/plain', ${JSON.stringify(copiedText)});
      el.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: dt }));
    })()
  `);
  await sleep(300);
  const whisperAfterOwnPaste = await app.evalJs("document.querySelector('.vw-whisper')?.dataset.shown ?? null");

  await app.evalJs(`
    (() => {
      const el = document.querySelector('.forward-only-editor');
      el.focus();
      const dt = new DataTransfer(); dt.setData('text/plain', 'a foreign voice, never copied here');
      el.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: dt }));
    })()
  `);
  await sleep(300);
  const whisperAfterForeignPaste = await app.evalJs("document.querySelector('.vw-whisper')?.dataset.shown ?? null");

  ok(
    'review fix 2: own board-text copy pastes into Draft ALLOWED (no whisper); a genuinely foreign paste still blocks + whispers',
    !!copiedText && whisperAfterOwnPaste !== 'true' && whisperAfterForeignPaste === 'true',
    JSON.stringify({ copiedText, whisperAfterOwnPaste, whisperAfterForeignPaste }),
  );

  // -- remove + undo (the p2 ink box, standalone since the ungroup above) ----
  await app.goto(boardHash.replace(/^#/, ''));
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'board (remove+undo)' });
  await app.evalJs(DRAG_HELPER);
  await sleep(200);
  await app.evalJs(`__pointerSeq('[data-box-id="${b2ink.id}"]', 0, 0)`);
  await sleep(100);
  await app.evalJs("[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Remove').click()");
  await sleep(150);
  let currentBoxes = await app.evalJs('window.wrizoBoard()');
  ok('Remove deletes the selected box', !currentBoxes.some((b) => b.id === b2ink.id), `count=${currentBoxes.length}`);
  await app.evalJs("[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Undo').click()");
  await sleep(150);
  currentBoxes = await app.evalJs('window.wrizoBoard()');
  ok('Undo restores the removed box', currentBoxes.some((b) => b.id === b2ink.id));
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nJ4 VERIFY: PASS (${checks.length} checks)` : `\nJ4 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
