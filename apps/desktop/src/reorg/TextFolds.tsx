import { useState } from 'react';
import type { ReactNode } from 'react';
import { useDeskLexicon } from '../store/deskLexicon';

// THE TEXT TAB'S FOLDS (the Team B restyle, slice 5; Fable, Nov 20, 1:27 pm: "the TEXT tab's Paragraph ▸ and Insert Symbol ▸ folding"; the stage
// menus, draft 3: "Style: Bold · Italic · Underline · Strike (always shown). Paragraph ▸ (folded) ... More ▸ (folded): ... Insert Symbol ▸").
// Behind ?reorg=1 in Machina only (the Front menu's TEXT tab): with `on` false a fold draws its children as they stand today. Folded by default and
// not remembered. A press never takes the focus from the page (the rail's own rule), so her caret and selection stay where they were.

export function TextFold({ k, on, label, children }: { k: string; on: boolean; label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  if (!on) return <>{children}</>;
  return (
    <div className="reorg-text-fold" data-text-fold-wrap={k}>
      <button type="button" className="reorg-text-fold-btn" data-text-fold={k} aria-expanded={open ? 'true' : 'false'}
        onMouseDown={(e) => e.preventDefault()} onClick={() => setOpen((o) => !o)}>
        <span>{label}</span><span className="reorg-text-fold-mark" aria-hidden="true">{open ? '▾' : '▸'}</span>
      </button>
      <div className="reorg-text-fold-body" data-text-fold-body={k} hidden={!open}>{children}</div>
    </div>
  );
}

/** The stage menus' list, in its order. */
export const SYMBOLS = ['™', '©', '®', '—', '–', '§', '¶', '†', '‡', '•', '…', '°', '±', '×', '÷', '←', '→'] as const;

/** A symbol goes in at her caret the way a typed one does (the editor's own input path); with no caret in the page, nothing happens. */
function insertAtCaret(s: string): void {
  const ed = document.querySelector('.forward-only-editor');
  const sel = document.getSelection();
  if (!ed || !sel || !sel.anchorNode || !ed.contains(sel.anchorNode)) return;
  document.execCommand('insertText', false, s);
}

export function SymbolPicker() {
  const { t } = useDeskLexicon();
  return (
    <div className="wz-sliver-format reorg-text-symbols" onMouseDown={(e) => e.preventDefault()}>
      {SYMBOLS.map((s) => (
        <button key={s} type="button" className="mode-tbtn" data-symbol={s} aria-label={t('reorgTextSymbolAria').replace('{symbol}', s)} title={t('reorgTextSymbolAria').replace('{symbol}', s)}
          onClick={() => insertAtCaret(s)}>{s}</button>
      ))}
    </div>
  );
}
