// Esc leaves the writing surface (Tab indents, so Esc is the way out): a popup open closes first; if nothing was open or nothing closed, focus goes to the current mode tab [escapeExit §1]

/** The id of the screen-reader-only hint both writing surfaces describe themselves by ("Press Escape to leave the page"). */
export const ESC_HINT_ID = 'wz-esc-hint';

// the Tools drawer closes on Esc too, so it is counted [escapeExit §2]
const OPEN_SELECTOR = [
  '[role="dialog"]', '[role="menu"]', '.wz-cascade-panel:not([data-leaving])', '.wz-tutor-panel[data-open="true"]', '.wz-sliver-panel[data-open="true"]', '.wz-beginnings',
].join(', ');

/** How many popups are open AND rendered (an aria-hidden or zero-size node is not open). */
export function openPopupCount(doc: Document = document): number {
  let n = 0;
  doc.querySelectorAll(OPEN_SELECTOR).forEach((el) => {
    if (el.closest('[aria-hidden="true"]')) return;
    if ((el as HTMLElement).getClientRects().length === 0) return;
    n += 1;
  });
  return n;
}

/** The current mode tab: the framed page's strip, or the unframed switcher, whichever is mounted. */
export function currentModeTab(doc: Document = document): HTMLElement | null {
  return doc.querySelector<HTMLElement>('.desk-mode-tab.active, .mode-tab.active, [role="tab"][aria-selected="true"]');
}

/** AN ASSUMPTION, NAMED: a popup's own Esc listener closes it within this window. It is a timer, not two animation frames, on
 *  purpose - a backgrounded or throttled tab may never run a frame, and an exit that waits on one would be a trap again. The
 *  harness (escexit.mjs) MEASURES how long each popup really takes to go and fails if it is not inside this window. */
export const POPUP_SETTLE_MS = 60;

/** Call from the editor's keydown. Returns true when it took the key. */
export function escapeFromEditor(e: KeyboardEvent, editor: HTMLElement): boolean {
  if (e.key !== 'Escape' || e.isComposing || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return false;
  const before = openPopupCount();
  window.setTimeout(() => {
    if (before > 0 && openPopupCount() < before) return;          // this Esc closed a popup; the next one leaves
    if (!editor.contains(document.activeElement)) return;          // focus already moved (a popup's own handler, or the writer)
    currentModeTab()?.focus();
  }, POPUP_SETTLE_MS);
  return true;
}
