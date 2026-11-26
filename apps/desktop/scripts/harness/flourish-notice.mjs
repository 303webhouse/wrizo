// THE "MODE ON" NOTICE AND FLUX'S GLITCH SWITCH (the flourish spec draft 2, ruled by Nick Nov 26 3:04 pm: §2 and §4.1; Fable's order 3:15 pm, POLISH).
// THE REAL APP in each theme's own look, signed out. The flourish "on" = Arbor's progress style Rhizome, Flux's Glitch, Machina's Run (its theme
// progress tracker), each with Progress counting words and a goal set.
//   N1  a theme that opens with its flourish on shows ONE quiet status line under the meter, in the theme's words, with its Turn off
//   N2  it covers neither the page nor the page count, stands inside the window, never moves the page (coming or going), and does not animate
//       (no flash, nothing to still under reduced motion or Ambiance 0)
//   N3  it never takes focus; typing lands while it stands; her first key takes it away
//   N4  with no key it leaves by itself after about 6 s
//   N5  Turn off flips the existing switch (Arbor: Bar; Flux: Bar; Machina: the theme tracker off), keeps her focus, says where to turn it back on, and
//       that line leaves by itself
//   N6  once per opening: another page shows nothing; switching the theme away and back shows it again
//   N7  a theme that opens with its flourish off shows nothing
//   S   (Flux) the GLITCH switch stands beside the page count at 1366, 1536 and 2560, off the page; pressing it flips Glitch/Bar both ways, keeps her
//       focus and never moves the page; not drawn when Progress does not count words
//   MUT the notice forced onto the page turns N2's reading red
// Run: node scripts/harness/flourish-notice.mjs   (from apps/desktop, dist-web built)
Object.assign(process.env, { WS_REORG: '1', WS_ARBOR2: 'default', WS_MACHINA2: 'default', WS_FLUX3: 'default' });
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${typeof detail === 'string' ? detail : JSON.stringify(detail)}]` : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);

const THEMES = [
  { id: 'plateau', name: 'Arbor', on: 'The Rhizome is on', turn: 'Turn off', off: 'The Rhizome is off', onSet: { progressStyle: 'rhizome', themeTracker: true }, offSet: { progressStyle: 'bar', themeTracker: true }, turned: (s) => s.progressStyle === 'bar' },
  { id: 'flux', name: 'Flux', on: 'GLITCH MODE ENABLED', turn: 'Turn off', off: 'GLITCH MODE OFF', onSet: { progressStyle: 'rhizome', themeTracker: true }, offSet: { progressStyle: 'bar', themeTracker: true }, turned: (s) => s.progressStyle === 'bar' },
  { id: 'machina', name: 'Machina', on: 'Run Strip On', turn: 'Turn Off', off: 'Run Strip Off', onSet: { progressStyle: 'bar', themeTracker: true }, offSet: { progressStyle: 'bar', themeTracker: false }, turned: (s) => s.themeTracker === false },
];

const PROBE = `(() => {
  const R = (e) => { if (!e) return null; const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) return null; const b = e.getBoundingClientRect(); return b.width > 1 && b.height > 1 ? [b.left, b.top, b.right, b.bottom].map((n) => Math.round(n)) : null; };
  const n = document.querySelector('[data-mode-notice]'); const page = document.querySelector('.desk-frame-stage .mode-page'); const sw = document.querySelector('[data-glitch-switch]');
  const count = document.querySelector('.desk-frame-instrument .wz-pagecount, .wz-pagecount');
  let settings = {}; try { settings = JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'); } catch {}
  return { notice: R(n), kind: n ? n.getAttribute('data-mode-notice') : null, text: n ? n.textContent.replace(/\\s+/g, ' ').trim() : null, role: n ? n.getAttribute('role') : null,
    anim: n ? getComputedStyle(n).animationName : null, button: n && n.querySelector('[data-mode-notice-off]') ? n.querySelector('[data-mode-notice-off]').textContent.trim() : null,
    page: R(page), count: R(count), win: [innerWidth, innerHeight], inEditor: !!document.activeElement && !!document.activeElement.closest('.forward-only-editor'),
    text0: (document.querySelector('.forward-only-editor')?.textContent || ''), sw: R(sw), checked: sw ? sw.getAttribute('aria-checked') : null, swName: sw ? (sw.getAttribute('aria-label') || '') : null, swRole: sw ? sw.getAttribute('role') : null,
    splash: !!document.querySelector('.wz-splash'), settings };
})()`;
const cross = (a, b) => !!a && !!b && a[0] < b[2] - 0.5 && b[0] < a[2] - 0.5 && a[1] < b[3] - 0.5 && b[1] < a[3] - 0.5;
const clear = (s) => !!s.notice && !cross(s.notice, s.page) && !cross(s.notice, s.count) && s.notice[0] >= 0 && s.notice[1] >= 0 && s.notice[2] <= s.win[0] && s.notice[3] <= s.win[1];

await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const S = () => ev(PROBE);
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
  for (const id of ['fn-1', 'fn-2']) await ev(`window.wrizoCreateJournalPage(${J({ id, text: 'The lamp burned low over the harbour.', createdAt: '2026-04-01T00:00:00.000Z', origin: null, source: 'page' })}); localStorage.setItem('wrizo-mode-page-${id}', 'drafting'); window.wrizoFlushNow()`);

  const settings = (patch) => `(() => { const s = JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'); Object.assign(s, ${J({ instrumentsOn: true, progress: 'words' })}, ${J(patch)}); localStorage.setItem('wrizo-writing-settings', JSON.stringify(s)); localStorage.setItem('wrizo-writing-goal-lines', JSON.stringify({ n: 500, unit: 'words' })); })()`;
  // THE THEME OPENS: the app starts in it, on a writing page, her caret in the page
  const openIn = async (theme, patch, w = 1366, h = 768) => {
    await app.emulateDpr(1, w, h);
    await ev("location.hash = '#/'"); await sleep(200);
    await ev(settings(patch));
    await ev(`localStorage.setItem('wrizo-theme', '${theme}')`);
    await ev("history.replaceState(null, '', '/#/page/fn-1')");
    await app.reload();
    await app.waitFor("!!document.querySelector('.desk-frame-stage .forward-only-editor')", { label: 'the page', timeout: 15000 });
    await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
    await ev("(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); })()");
    await sleep(900);
  };

  for (const th of THEMES) {
    await openIn(th.id, th.onSet);
    const s = await S();
    ok(`${th.name} N1: opening with the flourish on shows one status line in the theme's words, with ${th.turn}`, !!s.notice && s.kind === 'on' && s.role === 'status' && s.text.includes(th.on) && s.button === th.turn, s);
    ok(`${th.name} N2: it covers neither the page nor the count, stands in the window, and does not animate`, clear(s) && (s.anim === 'none' || s.anim === null), { notice: s.notice, page: s.page, count: s.count, anim: s.anim });
    if (th.id === 'plateau') {
      await ev("(() => { const n = document.querySelector('[data-mode-notice]'); const p = document.querySelector('.desk-frame-stage .mode-page').getBoundingClientRect(); if (n) { n.style.setProperty('top', (p.top + 40) + 'px', 'important'); n.style.setProperty('left', (p.left + 40) + 'px', 'important'); n.style.setProperty('bottom', 'auto', 'important'); n.style.setProperty('right', 'auto', 'important'); n.style.setProperty('transform', 'none', 'important'); } })()");
      const m = await S();
      ok('MUT the notice forced onto the page turns N2\'s reading red', !!m.notice && !clear(m), { notice: m.notice, page: m.page });
      await openIn(th.id, th.onSet);
    }
    const before = await S();
    ok(`${th.name} N3a: it never takes focus`, before.inEditor && !!before.notice, { inEditor: before.inEditor });
    await app.typeKeys(' x'); await sleep(500);
    const typed = await S();
    ok(`${th.name} N3b: typing lands, and her first key takes the line away`, typed.text0.endsWith(' x') && !typed.notice, { text: typed.text0.slice(-20), notice: typed.notice });
    ok(`${th.name} N2b: the page never moves as the line comes and goes`, J(before.page) === J(typed.page), { with: before.page, without: typed.page });

    await openIn(th.id, th.onSet);
    const t0 = await S(); await sleep(4000); const t4 = await S(); await sleep(3000); const t7 = await S();
    ok(`${th.name} N4: with no key it stands about 6 s and leaves by itself`, !!t0.notice && !!t4.notice && !t7.notice, { at0: !!t0.notice, at4: !!t4.notice, at7: !!t7.notice });

    await openIn(th.id, th.onSet);
    const pressAt = await ev("(() => { const b = document.querySelector('[data-mode-notice-off]'); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()");
    if (pressAt) { await app.mouseMove(pressAt.x, pressAt.y); await app.mouseDown(pressAt.x, pressAt.y); await app.mouseUp(pressAt.x, pressAt.y); }
    await sleep(600);
    const off = await S();
    ok(`${th.name} N5a: ${th.turn} flips the existing switch, keeps her focus, and says it is off and where to turn it back on`, th.turned(off.settings) && off.inEditor && off.kind === 'off' && off.text.includes(th.off) && /Turn it back on: .+\./.test(off.text), { settings: off.settings, kind: off.kind, text: off.text, inEditor: off.inEditor });
    ok(`${th.name} N5b: that line covers neither the page nor the count`, clear(off), { notice: off.notice, page: off.page });
    await sleep(8500);
    ok(`${th.name} N5c: and it leaves by itself`, !(await S()).notice);

    await openIn(th.id, th.onSet);
    await app.typeKeys('y'); await sleep(300);
    await ev("location.hash = '#/page/fn-2'"); await sleep(1500);
    const second = await S();
    await ev("window.wrizoTheme.set('" + (th.id === 'plateau' ? 'machina' : 'plateau') + "')"); await sleep(800);
    await ev(settings(th.onSet));
    await ev(`window.wrizoTheme.set('${th.id}')`); await sleep(1500);
    const again = await S();
    ok(`${th.name} N6: once per opening - another page shows nothing, and the theme chosen again shows it again`, !second.notice && !!again.notice && again.text.includes(th.on), { second: second.text, again: again.text });

    await openIn(th.id, th.offSet);
    await sleep(600);
    const none = await S();
    ok(`${th.name} N7: opening with the flourish off shows nothing`, !none.notice, { notice: none.notice, text: none.text });
  }

  for (const [w, h] of [[1366, 768], [1536, 864], [2560, 1440]]) {
    await openIn('flux', { progressStyle: 'bar', themeTracker: true }, w, h);
    const a = await S();
    const beside = (s) => !!s.sw && !!s.count && s.sw[1] < s.count[3] && s.count[1] < s.sw[3] && Math.min(Math.abs(s.sw[0] - s.count[2]), Math.abs(s.count[0] - s.sw[2])) <= 40;
    ok(`Flux ${w} S1: the GLITCH switch stands beside the page count, off the page, named "Glitch mode", off`, beside(a) && !cross(a.sw, a.page) && a.swRole === 'switch' && a.swName === 'Glitch mode' && a.checked === 'false', { sw: a.sw, count: a.count, page: a.page, name: a.swName, checked: a.checked });
    const press = async () => { const p = await ev("(() => { const b = document.querySelector('[data-glitch-switch]'); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()"); if (p) { await app.mouseMove(p.x, p.y); await app.mouseDown(p.x, p.y); await app.mouseUp(p.x, p.y); } await sleep(700); };
    await press();
    const b = await S();
    await press();
    const c = await S();
    ok(`Flux ${w} S2: a press turns Glitch on, a second Bar; her focus stays in the page and the page never moves`, b.settings.progressStyle === 'rhizome' && b.checked === 'true' && beside(b) && c.settings.progressStyle === 'bar' && c.checked === 'false' && b.inEditor && c.inEditor && J(a.page) === J(b.page) && J(a.page) === J(c.page), { on: [b.settings.progressStyle, b.checked, b.inEditor], off: [c.settings.progressStyle, c.checked], pages: [a.page, b.page, c.page], swOn: b.sw, countOn: b.count });
  }
  await openIn('flux', { progressStyle: 'bar', themeTracker: true, progress: 'off' });
  ok('Flux S3: with Progress not counting words there is no switch', !(await S()).sw);
});

const failed = checks.filter((c) => !c.pass).length;
console.log(`\nFLOURISH-NOTICE VERIFY: ${failed ? `FAIL - ${failed}/${checks.length} failed` : `PASS - ${checks.length}/${checks.length}`}`);
process.exit(failed ? 1 : 0);
