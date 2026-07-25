# FX13 — the Board in the Room · Fable's post-merge review · 2026-07-25

**Ticket:** FX13 (item 63), P0. Built by chat 3, hardened pre-emptively
against the review flag, merged `ba70279` at the verified tip
(`acbabbe`) by chat 1; deploy held for the P0 word.
**Method:** the entire merge read — both files, 201+/1−, zero schema,
zero server files, including all 156 lines of `fx13.mjs`.

## Verdict: GREEN. The root was named before the patch, the fix measures the room instead of guessing at it, and the law now remembers screens have height. Close pends Nick's sitting (his 17" laptop is the original witness).

## VERIFIED

**The root, then the fix.** The board's geometry law was width-only —
canvas height a function of `pageWidthPx`, the fit resting on a magic
`78vh` clamp that ignored the flex stage's actual room. The fix is the
stage's measured truth: a ResizeObserver on the STAGE (never the wrap
— the stage's height is fixed by the flex column, so the wrap cannot
feed back), a >1px commit guard making a loop impossible by
construction rather than by damping, rAF-debounced with its cancel in
a cleanup that also disconnects and drops the listener, a 160px
never-collapse floor, and the legacy <1100 path byte-identical via the
preserved `78vh` fallback (stage absent → `null` → the old style).
Every claim from the pre-emptive hardening note verified in the code
as written.

**The constitutional leg, proven twice.** `fx13.mjs` adds 1366×768:
chrome wholly in-room (mode strip, telos, door, tab), the wrap filling
the stage without overflow, Add-card one visible click growing the
board by exactly one, no page-scale overflow — and then proves the fix
BELOW the floor at 1366×640, the exact geometry where the old clamp
measurably overflowed by ~31px. FX11's drag re-proven under trusted
pointer at the leg; the button-vs-gesture calibration note applies the
J6 distinction correctly. Parks nothing — correct: new coverage
falsifies no prior assertion, and the legacy fallback keeps that
path's checks true.

## CANON — the height law, codified (incorporating the SC1 cross-arc ruling)

**At the height floor (1366×768), every surface's chrome, tools, and
frame are reachable within the viewport; surface CONTENT scrolls
within its wrap; and fixed-truth content — a US-Letter page, a board's
constellation — never shrinks to fit the furniture.** Scrolling is for
content, never for finding a surface's own chrome. Surfaces adopt the
leg as they are next touched.

## ADVISORIES — non-blocking

1. Internal reflow ABOVE the wrap (chrome gaining variable height
   without a stage or window resize) is unobserved — theoretical
   today, since the chrome above is fixed-height; if that ever
   changes, observe the wrap's own offset too.
2. Nick's sitting is the close: the original witness machine, the
   board fitting its room, one click to a card.

— Fable
