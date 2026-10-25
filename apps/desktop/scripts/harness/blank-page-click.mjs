// BLANK-PAGE CLICK (Fable, Oct 22 - Page-readiness, "just let me write").
// CORRECTED (ledger: the lane on 28c3d619, the CSS mutant SURVIVED): the prose half was NEVER broken. A blank page's editor IS one line tall
// (29 px), but ModeStage's scroller (.mode-scroll, which holds the whole sheet) has onClick={focusEditor} - a press anywhere on the paper focuses
// the editor, which collapses its caret to the END. FIX's read-only answer missed that handler; the flex column built on it (52fb2be6) was not
// needed and is REMOVED. The prose B and T checks stay as regression guards, and the mutant now removes what really works: the scroller's click.
// The SCREENPLAY half is real (ScriptEditor's click handler ignored a press that missed every element) and its fix stays.
//
//   For each of FREE WRITE, DRAFT, DRAFT WITH THE TYPEWRITER and SCREENPLAY:
//   B  a BLANK page: a real press on the empty paper below the first line, then typing - the words land on the page (stored)
//   T  a page WITH TEXT: a real press below the LAST line, then one letter - it lands at the END of the text (the caret went to the end)
//   Each press point is PROVEN to lie below the last line of text (a named premise), so a press that happened to land on a line proves nothing.
//   M  (PARKED - the flex column it tested is gone) THE MUTANT (runtime): with the sheet's flex column taken away by an injected style (asserted
//      to have LANDED - the computed display is 'block'), the Draft blank-page press no longer reaches the editor.
//   M2 its successor: the scroller's own click swallowed before the app sees it (a document capture listener; it COUNTS what it swallowed, so its
//      landing is asserted) - the Draft blank-page press no longer reaches the editor.
//   SCREENPLAY (Fable's ruling, Oct 22: include it - a press BELOW the last script element activates it with the caret at its end; a blank
//   script gets its first element, focused; presses anywhere else are unchanged): B and T above, plus
//   U  a press on the paper BESIDE an element (not below the last) activates nothing
//   MS the Screenplay mutant (runtime): the click on bare script paper swallowed before the app sees it (counted, so its landing is asserted) -
//      the press below the last element no longer activates it.
//
// Seeding goes through the app's seams; the per-page mode and typewriter keys are this device's own UI keys (not collections). Input is trusted
// CDP mouse and key events. Needs a box turn.
// Run: WS_BOX_TURN=<token> node scripts/harness/blank-page-click.mjs   (from apps/desktop, dist-web built)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const mouse = (app, type, x, y) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'mouse' });
const click = async (app, x, y) => { await app.mouseMove(x, y); await mouse(app, 'mousePressed', x, y); await mouse(app, 'mouseReleased', x, y); };
const stored = (app, id) => app.evalJs(`(JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((e) => e.id === ${JSON.stringify(id)}) || null)`);

const MODES = [
  { key: 'fw', name: 'Free Write', mode: 'journal' },
  { key: 'dr', name: 'Draft', mode: 'drafting' },
  { key: 'tw', name: 'Draft with the typewriter', mode: 'drafting', typewriter: true },
  { key: 'sp', name: 'Screenplay', script: true },
];
const PROSE_TEXT = 'First line\nSecond line\nThird line';
const scriptDoc = (withText) => withText
  ? { v: 1, scenes: [{ id: 'h1', heading: { id: 'h1', t: 'scene', text: 'INT. KITCHEN - NIGHT' }, body: [{ id: 'a1', t: 'action', text: 'She waits.' }] }] }
  : { v: 1, scenes: [{ id: 'h0', heading: { id: 'h0', t: 'scene', text: '' }, body: [] }] };

// THE PRESS POINT: below the LAST line of text on the visible paper. Prose: the editor's last row (or, with no row, the editor's first 30 px);
// screenplay: the last script element. Returned with the line's bottom, so the caller can assert the premise.
const pressPoint = (app, script) => app.evalJs(`(() => {
  const vh = window.innerHeight;
  if (${script}) {
    const seq = document.querySelector('.script-sequence'); const sheet = document.querySelector('.script-sheet');
    if (!seq || !sheet) return null;
    const els = [...seq.querySelectorAll('.script-el')]; const last = els[els.length - 1];
    const lineBottom = last ? last.getBoundingClientRect().bottom : sheet.getBoundingClientRect().top + 30;
    const s = sheet.getBoundingClientRect();
    const y = Math.min(lineBottom + 120, Math.min(s.bottom, vh) - 30);
    return { x: Math.round(s.left + s.width * 0.5), y: Math.round(y), lineBottom: Math.round(lineBottom), paperBottom: Math.round(Math.min(s.bottom, vh)) };
  }
  const ed = document.querySelector('.forward-only-editor'); const sheet = document.querySelector('.wz-ink-sheet');
  if (!ed || !sheet) return null;
  const rows = [...ed.querySelectorAll('.wz-row')].filter((r) => r.getBoundingClientRect().height > 0);
  const er = ed.getBoundingClientRect();
  const lineBottom = rows.length ? rows[rows.length - 1].getBoundingClientRect().bottom : er.top + 30;
  const s = sheet.getBoundingClientRect();
  const scroller = sheet.parentElement ? sheet.parentElement.getBoundingClientRect() : s;
  const paperBottom = Math.min(s.bottom, scroller.bottom, vh);
  const y = Math.min(lineBottom + 140, paperBottom - 30);
  return { x: Math.round(er.left + er.width * 0.5), y: Math.round(y), lineBottom: Math.round(lineBottom), paperBottom: Math.round(paperBottom) };
})()`);
// PAGE-SIZE (park audit, Oct 24): the press point on a ZOOMED page. The zoom holds the writing line at the band's anchor (60% of the column) and the
// band fades the page out below it; the ink sheet ends with the text, and the paper the writer sees below the line is the scroller's own padding
// (its click focuses the editor - the very mechanism B and T guard). So: 40px below the last line - inside the visible fade - on the scroller.
const pressPointZoomed = (app) => app.evalJs(`(() => {
  const vh = window.innerHeight; const ed = document.querySelector('.forward-only-editor'); const sc = ed && ed.closest('.mode-scroll'); const page = ed && ed.closest('.mode-page');
  const stage = document.querySelector('.desk-frame-stage'); if (!ed || !sc || !page) return null;
  const rows = [...ed.querySelectorAll('.wz-row')].filter((r) => r.getBoundingClientRect().height > 0);
  const er = ed.getBoundingClientRect();
  const lineBottom = rows.length ? rows[rows.length - 1].getBoundingClientRect().bottom : er.top + 30;
  const paperBottom = Math.min(sc.getBoundingClientRect().bottom, page.getBoundingClientRect().bottom, stage ? stage.getBoundingClientRect().bottom : vh, vh);
  const x = Math.round(er.left + er.width * 0.5); const y = Math.round(Math.min(lineBottom + 40, paperBottom - 10));
  const hit = document.elementFromPoint(x, y);
  return { x, y, lineBottom: Math.round(lineBottom), paperBottom: Math.round(paperBottom), zoom: true, onScroller: !!hit && sc.contains(hit) };
})()`);
const bpcPs = [];   // page-size's park audit: the zoomed cases' press points, for the parked records
const focusedIn = (app, script) => app.evalJs(`(() => { const root = document.querySelector(${JSON.stringify(script ? '.script-sequence' : '.forward-only-editor')}); return !!root && !!document.activeElement && root.contains(document.activeElement); })()`);
// the editor saves on its own debounce: wait on the STORED text, never on a flush call
const waitStored = async (app, id, test) => { let row = null; for (let i = 0; i < 24; i += 1) { row = await stored(app, id); if (row && test(row.text || '')) return row; await sleep(250); } return row; };

const pageId = (m, kind) => `bpc-${m.key}-${kind}`;
const openPage = async (app, m, kind) => {
  await app.evalJs("location.hash = '#/'"); await sleep(300);
  await app.evalJs(`location.hash = '#/page/${pageId(m, kind)}'`);
  const ready = m.script ? "!!document.querySelector('.script-sequence .script-el')" : "!!document.querySelector('.forward-only-editor')";
  const there = await waitSoft(app, ready, { label: `${m.name} ${kind}`, timeout: 10000 });
  await sleep(900);
  // start from a state where the editor does NOT hold focus (a blank page focuses itself on open; the writer has since clicked elsewhere)
  await app.evalJs('(() => { const a = document.activeElement; if (a && a !== document.body && a.blur) a.blur(); return true; })()');
  await sleep(150);
  return there;
};

const runCase = async (app, m, kind) => {
  const id = pageId(m, kind);
  const there = await openPage(app, m, kind);
  if (!there) { ok(`${m.name} ${kind === 'blank' ? 'B' : 'T'} fixture: the page opened`, false, await app.evalJs('location.hash')); return; }
  // ---- PARKED FOR THE ZOOMED REGIME - SUPERSEDED there by page-size (Nick + Fable, Oct 23; Cursor's mockup): on a page in the Typewriter zoom the
  // writing line is held at 60% of the column and the band fades the page out below it; the ink sheet ends with the text (lane 3: the line's foot at
  // 601-623, the sheet's at 614-623), so "140px below the last line, on the sheet" does not exist there. The premise below is VERBATIM and runs
  // unchanged wherever the page is NOT zoomed; on a zoomed page its successor runs instead (the press 40px below the line, inside the visible fade,
  // on the scroller whose click is the mechanism). One record per zoomed case in the parked section.
  const zoomed = !m.script && (await app.evalJs("document.querySelector('.mode-pagecol')?.getAttribute('data-zoom') === 'true'"));
  const p = zoomed ? await pressPointZoomed(app) : await pressPoint(app, !!m.script);
  let below;
  if (!zoomed) {
    below = !!p && p.y > p.lineBottom + 10 && p.y < p.paperBottom;
    ok(`${m.name} ${kind === 'blank' ? 'B' : 'T'} (premise): the press point lies on the paper BELOW the last line of text`, below, JSON.stringify(p));
  } else {
    below = !!p && p.y > p.lineBottom + 10 && p.y < p.paperBottom && p.onScroller;
    bpcPs.push({ name: `${m.name} ${kind === 'blank' ? 'B' : 'T'}`, p, below });
    ok(`${m.name} ${kind === 'blank' ? 'B' : 'T'} (premise) [page-size successor, zoomed]: the press point lies on the paper the writer sees BELOW the last line - inside the band's visible fade, on the scroller`, below, JSON.stringify(p));
  }
  if (!below) return;
  await click(app, p.x, p.y); await sleep(300);
  const focus = await focusedIn(app, !!m.script);
  if (kind === 'blank') {
    await app.typeKeys('Hello paper');
    // a blank Screenplay's one element is a SCENE HEADING, which capitalises what it is given ("HELLO PAPER", ledger: the lane on 28c3d619)
    const said = m.script ? /hello paper/i : /Hello paper/;
    const row = await waitStored(app, id, (t) => said.test(t));
    // ---- PARKED - SUPERSEDED (the lane on 28c3d619): the words LANDED on the Screenplay ("HELLO PAPER", focus true) - this expected the typed case
    // on a scene heading. Kept VERBATIM and no longer run; the successor reads a Screenplay heading case-insensitively, prose exactly as before.
    // ok(`${m.name} B: a press on the EMPTY PAPER of a blank page, then typing - the words land on the page`,
    //   focus && !!row && /Hello paper/.test(row.text || ''), JSON.stringify({ focus, stored: row && row.text, p }));
    ok(`${m.name} B [heading-case successor]: a press on the EMPTY PAPER of a blank page, then typing - the words land on the page (a Screenplay's scene heading in its own capitals)`,
      focus && !!row && said.test(row.text || ''), JSON.stringify({ focus, stored: row && row.text, p }));
  } else {
    await app.typeKeys('Z');
    const want = m.script ? 'She waits.Z' : 'Third lineZ';
    const row = await waitStored(app, id, (t) => t.includes(want));
    ok(`${m.name} T: a press BELOW THE LAST LINE of a page with text puts the caret at the END - one letter lands after the last word`,
      focus && !!row && (row.text || '').includes(want), JSON.stringify({ focus, stored: row && row.text, want, p }));
  }
};

await withHarness(async (app) => {
  await app.emulateDpr(1, 1600, 940);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
  const now = new Date().toISOString();
  for (const m of MODES) {
    for (const kind of ['blank', 'text']) {
      const id = pageId(m, kind);
      const row = m.script
        ? { id, text: '', pageType: 'script', script: scriptDoc(kind === 'text'), createdAt: now, origin: null, source: 'page' }
        : { id, text: kind === 'text' ? PROSE_TEXT : '', createdAt: now, origin: null, source: 'page' };
      await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify(row)})`);
      if (m.mode) await app.evalJs(`localStorage.setItem('wrizo-mode-page-${id}', '${m.mode}')`);
      await app.evalJs(`localStorage.setItem('wrizo-typewriter-page-${id}', '${m.typewriter ? 'on' : 'off'}')`);
    }
  }
  await app.evalJs('window.wrizoFlushNow()');
  await sleep(400);
  ok('fixture: eight pages seeded through the seams (four modes, blank and with text)', true);

  for (const m of MODES) {
    await runCase(app, m, 'blank');
    await runCase(app, m, 'text');
  }

  // ---- PROSE, Fable's correction (Oct 22, on 0e713e7a): ONLY a press BELOW the last line goes to the END (T, above). A press in a SIDE MARGIN
  // beside a line goes to the nearest spot on THAT line (the browser's caret-from-point), never the end of the document; a press ON the text is
  // unchanged. Each on the Draft page with text, re-seeded fresh; each press point a named premise. The margins are the PAPER's (.mode-page's
  // padding): the left one lies outside the scroller, the right one inside its padding - both are tested.
  const dm = MODES[1];
  const dId = pageId(dm, 'text');
  const fresh = async () => {
    await app.evalJs("location.hash = '#/'"); await sleep(300);
    await app.evalJs(`window.wrizoPatchEntry(${JSON.stringify(dId)}, { text: ${JSON.stringify(PROSE_TEXT)} })`);
    await app.evalJs('window.wrizoFlushNow()'); await sleep(250);
    return openPage(app, dm, 'text');
  };
  // a point level with row `i` (0-based): in the paper's LEFT margin, its RIGHT margin, or ON the text `frac` of the way along the row's own text
  const rowPoint = (i, where, frac = 0.5) => app.evalJs(`(() => {
    const ed = document.querySelector('.forward-only-editor'); const page = ed && ed.closest('.mode-page'); if (!ed || !page) return null;
    const rows = [...ed.querySelectorAll('.wz-row')].filter((r) => r.getBoundingClientRect().height > 0); const row = rows[${i}]; if (!row) return null;
    const rr = row.getBoundingClientRect(); const er = ed.getBoundingClientRect(); const pr = page.getBoundingClientRect(); const y = Math.round(rr.top + rr.height / 2);
    const where = ${JSON.stringify(where)}; let x;
    if (where === 'left') x = Math.round(Math.max(pr.left + 4, er.left - 14));
    else if (where === 'right') x = Math.round(Math.min(pr.right - 4, er.right + 14));
    else { const range = document.createRange(); range.selectNodeContents(row); const tr = [...range.getClientRects()].filter((r) => r.width > 0); const t = tr.length ? tr[0] : rr;
      x = Math.round(t.left + (t.right - t.left) * ${frac}); }
    const hit = document.elementFromPoint(x, y);
    return { x, y, onEditor: !!hit && ed.contains(hit), onPaper: !!hit && page.contains(hit), hit: hit ? hit.className || hit.tagName : null };
  })()`);
  const lineAt = (text, n) => (text || '').split('\n')[n];
  // S-left: a press in the LEFT margin beside "Second line" -> the start of THAT line
  if (await fresh()) {
    const p = await rowPoint(1, 'left');
    const okL = !!p && !p.onEditor && p.onPaper;
    ok('Draft S-left (premise): the press point is in the paper\'s LEFT margin, off the editor, level with "Second line"', okL, JSON.stringify(p));
    if (okL) {
      await click(app, p.x, p.y); await sleep(300); await app.typeKeys('Q');
      const row = await waitStored(app, dId, (t) => t.includes('Q'));
      ok('Draft S-left: a press in the left margin beside a line puts the caret on THAT line at its nearest spot (its start) - never the end of the document',
        !!row && lineAt(row.text, 1) === 'QSecond line' && lineAt(row.text, 2) === 'Third line', JSON.stringify({ stored: row && row.text, p }));
    }
  } else ok('Draft S-left fixture: the Draft page with text reopened', false, '');
  // S-right: a press in the RIGHT margin beside "First line" -> the end of THAT line
  if (await fresh()) {
    const p = await rowPoint(0, 'right');
    const okR = !!p && !p.onEditor && p.onPaper;
    ok('Draft S-right (premise): the press point is in the paper\'s RIGHT margin, off the editor, level with "First line"', okR, JSON.stringify(p));
    if (okR) {
      await click(app, p.x, p.y); await sleep(300); await app.typeKeys('R');
      const row = await waitStored(app, dId, (t) => t.includes('R'));
      ok('Draft S-right: a press in the right margin beside a line puts the caret on THAT line at its nearest spot (its end) - never the end of the document',
        !!row && lineAt(row.text, 0) === 'First lineR' && lineAt(row.text, 2) === 'Third line', JSON.stringify({ stored: row && row.text, p }));
    }
  } else ok('Draft S-right fixture: the Draft page with text reopened', false, '');
  // O: a press ON the text, a little before the middle of "Third line" -> the browser's own caret, unchanged (not its end, not its start)
  if (await fresh()) {
    const p = await rowPoint(2, 'on', 0.45);
    const okO = !!p && p.onEditor;
    ok('Draft O (premise): the press point is ON the text, part-way along "Third line"', okO, JSON.stringify(p));
    if (okO) {
      await click(app, p.x, p.y); await sleep(300); await app.typeKeys('X');
      const row = await waitStored(app, dId, (t) => t.includes('X'));
      const l3 = lineAt(row && row.text, 2) || '';
      ok('Draft O: a press ON the text is unchanged - the letter lands where it was pressed, inside "Third line" (not at its end, not at its start)',
        !!row && l3.length === 'Third line'.length + 1 && !l3.endsWith('X') && !l3.startsWith('X') && lineAt(row.text, 0) === 'First line',
        JSON.stringify({ stored: row && row.text, p }));
    }
  } else ok('Draft O fixture: the Draft page with text reopened', false, '');

  // ---- U (Fable's ruling: "presses anywhere else are unchanged"): on the Screenplay with text, a press on the paper BESIDE an element - in the
  // sheet's margin, level with the scene heading, so NOT below the last element - activates nothing
  const sp = MODES[3];
  if (await openPage(app, sp, 'text')) {
    const side = await app.evalJs(`(() => { const sheet = document.querySelector('.script-sheet'); const els = [...document.querySelectorAll('.script-sequence .script-el')];
      if (!sheet || els.length < 2) return null; const s = sheet.getBoundingClientRect(); const first = els[0].getBoundingClientRect(); const last = els[els.length - 1].getBoundingClientRect();
      const x = Math.round(s.left + 6), y = Math.round(first.top + first.height / 2); const hit = document.elementFromPoint(x, y);
      return { x, y, aboveLastBottom: y < last.bottom, onElement: !!(hit && hit.closest('.script-el')) }; })()`);
    if (side && side.aboveLastBottom && !side.onElement) {
      await click(app, side.x, side.y); await sleep(300);
      const focusSide = await focusedIn(app, true);
      ok('Screenplay U: a press on the paper BESIDE an element (not below the last one) activates nothing - presses anywhere else are unchanged', focusSide === false, JSON.stringify({ side, focusSide }));
    } else ok('Screenplay U fixture: a margin point level with the heading, off every element, above the last element\'s bottom', false, JSON.stringify(side));
  } else ok('Screenplay U fixture: the Screenplay with text opened', false, '');

  // ---- MS: the Screenplay mutant - the press on bare script paper is swallowed before the app's handler (a document capture listener that stops
  // exactly the clicks this fix handles: inside .script-sequence, not on an element; it COUNTS what it swallowed, so its landing is asserted).
  // The blank Screenplay press then no longer reaches an element - the Screenplay checks depend on the fix's branch.
  await app.evalJs(`window.wrizoPatchEntry(${JSON.stringify(pageId(sp, 'blank'))}, { text: '', script: ${JSON.stringify(scriptDoc(false))} })`);
  await app.evalJs('window.wrizoFlushNow()');
  await sleep(300);
  if (await openPage(app, sp, 'blank')) {
    await app.evalJs(`(() => { window.__bpcSwallowed = 0; window.__bpcMut = (e) => { const t = e.target; if (t && t.closest && t.closest('.script-sequence') && !t.closest('.script-el')) { window.__bpcSwallowed += 1; e.stopPropagation(); } };
      document.addEventListener('click', window.__bpcMut, true); return true; })()`);
    const p = await pressPoint(app, true);
    let reached = null;
    if (p && p.y > p.lineBottom + 10) { await click(app, p.x, p.y); await sleep(300); reached = await focusedIn(app, true); }
    const swallowed = await app.evalJs('(() => { document.removeEventListener(\'click\', window.__bpcMut, true); return window.__bpcSwallowed; })()');
    ok('MS (mutant): with the press on bare script paper swallowed before the app sees it (the swallow LANDED: counted), a press below the last element no longer activates it - the Screenplay checks depend on the fix',
      swallowed >= 1 && reached === false, JSON.stringify({ swallowed, reached, p }));
  } else ok('MS fixture: the blank Screenplay reopened', false, '');

  // ---- PARKED - SUPERSEDED (the lane on 28c3d619: M SURVIVED - the press reached the editor with the flex column gone, because ModeStage's
  // scroller hands every press on the paper to the editor). The flex column is removed; M is kept VERBATIM below and no longer run. Its successor,
  // M2, removes what really makes the prose half work: the scroller's click.
  // const mm = MODES[1];
  // await app.evalJs(`window.wrizoPatchEntry(${JSON.stringify(pageId(mm, 'blank'))}, { text: '' })`);
  // await app.evalJs('window.wrizoFlushNow()');
  // await sleep(300);
  // if (await openPage(app, mm, 'blank')) {
  //   await app.evalJs("(() => { const s = document.createElement('style'); s.id = 'bpc-mutant'; s.textContent = '.wz-ink-sheet{ display:block !important; }'; document.head.appendChild(s); return true; })()");
  //   await sleep(300);
  //   const landed = await app.evalJs("(() => { const s = document.querySelector('.wz-ink-sheet'); return !!s && getComputedStyle(s).display === 'block'; })()");
  //   const p = await pressPoint(app, false);
  //   let reached = null;
  //   if (p && p.y > p.lineBottom + 10) { await click(app, p.x, p.y); await sleep(300); reached = await focusedIn(app, false); }
  //   ok('M (mutant): with the sheet\'s flex column taken away (the injected style LANDED: display block), a press on the blank paper no longer reaches the editor - the check depends on the fix',
  //     landed === true && reached === false, JSON.stringify({ landed, reached, p }));
  //   await app.evalJs("document.getElementById('bpc-mutant')?.remove()");
  // } else ok('M fixture: the Draft blank page reopened', false, '');
  // ---- M2: the scroller's click swallowed before the app sees it (a document capture listener on clicks inside .mode-scroll but outside the
  // editor; it COUNTS them, so its landing is asserted) - the Draft blank-page press must then no longer reach the editor
  const mm = MODES[1];
  await app.evalJs(`window.wrizoPatchEntry(${JSON.stringify(pageId(mm, 'blank'))}, { text: '' })`);
  await app.evalJs('window.wrizoFlushNow()');
  await sleep(300);
  if (await openPage(app, mm, 'blank')) {
    await app.evalJs(`(() => { window.__bpcScrollSwallowed = 0; window.__bpcScrollMut = (e) => { const t = e.target; if (t && t.closest && t.closest('.mode-scroll') && !t.closest('.forward-only-editor')) { window.__bpcScrollSwallowed += 1; e.stopPropagation(); } };
      document.addEventListener('click', window.__bpcScrollMut, true); return true; })()`);
    const p = await pressPoint(app, false);
    let reached = null;
    if (p && p.y > p.lineBottom + 10) { await click(app, p.x, p.y); await sleep(300); reached = await focusedIn(app, false); }
    const swallowed = await app.evalJs('(() => { document.removeEventListener(\'click\', window.__bpcScrollMut, true); return window.__bpcScrollSwallowed; })()');
    ok('M2 (mutant): with the scroller\'s own click swallowed before the app sees it (the swallow LANDED: counted), a press on the blank paper no longer reaches the editor - the prose checks depend on ModeStage\'s focusEditor',
      swallowed >= 1 && reached === false, JSON.stringify({ swallowed, reached, p }));
  } else ok('M2 fixture: the Draft blank page reopened', false, '');
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 500)}]` : ''}`);
if (process.env.HARNESS_PARKED === '1') {
  // PAGE-SIZE'S PARK AUDIT (Oct 24): the press-point premise, parked for the ZOOMED regime - one record per zoomed case, under its original name,
  // re-verifying the new truth from the live run: the paper the writer sees below the line is the band's fade, on the scroller.
  const rec = bpcPs.map((o) => ({ name: `PARKED for the zoomed regime (was "${o.name} (premise): the press point lies on the paper BELOW the last line of text") - page-size: zoomed, the line sits at the band's anchor and the sheet ends with the text; live successor: ${o.name} (premise) [page-size successor, zoomed]`, pass: !!o.below, detail: JSON.stringify(o.p) }));
  for (const c of rec) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}  [${c.detail}]`);
  console.log(rec.length && rec.every((c) => c.pass) ? `\nBLANK-PAGE-CLICK PARKED: PASS (${rec.length} records) - this FILE parks 1 (the press-point premise, zoomed regime; one record per zoomed case)` : `\nBLANK-PAGE-CLICK PARKED: FAIL - ${rec.filter((c) => !c.pass).length}/${rec.length} (${rec.length} zoomed cases)`);
}
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nBLANK-PAGE-CLICK VERIFY: PASS (${checks.length} checks)` : `\nBLANK-PAGE-CLICK VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
