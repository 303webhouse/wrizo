// EXPERIMENT 1 ("connect from the page") — THE ANCHOR SEAM.
//
// This module's name is deliberate and was ruled: the COLUMN is `page_links`
// (JS `pageLinks`), and this file keeps its own name. Links = anchors =
// `page_links` — one record set under one column, addressed here.
//
// ⛔ THE ONE LAW THIS FILE EXISTS TO KEEP: **NOTHING WRITES DURING A READ.**
// `resolveAnchors` is PURE. It takes text and anchors and returns resolutions.
// It does not touch the store, does not call `saveJournalEntry`, and does not
// mutate its arguments. §1b's "hints updated" for a moved anchor is a WRITE,
// and it rides an ordinary page save — never the read that noticed it. The
// cost, stated rather than hidden: until the next save, a moved anchor is
// re-found on every read. Correct every time, merely recomputed.
//
// ⛔ AND THE LAW THAT DECIDES THE HARD CASES: **AN ANCHOR NEVER MOVES ITSELF TO
// A GUESS** (ratified and banded, 2026-09-22). Every step below is an EXACT
// match, and where an exact match is not UNIQUE the anchor is KEPT and MARKED —
// ambiguous or lost — with its links still opening their targets. A lazy
// implementation silently picks the first match, and that is how a quote ends
// up attached to the wrong sentence: the one failure this feature cannot have.
//
// COORDINATE SPACE (ruled): every offset here is in the text AS THE WRITER SEES
// IT, markers stripped, via `visibleText` — never raw `entry.text` offsets. Raw
// offsets are derived at paint time only, through `toRawRange` on the index map
// the same stripper returns. One stripper, so matching and painting cannot
// disagree.

import type { Anchor, Link, PageLinks } from '../types';
import { visibleText, paragraphRanges } from './draftFormat';
import { getJournalEntry, saveJournalEntry, generateId } from './persistence';

/** How much context either side of a span is recorded, per the brief. */
const CONTEXT = 48;

// --- what a read gives back ----------------------------------------------

// An anchor plus where it actually IS right now. `status` here is the resolved
// truth for this read; the stored `Anchor.status` is what was last written
// down. They differ exactly when the words moved since the last save, which is
// the normal case and not an error.
export interface ResolvedAnchor {
  anchor: Anchor;
  status: 'found' | 'moved' | 'ambiguous' | 'lost';
  /**
   * Offsets in VISIBLE text. ABSENT when the anchor is lost or ambiguous —
   * there is nothing honest to point at, so a caller that paints is made unable
   * to paint a guess by construction rather than by discipline.
   */
  start?: number;
  end?: number;
  paraIndex?: number;
  /** How many exact matches were found, when that is the reason for the status. */
  matchCount?: number;
  /** True for a spot-note (empty `quote`): a gutter tick, not a tint. */
  isSpot: boolean;
}

// --- small exact-match helpers -------------------------------------------

/** Every index at which `needle` occurs in `hay`. Non-overlapping, ascending. */
function allIndexesOf(hay: string, needle: string, from = 0): number[] {
  if (needle === '') return [];
  const out: number[] = [];
  let i = hay.indexOf(needle, from);
  while (i >= 0) {
    out.push(i);
    i = hay.indexOf(needle, i + needle.length);
  }
  return out;
}

/** The single index, or null if there is not exactly one. Never a guess. */
function soleIndexOf(hay: string, needle: string): number | null {
  const all = allIndexesOf(hay, needle);
  return all.length === 1 ? all[0] : null;
}

// --- reads (all pure) ----------------------------------------------------

/**
 * Re-find every anchor in the page's current text. PURE: no store access, no
 * writes, no mutation of `anchors`.
 *
 * SPAN ANCHORS follow §1b's order, every step exact:
 *   1. `quote` at `startHint` inside paragraph `paraIndex`        -> found
 *   2. `prefix + quote + suffix`, UNIQUE in that paragraph        -> moved
 *   3. the same, UNIQUE on the page                               -> moved
 *   4. `quote` alone, EXACTLY ONE match on the page               -> moved
 *   5. `quote` alone, several matches                             -> ambiguous
 *   6. no match                                                   -> lost
 *
 * Steps 2 and 3 require UNIQUENESS, which the brief left implicit. A
 * non-unique context match is still a choice among candidates, and the
 * never-guess law does not care which step the guess happens on; a
 * non-unique step 2 therefore falls through to the counting steps rather than
 * taking the first hit.
 *
 * SPOT-NOTES (`quote === ''`) take a different order and NEVER enter the
 * ambiguity path — an empty string occurs at every position, so step 4's
 * "exactly one match" could never hold and every spot-note would report a
 * false problem to the writer on first read. Their order, as ruled:
 *   1. `prefix + suffix` adjacent, unique                          -> found/moved
 *   2. `prefix` alone, unique, caret immediately AFTER it           -> moved
 *   3. `suffix` alone, unique, caret immediately BEFORE it          -> moved
 *   4. both sides gone, or 2 and 3 DISAGREE                         -> lost
 * Steps 2 and 3 are one-sided but still exact, so the never-guess law holds,
 * and an edit on one side of the caret no longer loses the note.
 */
export function resolveAnchors(text: string, anchors: Anchor[]): ResolvedAnchor[] {
  const v = visibleText(text);
  const page = v.text;
  const paras = paragraphRanges(page);
  const paraIndexAt = (offset: number): number | undefined => {
    const p = paras.find(r => offset >= r.start && offset <= r.end);
    return p ? p.index : undefined;
  };

  return anchors
    .filter(a => !a.deletedAt)
    .map<ResolvedAnchor>(a => {
      const isSpot = a.quote === '';
      const at = (start: number, end: number, status: ResolvedAnchor['status']): ResolvedAnchor =>
        ({ anchor: a, status, start, end, paraIndex: paraIndexAt(start), isSpot });
      const lost = (matchCount?: number): ResolvedAnchor =>
        ({ anchor: a, status: 'lost', matchCount, isSpot });

      if (isSpot) {
        // 1 · both sides still adjacent — the caret's place is exact.
        if (a.prefix !== '' || a.suffix !== '') {
          const joined = a.prefix + a.suffix;
          const i = soleIndexOf(page, joined);
          if (i !== null) {
            const caret = i + a.prefix.length;
            const wasAt = spotRecordedOffset(a, paras);
            return at(caret, caret, wasAt === caret ? 'found' : 'moved');
          }
        }
        // 2 / 3 · one-sided exact fallbacks. Both are computed BEFORE either is
        // used, because "the two fallbacks disagree" is itself a lost verdict —
        // taking the first one that resolved would be a guess between them.
        const byPrefix = a.prefix !== '' ? soleIndexOf(page, a.prefix) : null;
        const bySuffix = a.suffix !== '' ? soleIndexOf(page, a.suffix) : null;
        const caretFromPrefix = byPrefix === null ? null : byPrefix + a.prefix.length;
        const caretFromSuffix = bySuffix === null ? null : bySuffix;
        if (caretFromPrefix !== null && caretFromSuffix !== null) {
          if (caretFromPrefix !== caretFromSuffix) return lost();
          return at(caretFromPrefix, caretFromPrefix, 'moved');
        }
        if (caretFromPrefix !== null) return at(caretFromPrefix, caretFromPrefix, 'moved');
        if (caretFromSuffix !== null) return at(caretFromSuffix, caretFromSuffix, 'moved');
        // 4 · both sides gone.
        return lost();
      }

      // --- a span anchor ---------------------------------------------------
      const para = paras.find(p => p.index === a.paraIndex);

      // 1 · exactly where it was recorded, in the paragraph it was recorded in.
      if (para) {
        const abs = para.start + a.startHint;
        if (abs >= para.start && abs + a.quote.length <= para.end &&
            page.slice(abs, abs + a.quote.length) === a.quote) {
          return at(abs, abs + a.quote.length, 'found');
        }
      }

      const ctx = a.prefix + a.quote + a.suffix;

      // 2 · context, unique within that same paragraph.
      if (para) {
        const slice = page.slice(para.start, para.end);
        const hits = allIndexesOf(slice, ctx);
        if (hits.length === 1) {
          const start = para.start + hits[0] + a.prefix.length;
          return at(start, start + a.quote.length, 'moved');
        }
      }

      // 3 · context, unique anywhere on the page.
      {
        const hits = allIndexesOf(page, ctx);
        if (hits.length === 1) {
          const start = hits[0] + a.prefix.length;
          return at(start, start + a.quote.length, 'moved');
        }
      }

      // 4 / 5 · the words alone. One match moves it; several mark it ambiguous
      // and the rail asks the writer which one ("these words appear 3 times
      // now — point me at the right one"). The code never chooses.
      const bare = allIndexesOf(page, a.quote);
      if (bare.length === 1) return at(bare[0], bare[0] + a.quote.length, 'moved');
      if (bare.length > 1) {
        return { anchor: a, status: 'ambiguous', matchCount: bare.length, isSpot };
      }

      // 6 · gone.
      return lost(0);
    });
}

/** Where a spot-note's caret was last recorded, in visible page offsets. */
function spotRecordedOffset(a: Anchor, paras: ReturnType<typeof paragraphRanges>): number | undefined {
  const p = paras.find(r => r.index === a.paraIndex);
  return p ? p.start + a.startHint : undefined;
}

/**
 * The exact matches an ambiguous anchor has to choose between, in page order.
 * The rail needs them to offer the choice, and `disambiguateAnchor` indexes
 * this same list — so the offer and the commit cannot disagree about which
 * match is which.
 */
export function ambiguousMatches(text: string, anchor: Anchor): Array<{ start: number; end: number }> {
  if (anchor.quote === '') return [];
  const page = visibleText(text).text;
  return allIndexesOf(page, anchor.quote)
    .map(start => ({ start, end: start + anchor.quote.length }));
}

/**
 * The links belonging to one anchor. One anchor may carry SEVERAL (Nick's "the
 * source(s) linked", plural). Soft-deleted links are excluded.
 */
export function linksForAnchor(pageLinks: PageLinks | undefined, anchorId: string): Link[] {
  return (pageLinks?.links ?? []).filter(l => l.anchorId === anchorId && !l.deletedAt);
}

/**
 * Every resolved anchor whose span covers `offset` (visible coordinates).
 *
 * RETURNS A LIST, not one anchor, because EXP1-Q5 is YES (Nick's ruling):
 * links may overlap, and the rail lists everything covering a spot. A writer
 * may link a phrase inside an already-linked sentence — for a book with a
 * bibliography, quoting inside a sourced sentence is ordinary.
 *
 * Lost and ambiguous anchors cover nothing: they have no honest position.
 */
export function anchorsCovering(resolved: ResolvedAnchor[], offset: number): ResolvedAnchor[] {
  return resolved.filter(r =>
    r.start !== undefined && r.end !== undefined &&
    (r.isSpot ? r.start === offset : offset >= r.start && offset < r.end));
}

/**
 * The rail's resting state: everything this page is connected to.
 *
 * Sorting by recency/kind/tag is the RAIL's to do, not this seam's — and tags
 * are read from the TARGET at display time, never stored on the link, so
 * nothing here can go stale.
 */
export function pageConnections(pageLinks: PageLinks | undefined): Link[] {
  return (pageLinks?.links ?? []).filter(l => !l.deletedAt);
}

// --- writes (each one is an ordinary page change) ------------------------
//
// A LINK CHANGE IS A PAGE CHANGE. Every write below goes through
// `saveJournalEntry`, which bumps the entry's `updatedAt`, marks it dirty and
// flushes — so a link edit syncs like any edit and `page_links` rides the same
// last-writer-wins guard as every other column. Nothing here needs its own
// clock, and the per-item timestamps in the model are deliberately NOT used for
// merging: see the offer's stated known limit.
//
// EVERY WRITE SPREADS THE ENTRY. The census that preceded this build found the
// reason it matters: `saveJournalEntry` -> `upsert` REPLACES the stored record
// wholesale rather than merging fields, so a write that enumerated fields would
// silently drop everything it did not name.

function emptyLinks(): PageLinks {
  return { anchors: [], links: [] };
}

/** Read-modify-write the page's own `pageLinks`, spreading everything else. */
function mutate<T>(pageId: string, fn: (pl: PageLinks) => T): T | null {
  const entry = getJournalEntry(pageId);
  if (!entry) return null;
  const pl: PageLinks = {
    anchors: [...(entry.pageLinks?.anchors ?? [])],
    links: [...(entry.pageLinks?.links ?? [])],
  };
  const result = fn(pl);
  saveJournalEntry({ ...entry, pageLinks: pl });
  return result;
}

/**
 * Anchor a selection. SPLITS AT PARAGRAPH BOUNDARIES — a span never crosses one
 * (§1 rule 1) — so a selection covering three paragraphs yields THREE anchors
 * and the caller's act applies to all of them. Stated, never silent.
 *
 * `from`/`to` are VISIBLE-text offsets. Returns the anchors created.
 *
 * `prefix`/`suffix` are clamped to the anchor's OWN paragraph, deliberately: the
 * re-finding order searches that paragraph before it searches the page, and
 * context borrowed from a neighbouring paragraph could never be found there.
 */
export function anchorSelection(pageId: string, from: number, to: number): Anchor[] {
  const entry = getJournalEntry(pageId);
  if (!entry) return [];
  const v = visibleText(entry.text ?? '');
  const page = v.text;
  const start = Math.max(0, Math.min(from, to));
  const end = Math.min(page.length, Math.max(from, to));
  if (end <= start) return [];

  const created: Anchor[] = [];
  const now = new Date().toISOString();
  mutate(pageId, pl => {
    for (const p of paragraphRanges(page)) {
      const s = Math.max(start, p.start);
      const e = Math.min(end, p.end);
      if (e <= s) continue;
      const quote = page.slice(s, e);
      if (quote.trim() === '') continue;
      const a: Anchor = {
        id: generateId(),
        paraIndex: p.index,
        quote,
        prefix: page.slice(Math.max(p.start, s - CONTEXT), s),
        suffix: page.slice(e, Math.min(p.end, e + CONTEXT)),
        startHint: s - p.start,
        createdAt: now,
        updatedAt: now,
      };
      pl.anchors.push(a);
      created.push(a);
    }
  });
  return created;
}

/**
 * Anchor a caret with no selection — a spot-note's anchor. `quote` is ''.
 *
 * Its identity is its SURROUNDINGS, because it has no words of its own. Both
 * sides are recorded so that losing one still leaves an exact one-sided match.
 */
export function anchorSpot(pageId: string, at: number): Anchor | null {
  const entry = getJournalEntry(pageId);
  if (!entry) return null;
  const page = visibleText(entry.text ?? '').text;
  const caret = Math.max(0, Math.min(at, page.length));
  const para = paragraphRanges(page).find(p => caret >= p.start && caret <= p.end);
  const lo = para ? para.start : 0;
  const hi = para ? para.end : page.length;
  const now = new Date().toISOString();
  const a: Anchor = {
    id: generateId(),
    paraIndex: para ? para.index : 0,
    quote: '',
    prefix: page.slice(Math.max(lo, caret - CONTEXT), caret),
    suffix: page.slice(caret, Math.min(hi, caret + CONTEXT)),
    startHint: caret - lo,
    createdAt: now,
    updatedAt: now,
  };
  mutate(pageId, pl => { pl.anchors.push(a); });
  return a;
}

/** Attach a link to an existing anchor. */
export function addLink(
  pageId: string,
  anchorId: string,
  link: Omit<Link, 'id' | 'anchorId' | 'createdAt' | 'updatedAt'>,
): Link | null {
  const now = new Date().toISOString();
  const made: Link = { ...link, id: generateId(), anchorId, createdAt: now, updatedAt: now };
  const ok = mutate(pageId, pl => {
    if (!pl.anchors.some(a => a.id === anchorId && !a.deletedAt)) return false;
    pl.links.push(made);
    return true;
  });
  return ok ? made : null;
}

/**
 * UNLINK — and it never deletes anything else. Nick's word: "Remove unlinks and
 * never deletes." The link is soft-deleted; the ANCHOR survives if other links
 * still use it; the TARGET is untouched. The caller's wording must say which of
 * the two it will do ("Remove this link", never a bare "Remove").
 *
 * An anchor left with no live links is KEPT, not swept. Sweeping it would make
 * "remove" delete something the writer did not point at, and a lost anchor is
 * already required to survive on its own.
 */
export function unlink(pageId: string, linkId: string): void {
  const now = new Date().toISOString();
  mutate(pageId, pl => {
    const i = pl.links.findIndex(l => l.id === linkId && !l.deletedAt);
    if (i < 0) return;
    pl.links[i] = { ...pl.links[i], deletedAt: now, updatedAt: now };
  });
}

/**
 * Point an ambiguous anchor at the match the writer chose. This is the ONLY way
 * an anchor's position is ever resolved from several candidates — by the
 * writer, never by the code. `matchIndex` indexes `ambiguousMatches`, so the
 * offer the rail made and the commit here cannot disagree.
 */
export function disambiguateAnchor(pageId: string, anchorId: string, matchIndex: number): void {
  const entry = getJournalEntry(pageId);
  if (!entry) return;
  const anchor = entry.pageLinks?.anchors.find(a => a.id === anchorId && !a.deletedAt);
  if (!anchor) return;
  const page = visibleText(entry.text ?? '').text;
  const matches = ambiguousMatches(entry.text ?? '', anchor);
  const chosen = matches[matchIndex];
  if (!chosen) return;
  const para = paragraphRanges(page).find(p => chosen.start >= p.start && chosen.start <= p.end);
  const lo = para ? para.start : 0;
  const hi = para ? para.end : page.length;
  const now = new Date().toISOString();
  mutate(pageId, pl => {
    const i = pl.anchors.findIndex(a => a.id === anchorId);
    if (i < 0) return;
    const { status: _cleared, ...rest } = pl.anchors[i];
    pl.anchors[i] = {
      ...rest,
      paraIndex: para ? para.index : 0,
      startHint: chosen.start - lo,
      prefix: page.slice(Math.max(lo, chosen.start - CONTEXT), chosen.start),
      suffix: page.slice(chosen.end, Math.min(hi, chosen.end + CONTEXT)),
      updatedAt: now,
    };
  });
}

// The empty shape, exported so callers never have to spell it and so "a page
// with no links" has exactly one representation.
export { emptyLinks };
