# STORAGE-FULL STEP 1 — RESPONSE TO BYTE REVIEW (tools lane; branch `item-storage-full`, was 8004312)
### All four items built. `item-storage-full.mjs` 54/54, both legs (park count 0). `tsc` 0, `build:web` 0, all three standing guards pass (a real false-positive in seed-guard.mjs's raw-write scan found and worked around in the harness itself, not exempted — see §5).

## 1 · persistDirty() is a save too
`persistDirty()`'s own `localStorage.setItem` catch now reports under its own name, **`dirtyJournal`** — never one of the six collection names — so a collection's write succeeding does not hide the journal failing beside it. `markClean()` also gained a `notify()` call it never had (the one real gap: every other mutator already fires it; this was the one that let a push go unpushed *and unseen* by a reactive reader). New export `hasDirtyRecords(): boolean` (cheap — reads each dirty `Set`'s size, no cloning, unlike `getDirtyRecords()`).

## 2 · The words — final strings, by state
| state | when | lexicon key | text |
|---|---|---|---|
| (a) | failed + signed in + changes not yet in the account (offline, or a push not yet landed) | `syncStorageFullPending` | *"This device's storage is full — keep Wrizo open and online until these changes reach your account"* |
| (b) | failed + signed in + everything already pushed | `syncStorageFullSynced` | *"This device's storage is full — your changes have reached your account, though this device can no longer keep its own copy"* |
| (c) | failed + signed out (F2's local-first writing) | `syncStorageFullAnon` | *"This device's storage is full, and nothing else holds a copy of this writing — download it now"* |
| near-full | not yet failed, ≥80% of the floor, once ever | `syncStorageNearFull` | *"This device is running low on storage — stay online so your writing reaches your account"* |

Priority: (a)/(b)/(c) first (checked by signed-in, then by `hasDirtyRecords()`) → offline → too-large → near-full → nothing. `ChromeControls.tsx`'s `SyncIndicator` now also subscribes to `persistence.ts`'s generic `subscribe()` (for live dirty state) and a new `subscribeCurrentUser()` (`currentUser.ts` gained the same subscribe shape every other store module already has).

## 3 · beforeunload (web only)
New module `beforeUnloadGuard.ts`. `unloadIsRisky()` — true iff storage has failed AND (signed out, OR `hasDirtyRecords()`) — i.e. exactly states (a) and (c); state (b) is not risky to leave, and neither is a plain near-full. Installed once in `App.tsx` (session-lifetime, not tied to `SyncIndicator`'s own mount, which is rendered from more than one place). **Electron excluded by name**: detected via Electron's own default user-agent token (`/Electron\//`, unmodified — `main.ts` sets no `userAgentFallback`), never assumed. The browser is asked to show its own generic "Leave site?" wording (browsers ignore a page's custom `beforeunload` message on purpose, so the real words live in the sync notice, already on screen).

## 4 · The quota figure, named honestly
**5 MiB counted as UTF-16 bytes (2 bytes/char) is a conservative floor, not a claim about any given browser's real ceiling — plausibly close to half of Chromium's actual localStorage quota.** It is deliberately early: a device with real headroom gets a harmless early heads-up; one with less is warned in time either way. **Step 2 replaces this with `navigator.storage.estimate()` (StorageManager)**, the real per-origin quota where the browser exposes one.

## 5 · A real false positive, found and fixed in the harness, not the product
`seed-guard.mjs`'s 85-B raw-write scan is a plain **text** scan (not an AST parse) for the shape `localStorage.setItem(KEY, ...)`. Two of my new mutation-test anchors quoted `persistence.ts`'s own source **as a string literal** to swap it — `"localStorage.setItem(DIRTY_KEY, JSON.stringify(out));\n  ..."` — and the scanner cannot tell a quoted mutation anchor from a real raw write; it flagged my harness file. **This is not a raw write to exempt** (annotating it would mislabel the file as a deliberate raw-write simulation, which it is not), so the anchor was reworded to start **after** the `setItem(` line — the mutation only ever needed the two `reportFlushOk`/`reportFlushFailed` lines it removes — and the scan is clean without touching seed-guard.mjs or its baseline.

## What was already right (unchanged from step 1)
The per-collection flag, the edge-triggered push, the throttled usage check, the hysteresis, the Node module-cache bug fix (real code, not a comment, to force a fresh instance). All still green.

## Owed / unmeasured, named
`ChromeControls.tsx` itself (the React component reading these new subscriptions) is not rendered in this harness — only the store functions it wires are proven directly, same scope as step 1. The near-full text's "stay online" advice still shows for an anonymous (signed-out) writer even though there is no account for it to help reach — Fable's instruction gave one sentence for near-full without a fourth anon variant, so it is built as one sentence; named here rather than invented past what was asked.
