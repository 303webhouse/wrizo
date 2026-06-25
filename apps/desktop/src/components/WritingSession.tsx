import { createContext, useCallback, useContext, useMemo, useState } from 'react';

// CW4 — the WritingSession context. A single, surface-agnostic source of truth
// for writing-mode the whole app can read: the global header (App.tsx), and
// later the journal page / gate / HOME, subscribe to recede together with the
// active writing surface. The recede MECHANICS still live in the shell
// (useChromeFade): the settle, the intent/idle restore, the data-chrome-receded
// convention. This context only re-homes the boolean so others can read it.

export interface WritingSession {
  isWriting: boolean;            // active forward input within the settle window
  inSession: boolean;           // a writing surface is mounted
  activeSurface: string | null; // which one (e.g. 'sprint')
  // Driven by the shell (useChromeFade) — not for general consumers.
  setWriting: (v: boolean) => void;
  beginSession: (surface: string) => void;
  endSession: (surface: string) => void;
}

const NOOP: WritingSession = {
  isWriting: false, inSession: false, activeSurface: null,
  setWriting: () => {}, beginSession: () => {}, endSession: () => {},
};

const Ctx = createContext<WritingSession | null>(null);

export function WritingSessionProvider({ children }: { children: React.ReactNode }) {
  const [isWriting, setIsWriting] = useState(false);
  const [activeSurface, setActiveSurface] = useState<string | null>(null);

  const setWriting = useCallback((v: boolean) => setIsWriting(v), []);
  const beginSession = useCallback((surface: string) => setActiveSurface(surface), []);
  const endSession = useCallback((surface: string) => {
    // Leaving a writing surface ends writing mode (so nothing stays receded on
    // another screen).
    setActiveSurface(cur => (cur === surface ? null : cur));
    setIsWriting(false);
  }, []);

  const value = useMemo<WritingSession>(() => ({
    isWriting,
    inSession: activeSurface !== null,
    activeSurface,
    setWriting,
    beginSession,
    endSession,
  }), [isWriting, activeSurface, setWriting, beginSession, endSession]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// Read the writing session. Returns a stable no-op default outside a provider so
// a surface rendered in isolation never crashes.
export function useWritingSession(): WritingSession {
  return useContext(Ctx) ?? NOOP;
}
