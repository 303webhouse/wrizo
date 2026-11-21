import { useState } from 'react';
import type { DeskTermId } from '../../store/lexicon/terms';
import { lensRoster, type LensStage } from './feedbackLenses';

// THE FEEDBACK LENSES (feedbackLenses.ts has the rules): each lens is a disclosure, closed by default, that opens to its prompts. A press on a prompt STAGES it in the Consultant's composer as ordinary
// editable text and sends nothing (the same arrival as a roster chip's press: the law that a counsel's button names what its press sends). Which lenses are open is a look, never stored.
export function FeedbackLenses({ t, stage, onPress }: { t: (k: DeskTermId) => string; stage: LensStage; onPress: (text: string) => void }) {
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set());
  const roster = lensRoster(stage);
  if (roster.length === 0) return null;
  const toggle = (id: string): void => setOpen((was) => { const n = new Set(was); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  return (
    <div className="wz-lenses" role="group" aria-label={t('reorgLensLabel')} data-lenses={stage}>
      {roster.map((l) => {
        const isOpen = open.has(l.id);
        return (
          <section key={l.id} className="wz-lens" data-lens={l.id}>
            <button type="button" className="wz-lens-head" id={`wz-lens-head-${l.id}`} aria-expanded={isOpen} aria-controls={`wz-lens-body-${l.id}`} onClick={() => toggle(l.id)}>
              <span>{t(l.name)}</span><span className="wz-lens-chev" aria-hidden="true">{isOpen ? '▾' : '▸'}</span>
            </button>
            {isOpen && (
              <ul className="wz-lens-prompts" id={`wz-lens-body-${l.id}`} aria-labelledby={`wz-lens-head-${l.id}`}>
                {l.prompts.map((p) => (
                  <li key={p}><button type="button" className="wz-lens-prompt" data-lens-prompt={p} onClick={() => onPress(t(p))}>{t(p)}</button></li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
