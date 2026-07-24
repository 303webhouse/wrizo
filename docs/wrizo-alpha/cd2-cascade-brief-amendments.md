# CD2 — the Cascade · brief amendments of record · 2026-07-17

Two amendments to `cd2-cascade-brief.md`, both Nick's word,
2026-07-17. CC was relayed both as in-place edits; **this file is the
authoritative text either way** — if the brief on disk already
carries them, this is the record; if not, apply from here before any
CD2 slice is built.

## Amendment 1 — the cascade lives on the LEFT

Nick's correction of his own spec; the architecture is side-agnostic
and all committee reasoning stands except the right-side placement
rationale, superseded by the owner's word.

- S1: the strip sits on the far LEFT, below the top bar; layers
  cascade rightward toward the paper (strip → panel → survey →
  paper). The top-right corner (Done, right-aligned modes) keeps the
  right edge to itself.
- S2 addition: open layers may transiently overlay the sliver's grip
  zone (both are dissolve-adjacent chrome), NEVER the text measure;
  the grip persists after dissolve, as does the strip.
- S5: the left drawer retires and the cascade replaces it in place;
  the strip's smaller footprint still feeds FX3's scaled paper.
- DoD: "the strip at his left hand."
- A8's ratified wording: "persistent LEFT strip" — side correction
  recorded in the ratification note.

## Amendment 2 — the dock, and small screens

**The dock.** Layer 2 carries a quiet close affordance. Closing it
animates shut like a drawer (fence: ~180ms slide;
prefers-reduced-motion honored) and layer 3 slides left into layer
2's slot. The strip's category stays olive — the survey is still its
open reach. Reopening the category slides the panel back in and the
survey back out one slot.

**Vanishing-law rider (record beside A8):** a DOCKED survey is the
writer's deliberate word to keep it — it survives keystrokes,
dismissed only by explicit close, category switch, or Escape.
Undocked layers dissolve on keystroke as before.

**Small screens.** Where the frame lacks room for strip + panel +
survey beside the paper (laptop, tablet), transient layers open OVER
the paper rather than ever pushing it — the paper's rect never
changes, at any width. A DOCKED survey must never permanently occlude
the measure: it compresses to the available margin (fence: 120px
thumbnail floor) or the dock affordance is unavailable below the
floor.

**Harness additions (S6):** dock flow (close L2 → L3 occupies slot
2, strip stays olive, reopen restores); docked survey persists
through typing while undocked layers dissolve; laptop-width overlay
with the paper rect byte-identical; the reduced-motion path.

— Fable, from Nick's words, 2026-07-17
