# W1: the Walk, board kinds and "Show as": build brief (Fable → INK, Oct 23, 2026)

**Nick APPROVED the design (2:20 pm).** The design source is `Downloads\board-kinds-final.zip`, which holds `html/` (open in a browser) and `png/`, 36 frames, Arbor dark + light and Flux dark + light. The swipe timing is in `png/walk-swipe.gif`. It supersedes every earlier board-kinds frame, including Cursor's. Mock data only in the zip; build to it.

**Your order (updated 6:30 pm, Nick chose the faster plan):**
1. W3 mechanics (placeholder questions, the "?"), per `w3-w4-build-brief.md`;
2. **W1 (this)**;
3. W5 (gaps + rewards), brief to follow.

**W4 (Help me choose) has moved to TOOLS** (`w4-help-me-choose-brief.md`). **W2 (Write this / Place a page…) is FIX's** (`w2-write-place-brief.md`). Leave the Walk's two W2 doors absent; FIX wires them after W1 merges. Keep `kindled()` and the deck registry stable: TOOLS and FIX both call them.

All of it branches from main after deploy #5 merges.

## The model (Nick's option C)
- **Two true kinds:** Board and Book.
  - A **Deck** is a Board whose home view is the Walk. It is born from a Preset, or the writer opens any Board "as Walk" once.
  - The **Journal is a Book**.
- **Saved data:** one optional additive field on board-meta, `kind: 'board' | 'book'`, plus `homeView` (e.g. `'open' | 'walk'`). No column. Ledger it as the systemKind precedent. It SYNCS, so the sync-completeness law applies: push and pull carry it, with a round-trip check. **This makes W1 a FULL PAIR.**
  - Existing boards need no migration: no field means a Board opening in Open. The Journal system board reports `kind: 'book'`.
- **The door chooses; never a picker:**
  - New Board → Board (Open);
  - a Preset (W3) → a Board with `homeView: 'walk'`;
  - New Journal → Book (Flip).
- **"Show as" replaces the three view tabs:** icons first, the word on hover; in the open state (frame 02-walk-showas-open) icons + words.
  - Board/Deck: Open · Storyboard · Outline · Walk.
  - Book: Flip · Thumbnails.
  - Flux words: Render: Live · Sequence · Spine · Trace; Log: Playback · Index.
  - "Last shown as" stays device-local, like today's view memory.
- **Adding follows the view shown:**
  - Open → a card at a position;
  - Storyboard / Outline / Walk → a card appended to the order (`seq`);
  - Book → a page in the sequence.
- **Thumbnails by kind** (frame 01): Board = wide; Deck = a short stack of three (brown with an olive edge, plus the fact "4 of 9"); Book = tall with an olive spine line. No kind words as subtitles.

## The Walk (frames 02, 02-writing, 06, 07, 10)
- **The card:**
  - one card, 700 px wide, min 360, grows with its text to max 520, then scrolls INSIDE (the thin standard scrollbar, a soft fade at the bottom);
  - a subtle **resize grip** bottom-right, with the size remembered per board on the device;
  - title (the card's title) + "?" (W3); the question placeholder (W3) or the writer's text;
  - writing in the card is ordinary card writing (the card is a surface; the board stays a container).
- **Previous / Next:**
  - small chevrons just ABOVE the card's top-left and top-right corners (inside the card's width, never near the side drawers);
  - at rest about 55% opacity; hover = brass (square hit box);
  - they **recede while the writer types** (the existing chrome recede) and return on pointer move or when the pointer leaves the card.
- **The swipe (Nick, 3:25 pm: no flash):** a pure slide. Both cards stay fully opaque (no cross-fade); the outgoing card slides out as the next slides in from the other side; a soft fade only at the window's edges (a mask). About 280 ms, smooth in-out. Matches `png/walk-swipe.gif` and `walk-swipe-demo.html`. Reduced motion = an instant cut.
- **Keyboard:** ← → step, Enter on the focused door, Esc → the board in its last shown view.
- **Doors under the card:** Notes (focuses the card) · Write this · Place a page…
  - Write this and Place a page… are W2: render them **only when W2 lands** (absent, not greyed).
- **The rail:**
  - one mark per card, in order;
  - empty = olive seed outline; kindled (`kindled()` from W3) = olive leaf; current = brass ring;
  - Lit (brass leaf) comes with W5;
  - "Start Here" folds into the first seed.
- **The gaps line in the header** ("Nothing yet: …") comes with W5. Leave it out of W1.
- **Small screens** (frame 07): below the DeskFrame width, the Walk is a Deck's only view: one card, swipe, the doors stacked, the next card peeking.

## The Journal as a Book (frames 04)
- **Flip:** one page at a time with the same top-corner chevrons and the same swipe. Reuse the J1 ← → walk.
- **Thumbnails:** a grid of tall pages; the current page in brass. Reuse the J3 spread where possible.
- Its pins are untouched.

## Dress rules (Nick, Oct 23, standing for new work)
- **Square edges on every box. No drop shadows** (flat 1 px edges only). Circles only for marks (the "?" badge, the rail's current ring).
- **Arbor colour rule:** brown/cream = surfaces and infrastructure; olive = options, guidance and books (questions, doors at rest, "?", deck thumbnails, the librarian); brass = human action only (current, chosen view, hover/press, Lit). Decorative lines are muted bronze, never brass.
  - Nick's allowed exception: the librarian's panel is OLIVE.
- **Arbor hints, never literal** (Nick): it suggests a desk or garden through nuance (type, tone, a pen-scratch rule), never by drawing a literal desk or wood surface.
- **Flux** (frame 02-trace): brackets, `TRK n/m`, the prompt line with the block caret, pixel ticks (hollow · lime · cyan with the thin orange LEFT bar for current), [NOTE] [BOOT DOC] [INPUT DOC] [?]; surfaces at hue 212.
- **Machina / Nomad / Volant:** a plain fallback until their builds.

## Checks (red first; mutants that land)
- **Kinds:**
  - the board-meta kind/homeView sync round-trip (push → pull on a second device);
  - no field = Board/Open;
  - the Journal = Book;
  - New Board / Preset / New Journal land in their home views with no picker.
- **Show as:** it switches views without losing positions or order (Open keeps x/y; the others read `seq`); "last shown as" is remembered per board on the device; adding follows the view.
- **Walk geometry:** the card at 700 wide; it grows to 520 then scrolls (the scroll container's thumb present); the page/stage never moves when the drawers open (the K-style check); the chevrons sit within the card's width and recede while typing; resize persists.
- **Motion:** the swipe ≤ 320 ms; reduced motion = no transition.
- **Keyboard:** ← → Esc Enter.
- **Dress:**
  - zero box-shadow blur on the new surfaces (the computed style has no blur radius);
  - border-radius 0 on the new boxes;
  - Arbor: no brass on rest-state options;
  - Flux: the current tick's orange left bar.
- **Lane:** the touched harnesses (grep the changed identifiers; state the count; park verbatim with successors), then the **FULL PAIR** (sync + board code).
- **Screens for my clear,** matching the zip's frames: 01, 02, 02-writing, 02-showas-open, 03 open/storyboard, 04 flip/thumbnails, 05, 07, 10; Arbor dark + light; the Flux Trace dark + light.
