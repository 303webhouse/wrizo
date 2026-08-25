# ITEM 84 — DECK PHASE · S0 (the Free Write roster, deck-drawn)

**Lane:** the item-84 deck phase (the Tutor's Free Write roster).
**Read at:** `origin/main` @ `2a03ace`, primary checkout `c:\Users\nickh\writer-studio`,
clean tree. Every file:line below was read at that SHA this sitting; nothing here is
carried from memory or from a map.

**RE-VERIFIED ACROSS A MID-SITTING BASE MOVE.** `origin/main` advanced to `63b875b`
(chat 1's hotfix-104 deploy manifest) while this S0 was being written, and the build
branches from that SHA. The whole delta is
`git diff --stat 2a03ace 63b875b` → **`docs/open-threads.md`, +38 lines, one file** — it
touches no source, no harness and no lexicon, so **every file:line claim below survives it
unchanged.** Named rather than silently re-stamped.

**Governing record:** `docs/menus/tutor/tutor-menus-lock-record.md` — §1 line 1 (the
redesigned roster + Nick's own mount sentence), §2 (the impersonal voice law), §6 Q2
(*"Stimulus."* + the hybrid mechanism ruling), §10 (the button-naming law). Strings of
record come from the lock record, never from the pass files or the mockup HTML (§3).

---

## (a) WHERE THE FREE WRITE ROSTER MOUNTS TODAY — nowhere, and the seam that changes it

**It does not exist, and the panel cannot see the mode.** The census's headline finding
is live and unchanged at `2a03ace`:

- `apps/desktop/src/components/Tutor.tsx:167-190` — `TutorProps` is
  `{ entry, project, pageText, pageKind }`. **There is no `mode`.** The only axis the
  panel varies on is `pageKind: 'prose' | 'screenplay' | 'board'` (line 189).
- `apps/desktop/src/components/Tutor.tsx:198` — the component signature destructures
  exactly those four props. No branch anywhere in the file's 697 lines reads a writing
  mode.

**What the panel renders in Free Write today** is therefore *identical to what it renders
everywhere else* — `Tutor.tsx:517-544`, the `Talk it through` block:

| # | Element | Evidence |
|---|---|---|
| 1 | heading `tutorConversationTitle` = `'Talk it through'` | `Tutor.tsx:520`, `deskLexicon.ts:583` |
| 2 | `.wz-tutor-convo-log` — messages, or `'Nothing said yet.'` | `Tutor.tsx:521-527`, `deskLexicon.ts:586` |
| 3 | status lines (offline / error / `'Thinking…'` / delta-truncated) | `Tutor.tsx:528-531` |
| 4 | `.wz-tutor-convo-row` — one `<input>` (`placeholder 'Ask a question…'`) + `Send` | `Tutor.tsx:532-543`, `deskLexicon.ts:584-585` |

Then the lenses (`Tutor.tsx:546-586`) and the Bible. **No chip row, no preset, no roster
of any kind exists in the file.**

**THE SEAM THAT MAKES IT MODE-AWARE — named.** The mode already exists one level up, per
surface, and simply never travels:

| Mount site | Mode available there | Evidence |
|---|---|---|
| `pages/PageEditor.tsx:874` | **live** `mode` state, `'journal' \| 'drafting'`, per-page memory key `wrizo-mode-page-${id}` | `PageEditor.tsx:99-104` |
| `pages/JournalEntry.tsx:1174` | **always Free Write** — its `ModeStrip` is hard-coded `mode="journal"` | `JournalEntry.tsx:1138` |
| `components/ScriptEditor.tsx:1100` | **always Draft** — hard-coded `mode="drafting"`, `freeWriteEnabled={false}` | `ScriptEditor.tsx:1070` |
| `components/BoardEditor.tsx:2365` | **no mode at all** — Board mounts no `ModeStrip` | grep: zero `ModeStrip` hits in the file |

`EditorMode = 'journal' | 'drafting'` (`components/ForwardOnlyEditor.tsx:31`), and
`'journal'` **is** Free Write (`ModeStrip.tsx:34` maps `t('modeFreeWrite')` to
`mode === 'journal'`).

> **The seam is one new optional prop — `mode?: EditorMode` on `TutorProps` — threaded
> from the four mount sites above.** Board passes nothing (it has no mode); Script passes
> `'drafting'`; Journal passes `'journal'`; PageEditor passes its live state. The roster
> renders only under `mode === 'journal'`. This is the panel's first mode-aware branch,
> exactly as the census predicted — **new law, not renovated law**.

**Mount position, already ratified, unchanged by the redesign** (lock record §1 line 1:
*"the arc already holds (TD2's shared chip row inside Talk it through, above the
composer)"*): the roster renders **inside `.wz-tutor-convo`, after the status lines,
immediately above `.wz-tutor-convo-row`** — i.e. between `Tutor.tsx:531` and `:532`.

---

## (b) WHAT FX15's NUDGE_POOL MACHINERY GIVES FOR FREE — and what must be new

**FREE — the whole mechanism and the whole assertion shape.** FX15's precedent is
`apps/desktop/src/components/useFirstLineInvite.tsx` + `apps/desktop/scripts/harness/fx15.mjs`:

1. **A module-level authored array** — `NUDGE_POOL`, `store/idleNudges.ts:14-40` (25 members).
2. **A synchronous local draw** — `pickPrompt()`, `useFirstLineInvite.tsx:53-55`:
   `NUDGE_POOL[Math.floor(Math.random() * NUDGE_POOL.length)]`. No await, no fetch, no
   model. *Because the draw is synchronous and local, "nothing was sent" is a structural
   fact, not a policy.*
3. **A no-near-repeat draw** — `useIdleNudges`'s `pick()`, `store/idleNudges.ts:73-81`
   (a `recentRef` ring that excludes recently-shown indices). Directly reusable shape.
4. **The `window.*` inspection seam** — `useFirstLineInvite.tsx:100-103`:
   `window.wrizoFirstLineInvite = { POOL: NUDGE_POOL }`, *"Never read by app code."*
5. **THE ASSERTION SHAPE, inherited whole** — `fx15.mjs:113` (`deckDrawn`), verbatim
   comment at `fx15.mjs:107-110`: *"a model-generated line could not be a member; a
   synchronous local draw means no send fired on load."* The check itself reads the
   exposed `POOL`, reads the rendered text, and asserts `pool.includes(text)`.

**MUST BE NEW:**

1. **The pool CONTENT.** `NUDGE_POOL` is the in-page idle-nudge deck — bare sensory
   fragments (`'salt'`, `'a door left open'`) tuned for a slip over the paper, in four
   registers explicitly documented as such (`idleNudges.ts:10-12`). It is the wrong
   register for a Tutor preset and it holds nothing at all for *Unblock* or *Free Writing
   Tips*. **Three new authored pools** — surfaced to Nick for his word before the lock.
2. **The anti-deliberation ceiling and the one-at-a-time rule.** FX15 draws once per empty
   page and never redraws; it has no concept of "press again draws the next", and no
   ceiling. Both are new.
3. **A network-count assertion.** FX15 proves deck-drawn *by membership only* — it never
   counts requests, because on page load there is no press to count. This phase's button
   law needs a positive **zero-network-on-press** proof. `runtime-verify.mjs` exposes
   `/api/_state` (`runtime-verify.mjs:138-140`) with `lastTutorChatBody` but **no request
   counter** — so one additive `tutorChatCount` field is new, paired with a page-side
   `fetch` counter (any URL, not just the Tutor route).
4. **Mode-awareness itself** — (a) above.

---

## (c) DOES THE EXISTING COMPOSER / CONVERSATION WINDOW SATISFY REQUIREMENT 3?

**Mostly yes — the window is real and needs no rebuild. One seam is missing.**

**What already satisfies it:**
- The conversation window exists, is the panel's lead content by ratified ordering
  (FX10 S1, `Tutor.tsx:511-544`), and is a single scrolling transcript that renders both
  roles (`.wz-tutor-msg-writer` / `.wz-tutor-msg-tutor`, `index.css:3710-3712`).
- Conversation genuinely continues there: `send()` (`Tutor.tsx:419-476`) replays the whole
  persisted thread as `history` (line 438) on every turn.
- The thread persists across reload — `appendTutorMessage` (`store/persistence.ts:1073-1085`).

**What is missing — the one real gap:**

`appendTutorMessage` is the **only** writer to the thread, and by a deliberate invariant
recorded at `persistence.ts:1062-1067` a thread *"is born on its first real message and
not one keystroke sooner"* — there is no "create an empty thread" call anywhere, on
purpose. So a deck draw cannot simply be written into the thread on press without
conjuring a thread out of a press that sent nothing.

**And a harder constraint rules the naive fix out.** If each press appended a message,
three presses would leave **three prompts visible in the log at once** — precisely what
Nick's rule forbids: *"a build that shows three at once satisfies the count and defeats
the purpose."*

> **THE RESOLUTION — the standing draw.** A drawn line is held as component state and
> rendered as the last turn **inside** the conversation log (same window, tutor voice).
> Pressing again **replaces** it — never stacks. It is **committed** into the persisted
> thread only when the writer actually engages (their first Send), immediately ahead of
> their own message, so the model sees the spur and conversation continues in that same
> window with no new furniture. An unanswered spur persists nothing — which also keeps
> `persistence.ts`'s born-on-first-real-message invariant intact.

Requirement 3 therefore needs **no new window and no new composer** — one render slot
inside `.wz-tutor-convo-log` and one commit line inside `send()`.

**Requirement 1 — "a blank composer with a cursor."** The composer is already blank with
`'Ask a question…'`, but it takes no focus on open (no `autoFocus`, no focus effect
anywhere in `Tutor.tsx`) — so today there is no cursor until the writer clicks. In Free
Write the composer takes focus when the panel opens. *Park-swept before building:* the
A15 dissolve checks (`tu1.mjs:225-241`) explicitly `focus()` the editor before typing and
dispatch Escape on `document` (whose `target` has no `closest`, so `Tutor.tsx:251`'s
`.wz-tutor-zone` guard is not engaged) — **no existing assertion is falsified.**

---

## THE ONE INFERRED PARAMETER — surfaced, not invented

Nick's rule: *"up to 3 prompts may exist behind an ask, but ONLY ONE IS EVER RENDERED AT A
TIME… Pressing again draws the next."* One-at-a-time is fully determined. **What re-arms a
spent ask is not stated anywhere on disk.** Built to the reading that serves his stated
reason (*"the goal in Free Write is to get writing without much deliberation"*):

- **Three draws per ask-cycle**, then that preset goes quiet (a transient gate on real
  capability — G3's lawful `disabled` case, whose named specimen is the selection-gated
  action row; *not* a locked door wearing paint). Per ask, not per roster.
- **The cycle re-arms when the writer moves on**, and there are exactly two ways to do
  that: **new writing on the page** since the draw (read off the existing read-only
  `pageText` prop — no new seam), or **a Send** in the conversation. An unlimited reroll
  would be deliberation with extra steps; a ceiling that never lifts would be a wall.
- **The standing draw itself survives the re-arm** — the writer is writing *from* it, and
  the panel already dissolves on that same keystroke (A15). Only the ceiling resets.

**Reversible by one word from Nick.** Flagged here rather than buried in code.

---

## WHAT THIS PHASE DOES NOT BUILD

No disclosure gate. No carve-out sentence. No wire key. No model-drawn path, no stub
toward one, no threshold parameter, no memory seam — **that is item 108** and it is not in
scope. Conversation *rules* stay deferred by Nick's own sentence at lock line 1: this
builds the window, not the rules.

— the item-84 deck-phase lane, 2026-08-25
