import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDeskLexicon } from '../store/deskLexicon';
import { flushNow } from '../store/persistence';
import { PART_COLORS, isHexColour, isPartColor, setPartColor, type PartColor, type PartHex } from './parts';
import { SLOT_WORD, slotLetter } from './colourSlots';
import { SCHEMES, customVars, inkOn, setDocScheme, useDocScheme, type Scheme } from './colourScheme';
import { hasMadeDoc } from './docSettings';

// COLOUR B, THE PICKER (Nick, Nov 21 3:30 pm, via Fable 4:56 pm; the Wrizors' concept §2, part-colours-concept.md). It opens on a double-click of
// a Part's tile, or from "Colour…" in the Part's menu (the keyboard way): "Colour · {Part}"; SCHEME, Default · Muted · Vivid, with the line
// "Changes every Part's colours."; THIS PART, the six slots A-F (the chosen one ringed); "+ Custom…", a hex field and an "Aa" preview in the
// letter colour the app picks. ANY custom colour is kept (Nick: no refusal, no suggestion, no warning line); a colour under 3:1 on its panel
// draws a quiet-grey edge instead (colourScheme.ts edgeIn). Arrows move between the slots, Enter picks, Esc closes. A Part's colour is its slot
// or its own #RRGGBB, written through INK's setPartColor (pageSettings.color). The scheme is the DOC's (Nick, 4:53 pm: doc_settings.colourScheme,
// colourScheme.ts); a loose page has no Doc record, so it shows no SCHEME row and keeps Default.
// It is drawn into <body> over the drawer and the page (a tool overlays; nothing moves), and its keys stop at its own edge.

const WIDTH = 272;
const SCHEME_WORD: Record<Scheme, 'reorgSchemeDefault' | 'reorgSchemeMuted' | 'reorgSchemeVivid'> = { default: 'reorgSchemeDefault', muted: 'reorgSchemeMuted', vivid: 'reorgSchemeVivid' };
const fill = (s: string, vals: Record<string, string>): string => s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vals ? vals[k] : m));

export interface ColourPickerProps {
  partId: string;
  partName: string;
  current: PartColor | PartHex | null;
  at: { left: number; top: number };
  onClose: () => void;
}

export function ColourPicker({ partId, partName, current, at, onClose }: ColourPickerProps) {
  const { t } = useDeskLexicon();
  const scheme = useDocScheme(partId);
  const madeDoc = hasMadeDoc(partId);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const swatchRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const chosenIdx = isPartColor(current) ? PART_COLORS.indexOf(current) : -1;
  const [focusIdx, setFocusIdx] = useState(chosenIdx >= 0 ? chosenIdx : 0);
  const [custom, setCustom] = useState(isHexColour(current));
  const [hex, setHex] = useState<string>(isHexColour(current) ? current : '#');
  const [pos, setPos] = useState(at);

  // inside the window: the panel is placed at the tile and held within the window's edges
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const h = el.getBoundingClientRect().height;
    setPos({ left: Math.max(8, Math.min(at.left, window.innerWidth - WIDTH - 8)), top: Math.max(8, Math.min(at.top, window.innerHeight - h - 8)) });
  }, [at.left, at.top, custom]);
  useEffect(() => { swatchRefs.current[focusIdx]?.focus(); }, []);   // the keyboard lands on the chosen slot (or A)
  // a press outside the panel closes it
  useEffect(() => {
    const away = (e: PointerEvent) => { if (rootRef.current && !rootRef.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('pointerdown', away, true);
    return () => document.removeEventListener('pointerdown', away, true);
  }, [onClose]);

  const pick = (c: PartColor | PartHex | null) => { setPartColor(partId, c); flushNow(); onClose(); };
  const valid = isHexColour(hex);
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    e.nativeEvent.stopPropagation();
    if (e.key === 'Escape') { e.preventDefault(); onClose(); }
  };
  const onSwatchKey = (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const n = (i + step + PART_COLORS.length) % PART_COLORS.length;
    setFocusIdx(n);
    swatchRefs.current[n]?.focus();
  };
  const head = fill(t('reorgColourHead'), { part: partName });
  return createPortal(
    <div ref={rootRef} className="reorg-colour-picker" role="dialog" aria-label={head} data-colour-picker={partId} data-scheme={scheme}
      style={{ left: `${pos.left}px`, top: `${pos.top}px`, width: `${WIDTH}px` }} onKeyDown={onKeyDown}>
      <div className="reorg-colour-head">{head}</div>
      {madeDoc && <>
      <div className="reorg-colour-label">{t('reorgColourScheme')}</div>
      <div className="reorg-colour-schemes" role="radiogroup" aria-label={t('reorgColourScheme')}>
        {SCHEMES.map((s) => (
          <button key={s} type="button" role="radio" aria-checked={scheme === s} data-scheme-choice={s} className="reorg-colour-scheme" onClick={() => setDocScheme(partId, s)}>{t(SCHEME_WORD[s])}</button>
        ))}
      </div>
      <div className="reorg-colour-line">{t('reorgSchemeLine')}</div>
      </>}
      <div className="reorg-colour-label">{t('reorgColourThisPart')}</div>
      <div className="reorg-colour-swatches" role="radiogroup" aria-label={t('reorgColourThisPart')}>
        {PART_COLORS.map((c, i) => (
          <button key={c} ref={(el) => { swatchRefs.current[i] = el; }} type="button" role="radio" aria-checked={current === c} tabIndex={i === focusIdx ? 0 : -1}
            className="reorg-colour-swatch" data-colour={c} aria-label={t(SLOT_WORD[c])} title={t(SLOT_WORD[c])}
            onKeyDown={(e) => onSwatchKey(e, i)} onFocus={() => setFocusIdx(i)} onClick={() => pick(c)}>{slotLetter(c)}</button>
        ))}
      </div>
      {!custom
        ? <button type="button" className="reorg-colour-customize" data-colour-custom="" onClick={() => setCustom(true)}>{t('reorgColourCustom')}</button>
        : (
          <div className="reorg-colour-custom" data-colour-custom-row="">
            <input className="reorg-colour-hex" data-colour-hex="" aria-label={t('reorgColourHex')} value={hex} maxLength={7} spellCheck={false} autoFocus
              onChange={(e) => setHex(e.target.value.trim())} onKeyDown={(e) => { if (e.key === 'Enter' && valid) { e.preventDefault(); pick(hex); } }} />
            <span className="reorg-colour-preview" data-colour-preview="" aria-hidden="true"
              style={valid ? ({ ...customVars(hex.toUpperCase()), background: hex, color: inkOn(hex.toUpperCase()) } as React.CSSProperties) : undefined}>Aa</span>
            <button type="button" className="reorg-colour-use" data-colour-use="" disabled={!valid} onClick={() => { if (valid) pick(hex); }}>{t('reorgColourUse')}</button>
          </div>
        )}
      <button type="button" className="reorg-colour-none" data-colour-none="" onClick={() => pick(null)}>{t('reorgPartColourNone')}</button>
    </div>,
    document.body,
  );
}
