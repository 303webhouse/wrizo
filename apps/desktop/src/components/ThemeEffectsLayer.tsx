import { useEffect, useRef } from 'react';
import { useTheme, type ThemeId } from '../store/theme';
import { useWritingSession } from './WritingSession';
import { effectiveAmbianceDial } from '../store/ambianceDial';

// TH1 Slice 4 — the effects compositor scaffold (canon §6). Mounted ONCE at
// the app root (App.tsx, alongside GlobalHeader/BrandMark) so every surface
// gets it for free and no per-surface wiring — or W1 grid measurement — is
// possible. `.theme-fx-layer` (index.css) is position:fixed, pointer-events
// none, zero layout participation.
//
// A theme claims this layer by calling registerThemeFx(id, handlers) — TH2
// (Flux) wires the Signal Loss texture dialect (canon §7) and the RESPONSE
// glow (canon §8) this way, reading `store/ambianceDial.ts` for the dial
// value and `store/effectsScheduler.ts` for the jittered timers — without
// editing this component. Empty for every theme in TH1 (nothing calls
// registerThemeFx yet): **Plateau runs this layer empty.**
interface ThemeFxHandlers {
  // getDial() reads store/ambianceDial.ts's effective (reduced-motion-aware)
  // value; isBusy() reads the typing-state signal for TEXTURE's damping.
  mount(container: HTMLDivElement, getDial: () => number, isBusy: () => boolean): () => void; // returns cleanup
}

const FX_REGISTRY: Partial<Record<ThemeId, ThemeFxHandlers>> = {};

// The one seam TH2 (or Volant/Nomad/Machina, later) touches to light this
// layer up — registering a second time for the same id replaces the first.
export function registerThemeFx(id: ThemeId, handlers: ThemeFxHandlers): void {
  FX_REGISTRY[id] = handlers;
}

export function ThemeEffectsLayer() {
  const theme = useTheme();
  const { isWriting } = useWritingSession();
  const isWritingRef = useRef(isWriting);
  isWritingRef.current = isWriting;
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fx = FX_REGISTRY[theme];
    const el = layerRef.current;
    if (!fx || !el) return; // Plateau (and any unregistered theme): stays empty
    return fx.mount(el, effectiveAmbianceDial, () => isWritingRef.current);
  }, [theme]);

  return <div ref={layerRef} className="theme-fx-layer" data-theme-fx={theme} aria-hidden="true" />;
}

// Test/inspection seam (the resumeVocab.ts / wrizoVocab pattern) — lets the
// harness exercise the registration seam without a real TH2 theme pack.
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoThemeFx?: unknown }).wrizoThemeFx = { register: registerThemeFx };
}
