// BOARD CLICK-TO-CREATE (Fable, Oct 14). A click on EMPTY board space makes a card at that point; a click-drag sizes it first, with a ghost outline following the pointer; on release the card
// pop-up opens; a card made this way and closed while still EMPTY is discarded. The empty board's starters fade out on the first press anywhere on the board.
//
// What an empty-space press did BEFORE (read from BoardEditor.tsx, 2026-10-14) and must still do: the canvas's own pointerdown deselects the selected card (and nothing more - no capture, no
// marquee, no pan, no double-click action); while the card pop-up is open every board gesture stands down; while a thread is armed a press starts a thread-drag.
//
//   S  source pins (browserless half, with mutants): the gate (OPEN projection, ordinary board, press lands ON the canvas itself, primary button), the deselect still there, the discard on close
//   C1 a plain click creates a card whose top-left is AT the press, the ghost shows at the press while it is held, and the pop-up opens on release
//   C2 a click-drag: the ghost follows the pointer and is the size of the rectangle dragged; the card takes that size; the pop-up opens
//   C3 closing the pop-up while the card is still empty DISCARDS it; C4 a card with words in it is kept
//   C5 a press ON a card makes no card (it selects); C6 a press on empty space still deselects
//   C7 the starters: present on an empty board, fading out on the first press anywhere (while the pointer is still down), and a door pressed as that first click still does its act (one card)
//   C8 no creation where it does not belong: STORYBOARD, OUTLINE, a system board
//
// Needs a box turn (withHarness refuses without WS_BOX_TURN). Run: WS_BOX_TURN=<token> node scripts/harness/board-click-create.mjs   (from apps/desktop, dist-web built)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(here, '..', '..', 'src');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const noCR = (t) => t.replace(/\r\n?/g, '\n');
const BOARD = 'bcc-board';

// ---- S: the source pins ---------------------------------------------------------------------------------------------------------------------------------------------------------------
const be = noCR(fs.readFileSync(path.join(SRC, 'components/BoardEditor.tsx'), 'utf8'));
const pins = (text) => ({
  gate: /createAllowedRef\.current = !isSystemBoard && boardMode === 'open';/.test(text),
  press: /if \(!hadSelectedCard && createAllowedRef\.current && target === canvas && \(e\.pointerType !== 'mouse' \|\| e\.button === 0\)\) \{/.test(text),
  deselect: /if \(!boxEl\) \{\n(?:\s*\/\/[^\n]*\n)*\s*const hadSelectedCard = selectedIdRef\.current != null;\n\s*setSelectedId\(null\);/.test(text),
  discard: /if \(freshEmptyIdsRef\.current\.delete\(closingId\)\) \{\n\s*const b = boxesRef\.current\.find\(x => x\.id === closingId\);\n\s*if \(b && b\.kind === 'text' && !\(b\.text \?\? ''\)\.trim\(\)\) \{/.test(text),
  popupOpensOnRelease: /setPopupBoxId\(box\.id\);\n\s*\};\n\n\s*const beginMove/.test(text),
  cancelClean: /if \(phase === 'creating'\) \{ finishCreate\(false\); return; \}/.test(text),
});
{
  const p = pins(be);
  ok('S1: the gesture is gated to the OPEN projection on an ordinary board, begins only when the press lands ON the canvas itself (not a door, a hairline, the resize handle) with the primary button, and the old deselect is still the first thing an empty press does',
    p.gate && p.press && p.deselect, JSON.stringify(p));
  ok('S2: closing the pop-up discards a card this gesture made ONLY if it is still empty text; a pointercancel (a touch drag turning into a scroll) cancels the card cleanly; release opens the pop-up', p.discard && p.cancelClean && p.popupOpensOnRelease, JSON.stringify(p));
  const m1 = be.replace("target === canvas && ", '');
  const m2 = be.replace("&& !(b.text ?? '').trim()", '');
  const m3 = be.replace("createAllowedRef.current = !isSystemBoard && boardMode === 'open';", 'createAllowedRef.current = !isSystemBoard;');
  const m4 = be.replace('if (!hadSelectedCard && createAllowedRef.current', 'if (createAllowedRef.current');
  ok('S (mutants): dropping "the press landed on the canvas itself", dropping the "still empty" test, allowing STORYBOARD/OUTLINE, or dropping "nothing was selected" each turn a pin RED (each mutation landed)',
    m1 !== be && !pins(m1).press && m2 !== be && !pins(m2).discard && m3 !== be && !pins(m3).gate && m4 !== be && !pins(m4).press, '');
}

// ---- S3: the approved look (Nick, Oct 14): the board's starters are a thin SQUARE outline at about 40% opacity, lifted on hover/focus; the ghost is a hairline square outline that never takes the pointer ----
{
  const css = noCR(fs.readFileSync(path.join(SRC, 'index.css'), 'utf8'));
  const look = (c) => ({
    starter: /\.wz-beginnings\[data-beginnings='board'\] \.wz-beginning\{\n\s*border:1px solid currentColor; border-radius:0; opacity:\.4;/.test(c),
    lift: /\.wz-beginnings\[data-beginnings='board'\] \.wz-beginning:focus-visible\{ opacity:\.9; \}/.test(c),
    faded: /\.wz-beginnings\.wz-beginnings--faded\{ opacity:0; visibility:hidden; transition:opacity \.35s ease, visibility 0s linear \.35s; \}/.test(c),
    ghost: /\.board-create-ghost\{[^}]*border:1px solid[^}]*background:none;[^}]*pointer-events:none;[^}]*border-radius:0;/.test(c),
    boardOnly: !/\n\.wz-beginning\{[^}]*opacity:\.4/.test(c),
  });
  const l = look(css);
  ok('S3: the board\'s starters are a thin square outline at about 40% opacity (lifted on hover and keyboard focus), they fade away with opacity first and visibility after, the ghost is a square hairline outline that never takes the pointer - and the look is scoped to the BOARD row (the page row and STORYBOARD/OUTLINE keep theirs)',
    Object.values(l).every(Boolean), JSON.stringify(l));
  const mut = css.replace('border:1px solid currentColor; border-radius:0; opacity:.4;', 'border:1px solid currentColor; border-radius:6px; opacity:.4;');
  ok('S3 (mutant): a rounded starter turns the pin RED (the mutation landed)', mut !== css && !look(mut).starter, '');
}

const seedBoard = async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: BOARD, text: 'Board', pageType: 'board', boxes: [], createdAt: new Date().toISOString(), origin: null, source: null })})`);
  await sleep(450);
  await app.evalJs(`location.hash = '#/page/${BOARD}'`);
  const there = await waitSoft(app, "!!document.querySelector('.board-canvas')", { label: 'the board', timeout: 9000 });
  await sleep(900);
  return there;
};
const cards = (app) => app.evalJs("document.querySelectorAll('.board-box[data-kind=\"text\"]').length");
const popupOpen = (app) => app.evalJs("!!document.querySelector('.board-popup')");
// a point on the canvas where the pointer would hit the canvas ITSELF (no card, door or line under it), at least `room` px from the right/bottom of the visible canvas
const emptyPoint = (app, room = 300) => app.evalJs(`(() => { const c = document.querySelector('.board-canvas'); const r = c.getBoundingClientRect();
  for (let y = Math.max(r.top, 0) + 50; y < Math.min(r.bottom, window.innerHeight - ${room > 150 ? 150 : 40}); y += 30) for (let x = r.left + 50; x < r.right - ${room}; x += 30) {
    if (document.elementFromPoint(x, y) === c) return { x: Math.round(x), y: Math.round(y) }; }
  return null; })()`);
const ghost = (app) => app.evalJs(`(() => { const g = document.querySelector('.board-create-ghost'); if (!g) return null; const cs = getComputedStyle(g); const r = g.getBoundingClientRect();
  return { display: cs.display, left: Math.round(r.left), top: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) }; })()`);
const firstCard = (app) => app.evalJs(`(() => { const e = document.querySelector('.board-box[data-kind="text"]'); if (!e) return null; const r = e.getBoundingClientRect(); return { left: Math.round(r.left), top: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height), id: e.dataset.boxId }; })()`);
const near = (a, b, tol = 4) => typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) <= tol;

await withHarness(async (app) => {
  // ===== C1: a plain click =========================================================================================================================================================
  if (!(await seedBoard(app))) { ok('fixture: the empty board opened', false); return; }
  const starters0 = await app.evalJs("!!document.querySelector('.wz-beginnings[data-beginnings=\"board\"]')");
  ok('fixture: an empty board, with its starters, and no card', starters0 === true && (await cards(app)) === 0, String(starters0));
  const p = await emptyPoint(app);
  if (!p) { ok('fixture: a point on the empty canvas exists', false); return; }
  const canvasTop0 = await app.evalJs("Math.round(document.querySelector('.board-canvas').getBoundingClientRect().top * 10) / 10");
  await app.mouseMove(p.x, p.y); await sleep(80);
  await app.mouseDown(p.x, p.y); await sleep(120);
  const gHeld = await ghost(app);
  ok('C1: while the press is HELD the ghost outline is on the board at the press point (its top-left at the pointer), not yet a card', !!gHeld && gHeld.display === 'block' && near(gHeld.left, p.x) && near(gHeld.top, p.y) && (await cards(app)) === 0, JSON.stringify({ p, gHeld }));
  await app.mouseUp(p.x, p.y);
  await waitSoft(app, "!!document.querySelector('.board-popup')", { label: 'popup', timeout: 4000 });
  const c1 = await firstCard(app);
  const canvasTopAfterCreate = await app.evalJs("Math.round(document.querySelector('.board-canvas').getBoundingClientRect().top * 10) / 10");
  ok('C9: and creating (which selects) the new card does not move the canvas either - so the card lands where the pointer was', canvasTop0 != null && canvasTop0 === canvasTopAfterCreate, JSON.stringify({ canvasTop0, canvasTopAfterCreate }));
  ok('C1: on release a card exists with its top-left AT the press point, and its pop-up is open AT ONCE - as if it had been double-clicked (Nick\'s correction: a plain click opens the pop-up too); the ghost is gone', (await cards(app)) === 1 && !!c1 && near(c1.left, p.x) && near(c1.top, p.y) && (await popupOpen(app)) && ((await ghost(app)) || {}).display === 'none', JSON.stringify({ p, c1 }));

  // ===== C3: closed while still empty -> discarded; C4: with words -> kept =======================================================================================================
  await app.key('Escape'); await sleep(500);
  ok('C3: closing the pop-up while the new card is STILL EMPTY discards it (no card is left)', (await cards(app)) === 0 && !(await popupOpen(app)), JSON.stringify({ cards: await cards(app) }));
  await app.mouseMove(p.x, p.y); await app.mouseDown(p.x, p.y); await sleep(60); await app.mouseUp(p.x, p.y);
  await waitSoft(app, "!!document.querySelector('.board-popup-editor')", { label: 'popup editor', timeout: 4000 });
  await app.evalJs("document.querySelector('.board-popup-editor')?.focus()"); await sleep(150);
  await app.typeKeys('first words'); await sleep(400);
  await app.key('Escape'); await sleep(600);
  const kept = await app.evalJs("(() => { const e = document.querySelector('.board-box[data-kind=\"text\"]'); return e ? e.textContent : null; })()");
  ok('C4: a card that has words in it when its pop-up closes is KEPT', (await cards(app)) === 1 && !!kept && kept.includes('first words'), JSON.stringify({ kept }));

  // ===== C5 / C6: a press ON a card makes none; a press on empty still deselects ==================================================================================================
  const card = await firstCard(app);
  const canvasTopBeforeSelect = await app.evalJs("Math.round(document.querySelector('.board-canvas').getBoundingClientRect().top * 10) / 10");
  await app.mouseMove(card.left + card.width / 2, card.top + card.height / 2); await app.mouseDown(card.left + card.width / 2, card.top + card.height / 2); await sleep(60); await app.mouseUp(card.left + card.width / 2, card.top + card.height / 2); await sleep(300);
  const selectedAfterCardPress = await app.evalJs("document.querySelector('.board-box[data-kind=\"text\"]')?.getAttribute('data-selected')");
  const canvasTopAfterSelect = await app.evalJs("Math.round(document.querySelector('.board-canvas').getBoundingClientRect().top * 10) / 10");
  ok('C9: SELECTING a card never moves the canvas (the selected-card row is an overlay that adds no height) - the canvas top is the same before and after, for an EXISTING card', canvasTopBeforeSelect != null && canvasTopBeforeSelect === canvasTopAfterSelect, JSON.stringify({ canvasTopBeforeSelect, canvasTopAfterSelect }));
  ok('C5: a press ON a card selects it and makes NO new card', (await cards(app)) === 1 && selectedAfterCardPress === 'true', JSON.stringify({ cards: await cards(app), selectedAfterCardPress }));
  // THE RULING (Fable, Oct 14): with a card selected, the FIRST empty-space click only deselects and creates nothing; the next one (nothing selected) is the one that creates.
  const q = await emptyPoint(app);
  await app.mouseMove(q.x, q.y); await app.mouseDown(q.x, q.y); await sleep(60);
  const selectedDuring = await app.evalJs("document.querySelector('.board-box[data-kind=\"text\"]')?.getAttribute('data-selected')");
  const ghostWhileDeselecting = await ghost(app);
  await app.mouseUp(q.x, q.y); await sleep(600);
  ok('C6: with a card SELECTED, the first empty-space click only DESELECTS it - no ghost, no new card, no pop-up (the old deselect, kept)',
    selectedDuring === 'false' && (await cards(app)) === 1 && !(await popupOpen(app)) && (!ghostWhileDeselecting || ghostWhileDeselecting.display === 'none'), JSON.stringify({ selectedDuring, cards: await cards(app), ghostWhileDeselecting }));
  await app.mouseMove(q.x, q.y); await app.mouseDown(q.x, q.y); await sleep(60); await app.mouseUp(q.x, q.y);
  await waitSoft(app, "!!document.querySelector('.board-popup')", { timeout: 3000 });
  ok('C6: and the NEXT empty-space click, with nothing selected, creates the card and opens its pop-up (the empty close below then discards it)', (await cards(app)) === 2 && (await popupOpen(app)), JSON.stringify({ cards: await cards(app) }));
  await app.key('Escape'); await sleep(500);
  ok('C6: closed empty, that new card is discarded; the first card is untouched', (await cards(app)) === 1, JSON.stringify({ cards: await cards(app) }));

  // ===== C2: a click-drag ==========================================================================================================================================================
  await seedBoard(app);
  const d = await emptyPoint(app, 420);
  await app.mouseMove(d.x, d.y); await app.mouseDown(d.x, d.y); await sleep(80);
  const DX = 240, DY = 120;
  for (let i = 1; i <= 8; i += 1) { await app.mouseMove(d.x + (DX * i) / 8, d.y + (DY * i) / 8); await sleep(25); }
  const gDrag = await ghost(app);
  ok('C2: during a click-drag the ghost outline FOLLOWS the pointer - anchored at the press, sized to the rectangle dragged so far (about 240 x 120)', !!gDrag && gDrag.display === 'block' && near(gDrag.left, d.x) && near(gDrag.top, d.y) && near(gDrag.width, DX, 6) && near(gDrag.height, DY, 6), JSON.stringify({ d, gDrag }));
  await app.mouseUp(d.x + DX, d.y + DY);
  await waitSoft(app, "!!document.querySelector('.board-popup')", { label: 'popup', timeout: 4000 });
  const cd = await firstCard(app);
  ok('C2: on release the card has the DRAGGED size and sits where the drag began, and its pop-up is open', (await cards(app)) === 1 && !!cd && near(cd.left, d.x) && near(cd.top, d.y) && near(cd.width, DX, 6) && cd.height >= DY - 6 && (await popupOpen(app)), JSON.stringify({ d, cd }));
  await app.key('Escape'); await sleep(500);

  // ===== C7: the starters ==========================================================================================================================================================
  await seedBoard(app);
  const s0 = await app.evalJs("(() => { const e = document.querySelector('.wz-beginnings[data-beginnings=\"board\"]'); return e ? { opacity: getComputedStyle(e).opacity, visibility: getComputedStyle(e).visibility } : null; })()");
  const door0 = await app.evalJs("(() => { const b = document.querySelector('.wz-beginnings[data-beginnings=\"board\"] .wz-beginning'); if (!b) return null; const cs = getComputedStyle(b); return { opacity: cs.opacity, border: cs.borderTopWidth + ' ' + cs.borderTopStyle, radius: cs.borderTopLeftRadius }; })()");
  ok('C7b: at rest each starter is a thin SQUARE outline at about 40% opacity (1px solid, no radius, opacity 0.4)', !!door0 && door0.opacity === '0.4' && door0.border === '1px solid' && door0.radius === '0px', JSON.stringify(door0));
  const sp = await emptyPoint(app);
  await app.mouseMove(sp.x, sp.y); await app.mouseDown(sp.x, sp.y); await sleep(700);   // HELD: the fade is about the first PRESS, not the release
  const s1 = await app.evalJs("(() => { const e = document.querySelector('.wz-beginnings[data-beginnings=\"board\"]'); return e ? { opacity: getComputedStyle(e).opacity, visibility: getComputedStyle(e).visibility, faded: e.dataset.faded } : null; })()");
  await app.mouseUp(sp.x, sp.y); await waitSoft(app, "!!document.querySelector('.board-popup')", { timeout: 3000 }); await app.key('Escape'); await sleep(400);
  ok('C7: the empty board\'s starters are there at first (opaque, visible) and FADE OUT on the first press anywhere on the board (faded, opacity 0, no longer visible - while the pointer is still down)', !!s0 && s0.opacity === '1' && s0.visibility === 'visible' && !!s1 && s1.faded === 'true' && s1.opacity === '0' && s1.visibility === 'hidden', JSON.stringify({ s0, s1 }));
  await seedBoard(app);
  const door = await app.evalJs("(() => { const b = document.querySelector('.wz-beginning[data-beginning=\"newCard\"]'); if (!b) return null; const r = b.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()");
  if (!door) ok('C7: the New card starter exists', false);
  else {
    await app.mouseMove(door.x, door.y); await app.mouseDown(door.x, door.y); await sleep(60); await app.mouseUp(door.x, door.y);
    await waitSoft(app, "!!document.querySelector('.board-popup')", { timeout: 4000 });
    ok('C7: a starter pressed AS the first click still does its act - exactly ONE card, its pop-up open (the fade does not eat the click, and the press made no card of its own)', (await cards(app)) === 1 && (await popupOpen(app)), JSON.stringify({ cards: await cards(app) }));
    await app.key('Escape'); await sleep(300);
  }

  // ===== C8: where it does not belong ================================================================================================================================================
  for (const mode of ['storyboard', 'outline']) {
    await seedBoard(app);
    await app.evalJs(`document.querySelector('[data-board-mode-tab="${mode}"]')?.click()`); await sleep(700);
    const clickAt = await app.evalJs("(() => { const r = (document.querySelector('.board-canvas-wrap') || document.body).getBoundingClientRect(); return { x: Math.round(r.left + 120), y: Math.round(r.top + 120) }; })()");
    await app.mouseMove(clickAt.x, clickAt.y); await app.mouseDown(clickAt.x, clickAt.y); await sleep(60); await app.mouseUp(clickAt.x, clickAt.y); await sleep(500);
    ok(`C8: in ${mode.toUpperCase()} a click on empty space makes no card and opens no pop-up (those projections have their own card doors)`, (await cards(app)) === 0 && !(await popupOpen(app)), JSON.stringify({ cards: await cards(app) }));
  }
  {
    await app.emulateDpr(1, 1400, 900);
    await app.goto('/');
    await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50');");
    await app.reload(); await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
    await waitSoft(app, "!document.querySelector('.wz-splash')", { timeout: 14000 });
    await app.evalJs("location.hash = '#/journal'");
    const sys = await waitSoft(app, "!!document.querySelector('.board-canvas')", { label: 'the Journal board', timeout: 9000 });
    await sleep(900);
    const sp2 = sys ? await emptyPoint(app) : null;
    if (!sp2) ok('C8: a system board (Journal) with an empty point on its canvas', false, String(sys));
    else {
      await app.mouseMove(sp2.x, sp2.y); await app.mouseDown(sp2.x, sp2.y); await sleep(60); await app.mouseUp(sp2.x, sp2.y); await sleep(500);
      ok('C8: on a SYSTEM board (its cards are derived) a click on empty space makes no card and opens no pop-up', (await cards(app)) === 0 && !(await popupOpen(app)), JSON.stringify({ cards: await cards(app) }));
    }
  }
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const failed = checks.filter((c) => !c.pass);
// eslint-disable-next-line no-console
console.log(failed.length === 0 ? `\nBOARD-CLICK-CREATE VERIFY: PASS (${checks.length} checks)` : `\nBOARD-CLICK-CREATE VERIFY: FAIL - ${failed.length}/${checks.length}\n` + failed.map((c) => '  FAIL ' + c.name + ' | ' + String(c.detail).slice(0, 240)).join('\n'));
process.exit(failed.length === 0 ? 0 : 1);
