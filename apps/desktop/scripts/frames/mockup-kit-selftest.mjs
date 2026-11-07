// MOCKUP KIT SELF-TEST - the verdict guard on the real frames job (Fable, Nov 2: "add a self-test (a planted throw must go red)"). Run:
//   gh workflow run frames.yml --ref ci/actions-harness -f ref=<SHA> -f themes=plateau -f widths=1366
//     -f screens_file=apps/desktop/scripts/frames/mockup-kit-selftest.mjs -f screens=kit-selftest-ok,kit-selftest-throw,kit-selftest-silent,kit-selftest-page-error,kit-selftest-swallowed,kit-selftest-pic-quiet
// The RUN is meant to come out failed. Read frames.json: kit-selftest-ok and kit-selftest-pic-quiet are ok; every other screen is failed with
// its own reason (the planted throw; NO VERDICT; UNCAUGHT PAGE ERROR naming the planted page throw; SWALLOWED FAIL). Any other spread is a
// broken guard. Nothing here writes storage.
import { guarded } from './mockup-kit.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const say = (name, data) => console.log(`KIT-SELFTEST ${name} ${JSON.stringify(data)}`);

export default guarded({
  // a check that prints its verdict: the one green check
  'kit-selftest-ok': async (app) => { const t = await app.evalJs('document.title'); say('kit-selftest-ok', { title: typeof t }); },
  // THE PLANTED THROW: a check that crashes before its verdict
  'kit-selftest-throw': async (app) => { await app.evalJs('1'); throw new Error('KIT-SELFTEST planted throw'); },
  // a check that returns without a verdict
  'kit-selftest-silent': async (app) => { await app.evalJs('1'); },
  // the page throws on its own while the check runs; the check still prints a verdict
  'kit-selftest-page-error': async (app) => {
    await app.evalJs("setTimeout(() => { throw new Error('KIT-SELFTEST planted page throw'); }, 0); true"); await sleep(400);
    say('kit-selftest-page-error', { planted: true });
  },
  // a check that prints a FAIL line and still returns
  'kit-selftest-swallowed': async (app) => { console.log('KIT-SELFTEST-FAIL kit-selftest-swallowed {"planted":true}'); say('kit-selftest-swallowed', { after: true }); },
  // a picture owes no verdict
  'kit-selftest-pic-quiet': async (app) => { await app.evalJs('1'); await sleep(100); },
}, { verdict: ['KIT-SELFTEST'] });
