import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useDeskLexicon, type DeskTermId } from '../../store/deskLexicon';
import { INKS, NIBS, SIZE_MAX, SIZE_MIN, TIPS, darkSheetInk, nibWidth } from '../../store/ink';
import { isHexColour } from '../../reorg/parts';
import { customVars, inkOn } from '../../reorg/colourScheme';
import type { StrokeInk, StrokeNib, StrokeTip } from '../../types';
import type { InkPen } from '../InkStratum';
import { ERASER_ICON, TIP_ICONS } from './inkIcons';

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
  /** VISUAL 1a.3 - a Page in BUILD and EDIT only: the quiet door at Studio's foot, to this Doc's Board. Absent everywhere else. */
  onDrawOnBoard?: () => void;
  /** the sheet she is drawing on, so a chip shows the colour the stroke will have there (a dark sheet's default ink) */
  sheet?: () => Element | null;
}

type Row = 'brushes' | 'colour';
/** What a brush was last set to, this sitting. */
type BrushSet = Pick<InkPen, 'nib' | 'size' | 'alpha'>;
interface Sitting { studio: boolean; row: Row | null; recent: StrokeTip[]; byTip: Partial<Record<StrokeTip, BrushSet>>; lastHex: string | null }

let sitting: Sitting = { studio: false, row: null, recent: [], byTip: {}, lastHex: null };
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
const read = () => sitting;
const set = (next: Partial<Sitting>) => { sitting = { ...sitting, ...next }; listeners.forEach((fn) => fn()); };

const TIP_TERM: Record<StrokeTip, DeskTermId> = { pen: 'inkTipPen', pencil: 'inkTipPencil', marker: 'inkTipMarker' };
const NIB_TERM: Record<StrokeNib, DeskTermId> = { fine: 'inkNibFine', regular: 'inkNibRegular', broad: 'inkNibBroad' };
const INK_TERM: Record<StrokeInk, DeskTermId> = { walnut: 'inkWalnut', iron: 'inkIron', oxblood: 'inkOxblood', sea: 'inkSea' };

// any size: minus and plus step this ladder (it holds the nib widths); the Brushes row slides to any value between
const SIZE_STEPS = [0.5, 0.8, 1, 1.4, 2, 2.4, 3, 4, 5.4, 7, 8.6, 10, 12, 16, 20, 24, 32, 40];
const tenth = (n: number) => Math.round(n * 10) / 10;
const shown = (n: number) => Math.round(n * 100 + 0.001) / 100;   // the pencil's own 1.15 reads as 1.15

// a code as she types or pastes it: the field opens holding '#', so her own '#' (or none) is forgiven
const asCode = (v: string) => '#' + v.trim().replace(/#/g, '').slice(0, 6);

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
  const { studio, row, recent, byTip, lastHex } = useSyncExternalStore(subscribe, read, read);
  const [brushes, setBrushes] = useState(false);
  const [custom, setCustom] = useState(false);
  const [hex, setHex] = useState(lastHex ?? '#');
  const lineRef = useRef<HTMLDivElement>(null);
  const brushRef = useRef<HTMLButtonElement>(null);
  const { pen } = opts;
  const dark = darkSheetInk(opts.sheet?.() ?? null);
  const chip = (ink: StrokeInk) => (dark && ink === INKS[0] ? dark : `var(--ink-${ink})`);   // the chip and the stroke never disagree
  const list = brushList(pen.tip, recent);

  // each brush keeps its own size and see-through while she is here: the one in her hand is remembered as she leaves it, and the one she picks comes back as she left it
  const pickTip = (tip: StrokeTip) => {
    if (tip === pen.tip) { set({ recent: brushList(tip, list) }); return; }
    const mine: BrushSet = { nib: pen.nib, size: pen.size, alpha: pen.alpha };
    const theirs: BrushSet = byTip[tip] ?? { nib: pen.nib, size: undefined, alpha: undefined };
    set({ recent: brushList(tip, list), byTip: { ...byTip, [pen.tip]: mine } });
    opts.onPick({ tip, nib: theirs.nib, size: theirs.size, alpha: theirs.alpha });
  };
  const width = pen.size ?? nibWidth(pen.tip, pen.nib);
  const smaller = [...SIZE_STEPS].reverse().find((v) => v < width - 0.001);
  const larger = SIZE_STEPS.find((v) => v > width + 0.001);
  const setSize = (v: number) => opts.onPick({ size: tenth(v) });
  const clear = Math.round((1 - (pen.alpha ?? 1)) * 100);   // how see-through, in percent
  const pickInk = (ink: StrokeInk) => opts.onPick({ ink, hex: undefined });
  const pickHex = (value: string) => {
    if (!isHexColour(value)) return;
    const own = value.toUpperCase();
    set({ lastHex: own });
    opts.onPick({ hex: own });
  };

  // the short list closes on a press anywhere else
  useEffect(() => {
    if (!brushes) return;
    const away = (e: PointerEvent) => { if (!lineRef.current?.contains(e.target as Node)) setBrushes(false); };
    document.addEventListener('pointerdown', away, true);
    return () => document.removeEventListener('pointerdown', away, true);
  }, [brushes]);
  // Esc closes the list first and stops there: the drawer only closes on an Esc nothing inside handled (Sliver.tsx)
  const onEsc = (e: React.KeyboardEvent) => {
    if (e.key !== 'Escape' || (!brushes && !custom)) return;
    e.preventDefault();
    if (brushes) { setBrushes(false); brushRef.current?.focus(); } else setCustom(false);
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
            <button type="button" className="mode-tbtn wz-ink-size-down" aria-label={t('inkSizeSmaller')} title={t('inkSizeSmaller')} disabled={smaller === undefined} onClick={() => setSize(smaller!)}>&minus;</button>
            <span className="wz-ink-size-value" data-size={shown(width)} aria-live="polite">{shown(width)} pt</span>
            <button type="button" className="mode-tbtn wz-ink-size-up" aria-label={t('inkSizeLarger')} title={t('inkSizeLarger')} disabled={larger === undefined} onClick={() => setSize(larger!)}>+</button>
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
                className={`mode-swatch wz-ink-swatch${!pen.hex && pen.ink === ink ? ' active' : ''}`}
                style={{ background: chip(ink) }}
                aria-checked={!pen.hex && pen.ink === ink}
                aria-label={t(INK_TERM[ink])}
                title={t(INK_TERM[ink])}
                onClick={() => pickInk(ink)}
              />
            ))}
            {/* her last colour; before she has one it opens the picker in Studio */}
            <button
              type="button"
              role="radio"
              className={`mode-swatch wz-ink-last${pen.hex && pen.hex === lastHex ? ' active' : ''}`}
              style={lastHex ? { background: lastHex } : undefined}
              data-last={lastHex ?? ''}
              aria-checked={!!pen.hex && pen.hex === lastHex}
              aria-label={lastHex ? `${t('inkLastColour')} ${lastHex}` : t('inkLastColour')}
              title={t('inkLastColour')}
              onClick={() => { if (lastHex) opts.onPick({ hex: lastHex }); else { set({ studio: true, row: 'colour' }); setCustom(true); } }}
            />
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
              {ERASER_ICON}
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
              <label className="wz-ink-slide">
                <span className="wz-ink-slide-head"><span>{t('inkSize')}</span><span>{shown(width)} pt</span></span>
                <input type="range" className="wz-ink-size-slide" min={SIZE_MIN} max={SIZE_MAX} step={0.1} value={width} onChange={(e) => setSize(Number(e.target.value))} />
              </label>
              <div className="wz-ink-nibs" role="radiogroup" aria-label={t('inkNib')}>
                {NIBS.map((nib) => {
                  const on = pen.size === undefined && pen.nib === nib;
                  return (
                    <button key={nib} type="button" role="radio" className="mode-tbtn wz-ink-nib" aria-checked={on} data-on={on ? 'true' : 'false'} onClick={() => opts.onPick({ nib, size: undefined })}>
                      {t(NIB_TERM[nib])}
                    </button>
                  );
                })}
              </div>
              <label className="wz-ink-slide">
                <span className="wz-ink-slide-head"><span>{t('inkSeeThrough')}</span><span>{clear}%</span></span>
                <input type="range" className="wz-ink-clear-slide" min={0} max={90} step={5} value={clear} onChange={(e) => { const c = Number(e.target.value); opts.onPick({ alpha: c ? (100 - c) / 100 : undefined }); }} />
              </label>
            </div>
          )}

          {row === 'colour' && (
            <div className="wz-ink-row-body" data-ink-row-body="colour">
              <div className="wz-ink-colours" role="radiogroup" aria-label={t('inkRowColour')}>
                {INKS.map((ink) => (
                  <button key={ink} type="button" role="radio" className="wz-ink-colour" aria-checked={!pen.hex && pen.ink === ink} aria-label={t(INK_TERM[ink])} onClick={() => pickInk(ink)}>
                    <span className="wz-ink-colour-dot" style={{ background: chip(ink) }} aria-hidden="true" />
                    <span>{t(INK_TERM[ink])}</span>
                  </button>
                ))}
              </div>
              {/* any colour: the custom row of the reorg picker (reorg/ColourPicker.tsx) - the same field, preview, words and rule: any colour, no warning, no refusal */}
              {!custom
                ? <button type="button" className="reorg-colour-customize wz-ink-custom-open" data-colour-custom="" onClick={() => { setHex(pen.hex ?? lastHex ?? '#'); setCustom(true); }}>{t('reorgColourCustom')}</button>
                : (
                  <div className="reorg-colour-custom wz-ink-custom" data-colour-custom-row="">
                    <input className="reorg-colour-hex" data-colour-hex="" aria-label={t('reorgColourHex')} value={hex} maxLength={8} autoFocus onFocus={(e) => e.target.select()}
                      onChange={(e) => setHex(asCode(e.target.value))} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); pickHex(hex); } }} />
                    <span className="reorg-colour-preview" data-colour-preview="" aria-hidden="true"
                      style={isHexColour(hex) ? ({ ...customVars(hex.toUpperCase()), background: hex, color: inkOn(hex.toUpperCase()) } as React.CSSProperties) : undefined}>Aa</span>
                    <button type="button" className="reorg-colour-use" data-colour-use="" disabled={!isHexColour(hex)} onClick={() => pickHex(hex)}>{t('reorgColourUse')}</button>
                  </div>
                )}
            </div>
          )}

          {/* one quiet door at the foot (Nick, "as drawn"): the Board is the drawing room. It folds away with the rows */}
          {row === null && opts.onDrawOnBoard && (
            <button type="button" className="wz-ink-door" onClick={opts.onDrawOnBoard}>
              <span>{t('inkDrawOnBoard')}</span><span aria-hidden="true">&rarr;</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
