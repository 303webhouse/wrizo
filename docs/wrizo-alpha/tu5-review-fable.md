# TU5 — the Tutor's Memory (the Book's Bible) · Fable's pre-merge schema review · 2026-07-24

**Ticket:** TU5 (item 56), schema. Branch `tu5-bible` @ `ba364b8`, eight
single-author slices off `309ab78`, unmerged — this review is the gate
before Nick's explicit word, per the house rule for schema tickets.
**Method:** branch trail verified against the report (eight slices, one
author, guard-railed). Line-by-line full-patch reads: S1 schema
(`0c1f5d7`), S4 wire (`2cc74c9`), S5 prompt (`f353355`), S6 disclosure
(`b732e15`), S2 store (`d9d115a`), and S7's four cross-file park-sweep
edits. Taken at record + cross-verified depth, disclosed: S0 (its
content is proven transitively — S5's diff shows `tutor-rules.md`'s body
byte-identical to the shipped constant, both sides read by me), S3's UI
(its governing laws are harness-proven and its only write paths are the
store functions I read whole), and `tu5.mjs`'s 645 lines (enumeration
depth; every product claim it tests was independently verified in the
product diffs above).

## Verdict: GREEN. The schema is hand-verified, the three ratification texts are in place verbatim, and the immutability law was honored across a four-file park sweep. Ready for Nick's word.

## THE SCHEMA — verified whole, by my own hand

**15/15/15 confirmed:** the insert column list is fifteen ending
`tutor`; placeholders `$1`–`$15` with the single `::jsonb` cast on
`$15`; params fifteen, positionally aligned, ending
`JSON.stringify(p.tutor ?? null)`. On-conflict set gains
`tutor = excluded.tutor`; the last-write-wins guard is untouched.
`rowToProject` gains `tutor: r.tutor ?? undefined`; the pull remains
`select *` (verified previously in the live file), so down-sync rides
free. Migration: one additive, idempotent, nullable jsonb column — the
`journal_entries.tutor` recipe project-side, no default, no backfill.
**The grandfather fixed point holds in both directions:** absent →
`null` → absent; a project never touched by the bible is byte-identical
through every path, and the type charter itself forbids the empty-object
form. The Fact shape's `source` enum-of-one future-proofs L5 provenance
without a migration.

## THE FOUR RAILS — each verified structural, not asserted

**Writer-authored only.** The store's write functions are called from
exactly one place: the Bible section's own handlers. The send path reads
(`getBibleFacts`) and never writes. No parse-model-output path exists
anywhere in the diff set — the A13-cousin is closed by architecture.

**The conjure-refusal fixed point.** `addFact` is the only birth site
(spread-of-undefined birth, the `appendTutorMessage` pattern);
`editFact`/`deleteFact` refuse on a bible-less project (the
`advanceTutorCursor` refusal); reads return `?? []`. Two details worth
naming as craft: an emptied edit is not a delete (delete stays its own
explicit act), and a no-op delete performs no save — so LWW timestamps
never bump on a meaningless write.

**The wire discipline.** The body is exactly
`{ messages, delta?, bible? }`; `bible` validates on the delta's own
terms (true absent key, never empty string, 9000 server backstop over
the 8000 client cap with an honest truncation header, whole facts only);
it splices as ONE wire-only `<book-bible>` user turn placed before the
delta — final order `[history, bible, delta, writer's latest]`, stable
before fresh, both before the writer's word. The persisted role union is
untouched structurally: persistence isn't in the wire diff at all.

**Assembly at send time only.** The bible is read fresh inside the send
handler, gated on `entry.projectId` — a loose page's wire is byte-free
of any bible key, and nothing assembles ambiently.

## THE PARK SWEEP — the immutability law at its best behavior

The S6 version bump was the one deliberate falsifier, and the sweep
handled it in three correctly-distinguished modes: **fixture
maintenance** (the `skipDisclosure` seed `'2'`→`'3'` in four harnesses —
setup lines, not assertions, maintaining the helper's own stated
contract, per the TU2 precedent); **live-check re-assertion in place**
(lawful — live checks are construction); and **four genuine A4 parks**
(tu1's v2-key check, tu2's three v2-wording/version checks), each quoted
verbatim — verified by direct comparison against the deleted lines in
the same diff — with the superseding authority named and owning live
successors in `tu5.mjs`. tu1's entry is now a two-generation chain
(TU2 cycle → TU5 cycle) that reads end to end like cd1's: history
layered, never rewritten. Suite state as reported: tu1 95/3, tu2 96/9,
fx10 119, m2 54, `tu5.mjs` PASS 91 both settings, full historic suite
green.

## ADVISORIES — non-blocking, none touch the merge

1. tu2's surviving fresh-device check still carries "Disclosure v2:" in
   its label while asserting a version-agnostic truth (the key is null).
   A stale label on a live check — rename on next touch.
2. `addFact` re-stamps `{ v: 1, ... }` while `editFact` spreads the
   existing bible — no live effect (v is literally type `1`); harmonize
   on next touch.
3. **Owed after deploy, on the checklist by name:** the server's own
   `<book-bible>` splice needs one production round-trip proof — the
   client harness captures the client body only, exactly the TU2
   server-route precedent. One curl-level check post-deploy.
4. `tu5.mjs` reviewed at enumeration depth (disclosed above) — the one
   artifact in this sweep at that depth, mitigated by full independent
   reads of everything it tests.

## What Nick's word ratifies — the three texts, verbatim, in place on the branch

1. **The merge itself:** `tu5-bible` @ `ba364b8` → `main`, schema.
2. **Disclosure v3 (Candidate A), shipped as:** "When you ask the
   Tutor, your question — and any new writing on this page since the
   Tutor last read it, and any facts you've saved in this book's Bible —
   travels to the language model provider configured for this app.
   Nothing is ever sent unless you ask. Your pages remain yours."
3. **The prompt's Bible-conduct paragraph:** "A writer's send may carry
   their book's Bible — short facts they chose to save. The Bible is
   context, not an assignment: use it to stay consistent with the
   writer's own decisions; never volunteer critique of it; never treat a
   fact as an invitation to compose. You may suggest, in plain words,
   that the writer note something in their Bible; you cannot write to it
   — the Bible is theirs alone." **And the repaired fifth bullet:** "You
   know only what the writer gives you: this conversation, the page
   block when it rides, and the book's Bible when it rides. Never claim
   knowledge beyond those."

## Close condition

Nick's schema word (covering the three above) → merge → deploy on his
separate word → the post-deploy round-trip check (advisory 3) → his
device eye on the Bible section at the sitting. Then item 56 closes.

— Fable
