// #138 (Nick, Nov 26: "the Back menu opens over the page surface again... it shouldn't overlap the page surface"; Fable's order, 5:05 pm). An open Front or
// Back menu never covers the page surface, margins included; where they don't fit, the page is a little narrower while the menu is open (only what that menu
// needs, from its side), and the menu takes all the room beside it. THE REAL PAGE in each theme's own look, Draft and Revise, 1366, 1536 and 1920:
//   O   open: neither the menu nor its tab touches the page
//   R   open: the menu reaches the page (no unused room beyond 24 px between them), and is never narrower than at rest's standard (Front: Arbor 264,
//       Flux/Machina 184; Back 317 - 8px allowed)
//   E   the page's top and the edge away from the menu stay where they were (only the side facing the menu gives)
//   L   the line breaks do not move (the same words start each line)
//   C   closed again: the page is exactly as before
//   T   typing with a menu open lands, and the page does not move while she types
//   MUT the open page forced back to its rest size turns O's reading red
// Run: node scripts/harness/page-138.mjs   (from apps/desktop, dist-web built)
Object.assign(process.env, { WS_REORG: '1', WS_ARBOR2: 'default', WS_MACHINA2: 'default', WS_FLUX3: 'default' });
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${typeof detail === 'string' ? detail : JSON.stringify(detail)}]` : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);
const THEMES = [{ id: 'plateau', name: 'Arbor', front: 264 }, { id: 'flux', name: 'Flux', front: 184 }, { id: 'machina', name: 'Machina', front: 184 }];
const BACK = 317;
const PARA = 'The quick brown fox jumps over the lazy dog while the tide comes in and the lamplight wavers on the water. '.repeat(18);

// boxes as [left, top, right, bottom] when drawn, else null; lines: the first words of each drawn line
const PROBE = `(() => {
  const R = (e) => { if (!e) return null; const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) return null; const b = e.getBoundingClientRect(); return b.width > 1 && b.height > 1 ? [b.left, b.top, b.right, b.bottom].map((n) => Math.round(n * 10) / 10) : null; };
  const q = (s) => document.querySelector(s);
  const page = q('.desk-frame-stage .mode-page'); const ed = q('.desk-frame-stage .forward-only-editor');
  const lines = []; if (ed) { const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let top = null; for (let n = w.nextNode(); n; n = w.nextNode()) for (let i = 0; i < n.data.length && lines.length < 12; i += 1) { const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 1); const b = r.getClientRects()[0]; if (!b) continue; if (top === null || b.top > top + 4) { top = b.top; lines.push(n.data.slice(i, i + 14)); } } }
  const frontOpen = q('.wz-sliver')?.getAttribute('data-open') === 'true'; const backOpen = q('.wz-tutor-grip')?.getAttribute('aria-expanded') === 'true';
  return { page: R(page), frontOpen, backOpen, front: frontOpen ? R(q('.wz-sliver-panel')) : null, frontGrip: R(q('.wz-sliver-grip')), back: backOpen ? R(q('.wz-tutor-panel')) : null, backGrip: R(q('.wz-tutor-grip')),
    lines, text: ed ? ed.textContent.length : 0 };
})()`;
const cross = (a, b) => !!a && !!b && a[0] < b[2] - 0.5 && b[0] < a[2] - 0.5 && a[1] < b[3] - 0.5 && b[1] < a[3] - 0.5;
const GRIP = { front: '.wz-sliver-grip', back: '.wz-tutor-grip' };

await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const S = () => ev(PROBE);
  const press = async (sel) => { const p = await ev(`(() => { const b = document.querySelector(${J(sel)}); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`); if (!p) return false; await app.mouseMove(p.x, p.y); await app.mouseDown(p.x, p.y); await app.mouseUp(p.x, p.y); await sleep(1100); return true; };
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
  for (const [id, mode] of [['p138-d', 'drafting'], ['p138-r', 'revise']]) await ev(`window.wrizoCreateJournalPage(${J({ id, text: PARA, createdAt: '2026-04-01T00:00:00.000Z', origin: null, source: 'page' })}); localStorage.setItem('wrizo-mode-page-${id}', '${mode}'); window.wrizoFlushNow()`);

  for (const th of THEMES) {
    await ev("location.hash = '#/'");
    await ev(`localStorage.setItem('wrizo-theme', '${th.id}')`);
    await app.reload();
    await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
    for (const [w, h] of [[1366, 768], [1536, 864], [1920, 1080]]) {
      for (const [id, mode] of w === 1366 ? [['p138-d', 'Draft'], ['p138-r', 'Revise']] : [['p138-d', 'Draft']]) {
        const at = `${th.name} ${w} ${mode}`;
        await app.emulateDpr(1, w, h);
        await ev("location.hash = '#/'"); await sleep(300);
        await ev(`location.hash = '#/page/${id}'`);
        await app.waitFor("!!document.querySelector('.desk-frame-stage .forward-only-editor')", { label: id, timeout: 12000 });
        await sleep(1500);
        const rest = await S();
        for (const side of ['front', 'back']) {
          await press(GRIP[side]);
          const s = await S();
          const panel = s[side], grip = s[`${side}Grip`];
          const opened = side === 'front' ? s.frontOpen : s.backOpen;
          ok(`${at} ${side} (premise): it opened`, opened && !!panel, { panel, page: s.page });
          if (!panel) continue;
          ok(`${at} ${side} O: neither the menu nor its tab touches the page`, !cross(panel, s.page) && !cross(grip, s.page), { panel, grip, page: s.page });
          const gap = side === 'front' ? s.page[0] - panel[2] : panel[0] - s.page[2];
          const width = panel[2] - panel[0];
          const std = side === 'front' ? th.front : BACK;
          ok(`${at} ${side} R: it reaches the page and is at least its standard width`, gap <= 24 && width >= std - 8, { gap: Math.round(gap), width: Math.round(width), std });
          const away = side === 'front' ? 2 : 0;
          ok(`${at} ${side} E: the page's top and its far edge stay`, Math.abs(s.page[1] - rest.page[1]) <= 1 && Math.abs(s.page[away] - rest.page[away]) <= 1.5, { rest: rest.page, open: s.page });
          ok(`${at} ${side} L: the line breaks do not move`, J(s.lines) === J(rest.lines) && s.lines.length > 3, { rest: rest.lines.slice(0, 4), open: s.lines.slice(0, 4) });
          if (w === 1366 && mode === 'Draft') {
            await ev("(() => { const ed = document.querySelector('.desk-frame-stage .forward-only-editor'); ed.focus(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false); const g = getSelection(); g.removeAllRanges(); g.addRange(r); })()");
            const b0 = await S();
            await app.typeKeys(' go on'); await sleep(400);
            const b1 = await S();
            ok(`${at} ${side} T: typing lands with the menu open and the page does not move`, b1.text === b0.text + 6 && J(b1.page) === J(b0.page), { before: b0.page, after: b1.page, grew: b1.text - b0.text });
          }
          if (w === 1366 && mode === 'Draft' && side === 'back' && th.id === 'flux') {
            await ev(`(() => { const p = document.querySelector('.desk-frame-stage .mode-page'); p.style.setProperty('transform', 'scale(1.3)', 'important'); })()`);
            await sleep(300);
            const m = await S();
            ok('MUT the open page forced back to its rest size turns O\'s reading red', cross(m.back, m.page) || cross(m.backGrip, m.page), { back: m.back, page: m.page });
            await ev("document.querySelector('.desk-frame-stage .mode-page').style.removeProperty('transform')");
            await sleep(300);
          }
          // close: by its own tab
          const stillOpen = await ev(side === 'front' ? "document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'" : "document.querySelector('.wz-tutor-grip')?.getAttribute('aria-expanded') === 'true'");
          if (stillOpen) await press(GRIP[side]);
          await sleep(400);
          const c = await S();
          ok(`${at} ${side} C: closed, the page is exactly as before`, J(c.page) === J(rest.page), { rest: rest.page, closed: c.page });
        }
      }
    }
  }
});

const failed = checks.filter((c) => !c.pass).length;
console.log(`\nPAGE-138 VERIFY: ${failed ? `FAIL - ${failed}/${checks.length} failed` : `PASS - ${checks.length}/${checks.length}`}`);
process.exit(failed ? 1 : 0);
