import dotenv from 'dotenv';
import { resolve } from 'path';

// Load apps/server/.env by explicit path so it works no matter the cwd
// (Railway runs `node apps/server/dist/index.js` from the repo root). On
// Railway there is no .env file and real env vars are injected — this is a
// harmless no-op there.
dotenv.config({ path: resolve(__dirname, '..', '.env') });

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var ${name} (see apps/server/.env.example)`);
  }
  return value;
}

export const env = {
  databaseUrl: required('DATABASE_URL'),
  sessionSecret: required('SESSION_SECRET'),
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  get isProd() {
    return this.nodeEnv === 'production';
  },
  // TU1 S5 — the Tutor's model plumbing. Deliberately NOT `required()`:
  // "offline or unconfigured" is a first-class, expected state (the brief's
  // own words) — an unset key must never crash boot, only make the /api/
  // tutor/chat route respond with the quiet "not configured" state the
  // client already renders as one line, same register as a real offline
  // failure. Model/max-tokens are configurable but always default to a
  // known value, so a deploy that sets only TUTOR_API_KEY still works.
  tutorApiKey: process.env.TUTOR_API_KEY || null,
  tutorModel: process.env.TUTOR_MODEL || 'claude-opus-4-8',
  // Hard per-request token cap (the brief's own "hard per-request token
  // cap, no retry loops" requirement) — small on purpose: the Tutor's
  // register is a question or a short observation, never a composed
  // passage (A13), so it never needs a long response.
  tutorMaxTokens: Number(process.env.TUTOR_MAX_TOKENS) || 512,
};
