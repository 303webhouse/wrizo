# FX5 — the Felt Verdicts · build brief · 2026-07-19

**Branch:** fx5-felt-verdicts off main, own worktree. QUEUED — builds
after TU1's branch review lands (one brief per ticket; TU1 holds the
slot). Zero schema (box.title/tags etc. are NOT in this ticket —
card-committee material). Merge pre-authorized (zero-schema rule);
Fable reviews post-merge. STOP-and-report if any slice wants a column.
**Authority:** Nick's FX4 verdict sheet, 2026-07-19 (ledger record) —
two in-app note pages + nine itemized verdicts.

**A standing discipline, born here:** FX4's thread gesture and
hover-restore both passed synthetic-event harness proofs and both
fail under Nick's real pointer. For every input-gesture claim in this
ticket: reproduce with the closest-to-trusted event stream the
harness can produce, document the residual gap honestly in the check
itself, and where a gap remains, the DoD names Nick's hand as the
only proof that counts.

## S0 — records first
Ledger: open FX5; item 33 closes PARTIAL (passes recorded; carries
route here); the A1 wide-desk glance stays open on Nick's list.
Record Nick's parked idea (momentum scroller — his own "not right
now") and his restated staged-vanish want (committee-owned). Commit
this brief.

## S1 — the typewriter's manners (the big one)
(a) Engage motion: when the hold band is crossed, the page moves UP
ONE LINE per new line, smoothly — never a multi-line recenter jump.
Word's own feel is the reference. First-engage especially must not
lurch. (b) The fade band starts one line lower. (c) SCROLL FREEDOM:
a writer who scrolls up (wheel/trackpad) OWNS the scroll position —
typing never snaps the page back to the band; the typewriter resumes
its gentle per-line motion from wherever the writer settled, and the
top-of-VIEWPORT ~4 lines carry the fade regardless of scroll
position (viewport treatment, not absolute-text treatment). (d)
Start offset 25% unchanged. Ink-coordinate STOP-clause carries from
FX4 (any change that could move the rect: prove byte-truth again).

## S2 — the glow, felt this time
FX4 fixed the painting; the tune is still under Nick's threshold
("Glow — anyone, anyone? Bueller?"). Retune so progress is plainly
visible by mid-goal on a real desk in a normally lit room — raise
the curve/floor aggressively within the untouched cap; if
perceivable-at-mid-goal genuinely fights the cap's ceiling, STOP and
report with measured values so Nick can re-rule the cap itself.
Harness floor assert rises to match whatever ships.

## S3 — board surface polish
(a) Scrollbars styled to Plateau everywhere the board scrolls —
thin, low-contrast, square, no OS chrome. (b) Page-pin cards clamp
to a NOTECARD excerpt (title + ~3 lines + a quiet "open" affordance
via the existing double-click travel) — the Board organizes ideas,
it doesn't read pages (Nick's words). (c) Diagnose and fix page-pin
both-axes resize — likely the content-minimum trap (full-text
content inflating the reflow floor); the clamp probably frees it,
but PROVE it, don't assume.

## S4 — cards move like cards
(a) Diagnose the drag friction Nick hit (cards "can't easily be
moved") — find the actual cause live. (b) Free-flowing movement;
OVERLAP IS PERMITTED. (c) Layer control: when cards overlap, a
small quiet icon (existing z field; front/back) appears on the
selected overlapping card — minimal, undistracting; final chrome
placement may be revisited by the card committee, mechanics land
now.

## S5 — the pin, not the handle
The dead handle-double-click gesture is REMOVED (do not repair it).
Nick's ruling: a small olive circle at the card's top corner — the
pin — is the connection grab: drag from pin, release inside another
card, thread mints. Preview line + cancel semantics carry over from
FX4 unchanged. Connections render as one quiet footer line on each
connected card ("— thread: <card title/first words>"); a single
per-board footer toggle lives in the board sliver (Add card + this,
two controls). The footer's fuller metadata (Act/Scene, tags,
titles) is COMMITTEE-OWNED — do not invent fields.

## S6 — the popup shows words, not syntax
On cards, Bold/Italic display WITHOUT visible asterisks — markers
hidden in display, storage stays markdown conventions untouched
(reveal-adjacent-to-caret is acceptable if hiding-always proves
brittle; pick one, document why). Draft mode's own dimmed-syntax
register is NOT touched — this is a card-surface display register
only, per Nick's explicit verdict that asterisks on cards are a bug.

## S7 — the em dash
Two or three hyphens followed by letter+space autocomplete to an em
dash (Word convention) on prose surfaces and the card popup. One
undo step reverts to the literal hyphens. deskLexicon untouched
(no strings); no other autocorrects ride along.

## S8 — hover-restore, on real hardware
The FX4 fix passed four synthetic cycles and fails under Nick's
mouse. Instrument useChromeDissolve live, reproduce with real
pointer semantics (isTrusted paths, passive listeners, pointer
capture, zone geometry at his resolution), fix at the root, and
state in the report exactly what differed from the synthetic proof.
If it cannot be reproduced synthetically at all, say so plainly —
the DoD then rests on Nick's hand, disclosed, not on a green check.
Also verify: the sliver/tool fade Nick praised is untouched by the
fix.

## S9 — harness (fx5.mjs) + parks
Per-line engage motion (no multi-line delta on band-cross); scroll-
freedom (synthetic scroll-up + type → no snap; fade tracks
viewport); glow floor at the new tune; excerpt clamp + pin resize;
overlap + z-cycle; pin-gesture lifecycle at the harness's honest
fidelity ceiling (gap documented in-check); no-asterisk display;
em-dash + its undo. Park sweep: fx4.mjs's handle-gesture checks and
any band-recenter asserts — A4 discipline, quoted, live successors.
Full suite green, both HARNESS_PARKED settings.

## Non-goals
Staged vanish + strip drawer-shut (committee); card
titles/tags/metadata fields (card committee); momentum scroller
(parked, Nick's word); AB5's break line; trash bin; the threshold
(tabled); anything touching Draft's own dimmed-syntax register.

## Invariants
Zero schema. Paper never moves (scroll ≠ rect). Copy-out stays
Publish-only. Olive = state (the pin), brass = action — lanes never
cross. Square corners; anti-solicitation; deskLexicon for any new
string. Legacy <1100 chrome byte-identical. Both widths + 1100
floor on geometry asserts. Report = push.

## Definition of done
Nick, after redeploy: writes past the band and the page steps up a
line at a time like a well-mannered word processor; scrolls up
mid-page, types, and the page STAYS; watches the glow actually
arrive by mid-goal; drags cards freely, stacks two, sends one
behind with the quiet icon; drags a thread from the olive pin and
reads the connection in the footer, then toggles the footer away;
bolds a word in the popup and sees no asterisks; types two hyphens
and gets an em dash; ports a long page and gets a notecard, not a
scroll; brushes faded chrome twice in one sitting and it wakes both
times; and the scrollbar finally dresses like it lives in Plateau.

— Fable, from Nick's verdict sheet, 2026-07-19

## S10 (amendment, Nick's A1 verdict, 2026-07-19) — center the paper
The desk recomposes: the strip stays flush at the screen's own left
edge (FX4 S3's win, untouched); the PAPER returns to viewport
center; leftover width falls symmetrically around the paper rather
than piling right. Implementation is CC's call (decouple the strip
from the grid's centering — likely the strip anchored to the screen
edge while the stage centers in the full viewport) — but the
composition law above is the invariant, asserted in fx5.mjs at both
reference widths + the 1100 floor: strip x===0 AND
|left-paper-gap − right-paper-gap| within tolerance (strip's own
width excluded from the symmetry measure). cd1.mjs's parked
symmetric-margins check gains a generation-2 note pointing here
(the accretion precedent) — the OLD symmetric framing (inset strip)
stays parked; the NEW symmetry (flush strip + centered paper) is
its successor, not its restoration.
