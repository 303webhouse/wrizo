// CONNECTOR-A (Fable, Oct 15; Nick approved the connector mockup v6, docs/mockups/connector/index.html on cursor/connector @ 3b437b20). The green tack is gone; a card is connected from its CORNER SQUARE.
//
//   ENTER   double-click the selected card's corner square (the pointer unmoved between the two presses) or right-click it; the square morphs to a 10px circle. A resize is still a resize.
//   ARM     a brass arm from that circle to the pointer; over another card it snaps to THAT card's circle - open = not linked, solid = linked.
//   COMMIT  release on a card TOGGLES the link (a connection box in the board's stored boxes - NO schema); a brief flash; then the lines hide.
//   LINES   shown ONLY in connection mode, only this card's own same-board links, clipped to the board; a click selects one, Delete removes it. Esc cancels; a release on empty board after a drag cancels.
//   GONE    the green tack, the pin gesture, the board drawer's "Show grafts" toggle.
//
//   S  source pins (browserless half, with mutants)
//   C1 at rest: nothing drawn between linked cards, no tack, the square is a square, no card circle shows
//   C2 the tack is gone (DOM + CSS)                         C3 a real double-click on the square enters the mode: circle morph, no popup, the page does not move
//   C4 lines: only THIS card's links, thin brass, corner to corner; the linked peer's circle is solid, an unlinked card's is hidden
//   C5 the arm over an OPEN card snaps to its corner and its circle is open; over empty board it follows the pointer           C6 over a LINKED card its circle is solid and the origin circle goes solid
//   C7 a release on a card LINKS (one connection box, the old shape), the mode ends, the flash shows the line then it all hides   C8 a release on a linked card UNLINKS (the toggle)
//   C9 right-click on the square: held-drag enters the mode, links on release over a card, and the browser's context menu is suppressed ONLY on the square (and the beat after a right-drag)
//   C10 Esc cancels      C11 a release on empty board after a drag cancels; a click on empty board while latched cancels
//   C12 click a line selects it, Delete removes it (the mode stays), a Delete with nothing selected removes nothing
//   C13 the resize square still resizes, and a lone click on it enters nothing; a slow second click is not a double-click
//   C14 the connection box shape is unchanged (no new field), and a link made by the gesture survives a reload
//   C15 lines are clipped to the board canvas (the canvas wrap clips; the svg lives inside it)
//   C16 "Show grafts" is gone from the board drawer and the card footers are simply on
//
// The REAL input is trusted CDP mouse events (a double-click is two press/release pairs at one spot; a right-click is button 'right'). Seeding goes through the app's own seams (window.wrizoCreateJournalPage).
// Needs a box turn (withHarness refuses without WS_BOX_TURN). Run: WS_BOX_TURN=<token> node scripts/harness/connector-a.mjs   (from apps/desktop, dist-web built)
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
// the pins that say a thing is GONE read live code, not the history comments that name it
const live = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');

// ---- S: the source pins ---------------------------------------------------------------------------------------------------------------------------------------------------------------
const be = noCR(fs.readFileSync(path.join(SRC, 'components/BoardEditor.tsx'), 'utf8'));
const css = noCR(fs.readFileSync(path.join(SRC, 'index.css'), 'utf8'));
const sliver = noCR(fs.readFileSync(path.join(SRC, 'components/Sliver.tsx'), 'utf8'));
const pins = (text) => ({
  noTack: !/board-pin-grab|armThreadDrag|'threadDrag'|data-thread-source/.test(live(text)),
  doubleDoor: /handleClick\.boxId === boxId && now - handleClick\.t < 450 && !handleClick\.moved && Math\.hypot\(e\.clientX - handleClick\.x, e\.clientY - handleClick\.y\) <= 4/.test(text),
  rightDoor: /if \(e\.button === 2\) \{ e\.preventDefault\(\); enterConnect\(boxId, true, e\); return; \}/.test(text),
  relockKept: /if \(hitEl\?\.closest\('\.board-handle'\)\) return;\n\s*if \(performance\.now\(\) - lastGestureEndRef\.current < 100\) return;/.test(text) && /clearBoardSelection\(\);\n\s*startX = e\.clientX; startY = e\.clientY; ptype = e\.pointerType; activePointerId = e\.pointerId;\n\s*try \{ canvas\.setPointerCapture/.test(text) && /const onDragStart/.test(text),
  ctxScoped: /if \(connect \|\| performance\.now\(\) < ctxQuietUntil \|\| t\?\.closest\?\.\('\.board-handle'\)\) e\.preventDefault\(\);/.test(text),
  toggle: /if \(existing\) \{\n\s*setBoxes\(prev => prev\.filter\(x => x\.id !== existing\.id\)\);/.test(text) && /kind: 'connection', x: 0, y: 0, w: 0, h: 0, z: maxZ \+ 1, connA: src, connB: tid/.test(text),
  cancelOnEmpty: /if \(connect\.moved\) \{ endConnect\(\); return; \}/.test(text),
  linesOnlyInMode: /if \(threadArmedFrom != null\) \{\n\s*const src = boxes\.find\(b => b\.id === threadArmedFrom\);/.test(text) && !/\{connections\.map\(conn => \{\n\s*const a = boxes\.find/.test(text),
  sameBoard: /LINKABLE = new Set<string>\(\['text', 'ink', 'page-pin'\]\)/.test(text),
  footersOn: /const footerOn = true;/.test(text),
});
{
  const p = pins(be);
  ok('S1: the tack is gone from the component; the corner square has BOTH new doors (a second press at the same spot, soon, with nothing moved in between; a right-button press); the relock guard is KEPT (the dblclick-on-the-corner return, the <100ms-after-a-gesture return, the selection clear before a resize, the native-drag refusal)',
    p.noTack && p.doubleDoor && p.rightDoor && p.relockKept, JSON.stringify(p));
  // ---- PARKED - SUPERSEDED by board-context-menu (Nick approved the mockup, Oct 15; pair ledger 69) ----
  // `ctxScoped` is a SOURCE regex on the board's contextmenu handler as connector-a wrote it (`... ) e.preventDefault();`). board-context-menu rewrote that handler: the browser's menu is still suppressed in connection mode, on the corner square and for the beat after a right-drag lets go, and a right-click ANYWHERE ELSE on a card or on empty board now opens the board's own menu. The literal text is gone; the claim (the corner square, and only it, is connection mode; nothing but the app's own menu ever shows) stands.
  // Quoted VERBATIM below. Successor: the check directly below (the new handler's shape) + board-context-menu.mjs K1/K2 (behaviour: a card right-click opens the menu, the corner square is connection mode with no menu).
  // ok('S2: a release on a linked card removes the connection, on an unlinked one makes the SAME connection box as ever (no new field - zero schema); a release on empty board after a drag cancels; lines are drawn only inside the mode; targets are same-board cards only; the context menu is suppressed only on the square',
  //   p.toggle && p.cancelOnEmpty && p.linesOnlyInMode && p.sameBoard && p.ctxScoped && p.footersOn, JSON.stringify(p));
  const ctxNew = (text) => /if \(connect \|\| performance\.now\(\) < ctxQuietUntil \|\| t\?\.closest\?\.\('\.board-handle'\)\) \{ e\.preventDefault\(\); return; \}/.test(text);
  ok('S2 [context-menu successor]: a release on a linked card removes the connection, on an unlinked one makes the SAME connection box as ever (no new field - zero schema); a release on empty board after a drag cancels; lines are drawn only inside the mode; targets are same-board cards only; the browser\'s menu is suppressed in connection mode, on the corner square and for the beat after a right-drag lets go (the handler\'s new shape)',
    p.toggle && p.cancelOnEmpty && p.linesOnlyInMode && p.sameBoard && ctxNew(be) && p.footersOn, JSON.stringify({ ...p, ctxNew: ctxNew(be) }));
  ok('S3: CSS has no tack rule, no olive dashed preview, no source outline; Sliver has no footer toggle', !/board-pin-grab|data-thread-source|board-thread-preview/.test(live(css)) && !/boardFooterToggle|content\.footer/.test(live(sliver)), '');
  const m1 = be.replace(' && !handleClick.moved', '');
  const m2 = be.replace("if (connect || performance.now() < ctxQuietUntil || t?.closest?.('.board-handle')) e.preventDefault();", 'e.preventDefault();');
  const m3 = be.replace('if (connect.moved) { endConnect(); return; }', 'return;');
  const m4 = be.replace('if (hitEl?.closest(\'.board-handle\')) return;', '');
  const m5 = be.replace('if (existing) {', 'if (false) {');
  const m6 = be + '\nconst tack = <div className="board-pin-grab" />;\n';
  const m7 = be + '\n// a history comment naming board-pin-grab must NOT trip the pin\n';
  // ---- PARKED - SUPERSEDED by board-context-menu (Nick approved the mockup, Oct 15; pair ledger 69) ----
  // The suppress-the-menu-everywhere mutant (m2) and its pin were written against the handler's old text; the mutation no longer lands on the rewritten handler.
  // Quoted VERBATIM below. Successor: the check directly below (the same mutants, m2 re-aimed at the new handler).
  // ok('S (mutants): dropping "nothing moved in between", suppressing the menu everywhere, dropping the cancel-on-empty, dropping the relock return, dropping the unlink branch, or putting the tack back each turn a pin RED, while a history COMMENT naming the tack does not (each mutation landed)',
  //   m1 !== be && !pins(m1).doubleDoor && m2 !== be && !pins(m2).ctxScoped && m3 !== be && !pins(m3).cancelOnEmpty && m4 !== be && !pins(m4).relockKept && m5 !== be && !pins(m5).toggle && m6 !== be && !pins(m6).noTack && m7 !== be && pins(m7).noTack, '');
  const m2b = be.replace("if (connect || performance.now() < ctxQuietUntil || t?.closest?.('.board-handle')) { e.preventDefault(); return; }", 'e.preventDefault();');
  ok('S (mutants) [context-menu successor]: dropping "nothing moved in between", suppressing the menu everywhere (re-aimed at the rewritten handler), dropping the cancel-on-empty, dropping the relock return, dropping the unlink branch, or putting the tack back each turn a pin RED, while a history COMMENT naming the tack does not (each mutation landed)',
    m1 !== be && !pins(m1).doubleDoor && m2b !== be && !ctxNew(m2b) && m3 !== be && !pins(m3).cancelOnEmpty && m4 !== be && !pins(m4).relockKept && m5 !== be && !pins(m5).toggle && m6 !== be && !pins(m6).noTack && m7 !== be && pins(m7).noTack, '');
}

// ---- the box half -----------------------------------------------------------------------------------------------------------------------------------------------------------------------
let boardN = 0;
const fresh = async (app, extra = {}) => {
  boardN += 1;
  const id = `ca-board-${boardN}`;
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
  const boxes = [
    { id: 'ca-a', kind: 'text', x: 0.05, y: 0.05, w: 0.2, h: 0.12, z: 1, text: 'Card A' },
    { id: 'ca-b', kind: 'text', x: 0.5, y: 0.05, w: 0.2, h: 0.12, z: 2, text: 'Card B' },
    { id: 'ca-c', kind: 'text', x: 0.05, y: 0.4, w: 0.2, h: 0.12, z: 3, text: 'Card C' },
    { id: 'ca-d', kind: 'text', x: 0.5, y: 0.4, w: 0.2, h: 0.12, z: 4, text: 'Card D' },
    { id: 'ca-ac', kind: 'connection', x: 0, y: 0, w: 0, h: 0, z: 5, connA: 'ca-a', connB: 'ca-c' },
    { id: 'ca-bd', kind: 'connection', x: 0, y: 0, w: 0, h: 0, z: 6, connA: 'ca-b', connB: 'ca-d' },
  ].filter((b) => !(extra.noLinks && b.kind === 'connection'));
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: 'Connector board', pageType: 'board', boxes, createdAt: new Date().toISOString(), origin: null, source: null })})`);
  await sleep(450);
  await app.evalJs(`location.hash = '#/page/${id}'`);
  const there = await waitSoft(app, "!!document.querySelector('.board-canvas [data-box-id=\"ca-a\"]')", { label: 'the board', timeout: 9000 });
  await sleep(900);
  return { there, id };
};
const R = (app, sel) => app.evalJs(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; })()`);
const boxRect = (app, id) => R(app, `[data-box-id="${id}"]`);
const centre = (r) => ({ x: Math.round(r.l + r.w / 2), y: Math.round(r.t + r.h / 2) });
const handleAt = async (app, id) => { const r = await R(app, `[data-box-id="${id}"] .board-handle`); return r ? centre(r) : null; };
const mouse = (app, type, x, y, o = {}) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'mouse', ...o });
const click = async (app, x, y) => { await app.mouseMove(x, y); await mouse(app, 'mousePressed', x, y); await mouse(app, 'mouseReleased', x, y); };
const select = async (app, id) => { const r = await boxRect(app, id); await click(app, Math.round(r.l + r.w * 0.3), Math.round(r.t + r.h * 0.3)); await sleep(700); };   // past the double-click interval
const dbl = async (app, x, y) => {
  await app.mouseMove(x, y);
  await mouse(app, 'mousePressed', x, y, { clickCount: 1 }); await mouse(app, 'mouseReleased', x, y, { clickCount: 1 });
  await sleep(60);
  await mouse(app, 'mousePressed', x, y, { clickCount: 2 }); await mouse(app, 'mouseReleased', x, y, { clickCount: 2 });
  await sleep(250);
};
const rightDown = (app, x, y) => app.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'right', buttons: 2, clickCount: 1, pointerType: 'mouse' });
const rightMove = (app, x, y) => app.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'right', buttons: 2, pointerType: 'mouse' });
const rightUp = (app, x, y) => app.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'right', buttons: 0, clickCount: 1, pointerType: 'mouse' });
const glide = async (app, from, to, steps = 6, move = (x, y) => app.mouseMove(x, y)) => { for (let i = 1; i <= steps; i += 1) { await move(Math.round(from.x + ((to.x - from.x) * i) / steps), Math.round(from.y + ((to.y - from.y) * i) / steps)); await sleep(20); } };
const conns = async (app) => ((await app.evalJs('window.wrizoBoard()')) || []).filter((b) => b.kind === 'connection');
const linked = (cs, a, b) => cs.some((c) => (c.connA === a && c.connB === b) || (c.connA === b && c.connB === a));
const armed = (app) => app.evalJs("document.querySelector('.board-canvas').dataset.threadArmed");
const lineCount = (app) => app.evalJs("document.querySelectorAll('.board-connection-line').length");
const brass = (app) => app.evalJs("(() => { const p = document.createElement('i'); p.style.color = 'var(--brass)'; document.body.appendChild(p); const c = getComputedStyle(p).color; p.remove(); return c; })()");
const paper = (app) => app.evalJs("(() => { const p = document.createElement('i'); p.style.color = 'var(--paper)'; document.body.appendChild(p); const c = getComputedStyle(p).color; p.remove(); return c; })()");
const circleOf = (app, id) => app.evalJs(`(() => { const e = document.querySelector('[data-box-id="${id}"] > .board-tcircle'); if (!e) return null; const cs = getComputedStyle(e); return { display: cs.display, bg: cs.backgroundColor, solid: e.dataset.solid }; })()`);
const handleShape = (app, id) => app.evalJs(`(() => { const e = document.querySelector('[data-box-id="${id}"] .board-handle'); if (!e) return null; const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return { circle: e.dataset.circle, solid: e.dataset.solid, radius: cs.borderTopLeftRadius, w: Math.round(r.width), bg: cs.backgroundColor }; })()`);
// INSTRUMENT, not a claim (connector-b): the arm now lives in a VIEWPORT overlay (a portal on body, so it can reach the rail), so its coordinates are CLIENT coordinates - there is no canvas offset to add back. What C5/C6 assert
// (the arm lands on a card's corner, follows the pointer over empty board, ends at 1.25px) is unchanged.
const arm = (app) => app.evalJs(`(() => { const l = document.querySelector('.board-connect-arm'); const t = document.querySelector('.board-connect-tip'); if (!l) return null;
  return { display: getComputedStyle(l).display, x2: +l.getAttribute('x2'), y2: +l.getAttribute('y2'), x1: +l.getAttribute('x1'), y1: +l.getAttribute('y1'), tip: t ? getComputedStyle(t).display : null, sw: getComputedStyle(l).strokeWidth }; })()`);
const near = (a, b, tol = 3) => a != null && b != null && Math.abs(a - b) <= tol;
const emptyPoint = (app) => app.evalJs(`(() => { const c = document.querySelector('.board-canvas'); const r = c.getBoundingClientRect();
  for (let y = Math.max(r.top, 0) + 40; y < Math.min(r.bottom, window.innerHeight - 100); y += 25) for (let x = r.left + 40; x < r.right - 40; x += 25) if (document.elementFromPoint(x, y) === c) return { x: Math.round(x), y: Math.round(y) };
  return null; })()`);

await withHarness(async (app) => {
  // ============================================================ C1 / C2 at rest
  let f = await fresh(app);
  ok('fixture: the board opened with four cards and two links', f.there, JSON.stringify(f));
  await select(app, 'ca-a');
  const rest = await app.evalJs(`(() => ({ lines: document.querySelectorAll('.board-connection-line').length, hits: document.querySelectorAll('.board-connection-hit').length, tack: document.querySelectorAll('.board-pin-grab, [data-pin]').length,
    circles: [...document.querySelectorAll('.board-tcircle')].map((e) => getComputedStyle(e).display), cards: document.querySelectorAll('.board-box').length }))()`);
  const hs = await handleShape(app, 'ca-a');
  ok('C1: at rest nothing is drawn between linked cards (no line, no hit line), every card carries its (hidden) circle, and the selected card\'s corner is still a SQUARE (no radius, 10px)',
    rest.lines === 0 && rest.hits === 0 && rest.circles.length === rest.cards && rest.circles.every((d) => d === 'none') && !!hs && hs.circle === 'false' && /^0px$|^0$/.test(hs.radius) && hs.w === 10, JSON.stringify({ rest, hs }));
  ok('C2: the green tack is gone from the DOM (no .board-pin-grab, no data-pin on any card) and the sliver\'s CSS carries no rule for it', rest.tack === 0, JSON.stringify(rest));

  // ============================================================ C3 a real double-click enters the mode
  const canvas0 = await R(app, '.board-canvas'); const a0 = await boxRect(app, 'ca-a'); const h0 = await handleAt(app, 'ca-a');
  await dbl(app, h0.x, h0.y);
  const hs1 = await handleShape(app, 'ca-a');
  const canvas1 = await R(app, '.board-canvas'); const a1 = await boxRect(app, 'ca-a');
  ok('C3: a real double-click on the selected card\'s corner square (two trusted presses at one spot, nothing moved) ENTERS connection mode - the canvas reads armed, the square is now a 10px CIRCLE - and opens NO popup',
    (await armed(app)) === 'true' && !!hs1 && hs1.circle === 'true' && hs1.radius === '50%' && hs1.w === 10 && !(await app.evalJs("!!document.querySelector('.board-popup')")), JSON.stringify({ armed: await armed(app), hs1 }));
  ok('C3 (page primacy): entering the mode moves NOTHING - the canvas rect and the card rect are identical before and after', JSON.stringify(canvas0) === JSON.stringify(canvas1) && JSON.stringify(a0) === JSON.stringify(a1), JSON.stringify({ canvas0, canvas1, a0, a1 }));

  // ============================================================ C4 lines: this card's, thin brass, corner to corner
  const BR = await brass(app); const PAPER = await paper(app);
  const mode = await app.evalJs(`(() => { const ls = [...document.querySelectorAll('.board-connection-line')]; const c = document.querySelector('.board-canvas').getBoundingClientRect();
    return ls.map((l) => ({ stroke: getComputedStyle(l).stroke, sw: getComputedStyle(l).strokeWidth, x1: +l.getAttribute('x1') + c.left, y1: +l.getAttribute('y1') + c.top, x2: +l.getAttribute('x2') + c.left, y2: +l.getAttribute('y2') + c.top, filter: getComputedStyle(l).filter })); })()`);
  const cc = await boxRect(app, 'ca-c');
  ok('C4: in the mode ONE line is drawn (this card\'s link to C - not B-D), 1px, brass, with no glow filter, from A\'s corner circle to C\'s corner circle',
    mode.length === 1 && mode[0].sw === '1px' && mode[0].stroke === BR && mode[0].filter === 'none' && near(mode[0].x1, a1.r) && near(mode[0].y1, a1.b) && near(mode[0].x2, cc.r) && near(mode[0].y2, cc.b), JSON.stringify({ mode, BR, a1, cc }));
  const cCircle = await circleOf(app, 'ca-c'); const bCircle = await circleOf(app, 'ca-b'); const dCircle = await circleOf(app, 'ca-d');
  ok('C4: the linked peer (C) shows its circle SOLID brass; cards not linked to A (B, D) show none', cCircle.display === 'block' && cCircle.bg === BR && bCircle.display === 'none' && dCircle.display === 'none', JSON.stringify({ cCircle, bCircle, dCircle }));

  // ============================================================ C5 the arm: over an open card, and over empty board
  const bc = await boxRect(app, 'ca-b'); const bMid = centre(bc);
  await glide(app, h0, bMid, 8);
  const armB = await arm(app); const bCircle2 = await circleOf(app, 'ca-b'); const hsOpen = await handleShape(app, 'ca-a');
  ok('C5: the pointer over an OPEN (unlinked) card: the arm is drawn, snapped to THAT card\'s corner (not the pointer), 1.25px; the card\'s circle shows OPEN (paper, not brass), the tip dot is hidden, and the origin circle is open too',
    !!armB && armB.display !== 'none' && near(armB.x2, bc.r) && near(armB.y2, bc.b) && armB.sw === '1.25px' && armB.tip === 'none' && bCircle2.display === 'block' && bCircle2.solid === 'false' && bCircle2.bg === PAPER && hsOpen.solid === 'false' && hsOpen.bg === PAPER,
    JSON.stringify({ armB, bc, bCircle2, hsOpen }));
  const ep = await emptyPoint(app);
  await glide(app, bMid, ep, 8);
  const armE = await arm(app); const bCircle3 = await circleOf(app, 'ca-b');
  ok('C5: over empty board the arm follows the POINTER (its end is at the pointer), the tip dot shows, and B\'s circle is hidden again', !!armE && near(armE.x2, ep.x) && near(armE.y2, ep.y) && armE.tip === 'block' && bCircle3.display === 'none', JSON.stringify({ armE, ep, bCircle3 }));

  // ============================================================ C6 over a LINKED card
  const cMid = centre(cc);
  await glide(app, ep, cMid, 8); await sleep(350);
  const armC = await arm(app); const cCircle2 = await circleOf(app, 'ca-c'); const hsSolid = await handleShape(app, 'ca-a');
  ok('C6: the pointer over a card ALREADY linked to the origin: the arm snaps to its corner, its circle is SOLID, and the origin circle goes SOLID too (solid = linked)',
    !!armC && near(armC.x2, cc.r) && near(armC.y2, cc.b) && cCircle2.display === 'block' && cCircle2.bg === BR && hsSolid.solid === 'true' && hsSolid.bg === BR, JSON.stringify({ armC, cCircle2, hsSolid }));

  // ============================================================ C7 a release on an open card LINKS; the flash; then hidden
  const before = await conns(app);
  await glide(app, cMid, bMid, 6);
  await mouse(app, 'mousePressed', bMid.x, bMid.y); await mouse(app, 'mouseReleased', bMid.x, bMid.y);
  await sleep(250);
  const after = await conns(app); const mintedRaw = after.find((c) => (c.connA === 'ca-a' && c.connB === 'ca-b') || (c.connA === 'ca-b' && c.connB === 'ca-a'));
  const flashLines = await lineCount(app); const flashB = await circleOf(app, 'ca-b'); const hsFlash = await handleShape(app, 'ca-a');
  ok('C7: a release on an unlinked card LINKS: one new connection box between A and B, the mode is over (canvas not armed)',
    after.length === before.length + 1 && !!mintedRaw && (await armed(app)) === 'false', JSON.stringify({ before: before.length, after: after.length, mintedRaw }));
  ok('C7: the brief flash: just after linking, the new line is drawn (1), B\'s circle is SOLID, and A\'s square is a solid circle',
    flashLines === 1 && flashB.display === 'block' && flashB.bg === BR && hsFlash.circle === 'true' && hsFlash.solid === 'true', JSON.stringify({ flashLines, flashB, hsFlash }));
  await sleep(2300);
  const flashGone = await app.evalJs("({ lines: document.querySelectorAll('.board-connection-line').length, circles: [...document.querySelectorAll('.board-tcircle')].filter((e) => getComputedStyle(e).display !== 'none').length })");
  const hsGone = await handleShape(app, 'ca-a');
  ok('C7: ~2s later EVERYTHING hides - no line, no circle, and A\'s corner is a square again', flashGone.lines === 0 && flashGone.circles === 0 && hsGone.circle === 'false' && /^0px$|^0$/.test(hsGone.radius), JSON.stringify({ flashGone, hsGone }));

  // ============================================================ C8 a release on a linked card UNLINKS
  await dbl(app, h0.x, h0.y);
  await glide(app, h0, cMid, 8);
  const preUn = await conns(app);
  await mouse(app, 'mousePressed', cMid.x, cMid.y); await mouse(app, 'mouseReleased', cMid.x, cMid.y);
  await sleep(250);
  const postUn = await conns(app); const cOpen = await circleOf(app, 'ca-c'); const unLines = await lineCount(app);
  ok('C8: a release on a card that IS linked UNLINKS it - A-C is gone, the others (A-B, B-D) stay', linked(preUn, 'ca-a', 'ca-c') && !linked(postUn, 'ca-a', 'ca-c') && linked(postUn, 'ca-a', 'ca-b') && linked(postUn, 'ca-b', 'ca-d') && postUn.length === preUn.length - 1, JSON.stringify({ pre: preUn.length, post: postUn.length }));
  ok('C8: the unlink flash shows C\'s circle OPEN (it has no other link) and draws NO line', cOpen.display === 'block' && cOpen.solid === 'false' && unLines === 0, JSON.stringify({ cOpen, unLines }));
  await sleep(1900);

  // ============================================================ C9 right-click
  f = await fresh(app);
  await app.evalJs("window.__ctx = []; window.addEventListener('contextmenu', (e) => window.__ctx.push({ prevented: e.defaultPrevented, cls: String(e.target.className && e.target.className.baseVal === undefined ? e.target.className : 'svg').split(' ')[0] }));");
  // the control: the instrument sees a right-click on a place the menu must NOT be suppressed
  // ---- PARKED - SUPERSEDED by board-context-menu (Nick approved the mockup, Oct 15) ----
  // A right-click on EMPTY BOARD opens the board menu now (New Card / Delete board) and is default-prevented - so it can no longer be the control "a right-click the app does not suppress". (It also left that menu open over the card the next step pressed: the first review run's crash at the card's handle.)
  // Quoted VERBATIM below. Successor: the control directly below: a right-click OUTSIDE the board, which the app never touches.
  // const free = await emptyPoint(app);
  // await rightDown(app, free.x, free.y); await rightUp(app, free.x, free.y); await sleep(200);
  // const ctlLog = await app.evalJs('window.__ctx.slice()');
  // ok('C9 (instrument): a right-click on empty board reaches the page as a contextmenu event and is NOT suppressed (so a suppressed one below is the product, not a blind instrument)', ctlLog.length >= 1 && ctlLog[ctlLog.length - 1].prevented === false, JSON.stringify(ctlLog));
  await rightDown(app, 4, 4); await rightUp(app, 4, 4); await sleep(200);   // the window's corner: outside the board entirely
  const ctlLog = await app.evalJs('window.__ctx.slice()');
  ok('C9 (instrument) [context-menu successor]: a right-click OUTSIDE the board (the window\'s corner) reaches the page as a contextmenu event and is NOT suppressed (so a suppressed one below is the product, not a blind instrument)', ctlLog.length >= 1 && ctlLog[ctlLog.length - 1].prevented === false, JSON.stringify(ctlLog));
  await select(app, 'ca-a');
  const h9 = await handleAt(app, 'ca-a'); const b9 = centre(await boxRect(app, 'ca-b'));
  await app.evalJs('window.__ctx.length = 0');
  const pre9 = await conns(app);
  await rightDown(app, h9.x, h9.y); await sleep(120);
  const midArmed = await armed(app);
  await glide(app, h9, b9, 8, (x, y) => rightMove(app, x, y));
  await rightUp(app, b9.x, b9.y); await sleep(300);
  const post9 = await conns(app); const ctx9 = await app.evalJs('window.__ctx.slice()');
  ok('C9: a right-button press on the square ENTERS the mode held; dragging to a card and letting go there LINKS it (A-B)', midArmed === 'true' && linked(post9, 'ca-a', 'ca-b') && post9.length === pre9.length + 1 && (await armed(app)) === 'false', JSON.stringify({ midArmed, pre: pre9.length, post: post9.length }));
  ok('C9: the browser\'s context menu is suppressed on the square AND for the beat after a right-drag lets go over another card (every contextmenu event in that gesture was default-prevented, and at least one arrived)', ctx9.length >= 1 && ctx9.every((e) => e.prevented), JSON.stringify(ctx9));
  await sleep(700);
  await app.evalJs('window.__ctx.length = 0');
  const bm = centre(await boxRect(app, 'ca-d'));
  await rightDown(app, bm.x, bm.y); await rightUp(app, bm.x, bm.y); await sleep(250);
  // ---- PARKED - SUPERSEDED by board-context-menu (Nick approved the mockup, Oct 15) ----
  // A right-click on a card BODY opens that card's menu now (default-prevented, by design); only the corner square is connection mode. The browser's own menu is never what shows on the board.
  // Quoted VERBATIM below. Successor: the check directly below (the card menu opens, prevented) and board-context-menu.mjs K1/K2.
  // const ctx9b = await app.evalJs('window.__ctx.slice()');
  // ok('C9: and a right-click anywhere else (a card body) is NOT suppressed - the menu rule is only on the square', ctx9b.length >= 1 && ctx9b.every((e) => e.prevented === false), JSON.stringify(ctx9b));
  const ctx9b = await app.evalJs('window.__ctx.slice()');
  const menuOnCard = await app.evalJs("!!document.querySelector('.wz-ctx')");
  ok('C9 [context-menu successor]: a right-click on a card BODY is not connection mode and not the browser\'s menu - the board\'s own card menu opens (default-prevented); the corner square alone is connection mode', ctx9b.length >= 1 && ctx9b.every((e) => e.prevented === true) && menuOnCard, JSON.stringify({ ctx9b, menuOnCard }));
  await app.key('Escape'); await sleep(200);

  // ============================================================ C10 Esc cancels   C11 release on empty cancels
  f = await fresh(app);
  await select(app, 'ca-a');
  const h10 = await handleAt(app, 'ca-a'); const n10 = (await conns(app)).length;
  await dbl(app, h10.x, h10.y);
  const on10 = await armed(app);
  await app.key('Escape'); await sleep(250);
  const hs10 = await handleShape(app, 'ca-a');
  ok('C10: Esc cancels the mode - it was armed, it is not now, the lines are gone, the square is a square again, and nothing was linked',
    on10 === 'true' && (await armed(app)) === 'false' && (await lineCount(app)) === 0 && hs10.circle === 'false' && (await conns(app)).length === n10, JSON.stringify({ on10, hs10 }));
  const ep11 = await emptyPoint(app);
  const hh = await handleAt(app, 'ca-a');
  await rightDown(app, hh.x, hh.y);
  await glide(app, hh, ep11, 8, (x, y) => rightMove(app, x, y));
  const heldArmed = await armed(app);
  await rightUp(app, ep11.x, ep11.y); await sleep(300);
  ok('C11: a drag from the square released on EMPTY board cancels - it was armed while held, it is not after, nothing was linked', heldArmed === 'true' && (await armed(app)) === 'false' && (await conns(app)).length === n10, JSON.stringify({ heldArmed, n10 }));
  await select(app, 'ca-a');
  const h11 = await handleAt(app, 'ca-a');
  await dbl(app, h11.x, h11.y);
  const ep11b = await emptyPoint(app);
  await click(app, ep11b.x, ep11b.y); await sleep(250);
  ok('C11: and a plain click on empty board while the mode is latched ends it too, linking nothing', (await armed(app)) === 'false' && (await conns(app)).length === n10, '');

  // ============================================================ C12 click a line, Delete
  f = await fresh(app);
  await select(app, 'ca-a');
  const h12 = await handleAt(app, 'ca-a'); const a12 = await boxRect(app, 'ca-a'); const c12 = await boxRect(app, 'ca-c');
  await dbl(app, h12.x, h12.y);
  const mid = { x: Math.round((a12.r + c12.r) / 2), y: Math.round((a12.b + c12.b) / 2) };
  const onTop = await app.evalJs(`(() => { const el = document.elementsFromPoint(${mid.x}, ${mid.y}).map((e) => e.className && e.className.baseVal !== undefined ? e.className.baseVal : String(e.className)); return el.slice(0, 4); })()`);
  const cardsBeforeDelete = await app.evalJs("document.querySelectorAll('.board-box').length");
  await app.key('Delete'); await sleep(200);
  await app.key('Backspace'); await sleep(200);
  ok('C12 (control): a Delete / Backspace with NO line selected removes nothing - not the link, and NOT THE CARD the mode is running from (the key belongs to the mode) - and the mode survives', (await conns(app)).length === 2 && (await armed(app)) === 'true' && (await app.evalJs("document.querySelectorAll('.board-box').length")) === cardsBeforeDelete, JSON.stringify({ conns: await conns(app), cardsBeforeDelete }));
  ok('C3b: entering the mode selects NO line (the release at the origin circle, where this card\'s lines begin, is not a click on one) - the line is 1px, not heavy', (await app.evalJs("[...document.querySelectorAll('.board-connection-line')].every((l) => l.dataset.selected === 'false' && getComputedStyle(l).strokeWidth === '1px')")) === true, '');
  await click(app, mid.x, mid.y); await sleep(250);
  const sel = await app.evalJs("[...document.querySelectorAll('.board-connection-line')].map((l) => ({ sel: l.dataset.selected, sw: getComputedStyle(l).strokeWidth }))");
  ok('C12: clicking a line (the midpoint, in the gap between the cards) SELECTS it - heavier (2px) - and the mode stays on', sel.length === 1 && sel[0].sel === 'true' && sel[0].sw === '2px' && (await armed(app)) === 'true', JSON.stringify({ sel, mid, onTop }));
  await app.key('Delete'); await sleep(300);
  const post12 = await conns(app);
  ok('C12: Delete then REMOVES that connection (A-C gone; B-D stays) and the mode is still on', !linked(post12, 'ca-a', 'ca-c') && linked(post12, 'ca-b', 'ca-d') && (await armed(app)) === 'true', JSON.stringify(post12));
  await app.key('Escape'); await sleep(200);

  // ============================================================ C13 the resize square still resizes
  f = await fresh(app);
  await select(app, 'ca-a');
  const h13 = await handleAt(app, 'ca-a'); const w13 = (await boxRect(app, 'ca-a')).w;
  await mouse(app, 'mousePressed', h13.x, h13.y);
  for (let i = 1; i <= 5; i += 1) { await app.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: h13.x + 14 * i, y: h13.y + 6 * i, button: 'left', buttons: 1, pointerType: 'mouse' }); await sleep(16); }
  await mouse(app, 'mouseReleased', h13.x + 70, h13.y + 30);
  await sleep(300);
  const w13b = (await boxRect(app, 'ca-a')).w;
  ok('C13: dragging the corner square still RESIZES the card (the width grows) and enters no mode', w13b > w13 + 40 && (await armed(app)) === 'false', JSON.stringify({ w13, w13b }));
  await sleep(700);
  const h13b = await handleAt(app, 'ca-a');
  await click(app, h13b.x, h13b.y); await sleep(700);
  await click(app, h13b.x, h13b.y); await sleep(300);
  ok('C13: a lone click on the square enters nothing, and a SECOND click 700ms later is not a double-click either (the window is brief)', (await armed(app)) === 'false', '');
  // a resize immediately followed by another resize - the relock law - enters nothing
  await mouse(app, 'mousePressed', h13b.x, h13b.y);
  for (let i = 1; i <= 4; i += 1) { await app.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: h13b.x + 10 * i, y: h13b.y + 4 * i, button: 'left', buttons: 1, pointerType: 'mouse' }); await sleep(16); }
  await mouse(app, 'mouseReleased', h13b.x + 40, h13b.y + 16);
  const h13c = await handleAt(app, 'ca-a'); const w13c = (await boxRect(app, 'ca-a')).w;
  await mouse(app, 'mousePressed', h13c.x, h13c.y, { clickCount: 2 });
  for (let i = 1; i <= 4; i += 1) { await app.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: h13c.x + 10 * i, y: h13c.y + 4 * i, button: 'left', buttons: 1, pointerType: 'mouse' }); await sleep(16); }
  await mouse(app, 'mouseReleased', h13c.x + 40, h13c.y + 16, { clickCount: 2 });
  await sleep(300);
  ok('C13: a resize followed AT ONCE by another (the relock case) grows again and enters nothing', (await boxRect(app, 'ca-a')).w > w13c + 20 && (await armed(app)) === 'false' && !(await app.evalJs("!!document.querySelector('.board-popup')")), '');

  // ============================================================ C14 the box shape, and survive a reload
  f = await fresh(app, { noLinks: true });
  await select(app, 'ca-a');
  const h14 = await handleAt(app, 'ca-a'); const d14 = centre(await boxRect(app, 'ca-d'));
  await dbl(app, h14.x, h14.y);
  await glide(app, h14, d14, 8);
  await mouse(app, 'mousePressed', d14.x, d14.y); await mouse(app, 'mouseReleased', d14.x, d14.y);
  await sleep(2200);
  const made = (await conns(app))[0];
  const allowed = new Set(['id', 'kind', 'x', 'y', 'w', 'h', 'z', 'connA', 'connB']);
  ok('C14: the link the gesture made is the connection box as it has always been - kind, id, the endpoint ids and the zero geometry, NO new field (zero schema)',
    !!made && made.kind === 'connection' && Object.keys(made).every((k) => allowed.has(k)) && ((made.connA === 'ca-a' && made.connB === 'ca-d') || (made.connA === 'ca-d' && made.connB === 'ca-a')) && made.x === 0 && made.w === 0, JSON.stringify(made));
  await app.evalJs('window.wrizoFlushNow && window.wrizoFlushNow()'); await sleep(500);
  await app.reload();
  await waitSoft(app, "!!document.querySelector('.board-canvas [data-box-id=\"ca-a\"]')", { label: 'board after reload', timeout: 9000 });
  await sleep(700);
  ok('C14: and it survives a reload', linked(await conns(app), 'ca-a', 'ca-d'), JSON.stringify(await conns(app)));

  // ============================================================ C15 clipped to the board
  f = await fresh(app);
  await select(app, 'ca-a');
  const h15 = await handleAt(app, 'ca-a');
  await dbl(app, h15.x, h15.y);
  const clip = await app.evalJs(`(() => { const svg = document.querySelector('.board-connections'); const wrap = svg && svg.closest('.board-canvas-wrap'); if (!wrap) return null;
    const ov = getComputedStyle(wrap).overflow; const wr = wrap.getBoundingClientRect();
    const lines = [...document.querySelectorAll('.board-connection-line')].map((l) => l.getBoundingClientRect());
    return { overflow: ov, inside: lines.every((r) => r.right <= wr.right + 1 && r.left >= wr.left - 1 && r.bottom <= wr.bottom + 1), n: lines.length, inCanvas: !!svg.closest('.board-canvas') }; })()`);
  ok('C15: the lines live inside the board canvas, which sits in a wrap that clips (overflow auto), and every line lies within the wrap - none can reach over the rail', !!clip && clip.inCanvas && clip.overflow !== 'visible' && clip.inside && clip.n === 1, JSON.stringify(clip));
  await app.key('Escape'); await sleep(200);

  // ============================================================ C16 "Show grafts" retired, footers on
  await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await sleep(250);
  const drawer = await app.evalJs(`(() => ({ toggle: document.querySelectorAll('.wz-sliver-board-footer').length, labels: [...document.querySelectorAll('.wz-sliver-body .wz-sliver-item-btn')].map((b) => b.textContent.trim()),
    footerA: document.querySelector('[data-box-id="ca-a"] .board-card-footer')?.textContent ?? null }))()`);
  const phrase = await app.evalJs("window.wrizoDeskLexicon ? window.wrizoDeskLexicon.t('boardThreadPrefix') : null");
  ok('C16: the board drawer carries no "Show grafts" / "Show links" toggle, and a linked card\'s footer ("— grafted to: Card C") is ALWAYS ON (Nick overruled the hide, Oct 15) and the link itself is stored', drawer.toggle === 0 && !drawer.labels.some((l) => /Show (grafts|links|connections)/.test(l)) && !!drawer.footerA && !!phrase && drawer.footerA.includes(phrase) && drawer.footerA.includes('Card C') && ((await app.evalJs('window.wrizoBoard()')) || []).some((b) => b.kind === 'connection' && b.connA === 'ca-a' && b.connB === 'ca-c'), JSON.stringify({ drawer, phrase }));
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nCONNECTOR-A VERIFY: PASS (${checks.length} checks)` : `\nCONNECTOR-A VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
