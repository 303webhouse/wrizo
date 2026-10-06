import dotenv from 'dotenv';
import { resolve } from 'path';

// Load apps/server/.env by explicit path so it works no matter the cwd
// (Railway runs `node apps/server/dist/index.js` from the repo root). On
// Railway there is no .env file and real env vars are injected — this is a
// harmless no-op there. `quiet: true` — ITEM 224, ROUND 2 — dotenv's own
// startup banner (and, on Railway's no-op path, its "could not find .env"
// notice) is not a line this server's own logs should carry on every boot.
dotenv.config({ path: resolve(__dirname, '..', '.env'), quiet: true });

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
  // VERIFICATION STATUS — verified live, orchestrating session, not the S1
  // build agent (whose own later attempt hit a tool outage — see
  // tutorCostEstimates.ts's header for that unrelated, genuine failure).
  // A live web search plus a direct fetch of api-docs.deepseek.com/
  // quick_start/pricing on 2026-07-21 (the TU2 build date) confirmed:
  // `deepseek-v4-flash` is DeepSeek's current V4 Flash model id (alongside
  // `deepseek-v4-pro`), and the legacy `deepseek-chat`/`deepseek-reasoner`
  // aliases deprecate 2026-07-24 15:59 UTC — matching this brief's own
  // claim exactly. Re-check before deploy only if DeepSeek's docs have
  // since renamed the id again; this was not a guess.
  tutorModel: process.env.TUTOR_MODEL || 'deepseek-v4-flash',
  // Hard per-request token cap (the brief's own "hard per-request token
  // cap, no retry loops" requirement) — small on purpose: the Tutor's
  // register is a question or a short observation, never a composed
  // passage (A13), so it never needs a long response. Raised from TU1's
  // 512 to 700 at TU2 S1 to give the new provider/model pairing a little
  // more headroom; still deliberately short.
  tutorMaxTokens: Number(process.env.TUTOR_MAX_TOKENS) || 700,
  // ITEM 224 — sign-up by invite code, until launch. A comma-separated list
  // of codes Nick sets in Railway (never committed — the var itself is the
  // secret, same posture as every other env-only credential in this file).
  // Deliberately NOT required(): an unset/empty var means NO codes are
  // configured, and registration fails CLOSED (auth.ts answers 503), never
  // silently open — the one way this gate could fail would be the wrong
  // direction for a security control. Compared verbatim (trimmed, no case
  // folding) — Nick's own typed format in Railway is respected exactly.
  inviteCodes: (process.env.INVITE_CODES || '').split(',').map((c) => c.trim()).filter(Boolean),
  // ITEM 224 — the Tutor's per-person daily budget, ON TOP of the existing
  // per-IP rate limit (rateLimit.ts's own 10/min on the whole route). The
  // in-memory counter itself lives in tutor.ts; this is only the threshold,
  // configurable without a redeploy of the default.
  tutorDailyBudget: Number(process.env.TUTOR_DAILY_BUDGET) || 50,
  // ITEM 224, ROUND 2 — a cap across every account combined, on top of the
  // per-person one above (tutor.ts's own consumeGlobalTutorBudget).
  tutorGlobalDailyBudget: Number(process.env.TUTOR_GLOBAL_DAILY_BUDGET) || 500,
  // ITEM 224, ROUND 2 — the kill switch. Answers the Tutor route with the
  // SAME "not configured" shape as an unset API key (never a new error
  // shape) — an operator can pull this lever from Railway's own env panel,
  // no redeploy, no code change.
  tutorDisabled: process.env.TUTOR_DISABLED === '1',
};
