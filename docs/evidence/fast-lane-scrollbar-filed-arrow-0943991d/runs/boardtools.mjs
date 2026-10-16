// BOARD: where does the Tools drawer go when it opens? (this desk's probe, worktree named by WT) - the panel's rect, opacity, transform, z-index, what is painted at its centre.
const { withHarness } = await import(`file:///C:/Users/nickh/writer-studio/.claude/worktrees/${process.env.WT}/apps/desktop/scripts/runtime-verify.mjs`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
await withHarness(async (app) => {
  await app.emulateDpr(1, 1280, 800);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1');
    localStorage.setItem('wrizo-theme-prefs', ${JSON.stringify(JSON.stringify({ voice: 'serif', page: 'dark', fade: 'on' }))}); localStorage.setItem('wrizo-theme', 'plateau');
    localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
  await app.evalJs(`window.wrizoCreateJournalPage({ id: 'bt-board', text: 'Board', pageType: 'board', createdAt: new Date().toISOString(), origin: null, boxes: [{ id: 'bt-card', kind: 'text', x: 0.05, y: 0.05, w: 0.3, h: 0.1, z: 1, text: 'Card words here' }] })`);
  await sleep(500);
  await app.evalJs("location.hash = '#/page/bt-board'");
  await waitSoft(app, "!!document.querySelector('.desk-frame')", { label: 'board', timeout: 9000 }); await sleep(900);
  for (const step of ['closed', 'after-click']) {
    if (step === 'after-click') { await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await sleep(1500); }
    const r = await app.evalJs(`(() => { const rc = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)]; };
      const sl = document.querySelector('.wz-sliver'); const pn = document.querySelector('.wz-sliver-panel'); const slide = document.querySelector('.wz-sliver-panel > .wz-drawer-slide');
      const cs = (e) => e ? (({ opacity, transform, zIndex, visibility, display, pointerEvents }) => ({ opacity, transform, zIndex, visibility, display, pointerEvents }))(getComputedStyle(e)) : null;
      const c = pn ? rc(pn) : null; const mid = c ? document.elementFromPoint((c[0] + c[2]) / 2, (c[1] + c[3]) / 2) : null;
      return { dataOpen: sl && sl.getAttribute('data-open'), sliver: rc(sl), panel: c, panelCs: cs(pn), slideCs: cs(slide), grip: rc(document.querySelector('.wz-sliver-grip')),
        centreHit: mid && (mid.className ? String(mid.className).slice(0, 60) : mid.tagName), frame: rc(document.querySelector('.desk-frame')) }; })()`);
    console.log(`BOARDTOOLS ${process.env.WT} ${step} ${JSON.stringify(r)}`);
  }
});
