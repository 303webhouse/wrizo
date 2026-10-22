// BLANK-PAGE CLICK (Fable, Oct 22 - Page-readiness, "just let me write"; the CSS route approved: .wz-ink-sheet becomes a flex column so the
// editor fills the paper). On main a new blank page's editor is ONE LINE tall (29 px measured, ledger 128): its wrap asks for min-height:100% of
// .wz-ink-sheet, which has a min-height but no height, so the percentage resolves to 0. A press on the empty paper below the line lands on the
// sheet - nothing hands it to the editor, the editor loses focus, and typing goes nowhere.
//
//   For each of FREE WRITE, DRAFT, DRAFT WITH THE TYPEWRITER and SCREENPLAY:
//   B  a BLANK page: a real press on the empty paper below the first line, then typing - the words land on the page (stored)
//   T  a page WITH TEXT: a real press below the LAST line, then one letter - it lands at the END of the text (the caret went to the end)
//   Each press point is PROVEN to lie below the last line of text (a named premise), so a press that happened to land on a line proves nothing.
//   M  THE MUTANT (runtime): with the sheet's flex column taken away by an injected style (asserted to have LANDED - the computed display is
//      'block'), the Draft blank-page press no longer reaches the editor.
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
  const p = await pressPoint(app, !!m.script);
  const below = !!p && p.y > p.lineBottom + 10 && p.y < p.paperBottom;
  ok(`${m.name} ${kind === 'blank' ? 'B' : 'T'} (premise): the press point lies on the paper BELOW the last line of text`, below, JSON.stringify(p));
  if (!below) return;
  await click(app, p.x, p.y); await sleep(300);
  const focus = await focusedIn(app, !!m.script);
  if (kind === 'blank') {
    await app.typeKeys('Hello paper');
    const row = await waitStored(app, id, (t) => /Hello paper/.test(t));
    ok(`${m.name} B: a press on the EMPTY PAPER of a blank page, then typing - the words land on the page`,
      focus && !!row && /Hello paper/.test(row.text || ''), JSON.stringify({ focus, stored: row && row.text, p }));
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

  // ---- M: the mutant - the sheet's flex column taken away (asserted to have landed), the Draft blank-page press no longer reaches the editor
  const mm = MODES[1];
  await app.evalJs(`window.wrizoPatchEntry(${JSON.stringify(pageId(mm, 'blank'))}, { text: '' })`);
  await app.evalJs('window.wrizoFlushNow()');
  await sleep(300);
  if (await openPage(app, mm, 'blank')) {
    await app.evalJs("(() => { const s = document.createElement('style'); s.id = 'bpc-mutant'; s.textContent = '.wz-ink-sheet{ display:block !important; }'; document.head.appendChild(s); return true; })()");
    await sleep(300);
    const landed = await app.evalJs("(() => { const s = document.querySelector('.wz-ink-sheet'); return !!s && getComputedStyle(s).display === 'block'; })()");
    const p = await pressPoint(app, false);
    let reached = null;
    if (p && p.y > p.lineBottom + 10) { await click(app, p.x, p.y); await sleep(300); reached = await focusedIn(app, false); }
    ok('M (mutant): with the sheet\'s flex column taken away (the injected style LANDED: display block), a press on the blank paper no longer reaches the editor - the check depends on the fix',
      landed === true && reached === false, JSON.stringify({ landed, reached, p }));
    await app.evalJs("document.getElementById('bpc-mutant')?.remove()");
  } else ok('M fixture: the Draft blank page reopened', false, '');
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 500)}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nBLANK-PAGE-CLICK VERIFY: PASS (${checks.length} checks)` : `\nBLANK-PAGE-CLICK VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
