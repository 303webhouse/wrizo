// CD1 S6 — the goal system's unit of measure. A "line-equivalent" is
// deterministic and viewport-independent: hard newlines split the text into
// segments, and each segment's SOFT WRAP is computed against the paper's
// CANONICAL measure (not the actual rendered viewport width), so the same
// document always yields the same count on a phone, a 32" monitor, or a
// headless harness — the brief's own "no device drift" fence.
//
// CANONICAL_MEASURE_CH mirrors the prose paper's own canonical width
// (index.css's `.mode-pagecol` — `width:min(760px,60ch)`, the 60ch half of
// that rule). Kept in step BY HAND, the same seam DeskFrame.tsx's
// DESKFRAME_MIN_WIDTH/1100px pairing already establishes ("CSS can't read
// the JS constant") — nothing here reads index.css, and nothing in
// index.css reads this constant.
export const CANONICAL_MEASURE_CH = 60;

// A poem's short line counts 1 (Math.max floors every non-empty segment at
// one line); a blank hard-newline still occupies a line of its own (an
// empty segment ALSO floors to... zero — see the guard below, an entirely
// empty document is zero lines written, not one). Prose paragraphs wrap at
// the canonical measure, ceil'd (a 61-char line at a 60ch measure is 2
// lines, not 1.02).
export function countLineEquivalents(text: string, measureCh: number = CANONICAL_MEASURE_CH): number {
  if (!text) return 0;
  const segments = text.split('\n');
  let total = 0;
  for (const seg of segments) {
    total += seg.length === 0 ? 1 : Math.max(1, Math.ceil(seg.length / measureCh));
  }
  return total;
}
