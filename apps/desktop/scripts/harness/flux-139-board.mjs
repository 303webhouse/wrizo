// #139 (Nick, Nov 26: "make the Board even wider so that it takes up almost all available screen real estate and have the Front and Back menus open inward,
// over the top of the Board... the left and right edges of the respective menus should align directly with the left and right edges of the Board with the
// closing tab on the inside pointing outward"). Fable: Flux's Boards first; cards under an open menu stay where they are (the Board never moves).
// THE REAL BOARD in Flux's own look, 1366x768, 1536x864 and 1920x1080:
//   W  the Board takes the screen: it reaches within 24 px of the rail on the left and of the window's edge on the right
//   B  opening either menu never moves or resizes the Board, nor any card on it
//   A  Front's left edge is the Board's left edge; Back's right edge is the Board's right edge (within 1.5 px)
//   T  the closing tab stands on the menu's inner side, over the Board, and its arrow points outward; closed, the opening tab stands outside the Board
//      and its arrow points inward (the way the menu will travel)
//   C  the Board's own controls (the readings strip with its zoom button, the canvas's resize handle) are not under a menu or its tab
//   Z  closed again, the Board and both tabs are as before
//   U  Arbor's and Machina's Boards are not widened (Flux first)
//   MUT the Front menu pushed 40 px off the Board's edge turns A's reading red
// Run: node scripts/harness/flux-139-board.mjs   (from apps/desktop, dist-web built)
Object.assign(process.env, { WS_REORG: '1', WS_ARBOR2: 'default', WS_MACHINA2: 'default', WS_FLUX3: 'default' });
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${typeof detail === 'string' ? detail : JSON.stringify(detail)}]` : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);

const PROBE = `(() => {
  const box = (e) => { if (!e) return null; const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) return null;
    const b = e.getBoundingClientRect(); return b.width > 1 && b.height > 1 ? [b.left, b.top, b.right, b.bottom].map((n) => Math.round(n * 10) / 10) : null; };
  const q = (s) => document.querySelector(s);
  const frontOpen = q('.wz-sliver')?.getAttribute('data-open') === 'true'; const backOpen = q('.wz-tutor-grip')?.getAttribute('aria-expanded') === 'true';
  const strip = q('.desk-frame-strip');
  // the arrow as she sees it: a mirrored glyph reads the other way
  const arrow = (s) => { const g = q(s); if (!g) return null; const t = g.textContent; return getComputedStyle(g).transform.startsWith('matrix(-1') ? ({ '‹': '›', '›': '‹' })[t] ?? t : t; };
  return { frontOpen, backOpen, vw: document.documentElement.clientWidth, rail: strip ? strip.getBoundingClientRect().right : 0,
    board: box(q('.board-canvas-wrap')), cards: [...document.querySelectorAll('.board-canvas [data-box-id], .board-canvas .board-box')].map(box),
    front: frontOpen ? box(q('.wz-sliver-panel')) : null, frontGrip: box(q('.wz-sliver-grip')), frontArrow: arrow('.wz-sliver-grip-glyph'),
    back: backOpen ? box(q('.wz-tutor-panel')) : null, backGrip: box(q('.wz-tutor-grip')), backArrow: arrow('.wz-tutor-grip-glyph'),
    controls: [box(q('.flux3-tele')), box(q('.flux3-tele-zoom')), box(q('.board-canvas-resize-handle'))] };
})()`;
const cross = (a, b) => !!a && !!b && a[0] < b[2] - 0.5 && b[0] < a[2] - 0.5 && a[1] < b[3] - 0.5 && b[1] < a[3] - 0.5;
const GRIP = { front: '.wz-sliver-grip', back: '.wz-tutor-grip' };
const IN = { front: '›', back: '‹' };    // closed: the way the menu will travel, into the Board
const OUT = { front: '‹', back: '›' };   // open: outward, back to its edge

await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const S = () => ev(PROBE);
  const press = async (sel) => { const p = await ev(`(() => { const b = document.querySelector(${J(sel)}); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`); if (!p) return false; await app.mouseMove(p.x, p.y); await app.mouseDown(p.x, p.y); await app.mouseUp(p.x, p.y); await sleep(1200); return true; };
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
  await ev("window.wrizoCreateJournalPage({ id: 'b139', text: 'Plot board', pageType: 'board', boxes: [{ id: 'c1', kind: 'text', text: 'Alpha', x: 0.02, y: 0.05, w: 0.22, h: 0.12, z: 0 }, { id: 'c2', kind: 'text', text: 'Omega', x: 0.74, y: 0.2, w: 0.22, h: 0.12, z: 1 }], createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' }); window.wrizoFlushNow()");

  for (const theme of ['flux', 'plateau', 'machina']) {
    await ev("location.hash = '#/'");
    await ev(`localStorage.setItem('wrizo-theme', '${theme}')`);
    await app.reload();
    await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
    for (const [w, h] of theme === 'flux' ? [[1366, 768], [1536, 864], [1920, 1080]] : [[1536, 864]]) {
      const at = `${theme} ${w}x${h}`;
      await app.emulateDpr(1, w, h);
      await ev("location.hash = '#/'"); await sleep(300);
      await ev("location.hash = '#/page/b139'");
      await app.waitFor("!!document.querySelector('.board-canvas') && !!document.querySelector('.wz-sliver-grip')", { label: 'the Board', timeout: 12000 });
      await sleep(1800);
      const rest = await S();
      if (theme !== 'flux') {
        ok(`${at} U: this Board is not widened`, !!rest.board && rest.board[2] - rest.board[0] <= 1101, { board: rest.board });
        continue;
      }
      ok(`${at} (premise): a Board with two cards and its readings strip, both menus closed`, !!rest.board && rest.cards.length >= 2 && !!rest.controls[0] && !rest.frontOpen && !rest.backOpen, rest);
      if (!rest.board) continue;
      ok(`${at} W: the Board takes the screen`, rest.board[0] - rest.rail <= 24 && rest.vw - rest.board[2] <= 24 && rest.board[0] >= rest.rail && rest.board[2] <= rest.vw, { board: rest.board, rail: rest.rail, vw: rest.vw });
      for (const side of ['front', 'back']) {
        const out = side === 'front' ? rest.frontGrip : rest.backGrip;
        ok(`${at} ${side} T closed: the opening tab stands outside the Board and points inward`, !!out && !cross(out, rest.board) && rest[`${side}Arrow`] === IN[side], { grip: out, board: rest.board, arrow: rest[`${side}Arrow`] });
        await press(GRIP[side]);
        const s = await S();
        const panel = s[side], grip = s[`${side}Grip`];
        ok(`${at} ${side} (premise): it opened`, !!panel, s);
        if (!panel) continue;
        ok(`${at} ${side} B: the Board and its cards have not moved`, J(s.board) === J(rest.board) && J(s.cards) === J(rest.cards), { rest: rest.board, open: s.board, cards: [rest.cards, s.cards] });
        const edge = side === 'front' ? 0 : 2;
        ok(`${at} ${side} A: its outer edge is the Board's edge`, Math.abs(panel[edge] - s.board[edge]) <= 1.5 && panel[0] >= s.board[0] - 1.5 && panel[2] <= s.board[2] + 1.5, { panel, board: s.board });
        const inner = side === 'front' ? !!grip && Math.abs(grip[0] - panel[2]) <= 2 : !!grip && Math.abs(grip[2] - panel[0]) <= 2;
        ok(`${at} ${side} T open: the closing tab is on the inner side, over the Board, pointing outward`, inner && cross(grip, s.board) && s[`${side}Arrow`] === OUT[side], { grip, panel, arrow: s[`${side}Arrow`] });
        const under = s.controls.filter((c) => cross(c, panel) || cross(c, grip));
        ok(`${at} ${side} C: the Board's own controls are not under the menu or its tab`, !!s.controls[0] && !!s.controls[1] && under.length === 0, { panel, grip, controls: s.controls });
        if (w === 1366 && side === 'front') {
          await ev("(() => { const a = document.querySelector('.desk-frame-sliver-anchor'); a.style.setProperty('translate', '40px 0', 'important'); })()");
          await sleep(300);
          const m = await S();
          ok('MUT the Front menu pushed 40 px off the Board\'s edge turns A\'s reading red', !!m.front && Math.abs(m.front[0] - m.board[0]) > 1.5, { panel: m.front, board: m.board });
          await ev("document.querySelector('.desk-frame-sliver-anchor').style.removeProperty('translate')");
          await sleep(300);
        }
        await press(GRIP[side]);
        await sleep(400);
        const c = await S();
        ok(`${at} ${side} Z: closed again, the Board and the tab are as before`, !c[`${side}Open`] && J(c.board) === J(rest.board) && J(c[`${side}Grip`]) === J(out), { board: [rest.board, c.board], grip: [out, c[`${side}Grip`]] });
      }
    }
  }
});

const failed = checks.filter((c) => !c.pass).length;
console.log(`\nFLUX-139-BOARD VERIFY: ${failed ? `FAIL - ${failed}/${checks.length} failed` : `PASS - ${checks.length}/${checks.length}`}`);
process.exit(failed ? 1 : 0);
