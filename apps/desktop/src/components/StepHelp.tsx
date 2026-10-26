import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDeskLexicon } from '../store/deskLexicon';
import { splitCard } from '../store/guided';
import { stageTutorAsk } from '../store/tutorStage';
import { stepExplain, stepExample } from '../decks/content';
import type { Box } from '../types';

// W3 / W11a - THE "?" ON A DEALT STEP. A card dealt from a Tier 1 deck carries `deckStep` ({ deck, step }); this puts a small "?" at the END OF ITS TITLE. Pressing it opens a popover
// ANCHORED at the "?" (Fable's frame 06): the step's one plain sentence, one italic example, and "more -> Tutor". The words are local content shipped with the app (decks/content.ts), never
// stored on the card; the example is a public-domain or invented specimen, never a line for the writer's own work.
//
//  - "more" STAGES an ask in the Tutor composer ("What does <step> do?", store/tutorStage.ts) and sends nothing - the writer reads it, edits it and presses Send, or doesn't.
//  - FOCUS: opening moves focus to "more" (the one control inside); Esc closes the popover and RETURNS focus to the "?" (capture phase, so the board's own Esc handling never sees it);
//    a press outside closes it too. Staging a Tutor ask closes it and lets the Tutor's composer take focus (it is what the writer asked to go to).
//  - THE PAGE IS PRIMARY: the popover is a portal overlay positioned from the "?"'s rect - it never moves, resizes or unmounts the card or the board.
//  - The "?" lives inside the card but is NOT part of its text (a sibling of .board-text): the board's pointer machine stands down for it exactly as it does for .board-layer-toggle.
//  - Words: Arbor "?" / "more"; Flux "[?]" / "MORE" (lexicon: deckStepHelpGlyph / deckStepHelpMore); the target is the theme's own Tutor word (tutorTitle: "The Tutor" / "The Operator").

const POP_W = 300;
const GAP = 10;

// Where the first line ends, relative to the card: walk the card face's text nodes to the title's last character and take that glyph's rect. null when there is no title text to measure.
function titleEnd(face: HTMLElement, titleLen: number): { right: number; top: number; height: number } | null {
  if (titleLen <= 0) return null;
  const walker = document.createTreeWalker(face, NodeFilter.SHOW_TEXT);
  let remaining = titleLen;
  let node: Text | null = null;
  let off = 0;
  while (walker.nextNode()) {
    const n = walker.currentNode as Text;
    if (n.data.length >= remaining) { node = n; off = remaining; break; }
    remaining -= n.data.length;
  }
  if (!node || off <= 0) return null;
  const range = document.createRange();
  range.setStart(node, off - 1);
  range.setEnd(node, off);
  const rects = range.getClientRects();
  const r = rects.length ? rects[rects.length - 1] : range.getBoundingClientRect();
  if (!r || (r.width === 0 && r.height === 0)) return null;
  return { right: r.right, top: r.top, height: r.height };
}

// `faceSelector`: the sibling element whose first line is the title the "?" sits after - the card face (.board-text) on the board; the live editor (.board-popup-editor) in the Walk card.
export function StepHelp({ box, faceSelector = '.board-text' }: { box: Box; faceSelector?: string }) {
  const { t } = useDeskLexicon();
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);
  const moreRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [at, setAt] = useState<{ left: number; top: number } | null>(null);
  const [pop, setPop] = useState<{ left: number; top: number; flip: boolean } | null>(null);
  const step = box.deckStep;
  const title = splitCard(box.text).title.trim();

  // the "?" sits just past the end of the title: measured from the card face (the sibling .board-text), re-measured when the text or the card's size changes
  useLayoutEffect(() => {
    const btn = btnRef.current;
    const host = btn?.parentElement;
    const face = host?.querySelector(faceSelector) as HTMLElement | null;
    if (!btn || !host || !face) return;
    const place = () => {
      const hostRect = host.getBoundingClientRect();
      const end = titleEnd(face, splitCard(box.text).title.length);
      const size = 18;
      if (!end) { setAt({ left: 8, top: 6 }); return; }
      const left = Math.min(end.right - hostRect.left + 6, hostRect.width - size - 4);
      const top = end.top - hostRect.top + (end.height - size) / 2;
      setAt((prev) => (prev && Math.abs(prev.left - left) < 0.5 && Math.abs(prev.top - top) < 0.5 ? prev : { left, top }));
    };
    place();
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(place) : null;
    ro?.observe(face);
    return () => ro?.disconnect();
  }, [box.text, box.w, box.h, box.x, box.y, faceSelector]);

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) btnRef.current?.focus({ preventScroll: true });
  }, []);

  // the popover is anchored at the "?": below it, its arrow under the glyph; flipped above when there is no room below
  useLayoutEffect(() => {
    if (!open) { setPop(null); return; }
    const place = () => {
      const b = btnRef.current?.getBoundingClientRect();
      if (!b) return;
      const h = popRef.current?.offsetHeight ?? 180;
      const left = Math.max(8, Math.min(b.left + b.width / 2 - 28, window.innerWidth - POP_W - 8));
      const below = b.bottom + GAP;
      const flip = below + h > window.innerHeight - 8 && b.top - GAP - h > 8;
      setPop({ left, top: flip ? b.top - GAP - h : below, flip });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    moreRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      close(true);
    };
    const onDown = (e: PointerEvent) => {
      const el = e.target as Node | null;
      if (el && (popRef.current?.contains(el) || btnRef.current?.contains(el))) return;
      close(false);
    };
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('pointerdown', onDown, true);
    return () => { document.removeEventListener('keydown', onKey, true); document.removeEventListener('pointerdown', onDown, true); };
  }, [open, close]);

  if (!step) return null;
  const explain = stepExplain(step.deck, step.step);
  if (!explain) return null;
  const example = stepExample(step.deck, step.step);

  const more = () => {
    stageTutorAsk(t('deckStepHelpAsk').replace('{step}', title || step.step));
    close(false);
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="board-step-help"
        data-open={open ? 'true' : 'false'}
        aria-label={t('deckStepHelpLabel')}
        aria-haspopup="dialog"
        aria-expanded={open}
        style={at ? { left: at.left, top: at.top } : undefined}
        onClick={() => setOpen((o) => !o)}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        {t('deckStepHelpGlyph')}
      </button>
      {open && createPortal(
        <div
          ref={popRef}
          className="board-step-pop"
          role="dialog"
          aria-label={title || t('deckStepHelpLabel')}
          data-flip={pop?.flip ? 'true' : 'false'}
          style={{ left: pop?.left ?? -9999, top: pop?.top ?? -9999, width: POP_W }}
        >
          <div className="board-step-pop-k">{title}</div>
          <p className="board-step-pop-e">{explain}</p>
          {example && <p className="board-step-pop-x">{example}</p>}
          <button ref={moreRef} type="button" className="board-step-pop-more" onClick={more}>
            {t('deckStepHelpMore')} <span aria-hidden="true">{'→'}</span> {t('tutorTitle').replace(/^The\s+/i, '')}
          </button>
        </div>,
        document.body,
      )}
    </>
  );
}
