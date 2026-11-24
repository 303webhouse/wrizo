// #118 PROBE (Fable, Nov 24: "find what a card at 4x costs per key (Event Timing median 48 ms against Arbor's 16)"). A DIAGNOSTIC: it names where the time
// goes; it judges no bar. Evidence it starts from (flux3-latency-zoom.mjs on the box, Chat 1's turn 04:31Z, 4cf35181): Event Timing duration per key in the
// card editor - Arbor control med 16, Flux at 1.00 med 40, at 0.20 med 48, at 4.00 med 48 (123 of 176 keys >= 48 ms); the key's own work ~2 ms in every arm,
// so the time is after the script (style/layout/paint/raster/composite). On Actions (software raster) the 4.00 arm reads med 128-392 against 24 at 1.00.
// The editor is the card POP-UP (.board-popup-editor) over the board, which lies behind it dimmed (.board-canvas-dim at .55 with an 80% veil).
// Each arm: flux3-latency-zoom's board and card, re-seeded through the app's seam at the Desk, the camera through its own seam (window.wrizoFluxZoomTo),
// card f3-d centred and double-clicked open, 30 keys one every 90 ms, Event Timing read for every keydown (duration = key -> the next paint).
// Arms (each hides ONE suspect with a <style> put in just before the keys, asserted LANDED by a computed read):
//   C        Arbor (plateau, no camera, no layer): the control
//   Z100     Flux at 1.00
//   Z400     Flux at 4.00 (the case)
//   NOBOARD  Z400, the board behind the pop-up not painted (.board-canvas-dim visibility:hidden)
//   NOCARD   Z400, only the edited card's box behind the pop-up not painted (.board-box[data-box-id="f3-d"] visibility:hidden)
//   NOLAYER  Z400, the Flux drawing layer not painted ([data-flux3-layer] display:none)
//   NOFOG    Z400, the fog's opacity group gone (.board-canvas-dim opacity:1, its ::after veil display:none)
// It also reads whether the board's card follows her words LIVE while the pop-up is open (the card's text before and after the keys).
// PRINTS: per arm, Event Timing keydown n / median / p95 / max / >= 48 ms, and the key's own work (keydown -> input) median. Premises gate (every arm stood
// where it claims, every suspect's style landed, the keys reached the editor); the numbers are information.
// FLUX3_118_ROUNDS=<n> (default 2). Run: node scripts/harness/flux3-118-probe.mjs (from apps/desktop; Actions or a box turn)
import { withHarness } from '../runtime-verify.mjs';

const ROUNDS = Math.max(1, Number(process.env.FLUX3_118_ROUNDS || 2));
const KEYS = 30, GAP = 90, IDLE_MS = 1500;
const VIEW = [1920, 1080];
const BOARD = 'f3-118-board';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const stat = (xs) => { const s = (xs || []).filter((x) => x != null).slice().sort((a, b) => a - b); const q = (p) => (s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null); return { n: s.length, med: q(0.5), p95: q(0.95), max: s.length ? s[s.length - 1] : null, ge48: s.filter((x) => x >= 48).length }; };

// flux3-latency-zoom.mjs's nine cards and three links, word for word
const makeBoxes = () => {
  const T = (id, x, y, z, text, extra = {}) => ({ id, kind: 'text', x, y, w: 0.2, h: 0.1, z, text, ...extra });
  const L = (id, a, b, z) => ({ id, kind: 'connection', x: 0, y: 0, w: 0, h: 0, z, connA: a, connB: b });
  return [
    T('f3-a', 0.05, 0.05, 1, 'Card A'), T('f3-b', 0.5, 0.05, 2, 'Card B'), T('f3-c', 0.05, 0.4, 3, 'Card C'), T('f3-d', 0.5, 0.4, 4, 'Card D'),
    T('f3-e', 0.05, 0.75, 5, 'Card E'), T('f3-f', 0.5, 0.75, 6, 'Card F'), T('f3-g', 0.75, 0.4, 7, 'Card G, no link'),
    T('f3-h', 0.75, 0.05, 8, 'The hook'),
    L('f3-ac', 'f3-a', 'f3-c', 10), L('f3-bd', 'f3-b', 'f3-d', 11), L('f3-ef', 'f3-e', 'f3-f', 12),
    { id: 'f3-meta', kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 0, canvasH: 3400 },
  ];
};

// each suspect: the style that hides it, and the computed read that proves the style landed
const SUSPECTS = {
  NOBOARD: { css: '.board-canvas-dim{ visibility:hidden !important; }', landed: "(() => { const e = document.querySelector('.board-canvas-dim'); return !!e && getComputedStyle(e).visibility === 'hidden'; })()" },
  NOCARD: { css: '.board-canvas .board-box[data-box-id="f3-d"]{ visibility:hidden !important; }', landed: "(() => { const e = document.querySelector('.board-canvas .board-box[data-box-id=\"f3-d\"]'); return !!e && getComputedStyle(e).visibility === 'hidden'; })()" },
  NOLAYER: { css: '[data-flux3-layer]{ display:none !important; }', landed: "(() => { const e = document.querySelector('[data-flux3-layer]'); return !!e && getComputedStyle(e).display === 'none'; })()" },
  NOFOG: { css: '.board-canvas-blurred > .board-canvas-dim{ opacity:1 !important; } .board-canvas-dim::after{ display:none !important; }', landed: "(() => { const e = document.querySelector('.board-canvas-dim'); return !!e && getComputedStyle(e).opacity === '1' && getComputedStyle(e, '::after').display === 'none'; })()" },
};
const ARMS = {
  C: { theme: 'plateau', flag: false, scale: null },
  Z100: { theme: 'flux', flag: true, scale: 1 },
  Z400: { theme: 'flux', flag: true, scale: 4 },
  NOBOARD: { theme: 'flux', flag: true, scale: 4, hide: 'NOBOARD' },
  NOCARD: { theme: 'flux', flag: true, scale: 4, hide: 'NOCARD' },
  NOLAYER: { theme: 'flux', flag: true, scale: 4, hide: 'NOLAYER' },
  NOFOG: { theme: 'flux', flag: true, scale: 4, hide: 'NOFOG' },
};
const ORDER = Object.keys(ARMS);
const CYCLE = 'the signal holds while she writes on ';

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 20000, label: 'splash gone' }).catch(() => {});
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','flux'); localStorage.setItem('wrizo-theme-prefs', JSON.stringify({ voice: 'serif', page: 'dark', fade: 'on' }));");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await app.emulateDpr(1, VIEW[0], VIEW[1]);
  await splashGone();
  await ev(`window.wrizoCreateJournalPage(${J({ id: BOARD, text: 'Probe 118', pageType: 'board', boxes: makeBoxes(), createdAt: new Date().toISOString(), origin: null, source: null })})`);
  await sleep(500);

  const runArm = async (name, round) => {
    const arm = ARMS[name];
    await ev("location.hash = '#/'"); await sleep(300);
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before seed', timeout: 15000 });
    await ev(`window.wrizoPatchEntry(${J(BOARD)}, { boxes: ${J(makeBoxes())} })`);
    await ev(`localStorage.setItem('wrizo-theme', ${J(arm.theme)}); localStorage.setItem('wrizo-theme-prefs', JSON.stringify({ voice: 'serif', page: 'dark', fade: 'on' }));`);
    await ev(`history.replaceState(null, '', ${J(arm.flag ? '/?flux3=1' : '/')} + '#/page/${BOARD}')`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.board-canvas .board-box[data-box-id=\"f3-d\"]')", { timeout: 15000, label: 'the board' }).catch(() => {});
    await splashGone();
    if (arm.flag) await app.waitFor("!!document.querySelector('[data-flux3-layer]')", { timeout: 10000, label: 'the Schema' }).catch(() => {});
    await sleep(1400);
    if (arm.scale != null && arm.scale !== 1) { await ev(`window.wrizoFluxZoomTo(${arm.scale})`); await sleep(1000); }
    await ev(`(() => { const wrap = document.querySelector('.board-canvas-wrap'), e = document.querySelector('.board-box[data-box-id="f3-d"]'); if (!wrap || !e) return; const r = e.getBoundingClientRect(), w = wrap.getBoundingClientRect(); wrap.scrollLeft += (r.left + r.width / 2) - (w.left + wrap.clientWidth / 2); wrap.scrollTop += (r.top + r.height / 2) - (w.top + wrap.clientHeight / 2); })()`);
    await sleep(900);
    const b = await ev("(() => { const e = document.querySelector('.board-box[data-box-id=\"f3-d\"]'); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height }; })()");
    if (b) await app.doubleClick(Math.round(b.l + b.w * 0.5), Math.round(b.t + b.h * 0.4));
    await app.waitFor("!!document.querySelector('.board-popup-editor')", { timeout: 4000, label: 'the card editor' }).catch(() => {});
    await ev("(() => { const e = document.querySelector('.board-popup-editor'); if (!e) return; e.focus(); const s = getSelection(); s.selectAllChildren(e); s.collapseToEnd(); })()");
    let landed = null;
    if (arm.hide) {
      await ev(`(() => { const s = document.createElement('style'); s.setAttribute('data-p118', ''); s.textContent = ${J(SUSPECTS[arm.hide].css)}; document.head.appendChild(s); })()`);
      await sleep(200);
      landed = await ev(SUSPECTS[arm.hide].landed);
    }
    await sleep(IDLE_MS);
    const cardText = "(() => { const e = document.querySelector('.board-canvas .board-box[data-box-id=\"f3-d\"]'); return e ? (e.textContent || '').length : -1; })()";
    const where = await ev(`(() => { const r = document.documentElement, cv = document.querySelector('.board-canvas'), cr = cv && cv.getBoundingClientRect(), ed = document.querySelector('.board-popup-editor');
      return { theme: r.getAttribute('data-theme'), layer: document.querySelectorAll('[data-flux3-layer]').length, scale: cr && cv.offsetWidth ? Math.round(cr.width / cv.offsetWidth * 100) / 100 : null,
        focused: !!ed && document.activeElement === ed, before: ed ? ed.textContent.length : -1 }; })()`);
    const card0 = await ev(cardText);
    await ev(`(() => { window.__et = []; window.__work = []; let k0 = 0;
      if (window.__p118Off) window.__p118Off();
      const po = new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === 'keydown') window.__et.push(e.duration); }); po.observe({ type: 'event', durationThreshold: 16, buffered: false });
      const kd = () => { k0 = performance.now(); }; const inp = () => { if (k0) { window.__work.push(performance.now() - k0); k0 = 0; } };
      document.addEventListener('keydown', kd, true); document.addEventListener('input', inp, false);
      window.__p118Off = () => { po.disconnect(); document.removeEventListener('keydown', kd, true); document.removeEventListener('input', inp, false); }; return true; })()`);
    for (let i = 0; i < KEYS; i += 1) { await app.typeKeys(CYCLE[(round * 7 + i) % CYCLE.length]); await sleep(GAP); }
    await sleep(600);
    const got = await ev("(() => { const ed = document.querySelector('.board-popup-editor'); const out = { et: window.__et.slice(), work: window.__work.slice(), after: ed ? ed.textContent.length : -1 }; if (window.__p118Off) window.__p118Off(); return out; })()");
    const card1 = await ev(cardText);
    await ev("document.querySelectorAll('style[data-p118]').forEach((s) => s.remove())");
    return { name, round, where, landed, card0, card1, ...got };
  };

  await runArm('C', 0);   // warm-up, discarded
  const res = Object.fromEntries(ORDER.map((k) => [k, []]));
  for (let round = 1; round <= ROUNDS; round += 1) {
    const rot = ORDER.slice((round - 1) % ORDER.length).concat(ORDER.slice(0, (round - 1) % ORDER.length));
    for (const name of rot) res[name].push(await runArm(name, round));
  }

  const all = Object.values(res).flat();
  const stood = all.every((r) => { const a = ARMS[r.name]; return r.where && r.where.theme === a.theme && r.where.focused && (a.flag ? r.where.layer === 1 : r.where.layer === 0) && (a.scale == null || Math.abs((r.where.scale || 0) - a.scale) < 0.05); });
  ok('P1 (premise) every arm stood where it claims (theme, layer, the camera scale as measured, the card editor focused)', stood, J(all.map((r) => [r.name, r.round, r.where])));
  const hid = all.filter((r) => ARMS[r.name].hide);
  ok('P2 (premise) every suspect\'s style LANDED (a computed read) before its keys', hid.length > 0 && hid.every((r) => r.landed === true), J(hid.map((r) => [r.name, r.round, r.landed])));
  ok('P3 (premise) every key reached the editor (it grew by the keys typed) and Event Timing saw keydowns in every arm-round', all.every((r) => r.after - r.where.before === KEYS && r.et.length > 0), J(all.map((r) => [r.name, r.round, r.after - r.where.before, r.et.length])));
  for (const name of ORDER) {
    const s = stat(res[name].flatMap((r) => r.et)), w = stat(res[name].flatMap((r) => r.work));
    const live = res[name].map((r) => r.card1 - r.card0);
    console.log(`P118 ${name.padEnd(8)} Event Timing keydown n ${s.n} med ${s.med} p95 ${s.p95} max ${s.max} >=48 ${s.ge48} | work med ${w.med == null ? null : Math.round(w.med * 10) / 10} | the board's card grew by ${J(live)} while the pop-up was open`);
  }
}); } catch (e) { ok('the probe ran to the end', false, String(e && e.message || e).slice(0, 400)); }

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 1200)}]` : ''}`);
const EXPECTED = 3;
const passed = checks.filter((c) => c.pass).length;
const verdict = passed === checks.length && checks.length === EXPECTED;
console.log(verdict ? `\nFLUX3-118-PROBE VERIFY: PASS (${checks.length} checks; the P118 lines are the reading)` : `\nFLUX3-118-PROBE VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed${checks.length !== EXPECTED ? `, ${checks.length} of ${EXPECTED} checks ran` : ''}`);
process.exit(verdict ? 0 : 1);
