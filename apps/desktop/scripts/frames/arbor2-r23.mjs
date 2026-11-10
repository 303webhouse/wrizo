// ARBOR v2 MOCKUP, ROUND r23 - Fable's Nov 10 relay (12:00 am), as named screens for INK's frames job
// (-f themes=plateau -f widths=1366 -f screens_file=apps/desktop/scripts/frames/arbor2-r23.mjs; the -2000 screens set their own 2000 x 1125 window).
//   2. NICK RULED (Nov 9, 11:29 pm): the night room takes brown B; Now / A / C leave the mockup panel. (The day logo #727958 is r22's #44522E copy as
//      drawn at the mark's .7 over the plaster - already built; r22-day-logo measures it.)
//   3. NICK RULED (11:38 pm): the pergola shadow 1.5x, both beams off the window's LEFT edge: on the 1400 x 900 drawing x' = 1.5x - 240, y' = 1.5y - 345;
//      the 2.8 blur NOT scaled; colour, strength, breeze, swap, reduced motion unchanged. Day frames at 1366 and 2000: at rest, mid-breeze, a drawer
//      and a pop-out open.
//   4b. the Wrizors: the page's scrollbar thumb was 6 px and stood at rest; Nick's Nov 4 rule - 4 px, only on scroll, hover or drag (~1 s after).
//   4c. the Wrizors: "Selection" in the Tools drawer read 2.2:1 - its switched-off state (nothing highlighted); chosen-able, it must read 4.5:1.
// Every check THROWS with its numbers when it fails and prints them when it passes ("ARBOR-R23 <screen> {...}"). Seeds go through window.wrizo*.
import { guarded } from './mockup-kit.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const say = (name, data) => console.log(`ARBOR-R23 ${name} ${JSON.stringify(data)}`);
const fail = (name, data) => { console.log(`ARBOR-R23-FAIL ${name} ${JSON.stringify(data)}`); throw new Error(`${name} FAILED ${JSON.stringify(data)}`.slice(0, 1200)); };
const FINISH = "(() => { document.getAnimations().forEach((a) => { try { if (a.effect && Number.isFinite(a.effect.getComputedTiming().endTime)) a.finish(); } catch {} }); return true; })()";
const PAGEW = 'The morning light came in low across the table, and she began to write. The kettle ticked as it cooled, and outside a dog asked the street a question nobody answered.';
const LONG = Array.from({ length: 60 }, () => PAGEW).join('\n\n');
const setRoom = async (app, room) => { await app.evalJs(`document.documentElement.setAttribute('data-room', ${JSON.stringify(room === 'day' ? 'light' : 'dark')})`); await sleep(700); };
const go = async (app, hash) => {
  await app.evalJs(`history.replaceState(null, '', '/?arbor2=1' + ${JSON.stringify(hash)})`); await app.reload();
  await waitSoft(app, "document.documentElement.getAttribute('data-arbor2') === 'true'", { label: 'flag', timeout: 15000 });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 });
};
const mode = async (app, k) => { const hit = await app.evalJs(`(() => { const b = document.querySelector('.desk-mode-tab[data-mode-key=${JSON.stringify(k)}]'); if (b) b.click(); return !!b; })()`); if (!hit) fail('R23-MODE', { k }); await sleep(1200); };
const openPage = async (app, id, text = PAGEW, m = 'draft') => {
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await sleep(300); await go(app, `#/page/${id}`);
  if (!(await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'page', timeout: 10000 }))) fail('R23-OPEN-PAGE', { id, editor: false });
  await sleep(900); await mode(app, m);
  await app.evalJs("document.querySelector('.forward-only-editor')?.blur(); getSelection()?.removeAllRanges()");
  await app.mouseMove(600, 300); await sleep(700);
};
const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const contrast = (a, b) => { const L = (p) => 0.2126 * lin(p[0]) + 0.7152 * lin(p[1]) + 0.0722 * lin(p[2]); const x = L(a), y = L(b); return Math.round(((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)) * 100) / 100; };
const rgb = (s) => (String(s).match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number);
const shot = async (app) => (await app.cdp('Page.captureScreenshot', { format: 'png' })).data;
// pixels of a screenshot, read in the page (x, y in CSS px)
const pixels = (app, png, pts) => app.evalJs(`(async () => { const img = new Image(); img.src = 'data:image/png;base64,${png}'; await img.decode(); const dpr = img.width / innerWidth; const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const cx = c.getContext('2d'); cx.drawImage(img, 0, 0); return ${JSON.stringify(pts)}.map(([x, y]) => Array.from(cx.getImageData(Math.floor(x * dpr), Math.floor(y * dpr), 1, 1).data.slice(0, 3))); })()`);

// ── 2. BROWN B: the night room ──
// The tokens B sets (styles/arbor-v2.css, r22 note 3's table), read as computed on <html> by night; the bar offers no Night browns row.
const B = { '--ink-950': '#080402', '--ink-900': '#110A06', '--ink-800': '#1B120B', '--ink-border': '#2E2115', '--ink-border-strong': '#3E2D1F', '--arbor2-bar': '#19110B', '--arbor2-bar-line': '#291E15' };
const nightB = async (app, name) => {
  await openPage(app, `arbor-r23-b-${Math.random().toString(36).slice(2, 6)}`); await setRoom(app, 'night');
  await app.evalJs("(() => { const g = document.querySelector('.wz-sliver-grip'); if (g && document.querySelector('.wz-sliver')?.getAttribute('data-open') !== 'true') g.click(); return true; })()"); await sleep(700); await app.evalJs(FINISH);
  const r = await app.evalJs(`(() => { const cs = getComputedStyle(document.documentElement), v = (n) => cs.getPropertyValue(n).trim().toUpperCase(); const toks = {}; for (const n of ${JSON.stringify(Object.keys(B))}) toks[n] = v(n);
    const sp = document.querySelector('.wz-sliver-panel'); const rows = [...document.querySelectorAll('.arbor2-bar-row')].map((x) => x.getAttribute('aria-label'));
    const ed = document.querySelector('.forward-only-editor'), p = ed && ed.closest('.mode-page');
    return { brown: document.documentElement.getAttribute('data-arbor2-brown'), room: document.documentElement.getAttribute('data-arbor2-room'), tone: document.documentElement.getAttribute('data-page'), toks,
      drawer: sp ? getComputedStyle(sp).getPropertyValue('--desk-ground').trim().toUpperCase() : null, rows, browns: !!document.querySelector('.arbor2-bar-row[aria-label="Night browns"]'),
      ink: ed ? getComputedStyle(ed).color : null, paper: p ? getComputedStyle(p).backgroundColor : null }; })()`);
  const bad = [];
  if (r.brown !== 'b') bad.push(`data-arbor2-brown is ${r.brown}`);
  if (r.room !== 'night') bad.push(`room ${r.room}`);
  for (const [k, want] of Object.entries(B)) if (r.toks[k] !== want) bad.push(`${k} ${r.toks[k]} (want ${want})`);
  // PARKED 2026-11-10 (SUPERSEDED - FABLE RULED, Nov 10, 1:50 pm, (i): B's drawer ground is lifted just enough to stand 6.0 L* off the dark page - #231811 -> #241811 (L* 9.55 against the page's 3.55: 6.00; 6.1 as r13 rounds)). Original, verbatim:
  // if (r.drawer !== '#231811') bad.push(`drawer ground ${r.drawer} (want #231811)`);
  // SUCCESSOR: the drawer ground is the lifted #241811
  if (r.drawer !== '#241811') bad.push(`drawer ground ${r.drawer} (want #241811)`);
  if (r.browns) bad.push('the Night browns row is still in the bar');
  if (r.tone === 'dark') { const want = 'rgb(16, 12, 9)'; if (r.paper !== want) bad.push(`dark page paper ${r.paper} (want #100C09)`); }
  r.inkOnPaper = r.ink && r.paper ? contrast(rgb(r.ink), rgb(r.paper)) : null;
  if (!(r.inkOnPaper >= 13.9)) bad.push(`page words ${r.inkOnPaper}`);
  if (bad.length) fail(name, { bad, r });
  say(name, r);
};

// ── 3. THE PERGOLA: 1.5x, placement B ──
// In the room's SVG (in the drawing's own 1400 x 900 units): the placement group carries the matrix; the blur is still 2.8 (not scaled); each beam,
// mapped to the screen, starts left of the window's left edge (no end shows there); the rafters still leave the window at the bottom. The room's
// drawing and the page's copy stay aligned (r21-shade-menus' rule). Pictures: at rest, mid-breeze, a drawer and a pop-out open.
const PERGOLA = `(() => { const svg = document.querySelector('.arbor2-pergola svg'); if (!svg) return null; const place = svg.querySelector('g.arbor2-pergola-place'); const blur = svg.querySelector('feGaussianBlur');
  const beams = place ? [...place.querySelectorAll('rect')].slice(0, 2).map((b) => { const r = b.getBoundingClientRect(); return { l: Math.round(r.left), r: Math.round(r.right), t: Math.round(r.top), b: Math.round(r.bottom) }; }) : [];
  const ends = place ? [...place.querySelectorAll('rect')].slice(0, 2).map((b) => { const m = b.getScreenCTM(); const x = b.x.baseVal.value, y = b.y.baseVal.value, w = b.width.baseVal.value, h = b.height.baseVal.value;
    const pt = (px, py) => { const p = new DOMPoint(px, py).matrixTransform(m); return [Math.round(p.x), Math.round(p.y)]; }; return { left: [pt(x, y), pt(x, y + h)], right: [pt(x + w, y), pt(x + w, y + h)] }; }) : [];
  const polys = place ? [...place.querySelectorAll('polygon')].map((p) => p.getBoundingClientRect()) : [];
  const page = document.querySelector('.mode-page .arbor2-pagesh svg')?.getBoundingClientRect(), room = svg.getBoundingClientRect();
  return { ends, matrix: place ? place.getAttribute('transform') : null, blur: blur ? blur.getAttribute('stdDeviation') : null, beams, w: innerWidth, h: innerHeight,
    raftersOffBottom: polys.filter((r) => r.bottom > innerHeight).length, rafters: polys.length,
    pageAligned: !page || (Math.abs(page.left - room.left) <= 1.5 && Math.abs(page.top - room.top) <= 1.5 && Math.abs(page.width - room.width) <= 2) }; })()`;
const pergola = async (app, name) => {
  await openPage(app, `arbor-r23-p-${Math.random().toString(36).slice(2, 6)}`); await setRoom(app, 'day'); await sleep(600);
  const r = await app.evalJs(PERGOLA);
  const bad = [];
  if (!r) fail(name, { bad: ['no room pergola'] });
  if (r.matrix !== 'matrix(1.5 0 0 1.5 -240 -345)') bad.push(`placement ${r.matrix}`);
  if (r.blur !== '2.8') bad.push(`blur ${r.blur}`);
  // PARKED 2026-11-10 (SUPERSEDED on its first run, frames 42775628857 - its premise was wrong, not the build: Nick's placement B, as Fable's panel B
  // draws it, runs the UPPER beam off the left edge and the LOWER beam off the bottom-left; the lower beam's box starts 19 px (35 at 2000) inside the
  // left edge while its end lies below the window). The line that stood, verbatim:
  // if (r.beams.length !== 2 || !r.beams.every((b) => b.l < 0)) bad.push('a beam ends inside the window on the left');
  // SUCCESSOR: Nick's words - no END of either beam shows: every corner of both ends of both beams, mapped to the screen, lies outside the window.
  const inside = ([x, y]) => x >= 0 && x <= r.w && y >= 0 && y <= r.h;
  if (r.ends.length !== 2 || r.ends.some((e) => [...e.left, ...e.right].some(inside))) bad.push('a beam end shows inside the window');
  if (!(r.raftersOffBottom >= 1)) bad.push('no rafter leaves the window at the bottom');
  if (!r.pageAligned) bad.push('the page copy is not aligned with the room');
  if (bad.length) fail(name, { bad, r });
  say(name, r);
};
const pergolaPic = async (app, which) => {
  await openPage(app, `arbor-r23-pp-${which}-${Math.random().toString(36).slice(2, 6)}`); await setRoom(app, 'day'); await sleep(600);
  if (which === 'breeze') {   // every leaf cluster held where the breeze stands 1.3 s into a gust (the clusters with ~1 s delays near their swing's peak)
    await app.evalJs("(() => { document.querySelectorAll('.arbor2-pergola .wz-leaf, .arbor2-pagesh .wz-leaf').forEach((l) => l.getAnimations().forEach((a) => { a.pause(); a.currentTime = 1300; })); return true; })()");
  }
  if (which === 'drawer') {
    await app.evalJs("(() => { const g = document.querySelector('.wz-sliver-grip'); if (g && document.querySelector('.wz-sliver')?.getAttribute('data-open') !== 'true') g.click(); return true; })()"); await sleep(500);
    await app.evalJs("document.querySelector(\".wz-strip-item[data-category='theme']\")?.click()"); await sleep(700); await app.evalJs(FINISH);
  }
  await sleep(300);
};

// ── 4b. THE PAGE'S SCROLLBAR ──
// A long page in Draft by night (it overflows). The strip's columns at mid-height, read against the paper beside it: at rest nothing is drawn; a
// wheel over the page draws the thumb, 4 px wide (+-1 for the scale's rounding); 1.6 s after, nothing again; the pointer on the strip draws it.
const STRIP = `(() => { const s = document.querySelector('.desk-frame-stage .mode-scroll'); if (!s) return null; const r = s.getBoundingClientRect(), k = s.offsetWidth ? r.width / s.offsetWidth : 1;
  const strip = (s.offsetWidth - s.clientWidth) * k; return { right: r.right, strip, top: r.top, h: r.height, over: s.scrollHeight > s.clientHeight + 1, sb: s.getAttribute('data-arbor2-sb') }; })()`;
const drawnCols = async (app, st) => {
  // (after run 42776334582, no assertion changed: on a long page the thumb is a short bar wherever the page is scrolled to, so the strip is scanned
  // down its whole height, every 2 px; each row is read against the paper 6 px left of the strip on the same row)
  const ys = Array.from({ length: Math.floor(st.h / 2) }, (_, i) => st.top + 1 + i * 2);
  // (after run 42775628857, no assertion changed: the columns are the strip's own - the window ran 2 px past it onto the page's hairline)
  const xs = Array.from({ length: Math.floor(st.strip) }, (_, i) => st.right - st.strip + 0.5 + i);
  const png = await shot(app);
  const px = await pixels(app, png, ys.flatMap((y) => xs.map((x) => [x, y])).concat(ys.map((y) => [st.right - st.strip - 6, y])));
  const ref = px.slice(-ys.length); const grid = px.slice(0, -ys.length);
  // a column is drawn when, on any of the three rows, it differs from the paper beside the strip by more than 24 on a channel
  const cols = xs.filter((_, i) => ys.some((__, j) => { const p = grid[j * xs.length + i], q = ref[j]; return p.some((v, c) => Math.abs(v - q[c]) > 24); }));
  const rows = ys.filter((_, j) => xs.some((__, i) => { const p = grid[j * xs.length + i], q = ref[j]; return p.some((v, c) => Math.abs(v - q[c]) > 24); }));
  return { n: cols.length, cols: cols.map((x) => Math.round(x)), rows: rows.length ? [Math.round(rows[0]), Math.round(rows[rows.length - 1])] : null };
};
const scrollbar = async (app, name) => {
  await openPage(app, `arbor-r23-sb-${Math.random().toString(36).slice(2, 6)}`, LONG); await setRoom(app, 'night');
  await app.mouseMove(300, 300); await sleep(1800);
  const st = await app.evalJs(STRIP);
  if (!st || !st.over || !(st.strip > 0)) fail(name, { bad: ['the page does not overflow or has no strip'], st });
  const rest = await drawnCols(app, st);
  await app.cdp('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 600, y: 400, deltaX: 0, deltaY: 240 }); await sleep(180);
  const topA = await app.evalJs("document.querySelector('.desk-frame-stage .mode-scroll').scrollTop");
  const scrolled = { ...(await drawnCols(app, st)), sb: (await app.evalJs(STRIP)).sb };
  await sleep(1600);
  const after = { ...(await drawnCols(app, st)), sb: (await app.evalJs(STRIP)).sb, top: await app.evalJs("document.querySelector('.desk-frame-stage .mode-scroll').scrollTop"), topA };
  await app.mouseMove(st.right - st.strip / 2, st.top + st.h * 0.5); await sleep(150);
  const hover = { ...(await drawnCols(app, st)), sb: (await app.evalJs(STRIP)).sb };
  const bad = [];
  if (rest.n !== 0) bad.push(`at rest ${rest.n} column(s) drawn`);
  if (scrolled.n < 3 || scrolled.n > 5) bad.push(`scrolling: ${scrolled.n} column(s) drawn (want 4)`);
  if (after.n !== 0) bad.push(`1.6 s after: ${after.n} column(s) still drawn`);
  if (hover.n < 3 || hover.n > 5) bad.push(`on the strip: ${hover.n} column(s) drawn (want 4)`);
  if (Math.abs(after.top - after.topA) > 1) bad.push(`the page moved when the bar went: scrollTop ${after.topA} -> ${after.top}`);
  if (bad.length) fail(name, { bad, st, rest, scrolled, after, hover });
  say(name, { st, rest, scrolled, after, hover });
};

// ── 4c. "SELECTION", CHOOSABLE ──
// Words highlighted in Draft, the Tools drawer open: the type control's Selection button is enabled (not aria-disabled) and its letters read 4.5:1
// or better on the drawer's own ground (computed, both rooms). With nothing highlighted it is the switched-off state (reported, not judged).
const selection = async (app, name) => {
  const out = {};
  for (const room of ['day', 'night']) {
    await openPage(app, `arbor-r23-sel-${room}-${Math.random().toString(36).slice(2, 6)}`); await setRoom(app, room);
    await app.evalJs("(() => { const g = document.querySelector('.wz-sliver-grip'); if (g && document.querySelector('.wz-sliver')?.getAttribute('data-open') !== 'true') g.click(); return true; })()"); await sleep(700);
    const READ = `(() => { const b = document.querySelector('.wz-type-scope[data-scope="selection"]'); if (!b) return null; const cs = getComputedStyle(b);
      let n = b, bg = null; while (n && n !== document.documentElement) { const c = getComputedStyle(n).backgroundColor; if (c && !/rgba\\(0, 0, 0, 0\\)|transparent/.test(c)) { bg = c; break; } n = n.parentElement; }
      let op = 1; for (let e = b; e && e.nodeType === 1; e = e.parentElement) op *= Number(getComputedStyle(e).opacity);
      return { disabled: b.getAttribute('aria-disabled'), color: cs.color, bg, op: Math.round(op * 100) / 100 }; })()`;
    const off = await app.evalJs(READ);
    await app.evalJs("(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const tw = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); const t = tw.nextNode(); if (!t) return false; const r = document.createRange(); r.setStart(t, 4); r.setEnd(t, 11); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()");
    await sleep(500);
    const on = await app.evalJs(READ);
    out[room] = { off, on, ratio: on && on.bg ? contrast(rgb(on.color), rgb(on.bg)) : null };
  }
  const bad = [];
  for (const [room, o] of Object.entries(out)) {
    if (!o.on) { bad.push(`${room}: no Selection button in the Tools drawer`); continue; }
    if (o.on.disabled === 'true') bad.push(`${room}: Selection still switched off with words highlighted`);
    if (o.on.op < 0.99) bad.push(`${room}: drawn at opacity ${o.on.op}`);
    if (!(o.ratio >= 4.5)) bad.push(`${room}: ${o.ratio}:1`);
  }
  if (bad.length) fail(name, { bad, out });
  say(name, out);
};

const screens = {
  'r23-night-b': (app) => nightB(app, 'r23-night-b'),
  'r23-pergola': (app) => pergola(app, 'r23-pergola'),
  'r23-pergola-2000': async (app) => { await app.emulateDpr(1, 2000, 1125); await pergola(app, 'r23-pergola-2000'); },
  'r23-pic-pergola-rest': (app) => pergolaPic(app, 'rest'),
  'r23-pic-pergola-rest-2000': async (app) => { await app.emulateDpr(1, 2000, 1125); await pergolaPic(app, 'rest'); },
  'r23-pic-pergola-breeze': (app) => pergolaPic(app, 'breeze'),
  'r23-pic-pergola-breeze-2000': async (app) => { await app.emulateDpr(1, 2000, 1125); await pergolaPic(app, 'breeze'); },
  'r23-pic-pergola-drawer': (app) => pergolaPic(app, 'drawer'),
  'r23-pic-pergola-drawer-2000': async (app) => { await app.emulateDpr(1, 2000, 1125); await pergolaPic(app, 'drawer'); },
  'r23-scrollbar': (app) => scrollbar(app, 'r23-scrollbar'),
  // brown B for the record (the successor of r22's step pictures): by night and by day, the Tools drawer open
  'r23-pic-night-b': async (app) => { await openPage(app, `arbor-r23-pnb-${Math.random().toString(36).slice(2, 6)}`); await setRoom(app, 'night'); await app.evalJs("(() => { const g = document.querySelector('.wz-sliver-grip'); if (g && document.querySelector('.wz-sliver')?.getAttribute('data-open') !== 'true') g.click(); return true; })()"); await sleep(900); await app.evalJs(FINISH); await app.mouseMove(600, 300); await sleep(300); },
  // 4a (Fable, Nov 10, 1:50 pm: "4a closes when the ship's night Typewriter frame at rest (both widths) is in r23-for-wrizors"): Free Write's
  // Typewriter by night, at rest - no handles, no strips (Nick's Nov 8 ruling); the pointer away, nothing typed
  'r23-pic-typewriter-night': async (app) => { await openPage(app, `arbor-r23-twn-${Math.random().toString(36).slice(2, 6)}`, PAGEW, 'freewrite'); await setRoom(app, 'night'); await app.evalJs("document.querySelector('.forward-only-editor')?.blur(); getSelection()?.removeAllRanges()"); await app.mouseMove(600, 300); await sleep(1500); await app.evalJs(FINISH); },
  'r23-pic-typewriter-night-2000': async (app) => { await app.emulateDpr(1, 2000, 1125); await openPage(app, `arbor-r23-twn2-${Math.random().toString(36).slice(2, 6)}`, PAGEW, 'freewrite'); await setRoom(app, 'night'); await app.evalJs("document.querySelector('.forward-only-editor')?.blur(); getSelection()?.removeAllRanges()"); await app.mouseMove(900, 400); await sleep(1500); await app.evalJs(FINISH); },
  'r23-pic-day': async (app) => { await openPage(app, `arbor-r23-pd-${Math.random().toString(36).slice(2, 6)}`); await setRoom(app, 'day'); await app.evalJs("(() => { const g = document.querySelector('.wz-sliver-grip'); if (g && document.querySelector('.wz-sliver')?.getAttribute('data-open') !== 'true') g.click(); return true; })()"); await sleep(900); await app.evalJs(FINISH); await app.mouseMove(600, 300); await sleep(300); },
  'r23-selection': (app) => selection(app, 'r23-selection'),
};

export default guarded(screens, { verdict: ['ARBOR-R23'] });
