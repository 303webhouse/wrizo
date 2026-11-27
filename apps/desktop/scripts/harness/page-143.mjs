// #143 (Nick, Nov 27, on live L14: "The cursor is way too big now and the font is 14, which is also much too big for normal writing. (Should be 11 or 12 even as the
// page surface has been widened.)"). Fable's answers, 1:52 pm and 2:55 pm: B - type is laid out for the 1.456 page scale (a point paints as a CSS point on his
// 1536 window, and every line breaks the same on every screen); Flux new pages are born at 12, Arbor and Machina keep 11; the block caret is as tall as the type
// (about 1.2 x), centred on the line; Flux's Wire In keeps today's on-screen size; Arbor's and Machina's Free Write keep the page clear of the rail.
// THE REAL APP, three themes, 1366x768, 1536x706 (his window) and 1920x885.
//   P  the writer's type at 12 is laid out at 12 x 1.33333 / 1.456 px; on 1536 it paints at 16 px (the box's 12)
//   L  her lines break at the same words at all three widths
//   Y  with the Back menu open her lines still break at the same words
//   C  (Flux) the block caret is about 1.2 x the painted type, centred on its line
//   Z  Free Write: Flux paints 12 at 23 px or more (today's size); Arbor and Machina keep the page clear of the rail
//   N  a page born now: 12 in Flux, 11 in Arbor and Machina
// Run: node scripts/harness/page-143.mjs   (from apps/desktop, dist-web built)
Object.assign(process.env, { WS_REORG: '1', WS_ARBOR2: 'default', WS_MACHINA2: 'default', WS_FLUX3: 'default' });
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${typeof detail === 'string' ? detail : JSON.stringify(detail)}]` : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);
const THEMES = [{ id: 'plateau', name: 'Arbor', born: 11 }, { id: 'flux', name: 'Flux', born: 12 }, { id: 'machina', name: 'Machina', born: 11 }];
const SIZES = [[1366, 768], [1536, 706], [1920, 885]];
const TEXT = 'The quick brown fox jumps over the lazy dog while the tide comes in and the lamplight wavers on the water. '.repeat(5);
const LAYOUT = (12 * 4 / 3) / 1.456;

const PROBE = `(() => {
  const page = document.querySelector('.desk-frame-stage .mode-page'), ed = document.querySelector('.desk-frame-stage .forward-only-editor');
  if (!page || !ed) return null;
  const k = page.getBoundingClientRect().width / page.offsetWidth, cs = getComputedStyle(ed), font = parseFloat(cs.fontSize);
  const starts = []; const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let top = null, at = 0;
  for (let n = w.nextNode(); n; n = w.nextNode()) { for (let i = 0; i < n.data.length && starts.length < 8; i += 1) { const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 1); const b = r.getClientRects()[0]; if (!b) continue; if (top === null || b.top > top + 4) { top = b.top; starts.push(at + i); } } at += n.data.length; }
  const caret = document.querySelector('.flux-block-caret'); const c = caret ? caret.getBoundingClientRect() : null;
  const sel = getSelection(); const rr = sel.rangeCount ? sel.getRangeAt(0).getClientRects()[0] : null;
  const rail = document.querySelector('.desk-frame-strip')?.getBoundingClientRect();
  return { k, font, painted: font * k, starts, caret: c ? { h: c.height, mid: c.top + c.height / 2 } : null, line: rr ? { mid: rr.top + rr.height / 2, h: rr.height } : null,
    pageLeft: page.getBoundingClientRect().left, railRight: rail && rail.width ? rail.right : 0, zoomed: !!document.querySelector('.mode-pagecol[data-zoom="true"]') };
})()`;

await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
  for (const t of THEMES) {
    await ev("location.hash = '#/'");
    await ev(`localStorage.setItem('wrizo-theme', '${t.id}')`);
    await app.reload();
    await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
    const born = await ev("(() => { const e = window.wrizoCreateJournalPage(); window.wrizoFlushNow(); return e && e.pageSettings ? e.pageSettings.size : null; })()");
    ok(`${t.name} N: a page born now is ${t.born}`, born === t.born, { born });
    for (const [mode, id] of [['drafting', `p143-${t.id}-d`], ['journal', `p143-${t.id}-f`]]) await ev(`window.wrizoCreateJournalPage(${J({ id, text: TEXT, createdAt: '2026-04-01T00:00:00.000Z', origin: null, source: 'page' })}); localStorage.setItem('wrizo-mode-page-${id}', '${mode}'); window.wrizoFlushNow()`);
    const seen = {};
    for (const [w, h] of SIZES) {
      const at = `${t.name} ${w}x${h}`;
      await app.emulateDpr(1, w, h);
      const open = async (id) => { await ev("location.hash = '#/'"); await sleep(300); await ev(`location.hash = '#/page/${id}'`); await app.waitFor("!!document.querySelector('.desk-frame-stage .forward-only-editor')", { label: id, timeout: 15000 }); await app.mouseMove(w / 2, 20); await sleep(1800); };
      await open(`p143-${t.id}-d`);
      await ev("(() => { const ed = document.querySelector('.desk-frame-stage .forward-only-editor'); ed.focus(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.dispatchEvent(new Event('selectionchange')); })()");
      await sleep(700);
      const d = await ev(PROBE);
      seen[w] = d.starts;
      ok(`${at} P: 12 is laid out at ${LAYOUT.toFixed(2)} px${w === 1536 ? ' and paints at 16' : ''}`, Math.abs(d.font - LAYOUT) <= 0.06 && (w !== 1536 || Math.abs(d.painted - 16) <= 0.6), { font: d.font, painted: +d.painted.toFixed(2), k: +d.k.toFixed(3) });
      if (t.id === 'flux') ok(`${at} C: the block caret is about 1.2 x the painted type, centred on its line`, !!d.caret && Math.abs(d.caret.h - 1.2 * d.painted) <= 0.2 * d.painted && !!d.line && Math.abs(d.caret.mid - d.line.mid) <= 4, { caret: d.caret, line: d.line, painted: +d.painted.toFixed(1) });
      await ev("document.querySelector('.wz-tutor-grip')?.click()"); await sleep(1200);
      const y = await ev(PROBE);
      ok(`${at} Y: with the Back menu open her lines break at the same words`, J(y.starts) === J(d.starts) && d.starts.length >= 4, { rest: d.starts, open: y.starts });
      await ev("document.querySelector('.wz-tutor-grip')?.click()"); await sleep(900);
      await open(`p143-${t.id}-f`);
      const f = await ev(PROBE);
      if (t.id === 'flux') ok(`${at} Z: Wire In paints 12 at 23 px or more`, f.zoomed && f.painted >= 23, { painted: +f.painted.toFixed(1), k: +f.k.toFixed(3) });
      else ok(`${at} Z: Free Write keeps the page clear of the rail`, f.zoomed && f.pageLeft >= f.railRight + 6, { pageLeft: +f.pageLeft.toFixed(1), railRight: f.railRight, painted: +f.painted.toFixed(1) });
    }
    ok(`${t.name} L: her lines break at the same words at all three widths`, J(seen[1366]) === J(seen[1536]) && J(seen[1536]) === J(seen[1920]) && seen[1366].length >= 4, seen);
  }
});

const failed = checks.filter((c) => !c.pass).length;
console.log(`\nPAGE-143 VERIFY: ${failed ? `FAIL - ${failed}/${checks.length} failed` : `PASS - ${checks.length}/${checks.length}`}`);
process.exit(failed ? 1 : 0);
