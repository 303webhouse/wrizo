# resume-on-open: plan (no code until Fable clears it)

**Branch:** `resume-on-open-plan` (off `main` @ dfc6b695). **Author:** INK. **Ruling being planned (Nick):** after the splash, a signed-in writer lands on the last Page or board they had open, not the front door.
**Drift check (disk, not memory):** every fact below was read from this tree. File and line references are to `apps/desktop/src`.

## 0. What exists today (so the plan adds the least)
- Route `/` is `Arrival` (the front door: Write / Open / sign-in). The splash (`components/Splash.tsx`) is mounted at app root over the live app. `Arrival`'s **Open** door already resumes: `openWhenLoaded` waits for the first pull (capped, `FIRST_PULL_CAP_MS` = 3000), then `openAsAuthed` navigates to `getResumeTarget().route` with `state: { warmStart: true }`.
- `getResumeTarget()` (`store/resume.ts`) answers "most recently **edited**" (an `updatedAt` race; system boards excluded). Nick's ruling says "had **open**". Those differ (a page opened and read but not edited), so this plan adds an *opened* pointer and does not repurpose the edited race.
- There is no route named "Pages". See Q1.

## 1. What counts as "last place", and where it is saved
- **Last place = the last live, non-system Page or board that was mounted in `PageEditor`** (boards are `/page/:id` too, `routeForEntry`), plus the legacy `/project/:id` overview if that is where the writer was.
- **Saved per device in `localStorage`, key `wz.lastPlace`:** `{ v: 1, uid, kind: 'page' | 'project', id, at }`. No new column, no sync. It is not a collection, so `resetLocalData()` does not touch it and `flushNow()` re-serialization cannot erase it.
- `uid` = the signed-in account id when written. Landing ignores a pointer whose `uid` is not the current user, and sign-out clears it (`handleLogout`), so one account's pointer never steers another.
- **Written** on `PageEditor` mount and on a `:id` change, once the entry resolves to a live non-system row; never per keystroke. An unborn page (`/page/new`) writes when its row is born (first keystroke), never before. The Journal board and Trash board (`getSystemKind`) are never recorded: resuming into the Trash board on a cold open is the surprise `resume.ts` already guards against.
- All storage access wrapped in try/catch (house pattern from `signedOutHere.ts`): blocked storage means no pointer means the Pages surface, never a crash or a trap.
- New module `store/lastPlace.ts`: `recordLastPlace(...)`, `readLastPlace()`, `clearLastPlace()`, `resolveLanding(user)`. **Pure and storage-only; it imports nothing from Splash.**

## 2. When it fires (the gate)
Once per app load, only on a cold boot to the bare front-door route:
- hash is `#/` or empty (a deep link such as `#/page/x`, `#/guest`, or a Ctrl+R on a page is left exactly where it is);
- `authState === 'authed'` and `!isSignedOutHere()`;
- a module-level `landed` flag (same idea as Splash's `alreadyShown`), **set at the moment of the navigate**, so the many `<Navigate to="/" replace />` bail-outs (PageEditor on a missing entry, ProjectHome, etc.) cannot loop and the in-app "Home" links (`Drawers.tsx` "Home", `CreateProject` "Home", ProjectHome) still reach the front door afterwards. After the first landing, `/` is the front door again.
- Lives in a small `LandingGate` rendered by `App.tsx` beside `<Splash>`. **No landing logic in `Splash.tsx`** (TOOLS owns it on `splash-sweep`). The only existing coupling stays: the `ready` prop and the `data-splash-hold` attribute on `<html>`.
- Reuses Arrival's wait: if the first pull has not landed and the cache is empty, wait `whenFirstPulled(FIRST_PULL_CAP_MS)` before deciding (B10.1), so a returning writer is not sent to "nothing yet". Navigate with `{ replace: true, state: { warmStart: true } }` so Back does not return to the door.

## 3. Cases
| Case | Landing |
|---|---|
| Pointer resolves to a live Page or board | that `/page/:id` (or `/project/:id`) |
| Pointer's entry has `deletedAt` (Trashed) or no longer exists | **Pages surface** (the stale pointer is cleared) |
| A project pointer whose project is deleted | Pages surface |
| Moved to another home (`setPageHome`) | still resolves (the id is unchanged); no special case |
| First open, no pointer (new device, new account, cleared storage) | **Pages surface** |
| Signed out here (`isSignedOutHere()`), anon, or a device never signed in | **front door `/` unchanged** (anonymous Write is untouched; the signed-out lock still wins) |
| Boot ends `anon` (session expired) | front door |
| Pointer's `uid` differs from the current user | treated as no pointer |

## 4. The splash's "no ghost" hold on a non-Arbor landing
The hold hides `.wz-logo`, `.wz-tagline` and `.wz-arrival-doors` while `data-splash-hold` is set, and the splash waits for `ready` (floor 5 s, ceiling 10 s). Three consequences:
1. **Navigate while the hold is still on.** `authState` flips to `authed` at `ready`, which is the same moment the splash may leave. If the gate waits for the splash to end before navigating, the hold clears and the front door fades in for a frame before the redirect: a *new* ghost, worse than the old one. So the gate navigates as soon as `authed` and the first pull allow; the door is never shown and the hold is untouched (the floor is still not shortenable).
2. **The page is then the dimmed live app behind the veil**, which is the splash's own premise ("the regular app interface behind it"). Pointer events already pass through the veil, so a first keystroke lands in the page: TTFK improves, nothing is eaten.
3. **Tone risk (for TOOLS, not built here).** The splash measures the backdrop tone **once, after mount** (`measureBackdropTone`), when the backdrop is still Arrival's ground. A landing page may be a different tone (a light page under a dark Arrival), so the emblem could pick the wrong asset. This plan does not touch `Splash.tsx`; it asks TOOLS for one thing on `splash-sweep`: re-measure on hold end (or on route change). Until then the failure is cosmetic, not blocking, and the plan's frames will show it per theme and page tone.
- If the pull is slow past the ceiling, the existing Arrival "Loading your pages" state shows, as it does for Open today.

## 5. Page is primary, self-check
1. Page rect on open/close of the feature: the feature has no UI; it only chooses the first route. No.
2. Editor unmounts during intended use: no, the landing is the first mount, and `landed` makes it one-shot.
3. Leaving through it: the front door stays one tap away (Home links), and the return chip belongs to the existing departures. Landing is not a departure *from* a page.

## 6. Which harnesses assume the app boots to `/` (measured, not remembered)
Counted programmatically over `scripts/harness/*.mjs` (149 files) plus `scripts/evidence/*.mjs`:
- Of the 149 harness files: **121** call `goto('/')`, **122** wait for `.wz-arrival`, **8** set `wrizo-splash-hold`, **16** read `.wz-splash`. The evidence scripts add **7** more that boot to `/` and wait for `.wz-arrival`. (Whole-directory counts by `grep -l` over every file, not a cut listing.)
- **Almost all of them are unaffected by construction.** They boot anonymous (no `/auth/me` answer), so `authState` ends `anon` and the gate never fires. This is the load-bearing reason; the plan's own harness must prove it (an anon boot with a seeded pointer still lands on `.wz-arrival`).
- **The ones that can be affected are those that boot signed in or press Open:** `hb1.mjs` (3 Open presses), `hb2.mjs` (1), `item89.mjs`, `logout-flush-walk.mjs`, `fix-signin-live-double.mjs`, `arrival-signin-walk.mjs`, and `splash.mjs` (2 `/auth/me` stubs; its checks are about the front door under the veil, so a pointer in storage would navigate it away). Each is audited at build, one at a time (not a census): a harness that signs in without a pointer lands on the Pages surface now, and one with a seeded page lands on that page.
- Handling per the house law: **park, never edit** any assertion the change falsifies (verbatim original, SUPERSEDED header, successor pointer, park count stated in the report); no new raw-storage seeding; seed pages through the `window.wrizo*` seams and the pointer through a `window.wrizoRecordLastPlace` seam added with the build.
- `seed-guard.mjs` and the park sweep run browserless before any box turn; browser runs only on Chat 1's grant.

## 7. Proof the build will carry (`scripts/harness/resume-on-open.mjs`, committed with the build)
Browserless first (real store bundled via esbuild, with mutants): pointer round-trip and `uid` mismatch; deleted, trashed and missing targets; system boards never recorded; storage-blocked paths; `landed` one-shot. Then, on a box turn: signed-in cold boot lands on the page and on a board; the front door never paints (`.wz-arrival-doors` opacity stays 0 until the splash leaves, sampled); anon, signed-out-here and deep-link boots unchanged; a bail-out `<Navigate to="/">` does not loop; Home link reaches the front door after a landing. Frames: Arbor and Flux, dark and light, the splash over a landed page.

## 8. Hand-ups (conflicts and unknowns, each with a lean)
- **Q1: "the Pages surface" has no route today.** Candidates: `/drawers` (the full-browse tree of binders and pages, has a Home link), `/journal/spread` (loose Journal pages only), or the Cascade's Pages survey (needs a mounted page as host, so unusable as a landing). **Lean: `/drawers`.** Stated as the strongest rival too: a new, purpose-built "Pages" landing would be the honest answer to the ruling, but it is a new surface (a design item), so it is not smuggled into this build.
- **Q2: upgraders.** On the first open after this ships nobody has a pointer, so every existing writer lands on the Pages surface once even though they have work. **Lean: accept it, per the ruling.** Rival: seed the pointer once from `getResumeTarget()` (most recently edited) when none exists. That is kinder to the first open but quietly contradicts "no history means Pages".
- **Q3: Open door.** After this, "Open" resumes the *edited* race while cold boot resumes the *opened* pointer. They can differ. **Lean: leave Open alone in this build** and flag it; unifying is a one-line follow-up if Nick wants it.
- **Q4: opened vs edited.** The plan reads "had open" literally. If Nick meant "last worked on", `getResumeTarget()` already is that and the pointer is unnecessary. **Lean: opened, as ruled.**

## 9. Not built / out of scope
No server or sync change, no migration; no change to `Splash.tsx` or its timing; no change to the Open door; no new surface; no "return chip" work.
