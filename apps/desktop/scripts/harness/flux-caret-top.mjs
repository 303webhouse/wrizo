// THE FLUX BLOCK CARET OPENS IN THE WRONG PLACE WITH THE REORG TOP BAR ON (POLISH's frames run 45117617449, flux-reorg-front @ 8ce5e884; "blocks flux.top"): with the top bar on in Flux the brass block caret is drawn mid-page
// (477,447, 24 px high) while the selection is at the text's end (889,176, 17 px high), and stays there until something moves the selection. The page settles after the caret's last redraw and nothing wakes it
// (FluxBlockCaret redraws on a selection change, a scroll, a resize, wz-caret-moved; the top bar's arrival moves the page by none of those).
//   FC1  Flux with the reorg's top bar on (?reorg=1&reorglift=flux.top): a few seconds after a Draft page opens, the block caret is drawn where the selection is (its left and top within 4 px of the selection's, its height within 3 px)
//   FC2  the same after a Free Write page opens (Wire In)
//   FC3  CONTROL: with no lift the caret is where the selection is (the reorg off: the caret was right there before)
// Run: node scripts/harness/flux-caret-top.mjs (from apps/desktop; a box turn or Actions)
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const TEXT = 'The harbour was quiet when she arrived. Nobody met her at the quay, and the ferry had already gone back across the water.';
const READ = `(() => { const c = document.querySelector('.flux-block-caret'); const r = c && c.getBoundingClientRect(); const s = getSelection(); let x = null;
  try { x = s && s.rangeCount ? [...s.getRangeAt(0).getClientRects()].filter((q) => q.height > 0).pop() || s.getRangeAt(0).getBoundingClientRect() : null; } catch { x = null; }
  return { caret: r && r.width ? [Math.round(r.left), Math.round(r.top), Math.round(r.height)] : null, sel: x && x.height ? [Math.round(x.left), Math.round(x.top), Math.round(x.height)] : null, active: document.activeElement ? document.activeElement.className.toString().slice(0, 30) : null }; })()`;
const near = (r) => !!r && !!r.caret && !!r.sel && Math.abs(r.caret[0] - r.sel[0]) <= 4 && Math.abs(r.caret[1] - r.sel[1]) <= 4 && Math.abs(r.caret[2] - r.sel[2]) <= 3;
const CASES = [
  { id: 'FC1', mode: 'drafting', lift: 'flux.top', what: 'a Draft page, the top bar on' },
  { id: 'FC2', mode: 'journal', lift: 'flux.top', what: 'a Free Write page, the top bar on' },
  { id: 'FC3', mode: 'drafting', lift: '', what: 'a Draft page, the reorg off (control)' },
];

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  for (const w of [1366]) {
    await app.emulateDpr(1, w, 768);
    for (const c of CASES) {
      await app.goto('/');
      await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');");
      await ev("localStorage.setItem('wrizo-theme', 'flux'); localStorage.setItem('wrizo-theme-prefs', JSON.stringify({ page: 'dark' }))");
      await app.reload();
      await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seam', timeout: 25000 });
      await app.waitFor("!document.querySelector('.wz-splash')", { timeout: 20000, label: 'splash gone' }).catch(() => {});
      const id = `fc-${c.id}`;
      await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: TEXT, createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })}); localStorage.setItem('wrizo-mode-page-${id}', '${c.mode}'); window.wrizoFlushNow && window.wrizoFlushNow(); null`);
      await ev(`history.replaceState(null, '', '/?${c.lift ? 'reorg=1&arbor2=0&' : ''}flux3=1${c.lift ? '&reorglift=' + c.lift : ''}#/page/${id}')`);
      await app.reload();
      await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.mode-page')", { label: 'the page', timeout: 20000 }).catch(() => {});
      await sleep(4000);
      const r = await ev(READ);
      ok(`${c.id} [${w}] ${c.what}: the block caret is drawn where the selection is (4 px; height 3)`, near(r), JSON.stringify(r));
    }
  }
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); checks.push({ name: 'HARNESS', pass: false, detail: String(e && e.message || e) }); }

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nFLUX-CARET-TOP VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nFLUX-CARET-TOP VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
