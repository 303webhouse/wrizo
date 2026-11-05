import { useState, type ReactNode } from 'react';
import type { EditorMode } from './ForwardOnlyEditor';
import { useDeskLexicon, type DeskTermId } from '../store/deskLexicon';
import { HelpButton } from './HelpButton';

// the framed mode strip: Free Write, Draft and Revise are live; Workshop is hidden until built; Publish opens the stub dialog; freeWriteEnabled and reviseEnabled let the screenplay surface keep Draft as its only posture [ModeStrip §1]
export interface ModeStripProps {
  mode: EditorMode;
  onSwitch: (m: EditorMode) => void;
  onPublish: () => void;
  freeWriteEnabled?: boolean;
  reviseEnabled?: boolean;
  // Renders at the end of the same tight cluster (the page's Plan door).
  end?: ReactNode;
}

export function ModeStrip({ mode, onSwitch, onPublish, freeWriteEnabled = true, reviseEnabled = true, end }: ModeStripProps) {
  const { t } = useDeskLexicon();
  const [soon, setSoon] = useState<string | null>(null);
  const flashSoon = (label: string) => { setSoon(label); setTimeout(() => setSoon(null), 1800); };

  const items: { key: string; label: string; live: boolean; active: boolean; onClick: () => void; help?: DeskTermId }[] = [
    {
      key: 'freewrite', label: t('modeFreeWrite'), live: freeWriteEnabled, active: mode === 'journal',
      onClick: () => (freeWriteEnabled ? onSwitch('journal') : flashSoon(t('modeFreeWrite'))),
      help: 'helpFreeWrite',
    },
    {
      key: 'draft', label: t('modeDraft'), live: true, active: mode === 'drafting',
      onClick: () => onSwitch('drafting'),
    },
    {
      key: 'revise', label: t('modeRevise'), live: reviseEnabled, active: mode === 'revise',
      onClick: () => (reviseEnabled ? onSwitch('revise') : flashSoon(t('modeRevise'))),
    },
    // Workshop is absent until it is built, every theme's word for it with it; re-add the item here to bring it back [ModeStrip §2]
    { key: 'publish', label: t('modePublish'), live: true, active: false, onClick: onPublish, help: 'helpPublish' },
  ];

  return (
    <div className="desk-mode-strip" role="tablist" aria-label="Writing mode">
      {items.map(it => {
        const tab = (
          <button
            key={it.help ? undefined : it.key}
            type="button"
            role="tab"
            // data-mode-key is a behaviour-free contract marker: the labels are themeable, so an instrument binds to the key, not the word [ModeStrip §3]
            data-mode-key={it.key}
            aria-selected={it.active}
            aria-disabled={!it.live}
            className={`desk-mode-tab${it.active ? ' active' : ''}${it.live ? '' : ' deferred'}`}
            onClick={it.onClick}
          >
            {it.label}
          </button>
        );
        // the "?" sits beside the tab, never inside it: a button inside a button is invalid and would switch modes on every press [ModeStrip §4]
        if (!it.help) return tab;
        return (
          <span key={it.key} className="desk-mode-tab-wrap">
            {tab}
            <HelpButton helpKey={it.help} subjectLabel={it.label} />
          </span>
        );
      })}
      {soon && <span className="desk-mode-soon" role="status">{soon} — coming soon</span>}
      {end}
    </div>
  );
}
