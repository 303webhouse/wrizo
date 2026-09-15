# ITEM 137 · S0 — THE TRASH'S PIN, MEASURED
### tools lane · branch `item137-trash-foot` · tree `cd37c03` (origin/main @ `bfb2046` merged)
### headful, per the brief · 2026-09-13 · NO BEHAVIOUR CHANGE

## THE VERDICT: CONFIRMED

| viewport | gap (aside.bottom − trash.bottom) | `.wz-strip` height | `.desk-frame-strip` height |
|---|---|---|---|
| 1366×**768** | **8.8px** | **544.4px** | 545.2px |
| 1366×**1200** | **303.6px** | **544.4px** | 840.0px |

**The gap grows 8.8 → 303.6 as the viewport gets taller.** That is the
prediction the instrument was built to separate: a content-tall strip's gap
grows because the aside stretches while the content does not, whereas a
genuinely pinned foot holds its gap near zero at both heights.

**The explanation was measured beside the symptom, and it is decisive on its
own:** `.wz-strip` renders **544.4px at BOTH viewport heights** — identical,
unmoved — while the aside goes 545.2 → 840.0, tracking `70vh` exactly
(0.70 × 1200 = 840). The strip never grew with its parent, so
`margin-top:auto` had no free space to consume.

## WHY THE FOUNDER SEES IT AS "INLINE"

At 768 the aside is content-driven and the gap is **8.8px** — visually the
Trash simply sits after the last item, indistinguishable from inline. The
defect is not that Trash is a little high; it is that **Trash is not pinned at
all**, and the taller the window the further it strands: 303.6px short at
1200.

## THE PREMISES, RE-CONFIRMED ON THE MEASURED TREE

- `index.css` — `.wz-strip-foot{ margin-top:auto; }`
- `index.css` — `.wz-strip{ display:flex; flex-direction:column; height:100%; }`
- `index.css` — `.desk-frame-strip{ position:absolute; top:-16px; … min-height:70vh; }` — **no `height`, no `bottom`**
- `DeskFrame.tsx` — `<aside class="desk-frame-strip">{strip}</aside>`, so `.wz-strip` is its **direct child**
- `Cascade.tsx` — `<div class="wz-strip-foot">` holds SECTION_D, a separator, and SECTION_TRASH

A percentage height resolves against the parent's **height**; `min-height`
does not make that height definite. So `height:100%` fell back to `auto`.

**Hypothesis proposed by Fable, measured rather than trusted — and it holds.**

## WHAT THIS COMMIT CHANGES

**Nothing.** The fix follows, geometry only, additive around item 130's
`z-index:1` on the same element.
