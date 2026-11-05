# Rulings: `apps/desktop/src/components/PlacesPanel.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[PlacesPanel §n]` points here.

## PlacesPanel §1

From `apps/desktop/src/components/PlacesPanel.tsx`, line 121 at `e2898deb` (no comment stays: the code reads plainly).

```ts
      {/* ITEM word-diet (Nick, Oct 13): REMOVE — superseding ITEM 83 M7
          (PP1) immediately below, kept for the record rather than deleted:
          M7 added this exact heading BECAUSE Nick's own earlier hardware
          report named the opposite failure ("a list of binder names ...
          reads as 'places I can GO' and is in fact 'places I can PUT
          THIS'"). Flagged to Fable as a real tension, not silently
          dropped — built as instructed since this round's picks are
          final, but the two rulings are in direct conversation with each
          other and a future reviewer should see both.
          ITEM 83 M7 (PP1) — PROMOTE THE ARIA TO THE EYE.
          Pass 7's census found the defect: this panel's honest language already
          existed and was spoken ONLY to screen readers. The Home zone carried
          aria-label "Home" and rendered NO VISIBLE HEADING at all, while the
          Boards zone below carried both. The sighted eye got a panel titled
          "Places" over a bare column of place-nouns — and everywhere else in
          Wrizo a column of place-nouns IS navigation. That gap is exactly what
          Nick's hardware reported (S4/88: "a list of binder names ... reads as
          'places I can GO' and is in fact 'places I can PUT THIS'").
          The heading is a VERB PHRASE naming the act, carried ONCE where the
          eye lands — never verb-prefixed per row (the bench's repeated-word
          tax; CA1's noun/verb agreement inverted correctly, heading carries the
          verb, rows carry the nouns). */}
```
