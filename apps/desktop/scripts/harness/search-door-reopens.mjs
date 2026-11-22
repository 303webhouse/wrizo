// THE SEARCH DOOR OPENS THE SEARCH AGAIN (Fable, Nov 22, 3:20 pm; POLISH's writing audit R3, run 45076050345 live / 45076053647 preview, all 4 jobs: "after the writer clicks back into the page, the search door does nothing"). The repro: on a Page press the top
// rail's search door [data-top-search], type "toll", press Enter (2 hits), click back into the page and type, press the door again: the Back drawer stays shut (.wz-tutor-panel data-open is not 'true'), the Replace toggle sits under the page's stage, focus is left on
// the door, and the search is still open behind the drawer ([data-search-q] still reads "toll"). The cause, from the source: going back to the page shuts the drawer but leaves the search open; openSearch on an open search only bumps `opened`
// (reorg/search/searchStore.ts) and the drawer opens only in the effect keyed on [search.open] (components/Tutor.tsx), so the bump never reaches it.
//   SD0  PREMISE: the first press of the door opens the Back drawer on the search, and typing "toll" and Enter finds it; a click into the page shuts the drawer and the search stays open
//   SD1  the door pressed again opens the Back drawer on her search: .wz-tutor-panel is open, [data-search-q] is on screen (the element under its centre is inside the drawer) and still reads what she searched
//   SD2  and it is the SAME search: Replace's toggle is reachable too (on screen, inside the drawer), and the word is still selected for typing over (the field holds the focus)
//   SD3  closing the search (its own back arrow / Escape) still gives the Back menu back as it was, and a door pressed after THAT opens a fresh search (the premise of the old behaviour)
// In Machina (?reorg=1) and Arbor (?reorg=1&arbor2=1 with the preview door ?reorglift=plateau.*).
// Run: node scripts/harness/search-door-reopens.mjs (from apps/desktop; a box turn or Actions)
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const TEXT = 'The toll road ran along the river. She paid the toll at dusk and wrote it down.';
const LIFT = ['top', 'front', 'back', 'split', 'uplink'].map((p) => `plateau.${p}`).join(',');
const CFGS = [{ name: 'Machina', theme: 'machina', q: 'reorg=1' }, { name: 'Arbor', theme: 'plateau', q: `reorg=1&arbor2=1&reorglift=${LIFT}` }];
const READ = () => `(() => {
  const tp = document.querySelector('.wz-tutor-panel'); const q = document.querySelector('[data-search-q]'); const rep = document.querySelector('[data-search-replace-toggle], [data-replace-toggle]');
  const inside = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); if (r.width <= 0 || r.height <= 0) return false; const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!(t && (t === el || el.contains(t) || (tp && tp.contains(t)))); };
  return { open: tp ? tp.getAttribute('data-open') : null, q: q ? q.value : null, qOnScreen: inside(q), repOnScreen: rep ? inside(rep) : null, hasRep: !!rep, qFocused: !!q && document.activeElement === q, active: document.activeElement ? document.activeElement.tagName + '.' + String(document.activeElement.className).slice(0, 24) : null };
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
    const id = `sdr-${Date.now().toString(36)}`;
    await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: TEXT, createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })})`);
    await ev(`localStorage.setItem('wrizo-mode-page-${id}', 'drafting')`);
    await sleep(400);
    await ev(`location.hash = '#/page/${id}'`);
    await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('[data-top-search]')", { label: 'the page and the door', timeout: 20000 });
    await sleep(1500);
    // the first press, then the word and Enter
    await ev("document.querySelector('[data-top-search]').click()");
    await app.waitFor("!!document.querySelector('[data-search-q]')", { label: 'the search field', timeout: 8000 }).catch(() => {});
    await sleep(700);
    await ev("(() => { const q = document.querySelector('[data-search-q]'); if (q) { q.focus(); q.select(); } return true; })()");
    await app.typeKeys('toll');
    await app.key('Enter');
    await sleep(900);
    const s1 = await ev(READ());
    // click back into the page (a real press in the editor), type a letter
    const pt = await ev("(() => { const ed = document.querySelector('.forward-only-editor'); const r = ed.getBoundingClientRect(); return { x: Math.round(r.left + 60), y: Math.round(r.top + 14) }; })()");
    await app.mouseDown(pt.x, pt.y); await sleep(60); await app.mouseUp(pt.x, pt.y);
    await sleep(500);
    await app.typeKeys('z');
    await sleep(900);
    const s2 = await ev(READ());
    ok(`SD0 [${cfg.name}] PREMISE: the first press opened the drawer on the search and found the word; a click into the page shuts the drawer and the search stays open`, s1.open === 'true' && s1.q === 'toll' && s2.open !== 'true' && s2.q === 'toll', JSON.stringify({ afterFirst: { open: s1.open, q: s1.q }, afterClick: { open: s2.open, q: s2.q } }));
    // the door again
    await ev("document.querySelector('[data-top-search]').click()");
    await sleep(1200);
    const s3 = await ev(READ());
    ok(`SD1 [${cfg.name}] the door pressed again opens the Back drawer on her search: the drawer is open, the search field is on screen inside it and still reads what she searched`, s3.open === 'true' && s3.q === 'toll' && s3.qOnScreen === true, JSON.stringify(s3));
    ok(`SD2 [${cfg.name}] and it is the SAME search: Replace's toggle is reachable (on screen, inside the drawer) and the field holds the focus`, s3.hasRep && s3.repOnScreen === true && s3.qFocused === true, JSON.stringify({ hasRep: s3.hasRep, repOnScreen: s3.repOnScreen, qFocused: s3.qFocused, active: s3.active }));
    // closing the search
    await app.key('Escape');
    await sleep(900);
    const s4 = await ev(READ());
    await ev("document.querySelector('[data-top-search]').click()");
    await sleep(1000);
    const s5 = await ev(READ());
    ok(`SD3 [${cfg.name}] Escape closes the search (no field left), and the door pressed after that opens a fresh search on the Back menu`, s4.q === null && s5.open === 'true' && s5.q !== null, JSON.stringify({ afterEsc: { open: s4.open, q: s4.q }, door: { open: s5.open, q: s5.q } }));
  }
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); checks.push({ name: 'HARNESS', pass: false, detail: String(e && e.message || e) }); }

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nSEARCH-DOOR-REOPENS VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nSEARCH-DOOR-REOPENS VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
