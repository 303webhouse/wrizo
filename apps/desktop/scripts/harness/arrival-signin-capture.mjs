// SIGN-IN SCREEN — screenshots for Nick's review. Authored, NOT run: it needs a box
// turn. Run with WS_ANON=1 so the double answers "signed out" (the doors then show
// Write / Open / Sign in).
//
// Captures, for dark and light, at desktop and phone size:
//   doors, signin, account, and signedout (after a sign-out: the flag set, the
//   app reloaded, the writer lands on the sign-in screen), and the two guest
//   screens (Batch 11): guest-claim, the claim sheet open over a page after a
//   guest's time has run out, and guest-expired, a dead guest link's arrival.
//
// The test double has no guest routes, so the PAGE's own fetch is answered with the
// server's real guest_expired 401 for /api/sync and /auth/guest. The claim sheet only
// appears from a sync, and a sync only runs on an authed boot, so the guest phase
// flips process.env.WS_ANON off (the double reads it per request, in this process)
// and back on afterwards.
//
// Light: the app's own light page is `:root[data-theme='flux'][data-page='light']`.
// .wz-home sets its own warm-dark palette, so the Arrival screens may look the same
// in both; the PNGs are the evidence for that, and it is reported, not assumed.
//
// Output: the scratchpad folder below (outside the repo).
//
// Run: WS_ANON=1 WS_BOX_TURN=<token> node scripts/harness/arrival-signin-capture.mjs   (from apps/desktop)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

// The PNGs are evidence and are committed: docs/evidence/arrival-signin/ in the repo. The manifest beside them is a
// .log.txt (a *.log file is gitignored) recording, for every frame, the settled state and the email check.
const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, '..', '..', '..', '..', 'docs', 'evidence', 'arrival-signin');
fs.mkdirSync(OUT, { recursive: true });
const manifest = [];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const VIEWPORTS = [
  { name: 'desktop', dpr: 1, width: 1280, height: 800 },
  { name: 'phone', dpr: 2, width: 390, height: 844 },
];
const THEMES = [
  { name: 'dark', setup: `document.documentElement.removeAttribute('data-theme'); document.documentElement.removeAttribute('data-page'); true;` },
  { name: 'light', setup: `document.documentElement.setAttribute('data-theme','flux'); document.documentElement.setAttribute('data-page','light'); true;` },
];

// What the real server answers an expired guest, for the two calls that matter. Installed per page: a reload clears it.
const GUEST_STUB = `(() => {
  const real = window.fetch.bind(window);
  window.fetch = (u, o) => {
    const s = String(u);
    if (s.includes('/api/sync') || s.includes('/auth/guest')) {
      return Promise.resolve(new Response(JSON.stringify({ error: 'This guest account has expired.', reason: 'guest_expired' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }));
    }
    return real(u, o);
  };
  return true;
})()`;

const shots = [];
// The hero fades out over .8 s and the form fades in over 1 s. A shot taken inside that window shows a ghost of the
// logo behind the form — a mid-transition frame, not the settled screen. Wait for the SETTLED state, and record
// the hero's computed opacity as evidence that it is gone.
async function settle(app, screen) {
  if (screen === 'guest-claim') {
    await app.waitFor(`document.querySelector('.wz-guest-sheet-line')?.textContent === 'Your guest time is over — create an account to keep your work here'`, { timeout: 8000, label: 'claim sheet with its line' });
    await app.waitFor(`document.activeElement?.closest?.('.wz-guest-sheet') !== null`, { timeout: 8000, label: 'focus inside the sheet' });
    return 'sheet open, its line shown, focus inside it';
  }
  if (screen === 'guest-expired') {
    await app.waitFor(`document.querySelector('[role="status"]')?.textContent === 'Your guest time is over — create an account to keep your work here'`, { timeout: 8000, label: 'expired line on the arrival' });
    return 'expired line shown on the arrival';
  }
  if (screen === 'doors') {
    await app.waitFor(`getComputedStyle(document.querySelector('.wz-hero')).opacity === '1'`, { label: 'hero settled (doors)' });
    return 'hero opacity 1';
  }
  await app.waitFor(`getComputedStyle(document.querySelector('.wz-hero')).opacity === '0'`, { timeout: 8000, label: 'hero hidden (' + screen + ')' });
  await app.waitFor(`getComputedStyle(document.querySelector('.wz-screen')).opacity === '1'`, { timeout: 8000, label: 'form shown (' + screen + ')' });
  return 'hero opacity 0, form opacity 1';
}
async function save(app, vp, theme, screen) {
  const state = await settle(app, screen);
  // No real email may show. These screens render nothing but placeholders: every input must be EMPTY, and the visible
  // text (which excludes placeholder text) must contain no "@". A failure here stops the capture rather than commit it.
  const probe = await app.evalJs(`JSON.stringify({
    values: [...document.querySelectorAll('input')].map((i) => i.value),
    atInText: /@/.test(document.body.innerText),
  })`);
  const { values, atInText } = JSON.parse(probe);
  if (values.some((v) => v !== '') || atInText) {
    throw new Error('capture refused: ' + screen + '-' + theme + '-' + vp + ' shows a value or an "@" in its visible text: ' + probe);
  }
  const line = screen + '-' + theme + '-' + vp + ' — ' + state + ' — inputs empty (' + values.length + '), no "@" in visible text';
  console.log('  settled: ' + line); // eslint-disable-line no-console
  manifest.push(line);
  const b64 = await app.screenshot();
  const file = path.join(OUT, `${screen}-${theme}-${vp}.png`);
  fs.writeFileSync(file, Buffer.from(b64, 'base64'));
  shots.push(file);
}

await withHarness(async (app) => {
  // withHarness injects the in-page helpers (__click, __diag) ONCE, straight after connecting, and swallows a failure. If
  // the page is still loading at that moment they are lost, and the first app.click throws "__click is not defined" (seen
  // on the first box run of Batch 10; the same code passed on another tree, so it is a race, not the product). Wait for the
  // document, then inject them again — and again after each goto, which is cheap and idempotent.
  await app.waitFor(`document.readyState === 'complete'`, { label: 'document loaded' });
  await app.injectHelpers();
  for (const vp of VIEWPORTS) {
    for (const theme of THEMES) {
      await app.emulateDpr(vp.dpr, vp.width, vp.height);
      await app.goto('/');
      await app.injectHelpers();
      await app.evalJs(theme.setup);
      await sleep(600);

      // doors — the signed-out door with a visible Sign in
      await app.waitFor(`!!document.querySelector('.wz-arrival-doors')`, { label: 'doors' });
      await save(app, vp.name, theme.name, 'doors');

      // signin — through the visible Sign in
      await app.click('Sign in');
      await app.waitFor(`!!document.querySelector('.wz-arrival input.wz-field')`, { label: 'signin' });
      await sleep(400);
      await save(app, vp.name, theme.name, 'signin');

      // account — through "Create an account"
      await app.click('New here? Create an account');
      await app.waitFor(`!!document.querySelector('.wz-arrival .wz-sub')`, { label: 'account' });
      await sleep(400);
      await save(app, vp.name, theme.name, 'account');

      // guest-claim — the sheet over a page. An AUTHED boot (so sync runs), the guest 401 stubbed, one sync provoked.
      process.env.WS_ANON = '0';
      await app.reload();
      await app.waitFor(`!!document.querySelector('.wz-arrival')`, { label: 'authed arrival (guest phase)' });
      await app.evalJs(GUEST_STUB);
      await app.evalJs(theme.setup); // a reload clears the theme attributes the capture sets
      await app.goto('/sprint');
      await app.waitFor(`!!document.querySelector('.forward-only-editor, textarea')`, { label: 'a page behind the sheet' });
      await app.evalJs(`window.dispatchEvent(new Event('online')); true;`); // startSync listens for this: one sync, answered 401 guest_expired
      await app.waitFor(`!!document.querySelector('.wz-guest-sheet')`, { timeout: 8000, label: 'claim sheet' });
      await save(app, vp.name, theme.name, 'guest-claim');

      // guest-expired — a dead link's arrival. A fresh page (a reload clears the module state and the stub).
      await app.reload();
      await app.evalJs(GUEST_STUB);
      await app.evalJs(theme.setup);
      await app.goto('/guest?t=capture-demo-token');
      await save(app, vp.name, theme.name, 'guest-expired');
      process.env.WS_ANON = '1';
      await app.goto('/');

      // signedout — the flag a sign-out leaves behind; the app opens on sign-in
      await app.evalJs(`localStorage.setItem('wz.signedOutHere', '1'); true;`);
      await app.reload();
      await app.waitFor(`!!document.querySelector('.wz-arrival input.wz-field')`, { label: 'signed-out lands on sign-in' });
      await sleep(400);
      await save(app, vp.name, theme.name, 'signedout');
      await app.evalJs(`localStorage.removeItem('wz.signedOutHere'); true;`);
      // Arrival mounted on the sign-in stage because the flag was set; clearing the flag does not move it back.
      // Reload so the next pass starts on the doors, as a fresh visit would.
      await app.reload();
    }
  }
});

// eslint-disable-next-line no-console
fs.writeFileSync(path.join(OUT, 'manifest.log.txt'), manifest.join('\n') + '\n');
console.log(`ARRIVAL-SIGNIN CAPTURE: wrote ${shots.length} screenshots to ${OUT}`);
for (const f of shots) console.log(f); // eslint-disable-line no-console
