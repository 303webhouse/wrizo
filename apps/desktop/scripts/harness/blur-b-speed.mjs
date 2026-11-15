// BLUR-B-SPEED (Fable, Nov 14 6:18 pm: "a speed check with a mutant that puts the live blur back"; Nick's look B: the board behind a card's popup is blurred ONCE and held still). The box measured what the live blur costs
// (bug #102, Nov 15): over Flux's board it holds the FIRST FRAME at 22.5 ms against Arbor's 12.1, and key-to-paint is late on almost every key while the Schema layer's canvases are on screen; a static image costs what "filter off" costs.
// This types into the open card (44 keys, one every 90 ms, flux3-latency-zoom's own meter and bar of method) in five arms, the order rotating each round, 8 rounds, one discarded warm-up:
//   FB  Flux (?flux3=1: the Schema and its layer under the cards), look B AS SHIPPED (the snapshot, the live board hidden)
//   FO  Flux, the reference: the live board shown, NO filter and no snapshot ("filter off", the cost floor with the canvases still on)
//   FL  Flux, the MUTANT: TODAY'S live blur forced back (a stylesheet; the snapshot slot off, the live board shown)
//   AB  Arbor, look B as shipped        AL  Arbor, the live blur forced back
// READINGS (per key, in the page): FIRST FRAME (keydown -> the first animation frame after its beforeinput), PAINT (the l-method's BUSY + FRAME), KEY-TO-PAINT lateness (Event Timing, keys >= 48 ms). The clock (keydown -> the second frame) is
// NOT used: it cannot see a cost under a frame (the zoom probe's per-key print, Nov 14).
// VERDICTS: BS-premise (gates everywhere): each arm stood where it claims (FB/AB snapped, the live filter dropped; FO unfiltered and not snapped; FL/AL filtered and not snapped); >= 40 keys painted per arm-round; every key reached the card.
//   BS-first (a timing line: gates on the box, information on Actions): look B's FIRST FRAME median <= the reference's + the reference's own round spread (floor 1 ms, cap 4).   BS-paint: B's PAINT p95 <= the reference's + its own spread (floor 3, cap 10).
//   BS-late (a timing line): B's late-key count <= the reference's (look B hides the layer's canvases too, so it should be better, never worse).
//   MUT-live (a timing line): the live blur put back is CAUGHT: FL's first frame median exceeds FO's by more than twice the allowance, OR its paint p95 does (the box sees the first frame, the hosted runner the paint).
// THE BIG BOARD (Chat 1, Nov 15): a 100-card board, the card opened and the first 10 keys typed straight away while the snapshot is being made: BG-premise / BG-keys / BG-long / BG-arrive, and MUT-slowsnap (a 300 ms serialiser).
// Run: node scripts/harness/blur-b-speed.mjs   (from apps/desktop; the timing lines gate on the box; BLUR_ROUNDS=<n>)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';
import { isOnBox, timingGate } from '../lib/timing-gate.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, '..', '..', '..', '..');
const DIST = path.resolve(here, '..', '..', 'dist-web');
const ROUNDS = Math.max(3, Number(process.env.BLUR_ROUNDS || 8));
const KEYS = 44, MIN_KEYS = 40, GAP = 90, IDLE_MS = 1500;
const BOARD = 'bbs-board';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const ON_BOX = isOnBox();
const timing = (name, pass, detail = '') => {
  const g = timingGate(ON_BOX, pass);
  checks.push({ name: g.info ? `${name} [INFORMATION on Actions: the measure ${g.actual ? 'PASSED' : 'did NOT pass'}; this line gates nothing here]` : name, pass: g.pass, detail });
  if (g.info && !g.actual) console.log(`INFO (would have failed on the box) ${name} -- ${detail}`);
};
const LIVE_CSS = ".board-blur-snap-slot{display:none!important}.board-canvas-blur-wrap[data-blur='snap']{filter:blur(6px)!important;transition:none!important}.board-canvas-blur-wrap[data-blur='snap'] > :not(.board-blur-snap-slot){visibility:visible!important}";
const OFF_CSS = ".board-canvas-blurred{filter:none!important}.board-blur-snap-slot{display:none!important}.board-canvas-blur-wrap[data-blur='snap']{filter:none!important}.board-canvas-blur-wrap[data-blur='snap'] > :not(.board-blur-snap-slot){visibility:visible!important}";
const ARMS = {
  FB: { theme: 'flux', flag: true, css: '', want: 'snap', what: 'Flux, look B as shipped' },
  FO: { theme: 'flux', flag: true, css: OFF_CSS, want: 'off', what: 'Flux, filter off (the reference)' },
  FL: { theme: 'flux', flag: true, css: LIVE_CSS, want: 'live', what: 'Flux, the live blur put back (the mutant)' },
  AB: { theme: 'plateau', flag: false, css: '', want: 'snap', what: 'Arbor, look B as shipped' },
  AL: { theme: 'plateau', flag: false, css: LIVE_CSS, want: 'live', what: 'Arbor, the live blur put back' },
};

function buildIdentity() {
  const out = { bundle: null, builtAt: null, head: null, srcCommitAt: null, dirtySrc: null, stale: null };
  try {
    const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
    const m = html.match(/assets\/(index-[\w-]+\.js)/);
    out.bundle = m ? m[1] : null;
    out.builtAt = fs.statSync(path.join(DIST, 'index.html')).mtime.toISOString();
  } catch { /* no bundle: withHarness refuses on its own */ }
  try {
    const git = (...a) => execFileSync('git', a, { cwd: REPO, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    out.head = git('rev-parse', '--short=8', 'HEAD');
    out.srcCommitAt = new Date(Number(git('log', '-1', '--format=%ct', '--', 'apps/desktop/src')) * 1000).toISOString();
    out.dirtySrc = git('status', '--porcelain', '--', 'apps/desktop/src').split('\n').filter(Boolean).length;
    out.stale = out.builtAt ? Date.parse(out.builtAt) < Date.parse(out.srcCommitAt) : null;
  } catch { /* git unavailable: B fails on it */ }
  return out;
}
const BUILD = buildIdentity();
console.log(`BUILD: tree=${BUILD.head} bundle=${BUILD.bundle} builtAt=${BUILD.builtAt} lastSrcCommit=${BUILD.srcCommitAt} dirtySrcFiles=${BUILD.dirtySrc} stale=${BUILD.stale}`);

const stat = (xs) => { const s = (xs || []).filter((x) => x != null).slice().sort((a, b) => a - b); const q = (p) => (s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null); return { n: s.length, median: q(0.5), p95: q(0.95) }; };
const r1 = (x) => (x === null || x === undefined ? null : Math.round(x * 10) / 10);
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const spreadOf = (rounds, f, g) => { const v = rounds.map((r) => stat(f(r))[g]).filter((x) => x != null); return v.length ? Math.max(...v) - Math.min(...v) : 0; };

const makeBoxes = () => {
  const T = (id, x, y, z, text) => ({ id, kind: 'text', x, y, w: 0.2, h: 0.1, z, text });
  const L = (id, a, b, z) => ({ id, kind: 'connection', x: 0, y: 0, w: 0, h: 0, z, connA: a, connB: b });
  return [
    T('bb-a', 0.05, 0.05, 1, 'The opening: she arrives at the house after dark and finds the door already open.'), T('bb-b', 0.5, 0.05, 2, 'What she wants'),
    T('bb-c', 0.05, 0.4, 3, 'The hall, the stairs, the smell of woodsmoke'), T('bb-d', 0.5, 0.4, 4, 'The middle: she tells the lie'),
    T('bb-e', 0.05, 0.75, 5, 'Card E'), T('bb-f', 0.5, 0.75, 6, 'Card F, the turn'), T('bb-g', 0.75, 0.4, 7, 'Card G, no link'), T('bb-h', 0.75, 0.05, 8, 'The hook'),
    L('bb-ac', 'bb-a', 'bb-c', 10), L('bb-bd', 'bb-b', 'bb-d', 11), L('bb-ef', 'bb-e', 'bb-f', 12),
    { id: 'bb-meta', kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 0, canvasH: 1800 },
  ];
};
const CYCLE = 'the signal holds while she writes on ';

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 20000, label: 'splash gone' }).catch(() => {});
  const hashTo = async (h) => { await ev(`location.hash = ${JSON.stringify(h)}`); await sleep(300); };

  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme-prefs', JSON.stringify({ voice: 'serif', page: 'dark', fade: 'on' }));");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await app.emulateDpr(1, 1920, 1080);
  await splashGone();
  await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id: BOARD, text: 'Look B speed', pageType: 'board', boxes: makeBoxes(), createdAt: new Date().toISOString(), origin: null, source: null })})`);
  await sleep(500);

  const runArm = async (name, round) => {
    const arm = ARMS[name];
    await hashTo('#/');
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before the board', timeout: 15000 });
    await ev(`window.wrizoPatchEntry(${JSON.stringify(BOARD)}, { boxes: ${JSON.stringify(makeBoxes())} })`);
    await ev(`localStorage.setItem('wrizo-theme', ${JSON.stringify(arm.theme)});`);
    await ev(`history.replaceState(null, '', ${JSON.stringify(arm.flag ? '/?flux3=1' : '/')} + '#/page/${BOARD}')`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.board-canvas .board-box[data-box-id=\"bb-d\"]')", { timeout: 15000, label: 'the board' }).catch(() => {});
    await splashGone();
    if (arm.flag) await app.waitFor("!!document.querySelector('[data-flux3-layer]')", { timeout: 10000, label: 'the Schema' }).catch(() => {});
    await sleep(1400);
    if (arm.css) await ev(`(() => { const s = document.createElement('style'); s.setAttribute('data-probe', '1'); s.textContent = ${JSON.stringify(arm.css)}; document.head.appendChild(s); return true; })()`);
    const p = await ev("(() => { const e = document.querySelector('.board-box[data-box-id=\"bb-d\"]'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height * 0.4) }; })()");
    if (p) await app.doubleClick(p.x, p.y);
    await app.waitFor("!!document.querySelector('.board-popup-editor')", { timeout: 5000, label: 'the card editor' }).catch(() => {});
    if (arm.want === 'snap') await app.waitFor("document.querySelector('.board-canvas-blur-wrap')?.getAttribute('data-blur') === 'snap'", { timeout: 6000, label: 'the snapshot' }).catch(() => {});
    await ev("(() => { const e = document.querySelector('.board-popup-editor'); if (!e) return; e.focus(); const s = getSelection(); s.selectAllChildren(e); s.collapseToEnd(); })()");
    await sleep(IDLE_MS);
    const where = await ev(`(() => { const w = document.querySelector('.board-canvas-blur-wrap'), cs = w && getComputedStyle(w), first = w && w.firstElementChild, ed = document.querySelector('.board-popup-editor');
      const scripts = [...document.scripts].map((s) => s.getAttribute('src') || '').filter((s) => /index-/.test(s));
      return { theme: document.documentElement.getAttribute('data-theme'), flag: new URLSearchParams(location.search).get('flux3'), layer: document.querySelectorAll('[data-flux3-layer]').length,
        dataBlur: w ? w.getAttribute('data-blur') : null, filter: cs ? cs.filter : null, boardVisibility: first ? getComputedStyle(first).visibility : null, focused: !!ed && document.activeElement === ed, before: ed ? ed.textContent.length : -1,
        served: scripts.length ? scripts[0].replace(/^.*\\//, '') : null }; })()`);
    await ev(`(() => {
      window.__ks = []; window.__et = []; let cur = null;
      if (window.__latOff) window.__latOff();
      try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__et.push([e.name, e.duration]); }).observe({ type: 'event', durationThreshold: 16 }); } catch (e) { /* no Event Timing */ }
      const kd = () => { cur = { kd: performance.now(), f1: null, busy: null, frame: null }; window.__ks.push(cur); };
      const bi = () => { const k = cur; requestAnimationFrame(() => { const r = performance.now(); if (k) k.f1 = r - k.kd; const mc = new MessageChannel(); mc.port1.onmessage = () => { if (k) k.frame = performance.now() - r; mc.port1.close(); }; mc.port2.postMessage(0); }); };
      const inp = () => { const k = cur; if (!k || k.busy !== null || k.posted) return; k.posted = true; const mc = new MessageChannel(); mc.port1.onmessage = () => { k.busy = performance.now() - k.kd; mc.port1.close(); }; mc.port2.postMessage(0); };
      document.addEventListener('keydown', kd, true); document.addEventListener('beforeinput', bi, true); document.addEventListener('beforeinput', inp, false); document.addEventListener('input', inp, false);
      window.__latOff = () => { document.removeEventListener('keydown', kd, true); document.removeEventListener('beforeinput', bi, true); document.removeEventListener('beforeinput', inp, false); document.removeEventListener('input', inp, false); };
      return true; })()`);
    let typed = '';
    for (let i = 0; i < KEYS; i += 1) { const ch = CYCLE[(round * 7 + i) % CYCLE.length]; typed += ch; await app.typeKeys(ch); await sleep(GAP); }
    await sleep(300);
    const got = await ev("(() => ({ ks: window.__ks.map((k) => [k.f1, k.busy, k.frame].map((x) => (x == null ? null : Math.round(x * 10) / 10))), et: window.__et.filter((e) => e[0] === 'keydown').map((e) => e[1]), after: (document.querySelector('.board-popup-editor') || { textContent: '' }).textContent.length }))()");
    return { name, round, where, typed: typed.length, ...got };
  };

  await runArm('FB', 0);   // the discarded warm-up
  const order = Object.keys(ARMS);
  const res = Object.fromEntries(order.map((k) => [k, []]));
  for (let round = 1; round <= ROUNDS; round += 1) {
    const rot = order.slice((round - 1) % order.length).concat(order.slice(0, (round - 1) % order.length));
    for (const name of rot) res[name].push(await runArm(name, round));
  }
  const all = Object.values(res).flat();

  // ---- the premise
  const placed = all.filter((r) => {
    const a = ARMS[r.name], w = r.where, f = w.filter || 'none';
    const flagOk = a.flag ? w.flag === '1' && w.layer === 1 : w.flag === null && w.layer === 0;
    const stateOk = a.want === 'snap' ? w.dataBlur === 'snap' && f === 'none' && w.boardVisibility === 'hidden'
      : a.want === 'live' ? /blur/.test(f) && w.boardVisibility === 'visible'   // the snapshot is still MADE in these arms (data-blur is set); the stylesheet undoes its effect, so the EFFECTIVE state is what is judged
      : f === 'none' && w.boardVisibility === 'visible';
    return w.theme === a.theme && flagOk && stateOk && w.focused;
  });
  ok(`BS-premise every arm stood where it claims (FB/AB: snapshot held, live filter dropped, live board hidden; FO: effectively unfiltered, live board shown; FL/AL: effectively the live blur, live board shown; the theme, the flag, the layer, the editor focused): ${placed.length}/${all.length}`,
    placed.length === all.length, JSON.stringify(all.filter((r) => !placed.includes(r)).slice(0, 3).map((r) => ({ arm: r.name, round: r.round, where: r.where }))));
  const thin = all.filter((r) => r.ks.filter((k) => k[0] != null).length < MIN_KEYS);
  ok(`BS-keys at least ${MIN_KEYS} keys painted in every arm-round (${KEYS} typed each)`, thin.length === 0, JSON.stringify(thin.map((r) => ({ arm: r.name, round: r.round }))));
  const lost = all.filter((r) => r.after - r.where.before !== r.typed);
  ok('BS-typed no key was dropped: in every arm-round the card editor grew by exactly the characters typed', lost.length === 0, JSON.stringify(lost.slice(0, 4).map((r) => ({ arm: r.name, round: r.round, grew: r.after - r.where.before, typed: r.typed }))));

  // ---- the readings
  const ff = (r) => r.ks.map((k) => k[0]).filter((x) => x != null);
  const paint = (r) => r.ks.filter((k) => k[1] != null && k[2] != null).map((k) => k[1] + k[2]);
  const late = (arm) => res[arm].reduce((a, r) => a + r.et.filter((d) => d >= 48).length, 0);
  const S = Object.fromEntries(order.map((k) => [k, { ff: stat(res[k].flatMap(ff)), paint: stat(res[k].flatMap(paint)), late: late(k), nEt: res[k].reduce((a, r) => a + r.et.length, 0) }]));
  for (const k of order) console.log(`BLURB-SPEED ${k.padEnd(3)} first frame ${r1(S[k].ff.median)}/${r1(S[k].ff.p95)} | paint ${r1(S[k].paint.median)}/${r1(S[k].paint.p95)} | key-to-paint >= 48 ms: ${S[k].late} of ${S[k].nEt} logged | ${ARMS[k].what}`);
  const allowFF = clamp(spreadOf(res.FO, ff, 'median'), 1, 4), allowPaint = clamp(spreadOf(res.FO, paint, 'p95'), 3, 10);
  timing(`BS-first look B's FIRST FRAME costs what filter off costs: FB median ${r1(S.FB.ff.median)} <= FO ${r1(S.FO.ff.median)} + ${r1(allowFF)}`, S.FB.ff.median <= S.FO.ff.median + allowFF, JSON.stringify({ FB: S.FB.ff, FO: S.FO.ff, allowFF }));
  timing(`BS-paint look B's PAINT p95 costs what filter off costs: FB ${r1(S.FB.paint.p95)} <= FO ${r1(S.FO.paint.p95)} + ${r1(allowPaint)}`, S.FB.paint.p95 <= S.FO.paint.p95 + allowPaint, JSON.stringify({ FB: S.FB.paint, FO: S.FO.paint, allowPaint }));
  timing(`BS-late look B holds no more keys late than filter off (it hides the layer's canvases too): FB ${S.FB.late} <= FO ${S.FO.late} (of ${S.FB.nEt} / ${S.FO.nEt} logged)`, S.FB.late <= S.FO.late, JSON.stringify({ FB: S.FB.late, FO: S.FO.late }));
  const mutFF = S.FL.ff.median > S.FO.ff.median + 2 * allowFF, mutPaint = S.FL.paint.p95 > S.FO.paint.p95 + 2 * allowPaint;
  timing(`MUT-live the live blur put back is CAUGHT (first frame ${r1(S.FL.ff.median)} vs FO ${r1(S.FO.ff.median)} + ${r1(2 * allowFF)}: ${mutFF ? 'YES' : 'no'}; paint p95 ${r1(S.FL.paint.p95)} vs ${r1(S.FO.paint.p95)} + ${r1(2 * allowPaint)}: ${mutPaint ? 'YES' : 'no'})`, mutFF || mutPaint, JSON.stringify({ FL: S.FL, FO: S.FO }));
  ok(`BS-arbor (information) Arbor: look B ${r1(S.AB.ff.median)} / paint p95 ${r1(S.AB.paint.p95)} against the live blur ${r1(S.AL.ff.median)} / ${r1(S.AL.paint.p95)}`, true, '');

  // ---- THE BIG BOARD (Chat 1, Nov 15: "the big-board case, about 100 cards, the first 10 keys after opening"). The snapshot is made two frames after the card opens, on the main thread, in the same moment she starts to
  // type: on a board of a hundred cards the clone-and-serialise is the one place look B could COST a keystroke. Three arms on a 100-card board (Flux, ?flux3=1: the Schema and its layer), the card opened and 10 keys typed
  // straight away (one every 90 ms, NO idle wait: the snapshot is still being made under the first of them):
  //   GB  look B as shipped      GL  the live blur forced (today's look: the reference for a first-keys read)      GM  the MUTANT: the snapshot made SLOW (serializeToString burns 300 ms), to prove the check can see a slow capture
  // READINGS (in the page): each key's FIRST FRAME (keydown -> the first animation frame after its beforeinput); LONG TASKS (PerformanceObserver 'longtask') from the card opening; the SNAPSHOT'S ARRIVAL (ms from the
  // editor appearing to data-blur="snap").
  // BG-premise (gates everywhere): every GB/GM round got its snapshot (data-blur snap) and all 10 keys landed; GL stayed live; the 100 cards stood.   BG-keys (a timing line): look B's worst first-10-keys first frame <= BIG_KEY_MS in every round.
  // BG-long (timing): the longest long task in look B's first 1.5 s <= BIG_TASK_MS.   BG-arrive (timing): the snapshot arrives within BIG_ARRIVE_MS.   MUT-slowsnap (timing): the slow capture is CAUGHT: GM's worst key or longest task
  // exceeds look B's budget (and the 300 ms burn is MEASURED to have landed: a long task of at least 280 ms), so BG-keys or BG-long would be RED.
  const BIG_KEY_MS = 100, BIG_TASK_MS = 250, BIG_ARRIVE_MS = 1500;
  const BIGBOARD = 'bbs-big';
  const bigBoxes = () => {
    const out = [];
    for (let i = 0; i < 100; i += 1) {
      const col = i % 10, row = Math.floor(i / 10);
      out.push({ id: `bg-${i}`, kind: 'text', x: 0.01 + col * 0.098, y: 0.01 + row * 0.07, w: 0.09, h: 0.055, z: i + 1, text: `Card ${i}: ${['the hall', 'what she wants', 'the lie', 'the turn', 'the door left open'][i % 5]}, and a line more to fill it.` });
    }
    for (let i = 0; i < 24; i += 1) out.push({ id: `bgl-${i}`, kind: 'connection', x: 0, y: 0, w: 0, h: 0, z: 200 + i, connA: `bg-${i * 4}`, connB: `bg-${i * 4 + 5}` });
    out.push({ id: 'bg-meta', kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 0, canvasH: 1500 });
    return out;
  };
  await hashTo('#/');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before the big board', timeout: 15000 });
  await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id: BIGBOARD, text: 'Look B big board', pageType: 'board', boxes: bigBoxes(), createdAt: new Date().toISOString(), origin: null, source: null })})`);
  await sleep(500);
  const BIG_ARMS = {
    GB: { css: '', burn: false, what: 'the big board, look B as shipped' },
    GL: { css: LIVE_CSS, burn: false, what: 'the big board, the live blur forced' },
    GM: { css: '', burn: true, what: 'the big board, the snapshot made SLOW (the mutant)' },
  };
  const runBig = async (name, round) => {
    const arm = BIG_ARMS[name];
    await hashTo('#/');
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before the big board', timeout: 15000 });
    await ev(`window.wrizoPatchEntry(${JSON.stringify(BIGBOARD)}, { boxes: ${JSON.stringify(bigBoxes())} })`);
    await ev("localStorage.setItem('wrizo-theme', 'flux');");
    await ev(`history.replaceState(null, '', '/?flux3=1#/page/${BIGBOARD}')`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.board-canvas .board-box[data-box-id=\"bg-45\"]') && !!document.querySelector('[data-flux3-layer]')", { timeout: 20000, label: 'the big board' }).catch(() => {});
    await splashGone();
    await sleep(1800);
    const cards = await ev("document.querySelectorAll('.board-canvas .board-box').length");
    if (arm.css) await ev(`(() => { const s = document.createElement('style'); s.setAttribute('data-probe', '1'); s.textContent = ${JSON.stringify(arm.css)}; document.head.appendChild(s); return true; })()`);
    if (arm.burn) await ev("(() => { const o = XMLSerializer.prototype.serializeToString; XMLSerializer.prototype.serializeToString = function (...a) { const t = performance.now(); while (performance.now() - t < 300) { /* the slow capture */ } return o.apply(this, a); }; return true; })()");
    // the meters go in BEFORE the card opens, so the capture is inside what they see
    await ev(`(() => {
      window.__big = { popup: null, snap: null, long: [], keys: [] }; let cur = null;
      try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__big.long.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ type: 'longtask' }); } catch (e) { /* no longtask */ }
      new MutationObserver(() => { if (window.__big.popup === null && document.querySelector('.board-popup-editor')) window.__big.popup = performance.now(); const w = document.querySelector('.board-canvas-blur-wrap'); if (w && window.__big.snap === null && w.getAttribute('data-blur') === 'snap') window.__big.snap = performance.now(); }).observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-blur'] });
      document.addEventListener('keydown', () => { cur = { kd: performance.now(), f1: null }; window.__big.keys.push(cur); }, true);
      document.addEventListener('beforeinput', () => { const k = cur; requestAnimationFrame(() => { if (k) k.f1 = performance.now() - k.kd; }); }, true);
      return true; })()`);
    const p = await ev("(() => { const e = document.querySelector('.board-box[data-box-id=\"bg-45\"]'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height * 0.4) }; })()");
    if (p) await app.doubleClick(p.x, p.y);
    await app.waitFor("!!document.querySelector('.board-popup-editor')", { timeout: 5000, label: 'the card editor' }).catch(() => {});
    await ev("(() => { const e = document.querySelector('.board-popup-editor'); if (!e) return; e.focus(); const s = getSelection(); s.selectAllChildren(e); s.collapseToEnd(); })()");
    const before = await ev("(document.querySelector('.board-popup-editor') || { textContent: '' }).textContent.length");
    // ten keys at once, one every 90 ms: the first of them lands while the snapshot is being made
    for (let i = 0; i < 10; i += 1) { await app.typeKeys(CYCLE[(round * 7 + i) % CYCLE.length]); await sleep(GAP); }
    await sleep(1800);
    const got = await ev("(() => { const b = window.__big, w = document.querySelector('.board-canvas-blur-wrap'); return { popup: b.popup, snap: b.snap, long: b.long.slice(), keys: b.keys.map((k) => (k.f1 == null ? null : Math.round(k.f1 * 10) / 10)), dataBlur: w ? w.getAttribute('data-blur') : null, filter: w ? getComputedStyle(w).filter : null, after: (document.querySelector('.board-popup-editor') || { textContent: '' }).textContent.length }; })()");
    return { name, round, cards, before, ...got };
  };
  await runBig('GB', 0);   // a discarded warm-up
  const bigRes = { GB: [], GL: [], GM: [] };
  const BIG_ROUNDS = Math.max(3, Math.min(ROUNDS, 6));
  for (let round = 1; round <= BIG_ROUNDS; round += 1) {
    const rot = Object.keys(BIG_ARMS).slice((round - 1) % 3).concat(Object.keys(BIG_ARMS).slice(0, (round - 1) % 3));
    for (const name of rot) bigRes[name].push(await runBig(name, round));
  }
  const bigAll = Object.values(bigRes).flat();
  const worstKey = (r) => Math.max(...r.keys.filter((x) => x != null), 0);
  const longestTask = (r) => Math.max(...r.long.filter((l) => l[0] >= (r.popup || 0) - 50).map((l) => l[1]), 0);
  const arrive = (r) => (r.snap != null && r.popup != null ? Math.round(r.snap - r.popup) : null);
  for (const k of Object.keys(bigRes)) console.log(`BLURB-BIG ${k} worst first-10-keys first frame ${bigRes[k].map((r) => r1(worstKey(r))).join('/')} ms | longest long task ${bigRes[k].map(longestTask).join('/')} ms | the snapshot arrived after ${bigRes[k].map(arrive).join('/')} ms | ${BIG_ARMS[k].what}`);
  ok(`BG-premise the big board stood (${[...new Set(bigAll.map((r) => r.cards))].join(',')} cards), every GB/GM round got its snapshot, GL stayed live, all 10 keys landed in every round`,
    bigAll.every((r) => r.cards >= 100 && r.after - r.before === 10) && [...bigRes.GB, ...bigRes.GM].every((r) => r.dataBlur === 'snap' && r.snap != null) && bigRes.GL.every((r) => r.dataBlur === 'snap' ? /blur/.test(r.filter || '') : true),
    JSON.stringify(bigAll.filter((r) => !(r.cards >= 100 && r.after - r.before === 10)).slice(0, 3).map((r) => ({ arm: r.name, round: r.round, cards: r.cards, grew: r.after - r.before, dataBlur: r.dataBlur }))));
  const gbKey = Math.max(...bigRes.GB.map(worstKey)), gbTask = Math.max(...bigRes.GB.map(longestTask)), gbArr = Math.max(...bigRes.GB.map((r) => arrive(r) ?? 99999));
  timing(`BG-keys on a 100-card board look B's worst first-10-keys first frame is within ${BIG_KEY_MS} ms in every round (worst ${r1(gbKey)} ms; the live blur's ${r1(Math.max(...bigRes.GL.map(worstKey)))})`, gbKey <= BIG_KEY_MS, JSON.stringify(bigRes.GB.map((r) => ({ round: r.round, keys: r.keys }))));
  timing(`BG-long the longest long task in look B's first moments is within ${BIG_TASK_MS} ms (worst ${gbTask} ms)`, gbTask <= BIG_TASK_MS, JSON.stringify(bigRes.GB.map((r) => ({ round: r.round, long: r.long }))));
  timing(`BG-arrive the snapshot arrives within ${BIG_ARRIVE_MS} ms of the card opening (worst ${gbArr} ms)`, gbArr <= BIG_ARRIVE_MS, JSON.stringify(bigRes.GB.map((r) => ({ round: r.round, arrive: arrive(r) }))));
  const gmKey = Math.max(...bigRes.GM.map(worstKey)), gmTask = Math.max(...bigRes.GM.map(longestTask));
  timing(`MUT-slowsnap the slow capture (a 300 ms burn in the serialiser) is CAUGHT: its longest task ${gmTask} ms (the burn landed: >= 280) and worst key ${r1(gmKey)} ms against the budgets ${BIG_TASK_MS} / ${BIG_KEY_MS}`, gmTask >= 280 && (gmTask > BIG_TASK_MS || gmKey > BIG_KEY_MS), JSON.stringify({ GM: bigRes.GM.map((r) => ({ round: r.round, long: r.long, keys: r.keys })) }));

  const served = new Set(all.map((r) => r.where.served));
  ok(`B the build: served ${[...served].join(',')} = dist-web's ${BUILD.bundle}, built ${BUILD.builtAt} after the last src commit ${BUILD.srcCommitAt} (tree ${BUILD.head}, ${BUILD.dirtySrc} uncommitted src file(s))`,
    !!BUILD.bundle && served.size === 1 && served.has(BUILD.bundle) && BUILD.stale === false, JSON.stringify(BUILD));
}); } catch (err) { ok('the run reached its end', false, String((err && err.stack) || err).split('\n').slice(0, 3).join(' | ')); }

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
console.log(failed.length ? `\nBLUR-B-SPEED VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nBLUR-B-SPEED VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
