// ESC LEAVES THE WRITING SURFACE (accessibility audit A1, cloud-a11y-audit @ 9c15c86: "the writing surface is a keyboard trap").
//
// Tab indents on the page by Nick's ruling (item 158, then 209), so Tab cannot also be the way out - and item 158's own comment
// promised "Escape is what leaves the surface". Nothing did that; the audit measured Esc leaving focus where it was. WCAG 2.1.2 allows
// a surface to keep Tab only when another key leads out, so Esc is that key: it moves focus to the CURRENT MODE TAB, the nearest
// chrome, in every mode.
//
// A MENU OR POPUP CLOSES FIRST. The page's popups (the rail panels, the Tutor, the beginnings row, sheets, dialogs, menus) already
// close on Esc through their OWN document/window listeners, which run AFTER the editor's (the event bubbles from the editor up).
// So the editor does not decide here which popup to close: it counts what is open now, lets the event finish, and looks again.
// If something closed, that Esc was the popup's. If nothing was open, or nothing closed (a popup with no Esc of its own), focus
// leaves - the trap is never re-made by a popup that ignores the key.

const OPEN_SELECTOR = [
  '[role="dialog"]', '[role="menu"]', '.wz-cascade-panel', '.wz-tutor-panel[data-open="true"]', '.wz-beginnings',
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

/** The time a popup's own Esc listener has to close it (React flushes a native-event update well inside this). */
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
