# ITEM 112-C · BUILD BRIEF — THE TYPE SECTION (Revise's Desk drawer, first tenant)
### Build-ready · authored 2026-09-05 by the item-84 desk · for a BUILDER lane
**WORKTREE: named by the builder lane's own assignment, and NEVER the primary
checkout** (item 110, standing). This brief is docs-authored; the build touches `apps/`
and belongs to a builder lane, not to the design lane that wrote it.

**GOVERNING DOCUMENT:** `docs/menus/tutor/item112-revise-charter.md` — RS1–RS7 ratified
by Nick 2026-09-02. **This ticket is RS4's first tenant only.** The Counsel roster is
112-D; the error lens is the parked seven.

**WRITTEN AGAINST SHIPPED CODE, NOT AGAINST THE CHARTER'S ASSUMPTIONS.** 112-A shipped
(`git 10c2d0f · railway de639860`) after the charter was written. Every path, symbol and
precedent named below was read at `origin/main` on 2026-09-05. Where the charter and the
disk disagree, **the disk wins and the brief says so.**

**SEQUENCE — NOT SETTLED HERE.** The charter orders 112-B (the hands' full mirror
geometry) before 112-C. Nick's walk of the empty floor decides whether 112-B is a large
ticket or already near-satisfied by what 112-A shipped. **This brief drafts now; its
build order is settled after his two answers.** Nothing below depends on which way that
falls — the mount point exists today either way.

---

## §1 · WHAT SHIPS

83's Type section, mounted as the first content in Revise's Desk drawer: **face and
size, page-level.** One section. Nothing else.

**Explicitly NOT in this ticket:** the Revise Counsel roster (→ 112-D) · error flagging
in any form (T1–T7, parked) · alignment and indentation (**absent by RV1's own
deferral**) · span-level typography (**barred by RV2**) · RV3's custom-font gesture
(**Nick's, unchosen — see §6**) · any change to Free Write, Draft, or Board.

## §2 · RV1–RV4, VERBATIM FROM ITEM 83'S PASS 6/6

The governing text, quoted rather than paraphrased so no build re-derives it:

> **RV1 · THE BIRTH CERTIFICATE.** Revise's Desk = one Type section — face · size,
> page-level — above the shared foot. Alignment/indentation absent by the chamber's own
> deferral (G3; nothing grayed). Designed now; mounts when the surface builds.

> **RV2 · PAGE-LEVEL FOREVER; THE WALL STANDS.** The ratified push-back against
> span-level typography is the section's constitutional wall; emphasis remains Draft's
> markdown set; an overrule is a schema-flagged reopening by the chamber's own words.
> The modes now read as one sentence: Free Write produces, Draft marks, Revise dresses.

> **RV3 · THE SOUGHT DOOR.** Custom font upload renders no row and is never offered; it
> lives inside the type controls and opens only to seeking. Two lawful gesture shapes
> named — the typed-name seek; the asked-and-answered path — neither chosen: the shape
> is Nick's, with the identity-backlog seam.

> **RV4 · THE PAPER IS THE PREVIEW.** Type changes apply live and revert as cheaply; no
> modal preview, no Apply, no draft-dress state.

**The surface builds. RV1's "mounts when the surface builds" condition is met.**

## §3 · THE MOUNT POINT — it already exists, and it is one branch

112-A left this ticket a door rather than a hole. In `apps/desktop/src/pages/PageEditor.tsx`,
`sliverContent` ends:

> `// ITEM 112-A — REVISE'S DESK DRAWER OPENS, AND IT OPENS ONTO NOTHING.`
> … `// kind: 'empty' is the shape SliverToolsBody already answers with return null.`
> … `: { kind: 'empty' };`

**112-C replaces that branch.** A new `kind: 'revise'` variant joins `SliverContent` in
`apps/desktop/src/components/Sliver.tsx` (beside `freewrite`, `draft`, `board`), and
`SliverToolsBody` gains its section. **The Sliver is the Desk hand** — CD1's rename of
ToolRail — and its drawer, grip, coexistence and announce wiring all shipped in 112-A.
This ticket adds content to a working drawer; **it builds no drawer, no grip, and no
geometry.**

**THE HAZARD 112-A NAMED, AND WHY IT BINDS HERE.** That same comment records what
happened before Revise had its own branch: Revise fell down the `else` and inherited
Draft's controls, which were **live-looking and inert** because `applyRailFormat` guards
on `mode !== 'drafting'` and returns. **Any control this ticket adds must be wired to a
handler that actually acts in Revise.** A Type control that renders and does nothing is
the locked door wearing paint that G3 forbids — and the file has already paid for that
lesson once.

**The `RAILS` registry in `ModeStage.tsx` is NOT this ticket's mount.** Its entry,
verbatim —

> `revise: { heading: 'revise', items: [], ai: 'open', tools: 'format' },`

— is the legacy toolbar, which that file's own comment says **does not mount on the
framed surface at all.** Leave it exactly as it stands: the empty `items` array is
load-bearing and documented as such, and the record is **TOTAL over EditorMode and
indexed UNGUARDED**, so a removed or renamed key is *"a TypeError on first render, not a
cosmetic gap."*

## §4 · PERSISTENCE — ZERO SCHEMA, AND THE PATTERN IS ALREADY ON DISK

**This ticket needs no migration.** `entry.pageSettings` is the home, and item 114 /
errata E4 established the exact idiom this ticket copies — its own words, on disk:

> READ THROUGH THE DEFAULT, never written at birth. A page that has never chosen carries
> no `kind` key at all, reads 'normal' here, and stays byte-identical on disk.

So: **face and size join `PageSettings` as optional keys, ABSENT (never null) on any page
that never chose**, read through module-level defaults, written only by the writer's own
act. `patchPageSettings` in PageEditor already performs the merge-and-save; Draft's
`onPickKind` / `onPickStyleGuide` are the working precedent to copy.

**S0 CHECK — the dress boundary, and it is a real fork.** `store/pageDefaults.ts` carries
`dressOnly()`, which strips `kind` and `styleGuide` and keeps the rest as **dress** that
flows into the user's "set as default" for new pages. `margins`, `lineSpacing`,
`pageNumbers`, `headers` and `footers` are already dress. **Face and size are plainly
dress too** — which means, if added as ordinary `PageSettings` fields, a writer's chosen
face would propagate to every new page through the user-defaults path.

**That may be exactly right, and it is not this desk's call.** Determine and record which
of the two the ticket implements, and surface it rather than picking silently:
1. **Dress** — face/size flow through `dressOnly` into user page defaults. A writer who
   sets their face once gets it on new pages. Consistent with what dress means today.
2. **Per-page only** — face/size are stripped like `kind`, and every page starts at the
   default face. Consistent with RV1's "page-level" read strictly.

RV1 says *page-level*, which settles the **scope of application** (not span-level) but
does **not** settle whether the choice seeds new pages. **Stop and surface.**

## §5 · THE SECTION — WHAT RENDERS

**Two controls, face and size.** Both apply live to the paper (RV4): no Apply button, no
preview modal, no staged state. Reverting is choosing the previous value — nothing more
elaborate is built.

**S0 CHECK — the face roster.** Determine and record which faces are offered and where
they come from. The app ships Crimson Pro (prose) and Figtree (UI) via the theme; a Type
section offering exactly one face is not a section. **Do not invent a font-loading
strategy**: record what is available, and if the honest answer is that a real roster
needs fonts the app does not yet bundle, **that is a stop-and-surface**, not a thing to
solve inside this ticket.

**ABSENT, NOT GRAYED — RV1 and G3, with two precedents already on disk.** Alignment and
indentation **render nothing**. Not disabled, not greyed, not a tooltip promising later.
Both files this ticket touches have already applied the law and recorded it.
`PageEditor.tsx`, in the freewrite branch of this very `sliverContent`,
records that the inert Ink placeholder **EXITS** — *"a greyed control for an unbuilt
capability is a locked door wearing paint"* — and `Sliver.tsx` says it again of its
own deferred rows: *"NOT grayed, ABSENT (G3)."* Same law, both files, same treatment
here.

**RV2'S WALL IS A BUILD CONSTRAINT, not a note.** The controls are page-level and cannot
reach a selection. If any implementation would let face or size apply to a span, **stop
and surface** — RV2 makes an overrule *"a schema-flagged reopening by the chamber's own
words,"* which is far above this ticket's authority. Emphasis stays Draft's markdown set.

## §6 · RV3'S SOUGHT DOOR — DESIGNED, NOT BUILT

Custom font upload **renders no row and is never offered.** It lives inside the type
controls and opens only to seeking. **Two gesture shapes are named and neither is
chosen** — the typed-name seek, and the asked-and-answered path. **The shape is Nick's,
with the identity-backlog seam.**

**This ticket builds neither.** It ships no seek field, no upload affordance, and no
placeholder for one. If the build finds itself designing a gesture here, it has left the
brief.

## §7 · A COLLISION TO SURFACE — THE STYLE GUIDE ALREADY SHIPPED, ON DRAFT

**Found on disk, and the desk did not know it when TRR11 was written.** Item 84's own
Revise re-pass (TRR11) designed a **STYLE GUIDE** control for **Revise** — MLA default,
Chicago/APA/AP, per project, riding the citation ask's button. Meanwhile item 114 /
errata E4 shipped a style-guide picker **on Draft**: `Sliver.tsx` carries
`STYLE_GUIDE_LABEL = { mla, apa, chicago, ap }`, rendered in the `kind: 'draft'` branch
with `aria-checked`, persisted as `pageSettings.styleGuide`.

**Same four authorities, different hand, already live.** 112-A's own merge note saw the
pickers arrive and correctly ruled *"They stay Draft's"* for its own scope — but nobody
has reconciled them against TRR11.

**This ticket does not resolve it, and must not duplicate it.** 112-C builds **face and
size only**; it adds no style-guide control of any kind. The reconciliation — whether
TRR11's Revise-side dropdown is superseded by Draft's, or whether the two coexist for
different purposes — **goes to Nick and to the item-84 desk**, not into this build.

## §8 · THE WALLS

- **A13 is untouched.** This is Desk-hand work; the Tutor holds no editor reference and
  no text setter, and `tu1.mjs` stays green.
- **Nothing fires on load.** No model call. Opening the drawer sends nothing.
- **DR7 as narrowed** authorizes the **error lens's marks and nothing else.** The Type
  section never suggests, never solicits, never arrives unbidden. It is furniture the
  writer opens a drawer to find.
- **No tenant leakage in the other direction:** nothing here may render in Free Write,
  Draft, or Board. Their branches are untouched.
- **`entry.text` is not written by this ticket.** Dress is not content.

## §9 · HARNESS

The ticket carries its own checks. At minimum:
1. The Type section renders in Revise's Desk drawer and **only** in Revise — asserted
   against Free Write, Draft, and Board.
2. **Face and size apply live to the paper** with no Apply step, and reverting restores
   the prior value (RV4).
3. **Alignment and indentation render nothing** — asserted as absent, not as disabled.
4. **A page that never chose carries no face/size key** — read the stored row and assert
   it is byte-identical to a grandfathered page (item 114's own guarantee, copied).
5. **No span-level path exists:** a selection plus a face change applies page-level or
   the check fails (RV2's wall, mechanically).
6. **Every control added is live, not inert** — the `applyRailFormat` lesson, asserted:
   pressing each control changes something.
7. **No style-guide control renders in Revise** (§7) and Draft's own is unchanged.
8. Geometry at **1100 and 1366**: the paper's measure is unchanged by the drawer's
   content, open or closed.
9. Free Write, Draft, and Board harnesses stay green.

## §10 · EXIT

112-C is done when a writer in Revise can open the Desk drawer, change the page's face
and size, watch the paper change under them, and change it back — with alignment and
indentation nowhere on the surface, no page that never chose carrying a new byte, and
§4's dress-boundary answer on the record.

Then 112-D brings the Counsel roster, and the parked lens waits on its own seven.

---

*Governing charter: `docs/menus/tutor/item112-revise-charter.md` (RS1–RS7, ratified
2026-09-02). Sequence against 112-B settles after Nick's walk of the empty floor; this
brief is complete either way.*

— the item-84 desk, 2026-09-05
