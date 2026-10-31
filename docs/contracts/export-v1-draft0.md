# Contract: the Wrizo export format, v1 · DRAFT 0

**Status:** draft 0 (Fable, Oct 31, 2026). NOT signed. Read mocks against it. **Owner:** Fable. **Consumer:** SOCIAL.
**The rule it serves (Nick):** one door. Text enters Read only through this format. Read has no editor of its own and never writes back to Write.

## 1. The envelope
```json
{
  "format": "wrizo-export",
  "version": 1,
  "exportedAt": "2026-10-31T21:00:00Z",
  "piece": { ... },
  "work": { ... },          // optional
  "provenance": { ... }
}
```

## 2. `piece`
| Field | Meaning |
|---|---|
| `id` | Write's own page id. **Stable:** exporting the same page again UPDATES the piece in Read, never duplicates it. |
| `revision` | A hash of the exported content. Read uses it to anchor notes to the version they were made on. |
| `kind` | `page` · `board` · `script`, from Write's existing page species. |
| `title` | The page's own title, or its first line if it has none (as Write's file exports already do). |
| `body` | `{ "dialect": "wrizo-page/1", "text": "<the page's text, verbatim>" }`, for kind = page. |
| `boxes` | For kind = board: the cards, each with its text in the same dialect plus its position and size (Write's existing board shape). |
| `script` | For kind = script: Write's existing script document. |
| `ink` | The page's hand-drawn strokes in **Write's stroke model**, unchanged, in the page's own coordinates. |
| `pageKind` | The page's kind and template (for example `outline`, `bibliography`), so the layout and the strokes line up. |
| `wordCount` | Write's own count (the one shared counter). |

### The text dialect (`wrizo-page/1`)
- **Line-based, verbatim.** Every line break and every blank line travels exactly as written, and nothing is reflowed. **Verse is verse:** one line per line, a blank line between stanzas. (SOCIAL ask 1: yes.)
- The marks are the ones Write's page paints today: bold, italic, underline, strike; font spans and size spans on highlighted words; the structure tokens (headings, the `>| ` block, and so on).
- **There is ONE reader:** Write's `store/markRuns.ts`. Read must use the same reader (see §7), never a second interpretation, or a piece will look different in the two apps.
- **Links (SOCIAL ask 2):** Write has **no web-link mark today**. Its "links" join pages and cards inside the Drawer. A `link { href }` mark is RESERVED in v1 and is not emitted. Adding web links (for citations) to Write's editor would be a new mark, so it needs Nick's word first. Until then, Read must not make `href` required.

## 3. `work` (optional; SOCIAL ask 3: yes)
`{ "id": "<Write project id>", "title": "<project title>", "position": <the page's place in the project's existing section order> }`. All of it is derived from data Write already has. It's absent for a loose or Journal page.

## 4. `provenance`
- `imported`: `true` when the page was born through Write's Import door (the existing `importedAt` on the page), otherwise `false`. **It's a label, never a gate** (Nick).
- `making`: **OPEN (Nick, deferred).** It's absent in v1 until he decides. Read must work with it missing.

## 5. Never in an export
- Tutor conversations.
- Writing-session records.
- Deleted or purged pages.
- Any page other than the one exported (a board's pinned page is a pointer, not content).
- Settings, unlocks, or anything about other people.

## 6. Coming back the other way: notes (planned, separate contract)
Nick (Oct 31) wants a writer to see the comments their piece has received **while working on it in Write**. Fable's architecture, which notes-feed draft 0 will spell out:
- Comments, highlights and reviewers' ink are **stored only in Read**.
- Write **shows them read-only**, fetched live from Read with the writer's own sign-in. Write stores none of it, so Write gains no new saved data.
- **Anchors:** a quote of the highlighted words plus a little text before and after, tied to the `revision` the reader saw. When the writer has since edited, a note re-finds its words by the quote. A note whose words are gone is shown as "on an earlier version", never dropped silently.
- **Reviewers' ink** is in Write's stroke model, on that revision's page. Write shows it over the matching revision only.
- Where the notes appear in Write's drawers is a Wrizors design job, and it's done the same way in every theme.

## 7. Rendering in Read: one page surface (SOCIAL's question 4)
**Ruled (Fable, Oct 31):** Write publishes a **read-only page package** (working name `@wrizo/page-view`) that Read pins by version:
- the page layout;
- the one mark reader;
- the stroke renderer.

It carries no writing tools. Read's own layers (highlights, comments, reviewers' pens) sit on top of it, in Read.
**Why:** strokes live in the page's own coordinates, and only Write's own layout puts them back exactly where they were drawn. A second copy of the page would drift.
**When:** the package is extracted after Write's cleanup (deploy #13). Until then, Read's R3/R4 lanes build against this contract with a stand-in renderer that uses the theme token names.

## 8. How a piece leaves Write
It leaves by **a writer's action** (a "Publish to Read" step in Write, designed later). The export is sent to Read's import endpoint under the writer's own sign-in. Nothing is ever exported automatically.
**For mocking:** export files saved as JSON, in this shape.

## 9. Versioning
`version` is 1. Fields may be added in v1 (Read ignores what it doesn't know). Removing or changing a field means version 2.
