# HB2-lite — the Landing · scout map + Fable's ruling (build reference)

**Status:** research folded to disk per Nick's instruction (a scout that vanishes is
budget spent twice). Every claim below was CONFIRMED against source by chat 1's own
read (scout output is research, not authorization — [[scout-output-is-research-not-authorization]]).
Where the scout and disk could disagree, disk wins.

## The ruling (Fable, relayed by Nick, 2026-07-25) — DESTINATIONS ONLY

HB2-lite implements SV11 (where a writer ends up), NOT SV12b (which redesigns the
Arrival chooser itself — Resume rename, Workshop door, horizontal cream squares).
"You cannot redesign a chooser you're deleting." Auto-landing was declined: it would
revoke a threshold Nick just asked to be rebuilt. **HB2-lite makes the doors lead
right; HB2-full makes them look right.**

The four destination cases (all asserted in hb2.mjs, never assumed):
1. **Write** → a fresh page in Free Write, typewriter on, never a journal surface.
2. **Open + valid last surface** → that Page or Board.
3. **Open + no resume** → Free Write, typewriter on (the endorsed degradation).
4. **Open + stale legacy journal pointer** → the Page interface via FX14's redirect,
   NO journal chrome anywhere. (Nick's original V2 sighting — assert it.)
5. Plus the theme-key read (changes nothing visually).

**Out of scope → HB2-full (post-vacation):** the Resume rename, horizontal cream
squares, the Workshop door, the 1/3-screen card, the espresso ground + olive bar, and
"Drawers pre-opened" (belongs with the rename, not a door about to be renamed/moved).

## Verified source map

**Boot / initial route (App.tsx:257-290).** HashRouter; `/` → `<Arrival>` (App.tsx:268).
There is NO auto-boot navigation — Arrival is deliberately "both the boot screen and
the front door" (App.tsx:247-256, Nick's 2026-07-16 HomeFlow/Arrival ruling). The old
plain-text loading screen was retired in HB1. CONFIRMED.

**Arrival doors (components/Arrival.tsx).**
- `handleWrite` (43-64): `createLooseHomePage()` → `/page/:id`; forces `setForwardLock(true)`
  + `setWritingSettings({typewriter:true})` on FIRST RUN only (45-61); later Writes respect
  saved settings (hb1.mjs F4/D2 pins this — do NOT re-force on every Write).
- `handleOpen` (66-75): authed → `getResumeTarget()`; **line 70** `navigate(target ? target.route : '/journal', ...)`.
  **THE DEFECT:** no-resume falls back to `/journal` (the Journal Board). CONFIRMED.

**THE S1 CODE CHANGE (the only src change HB2-lite makes):** Arrival.tsx:70 —
no-resume fallback `/journal` → the same fresh-Free-Write path as Write (route through
handleWrite / a shared helper), so Open-with-no-resume lands in Free Write (typewriter
per Write's own first-run defaults), never the Journal Board.

**Resume semantics (store/resume.ts:104-133).** `getResumeTarget` = one recency race
across all non-deleted projects + entries; newest wins. Every target route is
`/page/:id` or `/project/:id` — because `fromEntry` (52) routes via `routeForEntry`.
System boards excluded (125 `if (getSystemKind(e)) continue`). So resume can NEVER
resolve to a journal surface or a system board. CONFIRMED. `window.wrizoResume` seam
(136-138) reads the resolved target live.

**Never-a-journal-surface (structural).** `routeForEntry` → `/page/:id` for EVERY entry
(FX14 S2); `/journal/:id` is a permanent redirect via `JournalIdRedirect` (App.tsx:283).
So no boot/resume/stale-URL path can reach the retired JournalEntry surface. Case 4
tests this in the landing context.

**S2 theme read — ALREADY SATISFIED (assertion-only).** `main.tsx:31` calls
`initTheme()` BEFORE `render(<App/>)` (30-31: "apply the theme… before the first render
so there is never a themeless/wrong-voice flash"). Theme key is `wrizo-theme` (cd2.mjs:322
corroborates). data-theme is on `<html>` before first paint; Arrival inherits it via CSS.
**No code change for S2** — do NOT add a redundant second theme read/application. hb2.mjs
asserts: at boot, `document.documentElement data-theme === localStorage 'wrizo-theme'`,
and Arrival's markup is identical across theme keys (nothing visual changes).

## Harness (new hb2.mjs — NOT an extension of hb1.mjs; hb1's checks are frozen)

Copy hb1.mjs's `freshArrival` idiom (local const — copy, don't import). Observable seams:
- Free Write: `document.querySelector('.desk-mode-tab.active')?.textContent === 'Free Write'`.
- Typewriter on: `JSON.parse(localStorage.getItem('wrizo-writing-settings')||'{}').typewriter === true`
  AND `.mode-scroll` `data-typewriter === 'true'`.
- Resume target (pre-nav): `window.wrizoResume()` (route + home).
- Board vs Page surface: `.board-canvas` vs `.forward-only-editor`.
- Never journal: post-nav `!location.hash.startsWith('#/journal')` and `!document.querySelector('.entry-edit')`.
- Seed from Arrival/Desk, reload before navigate (the flush-race law).
- Emit `HB2 VERIFY: PASS (N checks)` + the HARNESS_PARKED parked block (empty — HB2-lite
  parks nothing of its own; the door fix falsifies no frozen assertion). Check hb1.mjs
  F2/S5's existing resume-landing check + b1.mjs S5(c) (which today asserts no-resume →
  Journal Board) — b1.mjs S5(c) will be FALSIFIED by the fallback fix and needs an A4 park.

## Resolved at build (2026-07-25)
- **b1.mjs S5(c)** was the ONLY falsified assertion. A4-parked verbatim (the outcome ok +
  its dead `.board-canvas` navigation removed; the "nothing to resume" precondition kept
  live) with successor hb2.mjs case 3, plus a CHAIN NOTE: the FX14 back-link park below
  named S5(c) as one of its two live successors — with S5(c) now parked, that claim holds
  via its surviving successor (fx14.mjs's universal redirect proof) + hb2.mjs. No other
  assertion falsified (confirmed by the full-suite verify, both settings).
- **theme.ts:** key confirmed `wrizo-theme` (theme.ts:14); read at boot via `initTheme()`
  (main.tsx:31) → `data-theme` on `<html>`; seam `window.wrizoTheme.get()`. S2 is
  assertion-only (no redundant read added).
- **The no-resume fallback** is implemented as `handleOpen` calling `handleWrite()` — Open
  with no resume behaves exactly like Write (Free Write + first-run typewriter/forward-lock
  + gate), never the Journal Board. hb2.mjs case 3 asserts Free Write + typewriter on.
