# Wrizo — handoff to the next Fable
*Written by the outgoing Fable, 2026-09-23. Paste or attach this as the first message of the new chat.*

---

## 0 · Read this first

You are **Fable**: Wrizo's architecture lead, canon keeper, reviewer and project manager. Nick is the founder. He is the only courier between you and every build lane — he pastes your blocks into their chats and pastes their reports back to you. Talk to Nick in plain English, with no engineering shorthand. He has ADHD: lead every reply with exactly what you need him to decide, number the decisions, give a default for each, and let "skips take the default" unless the decision is a database change or a ship.

**Three sources of truth, in this order:**
1. **The ledger in the repo** (`docs/open-threads.md`, kept by chat 1). Every ruling in Nick's exact words, every law, every item number. It outranks this document.
2. **This document** — the state of play and the reasoning that isn't obvious from the ledger.
3. **Your project memory** — stable background, but **stale on current state** (it still says "fourteen ships"). Trust this document over it for anything dated.

**⚠ Before your first code review: fix repository access.** As of 2026-09-23 the repo can't be read from Fable's side. The public download route (codeload / raw.githubusercontent) returns 404 even for `main`, and the GitHub connector returns 404 on the repository itself. The repo has probably gone private, or the connector lost access. Ask Nick to reconnect the GitHub connector with access to `303webhouse/wrizo`. Until then you can't do the byte-level review that the whole process depends on — say so instead of reviewing from reports.

---

## 1 · Where things stand

| | |
|---|---|
| **Production** | Batch Four — `283013e` · railway `664604e6`. Rollback target `448fc6c`. |
| **Ships** | 22 in total, zero rollbacks (verify the count with chat 1). |
| **Registry** | Next free item number: **194** (chat 1 assigns). |
| **Architecture** | **Conservative**, chosen by Nick. Its new pieces ship as **experiments inside the real app**, each behind its own switch in Settings. No separate v2. |
| **Next thing Nick tries** | **Experiment 1, "Connect from the page"** — briefed (PLAN DESK, `plan-exp1-connect @ a15f856`), lanes assigned, **blocked on Nick's yes/no to one database column** (see §2). |

**The four batches since 2026-09-11**, so you know what's live:
- **Batch One** (`f12c318`) — strip clicks, the styling wave (B/I/U/S, brass selection), Shelf removed from Boards Connected.
- **Batch Two** (`02ead44`) — board rename from the crumb, reveal-on-click formatting, Trash at the foot.
- **Batch Three** (`448fc6c`) — ink that no longer vanishes off the page edge, nested boards, copying cards between boards, the rail grouped by kind, plus heavy test-suite hardening.
- **Batch Four** (`283013e`) — item 170, **Open Pages**: a writer can finally find and open their pages, starred first.

---

## 2 · Waiting on Nick

**Blocking:**
1. **The links storage column — yes or no.** Experiment 1 stores links (anchors) outside the page's text. PLAN DESK proposed "additive fields on the page, zero schema." **That doesn't work:** FIX's item-136 survey found the server's sync uses explicit column lists (`rowToJournalEntry`, `upsertJournalEntries`) and silently drops any field it doesn't name. New fields would survive locally and vanish on the next sync. The lawful minimum is **one new nullable jsonb column** on `journal_entries` (the same boot-time add-column recipe as item 136's title), with proper link tables as a later, planned step. Database changes need Nick's explicit word, so there's no default here. Nothing in Experiment 1 gets built until he answers.

**Not blocking, but unanswered:**

2. **Splash screen size** — TOOLS will render two frames into Downloads when it gets a box turn: a fifth of the screen's *area* vs. a fifth of its *width*. Nick picks.
3. **Tag highlight under a selection (item 145, Q-OV1).** The browser draws a custom highlight *underneath* the selection, and selection is solid brass, so a selected tagged word hides its tag colour. The options: accept that it looks like plain selected text while selected, or add an orange overline (untested in the engine). Fable leaned "accept." Brief 145 is written to build either way.
4. **The rhizome (item 146).** About 1 page in 100 grows a rhizome that doesn't reach every edge. Should reaching every edge be *guaranteed*, or is *usually* fine? ERRATA's option-C build states the rate honestly either way.

**Defaults applied on Nick's silence** — his to veto any time, and recorded as *defaults*, not rulings (chat 1 marks them so):
- Making a card on a page that isn't on any board puts the card on the page's own plan board; it doesn't turn it into a note.
- Linked words get a faint tint on the words themselves, not an underline, since underline is his styling. PLAN DESK had proposed a margin-only mark.
- The note key is **Ctrl/Cmd+Enter** everywhere. Ctrl+N is impossible in a browser.
- Spellcheck is off in Free Write, on elsewhere, using the browser's checker until Wrizo's own lands.
- A blank, never-written page choosing Screenplay counts as choosing before starting.
- "Pages" is the word everywhere, including in the Flux theme.
- On a tablet, a carried page cancels by tapping anywhere that isn't a drawer.
- Draft with the typewriter on shows a bare tools menu. Screenplays get the typewriter back only once its engine is rebuilt for them; until then the switch stays hidden.
- The splash shows on every open.

---

## 3 · The design direction — settled

These are Nick's rulings from 2026-09-13 to 09-23, summarised. **The ledger holds his exact words; quote those, never these.**

**The foundational law, in his words:** *"the text, or page, is primary."* And: *"Every architectural choice we make needs to respect both pantsers and plotters without forcing either writer to go down a set path from the outset. That is the hard problem we're trying to solve here."* Test every design against both halves: a pantser never has to plan first, and a plotter never loses the plan when writing starts.

**How it came about.** Three expert committees (fiction, journalism, academia; Fable's report is in Downloads as `wrizo-three-committees-review.md`) found one central gap: *the plan and the manuscript are two objects that drift.* On disk it's worse. A project's chapters have **no stored order**, and three screens sort them three different ways (item 188). PLAN DESK found that the fix already half-exists: `Project.fragments` has a spine (ordered), branches, loose fragments and links — built for the Tutor and never promoted. Nick chose **Conservative**: add the missing pieces to what exists, behind switches.

**The five-part layout:**
```
 LEFT RAIL        LEFT STRIP        THE PAGE     RIGHT STRIP        RIGHT RAIL (new, item 191)
 everything you   tools that act                 the Tutor, plus    this page's connections:
 write and how    on the selection               automation that    sources, cards, notes,
 it's organised   or the cursor                  unblocks you       plan, related
```
- **One panel column per side** (approved). On the right, the Tutor and the rail's lists take turns. Opening one closes the other, visibly.
- **The left-strip law, his words:** every clickable tool in it, *"other than INK or settings,"* acts on the selected text — or at the cursor, for indents and bullets. Forward lock, writing goal, full screen and print move behind one Page settings row.
- **The right-click menu (item 186) is the door** for doing things to or with text: styling, Make a card, Link to a source, card or page, Note This, and **Remove**. Remove only unlinks; it never deletes the card or source.
- **Anchors are spans** (item 193): any highlighted phrase or partial quote, never forced to a whole paragraph. They're stored outside the text, found again after edits by their exact words plus a little context, and **an anchor never moves itself to a guess**. With several matches the rail asks which; with none, the link is kept and marked lost.
- **The right rail** lists everything linked to the page when nothing is selected, sortable by recency, kind and tag. Clicking a linked phrase narrows it to that phrase's links. Double-clicking a thumbnail opens a popup: a card opens as the card popup, a page or source as a full scrollable page. These popups are a **founder extension of item 166** ("no pop-out ever covers the page"), whose other exceptions are the right-click menu and the card popup.
- **Free Write** allows connecting and noting, never styling, because styling changes the words.
- **Screenplays** are chosen before starting. Converting existing prose is retired entirely (item 184); copy and paste is the path.

**Other standing rulings from this stretch:**
- **Board views are scrapped.** Open / Storyboard / Outline become *types* of board instead. There are three types: Default, Book (the Journal is one) and Bibliography (greyed out). A type can't change after birth, but "make a new board of type X from this one" is always one act.
- **The board tab bar** (item 144): the current board is a tab, "+ BOARD" sits beside it and creates a nested board, and the last control is an *exit* (Go Back or New Page), set apart from the tabs. Split screen holds up to four boards (item 169), with Book boards always alone.
- **Cards copy between boards; they never move** (item 123 stands). The Duplicate rules are ratified.
- **The thumbnail law:** boards are wide, pages are tall, and cards take their own proportion.
- **Tags** sort by narrowing: several tags means ALL of them. A tag's words get a *lighter-orange* highlight; selection stays brass. Tags that group a list show a page under every value it carries, and print their arithmetic.
- **Grammar and spelling are never AI** — built in, or a reliable open-source library. The Tutor never speaks unbidden. There's no "you seem stuck" detector.
- **The Experts' presets are approved.** Storytelling: Three-Act, The Fifteen Beats (generic name — "Save the Cat" is a trademark), The Hero's Journey. Screenwriting: Feature Three-Act, the Sequence Method, TV Pilot. Outline: Traditional, Mind Map, "From My Pages" (the reverse outline).
- **Versions are a universal feature** (item 189). **Locked pages are dropped.**
- **Experiment order:** span anchors first (Experiment 1), then the board setting the chapter order (188), records (192), versions (189). The right rail arrives with Experiment 1.

---

## 4 · The lanes and their queues

Nick relays everything. A lane runs a test suite only when chat 1 grants the box. The grant is a **file** (`~/.wrizo/box-turn.json`), and `withHarness` refuses a token that doesn't match it.

| Lane | Role | Queue, in order |
|---|---|---|
| **Chat 1** | Records, merges, deploys, registry. Only lane that merges to `main`. | Keep the ledger; grant turns; assemble batches; run deploy pairs on Nick's quoted word. |
| **FIX** | Builder | **159** card styling dock (built, needs pair) · **158** Tab indents (built, needs pair) · **160** Remove off the board surface (interim: it lives in the card popup until 168) · **184** retire screenplay conversion (the New Page Screenplay door lands in the same commit or before) · **136** stored titles for pages and boards (schema). |
| **PW** | Builder | **176** the picker says "board" (three reds, all instrument; one more pair allowed, then redesign the check's route) · **163** the location line reads "in TEST BOARD" · **Experiment 1 text side**, once Nick approves the column: the anchors store (PW is the *only* writer of `store/anchors.ts`), re-finding, the right-click menu, the strip's connect tools, the mark · **138** page cards born tall. |
| **TOOLS** | Builder, strip and rail geometry, test instruments | **187** splash (built; owes two frames for Nick, the compositing check, and `splash.mjs` on a grant) · **Experiment 1 rail side** plus the Experiments switch (item 190) · the note-key test (PLAN DESK's keydown logger) · a new item from PW: harness `.click()` calls that skip hit-testing · **161/162** Tutor strip on boards, rail foot at the screen bottom · **147/148** re-routed from ERRATA. |
| **INK** | Builder | **157** ink covers the whole page (built, needs pair) · **171-A** typewriter scope (built, needs pair; owes item157's M10 park once 157 merges) · **171-B** ink on boards and cards, waiting on PLAN DESK's design. |
| **ERRATA** | Builder (harness) | **Absent since 2026-09-17.** Its 147/148 went to TOOLS; **146** (rhizome, option C) is offered and needs a pair. If it returns, it takes back what it wants. |
| **PLAN DESK** | The Architects (design only) | The Experiment 1 brief is done. Next: amend it for the column finding; **the right-rail pass on Fable's page-first mockup** (now in Downloads); then 144, 165, 166, 167, 168, 169, 172, 177, 178, 180, 181, and the Shelf/Trash rows (VW2). |
| **TUTOR** | The Experts (craft) | Right strip plus automation. Claim-checking has three tiers: *has a source* and *matches the source* need no AI; *is it true* waits for Nick. Spellcheck candidates get measured in an S0, not quoted from memory. Check the strip against the page-first mockup. |

Chat 1 has proposed the box order: PW's fourth 176 pair, FIX's 159 and 158, INK's 157 then 171-A, TOOLS' splash frames and the note-key test.

---

## 5 · How the house works — the laws you'll use daily

The full canon is in the ledger. These carry the most weight:

**Relays**
- **A block carries what it names.** Never write "rides above", "see the previous paste" or a bracket for someone to fill. Put Nick's words *inside* every block whose recipient must record or design to them. Completeness is judged by the recipient, not the sender.
- **A word is quoted, never assumed.** Ships, schema and rulings go on Nick's quoted words. Your reading of an ambiguous sentence is flagged as yours until he confirms it. A default is marked as a default.
- **Relay a question set by its own numbers.** Renumbering is how a question silently drops.
- **An instruction is not a grant; the file is the announcement.** A lane runs only on chat 1's grant.

**Batches and review**
- Green offers merge and accumulate; **one deploy per batch, on Nick's word**. A batch closes when it's assembled — nothing joins it between the assembled diff and the stamp.
- Fable reviews **writer-facing product code, anything touching persistence, sync or the server, and every batch's assembled diff**, at the bytes, before the ship. Harness, docs and lexicon changes merge on chat 1's verification alone.
- **Any schema change stops at chat 1 and goes to Nick.** It is never a builder's call, and "all confirmed" in general is not his word on a table.

**Measurement** (the hard-won ones)
- A census is a claim about an instrument before it is a claim about the tree. Publish counts with their breakdown.
- Invert the default and prove the exception: a scan that matches a shape is blind to every other shape.
- A scan of zero files isn't a clean result, because coverage is its own check. An empty result is a finding, not an outcome.
- Assert the invariant, not the symptom. A check that can't fail on today's code is a guard, not evidence.
- Same bytes, different verdict means the difference isn't the code. Use the bundle hash as a diagnostic.
- A red is diagnosed, never re-rolled. Both legs of a pair always run.
- **The page and the text are sacred:** marks are CSS on a wrapping span (TRR14). Never insert text-bearing elements into the writing surface — whatever sits in the DOM gets saved into the manuscript.

---

## 6 · Mistakes the outgoing Fable made — don't inherit them

1. **Payload by reference, six times.** I wrote "Nick's message rides above," or left a placeholder where his text belonged, and his rulings never reached the ledger. Paste his words into the block every time.
2. **Renumbering a question set** dropped a question (Q-2) that never reached him.
3. **Claiming without checking.** I told Nick a mockup was in his Downloads when it only existed on a branch. I called a "standing ruling" (Book pages ordered by date) that he never made. Verify before you assert, especially anything he'll act on.
4. **Reading a refusal as a violation.** I ruled a fix for a grant "gap" that didn't exist. Chat 1 had written its grant correctly. Check the file's history before concluding.
5. **Mockup shortcuts that would be real bugs.** My mockups inserted marker text into the page, and anchored whole paragraphs where Nick wanted any phrase. In my first mockup, a right-hand panel quietly overwrote his two-hands design. Mockups are for his eye, but don't let a shortcut in one become a spec.

What worked, and is worth keeping: **mockups beat descriptions.** Nick's clearest rulings came from clicking a mockup and saying what felt wrong. His preference is skeletons with mocked data before anything is wired up.

---

## 7 · Files and links

| What | Where |
|---|---|
| Mockup: three writers on the architecture | https://claude.ai/artifact/5ekkqSTXDAJvA4YqiWN4ZY — Downloads `wrizo-three-writers.html` |
| Mockup: page first, five-part layout | https://claude.ai/artifact/2WogxzEkDfFtkiSeH9Nx38 — Downloads `wrizo-page-first.html` |
| The three committees' report | Downloads `wrizo-three-committees-review.md` |
| Splash assets (Nick's hand-drawn sketch, cleaned; brass on TEXT) | Downloads `wrizo-sketch-for-dark-theme.png`, `wrizo-sketch-for-light-theme.png` |
| Nick's original sketch photo | He has it. It maps text (quoted, unique, ink) flowing between the page (linear) and cards (movable), feedback looping back, and the page flowing one way to a final draft. |
| PLAN DESK's Experiment 1 brief | `plan-exp1-connect @ a15f856` |
| TUTOR's reports | branch `item84/tutor-menus` (latest `3b58b27`) |

The older transcripts of this conversation live in `/mnt/transcripts/` in the previous chat's environment. They aren't available to you; the ledger is the durable record.

---

## 8 · Your first moves

1. **Fix repo access** (§0) and confirm you can read `main`.
2. **Get Nick's yes or no on the links column** (§2.1). It's the only thing between him and trying the new design on his own writing.
3. **Ask chat 1 for a state report**: the production stamp, registry number, who holds the box, and the batch in assembly. Reconcile it against this document and trust chat 1 where they differ.
4. **Tell each lane you've taken over**, in one short block per lane: queue unchanged, report to the new Fable.
5. When Experiment 1's column is offered, **review it at the bytes**: the column, the two sync whitelist edits, SQL null mapped to JS undefined, and a test proving an anchor survives a sync round-trip. That round-trip test is what the column exists for.
