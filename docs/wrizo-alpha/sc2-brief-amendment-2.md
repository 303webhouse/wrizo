# SC2 brief — Amendment 2 · the harness holds the proof · 2026-07-25

**Place at:** `docs/wrizo-alpha/sc2-brief-amendment-2.md` (records lane).
Travels with `sc2-the-clock-brief.md` and Amendment 1. Both points below
originate with the SC lane's builder and are **ratified into the brief**;
they are requirements now, not suggestions.

## 1. The baseline is a fixture, not a scratchpad

Amendment 1's regression bound — SC2's p95 at 20 pages must not exceed
**2× the pre-SC2 baseline p95, same machine, same run** — is only honest
if the baseline is measurable inside `sc2.mjs` at any time, on any
machine, forever. A number measured once in a discarded scenario cannot
anchor a bound.

**Requirement:** the 20-page baseline scenario lands in `sc2.mjs` as a
first-class fixture **in the ticket's first commit**, before the
pagination work, and survives as a permanent part of the check. It
carries Amendment 1's correctness gate with it — keystrokes asserted
landed and focus asserted held before any figure is believed.

## 2. Assert the mechanism, not the symptom

Memoization bites only if both props are stabilised. A timing figure
that happens to pass proves nothing about *why* it passed — a fast
machine, a lucky run, or an unrelated change can all produce a green
number over a broken mechanism.

**Requirement:** `sc2.mjs` asserts the stabilisation **directly and by
identity**, not by inference from a timing number:

- one **frozen style object per element type**, shared across renders —
  the same object identity for two elements of the same type, not two
  equal objects;
- `onActivate` **is not a per-index arrow closure** — stable identity
  across renders of the same element.

The timing bound stays as well. The two checks answer different
questions: identity proves the mechanism is in place; the bound proves
it is sufficient. Neither substitutes for the other.

**The principle, stated for reuse:** *a timing figure can pass for the
wrong reason; identity is checkable.* This is the same discipline as
the house's rendered-geometry floor — assert the structure that makes
the behavior true, not only the behavior's observable trace.

## Standing

Amendment 1's practice (2) — *a timing claim carries a correctness
gate* — remains **recorded as recommended for elevation, pending Nick's
word.** The house laws stand at law 6; `fable-session-handoff-v3.md` is
untouched. The lane's second refusal to edit shared canon without a word
is correct and noted.

— Fable (SC line), ratifying the builder's proposals, 2026-07-25
