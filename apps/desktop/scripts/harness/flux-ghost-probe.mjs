// FLUX GHOST PROBE (Nick's live note, Oct 23: "the left drawer's contents show faintly while writing with it closed; closed = fully gone"). A DIAGNOSTIC that becomes a check:
// on a Flux Draft page with the left drawer CLOSED, type until the chrome has receded, then list every element inside the drawer that is still painted at an EFFECTIVE opacity
// above 0.02 (own opacity multiplied up the ancestor chain) with a real box. Closed means fully gone: the list must be empty, apart from the drawer's own tab (the grip, which is how it
// is reopened and may sit at the dissolve floor, never above it).
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
    const closed = await q("document.querySelector('.wz-sliver')?.getAttribute('data-open')");
    await q("document.querySelector('.forward-only-editor').focus()");
    await app.typeKeys(' more words ');
    await waitSoft("document.querySelector('[data-chrome-receded]')?.getAttribute('data-chrome-receded') === 'true'", { label: 'receded', timeout: 8000 });
    await sleep(2500);
    const seen = await q(`(() => { const root = document.querySelector('.wz-sliver'); if (!root) return null; const eff = (e) => { let o = 1, n = e; while (n && n !== document.documentElement) { o *= parseFloat(getComputedStyle(n).opacity); n = n.parentElement; } return o; };
      const out = []; for (const e of [root, ...root.querySelectorAll('*')]) { const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1 || cs.visibility === 'hidden' || cs.display === 'none') continue;
        const o = eff(e); const painted = (e.textContent || '').trim().length > 0 || e.tagName === 'svg' || (cs.backgroundColor !== 'rgba(0, 0, 0, 0)') || parseFloat(cs.borderTopWidth) > 0; if (o > 0.02 && painted) out.push({ cls: String(e.className).slice(0, 36) || e.tagName, o: Math.round(o * 1000) / 1000, text: (e.children.length ? '' : (e.textContent || '').trim().slice(0, 24)), x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }); }
      return out; })()`);
    ok(`[${page}] the left drawer is CLOSED to start with`, closed === 'false', String(closed));
    const nonGrip = (seen || []).filter((x) => !/wz-sliver-grip/.test(x.cls));
    ok(`[${page}] closed = fully gone: while writing, no element of the closed drawer is painted at an effective opacity above 0.02 (the grip aside)`, Array.isArray(seen) && nonGrip.length === 0, JSON.stringify(nonGrip.slice(0, 12)));
    const grip = (seen || []).filter((x) => /wz-sliver-grip/.test(x.cls));
    ok(`[${page}] (information) the grip's own effective opacity while writing: ${JSON.stringify(grip.map((g) => g.o))}`, true, JSON.stringify(grip));
    if (shotAt) { fs.writeFileSync(shotAt.replace(/(\.png)?$/, `-${page}.png`), Buffer.from(await app.screenshot(), 'base64')); }
  }
});
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}${c.pass && c.detail && /information/.test(c.name) ? '  [' + c.detail + ']' : ''}`);
const failed = checks.filter((c) => !c.pass);
console.log(failed.length ? `\nFLUX-GHOST-PROBE VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nFLUX-GHOST-PROBE VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
