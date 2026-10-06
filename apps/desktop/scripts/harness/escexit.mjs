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
// THE 60 ms ASSUMPTION (store/escapeExit.ts POPUP_SETTLE_MS): timed in the page itself - from the Esc keydown (capture phase, before
// anyone handles it) to the moment the popup's node stops being rendered (a MutationObserver, so no polling granularity).
const SETTLE_MS = 60;
const armCloseTimer = (app, sel) => app.evalJs(`(() => {
  const st = window.__escT = { t0: null, t1: null };
  const gone = () => { const n = document.querySelector(${JSON.stringify(sel)}); return !n || n.getClientRects().length === 0; };
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && st.t0 === null) st.t0 = performance.now(); }, { capture: true, once: true });
  const mo = new MutationObserver(() => { if (st.t0 !== null && st.t1 === null && gone()) { st.t1 = performance.now(); mo.disconnect(); } });
  mo.observe(document.body, { childList: true, subtree: true, attributes: true });
  return true;
})()`);
const closeTime = (app) => app.evalJs('(() => { const s = window.__escT; return s && s.t0 !== null && s.t1 !== null ? Math.round((s.t1 - s.t0) * 10) / 10 : null; })()');
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
  await armCloseTimer(app, '.wz-cascade-panel');
  await esc(app);
  const tPanel = await closeTime(app);
  ok(`S3 THE ASSUMPTION, MEASURED: the rail panel is gone ${SETTLE_MS} ms after the Esc keydown - the window escapeExit.ts waits before deciding the key was the popup's`, tPanel !== null && tPanel >= 0 && tPanel < SETTLE_MS, JSON.stringify({ msToClose: tPanel, window: SETTLE_MS }));
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
  await armCloseTimer(app, '.wz-beginnings');
  await esc(app);
  const tRow = await closeTime(app);
  ok(`S4 THE ASSUMPTION, MEASURED: the beginnings row is gone inside the same ${SETTLE_MS} ms window`, tRow !== null && tRow >= 0 && tRow < SETTLE_MS, JSON.stringify({ msToClose: tRow, window: SETTLE_MS }));
  const b1 = await where(app);
  ok('S4 the first Esc dismisses the beginnings row and focus stays in the editor', (await rowUp()) === false && b1.inEditor === true, JSON.stringify(b1));
  await esc(app);
  const b2 = await where(app);
  ok('S4 the second Esc leaves for the current mode tab', !b2.inEditor && !!b2.modeKey && b2.active === true, JSON.stringify(b2));

  // S6 - the hint: said to a screen reader, never drawn, and it moves nothing
  await openPage(app, 'e-hint', TEXT, 'Draft');
  const hint = await app.evalJs(`(() => {
    const ed = document.querySelector('${ED}'); const id = ed.getAttribute('aria-describedby'); const h = id ? document.getElementById(id) : null;
    if (!h) return { id, missing: true };
    const r = h.getBoundingClientRect(); const cs = getComputedStyle(h);
    return { id, text: h.textContent, w: r.width, h: r.height, position: cs.position, clip: cs.clipPath, ariaHidden: h.closest('[aria-hidden="true"]') !== null, count: document.querySelectorAll('#' + id).length };
  })()`);
  ok('S6 the writing surface is DESCRIBED BY a hint that reads "Press Escape to leave the page" (one element, in the accessibility tree)', !hint.missing && hint.text === 'Press Escape to leave the page' && hint.count === 1 && hint.ariaHidden === false, JSON.stringify(hint));
  ok('S6 the hint is never drawn and is out of flow (1px, clipped, absolute) - it cannot move or resize the page', !hint.missing && hint.w <= 1 && hint.h <= 1 && hint.position === 'absolute', JSON.stringify(hint));

  // S7 - Free Write on a WRITTEN line: Tab stays captured (ruled: Tab means one thing on the page; Esc is the exit)
  await openPage(app, 'e-fw', TEXT, 'Free Write');
  await focusEditor(app);
  await app.cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 });
  await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 });
  await sleep(300);
  const fw = await where(app);
  ok('S7 [Free Write, a written line] Tab does NOT move focus (the audit\'s suggestion is declined by ruling) - and Esc is still the way out', fw.inEditor === true, JSON.stringify(fw));
  await esc(app);
  const fw2 = await where(app);
  ok('S7 ...Esc leaves from there', !fw2.inEditor && fw2.modeKey === 'freewrite', JSON.stringify(fw2));

  // S8 - the screenplay surface takes Tab too, so it gets the same exit (through the real wizard, as sc1.mjs does)
  await freshDesk(app);
  await app.goto('/project/new');
  const picker = await app.waitFor('!!document.querySelector(\'[data-kind="screenplay"]\')', { label: 'CreateProject picker' }).then(() => true, () => false);
  ok('S8 (setup) the screenplay door is reachable', picker);
  if (picker) {
    await app.evalJs('document.querySelector(\'[data-kind="screenplay"]\').click()');
    await app.click('Start writing');
    const up = await app.waitFor("!!document.querySelector('.script-el-active')", { label: 'screenplay surface' }).then(() => true, () => false);
    ok('S8 (setup) the screenplay surface is up', up);
    if (up) {
      await sleep(400);
      const spt = await centre(app, '.script-el-active');
      if (spt) await realClick(app, spt);
      const inScript = () => app.evalJs("(() => { const a = document.activeElement; return { inScript: !!a && !!a.closest && !!a.closest('.script-el-active'), modeKey: a?.getAttribute?.('data-mode-key') || null, active: a?.classList?.contains('active') || false, described: document.querySelector('.script-el-active')?.getAttribute('aria-describedby') || null, hint: document.getElementById('wz-esc-hint')?.textContent || null }; })()");
      const s0 = await inScript();
      ok('S8 (setup) focus is in the active script element, and it carries the same hint', s0.inScript === true && s0.hint === 'Press Escape to leave the page' && s0.described === 'wz-esc-hint', JSON.stringify(s0));
      await app.cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 });
      await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 });
      await sleep(300);
      const s1 = await inScript();
      ok('S8 the premise: Tab is captured on the screenplay (focus stays in the script)', s1.inScript === true, JSON.stringify(s1));
      await esc(app);
      const s2 = await inScript();
      ok('S8 Esc moves focus from the screenplay to its current mode tab', s2.inScript === false && !!s2.modeKey && s2.active === true, JSON.stringify(s2));
    }
  }
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nESCEXIT VERIFY: PASS (${checks.length} checks)` : `\nESCEXIT VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
