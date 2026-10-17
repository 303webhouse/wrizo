// HELP BUTTONS S3/S4 DIAGNOSIS (this desk): the harness opens the "?" with element.click() and "presses outside" with another element.click() - synthetic clicks that neither focus the button nor fire pointerdown.
// This drives the SAME flow with REAL CDP pointer and key events: (1) press the Templates "?" -> aria-expanded, which element has focus; (2) Escape -> expanded, focus; (3) press it again, then a real press OUTSIDE -> expanded.
// WT names the worktree. Prints HPROBE lines; asserts nothing.
const { withHarness } = await import(`file:///C:/Users/nickh/writer-studio/.claude/worktrees/${process.env.WT}/apps/desktop/scripts/runtime-verify.mjs`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const SEL = '.wz-sliver-templates .wz-sliver-h .wz-help';
const state = (app) => app.evalJs(`(() => { const b = document.querySelector(${JSON.stringify(SEL)}); const a = document.activeElement; return { expanded: b ? b.getAttribute('aria-expanded') : null, popOpen: !!document.querySelector('.wz-help-pop'),
  activeIsHelpButton: !!(a && a === b), active: a ? (a.tagName + '.' + String(a.className).slice(0, 30)) : null }; })()`);
const centre = (app, sel) => app.evalJs(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
const press = async (app, x, y) => { await app.mouseMove(x, y); await app.mouseDown(x, y); await app.mouseUp(x, y); await sleep(500); };
const esc = async (app) => { await app.cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 }); await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 }); await sleep(500); };
await withHarness(async (app) => {
  await app.emulateDpr(1, 1280, 800);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'hbp', text: 'A page for the probe.', origin: 'loose', source: 'page', createdAt: new Date().toISOString() })})`);
  await app.evalJs("localStorage.setItem('wrizo-mode-page-hbp', 'drafting')");
  await sleep(500); await app.evalJs("location.hash = '#/page/hbp'");
  await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'the page', timeout: 9000 }); await sleep(900);
  if ((await app.evalJs("(document.querySelector('.wz-sliver-panel') || {}).dataset && document.querySelector('.wz-sliver-panel').dataset.open")) !== 'true') { await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await sleep(900); }
  console.log('HPROBE ' + JSON.stringify({ step: '0 before', ...(await state(app)) }));
  // A: the harness's way - synthetic click, synthetic outside click
  await app.evalJs(`document.querySelector(${JSON.stringify(SEL)})?.click()`); await sleep(400);
  console.log('HPROBE ' + JSON.stringify({ step: 'A1 synthetic click opens', ...(await state(app)) }));
  await esc(app);
  console.log('HPROBE ' + JSON.stringify({ step: 'A2 real Escape after a synthetic open', ...(await state(app)) }));
  // B: a writer's way - real press on the "?", real Escape, real press again then a real press outside
  const c = await centre(app, SEL);
  await press(app, c.x, c.y);
  console.log('HPROBE ' + JSON.stringify({ step: 'B1 real press opens', ...(await state(app)) }));
  await esc(app);
  console.log('HPROBE ' + JSON.stringify({ step: 'B2 real Escape closes - and where does focus go', ...(await state(app)) }));
  const c2 = await centre(app, SEL); await press(app, c2.x, c2.y);
  const out = await centre(app, '.mode-page'); await press(app, out.x, out.y);
  console.log('HPROBE ' + JSON.stringify({ step: 'B3 real press on the page closes', ...(await state(app)) }));
  // C: the Recede depth "?" - where does it exist
  const rec = await app.evalJs(`(() => ({ inDraftSliver: !!document.querySelector('.wz-sliver .wz-help[aria-label="What is Recede depth?"]'), anywhere: !!document.querySelector('.wz-help[aria-label="What is Recede depth?"]'), tabs: [...document.querySelectorAll('.desk-mode-tab')].map((t) => t.textContent) }))()`);
  console.log('HPROBE ' + JSON.stringify({ step: 'C Recede depth "?" in Draft', ...rec }));
  await app.evalJs("[...document.querySelectorAll('.desk-mode-tab')].find((t) => /Free Write/.test(t.textContent))?.click()"); await sleep(1200);
  const rec2 = await app.evalJs(`(() => ({ inSliverNow: !!document.querySelector('.wz-sliver .wz-help[aria-label="What is Recede depth?"]'), anywhere: !!document.querySelector('.wz-help[aria-label="What is Recede depth?"]'), oldDrawerNote: !!document.querySelector('[aria-label="About Recede depth"]') }))()`);
  console.log('HPROBE ' + JSON.stringify({ step: 'C2 same, after switching to Free Write', ...rec2 }));
});
