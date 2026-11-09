// FLUX3 S4 - THE CORRIDOR (Nick, Nov 9: Style B, "Love the grid"; flux-jacked-in-concepts.md). The Corridor replaces r13's tunnel; flux3-s4.mjs stays on
// flux3/s4 @ 748b0a8b as the record of that turn. Every check below is the concepts file's own sentence, read in the live page behind ?flux3=1.
//   DEF       Flux Free Write opens Jacked In (zoomed, marked) and is ALWAYS DARK: data-page is dark while jacked even with the writer's saved Page = light,
//             and her saved preference is back on leaving (and untouched in storage).
//   CHROME    no rail, strip, corkboard, hands' anchors or Glitch bar while jacked in (computed opacity 0, no pointer); the page's rect does not move
//             (page primacy); Esc brings them back.
//   COR       the corridor: 8 thin frames + the lime and brass frames + one SVG of rails; every animation is transform or opacity (the compositor's); no canvas.
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

const SHOTS = process.env.FLUX3_SHOTS || null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const ON_BOX = process.env.GITHUB_ACTIONS !== 'true';
// the seeded (older) text is made of words no session line uses (zq<n>), so a compiled word names its own source
const PARA = Array.from({ length: 24 }, (_, i) => `zq${i}`).join(' ');
const SEED = Array.from({ length: 10 }, () => PARA).join('\n');
const LAT_TEXT = Array.from({ length: 150 }, (_, i) => 'word' + i).join(' ');
const CYCLE = 'the signal holds while she writes on ';
const LINE = ' and the corridor keeps going forward with more plain words now, on and on across the measure of the page until it wraps again and again, line after line';
const ROUNDS = 6, KEYS = 44, MIN_KEYS = 40, GAP = 90, MAX_MS = 100;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const stat = (xs) => { const s = (xs || []).slice().sort((a, b) => a - b); const q = (p) => (s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null); return { n: s.length, median: q(0.5), p95: q(0.95), max: s.length ? s[s.length - 1] : null }; };
const r1 = (x) => (x === null || x === undefined ? null : Math.round(x * 10) / 10);

const INSTRUMENT = `(() => {
  if (window.__f4) return;
  const I = window.__f4 = { keys: [], rates: [], first: null };
  window.__wzVerifyFlashes = true;
  addEventListener('keydown', () => I.keys.push(performance.now()), true);
  const upr = Animation.prototype.updatePlaybackRate;
  Animation.prototype.updatePlaybackRate = function (r) { const tg = this.effect && this.effect.target; if (tg && tg.closest && tg.closest('[data-flux3-corridor]')) I.rates.push([performance.now(), r]); return upr.call(this, r); };
  I.ed = () => document.querySelector('.forward-only-editor');
  I.toEnd = () => { const ed = I.ed(); if (!ed) return false; ed.focus(); const s = getSelection(); s.selectAllChildren(ed); s.collapseToEnd(); return true; };
  I.caretBefore = () => { const ed = I.ed(), s = getSelection(); if (!ed || !s || !s.rangeCount || !ed.contains(s.anchorNode)) return null; const r0 = s.getRangeAt(0); const pre = document.createRange(); pre.selectNodeContents(ed); pre.setEnd(r0.startContainer, r0.startOffset); return { before: pre.toString().length, total: ed.textContent.length }; };
  I.st = () => { const col = document.querySelector('.mode-pagecol'), r = document.documentElement; const pg = document.querySelector('.mode-page'); const pr = pg && pg.getBoundingClientRect();
    return { theme: r.getAttribute('data-theme'), flag: r.hasAttribute('data-flux3'), jacked: r.hasAttribute('data-flux3-jacked'), looking: r.hasAttribute('data-flux3-looking'), tone: r.getAttribute('data-page'), zoom: col ? col.getAttribute('data-zoom') : null,
      rect: pr ? [Math.round(pr.left), Math.round(pr.top), Math.round(pr.width), Math.round(pr.height)] : null }; };
  I.chrome = () => { const sel = ['.desk-rail', '.desk-frame-strip', '.desk-frame-corkboard', '.desk-frame-sliver-anchor', '.flux3-glitchbar'];
    return sel.map((s) => { const e = document.querySelector(s); if (!e) return [s, null, null]; const c = getComputedStyle(e); return [s, +c.opacity, c.pointerEvents]; }); };
  I.rows = () => { const L = document.querySelector('[data-flux3-compile]'); if (!L) return null;
    return [...L.querySelectorAll('.flux3-compile-word')].map((g) => ({ word: g.dataset.word, row: +g.dataset.row, h: g.firstElementChild ? +g.firstElementChild.style.height.replace('px', '') : null, op: +g.style.opacity })); };
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
  const open = async ({ id, flag = true, tone = 'light', dial = 50, prefs = {}, reduced = false } = {}) => {
    await ev(`(() => { const p = JSON.parse(localStorage.getItem('wrizo-theme-prefs') || '{}'); p.page = ${JSON.stringify(tone)}; localStorage.setItem('wrizo-theme-prefs', JSON.stringify(p));
      localStorage.setItem('wrizo-theme', 'flux'); localStorage.setItem('wrizo-ambiance-dial', ${JSON.stringify(String(dial))});
      const w = JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'); Object.assign(w, { flicker: true, progressStyle: 'bar', progress: 'words', instrumentsOn: true, typewriter: false }, ${JSON.stringify(prefs)}); localStorage.setItem('wrizo-writing-settings', JSON.stringify(w));
      localStorage.removeItem('wrizo-mode-page-${id}'); })()`);
    await app.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }] });
    await ev(`history.replaceState(null, '', ${JSON.stringify(flag ? '/?flux3=1' : '/')} + '#/page/${id}')`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 15000, label: 'the page' }).catch(() => {});
    await splashGone();
    await ev('window.__f4.toEnd()');
    await app.mouseMove(8, 8);
    await sleep(1600);
  };

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
    return { frames: fr.length, thin: fr.filter((f) => getComputedStyle(f).borderTopWidth === '1px').length, rails: c.querySelectorAll('svg.flux3-cor-rails').length, props: [...props], canvas: c.querySelectorAll('canvas').length, pe: getComputedStyle(c).pointerEvents, aria: c.getAttribute('aria-hidden'), first: c === document.querySelector('.mode-stage').firstElementChild }; })()`);
    return { cor, pass: !!cor && cor.frames === 10 && cor.thin === 10 && cor.rails === 1 && cor.first && cor.pe === 'none' && cor.aria === 'true' && cor.props.length > 0 && cor.props.every((p) => p === 'transform' || p === 'opacity') && cor.canvas === 0 }; };
  const corridor = await readCor();
  ok('COR the corridor stands: 8 thin frames + the lime and brass ones, one SVG of rails, first in the stage, inert; its animations touch only transform and opacity; no canvas', corridor.pass, JSON.stringify(corridor.cor));

  // ---- PACE: speed follows her typing, at most 4 Hz, and holds still when she stops -----------------------------------------------------------------
  await ev('window.__f4.rates.length = 0');
  const t0 = await ev('performance.now()');
  await type(CYCLE + CYCLE, 40);   // ~25 keys a second: a fast typist
  const t1 = await ev('performance.now()');
  const fast = await ev('window.__f4.rates.slice()');
  await sleep(2600);   // she stops: the pace eases to zero in ~1.5 s
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
  await sleep(1800);
  const rows = await ev('window.__f4.rows()');
  const seeded = (rows || []).filter((w) => /^zq\d+$/.test(w.word)).length;
  const sessionOnly = seeded === 0;
  const byRow = new Map(); (rows || []).forEach((w) => { if (!byRow.has(w.row)) byRow.set(w.row, w); });
  const rs = [...byRow.keys()].sort((x, y) => x - y);
  const steps = rs.slice(1).map((k, i) => ({ h: byRow.get(k).h / byRow.get(rs[i]).h, op: byRow.get(k).op - byRow.get(rs[i]).op }));
  ok(`ROWS some of this session's lines compiled (${rs.length} rows), at most six, each a step back (height x~0.925 of the one before, opacity ~-0.15)`,
    rs.length >= 2 && rs.length <= 6 && steps.every((s) => s.h > 0.85 && s.h < 1 && s.op < -0.05 && s.op > -0.3), JSON.stringify({ rs, steps }));
  ok('ROWS-SESSION none of the seeded (older) text became signal: every compiled word is one she typed this session', (rows || []).length > 0 && sessionOnly && seeded === 0, JSON.stringify((rows || []).slice(0, 6)));
  await snap('c-rows');

  // ---- CARET: a press anywhere on the page puts the caret at the END of her text ------------------------------------------------------------------
  const rc = await ev("(() => { const r = document.querySelector('.forward-only-editor').getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(innerHeight * 0.3) }; })()");
  await click(rc.x, rc.y);
  await sleep(400);
  const cb = await ev('window.__f4.caretBefore()');
  const hit = await ev(`(() => { const e = document.elementFromPoint(${rc.x}, ${rc.y}); return e ? String(e.className || e.tagName).slice(0, 60) : null; })()`);
  ok('CARET a press mid-page in Typewriter puts the caret at the END of her text', !!cb && cb.before >= cb.total - 1, JSON.stringify({ cb, hit, rc }));

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
    ['chrome visible', "document.querySelectorAll('.desk-rail,.desk-frame-strip,.desk-frame-corkboard,.flux3-glitchbar').forEach((e) => { e.style.setProperty('opacity', '1', 'important'); e.style.setProperty('pointer-events', 'auto', 'important'); })", "document.querySelectorAll('.desk-rail,.desk-frame-strip,.desk-frame-corkboard,.flux3-glitchbar').forEach((e) => { e.style.removeProperty('opacity'); e.style.removeProperty('pointer-events'); })", async () => !(await readChrome()).pass],
    ['glow 20%', "document.documentElement.style.setProperty('--f3-goal-glow', 'radial-gradient(ellipse at center, rgb(87 208 245 / .2) 0%, rgb(87 208 245 / .04) 55%, transparent 100%)')", "document.documentElement.style.removeProperty('--f3-goal-glow')", async () => !(await readGlow()).pass],
    ['a frame removed', "(() => { const f = document.querySelector('.flux3-cor-frame'); window.__mutFrame = f; f.style.display = 'none'; f.className = 'x'; })()", "(() => { const f = window.__mutFrame; if (f) f.className = 'flux3-cor-frame'; if (f) f.style.display = ''; })()", async () => !(await readCor()).pass],
  ];
  for (const [name, apply, undo, red] of mutants) {
    await ev(apply); await sleep(150);
    const wentRed = await red();
    await ev(undo); await sleep(150);
    ok(`MUT-${name.toUpperCase().replace(/ /g, '-')} the reader goes RED on its mutant (${name}) and green again undone`, wentRed && (await readDark()) && (await readChrome()).pass && (await readGlow()).pass && (await readCor()).pass, name);
  }

  // ---- POP: a milestone ---------------------------------------------------------------------------------------------------------------------------
  const gid = await fresh(Array.from({ length: 24 }, (_, i) => `w${i}`).join(' '));
  await open({ id: gid, tone: 'dark' });
  // the corridor's brass tint lasts ~0.3 s and may come while she is still typing: an observer records it from before the first key
  await ev("(() => { const c = document.querySelector('[data-flux3-corridor]'); window.__popSeen = []; if (c) new MutationObserver(() => window.__popSeen.push([Math.round(performance.now()), c.hasAttribute('data-pop')])).observe(c, { attributes: true, attributeFilter: ['data-pop'] }); return !!c; })()");
  await type(' one two three four five six seven', 30);
  let pop = null, brass = false;
  for (let i = 0; i < 30 && !pop; i += 1) { await sleep(60); pop = await ev(`(() => { const p = document.querySelector('[data-flux3-pop]'); if (!p) return null; return { letters: [...p.children].map((s) => s.textContent).join(''), news: [...p.children].filter((s) => s.dataset.new).length, newColour: (p.querySelector('[data-new]') ? getComputedStyle(p.querySelector('[data-new]')).color : null), text: p.textContent.replace(/[A-Z]/g, '').trim() }; })()`); }
  const seen = await ev('window.__popSeen.slice()');
  const onAt = seen.find((s) => s[1]), offAt = seen.find((s) => !s[1] && onAt && s[0] > onAt[0]);
  brass = !!onAt && !!offAt && offAt[0] - onAt[0] >= 200 && offAt[0] - onAt[0] <= 500;
  await snap('c-pop');
  await sleep(2600);
  const gone = await ev("!document.querySelector('[data-flux3-pop]')");
  ok('POP a milestone pops one brass letter of CHECKPOINT (the newest), no number, the corridor goes brass for ~0.3 s, and the word fades', !!pop && pop.letters === 'CHECKPOINT' && pop.news === 1 && /255, 152, 0/.test(pop.newColour || '') && pop.text === '' && brass && gone, JSON.stringify({ pop, brass, seen, gone }));

  // ---- ESC: the chrome returns --------------------------------------------------------------------------------------------------------------------
  await app.typeKeys('x');
  await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await sleep(900);
  const esc = await st();
  ok('ESC looking up brings the chrome back (the marks lift)', esc.looking && !(await ev('window.__f4.chrome()')).some(([, o]) => o === 0), JSON.stringify(esc));

  // ---- L: the Jacked In arm, six rounds ----------------------------------------------------------------------------------------------------------
  // J: Jacked In with the Corridor. C: the control (Flux, flag off, the Typewriter on). A mutant adds `extra` ms of busy-wait to every key in the arm under test.
  const runL = async (label, extra = 0, jFlag = true) => {
    const lat = { C: [], J: [] };
    let cursor = 0;
    for (let round = 0; round <= ROUNDS; round += 1) {
      for (const arm of (round % 2 ? ['J', 'C'] : ['C', 'J'])) {
        const id = await fresh(LAT_TEXT);
        await open({ id, tone: 'dark', flag: arm === 'J' ? jFlag : false, prefs: arm === 'J' && jFlag ? {} : { typewriter: true } });
        const stood = await st();
        await ev(`(() => { window.__lat = []; let t0 = 0; if (window.__latOff) window.__latOff();
          const kd = () => { t0 = performance.now(); ${arm === 'J' && extra ? `const e = performance.now() + ${extra}; while (performance.now() < e) { /* the mutant: a slow key */ }` : ''} };
          const bi = () => { const t = t0; requestAnimationFrame(() => requestAnimationFrame(() => { window.__lat.push(performance.now() - t); })); };
          document.addEventListener('keydown', kd, true); document.addEventListener('beforeinput', bi, true);
          window.__latOff = () => { document.removeEventListener('keydown', kd, true); document.removeEventListener('beforeinput', bi, true); }; return true; })()`);
        for (let i = 0; i < KEYS; i += 1) { await app.typeKeys(CYCLE[cursor % CYCLE.length]); cursor += 1; await sleep(GAP); }
        await sleep(250);
        const got = await ev('window.__lat.slice()');
        if (round > 0) lat[arm].push({ lat: got, stood: { flag: stood.flag, zoom: stood.zoom, jacked: stood.jacked } });
      }
    }
    const cMeds = lat.C.map((r) => stat(r.lat).median), cP95s = lat.C.map((r) => stat(r.lat).p95);
    const spreadMed = Math.max(...cMeds) - Math.min(...cMeds), spreadP95 = Math.max(...cP95s) - Math.min(...cP95s);
    const C = stat(lat.C.flatMap((r) => r.lat)), J = stat(lat.J.flatMap((r) => r.lat));
    const enough = lat.C.every((r) => r.lat.length >= MIN_KEYS) && lat.J.every((r) => r.lat.length >= MIN_KEYS);
    const stoodRight = lat.J.every((r) => (jFlag ? r.stood.flag && r.stood.jacked : !r.stood.flag) && r.stood.zoom === 'true') && lat.C.every((r) => !r.stood.flag && r.stood.zoom === 'true');
    const pass = enough && stoodRight && J.median <= C.median + spreadMed && J.p95 <= C.p95 + spreadP95 && J.max <= MAX_MS;
    const line = `${label}: J median ${r1(J.median)} <= C ${r1(C.median)} + ${r1(spreadMed)}, J p95 ${r1(J.p95)} <= C ${r1(C.p95)} + ${r1(spreadP95)}, J max ${r1(J.max)} <= ${MAX_MS}`;
    return { pass, line, enough, stoodRight, C, J };
  };
  if (ON_BOX || process.env.FLUX3_L === '1') {
    const main = await runL('main (the control against itself)', 0, false);
    ok(`L-METHOD-GREEN the method passes the control against itself (the box's own noise): ${main.line}`, main.pass && main.enough && main.stoodRight, JSON.stringify({ C: main.C, J: main.J }));
    const l0 = await runL('Corridor', 0, true);
    ok(`L the Jacked In arm adds no latency beyond the control's own spread: ${l0.line}`, l0.pass, JSON.stringify({ C: l0.C, J: l0.J }));
    for (const extra of [5, 10]) {
      const m = await runL(`+${extra} ms mutant`, extra, true);
      ok(`L-MUT-${extra} the method calls a key that is ${extra} ms slower RED (the mutant landed: ${m.line})`, !m.pass && m.enough && m.stoodRight, JSON.stringify({ C: m.C, J: m.J }));
    }
  } else console.log('INFO L (Actions: timing is the box\'s to judge; FLUX3_L=1 runs it here)');
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); checks.push({ name: 'HARNESS', pass: false, detail: String(e && e.message || e) }); }

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nFLUX3-S4C VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nFLUX3-S4C VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
