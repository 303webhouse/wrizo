import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useDeskLexicon } from '../store/deskLexicon';
import { decorateMarkdownForCard } from '../store/draftDecoration';
import { trackReadout } from '../store/fluxReadouts';
import { liveBoxes } from '../store/boxTombstones';
import { WALK, walkOrder, walkStep, railMarks, walkCardBox, swipePlan, walkKey, keyMaySteps, cardIsEmpty, getWalkSize, setWalkSize, getWalkPos, setWalkPos, type SwipePlan } from '../store/walk';
import { StepHelp } from './StepHelp';
import type { Box } from '../types';

// W1 - THE WALK (brief docs/guided-paths/w1-walk-brief.md; frames 02, 02-writing, 06, 07, 10; Flux 02-trace). ONE card at a time: 700 px wide (never under 360; a subtle grip resizes it, remembered per board on the
// device), as tall as its text up to 520 and then scrolling INSIDE; Previous / Next chevrons just above its top corners (they recede while the writer types, return on a pointer move or when the pointer leaves the
// card); the swipe is a PURE SLIDE (both cards opaque, ~280 ms, a soft edge mask only; an instant cut under reduced motion); the doors under the card; the rail - one mark per card.
//
// WRITING IN THE CARD IS ORDINARY CARD WRITING: `renderEditor` (BoardEditor supplies its card editor mounted INLINE) is the same engine the card pop-up uses - the same decoration, undo, hidden marks, paste wall. The card is a
// surface; the board stays a container. This file draws the Walk and decides nothing about the writing.
// THE PAGE IS PRIMARY: the stage is laid out in the page's own box and nothing here moves it - the drawers overlay it.
// DOORS: Notes (puts the caret in the card) is the only door W1 draws. "Write this" and "Place a page..." are W2's: ABSENT here (not greyed); FIX wires them through `extraDoors` after W1 merges.

export interface WalkDoor { key: string; label: string; onOpen: () => void }
export interface WalkProps {
  boardId: string;
  boxes: Box[];
  /** The live card editor for this card (the ordinary card engine, inline). */
  renderEditor: (box: Box) => ReactNode;
  /** Esc: leave for the board in its last shown view. */
  onExit: () => void;
  /** Cards that are kindled (the writer's words, or a graft to a page) - the rail shows them as leaves. */
  kindledIds: ReadonlySet<string>;
  /** "Start Here" folds into the first seed. */
  startHereId?: string | null;
  /** Jump to this card (a card just added in the Walk), then call onJumped. */
  jumpToId?: string | null;
  onJumped?: () => void;
  /** The board's chrome is receded (the writer is typing): the chevrons recede with it. */
  receded: boolean;
  /** Flux dress: brackets and TRK n/m. */
  flux: boolean;
  /** Below the DeskFrame width: the doors stack and the next card peeks. */
  narrow: boolean;
  /** Shown when the board has no card yet (the Beginnings row). */
  empty?: ReactNode;
  /** W2's doors (Write this / Place a page...), wired by FIX after W1 merges. None in W1. */
  extraDoors?: WalkDoor[];
  /** W5 - this board is a DECK: its kindled cards wear the root line / lit edge, and the rewards play. Absent = the Walk exactly as W1 drew it. */
  deck?: boolean;
  /** W5 - the cards the writer has marked lit (her own statement; never coverage). */
  litIds?: ReadonlySet<string>;
  /** W5 - the cards whose kindle moment is playing NOW (about 1.1 s; empty under reduced motion / Ambiance 0). */
  kindlingIds?: ReadonlySet<string>;
  /** W5 - the Lit door, the LAST in the row: marks the card lit, or unmarks it (the same door). Absent = no door. */
  onToggleLit?: (box: Box) => void;
  /** W5 - the step the Walk is on, so the Deck's gaps line can start after it. */
  onCurrent?: (boxId: string) => void;
}

const isTypingKey = (e: KeyboardEvent) => !e.metaKey && !e.ctrlKey && !e.altKey && (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Enter');

function ChevronIcon({ dir }: { dir: 'prev' | 'next' }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={dir === 'prev' ? 'M14.5 6l-6 6 6 6' : 'M9.5 6l6 6-6 6'} />
    </svg>
  );
}
function MarkGlyph({ leaf }: { leaf: boolean }) {
  return leaf ? (
    <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" aria-hidden="true">
      <path d="M8 15V7" />
      <path d="M8 9C5 9 3.5 7 3.5 4.5C6 4.5 8 6 8 9Z" fill="currentColor" fillOpacity=".45" />
      <path d="M8 7.5C10.5 7.5 12.5 6 12.5 3.5C10 3.5 8 5 8 7.5Z" fill="currentColor" fillOpacity=".45" />
    </svg>
  ) : (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><ellipse cx="8" cy="10" rx="3" ry="2.2" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
  );
}

/** W5 - the kindled card's mark: ARBOR a faint bronze root line that grows from the card's bottom-left corner a short way and stays (a hint, never a drawing of a plant); FLUX the card's edge, lit lime then resting cyan.
 *  One element, dressed per theme in the stylesheet's W5 zone; it never takes a click. */
export function KindleMark() {
  return (
    <span className="kindle-mark" aria-hidden="true">
      <svg className="kindle-root" viewBox="0 0 48 16" width="48" height="16" fill="none" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M1 15C8 14 10 9 17 8C24 7 27 4 34 3" /><path d="M17 8C19 10 22 11 26 11" /></svg>
    </span>
  );
}
/** W5 - the writer's own Lit mark on the card: a small leaf (Arbor, brass: a human act); Flux draws the tick filled and the orange left bar instead. */
export function LitMark() {
  return (
    <span className="lit-mark" aria-hidden="true">
      <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" aria-hidden="true"><path d="M8 15V7" /><path d="M8 9C5 9 3.5 7 3.5 4.5C6 4.5 8 6 8 9Z" fill="currentColor" fillOpacity=".45" /><path d="M8 7.5C10.5 7.5 12.5 6 12.5 3.5C10 3.5 8 5 8 7.5Z" fill="currentColor" fillOpacity=".45" /></svg>
    </span>
  );
}

export function Walk(p: WalkProps) {
  const { t } = useDeskLexicon();
  const order = useMemo(() => walkOrder(liveBoxes(p.boxes)), [p.boxes]);   // live cards only (box-tombstones T11: a reader of a board's boxes goes through liveBoxes)
  const [index, setIndex] = useState(() => { const id = getWalkPos(p.boardId); const i = id ? order.findIndex((b) => b.id === id) : -1; return i >= 0 ? i : 0; });
  const cur = Math.min(index, Math.max(0, order.length - 1));
  const card = order[cur];
  const [leaving, setLeaving] = useState<{ box: Box; plan: SwipePlan } | null>(null);
  const [incoming, setIncoming] = useState<SwipePlan | null>(null);
  const [size, setSize] = useState(() => getWalkSize(p.boardId));
  const [woke, setWoke] = useState(false);
  // the soft fade at the card's bottom: on only while the card scrolls AND there is more below the fold
  const [fade, setFade] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const timer = useRef<number | null>(null);
  const box = walkCardBox(0, size);

  // THE BOTTOM FADE (brief: a soft fade at the bottom of the scrolling card): measured from the card itself - it scrolls (the text outgrew 520) and the writer is not at the end of it. A flat gradient to the card's own
  // stock (never a shadow); an overlay beside the card, not on it, so it stays put while the text scrolls under it.
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const measure = () => setFade(el.scrollHeight > el.clientHeight + 2 && el.scrollTop + el.clientHeight < el.scrollHeight - 2);
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    if (el.firstElementChild) ro?.observe(el.firstElementChild);
    return () => { el.removeEventListener('scroll', measure); ro?.disconnect(); };
  }, [card?.id, card?.text, size]);   // eslint-disable-line react-hooks/exhaustive-deps

  // where the writer was in this board's Walk is remembered on this device
  useEffect(() => { if (card) { setWalkPos(p.boardId, card.id); p.onCurrent?.(card.id); } }, [p.boardId, card?.id]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current); }, []);

  const go = useCallback((dir: 1 | -1, to?: number) => {
    const next = to ?? walkStep(order.length, cur, dir);
    if (next === cur || !card) return;
    const reduced = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const plan = swipePlan(next > cur ? 1 : -1, reduced);
    if (timer.current !== null) window.clearTimeout(timer.current);
    if (plan.kind === 'slide') {
      setLeaving({ box: card, plan });
      setIncoming(plan);
      timer.current = window.setTimeout(() => { setLeaving(null); setIncoming(null); }, plan.ms + 30);
    } else { setLeaving(null); setIncoming(null); }
    setIndex(next);
  }, [order.length, cur, card]);

  // a card just added in the Walk: land on it (no swipe)
  useEffect(() => {
    if (!p.jumpToId) return;
    const i = order.findIndex((b) => b.id === p.jumpToId);
    if (i >= 0) { setIndex(i); p.onJumped?.(); }
  }, [p.jumpToId, order]);   // eslint-disable-line react-hooks/exhaustive-deps

  // KEYBOARD (Nick, Oct 25): the caret lands in the card on opening and stepping, so left / right step only while the card is EMPTY (with words in it they move the caret); PageUp / PageDown and the chevrons always step.
  // Enter on a focused door is the door's own, Esc leaves.
  // The listener is registered ONCE and calls the latest handler through a ref: re-registering on every step (go changes with the card) moved it to the back of the document's listener list, behind any
  // handler that takes the arrows first.
  const keyRef = useRef<(e: KeyboardEvent) => void>(() => undefined);
  useEffect(() => {
    const h = (e: KeyboardEvent) => keyRef.current(e);
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inEditor = !!target?.closest?.('[contenteditable="true"], input, textarea');
      // the card editor's own handler takes the arrows first (it moves the caret over visible characters and calls preventDefault) - so an EMPTY card must not be turned away for that: its arrows are the Walk's
      const arrow = e.key === 'ArrowLeft' || e.key === 'ArrowRight';
      const emptyHere = inEditor && !!card && cardIsEmpty(card);
      if ((e.defaultPrevented && !(arrow && emptyHere)) || e.isComposing) return;
      const onDoor = !!target?.closest?.('.walk-door');
      const action = walkKey(e.key, { onDoor });
      if (isTypingKey(e)) setWoke(false);   // a keystroke re-arms the recede
      if (action === 'exit') { e.preventDefault(); p.onExit(); return; }
      if ((action === 'next' || action === 'prev') && keyMaySteps(e.key, { inEditor, empty: card ? cardIsEmpty(card) : false }) && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) { e.preventDefault(); go(action === 'next' ? 1 : -1); }
    };
    keyRef.current = onKey;
  }, [go, p.onExit]);   // eslint-disable-line react-hooks/exhaustive-deps

  // the chevrons return on a pointer move (anywhere in the Walk) or when the pointer leaves the card
  useEffect(() => {
    const onMove = () => setWoke(true);
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);
  useEffect(() => { if (!p.receded) setWoke(false); }, [p.receded]);
  const navHidden = p.receded && !woke;

  // the resize grip: width and height follow the pointer; remembered per board on this device
  const onGripDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const start = { x: e.clientX, y: e.clientY, w: r.width, h: r.height };
    let last = { w: r.width, h: r.height };
    const onMove = (m: PointerEvent) => { last = { w: Math.min(WALK.MAX_W, Math.max(WALK.MIN_W, start.w + (m.clientX - start.x))), h: Math.min(WALK.MAX_H, Math.max(WALK.MIN_H, start.h + (m.clientY - start.y))) }; setSize({ w: last.w, h: last.h }); };
    const onUp = () => { window.removeEventListener('pointermove', onMove, true); window.removeEventListener('pointerup', onUp, true); setWalkSize(p.boardId, last); setSize({ w: Math.round(last.w), h: Math.round(last.h) }); };
    window.addEventListener('pointermove', onMove, true);
    window.addEventListener('pointerup', onUp, true);
  };

  if (!card) return <div className="walk walk-empty" data-walk>{p.empty}</div>;

  const doors: WalkDoor[] = [
    { key: 'notes', label: t('walkNotes'), onOpen: () => (cardRef.current?.querySelector('.board-popup-editor') as HTMLElement | null)?.focus() },
    ...(p.extraDoors ?? []),
    // W5 - the writer's own finished-mark, LAST in the row; the same door marks and unmarks. Marking never celebrates and never counts toward completion.
    ...(p.onToggleLit ? [{ key: 'lit', label: p.litIds?.has(card.id) ? t('walkUnlit') : t('walkLit'), onOpen: () => p.onToggleLit?.(card) }] : []),
  ];
  const marks = railMarks(order, cur, p.kindledIds, p.startHereId, p.litIds);
  const cardLit = !!p.litIds?.has(card.id);
  const cardKindled = p.kindledIds.has(card.id);
  const cardFx = p.kindlingIds?.has(card.id) ? 'kindle' : undefined;
  const peek = p.narrow ? order[cur + 1] : undefined;

  return (
    <div className="walk" data-walk data-flux={p.flux ? 'true' : 'false'} data-narrow={p.narrow ? 'true' : 'false'}>
      <div className="walk-stage" ref={stageRef}>
        <div className="walk-frame" style={{ width: box.width }}>
          <button type="button" className="walk-nav" data-dir="prev" data-recede={navHidden ? 'true' : 'false'} aria-label={t('walkPrev')} aria-disabled={cur === 0} onClick={() => go(-1)}><ChevronIcon dir="prev" /></button>
          <button type="button" className="walk-nav" data-dir="next" data-recede={navHidden ? 'true' : 'false'} aria-label={t('walkNext')} aria-disabled={cur >= order.length - 1} onClick={() => go(1)}><ChevronIcon dir="next" /></button>
          <div className="walk-window">
            {leaving && (
              <div className="walk-card walk-card-leaving" data-out={leaving.plan.outgoing} aria-hidden="true" style={{ minHeight: box.height }}>
                <div className="board-popup-editor walk-static" dangerouslySetInnerHTML={{ __html: decorateMarkdownForCard(leaving.box.text ?? '', null) }} />
              </div>
            )}
            <div
              key={card.id}
              ref={cardRef}
              className="walk-card"
              data-box-id={card.id}
              aria-current="step"
              data-in={incoming ? incoming.incoming : undefined}
              data-kindled={p.deck && cardKindled ? 'true' : undefined}
              data-lit={p.deck && cardLit ? 'true' : undefined}
              data-fx={cardFx}
              style={{ minHeight: box.height, maxHeight: WALK.MAX_H }}
              onPointerLeave={() => setWoke(true)}
            >
              {p.flux && <span className="walk-trk" data-fx={cardFx} aria-hidden="true">{trackReadout(cur + 1, order.length)}</span>}
              {p.deck && cardKindled && <KindleMark />}
              {p.deck && cardLit && <LitMark />}
              {p.renderEditor(card)}
              {card.deckStep && !card.sourceEntryId && <StepHelp box={card} faceSelector=".board-popup-editor" />}
              <span className="walk-grip" role="separator" aria-label={t('walkResize')} onPointerDown={onGripDown}>
                <svg viewBox="0 0 12 12" width="12" height="12" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" aria-hidden="true"><path d="M11 5L5 11M11 8.5L8.5 11" /></svg>
              </span>
            </div>
            <div className="walk-fade" data-on={fade ? 'true' : 'false'} aria-hidden="true" />
            {p.flux && <div className="flux-brackets walk-brackets" aria-hidden="true" />}   {/* a sibling of the card, not inside it: the card scrolls and clips, and the brackets stand just outside its corners */}
          </div>
        </div>
        <div className="walk-doors" role="group">
          {doors.map((d) => <button key={d.key} type="button" className="walk-door" data-door={d.key} onClick={d.onOpen}>{d.label}</button>)}
        </div>
        <div className="walk-rail" role="list" aria-label={t('walkRail')}>
          {marks.map((m, i) => (
            <button key={m.id} type="button" role="listitem" className="walk-mark" data-state={m.state} data-current={m.current ? 'true' : 'false'} data-kindled={p.kindledIds.has(m.id) ? 'true' : 'false'} data-lit={p.deck && m.lit ? 'true' : undefined} data-fx={p.kindlingIds?.has(m.id) ? 'kindle' : undefined} data-start-here={m.startHere ? 'true' : undefined}
              aria-label={`${i + 1}`} title={m.startHere ? t('deckStartHereLabel') : undefined} aria-current={m.current ? 'step' : undefined} onClick={() => go(i > cur ? 1 : -1, i)}>
              <MarkGlyph leaf={m.state === 'leaf' || m.state === 'lit' || (m.current && (p.kindledIds.has(m.id) || m.lit))} />
            </button>
          ))}
        </div>
        {peek && <div className="walk-peek" aria-hidden="true"><div className="board-popup-editor walk-static" dangerouslySetInnerHTML={{ __html: decorateMarkdownForCard(peek.text ?? '', null) }} /></div>}
      </div>
    </div>
  );
}
