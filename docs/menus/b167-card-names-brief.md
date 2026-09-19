# ITEM 167 — CARD NAMES AND NUMBERING
### PLAN desk · 2026-09-19 · brief · **extends item 136's naming model to cards** · zero schema

**WORKTREE:** `.claude/worktrees/i167-card-names` · **BRANCH:** `i167-card-names` · **OFF:** `origin/main`.
**Never the primary checkout. This lane pushes its BRANCH.**

> **⚠ A WORKTREE ISOLATES FILES, NOT THE BOX** — read the box ordering on the ledger or ask chat 1
> before any run; never infer your turn from quiet.

> **⚠ SYMBOLS ARE THE ANCHOR.** Read at `4600d7f`; the notes at `b807f59`. Line numbers are a courtesy.

> **⚠ PRIMARY TEXT — PENDING NICK's ONE-WORD CONFIRMATION.** His CARD NOTE, **transcribed verbatim by
> Fable from his screenshots**, recorded at `b807f59`. **Designed to those words.** If his confirmation
> changes a word, this brief is re-checked before anything is built.

---

## §0 · THE CHARTER — Nick's CARD NOTE, verbatim

> *"Also, I can't change the name "Card." I should be able to click on that title and rename it. Also,
> each new blank card should be numbered to distinguish them (Card 1, Card 2, Card 3...)"*

**Fable's relay:** *"item 133's control, third surface … Box gains an additive optional title, zero
schema; reconcile with 136's stand-in rule so cards and pages share one naming model."*

**Three things his words fix:** **the name he cannot change is the word "Card"** — the opened card's
label (*"when a card is opened"*, the note's own opening); **numbering is for NEW BLANK cards**; and **its
purpose is "to distinguish them."**

## §1 · WHAT EXISTS — the desk's read at `4600d7f`

- **`Box` has no title, name or label** (`types/index.ts`, `interface Box`). **`Box.seq` IS TAKEN** — BM1's
  cross-view order. *The numbering field cannot be called `seq`.*
- **A plain card shows no title anywhere on the canvas** (`BoardTextBox` renders its whole text). **The
  opened card (`BoardCardPopup`) shows a hard-coded eyebrow — the literal word `Card`.** **That is the
  name he could not change** — his note says so.
- **A blank card is born with `text: ''`** (`onAddCard`) and **persists at once** — it has a position the
  moment it exists.
- **Deck cards** carry their title as their **first line** (`materializeDeck`: `title\nbody`).
- **Labels elsewhere read the first line:** `boxLabel` (the connections footer and the Storyboard/Outline
  labels), `boardCardItem` (the survey — falling back to **"Untitled"**).
- **Item 133's control** is the board's crumb rename — a button that becomes an input; Enter or blur
  commits; Escape cancels; **empty reverts** (no title field existed to unset).
- **Item 136 is NOT built:** no stored `title` on `JournalEntry`. **Ruled for it:** the stand-in is
  `boardName`'s rule (first non-empty line, trimmed, 60 cap); **an empty commit UNSETS the title and the
  stand-in returns** (Fable, flagged for Nick's veto); **"Untitled" does not exist as a default name**
  (Nick: *"my answer is 'No'"*).
- **`copyCardToBoard` copies an explicit list of fields.** *A new field that is not added to that list
  silently does not travel with a copy.*
- **The one numbering precedent:** lanes, named `"<default> <lanes.length + 1>"` — **count-based, so a
  number is REUSED after a deletion.**

---

## §2 · THE RECONCILIATION — ⚠ Nick's two rulings pull against each other

**For pages, Nick refused a default name:** *"if you haven't written anything, there is nothing to save."*
**For cards, he asks for one:** *Card 1, Card 2…*

**They do not contradict. The difference is when each thing is BORN:**
- **A page is born by WRITING.** An unwritten page is unborn — the app keeps nothing — so there is
  nothing to name.
- **A card is born by PLACING.** A blank card has a position on a board the moment it exists, so it
  already *is* something, and it needs a handle to be found by — in the survey, the tabs' strip, the
  Trash (item 168).

**So the one model — item 136's — holds for both, and only the STAND-IN differs:**

> **A thing's name is its stored title; without one, its STAND-IN.** An empty commit unsets the title and
> the stand-in returns. **Pages and boards stand in with their FIRST WORDS. A card born blank stands in
> with its NUMBER.** *(A card born with words — dealt from a deck, ported, copied — keeps its first words,
> as every list shows it today: S2, S5.)*

**Why the stand-ins differ — recorded so nobody "unifies" them later:** a page's first words are its best
name **because nobody sees them beside the name** (a list shows the name alone). **A card's words are
always on its face, right below its name** — a first-words stand-in would print the same line twice. *The
number is the name that does not repeat the card.*

### ⚖ THE RIVALS, IN THEIR STRONGEST FORMS (167-Q1)

**(A) FIRST WORDS FOR CARDS TOO — one stand-in everywhere.** Its case: **"Card 7" tells a writer nothing;
"The crypt nobody mentions" tells them everything**, and lists — the survey, the strip, the Trash — are
where names do their work. Only a blank card shows its number. **Its cost:** the name changes as the
writer types, and the opened card would show its own first line twice — as its name, and as its text.

**(B) STORE "Card 3" AS THE TITLE AT BIRTH** — the Photoshop/Figma pattern ("Layer 1", "Frame 1"). Its
case: **the most literal reading of Nick's words**, one stored name that never moves, zero cleverness.
**Its cost:** it writes a default name the writer did not choose — **the very thing he refused for pages** —
and an empty commit can no longer "return the stand-in", because the stand-in was stored.

**LEAN: (C), THE NUMBER AS THE CARD'S STAND-IN** (§2's model) — **and his own purpose, "to distinguish
them," is what a number does and a first line may not** (two cards can open with the same words; no two
share a number). *Its unmeasured risk, named against it:
this desk does not know whether Nick expects a card that has words but no name to show "Card 3" in a list
(C) or its first words (A). The survey shows a thumbnail with the words beside the name, which softens
(C)'s cost — but that is an argument, not a measurement. The sitting settles it.*

---

## S1 · THE FIELDS — additive, optional, zero schema
- **`Box.title?: string`** — the writer's name for the card. Absent → the stand-in.
- **`Box.cardNo?: number`** — **the card's birth number on its board. Assigned once, at birth, and never
  reused:** `1 + the highest cardNo ever on this board` — **not `count + 1`** (the lanes' precedent),
  *because a reused number makes two different cards answer to "Card 2" across a deletion, an undo, or a
  Trash restore.* **Kept on the board-meta box as a high-water mark** (`cardNoNext?`, the FX4
  additive-meta precedent) **so a deleted card's number is never handed out again.**
- **Both ride `boxes` (jsonb) — zero schema.** **Both are added to `copyCardToBoard`'s explicit list:**
  **the title TRAVELS with a copy** (it is the writer's); **the number does NOT** — a copy is born on the
  target board (S2 says when it takes one).

## S2 · WHO GETS A NUMBER — *"each new blank card"*
- **Cards BORN BLANK:** the "New Card" / "Add card" path (`onAddCard`) and **an ink card, which is born
  blank** — **assigned at birth.**
- **Cards born WITH CONTENT are not numbered:** a deck dealt (its title is its first line), a port, a
  copy. **They already have something to be told apart by**, and his words number the blank ones.
  *(A copy of a card that is still blank is itself born blank: it takes the target's next number.)*
- **Never numbered:** `'page-pin'` (a page card or a board-card — **named by what it points at**, a
  membership, not a card) · `'connection'` · `'board-meta'`.
- **⚠ CARDS THAT EXIST TODAY GET NO NUMBER** (constrain forward): **167 governs what the app creates, not
  what the writer already made** (item 138's band, applied). **An existing card's stand-in stays its first
  words**, exactly as every list shows it today. *Numbering them on first read would be the app writing
  into the writer's work on its own authority.* **(167-Q2.)**

## S3 · ONE FUNCTION
**`cardName(box)`: `title` → `Card {cardNo}` → the first words (a card with no number) → the kind word**
(`Card`, or `A sketch` for ink — a card with no number and no words). **On a board with
existing cards, the first new card is still "Card 1"** — numbers count births since 167, not cards. **"Untitled" never appears** (Nick's ruling). **Every site that labels a card routes
through it** — `BoardCardPopup`'s eyebrow, `boxLabel`, `boardCardItem`, the Outline and Storyboard
labels, **144's strip, 168's Trash.** *S0 censuses the sites; one fact, one derivation.*

## S4 · THE CONTROL — item 133's, a third surface
**The opened card's eyebrow becomes the name**, pressable: **a button that becomes an input** — exactly the
board crumb's shape. **Enter or blur commits · Escape cancels · an empty commit UNSETS the title** (the
stand-in returns — item 136's ruling (4)=(a), which 133 could not use because it had no field to unset).
**Build the control once and mount it on both surfaces** — *two rename controls that behave differently
is the thirty-derivations problem arriving at the gesture.*

**⚠ WHERE ELSE THE NAME SHOWS — 167-Q3.** **On the card's face on the board?** Lean: **no** — the face
already shows the card's words, a pressable name on the face fights the card's own press-to-select and
drag, and the number is visible where cards are listed. *The rival: a name you can only see by opening
the card is half a name.*

## S5 · DECK CARDS — a named limit, not a fix
Deck cards keep their title **inside their text** (first line). **167 does not rewrite `materializeDeck`**
(BM1 kept the seven decks byte-identical, and new deck cards would change shape). **New deck cards are
numbered like any card; their title stays their first line.** *If Nick wants a deck card's heading to
become its name, that is a deck change and its own item.*

---

## S6 · THE HARNESS — `apps/desktop/scripts/harness/i167.mjs`
Standing laws: **drivers never assume existence** · **real pointer events** · **seed through the
seams** · **absolute worktree path** · **select by name**.
1. **Numbering:** three blank cards read **Card 1, Card 2, Card 3**; delete Card 2; add one → **Card 4,
   never Card 2.** Reload → the same numbers. **A deck dealt adds no numbers.**
2. **Rename:** press the eyebrow → type → Enter → the name shows in the popup **and** in the survey.
   **Empty commit → "Card N" returns.** Escape → nothing changes.
3. **A copy:** the title travels; a copy with words has no number; a copy of a blank card takes the
   target's next.
4. **Existing cards:** a card seeded without `cardNo` shows its **first words**, and **no write happens
   on read** (its stored box is byte-identical after the board opens).
5. **Never "Untitled":** no card label anywhere renders the string.
6. **One function:** a static assertion that every card-label site calls `cardName` (the census from S0).
7. Both `HARNESS_PARKED` settings CLEAN; **park count audited** — checks that read the literal eyebrow
   `Card` or `"Untitled"` in the survey are **parks, not edits.**

## §Q · FOR NICK
- **167-Q1 — a card with words but no name:** in a list, **"Card 3"** (lean — the number is the card's name
  until you give it one) **or its first words?**
- **167-Q2 — cards you already have:** they keep **showing their first words** (lean — the app never
  numbers what you already made), **or should they be numbered too?** *Under the lean, the first new card
  on a board you already have is "Card 1", however many cards it holds.*
- **167-Q3 — the card's face:** is the name **only in the opened card and in lists** (lean), **or also on
  the card on the board?**

## §CLOSE
1. **Nick's notes checked against §0 first.**
2. S0 census of card-label sites; build S1–S5; `tsc` + `build:web` + selftest + full suite, **both
   settings**, green.
3. **Push the branch. Do not merge.**
4. **A FOUNDER SITTING IS OWED** — *"I can tell my cards apart and name them"* is a meaning claim.

**Nothing deploys on this lane's word.**
