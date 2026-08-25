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

**The ceiling:** three draws behind one ask, then that preset goes quiet. This is the
lawful `disabled` case (a transient gate on real capability, the selection-gated action
row being the house specimen) — not an unbuilt feature wearing paint (G3).

**THE ONE INFERRED PARAMETER, flagged rather than buried.** What *re-arms* a spent ask is
set nowhere on disk. Built to the reading that serves Nick's own stated reason: an ask
re-arms **when the writer moves on** — new writing on the page since the draw, or a Send.
The standing line itself survives the re-arm, because the writer is writing *from* it and
the panel dissolves on that same keystroke anyway (A15). **Reversible by one word.**

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

**Every law this phase turns on has at least one check that provably dies when the law is
broken, and each mutation killed the checks belonging to it and no others.**

### §6.2 · THE STAMPS — THE SUITE OF RECORD, CLEAN BOTH SETTINGS

Run from the worktree `.claude/worktrees/item84-deck`, on the box alone (chat 1's own run
had finished; zero foreign harness browsers, verified before taking it).

```
SUITE DONE HARNESS_PARKED=unset — 60/60 of 60 returned a passing verdict
SUITE RESULT: CLEAN — tree=63b875b+11dirty bundle=index--cpkDas3.js/537384b

SUITE DONE HARNESS_PARKED=1     — 60/60 of 60 returned a passing verdict
SUITE RESULT: CLEAN — tree=63b875b+11dirty bundle=index--cpkDas3.js/537384b
```

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

---

## §8 · WHAT THIS PHASE DOES NOT BUILD

No disclosure gate. No carve-out sentence. No wire key. No model-drawn path, no stub
toward one, no deck→model threshold, no memory seam — **item 108**, untouched. The
conversation rules stay deferred by Nick's own sentence at lock line 1.

**Held for Nick's word before the lock:** the starter deck's 54 lines (the prompts are the
product, not the plumbing), and the re-arm reading of §3.

— the item-84 deck-phase lane, 2026-08-25
