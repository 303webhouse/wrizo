// FLUX-ZOOM-LINK-COLOURS (Fable, Nov 15, 5:40 pm, GUARD 6 in flux-zoom-1: "flux3-layer.ts TONES link/hot = #35859E / #00719C (light) and #3A8FA5 / #00C2FF (dark), the #57 colours Nick approved, with a contrast check and a mutant; include selected
// links in the next frames for the Wrizors"). #57 drew the board's own live links in those colours at opacity 1; the Schema's layer still drew its links in translucent cyan (rgba(0,194,255,.36) / .75 dark, .55 / .95 light).
// WHAT IT MEASURES (the drawn PIXELS): the Schema board (flux3-s1's nine cards and four links) under ?flux3=1 in Page: Dark and Page: Light, REDUCED MOTION ON (the still frame: no electrons, no flashes, so the motion canvas holds the links
// and nothing else), 1920x1080 at 1.00, in two states: (REST) nothing selected: every link at rest; (SEL) card B selected: its link (B to D) is hot, the others at rest.
//   COL-rest      the motion canvas holds fully opaque pixels within DELTA of the approved REST colour (>= MIN_PX of them): the link is drawn in that colour at opacity 1, not translucent cyan
//   COL-hot       in SEL the approved HOT colour is drawn (>= MIN_PX opaque pixels within DELTA of it); in REST it is NOT (0 of them): hot means selected
//   CON-rest/hot  the CONTRAST of each colour against the ground as the writer sees it (the median colour of a block of the stage in a viewport screenshot, WCAG ratio) is at least CONTRAST (3:1, the floor for a non-text component)
// MUTANTS (through the bundle, each LANDED: the anchor matched once): MUT-old (the REST colour back to the old translucent cyan) must make COL-rest RED; MUT-low (the REST colour a near-ground colour) must make CON-rest RED.
// Run: node scripts/harness/flux-zoom-link-colours.mjs   (from apps/desktop; no timing line: a hosted runner is fine)
import { withHarness } from '../runtime-verify.mjs';

const VIEW = [1920, 1080];
const BOARD = 'fzc-board';
const DELTA = 10, MIN_PX = 20, CONTRAST = 3;
const WANT = { dark: { rest: [58, 143, 165], hot: [0, 194, 255] }, light: { rest: [53, 133, 158], hot: [0, 113, 156] } };   // #3A8FA5 / #00C2FF and #35859E / #00719C
const HEX = { dark: { rest: '#3A8FA5', hot: '#00C2FF' }, light: { rest: '#35859E', hot: '#00719C' } };
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
    { id: 'f3-meta', kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 0, canvasH: 1800 },
  ];
};
const dist = (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));
const lum = (c) => { const f = (v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
const ratio = (a, b) => { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };

// in the page: the opaque pixels of the layer's motion canvas, as a colour histogram
const PALETTE = `(() => {
  const mcv = document.querySelectorAll('[data-flux3-layer] canvas')[1]; if (!mcv || !mcv.width || !mcv.height) return { n: 0, hist: [] };
  const d = mcv.getContext('2d').getImageData(0, 0, mcv.width, mcv.height).data, h = new Map(); let n = 0, maxA = 0;
  for (let i = 0; i < d.length; i += 4) { const a = d[i + 3]; if (a > maxA) maxA = a; if (a < 250) continue; n += 1; const k = d[i] + ',' + d[i + 1] + ',' + d[i + 2]; h.set(k, (h.get(k) || 0) + 1); }
  return { n, maxA, hist: [...h.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12) };
})()`;
// in the page: the median colour of a block of the stage in a screenshot (the ground the links sit on)
const GROUND = (png) => `(async () => { const i = new Image(); await new Promise((res, rej) => { i.onload = res; i.onerror = rej; i.src = 'data:image/png;base64,' + ${JSON.stringify(png)}; });
  const cv = document.createElement('canvas'); cv.width = i.width; cv.height = i.height; const x = cv.getContext('2d', { willReadFrequently: true }); x.drawImage(i, 0, 0);
  const d = x.getImageData(0, 0, cv.width, cv.height).data, rs = [], gs = [], bs = []; for (let k = 0; k < d.length; k += 4) { rs.push(d[k]); gs.push(d[k + 1]); bs.push(d[k + 2]); }
  const med = (a) => { a.sort((p, q) => p - q); return a[Math.floor(a.length / 2)]; }; return [med(rs), med(gs), med(bs)]; })()`;

const MUTANTS = {
  old: [/(["'])#3A8FA5\1/g, '"rgba(0,194,255,.36)"', 'dark', 'the dark REST colour back to the old translucent cyan'],
  low: [/(["'])#3A8FA5\1/g, '"#0A2630"', 'dark', 'the dark REST colour a near-ground colour'],
};

try { await withHarness(async (app) => {
  const ev = (js) => { return app.evalJs(js); };
  const hashTo = async (h) => { await ev(`location.hash = ${JSON.stringify(h)}`); await sleep(300); };
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 20000, label: 'splash gone' }).catch(() => {});
  const prefs = (tone) => `localStorage.setItem('wrizo-theme','flux'); localStorage.setItem('wrizo-theme-prefs', JSON.stringify({ voice: 'serif', page: '${tone}', fade: 'on' }));`;
  const mouse = (type, x, y) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'mouse' });

  // the bundle mutants (a response rewrite, as flux-wirein-flagoff's)
  let mutant = null; const landed = {};
  await app.cdp('Network.enable');
  await app.cdp('Network.setCacheDisabled', { cacheDisabled: true });
  await app.cdp('Fetch.enable', { patterns: [{ urlPattern: '*/assets/index-*.js', requestStage: 'Response' }] });
  app.tap(async (method, p) => {
    if (method !== 'Fetch.requestPaused') return;
    try {
      const body = await app.cdp('Fetch.getResponseBody', { requestId: p.requestId });
      let text = body.base64Encoded ? Buffer.from(body.body, 'base64').toString('utf8') : body.body;
      if (mutant) { const [re, to] = MUTANTS[mutant]; const n = (text.match(re) || []).length; landed[mutant] = (landed[mutant] || 0) + n; if (n === 1) text = text.replace(re, to); }
      await app.cdp('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: p.responseStatusCode || 200, responseHeaders: p.responseHeaders || [], body: Buffer.from(text, 'utf8').toString('base64') });
    } catch { try { await app.cdp('Fetch.continueRequest', { requestId: p.requestId }); } catch { /* gone */ } }
  });

  await app.goto('/');
  await ev(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); ${prefs('dark')}`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await app.emulateDpr(1, VIEW[0], VIEW[1]);
  await splashGone();
  await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id: BOARD, text: 'Link colours', pageType: 'board', boxes: makeBoxes(), createdAt: new Date().toISOString(), origin: null, source: null })})`);
  await sleep(500);

  const openBoard = async (tone) => {
    await hashTo('#/');
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before the board', timeout: 15000 });
    await ev(`window.wrizoPatchEntry(${JSON.stringify(BOARD)}, { boxes: ${JSON.stringify(makeBoxes())} })`);
    await ev(prefs(tone));
    await ev(`history.replaceState(null, '', '/?flux3=1#/page/${BOARD}')`);
    await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await app.reload();
    await app.waitFor("!!document.querySelector('.board-canvas .board-box[data-box-id=\"f3-b\"]') && !!document.querySelector('[data-flux3-layer]')", { timeout: 15000, label: 'the Schema' }).catch(() => {});
    await splashGone();
    await sleep(1800);
  };
  const selectB = async () => {
    const p = await ev("(() => { const e = document.querySelector('.board-box[data-box-id=\"f3-b\"]'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.left + r.width * 0.5), y: Math.round(r.top + r.height * 0.35) }; })()");
    if (p) { await app.mouseMove(p.x, p.y); await mouse('mousePressed', p.x, p.y); await mouse('mouseReleased', p.x, p.y); }
    await sleep(1400);
  };
  const read = async (tone) => {
    const pal = await ev(PALETTE);
    const wrap = await ev("(() => { const r = document.querySelector('.board-canvas-wrap').getBoundingClientRect(); return { x: r.left + 20, y: r.top + 20, w: 60, h: 60 }; })()");
    const shot = (await app.cdp('Page.captureScreenshot', { format: 'png', clip: { x: wrap.x, y: wrap.y, width: wrap.w, height: wrap.h, scale: 1 } })).data;
    const ground = await ev(GROUND(shot));
    const near = (want) => pal.hist.filter(([k]) => dist(k.split(',').map(Number), want) <= DELTA).reduce((a, [, c]) => a + c, 0);
    return { pal, ground, nRest: near(WANT[tone].rest), nHot: near(WANT[tone].hot) };
  };

  const results = {};
  for (const tone of ['dark', 'light']) {
    await openBoard(tone);
    const rest = await read(tone);
    await selectB();
    const sel = await read(tone);
    results[tone] = { rest, sel };
    console.log(`LINKCOL ${tone} REST: ${rest.pal.n} opaque px, near REST ${rest.nRest}, near HOT ${rest.nHot}, ground ${JSON.stringify(rest.ground)}, top ${JSON.stringify(rest.pal.hist.slice(0, 4))}`);
    console.log(`LINKCOL ${tone} SEL:  ${sel.pal.n} opaque px, near REST ${sel.nRest}, near HOT ${sel.nHot}, top ${JSON.stringify(sel.pal.hist.slice(0, 4))}`);
  }
  for (const tone of ['dark', 'light']) {
    const r = results[tone], W = WANT[tone];
    ok(`COL-rest [${tone}] the links are drawn in the approved REST colour ${HEX[tone].rest} at opacity 1: ${r.rest.nRest} opaque pixels within ${DELTA} of it (>= ${MIN_PX})`, r.rest.nRest >= MIN_PX && r.sel.nRest >= MIN_PX, JSON.stringify({ rest: r.rest.pal.hist.slice(0, 5), sel: r.sel.pal.hist.slice(0, 5) }));
    ok(`COL-hot [${tone}] a SELECTED card's link is drawn in the approved HOT colour ${HEX[tone].hot}: ${r.sel.nHot} opaque pixels within ${DELTA} of it (>= ${MIN_PX}) when selected, ${r.rest.nHot} when nothing is (must be 0)`, r.sel.nHot >= MIN_PX && r.rest.nHot === 0, JSON.stringify({ sel: r.sel.pal.hist.slice(0, 5), rest: r.rest.pal.hist.slice(0, 5) }));
    const cr = ratio(W.rest, r.rest.ground), ch = ratio(W.hot, r.rest.ground);
    ok(`CON-rest [${tone}] the REST colour against the ground the writer sees (${JSON.stringify(r.rest.ground)}): ${cr.toFixed(2)}:1 (>= ${CONTRAST}:1)`, cr >= CONTRAST, JSON.stringify({ ground: r.rest.ground, want: W.rest }));
    ok(`CON-hot [${tone}] the HOT colour against the same ground: ${ch.toFixed(2)}:1 (>= ${CONTRAST}:1)`, ch >= CONTRAST, JSON.stringify({ ground: r.rest.ground, want: W.hot }));
  }

  // the mutants: a changed REST colour must turn a line red (dark skin; REST state)
  for (const m of ['old', 'low']) {
    mutant = m;
    await openBoard('dark');
    mutant = null;
    const r = await read('dark');
    const lc = landed[m] || 0;
    ok(`MUT-${m} premise: the anchor for "${MUTANTS[m][3]}" matched once in the bundle (matched ${lc})`, lc === 1, JSON.stringify({ landed: lc }));
    // measured as the checks above measure it
    if (m === 'old') ok(`MUT-old: with the REST colour back to translucent cyan, COL-rest goes RED (${r.nRest} opaque pixels near ${HEX.dark.rest}, needs >= ${MIN_PX})`, r.nRest < MIN_PX, JSON.stringify(r.pal.hist.slice(0, 5)));
    else { const col = (r.pal.hist[0] || ['0,0,0']) [0].split(',').map(Number); const cr = ratio(col, r.ground); ok(`MUT-low: with the REST colour a near-ground colour, CON-rest goes RED (the dominant link colour ${JSON.stringify(col)} against the ground ${JSON.stringify(r.ground)}: ${cr.toFixed(2)}:1, needs >= ${CONTRAST})`, cr < CONTRAST, JSON.stringify({ col, ground: r.ground })); }
  }
}); } catch (err) { ok('the run reached its end', false, String((err && err.stack) || err).split('\n').slice(0, 3).join(' | ')); }

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
console.log(failed.length ? `\nFLUX-ZOOM-LINK-COLOURS VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nFLUX-ZOOM-LINK-COLOURS VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
