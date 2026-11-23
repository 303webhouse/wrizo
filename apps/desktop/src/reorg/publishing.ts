import type { JournalEntry } from '../types';
import { getJournalEntry, getProject, isAutoSet } from '../store/persistence';
import { exportPageFiles, safeFilenameBase, dateStampFallback } from '../store/pageExport';
import { firstLine } from '../store/entryText';
import { wordCount } from '../store/wordCount';
import { decorateMarkdownForCard } from '../store/draftDecoration';
import { triggerDownload } from '../store/download';
import { copyText } from '../store/clipboard';
import { recordShadow } from '../store/voiceWall';
import { partsOfDoc } from './parts';
import { publicationText, chosenParts, wrapHtml, noteMarker, type PubAsset, type PubAttach, type PubFormat, type PubNote, type PubPart, type PubPlan } from './publishingText';
import { attachKey, docAssetsOf } from './docSettings';
import { planRows, titleOfText } from './backMenu/planOps';
import { docOfPage, partOfRow } from './backMenu/planPart';
import { liveBoxes } from '../store/boxTombstones';
import { markdownToHtml, plainToHtml, inlineHtml } from './publishingHtml';
import type { BxPart } from './beforeExportRules';
import { readNotes, writeMarkers } from './footnotes';
import { stripLine } from '../store/markRuns';
import { REORG, reorgFor } from './flag';
import { getTheme } from '../store/theme';

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
  /** the Part's words as the sheet paints them (the app's own marks, collapsed by its stylesheet): only for the sheet; the files and the clipboard take `html`, which stands on its own */
  view: string;
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

/** A Part with no words and no ink: the one rule the sheet's "Nothing written in this Part yet." and Before You Export's count both use. */
const isEmptyPart = (e: JournalEntry, words: number): boolean => words === 0 && !(e.strokes && e.strokes.length > 0);

/** What Before You Export reads (reorg/beforeExportRules.ts): each Part of the Doc in its order, with its number, its heading and whether it has no words. Light: no markup is built. */
export function publicationFacts(entryId: string): BxPart[] {
  return publicationList(entryId).rows.map((r) => {
    const e = getJournalEntry(r.id);
    return { id: r.id, n: r.n, heading: r.heading, empty: !e || isEmptyPart(e, wordCount(exportPageFiles(e).txt)) };
  });
}

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
    const prose = e.pageType !== 'script' && e.pageType !== 'board' && !e.pageSettings?.template;
    // footnotes and endnotes (Nick ruled A, Nov 21): the note lines leave the words, each [^label] in them becomes a private marker the file's own numbering replaces (publishingText.ts layNotes), and the notes go beside the Part already written for the three formats
    const nb = reorgFor(getTheme()) && prose ? readNotes(e.text ?? '') : null;
    const notes: PubNote[] = nb ? nb.notes.map((n) => ({ label: n.label, endnote: n.endnote, md: n.text, txt: stripLine(n.text), html: inlineHtml(n.text) })) : [];
    const files = exportPageFiles(nb && nb.notes.length > 0 ? { ...e, text: writeMarkers(nb.body, nb.notes.map((n) => n.label), noteMarker) } : e);
    const words = wordCount(files.txt);
    parts.push({
      id: e.id, name: r.name, level: r.level, md: files.md, txt: files.txt, ...(notes.length > 0 ? { notes } : {}),
      n: i + 1, heading: r.heading, words,
      html: prose ? markdownToHtml(files.md) : plainToHtml(files.txt),
      view: prose ? decorateMarkdownForCard(e.text ?? '', null) : esc(files.txt),
      empty: isEmptyPart(e, words),
    });
  });
  const title = made && set ? set.title : null;
  return { docId: made && set ? set.id : null, title, name: title ?? parts[0]?.heading ?? '', parts };
}

/** The open page's own Plan as the file carries it (item 5a): the rows of the board its Plan tab shows, hidden cards left out, in her order and indents. Null: no board, or nothing on it. Read at the moment of export, so a row she moved while the sheet was open is as she left it. */
export function publicationPlan(entryId: string, label: string, untitled: string): PubPlan | null {
  const page = getJournalEntry(entryId);
  const board = page?.planBoardId ? getJournalEntry(page.planBoardId) : null;
  if (!page || !board) return null;
  const hidden = new Set<string>(page.pageSettings?.hiddenPlanCards ?? []);
  const rows = planRows(liveBoxes(board.boxes), hidden, (b) => (b.entryId ? titleOfText(getJournalEntry(b.entryId)?.text) : ''));
  return rows.length === 0 ? null : { label, rows: rows.map((r) => ({ number: r.number, depth: r.depth, title: r.title || untitled })) };
}

/** One asset of the Doc as the file carries it, or null when it is gone (a deleted page, a card no longer on its board): a missing thing is not attached, nothing else is dropped. A page or board goes out as its own export does
 *  (the same seam a Part uses); one card of a board goes out as a board of that one card, so its text, a pinned page's name or the honest ink note are written exactly as the board's own export writes them. */
function assetSrc(a: { entryId: string; boxId?: string }, untitled: string): { src: JournalEntry; title: string } | null {
  const e = getJournalEntry(a.entryId);
  if (!e) return null;
  if (a.boxId) {
    const box = liveBoxes(e.boxes).find((b) => b.id === a.boxId);
    if (!box) return null;
    return { src: { ...e, pageType: 'board', boxes: [box] }, title: firstLine(box.text ?? '').trim() || untitled };
  }
  return { src: e, title: (e.pageSettings?.name ?? '').trim() || firstLine(e.text ?? '').trim() || untitled };
}

function assetOut(a: { entryId: string; boxId?: string }, untitled: string): PubAsset | null {
  const s = assetSrc(a, untitled);
  if (!s) return null;
  const files = exportPageFiles(s.src);
  const prose = s.src.pageType !== 'script' && s.src.pageType !== 'board' && !s.src.pageSettings?.template;
  return { title: s.title, md: files.md, txt: files.txt, html: prose ? markdownToHtml(files.md) : plainToHtml(files.txt) };
}

/** The Doc's own assets she can attach: each with the key it is ticked under and the name it is listed by. A missing one (a deleted page, a card gone from its board) is not offered. Light: no file is built. */
export function attachables(entryId: string, untitled: string): Array<{ key: string; title: string }> {
  const out: Array<{ key: string; title: string }> = [];
  for (const a of docAssetsOf(entryId)) {
    const s = assetSrc(a, untitled);
    if (s) out.push({ key: attachKey(a), title: s.title });
  }
  return out;
}

/** The assets she ticked, as the file carries them (item 5b; stage menus A4: attached only if she chooses, never by default): the Doc's OWN assets (docSettings `assets`, reorg/docSettings.ts) whose key is in `picked`, in the order they joined
 *  the Doc. Null: none ticked, none left, or a loose page (it has no Doc-level assets). Read at the moment of export. */
export function publicationAttach(entryId: string, label: string, untitled: string, picked: ReadonlySet<string>): PubAttach | null {
  if (picked.size === 0) return null;
  const items: PubAsset[] = [];
  for (const a of docAssetsOf(entryId)) {
    if (!picked.has(attachKey(a))) continue;
    const out = assetOut(a, untitled);
    if (out) items.push(out);
  }
  return items.length === 0 ? null : { label, items };
}

/** How many of the open page's own Plan rows have no Part (Before You Export's line; stage menus F4): the rows of the board its Plan tab shows, hidden cards left out, a pinned page or an ink card never counted (neither takes a Part). A row has a Part when
 *  FIX's partOfRow finds one in this Doc. Light: nothing is built. 0 for a page with no Plan. */
export function unattachedPlanRows(entryId: string): number {
  const page = getJournalEntry(entryId);
  const board = page?.planBoardId ? getJournalEntry(page.planBoardId) : null;
  if (!page || !board) return 0;
  const hidden = new Set<string>(page.pageSettings?.hiddenPlanCards ?? []);
  const docId = docOfPage(entryId);
  return planRows(liveBoxes(board.boxes), hidden).filter((r) => !r.isPin && !r.isInk && !partOfRow(board.id, r.boxId, docId)).length;
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
export function publicationFile(doc: PubDoc, format: PubFormat, ids: readonly string[] | null, plan: PubPlan | null = null, attach: PubAttach | null = null): PubFile | null {
  const text = publicationText(doc.title, doc.parts, format, ids, plan, attach);
  if (text.count === 0) return null;
  const some = ids !== null && chosenParts(doc.parts, ids).length < doc.parts.length;
  const base = safeFilenameBase(doc.name, dateStampFallback()) + (some ? ` (${text.count} of ${doc.parts.length} Parts)` : '');
  return { filename: `${base}.${format}`, content: format === 'html' ? wrapHtml(doc.name || base, text.content) : text.content, count: text.count, mime: MIME[format] };
}

/** Hand the file to the browser's own download (the app's one mechanism). False when nothing was chosen or the download could not start. */
export function downloadPublication(doc: PubDoc, format: PubFormat, ids: readonly string[] | null, plan: PubPlan | null = null, attach: PubAttach | null = null): boolean {
  const f = publicationFile(doc, format, ids, plan, attach);
  return !!f && triggerDownload(f.filename, f.content, f.mime);
}

/** What the clipboard is given, for the Parts chosen: the plain words (Copy Text) or the words as the page draws them with the plain words beside (Copy as Formatted). Null: nothing chosen. */
export function publicationCopy(doc: PubDoc, kind: 'text' | 'formatted', ids: readonly string[] | null, plan: PubPlan | null = null, attach: PubAttach | null = null): { plain: string; html: string | null } | null {
  const plain = publicationText(doc.title, doc.parts, 'txt', ids, plan, attach);
  if (plain.count === 0) return null;
  return { plain: plain.content, html: kind === 'formatted' ? publicationText(doc.title, doc.parts, 'html', ids, plan, attach).content : null };
}

/** Copy the Parts chosen. Formatted puts web markup AND the plain words on the clipboard (the receiving app takes the one it reads); where the browser cannot, the plain words go. True only when something landed. */
export async function copyPublication(doc: PubDoc, kind: 'text' | 'formatted', ids: readonly string[] | null, plan: PubPlan | null = null, attach: PubAttach | null = null): Promise<boolean> {
  const c = publicationCopy(doc, kind, ids, plan, attach);
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
