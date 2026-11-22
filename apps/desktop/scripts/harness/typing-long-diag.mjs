// A PROBE (it never fails): WHAT HAPPENS TO A LONG PAGE'S SCROLL WHEN SHE TYPES AT ITS END, key by key, in Free Write (the Typewriter). Found by typewriter-open-settles.mjs TW4 on main AND on the #53 fix: after the first new
// line typed at the end of a 60-line page, the scroll is at ~14-26 (near the TOP) and the Typewriter walks it down again at a line per line typed, so the line she is writing sits ~2200 px below the window. This prints the
// scroll top and the end of the words after each key of three kinds of typing (letters one by one, one Enter, a quick run of letters), with the engine's own trace around the first key.
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const LONG = Array.from({ length: 60 }, (_, i) => `Line ${String(i + 1).padStart(2, '0')} of a long page that the writer has been in for a while.`).join('\n');
const END = () => `(() => { const sc = document.querySelector('.mode-scroll'); const ed = document.querySelector('.forward-only-editor'); const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n, last = null; while ((n = w.nextNode())) { if (n.nodeValue.length) last = n; } let b = null; if (last) { const r = document.createRange(); r.setStart(last, Math.max(0, last.nodeValue.length - 1)); r.setEnd(last, last.nodeValue.length); b = Math.round(r.getBoundingClientRect().bottom); } return [Math.round(sc.scrollTop), b, sc.scrollHeight]; })()`;

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 15000, label: 'splash gone' }).catch(() => {});
  await app.emulateDpr(1, 1366, 768);
  await app.cdp('Page.addScriptToEvaluateOnNewDocument', { source: 'window.__wzTwTrace = [];' });
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','plateau');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await splashGone();
  const open = async () => {
    const id = `tld-${Date.now()}`;
    await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: LONG, createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })})`);
    await sleep(250);
    await ev(`(() => { localStorage.setItem('wrizo-mode-page-${id}', 'journal'); history.replaceState(null, '', '/#/page/${id}'); })()`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 15000, label: 'the page' }).catch(() => {});
    await splashGone();
    await app.mouseMove(8, 8);
    await sleep(8000);
    await ev("(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const s = getSelection(); s.selectAllChildren(ed); s.collapseToEnd(); return true; })()");
    await sleep(500);
  };
  const say = (k, o) => console.log(`PROBE ${k} ${JSON.stringify(o)}`);

  // A: letters, one by one
  await open();
  const a0 = await ev(END());
  const A = [];
  for (let i = 0; i < 6; i += 1) { await app.typeKeys('x'); await sleep(40); A.push(await ev(END())); }
  await sleep(1500);
  say('letters', { before: a0, perKey: A, settled: await ev(END()) });
  say('letters-trace', { trace: await ev('JSON.stringify((window.__wzTwTrace || []).slice(-14))') });

  // B: one Enter
  await open();
  const b0 = await ev(END());
  await app.typeKeys('\n'); await sleep(40);
  const b1 = await ev(END());
  await sleep(120); const b2 = await ev(END());
  await sleep(1500); const b3 = await ev(END());
  say('enter', { before: b0, after40ms: b1, after160ms: b2, settled: b3 });
  say('enter-trace', { trace: await ev('JSON.stringify((window.__wzTwTrace || []).slice(-14))') });

  // C: a quick run of letters
  await open();
  const c0 = await ev(END());
  await app.typeKeys('and so it goes on and on'); await sleep(60);
  const c1 = await ev(END());
  await sleep(1500);
  say('run', { before: c0, afterRun: c1, settled: await ev(END()) });
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); }
console.log('\nTYPING-LONG-DIAG DONE (a probe: it never fails)');
