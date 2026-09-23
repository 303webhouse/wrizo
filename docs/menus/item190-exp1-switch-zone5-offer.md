# ITEM 190 — the Experiments switch + zone 5's geometry · OFFER (tools lane; branch `item190-exp1-rail`)

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

**Checks 2-7 of §7 are NOT in this file** — they cover the right-click
menu, the left strip's three acts, the re-finding branches, and the Linked
list's own filter/sort/group behavior, all either PW's side of §8's split
or blocked on `store/anchors.ts`. `exp1.mjs`'s own header states this
outright so a thin file doesn't read as a finished one.

## Verified without the box

- Fresh worktree, `pnpm install` clean (285 packages).
- `tsc --noEmit`: **0 errors** (all TS edits: `experiments.ts`,
  `CascadePanels.tsx`, `deskLexicon.ts`, `Tutor.tsx`, `LinkedRail.tsx`).
- `pnpm run build:web`: **clean**, re-run after the CSS edit too.
- New CSS classes (`wz-tutor-tabs`, `wz-tutor-tab`, `wz-linked-rail`)
  confirmed present in the built CSS; the new store key
  (`wrizo-experiments`) and lexicon string ("Nothing linked yet") confirmed
  present in the built JS.
- `node --check scripts/harness/exp1.mjs`: clean.

## Named residuals, not silently carried

- **The Linked list's own content** — filter, sort, group-by-tag, open
  (both popups), remove/unlink — waits on PW's `store/anchors.ts`
  signatures, per Fable's own instruction. `LinkedRailBody` is the single
  file that changes when it lands.
- **§7 checks 2-7** — same dependency, plus PW's own menu/strip work.
- **Zone 5's tab-state doesn't persist across page navigation** (local
  `useState`, resets to "Tutor" on every mount) — a deliberate choice
  (§ justification in `Tutor.tsx`'s own comment: "no state you didn't ask
  for," the same posture `open`/`docked` already have), named here in case
  a later reviewer expects otherwise.

## Status

**BUILT (switch + zone 5 geometry + §7 check 1).** tsc 0 / build:web 0 /
new markers confirmed in bundle / harness syntax-checked. Not run — needs
the box, and needs PW's `store/anchors.ts` before the rest of §7 can be
written. Offered now so the switch/geometry piece isn't waiting on either.
