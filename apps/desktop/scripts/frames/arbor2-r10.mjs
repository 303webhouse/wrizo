// ARBOR v2 MOCKUP, ROUND r10 - THE FADE, PROVEN AT EVERY MOMENT. Named screens for INK's frames job (-f screens_file=apps/desktop/scripts/frames/
// arbor2-r10.mjs). Sources: Fable, Nov 1 ("the floors hold at EVERY moment ... sweep every text that sits on the bare room across the whole
// fade. Fix the proof: measure each text against the actual ground behind it, step by step"; "measure every text on the bare room at least every
// 5% across the whole fade (not only at the five stops; the last miss was mid-step)") and the Wrizors' note (Downloads/wrizors-to-ARBOR-nov1b.md,
// md5 9272a1ff: the count's plate, the warm 50% stop #D9C3A2, the lamp -> sun handoff "never both at half", "Room ▸ By the clock · Day · Night"
// and a "?" saying "By the clock: day 07:00–19:00").
// THE INSTRUMENT (replacing r9's, which read the count row against the PAGE's paper - an ancestor's colour - and so never saw the dip): every
// visible text run is read against the PIXELS ACTUALLY BEHIND IT. The text is made transparent for one frame, the window is captured
// (Page.captureScreenshot), the picture is decoded in the page (an <img> on a canvas), and inside each run's own line boxes (Range rects) every
// sampled pixel is compared with the run's colour (its alpha and its ancestors' opacity composited over that pixel). A run's figure is its 2nd
// percentile (the worst 2% of its ground; one stray antialiased pixel cannot pass or fail it); its minimum is reported beside it.
// COVERAGE IS MEASURED, NOT ASSUMED: the clock steps every 30 s and the dayness actually read back between consecutive samples must never jump
// more than 0.05; the second either side of the room's switch is sampled too. A run is "on the bare room" when its ground moved across the fade
// (its median ground luminance at the two ends differs by > 0.2); the bare-room set is printed with every member, and must include the count.
// Every screen THROWS with its numbers when its check fails ("ARBOR-R10-FAIL ..."). Written red-first: run against r9 (221eb89f) before r10.
// Seeds go through the app's seams (window.wrizo*). No imports.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const WORDS = 'The morning light came in low across the table, and she began to write. The kettle ticked as it cooled, and outside a dog asked the street a question nobody answered.';
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const clickSel = (app, sel) => app.evalJs(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (b) b.click(); return !!b; })()`);
const clickText = (app, sel, text) => app.evalJs(`(() => { const b = [...document.querySelectorAll(${JSON.stringify(sel)})].find((x) => (x.textContent || '').trim().toLowerCase() === ${JSON.stringify(text.toLowerCase())}); if (b) b.click(); return !!b; })()`);
const say = (name, data) => console.log(`ARBOR-R10 ${name} ${JSON.stringify(data)}`);
const fail = (name, data) => { console.log(`ARBOR-R10-FAIL ${name} ${JSON.stringify(data)}`); throw new Error(`${name} FAILED ${JSON.stringify(data)}`.slice(0, 1200)); };
const load = async (app, hash) => {
  await app.evalJs(`history.replaceState(null, '', '/?arbor2=1' + ${JSON.stringify(hash)})`);
  await app.reload();
  await waitSoft(app, "document.documentElement.getAttribute('data-arbor2') === 'true'", { label: 'flag', timeout: 15000 });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 });
};
const page = async (app, id) => {
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: WORDS, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await sleep(300);
  await load(app, '#/page/' + id);
  await waitSoft(app, `!!document.querySelector('${ED}')`, { label: 'page' });
  await sleep(1400);
};
const clock = (app, s) => app.evalJs(`typeof window.arbor2Clock === 'function' ? window.arbor2Clock(${JSON.stringify(s)}) : 'NO-SEAM'`);
const hms = (sec) => { const s = ((Math.round(sec) % 86400) + 86400) % 86400; return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map((v) => String(v).padStart(2, '0')).join(':'); };
const STATE = `(() => { const r = document.documentElement, cs = getComputedStyle(r); return { t: Number(r.getAttribute('data-arbor2-dayness')), room: r.getAttribute('data-arbor2-room'), g: cs.getPropertyValue('--ink-950').trim().toUpperCase() }; })()`;
// everything lit (the chrome's rest dim and its transitions off), the caret and the selection away: the sweep reads every label at full strength
const lit = (app) => app.evalJs(`(() => { if (!document.getElementById('arbor2-r10-lit')) { const s = document.createElement('style'); s.id = 'arbor2-r10-lit'; s.textContent = '*{ --arbor2-dim:1 !important; transition:none !important; animation-play-state:paused !important; }'; document.head.appendChild(s); }
  document.documentElement.setAttribute('data-arbor2-lit', ''); document.querySelector('${ED}')?.blur(); getSelection()?.removeAllRanges(); })()`);

// ---- THE SWEEP: one moment, every visible text run against the pixels behind it ----
const COLLECT = `(() => {
  const parse = (s) => { const m = String(s).match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const p = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const runs = []; const W = innerWidth, H = innerHeight;
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = tw.nextNode(); n; n = tw.nextNode()) {
    if (!n.textContent.trim()) continue;
    const el = n.parentElement; if (!el || el.closest('script, style, noscript, #arbor2-r10-lit')) continue;
    let op = 1, hidden = false;
    for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') { hidden = true; break; } op *= Number(cs.opacity); }
    if (hidden || op < 0.05) continue;
    const c = parse(getComputedStyle(el).color); if (!c || c.a * op < 0.05) continue;   // (r10 fix after the red leg: ink with no alpha draws nothing)
    const rg = document.createRange(); rg.selectNodeContents(n);
    const rects = [...rg.getClientRects()].filter((r) => r.width >= 2 && r.height >= 4 && r.right > 0 && r.bottom > 0 && r.left < W && r.top < H).slice(0, 6)
      .map((r) => [Math.max(0, r.left), Math.max(0, r.top), Math.min(W, r.right), Math.min(H, r.bottom)]);
    if (!rects.length) continue;
    const where = el.closest('.chrome-top.sprint-nav') ? 'bar' : el.closest('.desk-frame-strip, .desk-rail') ? 'rail' : el.closest('.arbor2-bar') ? 'mockup' : el.closest('.wz-sliver, .wz-tutor') ? 'drawer' : el.closest('${ED}') ? 'prose' : el.closest('.mode-page') ? 'page' : 'room';
    // (r10 fix after the red leg: the drawer openers' arrows are GRAPHICS - r5's table measures them at the 3:1 floor - not labels)
    const floor = /^[‹›]$/.test(n.textContent.trim()) && el.closest('.wz-sliver-grip, .wz-tutor-grip') ? 3 : 4.5;
    runs.push({ text: n.textContent.trim().slice(0, 24), where, floor, fg: [c.r, c.g, c.b, c.a * op], rects, key: where + '|' + n.textContent.trim().slice(0, 24) + '|' + Math.round(rects[0][0]) + ',' + Math.round(rects[0][1]) });
  }
  window.__r10runs = runs; return runs.length; })()`;
const HIDE = `(() => { const s = document.createElement('style'); s.id = 'arbor2-r10-hide'; s.textContent = '*, *::before, *::after{ color:transparent !important; -webkit-text-fill-color:transparent !important; text-shadow:none !important; caret-color:transparent !important; text-decoration-color:transparent !important; }'; document.head.appendChild(s); return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true)))); })()`;
const SHOW = `(() => { document.getElementById('arbor2-r10-hide')?.remove(); return true; })()`;
const MEASURE = (b64) => `(async () => {
  const img = new Image(); img.src = 'data:image/png;base64,${b64}'; await img.decode();
  const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(img, 0, 0);
  const k = img.width / innerWidth; const data = cx.getImageData(0, 0, img.width, img.height).data;
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const L = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return window.__r10runs.map((run) => {
    const [fr, fg, fb, fa] = run.fg; const ratios = [], gl = [];
    for (const [x0, y0, x1, y1] of run.rects) {
      const sx = Math.max(1, Math.floor((x1 - x0) * k / 24)), sy = Math.max(1, Math.floor((y1 - y0) * k / 8));
      for (let y = Math.floor(y0 * k); y < Math.floor(y1 * k); y += sy) for (let x = Math.floor(x0 * k); x < Math.floor(x1 * k); x += sx) {
        const i = (y * img.width + x) * 4; const r = data[i], g = data[i + 1], b = data[i + 2];
        const lb = L(r, g, b), lf = L(fr * fa + r * (1 - fa), fg * fa + g * (1 - fa), fb * fa + b * (1 - fa));
        ratios.push((Math.max(lb, lf) + 0.05) / (Math.min(lb, lf) + 0.05)); gl.push(lb);
      }
    }
    ratios.sort((a, b) => a - b); gl.sort((a, b) => a - b);
    const q = (arr, p) => arr.length ? arr[Math.min(arr.length - 1, Math.floor(arr.length * p))] : null;
    return { key: run.key, text: run.text, where: run.where, floor: run.floor, p2: Math.round(q(ratios, 0.02) * 100) / 100, min: Math.round((ratios[0] ?? 0) * 100) / 100, gmed: Math.round(q(gl, 0.5) * 1000) / 1000, n: ratios.length };
  }); })()`;
const sweep = async (app) => {
  await app.evalJs(COLLECT);
  await app.evalJs(HIDE);
  const shot = (await app.cdp('Page.captureScreenshot', { format: 'png' })).data;
  await app.evalJs(SHOW);
  return app.evalJs(MEASURE(shot));
};

// (instrument fix for the successors, r11, after the plate's picture run 41336482332: at 1366 the mockup's own control panel (.arbor2-bar,
// bottom right; it never ships) lies over the count row's right end, and a run under it is not seen by the writer but was read against the
// panel. COLLECT2 is COLLECT skipping runs that the panel covers; the panel's own texts are still read. sweep2 / sweepFade2 use it.)
const COLLECT2 = COLLECT.replace('if (!rects.length) continue;', "if (!rects.length) continue; { const bar = document.querySelector('.arbor2-bar'); if (bar && !el.closest('.arbor2-bar')) { const b = bar.getBoundingClientRect(); if (rects.some(([x0, y0, x1, y1]) => x0 < b.right && x1 > b.left && y0 < b.bottom && y1 > b.top)) continue; } }");
if (COLLECT2 === COLLECT) throw new Error('COLLECT2 did not take');
const sweep2 = async (app) => {
  await app.evalJs(COLLECT2);
  await app.evalJs(HIDE);
  const shot = (await app.cdp('Page.captureScreenshot', { format: 'png' })).data;
  await app.evalJs(SHOW);
  return app.evalJs(MEASURE(shot));
};
const sweepFade2 = async (app, fromSec, toSec) => {
  const samples = [];
  const at = async (sec) => { await clock(app, hms(sec)); await sleep(60); const s = await app.evalJs(STATE); samples.push({ sec, at: hms(sec), ...s, runs: await sweep2(app) }); };
  for (let sec = fromSec; sec <= toSec; sec += 30) await at(sec);
  const i = samples.findIndex((s, j) => j > 0 && s.room !== samples[j - 1].room);
  if (i > 0) {
    let lo = samples[i - 1].sec, hi = samples[i].sec;
    while (hi - lo > 1) { const mid = Math.floor((lo + hi) / 2); await clock(app, hms(mid)); const s = await app.evalJs(STATE); if (s.room === samples[i - 1].room) lo = mid; else hi = mid; }
    await at(lo); await at(hi);
  }
  samples.sort((a, b) => a.sec - b.sec);
  return samples;
};

// one fade, swept: the clock every 30 s across the window, plus the seconds either side of the switch
const sweepFade = async (app, fromSec, toSec) => {
  const samples = [];
  const at = async (sec) => { await clock(app, hms(sec)); await sleep(60); const s = await app.evalJs(STATE); samples.push({ sec, at: hms(sec), ...s, runs: await sweep(app) }); };
  for (let sec = fromSec; sec <= toSec; sec += 30) await at(sec);
  // the switch: bisect the room's change to the second, then sweep both sides of it
  const i = samples.findIndex((s, j) => j > 0 && s.room !== samples[j - 1].room);
  if (i > 0) {
    let lo = samples[i - 1].sec, hi = samples[i].sec;
    while (hi - lo > 1) { const mid = Math.floor((lo + hi) / 2); await clock(app, hms(mid)); const s = await app.evalJs(STATE); if (s.room === samples[i - 1].room) lo = mid; else hi = mid; }
    await at(lo); await at(hi);
  }
  samples.sort((a, b) => a.sec - b.sec);
  return samples;
};
const judge = (name, samples) => {
  const ts = samples.map((s) => s.t);
  const gaps = samples.slice(1).map((s, j) => Math.abs(s.t - samples[j].t));
  const maxGap = Math.max(...gaps);
  const first = samples[0], last = samples[samples.length - 1];
  const g0 = new Map(first.runs.map((r) => [r.key, r.gmed])), g1 = new Map(last.runs.map((r) => [r.key, r.gmed]));
  // a run's identity across the fade: the same text in the same place (keys are where|text|x,y)
  const bareKeys = [...g0.keys()].filter((k) => g1.has(k) && Math.abs(g0.get(k) - g1.get(k)) > 0.2);
  const bare = bareKeys.map((k) => { const all = samples.map((s) => s.runs.find((r) => r.key === k)).filter(Boolean); const worst = all.reduce((a, r) => (r.p2 < a.p2 ? r : a), all[0]); return { key: k, worstP2: worst.p2, worstMin: Math.min(...all.map((r) => r.min)) }; });
  const bad = samples.flatMap((s) => s.runs.filter((r) => r.p2 < r.floor).map((r) => ({ at: s.at, t: s.t, text: r.text, where: r.where, floor: r.floor, p2: r.p2, min: r.min })));
  const ok = {
    covered: ts[0] === 0 && ts[ts.length - 1] === 1 || (ts[0] === 1 && ts[ts.length - 1] === 0),
    every5pct: maxGap <= 0.05 + 1e-9,
    bareSeen: bare.length > 0 && bareKeys.some((k) => /\|\d+\s*words?\b/i.test(k)),
    floors: bad.length === 0,
  };
  const brief = { ok, samples: samples.length, maxGap: Math.round(maxGap * 1000) / 1000, bare, bad: bad.slice(0, 10), runsPerSample: first.runs.length };
  if (Object.values(ok).some((x) => !x)) fail(name, brief);
  return brief;
};
const MORNING = [6 * 3600 + 49 * 60, 7 * 3600 + 11 * 60], EVENING = [18 * 3600 + 49 * 60, 19 * 3600 + 11 * 60];
// SUCCESSOR of judge (r11, SUPERSEDED by Fable's ruling, Nov 1, on the Wrizors' answer (spec draft 13 §2e): the count row's plate is the page's paper and its letters the page's low ink, following the Page setting, never the room): judge's bareSeen required the count among the bare room's texts; the
// count now sits on the page's paper, so bareSeen asks only for bare-room texts, and countOnPage asks that the count's ground hold still (a
// median ground-luminance spread of <= 0.02 across every sample) while the floors are kept at every sample exactly as judge keeps them.
const judge2 = (name, samples) => {
  const ts = samples.map((s) => s.t);
  const gaps = samples.slice(1).map((s, j) => Math.abs(s.t - samples[j].t));
  const maxGap = Math.max(...gaps);
  const first = samples[0], last = samples[samples.length - 1];
  const g0 = new Map(first.runs.map((r) => [r.key, r.gmed])), g1 = new Map(last.runs.map((r) => [r.key, r.gmed]));
  const bareKeys = [...g0.keys()].filter((k) => g1.has(k) && Math.abs(g0.get(k) - g1.get(k)) > 0.2);
  const bare = bareKeys.map((k) => { const all = samples.map((s) => s.runs.find((r) => r.key === k)).filter(Boolean); const worst = all.reduce((a, r) => (r.p2 < a.p2 ? r : a), all[0]); return { key: k, worstP2: worst.p2, worstMin: Math.min(...all.map((r) => r.min)) }; });
  const bad = samples.flatMap((s) => s.runs.filter((r) => r.p2 < r.floor).map((r) => ({ at: s.at, t: s.t, text: r.text, where: r.where, floor: r.floor, p2: r.p2, min: r.min })));
  const countKey = [...g0.keys()].find((k) => /\|\d+\s*words?\b/i.test(k));
  const countG = countKey ? samples.map((s) => s.runs.find((r) => r.key === countKey)?.gmed) : [];
  const ok = {
    covered: ts[0] === 0 && ts[ts.length - 1] === 1 || (ts[0] === 1 && ts[ts.length - 1] === 0),
    every5pct: maxGap <= 0.05 + 1e-9,
    bareSeen: bare.length > 0,
    countOnPage: !!countKey && countG.every((g) => typeof g === 'number') && Math.max(...countG) - Math.min(...countG) <= 0.02,
    floors: bad.length === 0,
  };
  const brief = { ok, samples: samples.length, maxGap: Math.round(maxGap * 1000) / 1000, bare, bad: bad.slice(0, 10), runsPerSample: first.runs.length, count: countKey ? { key: countKey, ground: [Math.min(...countG), Math.max(...countG)] } : null };
  if (Object.values(ok).some((x) => !x)) fail(name, brief);
  return brief;
};

export default {
  // ── THE SWEEP, FREE WRITE: morning and evening fades, every text against the pixels behind it, at least every 5%; floors 4.5:1 throughout.
  // PARKED 2026-11-01 (SUPERSEDED by Fable's ruling, Nov 1, on the Wrizors' answer (spec draft 13 §2e): the count row's plate is the page's paper and its letters the page's low ink, following the Page setting, never the room; judge's bareSeen required the count on the bare room). Kept verbatim under the name
  // r10-sweep-freewrite-v1 (not in the run list); SUCCESSOR r10-sweep-freewrite below, the same sweep through judge2.
  'r10-sweep-freewrite-v1': async (app) => {
    await page(app, 'arbor-r10-sweep'); await lit(app);
    if ((await clock(app, '12:00')) === 'NO-SEAM') fail('R10-SWEEP-FREEWRITE', { seam: false });
    const m = judge('R10-SWEEP-FREEWRITE (morning)', await sweepFade(app, ...MORNING));
    const e = judge('R10-SWEEP-FREEWRITE (evening)', await sweepFade(app, ...EVENING));
    say('r10-sweep-freewrite', { morning: m, evening: e });
  },
  'r10-sweep-freewrite': async (app) => {
    await page(app, 'arbor-r10-sweep'); await lit(app);
    if ((await clock(app, '12:00')) === 'NO-SEAM') fail('R10-SWEEP-FREEWRITE', { seam: false });
    const m = judge2('R10-SWEEP-FREEWRITE (morning)', await sweepFade2(app, ...MORNING));
    const e = judge2('R10-SWEEP-FREEWRITE (evening)', await sweepFade2(app, ...EVENING));
    say('r10-sweep-freewrite', { morning: m, evening: e });
  },
  // ── THE SWEEP, DRAFT (the same, on the Draft surface)
  // PARKED 2026-11-01 (SUPERSEDED by Fable's ruling, Nov 1, on the Wrizors' answer (spec draft 13 §2e): the count row's plate is the page's paper and its letters the page's low ink, following the Page setting, never the room; judge's bareSeen required the count on the bare room). Kept verbatim under the name
  // r10-sweep-draft-v1 (not in the run list); SUCCESSOR r10-sweep-draft below, the same sweep through judge2.
  'r10-sweep-draft-v1': async (app) => {
    await page(app, 'arbor-r10-sweep');
    await clickText(app, '.desk-mode-tab', 'Draft'); await sleep(1400); await lit(app);
    if ((await clock(app, '12:00')) === 'NO-SEAM') fail('R10-SWEEP-DRAFT', { seam: false });
    const m = judge('R10-SWEEP-DRAFT (morning)', await sweepFade(app, ...MORNING));
    const e = judge('R10-SWEEP-DRAFT (evening)', await sweepFade(app, ...EVENING));
    say('r10-sweep-draft', { morning: m, evening: e });
  },
  'r10-sweep-draft': async (app) => {
    await page(app, 'arbor-r10-sweep');
    await clickText(app, '.desk-mode-tab', 'Draft'); await sleep(1400); await lit(app);
    if ((await clock(app, '12:00')) === 'NO-SEAM') fail('R10-SWEEP-DRAFT', { seam: false });
    const m = judge2('R10-SWEEP-DRAFT (morning)', await sweepFade2(app, ...MORNING));
    const e = judge2('R10-SWEEP-DRAFT (evening)', await sweepFade2(app, ...EVENING));
    say('r10-sweep-draft', { morning: m, evening: e });
  },

  // ── THE WARM MIDDLE AND THE ESPRESSO BARS (Wrizors 2): following the clock, the room's ground passes espresso #120A06 -> amber-plaster #D9C3A2
  // (the 50% stop, at 07:00 and at 19:00) -> plaster; it is never cooler than espresso (red above blue by >= 0x0C) at any step; the bars
  // stay espresso #1B120C at every step.
  'r10-warm': async (app) => {
    await page(app, 'arbor-r10-warm'); await lit(app);
    const rows = [];
    for (let sec = MORNING[0]; sec <= MORNING[1]; sec += 60) {
      if ((await clock(app, hms(sec))) === 'NO-SEAM') fail('R10-WARM', { seam: false });
      await sleep(40);
      rows.push({ at: hms(sec), ...(await app.evalJs(STATE)), bar: await app.evalJs(`(() => { const b = [...document.querySelectorAll('.chrome-top.sprint-nav')].find((x) => x.getBoundingClientRect().height > 0); const m = b ? getComputedStyle(b).backgroundColor.match(/\\d+/g) : null; return m ? '#' + m.slice(0, 3).map((v) => (+v).toString(16).padStart(2, '0')).join('').toUpperCase() : null; })()`) });
    }
    await clock(app, '19:00'); const eve = await app.evalJs(STATE);
    const n = (h) => { const v = parseInt(String(h).replace('#', ''), 16); return [v >> 16, (v >> 8) & 255, v & 255]; };
    const near = (a, b) => n(a).every((v, i) => Math.abs(v - n(b)[i]) <= 2);
    const mid = rows.find((r) => r.at === '07:00:00');
    const ok = {
      stop: !!mid && mid.t === 0.5 && near(mid.g, '#D9C3A2') && near(eve.g, '#D9C3A2'),
      warm: rows.every((r) => { const [R, , B] = n(r.g); return R - B >= 0x0C; }),   // never cooler than espresso's own warmth (the stop above is what tells the warm path from r9's grey one)
      bars: rows.every((r) => r.bar === '#1B120C'),
    };
    if (Object.values(ok).some((x) => !x)) fail('R10-WARM', { ok, rows: rows.map((r) => [r.at, r.t, r.g, r.bar]), eve });
    say('r10-warm', { ok, rows: rows.map((r) => [r.at, r.t, r.g]) });
  },

  // ── THE LAMP HANDS OVER TO THE SUN (Wrizors 2: "the lamp pool fades out as the sun pool fades in (never both at half)"): across the morning fade
  // the lamp's strength falls to 0 by the middle and the sun's rises from 0 after it; at no moment are both above 0. The pool is read as drawn:
  // body::before's colour stops (lamp or sun) and their alpha, and the pergola's sun layer's opacity.
  'r10-handoff': async (app) => {
    await page(app, 'arbor-r10-handoff'); await lit(app);
    const READ = `(() => { const r = document.documentElement, cs = getComputedStyle(r);
      const rgb = cs.getPropertyValue('--arbor-lamp-rgb').trim(), a = Number(cs.getPropertyValue('--arbor2-pool-a').trim() || 0);
      const sun = document.querySelector('.arbor2-sun'); const so = sun ? (getComputedStyle(sun).display === 'none' ? 0 : Number(getComputedStyle(sun).opacity)) : 0;
      const isLamp = /^212\\s*,\\s*162\\s*,\\s*78$/.test(rgb), isSun = /^255\\s*,\\s*236\\s*,\\s*190$/.test(rgb);
      return { t: Number(r.getAttribute('data-arbor2-dayness')), rgb, a, lamp: isLamp ? a : 0, sunPool: isSun ? a : 0, sunLayer: so, mixed: !isLamp && !isSun && a > 0 }; })()`;
    const rows = [];
    for (let sec = MORNING[0]; sec <= MORNING[1]; sec += 30) { if ((await clock(app, hms(sec))) === 'NO-SEAM') fail('R10-HANDOFF', { seam: false }); await sleep(40); rows.push({ at: hms(sec), ...(await app.evalJs(READ)) }); }
    const lampUp = rows.filter((r) => r.t <= 0.5), sunUp = rows.filter((r) => r.t >= 0.5);
    const ok = {
      never: rows.every((r) => !r.mixed && !(r.lamp > 0.001 && (r.sunPool > 0.001 || r.sunLayer > 0.001))),
      lampFalls: lampUp.every((r, i) => i === 0 || r.lamp <= lampUp[i - 1].lamp + 1e-6) && rows.find((r) => r.t === 0)?.lamp > 0.2 && rows.filter((r) => r.t >= 0.5).every((r) => r.lamp <= 0.001),
      sunRises: sunUp.every((r, i) => i === 0 || r.sunPool >= sunUp[i - 1].sunPool - 1e-6) && rows.filter((r) => r.t <= 0.5).every((r) => r.sunPool <= 0.001) && rows[rows.length - 1].sunPool > 0.5,
    };
    if (Object.values(ok).some((x) => !x)) fail('R10-HANDOFF', { ok, rows: rows.map((r) => [r.at, r.t, r.rgb, r.a, r.sunLayer]) });
    say('r10-handoff', { ok, rows: rows.filter((_, i) => i % 4 === 0).map((r) => [r.at, r.t, r.lamp, r.sunPool, r.sunLayer]) });
  },

  // ── THE COUNT'S PLATE (Wrizors 1): through the whole fade the word count sits on its own plate - the count's text inside the plate's rect at
  // every step; the label is cream by night and deep olive by day, switching once, at the middle.
  // PARKED 2026-11-01 (SUPERSEDED by Fable's ruling, Nov 1, on the Wrizors' answer (spec draft 13 §2e): the count row's plate is the page's paper and its letters the page's low ink, following the Page setting, never the room; "Retire your midpoint cut"). Kept verbatim under the name r10-plate-v1 (not in the run list);
  // SUCCESSOR r11-plate (scripts/frames/arbor2-r11.mjs): the plate is the page's paper and low ink at every moment, measured in both page tones.
  'r10-plate-v1': async (app) => {
    await page(app, 'arbor-r10-plate'); await lit(app);
    const READ = `(() => { const plate = document.querySelector('.arbor2-count-plate, .desk-frame-instrument');   /* (driver: the plate is the count row's own box, the instrument) */ const cnt = [...document.querySelectorAll('*')].find((e) => [...e.childNodes].some((n) => n.nodeType === 3 && /^\\d+\\s*words?$/i.test(n.textContent.trim())));
      const p = plate?.getBoundingClientRect(), c = cnt?.getBoundingClientRect(); const cs = plate ? getComputedStyle(plate) : null;
      return { t: Number(document.documentElement.getAttribute('data-arbor2-dayness')), plate: !!p && p.width > 0 && cs.display !== 'none' && Number(cs.opacity) > 0.5, holds: !!p && !!c && c.left >= p.left - 0.5 && c.right <= p.right + 0.5 && c.top >= p.top - 0.5 && c.bottom <= p.bottom + 0.5,
        ink: cnt ? getComputedStyle(cnt).color : null }; })()`;
    const rows = [];
    for (let sec = MORNING[0] + 60; sec <= MORNING[1] - 60; sec += 60) { if ((await clock(app, hms(sec))) === 'NO-SEAM') fail('R10-PLATE', { seam: false }); await sleep(40); rows.push({ at: hms(sec), ...(await app.evalJs(READ)) }); }
    const fading = rows.filter((r) => r.t > 0 && r.t < 1);
    const inks = fading.map((r) => r.ink); const switches = inks.slice(1).filter((x, i) => x !== inks[i]).length;
    const sw = fading.findIndex((r, i) => i > 0 && r.ink !== fading[i - 1].ink);
    const ok = { plate: fading.length > 0 && fading.every((r) => r.plate && r.holds), once: switches === 1, middle: sw > 0 && fading[sw - 1].t < 0.5 + 1e-9 && fading[sw].t >= 0.5 - 1e-9 };
    if (Object.values(ok).some((x) => !x)) fail('R10-PLATE', { ok, rows: rows.map((r) => [r.at, r.t, r.plate, r.holds, r.ink]) });
    say('r10-plate', { ok, rows: rows.map((r) => [r.at, r.t, r.ink]) });
  },

  // ── SHORT MOOD WORDS (Wrizors 3, spec §2e): the Room row reads By the clock · Day · Night on ONE line, and its "?" says "By the clock: day 07:00–19:00".
  'r10-mood': async (app) => {
    await page(app, 'arbor-r10-mood');
    await app.evalJs(`(() => { const m = [...document.querySelectorAll('.arbor2-bar-head')].find((h) => /^Mood/.test(h.textContent.trim()) && h.getAttribute('aria-expanded') !== 'true'); if (m) m.click(); })()`); await sleep(300);
    const s = await app.evalJs(`(() => { const row = document.querySelector('.arbor2-mood > li'); if (!row) return null; const opts = [...row.querySelectorAll('[data-room-opt]')];
      const help = row.querySelector('.arbor2-room-help, [data-room-help]');
      return { label: row.getAttribute('aria-label'), opts: opts.map((b) => [b.getAttribute('data-room-opt'), b.textContent.trim()]), tops: [...new Set(opts.map((b) => Math.round(b.getBoundingClientRect().top)))],
        help: help ? (help.getAttribute('title') || help.getAttribute('aria-label') || help.textContent).trim() : null }; })()`);
    const ok = { words: !!s && s.label === 'Room' && JSON.stringify(s.opts) === '[["clock","By the clock"],["day","Day"],["night","Night"]]', oneLine: !!s && s.tops.length === 1, help: !!s && /By the clock: day 07:00–19:00/.test(s.help || '') };
    if (Object.values(ok).some((x) => !x)) fail('R10-MOOD', { ok, s });
    say('r10-mood', { ok, s });
  },

  // ── PICTURES FOR THE WRIZORS: the morning fade at 0 / 25 / 50 / 75 / 100% (06:50, 06:56:20, 07:00, 07:03:40, 07:10 - the dayness read back
  // is printed), Free Write; the job's two tones give both pages; and the Mood menu open on the Room row.
  ...Object.fromEntries([['000', '06:50:00'], ['025', '06:56:20'], ['050', '07:00:00'], ['075', '07:03:40'], ['100', '07:10:00']].map(([pct, at]) => [`r10-pic-fade-${pct}`, async (app) => {
    await page(app, 'arbor-r10-pic');
    const seam = await clock(app, at);
    await app.evalJs(`document.querySelector('${ED}')?.blur()`); await sleep(900);
    const s = await app.evalJs(STATE);
    if (seam === 'NO-SEAM') fail('R10-PIC', { pct, seam });
    say(`r10-pic-fade-${pct}`, { at, ...s });
  }])),
  'r10-pic-menu': async (app) => {
    await page(app, 'arbor-r10-pic');
    await clock(app, '12:00');
    await app.evalJs(`(() => { const m = [...document.querySelectorAll('.arbor2-bar-head')].find((h) => /^Mood/.test(h.textContent.trim()) && h.getAttribute('aria-expanded') !== 'true'); if (m) m.click(); })()`); await sleep(500);
    say('r10-pic-menu', await app.evalJs("(document.querySelector('.arbor2-mood > li')?.textContent || '').replace(/\\s+/g, ' ').trim()"));
  },
};
