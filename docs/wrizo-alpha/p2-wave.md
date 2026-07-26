# The P2 Wave — sitting verdicts + four briefs · 2026-07-25

**Place at:** `docs/wrizo-alpha/p2-wave.md`.
**Authority:** Nick's walk of the deployed P1 tree (`git 5edae77`), his
words of 2026-07-25 recorded below as SV18–SV30.
**Bundling disclosed:** four briefs in one document, same reason as the
P1 wave — Nick's relay budget is the scarce resource. Each section is
its ticket's brief: own owner, own branch, own DoD.
**Item numbers, assigned not claimed:** FX16 = 72 · BG2 = 73 · FX17 =
74 · FX18 = 75. (62 SC arc · 66 DF1.1 · 67–71 the P1 wave.)
**All four are ZERO SCHEMA, ZERO SERVER FILES** — merges ride the
standing pre-authorization through chat 1's lane; Fable reviews
post-merge; one deploy word covers the wave.

## The verdicts of record

**SV18** The first-line invite still renders on a fresh page after
FX15 — "a door left open" with its dismiss line, present by default.
**SV19** The page's beginnings row is not legible as a set of modes:
it wants centering on the sheet, icons ABOVE their labels, everything
~50% larger, and a DARK olive that reads against cream.
**SV20** The board's row is correctly centered and legible as modes,
but carries the same size/weight/colour faults.
**SV21** The board does not extend far enough down the screen — it
should reach near the bottom with a healthy border, not stop short.
**SV22 (BUG)** Dragging a new card toward the bottom of the board
stutters and freezes at the edge. The board should extend downward as
cards approach the floor, up to a limit, then hard stop.
**SV23** The writer must be able to zoom out far enough to see the
entire board.
**SV24** The Tutor panel on the Board overlaps the app's edge when
opened, and covers the arrow that would close it.
**SV25** The right-hand drawer arrow points the wrong way — it must
mirror the left-hand arrow.
**SV26** An opened right-hand panel overlaps the opened left-hand
toolbar, blocking controls beneath it (the Typewriter toggle named).
**SV27** The Board's top menu should parallel the Page's: ALL CAPS,
right-aligned.
**SV28** The screenplay page's vertical rhythm is wrong — no blank
lines between elements. *(Already built on `sc2-the-clock`, unmerged;
recorded so the SC lane knows it is Nick-confirmed, not theoretical.)*
**SV29** Nick asks whether a blank line belongs between the character
cue and its dialogue. **Ruled: no** — trade standard places the space
ABOVE the cue, which is what `SPACE_BEFORE` already encodes
(character 1, dialogue 0). No change.
**SV30** Nick reads the screenplay's left margin as wrong. **Fable's
measurement of the screenshot says it is correct** — scene heading and
action both begin at 17.6% of sheet width, the 1.5" margin exactly.
Charged to the SC lane to verify against SC1's own constants and
report; if correct, the felt wrongness is SV28's missing rhythm and
closes with it.

## FX16 — the Invite, Truly Silent · **owner: chat 1** · item 72

**Authority:** SV18. FX15 built this surface; the same lane closes it.

**S1 — root-cause FIRST, no patch before the mechanism is named.**
Two candidate mechanisms, both testable in minutes. **(a) A persisted
pre-FX15 value overriding the new default** — the invite's stored
setting was written "on" by an older build, and a stored explicit
value beats a changed default. This is the prime suspect: it would
mean FX15 is correct for new users and broken for every existing one.
**(b) The render path ignores the setting** — the component mounts
regardless. Reproduce on a profile with the key cleared and on one
with it set, and NAME which it is in the commit.

**S2 — the fix at that root.** If (a): a one-time migration that
retires the stale key so the new default governs — never a silent
overwrite of a value the writer set deliberately; if the writer
explicitly opted in post-FX15, that choice survives. If (b): fix the
gate.

**S3 — the harness closes the hole FX15 left.** `fx15.mjs` proved the
invite silent on a clean profile. Add the case that escaped: a profile
carrying the legacy value renders no invite. That absence is the whole
ticket.

**DoD:** a fresh page says nothing, on a new profile and on Nick's.

## BG2 — the Beginnings, Seen · **owner: chat 5** · item 73

**Authority:** SV19, SV20. Chat 5 built BG1; the shapes are its own.

**S1 — the grammar, revised in one place.** `BeginningsRow` changes
once and both surfaces inherit: **icons ABOVE labels** (currently
inline), the whole door ~**50% larger** in icon size, label size and
hit target, and the at-rest colour a **dark olive that carries against
cream** — Nick's word is "much too small" and "can barely see." The
lane law is unchanged: dark olive at rest, brass on hover, orange only
on press.

**S2 — the page's row is centered on the sheet** (SV19), reading as a
set of modes rather than a footnote under the caret. This supersedes
the committee's "furniture beside the cursor" placement by Nick's own
word — the doors should look like what they are. **Unchanged:** the
caret stays live from the first frame, typing dismisses the row, and
the row never gates writing. The DoD check that a writer can type
immediately without touching the row must still pass.

**S3 — the board's row keeps its placement** (already right) and takes
S1's sizing and colour.

**Harness:** the geometry checks re-point to the new sizes; contrast
asserted as a computed value against the paper token, not eyeballed;
the type-immediately check re-proven at the new placement; the
1366×768 leg for both rows.

**DoD:** Nick sees three doors and knows instantly they are choices.

## FX17 — the Board's Floor · **owner: chat 6** · item 74

**Authority:** SV21, SV22, SV23. FX13 gave the board its height law;
this finishes it.

**S1 — the stutter, root-caused before any patch (SV22).** Reproduce a
card dragged to the bottom edge under trusted pointer and NAME the
mechanism: an auto-scroll-at-edge fighting a fixed canvas height, a
clamp re-running per pointer event, or a re-render loop. The E1 S1
discipline binds — the commit names the root, then fixes there. This
is a freeze, not a cosmetic fault; it is the ticket's first weight.

**S2 — the board reaches its floor (SV21).** The canvas extends to
near the viewport bottom with a deliberate border, rather than
stopping short. FX13's law is unchanged and governs: chrome fits the
room, content scrolls within its wrap, and the 1366×768 leg is
asserted.

**S3 — the board grows, then stops (SV22).** As a dragged card
approaches the floor, the canvas extends downward — to a stated limit,
then a hard stop with no stutter and no rubber-banding. Name the limit
in the code and in the ledger.

**S4 — fit to content (SV23).** A control that zooms out far enough to
show every card at once. **Scope note:** this is the minimal reading of
Nick's ask — "as far out as needed to see the entire board" is
fit-to-content, not a general zoom UI. A zoom slider is a feature and
waits for post-vacation. If S4 threatens the freeze, ship S1–S3 and
report; the stutter is what must not survive.

**DoD:** a card can be dragged anywhere on a board that reaches its
floor, and the whole board can be seen at once.

## FX18 — the Chrome Aligned · **owner: chat 1, after FX16** · item 75

**Authority:** SV24, SV25, SV26, SV27, and the screenplay's instance
of SV26 from Nick's in-app note.

**S1 — the arrow mirrors (SV25).** The right-hand drawer handle points
right; the left points left. One glyph, every surface that mounts a
drawer — grep them all; Nick found it on two surfaces and there are
likely more.

**S2 — panels do not overlap each other or the page (SV24, SV26).**
Two concrete faults: the Board's Tutor panel overruns the app edge and
covers its own close arrow; an opened right-hand panel overlaps an
opened left-hand toolbar and blocks controls under it (the Typewriter
toggle named; the screenplay surface shows the same fault against the
page). Root-cause once — this is one layout law failing in several
places, not several bugs — and fix it so that any combination of
panels open, on any surface, at every asserted width, leaves both
panels wholly in the room and every control reachable. **Harness: the
combinatorial case is the point** — both panels open, on Page, Board
and Script, at 1100 / 1366×768 / 2200, with no overlap and every
control hit-testable.

**S3 — the Board's top menu parallels the Page's (SV27).** ALL CAPS,
right-aligned, matching the Page's mode strip. The words and their
behaviour are unchanged; only the presentation aligns. Falsified
harness assertions take A4 parks with successors.

**DoD:** no panel covers another, no arrow lies about its direction,
and the two top menus look like siblings.

## Routed to the SC lane (item 62)

SV28 confirms Nick's eye on the rhythm already built at `1a759c4` —
merge-time evidence, not a new ticket. SV29 is ruled and needs no
change. SV30 is charged to the lane as a verification: measure the
scene-heading and action left offsets against SC1's declared
constants, report, and if correct, close it with SV28. The screenplay
surface also inherits FX18's S1 and S2 fixes.

## Standing invariants for all four

Guard-rail before every commit; ledger on `main` only, fetch
immediately before and push in the same breath; own worktree per
ticket; item numbers assigned, never claimed; process cleanup scoped
to PIDs the session spawned, never by name; both `HARNESS_PARKED`
settings; the 1366×768 leg for any geometry touched; A4 parks with
verbatim originals and named successors in the same commit as the
change that falsified them; trusted pointer for gesture claims; a red
gets a mechanism check first, then batch-then-batch-again, never
isolation as the first move; the only known flake is `tu2`; if `j5`
reds, report and do not re-run; full suite read to completion in the
main loop; `tsc` ×2; `build:web`; report = push.

— Fable, from Nick's walk of the shipped house
