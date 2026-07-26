// BG1 — the Beginnings (docs/wrizo-alpha/p1-wave.md §BG1, + P1 amendment 2's
// page doors: Screenplay · Sprout · Plan). A committed CDP verification
// scenario, per AGENTS.md's "harness scenarios persist."
//
// Proves the brief's three sections and its DoD:
//   S1 — the board's row: the right doors per mode (OPEN / STORYBOARD /
//        OUTLINE), ABSENT whole on system boards (Journal/Shelf/Trash, whose
//        declarative empty lines are untouched), gone the instant the board has
//        furniture, and every door genuinely opens onto something (no dead
//        ends). Includes New Lane, which BG1 makes reachable from an empty
//        storyboard for the first time.
//   S2 — the page's row: the three start-words on a zero-word page; the caret
//        is LIVE UNDER IT from the first frame (the load-bearing check: a
//        writer types immediately, never touching the row, and the row is gone
//        when they do); dismissed by Esc; never rendered on a page with words;
//        each door's own act (Screenplay converts free, Sprout draws from the
//        deck with nothing leaving the machine and nothing insertable, Plan
//        lazily births the paired plan board and travels).
//   S3 — one grammar: both surfaces render the SAME component with the same
//        computed type and color; nothing counted, no completion state, no
//        "get started" language anywhere in either row.
//   The 1366×768 leg (the constitutional small-laptop leg, FX13's precedent)
//   for both rows' geometry.
//
// Fixtures (freshDesk / freshBoard / openSliver) copied verbatim from fx6.mjs
// per this project's own standing instruction not to re-derive them; freshPage
// follows fx14.mjs's own seed-from-the-Desk shape (AGENTS.md's harness-seeding
// law: seed only while no flush-on-unmount surface is mounted, then reload).
// Run: node scripts/harness/bg1.mjs   (from apps/desktop, with dist-web freshly
// built via `pnpm run build:web`).
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const LAPTOP_W = 1280;
// FX13's own constitutional leg — the smallest real laptop this app is held to.
const LEG_W = 1366, LEG_H = 768;

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
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: ${JSON.stringify(boardId)}, text: 'BG1 Board', pageType: 'board', source: 'page', boxes: ${JSON.stringify(boxes)}, createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(boardId)}`);
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'board framed' });
  await sleep(300);
  await app.emulateDpr(1, width, height);
};

// A genuinely EMPTY page (zero words), loose-origin so it opens in Free Write —
// the posture a fresh page actually arrives in (PageEditor's own default for
// origin 'loose').
const freshPage = async (app, pageId, text = '', width = 1400, height = 900) => {
  await freshDesk(app, width, height);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: ${JSON.stringify(pageId)}, text: ${JSON.stringify(text)}, projectId: null, origin: 'loose', source: 'page', createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(pageId)}`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'page mounted' });
  await sleep(300);
  await app.emulateDpr(1, width, height);
};

const openSliver = (app) => app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");

const doorLabels = (app) => app.evalJs("[...document.querySelectorAll('.wz-beginning')].map(b => b.textContent.trim())");
const rowPresent = (app) => app.evalJs("!!document.querySelector('.wz-beginnings')");
const setBoardMode = async (app, mode) => {
  await app.evalJs(`document.querySelector('[data-board-mode-tab="${mode}"]').click()`);
  await sleep(250);
};
// A genuinely TRUSTED click on a door (the standing gesture-fidelity
// discipline): read the door's own rect, press and release there through CDP
// Input rather than calling .click() page-side.
const clickDoor = async (app, key) => {
  const r = await app.evalJs(`(() => { const el = document.querySelector('[data-beginning="${key}"]'); if (!el) throw new Error('no door ${key}'); const b = el.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; })()`);
  await app.mouseMove(r.x, r.y);
  await sleep(60);
  await app.mouseDown(r.x, r.y);
  await app.mouseUp(r.x, r.y);
  await sleep(300);
};

// BoardEditor's own board writes are DEBOUNCED (AUTOSAVE_MS = 2000) — a door
// press mutates the live boxes immediately and the row reacts at once, but the
// localStorage row it lands in trails it. Wait for the persisted state rather
// than sleeping a guessed interval (the contention-flake class this project has
// already diagnosed twice); a timeout is swallowed deliberately so the check
// below still reports the REAL state instead of aborting the scenario.
const waitPersist = async (app, expr, timeout = 9000) => {
  try { await app.waitFor(expr, { timeout, label: expr }); } catch { /* the assertion reports the truth */ }
};

// "Nothing counted, no completion state, no 'get started' language" — asserted
// against the row's own rendered text, structurally (a digit, a checkmark, or
// any of the task/checklist vocabulary would all fail).
const CHECKLIST_WORDS = ['get started', 'getting started', 'step ', 'complete', 'completed', 'finish', 'done', 'todo', 'to-do', 'progress', '%'];
const rowLanguageClean = async (app) => {
  const text = await app.evalJs("(document.querySelector('.wz-beginnings')?.textContent || '').toLowerCase()");
  return {
    text,
    clean: !!text && !/\d/.test(text) && !text.includes('✓') && !CHECKLIST_WORDS.some((w) => text.includes(w)),
  };
};

await withHarness(async (app) => {
  // ==========================================================================
  // S1 — the board's row, per mode.
  // ==========================================================================
  await freshBoard(app, 'bg1-open-board', [], LAPTOP_W, 900);
  const openDoors = await doorLabels(app);
  ok('S1 (OPEN): an empty ordinary board renders the Beginnings row with exactly its four doors, in the brief\'s order — New Card · New Page Card · Load a Deck · Connect a Page',
    JSON.stringify(openDoors) === JSON.stringify(['New Card', 'New Page Card', 'Load a Deck', 'Connect a Page']), JSON.stringify(openDoors));

  // Quiet olive — the brief's own word for the doors' color, and the hue the
  // house reserves for "this is a door" (--accent-rest, #96a05a).
  // BG2 (item 73, SV19/SV20) — the resting-paint check is PARKED at the foot of
  // this file: the doors keep olive, but the VALUE steps down to `--accent-door`
  // and the resting opacity is retired. Live successor: bg2.mjs.

  // "No grid" — one row, one line: every door shares a top edge.
  const doorTops = await app.evalJs("[...document.querySelectorAll('.wz-beginning')].map(b => Math.round(b.getBoundingClientRect().top))");
  ok('S1: the doors sit on ONE line — a row, never a grid (identical top edge across all four)',
    doorTops.length === 4 && new Set(doorTops).size === 1, JSON.stringify(doorTops));

  const openLang = await rowLanguageClean(app);
  ok('S1/S3: the board row counts nothing and claims no completion — no digits, no checkmark, no "get started"/step/progress language',
    openLang.clean, openLang.text);

  // Icon + label: each door carries a glyph AND a word.
  const doorShape = await app.evalJs(`[...document.querySelectorAll('.wz-beginning')].map(b => ({
    glyph: !!b.querySelector('.wz-beginning-glyph svg'), label: (b.querySelector('.wz-beginning-label')?.textContent || '').trim(),
  }))`);
  ok('S1: every door is an icon+label door (a glyph and a word, per the brief)',
    doorShape.length === 4 && doorShape.every((d) => d.glyph && d.label.length > 0), JSON.stringify(doorShape));

  // STORYBOARD's own three.
  await setBoardMode(app, 'storyboard');
  const sbDoors = await doorLabels(app);
  ok('S1 (STORYBOARD): the row is Load a Deck · New Lane · New Card — the brief\'s own set for this mode, in order',
    JSON.stringify(sbDoors) === JSON.stringify(['Load a Deck', 'New Lane', 'New Card']), JSON.stringify(sbDoors));

  // OUTLINE's own two.
  await setBoardMode(app, 'outline');
  const olDoors = await doorLabels(app);
  ok('S1 (OUTLINE): the row is New Card · Load a Deck — the brief\'s own set for this mode, in order',
    JSON.stringify(olDoors) === JSON.stringify(['New Card', 'Load a Deck']), JSON.stringify(olDoors));

  // The projections' old empty lines are gone where the row stands.
  const projectionEmptyGone = await app.evalJs("!document.querySelector('.board-projection-empty')");
  ok('S1: the projection\'s old empty line ("Add cards in Open, then…" — the sentence that sent a writer somewhere else) is replaced by the row itself',
    projectionEmptyGone === true, String(projectionEmptyGone));

  // ==========================================================================
  // S1 — New Lane: a door BG1 makes reachable for the first time (an empty
  // storyboard returned its empty line before it ever rendered the add-lane
  // button), and the row correctly survives a lane, because a lane is not yet
  // furniture — which is what lets New Lane be followed by New Card.
  // ==========================================================================
  await freshBoard(app, 'bg1-lane-board', [], LAPTOP_W, 900);
  await setBoardMode(app, 'storyboard');
  await clickDoor(app, 'newLane');
  await waitPersist(app, "((JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === 'bg1-lane-board')?.boxes || []).find(b => b.kind === 'board-meta')?.lanes || []).length === 1");
  const lanesAfter = await app.evalJs("(JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === 'bg1-lane-board')?.boxes || []).find(b => b.kind === 'board-meta')?.lanes || []");
  ok('S1: New Lane genuinely lays a lane on the board-meta registry (zero schema — the existing lanes[] field), from an empty storyboard where no lane control existed at all before BG1',
    Array.isArray(lanesAfter) && lanesAfter.length === 1 && typeof lanesAfter[0].id === 'string', JSON.stringify(lanesAfter));
  ok('S1: the row survives a lane — a lane is not furniture, so New Lane can be followed by New Card (never a dead end)',
    (await rowPresent(app)) === true);

  await clickDoor(app, 'newCard');
  await waitPersist(app, "(JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === 'bg1-lane-board')?.boxes || []).filter(b => b.kind === 'text').length === 1");
  const afterCardInSb = await app.evalJs(`({
    row: !!document.querySelector('.wz-beginnings'),
    cards: (JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === 'bg1-lane-board')?.boxes || []).filter(b => b.kind === 'text').length,
    popup: !!document.querySelector('.board-popup'),
  })`);
  ok('S1: New Card in STORYBOARD adds a real card and the row goes — and no card popup is armed in a projection that cannot render one (the OPEN-only popup gate)',
    afterCardInSb.row === false && afterCardInSb.cards === 1 && afterCardInSb.popup === false, JSON.stringify(afterCardInSb));

  // ==========================================================================
  // S1 — gone the instant there is furniture (OPEN), via a trusted door press.
  // ==========================================================================
  await freshBoard(app, 'bg1-vanish-board', [], LAPTOP_W, 900);
  ok('S1 precondition: the row is up on the empty OPEN board', (await rowPresent(app)) === true);
  await clickDoor(app, 'newCard');
  const afterCard = await app.evalJs(`({
    row: !!document.querySelector('.wz-beginnings'),
    popup: !!document.querySelector('.board-popup'),
  })`);
  ok('S1: the row is gone the instant the board has furniture — and OPEN\'s New Card still opens the new card straight into its popup, unchanged',
    afterCard.row === false && afterCard.popup === true, JSON.stringify(afterCard));

  // ==========================================================================
  // S1 — the other doors genuinely open onto something (no dead ends).
  // ==========================================================================
  await freshBoard(app, 'bg1-deck-board', [], LAPTOP_W, 900);
  await clickDoor(app, 'loadDeck');
  ok('S1: Load a Deck opens the deck library (DeckWizard) — on this explicit press, never ambiently',
    (await app.evalJs("!!document.querySelector('.deck-wizard, .deck-wizard-backdrop')")) === true,
    await app.evalJs("document.body.innerText.slice(0, 120)"));

  await freshBoard(app, 'bg1-connect-board', [], LAPTOP_W, 900);
  await clickDoor(app, 'connectPage');
  ok('S1: Connect a Page opens the existing-page picker',
    (await app.evalJs("!!document.querySelector('.board-sheet, .existing-page-picker')")) === true,
    await app.evalJs("document.body.innerText.slice(0, 120)"));

  await freshBoard(app, 'bg1-pagecard-board', [], LAPTOP_W, 900);
  await clickDoor(app, 'newPageCard');
  const pageCardHash = await app.evalJs('location.hash');
  await sleep(400);
  const pageCardPin = await app.evalJs("(JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === 'bg1-pagecard-board')?.boxes || []).filter(b => b.kind === 'page-pin').length");
  ok('S1: New Page Card births a linked page and travels to it, pinning its card to this board in one act',
    /^#\/page\/[^/]+$/.test(pageCardHash) && !pageCardHash.includes('bg1-pagecard-board') && pageCardPin === 1,
    JSON.stringify({ pageCardHash, pageCardPin }));

  // ==========================================================================
  // S1 — system boards render NO row, and keep their own declarative lines.
  // ==========================================================================
  await freshDesk(app, LAPTOP_W, 900);
  for (const [route, label] of [['/shelf', 'Shelf'], ['/journal', 'Journal'], ['/trash', 'Trash']]) {
    await app.evalJs(`location.hash = '#${route}'`);
    await app.waitFor("!!document.querySelector('.board-canvas, .desk-frame')", { label: `${label} Board mounted` });
    await sleep(350);
    const sys = await app.evalJs(`({ row: !!document.querySelector('.wz-beginnings'), line: document.querySelector('.board-canvas-empty')?.textContent ?? null })`);
    ok(`S1: the ${label} Board renders NO Beginnings row — a system board's cards are derived, so there is nothing here for a writer to begin (absent whole, the absent-not-disabled law)`,
      sys.row === false, JSON.stringify(sys));
    if (route === '/shelf') {
      ok('S1: the Shelf Board\'s own declarative empty line is untouched by BG1 ("Nothing waiting." — B2 S2\'s one quiet fact)',
        sys.line === 'Nothing waiting.', String(sys.line));
    }
  }

  // ==========================================================================
  // S1 — a paired plan board takes OPEN's row (no plan-board branch exists).
  // ==========================================================================
  await freshPage(app, 'bg1-plan-parent', '', LAPTOP_W, 900);
  await clickDoor(app, 'plan');
  await app.waitFor("!!document.querySelector('.board-canvas, .board-projection')", { label: 'paired plan board mounted' });
  await sleep(350);
  const planBoardDoors = await doorLabels(app);
  ok('S1: a paired plan board takes OPEN\'s row — it is an ordinary board and gets the ordinary four doors',
    JSON.stringify(planBoardDoors) === JSON.stringify(['New Card', 'New Page Card', 'Load a Deck', 'Connect a Page']), JSON.stringify(planBoardDoors));

  // ==========================================================================
  // S2 — the page's row. THE load-bearing check first: the page is already
  // live and typeable, and the writer never touches the row.
  // ==========================================================================
  await freshPage(app, 'bg1-type-now', '', LAPTOP_W, 900);
  const pageDoors = await doorLabels(app);
  ok('S2: a zero-word page renders the three start-words — Screenplay · Sprout · Plan (P1 amendment 2; "Sprout" supersedes "Start from a Spark")',
    JSON.stringify(pageDoors) === JSON.stringify(['Screenplay', 'Sprout', 'Plan']), JSON.stringify(pageDoors));

  const caretLive = await app.evalJs(`(() => {
    const ed = document.querySelector('.forward-only-editor');
    const active = document.activeElement;
    return { focused: !!ed && (ed === active || ed.contains(active)), rowEvents: getComputedStyle(document.querySelector('.wz-beginnings')).pointerEvents };
  })()`);
  ok('S2: the caret is LIVE under the row from the first frame — the editor already holds focus with nothing clicked, and the row itself is pointer-events:none so it can never intercept it',
    caretLive.focused === true && caretLive.rowEvents === 'none', JSON.stringify(caretLive));

  // Type immediately, without ever touching the row.
  await app.typeKeys('Straight to the words');
  await sleep(300);
  const afterTyping = await app.evalJs(`({
    text: (document.querySelector('.forward-only-editor')?.innerText || '').trim(),
    row: !!document.querySelector('.wz-beginnings'),
  })`);
  ok('S2 (the DoD): a writer types immediately without touching the row, the words land, and the row is gone the moment they do — the row never asked permission and never blocked a keystroke',
    afterTyping.text === 'Straight to the words' && afterTyping.row === false, JSON.stringify(afterTyping));

  // A page that already has words never renders it at all.
  await freshPage(app, 'bg1-has-words', 'This page already began.', LAPTOP_W, 900);
  ok('S2: a page that already has words never renders the row at all',
    (await rowPresent(app)) === false);

  const pageLang = await (async () => { await freshPage(app, 'bg1-lang', '', LAPTOP_W, 900); return rowLanguageClean(app); })();
  ok('S2/S3: the page row counts nothing and claims no completion either — same grammar, same silence',
    pageLang.clean, pageLang.text);

  // Esc dismisses.
  await app.key('Escape');
  await sleep(250);
  ok('S2: Esc dismisses the row (and the page is still a page — the editor is untouched)',
    (await rowPresent(app)) === false && (await app.evalJs("!!document.querySelector('.forward-only-editor')")) === true);

  // ==========================================================================
  // S2 — Sprout: deck-drawn, never model-drawn; never insertable.
  // ==========================================================================
  await freshPage(app, 'bg1-sprout', '', LAPTOP_W, 900);
  // Count every outbound request from this point on — page load included, since
  // the counters are installed before the door is pressed and the page has been
  // sitting mounted. The ratified disclosure sentence forbids a send on page
  // load; the deck is local (NUDGE_POOL), so a drawn line costs zero requests.
  await app.evalJs(`(() => {
    window.__bg1Net = 0;
    const f = window.fetch;
    window.fetch = function (...a) { window.__bg1Net++; return f.apply(this, a); };
    const open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (...a) { window.__bg1Net++; return open.apply(this, a); };
    if (window.WebSocket) { const W = window.WebSocket; window.WebSocket = function (...a) { window.__bg1Net++; return new W(...a); }; }
  })()`);
  await clickDoor(app, 'sprout');
  const sprouted = await app.evalJs(`({
    prompt: (document.querySelector('.fl-prompt')?.textContent || '').trim(),
    row: !!document.querySelector('.wz-beginnings'),
    net: window.__bg1Net,
    editorText: (document.querySelector('.forward-only-editor')?.innerText || '').trim(),
    insideEditor: !!document.querySelector('.forward-only-editor .fl-prompt'),
    controls: [...document.querySelectorAll('.fl-invite button')].map(b => b.textContent.trim()),
  })`);
  ok('S2: Sprout draws a line on request — an invitation appears where nothing was offered unbidden',
    sprouted.prompt.length > 0 && sprouted.row === false, JSON.stringify(sprouted));
  ok('S2 (the rail): deck-drawn, never model-drawn — drawing a line makes ZERO outbound requests (fetch/XHR/WebSocket all counted)',
    sprouted.net === 0, String(sprouted.net));
  ok('S2 (the rail): the drawn line can never become the writer\'s text — it renders OUTSIDE the editable DOM, the page still holds zero words, and the only control offered is "don\'t offer again" (no accept, no insert, no tab-fill)',
    sprouted.insideEditor === false && sprouted.editorText === '' &&
    JSON.stringify(sprouted.controls) === JSON.stringify(['don’t offer again']), JSON.stringify(sprouted));

  // The writer's ink still wins the space: the first keystroke takes it back.
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys('Mine.');
  await sleep(300);
  ok('S2 (the rail): the first keystroke dismisses the drawn line — the writer\'s ink always wins the space',
    (await app.evalJs("!document.querySelector('.fl-prompt')")) === true);

  // ==========================================================================
  // S2 — Screenplay: structure flipped at the moment it is cheapest, free on
  // an empty page (no modal).
  // ==========================================================================
  await freshPage(app, 'bg1-screenplay', '', LAPTOP_W, 900);
  await clickDoor(app, 'screenplay');
  await sleep(500);
  const scripted = await app.evalJs(`({
    modal: !!document.querySelector('.structure-confirm-modal'),
    pageType: JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === 'bg1-screenplay')?.pageType,
    surface: !!document.querySelector('.script-page, .script-editor, [data-script-surface]'),
  })`);
  ok('S2: the Screenplay door flips structure on an empty page for free — no confirmation modal (AB2 S4: switching an empty page costs nothing), and the page is genuinely a script now',
    scripted.modal === false && scripted.pageType === 'script', JSON.stringify(scripted));

  // ==========================================================================
  // S2 — Plan: the paired plan board, lazily born, then travelled to.
  // ==========================================================================
  await freshPage(app, 'bg1-plan-door', '', LAPTOP_W, 900);
  const planBefore = await app.evalJs("JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').filter(e => e.pageType === 'board').length");
  await clickDoor(app, 'plan');
  await sleep(500);
  const planAfter = await app.evalJs(`({
    hash: location.hash,
    boards: JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').filter(e => e.pageType === 'board').length,
    onBoard: !!document.querySelector('.board-canvas, .board-projection'),
  })`);
  ok('S2: the Plan door is the Page→Plan on-ramp, offered at birth — one press births the paired plan board (never before, never automatically) and travels to it',
    planBefore === 0 && planAfter.boards === 1 && planAfter.onBoard === true && planAfter.hash !== '#/page/bg1-plan-door',
    JSON.stringify({ planBefore, ...planAfter }));

  // ==========================================================================
  // S3 — one grammar: one component, one vanish rule, two surfaces.
  // ==========================================================================
  await freshPage(app, 'bg1-grammar-page', '', LAPTOP_W, 900);
  const pageStyle = await app.evalJs(`(() => { const cs = getComputedStyle(document.querySelector('.wz-beginning'));
    return { font: cs.fontFamily, size: cs.fontSize, color: cs.color, opacity: cs.opacity }; })()`);
  await freshBoard(app, 'bg1-grammar-board', [], LAPTOP_W, 900);
  const boardStyle = await app.evalJs(`(() => { const cs = getComputedStyle(document.querySelector('.wz-beginning'));
    return { font: cs.fontFamily, size: cs.fontSize, color: cs.color, opacity: cs.opacity }; })()`);
  ok('S3: the board row and the page row ARE one component — identical computed type, size, color and resting weight on both surfaces',
    JSON.stringify(pageStyle) === JSON.stringify(boardStyle), JSON.stringify({ pageStyle, boardStyle }));

  // ==========================================================================
  // The 1366×768 leg — both rows' geometry at the small-laptop floor.
  // ==========================================================================
  await freshBoard(app, 'bg1-leg-board', [], LEG_W, LEG_H);
  const boardLeg = await app.evalJs(`(() => {
    const row = document.querySelector('.wz-beginnings');
    const r = row.getBoundingClientRect();
    const tops = [...document.querySelectorAll('.wz-beginning')].map(b => Math.round(b.getBoundingClientRect().top));
    return { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom), oneLine: new Set(tops).size === 1, vw: innerWidth, vh: innerHeight };
  })()`);
  ok('1366x768 leg: the board row fits the small-laptop viewport whole and still sits on ONE line — four doors, no wrap, nothing clipped',
    boardLeg.left >= 0 && boardLeg.right <= boardLeg.vw && boardLeg.top >= 0 && boardLeg.bottom <= boardLeg.vh && boardLeg.oneLine === true,
    JSON.stringify(boardLeg));

  // BG2 (item 73, SV19) — the page row's PLACEMENT check is PARKED at the foot
  // of this file: Nick's own word supersedes the committee's "beside the
  // cursor," and the row is now centered on the sheet. The claim that survives
  // untouched is the one immediately below (types-immediately at the leg), which
  // BG2's brief requires to keep passing. Live successor: bg2.mjs.
  await freshPage(app, 'bg1-leg-page', '', LEG_W, LEG_H);

  // And the leg's own version of the load-bearing claim: still typeable at once.
  await app.typeKeys('At the leg too');
  await sleep(300);
  const legTyping = await app.evalJs(`({ text: (document.querySelector('.forward-only-editor')?.innerText || '').trim(), row: !!document.querySelector('.wz-beginnings') })`);
  ok('1366x768 leg: the writer still types immediately without touching the row, and the row still goes when they do',
    legTyping.text === 'At the leg too' && legTyping.row === false, JSON.stringify(legTyping));

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ===========
// BG1 parked nothing of its OWN at build time. The one assertion it falsified
// lived in another file and is parked there, with this file named successor:
// fx6.mjs's S2 (c) empty-board COPY check.
//
// BG2 — the Beginnings, Seen (docs/wrizo-alpha/p2-wave.md §BG2, item 73;
// authority SV19/SV20, Nick's walk of the deployed P1 tree) is this file's
// first tenant. Nick could not see what BG1 shipped — "much too small," "can
// barely see" — and read the page's row as a footnote rather than a set of
// modes. Two of this file's checks are falsified by the fix, quoted verbatim
// below (SUPERSEDED) and re-asserted against their new truths. Live successors
// for the whole revised grammar: bg2.mjs. Everything else in this file is
// untouched and still runs live — the door sets, the system-board absence, the
// vanish rule, the Sprout rails, and (BG2's own requirement) the
// types-immediately DoD check, which must keep passing at the new placement.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  const pok = (name, pass, detail = '') => parkedChecks.push({ name, pass, detail });
  await withHarness(async (app) => {
    // ORIGINAL (BG1 S1): ok('S1: the doors are painted in the house olive
    // (--accent-rest #96a05a), quietly (resting opacity below full) — olive
    // means "this is a door"',
    //   doorPaint.color === 'rgb(150, 160, 90)' && parseFloat(doorPaint.
    //   opacity) < 1, JSON.stringify(doorPaint));
    // BG2 S1 — the doors are STILL olive and still mean "this is a door"; the
    // value steps down to `--accent-door` (#4F5730) so it carries against cream,
    // and the resting opacity is retired outright (a translucent door makes the
    // measured colour differ from the seen one, which would make BG2's own
    // contrast assertion a lie). Re-asserted against both new truths.
    await freshBoard(app, 'bg1-parked-paint', [], LAPTOP_W, 900);
    const paintNow = await app.evalJs(`(() => {
      const cs = getComputedStyle(document.querySelector('.wz-beginning'));
      const doc = getComputedStyle(document.documentElement);
      return { color: cs.color, opacity: cs.opacity,
        doorToken: doc.getPropertyValue('--accent-door').trim(),
        oldToken: doc.getPropertyValue('--accent-rest').trim() };
    })()`);
    pok('PARKED (was "S1: the doors are painted in the house olive (--accent-rest #96a05a), quietly (resting opacity below full) — olive means \\"this is a door\\"") — BG2 S1 steps the SAME olive down in value to --accent-door (#4F5730) for legibility on cream and retires the resting opacity: the door is quiet by value now, not by fade; live successor: bg2.mjs',
      paintNow.color === 'rgb(79, 87, 48)' && parseFloat(paintNow.opacity) === 1 &&
      paintNow.doorToken === '#4F5730' && paintNow.oldToken === '#96a05a',
      JSON.stringify(paintNow));

    // ORIGINAL (BG1, the 1366x768 leg): ok('1366x768 leg: the page row sits
    // BELOW the first line (the caret\'s own line stays clear of furniture)
    // and fits the viewport whole',
    //   pageLeg.rowTop >= pageLeg.firstLineBottom - 2 && pageLeg.rowLeft >= 0 &&
    //   pageLeg.rowRight <= pageLeg.vw && pageLeg.rowBottom <= pageLeg.vh,
    //   JSON.stringify(pageLeg));
    // BG2 S2 (SV19) — Nick's own word supersedes the committee's "furniture
    // beside the cursor": the row is centered on the sheet and is no longer
    // positioned relative to the first line at all, so the original's geometry
    // (rowTop vs firstLineBottom) is not merely false, it is meaningless now.
    // The SUBJECT survives whole — "the caret's own line stays clear of
    // furniture" — and is re-asserted at the granularity that always carried
    // it: not the row's full-width CONTAINER box (which spans the sheet and
    // does overlap the first line's band by a few px at this leg, harmlessly,
    // being pointer-events:none), but the DOORS, and the hit test at the caret
    // itself. Measured here: the caret sits at x~416, the leftmost door begins
    // at x~521, and elementFromPoint at the caret returns the editor.
    await freshPage(app, 'bg1-parked-leg', '', LEG_W, LEG_H);
    const legNow = await app.evalJs(`(() => {
      const row = document.querySelector('.wz-beginnings');
      const ed = document.querySelector('.forward-only-editor');
      const r = row.getBoundingClientRect(), e = ed.getBoundingClientRect();
      const lineH = parseFloat(getComputedStyle(ed).lineHeight) || 29;
      const caret = { x: e.left + 2, yTop: e.top, yBot: e.top + lineH };
      const covering = [...document.querySelectorAll('.wz-beginning')].filter((b) => {
        const d = b.getBoundingClientRect();
        return d.left <= caret.x && d.right >= caret.x && d.top <= caret.yBot && d.bottom >= caret.yTop;
      }).length;
      const atCaret = document.elementFromPoint(caret.x + 1, caret.yTop + 8);
      return { doorsCoveringCaret: covering, atCaret: (atCaret && atCaret.className || '').toString(),
        rowLeft: Math.round(r.left), rowRight: Math.round(r.right), rowTop: Math.round(r.top),
        rowBottom: Math.round(r.bottom), vw: innerWidth, vh: innerHeight };
    })()`);
    pok('PARKED (was "1366x768 leg: the page row sits BELOW the first line (the caret\'s own line stays clear of furniture) and fits the viewport whole") — BG2 S2 centers the row on the sheet per SV19, so first-line-relative geometry no longer applies; the CLAIM survives measured against the doors and the hit test: no door covers the caret, the caret point still hit-tests to the editor, and the row still fits the viewport whole; live successor: bg2.mjs',
      legNow.doorsCoveringCaret === 0 && legNow.atCaret.includes('forward-only-editor') &&
      legNow.rowLeft >= 0 && legNow.rowRight <= legNow.vw &&
      legNow.rowTop >= 0 && legNow.rowBottom <= legNow.vh,
      JSON.stringify(legNow));
    return parkedChecks;
  });
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  const parkedPass = parkedChecks.every((c) => c.pass);
  // eslint-disable-next-line no-console
  console.log(parkedPass
    ? `\nBG1 PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed, all retired-check successors green (BG2 is this file's first tenant; live successors in bg2.mjs).`
    : `\nBG1 PARKED: FAIL — ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nBG1 VERIFY: PASS (${checks.length} checks)` : `\nBG1 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
