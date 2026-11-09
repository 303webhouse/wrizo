// MEASUREMENT D (Fable, Nov 9 3:45 pm; read-only): LIVE Flux, flag OFF (no ?flux3): a resting link and a selected link against the board, both Page tones. In the live build a link is a
// .board-connection-line (stroke var(--brass), 1 px; selected 2 px, opacity 1), drawn only in connection mode, so "resting" = a link of the selected card in connection mode, unselected, and
// "selected" = that line clicked. Each is read two ways: from the COMPUTED colours (the stroke at its opacity composited on the board's own colour) and from the RENDERED pixels (the
// brightest/darkest pixel across the line against the board beside it). The graphics floor is 3:1 (law 3). Prints four numbers per way. Nothing is written to the app's data: a fresh profile, a seeded fixture.

import { withHarness } from '../runtime-verify.mjs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const mouse = (app, type, x, y, o = {}) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'mouse', ...o });
const click = async (app, x, y) => { await app.mouseMove(x, y); await mouse(app, 'mousePressed', x, y); await mouse(app, 'mouseReleased', x, y); };
const dbl = async (app, x, y) => { await app.mouseMove(x, y); await mouse(app, 'mousePressed', x, y, { clickCount: 1 }); await mouse(app, 'mouseReleased', x, y, { clickCount: 1 }); await sleep(60); await mouse(app, 'mousePressed', x, y, { clickCount: 2 }); await mouse(app, 'mouseReleased', x, y, { clickCount: 2 }); await sleep(250); };
const R = (app, sel) => app.evalJs(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height }; })()`);
const out = {};
await withHarness(async (app) => {
  for (const tone of ['dark', 'light']) {
    await app.emulateDpr(1, 1400, 900);
    await app.goto('/');
    await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','flux'); localStorage.setItem('wrizo-theme-prefs', JSON.stringify({ voice: 'serif', page: ${JSON.stringify(tone)}, fade: 'on' })); localStorage.setItem('wrizo-ambiance-dial','50');`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
    await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash', timeout: 15000 }).catch(() => {});
    const id = `d-board-${tone}`;
    const boxes = [
      { id: 'd-a', kind: 'text', x: 0.05, y: 0.05, w: 0.2, h: 0.12, z: 1, text: 'Card A' },
      { id: 'd-c', kind: 'text', x: 0.05, y: 0.45, w: 0.2, h: 0.12, z: 3, text: 'Card C' },
      { id: 'd-ac', kind: 'connection', x: 0, y: 0, w: 0, h: 0, z: 5, connA: 'd-a', connB: 'd-c' },
    ];
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: 'D board', pageType: 'board', boxes, createdAt: new Date().toISOString(), origin: null, source: null })})`);
    await sleep(450);
    await app.evalJs(`location.hash = '#/page/${id}'`);
    await app.waitFor("!!document.querySelector('.board-canvas [data-box-id=\"d-a\"]')", { label: 'board', timeout: 12000 });
    await sleep(900);
    const flag = await app.evalJs("({ flag: document.documentElement.hasAttribute('data-flux3'), theme: document.documentElement.getAttribute('data-theme'), tone: document.documentElement.getAttribute('data-page') })");
    const a = await R(app, '[data-box-id="d-a"]');
    await click(app, Math.round(a.l + a.w * 0.3), Math.round(a.t + a.h * 0.3)); await sleep(700);
    const h = await R(app, '[data-box-id="d-a"] .board-handle');
    await dbl(app, Math.round(h.l + h.w / 2), Math.round(h.t + h.h / 2));
    await sleep(400);
    const read = async (label) => {
      const info = await app.evalJs(`(() => { const l = document.querySelector('.board-connection-line'); if (!l) return null; const cs = getComputedStyle(l); const c = document.querySelector('.board-canvas'); const cr = c.getBoundingClientRect(); const wrap = document.querySelector('.board-canvas-wrap'); const bg = getComputedStyle(c).backgroundColor; const wbg = wrap ? getComputedStyle(wrap).backgroundColor : null;
        const mx = (+l.getAttribute('x1') + +l.getAttribute('x2')) / 2 + cr.left, my = (+l.getAttribute('y1') + +l.getAttribute('y2')) / 2 + cr.top;
        return { stroke: cs.stroke, sw: cs.strokeWidth, op: cs.opacity, sel: l.getAttribute('data-selected'), bg, wbg, mx: Math.round(mx), my: Math.round(my), x1: +l.getAttribute('x1') + cr.left, y1: +l.getAttribute('y1') + cr.top, x2: +l.getAttribute('x2') + cr.left, y2: +l.getAttribute('y2') + cr.top }; })()`);
      if (!info) { out[`${tone}-${label}`] = { error: 'no line' }; return; }
      const data = (await app.cdp('Page.captureScreenshot', { format: 'png' })).data;
      const px = await app.evalJs(`(async () => { const img = new Image(); img.src = 'data:image/png;base64,${data}'; await img.decode(); const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; const x = c.getContext('2d'); x.drawImage(img, 0, 0); const D = x.getImageData(0, 0, c.width, c.height); const W = c.width;
        const P = (a, b) => { const i = (b * W + a) * 4; return [D.data[i], D.data[i + 1], D.data[i + 2]]; };
        const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; const lum = (p) => 0.2126 * lin(p[0]) + 0.7152 * lin(p[1]) + 0.0722 * lin(p[2]); const cr = (p, q) => (Math.max(lum(p), lum(q)) + 0.05) / (Math.min(lum(p), lum(q)) + 0.05);
        const info = ${JSON.stringify(info)}; const dx = info.x2 - info.x1, dy = info.y2 - info.y1, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
        // along the middle third of the line, the best contrast of any pixel within 2 px of the line against the pixel 8 px to its side
        const best = []; for (let t = 0.33; t <= 0.67; t += 0.04) { const cx = info.x1 + dx * t, cy = info.y1 + dy * t; const ref = P(Math.round(cx + nx * 8), Math.round(cy + ny * 8)); let b = 1; for (let o = -2; o <= 2; o += 0.5) b = Math.max(b, cr(P(Math.round(cx + nx * o), Math.round(cy + ny * o)), ref)); best.push(b); }
        best.sort((p, q) => p - q); const sample = P(Math.round(info.mx + nx * 8), Math.round(info.my + ny * 8));
        return { median: +best[best.length >> 1].toFixed(2), max: +best[best.length - 1].toFixed(2), board: sample }; })()`);
      // computed: stroke at its opacity over the board colour
      const comp = await app.evalJs(`(() => { const nums = (s) => (/(\\d+(?:\\.\\d+)?),\\s*(\\d+(?:\\.\\d+)?),\\s*(\\d+(?:\\.\\d+)?)(?:,\\s*([\\d.]+))?/.exec(s) || []).slice(1).map(Number);
        const info = ${JSON.stringify(info)}; const s = nums(info.stroke), b = ${JSON.stringify(px.board)}; const a = (s[3] === undefined ? 1 : s[3]) * parseFloat(info.op); const bl = [0, 1, 2].map((i) => s[i] * a + b[i] * (1 - a));
        const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; const lum = (p) => 0.2126 * lin(p[0]) + 0.7152 * lin(p[1]) + 0.0722 * lin(p[2]);
        return { c: +((Math.max(lum(bl), lum(b)) + 0.05) / (Math.min(lum(bl), lum(b)) + 0.05)).toFixed(2), stroke: s, alpha: a, boardColour: b }; })()`);
      out[`${tone}-${label}`] = { info: { stroke: info.stroke, sw: info.sw, op: info.op, sel: info.sel }, flag, pixels: px, computed: comp };
    };
    await read('resting');
    // select the line: click its hit line at the middle
    const line = await app.evalJs(`(() => { const hit = document.querySelector('.board-connection-hit'); if (!hit) return null; const c = document.querySelector('.board-canvas').getBoundingClientRect(); return { x: Math.round((+hit.getAttribute('x1') + +hit.getAttribute('x2')) / 2 + c.left), y: Math.round((+hit.getAttribute('y1') + +hit.getAttribute('y2')) / 2 + c.top) }; })()`);
    if (line) { await click(app, line.x, line.y); await sleep(500); await app.mouseMove(8, 8); await sleep(300); }
    await read('selected');
  }
}).catch((e) => { out.error = String(e && e.stack || e); });
console.log('MEASUREMENT-D ' + JSON.stringify(out, null, 1));
const num = (k, w) => (out[k] && out[k][w] ? (w === 'pixels' ? out[k][w].median + ' (max ' + out[k][w].max + ')' : out[k][w].c) : 'n/a');
for (const t of ['dark', 'light']) for (const s of ['resting', 'selected']) console.log(`D ${t} ${s}: rendered ${num(`${t}-${s}`, 'pixels')} ; from computed colours ${num(`${t}-${s}`, 'computed')}`);
