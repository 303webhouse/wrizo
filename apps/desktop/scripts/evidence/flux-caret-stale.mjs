// FLUX BLOCK CARET - IS IT STALE AFTER A LAYOUT SHIFT? A measurement, not a check (scripts/evidence/: run-suite does not run it). Fable, Oct 12: in Flux with Typewriter on, the orange block caret
// sat ~3 lines above the text instead of after "listened." (phase1 frames flux-dark/01, flux-light/01). "Check whether main does the same and report."
//
// The suspect is components/FluxBlockCaret.tsx: it draws the overlay from the native caret's rect on `selectionchange` (and once on mount) and NEVER again, so any layout shift that
// happens WITHOUT a selection change (the typewriter's top padding arriving when it is switched on; a scroll) leaves the overlay where the caret WAS. That component is not part of
// Phase 1, so main should do the same. This measures it, on whichever tree is built, so the same file can be pointed at main and at Phase 1:
//   A  typewriter already ON when the page opens, caret placed after the layout has settled                (control: should agree)
//   B  typewriter OFF, caret placed at the end, THEN typewriter switched ON through the app's own control  (the frames' order: should be stale if the suspicion is right)
//   C  the same as B, then a keystroke-free selection nudge (a selectionchange) re-draws the overlay        (proves the overlay itself can be right: staleness, not a wrong formula)
// For each: the overlay's rect, the native caret's rect (a collapsed Range at the end of the text), and the vertical gap between them.
// Needs a box turn. Run: WS_BOX_TURN=<token> node scripts/evidence/flux-caret-stale.mjs   (from apps/desktop, dist-web built)
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const PAGE = 'flux-caret-page';
const TEXT = 'The first thing she noticed was the quiet.\nThen the light on the floor, long and thin.\nShe set the cup down and listened.';
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };

const fresh = async (app, typewriterOn) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-theme','flux');
    localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');
    localStorage.setItem('wrizo-writing-settings', JSON.stringify({ typewriter: ${typewriterOn} }));
    localStorage.setItem('wrizo-typewriter-page-${PAGE}', ${JSON.stringify(typewriterOn ? 'on' : 'off')});`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
  await app.evalJs(`window.wrizoCreateJournalPage({ id: ${JSON.stringify(PAGE)}, text: ${JSON.stringify(TEXT)}, createdAt: new Date().toISOString(), source: null, origin: null })`);
  await sleep(400);
  await app.evalJs(`location.hash = '#/page/${PAGE}'`);
  await waitSoft(app, `!!document.querySelector('${ED}')`, { label: 'page' });
  await sleep(1200);
};
// THE REAL CARET'S RECT, WITHOUT TOUCHING THE DOM. The first cut collapsed a Range on the editor ELEMENT and asked it for client rects: a Range collapsed at an element boundary has none, so
// "real" was null in every row and the verdict meant nothing. The caret sits after the LAST CHARACTER of the last text node, so measure that character's box and take its right edge. (The app's
// own overlay falls back to inserting a zero-width probe span; this measurement must NOT mutate the editor - a DOM change can fire a selectionchange, which redraws the overlay and would hide
// the very staleness being measured.)
const lastChar = `(() => { const el = document.querySelector('${ED}'); if (!el) return null;
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let last = null; while (w.nextNode()) { if (w.currentNode.nodeValue && w.currentNode.nodeValue.length) last = w.currentNode; }
  return last; })()`;
const caretAtEnd = (app) => app.evalJs(`(() => { const el = document.querySelector('${ED}'); const last = ${lastChar}; if (!el || !last) return false; el.focus();
  const r = document.createRange(); r.setStart(last, last.nodeValue.length); r.collapse(true); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()`);
const read = (app) => app.evalJs(`(() => {
  const o = document.querySelector('.flux-block-caret'); const ob = o ? o.getBoundingClientRect() : null;
  const last = ${lastChar}; let real = null;
  if (last) { const rr = document.createRange(); rr.setStart(last, Math.max(0, last.nodeValue.length - 1)); rr.setEnd(last, last.nodeValue.length);
    const q = rr.getClientRects()[0]; if (q) real = { left: Math.round(q.right), top: Math.round(q.top), height: Math.round(q.height) }; }
  const tw = document.querySelector('.mode-scroll')?.dataset.typewriter ?? null;
  const sel = window.getSelection();
  return { overlay: ob ? { left: Math.round(ob.left), top: Math.round(ob.top), height: Math.round(ob.height) } : null, real, typewriter: tw,
           dy: ob && real ? Math.round(ob.top - real.top) : null, selectionInEditor: !!(sel && sel.rangeCount && document.querySelector('${ED}')?.contains(sel.anchorNode)), theme: document.documentElement.getAttribute('data-theme') };
})()`);
// switch the typewriter ON through whatever control THIS tree has: Phase 1's icon toggle, else the old Settings-menu row
const toggleOn = async (app) => {
  const method = await app.evalJs(`(() => {
    const t = document.querySelector('.wz-sliver-instruments-modes [data-mode-toggle="typewriter"]');
    if (t) { if (t.getAttribute('aria-pressed') !== 'true') t.click(); return 'phase1-toggle'; }
    const gear = [...document.querySelectorAll('.wz-sliver-instruments-btn')].find((b) => (b.getAttribute('aria-label') || '') === 'Settings');
    if (!gear) return 'none';
    gear.click(); return 'settings-menu';
  })()`);
  if (method === 'settings-menu') {
    await sleep(300);
    await app.evalJs(`(() => { const row = [...document.querySelectorAll('.wz-sliver-instruments-panel .mode-crow')].find((r) => (r.querySelector('span') || {}).textContent === 'Typewriter');
      const on = row && [...row.querySelectorAll('.mode-seg button')].find((b) => !b.classList.contains('on')); if (on) on.click(); })()`);
  }
  await sleep(700);
  return method;
};

const rows = [];
await withHarness(async (app) => {
  const bundle = await app.evalJs("[...document.scripts].map(s => s.src).filter(Boolean).map(s => s.split('/').pop()).join(',')");
  // A - control
  await fresh(app, true); await caretAtEnd(app); await sleep(600);
  rows.push({ scenario: 'A: typewriter ON at open, caret placed after layout settled', ...(await read(app)) });
  // B - the frames' order
  await fresh(app, false); await caretAtEnd(app); await sleep(500);
  const before = await read(app);
  const method = await toggleOn(app);
  const after = await read(app);
  rows.push({ scenario: 'B0: typewriter OFF, caret at end', ...before });
  rows.push({ scenario: `B: typewriter switched ON (${method}) with NO selection change`, ...after });
  // C - one selectionchange re-draws it
  await caretAtEnd(app); await sleep(500);
  rows.push({ scenario: 'C: ...then a selectionchange (caret re-placed at the end)', ...(await read(app)) });
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ bundle, rows }, null, 2));
  const B = rows.find((r) => r.scenario.startsWith('B:')); const C = rows.find((r) => r.scenario.startsWith('C:'));
  const measured = !!B && B.dy != null && !!C && C.dy != null;
  const stale = B && B.dy != null && Math.abs(B.dy) > 6;
  const redrawn = C && C.dy != null && Math.abs(C.dy) <= 6;
  // eslint-disable-next-line no-console
  console.log(!measured ? `\nFLUX-CARET: NOT MEASURED (a null rect: overlay ${JSON.stringify(B && B.overlay)}, real ${JSON.stringify(B && B.real)}) - no verdict - ${bundle}` : `\nFLUX-CARET: ${stale ? `STALE after the layout shift (overlay ${B.dy}px from the real caret)` : 'agrees after the shift'}${redrawn ? '; a selectionchange re-draws it correctly (staleness, not a wrong formula)' : ''} - ${bundle}`);
});
