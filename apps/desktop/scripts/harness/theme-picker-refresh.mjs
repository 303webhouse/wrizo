// #132 - THE PICKER SHOWS WHAT THE SERVER SAYS NOW (Fable, Nov 25: Nick's account read wordsWritten 7989 with Machina and Flux open, while his picker showed them grey). The picker read
// /api/theme-unlock once per mount: words that reached the server while it was open never showed, and one failed read greyed every card but the current one with no number.
// A SIGNED-IN session without a server: the page's own fetch is answered in the page (a new-document script). The fake server counts the words of the rows pushed to it, and its
// /api/theme-unlock answers from that count (Machina 100, Flux 1000), or fails when told to. No reload anywhere after the start: Arbor is the current theme, the page is made through the app's seams.
//   P0 premise: signed in, the first words synced
//   C1 the first read failed (nothing known: locked, no number); the read works again and a sync is accepted while the picker is open: the numbers appear
//   C2 the picker open while new words are still unsynced; the sync is accepted: Machina opens and Flux's number is the new one
//   C3 closed; she writes past 1000 and syncs; opened again with no reload: Machina and Flux open
//   C4 closed; the read now fails; opened again: the cards stand as they last were, none greyed
//   MUT the judge goes RED on a grey card
// Run: node scripts/harness/theme-picker-refresh.mjs (from apps/desktop, dist-web built; Actions or the box).
process.env.WS_ARBOR2 = 'default';
process.env.WS_MACHINA2 = 'default';
const { withHarness } = await import('../runtime-verify.mjs');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? '  ' + String(detail).slice(0, 600) : ''}`); };
const J = (v) => JSON.stringify(v);
const words = (n, tag) => Array.from({ length: n }, (_, i) => tag + i).join(' ');

const FAKE_SERVER = `(() => {
  const rows = new Map(); const orig = window.fetch.bind(window);
  window.__srv = { fail: false, asks: 0, syncs: 0, words: () => [...rows.values()].reduce((m, r) => m + String(r.text || '').split(/\\s+/).filter(Boolean).length, 0) };
  const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json' } });
  window.fetch = async (url, init) => {
    const u = String(url);
    if (u.includes('/auth/me')) return json({ id: 'u-tur', email: 'writer@example.invalid', name: 'Test' });
    if (u.includes('/api/sync')) {
      const body = JSON.parse((init && init.body) || '{}');
      for (const r of (body.push && body.push.journalEntries) || []) rows.set(r.id, JSON.parse(JSON.stringify(r)));
      window.__srv.syncs += 1;
      return json({ serverTime: new Date().toISOString(), pull: body.pull === false ? {} : { journalEntries: [] } });
    }
    if (u.includes('/api/theme-unlock')) {
      window.__srv.asks += 1;
      if (window.__srv.fail) throw new TypeError('harness: offline');
      const n = window.__srv.words();
      return json({ wordsWritten: n, themesOpened: {}, thresholds: { machina: 100, flux: 1000 }, open: { plateau: true, machina: n >= 100, flux: n >= 1000 } });
    }
    if (/\\/api\\/(prefs|rail|page-defaults|proofing)/.test(u)) return json({}, 404);
    return orig(url, init);
  };
})();`;

const CARDS = `Object.fromEntries([...document.querySelectorAll('.wz-theme-card')].map((c) => [c.querySelector('.wz-theme-wm')?.textContent, { locked: c.classList.contains('locked'), note: c.querySelector('.wz-theme-note')?.textContent ?? null }]))`;
const isOpen = (c) => !!c && c.locked === false;
const lockedAt = (c, n) => !!c && c.locked === true && String(c.note || '').startsWith(`${n} more words`);

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const soft = async (expr) => { try { await app.waitFor(expr, { label: expr.slice(0, 60), timeout: 6000 }); return true; } catch { return false; } };
  await app.cdp('Page.addScriptToEvaluateOnNewDocument', { source: FAKE_SERVER });
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); true");
  await app.reload();
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams', timeout: 20000 });
  await soft("!document.querySelector('.wz-splash')");
  await sleep(1500);   // the first pull
  const make = async (id, text) => { await ev(`window.wrizoCreateJournalPage(${J({ id, text, createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })}); window.wrizoFlushNow(); true`); await sleep(300); };
  const sync = async (want) => { await ev("window.dispatchEvent(new Event('online')); true"); const got = await soft(`window.__srv.words() >= ${want}`); await sleep(500); return got; };
  const openPicker = async () => { await ev("document.querySelector('[data-category=\"theme\"]')?.click(); true"); const up = await soft("!!document.querySelector('.wz-theme-cards')"); await sleep(500); return up; };
  const closePicker = async () => { await ev("document.querySelector('[data-category=\"theme\"]')?.click(); true"); const gone = await soft("!document.querySelector('.wz-theme-cards')"); await sleep(200); return gone; };
  const cards = () => ev(CARDS);

  await make('tur-1', 'start');
  await ev("location.hash = '#/page/tur-1'; true");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'the page', timeout: 20000 });
  await make('tur-2', words(49, 'a'));
  const synced = await sync(50);
  ok('P0 (premise): signed in, 50 words synced', synced, J(await ev('({ words: window.__srv.words(), syncs: window.__srv.syncs })')));

  await ev('window.__srv.fail = true; true');
  const up1 = await openPicker();
  const c1a = await cards();
  await ev('window.__srv.fail = false; true');
  await sync(50);
  await soft("!!document.querySelector('.wz-theme-note')");
  const c1b = await cards();
  ok('C1: the first read failed (locked, no number); after an accepted sync with the picker still open, the numbers appear',
    up1 && c1a.Machina?.locked && c1a.Machina.note === null && lockedAt(c1b.Machina, '50') && lockedAt(c1b.Flux, '950'), J({ before: c1a, after: c1b }));

  await closePicker();
  await openPicker();
  const c2a = await cards();
  await make('tur-3', words(60, 'b'));   // written while the picker is open: no key reaches the page, so it stays open
  const stood = await ev("!!document.querySelector('.wz-theme-cards')");
  await sync(110);
  await soft("document.querySelector('.wz-theme-card-machina') && !document.querySelector('.wz-theme-card-machina').classList.contains('locked')");
  const c2b = await cards();
  ok('C2: the picker open while 60 new words were unsynced; the sync is accepted: Machina opens and Flux reads 890 more',
    stood && lockedAt(c2a.Machina, '50') && isOpen(c2b.Machina) && lockedAt(c2b.Flux, '890'), J({ before: c2a, after: c2b }));

  const shut = await closePicker();
  await make('tur-4', words(1100, 'c'));
  await sync(1210);
  await openPicker();
  const c3 = await cards();
  ok('C3: closed, past 1000 words and synced, opened again with no reload: Machina and Flux open', shut && isOpen(c3.Machina) && isOpen(c3.Flux), J(c3));

  const shut2 = await closePicker();
  await ev('window.__srv.fail = true; true');
  const asks = await ev('window.__srv.asks');
  await openPicker();
  const c4 = await cards();
  const asked = (await ev('window.__srv.asks')) - asks;
  ok(`C4: the read now fails (asked ${asked}x); opened again, the cards stand as they last were`, shut2 && asked >= 1 && isOpen(c4.Machina) && isOpen(c4.Flux), J(c4));

  ok('MUT: the judges go RED on a grey card with no number', !isOpen({ locked: true, note: null }) && !lockedAt({ locked: true, note: null }, '50') && !lockedAt({ locked: false, note: null }, '50') && isOpen({ locked: false, note: null }));
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); ok('HARNESS ' + String(e && e.message || e).slice(0, 300), false); }

const bad = checks.filter((c) => !c.pass).length;
if (process.env.HARNESS_PARKED === '1') console.log('\nTHEME-PICKER-REFRESH PARKED: PASS (0 records) - a new file; it parks nothing of its own');
console.log(bad ? `\nTHEME-PICKER-REFRESH VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nTHEME-PICKER-REFRESH VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
