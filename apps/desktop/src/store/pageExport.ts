import type { JournalEntry, Project } from '../types';
import { firstLine } from './entryText';
import { stripMarkdownConventions } from './draftFormat';
import { serializeScriptDoc, plainScriptWords } from './scriptText';
import { describePageHome } from './pageHome';
import { getProject, getJournalEntry, getJournalEntries, getBinderPages, getSystemKind } from './persistence';

// E1 S3 — real file export, the ticket's own reason for existing. Pure,
// theme-independent content/naming logic (no hook, no React) — the download
// mechanism itself lives in store/download.ts; PageEditor.tsx/ScriptEditor.tsx
// call these functions and hand the result to triggerDownload(). Kept apart
// from store/clipboard.ts's payloads on purpose: Copy's payload is untouched
// by this ticket (still exactly the writer's page text, nothing appended);
// only a DOWNLOADED file gets the honest ink-placeholder appendix below, per
// the brief's own "if a kind cannot be exported faithfully, the export says
// so in the file itself" — that is a property of the FILE, not of the
// clipboard payload Copy already ships.
//
// Exported file BODY TEXT (titles, the ink placeholder, "(No pages…)",
// section separators) is deliberately NOT routed through deskLexicon: that
// seam is reactive UI vocabulary keyed to the live theme
// (Plateau/Flux/…) and rendered by hook-bearing components; an exported
// file is a durable, portable artifact read later, possibly in a plain text
// editor, with the app and its theme nowhere in sight — TU2 S2's own
// precedent draws exactly this line ("not writer-facing chrome... does NOT
// route through this lexicon") for the same reason. Every string that is
// actual app UI (the Download section's own button labels, the toast
// confirmations) DOES route through deskLexicon, in PageEditor.tsx/
// ScriptEditor.tsx.

// Windows is the strict superset of illegal filename characters this app
// needs to avoid: < > : " / \ | ? * plus every ASCII control character.
// macOS additionally rejects a literal ':' (already covered) and treats a
// leading '.' as a hidden-file marker (harmless, not illegal) — no extra
// handling needed there. Trailing dots/spaces are a Windows-only rejection,
// trimmed defensively regardless of platform.
const ILLEGAL_FS_CHARS = /[<>:"/\\|?*\x00-\x1f]/g;
const MAX_BASENAME_LEN = 80;

export function safeFilenameBase(raw: string | null | undefined, fallback: string): string {
  let s = (raw ?? '').replace(ILLEGAL_FS_CHARS, ' ').replace(/\s+/g, ' ').trim();
  s = s.replace(/[.\s]+$/, ''); // Windows: a trailing dot or space is stripped by the OS (or rejected outright)
  if (!s) s = fallback;
  s = s.slice(0, MAX_BASENAME_LEN).trim();
  return s || fallback;
}

// A plain, sortable, filesystem-safe date stamp — the fallback name for a
// page whose first line is empty (a blank fresh page).
export function dateStampFallback(at: Date = new Date()): string {
  const y = at.getFullYear();
  const m = String(at.getMonth() + 1).padStart(2, '0');
  const d = String(at.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// The one honest placeholder for content this export cannot render as text
// — never silently dropped, always a named line in its place.
const INK_PLACEHOLDER = '[Hand-drawn ink — not exported as text.]';

function withInkNote(body: string, entry: JournalEntry): string {
  if (entry.strokes && entry.strokes.length > 0) {
    return `${body}\n\n${INK_PLACEHOLDER} (this page also carries hand-drawn ink alongside the text above)`;
  }
  return body;
}

// A Board's honest export: a plain list of its cards' text, with titles
// (derived from each card's own first line, the same convention every page
// title already uses). Ink cards degrade to the named placeholder; a
// page-pin card is a MEMBERSHIP reference, not a copy — it names the page it
// points at rather than duplicating that page's content here (the
// referenced page gets its own full entry elsewhere in a multi-page export,
// or can be downloaded directly on its own).
function boardBody(entry: JournalEntry): string {
  const boxes = (entry.boxes ?? []).filter(b => b.kind === 'text' || b.kind === 'ink' || b.kind === 'page-pin');
  if (boxes.length === 0) return '(No cards on this board.)';
  const parts: string[] = [];
  for (const box of boxes) {
    if (box.kind === 'ink') {
      parts.push(`## Ink card\n\n${INK_PLACEHOLDER}`);
    } else if (box.kind === 'page-pin') {
      const ref = box.entryId ? getJournalEntry(box.entryId) : null;
      const refTitle = ref ? firstLine(ref.text ?? '') : 'a page';
      parts.push(`## Pinned: ${refTitle}\n\n[A membership card pointing at another page — see that page's own entry.]`);
    } else {
      const title = firstLine(box.text ?? '');
      parts.push(`## ${title}\n\n${box.text ?? ''}`);
    }
  }
  return parts.join('\n\n---\n\n');
}

// "Copy Formatted"'s own payload, reused: the page's text with its
// formatting conventions intact. Non-prose kinds degrade honestly rather
// than perfectly (S3's own words) — a Script page uses the existing
// serializeScriptDoc; a Board uses the card-list rendering above.
export function pageBodyFormatted(entry: JournalEntry): string {
  if (entry.pageType === 'script') return entry.script ? serializeScriptDoc(entry.script) : (entry.text ?? '');
  if (entry.pageType === 'board') return boardBody(entry);
  return entry.text ?? '';
}

// "Copy My Words"'s own payload, reused: the same text, conventions
// stripped back to honest plain reading text.
export function pageBodyPlain(entry: JournalEntry): string {
  if (entry.pageType === 'script') return entry.script ? plainScriptWords(entry.script) : (entry.text ?? '');
  if (entry.pageType === 'board') return boardBody(entry); // no separate "plain" convention for a card list
  return stripMarkdownConventions(entry.text ?? '');
}

export interface PageExportFiles {
  base: string; // filename WITHOUT extension — callers append .md / .txt
  md: string;
  txt: string;
}

// "This Page" scope — one .md (formatted) + one .txt (plain words) pair,
// named from the page's own first line (falling back to a date stamp for a
// blank page). Callers pass the LIVE entry shape (PageEditor's `entry` with
// `text` patched to the live ref, or ScriptEditor's persisted entry merged
// with its own live-reconstructed `script` doc) so an unsaved keystroke is
// never lost to a debounce window — see the call sites' own comments.
export function exportPageFiles(entry: JournalEntry): PageExportFiles {
  const base = safeFilenameBase(firstLine(entry.text ?? ''), dateStampFallback());
  return {
    base,
    md: withInkNote(pageBodyFormatted(entry), entry),
    txt: withInkNote(pageBodyPlain(entry), entry),
  };
}

export interface MultiDocResult {
  filename: string;
  content: string;
  count: number;
}

const PAGE_SEPARATOR = '\n\n---\n\n';

// One page's own block inside a multi-page document: an H1 title (the same
// first-line convention as its filename), an honest "where it lives" line
// (store/pageHome.ts — the SAME truthful label the Page face shows live),
// then its body. The H1 is also the harness's own parse anchor for "count
// the pages actually in this file" (`/^# /m`).
function pageBlock(entry: JournalEntry): string {
  const title = firstLine(entry.text ?? '');
  const project = entry.projectId ? getProject(entry.projectId) : null;
  const { homeLabel } = describePageHome(entry, project);
  const body = withInkNote(pageBodyFormatted(entry), entry);
  return `# ${title}\n\n_${homeLabel}_\n\n${body}`;
}

// "This Binder" scope — every page filed to this binder, in the binder's
// OWN order. `getBinderPages` itself sorts by most-recently-touched
// (persistence.ts's own general-purpose order); the binder's own READING
// order — the one ProjectHome.tsx actually displays chapters in
// (`pages.slice().sort((a,b) => a.createdAt.localeCompare(b.createdAt))`) —
// is creation order, reproduced here verbatim so the exported document
// reads in the same order the writer sees on the page. Every page type
// filed to the binder is included (manuscript, script, support, boards),
// not chapters alone — completeness beats elegance, per the brief.
//
// Delivered as ONE concatenated document with clear `---` separators, not a
// folder-shaped set of files: a true multi-file/zip download needs either a
// new dependency (disqualified — zero new deps) or firing N separate
// browser downloads, which is not reliably scriptable client-side and reads
// as a barrage, not a delivery. A single file is the simpler, more reliable
// choice the brief's own words invite ("builder's call, disclosed").
export function exportBinderDocument(project: Project): MultiDocResult {
  const pages = getBinderPages(project.id).slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const content = pages.length ? pages.map(pageBlock).join(PAGE_SEPARATOR) : '(No pages in this binder yet.)';
  const filename = `${safeFilenameBase(project.title, dateStampFallback())}.md`;
  return { filename, content, count: pages.length };
}

// "Everything" scope — THE vacation insurance. Every live page the writer
// owns: filed binder pages, the Journal, loose pages, boards, scripts —
// every JournalEntry row that isn't soft-deleted. `getJournalEntries()` is
// the one universal, home-agnostic enumeration already in this codebase (it
// backs zero UI itself — every home-specific list is a filtered VIEW of the
// same cache), so this scope literally cannot miss a home a future ticket
// might add without this file's own knowledge. The three system Boards
// (Journal/Trash/Shelf) are excluded: their own `boxes` are DERIVED
// membership mirrors of pages already being exported directly by this same
// pass (a page-pin per member) — including them would duplicate every
// page's title a second time as a card, never add a single word that
// isn't already present verbatim in that page's own real entry.
// Chronological (oldest first) — a coherent life-of-the-work reading order,
// not required by the brief but the more legible default for one long file.
export function exportEverythingDocument(): MultiDocResult {
  const pages = getJournalEntries()
    .filter(e => getSystemKind(e) === undefined)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const content = pages.length ? pages.map(pageBlock).join(PAGE_SEPARATOR) : '(Nothing written yet.)';
  const filename = `Everything — ${dateStampFallback()}.md`;
  return { filename, content, count: pages.length };
}
