// RED-FIRST CHECK for #65 (ArrowUp from a paragraph's first line into a wrapped paragraph above must land on that paragraph's LAST visual line, not its first): Draft, Typewriter off.
//   A  Up from the start of a short paragraph under a wrapped one (2 and 3 repeats of a sentence): the caret lands on the last visual line of the wrapped paragraph
//   B  the column is kept: from the middle of the short paragraph, the caret's x after Up is within one letter-width-ish (24 px) of where it was
//   C  Up again goes to the line above (the one before the last): the browser takes over inside the paragraph
//   D  Shift+Up from the start of the short paragraph extends the selection onto the last visual line (focus there, anchor where it was)
//   E  control: Up into a ONE-line paragraph lands on that line (the browser already does this); and Up from the middle of a wrapped paragraph moves one line
// "The last visual line" is read from the page: the line tops of the wrapped paragraph's own rows, the last one above the short paragraph. RED on main today for A, B, C and D (the caret lands on the first line); E stays green.
// Run: node scripts/harness/writing-audit/reds-65.mjs (from apps/desktop; on Actions via writing-audit.yml, script=reds-65.mjs; strict)
import { withHarness } from '../../runtime-verify.mjs';
import { makeDriver, sleep, THEMES } from './lib/driver.mjs';

const env = process.env;
const cfg = { theme: env.WA_THEME || 'plateau', flag: env.WA_FLAG || 'off', tone: env.WA_TONE || 'light', width: Number(env.WA_W || 1366), height: Number(env.WA_H || 768), out: env.WA_OUT || null };
if (!THEMES[cfg.theme]) { console.error('WA_THEME must be plateau, flux or machina'); process.exit(2); }
const TAG = `${THEMES[cfg.theme].label}/${cfg.flag}/${cfg.tone}/${cfg.width}`;
const NL = String.fromCharCode(10);
const WORDS = 'the quick brown fox jumps over the lazy dog and keeps running through the long grass until the evening comes down';
const para = (n) => Array.from({ length: n }, () => WORDS).join(' ');
let bad = 0;

await withHarness(async (app) => {
  const d = makeDriver(app, cfg);
  console.log(`RED-65 [${TAG}] (${new Date().toISOString()})`);
  await d.boot();
  const ev = d.ev;
  // the page, as the browser draws it: the wrapped (first) row's line tops, the caret's rectangle, the selection's ends
  const read = () => ev(`(() => { const ed = document.querySelector('.forward-only-editor'); const rows = [...ed.querySelectorAll('.wz-row')]; const r0 = rows[0]; const lines = []; if (r0) { const g = document.createRange(); g.selectNodeContents(r0); for (const q of g.getClientRects()) { if (q.height <= 0) continue; const t = Math.round(q.top); if (!lines.length || Math.abs(lines[lines.length - 1] - t) > 3) lines.push(t); } }
    const s = getSelection(); const rectOf = (n, o) => { const g = document.createRange(); g.setStart(n, o); g.collapse(true); const q = [...g.getClientRects()].find((x) => x.height > 0) || g.getBoundingClientRect(); return q ? { top: Math.round(q.top), left: Math.round(q.left) } : null; };
    return { lines, focus: s.focusNode ? rectOf(s.focusNode, s.focusOffset) : null, anchor: s.anchorNode ? rectOf(s.anchorNode, s.anchorOffset) : null, collapsed: s.isCollapsed }; })()`);
  const open = async (text, at) => { await d.surface('.forward-only-editor', false); await d.openPage(text, 'drafting', { typewriter: 'off' }); await d.place(at); await sleep(300); };
  const run = async (id, name, fn) => {
    const fails = [];
    try { await fn(fails); } catch (e) { fails.push('harness: ' + String((e && e.message) || e).slice(0, 200)); }
    if (fails.length) bad++;
    console.log(`${fails.length ? 'FAIL' : 'PASS'}  ${id} ${name} [${TAG}]${fails.length ? ': ' + fails.join(' || ') : ''}`);
  };
  // the wrapped row's last line top and the one before it: the lines above the caret's own row
  const lastAbove = (m, before) => { const above = m.lines.filter((t) => t < before.focus.top - 3); return { last: above[above.length - 1], prev: above[above.length - 2], n: above.length }; };

  for (const n of [2, 3]) {
    const p = para(n);
    await run(`A${n}`, `Up from the start of a short paragraph under a ${n}-repeat wrapped one lands on its last line`, async (fails) => {
      await open(p + NL + 'Short.', p.length + 1);
      const before = await read(); const L = lastAbove(before, before);
      if (L.n < 2) { fails.push(`staging: the wrapped paragraph has ${L.n} line(s), want 2 or more`); return; }
      await d.key('ArrowUp'); await sleep(350);
      const after = await read();
      if (!after.focus || after.focus.top !== L.last) fails.push(`the caret landed at top ${after.focus && after.focus.top}, the last line is at ${L.last} (the first is at ${before.lines[0]})`);
    });
  }
  const p3 = para(3);
  await run('B', 'the column is kept by Up into the wrapped paragraph', async (fails) => {
    await open(p3 + NL + 'Short paragraph here.', p3.length + 1 + 8); await sleep(200);
    const before = await read(); const L = lastAbove(before, before);
    await d.key('ArrowUp'); await sleep(350);
    const after = await read();
    if (!after.focus || after.focus.top !== L.last) fails.push(`the caret landed at top ${after.focus && after.focus.top}, want the last line ${L.last}`);
    else if (Math.abs(after.focus.left - before.focus.left) > 24) fails.push(`the column moved from x ${before.focus.left} to ${after.focus.left}`);
  });
  await run('C', 'a second Up goes to the line before the last', async (fails) => {
    await open(p3 + NL + 'Short.', p3.length + 1);
    const before = await read(); const L = lastAbove(before, before);
    await d.key('ArrowUp'); await sleep(250); await d.key('ArrowUp'); await sleep(350);
    const after = await read();
    if (!after.focus || after.focus.top !== L.prev) fails.push(`after two Ups the caret is at top ${after.focus && after.focus.top}, want ${L.prev}`);
  });
  await run('D', 'Shift+Up extends the selection onto the last line', async (fails) => {
    await open(p3 + NL + 'Short.', p3.length + 1);
    const before = await read(); const L = lastAbove(before, before);
    await d.key('ArrowUp', { shift: true }); await sleep(350);
    const after = await read();
    if (after.collapsed) fails.push('the selection did not extend');
    if (!after.focus || after.focus.top !== L.last) fails.push(`the selection's focus is at top ${after.focus && after.focus.top}, want the last line ${L.last}`);
    if (!after.anchor || after.anchor.top !== before.focus.top) fails.push('the selection anchor moved');
  });
  await run('E', 'controls: Up into a one-line paragraph, and Up inside a wrapped paragraph', async (fails) => {
    await open('One' + NL + 'Two', 'One'.length + 1);
    let m = await read(); const top1 = m.lines[0];
    await d.key('ArrowUp'); await sleep(300); m = await read();
    if (!m.focus || m.focus.top !== top1) fails.push(`Up into a one-line paragraph landed at ${m.focus && m.focus.top}, want ${top1}`);
    await open(p3, p3.length); await sleep(200);
    const b = await read(); await d.key('ArrowUp'); await sleep(300); const a = await read();
    const idx = b.lines.indexOf(b.focus.top);
    if (!a.focus || a.focus.top !== b.lines[idx - 1]) fails.push(`Up inside the wrapped paragraph moved to ${a.focus && a.focus.top}, want ${b.lines[idx - 1]}`);
  });
});
console.log(`RED-65 [${TAG}] ${bad ? `FAIL - ${bad} case(s)` : 'PASS'}`);
process.exit(bad ? 1 : 0);
