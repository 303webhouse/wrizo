// FLUX-PAGE-INK FRAMES (this desk): the page text in Free Write and in Draft, per theme/tone, from the worktree named by WT (its own dist-web); FRAMES_OUT = folder.
// Per frame: the editor's computed colour, the first opaque background behind it, the WCAG contrast ratio.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const { withHarness } = await import(`file:///C:/Users/nickh/writer-studio/.claude/worktrees/${process.env.WT}/apps/desktop/scripts/runtime-verify.mjs`);
const OUT = process.env.FRAMES_OUT; mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const COMBOS = [
  { id: 'flux-dark', theme: 'flux', page: 'dark' }, { id: 'flux-light', theme: 'flux', page: 'light' }, { id: 'arbor', theme: 'plateau', page: 'dark' },
];
const rows = [];
await withHarness(async (app) => {
  for (const c of COMBOS) for (const mode of ['freewrite', 'draft']) {
    await app.emulateDpr(1, 1400, 900);
    await app.goto('/');
    await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1');
      localStorage.setItem('wrizo-theme-prefs', ${JSON.stringify(JSON.stringify({ voice: 'serif', page: c.page, fade: 'on' }))}); localStorage.setItem('wrizo-theme', ${JSON.stringify(c.theme)});
      localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
    await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
    const id = `fpi-${c.id}-${mode}`;
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: 'The ferry was late, so Ada counted gulls instead of minutes.', createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })})`);
    if (mode === 'draft') await app.evalJs(`localStorage.setItem('wrizo-mode-page-${id}', 'drafting')`);
    await sleep(500);
    await app.evalJs(`location.hash = '#/page/${id}'`);
    await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'the page', timeout: 9000 }); await sleep(1000);
    const r = await app.evalJs(`(() => {
      const lum = (col) => { const m = col.match(/[\\d.]+/g).map(Number); const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]); };
      const opaqueBg = (el) => { for (let n = el; n; n = n.parentElement) { const b = getComputedStyle(n).backgroundColor; const m = b.match(/[\\d.]+/g); if (m && (m.length < 4 || Number(m[3]) === 1)) return { color: b, tag: n.className ? String(n.className).split(' ')[0] : n.tagName }; } return null; };
      const ed = document.querySelector('.forward-only-editor'); if (!ed) return null;
      const col = getComputedStyle(ed).color; const bg = opaqueBg(ed);
      const ratio = bg ? (Math.max(lum(col), lum(bg.color)) + 0.05) / (Math.min(lum(col), lum(bg.color)) + 0.05) : null;
      return { theme: document.documentElement.getAttribute('data-theme'), page: document.documentElement.getAttribute('data-page'), mode: (document.querySelector('.desk-mode-tab[aria-selected="true"], .desk-mode-tab[data-active="true"]') || {}).textContent || null,
        editorColor: col, bg, ratio: ratio && Math.round(ratio * 100) / 100, bundle: ([...document.scripts].map((s) => s.src).find((s) => s.indexOf('assets/index-') >= 0) || '').replace(/^.*assets\\//, ''), origin: location.origin }; })()`);
    writeFileSync(join(OUT, `${c.id}-${mode}.png`), Buffer.from(await app.screenshot(), 'base64'));
    const row = { frame: `${c.id}-${mode}`, ...r }; rows.push(row); console.log('FPI ' + JSON.stringify(row));
  }
});
writeFileSync(join(OUT, 'frames.json'), JSON.stringify(rows, null, 2) + '\n');
console.log(`FPI FRAMES: ${rows.length} -> ${OUT}`);
