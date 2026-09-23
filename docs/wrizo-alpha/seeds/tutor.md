# TUTOR — RESTART NOTE
*Written 2026-09-23 at a clean stop. Nothing running.*

---

## 1 · ROLE

**The item-84 desk — TUTOR.** A **design desk**, not a build lane: it authors design
documents and build briefs and offers them to chat 1, which merges to `main`. Its subject
is **the Tutor's panel / the right strip** — the Counsel hand — and everything mounted in
it: the mode rosters, the Find row, the checks, and the automation that shares the strip.

**It does not touch `apps/`.** Every document it writes is docs-only. Where its work needs
code, it writes a brief for a builder lane.

**Its habits, which are the reason it is trusted** — keep them:
- **Disk wins.** Never design from a summary of a founder message or a relay's paraphrase;
  read the source and quote it byte-exact. This desk has caught four of its own inexact
  quotes and three errors in relays by doing that check every time.
- **Surface, never fork.** A divergence with another lane's law is recorded and handed up,
  never resolved quietly.
- **Corrected, not rewritten.** A superseded recommendation stays on the page with its
  error named.
- **Report short.** If a payload or a file is missing, stop and say so rather than guess.

---

## 2 · WORKTREE AND BRANCH

```
worktree   C:\Users\nickh\writer-studio\.claude\item84-tutor-menus
branch     item84/tutor-menus
tip        a31af537615b3ccca8f1346281a019e41e4aa057   (2026-09-22)
state      tree CLEAN · local == remote · ZERO unmerged commits
```

**Everything this desk has written is merged to `main`.** There is nothing in flight.

⚠ **Never work in the primary checkout** (`C:\Users\nickh\writer-studio`) — it is another
lane's deploy staging area, and `railway up` ships its working directory including
untracked files. **Verify `git rev-parse --show-toplevel` before every commit**; a removed
worktree silently makes git operate on `main`.

---

## 3 · EVERY DOCUMENT, WITH ITS SHA AND STATE

All are on `main` in `docs/menus/tutor/`. **All merged; none pending.**

### Authored by this desk

| Document | SHA | State |
|---|---|---|
| `tutor-menus-census.md` | `1b5754e` | phase-1 census |
| `tutor-menus-pass1-freewrite.md` | `510e96f` | TFW1–TFW6 + errata |
| `tutor-menus-pass2-draft.md` | `510e96f` | TD1–TD7 |
| `tutor-menus-pass3-revise.md` | `c5cf2df` | TR1–TR7 |
| `tutor-menus-mockups-plateau.html` | `6f82720` | six Plateau panels |
| `tutor-menus-lock-sheet.md` | `5cd3968` | the seven questions |
| `tutor-menus-lock-record.md` | `7039480` | **§1–§10; governs final ask strings** |
| `tutor-menus-pass3b-revise-repass.md` | `1ba2728` | TRR1–TRR11 |
| `tutor-menus-revise-repass-amended.md` | `a3e1662` | **TRR12–TRR18 ratified; the error lens T1–T7** |
| `item84-revise-finding-replan.md` | `ef0d5cc` | the Revise-not-live finding |
| `tutor-menus-held-batch.md` | `ef0d5cc` | three items, all now ruled |
| `item84-draft-roster-build-brief.md` | `3580340` | build-ready; a ROSTER lane built from it |
| `item112-revise-charter.md` | `c5b3d60` | **RS1–RS7 ratified — governs Revise** |
| `item112a-build-brief.md` | `2579cba` | built and SHIPPED |
| `item112c-build-brief.md` | `81d981a` | **build-ready, unbuilt; §11 carries later rulings** |
| `item84-find-row-design.md` | `d195f7d` | **FN1–FN8 RATIFIED** |
| `item84-committees-experts-double-pass.md` | `f1f6fa2` | validated the three committees |
| `item165-preset-day-one-contents.md` | `e45517b` | **awaiting Nick's word on contents** |
| `item84-right-strip-automation.md` | `44cd0db` | proposal; §4 partly superseded (see §5 below) |
| `item84-checker-report-and-claim-tiers.md` | `3b58b27` | the checker report + tiers 1–3 |
| `item84-strip-checked-against-page-first.md` | `a31af53` | the owed check; one concession |

### Authored by build lanes (read, do not edit)

`item84-deck-phase-s0.md` `cc9c1b7` · `item84-deck-phase-build.md` `b308ddd` ·
`item84-draft-roster-s0.md` `6aa9144` · `item112a-s0.md` `af3c54f` ·
`item112a-build-record.md` `6093e35` · `item112a-offer-2026-09-05.md` `ef6d29f`

---

## 4 · WHAT THIS DESK WAITS ON

**Next work item — THE SPELLCHECK S0** (Fable, 2026-09-23). Measure the open-source
candidates: **offline, licence, size, accuracy on a fixed test text.** **Nothing quoted
from memory** — the report at `3b58b27` deliberately declined to give numbers for exactly
this reason, and that was ruled right. Candidates named there: **Hunspell** (spelling),
**LanguageTool** (grammar, rule-based), the **`retext`** family (light, but mostly *style*,
which RS7 drops). **If it needs the browser box, ask chat 1** — the box is one machine and
turns come by announcement, never by a quiet check.

**Awaiting Nick's word:**
- preset **day-one contents** (`e45517b`)
- the **right-strip automation proposal** (`44cd0db`)
- **FN5's placeholder** — lean recorded and now ruled: keep the shipped `Ask a question…`

**Blocked on PLAN DESK's Record primitive:** claim-check **tier 1**, the **Bibliography**
preset, and **continuity against records**. Nothing to point at until records exist.

**Owed to item 83's lane, and this branch cannot discharge it:** **DR7's narrowing** in the
exact words both lanes must carry — *"Nothing arrives unbidden — PROSE-WIDE, binding every
prose mode, EXCEPT REVISE, by Nick's word."* Needs Fable's relay to the menu lane.

**Open divergence, surfaced not resolved:** **RV3** — item 83's law says the custom-font
door *"renders no row and is never offered,"* while Nick's ruling describes *"the option
for users to add their own system fonts,"* which reads as a rendered row. 83's law, so
83's and Nick's to settle. Recorded in `item112c-build-brief.md` §11.

**Routed out of this lane:** the **SYSTEM_PROMPT amendment** — its source of truth is
`apps/server/src/tutor.ts`, and `docs/wrizo-alpha/tutor-rules.md` is its byte-verbatim
**mirror**; editing the mirror alone causes the divergence that file exists to prevent.
Nick: *"give it to Fable."*

---

## 5 · RULINGS THIS DESK WORKS UNDER

**Standing laws (bind every roster and every pass):**
- **THE VOICE LAW** — ask language is impersonal: *at the work, never at the writer.*
- **THE BUTTON LAW** — a counsel's button names what **its own press** sends. Per-press
  consent; one chip's naming cannot consent for another's wire.
- **THE DECLINE STANDARD** — never a refusal sentence; only the returning Socratic
  question. Nick's Character-A example is the worked case.
- **TD1** — locate, diagnose, direct; **never supply.** *If the reply could be pasted into
  the page and improve it, it composed.*
- **TRR12** — a **parallel example is teaching**; the writer's own sentence returned
  repaired is not.
- **THE ANALOG LAW** — *"The theme that should define everything about Free Write mode is
  that it is analog: a typewriter for text and a journal page/sketch pad for drawing or
  notetaking."* It explains forward-only, strike-not-delete, no paste-in, the deck — **and
  it is why the FONT control lives in Draft and Revise, not Free Write.**
- **TRR13 / DR7 as narrowed** — nothing arrives unbidden, prose-wide, **except Revise**.
  Revise is the mode a writer enters *to be shown what is wrong.*
- **TRR14** — *"a flag may only wrap existing characters in a span and add nothing."*
  Stored text is derived from rendered text, so an inserted character lands in the
  manuscript. **Marks are CSS only.**
- **A13** — the Tutor holds no editor reference and no text setter; `tu1.mjs` asserts it.
- **DISCLOSURE v4, candidate B** — ratified, 183 bytes, md5
  `9287082c0e3c0a2b243c71ce01c89b43`, at `1ef1659`.

**Ruled 2026-09-22/23:**
- **Grammar and spelling are NEVER AI.** RS7's local-only filter already said it.
- **No stall detector.** The app does not notice a writer is stuck.
- **Claim-checking is three tiers:** *has a source* (bookkeeping) and *matches word for
  word* (text comparison) need **no AI** and are this desk's; *is it true* **waits until
  Nick asks for it by name.**
- **Anchors are SPANS** — claims and quotes are highlighted ranges, not paragraphs.
- **ONE PANEL COLUMN PER SIDE** (approved 2026-09-22). On the right, the Tutor and the
  rail's lists **take turns in that one column**; the mockup's tabs are a drawing of that.
  **No third surface — two hands, and item 119's mirror still knows two.** The rail is
  PLAN DESK's zone 5 and obeys the width budget. *This closes the far-right-rail question
  this desk raised; do not re-raise it.*
- **FN5 stands as ratified** — keep the shipped `Ask a question…`. The mockup's
  *"Ask about this page…"* was a drawing shortcut, not a spec.
- **ONE `Checks` SECTION HOLDS EVERY CHECK** — this desk's *no new section* rule,
  corrected on the record: no new section **per finding**.
- **The marker build-breaker is Fable's error in both mockups and is recorded** — marks
  are CSS only, never an inserted element carrying text.
- **Workshops is the third feeder** in Nick's FEEDBACK loop (Automated · AI Tutor ·
  Workshops); registered for the strip's arithmetic.

**Working guards:**
- **Special content goes through a FILE, never a shell.** Backticks are eaten as command
  substitution and heredocs collapse escapes. This desk corrupted a document that way once
  and repaired it; every edit since has gone through a script file.
- **The relay manifest law** — verify line count, first/last sentinels and md5 **before
  acting**, and against the **foot manifest only**: a figure quoted in an earlier message
  may be superseded. Report any shortfall by name.
- **Reports name self-authored versus supplied bytes.**

---

## 6 · BOOT ORDER

1. **`git fetch origin --prune`**, then confirm `git rev-parse --show-toplevel` is the
   worktree above — **not** the primary checkout.
2. **Confirm the tip** against `git ls-remote origin refs/heads/item84/tutor-menus`. If
   local and remote disagree, say so before doing anything.
3. **Read this note**, then re-read the ledger's **laws band** in `docs/open-threads.md` at
   `origin/main` — laws land there between sessions and this note will go stale.
4. **Re-read the lock record** (`tutor-menus-lock-record.md`) before quoting any ask
   string. **It governs final strings** — the pass files and the mockups deliberately carry
   superseded ones.
5. **Do not design from a relay's summary.** If a relay names a mockup, a sketch or a
   document, **read it**; if it is not where it says, **report short**.
6. **Pick up §4's next work item** — the spellcheck S0 — unless Nick or Fable has moved it.

---

*Clean stop: tree clean, local == remote, zero unmerged commits, nothing running.*

— the item-84 desk (TUTOR), 2026-09-23
