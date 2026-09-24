// WRITING-SURFACE S0 STEP 2 (Nick, 2026-09-24): the toggles, select-all-then-Bold, and Ctrl+B/I/U - in the browser, with real
// keys and real pointer presses. The formatter's own rules are pinned browserlessly by scripts/writing-format-proof.mjs
// (40 checks, 7 mutants); this file proves the DOOR: that the keyboard and the toolbar reach that formatter on the live page,
// that the page then RENDERS the result, and that the surfaces which have no styling tools are left alone.
// Run: node scripts/harness/writing-r2.mjs   (from apps/desktop, dist-web built, box turn granted)
//
// Evidence that this fails on the old code: docs/evidence/writing-s0/frames.json - Ctrl+B/I/U left stored text and DOM
// unchanged in every mode; select-all then Bold stored one pair across the newline and Draft rendered no bold at all.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SHORT = 'Plain words here\nSecond line here';
const ED = '.forward-only-editor';

const freshDesk = async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
};
const openPage = async (app, mode, text = SHORT) => {
  await freshDesk(app);
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'r2', text, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose' })})`);
  await app.reload();
  await app.evalJs("location.hash = '#/page/r2'");
  await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'page framed' });
  await sleep(500);
  await app.click(mode); await sleep(800);
};
const centre = (app, sel) => app.evalJs(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null; const r = el.getBoundingClientRect(); return r.width && r.height ? { x: Math.round(r.left + r.width/2), y: Math.round(r.top + r.height/2) } : null; })()`);
const realClick = async (app, pt) => { await app.mouseDown(pt.x, pt.y); await app.mouseUp(pt.x, pt.y); await sleep(250); };
const stored = (app) => app.evalJs("(JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(x => x.id === 'r2')||{}).text ?? null");
const settled = async (app, read) => { await sleep(2200); let last = await read(); let same = 0; for (let i = 0; i < 40 && same < 8; i += 1) { await sleep(150); const n = await read(); same = n === last ? same + 1 : 0; last = n; } return last; };
const dom = (app) => app.evalJs(`(() => {
  const ed = document.querySelector('${ED}'); if (!ed) return null;
  return { text: ed.textContent, bold: ed.querySelectorAll('.md-bold').length, italic: ed.querySelectorAll('.md-italic').length,
    underline: ed.querySelectorAll('.md-underline').length, native: ed.querySelectorAll('b, strong, i, em, u').length,
    visibleMarks: [...ed.querySelectorAll('.md-mark')].filter(m => !m.classList.contains('md-mark-hidden')).length };
})()`);
const focusAndSelectAll = async (app) => {
  const pt = await centre(app, ED);
  if (pt) await realClick(app, { x: pt.x, y: pt.y - 20 });
  await app.keyCombo('a'); await sleep(200);
};

await withHarness(async (app) => {
  // ---- DRAFT: the keyboard ----
  await openPage(app, 'Draft');
  await focusAndSelectAll(app);
  await app.keyCombo('b'); await sleep(300);
  let d = await dom(app);
  ok('[Draft] select-all then Ctrl+B RENDERS bold on both lines (two bold runs, no marker left visible, no native <b>)',
    d && d.bold === 2 && d.visibleMarks === 0 && d.native === 0, JSON.stringify(d));
  let st = await settled(app, () => stored(app));
  ok('[Draft] ...and stores one pair PER LINE, never one pair across the newline', st === '**Plain words here**\n**Second line here**', JSON.stringify(st));
  await app.keyCombo('b'); await sleep(300);
  st = await settled(app, () => stored(app)); d = await dom(app);
  ok('[Draft] Ctrl+B again TOGGLES it back to the original text (was `****x****`)', st === SHORT && d.bold === 0, JSON.stringify({ st, bold: d.bold }));
  await app.keyCombo('i'); await sleep(300);
  d = await dom(app); st = await settled(app, () => stored(app));
  ok('[Draft] Ctrl+I renders italic on both lines and stores a pair per line', d.italic === 2 && st === '*Plain words here*\n*Second line here*', JSON.stringify({ st, italic: d.italic }));
  await app.keyCombo('u'); await sleep(300);
  st = await settled(app, () => stored(app));
  // STORAGE only: rendering one mark NESTED in another is step 3's (the decorator does not nest yet), stated here so a red there is not a surprise
  ok('[Draft] Ctrl+U on top stacks underline OUTSIDE the italic on both lines (stored; its rendering is step 3)', st === '__*Plain words here*__\n__*Second line here*__', JSON.stringify(st));

  // ---- DRAFT: the toolbar reaches the same formatter, and toggles ----
  await openPage(app, 'Draft');
  await focusAndSelectAll(app);
  const grip = await centre(app, '.wz-sliver-grip'); if (grip) await realClick(app, grip);
  const bold = await app.evalJs(`(() => { const b = [...document.querySelectorAll('.wz-sliver [title]')].find(x => x.getAttribute('title') === 'Bold'); if (!b) return null; const r = b.getBoundingClientRect(); return r.width ? { x: Math.round(r.left + r.width/2), y: Math.round(r.top + r.height/2) } : null; })()`);
  ok('[Draft] the toolbar Bold button is reachable by a real pointer', !!bold, JSON.stringify(bold));
  if (bold) {
    await realClick(app, bold);
    st = await settled(app, () => stored(app));
    ok('[Draft] the toolbar Bold button stores exactly what Ctrl+B stores (the same formatter)', st === '**Plain words here**\n**Second line here**', JSON.stringify(st));
    await realClick(app, bold);
    st = await settled(app, () => stored(app));
    ok('[Draft] the toolbar Bold button toggles too', st === SHORT, JSON.stringify(st));
  }

  // ---- FREE WRITE and REVISE: no styling tools by ruling, so the keys are left alone ----
  for (const mode of ['Free Write', 'Revise']) {
    await openPage(app, mode);
    await focusAndSelectAll(app);
    await app.keyCombo('b'); await sleep(300);
    d = await dom(app); st = await settled(app, () => stored(app));
    ok(`[${mode}] Ctrl+B does NOT style (no tools here by ruling): stored text unchanged, nothing bold rendered`, st === SHORT && d.bold === 0, JSON.stringify({ st, bold: d.bold, native: d.native }));
  }

  // ---- THE CARD: same keys, same formatter as its dock ----
  await freshDesk(app);
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'r2b', text: 'Board', pageType: 'board', createdAt: '2026-04-01T00:00:00.000Z', origin: null,
    boxes: [{ id: 'r2-card', kind: 'text', x: 0.05, y: 0.05, w: 0.3, h: 0.1, z: 1, text: 'Card words here' }] })})`);
  await app.reload();
  await app.evalJs("location.hash = '#/page/r2b'");
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'board framed' });
  await sleep(700);
  await app.evalJs('(() => { const el = document.querySelector(\'[data-box-id="r2-card"]\'); const r = el.getBoundingClientRect(); el.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 })); })()');
  const popup = await app.waitFor("!!document.querySelector('.board-popup-editor')", { label: 'popup open' }).then(() => true, () => false);
  ok('[Card] the popup opens (setup)', popup);
  if (popup) {
    const pt = await centre(app, '.board-popup-editor'); if (pt) await realClick(app, pt);
    await app.keyCombo('a'); await sleep(150);
    await app.keyCombo('b'); await sleep(300);
    const cd = await app.evalJs("(() => { const e = document.querySelector('.board-popup-editor'); return { text: e.textContent, bold: e.querySelectorAll('.md-bold').length, native: e.querySelectorAll('b,strong').length }; })()");
    ok('[Card] Ctrl+B on a card bolds it through the card\'s own formatter (rendered, no native <b>, markers stored)', cd.bold === 1 && cd.native === 0 && cd.text === '**Card words here**', JSON.stringify(cd));
    await app.keyCombo('b'); await sleep(300);
    const cd2 = await app.evalJs("document.querySelector('.board-popup-editor').textContent");
    ok('[Card] Ctrl+B again toggles it back', cd2 === 'Card words here', JSON.stringify(cd2));
  }
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(`\n${passed}/${checks.length} checks passed`);
process.exit(passed === checks.length ? 0 : 1);
