// The post-deploy LIVE smoke test, signed in, as the dedicated smoke account. Prints STATUS CODES ONLY.
//
// Reads ~/.wrizo/smoke-account.json (written by create-smoke-account.mjs; never in the repo) and walks, once and in order:
//   POST /auth/login        expect 200   (the site's own Origin is sent, as a browser would)
//   GET  /auth/me           expect 200   (the session cookie rode back)
//   POST /api/sync          expect 200   body { lastSyncAt: null, push: {} } - a PULL ONLY: it writes nothing, ever
//   POST /auth/logout       expect 204
//   GET  /auth/me           expect 401   (the client is signed out: logout's own Set-Cookie emptied the jar)
//   GET  /auth/me           expect 401   with the PRE-LOGOUT cookie replayed - the only step that proves the SERVER ended
//                                        the session (the step above would 401 even if the session survived)
//
// ONE ATTEMPT, NO RETRIES: the server slows an account to one attempt a minute after 8 failed logins, so a loop would
// lock out the very thing being tested. A failed step stops the walk.
// HTTPS ONLY: the base URL must be https:// (plain http only for 127.0.0.1 / localhost, which is how the proof runs).
// Credentials never travel over plain http, and a refused base reads nothing and sends nothing.
// It prints each step's status and a PASS/FAIL line - never the email, the password, a cookie or any response body.
//
// Run:  node apps/server/scripts/smoke-login.mjs [--base https://host]        exit 0 = PASS
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const DEFAULT_BASE = 'https://writer-studio-app-production.up.railway.app';
export const STEP_COUNT = 6;

export function credentialsPath() {
  return process.env.SMOKE_ACCOUNT_FILE || join(homedir(), '.wrizo', 'smoke-account.json');
}

// Runs the walk against `base` with `creds`; returns [{ step, expect, status, ok }]. Pure of printing, so a proof can read it.
export async function walk(base, creds) {
  assertSafeBase(base); // before a single byte is sent: the credentials never travel over plain http
  const steps = [];
  let cookie = '';
  // `replayCookie`: send THIS cookie instead of the jar's, and leave the jar alone (a replay must not change state).
  const call = async (label, method, path, expect, body, replayCookie) => {
    const sending = replayCookie !== undefined ? replayCookie : cookie;
    const res = await fetch(base + path, {
      method,
      redirect: 'manual',
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(method === 'POST' ? { Origin: base } : {}),
        ...(sending ? { Cookie: sending } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const set = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
    if (set.length && replayCookie === undefined) cookie = set.map((c) => c.split(';')[0]).join('; ');
    await res.arrayBuffer().catch(() => {}); // drain; the body is never read or printed
    const ok = res.status === expect;
    steps.push({ step: label, expect, status: res.status, ok });
    return ok;
  };
  if (!(await call('POST /auth/login', 'POST', '/auth/login', 200, { email: creds.email, password: creds.password }))) return steps;
  if (!(await call('GET  /auth/me', 'GET', '/auth/me', 200))) return steps;
  if (!(await call('POST /api/sync (pull only)', 'POST', '/api/sync', 200, { lastSyncAt: null, push: {} }))) return steps;
  const preLogoutCookie = cookie; // saved BEFORE logout: logout's own Set-Cookie clears the jar
  if (!(await call('POST /auth/logout', 'POST', '/auth/logout', 204, {}))) return steps;
  // The jar's cookie is now empty, so this 401 would come back even if the session survived on the server. Keep it (the
  // client really is signed out)...
  if (!(await call('GET  /auth/me (after logout, jar)', 'GET', '/auth/me', 401))) return steps;
  // ...and PROVE the server side: replay the cookie the browser HAD. The session must be gone, not merely forgotten.
  await call('GET  /auth/me (pre-logout cookie replayed)', 'GET', '/auth/me', 401, undefined, preLogoutCookie);
  return steps;
}

// No credentials over plain http, ever: https:// only. The one exception is a loopback host (127.0.0.1, localhost, [::1]),
// which is how the proof talks to a fake server on this machine. The hostname is compared EXACTLY, so
// http://127.0.0.1.evil.example and http://localhost.evil.example are refused.
export function assertSafeBase(base) {
  let u;
  try { u = new URL(base); } catch { throw new Error('unsafe-base'); }
  const loopback = u.hostname === '127.0.0.1' || u.hostname === 'localhost' || u.hostname === '[::1]';
  if (u.protocol === 'https:' || (u.protocol === 'http:' && loopback)) return;
  throw new Error('unsafe-base');
}

async function main() {
  const baseArg = process.argv.indexOf('--base');
  const base = (baseArg > -1 ? process.argv[baseArg + 1] : process.env.SMOKE_BASE_URL || DEFAULT_BASE).replace(/\/+$/, '');
  try { assertSafeBase(base); } catch { console.error('Refused: the base URL must be https:// (plain http only for 127.0.0.1 / localhost). No credentials were read or sent.'); process.exitCode = 2; return; }
  let creds;
  try { creds = JSON.parse(readFileSync(credentialsPath(), 'utf8')); } catch { console.error('No readable smoke-account file. Run create-smoke-account.mjs first.'); process.exit(2); }
  if (!creds || !creds.email || !creds.password) { console.error('The smoke-account file is incomplete.'); process.exit(2); }
  let steps;
  try { steps = await walk(base, creds); } catch (err) { console.error(`SMOKE: FAIL - request error (${err && err.cause && err.cause.code ? err.cause.code : 'error'})`); process.exitCode = 1; return; }
  for (const s of steps) console.log(`${s.ok ? 'ok  ' : 'FAIL'} ${s.step}  -> ${s.status} (expected ${s.expect})`);
  const pass = steps.length === STEP_COUNT && steps.every((s) => s.ok);
  console.log(pass ? `SMOKE: PASS (${STEP_COUNT}/${STEP_COUNT})` : `SMOKE: FAIL (${steps.filter((s) => s.ok).length}/${STEP_COUNT} steps)`);
  // NOT process.exit(): on Windows, exiting while fetch's keep-alive sockets are still closing crashes Node (exit status
  // 3221226505) and would turn a PASS into a garbage exit code. Set the code and let the process drain by itself.
  process.exitCode = pass ? 0 : 1;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main();
}
