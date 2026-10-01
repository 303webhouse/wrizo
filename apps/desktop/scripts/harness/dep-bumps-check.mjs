// DEPENDENCIES — react-router-dom >= 7.18.2 (a direct dependency bump), and
// express's own transitive qs/body-parser at their patched versions (qs
// >=6.16.0 closes two moderate advisories — GHSA-x5fp-wj9c-mxmx, GHSA-4mjr-
// xmp4-gh2g; body-parser >=2.3.0 closes one low advisory — a DoS via a
// silently-disabled size limit when an invalid `limit` value is given),
// forced via a root `pnpm.overrides` entry since neither is a direct
// dependency of this workspace. `pnpm audit` confirmed both clear at these
// floors (run manually; not re-run here — a live registry/advisory-database
// call has no place in a reproducible, offline harness).
//
// Run: node scripts/harness/dep-bumps-check.mjs   (from the repo root).
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '..', '..', '..', '..');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });

function cmp(a, b) {
  const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) { if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0); }
  return 0;
}
function atLeast(version, floor) { return cmp(version, floor) >= 0; }

const lockText = fs.readFileSync(path.join(ROOT, 'pnpm-lock.yaml'), 'utf8');
const rootPkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const desktopPkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'apps/desktop/package.json'), 'utf8'));

function lockedVersion(name) {
  const m = lockText.match(new RegExp(`^  ${name.replace('/', '\\/')}@([\\d.]+):`, 'm'));
  return m ? m[1] : null;
}

// ---- react-router-dom ------------------------------------------------------
ok('react-router-dom: package.json\'s own declared range is at least 7.18.2 (not just a lockfile coincidence that a future fresh install could lose)',
  /\^?7\.(1[89]|[2-9]\d)\.\d+/.test(desktopPkg.dependencies['react-router-dom']) || atLeast(desktopPkg.dependencies['react-router-dom'].replace(/^[\^~]/, ''), '7.18.2'),
  desktopPkg.dependencies['react-router-dom']);
const rrdLocked = lockedVersion('react-router-dom');
ok('react-router-dom: the LOCKED, actually-installed version meets the >=7.18.2 floor',
  !!rrdLocked && atLeast(rrdLocked, '7.18.2'), String(rrdLocked));

// ---- qs / body-parser, forced via pnpm.overrides ---------------------------
ok('package.json carries a pnpm.overrides floor for qs (>=6.16.0) and body-parser (>=2.3.0) — the reason the lockfile reflects this rather than express\'s own (older) declared minimum',
  rootPkg.pnpm?.overrides?.qs === '>=6.16.0' && rootPkg.pnpm?.overrides?.['body-parser'] === '>=2.3.0',
  JSON.stringify(rootPkg.pnpm?.overrides));
const qsLocked = lockedVersion('qs');
const bodyParserLocked = lockedVersion('body-parser');
ok('qs: the LOCKED version is >=6.16.0 (closes GHSA-x5fp-wj9c-mxmx and GHSA-4mjr-xmp4-gh2g)',
  !!qsLocked && atLeast(qsLocked, '6.16.0'), String(qsLocked));
ok('body-parser: the LOCKED version is >=2.3.0 (closes the silently-disabled-limit DoS advisory)',
  !!bodyParserLocked && atLeast(bodyParserLocked, '2.3.0'), String(bodyParserLocked));

// ---- prove the bump was REAL — origin/main's lockfile was below the floor --
try {
  const baseLock = execSync('git show origin/main:pnpm-lock.yaml', { cwd: ROOT, encoding: 'utf8' });
  const baseVersion = (name) => {
    const m = baseLock.match(new RegExp(`^  ${name.replace('/', '\\/')}@([\\d.]+):`, 'm'));
    return m ? m[1] : null;
  };
  const baseRrd = baseVersion('react-router-dom');
  const baseQs = baseVersion('qs');
  const baseBp = baseVersion('body-parser');
  ok('FALSIFIED (before/after, not a code mutation — there is no logic here to mutate): origin/main\'s own lockfile, before this branch, had react-router-dom BELOW the 7.18.2 floor — confirms this is a real bump, not a no-op',
    !!baseRrd && !atLeast(baseRrd, '7.18.2'), JSON.stringify({ before: baseRrd, after: rrdLocked }));
  ok('FALSIFIED: origin/main\'s qs was below 6.16.0 before this branch',
    !!baseQs && !atLeast(baseQs, '6.16.0'), JSON.stringify({ before: baseQs, after: qsLocked }));
  ok('FALSIFIED: origin/main\'s body-parser was below 2.3.0 before this branch',
    !!baseBp && !atLeast(baseBp, '2.3.0'), JSON.stringify({ before: baseBp, after: bodyParserLocked }));
} catch (e) {
  ok('before/after comparison against origin/main ran (requires a git remote fetch; skipped honestly rather than failed if unavailable)',
    false, String(e));
}

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log('\nDEP-BUMPS PARKED: PASS (0 checks) — HARNESS_PARKED=1 armed; this file parks nothing: no earlier check asserted a version floor here.');
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nDEP-BUMPS VERIFY: PASS (${checks.length} checks)`
  : `\nDEP-BUMPS VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
