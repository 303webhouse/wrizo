# FX10 — the Room's Edges · Fable's post-merge review · 2026-07-23

**Ticket:** FX10 (item 52), P0. Merged `a3f8b41`, deployed in the
mega-deploy (`b936f67`).
**Method:** house depth — merge census via stats (7 files, 1007+/124−),
`full_patch` line-by-line on `DeskFrame.tsx`, `Tutor.tsx`,
`useChromeDissolve.ts`, `fx10.mjs` (all 646 lines), `tu2.mjs`, `cd2.mjs`.
`index.css` verified via the harness's live computed-style asserts rather
than a raw read — the stronger proof. The post-review correction commit
(`82d8917`, the `data-open` discovery) confirmed present in the merged
tree — unlike E1, FX10's post-review fix demonstrably landed, which also
confirms the E1 finding is an anomaly of that ticket, not a misread of
merge mechanics.

## Verdict: GREEN WITH ADVISORIES. This is the strongest fix-arc work of the deploy. Close pends Nick's device verdict (drawer feel, vanish, hover-restore under his real hand).

## VERIFIED — the three risk centers the handoff named

**1 · One vanishing engine — held.** The strip's exemption was a
deliberate omission (the old comment said so outright), not a broken
subscription; the fix is exactly that omission closed: the strip now
carries the same `chrome-fade desk-dissolve` pair every dissolving track
carries, riding the one `useChromeDissolve` engine — same first-keystroke
trigger, same reduced-motion branch, no second implementation. The
cascade's layers 2–3 keep their deliberately different keydown-reset
mechanism, untouched and correctly distinguished: that is a different
concern (immediate reset), not a rival ambient engine. The harness proves
the class pair structurally at all three widths and proves `.desk-rail`
never mounts framed — the element Nick saw was the strip, root-caused,
not guessed.

**2 · The trusted-pointer hover proof — genuine and structural.** The S3
section never calls mouseDown/mouseUp/click anywhere — the absence of a
click path is structural, not merely asserted. A real CDP trusted-pointer
trajectory walks in from outside and dwells; restoration proven on TWO
independent surface families (sliver and strip) to make good on the
"fixed at the source, every surface inherits it" claim; a negative
control proves casual page hover does not summon. The engine fix itself
is root-caused at the source with two genuinely subtle defects run to
ground: a dissolved surface is `pointer-events:none` and can never fire
its own hover (so the fix tests coordinates against rects, which
pointer-events cannot hide); a zero-size check alone fails (the closed
sliver keeps a static nonzero rect); an opacity check alone fails (the
ambient two-class-plus-attribute rule out-specifies the closed rule, so
closed and open-but-faded settle at the same `--fade-min`). The only
honest signal is the component's local `data-open` toggle — and that is
what ships.

**3 · The A4 chains vs TU2's parked checks — proper.** All six falsified
width checks ("EXACTLY 2x --strip-width", page + board, three widths)
parked in `tu2.mjs` quoted verbatim with the superseding authority named
(Fable's corrected `clamp(320px, 34vw, 460px)` ruling — a spec error, not
a build defect, on the record) and live successors in `fx10.mjs`'s S1.
`cd2.mjs`'s overturned "never dissolving" strip law parked the same way,
with a live probe asserting current reality and a careful, correct
distinction of which sibling check survives (the 150ms-opacity-read vs
the discrete pointer-events flip). Fully compliant with the immutability
law and its codicil.

## VERIFIED — the rest

Zero server files, zero schema. Geometry at the 1100 floor + 1280 + 2200
on BOTH page and board: grip flush closed and open, paper rect
byte-identical closed→open and across the dock invocation (below-floor
fallback disclosed), open width against the ruled clamp read live. Motion
read LIVE off both panels and asserted EQUAL — duration, easing, and the
opacity+transform property shape, with the reference constant itself
asserted unmoved. Reduced-motion honored with an honest numeric tolerance
(Chromium serializes `transition:none` as ~1e-05s — caught, documented).
No-scroll-within-scroll proven by a full descendant computed-overflow
walk over a rich fixture with a vacuity guard; the panel is the one
scroll region; bubbles unclamped. Conversation renders ahead of the
lenses (the S1 center-of-gravity ruling) — the relocation is verbatim
JSX, no logic drift, ghostwriter rail untouched. A13's structural walk
and A15's dock rider/Escape ladder re-verified live rather than assumed
unaffected by reordering. S4's scrollbar flush proven by rect gap, and
the text measure proven by structural equivalence (scroll content-box ==
page content-box, the pre-fix construction guarantee) — not a magic
pixel.

## ADVISORIES — non-blocking

1. **Canonize the `data-open` contract — it is now load-bearing
   engine-wide.** Any chrome surface that can be structurally closed
   while keeping a nonzero rect MUST carry `data-open`, or must collapse
   to 0×0 when closed; a future surface that repeats the sliver's
   static-rect pattern without it silently resurrects the bug the engine
   just closed over. One line into the app-bones canon; CC records it
   with the next records commit.
2. **S4 runs at 1100 + 1280 only** — the 2200 leg is absent from the
   flush/measure asserts (disclosed in the file's own header, no false
   claim). Add it in a hardening pass (FX11 or the deflake sweep).
3. **Keyboard claims ride the synthetic-dispatch precedent** (Escape via
   `dispatchEvent`, disclosed, consistent with tu1). The trusted-proof
   law targets pointer gestures, so this is lawful — but if a keyboard
   behavior ever becomes a shipping gate, upgrade it to trusted CDP key
   events.
4. **tu2's six parks are record-only** (`pok(name, true)`) with the live
   instrument living in the successor rather than a probe on the park —
   a lawful and arguably cleaner shape (it avoids the probe-update
   question entirely); noted so practice stays deliberate, not drifting.
5. The independent review's **three cosmetic defects** remain open on
   item 52 — Nick's sitting may confirm or dismiss them.

## Close condition

Nick's device verdict on the drawer (motion, width, feel), the strip's
vanish on first keystroke, and hover-restore under his own hand — sitting
agenda item three. The `data-open` canon line recorded. Then item 52
closes.

— Fable
