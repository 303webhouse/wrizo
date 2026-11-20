import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { JournalEntry, StyleGuide } from '../types';
import { STYLE_GUIDE_DEFAULT } from '../types';
import { useDeskLexicon } from '../store/deskLexicon';
import { flushNow } from '../store/persistence';
import { ensureDoc, newPart } from './parts';
import { PageSetupZone } from '../components/cascade/PagePanel';

// THE DOC'S KIND AT THE HEAD OF THE PARTS TAB (the Team B restyle, slice 2; Nick, Nov 20, 1A: "the head of the Front menu's PARTS tab shows the
// Doc's kind ... the head is a toggle menu"; Decision 1: Research is a Standard Doc with a preset, so the kinds today are Standard and Screenplay;
// the stage menus, draft 3: "At the head in BUILD and EDIT: the Doc's kind. It opens Style Guide (MLA · APA · Chicago · AP), Presets, Page Setup
// and Special Parts"; Fable's cut: "its menu holds what exists today"). Every act is one that exists: the style guide is the page's own setting
// through the host's act (the Front menu's); Page Setup is today's zone; a Special Part is INK's newPart with today's template, in its place (a
// Title Page first, a Bibliography last); Presets are today's templates for the Part she is on. The menu drops down inside the drawer: the page
// never moves. Escape closes it and gives the focus back; a press outside closes it.

export interface DocMenuHost {
  styleGuide?: StyleGuide;
  onPickStyleGuide?: (next: StyleGuide) => void;
  templates?: { key: string; label: string; selected?: boolean; onApply: () => void }[];
}
type Item = 'style' | 'setup' | 'special' | 'presets';
const GUIDES: readonly StyleGuide[] = ['mla', 'apa', 'chicago', 'ap'];
const GUIDE_WORD = { mla: 'styleGuideMla', apa: 'styleGuideApa', chicago: 'styleGuideChicago', ap: 'styleGuideAp' } as const;

export function DocKindMenu({ entry, docId, host, beforeWrite }: { entry: JournalEntry; docId: string | null; host?: DocMenuHost; beforeWrite: () => void }) {
  const { t } = useDeskLexicon();
  const [open, setOpen] = useState(false);
  const [sub, setSub] = useState<Item | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const screenplay = entry.pageType === 'script' || entry.pageSettings?.kind === 'screenplay';
  const kindWord = t(screenplay ? 'reorgDocKindScreenplay' : 'reorgDocKindStandard');
  const close = (focus: boolean) => { setOpen(false); setSub(null); if (focus) toggle.current?.focus(); };

  useEffect(() => {
    if (!open) return;
    const press = (e: PointerEvent) => { if (wrap.current && !wrap.current.contains(e.target as Node)) { setOpen(false); setSub(null); } };
    document.addEventListener('pointerdown', press, true);
    return () => document.removeEventListener('pointerdown', press, true);
  }, [open]);

  const items: Item[] = [
    ...(!screenplay && host?.onPickStyleGuide ? ['style' as const] : []),
    'setup',
    ...(!screenplay ? ['special' as const] : []),
    ...(host?.templates && host.templates.length ? ['presets' as const] : []),
  ];
  const WORD: Record<Item, Parameters<typeof t>[0]> = { style: 'reorgDocStyleGuide', setup: 'reorgDocPageSetup', special: 'reorgDocSpecialParts', presets: 'reorgDocPresets' };
  const guide = host?.styleGuide ?? STYLE_GUIDE_DEFAULT;

  // a Special Part: INK's newPart with today's template, a Title Page first and a Bibliography last; a page no Doc holds yet becomes its own Doc first
  const special = (kind: 'title' | 'bibliography') => {
    beforeWrite();
    let into = docId;
    if (!into) { const r = ensureDoc(entry.id); if (!r.ok) { close(true); return; } into = r.docId; }
    newPart(into, kind === 'title'
      ? { afterId: null, template: 'title', name: t('reorgSpecialTitle') }
      : { template: 'bibliography', name: t('reorgSpecialBibliography') });
    flushNow();
    close(true);
  };

  const onKey = (e: ReactKeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); } };
  return (
    <div className="reorg-dockind" ref={wrap} onKeyDown={onKey}>
      <button type="button" ref={toggle} className="reorg-dockind-btn" data-doc-kind="" aria-haspopup="true" aria-expanded={open ? 'true' : 'false'}
        aria-label={t('reorgDocKindAria').replace('{kind}', kindWord)} onClick={() => { setOpen((o) => !o); setSub(null); }}>
        <span>{kindWord}</span><span className="reorg-dockind-caret" aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="reorg-dockind-menu" data-doc-menu="" role="group" aria-label={kindWord}>
          {items.map((it, i) => (
            <div key={it} className="reorg-dockind-item">
              <button type="button" data-doc-menu-item={it} aria-expanded={sub === it ? 'true' : 'false'} autoFocus={i === 0}
                onClick={() => setSub((s) => (s === it ? null : it))}>
                <span>{t(WORD[it])}</span><span className="reorg-dockind-fold" aria-hidden="true">▸</span>
              </button>
              {sub === it && it === 'style' && (
                <div className="reorg-dockind-sub" data-doc-sub="style" role="radiogroup" aria-label={t('reorgDocStyleGuide')}>
                  {GUIDES.map((g) => (
                    <button key={g} type="button" role="radio" data-style-pick={g} aria-checked={guide === g ? 'true' : 'false'}
                      onClick={() => { host?.onPickStyleGuide?.(g); close(true); }}>{t(GUIDE_WORD[g])}</button>
                  ))}
                </div>
              )}
              {sub === it && it === 'setup' && (
                <div className="reorg-dockind-sub reorg-dockind-setup" data-doc-sub="setup"><PageSetupZone entry={entry} /></div>
              )}
              {sub === it && it === 'special' && (
                <div className="reorg-dockind-sub" data-doc-sub="special">
                  <button type="button" data-special-pick="title" onClick={() => special('title')}>{t('reorgSpecialTitle')}</button>
                  <button type="button" data-special-pick="bibliography" onClick={() => special('bibliography')}>{t('reorgSpecialBibliography')}</button>
                </div>
              )}
              {sub === it && it === 'presets' && (
                <div className="reorg-dockind-sub" data-doc-sub="presets">
                  {(host?.templates ?? []).map((tpl) => (
                    <button key={tpl.key} type="button" data-preset-pick={tpl.key} aria-pressed={tpl.selected ? 'true' : 'false'} onClick={() => { tpl.onApply(); close(true); }}>{tpl.label}</button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
