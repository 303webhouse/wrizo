// #117, THE CAUSE, MADE DETERMINISTIC (the loop, return-caret-loop.mjs, catches the flake about 1 in 60 and says where the selection sits: INK saw it on the editor element itself, offset 2 = the end of a Free Write host's two children).
// ForwardOnlyEditor keeps the caret at the end after EVERY render while the host is focused (the effect "Keep the browser's (invisible) caret at the end after every re-render"), except when the writer has moved it (writerMovedRef: a press or a
// navigation key). The way-back restore places the caret by the app - not a press, not a key - so writerMovedRef is still false, and ANY render of the editor after the last re-assert (rAF, 80, 200, 350 ms) puts the caret back at the end.
// Most returns have no render that late; one in about sixty does (a save echo, a store notify).
//   RR1  she returns by the chip; the caret is where she left it (the restore is fine)
//   RR2  then the page's record is saved again with the same words (the store notifies, the page renders, as an autosave echo does): the caret is STILL where she left it
//   RR3  and a caret she moved herself (a click) is left alone by that same render, as before (the control: the fix must not stop the end-anchor for typing)
//   MUT  the RR2 judge goes RED on a caret at the end
// Run: harness.yml files=return-caret-rerender.mjs (Actions or the box).
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? '  ' + String(detail).slice(0, 500) : ''}`); };
const ID = 'rr117-page';
const LINES = Array.from({ length: 45 }, (_, i) => `Line ${i} of the growing manuscript page, long enough to wrap and force real scroll.`).join(String.fromCharCode(10));
const WANT = 500;
const judgeStays = (caret) => caret === WANT;

const HELPERS = `
window.__setCaretAt = function(selector, target) {
  const el = document.querySelector(selector);
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let offset = 0, node = null, local = 0, n;
  while ((n = walker.nextNode())) { const len = n.data.length; if (offset + len >= target) { node = n; local = target - offset; break; } offset += len; }
  const sel = window.getSelection(); const range = document.createRange();
  if (node) range.setStart(node, Math.max(0, Math.min(local, node.data.length))); else range.selectNodeContents(el);
  range.collapse(true); sel.removeAllRanges(); sel.addRange(range); el.focus(); return true;
};
window.__caretNow = function() {
  const el = document.querySelector('.forward-only-editor'); const sel = window.getSelection();
  if (!el || !sel.anchorNode || !el.contains(sel.anchorNode)) return null;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let offset = 0, n;
  while ((n = walker.nextNode())) { if (n === sel.anchorNode) return offset + sel.anchorOffset; offset += n.data.length; }
  return null;
};
`;

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await app.waitFor("!document.querySelector('.wz-splash')", { timeout: 15000, label: 'splash gone' }).catch(() => {});
  await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id: ID, text: LINES, createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })}); window.wrizoFlushNow(); location.hash = '#/page/${ID}'; true`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 15000, label: 'the page' });
  await sleep(900);
  await ev(HELPERS);
  await ev("document.querySelector('.mode-scroll').scrollTop = 300; true");
  await sleep(150);
  await ev(`document.querySelector('.forward-only-editor').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); window.__setCaretAt('.forward-only-editor', ${WANT}); true`);   // as a writer places it: a press first
  await sleep(200);
  await ev("location.hash = '#/journal'; true");
  await app.waitFor("!!document.querySelector('.board-canvas')", { timeout: 15000, label: 'the Journal board' });
  await sleep(200);
  await ev("document.querySelector('.desk-rail-wayback').click(); true");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 15000, label: 'the page back' });
  await ev(HELPERS);
  await sleep(900);   // past the restore's last re-assert (350 ms)
  const back = await ev('window.__caretNow()');
  ok('RR1 she returns by the chip: the caret is where she left it', back === WANT, JSON.stringify({ want: WANT, back }));
  // the page's record is saved again with the same words: the store notifies and the page renders, as a save's echo does
  await ev(`window.wrizoPatchEntry(${JSON.stringify(ID)}, { text: ${JSON.stringify(LINES)} }); true`);
  await sleep(500);
  const after = await ev('window.__caretNow()');
  const anchor = await ev("(() => { const s = getSelection(), n = s.anchorNode; return n ? { node: n.nodeType === 3 ? '#text' : n.tagName.toLowerCase() + '.' + String(n.className || '').split(' ')[0], offset: s.anchorOffset } : null; })()");
  ok('RR2 then the record is saved again (a render of the page): the caret is still where she left it', judgeStays(after), JSON.stringify({ want: WANT, after, anchor }));
  // RR3: a caret she moves herself is left alone by the same render (the control)
  await ev("window.__setCaretAt('.forward-only-editor', 1500); true");
  const rect = await ev("(() => { const el = document.querySelector('.forward-only-editor'); const r = el.getBoundingClientRect(); return { x: Math.round(r.left + 40), y: Math.round(r.top + 120) }; })()");
  await app.mouseDown(rect.x, rect.y); await app.mouseUp(rect.x, rect.y);   // a press: the writer moved it
  await sleep(200);
  const moved = await ev('window.__caretNow()');
  await ev(`window.wrizoPatchEntry(${JSON.stringify(ID)}, { text: ${JSON.stringify(LINES)} }); true`);
  await sleep(500);
  const movedAfter = await ev('window.__caretNow()');
  ok('RR3 a caret she moved with a press is left where it is by the same render (the control)', moved !== null && movedAfter === moved, JSON.stringify({ moved, movedAfter }));
  ok('MUT-RR2 the RR2 judge goes RED on a caret at the end', judgeStays(null) === false && judgeStays(WANT + 1) === false);
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); ok('HARNESS ' + String(e && e.message || e).slice(0, 300), false); }

const bad = checks.filter((c) => !c.pass).length;
console.log(bad ? `\nRETURN-CARET-RERENDER VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nRETURN-CARET-RERENDER VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
