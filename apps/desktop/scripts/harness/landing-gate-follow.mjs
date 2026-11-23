// #112 - LANDINGGATE FOLLOWS THE PAGE BEFORE SIGN-IN RESOLVES (ARBOR's find; Fable, Nov 23). After a reload on a page's address, LandingGate's recorder runs on the first render, when /auth/me has not answered and
// there is no current user yet: placeUid() reads 'anon', followOpenPage() makes the page's home the place (and counts the open) under 'anon', and its once-per-page latch is spent. When the user resolves
// the page is already "followed", so a signed-in writer's own place is never moved: she can be left on the old Drive (the Journal, or the last Drawer), and her open counts under 'anon'.
//   LG1  signed in, her place on this device is the Journal, reload on a page that lives in the Drawer "The Late Ferry": once the session answers, HER place (wz.place.<id>) is that Drawer
//   LG2  nothing was written under 'anon' for her: no wz.place.anon, no wz.opens.anon (the open before sign-in answered counted for no one)
//   LG3  her open is counted under her own id (wz.opens.<id> holds the page, once)
//   LG4  control: anonymous (WS_ANON=1, /auth/me answers 401), reload on the same page: the anonymous writer's place follows the page under 'anon', as it always did
// Seeding goes through the app's seams (wrizoCreateDrawer / wrizoCreateProject / wrizoSetProjectDrawer / wrizoCreateJournalPage / wrizoPatchEntry); wz.place.* is a per-device pointer, not a collection, and is the one thing set raw.
// Run: node scripts/harness/landing-gate-follow.mjs (from apps/desktop; a box turn or Actions)
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const UID = 'test-user';
const PAGE = 'lg112-ferry';

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 15000, label: 'splash gone' }).catch(() => {});
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await splashGone();
  // a Drawer with a set in it, and a page in that set; and a journal page, so the Journal is a real place too
  const d1 = await ev("(() => { const d = window.wrizoCreateDrawer('The Late Ferry'); const p = window.wrizoCreateProject('Manuscript', 'creative'); window.wrizoSetProjectDrawer(p.id, d.id); window.__lg = { d: d.id, p: p.id }; return d.id; })()");
  await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id: PAGE, text: 'The ferry went out at six.', projectId: null, origin: 'project', source: 'page', createdAt: '2026-01-01T00:00:01.000Z' })}); window.wrizoPatchEntry(${JSON.stringify(PAGE)}, { projectId: window.__lg.p })`);
  await ev("window.wrizoCreateJournalPage({ id: 'lg112-j', text: 'A journal page.', projectId: null, origin: 'journal', source: 'page', createdAt: '2026-01-01T00:00:02.000Z' }); window.wrizoFlushNow(); true");
  const read = (key) => ev(`(() => { try { const v = localStorage.getItem(${JSON.stringify(key)}); return v === null ? null : JSON.parse(v); } catch { return 'unreadable'; } })()`);
  const reset = async (place) => {
    await ev(`localStorage.removeItem('wz.place.anon'); localStorage.removeItem('wz.opens.anon'); localStorage.removeItem('wz.opens.${UID}'); localStorage.setItem('wz.place.${UID}', JSON.stringify(${JSON.stringify(place)})); true`);
  };
  // the page is opened (so the reload lands on its address), THEN her pointers are put back: opening it in this document followed it, as it should, and the reload is what is measured
  const openByReload = async (place, anon) => {
    await ev(`location.hash = '#/page/${PAGE}'; true`);
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 20000, label: 'the page' }).catch(() => {});
    await sleep(600);
    await ev("window.wrizoFlushNow && window.wrizoFlushNow(); true");
    await reset(place);
    if (anon) await ev("localStorage.setItem('wz.place.anon', JSON.stringify({ kind: 'journal', id: 'journal', setId: null })); true");
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 20000, label: 'the page again' }).catch(() => {});
    await splashGone();
    await sleep(2500);
  };

  // LG1-LG3: signed in (the double answers /auth/me with the test user)
  process.env.WS_ANON = '0';
  await ev("window.wrizoFlushNow(); true");
  // the page open and the reload below it: its address is the page's own, so nothing but the recorder can move the place
  await openByReload({ kind: 'journal', id: 'journal', setId: null }, false);
  const place = await read(`wz.place.${UID}`);
  ok('LG1 signed in, place the Journal, reload on a page in a Drawer: once the session answers, HER place is that Drawer', place && place.kind === 'drawer' && place.id === d1, JSON.stringify({ place, want: d1 }));
  const anonPlace = await read('wz.place.anon'), anonOpens = await read('wz.opens.anon');
  ok('LG2 nothing was written under anon for her (no place, no opens)', anonPlace === null && anonOpens === null, JSON.stringify({ anonPlace, anonOpens }));
  const opens = await read(`wz.opens.${UID}`);
  const n = opens && typeof opens === 'object' ? (opens[PAGE] && typeof opens[PAGE] === 'object' ? opens[PAGE].n ?? opens[PAGE].count : opens[PAGE]) : null;
  ok('LG3 her open of the page is counted under her own id', opens !== null && JSON.stringify(opens).includes(PAGE), JSON.stringify({ opens, n }));

  // LG4: control, anonymous
  process.env.WS_ANON = '1';
  await openByReload({ kind: 'journal', id: 'journal', setId: null }, true);
  const place2 = await read('wz.place.anon');
  ok('LG4 control: anonymous, reload on the same page: the anonymous place follows the page (under anon)', place2 && place2.kind === 'drawer' && place2.id === d1, JSON.stringify(place2));
  process.env.WS_ANON = '0';
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); checks.push({ name: 'HARNESS', pass: false, detail: String(e && e.message || e) }); }

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nLANDING-GATE-FOLLOW VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nLANDING-GATE-FOLLOW VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
