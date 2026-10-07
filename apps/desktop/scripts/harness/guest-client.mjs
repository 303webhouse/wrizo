// GUEST LOGIN (item 225) — the client pass, browserless. Proves the pure guest
// helpers, the real api.ts calls against a stubbed fetch (the wire shape the
// server actually sends), the sync loop's guest_expired branch in source, and the
// route and overlay placement. A browser walk of the arrival and the claim sheet
// needs a box turn and is NOT run here — named, not implied.
//
// Run: node scripts/harness/guest-client.mjs   (from apps/desktop)
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

const tmp = path.join(DESKTOP, '.guest-client-harness-scratch');
fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(path.join(tmp, 'store'), { recursive: true });

// Transpile a real module to ESM next to itself, so its own relative imports resolve.
function loadEsm(rel) {
  const text = fs.readFileSync(path.join(SRC, rel), 'utf8');
  const out = ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
  const dest = path.join(tmp, rel.replace(/\.ts$/, '.mjs'));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, out);
  return import(`file://${dest.replace(/\\/g, '/')}?t=${Date.now()}`);
}

const guest = await loadEsm('store/guestState.ts');
const api = await loadEsm('store/api.ts');
const sync = { text: fs.readFileSync(path.join(SRC, 'store/sync.ts'), 'utf8') };
const app = fs.readFileSync(path.join(SRC, 'App.tsx'), 'utf8');
const css = fs.readFileSync(path.join(SRC, 'index.css'), 'utf8');
const arrival = fs.readFileSync(path.join(SRC, 'components/GuestArrival.tsx'), 'utf8');
const sheet = fs.readFileSync(path.join(SRC, 'components/GuestClaimSheet.tsx'), 'utf8');

// =============================================================================
// PART A — the token: read once from the hash, removed from the address bar.
// =============================================================================
ok('(A1) a token is read from #/guest?t=<token>', guest.readGuestTokenFromHash('#/guest?t=abc123') === 'abc123', '');
ok('(A2) no t parameter is no token (null), never a guess',
  guest.readGuestTokenFromHash('#/guest') === null && guest.readGuestTokenFromHash('#/guest?x=1') === null, '');
ok('(A3) an empty t is no token (null)', guest.readGuestTokenFromHash('#/guest?t=') === null, '');
ok('(A4) a token with URL-safe characters survives the read intact',
  guest.readGuestTokenFromHash('#/guest?t=AbC-_09') === 'AbC-_09', '');

const before = 'http://localhost:5173/?x=1#/guest?t=SECRET-TOKEN';
const after = guest.guestAddressWithoutToken(before);
ok('(A5) the address bar loses the token', !after.includes('SECRET-TOKEN') && !after.includes('t='), after);
ok('(A6) the address bar keeps the route, so the arrival stays on /guest', after.endsWith('#/guest'), after);
ok('(A7) and keeps the rest of the URL (the query string before the hash)', after.includes('?x=1'), after);

// =============================================================================
// PART B — the expired state: set by the sync loop, cleared by a claim, observed.
// =============================================================================
{
  let calls = 0;
  const unsub = guest.subscribeGuestExpired(() => { calls += 1; });
  guest.clearGuestExpired();
  ok('(B1) starts not expired', guest.isGuestExpired() === false, '');
  guest.markGuestExpired();
  guest.markGuestExpired();
  ok('(B2) marking twice notifies once (no re-render storm)', guest.isGuestExpired() === true && calls === 1, String(calls));
  guest.clearGuestExpired();
  ok('(B3) a claim clears it and notifies', guest.isGuestExpired() === false && calls === 2, String(calls));
  unsub();
  guest.markGuestExpired();
  ok('(B4) an unsubscribed listener is no longer called', calls === 2, String(calls));
  guest.clearGuestExpired();
}

ok('(B5) the one plain line is the exact approved wording',
  guest.GUEST_EXPIRED_LINE === 'Your guest time is over — create an account to keep your work here', guest.GUEST_EXPIRED_LINE);

// =============================================================================
// PART C — the wire: the real api.ts against a stubbed fetch.
// =============================================================================
const realFetch = globalThis.fetch;
const captured = [];
const consoleSeen = [];
const realLog = console.log, realErr = console.error, realWarn = console.warn;
for (const k of ['log', 'error', 'warn', 'info', 'debug']) console[k] = (...a) => consoleSeen.push(a.map(String).join(' '));
let nextResponse = null;
globalThis.fetch = async (url, opts = {}) => {
  captured.push({ url, method: opts.method ?? 'GET', body: opts.body });
  const r = nextResponse; nextResponse = null;
  return new Response(JSON.stringify(r.body), { status: r.status, headers: { 'Content-Type': 'application/json' } });
};

try {
  nextResponse = { status: 401, body: { error: 'This guest account has expired.', reason: 'guest_expired' } };
  let caught = null;
  try { await api.apiSync({ lastSyncAt: null, push: {} }); } catch (e) { caught = e; }
  ok('(C1) a 401 from /api/sync surfaces as SyncHttpError carrying the server\'s guest_expired reason',
    caught && caught.status === 401 && caught.reason === 'guest_expired', JSON.stringify({ status: caught?.status, reason: caught?.reason }));

  nextResponse = { status: 401, body: { error: 'Not authenticated' } };
  caught = null;
  try { await api.apiSync({ lastSyncAt: null, push: {} }); } catch (e) { caught = e; }
  ok('(C2) an ordinary 401 carries NO reason, so it is still not mistaken for an expired guest',
    caught && caught.status === 401 && caught.reason === undefined, JSON.stringify({ reason: caught?.reason }));

  nextResponse = { status: 413, body: { error: 'too big' } };
  caught = null;
  try { await api.apiSync({ lastSyncAt: null, push: {} }); } catch (e) { caught = e; }
  ok('(C3) a 413 is unchanged: status kept, no reason attached', caught && caught.status === 413 && caught.reason === undefined, '');

  const TOKEN = 'WIRE-TOKEN-XYZ';
  nextResponse = { status: 200, body: { id: 'g1', email: 'guest+g1@guest.invalid', name: null, guest: true } };
  const g = await api.apiGuest(TOKEN);
  const gCall = captured[captured.length - 1];
  ok('(C4) apiGuest posts the token to /auth/guest in the body, and returns the user on success',
    gCall.url === '/auth/guest' && gCall.method === 'POST' && JSON.parse(gCall.body).token === TOKEN && g.ok === true && g.user?.id === 'g1',
    JSON.stringify({ url: gCall.url, ok: g.ok }));

  nextResponse = { status: 403, body: { error: 'This guest link is not valid.' } };
  const bad = await api.apiGuest('nope');
  nextResponse = { status: 401, body: { error: 'This guest account has expired.', reason: 'guest_expired' } };
  const dead = await api.apiGuest('dead-link');
  ok('(C4b) a dead link returns the guest_expired reason alongside the server sentence', dead.ok === false && dead.reason === 'guest_expired', JSON.stringify(dead));
  ok('(C5) a refused link returns the server\'s own sentence, nothing invented', bad.ok === false && bad.error === 'This guest link is not valid.', JSON.stringify(bad));

  nextResponse = { status: 200, body: { id: 'g1', email: 'writer@example.com', name: 'Ada' } };
  const c = await api.apiClaim('writer@example.com', 'longenough', 'Ada');
  const cCall = captured[captured.length - 1];
  const cBody = JSON.parse(cCall.body);
  ok('(C6) apiClaim posts email, password and name to /auth/claim, and returns the claimed user',
    cCall.url === '/auth/claim' && cBody.email === 'writer@example.com' && cBody.password === 'longenough' && c.ok === true,
    JSON.stringify({ url: cCall.url, ok: c.ok }));

  nextResponse = { status: 400, body: { error: 'Could not create an account with that information.' } };
  const cDup = await api.apiClaim('taken@example.com', 'longenough');
  ok('(C7) a refused claim returns the server\'s neutral sentence', cDup.ok === false && /Could not create an account/.test(cDup.error), JSON.stringify(cDup));

  ok('(C8) the token never reaches a console call during the wire tests',
    !consoleSeen.some((line) => line.includes(TOKEN)), JSON.stringify(consoleSeen.slice(0, 2)));
} finally {
  globalThis.fetch = realFetch;
  console.log = realLog; console.error = realErr; console.warn = realWarn;
}

// =============================================================================
// PART D — source: the sync loop, the route, the overlay, the arrival order.
// =============================================================================
{
  const catchStart = sync.text.indexOf("if (e instanceof SyncHttpError && e.reason === 'guest_expired')");
  const backoffAfter = sync.text.indexOf('scheduleBackoff();', catchStart);
  const offlineAfter = sync.text.indexOf("setStatus('offline');", catchStart);
  ok('(D1) the sync catch handles guest_expired BEFORE the offline/backoff path',
    catchStart > 0 && catchStart < offlineAfter && catchStart < backoffAfter, JSON.stringify({ catchStart, offlineAfter, backoffAfter }));
  const branch = sync.text.slice(catchStart, offlineAfter);
  ok('(D2) that branch stops the loop and marks the expired state, then returns',
    /stopSync\(\);/.test(branch) && /markGuestExpired\(\);/.test(branch) && /return;/.test(branch), '');
  ok('(D3) the expired branch does not set the status to offline (the copy is not a dead network)',
    !branch.includes("setStatus('offline')"), '');

  ok('(D4) the /guest route is registered', /<Route path="\/guest" element=\{<GuestArrival/.test(app), '');
  const sheetIdx = app.indexOf('<GuestClaimSheet />');
  const appMainIdx = app.indexOf('<AppMain>');
  const routesEnd = app.indexOf('</Routes>');
  ok('(D5) the claim sheet is an overlay beside the routes: rendered before <AppMain>, never inside <Routes>',
    sheetIdx > 0 && sheetIdx < appMainIdx && !(sheetIdx > app.indexOf('<Routes>') && sheetIdx < routesEnd), JSON.stringify({ sheetIdx, appMainIdx }));

  const replaceIdx = arrival.indexOf('window.history.replaceState');
  const apiIdx = arrival.indexOf('apiGuest(token)');
  ok('(D6) the address bar is rewritten BEFORE the network call (the token never sits in the bar during a round trip)',
    replaceIdx > 0 && replaceIdx < apiIdx, JSON.stringify({ replaceIdx, apiIdx }));
  ok('(D7) the arrival page logs nothing (no console call in the guest components)',
    !/console\./.test(arrival) && !/console\./.test(sheet) && !/console\./.test(fs.readFileSync(path.join(SRC, 'store/guestState.ts'), 'utf8')), '');
  ok('(D8) the overlay is fixed-position, so it cannot displace the page',
    /\.wz-guest-sheet \{ position: fixed; inset: 0;/.test(css), '');
  ok('(D9) the sheet offers a way to keep writing without claiming ("Not now")',
    /Not now — keep writing here/.test(sheet), '');
  ok('(D10) the sheet shows the one plain line, not a sign-in error',
    /GUEST_EXPIRED_LINE/.test(sheet) && !/Could not sign in/.test(sheet), '');
}

// Mutation: remove the guest_expired branch from the sync catch. D1 must go red.
{
  const branchStart = sync.text.indexOf("    if (e instanceof SyncHttpError && e.reason === 'guest_expired') {");
  const branchEnd = sync.text.indexOf('    }', sync.text.indexOf('return;', branchStart)) + 5;
  if (branchStart < 0 || branchEnd < branchStart) throw new Error('mutation anchor not found');
  const mutated = sync.text.slice(0, branchStart) + sync.text.slice(branchEnd);
  // D1's own predicate, run on the mutant: the expired branch must be found before offline/backoff.
  const mCatchStart = mutated.indexOf("if (e instanceof SyncHttpError && e.reason === 'guest_expired')");
  const mOffline = mutated.indexOf("setStatus('offline');", Math.max(mCatchStart, 0));
  const mD1 = mCatchStart > 0 && mCatchStart < mOffline;
  ok('(D11) MUTATION KILLED: with the guest_expired branch removed, D1\'s own predicate goes red on the mutant',
    mD1 === false, JSON.stringify({ mCatchStart, mOffline }));
}

// PART G — the claim form: Enter submits, once.
{
  ok('(G1) the claim is a <form> whose onSubmit prevents the default and runs submit',
    /<form className="wz-guest-form" onSubmit=\{\(e\) => \{ e\.preventDefault\(\); void submit\(\); \}\}>/.test(sheet), '');
  ok('(G2) its button is type="submit", not a click handler',
    /<button type="submit" className="wz-btn wz-primary" disabled=\{busy\}>/.test(sheet) && !/onClick=\{\(\) => void submit\(\)\}/.test(sheet), '');
  ok('(G3) a synchronous ref guards the submit, released after the call, so two Enters in one tick cannot both run',
    /if \(busy \|\| submitting\.current\) return;\s*submitting\.current = true;/.test(sheet) && /submitting\.current = false;/.test(sheet), '');
  ok('(G4) autocomplete is kept (email, new-password)', /autoComplete="email"/.test(sheet) && /autoComplete="new-password"/.test(sheet), '');
}

// =============================================================================
// PART E — the sheet's focus handling, in source. The behaviour itself (focus
// really moves, Tab really wraps, Esc really closes) is walked in a real browser
// by guest-client-walk.mjs; these checks pin the wiring so it cannot silently go.
// =============================================================================
{
  const sheetSrc = sheet;
  ok('(E1) focus moves into the sheet when it opens (the email field is focused on open)',
    /emailRef\.current\?\.focus\(\)/.test(sheetSrc), '');
  ok('(E2) the trap is a CAPTURE-phase document listener, so the editor underneath never sees Tab/Esc',
    /document\.addEventListener\('keydown', onKey, true\)/.test(sheetSrc)
      && /document\.removeEventListener\('keydown', onKey, true\)/.test(sheetSrc), '');
  ok('(E3) Tab wraps inside the panel in both directions, and pulls focus back in when it has escaped',
    /e\.shiftKey && \(!inside \|\| active === first\)/.test(sheetSrc) && /!e\.shiftKey && \(!inside \|\| active === last\)/.test(sheetSrc), '');
  ok('(E4) Esc is "Not now": it dismisses and stops propagation',
    /e\.key === 'Escape'/.test(sheetSrc) && /setDismissed\(true\)/.test(sheetSrc) && /e\.stopPropagation\(\)/.test(sheetSrc), '');
  ok('(E5) closing returns focus to the element that had it before the sheet opened',
    /returnTo\.current = document\.activeElement/.test(sheetSrc) && /back\.focus\(\)/.test(sheetSrc)
      && /document\.contains\(back\)/.test(sheetSrc), '');
  ok('(E6) every hook runs before the early return (no conditional hook order)',
    sheetSrc.indexOf('useEffect(() => {\n    if (!visible) return;') < sheetSrc.indexOf('if (!visible) return null;'), '');
}

// =============================================================================
// PART H — a guest entering on a SIGNED-OUT device must lift the signed-out flag.
// The write-belt (persistence.upsert) drops every record write while the flag is set. A guest whose session started
// under it would write, see their words, and lose all of it. Run against the REAL persistence.ts.
// =============================================================================
{
  const { build } = createRequire(require.resolve('vite'))('esbuild');
  let hn = 0;
  const loadStore = async () => {
    hn += 1;
    const res = await build({
      stdin: { contents: 'export const __n = ' + hn + ';\nexport * from "./store/persistence";\nexport * from "./store/signedOutHere";', resolveDir: SRC, loader: 'ts' },
      bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent',
    });
    // Fresh fake environment installed AFTER the build, immediately before the import (no await between).
    const m = new Map();
    globalThis.window = { addEventListener() {}, removeEventListener() {} };
    globalThis.localStorage = { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: (k) => { m.delete(k); }, clear: () => m.clear() };
    Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'Mozilla/5.0 Chrome/128' }, configurable: true, writable: true });
    return import('data:text/javascript;base64,' + Buffer.from(res.outputFiles[0].text).toString('base64'));
  };

  // The device signed out: flag set, data wiped. Then a guest's link is opened.
  const lockedDevice = await loadStore();
  lockedDevice.markSignedOutHere();
  lockedDevice.resetLocalData();
  lockedDevice.saveDraft('guest-first-words', 'the guest starts writing');
  ok('(H1) THE HAZARD, reproduced: on a signed-out device with the flag still set, a guest\'s write is DROPPED (no row, nothing dirty) — they would lose everything silently',
    lockedDevice.getDraft('guest-first-words') === null && lockedDevice.countDirtyRecords() === 0, String(lockedDevice.countDirtyRecords()));
  lockedDevice.resetLocalData();

  const lifted = await loadStore();
  lifted.markSignedOutHere();
  lifted.resetLocalData();
  lifted.clearSignedOutHere();                 // what the guest session start now does, before anything writes
  lifted.saveDraft('guest-first-words', 'the guest starts writing');
  ok('(H2) with the flag cleared at the guest session start, the same write LANDS and is dirty (it will sync)',
    lifted.getDraft('guest-first-words')?.text === 'the guest starts writing' && lifted.countDirtyRecords() === 1, String(lifted.countDirtyRecords()));
  lifted.resetLocalData();

  // The wiring, in source.
  const successBranch = arrival.slice(arrival.indexOf('if (r.ok && r.user) {'), arrival.indexOf('return;', arrival.indexOf('if (r.ok && r.user) {')));
  ok('(H3) GuestArrival imports clearSignedOutHere', /import \{ clearSignedOutHere \} from '\.\.\/store\/signedOutHere';/.test(arrival), '');
  ok('(H4) the guest session start clears the flag FIRST in its success branch — before onAuthed (which starts the sync) and before it navigates',
    /clearSignedOutHere\(\);/.test(successBranch) && successBranch.indexOf('clearSignedOutHere()') < successBranch.indexOf('onAuthed(r.user)'), successBranch.slice(0, 300));
  const authedFn = app.slice(app.indexOf('const handleAuthed'), app.indexOf('const handleLogout'));
  ok('(H5) and handleAuthed, which onAuthed reaches, clears it too (two layers, so neither alone is load-bearing)',
    /clearSignedOutHere\(\);/.test(authedFn), '');
  ok('(H6) the route guard lets /guest through on a locked device, so the link can be opened at all',
    /pathname === '\/guest'/.test(app.slice(app.indexOf('function SignedOutRouteGuard'), app.indexOf('function BrandMark'))), '');

  // MUTATION: take the clear out of GuestArrival. H4's predicate must go red.
  const mutatedArrival = arrival.replace('        clearSignedOutHere();\n', '').replace('        clearSignedOutHere();\r\n', '');
  const mBranch = mutatedArrival.slice(mutatedArrival.indexOf('if (r.ok && r.user) {'), mutatedArrival.indexOf('return;', mutatedArrival.indexOf('if (r.ok && r.user) {')));
  ok('(H7) MUTATION KILLED: without the clear in GuestArrival, H4\'s predicate goes red',
    mutatedArrival !== arrival && !/clearSignedOutHere\(\);/.test(mBranch), '');
}

// =============================================================================
// PART I — the capture's guest screens (Batch 11), pinned in source. The capture itself needs a box turn.
// =============================================================================
{
  const cap = fs.readFileSync(path.join(DESKTOP, 'scripts', 'harness', 'arrival-signin-capture.mjs'), 'utf8');
  ok('(I1) the capture takes BOTH guest screens: the claim sheet over a page, and a dead link\'s arrival',
    /save\(app, vp\.name, theme\.name, 'guest-claim'\)/.test(cap) && /save\(app, vp\.name, theme\.name, 'guest-expired'\)/.test(cap), '');
  ok('(I2) the guest 401 is stubbed in the page for exactly the two calls that matter, with the server\'s own reason',
    /s\.includes\('\/api\/sync'\) \|\| s\.includes\('\/auth\/guest'\)/.test(cap) && /reason: 'guest_expired'/.test(cap) && /status: 401/.test(cap), '');
  ok('(I3) the guest phase boots AUTHED (a sync only runs then), provokes one sync, and puts WS_ANON back before the signed-out screens',
    /process\.env\.WS_ANON = '0';/.test(cap) && /new Event\('online'\)/.test(cap)
      && cap.indexOf("process.env.WS_ANON = '1';") > cap.indexOf("'guest-expired'") && cap.indexOf("process.env.WS_ANON = '1';") < cap.indexOf("'signedout'"), '');
  ok('(I4) each guest reload re-applies the theme (a reload clears it), so the light shots are really light',
    (cap.match(/await app\.evalJs\(theme\.setup\);/g) || []).length >= 3, String((cap.match(/await app\.evalJs\(theme\.setup\);/g) || []).length));
  ok('(I5) each guest screen waits for its own settled state (the sheet line with focus inside it; the expired line on the arrival) before it is shot',
    /screen === 'guest-claim'/.test(cap) && /screen === 'guest-expired'/.test(cap) && /focus inside the sheet/.test(cap), '');
  ok('(I6) the guest screens go through the same email check as every other frame (empty inputs, no "@" in visible text)',
    cap.indexOf('const state = await settle(app, screen);') > 0 && cap.indexOf('capture refused:') > cap.indexOf('const state = await settle(app, screen);'), '');
}

// =============================================================================
// PART J — two defects the first live run found, pinned in source. The behaviour itself is proved by the live walk
// (its first two steps ARE the failing scenario) and by the capture (its settle waits for focus inside the sheet).
// =============================================================================
{
  const norm = (t) => t.replace(/\r\n?/g, '\n');
  const arrivalSrc = norm(arrival);
  const sheetSrc = norm(sheet);

  const keyed = (src) => /const \{ key \} = useLocation\(\);/.test(src)
    && /if \(handledKey\.current === key\) return;\s*handledKey\.current = key;/.test(src)
    && /\}, \[key\]\);/.test(src);
  ok('(J1) THE SECOND LINK: GuestArrival handles each new router location, keyed on location.key — not once per mount',
    keyed(arrivalSrc) && !/const started = useRef/.test(arrivalSrc) && !/\}, \[\]\);/.test(arrivalSrc.slice(arrivalSrc.indexOf('useEffect('), arrivalSrc.indexOf('return (', arrivalSrc.indexOf('useEffect(')))), '');
  ok('(J2) each new attempt resets the message first, so a stale "not valid" does not outlive a good link',
    /handledKey\.current = key;\s*setMessage\('Opening your guest account…'\);/.test(arrivalSrc), '');
  ok('(J3) the token is still stripped from the address bar before any network call, per attempt',
    arrivalSrc.indexOf('window.history.replaceState') > 0 && arrivalSrc.indexOf('window.history.replaceState') < arrivalSrc.indexOf('apiGuest(token)'), '');

  const focusGuard = (src) => /const onFocusIn = \(e: FocusEvent\) => \{[\s\S]*?!panel\.contains\(e\.target\)\) emailRef\.current\?\.focus\(\);/.test(src)
    && /document\.addEventListener\('focusin', onFocusIn, true\);/.test(src);
  ok('(J4) THE STOLEN FOCUS: while the sheet is open, focus that lands outside the panel is brought back to its first field (capture phase)',
    focusGuard(sheetSrc), '');
  const cleanup = sheetSrc.slice(sheetSrc.indexOf("document.removeEventListener('keydown', onKey, true);"));
  ok('(J5) the focus guard is removed in the cleanup BEFORE focus is returned to where it was (or it would fight the restore)',
    cleanup.indexOf("removeEventListener('focusin', onFocusIn, true)") > 0 && cleanup.indexOf("removeEventListener('focusin', onFocusIn, true)") < cleanup.indexOf('back.focus()'), '');

  // MUTATIONS — each protection removed; its predicate must go red.
  const m1 = arrivalSrc.replace('}, [key]);', '}, []);');
  ok('(J6) MUTATION KILLED: with the effect back to once-per-mount ([] deps), J1\'s predicate goes red', m1 !== arrivalSrc && !keyed(m1), '');
  const m2 = sheetSrc.replace("    document.addEventListener('focusin', onFocusIn, true);\n", '');
  ok('(J7) MUTATION KILLED: with the focusin listener not attached, J4\'s predicate goes red', m2 !== sheetSrc && !focusGuard(m2), '');
}

fs.rmSync(tmp, { recursive: true, force: true });

// eslint-disable-next-line no-console
realLog(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
realLog(pass
  ? `\nGUEST-CLIENT VERIFY: PASS (${checks.length} checks) — browser walk not run (box turn)`
  : `\nGUEST-CLIENT VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
