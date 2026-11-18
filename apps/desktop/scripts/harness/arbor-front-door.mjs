// BUG #38 IN ARBOR: THE SECOND SPLASH SCREEN RETIRES (Nick, Nov 1: "The second splash screen (Arrival) still shows in ALL three live themes ... It
// retires in each theme's redesign ship; sign-in + sign-up stay reachable from each splash's Sign in door, with a check per theme"; the Arbor ship
// brief, gate 6). Arbor's check, on the redesign as it ships (on by default; no query), SIGNED OUT (the double answers /auth/me "signed out"):
//   R1 there is no second screen: when the splash goes, the front door is the splash's own last frame - Arbor's front (.arbor2-front) with its doors,
//      and NONE of the legacy Arrival hero (.wz-hero, its mark .wz-mark, its tagline .wz-tagline, its door row .wz-arrival-doors)
//   R2 the splash's Sign in door (.arbor2-door.wz-arrival-signin) opens sign-in: the email and the password fields
//   R3 from sign-in, "New here? Create an account" opens sign-up: its invitation line and the name field
//   M1 (mutant) the legacy hero put back in the front door (asserted LANDED): R1's read goes red
//   M2 (mutant) the Sign in door taken away (asserted LANDED): R2's read goes red
// The doors are pressed as a writer presses them (a trusted pointer on the door's own box). No query string: the redesign's default.
import { withHarness } from '../runtime-verify.mjs';

process.env.WS_ANON ??= '1';   // the doors and sign-in are the signed-out screens (scripts/captures/arrival-signin-capture.mjs reads it the same way)
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const FRONT = `(() => { const q = (s) => document.querySelector(s); const r = document.documentElement;
  return { theme: r.getAttribute('data-theme'), arbor: r.getAttribute('data-arbor2'), splash: !!q('.wz-splash'), front: !!q('.arbor2-front:not(.gone)'),
    doors: [...document.querySelectorAll('.arbor2-front-doors .arbor2-door')].map((b) => ({ word: (b.textContent || '').trim(), disabled: b.disabled })),
    legacy: ['.wz-hero', '.wz-arrival .wz-mark', '.wz-tagline', '.wz-arrival-doors'].filter((s) => { const e = q(s); return !!e && e.getBoundingClientRect().width > 0 && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden'; }) }; })()`;
const SIGNIN = "(() => ({ email: !!document.querySelector(\".wz-arrival input.wz-field[type='email']\"), password: !!document.querySelector(\".wz-arrival input.wz-field[type='password']\") }))()";
const SIGNUP = "(() => ({ invite: [...document.querySelectorAll('.wz-arrival .wz-sub')].length > 0, name: !!document.querySelector(\".wz-arrival input.wz-field[autocomplete='given-name']\") }))()";
const r1ok = (m) => !!m && m.theme === 'plateau' && m.arbor === 'true' && !m.splash && m.front && m.legacy.length === 0 && m.doors.some((d) => d.word === 'Sign in');
const press = async (app, sel) => {
  const at = await app.evalJs(`(() => { const e = document.querySelector(${J(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return r.width ? { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) } : null; })()`);
  if (!at) return false;
  await app.mouseMove(at.x, at.y); await app.mouseDown(at.x, at.y); await app.mouseUp(at.x, at.y); await sleep(700); return true;
};

await withHarness(async (app) => {
  await app.emulateDpr(1, 1400, 900);
  const front = async () => {
    await app.goto('/');
    await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4'); localStorage.setItem('wrizo-theme', 'plateau'); true");
    await app.evalJs("history.replaceState(null, '', '/#/')"); await app.reload();
    await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'the splash gone', timeout: 25000 });
    // shown and hit-testable, as a writer sees it (the doors are enabled during data-phase='wait', while still hidden - the Write door probe 37ffbdaf)
    await waitSoft(app, "(() => { const b = document.querySelector('.arbor2-front-doors .arbor2-door.wz-arrival-signin:not([disabled])'); if (!b) return false; const r = b.getBoundingClientRect(); const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!t && (t === b || b.contains(t)); })()", { label: 'the Sign in door shown', timeout: 25000 });
    await sleep(600);
    return app.evalJs(FRONT);
  };
  const f = await front();
  ok(`R1 no second screen: the front door is Arbor's own (the splash's last frame, doors ${J(f && f.doors.map((d) => d.word))}) and none of the legacy Arrival hero (${J(f && f.legacy)})`, r1ok(f), J(f));
  const pressedIn = await press(app, '.arbor2-front-doors .arbor2-door.wz-arrival-signin');
  await waitSoft(app, "!!document.querySelector(\".wz-arrival input.wz-field[type='password']\")", { label: 'sign-in', timeout: 8000 });
  const si = await app.evalJs(SIGNIN);
  ok(`R2 the splash's Sign in door opens sign-in (pressed ${pressedIn}): the email and the password fields`, pressedIn && si.email && si.password, J(si));
  const toUp = await app.evalJs("(() => { const b = [...document.querySelectorAll('.wz-arrival button.wz-link')].find((x) => /Create an account/.test(x.textContent || '')); if (!b) return null; const r = b.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()");
  if (toUp) { await app.mouseMove(toUp.x, toUp.y); await app.mouseDown(toUp.x, toUp.y); await app.mouseUp(toUp.x, toUp.y); await sleep(700); }
  await waitSoft(app, "!!document.querySelector(\".wz-arrival input.wz-field[autocomplete='given-name']\")", { label: 'sign-up', timeout: 8000 });
  const su = await app.evalJs(SIGNUP);
  ok(`R3 from sign-in, "New here? Create an account" opens sign-up (pressed ${!!toUp}): the invitation line and the name field`, !!toUp && su.invite && su.name, J(su));
  // M1: the legacy hero put back in the front door - R1 must go red
  const f1 = await front();
  await app.evalJs("(() => { const s = document.createElement('section'); s.className = 'wz-hero'; s.style.cssText = 'position:fixed;left:10px;top:10px;width:200px;height:40px;'; s.textContent = 'legacy hero'; (document.querySelector('.wz-arrival') || document.body).appendChild(s); return true; })()");
  const m1 = await app.evalJs(FRONT);
  ok(`M1 (mutant): the legacy hero put back in the front door (LANDED: ${J(m1 && m1.legacy)}) - R1's read goes RED`, r1ok(f1) && !!m1 && m1.legacy.includes('.wz-hero') && !r1ok(m1), J({ f1, m1 }));
  // M2: the Sign in door taken away - R2's path must go red
  await front();
  await app.evalJs("document.querySelector('.arbor2-front-doors .arbor2-door.wz-arrival-signin')?.remove(); true");
  const pressedM = await press(app, '.arbor2-front-doors .arbor2-door.wz-arrival-signin');
  await sleep(500); const sm = await app.evalJs(SIGNIN);
  ok(`M2 (mutant): the Sign in door taken away (LANDED: pressed ${pressedM}) - R2's read goes RED`, !pressedM && !(pressedM && sm.email && sm.password), J({ pressedM, sm }));
  return checks;
}, { label: 'arbor-front-door' });

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
if (process.env.HARNESS_PARKED === '1') console.log('\nARBOR-FRONT-DOOR PARKED: PASS (0 records) - a new file; it parks nothing of its own');
const WANT = 5;
const pass = checks.length === WANT && checks.every((c) => c.pass);
console.log(pass ? `\nARBOR-FRONT-DOOR VERIFY: PASS (${checks.length} checks)` : `\nARBOR-FRONT-DOOR VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length !== WANT ? ` (${checks.length} ran, ${WANT} expected)` : ''}`);
process.exit(pass ? 0 : 1);
