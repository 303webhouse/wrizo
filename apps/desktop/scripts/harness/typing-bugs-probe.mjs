// THE TYPING BUGS, REPRODUCED ON TODAY'S MAIN BEFORE ANY FIX (Fable, Nov 22, 3:05 am: Nick, 2:59 am: "typing bugs now come BEFORE Flux; they ruin his testing"; claude/bug-list.md #48, #49, #52, #53, and #33 which has its own check, caret-reset.mjs).
// A PROBE, NOT A VERDICT: it never fails. Each probe prints one line, "PROBE <bug> {...}", of what main actually does, so the red check that follows is written against a measured symptom and not a guess. The page is Free Write (Typewriter:
// since Nov 19 Free Write ALWAYS runs it and Draft never does), 1366 x 768, in Arbor, Machina and Flux; the bug list's own words are quoted beside each probe.
//   #48  "Leaving the Typewriter moves the scroll 0 -> 79 (a law-1 question)": the page's scroll top and its first row's top, in Free Write and after the Draft tab is pressed
//   #49  "No caret after leaving the Typewriter with Esc (the focus stays on the hand's grip)": where the focus is after Esc from the page, and after Esc from an open menu, and whether a caret exists then
//   #52  "Under reduced motion, the zoomed Typewriter leaves the writing line below the window after a fast burst": the caret's line against the window's bottom after a burst of Enter and words, with and without reduced motion
//   #53  "After opening a long page, the Typewriter scrolls ~60x/s at rest": scroll events, scroll calls, scroll-top writes and frame requests in 3 s with nothing happening
// Run: node scripts/harness/typing-bugs-probe.mjs (from apps/desktop; a box turn or Actions)
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const LONG = Array.from({ length: 60 }, (_, i) => `Line ${String(i + 1).padStart(2, '0')} of a long page that the writer has been in for a while.`).join('\n');
const SHORT = Array.from({ length: 6 }, (_, i) => `Line ${i + 1} of a short page.`).join('\n');
const THEMES = [{ name: 'Arbor', theme: 'plateau' }, { name: 'Machina', theme: 'machina' }, { name: 'Flux', theme: 'flux' }];

const READ = () => `(() => {
  const sc = document.querySelector('.mode-scroll'), ed = document.querySelector('.forward-only-editor');
  if (!sc || !ed) return null;
  const col = document.querySelector('.mode-pagecol');
  const rows = [...ed.querySelectorAll('.wz-row')];
  const sel = getSelection();
  let caret = null;
  if (sel && sel.rangeCount && ed.contains(sel.anchorNode)) { const rg = sel.getRangeAt(0); const rs = rg.getClientRects(); const r0 = rs.length ? rs[rs.length - 1] : null; if (r0 && r0.height > 0) caret = { top: Math.round(r0.top), bottom: Math.round(r0.bottom) }; else { const ae = sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement; const row = ae && ae.closest ? ae.closest('.wz-row') : null; if (row) { const b = row.getBoundingClientRect(); caret = { top: Math.round(b.top), bottom: Math.round(b.bottom) }; } } }
  const box = sc.getBoundingClientRect();
  const a = document.activeElement;
  return { scrollTop: Math.round(sc.scrollTop * 10) / 10, scrollH: sc.scrollHeight, clientH: sc.clientHeight, clipTop: Math.round(box.top), clipBottom: Math.round(box.bottom), win: innerHeight,
    firstRowTop: rows[0] ? Math.round(rows[0].getBoundingClientRect().top) : null, lastRow: rows.length ? { top: Math.round(rows[rows.length - 1].getBoundingClientRect().top), bottom: Math.round(rows[rows.length - 1].getBoundingClientRect().bottom) } : null, nRows: rows.length, zoom: col ? col.getAttribute('data-zoom') : null, tw: sc.getAttribute('data-typewriter'), caret,
    active: a ? (a.tagName + '.' + String(a.className).slice(0, 36)) : null, hasCaret: !!(sel && sel.rangeCount && ed.contains(sel.anchorNode)), winScroll: Math.round(scrollY),
    mode: (document.querySelector('.desk-mode-tab[aria-selected="true"]') || { getAttribute: () => null }).getAttribute('data-mode-key') };
})()`;

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
  const open = async (T, text, { reduced = false, mode = 'journal' } = {}) => {
    const id = `tbp-${Date.now()}-${seq += 1}`;
    await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text, createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })})`);
    await sleep(250);
    await app.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }] });
    await ev(`(() => { localStorage.setItem('wrizo-theme', ${JSON.stringify(T.theme)}); localStorage.setItem('wrizo-mode-page-${id}', ${JSON.stringify(mode)}); history.replaceState(null, '', '/${T.theme === 'flux' ? '?flux3=1' : ''}#/page/${id}'); })()`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 15000, label: 'the page' }).catch(() => {});
    await splashGone();
    await app.mouseMove(8, 8);
    await sleep(1800);
    return id;
  };
  const say = (bug, T, o) => console.log(`PROBE ${bug} [${T.name}] ${JSON.stringify(o)}`);
  const key = (k, code, vk) => app.cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk }).then(() => app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk }));

  for (const T of THEMES) {
    // ---- #53: a long page, Free Write, at rest ----
    await open(T, LONG);
    await ev(`(() => { window.__sc = { events: 0, calls: 0, sets: 0, raf: 0 }; const sc = document.querySelector('.mode-scroll'); sc.addEventListener('scroll', () => { window.__sc.events += 1; }, true); window.addEventListener('scroll', () => { window.__sc.events += 1; }, true);
      for (const m of ['scrollTo', 'scrollBy', 'scroll']) { const o = Element.prototype[m]; Element.prototype[m] = function (...a) { window.__sc.calls += 1; return o.apply(this, a); }; const w = window[m]; window[m] = function (...a) { window.__sc.calls += 1; return w.apply(this, a); }; }
      const d = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollTop'); Object.defineProperty(Element.prototype, 'scrollTop', { get() { return d.get.call(this); }, set(v) { window.__sc.sets += 1; d.set.call(this, v); }, configurable: true });
      const r = window.requestAnimationFrame; window.requestAnimationFrame = function (f) { window.__sc.raf += 1; return r.call(window, f); }; return true; })()`);
    const before53 = await ev(READ());
    await sleep(3000);
    const c53 = await ev('window.__sc');
    const after53 = await ev(READ());
    say('#53', T, { perSecond: { events: c53.events / 3, scrollCalls: c53.calls / 3, scrollTopSets: c53.sets / 3, frameRequests: c53.raf / 3 }, scrollTop: [before53 && before53.scrollTop, after53 && after53.scrollTop], zoom: after53 && after53.zoom });

    // ---- #48: leaving the Typewriter (Free Write -> Draft) ----
    await open(T, LONG);
    const fw = await ev(READ());
    await ev("(() => { const b = document.querySelector('.desk-mode-tab[data-mode-key=\"draft\"]'); if (b) b.click(); })()");
    await sleep(1500);
    const dr = await ev(READ());
    say('#48', T, { freeWrite: fw && { scrollTop: fw.scrollTop, firstRowTop: fw.firstRowTop, zoom: fw.zoom, clipTop: fw.clipTop }, draft: dr && { scrollTop: dr.scrollTop, firstRowTop: dr.firstRowTop, zoom: dr.zoom, clipTop: dr.clipTop, mode: dr.mode } });

    // ---- #48 on a SHORT page (the bug list's own 0 -> 79 is a short page's number) ----
    await open(T, SHORT);
    const fws = await ev(READ());
    await ev("(() => { const b = document.querySelector('.desk-mode-tab[data-mode-key=\"draft\"]'); if (b) b.click(); })()");
    await sleep(1500);
    const drs = await ev(READ());
    say('#48-short', T, { freeWrite: fws && { scrollTop: fws.scrollTop, firstRowTop: fws.firstRowTop, zoom: fws.zoom, clipTop: fws.clipTop }, draft: drs && { scrollTop: drs.scrollTop, firstRowTop: drs.firstRowTop, zoom: drs.zoom, clipTop: drs.clipTop } });

    // ---- #49: Esc ----
    await open(T, SHORT);
    await ev("(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const s = getSelection(); s.selectAllChildren(ed); s.collapseToEnd(); return true; })()");
    const e0 = await ev(READ());
    await key('Escape', 'Escape', 27); await sleep(500);
    const e1 = await ev(READ());
    await ev("(() => { const g = document.querySelector('.wz-sliver-grip'); if (g) { g.focus(); g.click(); } })()");
    await sleep(700);
    const m1 = await ev(READ());
    await key('Escape', 'Escape', 27); await sleep(600);
    const m2 = await ev(READ());
    // the same in DRAFT, where the menus are usable: open the Front menu, press Esc, where is the focus and is there a caret to type into?
    await open(T, SHORT, { mode: 'drafting' });
    await ev("(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const s = getSelection(); s.selectAllChildren(ed); s.collapseToEnd(); return true; })()");
    await ev("(() => { const g = document.querySelector('.wz-sliver-grip'); if (g) { g.focus(); g.click(); } })()");
    await sleep(700);
    const d1 = await ev(READ());
    await key('Escape', 'Escape', 27); await sleep(600);
    const d2 = await ev(READ());
    await app.typeKeys('X'); await sleep(200);
    const d3 = await ev("(() => { const ed = document.querySelector('.forward-only-editor'); return { typed: ed.innerText.includes('X'), active: document.activeElement ? document.activeElement.tagName + '.' + String(document.activeElement.className).slice(0, 30) : null }; })()");
    say('#49-draft', T, { menuOpen: d1 && { active: d1.active }, afterEsc: d2 && { active: d2.active, hasCaret: d2.hasCaret }, aKeyTypedAfterEsc: d3 });
    say('#49', T, { page: { before: e0 && { active: e0.active, hasCaret: e0.hasCaret }, afterEsc: e1 && { active: e1.active, hasCaret: e1.hasCaret, mode: e1.mode } }, menu: { opened: m1 && { active: m1.active }, afterEsc: m2 && { active: m2.active, hasCaret: m2.hasCaret } } });

    // ---- #52: a fast burst, with and without reduced motion ----
    for (const reduced of [false, true]) {
      await open(T, SHORT, { reduced });
      await ev("(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const s = getSelection(); s.selectAllChildren(ed); s.collapseToEnd(); return true; })()");
      for (let i = 0; i < 14; i += 1) await app.typeKeys('\nburst line ' + (i + 1) + ' of words');
      const reads = [];
      for (const wait of [150, 400, 900, 1600]) { await sleep(wait); const b = await ev(READ()); reads.push(b && { lastRow: b.lastRow, scrollTop: b.scrollTop }); }
      const last = reads[reads.length - 1];
      say('#52', T, { reduced, window: 768, readings: reads, finalLastRowBelowWindow: !!(last && last.lastRow && last.lastRow.bottom > 768) });
    }
    await app.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  }
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); }
console.log('\nTYPING-BUGS-PROBE DONE (a probe: it never fails)');
