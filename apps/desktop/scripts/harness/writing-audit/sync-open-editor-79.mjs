// #79 - THE REAL CASE, BY A RUN (Fable Nov 12, 10:30 pm) and THE TYPING PATH. Two devices through the real app against a STATEFUL sync double (the audit's own, in this file: the audit's built-in double answers every pull empty).
// Device R is the origin 127.0.0.1, device S is the origin localhost: two origins are two storages, so two devices, each running the real app. The double follows the server's rule (a pushed page replaces the stored row only when its updated_at is
// strictly newer; a pull answers the rows changed since the cursor) and is put in the way of /api/sync with the DevTools Fetch domain. It can HOLD the requests, so the pull arrives exactly when this script lets it.
//   D  R saves a words of its own (the page is dirty, unsynced), S then pushes a different line, R comes back, OPENS the page, types more words that are NOT yet saved, and only then does the sync's answer arrive:
//      every line is on R's screen, R's record, the server and (after S syncs) S, once each; and R keeps typing afterwards
//   C  control: the same with nothing saved on R before (the record is clean; the open editor holds unsaved words): #76's reconcile alone does this on main
//   M  THE TYPING PATH: every write the sync base makes to storage is timed, and the event it ran in is read (window.event): a write inside a keydown/keypress/input is in the key's own task. At the bounds: 100 pages, then one page of 1.4 M characters
// Run: on Actions via writing-audit.yml, script=sync-open-editor-79.mjs (strict; the box is not used)
import { withHarness } from '../../runtime-verify.mjs';
import { makeDriver, sleep, THEMES } from './lib/driver.mjs';

const env = process.env;
const cfg = { theme: env.WA_THEME || 'plateau', flag: env.WA_FLAG || 'off', tone: env.WA_TONE || 'light', width: Number(env.WA_W || 1366), height: Number(env.WA_H || 768), out: null };
if (!THEMES[cfg.theme]) { console.error('WA_THEME must be plateau, flux or machina'); process.exit(2); }
const TAG = `${THEMES[cfg.theme].label}/${cfg.flag}/${cfg.tone}/${cfg.width}`;
const NL = String.fromCharCode(10);
let bad = 0;
const clone = (x) => JSON.parse(JSON.stringify(x));
const count = (t, s) => (typeof t === 'string' ? t.split(s).length - 1 : 0);

await withHarness(async (app) => {
  const d = makeDriver(app, cfg);
  const ev = d.ev;
  console.log(`SYNC-OPEN-79 [${TAG}] (${new Date().toISOString()})`);
  const R = app.base;
  const S = app.base.replace('127.0.0.1', 'localhost');
  if (R === S) throw new Error('harness: the base is not 127.0.0.1, so there is no second origin: ' + R);

  // ---- the stateful server double ------------------------------------------------------------------------------------------
  const server = { rows: new Map(), lastTs: 0, hold: false, offline: false, held: [], log: [] };
  const nowIso = () => { let t = Date.now(); if (t <= server.lastTs) t = server.lastTs + 1; server.lastTs = t; return new Date(t).toISOString(); };
  const answer = (body) => {
    const req = JSON.parse(body || '{}');
    const now = nowIso();
    const pushed = (req.push && req.push.journalEntries) || [];
    for (const rec of pushed) { const cur = server.rows.get(rec.id); if (!cur || rec.updatedAt > cur.rec.updatedAt) server.rows.set(rec.id, { rec: clone(rec), syncedAt: now }); }
    const rows = req.pull === false ? [] : [...server.rows.values()].filter((r) => req.lastSyncAt === null || req.lastSyncAt === undefined || r.syncedAt > req.lastSyncAt).map((r) => clone(r.rec));
    server.log.push(`${now.slice(17, 23)} push=${pushed.map((r) => r.id + ':' + r.text.length).join(',') || '-'} pull=${req.pull === false ? 'no' : rows.map((r) => r.id + ':' + r.text.length).join(',') || '-'}`);
    return { serverTime: now, pull: { journalEntries: rows } };
  };
  const b64 = (s) => Buffer.from(s).toString('base64');
  const respond = async (p, body) => {
    const headers = [{ name: 'content-type', value: 'application/json' }];
    if (server.offline) return app.cdp('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: 503, responseHeaders: headers, body: b64('{"error":"harness: offline"}') }).catch(() => {});
    return app.cdp('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: 200, responseHeaders: headers, body: b64(JSON.stringify(answer(body))) }).catch(() => {});
  };
  app.tap((method, p) => {
    if (method !== 'Fetch.requestPaused') return;
    (async () => {
      if (!/\/api\/sync(\?|$)/.test(p.request.url) || p.request.method !== 'POST') return app.cdp('Fetch.continueRequest', { requestId: p.requestId }).catch(() => {});
      let body = p.request.postData;
      if (body === undefined && p.request.hasPostData) body = (await app.cdp('Fetch.getRequestPostData', { requestId: p.requestId })).postData;
      if (server.hold) { server.held.push({ p, body }); return undefined; }
      return respond(p, body);
    })();
  });
  const release = async () => { server.hold = false; for (const h of server.held.splice(0)) await respond(h.p, h.body); };

  // ---- the devices -----------------------------------------------------------------------------------------------------------
  const INIT = (theme, tone) => `localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50');
    localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme', ${JSON.stringify(theme)});
    { const p = JSON.parse(localStorage.getItem('wrizo-theme-prefs') || '{}'); p.page = ${JSON.stringify(tone)}; localStorage.setItem('wrizo-theme-prefs', JSON.stringify(p)); }`;
  const booted = new Set();
  const goDevice = async (origin) => {
    await app.cdp('Page.navigate', { url: origin + '/' });
    await sleep(700);
    if (!booted.has(origin)) {
      booted.add(origin);
      await ev(INIT(cfg.theme, cfg.tone));
      await app.reload();
    }
    await app.waitFor("!!document.querySelector('.wz-arrival')", { timeout: 25000, label: 'the Desk on ' + origin });
    await app.waitFor("!document.querySelector('.wz-splash')", { timeout: 20000, label: 'splash gone' }).catch(() => {});
    await ev(`window.__wa ? true : false`);
  };
  const dirtyCount = () => ev("window.wrizoDirty ? Object.values(window.wrizoDirty.ids()).reduce((n, ids) => n + ids.length, 0) : -1");
  const record = (id) => ev(`(() => { try { const rows = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]'); const r = rows.find((x) => x.id === ${JSON.stringify(id)}); return r ? r.text : null; } catch (e) { return 'ERR ' + e; } })()`);
  const waitText = async (get, pred, ms, step = 250) => { const t0 = Date.now(); let v = await get(); while (!pred(v) && Date.now() - t0 < ms) { await sleep(step); v = await get(); } return v; };
  const syncNow = async () => { await ev("window.dispatchEvent(new Event('online')); true"); };
  const settle = async (ms = 12000) => { await syncNow(); await sleep(400); const t0 = Date.now(); while (Date.now() - t0 < ms) { if ((await dirtyCount()) === 0) return true; await sleep(250); } return false; };
  const seedPage = async (id, text) => {
    await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text, createdAt: new Date().toISOString(), origin: 'journal', source: 'page' })}); localStorage.setItem('wrizo-mode-page-${id}', 'drafting'); localStorage.setItem('wrizo-typewriter-page-${id}', 'off'); true`);
  };
  const openEditor = async (id, wantText) => {
    await ev(`localStorage.setItem('wrizo-mode-page-${id}', 'drafting'); localStorage.setItem('wrizo-typewriter-page-${id}', 'off'); location.hash = '#/page/${id}'; true`);
    await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.mode-page')", { timeout: 20000, label: 'the editor' });
    await sleep(500);
    await d.surface('.forward-only-editor', false);
    await app.waitFor(`window.__wa && window.__wa.read().text === ${JSON.stringify(wantText)}`, { timeout: 10000, label: 'the editor holds ' + JSON.stringify(wantText).slice(0, 60) });
    await sleep(300);
  };
  const typeAtEnd = async (s) => { const n = (await ev('window.__wa.read().text.length')); await d.place(n); await sleep(150); await d.type(s); };
  const editorText = () => ev('window.__wa.read().text');
  const lines = (t) => (typeof t === 'string' ? JSON.stringify(t) : String(t));
  const check = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg} [${TAG}]`); if (!ok) bad += 1; };

  await d.boot();   // device R, first visit (its storage is cleared and set up here)
  booted.add(R);
  await app.cdp('Fetch.enable', { patterns: [{ urlPattern: '*/api/sync*', requestStage: 'Request' }] });
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { timeout: 25000, label: 'the Desk on R' });
  await sleep(800);

  // ---- D and C: one round each -------------------------------------------------------------------------------------------------
  const BASE = ['The first line of the page.', 'The second line.'].join(NL);
  const FROM_R1 = 'From R first.', FROM_S = 'From S only.', FROM_R2 = 'From R second.', FROM_R3 = 'From R third.';
  async function round(name, id, savedOnR) {
    console.log(`--- ${name}: page ${id}, ${savedOnR ? 'R has a saved, unsynced edit' : 'R has nothing unsaved before it opens the page'}`);
    // 1. R makes the page and syncs it: the server and both devices will share this text
    await goDevice(R);
    server.offline = false; server.hold = false;
    await seedPage(id, BASE);
    const settled1 = await settle();
    check(settled1 && server.rows.has(id) && server.rows.get(id).rec.text === BASE, `${name}-1 R made the page and it reached the server (settled ${settled1})`);
    // 2. R saves words of its own and is cut off: the page is dirty on R
    let baseOnR = null;
    if (savedOnR) {
      server.offline = true;
      await openEditor(id, BASE);
      await typeAtEnd(NL + FROM_R1);
      await waitText(() => record(id), (t) => typeof t === 'string' && t.includes(FROM_R1), 9000);
      await ev('window.wrizoFlushNow && window.wrizoFlushNow(); true');
      const dirty = await dirtyCount();
      baseOnR = await ev(`(() => { try { const ks = Object.keys(localStorage).filter((k) => k.startsWith('wrizo-sync-base')); return ks.map((k) => k + ':' + (localStorage.getItem(k) || '').length).join(' '); } catch (e) { return 'ERR'; } })()`);
      check(dirty > 0 && (await record(id)).includes(FROM_R1), `${name}-2 R holds its words saved and unsynced (dirty ${dirty}; base keys: ${baseOnR})`);
    }
    // 3. S pulls the page and pushes a different line (S's edit is the LATER one on the server)
    server.offline = false;
    await goDevice(S);
    await waitText(() => record(id), (t) => typeof t === 'string' && t.length > 0, 15000);
    await settle();
    await ev(`window.wrizoPatchEntry(${JSON.stringify(id)}, { text: ${JSON.stringify(BASE + NL + FROM_S)} }); true`);
    const settled3 = await settle();
    check(settled3 && server.rows.get(id).rec.text.includes(FROM_S), `${name}-3 S pushed its line (settled ${settled3}); the server holds ${lines(server.rows.get(id).rec.text)}`);
    // 4. R comes back; its sync is HELD; the writer opens the page and types words that are not saved yet; then the answer arrives
    server.hold = true;
    await goDevice(R);
    await sleep(600);
    const startText = savedOnR ? BASE + NL + FROM_R1 : BASE;
    await openEditor(id, startText);
    await typeAtEnd(NL + FROM_R2);
    const unsaved = !(await record(id)).includes(FROM_R2);
    const held = server.held.length;
    check(unsaved, `${name}-4 the page is OPEN on R with words typed and not saved (the record lacks them; ${held} sync request(s) held)`);
    await release();
    const merged = await waitText(editorText, (t) => typeof t === 'string' && t.includes(FROM_S), 15000);
    check(typeof merged === 'string' && merged.includes(FROM_S), `${name}-5 S's line arrives in the open editor: ${lines(merged)}`);
    check(typeof merged === 'string' && merged.includes(FROM_R2) && (!savedOnR || merged.includes(FROM_R1)), `${name}-6 R's own words are all still there: ${lines(merged)}`);
    // 5. the writer keeps typing; everything settles
    await typeAtEnd(NL + FROM_R3);
    await sleep(2600);
    await ev('window.wrizoFlushNow && window.wrizoFlushNow(); true');
    const settled5 = await settle(20000);
    await sleep(800);
    await settle(10000);
    const all = [BASE.split(NL)[0], BASE.split(NL)[1], FROM_S, FROM_R2, FROM_R3].concat(savedOnR ? [FROM_R1] : []);
    const onceEach = (t) => typeof t === 'string' && all.every((s) => count(t, s) === 1);
    const ed = await editorText(), rec = await record(id), srv = server.rows.get(id).rec.text;
    check(onceEach(ed), `${name}-7 the open editor has every line, once each: ${lines(ed)}`);
    check(onceEach(rec), `${name}-8 R's record has every line, once each (settled ${settled5}): ${lines(rec)}`);
    check(onceEach(srv), `${name}-9 the server has every line, once each: ${lines(srv)}`);
    // 6. S syncs and holds the same
    await goDevice(S);
    await settle();
    await waitText(() => record(id), (t) => typeof t === 'string' && t.includes(FROM_R3), 12000);
    const sRec = await record(id);
    check(onceEach(sRec), `${name}-10 device S has every line, once each: ${lines(sRec)}`);
    console.log(`SERVER LOG ${name}: ${server.log.slice(-14).join(' | ')}`);
    server.log.length = 0;
  }
  await round('D', 'wo-dirty-' + Date.now().toString(36), true);
  await round('C', 'wo-clean-' + Date.now().toString(36), false);

  // ---- M: the typing path ------------------------------------------------------------------------------------------------------
  console.log('--- M: sync base writes to storage, timed, with the event they ran in');
  await goDevice(R);
  server.offline = false; server.hold = false;
  const installLog = () => ev(`(() => { window.__sbLog = []; const orig = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { const t0 = performance.now(); try { return orig.call(this, k, v); } finally { const ks = String(k); if (ks.startsWith('wrizo-sync-base') || ks.startsWith('writer-studio-journal-entries')) window.__sbLog.push({ k: ks.startsWith('wrizo-sync-base:') ? 'page' : ks.startsWith('wrizo-sync-base') ? 'index' : 'records', len: String(v).length, ms: performance.now() - t0, ev: window.event ? window.event.type : null }); } }; return true; })()`);
  await installLog();
  const stats = (rows) => { if (!rows.length) return 'none'; const ms = rows.map((r) => r.ms).sort((a, b) => a - b); const q = (p) => ms[Math.min(ms.length - 1, Math.floor(p * ms.length))].toFixed(2); return `n=${rows.length} median ${q(0.5)} ms, p95 ${q(0.95)} ms, max ${ms[ms.length - 1].toFixed(2)} ms, chars max ${Math.max(...rows.map((r) => r.len))}`; };
  const inEvent = (rows) => rows.filter((r) => r.ev && /^(key|input|beforeinput|compos)/.test(r.ev));
  // 1. typing into a page: where does the base write run
  const tid = 'wo-type-' + Date.now().toString(36);
  await seedPage(tid, 'One short line to type after.');
  await settle();
  await ev('window.__sbLog.length = 0; true');
  await openEditor(tid, 'One short line to type after.');
  await typeAtEnd(' typing, typing, typing, and typing some more.');
  const during = await ev('window.__sbLog.slice()');
  await sleep(2600);
  const after = await ev('window.__sbLog.slice()');
  const baseWrites = after.filter((r) => r.k !== 'records');
  check(inEvent(during).length === 0, `M1 while the writer types (keydown/input events) the sync base wrote ${during.filter((r) => r.k !== 'records').length} time(s) and ${inEvent(during).filter((r) => r.k !== 'records').length} of them inside a key event`);
  console.log(`M1 base writes after the autosave: ${baseWrites.map((r) => `${r.k} ${r.len} chars ${r.ms.toFixed(2)} ms in ${r.ev || 'a timer (no event)'}`).join(' | ') || 'none'}`);
  check(baseWrites.length > 0 && baseWrites.every((r) => !r.ev), `M1 the base is written from the autosave timer, not from a key event (${baseWrites.length} write(s))`);
  await settle();
  // 2. 101 pages of 14 000 characters: the bound
  await goDevice(R);
  await installLog();
  const BIG = 'abcdefghij klmnopqrstu vwxyz. '.repeat(470).slice(0, 14000);
  for (let i = 0; i < 101; i += 1) await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'wo-b' + i, text: BIG + i, createdAt: new Date().toISOString(), origin: 'journal', source: 'page' })}); true`);
  await settle(30000);
  await ev('window.__sbLog.length = 0; true');
  for (let i = 0; i < 100; i += 1) await ev(`window.wrizoPatchEntry('wo-b' + ${i}, { text: ${JSON.stringify(BIG)} + ${i} + 'x' }); true`);
  const fill = await ev('window.__sbLog.slice()');
  console.log(`M2 filling 100 pages (14 000 chars each, 1.4 M in all): base page writes ${stats(fill.filter((r) => r.k === 'page'))}; index writes ${stats(fill.filter((r) => r.k === 'index'))}; whole-store writes (the first design) ${stats(fill.filter((r) => r.k === 'index' && r.len > 100000))}; the page records' own flush ${stats(fill.filter((r) => r.k === 'records'))}`);
  await ev('window.__sbLog.length = 0; true');
  await ev(`window.wrizoPatchEntry('wo-b100', { text: ${JSON.stringify(BIG)} + '100x' }); true`);
  const over = await ev('window.__sbLog.slice()');
  console.log(`M3 the 101st page (the oldest base goes): ${over.map((r) => `${r.k} ${r.len} chars ${r.ms.toFixed(2)} ms`).join(' | ')}`);
  const nKeys = await ev("Object.keys(localStorage).filter((k) => k.startsWith('wrizo-sync-base:')).length");
  const idx = await ev("(() => { try { return JSON.parse(localStorage.getItem('wrizo-sync-base-index-v1') || '[]').length; } catch (e) { return -1; } })()");
  const oldKey = await ev("(localStorage.getItem('wrizo-sync-bases-v1') || '').length");
  console.log(`M3 after the 101st: ${nKeys} base page keys, index ${idx}; whole-store key chars ${oldKey}`);
  // 3. one page of 1.4 M characters
  const HUGE = 'lorem ipsum dolor sit amet. '.repeat(50000).slice(0, 1400000);
  await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'wo-huge', text: HUGE, createdAt: new Date().toISOString(), origin: 'journal', source: 'page' })}); true`);
  await settle(30000);
  await ev('window.__sbLog.length = 0; true');
  await ev(`window.wrizoPatchEntry('wo-huge', { text: ${JSON.stringify(HUGE + ' edited')} }); true`);
  const huge = await ev('window.__sbLog.slice()');
  console.log(`M4 one page of 1.4 M characters, first edit: ${huge.map((r) => `${r.k} ${r.len} chars ${r.ms.toFixed(2)} ms`).join(' | ')}`);
});
console.log(`SYNC-OPEN-79 [${TAG}] ${bad ? `FAIL - ${bad} check(s)` : 'PASS'}`);
process.exit(bad ? 1 : 0);
