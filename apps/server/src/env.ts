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
  // TU2 S1 — the seat is provider-agnostic: the route keeps its
  // Anthropic-format body, but the base URL is now configurable, so any
  // Anthropic-compatible endpoint (this ticket's own DeepSeek default, or
  // a future writer-supplied endpoint per the TU6 Accounts seam below)
  // slots in without a route change. Default is DeepSeek's own
  // Anthropic-compatible surface.
  tutorBaseUrl: process.env.TUTOR_BASE_URL || 'https://api.deepseek.com/anthropic',
  // VERIFICATION STATUS — honestly, not verified: this build attempted a
  // live check against api-docs.deepseek.com at TU2 build time (2026-07-21)
  // and the web-search tool returned only server errors ("529 Overloaded" —
  // same outage recorded in tutorCostEstimates.ts's header). This id is
  // carried over from pre-cutoff knowledge as the plausible current name
  // for DeepSeek's V4 Flash model — NOT confirmed against a live source
  // this session. Re-verify against api-docs.deepseek.com before deploy.
  // Never the legacy `deepseek-chat`/`deepseek-reasoner` aliases — both
  // retire 2026-07-24 and must never be a shipped default again.
  tutorModel: process.env.TUTOR_MODEL || 'deepseek-v4-flash',
  // Hard per-request token cap (the brief's own "hard per-request token
  // cap, no retry loops" requirement) — small on purpose: the Tutor's
  // register is a question or a short observation, never a composed
  // passage (A13), so it never needs a long response. Raised from TU1's
  // 512 to 700 at TU2 S1 to give the new provider/model pairing a little
  // more headroom; still deliberately short.
  tutorMaxTokens: Number(process.env.TUTOR_MAX_TOKENS) || 700,
};
