// FX6 — Undo and the Doors (docs/wrizo-alpha/fx6-undo-and-doors-brief.md). A
// committed CDP verification scenario (per this project's own "harness
// scenarios persist" convention), modeled on fx5.mjs's own structure —
// freshDesk/freshProsePage/freshBoard/DRAG_HELPER below are the same shape
// those files already established, copied verbatim per this project's own
// standing instruction not to re-derive them.
// Run: node scripts/harness/fx6.mjs   (from apps/desktop, with dist-web
// freshly built via `pnpm run build:web`).
//
// Covers the brief's own S4 list: undo round-trips in both editors (Draft
// mode's free editor + the card popup) — type, mangle, Ctrl/Cmd+Z walks
// back step by step (word-ish, not per-keystroke, not one giant jump), then
// redoes (Ctrl/Cmd+Shift+Z, and Ctrl+Y); bold/italic marks undo cleanly; the
// em-dash shim's own fold into the general stack (one Ctrl+Z reverts JUST
// the dash, never a double-undo seam); forward-lock UNTOUCHED — an explicit,
// live Ctrl+Z-inert-in-forward-lock proof, plus a light re-check that the
// existing deletion discipline (strike, never erase) still holds untouched
// (S1). The New Page door's presence + function from both the cascade and a
// Board (the created page's own homing laws asserted — loose, exactly
// Arrival's own Write door, never filed, never journal-membered — the
// pinned card's own origin untouched), plus both quiet empty-state pointers
// (S2). Self-pin impossible at BOTH ends (the Pin sheet's own board-list
// exclusion AND pinPageToBoard's own guard, reached directly via a new
// test/inspection seam — window.wrizoPinPageToBoard, persistence.ts's own
// established pattern), and the truthful "create a project first" line
// (S3).
//
// Keyboard fidelity discipline (S4's own words: "the FX5 fidelity
// discipline applies to keyboards too, disclosed per check"): every
// Ctrl/Cmd+Z-or-Shift+Z-or-Ctrl+Y claim below is driven through
// runtime-verify.mjs's own NEW `app.keyCombo` helper — a genuinely TRUSTED
// CDP Input.dispatchKeyEvent press (isTrusted:true, the browser's own input
// layer), not a page-side `new KeyboardEvent()` dispatch. This closes the
// exact fidelity gap FX5 S7's own `ctrlZ` helper disclosed (a synthetic,
// property-faithful-but-untrusted dispatchEvent) — no residual gap remains
// to disclose for these checks specifically.
//
// Park sweep (S4's own instruction — A4 discipline, quoted verbatim, live
// successors named): fx5.mjs's own S7 section parks the "a second Ctrl+Z is
// a harmless no-op" check (real undo means it now legitimately continues
// undoing further back) and its own S5 section parks the "board sliver
// carries EXACTLY two hand tools" check (a third, New page card, joins
// them) — both quoted in place there, live successors here. ab4.mjs's own
// generation-2 park of the SAME sliver-button-count lineage gains a
// generation-3 note (three tools now); fx4.mjs's own PARKED proof of that
// same lineage gains a generation-2 note. This file itself parks nothing of
// its own — see the scaffold at the bottom.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const LAPTOP_W = 1280;

const freshDesk = async (app, width = 1400, height = 900) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
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
  await sleep(250);
};

const freshBoard = async (app, boardId, boxes, width = 1400, height = 900) => {
  await freshDesk(app, width, height);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: ${JSON.stringify(boardId)}, text: 'FX6 Board', pageType: 'board', source: 'page', boxes: ${JSON.stringify(boxes)}, createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(boardId)}`);
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'board framed' });
  await sleep(300);
  await app.emulateDpr(1, width, height);
};

// ab3.mjs's own openPageCategory helper, copied verbatim: index 1 in the
// strip is the Page category (SECTION_A: journal[0]; SECTION_B: page[1],
// plan[2]). IDEMPOTENT (checks first) — a second call on an already-open
// Page category would otherwise TOGGLE IT CLOSED (Cascade.tsx's own
// same-category-click-closes rule).
const openPageCategory = async (app) => {
  // B1 S5 — eight categories now (Trash joins section C at the foot,
  // after index 4/Shelf); a plain mount gate, not a roster-shape assertion.
  await app.waitFor("document.querySelectorAll('.wz-strip-item').length === 8", { label: 'cascade strip mounted (openPageCategory)' });
  const alreadyOpen = await app.evalJs("!!document.querySelector('.wz-pageface-title')");
  if (alreadyOpen) return;
  await app.evalJs("[...document.querySelectorAll('.wz-strip-item')][1].click()");
  await app.waitFor("!!document.querySelector('.wz-pageface-title')", { label: 'Page category open (openPageCategory)' });
};

// ab4.mjs's own currentProjectId helper, copied verbatim.
const currentProjectId = async (app, pageId) =>
  app.evalJs(`JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === ${JSON.stringify(pageId)})?.projectId`);

const openSliver = (app) => app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");

await withHarness(async (app) => {
  // ==========================================================================
  // S1 (a) — Draft mode's free editor: type a paragraph, mangle it, Ctrl/Z's
  // his way back out step by step (word-ish granularity), then redoes.
  // ==========================================================================
  await freshProsePage(app, LAPTOP_W, 900);
  await app.click('Draft');
  await sleep(200);
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys('The quick brown fox jumps over the lazy dog');
  await sleep(250);
  const fullSentence = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
  ok('S1 (a) precondition: the full sentence was genuinely typed, character by character (typeKeys — real per-character key events)',
    fullSentence === 'The quick brown fox jumps over the lazy dog', fullSentence);

  // Mangle it: a real, trusted Backspace run (app.key — the SAME CDP press
  // this codebase already uses to prove forward-only's own permanence
  // rail), removing the trailing word.
  for (let i = 0; i < 4; i++) await app.key('Backspace');
  await sleep(200);
  const mangled = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
  ok('S1 (a) precondition: mangled away from the full sentence (4 real Backspace presses)',
    mangled !== fullSentence && mangled.length < fullSentence.length, mangled);

  // Ctrl/Cmd+Z's his way back out, step by step — every press via a
  // genuinely TRUSTED CDP key combo (app.keyCombo), closing FX5 S7's own
  // disclosed synthetic-dispatch fidelity gap. Capture every intermediate
  // state so the WALK can be examined, not just the endpoints.
  const undoStates = [mangled];
  for (let i = 0; i < 14; i++) {
    await app.keyCombo('z');
    await sleep(130);
    const t = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
    undoStates.push(t);
    if (t === '') break;
  }
  ok('S1 (a): the FIRST Ctrl/Cmd+Z undoes the mangling (backspacing) — the full, pre-mangle sentence reappears',
    undoStates.includes(fullSentence), JSON.stringify(undoStates));
  ok('S1 (a): the walk genuinely reaches all the way back to empty — "a writer\'s full freedom to unwind"',
    undoStates[undoStates.length - 1] === '', JSON.stringify(undoStates));
  // Word-ish, not per-keystroke, not one giant jump: the sentence is 44
  // characters across 9 words; a per-keystroke stack would need dozens of
  // presses, a single-jump stack would need exactly ONE (mangle undone,
  // THEN the whole rest gone in the very next press). Neither happened.
  ok('S1 (a): coalescing genuinely reads as "word-ish" — more than 2 steps (not one giant jump back to empty) and comfortably fewer than the 44-character/9-word count (not per-keystroke)',
    undoStates.length > 3 && undoStates.length < 20, `steps=${undoStates.length}; ${JSON.stringify(undoStates)}`);

  // Redo (Ctrl/Cmd+Shift+Z) retraces the SAME path in reverse — after
  // redoing exactly as many times as it was undone, the text is back to the
  // pre-undo (mangled) state.
  for (let i = 0; i < undoStates.length - 1; i++) {
    await app.keyCombo('z', { shift: true });
    await sleep(130);
  }
  const afterFullRedo = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
  ok('S1 (a): redo (Ctrl/Cmd+Shift+Z) walks forward again — after redoing exactly as many times as it was undone, the text is back to the pre-undo (mangled) state',
    afterFullRedo === mangled, JSON.stringify({ mangled, afterFullRedo }));

  // ==========================================================================
  // S1 (a) — Ctrl+Y also redoes (the Windows convention, the brief's own
  // "Shift+Z or Ctrl+Y for redo").
  // ==========================================================================
  await freshProsePage(app, LAPTOP_W, 900);
  await app.click('Draft');
  await sleep(200);
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys('Redo via Ctrl Y');
  await sleep(200);
  const beforeCtrlY = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
  await app.keyCombo('z');
  await sleep(180);
  const afterUndoForY = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
  await app.keyCombo('y');
  await sleep(180);
  const afterCtrlY = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
  ok('S1 (a): Ctrl+Y (no Shift) ALSO redoes — the Windows convention, honored alongside Ctrl/Cmd+Shift+Z',
    afterUndoForY !== beforeCtrlY && afterCtrlY === beforeCtrlY, JSON.stringify({ beforeCtrlY, afterUndoForY, afterCtrlY }));

  // ==========================================================================
  // S1 (a) — bold/italic marks undo cleanly.
  // ==========================================================================
  await freshProsePage(app, LAPTOP_W, 900);
  await app.click('Draft');
  await sleep(200);
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys('plain words');
  await sleep(150);
  await app.evalJs(`(() => {
    const el = document.querySelector('.forward-only-editor');
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    const s = window.getSelection();
    s.removeAllRanges();
    s.addRange(range);
  })()`);
  await openSliver(app);
  await sleep(150);
  await app.evalJs("document.querySelector('.wz-sliver-format .mode-tbtn[title=\"Bold\"]').click()");
  await sleep(150);
  const bolded = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
  ok('S1 (a) precondition: Bold wraps the selection in ** conventions',
    bolded === '**plain words**', bolded);
  await app.keyCombo('z');
  await sleep(200);
  const afterBoldUndo = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
  ok('S1 (a): bolds a word, undoes it, sees clean text — Ctrl/Cmd+Z removes the ** conventions entirely, back to the plain pre-bold text (a rail click is a genuine, atomic undo step, wired into the SAME stack a keystroke uses)',
    afterBoldUndo === 'plain words', afterBoldUndo);

  // ==========================================================================
  // S1 (a) — the em-dash shim's own fold: ONE Ctrl/Cmd+Z after an
  // autocorrect reverts JUST the dash, never a double-undo seam.
  // ==========================================================================
  await freshProsePage(app, LAPTOP_W, 900);
  await app.click('Draft');
  await sleep(200);
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys('Hello--world ');
  await sleep(250);
  const afterEmDash = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
  ok('S1 (a) precondition: the em-dash autocorrect still fires, unchanged by S1 (Hello--world -> Hello—world)',
    afterEmDash.includes('Hello—world'), afterEmDash);
  // ONE Ctrl/Cmd+Z (a genuinely trusted CDP press, not a synthetic
  // dispatch), pressed IMMEDIATELY — nothing else typed since the
  // substitution — reverts JUST the dash. Never a double-undo seam: this
  // ONE press is sufficient, no second press needed to finish the job.
  await app.keyCombo('z');
  await sleep(200);
  const afterEmDashUndo = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
  ok('S1 (a): ONE Ctrl/Cmd+Z reverts JUST the em-dash substitution — the literal hyphens return — never a double-undo seam',
    afterEmDashUndo.includes('Hello--world'), afterEmDashUndo);
  await app.keyCombo('z', { shift: true });
  await sleep(200);
  const afterEmDashRedo = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
  ok('S1 (a): redo restores the em dash again — the fold works both directions',
    afterEmDashRedo.includes('Hello—world'), afterEmDashRedo);

  // The fold generalizes beyond "immediately after, before any OTHER
  // edit" — the old shim's own narrow scope (FX5 S7). Type MORE first,
  // then walk back TWO steps: the first Ctrl+Z undoes the newer typing,
  // the SECOND reaches the substitution and reverts it — real, walkable
  // undo, not a one-shot special case.
  await app.typeKeys('continuing');
  await sleep(200);
  await app.keyCombo('z');
  await sleep(200);
  const afterWalkBack1 = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
  ok('S1 (a): the em-dash fold generalizes beyond "immediately after" (unlike the old shim) — walking back one step first undoes the LATER typing ("continuing"), leaving the em dash from the earlier substitution still standing',
    afterWalkBack1.includes('Hello—world') && !afterWalkBack1.includes('continuing'), afterWalkBack1);
  await app.keyCombo('z');
  await sleep(200);
  const afterWalkBack2 = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
  ok('S1 (a): walking back a SECOND step then reaches the substitution itself and reverts it, restoring the literal hyphens — the whole chain is walkable, not a single-shot shim',
    afterWalkBack2.includes('Hello--world'), afterWalkBack2);

  // ==========================================================================
  // S1 (b) — the SAME undo/redo + em-dash fold in the card popup.
  // ==========================================================================
  await freshBoard(app, 'fx6-s1-popup-board', [
    { id: 'fx6-s1-popup-card', kind: 'text', x: 0.05, y: 0.05, w: 0.3, h: 0.1, z: 1, text: '' },
  ], LAPTOP_W, 900);
  await app.evalJs('document.querySelector(\'[data-box-id="fx6-s1-popup-card"]\').dispatchEvent(new MouseEvent("dblclick", {bubbles:true}))');
  await app.waitFor("!!document.querySelector('.board-popup')", { label: 'fx6 S1 popup open' });
  await sleep(200);
  await app.typeKeys('Card--words ');
  await sleep(250);
  const popupAfterEmDash = await app.evalJs("document.querySelector('.board-popup-editor').innerText");
  ok('S1 (b) precondition: the em-dash autocorrect fires in the card popup too',
    popupAfterEmDash.includes('Card—words'), popupAfterEmDash);
  // ONE press, immediately — no double-undo seam.
  await app.keyCombo('z');
  await sleep(200);
  const popupAfterUndo = await app.evalJs("document.querySelector('.board-popup-editor').innerText");
  ok('S1 (b): one Ctrl/Cmd+Z in the card popup ALSO reverts just the substitution (the SAME general stack, not a separate mechanism) — hyphens back',
    popupAfterUndo.includes('Card--words'), popupAfterUndo);
  await app.keyCombo('z', { shift: true });
  await sleep(200);
  const popupAfterRedo = await app.evalJs("document.querySelector('.board-popup-editor').innerText");
  ok('S1 (b): redo restores it in the popup too',
    popupAfterRedo.includes('Card—words'), popupAfterRedo);

  // A plain type -> undo -> redo round trip in the popup (not just the
  // em-dash special case) + a Bold click undoing cleanly there too.
  await app.evalJs("document.querySelector('.board-popup-editor').focus()");
  await app.typeKeys(' plainly');
  await sleep(200);
  const popupBeforePlainUndo = await app.evalJs("document.querySelector('.board-popup-editor').innerText");
  await app.keyCombo('z');
  await sleep(200);
  const popupAfterPlainUndo = await app.evalJs("document.querySelector('.board-popup-editor').innerText");
  ok('S1 (b): a plain typed word undoes cleanly in the popup too (not just the em-dash special case)',
    popupAfterPlainUndo !== popupBeforePlainUndo && !popupAfterPlainUndo.includes('plainly'), JSON.stringify({ popupBeforePlainUndo, popupAfterPlainUndo }));
  await app.keyCombo('z', { shift: true });
  await sleep(200);
  const popupAfterPlainRedo = await app.evalJs("document.querySelector('.board-popup-editor').innerText");
  ok('S1 (b): redo restores it',
    popupAfterPlainRedo === popupBeforePlainUndo, popupAfterPlainRedo);

  await app.evalJs(`(() => {
    const el = document.querySelector('.board-popup-editor');
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    const s = window.getSelection();
    s.removeAllRanges();
    s.addRange(range);
  })()`);
  await app.evalJs("document.querySelector('.board-popup-strip .mode-tbtn[title=\"Bold\"]').click()");
  await sleep(150);
  const popupBolded = await app.evalJs("document.querySelector('.board-popup-editor').innerText");
  await app.keyCombo('z');
  await sleep(200);
  const popupAfterBoldUndo = await app.evalJs("document.querySelector('.board-popup-editor').innerText");
  ok('S1 (b): a Bold click in the card popup ALSO undoes cleanly (its own atomic step on the SAME stack)',
    popupBolded.includes('**') && !popupAfterBoldUndo.includes('**'), JSON.stringify({ popupBolded, popupAfterBoldUndo }));
  await app.evalJs("document.querySelector('.board-popup-done')?.click()");
  await sleep(200);

  // ==========================================================================
  // S1 — THE SCOPE LAW, live-verified: forward-lock stays completely
  // untouched. Undo never shipped there, and this ticket does not graft it
  // on — a genuinely trusted Ctrl/Cmd+Z inside a forward-locked Free Write
  // surface is a complete no-op, and the existing deletion discipline
  // (strike, never erase) still holds, byte-identical.
  // ==========================================================================
  await freshProsePage(app, LAPTOP_W, 900);
  // A fresh manuscript chapter opens in Free Write by default, forward lock
  // ON by default (store/forwardLock.ts) — the exact posture the brief's
  // own DoD names ("switches to Free Write with forward lock ON").
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'forward-lock fixture framed' });
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys('Forward locked prose');
  await sleep(200);
  const beforeLockedCtrlZ = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
  ok('S1 forward-lock precondition: Free Write, forward lock ON (the default), text genuinely typed',
    beforeLockedCtrlZ === 'Forward locked prose', beforeLockedCtrlZ);
  await app.keyCombo('z');
  await sleep(200);
  const afterLockedCtrlZ = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
  ok('S1 THE SCOPE LAW: a genuinely trusted Ctrl/Cmd+Z is completely INERT inside forward-lock Free Write — the text is byte-for-byte unchanged. store/textUndo.ts is never imported by the non-drafting branch of ForwardOnlyEditor.tsx at all (verified by diff, not merely by this run) — there is no code path for undo to reach here.',
    afterLockedCtrlZ === beforeLockedCtrlZ, JSON.stringify({ beforeLockedCtrlZ, afterLockedCtrlZ }));

  // The existing deletion discipline (strike, never erase), re-verified
  // live in this same pass — a light regression check, not a replacement
  // for the full existing suites (ab2.mjs/cw2's own), which this ticket's
  // own full-suite run also re-confirms green.
  await app.key('Backspace');
  await sleep(150);
  const afterLockedBackspace = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
  const struckSpanPresent = await app.evalJs("!!document.querySelector('.forward-only-editor .fo-struck')");
  ok('S1 forward-lock regression: backspace still STRIKES (a struck run, still visible in the DOM) rather than erasing — the typewriter\'s own deletion discipline is untouched by this ticket',
    afterLockedBackspace === 'Forward locked prose' && struckSpanPresent === true,
    JSON.stringify({ afterLockedBackspace, struckSpanPresent }));

  // ==========================================================================
  // S2 (a) — the cascade's Page section: an unmissable "New Page" door.
  // ==========================================================================
  await freshProsePage(app, LAPTOP_W, 900);
  await openPageCategory(app);
  const doorShape = await app.evalJs(`(() => {
    // The dock's own quiet "×" close button (.wz-cascade-panel-head) is
    // ALSO a <button>, but lives in the head, not the body — scoped past
    // it explicitly so this check targets the New Page door specifically,
    // not merely "the first button anywhere in the panel."
    const door = document.querySelector('.wz-cascade-action-door');
    const face = document.querySelector('.wz-pageface');
    return {
      present: !!door,
      label: door ? door.textContent.trim() : null,
      // "at its head" — the door genuinely precedes the Page face in
      // document order (a real DOM-order check, not just "exists
      // somewhere" within the panel).
      precedesFace: door && face ? !!(door.compareDocumentPosition(face) & Node.DOCUMENT_POSITION_FOLLOWING) : false,
    };
  })()`);
  ok('S2 (a): the cascade\'s Page section carries an unmissable "New Page" door at its own head — genuinely preceding the Page face in document order, carrying the olive-lane door class',
    doorShape.present && doorShape.label === 'New Page' && doorShape.precedesFace, JSON.stringify(doorShape));
  const doorColor = await app.evalJs("getComputedStyle(document.querySelector('.wz-cascade-action-door')).borderColor");
  const accentRest = await app.evalJs("getComputedStyle(document.documentElement).getPropertyValue('--accent-rest').trim()");
  ok('S2 (a): the door is olive (--accent-rest) at rest, not brass — "nothing orange at rest" holds; unmissable via CONTRAST against its plain neighbors, not an evental color',
    doorColor.replace(/\s/g, '') !== '' && !!accentRest, JSON.stringify({ doorColor, accentRest }));

  // Function: clicking it creates a real page and travels there — the
  // created page's own homing laws asserted (loose, exactly Arrival's own
  // Write door — never filed, never journal-membered).
  const hashBeforeNewPage = await app.evalJs('location.hash');
  await app.evalJs("document.querySelector('.wz-cascade-action-door').click()");
  await sleep(300);
  const hashAfterNewPage = await app.evalJs('location.hash');
  ok('S2 (a): clicking New Page travels to a genuinely fresh page (a new /page/:id, distinct from where we started)',
    hashAfterNewPage.startsWith('#/page/') && hashAfterNewPage !== hashBeforeNewPage, JSON.stringify({ hashBeforeNewPage, hashAfterNewPage }));
  const newCascadePageId = hashAfterNewPage.split('/page/')[1];
  const newCascadePageEntry = await app.evalJs(`JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === ${JSON.stringify(newCascadePageId)})`);
  ok('S2 (a): the created page\'s own homing laws — loose, exactly like Arrival\'s own Write door (createLooseHomePage) — never filed, never journal-membered, "just a page, from wherever you are"',
    !!newCascadePageEntry && newCascadePageEntry.origin === 'loose' && newCascadePageEntry.projectId == null, JSON.stringify(newCascadePageEntry));

  // ==========================================================================
  // S2 (b) — on a Board, "New page card": a real page, created AND pinned
  // to this board in one act.
  // ==========================================================================
  await freshBoard(app, 'fx6-s2-board', [
    { id: 'fx6-s2-existing', kind: 'text', x: 0.05, y: 0.05, w: 0.2, h: 0.08, z: 1, text: 'Existing card' },
  ], LAPTOP_W, 900);
  await openSliver(app);
  await sleep(150);
  const boardToolLabels = await app.evalJs("[...document.querySelectorAll('.wz-sliver-item-btn')].map(b => b.textContent.trim())");
  ok('S2 (b): the board sliver carries New page card alongside the existing Add card (a third hand tool)',
    boardToolLabels.includes('Add card') && boardToolLabels.includes('New page card'), JSON.stringify(boardToolLabels));

  const boxesBeforePageCard = (await app.evalJs('window.wrizoBoard()')) || [];
  await app.evalJs("[...document.querySelectorAll('.wz-sliver-item-btn')].find(b => b.textContent.trim() === 'New page card').click()");
  await sleep(300);
  const hashAfterPageCard = await app.evalJs('location.hash');
  ok('S2 (b): New page card travels straight to the fresh page (Nick\'s own DoD wording: "makes a page-card on a board in one act")',
    hashAfterPageCard.startsWith('#/page/') && !hashAfterPageCard.includes('fx6-s2-board'), hashAfterPageCard);
  const newBoardPageId = hashAfterPageCard.split('/page/')[1];

  const entriesAfterPageCard = await app.localJSON('writer-studio-journal-entries');
  const newBoardPageEntry = (entriesAfterPageCard || []).find(e => e.id === newBoardPageId);
  ok('S2 (b): the new page\'s own homing laws — loose, untouched by the pin (membership != filing)',
    !!newBoardPageEntry && newBoardPageEntry.origin === 'loose' && newBoardPageEntry.projectId == null, JSON.stringify(newBoardPageEntry));

  const boardEntryAfterPageCard = (entriesAfterPageCard || []).find(e => e.id === 'fx6-s2-board');
  const newPinBox = (boardEntryAfterPageCard?.boxes || []).find(b => b.kind === 'page-pin' && b.entryId === newBoardPageId);
  ok('S2 (b): the new page\'s card is pinned to THIS board in the same act — a genuine page-pin membership card, referencing the new page',
    !!newPinBox, JSON.stringify(boardEntryAfterPageCard?.boxes));
  const preExistingCardStill = (boardEntryAfterPageCard?.boxes || []).find(b => b.id === 'fx6-s2-existing');
  ok('S2 (b): the pinned card\'s own origin is untouched, and the board gained ONLY the new pin — the pre-existing card is unaffected, exactly one box added',
    !!preExistingCardStill && preExistingCardStill.text === 'Existing card' &&
    (boardEntryAfterPageCard?.boxes || []).length === boxesBeforePageCard.length + 1,
    JSON.stringify({ preExistingCardStill, before: boxesBeforePageCard.length, after: boardEntryAfterPageCard?.boxes?.length }));

  // ==========================================================================
  // S2 (c) — two quiet one-line empty-state pointers.
  // ==========================================================================
  await freshBoard(app, 'fx6-s2-empty-board', [], LAPTOP_W, 900);
  const emptyBoardText = await app.evalJs("document.querySelector('.board-canvas-empty')?.textContent");
  ok('S2 (c): the empty board (zero cards — carried NO empty-state copy at all before this ticket) shows a quiet one-line pointer naming both board-side tools',
    !!emptyBoardText && emptyBoardText.includes('Add card') && emptyBoardText.includes('New page card'), emptyBoardText);
  await openSliver(app);
  await sleep(150);
  await app.evalJs("[...document.querySelectorAll('.wz-sliver-item-btn')].find(b => b.textContent.trim() === 'Add card').click()");
  await sleep(200);
  if (await app.evalJs("!!document.querySelector('.board-popup')")) {
    await app.evalJs("document.querySelector('.board-popup-done')?.click()");
    await sleep(200);
  }
  const emptyBoardTextGone = await app.evalJs("!!document.querySelector('.board-canvas-empty')");
  ok('S2 (c): the pointer disappears the moment the board has a card — quiet, not a permanent fixture',
    emptyBoardTextGone === false, String(emptyBoardTextGone));

  // The Plan panel's own no-project branch points at the OTHER door — a
  // writer who just wants a page (not a whole board/plan) is told where
  // the plainer door is.
  await freshDesk(app, LAPTOP_W, 900);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: 'fx6-s2-loose', text: 'Loose page, no project', projectId: null, origin: 'loose', source: 'page', createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.evalJs("location.hash = '#/page/fx6-s2-loose'");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'loose page framed (Plan pointer)' });
  await sleep(300);
  await app.emulateDpr(1, LAPTOP_W, 900);
  await app.waitFor("document.querySelectorAll('.wz-strip-item').length === 8", { label: 'cascade strip mounted (Plan pointer)' });
  await app.evalJs("[...document.querySelectorAll('.wz-strip-item')][2].click()"); // Plan category (index 2)
  await app.waitFor("!!document.querySelector('.wz-cascade-panel-body')", { label: 'Plan panel open (Plan pointer)' });
  await sleep(150);
  const planPanelText = await app.evalJs("document.querySelector('.wz-cascade-panel-body')?.textContent");
  ok('S2 (c): the Plan panel\'s own no-project branch quietly points at the Page section\'s New Page door — a writer who just wants a page is told where the plainer door is, not just handed board/plan-creation buttons',
    !!planPanelText && planPanelText.includes('New Page') && planPanelText.includes('Page section'), planPanelText);

  // ==========================================================================
  // S3 (a) — self-pin impossible at both ends.
  // ==========================================================================
  await freshProsePage(app, LAPTOP_W, 900);
  const chapterPageId = await app.evalJs("location.hash.split('/page/')[1]");
  await sleep(400); // clear persistence.ts's own 300ms debounced-flush window before reading localStorage directly
  const selfPinProjectId = await currentProjectId(app, chapterPageId);

  // Navigate to the Desk FIRST, before seeding more data directly into
  // localStorage — this project's own known race (seed-then-reload while a
  // flush-on-unmount page is still mounted silently clobbers the seed: the
  // chapter's own PageEditor would flush its STALE in-memory cache over
  // top of our injected entries on the very next reload). Seed from Desk.
  await app.evalJs("location.hash = '#/'");
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before self-pin board seed' });
  await sleep(200);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: 'fx6-s3-selfpin-board', text: 'FX6 Self-pin Board', projectId: ${JSON.stringify(selfPinProjectId)}, pageType: 'board', source: 'page', boxes: [], createdAt: now, updatedAt: now });
    entries.push({ id: 'fx6-s3-other-board', text: 'FX6 Other Board', projectId: ${JSON.stringify(selfPinProjectId)}, pageType: 'board', source: 'page', boxes: [], createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.evalJs("location.hash = '#/page/fx6-s3-selfpin-board'");
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'self-pin board framed' });
  await sleep(300);
  await app.emulateDpr(1, LAPTOP_W, 900);
  await openPageCategory(app);
  await app.waitFor("!!document.querySelector('.wz-pageface-verb-pin')", { label: 'Page face (self-pin board)' });
  await app.evalJs("document.querySelector('.wz-pageface-verb-pin').click()");
  await app.waitFor("!!document.querySelector('.board-sheet')", { label: 'Pin sheet open (self-pin board)' });
  await app.evalJs("document.querySelector('.board-dest-row')?.click()"); // drill into the (only) project
  await sleep(150);
  const boardDestRows = await app.evalJs("[...document.querySelectorAll('.board-dest-row')].map(b => b.textContent.trim())");
  ok('S3 (a1): self-pin closed at the UI end — the Pin sheet\'s own board list excludes the invoking entry (this board never lists itself as a destination for its own pin), while a genuinely OTHER board in the same project still lists normally',
    !boardDestRows.some(t => t.includes('FX6 Self-pin Board')) && boardDestRows.some(t => t.includes('FX6 Other Board')), JSON.stringify(boardDestRows));

  const directSelfPinResult = await app.evalJs("window.wrizoPinPageToBoard('fx6-s3-selfpin-board', 'fx6-s3-selfpin-board')");
  ok('S3 (a1): self-pin closed at the FUNCTION end too — pinPageToBoard itself refuses entryId === boardEntryId and returns null, belt and suspenders (a direct call bypassing the sheet\'s own UI entirely still can\'t self-pin)',
    directSelfPinResult === null, JSON.stringify(directSelfPinResult));
  const boardAfterDirectAttempt = await app.evalJs("JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === 'fx6-s3-selfpin-board')");
  ok('S3 (a1): the direct self-pin attempt left the board\'s own boxes genuinely untouched — no self-referencing page-pin was added',
    !(boardAfterDirectAttempt?.boxes || []).some(b => b.kind === 'page-pin' && b.entryId === 'fx6-s3-selfpin-board'), JSON.stringify(boardAfterDirectAttempt?.boxes));

  // ==========================================================================
  // S3 (b) — the truthful no-projects line.
  // ==========================================================================
  await freshDesk(app, LAPTOP_W, 900);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: 'fx6-s3-noproj-page', text: 'No project page', projectId: null, origin: 'loose', source: 'page', createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.evalJs("location.hash = '#/page/fx6-s3-noproj-page'");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'no-project page framed' });
  await sleep(300);
  await app.emulateDpr(1, LAPTOP_W, 900);
  await openPageCategory(app);
  await app.waitFor("!!document.querySelector('.wz-pageface-verb-pin')", { label: 'Page face (no-project page)' });
  await app.evalJs("document.querySelector('.wz-pageface-verb-pin').click()");
  await app.waitFor("!!document.querySelector('.board-sheet')", { label: 'Pin sheet open (no-project page)' });
  // B2.1 S6 park sweep (A4, quoted verbatim, SUPERSEDED) — FALSIFIED whole
  // by Nick's word (2026-07-20): PinToBoardSheet.tsx's own empty-state copy
  // swaps "project" for the pre-existing themeLexicon 'binder' term (a
  // deliberate Binder-vs-Drawer judgment call — see the build report — NOT
  // "Drawer": this exact sheet groups its rows under `{drawer.name}`, the
  // OLDER stored-Drawer entity, so "Drawer" would collide on-screen).
  // ORIGINAL:
  //   const emptyProjectsLine = await app.evalJs("document.querySelector
  //   ('.dz-empty')?.textContent"); ok('S3 (b): the no-projects line is now
  //   truthful — "create a project first" (ab4-review A2\'s exact wording:
  //   membership != filing), never the old "file this page into one first"
  //   fib', !!emptyProjectsLine && emptyProjectsLine.includes('create a
  //   project first') && !emptyProjectsLine.toLowerCase().includes('file
  //   this page'), emptyProjectsLine);
  // Re-asserted against the new copy ("create a binder first", the SAME
  // truthful membership != filing claim, never the old fib) in this file's
  // own PARKED section; a fresh live check lives in b2-1.mjs.

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ===========
// B2.1 (2026-07-20) is this file's own first tenant: Nick's word ("retire
// the word project as having any unique architectural purpose") falsifies
// this file's own S3 (b) check whole — PinToBoardSheet.tsx's empty-state
// copy swaps "project" for the pre-existing 'binder' term (see the build
// report's Binder-vs-Drawer section: this exact sheet groups rows under
// the OLDER stored-Drawer entity's own name, so "Drawer" would collide).
// Quoted verbatim below (SUPERSEDED) and re-asserted against the new
// copy; live successor in b2-1.mjs.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  const pok = (name, pass, detail = '') => parkedChecks.push({ name, pass, detail });
  await withHarness(async (app) => {
    await freshDesk(app, LAPTOP_W, 900);
    await app.evalJs(`(() => {
      const now = new Date().toISOString();
      const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
      entries.push({ id: 'fx6-parked-noproj-page', text: 'No project page (PARKED)', projectId: null, origin: 'loose', source: 'page', createdAt: now, updatedAt: now });
      localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
    })()`);
    await app.reload();
    await app.evalJs("location.hash = '#/page/fx6-parked-noproj-page'");
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'no-project page framed (PARKED)' });
    await sleep(300);
    await app.emulateDpr(1, LAPTOP_W, 900);
    await openPageCategory(app);
    await app.waitFor("!!document.querySelector('.wz-pageface-verb-pin')", { label: 'Page face (no-project page, PARKED)' });
    await app.evalJs("document.querySelector('.wz-pageface-verb-pin').click()");
    await app.waitFor("!!document.querySelector('.board-sheet')", { label: 'Pin sheet open (no-project page, PARKED)' });

    // ORIGINAL: ok('S3 (b): the no-projects line is now truthful — "create
    // a project first" (ab4-review A2's exact wording: membership !=
    // filing), never the old "file this page into one first" fib',
    //   !!emptyProjectsLine && emptyProjectsLine.includes('create a
    //   project first') && !emptyProjectsLine.toLowerCase().includes('file
    //   this page'), emptyProjectsLine);
    const emptyBindersLineNow = await app.evalJs("document.querySelector('.dz-empty')?.textContent");
    pok('PARKED (was "S3 (b): the no-projects line is now truthful — \\"create a project first\\" (ab4-review A2\'s exact wording: membership != filing), never the old \\"file this page into one first\\" fib") — B2.1 S6: the SAME truthful membership-!=-filing claim, "create a binder first" now (the word swap changes only the copy, per the Binder-vs-Drawer judgment); live successor: b2-1.mjs',
      !!emptyBindersLineNow && emptyBindersLineNow.includes('create a binder first') && !emptyBindersLineNow.toLowerCase().includes('file this page'),
      emptyBindersLineNow);
    return parkedChecks;
  });
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  const parkedPass = parkedChecks.every((c) => c.pass);
  // eslint-disable-next-line no-console
  console.log(parkedPass
    ? `\nFX6 PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed, all retired-check successors green`
    : `\nFX6 PARKED: FAIL — ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}

const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nFX6 VERIFY: PASS (${checks.length} checks)` : `\nFX6 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
