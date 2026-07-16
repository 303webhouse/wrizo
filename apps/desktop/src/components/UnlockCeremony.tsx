import { useState } from 'react';
import { setTheme, type ThemeId } from '../store/theme';
import { OFFERED_TERRITORIES, FUTURE_TERRITORIES } from '../store/themeTerritories';

// HB1 S4 — the unlock ceremony. R2's carve-out: a visible locked door is
// accepted here, once, as the first-run rite's own reward — M1's "never a
// visible locked door" governs everywhere else, unchanged. Crossing 100
// words mounts this; choosing a territory applies the theme (existing
// mechanism, store/theme.ts), then closes — the veil lifts with it.
//
// Orange law: gate progress (FirstRunGate.tsx) stays quiet throughout; this
// is the ONE place orange fires — the instant a human actually chooses, not
// as resting decoration on either offered button (so it never becomes a
// second .btn-brass on the same screen — the ceremony's own `.chosen` class
// is a transient, single-valued flash, not the shared brass utility).
function reducedMotion(): boolean {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function UnlockCeremony({ onChoose }: { onChoose: (themeId: ThemeId) => void }) {
  const [chosen, setChosen] = useState<ThemeId | null>(null);

  const choose = (themeId: ThemeId) => {
    if (chosen) return; // one shot — a second click mid-flash is a no-op
    setChosen(themeId);
    setTheme(themeId);
    const delay = reducedMotion() ? 0 : 380; // lets the brass flash land before the veil lifts
    window.setTimeout(() => onChoose(themeId), delay);
  };

  return (
    <div className="hb1-ceremony-backdrop">
      <div className="hb1-ceremony" role="dialog" aria-modal="true" aria-label="A second theme, unlocked">
        <div className="hb1-ceremony-eyebrow">A hundred words in.</div>
        <div className="hb1-ceremony-title">A second theme, unlocked.</div>
        <div className="hb1-ceremony-offered">
          {OFFERED_TERRITORIES.map(t => (
            <button
              key={t.id}
              type="button"
              className={`hb1-territory hb1-territory-offered${chosen === t.themeId ? ' chosen' : ''}`}
              disabled={chosen != null}
              onClick={() => choose(t.themeId as ThemeId)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="hb1-ceremony-future-label">Future territories</div>
        <div className="hb1-ceremony-future" aria-label="Future territories, not yet available">
          {FUTURE_TERRITORIES.map(t => (
            <span key={t.id} className="hb1-territory hb1-territory-future" aria-disabled="true">{t.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
