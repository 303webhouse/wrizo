// ESC LEAVES THE WRITING SURFACE - accessibility audit A1 (cloud-a11y-audit @ 9c15c86): "the writing surface is a keyboard trap:
// Tab, Shift+Tab, and Esc then Tab or Shift+Tab never leave it". Tab indents by Nick's ruling, so Esc is the exit item 158 promised.
//   S1  in every mode (Free Write, Draft, Revise), a real Esc moves focus from the editor to the CURRENT mode tab
//   S2  from there the keyboard is free: Tab moves on, and focus is not dragged back into the editor
//   S3  an open popup closes FIRST: with a rail panel open, Esc closes the panel and focus stays put; the next Esc leaves
//   S4  the same for the empty page's beginnings row
//   S5  Esc does not edit the page (stored text unchanged)
// Run: node scripts/harness/escexit.mjs   (from apps/desktop, dist-web built, box turn granted)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const TEXT = 'A written line of prose.';

const freshDesk = async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
};
const openPage = async (app, id, text, mode) => {
  await freshDesk(app);
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose' })})`);
  await sleep(600);
  await app.reload();
  await app.evalJs(`location.hash = '#/page/${id}'`);
  await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'page framed' });
  await sleep(500);
  if (mode) { await app.click(mode); await sleep(800); }
};
const centre = (app, sel) => app.evalJs(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null; const r = el.getBoundingClientRect(); return r.width && r.height ? { x: Math.round(r.left + r.width/2), y: Math.round(r.top + r.height/2) } : null; })()`);
const realClick = async (app, pt) => { await app.mouseDown(pt.x, pt.y); await app.mouseUp(pt.x, pt.y); await sleep(250); };
const focusEditor = async (app) => {
  const pt = await centre(app, ED);
  if (pt) await realClick(app, { x: pt.x, y: pt.y - 10 });
  return app.evalJs(`document.querySelector('${ED}').contains(document.activeElement)`);
};
const ESC = { key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 };
const esc = async (app) => { await app.cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...ESC }); await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', ...ESC }); await sleep(300); };
const where = (app) => app.evalJs(`(() => { const a = document.activeElement; const ed = document.querySelector('${ED}');
  return { inEditor: !!ed && ed.contains(a), modeKey: a?.getAttribute?.('data-mode-key') || null, active: a?.classList?.contains('active') || false, tag: a?.tagName, text: (a?.textContent || '').trim().slice(0, 30) }; })()`);
const stored = (app, id) => app.evalJs(`(JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(x => x.id === ${JSON.stringify(id)})||{}).text ?? null`);

await withHarness(async (app) => {
  for (const [mode, key] of [['Free Write', 'freewrite'], ['Draft', 'draft'], ['Revise', 'revise']]) {
    await openPage(app, `e-${key}`, TEXT, mode);
    const inEd = await focusEditor(app);
    ok(`S1 [${mode}] (setup) focus is in the writing surface`, inEd === true);
    await esc(app);
    const w = await where(app);
    ok(`S1 [${mode}] Esc moves focus OUT of the editor to the CURRENT mode tab ("${mode}")`, !w.inEditor && w.modeKey === key && w.active === true, JSON.stringify(w));
    await app.cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 });
    await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 });
    await sleep(250);
    const w2 = await where(app);
    ok(`S2 [${mode}] ...and the keyboard is free from there: Tab moves to another control, not back into the editor`, !w2.inEditor && !(w2.modeKey === key), JSON.stringify(w2));
    ok(`S5 [${mode}] Esc did not edit the page`, (await stored(app, `e-${key}`)) === TEXT);
  }

  // S3 - an open rail panel closes first
  await openPage(app, 'e-panel', TEXT, 'Draft');
  const rail = await app.evalJs(`(() => { const it = [...document.querySelectorAll('.wz-strip-item')].find(b => /Drawers/i.test(b.textContent)) || document.querySelector('.wz-strip-item'); if (!it) return null; const r = it.getBoundingClientRect(); return { x: Math.round(r.left + r.width/2), y: Math.round(r.top + r.height/2), name: it.textContent.trim() }; })()`);
  ok('S3 (setup) a rail item is reachable by a real pointer', !!rail, JSON.stringify(rail));
  if (rail) await realClick(app, rail);
  await sleep(400);
  const panelOpen = () => app.evalJs("!!document.querySelector('.wz-cascade-panel') && document.querySelector('.wz-cascade-panel').getClientRects().length > 0");
  ok('S3 (setup) the rail panel is open', (await panelOpen()) === true);
  await focusEditor(app);
  ok('S3 (setup) the panel is still open with focus back in the editor', (await panelOpen()) === true);
  await esc(app);
  const p1 = await where(app);
  ok('S3 the first Esc CLOSES THE PANEL and focus stays where it was (in the editor)', (await panelOpen()) === false && p1.inEditor === true, JSON.stringify({ open: await panelOpen(), p1 }));
  await esc(app);
  const p2 = await where(app);
  ok('S3 the second Esc leaves the editor for the current mode tab', !p2.inEditor && p2.modeKey === 'draft', JSON.stringify(p2));

  // S4 - the empty page's beginnings row
  await openPage(app, 'e-empty', '', null);
  await sleep(400);
  const rowUp = () => app.evalJs("!!document.querySelector('.wz-beginnings') && document.querySelector('.wz-beginnings').getClientRects().length > 0");
  const hadRow = await rowUp();
  ok('S4 (setup) an empty page shows its beginnings row', hadRow === true);
  await focusEditor(app);
  await esc(app);
  const b1 = await where(app);
  ok('S4 the first Esc dismisses the beginnings row and focus stays in the editor', (await rowUp()) === false && b1.inEditor === true, JSON.stringify(b1));
  await esc(app);
  const b2 = await where(app);
  ok('S4 the second Esc leaves for the current mode tab', !b2.inEditor && !!b2.modeKey && b2.active === true, JSON.stringify(b2));
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nESCEXIT VERIFY: PASS (${checks.length} checks)` : `\nESCEXIT VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
