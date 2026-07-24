# The Thread — arc seed · Nick's rulings of 2026-07-24

**Place at:** `docs/wrizo-alpha/thread-arc-seed.md`.
**Status:** VISION ON RECORD, not a brief. Committed per disk-first —
these rulings arrived in chat and would otherwise be lost. The arc is
**post-vacation**, designed by a full committee pass (double-pass house
format) that inherits this document as its charge. Nothing here builds
before the freeze.

## Nick's rulings, structured (2026-07-24, verbatim where quoted)

1. **Two homes, ratified.** "Is there a reason to have any other kind
   of 'home base' landing spot other than the Page or the Board?" —
   ruled No, and the constitution already agrees: Journal/Shelf/Trash
   are system Boards; the Threshold lands on a Page; Publish and
   Workshop are doors, not homes. Open post-vacation corollary: whether
   the project binder (the last list-costumed surface) becomes a system
   Board.
2. **Beats are cards.** "The beats are going to be coming from the
   cards, which may be a plot beat preset or may be completely created
   from scratch by the user." The legacy beats system
   (`beat_id`/`story_plan_id`, the old bar control) is superseded;
   CD4 retires the control; the data sleeps grandfathered.
3. **Cards link to Pages; the Board is the map of the story.** "Cards
   (or these 'beats') should be linkable to a Page so that if a writer
   wants to jump around in their story or argument, they can do that
   from the Board."
4. **The link is visible from the Page side.** "If a Card is linked to
   a Page, that card should be easily viewable from the Page UI —
   probably under the 'Page' pop-out menu for now."
5. **Page → new Card.** "Say I write a scene and realize it should be
   a new 'beat' or card on my storyboard — I should be able to easily
   add that from the Page interface" (the Page popout, for now).
6. **Unlinked Card → new Page.** "Every card or beat that isn't linked
   to a page already should have a simple option somewhere (maybe a
   basic page icon) to start a Page linked to that card."
7. **Cards link to MULTIPLE Pages,** "in which case each would be
   listed in the menu" — Nick's example was cut off mid-sentence
   ("e.g."); Fable's working reading, TO BE CONFIRMED: a card linked to
   three pages lists all three, each entry a jump.

## What already exists (the committee builds on, not around)

- **Card → Page linking and travel:** the `page-pin` box kind
  (`box.entryId`) + pin double-click travel (FX7 S5, trusted-pointer
  proven). Ruling 3 is half-shipped.
- **Cards preset-or-scratch:** the plan Board's cards; the seven-deck
  library; W1 (the Deck Wizard) is the preset flow, post-vacation.
- **The page↔board pairing:** BM1's `plan_board_id` + PAGE →/PLAN →
  doors; lazy birth (`getOrCreatePlanBoard`); derivation-by-scan
  (`isPairedPlanBoard`). Ruling 6 is this pattern pointed the other
  way.
- **Exports honor cards:** pins as references, lane titles (FX11),
  unknown kinds fail loud.

## What is genuinely new (the committee's design surface)

A. The Page-side reverse view: the popout listing linked cards
   (derivation-by-scan, no stored back-reference — the house pattern).
B. Page → new linked Card (which board does it land on? The paired
   plan Board is the obvious default; the committee rules the
   unpaired-page case).
C. Unlinked Card → birth a linked Page (the page icon; lazy birth;
   where does the born page home — loose, or the board's project?).
D. Multi-page links: the data shape is the committee's first question —
   candidate (i) `page-pin` grows `entryIds[]`; candidate (ii) a card
   carries `linkedPageIds[]` regardless of kind (any card can thread);
   both zero-schema via box jsonb, the BM1 `seq`/`laneId` precedent.
   Fable's early lean: (ii) — "any card can thread" matches ruling 2's
   spirit (a beat is a card, not a special kind), and leaves `page-pin`
   as what it is (a pin, not a link).

## Standing rails the committee inherits unamended

The ghostwriter rail (A12–A15); anti-gamification (no counts on
threads, no completion states — a thread is a map, never a meter);
decks are data, modes are projections (thread rendering per mode is a
projection question); nothing orange at rest; derived membership over
stored cascades; zero-schema strongly preferred throughout.

## One convergence, noted

Nick's word for where sharing lives: "Publish or **Workshop**" — the
Read arc's own floor. The arcs are converging in his vocabulary; the
Publish door's eventual far side is the Workshop's intake. Recorded,
not actioned.

— Fable, capturing Nick's rulings the day they were spoken
