# ITEM 207 (207a) — STEPS 1–3 BUILT: the roster, load-on-choose, the size ladder (tools lane; branch `item207-fonts`)
### Browserless proof green (32 checks, park count 0). No Type control yet (step 4), no rendered check (box turn).

**THE CHOICE, NAMED (Fable, 2026-09-24): literal printed points; `sizeAdjust` is a per-face field and every face is 1.** Nick's reason for the typed number is precision ("style guides with precise font styles/sizes"), so no face is normalised to another's x-height. The measured cost (S0 §3) stands: Arial and Lora read visibly larger than Crimson Pro at the same number, as they do in print. The seam is one number in the roster table.

## What is built
- **`store/fontSize.ts`** (pure): the lattice computed, never listed — 6..18 by 1, 20..30 by 2, 34..118 by 4; `stepUp` / `stepDown` (from any value, including a typed one), inert at both ends; `+` stops at 118, a typed size may reach 120, `−` from 119 or 120 lands on 118; `normalizeTypedSize` (nearest half point, clamped 6..120, `null` for a non-number so the caller keeps the previous value); `formatSize` ("10.5", never "10.50").
- **`store/fontRoster.ts`**: the nine faces as data. Times New Roman and Arial are `source: 'named'`, installed-first, with Tinos / Arimo in the stack as the metric-compatible fallback (neither proprietary font ships). `faceStack` resolves a stored face; an unknown face still renders in its own name then its **generic class** (a serif falls back to a serif; a hostile name is stripped of quotes and backslashes). `ensureFaceLoaded` is a memoised dynamic import of the face's CSS; a failed load is dropped so a later choose retries and never throws. `pageTypeStyle(face, size)` returns `{}` for an untouched page.
- **`types/index.ts`**: `PageSettings.face?` and `.size?` (absent-never-null, not in `PAGE_SETTINGS_FALLBACK`), `StoredFace`. **No schema:** `page_settings` is existing jsonb; `dressOnly()` needed no edit (it strips only `kind` / `styleGuide`).
- **`PageEditor.tsx`**: the editor's `fontFamily` / `fontSize` now read `typeStyle.fontFamily ?? 'var(--font-prose)'` and `typeStyle.fontSize ?? 'calc(17px * var(--paper-scale))'` — **the same two strings as before whenever the page never chose**. A page using a non-eager face fetches it when the page opens.
- **`css-modules.d.ts`**: one line so the dynamic CSS imports type-check. **Six dependencies**, all OFL-1.1 (the roster is the dependency list).

## Measured, not claimed
- **Startup bytes (built both ways, `origin/main` vs this branch):** the eager CSS is **144,711 bytes on both — byte-identical**; the entry JS grows **590,981 → 596,401 (+5,420 B)** for the roster table and its loader stubs. The six new families are six **separate** CSS chunks (18 lazy CSS chunks in all), none referenced from `index.html`.
- **Licence guard:** the build output holds **Tinos and Arimo files and no Times New Roman / Arial file**.
- **"11 = today":** an untouched page — and an explicit 11 — emits an empty style, so the editor's font size is byte-for-byte the prior rule. 12 renders `17px × 12/11 × --paper-scale` (proved as the generated string; the computed style is the box turn's).

## Falsification (7 mutants on the shipped source, each asserted to land, each red)
Ladder's two-point band dropped · `+` allowed to 120 · the default changed from 11 · a face given a non-1 `sizeAdjust` · the serif fallback turned into a sans · font-name sanitising removed · Times New Roman losing Tinos.

## Owed on the box (item207.mjs, steps 4–6)
The rendered re-measure (chars per line by face at 1100 / 1280 / 1920, checked against S0's table, Courier Prime reported separately) · computed style at 11 and at 12 · the loaded face actually applying · the Type control's per-surface control counts. **The census of every site that copies a `PageSettings` or rebuilds a `Box` rides step 5**, with the control that writes the keys.

## Unmeasured, named
The variable faces' weight axis: S0 read the default (Regular) instance's advances; the rendered re-measure confirms it. Italic and bold for the two variable serifs load from `wght-italic.css` and the `wght` axis; that a bold run renders in the chosen face's own bold is a rendered check, not one this file can make.
