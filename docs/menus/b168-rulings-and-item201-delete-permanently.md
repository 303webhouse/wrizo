# ITEM 168 — HIS TWO RULINGS APPLIED, AND ITEM 201: DELETE PERMANENTLY
### PLAN desk · 2026-09-24 · **amendment to `b168-deletion-charter.md`** · **designs item 201** (registered by chat 1, `9d1e6dd`)

> **⚠ SYMBOLS ARE THE ANCHOR.** Read at `9d1e6dd`. Line numbers are a courtesy.
> **⚠ THE RECORD:** his words reached this desk verbatim in Fable's relay; chat 1's entry is at `9d1e6dd`.
> **Nothing in the charter is rewritten in place** — §8 names what is superseded, kept as written.

---

## §0 · HIS WORDS, VERBATIM

> *"168-Q1: The whole page goes into the trash. The User can always retrieve it from the Trash if they made a
> mistake (Goes without saying, but the Trash needs a "Delete Permanently" option for individual items and
> for the entire bin.) 168-Q2: It goes into the Trash, where you can restore it (same notes apply from my
> last answer about pages)"*

**Both answers are RULINGS.** **And a third thing rides in the parenthesis — a NEW requirement, item 201:**
**Delete Permanently, per item and for the whole bin, pages and cards alike.**

---

## §1 · THE TWO RULINGS APPLIED TO THE CHARTER

- **168-Q1 → option (i): the drag deletes the page.** *A page card dragged to the Trash sends **the whole page**
  to the Trash, from every board it sits on; Restore brings it back with every card where it was (§3(c),
  unchanged).* **The charter's rival (iii) — a fork asking "Remove from Characters" or "Delete the page" — is
  NOT adopted, and a board-card follows the same ruling.**
- **What that changes downstream, stated so it is not discovered:**
  **(a) 168-F2 / item 160's order resolves the strict way.** The charter said *"Remove leaves the surface only
  when each of its two jobs has a successor — the drag for cards (168-A), **the right-click menu for
  memberships (168-C), unless 168-Q1 rules (iii)**."* **(iii) was not ruled, so page-cards' and board-cards'
  Remove has NO successor until 168-C, and item 160's interim stands as chat 1 recorded it** (Remove moves
  into `BoardCardPopup` for hand-typed cards; every other kind keeps it in the action row until 168).
  **(b) The drag's one unmeasured risk stays live:** *a writer who drags a page card toward the corner meaning
  "off this board" deletes the page — and until 168-C exists the drag is the only act on offer.* **What
  carries that risk now is the Trash itself: the page is one Restore away, and the restore is loud
  (§3(c): every card back where it was).**
- **168-Q2 → cards go INTO the Trash and are restorable** (the charter's lean, now his ruling). **168-B's gate
  "168-Q2" is MET.** **Still open on 168-B: VW2's Trash view and 168-F1** (`Box.deletedAt` changes what a board's
  `boxes` means for every reader, and for sync) — **Fable's review scope, unchanged.** **The rival (vanish with
  Undo) is dead.**
- **"Same notes apply from my last answer about pages"** = *restorable from the Trash, and permanent delete is
  a Trash act* — **both now designed below.**
- **§3(d) "No 'are you sure?'" STANDS for the soft delete** — *a drag to the Trash never asks whether; it is
  restorable.* **Delete Permanently ALWAYS asks (§4).** **The two never share a gesture:** *dragging is never
  permanent; permanent is a button inside the Trash.*

---

## §2 · ITEM 201 — WHAT EXISTS (measured, not assumed)

- **No hard delete exists.** *Searched `apps/desktop/src` and `apps/server/src`: no `delete from`, no purge, no
  empty-trash code path.* **VW4's `emptyTrash()` seam — the charter's "only permanent act" — is UNBUILT.**
  **Every delete today is `deletedAt`**, which **travels as an ordinary record**
  (`sync.ts`: *"Soft deletes travel as ordinary records with deleted_at set."*).
- **The server upsert is last-writer-wins on `updated_at`:** `on conflict (id) do update … where
  journal_entries.user_id = excluded.user_id **and excluded.updated_at > journal_entries.updated_at**`.
  **The pull returns every row whose `synced_at` is newer than the device's cursor** (item 198: the server's
  own clock, 10s overlap). **The client applies a remote record only if it is newer than the local one, and
  a locally-DIRTY record is skipped — "unsynced on-device edits always win"** (`applyCollection`).

### Why the obvious build — delete the row — fails, twice
1. **IT NEVER REACHES ANOTHER DEVICE.** A pull returns rows; **a deleted row is not a row.** No other device
   is ever told. *(This is the problem chat 1 named: "a hard delete leaves no row to carry a tombstone.")*
2. **IT COMES BACK.** Any device still holding the item pushes it; **with the row gone, `insert … on conflict`
   is a plain INSERT** — the item is resurrected on the server and on every device that pulls next.
**Both failures are one fact: sync is built on rows that exist. A deletion has to be a row.**

---

## §3 · THE SYNC RULE — a permanent delete is a TOMBSTONE, never an absence

> **A PURGED ITEM IS NEVER REMOVED FROM THE SERVER. ITS ROW STAYS — CONTENT BLANKED, ID AND STAMPS KEPT,
> MARKED PURGED — AND THE MARK CAN NEVER BE CLEARED.**

**For an entry (a page or a board — both are `journal_entries` rows):**
1. **The purge is an ordinary push of the record, carrying `purgedAt`.** **The SERVER blanks the content**
   (text, boxes, script, strokes, tutor, tags… — the S0 lists every payload column) **itself**, so a client
   cannot purge "halfway", **and sets `deleted_at` if it is not already set.** *(Setting `deleted_at` too
   means every reader that already hides deleted things hides a purged one — by construction, not by
   census.)*
2. **A purge WINS. It bypasses the last-writer-wins comparison** (`excluded.purged_at is not null` passes
   regardless of `updated_at`) — **and once a row is purged, NO later upsert may change it**
   (`… where journal_entries.purged_at is null`). **The mark is monotone: it can be set, never cleared.**
   *(Sketch in words for S0 to turn into SQL — not a finished statement.)*
3. **Every device learns it the way it learns anything: the pull.** The purge stamps `synced_at = now()` like
   any write, so **every device whose cursor is older gets the tombstone** — *including a device that was
   offline for a month; its old cursor is the whole reason the pull works.*
4. **A device that still holds the item and pushes it is REFUSED by the server's guard** (rule 2) **and
   receives the tombstone on its very next pull.** **On arrival the client REPLACES its local record with the
   tombstone — ignoring the "newer only" rule and ignoring "local dirty wins"** (`applyCollection` gets one
   named exception: *a purge tombstone always applies*). **The item is gone from that device.**
5. **A fresh device** (no cursor) pulls everything including tombstones — **a few dozen bytes each, no content.**
6. **Tombstones are kept FOREVER.** *There is no safe moment to drop one — the server cannot know that every
   device that ever held the item has been told.* **The cost is a row of ids and stamps per purged item;
   the content — the only thing that was ever large — is gone.**

**For a card (a box inside a board's `boxes` jsonb — 168-Q2's trashed cards):** **a card is not a row, so it
cannot carry a mark of its own, and this desk does not pretend it can.**
- **The purge REMOVES the box from `boxes` and adds its id to a grow-only `purgedCardIds` list in the
  board's own `board-meta` box** (the box kind that already carries board-level metadata — at most one per board, **created on the first
  purge if the board has none**) — **additive, inside the jsonb, no column.**
- **At the apply boundary a device UNIONS the two lists and drops any box whose id is in the union** — *the
  same "a tombstone always applies" exception, at card grain.* **So a stale device's copy of the board that
  still holds the card cannot show it after it meets the list.**
- **THE NAMED RESIDUAL — this is where "never resurrected" is NOT absolute, and it is said plainly:** sync
  is **record-level last-writer-wins on the WHOLE board.** **A device that edits the same board offline
  AFTER the purge stamp, still holding the card, pushes a record that can win on the server** — **and the card
  is back on the server (and on a third device) until the purging device next syncs, unions its list, and
  re-pushes.** **The purging device converges (it never re-shows the card); the window is bounded by that
  device's next sync.** **Closing it completely needs a PER-CARD MERGE on the server — a bigger design than
  this item, and it is not proposed here.** **One decision for Fable: accept the bounded window for cards
  (this desk's lean), or open the per-card merge as its own item.**

**The consequences a builder must not discover:**
- **A restore that races a purge LOSES** (device A restores; device B purges): the purge is monotone and wins.
  **Named, not fixed** — *he chose "permanently".*
- **An unsynced local edit to a record that is purged elsewhere is DISCARDED on arrival** (rule 4). **That is
  data loss by design**, and it is the item he asked to be gone — **but it is loss of a possibly-newer edit, so
  the confirm step's copy does not say "nothing else is lost".**
- **Offline:** *a purge made offline hides the item immediately on that device and is queued;* **the copy says
  "will be deleted from all your devices", not "has been".** **A purge that cannot reach the server is not yet
  permanent anywhere but here.**
- **Backups, honestly.** *Purging removes the content from the live database and from every device that
  syncs. It does NOT reach database backups the host may retain until they rotate.* **The confirm's wording
  must not promise more than "can't be brought back"** — *it is true of the product; it is not a claim about
  the host's disks.*

---

## §4 · DOES IT NEED A COLUMN? — YES, ONE. **IT STOPS FOR NICK.** (chat 1's condition, met)

**The marker in §3 rule 1 has to live somewhere the server can guard on. Measured options, and the lean:**
| option | what it is | verdict |
|---|---|---|
| **(1) ONE nullable column `journal_entries.purged_at` — LEAN** | additive, no default, no backfill, no `NOT NULL` — the `page_settings` / `page_links` recipe | **the minimal honest shape.** **Five edit sites** (insert column list, values placeholder, `on conflict do update set`, parameter array, read mapper) **plus the guard clause**, **and the client census — every site that copies or rebuilds a `JournalEntry`** (the `page_links` and `eraserWidth` censuses, applied a third time). |
| (2) a NEW TABLE `purged_records (id, user_id, purged_at)` | tombstones apart from content | **more**: a new pull collection, a new `/sync` field, a client contract change, a second place every device must check. *Its case: content rows would never carry a purge flag.* **Not needed for one table's worth of items.** |
| (3) a SENTINEL in `deleted_at` (e.g. a far-future date = "purged") | zero schema | **REJECTED — a value that secretly means something else in a column every reader treats as a date is exactly the silent trap this house keeps paying for.** |
| (4) a marker smuggled into an existing jsonb (`page_settings`) | zero schema | **REJECTED — overloads a column that is a page's *dress*.** |
**Cards need no column** (§3): the list rides in the board's own jsonb.
**The plain-words question for Nick (Fable relays it):** *"To make "Delete Permanently" stick on every device,
Wrizo must keep a tiny empty record of each permanently deleted page or board (its name is gone — only an id and
a date stay), so a device that still has the old copy can't bring it back. That needs one small database
addition. Is that OK?"* **Default: none — a schema word is his alone.**
**What a builder may start BEFORE his word:** **the confirm dialogs and the Trash's buttons, the card purge
(jsonb-only), the client tombstone-apply exception, the counts.** **What waits: the entry purge's server half.**

---

## §5 · THE CONFIRM STEPS — one for an item, one for the bin

*(The house's law for a soft delete is "never asks". This is not that: **nothing can undo it.**)*
- **Where:** a **"Delete Permanently"** button on each item in the Trash view (VW2's Trash — the row/thumbnail's
  own action, beside "Restore"), and **"Delete Permanently" for the whole bin** at the Trash view's head. **Never
  on a canvas, never in a right-click menu, never a keyboard shortcut** — *permanent is a place you go, not a
  thing you can hit.* **Not reachable from the drag.**
- **ONE ITEM.** A dialog **naming the thing**: ***"Delete "Chapter 3" permanently?"*** — *"It can't be brought
  back — not from the Trash, not on any of your devices."* **Two buttons: "Keep in Trash" — the default,
  focused — and "Delete permanently"** (destructive treatment, **never the Enter default**). **It states what
  goes with it:** a **board** — *"Its 12 cards go with it. Pages it shows are not deleted."*; a **page** —
  *"A board that shows this page loses its card."*; a **card** — *"From Characters."* **A trashed page whose
  paired plan board holds cards names that too** (§6).
- **THE WHOLE BIN.** **Counts, computed over the FULL enumeration — never from a scrolled or paged view**
  *(the listing-trap law)*: ***"Delete everything in the Trash permanently? 7 pages, 3 boards, 12 cards."***
  **The destructive button carries the total — *"Delete 22 items permanently"* — so the number is in the
  act.** **"Keep in Trash" is the default.** *The same "not on any of your devices" line.*
- **The rival, in its strongest form — TYPE-TO-CONFIRM for the whole bin** (type "DELETE" or the count):
  *the blast radius is the whole bin across every device, and a button is a click away from a habit.* **Its
  cost:** *friction on a writer who sincerely wants an empty bin — and this app's ADHD writer is exactly who a
  typed word punishes.* **This desk's lean: counts in the button + default on "Keep"; the typed word only if
  Nick or Fable wants more friction.** **The unmeasured risk sits on the lean:** *nobody has measured how
  often the bin holds something the writer forgot was there.*
- **After:** a whisper — *"Deleted permanently."* — **with NO Undo** (there is nothing to undo *to*). **The
  item leaves the Trash at once (the tombstone hides everywhere).** **Offline:** *"Will be deleted from all
  your devices when you're back online."*
- **Empty bin:** the whole-bin button is **absent, not greyed**, when the Trash is empty.

## §6 · WHAT A PURGE DOES TO WHAT REFERENCES IT

- **Dangling pins.** A page card on a board that points at a purged page: **it was hidden while the page was
  trashed (§3(c)); after a purge it can never return.** **Rule: a pin to a purged id renders NOTHING and is
  pruned on that board's next save** (an ordinary edit) — **the readers already skip a deleted target, and a
  purged entry is deleted by §3 rule 1.** *S0 censuses the readers; this desk asserts the rule, not the count.*
- **A page's paired plan board (`planBoardId`, 1:1).** **Purging a page does NOT purge its plan board** — *it
  may hold the writer's cards.* **It stays an ordinary board, unpaired.** **The confirm names it if it holds
  cards.** **Hand-up, with a lean:** *should purging a page offer to purge its plan board too?* **Lean: no —
  never a second act inside one confirm; the board is its own item in the Trash if it was trashed.**
- **A purged board's nested children and pages** are **members, not contents** (§3(c)): **untouched.**
- **The counts** (VW4's *"3 pages, 1 board, 4 cards"*) **drop with the purge.**
- **Restore** is impossible by construction — *the Trash's Restore is absent on a tombstone, and a tombstone
  is in no list.*

---

## §7 · THE CHECKS OWED (standing laws: drivers never assume existence · real pointer events · seed through the seams · absolute worktree path · select by name · release where the writer releases · **park, never edit** · **audit the park COUNT**)

**On a TWO-DEVICE DOUBLE — the suite already has `/api/_sync_mode { pull }` — never on one browser pretending:**
1. **Reaches the other device:** purge on A → B's next pull replaces its live copy with the tombstone; **the item is absent from every list on B.**
2. **A stale holder cannot revive it:** B (still holding it) pushes → **the server refuses** (the row is unchanged, byte-for-byte: still blank, still purged) → B's next pull removes it.
3. **The long-offline device:** A purges; C is offline; C returns with a cursor older than the purge and a **dirty local edit** to the item → **C's push is refused, C's pull applies the tombstone over its dirty edit, and the item is gone** *(rule 4's exception, asserted — not assumed).*
4. **Monotone:** **no upsert of any kind clears `purged_at`** — including one with a newer `updated_at` and `deleted_at: null` (*a "restore" of a purged item*).
5. **The server blanks the content** — *read the row after the purge: every payload column is empty; id, `user_id`, stamps kept.*
6. **No hard delete anywhere:** a source scan asserts **no `delete from` on any synced table** in `apps/server/src` — *the guard that stops the obvious build from ever being written.*
7. **A card:** purge removes the box, adds its id to `purgedCardIds`; **the second device's stale copy of the board, on meeting the list, drops the card**; **the named residual is asserted as what it is** (a later-stamped offline edit resurrects it until the purger's next sync, then it converges).
8. **Dangling pin:** a board pinning a purged page shows no card and, after its next save, holds no pin.
9. **The confirm:** default focus is "Keep in Trash"; **Enter does not delete**; the item dialog names the thing and what goes with it; **the whole-bin dialog's counts equal a programmatic count over the full enumeration** *(computed by the check, not read from the dialog)*, **and the button reads that total.**
10. **Not reachable from the drag, a right-click menu, a canvas, or a shortcut** (probe each; assert absent).
11. **Empty Trash → absent, not greyed.**
12. **The soft-delete confirm's words never promise permanence** (charter §7 check 5) **and this dialog's words never promise more than "can't be brought back"** (§3, backups).
13. **Offline:** the purge hides at once, is queued, and the copy says "will be".
14. **Both `HARNESS_PARKED` settings CLEAN; park count audited.**

---

## §8 · WHAT THIS SUPERSEDES — marked, never erased
- **Charter §2's callout — *"Empty Trash is the only permanent act (VW4)"*** → **Delete Permanently, per item and for
  the whole bin (§5), designed here; VW4's `emptyTrash()` seam is this item's whole-bin act.**
- **Charter §3(a) — the fork and its rival (iii)** → **closed: (i) ruled.** **§3(b) — the rival (vanish with Undo)** → **closed.**
- **Charter §6 — 168-B's gate "168-Q2"** → **met.** **§Q — Q1, Q2 ANSWERED.** **§F2** → **resolved (§1a).** **§F1** → **still open.**
- **Charter §7 check 1's "(or, under (iii), the fork appears)"** → **the fork variant is dead; only "the act happens".**
- **Unchanged:** the two verbs, the drag to the icon and its sources, memberships outliving deletion (§3(c)), the right-click menu (168-C), pages' first Delete.
