// GUEST LOGIN (item 225) — mints one guest account and its invite link.
//
// Usage (from apps/server, after migrations/pending/002_guest_links.sql has landed):
//   DATABASE_URL=postgres://... node scripts/mint-guest-link.mjs [--name "Tester"]
//
// Creates ONE users row (is_guest, a placeholder email on the reserved .invalid
// domain, a random never-disclosed password, expiry now + 30 days) and ONE
// guest_links row holding only the SHA-256 of the token. The raw token is printed
// once, here, for the operator to hand over — it is not stored and not logged.
import crypto from 'node:crypto';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const BCRYPT_COST = 12; // the same cost /register and /claim use

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}
const nameIdx = process.argv.indexOf('--name');
const name = nameIdx >= 0 ? String(process.argv[nameIdx + 1] || '').trim().slice(0, 80) || null : null;

const token = crypto.randomBytes(32).toString('base64url');
// Same rule as hashGuestToken() in src/auth.ts — keep the two in step.
const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
const email = `guest+${crypto.randomUUID()}@guest.invalid`;
const passHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), BCRYPT_COST);

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query('begin');
  const { rows } = await client.query(
    `insert into users (email, pass_hash, name, is_guest, guest_expires_at)
     values ($1, $2, $3, true, now() + interval '30 days')
     returning id, guest_expires_at`,
    [email, passHash, name],
  );
  await client.query(
    `insert into guest_links (token_hash, user_id) values ($1, $2)`,
    [tokenHash, rows[0].id],
  );
  await client.query('commit');
  console.log(`Guest account created. Expires ${new Date(rows[0].guest_expires_at).toISOString()} (30 days, slides on activity).`);
  console.log('Link path (shown once — hand it over now):');
  console.log(`/#/guest?t=${token}`);
} catch (err) {
  await client.query('rollback').catch(() => {});
  console.error('Minting failed; nothing was created.', err?.code || err?.message || 'unknown error');
  process.exitCode = 1;
} finally {
  await client.end();
}
