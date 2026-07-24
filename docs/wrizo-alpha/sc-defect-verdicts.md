# SC defect verdicts — the first sitting · 2026-07-24

**Place at:** `docs/wrizo-alpha/sc-defect-verdicts.md` (records lane; CC
commits). Evidence screenshot alongside at
`docs/wrizo-alpha/sc-evidence/screenplay-1-flux.png`.

**Law:** the M3 precedent binds — Nick's verdicts are the spec, recorded
in his words; Fable shapes them into tickets, root-cause-first, no blind
patches; the reproduce-before-patch discipline (E1 S1's) applies to every
one. Fable's notes below are orientation, never diagnosis-as-spec.

**Sitting context:** laptop-class viewport (~2560px, framed), **Flux
theme**, a Page converted to Screenplay, DRAFT active on the mode strip,
the fresh placeholder scene heading (`INT. LOCATION - DAY`) on an
otherwise empty page.

## The verdicts

**SC-V1 — the room's placement.** "The page is in a weird spot, the side
menus are floating in space." *Fable's note:* reproduce across themes
before touching anything — the root may be the script surface's own
stage/geometry, the residue may be Flux chrome. The theme arc is parked;
any Flux-only residue is recorded to it, never scope-crept into SC.

**SC-V2 — the type.** "The font is too big." *Fable's note:*
`.script-sheet` sets `--font-script` but no size of its own — the prose
scale inherits. To confirm at reproduction.

**SC-V3 — the page is not a page.** "The size of the page is not
commiserate to one page of screenwriting, which is very important in
screenwriting because 1 page roughly equals 1 minute of screen time. So
our screenplay page needs to comport to those standards." **The arc's
constitutional verdict.** *Fable's note:* the margins already exist in
CSS (`padding: 1in 1in 1in 1.5in`) — the sheet has margins-in-inches but
no page-in-inches, no Courier metric, no element grid, no derived page
breaks. The furniture arrived before the room.

**SC-V4 — the caret's home.** "The cursor starts by floating in the
middle of the page." *Fable's note:* the typewriter hook centers
`.script-el-active`; on an empty page that puts the first element
mid-paper. A screenplay begins at the top of page one. Reproduce, then
fix at the root, not the symptom.

**SC-V5 — the trade's tools.** "We need to give a screenplay page a
unique set of tools in the tool sidebar menu." A verdict of absence.
*Fable's census finding, attached:* today `retype()` is reachable ONLY by
keyboard (Enter/Tab/Shift-Tab/Ctrl-1–8) and the autocomplete accept —
**no pointer path to change an element type exists.** On a laptop/
tablet-first product, a keyboard-gated surface is a usability defect,
not a missing feature.

**SC-V6 — the Tutor's ear.** "A unique harness for the AI tutor since
screenplays are not standard forms of creative writing." Routed to the
committee. The rails are constitutional (A12–A15) and untouchable — the
Tutor never writes anyone's screenplay either.

**SC-V7 — the storyboard, one gesture away.** "The screenplay page
should be able to access the storyboard seamlessly without necessarily
having to jump back and forth to the board." Direction verdict; the
committee reviews the standing Board plans (BM1 shipped, BM2 queued, the
second-sitting chambers pending ratification) through this lens.
*Fable's note:* a partial return path already exists — a script page
opened FROM a board shows "‹ Back to the board" — but no forward door
from the script page exists; the script bar is door-less by BM1's own
ruling.

## Still unverdicted — next sittings

The typing chain under Nick's own hands (Tab / Enter / Shift-Tab /
Ctrl-1–8); the two AMENDABLE key-map cells in `scriptKeys.ts` (frozen
2026-07-11 awaiting exactly this arc's bench); Publish and both copy-out
paths on script; the Tutor's current behavior on a script page.

— recorded by Fable (SC line), first sitting, 2026-07-24
