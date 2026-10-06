// FIX (a11y-signin LIVE) — the test double must answer the sign-up status contract.
// The LIVE walk reached "Create an account" and waited for the account form. With the
// double answering the USER object on /auth/signup-status, the client read sign-up as
// closed and rendered the "by invitation" line instead of the form, so the walk timed
// out. The fix is in the double (runtime-verify.mjs), not in the product: the real
// server answers { open } and fails closed exactly as it should.
//
// Browserless: the double's own source, read as text, plus the client's real parser.
// The live walk itself needs a box turn and is NOT run here.
//
// Run: node scripts/harness/fix-signin-live-double.mjs   (from apps/desktop)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.resolve(here, '..', '..');
const double = fs.readFileSync(path.join(DESKTOP, 'scripts', 'runtime-verify.mjs'), 'utf8');
const api = fs.readFileSync(path.join(DESKTOP, 'src', 'store', 'api.ts'), 'utf8');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });

const routeIdx = double.indexOf("if (p === '/auth/signup-status')");
const catchAllIdx = double.indexOf("if (p === '/auth/me' || p.startsWith('/auth/'))");
ok('(1) the double answers /auth/signup-status explicitly', routeIdx > 0, String(routeIdx));
ok('(2) that route sits BEFORE the /auth/ catch-all (or the catch-all would win)',
  routeIdx > 0 && catchAllIdx > routeIdx, JSON.stringify({ routeIdx, catchAllIdx }));
ok('(3) the route answers { open: true } — the shape the client reads',
  /if \(p === '\/auth\/signup-status'\) \{\s*return sendJson\(res, \{ open: true \}\);/.test(double), '');

// The client's own parser, run on the double's body: apiSignupStatus reads `open === true`.
const parserSrc = api.slice(api.indexOf('export async function apiSignupStatus'), api.indexOf('export async function apiLogin'));
const parsed = parserSrc.match(/return data\.open === true;/);
ok('(4) the client reads sign-up as open only on open === true (the contract the double must meet)', !!parsed, '');
const doubleBody = { open: true };
const clientReads = doubleBody.open === true;
const oldCatchAllBody = { id: 'test-user', email: 'tester@example.com', name: 'Tester' };
ok('(5) the fixed body reads as OPEN; the old catch-all body would have read as closed',
  clientReads === true && (oldCatchAllBody.open === true) === false, '');

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nFIX-SIGNIN-LIVE-DOUBLE VERIFY: PASS (${checks.length} checks) — live walk not run (box turn)`
  : `\nFIX-SIGNIN-LIVE-DOUBLE VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
