// A PROBE (it never fails): WHAT DOES LEAVING FREE WRITE (THE TYPEWRITER) DO TO THE LINE SHE WAS WRITING? (bug-list #48, re-worded by Fable, Nov 22, 9:35 am: "on leaving Free Write, the line she was writing stays in view. A jump to the top that
// loses it on a long page is the bug; a short page that fits may show its top"). For a long page (60 lines) and a short one (6), in each theme, at 1366 x 768: the scroll top, the scroller's box, and where the LAST line of the words (where
// she was writing) stands, in Free Write and again 1.5 s after the Draft tab is pressed.
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const LONG = Array.from({ length: 60 }, (_, i) => `Line ${String(i + 1).padStart(2, '0')} of a long page that the writer has been in for a while.`).join('\n');
const SHORT = Array.from({ length: 6 }, (_, i) => `Line ${i + 1} of a short page.`).join('\n');
const READ = `(() => { const sc = document.querySelector('.mode-scroll'); const ed = document.querySelector('.forward-only-editor'); if (!sc || !ed) return null; const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n, last = null; while ((n = w.nextNode())) { if (n.nodeValue.length) last = n; }
  let b = null; if (last) { const r = document.createRange(); r.setStart(last, Math.max(0, last.nodeValue.length - 1)); r.setEnd(last, last.nodeValue.length); const g = r.getBoundingClientRect(); b = { top: Math.round(g.top), bottom: Math.round(g.bottom) }; }
  const box = sc.getBoundingClientRect(); const sel = getSelection(); let caret = null; if (sel && sel.rangeCount && ed.contains(sel.anchorNode)) { const rs = sel.getRangeAt(0).getClientRects(); const r0 = rs.length ? rs[rs.length - 1] : null; if (r0 && r0.height) caret = { top: Math.round(r0.top), bottom: Math.round(r0.bottom) }; }
  return { scrollTop: Math.round(sc.scrollTop), maxTop: sc.scrollHeight - sc.clientHeight, clip: [Math.round(box.top), Math.round(box.bottom)], win: innerHeight, lastLine: b, caret, zoom: (document.querySelector('.mode-pagecol') || { getAttribute: () => null }).getAttribute('data-zoom'), mode: (document.querySelector('.desk-mode-tab[aria-selected="true"]') || { getAttribute: () => null }).getAttribute('data-mode-key') }; })()`;
const THEMES = [{ name: 'Arbor', theme: 'plateau' }, { name: 'Machina', theme: 'machina' }, { name: 'Flux', theme: 'flux' }];

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
  for (const T of THEMES) for (const [kind, text] of [['long', LONG], ['short', SHORT]]) {
    const id = `ltd-${Date.now()}-${seq += 1}`;
    await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text, createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })})`);
    await sleep(250);
    await ev(`(() => { localStorage.setItem('wrizo-theme', '${T.theme}'); localStorage.setItem('wrizo-mode-page-${id}', 'journal'); history.replaceState(null, '', '/${T.theme === 'flux' ? '?flux3=1' : ''}#/page/${id}'); })()`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 15000, label: 'the page' }).catch(() => {});
    await splashGone();
    await app.mouseMove(8, 8);
    await sleep(7000);
    const fw = await ev(READ);
    await ev("(() => { const b = document.querySelector('.desk-mode-tab[data-mode-key=\"draft\"]'); if (b) b.click(); })()");
    await sleep(1500);
    const dr = await ev(READ);
    console.log(`PROBE #48-${kind} [${T.name}] ${JSON.stringify({ freeWrite: fw, draft: dr })}`);
  }
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); }
console.log('\nLEAVE-TYPEWRITER-DIAG DONE (a probe: it never fails)');
