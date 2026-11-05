import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { unbornHref } from '../store/unbornPage';

// Catch: one shared capture gesture behind three doors; it creates no row - it opens an unborn surface, and the page is born by the first word [useCatch §1]
export function useCatch(): () => void {
  const navigate = useNavigate();
  return useCallback(() => {
    // FX14 S1 — a caught thought opens in THE Page, not the journal surface.
    navigate(unbornHref({ origin: 'journal' }));
  }, [navigate]);
}
