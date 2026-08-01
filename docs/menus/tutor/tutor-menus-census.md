# ITEM 84 — the Tutor's Pop-Out Menus · Phase 1 CENSUS

**Desk:** the item-84 design desk (Fable-sibling), design-only under the Aug 1
freeze. **Read at:** `main` @ `3dc3d49` (2026-08-01); **re-verified before
landing at `origin/main` @ `3a5840a`** — the one-commit delta (chat 6's item-82
fix 1 + the COMMIT = PUSH elevation; 97 lines, `docs/open-threads.md` only)
touches neither the Tutor nor item 83, so every claim below survives it
unchanged. **Sources, all read this sitting:**
`apps/desktop/src/components/Tutor.tsx` (697 lines, whole),
`apps/desktop/src/store/deskLexicon.ts` (whole), `docs/wrizo-alpha/tutor-rules.md`,
`docs/wrizo-alpha/tu1-review-fable.md`, `tu2-review-fable.md`, `tu5-review-fable.md`,
`docs/wrizo-alpha/fx18-review-fable.md`, `docs/wrizo-alpha/ab2-tools-by-mode-brief.md`,
`docs/theme-foundations/plateau/plateau-foundations.md`, `docs/open-threads.md`
(live band + laws band). Every quoted string below is byte-verbatim from source.

---

## 0. The finding that frames the arc

**The Tutor is mode-blind today.** Not one branch in `Tutor.tsx` reads the
writing mode. The panel renders the same controls, the same sections, the same
promises whether the writer stands in Free Write, Draft, or Revise. The only
axis it varies on is **surface** — `pageKind` (`page` / `script` / `board`) —
which drives its anchor class (`desk-frame-tutor-anchor--${pageKind}`), the
Consistency lens's scope, and its FX18 geometry regime. Item 84 is therefore
not a reorganization of existing mode behavior; **it is the first mode-aware
layer the panel will ever carry.** Whatever the menus become, they are new
law, not renovated law.

The mode vocabulary itself is ratified and lives in `deskLexicon.ts`:
`modeFreeWrite: 'Free Write'` · `modeDraft: 'Draft'` · `modeRevise: 'Revise'`
· `modeWorkshop: 'Workshop'` · `modePublish: 'Publish'`. AB2 established the
per-mode instrument precedent on the *left* rail (Free Write's ink/typewriter/
forward-lock; Draft's Bold/Italic/Heading/Spacing/Structure; **Revise and
Workshop render the rail as desk ground — empty**). The Tutor is the paper's
right edge; item 84 brings the same per-mode discipline to it.

---

## 1. The panel's standing order (render census)

Top to bottom, as shipped (`Tutor.tsx` render; FX10 S1 ordering law — "the
exchange must read as the main event, the lenses as sections around it";
FX12's own comment — "the most at-rest thing sits deepest — lenses are verbs,
nudges [were] waiting"):

1. **The grip** — one button on the paper's right edge. `aria-label`/`title`:
   `'Open the Tutor'` / `'Close the Tutor'`. Carries **no badge, toast, count,
   or dot** — A14, "the room never knocks."
2. **The head** — `tutorTitle: 'The Tutor'` + the dock button
   (`'Close, keep dock'` / `'Reopen'`; dock affordance gated by
   `DOCK_FLOOR_PX = 120`).
3. **The Conversation** — `'Talk it through'`. Messages
   (`'Nothing said yet.'` when empty), composer (`placeholder:
   'Ask a question…'`), **Send** (`'Send'`; disabled empty or in-flight;
   single-flight `sending` gate; `'Thinking…'` while pending). Failure lines:
   `'The Tutor is offline or not configured right now — the lenses above
   still work.'` · `'The Tutor could not be reached. Try again in a moment.'`
4. **Consistency** (lens) — `'Consistency'`; empty:
   `'No repeated or near-duplicate names found yet.'`
5. **Structure** (lens) — `'Structure'`; dynamic home/membership facts
   composed in code from real page data (never lexicon). FX12 S2 retired its
   beats language (`tutorStructureNoBeat` gone with CD4's dormant beats).
6. **Fragments** (lens) — `'Fragments'`; note, verbatim promise:
   `'Recency and shared tags only — nothing else.'`; empty:
   `'Nothing recent or shared-tagged to resurface yet.'`; each item is a
   button that calls `navigate()` — **travel, never text insertion**.
7. **[Nudges — ASLEEP.]** FX12 S1: the `'Waiting for you'` section unrenders
   everywhere; `computeNudges` uncalled; engine (`tutorNudges.ts`) and its
   lexicon strings left dormant, untouched. **Return gate: ledger item 64 —
   nudges return only via content law, never by this arc's side door.**
8. **The book's Bible** (TU5) — `"The book's Bible"`; note:
   `'Facts you save travel with the book — the Tutor keeps them in mind.'`;
   empty: `'Nothing saved yet.'`; add input (`'Note a fact to remember…'`,
   `FACT_TEXT_CAP` = 300 chars/fact) + `'Add'`; per-fact `'Edit'` /
   `'Delete'` / `'Save'` / `'Cancel'`. Writer-authored only — the store's
   write functions are called from exactly these handlers; the send path
   reads and never writes; no parse-model-output path exists (TU5 review,
   "closed by architecture").
9. **The disclosure** — a real modal (`role="dialog"`, `aria-modal`), version-
   gated to appear **before the first ask, once** (`tutorDisclosure.ts`
   integer versioning; TU2 ruling 4). Title `'Before you ask'`, ack
   `'Got it'`. Current body = **v3, verbatim:** *"When you ask the Tutor,
   your question — and any new writing on this page since the Tutor last
   read it, and any facts you've saved in this book's Bible — travels to the
   language model provider configured for this app. Nothing is ever sent
   unless you ask. Your pages remain yours."* (v1 and v2 bodies retained in
   the lexicon as legible version history, by design.)
10. **The meter line** (TU2 S5) — one quiet foot-of-panel line after each
    completed model reply, `METER_VISIBLE_MS 3600` + `METER_FADE_MS 400`
    (~4s; reduced-motion holds then removes — a real scheduled removal).
    Labels: `'This turn, est.:'` · `'This session, est.:'` · fallback
    `'This turn (tokens only — no cost estimate for this model), est.:'` ·
    unit `'tokens'`. Never an invented dollar figure for an unknown model.

---

## 2. What fires, and what never fires (behavior census)

- **The one model call:** `send()`. `assembleTutorDelta` has exactly one call
  site — inside `send()` — "writer-initiated, send-time only (never a timer,
  never on mount)" (the file's own words). The Bible assembles the same way:
  "at send time only (never ambiently)." **Nothing sends on load. This is
  architecture, not policy** — the ratified disclosure law's mechanical
  truth, and FX15's deck-drawn precedent is the lawful local pattern for
  anything that even *prepares* content: drawn by the writer's act, never
  dealt on arrival.
- **The delta:** cursor read at send (TU2 ruling 2); client cap 16,000 chars
  (server backstop 17,000), tail-biased — keep the newest writing. Truncation
  is disclosed twice, deliberately in two registers: the model-facing
  plain-data header `'latest stretch only; earlier additions unread'`
  (not lexicon — the writer never sees it) and the writer-facing panel line
  `'Only your latest stretch of new writing was shared this time — earlier
  new writing since last time went unread.'` Cursor advances **only** on a
  successful reply — never on offline/error, never pre-emptively.
- **The Bible wire:** `{ messages, delta?, bible? }`; absent keys truly
  absent; whole facts only; client 8,000 / server 9,000; truncation header
  `'partial: some saved facts were not included this time'`.
- **Inert-to-the-page, structurally (A13):** the component receives only
  `entry` / `project` / `pageText` — "never an editor ref, never a page-text
  setter, never anything that could route a byte of Tutor output onto a
  writing surface." Grip/dock toggle local state; fragments navigate;
  composer talks only to `appendTutorMessage`/`apiTutorChat`. `tu1.mjs`
  asserts this structurally. **Any menu item 84 proposes inherits this wall.**
- **A12 — the two-sides law:** "this is the ONE surface in the whole app the
  writer goes to when they DON'T know what they need." The menus' whole
  reason to be mode-aware is to answer that state without overload.
- **Server conduct (the promise behind every control):**
  `docs/wrizo-alpha/tutor-rules.md` holds the shipped `SYSTEM_PROMPT`
  byte-for-byte. Its absolute rules, verbatim in part: "Speak ABOUT the
  writing, never AS it." · "Composition is never lawful: a sentence, a line
  of dialogue, a description, a paragraph, an outline written in prose —
  even one line, even 'just as an example.'" · "Reference atoms are lawful."
  **Any menu option that produces prose is dead on arrival, however
  elegant** — the seed restates what the prompt already enforces.

---

## 3. The only variation that exists today: per SURFACE

| | `page` (prose) | `script` | `board` |
|---|---|---|---|
| Anchor | `--page` | `--script` | `--board` |
| Consistency scope | binder siblings (project) or self alone (loose) | same as page | **pinned members only** — "a board is a curated grouping… pulling in the whole project binder would dilute that" (TU2 S4, disclosed reading); dead pins filtered, never crash |
| FX18 geometry | measured-margin regimes | half-measure companion (prevents an 8.5in mis-measure) | pure CSS rule (no fallback flash) |

Structure and Fragments take no multi-page scope on any surface (each
computes facts about `entry` itself, or scans app-wide by recency/tag).

---

## 4. Geometry the menus inherit — the FX18 three-regime law

Ratified at item 75 (`fx18-review-fable.md`; FX18 **supersedes** FX10 S1's
geometry assertion). The menus live inside this or obey it explicitly:

- The panel's inline width is set by `Tutor.tsx`'s **measure-effect** from the
  TRUE geometric margin — the +frame-gap overshoot ("the 28px dip") named and
  excluded. Natural open width ≈ 300px.
- `USABLE_PANEL_FLOOR_PX = 280` — below it an open panel **overlays the paper
  at natural open width** rather than shrinking to a useless sliver: "regime
  2's downward discontinuity at 280 is why CSS clamp could not express it."
- `DOCK_FLOOR_PX = 120` gates the dock affordance — a separate question from
  the overlay regime, kept separate.
- Board's rule stays pure CSS; screenplay carries the half-measure companion.
- `fx18.mjs` asserts regimes **by name from measured margins** — surface-
  dependent, never assumed. FX18 exercised script@1100/1366 and page@1100;
  the frame's own minimum is 1100px; the constitutional device floor is
  1366×768. **Mockups render at both reference widths per house law**, inside
  the panel's real dimensions per regime.
- Known OBS (non-blocking, on the record): a paper-scale change while the
  panel is open defers re-measure to the next resize/reopen.
- Presence is not composition: any new pop-out layer needs its rendered-
  geometry floor from day one, and paper never reflows for chrome.

---

## 5. Plateau material for phase 3 (locked tokens)

`--ground #110600` · `--panel #1b0d03` · `--line #3a2613` (1px, solid) ·
`--paper #f7efe1` · `--brass #FF9800` · `--olive #96a05a` via `--accent-rest`.
Figtree (the room's hand — UI) · Crimson Pro (the writer's voice — prose).
The usage law, Nick's word 2026-07-14: **"olive marks where you are; orange
marks what you do."** Two-regime orange in full force — resting orange holds
its four-site ceiling; anything the menus celebrate or press is evental lane
only. Interactive states: olive at rest / brass on hover / orange on press.

---

## 6. Open dependencies, held honestly

1. **The shared menu grammar (seed's item 83).** The ledger's last word,
   still standing at `3a5840a`: *"Item 83 was floated and withdrawn same-day
   — never opened."* `docs/menus/` is absent from the remote at `3a5840a`
   (this desk) and from all pushed history (build lane,
   `git log --all -- 'docs/menus/**'` empty). One newer sign, **local only**:
   the build lane observed an empty `item83-menus` branch stub in the studio
   checkout — tip `3a5840a`, zero commits, **not on the remote** (404,
   verified by this desk) — the first disk sign of an 83 lane standing up,
   with no record, no grammar, nothing published for this lane to inherit.
   **Divergence surfaced to Nick; never forked.** Phase 2's
   grammar-inheritance clause is HELD pending item 83's own S0 landing or
   Nick's word. Phase 1 (this census) has no dependency on it.
2. **Nick's sitting log** — not yet landed. No lock before it (phase 4).
3. **TU4's mechanics lens** — DEFERRED per the seed; no `tu4` records exist
   on disk. It does not resurrect through a menu slot absent Nick's word.
4. **Nudges** — asleep behind item 64's return gate (content law). A menu
   surface is not that gate.

— the item-84 desk, 2026-08-01
