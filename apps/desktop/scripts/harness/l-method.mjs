// L-METHOD - the shared L method (scripts/lib/l-method.mjs) run on its own, on whatever tree is built: the control against itself must be GREEN, and +5 ms and +10 ms of busy-wait
// added to every key in one arm must be RED on the main-thread cost reading (INK, Nov 9; Fable's ruling: L's second reading). It is the control bracket for a box turn (run it on
// origin/main before and after a feature's L) and the proof that the method can still see a slow key. No feature is judged here: the page is a plain Flux page (the flag off).
// Run: node scripts/harness/l-method.mjs (from apps/desktop; a box turn). On Actions it prints the method as INFORMATION unless L_METHOD_FORCE=1 (a software renderer is too noisy to judge).
import { withHarness } from '../runtime-verify.mjs';
import { makeL } from '../lib/l-method.mjs';

const ON_BOX = process.env.GITHUB_ACTIONS !== 'true';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const LAT_TEXT = Array.from({ length: 150 }, (_, i) => 'word' + i).join(' ');

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  await app.emulateDpr(1, 1920, 1080);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-theme', 'flux');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await app.waitFor("!document.querySelector('.wz-splash')", { timeout: 15000, label: 'splash gone' }).catch(() => {});
  let seq = 0;
  const L = makeL({
    app, ev, sleep, cycle: 'the signal holds while she writes on ',
    // both arms are the same plain page: a fresh page through the app's seam, opened, the caret at the end
    prepare: async () => {
      const id = `lmethod-${Date.now()}-${seq += 1}`;
      await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: LAT_TEXT, createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })})`);
      await sleep(300);
      await ev(`history.replaceState(null, '', '/#/page/${id}')`);
      await app.reload();
      await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 15000, label: 'the page' }).catch(() => {});
      await app.waitFor("!document.querySelector('.wz-splash')", { timeout: 15000, label: 'splash gone' }).catch(() => {});
      await ev("(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const s = getSelection(); s.selectAllChildren(ed); s.collapseToEnd(); return true; })()");
      await app.mouseMove(8, 8);
      await sleep(1200);
      return { editor: !!(await ev("!!document.querySelector('.forward-only-editor')")) };
    },
    stoodRight: (arm, on, stood) => !!(stood && stood.editor),
  });
  if (ON_BOX || process.env.L_METHOD_FORCE === '1') await L.run(ok, { onlyMethod: true });
  else console.log('INFO L-METHOD (Actions: timing is the box\'s to judge; L_METHOD_FORCE=1 runs it here)');
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); checks.push({ name: 'HARNESS', pass: false, detail: String(e && e.message || e) }); }

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nL-METHOD VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nL-METHOD VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
