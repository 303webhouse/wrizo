// FAINT-TEXT-SWEEP FRAMES (this desk; Fable: "word count and placeholder in Arbor, Flux light and Flux dark; a 'Missing page' pin"). Worktree named by WT (its own dist-web); FRAMES_OUT = folder.
// Per tone: (1) a page with words - the word-count overlay (800 px wide: the unframed bar), (2) an EMPTY page - the placeholder / ghost text, (3) a board with a pin to a page that was never created - "Missing page".
// Records the computed colour and contrast of the word count and of the pin's own label, and the two '-low' tokens against their cream surfaces.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const { withHarness } = await import(`file:///C:/Users/nickh/writer-studio/.claude/worktrees/${process.env.WT}/apps/desktop/scripts/runtime-verify.mjs`);
const OUT = process.env.FRAMES_OUT; mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const TONES = [['plateau', 'light', 'arbor'], ['flux', 'light', 'flux-light'], ['flux', 'dark', 'flux-dark']];
const rows = [];
const contrast = (app, sel) => app.evalJs(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null;
  const parse = (c) => c.match(/[\\d.]+/g).slice(0, 3).map(Number);
  const lum = (rgb) => { const [r, g, b] = rgb.map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const opaque = (e) => { for (let n = e; n; n = n.parentElement) { const b = getComputedStyle(n).backgroundColor; const m = b.match(/[\\d.]+/g); if (m && (m.length < 4 || Number(m[3]) === 1)) return b; } return null; };
  const fg = getComputedStyle(el).color, bg = opaque(el); if (!bg) return { fg, bg: null };
  const a = lum(parse(fg)), b = lum(parse(bg)); return { fg, bg, ratio: Math.round(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)) * 100) / 100 }; })()`);
const fresh = async (app, theme, page, width) => {
  await app.emulateDpr(1, width, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-splash-hold','50')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
  if (theme === 'flux') await app.evalJs("window.wrizoTheme.set('flux')");
  if (page === 'dark') await app.evalJs("window.wrizoThemePrefs.set({ page: 'dark' })");
  await sleep(300);
};
await withHarness(async (app) => {
  for (const [theme, page, id] of TONES) {
    // (1) word count
    await fresh(app, theme, page, 800);
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: `ff-wc-${id}`, text: 'The ferry was late, so Ada counted gulls instead of minutes.', origin: 'loose', source: 'page', createdAt: '2026-05-01T00:00:00.000Z' })})`);
    await sleep(300); await app.evalJs(`location.hash = '#/page/ff-wc-${id}'`);
    await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'the page', timeout: 9000 }); await sleep(900);
    const wc = await contrast(app, '.mode-wordcount');
    const tok = await app.evalJs(`(() => { const cs = getComputedStyle(document.documentElement); return { paperLow: cs.getPropertyValue('--ink-on-paper-low').trim(), cardLow: cs.getPropertyValue('--ink-on-card-low').trim(), bundle: ([...document.scripts].map((s) => s.src).find((x) => x.indexOf('assets/index-') >= 0) || '').replace(/^.*assets\\//, '') }; })()`);
    writeFileSync(join(OUT, `${id}-1-wordcount.png`), Buffer.from(await app.screenshot(), 'base64'));
    // (2) placeholder: an empty page
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: `ff-ph-${id}`, text: '', origin: 'loose', source: 'page', createdAt: '2026-05-02T00:00:00.000Z' })})`);
    await sleep(300); await app.evalJs(`location.hash = '#/page/ff-ph-${id}'`);
    await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'the empty page', timeout: 9000 }); await sleep(1200);
    writeFileSync(join(OUT, `${id}-2-placeholder.png`), Buffer.from(await app.screenshot(), 'base64'));
    // (3) the Missing page pin
    await fresh(app, theme, page, 1400);
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: `ff-bd-${id}`, text: 'Faint text sweep board', pageType: 'board', origin: 'loose', source: 'page', createdAt: '2026-05-01T00:00:00.000Z',
      boxes: [{ id: 'ff-missing-pin', kind: 'page-pin', x: 0.1, y: 0.08, w: 0.22, h: 0.16, z: 1, entryId: 'ff-never-created' }] })})`);
    await sleep(300); await app.evalJs(`location.hash = '#/page/ff-bd-${id}'`);
    await waitSoft(app, "!!document.querySelector('[data-box-id=\"ff-missing-pin\"]')", { label: 'the board pin', timeout: 9000 }); await sleep(800);
    const pin = await contrast(app, '[data-box-id="ff-missing-pin"] .board-pin-missing');
    writeFileSync(join(OUT, `${id}-3-missing-page-pin.png`), Buffer.from(await app.screenshot(), 'base64'));
    const row = { tone: id, wordCount: wc, missingPin: pin, tokens: tok }; rows.push(row); console.log('FFR ' + JSON.stringify(row));
  }
});
writeFileSync(join(OUT, 'frames.json'), JSON.stringify(rows, null, 2) + '\n');
console.log(`FFR FRAMES: ${rows.length} tones x 3 -> ${OUT}`);
