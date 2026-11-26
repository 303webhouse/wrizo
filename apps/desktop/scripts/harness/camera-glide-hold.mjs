// THE CAMERA'S GLIDE HOLDS ITS POINT (POLISH, Nov 26; Fable, 1:20 pm: "Fix the camera: hold the point once at the glide's start (Board and Flux zoom alike),
// red first on the drift"). A key notch glides over ~20 frames and each frame worked the held point out again from the ROUNDED scroll, so whole-pixel
// rounding piled up by chance (0.8 to 3.3 board px, arbor-board-zoom's MK). THE REAL BOARD in each theme's camera, at 1920x1080:
//   D   eight Ctrl + = notches from true size, from eight different scroll places: the board point at the frame's centre moves by no more than ONE final
//       rounding (0.65 board px at x1.25: half a screen px on each axis)
//   P   a pan made while the notch glides is kept (never taken back by the held point)
//   MUT a scroll nudged 2 px after a notch turns D's reading red
// Run: node scripts/harness/camera-glide-hold.mjs   (from apps/desktop, dist-web built)
Object.assign(process.env, { WS_PLACE: '1', WS_ARBOR2: 'default', WS_MACHINA2: 'default', WS_FLUX3: 'default', WS_REORG: '1' });
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${typeof detail === 'string' ? detail : JSON.stringify(detail)}]` : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const LIMIT = 0.65;

// the camera's own centre (useFluxCamera centre()), and the board point standing there
const AT = `(() => { const w = document.querySelector('.board-canvas-wrap'), cv = document.querySelector('.board-canvas'); if (!w || !cv) return null; const wr = w.getBoundingClientRect(), c = cv.getBoundingClientRect();
  const x = wr.left + w.clientLeft + w.clientWidth / 2, y = wr.top + w.clientTop + w.clientHeight / 2; const s = c.width / cv.offsetWidth;
  return { x, y, s, bx: (x - c.left) / s, by: (y - c.top) / s, sl: w.scrollLeft, st: w.scrollTop }; })()`;

await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const KEYS = { '=': 187, '0': 48 };
  const key = async (k) => {
    const p = { key: k, code: k === '=' ? 'Equal' : 'Digit0', windowsVirtualKeyCode: KEYS[k], nativeVirtualKeyCode: KEYS[k], modifiers: 2 };
    await app.cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...p }); await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', ...p });
  };
  await app.emulateDpr(1, 1920, 1080);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); null");
  await app.reload();
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function' && typeof window.wrizoTheme === 'object'", { label: 'the seams', timeout: 15000 });
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
  const boxes = [];
  for (let i = 0; i < 12; i += 1) boxes.push({ id: `g-${i}`, kind: 'text', x: 0.05 + (i % 3) * 0.3, y: 0.05 + Math.floor(i / 3) * 0.22, w: 0.2, h: 0.1, z: i + 1, text: `Card ${i + 1}` });
  boxes.push({ id: 'g-meta', kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 0, canvasH: 1800 });
  await ev(`(() => { window.wrizoCreateJournalPage(${JSON.stringify({ id: 'glide-board', text: 'Glide', pageType: 'board', boxes, createdAt: '2026-04-01T00:00:00.000Z', origin: null, source: null })}); window.wrizoFlushNow(); return null; })()`);

  for (const [theme, name] of [['plateau', 'Arbor'], ['machina', 'Machina'], ['flux', 'Flux']]) {
    await ev(`localStorage.setItem('wrizo-ambiance-dial', '1'); window.wrizoTheme.set('${theme}'); null`);
    await ev("history.replaceState(null, '', '/#/page/glide-board'); null");
    await app.reload();
    await app.waitFor("!!document.querySelector('.board-canvas .board-box[data-box-id=\"g-0\"]')", { label: `the board in ${name}`, timeout: 15000 }).catch(() => {});
    await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }).catch(() => {});
    await sleep(1500);
    const first = await ev(AT);
    if (first) await app.mouseMove(first.x, first.y);

    const runs = [];
    for (let i = 0; i < 8; i += 1) {
      await key('0'); await sleep(500);
      await ev(`(() => { const w = document.querySelector('.board-canvas-wrap'); w.scrollTop = ${37 * i + 11}; w.scrollLeft = 0; })()`); await sleep(150);
      const a = await ev(AT);
      await key('='); await sleep(600);
      const b = await ev(AT);
      runs.push({ from: a && a.s, to: b && b.s, drift: a && b ? +Math.hypot(b.bx - a.bx, b.by - a.by).toFixed(2) : null, a, b });
    }
    const zoomed = runs.every((r) => r.from && Math.abs(r.from - 1) < 0.004 && Math.abs(r.to - 1.25) < 0.004);
    ok(`${name} (premise): each notch went from true size to x1.25`, zoomed, runs.map((r) => [r.from, r.to]));
    const drifts = runs.map((r) => r.drift);
    ok(`${name} D: a gliding notch holds the centre's board point within one rounding (${LIMIT} board px) in all eight`, zoomed && drifts.every((d) => d !== null && d <= LIMIT), drifts);

    // P: a pan while the notch glides stays
    await key('0'); await sleep(500);
    await ev("(() => { const w = document.querySelector('.board-canvas-wrap'); w.scrollTop = 100; w.scrollLeft = 0; })()"); await sleep(150);
    const p0 = await ev(AT);
    await key('=');
    await sleep(45);
    await ev("(() => { document.querySelector('.board-canvas-wrap').scrollLeft += 60; })()");
    await sleep(600);
    const p1 = await ev(AT);
    const moved = p0 && p1 ? +(p1.bx - p0.bx).toFixed(2) : null;
    ok(`${name} P: a 60 px pan made while the notch glides is kept (the centre moves about 48 board px)`, moved !== null && moved > 36 && moved < 60, { moved, p0, p1 });

    if (theme === 'machina') {
      await ev("(() => { document.querySelector('.board-canvas-wrap').scrollLeft += 2; })()"); await sleep(200);
      const m = await ev(AT);
      const d = m && p1 ? +Math.hypot(m.bx - p1.bx, m.by - p1.by).toFixed(2) : null;
      ok('MUT a 2 px nudge of the scroll turns D\'s reading red', d !== null && d > LIMIT, { d });
    }
    await key('0'); await sleep(400);
  }
});

const failed = checks.filter((c) => !c.pass).length;
console.log(`\nCAMERA-GLIDE-HOLD VERIFY: ${failed ? `FAIL - ${failed}/${checks.length} failed` : `PASS - ${checks.length}/${checks.length}`}`);
process.exit(failed ? 1 : 0);
