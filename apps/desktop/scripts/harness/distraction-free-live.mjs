// DISTRACTION FREE, SWITCHED WHILE SHE IS ON THE PAGE (the flourish spec §7.1, §7.2: "turning it off gives each theme's own choices back exactly as she left
// them"). THE REAL APP in each theme's own look, signed out, 1366x768, a Draft page; Arbor in its day room. No reload between: she opens Docs (Pages) › Session,
// presses On, closes the menu; later the same for Off.
//   ON   the one count line stands; no meter, notice or switch; nothing off the page is animating; Arbor's shadows are gone; the page and her words as before
//   OFF  her meters are drawn again as before, the quiet line is gone, what moved moves again, and Arbor's shadows are back
// Run: node scripts/harness/distraction-free-live.mjs   (from apps/desktop, dist-web built)
Object.assign(process.env, { WS_REORG: '1', WS_ARBOR2: 'default', WS_MACHINA2: 'default', WS_FLUX3: 'default', WS_FLOURISH: '1', WS_PLACE: '1' });
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${typeof detail === 'string' ? detail : JSON.stringify(detail)}]` : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);
const THEMES = [{ id: 'plateau', name: 'Arbor', query: '?arbor2room=day' }, { id: 'flux', name: 'Flux', query: '' }, { id: 'machina', name: 'Machina', query: '' }];
const METERS = ['.wz-rhizome-field', '.desk-frame-instrument .mode-progress', '.machina-run', '[data-plain-tracker]', '[data-mode-notice]', '[data-glitch-switch]', '.flux3-glitchbar'];

const PROBE = `(() => {
  const R = (e) => { if (!e) return false; const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') return false; const b = e.getBoundingClientRect(); return b.width > 1 && b.height > 1; };
  const moving = document.getAnimations().filter((a) => { const t = a.effect && a.effect.target; return a.playState === 'running' && t && !t.closest('.mode-page') && !t.closest('.flux-block-caret'); });
  const page = document.querySelector('.desk-frame-stage .mode-page');
  return { marked: document.documentElement.hasAttribute('data-distraction-free'), line: R(document.querySelector('.wz-quiet-count')),
    meters: ${J(METERS)}.filter((s) => s !== '[data-mode-notice]' && R(document.querySelector(s))), notice: R(document.querySelector('[data-mode-notice]')),
    moving: moving.length, names: moving.slice(0, 5).map((a) => a.animationName || a.transitionProperty || 'script'),
    shadows: [...document.querySelectorAll('.arbor2-pergola, .arbor2-pagesh, .arbor2-sun')].filter(R).length,
    page: page ? ((b) => [b.left, b.top, b.right, b.bottom].map((n) => Math.round(n)))(page.getBoundingClientRect()) : null,
    words: (document.querySelector('.forward-only-editor')?.textContent || ''),
    out: !!document.querySelector('.desk-frame-cascade-anchor .wz-cascade-panel:not([data-leaving])') };
})()`;

await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const S = () => ev(PROBE);
  const press = async (sel) => { const p = await ev(`(() => { const b = document.querySelector(${J(sel)}); if (!b) return null; b.scrollIntoView({ block: 'nearest' }); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`); if (!p) return false; await app.mouseMove(p.x, p.y); await app.mouseDown(p.x, p.y); await app.mouseUp(p.x, p.y); await sleep(700); return true; };
  const DOCS = '[data-reorg-rail] [data-category="reorg-docs"]';
  // open Docs, unfold Session, press the switch, close Docs, and let the page settle
  const switchTo = async (pick) => {
    if (!(await S()).out) await press(DOCS);
    if (await ev("document.querySelector('[data-reorg-group=\"session\"] [data-session-fold]')?.getAttribute('aria-expanded') !== 'true'")) await press('[data-reorg-group="session"] [data-session-fold]');
    const pressed = await press(`[data-session-df] [data-toggle="${pick}"]`);
    if ((await S()).out) await press(DOCS);
    await app.mouseMove(700, 20);
    await sleep(2500);
    return pressed;
  };
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
  for (const t of THEMES) await ev(`window.wrizoCreateJournalPage(${J({ id: `dl-${t.id}`, text: 'The lamp burned low over the harbour.', createdAt: '2026-04-01T00:00:00.000Z', origin: null, source: 'page' })}); localStorage.setItem('wrizo-mode-page-dl-${t.id}', 'drafting'); window.wrizoFlushNow()`);

  for (const t of THEMES) {
    await ev("location.hash = '#/'"); await sleep(200);
    await ev("(() => { const s = JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'); Object.assign(s, { instrumentsOn: true, progress: 'words', themeTracker: true }); localStorage.setItem('wrizo-writing-settings', JSON.stringify(s)); localStorage.setItem('wrizo-writing-goal-lines', JSON.stringify({ n: 500, unit: 'words' })); const p = JSON.parse(localStorage.getItem('wrizo-reorg-prefs') || '{}'); delete p.writing; delete p.flourishOff; delete p.distractionFree; localStorage.setItem('wrizo-reorg-prefs', JSON.stringify(p)); })()");
    await ev(`localStorage.setItem('wrizo-theme', '${t.id}')`);
    await ev(`history.replaceState(null, '', '/${t.query}#/page/dl-${t.id}')`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.desk-frame-stage .forward-only-editor')", { label: 'the page', timeout: 15000 });
    await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
    await app.mouseMove(700, 20);
    await sleep(8000);   // past the opening notice
    const before = await S();
    ok(`${t.name} (premise): her meters are drawn, off`, !before.marked && !before.line && before.meters.length > 0, before);
    ok(`${t.name} (premise): the switch is in Session and takes the press`, await switchTo('on'), 'On');
    const on = await S();
    ok(`${t.name} ON: one count line, no meter, notice or switch`, on.marked && on.line && on.meters.length === 0 && !on.notice, on);
    ok(`${t.name} ON: nothing off the page is animating, and no shadow is drawn`, on.moving === 0 && on.shadows === 0, { moving: on.names, shadows: on.shadows });
    ok(`${t.name} ON: the page stands where it stood, with the same words`, J(on.page) === J(before.page) && on.words === before.words, { page: [before.page, on.page] });
    await switchTo('off');
    const off = await S();
    ok(`${t.name} OFF: her meters are back as before and the count line is gone`, !off.marked && !off.line && J(off.meters) === J(before.meters), { before: before.meters, after: off.meters, line: off.line });
    ok(`${t.name} OFF: what moved moves again, and the shadows are back`, (before.moving === 0) === (off.moving === 0) && off.shadows === before.shadows && J(off.page) === J(before.page), { moving: [before.moving, off.moving], shadows: [before.shadows, off.shadows] });
  }
});

const failed = checks.filter((c) => !c.pass).length;
console.log(`\nDISTRACTION-FREE-LIVE VERIFY: ${failed ? `FAIL - ${failed}/${checks.length} failed` : `PASS - ${checks.length}/${checks.length}`}`);
process.exit(failed ? 1 : 0);
