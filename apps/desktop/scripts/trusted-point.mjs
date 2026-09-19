// ITEM 151 (Shape A) — THE SHARED HIT-TEST, CANONICAL SOURCE.
//
// A CDP coordinate dispatch (`app.mouseDown(x, y)` / `mouseUp(x, y)`) has no
// element and no selector — it fires at a literal point. Every helper found
// carrying this shape asked "did the selector match ANYTHING" (a null check
// on a `getBoundingClientRect()` read) and none asked "is MY point on top,
// right now" — so a well-formed selector with a real rect can still dispatch
// onto whatever else happens to paint over that pixel, and nothing reports
// it. This is item 130's defect in a second costume: the premise there was
// narrower than the census implied, not false — outer code cannot hold a
// guarded DOM handle, and it can still act blind at a coordinate.
//
// THIS FILE IS THE ONE PLACE THAT ANSWERS THE QUESTION. It was pw1.mjs's own
// `hittablePointBy`/`hittablePoint`, written when item 130's own occlusion
// was still live and used to PROVE it: every other harness reached these
// controls with `.click()`, which bypasses hit-testing entirely, so the
// probe below did not invent a false red — it was the only instrument that
// could see a true one. Extracted here so every helper that dispatches by
// coordinate shares ONE hit-test rather than sixteen hand-rolled copies of
// the same gap; the copies were the finding ("four copies of one guard is
// four places for the next gap").
//
// Find a point INSIDE the element that `elementFromPoint` genuinely resolves
// to — trying several fractions across its box, not just the dead centre, so
// a partial occlusion doesn't read as a total one — and hand it back. If no
// point in the element is reachable, that is a real finding, reported as
// such rather than silently swallowed.
export const hittablePointBy = (app, elExpr) => app.evalJs(`(() => {
  const e = (() => { return ${elExpr}; })();
  if (!e) return null;
  e.scrollIntoView({ block: 'center', inline: 'center' });
  const b = e.getBoundingClientRect();
  if (b.width <= 0 || b.height <= 0) return { found: false, why: 'zero-size' };
  const fr = [0.5, 0.25, 0.75, 0.12, 0.88];
  for (const fy of fr) for (const fx of fr) {
    const x = b.left + b.width * fx, y = b.top + b.height * fy;
    const top = document.elementFromPoint(x, y);
    if (top && (top === e || e.contains(top))) return { found: true, x, y };
  }
  const c = document.elementFromPoint(b.left + b.width/2, b.top + b.height/2);
  return { found: false, why: 'occluded', by: c ? (typeof c.className === 'string' ? c.className : c.tagName) : null };
})()`);

export const hittablePoint = (app, sel) =>
  hittablePointBy(app, `document.querySelector(${JSON.stringify(sel)})`);

/**
 * The dispatch itself, ALWAYS gated by the hit-test above. Two call shapes,
 * matching the two conventions already live in this suite:
 *
 *   - with a `report` callback (the `ok`-collecting convention: pw1.mjs's
 *     own `pressEl`), a failed hit-test fails a NAMED check and returns
 *     false rather than throwing, so the caller's own suite keeps running
 *     and reports every site rather than stopping at the first one;
 *   - without one, it THROWS a named error — the convention this whole arc
 *     uses everywhere a driver has no local check-collector to report into
 *     (item133's own `if (!item) throw`).
 *
 * Either way, a covered or empty point is a NAMED failure. Never a silent
 * proceed — that is the entire fix this file exists to make general.
 */
/**
 * A NARROWER guard for the shape that has no selector to verify identity
 * against at all: `clickAt(app, x, y)`-style call sites that receive a
 * coordinate the CALLER already computed (typically from its own rect
 * read), with no element reference surviving to this point. This can only
 * confirm the point is not empty space — it cannot confirm the point still
 * belongs to whatever the caller originally meant. Weaker than
 * `trustedDispatch`, and the offer says so plainly rather than presenting
 * it as the same guarantee: still real, because "the click simply hits
 * empty space, and nothing reports it" is exactly this candidate.
 */
export async function assertHittable(app, x, y, what) {
  const hit = await app.evalJs(`(() => {
    const top = document.elementFromPoint(${x}, ${y});
    return top ? (top.tagName + (top.className ? '.' + String(top.className).split(' ')[0] : '')) : null;
  })()`);
  if (!hit) throw new Error(`assertHittable: ${what} — point (${x}, ${y}) hits nothing`);
  return hit;
}

export async function trustedDispatch(app, elExpr, what, { report } = {}) {
  const p = await hittablePointBy(app, elExpr);
  if (!p || !p.found) {
    const detail = p ? JSON.stringify(p) : 'absent';
    if (report) { report(`DRIVER: ${what} — a point is reachable by a real pointer`, false, detail); return false; }
    throw new Error(`trustedDispatch: ${what} — ${detail}`);
  }
  await app.mouseDown(p.x, p.y);
  await app.mouseUp(p.x, p.y);
  return true;
}
