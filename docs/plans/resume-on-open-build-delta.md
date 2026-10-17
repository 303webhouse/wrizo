# resume-on-open: build delta (against the approved plan @ dbb4dc24 and Fable's three rulings)

**Branch:** `resume-on-open` (off `main` @ 73906480). **Author:** INK.

## Built as ruled
- Ruling 1: no last place, or it was deleted/Trashed, opens a fresh blank Page, the Write door's own entry (`unbornHref({ origin: 'loose' })` plus the first-run forced defaults), saved only once a word is typed. Nick 12:53pm: it is **Free Write**; a loose-origin unborn page has no stored mode, so `PageEditor` opens it in Free Write (`origin === 'loose'`), and `resume-on-open.mjs` asserts the active tab reads "Free Write" on both blank landings (E1, E8).
- Ruling 2: `wz.lastPlace` is seeded once from `getResumeTarget()` when no record exists for the account.
- Ruling 3: the Open door is untouched (`Arrival.tsx` is byte-identical).
- Tone read: nothing in `Splash.tsx` (P1 pins it: it names neither `lastPlace` nor `LandingGate`).

## Where the build departs from the plan (for review)
1. **The plan's harness census was wrong on its central claim, and this is the correction.** The plan said nearly every harness boots anonymous, so the gate never fires for them. It does the opposite: `runtime-verify.mjs`'s server double answers `/auth/me` with a test user, so **every harness boot is a signed-in cold boot at `#/`** (`WS_ANON=1` is the exception). Left alone, the landing would carry ~120 front-door harnesses (121 `goto('/')`, 122 waiting on `.wz-arrival`) off the door. Fix, harness-side only: the double serves `index.html` with `window.__wrizoNoLanding = true` unless `WS_LANDING=1`, which only `resume-on-open.mjs` sets. It is served in the HTML itself, so the very first document is covered and a harness `localStorage.clear()` cannot undo it. `LandingGate` reads that flag; nothing in the product sets it. Open for Fable: harnesses run against a live site (`WS_TARGET_URL`) get no such switch and will land.
2. **"Decided: none" is a third record state** (`id: null`), written when a stale pointer is found. Mutant 3 shows the U6 check stays green without that write: a stale pointer left in place still resolves to blank, so the write only makes the record say so (semantically equivalent in that scenario, noted in the harness).
3. **The recorder reads `location.hash` each render rather than `useLocation`.** An unborn page is born by a silent `history.replaceState`, which the router never sees; the address is the only thing that always tells the truth.
4. **The blank-page entry is a copy of `Arrival.writeDoor`'s, not an extraction**, so `Arrival.tsx` stays byte-identical (four harnesses source-pin it). P6 pins that both carry the same three lines.

## Proof
- `scripts/harness/resume-on-open.mjs`: PART 1 browserless **32/32** (11 data-side checks, 8 mutants all landed and killed, 8 source pins). PART 2 (12 scenarios E1 to E12 on the real app: cold boot to a Page and to a board, seeded once, deleted gives the blank Free Write Page and is not re-seeded, deep link wins, once per load, Trash board never remembered, another account's pointer ignored, signed out here and anonymous unchanged) is **written but not run; it needs Chat 1's box grant**.
- Browserless siblings green: `arrival-signin` 103, `logout-flush` 39, `b101` 73, `seed-guard` 36, `hooks-order` 2, `hooks-order-ast` 7; `tsc` clean; `build:web` ok.

## Not built
Nothing server-side, no sync, no migration. No change to `Splash.tsx`, the Open door, or any surface.
