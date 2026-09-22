# ITEM 165 — THE PLAN MENU RESTRUCTURE
### PLAN desk · 2026-09-19 · brief · **absorbs 87 and 116** · **GATED ON 166 AND ON ITEM 172** · in parts (§9)

**WORKTREE:** `.claude/worktrees/i165-plan-menu` · **BRANCH:** `i165-plan-menu` · **OFF:** `origin/main`
**after 166 has merged.** **Never the primary checkout. This lane pushes its BRANCH.**

> **⚠ A WORKTREE ISOLATES FILES, NOT THE BOX** — read the box ordering on the ledger or ask chat 1
> before any run; never infer your turn from quiet.

> **⚠ SYMBOLS ARE THE ANCHOR.** Read at `4600d7f`; the notes at `b807f59`. Line numbers are a courtesy.

> **✅ PRIMARY TEXT — AUTHORIZED BY NICK, 2026-09-19.** His in-app notes (the PLAN NOTE, pages 1–2),
> **transcribed by Fable from his screenshots**, recorded at `b807f59`, and **authorized by him as
> primary** (*"If this is a rule violation, then I authorize it"*). **This brief is designed to those
> words and quotes them wherever it relies on them.**

> **⛔ AND IT NOW STANDS ON ITEM 172 — BOARD TYPES.** A board carries a **stored type**, and **a type is a
> display** (`item172-board-types-pass.md`). **Every entry in this menu resolves to (a type, its starting
> contents)** — §3.

> **⛔ §3's TABLE IS OVERTAKEN — `802a86e`: the founder SCRAPPED BOARD VIEWS, so 172-Q1 is dissolved and
> NEITHER reading A nor B applies.** **The table is kept as the record of what was weighed.** What
> survives it unchanged: **every entry still resolves to (a type, its starting contents)**, and **a board
> no longer switches displays.** **Two rulings from the same record bear directly on this menu:**
> **"Book is NOT offered" in Create Board** (*separate Journals maybe later; the menu's job is getting a
> writer creating fast, not organizing*) — **so §3's Book row is WITHDRAWN** — and **types cannot change
> after birth.** **Both are FABLE's READING with the verbatim pending; this brief marks them and does not
> redesign from a summary.**

**Reference render:** `plan-menu-mock.html` — the column at four window widths, the old canon beside
item 166's law.

---

## §0 · THE PRIMARY TEXT — Nick's PLAN NOTE, verbatim (typos his)

> *2) Directly under Plan in the popout menu, I would like these options listed in this order: Create
> Board, Outline, Story Structure, Organize Research. Each of these options should open a submenu with
> the following options: For Create Board---Default, Worldbuiling, Storyboard (will probably add a few
> more as we go). Each of these options should show a large thumbnail with a sample of how these board
> types may differ in appearance and use with a few words underneath about the purpose of the board
> (have the Experts review all content-related additions I'm suggesting throughout this revised Board
> build); Outline—Traditional, Mind Map, (open to suggestions from the Experts on other kinds of
> outlining/brainstorming that could be a type of "Board."); Story Structure—two sections divided into
> "Storytelling" and "Screenwriting" with three options for each listed underneath (have the Experts
> choose what should go there for now and what the large thumbnails/descriptions should be); Organize
> Research—Import Sources (which opens a window for the user to import docs/PDFs of their research and
> then redirects them to a Board that shows all of the imported docs as Pages), Bibliography (TBD how
> this will interact with the Page/imported sources, but lets table that for now. Just put the
> greyed-out option in the menu as a placeholder). In a new subsection under the Plan menu, give the
> option to "Connect Board" with a submenu that shows all available Boards in a scrollable window when
> necessary (make the scroll bar extremely minimal). And move "Connected Boards" to here and list Boards
> of any kind in the popout sub menu that have already been connected to that Page (like it is now). 3)
> Tags should be listed in the three dot menu, and if a user clicks on one of the tags, only Boards/Pages
> with that same tag should display have the thumbnail displayed until the user de-selects the tag. If
> they select more than one, then only Boards/Pages that have both should be displayed, and so on.*

*(Point 1 of the note is item 163 — the "Test Board" line — PW's. The note's first paragraph is item 166's
law and item 158's Tab.)*

---

## §1 · WHAT EXISTS — the desk's read at `4600d7f`

**The Plan menu is `PlanPanel`** (`CascadePanels.tsx`), the `'plan'` category of the rail's cascade:
**[BOARDS CONNECTED zone] · "Create a Board" · "Plot a Story"** (a loose page adds two hint lines).
- **"Create a Board"** → an **unborn, empty** board (`unbornHref({ kind: 'board', binderId })`). **A board
  has no kind field** — `pageType: 'board'` plus `systemKind` is all there is.
- **"Plot a Story"** → `StructureWizard` → **M1's StoryPlan** (per-DRAWER frameworks in
  `packages/modules-writing/data/frameworks/`: `three_act` 9 beats, `story_circle` 8, `save_the_cat` 15)
  → `BeatWizard` / `StructureBoard`.
- **Decks** (B3, `decks/library/`): **Three-Act Structure · Worldbuilding · Feature Screenplay (Save the
  Cat's 15 beats) · Thesis · Grant · Feature Story · Character Study**, via `DeckWizard`.
- **Board views** (BM1): **Open · Storyboard · Outline** — three projections of one structure
  (`seq` / `laneId` / `parentId` on `Box`). **No Mind Map.** The view is remembered per board
  (`wrizo-board-mode`).
- **Import:** paste-text only (`ImportDraft`). **No file input, no parser, no bibliography.**
- **The Boards Connected rows are text only** — no thumbnail. **The survey's "thumbnails" are CSS swatches**
  (`SurveyItem.image` is never set).
- **`⋯` menus:** a board row's (Open / Move or Copy / Delete). **No tags in any `⋯`.** Item 108 is unbuilt.

**⚠ TWO PLAN SYSTEMS, STILL.** BM1's S1 found StoryPlan **cannot** fold into the Storyboard view in v1 —
StoryPlan is per-drawer, a board pairs to a page; beat notes are strings, cards are positioned boxes;
frameworks have no add/reorder/delete API — **and deferred the fold to "its own later ticket." That ticket
was never opened.** *And the same structures already exist twice:* **three-act** is both a deck
(`threeAct.ts`) and a framework (`three_act.json`); **Save the Cat** is both (`featureScreenplay.ts`,
`save_the_cat.json`). **§7(c) and 165-F1.**

---

## §2 · THE STRUCTURE — top to bottom, in his order

```
PLAN                                     ⋯   ×      ← ⋯ holds the tags (§6)
  Create Board                           ›
  Outline                                ›
  Story Structure                        ›
  Organize Research                      ›
  ───────────────────────────────────────
  Connect Board                          ›      ← a submenu: every board (§5)
  CONNECTED BOARDS                              ← moved here, "like it is now"
    Board #2
    in Test Board
```

## §3 · EVERY ENTRY RESOLVES TO (A TYPE, ITS STARTING CONTENTS) — item 172 is the foundation

**Item 172 answers what his phrase "board types … differ in appearance and use" IS: a stored field, and
a type is a DISPLAY.** **Which of this menu's entries are TYPES and which are starting CONTENTS inside a
type is 172-Q1** — the same question that decides whether the Open / Storyboard / Outline tabs survive.
**This brief builds under either ruling; only the middle column moves.**

| his menu entry | **(A)** every display is a type *(desk's lean)* | **(B)** exactly his three types | starting contents |
|---|---|---|---|
| Create Board → **Default** | type Default | type Default | — |
| Create Board → **Worldbuilding** | type Default | type Default | the Worldbuilding deck |
| Create Board → **Storyboard** | **type Storyboard** | type Default, **view Storyboard** | — (one lane) |
| Outline → **Traditional** | **type Outline** | type Default, **view Outline** | — |
| Outline → **Mind Map** | **type Mind Map** *(unbuilt)* | a view *(unbuilt)* | — (165-Q3) |
| Story Structure → **the six** | **type Storyboard** | type Default, view Storyboard | a structure deck (**the Experts'**) |
| Organize Research → **Import Sources** | type Default *(172-Q5)* | type Default | the imported pages |
| Organize Research → **Bibliography** | **type Bibliography, greyed** | **type Bibliography, greyed** | — |
| *(not in his list)* **Book** | **type Book** | **type Book** | — · **172-Q2: does Create Board offer it?** |

*"will probably add a few more as we go"* — **the table grows; the shape does not.**
**Outline is also "open to suggestions from the Experts on other kinds of outlining/brainstorming"** (§8).

- **The board is born with its type written** — **ABSENCE MEANS DEFAULT** (172 §5). **Under (B) only**,
  the starting view is also written to BM1's per-board memory (`setBoardMode`); **under (A) there is no
  view to set.**
- **Each option's sample thumbnail wears its type's proportion** (172 §4) — **a Book sample is TALL.**
- **The deck deals through the existing `materializeDeck`.** Nothing forks a deck per view.
- **Every option creates the board in this drawer** (a loose page files into a new drawer first, as
  "Create a Board" does today), **born with its name field in focus** (item 136's ruling), **and travels
  there.**
- **Bibliography is a TYPE** (item 172: *"a unique style of Board"*), **greyed, and it sits where he put
  it in the menu** — under Organize Research. *Both facts are true at once: the type list holds it, the
  menu shows it there.*
- **⚠ "ABSENT, NEVER GREYED" has ONE founder exception, and it is Bibliography, by name** (*"Just put the
  greyed-out option in the menu as a placeholder"*). *Recorded so nobody cites the law against it, and so
  nobody cites it as precedent.* Everything else not built stays **absent** unless he names it (165-Q3).

## §4 · THE COLUMN — item 166 governs every submenu

- **Each submenu is a DRILL-IN in the Plan column** (166 R2) — it **replaces** the list, with **‹ Back**.
  **Never a second panel beside the first.** *His note opens by naming the violator: "the Open Board popout
  is overlapping the page."*
- **An option is one row:** a **LARGE thumbnail** — **the column's full width, wide** (*boards are wide*)
  — *"a sample of how these board types may differ in appearance and use"* — then its **name**, then **"a
  few words underneath about the purpose of the board."** **The thumbnail is a designed SAMPLE** — a
  drawing of the board (lanes; an outline's steps; a cluster) — **not a live render.**
- **The column is sized to the margin** (166 R1); **at the floor (~220px) a thumbnail is ~190px wide.**
  The list scrolls.

## §5 · CONNECT BOARD — a submenu — and CONNECTED BOARDS beneath it

**"Connect Board" is a row that opens a SUBMENU** (a drill-in): *"all available Boards in a scrollable
window when necessary (make the scroll bar extremely minimal)."*
- **It is item 144's list** (`BoardConnectList`) — **one component, one guard** — **in the direction that
  puts THE SUBJECT inside the chosen board**: the only direction a page has, so it means the same thing on
  a page and on a board. Its first line names the act: **"Put this page inside…" / "Put this board
  inside…"**.
- **Membership only — NOT displayed on the chosen board.** *Nothing arrives unbidden:* the chosen board is
  elsewhere, and its arrangement is its writer's — **PW1's page-side rule** (`pinPageToBoard`'s own
  comment: *"the writer has not chosen a position on that board's wall and the app must not choose one
  for them"*). *The tabs' ＋ displays, because there the writer is standing on the canvas that receives
  it.*
- **Rows:** every board with its **"in X"** line; **the scrollbar appears only when the list overflows,
  and is the thinnest the platform draws.** **Self and condition boards ABSENT; "already here" and "inside
  this board" (a cycle) present and inert, each saying why.**

**CONNECTED BOARDS — *"move 'Connected Boards' to here and list Boards of any kind … that have already
been connected to that Page (like it is now)"*:** **the existing PW1 rows, unchanged in behaviour** (a
press opens that board's cards — **now a drill-in**; double-click travels; `⋯` → Open / Move / Delete),
**with item 163's "in X" second line.** *The list beneath shows exactly what the act above makes.*
**"Boards of any kind"** — a board born from any preset is listed like any other. On a board, the list is
its **parents**; **its children live in the tabs (144) and in the survey's "Boards".**
*(A reading, noted not asked: "in the popout sub menu" could mean Connected Boards is itself a submenu.
"Like it is now" says it stays a list in the panel, and this brief keeps it there.)*

## §6 · TAGS IN THE `⋯` — ALL, over the menu's boards and pages

**His words decide what they act on:** *"if a user clicks on one of the tags, only Boards/Pages with that
same tag should … have the thumbnail displayed until the user de-selects the tag. If they select more than
one, then only Boards/Pages that have both should be displayed, and so on."*
- **The Plan panel's header gains a `⋯`**, beside its ×. **It lists the tags** — **item 108's ONE
  vocabulary** (never a second tag computation).
- **Selecting a tag narrows every list of boards and pages in the Plan menu** — Connect Board's, Connected
  Boards, the survey's Pages and Boards — **to those carrying ALL selected tags** (108's ruling, in his own
  words: *"both … and so on"*). **Deselecting widens it again.** **An empty result states itself in words.**
- **His sentence names Boards and Pages, not cards.** **Cards in the survey are left as they are** —
  *108's board filter governs cards on a canvas, with HOLD.*
- **Gated on 108** (the vocabulary, the filter component, the tokens) — **108's component, mounted once
  more; never a second filter.**

## §7 · WHAT FOLDS IN — and what his notes do not decide

**(a0) ⚖ RULED 2026-09-19 (Fable, accepting this desk's reading): ITEM 116 IS ABSORBED *IN PART*, AND
ITEM 181 CARRIES THE OTHER HALF.** **They are two acts, not one:**
- **IMPORT SOURCES (165, here):** research documents come in and become **PAGES** on a new board.
- **ITEM 181 (116's successor, with the fresher words):** *"Users should also be able to import
  images/docs onto a Journal 'board.' These files should open to full size when they are double-clicked
  on."* — **a file kept as a FILE, an object on a board, with a viewer.**
*So "superseded into 165" was right for the research half and wrong for the file half; 181 holds the
second, and 116 is marked absorbed-in-part rather than absorbed.*

**(a) ITEM 116 → Import Sources — HIS WORDS DECIDE THE MODEL:** *"opens a window for the user to import
docs/PDFs of their research and then redirects them to a Board that shows all of the imported docs as
Pages."* **Imports become PAGES** — not files kept whole with a viewer, as 116 first chartered. **Still
open (165-Q2):** a Page made from a PDF **holds its text** (layout and pictures do not survive — a parser
is a new dependency; zero schema), and **whether the original file is kept anywhere** (storage is server
and schema). **Lean: text only, originals not kept, in v1.**

**(b) ITEM 87 → recorded as "Create Board" — ⚠ BUT 87 WAS NEVER ABOUT BOARDS.** Its spec, verbatim (Nick,
2026-08-17): *"Anywhere that a user can create a New Page, they should be given a toggled set of options
that reveal themselves when 'New Page' is clicked: Free Write, Draft, Journal, Add to Board, Add to
Drawer…"* — **the New PAGE chooser.** **His Plan note does not mention it.** **Folded "as Create Board",
a founder spec retires without anyone saying so.** *The PATTERN plainly folds — a door that reveals typed
options.* **Whether the page chooser survives as the Page menu's own twin is his (165-Q1).**

**(c) "PLOT A STORY" IS NOT IN HIS LIST.** It is **the only door to M1's StoryPlan** — beat sheets per
drawer, whose milestones and coverage feed other surfaces. **Story Structure built on DECKS** (the board
system — the projection seam the house calls non-negotiable) **makes Plot a Story's removal orphan M1.**
**Story Structure built on FRAMEWORKS** keeps two plan systems visible in one menu. **This is architecture
— Fable's (165-F1).** **LEAN: decks;** Plot a Story's door **kept, at the foot of Story Structure and named
for what it is** (*"Plan the whole drawer — beat sheet"*), **until the StoryPlan fold ticket — which
should now be opened — reconciles M1's consumers.** *Never silently removed.*

## §8 · THE EXPERTS' REVIEW — TUTOR supplies the craft content

**His instruction covers MORE than Story Structure:** *"have the Experts review all content-related
additions I'm suggesting throughout this revised Board build."* **So TUTOR reviews every word and every
sample this build adds**; this desk fits them to the structure; Nick approves.
1. **Every option's "few words" and thumbnail sample** — Create Board's three, Outline's, Organize
   Research's, and anything added later.
2. **Story Structure — three under "Storytelling," three under "Screenwriting"** — *"what should go there
   for now and what the large thumbnails/descriptions should be."* For each: **name** · **a few words**
   (≤ 12) · **the ordered beats**, each with a **one-line prompt** · **the lanes** it projects into ·
   **which 3–5 beats the thumbnail shows** · **whether an existing deck or framework already IS it** —
   ***reuse, never a third copy*** (three-act and Save the Cat already exist twice, §1).
3. **Other kinds of "outlining/brainstorming"** (his words) — each stated as **(a) a preset of the existing
   Outline view** (sections → points → sub-points) **or (b) needing a new view** (a build, not a preset).
4. **Worldbuilding** — is the library's deck the right starting set?

**Every structure must be a DECK** — one structure description that projects in Open, Storyboard **and**
Outline (BM1 S4). *A structure that only works in one view is a per-view fork, which the seam forbids.*

---

## §9 · THE PARTS

| part | what | gate |
|---|---|---|
| **165-A** | the restructure: the four sections as drill-ins · the options that exist (Default, Worldbuilding, Storyboard, Traditional) · Connect Board's submenu + Connected Boards · Bibliography greyed | **166 merged · 172-Q1 ruled · the Experts' words for what ships** |
| **165-B** | Import Sources | **165-Q2**, then its own brief (a new dependency) |
| **165-C** | Story Structure's six | **the Experts' content + his approval + 165-F1** |
| **165-D** | Mind Map | **165-Q3** (a new view is a BM-class build) |
| **165-E** | tags in the `⋯` | **108 merged** |

## §10 · THE HARNESS (165-A) — `apps/desktop/scripts/harness/i165.mjs`

Standing laws: **drivers never assume existence** · **real pointer events** · **seed through the
seams** · **absolute worktree path** · **select by name**, never by index.
1. **The order:** Create Board, Outline, Story Structure, Organize Research, then Connect Board, then
   Connected Boards — **read by name.**
2. **Each option births a board** in this drawer **with its stated TYPE** (read it back from wherever 172
   §5 puts the field) **and deck** (lanes and card count as the deck defines), **name field focused**, and
   the route is the new board. **Under (B), the view is read from `wrizo-board-mode` instead.**
3. **Drill-in:** every submenu **replaces** the list in the same column; ‹ Back returns; **`i166.mjs`'s grid
   covers every submenu** (its roster grows by these).
4. **Connect Board:** its submenu lists every board; pressing one makes the subject a member,
   **`onCanvas: false`**; the board **appears under Connected Boards with an "in X" line**; self and
   conditions absent; the inert rows present, pressing them writes nothing; **with more boards than fit,
   the list scrolls; with fewer, no scrollbar is drawn.**
5. **Bibliography:** present, `aria-disabled`, pressing writes nothing.
6. **Mind Map and anything unbuilt: ABSENT** (unless 165-Q3 rules otherwise).
7. Both `HARNESS_PARKED` settings CLEAN; **park count audited** — PW1's checks that read "Create a Board"
   / "Plot a Story" by their old positions are **parks, not edits.**

## §Q · FOR NICK
- **165-Q1 — the New Page chooser (item 87).** Your 2026-08-17 spec gave **New Page** a set of options
  (Free Write, Draft, Journal, Add to Board, Add to Drawer). **Retire it, or give the Page menu's New Page
  the same treatment as Create Board?** **Lean: the same treatment** — one pattern, two menus.
- **165-Q2 — an imported PDF, as a Page.** You said imports arrive **as Pages**. **Lean: the Page holds the
  document's text** (its layout and pictures don't survive) **and the original file isn't kept** — or should
  the original be kept too (that needs file storage on the server)?
- **165-Q3 — Mind Map.** No mind-map view exists. **Build it** (a real design), **grey it** like
  Bibliography, **or leave it out until it's built?** **Lean: out until built.**
- **165-Q4 — SUPERSEDED BY 172-Q1**, where the same question is asked with its full consequences: is a
  board's display its TYPE, or can a board keep switching views?

## §F · FOR FABLE
- **165-F1 — two plan systems.** Story Structure on **decks** (lean) with Plot a Story's door kept at its
  foot, **and the StoryPlan fold ticket opened now** — or Story Structure on **frameworks**?

## §CLOSE
1. **His confirmation of the notes, and the Experts' words for everything 165-A ships.**
2. Build 165-A; `tsc` + `build:web` + selftest + full suite, **both settings**, green.
3. **Push the branch. Do not merge.**
4. **A FOUNDER SITTING IS OWED** — *"this is the menu I drew"* is his claim to make, against his own
   screenshots.

**Nothing deploys on this lane's word.**
