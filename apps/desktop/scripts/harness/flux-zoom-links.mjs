// FLUX-ZOOM-LINKS (Fable, Nov 14 6:42 pm, after the Wrizors' zoom pass 1 (claude/wrizors/flux-zoom-pass-1.md) found ONE real blocker: below 1.00 the dashed links leave their cards - at the outer limit they sit in
// the stage's top-left while the cards are centred, against spec §2's "one camera"): "a check that every link's two ends land on its two cards' edges at 0.199, 0.50, 1.00, 2.00 and 4.00 in both skins, with a mutant".
// WHAT IT MEASURES (the drawn PIXELS, never the layer's own opinion of itself): the Schema board (the nine cards and four links of flux3-s1) under ?flux3=1, in Page: Dark and Page: Light. At each scale (through the
// camera's own door, window.wrizoFluxZoomTo; the outer limit is asked for as 0.01 and lands where the clamp puts it) the expected end of each link is taken from the CARDS' own rects on screen - the layer's route()
// leaves A's facing side at its middle and enters B's: (A.right or A.left, A.centre-y) to (B.left or B.right, B.centre-y), the side by which card's centre is further right - and the nearest drawn pixel of the layer's
// MOTION canvas (the links only; the ground is its own canvas) is found within 90 px of it. An end PASSES when a link pixel lies within TOL px of the point. Only ends inside the stage's frame are judged (at 2.00
// and 4.00 the card in view is centred, so its own ends are); each scale needs at least MIN_ENDS judged. Read twice: HELD (250 ms after the zoom: the layer's held frame follows as a CSS transform) and SETTLED
// (1800 ms: the real redraw). DIAG prints, per scale and state, the camera's canvas rect, the layer's rects and the held transform, so a failure names where the layer sits against the canvas.
// MUT-links: a stylesheet shifts the whole layer by (-90, -60) px (CSS `translate`): the check must FAIL there, the shift is MEASURED to have landed (the motion canvas's rect moved by it), at 1.00 and 0.50, Dark.
// Run: node scripts/harness/flux-zoom-links.mjs   (from apps/desktop; browserless-ish: a hosted runner is fine, there is no timing line)
import { withHarness } from '../runtime-verify.mjs';

const VIEW = [1920, 1080];
const BOARD = 'fzl-board';
const TOL = 6, RADIUS = 90, MIN_ENDS = 2;
const SCALES = [['outer', 0.01], ['0.50', 0.5], ['1.00', 1], ['2.00', 2], ['4.00', 4]];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });

const makeBoxes = () => {
  const T = (id, x, y, z, text) => ({ id, kind: 'text', x, y, w: 0.2, h: 0.1, z, text });
  const L = (id, a, b, z) => ({ id, kind: 'connection', x: 0, y: 0, w: 0, h: 0, z, connA: a, connB: b });
  return [
    T('f3-a', 0.05, 0.05, 1, 'Card A'), T('f3-b', 0.5, 0.05, 2, 'Card B'), T('f3-c', 0.05, 0.4, 3, 'Card C'), T('f3-d', 0.5, 0.4, 4, 'Card D'),
    T('f3-e', 0.05, 0.75, 5, 'Card E'), T('f3-f', 0.5, 0.75, 6, 'Card F'), T('f3-g', 0.75, 0.4, 7, 'Card G, no link'), T('f3-h', 0.75, 0.05, 8, 'The hook'),
    L('f3-ac', 'f3-a', 'f3-c', 10), L('f3-bd', 'f3-b', 'f3-d', 11), L('f3-ef', 'f3-e', 'f3-f', 12), L('f3-ad', 'f3-a', 'f3-d', 13),
    { id: 'f3-meta', kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 0, canvasH: 3400 },
  ];
};
const LINKS = [['f3-a', 'f3-c'], ['f3-b', 'f3-d'], ['f3-e', 'f3-f'], ['f3-a', 'f3-d']];

// the in-page measurement: returns { ends: [{ link, end, x, y, dist }], diag }
const MEASURE = `((LINKS, RADIUS, TOL) => {
  const host = document.querySelector('[data-flux3-layer]') && document.querySelector('[data-flux3-layer]').parentElement;
  const mcv = document.querySelector('[data-flux3-layer] canvas:nth-child(2)') || document.querySelectorAll('[data-flux3-layer] canvas')[1];
  const cv = document.querySelector('.board-canvas'), wrap = document.querySelector('.board-canvas-wrap'), layer = document.querySelector('[data-flux3-layer]');
  const rc = (e) => { const r = e.getBoundingClientRect(); return { l: Math.round(r.left * 10) / 10, t: Math.round(r.top * 10) / 10, w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10 }; };
  const diag = { canvas: cv ? rc(cv) : null, wrap: wrap ? rc(wrap) : null, host: host ? rc(host) : null, layer: layer ? rc(layer) : null, mcv: mcv ? rc(mcv) : null, mcvPx: mcv ? [mcv.width, mcv.height] : null,
    held: layer && layer.firstElementChild ? layer.firstElementChild.style.transform : null, canvasTransform: cv ? cv.style.transform : null };
  const out = { ends: [], diag };
  if (!mcv || !mcv.width || !mcv.height || !wrap) return out;
  const mr = mcv.getBoundingClientRect(), wr = wrap.getBoundingClientRect();
  const ctx = mcv.getContext('2d'); const img = ctx.getImageData(0, 0, mcv.width, mcv.height), W = mcv.width, H = mcv.height, d = img.data;
  const kx = W / mr.width, ky = H / mr.height;
  const card = (id) => { const e = document.querySelector('.board-box[data-box-id="' + id + '"]'); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, cx: r.left + r.width / 2, cy: r.top + r.height / 2 }; };
  const nearest = (x, y) => {
    const px = (x - mr.left) * kx, py = (y - mr.top) * ky, R = Math.ceil(RADIUS * Math.max(kx, ky));
    let best = Infinity;
    for (let yy = Math.max(0, Math.floor(py - R)); yy <= Math.min(H - 1, Math.ceil(py + R)); yy += 1) {
      for (let xx = Math.max(0, Math.floor(px - R)); xx <= Math.min(W - 1, Math.ceil(px + R)); xx += 1) {
        if (d[(yy * W + xx) * 4 + 3] > 24) { const dx = (xx - px) / kx, dy = (yy - py) / ky, dd = Math.sqrt(dx * dx + dy * dy); if (dd < best) best = dd; }
      }
    }
    return best === Infinity ? null : Math.round(best * 10) / 10;
  };
  const inFrame = (x, y) => x >= wr.left + 8 && x <= wr.right - 8 && y >= wr.top + 8 && y <= wr.bottom - 8;
  for (const [a, b] of LINKS) {
    const A = card(a), B = card(b); if (!A || !B) continue;
    const right = B.cx >= A.cx;
    const pts = [['a', right ? A.r : A.l, A.cy], ['b', right ? B.l : B.r, B.cy]];
    for (const [end, x, y] of pts) if (inFrame(x, y)) out.ends.push({ link: a + '>' + b, end, x: Math.round(x), y: Math.round(y), dist: nearest(x, y) });
  }
  return out;
})`;

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const hashTo = async (h) => { await ev(`location.hash = ${JSON.stringify(h)}`); await sleep(300); };
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 20000, label: 'splash gone' }).catch(() => {});
  const prefs = (tone) => `localStorage.setItem('wrizo-theme','flux'); localStorage.setItem('wrizo-theme-prefs', JSON.stringify({ voice: 'serif', page: '${tone}', fade: 'on' }));`;

  await app.goto('/');
  await ev(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); ${prefs('dark')}`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await app.emulateDpr(1, VIEW[0], VIEW[1]);
  await splashGone();
  await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id: BOARD, text: 'Zoom links', pageType: 'board', boxes: makeBoxes(), createdAt: new Date().toISOString(), origin: null, source: null })})`);
  await sleep(500);

  const openBoard = async (tone) => {
    await hashTo('#/');
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before the board', timeout: 15000 });
    await ev(`window.wrizoPatchEntry(${JSON.stringify(BOARD)}, { boxes: ${JSON.stringify(makeBoxes())} })`);
    await ev(prefs(tone));
    await ev(`history.replaceState(null, '', '/?flux3=1#/page/${BOARD}')`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.board-canvas .board-box[data-box-id=\"f3-d\"]') && !!document.querySelector('[data-flux3-layer]')", { timeout: 15000, label: 'the Schema' }).catch(() => {});
    await splashGone();
    await sleep(1600);
  };
  const zoom = async (s) => { const landed = await ev(`window.wrizoFluxZoomTo(${s})`); return landed; };
  const measure = () => ev(`${MEASURE}(${JSON.stringify(LINKS)}, ${RADIUS}, ${TOL})`);
  const verdict = (m) => { const ends = m.ends; const bad = ends.filter((e) => e.dist == null || e.dist > TOL); return { n: ends.length, bad, worst: ends.length ? Math.max(...ends.map((e) => (e.dist == null ? 999 : e.dist))) : null }; };

  const results = [];
  for (const tone of ['dark', 'light']) {
    await openBoard(tone);
    for (const [label, ask] of SCALES) {
      const landed = await zoom(ask);
      for (const state of [['held', 250], ['settled', 1800]]) {
        await sleep(state[0] === 'held' ? state[1] : state[1] - 250);
        const m = await measure(), v = verdict(m);
        results.push({ tone, label, landed, state: state[0], ...v, diag: m.diag, ends: m.ends });
        console.log(`LINKS ${tone} ${label} (landed ${landed}) ${state[0]}: ${v.n} ends judged, worst ${v.worst} px, bad ${v.bad.length} | canvas ${JSON.stringify(m.diag.canvas)} | wrap ${JSON.stringify(m.diag.wrap)} | layer ${JSON.stringify(m.diag.layer)} | mcv ${JSON.stringify(m.diag.mcv)} px ${JSON.stringify(m.diag.mcvPx)} | held ${m.diag.held} | canvasTransform ${m.diag.canvasTransform}`);
        if (v.bad.length) console.log(`  BAD ${JSON.stringify(v.bad)}`);
      }
    }
  }
  // the verdicts: every scale, both skins, both states
  for (const tone of ['dark', 'light']) {
    for (const [label] of SCALES) {
      for (const state of ['held', 'settled']) {
        const r = results.find((x) => x.tone === tone && x.label === label && x.state === state);
        ok(`LINKS-${tone}-${label}-${state} every link end in the frame lands on its card's edge (within ${TOL} px): ${r.n - r.bad.length}/${r.n} (worst ${r.worst} px; the outer limit landed ${r.landed})`,
          r.n >= MIN_ENDS && r.bad.length === 0, JSON.stringify({ n: r.n, bad: r.bad, canvas: r.diag.canvas, mcv: r.diag.mcv, held: r.diag.held }));
      }
    }
  }
  ok(`P-outer the outer limit is below 0.20 (landed ${results.find((x) => x.label === 'outer').landed}) and the four other scales landed where asked`,
    results.filter((x) => x.label === 'outer').every((x) => x.landed < 0.2) && results.filter((x) => x.label !== 'outer').every((x) => Math.abs(x.landed - (SCALES.find((s) => s[0] === x.label)[1])) < 0.01), JSON.stringify(results.map((x) => [x.tone, x.label, x.landed]).slice(0, 5)));

  // the mutant: the whole layer shifted by (-90, -60) must be caught, at 1.00 and 0.50 in Dark
  await openBoard('dark');
  for (const [label, ask] of [['1.00', 1], ['0.50', 0.5]]) {
    await zoom(ask); await sleep(1800);
    const before = await measure();
    await ev("(() => { const s = document.createElement('style'); s.id = '__mutlinks'; s.textContent = '[data-flux3-layer]{translate:-90px -60px!important}'; document.head.appendChild(s); return true; })()");
    await sleep(500);
    const after = await measure(), v = verdict(after);
    const shiftX = Math.round((after.diag.mcv.l - before.diag.mcv.l) * 10) / 10, shiftY = Math.round((after.diag.mcv.t - before.diag.mcv.t) * 10) / 10;
    ok(`MUT-links premise (${label}): the shift landed on the layer's motion canvas (moved ${shiftX}, ${shiftY}; asked -90, -60)`, Math.abs(shiftX + 90) <= 2 && Math.abs(shiftY + 60) <= 2, JSON.stringify({ before: before.diag.mcv, after: after.diag.mcv }));
    ok(`MUT-links (${label}): the check goes RED when every link is 108 px off its cards (${v.bad.length}/${v.n} ends judged bad, worst ${v.worst} px)`, v.n >= MIN_ENDS && v.bad.length > 0, JSON.stringify(v));
    await ev("(() => { const s = document.getElementById('__mutlinks'); if (s) s.remove(); return true; })()");
    await sleep(300);
  }
}); } catch (err) { ok('the run reached its end', false, String((err && err.stack) || err).split('\n').slice(0, 3).join(' | ')); }

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
console.log(failed.length ? `\nFLUX-ZOOM-LINKS VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nFLUX-ZOOM-LINKS VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
