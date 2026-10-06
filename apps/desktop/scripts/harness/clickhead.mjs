// NICK'S TWO LIVE BUGS (2026-10-06), in the browser with real pointer events and real keys.
//   THE CLICK  "I can't click on the line next to 'BOLD' to move my cursor there ... It seems to just activate the strip menu."
//              A click past a styled word lands AFTER its hidden closing marks, and the strip lights nothing.
//   HEADINGS   "the heading icon is not highlighted ... if a user hits the 'H' icon, all heading modifications should be undone.
//              Also, headings should not default to ALL CAPS."  Ruled: six levels (# to ######, HTML h1-h6); H toggles (adds ##,
//              removes any level) and lights on a heading line; + toward h1 and - toward h6 in the strip; a small floating +/- beside a
//              SELECTED heading that covers no word and moves nothing; no text-transform on any heading.
// Run: node scripts/harness/clickhead.mjs   (from apps/desktop, dist-web built, box turn granted)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const TEXT = '**BOLD** *TEST* ~~FINAL~~ (hopefully)\nplain words then **BOLD**\nA third line.';

const freshDesk = async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
};
const openDraft = async (app, id, text) => {
  await freshDesk(app);
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose' })})`);
  await sleep(600);
  await app.reload();
  await app.evalJs(`location.hash = '#/page/${id}'`);
  await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'page framed' });
  await sleep(500);
  await app.click('Draft'); await sleep(900);
  // the Draft rail must be open for its buttons to be read (it opens closed); a real press on its grip
  const grip = await app.evalJs("(() => { const s = document.querySelector('.wz-sliver'); if (!s || s.dataset.open === 'true') return null; const g = document.querySelector('.wz-sliver-grip'); if (!g) return null; const r = g.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()");
  if (grip) { await app.mouseDown(grip.x, grip.y); await app.mouseUp(grip.x, grip.y); await sleep(400); }
};
const click = async (app, pt) => { await app.mouseDown(pt.x, pt.y); await app.mouseUp(pt.x, pt.y); await sleep(450); };
// the right end of line `n` (0-based) of the editor's text, as a screen point a little past it
const pastLineEnd = (app, n) => app.evalJs(`(() => {
  const ed = document.querySelector('${ED}'); const text = ed.textContent; const lines = text.split('\\n');
  let s = 0; for (let i = 0; i < ${n}; i++) s += lines[i].length + 1;
  const e = s + lines[${n}].length;
  const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let node, acc = 0, sN = null, sO = 0, eN = null, eO = 0;
  while ((node = w.nextNode())) { const L = node.data.length; if (!sN && acc + L > s) { sN = node; sO = s - acc; } if (!eN && acc + L >= e) { eN = node; eO = e - acc; } acc += L; }
  const r = document.createRange(); r.setStart(sN, sO); r.setEnd(eN, eO);
  const rects = [...r.getClientRects()].filter(x => x.width > 0); const last = rects[rects.length - 1];
  const col = ed.getBoundingClientRect();
  return { x: Math.round(Math.min(last.right + 40, col.right - 6)), y: Math.round(last.top + last.height / 2), lineEnd: e };
})()`);
const state = (app) => app.evalJs(`(() => {
  const ed = document.querySelector('${ED}'); const s = getSelection(); let off = null;
  if (s.rangeCount && ed.contains(s.anchorNode)) { const r = document.createRange(); r.selectNodeContents(ed); r.setEnd(s.getRangeAt(0).startContainer, s.getRangeAt(0).startOffset); off = r.toString().length; }
  const lit = [...document.querySelectorAll('.wz-sliver .mode-tbtn[aria-pressed="true"]')].map(b => b.getAttribute('title'));
  return { off, lit };
})()`);
const stored = (app, id) => app.evalJs(`(JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(x => x.id === ${JSON.stringify(id)})||{}).text ?? null`);
const settled = async (app, id) => { await sleep(2200); let last = await stored(app, id); let same = 0; for (let i = 0; i < 30 && same < 6; i += 1) { await sleep(150); const n = await stored(app, id); same = n === last ? same + 1 : 0; last = n; } return last; };
const btn = (app, title) => app.evalJs(`(() => { const b = [...document.querySelectorAll('.wz-sliver .mode-tbtn')].find(x => x.getAttribute('title') === ${JSON.stringify(title)}); if (!b) return null; const r = b.getBoundingClientRect(); return r.width ? { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), on: b.getAttribute('aria-pressed') } : null; })()`);
const placeCaret = (app, off) => app.evalJs(`(() => { const ed = document.querySelector('${ED}'); ed.focus(); const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n, acc = 0;
  while ((n = w.nextNode())) { if (acc + n.data.length >= ${off}) { const r = document.createRange(); r.setStart(n, ${off} - acc); r.collapse(true); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; } acc += n.data.length; } return false; })()`);

await withHarness(async (app) => {
  // ======================== THE CLICK ========================
  await openDraft(app, 'ck', TEXT);
  const p2 = await pastLineEnd(app, 1);   // "plain words then **BOLD**" - ends in a bold word
  await click(app, p2);
  const s2 = await state(app);
  ok('CLICK: a real click past the end of a line that ENDS in a bold word puts the caret at the line\'s END (after the hidden closing marks), not inside the word', s2.off === p2.lineEnd, JSON.stringify({ ...s2, lineEnd: p2.lineEnd }));
  ok('CLICK: ...and the strip lights NOTHING (no "B" active)', s2.lit.length === 0, JSON.stringify(s2.lit));
  await app.typeKeys('x');
  const t2 = await settled(app, 'ck');
  ok('CLICK: a letter typed there lands AFTER the bold word, plain - where the writer clicked', typeof t2 === 'string' && t2.split('\n')[1] === 'plain words then **BOLD**x', JSON.stringify(t2 && t2.split('\n')[1]));

  await openDraft(app, 'ck1', TEXT);
  const p1 = await pastLineEnd(app, 0);   // Nick's own line
  await click(app, p1);
  const s1 = await state(app);
  ok('CLICK (his line): a click past the end of "**BOLD** *TEST* ~~FINAL~~ (hopefully)" lands at the line\'s end and lights nothing', s1.off === p1.lineEnd && s1.lit.length === 0, JSON.stringify({ ...s1, lineEnd: p1.lineEnd }));
  const afterBold = await app.evalJs(`(() => { const b = document.querySelector('${ED} .md-bold'); const r = b.getBoundingClientRect(); return { x: Math.round(r.right + 2), y: Math.round(r.top + r.height / 2) }; })()`);
  await click(app, afterBold);
  const s3 = await state(app);
  ok('CLICK (his line): a click just to the RIGHT of "BOLD" lights nothing, and the caret sits after the hidden marks (offset 8 or 9)', s3.lit.length === 0 && (s3.off === 8 || s3.off === 9), JSON.stringify(s3));
  const inBold = await app.evalJs(`(() => { const w = document.createTreeWalker(document.querySelector('${ED} .md-bold'), NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { if (n.data === 'BOLD') { const r = document.createRange(); r.setStart(n, 2); r.setEnd(n, 2); const b = r.getBoundingClientRect(); return { x: Math.round(b.left), y: Math.round(b.top + b.height / 2) }; } } return null; })()`);
  if (inBold) await click(app, inBold);
  const s4 = await state(app);
  ok('CLICK (control): a click INSIDE "BOLD" does light B - the strip still tells the truth about the writer\'s place', s4.lit.includes('Bold (Ctrl+B)'), JSON.stringify(s4));

  // ======================== HEADINGS ========================
  await openDraft(app, 'hd', 'A title line\nBody text under it.');
  await placeCaret(app, 3); await sleep(400);
  let h = await btn(app, 'Heading');
  ok('H (setup): the Heading button is on the rail, and NOT lit on a plain line', !!h && h.on === 'false', JSON.stringify(h));
  ok('H: + and - are not offered on a plain line', !(await btn(app, 'Larger heading')) && !(await btn(app, 'Smaller heading')));
  if (h) await click(app, h);
  let t = await settled(app, 'hd');
  ok('H: one press makes the caret\'s line a Heading 2 (`## `), the web editors\' default', t === '## A title line\nBody text under it.', JSON.stringify(t));
  await placeCaret(app, 6); await sleep(400);
  h = await btn(app, 'Heading');
  ok('H: the Heading button is LIT on a heading line', !!h && h.on === 'true', JSON.stringify(h));
  const up = await btn(app, 'Larger heading');
  const down = await btn(app, 'Smaller heading');
  ok('+/-: on a heading line the strip offers + (Larger) and - (Smaller) beside H', !!up && !!down, JSON.stringify({ up, down }));
  if (up) { await click(app, up); await placeCaret(app, 5); await sleep(300); const u2 = await btn(app, 'Larger heading'); if (u2) await click(app, u2); }
  t = await settled(app, 'hd');
  ok('+: two presses step toward h1 and stop there - `## ` -> `# ` -> `# ` (clamped)', t === '# A title line\nBody text under it.', JSON.stringify(t));
  for (let i = 0; i < 7; i += 1) { await placeCaret(app, 4); await sleep(250); const d = await btn(app, 'Smaller heading'); if (d) await click(app, d); }
  t = await settled(app, 'hd');
  ok('-: presses step toward h6 and stop there - six hashes, never seven', t === '###### A title line\nBody text under it.', JSON.stringify(t));
  const sizes = await app.evalJs(`(() => { const s = (sel) => { const e = document.querySelector('${ED} ' + sel); return e ? parseFloat(getComputedStyle(e).fontSize) : null; }; const body = parseFloat(getComputedStyle(document.querySelector('${ED}')).fontSize); const h = document.querySelector('${ED} .md-h6'); return { h6: s('.md-h6'), body, transform: h ? getComputedStyle(h).textTransform : null }; })()`);
  ok('LOOK: an h6 renders just above body size, and no heading is forced into capitals (text-transform: none)', !!sizes.h6 && sizes.h6 > sizes.body && sizes.h6 < sizes.body * 1.1 && sizes.transform === 'none', JSON.stringify(sizes));
  await placeCaret(app, 9); await sleep(300);
  h = await btn(app, 'Heading');
  if (h) await click(app, h);
  t = await settled(app, 'hd');
  ok('H on a heading UNDOES it whole - all six levels removed in one press ("all heading modifications should be undone")', t === 'A title line\nBody text under it.', JSON.stringify(t));

  // the floating +/- beside a SELECTED heading
  await openDraft(app, 'hp', '## A heading to select\nBody text under it, long enough to sit below the heading line.');
  await app.evalJs(`(() => { const ed = document.querySelector('${ED}'); ed.focus(); const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n, acc = 0, sN, sO, eN, eO;
    while ((n = w.nextNode())) { const L = n.data.length; if (!sN && acc + L > 5) { sN = n; sO = 5 - acc; } if (!eN && acc + L >= 12) { eN = n; eO = 12 - acc; } acc += L; }
    const r = document.createRange(); r.setStart(sN, sO); r.setEnd(eN, eO); const s = getSelection(); s.removeAllRanges(); s.addRange(r); })()`);
  await sleep(500);
  const pop = await app.evalJs(`(() => {
    const p = document.querySelector('.wz-heading-pop'); if (!p) return null;
    const pr = p.getBoundingClientRect(); const ed = document.querySelector('${ED}');
    // does the pop's box overlap any glyph of the page's text?
    const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n, hit = false;
    while ((n = w.nextNode())) { const r = document.createRange(); r.selectNodeContents(n); for (const g of r.getClientRects()) { if (g.width && g.right > pr.left && g.left < pr.right && g.bottom > pr.top && g.top < pr.bottom) hit = true; } }
    return { x: Math.round(pr.left), y: Math.round(pr.top), w: Math.round(pr.width), coversText: hit, buttons: [...p.querySelectorAll('button')].map(b => b.getAttribute('aria-label')) };
  })()`);
  ok('POP: selecting part of a heading shows a small floating -/+ beside it', !!pop && JSON.stringify(pop.buttons) === JSON.stringify(['Smaller heading', 'Larger heading']), JSON.stringify(pop));
  ok('POP: it covers no word on the page', !!pop && pop.coversText === false, JSON.stringify(pop));
  const pageBefore = await app.evalJs("(() => { const r = document.querySelector('.mode-page, .forward-only-editor').getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round).join(','); })()");
  const popUp = await app.evalJs("(() => { const b = document.querySelector('.wz-heading-pop [aria-label=\"Larger heading\"]'); if (!b) return null; const r = b.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()");
  if (popUp) await click(app, popUp);
  t = await settled(app, 'hp');
  const pageAfter = await app.evalJs("(() => { const r = document.querySelector('.mode-page, .forward-only-editor').getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round).join(','); })()");
  ok('POP: its + steps the heading toward h1 (`## ` -> `# `), through the same formatter as the strip', typeof t === 'string' && t.startsWith('# A heading to select'), JSON.stringify(t && t.split('\n')[0]));
  ok('POP: the page did not move (PAGE IS PRIMARY: the pop is an overlay)', pageBefore === pageAfter, JSON.stringify({ pageBefore, pageAfter }));
  await placeCaret(app, 3); await sleep(400);
  ok('POP: a collapsed caret (nothing selected) shows no pop', !(await app.evalJs("!!document.querySelector('.wz-heading-pop')")));
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nCLICKHEAD VERIFY: PASS (${checks.length} checks)` : `\nCLICKHEAD VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
