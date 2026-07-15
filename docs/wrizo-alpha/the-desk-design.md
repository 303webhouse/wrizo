# The Desk — how Wrizo works on a big screen · 2026-07-14

**Status: the constitution (Nick's 2026-07-14 message) is his own words and
needs no ratification. This design is the committees' answer to it —
RULED. Both of Part 6's decisions are ruled per Nick's 2026-07-14 answers
(see Part 6).**
**Place at:** `docs/wrizo-alpha/the-desk-design.md`. Written plain first;
the code-translation for CC is fenced at the end and in
`docs/wrizo-alpha/ab1-page-frame-brief.md`.

---

## Part 1 — The screen, in plain words

**The Page sits in the center and never moves.** Same position, same size,
for a given window. Real paper on a real desk: the space around it isn't
black void, it's the desk surface — warm, quiet, subtly differentiated so
the page sits *on* something. Nothing may cover the page, push it, resize
it, or take its place except you deliberately opening a different page.

**Above the page: the Mode strip.** Five words, one lit:
**Free write · Draft · Revise · Workshop · Publish.** Clicking a mode
doesn't change your words — it changes which tools are within reach.

**Left of the page: the Tool rail — the current mode's tools only.**
- *Free write:* ink colors and nib for pen mode, the typewriter toggle, and
  a **forward lock** — the "can't delete too much" propulsion switch, so
  the only way out is through.
- *Draft:* text tools (bold, spacing), and the **Structure picker** — prose,
  screenplay, and later chapter book, comic page, academic paper. A
  structure is a Draft tool, not a separate app: pick "screenplay" and the
  page starts enforcing screenplay convention as you type.
- *Revise:* marks, comments, compare — the third toolset.
Every item on this rail passes one test, the **relevance law**: *does it
directly serve getting the words you want onto the page?* If not, it
doesn't exist here.

**Right of the page: the Corkboard — the organizers.** Three tabs:
- **Plan** — your current beat card pinned at the top, the way you'd look
  up from a typewriter at the corkboard on the wall. The outline scrolls
  beneath it. One click expands a card; one more opens the full board (and
  the return chip always brings you back to the exact word you left).
- **Pages** — this project's pages, sortable, draggable into order. Pull
  one out and it opens **beside** your page, read-only, for comparison —
  checking what you named the tavern in chapter two without leaving
  chapter nine.
- **Tutor** — the AI. Ask about continuity, ask for guidance. It never
  writes your prose; that law predates this document and outlives it.

**Below the page: the quiet meters** — words, milestones, the clock — per
your settings, exactly as they exist today.

**The vanishing law binds all of it.** The moment writing resumes — a key
pressed, a pen stroke laid — every rail, strip, and meter fades. The page
and your words remain. Reach for an edge, or pause, and the room returns.
Tools help only when called and vanish when writing has resumed; this is
already how the chrome behaves on the writing surface, now made
constitutional for everything on screen.

**Nothing else lives on the screen.** Sign out, fullscreen, save-state —
tucked into one quiet corner glyph. Saving is assumed; only a *failure* to
save is allowed to speak.

## Part 2 — "The app will sing": the two-action table

Every block a writer hits must be unblocked in one, at most two,
non-writing actions. This table is the acceptance test for the whole arc —
the build isn't done until every row holds:

| The block | The unblock | Actions |
|---|---|---|
| "What happens in this scene?" | Glance right — the current beat card is pinned | 1 (summon) |
| "What did I name that character?" | Corkboard → Pages → open beside | 2 |
| "I keep deleting everything I write" | Tool rail → forward lock | 1–2 |
| "Is this screenplay formatted right?" | The structure enforces it as you type | 0 |
| "Does this contradict chapter 2?" | Corkboard → Tutor → ask | 2 |
| "Where does this page belong?" | Corkboard → Pages → drag it home | 2 |
| "I want a different ink" | Tool rail → color | 1–2 |

## Part 3 — The theme seam

What themes may change: every color, texture, glyph, typeface, and mood of
every zone — Plateau's warm desk, Volant's near-white plane, and the rest.
What themes may never change: **the grammar** — Page center; Modes above;
Tools left; Organizers right; meters below; the vanishing law; the
relevance law; the two-action table; the orange rules. Five rooms, one
skeleton. (This is exactly the "bones before themes" law the theme arc
already ratified — this document is the bones.)

## Part 4 — What this corrects, on the record

The base layer was never a Journal page. **The Page is the primitive; the
Journal is a module** — the capture-flavored toolset (ink, spark deck,
send-to-drawer) that visits the page in Free write. The app grew outward
from the Journal historically, and that history hardened into separate
worlds (a Journal place, a drafting place, a script place) with separate
chrome. This design dissolves the worlds into one page wearing different
tools. The name "Journal" survives — on the module, where it belongs; the
first mark in this app was drawn in it and the brand keeps that.

## Part 5 — The build arc, resliced in your categories

(Supersedes the AB1/AB2 sketch in `docs/wrizo-alpha/fable-week-plan.md`; the week
plan's MUST list becomes these three briefs + the succession dossier,
builds proceeding as velocity allows.)

- **AB1 — the Page and its Desk.** The frame itself: the zones, the static
  grammar, the desk ground, the mode strip everywhere, the vanishing law
  generalized, the chrome purge, correct page sizing at desktop (your
  screenshot findings 1 and 4 die here). Existing editors mount inside
  unchanged. Brief: `docs/wrizo-alpha/ab1-page-frame-brief.md` — ready now.
- **AB2 — the Tools by Mode.** The per-mode tool rails; forward lock
  surfaced; the Structure picker with prose + screenplay (findings 2, 3, 5
  die here); copy-out moves home to Publish.
- **AB3 — the Corkboard.** Plan tab + the pinned beat (finding 6 dies
  here), Pages tab + sort + open-beside, Tutor tab. DoD = the two-action
  table, every row.

## Part 6 — Two decisions for Nick — RULED 2026-07-14

1. **The Mode strip reads Free write · Draft · Revise · Workshop ·
   Publish** — "Format" stops being a mode and becomes Draft's Structure
   picker (where you put structures in your own message). This renames a
   shipped tab. **RULED: yes** — exact ratified strings (title case):
   **Free Write · Draft · Revise · Workshop · Publish**
   (`docs/wrizo-alpha/ab1-page-frame-brief.md`'s header).
2. **"Journal" survives as the capture module's name** (Free write's
   ink-and-capture toolset), not as a place. Protects the brand origin
   while honoring page-not-journal. **RULED: yes, refined** — module names
   become theme-scoped vocabulary; "Journal" is specifically Plateau's word
   for the capture module, other themes may rename it
   (`docs/wrizo-alpha/ab1-page-frame-brief.md`'s header).

---

## Translation table (for CC and future docs — Nick can stop reading here)

| Constitution word | In the codebase today |
|---|---|
| The Page | the `PageEditor` delegate family (text / board / script) unified under one frame; `JournalEntry`'s separate world dissolves into it |
| Mode strip | the existing five-tab lifecycle (W1), extended to every surface; S1's strip-deferral already superseded |
| Tool rail (Free write) | ink controls (exist), typewriter toggle (exists), forward lock = `ForwardOnlyEditor` exposed as an explicit toggle |
| Structure picker | Draft-mode routing to substrate delegates; screenplay = the S1 element engine, unchanged inside |
| Corkboard: Plan | M1's read-only projection + the current-beat pin (the page-primacy deferral reversal, `docs/wrizo-alpha/app-bones-canon.md`) |
| Corkboard: Pages / open-beside | existing collections + the "reference peek" formerly horizoned in `docs/page-primacy-canon.md` — designed into the frame now, built in AB3 |
| Corkboard: Tutor | the assist rail, carried |
| Vanishing law | `useChromeDissolve` generalized to all zones (W1's engine, wider blast radius) |
| The desk ground / theme seam | tokenized per `docs/theme-foundations/` — grammar constant, presentation themed |
| Quiet meters | `WritingIncentives`, carried as-is |

Substrate (persistence, sync, harness suite, editors' cores): untouched,
per `docs/wrizo-alpha/app-bones-canon.md`'s KEEP list. All 235+ existing checks re-run
green through every AB slice.

— Fable, for the committees
