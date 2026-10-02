// REVEAL-ON-CLICK — ratified as this window's second job: a `selectionchange`-
// driven redecorate on both the page and card surfaces.
// Run: node scripts/harness/reveal.mjs   (from apps/desktop, dist-web built)
//
// S0's FINDING, which is not what the ticket's name suggests. The reveal
// register has ALWAYS computed which markers to un-collapse from a caret
// offset — `decorateMarkdownForCard(text, caret)`. Nothing about the reveal
// itself was missing. What was missing is anything that RE-RAN it when the
// caret moved without an edit, and the two surfaces were in different states:
//
//   PAGE (ForwardOnlyEditor's freeEdit branch) — ABSENT. `redecorate` ran from
//     `onInput` and once at mount, from nowhere else. Clicking into a bold run
//     did nothing at all: the decoration still showed the reveal for wherever
//     the caret had been at the last keystroke. This is the founder-visible
//     half and the reason the ticket exists.
//   CARD (BoardEditor's popup editor) — PRESENT, but by ENUMERATED EVENTS.
//     FX5 S6 built a `keyup` listener against a NAV_KEYS list plus a `mouseup`.
//     The diagnosis was right; the signal was a list, and a list goes stale
//     after whichever path nobody wrote down.
//
// AND THE ENUMERATED PAIR CARRIED A DEFECT, which is why the swap is a fix and
// not a tidy-up: both listeners redecorated UNCONDITIONALLY, and a redecorate
// restores a COLLAPSED caret. So on a card, extending a selection collapsed it
// — S3 measures exactly that, because a claim like this one is worth nothing
// unless the check would have failed before.
import { withHarness } from '../runtime-verify.mjs';
import { assertHittable } from '../trusted-point.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const TEXT = 'Start **BOLD** end';
// 'Start **BOLD** end' — the bold run's markers occupy 6,7 and 12,13; the word
// itself 8..11. A caret anywhere in 6..14 is "inside or beside" the run.
const BOLD_LO = 6;
const BOLD_HI = 14;

const freshDesk = async (app, w = 1400, h = 900) => {
  await app.emulateDpr(1, w, h);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
};

// Seeded THROUGH THE SEAM (item 129) and read only AFTER the debounced flush
// has landed (the probe-reads-the-settled-state law).
const seed = async (app, row) => {
  await app.evalJs(`(() => { const now = new Date().toISOString();
    window.wrizoCreateJournalPage(${JSON.stringify(row)}); })()`);
  for (let i = 0; i < 60; i += 1) {
    const landed = await app.evalJs(
      `JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').some(e => e.id === ${JSON.stringify(row.id)})`);
    if (landed) return true;
    await sleep(100);
  }
  return false;
};

// A driver that fails a check rather than killing the file (the standing law):
// every geometry read can come back null, and `.click()` on null aborts the run.
const centreOf = (app, sel) => app.evalJs(`(() => {
  const el = document.querySelector(${JSON.stringify(sel)});
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return null;
  return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
})()`);

// REAL POINTER EVENTS ALWAYS (the standing probe law). A page-side
// `new MouseEvent('click')` is isTrusted:false and — more to the point here —
// moves no caret, so it could not exercise the thing under test at all.
// ITEM 151 (Shape A) -- pt is a bare coordinate object, same limits as
// clickAt: this confirms the point is not empty space, not that it
// still belongs to whatever the caller originally meant by it.
const realClick = async (app, pt) => {
  await assertHittable(app, pt.x, pt.y, `realClick(${pt.x}, ${pt.y})`);
  await app.mouseDown(pt.x, pt.y);
  await app.mouseUp(pt.x, pt.y);
  await sleep(250);
};

const revealState = (app, sel) => app.evalJs(`(() => {
  const ed = document.querySelector(${JSON.stringify(sel)});
  if (!ed) return { missing: true };
  const marks = [...ed.querySelectorAll('.md-mark')];
  return {
    missing: false,
    marks: marks.length,
    anyRevealed: marks.some(m => !m.classList.contains('md-mark-hidden')),
    allHidden: marks.length > 0 && marks.every(m => m.classList.contains('md-mark-hidden')),
    text: ed.innerText,
  };
})()`);

const caretOffset = (app, sel) => app.evalJs(`(() => {
  const ed = document.querySelector(${JSON.stringify(sel)});
  const s = window.getSelection();
  if (!ed || !s || !s.rangeCount) return null;
  const r = s.getRangeAt(0).cloneRange();
  r.selectNodeContents(ed);
  r.setEnd(s.getRangeAt(0).endContainer, s.getRangeAt(0).endOffset);
  return r.toString().length;
})()`);

const selectionNow = (app) => app.evalJs(`(() => {
  const s = window.getSelection();
  if (!s || !s.rangeCount) return { none: true };
  return { none: false, collapsed: s.isCollapsed, length: s.toString().length, text: s.toString() };
})()`);

// THE INTERIM REVEAL RULE (Nick, 2026-09-25: "the asterisks on the page return with right-clicking or other kinds of clicking
// around"; Fable's ruling 2026-10-01). A run's markers show only while the caret TOUCHES A MARKER - inside, or at either edge of,
// the opening or closing marker's own span - never merely inside the styled word. For 'Start **BOLD** end' the marker spans are
// [6,8] and [12,14], so the caret offsets that reveal are 6,7,8 and 12,13,14, and 9,10,11 (mid-word) reveal nothing.
const touchesMarker = (off) => (off >= 6 && off <= 8) || (off >= 12 && off <= 14);
// Walk the caret across the whole line with TRUSTED ArrowRight presses from Home, reading (offset, anyRevealed) at every stop.
const walkLine = async (app, sel) => {
  await app.key('Home');
  await sleep(250);
  const steps = [];
  for (let i = 0; i <= TEXT.length + 1; i += 1) {
    const off = await caretOffset(app, sel);
    const st = await revealState(app, sel);
    steps.push({ off, revealed: st.anyRevealed === true });
    if (off === null || off >= TEXT.length) break;
    await app.key('ArrowRight');
    await sleep(160);
  }
  return steps;
};
const lawHolds = (steps) => steps.length > 0 && steps.every((x) => x.off !== null && x.revealed === touchesMarker(x.off));
// ITEM 211 — markers never show, at the edge of a mark or in the middle of the word.
const neverShown = (steps) => steps.length > 0 && steps.every((x) => x.off !== null && x.revealed === false);
const sawBoth = (steps) => steps.some((x) => touchesMarker(x.off)) && steps.some((x) => x.off >= 9 && x.off <= 11);
// off -> on -> off, in that order, somewhere along the walk (the reveal follows the caret both ways; it does not latch)
const turnsOnAndOff = (steps) => { const k = steps.map((x) => (x.revealed ? '1' : '0')).join(''); return /0+1+0+/.test(k); };
const parked = {};   // observations kept for the parked leg's records

await withHarness(async (app) => {
  // ==========================================================================
  // S1 — THE PAGE SURFACE. The half that had nothing at all.
  // ==========================================================================
  await freshDesk(app);
  const seeded = await seed(app, {
    id: 'rev-page', text: TEXT, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose',
  });
  ok('S1 (setup): the page is seeded through the seam and its row has landed', seeded);
  await app.reload();
  await app.evalJs("location.hash = '#/page/rev-page'");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'page framed' });
  await sleep(500);
  await app.click('Draft');
  await sleep(600);

  const pageBefore = await revealState(app, '.forward-only-editor');
  ok('S1 (precondition): Draft decorates the page — the bold run renders and BOTH its markers are collapsed while the caret is elsewhere',
    pageBefore.marks >= 2 && pageBefore.allHidden === true, JSON.stringify(pageBefore));

  const boldPt = await centreOf(app, '.forward-only-editor .md-bold');
  ok('S1 (setup): the bold run has a real on-screen box to click', !!boldPt, JSON.stringify(boldPt));

  if (boldPt) await realClick(app, boldPt);
  const pageAfterClick = await revealState(app, '.forward-only-editor');
  const pageCaret = await caretOffset(app, '.forward-only-editor');
  // ---- PARKED - SUPERSEDED by the interim reveal rule, 2026-10-01 ----------------------------------------------------------
  // Kept VERBATIM and no longer run. This asserted that a click anywhere INSIDE a styled word shows its markers - which is exactly
  // what Nick reported as a bug ("the asterisks on the page return with ... clicking around"). The listener this ticket built
  // (selectionchange -> revealAtCaret) is unchanged and still what makes the reveal follow the caret; what changed is WHERE the
  // caret must be. Successors: the mid-word click below, and the walk that states the rule at every caret stop.
  //
  // ok('S1 THE TICKET: a REAL click into the bold run reveals its own markers on the page — the gesture that did nothing before, because nothing re-ran the register when the caret moved without an edit',
  //   pageAfterClick.anyRevealed === true, JSON.stringify({ ...pageAfterClick, caret: pageCaret }));
  // ------------------------------------------------------------------
  parked.pageClick = { ...pageAfterClick, caret: pageCaret };
  ok('S1 [interim successor]: a REAL click in the MIDDLE of the bold word reveals NOTHING - every marker stays collapsed (Nick\'s report, the screenshot case)',
    pageAfterClick.allHidden === true && pageCaret !== null && !touchesMarker(pageCaret), JSON.stringify({ ...pageAfterClick, caret: pageCaret }));
  const pageWalk = await walkLine(app, '.forward-only-editor');
  parked.pageWalk = pageWalk;
  // ---- PARKED - SUPERSEDED by item 211, 2026-10-02 --------------------------------------------------------------------------
  // Kept VERBATIM and no longer run. The interim rule showed the marks while the caret touched a marker span. Nick's "A"
  // retires that: the marks never show. Successor: the walk below, which must stay hidden at every stop, edges included.
  //
  // ok('S1 [interim successor] THE RULE, at every caret stop along the line (trusted ArrowRight from Home): the markers show EXACTLY when the caret touches a marker span (6-8, 12-14) and at no stop inside the word - so the listener still re-runs the register on a caret move with no edit',
  //   lawHolds(pageWalk) && sawBoth(pageWalk), JSON.stringify(pageWalk.map((x) => `${x.off}${x.revealed ? '+' : '-'}`).join(' ')));
  // ------------------------------------------------------------------
  ok('S1 ITEM 211: at every caret stop along the line, including the marker edges, every mark stays hidden',
    neverShown(pageWalk) && pageWalk.some((x) => x.off >= 6 && x.off <= 14), JSON.stringify(pageWalk.map((x) => `${x.off}${x.revealed ? '+' : '-'}`).join(' ')));
  if (boldPt) await realClick(app, boldPt);   // back to where the original flow left the caret
  ok('S1: and the caret stays where the writer put it — the redecorate restores the clicked offset rather than collapsing to the end of the page',
    pageCaret !== null && pageCaret >= BOLD_LO && pageCaret <= BOLD_HI,
    JSON.stringify({ caret: pageCaret, expectedBetween: [BOLD_LO, BOLD_HI] }));

  // The other half of "not stuck": moving away must re-collapse. A reveal that
  // only ever turns ON is the stuck-highlight complaint in a new register.
  const edgePt = await app.evalJs(`(() => {
    const el = document.querySelector('.forward-only-editor');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left + 3), y: Math.round(r.top + 10) };
  })()`);
  if (edgePt) await realClick(app, edgePt);
  const pageAfterAway = await revealState(app, '.forward-only-editor');
  // ---- PARKED - SUPERSEDED by the interim reveal rule, 2026-10-01 ----------------------------------------------------------
  // Kept VERBATIM and no longer run: its first half is the parked ticket above (a mid-word click no longer reveals), so the pair can
  // no longer be true together. Its POINT survives whole - the reveal must be seen to turn ON and then OFF again, or "hidden now"
  // proves nothing - and the successor asserts exactly that, on the walk.
  //
  // ok('S1: clicking back out into plain prose RE-COLLAPSES the markers — the reveal follows the caret both ways, it does not latch on. Asserted together with the reveal that preceded it, because "they are hidden now" is trivially true on a surface where nothing ever revealed them: this check has to be unable to pass on a build with no listener at all.',
  //   pageAfterClick.anyRevealed === true && pageAfterAway.allHidden === true,
  //   JSON.stringify({ revealedFirst: pageAfterClick.anyRevealed, hiddenAfter: pageAfterAway.allHidden }));
  // ------------------------------------------------------------------
  parked.pageAway = pageAfterAway;
  // ---- PARKED - SUPERSEDED by item 211, 2026-10-02 --------------------------------------------------------------------------
  // Kept VERBATIM and no longer run. The interim check required the marks to turn ON at a marker edge. That ON is the asterisk the writer reported.
  //
  // ok('S1 [interim successor]: the reveal follows the caret BOTH ways and does not latch - along the walk it is seen OFF, then ON at a marker, then OFF again; and a click out into plain prose leaves everything collapsed. Unable to pass on a build with no listener: the ON has to be observed.',
  //   turnsOnAndOff(pageWalk) && pageAfterAway.allHidden === true, JSON.stringify({ walk: pageWalk.map((x) => (x.revealed ? '1' : '0')).join(''), hiddenAfter: pageAfterAway.allHidden }));
  // ------------------------------------------------------------------
  ok('S1 ITEM 211: the walk never turns a mark on, and a click out into plain prose leaves every mark hidden',
    neverShown(pageWalk) && pageAfterAway.allHidden === true, JSON.stringify({ walk: pageWalk.map((x) => (x.revealed ? '1' : '0')).join(''), hiddenAfter: pageAfterAway.allHidden }));

  // ==========================================================================
  // S2 — TERMINATION, MEASURED. Redecorating restores the caret; restoring the
  // caret fires `selectionchange`; that is a loop unless the second pass
  // declines. Counting real DOM mutations is the way to see the difference —
  // a loop and a single pass look identical in a screenshot.
  // ==========================================================================
  await app.evalJs(`(() => {
    const el = document.querySelector('.forward-only-editor');
    window.__revMut = 0;
    window.__revObs = new MutationObserver(ms => { window.__revMut += ms.length; });
    window.__revObs.observe(el, { childList: true, subtree: true, characterData: true });
  })()`);
  // ---- PARKED - SUPERSEDED by the interim reveal rule, 2026-10-01 ----------------------------------------------------------
  // Kept VERBATIM and no longer run. Its gesture was "one reveal-changing click" into the middle of the bold word; that click no
  // longer changes the reveal, so it produces NO mutations and the `> 0` half fails for a reason that has nothing to do with
  // termination. The claim is unchanged; the successor makes the reveal change with a trusted ArrowRight onto a marker's edge.
  //
  // const boldPt2 = await centreOf(app, '.forward-only-editor .md-bold');
  // if (boldPt2) await realClick(app, boldPt2);
  // await sleep(1200);
  // const mutations = await app.evalJs("(() => { window.__revObs.disconnect(); return window.__revMut; })()");
  // ok('S2 TERMINATION: one reveal-changing click produces a BOUNDED burst of DOM mutations and then stops — the "unchanged decoration is not rewritten" guard is what closes the selectionchange -> redecorate -> setCaret -> selectionchange cycle, and a runaway would show here as hundreds over the same second',
  //   typeof mutations === 'number' && mutations > 0 && mutations < 40, JSON.stringify({ mutations }));
  // ------------------------------------------------------------------
  await app.key('Home');
  await sleep(200);
  for (let i = 0; i < 5; i += 1) { await app.key('ArrowRight'); await sleep(120); }   // caret at 5: one press short of the marker
  await app.evalJs("window.__revMut = 0");
  const beforeEdge = await caretOffset(app, '.forward-only-editor');
  await app.key('ArrowRight');                                                          // onto the opening marker's outer edge
  await sleep(1200);
  const mutations = await app.evalJs("(() => { window.__revObs.disconnect(); return window.__revMut; })()");
  const atEdge = await revealState(app, '.forward-only-editor');
  parked.mutations = mutations;
  // ---- PARKED - SUPERSEDED by item 211, 2026-10-02 --------------------------------------------------------------------------
  // Kept VERBATIM and no longer run. The interim check required the edge press to REVEAL (mutations > 0). A press that changes nothing must not loop.
  //
  // ok('S2 TERMINATION [interim successor]: one reveal-changing KEY PRESS (ArrowRight onto a marker\'s edge) produces a BOUNDED burst of DOM mutations and then stops - the "unchanged decoration is not rewritten" guard still closes the selectionchange -> redecorate -> setCaret -> selectionchange cycle',
  //   beforeEdge === 5 && atEdge.anyRevealed === true && typeof mutations === 'number' && mutations > 0 && mutations < 40, JSON.stringify({ beforeEdge, revealed: atEdge.anyRevealed, mutations }));
  // ------------------------------------------------------------------
  ok('S2 ITEM 211: ArrowRight onto a marker edge does not reveal it, and the selectionchange listener does not loop',
    beforeEdge === 5 && atEdge.allHidden === true && typeof mutations === 'number' && mutations < 40, JSON.stringify({ beforeEdge, hidden: atEdge.allHidden, mutations }));

  // ==========================================================================
  // S3 — THE SELECTION GUARD. A redecorate restores a COLLAPSED caret, so
  // running one while the writer is extending a selection destroys it.
  //
  // THE SELECTION IS EXTENDED BACKWARDS, and that detail is the entire check.
  // It took two wrong versions to find out why, both of which passed with the
  // selection guard DELETED:
  //
  //   v1 extended three characters WITHIN the bold run. The caret never left
  //   the revealed region, so the decoration was unchanged and the
  //   "unchanged decoration is not rewritten" guard carried the check.
  //   v2 extended FORWARDS from offset 0 across the boundary — and still
  //   passed, because `getCaretOffset` returns the range's START offset, and
  //   a forward Shift+Arrow selection never moves its start. The decoration
  //   is computed from a number that was standing still.
  //
  // Extending BACKWARDS from the end moves the start, dragging it across the
  // boundary into the bold run, so the decoration genuinely differs from the
  // one last written and only the non-collapsed check can save the selection.
  // Falsified by deleting that check: the selection collapses to a caret.
  //
  // The general lesson, which is the one worth keeping: "the state I am
  // testing changed" is an assumption, and here it was wrong twice in a row
  // while the suite stayed green. A check that cannot be made to fail is not
  // evidence of anything.
  //
  // Driven by TRUSTED Shift+Arrow presses rather than a page-built Range — a
  // selection the page assembles itself is a weaker witness than one the
  // browser's own input layer made.
  // ==========================================================================
  const boldPt3 = await centreOf(app, '.forward-only-editor .md-bold');
  if (boldPt3) await realClick(app, boldPt3);
  await app.key('End');
  await sleep(300);
  for (let i = 0; i < 10; i += 1) await app.key('ArrowLeft', { shift: true });
  await sleep(400);
  const pageSel = await selectionNow(app);
  ok('S3 (page): a live NON-COLLAPSED selection survives being extended BACKWARDS across a reveal boundary — ten trusted Shift+ArrowLeft presses from the end drag the range START into the bold run, where the decoration genuinely differs from the one last written, and the ten characters are still selected because revealAtCaret declines outright while a selection is open',
    pageSel.none === false && pageSel.collapsed === false && pageSel.length === 10, JSON.stringify(pageSel));

  // ==========================================================================
  // S4 — THE CARD SURFACE. What FX5 S6 built must still work, on the new
  // signal, and the selection defect its enumerated pair carried must be gone.
  // ==========================================================================
  await freshDesk(app);
  const seededBoard = await seed(app, {
    id: 'rev-board', text: 'reveal board', createdAt: '2026-04-02T00:00:00.000Z',
    origin: 'loose', pageType: 'board', projectId: null,
    boxes: [{ id: 'rc', kind: 'text', x: 0.06, y: 0.06, w: 0.6, h: 0.18, z: 1, text: TEXT }],
  });
  ok('S4 (setup): the board and its card are seeded and landed', seededBoard);
  await app.reload();
  await app.evalJs("location.hash = '#/page/rev-board'");
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'board framed' });
  await sleep(700);

  const cardThere = await app.evalJs("!!document.querySelector('[data-box-id=\"rc\"]')");
  ok('S4 (setup): the card is on the board', cardThere);
  if (cardThere) {
    await app.evalJs(`(() => {
      const el = document.querySelector('[data-box-id="rc"]');
      const r = el.getBoundingClientRect();
      el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 }));
    })()`);
    await app.waitFor("!!document.querySelector('.board-popup-editor')", { label: 'card popup open' });
    await sleep(400);
  }

  const cardBefore = await revealState(app, '.board-popup-editor');
  ok('S4 (precondition): the card popup decorates and its markers start collapsed',
    cardBefore.marks >= 2 && cardBefore.allHidden === true, JSON.stringify(cardBefore));

  const cardBoldPt = await centreOf(app, '.board-popup-editor .md-bold');
  ok('S4 (setup): the card\'s bold run has a real on-screen box to click', !!cardBoldPt, JSON.stringify(cardBoldPt));
  if (cardBoldPt) await realClick(app, cardBoldPt);
  const cardAfter = await revealState(app, '.board-popup-editor');
  // ---- PARKED - SUPERSEDED by the interim reveal rule, 2026-10-01 ----------------------------------------------------------
  // Kept VERBATIM and no longer run, for the reason given at S1: the card popup shares the register, so a mid-word click reveals
  // nothing there either. Successors: the mid-word click and the same walk, on the card.
  //
  // ok('S4: a REAL click into the card\'s bold run reveals its markers — FX5 S6\'s behaviour is preserved across the signal change, not merely assumed to be',
  //   cardAfter.anyRevealed === true, JSON.stringify(cardAfter));
  // ------------------------------------------------------------------
  parked.cardClick = cardAfter;
  ok('S4 [interim successor]: a REAL click in the middle of the card\'s bold word reveals NOTHING', cardAfter.allHidden === true, JSON.stringify(cardAfter));
  const cardWalk = await walkLine(app, '.board-popup-editor');
  parked.cardWalk = cardWalk;
  // ---- PARKED - SUPERSEDED by item 211, 2026-10-02 --------------------------------------------------------------------------
  // Kept VERBATIM and no longer run. The interim rule showed the card's marks while the caret touched a marker span; under
  // item 211 they never show. Successor beneath: the card's walk stays hidden at every stop, edges included.
  //
  // ok('S4 [interim successor] THE RULE on the card, at every caret stop: markers show exactly when the caret touches a marker span - the two surfaces still share one register',
  //   lawHolds(cardWalk) && sawBoth(cardWalk), JSON.stringify(cardWalk.map((x) => `${x.off}${x.revealed ? '+' : '-'}`).join(' ')));
  // ------------------------------------------------------------------
  ok('S4 ITEM 211: at every caret stop on the card, including the marker edges, every mark stays hidden - the two surfaces still share one register',
    neverShown(cardWalk) && cardWalk.some((x) => x.off >= 6 && x.off <= 14), JSON.stringify(cardWalk.map((x) => `${x.off}${x.revealed ? '+' : '-'}`).join(' ')));
  // leave the caret ON a marker, so the Home check below still has something to re-collapse
  await app.key('Home');
  await sleep(200);
  for (let i = 0; i < 6; i += 1) { await app.key('ArrowRight'); await sleep(120); }
  const cardAtEdge = await revealState(app, '.board-popup-editor');
  // ---- PARKED - SUPERSEDED by item 211, 2026-10-02 --------------------------------------------------------------------------
  // Kept VERBATIM and no longer run. This precondition needed the edge to REVEAL so the Home check below had something to
  // re-collapse. Under item 211 nothing reveals, so the successor asserts the edge stays hidden and Home keeps it so.
  //
  // ok('S4 (precondition for the Home check): with the caret at the bold word\'s leading edge the markers ARE shown', cardAtEdge.anyRevealed === true, JSON.stringify(cardAtEdge));
  // ------------------------------------------------------------------
  ok('S4 ITEM 211: with the caret at the bold word\'s leading edge the markers stay hidden', cardAtEdge.allHidden === true, JSON.stringify(cardAtEdge));

  // The enumerated pair's own path: a nav key. It must still work now that
  // nothing listens to keyup — this is the check that would catch a swap that
  // quietly dropped a case the old list covered.
  await app.key('Home');
  await sleep(350);
  const cardAfterHome = await revealState(app, '.board-popup-editor');
  ok('S4: a trusted Home press re-collapses them — every path the retired NAV_KEYS list enumerated is still covered, because selectionchange fires for all of them',
    cardAfterHome.allHidden === true, JSON.stringify(cardAfterHome));

  // Backwards from the end, for the reason S3 spells out: only a moving range
  // START changes the decoration, because that is the offset the register reads.
  await app.key('End');
  await sleep(300);
  for (let i = 0; i < 10; i += 1) await app.key('ArrowLeft', { shift: true });
  await sleep(400);
  const cardSel = await selectionNow(app);
  ok('S4 THE DEFECT THE SWAP FIXES: a selection can be extended across a reveal boundary on a card — the retired mouseup/keyup pair redecorated UNCONDITIONALLY on every nav keyup and every mouseup, and a redecorate restores a COLLAPSED caret, so a selection made this way was destroyed as it was made',
    cardSel.none === false && cardSel.collapsed === false && cardSel.length === 10, JSON.stringify(cardSel));

  // ==========================================================================
  // S5 — THE TEXT IS NEVER TOUCHED. Every check above rewrote innerHTML
  // repeatedly on a live editor that reads itself back into the store on each
  // keystroke; the whole feature is worthless if it costs a character.
  // ==========================================================================
  await sleep(900); // the debounced flush lands before the probe reads (the standing law)
  const stored = await app.evalJs(`(() => {
    const e = JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(x => x.id === 'rev-board');
    return e && e.boxes && e.boxes[0] ? e.boxes[0].text : null;
  })()`);
  ok('S5: the card\'s stored text is byte-identical after every reveal, re-collapse and selection above — the decoration is a DISPLAY pass and the markers never leave the store',
    stored === TEXT, JSON.stringify({ stored, expected: TEXT }));
});

for (const c of checks) {
  // eslint-disable-next-line no-console
  console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
}
// === PARKED - gated behind HARNESS_PARKED=1 ============================================================================
// FOUR parks, all from the interim reveal rule of 2026-10-01 (each original stands verbatim above, beside its successor). The
// count is the check: 4.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  const pok = (name, pass, detail = '') => parkedChecks.push({ name, pass, detail });
  // ---- PARKED - SUPERSEDED by item 211 (PR #7: hidden marks never show), 2026-10-02 ----
  // The four records below keep their quoted original and their interim note byte-for-byte, and chain the item 211 note
  // after it (a chain, never a rewrite — audit-parked-records.mjs). Each interim CONDITION (lawHolds/sawBoth/turnsOnAndOff,
  // mutations > 0) required a mark to show, and follows reality now: neverShown, bounded.
  //   !!parked.pageClick && parked.pageClick.allHidden === true && !!parked.pageWalk && lawHolds(parked.pageWalk) && sawBoth(parked.pageWalk), JSON.stringify(parked.pageClick));
  pok('PARKED (was "S1 THE TICKET: a REAL click into the bold run reveals its own markers on the page") - interim rule: a mid-word click reveals nothing, and the markers show exactly at the marker spans along the walk; then item 211 (2026-10-02): the walk never reveals either',
    !!parked.pageClick && parked.pageClick.allHidden === true && !!parked.pageWalk && neverShown(parked.pageWalk), JSON.stringify(parked.pageClick));
  //   !!parked.pageWalk && turnsOnAndOff(parked.pageWalk) && !!parked.pageAway && parked.pageAway.allHidden === true, JSON.stringify(parked.pageAway));
  pok('PARKED (was "S1: clicking back out into plain prose RE-COLLAPSES the markers ... asserted together with the reveal that preceded it") - interim rule: the ON is observed on the walk (off, on, off), and the click out leaves all collapsed; then item 211 (2026-10-02): the walk stays off, and the click out leaves all collapsed',
    !!parked.pageWalk && neverShown(parked.pageWalk) && !!parked.pageAway && parked.pageAway.allHidden === true, JSON.stringify(parked.pageAway));
  //   typeof parked.mutations === 'number' && parked.mutations > 0 && parked.mutations < 40, JSON.stringify({ mutations: parked.mutations }));
  pok('PARKED (was "S2 TERMINATION: one reveal-changing click produces a BOUNDED burst of DOM mutations") - interim rule: the reveal-changing gesture is a key press onto a marker edge; still bounded; then item 211 (2026-10-02): the edge press reveals nothing and does not loop',
    typeof parked.mutations === 'number' && parked.mutations < 40, JSON.stringify({ mutations: parked.mutations }));
  //   !!parked.cardClick && parked.cardClick.allHidden === true && !!parked.cardWalk && lawHolds(parked.cardWalk) && sawBoth(parked.cardWalk), JSON.stringify(parked.cardClick));
  pok('PARKED (was "S4: a REAL click into the card\'s bold run reveals its markers") - interim rule: nothing on a mid-word click, and the same rule along the card\'s walk; then item 211 (2026-10-02): nothing along the card\'s walk either',
    !!parked.cardClick && parked.cardClick.allHidden === true && !!parked.cardWalk && neverShown(parked.cardWalk), JSON.stringify(parked.cardClick));
  for (const c of parkedChecks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
  console.log(`\nREVEAL PARKED: ${parkedChecks.length} checks - HARNESS_PARKED=1 armed`);
}
checks.push(...parkedChecks);
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nREVEAL VERIFY: PASS (${checks.length} checks)`
  : `\nREVEAL VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
