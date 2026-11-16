// FLUX-ZOOM-LINK-CONTRAST (the Wrizors' zoom pass 3, Fable Nov 15 10:40 pm: "links sit on half pixels (about 2.5:1). Snap the link lines to the pixel grid after the camera moves them, with a check; if snapping can't hold 3:1 at 0.50 and the outer
// limit, bring numbers for a 2 px line"). WHAT IT MEASURES: what the writer SEES. The Schema board (flux3-s1's nine cards and four links, as the frames job seeds it) under ?flux3=1, Page: Dark and Page: Light, REDUCED MOTION ON (the still frame:
// the motion canvas holds the links and nothing else), 1920x1080 at DPR 1. At 1.00, 0.50 and the outer limit (asked as 0.01: it lands where the clamp puts it, 0.304 here), in two states: REST (nothing selected) and SEL (card B selected: its link is hot).
// Every pixel the motion canvas COVERS (alpha > 0) is read from a viewport screenshot at the same place, and its contrast ratio (WCAG) against the ground the writer sees (the median colour of a block of the stage) is computed.
//   CON-body     at least BODY_MIN of the covered pixels are FULLY covered (alpha 255): a line on whole pixels has a body, a line on half pixels is two half-covered rows and has none (a dash's soft ends are partial whatever the grid)
//   CON-full     at least FULL_MIN of the fully covered pixels hold CONTRAST:1 (3:1, the floor for a non-text component) AS SEEN in the screenshot (this also catches a layer resampled off the grid at composite)
//   CON-median   the median covered pixel holds 3:1 (the Wrizors' own reading was a median)
// MUT-half: the layer shifted half a pixel (CSS `translate: .5px .5px` on the layer: its canvases are resampled, every line lands on half pixels again) must make CON-full RED at 1.00, in Dark and Light; its premise is MEASURED (the motion canvas's rect moved by .5).
// Run: node scripts/harness/flux-zoom-link-contrast.mjs   (from apps/desktop; no timing line)
import { withHarness } from '../runtime-verify.mjs';

const VIEW = [1920, 1080];
const BOARD = 'fzk-board';
const CONTRAST = 3, BODY_MIN = 0.6, FULL_MIN = 0.98;
const SCALES = [['1.00', 1], ['0.50', 0.5], ['outer', 0.01]];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });

const makeBoxes = () => {
  const T = (id, x, y, z, text) => ({ id, kind: 'text', x, y, w: 0.2, h: 0.1, z, text });
  const L = (id, a, b, z) => ({ id, kind: 'connection', x: 0, y: 0, w: 0, h: 0, z, connA: a, connB: b });
  return [
    T('f3-a', 0.05, 0.05, 1, 'Card A'), T('f3-b', 0.5, 0.05, 2, 'Card B'), T('f3-c', 0.05, 0.4, 3, 'Card C'), T('f3-d', 0.5, 0.4, 4, 'Card D'),
    T('f3-e', 0.05, 0.75, 5, 'Card E'), T('f3-f', 0.5, 0.75, 6, 'Card F'), T('f3-g', 0.75, 0.4, 7, 'Card G, no link'), T('f3-h', 0.75, 0.05, 8, 'The hook'),
    { id: 'f3-p', kind: 'page-pin', entryId: `${BOARD}-doc`, x: 0.75, y: 0.75, w: 0.2, h: 0.15, z: 9 },
    L('f3-ac', 'f3-a', 'f3-c', 10), L('f3-bd', 'f3-b', 'f3-d', 11), L('f3-ef', 'f3-e', 'f3-f', 12), L('f3-ad', 'f3-a', 'f3-d', 13),
    { id: 'f3-meta', kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 0, canvasH: 1800 },
  ];
};
const lum = (c) => { const f = (v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
const ratio = (a, b) => { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };

// in the page: the covered pixels of the motion canvas, read against a viewport screenshot (a PNG data URL passed in)
const MEASURE = (png) => `(async () => {
  const mcv = document.querySelectorAll('[data-flux3-layer] canvas')[1];
  if (!mcv || !mcv.width || !mcv.height) return { n: 0 };
  const mr = mcv.getBoundingClientRect(), d = mcv.getContext('2d').getImageData(0, 0, mcv.width, mcv.height).data, W = mcv.width, H = mcv.height, kx = mr.width / W, ky = mr.height / H;
  const img = new Image(); await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = 'data:image/png;base64,' + ${JSON.stringify(png)}; });
  const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const x = cv.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
  const s = x.getImageData(0, 0, cv.width, cv.height).data, SW = cv.width;
  const wr = document.querySelector('.board-canvas-wrap').getBoundingClientRect();
  // the ground: the median colour of a 60x60 block in the wrap's top-left corner
  const rs = [], gs = [], bs = []; for (let yy = Math.round(wr.top) + 10; yy < Math.round(wr.top) + 70; yy += 1) for (let xx = Math.round(wr.left) + 10; xx < Math.round(wr.left) + 70; xx += 1) { const k = (yy * SW + xx) * 4; rs.push(s[k]); gs.push(s[k + 1]); bs.push(s[k + 2]); }
  const med = (a) => { a.sort((p, q) => p - q); return a[Math.floor(a.length / 2)]; };
  const ground = [med(rs), med(gs), med(bs)];
  const px = [];
  for (let cy = 0; cy < H; cy += 1) for (let cx = 0; cx < W; cx += 1) { if (d[(cy * W + cx) * 4 + 3] === 0) continue; const sx = Math.round(mr.left + (cx + 0.5) * kx - 0.5), sy = Math.round(mr.top + (cy + 0.5) * ky - 0.5); if (sx < 0 || sy < 0 || sx >= SW || sy >= cv.height) continue; const k = (sy * SW + sx) * 4; px.push([s[k], s[k + 1], s[k + 2], d[(cy * W + cx) * 4 + 3], cx, cy]); }
  return { n: px.length, ground, px, rect: [mr.left, mr.top, mr.width, mr.height] };
})()`;

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const hashTo = async (h) => { await ev(`location.hash = ${JSON.stringify(h)}`); await sleep(300); };
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 20000, label: 'splash gone' }).catch(() => {});
  const prefs = (tone) => `localStorage.setItem('wrizo-theme','flux'); localStorage.setItem('wrizo-theme-prefs', JSON.stringify({ voice: 'serif', page: '${tone}', fade: 'on' }));`;
  const mouse = (type, x, y) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'mouse' });

  await app.goto('/');
  await ev(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); ${prefs('dark')}`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await app.emulateDpr(1, VIEW[0], VIEW[1]);
  await splashGone();
  await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id: `${BOARD}-doc`, text: 'The doc node', createdAt: new Date().toISOString(), origin: 'journal', source: 'page' })})`);
  await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id: BOARD, text: 'Link contrast', pageType: 'board', boxes: makeBoxes(), createdAt: new Date().toISOString(), origin: null, source: null })})`);
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
  const read = async () => {
    const png = (await app.cdp('Page.captureScreenshot', { format: 'png' })).data;
    const m = await ev(MEASURE(png));
    if (!m.n) return { n: 0, body: 0, fullShare: 0, nFull: 0, median: 0, ground: m.ground };
    const all = m.px.map((c) => ratio(c, m.ground)).sort((a, b) => a - b), full = m.px.filter((c) => c[3] === 255).map((c) => ratio(c, m.ground));
    const bad = m.px.filter((c) => c[3] === 255 && ratio(c, m.ground) < CONTRAST).slice(0, 8).map((c) => c[4] + ',' + c[5] + ':' + c[0] + '/' + c[1] + '/' + c[2]);
    return { bad, n: m.n, body: full.length / m.px.length, fullShare: full.length ? full.filter((r) => r >= CONTRAST).length / full.length : 0, nFull: full.length, median: all[Math.floor(all.length / 2)], p10: all[Math.floor(all.length * 0.1)], ground: m.ground, rect: m.rect, landed: null };
  };
  const at = async (ask) => { const landed = await ev(`window.wrizoFluxZoomTo(${ask})`); await sleep(1800); return landed; };

  const results = [];
  for (const tone of ['dark', 'light']) {
    await openBoard(tone);
    for (const state of ['REST', 'SEL']) {
      if (state === 'SEL') await selectB();
      for (const [label, ask] of SCALES) {
        const landed = await at(ask);
        const r = await read();
        results.push({ tone, state, label, landed, ...r });
        console.log(`LINKCON ${tone} ${state} ${label} (landed ${typeof landed === 'number' ? landed.toFixed(3) : landed}): ${r.n} covered px, ${(r.body * 100).toFixed(0)}% fully covered, ${(r.fullShare * 100).toFixed(0)}% of those hold ${CONTRAST}:1, median ${r.median && r.median.toFixed(2)}:1, p10 ${r.p10 && r.p10.toFixed(2)}:1, ground ${JSON.stringify(r.ground)}${r.bad && r.bad.length ? ' BAD(cx,cy:rgb) ' + r.bad.join(' ') : ''}`);
      }
    }
  }
  for (const r of results) {
    ok(`CON-body [${r.tone} ${r.state} ${r.label}] ${(r.body * 100).toFixed(0)}% of the ${r.n} covered pixels are fully covered (>= ${BODY_MIN * 100}%): the line has a body on whole pixels`, r.n >= 40 && r.body >= BODY_MIN, JSON.stringify({ n: r.n, nFull: r.nFull, body: r.body }));
    ok(`CON-full [${r.tone} ${r.state} ${r.label}] ${(r.fullShare * 100).toFixed(0)}% of the ${r.nFull} fully covered pixels hold ${CONTRAST}:1 against the ground as seen (>= ${FULL_MIN * 100}%)`, r.nFull >= 40 && r.fullShare >= FULL_MIN, JSON.stringify({ nFull: r.nFull, fullShare: r.fullShare, ground: r.ground }));
    ok(`CON-median [${r.tone} ${r.state} ${r.label}] the median covered pixel holds ${r.median && r.median.toFixed(2)}:1 (>= ${CONTRAST}:1)`, r.n >= 40 && r.median >= CONTRAST, JSON.stringify({ median: r.median }));
  }

  // the mutant: the layer a half pixel off the grid, at 1.00, REST, both tones
  for (const tone of ['dark', 'light']) {
    await openBoard(tone);
    await at(1);
    const before = await read();
    await ev("(() => { const s = document.createElement('style'); s.id = '__mutHalf'; s.textContent = '[data-flux3-layer]{translate:.5px .5px!important}'; document.head.appendChild(s); return true; })()");
    await sleep(600);
    const after = await read();
    const shiftX = Math.round((after.rect[0] - before.rect[0]) * 100) / 100, shiftY = Math.round((after.rect[1] - before.rect[1]) * 100) / 100;
    ok(`MUT-half premise [${tone}]: the half-pixel shift landed on the motion canvas (moved ${shiftX}, ${shiftY}; asked .5, .5)`, Math.abs(shiftX - 0.5) <= 0.05 && Math.abs(shiftY - 0.5) <= 0.05, JSON.stringify({ before: before.rect, after: after.rect }));
    ok(`MUT-half [${tone}]: with the layer half a pixel off the grid CON-full goes RED (${(after.fullShare * 100).toFixed(0)}% of the fully covered pixels hold ${CONTRAST}:1 as seen, against ${(before.fullShare * 100).toFixed(0)}% on the grid; needs < ${FULL_MIN * 100}%)`, after.fullShare < FULL_MIN && before.fullShare >= FULL_MIN, JSON.stringify({ before: before.fullShare, after: after.fullShare, medianAfter: after.median }));
  }
}); } catch (err) { ok('the run reached its end', false, String((err && err.stack) || err).split('\n').slice(0, 3).join(' | ')); }

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
console.log(failed.length ? `\nFLUX-ZOOM-LINK-CONTRAST VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nFLUX-ZOOM-LINK-CONTRAST VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
