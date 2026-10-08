// SIGN-IN SCREEN + SIGNED-OUT-HERE — browserless. Proves the per-device flag module
// (with a fake and a throwing storage), the ordering that keeps a logout from losing
// the flag, the route guard's exemptions, and the Arrival fixes, all in source.
// The screenshots and the live walk need a box turn: scripts/evidence/arrival-signin-capture.mjs (an evidence tool, not a check).
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
  // SUPERSEDED (apiLogout cap) — by (B4b) below. Parked, not deleted: it pinned an uncapped apiLogout call.
  // Kept verbatim; `if (false)` keeps it out of the verdict.
  if (false) ok('(B4) on boot, a session left on a device that signed out is ended and the door is shown',
    bootAt > 0 && /apiLogout\(\)\.then\(\(\) => setAuthState\('anon'\)\)/.test(app.slice(bootAt, bootAt + 200)), '');
  const guardDef = app.slice(app.indexOf('function SignedOutRouteGuard'), app.indexOf('function BrandMark'));
  ok('(B5) the guard lets the door itself through', /pathname === '\/'/.test(guardDef), '');
  ok('(B6) the guard lets the guest link through, so its token in the hash is not redirected away',
    /pathname === '\/guest'/.test(guardDef), '');
  // SUPERSEDED (review fixes) — by (B7b) below. Parked, not deleted: the guard now redirects while loading too.
  // Kept verbatim; `if (false)` keeps it out of the verdict.
  if (false) ok('(B7) the guard waits for the boot check (authState must be anon), so a signed-in device is never bounced',
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
  // SUPERSEDED (review fixes) — by (C5b and C5c) below. Parked, not deleted: the account screen's back is no longer hidden when locked.
  // Kept verbatim; `if (false)` keeps it out of the verdict.
  if (false) ok('(C5) while locked there is no way back to the doors (both back links are behind !locked)',
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
  // SUPERSEDED (logout time limit) — by (F1b) below. Parked, not deleted: this pinned handleLogout's inline
  // shape, which moved into attemptSignOut. Kept verbatim; `if (false)` keeps it out of the verdict.
  if (false) ok('(F1) the dirty check comes BEFORE the logout call, the flag, the sync stop and the wipe',
    checkAt > 0 && checkAt < apiAt && checkAt < markAt && checkAt < stopAt && checkAt < resetAt, JSON.stringify({ checkAt, apiAt, markAt, stopAt, resetAt }));
  ok('(F2) a refused sign-out RETURNS: nothing after the check runs on that path',
    /showLogoutBlock\([\s\S]*?\);\s*return;/.test(body), '');
  // SUPERSEDED (logout time limit) — by (F3b) below. Parked, not deleted: this pinned handleLogout's inline
  // shape, which moved into attemptSignOut. Kept verbatim; `if (false)` keeps it out of the verdict.
  if (false) ok('(F3) the check counts any dirty record (rejected ones stay dirty, so they block; offline leaves them dirty, so it blocks)',
    /const unsaved = countDirtyRecords\(\);\s*if \(unsaved > 0\)/.test(body), '');
  ok('(F4) the refusal names the rejected records that are still unsaved',
    /getRejectedRecords\(\)\.filter\(\(r\) => dirtyIds\.has\(r\.id\)\)\.map\(\(r\) => r\.title\)/.test(body), '');
  ok('(F5) force must be exactly true — a click event passed in by accident cannot skip the safety',
    /if \(force !== true\) \{/.test(body) && /onLogout=\{\(\) => \{ void handleLogout\(\); \}\}/.test(app), '');
  // SUPERSEDED (logout time limit) — by (F6b) below. Parked, not deleted: this pinned handleLogout's inline
  // shape, which moved into attemptSignOut. Kept verbatim; `if (false)` keeps it out of the verdict.
  if (false) ok('(F6) the flag is set after the dirty check, so only a completed sign-out sets it', markAt > checkAt, '');
  // (F1b, F3b, F6b) The same three claims, against the new shape: the decision is attemptSignOut over the real count.
  const attemptAt = body.indexOf('attemptSignOut(');
  // SUPERSEDED (apiLogout cap) — by (F1c) below. Parked, not deleted: it pinned an uncapped apiLogout call.
  // Kept verbatim; `if (false)` keeps it out of the verdict.
  if (false) ok('(F1b) the dirty decision comes BEFORE the logout call, the flag, the sync stop and the wipe',
    attemptAt > 0 && attemptAt < apiAt && attemptAt < markAt && attemptAt < stopAt && attemptAt < resetAt, JSON.stringify({ attemptAt, apiAt, markAt, stopAt, resetAt }));
  ok('(F3b) the decision counts any dirty record (the real countDirtyRecords) and a blocked attempt is shown',
    /attemptSignOut\(\(\) => syncOnce\(\), countDirtyRecords\)/.test(body) && /attempt\.kind === 'blocked'/.test(body), '');
  ok('(F6b) the flag is set after that decision, so only a completed sign-out sets it', attemptAt > 0 && markAt > attemptAt, '');
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
// PART G — Enter submits: real <form>s, one submit at a time, autocomplete kept.
// =============================================================================
{
  const arr = read('components/Arrival.tsx');
  const signinForm = arr.slice(arr.indexOf('<form className="wz-form" onSubmit={(e) => { e.preventDefault(); void handleSignin(); }}>'));
  ok('(G1) sign-in is a <form> whose onSubmit prevents the default and runs handleSignin',
    /<form className="wz-form" onSubmit=\{\(e\) => \{ e\.preventDefault\(\); void handleSignin\(\); \}\}>/.test(arr), '');
  ok('(G2) the sign-in button is type="submit" (not a click handler), inside that form',
    /<button type="submit" className="wz-btn" disabled=\{busy\}>\{busy \? 'one moment…' : 'Sign in'\}<\/button>\s*<\/form>/.test(arr), '');
  ok('(G3) the account screen is a <form> too, with a submit button that runs handleCreate',
    /onSubmit=\{\(e\) => \{ e\.preventDefault\(\); void handleCreate\(\); \}\}/.test(arr)
      && /<button type="submit" className="wz-btn" disabled=\{busy\}>\{busy \? 'one moment…' : 'Create my account'\}<\/button>\s*<\/form>/.test(arr), '');
  ok('(G4) neither screen still wires its button to a click handler for submitting',
    !/onClick=\{handleSignin\}/.test(arr) && !/onClick=\{handleCreate\}/.test(arr), '');
  ok('(G5) autocomplete is kept: email, current-password on sign-in, new-password on the account form',
    (arr.match(/autoComplete="email"/g) || []).length >= 2 && /autoComplete="current-password"/.test(arr) && /autoComplete="new-password"/.test(arr), '');
  ok('(G6) both submit paths are guarded by a synchronous ref as well as the busy state (two Enters in one tick cannot both run)',
    /if \(busy \|\| submitting\.current\) return;\s*submitting\.current = true;/.test(arr.slice(arr.indexOf('const handleSignin'), arr.indexOf('const handleCreate')))
      && /if \(busy \|\| submitting\.current\) return;\s*submitting\.current = true;/.test(arr.slice(arr.indexOf('const handleCreate'))), '');
  ok('(G7) the ref is released after the call returns, so a failed sign-in can be retried',
    (arr.match(/submitting\.current = false;/g) || []).length === 2, String((arr.match(/submitting\.current = false;/g) || []).length));
  const css = read('index.css');
  ok('(G8) the form keeps the screen\'s own column and gap, so wrapping does not move anything',
    /\.wz-form\{ display:flex; flex-direction:column; align-items:center; gap:1\.5rem; margin:0; \}/.test(css), '');
  ok('(G9) the "← back" and "Create an account" links stay type="button" (Enter in a field must not trigger them)',
    !/type="submit"[^>]*>\s*(New here|← back)/.test(arr), '');
}

// =============================================================================
// PART H — THE TIME LIMIT. The real attemptSignOut, driven: a stalled push ends at the
// sheet within ~8 s with no silent logout; a clean push signs out; a failed push with
// unsaved work is blocked; the signing-out state and the buttons.
// =============================================================================
{
  const gsrc = read('store/logoutGuard.ts');
  const loadGuard = async (source, tag) => {
    const dest = path.join(DESKTOP, '.arrival-signin-guard-' + tag + '.mjs');
    fs.writeFileSync(dest, ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText);
    const mod = await import('file://' + dest.replace(/\\/g, '/') + '?t=' + Date.now());
    fs.rmSync(dest, { force: true });
    return mod;
  };
  const g = await loadGuard(gsrc, 'h');
  const never = () => new Promise(() => {});

  ok('(H1) the cap is 8000 ms ("~8 s")', g.LOGOUT_PUSH_CAP_MS === 8000, String(g.LOGOUT_PUSH_CAP_MS));

  const clean = await g.attemptSignOut(() => Promise.resolve(), () => 0, 50);
  ok('(H2) a push that finishes clean with nothing unsaved signs out (clear)', clean.kind === 'clear', JSON.stringify(clean));

  const unsaved = await g.attemptSignOut(() => Promise.resolve(), () => 2, 50);
  ok('(H3) a push that finishes but leaves records unsaved (offline-swallowed, or rejected) is BLOCKED, with the count',
    unsaved.kind === 'blocked' && unsaved.count === 2 && unsaved.timedOut === false, JSON.stringify(unsaved));

  const failed = await g.attemptSignOut(() => Promise.reject(new Error('network')), () => 3, 50);
  ok('(H4) a push that FAILS with unsaved work is blocked (it never signs out silently)', failed.kind === 'blocked' && failed.count === 3, JSON.stringify(failed));

  const threw = await g.attemptSignOut(() => { throw new Error('sync threw synchronously'); }, () => 1, 50);
  ok('(H5) a push that throws synchronously is handled the same way, not an unhandled rejection', threw.kind === 'blocked', JSON.stringify(threw));

  const stalledFast = await g.attemptSignOut(never, () => 4, 60);
  ok('(H6) a stalled push ends at the sheet (blocked, timedOut) once the cap passes',
    stalledFast.kind === 'blocked' && stalledFast.timedOut === true && stalledFast.count === 4, JSON.stringify(stalledFast));

  const stalledClean = await g.attemptSignOut(never, () => 0, 60);
  ok('(H7) a stalled push that leaves NOTHING unsaved has nothing to lose, and signs out', stalledClean.kind === 'clear', JSON.stringify(stalledClean));

  // The real constant, in real time: a stalled push, no override. Ends at the sheet within ~8 s.
  const t0 = Date.now();
  const stalledReal = await g.attemptSignOut(never, () => 2);
  const took = Date.now() - t0;
  ok('(H8) THE REAL CAP: a stalled push ends at the sheet within ~8 s (between 7.9 s and 9 s), with no silent logout',
    stalledReal.kind === 'blocked' && stalledReal.timedOut === true && took >= 7900 && took <= 9000, JSON.stringify({ took, stalledReal }));

  // A push that wins the race must not leave the timer holding the process open.
  const fastStart = Date.now();
  await g.attemptSignOut(() => Promise.resolve(), () => 0);
  ok('(H9) a push that finishes at once returns at once (the cap is not waited out)', Date.now() - fastStart < 500, String(Date.now() - fastStart));

  // MUTATION: remove the race, so the push is simply awaited. A stalled push must now HANG (H6 would never finish).
  const raceStart = gsrc.indexOf('const outcome = await Promise.race([');
  const raceEnd = gsrc.indexOf(']);', raceStart) + 3;
  if (raceStart < 0 || raceEnd < raceStart) throw new Error('race mutation anchor not found');
  const mutated = gsrc.slice(0, raceStart)
    + "const outcome = await Promise.resolve().then(push).then(() => 'done' as const, () => 'failed' as const);"
    + gsrc.slice(raceEnd);
  const mut = await loadGuard(mutated, 'mut');
  const finished = await Promise.race([
    mut.attemptSignOut(never, () => 4, 60).then(() => 'finished'),
    new Promise((r) => setTimeout(() => r('hung'), 500)),
  ]);
  ok('(H10) MUTATION KILLED: with the race removed, a stalled push HANGS the sign-out (so the race is what ends it at the sheet)',
    finished === 'hung', String(finished));

  // The signing-out state.
  let n = 0;
  const off = g.subscribeSigningOut(() => { n += 1; });
  ok('(H11) not signing out at first', g.getSigningOut() === false, '');
  g.setSigningOut(true); g.setSigningOut(true);
  ok('(H12) setting it twice notifies once', g.getSigningOut() === true && n === 1, String(n));
  g.setSigningOut(false);
  ok('(H13) clearing it notifies and returns the button', g.getSigningOut() === false && n === 2, String(n));
  off();

  // App.tsx: the state, the cap, and the buttons, in source.
  const app = read('App.tsx');
  const hs = app.indexOf('const handleLogout');
  const hbody = app.slice(hs, app.indexOf('  // CD2 S3', hs));
  const firstAwait = hbody.indexOf('await ');
  ok('(H14) "Signing out…" is set BEFORE the first await — it shows at once, not after the push',
    hbody.indexOf('setSigningOut(true)') > 0 && hbody.indexOf('setSigningOut(true)') < firstAwait, JSON.stringify({ at: hbody.indexOf('setSigningOut(true)'), firstAwait }));
  ok('(H15) a second click while one is under way is ignored', /if \(getSigningOut\(\)\) return;/.test(hbody), '');
  ok('(H16) the state is released in a finally, so a blocked sign-out (or a thrown error) gives the button back',
    /\} finally \{\s*setSigningOut\(false\);\s*\}/.test(hbody), '');
  ok('(H17) the push is capped through attemptSignOut with the real count, not a bare await of syncOnce',
    /await attemptSignOut\(\(\) => syncOnce\(\), countDirtyRecords\)/.test(hbody) && !/await syncOnce\(\)/.test(hbody), '');
  ok('(H18) the header buttons read "Signing out…" and are disabled while it runs (both layouts)',
    (app.match(/disabled=\{signingOut\}/g) || []).length === 2 && (app.match(/Signing out\\u2026/g) || []).length === 2, '');
  const casc = read('components/CascadePanels.tsx');
  ok('(H19) the Settings button reads "Signing out…" and is disabled while it runs',
    /disabled=\{signingOut\}/.test(casc) && /t\('logoutSigningOut'\)/.test(casc), '');
}

// (B4b, F1c) the successors of the two parked checks, self-contained.
{
  const app = read('App.tsx');
  const bootAt = app.indexOf("bootDecision(!!user, isSignedOutHere()) === 'end-session'");
  ok('(B4b) on boot, a session left on a device that signed out is ended (capped) and the door is shown',
    bootAt > 0 && /void endServerSession\(apiLogout\)\.then\(\(\) => setAuthState\('anon'\)\)/.test(app.slice(bootAt, bootAt + 500)), '');
  const hs = app.indexOf('const handleLogout');
  const body = app.slice(hs, app.indexOf('  // CD2 S3', hs));
  const attemptAt = body.indexOf('attemptSignOut(');
  const endAt = body.indexOf('endServerSession(apiLogout)');
  ok('(F1c) the dirty decision comes BEFORE the capped server logout, the flag, the sync stop and the wipe',
    attemptAt > 0 && attemptAt < endAt && attemptAt < body.indexOf('markSignedOutHere()') && attemptAt < body.indexOf('stopSync()') && attemptAt < body.indexOf('resetLocalData()'), '');
}

// =============================================================================
// PART I — THE SECOND CAP. endServerSession never hangs the sign-out; a timeout still finishes the
// sign-out on this device; and the boot cleanup retries the server logout on the next load.
// =============================================================================
{
  const gsrc = read('store/logoutGuard.ts');
  const loadGuard = async (source, tag) => {
    const dest = path.join(DESKTOP, '.arrival-signin-guard-' + tag + '.mjs');
    fs.writeFileSync(dest, ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText);
    const mod = await import('file://' + dest.replace(/\\/g, '/') + '?t=' + Date.now());
    fs.rmSync(dest, { force: true });
    return mod;
  };
  const g = await loadGuard(gsrc, 'i');
  const never = () => new Promise(() => {});

  ok('(I1) the server cap is 5000 ms ("~5 s")', g.LOGOUT_SERVER_CAP_MS === 5000, String(g.LOGOUT_SERVER_CAP_MS));
  ok('(I2) a logout that answers reports done', (await g.endServerSession(() => Promise.resolve(), 50)) === 'done', '');
  ok('(I3) a logout that rejects reports failed — and never throws', (await g.endServerSession(() => Promise.reject(new Error('x')), 50)) === 'failed', '');
  ok('(I4) a logout that throws synchronously reports failed too', (await g.endServerSession(() => { throw new Error('x'); }, 50)) === 'failed', '');
  ok('(I5) a logout that hangs reports timeout once the cap passes', (await g.endServerSession(never, 60)) === 'timeout', '');

  const t0 = Date.now();
  const real = await g.endServerSession(never);
  const took = Date.now() - t0;
  ok('(I6) THE REAL CAP: a hung server logout gives up within ~5 s (between 4.9 s and 6 s) — "Signing out…" cannot stay up indefinitely',
    real === 'timeout' && took >= 4900 && took <= 6000, JSON.stringify({ real, took }));

  // The whole story, with the REAL flag module and the REAL guard functions against a fake server:
  // sign out while the server logout hangs -> the device is signed out anyway -> the next load ends the session.
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
  const server = { sessionAlive: true, logoutCalls: 0 };
  const hangingLogout = () => { server.logoutCalls += 1; return new Promise(() => {}); };
  const workingLogout = () => { server.logoutCalls += 1; server.sessionAlive = false; return Promise.resolve(); };

  // 1) the sign-out: the same order handleLogout runs — end the server session (capped), THEN set the flag.
  const outcome1 = await g.endServerSession(hangingLogout, 60);
  flag.markSignedOutHere();
  ok('(I7) the server logout timed out, and the sign-out still FINISHED on this device (the flag is set)',
    outcome1 === 'timeout' && flag.isSignedOutHere() === true, outcome1);
  ok('(I8) the server session is still alive after that sign-out (the hang left it), which is exactly what the next load must clean up',
    server.sessionAlive === true, '');

  // 2) the next load: a live session on a device that signed out.
  const decision = g.bootDecision(server.sessionAlive, flag.isSignedOutHere());
  ok('(I9) the next load sees a live session on a signed-out device and decides to END it (not resume it)', decision === 'end-session', decision);
  const outcome2 = await g.endServerSession(workingLogout, 60);
  ok('(I10) the boot cleanup retries the server logout, and this time it takes: the session is gone',
    outcome2 === 'done' && server.logoutCalls === 2 && server.sessionAlive === false, JSON.stringify({ outcome2, calls: server.logoutCalls }));
  ok('(I11) and the flag is still set afterwards (only a sign-in clears it), so the device stays on the sign-in screen',
    flag.isSignedOutHere() === true, '');
  ok('(I12) a load with no session, or on a device that never signed out, is unchanged',
    g.bootDecision(false, true) === 'anon' && g.bootDecision(false, false) === 'anon' && g.bootDecision(true, false) === 'authed', '');
  delete globalThis.localStorage;

  // MUTATION: remove the race from endServerSession. A hung logout must now HANG the sign-out.
  const rs = gsrc.indexOf('export async function endServerSession');
  const raceStart = gsrc.indexOf('const outcome = await Promise.race([', rs);
  const raceEnd = gsrc.indexOf(']);', raceStart) + 3;
  if (rs < 0 || raceStart < 0 || raceEnd < raceStart) throw new Error('endServerSession race mutation anchor not found');
  const mutated = gsrc.slice(0, raceStart)
    + "const outcome = await Promise.resolve().then(logout).then(() => 'done' as const, () => 'failed' as const);"
    + gsrc.slice(raceEnd);
  const mut = await loadGuard(mutated, 'imut');
  const finished = await Promise.race([
    mut.endServerSession(never, 60).then(() => 'finished'),
    new Promise((r) => setTimeout(() => r('hung'), 500)),
  ]);
  ok('(I13) MUTATION KILLED: with the race removed, a hung server logout HANGS the sign-out (so the race is what ends "Signing out…")',
    finished === 'hung', String(finished));

  // App.tsx, in source: both paths use the capped call, in the right order.
  const app = read('App.tsx');
  const hs = app.indexOf('const handleLogout');
  const hbody = app.slice(hs, app.indexOf('  // CD2 S3', hs));
  const endAt = hbody.indexOf('await endServerSession(apiLogout)');
  ok('(I14) handleLogout ends the server session through the CAPPED call, and no bare apiLogout await remains',
    endAt > 0 && !/await apiLogout\(\)/.test(hbody), '');
  ok('(I15) the flag, the sync stop and the wipe come AFTER that call, so a timeout falls through to finish the sign-out here',
    endAt < hbody.indexOf('markSignedOutHere()') && endAt < hbody.indexOf('stopSync()') && endAt < hbody.indexOf('resetLocalData()'), '');
  ok('(I16) the boot cleanup is capped too (a hung server cannot keep boot on "loading") and decides through bootDecision',
    /bootDecision\(!!user, isSignedOutHere\(\)\) === 'end-session'/.test(app) && /void endServerSession\(apiLogout\)\.then\(\(\) => setAuthState\('anon'\)\)/.test(app), '');
}

// =============================================================================
// PART J — a request that never arrives must not strand the form; the account screen is no dead end.
// =============================================================================
{
  const helperSrc = read('store/authSubmit.ts');
  const loadHelper = async (source, tag) => {
    const dest = path.join(DESKTOP, '.arrival-signin-auth-' + tag + '.mjs');
    fs.writeFileSync(dest, ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText);
    const mod = await import('file://' + dest.replace(/\\/g, '/') + '?t=' + Date.now());
    fs.rmSync(dest, { force: true });
    return mod;
  };
  const h = await loadHelper(helperSrc, 'j');

  ok('(J1) the network line is the approved wording', h.NETWORK_ERROR_LINE === "Couldn’t reach Wrizo. Check your connection and try again.", h.NETWORK_ERROR_LINE);
  const thrown = await h.runAuthCall(() => Promise.reject(new TypeError('Failed to fetch')));
  ok('(J2) a call that THROWS (fetch on a dead network) becomes a failed result carrying that line — it does not throw',
    thrown.ok === false && thrown.error === h.NETWORK_ERROR_LINE, JSON.stringify(thrown));
  const syncThrow = await h.runAuthCall(() => { throw new Error('threw before returning a promise'); });
  ok('(J3) a call that throws synchronously is handled the same way', syncThrow.ok === false && syncThrow.error === h.NETWORK_ERROR_LINE, JSON.stringify(syncThrow));
  const good = await h.runAuthCall(() => Promise.resolve({ ok: true, user: { id: 'u', email: 'e' } }));
  const refused = await h.runAuthCall(() => Promise.resolve({ ok: false, error: 'Invalid email or password' }));
  ok('(J4) a normal result passes through untouched — the server\'s own refusal text is not replaced',
    good.ok === true && good.user.id === 'u' && refused.ok === false && refused.error === 'Invalid email or password', JSON.stringify({ good, refused }));

  const arr = read('components/Arrival.tsx');
  const signinFn = arr.slice(arr.indexOf('const handleSignin'), arr.indexOf('const handleCreate'));
  const createFn = arr.slice(arr.indexOf('const handleCreate'), arr.indexOf('return (', arr.indexOf('const handleCreate')));
  const FINALLY = /\} finally \{\s*submitting\.current = false;\s*setBusy\(false\);\s*\}/;
  ok('(J5) sign-in gives the form back in a finally (the ref and the busy state), whatever happens inside', FINALLY.test(signinFn), '');
  ok('(J6) so does account creation', FINALLY.test(createFn), '');
  ok('(J7) both go through runAuthCall, not a bare await of apiLogin / apiRegister',
    /await runAuthCall\(\(\) => apiLogin\(/.test(signinFn) && /await runAuthCall\(\(\) => apiRegister\(/.test(createFn)
      && !/await apiLogin\(/.test(signinFn) && !/await apiRegister\(/.test(createFn), '');
  ok('(J8) neither handler resets the ref or the busy state outside its finally (a throw cannot skip the reset)',
    (signinFn.match(/submitting\.current = false;/g) || []).length === 1 && (createFn.match(/submitting\.current = false;/g) || []).length === 1, '');

  // MUTATION 1: take the finally away from sign-in. J5 must go red on the mutant.
  const mutatedSignin = signinFn.replace(FINALLY, '}');
  ok('(J9) MUTATION KILLED: without the finally, J5\'s predicate goes red', mutatedSignin !== signinFn && !FINALLY.test(mutatedSignin), '');
  // MUTATION 2: take the catch out of runAuthCall, so a rejected call throws. J2 must go red on the mutant.
  const catchAt = helperSrc.indexOf('} catch {');
  if (catchAt < 0) throw new Error('runAuthCall catch anchor not found');
  const noCatch = helperSrc.slice(0, catchAt) + '} finally {' + helperSrc.slice(helperSrc.indexOf('\n', catchAt));
  const mh = await loadHelper(noCatch.replace(/return \{ ok: false, error: NETWORK_ERROR_LINE \};/, ''), 'jmut');
  let mutantThrew = false;
  try { await mh.runAuthCall(() => Promise.reject(new TypeError('Failed to fetch'))); } catch { mutantThrew = true; }
  ok('(J10) MUTATION KILLED: without the catch, a dead network THROWS out of runAuthCall (so the catch is what unsticks the form)', mutantThrew === true, '');
}

// (B7b, C5b) the successors of the two parked checks, self-contained.
{
  const app = read('App.tsx');
  const guardDef = app.slice(app.indexOf('function SignedOutRouteGuard'), app.indexOf('function BrandMark'));
  ok('(B7b) the guard redirects while loading as well as once anon (a flagged load can only end anon), and never bounces an authed device',
    /if \(authState === 'authed' \|\| !isSignedOutHere\(\)\) return null;/.test(guardDef) && !/authState !== 'anon'/.test(guardDef), '');
  const arr = read('components/Arrival.tsx');
  ok('(C5b) while locked, sign-in\'s back (to the doors) is hidden — exactly ONE back link sits behind !locked',
    (arr.match(/\{!locked && \(/g) || []).length === 1, String((arr.match(/\{!locked && \(/g) || []).length));
  const acct = arr.slice(arr.indexOf("{stage === 'account' && ("));
  ok('(C5c) the ACCOUNT screen\'s back is not hidden when locked, and it goes to sign-in (so "New here?" is never a dead end)',
    !/!locked/.test(acct) && /setStage\('signin'\); \}\}>← back/.test(acct) && !/setStage\('doors'\)/.test(acct), '');
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

// MUTATION — drop the synchronous ref guard. G6 must go red on the mutant.
{
  const arr = read('components/Arrival.tsx');
  const mutated = arr.replace('if (busy || submitting.current) return;', 'if (busy) return;');
  if (mutated === arr) throw new Error('ref-guard mutation anchor not found');
  ok('(M3) MUTATION KILLED: without the ref guard, G6\'s predicate goes red',
    !/if \(busy \|\| submitting\.current\) return;\s*submitting\.current = true;/.test(mutated.slice(mutated.indexOf('const handleSignin'), mutated.indexOf('const handleCreate'))), '');
}

// MUTATION — remove the dirty check from handleLogout. F3's predicate must go red on the mutant.
// SUPERSEDED (logout time limit) — by (M2b) below. Parked, not deleted: its anchor lived in the inline shape.
if (false) {
  const app = read('App.tsx');
  const mutated = app.replace('if (unsaved > 0) {', 'if (false) {');
  if (mutated === app) throw new Error('logout mutation anchor not found');
  const start = mutated.indexOf('const handleLogout');
  const body = mutated.slice(start, mutated.indexOf('  // CD2 S3', start));
  ok('(M2) MUTATION KILLED: with the dirty check disabled, F3\'s predicate goes red',
    !/const unsaved = countDirtyRecords\(\);\s*if \(unsaved > 0\)/.test(body), '');
}

// MUTATION — (M2b) disable the blocked branch in handleLogout. F3b's predicate must go red on the mutant.
{
  const app = read('App.tsx');
  const mutated = app.replace("if (attempt.kind === 'blocked') {", 'if (false) {');
  if (mutated === app) throw new Error('logout (M2b) mutation anchor not found');
  const start = mutated.indexOf('const handleLogout');
  const body = mutated.slice(start, mutated.indexOf('  // CD2 S3', start));
  ok('(M2b) MUTATION KILLED: with the blocked branch disabled, F3b\'s predicate goes red',
    !/attempt\.kind === 'blocked'/.test(body), '');
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
