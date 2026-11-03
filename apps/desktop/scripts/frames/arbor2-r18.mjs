// ARBOR v2 MOCKUP, ROUND r18 - NICK'S SPLASH CHANGES, as named screens for INK's frames job (-f themes=plateau
// -f screens_file=apps/desktop/scripts/frames/arbor2-r18.mjs). Source: Fable, Nov 2-3:
//   1. Erase ONLY the "WRIZO (in abstract)" line at the top of Nick's drawing (never redraw anything else); the hand-drawn logo (with its
//      write-out) goes there, at the top, with "For humans who write." under it (stand-in type until Nick's lettering).
//   2. The doors become hand-drawn boxes INSIDE the drawing, "Write" and "Log in"; a signed-in writer sees "Write" + "Open". Log in opens the
//      existing sign-in form (-> sign-up with the invite code).
//   3. The boxes animate in LAST, after the logo.
//   4. No click within 5 s -> their brass outline re-emphasises once (a gentle brightening, never a flash, <= 3 changes/s), then again every
//      30 s; it stops for good once the writer acts. Reduced motion = a static full-strength brass outline.
//   5. Enter = Write.   + Arbor's Room "?" onto the Themes row. The in-app corner mark is unchanged.
// The erased line itself is proven pixel by pixel in scripts/harness/arbor2-r18-unit.mjs. A visitor is played with CDP Fetch (/auth/me ->
// 401), as r14. Every check THROWS with its numbers when it fails and prints them when it passes ("ARBOR-R18 <screen> {...}"); the kit's
// verdict guard reds a crash or a silent check. Written red-first: run against r17 rebased (0f258d1c) before the r18 build.
import { guarded } from './mockup-kit.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const say = (name, data) => console.log(`ARBOR-R18 ${name} ${JSON.stringify(data)}`);
const fail = (name, data) => { console.log(`ARBOR-R18-FAIL ${name} ${JSON.stringify(data)}`); throw new Error(`${name} FAILED ${JSON.stringify(data)}`.slice(0, 1200)); };
const CW = 3374, CH = 2699;
const HOLD = "localStorage.setItem('wrizo-splash-hold', '9000'); localStorage.setItem('wrizo-splash-force-not-ready', '1')";
const UNHOLD = "localStorage.setItem('wrizo-splash-hold', '50'); localStorage.removeItem('wrizo-splash-force-not-ready')";

// ---- a signed-out visitor, for one screen (r14's double: /auth/me answers 401; login / register pass through) ----
const anon = async (app) => {
  await app.cdp('Fetch.enable', { patterns: [{ urlPattern: '*/auth/me*' }] });
  const off = app.tap((method, p) => {
    if (method !== 'Fetch.requestPaused') return;
    if (/\/auth\/me/.test(p.request.url)) app.cdp('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: 401, responseHeaders: [{ name: 'content-type', value: 'application/json' }], body: Buffer.from('{"error":"unauthorized"}').toString('base64') }).catch(() => {});
    else app.cdp('Fetch.continueRequest', { requestId: p.requestId }).catch(() => {});
  });
  return async () => { off(); await app.cdp('Fetch.disable').catch(() => {}); };
};
const load = async (app, { flag = true, room = null } = {}) => {
  await app.evalJs(`history.replaceState(null, '', ${JSON.stringify(flag ? '/?arbor2=1#/' : '/#/')})`);
  await app.reload();
  if (flag) await waitSoft(app, "document.documentElement.getAttribute('data-arbor2') === 'true'", { label: 'flag', timeout: 15000 });
  if (room) await app.evalJs(`document.documentElement.setAttribute('data-room', ${JSON.stringify(room === 'day' ? 'light' : 'dark')})`);
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 });
};
// the doors are in once their own entrance is done (they come after the splash and after the logo's writing)
const doorsShown = (app, timeout = 9000) => waitSoft(app, "document.querySelector('.arbor2-front-doors')?.getAttribute('data-phase') === 'shown'", { label: 'doors shown', timeout });
const rect = (sel) => `(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; })()`;
const FRONT = `(() => { const q = (s) => document.querySelector(s); const box = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
  const shown = (e) => { if (!e) return false; const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; for (let n = e; n; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.05) return false; } return true; };
  const mark = q('.arbor2-front-mark'); const base = mark ? mark.querySelector('svg image') : null;
  const doors = [...document.querySelectorAll('.arbor2-front-doors .arbor2-door')].map((d) => { const p = d.querySelector('path'); const cs = p ? getComputedStyle(p) : null;
    return { word: d.textContent.trim(), shown: shown(d), r: box(d), stroke: cs ? cs.stroke : null, so: cs ? Number(cs.strokeOpacity) : null, disabled: d.disabled }; });
  const logo = q('.arbor2-front-mark .arbor2-top-logo'), tag = q('.arbor2-front-mark .arbor2-top-tagline');
  return { route: location.hash, mark: box(mark), base: base ? base.getAttribute('href') : null, logo: box(logo), logoShown: shown(logo), logoPic: logo ? getComputedStyle(logo, '::before').backgroundImage : null,
    tag: tag ? { text: tag.textContent.trim(), r: box(tag), shown: shown(tag), font: getComputedStyle(tag).fontFamily } : null, doors, phase: q('.arbor2-front-doors')?.getAttribute('data-phase') ?? null,
    oldDoors: [...document.querySelectorAll('.arbor2-front-foot .wz-arrival-doors button, .arbor2-front-foot .wz-tagline')].filter(shown).map((b) => b.textContent.trim()),
    corner: [...document.querySelectorAll('.brand-mark')].filter(shown).length, signin: shown(q('input[autocomplete="current-password"]')),
    invite: shown([...document.querySelectorAll('input.wz-field')].find((i) => /invite/i.test(i.placeholder))), vw: innerWidth, vh: innerHeight }; })()`;
const clickDoor = (word) => `(() => { const b = [...document.querySelectorAll('.arbor2-front-doors .arbor2-door')].find((x) => x.textContent.trim() === ${JSON.stringify(word)}); if (b) b.click(); return !!b; })()`;
const clickText = (text) => `(() => { const b = [...document.querySelectorAll('button')].find((x) => (x.textContent || '').trim() === ${JSON.stringify(text)} && x.getBoundingClientRect().width > 0); if (b) b.click(); return !!b; })()`;
const inside = (a, b, t = 0.5) => !!a && !!b && a.l >= b.l - t && a.t >= b.t - t && a.r <= b.r + t && a.b <= b.b + t;
// a canvas rect (Nick's drawing's own px) on the screen, through the drawing's box
const onScreen = (m, x, y, w, h) => ({ l: m.l + (x / CW) * m.w, t: m.t + (y / CH) * m.h, r: m.l + ((x + w) / CW) * m.w, b: m.t + ((y + h) / CH) * m.h });
// the outline's strength, sampled every frame into window.__r18so until stopped (read back in pieces)
const SAMPLER = `(() => { window.__r18so = []; const p = document.querySelector('.arbor2-front-doors .arbor2-door path'); const t0 = performance.now();
  const f = () => { if (window.__r18stop) return; const q = document.querySelector('.arbor2-front-doors .arbor2-door path'); window.__r18so.push([Math.round(performance.now() - t0), q ? Number(getComputedStyle(q).strokeOpacity) : -1]); requestAnimationFrame(f); }; window.__r18stop = false; f(); return !!p; })()`;
const SEAM = "(() => { const s = window.wrizoArborFront; return s ? { logoStart: s.logoStart, logoDone: s.logoDone, doorsIn: s.doorsIn, shownAt: s.shownAt, pulses: [...s.pulses], acted: s.acted } : null; })()";
const analyse = (so, from, to) => { const w = so.filter(([t]) => t >= from && t < to).map(([, v]) => v); if (!w.length) return { n: 0 };
  let rev = 0, dir = 0, maxStep = 0; for (let i = 1; i < w.length; i++) { const d = w[i] - w[i - 1]; maxStep = Math.max(maxStep, Math.abs(d)); const s = Math.abs(d) < 1e-4 ? 0 : Math.sign(d); if (s && dir && s !== dir) rev++; if (s) dir = s; }
  return { n: w.length, min: Math.min(...w), max: Math.max(...w), first: w[0], last: w[w.length - 1], rev, maxStep: Math.round(maxStep * 1000) / 1000 }; };

const SCREENS = {
  // ── 1. THE LINE GONE: under the flag the drawing (splash and front door) is the r18 copy; flag off it is Nick's own picture, unchanged
  'r18-line-gone': async (app) => {
    const done = await anon(app);
    try {
      await load(app);
      const on = await app.evalJs(FRONT);
      await app.evalJs(HOLD); await app.evalJs("history.replaceState(null, '', '/?arbor2=1#/')"); await app.reload();
      await waitSoft(app, "!!document.querySelector('.wz-splash .wz-splash-arbor image')", { label: 'the splash drawing', timeout: 8000 });
      const splash = await app.evalJs("document.querySelector('.wz-splash .wz-splash-arbor image')?.getAttribute('href') ?? null");
      await app.evalJs(UNHOLD);
      await load(app, { flag: false });
      const offSplashless = await app.evalJs("document.querySelector('.wz-splash-arbor image, .arbor2-front-mark svg image')?.getAttribute('href') ?? null");
      await app.evalJs(HOLD); await app.evalJs("history.replaceState(null, '', '/#/')"); await app.reload();
      await waitSoft(app, "!!document.querySelector('.wz-splash .wz-splash-arbor image')", { label: 'the unflagged splash drawing', timeout: 8000 });
      const off = await app.evalJs("document.querySelector('.wz-splash .wz-splash-arbor image')?.getAttribute('href') ?? null");
      await app.evalJs(UNHOLD);
      const ok = { front: on.base === '/brand/arbor2/splash-base-r18.png', splash: splash === '/brand/arbor2/splash-base-r18.png', flagOffUntouched: off === '/brand/splash-arbor/base.png' };
      const brief = { ok, front: on.base, splash, off, offSplashless };
      if (Object.values(ok).some((x) => !x)) fail('R18-LINE-GONE', brief);
      say('r18-line-gone', brief);
    } finally { await app.evalJs(UNHOLD).catch(() => {}); await done(); }
  },
  // ── 2. THE LOGO AT THE TOP, where the line stood, the night copy, still on the front door; the tagline under it, above the PAGE heading;
  // no corner mark on the front door (the logo moved; in the app it stays)
  'r18-top': async (app) => {
    const done = await anon(app);
    try {
      await load(app); await doorsShown(app);
      const s = await app.evalJs(FRONT);
      const m = s.mark;
      const lineBand = m && onScreen(m, 1670 - 300, 0, 1030 + 600, 300);
      const pageInk = m && (m.t + (338 / CH) * m.h);   // the PAGE heading's first ink row under the tagline's span (measured on the drawing)
      const ok = {
        logo: s.logoShown && /wrizo-logo-night\.png/.test(s.logoPic || ''),
        logoWhereTheLineStood: inside(s.logo, lineBand, 1),
        tagline: !!s.tag && s.tag.shown && s.tag.text === 'For humans who write.',
        taglineUnder: !!s.tag && !!s.logo && s.tag.r.t >= s.logo.b - 1 && s.tag.r.b <= pageInk + 0.5 && inside(s.tag.r, m, 0.5),
        noCorner: s.corner === 0,
      };
      const brief = { ok, mark: m, logo: s.logo, tag: s.tag, lineBand, pageInk, corner: s.corner };
      if (Object.values(ok).some((x) => !x)) fail('R18-TOP', brief);
      say('r18-top', brief);
    } finally { await done(); }
  },
  // ── 3. THE DOORS, a visitor: two hand-drawn boxes INSIDE the drawing, Write then Log in, brass outlines, inside the window; the old foot doors
  // gone. Log in opens the existing sign-in form; "New here? Create an account" its sign-up with the invite code; back returns to the doors
  'r18-doors-anon': async (app) => {
    const done = await anon(app);
    try {
      await load(app); await doorsShown(app);
      const s = await app.evalJs(FRONT);
      const win = { l: 0, t: 0, r: s.vw, b: s.vh };
      const login = await app.evalJs(clickDoor('Log in')); await sleep(500);
      const si = await app.evalJs(FRONT);
      await app.evalJs(clickText('New here? Create an account')); await sleep(500);
      const acc = await app.evalJs(FRONT);
      await app.evalJs(clickText('← back')); await sleep(300); await app.evalJs(clickText('← back')); await sleep(600);
      const back = await app.evalJs(FRONT);
      const ok = {
        words: JSON.stringify(s.doors.map((d) => d.word)) === JSON.stringify(['Write', 'Log in']),
        shown: s.doors.length === 2 && s.doors.every((d) => d.shown),
        insideDrawing: s.doors.length === 2 && s.doors.every((d) => inside(d.r, s.mark) && inside(d.r, win)),
        brass: s.doors.length === 2 && s.doors.every((d) => d.stroke === 'rgb(255, 152, 0)'),
        oldDoorsGone: s.oldDoors.length === 0,
        loginOpensSignin: login && si.signin,
        signupHasInvite: acc.invite,
        backToDoors: back.doors.length === 2 && back.doors.every((d) => d.shown),
      };
      const brief = { ok, doors: s.doors.map((d) => [d.word, Math.round(d.r.l), Math.round(d.r.t), Math.round(d.r.w), Math.round(d.r.h), d.stroke, d.so]), mark: s.mark, old: s.oldDoors, signin: si.signin, invite: acc.invite };
      if (Object.values(ok).some((x) => !x)) fail('R18-DOORS-ANON', brief);
      say('r18-doors-anon', brief);
    } finally { await done(); }
  },
  // ── 3b. a signed-in writer (the double signs everyone in): Write + Open
  'r18-doors-authed': async (app) => {
    await load(app); await doorsShown(app);
    const s = await app.evalJs(FRONT);
    const ok = { words: JSON.stringify(s.doors.map((d) => d.word)) === JSON.stringify(['Write', 'Open']), insideDrawing: s.doors.length === 2 && s.doors.every((d) => inside(d.r, s.mark)) };
    const brief = { ok, doors: s.doors.map((d) => d.word) };
    if (Object.values(ok).some((x) => !x)) fail('R18-DOORS-AUTHED', brief);
    say('r18-doors-authed', brief);
  },
  // ── 4. THE ORDER: on the splash the logo writes out at the top (no door yet); the doors come LAST - after the splash and after the logo -
  // drawing themselves in; the logo's rect on the splash is the front door's (nothing moves at the hand-over)
  'r18-order': async (app) => {
    const done = await anon(app);
    try {
      await app.evalJs(HOLD); await app.evalJs("history.replaceState(null, '', '/?arbor2=1#/')"); await app.reload();
      await waitSoft(app, "!!document.querySelector('.wz-splash .arbor2-top-logo')", { label: 'the splash logo', timeout: 8000 });
      await sleep(600);
      const during = await app.evalJs(`(() => { const L = document.querySelector('.wz-splash .arbor2-top-logo'); const r = L ? L.getBoundingClientRect() : null;
        const doors = [...document.querySelectorAll('.arbor2-door')].filter((d) => { const q = d.getBoundingClientRect(); if (q.width < 1) return false; for (let n = d; n; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.05) return false; } return true; }).length;
        return { writing: L ? L.getAttribute('data-writing') : null, rect: r ? [r.left, r.top, r.width, r.height].map((v) => Math.round(v * 10) / 10) : null, doors, splash: !!document.querySelector('.wz-splash') }; })()`);
      // watch the hand-over: when the splash goes and when the doors' phase turns
      await app.evalJs(`(() => { window.__r18 = { splashGone: null, phases: [] }; const t0 = performance.now();
        const mo = new MutationObserver(() => { if (!document.querySelector('.wz-splash') && window.__r18.splashGone === null) window.__r18.splashGone = performance.now();
          const d = document.querySelector('.arbor2-front-doors'); const ph = d ? d.getAttribute('data-phase') : null; const last = window.__r18.phases[window.__r18.phases.length - 1];
          if (ph && (!last || last[0] !== ph)) window.__r18.phases.push([ph, performance.now(), document.getAnimations().filter((a) => d.contains(a.effect?.target)).map((a) => a.animationName)]); });
        mo.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-phase'] }); return true; })()`);
      await app.evalJs(UNHOLD);
      await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
      await doorsShown(app);
      const front = await app.evalJs(rect('.arbor2-front-mark .arbor2-top-logo'));
      const w = await app.evalJs('window.__r18'); const seam = await app.evalJs(SEAM);
      const inAt = (w.phases.find(([p]) => p === 'in') || [])[1] ?? null;
      const inAnims = (w.phases.find(([p]) => p === 'in') || [])[2] || [];
      const logoEnd = seam ? Math.max(seam.logoDone || 0, (seam.logoStart || 0) + 2000) : null;
      const ok = {
        logoWritesOnSplash: during.writing === 'true' && during.splash,
        noDoorDuringSplash: during.doors === 0,
        sameRect: !!during.rect && !!front && Math.abs(during.rect[0] - front.l) <= 0.5 && Math.abs(during.rect[1] - front.t) <= 0.5 && Math.abs(during.rect[2] - front.w) <= 0.5,
        doorsAfterSplash: inAt !== null && w.splashGone !== null && inAt >= w.splashGone - 1,
        doorsAfterLogo: inAt !== null && logoEnd !== null && seam.doorsIn >= logoEnd - 1,
        drawIn: inAnims.some((n) => /arbor2-door-draw/.test(n)),
      };
      const brief = { ok, during, front, splashGone: w.splashGone, phases: w.phases.map(([p, t, a]) => [p, Math.round(t), a.length]), seam };
      if (Object.values(ok).some((x) => !x)) fail('R18-ORDER', brief);
      say('r18-order', brief);
    } finally { await app.evalJs(UNHOLD).catch(() => {}); await done(); }
  },
  // ── 5. THE RE-EMPHASIS: no click for 5 s after the doors are in -> the outline brightens once and settles (smooth: no step over .06 a frame,
  // at most one rise and one fall, i.e. under 3 changes a second), steady before; again 30 s after (the seam's own pulse times, +-0.4 s)
  'r18-emphasis': async (app) => {
    const done = await anon(app);
    try {
      await load(app); await doorsShown(app);
      await app.evalJs(SAMPLER);
      const seam0 = await app.evalJs(SEAM);
      const t0 = await app.evalJs('performance.now()');
      const rel = (seam0.doorsIn ?? t0) - t0;   // where the doors came in, on the sampler's clock (negative: before it started)
      await sleep(Math.max(0, 8000 + rel));
      const first = await app.evalJs('window.__r18so.slice()');
      await sleep(Math.max(0, 30000));
      const seam = await app.evalJs(SEAM);
      const all = await app.evalJs('window.__r18so.slice()'); await app.evalJs('window.__r18stop = true');
      const base = analyse(first, Math.max(0, 1000 + rel), 4800 + rel), pulse = analyse(first, 4800 + rel, 8000 + rel), second = analyse(all, 34800 + rel, 38000 + rel);
      const at = (seam.pulses || []).map((p) => Math.round(p - seam.doorsIn));
      const ok = {
        steadyBefore: base.n > 20 && base.max - base.min < 0.01,
        brightensOnce: pulse.n > 20 && pulse.max >= base.max + 0.2 && pulse.last <= base.max + 0.03 && pulse.rev <= 1,
        gentle: pulse.maxStep <= 0.06,
        firstAt5s: at.length >= 1 && Math.abs(at[0] - 5000) <= 400,
        againAt35s: at.length >= 2 && Math.abs(at[1] - 35000) <= 400 && second.max >= base.max + 0.2,
      };
      const brief = { ok, base, pulse, second, at, rel: Math.round(rel) };
      if (Object.values(ok).some((x) => !x)) fail('R18-EMPHASIS', brief);
      say('r18-emphasis', brief);
    } finally { await app.evalJs('window.__r18stop = true').catch(() => {}); await done(); }
  },
  // ── 5b. it stops for good once the writer acts: a key 2 s after the doors are in -> no brightening at 5 s, none after
  'r18-act-stops': async (app) => {
    const done = await anon(app);
    try {
      await load(app); await doorsShown(app);
      await app.evalJs(SAMPLER);
      const seam0 = await app.evalJs(SEAM); const t0 = await app.evalJs('performance.now()'); const rel = (seam0.doorsIn ?? t0) - t0;
      await sleep(Math.max(0, 2000 + rel));
      await app.key('Shift');
      await sleep(7000);
      const so = await app.evalJs('window.__r18so.slice()'); await app.evalJs('window.__r18stop = true');
      const seam = await app.evalJs(SEAM);
      const after = analyse(so, 2500 + rel, 9000 + rel);
      const ok = { acted: seam.acted === true, noPulse: (seam.pulses || []).length === 0, steady: after.n > 20 && after.max - after.min < 0.01 };
      const brief = { ok, after, seam };
      if (Object.values(ok).some((x) => !x)) fail('R18-ACT-STOPS', brief);
      say('r18-act-stops', brief);
    } finally { await app.evalJs('window.__r18stop = true').catch(() => {}); await done(); }
  },
  // ── 6. REDUCED MOTION: the logo still on the splash, the doors there at once at full strength (stroke-opacity 1), nothing animating, no pulse
  'r18-reduced': async (app) => {
    const done = await anon(app);
    try {
      await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
      await app.evalJs("localStorage.setItem('wrizo-splash-hold', '6000'); localStorage.setItem('wrizo-splash-force-not-ready', '1')");
      await app.evalJs("history.replaceState(null, '', '/?arbor2=1#/')"); await app.reload();
      await waitSoft(app, "!!document.querySelector('.wz-splash .arbor2-top-logo')", { label: 'the splash logo', timeout: 8000 });
      const splashLogo = await app.evalJs("(() => { const L = document.querySelector('.wz-splash .arbor2-top-logo'); return L ? { writing: L.getAttribute('data-writing'), anims: document.getAnimations().filter((a) => L.contains(a.effect?.target) || a.effect?.target === L).length } : null; })()");
      await app.evalJs(UNHOLD);
      await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
      await doorsShown(app, 6000);
      await app.evalJs(SAMPLER); await sleep(7500);
      const so = await app.evalJs('window.__r18so.slice()'); await app.evalJs('window.__r18stop = true');
      const s = await app.evalJs(FRONT); const seam = await app.evalJs(SEAM);
      const anims = await app.evalJs("document.getAnimations().filter((a) => document.querySelector('.arbor2-front-doors')?.contains(a.effect?.target) || document.querySelector('.arbor2-front-mark .arbor2-top-logo')?.contains(a.effect?.target)).map((a) => a.animationName || a.transitionProperty)");
      const all = analyse(so, 0, 8000);
      const ok = { logoStill: !!splashLogo && splashLogo.writing === 'still' && splashLogo.anims === 0, fullStrength: s.doors.length === 2 && s.doors.every((d) => d.so === 1 && d.shown), still: all.n > 20 && all.min === 1 && all.max === 1, nothingAnimates: anims.length === 0, noPulse: (seam.pulses || []).length === 0 };
      const brief = { ok, splashLogo, doors: s.doors.map((d) => [d.word, d.so]), all, anims, pulses: seam.pulses };
      if (Object.values(ok).some((x) => !x)) fail('R18-REDUCED', brief);
      say('r18-reduced', brief);
    } finally { await app.emulateMedia([]); await app.evalJs(UNHOLD).catch(() => {}); await done(); }
  },
  // ── 7. ENTER = WRITE: on the front door, Enter (nothing focused) opens a new page, as the Write door does
  'r18-enter': async (app) => {
    const done = await anon(app);
    try {
      await load(app); await doorsShown(app);
      await app.evalJs("(() => { document.activeElement?.blur?.(); return true; })()");
      const before = await app.evalJs('location.hash');
      await app.key('Enter');
      const left = await waitSoft(app, "!document.querySelector('.wz-arrival') && /#\\/(page|project)\\//.test(location.hash)", { label: 'left for a page', timeout: 6000 });
      const after = await app.evalJs('location.hash');
      const ok = { leftForAPage: left };
      const brief = { ok, before, after };
      if (Object.values(ok).some((x) => !x)) fail('R18-ENTER', brief);
      say('r18-enter', brief);
    } finally { await done(); }
  },
  // ── 8. THE ROOM "?" ON THE THEMES ROW: in the Room row, guidance green (never brass), and it opens the room's note
  'r18-room-help': async (app) => {
    await app.evalJs("window.wrizoCreateJournalPage({ id: 'arbor-r18-help', text: 'The morning light came in low across the table.', createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })");
    await sleep(300);
    await app.evalJs("history.replaceState(null, '', '/?arbor2=1#/page/arbor-r18-help')"); await app.reload();
    await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 });
    await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'page' }); await sleep(800);
    await app.evalJs("document.querySelector(\".wz-strip-item[data-category='theme']\")?.click()"); await sleep(700);
    const read = `(() => { const row = [...document.querySelectorAll('.wz-theme-picker .mode-crow')].find((r) => r.querySelector(':scope > span')?.textContent.trim() === 'Room'); if (!row) return null;
      const q = row.querySelector('button.arbor2-room-help'); const probe = document.createElement('span'); probe.style.color = 'var(--help)'; row.appendChild(probe); const help = getComputedStyle(probe).color; probe.remove();
      const note = document.querySelector('.wz-theme-picker .arbor2-room-help-line');
      return { q: !!q, text: q ? q.textContent.trim() : null, color: q ? getComputedStyle(q).color : null, help, inSeg: !!(q && q.closest('.mode-seg')), note: note ? note.textContent.trim() : null }; })()`;
    const a = await app.evalJs(read);
    await app.evalJs("document.querySelector('.wz-theme-picker .mode-crow button.arbor2-room-help')?.click()"); await sleep(300);
    const b = await app.evalJs(read);
    const ok = { onTheRow: !!a && a.q && a.text === '?' && !a.inSeg, green: !!a && a.color === a.help && a.color !== 'rgb(255, 152, 0)', opensTheNote: !!b && /By the clock/.test(b.note || '') };
    const brief = { ok, a, b };
    if (Object.values(ok).some((x) => !x)) fail('R18-ROOM-HELP', brief);
    say('r18-room-help', brief);
  },

  // ── PICTURES for the Wrizors (both rooms; 2000 as well) and the recording's frames
  ...Object.fromEntries([['day', null], ['night', null], ['day', 2000], ['night', 2000]].map(([room, w]) => [`r18-pic-front-${room}${w ? '-2000' : ''}`, async (app) => {
    const done = await anon(app);
    try { if (w) await app.emulateDpr(1, 2000, 1125); await load(app, { room }); await doorsShown(app); await sleep(300); } finally { await done(); }
  }])),
  'r18-pic-front-authed': async (app) => { await load(app); await doorsShown(app); await sleep(300); },
  'r18-pic-signin': async (app) => { const done = await anon(app); try { await load(app); await doorsShown(app); await app.evalJs(clickDoor('Log in')); await sleep(600); } finally { await done(); } },
  'r18-pic-themes': async (app) => {
    await app.evalJs("window.wrizoCreateJournalPage({ id: 'arbor-r18-pic-t', text: 'The morning light came in low across the table.', createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })");
    await sleep(300); await app.evalJs("history.replaceState(null, '', '/?arbor2=1#/page/arbor-r18-pic-t')"); await app.reload();
    await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 }); await sleep(900);
    await app.evalJs("document.querySelector(\".wz-strip-item[data-category='theme']\")?.click()"); await sleep(600);
    await app.evalJs("document.querySelector('.wz-theme-picker .mode-crow button.arbor2-room-help')?.click()"); await sleep(400);
  },
  // the recording: the splash's logo writing (paused at T), then the doors drawing in (paused at T), then the pulse at its height
  ...Object.fromEntries([0, 0.5, 1.0, 1.5, 2.1].map((T) => [`r18-pic-rec-a-logo-${String(Math.round(T * 100)).padStart(3, '0')}`, async (app) => {
    const done = await anon(app);
    try {
      await app.evalJs(HOLD); await app.evalJs("history.replaceState(null, '', '/?arbor2=1#/')"); await app.reload();
      await waitSoft(app, "!!document.querySelector('.wz-splash .arbor2-top-logo')", { label: 'the splash logo', timeout: 8000 });
      await app.evalJs(`(() => { const L = document.querySelector('.wz-splash .arbor2-top-logo'); document.getAnimations().filter((a) => L.contains(a.effect?.target) || a.effect?.target === L || L.parentElement.contains(a.effect?.target)).forEach((a) => { a.pause(); a.currentTime = ${T * 1000}; }); return true; })()`);
      await sleep(250);
    } finally { await done(); }
  }])),
  ...Object.fromEntries([0, 0.2, 0.4, 0.6, 0.9].map((T) => [`r18-pic-rec-b-doors-${String(Math.round(T * 100)).padStart(3, '0')}`, async (app) => {
    const done = await anon(app);
    try {
      await load(app);
      await waitSoft(app, "document.querySelector('.arbor2-front-doors')?.getAttribute('data-phase') === 'in'", { label: 'doors coming in', timeout: 9000 });
      await app.evalJs(`(() => { const D = document.querySelector('.arbor2-front-doors'); document.getAnimations().filter((a) => D.contains(a.effect?.target)).forEach((a) => { a.pause(); a.currentTime = ${T * 1000}; }); return true; })()`);
      await sleep(250);
    } finally { await done(); }
  }])),
  ...Object.fromEntries([0, 0.4, 0.8, 1.2, 1.6].map((T) => [`r18-pic-rec-c-pulse-${String(Math.round(T * 100)).padStart(3, '0')}`, async (app) => {
    const done = await anon(app);
    try {
      await load(app); await doorsShown(app);
      await waitSoft(app, "(window.wrizoArborFront?.pulses || []).length >= 1", { label: 'the first pulse', timeout: 9000 });
      await app.evalJs(`(() => { const D = document.querySelector('.arbor2-front-doors'); document.getAnimations().filter((a) => D.contains(a.effect?.target)).forEach((a) => { a.pause(); a.currentTime = ${T * 1000}; }); return true; })()`);
      await sleep(250);
    } finally { await done(); }
  }])),
};

export default guarded(SCREENS, { verdict: ['ARBOR-R18'] });
