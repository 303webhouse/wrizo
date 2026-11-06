// FLUX3 S2 - THE STACK AND THE HOLOGRAM (flux-rulings-oct31.md q1: "Stack and the hologram use CSS 3D transforms on the same node elements"; q6:
// session-only; the spec's §4 Views). Behind ?flux3=1, in Flux, on the Schema's Live view only.
//   - The STACK: every node flies out of its place into one swipeable 3D stack, in the board's own order (the order Sequence shows: the lanes, then
//     seq; store/boardStructure.ts), and flies home when it closes. The nodes are the board's own card elements: this file writes only their CSS
//     transform, transition, opacity and stacking while the Stack is open, and gives each back exactly (its stored z) when it closes, so no card's
//     rect, data or text changes (flux3-s2.mjs: the card-rect check). The circuit stays faint and still behind (the layer's still frame).
//   - The HOLOGRAM: the Stack's centre node opened as the dominant surface: 50% larger, the rest smaller and further, the board dimmed under a
//     faint, diffuse beam (no projector line, no shadow).
//   - A DOUBLE-CLICK on any node, in the Stack or the hologram, is the board's own double-click (Nick, Nov 6: "double-click does the same thing in
//     every theme"): today's card editor, so a node is written in exactly as on the board.
// The Stack is a way of LOOKING: while it is open, a press, a drag, a wheel or a key swipes or opens and never reaches the board's own gestures (the
// double-click alone is handed to the board), so nothing is moved, nudged, made or deleted from it. A click brings a node to the centre; swipe,
// drag, wheel or the arrow keys flip; a click on the centre (or Enter) opens the hologram;
// Esc closes the hologram, then the Stack. The centre moves at most three times a second (the <= 3 flashes/s law, STACK_GAP_MS), and reduced
// motion or Ambiance 0 places every node at once (the still state). Nothing here is saved (stackView.ts).
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import type { Box } from '../types/board';
import type { BoardView } from '../store/boardKind';
import { boardStructure, flattenLane } from '../store/boardStructure';
import { useTheme } from '../store/theme';
import { useAmbianceDial } from '../store/ambianceDial';
import { useDeskLexicon } from '../store/deskLexicon';
import { setStackView, useStackView } from './stackView';

/** The centre node changes at most once per STACK_GAP_MS: under three a second (the flash law, with a margin), however fast the swipes or keys come. */
export const STACK_GAP_MS = 350;
const FLIGHT_MS = 550;
const STAGGER_MS = 34;
const PERSPECTIVE = 1600;
const HOME = `perspective(${PERSPECTIVE}px) translate3d(0px, 0px, 0px) rotateY(0deg) scale(1)`;

const cardEl = (cv: HTMLElement, id: string) => cv.querySelector<HTMLElement>(`.board-box[data-box-id="${CSS.escape(id)}"]`);
const editable = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

function useReducedMotion(): boolean {
  const [r, setR] = useState(() => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    if (typeof matchMedia !== 'function') return;
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setR(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return r;
}

// ---- the Stack's button in Show as (a mount point in components/ShowAs.tsx) ----------------------------------------------------------------------
const STACK_PATH = 'M7 3h8v9H7zM5 5v9h8M3 7v8h8';

export function FluxStackTab({ current, onPick }: { current: BoardView; onPick: (v: BoardView) => void }) {
  const theme = useTheme();
  const view = useStackView();
  const { t } = useDeskLexicon();
  const ref = useRef<HTMLButtonElement>(null);
  // any view picked in Show as leaves the Stack (Live included: the Stack is a way of looking at Live)
  useEffect(() => {
    const me = ref.current, group = me?.parentElement;
    if (!me || !group) return;
    const leave = (e: MouseEvent) => {
      const b = e.target instanceof Element ? e.target.closest('[data-view]') : null;
      if (b && group.contains(b)) setStackView({ on: false });
    };
    group.addEventListener('click', leave, true);
    return () => group.removeEventListener('click', leave, true);
  }, [theme]);
  if (theme !== 'flux') return null;
  const on = view.on && current === 'open';
  return (
    <button ref={ref} type="button" className="show-as-btn" data-flux3-stack-tab="" aria-pressed={on} title={t('flux3ViewStack')} aria-label={t('flux3ViewStack')}
      onClick={() => {
        if (on) { setStackView({ on: false }); return; }
        setStackView({ on: true });
        if (current !== 'open') onPick('open');
      }}>
      <svg viewBox="0 0 18 18" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={STACK_PATH} /></svg>
      <span className="show-as-word">{t('flux3ViewStack')}</span>
    </button>
  );
}

// ---- the Stack itself (rendered by FluxSchema, on the Live view) --------------------------------------------------------------------------------
interface Props {
  wrapRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLDivElement | null>;
  /** All the board's boxes (for its order: the lanes and seq Sequence shows). */
  boxes: Box[];
  /** The cards on the canvas (the board's own render list). */
  nodes: Box[];
  /** The node the Stack opens on: the last-touched, else the selected, else the first. */
  startId: string | null;
  /** One above every card's stored z (the Stack's nodes stand above it, the hologram's veil at it). */
  zBase: number;
}

interface Drag { x: number; idx: number; id: string | null; moved: boolean }

export function FluxStack({ wrapRef, canvasRef, boxes, nodes, startId, zBase }: Props) {
  const view = useStackView();
  const dial = useAmbianceDial();
  const reduced = useReducedMotion();
  const motion = dial > 0 && !reduced;
  const [shown, setShown] = useState(0);
  const veilRef = useRef<HTMLDivElement>(null);

  // the board's own order: the lanes in their order, each lane's cards by seq (what Sequence shows), then any card no lane names
  const orderKey = useMemo(() => {
    const ids = new Set(nodes.map((n) => n.id));
    const seq = boardStructure(boxes).lanes.flatMap(flattenLane).filter((id) => ids.has(id));
    const seen = new Set(seq);
    return [...seq, ...nodes.filter((n) => !seen.has(n.id)).map((n) => n.id)].join('\n');
  }, [boxes, nodes]);
  const geometry = nodes.map((n) => `${n.id}:${n.x}:${n.y}:${n.w}:${n.h}`).join('|');

  // the latest of everything the handlers read (they are bound once per opening)
  const live = useRef({ order: [] as string[], z: new Map<string, number>(), zBase, motion, holo: false, on: false, startId });
  live.current = { order: orderKey ? orderKey.split('\n') : [], z: new Map(nodes.map((n) => [n.id, n.z])), zBase, motion, holo: view.holo, on: view.on, startId };
  const rt = useRef({ idx: 0, last: -Infinity, pending: 0, timer: 0, exitTimer: 0, drag: null as Drag | null, styled: new Set<string>(), unmounting: false });

  // place every node at its slot in the Stack (or the hologram): 'enter' flies them out staggered, 'move' flies them to the new centre, 'still' sets them
  const place = useCallback((how: 'enter' | 'move' | 'still') => {
    const wrap = wrapRef.current, cv = canvasRef.current, L = live.current, R = rt.current;
    if (!wrap || !cv || !L.on) return;
    const ids = L.order, n = ids.length;
    if (!n) return;
    R.idx = Math.max(0, Math.min(n - 1, R.idx));
    const holo = L.holo, animate = how !== 'still' && L.motion;
    const cw = wrap.clientWidth, ch = wrap.clientHeight;
    const cx = wrap.scrollLeft + cw / 2 - cv.offsetLeft, cy = wrap.scrollTop + ch * 0.46 - cv.offsetTop;
    const fit = (W: number, H: number) => Math.min(2.25, (cw * 0.38) / W, (ch * 0.56) / H);
    const centreScale = (W: number, H: number) => (holo ? Math.min(fit(W, H) * 1.5, (cw * 0.62) / W, (ch * 0.8) / H) : fit(W, H));
    const els = ids.map((id) => cardEl(cv, id));
    const ce = els[R.idx];
    const cW = ce?.offsetWidth || 1, cH = ce?.offsetHeight || 1;
    const cHalf = (cW * centreScale(cW, cH)) / 2;
    const step = Math.max(18, Math.min(holo ? 110 : 60, (cw / 2 - cHalf - 24) / 5));
    const lead = holo ? 64 : 34;
    els.forEach((el, i) => {
      if (!el) return;
      const W = el.offsetWidth || 1, H = el.offsetHeight || 1;   // the card's layout box: a transform never changes it
      const o = i - R.idx, ao = Math.abs(o);
      const sc = o === 0 ? centreScale(W, H) : Math.min(centreScale(W, H) * (holo ? 0.5 : 0.36), 0.9);
      const sideHalf = ((W * sc) / 2) * 0.62;   // a node turned away shows about 0.62 of its width
      const xo = o === 0 ? 0 : Math.sign(o) * Math.min(cHalf + lead + sideHalf + (ao - 1) * step, cw / 2 - 12);
      const dx = cx + xo - (el.offsetLeft + W / 2), dy = cy - (el.offsetTop + H / 2);
      const z = -Math.min(ao, 6) * (holo ? 240 : 150);
      const ry = o === 0 ? 0 : (o < 0 ? 1 : -1) * (holo ? 60 : 52);
      const op = holo ? (ao > 4 ? 0 : Math.max(0.15, 1 - ao * 0.28)) : (ao > 5 ? 0 : 1 - ao * 0.12);
      const delay = how === 'enter' && animate ? Math.min(i, 12) * STAGGER_MS : 0;
      el.style.transition = animate ? `transform ${FLIGHT_MS}ms cubic-bezier(.2,.8,.2,1) ${delay}ms, opacity 400ms ${delay}ms` : 'none';
      el.style.transformOrigin = '50% 50%';
      el.style.transform = `perspective(${PERSPECTIVE}px) translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, ${z}px) rotateY(${ry}deg) scale(${sc.toFixed(3)})`;
      el.style.opacity = op.toFixed(2);
      el.style.zIndex = String(L.zBase + 1 + 100 - Math.min(ao, 100));
      el.style.pointerEvents = op === 0 ? 'none' : '';
      el.dataset.flux3Stack = o === 0 ? 'centre' : 'side';
      R.styled.add(ids[i]);
    });
    setShown(R.idx);
  }, [wrapRef, canvasRef]);

  // give every node back exactly: no transform, no transition, no opacity, and its own stored z
  const exit = useCallback((animate: boolean) => {
    const cv = canvasRef.current, R = rt.current;
    window.clearTimeout(R.exitTimer);
    const ids = live.current.order.filter((id) => R.styled.has(id)).concat([...R.styled].filter((id) => !live.current.order.includes(id)));
    const restoreAll = () => {
      R.exitTimer = 0;
      if (cv) for (const id of ids) {
        const el = cardEl(cv, id);
        if (!el) continue;
        el.style.transform = ''; el.style.transition = ''; el.style.transformOrigin = ''; el.style.opacity = ''; el.style.pointerEvents = '';
        const z = live.current.z.get(id);
        el.style.zIndex = z == null ? '' : String(z);
        delete el.dataset.flux3Stack;
      }
      R.styled.clear();
    };
    if (!animate || !cv) { restoreAll(); return; }
    ids.forEach((id, i) => {
      const el = cardEl(cv, id);
      if (!el) return;
      const d = Math.min(i, 12) * STAGGER_MS;
      el.style.transition = `transform ${FLIGHT_MS}ms cubic-bezier(.2,.8,.2,1) ${d}ms, opacity 300ms ${d}ms`;
      el.style.transform = HOME;
      el.style.opacity = '1';
    });
    R.exitTimer = window.setTimeout(restoreAll, FLIGHT_MS + 12 * STAGGER_MS + 80);
  }, [canvasRef]);

  // leaving the Live view (another view, another board, another theme) closes the Stack at once; it never outlives the Schema
  useEffect(() => () => { rt.current.unmounting = true; setStackView({ on: false }); }, []);

  // open: fly out from the node she last touched; close: fly home
  useEffect(() => {
    if (!view.on) return;
    const R = rt.current, L = live.current;
    window.clearTimeout(R.exitTimer);
    R.idx = Math.max(0, L.startId ? L.order.indexOf(L.startId) : 0);
    R.last = -Infinity;
    place('enter');
    return () => {
      window.clearTimeout(R.timer);
      R.timer = 0;
      R.drag = null;
      exit(live.current.motion && !R.unmounting);
    };
  }, [view.on, place, exit]);

  // the hologram opens and closes about the same centre (only on that change: the opening's own flight is the effect above)
  const seenHolo = useRef(view.holo);
  useEffect(() => {
    if (seenHolo.current === view.holo) return;
    seenHolo.current = view.holo;
    if (view.on) place('move');
  }, [view.holo, view.on, place]);
  // a node that changed its order, size or place (a card written in the hologram grows) is placed again where it stands
  const seenShape = useRef(`${orderKey}#${geometry}`);
  useEffect(() => {
    const k = `${orderKey}#${geometry}`;
    if (seenShape.current === k) return;
    seenShape.current = k;
    if (view.on) place('still');
  }, [orderKey, geometry, view.on, place]);

  // the board frame says what it shows (the layer dims under the Stack; flux-v3.css)
  useEffect(() => {
    const host = wrapRef.current?.parentElement;
    if (!host) return;
    if (view.on) host.dataset.flux3Stack = view.holo ? 'holo' : 'stack'; else delete host.dataset.flux3Stack;
  }, [view.on, view.holo, wrapRef]);

  // the Stack's own hands: they swipe, flip and open, and keep every press, drag, wheel and key from the board's gestures while it is open
  useEffect(() => {
    if (!view.on) return;
    const wrap = wrapRef.current, host = wrap?.parentElement, veil = veilRef.current;
    if (!wrap || !host) return;
    const R = rt.current;
    const commit = () => {
      R.timer = 0;
      if (R.pending === R.idx) return;
      R.idx = R.pending;
      R.last = performance.now();
      place('move');
    };
    const go = (to: number) => {
      const n = live.current.order.length;
      R.pending = Math.max(0, Math.min(n - 1, to));
      if (R.pending === R.idx) return;
      const wait = R.last + STACK_GAP_MS - performance.now();
      if (wait <= 0) { window.clearTimeout(R.timer); commit(); } else if (!R.timer) R.timer = window.setTimeout(commit, wait);
    };
    const cardOf = (t: EventTarget | null) => (t instanceof Element ? t.closest<HTMLElement>('.board-box') : null);
    const onDown = (e: PointerEvent) => {
      e.stopPropagation();
      if (e.button !== 0) return;
      e.preventDefault();
      R.drag = { x: e.clientX, idx: R.idx, id: cardOf(e.target)?.dataset.boxId ?? null, moved: false };
    };
    const onVeilDown = (e: PointerEvent) => { e.stopPropagation(); if (e.button === 0) R.drag = { x: e.clientX, idx: R.idx, id: null, moved: false }; };
    const onMove = (e: PointerEvent) => {
      const d = R.drag;
      if (!d) return;
      const dx = e.clientX - d.x;
      if (!d.moved && Math.abs(dx) > 6) d.moved = true;
      if (d.moved) go(d.idx - Math.round(dx / (live.current.holo ? 260 : 120)));
    };
    let swiped = false;
    let tapped: string | null = null;   // the node a double-click's FIRST click landed on (that click may already have flown it to the centre)
    const onUp = () => { swiped = !!R.drag?.moved; R.drag = null; };
    const swallow = (e: Event) => { e.stopPropagation(); e.preventDefault(); };
    // a tap (a click that was not a swipe, and not a double-click's second click): a side node comes to the centre; the centre opens as the
    // hologram; the hologram's veil closes it
    const onTap = (e: MouseEvent) => {
      swallow(e);
      if (swiped || e.detail > 1 || e.button !== 0) return;
      const L = live.current, card = cardOf(e.target);
      tapped = card?.dataset.boxId ?? null;
      if (card?.dataset.boxId) {
        const i = L.order.indexOf(card.dataset.boxId);
        if (i < 0) return;
        if (i === R.idx) { if (!L.holo) setStackView({ holo: true }); } else go(i);
      } else if (L.holo) setStackView({ holo: false });
    };
    // A DOUBLE-CLICK DOES THE SAME THING IN EVERY THEME (Nick, Nov 6): on ANY node of the Stack (or the hologram) it is the board's own
    // double-click - today's card editor (or a pin's travel). Its first click may already have flown the node to the centre, so the board's
    // own hit-test (BoardEditor's onDoubleClick reads the element at the event's point) is handed the node's CURRENT centre: the native
    // event is held, and the same double-click is dispatched again there, marked so it passes this listener.
    const onDbl = (e: MouseEvent) => {
      if ((e as MouseEvent & { f3Stack?: true }).f3Stack) return;
      swallow(e);
      const cv = canvasRef.current;
      const id = tapped ?? cardOf(e.target)?.dataset.boxId ?? null;
      const el = cv && id ? cardEl(cv, id) : null;
      if (!cv || !el) return;
      const r = el.getBoundingClientRect();
      const again = new MouseEvent('dblclick', { bubbles: true, cancelable: true, detail: 2, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 });
      (again as MouseEvent & { f3Stack?: true }).f3Stack = true;
      cv.dispatchEvent(again);
    };
    const onWheel = (e: WheelEvent) => {
      swallow(e);
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(d) > 4) go(R.idx + Math.sign(d));
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || editable(e.target)) return;
      if (document.querySelector('[role="menu"], [role="dialog"], .board-popup-editor')) return;   // an open menu, dialog or card editor keeps its keys
      const t = e.target;
      const onTab = t instanceof Element && !!t.closest('[data-flux3-stack-tab]');
      if (t instanceof HTMLElement && t !== document.body && !host.contains(t) && !onTab) return;
      const L = live.current;
      switch (e.key) {
        case 'ArrowRight': case 'ArrowDown': go(R.idx + 1); break;
        case 'ArrowLeft': case 'ArrowUp': go(R.idx - 1); break;
        case 'Enter': if (onTab) return; if (!L.holo) setStackView({ holo: true }); break;
        case 'Escape': setStackView(L.holo ? { holo: false } : { on: false }); break;
        case 'Delete': case 'Backspace': break;   // a way of looking: nothing is deleted from the Stack
        default: return;
      }
      e.preventDefault();
      e.stopPropagation();
    };
    const replace = () => place('still');
    // the observer reports once as soon as it starts watching: only a real change of the frame's size places the nodes again (a 'still' placement
    // at the opening would cut the opening's flight short)
    let size = `${wrap.clientWidth}x${wrap.clientHeight}`;
    const resized = () => { const s = `${wrap.clientWidth}x${wrap.clientHeight}`; if (s === size) return; size = s; replace(); };
    wrap.addEventListener('pointerdown', onDown, true);
    wrap.addEventListener('click', onTap, true);
    wrap.addEventListener('dblclick', onDbl, true);
    wrap.addEventListener('wheel', onWheel, { capture: true, passive: false });
    wrap.addEventListener('scroll', replace, { passive: true });
    veil?.addEventListener('pointerdown', onVeilDown);
    veil?.addEventListener('click', onTap);
    veil?.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('keydown', onKey, true);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resized) : null;
    ro?.observe(wrap);
    return () => {
      wrap.removeEventListener('pointerdown', onDown, true);
      wrap.removeEventListener('click', onTap, true);
      wrap.removeEventListener('dblclick', onDbl, true);
      wrap.removeEventListener('wheel', onWheel, { capture: true });
      wrap.removeEventListener('scroll', replace);
      veil?.removeEventListener('pointerdown', onVeilDown);
      veil?.removeEventListener('click', onTap);
      veil?.removeEventListener('wheel', onWheel);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('keydown', onKey, true);
      ro?.disconnect();
    };
  }, [view.on, wrapRef, place]);

  const n = live.current.order.length;
  return (
    <div ref={veilRef} className="flux3-holo" data-on={view.on && view.holo ? 'true' : 'false'} data-still={motion ? undefined : 'true'} aria-hidden="true" style={{ zIndex: zBase }}>
      <div className="flux3-holo-beam" />
      <div className="flux3-holo-count"><b>{String(Math.min(shown, n - 1) + 1).padStart(2, '0')}</b> / {String(n).padStart(2, '0')}</div>
    </div>
  );
}
