// ITEM 207 (207a step 4, 207b device fonts) — THE TYPE CONTROL: face and size. ONE component, in the smallest form that does the act.
//
// HIS LAW (Nick, 2026-09-24): "the interface should be as minimal as possible (same goes for all strip menus)."
// Made concrete here, and assertable (item207.mjs counts these): a strip menu carries the fewest controls that do the
// act, each with the fewest marks; no captions, no helper text, no second row - a control's name lives in its
// aria-label. So:
//   form 'small'  (Free Write's strip, a card's strip)   ONE face button + a `-` `+` pair. NO number. NO add door.
//   form 'full'   (Draft and Revise's drawer)            the face button + `-` [ number ] `+`, the number typeable, and the
//                                                         roster's LAST row, "Add a font…" (207b) - only here, and only where
//                                                         the browser can do it (Local Font Access; absent, never greyed).
//
// The face button shows the CURRENT face's name in its own face. It opens the roster as a listbox, each row set in its own
// face, the current one marked olive (where you are). The roster is the nine bundled faces plus every font the writer has
// ADDED ON THIS DEVICE (store/deviceFonts.ts) - Free Write shows the same list, minus the door (his Q2). CHOOSING IS THE
// PREVIEW (RV4: live on the paper, no Apply, no hover preview); reverting is choosing the previous one.
//
// "Add a font…" DRILLS IN, inside the same listbox (166's R2: never a second panel), to the families installed on this device,
// each set in its own face. Nothing is enumerated until that click, and the browser's permission is asked then, never on load.
// Picking one measures its class (serif / sans-serif / monospace - store/fontDetect.ts), adds it to this device's library and
// sets it on the page. A refusal is one plain sentence in the list; nothing else changes. Escape steps back, then closes.
//
// A page dressed in a `device` face this device lacks renders the fallback in that face's class and says so QUIETLY, inside the
// button: `data-substituted` (a dimmed italic), the sentence in its title and accessible name. No toast, no extra element.
//
// `+`/`-` step the ladder (store/fontSize.ts) and are INERT at the ends - aria-disabled, never removed. The number commits on
// Enter or blur; anything that is not a number is refused and the previous value is kept. Buttons preventDefault on mousedown
// so pressing one never steals the caret from a writing surface.
import { useEffect, useRef, useState } from 'react';
import { useDeskLexicon } from '../store/deskLexicon';
import { ROSTER, faceStack, faceNameFromStack, storedFaceFor, ensureFaceLoaded, DEFAULT_FACE_NAME, type StoredFace } from '../store/fontRoster';
import { stepUp, stepDown, normalizeTypedSize, formatSize } from '../store/fontSize';
import { getDeviceFonts, addDeviceFont, subscribeDeviceFonts, storedFaceForDevice, localFontsSupported, listInstalledFamilies, type DeviceFont } from '../store/deviceFonts';
import { isFontAvailable, classifyGeneric } from '../store/fontDetect';

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
  const [view, setView] = useState<'roster' | 'add'>('roster');
  const [installed, setInstalled] = useState<string[] | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [library, setLibrary] = useState<DeviceFont[]>(() => getDeviceFonts());
  const rootRef = useRef<HTMLDivElement>(null);
  const currentName = face?.name ?? everydayFaceName();
  // Unchosen: the button wears whatever the page really wears (`--font-prose`), roster face or not.
  const currentStack = faceStack(face) ?? 'var(--font-prose)';
  const [draft, setDraft] = useState<string | null>(null);
  const canAdd = form === 'full' && localFontsSupported();
  // A device face this device lacks: quietly marked, never a toast.
  const substituted = !!face && face.source === 'device' && !isFontAvailable(face.name);

  useEffect(() => subscribeDeviceFonts(() => setLibrary(getDeviceFonts())), []);
  const close = () => { setOpen(false); setView('roster'); setInstalled(null); setAddError(null); };

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: MouseEvent) => { if (rootRef.current && !rootRef.current.contains(e.target as Node)) close(); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (view === 'add') { setView('roster'); setInstalled(null); setAddError(null); } else close();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open, view]);

  const keepFocus = (e: React.MouseEvent) => e.preventDefault();
  const up = stepUp(size); const down = stepDown(size);
  const commitDraft = () => {
    if (draft === null) return;
    const n = normalizeTypedSize(draft);
    setDraft(null);                          // a refused entry snaps back to the previous value
    if (n !== null && n !== size) onSize(n);
  };
  const openAdd = async () => {              // the writer's own click: the only place fonts are enumerated
    setView('add'); setInstalled(null); setAddError(null);
    const r = await listInstalledFamilies();
    if (r.ok) setInstalled(r.families); else { setInstalled([]); setAddError(t('typeAddDenied')); }
  };
  const pickInstalled = (name: string) => {
    const f = addDeviceFont(name, classifyGeneric(name));
    if (f) onPickFace(storedFaceForDevice(f));
    close();
  };
  const label = `${t('typeFace')}: ${currentName}${substituted ? ` — ${t('typeSubstituted')}` : ''}`;

  return (
    <div className="wz-type" data-form={form} role="group" aria-label={t('typeGroup')} ref={rootRef}>
      <button
        type="button"
        className="wz-type-face"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        title={substituted ? t('typeSubstituted') : undefined}
        data-substituted={substituted ? 'true' : undefined}
        style={{ fontFamily: currentStack }}
        onMouseDown={keepFocus}
        onClick={() => { if (open) close(); else setOpen(true); }}
      >{currentName}</button>
      {open && view === 'roster' && (
        <ul className="wz-type-list" role="listbox" aria-label={t('typeFace')} onMouseDown={keepFocus}>
          {ROSTER.map((f) => (
            <li
              key={f.name}
              role="option"
              aria-selected={f.name === currentName}
              data-current={f.name === currentName ? 'true' : 'false'}
              className="wz-type-row"
              style={{ fontFamily: f.stack }}
              onClick={() => { void ensureFaceLoaded(f.name); onPickFace(storedFaceFor(f)); close(); }}
            >{f.name}</li>
          ))}
          {library.filter((d) => !ROSTER.some((f) => f.name === d.name)).map((d) => (
            <li
              key={`device:${d.name}`}
              role="option"
              aria-selected={d.name === currentName}
              data-current={d.name === currentName ? 'true' : 'false'}
              className="wz-type-row"
              style={{ fontFamily: faceStack(storedFaceForDevice(d)) }}
              onClick={() => { onPickFace(storedFaceForDevice(d)); close(); }}
            >{d.name}</li>
          ))}
          {canAdd && (
            <li role="option" aria-selected={false} className="wz-type-row wz-type-door" onClick={() => { void openAdd(); }}>{t('typeAddFont')}</li>
          )}
        </ul>
      )}
      {open && view === 'add' && (
        <ul className="wz-type-list wz-type-list--add" role="listbox" aria-label={t('typeAddFont')} onMouseDown={keepFocus}>
          {addError && <li role="status" className="wz-type-row wz-type-note">{addError}</li>}
          {(installed ?? []).map((name) => (
            <li
              key={name}
              role="option"
              aria-selected={false}
              className="wz-type-row"
              style={{ fontFamily: `'${name.replace(/['\\]/g, '')}'` }}
              onClick={() => pickInstalled(name)}
            >{name}</li>
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
