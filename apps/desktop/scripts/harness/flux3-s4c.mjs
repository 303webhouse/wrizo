// FLUX3 S4 - THE CORRIDOR (Nick, Nov 9: Style B, "Love the grid"; flux-jacked-in-concepts.md). The Corridor replaces r13's tunnel; flux3-s4.mjs stays on
// flux3/s4 @ 748b0a8b as the record of that turn. Every check below is the concepts file's own sentence, read in the live page behind ?flux3=1.
//   DEF       Flux Free Write opens Jacked In (zoomed, marked) and is ALWAYS DARK: data-page is dark while jacked even with the writer's saved Page = light,
//             and her saved preference is back on leaving (and untouched in storage).
//   CHROME    no rail, strip, corkboard, hands' anchors or Glitch bar while jacked in (computed opacity 0, no pointer); the page's rect does not move
//             (page primacy); Esc brings them back.
//   COR       the corridor: nine stepping frames (eight stand at once) + the lime and brass ones + one SVG of rails and ribs; every animation is transform or opacity (the compositor's); no canvas.
//   WINDOW    (B1) the corridor is the WHOLE WINDOW: fixed, the ground colour at the window's corners and where the room and the sheet used to show, and no leftover 1 px edge at x 422.
//   STRENGTH  (B3) the eight frames stand at the video's depths (half-widths 0.91 .47 .32 .24 .19 .16 .14 .12 of the screen's half) at its line strengths (nearest ~2.85:1, next two ~1.7, far five ~1.25);
//             the rails and ribs are ONE still picture (no animation on them).
//   ROW-SCALE (B4) each finished row is ONE holder scaled as a whole about the corridor's centre line (7.5% a row, floor 40%); the words inside carry no transform of their own.
//   GLOW-*    (B2, Nick 3:43 pm) the glow BUILDS with the goal: 0 at the start of a lap, ~25% / ~50% of the recipe at a quarter / half of the goal, the whole recipe at the goal (12% at the centre, 4% at 55%,
//             none at the edge, never above 14%, a mutant at 16% goes RED); none when no goal is set; the quiet lane is BELOW the glow.
//   MARK      (B5) the WRIZO mark is hidden for the whole Jacked In session, at rest too.
//   EXIT      (B6) the exit line shows ~3 s then goes, 4.5:1 or better, names the key that actually leaves (the line's key is pressed and leaves), through the lexicon.
//   NUDGE     the 4 s nudge: one line below her text after 4 s of stillness, her next key clears it, never in BUILD or another theme, quiet colour, removal is one small change.
//   LEAVE-X   (Nick 3:43 pm) the circled X: pointer movement shows it, a key hides it (no timer), a click = BUILD on the same doc, a real button with a lexicon name, 40 px, 24 px in, 3:1 or better, not brass.
//   CARET-N / DIM / DOTS   the caret is a block as wide as an "n"; the veil's dim is ~#8C989C; the milestone's earned letters are lime, the newest brass, the unearned dots at 4.5:1.
//   PACE      speed follows her pace: playbackRate is set at most 4 times a second, rises while she types fast, and is 0 (the frames hold still: a frame's
//             transform is the same 600 ms apart) after she stops.
//   ROWS      only this session's lines compile (none of the seeded text: its words are zq<n>), the signal rows step back at an even step (-7.5% block
//             height, -15% opacity a row), six rows at most.
//   CARET     a press mid-page in Typewriter puts the caret at the END of her text (the page's end), never mid-page.
//   MUT-*     each reader must be able to go red: the same read, after a change landed in the page (the chrome forced visible, the tone light, the glow
//             token changed, a frame removed), fails; a mutant that did not land fails the run.
//   GLOW      --f3-goal-glow is #57D0F5 at 12% -> 4% -> 0 (never above 14%).
//   POP       at a milestone, one brass letter pops under her line (the CHECKPOINT word, the newest letter brass), the corridor goes brass for ~0.3 s, and it
//             fades; no number on screen.
//   L         the Jacked In arm against the control, SIX interleaved rounds (the 6-round method): J median <= C median + C's spread, p95 likewise, no key over
//             100 ms. The method is proved on the box's own noise: the control against itself is GREEN, and +5 ms and +10 ms added to every key (a landed
//             busy-wait in the key path, in the arm under test only) are RED. (information on Actions; the box judges.)
// FLUX3_SHOTS=<dir> writes the frames. Run: node scripts/harness/flux3-s4c.mjs (from apps/desktop; a box turn or Actions).
import fs from 'node:fs';
import path from 'node:path';
import { withHarness } from '../runtime-verify.mjs';
import { makeL } from '../lib/l-method.mjs';

const SHOTS = process.env.FLUX3_SHOTS || null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const ON_BOX = process.env.GITHUB_ACTIONS !== 'true';
// the seeded (older) text is made of words no session line uses (zq<n>), so a compiled word names its own source
const PARA = Array.from({ length: 24 }, (_, i) => `zq${i}`).join(' ');
const SEED = Array.from({ length: 10 }, () => PARA).join('\n');
const LAT_TEXT = Array.from({ length: 150 }, (_, i) => 'word' + i).join(' ');
const CYCLE = 'the signal holds while she writes on ';
const LINE = ' and the corridor keeps going forward with more plain words now, on and on across the measure of the page until it wraps again and again, line after line';
const ONLY_L = process.env.FLUX3_ONLY_L === '1';   // the control plan's L-only run: the method alone, on whatever tree is built
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const r1 = (x) => (x === null || x === undefined ? null : Math.round(x * 10) / 10);

const INSTRUMENT = `(() => {
  if (window.__f4) return;
  const I = window.__f4 = { keys: [], rates: [], first: null };
  window.__wzVerifyFlashes = true; window.__wzVerifyCompile = true;
  addEventListener('keydown', () => I.keys.push(performance.now()), true);
  const upr = Animation.prototype.updatePlaybackRate;
  Animation.prototype.updatePlaybackRate = function (r) { const tg = this.effect && this.effect.target; if (tg && tg.closest && tg.closest('[data-flux3-corridor]')) I.rates.push([performance.now(), r]); return upr.call(this, r); };
  I.ed = () => document.querySelector('.forward-only-editor');
  I.toEnd = () => { const ed = I.ed(); if (!ed) return false; ed.focus(); const s = getSelection(); s.selectAllChildren(ed); s.collapseToEnd(); return true; };
  I.caretBefore = () => { const ed = I.ed(), s = getSelection(); if (!ed || !s || !s.rangeCount || !ed.contains(s.anchorNode)) return null; const r0 = s.getRangeAt(0); const pre = document.createRange(); pre.selectNodeContents(ed); pre.setEnd(r0.startContainer, r0.startOffset); return { before: pre.toString().length, total: ed.textContent.length }; };
  I.st = () => { const col = document.querySelector('.mode-pagecol'), r = document.documentElement; const pg = document.querySelector('.mode-page'); const pr = pg && pg.getBoundingClientRect();
    return { theme: r.getAttribute('data-theme'), flag: r.hasAttribute('data-flux3'), jacked: r.hasAttribute('data-flux3-jacked'), looking: r.hasAttribute('data-flux3-looking'), tone: r.getAttribute('data-page'), zoom: col ? col.getAttribute('data-zoom') : null,
      rect: pr ? [Math.round(pr.left), Math.round(pr.top), Math.round(pr.width), Math.round(pr.height)] : null }; };
  I.chrome = () => { const sel = ['.desk-rail', '.desk-frame-strip', '.desk-frame-corkboard', '.desk-frame-sliver-anchor', '.flux3-glitchbar', '.chrome-handle'];
    return sel.map((s) => { const e = document.querySelector(s); if (!e) return [s, null, null]; const c = getComputedStyle(e); return [s, +c.opacity, c.pointerEvents]; }); };
  I.rows = () => { const L = document.querySelector('[data-flux3-compile]'); if (!L) return null;
    return [...L.querySelectorAll('.flux3-compile-word')].map((g) => ({ word: g.dataset.word, row: +g.dataset.row, k: g.parentElement ? +g.parentElement.dataset.k : null, op: g.parentElement ? +g.parentElement.style.opacity : null })); };
  // the exit line's life: when it was added to the page, when it went (removed or invisible), and what it looked like when it came
  I.exit = { addedAt: null, goneAt: null, text: null, color: null, firstOpacity: null, mounts: 0 };
  new MutationObserver(() => { const e = document.querySelector('.flux3-exit-line'); if (e && I.exit.addedAt === null) { I.exit.addedAt = performance.now(); I.exit.text = e.textContent; const c = getComputedStyle(e); I.exit.color = c.color; I.exit.firstOpacity = +c.opacity; }
    if (!e && I.exit.addedAt !== null && I.exit.goneAt === null) I.exit.goneAt = performance.now(); }).observe(document, { childList: true, subtree: true });
  I.nudgeAt = null; I.nudgeGoneAt = null;
  I.mountAt = null; new MutationObserver(() => { if (I.mountAt === null && document.querySelector('[data-flux3-corridor]')) I.mountAt = performance.now(); const n = document.querySelector('.flux3-nudge'); if (n && I.nudgeAt === null) I.nudgeAt = performance.now(); if (!n && I.nudgeAt !== null && I.nudgeGoneAt === null) I.nudgeGoneAt = performance.now(); }).observe(document, { childList: true, subtree: true });
})()`;

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const mouse = (type, x, y) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'mouse' });
  const click = async (x, y) => { await app.mouseMove(x, y); await mouse('mousePressed', x, y); await mouse('mouseReleased', x, y); };
  const snap = async (name) => { if (SHOTS) fs.writeFileSync(path.join(SHOTS, `${name}.png`), Buffer.from((await app.cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64')); };
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 15000, label: 'splash gone' }).catch(() => {});
  const st = () => ev('window.__f4.st()');
  const type = async (text, gap = 40) => { for (const ch of text) { await app.typeKeys(ch); await sleep(gap); } };
  await app.cdp('Page.addScriptToEvaluateOnNewDocument', { source: INSTRUMENT });
  await app.emulateDpr(1, 1920, 1080);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','flux');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await splashGone();
  const mk = (row) => ev(`window.wrizoCreateJournalPage(${JSON.stringify(row)})`);
  let seq = 0;
  const fresh = async (text, id = `f3s4c-${Date.now()}-${seq += 1}`) => { await mk({ id, text, createdAt: new Date().toISOString(), origin: 'loose', source: 'page' }); await sleep(300); return id; };
  const open = async ({ id, flag = true, tone = 'light', dial = 50, prefs = {}, reduced = false, mode = null } = {}) => {
    await ev(`(() => { const p = JSON.parse(localStorage.getItem('wrizo-theme-prefs') || '{}'); p.page = ${JSON.stringify(tone)}; localStorage.setItem('wrizo-theme-prefs', JSON.stringify(p));
      localStorage.setItem('wrizo-theme', 'flux'); localStorage.setItem('wrizo-ambiance-dial', ${JSON.stringify(String(dial))});
      const w = JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'); Object.assign(w, { flicker: true, progressStyle: 'bar', progress: 'words', instrumentsOn: true, typewriter: false }, ${JSON.stringify(prefs)}); localStorage.setItem('wrizo-writing-settings', JSON.stringify(w));
      ${mode ? `localStorage.setItem('wrizo-mode-page-${id}', ${JSON.stringify(mode)});` : `localStorage.removeItem('wrizo-mode-page-${id}');`} })()`);
    await app.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }] });
    await ev(`history.replaceState(null, '', ${JSON.stringify(flag ? '/?flux3=1' : '/')} + '#/page/${id}')`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 15000, label: 'the page' }).catch(() => {});
    await splashGone();
    await ev('window.__f4.toEnd()');
    await app.mouseMove(8, 8);
    await sleep(1600);
  };

  const doL = async () => {
  // ---- L: the Jacked In arm against the control (six interleaved rounds, TWO readings, scripts/lib/l-method.mjs) ---------------------------------------------
  // J: Jacked In with the Corridor. C: the control (Flux, flag off, the Typewriter on). On `main` (ONLY_L) the method runs alone: the control against itself, then the +5 / +10 ms mutants.
  if (ON_BOX || process.env.FLUX3_L === '1') {
    const L = makeL({
      app, ev, sleep, cycle: CYCLE,
      prepare: async (arm, on) => {
        const id = await fresh(LAT_TEXT);
        const jacked = arm === 'J' && on;
        await open({ id, tone: 'dark', flag: jacked, prefs: jacked ? {} : { typewriter: true } });
        const s = await st();
        return { flag: s.flag, zoom: s.zoom, jacked: s.jacked };
      },
      stoodRight: (arm, on, stood) => !!stood && (arm === 'J' && on ? stood.flag && stood.jacked : !stood.flag) && stood.zoom === 'true',
    });
    await L.run(ok, { subject: 'Corridor', onlyMethod: ONLY_L });
  } else console.log('INFO L (Actions: timing is the box\'s to judge; FLUX3_L=1 runs it here)');
  };
  if (ONLY_L) { await doL(); } else {
  // ---- DEF: Jacked In, always dark --------------------------------------------------------------------------------------------------------------
  const pid = await fresh(SEED);
  await open({ id: pid, tone: 'light' });
  const a = await st();
  const stored = await ev("JSON.parse(localStorage.getItem('wrizo-theme-prefs') || '{}').page");
  ok('DEF Flux Free Write opens Jacked In (zoomed, marked) and is ALWAYS DARK even with the saved Page = light', a.flag && a.theme === 'flux' && a.jacked && a.zoom === 'true' && a.tone === 'dark' && stored === 'light', JSON.stringify({ ...a, stored }));
  await snap('c-entry');

  // ---- CHROME: nothing but the page and the corridor ----------------------------------------------------------------------------------------------
  const readChrome = async () => { const ch = await ev('window.__f4.chrome()'); return { pass: ch.filter(([, o]) => o !== null).length >= 2 && ch.every(([, o, pe]) => o === null || (o === 0 && pe === 'none')), ch }; };
  const chrome = await readChrome();
  ok('CHROME no rail, strip, corkboard, hands or Glitch bar while jacked in (opacity 0, no pointer)', chrome.pass, JSON.stringify(chrome.ch));
  const rect0 = (await st()).rect;
  await sleep(1200);
  ok('CHROME-RECT the page\'s rect does not move while the chrome is away (page primacy)', JSON.stringify(rect0) === JSON.stringify((await st()).rect), JSON.stringify([rect0, (await st()).rect]));

  // ---- COR: the corridor's makeup -----------------------------------------------------------------------------------------------------------------
  const readCor = async () => { const cor = await ev(`(() => { const c = document.querySelector('[data-flux3-corridor]'); if (!c) return null; const fr = [...c.querySelectorAll('.flux3-cor-frame')]; const anims = c.getAnimations({ subtree: true });
    const props = new Set(); anims.forEach((x) => (x.effect.getKeyframes() || []).forEach((k) => Object.keys(k).forEach((p) => { if (!['offset', 'easing', 'composite', 'computedOffset'].includes(p)) props.add(p); })));
    const svg = c.querySelector('svg.flux3-cor-rails'); const cs = getComputedStyle(c); const b = c.getBoundingClientRect();
    const count = (sel) => { const p = svg && svg.querySelector(sel); return p ? (p.getAttribute('d').match(/M/g) || []).length : 0; };
    return { frames: fr.length, stepping: fr.filter((f) => !f.dataset.kind).length, rails: c.querySelectorAll('svg.flux3-cor-rails').length, fan: count('.flux3-cor-fan'), ribs: count('.flux3-cor-ribs'), railAnims: svg ? svg.getAnimations({ subtree: true }).length : -1,
      props: [...props], canvas: c.querySelectorAll('canvas').length, pe: cs.pointerEvents, aria: c.getAttribute('aria-hidden'), first: c === document.querySelector('.mode-stage').firstElementChild, pos: cs.position, box: [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)] }; })()`);
    return { cor, pass: !!cor && cor.frames === 11 && cor.stepping === 9 && cor.rails === 1 && cor.fan >= 20 && cor.ribs >= 100 && cor.railAnims === 0 && cor.first && cor.pe === 'none' && cor.aria === 'true' && cor.props.length > 0 && cor.props.every((p) => p === 'transform' || p === 'opacity') && cor.canvas === 0 }; };
  const corridor = await readCor();
  ok('COR the corridor stands: nine stepping frames (eight at once) + the lime and brass ones, ONE svg of rails (a fan of >= 20) and ribs (>= 100 ticks) with no animation on it, first in the stage, inert; its animations touch only transform and opacity; no canvas', corridor.pass, JSON.stringify(corridor.cor));

  // ---- PACE: speed follows her typing, at most 4 Hz, and holds still when she stops -----------------------------------------------------------------
  await ev('window.__f4.rates.length = 0');
  const t0 = await ev('performance.now()');
  await type(CYCLE + CYCLE, 40);   // ~25 keys a second: a fast typist
  const t1 = await ev('performance.now()');
  const fast = await ev('window.__f4.rates.slice()');
  await sleep(3800);   // she stops: the pace eases to zero in ~1.5 s, and the step in hand is finished (a second at most) so the corridor holds ON A SLOT
  const later = await ev('window.__f4.rates.slice()');
  const lastRate = later.length ? later[later.length - 1][1] : null;
  // the updates come in bursts (one tick calls updatePlaybackRate on every animation), so count the TICKS: distinct times 200 ms apart or more
  const ticks = (rs) => rs.reduce((n, r, i) => (i === 0 || r[0] - rs[i - 1][0] > 150 ? n + 1 : n), 0);
  const perSec = ticks(fast) / Math.max(0.5, (t1 - t0) / 1000);
  const maxRate = Math.max(0, ...fast.map((r) => r[1]));
  const frameT = () => ev("getComputedStyle(document.querySelector('.flux3-cor-frame')).transform");
  const f0 = await frameT(); await sleep(600); const f1 = await frameT();
  ok(`PACE the rate rises while she types fast (max ${r1(maxRate)}), is set at most 4 times a second (${r1(perSec)}/s), and is 0 after she stops (${lastRate}) with the frames holding still`,
    maxRate > 1 && perSec <= 4.6 && lastRate === 0 && f0 === f1, JSON.stringify({ maxRate, perSec, lastRate, f0, f1 }));

  // ---- ROWS: only this session's lines, stepping back --------------------------------------------------------------------------------------------
  await type(LINE + LINE + LINE, 25);
  await app.mouseMove(8, 8);
  // the compile asks the flash budget, which the idle glitch's own flashes can hold at the moment of the pause: it asks again every 200 ms, so the rows come within a few seconds, never lost
  let rowsWait = 0;
  for (; rowsWait < 60; rowsWait += 1) { await sleep(100); if ((await ev("document.querySelectorAll('[data-flux3-compile] .flux3-compile-row').length")) >= 2) break; }
  await sleep(300);
  const compileLog = await ev('(window.__wzCompileLog || []).slice(-4)');
  const rows = await ev('window.__f4.rows()');
  const seeded = (rows || []).filter((w) => /^zq\d+$/.test(w.word)).length;
  const sessionOnly = seeded === 0;
  const byRow = new Map(); (rows || []).forEach((w) => { if (!byRow.has(w.row)) byRow.set(w.row, w); });
  const rs = [...byRow.keys()].sort((x, y) => x - y);
  const steps = rs.slice(1).map((k, i) => ({ k: byRow.get(k).k / byRow.get(rs[i]).k, op: byRow.get(k).op - byRow.get(rs[i]).op }));
  ok(`ROWS some of this session's lines compiled (${rs.length} rows), at most six, each a step back (the row's scale x~0.92 of the one before, opacity ~-0.15)`,
    rs.length >= 2 && rs.length <= 6 && rowsWait < 40 && steps.every((s) => s.k > 0.85 && s.k < 1 && s.op < -0.05 && s.op > -0.3), JSON.stringify({ rs, steps, rowsWait, compileLog }));
  // ROW-SCALE (the Wrizors' Corridor B4): each finished row is ONE holder scaled as a whole about the corridor's CENTRE LINE; a word's rendered centre is the centre line + k x its own distance from it
  const READ_ROWS = `(() => { const layer = document.querySelector('[data-flux3-compile]'); if (!layer) return null; const L = layer.getBoundingClientRect(); const s = layer.offsetWidth > 0 ? L.width / layer.offsetWidth : 1; const cxWin = innerWidth / 2;
    return [...layer.querySelectorAll('.flux3-compile-row')].map((hd) => { const k = +hd.dataset.k; const m = /^([0-9.-]+)px/.exec(hd.style.transformOrigin); const originX = m ? +m[1] : null; const words = [...hd.querySelectorAll('.flux3-compile-word')]; let worst = 0;
      words.forEach((w) => { const un = L.left + (parseFloat(w.style.left) + parseFloat(w.style.width) / 2) * s; const r = w.getBoundingClientRect(); worst = Math.max(worst, Math.abs(r.left + r.width / 2 - (cxWin + k * (un - cxWin)))); });
      const wordFree = words.every((w) => getComputedStyle(w).transform === 'none' && [...w.children].every((b) => getComputedStyle(b).transform === 'none'));
      return { row: +hd.dataset.row, k, n: words.length, originOk: originX !== null && Math.abs(L.left + originX * s - cxWin) < 2, worst: +worst.toFixed(2), wordFree, one: getComputedStyle(hd).transform !== 'none' }; }); })()`;
  const rowScale = (rr) => !!rr && rr.length >= 2 && rr.every((x) => x.originOk && x.worst < 2.5 && x.wordFree && x.one && x.n > 0);
  const rr0 = await ev(READ_ROWS);
  const srcJ = fs.readFileSync(new URL('../../src/flux3/FluxJackedIn.tsx', import.meta.url), 'utf8');
  const floorOk = /rowMin: 0\.4/.test(srcJ) && /rowShrink: 0\.075/.test(srcJ) && /rowFade: 0\.15/.test(srcJ);
  ok('ROW-SCALE each finished row is ONE holder (one transform, one opacity) scaled as a whole about the corridor centre line: every word sits at centre + k x its distance, no word or block has a transform of its own; 7.5% a row, floor 40%, 15% fainter', rowScale(rr0) && floorOk, JSON.stringify({ rr0, floorOk }));
  await ev("(() => { const hd = document.querySelector('.flux3-compile-row'); hd.dataset.was = hd.style.transformOrigin; hd.style.transformOrigin = '0px 0px'; })()"); await sleep(120);
  const rrM = await ev(READ_ROWS);
  await ev("(() => { const hd = document.querySelector('.flux3-compile-row'); hd.style.transformOrigin = hd.dataset.was; })()"); await sleep(120);
  ok('MUT-ROW-SCALE the reader goes RED when a row is scaled about its corner instead of the centre line, and green again undone', !rowScale(rrM) && rowScale(await ev(READ_ROWS)), JSON.stringify({ rrM }));
  ok('ROWS-SESSION none of the seeded (older) text became signal: every compiled word is one she typed this session', (rows || []).length > 0 && sessionOnly && seeded === 0, JSON.stringify((rows || []).slice(0, 6)));
  await snap('c-rows');

  // ---- VISIBLE: the line she is writing is INSIDE the page's painted box (found by the frames job, Nov 9: DeskFrame measured the page's room as 0 because the corridor's box was in flow
  // before flux-v3.css arrived; the page clipped to a sliver and hid every line she typed, while every other check here stayed green) ------------------------------------------------
  const readVisible = async () => ev(`(() => { const pg = document.querySelector('.mode-page'), ed = document.querySelector('.forward-only-editor'); if (!pg || !ed) return null;
    const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n, l = null; while ((n = w.nextNode())) l = n; if (!l) return null;
    const g = document.createRange(); g.setStart(l, Math.max(0, l.nodeValue.length - 4)); g.setEnd(l, l.nodeValue.length); const q = g.getBoundingClientRect(), p = pg.getBoundingClientRect();
    const hl = parseFloat(getComputedStyle(document.querySelector('.desk-frame-stage')).getPropertyValue('--wz-page-hl'));
    return { page: [Math.round(p.top), Math.round(p.height)], line: [Math.round(q.top), Math.round(q.height)], hl, inside: q.top >= p.top - 1 && q.bottom <= p.bottom + 1 && p.height > 300 && hl > 100 }; })()`);
  const vis = await readVisible();
  ok('VISIBLE the line she is writing stands inside the page\'s painted box (the page keeps its room: --wz-page-hl > 100, the box taller than 300 px)', !!vis && vis.inside, JSON.stringify(vis));
  await ev("(() => { const p = document.querySelector('.mode-page'); p.style.setProperty('height', '90px', 'important'); })()"); await sleep(150);
  const visMut = await readVisible();
  await ev("document.querySelector('.mode-page').style.removeProperty('height')"); await sleep(150);
  ok('MUT-VISIBLE the reader goes RED on its mutant (the page squeezed to 90 px) and green again undone', !!visMut && !visMut.inside && !!(await readVisible())?.inside, JSON.stringify({ visMut }));

  // ---- CARET: a press anywhere on the page puts the caret at the END of her text ------------------------------------------------------------------
  // two presses: inside the page's own box (mid-page), and in the page's column OUTSIDE the page (Jacked In has no paper edge to aim at)
  const pr = await ev("(() => { const r = document.querySelector('.mode-page').getBoundingClientRect(), c = document.querySelector('.mode-pagecol').getBoundingClientRect(); return { inside: { x: Math.round(r.left + r.width / 2), y: Math.round(Math.max(60, Math.min(innerHeight - 60, r.top + r.height / 2))) }, outside: { x: Math.round(c.left + c.width / 2), y: 330 }, page: [Math.round(r.top), Math.round(r.height)] }; })()");
  const toStart = () => ev("(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const s = getSelection(); s.collapse(ed.firstChild || ed, 0); return true; })()");
  await toStart();
  await click(pr.outside.x, pr.outside.y);
  await sleep(400);
  const cbOut = await ev('window.__f4.caretBefore()');
  await toStart();
  const rc = pr.inside;
  await click(rc.x, rc.y);
  await sleep(400);
  const cb = await ev('window.__f4.caretBefore()');
  const hit = await ev(`(() => { const e = document.elementFromPoint(${rc.x}, ${rc.y}); return e ? String(e.className || e.tagName).slice(0, 60) : null; })()`);
  ok('CARET a press mid-page in Typewriter puts the caret at the END of her text', !!cb && cb.before >= cb.total - 1 && !!cbOut && cbOut.before >= cbOut.total - 1, JSON.stringify({ cb, cbOut, hit, pr }));

  // ---- GLOW: one token, the lighter blue ----------------------------------------------------------------------------------------------------------
  const readGlow = async () => { const glow = await ev("getComputedStyle(document.documentElement).getPropertyValue('--f3-goal-glow').trim()");
    const alphas = [...glow.matchAll(/rgb\(\s*87 208 245\s*\/\s*([\d.]+)\s*\)/g)].map((m) => +m[1]);
    return { glow, pass: alphas.length === 2 && alphas[0] === 0.12 && alphas[1] === 0.04 && alphas.every((x) => x <= 0.14) && /transparent 100%\)/.test(glow) }; };
  const glowNow = await readGlow();
  ok(`GLOW --f3-goal-glow is #57D0F5 at 12% then 4%, none at the edge, never above 14% (${glowNow.glow})`, glowNow.pass, glowNow.glow);

  // ---- MUT: each reader goes red on its own mutant (a change landed in the page, then the SAME read; undone after) -------------------------------------
  const readDark = async () => (await ev("document.documentElement.getAttribute('data-page')")) === 'dark';
  const mutants = [
    ['tone light', "document.documentElement.setAttribute('data-page', 'light')", "document.documentElement.setAttribute('data-page', 'dark')", async () => !(await readDark())],
    ['chrome visible', "document.querySelectorAll('.desk-rail,.desk-frame-strip,.desk-frame-corkboard,.flux3-glitchbar,.chrome-handle').forEach((e) => { e.style.setProperty('opacity', '1', 'important'); e.style.setProperty('pointer-events', 'auto', 'important'); })", "document.querySelectorAll('.desk-rail,.desk-frame-strip,.desk-frame-corkboard,.flux3-glitchbar,.chrome-handle').forEach((e) => { e.style.removeProperty('opacity'); e.style.removeProperty('pointer-events'); })", async () => !(await readChrome()).pass],
    ['glow 20%', "document.documentElement.style.setProperty('--f3-goal-glow', 'radial-gradient(ellipse at center, rgb(87 208 245 / .2) 0%, rgb(87 208 245 / .04) 55%, transparent 100%)')", "document.documentElement.style.removeProperty('--f3-goal-glow')", async () => !(await readGlow()).pass],
    ['a frame removed', "(() => { const f = document.querySelector('.flux3-cor-frame'); window.__mutFrame = f; f.style.display = 'none'; f.className = 'x'; })()", "(() => { const f = window.__mutFrame; if (f) f.className = 'flux3-cor-frame'; if (f) f.style.display = ''; })()", async () => !(await readCor()).pass],
  ];
  for (const [name, apply, undo, red] of mutants) {
    await ev(apply); await sleep(150);
    const wentRed = await red();
    await ev(undo); await sleep(900);   // the chrome's own fade (0.6 s) back to nothing
    ok(`MUT-${name.toUpperCase().replace(/ /g, '-')} the reader goes RED on its mutant (${name}) and green again undone`, wentRed && (await readDark()) && (await readChrome()).pass && (await readGlow()).pass && (await readCor()).pass, name);
  }

  // ---- POP: a milestone ---------------------------------------------------------------------------------------------------------------------------
  const gid = await fresh(Array.from({ length: 49 }, (_, i) => `w${i}`).join(' '));
  await open({ id: gid, tone: 'dark' });
  // the corridor's brass tint lasts ~0.3 s and may come while she is still typing: an observer records it from before the first key
  await ev("(() => { const c = document.querySelector('[data-flux3-corridor]'); window.__popSeen = []; if (c) new MutationObserver(() => window.__popSeen.push([Math.round(performance.now()), c.hasAttribute('data-pop')])).observe(c, { attributes: true, attributeFilter: ['data-pop'] }); return !!c; })()");
  await type(' one two three', 30);
  let pop = null, brass = false;
  for (let i = 0; i < 30 && !pop; i += 1) { await sleep(60); pop = await ev(`(() => { const p = document.querySelector('[data-flux3-pop]'); if (!p) return null; const cc = (e) => (e ? getComputedStyle(e).color : null); const ks = [...p.children]; return { letters: ks.map((s) => s.textContent).join(''), news: ks.filter((s) => s.dataset.new).length, newColour: cc(p.querySelector('[data-new]')), earnedColour: cc(ks[0]), dotColour: cc(ks[ks.length - 1]), text: p.textContent.replace(/[A-Z\u00B7]/g, '').trim() }; })()`); }
  const seen = await ev('window.__popSeen.slice()');
  const onAt = seen.find((s) => s[1]), offAt = seen.find((s) => !s[1] && onAt && s[0] > onAt[0]);
  brass = !!onAt && !!offAt && offAt[0] - onAt[0] >= 200 && offAt[0] - onAt[0] <= 500;
  await snap('c-pop');
  await sleep(2600);
  const gone = await ev("!document.querySelector('[data-flux3-pop]')");
  const lumc = (c) => { const m = /(\d+),\s*(\d+),\s*(\d+)/.exec(c || ''); if (!m) return null; const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * lin(+m[1]) + 0.7152 * lin(+m[2]) + 0.0722 * lin(+m[3]); };
  const GROUND_L = lumc('rgb(2, 12, 16)');
  const crOn = (c) => { const l = lumc(c); return l === null ? null : (Math.max(l, GROUND_L) + 0.05) / (Math.min(l, GROUND_L) + 0.05); };
  const dotsOk = !!pop && pop.letters === 'CH' + '·'.repeat(8) && (crOn(pop.dotColour) || 0) >= 4.5 && /183, 255, 60/.test(pop.earnedColour || '');
  ok('POP a milestone pops one brass letter of CHECKPOINT (the newest) after the earned lime one, the unearned ones are DOTS at 4.5:1 or better (no ghost letters), no number, the corridor goes brass for ~0.3 s, and the word fades',
    !!pop && dotsOk && pop.news === 1 && /255, 152, 0/.test(pop.newColour || '') && pop.text === '' && brass && gone, JSON.stringify({ pop, brass, seen, gone, dotContrast: pop && crOn(pop.dotColour) }));

  // ---- THE MODE (draft 21 §6, Nick Nov 9): JACK IN is the free-writing mode; BUILD never offers it; Esc tap or F9 leaves to BUILD ---------------------------
  // SUPERSEDED (Nov 9): the first ESC check here read "Esc looking up brings the chrome back (the marks lift)" (data-flux3-looking, S4's Esc). Esc now LEAVES Jacked In for BUILD on
  // the same doc (a tap; a hold is the browser's full-screen exit), so that behaviour no longer exists; its successors are ESC / ESC-HOLD / F9 below.
  const toggles = () => ev(`document.querySelectorAll('.typewriter-toggle, [data-mode-toggle="typewriter"]').length`);
  const keyTap = async (key, code, vk, heldMs = 40) => {
    await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: vk });
    await sleep(heldMs);
    await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk });
  };
  const left = async (id) => { const s = await st(); const m = await ev(`localStorage.getItem('wrizo-mode-page-${id}')`); const cb = await ev('window.__f4.caretBefore()');
    return { left: !s.jacked && s.zoom !== 'true' && m === 'drafting', s, m, cb }; };
  const jackedOpen = async (text, tone = 'light') => { const id = await fresh(text); await open({ id, tone }); await ev('window.__f4.toEnd()'); await app.mouseMove(8, 8); return id; };

  ok('MODE-NOTOGGLE Free Write in Flux IS Jacked In with no Typewriter toggle offered anywhere on the page (no off inside it)', (await st()).jacked && (await toggles()) === 0, JSON.stringify({ toggles: await toggles() }));

  // ESC: a tap leaves to BUILD on the same doc, the caret at the END of her text, the saved tone back, the chrome back
  const eid = await jackedOpen('first line of her text\nsecond line goes here', 'light');
  await ev("(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const s = getSelection(); s.collapse(ed.firstChild || ed, 0); return true; })()");   // her caret parked at the START: leaving must still end at the end
  const eBefore = await left(eid);
  await keyTap('Escape', 'Escape', 27, 60);
  await sleep(1400);
  const eAfter = await left(eid);
  const eChrome = await ev('window.__f4.chrome()');
  const eVis = await readVisible();
  ok('ESC a tap leaves Jacked In for BUILD on the same doc: the mode is Draft, no Typewriter zoom, the saved (light) tone is back, the caret is at the END and its line is inside the page (visible), the chrome is back, and the reader read "not left" before the press',
    !eBefore.left && eAfter.left && !!eVis && eVis.inside && eAfter.s.tone === 'light' && !!eAfter.cb && eAfter.cb.before >= eAfter.cb.total - 1 && eChrome.filter(([s]) => s !== '.chrome-handle').every(([, o]) => o === null || o > 0.9) && (await toggles()) === 0,
    JSON.stringify({ eBefore: eBefore.left, eAfter, eChrome }));
  // BUILD never offers it: a drafting page opens plain even with the shared Typewriter setting ON, and has no toggle
  const bid = await fresh('a draft page with some words');
  await open({ id: bid, tone: 'dark', mode: 'drafting', prefs: { typewriter: true } });
  const bs = await st();
  ok('BUILD (Draft) is never Jacked In: not marked, no zoom, no Typewriter toggle, even with the shared Typewriter setting on', bs.flag && !bs.jacked && bs.zoom !== 'true' && (await toggles()) === 0, JSON.stringify({ bs, toggles: await toggles() }));
  // ESC-HOLD: a held Esc is the browser's full-screen exit, not a leave
  const hid = await jackedOpen('held escape stays jacked in', 'dark');
  await keyTap('Escape', 'Escape', 27, 750);
  await sleep(900);
  const hs = await left(hid);
  ok('ESC-HOLD an Esc held ~0.75 s is not a tap: still Jacked In (the browser keeps the hold for leaving full screen)', !hs.left && hs.s.jacked, JSON.stringify(hs));
  // F9: the backup for browsers without the Escape lock
  const fid = await jackedOpen('f nine leaves too', 'dark');
  await ev("(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const s = getSelection(); s.collapse(ed.firstChild || ed, 0); return true; })()");
  const fBefore = await left(fid);
  await keyTap('F9', 'F9', 120, 40);
  await sleep(1400);
  const fAfter = await left(fid);
  ok('F9 leaves Jacked In for BUILD on the same doc with the caret at the end (the backup where Esc exits full screen), and the reader read "not left" before', !fBefore.left && fAfter.left && !!fAfter.cb && fAfter.cb.before >= fAfter.cb.total - 1, JSON.stringify({ fBefore: fBefore.left, fAfter }));

  // ================================================================ THE CORRIDOR r2 (the Wrizors' six blockers, Nick's 3:43 pm rulings) ================================================================
  // a screenshot read in the page: pixels at points (the median of a block), scans, contrasts. The shot is the window at 1920 x 1080, DPR 1.
  const shotEval = async (body) => {
    const data = (await app.cdp('Page.captureScreenshot', { format: 'png' })).data;
    return ev(`(async () => { const img = new Image(); img.src = 'data:image/png;base64,${data}'; await img.decode(); const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
      const x = c.getContext('2d'); x.drawImage(img, 0, 0); const D = x.getImageData(0, 0, c.width, c.height); const W = c.width;
      const px = (a, b) => { const i = (b * W + a) * 4; return [D.data[i], D.data[i + 1], D.data[i + 2]]; };
      const med = (cx, cy, r) => { const ch = [[], [], []]; for (let yy = cy - r; yy <= cy + r; yy++) for (let xx = cx - r; xx <= cx + r; xx++) { const p = px(xx, yy); for (let k = 0; k < 3; k++) ch[k].push(p[k]); } return ch.map((a) => { a.sort((m, n) => m - n); return a[a.length >> 1]; }); };
      const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; const lum = (p) => 0.2126 * lin(p[0]) + 0.7152 * lin(p[1]) + 0.0722 * lin(p[2]);
      const cr = (p, q) => (Math.max(lum(p), lum(q)) + 0.05) / (Math.min(lum(p), lum(q)) + 0.05);
      return (() => { ${body} })(); })()`);
  };
  const GR = [2, 12, 16];
  const shortPage = async (text, o = {}) => { const id = await fresh(text); await open({ id, tone: 'dark', ...o }); return id; };

  // ---- WINDOW (B1): the corridor is the whole window; nothing of the room or the sheet shows --------------------------------------------------------------------------------------
  await shortPage('A short older line.');
  await sleep(3200);   // the exit line has gone, the pointer parked
  const PTS = [[40, 400], [1880, 400], [1000, 10], [600, 1070], [40, 100], [1880, 950]];
  const readWin = async () => {
    const box = await ev("(() => { const c = document.querySelector('[data-flux3-corridor]'); const b = c.getBoundingClientRect(); return { box: [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)], pos: getComputedStyle(c).position, w: innerWidth, h: innerHeight }; })()");
    const px = await shotEval(`return ${JSON.stringify(PTS)}.map((p) => med(p[0], p[1], 4));`);
    const dev = px.map((p) => Math.max(...p.map((v, k) => Math.abs(v - GR[k]))));
    return { ...box, px, dev, pass: box.pos === 'fixed' && box.box[0] === 0 && box.box[1] === 0 && box.box[2] === box.w && box.box[3] === box.h && dev.every((d) => d <= 8) };
  };
  const win0 = await readWin();
  ok('WINDOW the corridor is the whole window (fixed, 0,0, the window\'s size) and the ground #020C10 shows at six places where the room\'s navy and the sheet used to (within 8 of it in every channel)', win0.pass, JSON.stringify(win0));
  await ev("(() => { const d = document.createElement('div'); d.id = 'mut-room'; d.style.cssText = 'position:fixed;left:0;top:300px;width:100px;height:200px;background:#101A27;z-index:5;pointer-events:none;'; document.body.appendChild(d); })()"); await sleep(120);
  const winM = await readWin();
  await ev("document.getElementById('mut-room').remove()"); await sleep(120);
  ok('MUT-WINDOW the reader goes RED when the room\'s navy shows at the left edge, and green again undone', !winM.pass && (await readWin()).pass, JSON.stringify({ dev: winM.dev }));
  const readEdge = async () => { const r = await shotEval('let n = 0, bad = 0; for (let y = 179; y <= 750; y += 6) { n += 1; const a = px(422, y), b = px(416, y); if (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) > 14) bad += 1; } return { n, bad };'); return { ...r, pass: r.bad <= Math.ceil(r.n * 0.05) }; };
  const edge0 = await readEdge();
  ok('EDGE no leftover 1 px line at x 422 (the zoomed sheet\'s old left edge): the column at x 422 matches the one 6 px left on 95% of the samples from y 179 to 750', edge0.pass, JSON.stringify(edge0));
  await ev("(() => { const d = document.createElement('div'); d.id = 'mut-edge'; d.style.cssText = 'position:fixed;left:422px;top:179px;width:1px;height:571px;background:#8AA;z-index:5;pointer-events:none;'; document.body.appendChild(d); })()"); await sleep(120);
  const edgeM = await readEdge();
  await ev("document.getElementById('mut-edge').remove()"); await sleep(120);
  ok('MUT-EDGE the reader goes RED when a 1 px line stands at x 422, and green again undone', !edgeM.pass && (await readEdge()).pass, JSON.stringify(edgeM));

  // ---- STRENGTH (B3): eight frames at the video's depths and line strengths; the rails and ribs are one still picture (reduced motion: the frames stand at their places) -------------------------
  await shortPage('A short older line.', { reduced: true });
  await sleep(1500);
  const SCALES = [0, 1, 2, 3, 4, 5, 6, 7].map((j) => 1 / (1.1 + 1.03 * j));
  const readStrength = async () => shotEval(`const S = ${JSON.stringify(SCALES)}; const Wd = innerWidth, Hd = innerHeight, vpx = 0.5 * Wd, vpy = 0.21 * Hd;
    return S.map((s) => { const x = Math.round(vpx - s * vpx), y0 = Math.round(vpy + s * (Hd / 2 - vpy)); const rowBest = []; for (const dy of [-30, -15, 0, 15, 30]) { const y = y0 + dy; const ref = px(x - 10, y); let best = 1; for (let dx = -3; dx <= 3; dx++) best = Math.max(best, cr(px(x + dx, y), ref)); rowBest.push(best); } rowBest.sort((p, q) => p - q); return { s: +s.toFixed(4), x, y: y0, c: +rowBest[2].toFixed(2) }; });`);
  const RANGE = [[2.2, 3.6], [1.4, 2.4], [1.3, 2.2], [1.08, 1.65], [1.08, 1.65], [1.08, 1.65], [1.08, 1.65], [1.08, 1.65]];
  const strengthOk = (rr) => rr.length === 8 && rr.every((r, j) => r.c >= RANGE[j][0] && r.c <= RANGE[j][1]);
  const str0 = await readStrength();
  console.log('S4C STRENGTH (frame j: left-edge midpoint contrast) ' + JSON.stringify(str0.map((r) => r.c)));
  ok('STRENGTH the eight frames stand at the video\'s depths (half-widths 0.91 .47 .32 .24 .19 .16 .14 .12) with its line strengths: nearest 2.2-3.6:1, next two 1.3-2.4, far five 1.08-1.65 (printed: ' + str0.map((r) => r.c).join(' ') + ')', strengthOk(str0), JSON.stringify(str0));
  await ev("(() => { const f = document.querySelector('.flux3-cor-frame[data-slot=\"3\"]'); f.style.display = 'none'; })()"); await sleep(150);
  const strM = await readStrength();
  await ev("(() => { document.querySelector('.flux3-cor-frame[data-slot=\"3\"]').style.display = ''; })()"); await sleep(150);
  ok('MUT-STRENGTH the reader goes RED when one frame is missing (slot 3), and green again undone', !strengthOk(strM) && strengthOk(await readStrength()), JSON.stringify(strM.map((r) => r.c)));

  // ---- GLOW (B2, Nick 3:43 pm): it BUILDS with the goal ------------------------------------------------------------------------------------------------------------------------
  const wordsOf = (n) => Array.from({ length: n }, (_, i) => 'w' + i).join(' ');
  const readGlow2 = () => ev("(() => { const g = document.querySelector('.flux3-cor-glow'); if (!g) return null; const c = document.querySelector('[data-flux3-corridor]'); return { op: +getComputedStyle(g).opacity, bg: getComputedStyle(g).backgroundImage, lineY: parseFloat(c.style.getPropertyValue('--cor-line-y')) }; })()");
  // the colour at a point 660 px left of the middle on her line (off her text): the glow's gradient there is 0.0493 of the recipe's cyan at full progress
  const glowPx = async (g) => (await shotEval(`return med(300, ${Math.round(g.lineY)}, 10);`));
  const glowAt = async (n) => { await shortPage(wordsOf(n)); await sleep(1100); const g = await readGlow2(); return { g, px: g ? await glowPx(g) : null }; };
  const gz = await glowAt(1), g25 = await glowAt(62), g50 = await glowAt(125);
  await shortPage(wordsOf(249)); await sleep(500);
  await type(' one two', 30);
  let g100 = null;
  let tCross = Date.now();
  for (let i = 0; i < 14; i += 1) { await sleep(100); g100 = await readGlow2(); tCross = Date.now(); if (g100 && g100.op > 0.97) break; }
  const g100px = g100 ? await glowPx(g100) : null;   // taken inside the lap's 1.1 s celebration
  // ---- GLOW-AFTER-GOAL (draft 23, 6a.6): at the goal the glow holds at full while CHECKPOINT shows (2 s), eases down over 3 s to 40%, and from then on is 40% + 60% of the fill; it never falls under 40% for the session
  const series = [];
  const t0g = tCross;   // the series is timed from the moment the glow was first seen at full (the goal), not from when this loop starts
  // each sample waits two animation frames first (a transition only advances on frames) and reads the glow's TARGET (data-glow) beside its computed opacity
  for (let i = 0; i < 40; i += 1) { await sleep(250); await ev('new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))'); const g = await readGlow2(); const dg = await ev("(() => { const e = document.querySelector('.flux3-cor-glow'); return e ? +e.getAttribute('data-glow') : null; })()"); series.push({ t: Date.now() - t0g, op: g ? g.op : null, target: dg }); }
  const heldOk = (s) => { const held = s.filter((x) => x.t <= 1700 && x.op !== null); const late = s.filter((x) => x.t >= 7000 && x.op !== null); const mid = s.filter((x) => x.t > 2600 && x.op !== null);
    return held.length >= 1 && held.every((x) => x.op >= 0.93) && late.length >= 4 && late.every((x) => x.op >= 0.37 && x.op <= 0.5) && mid.every((x) => x.op >= 0.37) && s.some((x) => x.t >= 3500 && x.t <= 5500 && x.op < 0.9); };
  console.log('S4C GLOW after the goal: ' + series.filter((x, i) => i % 4 === 0).map((x) => x.t + 'ms ' + (x.op && x.op.toFixed(2)) + ' (target ' + x.target + ')').join(' | '));
  ok('GLOW-AFTER-GOAL after the goal the glow holds at full for ~2 s, eases down over ~3 s, and stands at 40% (+60% of the fill) from then on, never under 40%', heldOk(series), JSON.stringify(series.filter((x, i) => i % 3 === 0)));
  const dropEarly = series.map((x) => ({ t: x.t, op: x.t > 700 ? 0.3 : 1 }));
  const dipLate = series.map((x) => ({ t: x.t, op: x.t > 8000 ? 0.1 : x.op }));
  ok('MUT-GLOW-AFTER-GOAL the reader goes RED when the glow lets go before the hold is over, and when it dips under the 40% floor later', !heldOk(dropEarly) && !heldOk(dipLate) && heldOk(series), '');

  const dB = (a) => (a && gz.px ? a[2] - gz.px[2] : null);
  const near = (v, lo, hi) => v !== null && v >= lo && v <= hi;
  console.log('S4C GLOW opacity 0/25/50/100 = ' + [gz.g, g25.g, g50.g, g100].map((x) => x && x.op).join(' / ') + '; blue channel above the 0% pixel: ' + [dB(g25.px), dB(g50.px), dB(g100px)].join(' / '));
  ok('GLOW-BUILDS the glow reads the goal\'s progress: ~0 at the start of a lap, ~25% at 62 of 250 words, ~50% at 125, the whole recipe (1.0) at the goal (the lap\'s celebration)',
    !!gz.g && gz.g.op < 0.02 && near(g25.g && g25.g.op, 0.22, 0.28) && near(g50.g && g50.g.op, 0.47, 0.53) && !!g100 && g100.op > 0.97, JSON.stringify({ z: gz.g && gz.g.op, a: g25.g && g25.g.op, b: g50.g && g50.g.op, c: g100 && g100.op }));
  ok('GLOW-PIXEL the colour on her line, off her text, rises with the glow: the blue channel is ~+2.8 / +5.6 / +11.3 above the start-of-lap pixel at 25% / 50% / 100% (the recipe\'s gradient there is 4.9%)',
    near(dB(g25.px), 1.5, 4.3) && near(dB(g50.px), 4, 7.6) && near(dB(g100px), 9.3, 13.5), JSON.stringify({ z: gz.px, a: g25.px, b: g50.px, c: g100px }));
  const recipeOk = (bg) => { const al = [...String(bg || '').matchAll(/rgba\(87, 208, 245, ([0-9.]+)\)/g)].map((m) => +m[1]); return al.length === 2 && al[0] === 0.12 && al[1] === 0.04 && al.every((v) => v <= 0.14) && /rgba\(0, 0, 0, 0\)/.test(String(bg)); };
  ok('GLOW-RECIPE at the goal the glow is #57D0F5 at 12% at the centre, 4% at 55%, none at the edge (never above 14%)', recipeOk(g50.g && g50.g.bg), (g50.g && g50.g.bg) || 'no glow');
  await ev("document.documentElement.style.setProperty('--f3-goal-glow', 'radial-gradient(ellipse at center, rgb(87 208 245 / .16) 0%, rgb(87 208 245 / .04) 55%, transparent 100%)')"); await sleep(150);
  const recM = await readGlow2();
  await ev("document.documentElement.style.removeProperty('--f3-goal-glow')"); await sleep(150);
  ok('MUT-GLOW-16 the reader goes RED when the glow is set to 16% (the ruled ceiling is 14%), and green again undone', !recipeOk(recM && recM.bg) && recipeOk((await readGlow2()).bg), JSON.stringify({ bg: recM && recM.bg }));
  // none when no goal is set (the writer clears the target)
  await ev("localStorage.setItem('wrizo-writing-goal-lines', '')");
  await shortPage(wordsOf(125)); await sleep(1000);
  const gNone = await readGlow2();
  await ev("localStorage.removeItem('wrizo-writing-goal-lines')");
  ok('GLOW-NONE with no goal set the glow is 0 even at 125 words', !!gNone && gNone.op === 0, JSON.stringify(gNone));
  // the quiet lane thins the frames and rails only: it is BELOW the glow in the stack, and the glow is not covered
  await shortPage(wordsOf(125)); await sleep(900);
  const readOrder = () => ev("(() => { const c = document.querySelector('[data-flux3-corridor]'); const k = [...c.children]; const lane = k.findIndex((e) => e.classList.contains('flux3-cor-lane')), glow = k.findIndex((e) => e.classList.contains('flux3-cor-glow')), frame = k.findIndex((e) => e.classList.contains('flux3-cor-frame')), rails = k.findIndex((e) => e.classList.contains('flux3-cor-rails')); return { lane, glow, frame, rails, laneBg: getComputedStyle(k[lane]).backgroundImage }; })()");
  const orderOk = (o) => o.rails >= 0 && o.rails < o.lane && o.frame >= 0 && o.frame < o.lane && o.lane >= 0 && o.lane < o.glow && /rgb\(2, 12, 16\)/.test(o.laneBg);
  const ord0 = await readOrder();
  ok('GLOW-LANE the quiet lane (an oval of the ground\'s own colour) covers the rails and frames and sits BELOW the glow, so it never covers it', orderOk(ord0), JSON.stringify(ord0));
  await ev("(() => { const c = document.querySelector('[data-flux3-corridor]'); const g = c.querySelector('.flux3-cor-glow'); g.dataset.was = 'x'; c.insertBefore(g, c.querySelector('.flux3-cor-lane')); })()"); await sleep(120);
  const ordM = await readOrder();
  await ev("(() => { const c = document.querySelector('[data-flux3-corridor]'); c.appendChild(c.querySelector('.flux3-cor-glow')); })()"); await sleep(120);
  ok('MUT-GLOW-LANE the reader goes RED when the glow is put under the lane, and green again undone', !orderOk(ordM) && orderOk(await readOrder()), JSON.stringify(ordM));

  // ---- MARK (B5): the WRIZO mark is hidden for the whole Jacked In session ------------------------------------------------------------------------------------------------------
  await jackedOpen('The mark stays gone while she writes.', 'dark');
  await sleep(2600);
  const readMark = () => ev("(() => { const ms = [...document.querySelectorAll('.brand-mark, .wz-mark, .wz-flux-wordmark')]; return { n: ms.length, shown: ms.filter((m) => { const c = getComputedStyle(m), p = getComputedStyle(m, '::before'); const painted = (c.visibility !== 'hidden' && +c.opacity > 0.01 && m.getBoundingClientRect().width > 0 && m.textContent.trim().length > 0) || (p.content !== 'none' && p.content !== 'normal' && p.visibility !== 'hidden' && +p.opacity > 0.01 && c.display !== 'none' && c.visibility !== 'hidden'); return painted; }).length }; })()");
  const mk0 = await readMark();
  await type('typing, then stopping', 30); await sleep(2600);
  const mk1 = await readMark();
  ok('MARK the WRIZO mark is hidden for the whole Jacked In session: after entering, and again after she types and stops (and there is a mark on this page to hide)', mk0.n >= 1 && mk0.shown === 0 && mk1.n >= 1 && mk1.shown === 0, JSON.stringify({ mk0, mk1 }));
  await ev("document.querySelectorAll('.brand-mark, .wz-mark, .wz-flux-wordmark').forEach((m) => { m.style.setProperty('visibility', 'visible', 'important'); m.style.setProperty('opacity', '1', 'important'); })"); await sleep(120);
  const mkM = await readMark();
  await ev("document.querySelectorAll('.brand-mark, .wz-mark, .wz-flux-wordmark').forEach((m) => { m.style.removeProperty('visibility'); m.style.removeProperty('opacity'); })"); await sleep(120);
  ok('MUT-MARK the reader goes RED when the mark is forced visible, and green again undone', mkM.shown > 0 && (await readMark()).shown === 0, JSON.stringify(mkM));

  // ---- EXIT (B6): the exit line, the first 3 s ---------------------------------------------------------------------------------------------------------------------------------
  const KEYMAP = { Esc: ['Escape', 'Escape', 27], F9: ['F9', 'F9', 120] };
  const namesLeavingKey = (t) => { const m = /·\s*(\S+)\s+TO JACK OUT$/i.exec(String(t || '').trim()); return !!m && !!KEYMAP[m[1][0].toUpperCase() + m[1].slice(1).toLowerCase()]; };
  const readExit = async (reduced) => { await shortPage('exit line', { reduced }); await sleep(reduced ? 3600 : 4400); return ev('window.__f4.exit'); };
  const exN = await readExit(false);
  const life = exN.goneAt !== null && exN.addedAt !== null ? exN.goneAt - exN.addedAt : null;
  const mountGap = await ev('window.__f4.mountAt === null || window.__f4.exit.addedAt === null ? null : window.__f4.exit.addedAt - window.__f4.mountAt');
  ok('EXIT the line is there from entry (first seen at full strength within 0.5 s of the corridor mounting), reads JACKED IN · ESC TO JACK OUT, is gone by ~3.6 s (3 s, then a 0.6 s fade), and is 4.5:1 or better on the ground (printed: life ' + (life && Math.round(life)) + ' ms, ' + (crOn(exN.color) || 0).toFixed(2) + ':1)',
    exN.addedAt !== null && mountGap !== null && mountGap < 500 && exN.firstOpacity > 0.99 && /^JACKED IN · ESC TO JACK OUT$/.test(String(exN.text || '').toUpperCase()) && life !== null && life >= 2900 && life <= 4300 && (crOn(exN.color) || 0) >= 4.5, JSON.stringify({ exN, life, mountGap }));
  const exR = await readExit(true);
  const lifeR = exR.goneAt !== null && exR.addedAt !== null ? exR.goneAt - exR.addedAt : null;
  ok('EXIT-STILL with reduced motion the line is a cut: gone at ~3 s with no fade (printed: ' + (lifeR && Math.round(lifeR)) + ' ms)', lifeR !== null && lifeR >= 2900 && lifeR <= 3500, JSON.stringify({ exR, lifeR }));
  // it names the key that actually leaves: read the key off the line, press THAT key, and the page leaves to BUILD; the handler and the line read one constant
  const named = /·\s*(\S+)\s+to jack out$/i.exec(String(exN.text || '').trim());
  const kid = await jackedOpen('press the named key', 'dark');
  const namedKey = named ? KEYMAP[named[1][0].toUpperCase() + named[1].slice(1).toLowerCase()] : null;
  if (namedKey) { await keyTap(namedKey[0], namedKey[1], namedKey[2], 60); await sleep(1400); }
  const kLeft = await left(kid);
  const srcIn = fs.readFileSync(new URL('../../src/flux3/FluxJackedIn.tsx', import.meta.url), 'utf8');
  const srcHints = fs.readFileSync(new URL('../../src/flux3/FluxJackedHints.tsx', import.meta.url), 'utf8');
  const srcJack = fs.readFileSync(new URL('../../src/flux3/jackIn.ts', import.meta.url), 'utf8');
  const codeOnly = (s) => s.split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
  const oneSource = /e\.key === LEAVE_KEY\b/.test(srcIn) && /leaveKeyNow\(\)/.test(srcHints) && /export const LEAVE_KEY = 'Escape'/.test(srcJack) && !/jack out/i.test(codeOnly(srcHints)) && /flux3JackedExit/.test(srcHints);
  ok('EXIT-KEY the key the line names is the key that leaves (pressed, it leaves to BUILD), the handler and the line read one constant (jackIn.ts), and the words come through the lexicon (no literal in the component)', !!namedKey && kLeft.left && oneSource && namesLeavingKey(exN.text), JSON.stringify({ named: named && named[1], kLeft: kLeft.left, oneSource }));
  ok('MUT-EXIT the key reader goes RED when the line names a key that does not leave (F4, DEL) and green on the real ones', !namesLeavingKey('JACKED IN · F4 TO JACK OUT') && !namesLeavingKey('JACKED IN · DEL TO JACK OUT') && namesLeavingKey('JACKED IN · ESC TO JACK OUT') && namesLeavingKey('JACKED IN · F9 TO JACK OUT'), '');

  // ---- NUDGE: after 4 s of stillness, one line below her text; her next key clears it; Jacked In only ------------------------------------------------------------------------------
  await jackedOpen('The nudge waits four seconds.', 'dark');
  const readNudge = () => ev(`(() => { const n = document.querySelector('.flux3-nudge'); if (!n) return null; const c = getComputedStyle(n); const cr = document.querySelector('.flux-block-caret'); const q = n.getBoundingClientRect(); const cb = cr ? cr.getBoundingClientRect() : null; return { text: n.textContent, color: c.color, below: cb ? q.top > cb.bottom : null, anim: c.animationName }; })()`);
  let nd = null;
  for (let i = 0; i < 130 && !nd; i += 1) { nd = await readNudge(); if (!nd) await sleep(100); }
  const nTimes = await ev('({ at: window.__f4.nudgeAt, mount: window.__f4.mountAt })');
  const nDelay = nTimes.at !== null && nTimes.mount !== null ? nTimes.at - nTimes.mount : null;
  const notRed = (c) => { const m = /(\d+),\s*(\d+),\s*(\d+)/.exec(c || ''); return !!m && +m[1] <= +m[2]; };
  const nudgeOk = (n) => !!n && /^KEEP THE SIGNAL · ANY WORD WILL DO$/.test(String(n.text).toUpperCase()) && (crOn(n.color) || 0) >= 4.5 && notRed(n.color) && n.below === true;
  ok('NUDGE after 4 s of stillness (counted once the entry line has gone: the earliest ~7.6 s after entry) one quiet line stands below her text: KEEP THE SIGNAL · ANY WORD WILL DO, 4.5:1 or better, not red (printed: shown ' + (nDelay && Math.round(nDelay)) + ' ms after entry)', nudgeOk(nd) && nDelay !== null && nDelay >= 7400 && nDelay <= 9800, JSON.stringify({ nd, nDelay }));
  await app.typeKeys('x'); await sleep(200);
  const ndGone = await readNudge();
  let ndBack = null;
  for (let i = 0; i < 60 && !ndBack; i += 1) { await sleep(100); ndBack = await readNudge(); }
  ok('NUDGE-KEY her next key clears it at once, and after another 4 s of stillness it comes back (no countdown, no penalty)', ndGone === null && nudgeOk(ndBack), JSON.stringify({ ndGone, ndBack }));
  ok('MUT-NUDGE the reader goes RED on a red line, a line that is not below her text and a wrong word, and green on the real one', !nudgeOk({ ...nd, color: 'rgb(255, 0, 0)' }) && !nudgeOk({ ...nd, below: false }) && !nudgeOk({ ...nd, text: 'HURRY UP' }) && nudgeOk(nd), '');
  const exR2 = await readExit(true);   // (a reduced-motion page, to read the nudge's animation)
  let ndR = null;
  for (let i = 0; i < 50 && !ndR; i += 1) { ndR = await readNudge(); if (!ndR) await sleep(100); }
  ok('NUDGE-STILL with reduced motion the nudge is a cut (no fade animation)', !!ndR && ndR.anim === 'none', JSON.stringify({ ndR, exR2: !!exR2 }));
  await shortPage('A draft page with some words', { mode: 'drafting' });
  await sleep(5300);
  const bNone = await ev("({ nudge: document.querySelectorAll('.flux3-nudge').length, exit: document.querySelectorAll('.flux3-exit-line').length, x: document.querySelectorAll('.flux3-leave-x').length, corridor: document.querySelectorAll('[data-flux3-corridor]').length })");
  await ev("localStorage.setItem('wrizo-theme', 'plateau')");
  const aid = await fresh('A page in Arbor');
  await ev(`history.replaceState(null, '', '/?flux3=1#/page/${aid}')`); await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 15000, label: 'the page' }).catch(() => {});
  await sleep(5300);
  const aNone = await ev("({ theme: document.documentElement.getAttribute('data-theme'), nudge: document.querySelectorAll('.flux3-nudge').length, exit: document.querySelectorAll('.flux3-exit-line').length, x: document.querySelectorAll('.flux3-leave-x').length, corridor: document.querySelectorAll('[data-flux3-corridor]').length })");
  await ev("localStorage.setItem('wrizo-theme', 'flux')");
  ok('NUDGE-ONLY the nudge, the exit line and the circled X exist only in Jacked In: none in BUILD (Draft), none in Arbor', bNone.nudge + bNone.exit + bNone.x + bNone.corridor === 0 && aNone.theme !== 'flux' && aNone.nudge + aNone.exit + aNone.x + aNone.corridor === 0, JSON.stringify({ bNone, aNone }));
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : /\.(ts|tsx)$/.test(e.name) ? [path.join(d, e.name)] : []));
  const users = walk(new URL('../../src/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')).filter((p) => /\bFluxNudge\b/.test(fs.readFileSync(p, 'utf8'))).map((p) => path.basename(p)).sort();
  ok('NUDGE-ONE-CHANGE taking the nudge out is one small change: only FluxNudge.tsx itself and FluxJackedHints.tsx (one import, one element) mention it', JSON.stringify(users) === JSON.stringify(['FluxJackedHints.tsx', 'FluxNudge.tsx']), JSON.stringify(users));

  // ---- IDLE-SWITCH and IDLE-STILLNESS (draft 23, 6a.9): the Skin switch "Idle line" (off = never shows) and the two rules (stillness is neither typing nor the pointer moving; the count starts when the entry line has gone) -----
  await ev("(() => { const p = JSON.parse(localStorage.getItem('wrizo-theme-prefs') || '{}'); p.idle = 'off'; localStorage.setItem('wrizo-theme-prefs', JSON.stringify(p)); })()");
  await shortPage('The idle line is switched off.');
  await sleep(9800);
  const idleOff = await ev("({ nudge: document.querySelectorAll('.flux3-nudge').length, at: window.__f4.nudgeAt, prefs: JSON.parse(localStorage.getItem('wrizo-theme-prefs') || '{}').idle })");
  await ev("(() => { const p = JSON.parse(localStorage.getItem('wrizo-theme-prefs') || '{}'); p.idle = 'on'; localStorage.setItem('wrizo-theme-prefs', JSON.stringify(p)); })()");
  await shortPage('The idle line is switched on.');
  await sleep(9800);
  const idleOn = await ev("({ nudge: document.querySelectorAll('.flux3-nudge').length, at: window.__f4.nudgeAt, prefs: JSON.parse(localStorage.getItem('wrizo-theme-prefs') || '{}').idle })");
  const switchOk = (off, on) => off.prefs === 'off' && off.nudge === 0 && off.at === null && on.prefs === 'on' && on.nudge === 1;
  ok('IDLE-SWITCH with the Skin switch "Idle line" OFF the line never shows (9.8 s of stillness), and with it ON (the default) it does', switchOk(idleOff, idleOn), JSON.stringify({ idleOff, idleOn }));
  ok('MUT-IDLE-SWITCH the reader goes RED when the line shows with the switch off, and when it does not show with the switch on', !switchOk({ ...idleOff, nudge: 1, at: 100 }, idleOn) && !switchOk(idleOff, { ...idleOn, nudge: 0 }), '');
  await shortPage('The pointer is not stillness.');
  let movedNudge = 0;
  for (let i = 0; i < 11; i += 1) { await app.mouseMove(300 + i * 40, 500 + (i % 2) * 30); await sleep(1000); movedNudge += await ev("document.querySelectorAll('.flux3-nudge').length"); }
  const afterMoves = await ev('window.__f4.nudgeAt');
  let stillAt = null;
  for (let i = 0; i < 70 && stillAt === null; i += 1) { await sleep(100); if ((await ev("document.querySelectorAll('.flux3-nudge').length")) > 0) stillAt = i; }
  ok('IDLE-STILLNESS the pointer moving is not stillness: no line for 11 s while the pointer moves every second (past the 7.6 s earliest), then it comes within ~4 s of the pointer stopping', movedNudge === 0 && afterMoves === null && stillAt !== null && stillAt < 60, JSON.stringify({ movedNudge, afterMoves, stillAt }));
  const nd2 = await ev(`(() => { const n = document.querySelector('.flux3-nudge'); const c = document.querySelector('.flux-block-caret'); if (!n || !c) return null; const q = n.getBoundingClientRect(), k = c.getBoundingClientRect(); return { cx: Math.round(q.left + q.width / 2), w: innerWidth, lines: +(((q.top + q.height / 2) - (k.top + k.height / 2)) / k.height).toFixed(2) }; })()`);
  const placeOk = (p) => !!p && Math.abs(p.cx - p.w / 2) <= 2 && p.lines >= 1.25 && p.lines <= 1.95;
  ok('IDLE-PLACE the line is centred on the corridor\'s centre line and its centre stands about 1.6 lines below her writing line (printed: ' + (nd2 && nd2.lines) + ' lines)', placeOk(nd2), JSON.stringify(nd2));
  ok('MUT-IDLE-PLACE the reader goes RED when the line is off the centre line or only half a line below', !placeOk({ ...nd2, cx: nd2.cx + 40 }) && !placeOk({ ...nd2, lines: 0.5 }) && placeOk(nd2), '');

  // ---- LEAVE-X (Nick 3:43 pm): the circled X ------------------------------------------------------------------------------------------------------------------------------------------
  const xid = await jackedOpen('The circled X appears with the pointer.', 'dark');
  const readX = () => ev(`(() => { const b = document.querySelector('.flux3-leave-x'); if (!b) return null; const c = getComputedStyle(b); const q = b.getBoundingClientRect(); return { tag: b.tagName, label: b.getAttribute('aria-label'), on: b.hasAttribute('data-on'), op: +c.opacity, pe: c.pointerEvents, color: c.color, trans: c.transitionDuration, rect: [Math.round(q.left), Math.round(q.top), Math.round(q.width), Math.round(q.height)], w: innerWidth, h: innerHeight, tab: b.tabIndex, fill: getComputedStyle(b.querySelector('circle')).fill, arm: Math.round(b.querySelector('path').getBBox().width), title: b.getAttribute('title') }; })()`);
  const shown = (x) => !!x && x.on && x.op > 0.95 && x.pe === 'auto';
  const hidden = (x) => !!x && !x.on && x.op < 0.02 && x.pe === 'none';
  await app.typeKeys('a'); await sleep(500);
  const x1 = await readX();
  await app.mouseMove(1500, 700); await sleep(60); await app.mouseMove(1520, 720); await sleep(500);
  const x2 = await readX();
  await sleep(3000);   // no timer: it stays while she does not type
  const x2b = await readX();
  await app.typeKeys('b'); await sleep(500);
  const x3 = await readX();
  ok('LEAVE-X typing keeps it at opacity 0; pointer movement shows it; it stays (no timer); a key hides it again', hidden(x1) && shown(x2) && shown(x2b) && hidden(x3), JSON.stringify({ x1, x2, x2b, x3 }));
  await app.mouseMove(1500, 700); await sleep(60); await app.mouseMove(1510, 710); await sleep(500);
  const x4 = await readX();
  const lum3 = lumc(x4 && x4.color);
  const inRect = !!x4 && x4.rect[2] === 48 && x4.rect[3] === 48 && x4.rect[0] === x4.w - 20 - 48 && x4.rect[1] === x4.h - 20 - 48;   // the 48 px press area; the 40 px circle stands 24 px in from each edge
  ok('LEAVE-X-LOOK (draft 23, 6a.11) a real button named through the lexicon, a 48 px press area 20 px in from the corner around a 40 px circle 24 px in, FILLED with the ground colour, the X\'s arms 14 px, the hint "<name> (<key>)" naming the key that works, the quiet label colour at 3:1 or better against the ground (not brass), a 0.2 s fade', !!x4 && x4.tag === 'BUTTON' && x4.label === 'Jack out' && inRect && x4.fill === 'rgb(2, 12, 16)' && x4.arm === 14 && / \(Esc\)$/.test(String(x4.title)) && parseFloat(String(x4.trans).split(',')[0]) === 0.2 && (crOn(x4.color) || 0) >= 3 && !/255, 152, 0/.test(x4.color) && /flux3JackedLeave: 'Jack out'/.test(fs.readFileSync(new URL('../../src/store/lexicon/canonical/chrome.ts', import.meta.url), 'utf8')), JSON.stringify({ x4, cr: crOn(x4 && x4.color) }));
  await app.mouseMove(x4.rect[0] + 20, x4.rect[1] + 20); await sleep(400);
  const x5 = await readX();
  ok('LEAVE-X-HOVER hover is Flux\'s choice colour (#00C2FF)', !!x5 && /0, 194, 255/.test(x5.color), JSON.stringify(x5));
  // mutants: the three readers
  await ev("(() => { const b = document.querySelector('.flux3-leave-x'); b.style.setProperty('opacity', '0', 'important'); })()");
  await app.mouseMove(1400, 600); await sleep(60); await app.mouseMove(1410, 610); await sleep(450);
  const xm1 = await readX();
  await ev("document.querySelector('.flux3-leave-x').style.removeProperty('opacity')"); await sleep(300);
  await app.typeKeys('c'); await sleep(450);
  await ev("window.__keepX = setInterval(() => { const b = document.querySelector('.flux3-leave-x'); if (b) b.setAttribute('data-on', ''); }, 20)");
  await app.typeKeys('d'); await sleep(450);
  const xm2 = await readX();
  await ev("clearInterval(window.__keepX); document.querySelector('.flux3-leave-x').removeAttribute('data-on')"); await sleep(400);
  ok('MUT-LEAVE-X the show reader goes RED when the button is kept invisible, and the hide reader goes RED when the button is kept showing through a key', !shown(xm1) && !hidden(xm2), JSON.stringify({ xm1, xm2 }));
  await app.mouseMove(1400, 600); await sleep(60); await app.mouseMove(1420, 620); await sleep(500);
  await ev("document.querySelector('.flux3-leave-x').style.setProperty('pointer-events', 'none', 'important')");
  const xr = await ev("(() => { const b = document.querySelector('.flux3-leave-x').getBoundingClientRect(); return [Math.round(b.left + 20), Math.round(b.top + 20)]; })()");
  await click(xr[0], xr[1]); await sleep(1200);
  const deadClick = await left(xid);
  await ev("document.querySelector('.flux3-leave-x').style.removeProperty('pointer-events')"); await sleep(200);
  await click(xr[0], xr[1]); await sleep(1500);
  const realClick = await left(xid);
  ok('LEAVE-X-CLICK a click is exactly an Esc tap: BUILD on the same doc, the caret at the END, the saved tone back (the reader read "not left" when the button was made dead)', !deadClick.left && realClick.left && !!realClick.cb && realClick.cb.before >= realClick.cb.total - 1, JSON.stringify({ deadClick: deadClick.left, realClick }));
  const rm = await shortPage('reduced motion cut', { reduced: true }); await sleep(800);
  await app.mouseMove(1500, 700); await sleep(60); await app.mouseMove(1520, 720); await sleep(300);
  const xr2 = await readX();
  ok('LEAVE-X-STILL reduced motion is a cut (no transition on the button: every duration under a millisecond)', !!xr2 && String(xr2.trans).split(',').every((d) => parseFloat(d) < 0.001), JSON.stringify(xr2));

  // ---- CARET-N and DIM -----------------------------------------------------------------------------------------------------------------------------------------------------------------
  await jackedOpen('The caret is a block.', 'dark');
  await type('abc', 40); await sleep(400);
  const readCaret = () => ev(`(() => { const c = document.querySelector('.flux-block-caret'); const ed = document.querySelector('.forward-only-editor'); if (!c || !ed) return null; const cs = getComputedStyle(ed); const cv = document.createElement('canvas').getContext('2d'); cv.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily; const k = ed.offsetWidth > 0 ? ed.getBoundingClientRect().width / ed.offsetWidth : 1; return { w: +c.getBoundingClientRect().width.toFixed(2), n: +(cv.measureText('n').width * k).toFixed(2) }; })()`);
  const caretOk = (c) => !!c && c.n > 8 && Math.abs(c.w - c.n) <= 1.5;
  const cN = await readCaret();
  ok('CARET-N in Jacked In the caret is a block as wide as an "n" of the page\'s own font (printed: ' + (cN && cN.w) + ' px against an n of ' + (cN && cN.n) + ' px)', caretOk(cN), JSON.stringify(cN));
  await ev("(() => { const c = document.querySelector('.flux-block-caret'); c.dataset.was = c.style.width; c.style.setProperty('width', '5px', 'important'); })()"); await sleep(120);
  const cM = await readCaret();
  await ev("(() => { const c = document.querySelector('.flux-block-caret'); c.style.removeProperty('width'); c.style.width = c.dataset.was; })()"); await sleep(120);
  ok('MUT-CARET-N the reader goes RED on the old 5 px bar, and green again undone', !caretOk(cM) && caretOk(await readCaret()), JSON.stringify(cM));
  const dim = parseFloat(await ev("getComputedStyle(document.documentElement).getPropertyValue('--f3-dim')"));
  const linC = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const lumA = (p) => 0.2126 * linC(p[0]) + 0.7152 * linC(p[1]) + 0.0722 * linC(p[2]);
  const crA = (p, q) => (Math.max(lumA(p), lumA(q)) + 0.05) / (Math.min(lumA(p), lumA(q)) + 0.05);
  const dimLine = (a, bg) => [232, 246, 250].map((t, i) => t * a + bg[i] * (1 - a));
  const dimCr = (a) => ({ ground: crA(dimLine(a, [2, 12, 16]), [2, 12, 16]), glow: crA(dimLine(a, [12, 36, 43]), [12, 36, 43]) });
  const dimOk = (a) => a >= 0.55 && a <= 0.65 && dimCr(a).ground >= 6.4 && dimCr(a).ground <= 8.5 && dimCr(a).glow >= 5.3;
  ok('DIM the line above the writing line is dimmed to about #8C989C (the veil\'s --f3-dim ' + dim + ': ' + dimCr(dim).ground.toFixed(2) + ':1 on the ground, ' + dimCr(dim).glow.toFixed(2) + ':1 at the glow\'s brightest; floor 4.5)', dimOk(dim), JSON.stringify({ dim, c: dimCr(dim) }));
  ok('MUT-DIM the reader goes RED at the old 0.78 (10.9:1, too bright) and at 0.40 (too faint), green at 0.60', !dimOk(0.78) && !dimOk(0.4) && dimOk(0.6), '');

  // ---- GROUND-GATE (Fable, Nov 9 7:15 pm) and DECOMPILE: no room ground while jacked and the ground back, current running, after Esc; the rows stay visible all through the leave ----------------
  const gateId = await jackedOpen('The ground stays away while she is jacked in.', 'dark');
  const readGround = () => ev("(() => { const g = [...document.querySelectorAll('[data-flux3-room-ground]')]; return { n: g.length, jacked: document.documentElement.hasAttribute('data-flux3-jacked'), running: g.flatMap((b) => b.getAnimations({ subtree: true })).filter((a) => a.playState === 'running').length, points: g.flatMap((b) => b.getAnimations({ subtree: true })).length }; })()");
  await type(LINE + LINE + LINE, 25);
  await app.mouseMove(8, 8);
  let rowsUp = 0;
  for (let i = 0; i < 80 && rowsUp < 2; i += 1) { await sleep(100); rowsUp = await ev("document.querySelectorAll('[data-flux3-compile] .flux3-compile-row').length"); }
  const gJ = await readGround();
  const groundOffOk = (g) => g.jacked && g.n === 0;
  ok('GROUND-GATE while jacked the room\'s circuit ground is NOT drawn (no ground box on the page), and the rows have compiled (' + rowsUp + ' rows)', groundOffOk(gJ) && rowsUp >= 2, JSON.stringify({ gJ, rowsUp }));
  await ev("(() => { const b = document.createElement('div'); b.setAttribute('data-flux3-room-ground', ''); b.id = 'mut-ground'; document.body.appendChild(b); })()");
  const gM = await readGround();
  await ev("document.getElementById('mut-ground').remove()");
  ok('MUT-GROUND-GATE the reader goes RED when a ground box stands on the page while jacked, and green again undone', !groundOffOk(gM) && groundOffOk(await readGround()), JSON.stringify(gM));
  // the leave: a recorder installed before the tap samples every frame for 1.2 s
  await ev("(() => { window.__leave = []; window.__upAt = null; const t0 = performance.now(); window.__leaveT0 = t0; addEventListener('keyup', (e) => { if (e.key === 'Escape' && window.__upAt === null) window.__upAt = performance.now() - t0; }, true); const tick = () => { const L = document.querySelector('[data-flux3-compile]'); const w = L ? [...L.querySelectorAll('.flux3-compile-word')] : []; const rr = L ? L.querySelectorAll('.flux3-compile-row').length : 0; window.__leave.push({ t: Math.round(performance.now() - t0), words: w.length, rows: rr, op: L ? +getComputedStyle(L).opacity : 0, blocks: w.reduce((n, e) => n + e.children.length, 0) }); if (performance.now() - t0 < 1800) requestAnimationFrame(tick); }; requestAnimationFrame(tick); return true; })()");
  await keyTap('Escape', 'Escape', 27, 60);
  await sleep(2300);
  const leave = await ev('({ s: window.__leave, up: window.__upAt })');
  // after the tap: for DECOMPILE_MS (420 ms) the signal is still on the page, whole (words and their blocks), fading; then gone. Never a frame with the signal cut while the fade is due.
  const leaveOk = (L) => { if (!L || L.up === null || !L.s.length) return false; const after = L.s.filter((x) => x.t >= L.up + 20);
    const first = after.filter((x) => x.t <= L.up + 330); const last = after.filter((x) => x.t >= L.up + 700);
    return first.length >= 5 && first.every((x) => x.words > 0 && x.blocks > 0 && x.op > 0.02) && last.length > 0 && last.every((x) => x.words === 0); };
  const cutSeq = { up: 100, s: [0, 20, 60, 100, 130, 150, 180, 200, 240, 300, 360, 420, 900].map((t) => ({ t, words: t < 120 ? 20 : 0, blocks: t < 120 ? 90 : 0, rows: 3, op: 1 })) };
  ok('DECOMPILE the rows stay on the page, whole and visible, through the leave (every frame for 330 ms after the Esc tap holds the words and their blocks at opacity > 0), and are gone after the fade (' + (leave.s && leave.s.length) + ' frames sampled)', leaveOk(leave), JSON.stringify({ up: leave.up, first: (leave.s || []).filter((x) => x.t >= leave.up && x.t <= leave.up + 500).map((x) => [x.t, x.words, x.op]).slice(0, 14) }));
  ok('MUT-DECOMPILE the reader goes RED on a cut (the signal removed the instant she leaves) and green on the real fade', !leaveOk(cutSeq) && leaveOk(leave), '');
  const gB = await readGround();
  ok('GROUND-BACK after Esc the ground is back on the BUILD page (one box), and its current is running (a point animating)', gB.n === 1 && !gB.jacked && gB.points > 0 && gB.running > 0, JSON.stringify(gB));
  const groundBackOk = (g) => g.n === 1 && !g.jacked && g.points > 0 && g.running > 0;
  await ev("document.querySelectorAll('[data-flux3-room-ground]').forEach((b) => b.getAnimations({ subtree: true }).forEach((a) => a.pause()))"); await sleep(150);
  const gBM = await readGround();
  ok('MUT-GROUND-BACK the reader goes RED when the current is stopped, and when the ground is gone', !groundBackOk(gBM) && !groundBackOk({ ...gB, n: 0 }), JSON.stringify(gBM));

  // ---- NEW PAGE + VOICE: a page born in Flux (under the flag) is 14 pt; the default Voice is Crimson Pro ----------------------------------------------
  const born = await ev("(() => { const e = window.wrizoCreateJournalPage(); return e && e.pageSettings ? e.pageSettings.size : null; })()");
  await sleep(400);
  const vid = await jackedOpen('the voice of the page', 'dark');
  const ff = await ev("getComputedStyle(document.querySelector('.forward-only-editor')).fontFamily");
  ok(`NEWPAGE-14 a page born in Flux under the flag is 14 pt (got ${born}); VOICE the page's default face is Crimson Pro (got ${String(ff).slice(0, 40)})`, born === 14 && /^["']?Crimson Pro/.test(ff), JSON.stringify({ born, ff, vid }));

  await doL();
  }
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); checks.push({ name: 'HARNESS', pass: false, detail: String(e && e.message || e) }); }

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nFLUX3-S4C VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nFLUX3-S4C VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
