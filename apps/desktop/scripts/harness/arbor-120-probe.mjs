// #120 PROBE (ARBOR, Nov 24; Fable's orders-nov24.md 10:33 am: "NEW #120 (live, Arbor day room): typing into a card's pop-up on an Arbor Board costs about
// 170-184 ms a key to paint by day (24 at night; an Arbor page by day is 32) ... ARBOR, first, red first with INK's probe (ink/118-card-zoom-cost)").
// A DIAGNOSTIC: it names which day-room layer carries the time; it judges no bar. Built on INK's flux3-118-probe.mjs (ink/118-card-zoom-cost @ d365191d):
// the same board, card, seam seeding, pop-up opening and Event Timing reading, word for word; only the arms differ. INK's evidence (Actions 45436425078):
// CDAY 168 / 272 (60 of 60 keys >= 48 ms) against CNIGHT 24 / 32; on the box 184 by day. An Arbor PAGE by day reads 32 (arbor-room-paint-probe), so the cost
// is the board behind the pop-up in the day room.
// Every arm is Arbor (plateau) with the room PINNED through the redesign's own test pin (arbor2/flag.ts: ?arbor2=1&arbor2room=day|night), read back.
// The day-only layers (styles/arbor-v2.css, arbor2/sun.ts, arbor2/paper.ts), each hidden by ONE <style> put in just before the keys, asserted LANDED by a
// computed read:
//   CNIGHT     the night room: the floor
//   CDAY       the day room: the case
//   NOSUN      CDAY, the pergola's shade layer (.arbor2-sun: fixed, z-index -1, opacity .18-.26, blurred beams and leaves) not painted
//   NODRIFT    CDAY, the sun's 48 s drift and the leaves' flutter stopped (animation none)
//   NOSUNBLUR  CDAY, the sun's beams, crossbeams and leaves unblurred (filter none)
//   NOSUNMASK  CDAY, paper.ts's mask on the sun layer dropped (mask-image none)
//   NOVIG      CDAY, the room's vignette (body::after, the day's inset 170 px shadow and its mask) not painted
//   NOFOG      CDAY, the board's .55 fade and its 80% veil gone (INK's NOFOG, word for word)
//   NOPAPER    CDAY, paper.ts's sheet (.arbor2-paper) not painted
// (added after run 45462428088 found no sun on a Board: the day room's shade is r19's PERGOLA, arbor2/pergola.ts, a live blurred SVG whose leaves breeze every
// 16 s; Nick's ruling B swaps the live drawing for its still picture while she types, but only on <html data-wz-writing>, which ModeStage alone sets)
//   NOPERGOLA  CDAY, the room's and the copies' shade layers (.arbor2-pergola, .arbor2-pagesh) not painted
//   NOBREEZE   CDAY, the leaves' breeze stopped (.wz-leaf animation none)
//   LIVEOFF    CDAY, the shade layers' own still swap forced (data-live-off on every .arbor2-pergola / .arbor2-pagesh: the live drawing leaves style and paint)
//   WRITING    CDAY, <html data-wz-writing=true> as a page sets it on the first key (the product's whole rest->writing path for the shade), removed after the keys
// PRINTS: per arm, Event Timing keydown n / median / p95 / max / >= 48 ms and the key's own work (keydown -> input) median. Premises gate (every arm stood
// where it claims, every suspect's style landed, the day room's sun was drawn in the arms that keep it, the keys reached the editor); the numbers are
// information. ARBOR_120_ROUNDS=<n> (default 2). Run: node scripts/harness/arbor-120-probe.mjs (from apps/desktop; Actions or a box turn)
import { withHarness } from '../runtime-verify.mjs';

const ROUNDS = Math.max(1, Number(process.env.ARBOR_120_ROUNDS || 2));
const KEYS = 30, GAP = 90, IDLE_MS = 1500;
const VIEW = [1920, 1080];
const BOARD = 'a120-board';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const stat = (xs) => { const s = (xs || []).filter((x) => x != null).slice().sort((a, b) => a - b); const q = (p) => (s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null); return { n: s.length, med: q(0.5), p95: q(0.95), max: s.length ? s[s.length - 1] : null, ge48: s.filter((x) => x >= 48).length }; };

// flux3-latency-zoom.mjs's nine cards and three links, word for word (as INK's probe)
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

const cs = (sel, prop, pseudo) => `(() => { const e = document.querySelector(${J(sel)}); return e ? getComputedStyle(e${pseudo ? `, ${J(pseudo)}` : ''})[${J(prop)}] : null; })()`;
const SUSPECTS = {
  NOSUN: { css: '.arbor2-sun{ display:none !important; }', landed: `${cs('.arbor2-sun', 'display')} === 'none'` },
  NODRIFT: { css: '.arbor2-sun-drift, .arbor2-sun-leaf{ animation:none !important; }', landed: `${cs('.arbor2-sun-drift', 'animationName')} === 'none'` },
  NOSUNBLUR: { css: '.arbor2-sun-beam, .arbor2-sun-cross, .arbor2-sun-leaf{ filter:none !important; }', landed: `${cs('.arbor2-sun-beam', 'filter')} === 'none'` },
  NOSUNMASK: { css: '.arbor2-sun{ mask-image:none !important; -webkit-mask-image:none !important; }', landed: `${cs('.arbor2-sun', 'maskImage')} === 'none'` },
  NOVIG: { css: 'body::after{ display:none !important; }', landed: `${cs('body', 'display', '::after')} === 'none'` },
  NOFOG: { css: '.board-canvas-blurred > .board-canvas-dim{ opacity:1 !important; } .board-canvas-dim::after{ display:none !important; }', landed: "(() => { const e = document.querySelector('.board-canvas-dim'); return !!e && getComputedStyle(e).opacity === '1' && getComputedStyle(e, '::after').display === 'none'; })()" },
  NOPAPER: { css: '.arbor2-paper{ display:none !important; }', landed: `${cs('.arbor2-paper', 'display')} === 'none'` },
  NOPERGOLA: { css: '.arbor2-pergola, .arbor2-pagesh{ display:none !important; }', landed: `${cs('.arbor2-pergola', 'display')} === 'none'` },
  NOBREEZE: { css: '.wz-leaf{ animation:none !important; }', landed: `${cs('.arbor2-pergola .wz-leaf', 'animationName')} === 'none'` },
  LIVEOFF: { js: "document.querySelectorAll('.arbor2-pergola, .arbor2-pagesh').forEach((l) => l.setAttribute('data-live-off', 'true'))", undo: "document.querySelectorAll('.arbor2-pergola, .arbor2-pagesh').forEach((l) => l.removeAttribute('data-live-off'))",
    landed: "(() => { const l = document.querySelector('.arbor2-pergola .arbor2-live'); return !!l && getComputedStyle(l).contentVisibility === 'hidden'; })()" },
  WRITING: { js: "document.documentElement.setAttribute('data-wz-writing', 'true')", undo: "document.documentElement.removeAttribute('data-wz-writing')",
    landed: "(() => { const l = document.querySelector('.arbor2-pergola'); return document.documentElement.getAttribute('data-wz-writing') === 'true' && !!l && l.getAttribute('data-live-off') === 'true'; })()" },
};
const DAY = '/?arbor2=1&arbor2room=day', NIGHT = '/?arbor2=1&arbor2room=night';
const ARMS = {
  CNIGHT: { url: NIGHT, room: 'night' },
  CDAY: { url: DAY, room: 'day' },
  NOSUN: { url: DAY, room: 'day', hide: 'NOSUN' },
  NODRIFT: { url: DAY, room: 'day', hide: 'NODRIFT' },
  NOSUNBLUR: { url: DAY, room: 'day', hide: 'NOSUNBLUR' },
  NOSUNMASK: { url: DAY, room: 'day', hide: 'NOSUNMASK' },
  NOVIG: { url: DAY, room: 'day', hide: 'NOVIG' },
  NOFOG: { url: DAY, room: 'day', hide: 'NOFOG' },
  NOPAPER: { url: DAY, room: 'day', hide: 'NOPAPER' },
  NOPERGOLA: { url: DAY, room: 'day', hide: 'NOPERGOLA' },
  NOBREEZE: { url: DAY, room: 'day', hide: 'NOBREEZE' },
  LIVEOFF: { url: DAY, room: 'day', hide: 'LIVEOFF' },
  WRITING: { url: DAY, room: 'day', hide: 'WRITING' },
};
const ORDER = Object.keys(ARMS);
// THE DIFF (added after run 45462428088: no day-only layer moved the cost, and the sun is not drawn on a Board at all): the board with the pop-up open in each
// room, no keys; every element's (and drawn pseudo-element's) costly computed properties, colours masked to 'C', and every running animation; the node prints
// what differs between the rooms, largest box first. ARBOR_120_DIFF_ONLY=1 skips the timed arms.
ARMS.SNAPNIGHT = { url: NIGHT, room: 'night', snap: true };
ARMS.SNAPDAY = { url: DAY, room: 'day', snap: true };
const SNAP = `(() => { const P = ['filter', 'backdropFilter', 'mixBlendMode', 'boxShadow', 'opacity', 'willChange', 'maskImage', 'webkitMaskImage', 'backgroundImage', 'transform', 'isolation', 'position', 'display', 'contain', 'textShadow', 'clipPath', 'animationName', 'transitionProperty', 'zIndex', 'visibility', 'backgroundBlendMode', 'overflow', 'contentVisibility'];
  const seen = {}, out = {}, cls = (e) => e.tagName.toLowerCase() + [...(e.classList || [])].slice(0, 3).map((c) => '.' + c).join('');
  const read = (s) => Object.fromEntries(P.map((p) => [p, String(s[p]).slice(0, 120)]));
  for (const e of [document.documentElement, document.body, ...document.body.querySelectorAll('*')]) { const k0 = cls(e); const n = (seen[k0] = (seen[k0] || 0) + 1); const k = k0 + '#' + n; const b = e.getBoundingClientRect();
    out[k] = { area: Math.round(b.width * b.height), ...read(getComputedStyle(e)) };
    for (const ps of ['::before', '::after']) { const t = getComputedStyle(e, ps); if (t.content && t.content !== 'none' && t.display !== 'none') out[k + ps] = { area: out[k].area, ...read(t) }; } }
  const anims = document.getAnimations().map((a) => { const t = a.effect && a.effect.target; return (a.animationName || a.transitionProperty || a.constructor.name) + ' on ' + (t ? cls(t) + (a.effect.pseudoElement || '') : '?') + ' ' + a.playState; });
  return { out, anims }; })()`;
const CYCLE = 'the board holds still while she writes on ';

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 20000, label: 'splash gone' }).catch(() => {});
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','plateau'); localStorage.setItem('wrizo-theme-prefs', JSON.stringify({ voice: 'serif', page: 'dark', fade: 'on' }));");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await app.emulateDpr(1, VIEW[0], VIEW[1]);
  await splashGone();
  await ev(`window.wrizoCreateJournalPage(${J({ id: BOARD, text: 'Probe 120', pageType: 'board', boxes: makeBoxes(), createdAt: new Date().toISOString(), origin: null, source: null })})`);
  await sleep(500);

  const runArm = async (name, round) => {
    const arm = ARMS[name];
    await ev("location.hash = '#/'"); await sleep(300);
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before seed', timeout: 15000 });
    await ev(`window.wrizoPatchEntry(${J(BOARD)}, { boxes: ${J(makeBoxes())} })`);
    await ev(`localStorage.setItem('wrizo-theme', 'plateau'); localStorage.setItem('wrizo-theme-prefs', JSON.stringify({ voice: 'serif', page: 'dark', fade: 'on' }));`);
    await ev(`history.replaceState(null, '', ${J(arm.url)} + '#/page/${BOARD}')`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.board-canvas .board-box[data-box-id=\"f3-d\"]')", { timeout: 15000, label: 'the board' }).catch(() => {});
    await splashGone();
    await sleep(1400);
    await ev(`(() => { const wrap = document.querySelector('.board-canvas-wrap'), e = document.querySelector('.board-box[data-box-id="f3-d"]'); if (!wrap || !e) return; const r = e.getBoundingClientRect(), w = wrap.getBoundingClientRect(); wrap.scrollLeft += (r.left + r.width / 2) - (w.left + wrap.clientWidth / 2); wrap.scrollTop += (r.top + r.height / 2) - (w.top + wrap.clientHeight / 2); })()`);
    await sleep(900);
    const b = await ev("(() => { const e = document.querySelector('.board-box[data-box-id=\"f3-d\"]'); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height }; })()");
    if (b) await app.doubleClick(Math.round(b.l + b.w * 0.5), Math.round(b.t + b.h * 0.4));
    await app.waitFor("!!document.querySelector('.board-popup-editor')", { timeout: 4000, label: 'the card editor' }).catch(() => {});
    await ev("(() => { const e = document.querySelector('.board-popup-editor'); if (!e) return; e.focus(); const s = getSelection(); s.selectAllChildren(e); s.collapseToEnd(); })()");
    if (arm.snap) { await sleep(IDLE_MS); return { name, snap: await ev(SNAP), room: await ev("document.documentElement.getAttribute('data-arbor2-room')") }; }
    let landed = null;
    if (arm.hide) {
      if (SUSPECTS[arm.hide].css) await ev(`(() => { const s = document.createElement('style'); s.setAttribute('data-p120', ''); s.textContent = ${J(SUSPECTS[arm.hide].css)}; document.head.appendChild(s); })()`);
      if (SUSPECTS[arm.hide].js) await ev(`(() => { ${SUSPECTS[arm.hide].js}; return true; })()`);
      await sleep(SUSPECTS[arm.hide].js ? 600 : 200);
      landed = await ev(SUSPECTS[arm.hide].landed);
    }
    await sleep(IDLE_MS);
    const where = await ev(`(() => { const r = document.documentElement, ed = document.querySelector('.board-popup-editor'), sun = document.querySelector('.arbor2-sun'), dim = document.querySelector('.board-canvas-dim');
      return { theme: r.getAttribute('data-theme'), arbor2: r.hasAttribute('data-arbor2'), room: r.getAttribute('data-arbor2-room'), sun: sun ? getComputedStyle(sun).display : null,
        sunMask: sun ? String(sun.style.maskImage || '').slice(0, 24) : null, dim: dim ? getComputedStyle(dim).opacity : null,
        focused: !!ed && document.activeElement === ed, before: ed ? ed.textContent.length : -1 }; })()`);
    await ev(`(() => { window.__et = []; window.__work = []; let k0 = 0;
      if (window.__p120Off) window.__p120Off();
      const po = new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === 'keydown') window.__et.push(e.duration); }); po.observe({ type: 'event', durationThreshold: 16, buffered: false });
      const kd = () => { k0 = performance.now(); }; const inp = () => { if (k0) { window.__work.push(performance.now() - k0); k0 = 0; } };
      document.addEventListener('keydown', kd, true); document.addEventListener('input', inp, false);
      window.__p120Off = () => { po.disconnect(); document.removeEventListener('keydown', kd, true); document.removeEventListener('input', inp, false); }; return true; })()`);
    for (let i = 0; i < KEYS; i += 1) { await app.typeKeys(CYCLE[(round * 7 + i) % CYCLE.length]); await sleep(GAP); }
    await sleep(600);
    const got = await ev("(() => { const ed = document.querySelector('.board-popup-editor'); const out = { et: window.__et.slice(), work: window.__work.slice(), after: ed ? ed.textContent.length : -1 }; if (window.__p120Off) window.__p120Off(); return out; })()");
    await ev("document.querySelectorAll('style[data-p120]').forEach((s) => s.remove())");
    if (arm.hide && SUSPECTS[arm.hide].undo) await ev(`(() => { ${SUSPECTS[arm.hide].undo}; return true; })()`);
    return { name, round, where, landed, ...got };
  };

  // the diff first (no keys): night, then day
  const sn = await runArm('SNAPNIGHT', 0), sd = await runArm('SNAPDAY', 0);
  {
    const mask = (v) => String(v).replace(/rgba?\([^)]*\)|#[0-9a-f]{3,8}\b/gi, 'C');
    const N = (sn.snap && sn.snap.out) || {}, D = (sd.snap && sd.snap.out) || {};
    const keys = [...new Set([...Object.keys(N), ...Object.keys(D)])];
    const rows = [];
    for (const k of keys) {
      const a = N[k], b = D[k];
      if (!a || !b) { rows.push([(a || b).area, `${k} only ${a ? 'NIGHT' : 'DAY'}`]); continue; }
      const d = Object.keys(a).filter((p) => p !== 'area' && mask(a[p]) !== mask(b[p])).map((p) => `${p}: night ${J(a[p])} | day ${J(b[p])}`);
      if (d.length) rows.push([Math.max(a.area, b.area), `${k} (area ${a.area}/${b.area}) ${d.join(' ; ')}`]);
    }
    rows.sort((x, y) => y[0] - x[0]);
    console.log(`DIFF120 rooms read: ${sn.room} / ${sd.room}; elements ${Object.keys(N).length} / ${Object.keys(D).length}; differing (colours masked) ${rows.length}`);
    for (const r of rows.slice(0, 150)) console.log(`DIFF120 ${r[1]}`);
    const an = (s) => (s && s.snap ? s.snap.anims : []);
    console.log(`DIFF120 animations NIGHT (${an(sn).length}): ${J(an(sn))}`);
    console.log(`DIFF120 animations DAY (${an(sd).length}): ${J(an(sd))}`);
    ok('P5 (premise) the diff read both rooms (night then day, read back) with the board and its pop-up open', sn.room === 'night' && sd.room === 'day' && Object.keys(N).length > 50 && Object.keys(D).length > 50, J({ n: sn.room, d: sd.room }));
  }
  const DIFF_ONLY = process.env.ARBOR_120_DIFF_ONLY === '1';
  if (!DIFF_ONLY) await runArm('CDAY', 0);   // warm-up, discarded
  const res = Object.fromEntries(ORDER.map((k) => [k, []]));
  for (let round = 1; round <= (DIFF_ONLY ? 0 : ROUNDS); round += 1) {
    const rot = ORDER.slice((round - 1) % ORDER.length).concat(ORDER.slice(0, (round - 1) % ORDER.length));
    for (const name of rot) res[name].push(await runArm(name, round));
  }

  const all = Object.values(res).flat();
  if (DIFF_ONLY) return;
  const stood = all.every((r) => r.where && r.where.theme === 'plateau' && r.where.arbor2 && r.where.focused && r.where.room === ARMS[r.name].room);
  ok('P1 (premise) every arm stood where it claims (Arbor, the redesign on, the room pinned and read back, the card editor focused)', stood, J(all.map((r) => [r.name, r.round, r.where])));
  const hid = all.filter((r) => ARMS[r.name].hide);
  ok('P2 (premise) every suspect\'s style LANDED (a computed read) before its keys', hid.length > 0 && hid.every((r) => r.landed === true), J(hid.map((r) => [r.name, r.round, r.landed])));
  const sunKept = all.filter((r) => r.where && ARMS[r.name].room === 'day' && ARMS[r.name].hide !== 'NOSUN');
  // PARKED (Nov 24, ARBOR; SUPERSEDED by P4-B): run 45462428088 read the sun layer's display 'none' in EVERY arm, day included: the pergola is not drawn on a
  // Board (the premise assumed it was). The original is printed verbatim on the parked leg; P4-B reads what is true and is what the timed arms rely on: the
  // sun is NOT what differs between the rooms here, so NOSUN / NODRIFT / NOSUNBLUR / NOSUNMASK hide nothing that is drawn.
  const p4orig = sunKept.every((r) => r.where.sun === 'block') && res.CNIGHT.every((r) => r.where && r.where.sun === 'none');
  const p4b = all.length > 0 && all.every((r) => r.where && r.where.sun === 'none');
  if (process.env.HARNESS_PARKED === '1') console.log(`${p4b ? 'PASS' : 'FAIL'} PARKED (was "P4 (premise) the day room drew its sun layer (display block) in every day arm that keeps it, and night did not", read ${p4orig}) - SUPERSEDED: the sun is not drawn on a Board in either room (run 45462428088); live successor: P4-B`);
  ok('P4-B (premise) the sun layer is not drawn on the Board in any arm (display none, read in every arm), so the rooms do not differ by it here', p4b, J(all.map((r) => [r.name, r.round, r.where && r.where.sun])));
  ok('P3 (premise) every key reached the editor (it grew by the keys typed) and Event Timing saw keydowns in every arm-round', all.every((r) => r.after - r.where.before === KEYS && r.et.length > 0), J(all.map((r) => [r.name, r.round, r.after - r.where.before, r.et.length])));
  for (const name of ORDER) {
    const s = stat(res[name].flatMap((r) => r.et)), w = stat(res[name].flatMap((r) => r.work));
    console.log(`P120 ${name.padEnd(9)} room ${J([...new Set(res[name].map((r) => r.where && r.where.room))])} sun ${J([...new Set(res[name].map((r) => r.where && r.where.sun))])} Event Timing keydown n ${s.n} med ${s.med} p95 ${s.p95} max ${s.max} >=48 ${s.ge48} | work med ${w.med == null ? null : Math.round(w.med * 10) / 10}`);
  }
}); } catch (e) { ok('the probe ran to the end', false, String(e && e.message || e).slice(0, 400)); }

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 1200)}]` : ''}`);
const EXPECTED = process.env.ARBOR_120_DIFF_ONLY === "1" ? 1 : 5;
const passed = checks.filter((c) => c.pass).length;
const verdict = passed === checks.length && checks.length === EXPECTED;
console.log(verdict ? `\nARBOR-120-PROBE VERIFY: PASS (${checks.length} checks; the P120 lines are the reading)` : `\nARBOR-120-PROBE VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed${checks.length !== EXPECTED ? `, ${checks.length} of ${EXPECTED} checks ran` : ''}`);
process.exit(verdict ? 0 : 1);
