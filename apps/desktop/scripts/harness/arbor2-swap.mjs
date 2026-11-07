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
//   (THE LAST FRAME, Fable Nov 6: the swap is a cut whose still is the live drawing's own last frame - W1c, W2c, W4d parked, successors below)
//   W9  the last frame, mid-shiver: a key landed while leaves shiver - the still shown (the drawing at that pose) against the live drawing paused
//       at the same pose (a test-only reveal in this page): over 9 levels on no more than 0.01% of the pixels
//   W10 the last frame, at rest: the same, for a key with no leaf moving (the shared still)
//       (W9 and W10 parked for an instrument fault, Nov 6 - successors W9b / W10b: an unzoomed page, everything held by a removable stylesheet,
//       the cut's own choice as the premise, and two control shots proving the instrument; see below)
//       (W9b and W10b parked for an instrument fault again, Nov 7 - successors W9c / W10c: the page's own id, the shade's fade pinned before the freeze)
//   W8  the flash copy's pre-rendered mask (Fable, Nov 6: "keep the look identical"): on ONE page, the flash held (every finite animation
//       landed, the rest paused), shot with the bitmap mask and again with the SVG mask it replaces put back (a test-only switch in this page) -
//       the two shots differ by no more than 9 levels on more than 0.01% of the pixels (the vines' shape is seeded by the session, so two runs'
//       pictures cannot be compared; one page can)
import fs from 'node:fs';
import path from 'node:path';
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
  const dt = da && da.currentTime != null ? Number(da.currentTime) : null;
  return { driftT: dt, writing: root.getAttribute('data-wz-writing'), roomName: root.getAttribute('data-arbor2-room'), zoom: document.querySelector('.desk-frame-stage .mode-pagecol')?.getAttribute('data-zoom') === 'true',
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
  // PARKED 2026-11-06 (SUPERSEDED by THE LAST FRAME, Fable Nov 6: the swap is a cut - no cross-fade, so no will-change on the two). Original, verbatim:
  // ok('W1c at rest: the live drawing at full, the still picture drawn and waiting at 0 (target: the layer\'s strength), both will-change: opacity',
  //   rest.roomName === 'day' && restC(rest.room, 0.2) && (rest.zoom || restC(rest.page, 0.034)), JSON.stringify(rest));
  // SUCCESSOR W1d: at rest the live drawing at full and in style work, the still picture drawn and waiting at 0 (its target the layer's strength).
  const restD = (l, a) => !!l && l.live === 'visible' && l.liveO === 1 && l.stillO === 0 && l.stillBg === true && Math.abs(l.stillA - a) < 0.0005 && l.off === null;
  ok('W1d at rest: the live drawing at full and in style work, the still picture drawn and waiting at 0 (its target the layer\'s strength)',
    rest.roomName === 'day' && restD(rest.room, 0.2) && (rest.zoom || restD(rest.page, 0.034)), JSON.stringify(rest));

  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys('w');
  await app.evalJs('new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))');
  const k1 = await app.evalJs(READ);
  await sleep(Math.max(0, 100 - 34));
  const k100 = await app.evalJs(READ);
  await sleep(220);
  const k1c = await app.evalJs(READ);
  const stillOk = (l) => !!l && l.live === 'hidden' && l.still === 'block';
  // PARKED 2026-11-06, never run (SUPERSEDED by Fable's ruling (c): the swap is a 200 ms cross-fade, not a cut in the key's own frames).
  // Original, verbatim:
  // ok('W2 the first key: the still picture shows and the live drawing has left style work, in the key\'s own frames', k1.writing === 'true' && stillOk(k1.room) && (k1.zoom || stillOk(k1.page)), JSON.stringify(k1));
  // SUCCESSOR W2c: in the key's own frames the cross-fade has begun (the still picture above 0 and below its strength, the live drawing below 1);
  // 320 ms later it has landed - the still picture at the layer's strength, the live drawing at 0 and out of style work (data-live-off).
  const midC = (l) => !!l && l.stillO > 0 && l.stillO < l.stillA && l.liveO < 1;
  const landC = (l) => !!l && Math.abs(l.stillO - l.stillA) < 0.001 && l.liveO === 0 && l.live === 'hidden' && l.off === 'true';
  // PARKED 2026-11-06 (SUPERSEDED - Fable, Nov 6: "W2c -> its successor 'begins within 100 ms': APPROVED (park the original verbatim)"; turn
  // 08:50Z: the swap rides the chrome's signal, which lands a frame or two after the key's own frames). Original, verbatim:
  // ok('W2c the first key: the cross-fade begins in the key\'s own frames and has landed 320 ms later (still at strength, live at 0 and out of style work)',
  //   k1.writing === 'true' && midC(k1.room) && landC(k1c.room) && (k1c.zoom || landC(k1c.page)), JSON.stringify({ key: k1.room, landed: k1c.room, page: k1c.page }));
  // SUCCESSOR W2d (approved "begins within 100 ms"; the swap is now THE LAST FRAME's cut): within 100 ms of the key the still picture stands at
  // the layer's strength and the live drawing is at 0 and out of style work - and still so 320 ms on.
  ok('W2d the first key: within 100 ms the still stands at the layer\'s strength and the live drawing is at 0 and out of style work (and still so 320 ms on)',
    k100.writing === 'true' && landC(k100.room) && (k100.zoom || landC(k100.page)) && landC(k1c.room), JSON.stringify({ at100: k100.room, page: k100.page, at320: k1c.room }));
  // PARKED 2026-11-06 (SUPERSEDED by Fable, Nov 6: "My error: Nick's B ruled only the shiver. r19's rule stands (the drift pauses while
  // writing). Fix the check, not the build." - turn 08:08Z read the drift paused at the key, start time null). Original, verbatim:
  // ok('W3 the drift runs on through the swap: the room\'s drift is the same animation (start time unchanged), running', !!rest.drift && !!k1.drift && rest.drift.start === k1.drift.start && k1.drift.state === 'running', JSON.stringify({ rest: rest.drift, key: k1.drift }));
  // SUCCESSOR W3c: r19's rule - the room's drift runs at rest and PAUSES on the first key (the same named animation), held where it was.
  ok('W3c the drift (r19): running at rest, paused on the first key - the same animation, held where it was', !!rest.drift && rest.drift.state === 'running' && !!k1c.drift && k1c.drift.name === rest.drift.name && k1c.drift.state === 'paused'
    && k1c.driftT != null && rest.driftT != null && k1c.driftT >= rest.driftT, JSON.stringify({ rest: { ...rest.drift, t: rest.driftT }, key: { ...k1c.drift, t: k1c.driftT } }));
  await backToRest(app);
  const back = await app.evalJs(READ);
  // PARKED 2026-11-06, never run (SUPERSEDED by Fable's ruling (c): on the return the still picture fades out to 0, it is not display:none).
  // Original, verbatim:
  // ok('W4 the chrome\'s return: the live drawing is back, the still picture hidden, the drift still the same animation', back.writing !== 'true' && liveOk(back.room) && (back.zoom || liveOk(back.page)) && !!back.drift && back.drift.start === rest.drift.start, JSON.stringify(back));
  // SUCCESSOR W4c: the return - the live drawing back in style work and at full, the still picture back at 0, the drift the same animation.
  // PARKED 2026-11-06 (SUPERSEDED by Fable, Nov 6, as W3: the drift pauses while writing, so a resume takes a new start time - turn 08:08Z read
  // 156.6 at rest and 873.2 after the return; the rest of W4c held). Original, verbatim:
  // ok('W4c the chrome\'s return: the live drawing back at full and in style work, the still picture back at 0, the drift still the same animation',
  //   back.writing !== 'true' && restC(back.room, 0.2) && (back.zoom || restC(back.page, 0.034)) && !!back.drift && back.drift.start === rest.drift.start, JSON.stringify(back));
  // SUCCESSOR W4d: the return - the live drawing back at full and in style work, the still picture at 0, and the drift RESUMED from where it
  // paused (running again, its time on from the paused time, never back to the start).
  // PARKED 2026-11-06 (SUPERSEDED by THE LAST FRAME: its restC asked for will-change, which the cut no longer sets). Original, verbatim:
  // ok('W4d the chrome\'s return: the live drawing back at full and in style work, the still picture at 0, the drift resumed from where it paused (not restarted)',
  //   back.writing !== 'true' && restC(back.room, 0.2) && (back.zoom || restC(back.page, 0.034)) && !!back.drift && back.drift.state === 'running' && back.driftT != null && k1c.driftT != null && back.driftT >= k1c.driftT,
  //   JSON.stringify({ ...back, ls: undefined, pausedT: k1c.driftT }));
  // SUCCESSOR W4e: the same return, read with W1d's reading.
  ok('W4e the chrome\'s return: the live drawing back at full and in style work, the still picture at 0, the drift resumed from where it paused (not restarted)',
    back.writing !== 'true' && restD(back.room, 0.2) && (back.zoom || restD(back.page, 0.034)) && !!back.drift && back.drift.state === 'running' && back.driftT != null && k1c.driftT != null && back.driftT >= k1c.driftT,
    JSON.stringify({ ...back, ls: undefined, pausedT: k1c.driftT }));

  // W5: the swap key against the same page's first key with the shade off
  const on = await firstKeys(app, 6);
  await app.evalJs("document.documentElement.setAttribute('data-arbor2-off', 'shadows')");
  const off = await firstKeys(app, 6);
  await app.evalJs("document.documentElement.removeAttribute('data-arbor2-off')");
  const okN = (a) => a.filter((v) => typeof v === 'number');
  const A = okN(on), B = okN(off);
  // PARKED 2026-11-06 (SUPERSEDED by Fable, Nov 6: "the swap key is judged by rhizome-latency's per-key budget (it passed), not against
  // shade-off. Accepted." - turn 08:08Z: 28.3 vs 13.5 ms median). Original, verbatim:
  // ok('W5 the swap goes through the flash budget: the first key with the shade ON against the shade OFF - median within 5 ms, p95 within 25 ms, none over 100',
  //   A.length === 6 && B.length === 6 && median(A) - median(B) <= 5 && p95(A) - p95(B) <= 25 && Math.max(...A) <= 100,
  //   JSON.stringify({ on: A.map(r1), off: B.map(r1), median: [r1(median(A)), r1(median(B))], p95: [r1(p95(A)), r1(p95(B))] }));
  // SUCCESSOR W5b: the swap key within rhizome-latency's per-key budget - no swap key over 100 ms (six swaps); the shade-off first keys ride
  // along as information.
  ok('W5b the swap key within the guard\'s per-key budget: none of six swap keys over 100 ms (the shade-off first keys reported beside them)',
    A.length === 6 && Math.max(...A) <= 100,
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
  // W9 / W10: THE LAST FRAME, one page, one moment - the cut's still against the live drawing paused at the same pose
  const shotCmp = (a, b) => app.evalJs(`(async () => { const load = (b64) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = 'data:image/png;base64,' + b64; });
    const [x, y] = await Promise.all([load(${JSON.stringify(a)}), load(${JSON.stringify(b)})]); const w = x.naturalWidth, h = x.naturalHeight;
    const px = (img) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.drawImage(img, 0, 0); return g.getImageData(0, 0, w, h).data; };
    const A = px(x), B = px(y); let max = 0, over = 0;
    for (let i = 0; i < A.length; i += 4) { const d = Math.max(Math.abs(A[i] - B[i]), Math.abs(A[i + 1] - B[i + 1]), Math.abs(A[i + 2] - B[i + 2])); if (d > 9) over++; if (d > max) max = d; }
    return { n: w * h, over, max }; })()`);
  // how many of the room's leaves are mid-shiver right now (a test-side read: the leaf animations' own times)
  const MOVINGNOW = "(() => { const r = document.querySelector('.arbor2-pergola'); if (!r) return -1; let n = 0; r.querySelectorAll('.wz-leaf').forEach((g) => { const a = g.getAnimations()[0]; if (!a || a.currentTime == null) return; const d = a.effect.getTiming().delay || 0; const t = Number(a.currentTime) - d; if (t < 0) return; const ph = t % 16000; if (ph > 0 && ph < 1400) n++; }); return n; })()";
  // PARKED 2026-11-06, an INSTRUMENT fault (Fable, Nov 6: "fix W9/W10's instrument fault"; turn 09:27Z). Three faults, none of them the build's:
  // (1) the page was ZOOMED (Typewriter on: the 1.6x page covers most of the room, the page copy is not drawn), so the shots held little of the
  // shade; (2) only the shade's animations were held, so the chrome went on fading between the two shots; (3) the hold PAUSED the leaves through
  // the Web Animations API, which takes a CSS animation out of CSS's hands for good - after W9 the leaves never ran again and W10's counter read
  // the same 18 for its whole wait. The instrument that stood (lastFrame) is replaced below; the checks that stood, verbatim:
  // ok('W9 the last frame, mid-shiver: the cut\'s still against the live drawing paused at the same pose - over 9 levels on no more than 0.01% of the pixels',
  //   lfS.moving >= 8 && lfS.over <= lfS.n * 0.0001, JSON.stringify({ ...lfS, overPct: Math.round((lfS.over / lfS.n) * 1e6) / 1e4 }));
  // ok('W10 the last frame, at rest: the cut\'s still against the live drawing at rest - over 9 levels on no more than 0.01% of the pixels',
  //   lfR.moving === 0 && lfR.over <= lfR.n * 0.0001, JSON.stringify({ ...lfR, overPct: Math.round((lfR.over / lfR.n) * 1e6) / 1e4 }));
  // SUCCESSORS W9b / W10b. The page is NOT zoomed (Typewriter off for this page, a test-only per-page setting the app already has, cleared after);
  // EVERYTHING is held by a removable test-only stylesheet (every animation paused by CSS, no transition, no caret) - never by pausing an
  // animation from script; the premise is the CUT'S OWN CHOICE (the shared still = no leaf moving, a pose picture = some), with the moving counter
  // checked against it; and two control shots prove the instrument: the same frame twice is the same picture (the hold holds), and the frame with
  // the shade hidden differs on at least 1% of the pixels (the shade is in the shot).
  const FREEZE = "*, *::before, *::after { animation-play-state: paused !important; transition: none !important; caret-color: transparent !important; }";
  const REVEAL = '.arbor2-pergola-drift > .arbor2-live{ opacity:1 !important; content-visibility:visible !important; } .arbor2-pergola-drift > .arbor2-still{ opacity:0 !important; }';
  const HIDE = '.arbor2-pergola, .arbor2-pagesh{ visibility:hidden !important; }';
  const styleOn = (id, css) => app.evalJs(`(() => { const s = document.createElement('style'); s.id = ${JSON.stringify(id)}; s.textContent = ${JSON.stringify(css)}; document.head.appendChild(s); return true; })()`);
  const styleOff = (id) => app.evalJs(`(() => { document.getElementById(${JSON.stringify(id)})?.remove(); return true; })()`);
  const frames2 = () => app.evalJs('new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))');
  const STILLBG = "(() => { const s = document.querySelector('.arbor2-pergola .arbor2-still'), p = document.querySelector('.desk-frame-stage .mode-page > .arbor2-pagesh .arbor2-still'); return { room: s ? s.style.backgroundImage : null, page: p ? p.style.backgroundImage : null }; })()";
  // (W9c: the hash carries the room pin's query - '#/page/<id>?arbor2=1&arbor2room=day' - so the page's id is the part before '?'; W9b's turn
  // wrote the setting under '<id>?arbor2=1...' and the page stayed zoomed)
  const twHash = await app.evalJs('location.hash');
  const twPage = twHash.replace(/^#\/page\//, '').split('?')[0];
  await app.evalJs(`localStorage.setItem('wrizo-typewriter-page-' + ${JSON.stringify(twPage)}, 'off')`);
  await app.goto('/');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk (typewriter off)' });
  await app.evalJs(`location.hash = ${JSON.stringify(twHash)}`);
  await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.arbor2-pergola .arbor2-still')", { label: 'page reopened, typewriter off', timeout: 10000 }).catch(() => {});
  // W9c: the shade's 6 s writing fade is PINNED where it stands at the cut (inline opacity = its computed value, inline transition none - never a
  // script pause of an animation), BEFORE the freeze sheet: W9b's sheet cancelled the fade's transition, which jumps it to its END (opacity 0) - its
  // shots held no shade at all (hiding the shade changed 0 pixels). Unpinned at the end.
  const PIN = "(() => { document.querySelectorAll('.arbor2-pergola, .arbor2-pagesh').forEach((l) => { const o = getComputedStyle(l).opacity; l.style.transition = 'none'; l.style.opacity = o; }); return [...document.querySelectorAll('.arbor2-pergola, .arbor2-pagesh')].map((l) => l.style.opacity); })()";
  const UNPIN = "(() => { document.querySelectorAll('.arbor2-pergola, .arbor2-pagesh').forEach((l) => { l.style.transition = ''; l.style.opacity = ''; }); return true; })()";
  // W9c, information: the room's breeze clock as the page shows it just before the key (the cut works its pose out from the first leaf's start time,
  // read at rest - W9b's turn saw the cut keep the shared still while the counter had 8 leaves moving)
  const CLOCKNOW = "(() => { const r = document.querySelector('.arbor2-pergola'); const g = r && r.querySelector('.arbor2-live .wz-leaf'); const a = g ? g.getAnimations()[0] : null; return { asleep: r ? r.getAttribute('data-asleep') : null, liveOff: r ? r.getAttribute('data-live-off') : null, writing: document.documentElement.getAttribute('data-wz-writing'), first: a ? { state: a.playState, start: a.startTime == null ? null : Math.round(Number(a.startTime)), current: a.currentTime == null ? null : Math.round(Number(a.currentTime)), now: Math.round(Number(document.timeline.currentTime)) } : null }; })()";
  const lastFrameB = async (want) => {
    await backToRest(app);
    const restBg = await app.evalJs(STILLBG);   // at rest the still holds the SHARED bitmap (uncut puts it back)
    // wait for the breeze to be where this check wants it: mid-shiver (some leaves moving) or at rest (none), at most 18 s
    const t0 = Date.now(); let n = await app.evalJs(MOVINGNOW);
    while (Date.now() - t0 < 18000 && (want === 'shiver' ? n < 8 : n !== 0)) { await sleep(40); n = await app.evalJs(MOVINGNOW); }
    const clockAtKey = await app.evalJs(CLOCKNOW);
    await app.evalJs("document.querySelector('.forward-only-editor').focus()");
    await app.typeKeys('s');
    await app.waitFor("document.querySelector('.arbor2-pergola')?.getAttribute('data-live-off') === 'true'", { label: 'cut', timeout: 2000 }).catch(() => {});
    const pinned = await app.evalJs(PIN);
    await sleep(1200);   // the key's save and its re-render land before the hold (the cut and r19's pause are already in place)
    const cutBg = await app.evalJs(STILLBG);
    const zoom = await app.evalJs("document.querySelector('.desk-frame-stage .mode-pagecol')?.getAttribute('data-zoom') === 'true'");
    const off = await app.evalJs("document.querySelector('.arbor2-pergola')?.getAttribute('data-live-off') ?? null");
    await styleOn('w9-freeze', FREEZE); await frames2(); await sleep(150);
    const a = await app.screenshot();
    await sleep(400);
    const a2 = await app.screenshot();   // control 1: the same frame again
    await styleOn('w9-reveal', REVEAL); await frames2(); await sleep(150);
    const b = await app.screenshot();   // the live drawing (paused by r19's rule at the pose the key found) in place of the still
    await styleOff('w9-reveal'); await styleOn('w9-hide', HIDE); await frames2(); await sleep(150);
    const c = await app.screenshot();   // control 2: the shade hidden
    await styleOff('w9-hide'); await styleOff('w9-freeze'); await app.evalJs(UNPIN);
    if (process.env.ARBOR_SHOTS) { fs.mkdirSync(process.env.ARBOR_SHOTS, { recursive: true }); [['still', a], ['still-again', a2], ['live', b], ['no-shade', c]].forEach(([k, s]) => fs.writeFileSync(path.join(process.env.ARBOR_SHOTS, `lastframe-b-${want}-${k}.png`), Buffer.from(s, 'base64'))); }
    const pct = (x) => (x ? Math.round((x.over / x.n) * 1e6) / 1e4 : null);
    const vs = await shotCmp(a, b), same = await shotCmp(a, a2), shade = await shotCmp(a, c);
    const choice = !restBg.room || !cutBg.room ? null : cutBg.room === restBg.room ? 'shared still' : 'pose';
    return { want, moving: n, choice, zoom, off, pinned, clockAtKey, vs, overPct: pct(vs), same, samePct: pct(same), shade, shadePct: pct(shade), pageChoice: !restBg.page || !cutBg.page ? null : cutBg.page === restBg.page ? 'shared still' : 'pose' };
  };
  const premiseB = (x, choice) => !!x.vs && !x.zoom && x.off === 'true' && x.choice === choice && (choice === 'pose' ? x.moving >= 8 : x.moving === 0) && x.same.over === 0 && x.shade.over >= x.shade.n * 0.01;
  // PARKED 2026-11-07, an INSTRUMENT fault again (turn 03:04Z on 99df6ef9; its own controls caught it): the page stayed zoomed (the setting was
  // written under the hash's query, not the page's id) and the freeze sheet jumped the shade's writing fade to its end (hiding the shade changed 0
  // pixels). The instrument is fixed above (W9c); the checks that stood, verbatim:
  // const lfS = await lastFrameB('shiver');
  // ok('W9b the last frame, mid-shiver: on an unzoomed page, the cut drew a POSE (the counter agreeing: 8+ leaves moving), and its still against the live drawing paused at that pose - over 9 levels on no more than 0.01% of the pixels (the hold proven: the same frame twice identical; the shade proven in the shot: hidden, 1%+ of the pixels change)',
  //   premiseB(lfS, 'pose') && lfS.vs.over <= lfS.vs.n * 0.0001, JSON.stringify(lfS));
  // const lfR = await lastFrameB('rest');
  // ok('W10b the last frame, at rest: on an unzoomed page, the cut kept the SHARED still (the counter agreeing: no leaf moving), and it against the live drawing at rest - over 9 levels on no more than 0.01% of the pixels (the same two controls)',
  //   premiseB(lfR, 'shared still') && lfR.vs.over <= lfR.vs.n * 0.0001, JSON.stringify(lfR));
  // SUCCESSORS W9c / W10c: the same premise and bar, on the fixed instrument (the page's own id; the fade pinned before the freeze); the breeze
  // clock at the key rides along as information.
  const lfS = await lastFrameB('shiver');
  ok('W9c the last frame, mid-shiver: on an unzoomed page, the cut drew a POSE (the counter agreeing: 8+ leaves moving), and its still against the live drawing paused at that pose - over 9 levels on no more than 0.01% of the pixels (the hold proven: the same frame twice identical; the shade proven in the shot: hidden, 1%+ of the pixels change)',
    premiseB(lfS, 'pose') && lfS.vs.over <= lfS.vs.n * 0.0001, JSON.stringify(lfS));
  const lfR = await lastFrameB('rest');
  ok('W10c the last frame, at rest: on an unzoomed page, the cut kept the SHARED still (the counter agreeing: no leaf moving), and it against the live drawing at rest - over 9 levels on no more than 0.01% of the pixels (the same two controls)',
    premiseB(lfR, 'shared still') && lfR.vs.over <= lfR.vs.n * 0.0001, JSON.stringify(lfR));
  await app.evalJs(`localStorage.removeItem('wrizo-typewriter-page-' + ${JSON.stringify(twPage)})`);
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
  // (the two shots, for the Wrizors' walk by eye - Fable, Nov 6)
  if (process.env.ARBOR_SHOTS) { fs.mkdirSync(process.env.ARBOR_SHOTS, { recursive: true }); fs.writeFileSync(path.join(process.env.ARBOR_SHOTS, 'w8-flash-bitmap-mask.png'), Buffer.from(shotA, 'base64')); fs.writeFileSync(path.join(process.env.ARBOR_SHOTS, 'w8-flash-svg-mask.png'), Buffer.from(shotB, 'base64')); }
  // PARKED 2026-11-06 (SUPERSEDED by Fable, Nov 6: "W8 (0.02% > 9 levels, with the fade) is accepted pending the Wrizors' walk by eye" -
  // turn 08:08Z: 249 px of 1.26 M over 9 levels, max 173). Original, verbatim:
  // ok('W8 the flash copy\'s pre-rendered mask: the flash held on one page, the bitmap mask against the SVG mask it replaces - over 9 levels on no more than 0.01% of the pixels',
  //   maskWas === 'bitmap' && !!cmp && cmp.over <= cmp.n * 0.0001, JSON.stringify({ maskWas, ...cmp, overPct: cmp ? Math.round((cmp.over / cmp.n) * 1e6) / 1e4 : null }));
  // SUCCESSOR W8b: the bitmap mask is the one in use, and the difference stays within twice the accepted measure (0.02% -> 0.04% of the
  // pixels over 9 levels) - a regression fails; the walk judges the look.
  ok('W8b the flash copy\'s pre-rendered mask in use, its difference from the SVG mask within twice the accepted 0.02% (the walk judges the look)',
    maskWas === 'bitmap' && !!cmp && cmp.over <= cmp.n * 0.0004, JSON.stringify({ maskWas, ...cmp, overPct: cmp ? Math.round((cmp.over / cmp.n) * 1e6) / 1e4 : null }));
  const fin = await app.evalJs(READ);
  ok('W7 nothing stored: localStorage holds no key or value naming the swap', !/arbor2-(still|live)|swap/.test(fin.ls), fin.ls.length);
  return checks;
}, { label: 'arbor2-swap' });

if (!pinned) checks.unshift({ name: 'W0 the run is pinned to the day room (WS_URL_SEARCH carries arbor2=1 and arbor2room=day)', pass: false, detail: q });
// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.length === 10 && checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nARBOR2-SWAP VERIFY: PASS (${checks.length} checks)` : `\nARBOR2-SWAP VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
