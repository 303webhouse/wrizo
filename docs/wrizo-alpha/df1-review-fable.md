# DF1 — the Deflake Pass · Fable's post-merge review · 2026-07-25

**Ticket:** DF1 (item 48), harness-only. Built by chat 3 (DoD:
234/234, log read to completion in the main loop), merged `c566875` as
the P0 wave's named rider; no deploy consequence of its own.
**Method:** the entire merge read — four files, 402+/40−, zero product
code, including all 191 lines of the audit checker and both recorder
conversions in `fx5.mjs`.

## Verdict: GREEN, with the law's first field test folded in honestly. After DF1, red means wrong — and the one red that arrived on day one is ruled below as the law demands, not waved away.

## VERIFIED

**S1 — fx5 fixed at the frame clock.** Both flaky sites converted from
wall-clock samplers to in-page scroll-event recorders — the max delta
between consecutive scroll EVENTS on the browser's own frame clock,
immune by construction to how slowly a contended harness polls.
Assertions unchanged in strength and actually strengthened: the new
`moved` guards make a vacuous zero-step pass impossible. The
commentary honestly cites the old sampler's own confession (its
pre-loosened 2.5-line ceiling) as evidence the straddle was known.

**S3 — the e1 anchors hardened parser-side only.** The split now
matches the exporter's own marker-BLOCK grammar and counts headers
structurally per separator-delimited block; the bare anchors survive
as cross-checks on the non-hostile corpus. The hostile fixture proves
three things in order: NECESSITY (the bare substring occurs in the
writer's body BEFORE the real marker — the old split would have
mis-cut this exact export), unconfusion (1 live / 1 trashed, boundary
right), and format-unchanged (the writer's hostile bytes ride
verbatim). Plus a deterministic download wait replacing a fixed sleep
— S1's discipline applied to the ticket's own new code.

**S4 — the audit, with its limits stated plainly.** 122 records traced
to verbatim git lineage; the method-limits section says exactly what
`-S` proves (non-fabrication, real lineage) and what it cannot
(isolate a mutation inside a park sweep, or a note-only edit), and
compensates by hand — including the targeted corroboration that
SHARPENS the B1 history: B1's bump rewrote the supersession NOTE, not
the quoted original. The original ruling and remediation stand; the
record is now more precise than it was.

**S2 — the clearances, and their field test.** th2/j4/m2/w2 CLEARED
on ×5-under-contention plus the six-pass DoD, with the environment
villain (leaked headless browsers) named and cured by inter-pass
cleanup.

## THE FIELD TEST — tu2, RULED

The first post-DF1 full suite ran red on tu2 (1/96) and was answered
with an isolation re-run — the retired crutch. Per the law DF1 itself
wrote: **tu2's CLEARED verdict is RESCINDED on first-contact
evidence.** tu2 returns to the known-flake list as the one named
exception; **DF1.1** root-causes it with the S1 recorder discipline.
The lesson, recorded as standing practice: **clearance evidence must
scale to a flake's observed rarity** — ×5 plus one DoD does not clear
a ~1% flake, and the known-flake list shrinks only on evidence
proportioned to what it clears. The crutch stays retired for
everything else, effective now.

## ADVISORIES — non-blocking, both DF1.1's

1. **The checker's exit code cries wolf on its own four hand-ruled
   edges** (two comment false-positives, one nested-escape record, one
   generation-2 framing). Teach the keyer the lawful framings and skip
   comment occurrences — or allowlist the hand-ruled set — so a clean
   audited state exits 0. A tool that reds on known-benign carries the
   disease this ticket cured elsewhere.
2. **Comment-form park records are invisible to the tracer** (it
   extracts `pok()` calls only) — and FX14 has just parked ~30
   originals in that form. Teach the audit the comment convention, or
   migrate comment-form records to pok-form at next touch; either way
   the audit's coverage statement stays honest.

## Close condition

Merged, riding the P0 deploy as a named zero-consequence rider. DF1.1
opened for tu2 + the two advisories; item 48 closes when it lands.

— Fable
