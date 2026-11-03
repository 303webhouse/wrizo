// ARBOR v2 MOCKUP, ROUND r14 - THE ARRIVAL SCREEN RETIRES; THE SPLASH IS THE FRONT DOOR, as named screens for INK's frames job (-f themes=plateau
// -f screens_file=apps/desktop/scripts/frames/arbor2-r14.mjs). Source: Fable, Nov 1 ("retire the Arrival screen in Arbor under the flag. The
// splash's Sign in door opens the existing sign-in / sign-up forms (keep the invite-code field); add a check that both work from the splash").
// What "works" means here, proven end to end on the harness's own server double (runtime-verify.mjs answers /auth/login, /auth/register and
// /auth/signup-status): from the splash, Sign in opens the existing sign-in form; filling it and pressing Sign in sends the email to
// /auth/login and the app leaves the front door for the writing; "New here? Create an account" opens the existing sign-up form WITH its
// invite-code field; filling it sends the name, the email and the code to /auth/register and the app leaves for the writing.
// A signed-out visitor is played for these screens only: CDP's Fetch domain answers /auth/me with 401 (the double signs everyone in) and lets
// the login / register requests through, reading their bodies. Nothing is seeded raw; the interception is removed when each screen ends.
// Every check THROWS with its numbers when it fails and prints them when it passes ("ARBOR-R14 <screen> {...}"). Written red-first: run against
// r13 (53ccfb0d) before the r14 build.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const say = (name, data) => console.log(`ARBOR-R14 ${name} ${JSON.stringify(data)}`);
const fail = (name, data) => { console.log(`ARBOR-R14-FAIL ${name} ${JSON.stringify(data)}`); throw new Error(`${name} FAILED ${JSON.stringify(data)}`.slice(0, 1200)); };

// ---- a signed-out visitor, for this screen only ----
const anon = async (app) => {
  const seen = [];
  await app.cdp('Fetch.enable', { patterns: [{ urlPattern: '*/auth/me*' }, { urlPattern: '*/auth/login*' }, { urlPattern: '*/auth/register*' }] });
  const off = app.tap((method, p) => {
    if (method !== 'Fetch.requestPaused') return;
    const url = p.request.url;
    if (/\/auth\/me/.test(url)) {
      app.cdp('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: 401, responseHeaders: [{ name: 'content-type', value: 'application/json' }], body: Buffer.from('{"error":"unauthorized"}').toString('base64') }).catch(() => {});
    } else {
      let body = null; try { body = JSON.parse(p.request.postData || 'null'); } catch { body = p.request.postData || null; }
      seen.push({ path: new URL(url).pathname, body });
      app.cdp('Fetch.continueRequest', { requestId: p.requestId }).catch(() => {});
    }
  });
  return { seen, done: async () => { off(); await app.cdp('Fetch.disable').catch(() => {}); } };
};
const front = async (app, room) => {
  await app.evalJs("history.replaceState(null, '', '/?arbor2=1#/')");
  await app.reload();
  await waitSoft(app, "document.documentElement.getAttribute('data-arbor2') === 'true'", { label: 'flag', timeout: 15000 });
  if (room) await app.evalJs(`document.documentElement.setAttribute('data-room', ${JSON.stringify(room === 'day' ? 'light' : 'dark')})`);
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 });
  await sleep(700);
};
const FRONT = `(() => { const q = (s) => document.querySelector(s); const shown = (e) => { if (!e) return false; const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; for (let n = e; n; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.05) return false; } return true; };
  const doors = [...document.querySelectorAll('.wz-arrival-doors button')].filter(shown).map((b) => b.textContent.trim());
  const mark = q('.arbor2-front-mark'); const mr = mark ? mark.getBoundingClientRect() : null;
  return { route: location.hash, arrival: !!q('.wz-arrival'), front: shown(q('.arbor2-front')), hero: shown(q('.wz-hero')), heroLogo: shown(q('.wz-hero .wz-logo')), bootbar: shown(q('.wz-arrival-bootbar')),
    drawing: !!mark && shown(mark) && !!mark.querySelector('img, svg, image'), markCentre: mr ? [Math.round(mr.left + mr.width / 2), Math.round(mr.top + mr.height / 2)] : null, vw: innerWidth, vh: innerHeight,
    tagline: shown(q('.arbor2-front .wz-tagline')) ? q('.arbor2-front .wz-tagline').textContent.trim() : null, doors, signinForm: shown(q('input[autocomplete="current-password"]')), accountForm: shown(q('input[autocomplete="new-password"]')),
    invite: shown([...document.querySelectorAll('input.wz-field')].find((i) => /invite/i.test(i.placeholder))), ground: getComputedStyle(q('.arbor2-front') || document.body).backgroundColor }; })()`;
const fill = (sel, value) => `(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return false; const d = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value'); d.set.call(el, ${JSON.stringify(value)}); el.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`;
const clickDoor = (text) => `(() => { const b = [...document.querySelectorAll('button')].find((x) => (x.textContent || '').trim() === ${JSON.stringify(text)} && x.getBoundingClientRect().width > 0); if (b) b.click(); return !!b; })()`;
// r18: FRONT with the tagline and the doors read where they stand now (the tagline under the logo in the drawing; the doors as its boxes), and
// front2 = front, then the doors' own entrance done (they come last, after the logo)
const FRONT2 = FRONT.split("q('.arbor2-front .wz-tagline')").join("q('.arbor2-front .arbor2-top-tagline')").split('.wz-arrival-doors button').join('.arbor2-front-doors .arbor2-door');
if (FRONT2 === FRONT || FRONT2.includes('.wz-arrival-doors') || FRONT2.includes("'.arbor2-front .wz-tagline'")) throw new Error('FRONT2 did not take');
const front2 = async (app, room) => { await front(app, room); await waitSoft(app, "document.querySelector('.arbor2-front-doors')?.getAttribute('data-phase') === 'shown'", { label: 'the doors in', timeout: 9000 }); };
const leftFront = "!document.querySelector('.wz-arrival') && /#\\/(page|project)\\//.test(location.hash)";

// ---- a pixel instrument for the front's words (tagline and doors) against what is painted behind them ----
const COLLECT = (sel) => `(() => {
  const parse = (s) => { const m = String(s).match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const p = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const runs = [];
  for (const root of document.querySelectorAll(${JSON.stringify(sel)})) { const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = tw.nextNode(); n; n = tw.nextNode()) { if (!n.textContent.trim()) continue; const el = n.parentElement; let op = 1, hidden = false;
      for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') { hidden = true; break; } op *= Number(cs.opacity); }
      const c = parse(getComputedStyle(el).color); if (hidden || !c || c.a * op < 0.05) continue; const rg = document.createRange(); rg.selectNodeContents(n);
      const rects = [...rg.getClientRects()].filter((x) => x.width >= 2 && x.height >= 4).map((x) => [x.left, x.top, x.right, x.bottom]);
      // (instrument fix after green look 41358900562: at 1366 the Sign in door lay below the window and was still "measured" - pixels read off
      // the picture's end came back empty and slipped through. A word outside the window is now a failed run, never a sampled one.)
      const out = rects.some(([x0, y0, x1, y1]) => x0 < 0 || y0 < 0 || x1 > innerWidth || y1 > innerHeight);
      if (rects.length) runs.push({ text: n.textContent.trim().slice(0, 24), fg: [c.r, c.g, c.b, c.a * op], rects, out }); } }
  window.__r14runs = runs; return runs.length; })()`;
const HIDE = "(() => { const s = document.createElement('style'); s.id = 'r14-hide'; s.textContent = '*, *::before, *::after{ color:transparent !important; -webkit-text-fill-color:transparent !important; text-shadow:none !important; }'; document.head.appendChild(s); return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true)))); })()";
const SHOW = "(() => { document.getElementById('r14-hide')?.remove(); return true; })()";
const MEASURE = (b64) => `(async () => {
  const img = new Image(); img.src = 'data:image/png;base64,${b64}'; await img.decode();
  const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(img, 0, 0);
  const k = img.width / innerWidth; const data = cx.getImageData(0, 0, img.width, img.height).data;
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const L = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return window.__r14runs.map((run) => { const [fr, fg, fb, fa] = run.fg; const ratios = [];
    for (const [x0, y0, x1, y1] of run.rects) { const sx = Math.max(1, (x1 - x0) / 24), sy = Math.max(1, (y1 - y0) / 8);
      for (let y = y0; y < y1; y += sy) for (let x = x0; x < x1; x += sx) { const i = (Math.floor(y * k) * img.width + Math.floor(x * k)) * 4; const r = data[i], g = data[i + 1], b = data[i + 2];
        const lb = L(r, g, b), lf = L(fr * fa + r * (1 - fa), fg * fa + g * (1 - fa), fb * fa + b * (1 - fa)); ratios.push((Math.max(lb, lf) + 0.05) / (Math.min(lb, lf) + 0.05)); } }
    if (run.out || ratios.some((v) => !Number.isFinite(v))) return { text: run.text, p2: null, out: true };
    ratios.sort((a, b) => a - b); return { text: run.text, p2: ratios.length ? Math.round(ratios[Math.floor(ratios.length * 0.02)] * 100) / 100 : null }; }); })()`;
const pixels = async (app, sel) => { await app.evalJs(COLLECT(sel)); await app.evalJs(HIDE); const shot = (await app.cdp('Page.captureScreenshot', { format: 'png' })).data; await app.evalJs(SHOW); return app.evalJs(MEASURE(shot)); };

export default {
  // ── THE FRONT DOOR, a visitor: no Arrival hero (logo, load bar), the splash's finished drawing where the splash drew it, the tagline, and two
  // doors - Write and Sign in (no Open: a visitor has nothing to open). Its words >= 4.5:1 on what is behind them, in both rooms.
  // PARKED 2026-11-02 (SUPERSEDED by the Wrizors, wrizors-to-ARBOR-nov2.md via Fable: "The tagline must read exactly 'For humans who
  // write.'"). Kept verbatim under the name r14-front-v1 (not in the run list); SUCCESSOR r14-front below, the same checks with the words.
  'r14-front-v1': async (app) => {
    const a = await anon(app);
    try {
      const rows = [];
      for (const room of ['night', 'day']) {
        await front(app, room);
        const s = await app.evalJs(FRONT);
        const px = s.front ? await pixels(app, '.arbor2-front-foot') : [];
        rows.push({ room, s, px });
      }
      const okRow = ({ s, px }) => s.arrival && s.front && !s.hero && !s.heroLogo && !s.bootbar && s.drawing && !!s.markCentre && Math.abs(s.markCentre[0] - s.vw / 2) <= 2 && Math.abs(s.markCentre[1] - s.vh / 2) <= 2
        && s.tagline === 'For humans writing' && JSON.stringify(s.doors) === '["Write","Sign in"]' && px.length >= 3 && px.every((x) => x.p2 != null && x.p2 >= 4.5);
      // (amendment before any green, run 41358900562: the splash's own ground is not one colour - #120A06 by night, #0A0503 by day (the day
      // splash rule) - so the front must match the SPLASH in each room, not match itself across rooms. Original: sameGround: rows[0].s.ground
      // === rows[1].s.ground)
      const SPLASH = { night: 'rgb(18, 10, 6)', day: 'rgb(10, 5, 3)' };
      const ok = { visitor: rows.every(okRow), splashGround: rows.every((r) => r.s.ground === SPLASH[r.room]) };
      const brief = { ok, rows: rows.map((r) => ({ room: r.room, ok: okRow(r), ...r.s, px: r.px })) };
      if (Object.values(ok).some((x) => !x)) fail('R14-FRONT', brief);
      say('r14-front', brief);
    } finally { await a.done(); }
  },
  // PARKED 2026-11-03 (SUPERSEDED by r18, Nick's splash changes (Fable, Nov 2-3): the logo moved from the corner into the drawing, at its top, where the erased "WRIZO (in abstract)" line stood, with the tagline under it; the doors became hand-drawn boxes INSIDE the drawing, Write and Log in (signed in: Write and Open); the corner mark left the front door). Kept verbatim under the name r14-front-v2 (not in the run list); SUCCESSOR r14-front below.
  'r14-front-v2': async (app) => {
    const a = await anon(app);
    try {
      const rows = [];
      for (const room of ['night', 'day']) {
        await front(app, room);
        const s = await app.evalJs(FRONT);
        const px = s.front ? await pixels(app, '.arbor2-front-foot') : [];
        rows.push({ room, s, px });
      }
      const okRow = ({ s, px }) => s.arrival && s.front && !s.hero && !s.heroLogo && !s.bootbar && s.drawing && !!s.markCentre && Math.abs(s.markCentre[0] - s.vw / 2) <= 2 && Math.abs(s.markCentre[1] - s.vh / 2) <= 2
        && s.tagline === 'For humans who write.' && JSON.stringify(s.doors) === '["Write","Sign in"]' && px.length >= 3 && px.every((x) => x.p2 != null && x.p2 >= 4.5);
      // (amendment before any green, run 41358900562: the splash's own ground is not one colour - #120A06 by night, #0A0503 by day (the day
      // splash rule) - so the front must match the SPLASH in each room, not match itself across rooms. Original: sameGround: rows[0].s.ground
      // === rows[1].s.ground)
      const SPLASH = { night: 'rgb(18, 10, 6)', day: 'rgb(10, 5, 3)' };
      const ok = { visitor: rows.every(okRow), splashGround: rows.every((r) => r.s.ground === SPLASH[r.room]) };
      const brief = { ok, rows: rows.map((r) => ({ room: r.room, ok: okRow(r), ...r.s, px: r.px })) };
      if (Object.values(ok).some((x) => !x)) fail('R14-FRONT', brief);
      say('r14-front', brief);
    } finally { await a.done(); }
  },
  'r14-front': async (app) => {
    const a = await anon(app);
    try {
      const rows = [];
      for (const room of ['night', 'day']) {
        await front2(app, room);
        const s = await app.evalJs(FRONT2);
        const px = s.front ? await pixels(app, '.arbor2-front-doors, .arbor2-front-mark .arbor2-top-tagline') : [];
        rows.push({ room, s, px });
      }
      const okRow = ({ s, px }) => s.arrival && s.front && !s.hero && !s.heroLogo && !s.bootbar && s.drawing && !!s.markCentre && Math.abs(s.markCentre[0] - s.vw / 2) <= 2 && Math.abs(s.markCentre[1] - s.vh / 2) <= 2
        && s.tagline === 'For humans who write.' && JSON.stringify(s.doors) === '["Write","Log in"]' && px.length >= 3 && px.every((x) => x.p2 != null && x.p2 >= 4.5);
      // (amendment before any green, run 41358900562: the splash's own ground is not one colour - #120A06 by night, #0A0503 by day (the day
      // splash rule) - so the front must match the SPLASH in each room, not match itself across rooms. Original: sameGround: rows[0].s.ground
      // === rows[1].s.ground)
      const SPLASH = { night: 'rgb(18, 10, 6)', day: 'rgb(10, 5, 3)' };
      const ok = { visitor: rows.every(okRow), splashGround: rows.every((r) => r.s.ground === SPLASH[r.room]) };
      const brief = { ok, rows: rows.map((r) => ({ room: r.room, ok: okRow(r), ...r.s, px: r.px })) };
      if (Object.values(ok).some((x) => !x)) fail('R14-FRONT', brief);
      say('r14-front', brief);
    } finally { await a.done(); }
  },

  // ── SIGN IN WORKS FROM THE SPLASH: the Sign in door opens the existing sign-in form; filled and sent, /auth/login gets the email and the app
  // leaves the front door for the writing.
  // PARKED 2026-11-03 (SUPERSEDED by r18, Nick's splash changes (Fable, Nov 2-3): the logo moved from the corner into the drawing, at its top, where the erased "WRIZO (in abstract)" line stood, with the tagline under it; the doors became hand-drawn boxes INSIDE the drawing, Write and Log in (signed in: Write and Open); the corner mark left the front door). Kept verbatim under the name r14-signin-v1 (not in the run list); SUCCESSOR r14-signin below.
  'r14-signin-v1': async (app) => {
    const a = await anon(app);
    try {
      await front(app, null);
      const atDoor = await app.evalJs(FRONT);
      const pressed = await app.evalJs(clickDoor('Sign in')); await sleep(400);
      const form = await app.evalJs(FRONT);
      await app.evalJs(fill('input[autocomplete="email"]', 'r14-reader@example.com'));
      await app.evalJs(fill('input[autocomplete="current-password"]', 'a-long-password'));
      await app.evalJs("document.querySelector('input[autocomplete=\"current-password\"]')?.closest('form')?.requestSubmit()");
      const left = await waitSoft(app, leftFront, { label: 'left the front door', timeout: 8000 });
      const login = a.seen.find((x) => x.path === '/auth/login');
      const ok = { door: JSON.stringify(atDoor.doors) === '["Write","Sign in"]', pressed, form: form.signinForm && !form.front, sent: !!login && login.body?.email === 'r14-reader@example.com', left };
      const brief = { ok, form: { signinForm: form.signinForm, front: form.front }, login, route: await app.evalJs('location.hash') };
      if (Object.values(ok).some((x) => !x)) fail('R14-SIGNIN', brief);
      say('r14-signin', brief);
    } finally { await a.done(); }
  },
  'r14-signin': async (app) => {
    const a = await anon(app);
    try {
      await front2(app, null);
      const atDoor = await app.evalJs(FRONT2);
      const pressed = await app.evalJs(clickDoor('Log in')); await sleep(400);
      const form = await app.evalJs(FRONT2);
      await app.evalJs(fill('input[autocomplete="email"]', 'r14-reader@example.com'));
      await app.evalJs(fill('input[autocomplete="current-password"]', 'a-long-password'));
      await app.evalJs("document.querySelector('input[autocomplete=\"current-password\"]')?.closest('form')?.requestSubmit()");
      const left = await waitSoft(app, leftFront, { label: 'left the front door', timeout: 8000 });
      const login = a.seen.find((x) => x.path === '/auth/login');
      const ok = { door: JSON.stringify(atDoor.doors) === '["Write","Log in"]', pressed, form: form.signinForm && !form.front, sent: !!login && login.body?.email === 'r14-reader@example.com', left };
      const brief = { ok, form: { signinForm: form.signinForm, front: form.front }, login, route: await app.evalJs('location.hash') };
      if (Object.values(ok).some((x) => !x)) fail('R14-SIGNIN', brief);
      say('r14-signin', brief);
    } finally { await a.done(); }
  },

  // ── SIGN UP WORKS FROM THE SPLASH: Sign in, then "New here? Create an account", opens the existing sign-up form WITH the invite-code field;
  // filled and sent, /auth/register gets the name, the email and the code, and the app leaves the front door for the writing.
  // PARKED 2026-11-03 (SUPERSEDED by r18, Nick's splash changes (Fable, Nov 2-3): the logo moved from the corner into the drawing, at its top, where the erased "WRIZO (in abstract)" line stood, with the tagline under it; the doors became hand-drawn boxes INSIDE the drawing, Write and Log in (signed in: Write and Open); the corner mark left the front door). Kept verbatim under the name r14-signup-v1 (not in the run list); SUCCESSOR r14-signup below.
  'r14-signup-v1': async (app) => {
    const a = await anon(app);
    try {
      await front(app, null);
      await app.evalJs(clickDoor('Sign in')); await sleep(400);
      const toAccount = await app.evalJs(clickDoor('New here? Create an account'));
      await waitSoft(app, "!!document.querySelector('input[autocomplete=\"new-password\"]')", { label: 'the sign-up form', timeout: 5000 });
      const form = await app.evalJs(FRONT);
      await app.evalJs(fill('input[autocomplete="given-name"]', 'R14 Writer'));
      await app.evalJs(fill('input[autocomplete="email"]', 'r14-writer@example.com'));
      await app.evalJs(fill('input[autocomplete="new-password"]', 'a-longer-password'));
      await app.evalJs("(() => { const el = [...document.querySelectorAll('input.wz-field')].find((i) => /invite/i.test(i.placeholder)); if (!el) return false; const d = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value'); d.set.call(el, 'R14-CODE'); el.dispatchEvent(new Event('input', { bubbles: true })); return true; })()");
      await app.evalJs("document.querySelector('input[autocomplete=\"new-password\"]')?.closest('form')?.requestSubmit()");
      const left = await waitSoft(app, leftFront, { label: 'left the front door', timeout: 8000 });
      const reg = a.seen.find((x) => x.path === '/auth/register');
      const ok = { toAccount, form: form.accountForm && form.invite, sent: !!reg && reg.body?.email === 'r14-writer@example.com' && reg.body?.name === 'R14 Writer' && reg.body?.code === 'R14-CODE', left };
      const brief = { ok, form: { accountForm: form.accountForm, invite: form.invite }, register: reg, route: await app.evalJs('location.hash') };
      if (Object.values(ok).some((x) => !x)) fail('R14-SIGNUP', brief);
      say('r14-signup', brief);
    } finally { await a.done(); }
  },
  'r14-signup': async (app) => {
    const a = await anon(app);
    try {
      await front2(app, null);
      await app.evalJs(clickDoor('Log in')); await sleep(400);
      const toAccount = await app.evalJs(clickDoor('New here? Create an account'));
      await waitSoft(app, "!!document.querySelector('input[autocomplete=\"new-password\"]')", { label: 'the sign-up form', timeout: 5000 });
      const form = await app.evalJs(FRONT2);
      await app.evalJs(fill('input[autocomplete="given-name"]', 'R14 Writer'));
      await app.evalJs(fill('input[autocomplete="email"]', 'r14-writer@example.com'));
      await app.evalJs(fill('input[autocomplete="new-password"]', 'a-longer-password'));
      await app.evalJs("(() => { const el = [...document.querySelectorAll('input.wz-field')].find((i) => /invite/i.test(i.placeholder)); if (!el) return false; const d = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value'); d.set.call(el, 'R14-CODE'); el.dispatchEvent(new Event('input', { bubbles: true })); return true; })()");
      await app.evalJs("document.querySelector('input[autocomplete=\"new-password\"]')?.closest('form')?.requestSubmit()");
      const left = await waitSoft(app, leftFront, { label: 'left the front door', timeout: 8000 });
      const reg = a.seen.find((x) => x.path === '/auth/register');
      const ok = { toAccount, form: form.accountForm && form.invite, sent: !!reg && reg.body?.email === 'r14-writer@example.com' && reg.body?.name === 'R14 Writer' && reg.body?.code === 'R14-CODE', left };
      const brief = { ok, form: { accountForm: form.accountForm, invite: form.invite }, register: reg, route: await app.evalJs('location.hash') };
      if (Object.values(ok).some((x) => !x)) fail('R14-SIGNUP', brief);
      say('r14-signup', brief);
    } finally { await a.done(); }
  },

  // ── A SIGNED-IN WRITER on the front door (the double signs her in): Write and Open, no Sign in; and Write opens a page
  // PARKED 2026-11-03 (SUPERSEDED by r18, Nick's splash changes (Fable, Nov 2-3): the logo moved from the corner into the drawing, at its top, where the erased "WRIZO (in abstract)" line stood, with the tagline under it; the doors became hand-drawn boxes INSIDE the drawing, Write and Log in (signed in: Write and Open); the corner mark left the front door). Kept verbatim under the name r14-front-authed-v1 (not in the run list); SUCCESSOR r14-front-authed below.
  'r14-front-authed-v1': async (app) => {
    await front(app, null);
    const s = await app.evalJs(FRONT);
    const pressed = await app.evalJs(clickDoor('Write'));
    const left = await waitSoft(app, leftFront, { label: 'Write opened a page', timeout: 8000 });
    const ok = { front: s.front && !s.hero, doors: JSON.stringify(s.doors) === '["Write","Open"]', write: pressed && left };
    const brief = { ok, doors: s.doors, front: s.front, hero: s.hero, route: await app.evalJs('location.hash') };
    if (Object.values(ok).some((x) => !x)) fail('R14-FRONT-AUTHED', brief);
    say('r14-front-authed', brief);
  },
  'r14-front-authed': async (app) => {
    await front2(app, null);
    const s = await app.evalJs(FRONT2);
    const pressed = await app.evalJs(clickDoor('Write'));
    const left = await waitSoft(app, leftFront, { label: 'Write opened a page', timeout: 8000 });
    const ok = { front: s.front && !s.hero, doors: JSON.stringify(s.doors) === '["Write","Open"]', write: pressed && left };
    const brief = { ok, doors: s.doors, front: s.front, hero: s.hero, route: await app.evalJs('location.hash') };
    if (Object.values(ok).some((x) => !x)) fail('R14-FRONT-AUTHED', brief);
    say('r14-front-authed', brief);
  },

  // ── PICTURES: the front door (a visitor), each room; and the sign-in and sign-up forms opened from it
  'r14-pic-front-night': async (app) => { const a = await anon(app); try { await front(app, 'night'); } finally { await a.done(); } },
  'r14-pic-front-day': async (app) => { const a = await anon(app); try { await front(app, 'day'); } finally { await a.done(); } },
  'r14-pic-signin': async (app) => { const a = await anon(app); try { await front(app, null); await app.evalJs(clickDoor('Sign in')); await sleep(500); } finally { await a.done(); } },
  'r14-pic-signup': async (app) => { const a = await anon(app); try { await front(app, null); await app.evalJs(clickDoor('Sign in')); await sleep(300); await app.evalJs(clickDoor('New here? Create an account')); await sleep(800); } finally { await a.done(); } },
};
