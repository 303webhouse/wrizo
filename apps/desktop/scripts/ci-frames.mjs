// CI-FRAMES (Oct 29, the "frames" job on GitHub Actions): build a branch, serve it, and capture NAMED screens in both page tones at
// 1366 and 1920, as PNGs plus a manifest. NOT in harness/: run-suite runs every .mjs there, and this writes images.
// It reads nothing but the built bundle: the workflow builds the lane's branch into build/ and runs THIS file from the trusted tooling checkout.
//
// Run (from the tooling checkout's apps/desktop):
//   node scripts/ci-frames.mjs --dist <path-to-dist-web> --out <dir> [--screens a,b|all] [--themes plateau,flux] [--tones light,dark] [--widths 1366,1920]
//        [--screens-file <path to a .mjs that default-exports { name: async (app, ctx) => {...} }>]
//
// THE THEME IS THE THEME, NOT ONLY THE PAGE TONE (the 645fdf6 lesson, scripts/page-templates-frames.mjs): `data-page` may paint under one
// theme and be ignored by another. Every row records the attributes the document actually carried, and a light frame byte-identical to
// its dark twin is FLAGGED in the manifest (sameAsOtherTone) and in the summary line, never silently shipped as two looks.
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { withHarness } from './runtime-verify.mjs';

const arg = (name, dflt) => { const i = process.argv.indexOf('--' + name); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt; };
const list = (s) => String(s).split(',').map((x) => x.trim()).filter(Boolean);
const DIST = arg('dist', null);
const OUT = path.resolve(arg('out', 'frames-out'));
const THEMES = list(arg('themes', 'plateau'));
const TONES = list(arg('tones', 'light,dark'));
const WIDTHS = list(arg('widths', '1366,1920')).map(Number);
const HEIGHT = { 1366: 768, 1920: 1080 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const WORDS = 'The morning light came in low across the table, and she began to write.';

const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const press = async (app, selector) => {
  const pt = await app.evalJs(`(() => { const b = document.querySelector(${JSON.stringify(selector)}); if (!b) return null;
    const r = b.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
  if (!pt) return false;
  await app.mouseDown(pt.x, pt.y); await sleep(60); await app.mouseUp(pt.x, pt.y);
  return true;
};

// THE BUILT-IN SCREENS. Each one starts on a fresh Desk (the caller does that) and ends on the screen. A seed goes through the app's own
// seams (window.wrizo*), never raw storage (AGENTS.md "HOW TO SEED A FIXTURE").
const SCREENS = {
  'front-door': async (app) => {
    await waitSoft(app, "!!document.querySelector('.wz-arrival')", { label: 'front door' });
    await sleep(900);
  },
  'blank-page': async (app) => {
    await app.goto('/page/new');
    await waitSoft(app, `!!document.querySelector('${ED}')`, { label: 'blank page' });
    await sleep(900);
  },
  'blank-page-draft': async (app) => {
    await app.goto('/page/new');
    await waitSoft(app, `!!document.querySelector('${ED}')`, { label: 'blank page' });
    await app.click('Draft'); await sleep(900);
  },
  'page-with-words': async (app) => {
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'fr-words', text: WORDS, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
    await sleep(400);
    await app.evalJs("location.hash = '#/page/fr-words'");
    await waitSoft(app, `!!document.querySelector('${ED}')`, { label: 'page with words' });
    await sleep(900);
  },
  'page-drawer': async (app) => {
    await app.goto('/page/new');
    await waitSoft(app, `!!document.querySelector('${ED}')`, { label: 'blank page' });
    await app.click('Draft'); await sleep(500);
    if (!(await app.evalJs(`!!document.querySelector(".wz-sliver[data-open='true']")`))) await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
    await waitSoft(app, `!!document.querySelector(".wz-sliver[data-open='true']")`, { label: 'drawer open', timeout: 3000 });
    await sleep(700);
  },
  'journal': async (app) => {
    for (let i = 0; i < 4; i++) {
      await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: `fr-j${i}`, text: `${WORDS} (${i + 1})`, createdAt: `2026-04-0${i + 1}T00:00:00.000Z`, origin: 'loose', source: 'page' })})`);
    }
    await sleep(400);
    await app.goto('/journal');
    await sleep(1400);
  },
};

// #87 - THE SIGN-IN FRAMES DRIVER: the two SIGNED-OUT screens, `signin` and `signup` (not in `all`: name them, e.g. -f screens=signin,signup). The auth double answers "signed out" while process.env.WS_ANON is '1' (it reads it per request, in this process;
// scripts/captures/arrival-signin-capture.mjs does the same), so each screen: flips it, reloads the Desk signed out, reaches the screen the way a writer does (the Sign in door; from there "New here? Create an account"), waits for it to SETTLE,
// refuses a frame that shows a typed value or an "@" (no real email may be on a frame), and restores WS_ANON for the screens after it. It works on a tree whose front door is Arrival's doors (main) and on one whose front door is the splash's own Sign in door
// (the Arbor ship tree, Arrival retired there): both put a "Sign in" button on the front door and open the same sign-in and sign-up stages; the manifest row says which door it took (row.door).
const SIGNIN_UP = "!!document.querySelector(\".wz-arrival input.wz-field[type='email']\") && !!document.querySelector(\".wz-arrival input.wz-field[type='password']\")";   // the sign-in stage is up (ARBOR: the same markup on main and on the Arbor ship tree)
const SIGNUP_UP = "!!document.querySelector('.wz-arrival .wz-sub') && !!document.querySelector(\".wz-arrival input.wz-field[autocomplete='given-name']\")";   // the sign-up (account) stage is up: its invitation line and the first-name field
const SIGNED_OUT = (() => {
  const toSignedOutDoors = async (app) => {
    process.env.WS_ANON = '1';
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'signed-out front door' });
    await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone (signed out)', timeout: 15000 });
    await app.injectHelpers();
    // the Sign in door, enabled: on the Arbor ship tree it is `.arbor2-front-doors button.arbor2-door.wz-arrival-signin` (disabled until the front is ready); elsewhere a "Sign in" button of Arrival's doors
    await app.waitFor("[...document.querySelectorAll('button')].some((b) => /^(sign in|log in)$/i.test(b.textContent.trim()) && !b.disabled)", { label: 'the Sign in door (Flux calls it Log in)' });
    // the splash's Sign in door is ENABLED while its layer is still hidden (data-phase=wait): wait until a pointer would land on it (the Arbor ship tree; Nov 18, run 44388858387)
    await app.waitFor("(() => { const b = document.querySelector('.arbor2-front-doors .arbor2-door.wz-arrival-signin'); if (!b) return true; const r = b.getBoundingClientRect(); if (!r.width) return false; const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!t && (t === b || b.contains(t)); })()", { label: 'the Sign in door, hit-testable', timeout: 20000 });
    await sleep(500);
    return (await app.evalJs("document.querySelector('.arbor2-front-doors button.arbor2-door.wz-arrival-signin') ? 'splash-door' : document.querySelector('.wz-arrival-doors') ? 'arrival-doors' : 'sign-in-button'"));
  };
  // the hero (Arrival's logo and doors) fades out over .8 s and the form in over 1 s: a frame inside that window is a ghost, not the screen
  const settled = async (app, probe) => {
    await app.waitFor(probe, { label: 'the screen', timeout: 10000 });
    // the full-page forms hide the hero; the POP-OUT (`.wz-popout`, Nov 18) keeps it behind a veil, so there the settled hero is the one marked `behind` (its dimming has finished: the opacity stops changing)
    await app.waitFor("(() => { const h = document.querySelector('.wz-hero'); if (!h) return true; if (h.classList.contains('behind')) { const o = getComputedStyle(h).opacity; if (window.__ho === o) { window.__hn = (window.__hn || 0) + 1; } else { window.__ho = o; window.__hn = 0; } return window.__hn >= 3; } return getComputedStyle(h).opacity === '0'; })()", { label: 'the hero gone or dimmed and still', timeout: 8000 });
    await app.waitFor("(() => { const s = document.querySelector('.wz-screen'); return !s || getComputedStyle(s).opacity === '1'; })()", { label: 'the form shown', timeout: 8000 });
    await sleep(400);
    await app.mouseMove(2, 2); await sleep(350);
    const seen = JSON.parse(await app.evalJs("JSON.stringify({ values: [...document.querySelectorAll(\"input:not([type='checkbox'])\")].map((i) => i.value), atInText: /@/.test(document.body.innerText) })"));   // a tick box's value is "on", not something she typed
    if (seen.values.some((v) => v !== '') || seen.atInText) throw new Error('refused: the screen shows a typed value or an "@": ' + JSON.stringify(seen));
  };
  const run = (steps) => async (app, ctx) => {
    const was = process.env.WS_ANON;
    try { ctx.door = await toSignedOutDoors(app); await steps(app); } finally { process.env.WS_ANON = was === undefined ? '' : was; }
  };
  return {
    signin: run(async (app) => {
      if (!(await press(app, '.wz-arrival-signin'))) await app.click('Sign in');   // the door's own class (every theme, whatever its word); the label as the fallback
      await settled(app, SIGNIN_UP);
    }),
    signup: run(async (app) => {
      if (!(await press(app, '.wz-arrival-signin'))) await app.click('Sign in');
      await app.waitFor(SIGNIN_UP, { label: 'sign-in first' });
      await sleep(500);
      if (!(await press(app, '.wz-popout-switch'))) await app.click('New here? Create an account');   // the pop-out's own switch; the label on the older full-page form
      await settled(app, SIGNUP_UP);
    }),
    // the pop-out's other states (Fable Nov 18, 3:50 pm): a field focused (the password; the email is focused on open), the 18+ error line (the button pressed unticked: focus lands on the tick), and the tick ticked
    'signin-focus': run(async (app) => {
      if (!(await press(app, '.wz-arrival-signin'))) await app.click('Sign in');
      await settled(app, SIGNIN_UP);
      await app.evalJs("document.querySelector('.wz-popout input[type=password]').focus(); true"); await sleep(300);
    }),
    'signup-error': run(async (app) => {
      if (!(await press(app, '.wz-arrival-signin'))) await app.click('Sign in');
      await app.waitFor(SIGNIN_UP, { label: 'sign-in first' }); await sleep(500);
      await press(app, '.wz-popout-switch'); await settled(app, SIGNUP_UP);
      await app.evalJs("document.querySelector('.wz-popout button[type=submit]').click(); true");
      await app.waitFor("!!document.querySelector('.wz-popout .wz-error')", { label: 'the 18+ error line' }); await sleep(400);
      await app.mouseMove(2, 2); await sleep(300);
    }),
    // a SHORTER window (1366 x 560; name it with -f widths=1366): the create-account face where its fields scroll and the button row stays
    'signup-short': run(async (app) => {
      if (!(await press(app, '.wz-arrival-signin'))) await app.click('Sign in');
      await app.waitFor(SIGNIN_UP, { label: 'sign-in first' }); await sleep(500);
      await press(app, '.wz-popout-switch'); await settled(app, SIGNUP_UP);
      await app.emulateDpr(1, 1366, 560); await sleep(900);
    }),
    'signup-error-short': run(async (app) => {
      if (!(await press(app, '.wz-arrival-signin'))) await app.click('Sign in');
      await app.waitFor(SIGNIN_UP, { label: 'sign-in first' }); await sleep(500);
      await press(app, '.wz-popout-switch'); await settled(app, SIGNUP_UP);
      await app.emulateDpr(1, 1366, 560); await sleep(900);
      await app.evalJs("document.querySelector('.wz-popout button[type=submit]').click(); true");
      await app.waitFor("!!document.querySelector('.wz-popout .wz-error')", { label: 'the 18+ error line' }); await sleep(500);
      await app.mouseMove(2, 2); await sleep(300);
    }),
    // the sign-in face in the shorter window, plain and with its error line (the login call made to fail: the signed-out double signs anyone in)
    'signin-short': run(async (app) => {
      if (!(await press(app, '.wz-arrival-signin'))) await app.click('Sign in');
      await settled(app, SIGNIN_UP);
      await app.emulateDpr(1, 1366, 560); await sleep(900); await app.mouseMove(2, 2); await sleep(300);
    }),
    'signin-error-short': run(async (app) => {
      if (!(await press(app, '.wz-arrival-signin'))) await app.click('Sign in');
      await settled(app, SIGNIN_UP);
      await app.emulateDpr(1, 1366, 560); await sleep(900);
      await app.evalJs("(() => { const f0 = window.fetch.bind(window); window.fetch = (u, o) => String(u).includes('/auth/login') ? Promise.reject(new TypeError('Failed to fetch')) : f0(u, o); document.querySelector('.wz-popout button[type=submit]').click(); return true; })()");
      await app.waitFor("!!document.querySelector('.wz-popout .wz-error')", { label: 'the sign-in error line' }); await sleep(500);
      await app.mouseMove(2, 2); await sleep(300);
    }),
    // the same, with a ONE-line error (the server answers 401 "Wrong email or password."): the squeeze's other case
    'signin-error1-short': run(async (app) => {
      if (!(await press(app, '.wz-arrival-signin'))) await app.click('Sign in');
      await settled(app, SIGNIN_UP);
      await app.emulateDpr(1, 1366, 560); await sleep(900);
      await app.evalJs("(() => { const f0 = window.fetch.bind(window); window.fetch = (u, o) => String(u).includes('/auth/login') ? Promise.resolve({ ok: false, status: 400, json: async () => ({ error: 'Wrong email or password.' }) }) : f0(u, o); document.querySelector('.wz-popout button[type=submit]').click(); return true; })()");
      await app.waitFor("!!document.querySelector('.wz-popout .wz-error')", { label: 'the sign-in error line' }); await sleep(500);
      await app.mouseMove(2, 2); await sleep(300);
    }),
    'signup-ticked': run(async (app) => {
      if (!(await press(app, '.wz-arrival-signin'))) await app.click('Sign in');
      await app.waitFor(SIGNIN_UP, { label: 'sign-in first' }); await sleep(500);
      await press(app, '.wz-popout-switch'); await settled(app, SIGNUP_UP);
      await press(app, '.wz-adult'); await app.waitFor("!!document.querySelector('.wz-adult-box') && document.querySelector('.wz-adult-box').checked", { label: 'the tick ticked' }); await sleep(300);
    }),
  };
})();

let EXTRA = {};
const screensFile = arg('screens-file', null);
if (screensFile) EXTRA = (await import(pathToFileURL(path.resolve(screensFile)).href)).default || {};
const ALL = { ...SCREENS, ...SIGNED_OUT, ...EXTRA };   // `all` stays the built-in SCREENS only (NAMES below): the signed-out screens are named on purpose
const want = arg('screens', 'all');
const NAMES = want === 'all' ? Object.keys(SCREENS) : list(want);
const unknown = NAMES.filter((n) => !ALL[n]);
if (unknown.length) { console.error(`CI-FRAMES: unknown screen(s): ${unknown.join(', ')}. Known: ${Object.keys(ALL).join(', ')}`); process.exit(2); }
if (!DIST) { console.error('CI-FRAMES: --dist <dist-web> is required'); process.exit(2); }
if (WIDTHS.some((w) => !HEIGHT[w])) { console.error(`CI-FRAMES: widths must be 1366 and/or 1920 (got ${WIDTHS.join(',')})`); process.exit(2); }

// THE LIVE-SPLASH OPT-IN (Fable, Nov 23, 1:00 pm; FIX's proposal): a screen function that carries `liveSplash = true` DECLARES that it shoots the live opening splash.
// For such a screen (and only such a screen) the 50 ms test-speed hold is NOT set, the run waits for the splash to be ON SCREEN instead of gone, and the
// "splash still on screen" refusal below is lifted; the row says `liveSplash: true`. Every other screen keeps the refusal: the default still refuses.
const isLiveSplash = (fn) => !!fn && fn.liveSplash === true;
const freshDesk = async (app, theme, tone, w, liveSplash = false) => {
  await app.emulateDpr(1, w, HEIGHT[w]);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); ${liveSplash ? '' : "localStorage.setItem('wrizo-splash-hold','50'); "}localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');
    localStorage.setItem('wrizo-theme-prefs', ${JSON.stringify(JSON.stringify({ voice: 'serif', page: tone, fade: 'on' }))});
    localStorage.setItem('wrizo-theme', ${JSON.stringify(theme)});`);
  await app.reload();
  if (liveSplash) { await app.waitFor("!!document.querySelector('.wz-splash')", { label: 'the live splash on screen', timeout: 15000 }); return; }
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  // the opening splash plays on every load; the 50 ms hold override above is the harness's test speed, and a frame is only taken once it is GONE
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
};

const rows = [];
const md5 = (f) => createHash('md5').update(readFileSync(f)).digest('hex');
mkdirSync(OUT, { recursive: true });

await withHarness(async (app) => {
  for (const theme of THEMES) for (const w of WIDTHS) for (const name of NAMES) for (const tone of TONES) {
    const file = `${name}__${theme}-${tone}__${w}.png`;
    const row = { screen: name, theme, tone, width: w, height: HEIGHT[w], file };
    try {
      const live = isLiveSplash(ALL[name]);
      await freshDesk(app, theme, tone, w, live);
      const ctx = { theme, tone, width: w };
      await ALL[name](app, ctx);
      if (ctx.door) row.door = ctx.door;   // #87: which front door the signed-out driver took
      if (live) row.liveSplash = true;
      // a frame of the opening splash is not a frame of the screen: refuse it rather than ship it (unless the screen declared `liveSplash`, above)
      else if (await app.evalJs("!!document.querySelector('.wz-splash')")) throw new Error('the opening splash is still on screen');
      writeFileSync(path.join(OUT, file), Buffer.from(await app.screenshot(), 'base64'));
      row.status = 'ok';
      row.md5 = md5(path.join(OUT, file));
      row.height = await app.evalJs('innerHeight');   // the window as it stands (the -short screens are 560 tall, not the width's default)
      row.hash = await app.evalJs('location.hash');
      row.address = await app.evalJs('location.pathname + location.search + location.hash');   // the full address a frame was shot at, query included (Fable, Nov 22, 10:10 pm: frames.json records it)
      row.attrs = await app.evalJs("({ theme: document.documentElement.getAttribute('data-theme'), page: document.documentElement.getAttribute('data-page'), voice: document.documentElement.getAttribute('data-voice') })");
    } catch (e) { row.status = 'failed'; row.error = String(e && e.message || e).slice(0, 300); }
    rows.push(row);
    console.log(`${row.status === 'ok' ? 'ok    ' : 'FAILED'} ${file}${row.error ? '  -- ' + row.error : ''}`);
  }
}, { dist: path.resolve(DIST) });

// the light/dark guard: a frame byte-identical to its other-tone twin is one look, not two
const same = [];
for (const r of rows) {
  const twin = rows.find((x) => x.screen === r.screen && x.theme === r.theme && x.width === r.width && x.tone !== r.tone && x.status === 'ok');
  r.sameAsOtherTone = !!(r.status === 'ok' && twin && twin.md5 === r.md5);
  if (r.sameAsOtherTone && r.tone === 'light') same.push(`${r.screen}/${r.theme}/${r.width}`);
}
writeFileSync(path.join(OUT, 'frames.json'), JSON.stringify({ built: process.env.BUILT_SHA || null, rows }, null, 2) + '\n');
const bad = rows.filter((r) => r.status !== 'ok');
console.log(`CI-FRAMES: ${rows.length - bad.length}/${rows.length} frames captured${bad.length ? `, ${bad.length} FAILED` : ''}`);
console.log(same.length ? `CI-FRAMES TONES: light is byte-identical to dark for: ${same.join(', ')} (that theme ignores the page tone here)` : 'CI-FRAMES TONES: every light frame differs from its dark twin');
process.exit(bad.length ? 1 : 0);
