# Handoff — DM1: Fragment Substrate (data layer only)

**Branch:** create `dm1-fragment-substrate` off `m1-creative-flow` (confirm the current integration branch with Nick first).
**Inherits:** `docs/PHILOSOPHY.md` (law) and `docs/BUILD_PLAN.md` (Phase 0 / the keystone). Read both before starting.
**Rules:** One ticket, one session. Keep changes minimal (AGENTS.md). **The app must run and behave identically after this ticket — there is no visible change. The substrate is invisible until CW2 wires the UI to it.**

## Why (30-second context)
Creative writing currently lives in a single string, `Project.sprintText`. Everything on the v0.1 roadmap — forward-only UI, the Middle Door, the Rope, and later Gather / bridges / the Trellis — needs writing to be a **graph of fragments**, not one string: one privileged ordered path (the **spine**) plus branches and loose fragments, connected by links. That is a rhizome as a data structure, and it is the keystone the rest of the build stands on. *If convergence is the product, the fragment is the unit.* This ticket lands ONLY the data substrate — no UI changes, no sync changes.

## The model (firm) — add to `apps/desktop/src/types/index.ts`
```ts
export interface Run {
  text: string;
  struck: boolean;          // strikethrough is the only "delete" — struck text stays, visible (forward-only)
}

export interface FragmentLink {
  targetId: string;
  kind: 'bridge' | 'magnetized';
  strength?: number;
}

export interface Fragment {
  id: string;
  projectId: string;
  content: Run[];           // append-only runs; characters are never deleted, runs are struck
  role: 'spine' | 'branch' | 'loose';
  spineOrder?: number;      // sparse/float index for cheap reorder (spine role only)
  parentId?: string;        // the spine fragment this branches from (branch role only)
  parentFragmentId?: string;// nullable; theme->principle->point nesting (Trellis, v0.2). Unused / one level in v0.1
  links: FragmentLink[];    // rhizome side-edges (bridges / magnetized joins)
  clusterId?: string;       // emergent grouping for Gather mode (v0.2); label-capable
  createdAt: string;
  updatedAt: string;
  // NOTE: `heat` (recency + edit-density) is DERIVED at read time, never stored.
}
```
Add one field to the existing `Project` interface:
```ts
fragments?: Fragment[];     // creative-mode source of truth (the real model; replaces sprintText's role)
```
**Keep `sprintText?` exactly as it is.** It becomes a *derived mirror* (see Migration). Do not remove it; do not touch sync.

## Forward-only is enforced HERE (firm contract)
The fragment store exposes ONLY non-destructive operations:
- append text (extends the current run, or starts a new one)
- toggle a run struck / unstruck
- create a fragment
- reorder the spine (via sparse/float `spineOrder` — reordering is allowed; it is not erasure)
- link two fragments / set a fragment's role

**FORBIDDEN — do not implement, and no code path may call:** delete a fragment, delete a run, edit run text in place. **Forward-only means no-ERASURE, not no-REORDERING.**

Suggested API in `apps/desktop/src/store/persistence.ts` (implement idiomatically to match the existing function-based store):
```ts
getFragments(projectId): Fragment[]
appendText(fragmentId, text): void          // extends the last unstruck run, or creates one
toggleStruck(fragmentId, runIndex): void    // strike / unstrike; never deletes
createFragment(projectId, role, opts?): Fragment
reorderSpine(projectId, fragmentId, newOrder): void
linkFragments(sourceId, targetId, kind): void
setFragmentRole(fragmentId, role): void
sprintTextOf(project): string               // concat unstruck spine runs in spineOrder order
```

## Migration + backward-compat (firm)
- **Migrate on load:** when a project has `sprintText` but no `fragments`, build `fragments` from it — split on `\n\n`, one `spine` fragment per paragraph, `spineOrder` by index, `content: [{ text, struck: false }]`. Idempotent: never re-migrate a project that already has `fragments`.
- **Derived mirror:** on EVERY fragment mutation, recompute and write `project.sprintText = sprintTextOf(project)`. This keeps the existing UI (ProjectHome sprint preview, QuickSprint draft init, JournalEntry routing) and the server sync (`sprint_text` column) working untouched. **fragments = source of truth; sprintText = a derived cache.**
- **Reversible:** because `sprintText` is always kept current, rollback is trivial.

## Files — touch ONLY these
- `apps/desktop/src/types/index.ts` — add `Run` / `FragmentLink` / `Fragment`; add `fragments?` to `Project`.
- `apps/desktop/src/store/persistence.ts` — fragment ops (forward-only), migrate-on-load, `sprintTextOf`, write the `sprintText` mirror on save.
- Tests for the store, if the repo has a test setup.

## Do NOT (out of scope this ticket)
- Do NOT change any page/UI. QuickSprint, ProjectHome, JournalEntry stay as-is and keep reading `sprintText`.
- Do NOT change `apps/server/**` or the client sync layer. Fragments ride the EXISTING whole-record cache/queue/sync via the `sprintText` mirror — the same machinery strokes already use. True per-fragment sync is deferred to v0.2.
- Do NOT add dependencies. Do NOT refactor unrelated code.

## Definition of Done
- Types compile; `Fragment` / `Run` / `FragmentLink` exported; `Project.fragments?` added.
- Store exposes the forward-only ops above and NO destructive op (no delete/edit-in-place anywhere).
- A legacy project with `sprintText` loads with `fragments` populated, and `sprintTextOf` reproduces the original text exactly.
- Striking a run removes it from `sprintTextOf` output but the run still exists in `content`.
- `pnpm install` clean; `pnpm dev` runs; the existing creative flow looks and behaves identically.
- Zero changes under `apps/server/**` and zero changes to the sync layer.

## Next tickets (DO NOT start — listed for orientation only)
CW2 (wire QuickSprint to fragments, forward-only UI) → CW1 (Middle Door) → CW3 (chrome-fade) → CW4 (no-interruption law) → TG2 (the Rope) → GATE + HOME.
