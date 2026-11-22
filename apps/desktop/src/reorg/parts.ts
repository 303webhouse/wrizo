// REORG PHASE 3 - THE PARTS UNDERNEATH (Fable, Nov 19, 3:55 pm; reorg-plan.md section 8, reorg-plan-tech.md section 2). Behind ?reorg=1, Machina only: this file is the data layer, with no screen in it.
//
// THE MODEL. A DOC is a set (a `projects` row, as today). A PART is one entry (a journal entry that is not a board) filed in that set, in the writer's order (`orderIndex`,
// the order `compareSections` already reads). Each Part keeps its own text, as every page does, so the editor still works on one text at a time and a save still re-sends one
// page, not the book (reorg-plan.md section 8: "Why each section keeps its own text"). A Doc with one Part shows no list; that is the screen's rule, not this file's.
//
// WHAT IS SAVED, AND WHERE (Fable's saved-data ruling, Nov 19, 4:05 pm: everything a writer changes is saved to the ACCOUNT and syncs). Every per-Part value is a KEY INSIDE
// `pageSettings`, which already travels whole in `journal_entries.page_settings` (jsonb): no table, no column, no migration, and an older client carries an unknown key through
// untouched. Each key is ABSENT, never null, on every Part that never chose (the `kind` / `template` rule). The keys are named in types/page.ts:
//   name        a Part's name. Absent: the first few words of its text stand in (the Sep 12 rule).
//   level       0, 1 or 2: a Part can sit one or two levels under the one above (Act, then Scene). A flat ordered list with levels, no parent pointers, so a move can never leave a
//               child pointing at a missing parent under last-writer-wins.
//   color       a SLOT from PART_COLORS ('a' to 'f'): each theme draws its own six (Fable, Nov 20); or, since colour B (Fable, Nov 21), exactly #RRGGBB (her own custom colour, written in capitals). Never a colour name.
//               An old clay..plum is READ as its slot, never written back.
//   template    the existing `PageTemplate` lens key (outline / title / bibliography), set through here too.
//   lengthLimit { unit, max }: the writer's own ceiling for this Part.
// None of them is dress: store/pageDefaults.ts strips all four new ones, so "Set as my default" on one Part never names, colours or limits every future page.
//
// THE LAWS THIS FILE KEEPS.
//   - Splitting and joining are LOSSLESS and ordered so a sync that stops between two writes loses nothing: a split writes the new Part (the tail) FIRST and shortens the source
//     SECOND; a join appends to the Part above FIRST and soft-deletes the emptied Part SECOND (a soft delete is a tombstone that travels; nothing is ever hard-deleted here).
//     At any instant between the two writes every character of the original still lives in a stored row. A split followed by a join returns the same string, byte for byte.
//   - A re-order, a level, a colour, a name and a limit never write a word: they write `orderIndex` and `pageSettings`, never `text`, `strokes`, `boxes` or `tutor`.
//   - A join REFUSES a Part that carries ink, cards, links or a Tutor thread, with a reason, rather than dropping them silently.
//   - "Make it its own Doc": the new set is written FIRST, then the Parts move into it.
import type { JournalEntry, PageSettings, PageTemplate, ScriptDoc } from '../types';
import { PAGE_SETTINGS_FALLBACK } from '../types';
import {
  createBinder, createBinderPage, flushNow, getJournalEntries, getJournalEntry, getProject, getSystemKind, isAutoSet, isPairedPlanBoard, saveJournalEntry,
  softDeleteEntry,
} from '../store/persistence';
import { restoreEntry } from '../store/persistence/restore';
import { ensureSet, reorderSections } from '../store/place';
import { firstPlainLine } from '../store/entryText';
import { wordCount } from '../store/wordCount';   // the ONE word counter (c13-10f: no private copy)
import { getUserPageDefaults } from '../store/pageDefaults';
import { readMarks, closeMark } from '../store/markRuns';
import { liveBoxes } from '../store/boxTombstones';
import { joinWithNotes, splitWithNotes } from './footnotes';   // footnotes and endnotes are the last lines of a Part's text: a split and a join carry them (Nick ruled A, Nov 21)

// ---------------------------------------------------------------- the saved keys

/** The fixed set of Part colours, by SLOT (Fable, Nov 20: "store slots a-f, never a colour name or a hex"). Each theme draws its own six (Machina's tags A-F, Flux 01-06); colour is never the only signal: the row pairs it with a label or a shape. */
export const PART_COLORS = ['a', 'b', 'c', 'd', 'e', 'f'] as const;
export type PartColor = (typeof PART_COLORS)[number];
export const isPartColor = (v: unknown): v is PartColor => typeof v === 'string' && (PART_COLORS as readonly string[]).includes(v);

/** The names this key held before the slots (Nov 19 to 20), in the order they become the slots. Read once, as the slot: nothing is rewritten by a read. */
const OLD_COLOR_NAMES: Record<string, PartColor> = { clay: 'a', amber: 'b', moss: 'c', teal: 'd', slate: 'e', plum: 'f' };
/** A stored colour as a slot: a slot as itself, an old name as its slot, anything else (a hex, a stray word) as none. */
export function colorSlot(v: unknown): PartColor | null {
  if (isPartColor(v)) return v;
  return typeof v === 'string' && Object.prototype.hasOwnProperty.call(OLD_COLOR_NAMES, v) ? OLD_COLOR_NAMES[v] : null;
}

/** A custom colour (colour B, Fable, Nov 21): exactly #RRGGBB. The picker (ARBOR's, "Custom" and a hex field) hands one in; this layer validates it and stores it in capitals, so one colour has one spelling. */
export type PartHex = `#${string}`;
const HEX_COLOUR = /^#[0-9A-Fa-f]{6}$/;
export const isHexColour = (v: unknown): v is PartHex => typeof v === 'string' && HEX_COLOUR.test(v);
/** What a colour is WRITTEN as: a slot as itself, a hex in capitals; anything else is null (an old colour name is only ever read, never written). */
export function colourToStore(v: unknown): PartColor | PartHex | null {
  if (isPartColor(v)) return v;
  return isHexColour(v) ? (v.toUpperCase() as PartHex) : null;
}
/** A stored colour as a custom hex (capitals), or null: a slot, an old name, a hex that is not exactly #RRGGBB and a stray word all read none. */
export function colorHex(v: unknown): PartHex | null {
  return isHexColour(v) ? (v.toUpperCase() as PartHex) : null;
}

export type PartLevel = 0 | 1 | 2;
export const MAX_PART_LEVEL = 2;
export interface PartLengthLimit { unit: 'words' | 'characters'; max: number }
export const PART_NAME_MAX = 120;

type PartKeys = { name?: string; level?: number; color?: PartColor | PartHex; lengthLimit?: PartLengthLimit };
const keysOf = (e: JournalEntry): PartKeys => (e.pageSettings ?? {}) as PartKeys;

// ---------------------------------------------------------------- what a Part is

export interface Part {
  id: string;
  docId: string;
  /** 0-based place in the Doc's list. */
  index: number;
  /** The Part's name: its own, or (when it has none) the first few words of its text. Never empty. */
  name: string;
  /** True when the writer named it. */
  named: boolean;
  /** The level as DRAWN: never deeper than one under the Part above, and the first Part is always 0. `storedLevel` is what was written. */
  level: PartLevel;
  storedLevel: number | undefined;
  /** the Part's slot colour (an old name reads as its slot); null when it has none or holds a custom hex */
  color: PartColor | null;
  /** the Part's custom colour, #RRGGBB in capitals, or null (colour B) */
  hex: PartHex | null;
  template: PageTemplate | null;
  lengthLimit: PartLengthLimit | null;
  /** A script Part is a screenplay: it lists, moves and renames, but it has no plain text to split or join. */
  kind: 'text' | 'script';
  words: number;
  chars: number;
  /** True when the Part holds anything a join would otherwise have to drop (ink, cards, links, a Tutor thread). */
  carries: boolean;
}

const FIRST_WORDS = 6;
const firstWords = (text: string): string => {
  const line = firstPlainLine(text);
  if (!line) return '';
  const w = [...line.matchAll(/\S+/g)];
  return w.length > FIRST_WORDS ? `${line.slice(0, (w[FIRST_WORDS - 1].index ?? 0) + w[FIRST_WORDS - 1][0].length)}...` : line;
};
export const cleanName = (name: string): string => name.replace(/\s+/g, ' ').trim().slice(0, PART_NAME_MAX);

const carriesMore = (e: JournalEntry): boolean =>
  !!(e.strokes && e.strokes.length) || liveBoxes(e.boxes).length > 0 || !!(e.pageLinks && e.pageLinks.length) || !!(e.tutor && (e.tutor as { messages?: unknown[] }).messages?.length);

/** The entries a Doc lists as Parts: its live, non-board entries (a system board and a page's plan face are never Parts), in the writer's order. */
function entriesOfDoc(docId: string): JournalEntry[] {
  return getJournalEntries()
    .filter(e => e.projectId === docId && e.pageType !== 'board' && !getSystemKind(e) && !isPairedPlanBoard(e.id))
    .sort(compareParts);
}

/** The order `compareSections` already reads, restated here so this file owns its sort (an explicit orderIndex first, then creation order). */
export function compareParts(a: JournalEntry, b: JournalEntry): number {
  const ai = a.orderIndex, bi = b.orderIndex;
  if (ai !== undefined && bi !== undefined && ai !== bi) return ai - bi;
  if (ai !== undefined && bi === undefined) return -1;
  if (ai === undefined && bi !== undefined) return 1;
  return a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);
}

/** PURE: the levels as drawn - each at least 0, at most MAX_PART_LEVEL, never more than one deeper than the Part above, and the first always 0. */
export function effectiveLevels(stored: Array<number | undefined>): PartLevel[] {
  const out: PartLevel[] = [];
  stored.forEach((raw, i) => {
    const want = Number.isFinite(raw) ? Math.max(0, Math.min(MAX_PART_LEVEL, Math.trunc(raw as number))) : 0;
    const cap = i === 0 ? 0 : Math.min(MAX_PART_LEVEL, out[i - 1] + 1);
    out.push(Math.min(want, cap) as PartLevel);
  });
  return out;
}

/** PURE: the run a Part leads - itself and every Part right below it that sits deeper (its subsections). [start, end) as indices into the list. */
export function runOf(levels: number[], index: number): [number, number] {
  let end = index + 1;
  while (end < levels.length && levels[end] > levels[index]) end += 1;
  return [index, end];
}

function toPart(e: JournalEntry, docId: string, index: number, level: PartLevel): Part {
  const k = keysOf(e);
  const own = typeof k.name === 'string' ? cleanName(k.name) : '';
  const isScript = e.pageType === 'script';
  const text = isScript ? '' : (e.text ?? '');
  return {
    id: e.id, docId, index,
    name: own || firstWords(text) || 'Untitled',
    named: !!own,
    level, storedLevel: typeof k.level === 'number' ? k.level : undefined,
    color: colorSlot(k.color),
    hex: colorHex(k.color),
    template: (e.pageSettings?.template as PageTemplate | undefined) ?? null,
    lengthLimit: k.lengthLimit && typeof k.lengthLimit.max === 'number' && (k.lengthLimit.unit === 'words' || k.lengthLimit.unit === 'characters') ? { unit: k.lengthLimit.unit, max: k.lengthLimit.max } : null,
    kind: isScript ? 'script' : 'text',
    words: wordCount(text), chars: text.length,
    carries: carriesMore(e),
  };
}

/** THE CONTRACT (agreed with POLISH): the Parts of a Doc, in order. `docId` is the set's id. An unknown Doc lists nothing. */
export function partsOfDoc(docId: string): Part[] {
  const es = entriesOfDoc(docId);
  const levels = effectiveLevels(es.map(e => keysOf(e).level));
  return es.map((e, i) => toPart(e, docId, i, levels[i]));
}

/** One Part by its entry id, with its place in its Doc; null when it is not a live Part of any Doc. */
export function partById(partId: string): Part | null {
  const e = getJournalEntry(partId);
  if (!e || !e.projectId) return null;
  return partsOfDoc(e.projectId).find(p => p.id === partId) ?? null;
}

/** The ids of a Part's run: itself and its subsections (the unit a move, a level change and "make it its own Doc" act on). */
export function runIds(docId: string, partId: string): string[] {
  const parts = partsOfDoc(docId);
  const i = parts.findIndex(p => p.id === partId);
  if (i < 0) return [];
  const [s, t] = runOf(parts.map(p => p.level), i);
  return parts.slice(s, t).map(p => p.id);
}

// ---------------------------------------------------------------- writing one Part's keys

/** What a Part's `pageSettings` starts from when it has none: the writer's own default dress, else the app's floor - the base the other writers of pageSettings use, so naming a Part never re-dresses it. */
const baseSettings = (e: JournalEntry): PageSettings => ({ ...(e.pageSettings ?? getUserPageDefaults() ?? PAGE_SETTINGS_FALLBACK) });

/** Write one Part's pageSettings keys. A value of `undefined` REMOVES the key (absent, never null). Writes nothing when nothing changes. Never touches the text. */
function patchKeys(partId: string, patch: Partial<Record<'name' | 'level' | 'color' | 'lengthLimit' | 'template', unknown>>): boolean {
  const e = getJournalEntry(partId);
  if (!e) return false;
  const cur = (e.pageSettings ?? {}) as unknown as Record<string, unknown>;
  const changes = Object.entries(patch).filter(([k, v]) => (v === undefined ? cur[k] !== undefined : JSON.stringify(cur[k]) !== JSON.stringify(v)));
  if (!changes.length) return false;
  const next = baseSettings(e) as unknown as Record<string, unknown>;
  for (const [k, v] of changes) { if (v === undefined) delete next[k]; else next[k] = v; }
  saveJournalEntry({ ...e, pageSettings: next as unknown as PageSettings });
  return true;
}

/** Name a Part. Blank removes the name (the first words stand in again). Returns whether anything was written. */
export function renamePart(partId: string, name: string): boolean {
  const n = cleanName(name);
  return patchKeys(partId, { name: n || undefined });
}

/** Colour a Part: a slot a-f, or exactly #RRGGBB (stored in capitals), or clear it with null. Anything else (a colour name, an old name, a short hex, a hex with a space) is refused and nothing is written. */
export function setPartColor(partId: string, color: PartColor | PartHex | null): boolean {
  const store = color === null ? null : colourToStore(color);
  if (color !== null && store === null) return false;
  return patchKeys(partId, { color: store ?? undefined });
}

/** The existing template lens, set through here too (null is Blank). */
export function setPartTemplate(partId: string, template: PageTemplate | null): boolean {
  return patchKeys(partId, { template: template ?? undefined });
}

/** A Part's own length ceiling, or null for none. */
export function setPartLimit(partId: string, limit: PartLengthLimit | null): boolean {
  if (limit && !(Number.isFinite(limit.max) && limit.max > 0 && (limit.unit === 'words' || limit.unit === 'characters'))) return false;
  return patchKeys(partId, { lengthLimit: limit ? { unit: limit.unit, max: Math.floor(limit.max) } : undefined });
}

// ---------------------------------------------------------------- order

/** PURE: an order index that sorts between two neighbours (either may be missing), or null when there is no room and the caller should renumber. */
export function orderIndexBetween(prev: number | undefined, next: number | undefined): number | null {
  if (prev === undefined && next === undefined) return null;
  if (prev === undefined) return (next as number) - 1;
  if (next === undefined) return prev + 1;
  const mid = (prev + next) / 2;
  return mid > prev && mid < next ? mid : null;
}

/** Put the Doc's Parts in exactly this order of ids (writes `orderIndex` only, and only where it changes). */
function writeOrder(ids: string[]): number { return reorderSections(ids); }

/** Place `ids` (a run, in order) so they follow `afterId` (null: first). Spreads between the neighbours' indices when it can, and renumbers the Doc when it cannot. */
function placeRun(docId: string, ids: string[], afterId: string | null): void {
  const rest = entriesOfDoc(docId).filter(e => !ids.includes(e.id));
  const at = afterId === null ? 0 : rest.findIndex(e => e.id === afterId) + 1;
  const final = [...rest.slice(0, at).map(e => e.id), ...ids, ...rest.slice(at).map(e => e.id)];
  const prev = at > 0 ? rest[at - 1].orderIndex : undefined, next = at < rest.length ? rest[at].orderIndex : undefined;
  const allNumbered = rest.every(e => e.orderIndex !== undefined);
  if (allNumbered && (prev !== undefined || next !== undefined)) {
    // k indices strictly between prev and next (or beyond the one neighbour), evenly spread
    const k = ids.length; const lo = prev ?? (next as number) - k - 1; const hi = next ?? (prev as number) + k + 1;
    const step = (hi - lo) / (k + 1);
    if (step > 1e-6) {
      ids.forEach((id, i) => { const e = getJournalEntry(id); if (e && e.orderIndex !== lo + step * (i + 1)) saveJournalEntry({ ...e, orderIndex: lo + step * (i + 1) }); });
      return;
    }
  }
  writeOrder(final);
}

/** A Part just born into a Doc goes to the END of the Doc's Parts as they are read now (Fable, Nov 20, 10:45 pm: "never sorted by creation time among them"). A page filed with no orderIndex sorts among the unnumbered Parts by creation time, so a Doc whose Parts were numbered by a move, or created later by another device's clock, would show it ahead of them. Placed through placeRun, like every other Part. */
export function placeAtEnd(partId: string): void {
  const e = getJournalEntry(partId);
  if (!e || !e.projectId) return;
  const rest = entriesOfDoc(e.projectId).filter(x => x.id !== partId);
  placeRun(e.projectId, [partId], rest.length ? rest[rest.length - 1].id : null);
}

/** Move a Part WITH its subsections so it lands at `toIndex` among the other Parts (0 = first). Its level is brought to at most one under the Part above, the run's own levels shifting with it. Writes `orderIndex` and `level` only. */
export function movePart(docId: string, partId: string, toIndex: number): boolean {
  const parts = partsOfDoc(docId);
  const i = parts.findIndex(p => p.id === partId);
  if (i < 0) return false;
  const [s, t] = runOf(parts.map(p => p.level), i);
  const run = parts.slice(s, t);
  const rest = parts.filter(p => !run.includes(p));
  const at = Math.max(0, Math.min(rest.length, Math.trunc(toIndex)));
  if (at === s) return false;
  const after = at > 0 ? rest[at - 1] : null;
  placeRun(docId, run.map(p => p.id), after ? after.id : null);
  // the run's top may not sit deeper than one under its new neighbour
  const cap = after ? Math.min(MAX_PART_LEVEL, after.level + 1) : 0;
  const delta = Math.min(run[0].level, cap) - run[0].level;
  if (delta !== 0) run.forEach(p => patchKeys(p.id, { level: Math.max(0, Math.min(MAX_PART_LEVEL, p.level + delta)) }));
  return true;
}

/** Set a Part's level (0 to 2), clamped to one under the Part above; its subsections shift with it. Returns the level it now has, or null when the Part is unknown. */
export function setPartLevel(docId: string, partId: string, level: number): PartLevel | null {
  const parts = partsOfDoc(docId);
  const i = parts.findIndex(p => p.id === partId);
  if (i < 0) return null;
  const cap = i === 0 ? 0 : Math.min(MAX_PART_LEVEL, parts[i - 1].level + 1);
  const want = Math.max(0, Math.min(cap, Math.trunc(level))) as PartLevel;
  const delta = want - parts[i].level;
  if (delta === 0) return want;
  const [s, t] = runOf(parts.map(p => p.level), i);
  parts.slice(s, t).forEach(p => patchKeys(p.id, { level: Math.max(0, Math.min(MAX_PART_LEVEL, p.level + delta)) }));
  return want;
}

// ---------------------------------------------------------------- the Doc a page grows into

export type EnsureDocResult = { ok: true; docId: string; created: boolean } | { ok: false; reason: 'unknown' | 'not-page' };

/**
 * THE DOC A PAGE GROWS INTO (Fable, Nov 19, 9:20 pm). A page in a set the WRITER made already is a Part of a Doc: nothing happens. A page in a set the APP made (Top Drawer's set, the lazy set of an empty
 * Drawer: store isAutoSet) or in NO set (a loose page, the Journal) is a one-Part Doc by the rail's read-time rule, and adding a Part to that SET would make a sibling, which the rail shows as a second
 * one-Part Doc. So: a new set is written FIRST, titled with the page's name, in the SAME Drawer (none, for a page with no set), and only then the page moves into it. Nothing else in the old set moves.
 */
export function ensureDoc(partId: string): EnsureDocResult {
  const e = getJournalEntry(partId);
  if (!e) return { ok: false, reason: 'unknown' };
  if (e.pageType === 'board' || getSystemKind(e) || isPairedPlanBoard(e.id)) return { ok: false, reason: 'not-page' };
  const set = e.projectId ? getProject(e.projectId) : null;
  if (set && !isAutoSet(set)) return { ok: true, docId: set.id, created: false };
  const own = typeof keysOf(e).name === 'string' ? cleanName(keysOf(e).name as string) : '';
  const title = own || firstWords(e.pageType === 'script' ? '' : (e.text ?? '')) || 'Untitled';
  const doc = createBinder(title, set ? set.kind : undefined, set ? set.drawerId : undefined, set ? set.type : 'creative');
  const again = getJournalEntry(partId);
  if (again) saveJournalEntry({ ...again, projectId: doc.id });
  return { ok: true, docId: doc.id, created: true };
}

// ---------------------------------------------------------------- a new Part

export interface NewPartOptions {
  afterId?: string | null; name?: string; template?: PageTemplate | null; level?: number;
  /** a screenplay Part: born as a script page holding this (empty) script and its text, as a Screenplay's own pages are */
  seed?: { script: ScriptDoc; text: string };
}

/** A blank Part in a Doc: at the end, or right after `afterId`. It starts at the level of the Part it follows (or the one asked), under the Doc's own name rules. Returns its id, or null when the Doc is unknown. */
export function newPart(docIdIn: string | null, opts: NewPartOptions = {}): string | null {
  // growing from a page the app (or nobody) filed makes that page's own Doc first, so the new Part is its second Part and not a sibling Doc; an app-made set with no page to grow from is refused
  let docId = docIdIn ?? '';
  if (opts.afterId) {
    const from = getJournalEntry(opts.afterId);
    const set = from && from.projectId ? getProject(from.projectId) : null;
    if (from && (!set || isAutoSet(set))) { const r = ensureDoc(from.id); if (!r.ok) return null; docId = r.docId; }
  } else if (isAutoSet(getProject(docId))) return null;
  if (!docId || !getProject(docId)) return null;
  const parts = partsOfDoc(docId);
  const after = opts.afterId === undefined || opts.afterId === null ? (opts.afterId === null ? null : (parts[parts.length - 1] ?? null)) : (parts.find(p => p.id === opts.afterId) ?? null);
  const born = createBinderPage(docId, opts.seed ? 'script' : 'manuscript');
  if (opts.seed) saveJournalEntry({ ...(getJournalEntry(born.id) as JournalEntry), script: opts.seed.script, text: opts.seed.text });
  const lvl = opts.level !== undefined ? opts.level : after ? after.level : 0;
  const cap = after ? Math.min(MAX_PART_LEVEL, after.level + 1) : 0;
  const level = Math.max(0, Math.min(cap, Math.trunc(lvl)));
  patchKeys(born.id, { name: opts.name ? cleanName(opts.name) || undefined : undefined, template: opts.template ?? undefined, level: level || undefined });
  // deeper than `after`: its first subsection, right below it. Otherwise it follows `after`'s whole run (the subsections stay with their parent)
  let place: string | null = after ? after.id : null;
  if (after && level <= after.level) { const end = runOf(parts.map(p => p.level), after.index)[1]; place = parts[end - 1].id; }
  placeRun(docId, [born.id], place);
  return born.id;
}

// ---------------------------------------------------------------- split and join

/** PURE: where a cut may fall: never between the two halves of an emoji or another surrogate pair. */
export function snapOffset(text: string, offset: number): number {
  const o = Math.max(0, Math.min(text.length, Math.trunc(offset)));
  if (o > 0 && o < text.length) {
    const a = text.charCodeAt(o - 1), b = text.charCodeAt(o);
    if (a >= 0xD800 && a <= 0xDBFF && b >= 0xDC00 && b <= 0xDFFF) return o - 1;
  }
  return o;
}
/** PURE: where a cut inside one line may fall with respect to the line's styled runs (bold, italic, underline, strike, a font span). A cut in the opening or closing MARK, or right against it, moves out of the run (a mark is never cut in two, and a run is never left holding nothing on one side). Returns the cut and the runs it still falls inside, outermost first. */
function cutThroughRuns(text: string, at0: number): { at: number; runs: Array<{ open: string; close: string }> } {
  const ls = at0 === 0 ? 0 : text.lastIndexOf('\n', at0 - 1) + 1;
  const nl = text.indexOf('\n', at0);
  const line = text.slice(ls, nl < 0 ? text.length : nl);
  const runs = readMarks(line);
  let p = at0 - ls;
  for (let again = true, guard = 0; again && guard < 8; guard += 1) {
    again = false;
    for (const r of runs) {
      const o1 = r.open + r.mark.length, c1 = r.close, c2 = r.close + closeMark(r).length;
      if (p > r.open && p <= o1) { p = r.open; again = true; } else if (p >= c1 && p < c2) { p = c2; again = true; }
    }
  }
  const inside = runs.filter(r => p > r.open + r.mark.length && p < r.close).sort((a, b) => a.open - b.open);
  return { at: ls + p, runs: inside.map(r => ({ open: r.mark, close: closeMark(r) })) };
}

/**
 * PURE: the two halves of a cut. A cut in plain words gives head + tail = the original, byte for byte. A cut INSIDE a styled run (Fable, Nov 20) closes the style at the cut and reopens it
 * in the tail, so each Part keeps its own words styled and neither holds an orphaned mark: the closing marks go after the head's last word, the opening marks before the tail's first (a mark
 * never follows a space it would have to hug), and the cut moves out of a run's own mark. `joinText` gives the original back.
 */
export function splitText(text: string, offset: number): { head: string; tail: string; at: number } {
  const { at, runs } = cutThroughRuns(text, snapOffset(text, offset));
  if (runs.length === 0) return { head: text.slice(0, at), tail: text.slice(at), at };
  const h = text.slice(0, at), t = text.slice(at);
  const hSpace = /[ \t]*$/.exec(h)?.[0] ?? '', tSpace = /^[ \t]*/.exec(t)?.[0] ?? '';
  const closers = runs.map(r => r.close).reverse().join(''), openers = runs.map(r => r.open).join('');
  return { head: h.slice(0, h.length - hSpace.length) + closers + hSpace, tail: tSpace + openers + t.slice(tSpace.length), at };
}

// the closing marks a split writes, tried longest first at the end of the Part above (the font span's own closing mark has a class list)
const SEAM_EMPHASIS = ['**', '__', '~~', '*'];
const SEAM_FONT_CLOSE = /\]\{[^}\n]{1,80}\}$/;
/**
 * PURE: the join of a Part onto the one above. The seam a split inside a styled run left (the head's closing marks, the tail's opening marks, with only spaces beside them) is taken out again, so
 * a split then a join gives the original; it is taken out only when the text read back has ONE run across the seam of just those kinds, else the two are joined as they stand.
 * (The one text this reads differently is two runs of the same style cut in the space between them, `**a** **b**`: joined, they are one run, `**a b**`.)
 */
export function joinText(above: string, below: string): string {
  const plain = above + below;
  const aSpace = /[ \t]*$/.exec(above)?.[0] ?? '', bSpace = /^[ \t]*/.exec(below)?.[0] ?? '';
  let x = above.slice(0, above.length - aSpace.length), y = below.slice(bSpace.length);
  const peeled: string[] = [];   // outermost first
  for (;;) {
    const font = SEAM_FONT_CLOSE.exec(x);
    if (font && y.startsWith('[')) { peeled.push('['); x = x.slice(0, x.length - font[0].length); y = y.slice(1); continue; }
    const m = SEAM_EMPHASIS.find(k => x.endsWith(k) && y.startsWith(k));
    if (!m) break;
    peeled.push(m); x = x.slice(0, x.length - m.length); y = y.slice(m.length);
  }
  if (peeled.length === 0) return plain;
  const healed = x + aSpace + bSpace + y;
  const seam = x.length + aSpace.length;
  const ls = seam === 0 ? 0 : healed.lastIndexOf('\n', seam - 1) + 1;
  const nl = healed.indexOf('\n', seam);
  const line = healed.slice(ls, nl < 0 ? healed.length : nl), p = seam - ls;
  const across = readMarks(line).filter(r => p > r.open + r.mark.length && p < r.close).sort((a, b) => a.open - b.open).map(r => r.mark);
  return across.length === peeled.length && across.every((m, i) => m === peeled[i]) ? healed : plain;
}

export interface SplitToken { kind: 'split'; docId: string; sourceId: string; tailId: string; head: string; tail: string; whole: string }
export interface JoinToken { kind: 'join'; docId: string; keepId: string; goneId: string; above: string; below: string; /** the text the Part above was left with (a join that renamed a note label is not above + below) */ joined?: string }
export type SplitResult = { ok: true; tailId: string; token: SplitToken } | { ok: false; reason: 'unknown' | 'not-text' };
export type JoinResult = { ok: true; keepId: string; token: JoinToken } | { ok: false; reason: 'unknown' | 'first' | 'not-text' | 'carries' };

/** Settings a split-off Part inherits: the source's dress and size, never its per-Part facts (name, colour, template, limit, hidden plan cards). */
function inheritedSettings(e: JournalEntry): PageSettings | undefined {
  if (!e.pageSettings) return undefined;
  const { name, color, lengthLimit, template, hiddenPlanCards, kind, ...rest } = e.pageSettings as PageSettings & PartKeys & Record<string, unknown>;
  void name; void color; void lengthLimit; void template; void hiddenPlanCards; void kind;
  return rest as unknown as PageSettings;
}

/**
 * SPLIT HERE: everything after `offset` becomes a new Part right below the source (no title page), at the source's level. `liveText` is the host's own buffer when the Part is open in the editor
 * (the stored text may be a keystroke behind it). The TAIL IS WRITTEN FIRST, then the source is shortened: a sync that stops between the two has the whole text twice, never zero times.
 * `between` runs after the first write (a test seam: the harness reads storage there).
 */
export function splitPart(partId: string, offset: number, liveText?: string, between?: () => void): SplitResult {
  const first = getJournalEntry(partId);
  if (!first) return { ok: false, reason: 'unknown' };
  if (first.pageType === 'script' || first.pageType === 'board') return { ok: false, reason: 'not-text' };
  // a page the app or nobody filed becomes its own Doc first (written before the move), so the split gives ONE Doc with TWO Parts
  const doc = ensureDoc(partId);
  if (!doc.ok) return { ok: false, reason: 'unknown' };
  const docId = doc.docId;
  const src = getJournalEntry(partId) as JournalEntry;
  const text = liveText ?? src.text ?? '';
  const { head, tail } = splitWithNotes(text, offset, splitText);
  const parts = partsOfDoc(docId);
  const me = parts.find(p => p.id === partId);
  const born = createBinderPage(docId, (src.pageType ?? 'manuscript') as NonNullable<JournalEntry['pageType']>);
  const settings = inheritedSettings(src);
  const level = me ? me.level : 0;
  const row: JournalEntry = {
    ...(getJournalEntry(born.id) as JournalEntry),
    text: tail,
    origin: src.origin ?? 'project',
    pageSettings: { ...(settings ?? baseSettings(born)), ...(level ? { level } : {}) } as PageSettings,
  };
  saveJournalEntry(row);
  // the tail sits directly below the head: the text reads on from one to the other, and a join of the tail puts it back onto exactly the Part it was cut from. Subsections follow the tail, in the order they read.
  placeRun(docId, [born.id], partId);
  if (between) between();
  // second: the source loses the tail
  const again = getJournalEntry(partId);
  if (again) saveJournalEntry({ ...again, text: head });
  return { ok: true, tailId: born.id, token: { kind: 'split', docId, sourceId: partId, tailId: born.id, head, tail, whole: text } };
}

/**
 * JOIN: put a Part back onto the one above it. The Part above gets the words FIRST (appended, exactly), then the emptied Part is soft-deleted. A Part that carries ink, cards, links or a Tutor
 * thread is refused with a reason: dropping them silently is not a join. `between` is the harness's seam, as in splitPart.
 */
export function joinPart(partId: string, liveTexts?: { above?: string; below?: string }, between?: () => void): JoinResult {
  const me = getJournalEntry(partId);
  if (!me || !me.projectId) return { ok: false, reason: 'unknown' };
  const docId = me.projectId;
  const parts = partsOfDoc(docId);
  const i = parts.findIndex(p => p.id === partId);
  if (i < 0) return { ok: false, reason: 'unknown' };
  if (i === 0) return { ok: false, reason: 'first' };
  const aboveE = getJournalEntry(parts[i - 1].id);
  if (!aboveE) return { ok: false, reason: 'unknown' };
  if (me.pageType === 'script' || aboveE.pageType === 'script') return { ok: false, reason: 'not-text' };
  if (carriesMore(me)) return { ok: false, reason: 'carries' };
  const above = liveTexts?.above ?? aboveE.text ?? '';
  const below = liveTexts?.below ?? me.text ?? '';
  const joined = joinWithNotes(above, below, joinText);
  saveJournalEntry({ ...aboveE, text: joined });
  if (between) between();
  softDeleteEntry(partId);
  return { ok: true, keepId: aboveE.id, token: { kind: 'join', docId, keepId: aboveE.id, goneId: partId, above, below, joined } };
}

/** Undo a split: join the tail back, only when neither half changed since (else it is refused, not forced). */
export function undoSplit(t: SplitToken): boolean {
  const src = getJournalEntry(t.sourceId), tail = getJournalEntry(t.tailId);
  if (!src || !tail || src.text !== t.head || tail.text !== t.tail) return false;
  saveJournalEntry({ ...src, text: t.whole ?? joinWithNotes(t.head, t.tail, joinText) });
  softDeleteEntry(t.tailId);
  return true;
}

/** Undo a join: bring the emptied Part back and cut the Part above back to what it was, only when it still holds exactly what the join left. */
export function undoJoin(t: JoinToken): boolean {
  const keep = getJournalEntry(t.keepId);
  if (!keep || keep.text !== (t.joined ?? t.above + t.below)) return false;
  restoreEntry(t.goneId);
  const back = getJournalEntry(t.goneId);
  if (!back) return false;
  saveJournalEntry({ ...back, text: t.below });
  saveJournalEntry({ ...(getJournalEntry(t.keepId) as JournalEntry), text: t.above });
  return true;
}

// ---------------------------------------------------------------- make it its own Doc

/** "Make it its own Doc": a Part (with its subsections) becomes a Doc of its own, in the same Drawer. The new set is written FIRST, then the Parts move. Refused for the only Part of a Doc. */
export function makeOwnDoc(partId: string): { ok: true; docId: string } | { ok: false; reason: 'unknown' | 'only-part' } {
  const e = getJournalEntry(partId);
  if (!e || !e.projectId) return { ok: false, reason: 'unknown' };
  const from = getProject(e.projectId);
  if (!from) return { ok: false, reason: 'unknown' };
  const parts = partsOfDoc(from.id);
  const i = parts.findIndex(p => p.id === partId);
  if (i < 0) return { ok: false, reason: 'unknown' };
  const [s, t] = runOf(parts.map(p => p.level), i);
  if (t - s >= parts.length) return { ok: false, reason: 'only-part' };
  const run = parts.slice(s, t);
  const doc = createBinder(run[0].name, from.kind, from.drawerId, from.type);
  run.forEach((p, k) => {
    const row = getJournalEntry(p.id);
    if (!row) return;
    const next = baseSettings(row) as unknown as Record<string, unknown>;
    const lvl = Math.max(0, p.level - run[0].level);
    if (lvl) next.level = lvl; else delete next.level;
    saveJournalEntry({ ...row, projectId: doc.id, orderIndex: k, pageSettings: next as unknown as PageSettings });
  });
  return { ok: true, docId: doc.id };
}

// ---------------------------------------------------------------- the harness's door (seams: each flushes before it returns, like every wrizo* seam)
if (typeof window !== 'undefined') {
  const durable = <T,>(v: T): T => { flushNow(); return v; };
  (window as unknown as { wrizoParts?: unknown }).wrizoParts = {
    partsOfDoc: (docId: string) => partsOfDoc(docId),
    partById: (id: string) => partById(id),
    newPart: (docId: string | null, o?: NewPartOptions) => durable(newPart(docId, o)),
    ensureDoc: (id: string) => durable(ensureDoc(id)),
    // the app's own lazy set of a Drawer (a loose page in a Drawer lives in it): the harness asks for it through the app's own function, never raw storage
    autoSet: (drawerId: string) => durable(ensureSet(drawerId)),
    renamePart: (id: string, name: string) => durable(renamePart(id, name)),
    setPartColor: (id: string, c: PartColor | PartHex | null) => durable(setPartColor(id, c)),
    setPartTemplate: (id: string, t: PageTemplate | null) => durable(setPartTemplate(id, t)),
    setPartLimit: (id: string, l: PartLengthLimit | null) => durable(setPartLimit(id, l)),
    setPartLevel: (docId: string, id: string, level: number) => durable(setPartLevel(docId, id, level)),
    movePart: (docId: string, id: string, to: number) => durable(movePart(docId, id, to)),
    splitPart: (id: string, offset: number, live?: string) => durable(splitPart(id, offset, live)),
    joinPart: (id: string) => durable(joinPart(id)),
    undoSplit: (t: SplitToken) => durable(undoSplit(t)),
    undoJoin: (t: JoinToken) => durable(undoJoin(t)),
    makeOwnDoc: (id: string) => durable(makeOwnDoc(id)),
    // the ordering proof: runs the op and hands back what STORAGE held between the two writes (the harness reads rows there, never the cache)
    splitMidpoint: (id: string, offset: number) => { let mid: unknown = null; const r = splitPart(id, offset, undefined, () => { flushNow(); mid = { rows: getJournalEntries().map(e => ({ id: e.id, text: e.text })) }; }); flushNow(); return { r, mid }; },
    joinMidpoint: (id: string) => { let mid: unknown = null; const r = joinPart(id, undefined, () => { flushNow(); mid = { rows: getJournalEntries().map(e => ({ id: e.id, text: e.text })) }; }); flushNow(); return { r, mid }; },
  };
}
