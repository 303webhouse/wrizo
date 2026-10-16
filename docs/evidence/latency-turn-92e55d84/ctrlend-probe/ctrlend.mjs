// CTRL+END ON A 50k PAGE - a probe (this desk): where do the caret and the scroll end up on the build named by WT? The harness's own setup and key
// (typing-latency-scroll.mjs S1: a 50k-word Draft page, focus, CDP rawKeyDown/keyUp End with Ctrl), with NO assumption about rows - so it runs on main's build too.
// Reads the same caret shape as the harness, then once more after 1.5 s; and a second route: the keyDown type with the editing command, for a native move.
const { withHarness } = await import(`file:///C:/Users/nickh/writer-studio/.claude/worktrees/${process.env.WT}/apps/desktop/scripts/runtime-verify.mjs`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const ED = '.forward-only-editor';
const PAGE = 'ce-page';
const VOCAB = ['the', 'writer', 'kept', 'going', 'past', 'midnight', 'and', 'a', 'quiet', 'river', 'ran', 'under', 'window', 'of', 'room', 'where', 'she', 'had', 'left', 'her', 'coat'];
const pageOf = (n) => { const out = []; let w = 0; let i = 7; while (w < n) { const len = 40 + (i % 90); const line = []; for (let k = 0; k < len && w < n; k++) { line.push(VOCAB[(i * 7 + k * 3) % VOCAB.length]); w++; } out.push(line.join(' ')); i += 13; } return out.join('\n'); };
const state = (app) => app.evalJs(`(() => { const ed = document.querySelector('${ED}'); const sc = document.querySelector('.mode-scroll'); const s = getSelection(); if (!ed || !sc || !s.rangeCount) return null;
  const r = document.createRange(); r.selectNodeContents(ed); r.setEnd(s.anchorNode, s.anchorOffset); const off = r.toString().split('\\u200b').join('').length;
  return { offset: off, textLength: ed.textContent.split('\\u200b').join('').length, scrollTop: Math.round(sc.scrollTop), scrollHeight: sc.scrollHeight, clientHeight: sc.clientHeight,
    atBottom: Math.abs(sc.scrollTop + sc.clientHeight - sc.scrollHeight) <= 2, rows: ed.querySelectorAll('.wz-row').length,
    bundle: ([...document.scripts].map((x) => x.src).find((x) => x.indexOf('assets/index-') >= 0) || '').replace(/^.*assets\\//, '') }; })()`);
await withHarness(async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: PAGE, text: pageOf(50000), createdAt: '2026-04-01T00:00:00.000Z', origin: null, source: null })})`);
  await app.evalJs(`localStorage.setItem('wrizo-mode-page-${PAGE}', 'drafting')`);
  await sleep(600);
  await app.evalJs(`location.hash = '#/page/${PAGE}'`);
  const up = await waitSoft(app, `!!document.querySelector('${ED}')`, { label: 'the 50k page', timeout: 30000 });
  await sleep(2500);
  await app.evalJs(`document.querySelector('${ED}').focus()`);
  const before = await state(app);
  await app.cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'End', code: 'End', windowsVirtualKeyCode: 35, nativeVirtualKeyCode: 35, modifiers: 2 });
  await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'End', code: 'End', windowsVirtualKeyCode: 35, nativeVirtualKeyCode: 35, modifiers: 2 });
  await sleep(150); const at150 = await state(app); await sleep(1500); const at1650 = await state(app);
  console.log(`CTRLEND ${process.env.WT} ${JSON.stringify({ up, before, at150, at1650 })}`);
  // second route: Ctrl+Home then Ctrl+End with the native editing command attached (what a real keyboard's default action does)
  await app.cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Home', code: 'Home', windowsVirtualKeyCode: 36, nativeVirtualKeyCode: 36, modifiers: 2 });
  await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Home', code: 'Home', windowsVirtualKeyCode: 36, nativeVirtualKeyCode: 36, modifiers: 2 });
  await sleep(800);
  await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'End', code: 'End', windowsVirtualKeyCode: 35, nativeVirtualKeyCode: 35, modifiers: 2, commands: ['moveToEndOfDocument'] });
  await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'End', code: 'End', windowsVirtualKeyCode: 35, nativeVirtualKeyCode: 35, modifiers: 2 });
  await sleep(1650); const viaCmd = await state(app);
  console.log(`CTRLEND-CMD ${process.env.WT} ${JSON.stringify(viaCmd)}`);
});
