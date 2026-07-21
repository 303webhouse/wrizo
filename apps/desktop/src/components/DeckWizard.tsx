import { useState } from 'react';
import { useDeskLexicon, type DeskTermId } from '../store/deskLexicon';
import { decksByRoom } from '../decks/library';
import type { DeckDefinition, DeckAnswers, DeckRoom } from '../decks/types';

// B3 S1 — the deck engine's own UI: ONE generic wizard runtime any deck
// definition rides (never seven bespoke wizards). Binds the R6 rulings
// verbatim (boards-ratification-record.md, catalog Law 3):
//   - opt-in only — this component NEVER mounts itself; both doors
//     (CreateProject.tsx, BoardEditor.tsx) mount it ONLY behind an explicit
//     click on "Start from a deck…"/"From a deck…", never ambiently.
//   - step-by-step pop-out over the faded board — the host applies its own
//     blur/dim to whatever sits behind this dialog (BoardEditor.tsx reuses
//     its existing `.board-canvas-blurred` treatment verbatim, the SAME
//     mechanism the card popup already uses; CreateProject.tsx applies the
//     analogous `.deck-wizard-blurred` pair below) — this component itself
//     never reflows or resizes anything outside its own fixed overlay.
//   - clickable-first — every question renders as a row of concrete
//     clickable options; DeckQuestionOption's own `noteTerm` is the ONE
//     text-adjacent affordance (an inline routing note, Feature
//     Screenplay's own "pilot" answer), and it never blocks advancing.
//   - ends on the dealt board — the WIZARD's own last act (clicking the
//     final question's option, or a no-question deck's own row) calls
//     `onDeal` then `onClose` itself; callers never need to close it.
//
// Deck-agnostic by construction: this file names no deck id, no card, no
// room-specific behavior anywhere — it renders exactly what `decks` (the
// library, passed in by the host) declares.
export interface DeckWizardProps {
  decks: DeckDefinition[];
  onDeal: (deck: DeckDefinition, answers: DeckAnswers) => void;
  onClose: () => void;
}

type Step =
  | { kind: 'library' }
  | { kind: 'question'; deck: DeckDefinition; index: number; answers: DeckAnswers; note: string | null };

const ROOM_TERM: Record<DeckRoom, DeskTermId> = {
  fiction: 'deckRoomFiction',
  speculative: 'deckRoomSpeculative',
  screen: 'deckRoomScreen',
  academy: 'deckRoomAcademy',
  business: 'deckRoomBusiness',
  newsroom: 'deckRoomNewsroom',
};

export function DeckWizard({ decks, onDeal, onClose }: DeckWizardProps) {
  const { t } = useDeskLexicon();
  const [step, setStep] = useState<Step>({ kind: 'library' });

  const chooseDeck = (deck: DeckDefinition) => {
    if (deck.questions.length === 0) {
      onDeal(deck, {});
      onClose();
      return;
    }
    setStep({ kind: 'question', deck, index: 0, answers: {}, note: null });
  };

  const pickOption = (deck: DeckDefinition, index: number, answers: DeckAnswers, questionId: string, optionId: string, noteTerm?: DeskTermId) => {
    const nextAnswers = { ...answers, [questionId]: optionId };
    if (noteTerm) {
      // A copy-only routing note (R6: "text entry permitted... never
      // required to advance") — surfaced once, dismissed by the SAME
      // click-to-continue the writer already used to answer.
      setStep({ kind: 'question', deck, index, answers: nextAnswers, note: t(noteTerm) });
      return;
    }
    advance(deck, index, nextAnswers);
  };

  const advance = (deck: DeckDefinition, index: number, answers: DeckAnswers) => {
    if (index + 1 < deck.questions.length) {
      setStep({ kind: 'question', deck, index: index + 1, answers, note: null });
      return;
    }
    onDeal(deck, answers);
    onClose();
  };

  const grouped = decksByRoom(decks);

  return (
    <div className="deck-wizard-backdrop" role="presentation" onClick={onClose}>
      <div
        className="deck-wizard-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={t('deckWizardChooseTitle')}
        onClick={e => e.stopPropagation()}
      >
        {step.kind === 'library' && (
          <>
            <div className="deck-wizard-strip">
              <span className="eyebrow deck-wizard-eyebrow">{t('deckWizardChooseTitle')}</span>
              <button type="button" className="btn-quiet deck-wizard-close" aria-label={t('deckWizardClose')} onClick={onClose}>×</button>
            </div>
            <div className="deck-wizard-body">
              {[...grouped.entries()].filter(([, list]) => list.length > 0).map(([room, list]) => (
                <div className="deck-wizard-room-group" key={room}>
                  <div className="deck-wizard-room-heading">{t(ROOM_TERM[room])}</div>
                  {list.map(deck => (
                    <button
                      key={deck.id}
                      type="button"
                      className="deck-wizard-deck-row"
                      data-deck-id={deck.id}
                      onClick={() => chooseDeck(deck)}
                    >
                      {t(deck.nameTerm)}
                    </button>
                  ))}
                </div>
              ))}
            </div>
            <div className="deck-wizard-foot">
              <button type="button" className="btn-quiet deck-wizard-cancel" onClick={onClose}>{t('deckWizardCancel')}</button>
            </div>
          </>
        )}

        {step.kind === 'question' && (() => {
          const { deck, index, answers, note } = step;
          const question = deck.questions[index];
          return (
            <>
              <div className="deck-wizard-strip">
                <span className="eyebrow deck-wizard-eyebrow">{t(deck.nameTerm)}</span>
                <button type="button" className="btn-quiet deck-wizard-close" aria-label={t('deckWizardClose')} onClick={onClose}>×</button>
              </div>
              <div className="deck-wizard-body">
                <div className="deck-wizard-question">{t(question.promptTerm)}</div>
                <div className="deck-wizard-options" role="group" aria-label={t(question.promptTerm)}>
                  {question.options.map(option => (
                    <button
                      key={option.id}
                      type="button"
                      className="deck-wizard-option-btn"
                      data-option-id={option.id}
                      aria-pressed={answers[question.id] === option.id}
                      onClick={() => pickOption(deck, index, answers, question.id, option.id, option.noteTerm)}
                    >
                      {t(option.labelTerm)}
                    </button>
                  ))}
                </div>
                {note && (
                  <div className="deck-wizard-note">
                    <p>{note}</p>
                    <button
                      type="button"
                      className="btn-brass deck-wizard-continue"
                      onClick={() => advance(deck, index, answers)}
                    >
                      {t('deckWizardContinue')}
                    </button>
                  </div>
                )}
              </div>
              <div className="deck-wizard-foot">
                <button
                  type="button"
                  className="btn-quiet deck-wizard-back"
                  onClick={() => (index === 0
                    ? setStep({ kind: 'library' })
                    : setStep({ kind: 'question', deck, index: index - 1, answers, note: null }))}
                >
                  {t('deckWizardBack')}
                </button>
                <button type="button" className="btn-quiet deck-wizard-cancel" onClick={onClose}>{t('deckWizardCancel')}</button>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
