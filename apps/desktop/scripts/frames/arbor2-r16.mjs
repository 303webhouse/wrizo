// ARBOR v2 MOCKUP, ROUND r16 - as named screens for INK's frames job (-f themes=plateau -f screens_file=apps/desktop/scripts/frames/arbor2-r16.mjs).
// Sources (Nov 2): the Wrizors' r14 review, Downloads\wrizors-to-ARBOR-nov2.md (md5 11058930) via Fable: 1. Nick's logo back in the app's
// corner rect at .7, both rooms, on the front door; 2. the tagline "For humans who write." and the door words in Alegreya Sans; 3. a "?" is
// guidance (green), never brass, one per row, on its row; the Tools footer "..." unclipped; the forms' quiet text >= 4.5:1. And Nick, 4:34 pm,
// via Fable: the logo follows the ROOM (day all sage; night AND the splash / front door cream #EFE4CB with the o and the i's dot brass #FF9800,
// recoloured; it changes with the room's fade), and is written out on the splash (~2 s, mask/opacity only, <= 3 flashes/s, the brass last,
// reduced motion = the finished logo still, once per splash). "Checks: both rooms + the splash; the logo's colours measured; the animation's
// last frame = the still logo pixel for pixel."
// Every check THROWS with its numbers when it fails and prints them when it passes ("ARBOR-R16 <screen> {...}"). Written red-first: run
// against r15 (386370d7) before the r16 build. Seeds go through window.wrizo*; a visitor is played with CDP Fetch (/auth/me -> 401), as r14.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const WORDS = 'The morning light came in low across the table, and she began to write. The kettle ticked as it cooled, and outside a dog asked the street a question nobody answered.';
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const clickText = (app, sel, text) => app.evalJs(`(() => { const b = [...document.querySelectorAll(${JSON.stringify(sel)})].find((x) => (x.textContent || '').trim().toLowerCase() === ${JSON.stringify(text.toLowerCase())}); if (b) b.click(); return !!b; })()`);
const say = (name, data) => console.log(`ARBOR-R16 ${name} ${JSON.stringify(data)}`);
const fail = (name, data) => { console.log(`ARBOR-R16-FAIL ${name} ${JSON.stringify(data)}`); throw new Error(`${name} FAILED ${JSON.stringify(data)}`.slice(0, 1200)); };
const FINISH = "(() => { document.getAnimations().forEach((a) => { try { a.finish(); } catch {} }); return true; })()";
const CORNER = { night: { letters: [0xEF, 0xE4, 0xCB], brass: [0xFF, 0x98, 0x00] }, day: { letters: [0xB7, 0xBC, 0x9A] } };

const load = async (app, hash) => {
  await app.evalJs(`history.replaceState(null, '', '/?arbor2=1' + ${JSON.stringify(hash)})`);
  await app.reload();
  await waitSoft(app, "document.documentElement.getAttribute('data-arbor2') === 'true'", { label: 'flag', timeout: 15000 });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 25000 });
};
const page = async (app, id, mode = 'Draft') => {
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: WORDS, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await sleep(300);
  await load(app, '#/page/' + id);
  await waitSoft(app, `!!document.querySelector('${ED}')`, { label: 'page' });
  await sleep(1000);
  if (mode) { await clickText(app, '.desk-mode-tab', mode); await sleep(1000); }
  await app.evalJs(`document.querySelector('${ED}')?.blur(); getSelection()?.removeAllRanges()`);
  await app.mouseMove(600, 300); await sleep(900);   // the chrome is up (the corner mark fades only while she writes)
};
const setRoom = async (app, room) => { await app.evalJs(`document.documentElement.setAttribute('data-room', ${JSON.stringify(room === 'day' ? 'light' : 'dark')})`); await sleep(700); };
const clock = (app, s) => app.evalJs(`typeof window.arbor2Clock === 'function' ? window.arbor2Clock(${JSON.stringify(s)}) : 'NO-SEAM'`);
// a visitor, for this screen only
const anon = async (app) => {
  await app.cdp('Fetch.enable', { patterns: [{ urlPattern: '*/auth/me*' }] });
  const off = app.tap((method, p) => {
    if (method !== 'Fetch.requestPaused') return;
    app.cdp('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: 401, responseHeaders: [{ name: 'content-type', value: 'application/json' }], body: Buffer.from('{"error":"unauthorized"}').toString('base64') }).catch(() => {});
  });
  return async () => { off(); await app.cdp('Fetch.disable').catch(() => {}); };
};

// ---- the corner mark: its rect, its two layers, and its colours from the pixels (each pixel un-blended from the ground at the mark's .7) ----
const MARK = `(() => { const m = document.querySelector('.brand-mark'); if (!m) return null; const r = m.getBoundingClientRect(), cs = getComputedStyle(m), b = getComputedStyle(m, '::before'), a = getComputedStyle(m, '::after');
  const bar = document.querySelector('.arbor2-bar')?.getBoundingClientRect();
  return { cls: m.className, rect: [Math.round(r.left * 10) / 10, Math.round(r.top * 10) / 10, Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10], opacity: Number(cs.opacity), mask: cs.webkitMaskImage || cs.maskImage,
    night: { img: b.backgroundImage, op: Number(b.opacity) }, day: { img: a.backgroundImage, op: Number(a.opacity) }, t: getComputedStyle(document.documentElement).getPropertyValue('--arbor2-t').trim(),
    bar: bar ? [Math.round(bar.left), Math.round(bar.top), Math.round(bar.width), Math.round(bar.height)] : null, room: document.documentElement.getAttribute('data-arbor2-room') }; })()`;
// reads the pixels of a rect from a full screenshot (decoded in the page); keeps them in window.__r16px[key] for a later comparison
const PIX = (b64, rect, key) => `(async () => {
  const img = new Image(); img.src = 'data:image/png;base64,${b64}'; await img.decode();
  const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(img, 0, 0);
  const k = img.width / innerWidth; const [x, y, w, h] = ${JSON.stringify(rect)}.map((v) => Math.round(v * k));
  const d = cx.getImageData(x, y, w, h).data; window.__r16px = window.__r16px || {}; window.__r16px[${JSON.stringify(key)}] = Array.from(d);
  // the ground: the most common colour on the rect's edge
  const cnt = new Map(); const edge = (i) => { const c = d[i] + ',' + d[i + 1] + ',' + d[i + 2]; cnt.set(c, (cnt.get(c) || 0) + 1); };
  for (let i = 0; i < w; i++) { edge(i * 4); edge(((h - 1) * w + i) * 4); } for (let j = 0; j < h; j++) { edge(j * w * 4); edge((j * w + w - 1) * 4); }
  const g = [...cnt.entries()].sort((a, b) => b[1] - a[1])[0][0].split(',').map(Number);
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  let lum = 0, inked = 0, brassPx = 0; const ink = new Map();
  for (let i = 0; i < d.length; i += 4) { const p = [d[i], d[i + 1], d[i + 2]]; lum += 0.2126 * lin(p[0]) + 0.7152 * lin(p[1]) + 0.0722 * lin(p[2]);
    if (Math.max(...p.map((v, c) => Math.abs(v - g[c]))) < 24) continue; inked++;
    const u = p.map((v, c) => Math.max(0, Math.min(255, Math.round((v - 0.3 * g[c]) / 0.7))));   // the ink at full strength (the mark is drawn at .7)
    const mx = Math.max(...u), mn = Math.min(...u); if (mx > 150 && (mx - mn) > 0.6 * mx && u[0] === mx) brassPx++;
    const q = u.map((v) => Math.round(v / 6) * 6).join(','); ink.set(q, (ink.get(q) || 0) + 1); }
  const top = [...ink.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([c, n]) => [c.split(',').map(Number), n]);
  return { ground: g, inked, brassPx, lum: Math.round(lum / (d.length / 4) * 10000) / 10000, top, w, h }; })()`;
const shot = async (app) => (await app.cdp('Page.captureScreenshot', { format: 'png' })).data;
const near = (a, b, tol) => a.every((v, i) => Math.abs(v - b[i]) <= tol);
// is a colour among the mark's inks (the most common un-blended colours, rounded to 6)
const has = (top, rgb, tol = 14) => top.some(([c, n]) => n >= 20 && near(c, rgb, tol));

export default {
  // ── 1. THE CORNER LOGO FOLLOWS THE ROOM: night = cream letters + brass o and dot; day = all sage; at the fade's middle, half and half.
  'r16-logo-rooms': async (app) => {
    await page(app, 'arbor-r16-logo');
    const rows = [];
    for (const room of ['night', 'day']) {
      await setRoom(app, room);
      const m = await app.evalJs(MARK); if (!m) fail('R16-LOGO-ROOMS', { mark: false, room });
      const px = await app.evalJs(PIX(await shot(app), m.rect, room));
      rows.push({ room, m, px });
    }
    await app.evalJs("document.documentElement.removeAttribute('data-room')");
    await clock(app, '07:00'); await sleep(400);
    const mid = await app.evalJs(MARK);
    await clock(app, '06:55'); await sleep(400); const early = await app.evalJs(MARK);
    const [n, d] = rows;
    const ok = {
      noMask: rows.every((r) => !/url\(/.test(r.m.mask || '')) && rows.every((r) => Math.abs(r.m.opacity - 0.7) < 0.01),
      nightLayers: /wrizo-logo-night\.png/.test(n.m.night.img) && n.m.night.op === 1 && n.m.day.op === 0,
      dayLayers: /wrizo-logo-sage-all\.png/.test(d.m.day.img) && d.m.day.op === 1 && d.m.night.op === 0,
      nightColours: has(n.px.top, CORNER.night.letters) && n.px.brassPx >= 40,
      dayColours: has(d.px.top, CORNER.day.letters) && d.px.brassPx === 0,
      fade: Math.abs(mid.night.op - 0.5) <= 0.02 && Math.abs(mid.day.op - 0.5) <= 0.02 && early.night.op > 0.5 && early.day.op < 0.5 && Math.abs(early.night.op + early.day.op - 1) < 0.01,
      sameRect: JSON.stringify(n.m.rect) === JSON.stringify(d.m.rect),
    };
    const brief = { ok, rect: n.m.rect, night: { layers: n.m.night, inks: n.px.top.slice(0, 3), brassPx: n.px.brassPx, ground: n.px.ground }, day: { inks: d.px.top.slice(0, 3), brassPx: d.px.brassPx, ground: d.px.ground },
      mid: [mid.night.op, mid.day.op, mid.t], early: [early.night.op, early.day.op, early.t] };
    if (Object.values(ok).some((x) => !x)) fail('R16-LOGO-ROOMS', brief);
    say('r16-logo-rooms', brief);
  },

  // ── 2. THE FRONT DOOR'S LOGO: in the app's own corner rect at .7, both rooms, the night copy (its ground is the splash's dark), the dev panel
  // out of that corner
  'r16-logo-front': async (app) => {
    await page(app, 'arbor-r16-front-ref');
    const appRect = (await app.evalJs(MARK))?.rect;
    const done = await anon(app);
    try {
      const rows = [];
      for (const room of ['night', 'day']) {
        await load(app, '#/'); await setRoom(app, room); await sleep(500);
        const m = await app.evalJs(MARK);
        const px = m ? await app.evalJs(PIX(await shot(app), m.rect, 'front-' + room)) : null;
        rows.push({ room, m, px, front: await app.evalJs("!!document.querySelector('.arbor2-front')") });
      }
      const clear = (m) => !m.bar || m.bar[0] + m.bar[2] <= m.rect[0] || m.bar[0] >= m.rect[0] + m.rect[2] || m.bar[1] + m.bar[3] <= m.rect[1] || m.bar[1] >= m.rect[1] + m.rect[3];
      const okRow = (r) => !!r.m && r.front && /arbor2-logo-corner/.test(r.m.cls) && JSON.stringify(r.m.rect) === JSON.stringify(appRect) && Math.abs(r.m.opacity - 0.7) < 0.01
        && r.m.night.op === 1 && r.m.day.op === 0 && has(r.px.top, CORNER.night.letters) && r.px.brassPx >= 40 && clear(r.m);
      const ok = { both: rows.every(okRow) };
      const brief = { ok, appRect, rows: rows.map((r) => ({ room: r.room, ok: okRow(r), rect: r.m?.rect, bar: r.m?.bar, op: r.m?.opacity, layers: r.m && [r.m.night.op, r.m.day.op], inks: r.px?.top.slice(0, 3), brassPx: r.px?.brassPx })) };
      if (Object.values(ok).some((x) => !x)) fail('R16-LOGO-FRONT', brief);
      say('r16-logo-front', brief);
    } finally { await done(); }
  },

  // ── 3. THE LOGO WRITTEN OUT ON THE SPLASH: in the corner rect; mask/opacity only; the letters in writing order, the brass o and dot last; ~2 s;
  // nothing flashes (the mark's luminance only rises, step by step); its last frame = the still logo on the front door, pixel for pixel.
  'r16-splash-write': async (app) => {
    const done = await anon(app);
    try {
      await load(app, '#/');
      const appRect = (await app.evalJs(MARK))?.rect;
      await app.evalJs("localStorage.setItem('wrizo-splash-hold', '9000'); localStorage.setItem('wrizo-splash-force-not-ready', '1')");   // the harness's own hold override and the splash's own test seam (ready reads false: the splash holds to its 10 s ceiling; driver fix after run 41550544353)
      await app.evalJs("history.replaceState(null, '', '/?arbor2=1#/')"); await app.reload();
      const there = await waitSoft(app, "!!document.querySelector('.wz-splash .arbor2-splash-logo')", { label: 'the splash logo', timeout: 8000 });
      if (!there) fail('R16-SPLASH-WRITE', { splashLogo: false });
      // the plan, from the animations themselves: what animates, and when each stroke starts and ends
      const plan = await app.evalJs(`(() => { const L = document.querySelector('.wz-splash .arbor2-splash-logo'); const r = L.getBoundingClientRect();
        const anims = document.getAnimations().filter((a) => L.contains(a.effect?.target) || a.effect?.target === L);
        anims.forEach((a) => a.pause());
        const kf = (a) => [...new Set(a.effect.getKeyframes().flatMap((f) => Object.keys(f).filter((k) => !['offset', 'computedOffset', 'easing', 'composite'].includes(k))))];
        return { rect: [Math.round(r.left * 10) / 10, Math.round(r.top * 10) / 10, Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10],
          anims: anims.map((a) => ({ name: a.animationName, stroke: a.effect.target.getAttribute?.('data-stroke') || null, layer: a.effect.target.closest?.('mask')?.id || null, props: kf(a),
            start: Number(a.effect.getTiming().delay) / 1000, end: (Number(a.effect.getTiming().delay) + Number(a.effect.getTiming().duration)) / 1000 })) }; })()`);
      // step through the writing: every 0.25 s, the rect's pixels
      const steps = [];
      for (const T of [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 1.95, 2.05]) {
        await app.evalJs(`(() => { const L = document.querySelector('.wz-splash .arbor2-splash-logo'); document.getAnimations().filter((a) => L.contains(a.effect?.target) || a.effect?.target === L).forEach((a) => { a.pause(); a.currentTime = ${T * 1000}; }); return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true)))); })()`);
        const px = await app.evalJs(PIX(await shot(app), plan.rect, 'splash-' + T));
        steps.push({ T, lum: px.lum, inked: px.inked, brassPx: px.brassPx });
      }
      // the last frame, kept: then the splash ends and the front door's still logo is read in the same rect
      await app.evalJs("(() => { const L = document.querySelector('.wz-splash .arbor2-splash-logo'); document.getAnimations().filter((a) => L.contains(a.effect?.target) || a.effect?.target === L).forEach((a) => a.finish()); return true; })()");
      await sleep(200);
      // (report only, after green look 41548909263: what is showing at the last frame)
      const endState = await app.evalJs("(() => { const L = document.querySelector('.wz-splash .arbor2-splash-logo'); const svg = L.querySelector('svg'); return { writing: L.getAttribute('data-writing'), before: getComputedStyle(L, '::before').opacity, beforeImg: getComputedStyle(L, '::before').backgroundImage.slice(-40), svg: svg ? getComputedStyle(svg).opacity : null, op: getComputedStyle(L).opacity, anims: document.getAnimations().filter((a) => L.contains(a.effect?.target) || a.effect?.target === L).map((a) => [a.animationName, a.playState, a.effect.pseudoElement || '']).slice(0, 12) }; })()");
      await app.evalJs(PIX(await shot(app), plan.rect, 'splash-last'));
      await app.evalJs("localStorage.setItem('wrizo-splash-hold', '50'); localStorage.removeItem('wrizo-splash-force-not-ready')");
      await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
      await sleep(600);
      const still = await app.evalJs(PIX(await shot(app), plan.rect, 'front-still'));
      const diff = await app.evalJs("(() => { const a = window.__r16px['splash-last'], b = window.__r16px['front-still']; if (!a || !b || a.length !== b.length) return { n: -1 }; let n = 0, max = 0; for (let i = 0; i < a.length; i++) { if (i % 4 === 3) continue; const d = Math.abs(a[i] - b[i]); if (d > 0) n++; if (d > max) max = d; } return { n, max, of: a.length / 4 * 3 }; })()");
      const letters = plan.anims.filter((a) => /letters/.test(a.layer || '')), brass = plan.anims.filter((a) => /brass/.test(a.layer || ''));
      const lastLetter = Math.max(...letters.map((a) => a.end)), firstBrass = Math.min(...brass.map((a) => a.start));
      const order = ['w', 'r', 'i', 'z', 'loop'].map((id) => letters.find((a) => a.stroke === id)?.start);
      const lumSteps = steps.map((s) => s.lum);
      const ok = {
        inCorner: JSON.stringify(plan.rect) === JSON.stringify(appRect),
        maskOnly: plan.anims.length > 0 && plan.anims.every((a) => a.props.every((p) => ['strokeDashoffset', 'opacity'].includes(p))) && plan.anims.every((a) => a.stroke ? !!a.layer : true),
        writingOrder: order.every((v, i) => typeof v === 'number' && (i === 0 || v >= order[i - 1])),
        brassLast: brass.length >= 2 && firstBrass >= lastLetter - 1e-6 && brass.some((a) => a.stroke === 'dot' && a.end === Math.max(...brass.map((b) => b.end))),
        twoSeconds: Math.max(...plan.anims.map((a) => a.end)) <= 2.1 && Math.max(...plan.anims.map((a) => a.end)) >= 1.8,
        noBrassEarly: steps.filter((s) => s.T < firstBrass).every((s) => s.brassPx === 0) && steps.some((s) => s.brassPx > 0),
        noFlash: lumSteps.every((v, i) => i === 0 || v >= lumSteps[i - 1] - 0.0005),
        lastIsStill: diff.n === 0,
      };
      const brief = { ok, rect: plan.rect, appRect, order, lastLetter, firstBrass, end: Math.max(...plan.anims.map((a) => a.end)), props: [...new Set(plan.anims.flatMap((a) => a.props))], steps, diff, stillInked: still.inked, endState };
      if (Object.values(ok).some((x) => !x)) fail('R16-SPLASH-WRITE', brief);
      say('r16-splash-write', brief);
    } finally { await app.evalJs("localStorage.setItem('wrizo-splash-hold', '50'); localStorage.removeItem('wrizo-splash-force-not-ready')").catch(() => {}); await done(); }
  },

  // ── 4. REDUCED MOTION: the splash shows the finished logo at once, still (nothing animates in it), and it is the front door's logo exactly
  'r16-splash-reduced': async (app) => {
    const done = await anon(app);
    try {
      await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
      await app.evalJs("localStorage.setItem('wrizo-splash-hold', '6000'); localStorage.setItem('wrizo-splash-force-not-ready', '1')");   // (driver fix after run 41550544353: under reduced motion the splash ends as soon as the app is ready - the seam holds it to its ceiling)
      await app.evalJs("history.replaceState(null, '', '/?arbor2=1#/')"); await app.reload();
      const seen = await waitSoft(app, "!!document.querySelector('.wz-splash .arbor2-splash-logo')", { label: 'the splash logo', timeout: 8000 });
      // (driver fix after run 41549881533: probe before reading - a missing logo is a failed check with its numbers, never a crash)
      const probe = await app.evalJs("({ splash: !!document.querySelector('.wz-splash'), logo: !!document.querySelector('.wz-splash .arbor2-splash-logo'), hold: localStorage.getItem('wrizo-splash-hold'), reduced: matchMedia('(prefers-reduced-motion: reduce)').matches, theme: document.documentElement.getAttribute('data-theme'), flag: document.documentElement.getAttribute('data-arbor2') })");
      if (!seen || !probe.logo) fail('R16-SPLASH-REDUCED', { seen, probe });
      const s = await app.evalJs("(() => { const L = document.querySelector('.wz-splash .arbor2-splash-logo'); const r = L.getBoundingClientRect(); return { writing: L.getAttribute('data-writing'), svg: !!L.querySelector('svg'), anims: document.getAnimations().filter((a) => (L.contains(a.effect?.target) || a.effect?.target === L) && a.animationName).length, transitions: document.getAnimations().filter((a) => (L.contains(a.effect?.target) || a.effect?.target === L) && !a.animationName).map((a) => [a.transitionProperty, Number(a.effect.getTiming().duration)]), rect: [Math.round(r.left * 10) / 10, Math.round(r.top * 10) / 10, Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10] }; })()");
      await app.evalJs(PIX(await shot(app), s.rect, 'reduced-splash'));
      await app.evalJs("localStorage.setItem('wrizo-splash-hold', '50'); localStorage.removeItem('wrizo-splash-force-not-ready')");
      await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); await sleep(600);
      await app.evalJs(PIX(await shot(app), s.rect, 'reduced-front'));
      const diff = await app.evalJs("(() => { const a = window.__r16px['reduced-splash'], b = window.__r16px['reduced-front']; if (!a || !b || a.length !== b.length) return { n: -1 }; let n = 0; for (let i = 0; i < a.length; i++) if (i % 4 !== 3 && a[i] !== b[i]) n++; return { n }; })()");
      // (instrument fix after run 41550544353: 'anims' counts the writing's own CSS animations; a transition is reported, not counted - under
      // reduced motion the app's floor makes the mark's opacity transition a 0.01 ms cut, and one was caught)
      const ok = { still: s.writing === 'still' && !s.svg && s.anims === 0, sameAsFront: diff.n === 0 };
      if (Object.values(ok).some((x) => !x)) fail('R16-SPLASH-REDUCED', { ok, s, diff });
      say('r16-splash-reduced', { ok, s, diff });
    } finally { await app.emulateMedia([]); await app.evalJs("localStorage.setItem('wrizo-splash-hold', '50'); localStorage.removeItem('wrizo-splash-force-not-ready')").catch(() => {}); await done(); }
  },

  // ── 5. THE TAGLINE AND THE DOOR WORDS: "For humans who write." exactly; tagline, Write and Sign in in Alegreya Sans (loaded), each >= 4.5:1
  'r16-tagline': async (app) => {
    const done = await anon(app);
    try {
      await load(app, '#/'); await sleep(400);
      const s = await app.evalJs(`(() => { const t = document.querySelector('.arbor2-front .wz-tagline'); const doors = [...document.querySelectorAll('.arbor2-front .wz-arrival-doors button')];
        const face = (e) => getComputedStyle(e).fontFamily; return { text: t?.textContent ?? null, faces: [t, ...doors].filter(Boolean).map((e) => [e.textContent.trim(), face(e)]), loaded: document.fonts.check('16px "Alegreya Sans"') }; })()`);
      const ok = { words: s.text === 'For humans who write.', face: s.faces.length === 3 && s.faces.every(([, f]) => /^"?Alegreya Sans"?/.test(f)), loaded: s.loaded };
      if (Object.values(ok).some((x) => !x)) fail('R16-TAGLINE', { ok, s });
      say('r16-tagline', { ok, s });
    } finally { await done(); }
  },

  // ── 6. A "?" IS GUIDANCE: every "?" in the drawers is the help green - at rest and open - never brass; one per row: the Ask box's own on the
  // Send row's middle, the Grafts cloth's on the Grafts cloth; none stacked on another
  'r16-help': async (app) => {
    await page(app, 'arbor-r16-help');
    await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await sleep(250); await app.evalJs("document.querySelector('.wz-tutor-grip')?.click()");
    await app.evalJs(FINISH); await sleep(600); await app.evalJs(FINISH);
    const READ = `(() => { const help = (() => { const p = document.createElement('div'); p.style.cssText = 'position:fixed;left:-9px;top:-9px;width:1px;height:1px;color:var(--help)'; document.querySelector('.wz-tutor-panel').appendChild(p); const c = getComputedStyle(p).color; p.remove(); return c; })();
      const qs = [...document.querySelectorAll('.wz-tutor-panel button, .wz-sliver-panel button')].filter((b) => b.textContent.trim() === '?' && b.getBoundingClientRect().width > 0);
      const R = (e) => { const r = e.getBoundingClientRect(); return { t: r.top, b: r.bottom, cy: (r.top + r.bottom) / 2, l: r.left, r: r.right }; };
      const row = document.querySelector('.wz-tutor-convo-row'); const grafts = [...document.querySelectorAll('.wz-tutor-panel .wz-drawer-tab')].find((t) => /grafts/i.test(t.textContent));
      return { help, marks: qs.map((b) => ({ cls: b.className, label: b.getAttribute('aria-label'), color: getComputedStyle(b).color, border: getComputedStyle(b).borderTopColor, ...R(b), inRow: !!b.closest('.wz-tutor-convo-row'), note: !!b.closest('.wz-drawer-tabnotes') })),
        row: row ? R(row) : null, grafts: grafts ? R(grafts) : null }; })()`;
    const rest = await app.evalJs(READ);
    // open the Ask box's own note: it stays green
    await app.evalJs("document.querySelector('.wz-tutor-convo-row .wz-drawer-note-btn')?.click()"); await sleep(250);
    const opened = await app.evalJs(READ);
    await app.evalJs("document.querySelector('.wz-tutor-convo-row .wz-drawer-note-btn')?.click()");
    const brass = (c) => /255,\s*152,\s*0/.test(c);
    const ask = rest.marks.find((m) => m.inRow), note = rest.marks.find((m) => m.note);
    const pairs = rest.marks.flatMap((a, i) => rest.marks.slice(i + 1).map((b) => ({ dy: Math.abs(a.cy - b.cy), dx: Math.abs((a.l + a.r) / 2 - (b.l + b.r) / 2) })));
    const ok = {
      green: rest.marks.length >= 2 && rest.marks.every((m) => m.color === rest.help && !brass(m.color) && !brass(m.border)),
      greenOpen: opened.marks.every((m) => !brass(m.color) && !brass(m.border) && m.color === opened.help),
      askOnRow: !!ask && !!rest.row && Math.abs(ask.cy - rest.row.cy) <= 2,
      noteOnCloth: !!note && !!rest.grafts && note.cy >= rest.grafts.t && note.cy <= rest.grafts.b,
      notStacked: pairs.every((p) => p.dy >= 20 || p.dx >= 40),
    };
    const brief = { ok, help: rest.help, marks: rest.marks.map((m) => [m.cls, m.label, m.color, Math.round(m.cy), Math.round(m.l)]), row: rest.row && Math.round(rest.row.cy), grafts: rest.grafts && [Math.round(rest.grafts.t), Math.round(rest.grafts.b)] };
    if (Object.values(ok).some((x) => !x)) fail('R16-HELP', brief);
    say('r16-help', brief);
  },

  // ── 7. THE TOOLS FOOTER: the "..." button is whole, inside the drawer's own padding (not cut by the panel's edge line)
  'r16-footer': async (app) => {
    await page(app, 'arbor-r16-footer');
    await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await app.evalJs(FINISH); await sleep(600); await app.evalJs(FINISH);
    const s = await app.evalJs("(() => { const b = document.querySelector('.wz-sliver-instruments-btn'), sl = document.querySelector('.wz-sliver-panel > .wz-drawer-slide'); if (!b || !sl) return null; const r = b.getBoundingClientRect(), q = sl.getBoundingClientRect(); return { btn: [r.left, r.right], slide: [q.left, q.right], text: b.textContent.trim() || b.getAttribute('aria-label') }; })()");
    const ok = { found: !!s, inside: !!s && s.btn[0] >= s.slide[0] + 8 && s.btn[1] <= s.slide[1] };
    if (Object.values(ok).some((x) => !x)) fail('R16-FOOTER', { ok, s });
    say('r16-footer', { ok, s });
  },

  // ── 8. THE FORMS' QUIET TEXT >= 4.5:1: on the sign-in and the sign-up screens, every word against the pixels behind it (the glow included),
  // and the fields' placeholders against the field's own ground
  'r16-forms': async (app) => {
    const done = await anon(app);
    try {
      await load(app, '#/'); await sleep(300);
      const rows = [];
      for (const step of ['signin', 'account']) {
        if (step === 'signin') await clickText(app, 'button', 'Sign in'); else await clickText(app, 'button', 'New here? Create an account');
        await waitSoft(app, step === 'signin' ? "!!document.querySelector('input[autocomplete=\"current-password\"]')" : "!!document.querySelector('input[autocomplete=\"new-password\"]')", { label: step, timeout: 5000 });
        await sleep(500);
        rows.push({ step, px: await pixelsOf(app, '.wz-screen'), ph: await app.evalJs(PLACEHOLDERS) });
      }
      const low = rows.flatMap((r) => r.px.filter((x) => x.p2 == null || x.p2 < 4.5).map((x) => ({ step: r.step, ...x })));
      const lowPh = rows.flatMap((r) => r.ph.filter((x) => x.ratio < 4.5).map((x) => ({ step: r.step, ...x })));
      const ok = { measured: rows.every((r) => r.px.length >= 3), words: low.length === 0, placeholders: rows.every((r) => r.ph.length >= 2) && lowPh.length === 0 };
      const brief = { ok, rows: rows.map((r) => ({ step: r.step, lowest: r.px.filter((x) => x.p2 != null).sort((a, b) => a.p2 - b.p2).slice(0, 4), ph: r.ph })), low, lowPh };
      if (Object.values(ok).some((x) => !x)) fail('R16-FORMS', brief);
      say('r16-forms', brief);
    } finally { await done(); }
  },

  // ── PICTURES for the Wrizors: the front door in both rooms (the mark, the tagline); the right drawer's "?" row; the app's corner by day and night
  'r16-pic-front-night': async (app) => { const done = await anon(app); try { await load(app, '#/'); await setRoom(app, 'night'); await app.evalJs("(() => { const s = document.createElement('style'); s.textContent = '.arbor2-bar{ visibility:hidden !important; }'; document.head.appendChild(s); })()"); } finally { await done(); } },
  'r16-pic-front-day': async (app) => { const done = await anon(app); try { await load(app, '#/'); await setRoom(app, 'day'); await app.evalJs("(() => { const s = document.createElement('style'); s.textContent = '.arbor2-bar{ visibility:hidden !important; }'; document.head.appendChild(s); })()"); } finally { await done(); } },
  'r16-pic-help': async (app) => { await page(app, 'arbor-r16-pic-help'); await app.evalJs("document.querySelector('.wz-tutor-grip')?.click()"); await app.evalJs(FINISH); await sleep(700); await app.evalJs("(() => { const s = document.createElement('style'); s.textContent = '.arbor2-bar{ visibility:hidden !important; }'; document.head.appendChild(s); })()"); },
  'r16-pic-corner-day': async (app) => { await page(app, 'arbor-r16-pic-c'); await setRoom(app, 'day'); },
  'r16-pic-corner-night': async (app) => { await page(app, 'arbor-r16-pic-c'); await setRoom(app, 'night'); },
  // THE RECORDING, frame by frame: the splash stopped at each 0.2 s of the writing (the lane stitches these into a short animated PNG)
  ...Object.fromEntries([0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.1].map((T) => [`r16-rec-${String(Math.round(T * 100)).padStart(3, '0')}`, async (app) => {
    const done = await anon(app);
    try {
      await load(app, '#/');
      await app.evalJs("localStorage.setItem('wrizo-splash-hold', '9000'); localStorage.setItem('wrizo-splash-force-not-ready', '1')");
      await app.evalJs("history.replaceState(null, '', '/?arbor2=1#/')"); await app.reload();
      await waitSoft(app, "!!document.querySelector('.wz-splash .arbor2-splash-logo')", { label: 'the splash logo', timeout: 8000 });
      await app.evalJs(`(() => { const L = document.querySelector('.wz-splash .arbor2-splash-logo'); document.getAnimations().filter((a) => L.contains(a.effect?.target) || a.effect?.target === L).forEach((a) => { a.pause(); a.currentTime = ${T * 1000}; }); return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true)))); })()`);
      // the job refuses a frame while an element of class wz-splash is on screen (its guard against photographing the opening by mistake); this
      // frame IS the splash on purpose, so the overlay keeps its look under its own inline layout and colours (pinned first: the splash keeps the
      // night values in the day room through a rule on its class - the first recording, run 41558621656, lost them) and gives up only the class
      await app.evalJs("(() => { const s = document.querySelector('.wz-splash'); if (!s) return false; const cs = getComputedStyle(s); for (const v of ['--ink-950', '--ink-900', '--ink-800', '--ink-border', '--ink-border-strong', '--arbor-line', '--arbor-letter', '--text-hi', '--text-mid', '--text-low']) s.style.setProperty(v, cs.getPropertyValue(v)); s.style.cssText += ';position:fixed;inset:0;z-index:400;pointer-events:none;display:flex;align-items:center;justify-content:center;'; s.classList.remove('wz-splash'); s.classList.add('arbor2-rec-splash'); return true; })()");
      await sleep(200);
    } finally { await app.evalJs("localStorage.setItem('wrizo-splash-hold', '50'); localStorage.removeItem('wrizo-splash-force-not-ready')").catch(() => {}); await done(); }
  }])),
};

// ---- the words of a surface against the pixels behind them (the r14 instrument; a word off the window fails) ----
const COLLECT = (sel) => `(() => {
  const parse = (s) => { const m = String(s).match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const p = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const runs = [];
  for (const root of document.querySelectorAll(${JSON.stringify(sel)})) { const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = tw.nextNode(); n; n = tw.nextNode()) { if (!n.textContent.trim()) continue; const el = n.parentElement; let op = 1, hidden = false;
      for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') { hidden = true; break; } op *= Number(cs.opacity); }
      const c = parse(getComputedStyle(el).color); if (hidden || !c || c.a * op < 0.05) continue; const rg = document.createRange(); rg.selectNodeContents(n);
      const rects = [...rg.getClientRects()].filter((x) => x.width >= 2 && x.height >= 4).map((x) => [x.left, x.top, x.right, x.bottom]);
      const out = rects.some(([x0, y0, x1, y1]) => x0 < 0 || y0 < 0 || x1 > innerWidth || y1 > innerHeight);
      if (rects.length) runs.push({ text: n.textContent.trim().slice(0, 30), fg: [c.r, c.g, c.b, c.a * op], rects, out, disabled: !!el.closest(':disabled') }); } }
  window.__r16runs = runs; return runs.length; })()`;
const HIDE = "(() => { const s = document.createElement('style'); s.id = 'r16-hide'; s.textContent = '*, *::before, *::after{ color:transparent !important; -webkit-text-fill-color:transparent !important; text-shadow:none !important; caret-color:transparent !important; } ::placeholder{ color:transparent !important; }'; document.head.appendChild(s); return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true)))); })()";
const SHOW = "(() => { document.getElementById('r16-hide')?.remove(); return true; })()";
const MEASURE = (b64) => `(async () => {
  const img = new Image(); img.src = 'data:image/png;base64,${b64}'; await img.decode();
  const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(img, 0, 0);
  const k = img.width / innerWidth; const data = cx.getImageData(0, 0, img.width, img.height).data;
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const L = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return window.__r16runs.filter((r) => !r.disabled).map((run) => { const [fr, fg, fb, fa] = run.fg; const ratios = [];
    if (run.out) return { text: run.text, p2: null, out: true };
    for (const [x0, y0, x1, y1] of run.rects) { const sx = Math.max(1, (x1 - x0) / 24), sy = Math.max(1, (y1 - y0) / 8);
      for (let y = y0; y < y1; y += sy) for (let x = x0; x < x1; x += sx) { const i = (Math.floor(y * k) * img.width + Math.floor(x * k)) * 4; const r = data[i], g = data[i + 1], b = data[i + 2];
        const lb = L(r, g, b), lf = L(fr * fa + r * (1 - fa), fg * fa + g * (1 - fa), fb * fa + b * (1 - fa)); ratios.push((Math.max(lb, lf) + 0.05) / (Math.min(lb, lf) + 0.05)); } }
    if (ratios.some((v) => !Number.isFinite(v))) return { text: run.text, p2: null, out: true };
    ratios.sort((a, b) => a - b); return { text: run.text, p2: ratios.length ? Math.round(ratios[Math.floor(ratios.length * 0.02)] * 100) / 100 : null }; }); })()`;
const pixelsOf = async (app, sel) => { await app.evalJs(COLLECT(sel)); await app.evalJs(HIDE); const b64 = (await app.cdp('Page.captureScreenshot', { format: 'png' })).data; await app.evalJs(SHOW); return app.evalJs(MEASURE(b64)); };
// a placeholder against its field's own ground (a solid colour: the field paints it)
const PLACEHOLDERS = `(() => { const parse = (s) => (String(s).match(/[\\d.]+/g) || []).map(Number); const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const L = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  return [...document.querySelectorAll('.wz-screen input.wz-field')].filter((i) => i.getBoundingClientRect().width > 0).map((i) => { const ph = parse(getComputedStyle(i, '::placeholder').color), bg = parse(getComputedStyle(i).backgroundColor);
    const a = ph.length > 3 ? ph[3] : 1; const fg = [0, 1, 2].map((k) => ph[k] * a + bg[k] * (1 - a)); const x = L(fg), y = L(bg);
    return { placeholder: i.placeholder, ratio: Math.round((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) * 100) / 100 }; }); })()`;
