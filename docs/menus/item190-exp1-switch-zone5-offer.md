# ITEM 190 — the Experiments switch, zone 5, and the Linked list · OFFER (tools lane; branch `item190-exp1-rail`)

**UPDATE, 2026-09-24 afternoon:** merged PW's `exp1-connect-text` @ `78d4529`
(`store/anchors.ts` is real now) per Fable's instruction. The Linked list's
own content — filter/sort/group-by-tag, remove/unlink — is built below,
reading `anchors.ts` through its own exported functions only, never writing
through it. Re-merges when PW moves the store further, as ruled.

§8's split (`docs/menus/b-exp1-connect-from-the-page.md`): PW owns the text
side; **TOOLS owns "item 190's Experiments switch and everything it hides ·
zone 5 and the width budget · the Linked list · open · remove/unlink."**

**This offer builds the switch and zone 5's geometry — the two pieces that
need neither PW nor the box, per Fable's own instruction ("START WITH: the
switch and zone 5's geometry — neither needs PW"). The Linked list's own
content is NOT built here** — it reads `store/anchors.ts`
(`resolveAnchors`/`getLinksForPage`/`getLinksForAnchor`), which PW writes
and which does not exist on this branch. Building against it now would mean
mocking past the one seam §8 names as PW's alone — the exact hazard §8's own
note warns against, just approached from the read side instead of the write
side.

## What's built

**0. The Linked list itself — `store/linkedRail.ts` + `components/LinkedRail.tsx`,
against the real `store/anchors.ts`.**
- `resolveLink(link)` — reads `getJournalEntry` (the same reader every
  other surface uses) to turn a bare `Link` into what the rail shows: a
  label, a `RailKind`, tags, recency. **Tags are read from the TARGET at
  display time, never the link** (the ruling, twice over — PW's revised
  report and the type's own comment). A card's target has no tags at all
  (`Box` carries none) — real, not an omission.
- **`RailKind` is honestly narrower than Nick's five-way list.** He named
  *"sources or pages or cards or boards or imported docs"* — this lane can
  derive **board** (`pageType==='board'`), **card** (a `Box`), and **note**
  (a bare `Link` with no target — §3's "Note This") from real fields today.
  **'page' vs 'source' vs 'imported doc' among ordinary entries has no
  field to tell them apart** — `JournalEntry.pageType`'s union has no such
  member. Every non-board entry target reports `'page'`. Not a guess at the
  finer split — the schema doesn't carry it yet, stated in
  `linkedRail.ts`'s own header rather than resolved by a heuristic.
- **Sort**: recency (default) and kind, both in `linkedRail.ts`.
- **THE GROUPING LAW, a third time**: `groupByTag` — an item with N tags
  appears under N groups; zero tags means zero groups, not a fallback
  bucket.
- **Remove = unlink**: calls `anchors.ts`'s own exported `unlink(pageId,
  linkId)` — a sanctioned write through the seam's own function (§8: *"if B
  needs a write, it asks A for a function rather than reaching past the
  seam"* — PW already built this one), never a direct mutation of
  `PageLinks`. The control's own wording says which of the two it does
  ("Remove this link — {label}"), never a bare "Remove" (§3/§5's law).
- **Open, partial.** A page/board target navigates via `routeForEntry`. **A
  card target navigates to its board, not a card popup** —
  `BoardCardPopup` is a local, unexported function in `BoardEditor.tsx`;
  reusing it needs that file to export it (or a rail-appropriate preview of
  its own), out of this build's scope. Named, not silently degraded.
- **The selected state is NOT built** — "click a linked span → only its
  source(s)" needs PW's painted-mark click detection (§6c,
  `CSS.highlights`), which doesn't exist on this branch. The rail renders
  the RESTING state only.

**Test seam widened, precedented.** `store/persistence.ts`'s
`JournalPageSeed` (item 85-C's own closed whitelist) gained one field,
`pageLinks?: PageLinks`, presence-checked exactly like every field beside
it — the harness had no way to seed a page WITH connections already on it,
the identical gap item 129/85-C already closed for `boxes`/`tags`/etc. This
never touches `anchors.ts`'s own write path; it rides the same
`saveJournalEntry` call every other seeded field already does.

**1. `store/experiments.ts` — the one flag, per §8's own law** ("Both read
the flag from ONE place, so 'off' cannot be half-true"). Mirrors
`store/writingSettings.ts`'s exact shape (module-level `current`/`subs`,
`load()` merging onto `DEFAULTS`) — the house convention for a small,
persisted, cross-surface toggle, not a new pattern. One flag today,
`connectFromThePage: boolean`, OFF by default (his own word).

**2. The switch — `Settings → Experiments → Connect from the page`.**
Lives in `CascadePanels.tsx`'s `CascadeSettingsPanel` — the app's own
existing "Settings" (site-wide, not the per-page gear; that distinction is
already drawn in that file's own header comment). One toggle button,
matching `CascadeThemePanel`'s existing `aria-pressed`/`active` shape.
**No new heading element** — that panel's own header comment says "invent
nothing," so "Experiments" names itself in the button's own label rather
than a new section wrapper.

**3. Zone 5 — inside Tutor's existing panel, not a new one.** The ratified
rule (Fable, records 2026-09-23): *"THE MOCKUP's TABBED RIGHT COLUMN IS THE
APPROVED 'ONE PANEL COLUMN PER SIDE' — the Tutor and the rail's lists TAKE
TURNS IN IT. NO THIRD SURFACE."* Tutor's own panel (`components/Tutor.tsx`)
already occupies that column (`.desk-frame-tutor-panel-anchor`, pinned to
the stage's own right edge, TU1 S2). Adding a second overlay competing for
the same screen space would itself be a third surface — so zone 5 is a
**tab bar inside Tutor's existing panel**, switching its body between the
existing Tutor content and a new "Linked" body:

- `.wz-tutor-tabs` / `.wz-tutor-tab` — a small text-scale tab pair (matching
  `.wz-tutor-dock-btn`'s existing chrome), rendered **only when the switch
  is on**.
- `components/LinkedRail.tsx`'s `LinkedRailBody` — zone 5's own content
  component. Today it renders the honest waiting state (`t('zoneLinkedWaiting')`
  → "Nothing linked yet.") rather than a fabricated list — the real list
  swaps in here once PW's store lands; nothing else changes under it.
- The width budget is inherited for free: both the tab bar and
  `LinkedRailBody` are plain block children of `.wz-tutor-panel`, which
  already owns its own measured width (`panelWidthPx`, FX18 S2) — no new
  width math was needed or added.

**4. `§7` check 1 — SWITCH OFF = v1 — `scripts/harness/exp1.mjs` (built
partial, on purpose, stated in its own header).** Two proofs:
- **Structural absence**: with the switch off, none of `wz-tutor-tabs` /
  `wz-tutor-tab` / `wz-linked-rail` appear anywhere in the Tutor panel's
  outerHTML — the buildable, single-build-instance form of "byte-identical
  to the pre-change build" (this lane can't diff against a separately
  checked-out prior bundle from inside one running build; their total
  absence is the same claim's substance).
- **Round-trip is a no-op**: switch on (mounts the tab bar + Linked body),
  back off, fresh remount — the panel's outerHTML matches the very first
  OFF read, byte for byte. Proves OFF really means off, not "off until
  you've touched it once."
- A third check confirms the ON sanity case (the tab bar DOES mount when
  on) — so the OFF-absence checks are proven against a real gate, not a
  dead, always-false prop.

**5. `§7` check 5, PARTIAL — the resting list — `scripts/harness/exp1.mjs`.**
A four-link fixture (page/board/card/note, one of each `RailKind`, spaced
recency, `research`+`characters`+`plot` tags), seeded through the widened
`pageLinks` seed field — real pointer presses (`trustedDispatch`, item 151's
own instrument) throughout, never `.click()`:
- (a) default sort (recency) — 4 rows, most-recently-connected first.
- (b) kind sort — Page, Board, Card, Note, `linkedRail.ts`'s own
  `KIND_ORDER`.
- (c) **the grouping law** — three tag groups, alphabetical; the card and
  the note in neither.
- (d) remove = unlink — the row disappears immediately, survives a
  reload (a real write, not optimistic-only), and a fourth check confirms
  the soft-delete shape itself: the link's `deletedAt` is set, its anchor
  survives, the target's own row is untouched (Nick's word: "Remove unlinks
  and never deletes").
- (e) the honest empty state, for a page with no links at all.

**Checks 2-4 of §7, and the selected-state/popup halves of check 5, are NOT
in this file** — the right-click menu, the left strip's three acts, the
re-finding branches, PW's own side of §8's split, plus the painted-mark
click detection and `BoardCardPopup`'s own export, neither of which exists
yet. `exp1.mjs`'s own header states this outright so a partial file doesn't
read as finished.

## Verified without the box

- Fresh worktree, `pnpm install` clean (285 packages), re-verified after
  the merge.
- `tsc --noEmit`: **0 errors**, `apps/desktop` (all TS edits) **and**
  `apps/server` (PW's merged `migrate.ts`/`sync.ts`, sanity-checked since
  this branch now carries them).
- `pnpm run build:web`: **clean**, re-run three times (after the CSS edit,
  and again after the Linked-list build).
- New CSS classes (`wz-tutor-tabs`, `wz-tutor-tab`, `wz-linked-rail`,
  `wz-linked-rail-item`) and the new store key (`wrizo-experiments`) and
  lexicon strings confirmed present in the built bundle.
- `node --check` clean on `exp1.mjs` and (sanity) PW's merged
  `exp1-b-mutate.mjs`/`exp1-b-proof.mjs`.

## Named residuals, not silently carried

- **The 'page'/'source'/'imported doc' three-way split** Nick asked for has
  no field in `JournalEntry` to derive it from today — every non-board
  entry target reports `'page'`. Stated in `linkedRail.ts`'s own header,
  not resolved by a heuristic. A schema question for PW/Fable, not a build
  gap this lane can close alone.
- **Open, for a card target, goes to its board, not a card popup.**
  `BoardCardPopup` is local/unexported in `BoardEditor.tsx`. Wiring the real
  popup needs that file to export it, or a rail-appropriate preview.
- **The selected state** ("click a linked span → only its source(s)") waits
  on PW's painted-mark click detection (§6c).
- **§7 checks 2-4** — PW's own side of §8's split.
- **Zone 5's tab-state doesn't persist across page navigation** (local
  `useState`, resets to "Tutor" on every mount) — a deliberate choice
  (`Tutor.tsx`'s own comment: "no state you didn't ask for," the same
  posture `open`/`docked` already have), named here in case a later
  reviewer expects otherwise.

## Status

**BUILT: switch + zone 5 geometry + the Linked list's resting state (sort/
group/remove) + §7 checks 1 and 5-partial.** tsc 0 (desktop + server) /
build:web 0 / new markers confirmed in bundle / harness syntax-checked. Not
run — needs the box. Re-merges from `exp1-connect-text` when PW moves the
store further, as ruled.
