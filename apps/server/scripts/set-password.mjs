// Set a writer's password from the operator's own terminal, and end their old sign-ins.
//
// WHY: there is no password-reset flow yet ("Forgot password?" by email needs an email service; backlog). When a
// writer cannot get back in, the owner runs this ONCE, from their own machine, against the production database.
//
// RUN (from the repo root, in a terminal on the owner's own computer, logged in to Railway):
//   railway run --service Postgres node apps/server/scripts/set-password.mjs
// `--service Postgres` matters: it hands the script that service's DATABASE_PUBLIC_URL, which a laptop can reach.
// (writer-studio-app's own DATABASE_URL points at Railway's private network and does not resolve from outside it.)
//
// WHAT IT DOES: asks for the account's email (shown as you type it), then the new password TWICE with the typing hidden;
// refuses a password shorter than MIN_PASSWORD_LENGTH; hashes it with bcrypt at auth.ts's own cost; sets it for the one
// account with that email (never a guest, if the guest column exists); and deletes that account's rows from the session
// table so every old sign-in ends. It prints exactly one line: "updated" or "no such account".
//
// WHAT IT NEVER DOES: print the email or the password back, print the database URL or any connection detail, write
// either to a file or a log, or take them from the command line or the environment (a command line is saved in shell
// history; this reads them from the keyboard only). Errors print a short code, never a message (a driver message can carry
// the host name).
//
// The constants below MIRROR apps/server/src/auth.ts (BCRYPT_COST, MIN_PASSWORD_LENGTH). If either changes there, change it
// here: a different cost would still verify at login but would silently differ from every other hash.
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);

export const BCRYPT_COST = 12;
export const MIN_PASSWORD_LENGTH = 8;

// Pure, so it can be proven without a terminal or a database: the same trim + lowercase auth.ts's /login applies.
export function normalizeEmail(raw) {
  return String(raw || '').trim().toLowerCase();
}

// Returns null when acceptable, else a short reason. Never echoes the password.
export function passwordProblem(pw) {
  if (typeof pw !== 'string' || pw.length < MIN_PASSWORD_LENGTH) return `The password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  return null;
}

// The whole database effect, one transaction: set the hash for the one non-guest account with this email, then end
// that account's sign-ins. Takes an already-connected `pg` client (or any object with .query). Returns 'updated' or
// 'no such account'. `is_guest` does not exist until guest login ships, so it is used ONLY if the column is there.
export async function applyPasswordChange(client, email, passHash) {
  await client.query('begin');
  try {
    const col = await client.query(
      `select 1 from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'is_guest'`,
    );
    const guestGuard = col.rowCount > 0 ? ' and not is_guest' : '';
    const upd = await client.query(
      `update users set pass_hash = $2 where email = $1${guestGuard} returning id`,
      [email, passHash],
    );
    if (upd.rowCount === 0) {
      await client.query('rollback');
      return 'no such account';
    }
    const userId = String(upd.rows[0].id);
    // connect-pg-simple's table (session.ts: createTableIfMissing). It may not exist on a database that has never had a
    // sign-in; there is then nothing to end.
    const tbl = await client.query(`select to_regclass('public.session') as t`);
    if (tbl.rows[0] && tbl.rows[0].t) {
      await client.query(`delete from session where sess->>'userId' = $1`, [userId]);
    }
    await client.query('commit');
    return 'updated';
  } catch (err) {
    try { await client.query('rollback'); } catch { /* the original error is the one that matters */ }
    throw err;
  }
}

// Reads one line from the keyboard. hidden=true shows nothing while typing. Needs a real terminal (raw mode).
function readLine(prompt, { hidden }) {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    process.stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    let buf = '';
    const finish = (fn, v) => {
      stdin.removeListener('data', onData);
      stdin.setRawMode(false);
      stdin.pause();
      process.stdout.write('\n');
      fn(v);
    };
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n') { finish(resolve, buf); return; }
        if (ch === '\u0003') { finish(reject, new Error('cancelled')); return; } // Ctrl+C
        if (ch === '\u007f' || ch === '\b') {
          if (buf.length > 0) { buf = buf.slice(0, -1); if (!hidden) process.stdout.write('\b \b'); }
          continue;
        }
        if (ch < ' ') continue; // other control characters
        buf += ch;
        if (!hidden) process.stdout.write(ch);
      }
    };
    stdin.on('data', onData);
  });
}

async function main() {
  if (!process.stdin.isTTY) {
    console.error('Run this in a terminal you are typing into (it reads the password from the keyboard, hidden).');
    process.exit(2);
  }
  const url = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
  if (!url) { console.error('No database connection is set. Run it as: railway run --service Postgres node apps/server/scripts/set-password.mjs'); process.exit(2); }

  const email = normalizeEmail(await readLine('Account email: ', { hidden: false }));
  if (!email) { console.error('No email entered.'); process.exit(2); }
  const pw1 = await readLine('New password (typing is hidden): ', { hidden: true });
  const problem = passwordProblem(pw1);
  if (problem) { console.error(problem); process.exit(2); }
  const pw2 = await readLine('Type it again to confirm: ', { hidden: true });
  if (pw1 !== pw2) { console.error('The two entries did not match. Nothing was changed.'); process.exit(2); }

  const bcrypt = require('bcryptjs');
  const { Pool } = require('pg');
  const hash = await bcrypt.hash(pw1, BCRYPT_COST);

  // Railway's Postgres is reached over TLS with a self-signed chain (db.ts does the same).
  const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false }, max: 1 });
  let client;
  try {
    client = await pool.connect();
    console.log(await applyPasswordChange(client, email, hash));
  } catch (err) {
    console.error(`Could not finish (${err && err.code ? err.code : 'error'}). Nothing was changed.`);
    process.exitCode = 1;
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().catch((err) => { console.error(err && err.message === 'cancelled' ? 'Cancelled. Nothing was changed.' : 'Could not finish. Nothing was changed.'); process.exit(1); });
}
