import { useEffect, type MutableRefObject, type Dispatch, type SetStateAction } from 'react';
import { setFirstRunComplete } from '../../store/firstRun';
import { setFirstRunGateActive } from '../../store/firstRunGateActive';
import { useMonotonicWordCount } from '../../components/FirstRunGate';
import type { ThemeId } from '../../store/theme';

// HB1 F1 — the gate's fixed instrument: 100 whitespace-delimited words.
export const FIRST_RUN_WORD_TARGET = 100;

export function useFirstRunGate({ framed, firstRunGateRequested, gateUnlocked, text, setGateUnlocked }: {
  framed: boolean;
  firstRunGateRequested: MutableRefObject<boolean>;
  gateUnlocked: boolean;
  text: string;
  setGateUnlocked: Dispatch<SetStateAction<boolean>>;
}) {
  const gateActive = framed && firstRunGateRequested.current && !gateUnlocked;
  const gateWords = useMonotonicWordCount(text, gateActive);
  const gateReached = gateActive && gateWords >= FIRST_RUN_WORD_TARGET;

  useEffect(() => {
    setFirstRunGateActive(gateActive);
    return () => setFirstRunGateActive(false);
  }, [gateActive]);

  const handleChooseTheme = (themeId: ThemeId) => {
    void themeId; // setTheme already applied by UnlockCeremony itself
    setFirstRunComplete(true);
    setGateUnlocked(true);
  };

  return { gateActive, gateWords, gateReached, handleChooseTheme };
}
