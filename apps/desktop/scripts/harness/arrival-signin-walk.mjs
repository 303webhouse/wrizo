// SIGN-IN + LOGOUT SAFETY — the live walk. Authored, NOT run: it needs a box turn.
// Runs on runtime-verify's test double WITHOUT WS_ANON (the app boots signed in).
//
// 1. Unsaved writing blocks a sign-out: sync is made to fail (so the page stays dirty),
//    Sign out shows the sheet, the session and the page survive, nothing is wiped.
// 2. Esc is "Stay signed in"; focus returns to where it was.
// 3. "Sign out anyway" is two steps; the confirm completes it: the flag is set and the
//    app lands on the sign-in screen.
// 4. A successful sign-in LEAVES the sign-in screen (the resume target, or Write) and
//    clears the flag.
//
// Run: WS_BOX_TURN=<token> node scripts/harness/arrival-signin-walk.mjs   (from apps/desktop)
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
// Printed as each check runs, so a failure part-way through still shows everything that came before it.
const ok = (name, pass, detail = '') => {
  checks.push({ name, pass, detail });
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (pass ? '' : ' | ' + String(detail).slice(0, 200))); // eslint-disable-line no-console
};

await withHarness(async (app) => {
  await app.freshSprint();

  // Make every sync fail, then write a page: it is dirty and cannot reach the account.
  await app.evalJs(`
    const realFetch = window.fetch.bind(window);
    window.fetch = (u, o) => (String(u).includes('/api/sync') ? Promise.reject(new Error('offline (walk)')) : realFetch(u, o));
    window.__pageId = window.wrizoCreateJournalPage({ text: 'unsaved words' }).id;
    true;
  `);
  await app.evalJs(`window.wrizoFlushNow(); true;`);
  const dirtyHas = (id) => app.evalJs(`Object.values(window.wrizoDirty.ids()).some((ids) => ids.includes(${JSON.stringify(id)}))`);
  const pageId = await app.evalJs('window.__pageId');
  ok('(W0) the walk has an unsaved record to protect (its page id is in the dirty set)', (await dirtyHas(pageId)) === true, String(pageId));

  // 0b. THE TIME LIMIT: make the push STALL (never answer), press Sign out, and watch: the button says
  //     "Signing out…" at once, and the sheet appears within ~8 s. No silent logout.
  await app.evalJs(`
    const f1 = window.fetch.bind(window);
    window.__stall = true;
    window.fetch = (u, o) => (window.__stall && String(u).includes('/api/sync') ? new Promise(() => {}) : f1(u, o));
    true;
  `);
  const t0 = Date.now();
  await app.click('Sign out');
  await sleep(300);
  const btnText = await app.evalJs(`[...document.querySelectorAll('button')].map((b) => b.textContent).filter((x) => /Sign/.test(x)).join('|')`);
  ok('(W0b) the button says "Signing out…" at once (never does nothing)', /Signing out/.test(btnText), btnText);
  await app.waitFor(`!!document.querySelector('.wz-logout-sheet')`, { timeout: 12000, label: 'sheet after a stalled push' });
  const stalledTook = Date.now() - t0;
  ok('(W0c) a stalled push ends at the sheet within ~8 s, with no silent logout',
    stalledTook >= 7500 && stalledTook <= 10500 && (await app.evalJs(`fetch('/auth/me', { credentials: 'include' }).then((r) => r.ok)`)) === true, String(stalledTook));
  await app.key('Escape');
  await app.waitFor(`!document.querySelector('.wz-logout-sheet')`, { label: 'stalled sheet dismissed' });
  await app.evalJs('window.__stall = false; true;');

  // 1. Sign out is refused, with the sheet.
  await app.click('Sign out');
  await app.waitFor(`!!document.querySelector('.wz-logout-sheet')`, { label: 'blocked sheet shown' });
  const body = await app.evalJs(`document.querySelector('.wz-logout-sheet-body')?.textContent || ''`);
  ok('(W1) the sheet says changes have not saved, in the approved words',
    /haven.t saved to your account yet|hasn.t saved to your account yet/.test(body), body);
  const me = await app.evalJs(`fetch('/auth/me', { credentials: 'include' }).then((r) => r.ok)`);
  ok('(W2) the session is still signed in', me === true, '');
  const flagAfterRefusal = await app.evalJs(`localStorage.getItem('wz.signedOutHere')`);
  ok('(W3) nothing was wiped (the unsaved page is still dirty) and the signed-out flag is NOT set by a refused sign-out',
    (await dirtyHas(pageId)) === true && flagAfterRefusal === null, JSON.stringify({ flagAfterRefusal }));

  // Focus starts on "Stay signed in".
  const focusOnStay = await app.evalJs(`document.activeElement?.textContent === 'Stay signed in'`);
  ok('(W4) focus starts on "Stay signed in"', focusOnStay === true, '');

  // 2. Esc stays; the page is still mounted.
  await app.key('Escape');
  await app.waitFor(`!document.querySelector('.wz-logout-sheet')`, { label: 'Esc closed the sheet' });
  const stillIn = await app.evalJs(`fetch('/auth/me', { credentials: 'include' }).then((r) => r.ok)`);
  ok('(W5) Esc means stay: the sheet closes and the writer is still signed in', stillIn === true, '');

  // 3. Sign out anyway: two steps.
  await app.click('Sign out');
  await app.waitFor(`!!document.querySelector('.wz-logout-sheet')`, { label: 'sheet again' });
  await app.click('Sign out anyway');
  const confirmShown = await app.evalJs(`!!document.querySelector('.wz-logout-confirm')`);
  const flagBeforeConfirm = await app.evalJs(`localStorage.getItem('wz.signedOutHere')`);
  ok('(W6) the first click only asks: a confirm appears and nothing is signed out yet',
    confirmShown === true && flagBeforeConfirm === null, JSON.stringify({ confirmShown, flagBeforeConfirm }));
  // THE SECOND CAP: the server's logout HANGS. The sign-out must still finish here within ~5 s.
  await app.evalJs(`
    window.__logoutCalls = 0;
    window.__hangLogout = true;
    const f2 = window.fetch.bind(window);
    window.fetch = (u, o) => {
      if (String(u).includes('/auth/logout')) { window.__logoutCalls += 1; if (window.__hangLogout) return new Promise(() => {}); }
      return f2(u, o);
    };
    true;
  `);
  const t1 = Date.now();
  await app.click('Yes, sign out and lose');
  await app.waitFor(`!!document.querySelector('.wz-arrival input.wz-field')`, { timeout: 9000, label: 'landed on sign-in' });
  const hungTook = Date.now() - t1;
  const flag = await app.evalJs(`localStorage.getItem('wz.signedOutHere')`);
  ok('(W7) the confirm completes the sign-out even though the server logout hung: the flag is set and the sign-in screen is up',
    flag === '1', String(flag));
  ok('(W7b) and it took ~5 s, not forever ("Signing out…" does not stay up)', hungTook >= 4500 && hungTook <= 8000, String(hungTook));

  // The next load: the device is signed out, the double still has a session, so the boot cleanup retries the logout.
  await app.evalJs('window.__hangLogout = false; true;');
  const callsBefore = await app.evalJs('window.__logoutCalls');
  await app.reload();
  await app.waitFor(`!!document.querySelector('.wz-arrival input.wz-field')`, { timeout: 9000, label: 'sign-in after reload' });
  ok('(W7c) after a reload the sign-in screen is shown (the signed-out device does not resume its session)',
    (await app.evalJs(`localStorage.getItem('wz.signedOutHere')`)) === '1', '');
  void callsBefore; // the reload replaces the page, so its own call counter restarts; the retry is proved browserless (I7-I10)

  // 4. A successful sign-in leaves the sign-in screen and clears the flag.
  await app.evalJs(`document.querySelector('.wz-arrival input[type="email"]').focus(); true;`);
  await app.typeKeys('tester@example.com');
  await app.key('Tab');
  await app.typeKeys('a-long-enough-password');
  // Count the sign-in requests, then press Enter ONCE in the password field: it must submit, and submit once.
  await app.evalJs(`
    window.__loginCalls = 0;
    const f0 = window.fetch.bind(window);
    window.fetch = (u, o) => { if (String(u).includes('/auth/login')) window.__loginCalls += 1; return f0(u, o); };
    true;
  `);
  // A real Enter: keyDown WITH text '\r', which is what makes the browser perform implicit form submission.
  // app.key('Enter') sends only rawKeyDown/keyUp (no character), which does not submit a form.
  await app.typeKeys('\n');
  await app.waitFor(`location.hash !== '#/' && location.hash !== ''`, { label: 'left the sign-in screen' });
  const loginCalls = await app.evalJs('window.__loginCalls');
  ok('(W8a) Enter in the password field signs in, with exactly one request', loginCalls === 1, String(loginCalls));
  const afterHash = await app.evalJs('location.hash');
  ok('(W8) a successful sign-in leaves the sign-in screen (it goes to a page or project)',
    /^#\/(page|project)\//.test(afterHash), afterHash);
  const flagAfter = await app.evalJs(`localStorage.getItem('wz.signedOutHere')`);
  ok('(W9) and the signed-out flag is cleared', flagAfter === null, String(flagAfter));
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nARRIVAL-SIGNIN-WALK VERIFY: PASS (${checks.length} checks)`
  : `\nARRIVAL-SIGNIN-WALK VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
