import { useState, useEffect, useLayoutEffect, type MutableRefObject, type Dispatch, type SetStateAction } from 'react';
import { type Box } from '../../types';
import { naturalPx, MIN_TEXT_H, MEASURE_TOLERANCE_PX } from './geometry';
import { CARD_H } from '../../decks/layout';
import { fitDealtRows } from '../../decks/rowFit';

export function useBoardReflow({ pageWidthPx, widthMeasured, touchedRef, boxes, activeResizeIdRef, measureEls, lastSavedRef, setBoxes, popupBoxId }: {
  pageWidthPx: number;
  widthMeasured: boolean;
  touchedRef: MutableRefObject<Set<string>>;
  boxes: Box[];
  activeResizeIdRef: MutableRefObject<string | null>;
  measureEls: MutableRefObject<Map<string, HTMLDivElement>>;
  lastSavedRef: MutableRefObject<Box[]>;
  setBoxes: Dispatch<SetStateAction<Box[]>>;
  popupBoxId: string | null;
}) {
  // Text reflow — measure each text box's actual rendered height and grow
  // `h` when content needs MORE room than currently allotted (the port-time
  // estimate, a width resize shrinking the wrap and forcing more wraps, or
  // a live edit adding text). page-pin/connection/board-meta boxes are
  // never measured here (kind !== 'text' short-circuits, same as ink
  // always has).
  //
  // FX4 S4 — reflow is now a MINIMUM floor, not a two-way dictate: `.board-
  // text` already carries `overflow:auto` (index.css, pre-existing), so for
  // a box the writer has deliberately made TALLER than its content needs,
  // `el.scrollHeight` reports the BOX's own (taller) rendered height back —
  // content that fits without scrolling never makes scrollHeight exceed
  // clientHeight — so this only ever fires (and only ever GROWS `h`) when
  // content genuinely overflows what's currently allotted; a manually
  // enlarged card's own extra whitespace is never clawed back.
  // BUG 32b - a card is measured once the page's FONTS are in, never on the fallback face a lazy font leaves while it loads: the reflow below re-runs on `loadingdone` (and once `fonts.ready` settles),
  // so a card's height does not depend on load timing. (fontTick only re-triggers the effect.)
  const [fontTick, setFontTick] = useState(0);
  useEffect(() => {
    const f = typeof document !== 'undefined' ? document.fonts : undefined;
    if (!f) return;
    let live = true;
    const bump = () => { if (live) setFontTick(t => t + 1); };
    f.addEventListener('loadingdone', bump);
    f.ready.then(bump).catch(() => {});
    return () => { live = false; f.removeEventListener('loadingdone', bump); };
  }, []);

  useLayoutEffect(() => {
    if (pageWidthPx <= 0 || !widthMeasured) return;
    // BUG 32c - sizedByHand: which cards are fitted to their content (grown AND shrunk) in this pass. A card is, when it is AUTO (no `sizedByHand`), not a ported notecard, and the writer has acted on it in this
    // visit (touchedRef) - or it is a dealt card in a row with such a card, so the row stays one band. Every other card keeps the floor-only rule below: it grows to fit its words and is never shrunk, and a plain open
    // (nothing touched yet) shrinks nothing. A card the writer sized by hand keeps its size whatever its words do (it still grows when its words would be clipped).
    const touched = touchedRef.current;
    const rowOf = (b: Box) => Math.round(b.y * 1e4);
    const touchedRows = new Set(boxes.filter(b => b.deckStep && touched.has(b.id)).map(rowOf));
    const next = boxes.map(b => {
      if (b.kind !== 'text') return b;
      // FX7 S7 - skip whichever box is ACTIVELY being resized right now (activeResizeIdRef, above): a diagonal drag narrows width while shrinking height, which can force an extra text-wrap line that this effect
      // would measure and grow `h` back from, mid-drag, fighting the writer's own pointer. This box gets ONE final reconciliation pass the instant `activeResizeIdRef` clears (finish(), below).
      if (b.id === activeResizeIdRef.current) return b;
      const el = measureEls.current.get(b.id);
      if (!el) return b;
      const storedPx = b.h * pageWidthPx;
      if (!b.sizedByHand && !b.sourceEntryId && (touched.has(b.id) || (!!b.deckStep && touchedRows.has(rowOf(b))))) {
        const targetPx = Math.max(naturalPx(el), (b.deckStep ? CARD_H : MIN_TEXT_H) * pageWidthPx);   // content height, never below the deal's own card height (a dealt card) or the least a text card can be
        if (Math.abs(targetPx - storedPx) <= MEASURE_TOLERANCE_PX) return b;
        return { ...b, h: targetPx / pageWidthPx };
      }
      const measuredPx = el.scrollHeight;
      if (measuredPx - storedPx <= MEASURE_TOLERANCE_PX) return b;
      return { ...b, h: measuredPx / pageWidthPx };
    });
    // BUG 32 - a dealt deck's rows FIT their cards (decks/rowFit.ts: dealt cards only, on a pass where a dealt card's height changed). It applies on a plain open too, so an old board does not sit overlapping.
    const fitted = fitDealtRows(boxes, next);
    if (!fitted.some((b, i) => b.h !== boxes[i].h || b.y !== boxes[i].y)) return;   // nothing to correct (also what ends the pass: the fitted layout is its own fixed point)
    // BUG 32b - reading the heights above forced layout, which is what STARTS a lazy font's load: if any font is still loading this pass measured the fallback face, so it is discarded (loadingdone re-runs it)
    if (typeof document !== 'undefined' && document.fonts && document.fonts.status === 'loading') return;
    // BUG 32b - OPENING A BOARD SAVES NOTHING: `boxes === lastSavedRef.current` means no writer's change is waiting, so this pass is a correction of the saved layout and is shown on SCREEN only (the saved
    // mark moves with it, so the autosave and the hide/logout flushes see nothing to write); the next writer act - an edit, a move, a deal - saves the board as it then is.
    if (boxes === lastSavedRef.current) lastSavedRef.current = fitted;
    setBoxes(fitted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boxes, pageWidthPx, popupBoxId, fontTick, widthMeasured]);
}
