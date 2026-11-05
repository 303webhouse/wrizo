# Rulings: `apps/desktop/src/components/LocationCrumb.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[LocationCrumb §n]` points here.

## LocationCrumb §1

From `apps/desktop/src/components/LocationCrumb.tsx`, line 5 at `e2898deb` (the comment that stays: "the address line, the one implementation of the board header's crumb (drawer / project / here); it never renders empty - with no drawer or project it reads describePageHome's own words").

```ts
// PW1 S6 (Nick, Q7: RIDES THIS ARC) — THE ADDRESS LINE, in the shape the Board
// already proved. REUSE, NEVER COPY: `BoardEditor.tsx`'s framed header row is
// `crumb (marginRight:auto) · strip · actions`, and its crumb is
// `drawer / project / here`. That row shape is the precedent; this component is
// the one implementation of its crumb, so Page and Screenplay cannot drift from
// each other the way their two hand-rolled copies already had.
//
// ON RECORD, so it is not re-litigated: CD1 S1 removed this DELIBERATELY
// (`PageEditor.tsx`, "the top-bar title retires (the crumb/breadcrumb it
// duplicated — the Page face already carries the same title + 'where it lives'
// chain via describePageHome, S3)"), re-homing "where it lives" into the Page
// face INSIDE A DRAWER. On the framed desk that made the question cost two
// presses and a drawer, and the writer had to already know which drawer. Nick's
// hardware falsified the trade; Q7 returns it. A RULED TRADE OVERTAKEN BY
// EVIDENCE, NOT A DEFECT.
//
// THE CHAIN NEVER RENDERS EMPTY. With no drawer and no project the old markup
// fell through to a bare title, which says nothing about location at all — and
// the one case where the writer is most likely to be lost is the case where the
// address must still say something true. `describePageHome` already produces
// that string ("Loose — belongs nowhere yet"), so the honest answer was in tree
// the whole time; it simply had no reader here.
```

## LocationCrumb §2

From `apps/desktop/src/components/LocationCrumb.tsx`, line 44 at `e2898deb` (the comment that stays: "not `crumb-item`: its ellipsis suits a long NAME but turns the location PHRASE into a different sentence; the phrase never elides, the title takes the truncation").

```ts
      {/* PW1 ERRATUM 3 (Nick's live sitting, 2026-09-09) — NOT `crumb-item`.
          That class carries `max-width:160px` + `text-overflow:ellipsis`, which
          is right for a NAME that is merely long (a drawer, a project) and
          catastrophic for a PHRASE: "Loose — belongs nowhere yet" clipped to
          "Loose — belongs now…", which does not read as a truncation at all —
          it reads as a sentence, and as the OPPOSITE of the one it is. A name
          survives elision because the reader knows a name was shortened; a
          phrase does not, because the shortened form is still grammatical.
          THE LOCATION PHRASE NEVER ELIDES; truncation is the title's to take
          (see `.crumb-here` in index.css). */}
```
