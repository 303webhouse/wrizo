# Fragments under Pages — the substrate canon

**Place at:** `docs/fragments-under-pages-canon.md` · 2026-07-11 · **Status: RULED** (convened on Nick's word — "let's get it built" — with the sequencing pull-forward he approved; in force for S1 unless Nick objects). Closes open-threads item 6.
**Citizens examined:** `Box` (J4, shipped and living), `ScriptDoc` (S-arc plan v1.1, designed), the spine's links-on-the-child rule (`docs/structure-spine-plan.md`, ratified). Compact pass — the heavy deliberation already happened in those three documents; this ruling names the pattern they share so no future module reinvents it.

## 1 · What a fragment-under-a-Page is

A **structured child record living inside one Page** (JournalEntry): stable id generated at creation and never reused, self-contained, owned by exactly one page, with no lifecycle of its own — it is born, saved, synced, and deleted with its page. Addressable as (pageId, fragmentId). Boxes on a board and scenes in a script are both this. **What is NOT a fragment:** whole Pages (collection citizens with `orderIndex` and independent lifecycle) and plan beats (they live in `storyPlans` — the spine's home, never under a page).

## 2 · The laws

1. **Storage:** one jsonb column per substrate family on `journal_entries` (`boxes` today; `script` next), boot-idempotent `ADD COLUMN IF NOT EXISTS` in `migrate.ts`, carried through **both** sync mappers (`rowToJournalEntry` + `upsertJournalEntries`) exactly like `boxes` — JSON round-tripped, LWW at page granularity, soft-delete inherited. **Never a new collection**: fragments have no independent lifecycle, so a collection would be a lie about the data.
2. **Conflict honesty:** LWW at the entry level means two devices editing *different fragments of the same page* simultaneously lose one side. Accepted at single-user scale — the same trade `boxes`/`strokes` already make. Logged, not solved.
3. **Addressing & links:** fragment ids are stable; cross-references live **on the child** (a `Scene` carries `beatId?`; a beat never stores fragment lists). Every reverse view derives by scan. This is the spine's rule, now substrate law.
4. **Derived shadow:** a **prose-bearing** substrate maintains `entry.text` as a derived plain-text serialization on every save, so resume, mirror cards, `firstLine()`, and future search stay literate about the page for free. **Spatial** substrates (boxes) do not — a board's text is arrangement, not the page's prose. (Whether boards someday want an opt-in shadow for search is an open thread, not this ruling.)
5. **Editors:** each substrate gets its own delegate through `PageEditor()`'s outer wrapper, decided before either component's hooks run (the J4 routing rule); structured substrates use the single-live-editable pattern (`BoardTextBox` precedent).
6. **Versioning:** every substrate doc carries a schema version (`v: 1`) from birth. `boxes` is grandfathered without one; it gains `v` on its first amended schema, not before.
7. **Standing laws apply unchanged:** anti-Canva, Voice Wall on prose surfaces, ink sealed in the Journal, harness scenario per ticket, live prod round-trip on any column's first deploy.

## 3 · Rulings on the citizens

- **`Box` conforms** (grandfathered on `v` only). No retrofit work ordered.
- **`ScriptDoc` conforms as designed** — v-field present, scenes fragment-shaped, `beatId?` on the child, prose shadow specified. **S1 may proceed on this shape.** One clarification ratified: the scene's `heading` element and `body` elements are all fragments *of the scene*, but the **Scene is the addressable unit** — beat links and (future) rail/board ports point at scenes, never at individual elements.
- **Future structured pageTypes** (thesis sections, article blocks, …) enter by satisfying §2's checklist in their brief's Slice 0 — no new committee pass needed for conformance alone.
