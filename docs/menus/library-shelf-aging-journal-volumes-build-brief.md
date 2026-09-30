# THE LIBRARY, THE SHELF'S 90-DAY AGING, AND JOURNAL VOLUMES — BUILD BRIEF
### PLAN desk · 2026-09-30 · **build brief** · reconciles `docs/publish/pub-committee-pass.md` §11–§12 against item 96 / the three-space canon, 165, 168, 172, and b166

> **⚠ SYMBOLS ARE THE ANCHOR.** Read at `4cb182f` (primary) and at
> `origin/claude/lucid-fermi-3s9hor` for the source pass (chat 1 is merging it; **the pass itself is
> not amended here — this brief is a NEW document that reads it and reconciles it**). Line numbers
> are a courtesy.
> **⛔ THIS BRIEF GATES ON ONE THING BEFORE ANY OF IT BUILDS: THE DEVICE-STORAGE FIX (§1).** Read that
> section first.
> **Not designed here, by Fable's order: Tutor memory files.** *That is TUTOR's, after this brief.*
> **This brief does not touch `apps/` and is docs-only.**

---

## §0 · THE PRIMARY TEXT — Nick, verbatim (quoted in the source pass, §11–§12, ratified 2026-09-30)

> *"Yeah, let's allow users to move a Page, Board, or Drawer to their Library (which will also
> contain some preloaded writing knowledge as well as memory files the user would like to add to
> train their AI Tutor."*
>
> *"After 90 days, all unfiled Pages/Boards should be moved to the Shelf, which is where they stay
> until/unless the User moves it somewhere else. Drawers stay where they are until/unless the User
> moves them to the Library."*
>
> *"Yes, they should stay in the Journal. But at some point, maybe the Journal should get full, at
> which point it gets retired to the Library and listed in a pop-out menu when the user hovers over
> the Journal icon? Open to suggestions from the Architects."*

**Also ratified the same day (slate 4):** *the storage-full risk is told to Fable as urgent.*
**Also ratified (§12, slates 13–15):** *the Journal fills by pages (200/volume, not by year); a
writer may start a new volume early; past volumes are found from the Journal icon — tap/click
everywhere, hover on a mouse, long-press on touch.*

**What this brief does:** takes the Architects' shape from §11–§12 (already measured against the
code, quoted there with line numbers, and re-verified independently below) and **fits it to the
laws this desk already keeps** — the three-space canon, item 96, 165, 168, 172, and b166 — **naming
every place they touch, and naming every schema question for Nick that the source pass raised or
implied**, so a builder is handed one document instead of two.

---

## §1 · ⛔ THE GATE — nothing below builds before the device-storage fix

**Re-verified independently, this session, against the tree at `4cb182f`:**
```
apps/desktop/src/store/persistence.ts:250-252
function flush(name: CollectionName): void {
  try {
    localStorage.setItem(KEYS[name], JSON.stringify(cache[name]));
  } catch {
    // Storage full/unavailable — never throw into a write path.
  }
```
**Confirmed as read: a full `localStorage` (~5 MB per site) fails SILENTLY. No toast, no retry, no
signal to the writer.** Offline, the edit is gone on reload; signed in and online, the server copy
survives but the device is now lying to the writer about what it holds. **This is TOOLS' urgent item,
independent of everything below — the source pass's Annex IV note is the correct next act, and this
brief does not repeat its wording, only its authority.**

**Why the Library specifically depends on it, not just the risk in general:** **on-demand loading**
(§4) is the mechanism that keeps a Library item's ink and a shelved item's weight off the boot load —
**that mechanism is IndexedDB's own job** (a device store with a real quota, hundreds of MB, that can
report "full" instead of failing mute). **Building the Library's container semantics on top of the
current localStorage store would let a writer move heavy work into the one place designed to hold
heavy work, into the store least able to hold it.** **So: the CONTAINER (§4), the aging rule (§5) and
the data shape (§4, §6) may be DESIGNED and REVIEWED now — nothing here waits to be thought through
— but no builder starts §4's move act, §5's write path, or §6's volume boundary until IndexedDB is
the store.** **The Library's route stays `live: false` on the rail** (`DeskRail.tsx:27`, unchanged)
**until then.**

## §2 · WHAT EXISTS — measured against the tree, not carried from the source pass unverified

- **The Library is a genuine stub, not a placeholder with hidden wiring:** `DeskRail.tsx` lists it
  (`{ key: 'library', label: 'Library', glyph: '▣', to: '/library', live: false }`) with its own
  comment — *"Library is greyed (stub for later)"*, *"'library' isn't a canon §5 term at all (a
  separate future stub)."* **No route mounts at `/library`.** *(`decks/library/` is an unrelated
  namespace — deck TEMPLATES for Story Structure, item 165 §1 — and shares nothing with this item but
  the word; a builder must not confuse the two.)*
- **`shelved` is a real, existing column** (`migrate.ts:52`: `shelved boolean not null default false`),
  **not a jsonb key** — mapped explicitly in `sync.ts` (insert list, values, `on conflict`, parameter
  array — the four-site write-path shape, plus the read mapper). **It is a FLAG, not a date: there is
  no record of *when* a page became unfiled** — confirmed, no `shelvedAt` anywhere in `src`. *(VW2's
  own S0(c), 2026-09-13, measured this same absence for a different question and ruled zero schema
  because the Shelf was then a pure computed condition; this brief is the reason that ruling now
  changes — see §5.)*
- **`Drawer` is its own small record** (`id, name, order, createdAt, updatedAt, deletedAt`) — **no
  `projectId` of its own; pages and boards carry the pointer TO a drawer, not the reverse.** A Library
  membership field for a Drawer therefore lives on `Drawer` itself; for a Page/Board it lives on
  `JournalEntry` — **two collections, not one** (§4).
- **`board-meta`** (one per board, inside `boxes` jsonb — the same box that already carries
  `canvasW`/`canvasH`/`lanes`) **is the established home for additive per-board facts with no
  column** — **the precedent §6's volume list rides.**
- **`getOrCreateSystemBoard('journal')` / `findSystemBoard`** exist precisely to guarantee ONE Journal
  board; **`inJournalView()`** selects by `origin: 'journal'` and no binder, ordered by day written
  (`store/pageOrder.ts`). **Confirmed: nothing about volumes, page counts, or "full" exists anywhere
  in this path today.**
- **Item 172's board TYPE field does not exist on disk** (`pageType` has no `'Book'` variant; no
  `BoardType` type anywhere in `types/index.ts`) — **confirmed independently.** *The Book-style
  Journal is a ruling and a design, not a built surface.*
- **`store/sync.ts` pulls every collection whole on every launch; nothing is scoped by drawer, by age,
  or by container** — confirmed by reading the pull path (item 198's own cursor logic filters by TIME
  across the WHOLE account, not by which container a record is in).

## §3 · RECONCILED AGAINST THE STANDING LAWS

### Item 96 / the three-space canon
**Item 96's charter is answered by the three-space canon**, ratified 2026-09-07: *surfaces* (Pages,
Cards, imported documents) · *containers* (Boards, Drawers, Shelf, Journal, Trash) · *displays* (menus,
presets, the Journal's own show). **The Library is a CONTAINER, exactly the shape the canon already
names** — *"where surfaces and other containers are stored and organized."* **It holds surfaces
(Pages) AND other containers (Boards, Drawers)** — the canon's own second clause, *"other
containers,"* was written for exactly this case and nothing needs to be invented to fit the Library
into it. **The rail's job under the canon — "CONTAINERS on the rail; a surface's own connections
shown ON THE SURFACE" — is already why the Library sits on the rail beside Drawers, Shelf and
Journal, and not inside the Plan menu** (165, below). **No writing is ever made in the Library** —
the same law that governs a Board governs it: *it merely holds and helps organize.*

### Item 165 (the Plan menu)
**No change to 165's structure.** The Plan menu's job (Create Board, Outline, Story Structure,
Organize Research, Add Board, Connected Boards) is about **making and connecting boards**; the
Library is about **where a finished or resting piece of work lives** — a different question, asked
from a different door. **The move act (§4) is a RAIL-LEVEL act, of the same family as item 180's
carry to the Drawers icon, and does NOT get a Plan-menu row.** *(If Nick later wants "Move to
Library" inside a board's own Plan panel too, it is a second mounting of the same act — the house's
own "build once, mount twice" pattern — and is not designed here because nothing in the source pass
asks for it.)*

### Item 168 (deletion, Remove vs Delete)
**The Library changes NEITHER verb.** Moving a Page, Board or Drawer to the Library is **neither
Remove nor Delete** — it is a THIRD act, already named in the record for exactly this shape: **filing**
(the act "Put in a drawer…"/"File Page" already performs, 180). **Nothing in the Library is ever
trashed by arriving or leaving it**; **168's rule that "a membership outlives a deletion; its display
does not" is untouched — a Page inside a Drawer that is itself later moved to the Library keeps every
`page-pin` it holds elsewhere** (reference, not copy — the standing canon). **The right-click menu
(186, 168 §4) is not touched by this brief**; if a "Move to Library" row is wanted there, item 180's
own "one list, two mountings" pattern is how it would be added, not a new menu.

### Item 172 (board types, the Book-style Journal)
**Volumes do NOT wait on 172.** *The source pass's own sequencing note says "ideally with 172," not
"blocked on it" — this brief keeps that word.* **What 172 would add, if it lands first: the physical
metaphor** (*"the spine and page edge simply thicken"* — a Book-type board's own rendering, item 172
§4's tall-proportion law extended). **Without 172, the same volume boundary (§6) still works —
retiring is a data fact (a closed date on `board-meta`), and the "thickening spine" becomes a plain
line of text until 172 ships a Book-type renderer to draw it.** **Nothing here assumes 172's type
field exists.**

### b166 (the guideline)
**Two surfaces this brief adds are panels under b166's guideline, not new mechanisms:** **the
Library's own content view** (a list, in the shape VW2's rows amendment already gives Shelf and
Trash — §4) **and the Journal's Volumes group / hover-peek** (§6) — **both sit BESIDE the page or
board when the margin holds them and OVERLAY on a shrunk window; neither ever moves the page.** **The
hover-peek is explicitly the guideline's transient-surface class** *(it opens on hover, closes on
move-away, sits in the rail's own panel track — "it never covers the page and never stacks a second
column," the source pass's own words, which is b166 R1/R2 stated back)*. **No new law is needed;
b166 already covers both.**

---

## §4 · THE LIBRARY CONTAINER

**Design, not build — gated at §1.**

- **The container itself needs NO new collection.** A Library is not a place things are copied into;
  it is a STATE a Page, Board or Drawer carries, the same shape `shelved` already is for the Shelf.
- **⛔ SCHEMA QUESTION FOR NICK, NO DEFAULT (Q1).** **Two new fields, one per affected collection**
  *(the same four-write-site shape `shelved` already has)*:
  - `journal_entries.library_at` — **timestamp, nullable, no default** — set when a Page or Board is
    moved to the Library, cleared if the writer moves it back out. *(A timestamp, not a bare
    boolean, because §6's retired Journal volumes need to say WHEN they arrived, for the Library's
    own "Journals" section to order by — the same reasoning that makes `shelvedAt`'s absence, below,
    a real gap and not a style choice.)*
  - `drawers.library_at` — **the same shape, on the Drawer's own row** *(Drawers have no `projectId`
    to piggyback on; this is why it is a second table, not a second column on one).*
  **The plain-English question:** *"To remember which Pages, Boards and Drawers you've moved to your
  Library — and when — Wrizo needs two small database additions (one on each kind of item). Is that
  OK?"* **No default: it is a column, and a column is never a builder's or this desk's to assume.**
- **The MOVE act — reuses item 180's carry, not a new mechanism.** **The Library rail icon becomes a
  THIRD icon of the "opens and keeps the hold" kind** (180's own taxonomy: *"some rail icons consume a
  drop; others open and keep the hold"* — the Drawers icon is the first; the Library is the second;
  the Trash remains the only "consumes"). **Dragging a Shelf row, a Drawers-tree row, or a board's own
  row onto the Library icon arms exactly 180's `placing` mode**, with the Library's own content list
  standing in for the Drawers list as the landing targets are not drawers but simply "confirm" —
  **there is only one destination, so LANDING is a single press on the icon itself, or on "Add to
  Library" inside the carry's chip** *(180 §1's chip already has a slot for exactly this — a carry
  whose landing set has one member needs no list).* **A DRAWER is now also a valid SOURCE for 180's
  carry** *(180 §4 already designed the source as a parameter, "ship it where he asked… the gesture
  should not have to be re-invented"; a whole Drawer is simply a second `kind` the same mode
  carries).* **The existing filing act it calls is a WRITE TO THE NEW FIELD, not `setPageHome`** —
  filing to a Drawer and filing to the Library are siblings, and a builder must not conflate "leaving
  unfiled" with "entering the Library": **a Page can be BOTH in a Drawer AND in the Library at once**
  *(the ruling never says Library membership excludes Drawer membership — a writer files a finished
  chapter's board into a Drawer for its project AND into the Library for its resting place; both
  fields are independent)*. **The rival, named:** *Library membership could instead REPLACE Drawer
  membership (a thing can be "in a Drawer" or "in the Library," never both)* — **its case is simplicity;
  its cost is that a writer loses the Drawer's own organization the moment they file something away,
  which the ruling's wording never asks for.** **Lean: independent fields, as above.**
- **The Library's OWN VIEW — a list, VW2's shape reused, not invented.** *Sections, as VW2 already
  rules for the Shelf and Trash: Pages · Boards · Drawers (Drawers are new to this list — a fourth
  section, same law).* **Plus the two non-writer sections the ruling names:** *(b)* **preloaded
  writing knowledge** — read-only rows, hideable, sourced from `packages/modules-writing/data/frameworks`
  and style-guide references named in the pass; *(c)* **Tutor memory files** — **TUTOR's own section,
  designed by TUTOR, mounted here** *(this brief reserves the section; it does not design its
  contents, per Fable's order)*.
- **On-demand loading — the mechanism, not yet the build.** *Once IndexedDB is the store (§1), a
  Library item's heavy payload (ink, later images) is fetched when its row is OPENED, not at boot* —
  **the same shape item 181's file objects already use for a device that hasn't downloaded the bytes
  yet** (a labelled placeholder, resolved on open). **This is a SYNC-SCOPING change** (Architects'
  note 2 in the source pass) **and is its OWN item, not this brief's to build** — named here only so a
  builder does not discover the dependency mid-ticket.
- **The Publish tie** *(named for completeness, owned by the Publish lane, not built here)*: **the
  Press's "Afterwards, move this book to my Library" checkbox** writes the SAME `library_at` field,
  unticked by default — one field, two doors.

## §5 · THE SHELF'S 90-DAY AGING RULE

- **⛔ SCHEMA QUESTION FOR NICK, NO DEFAULT (Q2).** **`journal_entries.shelved_at` — timestamp,
  nullable, no default** — the four-write-site shape, joining `shelved` (which stays, unchanged, as
  the EXISTING computed-or-manual flag every reader already checks). **The plain-English question:**
  *"Right now the Shelf just shows what's currently unfiled — it has no memory of WHEN something
  landed there. To make a shelved item 'sticky' (so re-opening it doesn't quietly move it back, and so
  it stays until you move it) Wrizo needs one small database addition. Is that OK?"* **No default.**
- **THE RULE, worked out precisely (computed, then LATCHED — a pattern this house has not needed
  before, so it is spelled out in full):**
  1. **"Unfiled"** = *no Drawer* (`projectId` null) **AND** *not the Journal* (`origin !== 'journal'`
     is already how `inJournalView` and the Shelf's own partition read it — **Journal pages never
     enter this rule at all**, exactly as ruled). **A Page pinned to a Board that itself lives in a
     Drawer counts as FILED** — *its own `projectId` may be null (it's a scratch card's home board), but
     the BOARD it's pinned to has one; the rule reads the board's `projectId`, not the page's, for a
     page whose only home is a board's canvas.* **(This is a reading, not stated verbatim by Nick — it
     follows from "unfiled" meaning "has no organizational home," and a board-pinned page already has
     one. Flagged so a builder does not read it as this desk's invention if challenged.)*
  2. **"90 days from the last edit"** = `updatedAt`, **not `createdAt`** (his own word: *"After 90
     days"* read against the ruling's own reason — a page you keep returning to is not resting).
     **Opening without typing does not reset it** — `updatedAt` already only moves on a real write.
  3. **THE MOVE IS COMPUTED, ON A LAZY PASS, THEN THE RESULT IS LATCHED.** *There is no server cron and
     no background timer in this codebase (checked: nothing like one exists) — the age rule cannot fire
     "at the stroke of day 90" and must not require one to be built.* **Instead: on each app boot (and,
     cheaply, whenever the Shelf/rail computes its own list), every unfiled entry with `shelvedAt`
     still null is checked: `now − updatedAt > 90 days` → `shelvedAt` is STAMPED to `now`, in that
     pass, as an ordinary write.** **From that moment the entry is STICKY**: every reader that decides
     "is this on the Shelf" now checks `shelvedAt !== null` (never re-derives the 90-day test), so an
     edit afterward does NOT clear it — *editing only clears `shelvedAt` when the writer explicitly
     files it somewhere (a Drawer or the Library), which also nulls `shelved`.* **This is the "computed,
     then arranged" split already familiar from item 202's board-merge design and item 201's
     tombstones: the TRIGGER is computed; the STATE, once true, is a fact the writer now owns.**
  4. **The lazy pass costs nothing extra to build:** it rides the same walk the Shelf view already
     does to render its list (VW2's `ConditionView`) — **no new scheduled job, no new server endpoint.**
     **A writer who never opens the Shelf and never reloads simply has their 90-day-old page age
     silently until the next time anything reads the list** — *named as the honest limit, not fixed:
     the ruling asks for a state, not a live countdown, and no chrome may show one anyway (no counts,
     no "nearly there" — A14/A18, extended here by the same reasoning item 134's Empty Trash count
     exception was kept narrow.)*
- **Reconciled against VW2's own S0(c) ruling** (2026-09-13: *"no `shelvedAt` exists and none is
  added… Zero schema"*): **that ruling is SUPERSEDED by Nick's own later word** (his 2026-09-30
  ruling makes the Shelf sticky for aged items, which a pure computed condition cannot be) — **kept
  as written there, marked, per the standing law that a founder's later word supersedes rather than
  silently reversing a desk's own prior text.** **VW2's rows (the sections, the sort-by-date default,
  the arrangement law) are UNCHANGED** — this is an addition to WHAT decides Shelf membership, not to
  how the Shelf is drawn.

## §6 · JOURNAL VOLUMES

**Design only — gated at §1 (and, for the visual metaphor only, non-blocking on 172, §3).**

- **Data shape — NOT a schema question; a data-shape review through chat 1/Fable, the `board-meta`
  precedent already governs it:** `board-meta.volumes: [{ n: number, closedAt: string }]` — **additive,
  inside the ONE Journal board's own existing jsonb box.** **A past volume's pages are COMPUTED by
  date range** *(the arrangement law: nothing is ever re-filed)* — `inJournalView()` gains one more
  clause: pages after the LAST `closedAt` (or all of them, if `volumes` is empty) belong to the
  current, open volume; everything before a boundary belongs to that boundary's volume, addressed by
  `n`. **No page ever changes `origin` or gains a new field. One board, one array, computed reads.**
- **The 200-page boundary, and the transition, exactly as the source pass designs it — this desk
  finds nothing to add or correct:** *starting page 201 closes Volume I (stamps `closedAt = now`,
  pushes `{ n: 1, closedAt }`) and opens Volume II; one quiet line at that page turn, never
  mid-keystroke; a writer may close early from the Journal panel* (a plain "Start a new volume" row,
  **its own confirm — this is the one closing act that is NOT reversible by editing**, so it earns a
  short confirm the way a destructive act does, though it destroys nothing: *"Start Volume III now?
  Volume II will move to your Library."* — no count, no page tally shown, per the no-ambient-count
  law). **Its `library_at` (§4) is stamped the same moment** — **the ONE automatic entry into the
  Library**, exactly as ruled; every other arrival is the writer's own act.
- **Finding past volumes — the rail panel first, the hover/long-press second, exactly as ruled and
  as b166 already governs (§3):** **the Journal's existing click panel** (`JournalPanel`) **gains a
  Volumes group** — *"This volume (II)"* first, then past volumes by number, each opening the retired
  volume FROM THE LIBRARY (its `library_at` is already set, so it is simply a Library-backed open, not
  a second code path). **The hover-peek (mouse, ~500 ms) and the long-press (touch) open the SAME
  panel as a peek — one component, three doors, exactly item 180's own "the source/trigger is a
  parameter" pattern applied to a PEEK instead of a carry.** **No new hover mechanism is invented**
  *(the rail today has none — this is the first, and it is scoped to exactly this one icon, per the
  source pass's own words: "the hover is a shortcut, never the only way").*
- **Publishing a volume** *(named, owned by Publish, not built here)*: **a retired volume is a normal
  Library item and publishes like any other — the Journal reading copy or e-book edition (165/Publish's
  own concern), nothing new to this brief.**
- **Weight, restated as a build note:** *Journal pages carry the most ink per item 203's own
  measurement (~56 bytes/point) — a retired volume is the single biggest on-demand-loading win once
  §1's fix lands, which is exactly why the source pass sequences volumes after it.*

## §7 · SEQUENCING AND PARTS

| part | what | gate |
|---|---|---|
| **LSJ-0** | the device-storage fix (localStorage → IndexedDB), honest storage-full signalling | **TOOLS, URGENT, independent of everything below — §1** |
| **LSJ-1** | the two schema additions (Q1, Q2) | **Nick's word — §4, §5 — and LSJ-0 landed first** |
| **LSJ-2** | Shelf aging: the lazy compute-then-latch pass, `shelvedAt` reads everywhere the Shelf is decided | **LSJ-1** |
| **LSJ-3** | the Library container: the rail icon (live), its view (VW2's shape + the two read-only sections), the carry-in (180's mechanism, extended) | **LSJ-1**; TUTOR's memory-file section design lands independently and mounts into the same view |
| **LSJ-4** | on-demand loading (sync scoping by container/age) | **LSJ-0; its own item, not built inside LSJ-3** |
| **LSJ-5** | Journal volumes: the `board-meta` array, the 200-page boundary, the rail's Volumes group + hover/long-press | **LSJ-3 (the Library must exist to receive a retired volume); ideally, not gated, with 172** |

## §8 · §Q · FOR NICK — the two schema questions, plain English, no default (a schema word is his alone)
- **Q1 — remembering what's in your Library.** *To remember which Pages, Boards and Drawers you've
  moved to your Library — and when — Wrizo needs two small database additions (one for Pages/Boards,
  one for Drawers). Is that OK?*
- **Q2 — making the Shelf sticky.** *Right now the Shelf just shows whatever is currently unfiled. To
  make an item that's aged onto the Shelf STAY there (so re-opening it doesn't quietly move it back)
  Wrizo needs one more small database addition. Is that OK?*
**Everything else in this brief is either already his ruling (§0), a data-shape review that needs no
column (§6's `board-meta` array), or this desk's own lean, named as such and not asked of him again.**

## §9 · THE CHECKS OWED, when built (standing laws: drivers never assume existence · real pointer events ·
seed through the seams · absolute worktree path · select by name; **the two-device double where sync is
touched**)
1. **The gate itself:** *a source scan asserts no `library_at`/`shelved_at` column or `board-meta.volumes`
   write exists on `main` until LSJ-0 has landed* — a build-order guard, not a product check.
2. **Aging:** *seed an unfiled page with `updatedAt` 91 days ago; one app boot stamps `shelvedAt`; a
   later edit to it does NOT clear `shelvedAt`; filing it to a Drawer or the Library DOES.*
3. **Journal exclusion:** *a Journal page 200 days untouched never gains `shelvedAt`.*
4. **Board-pinned page:** *a page with no `projectId`, pinned only to a board inside a Drawer, is read as
   FILED and never ages.*
5. **Library independence:** *filing a board to a Drawer, then also to the Library, leaves both fields
   set; removing it from the Drawer does not clear `library_at`.*
6. **The carry:** *dragging a Shelf row or a Drawer onto the Library icon arms `placing`; landing writes
   `library_at`; the Trash and Drawers icons are unaffected by the new icon's presence (no shared
   handler — 180 §2's rule, extended to a third target).*
7. **Volumes:** *seeding 201 Journal pages closes Volume I with the 201st page's own timestamp,
   `library_at` is set on the Journal board at that moment, and `inJournalView` returns only pages after
   the boundary; a retired volume's pages still resolve every existing pin (Law 3).*
8. **The peek:** *hover ~500ms opens the Volumes panel; moving away closes it; the SAME panel opens on
   tap/click and on long-press; it never intersects the page's rect (b166).*
9. **No ambient count anywhere in the Library, Shelf or Journal panel** (A14/A18) **and no "nearly full"
   signal on the Journal** (Principle 5, the source pass's own §12.6).
10. **Both `HARNESS_PARKED` settings CLEAN; park count audited** — *VW2's S0(c) line is a PARK
    (superseded, kept verbatim, pointer here — §5), never edited in place.*

## §10 · WHAT THIS BRIEF DOES NOT DO
**No mockup** *(the pencil is down; a Library list is VW2's own shape at a glance, and Fable draws if a
picture is wanted before LSJ-3).* **No code.** **Tutor memory files** — TUTOR's, after this brief, per
Fable's order. **The sync-scoping mechanism of on-demand loading (LSJ-4)** — named, not designed; it is
an Architects'-level protocol change the source pass itself declines to specify. **172's Book-type
renderer** — untouched; volumes do not require it.
