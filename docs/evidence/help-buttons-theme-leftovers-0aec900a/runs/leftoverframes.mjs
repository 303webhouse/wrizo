// THEME-LEFTOVERS FRAMES (this desk; Fable: "a Flux loose page before/after (no brown), Flux light Free Write ink, the Arbor 'Font' heading"). The branch's own capture tool crashes at its second seeding step
// (it reloads while the previous page's address is still a deep link, so the front door never appears) - this is the same three frames with the address reset first. WT names the worktree; FRAMES_OUT = folder.
// Records the facts behind each frame: html/body paint and the lamp glow (frame 1), the editor's ink colour and its contrast (frame 2), the Typeface section heading text (frame 3).
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const { withHarness } = await import(`file:///C:/Users/nickh/writer-studio/.claude/worktrees/${process.env.WT}/apps/desktop/scripts/runtime-verify.mjs`);
const OUT = process.env.FRAMES_OUT; mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rows = [];
const bundle = (app) => app.evalJs("([...document.scripts].map((s) => s.src).find((x) => x.indexOf('assets/index-') >= 0) || '').split('assets/').pop()");
const toDesk = async (app, store) => { await app.evalJs("location.hash = '#/'"); await sleep(300); await app.evalJs(store); await app.reload(); await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' }); await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 }).catch(() => {}); await sleep(400); };
const BASE = "localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');";
const shot = async (app, name, extra) => { writeFileSync(join(OUT, `${name}.png`), Buffer.from(await app.screenshot(), 'base64')); const row = { frame: name, ...extra, bundle: await bundle(app) }; rows.push(row); console.log('LOF ' + JSON.stringify(row)); };
await withHarness(async (app) => {
  // 1. a Flux loose page, unframed (900 px) - the body's own backdrop and the DeskRail show around the page
  await app.emulateDpr(1, 900, 900); await app.goto('/');
  await toDesk(app, `localStorage.clear(); sessionStorage.clear(); ${BASE} localStorage.setItem('wrizo-theme','flux');`);
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'lof-flux', text: 'A loose page under Flux.', origin: 'loose', source: 'page', createdAt: '2026-05-01T00:00:00.000Z' })})`);
  await sleep(300); await app.evalJs("location.hash = '#/page/lof-flux'"); await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'the page' }); await sleep(900);
  const f1 = await app.evalJs(`(() => { const cs = getComputedStyle(document.documentElement), bs = getComputedStyle(document.body), root = cs.getPropertyValue('--lamp-glow').trim();
    return { htmlBg: cs.backgroundColor, bodyBgImage: bs.backgroundImage.slice(0, 160), lampGlowToken: root.slice(0, 160), dataTheme: document.documentElement.getAttribute('data-theme') }; })()`);
  await shot(app, 'flux-loose-page', f1);
  // 2. Flux, light page, Free Write - the default pen ink
  await toDesk(app, `localStorage.clear(); sessionStorage.clear(); ${BASE} localStorage.setItem('wrizo-theme','flux'); localStorage.setItem('wrizo-theme-prefs', JSON.stringify({ voice: 'serif', page: 'light', fade: 'on' }));`);
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'lof-ink', text: "Free Write, Flux light - this line should read in Flux's own ink.", origin: 'loose', source: 'page', createdAt: '2026-05-01T00:00:00.000Z' })})`);
  await sleep(300); await app.evalJs("location.hash = '#/page/lof-ink'"); await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'the page' }); await sleep(900);
  const f2 = await app.evalJs(`(() => { const ed = document.querySelector('.forward-only-editor'); const lum = (c) => { const m = c.match(/[\\d.]+/g).map(Number); const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]); };
    const col = getComputedStyle(ed).color; let bg = null; for (let n = ed; n; n = n.parentElement) { const b = getComputedStyle(n).backgroundColor; const m = b.match(/[\\d.]+/g); if (m && (m.length < 4 || Number(m[3]) === 1)) { bg = b; break; } }
    const a = lum(col), b2 = bg ? lum(bg) : null; return { mode: (document.querySelector('.desk-mode-tab.active') || {}).textContent || null, inkColor: col, pageBg: bg, ratio: b2 === null ? null : Math.round(((Math.max(a, b2) + 0.05) / (Math.min(a, b2) + 0.05)) * 100) / 100 }; })()`);
  await shot(app, 'flux-light-freewrite-ink', f2);
  // 3. Arbor, Draft, framed, the Typeface section's heading
  await app.emulateDpr(1, 1400, 900);
  await toDesk(app, `localStorage.clear(); sessionStorage.clear(); ${BASE}`);
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'lof-arbor', text: 'A page to open in Draft.', origin: 'loose', source: 'page', createdAt: '2026-05-01T00:00:00.000Z' })})`);
  await app.evalJs("localStorage.setItem('wrizo-mode-page-lof-arbor', 'drafting')");
  await sleep(300); await app.evalJs("location.hash = '#/page/lof-arbor'"); await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'the page' }); await sleep(700);
  if ((await app.evalJs("(document.querySelector('.wz-sliver-panel') || {}).dataset && document.querySelector('.wz-sliver-panel').dataset.open")) !== 'true') { await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await sleep(900); }
  const f3 = await app.evalJs(`({ typeSectionHeading: ((document.querySelector('.wz-sliver-type .wz-sliver-h') || {}).textContent || null), allSliverHeadings: [...document.querySelectorAll('.wz-sliver .wz-sliver-h')].map((h) => h.textContent.trim()).slice(0, 8) })`);
  await shot(app, 'arbor-font-heading', f3);
});
writeFileSync(join(OUT, 'frames.json'), JSON.stringify(rows, null, 2) + '\n');
console.log(`LOF FRAMES: ${rows.length} -> ${OUT}`);
