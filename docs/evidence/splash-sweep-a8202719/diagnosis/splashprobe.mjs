// splash-sweep S12 diagnosis (this desk): on a DEFAULT-hold boot (no wrizo-splash-hold key), how long is .wz-splash in the DOM per theme, and at what first-poll latency does the harness's waitFor see it?
// WT names the worktree. For each theme: clear storage, set only first-run + theme, reload, then poll .wz-splash every 15 ms for up to 12 s, recording first-seen and last-seen times (ms since the reload call returned).
const { withHarness } = await import(`file:///C:/Users/nickh/writer-studio/.claude/worktrees/${process.env.WT}/apps/desktop/scripts/runtime-verify.mjs`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await withHarness(async (app) => {
  for (const theme of ['plateau', 'flux', 'flux']) {
    await app.emulateDpr(1, +(process.env.VW || 1280), +(process.env.VH || 800));
    await app.goto('/');
    await app.evalJs(`localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-theme', ${JSON.stringify(theme)});`);
    await app.reload();
    const t0 = Date.now(); let first = null, last = null, n = 0, tone = null, kinds = new Set();
    while (Date.now() - t0 < 12000) {
      const s = await app.evalJs(`(() => { const e = document.querySelector('.wz-splash'); return e ? { tone: e.getAttribute('data-tone'), leaving: e.getAttribute('data-leaving'), cls: String(e.className), kids: [...e.children].map((c) => String(c.className).slice(0, 28)) } : null; })()`);
      if (s) { if (first === null) first = Date.now() - t0; last = Date.now() - t0; n += 1; tone = s.tone; kinds.add(JSON.stringify(s.kids)); }
      else if (first !== null) break;
      await sleep(15);
    }
    console.log('SPROBE ' + JSON.stringify({ wt: process.env.WT, theme, firstSeenMs: first, lastSeenMs: last, polls: n, tone, structures: [...kinds].slice(0, 2) }));
  }
});
