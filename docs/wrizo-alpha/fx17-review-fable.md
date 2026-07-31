# FX17 — post-merge review (Fable) — item 74

Reviewed at merge c340876 (branch ef7429c; deployed c266cb3 · railway
dfa03148). Census: 3 files, +445/−2 — BoardEditor.tsx, index.css,
fx17.mjs (new). Zero schema, zero server, zero deps. Suite of record
52/52 both settings at ef7429c, PB1+FX17 tested together.

VERDICT: PASS. Item 74 GREEN + DEPLOYED + REVIEWED.

S1 (index.css, one declaration): scrollbar-gutter:stable removes the
feedback EDGE at its source; the 32-line comment is the complete
mechanism record — loop named end to end, measurement quoted (71
flips/142 frames), threshold-guard impossibility argued, FX13's
open axis closed, SC1 S4 cited as precedent, single-edge justified.

S2/S3 (BoardEditor.tsx, +86/−2): BOARD_MAX_Y=3 and BREATHING=0.08
named beside the board constants with unit reasoning (SV22's code
half; ledger half discharged in 389ec29). Floor spends availHeightPx
minus a NAMED 2px border term — not clientHeight, which a horizontal
scrollbar mutates (S1's shape on the other axis). Clamp verified:
delta-shared (group shape), floored at zero (a limit stops; it never
relocates — up and sideways free), x-axis per-box asymmetry recorded
as deliberate. Canvas height uncapped: clip-nothing outranks the
limit. Legacy path byte-identical when availHeightPx is null.

fx17.mjs (327, new): trusted pointer throughout; in-page rAF
sampling (no round-trip can hide an oscillation); asserts the FIX'S
MECHANISM directly (gutter reserved with nothing to scroll); the
group invariant tested AT the clamp (the lower card demonstrably
landed); the deep card's y byte-exact through a sideways drag that
demonstrably moved x. Constants hard-coded ON PURPOSE so moving the
limit reds this file — an instrument that notices. Parks nothing;
fx13 strengthened, not retired, re-proven green in the suite of
record.

ONE OBSERVATION (OBS-2, non-blocking): the stop governs the DRAG
gesture; a RESIZE can still carry a card's bottom past BOARD_MAX_Y,
where the never-relocates law then protects it. Gap or freedom —
item-78-neighborhood question, Nick's hardware, post-vacation.

— Fable, 2026-07-31
