import { getJournalEntry, getProject, isAutoSet } from '../store/persistence';
import { exportPageFiles, safeFilenameBase, dateStampFallback } from '../store/pageExport';
import { firstLine } from '../store/entryText';
import { wordCount } from '../store/wordCount';
import { decorateMarkdownForCard } from '../store/draftDecoration';
import { triggerDownload } from '../store/download';
import { copyText } from '../store/clipboard';
import { recordShadow } from '../store/voiceWall';
import { partsOfDoc } from './parts';
import { publicationText, chosenParts, wrapHtml, type PubFormat, type PubPart } from './publishingText';
import { REORG } from './flag';

// PUBLISHING AS A VIEW, AND EXPORT (reorg-plan-v2 #5 and #6; Fable Nov 20, 11:45 am: "the whole Doc as one read-only scroll, each Part under its heading, as the prototype draws it
// (stage-table.js, FINALIZE); export the whole Doc or chosen Parts, in order, today's .md and .txt. Red-first; switch-gated; no new saved data"; and 1:27 pm: "FINALIZE = your publish view:
// add Copy Text and Copy as Formatted, plus Export > Web (HTML) beside Markdown and Plain Text").
// This file READS the store and never writes it: the view and the files are built from what is stored, and the ticks that choose what goes out live in the view's own state, nowhere else.
// The words themselves come from the one export seam the app already has (store/pageExport.ts exportPageFiles: md keeps the conventions, txt reads the words, a Part's ink gets the same honest
// note), so a Part exports exactly as it does on its own. How the Parts are laid end to end is publishingText.ts (pure, unit-checked).

/** One Part as the view draws it: what goes out (PubPart, with its web markup) plus what the scroll needs. */
export interface PubViewPart extends PubPart {
  n: number;
  /** the heading drawn: her own name, else the Part's first words (the Parts list's own rule) */
  heading: string;
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

/** What the view's list is made of, as one string: the Parts, their order, their names. The view re-reads when it changes (a Part moved from the Front menu), never on her words. */
export function publicationSignature(entryId: string): string {
  // light on purpose: no markup is built, only the ids, levels and names
  const e0 = getJournalEntry(entryId);
  if (!e0) return '';
  const set = e0.projectId ? getProject(e0.projectId) : null;
  if (!set || isAutoSet(set)) return e0.id;
  return `${set.id}\u0001${set.title}\u0001${partsOfDoc(set.id).map((p) => `${p.id}:${p.level}:${p.name}`).join('\u0001')}`;
}

/** The list the Front menu's PARTS tab draws while she is in FINALIZE: the Parts in the Doc's order with their levels, and the Doc's id (null for a loose page: nothing to put in order). Light: no markup. */
export function publicationList(entryId: string): { docId: string | null; rows: Array<{ id: string; n: number; heading: string; level: number }> } {
  const e0 = getJournalEntry(entryId);
  if (!e0) return { docId: null, rows: [] };
  const set = e0.projectId ? getProject(e0.projectId) : null;
  if (!set || isAutoSet(set)) return { docId: null, rows: [{ id: e0.id, n: 1, heading: (e0.pageSettings?.name ?? '').trim() || firstLine(e0.text ?? '').trim(), level: 0 }] };
  return { docId: set.id, rows: partsOfDoc(set.id).map((p, i) => ({ id: p.id, n: i + 1, heading: p.name, level: p.level })) };
}

export interface PubFile { filename: string; content: string; count: number; mime: string }

const MIME: Record<PubFormat, string> = { md: 'text/markdown', txt: 'text/plain', html: 'text/html' };

/** The file for the Parts chosen (`ids` null: every Part), in the Doc's own order. Nothing chosen: no file (count 0). */
export function publicationFile(doc: PubDoc, format: PubFormat, ids: readonly string[] | null): PubFile | null {
  const text = publicationText(doc.title, doc.parts, format, ids);
  if (text.count === 0) return null;
  const some = ids !== null && chosenParts(doc.parts, ids).length < doc.parts.length;
  const base = safeFilenameBase(doc.name, dateStampFallback()) + (some ? ` (${text.count} of ${doc.parts.length} Parts)` : '');
  return { filename: `${base}.${format}`, content: format === 'html' ? wrapHtml(doc.name || base, text.content) : text.content, count: text.count, mime: MIME[format] };
}

/** Hand the file to the browser's own download (the app's one mechanism). False when nothing was chosen or the download could not start. */
export function downloadPublication(doc: PubDoc, format: PubFormat, ids: readonly string[] | null): boolean {
  const f = publicationFile(doc, format, ids);
  return !!f && triggerDownload(f.filename, f.content, f.mime);
}

/** What the clipboard is given, for the Parts chosen: the plain words (Copy Text) or the words as the page draws them with the plain words beside (Copy as Formatted). Null: nothing chosen. */
export function publicationCopy(doc: PubDoc, kind: 'text' | 'formatted', ids: readonly string[] | null): { plain: string; html: string | null } | null {
  const plain = publicationText(doc.title, doc.parts, 'txt', ids);
  if (plain.count === 0) return null;
  return { plain: plain.content, html: kind === 'formatted' ? publicationText(doc.title, doc.parts, 'html', ids).content : null };
}

/** Copy the Parts chosen. Formatted puts web markup AND the plain words on the clipboard (the receiving app takes the one it reads); where the browser cannot, the plain words go. True only when something landed. */
export async function copyPublication(doc: PubDoc, kind: 'text' | 'formatted', ids: readonly string[] | null): Promise<boolean> {
  const c = publicationCopy(doc, kind, ids);
  if (!c) return false;
  if (c.html !== null && typeof navigator !== 'undefined' && navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
    recordShadow(c.plain);   // the writer's own words, copied out: pasting them back passes the wall (copyText's own rule)
    (window as unknown as { __wzLastCopy?: string; __wzLastCopyHtml?: string }).__wzLastCopy = c.plain;
    (window as unknown as { __wzLastCopyHtml?: string }).__wzLastCopyHtml = c.html;
    try {
      await navigator.clipboard.write([new ClipboardItem({
        'text/html': new Blob([c.html], { type: 'text/html' }),
        'text/plain': new Blob([c.plain], { type: 'text/plain' }),
      })]);
      return true;
    } catch { /* fall through to the plain words */ }
  }
  return copyText(c.plain);
}

// the harness's door: read and build, the same functions the view calls; present only under the reorg switch
if (REORG && typeof window !== 'undefined') {
  (window as unknown as { wrizoPublish?: unknown }).wrizoPublish = {
    read: (id: string) => readPublication(id),
    file: (id: string, format: PubFormat, ids: string[] | null) => { const d = readPublication(id); return d ? publicationFile(d, format, ids) : null; },
    copy: (id: string, kind: 'text' | 'formatted', ids: string[] | null) => { const d = readPublication(id); return d ? publicationCopy(d, kind, ids) : null; },
  };
}
