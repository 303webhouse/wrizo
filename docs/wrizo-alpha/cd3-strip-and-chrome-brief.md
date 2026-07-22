> **Editorial note, added by the orchestrating CC session, 2026-07-21 —
> not Fable's own words, kept clearly separate from the brief below.**
> This file was originally written by Fable as a "revised FX10 brief,"
> at `docs/wrizo-alpha/fx10-rooms-edges-brief.md`, under the belief that
> the original FX10 scope (S3-S7 below: the Tutor drawer motion/width,
> the rail-dissolve fix, hover-restore, the scrollbar flush) had not yet
> been built. It had: this session built, independently reviewed (GREEN
> WITH ADVISORIES), and merged that exact scope as "FX10 — the Room's
> Edges" earlier the same sitting — see `docs/open-threads.md` item 52,
> merged at `a3f8b41`. Neither this session nor Fable knew of the
> other's state at the time either wrote/executed their own half of this
> collision. To avoid corrupting the git history of the brief FX10 was
> actually built from, this document has been renamed rather than
> overwriting that path, and is preserved here verbatim below —
> unedited — because its S0-S2 (the standing-condition disclosure, the
> audit methodology, Nick's own "Done" button ruling) is real, load-
> bearing authority for the chrome/strip work that DID need to land
> fresh, now tracked as ticket **CD3 — the Strip's Order**. S3-S7 below
> describe already-shipped work and are kept only as Fable's own
> historical record of what she believed remained; they are not being
> built again.

---

# FX10 — the Room's Edges · build brief (REVISED) · 2026-07-21

**Supersedes the first FX10 draft of 2026-07-21 in whole.** That draft
was written before Nick disclosed a second session holding uncommitted
work on exactly these surfaces. This version is self-contained; do not
work from the earlier one.

**Place at:** `docs/wrizo-alpha/fx10-rooms-edges-brief.md`.
**Branch:** `fx10-rooms-edges`, **own worktree — never the primary
checkout.**
**Priority: P0 alongside E1.** The Tutor is answering from DeepSeek and
the panel is unusable, so TU5 (the Tutor's memory) is pointless until
this lands. This ticket gates the remaining Tutor arc.
**Authority:** Nick's device findings of 2026-07-21; his ruling that the
"Done" button is deprecated; his direction that overlapping fixes be
assessed rather than duplicated. **Fable's error on the record:** TU2's
brief specified the panel's open width as "2× the tool strip's width
token" (~168px). The build and harness implemented that faithfully; the
number was wrong. Corrected in S3.
**ZERO SCHEMA, ZERO SERVER FILES, ZERO NEW DEPS.** Merge pre-authorized
as zero-schema; Fable reviews post-merge. Report = push.

## Standing condition — one session owns these files

A second session holds uncommitted modifications to eleven files in the
primary checkout, including `PageEditor.tsx`, `Cascade.tsx`,
`ScriptEditor.tsx`, `index.css`, `deskLexicon.ts`, and six harness
files. **FX10 does not begin until that work has landed via S1 or been
deliberately abandoned by Nick's word.** Two agents editing this surface
with the work uncommitted means one silently erases the other, and git
will not prevent it.

## S0 — records first
Ledger: open FX10's item; record the TU2 width correction against TU2's
own item as a **spec error, not a build error**; record the "Done"
button deprecation as Nick's ruling of 2026-07-21. Commit this brief.

## S1 — land the in-flight work, audited
Bring the second session's uncommitted changes onto this branch and
commit them as FX10's opening slice, **after** the following audit —
report all of it before proceeding to S2:

- **Enumerate every change**, file by file, in plain language: what was
  altered and what visible effect it has. This inventory is the
  deliverable; the rest of the ticket depends on it.
- **The "Done" button removal is RULED IN** — Nick's word: it is
  deprecated, with Publish, the rail, and free navigation covering every
  exit. **One check first: confirm a legacy (<1100px) page still has a
  usable way out without it.** If the rail is absent below 1100 and Done
  was the only exit there, STOP and report — the ruling assumed an exit
  exists.
- **`hb1.mjs` asserts the Done button's presence.** Park that assertion
  per A4 — original verbatim, marked SUPERSEDED with a one-line reason
  and a live-successor pointer asserting the new truth. **Do not edit
  it into agreement.**
- **Six harness files were modified** (`ab3`, `b1`, `cd1`, `cd2`,
  `fx3`, `fx9`). Cosmetic work should not need harness edits. For each:
  if an assertion was rewritten to agree with a visual change, **revert
  it and park it properly instead.** A harness edited to match the code
  it is meant to check is not a harness. Report every one.
- **`fx9.mjs` exists but FX9's brief is not on disk.** Report what that
  file contains and which ticket it belongs to before touching it.

## S2 — inventory before building
For each defect below, determine from the S1 tree whether it is
**already fixed / partially fixed / untouched**, and report that
assessment **before writing any new code.** Build only what remains.
Duplicating a fix is as much a defect as missing one.

## S3 — the Tutor opens like a drawer

> **Editorial note: this scope is already shipped.** See the note at the
> top of this file — S3 through S7 below describe FX10's real,
> already-built-and-merged scope (item 52). Kept verbatim as Fable's own
> record of what she believed remained at the time she wrote it.

Nick's words: *"the Tutor panel should fade-in and come out of the page
to the right exactly the same way as the tools pop-out to the left, from
flush against the edge of the page like a drawer opening horizontally.
Also, the Tutor tab can be much wider since we have the entire right
side of the page for it to live."*

- **Motion:** a horizontal drawer opening rightward from flush against
  the paper's right edge — the exact mirror of the tool pop-out, reusing
  that implementation's real duration, easing, and fade curve, measured
  from it, never approximated.
- **Width, ruled:** `clamp(320px, 34vw, 460px)`, further clamped so the
  panel never encroaches on the paper's rect at any width. The paper's
  measure is inviolate (FX2 clearance law). Where a real panel cannot
  fit without touching paper, it overlays per the CD2 overlay law as
  today.
- **No scroll-within-scroll.** Nick's screenshot shows the conversation
  and each lens trapped in separate tiny scrollboxes. The panel scrolls
  as one column; sections do not own private scrollbars; a message grows
  to its content.
- **The conversation is the panel's center of gravity** — composer and
  exchange read as the main event, lenses as sections around it.
- A15 whole: dissolve on first keystroke undocked, dock rider, Escape
  ladder, reduced-motion honored.

## S4 — the left rail must vanish
Nick: *"the far left menu strip is not fading out when I resume
writing."* The rail is chrome; chrome vanishes. Root-cause first — never
wired to the dissolve, or a broken subscription? — then fix so the rail
obeys the same single vanishing engine, same first-keystroke trigger,
same reduced-motion branch.

## S5 — the tool menu returns on approach
Nick: *"the open tool menu isn't fading back into full view when I roll
my mouse over it — I had to click to get it back."* A dissolved-but-open
menu restores on **pointer approach**, no click. Root-cause first; if the
machinery is shared, fix at the source so every dissolved surface
inherits it, and say so.

## S6 — the scrollbar sits at the outer edge
Nick: *"the scroll bar... reveals itself inside the page now. I want it
flush at the outer edge of the right side of the page with no space
between it and the edge."* Move it flush, zero gap. **The text measure
must not change** (FX2).

## S7 — harness (`fx10.mjs`) + the bar
S3: at 1100 (floor, mandatory) / 1280 / 2200 — open width matches the
ruled clamp at each; grip flush to the paper's right edge closed AND
open; paper rect invariant closed/open/docked at every width; **no
descendant of the panel owns its own scrollbar** (assert computed
overflow across descendants); the motion's duration and easing read live
and asserted equal to the tool pop-out's; the A13 structural walk
repeated (no control targets a writing surface). S4: chrome including
the rail dissolves after a first keystroke, both reference widths. S5: a
dissolved open menu restores under a **genuine trusted pointer move,
with no click** — synthetic dispatch does not prove this. S6: the
scrollbar's rect is flush with the paper's right edge (zero gap) and the
text measure is byte-identical. S1: every parked assertion carries a
live successor. Legacy <1100 unchanged apart from the ruled Done
removal, which carries its own successor check. Full suite green in an
**isolated worktree with `git status` clean**, both `HARNESS_PARKED`
settings. `tsc` ×2, `build:web`, selftest.

## Non-goals
The Tutor's memory (TU5); the session meter's contents; new lenses; the
rhizome (M3); board gestures (FX11); anything changing what the Tutor
says.

## Invariants
One vanishing engine — no second dissolve implementation; A13/A14/A15
whole; the paper's rect and text measure are inviolate; nothing orange
at rest; every string through `deskLexicon`; both-reference-widths + the
1100 floor on every geometry assert; A4 parking with live successors and
**never** an assertion edited into agreement; one worktree per agent;
`git status` clean before any verification sweep; report = push.

## Definition of done
Nick opens the Tutor and a room opens — flush from the paper's edge,
sliding out across the right side the way the tools slide out across the
left, wide enough to hold a conversation, scrolling as one thing. He
types and the whole world recedes, rail included. He reaches for a menu
and it meets his hand without a click. The scrollbar sits where the page
ends, and no button remains that does nothing. Then he asks the Tutor a
question and can actually read the answer.

— Fable, revised after the checkout collision, 2026-07-21
