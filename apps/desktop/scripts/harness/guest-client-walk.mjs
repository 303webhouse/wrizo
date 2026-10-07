// GUEST LOGIN (item 225) — the client pass, in a REAL browser. Needs a box turn from chat 1.
//
// It needs a LIVE server, not runtime-verify's static test double: the guest calls must hit the real /auth/guest,
// /api/sync and /auth/claim. The Express server serves the built app itself (apps/desktop/dist-web) on one origin,
// so there is no `pnpm dev` and no Vite: build the web bundle, build and start the server against a LOCAL Postgres,
// and aim the harness at it with WS_TARGET_URL (withHarness's own opt-in for an already-serving origin).
//
// A LOCAL database only, never a real one. The walk refuses a WS_TARGET_URL that is not 127.0.0.1 or localhost.
//
// The server creates its schema on boot (migrate.ts: the four users columns and guest_links), so there is no
// migration file to apply. Fixtures, minted with the real mint script (apps/server/scripts/mint-guest-link.mjs):
//   GUEST_TOKEN          a live guest, inside its 30 days
//   GUEST_EXPIRED_TOKEN  a second guest, then on that database:
//                        update users set guest_expires_at = now() - interval '2 days'
//                        where id = (select user_id from guest_links where token_hash = <its sha256 hex>);
//                        (inside the 14-day grace, so the claim is still allowed)
// The expired fixture is CONSUMED by the claim step (the guest becomes a full account); mint a fresh pair to rerun.
//
// Run: WS_TARGET_URL=http://127.0.0.1:3107 GUEST_TOKEN=... GUEST_EXPIRED_TOKEN=... WS_BOX_TURN=<token> \
//        node scripts/harness/guest-client-walk.mjs   (from apps/desktop)
import { withHarness } from '../runtime-verify.mjs';

// Refuse early, and plainly, rather than fail mysteriously against the static double or aim at something real.
{
  const target = process.env.WS_TARGET_URL || '';
  let host = '';
  try { host = new URL(target).hostname; } catch { /* handled below */ }
  if (!target || (host !== '127.0.0.1' && host !== 'localhost')) {
    // eslint-disable-next-line no-console
    console.error('guest-client-walk needs WS_TARGET_URL set to a LOCAL server (http://127.0.0.1:<port>); got: ' + (target || '(unset)') + '. See this file\'s header.');
    process.exit(2);
  }
}

const VALID = process.env.GUEST_TOKEN;
const EXPIRED = process.env.GUEST_EXPIRED_TOKEN;
if (!VALID || !EXPIRED) {
  // eslint-disable-next-line no-console
  console.error('guest-client-walk needs GUEST_TOKEN and GUEST_EXPIRED_TOKEN, minted on the box (see this file\'s header).');
  process.exit(2);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
// Printed as each check runs, so a failure part-way through still shows everything that came before it.
const ok = (name, pass, detail = '') => {
  checks.push({ name, pass, detail });
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (pass ? '' : ' | ' + String(detail).slice(0, 200))); // eslint-disable-line no-console
};
const CLAIM_EMAIL = `walk-${Date.now()}@example.com`;

await withHarness(async (app) => {
  // Spy on /auth/guest: record the address bar at the moment of the request, and the body.
  await app.evalJs(`
    window.__guestCalls = [];
    const realFetch = window.fetch.bind(window);
    window.fetch = (u, o) => {
      if (String(u).includes('/auth/guest')) {
        window.__guestCalls.push({ hrefAtCall: location.href, body: String(o && o.body) });
      }
      return realFetch(u, o);
    };
    true;
  `);

  // 1. A refused token shows the server's own sentence, nothing invented.
  await app.evalJs(`location.hash = '#/guest?t=not-a-real-token'; true;`);
  await app.waitFor(`document.querySelector('[role="status"]')?.textContent === 'This guest link is not valid.'`, { label: 'refused sentence shown' });
  ok('(W1) a refused token shows the server\'s sentence, and nothing else', true, '');

  // 2. A valid token: the token is OUT of the address bar before the request is sent.
  // The device is made to look SIGNED OUT first (the flag a sign-out leaves behind), because the write-belt drops
  // every record write while that flag is set: a guest entering here must lift it, or lose everything silently.
  await app.evalJs(`localStorage.setItem('wz.signedOutHere', '1'); true;`);
  await app.evalJs(`location.hash = '#/guest?t=${VALID}'; true;`);
  await app.waitFor(`location.hash === '#/'`, { label: 'landed on the Arrival door' });
  const calls = await app.evalJs('window.__guestCalls');
  const valid = calls.find((c) => c.body.includes(VALID));
  ok('(W2) the request carried the token in its body',
    !!valid, JSON.stringify(calls.map((c) => c.body.slice(0, 20))));
  ok('(W3) the token was gone from the address bar BEFORE the request was sent',
    !!valid && !valid.hrefAtCall.includes(VALID) && !valid.hrefAtCall.includes('t='), valid?.hrefAtCall ?? '');
  const finalHref = await app.evalJs('location.href');
  ok('(W4) and it is still gone after the arrival (nothing re-adds it)', !finalHref.includes(VALID), finalHref);
  ok('(W4b) the guest session start LIFTED the signed-out flag', (await app.evalJs(`localStorage.getItem('wz.signedOutHere')`)) === null, '');
  // Create and read in ONE expression, so a sync cannot clear the dirty mark between the two: under the belt this is false.
  const landed = await app.evalJs(`(() => {
    window.wrizoCreateJournalPage({ id: 'guest-walk-page', text: 'guest words' });
    return window.wrizoDirty.records().journalEntries.some((e) => e.id === 'guest-walk-page');
  })()`);
  ok('(W4c) a guest\'s first write LANDS as a dirty record (it would be silently dropped if the flag were still set)', landed === true, String(landed));

  // 3. Sign out THROUGH THE APP, then arrive with the EXPIRED guest's link: the sync refuses, the sheet appears.
  // Not a raw /auth/logout: that would leave the app's sync loop running, and the next guest's startSync() would return at
  // once (it is already running) until the next 20 s tick — the 401 would come too late for the wait. A real tester signs
  // out with the button, which stops the loop (and the unsaved check syncs the page the walk just wrote first).
  await app.click('Sign out');
  await app.waitFor(`!!document.querySelector('.wz-arrival input.wz-field')`, { timeout: 15000, label: 'signed out, on the sign-in screen' });
  await app.evalJs(`location.hash = '#/guest?t=${EXPIRED}'; true;`);
  await app.waitFor(`!!document.querySelector('.wz-guest-sheet')`, { label: 'expired sheet shown' });
  const line = await app.evalJs(`document.querySelector('.wz-guest-sheet-line')?.textContent || ''`);
  ok('(W5) the expired sheet shows the one plain line, exactly', line === 'Your guest time is over — create an account to keep your work here', line);

  // 4. Focus moves INTO the sheet on open (the email field).
  const focusedIn = await app.evalJs(`!!document.activeElement && !!document.activeElement.closest('.wz-guest-sheet')`);
  ok('(W6) focus moves into the sheet when it opens', focusedIn === true, '');

  // 5. Tab stays inside the sheet, wrapping in both directions.
  let stayed = true;
  for (let i = 0; i < 6; i += 1) {
    await app.key('Tab');
    stayed = stayed && (await app.evalJs(`!!document.activeElement && !!document.activeElement.closest('.wz-guest-sheet')`));
  }
  ok('(W7) six Tab presses never leave the sheet', stayed === true, '');
  await app.key('Tab', { shift: true }); // the helper takes the key and a shift option, not a "Shift+Tab" name
  const backInside = await app.evalJs(`!!document.activeElement && !!document.activeElement.closest('.wz-guest-sheet')`);
  ok('(W8) Shift+Tab wraps inside the sheet too', backInside === true, '');

  // 6. Esc is "Not now": the sheet closes, focus leaves the sheet, the page stays mounted.
  await app.evalJs(`window.__pageRoot = document.getElementById('root').firstElementChild; true;`);
  await app.key('Escape');
  await app.waitFor(`!document.querySelector('.wz-guest-sheet')`, { label: 'Esc closed the sheet' });
  const focusLeft = await app.evalJs(`!!document.activeElement && !document.activeElement.closest('.wz-guest-sheet')`);
  ok('(W9) Esc closes the sheet and focus is back on the page, not lost', focusLeft === true, '');
  const pageMounted = await app.evalJs(`!!window.__pageRoot && window.__pageRoot.isConnected`);
  ok('(W10) "Not now" leaves the page mounted (the same root node, still connected)', pageMounted === true, '');

  // 7. Writable behind the sheet's dismissal: the editor's own keys still reach the page.
  //    Checked by the page's root staying interactive (no overlay left blocking pointer events).
  const pointerFree = await app.evalJs(`getComputedStyle(document.body).pointerEvents !== 'none' && !document.querySelector('.wz-guest-sheet')`);
  ok('(W11) after "Not now" nothing blocks the page', pointerFree === true, '');

  // 8. Claim: reload so the expired session re-opens the sheet, then claim in place.
  await app.reload();
  await app.waitFor(`!!document.querySelector('.wz-guest-sheet')`, { label: 'sheet back after reload' });
  await app.evalJs(`document.querySelector('.wz-guest-sheet input[type="email"]').focus(); true;`);
  await app.typeKeys(CLAIM_EMAIL);
  await app.key('Tab');
  await app.typeKeys('a-long-enough-password');
  await app.click('Create my account');
  await app.waitFor(`!document.querySelector('.wz-guest-sheet')`, { label: 'claim closed the sheet' });
  const me = await app.evalJs(`fetch('/auth/me', { credentials: 'include' }).then((r) => r.json())`);
  ok('(W12) a claim succeeds: the sheet closes and the session is now the claimed account',
    me?.email === CLAIM_EMAIL, JSON.stringify({ email: me?.email }));
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nGUEST-CLIENT-WALK VERIFY: PASS (${checks.length} checks)`
  : `\nGUEST-CLIENT-WALK VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
