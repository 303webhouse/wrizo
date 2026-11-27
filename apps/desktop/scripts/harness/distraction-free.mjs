// DISTRACTION FREE, what stays and what goes (the flourish spec §7.2 and §7.3; Nick, Nov 26, 5:32 pm: "Yes to all three"). THE REAL APP in each theme's own
// look, signed out, 1366x768, a Draft page with Progress counting words and a goal set.
//   Q  one still count line under the page, in the theme's words ("7 words · p. 1 of 1" / "7 WORDS · PG 1/1" / "7 words · page 1 of 1"), off the page
//   G  no meter, bar, flourish, notice or GLITCH switch is drawn
//   T  the line follows her typing; the page never moves
//   S  nothing under the line animates (no running animation inside it)
//   R  with it off again her meters are back as she left them, and the quiet line is gone
//   MUT the line forced onto the page turns Q's "off the page" reading red
// Run: node scripts/harness/distraction-free.mjs   (from apps/desktop, dist-web built)
Object.assign(process.env, { WS_REORG: '1', WS_ARBOR2: 'default', WS_MACHINA2: 'default', WS_FLUX3: 'default', WS_FLOURISH: '1', WS_PLACE: '1' });
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${typeof detail === 'string' ? detail : JSON.stringify(detail)}]` : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);

const THEMES = [
  { id: 'plateau', name: 'Arbor', line: (n) => `${n} words · p. 1 of 1` },
  { id: 'flux', name: 'Flux', line: (n) => `${n} WORDS · PG 1/1` },
  { id: 'machina', name: 'Machina', line: (n) => `${n} words · page 1 of 1` },
];

const PROBE = `(() => {
  const R = (e) => { if (!e) return null; const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) return null; const b = e.getBoundingClientRect(); return b.width > 1 && b.height > 1 ? [b.left, b.top, b.right, b.bottom].map((n) => Math.round(n)) : null; };
  const line = document.querySelector('.wz-quiet-count');
  const drawn = ['.wz-rhizome-field', '.desk-frame-instrument .mode-progress', '.machina-run', '[data-plain-tracker]', '[data-mode-notice]', '[data-glitch-switch]', '.flux3-glitchbar']
    .filter((s) => !!R(document.querySelector(s)));
  return { marked: document.documentElement.hasAttribute('data-distraction-free'), lines: document.querySelectorAll('.wz-quiet-count').length, line: R(line), text: line ? line.textContent.replace(/\\s+/g, ' ').trim() : null,
    anims: line ? line.getAnimations({ subtree: true }).length : null, page: R(document.querySelector('.desk-frame-stage .mode-page')), win: [innerWidth, innerHeight], drawn,
    words: (document.querySelector('.forward-only-editor')?.textContent || '') };
})()`;
const cross = (a, b) => !!a && !!b && a[0] < b[2] - 0.5 && b[0] < a[2] - 0.5 && a[1] < b[3] - 0.5 && b[1] < a[3] - 0.5;
const under = (s) => !!s.line && !!s.page && !cross(s.line, s.page) && s.line[1] >= s.page[3] - 1 && s.line[0] >= 0 && s.line[2] <= s.win[0] && s.line[3] <= s.win[1];

await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const S = () => ev(PROBE);
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
  for (const t of THEMES) await ev(`window.wrizoCreateJournalPage(${J({ id: `df-${t.id}`, text: 'The lamp burned low over the harbour.', createdAt: '2026-04-01T00:00:00.000Z', origin: null, source: 'page' })}); localStorage.setItem('wrizo-mode-page-df-${t.id}', 'drafting'); window.wrizoFlushNow()`);

  // her device: Progress counting words, the tracker on, a goal, and the Distraction Free fact exactly as given
  const seed = (df) => `(() => { const s = JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'); Object.assign(s, { instrumentsOn: true, progress: 'words', themeTracker: true, progressStyle: 'bar' }); localStorage.setItem('wrizo-writing-settings', JSON.stringify(s));
    localStorage.setItem('wrizo-writing-goal-lines', JSON.stringify({ n: 500, unit: 'words' }));
    const p = JSON.parse(localStorage.getItem('wrizo-reorg-prefs') || '{}'); delete p.writing; delete p.flourishOff; delete p.distractionFree; const at = new Date().toISOString();
    if (${J(df)}) p.distractionFree = { on: true, at };
    localStorage.setItem('wrizo-reorg-prefs', JSON.stringify(p)); })()`;
  const openIn = async (theme, df) => {
    await ev("location.hash = '#/'"); await sleep(200);
    await ev(seed(df));
    await ev(`localStorage.setItem('wrizo-theme', '${theme}')`);
    await ev(`history.replaceState(null, '', '/#/page/df-${theme}')`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.desk-frame-stage .forward-only-editor')", { label: 'the page', timeout: 15000 });
    await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
    await ev("(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); })()");
    await sleep(1800);
    return S();
  };

  for (const t of THEMES) {
    const off = await openIn(t.id, false);
    ok(`${t.name} (premise): without it, something of the meters is drawn and there is no quiet line`, !off.marked && off.drawn.length > 0 && off.lines === 0, off);
    const on = await openIn(t.id, true);
    ok(`${t.name} (premise): the app reads Distraction Free`, on.marked, on);
    ok(`${t.name} Q: one still count line under the page, in its words`, on.lines === 1 && on.text === t.line(7) && under(on), { lines: on.lines, text: on.text, line: on.line, page: on.page });
    ok(`${t.name} G: no meter, bar, flourish, notice or switch is drawn`, on.drawn.length === 0, on.drawn);
    ok(`${t.name} S: nothing in the line animates`, on.anims === 0, { anims: on.anims });
    await app.typeKeys(' and on');
    await sleep(1500);
    const typed = await S();
    ok(`${t.name} T: the line follows her typing and the page has not moved`, typed.text === t.line(9) && J(typed.page) === J(on.page) && typed.drawn.length === 0, { text: typed.text, page: [on.page, typed.page], drawn: typed.drawn });
    if (t.id === 'plateau') {
      await ev("(() => { const l = document.querySelector('.wz-quiet-count'); if (l) l.style.setProperty('bottom', '200px', 'important'); })()");
      await sleep(300);
      const m = await S();
      ok('MUT the line forced onto the page turns Q\'s "off the page" reading red', !!m.line && !under(m), { line: m.line, page: m.page });
    }
    const back = await openIn(t.id, false);
    ok(`${t.name} R: off again, her meters are back as before and the quiet line is gone`, !back.marked && back.lines === 0 && J(back.drawn) === J(off.drawn), { before: off.drawn, after: back.drawn, lines: back.lines });
  }
});

const failed = checks.filter((c) => !c.pass).length;
console.log(`\nDISTRACTION-FREE VERIFY: ${failed ? `FAIL - ${failed}/${checks.length} failed` : `PASS - ${checks.length}/${checks.length}`}`);
process.exit(failed ? 1 : 0);
