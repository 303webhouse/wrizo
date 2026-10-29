// CI-RUNNER-GUARD (Oct 29, the harness on GitHub Actions). BROWSERLESS. The box grant allocates ONE shared machine between lanes; a GitHub-hosted job is its own
// throwaway machine and needs no turn. The bypass in box-grant.mjs (isGithubHostedRunner) must be IMPOSSIBLE on the box and must need everything GitHub itself sets:
//   G1  all four facts present (Linux + GITHUB_ACTIONS + RUNNER_ENVIRONMENT=github-hosted + the workflow's WS_CI_RUNNER=1) -> the runner needs no turn
//   G2  the SAME environment on Windows (the box) -> still needs a turn
//   G3  any one fact missing -> still needs a turn (each of the four, one at a time)
//   G4  a self-hosted runner (RUNNER_ENVIRONMENT=self-hosted) -> still needs a turn
//   G5  on THIS machine, checkGrant with a made-up token is refused (the real guard is untouched when no CI facts are set)
//   G6  the launch flags that weaken the browser sandbox are behind the same gate (source pin: WS_CI_RUNNER === '1' && linux, in runtime-verify.mjs)
// Mutants (each must land and turn a check RED): the platform test dropped (G2), the runner-environment test dropped (G4), the flag test dropped (G3), the sandbox gate dropped (G6).
// Run: node scripts/harness/ci-runner-guard.mjs
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS = path.join(HERE, '..');
const GRANT_SRC = readFileSync(path.join(SCRIPTS, 'box-grant.mjs'), 'utf8');
const RV_SRC = readFileSync(path.join(SCRIPTS, 'runtime-verify.mjs'), 'utf8');
const tmp = mkdtempSync(path.join(tmpdir(), 'ci-runner-guard-'));

const CI = { GITHUB_ACTIONS: 'true', RUNNER_ENVIRONMENT: 'github-hosted', WS_CI_RUNNER: '1' };

// Run the checks against a module text (the real file, or a mutant copy beside it so its relative imports still resolve).
async function run(label, grantSrc, rvSrc) {
  const out = [];
  const ok = (name, pass, detail = '') => out.push({ name: `[${label}] ${name}`, pass: !!pass, detail });
  const file = path.join(SCRIPTS, `.ci-runner-guard-${label}.mjs`);
  writeFileSync(file, grantSrc);
  try {
    const m = await import(pathToFileURL(file).href + `?v=${label}`);
    const f = m.isGithubHostedRunner;
    ok('G1 the four facts together: no turn needed on a hosted runner', f(CI, 'linux') === true);
    ok('G2 the same environment on Windows (the box) still needs a turn', f(CI, 'win32') === false);
    ok('G3 each missing fact alone still needs a turn', ['GITHUB_ACTIONS', 'RUNNER_ENVIRONMENT', 'WS_CI_RUNNER'].every((k) => f({ ...CI, [k]: '' }, 'linux') === false) && f({}, 'linux') === false);
    ok('G4 a self-hosted runner still needs a turn', f({ ...CI, RUNNER_ENVIRONMENT: 'self-hosted' }, 'linux') === false);
    const saved = { ...process.env }; for (const k of Object.keys(CI)) delete process.env[k];
    const v = m.checkGrant('made-up-token-' + Date.now());
    Object.assign(process.env, saved);
    ok('G5 here, with no CI facts, a made-up token is refused by the real guard', v && v.ok === false, JSON.stringify(v && { ok: v.ok, reason: v.reason }));
    ok('G6 the sandbox-off flags sit behind WS_CI_RUNNER=1 on Linux only', /WS_CI_RUNNER === '1' && process\.platform === 'linux' \? \['--no-sandbox'/.test(rvSrc));
  } finally { rmSync(file, { force: true }); }
  return out;
}

const all = [...await run('real', GRANT_SRC, RV_SRC)];
const MUT = [
  { name: 'the platform test is dropped', grant: [/platform === 'linux' && /, ''], red: 'G2' },
  { name: 'the runner-environment test is dropped', grant: [/ && env\.RUNNER_ENVIRONMENT === 'github-hosted'/, ''], red: 'G4' },
  { name: 'the WS_CI_RUNNER flag test is dropped', grant: [/ && env\.WS_CI_RUNNER === '1';/, ';'], red: 'G3' },
  { name: 'the sandbox flags lose their gate', rv: [/WS_CI_RUNNER === '1' && process\.platform === 'linux' \? \['--no-sandbox'/, "true ? ['--no-sandbox'"], red: 'G6' },
];
for (const mu of MUT) {
  const g = mu.grant ? GRANT_SRC.replace(mu.grant[0], mu.grant[1]) : GRANT_SRC;
  const r = mu.rv ? RV_SRC.replace(mu.rv[0], mu.rv[1]) : RV_SRC;
  const landed = (mu.grant ? g !== GRANT_SRC : r !== RV_SRC);
  const res = await run('m' + MUT.indexOf(mu), g, r);
  const red = res.filter((c) => !c.pass).map((c) => c.name.match(/G\d/)[0]);
  all.push({ name: `mutant "${mu.name}": landed and turns ${mu.red} RED`, pass: landed && red.includes(mu.red), detail: `landed=${landed} red=${red.join(',') || 'none'}` });
}
rmSync(tmp, { recursive: true, force: true });

const failed = all.filter((c) => !c.pass);
for (const c of all) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
console.log(failed.length ? `\nCI-RUNNER-GUARD VERIFY: FAIL - ${failed.length}/${all.length} failed` : `\nCI-RUNNER-GUARD VERIFY: PASS (${all.length} checks)`);
process.exit(failed.length ? 1 : 0);
