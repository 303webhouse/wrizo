# Build brief: organizing big projects (Fable, Oct 18, 2026)

**Status:** the design is APPROVED by Nick (Oct 18, 6:27 pm, "Looks MUCH better"). It is a build of an approved mockup, so it ships under the standing ship word once Fable clears the frames.

**The mockup is the reference:** `cursor/big-projects-mockup` @ `aab45ec0`, `docs/mockups/big-projects/` (16 frames). It also reuses the approved side-panels round 2 (`cursor/side-panels-mockup` @ `472ab916`).

**Timing:** PLAN NOW, CODE LATER.
- Write the plan now; no code until Fable clears it.
- Building starts after connector-b is deployed and delete-for-good has merged, because both touch the same readers (Journal, Trash, Shelf).

---

## 1. What the writer gets (plain words)
- **There is always a "where you are":** either a Drawer (a project) or a Journal (writing with no project).
  - A new account starts in a Drawer named **Top Drawer**, plus one Journal named **Journal**.
  - New Page and New Board file into wherever you are. Nothing is ever homeless.
- **Drawer → Set → Section.** A set is today's binder: "Manuscript", or "Worldbuilding".
  - A section is one page or one board.
  - A Drawer with only one set shows no set heading. The word "set" only appears once a second set exists.
- **The rail**, top to bottom:
  - a **place block** (an icon and the name of the current Drawer or Journal, with a brass edge);
  - **Pages** and **Boards**, bracketed under the place block;
  - a divider, then **Journal**;
  - at the foot: Settings, Themes, Trash.
  - There is **no Shelf**, and **Plan is renamed Boards**. The PLAN→ mode strip is unchanged.
  - **The whole rail, place block included, still fades while typing** and comes back the usual Recede way (Nick, 6:27 pm).
- **Tapping the place block opens the switcher:** Drawers, then Journals, in two flat groups, then + New Drawer and + New Journal.
- **The Pages and Boards pop-outs mirror each other,** and both are scoped to where you are:
  - the place name;
  - + New Page or + New Board;
  - SECTIONS, with a sort control and a rows/grid toggle;
  - + New set;
  - PRESETS.
  - A set with nothing of that kind (no pages, or no boards) is absent from that pop-out. A set that isn't the current one folds to one row with a count.
- **The sort control:** Order (the default) is the writer's own order, and drag-to-reorder works only in Order. Date, Tag, Most opened and Least opened are views only; they never change the book's order.
- **X on a section** takes it out of the Drawer and puts it in the Journal, with an Undo line. **It never deletes.**
- **The page header:**
  - the breadcrumb (Drawer › Set › Page);
  - the title opens the **details card**: title, Star, tags, and **Add to a Board…** (it pins only; "+ New Board" then the boards; a ✓ shows boards the page is already on);
  - the **"…" menu: Copy Page** (copies the words to the clipboard, today's "Copy page text"), **File Page…** (a picker: Drawers opening to their sets, then Journals, + New Drawer), **Page Settings…** (today's Page Setup sheet, renamed, with the line-spacing slider), and **Delete**.
  - The place dropdown leaves the details card; File Page is the one way to move a page.
- **Grafts** is the right panel's second tab. It is headed "Connected to [page]" and draws from ANY Drawer or Journal:
  - grouped Cards, Sources, Boards, Pages, each with an X and Undo;
  - then **Shared tags**, which show a tag mark and have no X;
  - every item from another place shows a faint label naming that place.
- **Tutor panel (side-panels round 2):**
  - the Ask box on top;
  - three starter chips;
  - the Selection chip, greyed until text is selected;
  - quiet lens rows (Consistency, Fragments, The book's Bible, Waiting for you), each with a count and hidden when empty;
  - no Structure section.
- **Board starter buttons:** New Card, Templates, Connect Pages. **No New Page on a board.** "Start Pages" stays for now and is reviewed in step 2.
- **"Port to a Board…" is removed.** Already-ported cards stay as ordinary cards. "Copy to Board" (copying a card to another board) is unaffected.
- **Multiple Journals.** With one Journal there is no list. With two or more, the Journal button opens a short list.

## 2. Storage: the plan must confirm "no schema change"
**Today:**
- `drawers` is the top level.
- `projects` are binders (the sets), linked by `drawer_id` and carrying `kind`.
- `journal_entries` are pages and boards, linked by `project_id`, with `order_index`, `page_type` ('board', 'script', 'manuscript'…) and `shelved`.

**The intended mapping, with no schema change:**
- **A set** = a `projects` row with a `drawer_id`. Every Drawer gets one set automatically, so a page always has a binder.
- **A Journal** = a `projects` row with `kind = 'journal'` and no `drawer_id`. Today's Journal pages (`project_id` null) and Shelf pages are shown in the first Journal.
  - The plan says whether that's a read-time rule or a one-time re-home.
  - **A one-time re-home is a data change.** If chosen, it needs the same backup rule as a migration.
- **The Shelf merge is display only.** The `shelved` flag stays in the database and is ignored by the screen.
- **"Where you are"** is kept on each device, like `wz.lastPlace` today.
- **"Most opened"** is an open count kept on each device. **No synced counts.**
- **Top Drawer** is made only for an account with zero Drawers. Nothing existing is moved behind the writer's back.

**If any of this needs a new column or table, STOP.** That is Nick's schema decision, with no default. Bring it to Fable first.

## 3. Build in steps; each one ships on its own
1. **Step 1a: the place and the Pages pop-out.**
   - The "where you are" value, Top Drawer, the place block, the switcher, the rail changes (no Shelf; Boards rename; Recede fade).
   - The Pages pop-out: the rows view, Order with drag, set grouping and folding, + New set, Presets, and X to the Journal with Undo.
   - The Shelf merge.
2. **Step 1b: the page header.** The details card, the "…" menu, File Page…, Add to a Board…, the Page Settings sheet, and removing "Port to a Board…".
3. **Step 1c: the Tutor panel clean-up** (side-panels round 2). It's separate files, so it can run alongside 1a/1b in another lane.
4. **Step 2: the Boards pop-out** (mostly the same component), plus the board starter buttons, plus the review of "Start Pages".
5. **Step 3: Grafts as "connected to this page",** across Drawers, with place labels and Shared tags.
6. **Step 4: the grid view, and the Date, Tag and Most/Least opened sorts.**
7. **Step 5: multiple Journals** (+ New Journal and the short Journal list).

## 4. Tests (each step)
- **Checks go in first and red, then the build.** Probes use real pointer presses.
- **A page-and-board count is taken before and after first load on a seeded account:**
  - with Drawers, binders, Journal pages, Shelf pages and boards;
  - and with zero Drawers, to cover Top Drawer.
  - **Nothing may disappear or change home.**
- **X → Journal → Undo** puts the page back in the same set, in the same position.
- **Drag-reorder in Order survives a reload and a sync.** The Date and Tag views never write `order_index`.
- **The rail fades while typing and returns the Recede way.** The place block always matches the breadcrumb.
- **Parks:** every existing check that names the Shelf, "Plan" in the rail, "Port to a Board…", "Copy page text", "Page Setup" or the old Pages-panel list is parked verbatim with a successor. Run a behaviour sweep (grep) before the pair.
- **Step 1a touches persistence and readers, so it gets the full pair.** Steps 1b, 1c, 2 and 4 are on the fast lane unless they touch save or sync.
- **Frames for Fable, Arbor dark and light:**
  - the rail and place block;
  - the switcher open;
  - Pages rows, with two sets and with one set;
  - the Journal place;
  - the X and Undo;
  - the details card;
  - the "…" menu;
  - the File Page picker;
  - Page Settings.

## 5. Out of scope
- **Flux and the other themes' words** (including Flux's name for "Top Drawer"). The Arbor layout ships first; Flux follows with a words pass.
- **The Draft tools panel** (Typeface, Format, Actions, Templates, Pages kind).
- **The tutorial for new writers** (planned later by Nick).

## 6. The plan's deliverable
`docs/plans/big-projects.md` on a branch `big-projects-plan`, covering:
- the storage mapping (section 2), saying plainly "schema change: none" or naming exactly what is needed;
- the step list, with the files each step touches;
- the parks;
- the tests;
- any risk to Delete for good's readers and connector-b's links.

No code until Fable clears it.
