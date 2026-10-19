import { stripMarkdownConventions } from './draftFormat';

// PAGE TEMPLATES, S1 (docs/plans/page-templates.md §1) - THE OUTLINE'S TEXT.
//
// An Outline page's `entry.text` is one heading per line. A line's LEVEL is its leading-tab count (the page dialect's
// own indent, `LINE_DIRECTIVE.indent`), capped at three levels (0..2, as the approved mockup). NO NUMBER IS EVER
// STORED: the numbers (`1.`, `1.1`, `1.1.1`) are derived from the levels every time they are drawn or exported, so
// indenting, reordering or a merge can never leave a stale one. This module is pure and total: no React, no storage.
//
// THE EFFECTIVE LEVEL is the stored tab count clamped to 0..OUTLINE_MAX_LEVEL and to at most the previous row's level + 1
// (an outline cannot skip a level; the first row is level 0). The clamp is applied when READING. The stored text is
// never rewritten by a read: a page whose tabs over-run the clamp still draws sensibly and keeps every character.

export const OUTLINE_MAX_LEVEL = 2;

export interface OutlineRow {
  /** the stored text of the line, tabs included */
  raw: string;
  /** the line without its leading tabs */
  body: string;
  /** the leading-tab count as stored */
  tabs: number;
  /** the effective level, 0..OUTLINE_MAX_LEVEL, never more than the previous row's + 1 */
  level: number;
}

export function outlineRows(text: string): OutlineRow[] {
  const rows: OutlineRow[] = [];
  let prev = -1;
  for (const raw of (text ?? '').split('\n')) {
    let tabs = 0;
    while (tabs < raw.length && raw[tabs] === '\t') tabs += 1;
    const level = Math.max(0, Math.min(tabs, OUTLINE_MAX_LEVEL, prev + 1));
    rows.push({ raw, body: raw.slice(tabs), tabs, level });
    prev = level;
  }
  return rows;
}

/** The derived number of every row: level 0 reads `1.`, deeper levels `1.1`, `1.1.1` (the mockup's rule). Every row is numbered. */
export function outlineNumbers(rows: readonly OutlineRow[]): string[] {
  const c = [0, 0, 0];
  return rows.map((r) => {
    c[r.level] += 1;
    for (let d = r.level + 1; d <= OUTLINE_MAX_LEVEL; d += 1) c[d] = 0;
    return c.slice(0, r.level + 1).join('.') + (r.level === 0 ? '.' : '');
  });
}

function lineSpans(text: string): Array<{ ls: number; le: number }> {
  const spans: Array<{ ls: number; le: number }> = [];
  let ls = 0;
  for (;;) {
    const le = text.indexOf('\n', ls);
    if (le === -1) { spans.push({ ls, le: text.length }); break; }
    spans.push({ ls, le });
    ls = le + 1;
  }
  return spans;
}

export interface OutlineShift { text: string; start: number; end: number }

/**
 * Tab (+1) and Shift+Tab (-1) over the lines a selection touches. The new level of each line is clamped exactly as a read clamps it
 * (0..2, at most previous + 1), so an indent that would skip a level does nothing for that line. Only the leading tabs change.
 * A selection that ends exactly at a line's first character has not touched that line. The selection is carried across the edit.
 */
export function outlineShift(text: string, start: number, end: number, dir: 1 | -1): OutlineShift {
  const spans = lineSpans(text);
  const first = spans.findIndex((s) => start <= s.le);
  let last = spans.findIndex((s) => end <= s.le);
  if (first < 0) return { text, start, end };
  if (last < 0) last = spans.length - 1;
  if (end > start && last > first && spans[last].ls === end) last -= 1;
  const rows = outlineRows(text);
  const edits: Array<{ at: number; del: number; ins: string }> = [];
  let prevLevel = first > 0 ? rows[first - 1].level : -1;
  for (let i = first; i <= last; i += 1) {
    const cur = rows[i];
    const want = Math.max(0, Math.min(cur.level + dir, OUTLINE_MAX_LEVEL, prevLevel + 1));
    // when moving the first line shallower, the lines under it keep their own (re-clamped on read) tabs
    const next = want;
    if (next !== cur.tabs) edits.push({ at: spans[i].ls, del: cur.tabs, ins: '\t'.repeat(next) });
    prevLevel = next;
  }
  if (edits.length === 0) return { text, start, end };
  let out = '';
  let cursor = 0;
  for (const e of edits) { out += text.slice(cursor, e.at) + e.ins; cursor = e.at + e.del; }
  out += text.slice(cursor);
  const map = (x: number): number => {
    let shift = 0;
    for (const e of edits) {
      if (x < e.at) break;
      if (x <= e.at + e.del) return e.at + shift + e.ins.length;
      shift += e.ins.length - e.del;
    }
    return x + shift;
  };
  return { text: out, start: map(start), end: map(end) };
}

/** The leading tabs a NEW row (Enter) opens with: the same level as the row the caret is on. */
export function outlineNextRowPrefix(text: string, caret: number): string {
  const spans = lineSpans(text);
  const i = Math.max(0, spans.findIndex((s) => caret <= s.le));
  const rows = outlineRows(text);
  return '\t'.repeat(rows[i]?.level ?? 0);
}

/**
 * The page's body for a downloaded file or a copy. `plain` is the "My Words" reading, `formatted` the Markdown one.
 * Both write the derived numbers (the file should match the page the writer sees, and `.txt` has no other way to carry a level)
 * and neither writes a leading tab: a tab-indented line is a code block in Markdown, and the existing `.txt` path would strip it.
 *   plain      `1. Arrival` / `  1.1 The late ferry`   (two spaces per level)
 *   formatted  `- 1. Arrival` / `  - 1.1 The late ferry`   (a Markdown list: each row its own item, so no soft-wrap merging)
 * Rows with no words are skipped (a trailing empty row is where the caret sits, not an entry).
 */
export function outlineBody(text: string, form: 'plain' | 'formatted'): string {
  const rows = outlineRows(text);
  const nums = outlineNumbers(rows);
  const lines: string[] = [];
  rows.forEach((r, i) => {
    const body = form === 'plain' ? stripMarkdownConventions(r.body) : r.body;
    if (!body.trim()) return;
    const pad = '  '.repeat(r.level);
    lines.push(form === 'plain' ? `${pad}${nums[i]} ${body}` : `${pad}- ${nums[i]} ${body}`);
  });
  return lines.join('\n');
}
