// #144 (Nick, Nov 27: "the Back menu still overlaps the page surface"; Fable, 1:52 pm: "on close, the page widens only once the menu has gone, or in step with its
// fade, never ahead of it, both sides"). THE REAL APP in each theme's own look, a Draft page, 1366x768, 1536x706 (his window) and 1920x885. EVERY FRAME is read,
// from the press until things stand still: a frame is bad where a menu that can still be seen crosses the page.
//   O   opening: no bad frame
//   X   closing by its own tab: no bad frame
//   K   closed by her typing, her pointer moving straight after: no bad frame
//   C   afterwards the page stands exactly where it stood
// Run: node scripts/harness/page-144.mjs   (from apps/desktop, dist-web built)
Object.assign(process.env, { WS_REORG: '1', WS_ARBOR2: 'default', WS_MACHINA2: 'default', WS_FLUX3: 'default' });
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${typeof detail === 'string' ? detail : JSON.stringify(detail)}]` : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);
const THEMES = [{ id: 'plateau', name: 'Arbor' }, { id: 'flux', name: 'Flux' }, { id: 'machina', name: 'Machina' }];
const SIZES = [[1366, 768], [1536, 706], [1920, 885]];
const SIDE = { front: { grip: '.wz-sliver-grip', panel: '.wz-sliver-panel' }, back: { grip: '.wz-tutor-grip', panel: '.wz-tutor-panel' } };

// one reading a frame, from now until stop(): is the panel still seen, and does it cross the page
const WATCH = (panel) => `(() => {
  const seen = (e) => { let o = 1; for (let a = e; a; a = a.parentElement) { const s = getComputedStyle(a); if (s.display === 'none') return 0; o *= Number(s.opacity); } return getComputedStyle(e).visibility === 'hidden' ? 0 : o; };
  const w = window.__w = { frames: 0, bad: [], stop: false };
  const t0 = performance.now();
  const step = () => {
    const page = document.querySelector('.desk-frame-stage .mode-page'); const p = document.querySelector('${panel}');
    if (page && p) { const a = page.getBoundingClientRect(), b = p.getBoundingClientRect(); const over = Math.min(a.right, b.right) - Math.max(a.left, b.left); const o = seen(p);
      w.frames += 1; if (over > 1 && b.height > 1 && o > 0.05) w.bad.push([Math.round(performance.now() - t0), Math.round(over), Math.round(o * 100) / 100]); }
    if (!w.stop) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  return true;
})()`;
const READ = '(() => { window.__w.stop = true; return { frames: window.__w.frames, bad: window.__w.bad.length, first: window.__w.bad.slice(0, 3) }; })()';
const PAGE = "(() => { const r = document.querySelector('.desk-frame-stage .mode-page').getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((n) => Math.round(n)).join(','); })()";

await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const isOpen = (side) => ev(side === 'front' ? "document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'" : "document.querySelector('.wz-tutor-grip')?.getAttribute('aria-expanded') === 'true'");
  const at = async (sel) => ev(`(() => { const b = document.querySelector(${J(sel)}); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  const click = async (sel) => { const p = await at(sel); if (!p) return false; await app.mouseMove(p.x, p.y); await app.mouseDown(p.x, p.y); await app.mouseUp(p.x, p.y); return true; };
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
  await ev(`window.wrizoCreateJournalPage(${J({ id: 'p144', text: 'The lamp burned low over the harbour.', createdAt: '2026-04-01T00:00:00.000Z', origin: null, source: 'page' })}); localStorage.setItem('wrizo-mode-page-p144', 'drafting'); window.wrizoFlushNow()`);

  for (const th of THEMES) {
    await ev("location.hash = '#/'");
    await ev(`localStorage.setItem('wrizo-theme', '${th.id}')`);
    await app.reload();
    await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
    for (const [w, h] of SIZES) {
      await app.emulateDpr(1, w, h);
      await ev("location.hash = '#/'"); await sleep(300);
      await ev("location.hash = '#/page/p144'");
      await app.waitFor("!!document.querySelector('.desk-frame-stage .forward-only-editor')", { label: 'the page', timeout: 15000 });
      await app.mouseMove(w / 2, 20);
      await sleep(1500);
      for (const side of ['front', 'back']) {
        const tag = `${th.name} ${w}x${h} ${side}`;
        const { grip, panel } = SIDE[side];
        const rest = await ev(PAGE);
        await ev(WATCH(panel)); await click(grip); await sleep(900);
        const o = await ev(READ);
        ok(`${tag} (premise): it opened, and its frames were read`, (await isOpen(side)) && o.frames >= 10, o);
        ok(`${tag} O: opening, no frame shows the menu over the page`, o.bad === 0, o);
        await app.mouseMove(w / 2, 20); await sleep(300);
        await ev(WATCH(panel)); await click(grip); await sleep(900);
        const x = await ev(READ);
        ok(`${tag} X: closing, no frame shows the menu over the page`, !(await isOpen(side)) && x.frames >= 10 && x.bad === 0, x);
        await app.mouseMove(w / 2, 20); await sleep(700);
        // closed by her typing, the pointer moving straight after
        await click(grip); await sleep(900);
        await ev("(() => { const ed = document.querySelector('.desk-frame-stage .forward-only-editor'); ed.focus(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); })()");
        await ev(WATCH(panel)); await app.typeKeys('a'); await app.mouseMove(w / 2, 24); await app.mouseMove(w / 2, 28); await sleep(900);
        const k = await ev(READ);
        ok(`${tag} K: closed by typing with the pointer moving straight after, no bad frame`, k.frames >= 10 && k.bad === 0, k);
        if (await isOpen(side)) { await click(grip); await sleep(900); }
        await app.mouseMove(w / 2, 20); await sleep(900);
        const after = await ev(PAGE);
        ok(`${tag} C: afterwards the page stands where it stood`, after === rest, [rest, after]);
      }
    }
  }
});

const failed = checks.filter((c) => !c.pass).length;
console.log(`\nPAGE-144 VERIFY: ${failed ? `FAIL - ${failed}/${checks.length} failed` : `PASS - ${checks.length}/${checks.length}`}`);
process.exit(failed ? 1 : 0);
