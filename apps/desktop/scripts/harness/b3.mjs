// B3 — Projects as Seeded Boards (docs/wrizo-alpha/b3-seeded-boards-brief.md).
// A committed CDP verification scenario (per this project's own "harness
// scenarios persist" convention), modeled on b1.mjs's/b2.mjs's own
// structure — freshDesk/freshBoard/freshProsePage/POINTER_HELPER below are
// the same shape those files (and fx5.mjs, for freshProsePage) already
// established, copied verbatim per this project's standing instruction not
// to re-derive them.
// Run: node scripts/harness/b3.mjs   (from apps/desktop, with dist-web
// freshly built via `pnpm run build:web`).
//
// Covers this brief's own S4 list: the engine round-trip through one deck
// (Three-Act Structure) at BOTH reference widths — the wizard opens as a
// pop-out over the faded board, board geometry proven byte-identical
// beneath it (not assumed), clickable narrowing answers, deal lands the
// declared card count, every dealt card proven genuinely ordinary (edit
// one, move one, delete one), "Start Here" present then genuinely gone on
// the first edit and proven never to return even after further edits; the
// blank path through CreateProject proven completely unchanged; door 1's
// own round trip ("a project born as a seeded board"); a definitions sweep
// (all seven decks, cheap, via window.wrizoDecks — no DOM interaction);
// anti-solicitation absence checks (fresh board, fresh CreateProject
// screen, no click); a cross-check that dealt cards carry ZERO deck
// back-reference in the boxes array.
//
// Trusted-gesture discipline: card selection/drag uses a real pointerdown+
// pointerup(+pointermove) sequence (POINTER_HELPER, the SAME shape
// b1.mjs/b2.mjs/j4.mjs/j5.mjs already established) — a bare .click() only
// synthesizes 'click', never 'pointerdown', which BoardEditor.tsx's own
// delegated listener requires. The card-popup dblclick-to-open + typeKeys
// edit sequence is the SAME shape fx4.mjs's/fx5.mjs's own S5 sections
// already use.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const LAPTOP_W = 1280;
const WIDE_W = 2200;
const LEGACY_W = 1099; // one px below DESKFRAME_MIN_WIDTH (1100) — the floor

const freshDesk = async (app, width = 1400, height = 900) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
};

const freshBoard = async (app, boardId, boxes, width = 1400, height = 900) => {
  await freshDesk(app, width, height);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const projects = JSON.parse(localStorage.getItem('writer-studio-projects') || '[]');
    projects.push({ id: 'b3-project-' + ${JSON.stringify(boardId)}, title: 'B3 Project', type: 'creative', storyPlanId: null, createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-projects', JSON.stringify(projects));
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: ${JSON.stringify(boardId)}, text: 'B3 Board', projectId: 'b3-project-' + ${JSON.stringify(boardId)}, pageType: 'board', source: 'page', boxes: ${JSON.stringify(boxes)}, createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(boardId)}`);
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'board framed' });
  await sleep(300);
  await app.emulateDpr(1, width, height);
};

// fx5.mjs's own freshProsePage, copied verbatim: the blank CreateProject
// path, unchanged by this ticket.
const freshProsePage = async (app, width = 1400, height = 900) => {
  await freshDesk(app, width, height);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book)' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, framed' });
  await sleep(250);
};

// b1.mjs's/b2.mjs's own pointer-sequence helper, copied verbatim.
const POINTER_HELPER = `
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
  const steps = opts.steps ?? 4;
  for (let i=1;i<=steps;i++) {
    el.dispatchEvent(mk('pointermove', x0 + dx*i/steps, y0 + dy*i/steps));
  }
  el.dispatchEvent(mk('pointerup', x0+dx, y0+dy));
  return true;
};
`;
const selectBox = (app, boxId) => app.evalJs(`window.__pointerSeq('[data-box-id="${boxId}"]', 0, 0)`);
const dragBox = (app, boxId, dx, dy) => app.evalJs(`window.__pointerSeq('[data-box-id="${boxId}"]', ${dx}, ${dy}, {steps:6})`);

const openSliver = async (app) => {
  const alreadyOpen = await app.evalJs("document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'");
  if (alreadyOpen) return;
  await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
  await sleep(200);
};

// The KNOWN Box field set (types/index.ts's own `Box` interface) — the
// cross-question's own ground truth: any key OUTSIDE this set on a dealt
// box would be a deck back-reference this ticket's own constitution
// forbids.
const KNOWN_BOX_KEYS = new Set([
  'id', 'kind', 'x', 'y', 'w', 'h', 'z', 'groupId', 'text', 'strokes',
  'sourceEntryId', 'portedAt', 'entryId', 'connA', 'connB', 'canvasW', 'canvasH', 'footerOn', 'systemKind',
]);

await withHarness(async (app) => {
  await app.evalJs(POINTER_HELPER);

  // ==========================================================================
  // S1/S4 — the engine round-trip, ONE deck (Three-Act Structure) through
  // BOTH reference widths: pop-out over the faded board, board geometry
  // byte-identical beneath it, clickable narrowing, exact declared card
  // count, every dealt card genuinely ordinary, Start Here's full
  // lifecycle, zero deck back-reference.
  // ==========================================================================
  for (const width of [LAPTOP_W, WIDE_W]) {
    const boardId = `b3-roundtrip-${width}`;
    await freshBoard(app, boardId, [
      { id: 'b3-preexisting', kind: 'text', x: 0.05, y: 0.85, w: 0.3, h: 0.08, z: 1, text: 'Already here before dealing' },
    ], width, 900);
    await app.evalJs(POINTER_HELPER); // re-inject — reload() wipes the page's own JS context

    const canvasBefore = await app.evalJs(`(() => { const el = document.querySelector('.board-canvas'); return { w: el.style.width, h: el.style.height }; })()`);
    const preBoxBefore = await app.evalJs(`document.querySelector('[data-box-id="b3-preexisting"]').getBoundingClientRect().toJSON()`);

    await openSliver(app);
    const fromDeckPresent = await app.evalJs("[...document.querySelectorAll('.wz-sliver-item-btn')].some(b => b.textContent.trim() === 'From a deck…')");
    ok(`@${width}px: door 2 — the Board's own Add flow carries "From a deck…" beside its existing options`, fromDeckPresent === true, String(fromDeckPresent));

    // ab4.mjs's own PARKED lineage (its "S5: the board sliver carries
    // EXACTLY its N hand tools" check, five generations deep) names THIS
    // section as generation 5's own live successor — an ORDERED-LABELS
    // check (not a bare count, the more maintainable shape this ticket
    // settles the lineage on) of the sliver's full board-tools roster.
    if (width === LAPTOP_W) {
      const sliverShape = await app.evalJs(`(() => {
        const sections = document.querySelectorAll('.wz-sliver-body > .wz-sliver-section');
        const boardSection = [...sections].find(s => s.querySelector('.wz-sliver-item-btn'));
        const buttons = boardSection ? boardSection.querySelectorAll('button') : [];
        return { buttonCount: buttons.length, labels: [...buttons].map(b => b.textContent.trim()) };
      })()`);
      ok('ab4.mjs S5 lineage, generation 5: the board sliver carries its five hand tools, in order — Add card, New page card, Existing page…, From a deck…, Show connections',
        sliverShape.buttonCount === 5
          && sliverShape.labels[0] === 'Add card' && sliverShape.labels[1] === 'New page card'
          && sliverShape.labels[2] === 'Existing page…' && sliverShape.labels[3] === 'From a deck…'
          && sliverShape.labels[4] === 'Show connections',
        JSON.stringify(sliverShape));
    }

    await app.evalJs("[...document.querySelectorAll('.wz-sliver-item-btn')].find(b => b.textContent.trim() === 'From a deck…').click()");
    await app.waitFor("!!document.querySelector('.deck-wizard-backdrop')", { label: `deck wizard open @${width}px` });
    await sleep(400); // clear the .28s blur/dim transition fully, same discipline fx4.mjs's own S5 section uses

    // Board geometry byte-identical beneath the pop-out — PROVEN, not assumed.
    const geomWhileOpen = await app.evalJs(`(() => {
      const canvasEl = document.querySelector('.board-canvas');
      const blurWrap = document.querySelector('.board-canvas-blur-wrap');
      const cs = getComputedStyle(blurWrap);
      return {
        canvas: { w: canvasEl.style.width, h: canvasEl.style.height },
        preBox: document.querySelector('[data-box-id="b3-preexisting"]').getBoundingClientRect().toJSON(),
        blurred: cs.filter !== 'none' && cs.filter.includes('blur'),
        opacity: parseFloat(cs.opacity),
      };
    })()`);
    ok(`@${width}px: the board canvas's own pixel dimensions are BYTE-IDENTICAL with the wizard open vs. closed`,
      geomWhileOpen.canvas.w === canvasBefore.w && geomWhileOpen.canvas.h === canvasBefore.h, JSON.stringify({ before: canvasBefore, open: geomWhileOpen.canvas }));
    ok(`@${width}px: the pre-existing card's own rendered rect is BYTE-IDENTICAL with the wizard open vs. closed (no reflow anywhere under the pop-out)`,
      JSON.stringify(geomWhileOpen.preBox) === JSON.stringify(preBoxBefore), JSON.stringify({ before: preBoxBefore, open: geomWhileOpen.preBox }));
    ok(`@${width}px: the wizard runs as a pop-out over the FADED board (blur+dim, the SAME .board-canvas-blurred the card popup already uses)`,
      geomWhileOpen.blurred && geomWhileOpen.opacity < 0.7, JSON.stringify(geomWhileOpen));

    // The library, grouped by room — Three-Act Structure under The Fiction Room.
    const libraryState = await app.evalJs(`(() => {
      const heading = [...document.querySelectorAll('.deck-wizard-room-heading')].find(h => h.textContent === 'The Fiction Room');
      const row = document.querySelector('[data-deck-id="three-act"]');
      return { headingPresent: !!heading, rowText: row ? row.textContent : null };
    })()`);
    ok(`@${width}px: the library groups decks by room — "The Fiction Room" heading present, Three-Act Structure named under it`,
      libraryState.headingPresent && libraryState.rowText === 'Three-Act Structure', JSON.stringify(libraryState));

    await app.evalJs("document.querySelector('[data-deck-id=\"three-act\"]').click()");
    await app.waitFor("!!document.querySelector('.deck-wizard-question')", { label: `Three-Act question step @${width}px` });
    const questionState = await app.evalJs(`(() => ({
      prompt: document.querySelector('.deck-wizard-question')?.textContent,
      options: [...document.querySelectorAll('.deck-wizard-option-btn')].map(b => b.textContent.trim()),
    }))()`);
    ok(`@${width}px: clickable-first — the question renders as concrete clickable options, no text entry required`,
      questionState.prompt === 'What are you writing?' && JSON.stringify(questionState.options) === JSON.stringify(['Novel', 'Novella', 'Short story']),
      JSON.stringify(questionState));

    await app.evalJs("document.querySelector('[data-option-id=\"novel\"]').click()");
    await app.waitFor("!document.querySelector('.deck-wizard-backdrop')", { label: `wizard closes on deal @${width}px` });
    ok(`@${width}px: the wizard's own last act is dealing — it closes itself, landing the writer back on the board with cards down`, true);

    const boxesAfterDeal = await app.evalJs('window.wrizoBoard()');
    const dealtTextBoxes = boxesAfterDeal.filter(b => b.kind === 'text' && b.id !== 'b3-preexisting');
    ok(`@${width}px: dealing lands the DECLARED card count (Three-Act/Novel = 9), alongside whatever already lived on the board`,
      dealtTextBoxes.length === 9 && boxesAfterDeal.some(b => b.id === 'b3-preexisting'),
      JSON.stringify({ dealt: dealtTextBoxes.length, total: boxesAfterDeal.length }));

    // Zero deck back-reference — every dealt box's OWN keys are a subset of
    // the known Box interface fields; specifically, no deckId/templateId/
    // definitionId/anything naming the deck this card came from.
    const foreignKeys = dealtTextBoxes.flatMap(b => Object.keys(b).filter(k => !KNOWN_BOX_KEYS.has(k)));
    ok(`@${width}px: dealt cards own NOTHING to their template — zero keys outside the ordinary Box interface (no deckId, no back-reference of any kind)`,
      foreignKeys.length === 0, JSON.stringify(foreignKeys));

    // Start Here: present on the first dealt card (Hook) only.
    const hookBox = dealtTextBoxes.find(b => (b.text || '').startsWith('Hook\n'));
    const startHereState = await app.evalJs(`(() => {
      const marks = [...document.querySelectorAll('[data-start-here="true"]')];
      return { count: marks.length, text: marks[0]?.textContent ?? null, onHook: marks[0]?.closest('.board-box')?.dataset.boxId };
    })()`);
    ok(`@${width}px: "Start Here" sits on the first dealt card (Hook), exactly one mark in the whole DOM`,
      startHereState.count === 1 && startHereState.text === 'Start Here' && startHereState.onHook === hookBox?.id,
      JSON.stringify({ startHereState, hookId: hookBox?.id }));

    // Ordinary in every way: move one (NOT Hook — proves it dismisses via
    // ANY dealt card, not just the hinted one, without moving Hook first).
    const climaxBox = dealtTextBoxes.find(b => (b.text || '').startsWith('Climax\n'));
    const climaxRectBefore = await app.evalJs(`document.querySelector('[data-box-id="${climaxBox.id}"]').getBoundingClientRect().toJSON()`);
    await dragBox(app, climaxBox.id, 40, 30);
    await sleep(150);
    const climaxRectAfter = await app.evalJs(`document.querySelector('[data-box-id="${climaxBox.id}"]').getBoundingClientRect().toJSON()`);
    ok(`@${width}px: a dealt card is genuinely MOVABLE — a plain drag relocates it, no special-casing`,
      climaxRectAfter.x !== climaxRectBefore.x || climaxRectAfter.y !== climaxRectBefore.y, JSON.stringify({ before: climaxRectBefore, after: climaxRectAfter }));
    const startHereAfterMove = await app.evalJs("document.querySelectorAll('[data-start-here=\"true\"]').length");
    ok(`@${width}px: moving a dealt card does NOT dismiss "Start Here" — the fence is CONTENT edit only`, startHereAfterMove === 1, String(startHereAfterMove));

    // Edit a DIFFERENT dealt card's content (Climax, not Hook) — dismisses
    // the hint whole ("not just that one card").
    // FX7 S5 — BoardEditor.tsx's own onDoubleClick now resolves its target
    // via document.elementFromPoint(e.clientX, e.clientY) rather than
    // e.target (a genuine pointer-capture retargeting fix, fx7.mjs's own S5
    // section) — a coordinate-less synthetic dblclick defaults to (0,0),
    // which elementFromPoint no longer forgives; supply the card's own real
    // on-screen center.
    await app.evalJs(`(() => { const el = document.querySelector('[data-box-id="${climaxBox.id}"]'); const r = el.getBoundingClientRect(); el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 })); })()`);
    await app.waitFor("!!document.querySelector('.board-popup-editor')", { label: `card popup open @${width}px` });
    await app.evalJs("document.querySelector('.board-popup-editor').focus()");
    await app.typeKeys(' Rewritten by the writer.');
    await sleep(200);
    await app.evalJs("document.querySelector('.board-popup-foot button').click()");
    await sleep(200);
    const startHereAfterEdit = await app.evalJs("document.querySelectorAll('[data-start-here=\"true\"]').length");
    ok(`@${width}px: "Start Here" vanishes on the FIRST edit to ANY dealt card's content — editing Climax (not Hook) dismissed it`,
      startHereAfterEdit === 0, String(startHereAfterEdit));

    // Edit yet ANOTHER dealt card — proves the hint never returns.
    const resolutionBox = dealtTextBoxes.find(b => (b.text || '').startsWith('Resolution\n'));
    // FX7 S5 — same coordinate-carrying fix (see above).
    await app.evalJs(`(() => { const el = document.querySelector('[data-box-id="${resolutionBox.id}"]'); const r = el.getBoundingClientRect(); el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 })); })()`);
    await app.waitFor("!!document.querySelector('.board-popup-editor')", { label: `second card popup open @${width}px` });
    await app.evalJs("document.querySelector('.board-popup-editor').focus()");
    await app.typeKeys(' A second edit.');
    await sleep(200);
    await app.evalJs("document.querySelector('.board-popup-foot button').click()");
    await sleep(200);
    const startHereAfterSecondEdit = await app.evalJs("document.querySelectorAll('[data-start-here=\"true\"]').length");
    ok(`@${width}px: "Start Here" stays gone after FURTHER edits — it never returns`, startHereAfterSecondEdit === 0, String(startHereAfterSecondEdit));

    // Edit copy also proves the card is genuinely, ordinarily editable — a
    // real text mutation reached storage.
    const boxesAfterEdits = await app.evalJs('window.wrizoBoard()');
    const climaxAfterEdit = boxesAfterEdits.find(b => b.id === climaxBox.id);
    ok(`@${width}px: a dealt card is genuinely EDITABLE — the writer's own text is now stored, verbatim`,
      (climaxAfterEdit?.text ?? '').includes('Rewritten by the writer.'), JSON.stringify(climaxAfterEdit?.text));

    // Delete one — no protest, genuinely gone.
    await selectBox(app, resolutionBox.id);
    await app.waitFor("!!document.querySelector('.board-action-row')", { label: `card selected for delete @${width}px` });
    await app.evalJs("[...document.querySelectorAll('.board-action-row button')].find(b => b.textContent.trim() === 'Remove').click()");
    await sleep(200);
    const boxesAfterDelete = await app.evalJs('window.wrizoBoard()');
    ok(`@${width}px: a dealt card is genuinely DELETABLE — Remove takes it out with no protest, no special case`,
      !boxesAfterDelete.some(b => b.id === resolutionBox.id) && boxesAfterDelete.length === boxesAfterEdits.length - 1,
      JSON.stringify({ before: boxesAfterEdits.length, after: boxesAfterDelete.length }));
  }

  // ==========================================================================
  // S3 — "From a deck…" is genuinely ABSENT on a system Board, the SAME
  // absent-not-disabled law the other three Add-family doors already
  // carry (b1.mjs's/b2.mjs's own re-verified checks for those three stayed
  // green against this ticket's own build — see the build report — this
  // is the dedicated, explicit proof for the fourth).
  // ==========================================================================
  await freshDesk(app, LAPTOP_W, 900);
  await app.goto('/shelf');
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'Shelf Board (system-board absence probe)' });
  await sleep(250);
  await openSliver(app);
  const systemBoardSliverButtons = await app.evalJs("[...document.querySelectorAll('.wz-sliver-item-btn')].map(b => b.textContent.trim())");
  ok('S3: "From a deck…" is genuinely ABSENT from a system Board\'s own sliver — the SAME absent-not-disabled law every other Add door already carries',
    !systemBoardSliverButtons.includes('From a deck…'), JSON.stringify(systemBoardSliverButtons));

  // ==========================================================================
  // The both-reference-widths law's own floor companion: at LEGACY_W (one
  // px below the 1100 DeskFrame floor), a board with dealt cards on it
  // renders via the LEGACY branch (no DeskFrame, no strip, no sliver AT
  // ALL) — the two doors are structurally unreachable there (door 2 lives
  // entirely inside the sliver, which BoardEditor.tsx never mounts below
  // the floor), and DeskRail's own roster stays byte-identical, the SAME
  // proof b1.mjs's/b2.mjs's own LEGACY_W sections already established.
  // ==========================================================================
  await freshBoard(app, 'b3-legacy-floor', [
    { id: 'b3-legacy-card', kind: 'text', x: 0.05, y: 0.05, w: 0.3, h: 0.1, z: 1, text: 'Ordinary legacy card' },
  ], LEGACY_W, 900);
  const legacyFloorShape = await app.evalJs(`({
    deskFrameGone: !document.querySelector('.desk-frame'),
    sliverGone: !document.querySelector('.wz-sliver'),
    wizardGone: !document.querySelector('.deck-wizard-backdrop'),
    boardCanvasPresent: !!document.querySelector('.board-canvas'),
    ordinaryCardPresent: !!document.querySelector('[data-box-id="b3-legacy-card"]'),
    railLabels: [...document.querySelectorAll('.desk-rail-item .desk-rail-label')].map(el => el.textContent),
  })`);
  ok(`@${LEGACY_W}px (one below the 1100 floor): the board renders via its LEGACY branch — no DeskFrame, no sliver, so door 2 is structurally UNREACHABLE (not merely hidden)`,
    legacyFloorShape.deskFrameGone && legacyFloorShape.sliverGone && legacyFloorShape.wizardGone && legacyFloorShape.boardCanvasPresent && legacyFloorShape.ordinaryCardPresent,
    JSON.stringify(legacyFloorShape));
  ok(`@${LEGACY_W}px: DeskRail's own roster stays BYTE-IDENTICAL — Catch, Journal, Shelf, Drawers, Library — completely untouched by this ticket`,
    JSON.stringify(legacyFloorShape.railLabels) === JSON.stringify(['Catch', 'Journal', 'Shelf', 'Drawers', 'Library']), JSON.stringify(legacyFloorShape.railLabels));

  // ==========================================================================
  // S4 — the blank path through CreateProject, proven COMPLETELY unchanged
  // (the SAME flow every pre-B3 harness file already exercises this exact
  // way — fx5.mjs's own freshProsePage, copied verbatim above).
  // ==========================================================================
  await freshProsePage(app, LAPTOP_W, 900);
  const blankPathState = await app.evalJs(`({
    editorPresent: !!document.querySelector('.forward-only-editor'),
    wizardAnywhere: !!document.querySelector('.deck-wizard-backdrop'),
  })`);
  ok('S4: the blank path through CreateProject (kind picker -> Start writing -> Free write) lands EXACTLY where it always did, no deck wizard anywhere in the way',
    blankPathState.editorPresent && !blankPathState.wizardAnywhere, JSON.stringify(blankPathState));
  await sleep(400); // clear persistence.ts's own FLUSH_DELAY (300ms debounce) before reading localStorage directly
  const lastProjectBlank = await app.evalJs(`(() => { const ps = JSON.parse(localStorage.getItem('writer-studio-projects')||'[]'); return ps[ps.length-1]; })()`);
  ok('S4: the blank-created project carries no deck trace whatsoever', !!lastProjectBlank && !('deckId' in lastProjectBlank) && !('deck' in lastProjectBlank), JSON.stringify(lastProjectBlank));

  // ==========================================================================
  // S3/S4 — door 1's own round trip: "Start from a deck…" beneath Blank,
  // opening the library, dealing lands a genuinely NEW project born as a
  // seeded board (Worldbuilding, under The Speculative Annex).
  // ==========================================================================
  await freshDesk(app, LAPTOP_W, 900);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('.cp-start-from-deck')", { label: 'CreateProject door 1 button present' });
  const beforeProjectCount = (await app.evalJs("JSON.parse(localStorage.getItem('writer-studio-projects')||'[]').length"));
  await app.evalJs("document.querySelector('.cp-title-input').focus()");
  await app.typeKeys('B3 Door One Test');
  await app.click('Start from a deck…');
  await app.waitFor("!!document.querySelector('.deck-wizard-backdrop')", { label: 'door 1 wizard open' });
  await sleep(400);
  const door1BlurState = await app.evalJs(`(() => {
    const wrap = document.querySelector('.deck-wizard-blur-wrap');
    const cs = getComputedStyle(wrap);
    return { blurred: cs.filter !== 'none' && cs.filter.includes('blur'), opacity: parseFloat(cs.opacity), formStillThere: !!document.querySelector('.cp-title-input') };
  })()`);
  ok('S3 door 1: opening the wizard fades the CreateProject form beneath it (the SAME pop-out treatment), without removing it from the DOM',
    door1BlurState.blurred && door1BlurState.opacity < 0.7 && door1BlurState.formStillThere, JSON.stringify(door1BlurState));

  const speculativeHeadingPresent = await app.evalJs("[...document.querySelectorAll('.deck-wizard-room-heading')].some(h => h.textContent === 'The Speculative Annex')");
  ok('S3 door 1: the library groups by room here too — "The Speculative Annex" present', speculativeHeadingPresent === true, String(speculativeHeadingPresent));
  await app.evalJs("document.querySelector('[data-deck-id=\"worldbuilding\"]').click()");
  await app.waitFor("!!document.querySelector('.deck-wizard-question')", { label: 'Worldbuilding question step (door 1)' });
  await app.evalJs("document.querySelector('[data-option-id=\"fantasy\"]').click()");
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'door 1 lands on the dealt board' });
  await sleep(500); // clear persistence.ts's own FLUSH_DELAY before reading localStorage directly

  const door1Route = await app.evalJs('location.hash');
  ok('S3 door 1: dealing lands the writer on a REAL board (/page/:id) — "ends on the dealt board"', /^#\/page\/[^/]+$/.test(door1Route), door1Route);
  const door1BoardId = door1Route.replace(/^#\/page\//, '');
  const afterProjectCount = (await app.evalJs("JSON.parse(localStorage.getItem('writer-studio-projects')||'[]').length"));
  ok('S3 door 1: a genuinely NEW project was created (one more row than before)', afterProjectCount === beforeProjectCount + 1, JSON.stringify({ before: beforeProjectCount, after: afterProjectCount }));
  const door1Project = await app.evalJs(`(() => { const ps = JSON.parse(localStorage.getItem('writer-studio-projects')||'[]'); return ps.find(p => p.title === 'B3 Door One Test'); })()`);
  ok('S3 door 1: the new project carries the writer\'s own typed title, and no deck trace whatsoever',
    !!door1Project && !('deckId' in door1Project) && !('deck' in door1Project), JSON.stringify(door1Project));
  const door1Boxes = await app.evalJs('window.wrizoBoard()');
  ok('S3 door 1: the dealt board carries Worldbuilding\'s own declared card count (7)', door1Boxes.filter(b => b.kind === 'text').length === 7, JSON.stringify(door1Boxes.length));
  const door1StartHere = await app.evalJs("document.querySelectorAll('[data-start-here=\"true\"]').length");
  ok('S3 door 1: "Start Here" arms on the freshly dealt board too, via the SAME mechanism as door 2', door1StartHere === 1, String(door1StartHere));

  // ==========================================================================
  // S2 — Character Study, dealt PRE-THREADED: threads wire the cast
  // together at deal time, using the SAME 'connection' Box kind the
  // hand-drawn thread gesture already mints.
  // ==========================================================================
  await freshBoard(app, 'b3-character-study', [], LAPTOP_W, 900);
  await app.evalJs(POINTER_HELPER);
  await openSliver(app);
  await app.evalJs("[...document.querySelectorAll('.wz-sliver-item-btn')].find(b => b.textContent.trim() === 'From a deck…').click()");
  await app.waitFor("!!document.querySelector('.deck-wizard-backdrop')", { label: 'Character Study wizard open' });
  await app.evalJs("document.querySelector('[data-deck-id=\"character-study\"]').click()");
  await app.waitFor("!!document.querySelector('.deck-wizard-question')", { label: 'Character Study question step' });
  await app.evalJs("document.querySelector('[data-option-id=\"three\"]').click()");
  await app.waitFor("!document.querySelector('.deck-wizard-backdrop')", { label: 'Character Study dealt' });
  const csBoxes = await app.evalJs('window.wrizoBoard()');
  const csTextBoxes = csBoxes.filter(b => b.kind === 'text');
  const csConnections = csBoxes.filter(b => b.kind === 'connection');
  ok('S2: Character Study (three characters) deals its declared card count (12 self cards + 2 relationship cards = 14)', csTextBoxes.length === 14, String(csTextBoxes.length));
  // Each relationship card threads to BOTH sides (a hub-and-spoke connection
  // — the relationship card's own thread to character A, and its own
  // separate thread to character B), the SAME shape a hand-drawn thread
  // would need to genuinely "wire the cast together": three characters ->
  // two adjacent-pair relationship cards -> 2 threads each = 4 connections.
  ok('S2: Character Study is dealt PRE-THREADED — each of the two relationship cards threads to BOTH characters it names (2 threads x 2 relationship cards = 4 connections), the SAME \'connection\' Box kind the hand-drawn thread gesture mints',
    csConnections.length === 4, String(csConnections.length));
  const csForeignKeys = csBoxes.flatMap(b => Object.keys(b).filter(k => !KNOWN_BOX_KEYS.has(k)));
  ok('S2: Character Study\'s own dealt cards AND threads carry zero deck back-reference too', csForeignKeys.length === 0, JSON.stringify(csForeignKeys));
  // Every thread's own endpoints are real dealt card ids (no dangling connA/connB).
  const csIds = new Set(csTextBoxes.map(b => b.id));
  const csThreadsValid = csConnections.every(c => csIds.has(c.connA) && csIds.has(c.connB));
  ok('S2: every Character Study thread\'s own endpoints are real, live cards from this exact deal', csThreadsValid === true, String(csThreadsValid));

  // ==========================================================================
  // S4 — the definitions sweep: all seven decks deal without error and
  // land their own exact declared card count. Cheap — zero DOM interaction,
  // via window.wrizoDecks (decks/library/index.ts's own test seam).
  // ==========================================================================
  const EXPECTED_COUNTS = {
    'three-act': 9,
    'worldbuilding': 7,
    'feature-screenplay': 15,
    'thesis': 9,
    'grant': 6,
    'feature-story': 10,
    'character-study': 9,
  };
  const sweepResult = await app.evalJs(`(() => {
    const out = {};
    for (const id of window.wrizoDecks.ids()) {
      const answers = window.wrizoDecks.defaultAnswers(id);
      out[id] = window.wrizoDecks.dealCount(id, answers);
    }
    return out;
  })()`);
  ok('S4: the definitions sweep — all seven decks are registered', Object.keys(sweepResult).length === 7, JSON.stringify(Object.keys(sweepResult)));
  for (const [deckId, expected] of Object.entries(EXPECTED_COUNTS)) {
    ok(`S4 sweep: "${deckId}" deals without error and lands its own exact declared card count (${expected})`,
      sweepResult[deckId] === expected, `got ${sweepResult[deckId]}`);
  }

  // ==========================================================================
  // S4 — anti-solicitation absence checks: no deck UI anywhere without the
  // writer's own click, on a fresh board or a fresh CreateProject screen.
  // ==========================================================================
  await freshBoard(app, 'b3-antisolicitation-board', [], LAPTOP_W, 900);
  await sleep(400); // let every mount effect (reconcile, subscribe) settle
  const freshBoardNoWizard = await app.evalJs(`({
    wizard: !!document.querySelector('.deck-wizard-backdrop'),
    startHere: document.querySelectorAll('[data-start-here="true"]').length,
  })`);
  ok('Anti-solicitation: a fresh, undealt board shows NO deck wizard, no Start Here mark, unprompted',
    freshBoardNoWizard.wizard === false && freshBoardNoWizard.startHere === 0, JSON.stringify(freshBoardNoWizard));
  // The sliver's own board-tools section (SliverToolsBody, Sliver.tsx) is
  // ALWAYS present in the DOM once mounted — a `data-open` attribute + CSS
  // toggles its VISIBILITY, the same "closed, not unmounted" shape every
  // pre-existing Add-family door (Add card/New page card/Existing page…)
  // already uses; testing raw DOM text presence would flag those doors
  // too, so the honest anti-solicitation proof is the sliver's own closed
  // STATE, not text absence — a writer must click the grip to reveal ANY
  // of these doors, "From a deck…" included, no differently from the rest.
  const sliverClosedByDefault = await app.evalJs("document.querySelector('.wz-sliver')?.getAttribute('data-open')");
  ok('Anti-solicitation: the sliver (home of door 2) is CLOSED by default on a fresh board — "From a deck…" is reachable only behind the writer\'s own click on the grip, the SAME gate every pre-existing Add door already stands behind',
    sliverClosedByDefault === 'false', String(sliverClosedByDefault));

  await freshDesk(app, LAPTOP_W, 900);
  await app.goto('/');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'fresh Desk (anti-solicitation)' });
  const freshDeskNoWizard = await app.evalJs(`({
    wizard: !!document.querySelector('.deck-wizard-backdrop'),
    mentionsDeck: (document.body.innerText || '').toLowerCase().includes('deck'),
  })`);
  ok('Anti-solicitation: a fresh Desk (Home) mentions decks NOWHERE and mounts no wizard, unprompted',
    freshDeskNoWizard.wizard === false && freshDeskNoWizard.mentionsDeck === false, JSON.stringify(freshDeskNoWizard));

  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('.cp-start-from-deck')", { label: 'fresh CreateProject (anti-solicitation)' });
  const freshCreateProjectNoWizard = await app.evalJs(`({
    wizard: !!document.querySelector('.deck-wizard-backdrop'),
    doorPresent: !!document.querySelector('.cp-start-from-deck'),
  })`);
  ok('Anti-solicitation: CreateProject shows the "Start from a deck…" DOOR (reachable) but mounts NO wizard until clicked — opt-in, never ambient',
    freshCreateProjectNoWizard.wizard === false && freshCreateProjectNoWizard.doorPresent === true, JSON.stringify(freshCreateProjectNoWizard));

  // S3's own ordering law: "Blank stays first-class, first-listed" —
  // proven by DOM order, not merely presence. Every kind card (Blank's own
  // roster) and "Something else" (also Blank) precede "Start from a
  // deck…" in document order.
  const doorOrder = await app.evalJs(`(() => {
    const all = [...document.querySelectorAll('.cp-kind, .cp-else, .cp-start-from-deck')];
    const deckIndex = all.findIndex(el => el.classList.contains('cp-start-from-deck'));
    return { deckIndex, total: all.length, lastIsDeck: deckIndex === all.length - 1 };
  })()`);
  ok('S3 door 1 ordering: "Start from a deck…" is the LAST item — every Blank kind card and "Something else" precede it in document order',
    doorOrder.lastIsDeck === true, JSON.stringify(doorOrder));

  // Tutor panel — S3's own "no mention in the Tutor panel" law.
  await freshProsePage(app, LAPTOP_W, 900);
  await app.evalJs("document.querySelector('.wz-tutor-grip, [aria-label=\"Open the Tutor\"]')?.click()");
  await sleep(300);
  const tutorMentionsDeck = await app.evalJs("(document.querySelector('.wz-tutor')?.innerText ?? '').toLowerCase().includes('deck')");
  ok('Anti-solicitation: the Tutor panel makes NO mention of decks anywhere in its own copy', tutorMentionsDeck === false, String(tutorMentionsDeck));

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ===========
// Nothing this ticket's own build falsified in an EXISTING harness file
// (the full pre-existing suite, both HARNESS_PARKED settings, ran clean —
// see the build report). No park entries yet; this section exists so a
// future fold against b3.mjs itself has the standing shape to write into.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  const parkedPass = parkedChecks.every((c) => c.pass);
  // eslint-disable-next-line no-console
  console.log(parkedPass
    ? `\nB3 PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed, all retired-check successors green`
    : `\nB3 PARKED: FAIL — ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}

const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nB3 VERIFY: PASS (${checks.length} checks)` : `\nB3 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
