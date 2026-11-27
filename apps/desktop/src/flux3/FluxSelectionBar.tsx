// #147 - THE SELECTION BAR (Nick, Nov 27: "the WordPress style B-I-U menu over the selected text"). Mounted only in Wire In. It stands over a selection inside her page and goes when the selection does. A press keeps her
// selection (no focus moves) and asks the editor to mark the words (ForwardOnlyEditor.tsx). It reads only the selection: nothing on the typing path beyond one check of whether anything is selected.
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDeskLexicon } from '../store/deskLexicon';
import { WIRE_FORMAT_EVENT } from './jackIn';

const W = 116, H = 36, GAP = 8;

export function FluxSelectionBar() {
  const { t } = useDeskLexicon();
  const [at, setAt] = useState<{ left: number; top: number } | null>(null);
  useEffect(() => {
    const place = () => {
      const sel = document.getSelection();
      let next: { left: number; top: number } | null = null;
      if (sel && !sel.isCollapsed && sel.rangeCount) {
        const range = sel.getRangeAt(0);
        const host = (range.commonAncestorContainer instanceof Element ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement)?.closest('.forward-only-editor');
        const box = host ? range.getBoundingClientRect() : null;
        if (box && box.width > 0) {
          const above = box.top - H - GAP;
          next = { left: Math.round(Math.max(8, Math.min(window.innerWidth - W - 8, box.left + box.width / 2 - W / 2))), top: Math.round(above >= 8 ? above : box.bottom + GAP) };
        }
      }
      setAt((was) => (was?.left === next?.left && was?.top === next?.top ? was : next));
    };
    document.addEventListener('selectionchange', place);
    window.addEventListener('resize', place);
    document.addEventListener('scroll', place, true);
    return () => { document.removeEventListener('selectionchange', place); window.removeEventListener('resize', place); document.removeEventListener('scroll', place, true); };
  }, []);
  if (!at || typeof document === 'undefined') return null;
  const press = (action: 'bold' | 'italic' | 'underline') => window.dispatchEvent(new CustomEvent(WIRE_FORMAT_EVENT, { detail: { action } }));
  return createPortal(
    <div className="flux3-selbar" data-flux-selbar="" role="toolbar" style={at} onMouseDown={(e) => e.preventDefault()}>
      <button type="button" data-format="bold" aria-label={t('stylingBold')} title={t('stylingBold')} onClick={() => press('bold')}><b>B</b></button>
      <button type="button" data-format="italic" aria-label={t('stylingItalic')} title={t('stylingItalic')} onClick={() => press('italic')}><i>I</i></button>
      <button type="button" data-format="underline" aria-label={t('stylingUnderline')} title={t('stylingUnderline')} onClick={() => press('underline')}><u>U</u></button>
    </div>,
    document.body,
  );
}
