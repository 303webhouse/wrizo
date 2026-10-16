// SPLASH TONE FRAMES (this desk; fix/splash-tone: "the splash swaps to the light-theme sketch on the dark veil"). Worktree named by WT; FRAMES_OUT = folder.
// The app is reloaded ON a light page route (Flux light, and Arbor) with a long splash hold, so what is UNDER the veil is light while the veil itself is solid dark.
// Per frame: the veil's data-tone, which sketch asset is shown (for-dark-theme / for-light-theme), the veil's own computed background, and what window.wrizoBackdropTone.measure() answers.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const { withHarness } = await import(`file:///C:/Users/nickh/writer-studio/.claude/worktrees/${process.env.WT}/apps/desktop/scripts/runtime-verify.mjs`);
const OUT = process.env.FRAMES_OUT; mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const COMBOS = [{ id: 'flux-light', theme: 'flux', page: 'light' }, { id: 'arbor', theme: 'plateau', page: 'dark' }];
const rows = [];
await withHarness(async (app) => {
  for (const c of COMBOS) {
    await app.emulateDpr(1, 1280, 800);
    await app.goto('/');
    await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1');
      localStorage.setItem('wrizo-theme-prefs', ${JSON.stringify(JSON.stringify({ voice: 'serif', page: c.page, fade: 'on' }))}); localStorage.setItem('wrizo-theme', ${JSON.stringify(c.theme)});
      localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
    await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
    const id = `sp-${c.id}`;
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: 'The ferry was late, so Ada counted gulls instead of minutes.', createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })})`);
    await sleep(600);
    if (typeof app.evalJs === 'function') await app.evalJs("window.wrizoFlushNow && window.wrizoFlushNow()");
    await app.evalJs(`location.hash = '#/page/${id}'; localStorage.setItem('wrizo-splash-hold','9000');`);
    await sleep(400);
    await app.reload();
    const up = await waitSoft(app, "!!document.querySelector('.wz-splash')", { label: 'the splash', timeout: 9000 });
    await sleep(900);
    const r = await app.evalJs(`(() => { const el = document.querySelector('.wz-splash'); const veil = document.querySelector('.wz-splash-veil'); const img = el && el.querySelector('img');
      const vcs = veil ? getComputedStyle(veil) : null;
      return { mounted: !!el, tone: el && el.getAttribute('data-tone'), src: img ? img.getAttribute('src') : null, veilBg: vcs && vcs.backgroundColor, measured: window.wrizoBackdropTone ? window.wrizoBackdropTone.measure() : null,
        hash: location.hash, theme: document.documentElement.getAttribute('data-theme'), page: document.documentElement.getAttribute('data-page'),
        bundle: ([...document.scripts].map((s) => s.src).find((x) => x.indexOf('assets/index-') >= 0) || '').replace(/^.*assets\\//, '') }; })()`);
    writeFileSync(join(OUT, `${c.id}-splash-over-light-page.png`), Buffer.from(await app.screenshot(), 'base64'));
    const row = { frame: c.id, up, ...r }; rows.push(row); console.log('SPL ' + JSON.stringify(row));
  }
});
writeFileSync(join(OUT, 'frames.json'), JSON.stringify(rows, null, 2) + '\n');
console.log(`SPL FRAMES: ${rows.length} -> ${OUT}`);
