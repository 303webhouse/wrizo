// SIGN-IN SCREEN — screenshots for Nick's review. Authored, NOT run: it needs a box
// turn. Run with WS_ANON=1 so the double answers "signed out" (the doors then show
// Write / Open / Sign in).
//
// Captures, for dark and light, at desktop and phone size:
//   doors, signin, account, and signedout (after a sign-out: the flag set, the
//   app reloaded, the writer lands on the sign-in screen).
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
import { withHarness } from '../runtime-verify.mjs';

const OUT = 'C:\\Users\\nickh\\AppData\\Local\\Temp\\claude\\c--Users-nickh-writer-studio\\faebbc23-035c-489b-9830-52f558cef3b6\\scratchpad\\arrival-signin';
fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const VIEWPORTS = [
  { name: 'desktop', dpr: 1, width: 1280, height: 800 },
  { name: 'phone', dpr: 2, width: 390, height: 844 },
];
const THEMES = [
  { name: 'dark', setup: `document.documentElement.removeAttribute('data-theme'); document.documentElement.removeAttribute('data-page'); true;` },
  { name: 'light', setup: `document.documentElement.setAttribute('data-theme','flux'); document.documentElement.setAttribute('data-page','light'); true;` },
];

const shots = [];
async function save(app, vp, theme, screen) {
  const b64 = await app.screenshot();
  const file = path.join(OUT, `${screen}-${theme}-${vp}.png`);
  fs.writeFileSync(file, Buffer.from(b64, 'base64'));
  shots.push(file);
}

await withHarness(async (app) => {
  for (const vp of VIEWPORTS) {
    for (const theme of THEMES) {
      await app.emulateDpr(vp.dpr, vp.width, vp.height);
      await app.goto('/');
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

      // signedout — the flag a sign-out leaves behind; the app opens on sign-in
      await app.evalJs(`localStorage.setItem('wz.signedOutHere', '1'); true;`);
      await app.reload();
      await app.waitFor(`!!document.querySelector('.wz-arrival input.wz-field')`, { label: 'signed-out lands on sign-in' });
      await sleep(400);
      await save(app, vp.name, theme.name, 'signedout');
      await app.evalJs(`localStorage.removeItem('wz.signedOutHere'); true;`);
    }
  }
});

// eslint-disable-next-line no-console
console.log(`ARRIVAL-SIGNIN CAPTURE: wrote ${shots.length} screenshots to ${OUT}`);
for (const f of shots) console.log(f); // eslint-disable-line no-console
