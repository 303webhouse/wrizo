# ITEM 177 — THE PAGE MENU RESTRUCTURE
### PLAN desk · 2026-09-20 · brief · **GATED ON 166** · **designs AROUND item 170, which is built**

**WORKTREE:** `.claude/worktrees/i177-page-menu` · **BRANCH:** `i177-page-menu` · **OFF:** `origin/main`
**after 166 has merged and 170 has landed.** **Never the primary checkout. This lane pushes its BRANCH.**

> **⚠ A WORKTREE ISOLATES FILES, NOT THE BOX** — read the box ordering on the ledger or ask chat 1
> before any run; never infer your turn from quiet.

> **⚠ SYMBOLS ARE THE ANCHOR.** Read at `6e556e2`; item 170 read on `item170-open-a-page` @ `c1cf8d0`.

> **✅ PRIMARY TEXT — Nick's own words, pasted by him and byte-checked into the record** (`55cf81c`,
> part 1). **Quoted in §0 and governing throughout.**

**Reference render:** `page-menu-mock.html` — the six sections in item 166's column, with the two
drill-ins and the three conflicts drawn where they bite.

---

## §0 · THE PRIMARY TEXT — part 1, verbatim (typos and numbers his)

> *"1. OK, let's organize the Page menu this way from top to bottom (only applies when a user is already
> on a Page surface): "Current Page" with the name underneath (Superscript subtitle: Current Page with
> "Untitled" as the default name---users should be able to edit the title of the page directly from this
> menu interface or from the title bar at the top of the page); Add to Board (opens a dropdown that
> begins with "Create Board" followed by a list of existing boards with their tags); Add Tag(s)---each
> previous tag should also be visible and removable from this menu interface; A new section called "Open
> Pages," that has a scrollable list of the last three pages created/edited that's also sortable by tag or
> by board or by drawer; a third section called "Page Settings" that opens a dropdown menu with the
> current "Page Setup" options that should also include font settings--limited typeface options with the
> option to add fonts, font size, and line spacing; a final section with the "New Pages" button."*

*(The NOTE that follows it in his message is items 178 — "Pages" as the term — and 179 — starring beside
the title, starred first. They are named here only where this menu touches them.)*

---

## §1 · WHAT EXISTS — and the one section that is ALREADY BUILT

- **The Page menu is `PagePanel`** (`CascadePanels.tsx`), the `'page'` category of the rail's cascade:
  today it holds **"New Page"**, and **on a board only**, `PlacePageOnBoard` ("Place page on board").
- **⛔ ITEM 170 IS BUILT AND OFFERED** (`item170-open-a-page` @ `c1cf8d0`, 92/92 both legs, Batch Four).
  **Its re-scope IS this menu's OPEN PAGES section:**
  - **the section is OPEN PAGES**, the writer-facing term is **Pages**;
  - **three rows VISIBLE, scrolling through the rest — a viewport, not a cap;**
  - **recency by EDIT, not birth** · **starred pages sort first under every sort** (item 179);
  - **one derivation for the row** (`itemTitle`, the Journal lists' own) · **boards excluded** ·
    **on every surface**, not only boards; **placing on a board is the row's secondary act**, behind `⋯`.
  - **The sorts (tag · board · drawer) follow; the opening shipped first.**
  **FIX's own words: *"The menu's ORDER is not mine. Nick fixed it … and PLAN DESK designs that menu."***
- **The page's own face** (`PageFace`) already carries: **the title as a reachable control**
  (`onReachName`, item 133), **tags** (`wz-pageface-tags`), **"Pin to a Board…"** (`PinToBoardSheet`), and
  the rail's **"Also connected to…"** checkboxes (`PlacesPanel`).
- **Item 136 is NOT built** (no stored `title`); **item 143's tag controls and item 108's vocabulary are
  NOT built**; **item 165's `BoardConnectList` is designed, not built.**

> **THIS BRIEF ADDS NO SECOND VERSION OF ANY OF THOSE.** *Open Pages is FIX's; the board list is 165's;
> the tag controls are 143's; the name is 133's control over 136's field.* **177 is the MENU — its order,
> its sections, and the three places his text collides with something already ruled.**

---

## §2 · THE SIX SECTIONS, top to bottom (his order, unchanged)

### 1 · CURRENT PAGE — **and which element is the superscript (difference 2, answered)**
**The NAME is the element; "Current Page" is the small label above it.** His parenthesis — *"Superscript
subtitle: Current Page"* — reads as the **label** being the superscript subtitle, and the page's **name**
being what the section is about. **So: a tiny uppercase `CURRENT PAGE` label, the page's name beneath it
in full size, editable in place.**
- **Editing here and in the title bar are ONE CONTROL** (item 133's shape: a button that becomes an
  input; Enter or blur commits; Escape cancels). **Two mountings, one behaviour** — *a name that can be
  edited in two places must be edited the same way in both.*
- **⚠ CONFLICT (i) — "Untitled" as the default name. THE DESK'S READING, FLAGGED FOR HIS VETO:**
  **the menu shows "Untitled" only as a PLACEHOLDER for a page with nothing written yet — it is never
  stored, and it is not the page's name.** *That satisfies both texts: 136's ruling was that "Untitled"
  does not EXIST as a default name (nothing is written, so nothing is saved), and this menu still has to
  print something in a row for a page that has no words yet.* **If he means it to be the stored default,
  136 is reversed and 167's "'Untitled' never appears" goes with it — his call, not this desk's.**

### ⭐ ITEM 179's PLACEMENT HALF LIVES HERE (Fable, 2026-09-20)
**Item 170 shipped the SORT half — starred pages first, under every sort. The PLACEMENT half is this
brief's**, because this is where the name lives.

**Nick:** *"starring a page should be moved to be an option that is right next to the title of the page
and starred pages should come up first when a user filters their pre-existing pages."*

- **WHAT EXISTS:** the star is **already built and already sticks** — `PageFace`'s `wz-pageface-star`
  (`onToggleStar`, `entry.starred`, `pageFaceStar` / `pageFaceStarred`). *179 MOVES a control; it does not
  invent one.* **`entry.starred` is unchanged — zero schema.**
- **WHERE IT GOES: immediately AFTER the page's name, in both places it is written** — **the title bar on
  the page**, and **this menu's Current Page section.** **Trailing, never leading:** *a star before the
  name would put a mark where the writer's eye goes for the word, and the name is what they came for.*
- **ONE CONTROL, TWO MOUNTINGS** — the same discipline as the name itself: *starred is starred, and it
  looks and behaves the same in the menu and on the page.*
- **IT IS ALWAYS PRESENT** (hollow when unstarred, filled when starred), so **the title's position never
  moves** when a writer stars a page. *A control that appears on state shifts the thing beside it.*
- **COLOUR: the filled star is BRASS** — *the writer did this* — **and never olive**, which marks where
  you are, not what you chose. The hollow star is `--text-low`.
- **WHAT IT DOES NOT DO:** it does not file, pin, connect or affect membership; **and it does not sort —
  170 already does** (`starred first`, under every sort). *One mark, one meaning: **this one**.*
- **⚠ SO ITEM 179 IS SPENT:** **its sort half SHIPPED in 170; its placement half is designed here.**
  *An item with nothing left is closed with its halves named, not left open as a heading.*

### 2 · ADD TO BOARD — *"a dropdown that begins with 'Create Board' followed by a list of existing boards with their tags"*
- **It is item 165's `BoardConnectList`, the page mounting** — *the subject goes inside the chosen board* —
  **with a "Create Board" row first.** **One component, three mountings** (the board tabs' ＋, the Plan
  menu's Connect Board, and here). **No second list.**
- **Membership only, NOT displayed on the chosen board** — PW1's page-side rule, in `pinPageToBoard`'s own
  comment: *the writer has not chosen a position on that board's wall.*
- **"with their tags"** — each row shows the board's tags. **Gated on 108** (one vocabulary); **until 108,
  the rows carry no tag line** rather than a second tag derivation.
- **"Create Board" here opens 165's Create Board presets** — *one door to board-making, not two.*
- **Under item 166 this dropdown is a DRILL-IN in the same column**, never a panel beside it.

### 3 · ADD TAG(S) — *"each previous tag should also be visible and removable from this menu interface"*
**Item 143's tag controls, mounted here** — the add field, the applied tags, each removable. **Gated on
108 and 143.** **No second tag control.**

### 4 · OPEN PAGES — **FIX's section, placed, not redesigned**
**This brief moves item 170's built section into position and changes nothing inside it.** Its viewport,
its order, its star rule and its `⋯` geometry are FIX's, checked by `item170.mjs`.
- **⚠ CONFLICT (ii) — "the last three … scrollable."** **FIX ships the VIEWPORT reading** (three rows
  visible, the rest reachable) **and flags it as its own judgment.** **This desk agrees, and says why in
  one line: a three-item cap has nothing to scroll and nothing to sort, and his own sentence asks for
  both.** *If he meant literally three, FIX says it is one line.*
- **The three sorts (tag · board · drawer) land here when they ship**, as FIX's follow-on.

### 5 · PAGE SETTINGS — today's Page Setup, plus font settings
**A drill-in (166), holding the current Page Setup options plus: limited typefaces with an option to add
fonts · font size · line spacing.**
- **⚠ CONFLICT (iii) — THE ANALOG LAW's FONT CLAUSE:** *"FONT lives in Draft and Revise, and in Free Write
  ONLY when Typewriter is OFF — a typewriter does not offer you a typeface; a plain page does."*
  **THE DESK'S READING, FLAGGED FOR HIS VETO: the TYPEFACE control is ABSENT in Free Write while
  Typewriter is ON; FONT SIZE and LINE SPACING remain.** *The clause names the typeface and gives its
  reason — a typewriter has one face — and that reason does not reach size or spacing.* **Item 171 narrows
  the typewriter to Free Write, ink-free, so the question cannot arise in Draft or Revise.**
- **"the option to add fonts" is its own capability** — where a font comes from, whether it is stored, and
  what licence it rides on. **Named here, chartered nowhere.** *It is not built by this brief.*

### 6 · NEW PAGE, last — **⭐ THE DESK'S RULING ON DIFFERENCE 1, flagged for his veto**
> **THE BUTTON IS "NEW PAGE", SINGULAR.**
**Why:** **item 178 renames the NOUN, not the COUNT** — *"Pages" is Wrizo's word for a document* — and a
button that makes **one** page reads singular in any lexicon. **His own part 2 writes "New Page"** for the
tab that makes one. **His "New Pages" in part 1 sits in a list of section names** (*"Current Page", "Open
Pages", "Page Settings"*), **where the plural belongs to the section, not to the act.**
*Recorded as this desk's ruling because Fable asked for it as one; his word overturns it in a syllable.*

---

## §3 · WHAT THIS MENU IS NOT
- **Not a second way to open a page** (170 owns it) · **not a second board list** (165) · **not a second
  tag control** (143) · **not a second naming control** (133/136).
- **Only on a Page surface** — his first clause. **On a board, the Page category keeps what it has**
  (170's list is there too, by FIX's judgment 2).

## §4 · ITEM 166 GOVERNS THE COLUMN
The menu is a cascade panel: **sized to the margin the page leaves**, **drill-ins for Add to Board and
Page Settings**, **never a panel beside a panel**, and **the page is never covered.** *A menu about the
page that covers the page is the thing 166 was written against.*

## §5 · THE HARNESS — `apps/desktop/scripts/harness/i177.mjs`
Standing laws: **drivers never assume existence** · **real pointer events** · **seed through the seams** ·
**absolute worktree path** · **select by name**, never by index.
1. **The six sections, in his order, read by name** — and **only on a page surface.**
2. **The name:** editing in the menu and in the title bar produce the same stored result, and **the menu's
   label is not the name** (the superscript label is never editable).
2b. **The star:** present in both mountings, **immediately after the name**; toggling in one place shows in
   the other and in `entry.starred`; **the title's rect does not move when it toggles**; and the filled
   star resolves from **`--brass`**, never from `--accent-rest`.
3. **Add to Board** writes membership with **`onCanvas: false`**, and the board then appears wherever the
   page's connections are listed.
4. **Open Pages is FIX's** — this harness asserts only that the section is **present, in position, and
   still shows three rows with the rest reachable**; `item170.mjs` owns its behaviour. *(Two harnesses
   asserting one section is how a park goes missing.)*
5. **Page Settings:** in Free Write with Typewriter ON, **the typeface control is absent** (per §2.5's
   reading); size and spacing are present.
6. **The button reads "New Page"** — the string asserted exactly.
7. **166's grid covers this menu's panel and both drill-ins.**
8. Both `HARNESS_PARKED` settings CLEAN; **park count audited** — any check naming the old `PagePanel`
   order is a **park, not an edit.**

## §Q · FOR NICK
- **177-Q1 — "Untitled" (conflict i).** In this menu, is "Untitled" **just what an unwritten page is
  called on screen** (this desk's reading — nothing is stored, and item 136 stands), **or the page's real
  default name** (which reverses 136)?
- **177-Q2 — "the last three" (conflict ii).** FIX ships **three rows visible with the rest reachable by
  scrolling.** Confirm — or did you mean **only three pages, ever**?
- **177-Q3 — fonts and the typewriter (conflict iii).** In Free Write with Typewriter ON: **typeface
  hidden, size and spacing shown** (this desk's reading), or **all three always shown** (which amends the
  analog law)?
- **177-Q4 — "New Pages" (difference 1).** This desk rules the button **"New Page", singular** — the term
  change renames the noun, not the count. **Say the word and it changes.**

## §CLOSE
1. **Gates:** 166 merged · 170 landed (Batch Four) · 108/143 for the tag lines, 136 for a stored name.
2. Build §2; `tsc` + `build:web` + selftest + full suite, **both settings**, green.
3. **Push the branch. Do not merge.**
4. **A FOUNDER SITTING IS OWED** — *"this is the menu I described, and I can name a page from it"* is his
   claim to make.

**Nothing deploys on this lane's word.**
