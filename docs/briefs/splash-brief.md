# Splash screens: one per theme (Nick, Oct 16, 2026)

Mockup: "Splash Sweep Mockup" artifact (round 2, Oct 16). Round 1 (a clockwise sweep over every line, ending on TEXT) is superseded.

## Nick's rulings
1. **Light only the connectors between the five main steps.**
   - The steps are IDEAS, TEXT, FEEDBACK, PAGE and FINAL DRAFT.
   - The brass starts at the IDEAS graphic and spreads out from there in both directions.
   - It ends with FINAL DRAFT.
   - The labels around the edges (Quotes, Research, AI Tutor and the rest) never light.
2. **The splash fades straight into where the writer left off**: the last Page or board from their last session, or the Pages surface if there is none. The front door no longer appears after the splash for a signed-in writer.
3. **Every theme has its own splash**, shown when that theme was the last one the writer picked. Arbor is the default when the writer has never chosen one.
   - **Arbor:** Nick's hand-drawn sketch.
   - **Flux:** a tech version of the same five steps. It is linear (first principles to final product, an engineering mindset) and carries its own futuristic WRIZO wordmark, never the hand-drawn one.
   - **Future themes** (Machina, Nomad, Volant) each need their own splash drawing, wordmark and animation as part of the theme. The animation always runs from IDEAS to FINAL DRAFT.

## Round 3 (Nick, Oct 16, 12:27 pm): outlines only, then a pop
> "Lets just have the lines (connectors) and each of the outlines around the main writing stages turn brass, not the letters inside of them, ending with the outline of the square page titled "FINAL DRAFT" also turning brass, and then give the final draft a little pop and then fade out to the writing surface."

- Only the connectors and the **outlines** of the five stages turn brass. Every letter stays cream, in both themes. This supersedes "IDEAS lights" and "FINAL DRAFT lights" below.
  - Arbor's outlines are the IDEAS block outlines, the TEXT box (with its notepad), the FEEDBACK loop, the PAGE sheet's edges and the FINAL DRAFT box.
  - The S, the circle around the I, and FINAL DRAFT's letters stay cream.
- Each stage's outline turns brass when the brass reaches it. In Arbor, that is when its first connector arrives.
- FINAL DRAFT's outline turns brass last, then the whole FINAL DRAFT box gives a small pop: about 0.5 s, scaling up 8% and settling back. Then the fade to the writing surface.

## Round 4 (Nick, Oct 16, 12:33 pm): 30% faster
- **Every time below is multiplied by 0.7.**
- The whole splash, fade included, now runs about 3.5 s in Flux and 3.7 s in Arbor.
- **The old 5 s minimum hold is replaced by the animation's own length.** The splash still waits for the app to be ready, up to the 10 s ceiling.

## The animation (both themes)
- **0.3 s:** IDEAS' outline turns brass with a short glow.
  - Arbor: the five block outlines.
  - Flux: five loose tiles that snap into a row.
- **From about 0.8 s:** brass travels along the connectors, outward from IDEAS. Each connector is drawn from the end the brass reaches first.
  - **Arbor** moves at a steady speed through the drawing. It runs IDEAS to TEXT and IDEAS to PAGE at once, then TEXT to FEEDBACK, TEXT up to PAGE, and PAGE down to FEEDBACK. The two waves meet at FEEDBACK.
  - **Flux:** IDEAS through the summing junction to TEXT, and the bypass from IDEAS to PAGE, at the same moment. Then TEXT to PAGE, then the feedback loop from PAGE through FEEDBACK back into TEXT.
- **Last connector:** PAGE to FINAL DRAFT, once every other connector has finished. Then FINAL DRAFT lights brass with a glow.
- **Ending:** a short hold, then a 0.45 s fade into the writer's last Page or board.
- **Total:** about 5 s, the same as today's minimum hold. The existing rules stay:
  - if the app isn't ready, the finished drawing waits, up to the 10 s ceiling;
  - the splash never blocks input.
- **Reduced motion:** the finished brass drawing shows at once, then the usual fade.
- **TEXT is cream** like the rest of the Arbor drawing. It is no longer orange.

## How the Arbor layers are made (for the builder)
- The cream sketch (`wrizo-sketch-for-dark-theme.png`) stays the base, with TEXT recoloured to cream.
- Each of the six connectors is its own brass layer (#ff9800, keeping the sketch's own edge alpha), cut from the sketch by its stroke shapes. IDEAS (the letter blocks) and FINAL DRAFT (the box and its words) each get one brass layer too.
- Each connector layer is revealed by a mask: a thick stroke drawn along the connector, animated from one end to the other.
- The mockup's mask paths and stroke widths are in sketch coordinates at 1350 × 1080. Scale them by 3374/1350 for the full-size asset.
- Fable's cutting script and the mockup file are the reference. Ask Fable for them when building.

## Flux schematic (for the builder)
- Vector only (SVG): a dot grid, corner brackets, and node tags N.01 to N.05.
- **Main line:** IDEAS tiles → Σ junction → TEXT → PAGE → FINAL DRAFT (a double-bordered box).
- **Bypass:** IDEAS → PAGE, above the main line.
- **Feedback loop:** below the main line, from PAGE's output through FEEDBACK back into the Σ junction.
- **Sub-parts** hang as small tree lists (STRUCTURE / RESEARCH / FLEXIBILITY, and so on), in Chakra Petch; node names are in Rajdhani.
- **Wordmark:** WRIZO built from straight strokes on a grid. It has a horizontal scan-line cut and a cyan (#00C2FF) square in the O.
- Same footprint as the Arbor sketch (1350 × 1080 box, same aspect), so the existing sizing code carries over.

## Bug found the same day (separate fix, TOOLS `fix/splash-tone`)
- **What Nick saw:** the cream sketch shows for a moment, then swaps to the dark-ink copy on the dark veil.
- **Cause:** the asset is chosen by measuring the app *under* the splash. Since the veil became solid, the app underneath no longer matters, and a light Page underneath picks the wrong copy.
- **Fix:** measure the veil itself.
