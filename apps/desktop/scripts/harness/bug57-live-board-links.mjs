// BUG #57 - THE LIVE BOARD LINKS (Nick approved the colours; Fable's ruling, Nov 9-10; Flux spec §4 "Link colours", draft 27). The live build drew a link in connection mode in Arbor's brass
// (#ff9800 at .9) in every theme; read from drawn pixels under Flux it fell under the graphics floor (3:1): dark resting 2.59, light resting 1.39, light selected 1.99 (measurement D,
// scripts/harness/live-link-contrast.mjs on ink/d-link-contrast). Flux now draws it in its own blues: dark resting #3A8FA5 and selected #00C2FF; light resting #35859E and selected #00719C.
//   LINK-COLOUR  the line's computed colour is the approved one at full opacity (source-free), in both Page tones, resting and selected
//   LINK-PIXELS  read from the DRAWN pixels on the line's centre (a strip across the vertical line: the colour it drew = the board + the strip's sum over its stroke width), it drew the approved colour
//                and stands 3:1 or better against its board
//   LINK-LIVE    the fixture is the live Flux build (no ?flux3 flag)       LINK-SCOPE  the colours sit under [data-theme='flux'] only (Arbor keeps its brass)
//   MUT-LINK-OLD the old colour (brass at .9, forced) turns both readers RED in every tone and state          MUT-LINK-LAW the contrast and colour halves go RED on synthetic bad values
// Run: node scripts/harness/bug57-live-board-links.mjs   (from apps/desktop; a box turn or Actions: it drives a browser)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const mouse = (app, type, x, y, o = {}) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'mouse', ...o });
const click = async (app, x, y) => { await app.mouseMove(x, y); await mouse(app, 'mousePressed', x, y); await mouse(app, 'mouseReleased', x, y); };
const dbl = async (app, x, y) => { await app.mouseMove(x, y); await mouse(app, 'mousePressed', x, y, { clickCount: 1 }); await mouse(app, 'mouseReleased', x, y, { clickCount: 1 }); await sleep(60); await mouse(app, 'mousePressed', x, y, { clickCount: 2 }); await mouse(app, 'mouseReleased', x, y, { clickCount: 2 }); await sleep(250); };
const R = (app, sel) => app.evalJs(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height }; })()`);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const reads = {};
await withHarness(async (app) => {
  for (const tone of ['dark', 'light']) {
    await app.emulateDpr(1, 1400, 900);
    await app.goto('/');
    await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','flux'); localStorage.setItem('wrizo-theme-prefs', JSON.stringify({ voice: 'serif', page: ${JSON.stringify(tone)}, fade: 'on' })); localStorage.setItem('wrizo-ambiance-dial','50');`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
    await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash', timeout: 15000 }).catch(() => {});
    const id = `b57-board-${tone}`;
    const boxes = [
      { id: 'd-a', kind: 'text', x: 0.05, y: 0.05, w: 0.2, h: 0.12, z: 1, text: 'Card A' },
      { id: 'd-c', kind: 'text', x: 0.05, y: 0.45, w: 0.2, h: 0.12, z: 3, text: 'Card C' },
      { id: 'd-ac', kind: 'connection', x: 0, y: 0, w: 0, h: 0, z: 5, connA: 'd-a', connB: 'd-c' },
    ];
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: 'B57 board', pageType: 'board', boxes, createdAt: new Date().toISOString(), origin: null, source: null })})`);
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
      if (!info) { reads[`${tone}-${label}`] = { error: 'no line' }; return; }
      const data = (await app.cdp('Page.captureScreenshot', { format: 'png' })).data;
      const px = await app.evalJs(`(async () => { const img = new Image(); img.src = 'data:image/png;base64,${data}'; await img.decode(); const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; const x = c.getContext('2d'); x.drawImage(img, 0, 0); const D = x.getImageData(0, 0, c.width, c.height); const W = c.width;
        const P = (a, b) => { const i = (b * W + a) * 4; return [D.data[i], D.data[i + 1], D.data[i + 2]]; };
        const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; const lum = (p) => 0.2126 * lin(p[0]) + 0.7152 * lin(p[1]) + 0.0722 * lin(p[2]); const cr = (p, q) => (Math.max(lum(p), lum(q)) + 0.05) / (Math.min(lum(p), lum(q)) + 0.05);
        // the line is VERTICAL in this fixture (both anchors at x = .25 of the page, one above the other), so a horizontal strip across it at its midpoint reads it: the board beside it (3 px, 8 to 10 px
        // to each side), then the colour the line DREW = board + (the sum over the strip of pixel - board) / stroke-width (a non-scaling stroke's coverage sums to its width, wherever it falls on the pixel grid)
        const info = ${JSON.stringify(info)}; const sw = parseFloat(info.sw) || 1; const y = Math.round(info.my); const x0 = Math.round(info.x1);
        const side = []; for (let k = 8; k <= 10; k += 1) { side.push(P(x0 - k, y)); side.push(P(x0 + k, y)); }
        const board = [0, 1, 2].map((i) => Math.round(side.reduce((s, p) => s + p[i], 0) / side.length));
        const sum = [0, 0, 0]; const strip = []; for (let k = -5; k <= 5; k += 1) { const p = P(x0 + k, y); strip.push(p); for (let i = 0; i < 3; i += 1) sum[i] += p[i] - board[i]; }
        const drawn = [0, 1, 2].map((i) => Math.max(0, Math.min(255, Math.round(board[i] + sum[i] / sw))));
        return { board, drawn, contrast: +cr(drawn, board).toFixed(2), vertical: Math.abs(info.x2 - info.x1) < 0.5, strip: strip.slice(3, 8) }; })()`);
      reads[`${tone}-${label}`] = { stroke: info.stroke, sw: info.sw, op: info.op, sel: info.sel, flag, px };
    };
    await read('resting');
    // the OLD colour as a mutant: Arbor's brass at .9, forced over the Flux rules
    await app.evalJs("(() => { const s = document.createElement('style'); s.id = 'mut-old'; s.textContent = '.board-connection-line{ stroke:#ff9800 !important; opacity:.9 !important; }'; document.head.appendChild(s); })()");
    await sleep(150); await read('resting-old');
    await app.evalJs("document.getElementById('mut-old').remove()"); await sleep(150);
    // select the line: click its hit line at the middle
    const line = await app.evalJs(`(() => { const hit = document.querySelector('.board-connection-hit'); if (!hit) return null; const c = document.querySelector('.board-canvas').getBoundingClientRect(); return { x: Math.round((+hit.getAttribute('x1') + +hit.getAttribute('x2')) / 2 + c.left), y: Math.round((+hit.getAttribute('y1') + +hit.getAttribute('y2')) / 2 + c.top) }; })()`);
    if (line) { await click(app, line.x, line.y); await sleep(500); await app.mouseMove(8, 8); await sleep(300); }
    await read('selected');
    await app.evalJs("(() => { const s = document.createElement('style'); s.id = 'mut-old'; s.textContent = '.board-connection-line{ stroke:#ff9800 !important; opacity:.9 !important; }'; document.head.appendChild(s); })()");
    await sleep(150); await read('selected-old');
    await app.evalJs("document.getElementById('mut-old').remove()"); await sleep(150);
  }
}).catch((e) => { ok('the run reached its end', false, String((e && e.stack) || e).split('\n').slice(0, 3).join(' | ')); });

// ---- the checks ------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const EXPECT = { dark: { resting: '#3A8FA5', selected: '#00C2FF' }, light: { resting: '#35859E', selected: '#00719C' } };
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const nums = (s) => (/(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)/.exec(s || '') || []).slice(1).map(Number);
const near = (a, b, tol) => a.length === 3 && b.length === 3 && a.every((v, i) => Math.abs(v - b[i]) <= tol);
// the four readings, each as the check sees it: the computed colour (source-free) and the drawn pixels (the colour the line drew, and its contrast against the board, floor 3:1)
const colourOk = (r, hex) => !!r && !!r.stroke && near(nums(r.stroke), rgb(hex), 1) && parseFloat(r.op) === 1;
const pixelsOk = (r, hex) => !!r && !!r.px && r.px.vertical === true && near(r.px.drawn, rgb(hex), 10) && r.px.contrast >= 3;
const TONES = ['dark', 'light'], STATES = ['resting', 'selected'];
const cell = (t, s, suffix = '') => reads[`${t}-${s}${suffix}`];
const show = (t, s) => { const r = cell(t, s); return r && r.px ? `${t} ${s}: ${r.stroke} drawn rgb(${r.px.drawn}) on rgb(${r.px.board}) = ${r.px.contrast}:1` : `${t} ${s}: no reading`; };
console.log('LINK readings: ' + TONES.flatMap((t) => STATES.map((s) => show(t, s))).join(' | '));
for (const t of TONES) for (const s of STATES) {
  ok(`LINK-COLOUR ${t} ${s}: the line's computed colour is the approved ${EXPECT[t][s]} at full opacity`, colourOk(cell(t, s), EXPECT[t][s]), JSON.stringify(cell(t, s) && { stroke: cell(t, s).stroke, op: cell(t, s).op }));
  ok(`LINK-PIXELS ${t} ${s}: read from the drawn pixels on the line's centre, it drew ${EXPECT[t][s]} (within 10 per channel) and stands 3:1 or better against its board (printed: ${cell(t, s) && cell(t, s).px ? cell(t, s).px.contrast + ':1' : 'n/a'})`, pixelsOk(cell(t, s), EXPECT[t][s]), JSON.stringify(cell(t, s)));
}
ok('LINK-LIVE the fixture was the live Flux build: theme flux, no ?flux3 flag, the Page tone as asked', TONES.every((t) => STATES.every((s) => { const r = cell(t, s); return r && r.flag && r.flag.flag === false && r.flag.theme === 'flux' && r.flag.tone === t; })), JSON.stringify(TONES.map((t) => cell(t, 'resting') && cell(t, 'resting').flag)));
const FLUX_SRC = fs.readFileSync(path.join(HERE, '..', '..', 'src', 'styles', '06-flux-v2.css'), 'utf8');
const linkRules = FLUX_SRC.split('\n').filter((l) => /\.board-connection-line/.test(l) && /stroke\s*:/.test(l));
ok(`LINK-SCOPE the colours live under [data-theme='flux'] only (Arbor keeps its brass): ${linkRules.length} rules, each scoped`, linkRules.length === 4 && linkRules.every((l) => /^\[data-theme='flux'\]/.test(l.trim())), JSON.stringify(linkRules.map((l) => l.slice(0, 70))));
ok('MUT-LINK-OLD the colour reader goes RED on the OLD colour (brass #ff9800 at .9) in every tone and state, by the computed colour and by the drawn pixels',
  TONES.every((t) => STATES.every((s) => !colourOk(cell(t, s, '-old'), EXPECT[t][s]) && !pixelsOk(cell(t, s, '-old'), EXPECT[t][s]))), JSON.stringify(TONES.flatMap((t) => STATES.map((s) => { const r = cell(t, s, '-old'); return r && r.px ? `${t} ${s}: ${r.stroke} drew rgb(${r.px.drawn}) ${r.px.contrast}:1` : `${t} ${s}: none`; }))));
ok('MUT-LINK-LAW the contrast half goes RED on a colour under 3:1 (the light page, resting, drawn at #9CC5D0), and the colour half on a wrong colour', !pixelsOk({ px: { vertical: true, drawn: rgb('#9CC5D0'), contrast: 1.9, board: [244, 247, 248] } }, '#35859E') && !colourOk({ stroke: 'rgb(156, 197, 208)', op: '1' }, '#35859E') && colourOk({ stroke: 'rgb(53, 133, 158)', op: '1' }, '#35859E'), '');
const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
console.log(failed.length ? `\nBUG57-LIVE-BOARD-LINKS VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nBUG57-LIVE-BOARD-LINKS VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
