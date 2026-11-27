// #138 Q1 (Fable, Nov 26, 11:25 pm and Nov 27, 7:45 am: "Flux's Wire In, A: the zoomed page narrows while Back is open"; FIX builds it, POLISH writes this check).
// THE REAL APP in Flux's own look, a Wire In page (the zoomed page), 1366x768 and 1536x864:
//   O   Back open: neither the menu nor its tab touches the page
//   E   the page's top and left edge stay where they were (only the side facing the menu gives)
//   L   the line breaks do not move (the same words start each line): a painted size, never a re-lay
//   T   typing with Back open lands, and the page does not move while she types
//   C   closed again: the page is exactly as before
// Run: node scripts/harness/page-138-wirein.mjs   (from apps/desktop, dist-web built)
Object.assign(process.env, { WS_REORG: '1', WS_ARBOR2: 'default', WS_MACHINA2: 'default', WS_FLUX3: 'default' });
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${typeof detail === 'string' ? detail : JSON.stringify(detail)}]` : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);
const PARA = 'The quick brown fox jumps over the lazy dog while the tide comes in and the lamplight wavers on the water. '.repeat(6);

const PROBE = `(() => {
  const R = (e) => { if (!e) return null; const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) return null; const b = e.getBoundingClientRect(); return b.width > 1 && b.height > 1 ? [b.left, b.top, b.right, b.bottom].map((n) => Math.round(n * 10) / 10) : null; };
  const q = (s) => document.querySelector(s);
  const page = q('.desk-frame-stage .mode-page'); const ed = q('.desk-frame-stage .forward-only-editor');
  const lines = []; if (ed) { const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let top = null; for (let n = w.nextNode(); n; n = w.nextNode()) for (let i = 0; i < n.data.length && lines.length < 12; i += 1) { const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 1); const b = r.getClientRects()[0]; if (!b) continue; if (top === null || b.top > top + 4) { top = b.top; lines.push(n.data.slice(i, i + 14)); } } }
  const backOpen = q('.wz-tutor-grip')?.getAttribute('aria-expanded') === 'true';
  return { page: R(page), zoomed: !!q('.mode-pagecol[data-zoom="true"]'), backOpen, back: backOpen ? R(q('.wz-tutor-panel')) : null, backGrip: R(q('.wz-tutor-grip')),
    lines, text: ed ? ed.textContent.length : 0 };
})()`;
const cross = (a, b) => !!a && !!b && a[0] < b[2] - 0.5 && b[0] < a[2] - 0.5 && a[1] < b[3] - 0.5 && b[1] < a[3] - 0.5;

await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const S = () => ev(PROBE);
  const wake = async () => { await app.mouseMove(8, 8); await app.mouseMove(20, 40); await sleep(900); };   // while she writes the controls are away: her pointer brings them back
  const press = async (sel) => { const p = await ev(`(() => { const b = document.querySelector(${J(sel)}); if (!b) return null; const r = b.getBoundingClientRect(); return r.width ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null; })()`); if (!p) return false; await app.mouseMove(p.x, p.y); await app.mouseDown(p.x, p.y); await app.mouseUp(p.x, p.y); await sleep(1200); return true; };
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','flux')");
  await app.reload();
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
  await ev(`window.wrizoCreateJournalPage(${J({ id: 'p138-w', text: PARA, createdAt: '2026-04-01T00:00:00.000Z', origin: null, source: 'page' })}); localStorage.setItem('wrizo-mode-page-p138-w', 'journal'); window.wrizoFlushNow()`);

  for (const [w, h] of [[1366, 768], [1536, 864]]) {
    const at = `Flux ${w} Wire In`;
    await app.emulateDpr(1, w, h);
    await ev("location.hash = '#/'"); await sleep(300);
    await ev("location.hash = '#/page/p138-w'");
    await app.waitFor("!!document.querySelector('.desk-frame-stage .forward-only-editor')", { label: 'the page', timeout: 12000 });
    await sleep(2000);
    await wake();
    const rest = await S();
    ok(`${at} (premise): the page is zoomed`, rest.zoomed && !!rest.page, rest);
    await press('.wz-tutor-grip');
    const s = await S();
    ok(`${at} (premise): Back opened`, s.backOpen && !!s.back, { back: s.back, page: s.page });
    if (!s.back) continue;
    ok(`${at} O: neither the menu nor its tab touches the page`, !cross(s.back, s.page) && !cross(s.backGrip, s.page), { back: s.back, grip: s.backGrip, page: s.page });
    ok(`${at} E: the page's top and left edge stay`, Math.abs(s.page[1] - rest.page[1]) <= 1 && Math.abs(s.page[0] - rest.page[0]) <= 1.5, { rest: rest.page, open: s.page });
    ok(`${at} L: the line breaks do not move`, J(s.lines) === J(rest.lines) && s.lines.length > 3, { rest: rest.lines.slice(0, 4), open: s.lines.slice(0, 4) });
    await ev("(() => { const ed = document.querySelector('.desk-frame-stage .forward-only-editor'); ed.focus(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false); const g = getSelection(); g.removeAllRanges(); g.addRange(r); })()");
    const b0 = await S();
    await app.typeKeys(' go on'); await sleep(500);
    const b1 = await S();
    ok(`${at} T: typing lands with Back open and the page does not move`, b1.text === b0.text + 6 && J(b1.page) === J(b0.page), { before: b0.page, after: b1.page, grew: b1.text - b0.text });
    await wake();
    if ((await S()).backOpen) await press('.wz-tutor-grip');
    await wake();
    const c = await S();
    ok(`${at} C: closed, the page is exactly as before`, !c.backOpen && J(c.page) === J(rest.page), { rest: rest.page, closed: c.page });
  }
});

const failed = checks.filter((c) => !c.pass).length;
console.log(`\nPAGE-138-WIREIN VERIFY: ${failed ? `FAIL - ${failed}/${checks.length} failed` : `PASS - ${checks.length}/${checks.length}`}`);
process.exit(failed ? 1 : 0);
