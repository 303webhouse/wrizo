// FLUX DARK PAGE TEXT - a measurement (this desk): on the worktree named by WT, Flux with the DARK page tone, a loose page with a few words;
// the editor's computed text colour, the first opaque background behind it, and the WCAG contrast ratio. Run once per build to localise a regression.
const { withHarness } = await import(`file:///C:/Users/nickh/writer-studio/.claude/worktrees/${process.env.WT}/apps/desktop/scripts/runtime-verify.mjs`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
await withHarness(async (app) => {
  for (const [id, theme, page] of [['flux-dark', 'flux', 'dark'], ['flux-light', 'flux', 'light'], ['arbor', 'plateau', 'dark']]) {
    await app.emulateDpr(1, 1400, 900);
    await app.goto('/');
    await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1');
      localStorage.setItem('wrizo-theme-prefs', ${JSON.stringify(JSON.stringify({ voice: 'serif', page, fade: 'on' }))}); localStorage.setItem('wrizo-theme', '${theme}');
      localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
    await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'fd-page', text: 'A loose page with a few words in it.', createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })})`);
    await sleep(500);
    await app.evalJs("location.hash = '#/page/fd-page'");
    await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'the page', timeout: 9000 }); await sleep(900);
    const r = await app.evalJs(`(() => {
      const lum = (c) => { const m = c.match(/[\\d.]+/g).map(Number); const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]); };
      const opaqueBg = (el) => { for (let n = el; n; n = n.parentElement) { const b = getComputedStyle(n).backgroundColor; const m = b.match(/[\\d.]+/g); if (m && (m.length < 4 || Number(m[3]) === 1)) return { color: b, tag: n.className ? String(n.className).split(' ')[0] : n.tagName }; } return null; };
      const ed = document.querySelector('.forward-only-editor'); if (!ed) return null;
      const col = getComputedStyle(ed).color; const bg = opaqueBg(ed);
      const ratio = bg ? (Math.max(lum(col), lum(bg.color)) + 0.05) / (Math.min(lum(col), lum(bg.color)) + 0.05) : null;
      return { theme: document.documentElement.getAttribute('data-theme'), page: document.documentElement.getAttribute('data-page'), editorColor: col, bg, ratio: ratio && Math.round(ratio * 100) / 100,
        bundle: ([...document.scripts].map((s) => s.src).find((s) => s.indexOf('assets/index-') >= 0) || '').replace(/^.*assets\\//, '') }; })()`);
    console.log(`FDT ${process.env.WT} ${id} ${JSON.stringify(r)}`);
  }
});
