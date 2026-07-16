# FX1 — the First Sitting · build brief · 2026-07-16

**Branch:** `fx1-first-sitting` off `main`.
**Place this file at:** `docs/wrizo-alpha/fx1-first-sitting-brief.md`.
**Why:** Nick's first device sitting on the AB3 deploy returned verdicts.
Six are fixes to things already built — this ticket. The structural and
canonical items (tool sliver, panel architecture, mode-strip placement,
wide composition, the glow/goal system) go to a committee pass and a
separate brief; none of them are in scope here.
**Zero schema. Zero new deps.** Merge is pre-authorized per the
zero-schema rule (the corrected one — see ledger item 23's R5 note);
Fable reviews post-merge, gating close and deploy.

---

## S1 — the typewriter feel (no pop, fade at the top, start centered)

Nick's words: the page must not jerk upward when a new line starts.
Lines drop down like normal; the top of the written text fades; writing
begins near the middle of the stage so the fade engages early and the
page "centers the writer's focus on what they are writing instead of
endless revising what was written before."

- **No per-line pop.** Whatever currently repositions the page/scroll on
  line commit goes. When scrolling is needed (the writing zone's lower
  bound is reached), it moves smoothly and by no more than one
  line-height per line entered — never a multi-line jump.
- **The fade band.** In typewriter mode only: the topmost ~3 line-heights
  of written text fade progressively toward the paper's top (opacity
  ramp; oldest visible line faintest). Not a hard clip — a fade.
- **Start position.** A fresh page's first line begins near the vertical
  center of the stage (working value: top of the text block ≈ 45% of
  stage height; tune by eye against the fade band).
- Applies to prose AND script pages in typewriter mode. Off-mode
  behavior untouched.

```
Working values (tune, don't treasure): fade band = 3 × line-height,
opacity ramp 1.0 → ~0.15 linear toward the top edge; start offset 45%
of .desk-frame-stage height; scroll easing ≤ 200ms per line, or
continuous. prefers-reduced-motion: no animated easing, but fade band
and start offset still apply (they're static).
```

## S2 — the screenplay paper obeys Law 1

The script page currently renders a collapsed, wrong-dimension box with
misaligned text (Nick's screenshot). The paper's measure is the one
inviolable constant.

- The script page mounts the SAME paper geometry as prose (same class /
  width band the geometry harness already asserts for prose; the script
  content block lives inside it).
- Courier convention alignment inside: scene headings and action
  left-aligned at the script margin; the existing S-arc margin rules
  apply — nothing centered that shouldn't be.
- **Typewriter defaults ON for script pages**, matching prose. Confirm
  prose actually defaults ON while here; if it doesn't, make it so —
  Nick's words: "as with a prose page."

## S3 — the forward lock returns to the posture (provisional canon note)

Nick's verdict from the sitting: the deletion restraint belongs to Free
Write the posture, not the Journal the place. On his loose page it had
lawfully vanished with the journal furniture — reinstate it as **mode
furniture**:

- The forward-lock control mounts on EVERY page's Free Write rail
  regardless of origin (loose, project, journal, null). Only the forward
  lock moves — **ink and capture items stay journal furniture,
  unchanged.**
- Verify the strike/erase MECHANIC itself engages per the persisted
  setting on loose- and project-origin pages (not just the control's
  presence — if the behavior was gated anywhere along with the rail
  content, ungate it).
- It remains its own persisted toggle (`wrizo-forward-lock`), fully
  independent of typewriter. No coupling.
- **Harness law (A4):** ab2.mjs's live project-origin check and ab3.1's
  R1(a) loose check both assert the forward lock ABSENT — those clauses
  are now superseded by this design change. Park them per A4
  (quoted-history + opposite-reassertion, SUPERSEDED species, in their
  own files' PARKED sections) and re-assert presence in the live checks.
  Ink/capture absence assertions stay live and untouched.
- **Canon note (provisional):** record in this brief's ledger entry that
  Law 2's furniture list is amended in practice — forward lock is mode
  furniture pending Nick's feel-test and the committee pass's formal
  amendment. Do not edit the canon doc itself this ticket.

## S4 — square corners

Nick's ruling as creative director: square over rounded, everywhere.

- Plateau's radius tokens (`--radius-sm` and kin) → `0`. Sweep any
  hardcoded `border-radius` values in components this app renders on
  Plateau.
- Theme foundations docs are NOT edited this ticket (the working values
  change; the foundations note rides the committee pass).

## S5 — the dead bar dies

The empty full-width bar along the stage's bottom ("very wide across the
bottom of the screen despite serving no real purpose yet" — Nick) stops
rendering its shell when it has no content. Identify the host (likely
the sprint-nav / publish-bar container rendering background while
empty) and render nothing instead of an empty vessel.

- **Named non-goal:** the right-hand track (the 260px corkboard column)
  is NOT touched this ticket even where it renders empty — its fate is
  the composition committee's, and trimming it now would churn the
  geometry twice. Leave it.

## S6 — the orange-at-rest sweep (the F3 species, again)

From Nick's own screenshot: the Structure picker's active state
(`.desk-toolrail-structure-btn.active`) wears solid brass at rest, and
the rail's eyebrow labels (READING / STRUCTURE / CAPTURE) plus the
Typewriter glyph sit orange at rest. Olive marks where you are; orange
marks what you do.

- Active structure button: the lawful active treatment (the F3 / mode-tab
  pattern — `--accent-rest` accent, not a brass fill).
- Eyebrow labels and resting glyphs: quiet (`--text-mid` /
  `--text-low`), no brass at rest. Brass stays for genuinely evental
  states only (the starred star, press states).
- Sweep BOTH the desktop rules and any narrow-layout media-query
  duplicates (the ab2.1 F3 lesson).

## S7 — harness (`fx1.mjs`)

New file, house pattern, plus the S3 parks in ab2/ab3. Minimum asserts:

- S1: fresh prose page, typewriter on — first caret rect top within
  40–55% of stage height; type enough lines to cross the band — caret Y
  monotonically descends for the early lines (no locked caret); once
  scrolling engages, per-line scroll delta ≤ 1.25 × line-height; first
  rendered line's computed opacity < 0.5 (fade active). Same fixture
  once on a script page.
- S2: script paper rect matches the prose paper's asserted width band;
  a scene heading's computed text-align is left; fresh script page has
  typewriter on by default (and fresh prose page too).
- S3: loose fixture in Free Write — forward-lock control present; click
  it (the R2 pattern: `dataset.on` flips + `wrizo-forward-lock` writes);
  with lock ON, type + backspace → `.fo-struck` appears (the mechanic,
  not just the control). Project-origin fixture — control present. Ink
  and capture items still ABSENT on both (unchanged law).
- S4: computed border-radius `0px` on a drawer pull, a place-face verb,
  and the Add-to sheet.
- S5: the bottom bar's host absent (or zero-height, background-free)
  when empty on a fresh framed page.
- S6: computed background of the active structure button ≠
  `rgb(255, 152, 0)`; eyebrow label computed color ≠ brass. (Negative
  asserts while olive is a working value — A3's standing graduation
  applies.)
- Full suite green, both HARNESS_PARKED settings.

## Non-goals (the committee's table, not this ticket)

The page-adjacent tool sliver and panel architecture; the far-left rail
revision; the mode strip's move to the top line; wide-monitor
composition and the right track; the glow / progress / goal system
(rides the committee pass with Ruling 5's slice); any canon-doc edits;
AB4/AB5 content.

## Invariants

Legacy below the 1100px gate stays byte-identical (S1's typewriter
changes apply wherever typewriter mode runs today — but framed
composition, gate behavior, and legacy chrome are untouched). Geometry
floors keep passing. Every new string rides `deskLexicon`. Report =
push; one commit per slice or sensible grouping; ledger entry on
completion recording the S3 provisional canon note and the device-look
verdicts this ticket answers.

## Definition of done

Nick, on the live deploy (redeploy on his word after Fable's post-merge
review): types in typewriter mode and the page never pops; the top lines
fade; writing starts centered. Opens a screenplay and gets the same
paper, correctly margined, typewriter already on. Toggles the forward
lock on his loose CHAPTER 1I page and feels the restraint again. Sees
square corners and a quiet, olive-lawful rail. The dead bar is gone.

— Fable, for Nick's first sitting, 2026-07-16
