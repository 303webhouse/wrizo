# Rulings: `apps/desktop/src/store/sectionFold.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[sectionFold §n]` points here.

## sectionFold §1

From `apps/desktop/src/store/sectionFold.ts`, line 3 at `e2898deb` (the comment that stays: "per-section fold state, client-local: one localStorage key holding a map (section id -> the writer's explicit choice), keyed by stable content-independent ids; zero schema").

```ts
// FX9 S2 — "memory, without schema." Per-section open/closed state for the
// cascade's list-bearing headers (DrawersPanel's per-project clusters + its
// documents list, JournalPanel's recent list), client-local only. Same
// FAMILY as store/firstRun.ts / store/tutorDisclosure.ts (HB1 F3's own
// precedent: one localStorage key, a module-level `current` cache, a Set of
// subscriber callbacks, try/catch guards on every localStorage touch) — this
// file's own shape differs only in that ONE key now holds a MAP (section id
// -> the writer's own explicit collapsed choice) rather than a single flag,
// because the ticket has to remember many independent sections, an unbounded
// and dynamic set (one per project cluster) that a single boolean flag can't
// express. Still zero schema: nothing here is a server row, and an absent
// key is simply "never touched," never an error.
//
// Keys ride STABLE, CONTENT-INDEPENDENT identifiers (S2's own ruling — "a
// project cluster's key rides its project id, never its title"): callers
// pass `project:<id>` for a per-project cluster, and a fixed literal for
// every section that isn't per-entity ('drawersLoose', 'journalRecent'). A
// key for a section that no longer exists (a deleted project, a retired
// panel) is simply never read again — inert, left to rot, no reaper (S2's
// own explicit non-goal).
```

## sectionFold §2

From `apps/desktop/src/store/sectionFold.ts`, line 61 at `e2898deb` (the comment that stays: "first-ever default: more than six items opens collapsed").

```ts
// S2's own ruled first-ever default: MORE than six items opens collapsed;
// six or fewer opens expanded — "a hand's worth of items reads at a glance
// and needs no hinge" (Fable's own words).
```
