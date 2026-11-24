// FLUX'S MARK AND SPLASH (S5, v5; the Wrizors' build sheet flux-mark-splash-build-sheet.md, Nov 22, 9:35 pm; Fable's Flux-live order, Nov 22, 10:52 pm). RED FIRST: the app draws the old schematic today.
// Written from the sheet and the approved v5 page ("Flux splash"). The spec's §7 outranks the sheet and was not readable from this lane when this was written, so two values on which the sheet and the v5 source differ are
// deliberately NOT held here until §7 is read: the mark's tracking (sheet .32 em; the source's gap works out near .38 em) and the length of signal loss (sheet about 0.3 s; the source runs 420 ms).
//
// What the build gives this file to read (a contract, no styling hangs on it):
//   .wz-flux5                       the v5 drawing, on the splash and on the front door's held frame
//   [data-flux-mark] [data-flux-letter] [data-flux-cursor]   the mark, as type, and its brass block; data-glitch on the mark while a glitch runs (tear, decode, signal)
//   [data-flux-tagline] [data-flux-status] [data-flux-wire] [data-flux-dot] [data-flux-node]   the tagline, the status line, the wires, their dots, the boxes
//   [data-flux-door=login|compose|resume]   a door (the whole node); data-wait until it is live; .cmd is its command, .ring its focus ring
//   window.wrizoFluxSplash.seek(ms), .DONE   holds the run at a moment (the v5 page's own __seek), DONE = 3750
//   [data-flux-appmark]             the in-app mark, top-left; window.__f3MarkIdleShift adds seconds to its idle clock (as __f3IdleShift does for the idle glitch). Never set by product code.
//
// Run: node scripts/harness/flux-mark-splash.mjs (from apps/desktop; a box turn or Actions)
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const BRASS = 'rgb(255, 152, 0)';
const DONE = 3750;
const LINES = ['BOOTING THE TERMINAL…', 'CALIBRATING SIGNAL…', 'DECRYPTING THE ARCHIVE…', 'PATCHING THE UPLINK…'];
const wasAnon = process.env.WS_ANON;

const ROOT = "[...document.querySelectorAll('.wz-flux5')].filter((n) => n.getBoundingClientRect().width > 0).pop()";
const READ = `(() => { const root = ${ROOT}; if (!root) return null;
  const all = (s) => [...root.querySelectorAll(s)], one = (s) => root.querySelector(s), text = (n) => (n ? n.textContent : '').trim();
  const px = (n) => parseFloat(getComputedStyle(n).fontSize) * Math.abs(n.getScreenCTM().a);
  const door = (id) => { const d = one('[data-flux-door=' + id + ']'); return d ? { cmd: text(d.querySelector('.cmd')), wait: d.hasAttribute('data-wait'), focused: document.activeElement === d, px: px(d.querySelector('.cmd')) } : null; };
  const cur = one('[data-flux-cursor]'), ring = one('[data-flux-door=compose] .ring');
  return { letters: all('[data-flux-letter]').map((n) => ({ ch: n.textContent, tag: n.tagName.toLowerCase(), family: getComputedStyle(n).fontFamily, weight: getComputedStyle(n).fontWeight })),
    cursor: cur ? { fill: getComputedStyle(cur).fill, shown: getComputedStyle(cur).visibility !== 'hidden' } : null, glitch: (one('[data-flux-mark]') || { getAttribute() { return null; } }).getAttribute('data-glitch'),
    tagline: text(one('[data-flux-tagline]')), status: text(one('[data-flux-status]')), wires: all('[data-flux-wire]').length, dots: all('[data-flux-dot]').length,
    arrowheads: all('path').filter((p) => /M386,532|M686,532|M996,532|M822,491/.test(p.getAttribute('d') || '')).length,
    brassBoxes: all('[data-flux-node] rect').filter((r) => getComputedStyle(r).stroke === '${BRASS}').length, nodeMotion: all('[data-flux-node]').reduce((k, n) => k + n.getAnimations().length, 0),
    login: door('login'), compose: door('compose'), resume: door('resume'), ringPx: ring ? parseFloat(getComputedStyle(ring).strokeWidth) * Math.abs(ring.getScreenCTM().a) : null,
    smallest: all('text').filter((n) => n.textContent.trim() && !n.closest('[data-flux-door]') && !n.closest('[data-flux-mark]')).reduce((m, n) => Math.min(m, px(n)), 999) }; })()`;

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const soft = async (expr, timeout = 5000) => { try { await app.waitFor(expr, { timeout, label: expr.slice(0, 60) }); return true; } catch { return false; } };
  const open = async ({ w = 1366, h = 768, anon = true, reduced = false, theme = 'flux', tone = 'dark', query = 'flux3=1&reorg=1', hold = null, route = '' } = {}) => {
    process.env.WS_ANON = anon ? '1' : '0';
    await app.emulateDpr(1, w, h);
    await app.emulateMedia([{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }]);
    await app.goto('/');
    await ev(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');
      localStorage.setItem('wrizo-theme', ${JSON.stringify(theme)}); localStorage.setItem('wrizo-theme-prefs', ${JSON.stringify(JSON.stringify({ page: tone }))}); ${hold ? `localStorage.setItem('wrizo-splash-hold', '${hold}');` : ''}
      history.replaceState(null, '', ${JSON.stringify(`/?${query}#/${route}`)}); null`);
    await app.reload();
    await soft("!!document.querySelector('.wz-splash') || !!document.querySelector('.wz-arrival')", 15000);
  };
  const seek = (ms) => ev(`(() => { const s = window.wrizoFluxSplash; if (!s || !s.seek) return false; s.seek(${ms}); return true; })()`);
  const at = async (ms) => { const held = await seek(ms); await sleep(60); return held ? ev(READ) : null; };
  const live = () => soft(`(() => { const r = ${ROOT}; const d = r && r.querySelector('[data-flux-door=compose]'); return !!d && !d.hasAttribute('data-wait'); })()`, 7000);
  const pressDoor = async (id) => {
    const p = await ev(`(() => { const r = ${ROOT}; const d = r && r.querySelector('[data-flux-door=${id}]'); if (!d) return null; const b = d.getBoundingClientRect(); return { x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2) }; })()`);
    if (!p) return false;
    await app.mouseDown(p.x, p.y); await sleep(50); await app.mouseUp(p.x, p.y);
    return true;
  };

  // THE RUN, held at its moments (signed out, 1366)
  await open();
  await soft('!!document.querySelector(".wz-flux5")');
  const first = await at(0), mid = await at(1000), wired = await at(3000), before = await at(3300), end = await at(DONE + 1);
  ok('MS1 the mark is type: W R I Z in Rajdhani 700', end && end.letters.map((l) => l.ch).join('') === 'WRIZ' && end.letters.every((l) => l.tag === 'text' && /Rajdhani/.test(l.family) && l.weight === '700'), end && end.letters);
  ok('MS2 the O is a brass block cursor, there from the first frame, with no letters yet', first && first.cursor && first.cursor.fill === BRASS && first.cursor.shown && first.letters.every((l) => !l.ch), first && { cursor: first.cursor, letters: first.letters });
  ok('MS3 the status line reads WIRING IN and one of the four loading lines, and clears when the doors open', mid && /^WIRING IN/.test(mid.status) && LINES.some((l) => mid.status.toUpperCase().includes(l)) && end.status === '', { mid: mid && mid.status, end: end && end.status });
  ok('MS4 the tagline types in and ends as // FOR HUMANS WHO WRITE', mid && end && mid.tagline.length < end.tagline.length && end.tagline === '// FOR HUMANS WHO WRITE', { mid: mid && mid.tagline, end: end && end.tagline });
  ok('MS5 signal loss hits the mark as the last wire lands (2.9 s), and the cursor does not glitch', wired && wired.glitch === 'signal' && wired.cursor.fill === BRASS && wired.cursor.shown, wired && { glitch: wired.glitch, cursor: wired.cursor });
  ok('MS6 the chart: ten wires, twelve dots, no arrowheads', end && end.wires === 10 && end.dots === 12 && end.arrowheads === 0, end && { wires: end.wires, dots: end.dots, arrowheads: end.arrowheads });
  ok('MS7 brass is on the wires and dots only, never on a box, and FINAL DRAFT does not pop', end && end.brassBoxes === 0 && end.nodeMotion === 0, end && { brassBoxes: end.brassBoxes, nodeMotion: end.nodeMotion });
  ok('MS8 the doors are not live before 3.75 s', before && before.compose && before.compose.wait, before && before.compose);
  ok('MS9 signed out: [ LOG IN ] and [ COMPOSE ], live, with focus on COMPOSE', end && end.login && end.login.cmd === '[ LOG IN ]' && !end.login.wait && end.compose && end.compose.cmd === '[ COMPOSE ]' && !end.compose.wait && end.compose.focused && !end.resume, end && { login: end.login, compose: end.compose, resume: end.resume });
  ok('MS10 the focus ring is 2 px or more on screen', end && end.ringPx >= 2, end && end.ringPx);

  // THE DOORS, for real
  await open();
  const inRun = await soft('!!document.querySelector(".wz-flux5")', 4000);
  if (inRun) { await sleep(300); await app.key('Enter'); }
  ok('MS11 Enter during the run means COMPOSE', inRun && await soft("/^#\\/page\\//.test(location.hash) && !!document.querySelector('.forward-only-editor')", 6000), await ev('location.hash'));

  await open();
  const skipRun = await soft('!!document.querySelector(".wz-flux5")', 4000);
  if (skipRun) { await sleep(300); await app.mouseDown(683, 720); await sleep(40); await app.mouseUp(683, 720); }
  const skipped = skipRun && await live();
  ok('MS12 a click during the run skips to the finished frame and goes nowhere', skipped && /^#\/?$/.test(await ev('location.hash')), await ev('location.hash'));

  await open();
  const canLogin = await live();
  ok('MS13 LOG IN opens the sign-in pop-out', canLogin && await pressDoor('login') && await soft("!!document.querySelector('.wz-popout[data-popout=signin]')", 3000), await ev("!!document.querySelector('.wz-popout')"));

  await open({ anon: false, hold: '50' });
  await soft("typeof window.wrizoCreateJournalPage === 'function'", 20000);
  await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'ms-last', text: 'Her last doc.', createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })}); localStorage.setItem('wrizo-mode-page-ms-last', 'drafting'); window.wrizoFlushNow && window.wrizoFlushNow(); location.hash = '#/page/ms-last'; null`);
  await soft("!!document.querySelector('.forward-only-editor')", 10000);
  await sleep(600);
  await ev("localStorage.removeItem('wrizo-splash-hold'); location.hash = '#/'; null");
  await sleep(300);
  await app.reload();
  const inLive = await live();
  const signedIn = inLive ? await at(DONE + 1) : null;
  ok('MS14 signed in: [ RESUME ] takes LOG IN\'s place', signedIn && signedIn.resume && signedIn.resume.cmd === '[ RESUME ]' && !signedIn.login, signedIn && { resume: signedIn.resume, login: signedIn.login });
  ok('MS15 RESUME opens her last doc', inLive && await pressDoor('resume') && await soft("location.hash === '#/page/ms-last'", 5000), await ev('location.hash'));

  // REDUCED MOTION AND SMALL WINDOWS
  await open({ reduced: true });
  await soft('!!document.querySelector(".wz-flux5")', 3000);
  await live();   // the doors wait only for the session's answer here, never for a run: MS16 below still reads no status, no glitch
  const still = await ev(READ);
  await sleep(1200);
  const stillLater = await ev(READ);
  ok('MS16 reduced motion: the finished frame at once, a steady cursor, no glitch', still && still.compose && !still.compose.wait && still.status === '' && still.cursor.shown && stillLater.cursor.shown && !still.glitch && !stillLater.glitch, still && { compose: still.compose, status: still.status, glitch: still.glitch });

  for (const [w, h] of [[1366, 768], [1024, 560]]) {
    await open({ w, h, reduced: true });
    await soft('!!document.querySelector(".wz-flux5")', 3000);
    const r = await ev(READ);
    ok(`MS17 [${w}x${h}] the door commands are 12 px or more, every other word 10 px or more`, r && r.compose && r.login && r.compose.px >= 12 && r.login.px >= 12 && r.smallest >= 10, r && { compose: r.compose && r.compose.px, login: r.login && r.login.px, smallest: r.smallest });
  }

  // THE IN-APP MARK, both page tones
  for (const tone of ['dark', 'light']) {
    await open({ tone, hold: '50' });
    await soft("typeof window.wrizoCreateJournalPage === 'function'", 20000);
    await soft("!document.querySelector('.wz-splash')", 15000);
    await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id: `ms-${tone}`, text: 'A page.', createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })}); localStorage.setItem('wrizo-mode-page-ms-${tone}', 'drafting'); window.wrizoFlushNow && window.wrizoFlushNow(); location.hash = '#/page/ms-${tone}'; null`);
    await soft("!!document.querySelector('.forward-only-editor')", 10000);
    const has = await soft("!!document.querySelector('[data-flux-appmark]')", 3000);
    const m = has ? await ev(`(() => { const n = document.querySelector('[data-flux-appmark]'), b = n.getBoundingClientRect(), c = n.querySelector('[data-flux-cursor]'); return { left: b.left, top: b.top, word: [...n.querySelectorAll('[data-flux-letter]')].map((l) => l.textContent).join(''), cursor: c ? getComputedStyle(c).fill || getComputedStyle(c).backgroundColor : null }; })()`) : null;
    ok(`MS18 [${tone}] the in-app mark stands top-left, WRIZ with a brass cursor`, m && m.left < 200 && m.top < 80 && m.word === 'WRIZ' && m.cursor === BRASS, m);
    // data-glitch stands on the mark itself (this file's contract) and is rewritten every frame of a glitch, so one glitch is counted once: when the attribute goes from absent to present
    await ev("window.__msSeen = []; window.__msPrev = null; { const m = document.querySelector('[data-flux-appmark] [data-flux-mark]'); if (m) new MutationObserver(() => { const g = m.getAttribute('data-glitch'); if (g && !window.__msPrev) window.__msSeen.push(g); window.__msPrev = g; }).observe(m, { attributes: true, attributeFilter: ['data-glitch'] }); } null");
    await sleep(1200);
    await app.mouseMove(600, 400); await sleep(40);
    await ev('window.__f3MarkIdleShift = 59.2; null');
    await sleep(350);
    const quiet = await ev('window.__msSeen.length');
    ok(`MS19 [${tone}] moving the pointer restarts its 60 s clock`, has && quiet === 0, { fired: quiet });
    await ev('window.__f3MarkIdleShift = 61; null');
    await sleep(3500);
    const seen = await ev('window.__msSeen');
    await ev('window.__f3MarkIdleShift = 0; null');
    ok(`MS20 [${tone}] idle, it glitches, never the same way twice running`, has && seen.length >= 2 && seen.every((g, i) => ['tear', 'decode', 'signal'].includes(g) && g !== seen[i - 1]), seen);
  }

  // CONTROLS (these pass today: they show the harness is driving the app, and the build must keep them)
  // THE WRIZORS' REALS (Fable, Nov 23): (1) the box edges and names are #7EB4C4, not #8FB4AC (the IDEAS edges render from it); (3) the sign-in pop-out's N.01 label is 10 px
  await open();
  await soft('!!document.querySelector(".wz-flux5")');
  await seek(DONE + 1); await sleep(80);
  const cols = await ev(`(() => { const r = document.querySelector('.wz-splash .wz-flux5') || document.querySelector('.wz-flux5'); if (!r) return null; const lit = [...r.querySelectorAll('[data-flux-tile] rect, [data-flux-node] rect')].map((x) => (x.getAttribute('stroke') || '').toUpperCase()); return { tiles: [...r.querySelectorAll('[data-flux-tile] rect')].map((x) => (x.getAttribute('stroke') || '').toUpperCase()), lit, old: r.outerHTML.toUpperCase().includes('#8FB4AC') }; })()`);
  ok('MS21 the lit IDEAS tile edges are #5F8F95 (their own constant), the lit nodes #7EB4C4, and #8FB4AC is nowhere in the drawing', cols && cols.tiles.length === 5 && cols.tiles.every((c) => c === '#5F8F95') && cols.lit.filter((c) => c !== '#2A6A76' && c !== '#5F8F95').every((c) => c === '#7EB4C4') && cols.old === false, cols);
  // MS23 the IDEAS tile edge, MEASURED on one frame (Fable, Nov 23: "draw it at #5F8F95 exactly, and measure it"): the finished frame is screenshotted and the pixels across the first tile's top edge are read back; one of them is #5F8F95 to the channel
  for (const [w, h] of [[1366, 768], [1920, 1080]]) {
    await open({ w, h });
    await soft('!!document.querySelector(".wz-flux5")');
    await seek(DONE + 1); await sleep(150);
    const box = await ev(`(() => { const r = document.querySelector('.wz-flux5 [data-flux-tile] rect'); if (!r) return null; const b = r.getBoundingClientRect(); return { x: Math.round(b.left + b.width / 2), top: b.top, bottom: b.bottom }; })()`);
    const png = await app.screenshot();
    const px = box && await ev(`(async () => { const blob = await fetch('data:image/png;base64,${png}').then((r) => r.blob()); const bm = await createImageBitmap(blob); const c = document.createElement('canvas'); c.width = bm.width; c.height = bm.height; const g = c.getContext('2d'); g.drawImage(bm, 0, 0);
      const out = []; for (let y = Math.floor(${box.top}) - 3; y <= Math.ceil(${box.top}) + 3; y += 1) { const d = g.getImageData(${box.x}, y, 1, 1).data; out.push(['#', ...[d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, '0'))].join('').toUpperCase()); } return out; })()`);
    console.log(`MS23 [${w}] the column of pixels across the first IDEAS tile's top edge (top ${box && box.top}): ${JSON.stringify(px)}`);   // printed on a pass too
    ok(`MS23 [${w}] the IDEAS tile's top edge reads #5F8F95 on a pixel of the finished frame`, !!px && px.includes('#5F8F95'), { top: box && box.top, column: px });
  }
  await open();
  if (await live()) { await pressDoor('login'); await soft("!!document.querySelector('.wz-popout[data-popout=signin]')", 3000); await sleep(300); }
  const tagPx = await ev(`(() => { const t = document.querySelector('.wz-popout .wz-popout-tag') || document.querySelector('.wz-popout-tag'); return t ? { text: t.textContent, px: getComputedStyle(t).fontSize } : null; })()`);
  ok("MS22 the sign-in pop-out's N.01 label is 10 px", tagPx && /N\.01/.test(tagPx.text) && tagPx.px === '10px', tagPx);
  await open({ query: 'flux3=0', hold: '4000' });
  ok('MC1 control: with ?flux3=0 Flux keeps the schematic it has today', await soft("!!document.querySelector('.wz-splash-flux')", 4000) && !(await ev("!!document.querySelector('.wz-flux5')")), await ev("document.querySelector('.wz-splash') ? document.querySelector('.wz-splash').dataset.splashTheme : null"));
  await open({ theme: 'plateau', hold: '4000' });
  ok('MC2 control: Arbor draws none of it', await soft("!!document.querySelector('.wz-splash')", 4000) && !(await ev("!!document.querySelector('.wz-flux5')")));
  await open({ theme: 'machina', hold: '4000' });
  ok('MC3 control: Machina draws none of it', await soft("!!document.querySelector('.wz-splash-machina')", 4000) && !(await ev("!!document.querySelector('.wz-flux5')")));
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); checks.push({ name: 'HARNESS', pass: false, detail: String(e && e.message || e) }); }
if (wasAnon === undefined) delete process.env.WS_ANON; else process.env.WS_ANON = wasAnon;

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nFLUX-MARK-SPLASH VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nFLUX-MARK-SPLASH VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
