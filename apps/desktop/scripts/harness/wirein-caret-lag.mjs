// #137 - WIRE IN'S BLOCK CARET KEEPS UP WITH HER TYPING (Nick, Nov 26: "the cursor doesn't keep up with typing in Flux's Wire In mode"; a page of about one paragraph; it trails and catches up a moment after he stops).
// Flux, Wire In, SIGNED IN (a fake server in the page, as free-write-signed-in.mjs), a short page (one paragraph) and a long one (5,000+ words), 1536 x 864 at device scale 1 and 2.5.
// A burst of 66 keys at about 10 a second. A reader in the page looks once a frame: how many letters the page shows, and how many of them the block caret stands after.
//   For each key: the frame its letter is on the page, and the frame the block stands after it. MEASURED and printed: both delays in ms (median, worst), the frames between them, the most letters the block was behind.
//   K1  the block stands after each letter within 2 frames of the letter being drawn
//   K2  the block is never more than 2 letters behind the text
//   K3  every key typed is on the page (typing lands)
//   MUT the judge goes RED on a block that follows only at the end
// Run: node scripts/harness/wirein-caret-lag.mjs (from apps/desktop; Actions or the box).
process.env.WS_ARBOR2 = 'default';
process.env.WS_MACHINA2 = 'default';
const { withHarness } = await import('../runtime-verify.mjs');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? '  ' + String(detail).slice(0, 900) : ''}`); };
const J = (v) => JSON.stringify(v);
const SENTENCE = (i) => `Line ${i} of the draft kept going, and the river ran under the window of the room where she had left her coat that morning.`;
const SEEDS = {
  short: SENTENCE(1) + ' ' + SENTENCE(2) + ' ' + SENTENCE(3),
  long: Array.from({ length: 230 }, (_, i) => SENTENCE(i)).join(String.fromCharCode(10, 10)),
};
const BURST = ' the quick brown fox jumps over the lazy dog and runs home again now';
const ARMS = [{ page: 'short', dpr: 1 }, { page: 'short', dpr: 2.5 }, { page: 'long', dpr: 1 }, { page: 'long', dpr: 2.5 }];

// a signed-in session without a server: /auth/me, /api/sync (keeps what is pushed), the rest absent
const FAKE_SERVER = `(() => {
  const rows = new Map(); const orig = window.fetch.bind(window);
  const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json' } });
  window.fetch = async (url, init) => {
    const u = String(url);
    if (u.includes('/auth/me')) return json({ id: 'u-wcl', email: 'writer@example.invalid', name: 'Test' });
    if (u.includes('/api/sync')) { const body = JSON.parse((init && init.body) || '{}'); for (const r of (body.push && body.push.journalEntries) || []) rows.set(r.id, r); return json({ serverTime: new Date().toISOString(), pull: body.pull === false ? {} : { journalEntries: [] } }); }
    if (/\\/api\\/(prefs|rail|page-defaults|proofing|theme-unlock)/.test(u)) return json({}, 404);
    return orig(url, init);
  };
})();`;

// the reader: once a frame, the letters shown and how many of them the block stands after (read from the last 90 letters' own boxes)
const READER = `(() => {
  const L = window.__lag = { keys: [], frames: [], on: true, sel: 0 };
  document.addEventListener('keydown', (e) => { if (e.key.length === 1) L.keys.push({ t: performance.now() }); }, true);
  document.addEventListener('selectionchange', () => { L.sel += 1; });
  const letters = () => { const ed = document.querySelector('.forward-only-editor'); if (!ed) return null;
    const walk = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); const nodes = []; let total = 0;
    for (let n = walk.nextNode(); n; n = walk.nextNode()) { const s = n.data.replace(/\\u200b/g, ''); if (!s.length) continue; nodes.push(n); total += s.length; }
    return { nodes, total }; };
  L.count = () => letters()?.total ?? 0;
  const tick = () => {
    if (!L.on) return;
    const t = performance.now(); const text = letters(); const block = document.querySelector('.flux-block-caret');
    let behind = null;
    if (text && block) {
      const b = block.getBoundingClientRect(); const mid = b.top + b.height / 2;
      let seen = 0;   // letters counted back from the end
      const range = document.createRange();
      for (let i = text.nodes.length - 1; i >= 0 && behind === null && seen < 90; i -= 1) {
        const n = text.nodes[i];
        for (let k = n.data.length - 1; k >= 0 && behind === null && seen < 90; k -= 1) {
          if (n.data[k] === '\\u200b') continue;
          range.setStart(n, k); range.setEnd(n, k + 1);
          const q = [...range.getClientRects()].pop();
          if (q && q.height && mid >= q.top - 2 && mid <= q.bottom + 2) {
            if (Math.abs(b.left - q.right) <= Math.max(3, q.width * 0.35)) behind = seen;
            else if (Math.abs(b.left - q.left) <= 2) behind = seen + 1;
          }
          seen += 1;
        }
      }
      if (behind === null) behind = 90;
    }
    L.frames.push({ t, n: text ? text.total : 0, behind, block: !!block });
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  return true;
})()`;

// from the raw samples: each key's text frame and caret frame (pure, so the mutant can judge a made-up run)
const read = (start, keys, frames) => {
  const per = keys.map((k, i) => {
    const want = start + i + 1;
    const f = frames.findIndex((s) => s.t >= k.t && s.n >= want);
    const c = frames.findIndex((s) => s.t >= k.t && s.block && s.behind !== null && s.n - s.behind >= want);
    return { text: f < 0 ? null : frames[f].t - k.t, caret: c < 0 ? null : frames[c].t - k.t, gap: f < 0 || c < 0 ? null : c - f };
  });
  const nums = (key) => per.map((p) => p[key]).filter((v) => v !== null).sort((a, b) => a - b);
  const med = (a) => (a.length ? Math.round(a[a.length >> 1]) : null);
  const max = (a) => (a.length ? Math.round(a[a.length - 1]) : null);
  const typing = frames.filter((s) => keys.length && s.t >= keys[0].t && s.t <= keys[keys.length - 1].t && s.block && s.behind !== null);
  return { keys: per.length, never: per.filter((p) => p.caret === null).length, textMs: { median: med(nums('text')), worst: max(nums('text')) }, caretMs: { median: med(nums('caret')), worst: max(nums('caret')) },
    gapFrames: { median: med(nums('gap')), worst: max(nums('gap')) }, behindLetters: typing.reduce((m, s) => Math.max(m, s.behind), 0), noBlockFrames: frames.filter((s) => !s.block).length, frames: frames.length };
};
const K1 = (r) => !!r && r.never === 0 && r.gapFrames.worst !== null && r.gapFrames.worst <= 2;
const K2 = (r) => !!r && r.behindLetters <= 2;

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const soft = async (expr, timeout = 25000) => { try { await app.waitFor(expr, { label: expr.slice(0, 60), timeout }); return true; } catch { return false; } };
  await app.cdp('Page.addScriptToEvaluateOnNewDocument', { source: FAKE_SERVER });
  await app.emulateDpr(1, 1536, 864);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','flux'); true");
  await app.reload();
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams', timeout: 20000 });
  for (const arm of ARMS) {
    const tag = `${arm.page} page, scale ${arm.dpr}`;
    const id = `wcl-${arm.page}-${String(arm.dpr).replace('.', '_')}`;
    await app.emulateDpr(arm.dpr, 1536, 864);
    await ev("location.hash = '#/'; true"); await sleep(300);
    await ev(`window.wrizoCreateJournalPage(${J({ id, text: SEEDS[arm.page], createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })}); window.wrizoFlushNow(); true`);
    await ev(`localStorage.setItem('wrizo-theme', 'flux'); history.replaceState(null, '', '/#/page/${id}'); true`);
    await app.reload();
    await soft("!!document.querySelector('.forward-only-editor')");
    await soft("!document.querySelector('.wz-splash')");
    await sleep(5200);   // the entry line gone, the hold settled
    await ev("document.querySelector('.forward-only-editor').focus({ preventScroll: true }); true");
    await app.typeKeys('.'); await sleep(800);   // one key first: the caret drawn at the end
    const where = await ev("({ jacked: document.documentElement.hasAttribute('data-flux3-jacked'), dpr: devicePixelRatio, block: !!document.querySelector('.flux-block-caret'), words: document.querySelector('.forward-only-editor').textContent.split(/\\s+/).length })");
    await ev(READER);
    await sleep(400);
    const start = await ev('window.__lag.count()');
    for (const ch of BURST) { await app.typeKeys(ch); await sleep(90); }
    await sleep(1500);
    const raw = await ev('(() => { window.__lag.on = false; return { keys: window.__lag.keys, frames: window.__lag.frames, sel: window.__lag.sel, end: window.__lag.count() }; })()');
    const r = read(start, raw.keys, raw.frames);
    const rest = raw.frames.length ? raw.frames[raw.frames.length - 1].behind : null;
    console.log(`MEASURE ${tag}: ${J({ ...where, ...r, selectionchanges: raw.sel, behindAtRest: rest })}`);
    ok(`K1 ${tag}: the block stands after each letter within 2 frames of it being drawn`, where.jacked && K1(r), J({ gapFrames: r.gapFrames, caretMs: r.caretMs, textMs: r.textMs, never: r.never }));
    ok(`K2 ${tag}: the block is never more than 2 letters behind the text`, where.block && K2(r), J({ behindLetters: r.behindLetters, behindAtRest: rest }));
    ok(`K3 ${tag}: every key typed is on the page`, raw.end - start === BURST.length, J({ typed: BURST.length, shown: raw.end - start }));
  }
  const late = read(0, [{ t: 0 }, { t: 100 }], [{ t: 10, n: 1, behind: 1, block: true }, { t: 110, n: 2, behind: 2, block: true }, { t: 400, n: 2, behind: 2, block: true }, { t: 900, n: 2, behind: 0, block: true }]);
  const live = read(0, [{ t: 0 }, { t: 100 }], [{ t: 16, n: 1, behind: 0, block: true }, { t: 116, n: 2, behind: 0, block: true }]);
  ok('MUT: the judges go RED on a block that follows only at the end, and pass one that keeps up', !K1(late) && K1(live) && K2(live), J({ late: late.gapFrames }));
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); ok('HARNESS ' + String(e && e.message || e).slice(0, 300), false); }

const bad = checks.filter((c) => !c.pass).length;
if (process.env.HARNESS_PARKED === '1') console.log('\nWIREIN-CARET-LAG PARKED: PASS (0 records) - a new file; it parks nothing of its own');
console.log(bad ? `\nWIREIN-CARET-LAG VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nWIREIN-CARET-LAG VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
