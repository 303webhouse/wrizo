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
const realClick = async (app, pt) => {
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
  ok('S1 THE TICKET: a REAL click into the bold run reveals its own markers on the page — the gesture that did nothing before, because nothing re-ran the register when the caret moved without an edit',
    pageAfterClick.anyRevealed === true, JSON.stringify({ ...pageAfterClick, caret: pageCaret }));
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
  ok('S1: clicking back out into plain prose RE-COLLAPSES the markers — the reveal follows the caret both ways, it does not latch on',
    pageAfterAway.allHidden === true, JSON.stringify(pageAfterAway));

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
  const boldPt2 = await centreOf(app, '.forward-only-editor .md-bold');
  if (boldPt2) await realClick(app, boldPt2);
  await sleep(1200);
  const mutations = await app.evalJs("(() => { window.__revObs.disconnect(); return window.__revMut; })()");
  ok('S2 TERMINATION: one reveal-changing click produces a BOUNDED burst of DOM mutations and then stops — the "unchanged decoration is not rewritten" guard is what closes the selectionchange -> redecorate -> setCaret -> selectionchange cycle, and a runaway would show here as hundreds over the same second',
    typeof mutations === 'number' && mutations > 0 && mutations < 40, JSON.stringify({ mutations }));

  // ==========================================================================
  // S3 — THE SELECTION GUARD. The old card pair redecorated unconditionally,
  // and a redecorate restores a COLLAPSED caret: extending a selection
  // destroyed it. Driven by TRUSTED Shift+Arrow presses, not a page-built
  // Range — a selection the page makes itself is a weaker witness.
  // ==========================================================================
  const boldPt3 = await centreOf(app, '.forward-only-editor .md-bold');
  if (boldPt3) await realClick(app, boldPt3);
  for (let i = 0; i < 3; i += 1) await app.key('ArrowRight', { shift: true });
  await sleep(400);
  const pageSel = await selectionNow(app);
  ok('S3 (page): a live NON-COLLAPSED selection survives — three trusted Shift+ArrowRight presses leave three characters selected, because revealAtCaret declines while a selection is open rather than rewriting the DOM under it',
    pageSel.none === false && pageSel.collapsed === false && pageSel.length === 3, JSON.stringify(pageSel));

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
  ok('S4: a REAL click into the card\'s bold run reveals its markers — FX5 S6\'s behaviour is preserved across the signal change, not merely assumed to be',
    cardAfter.anyRevealed === true, JSON.stringify(cardAfter));

  // The enumerated pair's own path: a nav key. It must still work now that
  // nothing listens to keyup — this is the check that would catch a swap that
  // quietly dropped a case the old list covered.
  await app.key('Home');
  await sleep(350);
  const cardAfterHome = await revealState(app, '.board-popup-editor');
  ok('S4: a trusted Home press re-collapses them — every path the retired NAV_KEYS list enumerated is still covered, because selectionchange fires for all of them',
    cardAfterHome.allHidden === true, JSON.stringify(cardAfterHome));

  for (let i = 0; i < 4; i += 1) await app.key('ArrowRight', { shift: true });
  await sleep(400);
  const cardSel = await selectionNow(app);
  ok('S4 THE DEFECT THE SWAP FIXES: a selection can be extended on a card at all — the retired mouseup/keyup pair redecorated unconditionally and a redecorate restores a COLLAPSED caret, so this selection used to be destroyed as it was made',
    cardSel.none === false && cardSel.collapsed === false && cardSel.length === 4, JSON.stringify(cardSel));

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
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nREVEAL VERIFY: PASS (${checks.length} checks)`
  : `\nREVEAL VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
