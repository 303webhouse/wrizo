# FX10 — the Room's Edges · build brief · 2026-07-21

**Place at:** `docs/wrizo-alpha/fx10-rooms-edges-brief.md`.
**Branch:** `fx10-rooms-edges` off `main`, own worktree. Parallel with
E1 (different surfaces) and with J6/FX9 in flight — **but note the J6
overlap risk: if J6 lands first, rebase.**
**Priority: P0 alongside E1.** Nick confirmed today that the Tutor is
answering from DeepSeek — and that the panel is unusable, so a writer
"wouldn't even be able to tell." TU5 (the Tutor's memory) is pointless
until the room it lives in is habitable, so this ticket gates the whole
remaining Tutor arc.
**Authority:** Nick's device findings of 2026-07-21, quoted per slice
below. **Fable's error acknowledged on the record:** TU2's brief
specified the panel's open width as "exactly 2× the tool strip's width
token" — ~168px. The build and its harness implemented that faithfully.
The number was wrong; this brief corrects it.
**ZERO SCHEMA, ZERO SERVER FILES, ZERO NEW DEPS.** Merge pre-authorized
as zero-schema; Fable reviews post-merge. Report = push.

## S0 — records first
Ledger: open FX10's item; record the width correction against TU2's item
so the history reads honestly (spec error, not build error). Commit this
brief.

## S1 — the Tutor opens like a drawer
Nick's own words: *"the Tutor panel should fade-in and come out of the
page to the right exactly the same way as the tools pop-out to the left,
from flush against the edge of the page like a drawer opening
horizontally. Also, the Tutor tab can be much wider since we have the
entire right side of the page for it to live."*

- **Motion:** a horizontal drawer opening rightward from flush against
  the paper's right edge — the exact mirror of the tool pop-out's own
  motion, reusing that implementation's real constants (duration,
  easing, the fade's own curve), measured from it, never approximated.
  If TU2's retrofit reused the constants but not the *motion shape*,
  that gap is this slice.
- **Width:** the panel takes a genuine reading measure, not a multiple
  of the strip. **Ruled: `clamp(320px, 34% of the viewport, 460px)`,
  further clamped so the panel never encroaches on the paper's own rect
  at any width** — the paper's measure is inviolate and the clearance
  law (FX2) still governs. Below the width where a real panel cannot fit
  without touching paper, the panel overlays per the CD2 overlay law
  exactly as today.
- **No scroll-within-scroll.** Nick's screenshot shows the conversation
  and each lens trapped in their own tiny nested scrollboxes. The panel
  scrolls as one column; individual sections do not own private
  scrollbars. A message bubble grows to its content.
- **The conversation is the panel's center of gravity** — with the room
  this much wider, the composer and the exchange must read as the main
  event, the lenses as sections around it.
- A15 unchanged whole: dissolve on first keystroke undocked, dock rider,
  Escape ladder, reduced-motion honored.

## S2 — the left rail must vanish
Nick: *"the far left menu strip is not fading out when I resume
writing."* The rail is chrome and chrome vanishes; it is currently
exempting itself from the vanishing law. **Diagnose the root cause
before fixing** — whether the rail was never wired to the dissolve, or
whether its subscription is broken — and report which. Fix so the rail
obeys the same one vanishing engine every other piece of chrome obeys,
with the same first-keystroke trigger and the same reduced-motion
branch.

## S3 — the tool menu must come back on approach
Nick: *"the open tool menu isn't fading back into full view when I roll
my mouse over it — I had to click to get it back."* A dissolved-but-open
menu must restore on **pointer approach**, not require a click. Restoring
on hover is the vanishing law's own other half: chrome yields to writing
and returns to the hand. Root-cause first, then fix; if this is shared
machinery, fix it at the source so every dissolved surface inherits it,
and say so.

## S4 — the scrollbar sits at the outer edge
Nick: *"the scroll bar is better but reveals itself inside the page now.
I want it flush at the outer edge of the right side of the page with no
space between it and the edge."* Move it flush to the paper's outer
right edge with zero gap. **The text measure must not change** — FX2's
clearance law: the writing's own line length is untouched by this move.

## S5 — harness (`fx10.mjs`) + the bar
S1: at 1100 (floor, mandatory) / 1280 / 2200 — panel open width matches
the ruled clamp at each; the grip is flush to the paper's right edge
closed AND open; the paper's rect is invariant closed/open/docked at
every width; **no element inside the panel owns its own scrollbar**
(assert computed overflow across the panel's descendants); the motion's
duration and easing are read live and asserted equal to the tool
pop-out's own values; the A13 structural walk repeats (no control in
the panel targets a writing surface). S2: chrome including the rail is
dissolved after a first keystroke, at both reference widths. S3: a
dissolved open menu is restored by a genuine trusted pointer move over
it, **with no click** — trusted-pointer events only, per the standing
law; synthetic dispatch does not prove this. S4: the scrollbar's own
rect is flush with the paper's right edge (zero gap) and the text
measure is byte-identical to before. Park TU1/TU2 geometry checks
superseded by S1 per A4 — originals verbatim, live successors named.
Full suite green, both `HARNESS_PARKED` settings. `tsc` ×2,
`build:web`, selftest.

## Non-goals
The Tutor's memory (TU5); the session meter's contents; new lenses;
the rhizome (M3's own ticket); board gestures (FX11's); anything
changing what the Tutor says.

## Invariants
One vanishing engine — no second dissolve implementation anywhere;
A13/A14/A15 whole; the paper's rect and text measure are inviolate;
nothing orange at rest; every string through `deskLexicon`;
both-reference-widths + the 1100 floor on every geometry assert; legacy
<1100 byte-identical; A4 parking with live successors; report = push.

## Definition of done
Nick opens the Tutor and a room opens — flush from the paper's edge,
sliding out across the right side the way the tools slide out across
the left, wide enough to hold a conversation, scrolling as one thing.
He types and the whole world recedes, rail included. He reaches for a
menu and it comes back to meet his hand without being clicked. The
scrollbar sits where the page ends. Then he asks the Tutor a question
and can actually read the answer.

— Fable, from Nick's device findings, 2026-07-21
