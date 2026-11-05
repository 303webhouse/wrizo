// PAGE HELPERS SURVIVE A NEW DOCUMENT (bug-list #45, FIX, Nov 5). b2-1 crashed intermittently on the parked leg - `ReferenceError: __click is not defined` at its first `app.click` (Actions Nov 1; the step-10 train) - and ran clean
// solo 4 of 4. THE CAUSE: runtime-verify's page helpers (`__click`, `__setText`, `__diag`) were injected ONCE, by an evaluate that the launch swallows on failure (`app.injectHelpers().catch(() => {})`), right after Runtime.enable and
// WITHOUT waiting for the first document - so when the browser's initial navigation committed after that evaluate, the helpers went to the document that was then replaced. Every later full navigation (`Page.navigate` to a URL that
// is not a hash change of the current one) lost them the same way; only an explicit `app.reload()` / `injectHelpers()` put them back. b2-1's parked block is a SECOND withHarness whose first act is goto + click, with no reload between.
// The fix is in the driver: the helpers are also registered with Page.addScriptToEvaluateOnNewDocument, so every document the page ever gets has them (the explicit injections stay, and are idempotent).
//   H1  after a FULL navigation (a different URL, not a hash change) the helpers are on the new document        - deterministic; red on the driver as it was
//   H2  across N cold launches, the helpers are on the first document, with nothing injected after the launch  - the race: counts the launches that lost them; red when any did
// Run: node scripts/harness/helpers-survive.mjs   (from apps/desktop, dist-web built, box turn granted)
import { withHarness } from '../runtime-verify.mjs';

const LAUNCHES = Number(process.env.HS_LAUNCHES || 12);
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// H1 - one browser: a full navigation, then the helpers
await withHarness(async (app) => {
  await app.evalJs('localStorage.setItem("wrizo-first-run-complete", "1")');
  await app.evalJs("location.hash = '#/'");
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' }).catch(() => {});
  const before = await app.evalJs("typeof window.__click");
  const mark = await app.evalJs('(window.__doc1 = Math.random())');
  // a different URL (a query string the app ignores), so Chrome commits a NEW document rather than a same-document hash change
  await app.evalJs(`location.href = location.pathname + '?hs=1#/'`);
  let fresh = false;
  for (let i = 0; i < 80 && !fresh; i += 1) { await sleep(100); fresh = await app.evalJs('window.__doc1 === undefined').catch(() => false); }
  let after = null;
  for (let i = 0; i < 80; i += 1) { after = await app.evalJs("document.readyState === 'complete' ? typeof window.__click : 'loading'").catch(() => 'err'); if (after !== 'loading' && after !== 'err') break; await sleep(100); }
  ok('H1 (live) the navigation committed a NEW document (the marker set on the old one is gone)', fresh, JSON.stringify({ mark: !!mark }));
  ok('H1 the helpers (__click) are on the document a FULL navigation produced, with nothing injected after it', after === 'function', JSON.stringify({ beforeNavigation: before, afterNavigation: after }));
  const clicked = await app.evalJs("typeof window.__setText === 'function' && typeof window.__diag === 'function'").catch(() => false);
  ok('H1 and the other helpers (__setText, __diag) came with it', clicked === true, String(clicked));
});

// H2 - cold launches: the first document, nothing injected by this scenario
const lost = [];
for (let i = 0; i < LAUNCHES; i += 1) {
  await withHarness(async (app) => {
    let arrived = false;
    for (let k = 0; k < 150 && !arrived; k += 1) { arrived = await app.evalJs("!!document.querySelector('.wz-arrival, .wz-splash, #root > *')").catch(() => false); if (!arrived) await sleep(100); }
    const t = await app.evalJs('typeof window.__click').catch(() => 'err');
    if (t !== 'function') lost.push({ launch: i + 1, typeofClick: t, arrived });
  });
}
ok(`H2 across ${LAUNCHES} cold launches the first document has the helpers, with no injection by the scenario (launches that lost them: ${lost.length})`, lost.length === 0, JSON.stringify(lost));

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}  [${c.detail}]`);
console.log(failed.length ? `\nHELPERS-SURVIVE VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nHELPERS-SURVIVE VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
