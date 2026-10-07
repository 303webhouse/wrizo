// Create (or rotate) the ONE dedicated account the post-deploy live smoke test signs in with.
//
// WHY A SCRIPT: sign-ups are closed (INVITE_CODES is deliberately unset until guest links ship), so the ordinary route
// cannot make this account. The owner runs this once, from their own machine, against the production database.
//
// RUN (repo root; the server must be BUILT first so the hash function below exists):
//   pnpm --filter @writer-studio/server build
//   railway run --service Postgres node apps/server/scripts/create-smoke-account.mjs            (create, once)
//   railway run --service Postgres node apps/server/scripts/create-smoke-account.mjs --rotate   (new password)
// `--service Postgres` hands the script that service's DATABASE_PUBLIC_URL (see set-password.mjs).
//
// WHERE THE SECRET LIVES: ~/.wrizo/smoke-account.json, and nowhere else. The email is smoke-<8 random hex>@wrizo.invalid,
// generated HERE and stored ONLY in that file (never in the repo: it is public, and the login slow-down could otherwise be
// griefed against a known address). The password is 24 characters from crypto.randomBytes. The file is created EMPTY,
// stripped of every inherited permission so only this Windows user holds it, and only THEN written - the secret never sits
// in a file with inherited access. The server receives a bcrypt HASH (the same function sign-up uses, imported from the
// built passwordHash.js - not re-implemented) as a query parameter over TLS; it never sees the password until
// smoke-login.mjs posts it over HTTPS.
//
// WHAT IT PRINTS: one word - created / rotated / exists - and the file's path. Never the email, the password, a hash or any
// connection detail; an error prints a short code only (a driver message can carry a host name).
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, openSync, closeSync, writeFileSync, readFileSync, renameSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { homedir, userInfo } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);

export const SMOKE_NAME = 'Smoke test (do not use)';
export const SMOKE_EMAIL_RE = /^smoke-[0-9a-f]{8}@wrizo\.invalid$/;

export function credentialsPath() {
  return process.env.SMOKE_ACCOUNT_FILE || join(homedir(), '.wrizo', 'smoke-account.json');
}

export function makeCredentials() {
  return {
    email: `smoke-${randomBytes(4).toString('hex')}@wrizo.invalid`,
    password: randomBytes(18).toString('base64url'), // 24 characters
  };
}

// Only this user may touch the file. On Windows: drop inherited ACLs and grant the current user alone. Elsewhere 0600 does it.
export function lockDown(file) {
  if (process.platform !== 'win32') return;
  const who = `${process.env.USERDOMAIN ? process.env.USERDOMAIN + '\\' : ''}${userInfo().username}`;
  execFileSync('icacls', [file, '/inheritance:r', '/grant:r', `${who}:(R,W,D)`], { stdio: 'ignore' });
}

// Create the file EMPTY ('wx': refuses to clobber), lock it, then write the secret into it.
export function writeSecretFile(file, creds) {
  mkdirSync(dirname(file), { recursive: true });
  const fd = openSync(file, 'wx', 0o600);
  closeSync(fd);
  try {
    lockDown(file);
    writeFileSync(file, JSON.stringify({ email: creds.email, password: creds.password, createdAt: new Date().toISOString() }, null, 2), { mode: 0o600 });
  } catch (err) {
    rmSync(file, { force: true });
    throw err;
  }
}

function distHash() {
  const p = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'passwordHash.js');
  if (!existsSync(p)) {
    console.error('Build the server first: pnpm --filter @writer-studio/server build');
    process.exit(2);
  }
  return require(p);
}

function poolFor(url, Pool) {
  // Railway's Postgres is reached over TLS with a self-signed chain (db.ts does the same); a loopback database has none.
  let loopback = false;
  try { const h = new URL(url).hostname; loopback = h === '127.0.0.1' || h === 'localhost'; } catch { /* leave TLS on */ }
  return new Pool({ connectionString: url, ssl: loopback ? false : { rejectUnauthorized: false }, max: 1 });
}

async function main() {
  const rotate = process.argv.includes('--rotate');
  const url = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
  if (!url) { console.error('No database connection is set. Run it as: railway run --service Postgres node apps/server/scripts/create-smoke-account.mjs'); process.exit(2); }
  const { hashPassword, MIN_PASSWORD_LENGTH } = distHash();
  const { Pool } = require('pg');
  const file = credentialsPath();

  if (!rotate) {
    if (existsSync(file)) { console.log(`exists (${file}) - nothing changed; use --rotate for a new password`); return; }
    const creds = makeCredentials();
    if (creds.password.length < MIN_PASSWORD_LENGTH) { console.error('Generated password is too short.'); process.exit(1); }
    const hash = await hashPassword(creds.password);
    writeSecretFile(file, creds); // the file first: a database row whose password was never saved would be unusable
    const pool = poolFor(url, Pool);
    try {
      await pool.query(`insert into users (email, pass_hash, name) values ($1, $2, $3)`, [creds.email, hash, SMOKE_NAME]);
      console.log(`created (${file})`);
    } catch (err) {
      rmSync(file, { force: true }); // no orphan credentials for an account that does not exist
      console.error(`Could not finish (${err && err.code ? err.code : 'error'}). Nothing was changed.`);
      process.exitCode = 1;
    } finally {
      await pool.end();
    }
    return;
  }

  // --rotate: a new password for the account already in the file; the old sign-ins end (same transaction as set-password.mjs).
  if (!existsSync(file)) { console.error('No credentials file to rotate. Run without --rotate first.'); process.exit(2); }
  let current;
  try { current = JSON.parse(readFileSync(file, 'utf8')); } catch { console.error('The credentials file is unreadable. Nothing was changed.'); process.exit(2); }
  if (!current || !SMOKE_EMAIL_RE.test(String(current.email || ''))) { console.error('The credentials file is not a smoke account. Nothing was changed.'); process.exit(2); }
  const next = { email: current.email, password: randomBytes(18).toString('base64url') };
  const hash = await hashPassword(next.password);
  const { applyPasswordChange } = await import('./set-password.mjs');
  const pool = poolFor(url, Pool);
  let client;
  const tmp = `${file}.new`;
  try {
    rmSync(tmp, { force: true });
    writeSecretFile(tmp, next); // the new secret is on disk, locked, BEFORE the database changes
    client = await pool.connect();
    const result = await applyPasswordChange(client, next.email, hash);
    if (result !== 'updated') { rmSync(tmp, { force: true }); console.error('No such account in the database. Nothing was changed.'); process.exitCode = 1; return; }
    rmSync(file, { force: true });
    renameSync(tmp, file);
    console.log(`rotated (${file})`);
  } catch (err) {
    rmSync(tmp, { force: true });
    console.error(`Could not finish (${err && err.code ? err.code : 'error'}). The old password still stands.`);
    process.exitCode = 1;
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().catch(() => { console.error('Could not finish. Nothing was changed.'); process.exit(1); });
}
