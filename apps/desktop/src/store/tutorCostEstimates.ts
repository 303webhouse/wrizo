// TU2 S5 — the session meter's static, per-model cost-ESTIMATE table. This
// is deliberately a plain data file, not a live pricing lookup: no network
// call, no server round-trip beyond the one usage/model fields tutor.ts
// already returns on a successful reply (see that file's own S2/S5 header
// comments). Every dollar figure this table produces is an ESTIMATE, never
// a bill — see Tutor.tsx's own composition of the meter line, which labels
// every figure derived from this table "est." through deskLexicon, per the
// brief's own explicit requirement.
//
// Keyed by the model id exactly as it travels on the wire (`env.tutorModel`
// server-side, threaded back on the chat response's own `model` field —
// TU2 S5's one incidental tutor.ts touch, see that file's header comment
// for why: without SOME way to know which model produced a given turn's
// usage, "unknown provider -> tokens only" below would have nothing to key
// off of and could never actually fire). A model id absent from this map
// is the "unknown provider" case the brief itself names: Tutor.tsx must
// show the raw token counts only and never fabricate a dollar figure.
//
// VERIFICATION STATUS — read before trusting any number below, honestly:
// this build attempted a live web search for current DeepSeek pricing
// (2026-07-21) and the search tool returned only server errors (repeated
// "529 Overloaded" — see this ticket's own build log/report). NOTHING
// below was confirmed against a live pricing page this session. Every
// figure is a PLACEHOLDER, carried over from general pre-cutoff knowledge
// of DeepSeek's historical pricing order of magnitude (their prior
// deepseek-chat model billed well under $1/M input tokens and low
// single-digit $/M output tokens) — plausible, NOT verified. Re-verify
// against api-docs.deepseek.com (or DeepSeek's own pricing page) before
// treating the dollar figures this table produces as anything more than
// a rough, disclosed guess. Source-date comment below records exactly
// that: "attempted, unverified" — not "verified."
export interface TutorCostRate {
  /** USD per 1,000,000 input tokens. Placeholder unless noted otherwise below. */
  inputPerMillion: number;
  /** USD per 1,000,000 output tokens. Placeholder unless noted otherwise below. */
  outputPerMillion: number;
}

// Source-date: 2026-07-21 (TU2 build date). Verification attempted, NOT
// achieved (live web search unavailable this session — see header
// comment). Treat every rate below as an unverified placeholder.
export const TUTOR_COST_ESTIMATES: Record<string, TutorCostRate> = {
  // This ticket's own shipped default (env.ts's `tutorModel` fallback).
  // PLACEHOLDER — not independently verified this build; see header.
  'deepseek-v4-flash': { inputPerMillion: 0.27, outputPerMillion: 1.10 },

  // 'deepseek-v4-pro' is DELIBERATELY ABSENT. The brief itself names this
  // model's promo-vs-steady-state pricing as ambiguous, and this build
  // could not confirm a firm, current, NON-promotional figure (the web
  // search attempt above failed outright, so even a promotional number
  // was never in hand to reject). Entering a confident-looking number
  // here would be exactly the "invented dollar figure" the brief's own
  // S5 language forbids for an unknown/unverifiable model. This ticket's
  // own default model is deepseek-v4-flash, not pro, so leaving pro out
  // blocks nothing this build needs to ship — it is a forward-looking
  // gap for whoever later confirms pro's steady-state price to fill in.
};

/**
 * Returns this turn's estimated USD cost for a known model, or `null` when
 * the model has no entry above (the caller's cue to show tokens only, per
 * the brief's own "unknown provider -> tokens only, never an invented
 * dollar figure" rule).
 */
export function estimateTurnCostUSD(model: string, inputTokens: number, outputTokens: number): number | null {
  const rate = TUTOR_COST_ESTIMATES[model];
  if (!rate) return null;
  return (inputTokens / 1_000_000) * rate.inputPerMillion + (outputTokens / 1_000_000) * rate.outputPerMillion;
}

// Sub-cent turns are the common case at DeepSeek-scale pricing (the whole
// point of this ticket's own provider choice) — two decimal places alone
// would round almost every real turn down to "$0.00," which reads as
// broken, not cheap. Four decimals below one cent keeps the figure
// legible; ordinary two decimals above it match how a dollar amount is
// normally read.
export function formatEstimatedUSD(amountUSD: number): string {
  if (amountUSD <= 0) return '$0.00';
  if (amountUSD < 0.01) return `$${amountUSD.toFixed(4)}`;
  return `$${amountUSD.toFixed(2)}`;
}
