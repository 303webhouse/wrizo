# Rulings: `apps/desktop/src/pages/JournalEntry.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[JournalEntry §n]` points here.

## JournalEntry §1

From `apps/desktop/src/pages/JournalEntry.tsx`, line 131 at `4d6af3d9` (the comment that stays: "the Journal's page enters the frame at >=1100px only; below the gate the JSX is the legacy one, unchanged").

```ts
  // AB2 S6 — the R2 ruling (ab1-review-fable.md): the Journal's page enters
  // the frame. >=1100px only; below the gate this is byte-identical legacy
  // JSX (the AB1 pattern exactly), which is also why the existing
  // JournalEntry-flavored harness checks stay green untouched.
```

## JournalEntry §2

From `apps/desktop/src/pages/JournalEntry.tsx`, line 740 at `4d6af3d9` (the comment that stays: "the framed Page panel has no footer line (the <1100px .journal-autosave-note below is a different surface)").

```ts
    // ITEM word-diet (Nick, Oct 13) — REMOVE. The framed Page panel's own
    // footer line retires whole (the legacy <1100px .journal-autosave-note
    // below is a different surface, untouched by this pick).
```

## JournalEntry §3

From `apps/desktop/src/pages/JournalEntry.tsx`, line 828 at `4d6af3d9` (the comment that stays: "screen-reader labels keep full wording, and this "page" is the notebook's physical page, a literal word, not the lexicon's product term").

```ts
            // ITEM word-diet (Fable, review fix, Oct 13) — reverted: SR
            // labels keep full wording (rule 6), and this "page" is the
            // notebook's physical page (bucket b), a literal word, not the
            // deskLexicon/themeLexicon product term.
```

## JournalEntry §4

From `apps/desktop/src/pages/JournalEntry.tsx`, line 913 at `4d6af3d9` (the comment that stays: "Incentive layer: progress bar and typewriter toggle, authored pages only, never chrome-faded. The bar honors the saved Progress setting (this route has no gear to undo it); only Words applies on the Journal. Framed, the whole row stays unmounted: the typewriter toggle lives in the sliver and the meter track stays empty.").

```ts
      {/* Incentive layer — progress bar + typewriter toggle. Authored pages
          only; stays visible while writing (never carries chrome-fade). The
          bar honors the persisted Progress setting (Fable W1-R2) — a writer
          who turned it off elsewhere has no gear on this route to undo it,
          so the setting must be respected here too. Only Words applies on
          the Journal (no session-timer readout on this surface); Time stays
          ModeStage-only for now. The typewriter toggle is independent and
          always shown regardless of the progress metric.
          AB2 S2/S6 — framed: this whole row stays unmounted (ModeStage's own
          established framed gate, generalized here) — the typewriter toggle
          moves to the sliver (CD1: components/Sliver.tsx), and the meter
          track stays empty/reserved this ticket, matching every other
          DeskFrame surface. */}
```

## JournalEntry §5

From `apps/desktop/src/pages/JournalEntry.tsx`, line 966 at `4d6af3d9` (the comment that stays: "the noun is cut: name the act, not the object ("pages text" is not English)").

```ts
          {/* ITEM word-diet (Nick, review fix, Oct 13) — "page text" was a
              normal singular-noun-as-modifier compound; "pages text" isn't
              standard English. Cut the noun (name the act, not the object). */}
```

## JournalEntry §6

From `apps/desktop/src/pages/JournalEntry.tsx`, line 1069 at `4d6af3d9` (the comment that stays: "the capture (Free Write) tool-rail content: Spark deck, Fragments, Send to Drawer. No ink swatches (the ink layer is one fixed colour, not a palette) and no forward-lock switch (this surface's word-granular deletion rail does not use ForwardOnlyEditor's propulsion)").

```ts
  // AB2 S1/S6 — the "capture" (Free Write) tool-rail content: the SAME
  // Spark deck / Fragments / Send → Drawer items AB1 parked in the interim
  // corkboard tab, at their ruled final home. No ink swatches here (this
  // surface has no typed-text pen — the ink layer above is hand-drawn
  // strokes, a single fixed color, not a palette); no forward-lock switch
  // here either (S2 ties that explicitly to ForwardOnlyEditor's propulsion,
  // which this surface's own word-granular deletion rail does not use).
```

## JournalEntry §7

From `apps/desktop/src/pages/JournalEntry.tsx`, line 1087 at `4d6af3d9` (the comment that stays: "A MOVE takes the page out of the Journal, so follow it out; COPY/LINK leave it here and the local toast shows. A MOVE's toast would unmount with this view, so the message goes to the Journal list as one-shot nav state (cleared on arrival, so a refresh never re-shows it).").

```ts
            // A MOVE takes the page out of the Journal — this loose-page view
            // no longer applies to it, so follow it out. COPY/LINK leave the
            // page exactly here, so the local toast shows normally. A MOVE's
            // toast can't: this view unmounts on navigate, taking the toast
            // node with it (Fable R1) — hand the message to the Journal list
            // as one-shot nav state instead (the F2 `warmStart`
            // consume-on-arrival pattern; the list clears the state on
            // arrival so a refresh never re-shows it).
```

## JournalEntry §8

From `apps/desktop/src/pages/JournalEntry.tsx`, line 1151 at `4d6af3d9` (the comment that stays: "screen-reader labels keep full wording; the notebook's paging is the physical page, a literal word, not the lexicon's Pages term").

```ts
              {/* ITEM word-diet (Fable, review fix, Oct 13) — reverted: SR
                  labels keep full wording (rule 6), and the Journal
                  notebook's paging is the physical page (bucket b) — a
                  literal word, not the deskLexicon/themeLexicon term, so
                  the Pages-plural ruling doesn't apply to it. */}
```

## JournalEntry §9

From `apps/desktop/src/pages/JournalEntry.tsx`, line 1244 at `4d6af3d9` (the comment that stays: "as the framed nav above").

```ts
            {/* ITEM word-diet (Fable, review fix, Oct 13) — see the framed
                nav's own identical comment above. */}
```
