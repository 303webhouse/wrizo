# ITEM 112-A · BUILD BRIEF — REVISE'S DOORWAY AND FLOOR
### Build-ready · authored 2026-09-02 by the item-84 desk · for a BUILDER lane
**WORKTREE: named by the builder lane's own assignment, and NEVER the primary
checkout** (item 110, standing). Queues behind the Draft-roster build.

**GOVERNING DOCUMENT:** `docs/menus/tutor/item112-revise-charter.md` — RS1–RS7 ratified
by Nick 2026-09-02. **This ticket is RS1 and RS2 only.** The three tenants (Type
section, Counsel roster, error lens) are **112-C, 112-D, and the parked seven** and do
not appear here. **Nick's word: THE EMPTY FLOOR SHIPS** — a walkable empty room is a
device sitting; an unwalkable designed one is not.

---

## §1 · WHAT SHIPS

A Revise mode the writer can enter, write in, and walk — carrying both hands' machinery
and nothing else. **Success is a room, not furniture.**

**Explicitly NOT in this ticket:** the Type section (RV1, → 112-C) · the Revise Counsel
roster (→ 112-D) · error flagging in any form (T1–T7, parked) · RV3's sought door (open
with the identity backlog, per the charter) · any change to Free Write or Draft.

## §2 · THE DOORWAY

Today, `apps/desktop/src/components/ModeStrip.tsx` carries:

> `{ key: 'revise', label: t('modeRevise'), live: false, active: false, onClick: () => flashSoon(t('modeRevise')) }`

It renders `aria-disabled`, carries the `deferred` class, and flashes a coming-soon
label. **Revise becomes live**: `live: true`, a real active state, and the strip's
**existing** switch behavior — no new gesture, no new entry point. The `flashSoon` call
for this key goes away; **check whether `flashSoon` still has other callers before
removing anything it depends on** (Workshop remains deferred and likely still uses it).

`ModeSwitcher` is the other side of the same truth — it currently treats `journal` and
`drafting` as the live modes and carries `revise` only as Draft's sub-label. **Both
sides must agree**, and the sub-label's fate is a stop-and-surface if removing it
changes what Draft's own strip reads.

**S0 CHECK — mode persistence.** Determine and record whether mode selection persists
per page, per session, or not at all, and make Revise behave exactly as Draft does. Do
not invent a persistence rule for the new mode.

## §3 · THE SURFACE — FREE EDITING

**Revise is the free-editing surface.** The writer works backwards through finished
text; that is the mode's definition and the reason the error lens will later be lawful
here and nowhere else. **The forward-only instrument does not mount in Revise** — not
disabled, not configured off: absent.

**S0 CHECK — the editor path, and what it settles.** Determine which editor component
Revise renders through, and record the answer. The named `decorateEditorFor` call sites
are `BoardEditor`, `ForwardOnlyEditor`, and `PageEditor`; Revise is in none of them
today because Revise does not exist. **Choosing Revise's editor path answers, as a
by-product, the routing question the parked lens will need** — whether Revise's rendered
text runs through `decorateEditorFor`'s decorator override, which is the seam the flag
decorator will later use. **Record the answer in the ticket even though the lens is
parked**; it is the single most useful fact this build can leave behind.

Whatever path is chosen: **`entry.text` stays plain text**, character counts stay 1:1
through any decoration, and nothing in this ticket persists a mark of any kind.

## §4 · BOTH HANDS, MIRRORED — item 119, binding

Nick's ruling (2026-08-31), which **supersedes FX18 S2 regime (3) for the Tutor panel**:

> "I want the tools menu pop-out and the Tutor interface pop-out to be exactly mirrored
> to each other and both anchored to any Page, Board, or Card on which the User does any
> kind of writing."

Revise accepts writing, so **it carries both hands from birth.** Build to 119's
geometry, **not** to the superseded FX18 clause.

**ANCHORING** — both hands attach to the **writing surface** (the paper), never the
screen. **COEXISTENCE** — both-open only when the surface has room; graceful yield.
**THE ANNOUNCE INVARIANT** — drawers announce from **an effect keyed on their own open
state**, never from inside a toggle handler. The menus-errata lane paid for this one in
a real tablet-tap defect: the policy was right and was never told, because the grip's
own `onClick` bypassed the announcing path. **Wire it as an effect at birth so a silent
open path is not possible to write.** Do not announce from inside a `setState` updater.

**THE EMPTY-DRAWER QUESTION — RULED BY NICK, 2026-09-02.** The Counsel hand has content
on day one: the existing Tutor panel renders its conversation, lenses, and Bible as it
does on any page. **The Desk hand does not** — its Type section is 112-C. Nick's ruling:

> **BOTH GRIPS — Desk and Counsel — are always visible from 112-A, and both OPEN their
> tabs, even onto an empty drawer.**

**His reasoning, recorded:** an empty drawer **opens** — it is not a locked door, so
**G3's absence-over-grayed does not govern this case.** The mirror is **visually
complete at 112-A**; 112-C fills the Desk drawer's content later. Build to this.

**THE SUPERSEDED RECOMMENDATION, kept per corrected-not-rewritten.** The desk had
recommended mounting the Desk hand's machinery — anchoring, coexistence, announce — while
rendering **no** Desk grip until 112-C gave it a drawer, on the ground that a permanently
empty drawer approached the locked-door paint G3 forbids. **That reasoning collapsed
"empty" with "locked."** G3 forbids paint on a door that will not open; a grip that opens
onto an empty drawer is an open room, not a locked one. The recommendation is
**withdrawn**, and Nick's ruling governs.

## §5 · THE GEOMETRY FLOOR

**Presence is not composition.** This ticket's floor is its point.

- **Both reference widths, always: 1100 and 1366.** The frame's own minimum is 1100; the
  constitutional device floor is 1366×768.
- **Paper never reflows for chrome.** Opening either hand must not change the paper's
  measure.
- The Counsel's existing constants remain the Counsel's: natural open width ≈300px,
  `USABLE_PANEL_FLOOR_PX = 280` (below it, overlay at natural width rather than shrink),
  `DOCK_FLOOR_PX = 120`. **These are FX18's surviving mechanics; 119 supersedes only S2
  regime (3), the anchor question.** If 119's paper-anchoring and these constants
  conflict in practice, **stop and surface** — do not reconcile them in the build.
- **Anchors are layout.** Per the Anchor Law: anchors are layout, policy may measure,
  and a self-check compares independently rendered truths. An anchoring fault is a CSS
  fault and is repaired in CSS, never in a resize handler.

## §6 · THE WALLS

- **A13:** the Tutor holds no editor reference and no text setter on this surface either.
  `tu1.mjs` stays green.
- **Nothing fires on load.** No model call is added by this ticket. Entering Revise sends
  nothing.
- **DR7 as narrowed** — *nothing arrives unbidden, prose-wide, every prose mode, EXCEPT
  REVISE, by Nick's word* — **authorizes the error lens's marks and nothing else.** This
  ticket ships no unbidden anything: no counsel solicitation, no suggestion, no flag.
- **No tenant leakage.** If any part of the Type section, the Revise roster, or a flag
  appears in this build, it is out of scope and comes out.

## §7 · HARNESS

The ticket carries its own checks. At minimum:
1. Revise is live and switchable from the strip; `aria-disabled` and the `deferred` class
   are gone from that key; no coming-soon flash fires.
2. **The forward-only instrument does not mount in Revise** — asserted, not assumed.
3. **Geometry at 1100 and 1366:** the paper's measure is byte-identical with each hand
   closed, open, and both open where room allows.
4. **Both hands anchor to the paper, not the screen** — asserted per the Anchor Law
   against independently rendered truths.
5. **Coexistence:** both-open only where the surface has room; graceful yield otherwise.
6. **The announce invariant:** every open path announces, including one exercised
   directly rather than through the toggle handler — the check exists precisely to catch
   a future path that forgets.
7. **Both grips render and both open** — Desk and Counsel, per Nick's ruling; the Desk
   drawer opens onto empty content without error, and the announce invariant fires on
   that path as on any other.
8. **Emptiness:** no Type section, no Revise roster, no flags render in Revise.
9. Free Write and Draft are unchanged — their own harnesses stay green.

## §8 · EXIT

112-A is done when a writer can enter Revise, write freely in it, open and close **both
hands by their own grips** per 119 and Nick's empty-drawer ruling, and walk it at both
reference widths with the paper's measure untouched — and when the editor-path answer of §3 is on the record for the parked lens.
Then 112-C dresses the room.

---

*Governing charter: `docs/menus/tutor/item112-revise-charter.md` (RS1–RS7, ratified
2026-09-02). Item 117's board-shelf chrome and item 119 are a joint pass elsewhere;
this ticket covers Revise's own surface only.*

— the item-84 desk, 2026-09-02
