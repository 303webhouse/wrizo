import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createJournalPage } from '../store/persistence';

// F3 — Catch: the one capture gesture that costs nothing. A single shared model
// (createJournalPage → the authored J10 journal editor) behind the Desk button,
// the rail action, and the `n` shortcut, so there's one implementation, not
// three. No title, no kind, no filing; honor-discard (J1a) guarantees a blank,
// untouched Catch leaves no litter. No warmStart — a blank page has nothing to
// glow.
export function useCatch(): () => void {
  const navigate = useNavigate();
  return useCallback(() => {
    const page = createJournalPage();
    navigate(`/page/${page.id}`); // FX14 S1 — a caught thought opens in THE Page, not the journal surface
  }, [navigate]);
}
