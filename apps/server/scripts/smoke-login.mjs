// The post-deploy LIVE smoke test, signed in, as the dedicated smoke account. Prints STATUS CODES ONLY.
//
// Reads ~/.wrizo/smoke-account.json (written by create-smoke-account.mjs; never in the repo) and walks, once and in order:
//   POST /auth/login        expect 200   (the site's own Origin is sent, as a browser would)
//   GET  /auth/me           expect 200   (the session cookie rode back)
//   POST /api/sync          expect 200   body { lastSyncAt: null, push: {} } - a PULL ONLY: it writes nothing, ever
//   POST /auth/logout       expect 204
//   GET  /auth/me           expect 401   (the sign-out really ended the session)
//
// ONE ATTEMPT, NO RETRIES: the server slows an account to one attempt a minute after 8 failed logins, so a loop would
// lock out the very thing being tested. A failed step stops the walk.
// It prints each step's status and a PASS/FAIL line - never the email, the password, a cookie or any response body.
//
// Run:  node apps/server/scripts/smoke-login.mjs [--base https://host]        exit 0 = PASS
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const DEFAULT_BASE = 'https://writer-studio-app-production.up.railway.app';

export function credentialsPath() {
  return process.env.SMOKE_ACCOUNT_FILE || join(homedir(), '.wrizo', 'smoke-account.json');
}

// Runs the walk against `base` with `creds`; returns [{ step, expect, status, ok }]. Pure of printing, so a proof can read it.
export async function walk(base, creds) {
  const steps = [];
  let cookie = '';
  const call = async (label, method, path, expect, body) => {
    const res = await fetch(base + path, {
      method,
      redirect: 'manual',
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(method === 'POST' ? { Origin: base } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const set = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
    if (set.length) cookie = set.map((c) => c.split(';')[0]).join('; ');
    await res.arrayBuffer().catch(() => {}); // drain; the body is never read or printed
    const ok = res.status === expect;
    steps.push({ step: label, expect, status: res.status, ok });
    return ok;
  };
  if (!(await call('POST /auth/login', 'POST', '/auth/login', 200, { email: creds.email, password: creds.password }))) return steps;
  if (!(await call('GET  /auth/me', 'GET', '/auth/me', 200))) return steps;
  if (!(await call('POST /api/sync (pull only)', 'POST', '/api/sync', 200, { lastSyncAt: null, push: {} }))) return steps;
  if (!(await call('POST /auth/logout', 'POST', '/auth/logout', 204, {}))) return steps;
  await call('GET  /auth/me (after logout)', 'GET', '/auth/me', 401);
  return steps;
}

async function main() {
  const baseArg = process.argv.indexOf('--base');
  const base = (baseArg > -1 ? process.argv[baseArg + 1] : process.env.SMOKE_BASE_URL || DEFAULT_BASE).replace(/\/+$/, '');
  let creds;
  try { creds = JSON.parse(readFileSync(credentialsPath(), 'utf8')); } catch { console.error('No readable smoke-account file. Run create-smoke-account.mjs first.'); process.exit(2); }
  if (!creds || !creds.email || !creds.password) { console.error('The smoke-account file is incomplete.'); process.exit(2); }
  let steps;
  try { steps = await walk(base, creds); } catch (err) { console.error(`SMOKE: FAIL - request error (${err && err.cause && err.cause.code ? err.cause.code : 'error'})`); process.exitCode = 1; return; }
  for (const s of steps) console.log(`${s.ok ? 'ok  ' : 'FAIL'} ${s.step}  -> ${s.status} (expected ${s.expect})`);
  const pass = steps.length === 5 && steps.every((s) => s.ok);
  console.log(pass ? 'SMOKE: PASS (5/5)' : `SMOKE: FAIL (${steps.filter((s) => s.ok).length}/5 steps)`);
  // NOT process.exit(): on Windows, exiting while fetch's keep-alive sockets are still closing crashes Node (exit status
  // 3221226505) and would turn a PASS into a garbage exit code. Set the code and let the process drain by itself.
  process.exitCode = pass ? 0 : 1;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main();
}
