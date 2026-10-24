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
  // flux dark + light are the subject; plateau (Arbor) is the CONTROL: its recede is unchanged, so the timing check must go RED there (a check that cannot fail certifies nothing)
  for (const [theme, page] of [['flux', 'dark'], ['flux', 'light'], ['plateau', 'light']]) {
    const label = `${theme}/${page}`;
    await app.emulateDpr(1, 1400, 900);
    await app.goto('/');
    await q("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');");
    await app.reload();
    await waitSoft("!!document.querySelector('.wz-arrival')", { label: 'front door' });
    await waitSoft("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
    await sleep(600);
    await q(`window.wrizoTheme && window.wrizoTheme.set('${theme}')`);
    if (theme === 'flux') await q(`window.wrizoThemePrefs && window.wrizoThemePrefs.set({ page: '${page}' })`);
    await sleep(300);
    const id = `fg-${theme}-${page}`;
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
    const rest = await q(probe);   // the drawer at rest: every node's own level (a disabled control sits at its own 0.4 - the comparison below is relative to THIS, not to 1)
    // the dissolve's timing, measured IN the page on the frame clock: from the first keydown to the first frame at which every sampled node of the drawer is at or under 0.12
    await q(`(() => { const eff = ${eff}; const root = document.querySelector('.wz-sliver-panel'); const nodes = [...root.querySelectorAll('*')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1 && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()); }).slice(0, 14);
      window.__gh = { t0: null, floor: null, n: nodes.length }; document.addEventListener('keydown', () => { if (window.__gh.t0 === null) window.__gh.t0 = performance.now(); }, true);
      const tick = () => { const g = window.__gh; if (g.t0 !== null && g.floor === null && nodes.length && Math.max(...nodes.map(eff)) <= 0.12) g.floor = performance.now() - g.t0; if (g.floor === null) requestAnimationFrame(tick); }; requestAnimationFrame(tick); })()`);
    await q("document.querySelector('.forward-only-editor').focus()");
    const t0 = Date.now();
    await app.typeKeys(' more words ');
    await waitSoft("document.querySelector('[data-chrome-receded]')?.getAttribute('data-chrome-receded') === 'true'", { label: 'receded', timeout: 8000 });
    // how long the dissolve takes to reach the floor (information: a screenshot taken mid-fade shows a partway ghost)
    let toFloor = null, faded = null;
    for (let i = 0; i < 40; i += 1) { faded = await q(probe); if (faded && faded.length && Math.max(...faded.map((x) => x.o)) <= 0.12) { toFloor = Date.now() - t0; break; } await sleep(250); }
    await sleep(1500);
    const floorMs = await q('window.__gh && window.__gh.floor !== null ? Math.round(window.__gh.floor) : null');
    faded = await q(probe);
    const maxO = faded && faded.length ? Math.max(...faded.map((x) => x.o)) : null;
    const mid = (faded || []).filter((x) => x.o > 0.12);
    ok(`[${label}] premise: the left drawer is OPEN while writing and has contents to measure`, opened === 'true' && Array.isArray(faded) && faded.length > 3, JSON.stringify({ opened, n: faded && faded.length }));
    if (theme === 'flux') ok(`[${label}] the open drawer reaches the dissolve floor within 1.2 s of the first key (measured ${floorMs} ms, on the frame clock)`, floorMs !== null && floorMs <= 1200, String(floorMs));
    else {
      ok(`[${label}] CONTROL (Arbor, unchanged): the same measurement reads the old slow recede (${floorMs} ms) - so the 1.2 s check above can go red`, floorMs === null || floorMs > 1200, String(floorMs));
      if (shotAt) { /* no frame for the control */ }
      continue;
    }
    ok(`[${label}] receded while typing, an open drawer's contents sit at the dissolve floor (<= 0.12, ~8%) or are gone - no mid-level ghost (highest ${maxO})`, Array.isArray(faded) && faded.length > 3 && mid.length === 0, JSON.stringify(mid.slice(0, 8)));
    ok(`[${label}] (information) the dissolve reached the floor ${toFloor === null ? 'NEVER' : toFloor + ' ms'} after the first key`, true, String(toFloor));
    ok(`[${label}] (information) the drawer's contents while writing: ${faded ? faded.length : 0} painted node(s), effective opacity ${faded ? JSON.stringify([...new Set(faded.map((x) => x.o))].sort((p1, p2) => p1 - p2)) : 'n/a'}`, true, JSON.stringify((faded || []).slice(0, 6)));
    await app.mouseMove(700, 500); await app.mouseMove(720, 520); await sleep(400); await app.mouseMove(740, 540);
    const key = (x) => `${x.cls}|${x.t}`;
    const base = new Map((rest || []).map((x) => [key(x), x.o]));
    const short = (arr) => (arr || []).filter((x) => base.has(key(x)) && x.o < base.get(key(x)) * 0.9);
    let back = null;
    for (let i = 0; i < 20; i += 1) { await sleep(200); back = await q(probe); if (back && back.length && short(back).length === 0) break; }
    const stillLow = short(back);
    ok(`[${label}] on mouse move every node of the drawer comes back to its own resting level (${stillLow.length} still under 90% of it)`, Array.isArray(back) && back.length > 3 && stillLow.length === 0, JSON.stringify(stillLow.slice(0, 6).map((x) => ({ ...x, rest: base.get(key(x)) }))));
    if (shotAt) { fs.writeFileSync(shotAt.replace(/(\.png)?$/, `-${page}.png`), Buffer.from(await app.screenshot(), 'base64')); }
  }
});
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}${c.pass && c.detail && /information/.test(c.name) ? '  [' + c.detail + ']' : ''}`);
const failed = checks.filter((c) => !c.pass);
console.log(failed.length ? `\nFLUX-GHOST-PROBE VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nFLUX-GHOST-PROBE VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
