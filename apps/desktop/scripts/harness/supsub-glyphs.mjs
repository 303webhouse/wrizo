// THE SUPERSCRIPT AND SUBSCRIPT BUTTONS LOOK ALIKE (POLISH's writing audit, Nov 22, Arbor and Flux frames; Machina has the same markup and rule): in the Front menu's styling row both read "x2", the 2 centred on the line.
// Cause (POLISH): .wz-sliver-format .mode-tbtn is display:inline-flex, so the <sup> and <sub> inside become flex items and vertical-align no longer applies. One shared rule at the cause.
//   SG1  the superscript button draws its 2 ABOVE the middle of the button and the subscript button draws its 2 BELOW it (the sup's centre is at least 1.5 px above the button's centre, the sub's at least 1.5 px below, and the two differ by 4 px or more)
//   SG2  the sup's 2 sits above the x beside it in the same button (its centre is at least 2 px above the x's centre)
//   SG3  CONTROL: the buttons keep their size: each is as wide and as tall as the B / I / U buttons beside it (the fix moves a glyph, never the row)
// In Machina (?reorg=1) and Arbor (?reorg=1&arbor2=1 with the preview door ?reorglift=plateau.*), a Draft page, the Front menu's TEXT tab.
// Run: node scripts/harness/supsub-glyphs.mjs (from apps/desktop; a box turn or Actions)
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const LIFT = ['top', 'front', 'back', 'split', 'uplink'].map((p) => `plateau.${p}`).join(',');
const CFGS = [
  { name: 'Machina', theme: 'machina', q: 'reorg=1' },
  { name: 'Arbor', theme: 'plateau', q: `reorg=1&arbor2=1&reorglift=${LIFT}` },
];
const READ = `(() => {
  const row = document.querySelector('.wz-sliver .wz-sliver-format--letters'); if (!row) return null;
  const btn = (k) => row.querySelector('[data-style-pick="' + k + '"]');
  const sup = btn('sup'), sub = btn('sub');
  if (!sup || !sub) return { missing: true, picks: [...row.querySelectorAll('button')].map((b) => b.getAttribute('data-style-pick') || (b.textContent || '').trim()) };
  const cy = (r) => (r.top + r.bottom) / 2;
  const supEl = sup.querySelector('sup'), subEl = sub.querySelector('sub');
  let xEl = null; if (sup.firstChild && sup.firstChild.nodeType === 3) { const rg = document.createRange(); rg.selectNodeContents(sup.firstChild); xEl = rg.getBoundingClientRect(); }
  const bb = (b) => { const r = b.getBoundingClientRect(); return [Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10]; };
  const others = ['bold', 'italic', 'underline'].map((k) => row.querySelector('[data-style-pick="' + k + '"]')).filter(Boolean);
  const first = row.querySelector('button:not([data-style-pick="sup"]):not([data-style-pick="sub"])');
  return { supRel: supEl ? cy(supEl.getBoundingClientRect()) - cy(sup.getBoundingClientRect()) : null, subRel: subEl ? cy(subEl.getBoundingClientRect()) - cy(sub.getBoundingClientRect()) : null,
    supVsX: supEl && xEl ? cy(supEl.getBoundingClientRect()) - cy(xEl) : null, supBox: bb(sup), subBox: bb(sub), refBox: first ? bb(first) : null };
})()`;

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  await app.emulateDpr(1, 1920, 1080);
  for (const cfg of CFGS) {
    await app.goto('/');
    await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');");
    await ev(`localStorage.setItem('wrizo-theme', '${cfg.theme}')`);
    await ev(`history.replaceState(null, '', '/?${cfg.q}')`);
    await app.reload();
    await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seam', timeout: 25000 });
    await app.waitFor("!document.querySelector('.wz-splash')", { timeout: 20000, label: 'splash gone' }).catch(() => {});
    await ev("window.wrizoCreateJournalPage({ id: 'sg-1', text: 'Water is H2O. Area is x2.', createdAt: '2026-04-01T00:00:00.000Z', source: 'page', origin: 'loose' }); localStorage.setItem('wrizo-mode-page-sg-1', 'drafting'); window.wrizoFlushNow(); null");
    await ev("location.hash = '#/page/sg-1'");
    await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.wz-sliver-grip')", { label: 'the page', timeout: 20000 }).catch(() => {});
    await sleep(1200);
    await ev('document.querySelector(\'.reorg-top .desk-mode-tab[data-mode-key="draft"]\')?.click(); null'); await sleep(900);
    if (!(await ev("document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'"))) { await ev("document.querySelector('.wz-sliver-grip')?.click(); null"); await sleep(700); }
    await ev("document.getElementById('wz-sliver-tab-text')?.click(); null"); await sleep(500);
    const r = await ev(READ);
    const there = !!r && !r.missing && r.supRel !== null && r.subRel !== null;
    ok(`SG1 [${cfg.name}] the superscript button draws its 2 above the button's middle and the subscript button draws its 2 below it`, there && r.supRel <= -1.5 && r.subRel >= 1.5 && r.subRel - r.supRel >= 4, JSON.stringify(r));
    ok(`SG2 [${cfg.name}] the sup's 2 sits above the x beside it`, there && r.supVsX !== null && r.supVsX <= -2, JSON.stringify(r));
    ok(`SG3 [${cfg.name}] CONTROL: the two buttons are the size of the others in the row (width and height)`, there && !!r.refBox && Math.abs(r.supBox[0] - r.refBox[0]) <= 3 && Math.abs(r.supBox[1] - r.refBox[1]) <= 1 && Math.abs(r.subBox[0] - r.refBox[0]) <= 3 && Math.abs(r.subBox[1] - r.refBox[1]) <= 1, JSON.stringify(r));
  }
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); checks.push({ name: 'HARNESS', pass: false, detail: String(e && e.message || e) }); }

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nSUPSUB-GLYPHS VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nSUPSUB-GLYPHS VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
