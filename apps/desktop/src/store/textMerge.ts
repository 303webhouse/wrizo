// #76 PART 3 - KEEP BOTH. Two windows (or two devices) wrote the same page from the same starting text; neither saw the other's words. This is the three-way merge that puts both back together, and it NEVER DROPS A WORD
// one side wrote:
//   - base   the text both started from (what this window last loaded or saved)
//   - mine   this window's text
//   - theirs the other window's text
//   Paragraphs (lines) that only one side changed take that side's change. A paragraph BOTH sides changed is NEVER blended word by word (that could write a sentence neither window wrote): both WHOLE versions are kept, one under the other.
//   A paragraph one side deleted and the other edited keeps the edit. Two paragraphs added at the same place are both kept. A paragraph added next to one the other side edited is no conflict (it is not the same paragraph).
//   Every line of the result is a whole line from base, mine or theirs.
//   The order of two things kept side by side is decided by their own text, never by which window is "mine", so mergeText(base, a, b) and mergeText(base, b, a) are the same text and two windows merging each other's work settle on one page.
// Pure: no DOM, no storage, no clock.

export interface MergeResult {
  text: string;
  /** both sides had changed the text (neither was the base): a real merge happened */
  merged: boolean;
  /** at least one paragraph was changed on both sides, so both whole versions of it are kept (this is what the quiet line says) */
  kept: boolean;
  /** where a caret at `offset` in `mine` stands in the merged text (the same place in the same line) */
  mapCaret: (offset: number) => number;
}

interface Range { bs: number; be: number; os: number; oe: number }   // base [bs, be) became other [os, oe)
interface Piece { lines: string[]; from: number[] }                  // from[k]: the line of MINE that lines[k] is, or -1 when it did not come from mine

const LCS_LIMIT = 3_000_000;       // cells of the line/word table; beyond it a changed stretch is one block (safe: it only ever keeps more, never less)
const TOKEN_LIMIT = 20_000;        // caret mapping only: longer texts are not aligned word by word

const NL = String.fromCharCode(10);
const splitTokens = (s: string): string[] => s.match(/\s+|\S+/g) ?? [];
const offsets = (parts: string[]): number[] => { const o: number[] = []; let p = 0; for (const x of parts) { o.push(p); p += x.length; } return o; };

/** The stretches where `other` differs from `base`: a common start and end are trimmed, the middle is aligned by its longest common subsequence. */
function changes(base: string[], other: string[]): Range[] {
  let p = 0;
  while (p < base.length && p < other.length && base[p] === other[p]) p += 1;
  let s = 0;
  while (s < base.length - p && s < other.length - p && base[base.length - 1 - s] === other[other.length - 1 - s]) s += 1;
  const a = base.slice(p, base.length - s), b = other.slice(p, other.length - s);
  if (!a.length && !b.length) return [];
  if (!a.length || !b.length || a.length * b.length > LCS_LIMIT) return [{ bs: p, be: p + a.length, os: p, oe: p + b.length }];
  const n = a.length, m = b.length, w = m + 1;
  const t = new Uint32Array((n + 1) * w);
  for (let i = n - 1; i >= 0; i -= 1) for (let j = m - 1; j >= 0; j -= 1) t[i * w + j] = a[i] === b[j] ? t[(i + 1) * w + j + 1] + 1 : Math.max(t[(i + 1) * w + j], t[i * w + j + 1]);
  const out: Range[] = [];
  let i = 0, j = 0, bi = -1, bj = -1;
  const close = () => { if (bi >= 0) { out.push({ bs: p + bi, be: p + i, os: p + bj, oe: p + j }); bi = -1; } };
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) { close(); i += 1; j += 1; continue; }
    if (bi < 0) { bi = i; bj = j; }
    if (j >= m || (i < n && t[(i + 1) * w + j] >= t[i * w + j + 1])) i += 1; else j += 1;
  }
  close();
  return out;
}

/** For each base line, the line of `other` it is, when `other` left it alone (-1 for a line inside a changed stretch). */
function alignMap(baseLen: number, hunks: Range[]): number[] {
  const map: number[] = new Array(baseLen).fill(-1);
  let p = 0, shift = 0;
  for (const h of hunks) {
    for (let k = p; k < h.bs; k += 1) map[k] = k + shift;
    shift += (h.oe - h.os) - (h.be - h.bs);
    p = h.be;
  }
  for (let k = p; k < baseLen; k += 1) map[k] = k + shift;
  return map;
}

/** The three-way merge of three arrays of lines. Hunks that overlap (or two insertions at the very same place) form one stretch; a stretch only one side changed takes that side's version; a stretch both changed is handed to
 *  `resolve`, which keeps both WHOLE versions. A change that only touches the edge of another (a paragraph added just after one the other side edited) is not a conflict. */
function diff3(base: string[], mine: string[], theirs: string[], resolve: (b: string[], m: Piece, t: Piece) => Piece): Piece[] {
  type H = Range & { side: 0 | 1 };
  const hm = changes(base, mine), ht = changes(base, theirs);
  const mineOf = alignMap(base.length, hm);
  const all: H[] = [...hm.map((h) => ({ ...h, side: 0 as const })), ...ht.map((h) => ({ ...h, side: 1 as const }))];
  all.sort((x, y) => x.bs - y.bs || x.be - y.be || x.side - y.side);
  const stretches: { bs: number; be: number; hs: H[] }[] = [];
  for (const h of all) {
    const cur = stretches[stretches.length - 1];
    if (cur && (h.bs < cur.be || (h.bs === cur.be && h.be === h.bs && cur.be === cur.bs))) { cur.be = Math.max(cur.be, h.be); cur.hs.push(h); } else stretches.push({ bs: h.bs, be: h.be, hs: [h] });
  }
  const out: Piece[] = [];
  const keep = (from: number, to: number): void => { if (to > from) out.push({ lines: base.slice(from, to), from: mineOf.slice(from, to) }); };
  let p = 0;
  for (const st of stretches) {
    keep(p, st.bs);
    // each side's version of the stretch: the base with that side's changes in it (a base line that side left alone is the same line of mine when mine is the side)
    const apply = (side: 0 | 1): Piece => {
      const arr = side === 0 ? mine : theirs;
      const hs = st.hs.filter((h) => h.side === side);
      const lines: string[] = [], from: number[] = [];
      let q = st.bs;
      const take = (a: number, b: number) => { for (let k = a; k < b; k += 1) { lines.push(base[k]); from.push(mineOf[k]); } };
      for (const h of hs) { take(q, h.bs); for (let k = h.os; k < h.oe; k += 1) { lines.push(arr[k]); from.push(side === 0 ? k : -1); } q = h.be; }
      take(q, st.be);
      return { lines, from };
    };
    const b = base.slice(st.bs, st.be);
    const m = apply(0), t = apply(1);
    const hasMine = st.hs.some((h) => h.side === 0), hasTheirs = st.hs.some((h) => h.side === 1);
    if (hasMine && !hasTheirs) out.push(m);
    else if (hasTheirs && !hasMine) out.push(t);
    else if (m.lines.join(NL) === t.lines.join(NL) && m.lines.length === t.lines.length) out.push(m);
    else out.push(resolve(b, m, t));
    p = st.be;
  }
  keep(p, base.length);
  return out;
}

export function mergeText(base: string, mine: string, theirs: string): MergeResult {
  const same = (text: string, merged: boolean): MergeResult => ({ text, merged, kept: false, mapCaret: (o) => Math.max(0, Math.min(o, text.length)) });
  if (mine === theirs) return same(mine, false);
  if (mine === base) return same(theirs, false);
  if (theirs === base) return same(mine, false);

  let kept = false;
  const resolve = (b: string[], m: Piece, t: Piece): Piece => {
    const mj = m.lines.join(NL), tj = t.lines.join(NL);
    if (!mj && b.length) return t;            // a paragraph mine deleted and theirs edited: the edit stays
    if (!tj && b.length) return m;
    // the same paragraph changed on both sides (or two paragraphs added at the same place): NO word-by-word blending, it could write a sentence neither window wrote. Both WHOLE versions are kept, one under the other, ordered by their own text.
    if (b.length) kept = true;
    return mj <= tj ? { lines: [...m.lines, ...t.lines], from: [...m.from, ...t.from] } : { lines: [...t.lines, ...m.lines], from: [...t.from, ...m.from] };
  };
  const ml = mine.split(NL);
  const pieces = diff3(base.split(NL), ml, theirs.split(NL), resolve);
  const lines: string[] = [], from: number[] = [];
  for (const pc of pieces) { lines.push(...pc.lines); from.push(...pc.from); }
  const text = lines.join(NL);
  const starts = offsets(lines.map((l) => `${l}${NL}`));
  const mineStarts = offsets(ml.map((l) => `${l}${NL}`));
  const outOfMine = new Map<number, number>();
  from.forEach((f, k) => { if (f >= 0 && !outOfMine.has(f)) outOfMine.set(f, k); });
  const mapCaret = (offset: number): number => {
    const c = Math.max(0, Math.min(offset, mine.length));
    let L = ml.length - 1;
    while (L > 0 && mineStarts[L] > c) L -= 1;
    const col = c - mineStarts[L];
    const at = outOfMine.get(L);
    if (at !== undefined) return Math.min(starts[at] + col, starts[at] + lines[at].length);
    // a line of mine that is not in the merge (it was replaced): the start of the next line of mine that is
    for (let k = L + 1; k < ml.length; k += 1) { const o = outOfMine.get(k); if (o !== undefined) return starts[o]; }
    return text.length;
  };
  return { text, merged: true, kept, mapCaret };
}

/** Where a caret at `offset` in `oldText` stands once the text has changed to `newText` (words added or removed elsewhere): just after the same character, found by aligning the two word by word. A caret inside a stretch that was rewritten goes to the end of what replaced it. */
export function mapCaretThrough(oldText: string, newText: string, offset: number): number {
  const c = Math.max(0, Math.min(offset, oldText.length));
  if (c === 0) return 0;
  const a = splitTokens(oldText), b = splitTokens(newText);
  if (a.length + b.length > TOKEN_LIMIT * 2) return Math.min(c, newText.length);
  const aOff = offsets(a), bOff = offsets(b);
  let k = a.length - 1;
  while (k > 0 && aOff[k] > c - 1) k -= 1;
  const hs = changes(a, b);
  let delta = 0;
  for (const h of hs) {
    if (k >= h.bs && k < h.be) return Math.min(newText.length, h.oe < b.length ? bOff[h.oe] : newText.length);
    if (h.be <= k) delta += (h.oe - h.os) - (h.be - h.bs);
  }
  const k2 = k + delta;
  if (k2 < 0 || k2 >= b.length) return newText.length;
  return Math.min(newText.length, bOff[k2] + (c - aOff[k]));
}
