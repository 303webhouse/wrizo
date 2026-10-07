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
// PART E — a successful sign-in LEAVES the sign-in stage (Fable: "login doesn't work").
// =============================================================================
{
  const arr = read('components/Arrival.tsx');
  const signinFn = arr.slice(arr.indexOf('const handleSignin'), arr.indexOf('const handleCreate'));
  ok('(E1) a successful sign-in goes where an authed Open goes (onAuthed, then openAsAuthed — it does not sit on the stage)',
    /if \(res\.ok && res\.user\) \{ onAuthed\(res\.user\); openAsAuthed\(\); \}/.test(signinFn), signinFn.slice(0, 300));
  const createFn = arr.slice(arr.indexOf('const handleCreate'), arr.indexOf('return (', arr.indexOf('const handleCreate')));
  ok('(E2) so does a successful account creation', /onAuthed\(res\.user\); openAsAuthed\(\);/.test(createFn), '');
  const openFn = arr.slice(arr.indexOf('const openAsAuthed'), arr.indexOf('const handleOpen'));
  ok('(E3) that target is the resume target, else Write — the same one Open uses',
    /getResumeTarget\(\)/.test(openFn) && /navigate\(target\.route/.test(openFn) && /handleWrite\(\)/.test(openFn), '');
  ok('(E4) Open itself uses the same function (one door, not two copies)',
    /if \(authState === 'authed'\) \{ openAsAuthed\(\); return; \}/.test(arr), '');
  const app = read('App.tsx');
  const authedFn = app.slice(app.indexOf('const handleAuthed'), app.indexOf('const handleLogout'));
  ok('(E5) the sign-in clears the signed-out flag before anything navigates', /clearSignedOutHere\(\);/.test(authedFn), '');
}

// =============================================================================
// PART F — logout safety: never wipe while records are dirty; rejected and offline
// block; "sign out anyway" is a second, confirmed step; the flag follows a COMPLETED sign-out.
// =============================================================================
{
  const app = read('App.tsx');
  const start = app.indexOf('const handleLogout');
  const body = app.slice(start, app.indexOf('  // CD2 S3', start));
  const checkAt = body.indexOf('countDirtyRecords()');
  const apiAt = body.indexOf('await apiLogout()');
  const markAt = body.indexOf('markSignedOutHere()');
  const resetAt = body.indexOf('resetLocalData()');
  const stopAt = body.indexOf('stopSync()');
  ok('(F1) the dirty check comes BEFORE the logout call, the flag, the sync stop and the wipe',
    checkAt > 0 && checkAt < apiAt && checkAt < markAt && checkAt < stopAt && checkAt < resetAt, JSON.stringify({ checkAt, apiAt, markAt, stopAt, resetAt }));
  ok('(F2) a refused sign-out RETURNS: nothing after the check runs on that path',
    /showLogoutBlock\([\s\S]*?\);\s*return;/.test(body), '');
  ok('(F3) the check counts any dirty record (rejected ones stay dirty, so they block; offline leaves them dirty, so it blocks)',
    /const unsaved = countDirtyRecords\(\);\s*if \(unsaved > 0\)/.test(body), '');
  ok('(F4) the refusal names the rejected records that are still unsaved',
    /getRejectedRecords\(\)\.filter\(\(r\) => dirtyIds\.has\(r\.id\)\)\.map\(\(r\) => r\.title\)/.test(body), '');
  ok('(F5) force must be exactly true — a click event passed in by accident cannot skip the safety',
    /if \(force !== true\) \{/.test(body) && /onLogout=\{\(\) => \{ void handleLogout\(\); \}\}/.test(app), '');
  ok('(F6) the flag is set after the dirty check, so only a completed sign-out sets it', markAt > checkAt, '');
  ok('(F7) the blocked sheet is an overlay beside the routes, never inside <Routes>',
    app.indexOf('<LogoutBlockedSheet />') > 0 && !(app.indexOf('<LogoutBlockedSheet />') > app.indexOf('<Routes>') && app.indexOf('<LogoutBlockedSheet />') < app.indexOf('</Routes>')), '');
  const casc = read('components/CascadePanels.tsx');
  ok('(F8) the Settings sign-out no longer navigates away at once (a refused sign-out must not move the writer)',
    /onClick=\{\(\) => \{ requestLogout\(\); \}\}/.test(casc) && !/requestLogout\(\); navigate\('\/'\)/.test(casc), '');

  const sheet = read('components/LogoutBlockedSheet.tsx');
  ok('(F9) "sign out anyway" is a second step: the first click only asks; only the confirm sends force',
    /setConfirming\(true\)/.test(sheet) && (sheet.match(/requestLogout\(true\)/g) || []).length === 1
      && sheet.indexOf('requestLogout(true)') > sheet.indexOf('wz-logout-confirm'), '');
  ok('(F10) "Stay signed in" is the default: focus starts on it, and Esc means stay',
    /stayRef\.current\?\.focus\(\)/.test(sheet) && /e\.key === 'Escape'[\s\S]*?clearLogoutBlock\(\)/.test(sheet), '');

  // The wording, read from the REAL lexicon and run through the REAL pure module.
  const lex = read('store/deskLexicon.ts');
  const lexVal = (key) => {
    const m = lex.match(new RegExp('  ' + key + ": ('(?:[^'\\\\]|\\\\.)*'),"));
    if (!m) throw new Error('lexicon key missing: ' + key);
    return new Function('return ' + m[1])();
  };
  const lexKeys = ['logoutBlockedBody', 'logoutBlockedBodyOne', 'logoutBlockedRejected', 'logoutAnyway', 'logoutAnywayOne', 'logoutAnywayConfirm', 'logoutAnywayConfirmOne', 'logoutStay', 'logoutAnywayBack'];
  const LEX = Object.fromEntries(lexKeys.map((k) => [k, lexVal(k)]));
  const t = (k) => LEX[k];
  const gout = ts.transpileModule(read('store/logoutGuard.ts'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
  const gdest = path.join(DESKTOP, '.arrival-signin-guard.mjs');
  fs.writeFileSync(gdest, gout);
  const guard = await import('file://' + gdest.replace(/\\/g, '/') + '?t=' + Date.now());
  fs.rmSync(gdest, { force: true });
  const w3 = guard.logoutWords(3, t);
  ok('(F11) the body is the approved sentence, with the count in it',
    w3.body === "3 changes haven’t saved to your account yet. Stay signed in until they save, or sign out anyway and lose them.", w3.body);
  ok('(F12) the second step reads "Sign out anyway (N changes will be lost)"', w3.anyway === 'Sign out anyway (3 changes will be lost)', w3.anyway);
  const w1 = guard.logoutWords(1, t);
  ok('(F13) a single change reads as one (no "1 changes")',
    !/1 changes/.test(w1.body + w1.anyway + w1.confirm) && /1 change /.test(w1.body) && /\(1 change will be lost\)/.test(w1.anyway), JSON.stringify(w1));
  const named = guard.rejectedLine(['Q&A $& notes', 'Chapter 2'], t);
  ok('(F14) rejected titles are named verbatim (a title with $& is not mangled)', named.includes('Q&A $& notes') && named.includes('Chapter 2'), named);
  ok('(F15) no rejected records, no line', guard.rejectedLine([], t) === null, '');

  let seen = 0;
  const un = guard.subscribeLogoutBlock(() => { seen += 1; });
  guard.showLogoutBlock({ count: 2, rejectedTitles: [] });
  ok('(F16) the block state is shown and readable', guard.getLogoutBlock()?.count === 2 && seen === 1, '');
  guard.clearLogoutBlock(); guard.clearLogoutBlock();
  ok('(F17) clearing notifies once, and a second clear is a no-op', guard.getLogoutBlock() === null && seen === 2, String(seen));
  un();
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

// MUTATION — remove the dirty check from handleLogout. F3's predicate must go red on the mutant.
{
  const app = read('App.tsx');
  const mutated = app.replace('if (unsaved > 0) {', 'if (false) {');
  if (mutated === app) throw new Error('logout mutation anchor not found');
  const start = mutated.indexOf('const handleLogout');
  const body = mutated.slice(start, mutated.indexOf('  // CD2 S3', start));
  ok('(M2) MUTATION KILLED: with the dirty check disabled, F3\'s predicate goes red',
    !/const unsaved = countDirtyRecords\(\);\s*if \(unsaved > 0\)/.test(body), '');
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
