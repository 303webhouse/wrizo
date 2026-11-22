// AFTER A REPLACE, THE KEYBOARD STAYS IN THE SEARCH (POLISH's writing audit R4, Nov 22, 10:50 pm, 4 of 4 jobs; "yours if you want it"): after Replace all, keyboard focus drops to the body, so her next keys go nowhere until she clicks. The likely cause (POLISH):
// the button she pressed turns disabled once no finds are left (SearchMenu.tsx: disabled={!found.here.length || !s.repl}); a focused button that becomes disabled, or a row's Replace button that goes with its hit, drops the focus to the body.
//   RF1  Replace all (the first press, with the replacement typed): focus stays in the search menu (the active element is inside the Back drawer: the search field), and a letter typed next goes into the search field
//   RF2  Replace on one hit (the row's own button): the same - the focus is not dropped to the body
//   RF3  CONTROLS: the replacement happened (the page's words changed: no "toll" left after Replace all, "fee" in its place) and Undo is offered (the button is there)
// In Machina (?reorg=1) and Arbor (?reorg=1&arbor2=1 with the preview door ?reorglift=plateau.*).
// Run: node scripts/harness/replace-focus.mjs (from apps/desktop; a box turn or Actions)
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const TEXT = 'The toll road ran along the river. She paid the toll at dusk and wrote it down. The toll was low.';
const LIFT = ['top', 'front', 'back', 'split', 'uplink'].map((p) => `plateau.${p}`).join(',');
const CFGS = [{ name: 'Machina', theme: 'machina', q: 'reorg=1' }, { name: 'Arbor', theme: 'plateau', q: `reorg=1&arbor2=1&reorglift=${LIFT}` }];
const STATE = () => `(() => {
  const tp = document.querySelector('.wz-tutor-panel'); const a = document.activeElement; const q = document.querySelector('[data-search-q]'); const ed = document.querySelector('.forward-only-editor');
  return { active: a ? a.tagName + '.' + String(a.className).slice(0, 26) + (a.hasAttribute && a.hasAttribute('data-search-q') ? '[search]' : '') : null, inDrawer: !!(a && tp && tp.contains(a)), onBody: !a || a === document.body, q: q ? q.value : null, text: ed ? ed.innerText.replace(/\\u200b/g, '') : null,
    hasUndo: !!document.querySelector('[data-replace-undo]'), ones: document.querySelectorAll('[data-replace-one]').length };
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
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 20000 });
    await app.waitFor("!document.querySelector('.wz-splash')", { timeout: 20000, label: 'splash gone' }).catch(() => {});
    await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seam', timeout: 20000 });
    let n = 0;
    const openSearch = async () => {
      const id = `rf-${Date.now().toString(36)}-${n += 1}`;
      await ev("location.hash = '#/'"); await sleep(300);
      await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: TEXT, createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })})`);
      await ev(`localStorage.setItem('wrizo-mode-page-${id}', 'drafting')`);
      await sleep(400);
      await ev(`location.hash = '#/page/${id}'`);
      await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('[data-top-search]')", { label: 'the page and the door', timeout: 20000 });
      await sleep(1500);
      await ev("document.querySelector('[data-top-search]').click()");
      await app.waitFor("!!document.querySelector('[data-search-q]')", { label: 'the search field', timeout: 8000 }).catch(() => {});
      await sleep(700);
      await ev("(() => { const q = document.querySelector('[data-search-q]'); if (q) { q.focus(); q.select(); } return true; })()");
      await app.typeKeys('toll'); await app.key('Enter'); await sleep(900);
      await ev("(() => { const t = document.querySelector('[data-replace-toggle]'); if (t && t.getAttribute('aria-expanded') !== 'true') t.click(); return true; })()");
      await sleep(500);
      await ev("(() => { const r = document.querySelector('[data-replace-with]'); if (r) { r.focus(); } return true; })()");
      await app.typeKeys('fee'); await sleep(500);
    };
    // RF1: Replace all
    await openSearch();
    await ev("(() => { const b = document.querySelector('[data-replace-all]'); if (b) { b.focus(); b.click(); } return true; })()");
    await sleep(1000);
    const a = await ev(STATE());
    await app.typeKeys('x'); await sleep(400);
    const a2 = await ev(STATE());
    ok(`RF1 [${cfg.name}] after Replace all the focus is still in the search menu (not the body), and a letter typed next goes into the search field`, a.inDrawer === true && a.onBody === false && typeof a2.q === 'string' && a2.q.includes('x'), JSON.stringify({ active: a.active, inDrawer: a.inDrawer, onBody: a.onBody, qAfterKey: a2.q }));
    ok(`RF3 [${cfg.name}] CONTROLS: the words were replaced (no "toll" left, "fee" in its place) and Undo is offered`, typeof a.text === 'string' && !/toll/.test(a.text) && /fee/.test(a.text) && a.hasUndo === true, JSON.stringify({ text: (a.text || '').slice(0, 60), hasUndo: a.hasUndo }));
    // RF2: one hit
    await openSearch();
    const before = await ev(STATE());
    await ev("(() => { const b = document.querySelector('[data-replace-one]'); if (b) { b.focus(); b.click(); } return true; })()");
    await sleep(1000);
    const b = await ev(STATE());
    ok(`RF2 [${cfg.name}] after Replace on one hit (its own button) the focus is not dropped to the body: it is still in the search menu`, before.ones >= 1 && b.inDrawer === true && b.onBody === false, JSON.stringify({ ones: before.ones, active: b.active, inDrawer: b.inDrawer, onBody: b.onBody }));
  }
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); checks.push({ name: 'HARNESS', pass: false, detail: String(e && e.message || e) }); }

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nREPLACE-FOCUS VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nREPLACE-FOCUS VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
