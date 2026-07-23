# TU5 — the Tutor's Memory (the Book's Bible) · brief · 2026-07-23

**Place at:** `docs/wrizo-alpha/tu5-tutors-memory-brief.md`.
**Branch:** `tu5-tutors-memory`, its own worktree — one checkout per
agent, no exceptions.
**Authority:** the Listener-day queue (TU5 confirmed over TU4 as THE
pre-vacation Tutor ticket); TU2 review ruling 3 ("the Tutor has ears as
of TU2; memory of the book is TU5's charter"); A12–A15 and the T4
composition line, ratified.
**SCHEMA TICKET — NO merge pre-authorization.** Nick's explicit word at
merge, which in the same breath ratifies (a) the disclosure v3 string
verbatim and (b) the two prompt paragraphs in S5. Deploy is his separate
word. **Sequencing gates:** build starts only after E1.1 merges (the A1
ruling file on disk — the standing gate) and E1.1's post-merge review
lands. **The Aug 1 freeze is named honestly:** TU5 merges before it or
waits for post-vacation; if E1.1 slips past ~July 29, Nick calls it.

## The five layers, restated for the disk

The Listener day tentatively ratified the Tutor's five-layer memory
architecture; its text has no disk home this brief can find, so this
restatement is canonical upon Nick's schema word: **L1** the
constitution (the system prompt's rails — shipped, TU1); **L2** the ears
(the page delta, wire-only, ephemeral — shipped, TU2); **L3** the page
thread (persisted conversation + cursor — shipped, TU1/TU2); **L4** the
book's Bible (durable, writer-owned facts of the project — THIS
ticket); **L5** the writer's profile (how they like to be tutored —
deferred, a future ticket). TU5 is L4 alone. The bible is the BOOK's
memory: it lives on the project, so loose and journal pages keep ears
and thread only, and their Tutor shows no Bible section — quiet absence,
not a disabled door.

## Three decisive calls (Fable's, vetoable at the schema word)

1. **Per-project, one column.** The bible rides `projects` as one
   additive nullable jsonb — never a new table (a table is a whole new
   synced collection; the BM1 charter's own reasoning).
2. **Writer-authored only. The Tutor cannot write to the bible — not
   even by proposal.** No parse-the-reply-into-cards flow, no confirm
   button wired to model output: structured model output becoming app
   state is a cousin of the affordance A13 forbids, and the thesis cuts
   the same way — the writer does the work, even the remembering. The
   prompt may tell the Tutor to *suggest in plain words* that the writer
   note something; the hands stay the writer's.
3. **No Voice Wall on the bible input — a reasoned exclusion, not an
   oversight.** The wall guards writing surfaces; the bible is desk
   furniture, and A13 already seals the only dangerous direction (no
   path from the Tutor's room into the page, bible included, ever).

## S0 — records first, and one act of disk-first repair

Open the ledger item. Then: the Listener-day rules 1–36/37 living
document — search the tree and recent transcripts for its text. If it
is not on disk (expected), commit the shipped `SYSTEM_PROMPT` verbatim
as `docs/wrizo-alpha/tutor-rules.md`, headed with its tentative-
ratification status and named as the living document's disk home from
now on. TU5's S5 paragraphs amend that file and the code together —
prompt and record never diverge again.

## S1 — the schema (the whole reason for the merge gate)

`alter table projects add column if not exists tutor jsonb` — additive,
idempotent, no backfill, the exact `origin`/`journal_entries.tutor`
recipe. Both project mappers: `rowToProject` gains
`tutor: r.tutor ?? undefined` (SQL null → JS undefined, never a literal);
`upsertProjects` extends 14 → **15 columns, `$15::jsonb`, 15 params**
positionally aligned, param `JSON.stringify(p.tutor ?? null)`, the
on-conflict set gains `tutor = excluded.tutor`, the last-write-wins
guard untouched. The pull is `select *` (verified), so down-sync rides
free. **Placeholder count 15/15/15 — Fable hand-verifies at review, per
the house rule.** Grandfather fixed point: a project never touched by
the bible is byte-identical in every path; absent, never null.

Shape inside the column: `{ v: 1, facts: Fact[] }` where `Fact` is
`{ id, text, source: 'writer', createdAt, updatedAt }` — `source` is an
enum of one today so L5-era provenance never needs a migration. Per-fact
text cap 300 chars: a fact is a line, not a page.

## S2 — the client store (`store/tutorBible.ts`)

Read/add/edit/delete facts on the project record, local-first (offline
edits persist and sync on return). **The fixed point, structural:**
mirroring `advanceTutorCursor`, every function refuses to conjure —
opening the Tutor on a project page creates nothing; only the writer's
explicit first add births `project.tutor`. Delete is real removal from
the jsonb, synced by ordinary last-write-wins. Inspection seam
`wrizoBible`, the house convention.

## S3 — the Bible section (UI)

Inside the existing Tutor panel's sections cluster (below the
conversation, per FX10's center-of-gravity order), only when the page
has a `projectId`: the fact list, a plain add input, edit and delete on
each fact. Every string through `deskLexicon`. Quiet olive; nothing
brass at rest; no counts anywhere (the FX9 law travels). Geometry proven
at 1100/1280/2200; the no-scroll-within-scroll walk re-run with a
seeded-bible fixture — the panel stays the one scroller.

## S4 — the wire (the delta's recipe, exactly)

The body grows to **exactly three optional-topped fields and nothing
else:** `{ messages, delta?, bible? }`. The bible is assembled at send
time only (never ambiently), as the facts joined into one delimited
block; **absent when the project has no facts** — a true absent key,
never an empty string. Two-tier caps, the delta's pattern: client 8,000
chars with an honest truncation header line; server backstop 9,000 in
`isValidBody`, mirroring the delta branch. Server-side it splices as ONE
synthetic wire-only user turn, `<book-bible>…</book-bible>`, placed
BEFORE the delta splice (stable context ahead of fresh context, both
ahead of the writer's latest word). **The persisted role union stays
`writer | tutor` — the bible turn exists only in the outbound wire
mapping, exactly the `<page-since-last-read>` discipline, and never
enters the persisted thread.**

## S5 — the prompt, amended for mechanical truth (Nick ratifies verbatim)

Two clearly demarcated paragraphs join `SYSTEM_PROMPT` (the living
document's style — no fabricated numbering), and one bullet is repaired:

1. **Bible conduct:** "A writer's send may carry their book's Bible —
   short facts they chose to save. The Bible is context, not an
   assignment: use it to stay consistent with the writer's own
   decisions; never volunteer critique of it; never treat a fact as an
   invitation to compose. You may suggest, in plain words, that the
   writer note something in their Bible; you cannot write to it — the
   Bible is theirs alone."
2. **The truth repair:** the current fifth bullet ("You only know what
   the writer tells you in this conversation — never claim to have read
   their page") predates the ears and now the memory; it becomes: "You
   know only what the writer gives you: this conversation, the page
   block when it rides, and the book's Bible when it rides. Never claim
   knowledge beyond those." A prompt that misdescribes the system is a
   quiet lie; this ticket may not ship over one.

## S6 — disclosure v3 (the hard gate that stays hard)

The mechanism exists (integer compare; v3 "falls out for free" — TU2
review ruling 4). This ticket ships it: `CURRENT_DISCLOSURE_VERSION = 3`,
v2's string kept as legible history, v3 shown exactly once including on
seeded v2-legacy devices (the v2 harness pattern re-run for v3).
**Proposed v3 string, mechanically true whether the bible is empty or
full — Nick ratifies or rewrites verbatim at the schema word:** "What
you ask the Tutor, the page it reads when you send, and any facts you've
saved in this book's Bible travel to a language model; your pages stay
yours, and the Bible is yours to edit or empty."

## S7 — the harness (`tu5.mjs`)

Client-side CDP, both `HARNESS_PARKED` settings, full historic suite
green, and — per the ratified law — **the long-suite verdict runs in the
main loop, synchronously, verdict as the final message.** Checks, at
minimum: the fixed point (open conjures nothing; add births); edit and
delete real and persisted; per-fact cap; offline add → relaunch →
present → sync clean; **wire assembly under fetch interception** (bible
present only when facts exist; absent key when empty; ≤ client cap;
delimiters exact; persisted thread byte-free of any bible turn; roles
still `writer | tutor`); loose page shows no Bible section; disclosure
v3 exactly once + the seeded-legacy proof; the A13 sweep extended over
the Bible UI (the forbidden-keyword walk, and structurally: no control
in the section can place text on a page); A14 (nothing ambient — adding
the tenth fact raises no badge, toast, or count); geometry at all three
widths + the descendant overflow walk; every string through the lexicon.

## Non-goals

L5 (writer profile); any propose/confirm structured flow; the
project-level Tutor room; TU3 (spend ledger), TU4 (mechanics lens —
still gated on Nick's unanswered inline-vs-margin word), TU6 (BYO keys);
model-written nudges; cross-project memory; any bible→page affordance,
ever — that one is not deferred, it is forbidden (A13).

## Invariants

Server surface touched is exactly `tutor.ts` (+ `migrate.ts`, `sync.ts`
for S1) — census enumerated at review; rate limit, `maxRetries: 0`, the
`configured:false` shape, and the usage/model echo untouched; zero new
deps; key presence-never-value at deploy (standing practice;
`TUTOR_BASE_URL`/`TUTOR_MODEL` stay unset on Railway — code defaults are
truth); `tsc` ×2; `build:web`; report = push.

## Definition of done

On any page of his book, the Tutor remembers what Nick told it to
remember — names, spellings, decisions — across every conversation,
because he wrote it down and nowhere else. A project he never opened the
Bible on is byte-identical to yesterday. The disclosure says exactly
what travels, and it's true. And on August 4th, the mentor's chair
beside his draft has a memory, and still cannot hold a pen.

— Fable, from the ratified record, for CC to build on the gates above
