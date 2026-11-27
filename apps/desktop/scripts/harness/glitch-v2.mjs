// GLITCH v2 (the flourish spec draft 2 §1, ruled by Nick Nov 26; Fable's Q2-Q5 and the 4:25 pm ruling) - Flux's idle glitch and its switches, on the real default (WS_FLOURISH=1: her flourishOff.flux and
// distractionFree decide, never the shared style). Draft mode (the glitch is off in Wire In). The idle clock is told how long she has been still (window.__f3IdleShift).
//   ON    the flourish is on by default: the CHECKPOINT meter in the lane
//   S1    30 s still: one word a beat, her page only, no band
//   S3    15 min still: three or four words a beat, chrome text among them, a band every beat, no taller than a quarter of the window
//   LAW   beats are never closer than the stage's spacing: under 3 changes a second
//   PAGE  the band's slip never covers the page: only its two fringe lines cross it; the page's text, its rect and the selection are unchanged
//   SLIP  the band really shifts the chrome under it (the pixels of the rail change while it is up, and come back)
//   CLEAR a pointer move, and a wheel, take everything away at once
//   FLICK Flicker off: no glitches, the CHECKPOINT meter stays
//   OFF   flourishOff.flux: a plain meter (4 px, cyan on its track), no glitches · DF no CHECKPOINT and no glitches under Distraction Free
//   STILL reduced motion, and Ambiance 0: nothing glitches
//   WIRE  nothing in Wire In
//   DOCS  Docs › Session has Meter style and Flicker with their lines, and pressing Bar writes flourishOff.flux; the ⋯ panel has no Flicker
// Run: node scripts/harness/glitch-v2.mjs (from apps/desktop; Actions or the box). GLITCH_SHOTS=<dir> writes frames.
import fs from 'node:fs';
import path from 'node:path';
Object.assign(process.env, { WS_REORG: '1', WS_ARBOR2: 'default', WS_MACHINA2: 'default', WS_FLUX3: 'default', WS_FLOURISH: '1', WS_PLACE: '1' });
const { withHarness } = await import('../runtime-verify.mjs');

const SHOTS = process.env.GLITCH_SHOTS || '';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? '  ' + String(detail).slice(0, 600) : ''}`); };
const J = (v) => JSON.stringify(v);
const ID = 'gv2-page';
const TEXT = Array.from({ length: 12 }, (_, i) => `Paragraph ${i} keeps going along the river under the window of the quiet room.`).join(String.fromCharCode(10));

// the layer's life, read in the page: each word and band as it comes, and when the layer empties
const WATCH = `(() => {
  const L = document.querySelector('[data-flux3-idle]'); window.__gv = { log: [] }; if (!L) return false;
  if (window.__gvMo) window.__gvMo.disconnect();
  (window.__gvMo = new MutationObserver((ms) => { const t = performance.now(); for (const m of ms) { m.addedNodes.forEach((n) => { if (n.classList && n.tagName !== 'svg') window.__gv.log.push([t, 'add', n.className, n.dataset.word || '']); }); m.removedNodes.forEach((n) => { if (n.classList) window.__gv.log.push([t, 'rm', n.className]); }); } })).observe(L, { childList: true });
  return true;
})()`;
// beats from the log: pieces added within 40 ms of each other
const beats = (log) => log.filter((e) => e[1] === 'add').reduce((a, e) => { const last = a[a.length - 1]; if (last && e[0] - last.t < 40) { last.items.push(e); } else a.push({ t: e[0], items: [e] }); return a; }, [])
  .map((b) => ({ t: b.t, words: b.items.filter((e) => e[2] === 'flux3-idle-word').map((e) => e[3]), band: b.items.some((e) => e[2] === 'flux3-glitch-band' || e[2] === 'flux3-glitch-fringe-top') }));
const GEO = `(() => { const q = (s) => [...document.querySelectorAll(s)].map((e) => { const r = e.getBoundingClientRect(); return { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom), filter: getComputedStyle(e).backdropFilter }; });
  const p = document.querySelector('.mode-page').getBoundingClientRect(); const ed = document.querySelector('.forward-only-editor, .draft-editor, [contenteditable="true"]');
  const s = getSelection(); return { page: { left: Math.round(p.left), right: Math.round(p.right), top: Math.round(p.top), bottom: Math.round(p.bottom) }, bands: q('.flux3-glitch-band'), fringes: q('.flux3-glitch-fringe-top, .flux3-glitch-fringe-foot'),
    words: document.querySelectorAll('.flux3-idle-word').length, text: ed ? ed.textContent : null, sel: s.rangeCount ? [s.anchorOffset, s.focusOffset, String(s)] : null, vw: innerWidth, vh: innerHeight }; })()`;

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const soft = async (expr, timeout = 15000) => { try { await app.waitFor(expr, { label: expr.slice(0, 60), timeout }); return true; } catch { return false; } };
  const shot = async (name) => { if (SHOTS) fs.writeFileSync(path.join(SHOTS, `${name}.png`), Buffer.from((await app.cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64')); };
  const open = async ({ off = false, df = false, flicker = true, dial = 50, reduced = false, mode = 'drafting', w = 1366, h = 768 } = {}) => {
    await app.emulateDpr(1, w, h);
    await ev('window.__f3IdleShift = 0; location.hash = "#/"; true'); await sleep(300);
    await ev(`(() => { const s = JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'); Object.assign(s, { instrumentsOn: true, progress: 'words', themeTracker: true, progressStyle: 'bar', flicker: ${flicker}, typewriter: false }); localStorage.setItem('wrizo-writing-settings', JSON.stringify(s));
      localStorage.setItem('wrizo-writing-goal-lines', JSON.stringify({ n: 500, unit: 'words' }));
      const p = JSON.parse(localStorage.getItem('wrizo-reorg-prefs') || '{}'); delete p.writing; delete p.flourishOff; delete p.distractionFree; const at = new Date().toISOString();
      if (${off}) p.flourishOff = { at, fieldAt: { flux: at }, flux: true }; if (${df}) p.distractionFree = { at, on: true }; localStorage.setItem('wrizo-reorg-prefs', JSON.stringify(p));
      localStorage.setItem('wrizo-theme', 'flux'); localStorage.setItem('wrizo-ambiance-dial', ${J(String(dial))}); localStorage.setItem('wrizo-mode-page-${ID}', ${J(mode)}); history.replaceState(null, '', '/#/page/${ID}'); return true; })()`);
    await app.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }] });
    await app.reload();
    await soft("!!document.querySelector('.mode-page')");
    await soft("!document.querySelector('.wz-splash')");
    await sleep(1800);
    await app.mouseMove(4, 300);
  };
  const watch = async (shift, ms) => { await ev(WATCH); await ev(`window.__f3IdleShift = ${shift}`); await sleep(ms); const log = await ev('window.__gv ? window.__gv.log : []'); return { log, beats: beats(log) }; };
  const stop = () => ev('window.__f3IdleShift = 0');
  const lane = () => ev("({ checkpoint: !!document.querySelector('.flux3-glitchbar'), plain: !!document.querySelector('[data-plain-meter]'), track: (() => { const t = document.querySelector('.flux3-plainmeter-track'), f = document.querySelector('.flux3-plainmeter-fill'); return t ? [Math.round(t.getBoundingClientRect().height), getComputedStyle(t).backgroundColor, getComputedStyle(f).backgroundColor] : null; })(), layer: !!document.querySelector('[data-flux3-idle]') })");

  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); true");
  await app.reload();
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams', timeout: 20000 });
  await ev(`window.wrizoCreateJournalPage(${J({ id: ID, text: TEXT, createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })}); window.wrizoFlushNow(); true`);

  await open();
  const on = await lane();
  ok('ON the flourish is on by default: the CHECKPOINT meter, no plain one', on.checkpoint && !on.plain && on.layer, J(on));

  const g0 = await ev(GEO);
  const one = await watch(40, 8500);
  await stop();
  const own = new Set(TEXT.split(/[^\p{L}\p{N}'’]+/u));
  ok(`S1 30 s still: one word a beat, her page only, no band (${one.beats.length} beats)`, one.beats.length >= 2 && one.beats.every((b) => b.words.length === 1 && !b.band && own.has(b.words[0])), J(one.beats.slice(0, 5)));

  const top = await watch(1000, 7000);
  const during = await (async () => { for (let i = 0; i < 60; i += 1) { const g = await ev(GEO); if (g.bands.length) return g; await sleep(50); } return ev(GEO); })();
  await shot('glitch-ceiling-1366');
  await stop();
  const chromeWords = top.beats.flatMap((b) => b.words).filter((w) => !own.has(w));
  ok(`S3 15 min still: three or four words a beat, chrome text among them, a band every beat (${top.beats.length} beats)`, top.beats.length >= 3 && top.beats.filter((b) => b.words.length >= 3).length >= top.beats.length - 1 && top.beats.every((b) => b.words.length <= 4 && b.band) && chromeWords.length > 0, J({ words: top.beats.map((b) => b.words.length), chrome: chromeWords.slice(0, 6) }));
  const gaps = top.beats.slice(1).map((b, i) => Math.round(b.t - top.beats[i].t));
  ok(`LAW beats are never closer than the stage's spacing (closest ${gaps.length ? Math.min(...gaps) : '-'} ms at the ceiling, ${one.beats.length > 1 ? Math.round(one.beats[1].t - one.beats[0].t) : '-'} ms at 30 s)`, gaps.length >= 2 && Math.min(...gaps) >= 1100 && one.beats.slice(1).every((b, i) => b.t - one.beats[i].t >= 2450), J(gaps));
  const clearOfPage = (g) => g.bands.every((b) => b.bottom <= g.page.top || b.top >= g.page.bottom || b.right <= g.page.left + 1 || b.left >= g.page.right - 1);
  ok(`PAGE the band's slip never covers the page; its two fringes cross the window; text and selection unchanged (band ${during.bands.length ? during.bands[0].bottom - during.bands[0].top : '-'} px)`,
    during.bands.length >= 1 && during.bands.every((b) => /url\(/.test(b.filter) && b.bottom - b.top <= Math.floor(during.vh * 0.25) + 1) && clearOfPage(during) && during.fringes.length === 2 && during.fringes.every((f) => f.left <= 0 && f.right >= during.vw - 1)
    && during.text === g0.text && J(during.sel) === J(g0.sel) && J(during.page) === J(g0.page), J({ bands: during.bands, page: during.page }));

  // SLIP: the same strip of the rail read before, during and after a band that is held over it
  await open();
  await ev("window.__rnd = Math.random; true");
  const railBox = await ev("(() => { const r = (document.querySelector('[data-reorg-rail]') || document.querySelector('.desk-rail')).getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(innerHeight * 0.3), width: Math.max(24, Math.round(r.width)), height: 120 }; })()");
  const clip = async () => (await app.cdp('Page.captureScreenshot', { format: 'png', clip: { ...railBox, scale: 1 } })).data;
  const before1 = await clip(); await sleep(400); const before2 = await clip();
  await ev("Math.random = () => 0.5; window.__f3IdleShift = 1000; true");
  let shifted = false; let held = null;
  for (let i = 0; i < 80 && !shifted; i += 1) { const g = await ev(GEO); if (g.bands.length) { held = g.bands[0]; const now = await clip(); shifted = now !== before2; } else await sleep(40); }
  await ev('Math.random = window.__rnd; window.__f3IdleShift = 0; true'); await app.mouseMove(6, 300); await sleep(500);
  const after = await clip();
  ok('SLIP the band shifts the chrome under it, and the rail comes back when it leaves', before1 === before2 && shifted && after === before2, J({ still: before1 === before2, shifted, back: after === before2, held, railBox }));

  for (const [name, act] of [['pointer', () => app.mouseMove(300, 400)], ['wheel', () => app.cdp('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 600, y: 400, deltaX: 0, deltaY: 40, pointerType: 'mouse' })]]) {
    await open();
    await ev('window.__f3IdleShift = 1000');
    const up = await soft("document.querySelectorAll('.flux3-idle-word, .flux3-glitch-fringe-top').length > 0", 6000);
    await ev('window.__f3IdleShift = 0'); await act(); await sleep(250);
    const left = await ev("document.querySelectorAll('.flux3-idle-word, .flux3-glitch-band, .flux3-glitch-fringe-top, .flux3-glitch-fringe-foot').length");
    ok(`CLEAR a ${name} takes everything away at once`, up && left === 0, J({ up, left }));
  }

  const quiet = async (opts) => { await open(opts); const l = await lane(); const w = await watch(1000, 4500); await stop(); return { ...l, adds: w.log.filter((e) => e[1] === 'add').length }; };
  const flick = await quiet({ flicker: false });
  ok('FLICK Flicker off: no glitches, the CHECKPOINT meter stays', flick.checkpoint && !flick.plain && flick.adds === 0, J(flick));
  const off = await quiet({ off: true });
  ok('OFF flourishOff.flux: a plain meter (4 px, cyan on its track), no glitches', !off.checkpoint && off.plain && off.adds === 0 && !off.layer && !!off.track && off.track[0] === 4 && off.track[1] === 'rgb(95, 143, 149)' && off.track[2] === 'rgb(0, 194, 255)', J(off));
  await shot('plain-meter-1366');
  const df = await quiet({ df: true });
  // whether ANY meter shows under Distraction Free is POLISH's part (the flourish spec §7.2, "every progress meter"): this reads the glitches and CHECKPOINT only
  ok('DF Distraction Free: no CHECKPOINT meter, no glitches', !df.checkpoint && df.adds === 0 && !df.layer, J(df));
  const rm = await quiet({ reduced: true });
  const a0 = await quiet({ dial: 0 });
  ok('STILL reduced motion and Ambiance 0: nothing glitches', rm.adds === 0 && a0.adds === 0 && rm.checkpoint, J({ rm, a0 }));
  const wire = await quiet({ mode: 'journal' });
  ok('WIRE nothing in Wire In', wire.adds === 0, J(wire));

  await open();
  const clickEl = (sel) => ev(`(() => { const e = document.querySelector(${J(sel)}); if (!e) return false; e.click(); return true; })()`);
  await clickEl('[data-reorg-rail] [data-category="reorg-docs"]'); await sleep(500);
  await clickEl('[data-reorg-group="session"] [data-session-fold]'); await sleep(400);
  const rows = await ev("({ rows: [...document.querySelectorAll('[data-reorg-group=\"session\"] [data-session-row]')].map((e) => e.getAttribute('data-session-row')), text: document.querySelector('[data-reorg-group=\"session\"]')?.textContent || '' })");
  await shot('session-1366');
  // the hint lines are small print inside the menu (the first frames showed them in page-size type, spilling out of it)
  const hints = await ev(`(() => { const lum = (s) => { const v = (s.match(/[\\d.]+/g) || []).slice(0, 3).map(Number).map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
    const solid = (e) => { for (; e; e = e.parentElement) { const c = getComputedStyle(e).backgroundColor, p = c.match(/[\\d.]+/g) || []; if (p.length < 4 || Number(p[3]) > 0.9) return c; } return 'rgb(0,0,0)'; };
    const row = document.querySelector('[data-session-row="meterstyle"]').getBoundingClientRect();
    return [...document.querySelectorAll('[data-session-hint]')].map((h) => { const s = getComputedStyle(h), r = document.createRange(); r.selectNodeContents(h); const t = r.getBoundingClientRect(); const a = lum(s.color), b = lum(solid(h));
      return { size: parseFloat(s.fontSize), left: Math.round(t.left - row.left), right: Math.round(row.right - t.right), contrast: Math.round(100 * (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)) / 100 }; }); })()`);
  ok('DOCS the two hint lines are small print inside the menu (13 px at most, 10 px clear of both sides, 4.5:1)', hints.length === 2 && hints.every((h) => h.size <= 13 && h.left >= 10 && h.right >= 10 && h.contrast >= 4.5), J(hints));
  await clickEl('[data-session-row="meterstyle"] [data-pick="bar"]'); await sleep(500);
  const wrote = await ev("({ off: (JSON.parse(localStorage.getItem('wrizo-reorg-prefs') || '{}').flourishOff || {}).flux, plain: !!document.querySelector('[data-plain-meter]') })");
  ok('DOCS Session has Meter style and Flicker, in that order under the tracker, with their lines; Bar writes flourishOff.flux and the plain meter shows',
    rows.rows.indexOf('meterstyle') === rows.rows.indexOf('tracker') + 1 && rows.rows.indexOf('flicker') === rows.rows.indexOf('meterstyle') + 1 && /Meter style/.test(rows.text) && /The glitches while you are still/.test(rows.text) && /Glitch: the CHECKPOINT meter/.test(rows.text) && wrote.off === true && wrote.plain, J({ rows: rows.rows, wrote }));
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); ok('HARNESS ' + String(e && e.message || e).slice(0, 300), false); }

const src = fs.readFileSync(new URL('../../src/components/Sliver.tsx', import.meta.url), 'utf8');
ok('DOCS (source) the Front menu\'s ⋯ panel draws no Flicker switch', !/label=\{t\('footMenuFlicker'\)\}/.test(src));

const bad = checks.filter((c) => !c.pass).length;
if (process.env.HARNESS_PARKED === '1') console.log('\nGLITCH-V2 PARKED: PASS (0 records) - a new file; it parks nothing of its own');
console.log(bad ? `\nGLITCH-V2 VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nGLITCH-V2 VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
