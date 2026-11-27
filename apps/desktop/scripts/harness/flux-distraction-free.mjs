// DISTRACTION FREE, FLUX'S OWN ITEMS (the flourish spec §7.2, "Flux also loses"; Fable, Nov 26, 5:45 pm: FIX builds them inside Glitch v2) - on the real default (WS_FLOURISH=1: the saved fact decides).
// The shared items (every meter, the notice, rewards, menus' unrolling, the splash, picker tiles, the theme effects, the page turn) are POLISH's and are not read here.
//   GROUND  the circuit ground and its drifting points go (the room is flat navy), and come back
//   HAND    a menu's current: gone at once when it is switched on with the menu open, and none after
//   SPARK   no current on a stage change
//   MARK    the mark never glitches, and its cursor stands still
//   IDLE    no word or screen glitch however long she is still
//   BOARD   the board's current and electrons stand still; the hologram places at once; the board's cards and links are where they were
//   WIRE    Wire In is a still, dark room: no frames, no rails, no glow, nothing running while she types
//   FRAME   the page frame's brackets never close in; its readouts stay, as text
//   KEEP    the page's rect, her words and her saved settings are the same with it on
//   BACK    off again: everything returns
// Run: node scripts/harness/flux-distraction-free.mjs (from apps/desktop; Actions or the box).
Object.assign(process.env, { WS_REORG: '1', WS_ARBOR2: 'default', WS_MACHINA2: 'default', WS_FLUX3: 'default', WS_FLOURISH: '1', WS_PLACE: '1' });
const { withHarness } = await import('../runtime-verify.mjs');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? '  ' + String(detail).slice(0, 600) : ''}`); };
const J = (v) => JSON.stringify(v);
const ID = 'dfx-page';
const BOARD = 'dfx-board';
const TEXT = Array.from({ length: 8 }, (_, i) => `Paragraph ${i} keeps going along the river under the window of the quiet room.`).join(String.fromCharCode(10));

// everything running now, named by what it moves
const RUNNING = `document.getAnimations().filter((a) => a.playState === 'running').map((a) => { const t = a.effect && a.effect.target; const p = a.effect && a.effect.pseudoElement || '';
  const where = !t ? '?' : t.closest('[data-flux3-room-ground]') ? 'ground' : t.closest('.flux3-corridor') ? 'corridor' : t.closest('[data-flux-mark], .flux5-mark') ? 'mark' : t.closest('.flux3-holo, .board-canvas') ? 'board'
    : t.closest('[data-flux-current]') ? 'spark' : t.closest('[data-flux-hand]') ? 'hand' : t.closest('[data-flux3-idle]') ? 'idle' : t.closest('.flux-brackets') ? 'brackets' : String(t.className && t.className.baseVal === undefined ? t.className : t.tagName).split(' ')[0];
  return where + p + (a.animationName ? ':' + a.animationName : ''); })`;
const OURS = /^(ground|corridor|mark|board|spark|hand|idle|brackets)/;

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const soft = async (expr, timeout = 12000) => { try { await app.waitFor(expr, { label: expr.slice(0, 60), timeout }); return true; } catch { return false; } };
  const df = async (on) => { await ev(`window.wrizoPrefs && window.wrizoPrefs.set('distractionFree', { on: ${on} }); true`); await sleep(700); };
  const running = async () => (await ev(RUNNING)).filter((n) => OURS.test(n));
  const open = async ({ id = ID, mode = 'drafting' } = {}) => {
    await app.emulateDpr(1, 1536, 864);
    await ev('window.__f3IdleShift = 0; window.__f3MarkIdleShift = 0; location.hash = "#/"; true'); await sleep(300);
    await ev(`(() => { const s = JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'); Object.assign(s, { instrumentsOn: true, progress: 'words', themeTracker: true, flicker: true, typewriter: false }); localStorage.setItem('wrizo-writing-settings', JSON.stringify(s));
      localStorage.setItem('wrizo-writing-goal-lines', JSON.stringify({ n: 500, unit: 'words' }));
      const p = JSON.parse(localStorage.getItem('wrizo-reorg-prefs') || '{}'); delete p.writing; delete p.flourishOff; delete p.distractionFree; localStorage.setItem('wrizo-reorg-prefs', JSON.stringify(p));
      localStorage.setItem('wrizo-theme', 'flux'); localStorage.setItem('wrizo-ambiance-dial', '50'); localStorage.setItem('wrizo-mode-page-${id}', ${J(mode)}); history.replaceState(null, '', '/#/page/${id}'); return true; })()`);
    await app.reload();
    await soft(id === BOARD ? "!!document.querySelector('.board-canvas .board-box')" : "!!document.querySelector('.mode-page')");
    await soft("!document.querySelector('.wz-splash')");
    await sleep(1800);
    await app.mouseMove(4, 300);
  };
  const page = () => ev("(() => { const p = document.querySelector('.mode-page').getBoundingClientRect(); const ed = document.querySelector('.forward-only-editor, .draft-editor, [contenteditable=\"true\"]'); return { rect: [Math.round(p.left), Math.round(p.top), Math.round(p.width), Math.round(p.height)], text: ed ? ed.textContent : null }; })()");
  const saved = () => ev("JSON.stringify([localStorage.getItem('wrizo-theme'), localStorage.getItem('wrizo-ambiance-dial'), localStorage.getItem('wrizo-writing-settings')])");

  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); true");
  await app.reload();
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams', timeout: 20000 });
  const at = new Date().toISOString();
  const T = (id, x, y, z, text) => ({ id, kind: 'text', x, y, w: 0.2, h: 0.1, z, text });
  const L = (id, a, b, z) => ({ id, kind: 'connection', x: 0, y: 0, w: 0, h: 0, z, connA: a, connB: b });
  const boxes = [T('d-a', 0.05, 0.05, 1, 'Card A'), T('d-b', 0.55, 0.1, 2, 'Card B'), T('d-c', 0.2, 0.45, 3, 'Card C'), L('d-ab', 'd-a', 'd-b', 4), L('d-ac', 'd-a', 'd-c', 5)];
  await ev(`window.wrizoCreateJournalPage(${J({ id: ID, text: TEXT, createdAt: at, origin: 'loose', source: 'page' })}); window.wrizoCreateJournalPage(${J({ id: BOARD, text: 'A board', pageType: 'board', boxes, createdAt: at, origin: null, source: null })}); window.wrizoFlushNow(); true`);

  // ---- the doc ------------------------------------------------------------------------------------------------------------------------------------
  await open();
  const ground = () => ev("(() => { const g = document.querySelector('[data-flux3-room-ground]'); return g ? { points: g.querySelectorAll('i').length, image: g.style.backgroundImage.slice(0, 8) } : null; })()");
  const g0 = await ground();
  const p0 = await page();
  const s0 = await saved();
  const grip = () => ev("(() => { const g = document.querySelector('.wz-sliver-grip'); if (g) g.click(); return !!g; })()");
  const handOn = () => ev("!!document.querySelector('[data-flux-hand]')");
  await grip(); await sleep(500);
  const hand0 = await handOn();
  await df(true);
  const g1 = await ground();
  const hand1 = await handOn();
  const p1 = await page();
  const s1 = await saved();
  ok('GROUND the circuit and its drifting points are there with it off, and gone with it on', g0 && g0.image === 'url("dat' && g0.points > 0 && g1 === null, J({ g0, g1 }));
  ok('HAND the open menu carried the current; switching it on takes it off at once', hand0 && !hand1, J({ hand0, hand1 }));
  await grip(); await sleep(400); await grip(); await sleep(600);
  const hand2 = await handOn();
  ok('HAND a menu opened with it on draws no current', !hand2, J({ hand2 }));
  await grip(); await sleep(500);

  const stageClick = () => ev("(() => { const t = [...document.querySelectorAll('.desk-mode-tab')].find((b) => b.getAttribute('aria-selected') !== 'true' && b.getAttribute('aria-disabled') !== 'true' && b.getAttribute('data-mode-key') !== 'freewrite'); if (t) t.click(); return t ? t.getAttribute('data-mode-key') : null; })()");
  const runs = () => ev('window.wrizoFluxCurrent ? window.wrizoFluxCurrent.runs : -1');
  const r0 = await runs(); const to = await stageClick(); await sleep(900); const r1 = await runs();
  ok('SPARK a stage change with it on sends no current', !!to && r0 >= 0 && r1 === r0, J({ to, r0, r1 }));

  const markSeen = async () => { await ev("window.__seen = false; window.__mo = new MutationObserver(() => { if (document.querySelector('[data-flux-appmark] [data-flux-mark][data-glitch]')) window.__seen = true; }); window.__mo.observe(document.querySelector('[data-flux-appmark]'), { subtree: true, attributes: true }); window.__f3MarkIdleShift = 120; true"); await sleep(2500); return ev('window.__mo.disconnect(), window.__f3MarkIdleShift = 0, window.__seen'); };
  const cursorAnim = () => ev("(() => { const c = document.querySelector('[data-flux-appmark] [data-flux-cursor]'); return c ? getComputedStyle(c).animationName : 'no cursor'; })()");
  await sleep(2000);
  const m1 = await markSeen();
  const c1 = await cursorAnim();
  ok('MARK with it on the mark never glitches and its cursor stands still', m1 === false && c1 === 'none', J({ glitched: m1, cursor: c1 }));

  await ev('window.__f3IdleShift = 1000'); await sleep(3500);
  const idle1 = await ev("document.querySelectorAll('.flux3-idle-word, .flux3-glitch-band').length");
  await ev('window.__f3IdleShift = 0');
  ok('IDLE with it on nothing glitches after 15 minutes still', idle1 === 0, J({ idle1 }));

  const run1 = await running();
  ok('CENSUS on the doc with it on, nothing of Flux is running', run1.length === 0, J(run1));
  const readouts = await ev("[...document.querySelectorAll('.flux-readout, [class*=\"flux3-head\"], [data-flux3-readout]')].map((e) => (e.textContent || '').trim()).filter(Boolean).slice(0, 6)");
  ok('FRAME the readouts stay, as text', readouts.length > 0, J(readouts));
  ok('KEEP the page rect, her words and her saved settings are the same with it on', J(p1) === J(p0) && s1 === s0 && !!p0.text, J({ p0: p0.rect, p1: p1.rect, same: s1 === s0 }));

  await df(false); await sleep(1200);
  const g2 = await ground();
  const m2 = await markSeen();
  const c2 = await cursorAnim();
  await grip(); await sleep(500);
  const hand3 = await handOn();
  await grip(); await sleep(400);
  const r2 = await runs(); await stageClick(); await sleep(900); const r3 = await runs();
  ok('BACK off again: the ground and its points, the menu current, the stage current, the mark and its cursor all return', g2 && g2.points > 0 && hand3 && r3 > r2 && m2 === true && c2 === 'flux5-blink', J({ g2, hand3, r2, r3, m2, c2 }));

  // ---- a page opened with it already on: the brackets never close in ----------------------------------------------------------------------------
  await open();
  await df(true);
  await ev("location.hash = '#/'; true"); await sleep(500); await ev(`location.hash = '#/page/${ID}'; true`); await sleep(120);
  const acq = await ev("(() => { const b = document.querySelector('.flux-readouts .flux-brackets'); return b ? b.getAttribute('data-acquire') : null; })()");
  ok('FRAME the brackets do not close in on a page opened with it on', acq === 'false' || acq === null, J({ acq }));
  await df(false);

  // ---- a board --------------------------------------------------------------------------------------------------------------------------------------
  const sample = () => ev("[...document.querySelectorAll('[data-flux3-layer] canvas')].map((c) => c.toDataURL()).join('|')");
  const moves = async () => { await sleep(2200); const a = await sample(); await sleep(450); const b = await sample(); await sleep(450); const c = await sample(); return a !== b || b !== c; };
  const cards = () => ev("[...document.querySelectorAll('.board-canvas .board-box[data-box-id]')].map((e) => [e.getAttribute('data-box-id'), e.offsetLeft, e.offsetTop].join(':')).sort().join(' ')");
  await open({ id: BOARD });
  const b0 = await moves();
  const k0 = await cards();
  await df(true);
  const b1 = await moves();
  const k1 = await cards();
  const run2 = await running();
  ok('BOARD the board layer moves with it off and stands still with it on; the cards are where they were; nothing of Flux is running', b0 === true && b1 === false && k1 === k0 && !!k0 && run2.length === 0, J({ off: b0, on: b1, same: k1 === k0, run2 }));
  const stackTab = await ev("(() => { const t = document.querySelector('[data-flux3-stack-tab]'); if (t) t.click(); return !!t; })()");
  await sleep(150);
  const holo = await ev("(() => { const h = document.querySelector('.flux3-holo'); return h ? h.getAttribute('data-still') : 'none'; })()");
  const run3 = await running();
  ok('BOARD the stack places at once with it on (no flight, no fade)', stackTab && holo === 'true' && run3.length === 0, J({ stackTab, holo, run3 }));
  await df(false); await sleep(600);
  const holo2 = await ev("(() => { const h = document.querySelector('.flux3-holo'); return h ? h.getAttribute('data-still') : 'none'; })()");
  ok('BACK off again: the hologram may move', holo2 === null, J({ holo2 }));

  // ---- Wire In --------------------------------------------------------------------------------------------------------------------------------------
  const type = () => ev("(() => { for (let i = 0; i < 12; i++) setTimeout(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true })), i * 100); return true; })()");
  const corridor = () => ev("(() => { const c = document.querySelector('.flux3-corridor'); return c ? { frames: c.querySelectorAll('.flux3-cor-frame').length, rails: c.querySelectorAll('.flux3-cor-rails').length, glow: c.querySelectorAll('.flux3-cor-glow').length, ground: getComputedStyle(c).backgroundColor } : null; })()");
  await open({ mode: 'journal' });
  await soft("!!document.querySelector('.flux3-corridor .flux3-cor-frame')");
  const w0 = await corridor();
  await df(true);
  await type(); await sleep(900);
  const w1 = await corridor();
  const run4 = await running();
  ok('WIRE with it off the corridor stands; with it on a still, dark room: no frames, rails or glow, and nothing running as she types', w0 && w0.frames >= 8 && w1 && w1.frames === 0 && w1.rails === 0 && w1.glow === 0 && w1.ground === 'rgb(2, 12, 16)' && run4.length === 0, J({ w0, w1, run4 }));
  await sleep(600);
  await df(false); await sleep(700);
  await type(); await sleep(900);
  const w2 = await corridor();
  const run5 = await running();
  ok('BACK off again: the corridor returns and runs as she types', w2 && w2.frames >= 8 && w2.rails === 1 && run5.some((n) => n.startsWith('corridor')), J({ w2, run5: run5.slice(0, 3) }));
}); } catch (e) { ok('the run completed', false, e && e.stack || String(e)); }

const bad = checks.filter((c) => !c.pass).length;
if (process.env.HARNESS_PARKED === '1') console.log('\nFLUX-DISTRACTION-FREE PARKED: PASS (0 records) - a new file; it parks nothing of its own');
console.log(bad ? `\nFLUX-DISTRACTION-FREE VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nFLUX-DISTRACTION-FREE VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
