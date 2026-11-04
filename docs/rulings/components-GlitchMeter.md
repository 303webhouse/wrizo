# Rulings: `apps/desktop/src/components/GlitchMeter.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[GlitchMeter §n]` points here.

## GlitchMeter §1

From `apps/desktop/src/components/GlitchMeter.tsx`, line 11 at `ded4321b` (the comment that stays: "the glitch meter: silent within 30s of a keystroke, ramping to a peak at 5 minutes idle; every flash asks store/flashBudget.ts first (at most 3 a second); under reduced motion it fires nothing and shows a still overlay").

```ts
// THE GLITCH METER - Flux's own progress animation, "Glitch", replacing the rhizome under Flux (brief docs/briefs/flux-flicker-meter-brief.md;
// plan docs/plans/glitch-meter.md, approved Oct 17; mockup cursor/flux-flicker-mockup @ 0eb36a6a). A monitor breaking down from heavy use.
//
// WHEN: a Flux writing page (PageEditor passes `glitch` to DeskInstrument; the Journal sheet does not), Progress on (the foot's Progress toggle,
// Progress: Words), the style set to Glitch (stored as 'rhizome' - the Bar | Rhizome axis, labelled Glitch under Flux), a goal set, and the
// Flicker switch on. The same gate as RhizomeField's, with the theme the other way round, plus the switch.
//
// WHAT: Nick's rule (store/glitchMeter.ts) - silent if a key was pressed in the last 30 s, ramping to a peak at 5 minutes idle, calmed by the
// lap's progress. It draws Flux's Signal Loss vocabulary (store/signalLossEvents.ts, one implementation shared with the ambient texture),
// brighter and more often as the intensity rises, OVER the whole screen, page and text included (Nick's ruling, overriding the canon line,
// because it never runs while typing) - in its own fixed, pointer-events:none layer, portalled to <body> so no stage's stacking context can
// cap it. The ambient Signal Loss texture stays behind the page, untouched.
//
// SAFETY (the brief's floor, not optional): every flash asks store/flashBudget.ts first (never more than 3 in any second across the whole
// screen, the ambient texture's included; a double dip or jump counts 2). Large events stay low-contrast: the dip is black at <= .14, the
// shear a 26 px band, nothing red. Under reduced motion - the OS setting, followed live, or the Ambiance dial at 0 (Wrizo's own "no motion")
// - it fires nothing and shows a faint still scan overlay whose opacity follows intensity (index.css .glitch-meter-still: under the OS
// setting it appears with no easing - the global reduced-motion rule, honoured by Fable's ruling, ledger 90; at Ambiance 0 it eases in).
```

## GlitchMeter §2

From `apps/desktop/src/components/GlitchMeter.tsx`, line 55 at `ded4321b` (the comment that stays: "only keystrokes count as activity; opening the page counts as one, so it starts silent").

```ts
    // only keystrokes count as activity (Nick's rule); opening the page counts as one, so it starts silent
```

## GlitchMeter §3

From `apps/desktop/src/components/GlitchMeter.tsx`, line 94 at `ded4321b` (the comment that stays: "when motion turns off, a tear storm's lines still on screen go too").

```ts
      // Fable, Oct 21: the moment motion is turned off, a tear storm's lines still on screen go too (the first still frame; they are its only
      // pieces that outlive the flash's own instant)
```
