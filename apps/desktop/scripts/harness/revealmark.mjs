// THE INTERIM REVEAL RULE, on Nick's own page (2026-09-25: "The title bar is still showing the asterisks, and the asterisks on the
// page return with right-clicking or other kinds of clicking around on the page". His screenshot: Draft, "**TESTING** THE
// *DATABASE* SYNC", the ** showing around TESTING with the caret inside it).
// Fable's ruling (2026-10-01), display only: a run's markers show only while the caret TOUCHES a marker (inside or at either edge of
// the opening or closing marker's own span). Item 211 (never show) replaces this after Nick's trip.
//   N1  a real click in the middle of TESTING shows no asterisks, anywhere on the page
//   N2  a real RIGHT-click there shows none either
//   N3  clicking around (the other styled word, plain text, the page's blank area) shows none
//   N4  a caret at a styled word's EDGE still shows that word's markers (what Backspace/Delete would remove), and only that word's
//       (PARKED 2026-10-02: item 211 shows no markers at the edge either; see N4 below)
//   N5  Revise behaves the same; Free Write never shows a marker
//   N6  display only: typing in the middle of the styled word lands in the stored text exactly, markers intact
// Run: node scripts/harness/revealmark.mjs   (from apps/desktop, dist-web built, box turn granted)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const TEXT = '**TESTING** THE *DATABASE* SYNC\nA plain second line.';

const freshDesk = async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
};
const openPage = async (app, id, mode) => {
  await freshDesk(app);
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: TEXT, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose' })})`);
  await sleep(600);
  await app.reload();
  await app.evalJs(`location.hash = '#/page/${id}'`);
  await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'page framed' });
  await sleep(500);
  await app.click(mode); await sleep(800);
};
// the on-screen middle of the text `needle` inside the editor
const midOf = (app, needle) => app.evalJs(`(() => {
  const ed = document.querySelector('${ED}'); const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) { const i = n.data.indexOf(${JSON.stringify(needle)}); if (i < 0) continue;
    const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + ${JSON.stringify(needle)}.length); const b = r.getBoundingClientRect();
    return { x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2) }; }
  return null; })()`);
const click = async (app, pt, button = 'left') => {
  const o = { x: pt.x, y: pt.y, button, buttons: button === 'left' ? 1 : 2, clickCount: 1, pointerType: 'mouse' };
  await app.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', ...o });
  await app.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', ...o, buttons: 0 });
  await sleep(350);
};
const state = (app) => app.evalJs(`(() => {
  const ed = document.querySelector('${ED}'); const s = getSelection();
  let off = null;
  if (s.rangeCount && ed.contains(s.anchorNode)) { const r = document.createRange(); r.selectNodeContents(ed); r.setEnd(s.getRangeAt(0).startContainer, s.getRangeAt(0).startOffset); off = r.toString().length; }
  const shown = [...ed.querySelectorAll('.md-mark')].filter(m => !m.classList.contains('md-mark-hidden') && /^[*_~]+$/.test(m.textContent)).map(m => m.textContent);
  return { off, shown, text: ed.textContent };
})()`);
const stored = (app, id) => app.evalJs(`(JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(x => x.id === ${JSON.stringify(id)})||{}).text ?? null`);
const settled = async (app, id) => { await sleep(2200); let last = await stored(app, id); let same = 0; for (let i = 0; i < 30 && same < 6; i += 1) { await sleep(150); const n = await stored(app, id); same = n === last ? same + 1 : 0; last = n; } return last; };
const ESC = { key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 };

await withHarness(async (app) => {
  for (const mode of ['Draft', 'Revise']) {
    await openPage(app, `rm-${mode}`, mode);
    const testing = await midOf(app, 'TESTING');
    ok(`[${mode}] (setup) the word TESTING is on screen, rendered bold`, !!testing && (await app.evalJs(`!!document.querySelector('${ED} .md-bold')`)), JSON.stringify(testing));
    if (!testing) continue;

    await click(app, testing);
    const n1 = await state(app);
    ok(`N1 [${mode}] THE SCREENSHOT: a real click in the middle of TESTING shows NO asterisks anywhere (caret inside the word, off=${n1.off})`, n1.shown.length === 0 && n1.off !== null && n1.off > 2 && n1.off < 9, JSON.stringify(n1));

    await click(app, testing, 'right');
    const n2 = await state(app);
    ok(`N2 [${mode}] a real RIGHT-click in the middle of TESTING shows none either`, n2.shown.length === 0, JSON.stringify(n2));
    await app.cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...ESC }); await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', ...ESC });   // close any menu the right-click opened
    await sleep(300);

    const around = [];
    for (const needle of ['DATABASE', 'THE', 'SYNC', 'plain second', 'TESTING']) {
      const pt = await midOf(app, needle);
      if (!pt) { around.push({ needle, missing: true }); continue; }
      await click(app, pt);
      const st = await state(app);
      around.push({ needle, shown: st.shown, off: st.off });
    }
    ok(`N3 [${mode}] clicking around - the italic word, plain words, the next line, back into TESTING - shows no asterisks at any stop`, around.every((a) => !a.missing && a.shown.length === 0), JSON.stringify(around));

    // N4 - the edge: Home puts the caret before the opening `**` (off 0, touching it)
    await click(app, testing);
    await app.key('Home'); await sleep(350);
    const e0 = await state(app);
    // ---- PARKED - SUPERSEDED by item 211 (e79390c: marks never show), 2026-10-02 ----
    // Kept VERBATIM and no longer run. The interim rule showed a run's markers at its edge; item 211 replaces that rule, as this file's header foretold.
    //
    // ok(`N4 [${mode}] a caret at the styled word's leading EDGE shows that word's own markers (what Delete would remove) and ONLY that word's - the italic word stays clean`, e0.off === 0 && JSON.stringify(e0.shown) === JSON.stringify(['**', '**']), JSON.stringify(e0));
    // ----------------------------------------------------------------------
    ok(`N4 ITEM 211 [${mode}] a caret at the styled word's leading EDGE (line start) shows no markers either - marks never show`, e0.off === 0 && e0.shown.length === 0, JSON.stringify(e0));
    const pt2 = await midOf(app, 'THE');
    if (pt2) await click(app, pt2);
    const e1 = await state(app);
    ok(`N4 [${mode}] ...and moving away collapses them again`, e1.shown.length === 0, JSON.stringify(e1));
    ok(`[${mode}] the page's text is untouched by all of it (every character still in the editor, markers included)`, e1.text === TEXT && (await stored(app, `rm-${mode}`)) === TEXT, JSON.stringify(e1.text));
  }

  // N5 - Free Write never shows a marker, wherever the writer clicks
  await openPage(app, 'rm-fw', 'Free Write');
  const fwShown = [];
  for (const needle of ['TESTING', 'DATABASE', 'plain second']) { const pt = await midOf(app, needle); if (pt) { await click(app, pt); fwShown.push((await state(app)).shown.length); } }
  ok('N5 [Free Write] no click shows a marker (the forward-only surface decorates with no caret)', fwShown.length === 3 && fwShown.every((n) => n === 0), JSON.stringify(fwShown));

  // N6 - display only: typing mid-word is stored exactly
  await openPage(app, 'rm-type', 'Draft');
  const t = await midOf(app, 'TESTING');
  if (t) await click(app, t);
  const before = await state(app);
  await app.typeKeys('x');
  await sleep(300);
  const after = await state(app);
  const st = await settled(app, 'rm-type');
  const want = before.off !== null ? TEXT.slice(0, before.off) + 'x' + TEXT.slice(before.off) : null;
  ok('N6 DISPLAY ONLY: a letter typed in the middle of the styled word lands exactly at the caret in the STORED text, both markers intact, and still shows no asterisks', st === want && after.shown.length === 0 && /^\*\*TES?T?I?N?G?/.test(st || '') && (st || '').includes('** THE'), JSON.stringify({ off: before.off, stored: st, shown: after.shown }));
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nREVEALMARK VERIFY: PASS (${checks.length} checks)` : `\nREVEALMARK VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
