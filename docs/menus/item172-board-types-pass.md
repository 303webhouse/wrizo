# ITEM 172 — BOARD TYPES — THE PASS
### PLAN desk · 2026-09-19 · **the foundation under 165, 144's tabs and VW3** · candidates + recommendations

> **⚠ SYMBOLS ARE THE ANCHOR.** Read at `b807f59`; **the ledger re-checked at `d87a230`.** Line numbers
> are a courtesy.

> **✅ PRIMARY TEXT.** Nick's answer 3, verbatim below — and **the three in-app notes are now PRIMARY
> TEXT** on his own authorization (*"If this is a rule violation, then I authorize it"*), recorded at
> `d87a230`. *The rule it does not touch, stated there: a founder may authorize a transcription; a desk
> may not decide one is good enough.*

**Reference render:** `book-type-mock.html` — a Book board beside a Default one: the flip, a card that
stays on its page, and the two proportions.

> **⛔ 172-Q1 IS DISSOLVED — `802a86e`, "THE FOUNDER SCRAPPED BOARD VIEWS": NEITHER READING A NOR READING
> B.** A writer **creates the kind of board they want and moves cards between boards** instead of
> switching a board's display. **§2's two proposals are KEPT BELOW AS SUPERSEDED TEXT** — they are the
> record of what was weighed — **and item 164 closes by dissolution, not by answer.** *The consequence
> chat 1 names and this desk does not assume: **the PROJECTION is not deprioritised under this ruling, it
> is what was scrapped** — what becomes of the built `StoryboardProjection` / `OutlineProjection` is the
> builders' question when the verbatim arrives.*
>
> **FOUR FURTHER RULINGS landed in the same record, and they answer questions this pass asked:**
> **TYPES CANNOT CHANGE AFTER BIRTH** (172-Q2's second half) · **cards on a Book's page are displayed and
> FULLY EDITABLE as on a board, with NO GREEN PIN** (bears on 172-Q6) · **page arrangement in a Book is
> PARKED, recorded not built** (172-Q3) · and via item 165, **Book is NOT offered in Create Board**
> (172-Q2's first half). **All are FABLE's READING; the founder's message arrived as a placeholder and
> the verbatim is pending, so each is marked and none is designed to.**

---

## §0 · THE PRIMARY TEXT — Nick, verbatim

> *"all boards are labeled as a "type" of board so that, in the future, as we make adjustments to types
> of boards (or want to display different types of boards differently), we don't have do it then. The
> board types are: Default (rectangular, open + blank surface, resembles a table top where other items
> like cards, pages, images, docs, etc. can be freely arranged and connected to each other; Book (the
> journal is a "Book" style board, which means that it gets displayed more like the pages of a book
> (vertical rectangle like the current Page surface), but what makes it unique is that when new pages are
> created, they become a new surface that gets flipped through like a book instead of being all laid out
> on a surface at the same time---cards should also be addable to the pages of a Book-style board, but the
> cards stay on the page they are added to); Bibliography to be figured out later, but it should be a
> unique style of Board---can stay greyed out until we build it)."*

**The sentence that sets the scope is the first one: *"so that, in the future … we don't have to do it
then."*** **This item's whole job is to put the LABEL on every board now**, so the app has somewhere to
hang differences later. *Most of what follows is about what the label may govern — but the label itself is
the deliverable, and it is worth landing even if every question below is answered later.*

---

## §1 · WHAT A TYPE GOVERNS — four things, and nothing else

> **A TYPE IS A DISPLAY.** It answers: **how this board shows what it holds**, and **what "adding" means
> here.**

| a type governs | Default | Book |
|---|---|---|
| **1 · how it SHOWS its contents** | all at once, on one surface, placed where the writer put them | **one page at a time, flipped** |
| **2 · what ADDING makes** | a card, a page card, an image or doc **on the table** | **a new SURFACE in the sequence** — and a card added **stays on the page it was added to** |
| **3 · what ARRANGEMENT means** (the signature of a container) | **position** — x, y, z on the table | **order** — the spine |
| **4 · its PROPORTION** wherever it is drawn | **wide** | **tall** — it shows a page |

**Everything else is common to every board and is NOT the type's business:** membership (125), nesting
and the cycle guard (128), naming (136/167), tags (108), connection (144's tabs), the Trash (168), the
Counsel, sync. *A type that started deciding those would stop being a display and start being a second
kind of thing.*

### ⚠ THE CANON, RECONCILED — a Book board is not a writing surface
**"A board is a container, and no writing or drawing is made on a board"** (three-space canon, `3d80a0f`).
**A Book board does not break it.** **The writing is still on the PAGE** — a surface, with its own record;
**the Book is the container that holds those pages and shows them one at a time.** *The flip is the
container's display of its members, exactly as the table top is Default's display of its members.* **A
card added to a Book's page is placed on that PAGE**, the way ink already is — **not on the board.**

---

## §2 · THE LIST OF TYPES — ⚠ THE ONE QUESTION THAT DECIDES THE OTHERS (172-Q1)

**Fable's (iii) and (v) are the same question**, and it is this: **is a board's DISPLAY its type, or can a
board keep switching displays?** Today a board carries three view tabs — **Open · Storyboard · Outline**
(BM1) — remembered per board in a browser-local map (`wrizo-board-mode`).

### ⬥ PROPOSAL A — **THE DESK'S LEAN: a type is a display, so every display is a type**

**Types: Default · Book · Storyboard · Outline · Bibliography** *(and Mind Map when it is built)*.
**The three view tabs are SUPERSEDED** — a board no longer switches displays; it *is* one.
**"Kinds" are then STARTING CONTENTS inside a type**, and every menu entry resolves to a pair:

| 165's menu entry | type | starting contents |
|---|---|---|
| Create Board → **Default** | Default | — |
| Create Board → **Worldbuilding** | Default | the Worldbuilding deck |
| Create Board → **Storyboard** | **Storyboard** | — (one lane) |
| Outline → **Traditional** | **Outline** | — |
| Outline → **Mind Map** | Mind Map *(unbuilt)* | — |
| Story Structure → the six | **Storyboard** | a structure deck (the Experts') |
| Organize Research → **Import Sources** | Default *(172-Q5)* | the imported pages |
| Organize Research → **Bibliography** | **Bibliography** *(greyed)* | — |

**Why:** *the reason 172 exists is "we want to display different types of boards differently."* **Lanes and
an indented document ARE different displays.** Calling them something else leaves the app with two
mechanisms for one idea — **a type that displays, and a view that also displays** — which is the
two-plan-systems shape the house already calls a constitutional defect.
**And BM1's seam survives intact:** *decks are data, renderers draw them.* **A type simply names which
renderer a board gets, instead of a tab switching between three.** `StoryboardProjection` and
`OutlineProjection` become the Storyboard and Outline types' renderers, unchanged in what they draw.

### ⬥ PROPOSAL B — **exactly Nick's three: Default, Book, Bibliography** (Fable's framing)

**Storyboard and Outline stay VIEWS of a Default board**, reached by the tabs as today.
**Its strongest case, stated properly:** **Nick's own definition of Default is "an open + blank surface …
where other items … can be freely arranged and connected"** — **lanes and an outline are arrangements of
things on a table, not different rooms.** The type list stays exactly as he wrote it; **one display to
build per type instead of five**; and **the projection idea he himself asked for in 2026-07-21 survives —
"one deck rendering as cards on a Storyboard and as an editable sectioned document in Outline"** — which
**Proposal A gives up**: under A, a writer who wants to see the same cards as an outline must make a
different board.
**Its cost:** *"display it differently" is then done by something that is not the type*, and a writer who
picks "Outline" from Create Board gets a Default board that draws itself as an outline — a type in
everything but the word.

**⚠ TWO DESKS NOW LEAN THE SAME WAY — WHICH IS NOT EVIDENCE.** Chat 1 opened 172 with the same conflict
and the same lean (*"Lean: A — B leaves the retired view tabs with nothing to become"*), and this desk
reached A independently. **Agreement between desks is not a measurement.** **What A gives up is written
above in B's own voice, and it is Nick's to weigh.**

### **THE DESK'S ANSWER TO FABLE'S (iii): AGREE, BUT ONLY UNDER PROPOSAL A — AND THE COST IS REAL.**
**What A gives up is the projection** — the same cards seen two ways. *That is not a small thing: it was
Nick's own example when Board Modes were designed, and BM1 built it.* **What A buys is one mechanism for
"how this board looks", which is what 172 asks for.** **B keeps both and pays by having two.**
**Nick's word decides. Neither reading is safe to assume.**

### MIGRATION — what a board with an existing outline view becomes (Fable asked; **under A only**)
**`wrizo-board-mode` is browser-local and never synced** — *so this population cannot be measured
centrally, and no server migration can read it.* **(Honest gap, named, not proxied — item 138's method.)**
1. **Absence means Default.** Every board without a stored type reads as Default. *(The same grammar as
   item 125's "absence means displayed".)*
2. **ONE-TIME, PER DEVICE, FIRST-WRITER-WINS:** on opening a board **that has no stored type**, if this
   browser's map holds `storyboard` or `outline` for it, **write that as the board's type.** A board that
   already has a type is never touched.
3. **⚠ The wrinkle, named:** two devices can disagree (each had its own view memory), and the stored type
   is synced — **last writer wins, and the writer may see a board settle as Storyboard on one machine.**
   *The alternative is honest and lossy:* **migrate nothing; every old board becomes Default and a writer
   re-picks once.** **Recommend the migration, with the wrinkle written into the build report.**
4. **After the release that migrates, `wrizo-board-mode` is retired** and its checks are **parked, never
   edited.**

**⚠ AND THE LEDGER'S OWN ADJACENT FACT IS THIS SAME ONE** (`d87a230`, item 164's S0): *"the view is
CLIENT-LOCAL, NOT SYNCED — a note for a later item, NO NUMBER YET."* **It has a number now: it is this
migration.** *A stored type is synced; the view memory it would migrate from is not. That asymmetry is
the whole of step 3.*

### ⚠ ITEM 164 DISSOLVES ONLY UNDER (A) — recorded because the ledger reads it as settled
**`d87a230` records 164's question as dissolving under 172.** **It dissolves under (A)**, where there is
no view to be sticky. **Under (B) the views remain, and 164's question is still live and still Nick's:**
*should the Plan door land on the canvas regardless of the board's remembered view?* **Neither desk should
close 164 until 172-Q1 is ruled.**

---

## §3 · THE BOOK TYPE — the design, and what it adds that nothing else has

**THE SPINE.** A Book's arrangement is its **order**. **Where membership is computed, the spine is the
condition's own clock** — the Journal's is **day written** (item 134, Nick: *"1. Written"*), and **VW3
already says not to tidy that.** **Where membership is authored** (a Book board a writer makes), **the
spine is the writer's arrangement** — drag to reorder (172-Q3).

**ADDING A PAGE.** *"when new pages are created, they become a new surface that gets flipped through."*
On a Book, **"New page" makes a page and puts it in the spine** — it does not lay a card on a table.
*(On Default, the same act makes a page card on the canvas — PW1's board-side rule, unchanged.)*

**CARDS ON A BOOK'S PAGE — new capability.** *"cards should also be addable to the pages of a Book-style
board, but the cards stay on the page they are added to."*
- **The card is still the board's `Box`**, with **one additive optional field naming the page it belongs
  to** (`onPage?: string`) — **zero schema** (boxes is jsonb), the same additive-optional discipline
  `onCanvas?`, `systemKind` and BM1's `seq`/`laneId`/`parentId` already follow.
- **Its x/y are already page-relative:** **every Box coordinate is a fraction of the surface's WIDTH on
  both axes** — *so a card carries to a page's surface with no new coordinate system.*
- **⚠ WHERE ON THE PAGE (172-Q6).** **Lean: on the page, where the writer puts it, the way INK already
  sits on a page** (items 121/126) — it never reflows the prose, and it may sit over it, because the
  writer placed it there. *The rival: cards live in the page's outer margin, so they can never cover a
  word. That rival is safer for the writing and weaker for the arranging — and this desk has not measured
  which a writer wants.*
- **A card on a page is NOT a member of the page** — it is the board's card, shown on that page.
  *(Membership stays the board's, item 125.)*

**THE JOURNAL, RE-GROUNDED (Fable's (ii)).** **The Journal is the first Book** — a system board whose
membership is computed (pages by date) and whose display is the Book's. **Two mechanisms become one:**
today the flip lives on the page surface (`JournalEntry.tsx`'s `notebook`, `prevPage`/`nextPage`) while
the Journal *board* renders a canvas of pins. **Under 172 the Journal board's display IS the flip.**
**VW3 is re-grounded, not rewritten** — its rulings hold and its retirement stands:
- **VW3 S1's flip motion becomes the BOOK TYPE's display**, not a Journal special case. **Keyed to the
  type, never to `systemKind === 'journal'`.**
- **VW3 S3's order** (`notebookKey = orderIndex ?? createdAt`) **is the Journal's spine**, unchanged.
- **VW3 S4's retirement of the Spread and `setNotebookPosition` stands** — *and 172 is the reason it is
  safe: the Book type's spine replaces the Spread's manual re-ordering with one rule per Book.*
- **NEW, and not in VW3: cards on the Journal's pages.** *It arrives with the Book type, so VW3 does not
  grow; it is the type's capability, and every Book gets it.*

---

## §4 · THE THUMBNAIL LAW, AMENDED (Fable's (iv))

> **BOARDS ARE WIDE. PAGES ARE TALL. A CARD WEARS ITS OWN PROPORTION.**
> **AMENDED: A BOARD WEARS THE PROPORTION OF ITS TYPE — AND A BOOK-TYPE BOARD IS TALL, BECAUSE IT SHOWS A
> PAGE.**

**One derivation, every drawing site:** the board-card on a canvas (`BoardPinBox`'s board face), the
survey's swatches, 144's tabs strip and connect list, 165's menu thumbnails. **A single
`boardProportion(type)`**, never a literal per site.

**⚠ CONSEQUENCE FOR ITEM 138 — routed to PW.** `pinPageToBoard` births a board-card **wide**
(`BOARD_CARD_W/H` = 0.32 × 0.10). **A Book board's card must be born TALL.** 138's ratified clause says it
**"keys to the ENTRY KIND (`pageType` of the pinned entry), never the box kind"** — **it now keys to
(`pageType`, and for a board, its TYPE).** **Existing cards keep their stored geometry** (138's
constrain-forward ruling, untouched).

---

## §5 · WHERE THE FIELD LIVES — Fable routes this to FIX's 136 S0; one observation from this desk

**The house already stores "what kind of board this is" with no schema at all:** **`systemKind` rides the
`board-meta` box** (the FX4 additive-meta precedent), inside `boxes`, which is one synced jsonb column.
**`boardType` fits the same slot exactly.**
**The trade, stated for whoever rules:** a **board-meta field** costs no migration and syncs with the
board's own record; **a column** (136's shape: nullable text, boot-time add-column, four server whitelist
edits) is **visible to SQL** — which matters only if the server must ever filter or count boards by type.
**Nothing does today.**
**⚠ THE LEDGER ALREADY RECORDS A LANDING** (`d87a230`): *"lands in FIX's item-136 schema batch as a
SECOND COLUMN beside `title`, IF the S0 says column — one migration wave, not two."* **This desk does not
contest the routing; it names one consequence that belongs in the choice:**

> **A COLUMN CARRIES THE SCHEMA STOP; A `board-meta` FIELD DOES NOT.** Every schema addition **stops at
> chat 1 and goes to Nick** — so putting the type in 136's batch **ties this label to a founder-gated
> migration**, while `board-meta` (where `systemKind` already lives) **could ship with the first thing
> that needs it.** *If the type is wanted early — and 165, 144 and VW3 all stand on it — that difference
> is the decision, not the storage.*

**LEAN: `board-meta`, precisely because it needs no gate. Fable and FIX rule.**
**Either way: ABSENCE MEANS DEFAULT**, and the type is written at birth for every new board.

---

## §6 · WHAT THIS CHANGES IN WORK ALREADY OFFERED

| item | change |
|---|---|
| **165** (Plan menu) | **Its menu entries resolve to (type, contents)** — §2's table. **Bibliography is a TYPE, greyed, reachable where he put it** (under Organize Research). **Create Board gains "Book"?** (172-Q2.) The submenu thumbnails wear each type's proportion. |
| **144** (board tabs) | **No change to the row.** The connect list's thumbnails **wear the type's proportion**; a Book board is a tab like any other. |
| **VW3** (the Journal) | **Re-grounded, §3.** Its rulings and its retirement stand. |
| **167** (card names) | Unchanged — **a card on a Book's page is numbered on its board**, like any card. |
| **168** (deletion) | Unchanged — **a page trashed from a Book leaves the spine; its cards are hidden with it and come back with it** (168 §3(c) already says this for memberships). |
| **169** (side-by-side) | **A Book beside a Default is the most likely pair** — worth naming in its charter when it is ruled. |
| **VW2 / VW4** (Shelf, Trash) | **Unchanged — a condition is not a type** (172-Q4). |
| **166** (no pop-out overlaps the page) | **Unchanged, and now sharper: a Book board's "page" is a page**, so the law protects it on its own terms. |

---

## §Q · FOR NICK

- **⭐ 172-Q1 — the list of types, which also decides the view tabs.** **(A)** every display is a type —
  Default, Book, **Storyboard, Outline**, Bibliography — and a board no longer switches views **(the
  desk's lean, and it gives up seeing one board's cards two ways)**; or **(B)** exactly your three —
  Default, Book, Bibliography — with Storyboard and Outline staying **views** a Default board switches
  between?
- **172-Q2 — Book in the menu.** Your Create Board list is Default, Worldbuilding, Storyboard. **Should
  "Book" be there too**, so a writer can make one (the Journal is one already)? **And can a board's type
  be changed after it is made?** *Lean: yes, but only where the arrangement translates — Default ↔
  Storyboard ↔ Outline — never into or out of a Book, whose pages are surfaces.*
- **172-Q3 — a Book's order.** The Journal's is **day written** (your ruling). For **a Book you make**, is
  the order **yours to arrange** (drag pages into the sequence)? *Lean: yes.*
- **172-Q4 — the Shelf and the Trash.** They show a **condition**, not a place. *Lean: they have no type;
  their display stays the condition view.*
- **172-Q5 — the imported-sources board** (Organize Research): a **Default** board showing all the
  imported pages at once *(lean — your words say "shows all of the imported docs as Pages")*, or a
  **Book** you flip through?
- **172-Q6 — a card on a Book's page.** Does it sit **on the page, where you put it** *(lean — the way ink
  does)*, or **in the page's margin**, so it can never cover a word?

## §F · FOR FABLE

- **172-F1 — a correction to the relay.** *"Q6's per-board view stickiness goes with them"* — **the
  per-board VIEW memory is BM1 S3's `wrizo-board-mode`**; **Q6 / PW7 is the PLAN SURVEY memory**
  (`wrizo-plan-last-board`: which board's survey reopens). **Only the first goes with the views; the
  survey memory is about the Plan menu and stays.** *(The same conflation sits in item 164's line, where
  FIX is about to measure — routed there too.)*
- **172-F2 — item 138** now keys a board-card's birth shape to the board's TYPE (§4).
- **172-F3 — where the field lives** (§5): `board-meta` needs no schema and already holds `systemKind`.
