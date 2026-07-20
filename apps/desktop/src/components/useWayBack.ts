import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { captureWayBack, clearWayBack, getWayBack } from '../store/wayBack';
import { getCaretOffset } from '../store/caretOffset';

interface Options {
  entryId: string;
  mode?: string;
  // Text surfaces only; board/script omit both (route + mount identity only).
  // Resolvers, not values — the scroll box in particular may not exist on the
  // render this hook is called (ModeStage's .mode-scroll is a grandchild).
  scrollEl?: () => HTMLElement | null; // omit + set useWindowScroll for the window-scroll surfaces (JournalEntry)
  useWindowScroll?: boolean;
  editorEl?: () => HTMLElement | null;
  // Applied once on mount if a matching way back is found. Board/script pass
  // neither — their own view state already persists through their own stores.
  applyScrollY?: (y: number) => void;
  applyCaret?: (offset: number) => void;
  // B1 — a genuine defect found live while repairing this ticket's own
  // harness (w2.mjs): the Journal Board (a real Board page, BoardEditor's
  // own generic useWayBack call) sits BETWEEN a departure and the writer's
  // eventual chip-click return, same as every board always could — but
  // unlike an ordinary board (whose own chip stays hidden the whole time,
  // isWritingRoute counting it as "writing"), B1 deliberately makes the
  // JOURNAL Board's own chip visible on arrival (wayBack.ts's own fix).
  // That exposed a pre-existing race no board had ever hit before: clicking
  // the chip navigates away, unmounting the Journal Board; ITS OWN capture-
  // on-unmount effect (below) fires and overwrites the one-slot store with
  // the Journal Board's own entryId — clobbering the very information the
  // chip's destination page needs to recognize a matching way-back and
  // restore its scroll/caret. Retired Journal.tsx never called this hook at
  // all, so this race never existed there. `false` here is the minimal fix:
  // a system Board doesn't participate in capture/restore/tracking at all
  // (the same "route + mount identity only" as board/script already gets,
  // taken one step further to "no participation") — an ordinary board's
  // own existing behavior is completely untouched (defaults to `true`).
  participatesInWayBack?: boolean;
}

// W2 — one hook, two halves, per docs/w2-way-back-brief.md.
//
// CAPTURE is the subtle half: departing via a click (a rail item, "Done", the
// Pages/Plan toggle — anything outside the editor) BLURS the editor and can
// move the browser's Selection before the unmounting component's cleanup
// ever runs — a live DOM/Selection query AT UNMOUNT reads state from AFTER
// the departure already started, not from the writing session itself. So
// this hook tracks scroll + caret CONTINUOUSLY into refs (a scroll listener;
// a selectionchange listener that only updates while the selection is still
// inside the editor, so it naturally freezes at the last real position once
// focus moves away) and captures from those refs at unmount, not from a
// fresh query.
//
//   RESTORE (mount)  — if the way-back slot names THIS entryId, consume it
//                       (one-shot: cleared immediately) and apply scroll/
//                       caret over the next ~350ms (re-asserted, not applied
//                       once — a fresh mount's own content-seeding, e.g. the
//                       typewriter's initial hold-band scroll, can re-adjust
//                       the same container a frame or two after ours, so a
//                       single write can lose that race). Fires no matter
//                       how the writer arrived (chip, rail, list, pager) —
//                       "reaching the page by any other path also consumes
//                       the slot if it lands on the same entry" falls out
//                       for free from keying purely on entryId.
//   CAPTURE (unmount) — on leaving this surface's route (a real departure —
//                       callers are keyed by id so a mode switch never
//                       unmounts this hook's owner), snapshot the tracked
//                       scroll/caret/mode into the one-slot store. "Opening
//                       a different writing surface replaces the slot"
//                       falls out naturally: the next departure always
//                       overwrites whatever was here.
export function useWayBack({ entryId, mode, scrollEl, useWindowScroll, editorEl, applyScrollY, applyCaret, participatesInWayBack = true }: Options): void {
  const location = useLocation();
  const lastScrollRef = useRef(0);
  const lastCaretRef = useRef<number | null>(null);
  const liveRef = useRef({ entryId, mode, pathname: location.pathname });
  liveRef.current = { entryId, mode, pathname: location.pathname };

  // Continuous tracking while mounted.
  useEffect(() => {
    if (!participatesInWayBack) return;
    const updateScroll = () => {
      if (useWindowScroll) { lastScrollRef.current = window.scrollY; return; }
      const el = scrollEl?.();
      if (el) lastScrollRef.current = el.scrollTop;
    };
    const updateCaret = () => {
      const el = editorEl?.();
      if (!el) return;
      const off = getCaretOffset(el);
      if (off !== null) lastCaretRef.current = off; // selection moved outside el — keep the last good value
    };
    updateScroll();
    updateCaret();
    const scrollTarget = useWindowScroll ? window : scrollEl?.();
    scrollTarget?.addEventListener('scroll', updateScroll, { passive: true });
    document.addEventListener('selectionchange', updateCaret);
    // .mode-scroll may not exist on the very first tick (a grandchild's ref
    // attaches after this effect's initial run in some mount orders) — a
    // short re-check catches it without a full listener-registration retry.
    const t = window.setTimeout(updateScroll, 300);
    return () => {
      scrollTarget?.removeEventListener('scroll', updateScroll);
      document.removeEventListener('selectionchange', updateCaret);
      window.clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryId, participatesInWayBack]);

  // Restore. The rAF + 80/200/350ms re-assert ladder wins the mount-seeding
  // race (see above) — but left unchecked it also fights the WRITER: typing
  // resumed at ~300ms would get the caret yanked back mid-word by the 350ms
  // write; an immediate flick-scroll would get un-scrolled (Fable W2-R2). The
  // initial rAF apply always lands (it's what makes the return feel instant);
  // the LATER re-asserts exist only to win the settling race against the
  // surface's own mount-time adjustments, so they cancel the moment the
  // writer does anything — a real keystroke, pointer action, wheel, or touch
  // means they've already resumed and any further correction would fight them
  // instead of helping.
  useEffect(() => {
    if (!participatesInWayBack) return;
    const wb = getWayBack();
    if (!wb || wb.entryId !== entryId) return;
    clearWayBack(); // one-shot: consumed the instant we recognize it, regardless of arrival path
    const apply = () => {
      if (typeof wb.scrollY === 'number') applyScrollY?.(wb.scrollY);
      if (typeof wb.caret === 'number') applyCaret?.(wb.caret);
    };
    const raf = requestAnimationFrame(apply);
    const timers = [80, 200, 350].map(ms => window.setTimeout(apply, ms));
    const cancelReasserts = () => { timers.forEach(t => window.clearTimeout(t)); };
    const events: Array<[string, EventListenerOptions]> = [
      ['keydown', { capture: true }],
      ['pointerdown', { capture: true }],
      ['wheel', { capture: true }],
      ['touchstart', { capture: true }],
    ];
    const onFirstInput = () => {
      cancelReasserts();
      events.forEach(([type, opts]) => window.removeEventListener(type, onFirstInput, opts));
    };
    events.forEach(([type, opts]) => window.addEventListener(type, onFirstInput, opts));
    return () => {
      cancelAnimationFrame(raf);
      cancelReasserts();
      events.forEach(([type, opts]) => window.removeEventListener(type, onFirstInput, opts));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryId, participatesInWayBack]);

  // Capture — on unmount (a route departure while this surface was live).
  // Reads the TRACKED refs, never a fresh query (see the header comment).
  useEffect(() => {
    if (!participatesInWayBack) return;
    return () => {
      const { entryId, mode, pathname } = liveRef.current;
      captureWayBack({
        entryId,
        route: pathname,
        scrollY: lastScrollRef.current,
        caret: lastCaretRef.current ?? undefined,
        mode,
        capturedAt: Date.now(),
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryId, participatesInWayBack]);
}
