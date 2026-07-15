# J2/W1 S25 fixes — banked device rulings (build brief)

**Branch:** `j2-s25-fixes` · off current `main` · CC-parallel lane — no
Fable gate, runnable in any idle moment. Authorized by the S25 verdicts of
record in `docs/wrizo-alpha/app-bones-canon.md`.
**Place at:** `docs/wrizo-alpha/j2-s25-fixes-brief.md`.

## Why

Nick's 2026-07-14 device pass ruled five specifics on the ink surface
before the session was superseded by the App Bones pivot. These are cheap,
already-decided, and independent of the AB-arc — bank them so verdicts
given are never verdicts lost.

## Scope

- **S1 — eraser width 22px → 11px.** The ruled number. Keep the ring;
  adjust its radius to match.
- **S2 — simplify the pencil cursor graphic.** The current one is too
  detailed at size; reduce to the house's quiet line vocabulary (solid
  stroke, square-cornered family, no interior detail).
- **S3 — tool indicator shows the TARGET tool.** While inking, the toggle
  affordance shows the eraser icon; while erasing, the pen icon — tap to
  switch. *Recorded interpretation* of Nick's "I should see an eraser icon
  when I'm in ink mode… vice versa"; if he meant show-current, this is a
  one-line swap — flag at review, don't re-litigate mid-build.
- **S4 — S-Pen barrel button toggles ink ↔ eraser.** Probe first: log
  `pointerdown`/`pointermove` `button`/`buttons` values from the S-Pen
  barrel on real hardware (Chromium typically reports barrel as
  `button === 5` / `buttons & 32`, but reporting varies — the probe log is
  the source of truth, committed as a comment). Then wire the toggle.
  Guard: the button must not fire the toggle mid-stroke — toggle on
  button-press with no active stroke, or at stroke end if pressed during.
- **S5 — the ink room rule:** the incentive row (progress bar + typewriter
  toggle) fades out while a stylus pointer is active on the surface and
  fades back in on keyboard input. Reuse the chrome-fade vocabulary
  (`--fade-dur` family); do not invent a new fade system. Must not regress
  `w1.mjs` — the incentive row's presence checks run under keyboard
  conditions; add the stylus-hides/keyboard-restores pair where the harness
  can simulate pointerType (if pen simulation is unavailable in the
  harness, mark the pair device-gated in the report, per the
  harness-invisible class).

## Non-goals

Anything else from the abandoned session sheet (superseded per the canon's
Q3). Any AB-arc surface. Any change to eraser *behavior* beyond width.

## Invariants

Zero schema. No new deps. `j2`-adjacent surfaces only; the full suite
(`j4/j5/s1/w1/w2/m1`) re-runs green. Harness additions committed alongside
per the harness law. Report = push; Fable (or successor) reviews; merge on
Nick's word. Device gate: S4's button behavior needs one two-minute Nick
check with the pen — fold it into his first natural app touch, not a
scheduled sitting.

— Fable
