import type { Fact } from '../../types';

// TU2 S2 — the listener's delta assembly. No real tokenizer is available
// client-side, so the cap is a disclosed, documented character-based
// approximation: ~4 characters per token, the commonly-cited ballpark for
// English prose (both Anthropic's and OpenAI's own docs use figures in
// this neighborhood). 4000 tokens * 4 chars/token = 16000 chars is the
// hard ceiling on the WRITING itself; the honesty header line below rides
// on top of that, inside tutor.ts's own separate, more generous
// MAX_DELTA_CHARS wire cap (see that file's comment for the arithmetic).
const DELTA_TOKEN_CAP = 4000;
const CHARS_PER_TOKEN_APPROX = 4;
const DELTA_CHAR_CAP = DELTA_TOKEN_CAP * CHARS_PER_TOKEN_APPROX;

// ITEM 84, TD4 — the selected stretch's own cap, mirroring the delta's two-tier
// shape (client cap here, server backstop in tutor.ts). HEAD-BIASED, and that is
// the one place it deliberately differs from the delta: the delta keeps its TAIL
// because the newest writing is its whole point, while a selection's point is the
// stretch the writer started pointing at, so an over-long one keeps its OPENING.
// The header below is plain data read by the MODEL and is deliberately not a
// deskLexicon entry — its writer-facing twin is `tutorSelectionTruncated` — the
// same distinction DELTA_TRUNCATION_HEADER above already draws.
const SELECTION_CHAR_CAP = DELTA_CHAR_CAP;
const SELECTION_TRUNCATION_HEADER = 'opening of the selected stretch only; the rest was too long to travel';

// Plain data read by the MODEL as part of the delta block's own header —
// deliberately NOT a deskLexicon entry (deskLexicon is for writer-facing
// chrome; the writer never sees this exact string — see
// `tutorDeltaTruncated` in deskLexicon.ts for this same honesty's
// writer-facing twin, rendered in the panel instead).
const DELTA_TRUNCATION_HEADER = 'latest stretch only; earlier additions unread';

interface TutorDelta {
  delta: string | null;
  truncated: boolean;
}

// Writer-initiated, send-time only (never a timer, never on mount) — the
// ONE call site below (send()) is the only place this ever runs, per the
// brief's own invariant that the delta is assembled at send time, never
// before. `lastRead` absent covers BOTH grandfather cases the brief names
// as one: no thread yet (this page's very first-ever Tutor message) and a
// thread that predates TU2 (no cursor was ever persisted onto it) — both
// read the WHOLE page from the start, cap still applies, same code path
// either way. No new writing since the cursor (`newText` empty) returns
// `delta: null` — the caller sends no delta field at all and renders no
// "nothing new" UI, true silence per the brief's own words.
export function assembleTutorDelta(pageText: string, lastRead: { at: string; chars: number } | undefined): TutorDelta {
  const newText = lastRead ? pageText.slice(lastRead.chars) : pageText;
  if (newText.length === 0) return { delta: null, truncated: false };
  const truncated = newText.length > DELTA_CHAR_CAP;
  const kept = truncated ? newText.slice(newText.length - DELTA_CHAR_CAP) : newText; // tail bias: keep the most recent writing
  const delta = truncated ? `[${DELTA_TRUNCATION_HEADER}]\n${kept}` : kept;
  return { delta, truncated };
}

// ITEM 84, TD4 — the stretch, capped. Pure and synchronous, called once at PRESS
// time and never again: what travels is frozen the moment the writer pressed the
// button that names it, which is also why this takes the stretch as an argument
// rather than reading any live selection of its own.
export function capSelection(stretch: string): { text: string; truncated: boolean; wordsSent: number } {
  if (stretch.length <= SELECTION_CHAR_CAP) return { text: stretch, truncated: false, wordsSent: 0 };
  const kept = stretch.slice(0, SELECTION_CHAR_CAP);
  // the count is of the slice actually sent, never the whole stretch [Tutor §6]
  const wordsSent = kept.trim().split(/\s+/).filter(Boolean).length;
  return { text: `[${SELECTION_TRUNCATION_HEADER}]\n${kept}`, truncated: true, wordsSent };
}

// TU5 S4 — the book's Bible's own send-time assembly, mirroring the delta's
// two-tier cap. The writer's saved facts (of THIS page's project) are joined
// into ONE block — a fact is a line — assembled ONLY here, at send time, never
// ambiently. Returns null (a true absent key, never an empty string) when the
// project has no facts. Client cap 8000 chars of CONTENT (server backstop 9000,
// tutor.ts's MAX_BIBLE_CHARS), with an honest truncation header line prepended
// when some facts don't fit; whole facts only — never a fact sliced mid-line
// (except the pathological case of a single fact somehow over the cap, which
// the 300-char per-fact store cap makes unreachable in practice).
const BIBLE_CHAR_CAP = 8000;
const BIBLE_TRUNCATION_HEADER = 'partial: some saved facts were not included this time';

export function assembleBible(facts: Fact[]): string | null {
  if (facts.length === 0) return null;
  let body = '';
  let truncated = false;
  for (const f of facts) {
    const next = body ? `${body}\n${f.text}` : f.text;
    if (next.length > BIBLE_CHAR_CAP) { truncated = true; break; }
    body = next;
  }
  if (!body) { body = facts[0].text.slice(0, BIBLE_CHAR_CAP); truncated = true; }
  return truncated ? `[${BIBLE_TRUNCATION_HEADER}]\n${body}` : body;
}
