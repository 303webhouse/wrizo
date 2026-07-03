import { useCallback, useEffect, useRef } from 'react';
import { recordSession, type SessionSurface } from '../store/sessionLog';

// F5 — a writing-surface session recorder. Mount = session start; the returned
// `noteKeystroke` (wired into the SAME onForward/noteWrite seam F2's warm release
// uses — one seam, another consumer) stamps firstKeystrokeAt once; unmount records
// (subject to the litter guard). Getters are read at unmount via a ref so the
// recorded projectId/words are never stale. `enabled` gates read-only surfaces
// (a capture that's viewed, not authored) out of the funnel entirely.
interface Getters {
  projectId: () => string | null;
  words: () => number;
  enabled?: () => boolean;
}

export function useSessionLog(surface: SessionSurface, get: Getters): () => void {
  const firstKsRef = useRef<string | null>(null);
  const startRef = useRef<{ at: string; ms: number }>({ at: '', ms: 0 });
  const getRef = useRef(get);
  getRef.current = get;

  useEffect(() => {
    startRef.current = { at: new Date().toISOString(), ms: Date.now() };
    firstKsRef.current = null;
    return () => {
      if (getRef.current.enabled && !getRef.current.enabled()) return;
      recordSession({
        surface,
        startedAt: startRef.current.at,
        startedMs: startRef.current.ms,
        firstKeystrokeAt: firstKsRef.current,
        projectId: getRef.current.projectId(),
        words: getRef.current.words(),
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return useCallback(() => {
    if (!firstKsRef.current) firstKsRef.current = new Date().toISOString();
  }, []);
}
