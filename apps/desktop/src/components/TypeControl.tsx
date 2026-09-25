// ITEM 207 (207a step 4) — THE TYPE CONTROL: face and size. ONE component, in the smallest form that does the act.
//
// HIS LAW (Nick, 2026-09-24): "the interface should be as minimal as possible (same goes for all strip menus)."
// Made concrete here, and assertable (item207.mjs counts these): a strip menu carries the fewest controls that do the
// act, each with the fewest marks; no captions, no helper text, no second row - a control's name lives in its
// aria-label. So:
//   form 'small'  (Free Write's strip, a card's strip)   ONE face button + a `-` `+` pair. NO number.
//   form 'full'   (Draft and Revise's drawer)            the face button + `-` [ number ] `+`, the number typeable.
// No "Add a font..." row exists in this component: it arrives with Route A (207b), and an offered door with nothing
// behind it is a mute grey. Free Write never gets it either (Nick's Q2).
//
// The face button shows the CURRENT face's name in its own face. It opens the roster as a listbox, each row set in its
// own face, the current one marked olive (where you are). CHOOSING IS THE PREVIEW (RV4: live on the paper, no Apply,
// no hover preview); reverting is choosing the previous one. `+`/`-` step the ladder (store/fontSize.ts) and are INERT
// at the ends - aria-disabled, never removed (a limit, not an unbuilt capability). The number commits on Enter or blur;
// anything that is not a number is refused and the previous value is kept.
//
// Buttons preventDefault on mousedown so pressing one never steals the caret from a writing surface.
import { useEffect, useRef, useState } from 'react';
import { useDeskLexicon } from '../store/deskLexicon';
import { ROSTER, faceStack, faceNameFromStack, storedFaceFor, ensureFaceLoaded, DEFAULT_FACE_NAME, type StoredFace } from '../store/fontRoster';
import { stepUp, stepDown, normalizeTypedSize, formatSize } from '../store/fontSize';

export interface TypeControlProps {
  form: 'small' | 'full';
  /** The face this surface has CHOSEN; undefined when it never chose (it then wears the everyday face). */
  face: StoredFace | undefined;
  /** The size in points in effect (11 when never chosen). */
  size: number;
  onPickFace: (face: StoredFace) => void;
  onSize: (points: number) => void;
}

/** The face that ACTUALLY renders when nothing is chosen: the first family of the resolved `--font-prose` (voice dial and
 *  theme already applied), never the dial's own label - under the Chakra Petch voice this says Chakra Petch. */
function everydayFaceName(): string {
  try { return faceNameFromStack(getComputedStyle(document.documentElement).getPropertyValue('--font-prose')) ?? DEFAULT_FACE_NAME; } catch { return DEFAULT_FACE_NAME; }
}

export function TypeControl({ form, face, size, onPickFace, onSize }: TypeControlProps) {
  const { t } = useDeskLexicon();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const currentName = face?.name ?? everydayFaceName();
  // Unchosen: the button wears whatever the page really wears (`--font-prose`), roster face or not.
  const currentStack = faceStack(face) ?? 'var(--font-prose)';
  const [draft, setDraft] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: MouseEvent) => { if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const keepFocus = (e: React.MouseEvent) => e.preventDefault();
  const up = stepUp(size); const down = stepDown(size);
  const commitDraft = () => {
    if (draft === null) return;
    const n = normalizeTypedSize(draft);
    setDraft(null);                          // a refused entry snaps back to the previous value
    if (n !== null && n !== size) onSize(n);
  };

  return (
    <div className="wz-type" data-form={form} role="group" aria-label={t('typeGroup')} ref={rootRef}>
      <button
        type="button"
        className="wz-type-face"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${t('typeFace')}: ${currentName}`}
        style={{ fontFamily: currentStack }}
        onMouseDown={keepFocus}
        onClick={() => setOpen((o) => !o)}
      >{currentName}</button>
      {open && (
        <ul className="wz-type-list" role="listbox" aria-label={t('typeFace')} onMouseDown={keepFocus}>
          {ROSTER.map((f) => (
            <li
              key={f.name}
              role="option"
              aria-selected={f.name === currentName}
              data-current={f.name === currentName ? 'true' : 'false'}
              className="wz-type-row"
              style={{ fontFamily: f.stack }}
              onClick={() => { void ensureFaceLoaded(f.name); onPickFace(storedFaceFor(f)); setOpen(false); }}
            >{f.name}</li>
          ))}
        </ul>
      )}
      <div className="wz-type-size">
        <button type="button" className="mode-tbtn wz-type-step" aria-label={t('typeSmaller')} aria-disabled={down === null} onMouseDown={keepFocus} onClick={() => { if (down !== null) onSize(down); }}>{'−'}</button>
        {form === 'full' && (
          <input
            className="wz-type-num"
            type="text"
            inputMode="decimal"
            aria-label={t('typeSize')}
            value={draft ?? formatSize(size)}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitDraft}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitDraft(); (e.target as HTMLInputElement).blur(); } else if (e.key === 'Escape') setDraft(null); }}
          />
        )}
        <button type="button" className="mode-tbtn wz-type-step" aria-label={t('typeLarger')} aria-disabled={up === null} onMouseDown={keepFocus} onClick={() => { if (up !== null) onSize(up); }}>+</button>
      </div>
    </div>
  );
}
