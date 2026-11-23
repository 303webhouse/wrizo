// A PAGE OPENS AT ITS TOP WHEN IT ONLY JUST OVERFLOWS (Fable, Nov 21, 6:54 pm; POLISH's measurement, frames run 44971995356 on flux3/s4b-l4 @ c3a76933: "at 1366 the page rests scrolled 13 px once the editor has focus, so the
// first line is cut by the scroller's edge; flag on AND off"). The cause, read in the source: a Draft page mounts with the caret at the END of its words (ForwardOnlyEditor's mount effect, setCaretOffset), and
// setCaretOffset focuses the editor, so the browser scrolls the caret into view. On a page that overflows its sheet by less than a line, that scroll is all of the overflow: the page rests scrolled by a few pixels and
// the FIRST line, the one she reads first, loses its top. Nothing about the Flux header: the geometry is the same in every theme.
//   (every page below is opened the way POLISH's frames job did it: in Free Write, then the Draft tab pressed - the Draft editor mounts with the caret at the end of the words)
//   SC1  a page that overflows its sheet by LESS THAN ONE LINE opens at its top: scrollTop 0 and the first line's first letter fully inside the scroller - in Flux with ?flux3=1, in Flux without it, in Arbor and in Machina, at 1366 x 768
//   SC2  a page that fits (one line fewer) opens at its top too (the control: nothing to scroll)
//   SC3  a page far longer than its sheet opens scrolled and rests on a whole line (the first line that shows begins at the sheet's top edge; the caret's line is not asserted: a long page's rows are laid out lazily, so its scroll height under-counts before and after)
//   SC4  typing at the end of the just-over page brings the caret's line into view (the browser's own scroll for a typed letter is untouched): after a key, the caret line lies inside the scroller
//   MUT  the reader goes RED on the reading of the old behaviour: the measured scrollTop of a page opened with the caret's scroll left in (a probe that scrolls the page by the overflow, as the browser did) is not 0
// The page is made to overflow by less than a line by measurement: a ladder of one-line rows is opened until the overflow (scrollHeight - clientHeight) is above 0 and at most one row.
// Run: node scripts/harness/page-open-scroll.mjs (from apps/desktop; a box turn or Actions)
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });

const MEASURE = () => `(() => {
  const sc = document.querySelector('.mode-scroll'), ed = document.querySelector('.forward-only-editor');
  if (!sc || !ed) return null;
  const rows = [...ed.querySelectorAll('.wz-row')];
  const first = rows[0] || null;
  let ink = null;
  if (first) { const w = document.createTreeWalker(first, NodeFilter.SHOW_TEXT); const n = w.nextNode(); if (n && n.data.length) { const r = document.createRange(); r.setStart(n, 0); r.setEnd(n, 1); const g = r.getBoundingClientRect(); ink = { top: g.top, bottom: g.bottom }; } }
  const box = sc.getBoundingClientRect();
  const sel = getSelection();
  let caret = null;
  if (sel && sel.rangeCount && ed.contains(sel.anchorNode)) { const rg = sel.getRangeAt(0); const rs = rg.getClientRects(); const r0 = rs.length ? rs[rs.length - 1] : null; if (r0 && r0.height > 0) caret = { top: r0.top, bottom: r0.bottom }; else { const ae = sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement; const row = ae && ae.closest ? ae.closest('.wz-row') : null; if (row) { const b = row.getBoundingClientRect(); caret = { top: b.top, bottom: b.bottom }; } } }
  const topRow = rows.find((r) => r.getBoundingClientRect().bottom > box.top + 0.5) || null;   // the first line that shows at the top of the sheet
  const rowH = rows.length ? rows.reduce((m, r) => Math.max(m, r.getBoundingClientRect().height), 0) : 0;
  return { scrollTop: sc.scrollTop, clientH: sc.clientHeight, scrollH: sc.scrollHeight, overflow: sc.scrollHeight - sc.clientHeight, clipTop: box.top, clipBottom: box.bottom, rowH, nRows: rows.length, ink, caret,
    firstTop: first ? first.getBoundingClientRect().top : null, topCut: topRow ? box.top - topRow.getBoundingClientRect().top : null, theme: document.documentElement.getAttribute('data-theme'), flag: document.documentElement.hasAttribute('data-flux3'), active: document.activeElement ? document.activeElement.className : null };
})()`;

const CONFIGS = [
  { name: 'Flux with ?flux3=1', theme: 'flux', flag: true },
  { name: 'Flux without the flag', theme: 'flux', flag: false },
  { name: 'Arbor', theme: 'plateau', flag: false },
  { name: 'Machina', theme: 'machina', flag: false },
];

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 15000, label: 'splash gone' }).catch(() => {});
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await splashGone();
  let seq = 0;
  const lines = (n) => Array.from({ length: n }, (_, i) => `Line ${i + 1} of the page.`).join('\n');
  // via 'tab' is POLISH's own flow (flux3-s3's doc scene): the page opens in Free Write and she presses the Draft tab, which mounts the Draft editor with the caret at the end of the words; via 'load' opens it in Draft at once
  const openN = async (cfg, n, via = 'tab') => {
    const mode = via === 'tab' ? 'journal' : 'drafting';
    const id = `pos-${Date.now()}-${seq += 1}`;
    await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: lines(n), createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })})`);
    await sleep(250);
    // [the Flux pin, Fable Nov 23 2:30 pm: FLUX3 is on by default, so "off" must be asked with ?flux3=0] was: await ev(`(() => { localStorage.setItem('wrizo-theme', ${JSON.stringify(cfg.theme)}); localStorage.setItem('wrizo-mode-page-${id}', ${JSON.stringify(mode)}); history.replaceState(null, '', '/${cfg.flag ? '?flux3=1' : ''}#/page/${id}'); })()`);
    await ev(`(() => { localStorage.setItem('wrizo-theme', ${JSON.stringify(cfg.theme)}); localStorage.setItem('wrizo-mode-page-${id}', ${JSON.stringify(mode)}); history.replaceState(null, '', '/${cfg.flag ? '?flux3=1' : '?flux3=0'}#/page/${id}'); })()`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 15000, label: 'the page' }).catch(() => {});
    await splashGone();
    if (via === 'tab') {
      await sleep(600);
      await ev("(() => { const b = document.querySelector('.desk-mode-tab[data-mode-key=\"draft\"]'); if (b && b.getAttribute('aria-selected') !== 'true') b.click(); })()");
    }
    await app.mouseMove(8, 8);
    await sleep(1800);
    return { id, m: await ev(MEASURE()) };
  };
  // the ladder: the smallest page whose overflow is above 0 (so it overflows by at most one row)
  const ladder = async (cfg) => {
    let n = 14, last = null;
    for (let i = 0; i < 9; i += 1) {
      const r = await openN(cfg, n);
      last = r; const m = r.m;
      if (!m || !m.rowH) return null;
      if (m.overflow > 0 && m.overflow <= m.rowH) return { n, ...r };
      n += m.overflow <= 0 ? Math.max(1, Math.ceil(-m.overflow / m.rowH)) : -Math.max(1, Math.floor(m.overflow / m.rowH));
    }
    return last && last.m ? { n, ...last, miss: true } : null;
  };
  for (const cfg of CONFIGS) {
    const L = await ladder(cfg);
    const m = L && L.m;
    const stood = !!m && !L.miss && m.theme === cfg.theme && m.flag === cfg.flag;
    const whole = !!m && m.scrollTop === 0 && !!m.ink && m.ink.top >= m.clipTop - 0.5;
    ok(`SC1 [${cfg.name}] a page that overflows its sheet by less than a line opens at its top: scrollTop 0 and the first letter inside the scroller (the sheet was found: ${stood})`, stood && whole, JSON.stringify(m && { n: L.n, scrollTop: m.scrollTop, overflow: m.overflow, rowH: m.rowH, clipTop: m.clipTop, inkTop: m.ink && m.ink.top, firstTop: m.firstTop, active: m.active }));
    if (cfg.theme === 'flux' && cfg.flag) {
      const fit = await openN(cfg, L ? Math.max(1, L.n - 1) : 12);
      ok('SC2 [Flux ?flux3=1] a page one line shorter (it fits) opens at its top', !!fit.m && fit.m.scrollTop === 0 && !!fit.m.ink && fit.m.ink.top >= fit.m.clipTop - 0.5, JSON.stringify(fit.m && { n: fit.m.nRows, scrollTop: fit.m.scrollTop, overflow: fit.m.overflow }));
      const far = await openN(cfg, 90);
      const c = far.m && far.m.caret;
      ok('SC3 [Flux ?flux3=1] a page far longer than its sheet opens scrolled, and RESTS ON A WHOLE LINE: the first line that shows begins at the top edge of the sheet (nothing of it cut). (The line the caret is on is NOT asserted: the rows of a long page are laid out lazily, so its scroll height under-counts, before and after this change.)', !!far.m && far.m.scrollTop > 0 && far.m.topCut !== null && Math.abs(far.m.topCut) <= 1, JSON.stringify(far.m && { scrollTop: far.m.scrollTop, topCut: far.m.topCut, caret: far.m.caret, clip: [far.m.clipTop, far.m.clipBottom] }));
      // typing at the end of the just-over page
      const typed = await openN(cfg, L ? L.n : 14);
      await ev("(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const s = getSelection(); s.selectAllChildren(ed); s.collapseToEnd(); return true; })()");
      await app.typeKeys('\nA new line she is writing');
      await sleep(500);
      const t = await ev(MEASURE());
      ok('SC4 [Flux ?flux3=1] typing a new line at the end of that page brings the caret\'s line into view (the browser\'s own scroll for a typed letter is untouched)', !!t && !!t.caret && t.caret.top >= t.clipTop - 1 && t.caret.bottom <= t.clipBottom + 1, JSON.stringify(t && { scrollTop: t.scrollTop, caret: t.caret, clip: [t.clipTop, t.clipBottom] }));
    }
  }
  // the reader goes RED on the old behaviour: scroll a just-over page by its overflow, as the browser's caret reveal did, and read it the same way
  const cfg = CONFIGS[0];
  const L = await ladder(cfg);
  if (L && L.m) {
    // SUPERSEDED (Nov 22, train J3: the page keeps itself on a whole line for a few seconds after it opens, while it lays out, and stops at her first act, so a native scroll planted right after the open was put back before it was read). The lines as they stood, verbatim:
    //   await ev("(() => { const sc = document.querySelector('.mode-scroll'); sc.scrollTop = sc.scrollHeight; })()");
    //   await sleep(200);
    // successor: her first act (the wheel) ends that, then the page is scrolled by its overflow, as the browser's caret reveal did
    await ev("(() => { document.dispatchEvent(new Event('wheel', { bubbles: true })); return true; })()");
    await ev("(() => { const sc = document.querySelector('.mode-scroll'); sc.scrollTop = sc.scrollHeight; })()");
    await sleep(200);
    const m = await ev(MEASURE());
    const whole = !!m && m.scrollTop === 0 && !!m.ink && m.ink.top >= m.clipTop - 0.5;
    ok('MUT-SC1 the SC1 reader goes RED on the old behaviour (the just-over page scrolled by its overflow: scrollTop above 0, the first letter above the clip)', whole === false && m.scrollTop > 0, JSON.stringify(m && { scrollTop: m.scrollTop, inkTop: m.ink && m.ink.top, clipTop: m.clipTop }));
  } else ok('MUT-SC1 the just-over page was found for the mutant', false, 'no ladder');
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); checks.push({ name: 'HARNESS', pass: false, detail: String(e && e.message || e) }); }

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nPAGE-OPEN-SCROLL VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nPAGE-OPEN-SCROLL VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
