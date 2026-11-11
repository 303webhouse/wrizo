// #76 PART 3 - KEEP BOTH. Two windows (or two devices) wrote the same page from the same starting text; neither saw the other's words. This is the three-way merge that puts both back together, and it NEVER DROPS A WORD
// one side wrote:
//   - base   the text both started from (what this window last loaded or saved)
//   - mine   this window's text
//   - theirs the other window's text
//   Paragraphs (lines) that only one side changed take that side's change. Paragraphs both changed are merged WORD BY WORD when the two changed different words (or each added words at the same place); where they changed the SAME words
//   differently, both versions of the paragraph are kept, one under the other. A paragraph one side deleted and the other edited keeps the edit. Anything the diff cannot bound (a page rewritten end to end on both sides) also keeps both.
//   The order of two things kept side by side is decided by their own text, never by which window is "mine", so mergeText(base, a, b) and mergeText(base, b, a) are the same text and two windows merging each other's work settle on one page.
// Pure: no DOM, no storage, no clock.

export interface MergeResult {
  text: string;
  /** both sides had changed the text (neither was the base): a real merge happened */
  merged: boolean;
  /** at least one paragraph was changed on both sides in the same words, so both versions of it are kept */
  kept: boolean;
  /** where a caret at `offset` in `mine` stands in the merged text (just after the same character) */
  mapCaret: (offset: number) => number;
}

interface Item { text: string; at: number }   // at: where this piece starts in MINE (a character offset), or -1 when it did not come from mine
interface Range { bs: number; be: number; os: number; oe: number }   // base [bs, be) became other [os, oe)

const LCS_LIMIT = 3_000_000;       // cells of the line/word table; beyond it a changed stretch is one block (safe: it only ever keeps more, never less)
const TOKEN_LIMIT = 20_000;        // a conflicting stretch longer than this many words is kept as two paragraphs, not merged word by word

const splitLines = (s: string): string[] => s.match(/[^\n]*\n|[^\n]+$/g) ?? [];
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

type Resolve = (base: string[], mine: string[], theirs: string[], mineAt: number) => Item[] | null;

/** The three-way merge of three arrays (lines or words). `mineOffs` are the character offsets of mine's elements and `mineBase` where mine starts in the page, so every piece knows where it came from in mine. `resolve` is asked
 *  what to do with a stretch both sides changed; null from it means "cannot", and the whole merge is null. */
function diff3(base: string[], mine: string[], theirs: string[], mineOffs: number[], mineBase: number, resolve: Resolve): Item[] | null {
  type H = Range & { side: 0 | 1 };
  const all: H[] = [...changes(base, mine).map((h) => ({ ...h, side: 0 as const })), ...changes(base, theirs).map((h) => ({ ...h, side: 1 as const }))];
  all.sort((x, y) => x.bs - y.bs || x.be - y.be || x.side - y.side);
  // stretches of the base that changed: hunks that overlap (or an insertion touching another) belong to one stretch
  const stretches: { bs: number; be: number; hs: H[] }[] = [];
  for (const h of all) {
    const cur = stretches[stretches.length - 1];
    if (cur && (h.bs < cur.be || (h.bs === cur.be && (h.be === h.bs || cur.bs === cur.be)))) { cur.be = Math.max(cur.be, h.be); cur.hs.push(h); } else stretches.push({ bs: h.bs, be: h.be, hs: [h] });
  }
  const items: Item[] = [];
  const atOf = (idx: number): number => (idx < mineOffs.length ? mineBase + mineOffs[idx] : mineBase + (mine.length ? mineOffs[mine.length - 1] + mine[mine.length - 1].length : 0));
  const keep = (from: number, to: number, mi: number): void => { if (to > from) items.push({ text: base.slice(from, to).join(''), at: atOf(mi) }); };
  let p = 0;        // next base index
  let mi = 0;       // the mine index that base index p stands at (mine's unchanged stretches line up with the base)
  for (const st of stretches) {
    keep(p, st.bs, mi);
    mi += st.bs - p;
    const baseSlice = base.slice(st.bs, st.be);
    // each side's version of the stretch: the base with that side's changes in it
    const apply = (side: 0 | 1): string[] => {
      const arr = side === 0 ? mine : theirs;
      const hs = st.hs.filter((h) => h.side === side);
      if (!hs.length) return baseSlice;
      const parts: string[] = [];
      let q = st.bs;
      for (const h of hs) { parts.push(...base.slice(q, h.bs), ...arr.slice(h.os, h.oe)); q = h.be; }
      parts.push(...base.slice(q, st.be));
      return parts;
    };
    const mineSlice = apply(0), theirsSlice = apply(1);
    const hasMine = st.hs.some((h) => h.side === 0), hasTheirs = st.hs.some((h) => h.side === 1);
    const here = atOf(mi);
    if (hasMine && !hasTheirs) items.push({ text: mineSlice.join(''), at: here });
    else if (hasTheirs && !hasMine) items.push({ text: theirsSlice.join(''), at: -1 });
    else if (mineSlice.join('') === theirsSlice.join('')) items.push({ text: mineSlice.join(''), at: here });
    else {
      const r = resolve(baseSlice, mineSlice, theirsSlice, here);
      if (!r) return null;
      items.push(...r);
    }
    mi += mineSlice.length;
    p = st.be;
  }
  keep(p, base.length, mi);
  return items;
}

/** WORD BY WORD, for a paragraph both sides changed: only changes that do not touch each other merge (two insertions at the same place keep both, in the order of their own text); a deletion against an edit keeps the edit. */
function mergeWords(baseText: string, mineText: string, theirsText: string, mineAt: number): Item[] | null {
  const tb = splitTokens(baseText), tm = splitTokens(mineText), tt = splitTokens(theirsText);
  if (tb.length + tm.length + tt.length > TOKEN_LIMIT) return null;
  const resolveWords: Resolve = (b, m, t, at) => {
    const bj = b.join(''), mj = m.join(''), tj = t.join('');
    if (mj === tj) return [{ text: mj, at }];
    if (!b.length) {   // both added words at this same place: both stay, the smaller text first (never "mine first")
      return mj < tj ? [{ text: mj, at }, { text: tj, at: -1 }] : [{ text: tj, at: -1 }, { text: mj, at }];
    }
    if (!mj && bj) return [{ text: tj, at: -1 }];          // mine deleted what theirs edited: the edit stays
    if (!tj && bj) return [{ text: mj, at }];
    return null;                                           // the same words changed in two ways: the paragraph keeps both
  };
  return diff3(tb, tm, tt, offsets(tm), mineAt, resolveWords);
}

export function mergeText(base: string, mine: string, theirs: string): MergeResult {
  const same = (text: string, merged: boolean): MergeResult => ({ text, merged, kept: false, mapCaret: (o) => Math.max(0, Math.min(o, text.length)) });
  if (mine === theirs) return same(mine, false);
  if (mine === base) return { ...same(theirs, false), mapCaret: (o) => Math.max(0, Math.min(o, theirs.length)) };
  if (theirs === base) return same(mine, false);

  let kept = false;
  const lm = splitLines(mine);
  const resolveLines: Resolve = (b, m, t, at) => {
    const bj = b.join(''), mj = m.join(''), tj = t.join('');
    if (mj === tj) return [{ text: mj, at }];
    if (!mj && bj) return [{ text: tj, at: -1 }];           // a paragraph mine deleted and theirs edited: the edit stays
    if (!tj && bj) return [{ text: mj, at }];
    const words = mergeWords(bj, mj, tj, at);
    if (words) return words;
    // the same words changed in two ways: both versions are kept, one under the other, ordered by their own text
    kept = true;
    const glue = (x: string) => (x.endsWith('\n') ? x : `${x}\n`);
    return mj <= tj
      ? [{ text: glue(mj), at }, { text: tj, at: -1 }]
      : [{ text: glue(tj), at: -1 }, { text: mj, at }];
  };
  let items = diff3(splitLines(base), lm, splitLines(theirs), offsets(lm), 0, resolveLines);
  if (!items) {   // cannot happen (resolveLines always answers), kept for the type: keep both whole
    kept = true;
    items = mine <= theirs ? [{ text: `${mine}${mine.endsWith('\n') ? '' : '\n'}`, at: 0 }, { text: theirs, at: -1 }] : [{ text: `${theirs}${theirs.endsWith('\n') ? '' : '\n'}`, at: -1 }, { text: mine, at: 0 }];
  }
  const text = items.map((i) => i.text).join('');
  const starts: number[] = [];
  let pos = 0;
  for (const it of items) { starts.push(pos); pos += it.text.length; }
  const mapCaret = (offset: number): number => {
    const c = Math.max(0, Math.min(offset, mine.length));
    if (c === 0) return 0;
    for (let k = 0; k < items.length; k += 1) {
      const a = items[k].at;
      if (a >= 0 && a <= c - 1 && c - 1 < a + items[k].text.length) return starts[k] + (c - 1 - a) + 1;
    }
    for (let k = 0; k < items.length; k += 1) if (items[k].at >= c) return starts[k];
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
