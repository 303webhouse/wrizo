import { useEffect, useState, type RefObject } from 'react';
import type { PageLinks } from '../types';
import { visibleText, toRawRange } from '../store/draftFormat';
import { resolveAnchors, rawRangeToDomRange } from '../store/anchors';

// EXPERIMENT 1 §6 — THE MARK IN THE TEXT.
//
// Ruled: A FAINT TINT ON THE WORDS THEMSELVES. Not an underline (F2 holds), and
// NOT a character in the text — §6b forbids the drawing's `✎`, because under
// TRR14 a character inserted to stand for a mark is SAVED INTO THE MANUSCRIPT.
// The CSS Custom Highlight API is the one mechanism that paints a range while
// touching no DOM, which is why the mark is built on it.
//
// AND THE GUTTER MARK EARNS ITS PLACE IN EXACTLY ONE CASE: a note with no words.
// "Words get a tint; a spot gets a gutter mark; nothing gets a glyph."
// (EXP1-Q6, Nick's yes.)
//
// ⛔ MEASURED, AND IT IS WHY THIS COMPONENT EXISTS AT ALL: A RANGE DETACHES ON
// EVERY RE-RENDER. On the box (2026-09-24, `exp1-paint.mjs`, 12/12) the tint
// vanished after an ordinary edit while `CSS.highlights.has(name)` was STILL
// TRUE. ForwardOnlyEditor renders through `dangerouslySetInnerHTML`, so an edit
// REBUILDS the text nodes; the `Highlight` object survives and its `Range`
// points at nodes that no longer exist. So the registry's own truthiness is not
// evidence that anything is painted, and the ranges must be REBUILT — not merely
// re-set — after every render. That is the one thing this file has to get right.
//
// PAGE IS PRIMARY. The tint occupies no space by construction (it is a paint, not
// an element). The gutter ticks are absolutely positioned inside the editor's
// own already-relative wrapper and carry `pointer-events: none`, so they displace
// nothing and can never intercept a press meant for the words.

const HIGHLIGHT_NAME = 'wz-linked';

export interface LinkedMarksProps {
  /** The editor's contenteditable node — the same ref the host already holds. */
  editorRef: RefObject<HTMLDivElement | null>;
  /** The page's RAW text (what the DOM holds). */
  text: string;
  pageLinks: PageLinks | undefined;
  /** False when the experiment is off: paints nothing and clears what it painted. */
  active: boolean;
}

interface Tick {
  id: string;
  top: number;
  lost: boolean;
}

export function LinkedMarks({ editorRef, text, pageLinks, active }: LinkedMarksProps) {
  const [ticks, setTicks] = useState<Tick[]>([]);

  // ⚠ NO DEPENDENCY ARRAY, DELIBERATELY. This effect must run after EVERY render,
  // because a render is exactly when the editor rebuilds its text nodes and the
  // previous ranges go stale. A dependency list here would be a list of the
  // reasons we currently believe the DOM changes — and the measured failure is
  // that the DOM changes for reasons the list would not contain. Normally an
  // omitted array is a smell; here it is the requirement.
  useEffect(() => {
    const registry = typeof CSS !== 'undefined' ? (CSS as unknown as { highlights?: Map<string, unknown> }).highlights : undefined;
    const el = editorRef.current;

    if (!active || !el || !registry) {
      // Clearing is part of the contract: switching the experiment off must take
      // the mark off the page, not leave the last paint behind.
      try { registry?.delete(HIGHLIGHT_NAME); } catch { /* ignore */ }
      if (ticks.length) setTicks([]);
      return;
    }

    // The editor's DOM must BE this text, or every offset below addresses
    // something else. Refuse rather than paint on a guess.
    if ((el.textContent ?? '') !== text) {
      try { registry.delete(HIGHLIGHT_NAME); } catch { /* ignore */ }
      return;
    }

    const anchors = pageLinks?.anchors ?? [];
    if (anchors.length === 0) {
      try { registry.delete(HIGHLIGHT_NAME); } catch { /* ignore */ }
      if (ticks.length) setTicks([]);
      return;
    }

    const v = visibleText(text);
    const resolved = resolveAnchors(text, anchors);
    const ranges: Range[] = [];
    const nextTicks: Tick[] = [];
    const wrapRect = (el.offsetParent as HTMLElement | null)?.getBoundingClientRect()
      ?? el.getBoundingClientRect();

    for (const r of resolved) {
      // LOST and AMBIGUOUS anchors carry no start/end at all — resolveAnchors
      // withholds them so a caller cannot paint a guess. Nothing is painted for
      // them here; they are reported in the rail, where words are not needed.
      if (r.start === undefined || r.end === undefined) continue;

      if (r.isSpot) {
        // A spot has no words to tint: it earns the gutter tick instead.
        const [rawAt] = toRawRange(v, r.start, r.start);
        const dom = rawRangeToDomRange(el, rawAt, rawAt);
        if (!dom) continue;
        const rect = dom.getBoundingClientRect();
        nextTicks.push({ id: r.anchor.id, top: Math.round(rect.top - wrapRect.top), lost: false });
        continue;
      }

      // Visible offsets out, RAW offsets in — and through `toRawRange`, never
      // `map[end]` directly, so a span ending just before `**bold**` does not
      // paint over the markers.
      const [rawStart, rawEnd] = toRawRange(v, r.start, r.end);
      const dom = rawRangeToDomRange(el, rawStart, rawEnd);
      if (dom) ranges.push(dom);
    }

    try {
      if (ranges.length > 0) {
        const Ctor = (window as unknown as { Highlight?: new (...r: Range[]) => unknown }).Highlight;
        if (Ctor) registry.set(HIGHLIGHT_NAME, new Ctor(...ranges));
      } else {
        registry.delete(HIGHLIGHT_NAME);
      }
    } catch { /* a paint failure must never break the writing surface */ }

    // ⛔ THE LOOP HAZARD, CLOSED DELIBERATELY. This effect runs after every
    // render AND can call setState, so the comparison below is the only thing
    // standing between it and an infinite render loop — on the writing surface,
    // which is the worst place in the app to have one. So it does not ask
    // "are these equal": it asks whether anything MOVED ENOUGH TO MATTER, with a
    // 1px tolerance, because a subpixel rect that flickers between 102.4 and
    // 102.6 would otherwise re-render forever while looking correct on screen.
    const same = nextTicks.length === ticks.length
      && nextTicks.every((t, i) => ticks[i].id === t.id && Math.abs(ticks[i].top - t.top) <= 1);
    if (!same) setTicks(nextTicks);
  });

  // Clear the registry when the surface goes away, so a mark cannot outlive the
  // page it belongs to.
  useEffect(() => () => {
    try {
      (CSS as unknown as { highlights?: Map<string, unknown> }).highlights?.delete(HIGHLIGHT_NAME);
    } catch { /* ignore */ }
  }, []);

  if (!active || ticks.length === 0) return null;

  return (
    <div className="wz-linked-gutter" aria-hidden="true">
      {ticks.map(t => (
        <span key={t.id} className="wz-linked-tick" style={{ top: t.top }} />
      ))}
    </div>
  );
}
