// a static per-model cost-ESTIMATE table, no live pricing; every figure is labelled "est."; a model absent here is the unknown provider (tokens only) [tutorCostEstimates §1]
export interface TutorCostRate {
  /** USD per 1,000,000 input tokens. Placeholder unless noted otherwise below. */
  inputPerMillion: number;
  /** USD per 1,000,000 output tokens. Placeholder unless noted otherwise below. */
  outputPerMillion: number;
}

// every rate below is an unverified placeholder [tutorCostEstimates §2]
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
