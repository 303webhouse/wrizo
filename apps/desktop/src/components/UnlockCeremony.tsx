import { useEffect, useRef, useState } from 'react';
import { setTheme, type ThemeId } from '../store/theme';
import { OFFERED_TERRITORIES, FUTURE_TERRITORIES } from '../store/themeTerritories';

// the unlock ceremony, the one accepted visible locked door; orange fires only the instant a territory is chosen; focus moves in and Tab is contained, so aria-modal is true; no Escape - the rite resolves in a choice [UnlockCeremony §1]
function reducedMotion(): boolean {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function UnlockCeremony({ onChoose }: { onChoose: (themeId: ThemeId) => void }) {
  const [chosen, setChosen] = useState<ThemeId | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    firstButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const el = dialogRef.current;
      if (!el) return;
      const focusable = [...el.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const choose = (themeId: ThemeId) => {
    if (chosen) return; // one shot — a second click mid-flash is a no-op
    setChosen(themeId);
    setTheme(themeId);
    const delay = reducedMotion() ? 0 : 380; // lets the brass flash land before the veil lifts
    window.setTimeout(() => onChoose(themeId), delay);
  };

  return (
    <div className="hb1-ceremony-backdrop">
      <div ref={dialogRef} className="hb1-ceremony" role="dialog" aria-modal="true" aria-label="A second theme, unlocked">
        <div className="hb1-ceremony-eyebrow">A hundred words in.</div>
        <div className="hb1-ceremony-title">A second theme, unlocked.</div>
        <div className="hb1-ceremony-offered">
          {OFFERED_TERRITORIES.map((t, i) => (
            <button
              key={t.id}
              ref={i === 0 ? firstButtonRef : undefined}
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
