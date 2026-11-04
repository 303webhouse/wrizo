# Rulings: `apps/desktop/src/components/DeskInstrument.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[DeskInstrument §n]` points here.

## DeskInstrument §1

From `apps/desktop/src/components/DeskInstrument.tsx`, line 8 at `ded4321b` (the comment that stays: "the progress instrument's framed home: bar and rhizome share the rhizome's lane under the page, and the goal flare fires there on the same `celebrating` transition, for both styles").

```ts
// M4 S3/S4 (SV15/SV16) — the progress instrument's framed home.
//
// S3, the bar comes home: "the progress bar renders UNDER THE PAGE, in the
// rhizome's own lane — bar and rhizome are two styles of one instrument and
// share one location." That lane already exists and is already proven:
// DeskFrame's `rhizome` prop -> `.desk-frame-rhizome-anchor` (index.css), the
// stage-spanning, paper-rect-immune overlay M2 S2 built for the growth layer.
// This component IS that prop's value now; the two styles hang off it as
// siblings, so a writer's Bar|Rhizome choice picks which one paints in the
// one lane instead of which surface gets an instrument at all.
//
// The render-gating finding this fixes (root-caused live, not guessed — the
// full trace is in docs/wrizo-alpha/m4-finish-map.md): on the FRAMED desk the
// legacy incentive row (`.mode-incentive-row`, ModeStage.tsx) is gated
// `!framed`, because AB1 S2 deliberately "reserved the meter track for its
// later return." S3 IS that return — but through THIS lane, not through
// `.desk-frame-meter`: FX1 S5 killed that shell on Nick's "the dead bar"
// verdict and it stays dead (nothing passes DeskFrame's `meter` prop). The
// legacy row itself is untouched and stays `!framed`; below 1100px nothing
// in this file ever mounts.
//
// S4, the completion moment: crossing the goal was effectively INVISIBLE on
// the framed desk — the ProgressBar's own celebrate (ignition + spark burst)
// never mounted there at all, and `AmbientGlow`'s bloom is `!framed` too
// (AB1 S2 parked the ambient glow on the framed desk, where GoalGlow owns the
// warmth behind the paper — reviving it here would put two glows on one
// stage). So the flare gets a home of its own IN the lane: an ember bloom
// that fires on the SAME `celebrating` transition every other celebration in
// the app already rides, then is gone. Evental by construction — no count, no
// score, nothing remembered (useGoalProgress seeds its lap count at mount, so
// re-opening a long page never re-fires a lap crossed in some earlier
// session). It fires for BOTH styles: the lane is where crossing the goal is
// felt, whichever instrument is occupying it.
```

## DeskInstrument §2

From `apps/desktop/src/components/DeskInstrument.tsx`, line 46 at `ded4321b` (the comment that stays: "the glitch meter, Flux's progress animation: it gates itself on the theme and settings; writing pages only (the Journal sheet does not pass it)").

```ts
  // GLITCH METER: Flux's own progress animation, the rhizome's counterpart (it self-gates on the theme and the same settings). WRITING PAGES
  // only (Fable, Oct 17): PageEditor passes it; the Journal sheet does not.
```

## DeskInstrument §3

From `apps/desktop/src/components/DeskInstrument.tsx`, line 86 at `ded4321b` (the comment that stays: "under Machina the Run strip is the only progress instrument, so the thin bar is not drawn on the framed page (unframed surfaces keep it)").

```ts
      {/* MACHINA (Fable, Oct 23): the Run strip (RunStrip.tsx, mounted above) is the ONLY progress instrument under this theme - Arbor's thin bar and its orange "WORDS" are not drawn on the framed
          page. (The unframed legacy surfaces keep their bar: Run lives on the framed desk only.) */}
```
