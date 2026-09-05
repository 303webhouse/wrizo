# ITEM 112-A · S0 — WHAT THE DISK SAYS
### Lane `item112a`, worktree `.claude/worktrees/item112a`, branch `item112a` off origin/main `89c5955`

**Brief held:** `docs/menus/tutor/item112a-build-brief.md`, blob `75e81367`, **md5 `9619b2a6`**
— the AMENDED tip (2579cba, Nick's empty-drawer ruling folded). Verified against the BLOB,
not the working file: a CRLF checkout gives the working copy md5 `415742bf`; the LF blob is
the byte of record and it matches the identity the brief itself names.

**Sequencing gate — DISCHARGED.** The brief queues 112-A behind the Draft-roster build.
That build shipped: git `7b78090`, railway `815091f6`. Nothing blocks.

---

## §2's S0 CHECK — MODE PERSISTENCE: **PER PAGE**, in `localStorage`

`apps/desktop/src/pages/PageEditor.tsx`

- Key: `wrizo-mode-page-<id>` — one entry per page id, so it is **per page**, not per
  session and not global. It survives reload and survives navigating away and back.
- Written in `switchMode` (:297), on every switch, unconditionally.
- Read once at mount inside the `useState` initializer, **behind a validity allowlist**:
  `if (saved === 'journal' || saved === 'drafting') return saved;`
- Default when nothing valid is stored: `journal` for a manuscript chapter or an
  `origin === 'loose'` page, else `drafting`.

**What Revise must therefore do, and the one line that matters.** The allowlist is the whole
mechanism. A stored `revise` that is not named there falls through to the DEFAULT — so
Revise would silently forget itself on reload while Draft remembered. Adding `revise` to
that allowlist is not a new persistence rule; it is Revise being admitted to the rule that
already exists. **No new key, no new default, no new lifetime.**

`QuickSprint.tsx` carries its own separate key (`wrizo-mode-<draftId>`) for its own separate
surface. Untouched by this ticket — see the stop-and-surface below.

---

## §3's S0 CHECK — THE EDITOR PATH, AND WHAT IT SETTLES

**Revise renders through `ForwardOnlyEditor`, on its FREE-EDIT branch — the same branch
Draft renders through.** It is one component with two internally-selected instruments, and
the name on the file is the name of only one of them:

| | `journal` (Free Write) | `drafting` (Draft) — and now `revise` |
|---|---|---|
| model | the DM1 `Run[]` model (`contentRef`/`wordRef`) | the browser's own contenteditable |
| backspace | strikes down a runway, then locks | really deletes |
| caret | manually re-anchored to the end after every render | browser-owned (early return) |
| DOM | `.fo-run` / `.fo-struck` / `.fo-word` spans | decorated markdown, no run spans |
| native listeners | the runway handlers | the free-edit handlers + undo stack |

**So "the forward-only instrument does not mount in Revise" is satisfied structurally, not
by configuration.** On the free-edit branch the runway's listeners are never attached, the
caret effect returns at its first line, `insertMarkerRef` is set to `null`, and no run span
is ever rendered. Nothing is disabled and nothing is configured off — the instrument is
simply not the one this branch builds. `forwardLock` is journal-only and is never read here.

### THE ANSWER THE PARKED LENS NEEDS — recorded per §3, and it is YES

**Revise's rendered text runs through `decorateEditorFor`, on every keystroke, and that
function already carries the decorator override the flag decorator will use.**

- `ForwardOnlyEditor.tsx`'s free-edit branch calls
  `decorateEditorFor(el, plain, caret, setPlainOffset)` from its native `input` listener —
  every keystroke, and again on mount to seed the surface.
- `store/draftDecoration.ts`'s `decorateEditorFor` takes a **fifth parameter**,
  `decorate: (text: string) => string = decorateMarkdown`. That is the seam. It exists and
  is already load-bearing: `BoardCardPopup.tsx` passes
  `text => decorateMarkdownForCard(text, caret)` through it today (FX5 S6).
- Therefore the lens's flag decorator needs **no new routing and no new call site** — it
  needs an argument: `decorateEditorFor(el, plain, caret, setPlainOffset, flagDecorator)`.

**The two constraints that ride with that seam — the lens's price of entry:**

1. **Character count must stay 1:1.** `decorateEditorFor` restores a PLAIN-TEXT caret offset
   after rewriting `innerHTML`; that offset is only still valid because decoration adds
   `<span>` wrapping and never a character. A decorator that inserts a glyph breaks the
   caret, not merely the count. This is independent corroboration of the CSS-only flag law
   the lens was already argued under — it was always the only law this seam permits.
2. **Never `display:none` or `visibility:hidden` a marker.** `readEditorPlainText` reads the
   surface back through `innerText`, which is defined against RENDERED text; a hidden
   character silently vanishes from what gets STORED on the very next keystroke.
   `draftDecoration.ts` records this as a measured defect, not a hypothesis, and uses
   `font-size: 0` (`.md-mark-hidden`) instead.

`entry.text` stays plain text throughout: the free-edit branch reads the live DOM through
`readEditorPlainText` (which strips the transient EOF sentinel) and reports that string.
This ticket persists no mark of any kind.

---

## WHAT ELSE THE DISK SAID — findings that shaped the build

**1. Both hands are already mode-independent; they come along for free.** `Sliver` (the Desk
hand) and `Tutor` (the Counsel hand) are mounted by `PageEditor`'s framed branch as
`DeskFrame` props, and neither mounting decision reads `mode` at all. Revise becoming a live
mode of that branch inherits both hands, their paper anchoring, the coexistence law and the
announce-from-effect invariant **without a line of new geometry code**. This is why §4's
ruling costs almost nothing to honour: the mirror was already built; Revise had merely never
been allowed into the room.

**2. The Desk hand's CONTENTS would have leaked Draft's furniture — the one real hazard this
survey found.** `PageEditor`'s `sliverContent` is a two-branch ternary:
`mode === 'journal' ? {kind:'freewrite'} : {kind:'draft'}`. Revise falls down the `else`.
Untouched, Revise's Desk drawer would have opened onto **Draft's Structure control and
Draft's format rail** — and `applyRailFormat` guards on `mode !== 'drafting'` and returns,
so those controls would have rendered **live-looking and inert**: a locked door wearing
paint, exactly what G3 forbids and what §6 names as tenant leakage. Revise takes
`{ kind: 'empty' }`, which `SliverToolsBody` already answers with `return null`. The drawer
still OPENS and still carries the sliver's own standing furniture (the goal block, the
instruments row) — it is empty of TENANTS, which is what 112-C fills.

**3. `RAILS` is a total record and would have crashed below the gate.** `ModeStage.tsx`'s
`const RAILS: Record<EditorMode, RailDef>` is indexed unguarded at `:315` and read at `:454`
**inside** the framed path (`rail.tools === 'pen' ? ... : undefined`). A missing `revise`
entry is a `TypeError` on first render, not a cosmetic gap. Revise gets a real entry.

**4. The typewriter already excludes Revise, by its own reasoning, with no edit.**
`typewriterOn = (mode === 'journal' || mode === 'drafting') && settings.typewriter`, and the
comment above it names why: the hold engages in writing postures and "never in
convention/delivery, **revision-shaped work the hold would fight**." Revise is that work by
definition. The expression excludes `revise` already. Left exactly as it stands — the law was
written for this case before this case existed.

**5. A source comment in `Tutor.tsx` goes false the moment `EditorMode` widens.** `:382`
reads: *"Revise cannot reach here at all — `EditorMode` has no 'revise' member ... so the
brief's 'cannot render in Revise' holds by the TYPE, not by a branch."* After this ticket the
CONCLUSION still holds — Revise renders no roster — but the REASON moves from the type to the
branch (`const drafting = mode === 'drafting'`). Corrected in place: it is a source comment
describing live mechanics, not a harness assertion, so nothing is parked.

---

## THE ONE STOP-AND-SURFACE — §2's own, raised and not resolved

`ModeSwitcher.tsx` is the strip on the unframed (<1100px) Page. Its `MODES` list names
`journal`, `drafting`, `formatting` — **no `revise` key at all** — and it carries the word
`revise` only as **Draft's sub-label**: `{ key: 'drafting', label: 'Draft', sub: 'revise' }`.

**What the build did.** Revise joins that strip as a live tab, but **behind an opt-in prop**
(`reviseEnabled`, default `false`) that only `PageEditor` passes. This is the idiom
`ModeStrip` already uses for exactly this job (`freeWriteEnabled`, which lets `ScriptEditor`
keep Draft as its only live posture while still showing every string). The effect: the two
sides AGREE on the Page — the surface this ticket owns — while `QuickSprint` and
`ScriptEditor`, which share these components and are named nowhere in this charter, stay
byte-identical.

Without it, a page whose per-page mode persisted as `revise` and then loaded below 1100px
would render a strip with **no tab selected at all** — the persistence rule this ticket
honours would have produced a state the strip could not express.

**What the build did NOT do, and hands to Nick.** Draft's `sub: 'revise'` is **untouched**.
Removing it changes what Draft's own strip reads, which the brief names a stop-and-surface:

> With Revise a real mode, the unframed strip now reads **"Draft / revise"** beside
> **"Revise / dress"**. Draft's sub-label was written when *revise* was a stage of Draft
> rather than a room of its own. Whether it now reads as stale, or as still true (Draft does
> revise lines), is a founder call, not a builder's. Revise's own sub-label is **`dress`**,
> taken from the charter's organizing sentence — *"Free Write produces, Draft marks, Revise
> dresses"* — not invented here.

Also raised, smaller: below 1100px Revise has no hands and no geometry floor — but neither
does Draft, and §2 says make Revise behave exactly as Draft does. The non-inventing answer
was to let it be live there on the same terms. If the desk would rather Revise be a
framed-only posture, that is one prop away and no other line moves.

— the 112-A build lane
