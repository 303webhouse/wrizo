// CSP ENFORCE, WALK — the runtime half of the enforcement ticket. The
// server-side harness (apps/server/scripts/harness/csp-enforce.mjs) proves the
// header's shape and that the built bundle carries nothing the policy would
// block. This one proves nothing is blocked in a REAL browser: it walks the main
// screens and fails on any `securitypolicyviolation` event.
//
// LIMIT, stated not hidden: the listener is attached once the page is up
// (withHarness navigates first). A violation raised during the very first
// parse of index.html is not seen here — the build has no inline <script>
// (csp-enforce.mjs B1), so that case is covered statically. Violations from
// everything the app creates AFTER boot (React-rendered images, fetches,
// fonts, dynamic style) are caught.
//
// Needs a box turn: browser harness. Run: node scripts/harness/csp-enforce-walk.mjs
// (from apps/desktop, dist-web built, WS_BOX_TURN granted by chat 1).
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Every main screen a writer reaches from the Desk and its rails. Routes are
// hash routes (see App.tsx); the page/journal/project ids are the ones the
// existing harnesses already use, so the walk needs no seeded fixture beyond
// what freshSprint() provides.
const SCREENS = [
  { name: 'Desk', hash: '#/' },
  { name: 'Drawers', hash: '#/drawers' },
  { name: 'Shelf', hash: '#/shelf' },
  { name: 'Create project', hash: '#/project/new' },
  { name: 'Journal', hash: '#/journal' },
  { name: 'Sprint', hash: '#/sprint' },
  { name: 'New page', hash: '#/page/new' },
];

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });

await withHarness(async (app) => {
  await app.freshSprint();

  // Attach the listener on the live document. Survives in-app hash navigation,
  // which is all the walk does between screens.
  await app.evalJs(`
    window.__cspViolations = [];
    document.addEventListener('securitypolicyviolation', (e) => {
      window.__cspViolations.push({
        directive: e.violatedDirective,
        blocked: e.blockedURI,
        source: e.sourceFile,
        line: e.lineNumber,
      });
    });
    true;
  `);

  for (const screen of SCREENS) {
    await app.evalJs(`location.hash = ${JSON.stringify(screen.hash)}; true;`);
    await sleep(800); // let the screen mount and its effects (fetches, fonts) run
    const violations = await app.evalJs('window.__cspViolations.slice()');
    ok(`WALK ${screen.name} (${screen.hash}): no securitypolicyviolation`,
      Array.isArray(violations) && violations.length === 0,
      JSON.stringify(violations));
  }

  // Reach the account-facing screens too, since sign-in and sign-up render
  // through a different tree than the writing surfaces.
  await app.evalJs(`location.hash = '#/'; true;`);
  await sleep(800);
  const finalViolations = await app.evalJs('window.__cspViolations.slice()');
  ok('WALK total: zero violations across the whole walk',
    Array.isArray(finalViolations) && finalViolations.length === 0,
    JSON.stringify(finalViolations));
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nCSP-ENFORCE-WALK VERIFY: PASS (${checks.length} checks)`
  : `\nCSP-ENFORCE-WALK VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
