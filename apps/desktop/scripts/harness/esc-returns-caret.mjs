// ESC FROM AN OPEN MENU GIVES HER BACK HER CARET (bug-list #49, Fable, Nov 22, 3:05 am: "No caret after leaving ... with Esc (the focus stays on the hand's grip)"; Nick, 2:59 am: typing bugs ruin his testing). REPRODUCED on
// today's main by typing-bugs-probe.mjs (run 45011585976): in Draft, in every theme, press the Front menu's tab, press Esc: the menu closes and the focus stays on the TAB; a key typed next goes nowhere ("typed: false"), so she has to
// click the page before she can write again. The rule since drawer-mirror.mjs 5 was "focus returns to the drawer's tab" (an accessibility habit); for a writer the page is the place to go back to, so the rule becomes: Esc from inside a
// menu (its tab included) closes it and puts the focus back in the PAGE's editor, her caret where it was; a page with no editor (a Board) keeps the old rule.
//   E1  Front menu: open it by its tab, press Esc: it closes, the focus is in the page's editor, and the next key types at the caret (the page's words end with it)
//   E2  Back menu: the same
//   E3  the caret is where it WAS: with the caret in the middle of the page's words before the menu opened, the next key lands there, not at the end
//   E4  CONTROLS: an Esc pressed ON the page with the menu open still closes it and leaves the focus on the page (drawer-mirror 5b); Esc in Free Write still leaves the page for the stage tab (the keyboard's way out, unchanged)
// Run: node scripts/harness/esc-returns-caret.mjs (from apps/desktop; a box turn or Actions)
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const TEXT = 'The first line of her page.\nThe second line of her page.\nThe third line of her page.';
const THEMES = [{ name: 'Arbor', theme: 'plateau' }, { name: 'Machina', theme: 'machina' }, { name: 'Flux', theme: 'flux' }];

const STATE = () => `(() => {
  const ed = document.querySelector('.forward-only-editor');
  const a = document.activeElement;
  const sp = document.querySelector('.wz-sliver-panel'), tp = document.querySelector('.wz-tutor-panel');
  return { text: ed ? ed.innerText : null, onEditor: !!(a && a.closest && a.closest('.forward-only-editor')), active: a ? a.tagName + '.' + String(a.className).slice(0, 30) : null,
    frontOpen: sp ? sp.getAttribute('data-open') : null, backOpen: tp ? tp.getAttribute('data-open') : null };
})()`;

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 15000, label: 'splash gone' }).catch(() => {});
  await app.emulateDpr(1, 1920, 1080);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await splashGone();
  let seq = 0;
  const open = async (T, mode) => {
    const id = `esc-${Date.now()}-${seq += 1}`;
    await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: TEXT, createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })})`);
    await sleep(250);
    await ev(`(() => { localStorage.setItem('wrizo-theme', ${JSON.stringify(T.theme)}); localStorage.setItem('wrizo-mode-page-${id}', ${JSON.stringify(mode)}); history.replaceState(null, '', '/#/page/${id}'); })()`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 15000, label: 'the page' }).catch(() => {});
    await splashGone();
    await app.mouseMove(8, 8);
    await sleep(1500);
  };
  const esc = () => app.cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 }).then(() => app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 }));
  const caretEnd = () => ev("(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const s = getSelection(); s.selectAllChildren(ed); s.collapseToEnd(); return true; })()");
  const pressGrip = (sel) => ev(`(() => { const g = document.querySelector('${sel}'); g.focus(); g.click(); })()`);

  for (const T of THEMES) {
    // E1 / E2
    for (const [which, grip, openKey] of [['Front', '.wz-sliver-grip', 'frontOpen'], ['Back', '.wz-tutor-grip', 'backOpen']]) {
      await open(T, 'drafting');
      await caretEnd();
      await pressGrip(grip); await sleep(700);
      const opened = await ev(STATE());
      await esc(); await sleep(600);
      const after = await ev(STATE());
      await app.typeKeys('Q'); await sleep(250);
      const typed = await ev(STATE());
      ok(`${which === 'Front' ? 'E1' : 'E2'} [${T.name}] ${which} menu: Esc closes it, the focus is in the page's editor, and the next key types at her caret`,
        opened[openKey] === 'true' && after[openKey] === 'false' && after.onEditor === true && typeof typed.text === 'string' && typed.text.endsWith('Q'), JSON.stringify({ opened: opened[openKey], after: { open: after[openKey], onEditor: after.onEditor, active: after.active }, endsWithQ: typed.text && typed.text.endsWith('Q') }));
    }
    // E3: the caret in the middle of the words
    await open(T, 'drafting');
    await ev("(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); const n = w.nextNode(); const r = document.createRange(); r.setStart(n, 9); r.collapse(true); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()");
    await pressGrip('.wz-sliver-grip'); await sleep(700);
    await esc(); await sleep(600);
    await app.typeKeys('Z'); await sleep(250);
    const mid = await ev(STATE());
    ok(`E3 [${T.name}] the caret is where it WAS: a key typed after Esc lands in the first line, at the place she left it, not at the end`, typeof mid.text === 'string' && mid.text.split(String.fromCharCode(10))[0].startsWith('The firstZ') && !mid.text.endsWith('Z'), JSON.stringify(mid.text && mid.text.split(String.fromCharCode(10))[0]));
    // E4 controls
    await open(T, 'drafting');
    await pressGrip('.wz-sliver-grip'); await sleep(700);
    await ev("document.querySelector('.forward-only-editor').focus()");
    await esc(); await sleep(500);
    const c1 = await ev(STATE());
    ok(`E4a [${T.name}] CONTROL: an Esc pressed on the page with the Front menu open closes it and leaves the focus on the page (drawer-mirror 5b)`, c1.frontOpen === 'false' && c1.onEditor === true, JSON.stringify({ open: c1.frontOpen, onEditor: c1.onEditor }));
    if (T.theme !== 'flux') {
      await open(T, 'journal');
      await caretEnd();
      await esc(); await sleep(500);
      const c2 = await ev(STATE());
      ok(`E4b [${T.name}] CONTROL: in Free Write an Esc on the page still leaves it for the stage tab (the keyboard's way out)`, c2.onEditor === false && /desk-mode-tab/.test(c2.active || ''), JSON.stringify({ active: c2.active }));
    }
  }
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); checks.push({ name: 'HARNESS', pass: false, detail: String(e && e.message || e) }); }

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nESC-RETURNS-CARET VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nESC-RETURNS-CARET VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
