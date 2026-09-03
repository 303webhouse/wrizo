# ITEM 83 · WALKTHROUGH ERRATA — BUILD BRIEF
### menus lane · armed 2026-08-25 · authority: Nick's ledger words at `ef9f9ce`
### worktree `.claude/errata` · branch `errata-build` off current `origin/main`

---

## §0 · STANDING RULES
Commit = push, to `origin errata-build` **only** — never `main`, never force,
never another worktree. **S0 FIRST**: no patch before the survey lands. Disk
wins. Anchor law is build law — anchors are layout, script decides policy
only, and every self-check compares two independently rendered boxes.
Plateau register: olive rests, brass is evental press; every new string
enters the lexicon, none inline. `prefers-reduced-motion` kills motion.
**E1's constraint law stands wherever you touch drawer code**: a permissive
return is lawful only for *unmeasurable*, never for *measured zero*.
**ZERO SCHEMA.** If any item wants a column, **STOP AND SURFACE** — do not
migrate.

## §E0 · S0 — THE SURVEY (first commit, no behaviour change)
Report, from code not memory: (a) the pop-out fade path and its current
timer — file, function, and what starts/cancels it; (b) the Draft foot's
markup order and how Progress and Full Screen are laid out today;
(c) the Structure block's current position in the tab and what it holds;
(d) the built Indent control — is it a single arrow, or is there an outdent
partner? (e) **does `entries.page_settings` exist at this branch point?**
The menus wave carries that column; if `main` does not yet have it, item 4's
persistence has no lawful home — say so and hold item 4.
Commit: `Errata: S0 — survey (fade path, foot layout, Structure, indent
control, page_settings presence)`

## §E1 · FADE TIMING — written words, not elapsed seconds
**Ruling:** pop-outs fade only after **15 words written** or **a period
entered** — not the current short timer.
Replace the timer trigger with a composed-text trigger: from the moment a
pop-out opens, count words the writer commits; at **≥15 words since open**,
or on the entry of a **period**, the pop-out fades. **Idle never fades it** —
the writer thinking is not the writer done. Scope: **pop-outs only.** Drawers
keep R10's slide-only law; the vanish engine's other chrome-recede fades are
untouched. The fade path itself is reused, not re-authored — only its trigger
changes.
Commit: `Errata: fade timing — pop-outs fade on 15 words or a period, never
on a timer`

## §E2 · LAYOUT — Structure to the foot of the tab; Full Screen on the bar's line
**Ruling:** the Structure block moves to the **bottom** of the tab; **Full
Screen aligns horizontally with the progress bar.**
Structure becomes the last zone before the foot. Full Screen leaves its
instrument cell and sits on the **same horizontal line as the progress bar**,
its baseline aligned by layout — not by nudged margins. Typewriter and
Progress keep their places; the foot's remaining geometry is unchanged.
**Prove it by measurement**: extend the probe with an assertion that Full
Screen's vertical centre and the progress bar's vertical centre agree within
0.6px at both widths, and that Structure's block bottom precedes the foot's
top. A screenshot is not the proof; the assertion is.
Commit: `Errata: layout — Structure to the tab's foot; Full Screen aligned to
the progress bar (probe-asserted)`

## §E3 · INDENT — a whole paragraph, repeatably
**Ruling:** the menu arrow indents a **whole paragraph**, repeatably (outline
use). **Tab-as-indent is item 102's — DO NOT BUILD IT HERE.**
The arrow applies to the paragraph containing the caret (or every paragraph
the selection touches), not the line. Pressing again **increases the level**;
levels round-trip as plain text on F3's leading-tab convention, render as
indent with the marker low-ink, and strip on export.
**SEAM — stop and surface, do not invent:** if the built control has **no
outdent partner**, a repeatable indent is a one-way door. Report it with your
S0 finding and hold the outdent question for Nick's word; if an outdent
control already exists, make it the exact symmetric decrement and say so.
Commit: `Errata: indent — the arrow indents a whole paragraph, repeatable
(item 102's Tab untouched)`

## §E4 · ITEM 114 PLACEHOLDERS — kind, and the style guides under Research
**Ruling:** Structure gains three kind buttons — **Normal (preselected) ·
Screenplay · Research** — with the four style-guide buttons revealed under
Research: **MLA (default) · APA · Chicago · AP**. **PLACEHOLDERS ONLY:**
selection renders and persists per page. **Downstream behaviour — Revise
linkage, footnotes — is deferred by Nick's own word.** Nothing downstream is
wired, and nothing is grayed: what isn't built doesn't render.
**Persistence:** `entries.page_settings` jsonb, an added key — e.g.
`{ kind:'normal'|'screenplay'|'research', styleGuide:'mla'|'apa'|'chicago'|'ap' }`.
**Zero schema.** If that column is absent at this branch point, or the shape
resists, **STOP AND SURFACE** — no migration in this wave.
Style-guide buttons are revealed **only** when Research is selected (G4's
in-place disclosure), MLA preselected on first reveal.
**SEAM — surface, don't resolve:** Structure already holds DR3's
`Convert to Screenplay…` conversion row. A *kind* button also named
Screenplay stands beside a door that converts to screenplay — two controls
that sound like one act. Render them so they cannot be confused, and
**report the collision to Nick with your own recommendation**; do not
silently merge or rename either.
Commit: `Errata: item 114 placeholders — kind buttons + style guides under
Research (render + persist only; downstream deferred)`

## §E5 · PROOF AND OFFER
Full **stamped suite, both settings** — clean, or every red named and mapped
as a known species. Probe including E2's new assertions. Fresh shots. Then a
committed offer record + ledger entry naming: the offered SHA, each item's
commit, the suite runs verbatim, the probe result, **what was surfaced rather
than built** (the outdent question, the Screenplay-name collision, any schema
stop), and what stays deferred by Nick's word (Revise linkage, footnotes,
item 102's Tab). **Offer to Chat 1; hold for review.** Nick's merge word and
deploy word remain separate and his alone.
Commit: `Errata: the wave offered — suite, probe, surfaced seams, deferred
list`
