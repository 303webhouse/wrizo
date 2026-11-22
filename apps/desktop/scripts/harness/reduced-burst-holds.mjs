// UNDER REDUCED MOTION THE WRITING LINE STAYS AT ITS HOLD (bug-list #52, Fable, Nov 22: "Under reduced motion, the zoomed Typewriter leaves the writing line below the window after a fast burst", every theme). MEASURED on today's main
// (reduced-burst-diag.mjs, run 45015838375, Arbor / Machina / Flux, a 6-line page and a 14-line burst of Enter and words): with motion the page opens with its writing line carried to the HOLD (the staircase) and the burst keeps it
// there (the last line ends at y = 458); under reduced motion the page opens with the writing line 207 px BELOW the hold (665) - nothing carried it - and the engine then pays exactly one line per typed line, so every line of the burst
// stays 207 px low: the line she is writing ends at 669 in a 768-tall window, and a longer burst takes it out of the window. The cause is not the burst; it is that a page opened under reduced motion is never carried to its hold.
//   RM1  the page OPENS with its writing line at the hold, with motion or without: the end of the words is within 40 px of where it stands with motion on (the hold), before a key is typed
//   RM2  a burst of 14 lines under reduced motion leaves the last line at the hold too (within 40 px of the motion-on position), and inside the window
//   RM3  a burst of 40 lines (a long one) under reduced motion keeps the last line inside the window
//   MUT  the reader goes RED on a page opened with the line below the hold (the same page, scrolled to its top by a probe, as the old engine left it): RM1 fails
// Run: node scripts/harness/reduced-burst-holds.mjs (from apps/desktop; a box turn or Actions)
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const SHORT = Array.from({ length: 6 }, (_, i) => `Line ${i + 1} of a short page.`).join('\n');
const THEMES = [{ name: 'Arbor', theme: 'plateau' }, { name: 'Machina', theme: 'machina' }, { name: 'Flux', theme: 'flux' }];
const END = `(() => { const sc = document.querySelector('.mode-scroll'); const ed = document.querySelector('.forward-only-editor'); const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n, last = null; while ((n = w.nextNode())) { if (n.nodeValue.length) last = n; } let b = null; if (last) { const r = document.createRange(); r.setStart(last, Math.max(0, last.nodeValue.length - 1)); r.setEnd(last, last.nodeValue.length); b = Math.round(r.getBoundingClientRect().bottom); } return { top: Math.round(sc.scrollTop), bottom: b, win: innerHeight }; })()`;

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 15000, label: 'splash gone' }).catch(() => {});
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await splashGone();
  let seq = 0;
  const open = async (T, reduced) => {
    const id = `rbh-${Date.now()}-${seq += 1}`;
    await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: SHORT, createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })})`);
    await sleep(250);
    await app.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }] });
    await ev(`(() => { localStorage.setItem('wrizo-theme', '${T.theme}'); localStorage.setItem('wrizo-mode-page-${id}', 'journal'); history.replaceState(null, '', '/${T.theme === 'flux' ? '?flux3=1' : ''}#/page/${id}'); })()`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 15000, label: 'the page' }).catch(() => {});
    await splashGone();
    await app.mouseMove(8, 8);
    await sleep(3000);
    await ev("(() => { const ed = document.querySelector('.forward-only-editor'); if (document.activeElement !== ed) ed.focus({ preventScroll: true }); return true; })()");
  };
  const burst = async (n) => { for (let i = 0; i < n; i += 1) await app.typeKeys('\nburst line ' + (i + 1) + ' of words'); await sleep(1800); return ev(END); };
  for (const T of THEMES) {
    await open(T, false);
    const hold = await ev(END);     // with motion the page opens with the line at its hold
    await open(T, true);
    const rest = await ev(END);
    ok(`RM1 [${T.name}] the page OPENS with its writing line at the hold under reduced motion: the end of the words is within 40 px of the motion-on place before a key is typed`, !!hold && !!rest && Math.abs(rest.bottom - hold.bottom) <= 40, JSON.stringify({ motionOn: hold, reduced: rest }));
    const b14 = await burst(14);
    await open(T, false);
    const m14 = await burst(14);
    ok(`RM2 [${T.name}] a burst of 14 lines under reduced motion leaves the last line at the hold (within 40 px of the motion-on place) and inside the window`, !!b14 && !!m14 && Math.abs(b14.bottom - m14.bottom) <= 40 && b14.bottom <= b14.win, JSON.stringify({ reduced: b14, motionOn: m14 }));
    if (T.theme === 'machina') {
      await open(T, true);
      const b40 = await burst(40);
      ok('RM3 [Machina] a burst of 40 lines under reduced motion keeps the last line inside the window', !!b40 && b40.bottom <= b40.win, JSON.stringify(b40));
    }
  }
  await open(THEMES[0], true);
  await ev("document.querySelector('.mode-scroll').scrollTop = 0");
  await sleep(600);
  const low = await ev(END);
  await open(THEMES[0], false);
  const ref = await ev(END);
  ok('MUT-RM1 the RM1 reader goes RED on a page opened with the line below the hold (scrolled to its top): the end of the words is more than 40 px from the motion-on place', !!low && !!ref && Math.abs(low.bottom - ref.bottom) > 40, JSON.stringify({ low, ref }));
  await app.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); checks.push({ name: 'HARNESS', pass: false, detail: String(e && e.message || e) }); }

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nREDUCED-BURST-HOLDS VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nREDUCED-BURST-HOLDS VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
