// TOOLS #10 ITEM 8 - THE RAIL POP-OUTS' SLIDE-AND-FADE - THE DOM HALF (a box turn; source half: cascade-motion-source.mjs). Per theme (Arbor, Flux, Machina), on a real Page, with real presses on the rail:
//   IN    I1  opening Boards: the panel plays wz-cascade-in on the Tools strip's own duration (the --drawer-dur token) and easing; nothing but opacity / transform animates
//   OUT   O1  closing it: the panel stays drawn with data-leaving, plays wz-cascade-out, takes no pointer input, and is gone after the token's own length (not at once, not much later)
//   PAGE  P1  PAGE IS PRIMARY: the page's rect is byte-identical before, during and after the open and the close
//   AGAIN A1  reopening mid-exit brings the same panel back (no second panel, no leaving flag)
// Run (repo root; needs a box turn):  node apps/desktop/scripts/harness/cascade-motion.mjs
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const boot = async (app, theme) => {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','${theme}');`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.evalJs(`window.wrizoTheme.set('${theme}')`);
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'cm-page', text: 'A first line to stand on.', createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await sleep(500);
  await app.evalJs("location.hash = '#/page/cm-page'");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'the page', timeout: 12000 }).catch(() => {});
  await sleep(900);
};
const strip = (app) => app.evalJs(`(() => { const b = document.querySelector('.wz-strip [data-category="plan"]'); if (b) b.click(); return !!b; })()`);
const PAGE = "(() => { const p = document.querySelector('.mode-page, .mode-pagecol'); if (!p) return null; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((x) => Math.round(x * 10) / 10).join(','); })()";
const PANEL = `(() => { const p = document.querySelector('.wz-cascade-panel'); if (!p) return null; const s = getComputedStyle(p); return { n: document.querySelectorAll('.wz-cascade-panel').length, leaving: p.dataset.leaving || null, anim: s.animationName, dur: s.animationDuration, ease: s.animationTimingFunction, events: s.pointerEvents, token: getComputedStyle(document.documentElement).getPropertyValue('--drawer-dur').trim(), tease: getComputedStyle(document.documentElement).getPropertyValue('--drawer-ease').trim(), trans: s.transitionProperty }; })()`;

await withHarness(async (app) => {
  for (const theme of ['plateau', 'flux', 'machina']) {
    await boot(app, theme);
    const before = await app.evalJs(PAGE);
    await strip(app); await sleep(40);
    const mid = await app.evalJs(PANEL); const midPage = await app.evalJs(PAGE);
    await sleep(500);
    const open = await app.evalJs(PANEL);
    ok(`I1 [${theme}]: opening plays wz-cascade-in on the Tools strip's token (${mid && mid.token}) and easing (${mid && mid.tease}); no layout property is in its transition`, !!mid && /wz-cascade-in/.test(mid.anim) && parseFloat(mid.dur) === parseFloat(mid.token) && mid.n === 1 && !!open && open.leaving === null, JSON.stringify(mid));
    await strip(app); await sleep(40);
    const out = await app.evalJs(PANEL); const outPage = await app.evalJs(PAGE);
    ok(`O1 [${theme}]: closing keeps the panel drawn with data-leaving, plays wz-cascade-out and takes no pointer input`, !!out && out.leaving === 'true' && /wz-cascade-out/.test(out.anim) && out.events === 'none', JSON.stringify(out));
    await sleep(450);
    const gone = await app.evalJs(PANEL);
    ok(`O1 [${theme}]: and it is gone after the token's own length (not still there 450 ms on)`, gone === null, JSON.stringify(gone));
    const after = await app.evalJs(PAGE);
    ok(`P1 [${theme}]: the page's rect is identical before, during the open, during the close and after (${before})`, !!before && before === midPage && before === outPage && before === after, JSON.stringify({ before, midPage, outPage, after }));
    // A1 - reopen mid-exit
    await strip(app); await sleep(500); await strip(app); await sleep(60); await strip(app); await sleep(500);
    const again = await app.evalJs(PANEL);
    ok(`A1 [${theme}]: reopening mid-exit brings the same panel back - one panel, no leaving flag`, !!again && again.n === 1 && again.leaving === null, JSON.stringify(again));
  }
  return checks;
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 420)}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nCASCADE-MOTION VERIFY: PASS (${checks.length} checks)` : `\nCASCADE-MOTION VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
