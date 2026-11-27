// DISTRACTION FREE, what stops moving (the flourish spec §7.2: menu motion, animated marks, ambient motion; Arbor's pergola shadows and gusts). THE REAL APP in
// each theme's own look, signed out, 1366x768, a Draft page; Arbor pinned to its day room, where the shadows are.
//   C  with both menus opened and at rest, nothing off the page is animating (a census of running animations; the page and her caret are never touched)
//   E  the menus simply appear: their panels carry no transition longer than 2 ms
//   A  (Arbor) no pergola shadow or sun layer is drawn
//   P  the page stands where it stood without it, and her words are the same
//   R  off again, what moved before moves again and Arbor's shadows are back
// Run: node scripts/harness/distraction-free-motion.mjs   (from apps/desktop, dist-web built)
Object.assign(process.env, { WS_REORG: '1', WS_ARBOR2: 'default', WS_MACHINA2: 'default', WS_FLUX3: 'default', WS_FLOURISH: '1', WS_PLACE: '1' });
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${typeof detail === 'string' ? detail : JSON.stringify(detail)}]` : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);

const THEMES = [
  { id: 'plateau', name: 'Arbor', query: '?arbor2room=day' },
  { id: 'flux', name: 'Flux', query: '' },
  { id: 'machina', name: 'Machina', query: '' },
];

const PROBE = `(() => {
  const seen = (e) => { if (!e) return false; const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') return false; const b = e.getBoundingClientRect(); return b.width > 1 && b.height > 1; };
  const name = (e) => !e ? '?' : (e.tagName.toLowerCase() + '.' + String(e.getAttribute('class') || '').split(/\\s+/).slice(0, 2).join('.'));
  const moving = document.getAnimations().filter((a) => { const t = a.effect && a.effect.target; return a.playState === 'running' && t && !t.closest('.mode-page') && !t.closest('.flux-block-caret'); })
    .map((a) => name(a.effect.target) + ':' + (a.animationName || a.transitionProperty || 'script'));
  const longest = (s) => { const e = document.querySelector(s); if (!e) return null; return Math.max(...getComputedStyle(e).transitionDuration.split(',').map((v) => parseFloat(v) * (v.trim().endsWith('ms') ? 1 : 1000))); };
  const page = document.querySelector('.desk-frame-stage .mode-page');
  return { marked: document.documentElement.hasAttribute('data-distraction-free'), moving: moving.slice(0, 20), count: moving.length,
    front: longest('.wz-sliver-panel'), back: longest('.wz-tutor-panel'),
    shadows: [...document.querySelectorAll('.arbor2-pergola, .arbor2-pagesh, .arbor2-sun')].filter(seen).length,
    page: page ? ((b) => [b.left, b.top, b.right, b.bottom].map((n) => Math.round(n)))(page.getBoundingClientRect()) : null,
    words: (document.querySelector('.forward-only-editor')?.textContent || '') };
})()`;

await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const S = () => ev(PROBE);
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
  for (const t of THEMES) await ev(`window.wrizoCreateJournalPage(${J({ id: `dm-${t.id}`, text: 'The lamp burned low over the harbour.', createdAt: '2026-04-01T00:00:00.000Z', origin: null, source: 'page' })}); localStorage.setItem('wrizo-mode-page-dm-${t.id}', 'drafting'); window.wrizoFlushNow()`);

  const seed = (df) => `(() => { const p = JSON.parse(localStorage.getItem('wrizo-reorg-prefs') || '{}'); delete p.writing; delete p.flourishOff; delete p.distractionFree;
    if (${J(df)}) p.distractionFree = { on: true, at: new Date().toISOString() };
    localStorage.setItem('wrizo-reorg-prefs', JSON.stringify(p)); })()`;
  const openIn = async (t, df) => {
    await ev("location.hash = '#/'"); await sleep(200);
    await ev(seed(df));
    await ev(`localStorage.setItem('wrizo-theme', '${t.id}')`);
    await ev(`history.replaceState(null, '', '/${t.query}#/page/dm-${t.id}')`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.desk-frame-stage .forward-only-editor')", { label: 'the page', timeout: 15000 });
    await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
    await sleep(2500);
    return S();
  };
  const openMenus = async () => {
    await ev("document.querySelector('.wz-sliver-grip')?.click()");
    await sleep(400);
    const front = await S();
    await ev("document.querySelector('.wz-tutor-grip')?.click()");
    await sleep(2500);
    const back = await S();
    return { front, back };
  };

  for (const t of THEMES) {
    const off = await openIn(t, false);
    if (t.id === 'plateau') ok(`${t.name} (premise): without it the day room draws its shadows and something moves`, off.shadows > 0 && off.count > 0, { shadows: off.shadows, moving: off.moving });
    const on = await openIn(t, true);
    ok(`${t.name} (premise): the app reads Distraction Free`, on.marked, on);
    ok(`${t.name} P: the page stands where it stood, with the same words`, J(on.page) === J(off.page) && on.words === off.words, { page: [off.page, on.page] });
    if (t.id === 'plateau') ok(`${t.name} A: no pergola shadow or sun layer is drawn`, on.shadows === 0, { shadows: on.shadows });
    ok(`${t.name} C (at rest): nothing off the page is animating`, on.count === 0, on.moving);
    const open = await openMenus();
    ok(`${t.name} E: the menus simply appear`, open.front.front !== null && open.front.front <= 2 && open.back.back !== null && open.back.back <= 2, { frontMs: open.front.front, backMs: open.back.back });
    ok(`${t.name} C (menus open): nothing off the page is animating`, open.back.count === 0, open.back.moving);
    const again = await openIn(t, false);
    ok(`${t.name} R: off again, the shadows and the motion are as before`, !again.marked && again.shadows === off.shadows && (off.count === 0) === (again.count === 0), { shadows: [off.shadows, again.shadows], moving: [off.count, again.count] });
  }
});

const failed = checks.filter((c) => !c.pass).length;
console.log(`\nDISTRACTION-FREE-MOTION VERIFY: ${failed ? `FAIL - ${failed}/${checks.length} failed` : `PASS - ${checks.length}/${checks.length}`}`);
process.exit(failed ? 1 : 0);
