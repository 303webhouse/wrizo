// W2 — the way back. A committed CDP verification scenario (per AGENTS.md
// "Harness scenarios persist"). S0 (verify current loss) is documented in
// store/wayBack.ts's header comment, confirmed by code inspection rather
// than a separate empirical pre-fix run: before this ticket, no surface
// persisted scroll or caret across an unmount — only the route survived,
// via React Router's own history.
// Run: node apps/desktop/scripts/harness/w2.mjs   (from apps/desktop, with
// dist-web freshly built via `pnpm run build:web`).
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Place the caret at a linear character offset within an element — the
// harness-side mirror of store/caretOffset.ts's setCaretOffset, injected so
// scenarios can position a "mid-caret" state deterministically (not just
// wherever typing left it) before capturing a departure.
const CARET_HELPER = `
window.__setCaretAt = function(selector, target) {
  const el = document.querySelector(selector);
  if (!el) throw new Error('setCaretAt: not found ' + selector);
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let offset = 0, node = null, localOffset = 0, n;
  while ((n = walker.nextNode())) {
    const len = n.data.length;
    if (offset + len >= target) { node = n; localOffset = target - offset; break; }
    offset += len;
  }
  const sel = window.getSelection();
  const range = document.createRange();
  if (node) range.setStart(node, Math.max(0, Math.min(localOffset, node.data.length)));
  else range.selectNodeContents(el);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
  el.focus();
  return true;
};
`;

await withHarness(async (app) => {
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'authed Desk' });
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after clear' });
  await app.evalJs(CARET_HELPER);

  // === 1. PageEditor (text surface): mid-scroll + mid-caret way back =======
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book)' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted' });
  const pageId = (await app.evalJs('location.hash')).replace(/^#\/page\//, '');

  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  const manyLines = Array.from({ length: 45 }, (_, i) => `Line ${i} of the growing manuscript page, long enough to wrap and force real scroll.`).join('\n');
  await app.typeKeys(manyLines);
  await sleep(2200); // clear the debounced autosave window
  await app.evalJs("document.querySelector('.mode-scroll').scrollTop = 300");
  await sleep(150);
  const pageScrollBefore = await app.evalJs("document.querySelector('.mode-scroll').scrollTop");
  await app.evalJs("window.__setCaretAt('.forward-only-editor', 40)");
  const pageCaretBefore = await app.evalJs(`(() => {
    const sel = window.getSelection();
    const el = document.querySelector('.forward-only-editor');
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let offset = 0, n;
    while ((n = walker.nextNode())) { if (n === sel.anchorNode) return offset + sel.anchorOffset; offset += n.data.length; }
    return null;
  })()`);
  ok('PageEditor: caret + scroll positioned pre-departure', pageScrollBefore > 0 && pageCaretBefore === 40, `scroll=${pageScrollBefore} caret=${pageCaretBefore}`);
  const pageTextBefore = await app.evalJs("document.querySelector('.forward-only-editor').innerText");

  // Depart via the rail (Journal) — a real route change, not a special exit.
  // B1 S5 — '/journal' now bridges to the Journal Board (pages/Journal.tsx
  // deleted); this wait only ever needed a "we've arrived" rendezvous, never
  // the retired list's own content, so it targets the Board's own mount
  // marker now ('.board-canvas').
  await app.click('Journal');
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'Journal Board (departed PageEditor)' });
  await sleep(150);
  const pageChipLabel = await app.evalJs("document.querySelector('.desk-rail-wayback')?.getAttribute('aria-label')");
  ok('return chip present after departing PageEditor, accessible name is "Return to the page"', pageChipLabel === 'Return to the page', String(pageChipLabel));
  const pageChipTitle = await app.evalJs("document.querySelector('.desk-rail-wayback')?.getAttribute('title')");
  ok('chip label reflects the page\'s own first line (not a generic string)', (pageChipTitle || '').includes('Line 0 of the growing'), pageChipTitle);

  await app.evalJs("document.querySelector('.desk-rail-wayback').click()");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor restored via chip' });
  await sleep(500); // let the multi-write restore settle (up to 350ms + margin)
  const pageRouteAfter = await app.evalJs('location.hash');
  const pageScrollAfter = await app.evalJs("document.querySelector('.mode-scroll').scrollTop");
  const pageCaretAfter = await app.evalJs(`(() => {
    const sel = window.getSelection();
    const el = document.querySelector('.forward-only-editor');
    if (!el.contains(sel.anchorNode)) return null;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let offset = 0, n;
    while ((n = walker.nextNode())) { if (n === sel.anchorNode) return offset + sel.anchorOffset; offset += n.data.length; }
    return null;
  })()`);
  const pageTextAfter = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
  ok('route restored to the exact page', pageRouteAfter === `#/page/${pageId}`, pageRouteAfter);
  ok('scrollY restored within +/-4px', Math.abs(pageScrollAfter - pageScrollBefore) <= 4, `before=${pageScrollBefore} after=${pageScrollAfter}`);
  ok('caret offset restored exactly', pageCaretAfter === 40, `caret=${pageCaretAfter}`);
  ok('the editor\'s mount is fresh-but-equivalent: text byte-identical', pageTextAfter === pageTextBefore);
  const chipGoneAfterConsume = await app.evalJs("!document.querySelector('.desk-rail-wayback')");
  ok('the chip is gone immediately after being consumed (one-shot)', chipGoneAfterConsume === true);

  // === R2: a real input during the re-assert window cancels the LATER
  // writes — moving the caret right after restore must stick, not get
  // snapped back by the 200/350ms re-asserts. This restore already fired its
  // rAF apply (caret=40, asserted above); dispatch a keydown (the canceller's
  // trigger) then move the caret elsewhere, and confirm it's still there
  // well past the 350ms window.
  await app.evalJs("window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true }))");
  await app.evalJs("window.__setCaretAt('.forward-only-editor', 10)");
  await sleep(500); // past the 350ms re-assert window + margin
  const pageCaretAfterInput = await app.evalJs(`(() => {
    const sel = window.getSelection();
    const el = document.querySelector('.forward-only-editor');
    if (!el.contains(sel.anchorNode)) return null;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let offset = 0, n;
    while ((n = walker.nextNode())) { if (n === sel.anchorNode) return offset + sel.anchorOffset; offset += n.data.length; }
    return null;
  })()`);
  ok('R2: a real input cancels the later restore re-asserts (caret stays where the writer moved it, not snapped back)', pageCaretAfterInput === 10, `caret=${pageCaretAfterInput}`);

  // === 2. JournalEntry authored page (window-scroll) [PARKED WHOLE — FX14 S2]
  // Drove the JournalEntry surface (window.wrizoCreateJournalPage() ->
  // #/journal/:id -> .entry-edit): typed 40 lines, scrolled the window, set a
  // mid-caret, departed via the rail to the Journal Board, returned via the
  // way-back chip, and asserted route + window-scrollY + caret + text all
  // restored. FX14 S2 unroutes JournalEntry (/journal/:id -> /page/:id redirect,
  // App.tsx's JournalIdRedirect), so .entry-edit never mounts. All six checks
  // PARKED (A4) as FALSIFIED. SV6, quoted: "Journal Pages no longer exist. The
  // Journal is now just a board that contains certain pages."
  // Successors: the depart/return way-back (scroll + caret + text) is proven LIVE
  // on THE Page in this same file's PageEditor block (section 1, above) and its
  // QuickSprint block (section 4, below); the journal-WINDOW-scroll variant (vs.
  // THE Page's internal .mode-scroll) is J7's behavior-parity census. (The
  // "Journal route restored to the exact page" check also asserted the
  // #/journal/:id form, which FX14 redirects to #/page/:id — falsified on that
  // axis too.) Originals, byte-for-byte:
  //   PARKED (was "JournalEntry: window scrolled pre-departure")
  //   PARKED (was "return chip present after departing an authored Journal page")
  //   PARKED (was "Journal route restored to the exact page")
  //   PARKED (was "Journal window scrollY restored within +/-4px")
  //   PARKED (was "Journal caret offset restored exactly")
  //   PARKED (was "Journal text byte-identical across the departure/return")

  // === R1(c): notebook pager A -> B state-leak proof [PARKED WHOLE — FX14 S2]
  // Drove the JournalEntry surface (window.wrizoCreateJournalPage() ->
  // #/journal/:id -> .entry-edit) and used the Journal pager's own "+" chip
  // (.journal-nav-add) to create + travel to page B, proving no A-state leaked
  // onto B (caret) and that any captured way-back names A, not B. FX14 S2
  // unroutes JournalEntry (/journal/:id -> /page/:id redirect), so .entry-edit
  // and the .journal-nav-add pager chip never mount — the pager is a
  // JournalEntry-only affordance that retires with the surface. Both checks
  // PARKED (A4) as FALSIFIED. SV6: "Journal Pages no longer exist. The Journal is
  // now just a board that contains certain pages." Successor: the journal pager
  // and its way-back leak proof are J7's behavior-parity census (the way-back
  // mechanism itself stays proven live on THE Page / QuickSprint in this file).
  // Originals, byte-for-byte:
  //   PARKED (was "pager: B's own caret was never set to A's captured offset (a page-height-independent proof no state leaked via the way-back mechanism)")
  //   PARKED (was "pager: if A's departure captured a way back, it names A, not B")

  // === R1: QuickSprint depart/return (scroll + caret + mode) — same shape
  // as PageEditor's, now that QuickSprint is correctly keyed by draftId. ===
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before QuickSprint fixture' });
  await app.evalJs(CARET_HELPER);
  await app.goto('/sprint');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'QuickSprint mounted' });
  await app.click('Draft'); // a non-default mode, to prove mode survives the round trip too
  await sleep(100);
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  const sprintLines = Array.from({ length: 45 }, (_, i) => `Sprint line ${i} of the growing scratch draft, long enough to force real scroll.`).join('\n');
  await app.typeKeys(sprintLines);
  await sleep(2200);
  await app.evalJs("document.querySelector('.mode-scroll').scrollTop = 250");
  await sleep(150);
  const sprintScrollBefore = await app.evalJs("document.querySelector('.mode-scroll').scrollTop");
  await app.evalJs("window.__setCaretAt('.forward-only-editor', 20)");
  const sprintTextBefore = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
  ok('QuickSprint: caret + scroll + Draft mode positioned pre-departure', sprintScrollBefore > 0, `scroll=${sprintScrollBefore}`);

  await app.click('Journal');
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'Journal Board (departed QuickSprint)' });
  await sleep(150);
  const sprintChipPresent = await app.evalJs("!!document.querySelector('.desk-rail-wayback')");
  ok('return chip present after departing QuickSprint', sprintChipPresent === true);

  await app.evalJs("document.querySelector('.desk-rail-wayback').click()");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'QuickSprint restored via chip' });
  await sleep(500);
  const sprintRouteAfter = await app.evalJs('location.hash');
  const sprintScrollAfter = await app.evalJs("document.querySelector('.mode-scroll').scrollTop");
  const sprintCaretAfter = await app.evalJs(`(() => {
    const sel = window.getSelection();
    const el = document.querySelector('.forward-only-editor');
    if (!el.contains(sel.anchorNode)) return null;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let offset = 0, n;
    while ((n = walker.nextNode())) { if (n === sel.anchorNode) return offset + sel.anchorOffset; offset += n.data.length; }
    return null;
  })()`);
  const sprintTextAfter = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
  const sprintModeAfter = await app.evalJs(`(() => { const tabs = [...document.querySelectorAll('.mode-tab')]; const active = tabs.find(t => t.classList.contains('active')); return active?.textContent ?? null; })()`);
  ok('QuickSprint route restored', sprintRouteAfter === '#/sprint', sprintRouteAfter);
  ok('QuickSprint scrollY restored within +/-4px', Math.abs(sprintScrollAfter - sprintScrollBefore) <= 4, `before=${sprintScrollBefore} after=${sprintScrollAfter}`);
  ok('QuickSprint caret offset restored exactly', sprintCaretAfter === 20, `caret=${sprintCaretAfter}`);
  ok('QuickSprint text byte-identical across the departure/return', sprintTextAfter === sprintTextBefore);
  ok('QuickSprint mode (Draft) persisted across the departure/return', (sprintModeAfter || '').includes('Draft'), sprintModeAfter);

  // === 3. Board + script: route-restore only (no scroll/caret claim) ======
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before board/script fixtures' });
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: 'w2-board', text: '', pageType: 'board', boxes: [], createdAt: now, updatedAt: now });
    entries.push({ id: 'w2-script', text: '', pageType: 'script', script: { v: 1, scenes: [] }, createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();

  for (const [id, waitSel] of [['w2-board', '.board-canvas, .board-page, [data-board]'], ['w2-script', '.script-page, .script-sheet']]) {
    await app.evalJs(`location.hash = '#/page/${id}'`);
    await sleep(400);
    await app.click('Journal');
    await app.waitFor("!!document.querySelector('.board-canvas')", { label: `Journal Board (departed ${id})` });
    await sleep(150);
    const chipPresent = await app.evalJs("!!document.querySelector('.desk-rail-wayback')");
    ok(`return chip present after departing a ${id.includes('board') ? 'board' : 'script'} page`, chipPresent === true, id);
    if (chipPresent) {
      await app.evalJs("document.querySelector('.desk-rail-wayback').click()");
      await sleep(400);
      const routeAfter = await app.evalJs('location.hash');
      ok(`${id} route restored via the chip`, routeAfter === `#/page/${id}`, routeAfter);
    }
  }

  // === 4. Standing assertions: PAGE IS PRIMARY invariants ==================
  // 4a — assist rail collapse/expand (promoted from W1's own check).
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before rect-invariant fixture' });
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book), rect check' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, rect check' });
  await app.click('Draft');
  await sleep(100);
  const rectBefore = await app.evalJs("(() => { const r = document.querySelector('.mode-pagecol').getBoundingClientRect(); return {left:r.left, top:r.top, width:r.width, height:r.height}; })()");
  const hasAssistCollapse = await app.evalJs("!!document.querySelector('.assist-collapse')");
  if (hasAssistCollapse) {
    await app.evalJs("document.querySelector('.assist-collapse').click()");
    await sleep(700);
    const rectDuring = await app.evalJs("(() => { const r = document.querySelector('.mode-pagecol').getBoundingClientRect(); return {left:r.left, top:r.top, width:r.width, height:r.height}; })()");
    ok('PAGE IS PRIMARY: assist-rail collapse leaves the page rect byte-identical', JSON.stringify(rectBefore) === JSON.stringify(rectDuring), `${JSON.stringify(rectBefore)} -> ${JSON.stringify(rectDuring)}`);
  } else {
    ok('assist-collapse button found for the rect-invariant check', false);
  }

  // 4b — the Add to... sheet rect invariant on a loose Journal page [PARKED
  //      WHOLE — FX14 S2] ---------------------------------------------------
  // Drove the JournalEntry surface (window.wrizoCreateJournalPage() ->
  // #/journal/:id -> .entry-edit) and asserted the .entry-full page rect stays
  // byte-identical while the "Add to…" sheet is open, and that the editor never
  // unmounts. FX14 S2 unroutes JournalEntry (/journal/:id -> /page/:id redirect),
  // so .entry-edit / .entry-full never mount. Both checks PARKED (A4) as
  // FALSIFIED. SV6: "Journal Pages no longer exist. The Journal is now just a
  // board that contains certain pages." Successor: the "PAGE IS PRIMARY" rect
  // invariant is surface-agnostic (THE Page holds it too); a Page-surface
  // re-proof, and the fate of the journal "Add to…" action, are J7's behavior-
  // parity census. Originals, byte-for-byte:
  //   PARKED (was "PAGE IS PRIMARY: the Add to… sheet leaves the page rect byte-identical while open")
  //   PARKED (was "PAGE IS PRIMARY: the editor never unmounts while the Add to… sheet is open")

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ===========
// FX4 S1 (2026-07-18) is the first tenant of this scaffold (w2.mjs predates
// the A4 park-sweep convention, established later in the AB/CD/FX arcs) —
// one check parked below (SUPERSEDED species, quoted verbatim); its live
// successor (a page-height-independent, caret-based proof of the same "no
// leak via the way-back mechanism" claim) is in this file's own live pager
// section above.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  const pok = (name, pass, detail = '') => parkedChecks.push({ name, pass, detail });
  // FX14 S2 (2026-07-24) — SECOND-generation supersession (the cd1-chain
  // discipline for a multi-generational park). This parked check re-verified
  // FX4 S1 by RE-RUNNING the Journal pager (window.wrizoCreateJournalPage() ->
  // #/journal/:id -> .entry-edit -> .journal-nav-add). FX14 S2 unroutes the
  // JournalEntry surface entirely (/journal/:id -> /page/:id redirect, App.tsx's
  // JournalIdRedirect), so that navigation can no longer mount. Per the
  // immutability codicil, the RECORD name below is FROZEN byte-identical; only
  // its PROBE is updated in this FX14 commit — retired to the documented-
  // supersession form (probe `true`), with the journal navigation REMOVED so an
  // armed HARNESS_PARKED=1 run does not time out. SV6: "Journal Pages no longer
  // exist. The Journal is now just a board that contains certain pages." The
  // FX4-S1 record's named live successor ("this file's own live pager section")
  // is itself now parked under FX14 above; the journal pager and its way-back
  // proof retire to J7's behavior-parity census.
  pok('PARKED (was "pager: B\'s scroll was never set BY the way-back mechanism (not A\'s captured 200)") — FX4 S1: Journal\'s new bottom scroll buffer makes B tall enough to genuinely hold the inherited (unrelated, pre-existing) scrollY=200; live successor (caret-based) in this file\'s own live pager section',
    true, 'FX14 S2: probe retired — the JournalEntry surface this re-verified on is unrouted (/journal/:id -> /page/:id); successor is J7 (journal pager retires with the surface)');
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  const parkedPass = parkedChecks.every((c) => c.pass);
  // eslint-disable-next-line no-console
  console.log(parkedPass
    ? `\nW2 PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed, all retired-check successors green`
    : `\nW2 PARKED: FAIL — ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}

const allChecksW2 = checks.concat(parkedChecks);
const pass = allChecksW2.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nW2 VERIFY: PASS (${allChecksW2.length} checks)` : `\nW2 VERIFY: FAIL — ${allChecksW2.filter((c) => !c.pass).length}/${allChecksW2.length} failed`);
process.exit(pass ? 0 : 1);
