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
import { useTheme } from '../store/theme';
import { useThemePrefs } from '../store/themePrefs';
import { ROSTER, faceStack, faceNameFromStack, themeDefaultFaceName, storedFaceFor, ensureFaceLoaded, faceForSlug, fontSlug, DEFAULT_FACE_NAME, type StoredFace } from '../store/fontRoster';
import { stepUp, stepDown, normalizeTypedSize, formatSize } from '../store/fontSize';

export interface TypeControlProps {
  form: 'small' | 'full';
  /** The face this surface has CHOSEN; undefined when it never chose (it then wears the everyday face). */
  face: StoredFace | undefined;
  /** The size in points in effect (11 when never chosen). */
  size: number;
  /** A roster face, or `undefined` for "Default" (TOOLS #10 item 10): the host CLEARS its stored face - no stored face = the theme's default, which is the rule that already existed. */
  onPickFace: (face: StoredFace | undefined) => void;
  onSize: (points: number) => void;
  /** FONT-SPAN (Nick approved the font-choices mockup, cursor/font-choices @ 6cc5f529): where words can be highlighted and given their
   *  own face (Draft, a card), the Typeface section carries the two scopes - "Selection" and "Whole document" ("Whole card") - over the
   *  roster shown as a list, the current face in brass. Absent (Free Write, Revise): today's face button. */
  scope?: TypeScope;
}

export interface TypeScope {
  /** Words are highlighted in this surface right now. */
  has: boolean;
  /** The highlight's face: a slug, null for the surface's own face, 'mixed' for more than one. */
  face: string | null | 'mixed';
  /** "Whole document" on a page, "Whole card" in a card. */
  wholeLabel: string;
  /** Give the highlighted words a face: a slug, or null for the surface's own face (their spans removed). One undo step. */
  onPickSelection: (slug: string | null) => void;
}

const DEFAULT_KEY = '\u0000default';   // the "Default (<face>)" row's key: not a face name

/** The face that ACTUALLY renders when nothing is chosen: the first family of the resolved `--font-prose` (voice dial and
 *  theme already applied), never the dial's own label - under the Chakra Petch voice this says Chakra Petch. */
function everydayFaceName(theme?: string, voice?: string): string {
  // TOOLS #10 item 10: the theme's own default first (a table that is checked against the CSS tokens) - "Default (<face>)" must always NAME the face; the DOM read is the fallback for a theme the table does not know.
  const themed = themeDefaultFaceName(theme, voice);
  if (themed) return themed;
  try { return faceNameFromStack(getComputedStyle(document.documentElement).getPropertyValue('--font-prose')) ?? DEFAULT_FACE_NAME; } catch { return DEFAULT_FACE_NAME; }
}

export function TypeControl({ form, face, size, onPickFace, onSize, scope }: TypeControlProps) {
  const { t } = useDeskLexicon();
  const [open, setOpen] = useState(false);
  // TOOLS #10 item 9: in the scoped form (Draft's drawer, a card's dock) the face list is COLLAPSED until the face button is pressed. The list stays mounted (hidden), so it is the same list either way.
  const [listOpen, setListOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const { voice } = useThemePrefs();   // the voice dial, from its store (never read off the document)
  const defaultName = everydayFaceName(theme, voice);
  const currentName = face?.name ?? defaultName;
  // Unchosen: the button wears whatever the page really wears (`--font-prose`), roster face or not.
  const currentStack = faceStack(face) ?? 'var(--font-prose)';
  const [draft, setDraft] = useState<string | null>(null);

  useEffect(() => {
    if (!open && !listOpen) return undefined;
    const close = () => { setOpen(false); setListOpen(false); };
    const onDown = (e: MouseEvent) => { if (rootRef.current && !rootRef.current.contains(e.target as Node)) close(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open, listOpen]);

  const keepFocus = (e: React.MouseEvent) => e.preventDefault();
  // FONT-SPAN: the scope. It FOLLOWS the highlight - a fresh highlight returns the choice to Selection - unless the writer tapped
  // Whole document while words were highlighted (the mockup's own rule). With nothing highlighted, Selection is dead: the pick is whole.
  const [wholeByHand, setWholeByHand] = useState(false);
  const had = useRef(false);
  useEffect(() => {
    const has = !!scope?.has;
    if (has && !had.current) setWholeByHand(false);
    had.current = has;
  }, [scope?.has]);
  const whole = !scope || !scope.has || wholeByHand;
  // the face in brass: the surface's own face for a whole pick; the highlight's face for a selection (none when it is mixed)
  // TOOLS #10 item 10: an UNCHOSEN surface marks the "Default (<face>)" row, never a roster row - the writer has not picked that face, the theme has. `brassKey` is the row in force: DEFAULT_KEY, a roster face's
  // name, or null (a mixed highlight); `brassName` is only the face button's label (the default's real name when nothing is chosen).
  const ownKey = face ? face.name : DEFAULT_KEY;
  const brassKey: string | null = !scope || whole ? ownKey
    : scope.face === 'mixed' ? null
      : scope.face === null ? ownKey
        : faceForSlug(scope.face).name;
  const brassName = brassKey === DEFAULT_KEY ? currentName : brassKey;
  // Default = clear. A whole pick clears the surface's stored face; a pick on a selection removes its span (the words fall back to the surface's own face).
  const pickDefault = () => { if (!scope || whole) onPickFace(undefined); else scope.onPickSelection(null); };
  const defaultRow = (current: boolean, onPick: () => void) => (
    <li key="__default" role="option" aria-selected={current} data-current={current ? 'true' : 'false'} data-default="true" className="wz-type-row" style={{ fontFamily: 'var(--font-prose)' }} onClick={onPick}>
      {t('typeFaceDefault').replace('{face}', defaultName)}
    </li>
  );
  const pickRow = (name: string) => {
    const f = ROSTER.find((x) => x.name === name);
    if (!f) return;
    void ensureFaceLoaded(f.name);
    if (!scope || whole) { onPickFace(storedFaceFor(f)); return; }
    scope.onPickSelection(f.name === currentName ? null : fontSlug(f.name));
  };
  const up = stepUp(size); const down = stepDown(size);
  const commitDraft = () => {
    if (draft === null) return;
    const n = normalizeTypedSize(draft);
    setDraft(null);                          // a refused entry snaps back to the previous value
    if (n !== null && n !== size) onSize(n);
  };

  return (
    <div className="wz-type" data-form={form} data-scoped={scope ? 'true' : undefined} role="group" aria-label={t('typeGroup')} ref={rootRef}>
      {scope && (
        <>
          <div className="wz-type-scopes" role="group" aria-label={t('typeScope')}>
            <button type="button" className="wz-type-scope" data-scope="selection" data-on={!whole ? 'true' : 'false'} aria-pressed={!whole}
              aria-disabled={!scope.has} onMouseDown={keepFocus} onClick={() => { if (scope.has) setWholeByHand(false); }}>{t('typeScopeSelection')}</button>
            <button type="button" className="wz-type-scope" data-scope="whole" data-on={whole ? 'true' : 'false'} aria-pressed={whole}
              onMouseDown={keepFocus} onClick={() => setWholeByHand(true)}>{scope.wholeLabel}</button>
          </div>
          <button
            type="button"
            className="wz-type-face"
            aria-haspopup="listbox"
            aria-expanded={listOpen}
            aria-label={`${t('typeFace')}: ${brassName ?? currentName}`}
            style={{ fontFamily: brassName ? (ROSTER.find((x) => x.name === brassName)?.stack ?? currentStack) : currentStack }}
            onMouseDown={keepFocus}
            onClick={() => setListOpen((o) => !o)}
          >{brassName ?? currentName}</button>
          <ul className="wz-type-list wz-type-list-inline" role="listbox" aria-label={t('typeFace')} hidden={!listOpen} onMouseDown={keepFocus}>
            {defaultRow(brassKey === DEFAULT_KEY, pickDefault)}
            {ROSTER.map((f) => (
              <li
                key={f.name}
                role="option"
                aria-selected={f.name === brassKey}
                data-current={f.name === brassKey ? 'true' : 'false'}
                className="wz-type-row"
                style={{ fontFamily: f.stack }}
                onClick={() => pickRow(f.name)}
              >{f.name}</li>
            ))}
          </ul>
        </>
      )}
      {!scope && <button
        type="button"
        className="wz-type-face"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${t('typeFace')}: ${currentName}`}
        style={{ fontFamily: currentStack }}
        onMouseDown={keepFocus}
        onClick={() => setOpen((o) => !o)}
      >{currentName}</button>}
      {!scope && open && (
        <ul className="wz-type-list" role="listbox" aria-label={t('typeFace')} onMouseDown={keepFocus}>
          {defaultRow(!face, () => { onPickFace(undefined); setOpen(false); })}
          {ROSTER.map((f) => (
            <li
              key={f.name}
              role="option"
              aria-selected={f.name === face?.name}
              data-current={f.name === face?.name ? 'true' : 'false'}
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
