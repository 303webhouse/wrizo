import bcrypt from 'bcryptjs';

// ONE place for how this server hashes a password and how short one may be. auth.ts uses it for sign-up, and the
// owner-run scripts under apps/server/scripts (create-smoke-account.mjs) import the BUILT copy (dist/passwordHash.js), so a
// hash made out-of-band can never drift from one made by the app: change the cost here and both follow.
export const BCRYPT_COST = 12;

// ITEM 224 — a minimum for NEW and CHANGED passwords. Existing accounts keep working regardless of their own password's
// length (never re-validated at login) — this is a floor on what a writer can SET from here on, not a retroactive one.
export const MIN_PASSWORD_LENGTH = 8;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}
