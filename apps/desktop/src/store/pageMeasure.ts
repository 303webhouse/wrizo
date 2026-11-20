// PAGE BREAKS - THE HIDDEN LETTER PAGE (the DOM half; the pure walk is store/pageBreaks.ts). The page's text is laid out in an off-screen copy of
// the editor's own class chain: the framed letter stage on top (desk-frame-stage--prose, so the page is the letter page at scale 1 even under
// the 1,100 px gate), then the live chain from .mode-pagecol down to the editor (its classes, its inline dress, face and size), holding the
// very rows Draft draws (lineRows.rowMarkupFor) of the CLEAN text. A bare copy that only took the editor's font was measured NOT to be enough
// (the live rows carry line-break and unicode-bidi a bare block lacks), so the copy carries the chain. --wz-k and --wz-zoom are pinned to 1:
// nothing in it reads the window, so a resize or the Typewriter zoom never moves a break. It is hidden, inert and aria-hidden; nothing in it
// is ever stored [pageMeasure §1]
import type { JournalEntry } from '../types';
import { EOF_GUARD } from './draftDecoration';
import { rowMarkupFor, rowsFor, rowsCaretOffset, rowsDomPoint } from './lineRows';
import { walkLines, PAGE_TEXT_H, type LineUnit } from './pageBreaks';
import { getJournalEntries, getJournalEntry, getProject, getSystemKind, isAutoSet, isPairedPlanBoard } from './persistence';
import { compareSections } from './place';

interface Level { tag: string; cls: string; style: string; data: Record<string, string> }

// the letter stage above the page column: what the framed prose page sits in, so its CSS (the letter width, margins in page-inches, type in
// points) lays the copy out exactly as the framed page, at any window [pageMeasure §2]
const TOP: Level[] = [
  { tag: 'div', cls: 'desk-frame-stage desk-frame-stage--prose', style: '', data: {} },
  { tag: 'div', cls: 'mode-stage', style: '', data: {} },
  { tag: 'div', cls: 'mode-row', style: '', data: { 'data-framed': 'true' } },
];
// attributes of the live chain that say where the page is (zoomed, which sheet), never how its lines lay out
const DROP = new Set(['data-zoom', 'data-page', 'data-scrolled', 'data-writing', 'contenteditable']);

// what changes while she writes but never lays a line out: the Typewriter's own variables (written on the scroller and the column per key) and
// the page's focus class. Left in, they would re-key the copy and rebuild it at every pause [pageMeasure §1b]
const VOLATILE_CLASS = new Set(['focused']);
const steadyStyle = (s: string) => s.split(';').map((d) => d.trim()).filter((d) => d && !d.startsWith('--tw')).join('; ');

/** The live chain from .mode-pagecol down to the editor (outermost first). Null when the editor is not in a page column. */
export function liveChain(ed: HTMLElement): Level[] | null {
  const out: Level[] = [];
  for (let e: HTMLElement | null = ed; e; e = e.parentElement) {
    const data: Record<string, string> = {};
    for (const a of Array.from(e.attributes)) if (a.name.startsWith('data-') && !DROP.has(a.name)) data[a.name] = a.value;
    const cls = (e.getAttribute('class') || '').split(/\s+/).filter((c) => c && !VOLATILE_CLASS.has(c)).join(' ');
    out.push({ tag: e.tagName.toLowerCase(), cls, style: steadyStyle(e.getAttribute('style') || ''), data });
    if (e.classList.contains('mode-pagecol')) return out.reverse();
  }
  return null;
}

/** What decides the copy's layout: the chain and the root's theme attributes (a theme or page tone can change the face). */
export function chainKey(chain: Level[]): string {
  const r = document.documentElement;
  const root = ['data-theme', 'data-arbor2', 'data-arbor2-room', 'data-cast', 'data-page'].map((k) => r.getAttribute(k) ?? '').join('|');
  return root + '#' + JSON.stringify(chain);
}

// ---- lines of one row: distinct line tops (a count) and where each line starts (by a character's line, never a deep position) ----
const NL = '\n';
const range = (): Range => document.createRange();
function textNodes(root: Node): { nodes: Text[]; starts: number[]; total: number } {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [], starts: number[] = [];
  let p = 0, n: Node | null;
  while ((n = w.nextNode())) { nodes.push(n as Text); starts.push(p); p += (n as Text).data.length; }
  return { nodes, starts, total: p };
}
function locate(T: { nodes: Text[]; starts: number[] }, o: number): [Text, number] {
  let lo = 0, hi = T.starts.length - 1;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (T.starts[m] <= o) lo = m; else hi = m - 1; }
  return [T.nodes[lo], o - T.starts[lo]];
}
function rectAt(T: { nodes: Text[]; starts: number[]; total: number }, o: number, R: Range): DOMRect | null {
  for (let k = 0; k < 40 && o + k < T.total; k++) {
    const [n, off] = locate(T, o + k);
    const ch = n.data[off];
    if (ch === NL || ch === EOF_GUARD) continue;
    R.setStart(n, off); R.setEnd(n, off + 1);
    for (const q of Array.from(R.getClientRects())) if (q.height >= 4) return q;
  }
  return null;
}
/** A row's unit (its base is filled in by the caller). */
export function unitOfRow(row: HTMLElement): LineUnit {
  const h = parseFloat(getComputedStyle(row).height) || 0;
  const T = textNodes(row);
  if (T.total === 0) return { h, n: 1, starts: [0], base: 0 };
  const R = range();
  const [a, ao] = locate(T, 0);
  const [b, bo] = locate(T, T.total - 1);
  R.setStart(a, ao); R.setEnd(b, Math.min(b.data.length, bo + 1));
  const tops = Array.from(R.getClientRects()).filter((q) => q.height >= 4).map((q) => q.top).sort((x, y) => x - y);
  const lt: number[] = [];
  for (const t of tops) if (!lt.length || t - lt[lt.length - 1] > 3) lt.push(t);
  if (lt.length <= 1) return { h, n: 1, starts: [0], base: 0 };
  const starts = [0];
  for (let k = 1; k < lt.length; k++) {
    let c = 0, d = T.total;
    while (c < d) { const m = (c + d) >> 1; const q = rectAt(T, m, R); if (q && q.top >= lt[k] - 3) d = m; else c = m + 1; }
    starts.push(c);
  }
  return { h, n: lt.length, starts, base: 0 };
}

// ---- the copy ----
export class LetterPage {
  readonly key: string;
  private root: HTMLElement;
  private host: HTMLElement;
  private rows: HTMLElement[] = [];
  private lines: string[] = [];
  private units: (LineUnit | null)[] = [];

  constructor(chain: Level[], key: string) {
    this.key = key;
    let root: HTMLElement | null = null, cur: HTMLElement | null = null;
    for (const [i, c] of [...TOP, ...chain].entries()) {
      const el = document.createElement(c.tag);
      if (c.cls) el.setAttribute('class', c.cls);
      if (c.style) el.setAttribute('style', c.style);
      for (const k of Object.keys(c.data)) el.setAttribute(k, c.data[k]);
      if (i === 0) {
        root = el;
        el.classList.add('wz-letter-measure');
        el.setAttribute('aria-hidden', 'true');
        el.setAttribute('inert', '');
        Object.assign(el.style, { position: 'fixed', left: '-30000px', top: '0px', width: '1400px', height: '900px', visibility: 'hidden', pointerEvents: 'none', overflow: 'hidden' });
        el.style.setProperty('--wz-k', '1');
        el.style.setProperty('--wz-zoom', '1');
      }
      if (cur) cur.appendChild(el);
      cur = el;
    }
    this.root = root!;
    this.host = cur!;
    this.host.style.position = 'relative';
    document.body.appendChild(this.root);
  }

  destroy(): void { this.root.remove(); this.rows = []; this.units = []; this.lines = []; }

  /** Make the copy hold `lines`: only the rows between the unchanged head and tail are rebuilt, and only their units are forgotten. */
  setLines(lines: string[]): void {
    const old = this.lines;
    if (!this.rows.length) {
      this.host.innerHTML = lines.map((_, i) => rowMarkupFor(lines, i)).join(NL);
      this.rows = Array.from(this.host.children).filter((c) => c.classList.contains('wz-row')) as HTMLElement[];
      this.units = lines.map(() => null);
      this.lines = lines.slice();
      return;
    }
    let a = 0;
    const minLen = Math.min(old.length, lines.length);
    while (a < minLen && old[a] === lines[a]) a++;
    let bo = old.length - 1, bn = lines.length - 1;
    while (bo >= a && bn >= a && old[bo] === lines[bn]) { bo--; bn--; }
    if (a > bo && a > bn) { this.lines = lines.slice(); return; }
    const mid: string[] = [];
    for (let i = a; i <= bn; i++) mid.push(rowMarkupFor(lines, i));
    const prev = a > 0 ? this.rows[a - 1] : null;
    const next = bo < old.length - 1 ? this.rows[bo + 1] : null;
    const R = range();
    if (prev) R.setStartAfter(prev); else R.setStart(this.host, 0);
    if (next) R.setEndBefore(next); else R.setEnd(this.host, this.host.childNodes.length);
    R.deleteContents();
    const html = mid.length ? (prev ? NL : '') + mid.join(NL) + (next ? NL : '') : (prev && next ? NL : '');
    const frag = R.createContextualFragment(html);
    const fresh = Array.from(frag.children).filter((c) => c.classList.contains('wz-row')) as HTMLElement[];
    R.insertNode(frag);
    this.rows.splice(a, bo - a + 1, ...fresh);
    this.units.splice(a, bo - a + 1, ...fresh.map(() => null));
    this.lines = lines.slice();
    // a last row's markup depends on its being last (the end guard): when the count changes, the row that was last and the row now last are redrawn
    if (old.length !== lines.length) for (const i of new Set([old.length - 1, lines.length - 1])) if (i >= 0 && i < lines.length) this.redraw(i);
  }

  private redraw(i: number): void {
    const html = rowMarkupFor(this.lines, i);
    if (this.rows[i].outerHTML === html) return;
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const fresh = tmp.firstElementChild as HTMLElement;
    this.rows[i].replaceWith(fresh);
    this.rows[i] = fresh;
    this.units[i] = null;
  }

  /** Measure up to `budget` rows still unmeasured; true when every row has its unit. */
  measureSome(budget: number): boolean {
    let left = budget;
    for (let i = 0; i < this.units.length; i++) {
      if (this.units[i]) continue;
      if (left-- <= 0) return false;
      this.units[i] = unitOfRow(this.rows[i]);
    }
    return true;
  }

  /** Re-measure one row now (the per-key path: one contained row's layout). */
  remeasure(i: number, line: string): boolean {
    if (i < 0 || i >= this.rows.length || this.lines.length !== this.rows.length) return false;
    if (this.lines[i] !== line) { this.lines[i] = line; this.redraw(i); }
    this.units[i] = unitOfRow(this.rows[i]);
    return true;
  }

  get lineCount(): number { return this.lines.length; }
  /** The clean offset where line `i` starts. */
  offsetOfLine(i: number): number { let p = 0; for (let k = 0; k < i && k < this.lines.length; k++) p += this.lines[k].length + 1; return p; }
  complete(): boolean { return this.units.every(Boolean); }

  /** The breaks of the text it holds (clean offsets). Only when every row is measured. */
  breaks(H: number = PAGE_TEXT_H): number[] | null {
    if (!this.complete()) return null;
    let base = 0;
    const us = this.units.map((u, i) => { const v = { ...(u as LineUnit), base }; base += this.lines[i].length + 1; return v; });
    return walkLines(us, H);
  }
}

// ---- the open editor's clean text, caret and points ----
const struck = (t: Text): boolean => !!(t.parentElement && t.parentElement.closest('.fo-struck'));

/** The editor's CLEAN text: Draft and Revise from their rows; Free Write without its struck runs and the end guard (its derived text). */
export function cleanText(ed: HTMLElement): string {
  const R = rowsFor(ed);
  if (R && !R.stale) return R.text;
  let s = '';
  const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT);
  let n: Node | null;
  while ((n = w.nextNode())) { const t = n as Text; if (!struck(t)) s += t.data; }
  return s.split(EOF_GUARD).join('');
}

/** The caret as a clean offset, or null. */
export function cleanCaret(ed: HTMLElement): number | null {
  const r = rowsCaretOffset(ed);
  if (r !== undefined) return r;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !sel.focusNode || !ed.contains(sel.focusNode)) return null;
  const node = sel.focusNode, off = sel.focusOffset;
  const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT);
  let p = 0, t: Node | null;
  const probe = range();
  while ((t = w.nextNode())) {
    const x = t as Text;
    const live = (k: number) => k - (x.data.slice(0, k).split(EOF_GUARD).length - 1);
    if (x === node) return struck(x) ? p : p + live(off);
    probe.setStart(node, off);
    if (probe.comparePoint(x, 0) >= 0) return p;   // the caret sits before this node
    if (!struck(x)) p += live(x.data.length);
  }
  return p;
}

/** A DOM point for clean offset `o` on the live page (the mark's character). */
export function cleanPoint(ed: HTMLElement, o: number): { node: Node; offset: number } | null {
  const r = rowsDomPoint(ed, o);
  if (r !== undefined) return r;
  const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT);
  let p = 0, t: Node | null;
  while ((t = w.nextNode())) {
    const x = t as Text;
    if (struck(x)) continue;
    for (let k = 0; k < x.data.length; k++) {
      if (x.data[k] === EOF_GUARD) continue;
      if (p === o) return { node: x, offset: k };
      p++;
    }
  }
  return null;
}

// ---- a Doc's sections (each opens a fresh page; the Doc counts on) ----
const listable = (e: JournalEntry): boolean => !e.deletedAt && !e.purgedAt && !getSystemKind(e) && !isPairedPlanBoard(e.id) && e.pageType !== 'board';
/** The open page's Doc, in the writer's order: a set she made lists its pages; anything else is a one-section Doc. Read-time only. */
export function docSections(id: string): JournalEntry[] {
  const e = getJournalEntry(id);
  if (!e) return [];
  const set = e.projectId ? getProject(e.projectId) : null;
  if (!set || isAutoSet(set)) return [e];
  const parts = getJournalEntries().filter((x) => x.projectId === set.id && listable(x)).sort(compareSections);
  return parts.some((x) => x.id === id) ? parts : [e];
}

// pages of a section that is not open, measured in a copy of the open page's chain and kept in memory by text and chain (never stored) [pageMeasure §3]
const sectionPages = new Map<string, number>();
export function pagesOfText(chain: Level[], key: string, text: string): number {
  const k = key + '\u0000' + text;
  const hit = sectionPages.get(k);
  if (hit !== undefined) return hit;
  const L = new LetterPage(chain, key);
  try { L.setLines(text.split(NL)); L.measureSome(Infinity); const br = L.breaks(); const n = br ? br.length + 1 : 1; sectionPages.set(k, n); return n; }
  finally { L.destroy(); }
}
