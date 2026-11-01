# Sync / server

**What lives here:** local storage (one cache, flushed on a debounce), sync to the server, auth, and the server itself.
**Owner (proposal):** FIX; Chat 1 deploys. **Back to** [MAP](../MAP.md).

## Entry files
- `store/persistence.ts`: the cache and flush core, then every collection (projects, story plans, drafts, boards, links, journal, drawers, trash).
- `store/sync.ts`, `store/syncNotice.ts`, `store/storageHealth.ts`, `store/deleteSeams.ts`, `store/deleteGate.ts`.
- `apps/server/src/index.ts` (boot), `apps/server/src/sync.ts`, `apps/server/src/auth.ts`, `apps/server/src/session.ts`, `apps/server/src/db.ts`,
  `apps/server/src/migrate.ts`, `apps/server/src/wordCount.ts`; migrations in `apps/server/migrations/`.
- Deploy: [deploy.md](../deploy.md).

## Seams and hooks
The seeding seams: `window.wrizoCreateJournalPage`, `window.wrizoPatchEntry`, `window.wrizoCreateProject`, `window.wrizoCreateStoryPlan`,
`window.wrizoFlushNow`, `window.wrizoDirty`, `window.wrizoStashDeleted`, `window.wrizoRestoreDeleted`, `window.wrizoPurgeDeleted`, `window.wrizoStorageHealth`.

## Full pair
Everything here: save, sync and the server always run the full pair.

## Covering harnesses (start here)
`sync-generation.mjs`, `item224a-sync-integrity.mjs`, `item-storage-full.mjs`, `drafts-integrity.mjs`, `b101.mjs`, `seed-guard.mjs`.

## Known traps
- **The cache is hydrated once, at boot, and flushed whole.** A row written straight to `localStorage` after boot is erased by the next flush. Seed through the seams ([AGENTS.md](../../AGENTS.md)).
- **A product write is debounced (300 ms).** Read storage after the debounce, or call `window.wrizoFlushNow` before a reload.
- **Law 4: no new saved field, column, mark or key without Nick's word.**
- **Deploy only from the primary checkout,** with a clean tree: `railway up` ships the working tree. Chat 1 deploys.
- **Never put a database address, key or token in code, a commit, a chat or a doc.** Nick types any database address himself.
