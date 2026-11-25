import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useDeskLexicon, type DeskTermId } from '../../store/deskLexicon';
import { INKS, NIBS, TIPS } from '../../store/ink';
import type { StrokeInk, StrokeNib, StrokeTip } from '../../types';
import type { InkPen } from '../InkStratum';
import { TIP_ICONS } from './inkIcons';

// VISUAL 1a.1 - THE INK TAB (VISUAL's ink-tab-plan §1, Nick's ruling of Nov 23). Loaded on the first INK open (InkTabSlot.tsx), never in the first download.
//   the face    two lines: the brush in her hand (with her last brushes) and the size; the inks and the eraser. It never scrolls away. Move and Undo stay on the page until slice 1b.2.
//   Studio      one door under the face, opening DOWN. Its arrow points the way things open: down closed, up open.
//   the rows    only the built ones (DRAW: Brushes, Colour). When one opens the others fold away; pressing its name brings the list back; pressing Studio folds everything.
// Studio starts closed at every sitting and stays as she leaves it while she is here: module memory only, nothing saved (remembering it would be new saved data, Nick's call).

export interface InkOpts {
  pen: InkPen;
  onPick: (next: Partial<InkPen>) => void;
  eraserArmed: boolean;
  onToggleEraser: () => void;
}

type Row = 'brushes' | 'colour';
interface Sitting { studio: boolean; row: Row | null; recent: StrokeTip[] }

let sitting: Sitting = { studio: false, row: null, recent: [] };
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
const read = () => sitting;
const set = (next: Partial<Sitting>) => { sitting = { ...sitting, ...next }; listeners.forEach((fn) => fn()); };

const TIP_TERM: Record<StrokeTip, DeskTermId> = { pen: 'inkTipPen', pencil: 'inkTipPencil', marker: 'inkTipMarker' };
const NIB_TERM: Record<StrokeNib, DeskTermId> = { fine: 'inkNibFine', regular: 'inkNibRegular', broad: 'inkNibBroad' };
const INK_TERM: Record<StrokeInk, DeskTermId> = { walnut: 'inkWalnut', iron: 'inkIron', oxblood: 'inkOxblood', sea: 'inkSea' };

/** Her brushes, newest first: the one in her hand, then the ones she used before it this sitting, then the rest. */
function brushList(inHand: StrokeTip, recent: readonly StrokeTip[]): StrokeTip[] {
  return [...new Set<StrokeTip>([inHand, ...recent, ...TIPS])];
}

const ROWS: readonly { id: Row; term: DeskTermId; icon: React.ReactNode }[] = [
  {
    id: 'brushes', term: 'inkRowBrushes',
    icon: (
      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
        <path d="M13.6 2.4 7.2 8.8" />
        <path d="M7.2 8.8c-2-.6-3.4.7-3.6 2.4-.1 1-.6 1.7-1.4 2.1 2.4 1 5.6.4 5.9-2.4z" />
      </svg>
    ),
  },
  {
    id: 'colour', term: 'inkRowColour',
    icon: (
      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 2.2c2.4 3 4.2 5.3 4.2 7.4a4.2 4.2 0 0 1-8.4 0c0-2.1 1.8-4.4 4.2-7.4z" />
      </svg>
    ),
  },
];

const Arrow = ({ open }: { open: boolean }) => <span className="wz-ink-arrow" aria-hidden="true">{open ? '▴' : '▾'}</span>;

export function InkTab({ opts }: { opts: InkOpts }) {
  const { t } = useDeskLexicon();
  const { studio, row, recent } = useSyncExternalStore(subscribe, read, read);
  const [brushes, setBrushes] = useState(false);
  const lineRef = useRef<HTMLDivElement>(null);
  const brushRef = useRef<HTMLButtonElement>(null);
  const { pen } = opts;
  const list = brushList(pen.tip, recent);

  const pickTip = (tip: StrokeTip) => {
    set({ recent: brushList(tip, list) });
    opts.onPick({ tip });
  };
  const nibAt = NIBS.indexOf(pen.nib);
  const step = (by: number) => { const nib = NIBS[nibAt + by]; if (nib) opts.onPick({ nib }); };

  // the short list closes on a press anywhere else
  useEffect(() => {
    if (!brushes) return;
    const away = (e: PointerEvent) => { if (!lineRef.current?.contains(e.target as Node)) setBrushes(false); };
    document.addEventListener('pointerdown', away, true);
    return () => document.removeEventListener('pointerdown', away, true);
  }, [brushes]);
  // Esc closes the list first and stops there: the drawer only closes on an Esc nothing inside handled (Sliver.tsx)
  const onEsc = (e: React.KeyboardEvent) => {
    if (e.key !== 'Escape' || !brushes) return;
    e.preventDefault();
    setBrushes(false);
    brushRef.current?.focus();
  };

  return (
    <div className="wz-ink-tab" onKeyDown={onEsc}>
      <div className="wz-ink-face">
        <div className="wz-ink-face-line wz-ink-face-line--brush" ref={lineRef}>
          <button
            ref={brushRef}
            type="button"
            className="mode-tbtn wz-ink-brush"
            aria-expanded={brushes}
            aria-label={`${t('inkBrush')}: ${t(TIP_TERM[pen.tip])}`}
            onClick={() => setBrushes((v) => !v)}
          >
            <span className="wz-ink-brush-word">{t(TIP_TERM[pen.tip])}</span>
            <Arrow open={brushes} />
          </button>
          <span className="wz-ink-size" role="group" aria-label={t('inkNib')}>
            <button type="button" className="mode-tbtn wz-ink-size-down" aria-label={t('inkSizeSmaller')} title={t('inkSizeSmaller')} disabled={nibAt <= 0} onClick={() => step(-1)}>&minus;</button>
            <span className="wz-ink-size-value" data-nib={pen.nib} aria-live="polite">{t(NIB_TERM[pen.nib])}</span>
            <button type="button" className="mode-tbtn wz-ink-size-up" aria-label={t('inkSizeLarger')} title={t('inkSizeLarger')} disabled={nibAt >= NIBS.length - 1} onClick={() => step(1)}>+</button>
          </span>
          {brushes && (
            <div className="wz-ink-recent" role="radiogroup" aria-label={t('inkBrush')}>
              {list.map((tip) => (
                <button key={tip} type="button" role="radio" className="wz-ink-recent-item" aria-checked={pen.tip === tip} data-recent-tip={tip}
                  onClick={() => { pickTip(tip); setBrushes(false); brushRef.current?.focus(); }}>
                  {TIP_ICONS[tip]}<span>{t(TIP_TERM[tip])}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="wz-ink-face-line wz-ink-face-line--ink">
          <div className="wz-sliver-inks" role="radiogroup" aria-label={t('railInk')}>
            {INKS.map((ink) => (
              <button
                key={ink}
                type="button"
                role="radio"
                /* The swatch paints from the THEME TOKEN, never a literal — the same var() the renderer resolves, so the chip and the stroke can never disagree about what "oxblood" means. */
                className={`mode-swatch wz-ink-swatch${pen.ink === ink ? ' active' : ''}`}
                style={{ background: `var(--ink-${ink})` }}
                aria-checked={pen.ink === ink}
                aria-label={t(INK_TERM[ink])}
                title={t(INK_TERM[ink])}
                onClick={() => opts.onPick({ ink })}
              />
            ))}
            {/* the eraser is a real two-state toggle and tip-agnostic: it erases whatever tip laid the ink [Sliver §15] */}
            <button
              type="button"
              className="mode-tbtn wz-ink-eraser"
              aria-pressed={opts.eraserArmed}
              data-on={opts.eraserArmed ? 'true' : 'false'}
              aria-label={t('inkEraser')}
              title={t('inkEraser')}
              onClick={opts.onToggleEraser}
            >
              <span aria-hidden="true">&#9107;</span>
            </button>
          </div>
        </div>
      </div>

      <button type="button" className="wz-ink-studio" aria-expanded={studio} onClick={() => set({ studio: !studio, row: null })}>
        <span className="wz-ink-studio-word">{t('inkStudio')}</span>
        <Arrow open={studio} />
      </button>

      {studio && (
        <div className="wz-ink-studio-body">
          {row === null && <div className="wz-ink-group">{t('inkGroupDraw')}</div>}
          {ROWS.filter((r) => row === null || r.id === row).map((r) => (
            <button key={r.id} type="button" className="wz-ink-row" data-ink-row={r.id} aria-expanded={row === r.id} onClick={() => set({ row: row === r.id ? null : r.id })}>
              {r.icon}
              <span className="wz-ink-row-word">{t(r.term)}</span>
              <Arrow open={row === r.id} />
            </button>
          ))}

          {row === 'brushes' && (
            <div className="wz-ink-row-body" data-ink-row-body="brushes">
              <div className="wz-ink-tips" role="radiogroup" aria-label={t('inkTip')}>
                {TIPS.map((tip) => (
                  <button key={tip} type="button" role="radio" className="mode-tbtn wz-ink-tip" aria-checked={pen.tip === tip} data-on={pen.tip === tip ? 'true' : 'false'}
                    title={t(TIP_TERM[tip])} aria-label={t(TIP_TERM[tip])} onClick={() => pickTip(tip)}>
                    {TIP_ICONS[tip]}
                  </button>
                ))}
              </div>
              <div className="wz-ink-nibs" role="radiogroup" aria-label={t('inkNib')}>
                {NIBS.map((nib) => (
                  <button key={nib} type="button" role="radio" className="mode-tbtn wz-ink-nib" aria-checked={pen.nib === nib} data-on={pen.nib === nib ? 'true' : 'false'} onClick={() => opts.onPick({ nib })}>
                    {t(NIB_TERM[nib])}
                  </button>
                ))}
              </div>
            </div>
          )}

          {row === 'colour' && (
            <div className="wz-ink-row-body" data-ink-row-body="colour">
              <div className="wz-ink-colours" role="radiogroup" aria-label={t('inkRowColour')}>
                {INKS.map((ink) => (
                  <button key={ink} type="button" role="radio" className="wz-ink-colour" aria-checked={pen.ink === ink} aria-label={t(INK_TERM[ink])} onClick={() => opts.onPick({ ink })}>
                    <span className="wz-ink-colour-dot" style={{ background: `var(--ink-${ink})` }} aria-hidden="true" />
                    <span>{t(INK_TERM[ink])}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
