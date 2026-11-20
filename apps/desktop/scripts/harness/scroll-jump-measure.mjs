// SCROLL JUMP - MEASURE (#112; scroll-open.mjs F1 and O4 on e2af18d1: after the opening cut, a stroke drawn after her own scroll, and typing six lines at the end of a 5k page, both leave the
// scroll near 0: "first 3752, last 0"). Who sets it? A MEASUREMENT, not a verdict: it patches the scroller's scrollTop setter and scrollTo/scrollBy to log every JS write with a short stack,
// logs every scroll event with the scroller's height, and logs the typewriter hook's own trace, around (a) one pen stroke after her own scroll to the middle, (b) six typed lines at the end.
// Run: on Actions (harness.yml, files=scroll-jump-measure.mjs). Prints SCROLL-J lines.
import { withHarness } from '../runtime-verify.mjs';
import { makeDriver, sleep } from './writing-audit/lib/driver.mjs';

const VOCAB = ['the', 'writer', 'kept', 'going', 'past', 'midnight', 'and', 'a', 'quiet', 'river', 'ran', 'under', 'window', 'of', 'room', 'where', 'she', 'had', 'left', 'her', 'coat'];
const pageOf = (n) => { const out = []; let w = 0; let i = 7; while (w < n) { const len = 12 + (i % 20); const line = []; for (let k = 0; k < len && w < n; k++) { line.push(VOCAB[(i * 7 + k * 3) % VOCAB.length]); w++; } out.push(line.join(' ') + '.'); i++; } return out.join('\n'); };
const ED = '.forward-only-editor';

const INSTALL = `(() => { const sc = document.querySelector('.mode-scroll'); const ed = document.querySelector('${ED}'); window.__log = []; window.__t0 = performance.now(); window.__wzTwTrace = window.__wzTwTrace || [];
  const L = (k, v, extra) => window.__log.push([Math.round(performance.now() - window.__t0), k, v, sc.scrollHeight, sc.clientHeight, extra || '']);
  const stack = () => (new Error().stack || '').split('\\n').slice(2, 6).map((s) => s.trim().replace(/^at /, '').replace(/https?:\\/\\/[^ )]*\\//g, '')).join(' < ').slice(0, 260);
  const desc = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollTop');
  Object.defineProperty(sc, 'scrollTop', { configurable: true, get() { return desc.get.call(this); }, set(v) { L('set', Math.round(v), stack()); desc.set.call(this, v); } });
  const st = sc.scrollTo.bind(sc); sc.scrollTo = (a, b) => { L('scrollTo', typeof a === 'object' ? Math.round(a.top) : b, stack()); return st(a, b); };
  const sb = sc.scrollBy.bind(sc); sc.scrollBy = (a, b) => { L('scrollBy', typeof a === 'object' ? a.top : b, stack()); return sb(a, b); };
  sc.addEventListener('scroll', () => L('scroll', Math.round(desc.get.call(sc))), { passive: true });
  const mo = new MutationObserver((ms) => { for (const m of ms) L('mut', m.type, (m.target === ed ? 'editor' : (m.target.className && m.target.className.baseVal === undefined ? String(m.target.className).split(' ')[0] : m.target.nodeName)) + ' +' + m.addedNodes.length + ' -' + m.removedNodes.length); });
  mo.observe(sc, { childList: true, subtree: true, characterData: true });
  const fo = HTMLElement.prototype.focus; HTMLElement.prototype.focus = function (o) { L('focus', this.className && this.className.baseVal === undefined ? String(this.className).split(' ')[0] : this.nodeName, (o && o.preventScroll ? 'preventScroll ' : '') + stack()); return fo.call(this, o); };
  const si = Element.prototype.scrollIntoView; Element.prototype.scrollIntoView = function (o) { L('scrollIntoView', this.className && this.className.baseVal === undefined ? String(this.className).split(' ')[0] : this.nodeName, stack()); return si.call(this, o); };
  document.addEventListener('focusin', (e) => L('focusin', e.target && e.target.className && e.target.className.baseVal === undefined ? String(e.target.className).split(' ')[0] : (e.target && e.target.nodeName)), true);
  for (const t of ['pointerdown', 'pointerup', 'click']) document.addEventListener(t, (e) => L(t, e.target && e.target.className && e.target.className.baseVal === undefined ? String(e.target.className).split(' ')[0] : (e.target && e.target.nodeName)), true);
  window.__jOff = () => { mo.disconnect(); HTMLElement.prototype.focus = fo; Element.prototype.scrollIntoView = si; }; return true; })()`;
const DUMP = (from) => `(() => { const l = window.__log; const i = l.findIndex((e) => (e[1] === 'scroll' || e[1] === 'set') && e[2] <= 1 && ${from}); const at = i < 0 ? Math.max(0, l.length - 30) : Math.max(0, i - 8);
  return { n: l.length, firstZeroAt: i < 0 ? null : l[i][0], around: l.slice(at, at + 26), trace: (window.__wzTwTrace || []).slice(-14) }; })()`;

await withHarness(async (app) => {
  const cfg = { theme: 'machina', flag: 'off', tone: 'light', width: 1366, height: 768, out: null };
  const d = makeDriver(app, cfg);
  await d.boot();
  // (a) a stroke after her own scroll, three ways: as it is; with scroll anchoring off on the scroller; with the committed canvas hidden
  for (const variant of ['plain', 'no-anchor', 'no-canvas']) {
    try {
      const id = await d.openPage(pageOf(3000), 'journal', {});
      await sleep(2500);
      if (variant === 'no-anchor') await d.ev("(() => { const st = document.createElement('style'); st.textContent = '.mode-scroll, .mode-scroll * { overflow-anchor: none !important; }'; document.head.appendChild(st); return true; })()");
      if (variant === 'no-canvas') await d.ev("(() => { const st = document.createElement('style'); st.textContent = '.ink-committed { display: none !important; }'; document.head.appendChild(st); return true; })()");
      const tabbed = await app.waitFor("!!document.querySelector('#wz-sliver-tab-ink')", { label: 'the INK tab', timeout: 8000 }).then(() => true, () => false);
      if (tabbed) { await d.ev("document.querySelector('#wz-sliver-tab-ink').click()"); await sleep(400); }
      await d.ev("(() => { const sc = document.querySelector('.mode-scroll'); sc.scrollTop = Math.floor((sc.scrollHeight - sc.clientHeight) / 2); return true; })()"); await sleep(1200);
      const box = await d.ev("(() => { const s = document.querySelector('.wz-ink-sheet').getBoundingClientRect(); const c = document.querySelector('.mode-scroll').getBoundingClientRect(); return { x: s.left + s.width / 2, y: c.top + c.height / 2 }; })()");
      await d.ev(INSTALL);
      const ev = (type, p) => app.cdp('Input.dispatchMouseEvent', { type, x: p.x, y: p.y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'pen', force: type === 'mouseReleased' ? 0 : 0.5 });
      await ev('mousePressed', { x: box.x, y: box.y });
      for (let i = 1; i <= 12; i += 1) await ev('mouseMoved', { x: box.x + i * 8, y: box.y + (i % 2 ? 6 : -6) });
      await ev('mouseReleased', { x: box.x + 96, y: box.y });
      await sleep(2500);
      const dump = await d.ev(`(() => { const l = window.__log; const i = l.findIndex((e) => (e[1] === 'scroll' || e[1] === 'set') && e[2] <= 1); return { n: l.length, firstZeroAt: i < 0 ? null : l[i][0], all: l.filter((e) => e[1] !== 'pointermove').slice(0, 40), top: Math.round(document.querySelector('.mode-scroll').scrollTop) }; })()`);
      console.log(`SCROLL-J stroke ${variant} ${JSON.stringify(dump)}`);
      await d.ev('window.__jOff()');
    } catch (e) { console.log(`SCROLL-J stroke ${variant} ERROR ${String(e && e.message || e).slice(0, 200)}`); }
  }
  // (b) six typed lines at the end of a 5k page
  try {
    const id = await d.openPage(pageOf(5000), 'journal', {});
    await sleep(3000);
    await d.ev("(() => { const sc = document.querySelector('.mode-scroll'); sc.scrollTop = sc.scrollHeight; return true; })()"); await sleep(800);
    await d.ev(`(() => { const ed = document.querySelector('${ED}'); ed.focus({ preventScroll: true }); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()`); await sleep(600);
    await d.ev(INSTALL);
    for (let i = 1; i <= 3; i += 1) { await app.typeKeys(`\nAnd the writer goes on, line ${i} of the new ones.`); await sleep(160); }
    await sleep(1500);
    console.log(`SCROLL-J typing ${JSON.stringify(await d.ev(DUMP('true')))}`);
  } catch (e) { console.log(`SCROLL-J typing ERROR ${String(e && e.message || e).slice(0, 200)}`); }
});
console.log('SCROLL-JUMP-MEASURE: PASS (a measurement; the SCROLL-J lines are the result)');
