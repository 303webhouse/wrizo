// ARBOR v2 MOCKUP, ROUND r11 - the self-checks and THE NICK WALK, as named screens for INK's frames job (-f themes=plateau -f widths=1366
// -f screens_file=apps/desktop/scripts/frames/arbor2-r11.mjs). Sources, Fable, Nov 1:
//   THE DRAWER ALIGNMENT (Nick's decision, all themes): CLOSED, the opener tab at the page edge (today's rect), arrow pointing out. OPEN, the
//   drawer FLUSH against the page (no gap), the tab on the drawer's OUTER edge, arrow pointing back ("close"); it moves with the drawer's motion
//   (shared tokens; reduced motion = a cut); the page never moves; drawers stay mirrored, both-or-one. "Add it to the Nick walk (both drawers,
//   each room x page mix, 2000 + 1366)."
//   THE COUNT PLATE, RULED (the Wrizors' answer, spec draft 13 §2e, md5 273cb58f): "the plate = the page's paper + the page's low ink; it follows
//   the Page setting, never the room, with no fade or cut. Retire your midpoint cut. Measure the plate in both page tones."
// Every check THROWS with its numbers when it fails and prints them when it passes ("ARBOR-R11 <screen> {...}"). Written red-first: run against
// r10 (b3be043e) before the r11 build. Seeds go through window.wrizo*.
import { drawerProof, zoomDrawerProof, walkScreens, guarded } from './mockup-kit.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const WORDS = 'The morning light came in low across the table, and she began to write. The kettle ticked as it cooled, and outside a dog asked the street a question nobody answered.';
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const clickText = (app, sel, text) => app.evalJs(`(() => { const b = [...document.querySelectorAll(${JSON.stringify(sel)})].find((x) => (x.textContent || '').trim().toLowerCase() === ${JSON.stringify(text.toLowerCase())}); if (b) b.click(); return !!b; })()`);
const say = (name, data) => console.log(`ARBOR-R11 ${name} ${JSON.stringify(data)}`);
const fail = (name, data) => { console.log(`ARBOR-R11-FAIL ${name} ${JSON.stringify(data)}`); throw new Error(`${name} FAILED ${JSON.stringify(data)}`.slice(0, 1200)); };
const load = async (app, hash) => {
  await app.evalJs(`history.replaceState(null, '', '/?arbor2=1' + ${JSON.stringify(hash)})`);
  await app.reload();
  await waitSoft(app, "document.documentElement.getAttribute('data-arbor2') === 'true'", { label: 'flag', timeout: 15000 });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 });
};
const page = async (app, id, mode) => {
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: WORDS, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await sleep(300);
  await load(app, '#/page/' + id);
  await waitSoft(app, `!!document.querySelector('${ED}')`, { label: 'page' });
  await sleep(1200);
  if (mode) { await clickText(app, '.desk-mode-tab', mode); await sleep(1200); }
};
// the room by the mockup's own in-session pick (data-room light = Day, dark = Night): it lands at once
const setRoom = async (app, room) => { await app.evalJs(`document.documentElement.setAttribute('data-room', ${JSON.stringify(room === 'day' ? 'light' : 'dark')})`); await sleep(600); };
const clock = (app, s) => app.evalJs(`typeof window.arbor2Clock === 'function' ? window.arbor2Clock(${JSON.stringify(s)}) : 'NO-SEAM'`);
const hms = (sec) => { const s = ((Math.round(sec) % 86400) + 86400) % 86400; return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map((v) => String(v).padStart(2, '0')).join(':'); };
const MORNING = [6 * 3600 + 49 * 60, 7 * 3600 + 11 * 60], EVENING = [18 * 3600 + 49 * 60, 19 * 3600 + 11 * 60];

// ---- THE PLATE, by its own pixels: the count's runs against what is painted behind them (text hidden), and the plate's painted ground ----
const PLATE = `(() => {
  const parse = (s) => { const m = String(s).match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const p = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const plate = document.querySelector('.desk-frame-instrument'); if (!plate) return null;
  const r = plate.getBoundingClientRect(), cs = getComputedStyle(plate), root = getComputedStyle(document.documentElement);
  const probe = document.createElement('div'); probe.style.cssText = 'position:fixed;left:-9px;top:-9px;width:1px;height:1px;background:var(--paper);color:var(--ink-on-paper-low)'; document.body.appendChild(probe);
  const pcs = getComputedStyle(probe); const paper = pcs.backgroundColor, low = pcs.color; probe.remove();
  const runs = []; const tw = document.createTreeWalker(plate, NodeFilter.SHOW_TEXT);
  for (let n = tw.nextNode(); n; n = tw.nextNode()) { if (!n.textContent.trim()) continue; const el = n.parentElement; const c = parse(getComputedStyle(el).color); const rg = document.createRange(); rg.selectNodeContents(n);
    const rects = [...rg.getClientRects()].filter((x) => x.width >= 2 && x.height >= 4).map((x) => [x.left, x.top, x.right, x.bottom]); if (rects.length && c) runs.push({ text: n.textContent.trim().slice(0, 24), fg: [c.r, c.g, c.b, c.a], ink: getComputedStyle(el).color, rects }); }
  window.__r11plate = { rect: [r.left, r.top, r.right, r.bottom], runs };
  return { bg: cs.backgroundColor, paper, low, inks: [...new Set(runs.map((x) => x.ink))], texts: runs.map((x) => x.text), rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], t: Number(document.documentElement.getAttribute('data-arbor2-dayness')), pageTone: document.documentElement.getAttribute('data-page') };
})()`;
const HIDE = `(() => { const s = document.createElement('style'); s.id = 'arbor2-r11-hide'; s.textContent = '*, *::before, *::after{ color:transparent !important; -webkit-text-fill-color:transparent !important; text-shadow:none !important; caret-color:transparent !important; }'; document.head.appendChild(s); return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true)))); })()`;
const SHOW = `(() => { document.getElementById('arbor2-r11-hide')?.remove(); return true; })()`;
const MEASURE = (b64) => `(async () => {
  const img = new Image(); img.src = 'data:image/png;base64,${b64}'; await img.decode();
  const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(img, 0, 0);
  const k = img.width / innerWidth; const data = cx.getImageData(0, 0, img.width, img.height).data;
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const L = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const px = (x, y) => { const i = (Math.floor(y * k) * img.width + Math.floor(x * k)) * 4; return [data[i], data[i + 1], data[i + 2]]; };
  const { rect, runs } = window.__r11plate;
  // the plate's own painted ground: its left padding strip (no text there), sampled down the middle
  const ground = []; for (let y = rect[1] + 2; y < rect[3] - 2; y += 2) ground.push(px(rect[0] + 3, y).join(','));
  const counts = ground.reduce((m, g) => m.set(g, (m.get(g) || 0) + 1), new Map()); const groundTop = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  const out = runs.map((run) => { const [fr, fg, fb, fa] = run.fg; const ratios = [];
    for (const [x0, y0, x1, y1] of run.rects) { const sx = Math.max(1, (x1 - x0) / 24), sy = Math.max(1, (y1 - y0) / 8);
      for (let y = y0; y < y1; y += sy) for (let x = x0; x < x1; x += sx) { const [r, g, b] = px(x, y); const lb = L(r, g, b), lf = L(fr * fa + r * (1 - fa), fg * fa + g * (1 - fa), fb * fa + b * (1 - fa)); ratios.push((Math.max(lb, lf) + 0.05) / (Math.min(lb, lf) + 0.05)); } }
    ratios.sort((a, b) => a - b); return { text: run.text, p2: Math.round(ratios[Math.floor(ratios.length * 0.02)] * 100) / 100, min: Math.round(ratios[0] * 100) / 100 }; });
  return { ground: groundTop ? groundTop[0] : null, groundShare: groundTop ? Math.round(groundTop[1] / ground.length * 100) / 100 : 0, runs: out };
})()`;
const rgbOf = (s) => (String(s).match(/\d+(\.\d+)?/g) || []).slice(0, 3).map((v) => Math.round(Number(v))).join(',');
// (instrument fix after the first green look, run 41336024311, and its picture, run 41336482332: at 1366 the mockup's own control panel
// (.arbor2-bar, bottom right; it never ships) lies over the count row's right end, so "WORDS" was read against the panel. The plate is
// measured with that panel hidden.)
const NOBAR = "(() => { if (!document.getElementById('arbor2-r11-nobar')) { const s = document.createElement('style'); s.id = 'arbor2-r11-nobar'; s.textContent = '.arbor2-bar{ visibility:hidden !important; }'; document.head.appendChild(s); } return true; })()";
const plateAt = async (app) => {
  await app.evalJs(NOBAR);
  const s = await app.evalJs(PLATE); if (!s) return null;
  await app.evalJs(HIDE); const shot = (await app.cdp('Page.captureScreenshot', { format: 'png' })).data; await app.evalJs(SHOW);
  return { ...s, ...(await app.evalJs(MEASURE(shot))) };
};

// (Fable, Nov 2, all lanes: a check that throws, crashes or prints no verdict is RED - the kit's verdict guard wraps every screen here)
export default guarded({
  // ── THE DRAWERS (Draft: both hands on the page), and the same on Free Write
  'r11-drawers': async (app) => { await page(app, 'arbor-r11-drawers', 'Draft'); await drawerProof(app, { name: 'R11-DRAWERS', say, fail }); },
  // PARKED 2026-11-01 (SUPERSEDED by the build's measured scope, first green look runs 41336024311 / 41336050132: this page opens in Typewriter's zoom, where the drawers overlay the enlarged page and keep today's rule - the alignment applies beside an unzoomed page, which r11-drawers / m2r5-drawers-build check). Kept verbatim under the name r11-drawers-freewrite-v1 (not in the run list); SUCCESSOR r11-drawers-zoom below.
  'r11-drawers-freewrite-v1': async (app) => { await page(app, 'arbor-r11-drawers-fw'); await drawerProof(app, { name: 'R11-DRAWERS-FREEWRITE', say, fail }); },
  // (r18: leftRides - the Wrizors (md5 d1c1dcc2, via Fable, Nov 4) put the zoom's Tools opener on the drawer's outer edge; the kit keeps the parked line)
  'r11-drawers-zoom': async (app) => { await page(app, 'arbor-r11-drawers-zoom'); await zoomDrawerProof(app, { name: 'R11-DRAWERS-ZOOM', say, fail, leftRides: true, rightRides: true }); },   // (r19: the Tutor opener rides too)

  // ── THE PLATE (successor of r10-plate): through the morning and the evening fades, every 60 s, the plate is the page's paper and its letters
  // the page's low ink - the SAME pair at every moment (no fade, no cut) - painted as that paper, and every run on it holds 4.5:1 against the
  // pixels behind it. The job's two tones are the two page tones.
  'r11-plate': async (app) => {
    await page(app, 'arbor-r11-plate');
    await app.evalJs(`document.querySelector('${ED}')?.blur(); getSelection()?.removeAllRanges()`);
    if ((await clock(app, '12:00')) === 'NO-SEAM') fail('R11-PLATE', { seam: false });
    const rows = [];
    for (const [a, b] of [MORNING, EVENING]) for (let sec = a; sec <= b; sec += 60) { await clock(app, hms(sec)); await sleep(60); const p = await plateAt(app); rows.push({ at: hms(sec), ...p }); }
    if (rows.some((r) => !r.runs)) fail('R11-PLATE', { noPlate: rows.filter((r) => !r.runs).map((r) => r.at) });
    const fading = rows.filter((r) => r.t > 0 && r.t < 1);
    const first = rows[0];
    const ok = {
      seen: rows.every((r) => r && r.runs.length > 0 && r.texts.some((x) => /\d+\s*words?/i.test(x) || /^words?$/i.test(x))),
      coversFade: fading.length >= 10 && rows.some((r) => r.t === 0) && rows.some((r) => r.t === 1),
      onPaper: rows.every((r) => rgbOf(r.bg) === rgbOf(r.paper)),
      lowInk: rows.every((r) => r.inks.length === 1 && rgbOf(r.inks[0]) === rgbOf(r.low)),
      neverMoves: rows.every((r) => r.bg === first.bg && r.inks.join() === first.inks.join()),
      paintedPaper: rows.every((r) => r.ground === rgbOf(r.paper) && r.groundShare >= 0.9),
      floors: rows.every((r) => r.runs.every((x) => x.p2 >= 4.5)),
    };
    const worst = rows.flatMap((r) => r.runs.map((x) => ({ at: r.at, ...x }))).reduce((m, x) => (!m || x.p2 < m.p2 ? x : m), null);
    const brief = { ok, tone: first.pageTone, samples: rows.length, fading: fading.length, bg: first.bg, ink: first.inks, worst, rect: first.rect };
    if (Object.values(ok).some((x) => !x)) fail('R11-PLATE', { ...brief, rows: rows.map((r) => [r.at, r.t, r.bg, r.inks.join('|'), r.ground, r.groundShare, r.runs.map((x) => x.p2).join('/')]) });
    say('r11-plate', brief);
  },

  // ── PICTURES: the plate at the fade's five stops (both tones from the job), for the Wrizors
  ...Object.fromEntries([0, 25, 50, 75, 100].map((pct) => [`r11-pic-plate-${String(pct).padStart(3, '0')}`, async (app) => {
    await page(app, 'arbor-r11-pic');
    await app.evalJs(`document.querySelector('${ED}')?.blur()`);
    // the morning fade's stops: 06:50 is t=0, 07:10 is t=1 (smoothstep), so the clock is found by bisection on the room's own dayness
    let lo = MORNING[0], hi = MORNING[1];
    const want = pct / 100;
    for (let i = 0; i < 16; i++) { const mid = (lo + hi) / 2; await clock(app, hms(mid)); const t = Number(await app.evalJs("document.documentElement.getAttribute('data-arbor2-dayness')")); if (t < want) lo = mid; else hi = mid; }
    await clock(app, hms(want === 0 ? MORNING[0] : want === 1 ? MORNING[1] : hi)); await sleep(500);
    say(`r11-pic-plate-${pct}`, { t: await app.evalJs("document.documentElement.getAttribute('data-arbor2-dayness')") });
  }])),

  // ── THE NICK WALK
  // (r15: the walk's reduced-motion repeat gets its liveness probe on Free Write's zoomed page - Fable, Nov 1)
  // (r18: stuckSides ['right'] - only the Tutor tab still never travels on the zoom page; the kit keeps the parked probe)
  // (r19: no side is stuck on the zoom page now - both openers ride their drawers; the kit's probe plants the travel it must see)
  ...walkScreens('arbor-walk', (app) => page(app, 'arbor-walk', 'Draft'), setRoom, (app) => page(app, 'arbor-walk-z', null), []),
}, { verdict: ["ARBOR-R11","ARBOR-WALK-REDUCED-REPEAT","ARBOR-WALK-REDUCED-LIVENESS","ARBOR-WALK-REDUCED-CUT"] });
