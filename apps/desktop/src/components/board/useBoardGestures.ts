import { useEffect, type MutableRefObject, type Dispatch, type SetStateAction } from 'react';
import { type Box } from '../../types';
import { getJournalEntryIncludingDeleted, livePinFor, isCardLinkedToEntry, generateId, toggleEntryLink, pinAspectFor } from '../../store/persistence';
import { MOUSE_DRAG_THRESHOLD, NEW_CARD_W, NEW_CARD_H, MIN_TEXT_W, MIN_TEXT_H, BOARD_MAX_Y, BOARD_BREATHING_ROOM, naturalPx, MEASURE_TOLERANCE_PX, groupMembers, LONG_PRESS_MS, TOUCH_CANCEL_THRESHOLD, MIN_INK_W, MIN_PIN_W, MIN_PIN_H, type LastAction } from './geometry';
import { CARD_H } from '../../decks/layout';
import { type BoardView } from '../../store/boardKind';

export function useBoardGestures({ canvasRef, previewLineRef, armTipRef, id, boxesRef, threadArmedFromRef, setThreadArmedFrom, setConnectFromKnob, setConnectTarget, setSelectedConnectionId, setConnectFlash, setBoxes, popupBoxIdRef, setSelectedId, ctxActionsRef, pageWidthPx, ghostRef, freshEmptyIdsRef, setPopupBoxId, setIsDragging, activeResizeIdRef, lastActionRef, setCanUndo, lastGestureEndRef, measureEls, touchedRef, setStartersFaded, selectedIdRef, createAllowedRef, connectEndRef, boardMode }: {
  canvasRef: MutableRefObject<HTMLDivElement | null>;
  previewLineRef: MutableRefObject<SVGLineElement | null>;
  armTipRef: MutableRefObject<SVGCircleElement | null>;
  id: string;
  boxesRef: MutableRefObject<Box[]>;
  threadArmedFromRef: MutableRefObject<string>;
  setThreadArmedFrom: Dispatch<SetStateAction<string | null>>;
  setConnectFromKnob: Dispatch<SetStateAction<boolean>>;
  setConnectTarget: Dispatch<SetStateAction<string | null>>;
  setSelectedConnectionId: Dispatch<SetStateAction<string | null>>;
  setConnectFlash: Dispatch<SetStateAction<{ a: string; b: string; off: boolean; line: boolean } | null>>;
  setBoxes: Dispatch<SetStateAction<Box[]>>;
  popupBoxIdRef: MutableRefObject<string>;
  setSelectedId: Dispatch<SetStateAction<string | null>>;
  ctxActionsRef: MutableRefObject<{ card: (x: number, y: number, boxId: string) => void; board: (x: number, y: number) => void }>;
  pageWidthPx: number;
  ghostRef: MutableRefObject<HTMLDivElement | null>;
  freshEmptyIdsRef: MutableRefObject<Set<string>>;
  setPopupBoxId: Dispatch<SetStateAction<string | null>>;
  setIsDragging: Dispatch<SetStateAction<boolean>>;
  activeResizeIdRef: MutableRefObject<string | null>;
  lastActionRef: MutableRefObject<LastAction>;
  setCanUndo: Dispatch<SetStateAction<boolean>>;
  lastGestureEndRef: MutableRefObject<number>;
  measureEls: MutableRefObject<Map<string, HTMLDivElement>>;
  touchedRef: MutableRefObject<Set<string>>;
  setStartersFaded: Dispatch<SetStateAction<boolean>>;
  selectedIdRef: MutableRefObject<string>;
  createAllowedRef: MutableRefObject<boolean>;
  connectEndRef: MutableRefObject<(() => void) | null>;
  boardMode: BoardView;
}) {
  // -- delegated pointer handling: select / move / resize / thread-drag -----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let phase: 'idle' | 'pending' | 'dragging' | 'resizing' | 'creating' = 'idle';
    // BOARD CLICK-TO-CREATE - the press that may become a card: where it began (client px), whether it has been dragged past the threshold, and the geometry the ghost shows
    let createOrigin: { x: number; y: number } | null = null;
    let createDragged = false;
    let startX = 0, startY = 0, ptype = 'mouse';
    let activePointerId: number | null = null;
    let longPressTimer: ReturnType<typeof setTimeout> | null = null;
    let movingIds: string[] = [];
    let startBoxes: Box[] = [];
    let resizingId: string | null = null;
    let resizeStart: { w: number; h: number; aspect: number; kind: Box['kind']; pinAspect: number | null } | null = null;

    const clearTimer = () => { if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; } };
    // a gesture clears a text selection on the board as it starts and ends: left in place, the next press on the corner starts the browser's own text drag, which cancels the pointer [BoardEditor §34]
    const clearBoardSelection = () => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && !sel.isCollapsed && sel.anchorNode && canvas.contains(sel.anchorNode)) sel.removeAllRanges();
    };
    // ...and a native drag that starts on a card is refused outright, so no selection, however it was made, can take the pointer.
    // (The board's one drop target, the survey's drag, starts OUTSIDE the canvas; this never sees it.)
    const onDragStart = (e: DragEvent) => {
      const t = e.target as Node | null;
      const el = t && (t.nodeType === 1 ? (t as HTMLElement) : t.parentElement);
      if (el && el.closest('.board-box')) e.preventDefault();
    };

    // connection mode, from the corner square or the graft knob: a brass line arms to another card and a release toggles the link; lines show only in this mode, and the arm moves imperatively, not per React render [BoardEditor §35]
    type Connect = { src: string; held: boolean; right: boolean; ox: number; oy: number; moved: boolean; px: number; py: number; target: string | null; railEntry: string | null; railEl: HTMLElement | null; origin: 'corner' | 'knob' };
    let connect: Connect | null = null;
    // the browser's context menu is suppressed ONLY: on the corner square, while the mode is on, and for a beat after a right-button gesture ends (Windows fires `contextmenu` AFTER `pointerup`, by which time the mode is already over)
    let ctxQuietUntil = 0;
    // the last press on a corner square: a SECOND one at the same spot, soon, with nothing moved in between, is a double-click (a resize in between is not)
    let handleClick: { t: number; x: number; y: number; moved: boolean; boxId: string } | null = null;
    let flashTimers: ReturnType<typeof setTimeout>[] = [];
    const LINKABLE = new Set<string>(['text', 'ink', 'page-pin']);

    const cornerOf = (boxId: string) => {
      const el = canvas.querySelector(`[data-box-id="${boxId}"]`) as HTMLElement | null;
      if (!el) return null;
      const r = el.getBoundingClientRect(), c = canvas.getBoundingClientRect();
      return { x: r.right - c.left, y: r.bottom - c.top };
    };
    // CONNECTOR-B: the arm lives in a VIEWPORT overlay (a portal on body, position:fixed) - it has to reach the rail's thumbnails, which are outside the board, and the board canvas clips. Its coordinates are CLIENT
    // coordinates, so there is no canvas offset to subtract. The lines between cards stay inside the canvas (clipped to the board, never over the rail).
    const cornerClient = (boxId: string) => {
      const el = canvas.querySelector(`[data-box-id="${boxId}"]`) as HTMLElement | null;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.right, y: r.bottom };
    };
    // the mode's origin point in client coordinates: the corner square, or - entered from the graft knob - the card's right edge at mid-height
    const originClient = () => {
      if (!connect) return null;
      if (connect.origin === 'corner') return cornerClient(connect.src);
      const el = canvas.querySelector(`[data-box-id="${connect.src}"]`) as HTMLElement | null;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.right, y: r.top + r.height / 2 };
    };
    const placeArm = () => {
      const line = previewLineRef.current, tip = armTipRef.current;
      if (!connect || !line) return;
      const from = originClient();
      if (!from) return;
      let to = { x: connect.px, y: connect.py };
      let snapped = false;
      const snap = connect.target ? cornerClient(connect.target) : null;
      if (snap) { to = snap; snapped = true; }
      else if (connect.railEl) { const r = connect.railEl.getBoundingClientRect(); to = { x: r.left + 9, y: r.top + r.height / 2 }; snapped = true; }   // a rail thumbnail: the arm lands on ITS circle
      line.setAttribute('x1', String(from.x)); line.setAttribute('y1', String(from.y));
      line.setAttribute('x2', String(to.x)); line.setAttribute('y2', String(to.y));
      line.style.display = 'block';
      if (tip) {
        // the tip rides the pointer; over a card or a thumbnail the circle on that one takes its place
        tip.setAttribute('cx', String(to.x)); tip.setAttribute('cy', String(to.y));
        tip.style.display = snapped ? 'none' : 'block';
      }
    };
    // ---- the rail: an element wearing data-link-entry stands for an ENTRY (a page or a board); outside the canvas it is a connector target ----
    const railEntryAt = (x: number, y: number): { el: HTMLElement; entryId: string } | null => {
      for (const el of document.elementsFromPoint(x, y)) {
        const th = (el as Element).closest?.('[data-link-entry]') as HTMLElement | null;
        if (!th || canvas.contains(th)) continue;
        const eid = th.dataset.linkEntry;
        if (!eid || eid === id || !getJournalEntryIncludingDeleted(eid)) continue;   // not an entry (a card's id in a survey), or this very board
        return { el: th, entryId: eid };
      }
      return null;
    };
    let railPaintAt = 0;
    const paintRail = () => {
      railPaintAt = performance.now();
      document.body.dataset.connecting = connect ? 'true' : 'false';
      for (const el of document.querySelectorAll<HTMLElement>('[data-link-entry]')) {
        if (canvas.contains(el)) continue;
        const eid = el.dataset.linkEntry!;
        const pin = connect ? livePinFor(id, eid) : null;
        const linked = !!connect && (pin ? !!pairBox(connect.src, pin.id) : isCardLinkedToEntry(id, connect.src, eid));
        const isTarget = !!connect && connect.railEntry === eid;
        if (isTarget) el.setAttribute('data-link-target', 'true'); else el.removeAttribute('data-link-target');
        if (connect && linked) el.setAttribute('data-link-peer', 'true'); else el.removeAttribute('data-link-peer');
        if ((isTarget || (connect && linked)) && linked) el.setAttribute('data-link-solid', 'true'); else el.removeAttribute('data-link-solid');
      }
    };
    const clearRailPaint = () => {
      document.body.dataset.connecting = 'false';
      for (const el of document.querySelectorAll<HTMLElement>('[data-link-entry]')) { el.removeAttribute('data-link-target'); el.removeAttribute('data-link-peer'); if (!el.hasAttribute('data-link-flash')) el.removeAttribute('data-link-solid'); }
    };
    const flashRail = (entryId: string, linked: boolean) => {
      for (const el of document.querySelectorAll<HTMLElement>('[data-link-entry]')) {
        if (canvas.contains(el) || el.dataset.linkEntry !== entryId) continue;
        el.setAttribute('data-link-flash', linked ? 'on' : 'off');
        if (linked) el.setAttribute('data-link-solid', 'true'); else el.removeAttribute('data-link-solid');
        flashTimers.push(setTimeout(() => { el.removeAttribute('data-link-flash'); el.removeAttribute('data-link-solid'); }, 1500));
      }
    };
    const targetAt = (x: number, y: number): string | null => {
      if (!connect) return null;
      for (const el of document.elementsFromPoint(x, y)) {
        if ((el as Element).closest?.('.board-connections')) continue;
        const b = (el as Element).closest?.('.board-box') as HTMLElement | null;
        if (!b || !canvas.contains(b)) continue;
        const id = b.dataset.boxId;
        if (!id || id === connect.src) continue;
        const box = boxesRef.current.find(q => q.id === id);
        if (box && LINKABLE.has(box.kind)) return id;
      }
      return null;
    };
    const pairBox = (a: string, b: string) => boxesRef.current.find(x => x.kind === 'connection' && ((x.connA === a && x.connB === b) || (x.connA === b && x.connB === a)));

    function endConnect() {
      document.removeEventListener('pointermove', cMove, true);
      document.removeEventListener('pointerup', cUp, true);
      document.removeEventListener('pointerdown', cDown, true);
      if (!connect) return;
      connect = null;
      threadArmedFromRef.current = null;
      setThreadArmedFrom(null);
      setConnectFromKnob(false);
      setConnectTarget(null);
      setSelectedConnectionId(null);
      const line = previewLineRef.current; if (line) line.style.display = 'none';
      clearRailPaint();
    }
    const clearFlashTimers = () => { flashTimers.forEach(clearTimeout); flashTimers = []; };
    const startFlash = (f: { a: string; b: string; off: boolean; line: boolean }) => {
      clearFlashTimers();
      setConnectFlash(f);
      // the line is brief (it is a confirmation, not a feature); the circles linger a little longer; then everything is hidden again
      flashTimers.push(setTimeout(() => setConnectFlash(cur => (cur ? { ...cur, line: false } : cur)), 650));
      flashTimers.push(setTimeout(() => setConnectFlash(null), 1500));
    };
    const commit = (tid: string) => {
      if (!connect) return;
      const src = connect.src;
      const existing = pairBox(src, tid);
      if (existing) {
        setBoxes(prev => prev.filter(x => x.id !== existing.id));     // linked already: releasing on it UNLINKS
      } else {
        const maxZ = boxesRef.current.reduce((m, x) => Math.max(m, x.z), 0);
        const conn: Box = { id: generateId(), kind: 'connection', x: 0, y: 0, w: 0, h: 0, z: maxZ + 1, connA: src, connB: tid };
        setBoxes(prev => [...prev, conn]);                              // not linked: releasing on it LINKS (the same box shape as ever)
      }
      endConnect();
      startFlash({ a: src, b: tid, off: !!existing, line: true });
    };
    // the connector's release on an ENTRY: if that entry is ALREADY a live pin card on this board it is a CARD (the one-truth rule: two cards of one board join by a connection box, never a record) - otherwise a
    // page_links record toggles (linked <-> unlinked), owned by this board. Then a brief flash on the thumbnail, and the mode is over.
    const commitEntry = (entryId: string) => {
      if (!connect) return;
      const pin = livePinFor(id, entryId);
      if (pin) { commit(pin.id); return; }
      const src = connect.src;
      const res = toggleEntryLink(id, src, entryId);
      endConnect();
      if (res) flashRail(entryId, res === 'linked');
    };
    function cMove(e: PointerEvent) {
      if (!connect) return;
      connect.px = e.clientX; connect.py = e.clientY;
      if (Math.hypot(e.clientX - connect.ox, e.clientY - connect.oy) > MOUSE_DRAG_THRESHOLD) connect.moved = true;
      const t = targetAt(e.clientX, e.clientY);
      if (t !== connect.target) { connect.target = t; setConnectTarget(t); }
      const rail = t ? null : railEntryAt(e.clientX, e.clientY);
      const railId = rail ? rail.entryId : null;
      if (railId !== connect.railEntry) { connect.railEntry = railId; connect.railEl = rail ? rail.el : null; paintRail(); }
      else if (performance.now() - railPaintAt > 200) paintRail();   // the rail may have changed under a still pointer (a panel opened)
      placeArm();
    }
    // a point on one of the mode's own circles (the origin's or a linked peer's) belongs to the CIRCLE, not to the line that ends there: the release that enters the mode lands exactly on the origin's
    // circle, where every line of this card begins, and it must not select one (it did: the first review run found the line already heavy, and a Delete then reached the wrong thing)
    const onModeCircle = (x: number, y: number): boolean => {
      if (!connect) return false;
      const c = canvas.getBoundingClientRect();
      const o = originClient();   // the knob's circle, when the mode began there
      if (o && Math.hypot(x - o.x, y - o.y) <= 14) return true;
      const ids =[connect.src, ...boxesRef.current.filter(b => b.kind === 'connection' && (b.connA === connect!.src || b.connB === connect!.src)).map(b => (b.connA === connect!.src ? b.connB : b.connA) as string)];
      return ids.some(id => { const p = cornerOf(id); return !!p && Math.hypot(x - c.left - p.x, y - c.top - p.y) <= 14; });
    };
    // the browser's click after a release on a rail thumbnail would travel to its page; a short beat swallows it, so making a link never leaves the board [BoardEditor §36]
    const swallowReleaseClick = () => {
      const swallow = (ev: Event) => { ev.stopPropagation(); ev.preventDefault(); };
      window.addEventListener('click', swallow, true);
      setTimeout(() => window.removeEventListener('click', swallow, true), 100);
    };
    function cUp(e: PointerEvent) {
      if (!connect) return;
      // the browser fires `contextmenu` right after a right-button release (on Windows, after pointerup): that one belongs to THIS gesture and is suppressed. It is a short beat tied to the release itself -
      // an Esc that ends the mode, or the writer's NEXT right-click, is not inside it (the first review run lost a card's menu to a 500ms window that ran from the mode's end).
      if (connect.right) ctxQuietUntil = performance.now() + 250;
      const hit = onModeCircle(e.clientX, e.clientY) ? undefined : document.elementsFromPoint(e.clientX, e.clientY).find(n => (n as Element).classList?.contains('board-connection-hit')) as Element | undefined;
      if (hit) {                                   // a click on a line selects it; Delete removes it
        connect.held = false;
        const id = hit.closest('[data-connection-id]')?.getAttribute('data-connection-id');
        if (id) setSelectedConnectionId(id);
        return;
      }
      const t = targetAt(e.clientX, e.clientY);
      const rail = t ? null : railEntryAt(e.clientX, e.clientY);
      if (rail) swallowReleaseClick();   // the click the browser fires on the thumbnail after this release must not travel to its page
      if (connect.held) {
        connect.held = false;
        if (t) { commit(t); return; }
        if (rail) { commitEntry(rail.entryId); return; }
        if (connect.moved) { endConnect(); return; }   // released on nothing after a drag: cancel
        return;                                         // released at the square: the mode latches; a click finishes it
      }
      if (t) commit(t); else if (rail) commitEntry(rail.entryId); else endConnect();
    }
    function cDown(e: PointerEvent) {
      // connection mode owns every press: the board's own select / move / resize stand down (and a stray press cannot start a native drag)
      if (!connect) return;
      e.preventDefault(); e.stopPropagation();
    }
    const enterConnect = (src: string, held: boolean, e: PointerEvent, origin: 'corner' | 'knob' = 'corner') => {
      clearFlashTimers(); setConnectFlash(null);
      connect = { src, held, right: e.button === 2, ox: e.clientX, oy: e.clientY, moved: false, px: e.clientX, py: e.clientY, target: null, railEntry: null, railEl: null, origin };
      setConnectFromKnob(origin === 'knob');
      threadArmedFromRef.current = src;
      setSelectedConnectionId(null);
      setConnectTarget(null);
      setThreadArmedFrom(src);
      document.addEventListener('pointermove', cMove, true);
      document.addEventListener('pointerup', cUp, true);
      document.addEventListener('pointerdown', cDown, true);
      paintRail();
      requestAnimationFrame(placeArm);   // the arm element mounts with the state above; place it as soon as it exists
    };
    // a right-click on the square is suppressed ONLY there (the browser's own menu would cover the very thing being asked for) - plus while the mode is on, plus the beat after a right-drag lets go
    const onCtx = (e: Event) => {
      const t = e.target as Element | null;
      // a right-button release over a rail thumbnail fires that tile's contextmenu; stopped here in the capture phase, its menu never opens after a link gesture [BoardEditor §37]
      if (connect || performance.now() < ctxQuietUntil || t?.closest?.('.board-handle')) { e.preventDefault(); e.stopPropagation(); return; }
      // BOARD CONTEXT MENU: a right-click ON a card opens the card menu, on empty board the board menu (the corner square and a right-drag are connection mode, handled above). The card pop-up owns
      // its own right-clicks (the browser's spelling menu), and nothing opens while a thread is armed.
      if (popupBoxIdRef.current) return;
      const me = e as MouseEvent;
      if (!canvas.contains(t as Node | null)) return;
      const hit = document.elementFromPoint(me.clientX, me.clientY) as HTMLElement | null;   // not e.target: a held pointer retargets mouse events to the canvas
      const boxEl = hit?.closest?.('.board-box') as HTMLElement | null;
      e.preventDefault();
      if (boxEl?.dataset.boxId) { setSelectedId(boxEl.dataset.boxId); ctxActionsRef.current.card(me.clientX, me.clientY, boxEl.dataset.boxId); return; }
      if (hit === canvas || hit?.closest?.('.board-connections') || hit?.classList?.contains('board-canvas')) { setSelectedId(null); ctxActionsRef.current.board(me.clientX, me.clientY); }
    };

    // BOARD CLICK-TO-CREATE - the card the press would make, in the board's own units (x and BOTH y and h are fractions of the WIDTH, as every box here is). A plain press takes the
    // default card size with its top-left AT the press; a drag takes the rectangle between the press and the pointer. Always floored at the minimum card and clamped to the board.
    const createRectAt = (clientX: number, clientY: number) => {
      const cr = canvas.getBoundingClientRect();
      const W = cr.width || pageWidthPx;
      const ox = ((createOrigin as { x: number; y: number }).x - cr.left) / W;
      const oy = ((createOrigin as { x: number; y: number }).y - cr.top) / W;
      let x: number, y: number, w: number, h: number;
      if (!createDragged) { x = ox; y = oy; w = NEW_CARD_W; h = NEW_CARD_H; }
      else {
        const px = (clientX - cr.left) / W, py = (clientY - cr.top) / W;
        x = Math.min(ox, px); y = Math.min(oy, py); w = Math.abs(px - ox); h = Math.abs(py - oy);
      }
      w = Math.min(Math.max(w, MIN_TEXT_W), 1);
      h = Math.max(h, MIN_TEXT_H);
      x = Math.min(Math.max(x, 0), Math.max(1 - w, 0));
      y = Math.min(Math.max(y, 0), Math.max(BOARD_MAX_Y - BOARD_BREATHING_ROOM - h, 0));
      return { x, y, w, h };
    };
    const showGhost = (clientX: number, clientY: number) => {
      const g = ghostRef.current;
      if (!g || !createOrigin) return;
      const r = createRectAt(clientX, clientY);
      g.style.display = 'block';
      g.style.left = `${r.x * pageWidthPx}px`; g.style.top = `${r.y * pageWidthPx}px`;
      g.style.width = `${r.w * pageWidthPx}px`; g.style.height = `${r.h * pageWidthPx}px`;
    };
    const hideGhost = () => { const g = ghostRef.current; if (g) g.style.display = 'none'; };
    const finishCreate = (commit: boolean, e?: PointerEvent) => {
      if (activePointerId != null && canvas.hasPointerCapture(activePointerId)) {
        try { canvas.releasePointerCapture(activePointerId); } catch { /* already released */ }
      }
      hideGhost();
      const origin = createOrigin;
      phase = 'idle';
      if (!commit || !origin || !e) { createOrigin = null; createDragged = false; return; }
      const r = createRectAt(e.clientX, e.clientY);
      createOrigin = null; createDragged = false;
      const maxZ = boxesRef.current.reduce((m, b) => Math.max(m, b.z), 0);
      const box: Box = { id: generateId(), kind: 'text', x: r.x, y: r.y, w: r.w, h: r.h, z: maxZ + 1, text: '' };
      freshEmptyIdsRef.current.add(box.id);   // a card made by this gesture and closed still empty is discarded (the pop-up's onClose, below)
      setBoxes(prev => [...prev, box]);
      setSelectedId(box.id);
      setPopupBoxId(box.id);
    };

    const beginMove = (ids: string[]) => {
      phase = 'dragging';
      movingIds = ids;
      startBoxes = boxesRef.current;
      if (activePointerId != null) { try { canvas.setPointerCapture(activePointerId); } catch { /* gone */ } }
      setIsDragging(true); // FX8 S3 — see the state's own header comment above
    };

    const beginResize = (boxId: string) => {
      const box = boxesRef.current.find(b => b.id === boxId);
      if (!box) return;
      phase = 'resizing';
      canvas.dataset.resizing = 'true';   // CARD-RESIZE-AXIS: the whole canvas wears the diagonal arrow while the corner is held (see index.css)
      resizingId = boxId;
      startBoxes = boxesRef.current;
      // the lock's aspect comes from the PINNED ENTRY, never the box (a nested board's card is a page-pin box too and stays wide); deleted-inclusive so a Trash card keeps its shape [BoardEditor §38]
      const pinnedEntry = box.kind === 'page-pin' && box.entryId
        ? getJournalEntryIncludingDeleted(box.entryId)
        : null;
      resizeStart = {
        w: box.w, h: box.h, aspect: box.h / box.w, kind: box.kind,
        // null for every non-pin box, so the branch below cannot reach them.
        pinAspect: box.kind === 'page-pin' ? pinAspectFor(pinnedEntry) : null,
      };
      // FX7 S7 — see activeResizeIdRef's own header comment (above, near
      // measureEls): the auto-grow reflow-floor effect stands down for
      // THIS box id until the drag ends (finish(), below).
      activeResizeIdRef.current = boxId;
      if (activePointerId != null) { try { canvas.setPointerCapture(activePointerId); } catch { /* gone */ } }
    };

    const finish = (commit: boolean) => {
      clearTimer();
      if (activePointerId != null && canvas.hasPointerCapture(activePointerId)) {
        try { canvas.releasePointerCapture(activePointerId); } catch { /* already released */ }
      }
      // FX8 S3 — `finish` is the ONE shared exit for every gesture this
      // effect drives (a plain click that never crossed the drag threshold,
      // a committed move, a committed resize, or a cancel/revert of either)
      // — clearing here unconditionally is safe and correct: it's already
      // false for a plain click (beginMove was never called), and a no-op
      // React state set when already false costs nothing.
      setIsDragging(false);
      if (commit && (phase === 'dragging' || phase === 'resizing') && boxesRef.current !== startBoxes) {
        lastActionRef.current = { type: phase === 'dragging' ? 'move' : 'resize', before: startBoxes };
        setCanUndo(true);
      } else if (!commit && (phase === 'dragging' || phase === 'resizing')) {
        setBoxes(startBoxes); // release outside canvas / cancel: revert to the pre-gesture snapshot
      }
      // FX7 S7 — re-arm the reflow-floor effect for this box. Its own
      // useLayoutEffect deps are `[boxes, pageWidthPx, popupBoxId]` — a
      // bare ref clear does NOT retrigger it (refs are invisible to a deps
      // array), and the COMMIT path above never itself calls setBoxes (the
      // box's own final position/size was already committed incrementally
      // by onMove, before this ever runs) — so without an explicit nudge
      // here, a box resized right up against its own content floor would
      // never get its one final reconciliation pass at all. A shallow
      // clone is enough: same content, new array reference, so the effect
      // re-evaluates this box (now that activeResizeIdRef no longer skips
      // it) on the very next render.
      const wasResizing = phase === 'resizing';
      const resizedId = resizingId;
      if (phase === 'resizing' || phase === 'dragging') { lastGestureEndRef.current = performance.now(); clearBoardSelection(); }
      phase = 'idle';
      delete canvas.dataset.resizing;
      movingIds = [];
      resizingId = null;
      resizeStart = null;
      activeResizeIdRef.current = null;
      if (wasResizing) {
        // BUG 32c - the resize is the writer acting on this card: it is fitted from now on if it is auto. A resize that lands back on the card's content height CLEARS sizedByHand (the key is removed: one way to be auto).
        let clear = false;
        if (commit && resizedId) {
          const cur = boxesRef.current.find(b => b.id === resizedId);
          const el = measureEls.current.get(resizedId);
          if (cur && cur.sizedByHand) touchedRef.current.add(resizedId);   // only a resize that really moved the card (its first frame set the mark) counts as acting on it - a press on the handle that went nowhere touches nothing
          if (cur && cur.sizedByHand && el) clear = Math.abs(cur.h * pageWidthPx - Math.max(naturalPx(el), (cur.deckStep ? CARD_H : MIN_TEXT_H) * pageWidthPx)) <= MEASURE_TOLERANCE_PX;
        }
        if (clear) setBoxes(prev => prev.map(b => { if (b.id !== resizedId) return b; const { sizedByHand: _s, ...rest } = b; void _s; return rest; }));
        else setBoxes(prev => prev.slice());
      }
    };

    const onDown = (e: PointerEvent) => {
      if (popupBoxIdRef.current) return; // the card popup is open — board gestures stand down
      const target = e.target as HTMLElement;
      setStartersFaded(true);   // BOARD CLICK-TO-CREATE: the empty board's starters fade on the first press anywhere on the board

      // FX7 S8 — root-caused live (not guessed): the layer-toggle button's
      // own `onMouseDown={e => e.stopPropagation()}` (below, in the card's
      // JSX) fires on the MOUSEDOWN compatibility event, which is too late
      // to matter — this native `pointerdown` listener (capture-phase on
      // the canvas itself) always runs FIRST, and previously fell straight
      // through into the general "select + arm a pending drag + capture
      // the pointer immediately" branch below with no knowledge the press
      // actually landed on the toggle. Once capture engages, the SAME
      // retargeting S5's own fix addresses (above) also swallows the
      // button's own subsequent `click` — Chromium never even invokes the
      // button's onClick, because the retargeted event's propagation path
      // no longer passes through it at all. Confirmed live: a genuinely
      // trusted press-then-click on the toggle produced pointerdown/
      // mousedown correctly targeting `.board-layer-toggle`, then mouseup/
      // click BOTH retargeted to `.board-canvas` — the card's own z never
      // changed. This mirrors the EXISTING `.board-pin-grab` early-return
      // immediately below (the established pattern in this exact function
      // for "a control inside a card needs its own untouched click, not
      // the canvas's own select/drag machinery") — stand down whole, let
      // the click proceed natively to the button's own onClick.
      if (target.closest('.board-layer-toggle, .board-step-help, .board-fit')) return;   // W3: the step "?" inside a card needs its own untouched click, like the layer toggle

      // THE GREEN TACK IS RETIRED (connector-a): there is no pin to press. A card is connected from its corner square (below).
      const handleEl = target.closest('.board-handle') as HTMLElement | null;
      const boxEl = target.closest('.board-box') as HTMLElement | null;

      // Connection mode owns every press (see cDown); this is belt and braces for a press that arrives before its listeners do.
      if (connect) return;

      // BIG PROJECTS STEP 3 (3a) - THE GRAFT KNOB: a second door into the SAME connection mode, from the selected card's right edge. A press on it is
      // never a resize and never a move (it is a different hit target from the corner square); a press-drag lands on a card (a connection box) or a
      // rail row / thumbnail (a page link) exactly as the corner's held gesture does.
      const knobEl = target.closest('.board-graft-knob') as HTMLElement | null;
      if (knobEl) {
        const kBox = target.closest('.board-box') as HTMLElement | null;
        const kId = kBox?.dataset.boxId;
        if (!kId || kId !== selectedIdRef.current || e.button !== 0) return;
        e.preventDefault(); e.stopPropagation();
        clearBoardSelection();
        enterConnect(kId, true, e, 'knob');
        return;
      }

      if (handleEl && boxEl) {
        const boxId = boxEl.dataset.boxId!;
        if (boxId !== selectedIdRef.current) return; // handle only active on the selected box
        // CONNECTOR-A - THE CORNER SQUARE'S TWO NEW DOORS. Right-click: connection mode, button held. Double-click: a SECOND press at the same spot, soon after the first, with the pointer
        // unmoved in between (a first press that went on to RESIZE does not count - that is the writer resizing twice, and the card-resize-relock law below still holds for it).
        if (e.button === 2) { e.preventDefault(); enterConnect(boxId, true, e); return; }
        if (e.button !== 0) return;
        {
          const now = performance.now();
          if (handleClick && handleClick.boxId === boxId && now - handleClick.t < 450 && !handleClick.moved && Math.hypot(e.clientX - handleClick.x, e.clientY - handleClick.y) <= 4) {
            handleClick = null; e.preventDefault(); enterConnect(boxId, true, e); return;
          }
          handleClick = { t: now, x: e.clientX, y: e.clientY, moved: false, boxId };
        }
        // CARD RESIZE RELOCK — no selection already on the board may turn this press into a native drag (see clearBoardSelection above).
        clearBoardSelection();
        startX = e.clientX; startY = e.clientY; ptype = e.pointerType; activePointerId = e.pointerId;
        try { canvas.setPointerCapture(activePointerId); } catch { /* gone */ }
        beginResize(boxId);
        return;
      }

      if (!boxEl) {
        // with a card selected, the FIRST empty-space press only deselects - it makes nothing; the next press, with nothing selected, is the one that creates [BoardEditor §39]
        const hadSelectedCard = selectedIdRef.current != null;
        setSelectedId(null);   // unchanged: a press on empty space deselects the selected card
        // BOARD CLICK-TO-CREATE: ...and, on GENUINELY empty canvas (the press landed on the canvas itself - not a door, a hairline, the resize handle or anything laid over it) with nothing selected, begins a card.
        if (!hadSelectedCard && createAllowedRef.current && target === canvas && (e.pointerType !== 'mouse' || e.button === 0)) {
          e.preventDefault();   // no native text-selection drag starting under the card being sized
          createOrigin = { x: e.clientX, y: e.clientY };
          createDragged = false;
          activePointerId = e.pointerId; startX = e.clientX; startY = e.clientY; ptype = e.pointerType;
          phase = 'creating';
          try { canvas.setPointerCapture(activePointerId); } catch { /* gone */ }
          showGhost(e.clientX, e.clientY);
        }
        return;
      }

      const boxId = boxEl.dataset.boxId!;
      clearBoardSelection(); // CARD RESIZE RELOCK — a press on a card body never lands inside a selection a gesture left behind
      setSelectedId(boxId);
      setSelectedConnectionId(null); // AB4 S3 — selecting a box clears any connection selection
      startX = e.clientX; startY = e.clientY; ptype = e.pointerType; activePointerId = e.pointerId;
      phase = 'pending';
      // capture the pointer on the first pointerdown, not at the drag threshold: an uncaptured fast drag can hit-test outside the canvas and drop the gesture [BoardEditor §40]
      try { canvas.setPointerCapture(activePointerId); } catch { /* gone */ }
      const box = boxesRef.current.find(b => b.id === boxId);
      const ids = box ? (box.groupId ? groupMembers(boxesRef.current, box.groupId).map(b => b.id) : [boxId]) : [boxId];
      if (ptype === 'touch' || ptype === 'pen') {
        longPressTimer = setTimeout(() => { if (phase === 'pending') beginMove(ids); }, LONG_PRESS_MS);
      } else {
        // mouse: stash the candidate ids; promoted to a real drag past the threshold in onMove
        movingIds = ids;
      }
    };

    const onMove = (e: PointerEvent) => {
      if (phase === 'creating') {
        if (!createDragged && Math.hypot(e.clientX - startX, e.clientY - startY) > MOUSE_DRAG_THRESHOLD) createDragged = true;
        if (createDragged) e.preventDefault();
        showGhost(e.clientX, e.clientY);
        return;
      }
      // a press on the corner that has gone on to move is a resize, not the first half of a double-click
      if (handleClick && !handleClick.moved && Math.hypot(e.clientX - handleClick.x, e.clientY - handleClick.y) > 3) handleClick.moved = true;
      if (phase === 'pending') {
        const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
        if (ptype === 'mouse') {
          if (dist > MOUSE_DRAG_THRESHOLD) beginMove(movingIds);
        } else if (dist > TOUCH_CANCEL_THRESHOLD) {
          clearTimer();
          phase = 'idle';
        }
        return;
      }
      if (phase === 'dragging') {
        e.preventDefault();
        const dxRaw = (e.clientX - startX) / pageWidthPx;
        const dyRaw = (e.clientY - startY) / pageWidthPx;
        const ids = new Set(movingIds);
        // FX17 S3 (SV22) — THE HARD STOP, applied to the DELTA rather than to
        // each box. Clamping per box (the way the x-axis's own Math.max(0, …)
        // does) would let the lowest card in a multi-card selection hit the floor
        // while the others kept travelling — the selection would visibly deform
        // as it landed. Clamping the shared dy holds the group's shape: every
        // card stops at the same instant, which is what "a hard stop with no
        // rubber-banding" has to mean for more than one card.
        //
        // The bound is the lowest moving card's BOTTOM against
        // BOARD_MAX_Y - BOARD_BREATHING_ROOM (see those constants).
        //
        // The Math.max(0, …) is load-bearing, not defensive noise. A card can
        // already sit BELOW the limit without ever having been dragged there — an
        // older save from before this constant existed, or a deck load that placed
        // it. For such a card dyLimit is NEGATIVE, and clamping straight to it
        // would force the card UPWARD the instant the writer touched it, even
        // while dragging sideways: a silent correction of their layout, which is
        // worse than the unbounded growth this slice replaces. Flooring the bound
        // at 0 means such a card simply cannot travel FURTHER down, while still
        // moving freely up and sideways. A stop, never a correction — and no card
        // is ever relocated by the arrival of a limit.
        const movingStart = startBoxes.filter(b => ids.has(b.id));
        const lowestBottom = Math.max(...movingStart.map(b => b.y + b.h));
        const dyLimit = (BOARD_MAX_Y - BOARD_BREATHING_ROOM) - lowestBottom;
        const dy = Math.min(dyRaw, Math.max(0, dyLimit));
        // the right edge stops a drag as the bottom does: the canvas width never grows (x and w are fractions of it); clamped on the shared delta, and floored at 0 so a card already past the edge is never yanked back [BoardEditor §41]
        const rightmost = Math.max(...movingStart.map(b => b.x + b.w));
        const dxLimit = 1 - rightmost;
        const dx = Math.min(dxRaw, Math.max(0, dxLimit));
        setBoxes(startBoxes.map(b => (ids.has(b.id) ? { ...b, x: Math.max(0, b.x + dx), y: Math.max(0, b.y + dy) } : b)));
        return;
      }
      if (phase === 'resizing' && resizingId && resizeStart) {
        e.preventDefault();
        const dx = (e.clientX - startX) / pageWidthPx;
        const minW = resizeStart.kind === 'text' ? MIN_TEXT_W : resizeStart.kind === 'ink' ? MIN_INK_W : MIN_PIN_W;
        const newW = Math.max(minW, resizeStart.w + dx);
        setBoxes(startBoxes.map(b => {
          if (b.id !== resizingId) return b;
          if (b.kind === 'ink') return { ...b, w: newW, h: newW * resizeStart!.aspect };
          // a page-pin takes its kind's canonical aspect only inside a resize the writer performs - never on load or on a move: constrain forward, never snap [BoardEditor §42]
          if (b.kind === 'page-pin' && resizeStart!.pinAspect != null) {
            // the card keeps its proportions and follows the pointer on both axes: the axis the pointer moved more drives the size, so the corner stays under the hand; MIN_PIN_H floors it [BoardEditor §43]
            const a = resizeStart!.pinAspect;
            const dyFrac = (e.clientY - startY) / pageWidthPx;
            // a DELTA from the start size, so an outward drag never shrinks an older, differently shaped card: it takes its kind's shape at the first pixel and grows [BoardEditor §44]
            const byX = dx, byY = dyFrac / a;
            const toward = resizeStart!.w + (Math.abs(byX) >= Math.abs(byY) ? byX : byY);
            const w = Math.max(minW, MIN_PIN_H / a, toward);
            return { ...b, w, h: Math.max(MIN_PIN_H, w * a) };
          }
          // FX4 S4 — text now resizes freeform on BOTH axes too (height was
          // reflow-only before this ticket): dragging taller sets an
          // explicit `h` the reflow-as-minimum effect above will only ever
          // GROW from, never shrink back — "height becomes free; reflow
          // becomes a minimum, not a dictate" (the brief's own words).
          // page-pin already resized both axes freeform (AB4 S4); text now
          // shares the identical branch, MIN_TEXT_H its own floor.
          const dy = (e.clientY - startY) / pageWidthPx;
          const minH = b.kind === 'text' ? MIN_TEXT_H : MIN_PIN_H;
          const newH = Math.max(minH, resizeStart!.h + dy);
          return { ...b, w: newW, h: newH, ...(b.kind === 'text' ? { sizedByHand: true as const } : {}) };   // BUG 32c: a text card the writer resizes by hand is theirs to size
        }));
      }
    };

    const onUp = (e: PointerEvent) => {
      if (phase === 'creating') { finishCreate(true, e); return; }
      finish(true);
    };
    const onCancel = () => {
      // A genuine pointercancel (not a plain release) always disarms
      // without ever committing — never trust wherever the OS happened to
      // report the pointer at cancel time.
      if (phase === 'creating') { finishCreate(false); return; }   // a touch drag that turned into a native scroll cancels the card, cleanly
      finish(false);
    };

    connectEndRef.current = endConnect;
    document.addEventListener('contextmenu', onCtx, true);
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove, { passive: false });
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onCancel);
    canvas.addEventListener('dragstart', onDragStart);
    return () => {
      clearTimer();
      canvas.removeEventListener('dragstart', onDragStart);
      endConnect();
      clearFlashTimers();
      delete canvas.dataset.resizing;
      document.removeEventListener('contextmenu', onCtx, true);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onCancel);
      // FX11 S1 (FX8 review A1) — a viewport resize changes pageWidthPx, which
      // re-runs this effect: the old listeners are torn down here and fresh ones
      // (a new closure, phase='idle') re-attached. Without clearing the flag, a
      // resize MID-DRAG left the React `isDragging` state true with no live
      // gesture to ever call finish() and clear it — leaving data-dragging='true'
      // on the canvas and every face stuck cursor:grabbing until the next drag
      // completed. Clearing it in the cleanup makes the re-attach start at rest.
      // (A no-op when no drag is in flight — React bails on an unchanged value.)
      setIsDragging(false);
    };
  }, [pageWidthPx, boardMode === 'open']);   // a Deck mounts in the Walk (no canvas: this effect bails at `if (!canvas) return`); re-attach when Open arrives, as the wrap effects above (walk-open-select.mjs)
}
