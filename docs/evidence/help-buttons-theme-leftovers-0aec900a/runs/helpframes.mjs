// HELP BUTTONS FRAMES (this desk; Fable: "the '?' open in both themes"). WT names the worktree; FRAMES_OUT = folder.
// Per theme (Arbor, Flux): a Draft page with the left drawer open - (1) the Templates "?" open, (2) the Free Write tab's "?" open. Records the pop's text, whether it uses brass (it must not), and the page's rect before and after
// the pop opens (page primacy: the rect must not change).
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const { withHarness } = await import(`file:///C:/Users/nickh/writer-studio/.claude/worktrees/${process.env.WT}/apps/desktop/scripts/runtime-verify.mjs`);
const OUT = process.env.FRAMES_OUT; mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const rows = [];
const rect = (app) => app.evalJs(`(() => { const e = document.querySelector('.mode-page') || document.querySelector('.forward-only-editor'); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; })()`);
const popFacts = (app) => app.evalJs(`(() => { const p = document.querySelector('.wz-help-pop'); if (!p) return null; const cs = getComputedStyle(p); const brass = (() => { const i = document.createElement('i'); i.style.color = 'var(--brass)'; document.body.appendChild(i); const c = getComputedStyle(i).color; i.remove(); return c; })();
  const kids = [p, ...p.querySelectorAll('*')].map((e) => getComputedStyle(e)); const usesBrass = kids.some((s) => s.color === brass || s.borderTopColor === brass || s.backgroundColor === brass);
  return { text: p.textContent.trim().slice(0, 140), color: cs.color, bg: cs.backgroundColor, border: cs.borderTopColor, usesBrass }; })()`);
await withHarness(async (app) => {
  for (const [theme, id] of [['plateau', 'arbor'], ['flux', 'flux']]) {
    await app.emulateDpr(1, 1280, 800);
    await app.goto('/');
    await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-theme', ${JSON.stringify(theme)});
      localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
    await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
    const pid = `hbf-${id}`;
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: pid, text: 'The ferry was late, so Ada counted gulls instead of minutes.', origin: 'loose', source: 'page', createdAt: new Date().toISOString() })})`);
    await app.evalJs(`localStorage.setItem('wrizo-mode-page-${pid}', 'drafting')`);
    await sleep(500); await app.evalJs(`location.hash = '#/page/${pid}'`);
    await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'the page', timeout: 9000 }); await sleep(900);
    if ((await app.evalJs("(document.querySelector('.wz-sliver-panel') || {}).dataset && document.querySelector('.wz-sliver-panel').dataset.open")) !== 'true') { await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await sleep(900); }
    for (const [name, sel] of [['templates', '.wz-sliver-templates .wz-sliver-h .wz-help'], ['free-write-tab', '.desk-mode-tab-wrap .wz-help[aria-label^="What is Free"]']]) {
      await app.evalJs("document.querySelector('.wz-help-pop') && document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))"); await sleep(300);
      const before = await rect(app);
      const found = await app.evalJs(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return false; b.scrollIntoView({ block: 'center' }); return true; })()`); await sleep(300);
      await app.evalJs(`document.querySelector(${JSON.stringify(sel)})?.click()`); await sleep(700);
      const pop = await popFacts(app); const after = await rect(app);
      writeFileSync(join(OUT, `${id}-${name}-help-open.png`), Buffer.from(await app.screenshot(), 'base64'));
      const row = { theme: id, which: name, buttonFound: found, pop, pageRectBefore: before, pageRectAfter: after, pageRectUnchanged: JSON.stringify(before) === JSON.stringify(after),
        bundle: await app.evalJs("([...document.scripts].map((s) => s.src).find((x) => x.indexOf('assets/index-') >= 0) || '').split('assets/').pop()") };
      rows.push(row); console.log('HLPF ' + JSON.stringify(row));
    }
  }
});
writeFileSync(join(OUT, 'frames.json'), JSON.stringify(rows, null, 2) + '\n');
console.log(`HLPF FRAMES: ${rows.length} -> ${OUT}`);
