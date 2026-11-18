// #108 (FABLE, Nov 18, 1:45 pm: "an unframed page's count row at night with a light page shows a cream strip on the dark room: the count row takes
// the room's colours, with a contrast check"). The redesign (no query); the room through the product's own Room attribute (<html data-room>), the
// page tone through the store's seam, the mode through the page's own mode tabs. Every read is the page AS DRAWN (Page.captureScreenshot clips,
// decoded in the page; bug83-count-row's method): the ground is the median of a ring just outside a box, a word's ink the pixel farthest from it.
//   N1 UNFRAMED (Typewriter by night, light page): no plate - the count row's box draws no cream (pixels lighter than luminance .75: under 3%), its
//      ground is the room's (luminance under .2)
//   N2 UNFRAMED: "31 words" and the WORDS label each read >= 4.5:1 against the ground drawn around them
//   C1 FRAMED at night (Draft, light page): the plate is the page's paper as r11 ruled (the box mostly cream, its words dark)
//   C2 Typewriter BY DAY (light page; the sheet stays): the plate is the page's paper as before
//   M1 (mutant) the old plate put back on the unframed page (background var(--paper), asserted LANDED) - N1's read goes RED
//   M2 (mutant) the old light-page label colour put back (#554B3D on WORDS and the count, asserted LANDED) - N2's read goes RED
// RED FIRST: on main before the change N1 and N2 fail (the cream strip; #554B3D on it would pass contrast on the plate, so N1 is the red).
process.env.WS_ARBOR2 = process.env.WS_ARBOR2 || 'default';
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const PAGEW = 'The morning light came in low across the table, and she began to write. The kettle ticked as it cooled.';
const BOX = (sel) => `(() => { const e = document.querySelector(${J(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2 ? { l: r.left, t: r.top, w: r.width, h: r.height, bg: getComputedStyle(e).backgroundColor, color: getComputedStyle(e).color } : null; })()`;
const lumOf = (p) => (0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]) / 255;

await withHarness(async (app) => {
  await app.emulateDpr(1, 1400, 900);
  // the box as drawn: its pixels' cream share and median, and (for a word) the peak contrast against the ring around it
  const drawn = async (sel, pad) => {
    const b = await app.evalJs(BOX(sel)); if (!b) return { missing: sel };
    const clip = { x: Math.max(0, Math.floor(b.l) - pad), y: Math.max(0, Math.floor(b.t) - pad), width: Math.ceil(b.w) + 2 * pad, height: Math.ceil(b.h) + 2 * pad, scale: 1 };
    const data = (await app.cdp('Page.captureScreenshot', { format: 'png', clip })).data;
    const px = await app.evalJs(`(async () => { const img = new Image(); img.src = 'data:image/png;base64,${data}'; await img.decode(); const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; const g = c.getContext('2d'); g.drawImage(img, 0, 0); const D = g.getImageData(0, 0, c.width, c.height).data; const W = c.width, H = c.height;
      const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; const L = (p) => 0.2126 * lin(p[0]) + 0.7152 * lin(p[1]) + 0.0722 * lin(p[2]); const cr = (p, q) => (Math.max(L(p), L(q)) + 0.05) / (Math.min(L(p), L(q)) + 0.05);
      const ring = [], inner = []; const e = ${pad}; for (let y = 0; y < H; y += 1) for (let x = 0; x < W; x += 1) { const i = (y * W + x) * 4; const p = [D[i], D[i + 1], D[i + 2]]; if (x < 2 || y < 2 || x >= W - 2 || y >= H - 2) ring.push(p); else if (x >= e && y >= e && x < W - e && y < H - e) inner.push(p); }
      const med = (arr, k) => { const v = arr.map((p) => p[k]).sort((a, b) => a - b); return v[v.length >> 1]; }; const ground = [med(ring, 0), med(ring, 1), med(ring, 2)]; const box = [med(inner, 0), med(inner, 1), med(inner, 2)];
      let peak = ground, best = 1; for (const p of inner) { const k = cr(p, ground); if (k > best) { best = k; peak = p; } }
      const cream = inner.filter((p) => (0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]) / 255 > 0.75).length / Math.max(1, inner.length);
      return { ground, box, peak, contrast: Math.round(best * 100) / 100, cream: Math.round(cream * 1000) / 1000 }; })()`);
    return { ...b, ...px };
  };
  const setup = async (room, tone, mode) => {
    await app.goto('/');
    await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-splash-hold', '50'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4'); localStorage.setItem('wrizo-theme', 'plateau'); true");
    await app.evalJs(`localStorage.setItem('wrizo-theme-prefs', JSON.stringify({ voice: 'serif', page: ${J(tone)}, fade: 'on' })); localStorage.setItem('wrizo-writing-settings', JSON.stringify({ progress: 'words', progressStyle: 'bar' })); true`);
    await app.evalJs("history.replaceState(null, '', '/#/')"); await app.reload();
    await waitSoft(app, "typeof window.wrizoCreateJournalPage === 'function'", { label: 'seams', timeout: 20000 });
    const id = `arbor-108-${Math.random().toString(36).slice(2, 7)}`;
    await app.evalJs(`window.wrizoCreateJournalPage(${J({ id, text: PAGEW, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`); await sleep(300);
    await app.evalJs(`location.hash = '#/page/${id}'`);
    await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'page', timeout: 15000 }); await sleep(900);
    await app.evalJs(`(() => { const b = [...document.querySelectorAll('.desk-mode-tab')].find((x) => (x.textContent || '').trim().toLowerCase() === ${J(mode)}); if (b) b.click(); return !!b; })()`); await sleep(1200);
    if (mode === 'free write') await waitSoft(app, "!!document.querySelector('.mode-pagecol[data-zoom=\"true\"]')", { label: 'typewriter zoom', timeout: 6000 });
    await app.evalJs(`document.documentElement.setAttribute('data-room', ${J(room === 'day' ? 'light' : 'dark')})`); await sleep(1200);
    await app.evalJs("document.querySelector('.forward-only-editor')?.blur(); getSelection()?.removeAllRanges()"); await app.mouseMove(40, 700); await sleep(600);
    const state = await app.evalJs("(() => { const r = document.documentElement; return { arbor: r.getAttribute('data-arbor2'), room: r.getAttribute('data-arbor2-room'), page: r.getAttribute('data-page'), zoom: !!document.querySelector('.mode-pagecol[data-zoom=\"true\"]'), instrument: !!document.querySelector('.desk-frame-instrument .mode-progress') }; })()");
    return state;
  };
  const read = async () => ({ plate: await drawn('.desk-frame-instrument', 6), count: await drawn('.mode-pmeta > span:first-child', 3), label: await drawn('.desk-frame-instrument .mode-pmetric', 3) });
  const n1ok = (r) => !!r.plate && !r.plate.missing && r.plate.cream < 0.03 && lumOf(r.plate.ground) < 0.2;
  const n2ok = (r) => !!r.count && !!r.label && !r.count.missing && !r.label.missing && r.count.contrast >= 4.5 && r.label.contrast >= 4.5;
  const plateOk = (r) => !!r.plate && !r.plate.missing && r.plate.cream > 0.5;

  const sN = await setup('night', 'light', 'free write'); const n = await read();
  const premise = (s, room, zoom) => !!s && s.arbor === 'true' && s.room === room && s.zoom === zoom && s.instrument;
  ok(`N1 UNFRAMED (Typewriter by night, light page): no plate - the count row draws ${n.plate && n.plate.cream} cream, ground ${J(n.plate && n.plate.ground)}`, premise(sN, 'night', true) && n1ok(n), J({ sN, plate: n.plate }));
  ok(`N2 UNFRAMED: "31 words" ${n.count && n.count.contrast}:1 and WORDS ${n.label && n.label.contrast}:1 against the ground drawn around them (>= 4.5)`, premise(sN, 'night', true) && n2ok(n), J({ count: n.count, label: n.label }));
  // M1: the old plate back on the unframed page
  await app.evalJs("(() => { const st = document.createElement('style'); st.id = 'm108-1'; st.textContent = '.desk-frame-instrument.desk-frame-instrument.desk-frame-instrument{ background:var(--paper) !important; }'; document.head.appendChild(st); return true; })()"); await sleep(300);
  const m1 = await read(); await app.evalJs("document.getElementById('m108-1')?.remove()"); await sleep(200);
  ok(`M1 (mutant): the old plate put back (LANDED: ${m1.plate && m1.plate.cream} cream) - N1's read goes RED`, !!m1.plate && m1.plate.cream > 0.5 && !n1ok(m1), J(m1.plate));
  // M2: the old light-page label colour back
  await app.evalJs("(() => { const st = document.createElement('style'); st.id = 'm108-2'; st.textContent = '.desk-frame-instrument.desk-frame-instrument :is(.mode-pmeta, .mode-pmetric).x, .desk-frame-instrument.desk-frame-instrument.desk-frame-instrument :is(.mode-pmeta, .mode-pmetric){ color:#554B3D !important; }'; document.head.appendChild(st); return true; })()"); await sleep(300);
  const m2 = await read(); await app.evalJs("document.getElementById('m108-2')?.remove()");
  ok(`M2 (mutant): #554B3D put back on the count and WORDS (LANDED: ${m2.count && m2.count.color}) - N2's read goes RED (${m2.count && m2.count.contrast} / ${m2.label && m2.label.contrast})`, !!m2.count && /85, 75, 61/.test(m2.count.color || '') && !n2ok(m2), J({ count: m2.count, label: m2.label }));
  const sC1 = await setup('night', 'light', 'draft'); const c1 = await read();
  ok(`C1 FRAMED at night (Draft, light page): the plate is the page's paper (${c1.plate && c1.plate.cream} cream)`, premise(sC1, 'night', false) && plateOk(c1), J({ sC1, plate: c1.plate }));
  const sC2 = await setup('day', 'light', 'free write'); const c2 = await read();
  ok(`C2 Typewriter BY DAY (light page): the plate is the page's paper (${c2.plate && c2.plate.cream} cream)`, premise(sC2, 'day', true) && plateOk(c2), J({ sC2, plate: c2.plate }));
  return checks;
}, { label: 'arbor-bug108' });

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
if (process.env.HARNESS_PARKED === '1') console.log('\nARBOR-BUG108 PARKED: PASS (0 records) - a new file; it parks nothing of its own');
const WANT = 6;
const pass = checks.length === WANT && checks.every((c) => c.pass);
console.log(pass ? `\nARBOR-BUG108 VERIFY: PASS (${checks.length} checks)` : `\nARBOR-BUG108 VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length !== WANT ? ` (${checks.length} ran, ${WANT} expected)` : ''}`);
process.exit(pass ? 0 : 1);
