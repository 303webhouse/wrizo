# ITEM 84 — DECK PHASE · THE BUILD RECORD
### The Tutor's Free Write roster, deck-drawn · the lane's first ungated citizen

**Branched from:** `origin/main` @ **`63b875b`**, pinned by SHA, on branch
`item84-deck-phase` in the worktree `.claude/worktrees/item84-deck`.
**S0 landed first:** `docs/menus/tutor/item84-deck-phase-s0.md` — its three answers, with
file:line evidence, were on disk before the first patch. It was read at `2a03ace`; the base
moved to `63b875b` mid-sitting (chat 1's deploy manifest) and the whole delta is
`docs/open-threads.md`, +38 lines, one file — no source, no harness, no lexicon — so every
S0 claim survives it. Re-verified rather than re-stamped; see that file's own note.
**Governing record:** `docs/menus/tutor/tutor-menus-lock-record.md` — §1 line 1 (the
redesigned roster, and Nick's own mount sentence), §2 (the impersonal voice law), §6 Q2
(*"Stimulus."*, the hybrid mechanism ruling, and the deck phase's gate-free standing),
§10 (the button-naming law). Ask/label strings are taken from that record and never from
the pass files or the mockup HTML (its §3 rule).

---

## §1 · WHAT BUILT

**The roster, exactly as Nick redesigned it and nothing beyond it.**

| Roster member | Built as |
|---|---|
| **(A)** blank space with a flashing cursor | the existing composer, which now takes focus when the panel opens **in Free Write only** |
| **(B)** "Writing Prompt" | a preset that draws one line from a local authored pool |
| **(C)** "Unblock" | the same mechanism, its own pool — guidance about writing |
| **(D)** "Free Writing Tips" | the same mechanism, its own pool — the practice itself |
| the response mount | the existing conversation window, unchanged — no new furniture |

**Files:**

- `apps/desktop/src/store/tutorFreeWriteDeck.ts` — **NEW.** Three authored pools (24 / 16
  / 14 = 54 members), a synchronous no-near-repeat draw, `DRAW_CEILING`, and the
  `window.wrizoTutorFreeWriteDeck` inspection seam (FX15's `wrizoFirstLineInvite`
  convention, never read by app code).
- `apps/desktop/src/components/Tutor.tsx` — the mode seam (`mode?: EditorMode`), the
  standing draw, the roster render, the press handler, the Free-Write composer focus, and
  the one commit line in `send()`.
- `apps/desktop/src/pages/PageEditor.tsx` · `pages/JournalEntry.tsx` ·
  `components/ScriptEditor.tsx` — one prop threaded each. **`BoardEditor.tsx` is
  deliberately untouched:** a Board has no writing mode, so it passes none.
- `apps/desktop/src/store/deskLexicon.ts` — five ids; the three preset labels are Nick's
  own lock-word strings, byte-verbatim.
- `apps/desktop/src/index.css` — the roster row and the standing draw's one olive edge.
- `apps/desktop/scripts/runtime-verify.mjs` — one **additive** field, `tutorChatCount`.
- `apps/desktop/scripts/harness/item84.mjs` — **NEW**, the verification.

---

## §2 · THE DECK LAW, AND HOW IT IS ENFORCED RATHER THAN PROMISED

> **Deck-drawn, never model-drawn.** Every rendered line is a verbatim member of a local
> authored pool. The draw is a synchronous read of a frozen array — no fetch, no await, no
> model, nothing asynchronous anywhere in the path.

FX15 is inherited whole, mechanism *and* harness shape: `fx15.mjs:113` asserts *"the
rendered line is a verbatim member of the local NUDGE_POOL deck,"* and its own comment
gives the reason this is a structural proof rather than a policy — *"a model-generated
line could not be a member; a synchronous local draw means no send fired."*

**Strengthened here by attribution.** The harness does not merely ask whether the line
belongs to *some* pool; it asserts the line belongs to **the pool of the preset that was
pressed**, read off the rendered node's own `data-drawn`.

**Because nothing travels, this phase carries no disclosure gate and no carve-out
sentence.** That absence is not an omission — it is the ruling. The model phase is
**item 108** and nothing here reaches toward it: no threshold, no memory seam, no stub.

---

## §3 · THE ANTI-DELIBERATION RULE, BUILT AS A MECHANISM

Nick's rule is that only one prompt is ever rendered at a time, and his reason is on the
record: *"We don't want a user spending time debating which prompt to respond to — the
goal in Free Write is to get writing without much deliberation."*

**It is built so that rendering three is impossible, not merely discouraged.** There is
one `draw` slot in component state, for the whole roster. A second press — of the same
preset or a different one — **replaces** it. There is no array to render, so no future
edit can accidentally stack them.

**The ceiling:** three draws behind one ask, then that preset goes quiet — a transient
gate on real capability, never an unbuilt feature wearing paint (G3). *(Built first as the
lawful `disabled` case; Nick's refill ruling below moved it off `disabled` entirely, since
a spent ask must be able to ANSWER a fourth press.)*

**THE ONE INFERRED PARAMETER — SUPERSEDED BY NICK'S WORD, 2026-08-26.** The original
paragraph is kept verbatim below rather than rewritten, per the house's
corrected-not-rewritten practice: it is the record of what this lane inferred, and the
inference being visible is what makes the ruling that replaced it legible.

> *(SUPERSEDED — the original, verbatim)* **THE ONE INFERRED PARAMETER, flagged rather
> than buried.** What *re-arms* a spent ask is set nowhere on disk. Built to the reading
> that serves Nick's own stated reason: an ask re-arms **when the writer moves on** — new
> writing on the page since the draw, or a Send. The standing line itself survives the
> re-arm, because the writer is writing *from* it and the panel dissolves on that same
> keystroke anyway (A15). **Reversible by one word.**

**It was reversed by one word.** Nick's refill ruling, verbatim:

> *"It should reset after 100 words have been written with a note to the user if they try
> to use it a fourth time before writing 100 words."*

| | |
|---|---|
| **Was** | any new writing **or** a Send re-arms the ask |
| **Is** | **100 words** written refills it · a Send refills **nothing** · a fourth press before the hundred **shows a note** |

**Two consequences the ruling does not state but the build cannot avoid,** named here
rather than absorbed silently:

1. **A SEND NO LONGER REFILLS.** He named exactly one refill condition and conversation is
   not it — the rule agreeing with its own reason: Free Write wants the writer on the page,
   and the page is not this composer.
2. **THE FOURTH PRESS IS NOT A DEAD BUTTON — it answers.** So a spent preset is no longer
   `disabled`; it stays pressable and goes quiet by `data-spent`. **A deliberate departure
   from G3's `disabled` specimen, made on Nick's word rather than the desk's preference:**
   a disabled control cannot speak, and a rule that cannot say itself reads as breakage.

**The anchor and the instrument are pinned in the S0 addendum, not invented here:** the
count runs from the page's word count at the **third draw** (the moment the ask was spent),
measured by **HB1's own `useMonotonicWordCount`** — the app's existing ratified reading of
this exact number (F1: 100 whitespace-delimited words), monotone for a reason Free Write
needs more than the first-run gate did, since forward lock's derived text can transiently
shrink. The one caveat — that `FirstRunGate.tsx`'s header calls itself non-reusable — is
carried openly in the addendum rather than stepped over.

**The note's copy is NICK'S OWN LINE, ruled 2026-08-26** — *"Write 100 words to unlock more
prompts"* — superseding the desk's three candidates. It names the threshold and carries
**no progress number**: the
rule may be named, the writer's distance from it may not (M1/CD4 — the meter stays the only
number in this room, and it is a cost, not a score). A live countdown would be both barred
content and a fresh source of the very deliberation the ceiling exists to prevent.

**ONE SCOPE AMBIGUITY, PINNED RATHER THAN DECIDED.** The relay reads *"three draws exhaust
the deck"*; the lock record reads *"up to 3 prompts may exist behind an ask."* The build
keeps **per ask**, on the lock record's own wording — so three prompts, three unblocks and
three tips are all available before any hundred is owed. Stated plainly so it can be ruled
against; one line to change if the three are meant to be roster-wide.

---

## §4 · REQUIREMENT 3 — THE SAME WINDOW, WITHOUT CONJURING A THREAD

Nick's sentence: *"Whether the user asks their own question or selects a preset, the
Tutor's response should be in the same dialog/chat window where conversation can
commence."*

Two constraints had to be satisfied at once, and the naive build fails both:

1. `persistence.ts:1062-1067` records a deliberate invariant — a thread *"is born on its
   first real message and not one keystroke sooner."* A press that sends nothing must not
   conjure one.
2. Appending each draw would leave three prompts visible in the log at once — exactly what
   §3 forbids.

**The standing draw resolves both.** The drawn line renders as the last turn *inside*
`.wz-tutor-convo-log` — same window, no tray, no second dialect — and **commits** into the
persisted thread only on the writer's own Send, immediately ahead of their message. An
unanswered spur persists nothing.

**What travels, stated plainly.** The press puts nothing on any wire. On Send the drawn
line rides `messages` as an ordinary turn of the conversation, exactly as every Tutor turn
already does. **No new wire key, no new payload class, nothing added to the disclosure's
enumeration** — asserted in the harness, which checks the body is still exactly
`{ messages, delta?, bible? }`.

**Conversation RULES are deferred by Nick's own word at lock line 1.** This builds the
window. It does not design the rules and does not infer them.

---

## §5 · THE STANDING LAWS, HONOURED BY NAME

- **THE VOICE LAW (§2).** All 54 pool members are machine-checked for first and second
  person: **zero** occurrences of *I / me / my / we / our / us / you / your*.
- **THE BUTTON LAW (§10).** *"A counsel's button names what its own press sends."* Here a
  press sends **nothing** — and that is asserted, not asserted-about: the harness proves
  zero outbound calls of any kind on press. **That assertion IS this phase's disclosure
  obligation, discharged by proof rather than by prose.**
- **TD1's FRAME.** Unblock and Free Writing Tips locate, diagnose and direct; they never
  supply. A prompt is a spur toward the writer's own page, never a piece of their work.
- **A13.** No press can put a byte on any writing surface — asserted per preset, on both
  the rendered page and the persisted entry.
- **G3 / G5.** Absent, not disabled, in every mode that is not Free Write; zero resting
  orange (olive rest, brass hover, orange press).

---

## §6 · VERIFICATION

`apps/desktop/scripts/harness/item84.mjs` — **46 checks**, eight sections: the deck seam ·
the roster in Free Write and nowhere else (prose Free Write / prose Draft / screenplay /
board, plus a live switch out and back) · deck-drawn membership per preset · zero network
on press, proven from **both** ends · one-at-a-time, the ceiling, and both re-arms ·
requirement 3 end to end, including the wire body · the composer's cursor, Free Write only
· the A13 wall.

### §6.1 · THE HARNESS BITES — PROVEN BY FALSIFICATION, NOT BY ASSERTION

A green harness that cannot fail is worth nothing, and 46/46 on a first run is a claim
about the harness as much as about the build. So before landing, **six deliberate
mutations were applied to `Tutor.tsx` in two runs, and the harness was re-run against each
mutant build.** The source was restored from a byte-verified pristine copy between runs
and after (md5 `7f34ffd86d5918686147c38d8e0d7ac5`, confirmed identical each time).

**MUTANT RUN 1 — four laws broken at once. Result: `FAIL — 19/46`.**

| Mutation | Law broken | Checks that died |
|---|---|---|
| `const freeWrite = true` | the mode gate | S1 Draft · S1 screenplay · S1 board · S6 Draft-focus · S6 Draft-roster |
| the drawn line replaced by a string in no pool | **the deck law** | all six S2 membership/attribution checks, ×3 presets · S4's "the second draw is a different line" |
| the standing draw rendered twice | **one-at-a-time** | S4 replace-not-stack · S4 cross-preset · S4 fourth-press · S4 survives-the-keystroke |
| a `fetch` fired inside the press handler | **zero-network** | S3 page-side counter · S3 server counter · S3 "the presses genuinely happened" |

**MUTANT RUN 2 — the two laws run 1 did not touch. Result: `FAIL — 5/46`.**

| Mutation | Law broken | Checks that died |
|---|---|---|
| the standing draw never commits in `send()` | **requirement 3** | S5 commit-ahead-of-the-message · S5 conversation-continues · S5 the wire carries the spur · S5 the draw is spent by the send |
| the Free Write composer never takes focus | **roster member (A)** | S6 "opening the panel in Free Write puts the cursor in the composer" |

**MUTANT RUN 3 — the refill ruling's own three laws. Result: `FAIL — 7/56`.**

| Mutation | Law broken | Checks that died |
|---|---|---|
| `REFILL_WORDS = 1` | **the hundred means something** | S0 threshold · S4 "fewer than 100 does NOT refill" |
| the fourth press returns silently again | **a spent ask answers** | S4 note-instead-of-a-prompt · S4 no-progress-number · S5 note-after-a-send |
| a send refills the deck (the superseded reading, restored) | **only a hundred words refills** | S5 spent-before-the-send precondition · S5 a-send-does-not-refill |

**Every law this phase turns on has at least one check that provably dies when the law is
broken, and each mutation killed the checks belonging to it and no others.**

### §6.1a · A VACUOUS PASS CAUGHT BY THE SAME DISCIPLINE — recorded, not tidied away

The refill ruling's first harness run came back **`FAIL — 1/56`**, and the failure was the
TEST's, not the build's: the S5 fixture sent after a **single** draw, so the ask had never
been spent, and *"a send does not refill it"* was proving nothing about a deck that was
never empty. `spent[0]` was `'false'` for the wrong reason.

**Fixed by exhausting the ask first, then sending** — and the fix is itself asserted, as a
named precondition check (*"a send cannot be shown not to refill an ask that was never
spent"*), so the vacuity cannot creep back. Written down because it is the exact failure
mode the falsification pass exists to catch, and because a green first run is a claim about
the harness that this arc has agreed not to take on trust.

### §6.2 · THE STAMPS — THE SUITE OF RECORD, CLEAN BOTH SETTINGS

Run from the worktree `.claude/worktrees/item84-deck`, on the box alone (zero foreign
harness browsers, verified before taking it each time).

**THE SUITE OF RECORD — after Nick's refill ruling (`item84.mjs`, 56 checks):**

```
SUITE DONE HARNESS_PARKED=unset — 60/60 of 60 returned a passing verdict
SUITE RESULT: CLEAN — tree=b8c7e8c+8dirty bundle=index-BvOCtgWk.js/537798b

SUITE DONE HARNESS_PARKED=1     — 60/60 of 60 returned a passing verdict
SUITE RESULT: CLEAN — tree=b8c7e8c+8dirty bundle=index-BvOCtgWk.js/537798b
```

**The pre-refill stamp, kept rather than overwritten** — it is the true record of the
46-check build at `b8c7e8c`, and a stamp is evidence, not a status field:

```
SUITE DONE HARNESS_PARKED=unset — 60/60 of 60 returned a passing verdict
SUITE RESULT: CLEAN — tree=63b875b+11dirty bundle=index--cpkDas3.js/537384b

SUITE DONE HARNESS_PARKED=1     — 60/60 of 60 returned a passing verdict
SUITE RESULT: CLEAN — tree=63b875b+11dirty bundle=index--cpkDas3.js/537384b
```

### §6.2a · THE STAMP EARNED ITS KEEP — a run that had to be thrown away

**One full-suite run was killed mid-flight and is NOT reported as a result, because the
stamp caught it testing the wrong software.** This lane's mutation-restore had used
RELATIVE paths while the shell's working directory had silently reverted from the worktree
to the primary checkout — a path that exists in both trees, so nothing errored, and the
follow-up `grep` read back *the file it had just written* and confirmed a restore that had
gone to the wrong tree entirely. The worktree stayed mutated; the suite rebuilt from it and
stamped `bundle=index-BQW8VggJ.js` — the MUTANT's hash — against source believed clean.

**That mismatch is the only thing that caught it,** and it is exactly the job item 77(c)
gave the stamp: *"a tree SHA does not pin what ran."* Recorded here as the stamp's first
save on this arc.

The restore was redone with absolute paths under a
`git -C "$WT" rev-parse --show-toplevel` guard and verified by **md5 and mtime**, not by
grepping the path just written. The re-run's bundle — `index-BvOCtgWk.js/537798b` — matches
the known-good clean single-file run exactly, which is both the proof the restore took and
an incidental demonstration that the build is deterministic across runs.

**The two runs name the SAME BUNDLE** — `index--cpkDas3.js/537384b` — which is the thing
item 77(c) says actually pins what ran (*"a tree SHA does not pin what ran"*). Both
settings therefore tested provably identical software. The `+11dirty` is this lane's own
eleven files, uncommitted at run time and committed unchanged immediately after.

`item84.mjs :: ITEM84 VERIFY: PASS (46 checks)` · `ITEM84 PARKED: PASS (0 checks)` — it
parks nothing of its own. Everything this ticket could have falsified came back green in
the same runs: `tu1` 93 · `tu2` 98 · `tu5` 91 · `fx10` 122 · `fx15` 13.
`tsc --noEmit` EXIT 0 in the worktree.

**Three details from the passing run, quoted because they are the phase in miniature:**

```
deck-drawn    {"text":"The last hour before a departure.","pressed":"writingPrompt",
               "memberOfOwnPool":true,"memberOfAnyPool":true}
zero network  {"fetch":0,"xhr":0,"beacon":0,"ws":0,"urls":[]}
requirement 3 [{"role":"tutor","text":"Two people want the same small object. Neither
                 will say why."},
               {"role":"writer","text":"Taking that one."},
               {"role":"tutor","text":"A stubbed continuation."}]
```

### §6.3 · THE EYEBALL PASS

Captured at 1366 (the constitutional device floor) and 1400, per the house's own "look at
what you built" step, with a throwaway script deleted before this commit (`fx2.mjs`'s
`screenshot()` seam, used exactly as its own comment describes — an aid, never a check).
What the pictures confirm that a rect-read cannot:

- The drawn line reads as a turn of the conversation, inside the log, one olive edge
  marking it as the line the writer's own press just drew.
- The three presets sit below it and directly above the composer — the ratified mount —
  wrapping to two rows at panel width rather than growing a scroll region.
- The caret is visibly in the composer on open: roster member (A), on screen.
- Pressing a second preset **replaced** the first line. One at a time, in the eye as well
  as in the assertion.
- `'Nothing said yet.'` correctly yields to a standing draw, and olive rests everywhere —
  no resting orange anywhere in the roster.

**Re-shot after the refill ruling**, on the fourth press: the spent preset (*Writing
Prompt*) dims to `--text-low` while the other two hold olive, so **which** ask is spent is
legible without a word; the third draw stands untouched above; and the note sits quietly
between the roster and the composer, reading *"Three drawn — the page is waiting. The deck
refills after a hundred words."* — the threshold named, no progress number anywhere near
it. A rule the writer can see is a rule they will not read as breakage.

---

## §7 · PARK SWEEP — NOTHING PARKED

The change is additive on every seam it touches. Every harness was read for assertions it
could falsify:

- `tu1.mjs`'s A13 structural walk clicks *"every OTHER button species in the panel"* and
  asserts the page text never changes — the presets join that walk and pass it.
- `tu1.mjs:225-241`'s A15 dissolve checks `focus()` the editor explicitly before typing,
  and dispatch Escape on `document` (whose target has no `closest`, so `Tutor.tsx`'s
  `.wz-tutor-zone` guard is never engaged) — the new Free-Write composer focus cannot
  steal their keystrokes. Every `typeKeys()` in `tu1`/`tu2`/`tu5`/`fx10` is preceded by an
  explicit `focus()` of its intended target.
- `fx10.mjs`'s no-scroll-within-scroll walk flags only computed `auto`/`scroll` — the new
  roster row declares no overflow at all and wraps instead.
- Every `/api/_state` consumer (`tu2`, `tu5`, `item89`, `item97`, `item104`) reads named
  fields only, so the additive `tutorChatCount` cannot reach them.

---

## §7.1 · A CROSS-LANE DISCLOSURE — three contacts with chat 1's deploy lane

Recorded in full rather than summarised away, because a lane's confirmations are only
worth what its disclosures are. **Chat 1 is staging a Railway deploy from the primary
checkout** (`docs/open-threads.md` @ `63b875b`: hotfix 104, *"DEPLOY STAMP filled after
railway up"*), and this lane began by building in that same working tree.

**(1) `runtime-verify.mjs` was edited while their `run-suite --parked` was in flight.**
Additive-only — one new local, one new field on `/api/_state`. Every consumer of that
endpoint (`tu2`, `tu5`, `item89`, `item97`, `item104`) reads named fields only, so no
existing check can observe it. **Their result is uncontaminated.**

**(2) This lane's uncommitted source sat in the primary checkout's working tree** —
seven modified files and four untracked — i.e. in the tree a `railway up` would upload.
**Repaired:** the whole build was moved to the worktree `.claude/worktrees/item84-deck`
(11 files, md5-verified byte-identical on both sides), the modified files restored with
`git checkout --`, and the untracked ones removed. **The primary checkout was verified
clean at `63b875b` afterwards** — `git status --short` empty.

**(3) This lane's harness runs overwrote `apps/desktop/dist-web` in the primary checkout**,
which is the artifact their stamp names. **Repaired and verified, not merely asserted:**
`dist-web` was rebuilt at clean `63b875b` and the result is **`index-hZQhhS8W.js` /
531318 bytes** — byte-identical to the bundle their own deploy manifest stamps
(*"bundle index-hZQhhS8W.js/531318b"*). Their staging area is exactly as they left it.

**The lasting fix, and the reason this is written down:** this lane now builds in its own
worktree. Two lanes sharing one working tree while one of them is staging a production
deploy is a hazard the arc should not meet twice.

### §7.2 · IT MET IT TWICE — the second contact, and what actually caused both

**It did happen again, and the honest report is that the worktree was not the whole fix.**
The mutation-restore described in §6.2a wrote two files — `Tutor.tsx` and
`tutorFreeWriteDeck.ts` — into the **primary checkout**, because the write used relative
paths while the shell's cwd had reverted there.

**Repaired, and proven before touching anything:** both stray files were md5-matched against
this lane's own backups first, to establish they were mine and not another lane's, then
`git checkout --`'d and removed. `docs/menus/tutor/item84-t1-s0-brief.md` — another lane's
untracked work, sitting in the same tree — was identified and **left untouched**. The
primary checkout's `dist-web` was checked and held `index-CaW0zodg.js`, the live production
bundle, with **zero** of this lane's code: no artifact contamination on this occasion.

**THE ROOT CAUSE OF BOTH, named properly.** It was never really "built in the wrong tree" —
it was **relative paths plus a working directory that changes without being asked to**. A
relative write cannot fail loudly when the same path exists in both trees, and a `grep` that
reads back the file it just wrote will confirm any mistake with perfect confidence. The rule
this lane now holds, and the one worth carrying to any lane sharing this machine:

> **Never write a file by relative path. Guard every write with an explicit
> `git -C "$WT" rev-parse --show-toplevel`, and verify a restore by md5 or mtime — never by
> grepping the path you just wrote.**

---

## §8 · WHAT THIS PHASE DOES NOT BUILD

No disclosure gate. No carve-out sentence. No wire key. No model-drawn path, no stub
toward one, no deck→model threshold, no memory seam — **item 108**, untouched. The
conversation rules stay deferred by Nick's own sentence at lock line 1.

**Held for Nick's word before the lock:** the starter deck's 54 lines (the prompts are the
product, not the plumbing), and the re-arm reading of §3.

— the item-84 deck-phase lane, 2026-08-25

---

## §9 · THE ITEM-111 CORRECTION — this lane's error, stated on disk

**Recorded here rather than relayed, per the standing rule that a correction which exists
only in a session is a correction that does not exist.** Item 111 was opened as a
*build-reproducibility gap*. **Its founding premise is false, and the false premise is this
lane's doing.**

### WHAT ITEM 111 RECORDS

The hotfix-104 deploy commit (`6b279c6`) reports that the served bundle
(`index-4pj2Iqk-.js` / `index-07aGd89Y.css`) was **not** the suite-of-record bundle
(`index-hZQhhS8W.js`), and diagnoses: *"Root cause: build-env drift — local Node v24.13.0
vs Railway nodejs_18, no node pin in the repo. Same source (2a03ace) + same frozen
lockfile."* Item 111 and the `.nvmrc`/`engines` pin (`7407f97`) follow from that reading.

### WHY IT IS WRONG — THE SOURCE WAS NOT THE SAME

`railway up --ci` ran from the **primary checkout** while **this lane's uncommitted item-84
files were sitting in that working tree** — including **four deliberate falsification
mutations** applied to `Tutor.tsx` for the harness-bites pass. Railway uploaded the working
directory and built *that*.

**Proven from production, not inferred:**

| Evidence | Value |
|---|---|
| Served bundle | `index-4pj2Iqk-.js`, **537,500 bytes** |
| This lane's own mutant-run-1 stamp | `bundle=index-4pj2Iqk-.js/537500b` — **the same hash and the same byte count** |
| String in the live bundle | `A line composed on the spot, in no pool.` — existed **nowhere** but in mutation MUT2 |
| Also in the live bundle | `wrizoTutorFreeWriteDeck`, `wz-tutor-fw-preset`, `Free Writing Tips` |
| `/api/tutor/chat` call sites | **2** — the lawful send path, plus MUT4's unbidden `fetch` on a preset press |

### THE CONSEQUENCE FOR ITEM 111, STATED PLAINLY

**The Node-version reading is not merely unproven — this incident is evidence AGAINST it,**
and the chain is worth setting out because the obvious objection has to be closed first.

**First, the objection: did Railway even rebuild, or did it serve an uploaded `dist-web`?**
If the latter, an identical hash would be trivial and would prove nothing. **It rebuilt.**
`railway.json`'s `buildCommand` is
`pnpm install --prod=false && pnpm --filter @writer-studio/desktop build:web && ...` under
the **NIXPACKS** (Linux) builder, and `dist-web/` is in `.gitignore` with **no
`.railwayignore` in the repo** — so the artifact is never uploaded at all. Railway built it,
on Linux, from source.

**Then the finding, on two independent trees:**

| Tree | Built locally (Windows, Node 24) | Built by Railway (Linux, nixpacks) |
|---|---|---|
| the contaminated tree | `index-4pj2Iqk-.js` / 537,500 b | `index-4pj2Iqk-.js` — **identical** |
| clean `23ffadb` | `index-CaW0zodg.js` / 531,457 b | `index-CaW0zodg.js` / 531,457 b — **identical**, and it is what production serves today |

The second row was not sought — it fell out of building the m3 control worktree at clean
main, and it is the stronger of the two because nothing about it is entangled with this
lane's mutations.

**Two independent sources, each reproducing byte-for-byte across Windows/Node 24 ->
Linux/Node 18.** The bundles differed in the incident because **the sources differed**, not
because the toolchains did.

**A STANDING BELIEF THIS FALSIFIES, flagged rather than left to rot:** this house has
carried a working note that a Windows local build yields a DIFFERENT bundle hash from an
identical source than Railway's Linux build does. **Both observations above contradict it
as of 2026-08-26.** Whatever once caused that divergence is not present now. The belief
should be re-tested rather than trusted, and item 111's premise re-examined with it.

**The `.nvmrc` / `engines` pin may still be worth keeping on its own merits** — pinning the
build toolchain to the deploy target is good practice regardless. But it should be kept for
those reasons, and **item 111 should not continue to rest on this incident as its
evidence.** The gap it was opened to describe was not observed here.

### AND WHAT WAS ACTUALLY LIVE

For roughly ninety minutes production served a build in which pressing a Tutor preset fired
an **unbidden `POST /api/tutor/chat`** — a direct violation of the ratified disclosure
sentence (*"Nothing is ever sent unless you ask"*), on a surface where the roster also
rendered in every mode. **It is no longer live:** production now serves
`index-CaW0zodg.js` (531,457 b) with **zero** of those markers and exactly **one**
`/api/tutor/chat` — the lawful send path. Verified by download, not assumed.

**Responsibility is this lane's**, and the root cause is recorded in §7.2: a file written by
relative path while the shell's working directory had reverted to the primary checkout.

---

## §10 · A MISATTRIBUTION, DECLINED — `item84-t1-s0-brief.md`

**This file was routed to this lane as its author. This lane did not write it, and cannot
rule on it.** Recorded because an authorship claim is what a deletion decision would rest
on, and the claim is false.

**The evidence, and it is decisive:**

1. **It predates this lane entirely.** The session's own opening `git status` snapshot —
   captured before this lane's first action of any kind — already listed
   `?? docs/menus/tutor/item84-t1-s0-brief.md` as untracked in the primary checkout.
   Nothing this lane later did could have created a file that was already there.
2. **Its subject is a different arc.** It is *"TICKET T1 — THE CHECKER AND ITS ERROR
   CLASSES"*: the **Revise error lens**, its T1→T3→T2→T4→T5→T6→T7 ordering,
   `store/draftDecoration.ts`, TRR15, and a third-party-checker adoption ruling. Grepped:
   **21** hits for the Revise/T-series/error-lens vocabulary, **0** for anything of this
   lane's (`Free Write roster`, `deck-drawn`, `Writing Prompt`, `preset`, `NUDGE_POOL`,
   `REFILL`).
3. **This lane's own subject is the opposite one** — the Free Write roster. The two share
   only the string "item 84" in a filename.
4. **A Fable relay for that same arc was misrouted to this lane earlier** (the T0 ruling
   — *"STAND REVISE UP AS A LIVE MODE… precedes T1"*, and *"doc 2 HOLDS unlanded"*), and
   was declined then for the same reason. **The two misroutes are the same misroute**, and
   the filename's `item84-` prefix is the likely cause of both.

**THE RULING THIS LANE CAN GIVE, and the only one it can:** it is **not superseded by
anything in the deck phase**, because the deck phase does not touch the error lens, the
Revise surface, or any T-series ticket. **Nothing of it should be deleted on this lane's
word, because this lane has no standing to give that word.** It belongs to whichever desk
holds the Revise re-pass / error-lens arc — and note that Fable's own T0 ruling would
supersede its **§1 ordering** ("T1 is first of seven"), which is exactly the kind of call
that desk must make with its own record in hand.

**Preserve it.** Chat 1 was right to keep it; the only correction is to whom it goes next.

— the item-84 deck-phase lane, 2026-08-26

---

## §11 · THE M3 RED — investigated, not waved through

**The offer's own suite came back `60/61 NOT CLEAN` on the default setting.** `item84.mjs`
passed 57/57 in both settings; the red was **`m3.mjs`**, one check of thirty-one:

```
Live: the saturated live ground ROAMS — its rendered extent reaches near all four stage margins
{"minY":222.18, "maxY":729.72, "minX":3.98, "maxX":1199.04, "stageW":1203.22, "stageH":733}
                        needs minY < 0.25 * 733 = 183.25   → short by ~39px
```

**It is disclosed here rather than summarised away.** The same pair's PARKED run returned
`61/61 CLEAN`, and both earlier full runs of this lane returned m3 green — and under this
house's own law **none of that is a clearance argument.** The known-flake list is EMPTY
after DF1.1, and "passes in isolation" and "the machine was quiet" are both retired. A red
suite means something is wrong until it is shown otherwise.

### WHAT THE SOURCE SAYS

The Rhizome's growth is seeded from the wall clock:

- `RhizomeField.tsx:50` — `const SESSION_START = Date.now(); // frozen once per app-load/session`
- `RhizomeField.tsx:165` — `rngRef.current = mulberry32(hashSeed(\`${seedKey}:${SESSION_START}\`))`

**So the growth pattern differs on every app load, by design.** `minY` is the topmost extent
of that growth, and whether it reaches into the top quarter of the stage is a property of a
clock-derived seed. Nothing in this ticket can reach `Date.now()` at app load or the
mulberry32 stream. **An asymmetry inside m3's own file is worth naming:** its
paper-avoidance law is proven *across a 40-seed sweep*, while this ROAMS check rides a
**single** live session seed.

### WHAT WAS ACTUALLY RUN — because reading the source is not proof

**Control 1 — m3 alone on clean `23ffadb`, no item-84 code, four runs: PASS ×4.**
That does NOT disprove causality (four passes are consistent with a modest failure rate),
and it carries a **confound this lane names rather than hides**: the failing run was file
**49 of 61** in a full suite, while those controls were isolated single-file runs. Growth is
time-staggered (`BURST_STAGGER_MS = 600`), so accumulated machine load is a live variable
and the conditions were not matched.

**Control 2 — the matched one: a FULL suite on clean `23ffadb`.** Result recorded in §11a.

**This lane does not claim a flake.** It claims an investigation, with the mechanism named
on disk and a matched control run. If the matched control also reds m3, the finding belongs
to m3 — a single-seed assertion over a clock-seeded generator — and is owed its own ticket,
not a shrug. If the matched control is green, the question comes back to this branch and
this lane keeps looking.

### §11a · THE MATCHED CONTROL, AND THE SAMPLED DISTRIBUTION

**Control 2 — the matched one. A FULL suite on clean `23ffadb`, no item-84 code:**

```
SUITE DONE HARNESS_PARKED=unset — 60/60 of 60 returned a passing verdict
SUITE RESULT: CLEAN — tree=23ffadb bundle=index-CaW0zodg.js/531457b
m3 ROAMS: PASS  {"minY":3.18, ...}
```

Green — and `minY` of **3.2** against this lane's failing **222.2**. That gap is far too
large to be threshold jitter, so **one sample per tree settles nothing**, and this lane did
not stop there.

**Control 3 — the sampled distribution. `m3` alone, six runs on each tree:**

| | runs (minY, px; threshold 183.3) |
|---|---|
| **clean main** `23ffadb` | 4.9 · 8.0 · 7.3 · 6.3 · 7.9 · **137.3** |
| **this branch** `ab90598` | 12.1 · 3.1 · 9.6 · 3.3 · 8.1 · 5.4 |

**THE FINDING, and it is the opposite of convenient for a lane hoping to be excused:**
clean main produced the **outlier**, not this branch. Main's 137.3 is ~20x its own median
and within striking distance of the 183.3 threshold; this branch's six samples are
**tighter and lower** (3.1–12.1) than main's. There is no shift attributable to this
ticket — if anything the branch samples are better, which is itself meaningless noise and
is reported as such rather than claimed as evidence of quality.

### §11b · THE DISPOSITION — the defect is m3's assertion, and it is owed a ticket

Three independent lines agree, and each was run rather than reasoned:

1. **Mechanism.** Every expensive thing the Tutor does — the three lens computations and
   the live-entry read — is gated on `panelVisible = open` (`Tutor.tsx:454-456`). **m3
   never opens the panel.** This ticket's addition therefore costs one `wordCount` at mount
   plus a re-render of a closed component. There is no route from that to ~200px of lost
   growth.
2. **The matched control is green** at the same suite position under the same load.
3. **The distribution is long-tailed on BOTH trees**, and the worst sample observed came
   from the tree without this ticket in it.

> **THE DEFECT IS IN `m3.mjs`'s ROAMS CHECK, NOT IN THIS BRANCH.** It asserts a geometric
> property of a growth seeded from `Date.now()` at app load
> (`RhizomeField.tsx:50`, `:165`) — **a different seed every run** — and it does so from a
> **single** live session. The same file proves its paper-avoidance law across a **40-seed
> stress sweep**; the ROAMS margins get one seed and a hard bound. That asymmetry is the
> bug: the check is sound about what it wants and unsound about how it samples.

**THIS LANE DOES NOT FIX IT, and does not touch it.** m3 belongs to the Rhizome arc, the
check is not falsified by anything here (so the park law does not apply — this is
non-determinism, not supersession), and a lane editing another lane's assertion to turn its
own suite green is precisely the move the immutability law exists to prevent.

**OWED — a ticket for the m3 desk, with the shape suggested and the choice left to them:**
drive the ROAMS check from the same **multi-seed sweep** its sibling law already uses, or
pin `SESSION_START` behind a harness seam so the live check is deterministic, or widen the
bound to the distribution's real tail. Any of the three closes it; the first is most in
keeping with the file's own existing practice.

**AND THE HONEST RESIDUE:** the known-flake list is EMPTY by law, and this lane is not
adding to it. What it is adding is a **named, mechanically-explained defect with an owed
ticket** — which is the opposite of a flake entry, and is why the red is reported in §6.2
rather than re-run away.


---

## §12 · THE OFFER — to chat 1, as a committed record

**Branch `item84-deck-phase`, rebased onto `origin/main` @ `23ffadb` (a fast-forward: main
is an ancestor of the branch tip). MERGE OFFER ONLY — not merged, and NOT a deploy
request.** No deploy word has been given for any of this, and this lane asks for none.

**No peer messaging was attempted, by law: lanes do not identify or message each other.**
This record IS the offer; Nick relays the pointer. That is also why the item-111 correction
(§9) lives here in full rather than in a message — a correction that exists only in a
session is a correction that does not exist.

### WHAT MERGES

| | |
|---|---|
| Product | the Free Write roster: the composer's cursor, three deck-drawn presets, the standing draw, the refill |
| Seam | `mode?: EditorMode` on `TutorProps` — the Tutor's **first mode-aware layer** |
| New files | `store/tutorFreeWriteDeck.ts` (54 authored lines), `scripts/harness/item84.mjs` (57 checks) |
| Touched | `Tutor.tsx`, `deskLexicon.ts`, `index.css`, three mount sites (one prop each), `FirstRunGate.tsx` (stale-header correction), `runtime-verify.mjs` (one additive field) |
| Records | this file, `item84-deck-phase-s0.md`, the ledger rider |
| **Not touched** | `BoardEditor.tsx` (no mode to pass), any server file, any schema, any wire key |

### WHAT A REVIEWER SHOULD PUT WEIGHT ON

1. **The zero-network proof (§2)** — this phase's disclosure obligation is discharged by
   that assertion and by nothing else. If it does not convince, the phase does not ship.
2. **The falsification passes (§6.1)** — nine mutations across three runs; every law has a
   check that provably dies when the law is broken. Including the one that caught a
   **vacuous** check of this lane's own (§6.1a).
3. **§9, the item-111 correction** — this lane's error, and it changes another item's
   premise. It should be read before item 111 proceeds.
4. **§10** — the `item84-t1-s0-brief.md` misattribution is DECLINED with evidence, and the
   file must be preserved, not deleted.
5. **§11, the m3 red** — disclosed, investigated, and not called a flake.

### WHAT IS NOT IN THIS BRANCH

The model phase, its carve-out sentence, the deck->model threshold, the memory seam —
**item 108**, untouched and unstubbed. The conversation rules, deferred by Nick's own
sentence at lock line 1. Nothing here reaches toward either.
