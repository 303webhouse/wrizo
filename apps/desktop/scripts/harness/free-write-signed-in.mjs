// #123 - FREE WRITE ON A REAL PAGE, SIGNED IN (Chat 1's suspect, Nov 24: free-write-real-page.mjs is not signed in and Nick is: a server copy applied back into the open page would make typing "do nothing" and the text flash).
// A SIGNED-IN session without a server: the page's own fetch is answered in the page (a new-document script, in every arm alike):
//   /auth/me  -> a signed-in user;   /api/sync -> a fake server that keeps every row pushed to it and answers every sync with its copy of them (FWS_ECHO=stamped: only rows stamped after the caller's lastSyncAt, as the real one);
//   /api/prefs, /api/rail, /api/page-defaults, /api/proofing, /api/theme-unlock -> 404 (the app treats them as absent).
// Per arm (theme x seed x width, 1366 x 768 and 2560 x 1440; FWS_VIEWS=1366 narrows it): the same page as free-write-real-page.mjs (saved text, three ink strokes), 20 keys 90 ms apart and, at the 10th key, a sync round (the 'online' event: the page is pushed and its echo comes back
// while she is mid-word, as the 20 s timer does); then a second round of 20 keys with a sync at every 5th key.
//   SI0  premises: signed in (the app asked /auth/me and synced at least once), the theme as asked, the page has ink, Wire In up in Flux only
//   SI1  every key lands (the editor's words are the saved words + all 40 keys, once)
//   SI2  the editor she is typing in is the SAME element at the end as at the start (no remount: a replaced editor is the text "flashing" and the typing lost)
//   SI3  her words never went backwards while she typed
//   SI4  the stored page holds all 40 keys
//   SI5  the host is quiet once she stops (Flux's own caret indicator attribute is not counted)
//   MUT  SI2's judge goes RED on a replaced editor
// Run: node scripts/harness/free-write-signed-in.mjs (from apps/desktop; Actions or the box). FWS_THEMES=plateau,machina,flux narrows it.
process.env.WS_ARBOR2 = 'default';
process.env.WS_MACHINA2 = 'default';
const { withHarness } = await import('../runtime-verify.mjs');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? '  ' + String(detail).slice(0, 700) : ''}`); };
const THEMES = (process.env.FWS_THEMES || 'plateau,machina,flux').split(',');
const PARA = (i) => `Paragraph ${i} of the draft: “she kept going” — the river ran under the window of the room where she had left her coat, and word${i} stayed.`;
const SEEDS = {
  line: Array.from({ length: 150 }, (_, i) => 'word' + i).join(' '),
  page: ['A Title For The Page', ...Array.from({ length: 40 }, (_, i) => PARA(i))].join(String.fromCharCode(10, 10)) + String.fromCharCode(10),
};
const SEED_NAMES = (process.env.FWS_SEEDS || 'line,page').split(',');
const WIDTHS = (process.env.FWS_VIEWS || '1366,2560').split(',').map(Number);
const SIZES = { 1366: [1366, 768], 2560: [2560, 1440] };
const KEYS1 = 'abc def ghi jkl mnop', KEYS2 = 'qrs tuv wxy zab cdef';
const INK = [
  { points: [{ x: 0.12, y: 0.10 }, { x: 0.30, y: 0.14 }, { x: 0.48, y: 0.11 }, { x: 0.60, y: 0.17 }] },
  { points: [{ x: 0.15, y: 0.30 }, { x: 0.28, y: 0.36 }, { x: 0.41, y: 0.31 }] },
  { points: [{ x: 0.55, y: 0.50 }, { x: 0.70, y: 0.46 }, { x: 0.82, y: 0.55 }] },
];
const nw = (s) => String(s || '').replace(/[\s​ ]/g, '');
const landed = (shown, seed, typed) => nw(shown) === nw(seed) + nw(typed);
const sameEditor = (before, after) => before === true && after === true;   // SI2's judge: the element read at the end is still the one marked at the start

const ECHO_ALL = process.env.FWS_ECHO !== 'stamped';   // default: the server hands back every row it holds at every sync (a re-delivery: the worst case of its own copy coming back); FWS_ECHO=stamped: only rows stamped after lastSyncAt
const FAKE_SERVER = `(() => {
  const ECHO_ALL = ${ECHO_ALL};
  const rows = new Map(), stamps = new Map(); const orig = window.fetch.bind(window);
  window.__srv = { me: 0, syncs: 0, echoed: 0 };
  const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json' } });
  window.fetch = async (url, init) => {
    const u = String(url);
    if (u.includes('/auth/me')) { window.__srv.me += 1; return json({ id: 'u-fws', email: 'writer@example.invalid', name: 'Test' }); }
    if (u.includes('/api/sync')) {
      const body = JSON.parse((init && init.body) || '{}'); const now = new Date().toISOString(); const since = body.lastSyncAt || '';
      const pushed = (body.push && body.push.journalEntries) || [];
      for (const r of pushed) { rows.set(r.id, JSON.parse(JSON.stringify(r))); stamps.set(r.id, now); }
      window.__srv.syncs += 1;
      const pull = body.pull === false ? {} : { journalEntries: [...rows.values()].filter((r) => ECHO_ALL || (stamps.get(r.id) || '') > since) };
      window.__srv.echoed += (pull.journalEntries || []).length;
      return json({ serverTime: now, pull });
    }
    if (/\\/api\\/(prefs|rail|page-defaults|proofing|theme-unlock)/.test(u)) return json({}, 404);
    return orig(url, init);
  };
})();`;

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  await app.cdp('Page.addScriptToEvaluateOnNewDocument', { source: FAKE_SERVER });
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 20000, label: 'splash gone' }).catch(() => {});
  const hashTo = async (h) => { await ev(`location.hash = ${JSON.stringify(h)}; true`); await sleep(300); };
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); true");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival') || !!document.querySelector('.forward-only-editor')", { label: 'the app up', timeout: 20000 });
  await splashGone();
  await sleep(1500);   // the first pull
  const ID = `fws-${Date.now()}`;
  let first = true;
  for (const sn of SEED_NAMES) {
    const SEED = SEEDS[sn];
    for (const theme of THEMES) for (const w of WIDTHS) {
      const tag = `${theme} ${w} ${sn}`;
      await app.emulateDpr(1, ...SIZES[w]);
      await hashTo('#/');
      await sleep(400);
      if (first) { await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id: ID, text: SEED, strokes: INK, createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })}); window.wrizoFlushNow(); true`); first = false; }
      else await ev(`window.wrizoPatchEntry(${JSON.stringify(ID)}, { text: ${JSON.stringify(SEED)}, strokes: ${JSON.stringify(INK)} }); window.wrizoFlushNow(); true`);
      await ev(`localStorage.setItem('wrizo-theme', ${JSON.stringify(theme)}); localStorage.setItem('wrizo-theme-prefs', JSON.stringify({ voice: 'serif', page: 'dark', fade: 'on' })); localStorage.removeItem('wrizo-mode-page-${ID}'); history.replaceState(null, '', '/#/page/${ID}'); true`);
      await app.reload();
      await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 25000, label: `the page (${tag})` }).catch(() => {});
      await splashGone();
      await sleep(theme === 'flux' ? 4600 : 2200);
      const where = await ev(`(() => { const r = document.documentElement; const ed = document.querySelector('.forward-only-editor'); return { theme: r.getAttribute('data-theme'), jacked: r.hasAttribute('data-flux3-jacked'), editor: !!ed, chars: ed ? ed.textContent.replace(/\\u200b/g, '').length : -1, me: window.__srv && window.__srv.me, syncs: window.__srv && window.__srv.syncs, echoed: window.__srv && window.__srv.echoed }; })()`);
      ok(`SI0 ${tag}: signed in (asked /auth/me ${where.me}x, ${where.syncs} syncs), the theme and page stood as asked (theme ${where.theme}, Wire In ${where.jacked}, ${where.chars} chars)`,
        where.editor && where.me >= 1 && where.syncs >= 1 && where.theme === theme && where.jacked === (theme === 'flux') && where.chars >= nw(SEED).length - 2, JSON.stringify(where));
      await ev(`(() => { const ed = document.querySelector('.forward-only-editor'); ed.setAttribute('data-fws-mark', '1'); ed.focus(); const s = getSelection(); s.selectAllChildren(ed); s.collapseToEnd();
        window.__fwr = { regress: 0, last: 0, muts: 0, quiet: false, on: true, what: [] };
        const count = () => { const e = document.querySelector('.forward-only-editor'); return e ? e.textContent.replace(/\\u200b/g, '').length : 0; };
        const tick = () => { if (!window.__fwr.on) return; const n = count(); if (n < window.__fwr.last) window.__fwr.regress += 1; window.__fwr.last = n; requestAnimationFrame(tick); };
        window.__fwr.last = count(); requestAnimationFrame(tick);
        new MutationObserver((m0) => { const m = m0.filter((r) => !(r.type === 'attributes' && (r.attributeName === 'data-flux-caret-active' || r.attributeName === 'data-fws-mark'))); if (window.__fwr.quiet) { window.__fwr.muts += m.length; for (const r of m.slice(0, 3)) if (window.__fwr.what.length < 6) window.__fwr.what.push({ t: r.type, a: r.attributeName, n: r.target.nodeType === 3 ? '#text' : r.target.tagName.toLowerCase() + '.' + String(r.target.className || '').split(' ')[0] }); } }).observe(document.querySelector('.forward-only-editor'), { subtree: true, childList: true, characterData: true, attributes: true });
        return true; })()`);
      const sync = () => ev("window.dispatchEvent(new Event('online')); true");
      let i = 0;
      for (const ch of KEYS1) { await app.typeKeys(ch); await sleep(90); i += 1; if (i === 10) await sync(); }
      await sleep(900);
      i = 0;
      for (const ch of KEYS2) { await app.typeKeys(ch); await sleep(90); i += 1; if (i % 5 === 0) await sync(); }
      await sleep(900);
      const shown = await ev("document.querySelector('.forward-only-editor') ? document.querySelector('.forward-only-editor').textContent.replace(/\\u200b/g, '') : ''");
      const marked = await ev("(() => { const ed = document.querySelector('.forward-only-editor'); return !!ed && ed.getAttribute('data-fws-mark') === '1'; })()");
      ok(`SI1 ${tag}: all 40 keys landed, once, through the sync rounds`, landed(shown, SEED, KEYS1 + KEYS2), JSON.stringify({ tail: shown.slice(-50), len: nw(shown).length, want: (nw(SEED) + nw(KEYS1 + KEYS2)).length }));
      ok(`SI2 ${tag}: the editor she typed in is the same element at the end (no remount)`, sameEditor(true, marked), JSON.stringify({ marked }));
      await ev('window.__fwr.quiet = true; true');
      await sleep(2500);
      const meter = await ev('({ regress: window.__fwr.regress, muts: window.__fwr.muts, what: window.__fwr.what, syncs: window.__srv.syncs, echoed: window.__srv.echoed })');
      ok(`SI3 ${tag}: her words never went backwards (${meter.regress} frames showed fewer; ${meter.syncs} syncs, ${meter.echoed} rows echoed)`, meter.regress === 0, JSON.stringify(meter));
      ok(`SI5 ${tag}: the host is quiet once she stops (${meter.muts} changes in 2.5 s)`, meter.muts === 0, JSON.stringify(meter));
      await ev('window.__fwr.on = false; window.wrizoFlushNow(); true');
      await sleep(500);
      const stored = await ev(`(() => { const rows = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || 'null'); const r = rows && rows.find((x) => x.id === ${JSON.stringify(ID)}); return r ? r.text : null; })()`).catch(() => null);
      ok(`SI4 ${tag}: the stored page holds all 40 keys`, stored !== null && landed(stored, SEED, KEYS1 + KEYS2), JSON.stringify({ tail: stored ? String(stored).slice(-50) : stored }));
    }
  }
  ok('MUT-SI2 the SI2 judge goes RED on a replaced editor', sameEditor(true, false) === false && sameEditor(true, true) === true);
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); ok('HARNESS ' + String(e && e.message || e).slice(0, 300), false); }

const bad = checks.filter((c) => !c.pass).length;
console.log(bad ? `\nFREE-WRITE-SIGNED-IN VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nFREE-WRITE-SIGNED-IN VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
