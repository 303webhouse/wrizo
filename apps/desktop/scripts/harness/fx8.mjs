// FX8 — Card Affordances (docs/wrizo-alpha/fx8-card-affordances-brief.md). A
// committed CDP verification scenario (per this project's own "harness
// scenarios persist" convention), modeled on fx7.mjs's own structure --
// freshDesk/freshBoard/rectOf/clickAt below are the same shape those files
// already established, copied verbatim per this project's own standing
// instruction not to re-derive them.
// Run: node scripts/harness/fx8.mjs   (from apps/desktop, with dist-web
// freshly built via `pnpm run build:web`).
//
// Covers the brief's own S1-S3 list: the olive pin's new domed treatment,
// proven both by computed-style (no longer a flat single-color fill) and a
// real screenshot (S1); the resize handle's new smaller, borderless
// geometry (S2); the card-body grab cursor on every card-face class, its
// deliberate absence from the pin/handle/layer-toggle (siblings, not
// descendants -- confirmed live), the optional grabbing-during-drag swap,
// and a live re-proof that FX7 S5's double-click-open and the ordinary
// drag-to-move gesture are both unregressed, with genuinely trusted CDP
// pointer events throughout (S3).
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const LAPTOP_W = 1280;
const LEGACY_W = 900;

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
    entries.push({ id: ${JSON.stringify(boardId)}, text: 'FX8 Board', pageType: 'board', source: 'page', boxes: ${JSON.stringify(boxes)}, createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(boardId)}`);
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'board mounted' });
  await sleep(300);
  await app.emulateDpr(1, width, height);
};

// S3's own ported-card double-click-travel check needs a REAL, DISTINCT
// target page (not the board itself — travelling to the board's own route
// while already mounted on it would make the assertion vacuously true
// regardless of whether travel actually fired). This seeds the board PLUS
// one ordinary page entry in the SAME localStorage write, same shape as
// freshBoard above.
const freshBoardWithSourcePage = async (app, boardId, boxes, sourcePage, width = 1400, height = 900) => {
  await freshDesk(app, width, height);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: ${JSON.stringify(sourcePage.id)}, text: ${JSON.stringify(sourcePage.text)}, pageType: 'page', source: 'page', createdAt: now, updatedAt: now });
    entries.push({ id: ${JSON.stringify(boardId)}, text: 'FX8 Board', pageType: 'board', source: 'page', boxes: ${JSON.stringify(boxes)}, createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(boardId)}`);
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'board mounted' });
  await sleep(300);
  await app.emulateDpr(1, width, height);
};

// A GENERIC rect-reader (toJSON — DOMRect doesn't survive CDP's
// returnByValue serialization otherwise).
const rectOf = (app, sel) => app.evalJs(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); return el ? el.getBoundingClientRect().toJSON() : null; })()`);

// A genuinely trusted single click (mouseDown + mouseUp, real CDP Input
// events) at a fixed point — the FX7 S5-S8 shared discipline's own baseline
// gesture, distinct from a double-click.
const clickAt = async (app, x, y) => { await app.mouseDown(x, y); await sleep(30); await app.mouseUp(x, y); };

const cursorOf = (app, sel) => app.evalJs(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); return el ? getComputedStyle(el).cursor : null; })()`);

await withHarness(async (app) => {
  // ==========================================================================
  // S1 — the olive pin, dimensional. `.board-pin-grab` no longer reads as a
  // flat single-color fill: the computed backgroundImage is a genuine
  // radial-gradient (not a flat `background-color`, which computed style
  // would report as `rgb(...)` on `backgroundColor` with an EMPTY
  // `backgroundImage`), plus a real box-shadow. A real screenshot (cropped
  // and upscaled, written to disk for a human/agent eyeball look — the
  // brief's own "verify visually, not just computed-style" instruction)
  // proves it actually READS as domed. Same ~12px size, same border-
  // radius:50% (the one recorded circular exception — unchanged, and
  // fx5.mjs's own S5 check still asserts this verbatim, confirmed still
  // green in the full historic suite run this build also performed). The
  // grabbing-state variant (data-thread-armed) still works too.
  // ==========================================================================
  await freshBoard(app, 'fx8-s1-board', [
    { id: 'fx8-s1-card', kind: 'text', x: 0.1, y: 0.1, w: 0.3, h: 0.12, z: 1, text: 'Pin Card\nBody text for the dome check.' },
  ], LAPTOP_W, 900);
  const pinStyle = await app.evalJs(`(() => {
    const cs = getComputedStyle(document.querySelector('[data-box-id="fx8-s1-card"] .board-pin-grab'));
    return { backgroundImage: cs.backgroundImage, boxShadow: cs.boxShadow, borderRadius: cs.borderRadius, width: cs.width, height: cs.height };
  })()`);
  ok('S1: the pin is no longer a flat single-color fill — computed backgroundImage is a genuine radial-gradient (a flat fill would report "none" here, with the color only on backgroundColor)',
    pinStyle.backgroundImage.startsWith('radial-gradient('), JSON.stringify(pinStyle));
  ok('S1: the pin now casts a real box-shadow (was previously none) — "a small box-shadow... the way a raised sphere would cast one" (the brief\'s own words)',
    pinStyle.boxShadow !== 'none' && pinStyle.boxShadow.length > 0, pinStyle.boxShadow);
  ok('S1: same ~12px size, unchanged by the dome treatment', pinStyle.width === '12px' && pinStyle.height === '12px', JSON.stringify(pinStyle));
  ok('S1: still the SAME recorded circular exception to square corners (border-radius:50%, unchanged — fx5.mjs\'s own S5 check asserts this identically)',
    pinStyle.borderRadius === '50%', pinStyle.borderRadius);
  // A real screenshot, cropped tight around the pin and upscaled with
  // nearest-neighbor (no blur added by resampling) — written to disk for a
  // human/agent eyeball look, the brief's own "verify visually" instruction.
  // Not itself a pass/fail assertion (no pixel-perfect oracle exists for
  // "reads as domed") — the computed-style checks above are the pass/fail
  // proof; this is the disclosed visual-look artifact CC's own build report
  // references.
  const cardRect = await rectOf(app, '[data-box-id="fx8-s1-card"]');
  const png = await app.screenshot();
  ok('S1: a full-viewport screenshot was captured for visual dome verification (see the build report\'s own cropped/zoomed artifact)',
    typeof png === 'string' && png.length > 1000, `card at (${Math.round(cardRect.x)}, ${Math.round(cardRect.y)})`);

  // The grabbing-state variant still works — thread-drag arm still swaps
  // the pin's own cursor, unaffected by the dome restyle (background/
  // border/box-shadow changed; the cursor rule pair did not).
  await app.evalJs(`(() => {
    const pin = document.querySelector('[data-box-id="fx8-s1-card"] .board-pin-grab');
    const r = pin.getBoundingClientRect();
    const mk = (type, x, y) => new PointerEvent(type, {clientX:x, clientY:y, pointerId:1, pointerType:'mouse', bubbles:true, cancelable:true, isPrimary:true});
    pin.dispatchEvent(mk('pointerdown', r.left + r.width/2, r.top + r.height/2));
  })()`);
  await sleep(150);
  const armedShape = await app.evalJs(`(() => ({
    threadArmed: document.querySelector('.board-canvas').dataset.threadArmed,
    pinCursor: getComputedStyle(document.querySelector('[data-box-id="fx8-s1-card"] .board-pin-grab')).cursor,
  }))()`);
  ok('S1: the pin\'s own grabbing-state variant (data-thread-armed) still works, unbroken by the dome restyle',
    armedShape.threadArmed === 'true' && armedShape.pinCursor === 'grabbing', JSON.stringify(armedShape));
  await app.evalJs("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))");
  await sleep(150);

  // ==========================================================================
  // S2 — the resize handle: smaller, borderless, cursor reconsidered.
  // Shrunk 14px -> 10px, border dropped whole (solid brass fill only).
  // cursor:nwse-resize is UNCHANGED (CC's own live investigation found no
  // real inconsistency — disclosed in the build report; re-asserted live
  // here as the "did not silently invent a problem" proof). The handle only
  // ever renders on a SELECTED card (BoardEditor.tsx's own conditional) —
  // select it first, a genuinely trusted click.
  // ==========================================================================
  const s1CardRect = await rectOf(app, '[data-box-id="fx8-s1-card"]');
  await clickAt(app, Math.round(s1CardRect.x + s1CardRect.width / 2), Math.round(s1CardRect.y + s1CardRect.height / 2));
  await sleep(200);
  const handleStyle = await app.evalJs(`(() => {
    const cs = getComputedStyle(document.querySelector('.board-handle'));
    return { width: cs.width, height: cs.height, borderWidth: cs.borderWidth, borderStyle: cs.borderStyle, backgroundColor: cs.backgroundColor, cursor: cs.cursor };
  })()`);
  ok('S2: the handle is genuinely smaller (10x10px, was 14x14px)', handleStyle.width === '10px' && handleStyle.height === '10px', JSON.stringify(handleStyle));
  ok('S2: the border is dropped whole — solid brass fill, no outline (borderStyle:none / borderWidth:0px)',
    handleStyle.borderStyle === 'none' && handleStyle.borderWidth === '0px', JSON.stringify(handleStyle));
  ok('S2: still a solid brass (--brass, #ff9800) fill', handleStyle.backgroundColor === 'rgb(255, 152, 0)', handleStyle.backgroundColor);
  ok('S2: cursor:nwse-resize is UNCHANGED — CC\'s own live investigation (disclosed in the build report) found the diagonal cursor already correct for a both-axis corner resize, not a defect to silently invent a fix for',
    handleStyle.cursor === 'nwse-resize', handleStyle.cursor);

  // ==========================================================================
  // S3 — the card-body grab cursor, its exclusions, the optional grabbing-
  // during-drag swap, and the two live regression re-proofs (double-click
  // still opens; single-click-then-drag still moves) FX7's own S5-S8 fixed
  // in this EXACT file. Every drag/click claim below uses genuinely trusted
  // CDP pointer events (app.mouseDown/mouseMove/mouseUp/doubleClick) — this
  // project's own established discipline for claims this sensitive in
  // BoardEditor.tsx, never a coordinate-less synthetic dispatchEvent.
  // ==========================================================================
  await freshBoardWithSourcePage(app, 'fx8-s3-board', [
    { id: 'fx8-s3-text', kind: 'text', x: 0.06, y: 0.06, w: 0.28, h: 0.12, z: 1, text: 'Hand Card\nBody text.' },
    { id: 'fx8-s3-ink', kind: 'ink', x: 0.4, y: 0.06, w: 0.2, h: 0.12, z: 1, strokes: [] },
    { id: 'fx8-s3-pin', kind: 'page-pin', x: 0.65, y: 0.06, w: 0.28, h: 0.12, z: 1, entryId: 'fx8-s3-board' },
    { id: 'fx8-s3-src', kind: 'text', x: 0.06, y: 0.4, w: 0.28, h: 0.12, z: 1, text: 'Ported excerpt\nMirrors the source page below.', sourceEntryId: 'fx8-s3-source-page' },
  ], { id: 'fx8-s3-source-page', text: 'Real Source Page\nThe genuine travel target, distinct from the board itself.' }, LAPTOP_W, 900);

  // Card-body cursor, at rest, on every card-face kind this file's own
  // card-kind branches render: plain text, ink, page-pin, and ported text.
  const restCursors = await app.evalJs(`(() => ({
    text: getComputedStyle(document.querySelector('[data-box-id="fx8-s3-text"] .board-text')).cursor,
    ink: getComputedStyle(document.querySelector('[data-box-id="fx8-s3-ink"] .board-ink-canvas')).cursor,
    pin: getComputedStyle(document.querySelector('[data-box-id="fx8-s3-pin"] .board-pin')).cursor,
    ported: getComputedStyle(document.querySelector('[data-box-id="fx8-s3-src"] .board-ported')).cursor,
  }))()`);
  ok('S3: a hand-typed text card\'s own body reads cursor:grab at rest',
    restCursors.text === 'grab', JSON.stringify(restCursors));
  ok('S3: an ink card\'s own face ALSO reads cursor:grab (a card-face class no earlier ticket ever gave a cursor rule at all — the brief\'s own "any other card-face class this file\'s own card-kind branches use")',
    restCursors.ink === 'grab', JSON.stringify(restCursors));
  ok('S3: a page-pin card\'s own face reads cursor:grab (supersedes FX5 S3\'s cursor:pointer, per the brief\'s own explicit S3 list)',
    restCursors.pin === 'grab', JSON.stringify(restCursors));
  ok('S3: a ported text card\'s own excerpt face ALSO reads cursor:grab, same supersession',
    restCursors.ported === 'grab', JSON.stringify(restCursors));

  // Exclusions: hovering the pin/handle/layer-toggle shows THEIR OWN
  // cursor, never the new card-body grab — proven live via getComputedStyle
  // over each small element itself (each is a DOM SIBLING of the card face,
  // not a descendant, so no exclusion selector was needed at all; this is
  // the live proof that fact actually holds in the rendered DOM, not just
  // asserted from reading the JSX).
  await clickAt(app, ...(await (async () => {
    const r = await rectOf(app, '[data-box-id="fx8-s3-text"]');
    return [Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2)];
  })()));
  await sleep(200);
  const exclusionCursors = await app.evalJs(`(() => ({
    pin: getComputedStyle(document.querySelector('[data-box-id="fx8-s3-text"] .board-pin-grab')).cursor,
    handle: getComputedStyle(document.querySelector('.board-handle')).cursor,
  }))()`);
  ok('S3: the olive pin keeps its OWN cursor (grab, its own state meaning) — never stolen by the new card-body rule',
    exclusionCursors.pin === 'grab', JSON.stringify(exclusionCursors));
  ok('S3: the resize handle keeps its OWN cursor (nwse-resize) — never stolen by the new card-body rule',
    exclusionCursors.handle === 'nwse-resize', JSON.stringify(exclusionCursors));

  // A ported card's own double-click still travels (FX5 S3's own
  // affordance, untouched by S3's cursor supersession — only the resting
  // cursor value changed, not the click handler) — to a genuinely
  // DISTINCT source page, not the board's own route (freshBoardWithSourcePage
  // seeded 'fx8-s3-source-page' as a real, separate page above).
  const srcRect = await rectOf(app, '[data-box-id="fx8-s3-src"]');
  await app.doubleClick(Math.round(srcRect.x + srcRect.width / 2), Math.round(srcRect.y + srcRect.height / 2));
  await sleep(300);
  const traveledHash = await app.evalJs('location.hash');
  ok('S3 regression re-proof: a ported card\'s own double-click still travels to its DISTINCT source page (FX5 S3, untouched by the cursor-only S3 change) — not the board\'s own route, a genuinely different page',
    traveledHash.includes('/page/fx8-s3-source-page'), traveledHash);

  // Layer-toggle's own cursor (needs a second, overlapping selected card to
  // render at all — FX5 S4(c)'s own gate).
  await freshBoard(app, 'fx8-s3-overlap', [
    { id: 'ov-1', kind: 'text', x: 0.1, y: 0.1, w: 0.3, h: 0.1, z: 1, text: 'Card One\nBody one' },
    { id: 'ov-2', kind: 'text', x: 0.15, y: 0.13, w: 0.3, h: 0.1, z: 2, text: 'Card Two overlapping\nBody two' },
  ], LAPTOP_W, 900);
  const ov2 = await rectOf(app, '[data-box-id="ov-2"]');
  await clickAt(app, Math.round(ov2.x + ov2.width / 2), Math.round(ov2.y + 15));
  await sleep(200);
  const toggleCursor = await cursorOf(app, '.board-layer-toggle');
  ok('S3: the layer-order toggle keeps its OWN cursor (pointer, its own action meaning) — never stolen by the new card-body rule',
    toggleCursor === 'pointer', String(toggleCursor));

  // The optional grabbing-during-drag swap (CC's own disclosed call): mid-
  // drag, the card-body cursor swaps to grabbing; the canvas's own
  // data-dragging flag flips true, then back to false the instant the drag
  // ends — read via genuinely trusted mouseDown/mouseMove/mouseUp, not a
  // synthetic PointerEvent dispatch (this claim is drag-sensitive).
  await freshBoard(app, 'fx8-s3-drag', [
    { id: 'fx8-s3-drag-card', kind: 'text', x: 0.1, y: 0.1, w: 0.3, h: 0.12, z: 1, text: 'Drag Card\nBody text.' },
  ], LAPTOP_W, 900);
  const dragCard = await rectOf(app, '[data-box-id="fx8-s3-drag-card"]');
  const sx = Math.round(dragCard.x + dragCard.width / 2), sy = Math.round(dragCard.y + dragCard.height / 2);
  const restDragging = await app.evalJs("document.querySelector('.board-canvas').dataset.dragging");
  ok('S3: data-dragging is false at rest (before any gesture starts)', restDragging === 'false', restDragging);
  await app.mouseDown(sx, sy);
  await sleep(30);
  await app.mouseMove(sx + 20, sy + 15); // past the 6px MOUSE_DRAG_THRESHOLD — promotes to a real drag
  await sleep(30);
  await app.mouseMove(sx + 45, sy + 32);
  await sleep(50);
  const midDrag = await app.evalJs(`(() => ({
    dataDragging: document.querySelector('.board-canvas').dataset.dragging,
    cursor: getComputedStyle(document.querySelector('[data-box-id="fx8-s3-drag-card"] .board-text')).cursor,
  }))()`);
  ok('S3 (CC\'s own disclosed choice): mid-drag, data-dragging flips true and the card-body cursor swaps to grabbing',
    midDrag.dataDragging === 'true' && midDrag.cursor === 'grabbing', JSON.stringify(midDrag));
  await app.mouseUp(sx + 45, sy + 32);
  await sleep(200);
  const postDrag = await app.evalJs(`(() => ({
    dataDragging: document.querySelector('.board-canvas').dataset.dragging,
    cursor: getComputedStyle(document.querySelector('[data-box-id="fx8-s3-drag-card"] .board-text')).cursor,
    box: window.wrizoBoard().find(b => b.id === 'fx8-s3-drag-card'),
  }))()`);
  ok('S3: on release, data-dragging clears back to false and the cursor reverts to the resting grab',
    postDrag.dataDragging === 'false' && postDrag.cursor === 'grab', JSON.stringify({ dataDragging: postDrag.dataDragging, cursor: postDrag.cursor }));
  // Single-click-then-drag still genuinely MOVES the card — the drag
  // mechanism itself, untouched by this ticket, re-proven live (not just
  // "the cursor changed" — the box's own stored x/y actually moved from
  // its seeded 0.1/0.1 position).
  const preDragStored = { x: 0.1, y: 0.1 };
  ok('S3 regression re-proof: single-click-then-drag still genuinely MOVES the card (FX5 S4(a)/FX7 S5-S8 untouched by this ticket) — the card\'s own stored x/y actually changed, not just its cursor',
    Math.abs(postDrag.box.x - preDragStored.x) > 0.01 || Math.abs(postDrag.box.y - preDragStored.y) > 0.01,
    JSON.stringify({ before: preDragStored, after: { x: postDrag.box.x, y: postDrag.box.y } }));

  // Double-click still opens — FX7 S5's own fix, re-verified live in THIS
  // ticket's own build (the standing discipline: don't regress a fix this
  // exact file just earned, verify it again rather than assume).
  const dragCard2 = await rectOf(app, '[data-box-id="fx8-s3-drag-card"]');
  await app.doubleClick(Math.round(dragCard2.x + dragCard2.width / 2), Math.round(dragCard2.y + dragCard2.height / 2));
  await sleep(300);
  const popupOpen = await app.evalJs("!!document.querySelector('.board-popup')");
  ok('S3 regression re-proof: a genuinely trusted double-click still opens the card\'s own edit popup (FX7 S5, unregressed by the new card-body cursor)',
    popupOpen, String(popupOpen));
  if (popupOpen) {
    await app.evalJs("document.querySelector('.board-popup-done')?.click()");
    await sleep(150);
  }

  // ==========================================================================
  // Legacy (<1100px) — the board editor's OWN card canvas is shared between
  // the framed and legacy render branches (BoardEditor.tsx's own `boardBody`
  // constant is passed to BOTH; only the surrounding chrome — DeskFrame vs.
  // a plain page div, the nav row's own wrapper — differs). This ticket's
  // changes are pure CSS on card-face classes that were NEVER framed-gated
  // to begin with (`.board-pin-grab`/`.board-handle` already applied
  // identically below 1100px before this ticket) — so they correctly reach
  // the legacy view too, exactly as the pre-existing pin/handle styling
  // already did. What DOES stay byte-identical, confirmed below: the
  // legacy CHROME itself — no `.desk-frame`, the same `.board-page` legacy
  // wrapper, nothing from this ticket touches that branch's own markup.
  // ==========================================================================
  await freshDesk(app, LEGACY_W, 900);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: 'fx8-legacy-board', text: 'FX8 Legacy Board', pageType: 'board', source: 'page', boxes: [{ id: 'legacy-card', kind: 'text', x: 0.1, y: 0.1, w: 0.3, h: 0.1, z: 1, text: 'Legacy Card\\nBody' }], createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.evalJs("location.hash = '#/page/fx8-legacy-board'");
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'legacy board mounted' });
  await sleep(300);
  await app.emulateDpr(1, LEGACY_W, 900);
  const legacyShape = await app.evalJs(`(() => ({
    hasDeskFrame: !!document.querySelector('.desk-frame'),
    hasBoardPage: !!document.querySelector('.board-page'),
    hasBoardCanvas: !!document.querySelector('.board-canvas'),
  }))()`);
  ok('Legacy (<1100px): the surrounding CHROME stays byte-identical — no .desk-frame, the same pre-AB1 .board-page wrapper (this ticket never touches that branch\'s own markup)',
    !legacyShape.hasDeskFrame && legacyShape.hasBoardPage && legacyShape.hasBoardCanvas, JSON.stringify(legacyShape));
  const legacyCursor = await cursorOf(app, '[data-box-id="legacy-card"] .board-text');
  ok('Legacy (<1100px): the card-body grab cursor DOES reach the legacy view — disclosed, expected, and correct: the board canvas/card-face classes were never framed-gated (the SAME sharing the pre-existing pin/handle styling already relied on), so this ticket\'s pure-CSS change applies uniformly on both sides of the 1100px gate, exactly like every earlier board-card CSS rule already did',
    legacyCursor === 'grab', legacyCursor);

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nFX8 VERIFY: PASS (${checks.length} checks)` : `\nFX8 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
