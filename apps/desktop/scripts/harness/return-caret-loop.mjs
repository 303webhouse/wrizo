// #117 - AFTER THE RETURN CHIP, HER CARET IS SOMETIMES NOT PUT BACK (w2; "about 1 in 48 to 72 on main and on the join"; INK: a row is replaced after the restore). w2.mjs proves the way back ONCE; a flake of 1 in 60 needs the loop.
// Each cycle: the page is open, the caret put at a known offset (and the scroll at a known place), she leaves by the rail (Journal), returns by the chip, and the caret is read twice: soon after the editor is back (450 ms: the restore re-asserts at
// rAF, 80, 200 and 350 ms) and later (1,800 ms: nothing of hers has touched the page). Which of the two reads is wrong says whether the restore never landed or landed and was undone.
//   RC1  over N cycles the caret is where she left it at 450 ms, every time
//   RC2  and at 1,800 ms, every time (a restore that landed is not undone by a row written after it)
//   MUT  the judge goes RED on a miss (the observation a flake makes)
// Run: harness.yml files=return-caret-loop.mjs (Actions); RC_CYCLES=n to change the count (default 240).
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? '  ' + String(detail).slice(0, 700) : ''}`); };
const N = Math.max(1, Number(process.env.RC_CYCLES || 240));
const ID = 'rc117-page';
const LINES = Array.from({ length: 45 }, (_, i) => `Line ${i} of the growing manuscript page, long enough to wrap and force real scroll.`).join(String.fromCharCode(10));
const OFFSETS = [40, 500, 1200, 2100, 2900];   // where she leaves the caret, by cycle
const judge = (reads, want) => reads.every((r) => r === want);

const CARET_HELPER = `
window.__setCaretAt = function(selector, target) {
  const el = document.querySelector(selector);
  if (!el) throw new Error('setCaretAt: not found ' + selector);
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let offset = 0, node = null, localOffset = 0, n;
  while ((n = walker.nextNode())) {
    const len = n.data.length;
    if (offset + len >= target) { node = n; localOffset = target - offset; break; }
    offset += len;
  }
  const sel = window.getSelection();
  const range = document.createRange();
  if (node) range.setStart(node, Math.max(0, Math.min(localOffset, node.data.length)));
  else range.selectNodeContents(el);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
  el.focus();
  return true;
};
window.__anchorNow = function() {
  const s = window.getSelection(); const n = s.anchorNode;
  return n ? { node: n.nodeType === 3 ? '#text' : (n.tagName.toLowerCase() + '.' + String(n.className || '').split(' ')[0]), offset: s.anchorOffset, children: n.nodeType === 1 ? n.childNodes.length : null, focusInEditor: !!(document.activeElement && document.activeElement.classList.contains('forward-only-editor')) } : null;
};
window.__caretNow = function() {
  const el = document.querySelector('.forward-only-editor');
  const sel = window.getSelection();
  if (!el || !sel.anchorNode || !el.contains(sel.anchorNode)) return null;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let offset = 0, n;
  while ((n = walker.nextNode())) { if (n === sel.anchorNode) return offset + sel.anchorOffset; offset += n.data.length; }
  return null;
};
`;

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  await app.emulateDpr(1, 1024, 1400);   // w2.mjs's own window (the driver's default): the rail with the return chip is in this layout
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await app.waitFor("!document.querySelector('.wz-splash')", { timeout: 15000, label: 'splash gone' }).catch(() => {});
  await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id: ID, text: LINES, createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })}); window.wrizoFlushNow(); true`);
  await ev(CARET_HELPER);
  const misses = { soon: [], late: [] };
  let done = 0;
  for (let i = 0; i < N; i += 1) {
    const want = OFFSETS[i % OFFSETS.length];
    await ev(`location.hash = '#/page/${ID}'; true`);
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 15000, label: 'the page' });
    await sleep(700);
    await ev(CARET_HELPER);
    await ev("document.querySelector('.mode-scroll').scrollTop = 300; true");
    await sleep(150);
    // the caret is placed as a writer places it: a press first (the host notes the writer moved it), then the offset
    await ev(`document.querySelector('.forward-only-editor').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); window.__setCaretAt('.forward-only-editor', ${want}); true`);
    await sleep(150);
    const set = await ev('window.__caretNow()');
    if (set !== want) { misses.soon.push({ cycle: i, want, set, note: 'the caret was not placed before leaving' }); continue; }
    await app.click('Journal');   // she leaves by the rail, as w2.mjs does
    await app.waitFor("!!document.querySelector('.board-canvas')", { timeout: 15000, label: 'the Journal board' });
    await sleep(150);
    const chip = await ev("!!document.querySelector('.desk-rail-wayback')");
    if (!chip) { misses.soon.push({ cycle: i, want, note: 'no return chip' }); continue; }
    await ev("document.querySelector('.desk-rail-wayback').click(); true");
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 15000, label: 'the page back' });
    await ev(CARET_HELPER);   // (the helper is a window property: it survives, and this is cheap)
    await sleep(450);
    const soon = await ev('window.__caretNow()');
    await sleep(1350);
    const late = await ev('window.__caretNow()');
    const anchor = soon !== want || late !== want ? await ev('window.__anchorNow()') : null;   // where the selection actually sits when the offset read fails
    if (soon !== want) misses.soon.push({ cycle: i, want, soon, late, anchor });
    if (late !== want) misses.late.push({ cycle: i, want, soon, late, anchor });
    done += 1;
  }
  console.log(`RC cycles ${done} of ${N}; misses at 450 ms: ${misses.soon.length}; at 1,800 ms: ${misses.late.length}`);
  ok(`RC1 over ${N} cycles the caret is where she left it, at 450 ms after the return, every time (${misses.soon.length} misses)`, judge(Array.from({ length: misses.soon.length }, () => 0), 0) && misses.soon.length === 0, JSON.stringify(misses.soon.slice(0, 6)));
  ok(`RC2 and at 1,800 ms, every time (${misses.late.length} misses)`, misses.late.length === 0, JSON.stringify(misses.late.slice(0, 6)));
  ok('MUT-RC the judge goes RED on a miss', judge([40, 40, 41], 40) === false);
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); ok('HARNESS ' + String(e && e.message || e).slice(0, 300), false); }

const bad = checks.filter((c) => !c.pass).length;
console.log(bad ? `\nRETURN-CARET-LOOP VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nRETURN-CARET-LOOP VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
