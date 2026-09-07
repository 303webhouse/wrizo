# ITEM 112-C · BUILD BRIEF — THE TYPE SECTION (Revise's Desk drawer, first tenant)
### Build-ready · authored 2026-09-05 by the item-84 desk · for a BUILDER lane
**AMENDED 2026-09-06 — §11 carries two later rulings by Nick that change §1's scope and settle §6. Read §11 before building.**
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
(**Nick's, unchosen — see §6**) · any change to Free Write, Draft, or Board · **the
page's *sheet*** — margins, line spacing, page numbers, headers, footers — which R6
gives to the Page menu, not to Revise (see §4).

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

**THE DRESS BOUNDARY — RULED (Fable, 2026-09-05): R6 GOVERNS.** A page's face/size choice
is **that page's**. It reaches the user's defaults **only** through the explicit defaults
act — R6's *"set your own defaults" control at the bottom of the PAGE menu* — and **never
by propagation.**

**The brief's earlier draft called this a fork. It is not one, and the disk already
implements the ruling.** Verified at origin/main 2026-09-05:

- `setUserPageDefaults(current)` has **exactly one caller** —
  `CascadePanels.tsx:437`, inside an `onClick`. It is a button press, not a side effect.
- `dressOnly()` only **filters what may enter that store**; it is not a propagation
  trigger and nothing calls it on a page edit.
- `persistence.ts:795` reads `getUserPageDefaults()` at **page birth**, which is R6's own
  *"resetting to defaults on a new page"* — the saved default seeding a NEW page, not one
  page's choice leaking into another.

So face and size may be ordinary `PageSettings` dress with no special handling. **The S0
check narrows accordingly:** confirm the three facts above still hold at build time. **If
`dressOnly` or any caller is found to auto-propagate dress, that is a DEFECT against R6 —
stop and surface it as one, not as a design choice.**

**R6 ALSO FIXES THIS TICKET'S OUTER BOUNDARY.** Its own words, verbatim — emphasis is
R6's, not this brief's:

> Revise keeps the page's *voice* — face and size; the Page menu owns the page's *sheet*

Margins, line spacing, page numbers, headers and footers are **the Page menu's, not
Revise's.** 112-C adds no sheet control.

**AND THE SCHEMA FLAG R6 ANTICIPATED IS ALREADY SPENT.** R6 warned that *"per-page layout
fields plus a user-defaults record are schema-class."* Those columns landed:
`migrate.ts` carries `alter table journal_entries add column if not exists page_settings
jsonb` and `alter table users add column if not exists page_defaults jsonb`, and
`sync.ts` stores the value with `JSON.stringify(e.pageSettings ?? null)`. **Face and size
are new keys inside an existing jsonb blob — no column, no migration, no schema flag.**
Item 114 added `kind` and `styleGuide` the same way.

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

**RESOLVED (Fable, 2026-09-05): DRAFT PICKS, REVISE REFLECTS.** On Nick's own item-114
words — *"whatever the user selects will then affect what gets displayed in the Revise
menu tab"* — the shipped Draft control under Research is **the single picker**, and
**TRR11's Revise-side control is SUPERSEDED as a control.** Revise does not offer a
choice; it **reads** `pageSettings.styleGuide` to shape its own menu — the citation ask,
footnotes when Chicago. **No duplicate picker anywhere.**

**What that means for THIS ticket: nothing to build.** 112-C ships **face and size only**
and adds no style-guide control and no style-guide reading. The *reflecting* behaviour
belongs to the Counsel roster, which is **112-D** — the citation ask is a Counsel ask,
not Desk furniture. A builder who finds themselves reading `styleGuide` in this ticket
has crossed into 112-D.

**One provenance note, surfaced not smoothed:** the quoted item-114 sentence is **not on
disk** — it does not appear in `docs/` at origin/main as of 2026-09-05. It travels on
Fable's relay of Nick's words, and the resolution rests on it. Recorded so that whoever
later looks for its source finds this line instead of assuming a bad search.

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

---

## §11 · AMENDMENTS — NICK'S RULINGS OF 2026-09-06

*Appended, not rewritten. §1 and §6 above stand as written and are amended here.*

**AMENDMENT 1 — TWO MOUNTINGS, NOT ONE. This changes §1's scope.** Nick's ruling,
relayed via Fable: **the Type section mounts in BOTH Draft's and Revise's Desk drawers.
Free Write is excluded by the analog law. One component, two mountings — the
reuse-never-copy law. The page-level scope and the system-font adder are unchanged. A
font chosen in Draft IS the page's font in Revise, since it is the page's, not the
mode's.**

§1's exclusion of *"any change to Free Write, Draft, or Board"* is narrowed accordingly:
**Free Write and Board stand excluded; Draft does not.**

**The consequence that governs the build:** because type is the **page's** property and
not the mode's, the two mountings are two views of **one stored value on one store
path** — not two controls kept in sync. *One control, rendered twice.* A second store
path, a mode-scoped default, or any per-mode override breaks the ruling silently and is
a **stop-and-surface**.

**Sequencing that falls out of it:** Draft's Desk drawer exists today, so **the Draft
mounting is unblocked** and may ship first; only the Revise mounting depends on 112-A's
drawer. A Draft-first split is available at no design cost — the component is the same
either way.

**CROSS-LANE:** where the section sits among Draft's existing zones is **item 83's
layout call**, not this brief's. Coordinate with MENU before mounting in Draft.

**THE ANALOG LAW — LOCATED, AND CITED BY ITS OWN WORDS.** Standing design law (Nick,
verbatim, 2026-09-06), recorded in the ledger's laws band at `9188979` beside the mode
sentence it completes — *"Free Write produces, Draft marks, Revise dresses"*:

> The theme that should define everything about Free Write mode is that it is analog: a typewriter for text and a journal page/sketch pad for drawing or notetaking.

**Every Free Write chrome decision answers to this law.** It explains, retroactively, the
rules already standing — **forward-only**, **strike-not-delete**, **no paste-in**, and
**the deck**: none of them arbitrary, each one what a typewriter or a journal page simply
does.

**Ruled with it: the FONT control lives in DRAFT and REVISE, NOT Free Write** — *a
typewriter does not offer you a typeface.* That is the reason behind Amendment 1's
exclusion, and it is a reason rather than a fiat: Free Write is not missing the control,
it is a machine that never had one.

**The amendment's exact reach, in the law's own terms: the section's PLACEMENT clause
AMENDS; its SUBSTANCE does not.** RV1's page-level scope, RV2's wall, RV4's live preview
and §4's persistence idiom are all untouched — only where the section mounts changed.

*(This replaces the caveat first written here, which recorded that the desk could not
locate the law's text on disk under that name. The caveat was true when written; the law
has since been recorded in the laws band, and the citation above is read from it rather
than from the relay.)*

**AMENDMENT 2 — RV3 IS RULED. This settles §6.** Nick's ruling: the face control offers
*"a few basic fonts plus the option for users to add their own system fonts."* The custom
door is a **SYSTEM-FONT ADDER** — the writer names a font already installed on their
machine and it joins the list. **The exact picker mechanics are the builder's S0 against
the platform**, by Nick's word; the desk does not specify them.

**Settled either way:** the door leads to a system-font adder, **not an upload** — no file
ingestion, no font hosting, no webfont fetch. **Nothing leaves the machine**, which keeps
this control clear of every disclosure question in the arc.

**⚠ DIVERGENCE — SURFACED, NOT RESOLVED. RV3 is item 83's law and this desk does not
amend another lane's law.** RV3 as ratified reads *"custom font upload renders no row and
is never offered… opens only to seeking."* Nick's ruling describes **"the option for
users to add their own system fonts"** — and an *offered option* is, on its face, a
**rendered row**, which RV3 forbids. Two readings, neither chosen here:

- **(a) RV3 is narrowed** by Nick's word — as DR7 was for Revise — and the adder renders
  as a visible row. The narrowing would be recorded in both lanes in identical words,
  per the DR7 precedent.
- **(b) RV3 stands** and "the option" means the sought door as ratified: present and
  reachable, rendering no row until sought.

**The builder must not pick.** This goes to Nick and the 83 desk before the face control
is built. Everything else in this brief proceeds meanwhile.

**AMENDMENT 3 — HARNESS ADDITIONS.** §9's checks stand and gain three:
- **One store path:** a face or size set in Draft is the page's face or size in Revise,
  read back from the persisted page — **asserted across a real mode switch**, not by
  inspecting two components' props.
- **No second path:** no mode-scoped default, no per-mode override, no duplicated state.
- **The section does not render in Free Write** — asserted, not assumed.

*A stale duplicate of this brief (`item112c-type-section-brief.md`, drafted 2026-09-02
against pre-112-A assumptions) was withdrawn before landing on the build lane's flag: it
carried these rulings but knew nothing of shipped code, the real mount point, or the
style-guide collision of §7. Its only surviving content is the three amendments above.*

— the item-84 desk, 2026-09-06
