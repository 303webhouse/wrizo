# PB1 — the unborn surface (specification, owed before the build)

**Item 71.** Written to Fable's ruling of 2026-07-26, §4: *"enumerate the
unborn surface … specify what each does on an unborn page — most should be
inert or absent, none should throw or half-work. Discovering that list
mid-build is how a core-path ticket goes long."*

Read against `origin/main` @ `8726523`; line numbers grep-confirmed there,
re-confirm before editing. Nothing here is proven by execution — the browser
reproduction is still owed (held for chat 6's DF1.1 sweeps).

## 0. The three principles this list is derived from

1. **Absent beats inert beats broken.** An affordance that cannot mean
   anything yet should not be in the room. One that must stay for chrome's
   sake must be honestly inert, never silently no-op.
2. **Anything that creates a durable relationship births first, then acts**
   (ruling 2). Such an affordance is therefore neither absent nor inert — it
   is *ordinary*, with one extra step in front of it.
3. **A setting is not content** (ruling 2). A setting change on an unborn page
   edits the **descriptor in the URL** (ruling 1), never a record.

## 1. The door census — which doors change, and which do not

Ruling 2 splits the eight creation doors on a single question: *does this door
create a durable relationship in the same act?*

**Doors that already create a relationship — born immediately, UNCHANGED.**
These were never the litter. The room is entered at the moment it is made:

| Door | Site | Relationship created |
|---|---|---|
| Board → New Page Card | BoardEditor.tsx:1118 | page **+ pin** to this board |
| Board → Pair with a page… | BoardEditor.tsx:2045 | page **+ pairing** |
| Pin sheet → new board | PinToBoardSheet.tsx:35 | board **+ pin** of the page |
| Page → PLAN → | persistence.ts:1470 | board **+ pairing** |

**Doors that create a bare room — these become unborn.** Every one of these is
a "give me a blank surface" door with no relationship attached, and every one
of them is a litter source today:

| Door | Site | Descriptor it will carry |
|---|---|---|
| Arrival → Write | Arrival.tsx:62 | `origin=loose` |
| Catch (Desk, rail, `n`) | useCatch.ts:14 | `origin=journal` |
| Cascade → New Page (journal) | CascadePanels.tsx:175 | `origin=journal` |
| Cascade → New Page (loose) | CascadePanels.tsx:235 | `origin=loose` |
| Drawers → New Page | DrawersTree.tsx:147 | `origin=journal` |
| Cascade → Create board ×2 | CascadePanels.tsx:277, :294 | `kind=board&binder=<id>` |

**The empty-board source, named.** The two `createBoard` doors call
`createBoardPage(project.id)` with **no title**, so every press mints a
persisted, boxless board. With `getOrCreatePlanBoard` idempotent per page,
these two doors are the only way a *duplicate* empty board can accrue — which
matches the export's finding.

## 2. The unborn route (ruling 1 — the descriptor is in the address)

`/page/new?<descriptor>` — reload-safe by construction, no storage, no store
row, and no fallback question to answer, because the door's meaning is in the
address.

| Param | Values | Meaning |
|---|---|---|
| `origin` | `loose` \| `journal` | the page's home-to-be |
| `kind` | *(absent)* \| `script` \| `board` | which surface renders |
| `binder` | project id | the binder a board/page will belong to |
| `title` | string | a board's name — **content**, see §4 |

Unknown or malformed params degrade to a plain unborn loose page rather than
throwing: the address is a hint about a room that does not exist yet, so it
can never be authoritative enough to fail on.

## 3. The synthetic record — the mechanism that keeps children honest

Two shared components hard-require a record and are used by surfaces far
outside this ticket, so neither may be loosened:

- `useCascade` (Cascade.tsx:139) does `const currentEntryId = subject.entry.id`
- `ModeStrip.onPublish` (ModeStrip.tsx:23) is a required prop

So the unborn surface **builds a `JournalEntry`-shaped object from the
descriptor and passes it to its children exactly as today.** Its id is minted
up front (`generateId()`), so it is stable across the unborn session and
becomes the row's id at birth.

**It never enters the store.** Not via `saveJournalEntry`, not via `upsert`,
not into `cache.journalEntries`. This is the load-bearing rule, and §1 of the
root-cause map is why: `flush()` (persistence.ts:168) serializes
`cache[name]` **wholesale**, so any unborn row in the cache reaches disk on
the next flush of that collection — which every route change forces via
`flushNow()` — and `upsert` also marks it dirty, so the sync loop would push
it to the server. An unborn page that touched the store would be the very
litter this ticket removes.

Consequence worth stating plainly: **`getJournalEntry(unbornId)` returns null
for the whole unborn life.** Every affordance below is classified by what it
does under that fact.

## 4. The affordance table — the page

| Affordance | Unborn behaviour | Why / mechanism |
|---|---|---|
| **Typing** | Works, unchanged | the whole point; the first word births (§5) |
| **Beginnings row** (BG1/BG2) | Renders, unchanged | its gate is `wordCount === 0`, which an unborn page always is. Screenplay/Sprout/Plan below |
| ↳ **Screenplay door** | Rewrites the descriptor to `kind=script`; still unborn | ruling 2 — a setting is cheap and reversible, and must not birth. Today it calls `saveJournalEntry({…pageType:'script'})`, which on an unborn page would create the row |
| ↳ **Sprout door** | Works, unchanged | FX15/FX16's `optIn()` is a device-local pref; touches no record |
| ↳ **Plan door** | **Births, then mints, then pairs** — order fixed | ruling 2. Never a dangling pointer, never an orphan board |
| **First-line invite** | Works, unchanged | device-local pref only (FX16) |
| **Star** | **Absent** | `patchJournalEntry` → `getJournalEntry` → null → silent no-op. A star that does not stick is the definition of half-work |
| **Tags** (add/remove) | **Absent** | same null no-op |
| **Port to a Board…** | **Births, then ports** | ruling 2 — a durable relationship |
| **Pin to a Board…** | **Births, then pins** | ruling 2 — a durable relationship |
| **Places / PageFace home + memberships** | Renders from the synthetic record: home reads the descriptor's origin, memberships empty | `describePageHome` (pageHome.ts:33) is pure over the entry; `getBoardsPinning` returns `[]` for an unstored id |
| **Publish / export** | Works, unchanged (exports nothing) | operates on the passed entry; an unborn page has zero words **by definition**, so this is identical to today's behaviour on any empty page — no new case |
| **Tutor** | **Absent** | `TutorProps.entry` is required and it has no projectId, no thread, and no text to read. Reuses the *existing* precedent: `tutor={gateActive ? undefined : <Tutor …/>}` — DeskFrame already accepts an absent Tutor (the first-run gate does exactly this) |
| **Rhizome / progress instrument** | **Absent** | same existing precedent (`rhizome={gateActive ? undefined : …}`), and at zero words it renders nothing anyway |
| **Milestones** | Already degrades | `projectMilestones` (milestones.ts:106) does `getJournalEntry` → null → returns null; ModeStage's documented no-greyed-states fallback to Words already covers it |
| **Way-back (W2)** | Does not participate | `useWayBack({ participatesInWayBack: false })` — the option already exists (B1 uses it for system boards). An unborn page is not a place to be returned to |
| **TTFK / session log** | Instruments, but writes no row unless born | `useSessionLog` already supports `enabled: () => …` and returns early on it. The keystroke it measures *is* the birth — the metric's truest form — but a session for a page that never existed would be its own litter |
| **Mode switch** (Free Write ↔ Draft) | Works, unchanged | per-page `localStorage` key on the minted id; no record |
| **Board/Script delegation** | By descriptor, not record | the outer `PageEditor` reads `getJournalEntry(id)?.pageType` today; unborn reads `kind` |

## 5. Birth — the act itself

Triggers (ruling 2): **the first word**, or **an act creating a durable
relationship** — pair, port, pin.

One synchronous call, in this order, with no window between the steps:

1. build the real record from the descriptor **with the first content already
   in it** — never create-empty-then-save, which is the loss window;
2. `saveJournalEntry(...)` — the same path every other write takes, so the
   first word reaches disk under the existing 300ms flush guarantee, offline
   included;
3. apply the descriptor's extras (binder, pin, pairing) in the same act;
4. `navigate('/page/<id>', { replace: true })` — the address stops describing
   a door and starts naming a room.

The URL swap happens **after** the write, so a crash between them loses
nothing: the row is already durable and the writer is simply on a `/page/new`
address that no longer matters.

## 6. The board

A board is born when it has a box (S2), with ruling 3's general rule:
**a name is content.** So:

- `createBoardPage(binderId, title)` **with** a title → born immediately.
- **Untitled** → unborn board surface, born on its first box.
- Boards minted by pin/pair (§1) → born immediately; the relationship is the
  content.

Unborn board affordances follow the same table: the beginnings row renders
(BG1/BG2 — its gate is `sorted.length === 0`, which an unborn board always
is), every door on it births-then-acts, and the mode bar's PAGE → door is a
departure, not a mutation.

## 7. Risks and notes carried forward

1. **`kind=script` widens the surface.** Ruling 2 forbids Screenplay from
   birthing, so an unborn page must be able to render as a script. Coupling is
   light — `ScriptEditor.tsx` has only two `entry.` reads — but it is a second
   surface to hold unborn, and it is the largest single risk to the July 30
   gate. If it threatens the date, the fallback to propose (not to take
   unilaterally) is: Screenplay on an *unborn* page is the one setting that
   births, disclosed as a deliberate exception.
2. **Empty paired plan boards remain possible** — by design now. Ruling 2
   makes pairing a birth trigger, so pressing PLAN → and adding no box leaves
   a real, empty, *paired* board. That is a room deliberately opened, not one
   nobody entered; recorded so the next reader does not mistake it for
   surviving litter.
3. **Two false comments must die with this ticket**: persistence.ts:636 and
   useCatch.ts:8 both still assert honor-discard's guarantee. They are the
   reason the regression was invisible for a week.
4. **No sweeper** (S3): existing empties are never deleted by code, and never
   a background reaper. Nothing in this specification touches an existing row.

— chat 5, for item 71, before writing a line of the fix.
