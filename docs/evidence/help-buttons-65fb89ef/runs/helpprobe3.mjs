// HELP BUTTONS S1 DIAGNOSIS #3 (this desk): at 65fb89ef the second-tap defect and the Grafts/Links reds are fixed; Outline and Recede depth still open NOTHING under real presses. For each of the two "?" this prints, with NOTHING else open:
// its rect, the element AT its centre (elementFromPoint: is the button what a press reaches?), whether an ancestor clips it (overflow), and the state after a real press. Then the Outline press once more after the
// Templates "?" was opened and tapped closed (the S1 loop's order). WT names the worktree. Prints HPROBE3 lines; asserts nothing.
const { withHarness } = await import(`file:///C:/Users/nickh/writer-studio/.claude/worktrees/${process.env.WT}/apps/desktop/scripts/runtime-verify.mjs`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const T = '.wz-sliver-templates .wz-sliver-h .wz-help';
const O = '.wz-sliver-templates .wz-help[aria-label="What is Outline?"]';
const R = '.wz-help[aria-label="What is Recede depth?"]';
const facts = (app, sel) => app.evalJs(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return { exists: false };
  const r = b.getBoundingClientRect(); const cx = Math.round(r.left + r.width / 2), cy = Math.round(r.top + r.height / 2); const at = document.elementFromPoint(cx, cy);
  let clip = null; for (let n = b.parentElement; n; n = n.parentElement) { const cs = getComputedStyle(n); if (/(hidden|auto|scroll|clip)/.test(cs.overflowY + cs.overflowX)) { const q = n.getBoundingClientRect(); clip = { cls: String(n.className).slice(0, 40), top: Math.round(q.top), bottom: Math.round(q.bottom), btnTop: Math.round(r.top), btnBottom: Math.round(r.bottom) }; break; } }
  return { exists: true, rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], vh: innerHeight, atCentre: at ? (at.tagName + '.' + String(at.className).slice(0, 40) + (at === b ? ' (THE BUTTON)' : '')) : null, expanded: b.getAttribute('aria-expanded'), popOpen: !!document.querySelector('.wz-help-pop'), popText: (document.querySelector('.wz-help-pop') || {}).textContent || null, clip }; })()`);
const press = async (app, sel) => { const c = await app.evalJs(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`); if (!c) return false; await app.mouseMove(c.x, c.y); await sleep(60); await app.mouseDown(c.x, c.y); await sleep(80); await app.mouseUp(c.x, c.y); await sleep(350); return true; };
const say = (step, o) => console.log('HPROBE3 ' + JSON.stringify({ step, ...o }));
await withHarness(async (app) => {
  await app.emulateDpr(1, 1400, 900); await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');");
  await app.reload(); await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'hp3', text: 'A page for the probe.', origin: 'loose', source: 'page', createdAt: new Date().toISOString() })})`);
  await app.evalJs("localStorage.setItem('wrizo-mode-page-hp3', 'drafting')");
  await sleep(500); await app.evalJs("location.hash = '#/page/hp3'");
  await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'the page', timeout: 9000 }); await sleep(900);
  if ((await app.evalJs("(document.querySelector('.wz-sliver-panel') || {}).dataset && document.querySelector('.wz-sliver-panel').dataset.open")) !== 'true') { await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await sleep(900); }
  say('O0 Outline ? before any press', await facts(app, O));
  await press(app, O); say('O1 after ONE real press on Outline ? (nothing else open)', await facts(app, O));
  await press(app, O); say('O2 after a SECOND real press', await facts(app, O));
  await app.evalJs("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))"); await sleep(300);
  await press(app, T); say('T1 Templates ? pressed', await facts(app, T));
  await press(app, T); say('T2 Templates ? pressed again (closes)', await facts(app, T));
  await press(app, O); say('O3 Outline ? pressed after T was opened and closed (the S1 loop order)', await facts(app, O));
  say('R0 Recede depth ? (footer popout closed)', await facts(app, R));
  await app.evalJs("document.querySelector('.wz-sliver-instruments-btn')?.click()"); await sleep(400);
  say('R1 Recede depth ? after opening the footer popout', await facts(app, R));
  await press(app, R); say('R2 after a real press on Recede depth ?', await facts(app, R));
});
