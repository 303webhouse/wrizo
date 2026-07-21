# FX8 — Card Affordances · build brief · 2026-07-21

**Authored by CC, not Fable** — Nick's own direct request, 2026-07-21,
relayed while FX7's own review file was still pending. Same standing
authorization as FX7 (Nick came directly to CC on UI/interaction
fixes this session; no Fable brief required for small, self-contained
interaction/visual fixes).

**Branch:** fx8-card-affordances off main. Zero schema — this is CSS
plus cursor/interaction polish only. Merge pre-authorized as
zero-schema, matching the standing rule. **Deploy is NOT
pre-authorized** — same default as FX7, waits for Nick's own word.

**Context CC has already confirmed by reading the code (do not
re-derive from scratch, but DO verify live before trusting it):** the
"move a card by dragging from anywhere on its body" mechanism already
works — FX5 S4(a)'s pointer-capture-on-pointerdown fix and FX7's own
S5-S8 fixes made this solid. `BoardEditor.tsx`'s `onDown` already
selects a box and stashes it as a drag candidate on ANY pointerdown
inside `.board-box` (outside the pin/handle/layer-toggle), promoted
to a real drag past a 6px threshold in `onMove`. **What's missing is
purely the visual cursor affordance** — nothing selects/drags
anything new; this ticket does not touch that state machine except
possibly to read its current phase for a `cursor:grabbing` swap.

## S1 — the olive pin, dimensional
Nick's words: "the green pins on the cards don't really look like
pins against the shadowed cards since they are just a simple outlined
circle. Can we make the pins look a bit more like the top of a green
sphere instead of a 2D circle?"
`.board-pin-grab` (`index.css`) is currently a flat 12x12px circle:
`background:var(--accent-rest); border:1px solid var(--ink-950);`.
Give it real dimensionality — a radial-gradient fill (a lighter
highlight offset toward the upper-left, darkening toward the rim) plus
a small box-shadow (a soft dark shadow beneath/around it, the way a
raised sphere would cast one against the card's own shadowed
surface) — while staying recognizably the SAME olive/`--accent-rest`
hue family, the SAME ~12px size, and the SAME one-and-only recorded
circular exception to this app's own square-corners law (do not
touch that law itself). Verify visually (a real screenshot, not just
computed-style assertions) that it reads as domed, not flat. The
`grabbing` state (`.board-canvas[data-thread-armed='true']
.board-pin-grab`) should keep working, adjusted to fit the new look
if needed.

## S2 — the resize handle: smaller, borderless, cursor reconsidered
Nick's words: "we need to shrink the size of the orange square and
simplify the cursor when it hovers over the square. Also, remove the
border from the square so it is just an orange box."
`.board-handle` (`index.css`) is currently 14x14px,
`background:var(--brass); border:1px solid var(--ink-950);
cursor:nwse-resize;`, rendered only when a card is selected. (1)
Shrink it — a meaningfully smaller footprint, your own reasonable
judgment on the exact size, disclosed. (2) Remove the border entirely
— solid brass fill, no outline. (3) Investigate the CURRENT live
cursor behavior when hovering it (there may be nothing actually wrong
with plain `nwse-resize` — or there may be a real inconsistency this
brief's own vague wording is reacting to). Report exactly what you
found and what you changed, if anything — do not silently leave this
sub-point unaddressed AND do not silently invent a problem that isn't
there.

## S3 — a real move-cursor affordance on card hover
Nick's words: "it needs to be easier/more intuitive about how the
user can move cards around. Whenever the cursor is over the bounds of
a box (unless over the pin or orange square), the cursor should
change showing that the user can now move the card around with one
click. Double-clicking opens the card."
Pure CSS, per the context note above — the drag mechanism itself
already works. Add a `grab`-family cursor on hover over a card's own
body (`.board-text`, `.board-pin`, `.board-ported`, and any other
card-face class this file's own card-kind branches use), EXCLUDING
`.board-pin-grab` (already `cursor:grab`/`grabbing`, its own state
meaning), `.board-handle` (resize), and `.board-layer-toggle` (its
own action cursor) — normal CSS specificity/descendant-exclusion
should handle this cleanly since those are the more specific,
already-cursor-styled elements; verify live that hovering the pin/
handle/toggle still shows THEIR OWN cursor, not the new card-body one.
Consider (your own call, disclosed) whether a `cursor:grabbing` swap
during an actual active drag is worth adding given the state machine
already tracks drag phase, or whether a static `grab` throughout
reads fine — either is acceptable, just say which you chose and why.
Confirm double-click still opens the card (do not regress FX7's own
S5 fix) and single-click-then-drag still moves it, live, with
genuinely trusted events.

## S4 — harness (fx8.mjs)
Live checks for: the pin's own new visual treatment (a computed-style
or screenshot-based proof it's no longer a flat single-color circle —
your own reasonable technique); the handle's new size/border-absence
(computed style); the card-body cursor being `grab`-family on hover
over the card face specifically, and NOT over the pin/handle/layer-
toggle (each showing its own distinct cursor); drag-still-works and
double-click-still-opens, both with genuinely trusted events (this
project's own established discipline — do not regress into synthetic
dispatch for claims this sensitive, given FX7's own recent history in
this exact file). Park anything superseded per A4. Full suite green,
both HARNESS_PARKED settings — RUN THE FULL HISTORIC SUITE yourself
before calling this done, not just your own new file (FX7's own
review found real gaps this exact discipline would have caught
earlier).

## Invariants
Zero schema. Square corners everywhere except the pin's own recorded
exception (unchanged by S1 — the pin stays the one circle, just a
more dimensional one). Olive/orange lanes untouched in meaning
(pin=state, handle/toggle=action). deskLexicon untouched (no new
user-facing strings expected; flag if one turns out to be needed).
Legacy <1100 chrome byte-identical (board editing is a framed-only
surface already; confirm this ticket doesn't touch anything legacy
reaches). One checkout per agent. Commit incrementally per slice.
Report = push (merge only — no deploy).

## Definition of done
Nick, after redeploy: looks at a card's own pin and sees a small
domed olive sphere, not a flat ring; sees a smaller, borderless
orange resize square with a cursor that makes sense; hovers anywhere
on a card's own body and sees a clear "you can drag this" cursor,
drags it with one continuous motion, and double-clicks to open it —
all without the pin or resize handle's own distinct cursors ever
being stolen by the new card-body affordance.

— CC, from Nick's direct UI feedback, 2026-07-21
