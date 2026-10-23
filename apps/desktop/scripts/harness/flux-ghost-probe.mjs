// FLUX GHOST PROBE (Nick's live note, Oct 23: while writing, the left side panel's contents show faintly beside the page). A check, not a diagnostic: it holds the rule below.
// on a Flux Draft page with the left drawer OPEN, type until the chrome has receded, then measure the EFFECTIVE opacity (own opacity multiplied up the ancestor chain) of everything the drawer
// shows. The rule: dissolve floor (~8%) or gone, never a mid-level ghost; back on mouse move.
// Run (a box turn): node scripts/harness/flux-ghost-probe.mjs [--shot <file.png>]
import fs from 'node:fs';
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shotAt = process.argv.includes('--shot') ? process.argv[process.argv.indexOf('--shot') + 1] : null;

const { withHarness } = await import('../runtime-verify.mjs');
await withHarness(async (app) => {
  const q = (js) => app.evalJs(js);
  const waitSoft = async (expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
  for (const page of ['dark', 'light']) {
    await app.emulateDpr(1, 1400, 900);
    await app.goto('/');
    await q("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');");
    await app.reload();
    await waitSoft("!!document.querySelector('.wz-arrival')", { label: 'front door' });
    await waitSoft("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
    await sleep(600);
    await q("window.wrizoTheme && window.wrizoTheme.set('flux')");
    await q(`window.wrizoThemePrefs && window.wrizoThemePrefs.set({ page: '${page}' })`);
    await sleep(300);
    const id = `fg-${page}`;
    await q(`window.wrizoCreateJournalPage({ id: '${id}', text: 'The kettle clicks off and she still does not turn around.', origin: 'loose', source: 'page', createdAt: '2026-05-01T00:00:00.000Z' }); window.wrizoFlushNow(); localStorage.setItem('wrizo-mode-page-${id}', 'drafting');`);
    await sleep(500);
    await q(`location.hash = '#/page/${id}'`);
    await waitSoft("!!document.querySelector('.forward-only-editor')", { label: 'draft page' });
    await sleep(900);
    // Nick's note (Fable's reading, Oct 23): the left side panel (Docs/Tracks, Typeface, Format, Actions, Presets) was OPEN while he typed and its contents faded only PARTWAY, still faintly
    // readable beside the page. RULE: when the chrome recedes while typing, an open drawer's contents go to the dissolve floor (~8%) or fully gone - never a mid-level ghost - and come back on mouse move.
    await q("document.querySelector('.wz-sliver-grip')?.click()"); await sleep(1200);
    const opened = await q("document.querySelector('.wz-sliver')?.getAttribute('data-open')");
    const eff = `(e) => { let o = 1, n = e; while (n && n !== document.documentElement) { o *= parseFloat(getComputedStyle(n).opacity); n = n.parentElement; } return Math.round(o * 1000) / 1000; }`;
    const probe = `(() => { const eff = ${eff}; const root = document.querySelector('.wz-sliver-panel'); if (!root) return null; const out = [];
      for (const e of root.querySelectorAll('*')) { const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1 || cs.visibility === 'hidden' || cs.display === 'none') continue;
        const own = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 0) || e.tagName === 'svg' || e.tagName === 'INPUT' || e.tagName === 'BUTTON'; if (!own) continue; out.push({ cls: String(e.className).slice(0, 34) || e.tagName, o: eff(e), t: (e.textContent || '').trim().slice(0, 18) }); }
      return out; })()`;
    await q("document.querySelector('.forward-only-editor').focus()");
    await app.typeKeys(' more words ');
    await waitSoft("document.querySelector('[data-chrome-receded]')?.getAttribute('data-chrome-receded') === 'true'", { label: 'receded', timeout: 8000 });
    await sleep(3000);
    const faded = await q(probe);
    const maxO = faded && faded.length ? Math.max(...faded.map((x) => x.o)) : null;
    const mid = (faded || []).filter((x) => x.o > 0.12);
    ok(`[${page}] premise: the left drawer is OPEN while writing and has contents to measure`, opened === 'true' && Array.isArray(faded) && faded.length > 3, JSON.stringify({ opened, n: faded && faded.length }));
    ok(`[${page}] receded while typing, an open drawer's contents sit at the dissolve floor (<= 0.12, ~8%) or are gone - no mid-level ghost (highest ${maxO})`, Array.isArray(faded) && faded.length > 3 && mid.length === 0, JSON.stringify(mid.slice(0, 8)));
    ok(`[${page}] (information) the drawer's contents while writing: ${faded ? faded.length : 0} painted node(s), effective opacity ${faded ? JSON.stringify([...new Set(faded.map((x) => x.o))].sort((p1, p2) => p1 - p2)) : 'n/a'}`, true, JSON.stringify((faded || []).slice(0, 6)));
    await app.mouseMove(700, 500); await app.mouseMove(720, 520); await sleep(400); await app.mouseMove(740, 540);
    let back = null;
    for (let i = 0; i < 20; i += 1) { await sleep(200); back = await q(probe); if (back && back.length && Math.min(...back.map((x) => x.o)) > 0.9) break; }
    const backMin = back && back.length ? Math.min(...back.map((x) => x.o)) : null;
    ok(`[${page}] on mouse move the drawer's contents come back (lowest effective opacity ${backMin})`, backMin !== null && backMin > 0.9, JSON.stringify((back || []).filter((x) => x.o <= 0.9).slice(0, 6)));
    if (shotAt) { fs.writeFileSync(shotAt.replace(/(\.png)?$/, `-${page}.png`), Buffer.from(await app.screenshot(), 'base64')); }
  }
});
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}${c.pass && c.detail && /information/.test(c.name) ? '  [' + c.detail + ']' : ''}`);
const failed = checks.filter((c) => !c.pass);
console.log(failed.length ? `\nFLUX-GHOST-PROBE VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nFLUX-GHOST-PROBE VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
