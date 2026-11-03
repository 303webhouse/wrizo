// the type control: the fewest controls that do the act, the name in the aria-label; every form is a face button and - [ number ] +, the number typeable; choosing is the preview; - + are inert at the ends, never removed; mousedown preventDefault keeps the caret [TypeControl §1]
import { useEffect, useRef, useState } from 'react';
import { useDeskLexicon } from '../store/deskLexicon';
import { useTheme } from '../store/theme';
import { useThemePrefs } from '../store/themePrefs';
import { useInstalledFonts, addInstalledFont, queryLocalFamilies, fontIsAvailable } from '../store/installedFonts';
import { ROSTER, faceStack, faceNameFromStack, themeDefaultFaceName, deviceFace, storedFaceFor, ensureFaceLoaded, faceForSlug, fontSlug, DEFAULT_FACE_NAME, type StoredFace } from '../store/fontRoster';
import { stepUp, stepDown, normalizeTypedSize, formatSize } from '../store/fontSize';
import { isArbor2 } from '../arbor2/flag';

export interface TypeControlProps {
  form: 'small' | 'full';
  /** The face this surface has CHOSEN; undefined when it never chose (it then wears the everyday face). */
  face: StoredFace | undefined;
  /** The size in points in effect (11 when never chosen). */
  size: number;
  // a roster face, or `undefined` for Default: the host clears its stored face (no stored face = the theme's default) [TypeControl §2]
  onPickFace: (face: StoredFace | undefined) => void;
  onSize: (points: number) => void;
  // where words can be highlighted (Draft, a card) the Typeface section carries the two scopes over the roster as a list; absent (Free Write, Revise): the face button [TypeControl §3]
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
  // the highlight's size and the road that sizes only the highlighted words (one undo step), so - [N] + follow the scope as the face list does [TypeControl §4]
  size?: number | null | 'mixed';
  onSizeSelection?: (points: number) => void;
  /** TOOLS #14-r2: the number box takes the keyboard focus, and focus in a text field moves the page's selection into the field - so the highlight is HELD while the box has focus: `holdSelection` records the
   *  highlighted offsets (true when there were some), `releaseSelection` lets them go, and `onSizeSelection` sizes the held words. Without these a typed size lost its highlight and sized the whole page. */
  holdSelection?: () => boolean;
  releaseSelection?: () => void;
}

const DEFAULT_KEY = '\u0000default';   // the "Default (<face>)" row's key: not a face name

/** The face that ACTUALLY renders when nothing is chosen: the first family of the resolved `--font-prose` (voice dial and
 *  theme already applied), never the dial's own label - under the Chakra Petch voice this says Chakra Petch. */
function everydayFaceName(theme?: string, voice?: string): string {
  // the theme's own default first (a table checked against the CSS tokens), so "Default (<face>)" always names the face; the DOM read is the fallback [TypeControl §5]
  const themed = themeDefaultFaceName(theme, voice);
  if (themed) return themed;
  try { return faceNameFromStack(getComputedStyle(document.documentElement).getPropertyValue('--font-prose')) ?? DEFAULT_FACE_NAME; } catch { return DEFAULT_FACE_NAME; }
}

export function TypeControl({ form, face, size, onPickFace, onSize, scope }: TypeControlProps) {
  const { t } = useDeskLexicon();
  const [open, setOpen] = useState(false);
  // in the scoped form the face list is collapsed until the face button is pressed; it stays mounted (hidden), so it is the same list either way [TypeControl §6]
  const [listOpen, setListOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const { voice } = useThemePrefs();   // the voice dial, from its store (never read off the document)
  const defaultName = everydayFaceName(theme, voice);
  const currentName = face?.name ?? defaultName;
  // Unchosen: the button wears whatever the page really wears (`--font-prose`), roster face or not.
  const currentStack = faceStack(face) ?? 'var(--font-prose)';
  const [draft, setDraftState] = useState<string | null>(null);
  // TOOLS #14-r2: the draft is also kept in a ref so a commit is ONE-SHOT - Enter commits and then blurs the box, and the blur's own commit ran in the same tick on the stale state, applying the size a second time
  const draftRef = useRef<string | null>(null);
  const setDraft = (v: string | null) => { draftRef.current = v; setDraftState(v); };

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
  // TOOLS #14-r2: while the number box has focus the highlight is HELD (the page's own selection has moved into the field) - the scope, and the size the box shows, stay the highlight's
  const [held, setHeld] = useState<{ size: number | null | 'mixed' | undefined } | null>(null);
  const hasNow = !!scope?.has || held !== null;
  const whole = !scope || !hasNow || wholeByHand;
  // the face in brass: an unchosen surface marks the "Default (<face>)" row, never a roster row (the theme picked it, not the writer) [TypeControl §7]
  const ownKey = face ? face.name : DEFAULT_KEY;
  const brassKey: string | null = !scope || whole ? ownKey
    : scope.face === 'mixed' ? null
      : scope.face === null ? ownKey
        : faceForSlug(scope.face).name;
  const brassName = brassKey === DEFAULT_KEY ? currentName : brassKey;
  // Default = clear. A whole pick clears the surface's stored face; a pick on a selection removes its span (the words fall back to the surface's own face).
  const pickDefault = () => { if (!scope || whole) onPickFace(undefined); else scope.onPickSelection(null); };
  const defaultLabel = t('typeFaceDefault').replace('{face}', defaultName);
  const defaultRow = (current: boolean, onPick: () => void) => (
    <li key="__default" role="option" aria-selected={current} data-current={current ? 'true' : 'false'} data-default="true" className="wz-type-row" style={{ fontFamily: 'var(--font-prose)' }} title={defaultLabel} aria-label={defaultLabel} onClick={onPick}>
      {defaultLabel}
    </li>
  );
  const pickRow = (name: string) => {
    const f = ROSTER.find((x) => x.name === name);
    if (!f) return;
    void ensureFaceLoaded(f.name);
    if (!scope || whole) { onPickFace(storedFaceFor(f)); return; }
    scope.onPickSelection(f.name === currentName ? null : fontSlug(f.name));
  };
  // the writer's installed fonts (device-local) follow the roster in both lists; a face not installed here shows a quiet note and renders as the default; "Add a font..." only in the scoped form [TypeControl §8]
  const installed = useInstalledFonts();
  const deviceNames = [...installed, ...(face?.source === 'device' && !installed.some((n) => n.toLowerCase() === face.name.toLowerCase()) ? [face.name] : [])];
  const [adding, setAdding] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [lookup, setLookup] = useState<string[]>([]);
  const canLookup = typeof window !== 'undefined' && typeof (window as unknown as { queryLocalFonts?: unknown }).queryLocalFonts === 'function';
  const pickDevice = (name: string) => {
    if (!scope || whole) { onPickFace(deviceFace(name)); return; }
    scope.onPickSelection(name === currentName ? null : fontSlug(name));
  };
  const submitAdd = () => {
    const n = addInstalledFont(draftName);
    if (!n) return;
    setDraftName(''); setAdding(false);
    pickDevice(n);
  };
  const deviceRows = (isCurrent: (name: string) => boolean, onPick: (name: string) => void) => deviceNames.map((name) => {
    const missing = !fontIsAvailable(name);
    return (
      <li key={`device:${name}`} role="option" aria-selected={isCurrent(name)} data-current={isCurrent(name) ? 'true' : 'false'} data-device="true" data-missing={missing ? 'true' : undefined}
        className="wz-type-row" style={{ fontFamily: faceStack(deviceFace(name)) }} onClick={() => onPick(name)}>
        {name}{missing && <span className="wz-type-note">{t('typeFaceMissing')}</span>}
      </li>
    );
  });
  const addRow = () => (adding ? (
    <li key="__add" className="wz-type-addform" onMouseDown={(e) => e.stopPropagation()}>
      <input className="wz-type-addinput" type="text" list="wz-type-local-fonts" placeholder={t('typeAddFontName')} aria-label={t('typeAddFontName')} autoFocus value={draftName}
        onChange={(e) => setDraftName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitAdd(); } else if (e.key === 'Escape') { e.stopPropagation(); setAdding(false); } }} />
      <datalist id="wz-type-local-fonts">{lookup.map((n) => <option key={n} value={n} />)}</datalist>
      <button type="button" className="wz-type-addgo" onClick={submitAdd}>{t('typeAddFontAdd')}</button>
      {canLookup && <button type="button" className="wz-type-addlookup" onClick={() => { void queryLocalFamilies().then((names) => { if (names) setLookup(names); }); }}>{t('typeAddFontLookup')}</button>}
    </li>
  ) : (
    <li key="__add" role="option" aria-selected={false} className="wz-type-add" data-add-font="true" onClick={() => setAdding(true)}>{t('typeAddFont')}</li>
  ));
  // under Selection the size is the highlight's and a step sizes only the highlighted words; under Whole document it is the surface's [TypeControl §9]
  const heldSize = held ? held.size : scope?.size;
  const selSize = scope && !whole && scope.onSizeSelection ? (typeof heldSize === 'number' ? heldSize : size) : null;
  const shownSize = selSize ?? size;
  const sizeTo = (n: number) => { if (selSize !== null && scope?.onSizeSelection) scope.onSizeSelection(n); else onSize(n); };
  const up = stepUp(shownSize); const down = stepDown(shownSize);
  const holdBox = () => { if (held || !scope?.has || !scope.holdSelection) return; if (scope.holdSelection()) setHeld({ size: scope.size }); };
  // ARBOR v2 MOCKUP r17 (Fable, Nov 2, Nick: "the font-size box: an editable number box between - and + ... Whole numbers 6-72; Enter or blur applies;
  // a bad value reverts; default 11; the same scope as -/+"). Under the mockup's flag the box takes only a whole number from 6 to 72; anything else - a
  // half point, 5, 73, a word - snaps back to the size in effect. It applies through sizeTo, the very road - and + take. (r20: rebased onto main's
  // size box - held selection, draftRef - which draws the box in every form, so the mockup's own form condition retired with it.)
  const mockBox = isArbor2() && theme === 'plateau';
  const strictSize = (raw: string): number | null => { const t = raw.trim(); if (!/^\d{1,2}$/.test(t)) return null; const n = Number(t); return n >= 6 && n <= 72 ? n : null; };
  // (r17 fix after the green look 41572170258: with words highlighted, pressing into the box moved the page's selection into the box, so the
  // highlighted-words road found no range and did nothing. Under the flag the box keeps the highlight it was opened on and gives it back before
  // sizing, so it sizes those words, as - and + do. r20: kept on top of main's own hold after the rebase - main's holdBox alone did not size them
  // under a mockup flag (Machina's twin, gm10 run 41922077883).)
  const keptRange = useRef<Range | null>(null);
  const lastHighlight = useRef<Range | null>(null);
  useEffect(() => {
    if (!mockBox) return undefined;
    const onSel = () => { const sel = window.getSelection(); if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return; const r = sel.getRangeAt(0); if (rootRef.current && rootRef.current.contains(r.commonAncestorContainer)) return; lastHighlight.current = r.cloneRange(); };
    document.addEventListener('selectionchange', onSel);
    return () => document.removeEventListener('selectionchange', onSel);
  }, [mockBox]);
  const holdHighlight = () => {
    if (!mockBox || selSize === null) { keptRange.current = null; return; }
    const sel = window.getSelection();
    const live = sel && sel.rangeCount > 0 && !sel.isCollapsed && !(rootRef.current && rootRef.current.contains(sel.getRangeAt(0).commonAncestorContainer)) ? sel.getRangeAt(0).cloneRange() : null;
    keptRange.current = live ?? lastHighlight.current;
  };
  const commitDraft = () => {
    const typed = draftRef.current;
    if (typed === null) return;
    const n = mockBox ? strictSize(typed) : normalizeTypedSize(typed);
    setDraft(null);                          // a refused entry snaps back to the previous value
    const kept = keptRange.current; keptRange.current = null;
    if (n !== null && mockBox && kept && scope?.onSizeSelection) {
      // the page first takes the focus back, THEN the highlight is put back, then only those words are sized
      const startEl = kept.startContainer.nodeType === 1 ? (kept.startContainer as Element) : kept.startContainer.parentElement;
      (startEl?.closest('[contenteditable="true"]') as HTMLElement | null)?.focus({ preventScroll: true });
      const sel = window.getSelection(); sel?.removeAllRanges(); sel?.addRange(kept);
      scope.onSizeSelection(n);
      return;
    }
    if (n !== null && n !== shownSize) sizeTo(n);
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
            {deviceRows((n) => n === brassKey, pickDevice)}
            {addRow()}
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
          {deviceRows((n) => face?.source === 'device' && face.name === n, (n) => { onPickFace(deviceFace(n)); setOpen(false); })}
        </ul>
      )}
      <div className="wz-type-size">
        <button type="button" className="mode-tbtn wz-type-step" aria-label={t('typeSmaller')} aria-disabled={down === null} onMouseDown={keepFocus} onClick={() => { if (down !== null) sizeTo(down); }}>{'−'}</button>
        <input
          className="wz-type-num"
          type="text"
          inputMode="decimal"
          aria-label={t('typeSize')}
          value={draft ?? formatSize(shownSize)}
          onChange={(e) => setDraft(e.target.value)}
          onMouseDownCapture={() => { holdHighlight(); holdBox(); }}
          onFocus={() => { holdHighlight(); holdBox(); }}
          onBlur={() => { commitDraft(); if (held) { setHeld(null); scope?.releaseSelection?.(); } }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitDraft(); (e.target as HTMLInputElement).blur(); } else if (e.key === 'Escape') setDraft(null); }}
        />
        <button type="button" className="mode-tbtn wz-type-step" aria-label={t('typeLarger')} aria-disabled={up === null} onMouseDown={keepFocus} onClick={() => { if (up !== null) sizeTo(up); }}>+</button>
      </div>
    </div>
  );
}
