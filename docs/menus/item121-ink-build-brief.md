# ITEM 121 · THE INK WAVE — BUILD BRIEF
### menus lane · drafted 2026-09-06 · authority: R15 (Nick: "B is approved"), the analog law verbatim on the ledger
### worktree `.claude/ink` · branch `ink-build` off `origin/main` **after the post-walk stamp** — not before
### normative spec: `item83-ink-pass.md` + `item83-mock-ink-b.html` (A is superseded, on the record only)

---

## §0 · STANDING RULES
Commit = push, to `origin ink-build` only — never `main`, never force, never
another worktree. **S0 FIRST**: nothing is patched until the survey is
committed. Disk wins over this brief. Anchor law is build law: the ink
stratum is a *child of the paper*, anchored by layout, never by script; every
self-check compares two independently rendered boxes. Plateau register:
olive rests, brass is evental press; every new string enters the lexicon.
`prefers-reduced-motion` respected. **A NEW COLUMN IS A SCHEMA STOP** — if
any ticket wants one, stop and surface; this brief authorizes no migration.
**The analog law governs every chrome decision:** Free Write is a typewriter
for text and a journal page/sketch pad for drawing — no digital styling, no
fonts, no formatting on that surface. What the analog page cannot do, the
chrome does not offer.

## §S0 · THE SURVEY — from disk, before any patch
Report, with file and line, from `main` at the branch point:
1. **The J-series inventory as it stands today**: `JournalEntry.tsx`'s ink
   layer (capture-phase listeners, pen-only gate, I0 slice-2 hardening,
   selection suppression, `paintCommitted`, undo, the eraser and its ring)
   and `store/ink.ts` (`renderStroke`, `renderThumbnail`, `inkColor`,
   `INK_LINE_WIDTH`, `ERASER_WIDTH`). Name what has changed since the pass
   read them on 2026-09-06.
2. **Where strokes live.** `types.ts`'s `Stroke`; how `entry.strokes`
   reaches the server and the database — a real column (`entries.strokes`?
   which type?), or a key inside an existing JSON field. **Does every page
   kind carry it, or journal entries only?** This decides ticket I1:
   - an existing field on every entry → I1 changes its *shape* only;
   - a field only journal entries carry, or no field at all → **STOP AND
     SURFACE.** A column is a schema stop; the wave holds for Nick's word.
3. **The Free Write paper's container** at `main`: which element is the
   paper column the menus wave anchored the Tools dock to (`right:100%`
   child) — the stratum mounts inside that same column.
4. **The band**: its component, its fixed height, and what already sits in
   it (crumb, mode strip) — the switch must fit without the band growing.
5. **The menus wave's STYLING zone** on Free Write (M4's B·I·U) — the exact
   mount to retire in I6.
6. **The suite's S-Pen and pointer coverage today** — any I0 slice-2 tests
   that exist, and the CDP path the harness uses for pointer events
   (`Input.dispatchMouseEvent` carries `pointerType: 'pen'`;
   `Input.dispatchTouchEvent` for finger).
Commit: `Ink: S0 — survey (J-series inventory, stroke storage locus, paper
container, band, STYLING mount, pointer harness)`

## §I1 · THE STROKE SHAPE — per-stroke tip · nib · ink, read-side defaults
Only if S0 §2 found an existing field on every entry. Extend `Stroke`:
`{ points, eraser?, tip?: 'pen'|'pencil'|'marker', nib?: 'fine'|'regular'|'broad',
ink?: <theme ink token name> }`. **Store the ink as the token's NAME**
(`walnut`, `iron`, `oxblood`, `sea`), never a hex — themes re-colour their
inks; a stored hex would freeze one theme's palette into the page. **No data
migration:** an absent field reads as `pen · regular · the theme's default
ink` — every existing Journal stroke keeps rendering exactly as it does
today. Server validation accepts the three new optional fields and rejects
values outside their enums. **Accept:** an old entry round-trips unchanged;
a new stroke round-trips with all three fields; validation refuses a bad
enum. **Commit:** `Ink: I1 — per-stroke tip/nib/ink (read-side defaults;
ink stored by token name)`

## §I2 · THE STRATUM — the J-series ported to the paper column
Mount a `<canvas>` as a child of the Free Write **paper column** (S0 §3),
`position:absolute; inset:0` — the canvas fills the paper by layout. Port
whole: DPR-synced backing store, `paintCommitted`, **strokes normalized by
the paper column's rendered width** (denormalize on both axes at paint — a
circle stays a circle), persistence to the stroke field merged with live
text so a pending typed run is never clobbered, the unified one-level undo,
the eraser (`destination-out` at `ERASER_WIDTH`) and its ring preview. The
sheet-anchoring tradeoff ports knowingly: text reflows, ink stays where it
was drawn; document this in the component's header comment in J9's words.
**In TEXT the canvas is `pointer-events:none` — inert, never intercepting.
In INK it intercepts everything on the paper.** Thumbnails: reuse
`renderThumbnail` wherever pages preview. **Accept:** a stroke drawn at
1366 re-renders at 1680 with the same normalized geometry (the harness
measures it, I7); TEXT-mode keystrokes and clicks pass through to the
editor untouched. **Commit:** `Ink: I2 — the stratum (J-series port into
the paper column; inert in TEXT, sovereign in INK)`

## §I3 · THE SWITCH IN THE BAND — a mode of the page
A two-state engraved control **TEXT | INK** beside the location line in the
band (R15; mockup B's dress: engraved uppercase, the active side wearing the
olive hairline, evental brass on press). It is **page state, not a tool**:
- **Default on open: TEXT** — a page is a typewriter until the writer picks
  up the pen (session-scoped, like J2's pen re-arm; not persisted — one word
  reverses).
- **In INK:** the caret goes dormant (visibly — the typewriter is put down),
  keystrokes do not type, the stratum wakes, the eraser ring appears where
  the device reports hover. **In TEXT:** the reverse; the stratum is inert.
- **The pointer contract is decided by the instrument, not the device:** in
  INK any pointer draws — pen first, and mouse/trackpad on the laptop; on a
  tablet with a pen present, finger scrolls and palm is rejected by the
  ported capture pipeline. In TEXT no pointer inks.
- **The band does not grow.** The switch fits the band's existing height at
  1366×768; if it cannot, the crumb text truncates before the band
  changes — paper never reflows for chrome.
**Accept:** band height identical before/after mount at both widths
(measured); the switch's active state and the paper's `data-instrument`
agree after every flip; the caret is dormant in INK. **Commit:** `Ink: I3 —
the TEXT|INK switch in the band (page state; caret sleeps; pointer contract
by instrument)`

## §I4 · THE DRAWER'S INK OPTIONS
In the Free Write Tools drawer, one zone, **revealed only in INK** (in place,
G4; **nothing rendered in TEXT — the typewriter has no nibs; absent, not
grayed**): **TIP** — pen · pencil · marker as inline-SVG icons (R8), radio;
**NIB** — Fine · Regular · Broad, radio, **stops not a slider**; **INK** —
the theme's four swatches read from its ink tokens, radio, no picker;
**ERASER** — the Journal's toggle, tip-agnostic **as built** (the pencil-only
binding is an open word; do not build it). Choices persist per page as the
"current pen" (last-used), and stamp every new stroke per I1. Group heads
engraved olive; chosen state = olive hairline; press = brass. All labels via
the lexicon. **Accept:** the zone is absent from the DOM in TEXT; every
choice stamps the next stroke's fields; the eraser ring tracks hover.
**Commit:** `Ink: I4 — the ink options zone (TIP · NIB · INK · eraser;
INK-only; stops not sliders)`

## §I5 · TIP RENDER PROFILES — inside the isolation J9 promised
In `ink.ts` only: `renderStroke()` reads the stroke's tip/nib/ink and
paints accordingly — **pen**: round cap, uniform width; **pencil**: lighter
alpha, slightly narrower, a subtle grain if cheap; **marker**: broad, square
cap, translucent, `multiply`-style overlap where two marker strokes cross.
Nib widths as three constants per tip. **Pressure is not stored and not
read** in this wave (a later slice). The eraser ignores tip and nib. Nothing
outside `ink.ts` learns how a tip looks. **Accept:** the three tips are
visibly distinct in the harness's shots; an old stroke (no fields) renders
byte-identically to `main`'s render. **Commit:** `Ink: I5 — tip render
profiles in ink.ts (pen · pencil · marker; pressure deferred)`

## §I6 · RETIRE STYLING FROM FREE WRITE
Remove M4's STYLING zone (B·I·U) from Free Write **only** — Draft keeps
its own (R4). Absence, not a hidden mount; dead CSS and orphaned lexicon
keys swept; `__u__` handling stays for Draft. **Accept:** grep shows no
STYLING mount on the Free Write desk; Draft's is untouched; the menus
wave's tests that asserted Free Write B·I·U get the park treatment
(originals verbatim, successor pointer). **Commit:** `Ink: I6 — STYLING
retired from Free Write (R15/G3); Draft untouched; parks lawful`

## §I7 · HARNESS OBLIGATIONS — the stratum and the S-Pen
New suite legs, CDP-driven, both reference widths:
- **Stratum geometry (anchor law):** canvas rect equals paper rect
  (`left/right/top/bottom` within 0.6px) at 1366 and 1680, drawer open and
  closed — two independently rendered boxes.
- **Normalization invariance:** dispatch a circle of pen points at 1366;
  switch to 1680; sample the canvas — the stroke's bounding box scales by
  exactly the width ratio on both axes.
- **Inertness:** in TEXT, a synthesized pen stroke over the paper produces
  no stroke and does not move the caret's text; a keystroke types.
- **Sovereignty:** in INK, a keystroke does not type; a synthesized pen
  stroke persists (reload → stroke present with tip/nib/ink fields).
- **The device matrix:** `Input.dispatchMouseEvent` with
  `pointerType:'pen'` (draws in INK), `pointerType:'mouse'` (draws in INK on
  the laptop path), `Input.dispatchTouchEvent` finger (does NOT draw when a
  pen is present in the session; scrolls) — three legs, each asserting the
  stroke count before/after.
- **S-Pen hardening:** the I0 slice-2 behaviours as legs — `touch-action:
  none` on the stratum in INK; selection not started by a short pen stroke
  over text; the OS handwriting path never receives the pen (the capture-
  phase intercept fires first — assert the listener order or the resulting
  no-text outcome).
- **Eraser:** a synthesized erase over a stroke removes pixels (sample
  alpha before/after); the ring appears on hover in INK only.
- **Undo:** one-level across a typed run and a stroke, in either order.
- **The band:** height unchanged at both widths with the switch mounted.
- **Shots:** prose page in TEXT and INK at both widths, with the options
  zone open and the three tips drawn once each.
Real-device sitting on Nick's tablet is still the gate the harness cannot
replace; name it in the offer. **Commit:** `Ink: I7 — harness: stratum
geometry, normalization, inertness/sovereignty, device matrix, S-Pen
hardening, eraser, undo, band`

## §I8 · PROOF AND OFFER
Full stamped suite both settings — clean, or every red named as a known
species and parked lawfully. Probe with I7's legs. A committed offer record
+ ledger entry: the offered SHA; each ticket's commit; both suite runs
verbatim; **what was surfaced, not built** (any storage STOP; anything the
band could not hold); what stays deferred by Nick's word (the eraser's tip
binding; the FACE question with the theme arc; the S-Pen barrel-button
flip; pressure); and the **real-device sitting** named as the remaining
gate. Offer to Chat 1; hold. Nick's merge word and deploy word are separate
and his alone.
**Commit:** `Ink: the wave offered — suite, probe, surfaced seams, deferred
list, sitting owed`
