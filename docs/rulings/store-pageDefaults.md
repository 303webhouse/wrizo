# Rulings: `apps/desktop/src/store/pageDefaults.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[pageDefaults §n]` points here.

## pageDefaults §1

From `apps/desktop/src/store/pageDefaults.ts`, line 5 at `7f1c6a84` (the comment that stays: "the writer's default page dress: the per-page value lives on the entry, this file holds the per-user default, one shape; local first (read synchronously at birth), the server is the durable copy").

```ts
// ITEM 83 M2/M3 (R6) — THE WRITER'S DEFAULT PAGE DRESS.
//
// Nick's ruling: page settings are "linked to the current page a user is on
// but reset to defaults when the user creates a new page", and there is "a
// setting for the user to set their own default page settings at the bottom
// of the PAGE menu".
//
// TWO STORES, ONE SHAPE. The per-page value lives on the entry itself
// (JournalEntry.pageSettings, synced with the page); this file holds only the
// per-USER default. They share the PageSettings shape deliberately — "set as
// my default" is literally a copy of the open page's own settings, and two
// shapes would let them drift apart the way the sliver's hand-synced width
// formula drifted from the paper's.
//
// LOCAL FIRST, SERVER BEHIND IT. The default is read synchronously at page
// birth (persistence.createJournalPage), which cannot await a fetch, so the
// value is mirrored into localStorage and served from memory. The server is
// the durable copy across devices: hydrate() pulls it on boot, and every set
// pushes. A failed push leaves the local value intact and the writer's next
// boot re-pulls — the same offline-tolerant posture the rest of this app
// keeps (and the reason item 89's dirty-set fix mattered).
```

## pageDefaults §2

From `apps/desktop/src/store/pageDefaults.ts`, line 51 at `7f1c6a84` (the comment that stays: "the page's KIND is not dress: stripped at the door, so "Set as my default" on a Research page never makes every future page Research").

```ts
// ITEM 114 (item 83 errata E4) — THE KIND IS NOT DRESS, AND MUST NOT RIDE THIS
// CHANNEL.
//
// The defect this closes, found in S0 (e) before the code existed rather than
// after a writer hit it. `PageSettings` is deliberately ONE shape serving two
// stores (see this file's own header above): the per-page value and the
// per-user default. "Set as my default" is literally a copy of the open page's
// settings — `setUserPageDefaults(current)`, CascadePanels.tsx — and
// `persistence.createJournalPage` stamps that copy onto every page born after.
//
// So without this strip, a writer who pressed "Set as my default" while a
// RESEARCH page was open would make EVERY FUTURE PAGE Research. Nothing would
// announce it; they would simply find every new page declaring itself research
// with MLA chosen. A page's dress is a preference. A page's KIND is a fact
// about that page, and facts do not travel by default.
//
// STRIPPED AT THE DOOR, not at the call site, so the rule holds for callers not
// yet written — the same "close the class, don't fix the instance" discipline
// the two-drawer repair settled on. Applied on the way OUT (set) and on the way
// IN (hydrate): the server can only ever hold what this app pushed, but a value
// pushed by an older build, or by a build that regresses this, must not be able
// to come back and re-dress the writer's births.
//
// Nothing here forbids the kind from PERSISTING — it persists exactly where the
// brief rules it should, on the page's own `page_settings` row. It is only
// barred from the per-user default.
```

## pageDefaults §3

From `apps/desktop/src/store/pageDefaults.ts`, line 88 at `7f1c6a84` (the comment that stays: "a page BORN now is born at 11 pt; a page that already exists keeps reading PAGE_SIZE_DEFAULT (12) through its absent size, so nothing is rewritten and no field is new; the writer's own default dress comes first, with its own size if it set one, else the app's floor (PAGE_SETTINGS_FALLBACK)").

```ts
/** TOOLS #14 (Nick, Nov 2) - a page BORN now is born at 11 pt; a page that already exists keeps reading PAGE_SIZE_DEFAULT (12) through its absent size, so nothing is rewritten and no field is new
 *  (`size` is the page's existing setting). The writer's own default dress comes first, with its own size if it set one; without defaults the app's floor (PAGE_SETTINGS_FALLBACK, the values it renders today). */
```
