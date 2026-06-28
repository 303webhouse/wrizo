# Drawers — D1: Drawers over Projects (CC brief)

**Branch:** `d1-drawers` off `m1-creative-flow`.
**Keystone decision (already made):** a "Binder" is the evolved Project; plot-structure is an optional facet of it, not a separate noun. D1 builds only the new **Drawer** top level over the existing Projects. It deliberately stays minimal so the in-flight taxonomy work (Binder / Page / Journal / Shelf naming; loose-page organization) shapes later slices without re-migrating.

## Why
The authed Desk's only organizational surface is a flat, truncated recent-items list (projects + journal pages). It does not scale and buries each project's StructureBoard. D1 introduces the top of the Drawers IA — a browsable `Drawer -> Binder(Project)` tree that replaces the recent list — so every project and its structure board is reachable from a real hierarchy. First of a multi-slice arc.

## Scope — build this

### Data: new `Drawer` entity + `Project.drawerId`
- **types/index.ts:** add `Drawer { id: string; name: string; order: number; createdAt: string; updatedAt: string; deletedAt?: string }`. Add optional `drawerId?: string` to `Project`.
- **store/persistence.ts** — register `drawers` as a collection following the EXISTING pattern verbatim (grep `journalEntries` and `drafts` to find every touch point; mirror them for `drawers`):
  - `KEYS.drawers = 'writer-studio-drawers'`; `Cache.drawers` + `hydrate`; `dirty.drawers`; `DirtyRecords.drawers` (+ in `getDirtyRecords` and `markClean`); `flushTimers.drawers`; `RemoteRecords.drawers` + `applyCollection('drawers', ...)` in `applyRemoteRecords`. (`resetLocalData` iterates KEYS — automatic.)
  - CRUD: `getDrawers()` (non-deleted), `getDrawer(id)`, `saveDrawer()`, `createDrawer(name)` (`order = max(order)+1`), `renameDrawer(id, name)`, `softDeleteDrawer(id)` (set `deletedAt`), and `setProjectDrawer(projectId, drawerId | null)` (sets `drawerId` on the project via `saveProject`).
  - **store/sync.ts:** add `'drawers'` to the `stampMap` collection array (so pushed drawer records get marked clean). Push already sends all `DirtyRecords` via `apiSync({ push: dirty })` — drawers ride along once in `DirtyRecords`.
  - **store/api.ts:** extend the `apiSync` request/response types so the pull side includes `drawers` (push uses `DirtyRecords`, already covered).
- **Server schema** — add via the SAME boot-time idempotent DDL path that added `users.name` (Change 3), NOT a migration file, so it applies on the live Railway DB on the next `railway up` without depending on the migration runner:
  - `create table if not exists drawers ( id text primary key, user_id uuid not null references users(id), name text not null, "order" int not null default 0, deleted_at timestamptz, created_at timestamptz not null, updated_at timestamptz not null );`
  - `alter table projects add column if not exists drawer_id text;`
  - `create index if not exists drawers_user_updated on drawers (user_id, updated_at);`
- **apps/server/src/sync.ts:** add `rowToDrawer` + `upsertDrawers` (copy `upsertStoryPlans` verbatim — last-write-wins, user-scoped, `on conflict do update ... where excluded.updated_at > drawers.updated_at`); include `drawers` in the `/sync` push handling and the pull response. Add `drawerId` to `rowToProject` (`drawerId: r.drawer_id ?? undefined`) and to `upsertProjects` (the `drawer_id` column + param `p.drawerId ?? null` in both insert and the `on conflict` update).

### Migration / backfill: NONE
Do **not** backfill existing projects into a drawer. Projects with no `drawerId` render under a virtual **"Unsorted"** group at the top of the tree (not a real Drawer row). This avoids committing to a drawer name before the taxonomy is settled and seeds the future Shelf concept cleanly.

### UI: Drawers tree replaces the recent-items list
- **New `components/DrawersTree.tsx`:** renders the user's non-deleted Drawers, each a collapsible row. Expanding a drawer lists its Binders (projects where `drawerId === drawer.id`); a top **"Unsorted"** virtual group lists projects with no/deleted `drawerId`.
  - Per-drawer expansion: show 10 items, "+ N more" reveals the next 10 (IA spec).
  - Sort items most-recently-opened then by name (`lastActivityAt` desc, then `title` asc). Sort drawers by `order` (default = creation order).
  - **"+ New Drawer"** at the top -> `createDrawer` with inline name entry (default "New Drawer", immediately renameable).
  - Each Binder(project) row: click -> navigate to the existing **ProjectHome** (`/project/:id`); StructureBoard etc. are already reachable from there. A quiet "move to..." control -> menu of drawers (+ "Unsorted") -> `setProjectDrawer`. A small per-drawer menu: rename / delete (delete = `softDeleteDrawer`; its projects fall back to Unsorted).
- **Mount points (one component, two places):** (1) **Desk** (`pages/Desk.tsx`) — REPLACE the recent-items list with `DrawersTree`, atomically in this change (never a state with neither). (2) a new **`/drawers`** route (Drawers landing, full browse) reachable from the top-bar text nav ("Open a Drawer") and a Desk "Open a Drawer" button — render the same `DrawersTree` full-height for now.
- **Preserve untouched:** the Desk's "Keep writing" resume, "New page", "Begin project", the Journal entry point; the `/journal` surface and all loose journal pages.

## Non-goals — explicitly deferred, do NOT build
- **The Page level inside a Binder** (a Binder holding multiple pages) — that is D2. In D1 a Binder is the existing single-bodied Project; clicking it opens ProjectHome.
- **Any organization of loose journal pages / the "Shelf"** — deferred. Hard prerequisite first: **journalEntries do not sync server-side today** — the client pushes/pulls them but `apps/server/src/sync.ts` has no `journal_entries` table and ignores them, so they live only in this browser's localStorage. That gap is its own ticket and must land before loose-page organization.
- **Renaming `Project` -> "Binder"** in code or in the ProjectHome / Structure screens. D1 adds only the new Drawer level over existing Projects. The Binder / Page / Journal / Shelf user-facing taxonomy is being decided separately — keep new labels neutral ("Drawer" for the new level; projects shown by title) and do not touch the `Project` type or routes.
- **Drag-and-drop** reordering of drawers or moving projects by drag (use the "move to..." menu; drag is later polish).
- **Per-type default drawers** (creative vs academic) — not now.

## Invariants / guardrails
- Mirror the existing persistence + sync patterns exactly (explicit per-collection enumeration). A new collection must appear everywhere `drafts` / `journalEntries` appear — grep both to find all sites.
- Last-write-wins, user-scoped, soft-delete (never hard-delete a synced row). Drawers inherit this.
- The recent-items list is removed ONLY as `DrawersTree` replaces it, in the same change — no intermediate state with neither.
- No new deps. Minimal changes; no refactors outside scope (AGENTS.md hard rules).

## Definition of Done
- `tsc` clean; `pnpm build:web` clean.
- Create / rename / soft-delete a Drawer and assign / move a Project into it: all persist locally AND round-trip through sync — push (dirty drawers + `project.drawerId` reach Postgres) and pull (a drawer made in one session appears after a full pull), last-write-wins; a soft-deleted drawer's projects fall back to Unsorted.
- Existing projects appear under "Unsorted" with zero data loss; every project's StructureBoard reachable in one click (row -> ProjectHome -> board).
- Journal + loose pages still reachable and unchanged; "Keep writing" resume unchanged.
- Harness selftest green; if the CDP harness supports it, assert the Desk renders `DrawersTree` (not the old recent list) and "+ New Drawer" adds a drawer row.
- Run `pnpm install` + `pnpm dev` before done (AGENTS.md).

## Deploy note
The boot-idempotent DDL means `drawers` + `projects.drawer_id` apply on the live Railway DB on the next `railway up` from the working tree — no manual migration step. Confirm the boot DDL runs on server start (same place `users.name`'s add-column lives).
