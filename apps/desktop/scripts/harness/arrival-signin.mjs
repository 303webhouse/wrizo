// SIGN-IN SCREEN + SIGNED-OUT-HERE — browserless. Proves the per-device flag module
// (with a fake and a throwing storage), the ordering that keeps a logout from losing
// the flag, the route guard's exemptions, and the Arrival fixes, all in source.
// The screenshots and the live walk need a box turn: arrival-signin-capture.mjs.
//
// Run: node scripts/harness/arrival-signin.mjs   (from apps/desktop)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.resolve(here, '..', '..');
const SRC = path.join(DESKTOP, 'src');
const require = createRequire(path.join(DESKTOP, 'package.json'));
const ts = require('typescript');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const read = (rel) => fs.readFileSync(path.join(SRC, rel), 'utf8');

const tmp = path.join(DESKTOP, '.arrival-signin-harness-scratch');
fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(tmp, { recursive: true });
const out = ts.transpileModule(read('store/signedOutHere.ts'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
const dest = path.join(tmp, 'signedOutHere.mjs');
fs.writeFileSync(dest, out);
const flag = await import(`file://${dest.replace(/\\/g, '/')}?t=${Date.now()}`);

// =============================================================================
// PART A — the flag: set on logout, cleared on sign-in, survives a blocked store.
// =============================================================================
{
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
  ok('(A1) a device that has never signed out is not "signed out here"', flag.isSignedOutHere() === false, '');
  flag.markSignedOutHere();
  ok('(A2) marking it makes the flag true', flag.isSignedOutHere() === true, '');
  flag.clearSignedOutHere();
  ok('(A3) clearing it (a sign-in) makes the flag false again', flag.isSignedOutHere() === false, '');

  globalThis.localStorage = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); },
    removeItem() { throw new Error('blocked'); },
  };
  let threw = false;
  try {
    flag.markSignedOutHere(); flag.clearSignedOutHere();
    ok('(A4) with a blocked store, reading the flag gives false and nothing throws (a blocked store never traps a writer)',
      flag.isSignedOutHere() === false, '');
  } catch { threw = true; }
  ok('(A5) with a blocked store, mark and clear never throw', threw === false, '');
  delete globalThis.localStorage;
}

// =============================================================================
// PART B — App.tsx: the ordering, the guard's exemptions, the router boundary.
// =============================================================================
{
  const app = read('App.tsx');
  const logoutStart = app.indexOf('const handleLogout');
  const logoutBody = app.slice(logoutStart, app.indexOf('};', logoutStart));
  const markAt = logoutBody.indexOf('markSignedOutHere()');
  const resetAt = logoutBody.indexOf('resetLocalData()');
  ok('(B1) the flag is set BEFORE the local reset, so a failed reset still leaves the device on sign-in',
    markAt > 0 && resetAt > 0 && markAt < resetAt, JSON.stringify({ markAt, resetAt }));
  ok('(B2) logout sends the hash to the door at once (not left on a writing surface)',
    /window\.location\.hash = '#\/';/.test(logoutBody), '');
  const signinAt = app.indexOf('const handleAuthed');
  ok('(B3) a sign-in clears the flag', signinAt > 0 && /clearSignedOutHere\(\);/.test(app.slice(signinAt, signinAt + 200)), '');
  const bootAt = app.indexOf('if (user && isSignedOutHere())');
  ok('(B4) on boot, a session left on a device that signed out is ended and the door is shown',
    bootAt > 0 && /apiLogout\(\)\.then\(\(\) => setAuthState\('anon'\)\)/.test(app.slice(bootAt, bootAt + 200)), '');
  const guardDef = app.slice(app.indexOf('function SignedOutRouteGuard'), app.indexOf('function BrandMark'));
  ok('(B5) the guard lets the door itself through', /pathname === '\/'/.test(guardDef), '');
  ok('(B6) the guard lets the guest link through, so its token in the hash is not redirected away',
    /pathname === '\/guest'/.test(guardDef), '');
  ok('(B7) the guard waits for the boot check (authState must be anon), so a signed-in device is never bounced',
    /authState !== 'anon'/.test(guardDef), '');
  const hashRouterAt = app.indexOf('<HashRouter>');
  const hashRouterEnd = app.indexOf('</HashRouter>');
  const guardMountAt = app.indexOf('<SignedOutRouteGuard');
  ok('(B8) the guard is mounted INSIDE the router (useLocation needs it)',
    guardMountAt > hashRouterAt && guardMountAt < hashRouterEnd, JSON.stringify({ hashRouterAt, guardMountAt, hashRouterEnd }));
}

// =============================================================================
// PART C — Arrival: the hero hides off the doors, a visible Sign in, the locked
// stage, Create an account kept, and the first stage follows the flag.
// =============================================================================
{
  const arr = read('components/Arrival.tsx');
  ok('(C1) the hero hides once the stage is past the doors (HomeFlow\'s .gone pattern)',
    /className=\{stage === 'doors' \? 'wz-hero' : 'wz-hero gone'\}/.test(arr), '');
  ok('(C2) a visible "Sign in" is offered whenever signed out (authState anon)',
    /authState === 'anon' && \(/.test(arr) && /wz-arrival-signin/.test(arr) && />\s*Sign in\s*</.test(arr), '');
  ok('(C3) "Create an account" stays on the sign-in screen', /New here\? Create an account/.test(arr), '');
  ok('(C4) the first stage follows the flag: a signed-out device opens on sign-in',
    /useState<Stage>\(\(\) => \(isSignedOutHere\(\) \? 'signin' : 'doors'\)\)/.test(arr), '');
  ok('(C5) while locked there is no way back to the doors (both back links are behind !locked)',
    (arr.match(/\{!locked && \(/g) || []).length === 2, String((arr.match(/\{!locked && \(/g) || []).length));
  ok('(C6) a locked device is moved to sign-in if it lands on the doors stage',
    /if \(locked && stage === 'doors'\) setStage\('signin'\)/.test(arr), '');
  ok('(C7) a sign-in returns the screen to the doors', /if \(authState === 'authed'\) setStage\('doors'\)/.test(arr), '');
}

// =============================================================================
// PART D — the CSS: autofill matches the field's palette; the hero's hide exists.
// =============================================================================
{
  const css = read('index.css');
  ok('(D1) an autofilled field takes the theme ink colour, not the browser\'s',
    /\.wz-field:-webkit-autofill[^{]*\{[^}]*-webkit-text-fill-color:var\(--wz-ink\)/.test(css), '');
  ok('(D2) and the theme field background, painted over the browser\'s fill',
    /\.wz-field:-webkit-autofill[^{]*\{[^}]*box-shadow:0 0 0 1000px var\(--wz-lift\) inset/.test(css), '');
  ok('(D3) the hero\'s hide rule the Arrival uses exists', /\.wz-hero\.gone\{/.test(css), '');
}

// =============================================================================
// MUTATION — remove the /guest exemption. B6 must go red.
// =============================================================================
{
  const app = read('App.tsx');
  const mutated = app.replace("if (pathname === '/' || pathname === '/guest') return null;", "if (pathname === '/') return null;");
  if (mutated === app) throw new Error('mutation anchor not found');
  const guardDef = mutated.slice(mutated.indexOf('function SignedOutRouteGuard'), mutated.indexOf('function BrandMark'));
  ok('(M1) MUTATION KILLED: without the /guest exemption, B6 cannot pass',
    !/pathname === '\/guest'/.test(guardDef), '');
}

fs.rmSync(tmp, { recursive: true, force: true });

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nARRIVAL-SIGNIN VERIFY: PASS (${checks.length} checks) — screenshots and live walk not run (box turn)`
  : `\nARRIVAL-SIGNIN VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
