// PEN STRIP FRAME (this desk; Fable: "one Flux pen-strip frame"; theme-leftovers d9022766 themes .mode-bar's fill via --chrome-surface). WT names the worktree; FRAMES_OUT = folder.
// Flux and Arbor, a loose page opened in Free Write, unframed 900x900 (as the leftover frames were): records the computed fill / edge / text colour of .mode-bar (the strip above the page) and of the strip's own children,
// and the page's backdrop for scale; screenshots each. Seeds through the seams, resets the address first (a reload on a deep link never shows the front door).
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const { withHarness } = await import(`file:///C:/Users/nickh/writer-studio/.claude/worktrees/${process.env.WT}/apps/desktop/scripts/runtime-verify.mjs`);
const OUT = process.env.FRAMES_OUT; mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rows = [];
const BASE = "localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');";
const toDesk = async (app, store) => { await app.evalJs("location.hash = '#/'"); await sleep(300); await app.evalJs(store); await app.reload(); await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' }); await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 }).catch(() => {}); await sleep(400); };
const bundle = (app) => app.evalJs("([...document.scripts].map((s) => s.src).find((x) => x.indexOf('assets/index-') >= 0) || '').split('assets/').pop()");
await withHarness(async (app) => {
  await app.emulateDpr(1, 900, 900); await app.goto('/');
  for (const [theme, id] of [['flux', 'flux'], ['plateau', 'arbor']]) {
    await toDesk(app, `localStorage.clear(); sessionStorage.clear(); ${BASE} localStorage.setItem('wrizo-theme', ${JSON.stringify(theme)});`);
    const pid = `psf-${id}`;
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: pid, text: 'A loose page, to look at the strip above it.', origin: 'loose', source: 'page', createdAt: '2026-05-01T00:00:00.000Z' })})`);
    await sleep(300); await app.evalJs(`location.hash = '#/page/${pid}'`);
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'the page' }); await sleep(1100);
    const facts = await app.evalJs(`(() => { const bar = document.querySelector('.mode-bar'); if (!bar) return { found: false };
      const cs = getComputedStyle(bar); const r = bar.getBoundingClientRect();
      const kids = [...bar.querySelectorAll('button, span, i, label')].slice(0, 8).map((e) => ({ tag: e.tagName, cls: String(e.className).slice(0, 30), text: (e.textContent || '').trim().slice(0, 12), color: getComputedStyle(e).color, bg: getComputedStyle(e).backgroundColor }));
      return { found: true, rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], bg: cs.backgroundColor, bgImage: cs.backgroundImage.slice(0, 80), border: cs.borderTopColor, color: cs.color, htmlBg: getComputedStyle(document.documentElement).backgroundColor, kids }; })()`);
    writeFileSync(join(OUT, `${id}-pen-strip.png`), Buffer.from(await app.screenshot(), 'base64'));
    const row = { theme: id, ...facts, bundle: await bundle(app) }; rows.push(row); console.log('PSF ' + JSON.stringify(row));
  }
});
writeFileSync(join(OUT, 'frames.json'), JSON.stringify(rows, null, 2) + '\n');
console.log(`PSF FRAMES: ${rows.length} -> ${OUT}`);
