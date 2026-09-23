# THE DOUBLE PASS — THE ARCHITECTS' HALF
### PLAN desk · 2026-09-22 · **§6's questions A–G, and two architectures** · read against `283013e`

**SOURCE:** `wrizo-three-committees-review.md` (Fable, 2026-09-22), read in full at
`C:\Users\nickh\Downloads\`. **Nick's frame, verbatim:** *"a flexible architecture that can be heavily
modified as needed in the UI and tailored for any kind of writing project."*

**Reference render: `architecture-options-mock.html`** — **both architectures × three projects in
progress** (a thriller, an investigation, a dissertation), one scale. **In his Downloads.**

> **⚠ THE COMMITTEES ARE A THOUGHT EXPERIMENT, AND THE REPORT SAYS SO.** This pass treats every
> committee claim as **a hypothesis about writers** and every claim about **the code** as checkable.
> *Where they differ, the code is checked and cited; where a need rests only on a persona, it is marked.*

---

## §0 · THE FINDING THAT CHANGES THE SHAPE OF THE ANSWER

**Three of the four things the committees say are missing ALREADY EXIST IN THIS CODEBASE**, built for a
different surface and never promoted:

```
Project.fragments — "one privileged ordered path (the spine) plus branches and loose
fragments, joined by links — a rhizome as a data structure ... fragments are the
source of truth" (types/index.ts, the Fragment block)

interface Fragment { id; projectId; content: Run[]; role: 'spine'|'branch'|'loose';
                     spineOrder?; parentId?; links: FragmentLink[]; clusterId?; ... }
```

- **AN ORDERED SPINE** (`role:'spine'` + `spineOrder`, sparse float, cheap reorder) — **convergence 1.**
- **AN ADDRESSABLE UNIT BELOW THE PAGE** (a fragment has an `id`) — **convergence 3, the anchor.**
- **LINKS BETWEEN UNITS** (`FragmentLink { targetId, kind: 'bridge'|'magnetized' }`) — the academics'
  backlinks, the journalists' quote-to-source edge.
- And **`parentId`** for nesting — the outline's hierarchy.

**It is live in `Tutor.tsx` and `BeatWizard.tsx`, and its prose is derived by concatenating the unstruck
runs of the spine in order.** *So the bolder architecture below is not an invention: it is the promotion
of a model this app already trusts as a source of truth — from one project surface to the system.*
**That materially lowers the risk of the bold path, and it is the single most useful thing this pass
found.**

---

## §1 · A · PRIMITIVES — the candidate set, amended

**Offered:** Page · Record · Board · Spine · Tags · Links.
**AMENDED — five kinds, one modifier:**

| primitive | what it is | what exists today |
|---|---|---|
| **PAGE** | writing: prose and ink, with modes | `JournalEntry` (`pageType:'page'`) |
| **FRAGMENT** | **a part of a page with an identity** — the anchor | **`Fragment`** (spine/branch/loose) |
| **RECORD** | **a page that answers questions** — fields plus prose (source, character, citation) | *nothing; tags stand in* |
| **CONTAINER** | **a set of references with an ARRANGEMENT** | boards, projects, the Journal |
| **REFERENCE** | *this set shows that thing* · *this passage points at that passage* | `page-pin` (membership), `FragmentLink` |
| *(modifier)* **ARRANGEMENT** | **sequence · position · lanes · nesting · computed** | board canvas; `orderIndex`; `spineOrder`; system boards |
| **TAG** | a property you filter by | `JournalEntry.tags` |

**THE TWO AMENDMENTS THAT MATTER:**
1. **FRAGMENT is added, and it is the load-bearing one.** *Every need the committees raise below the page
   — a quote's provenance, a fact-check claim, a citation, an advisor's comment, a lifted passage, a
   scene heading, a lore contradiction — is the same need: **a thing that can be pointed at.***
2. **BOARD and SPINE are NOT two primitives. They are ONE CONTAINER with two ARRANGEMENTS.** *A board
   arranges by position; a manuscript arranges by sequence; an outline by sequence plus nesting; a
   storyboard by lanes; the Journal by a computed date.* **Item 172's "board type" is exactly this
   modifier, already chartered and already his word.**
3. **RECORD is a PAGE WITH A SCHEMA, not a separate species** — so it inherits anchors, tags, membership,
   search and the Trash for free. *A separate species would need all of those rebuilt.*

**GENRES BECOME PRESETS:** a preset is *(containers with arrangements) + (record schemas) + (a tag
vocabulary) + (a starting layout)*. **Nothing in a genre needs its own code path.**

## §2 · B · THE TWO ORDERS — one spine, and boards as views of it

> **THE RULE: A CONTAINER IS EITHER SOVEREIGN OR A VIEW. The manuscript's spine is sovereign; a plan
> board can be A VIEW OF IT. There is one set and one order; what differs is the arrangement.**

**The bridge already has a ruling: Q14 — *the board has its own READING ORDER*** (y then x, the order the
survey already uses). **A board that is a view of a spine writes its reading order back to the spine.**
- **The Plotter's missing step** (*"each scene card has to become a scene in the manuscript, in the order
  the cards are in, still linked to its card"*): the cards **are** the spine's members; reordering them
  reorders the manuscript, because it is one order.
- **The Pantser's move** (*"select pages → a board → turn that board's order into the manuscript's"*):
  **Promote to spine** — one act on a sovereign board.
- **The dissertation's outline is the same container, arranged as sequence+nesting** — so the outline's
  headings **are** the sections, not a description of them.
- **The Screenwriter's shape falls out of FRAGMENTS, not pages:** a screenplay is one page whose scene
  headings are fragments; the beat board's cards reference **fragments**, and reordering them reorders
  the scenes *inside the page*. **This is why the anchor is load-bearing: without it, the screenwriter's
  need has no home at all.**
- **DRIFT BECOMES IMPOSSIBLE where a view is used, and VISIBLE where it is not:** a sovereign board that
  merely *mentions* the same pages says so (*"not the manuscript's order"*), rather than silently
  disagreeing.

## §3 · C · REFERENCE VERSUS COPY

> **A CONTAINER SHOWS A REFERENCE BY DEFAULT. COPY IS AN EXPLICIT ACT THAT MAKES A NEW THING AND KEEPS
> ITS PROVENANCE.**

**This is already half-built and half-ruled**, which is the good news: **`page-pin` is a reference**
(*membership is not display* — item 125), and **item 123's copy-only ruling governs CARDS** — scratch
content a board owns.
- **So the rule divides cleanly by what the thing IS, not by the gesture:** **a page or a record is
  REFERENCED** (one source of truth, shown in many places — the Worldbuilder's character, the reporter's
  source, the academic's citation); **a scratch card is COPIED** (it is a thought, not a source).
- **The committees' warning is answered by steering, not by a new rule:** *"Wrizo has to steer lore into
  pages, not copied cards."* **The steer is one act — "make this card a page" — offered where a card
  starts to look like a source** *(it is referenced twice, or it is given a record schema)*.
- **⚠ AND IT NAMES A REAL GAP: a copied card keeps BOARD provenance** (`copiedFromBoardId`), **never
  SOURCE provenance.** A quote needs *who said it, when, on what terms* — **that is a RECORD's field set
  plus a FRAGMENT reference, not a card lineage.**

## §4 · D · ANCHORS — the smallest one, and what it unlocks

> **THE ANCHOR IS THE FRAGMENT: a paragraph-sized unit with a stable id.** Not a character offset (which
> every edit invalidates), not the whole page (which every committee says is too coarse).

**What one primitive unlocks, across all three committees:** a **quote** with its source · a
**fact-check claim** that can be walked one by one · a **citation** with page numbers · an **advisor's
comment** on a passage · the Memoirist's **lifted passage with a link home** · the Screenwriter's
**scene** · the Tutor pointing at a **sentence** instead of a page · and **linked mentions / backlinks**
(`FragmentLink` already carries the edge).

**The rules it needs, and they are small:** an id is **born with the paragraph and never reused** · a
**split** makes a new id and records its parent (`parentId` exists) · a **merge** keeps the elder ·
**deleting a paragraph leaves its references pointing at a stated absence** — *"the passage this quote
came from is gone"* — **never at silence.**

## §5 · E · THE FOUR GROUPERS — one sentence each, and what actually merges

| | one sentence | the question it answers |
|---|---|---|
| **DRAWER** | **where a thing is filed** — one per thing, and nothing holds a drawer | *where does this live?* |
| **PROJECT** | **what a thing is part of, in order** — a container arranged as a sequence | *what is this part of, and where in it?* |
| **BOARD** | **a set you can see together and arrange** — a container arranged by position | *what am I looking at together?* |
| **TAG** | **a property you filter by** — many per thing, no place, no order | *what is this about?* |

**WHAT MERGES: PROJECT AND BOARD ARE ONE PRIMITIVE WITH TWO ARRANGEMENTS.** *Their difference is not
what they hold; it is how they hold it.* **DRAWER and TAG do not merge** — one is a place, the other is a
property, and every committee's confusion was between the two in the middle.
**THE LEGIBILITY FIX IS THOSE FOUR SENTENCES, WHERE A WRITER MEETS THEM** — *the committees did not ask
for fewer groupers so much as for someone to tell them which is which.*

## §6 · F · REVERSIBILITY — and the measurement that decides it

**Both directions are computable, which is what weakens "types cannot change":**
- **position → sequence** uses **the reading order that is already ruled** (Q14, y then x). *Nothing is
  invented.*
- **sequence → position** must **invent x/y**, which is arrangement the writer did not author — **the one
  real cost**, and the reason his ruling was sound.

**THE TRADE, laid out as he asked:** *keeping the ruling* protects arrangement from being generated;
*relaxing it* lets a discovery writer start Default and become a Storyboard without leaving their work
behind. **A MIDDLE PATH EXISTS AND COSTS LITTLE — the report names it too:** *the type stays fixed, and
**"make a new board of type X from this one, carrying its contents" is always one act.*** **This desk's
lean: the middle path**, because it needs no reversal of his ruling and gives the Pantser the door.
*(Under the bold architecture the middle path is not even a special case: it is "show this set with a
different arrangement".)*

## §7 · G · IN-FLIGHT WORK — what fits, what pauses

| item | verdict |
|---|---|
| **166** no pop-out overlaps the page | **FITS — continue.** A layout law, independent of structure. |
| **169** split screen | **FITS — continue.** *Every committee asked for it in its own words* (notes beside draft, source beside draft). |
| **Shelf / Trash as rows** | **FITS — continue.** It is the **list view** nonfiction says it wants; a condition view is not an arrangement. |
| **177 / 178 / 179** page menu, lexicon, star | **FIT — continue.** |
| **108 / 143** tags | **FIT — continue**, and they carry more load in every architecture. |
| **THE RIGHT-CLICK MENU** | **FITS — CONTINUE.** *Verbs on things; it gains verbs under either answer, and loses none.* |
| **172 board types** | **THE FIELD FITS — the IMMUTABILITY PAUSES** (F). *Land the label he asked for; hold "cannot change after birth" until he rules the trade.* |
| **144 the tab bar** | **THE ROW FITS — its POPULATION question (MB-Q1) PAUSES.** *If boards become views of spines, "related" grows a new member, and the answer should be given once.* |
| **⛔ DUPLICATE** | **PAUSES — it IS question C in miniature.** *What a duplicated board carries — references or copies — cannot be answered before C.* |
| **165's presets** | **RE-GROUND.** Under the bold path a preset is a bundle (containers + schemas + tags), not a menu row. |
| **181 imports** | **RE-GROUND.** *"A source should stay a source"* (academics) against *"imports become Pages"* — **a RECORD is the answer both want.** |

---

# §8 · ARCHITECTURE ONE — **CONSERVATIVE: three additions to what is built**

**Nothing is renamed. Nothing migrates. Three things are added, each already half-present.**

1. **THE SPINE IS PROMOTED.** A project's chapter order becomes an explicit ordered list (today's
   `orderIndex` / `respread` pattern, which already exists for pages). **A board may be marked *the plan
   for this spine*; its reading order writes back.** One new relation, no new species.
2. **RECORDS ARRIVE AS A PAGE PRESET.** A page may carry a **field set** (source · character · citation),
   rendered above its prose. **Zero new primitive**, and it rides the entry's existing jsonb.
3. **ANCHORS ARRIVE AS PARAGRAPH IDS** on pages — *the Fragment model's id discipline, applied to the
   page surface* — enabling quotes, claims, citations and comments to point at a passage.

**MIGRATION STORY:** **there is none to run.** Existing boards stay boards; existing projects gain an
explicit order derived from what they already show; pages gain ids as they are edited (**absence means
un-anchored**, the house's own grammar). **Nothing a writer made changes shape.**

**WHAT IT DOES NOT SOLVE:** the four groupers stay four (the legibility fix is words, not structure); a
board that is *not* a view can still drift from the manuscript (it says so, but it drifts); genres remain
menu rows rather than configurations, so **each new genre is still a design conversation.**

**RULINGS IT ASKS NICK TO REVISIT — one:**
- **The Book type's date order** — *right for the Journal, wrong for a manuscript.* **A Book that is a
  view of a spine orders by the spine.**

---

# §9 · ARCHITECTURE TWO — **BOLDER: primitives plus presets**

**Five primitives (§1), one modifier, and genres as configurations.**

- **ONE CONTAINER PRIMITIVE** with an arrangement: **sequence** (manuscript, outline), **position**
  (table top), **lanes** (storyboard), **computed** (Journal, Shelf, Trash). **Item 172's types become
  the arrangement's name** — *his word, given a mechanism.*
- **A CONTAINER IS SOVEREIGN OR A VIEW** (§2) — the two-orders problem cannot occur inside a view.
- **RECORDS** carry the fields nonfiction and academia are built on; **FRAGMENTS** carry everything below
  the page; **REFERENCES** are the default and **COPY is an act**.
- **A PRESET IS A BUNDLE**: *Thriller* = a sequence container (the manuscript) + a position view of it +
  a character record schema + a tag vocabulary. *Investigation* = a sequence container + source and quote
  record schemas + a date-arranged container (the timeline) + fact-check anchors. *Dissertation* = a
  sequence+nesting container (the outline **is** the chapters) + citation records + a sources container.
  **No genre needs code.**

**MIGRATION STORY — and it is smaller than it sounds, because of §0:**
1. **The model is not invented — it is promoted.** `Fragment` (spine, links, parent) already exists and is
   already trusted as a source of truth on one surface.
2. **Boards and projects keep their rows.** A board reads as *container/position*, a project as
   *container/sequence*, the Journal as *container/computed-by-date*. **Absence of an arrangement means
   position** — today's behaviour, unchanged.
3. **Cards migrate LAZILY, or not at all.** A text card stays content the board owns. **A card only
   becomes a page when the writer promotes it** *(or when a preset creates it as one)*. **No sweep, no
   backfill, no risk to a writer's arrangement.**
4. **Records are new rows** with a schema id; **nothing existing becomes one.**
5. **The costly part, named honestly:** every reader of "a board" must learn to read "a container with an
   arrangement" — `BoardEditor`, the survey, the Plan menu, the tabs, the harnesses. **That is a wide,
   shallow change, and it is the price of the bold path.**

**RULINGS IT ASKS NICK TO REVISIT — four, stated plainly:**
1. **"Types cannot change after birth" (3b)** — under this architecture a type *is* an arrangement, and
   changing it is showing the same set another way. **The middle path (§6) satisfies most of the need
   without reversing him.**
2. **"Cards are copied, never moved" (item 123)** — **kept for cards**, but **reference becomes the
   default for pages and records.** *He may prefer one rule for everything; this asks for two, divided by
   what the thing is.*
3. **The Book type's date order** — as above.
4. **"A board is a container and no writing is made on a board"** — **unchanged in force**, but the word
   *board* becomes one arrangement among several. *If he wants "board" to keep meaning the table top
   specifically, the general primitive needs another name.*

---

## §10 · WHAT NEITHER ARCHITECTURE SOLVES — named, so nobody thinks it did
**Status and progress · word-count roll-ups · versions and snapshots · export and compile · PDF reading
and annotation · citation styles · audio and transcription · a story budget · search itself.** *These are
FEATURES, and both architectures make them possible; neither makes them exist.* **Search is the one the
committees lean on hardest** (*"retrieval over organization"*), **and it is ruled but unbuilt.**

## §Q · FOR NICK
- **⭐ ARCH-Q1 — which path?** **Conservative** (three additions, no migration, genres stay menu rows) or
  **bold** (primitives and presets, one container, lazy migration, four rulings to revisit)?
- **ARCH-Q2 — the anchor.** Both paths want **paragraph identity**. **It is the single change that unlocks
  the most across all three committees.** Ship it first, either way?
- **ARCH-Q3 — reversibility (F).** **The middle path** — the type stays fixed, and *"make a new board of
  type X from this one"* is always one act — **or types that change in place?**
- **ARCH-Q4 — records.** Do **sources, characters and citations** become **pages with fields** (this
  desk's lean), or stay tagged prose pages?
- **ARCH-Q5 — the four sentences (§5).** Approve them as the words the app teaches, or correct them.
