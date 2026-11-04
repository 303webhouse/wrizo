# Rulings: `apps/desktop/src/App.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[App §n]` points here.

## App §1

From `apps/desktop/src/App.tsx`, line 88 at `4d6af3d9` (the comment that stays: "The Shelf is merged into the Journal (display only; the flag stays in storage): '/shelf' predates that, and every old link, bookmark and 'Send to the Shelf' door still resolves by redirecting to the Journal. The Shelf's own system board is still derived and still a board, and a harness mounts it: '/shelf-board' is the old bridge unchanged in shape (find-or-create, idempotent, no router state). No chrome links to it.").

```ts
// BIG PROJECTS 1a - the Shelf is merged into the Journal (display only; the flag stays in storage). '/shelf' pre-dates that and every old link,
// bookmark and 'Send to the Shelf' door still resolves: it redirects to the Journal.
//
// The Shelf's own system board is still derived and still a board, and a harness mounts it to hold its derived membership: '/shelf-board' is the old '/shelf'
// bridge unchanged in shape (find-or-create, idempotent, no router state). NO chrome links to it (Fable, Oct 19: no door from chrome, narrow DeskRail included).
```

## App §2

From `apps/desktop/src/App.tsx`, line 204 at `4d6af3d9` (the comment that stays: "A device that signed out goes to sign-in and stays there: every route except the door itself and the guest link (its token rides in the hash) goes back to '/', after the boot check, so a signed-in device is never bounced. BrandMark below is one logo, a faint bottom-right watermark, absent at '/' (Arrival mounts its own).").

```ts
// B4 — one logo element, opacity by surface: a faint bottom-right watermark
// everywhere. HB1 — absent at '/' now: Arrival mounts its own mark (the
// route's former "full on the home" variant retired with the Desk room it
// belonged to, per the AB1-era comment this one replaces).
// SIGNED OUT HERE (Nick, 2026-10-06) — a device that signed out goes to sign-in and stays there. Any route except
// the door itself, and the guest link (its token rides in the hash, so it must not be redirected away), is sent
// back to '/'. It waits for the boot check, so a signed-in device is never bounced.
```

## App §3

From `apps/desktop/src/App.tsx`, line 236 at `4d6af3d9` (the comment that stays: "installed once for the whole session (App.tsx mounts regardless of route or auth state), not tied to SyncIndicator's own mount, which renders in more than one place; see beforeUnloadGuard.ts for the reasoning and the Electron exclusion").

```ts
  // STORAGE-FULL STEP 1 (Fable's byte review, item 3) — installed once for the whole session (App.tsx mounts
  // regardless of route or auth state), not tied to SyncIndicator's own mount, which the sync notice is rendered
  // from in more than one place. See beforeUnloadGuard.ts for the reasoning and the Electron exclusion.
```

## App §4

From `apps/desktop/src/App.tsx`, line 324 at `4d6af3d9` (the comment that stays: "the router mounts regardless of auth state: Arrival (route '/') is both the boot screen and the front door; Write works local-first with no account, and the Journal, Drawers and Projects all run on local data, so only startSync() above is authed-only. Arrival's own boot bar (authState as a prop) carries the loading state.").

```ts
  // HB1 — the router now mounts regardless of auth state. Arrival (route
  // '/') is both the boot screen and the front door: Write works local-first
  // with no account (F2), so there is no reason to gate the rest of the app
  // — Journal/Shelf/Drawers/Project all already operate on local data with
  // or without a session; only startSync() above is genuinely authed-only,
  // and that's untouched. This retires the old `authState === 'anon' →
  // HomeFlow` short-circuit and the plain-text loading screen — Arrival's
  // own boot bar (authState threaded through as a prop) carries both jobs
  // now, per Nick's ruling on the HomeFlow/Arrival overlap (see
  // components/Arrival.tsx's header comment).
```

## App §5

From `apps/desktop/src/App.tsx`, line 340 at `4d6af3d9` (the comment that stays: "The splash, mounted at the app root rather than on a route: it belongs to every app OPENING, not to '/'. It renders once per load, is pointer-events:none throughout, and dims whatever is mounted behind it (Arrival at boot). `ready` is Arrival's own boot-bar derivation (authState !== 'loading'), so the splash holds longer while the app is not ready.").

```ts
        {/* Item 187 — the splash. Mounted at app root rather than on a route:
            it belongs to the app OPENING, not to '/' (and Fable's ruling is
            every open, not first-run-only). It renders once per app load, is
            pointer-events:none throughout, and dims whatever is genuinely
            mounted behind it — which at boot is Arrival, the Threshold.
            ITEM splash-hold round 3 — `ready` is the SAME derivation Arrival's
            own boot bar already uses (authState !== 'loading'): the splash's
            floor holds longer when the app genuinely isn't ready yet. */}
```

## App §6

From `apps/desktop/src/App.tsx`, line 389 at `4d6af3d9` (the comment that stays: "the unborn surface, declared BEFORE /page/:id so the literal segment wins the match; a blank-surface door lands here with its descriptor in the query string and creates no row").

```ts
        {/* PB1 (item 71) — the unborn surface. Declared BEFORE /page/:id so the
            literal segment wins the match; a blank-surface door lands here
            with its descriptor in the query string and creates no row. */}
```
