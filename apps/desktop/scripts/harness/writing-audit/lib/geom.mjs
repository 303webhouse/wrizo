// THE LAYOUT-AWARE ORACLE (writing audit, session 2): where a caret should land when the answer depends on how the text is laid out, not on counting characters. Pure functions over `stops`, the page's own
// geometry for every caret position - one entry per plain offset p: { p, x, top, height } - read by probe.stops() BEFORE the step, so the expectation comes from the layout as it stood, not from the result.
//   Up / Down      the neighbouring visual line, at the stop nearest the GOAL column: the x the caret had when the run of vertical moves began (a proportional face keeps the goal x, not a character count)
//   Home / End     the visual line's first stop; its last (a soft-wrapped line may end before or after its trailing space, so both are accepted)
//   a click        the stop nearest the click's x on the clicked line (right of the line's end: its end)
// A result is a LIST of acceptable offsets: where the browser's own tie-break could honestly go either way, both are right; a finding needs a landing outside the list.
// ORACLE ASSUMPTIONS (a finding resting on one says so): Up on the first visual line goes to the start of the document and Down on the last to its end (Chrome), or stays (accepted both);
// two stops within 1 px of the same distance from the goal are a tie.
const LINE_TOL = 3;   // px: stops whose tops differ by less than this are on one visual line

/** group stops (ordered by p) into visual lines: [{ top, height, ps: [p...], xs: [x...] }] */
export function visualLines(stops) {
  const lines = [];
  for (const s of stops) {
    if (s.x === undefined || s.top === undefined) continue;
    const last = lines[lines.length - 1];
    if (last && Math.abs(s.top - last.top) < LINE_TOL) { last.ps.push(s.p); last.xs.push(s.x); }
    else lines.push({ top: s.top, height: s.height, ps: [s.p], xs: [s.x] });
  }
  return lines;
}

export const lineOf = (lines, p) => lines.findIndex((l) => l.ps.includes(p));

/** the offsets on `line` nearest x (all within 1 px of the best distance) */
export function nearest(line, x) {
  let best = Infinity;
  line.xs.forEach((sx) => { best = Math.min(best, Math.abs(sx - x)); });
  return line.ps.filter((_, i) => Math.abs(line.xs[i] - x) <= best + 1);
}

/** Up / Down from offset p with goal column goalX */
export function vertical(lines, p, goalX, dir, n) {
  const li = lineOf(lines, p);
  if (li < 0) return null;
  const to = li + (dir === 'up' ? -1 : 1);
  if (to < 0) return [0, p];                 // first line: the start of the document (or no move)
  if (to >= lines.length) return [n, p];     // last line: the end of the document (or no move)
  return nearest(lines[to], goalX);
}

/** Home / End on the visual line holding p; `text` lets End allow a trailing space */
export function homeEnd(lines, p, key, text) {
  const li = lineOf(lines, p);
  if (li < 0) return null;
  const L = lines[li];
  if (key === 'Home') return [L.ps[0]];
  const next = lines[li + 1];
  const last = L.ps[L.ps.length - 1];
  // the line's end: its last stop, or (soft wrap) the next line's first stop, one past a trailing space
  if (next) { const w = next.ps[0]; return [...new Set([w - 1, w, last])].filter((q) => q >= L.ps[0]); }
  return [last];
}

/** a click at (x, line li): the stop nearest x; right of the end of a soft-wrapped line also allows the position before its trailing space */
export function hit(lines, li, x) {
  const L = lines[li];
  if (!L) return null;
  const c = nearest(L, x);
  const beyond = x > L.xs[L.xs.length - 1] + 2;
  if (beyond && lines[li + 1]) { const w = lines[li + 1].ps[0]; return [...new Set([...c, w - 1])]; }
  return c;
}

/** the centre of a stop's line, for aiming a mouse at it */
export const stopPoint = (s) => ({ x: s.x, y: s.top + (s.height || 18) / 2 });
