// MOBILE-B - THE PHONE'S YES-OR-NO ROUTE ON A REAL POSTGRES, run through the harness workflow (the pattern of tutor-notes-pg-ci.mjs).
// The check itself is apps/server/scripts/card-held-pg.mjs (the server's own boot migration, upsert, sign-in guard and router against an actual database; it refuses any database that is not on this
// machine). A hosted GitHub runner has PostgreSQL installed but stopped, so THIS file starts it, makes a throwaway role and database for the one run, and hands them to that check.
//   gh workflow run harness.yml --ref ci/actions-harness -f ref=<branch> -f files=mobile-holds-pg-ci.mjs -f leg=default -f shards=1
// Off a hosted runner (the Windows box, a developer's machine) it does nothing and says so: there is no Postgres to start and nothing to prove there. It is not a stand-in for the box's pair.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const CHECK = path.resolve(here, '..', '..', '..', 'server', 'scripts', 'card-held-pg.mjs');
const say = (s) => process.stdout.write(s + '\n');

if (process.env.WS_CI_RUNNER !== '1' || process.platform !== 'linux') {
  say('Not a hosted runner (WS_CI_RUNNER is not 1, or not Linux): there is no Postgres here to start, so nothing is checked. Run apps/server/scripts/card-held-pg.mjs against your own local database.');
  say('\nMOBILE-HOLDS-PG-CI VERIFY: PASS (0 checks: skipped off a hosted runner)');
  process.exit(0);
}

const run = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: 'utf8', ...opts });
let started = run('sudo', ['-n', 'systemctl', 'start', 'postgresql']);
if (started.status !== 0) started = run('sudo', ['-n', 'service', 'postgresql', 'start']);
say(`start postgres: exit ${started.status}${started.status !== 0 ? ' ' + String(started.stderr).slice(0, 200) : ''}`);

let ready = false;
for (let i = 0; i < 30 && !ready; i += 1) {
  ready = run('sudo', ['-n', '-u', 'postgres', 'psql', '-tAc', 'select 1']).status === 0;
  if (!ready) run('sleep', ['1']);
}
if (!ready) { say('\nMOBILE-HOLDS-PG-CI VERIFY: FAIL - the runner\'s Postgres did not come up'); process.exit(1); }
const ver = run('sudo', ['-n', '-u', 'postgres', 'psql', '-tAc', 'show server_version']).stdout.trim();
say(`postgres ${ver} is up`);

// a throwaway role and database for this one run (the runner is destroyed after the job)
const PW = 'throwaway-runner-only';
const setup = run('sudo', ['-n', '-u', 'postgres', 'psql', '-v', 'ON_ERROR_STOP=1',
  '-c', `create role held_check login password '${PW}'`,
  '-c', 'create database held_check owner held_check']);
if (setup.status !== 0) { say(String(setup.stderr).slice(0, 300)); say('\nMOBILE-HOLDS-PG-CI VERIFY: FAIL - could not make the throwaway role and database'); process.exit(1); }

const r = spawnSync(process.execPath, [CHECK], {
  encoding: 'utf8',
  env: { ...process.env, DATABASE_URL: `postgres://held_check:${PW}@127.0.0.1:5432/held_check`, SESSION_SECRET: 'ci-check-only' },
});
say(String(r.stdout || ''));
if (r.stderr) say(String(r.stderr).slice(0, 1200));
say(r.status === 0 ? `\nMOBILE-HOLDS-PG-CI VERIFY: PASS (the real-database check passed on Postgres ${ver})` : `\nMOBILE-HOLDS-PG-CI VERIFY: FAIL - the real-database check did not pass (exit ${r.status})`);
process.exit(r.status === 0 ? 0 : 1);
