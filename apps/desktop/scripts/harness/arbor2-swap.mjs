// ARBOR v2 MOCKUP - NICK'S RULING B (via Fable, Nov 6): "the leaves shiver only when she's not typing. On the first key the shade swaps to the
// still picture; it goes live again on the same signal that brings the chrome back (pointer move). The drift keeps moving throughout."
// Fable's bar, the parts this file holds: (3) still under reduced motion; (4) the swap goes through the flash budget. Run pinned to day:
// WS_URL_SEARCH='?arbor2=1&arbor2room=day' (arbor2-roompin.mjs proves the pin took). Pictures of the swap: frames/arbor2-shade-look.mjs.
//   W1  at rest: the room (and the page copy, where the page is not zoomed) shows the LIVE drawing; its still picture is drawn and hidden
//   W2  the first key: the still picture shows and the live drawing has left style work (content-visibility hidden) - in the key's own frames
//   W3  the drift runs on through the swap: the room's drift is the SAME animation, never restarted (its start time unchanged), and running
//   W4  the chrome's return (the pointer moves): the live drawing is back, the still picture hidden, the drift still the same animation
//   W5  the swap goes through the flash budget: over 6 swaps, the first key (keydown -> the second frame after it) with the shade ON against the
//       same page's first key with the shade OFF (Mood's Day shadows, what the switch writes): median within 5 ms, p95 within 25 ms, none over 100
//   W6  reduced motion: at rest nothing on the shade animates; the first key swaps; nothing animates after it either
//   W7  nothing stored: localStorage holds no key or value naming the swap
//   W8  the flash copy's pre-rendered mask (Fable, Nov 6: "keep the look identical"): on ONE page, the flash held (every finite animation
//       landed, the rest paused), shot with the bitmap mask and again with the SVG mask it replaces put back (a test-only switch in this page) -
//       the two shots differ by no more than 9 levels on more than 0.01% of the pixels (the vines' shape is seeded by the session, so two runs'
//       pictures cannot be compared; one page can)
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const splashGone = (app) => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 20000, label: 'splash gone' }).catch(() => {});
const q = process.env.WS_URL_SEARCH || '';
const pinned = /[?&]arbor2=1\b/.test(q) && /[?&]arbor2room=day\b/.test(q);
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : null; };
const p95 = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * 0.95))] : null; };
const r1 = (v) => (v == null ? null : Math.round(v * 10) / 10);

const READ = `(() => { const root = document.documentElement, room = document.querySelector('.arbor2-pergola'), d = room && room.querySelector('.arbor2-pergola-drift');
  const lay = (l) => { if (!l) return null; const live = l.querySelector('.arbor2-live'), still = l.querySelector('.arbor2-still');
    return { shown: getComputedStyle(l).display !== 'none', live: live ? getComputedStyle(live).contentVisibility : null, still: still ? getComputedStyle(still).display : null,
      stillBg: still ? /^url\\("blob:/.test(still.style.backgroundImage) : false, stillOp: still ? Number(still.style.opacity) : null,
      liveO: live ? Number(getComputedStyle(live).opacity) : null, stillO: still ? Number(getComputedStyle(still).opacity) : null, stillA: still ? Number(still.style.getPropertyValue('--arbor2-still-a')) : null,
      wc: [live, still].map((e) => (e ? getComputedStyle(e).willChange : null)), off: l.getAttribute('data-live-off') }; };
  const da = d ? d.getAnimations().find((a) => /arbor2-pergola-drift/.test(a.animationName || '')) : null;
  const anims = room ? document.getAnimations().filter((a) => { const t = a.effect && a.effect.target; return !!t && (room.contains(t)) && a.playState === 'running'; }).length : null;
  return { writing: root.getAttribute('data-wz-writing'), roomName: root.getAttribute('data-arbor2-room'), zoom: document.querySelector('.desk-frame-stage .mode-pagecol')?.getAttribute('data-zoom') === 'true',
    room: lay(room), page: lay(document.querySelector('.desk-frame-stage .mode-page > .arbor2-pagesh')), drift: da ? { name: da.animationName, start: da.startTime, state: da.playState } : null, running: anims,
    ls: JSON.stringify(Object.keys(localStorage).sort().map((k) => [k, localStorage.getItem(k)])) }; })()`;
const METER = "(() => { if (window.__swapMeter) return true; window.__swapMeter = true; window.__lat = []; document.addEventListener('keydown', (e) => { const t0 = e.timeStamp; requestAnimationFrame(() => requestAnimationFrame(() => window.__lat.push(performance.now() - t0))); }, true); return true; })()";
const backToRest = async (app) => {
  for (let i = 0; i < 12; i += 1) { await app.mouseMove(40 + i * 30, 200 + (i % 4) * 25); await sleep(60); }
  await app.waitFor("document.documentElement.getAttribute('data-wz-writing') !== 'true'", { label: 'chrome returned', timeout: 6000 }).catch(() => {});
  await sleep(3400);   // the shade's 3 s fade back in, landed
};
const firstKeys = async (app, n) => {
  const out = [];
  for (let i = 0; i < n; i += 1) {
    await backToRest(app);
    await app.evalJs("document.querySelector('.forward-only-editor').focus()");
    const before = await app.evalJs('window.__lat.length');
    await app.typeKeys(i % 2 ? 'a' : 'e');
    await sleep(400);
    const lat = await app.evalJs(`window.__lat[${before}] ?? null`);
    out.push(lat);
  }
  return out;
};

await withHarness(async (app) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted' });
  await splashGone(app);
  await app.waitFor("!!document.querySelector('.arbor2-pergola .arbor2-still') && /^url\\(\"blob:/.test(document.querySelector('.arbor2-pergola .arbor2-still').style.backgroundImage)", { label: 'still picture drawn', timeout: 6000 }).catch(() => {});
  await app.evalJs(METER);
  await backToRest(app);
  const rest = await app.evalJs(READ);
  const liveOk = (l) => !!l && l.live === 'visible' && l.still === 'none' && l.stillBg === true;
  // PARKED 2026-11-06, never run (SUPERSEDED by Fable's ruling (c): the still picture is never display:none now - it waits at opacity 0 to
  // cross-fade in - and its strength moved to --arbor2-still-a). Original, verbatim:
  // ok('W1 at rest: the room shows the live drawing, its still picture drawn and hidden (and the page copy too, where the page is not zoomed)',
  //   rest.roomName === 'day' && liveOk(rest.room) && Math.abs(rest.room.stillOp - 0.2) < 0.001 && (rest.zoom || (liveOk(rest.page) && Math.abs(rest.page.stillOp - 0.034) < 0.0005)), JSON.stringify(rest));
  // SUCCESSOR W1c: at rest the live drawing shows at full (in style work), the still picture is drawn and waits at opacity 0 with the layer's
  // strength as its target (room 0.2, page 0.034), both on the compositor (will-change: opacity).
  const restC = (l, a) => !!l && l.live === 'visible' && l.liveO === 1 && l.stillO === 0 && l.stillBg === true && Math.abs(l.stillA - a) < 0.0005 && l.wc.every((w) => /opacity/.test(w)) && l.off === null;
  ok('W1c at rest: the live drawing at full, the still picture drawn and waiting at 0 (target: the layer\'s strength), both will-change: opacity',
    rest.roomName === 'day' && restC(rest.room, 0.2) && (rest.zoom || restC(rest.page, 0.034)), JSON.stringify(rest));

  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys('w');
  await app.evalJs('new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))');
  const k1 = await app.evalJs(READ);
  await sleep(320);
  const k1c = await app.evalJs(READ);
  const stillOk = (l) => !!l && l.live === 'hidden' && l.still === 'block';
  // PARKED 2026-11-06, never run (SUPERSEDED by Fable's ruling (c): the swap is a 200 ms cross-fade, not a cut in the key's own frames).
  // Original, verbatim:
  // ok('W2 the first key: the still picture shows and the live drawing has left style work, in the key\'s own frames', k1.writing === 'true' && stillOk(k1.room) && (k1.zoom || stillOk(k1.page)), JSON.stringify(k1));
  // SUCCESSOR W2c: in the key's own frames the cross-fade has begun (the still picture above 0 and below its strength, the live drawing below 1);
  // 320 ms later it has landed - the still picture at the layer's strength, the live drawing at 0 and out of style work (data-live-off).
  const midC = (l) => !!l && l.stillO > 0 && l.stillO < l.stillA && l.liveO < 1;
  const landC = (l) => !!l && Math.abs(l.stillO - l.stillA) < 0.001 && l.liveO === 0 && l.live === 'hidden' && l.off === 'true';
  ok('W2c the first key: the cross-fade begins in the key\'s own frames and has landed 320 ms later (still at strength, live at 0 and out of style work)',
    k1.writing === 'true' && midC(k1.room) && landC(k1c.room) && (k1c.zoom || landC(k1c.page)), JSON.stringify({ key: k1.room, landed: k1c.room, page: k1c.page }));
  ok('W3 the drift runs on through the swap: the room\'s drift is the same animation (start time unchanged), running', !!rest.drift && !!k1.drift && rest.drift.start === k1.drift.start && k1.drift.state === 'running', JSON.stringify({ rest: rest.drift, key: k1.drift }));
  await backToRest(app);
  const back = await app.evalJs(READ);
  // PARKED 2026-11-06, never run (SUPERSEDED by Fable's ruling (c): on the return the still picture fades out to 0, it is not display:none).
  // Original, verbatim:
  // ok('W4 the chrome\'s return: the live drawing is back, the still picture hidden, the drift still the same animation', back.writing !== 'true' && liveOk(back.room) && (back.zoom || liveOk(back.page)) && !!back.drift && back.drift.start === rest.drift.start, JSON.stringify(back));
  // SUCCESSOR W4c: the return - the live drawing back in style work and at full, the still picture back at 0, the drift the same animation.
  ok('W4c the chrome\'s return: the live drawing back at full and in style work, the still picture back at 0, the drift still the same animation',
    back.writing !== 'true' && restC(back.room, 0.2) && (back.zoom || restC(back.page, 0.034)) && !!back.drift && back.drift.start === rest.drift.start, JSON.stringify(back));

  // W5: the swap key against the same page's first key with the shade off
  const on = await firstKeys(app, 6);
  await app.evalJs("document.documentElement.setAttribute('data-arbor2-off', 'shadows')");
  const off = await firstKeys(app, 6);
  await app.evalJs("document.documentElement.removeAttribute('data-arbor2-off')");
  const okN = (a) => a.filter((v) => typeof v === 'number');
  const A = okN(on), B = okN(off);
  ok('W5 the swap goes through the flash budget: the first key with the shade ON against the shade OFF - median within 5 ms, p95 within 25 ms, none over 100',
    A.length === 6 && B.length === 6 && median(A) - median(B) <= 5 && p95(A) - p95(B) <= 25 && Math.max(...A) <= 100,
    JSON.stringify({ on: A.map(r1), off: B.map(r1), median: [r1(median(A)), r1(median(B))], p95: [r1(p95(A)), r1(p95(B))] }));

  // W6 reduced motion
  await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  try {
    await backToRest(app);
    const rm0 = await app.evalJs(READ);
    await app.evalJs("document.querySelector('.forward-only-editor').focus()");
    await app.typeKeys('r');
    await app.evalJs('new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))');
    const rm1 = await app.evalJs(READ);
    // PARKED 2026-11-06, never run (SUPERSEDED by Fable's ruling (c): the swap reads by opacity now, not display). Original, verbatim:
    // ok('W6 reduced motion: nothing on the shade animates at rest; the first key swaps; nothing animates after it', rm0.running === 0 && stillOk(rm1.room) && rm1.running === 0, JSON.stringify({ rest: { running: rm0.running }, key: { running: rm1.running, room: rm1.room } }));
    // SUCCESSOR W6c: under reduced motion nothing on the shade animates at rest; the first key is a CUT (in its own frames the still picture is
    // at strength and the live drawing at 0, no cross-fade running); nothing animates after it.
    ok('W6c reduced motion: nothing on the shade animates at rest; the first key is a cut to the still picture; nothing animates after it',
      rm0.running === 0 && !!rm1.room && Math.abs(rm1.room.stillO - rm1.room.stillA) < 0.001 && rm1.room.liveO === 0 && rm1.running === 0, JSON.stringify({ rest: { running: rm0.running }, key: { running: rm1.running, room: rm1.room } }));
  } finally { await app.emulateMedia([]); }
  // W8: the flash held, two masks, one moment
  const pageId = (await app.evalJs('location.hash')).replace(/^#\/page\//, '');
  await app.goto('/');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before seed' });
  await app.evalJs("localStorage.setItem('wrizo-writing-settings', JSON.stringify({ ...JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'), progress: 'words', progressStyle: 'rhizome' }))");
  await app.evalJs(`(() => { window.wrizoSetWritingGoal(${JSON.stringify({ n: 8, unit: 'words' })}); window.wrizoPatchEntry(${JSON.stringify(pageId)}, { text: 'light kettle street table question morning dog' }); })()`);
  await app.reload();
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(pageId)}`);
  await app.waitFor("!!document.querySelector('.wz-rhizome-field')", { label: 'rhizome field', timeout: 10000 }).catch(() => {});
  await backToRest(app);
  await app.evalJs("(() => { const e = document.querySelector('.forward-only-editor'); e.focus(); const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()");
  await app.typeKeys(' word');
  await app.waitFor("document.querySelector('.arbor2-vines-flash')?.getAttribute('data-mask') === 'bitmap'", { label: 'flash, bitmap mask', timeout: 4000 }).catch(() => {});
  await sleep(300);
  await app.evalJs("(() => { document.getAnimations().forEach((a) => { try { if (a.effect && Number.isFinite(a.effect.getComputedTiming().endTime)) a.finish(); else a.pause(); } catch {} }); return true; })()");
  await sleep(300);
  const maskWas = await app.evalJs("document.querySelector('.arbor2-vines-flash')?.getAttribute('data-mask') ?? null");
  const shotA = await app.screenshot();
  await app.evalJs("(() => { const f = document.querySelector('.arbor2-vines-flash'); if (!f) return false; f.style.maskImage = 'none'; f.style.webkitMaskImage = 'none'; f.querySelector(':scope > g')?.setAttribute('mask', 'url(#wz-rhizome-mask)'); return true; })()");
  await app.evalJs('new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))'); await sleep(200);
  const shotB = await app.screenshot();
  const cmp = await app.evalJs(`(async () => { const load = (b64) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = 'data:image/png;base64,' + b64; });
    const [a, b] = await Promise.all([load(${JSON.stringify(shotA)}), load(${JSON.stringify(shotB)})]); const w = a.naturalWidth, h = a.naturalHeight;
    const px = (img) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.drawImage(img, 0, 0); return g.getImageData(0, 0, w, h).data; };
    const A = px(a), B = px(b); let max = 0, over = 0, diff = 0;
    for (let i = 0; i < A.length; i += 4) { const d = Math.max(Math.abs(A[i] - B[i]), Math.abs(A[i + 1] - B[i + 1]), Math.abs(A[i + 2] - B[i + 2])); if (d) diff++; if (d > 9) over++; if (d > max) max = d; }
    return { w, h, n: w * h, diff, over, max }; })()`);
  ok('W8 the flash copy\'s pre-rendered mask: the flash held on one page, the bitmap mask against the SVG mask it replaces - over 9 levels on no more than 0.01% of the pixels',
    maskWas === 'bitmap' && !!cmp && cmp.over <= cmp.n * 0.0001, JSON.stringify({ maskWas, ...cmp, overPct: cmp ? Math.round((cmp.over / cmp.n) * 1e6) / 1e4 : null }));
  const fin = await app.evalJs(READ);
  ok('W7 nothing stored: localStorage holds no key or value naming the swap', !/arbor2-(still|live)|swap/.test(fin.ls), fin.ls.length);
  return checks;
}, { label: 'arbor2-swap' });

if (!pinned) checks.unshift({ name: 'W0 the run is pinned to the day room (WS_URL_SEARCH carries arbor2=1 and arbor2room=day)', pass: false, detail: q });
// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.length === 8 && checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nARBOR2-SWAP VERIFY: PASS (${checks.length} checks)` : `\nARBOR2-SWAP VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
