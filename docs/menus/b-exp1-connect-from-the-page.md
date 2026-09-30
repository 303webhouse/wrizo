# EXPERIMENT 1 — "CONNECT FROM THE PAGE"
### PLAN desk · 2026-09-22 · **build brief** · the first v2 experiment, shipped as a slice he can use

**WORKTREE:** `.claude/worktrees/exp1-connect` · **BRANCH:** `exp1-connect` · **OFF:** `origin/main`.
**Never the primary checkout. This lane pushes its BRANCH.**

> **⚠ A WORKTREE ISOLATES FILES, NOT THE BOX** — read the box ordering on the ledger or ask chat 1
> before any run; never infer your turn from quiet.

> **⚠ SYMBOLS ARE THE ANCHOR.** Read at `8b774d4`.

> **✅ HIS PRINCIPLE, VERBATIM:** *"the text, or page, is primary"* · *"Every architectural choice we make
> needs to respect both pantsers and plotters without forcing either writer to go down a set path from
> the outset. That is the hard problem we're trying to solve here."*

---

## §0 · WHAT IT IS, AND THE TEST IT HAS TO PASS

**One slice: a writer selects words on a page and connects them to something — a source, a card, a note —
and sees what this page is connected to.** *Anchors first, as recommended, but shipped as something he can
use rather than as foundations.*

> **THE TWO-HALVES TEST, applied to this slice:**
> **A PANTSER NEVER HAS TO PLAN FIRST** — selecting a phrase and pressing *Note this* requires **no board,
> no project, no structure**. The note exists because the words do.
> **A PLOTTER NEVER LOSES THE PLAN WHEN WRITING STARTS** — every card and page they already made is a
> target the moment they select something. **Nothing has to be created to be connected.**

**THE SWITCH:** `Settings → Experiments → Connect from the page`, **OFF by default.**
**OFF hides; it never deletes:** the right-click menu's connect acts, the left strip's three acts and the
right rail are absent; **anchors and links remain in the data.** **ON is additive only.**

> **⛔ THE ACCEPTANCE CLAIM FOR THE WHOLE EXPERIMENT: WITH THE SWITCH OFF, THE APP IS v1.** *The existing
> suite passes unchanged, and the page renders with no mark on it.* **That is what makes shipping inside
> the real app safe, and the harness asserts it.**

---

## §1 · SPANS — his ruling, designed

**His words:** *"writers often use only partial quotes or the User may want to select a phrase and create
a card that explains or tracks its use."* **So an anchor is a SPAN, not a paragraph.**

**THE FOUR RULES HE GAVE, each with its mechanism:**
1. **SCOPED WITHIN A PARAGRAPH.** A span never crosses a paragraph boundary. *A selection that does is
   split into one span per paragraph, and the acts apply to all of them* — **stated, not silent.**
2. **RE-FOUND AFTER EDITS BY THE EXACT WORDS PLUS A LITTLE CONTEXT EITHER SIDE.** §1b.
3. **STORED OUTSIDE `entry.text`.** §2 — and the page's text is never rewritten to carry a marker.
   *That is what "the text is primary" means in the data: the writing does not grow scaffolding.*
4. **IT SAYS SO WHEN ITS WORDS ARE DELETED.** A lost anchor is **kept**, is **marked lost**, and its link
   **still opens its target.** *Never silently dropped, never silently re-pointed.*

### §1b · THE RE-FINDING ORDER — deterministic, and it stops rather than guesses
On read, for each anchor: **(1)** the exact `quote` at its recorded offset **inside the recorded
paragraph** → **found**. **(2)** `prefix + quote + suffix` anywhere in that paragraph → **moved** (hints
updated). **(3)** the same, anywhere on the page → **moved**. **(4)** `quote` alone, **exactly one match**
on the page → **moved**. **(5)** `quote` alone, **several matches** → **AMBIGUOUS: the anchor is kept,
marked, and the rail says *"these words appear 3 times now — point me at the right one"*** with a press to
choose. **(6)** no match → **LOST**, kept and marked.
> **⛔ RATIFIED AND BANDED (Fable, 2026-09-22): AN ANCHOR NEVER MOVES ITSELF TO A GUESS.** *Steps 5 and 6 are where a lazy
> implementation would silently pick the first match, and that is how a quote ends up attached to the
> wrong sentence — the one failure this feature cannot have.*

## §2 · THE SCHEMA, NAMED PRECISELY — two shapes, one lean (⚠ Fable reviews; a table is Nick's to clear)

> **⛔ CORRECTED ON FABLE's REVIEW, AND VERIFIED HERE: SHAPE A IS NOT ZERO SCHEMA IN EFFECT.**
> **`apps/server/src/sync.ts` maps journal entries through EXPLICIT COLUMN LISTS IN BOTH DIRECTIONS** —
> `rowToJournalEntry` names every field it returns, and `upsertJournalEntries`' insert names every column
> it writes. **A new optional field on the entry would be written locally, never sent, and dropped on the
> next pull — silently, without erroring.** *(FIX's item-136 S0 found it; this desk read both functions
> and confirms it.)*
>
> **SO THE LAWFUL MINIMAL FORM IS SHAPE A's MODEL IN ONE ADDITIVE NULLABLE JSONB COLUMN** — the shape
> `boxes`, `strokes`, `tags`, `tutor` and `page_settings` already are — **plus its two mapper lines.**
> **✅ ANSWERED 2026-09-23 — NICK'S WORD, VERBATIM: *"1. Yes"*** (to *"The links column: yes or no?"*).
> **THE SCHEMA GATE IS OPEN. The column is approved and this build is no longer blocked on it.**
> **Shape B stays the planned graduation, with its ticket open.**
>
> **⚠ AND IT IS ONE COLUMN UNDER THREE NAMES — the ledger of 2026-09-23 records the fork explicitly**
> *("the links column" and "the anchors column" are the same column; the handoff writes it `links
> (anchors)`)* **so that no desk builds two and nobody asks Nick twice.** **This brief's `connections` is
> THAT COLUMN, not a third thing.**
> **The desk's proposal, because a fork left open is how two get built: `connections`** — *it carries BOTH
> halves (anchors and links are one record set, useless apart), it is the feature's own word, and it is
> already the name in Fable's drawing (`aria-label="This page's connections"`).* **Chat 1 or Fable rules
> the name; NICK's yes/no is about the COLUMN, not its spelling, and must not be spent on this.**
>
> **⚠ SUPERSEDED 2026-09-23 — FABLE RULED: the column is `page_links`, JS `pageLinks`.** *"Connection(s)"
> was already taken, four times over, in this same tree — the board hairline (`Box` kind `'connection'`),
> the card footer's lines and its toggle, and the page↔board connections `getBoardsConnecting` reads —
> and this desk's own proposal above picked the one word already doing other work.* **The paragraph above
> is kept as written, superseded rather than erased, because the desk's own reasoning for `connections`
> is what the ruling overturns.** **§2's code block and §Q's ruled list, below, carry the ruled name; this
> paragraph does not, on purpose.**

### SHAPE A — **one additive nullable jsonb column carrying the model below** · **the desk's lean for an EXPERIMENT**
```ts
// types/index.ts — additive-optional, absent on every existing row (the onCanvas?/systemKind precedent)
export interface Anchor {
  id: string;            // stable; never reused
  paraIndex: number;     // the paragraph's ordinal WHEN WRITTEN — a hint, never the truth
  quote: string;         // the exact selected words — the anchor's truth
  prefix: string;        // up to 48 chars before, for re-finding
  suffix: string;        // up to 48 chars after
  startHint: number;     // character offset within the paragraph when written — a hint
  status?: 'moved' | 'ambiguous' | 'lost';   // absent means FOUND (absence-means-ok, the house grammar)
  createdAt: string; updatedAt: string; deletedAt?: string;
}
export interface Link {
  id: string;
  anchorId: string;      // one anchor may carry SEVERAL links — his "the source(s) linked", plural
  kind: 'source' | 'note' | 'card';
  targetEntryId?: string;   // a page or board
  targetBoxId?: string;     // a card on that board
  body?: string;            // a note's own words (kind 'note')
  createdAt: string; updatedAt: string; deletedAt?: string;
}
// on JournalEntry:  pageLinks?: { anchors: Anchor[]; links: Link[] };
//   → ONE column:  alter table journal_entries add column if not exists page_links jsonb
//   → FIVE edit sites, both directions, or the field is dropped in silence:
//        rowToJournalEntry:     pageLinks: r.page_links ?? undefined,          (the read mapper)
//        upsertJournalEntries:  page_links in the INSERT column list,
//                                $n::jsonb in the VALUES placeholder list,
//                                page_links in ON CONFLICT DO UPDATE SET,
//                                and the value in the positional parameter array
```
**⚠ NAMED `page_links` (JS `pageLinks`), RULED 2026-09-23 — superseding `connections` above.** **⚠ FIVE
EDIT SITES, NOT TWO — corrected 2026-09-23.** *This brief's original "TWO mapper lines" undercounted the
write path: the `page_settings` precedent at `apps/server/src/migrate.ts:168` and `sync.ts:247` shows
FOUR write-path edits (insert list, values placeholders, `on conflict do update set`, parameter array)
plus the read mapper — five edits to carry one column, not two.* **Neither correction is a detail — a
column missing any one of the five behaves exactly like the silent loss above.** **The harness asserts a
round trip through the server double, not merely a local write.**
**Why it is still the lean for an experiment:** **one column and two mapper lines** is the smallest
lawful change; it rides the record the anchor belongs to, it is **hidden by one flag**, and **deleting
nothing is trivial**. *`boxes`, `strokes` and `page_settings` already prove the shape at this scale.*
**Its cost, named:** a reverse question — *"what links point AT this card?"* — means reading pages.
**At today's scale that is a scan of one cache; it will not survive growth**, which is why Shape B exists.

### SHAPE B — **the tables** (the graduation path; **SCHEMA → stops at chat 1 → Nick's word**)
```sql
create table if not exists anchors (
  id text primary key,
  entry_id text not null,            -- the page the span lives in
  para_index integer not null,       -- hint
  quote text not null,
  prefix text not null,
  suffix text not null,
  start_hint integer not null,
  status text,                       -- null = found
  created_at text not null, updated_at text not null, deleted_at text
);
create index if not exists anchors_entry on anchors (entry_id);

create table if not exists links (
  id text primary key,
  anchor_id text not null,
  kind text not null,                -- 'source' | 'note' | 'card'
  target_entry_id text, target_box_id text, body text,
  created_at text not null, updated_at text not null, deleted_at text
);
create index if not exists links_anchor on links (anchor_id);
create index if not exists links_target on links (target_entry_id, target_box_id);
```
**`links_target` is the index Shape A cannot have**, and it is the whole reason to graduate.
**RECOMMENDATION: ship Experiment 1 on SHAPE A; open the table ticket now so the graduation is planned,
not discovered.** *The field names above are deliberately the same on both sides, so graduating is a
migration of storage and not of meaning.*

## §3 · THE RIGHT-CLICK MENU — the door (item 186)

> **⚠ AMENDED 2026-09-24 — `b186-base-text-menu-amendment.md`** (Nick: *"Is B-I-U included in the right-click menu? If not, it should be."* — the menu is now THE APP'S: a base menu — Bold · Italic · Underline, then Cut · Copy — present with every switch off; the four connect acts below appear only with the switch ON; "with every switch off = v1" now reads "v1 plus exactly the base menu"). **Where this section's list or the switch-off assertion disagree, that file governs (its §8 lists them). Kept as written below.**
**His list, in his order: styling · Make a card · Link · Note This · Remove.**
- **It opens at the pointer and may lie over the page — item 166's exception (a), and his popups extend
  those exceptions by his word.**
- **On a SELECTION.** With no selection, the text acts are **ABSENT, not greyed** (the house law), and only
  the cursor-position acts remain.
- **REMOVE UNLINKS AND NEVER DELETES** — his word. *It removes the link; the anchor survives if other
  links use it; the target is untouched.* **The menu says which of the two it will do** — *"Remove this
  link"*, never a bare "Remove".
- **Make a card** creates a card **on the board this page is connected to** if there is exactly one, and
  **asks which** if there are several. **WITH NONE: the card lands on THIS PAGE's OWN PLAN BOARD, created
  quietly** — **Fable's lean, adopted, and it corrects this desk's first answer.** *He asked for a card,
  and a card that becomes a note is not that.* **The plan board is the page's own** — `getOrCreatePlanBoard(pageId)`
  in `store/persistence.ts` already births and pairs it (1:1, `planBoardId`) — **so nothing is invented
  and no drawer is chosen for him** — *which is what the pantser test
  actually asked for.*

## §4 · THE LEFT STRIP — the three acts, and the audit his law demands
**His law, verbatim:** *"every clickable tool in it (other than INK or settings) is something that happens
to a portion of the page that is selected (or in the case of an indent or bullet, something that happens
where the cursor is currently positioned)."*

**THE THREE ACTS THIS EXPERIMENT ADDS — all selection-based, so all lawful:** **Link** · **Note this** ·
**Make a card**.

**THE AUDIT, seeded from source (`Sliver.tsx`'s `content`) — S0 completes it:**

| today | acts on | verdict |
|---|---|---|
| `format` (B/I/U, font) | the selection | **lawful** |
| `inkOptions` | — | **excepted by his own sentence** |
| **`forwardLock`** | the page | **⚠ MOVES behind one *Page settings* row** (confirmed) |
| **the goal block** | the page | **⚠ MOVES behind *Page settings*** |
| **typewriter · full screen · print** | the page | **⚠ MOVE behind *Page settings*** |
| the gear | settings | **excepted** |
| `onPickKind` / `onPickStyleGuide` | the page | **S0 rules each against the law and reports** |

**AND FREE WRITE: *connects and notes, never styles*** — so in Free Write the strip shows **Link · Note
this · Make a card** and **no styling**, which is the analog law arriving in a new place rather than a new
exception.

## §5 · THE RIGHT RAIL — his spec, built
**His words:** *"The external sources should be listed when nothing in particular in the text has been
clicked on. This list should be sortable by recency, kind, and tag. When the User clicks on a linked
portion of text, only the source(s) linked. The User should then be able to double click on the source's
thumbnail to bring up a popup of that source (if a card, the card popup. If a page, a full-sized,
scrollable page, etc.)"*

- **RESTING STATE: everything this page is connected to**, sortable by **recency · kind · tag**.
  **⚠ THE GROUPING LAW APPLIES A THIRD TIME** (ratified at 177, applied again at the All Boards list): a
  source has **one kind** and **one recency** but **many tags** — *so by tag GROUPS, a source appears under
  every tag it carries, and the list prints its arithmetic.*
- **SELECTED STATE: click a linked span → only its source(s).** **A press on empty text returns to the
  resting list** — *the rail follows the pointer, and always has a way back.*
- **OPEN: double-click the thumbnail** → **the card popup for a card; a full-size scrollable page for a
  page** — his words, and both are **166 exceptions by his extension.**
- **REMOVE in the rail = UNLINK**, with the same wording as the menu.
- **The rail is zone 5 and obeys the width budget** — one panel column per side (ruled).

## §6 · THE MARK IN THE TEXT — quiet, and NOT an underline
**A linked span needs a mark, and two standing findings rule out the obvious ones:**
- **NOT AN UNDERLINE** — **standing finding F2**: *underline belongs to the writer* (item 122 made
  `__word__` the writer's own mark). **A dotted underline is still an underline.**
- **NOT ORANGE** — orange is **tags** (item 108) and **selection** (item 122). **NOT OLIVE** — olive is
  **where you are.**
> **THE MARK IS A FAINT TINT ON THE WORDS THEMSELVES** — **Fable's lean, adopted, and it corrects this
> desk's first answer.** **His own words decide it: *"the linked text should be clickable"*, and a
> margin-only mark leaves the clickable words invisible.** *A tint is not an underline, so F2 holds.*
>
> **AND THE GUTTER MARK EARNS ITS PLACE IN EXACTLY ONE CASE: A NOTE WITH NO WORDS.** *A note taken at a
> caret has no span to tint, and §6b forbids putting a character in the text to stand for it — so the
> paragraph carries a gutter tick, and the note hangs off the paragraph.* **Words get a tint; a spot gets
> a gutter mark; nothing gets a glyph.**

### ⛔ §6b · THE SHAPE THAT IS FORBIDDEN — TUTOR's catch, verified in the drawing
**`wrizo-page-first.html` marks a note by inserting an element that CARRIES A CHARACTER:**
`m.className='nmark'; m.textContent='✎'; r.insertNode(m)`.
> **UNDER TRR14 THOSE CHARACTERS ARE SAVED INTO THE MANUSCRIPT.** **A mark may never be a character in the
> writer's text.** **Marks are CSS on a wrapping span; words live in the panel.**
**And the same rule answers the case the glyph was solving** (a note with no words): **the gutter, above.**

### ⛔ §6c · AND IN THE APP, THE MARK IS PAINTED — NOT WRAPPED
**The drawing wraps a span around the selection and calls `text.normalize()`.** *Lawful in a mock.*
**In the app the page is a live `contenteditable`, and wrapping is a DOM REWRITE of the writer's text —
the exact hazard `draftDecoration`'s RULE 1 names, in its own comment** (`store/draftDecoration.ts`,
rule 1 of four): *"A NON-COLLAPSED SELECTION IS LEFT ALONE. Redecorating rewrites `el.innerHTML` and then
restores a COLLAPSED caret — so running it while the writer has text selected destroys the selection."*
**A mark built as wrapper spans inside that surface inherits the hazard, and the connect gesture BEGINS
with a non-collapsed selection — which is the worst possible moment to rewrite the DOM.**
> **SO: the register COMPUTES the ranges; `CSS.highlights` + `::highlight(link-span)` PAINTS the tint.
> Painting touches no DOM, so it cannot disturb a selection, a caret offset, or the marker reveal.
> Nothing is inserted into the page, and `entry.text` is never touched.**

**⚠ STATED PRECISELY, BECAUSE THIS IS A SHARED DEPENDENCY AND NOT A BUILT ONE:** **item 145's brief
(merged) CHOSE this split, but its ratification is CONDITIONAL — `CSS.highlights` / `::highlight()`
appear NOWHERE in the tree**, and **Fable's condition is a measurement** (Electron 31's Chromium, the
web build's undeclared target, the Edge harness) **plus a plainly stated absent behaviour.**
> **SO EXPERIMENT 1 EITHER RIDES 145's MEASUREMENT OR TAKES IT — and it is the same measurement, done
> once.** *Whichever item gets there first records it for both; neither builds on an assumption.*
> **The absent behaviour here matches 145's recommendation (i): NO PAINT where the API is missing —
> the anchors and links still work, the rail still lists them, the words simply carry no tint.**
> *A DOM-rewrite fallback is refused for the reason 145 refuses it: it reintroduces the hazard the API
> was chosen to avoid.*

**⚠ AND ONE COLLISION, NAMED NOW RATHER THAN DISCOVERED: A TINT IS INVISIBLE UNDER SELECTION.** *Custom
highlights paint BELOW `::selection` (spec §4.2.4, and no priority lifts them above it), and item 122's
selection is OPAQUE brass.*
**THE SAME COLLISION IS ALREADY A QUESTION WITH NICK — item 145's Q-OV1, and it is OPEN.** *This brief
does not pre-empt it.*
> **WHAT EXPERIMENT 1 NEEDS IS WEAKER THAN WHAT 145 NEEDED, WHICH IS WHY IT SHIPS EITHER WAY:** *145's
> acceptance test REQUIRED a tagged term to stay legible under a selection; a link tint does not.* **The
> writer has just selected those words — the mark they need is the rail answering, not the tint under
> their own selection.** **It is only a defect if a RESTING page hides a mark, and a resting page has no
> selection.**
> **SO: whatever Nick answers on Q-OV1, Experiment 1 takes it and does not need it decided first.**

## §7 · THE HARNESS — `apps/desktop/scripts/harness/exp1.mjs`
Standing laws: **drivers never assume existence** · **real pointer events** · **release where the writer
releases** · **seed through the seams** · **absolute worktree path** · **select by name**.
1. **⛔ SWITCH OFF = v1:** with the experiment off, **no mark renders, no act appears, and the page's DOM
   is byte-identical to the pre-change build** on a seeded page. *(The claim §0 makes, asserted.)*
2. **Capture:** select words → Link → the anchor's `quote` is exactly the selection; **`entry.text` is
   unchanged, byte for byte.**
3. **Re-finding, one check per branch:** unchanged → found · the paragraph edited around it → moved ·
   **the same words three times → AMBIGUOUS and the rail says so** · **the words deleted → LOST, kept, and
   its link still opens.** *Branch 5 is the one that must not silently pick.*
4. **Menu:** Remove **unlinks** — the anchor and the target both still exist afterwards.
5. **Rail:** resting list sorts by recency and kind; **by tag GROUPS and prints its arithmetic**; clicking
   a span narrows to its sources; clicking empty text restores the list; double-click opens the right
   popup for each kind.
6. **Free Write:** the strip offers **connect and note, and no styling.**
7. **Both `HARNESS_PARKED` settings CLEAN; park count audited.**

## §8 · THE TWO-BUILDER SPLIT — where it cuts cleanly
| lane | builder | owns |
|---|---|---|
| **A — THE TEXT SIDE** | **PW** | span capture · the storage shape and **its two mapper lines** · **the re-finding algorithm and its five branches** · the right-click menu · the left strip's three acts + the audit · **the painted tint and the gutter mark** |
| **B — THE RAIL SIDE** | **TOOLS** | **item 190's Experiments switch** and everything it hides · zone 5 and the width budget · the Linked list (filter · sort · group-by-tag) · open (both popups) · remove/unlink |

**THE SEAM IS ONE MODULE, AND ONLY PW WRITES IT:** **`store/anchors.ts`** — `createAnchor`,
`addLink`, `removeLink`, `resolveAnchors(entryId)`, `getLinksForPage(entryId)`,
`getLinksForAnchor(anchorId)`. **B reads it and never writes through it.**
> **⚠ THE HAZARD, NAMED: two builders and one new module is how a double-write gets in.** *A writes; B
> reads. If B needs a write, it asks A for a function rather than reaching past the seam.*
**Both read the flag from ONE place** (`store/experiments.ts`), so "off" cannot be half-true.

## §9 · THE NOTE KEY — and ⚠ the part that needs the box
**His ask is `Ctrl+N`. In a browser that key belongs to the browser** (a new window), **and a page cannot
take it.** **In the desktop app it is ours** — Electron owns the window and can claim it.

| candidate | browser | desktop | cost |
|---|---|---|---|
| **`Ctrl/Cmd+Enter`** *(the confirmed stand-in)* | **free while focus is in the page** | free | not a mnemonic |
| **`Ctrl+N` in the desktop app only** | **impossible** | **his key** | **two keys to teach — the same app answers differently in two places** |
| a third key, e.g. `Ctrl+Shift+L` | **plausible, unmeasured** | free | `Ctrl+Shift+I/J/P/N` are taken; **`Ctrl+Alt+…` is AltGr on international layouts and is out** |

**RULED (Fable): `Ctrl/Cmd+Enter` EVERYWHERE, and NO desktop-only `Ctrl+N`.** *One key, both surfaces —
the two-keys option is closed, and this brief drops it.* **`Ctrl/Cmd+K` opens the link picker**, as
Fable's own drawing already binds it.
> **⛔ AND THE MEASUREMENT IS NOT DONE: "test candidates in the browser and the desktop app" IS A BOX
> RUN.** **This desk has launched nothing and will not take the box without a turn.** **The test, ready to
> run:** a page that logs `keydown` (key, code, ctrl/meta/alt/shift, `defaultPrevented`) in **Edge** (the
> harness browser) and **Electron 31**, over the candidate list, **plus one pass with a German or French
> layout active** to prove the AltGr finding rather than cite it. **Ask chat 1 for the slot.**

## §Q · FOR NICK
**⛔ NOTHING IN THIS BRIEF NOW GATES THE BUILD.** *EXP1-Q1, Q5 and Q6 are all answered — see the ruled
list below. No open question in this section stops a builder starting.*

**⚠ THIS SECTION NO LONGER HOLDS OPEN QUESTIONS.** *Q5 and Q6, as put to him and as ruled, moved to the
ruled list below on 2026-09-23. Kept here as a record of what was asked, not as a live ask.*
- ~~**EXP1-Q5 — OVERLAPPING ANCHORS**~~ *(new, from the pass on Fable's drawing)*. **Painting the mark
  makes overlap possible; the drawing's wrapping made it impossible** and refused it in words. **May a
  writer link a phrase inside an already-linked sentence?** **Desk's lean: YES**, with the rail listing
  what covers a spot. *For a book with a bibliography, quoting inside a sourced sentence is ordinary.*
- ~~**EXP1-Q6 — THE SPOT-NOTE'S GUTTER MARK**~~ *(new)*. A note taken at a caret has no words to tint, and
  **§6b forbids a character in the text**. **A tick in the margin beside the paragraph** — confirm.
  *Raised because it is the one mark this desk adds that he did not ask for, and it exists only because
  the glyph cannot stay.*

**RULED SINCE THIS BRIEF WAS WRITTEN — recorded here so the list is not re-asked:**
- **~~EXP1-Q1 — the schema.~~** **ANSWERED BY NICK, 2026-09-23: *"1. Yes"*.** **ONE additive nullable jsonb
  column, `journal_entries.page_links` (JS `pageLinks`), plus its FIVE EDIT SITES.** *`connections` is
  SUPERSEDED as the column's name — Fable ruled `page_links` on 2026-09-23; see §2.* **§2 is now a build
  instruction, not a proposal.**
- **~~EXP1-Q2 — Make a card with no board.~~** **RULED (Fable): it lands on the page's OWN PLAN BOARD,
  created quietly.** §4.
- **~~EXP1-Q3 — the mark.~~** **RULED (Fable): a FAINT TINT ON THE WORDS** — not an underline (F2 holds),
  not a gutter mark except for a spot-note. §6.
- **~~EXP1-Q4 — the key.~~** **RULED (Fable): `Ctrl/Cmd+Enter` EVERYWHERE**, no desktop-only `Ctrl+N`. §7.
- **~~EXP1-Q5 — overlapping anchors.~~** **RULED BY NICK, 2026-09-23, verbatim: *"1. Yes, go with the
  defaults."*** **This is a RULING, not a default — he was offered the skip and declined it.** **LINKS MAY
  OVERLAP, and the rail lists EVERYTHING covering a spot.**
- **~~EXP1-Q6 — the spot-note's gutter mark.~~** **RULED BY NICK, 2026-09-23, verbatim: *"1. Yes, go with
  the defaults."*** **This is a RULING, not a default.** **A spot-note shows A MARGIN TICK beside its
  paragraph.**

## §CO · WHAT IS NOT IN THIS BRIEF
**~~The pass on `wrizo-page-first.html`.~~ THE FILE LANDED** (47,395 bytes, 23:45) **and the pass is
written: `page-first-rail-pass.md`, offered beside this brief.** *It reads the drawing line by line and
finds five changes — one of which, the note glyph, is §6b's forbidden shape in the drawing's own code.*
**Two of its findings amend THIS brief and are already folded in above: the painted mark (§6c) and the
overlap it makes possible (EXP1-Q5).**

**STILL NOT IN THIS BRIEF:** **the five-zone mockup** — *Fable may redraw its own first, and this desk
holds the pencil until it says which of us draws it.* **And the note-key MEASUREMENT** — *the test is
written and this desk has launched nothing; it needs a box turn, which is chat 1's to give.*
