# ITEM 83 — PASS 7: THE PLACES PANEL (item 88's charge)
### Committee double-pass · menus lane · 2026-08-03
**STATUS: CANDIDATES ONLY.** The lock waits on Nick's word alone. This pass answers
the founder verdict the sitting routed here — S4/88, "a list of binder names in the
current page's panel reads as 'places I can GO' and is 'places I can PUT THIS';
the redesign belongs to the menus arc because this panel is their chrome" — and
with it the arc's design phase closes at seven passes.
**Provenance:** the census @ `5a16b98`; Passes 0–6 @ `7d2e0ab` / `8b3475d` /
`ba741ab` / `20d654a` / `62a7c50` / `e519854` / `a9b1a9d`; item 88's consolidated
S0 @ `f99a450`; the fix-wave merge @ `da69332` (88b's honesty verified in the
diff by this desk); the panel and its lexicon read whole at today's tip
(`PlacesPanel.tsx`, `CascadePanels.tsx` PagePanel, `deskLexicon.ts`). The 96 seam
stands open through Nick: item 96 owns what places exist; this pass owns how the
panel speaks them. Zero mechanics, zero schema — dress and language only.

---

## §0 · THE CHARGE, AND A MICRO-CENSUS OF THE PANEL AS BUILT

The Phase-1 census predates the sitting and never detailed this face, so the pass
opens with its own inventory, truth-stated from today's tip.

**The composition** (`CascadePanels.tsx`, PagePanel): a **"＋ New page" door**
(door-dressed, `wz-cascade-action-door`) → **PageFace** (the page's Port/Pin
verbs; its old Move/Copy verb retired, superseded by Places — per item 88's
reviewed S0) → **PlacesPanel**.

**The panel** (`PlacesPanel.tsx`, B2 S4): title **"Places."** Then the **Home
zone** — a radiogroup whose accessible name is "Home" but which renders **no
visible heading** — listing radios: **Journal** · every binder by title
('Untitled' when empty) · **Loose** · then the **"＋ New Drawer"** flow (input
"Drawer name," Create, Cancel). Then the **Boards zone** — visible heading
**"Boards,"** accessible name **"Boards this page can join"** — true checkboxes
of every user board (first-line titles, 'Untitled board'), empty state "No
boards yet."

**The mechanics, already honest:** A16 enforced in the panel's own text — the
Home radios write ONLY `projectId` via `setPageHome` (single-select: a page has
one home); the Boards checkboxes write ONLY membership via pin/unpin; nothing
ever writes `origin`; there is no third path. System boards get the whole panel
as an **absence** (a null return — B1 S3 extended, the code's own words: absence
reads clearer than a control that quietly refuses). Fresh-read discipline,
`flushNow` after writes, and — since the fix wave — the three honest strings:
*"Filed to X."* only when filed; *"Write a word first — an empty page isn't
saved yet; nothing moved."*; *"X is no longer there; nothing moved."* (and
createAndFile's *"…is ready when you are."* variant). All strings ride the
lexicon and are themable.

**The finding this census adds:** the panel's honest language already exists —
**and it is spoken only to screen readers.** "Home." "Boards this page can
join." The sighted eye gets a panel titled *Places* over a bare column of
place-nouns, sitting directly beneath a door. The confusion Nick's hardware
reported is the exact gap between the panel's aria layer and its visible layer.

---

## FIRST PASS

### THE EXPERTS — why nouns failed and mechanics didn't

**A grammar collision, not a control defect.** Everywhere else in Wrizo, a list
of place-nouns IS navigation — the Drawers tree, the board lists, the cascade's
own categories. The writer's learned grammar says nouns-in-a-column are doors.
This panel is the one place the same shape means *put*, and it announces the
difference in a channel the eye cannot hear. The radios and checkboxes are
semantically right; radio dots at reading distance are not a sentence.

**The mechanics are the model's truth — keep them to the letter.** One home,
many memberships: A16's two writes are the Places Model's own skeleton showing
through. Whatever item 96 rules about which places exist, single-select-home
versus multi-membership survives it. The redesign therefore touches dress and
words only — a zero-mechanics, zero-schema pass by construction, which is also
what keeps the 96 seam clean: the grammar is designed over the list, not the
list.

**S13's precedent generalizes.** The Card pass ruled that verbs teach the
*kind*; this panel needs verbs to teach the *act*. Same law, second face:
where a noun can be misread, the verb at the point of reading is the cure.

### THE ARCHITECTS — the redesign's shape

**Promote the aria to the eye (the core move).** The zone headings become
visible, engraved, and verb-led: the Home zone gains the heading its
accessibility layer already carries — rendered as a verb phrase naming the act
(the pass's working candidates: **"This page lives in…"** for the zone, or
**"File this page to…"**; Nick's word picks the sentence) — and the Boards
zone's visible heading becomes its own honest aria made plain (working
candidates: **"Pinned to boards…"** / **"Also appears on…"**). One ember per
engraving (G5); rows stay noun targets beneath a verb that governs them once —
never verb-prefixed per row (the bench's repeated-word tax, and CA1's own
noun/verb agreement inverted correctly: heading carries the verb, rows carry
the nouns).

**The state speaks first.** The page's current home must be legible at a
glance, not only as a filled dot among twelve: the checked row wears distinct
dress (the engraved treatment; no orange — the resting ceiling holds in
cascade chrome as everywhere), so the zone reads as *where it is → where it
could go* instead of a menu of doors. The Boards zone's checked rows likewise
read as standing memberships, not options.

**One panel, one act-family.** The panel adds no doors and no per-row "open"
affordances — a second act per row would recreate the ambiguity as a
mis-click. Going lives where going already lives (the Drawers category, the
crumb); the "＋ New page" door above the panel keeps its door dress and its
separation, judged on the mockups. The "＋ New Drawer" flow stays — it is a
put-family act (create the place and file there in one gesture) — reworded to
name the act, not just the object (working candidate: **"File to a new
drawer…"**; his word picks).

**The grammar binds the form; the cascade keeps its engine.** This pass also
closes the census's last standing §11 question: cascade panel *contents* adopt
the shared anatomy — engraved headings as the ember sites, one-press rows, G3's
absences (the system-board null-return is already the specimen) — while the
cascade's state-reset dissolve remains its own lawful mechanism, a named
species beside the vanish engine, not folded into it.

**Routed, not ruled:** the Untitled litter ('Untitled' binders, 'Untitled
board' rows) belongs to items 90/96 and the fix lanes — named here because the
mockups will render it, fixed nowhere in this arc. The lexicon's themed
registers mean every new string this redesign lands is born themable.

### THE OPPOSITION — named chair: Marketing / simplicity

**Objection 1 — the fix wave may have already solved it.** The toasts are
honest now; wait for post-fix hardware before redesigning. **Answer:** the
toasts speak *after* the click; the verdict is about the read *before* it. The
redesign is pre-click legibility, and the founder verdict routes it here
explicitly — waiting would be declining his word.

**Objection 2 — this is copywriting wearing a design pass's clothes.**
Headings and a bolder checked row; the committee is billing hours for
sentences. **Answer:** in a writing app, copy *is* chrome — and the pass's own
census shows the failure is precisely linguistic: the honest words exist and
are inaudible. The mockups render dress and words together; the judgment is
Nick's on the paper, not the prose.

**Objection 3 — don't redesign a panel item 96 may re-found.** The Places
Model could change what this panel lists. **Answer:** conceded and already
absorbed — the redesign is grammar-over-list (verb-led zones, state-first,
one act-family), which survives any roster of places 96 lands on; the seam
stays open through Nick, and Phase 3 renders with today's places, swappable.

### THE COGNITION / ADHD BENCH

The glance is the test the panel failed, so the bench's laws govern: the
current home findable in under a second; verbs read once (headings), never
per-row; a long binder list is a real scanning tax — **flat versus grouped
targets both render in the Phase 3 pair** and the ceiling is judged on paper,
not argued here. No motion is added anywhere; the checked-row dress is static;
and the panel's refusal strings, already calm, stay exactly as the fix wave
wrote them.

---

## SECOND PASS — CANDIDATES

**PP1 · THE PANEL SPEAKS IN VERBS.** Zone headings become visible, engraved,
verb-led — the act named once where the eye lands; rows stay noun targets.
Working sentences offered; the exact words are Nick's at lock. (S4/88; S13's
precedent; G5.)

**PP2 · THE STATE SPEAKS FIRST.** The current home and standing memberships
wear distinct, static dress — the zone reads as *where it is → where it could
go*. No orange; the resting ceiling holds. (The glance test; the Plateau law.)

**PP3 · MECHANICS UNTOUCHED, TO THE LETTER.** A16's two writes, single-select
home, multi membership, the system-board absence, fresh-read, `flushNow`, and
all the fix wave's honest strings stand verbatim. Dress and language only;
zero mechanics, zero schema. (A16; B1 S3; the 88 fixes.)

**PP4 · ONE PANEL, ONE ACT-FAMILY.** No doors and no per-row open affordances
inside Places; going routes where going lives; "＋ New Drawer" stays as a
put-family act, reworded to name the act. The New-page door above keeps its
door dress and its distance, judged on the mockups. (BM1's spirit; the
mis-click bench law.)

**PP5 · THE GRAMMAR BINDS THE FORM; THE CASCADE KEEPS ITS ENGINE.** Cascade
panel contents adopt the shared anatomy — embers, one-press rows, G3's
absences — while the state-reset dissolve stays its own lawful mechanism, a
named species. Census §11's last question closed. (Pass 0; the census.)

**PP6 · LENGTH IS THE MOCKUP'S QUESTION.** Flat versus grouped binder targets
both ship in the Phase 3 pair; the scanning ceiling is judged on the rendered
paper. The Untitled litter is named and routed (90/96), not fixed here.
(The bench; the seams.)

**FOR THE LOCK SHEET** (added this pass): PP1's exact verb sentences — the
Home zone's and the Boards zone's, his words · PP4's "＋ New Drawer" rewording
· PP6's flat-versus-grouped, on the mockups.

**FOR THE MOCKUP WALK:** before touching anything, say aloud what clicking a
binder name will do — the panel passes only if the sentence comes out as
*put*. Find the page's current home in under a second. Feel for the GO
impulse — and notice whether the verb heading routes it away before the
mis-click.

---

## §CLOSE · THE DESIGN PHASE CLOSES — PHASE 3 OPENS

Seven passes stand on `main`: the grammar and its eight candidates, six
contexts and their forty, and this seventh with its six — every founder
verdict received and dispositioned, every seam named and routed, nothing
locked, no ledger touch since S0. **Phase 3 now opens:** at least two
standalone HTML mockups per context — Free Write · Draft · Screenplay ·
Board · Card · Revise · the Places Panel — Plateau tokens only, every one
rendered at both reference widths (the 1366×768 floor and wide) with the
rendered-geometry line each mockup owes from day one, committed to
`docs/menus/` for Nick's walk. After the pairs: the lock-sheet
consolidation — every word this arc owes Nick, on one page, with the mockups
beside it. The committee has argued; now the paper shows.
