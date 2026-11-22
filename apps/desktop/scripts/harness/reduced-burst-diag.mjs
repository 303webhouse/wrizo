// A PROBE (it never fails): WHY DOES REDUCED MOTION LEAVE THE WRITING LINE LOW AFTER A BURST? (bug-list #52). typing-bugs-probe.mjs on main (run 45015410990): in Machina and Flux a burst of 14 lines under
// reduced motion ends with the page scrolled to 378 where motion-on ends at 510, the writing line ~208 px (screen) below its hold; Arbor is fine. This prints, for Machina with reduced motion, the engine's WHOLE trace
// of the burst (every decision, compressed), and the scroll top and end of the words after each typed line, so the lines the engine does not pay can be seen.
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SHORT = Array.from({ length: 6 }, (_, i) => `Line ${i + 1} of a short page.`).join('\n');
const END = `(() => { const sc = document.querySelector('.mode-scroll'); const ed = document.querySelector('.forward-only-editor'); const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n, last = null; while ((n = w.nextNode())) { if (n.nodeValue.length) last = n; } let b = null; if (last) { const r = document.createRange(); r.setStart(last, Math.max(0, last.nodeValue.length - 1)); r.setEnd(last, last.nodeValue.length); b = Math.round(r.getBoundingClientRect().bottom); } return [Math.round(sc.scrollTop), b, sc.scrollHeight - sc.clientHeight]; })()`;

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 15000, label: 'splash gone' }).catch(() => {});
  await app.emulateDpr(1, 1366, 768);
  await app.cdp('Page.addScriptToEvaluateOnNewDocument', { source: 'window.__wzTwTrace = [];' });
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await splashGone();
  for (const [name, theme, reduced] of [['Machina reduced', 'machina', true], ['Machina motion', 'machina', false], ['Arbor reduced', 'plateau', true]]) {
    const id = `rbd-${Date.now()}`;
    await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: SHORT, createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })})`);
    await sleep(250);
    await app.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }] });
    await ev(`(() => { localStorage.setItem('wrizo-theme', '${theme}'); localStorage.setItem('wrizo-mode-page-${id}', 'journal'); history.replaceState(null, '', '/#/page/${id}'); })()`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 15000, label: 'the page' }).catch(() => {});
    await splashGone();
    await app.mouseMove(8, 8);
    await sleep(2500);
    await ev("(() => { const ed = document.querySelector('.forward-only-editor'); if (document.activeElement !== ed) ed.focus({ preventScroll: true }); window.__wzTwTrace.length = 0; return true; })()");
    const per = [await ev(END)];
    for (let i = 0; i < 14; i += 1) { await app.typeKeys('\nburst line ' + (i + 1) + ' of words'); per.push(await ev(END)); }
    await sleep(1800);
    const fin = await ev(END);
    const tr = await ev("(() => { const c = {}; const out = []; for (const e of window.__wzTwTrace) { c[e.d] = (c[e.d] || 0) + 1; if (e.d === 'step' || e.d === 'engage' || e.d === 'fresh' || e.d === 'lost' || e.d === 'place') out.push([e.d, e.from, e.to, e.advance, e.within, e.threshold, e.top]); } return JSON.stringify({ counts: c, decisions: out.slice(0, 40) }); })()");
    console.log(`PROBE burst [${name}] ${JSON.stringify({ perLine: per, final: fin })}`);
    console.log(`PROBE burst-trace [${name}] ${tr}`);
  }
  await app.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); }
console.log('\nREDUCED-BURST-DIAG DONE (a probe: it never fails)');
