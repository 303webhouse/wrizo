// #123 - THE STALE TAB (Chat 1's question, Nov 24: could Nick's "typing does nothing" be a tab opened on an older build, after L6 and L7 deployed a minute apart?). What the stale-client guard does to a page she is writing in, measured (store/staleClient.ts, clientBuild.ts, sync.ts checkBuild, StaleClientBanner.tsx).
// A signed-in session without a server (the fake server of free-write-signed-in.mjs, in the page): the tab types fine; then the server "moves on" (its /api/sync answers a different build); the next sync marks the tab stale.
//   ST0  premises: the tab knows its own build (the guard applies on this origin) and, before the server moves on, 10 keys land and no banner shows
//   ST1  after the server's build changes and a sync runs: the banner "stale-client" is shown (its words are read and printed), the app root is inert
//   ST2  and typing then does NOTHING: 10 keys typed at the page change no word of it (this IS "typing does nothing")
//   ST3  the page's own text is not lost: what she typed before the banner is in the editor and in the stored page
//   ST4  Reload is the way out: the Reload button reloads the page; it comes back on its own, with no banner, and the words typed before the banner are there; typing works again
//   MUT  ST2's judge goes RED on a page that took the keys
// Run: node scripts/harness/free-write-stale-tab.mjs (from apps/desktop; Actions or the box). FWT_THEMES=plateau,machina,flux narrows it.
process.env.WS_ARBOR2 = 'default';
process.env.WS_MACHINA2 = 'default';
const { withHarness } = await import('../runtime-verify.mjs');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? '  ' + String(detail).slice(0, 700) : ''}`); };
const THEMES = (process.env.FWT_THEMES || 'plateau,flux').split(',');
const SEED = Array.from({ length: 150 }, (_, i) => 'word' + i).join(' ');
const KEYS1 = 'abc def ghi', KEYS2 = 'zzz yyy xxx';
const nw = (s) => String(s || '').replace(/[\s​ ]/g, '');
const tookKeys = (before, after) => nw(after) !== nw(before);   // ST2's judge: the page changed its words

const FAKE_SERVER = `(() => {
  const rows = new Map(); const orig = window.fetch.bind(window);
  window.__srv = { me: 0, syncs: 0, build: undefined };
  const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json' } });
  window.fetch = async (url, init) => {
    const u = String(url);
    if (u.includes('/auth/me')) { window.__srv.me += 1; return json({ id: 'u-fwt', email: 'writer@example.invalid', name: 'Test' }); }
    if (u.includes('/api/sync')) {
      const body = JSON.parse((init && init.body) || '{}'); const now = new Date().toISOString();
      for (const r of ((body.push && body.push.journalEntries) || [])) rows.set(r.id, JSON.parse(JSON.stringify(r)));
      window.__srv.syncs += 1;
      const out = { serverTime: now, pull: body.pull === false ? {} : { journalEntries: [...rows.values()] } };
      if (window.__srv.build !== undefined) out.build = window.__srv.build;   // before the server moves on, no build: the guard has nothing to compare
      return json(out);
    }
    if (/\\/api\\/(prefs|rail|page-defaults|proofing|theme-unlock)/.test(u)) return json({}, 404);
    return orig(url, init);
  };
})();`;

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  await app.cdp('Page.addScriptToEvaluateOnNewDocument', { source: FAKE_SERVER });
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 20000, label: 'splash gone' }).catch(() => {});
  const text = () => ev("document.querySelector('.forward-only-editor') ? document.querySelector('.forward-only-editor').textContent.replace(/\\u200b/g, '') : ''");
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); true");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival') || !!document.querySelector('.forward-only-editor')", { label: 'the app up', timeout: 20000 });
  await splashGone();
  await sleep(1500);
  const ID = `fwt-${Date.now()}`;
  await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id: ID, text: SEED, createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })}); window.wrizoFlushNow(); true`);
  for (const theme of THEMES) {
    const tag = theme;
    await ev("location.hash = '#/'; true"); await sleep(400);
    await ev(`window.wrizoPatchEntry(${JSON.stringify(ID)}, { text: ${JSON.stringify(SEED)} }); window.wrizoFlushNow(); localStorage.setItem('wrizo-theme', ${JSON.stringify(theme)}); localStorage.setItem('wrizo-theme-prefs', JSON.stringify({ voice: 'serif', page: 'dark', fade: 'on' })); localStorage.removeItem('wrizo-mode-page-${ID}'); history.replaceState(null, '', '/#/page/${ID}'); true`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 25000, label: `the page (${tag})` }).catch(() => {});
    await splashGone();
    await sleep(theme === 'flux' ? 4600 : 2200);
    await ev("(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const s = getSelection(); s.selectAllChildren(ed); s.collapseToEnd(); return true; })()");
    const build = await ev("(() => { const s = [...document.scripts].map((x) => x.getAttribute('src') || '').find((x) => /\\/assets\\/index-/.test(x)); return s || null; })()");
    for (const ch of KEYS1) { await app.typeKeys(ch); await sleep(90); }
    await sleep(500);
    const t1 = await text();
    const bannerBefore = await ev("!!document.querySelector('[data-stale-client]')");
    ok(`ST0 ${tag}: before the server moves on, the 11 keys land and no banner shows (entry script ${build})`, nw(t1) === nw(SEED) + nw(KEYS1) && bannerBefore === false && !!build, JSON.stringify({ tail: t1.slice(-24), bannerBefore, build }));
    // the server moves on: a different build, and a sync round
    await ev("window.__srv.build = 'index-A1B2C3D4'; window.dispatchEvent(new Event('online')); true");
    await sleep(1500);
    const st = await ev(`(() => { const b = document.querySelector('[data-stale-client]'); const root = document.getElementById('root'); const r = b ? b.getBoundingClientRect() : null; return { banner: !!b, words: b ? b.textContent.trim() : null, rect: r ? [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] : null, inert: !!root && root.hasAttribute('inert'), active: document.activeElement ? document.activeElement.tagName.toLowerCase() + '.' + String(document.activeElement.className || '').split(' ')[0] : null }; })()`);
    ok(`ST1 ${tag}: the next sync marks the tab stale: banner "${st.words}" shown, the app root inert`, st.banner && st.inert, JSON.stringify(st));
    const before = await text();
    for (const ch of KEYS2) { await app.typeKeys(ch); await sleep(90); }
    await sleep(600);
    const after = await text();
    ok(`ST2 ${tag}: typing does nothing on a stale tab: 11 keys changed no word of the page`, !tookKeys(before, after), JSON.stringify({ before: before.slice(-24), after: after.slice(-24) }));
    await ev('window.wrizoFlushNow && window.wrizoFlushNow(); true');
    const stored = await ev(`(() => { const rows = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || 'null'); const r = rows && rows.find((x) => x.id === ${JSON.stringify(ID)}); return r ? r.text : null; })()`);
    ok(`ST3 ${tag}: what she typed before the banner is still in the page and in the stored page`, nw(after) === nw(SEED) + nw(KEYS1) && stored !== null && nw(stored) === nw(SEED) + nw(KEYS1), JSON.stringify({ storedTail: stored ? String(stored).slice(-24) : stored }));
    // Reload: the way out (the fake server forgets it moved on: the new load carries no build)
    await ev("window.__srv = undefined; true");   // the page reloads: the new document installs a fresh fake server with no build
    await ev("document.querySelector('.wz-stale-banner-reload').click(); true");
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 25000, label: 'the page after Reload' }).catch(() => {});
    await splashGone();
    await sleep(theme === 'flux' ? 4600 : 2200);
    await ev("(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const s = getSelection(); s.selectAllChildren(ed); s.collapseToEnd(); return true; })()");
    for (const ch of KEYS2) { await app.typeKeys(ch); await sleep(90); }
    await sleep(500);
    const back = await text();
    const bannerAfter = await ev("!!document.querySelector('[data-stale-client]')");
    ok(`ST4 ${tag}: Reload brings the page back on its own: no banner, her earlier words there, typing works`, nw(back) === nw(SEED) + nw(KEYS1) + nw(KEYS2) && bannerAfter === false, JSON.stringify({ tail: back.slice(-30), bannerAfter }));
  }
  ok('MUT-ST2 the ST2 judge goes RED on a page that took the keys', tookKeys('abc', 'abcxyz') === true && tookKeys('abc', 'abc') === false);
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); ok('HARNESS ' + String(e && e.message || e).slice(0, 300), false); }

const bad = checks.filter((c) => !c.pass).length;
console.log(bad ? `\nFREE-WRITE-STALE-TAB VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nFREE-WRITE-STALE-TAB VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
