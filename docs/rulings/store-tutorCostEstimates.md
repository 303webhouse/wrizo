# Rulings: `apps/desktop/src/store/tutorCostEstimates.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[tutorCostEstimates §n]` points here.

## tutorCostEstimates §1

From `apps/desktop/src/store/tutorCostEstimates.ts`, line 1 at `7f1c6a84` (the comment that stays: "a static per-model cost-ESTIMATE table, no live pricing; every figure is labelled "est."; a model absent here is the unknown provider (tokens only)").

```ts
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
```

## tutorCostEstimates §2

From `apps/desktop/src/store/tutorCostEstimates.ts`, line 39 at `7f1c6a84` (the comment that stays: "every rate below is an unverified placeholder").

```ts
// Source-date: 2026-07-21 (TU2 build date). Verification attempted, NOT
// achieved (live web search unavailable this session — see header
// comment). Treat every rate below as an unverified placeholder.
```
