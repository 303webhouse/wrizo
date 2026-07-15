# TH1 — the theme seam · Fable review · 2026-07-13

**Branch:** `th1-theme-seam` @ `0dd92aa`, reviewed via the read pipe (full
patch, two paginated pulls). Branch is a strict descendant of current `main`
(`dfc7dc3`) — **fast-forwards cleanly**; the ship report's and ledger item
19's "off main @ 7f4bc6b" is loose phrasing, corrected in the ledger delta
below.
**Merge state:** NOT pre-authorized — merge on Nick's word after the fold
(contingent-word option below, the M1 rhythm).
**Place this file at:** `docs/th1-review-fable.md`.

## Verdict

**REQUIRED — 2** (one small-medium, one tiny), **3 advisories**, two
rulings. No data-loss-class findings; no architecture findings; zero-schema
confirmed at the file level (no server files in the diff). The standout is
Slice 0's construction: bare `:root` IS Plateau — no `[data-theme='plateau']`
override block exists, so Plateau's byte-equivalence to pre-TH1 main is
structural, not asserted; the harness's PRE_TH1 literal table and the full
prior suite then verify what the construction already guarantees. The
second-best decision was stopping at the plural rather than guessing — that
flag is answered as R1 below, which is exactly what flags are for. The seam
holds; TH2 plugs into it as data.

## Required

### R1 — the lexicon must carry grammatical number
The flagged gap is real and slightly broader than the flag: `CANONICAL`
conflates number per term (`page → 'Pages'`, plural, because the live toggle
site is plural; `drawer → 'Drawer'`, singular, while the only live site —
DeskRail — is plural "Drawers" and had to stay unswept). TH2 cannot ship on
this shape: Flux needs "Docs" on the toggle and "DOC 07" in page metadata
from the same term.
**Fix:** entries become `{ one: string; many: string }` per term ID.
Accessors: `t(term)` returns `one`; add `tMany(term)` (same fall-through
rules). Plateau values are today's exact literals on both forms — Pages
toggle renders `tMany('page')` = "Pages", DeskRail's Drawers item sweeps
through `tMany('drawer')` = "Drawers", JournalEntry's tab stays
`t('freewrite')` = "Free write". Byte-equivalence is preserved on every
surface; the DeskRail site-comment's "flagged for TH2" is retired.
**Harness (+4 checks in `th1.mjs`):** every term maps to non-empty `one` AND
`many`; DeskRail's Drawers label === `tMany('drawer')` and reads exactly
"Drawers"; the Pages toggle still reads exactly "Pages"; `tMany` falls
through to canonical on an unregistered theme.

### R2 — make the effects-registry comment true (export registration)
`ThemeEffectsLayer.tsx`'s header promises TH2 populates the registry
"without editing this component," but `FX_REGISTRY` is an unexported
module-local — as written, TH2 must edit this file. Load-bearing scaffold
comments are orientation surfaces in this house; they don't get to be
aspirational.
**Fix (4 lines):** export `registerThemeFx(id: ThemeId, handlers:
ThemeFxHandlers): void` that writes the registry; TH2's theme pack module
self-registers at module scope and `main.tsx` imports the pack. While in
the file: `store/theme.ts`'s `initTheme()` comment says "called once at app
boot (App.tsx)" — it's called from `main.tsx`; one-word truth-up.
**Harness (+1 check):** `registerThemeFx` exists and a registered stub
mounts/cleans up (register a no-op, assert the layer calls it, unregister
not required — TH1 keeps Plateau's entry absent).

## Advisories — record, don't change

- **A1 — Fade:off mid-dissolve.** Flipping `fade` to `off` while chrome is
  already dissolved leaves it hidden until the return timer or manual
  summon (`noteWrite` no-ops; nothing resurfaces on the pref change). No
  live path in TH1 — the pref has no UI yet. TH2's Settings toggle MUST
  resurface immediately on `fade → off` (one effect on the pref value).
  Carried to TH2 Slice 1.
- **A2 — prefs load validation.** `themePrefs.load()` spreads a parsed
  Partial over defaults without validating enum values; a corrupted stored
  value flows onto `data-voice`/`data-page` as-is. Degrades safely today
  (no selector matches, serif wins), but validate the three enums on load
  when TH2's Settings UI becomes a writer. Carried to TH2 Slice 0.
- **A3 — the genuine cross-theme switch is untestable in TH1.** Check 3's
  "theme switch" is necessarily a plateau→plateau re-apply (only registered
  theme) — honest in the code comment. `th2.mjs` must add the real
  flux↔plateau round trip: prefs survive, tokens swap, lexicon swaps,
  Plateau returns byte-equal. Carried to TH2's harness spec (extends its
  item 7).

## Rulings

1. **"Free write" is the canonical UI literal — ratified.** CC's handling
   was exactly right: match the shipped byte, flag the canon discrepancy,
   fix neither side unilaterally. Ruling: the canon table's "Free-write" is
   the concept name; the UI literal is "Free write". The canon gains the
   two-sentence note below rather than a table rewrite.
2. **The unswept-plural flag is answered by R1** — no residual TH2 debt on
   the sweep once R1 folds; every canon §5 term with a live UI site routes
   through the lexicon on Plateau.

## Canon amendment (append under §5's table, same fold commit)

> Lexicon entries carry grammatical number: each term ID maps to a
> `{ one, many }` pair, and both columns above name the display *family*
> (Flux registers Doc/Docs, Rack/Racks, and so on — regular English plurals
> unless a theme's table says otherwise). "Free-write" in the canonical
> column is the concept name; the shipped UI literal is "Free write"
> (no hyphen), and the lexicon carries the literal.

## Merge / close protocol (recommendation)

Both fixes are one-sitting. The M1 rhythm fits: Nick can give a
**contingent merge word** with the fold relay — CC folds R1 + R2 (+5
harness checks, `th1.mjs` → 26), appends the canon note, re-runs the full
suite + `th1.mjs` ×3, **fast-forward merges**, deploys (zero-schema —
liveness check only), pushes; Fable's delta spot-check runs post-merge,
fix-forward if anything surfaces. TH2 arms when that spot-check returns
green (ledger item 20's own wording). Or classic mode: fold, push,
spot-check, then the word.

**Ledger deltas (fold commit):** item 19 → DONE-at-merge (item-13 pattern),
including: branch-point errata ("off `dfc7dc3`", not 7f4bc6b), the R1/R2
fold summary, the "Free write" ruling, A1–A3 carried to their TH2 slices,
and `th1.mjs` 21 → 26. Item 20 (TH2): annotate "arms on Fable's post-merge
spot-check GREEN." No new hardware-gate cluster — TH1 is infrastructure
with nothing to feel; its only feel-claim (Plateau unchanged) is exactly
what the construction + suite already prove. TH2 carries the TH-arc's gate
items.

— Fable
