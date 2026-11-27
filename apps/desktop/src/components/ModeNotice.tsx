// THE "MODE ON" NOTICE (the flourish spec draft 2 §2 and §7, ruled by Nick Nov 26): when a theme opens with its flourish on (Arbor's Rhizome, Flux's Glitch,
// Machina's Run), one quiet status line stands under the meter - or, where there is no room, in the window's lower right, clear of the page. It never covers the page or the
// caret, never takes focus (its button keeps hers on press), never animates, and leaves after 6 s or on her first key. Turn off turns off that theme's flourish
// only (store/flourish.ts), says where to turn it back on, and names Distraction Free. It is drawn on <body>, so it can never move the page.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme, type ThemeId } from '../store/theme';
import { useWritingSettings, type WritingSettings } from '../store/writingSettings';
import { flourishPinned, flourishWanted, setFlourishOff } from '../store/flourish';
import { useWritingGoal } from '../store/writingGoal';
import { useDeskLexicon } from '../store/deskLexicon';
import { takeOpening } from '../store/modeNotice';

const ON_MS = 6000;    // the notice
const OFF_MS = 8000;   // the line after Turn off: a sentence longer to read

// is the theme's own flourish drawn right now: hers still on, Progress counting words with the theme's tracker on (Arbor and Machina draw theirs only toward a goal)
function flourishOn(theme: ThemeId, s: WritingSettings, goalN: number): boolean {
  if (flourishPinned() || !flourishWanted(theme) || !s.instrumentsOn || s.progress !== 'words' || s.themeTracker === false) return false;
  return theme === 'flux' || goalN > 0;
}

const METER = '.desk-frame-instrument, .machina2-run, .wz-plain-tracker, .wz-glitch-switch';

export function ModeNotice() {
  const theme = useTheme();
  const settings = useWritingSettings();
  const goal = useWritingGoal();
  const { t } = useDeskLexicon();
  const [kind, setKind] = useState<'on' | 'off' | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const taken = useRef<ThemeId | null>(null);

  useEffect(() => {
    if (taken.current === theme) return;
    if (!takeOpening(theme)) { setKind(null); return; }
    taken.current = theme;
    setKind(flourishOn(theme, settings, goal?.n ?? 0) ? 'on' : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- judged once, as the theme opens
  }, [theme]);
  // a theme chosen again later is a new opening, even if this lane stayed mounted through the change away
  useEffect(() => () => { taken.current = null; }, [theme]);

  // it leaves by itself, its seconds counted from when it can be seen (never behind the splash); her first key takes it away
  useEffect(() => {
    if (!kind) return undefined;
    let left = 0, wait = 0;
    const start = () => {
      if (document.querySelector('.wz-splash')) { wait = window.setTimeout(start, 200); return; }
      left = window.setTimeout(() => setKind(null), kind === 'on' ? ON_MS : OFF_MS);
    };
    start();
    const onKey = () => setKind(null);
    document.addEventListener('keydown', onKey, true);
    return () => { window.clearTimeout(left); window.clearTimeout(wait); document.removeEventListener('keydown', onKey, true); };
  }, [kind]);

  // under the meter where there is room; else the lower right, never over the page
  const place = useCallback(() => {
    const el = box.current;
    if (!el) return;
    const meters = [...document.querySelectorAll<HTMLElement>(METER)].map((m) => m.getBoundingClientRect()).filter((r) => r.width > 1 && r.height > 1);
    const page = document.querySelector<HTMLElement>('.desk-frame-stage .mode-page')?.getBoundingClientRect();
    el.style.maxWidth = '';
    let { width: w, height: h } = el.getBoundingClientRect();
    if (meters.length) {
      const bottom = Math.max(...meters.map((r) => r.bottom));
      const left = Math.min(...meters.map((r) => r.left)), right = Math.max(...meters.map((r) => r.right));
      if (bottom + 4 + h <= window.innerHeight - 2) {
        Object.assign(el.style, { top: `${Math.round(bottom + 4)}px`, bottom: 'auto', right: 'auto', left: `${Math.round(Math.max(8, Math.min(window.innerWidth - w - 8, (left + right) / 2 - w / 2)))}px` });
        return;
      }
    }
    Object.assign(el.style, { top: 'auto', left: 'auto', right: '8px', bottom: '8px' });
    // the lower right must be clear of the page: where the page reaches down there, the line wraps into the room beside it
    const meterRight = meters.length ? Math.max(...meters.map((r) => r.right)) : 0;
    const edge = Math.max(page && page.bottom > window.innerHeight - 8 - h ? page.right : 0, meterRight);
    if (edge) {
      const room = window.innerWidth - edge - 16;
      if (room < w) el.style.maxWidth = `${Math.max(120, Math.floor(room))}px`;
      ({ width: w, height: h } = el.getBoundingClientRect());
    }
  }, []);
  useLayoutEffect(() => {
    if (!kind) return undefined;
    place();
    const again = window.setTimeout(place, 350);   // the lane's own art (the Run, the plain row) may arrive a frame later
    window.addEventListener('resize', place);
    return () => { window.clearTimeout(again); window.removeEventListener('resize', place); };
  }, [kind, theme, place]);

  if (!kind) return null;
  const turnOff = () => {
    setFlourishOff(theme, true);
    setKind('off');
  };
  return createPortal(
    <div ref={box} className="wz-mode-notice" role="status" data-mode-notice={kind}>
      {kind === 'on' ? (
        <>
          <span>{t('modeNoticeOn')}</span>
          <span aria-hidden="true">·</span>
          {/* mousedown is prevented so her focus and caret stay in the page */}
          <button type="button" data-mode-notice-off onMouseDown={(e) => e.preventDefault()} onClick={turnOff}>{t('modeNoticeTurnOff')}</button>
          <span className="wz-mode-notice-also">{t('modeNoticeQuiet')}</span>
        </>
      ) : (
        <span>{`${t('modeNoticeOff')}. ${t('modeNoticeBack').replace('{where}', t('modeNoticeWhere'))}`}</span>
      )}
    </div>,
    document.body,
  );
}
