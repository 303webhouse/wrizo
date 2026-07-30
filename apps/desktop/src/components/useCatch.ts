import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { unbornHref } from '../store/unbornPage';

// F3 — Catch: the one capture gesture that costs nothing. A single shared model
// (createJournalPage → the authored J10 journal editor) behind the Desk button,
// the rail action, and the `n` shortcut, so there's one implementation, not
// three. No title, no kind, no filing.
//
// PB1 (item 71) — THE CURRENT GUARANTEE, replacing the honor-discard sentence
// that used to stand here. That sentence ("honor-discard (J1a) guarantees a
// blank, untouched Catch leaves no litter") was true only while Catch landed on
// JournalEntry.tsx, whose unmount soft-deleted an untouched page; FX14 routed
// every door to THE Page, which has no such cleanup, and the sentence became a
// promise nothing kept. The guarantee now holds one step earlier and needs no
// cleanup at all: **Catch creates no row.** It opens an unborn surface, and the
// page is born by the first word. Nothing to discard, because nothing was
// written. No warmStart — a blank page has nothing to glow.
export function useCatch(): () => void {
  const navigate = useNavigate();
  return useCallback(() => {
    // FX14 S1 — a caught thought opens in THE Page, not the journal surface.
    navigate(unbornHref({ origin: 'journal' }));
  }, [navigate]);
}
