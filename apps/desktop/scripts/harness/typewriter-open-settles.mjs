// A LONG PAGE OPENS ALREADY ON ITS LINE (bug-list #53, Fable, Nov 22, 3:05 am: "After opening a long page, the Typewriter scrolls ~60x/s at rest", every theme; Nick, 2:59 am: typing bugs come first). MEASURED on today's main by
// typing-bugs-probe.mjs (run 45012882963): the page is at true rest by 12 s (0 scroll events a second), but for the first ~5 s after a 60-line page opens the Typewriter walks the page down to the caret one line at a time,
// ~90 scroll events and ~135 frame requests a second (scroll top 757 -> 1589 in the probe's 3 s window), in Arbor, Machina and Flux. A page that opens with her caret at the end should simply BE there: the walk is for a
// writer who is typing past the line, not for opening a page.
//   TW1  a long page (60 lines) opens ON ITS LINE: by 0.8 s after the editor exists, the page has stopped moving at the place it ends at (no later scroll event is more than 2 px from where it finally rests)
//   TW2  ...and the Typewriter is quiet after that: at most 3 scroll events at all in the 0.8 s to 6 s after the editor exists
//   TW3  a SHORT page opens without a walk: no scroll event after 0.8 s
//   TW4  the Typewriter still FOLLOWS her once she types: a burst of 8 new lines at the end of the long page moves the page on (scroll top above where it opened), and the last line stays inside the window
//   MUT  the reader goes RED on the old walk: the page scrolled line by line from its top to its end after load (a probe that does it) fails TW1
// Run: node scripts/harness/typewriter-open-settles.mjs (from apps/desktop; a box turn or Actions)
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const LONG = Array.from({ length: 60 }, (_, i) => `Line ${String(i + 1).padStart(2, '0')} of a long page that the writer has been in for a while.`).join('\n');
const SHORT = Array.from({ length: 6 }, (_, i) => `Line ${i + 1} of a short page.`).join('\n');
const THEMES = [{ name: 'Arbor', theme: 'plateau' }, { name: 'Machina', theme: 'machina' }, { name: 'Flux', theme: 'flux' }];

// installed before every document: when the page's editor first exists, note the time and listen to its scroller
const WATCH = `(() => { window.__wzTwTrace = []; window.__tw = { tEd: null, ev: [] };
  const arm = () => { if (window.__tw.tEd !== null) return; if (!document.querySelector('.forward-only-editor')) return; const sc = document.querySelector('.mode-scroll'); if (!sc) return;
    window.__tw.tEd = performance.now(); sc.addEventListener('scroll', () => { window.__tw.ev.push([Math.round(performance.now()), Math.round(sc.scrollTop * 10) / 10]); }, true); };
  new MutationObserver(arm).observe(document, { childList: true, subtree: true }); })();`;

const SETTLE = (win) => `(() => { const w = window.__tw; if (!w || w.tEd === null) return null; const ev = w.ev.map((e) => [e[0] - Math.round(w.tEd), e[1]]); const rest = ev.length ? ev[ev.length - 1][1] : null;
  const sc = document.querySelector('.mode-scroll'); const F = sc ? Math.round(sc.scrollTop * 10) / 10 : rest;
  const late = ev.filter((e) => e[0] > ${win} && Math.abs(e[1] - F) > 2).length; const after = ev.filter((e) => e[0] > ${win}).length;
  return { n: ev.length, last: ev.length ? ev[ev.length - 1][0] : null, final: F, late, after, first: ev.length ? ev[0] : null }; })()`;

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 15000, label: 'splash gone' }).catch(() => {});
  await app.emulateDpr(1, 1366, 768);
  await app.cdp('Page.addScriptToEvaluateOnNewDocument', { source: WATCH });
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await splashGone();
  let seq = 0;
  const open = async (T, text) => {
    const id = `two-${Date.now()}-${seq += 1}`;
    await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text, createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })})`);
    await sleep(250);
    await ev(`(() => { localStorage.setItem('wrizo-theme', ${JSON.stringify(T.theme)}); localStorage.setItem('wrizo-mode-page-${id}', 'journal'); history.replaceState(null, '', '/${T.theme === 'flux' ? '?flux3=1' : ''}#/page/${id}'); })()`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 15000, label: 'the page' }).catch(() => {});
    await app.mouseMove(8, 8);
    await sleep(6500);
    return id;
  };
  for (const T of THEMES) {
    await open(T, LONG);
    const s = await ev(SETTLE(800));
    const q = await ev(SETTLE(800));
    ok(`TW1 [${T.name}] a long page opens ON ITS LINE: by 0.8 s after the editor exists the page has stopped moving (no later scroll event more than 2 px from where it rests)`, !!s && s.late === 0, JSON.stringify(s));
    ok(`TW2 [${T.name}] ...and the Typewriter is quiet after that: at most 3 scroll events in the 0.8 s to 6 s after the editor exists`, !!q && q.after <= 3, JSON.stringify({ after: q && q.after, last: q && q.last }));
    if (T.theme === 'plateau') {
      const rest = s && s.final;
      await ev("(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const sel = getSelection(); sel.selectAllChildren(ed); sel.collapseToEnd(); return true; })()");
      const END = "(() => { const sc = document.querySelector('.mode-scroll'); const ed = document.querySelector('.forward-only-editor'); const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n, last = null; while ((n = w.nextNode())) { if (n.nodeValue.length) last = n; } let b = null; if (last) { const r = document.createRange(); r.setStart(last, Math.max(0, last.nodeValue.length - 1)); r.setEnd(last, last.nodeValue.length); b = Math.round(r.getBoundingClientRect().bottom); } return [Math.round(sc.scrollTop), b]; })()";
      const per = [];
      for (let i = 0; i < 8; i += 1) { await app.typeKeys('\nnew line ' + (i + 1) + ' of her words'); per.push(await ev(END)); }
      await sleep(1500);
      const tr = await ev('JSON.stringify((window.__wzTwTrace || []).slice(-16))');
      const t = await ev("(() => { const sc = document.querySelector('.mode-scroll'); const ed = document.querySelector('.forward-only-editor'); const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n, last = null; while ((n = w.nextNode())) { if (n.nodeValue.length) last = n; } let b = null; if (last) { const r = document.createRange(); r.setStart(last, Math.max(0, last.nodeValue.length - 1)); r.setEnd(last, last.nodeValue.length); b = Math.round(r.getBoundingClientRect().bottom); } return { top: Math.round(sc.scrollTop), lastBottom: b, win: innerHeight }; })()");
      ok('TW4 [Arbor] the Typewriter still FOLLOWS her once she types: a burst of 8 new lines at the end moves the page on, and the last line stays inside the window', !!t && rest !== null && t.top > rest && t.lastBottom !== null && t.lastBottom <= t.win, JSON.stringify({ openedAt: rest, after: t, perLine: per, trace: tr }));
    }
  }
  await open(THEMES[0], SHORT);
  const sh = await ev(SETTLE(800));
  ok('TW3 [Arbor] a SHORT page opens without a walk: no scroll event after 0.8 s', !!sh && sh.after === 0, JSON.stringify(sh));
  // the reader can go red: a probe that walks a just-opened long page to its end line by line after load, read the same way
  await open(THEMES[0], LONG);
  await ev("(() => { const sc = document.querySelector('.mode-scroll'); sc.scrollTop = 0; window.__tw.ev.length = 0; window.__tw.tEd = performance.now() - 100; let top = 0; const walk = () => { top += 30; sc.scrollTop = top; if (top < 1500) setTimeout(walk, 60); }; walk(); return true; })()");
  await sleep(3500);
  const m = await ev(SETTLE(800));
  ok('MUT-TW1 the TW1 reader goes RED on the old walk (a page that scrolls itself line by line for seconds after it opens)', !!m && m.late > 0, JSON.stringify(m));
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); checks.push({ name: 'HARNESS', pass: false, detail: String(e && e.message || e) }); }

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nTYPEWRITER-OPEN-SETTLES VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nTYPEWRITER-OPEN-SETTLES VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
