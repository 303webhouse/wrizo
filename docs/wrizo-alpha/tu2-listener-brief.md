# TU2 — the Listener · build brief · 2026-07-21

**Place at:** `docs/wrizo-alpha/tu2-listener-brief.md`.
**Branch:** `tu2-listener` off `main`, own worktree per ONE CHECKOUT PER
AGENT.
**Authority:** the Tutor committee pass as ratified (A12–A15 whole), the
Tutor's second sitting of 2026-07-21 (Nick's six additions reviewed and
shaped; sequence ruled TU2→TU6), and Nick's go on this brief. **ZERO
MIGRATION — merge pre-authorized as zero-migration per the AB4
precedent**, with the server census locked below; any server file beyond
the enumeration is STOP-and-report. Report = push; Fable reviews
post-push; deploy is Nick's separate word with the manifest enumerated
as always.

## S0 — records first
Ledger: open TU2's item (this brief; the second sitting's sequence
ruling recorded — TU3 Ledger, TU4 Mechanics+cards, TU5 Memory pending
Nick's wording review, TU6 Accounts; the memory-rules wording review
recorded as an OPEN ratification item, not assumed). Commit this brief.

## S1 — the seat (provider-agnostic config; DeepSeek V4 Flash default)
The route keeps its Anthropic-format body. Config moves wholly to env:
`TUTOR_BASE_URL` (default `https://api.deepseek.com/anthropic`),
`TUTOR_MODEL` (default: DeepSeek V4 Flash's EXPLICIT current model id —
**verify against api-docs.deepseek.com at build; never the legacy
aliases `deepseek-chat`/`deepseek-reasoner`, which retire
2026-07-24**), `TUTOR_API_KEY` (unchanged), `TUTOR_MAX_TOKENS` (default
700). The SDK client takes the base URL override; no other route logic
changes. `.env.example` updated with all four and one comment line
noting any Anthropic-compatible endpoint slots in the same way (the
Accounts ticket's seam, pre-cut). **Server census, exact and closed:
`env.ts`, `tutor.ts`, `.env.example`. Nothing else. No migration
anywhere.** Fallback behavior unchanged: unconfigured or offline
degrades to TU1's proven one quiet line.

## S2 — the listener (delta reads on a persisted cursor)
Amend `TutorThread` (client types + header comment carrying this
paragraph): the `tutor` jsonb may now also carry
`lastRead?: { at: string; chars: number }` — **a charter amendment to
TU1 S1's "nothing else is ever persisted," made on Nick's word at this
brief's ratification.** Behavior, exactly:
- On every writer-initiated send, the request context includes the
  page's text from `lastRead.chars` to end ("the delta"), clearly
  delimited as context, preceding the writer's message.
- **Cap ~4k tokens.** Over cap: keep the tail (most recent writing) and
  include one honest line in the delta block's own header ("latest
  stretch only; earlier additions unread"). The panel shows the same
  honesty in its own quiet copy when truncation occurred.
- No new writing since cursor: no delta block at all, and no performed
  acknowledgment of absence.
- Cursor advances to the page's current length ONLY on a successful
  send (response received). Failed calls advance nothing.
- Grandfather: absent `lastRead` on a page with existing text means the
  first query reads from the start (cap applies). A never-queried page
  persists no cursor and remains byte-identical to today through every
  load/edit/save path — the null⇔undefined fixed point holds exactly as
  TU1 proved it.
- Cursor persists across reload/restart (the ruled interpretation:
  stronger than session-scoped, same spend). Current-page delta ONLY —
  cross-page deltas are a named non-goal (no baselines exist).
- Conduct rule 37 lands in the server-side system prompt: the delta is
  context, not an assignment — the Tutor never volunteers critique of
  newly-read writing; it answers what was asked, informed by what it
  read.

## S3 — disclosure v2 (versioned; shown once per version)
The first-open disclosure becomes versioned (local persisted flag keyed
by version, never schema). Because page text now travels, v2 wording —
Nick's ratification of this exact string is his go on this brief; any
edit he makes travels verbatim:

> "When you ask the Tutor, your question — and any new writing on this
> page since the Tutor last read it — travels to the language model
> provider configured for this app. Nothing is ever sent unless you
> ask. Your pages remain yours."

Existing users see v2 exactly once on next open; the v1 flag does not
suppress it. Every string through deskLexicon.

## S4 — the room's geometry, retrofit (the strip's grammar, mirrored)
- The grip sits FLUSH to the page's right edge (no gap), mirroring the
  tool strip's own pop-out grammar flipped rightward: reuse the strip's
  actual open/close constants, easing, and state model — measured from
  the strip's implementation, not approximated.
- Open width = exactly 2× the tool strip's width token (reference the
  token; hardcode nothing).
- **Presence on Boards:** the panel mounts on `pageKind='board'`
  surfaces (Boards are entries; the `tutor` jsonb already carries their
  threads). Lenses on a Board scope to the board's members where
  meaningful; the conversation is the same room.
- A15 unchanged whole: dissolve on first keystroke undocked; dock
  rider; Escape ladder; ~180ms; reduced-motion honored. FX2 clearance
  law holds: the paper's text measure never changes; narrow widths
  follow the CD2 overlay law. Nothing orange at rest.
- TU1's superseded geometry checks PARK per A4 — originals verbatim
  (SUPERSEDED, one-line reason, live-successor pointers) — never edited
  silently.

## S5 — the session meter (client-only; no schema)
After each model reply, one quiet line at the panel's foot: this turn's
tokens (from the provider's usage fields) + estimated cost + running
"This session" total. Fades after ~4s (reduced-motion: timed removal,
no animation). Session totals live in memory only. A static
per-provider estimate table ships client-side (a constants file with a
source-date comment; prices verified at build; **DeepSeek V4 Pro's
promo-vs-steady-state ambiguity noted in the comment**); unknown
provider → tokens shown, no invented dollar figure; every figure
labeled "est." through the lexicon. Month totals, limits, and the
connect-time prompt are the Ledger ticket's — named non-goals here.

## S6 — harness (`tu2.mjs`) + the bar
Cursor: legacy-no-cursor first read (under and over cap); cap
tail-bias + honesty line; no-delta silence; advance-only-on-success
(a failed call leaves the cursor untouched); persist-across-reload;
never-queried page byte-identical through load/edit/save (the
grandfather fixture rerun). Disclosure: v2 shows exactly once per
version including for a seeded v1-flagged user. Geometry: three widths
(1100 floor mandatory / 1280 / 2200) on page AND board surfaces —
grip-flush assertion, width = 2× strip token, paper-rect invariance
closed/open/docked; the A13 structural walk repeated on the
board-mounted panel (every control, none targets a writing surface).
Meter: renders after a stubbed reply, fades on timer, absent when no
call has been made. S1: the unconfigured quiet-degrade path re-proven
via the truthful test double against the new env shape. Park sweep:
TU1's superseded geometry checks parked per A4 with live successors —
sweep otherwise expected small. Full suite green, both `HARNESS_PARKED`
settings. `tsc` ×2, `build:web`, selftest.

## Non-goals
Memory layers, bible, Writer's Card, custom rules (TU5, gated on
Nick's wording review); month tallies / limits / connect prompt (TU3);
Mechanics lens + lesson cards (TU4); BYO keys and provider picker
(TU6); cross-page deltas; streaming; any tool use; any affordance
moving Tutor text toward a page — constitutionally out, not deferred.

## Invariants
A12–A15 verbatim. Writer-initiated calls only; no ambient reads — the
delta is assembled at send time, never before. Keys server-side only.
The disclosure's truthfulness is law: the request body carries exactly
messages + the delimited delta, nothing else — re-verify at both ends
as TU1's review did. One vanishing engine; olive/orange lanes;
anti-solicitation; every string through deskLexicon.
Both-reference-widths + the 1100 floor on every geometry assert; legacy
<1100 byte-identical. Server census closed at S1's three files —
anything more is STOP-and-report. Report = push.

## Definition of done
Nick, after merge and his deploy word: opens a page he's been writing
on, asks the Tutor a question, and the answer knows what he wrote an
hour ago without him pasting a word; asks again immediately and nothing
is re-read; sees one quiet cost line appear and fade; opens a Board and
finds the same room waiting flush at the edge, opening like the strip
in mirror; pulls the plug and the lenses still work; checks Railway and
finds DeepSeek answering for pennies; reads the new disclosure exactly
once. The paper never moved, and the Tutor still writes nothing.

— Fable, from the second sitting, 2026-07-21
