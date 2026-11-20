import { getJournalEntry, getProject, isAutoSet } from '../store/persistence';
import { exportPageFiles, safeFilenameBase, dateStampFallback } from '../store/pageExport';
import { firstLine } from '../store/entryText';
import { wordCount } from '../store/wordCount';
import { decorateMarkdownForCard } from '../store/draftDecoration';
import { triggerDownload } from '../store/download';
import { partsOfDoc } from './parts';
import { publicationText, chosenParts, type PubFormat, type PubPart } from './publishingText';
import { REORG } from './flag';

// PUBLISHING AS A VIEW, AND EXPORT (reorg-plan-v2 #5 and #6; Fable Nov 20, 11:45 am: "the whole Doc as one read-only scroll, each Part under its heading, as the prototype draws it
// (stage-table.js, FINALIZE); export the whole Doc or chosen Parts, in order, today's .md and .txt. Red-first; switch-gated; no new saved data").
// This file READS the store and never writes it: the view and the files are built from what is stored, and the ticks that choose what goes out live in the view's own state, nowhere else.
// The words themselves come from the one export seam the app already has (store/pageExport.ts exportPageFiles: md keeps the conventions, txt reads the words, a Part's ink gets the same honest
// note), so a Part exports exactly as it does on its own. How the Parts are laid end to end is publishingText.ts (pure, unit-checked).

/** One Part as the view draws it: what goes out (PubPart) plus what the scroll needs. */
export interface PubViewPart extends PubPart {
  n: number;
  /** the heading drawn: her own name, else the Part's first words (the Parts list's own rule) */
  heading: string;
  /** the Part's words as read-only HTML (the page's own marks collapsed, as a card or the Book shows them) */
  html: string;
  words: number;
  /** no words and no ink: the view says so in a line, the file says nothing */
  empty: boolean;
}

export interface PubDoc {
  /** the set's id; null for a loose page (a Doc of one Part the app made, not the writer) */
  docId: string | null;
  /** what the files lead with; null for a loose page, whose own words are the whole document */
  title: string | null;
  /** what the file is called */
  name: string;
  parts: PubViewPart[];
}

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** The Doc this page is a Part of, read from the store (the caller flushes the open page's typing first). Null: no such page. */
export function readPublication(entryId: string): PubDoc | null {
  const e0 = getJournalEntry(entryId);
  if (!e0) return null;
  const set = e0.projectId ? getProject(e0.projectId) : null;
  const made = !!set && !isAutoSet(set);
  const rows = made && set
    ? partsOfDoc(set.id).map((p) => ({ id: p.id, name: p.named ? p.name : '', heading: p.name, level: p.level }))
    : [{ id: e0.id, name: (e0.pageSettings?.name ?? '').trim(), heading: (e0.pageSettings?.name ?? '').trim() || firstLine(e0.text ?? '').trim(), level: 0 }];
  const parts: PubViewPart[] = [];
  rows.forEach((r, i) => {
    const e = getJournalEntry(r.id);
    if (!e) return;
    const files = exportPageFiles(e);
    const prose = e.pageType !== 'script' && e.pageType !== 'board' && !e.pageSettings?.template;
    const words = wordCount(files.txt);
    parts.push({
      id: e.id, name: r.name, level: r.level, md: files.md, txt: files.txt,
      n: i + 1, heading: r.heading, words,
      html: prose ? decorateMarkdownForCard(e.text ?? '', null) : esc(files.txt),
      empty: words === 0 && !(e.strokes && e.strokes.length > 0),
    });
  });
  const title = made && set ? set.title : null;
  return { docId: made && set ? set.id : null, title, name: title ?? parts[0]?.heading ?? '', parts };
}

export interface PubFile { filename: string; content: string; count: number; mime: string }

/** The file for the Parts chosen (`ids` null: every Part), in the Doc's own order. Nothing chosen: no file (count 0). */
export function publicationFile(doc: PubDoc, format: PubFormat, ids: readonly string[] | null): PubFile | null {
  const text = publicationText(doc.title, doc.parts, format, ids);
  if (text.count === 0) return null;
  const some = ids !== null && chosenParts(doc.parts, ids).length < doc.parts.length;
  const base = safeFilenameBase(doc.name, dateStampFallback()) + (some ? ` (${text.count} of ${doc.parts.length} Parts)` : '');
  return { filename: `${base}.${format}`, content: text.content, count: text.count, mime: format === 'md' ? 'text/markdown' : 'text/plain' };
}

/** Hand the file to the browser's own download (the app's one mechanism). False when nothing was chosen or the download could not start. */
export function downloadPublication(doc: PubDoc, format: PubFormat, ids: readonly string[] | null): boolean {
  const f = publicationFile(doc, format, ids);
  return !!f && triggerDownload(f.filename, f.content, f.mime);
}

// the harness's door: read and build, the same functions the view calls; present only under the reorg switch
if (REORG && typeof window !== 'undefined') {
  (window as unknown as { wrizoPublish?: unknown }).wrizoPublish = {
    read: (id: string) => readPublication(id),
    file: (id: string, format: PubFormat, ids: string[] | null) => { const d = readPublication(id); return d ? publicationFile(d, format, ids) : null; },
  };
}
