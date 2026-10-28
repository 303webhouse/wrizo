// Create ONE account while sign-ups are closed (INVITE_CODES is deliberately unset until guest links ship), from the owner's own terminal.
//
// WHY: the ordinary route (/auth/signup) needs an invite code, and none is set. This script is the same insert sign-up makes
// (auth.ts: `insert into users (email, pass_hash, name)`), with the same bcrypt hash function (imported from the BUILT passwordHash.js,
// never re-implemented). It is the sibling of set-password.mjs (which only changes an existing account) and create-smoke-account.mjs
// (which draws its own random credentials - this one never does: the OWNER types them).
//
// RUN (repo root; build the server first so the hash function exists):
//   pnpm --filter @writer-studio/server build
//   railway run --service Postgres node apps/server/scripts/create-account.mjs [--name "Display name"] [--record-as sample]
// `--service Postgres` hands the script that service's DATABASE_PUBLIC_URL (see set-password.mjs).
//
// WHAT IT DOES: asks for the account's email (shown as you type it), then the password TWICE with the typing hidden; refuses a password
// shorter than MIN_PASSWORD_LENGTH; inserts the user; prints exactly one word: "created", "exists" (that email is taken - nothing changed)
// or an error code. `--record-as sample` also writes the new account's id (and nothing else) to ~/.wrizo/sample-account.json - the ONE
// id the sample-account seed script will ever agree to wipe and rebuild. It refuses if that file is already there.
//
// WHAT IT NEVER DOES: print the email, the password, a hash or any connection detail; write the email or password to a file or a log;
// take either from the command line or the environment (a command line is saved in shell history). Errors print a short code only.
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { normalizeEmail, readLine } from './set-password.mjs';

const require = createRequire(import.meta.url);

export function sampleAccountFile() {
  return process.env.SAMPLE_ACCOUNT_FILE || join(homedir(), '.wrizo', 'sample-account.json');
}

// The whole database effect: the same insert sign-up makes. Takes any object with .query. Returns { status: 'created', id } or { status: 'exists' }
// (a unique-violation on the email: nothing was changed). Any other failure throws.
export async function insertAccount(db, { email, passHash, name }) {
  try {
    const { rows } = await db.query(`insert into users (email, pass_hash, name) values ($1, $2, $3) returning id`, [email, passHash, name || null]);
    return { status: 'created', id: String(rows[0].id) };
  } catch (err) {
    if (err && err.code === '23505') return { status: 'exists' };
    throw err;
  }
}

// Writes { userId } ONLY, and refuses to clobber ('wx'): an id is not a secret, but it is the allow-list for the seed's destructive path.
export function recordSampleId(file, id) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify({ userId: id, recordedAt: new Date().toISOString() }, null, 2), { flag: 'wx' });
}

function distHash() {
  const p = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'passwordHash.js');
  if (!existsSync(p)) { console.error('Build the server first: pnpm --filter @writer-studio/server build'); process.exit(2); }
  return require(p);
}

function argAfter(flag) { const i = process.argv.indexOf(flag); return i >= 0 ? process.argv[i + 1] : null; }

async function main() {
  if (!process.stdin.isTTY) { console.error('Run this in a terminal you are typing into (it reads the email and password from the keyboard).'); process.exit(2); }
  const url = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
  if (!url) { console.error('No database connection is set. Run it as: railway run --service Postgres node apps/server/scripts/create-account.mjs'); process.exit(2); }
  const recordAs = argAfter('--record-as');
  if (recordAs && recordAs !== 'sample') { console.error('--record-as takes "sample".'); process.exit(2); }
  if (recordAs && existsSync(sampleAccountFile())) { console.error('A sample account is already recorded (the id file exists). Nothing was changed.'); process.exit(2); }
  const name = (argAfter('--name') || (recordAs === 'sample' ? 'Sample' : '')).trim();

  const { hashPassword, MIN_PASSWORD_LENGTH } = distHash();
  const email = normalizeEmail(await readLine('Account email: ', { hidden: false }));
  if (!email) { console.error('No email entered.'); process.exit(2); }
  const pw1 = await readLine('Password (typing is hidden): ', { hidden: true });
  if (typeof pw1 !== 'string' || pw1.length < MIN_PASSWORD_LENGTH) { console.error(`The password must be at least ${MIN_PASSWORD_LENGTH} characters.`); process.exit(2); }
  const pw2 = await readLine('Type it again to confirm: ', { hidden: true });
  if (pw1 !== pw2) { console.error('The two entries did not match. Nothing was changed.'); process.exit(2); }
  const passHash = await hashPassword(pw1);

  const { Pool } = require('pg');
  let loopback = false;
  try { const h = new URL(url).hostname; loopback = h === '127.0.0.1' || h === 'localhost'; } catch { /* leave TLS on */ }
  const pool = new Pool({ connectionString: url, ssl: loopback ? false : { rejectUnauthorized: false }, max: 1 });
  try {
    const out = await insertAccount(pool, { email, passHash, name: name || null });
    if (out.status === 'created' && recordAs === 'sample') recordSampleId(sampleAccountFile(), out.id);
    console.log(out.status);
  } catch (err) {
    console.error(`Could not finish (${err && err.code ? err.code : 'error'}). Nothing was changed.`);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().catch((err) => { console.error(err && err.message === 'cancelled' ? 'Cancelled. Nothing was changed.' : 'Could not finish. Nothing was changed.'); process.exit(1); });
}
