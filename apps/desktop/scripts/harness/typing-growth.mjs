// TYPING GROWTH (bug #85, #110, #101; Fable, Nov 22, 3:05 am: "each key costs more as the page grows: 20 ms at 20k words, 52 at 50k"; "Space and Enter on long Free Write pages"). A MEASUREMENT with bars, read by what a clock cannot fake: the cost of a key RELATIVE to the same key on a short page, on the same machine in the same run.
// Real CDP keys, one at a time, on a page of 500, 5,000, 20,000 and 50,000 words, in Draft and in Free Write, caret in the middle of the page (the worst case for offset walks), 30 keys of each kind:
//   BUSY   keydown -> the end of the task that handled it (a message posted from the keydown runs when that task and React's flush are done): the main-thread cost of the key, which the frame clock hides when it is under a frame
//   PAINT  keydown -> the second frame after it (what the writer sees)
// The three kinds: a LETTER, a SPACE (commits the word and rebuilds the committed runs) and ENTER (a new line).
//   KG-LETTER  letters cost no more on a 50,000-word page than on a 500-word one + 8 ms (median BUSY), in Draft and in Free Write
//   KG-SPACE   the same for Space
//   KG-ENTER   the same for Enter
// The slack is absolute (8 ms) because the short page's own cost is a few ms and a ratio of a few ms is noise; a page-length cost shows as tens of ms (Fable's numbers: 20 at 20k, 52 at 50k). It prints every number so a read is never a guess.
// Run: node scripts/harness/typing-growth.mjs   (Actions harness, advisory; a box turn for the speed numbers)
const { withHarness } = await import('../runtime-verify.mjs');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const SIZES = [500, 5000, 20000, 50000];
const MODES = [['draft', 'Draft'], ['freewrite', 'Free Write']];
const KEYS = 30, SLACK_MS = 8;
const PARA = 'The writer keeps a steady pace through the long draft, and nothing slows the page down at all. ';
const page = (words) => { const per = PARA.trim().split(/\s+/).length; const n = Math.ceil(words / per); return Array.from({ length: n }, () => PARA.trim()).join('\n'); };
const med = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? Math.round(s[Math.floor(s.length / 2)] * 10) / 10 : null; };
const p95 = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? Math.round(s[Math.min(s.length - 1, Math.floor(0.95 * s.length))] * 10) / 10 : null; };

const HOOK = `(() => {
  window.__kg = { busy: [], paint: [], kind: '' };
  const mc = new MessageChannel();
  let t0 = null;
  mc.port1.onmessage = () => { if (t0 === null) return; window.__kg.busy.push(performance.now() - t0); };
  window.addEventListener('keydown', (e) => { if (e.key.length > 1 && e.key !== 'Enter') return; t0 = performance.now(); const start = t0; mc.port2.postMessage(0); requestAnimationFrame(() => requestAnimationFrame(() => { window.__kg.paint.push(performance.now() - start); })); }, true);
  return true; })()`;

await withHarness(async (app) => {
  const rows = [];
  for (const words of SIZES) {
    await app.emulateDpr(1, 1400, 900);
    await app.goto('/');
    await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); null");
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival') && typeof window.wrizoCreateJournalPage === 'function'", { label: 'Desk and seams', timeout: 30000 });
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'kg-1', text: page(words), createdAt: '2026-04-01T00:00:00.000Z', source: 'page', origin: 'loose' })}); window.wrizoFlushNow(); null`);
    await sleep(800);
    for (const [mode, label] of MODES) {
      await app.reload();
      await app.waitFor("typeof window.wrizoTheme === 'object'", { label: 'the seams again', timeout: 30000 });
      await app.evalJs("location.hash = '#/page/kg-1'");
      await app.waitFor(`!!document.querySelector('${ED}')`, { label: `page (${words})`, timeout: 40000 });
      await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 30000 });
      await sleep(1500);
      await app.click(label); await sleep(2500);
      await app.evalJs(`(() => { const ed = document.querySelector('${ED}'); ed.focus(); const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n, acc = 0; const target = Math.floor(ed.textContent.length / 2);
        while ((n = w.nextNode())) { if (acc + n.data.length >= target) { const r = document.createRange(); r.setStart(n, Math.max(0, target - acc)); r.collapse(true); const s = getSelection(); s.removeAllRanges(); s.addRange(r); break; } acc += n.data.length; } return true; })()`);
      await sleep(600);
      for (const [kind, send] of [['letter', async () => app.typeKeys('a')], ['space', async () => app.typeKeys(' ')], ['enter', async () => app.key('Enter')]]) {
        await app.evalJs(HOOK);
        for (let i = 0; i < KEYS; i += 1) { await send(); await sleep(110); }
        await sleep(500);
        const m = await app.evalJs('window.__kg');
        const row = { words, mode, kind, n: m.busy.length, busy_med: med(m.busy), busy_p95: p95(m.busy), paint_med: med(m.paint), paint_p95: p95(m.paint) };
        rows.push(row);
        console.log('TG ' + JSON.stringify(row));
      }
    }
  }
  console.log('\nTYPING GROWTH (ms; BUSY = main-thread cost of the key, PAINT = keydown to the second frame):');
  for (const r of rows) console.log(`  ${String(r.words).padStart(6)} words  ${r.mode.padEnd(9)} ${r.kind.padEnd(6)}  busy ${r.busy_med} / p95 ${r.busy_p95};  paint ${r.paint_med} / p95 ${r.paint_p95}  (n ${r.n})`);
  for (const kind of ['letter', 'space', 'enter']) {
    const bad = [];
    for (const [mode] of MODES) {
      const small = rows.find((r) => r.words === 500 && r.mode === mode && r.kind === kind);
      const big = rows.find((r) => r.words === 50000 && r.mode === mode && r.kind === kind);
      if (!small || !big || small.busy_med == null || big.busy_med == null) { bad.push({ mode, why: 'no data' }); continue; }
      if (big.busy_med > small.busy_med + SLACK_MS) bad.push({ mode, small: small.busy_med, big: big.busy_med });
    }
    ok(`KG-${kind.toUpperCase()} a ${kind} costs no more (median BUSY) on a 50,000-word page than on a 500-word one + ${SLACK_MS} ms, in Draft and in Free Write`, bad.length === 0, JSON.stringify(bad));
  }
}, { label: 'typing-growth' });

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 800)}`);
const EXPECTED = 3;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nTYPING-GROWTH VERIFY: PASS (${checks.length} checks)`
  : `\nTYPING-GROWTH VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
