# FX13 — the Board in the Room · P0 fix brief · 2026-07-24

**Place at:** `docs/wrizo-alpha/fx13-board-in-the-room-brief.md`.
**Owner: chat 3** (hold DF1 at a clean commit point — P0 outranks the
deflake; resume DF1 after). Branch `fx13-board-in-the-room`, own
worktree; guard-rail; ledger on `main`. **ZERO SCHEMA, ZERO SERVER
FILES.** Zero-schema pre-authorization; Fable reviews post-merge;
deploys batch with the P0 wave.
**Authority:** SV2, ratified — the Board rendered beyond a 17" laptop
viewport and the tool bar was unreachable: the sitting's first
blocker.

## S1 — root cause FIRST

Reproduce at a 1366×768-class viewport and NAME the mechanism before
any patch: is the board canvas sized to content, to a fixed minimum, to
the paper metaphor's dimensions, or overflowing its frame — and why do
the tools fail to mount or fall off-screen. The E1 S1 discipline: the
commit names the root, then fixes at it. No clamping symptoms.

## S2 — the board fits the room

At every viewport ≥ the floors, the board canvas fits: the mode bar,
telos line, the tool affordances, and the ground all reachable without
hidden overflow; scrolling is for the board's CONTENT (a big
constellation of cards), never for finding the board's own chrome.
Cards and chrome scale per existing law; nothing occludes.

## S3 — the height floor joins the geometry law (constitutional)

The sitting proved the width-only floor was half a law. Amendment,
ratified with SV2: **geometry assertions run at a height floor of 768
— the canonical small-laptop leg is 1366×768** — joining 1100/1280/
2200 for every surface's future geometry work. This ticket adds the
leg to the BOARD's harness coverage (fx13.mjs or extensions): board
chrome + tools reachable at 1366×768, plus re-proving FX11's board
gesture checks at the new leg. Other surfaces adopt the leg as they're
next touched (recorded as standing law, not a retrofit sweep — the
retrofit rides the deflake/hardening lane).

## Harness

The new leg's reachability asserts (chrome within viewport, tools
mounted and clickable under trusted pointer at 1366×768); any
falsified sizing checks get A4 parks with successors. Both settings;
grep-first.

## Definition of done

Nick opens a board on the 17" laptop and everything the board owns is
in the room with him — bar, telos, tools, ground — and adding a card
takes one visible click. The law now remembers that screens have
height.

— Fable, from SV2, for chat 3
