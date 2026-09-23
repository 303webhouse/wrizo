# WRIZO v2 — THE CONSERVATIVE ARCHITECTURE, AS EXPERIMENTS
### PLAN desk · 2026-09-22 · **his choice, designed** · the five zones · the switches · the pause lifted

> **⚠ SYMBOLS ARE THE ANCHOR.** Read at `13b5289`.

> **✅ HIS CHOICE, VERBATIM:** *"a Wrizo v2 that uses the conservative architecture that will allow me to
> experiment with this to see what's better and what I think has been lost from the original design."*
> **And how it ships, verbatim:** *"Experiments inside the real app approved"* — **a Settings section, one
> switch per piece, OFF BY DEFAULT, data HIDDEN NEVER DELETED when switched off.**

---

## §1 · THE FIVE ZONES — and the width budget, which is the hard problem

**His layout, verbatim:** *"The left-hand rail is the overall organization and options for everything the
User is writing or could want to write/organize. The right-hand rail is for all of the page-specific
sources, plans, resources, etc. The two-hand strips stay the same — the right for text styling, bullets…
the right-hand is the AI tutor + app automation that unblocks the writer."*
**⚠ Fable reads the first "right" as LEFT, and this desk builds on that reading** — *left strip =
presentation, right strip = Tutor.* **Confirmation pending; if he meant it as written, the two strips
swap and nothing else in this section changes.**

| zone | what it is | what it holds |
|---|---|---|
| **1 · LEFT RAIL** | **all organization** | Page · Plan · Drawers · Journal · Shelf · Trash · All Boards |
| **2 · LEFT STRIP** | **presentation** | styling, bullets, how the text looks |
| **3 · THE PAGE** | **the writing** | inviolable (item 166) |
| **4 · RIGHT STRIP** | **Tutor + automation** | the Counsel, "check claims", the unblocking acts |
| **5 · RIGHT RAIL** | **this page's own things** | its sources, its plan, related chapters/boards/cards |

### ⛔ THE BUDGET RULE — one column per side, and it is item 166 R2 generalized
> **A SIDE HAS ONE PANEL COLUMN. Everything that opens on that side opens IN it** — the rail's panels,
> the strip's panels, the Tutor's panel, the right rail's lists. **Nothing ever opens beside something
> else on the same side.**

*This is not a new law. It is 166 R2 — cascades drill in, never stack — applied once more, now to a
second side.*

**THE ARITHMETIC, from the house's own tokens** *(rail `--strip-width` 84 · `--frame-gap` 28 ·
`--frame-host-pad-x` clamp(16,3vw,40) · prose paper ≈615 at scale 1, 738 at 1.2 · screenplay 816 fixed ·
166's column floor ≈220)*:

```
  permanent LEFT  = rail 84 + strip ~44 + gaps ~20   ≈ 148
  permanent RIGHT = strip ~44 + gap 12               ≈  56
  BOTH COLUMNS FIT  ⇔  148 + FLOOR + page + 56 + FLOOR  ≤  viewport
```

| viewport · surface | both columns? | derived |
|---|---|---|
| **1366 · prose** | **YES** — ~107px spare, so both sit above the floor | 148+220+615+56+220 = **1259** |
| **1280 · prose** | **YES**, barely — both at the floor | **1259** ≤ 1280 |
| **1100 · prose** | **NO — one column**, at the floor | one side: **1039** ≤ 1100 |
| **1366 · screenplay** | **NO — one column** (the sheet is 816 and does not scale) | both: **1460** > 1366 |
| **1920 · prose** | **YES**, both well above the floor | 148+300+738+56+300 = **1542** |

**⚠ These are DERIVED from the tokens, ±30px, exactly as item 166's own table is. S0 measures them.**

### WHAT CLOSES WHEN SOMETHING ELSE OPENS
**Within a side:** the new panel **replaces** what was there (the drill-in, with ‹ Back).
**Across sides, when the budget allows only one:** **the side you just asked for OPENS, and the other
side's column COLLAPSES TO ITS ICON — visibly, and reversibly.**
- **LEAN: collapse, marked** — *the writer's act is honoured, and the thing that closed is still on
  screen as an icon, one press from returning.*
- **⚖ The rival, stated: REFUSE the new one with a reason** (*"Sources needs room — close the Plan
  menu?"*). Its case: nothing the writer opened disappears without them saying so. Its cost: the app
  answers a request with a question, at the moment of work.
- **Never silent, under either.**

### THE CHECK — `i166.mjs` grows a second axis
**Grid:** widths **{1100, 1280, 1366, 1440, 1680, 1920}** × surfaces **{prose, screenplay, journal,
board}** × requests **{none · left · right · both}**.
**Per cell:** `page ∩ column = ∅` · **the page's MEASURE unchanged** · when both are requested and the
budget fails, **exactly one column is open AND the collapse is visible** (an icon state, asserted by
name) · **coverage counted**: a cell that fails to open its column **FAILS**, never skips.

---

## §2 · THE EXPERIMENTS — the switch, and the order to build them in

**THE SWITCH'S LAW, from his words:** **one switch per piece · off by default · off HIDES, never
deletes.** *So every experiment is additive and ignorable in data — absence means off, which is the
discipline this house already uses for `onCanvas?`, `systemKind` and `seq`.*

> **⛔ AND THE CLAIM THAT MAKES IT SAFE, STATED SO IT CAN BE CHECKED: WITH EVERY SWITCH OFF, v2 BEHAVES AS
> v1.** **The existing suite passes unchanged with all switches off** — that is the acceptance test for
> the whole of v2, and it is the reason experiments may ship inside the real app at all.

**⚠ THE ORDER FABLE LISTED IS NOT THE DEPENDENCY ORDER, and this desk recommends changing it:**

| # | experiment | what it SHOWS | what OFF hides (data kept) | why here |
|---|---|---|---|---|
| **1** | **PARAGRAPH ANCHORS** | ids on paragraphs; the acts that point at one | the acts; **ids remain, invisible** | **everything below the page needs it** — and it makes a VERSION comparable (§6). *Fable listed it 4th; it is the foundation of 3 and 4.* |
| **2** | **THE BOARD SETS THE CHAPTER ORDER** (the promoted spine) | a board marked *"sets the order"*; reordering cards reorders the manuscript | the marker and the write-back; **the stored order remains** | **the spine's first job is a measured defect** (§7-4) |
| **3** | **RECORDS** | a field face above a page's prose (Source · Character · Citation) | the fields; **the values remain** | unblocks the **Bibliography** (TUTOR's seam 1) |
| **4** | **VERSIONS** | *Keep a version* and the version list | the list; **versions remain** | **needs anchors to compare below the page** (§6) |
| **5** | **THE RIGHT RAIL** | zone 5 — this page's sources, plan, related things | the zone; its contents live where they do today | it is **the window onto 1–4**, so it is most useful last |

*Each switch also names what it does NOT change: no experiment alters a route, a seam, a key, or search.*

---

## §3 · RE-HOMING — Fable's panels into the five zones

| from Fable's mockup | to | why |
|---|---|---|
| **the manuscript list** | **RIGHT RAIL** | it is *this page's* place in its book — page-specific by definition |
| **sources / related** | **RIGHT RAIL** | his own words for zone 5 |
| **versions** | **the PAGE's own menus** | a version is of *this page*, and the page menu (177) is where the page's own acts live |
| **paragraph acts** (quote · claim · cite) | **the RIGHT-CLICK MENU (186)** | they act on **a passage under the pointer** — 166 excepts exactly that menu |
| **"check claims"** | **the RIGHT STRIP** (Tutor) | it is automation that unblocks, not organization |
| *(unchanged)* All Boards, Plan, Drawers | **LEFT RAIL** | organization |

**One consequence worth stating: the right rail is not a second Plan menu.** *The left rail answers "what
do I have?"; the right rail answers "what does THIS page have?"* — **if a panel cannot say which of those
two questions it answers, it is in the wrong zone.**

---

## §4 · THE PAUSE LIFTS — three answers under Conservative

### (a) DUPLICATE — what each duplicate carries
*Conservative's rule decides it: **a page or a record is REFERENCED; a card is COPIED**.*

| duplicating | carries | does NOT carry |
|---|---|---|
| **a CARD** | its text/ink, its tags, **provenance** (`copiedFromBoardId`) — item 123, unchanged | — |
| **a PAGE** | its text, ink and **tags** · a name + " copy" | **its memberships** (a duplicate is on no board — membership is a statement about *that* page) · its star · **its anchors are NEW ids** (references stay with the original) |
| **a BOARD** | its **type** · its tags · a name + " copy" · its **cards as COPIES** · its **page-pins and nested boards as REFERENCES** (the same pages, the same boards) | **the "sets the order" mark** — *only one board may set a spine's order, or two boards fight over one truth* |

### (b) ITEM 172's IMMUTABILITY — **his ruling STANDS, and the middle path ships with it**
**Types cannot change after birth.** **And *"make a new board of type X from this one, carrying its
contents"* is always one act** — which is **Duplicate with a different type**, reusing (a)'s machinery
rather than inventing a conversion. *The discovery writer gets their door; the ruling is not touched.*

### (c) ITEM 144's POPULATION — **the RELATED set (option B)**
**Conservative keeps 144's charter**, so the row stays connected + sibling + tagged, in its stable order.
**Two marks join it:** a board that is **on the surface** (169's split) wears **⊞**; a board that is
**open but unrelated** is a **visiting tab**, dashed, for as long as it is open. **And a board that
SETS THE ORDER wears the spine mark** — *the one tab that is the manuscript's plan.*

---

## §5 · TUTOR's FIVE SEAMS — answered

1. **Bibliography needs Record.** **Yes, and it is experiment 3.** *Bibliography is a container of
   Citation records; it can be ungreyed the moment records land, and not before.*
2. **"From My Pages" needs the spine answer: does the board BECOME the order or SHOW it?** **It SHOWS,
   and then one press makes it the order.** *The preset gathers pages into a board that is **sovereign**;
   when the writer is ready, **"make this the chapter order"** promotes it.* **That is the honest promise
   for a discovery writer: arrange with no consequence, commit when you mean it** (§5b).
3. **Scene-card-to-chapter needs reference-versus-copy.** **A card that references a page IS a chapter
   the moment the spine holds it.** A scratch card becomes one through **"make this card a page"**, which
   keeps a reference to where it came from. *Nothing is copied on that path.*
4. **Quote provenance and citation need anchors.** **Experiment 1**, and **this desk adopts TUTOR's
   proposed acceptance test: the Memoirist's passage lifted into an essay with a link home.**
5. **165's amendment binds both halves.** **Agreed and adopted:** *getting a writer creating fast, not
   organizing* — **so no experiment is on by default, presets create rather than ask, and the right rail
   starts empty rather than demanding filing.**

### §5b · "FROM MY PAGES", against the spine
**Select pages → one act → a board of their cards, arranged.** *(The Pantser's missing step, and the
report's first "not yet thought of".)*
1. **Gather:** the board is created **sovereign** — it shows those pages, and says *"not the manuscript's
   order"*.
2. **Arrange:** cards move freely; nothing else changes anywhere.
3. **Commit:** **"make this the chapter order"** — the board's **reading order** (Q14, already ruled)
   becomes the spine's order, and the board wears the spine mark from then on.
4. **Reverse:** *"stop setting the order"* returns it to sovereign; **the order it set remains** — the
   manuscript does not spring back. *Committing is reversible; what it wrote is not undone by accident.*

---

## §6 · VERSIONS AND PARAGRAPH IDENTITY — designed together, as ruled
**A VERSION is a named snapshot of a page, kept and restorable.** **Anchors are what make it readable:**
with paragraph ids, a comparison says **"¶3 changed · ¶7 deleted · ¶9 is new"** instead of a wall of
character diff. *That is why Fable's instruction to design them together is right: without ids a version
is a blob; with ids it is a conversation about paragraphs.*
- **Where it lives:** the page's own menus (§3) — **"Keep a version"** and **"Versions…"**.
- **The acceptance test is the Pantser's, in his own words:** *"keep the old ending"* **without it
  cluttering anything.**
- **⛔ ONE STORAGE QUESTION, AND IT IS A SCHEMA QUESTION:** versions cannot live **inside** the page's own
  record — *that is item 181's trap in a second costume: every save would carry every version, and sync
  ships the record whole.* **They want their own rows**, which **STOPS at chat 1 and goes to Nick**
  (§Q-3).
- **OFF hides the list; the versions remain** — his rule, and the reason the switch is safe.

---

## §7 · THE REPORT'S FOUR ERRORS — as caught by the double pass
**Three are TUTOR's, checked against `origin/main`; the fourth is chat 1's measurement, confirmed here.**
1. **"A PDF is not an image" is called *"item 181's own named limit"* — that phrase is not in the
   ledger** (TUTOR). *What 181 carries is a live handoff, since answered: **116 absorbed in part, 181
   carries the file-as-object half.***
2. **The copy ruling is quoted under item numbers TUTOR could not verify** (3B / 123). *The mechanism is
   real — `copyCardToBoard`'s whitelist, "carry NOTHING by default; LIST what travels" — but the quoted
   phrasing is not the ledger's.*
3. **165's amendment is missing from the report's picture of the Plan menu** (TUTOR): **Book is NOT
   offered**, and the menu's job is *getting a writer creating fast* — *so the Pantser's objection to
   front-loaded choice is already partly answered on disk.*
4. **⭐ "Projects (binders) — ordered chapters" — THERE IS NO STORED CHAPTER ORDER** (chat 1's
   measurement). **`getBinderPages` sorts `updatedAt` DESC while ProjectHome and export sort `createdAt`
   ASC — two readers, two different orders, neither authored.** *This is convergence 1 on disk, it is
   worse than the report says, and it is experiment 2's first job.*

## §Q · FOR NICK
- **Q1 — the strips.** Your sentence says *"the right for text styling… the right-hand is the AI tutor"*.
  **Fable reads the first as LEFT** (presentation left, Tutor right) and this design is built that way.
  **Confirm, or say the word and they swap.**
- **Q2 — when only one column fits** (a narrow window, or a screenplay's fixed sheet): **the side you ask
  for opens and the other collapses to its icon** (lean), **or the app tells you it needs room and asks**?
- **Q3 — versions are a SCHEMA question.** They need their own rows rather than riding the page's record.
  **That is yours to clear before it is built.**
- **Q4 — the experiment order.** This desk recommends **anchors first** (Fable listed them fourth),
  because the spine, records and versions all read better on top of them. **Confirm the order.**

## §CO · COORDINATION
**Fable may redraw its own mockup in the five-zone layout first.** **This desk has NOT drawn the five
zones, and holds the pencil until Fable says which of us draws it** — *two drawings of one layout is how
a reader learns two layouts.* **The width budget above is the input either drawing needs.**
