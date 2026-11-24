// THE FLUX SWITCH-OVER (Nick, Nov 22, 9:09 pm: "the full Flux redesign + the Flux reorg all live"; Fable's plan, piece 1 of the switch-over: "FLUX3 on by default, ?flux3=0 turns it off, red first"). Today the redesign shows only
// behind ?flux3=1 (src/flux3/flag.ts). It flips to ON for everyone in Flux, and ?flux3=0 is the test's way out.
//   FD1  Flux with NO query: the redesign is on (the root carries data-flux3) and the doc's frame is drawn (the header across the page's top)
//   FD2  Flux with ?flux3=0: the redesign is off (no data-flux3 on the root, no doc header): the Flux of before
//   FD3  Flux with ?flux3=1 is still on (the old door keeps working)
//   FD4  Machina and Arbor with NO query draw NOTHING of the redesign (no doc header, no readout strip, no Schema layer): the redesign is Flux's, whatever the flag says
// Run: node scripts/harness/flux3-default-on.mjs (from apps/desktop; a box turn or Actions)
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const CFGS = [
  { id: 'FD1', theme: 'flux', q: '', wantOn: true, what: 'Flux with no query' },
  { id: 'FD2', theme: 'flux', q: 'flux3=0', wantOn: false, what: 'Flux with ?flux3=0' },
  { id: 'FD3', theme: 'flux', q: 'flux3=1', wantOn: true, what: 'Flux with ?flux3=1' },
  { id: 'FD4', theme: 'machina', q: '', wantOn: false, what: 'Machina with no query' },
  { id: 'FD4', theme: 'plateau', q: '', wantOn: false, what: 'Arbor with no query' },
];
const READ = `(() => { const head = document.querySelector('[data-flux3-dochead]'); const tele = document.querySelector('.flux3-tele'); const ed = document.querySelector('.forward-only-editor');
  return { root: document.documentElement.hasAttribute('data-flux3'), head: !!head, tele: !!tele, editor: !!ed, theme: document.documentElement.getAttribute('data-theme') }; })()`;

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  await app.emulateDpr(1, 1920, 1080);
  for (const c of CFGS) {
    await app.goto('/');
    await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');");
    await ev(`localStorage.setItem('wrizo-theme', '${c.theme}'); localStorage.setItem('wrizo-theme-prefs', JSON.stringify({ page: 'dark' }))`);
    await ev(`history.replaceState(null, '', '/${c.q ? '?' + c.q : ''}')`);
    await app.reload();
    await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seam', timeout: 25000 });
    await app.waitFor("!document.querySelector('.wz-splash')", { timeout: 20000, label: 'splash gone' }).catch(() => {});
    const id = `fd-${c.theme}-${Date.now().toString(36)}`;
    await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: 'A page of words for the frame to draw around.', createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })})`);
    await ev(`localStorage.setItem('wrizo-mode-page-${id}', 'drafting'); window.wrizoFlushNow && window.wrizoFlushNow(); null`);
    await ev(`location.hash = '#/page/${id}'`);
    await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.mode-page')", { label: 'the page', timeout: 20000 }).catch(() => {});
    await sleep(2200);   // past the gutter's pause: the frame has measured
    const r = await ev(READ);
    if (c.wantOn) ok(`${c.id} ${c.what}: the redesign is on (root marked, the doc's header drawn)`, r.theme === c.theme && r.root && r.head, JSON.stringify(r));
    else if (c.theme === 'flux') ok(`${c.id} ${c.what}: the redesign is off (no root mark, no doc header)`, r.theme === c.theme && !r.root && !r.head && r.editor, JSON.stringify(r));
    else ok(`${c.id} ${c.what}: nothing of the redesign is drawn (no doc header, no readout strip)`, r.theme === c.theme && !r.head && !r.tele && r.editor, JSON.stringify(r));
  }
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); checks.push({ name: 'HARNESS', pass: false, detail: String(e && e.message || e) }); }

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nFLUX3-DEFAULT-ON VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nFLUX3-DEFAULT-ON VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
