import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDeskLexicon, type DeskTermId } from '../store/deskLexicon';
import { decksByRoom } from '../decks/library';
import { HelpMeChoose } from './HelpMeChoose';
import type { HelpLanding } from '../decks/helpMeChoose';
import { useTheme } from '../store/theme';
import { FORMS_GROUPS, blockRangeLabel, coverTermKey } from '../decks/formCounts';
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
  // TOOLS #9 - "Begin" on a librarian pick carries Q3's landing (open / the Walk / the Walk with "?" open). Told to the host BEFORE the deal (the deal may come after more questions); the host applies it when it deals. Absent = a host with no views to land in.
  onLanding?: (landing: HelpLanding) => void;
  // BIG PROJECTS step 2 - open straight on this deck's first question (a preset on the Boards tab); a deck with no questions deals at once. An unknown id opens the library.
  startDeckId?: string;
  // W4 - the deck's own deal answers already settled (the librarian's pick, riding the address); the wizard opens on the first question NOT answered, and deals at once when every question is.
  startAnswers?: DeckAnswers;
  // W3 - the pages a `kind: 'pages'` question (From my pages) may pick from, in the order to list them. ABSENT = this door has no pages to offer (the new-project door), and a deck that asks
  // for pages is left out of the library there - absent, not greyed. An empty list hides it the same way.
  pagesFor?: () => { id: string; title: string }[];
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
  every: 'deckRoomEvery',
};

export function DeckWizard({ decks, onDeal, onClose, onLanding, startDeckId, startAnswers, pagesFor }: DeckWizardProps) {
  const { t } = useDeskLexicon();
  const machina = useTheme() === 'machina';
  // W3 - the pages picked so far, in the order picked (the page step of From my pages)
  const [picked, setPicked] = useState<string[]>([]);
  const startDeck = startDeckId ? decks.find(d => d.id === startDeckId) ?? null : null;
  // W4 - the first question the librarian has not already answered (-1 = every question is settled, or the deck asks none)
  const firstOpen = (deck: DeckDefinition, answers: DeckAnswers) => deck.questions.findIndex((q) => answers[q.id] == null);
  const seeded = startDeck ? Object.fromEntries(Object.entries(startAnswers ?? {}).filter(([qid, oid]) => startDeck.questions.some((q) => q.id === qid && q.options.some((o) => o.id === oid)))) : {};
  const [step, setStep] = useState<Step>(() => (startDeck && startDeck.questions.length > 0 && firstOpen(startDeck, seeded) >= 0
    ? { kind: 'question', deck: startDeck, index: firstOpen(startDeck, seeded), answers: seeded, note: null }
    : { kind: 'library' }));
  const [helpOpen, setHelpOpen] = useState(false);
  const helpDoorRef = useRef<HTMLButtonElement>(null);
  // MACHINA: Intake replaces the Forms list while open, so the Intake row is unmounted; when Intake closes, focus goes back to its row on the Forms list that returns.
  const helpWas = useRef(false);
  useEffect(() => {
    if (helpWas.current && !helpOpen) helpDoorRef.current?.focus();
    helpWas.current = helpOpen;
  }, [helpOpen]);
  const dealtAtOnce = useRef(false);
  useEffect(() => {
    if (startDeck && (startDeck.questions.length === 0 || firstOpen(startDeck, seeded) < 0) && !dealtAtOnce.current) { dealtAtOnce.current = true; onDeal(startDeck, startDeck.questions.length === 0 ? {} : seeded); onClose(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chooseDeck = (deck: DeckDefinition) => {
    if (deck.questions.length === 0) {
      onDeal(deck, {});
      onClose();
      return;
    }
    setStep({ kind: 'question', deck, index: 0, answers: {}, note: null });
  };

  // W4 - "Begin" on a librarian pick: the deck, with the deal answers the table settled; the wizard asks only the rest
  const beginChoice = (choice: { deck: string; answers: DeckAnswers }, landing: HelpLanding) => {
    const deck = decks.find((d) => d.id === choice.deck);
    setHelpOpen(false);
    onLanding?.(landing);
    if (!deck) return;
    const open = firstOpen(deck, choice.answers);
    if (deck.questions.length === 0 || open < 0) { onDeal(deck, deck.questions.length === 0 ? {} : choice.answers); onClose(); return; }
    setStep({ kind: 'question', deck, index: open, answers: choice.answers, note: null });
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

  // MACHINA FORMS: Esc closes the panel (not while Intake is open over it - Intake owns that Esc), and the arrow keys walk the rows
  useEffect(() => {
    if (!machina) return undefined;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !helpOpen) { e.stopPropagation(); onClose(); } };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [machina, helpOpen, onClose]);
  const moveRow = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const rows = [...e.currentTarget.querySelectorAll<HTMLElement>('.forms-row, .wz-help-door')];
    const at = rows.indexOf(document.activeElement as HTMLElement);
    const next = rows[Math.max(0, Math.min(rows.length - 1, at + (e.key === 'ArrowDown' ? 1 : -1)))];
    if (next) { e.preventDefault(); next.focus(); }
  };

  const asksForPages = (d: DeckDefinition) => d.questions.some(q => q.kind === 'pages');
  const visibleDecks = decks.filter(d => !asksForPages(d) || (pagesFor ? pagesFor().length > 0 : false));
  const grouped = decksByRoom(visibleDecks);

  // deckwizard-backdrop (Fable, 2026-10-15) - the card pop-up's fix (card-close-x), applied here. The backdrop is fixed at z-index
  // 220, but it rendered inside `.desk-frame-stage`, whose `isolation:isolate` makes it a stacking context: 220 ranked only within
  // the stage, and the fixed rail (`.desk-frame-strip`, z-index 1 in the ROOT context) painted over the whole stage, backdrop
  // included - an outside click could press the rail's own buttons. Portalled to <body>, the backdrop ranks in the root context,
  // above the rail and the page's chrome. Nothing here reads its DOM ancestors, its colours are :root tokens, and React events
  // still bubble through the component tree.
  return createPortal(
    <div className="deck-wizard-backdrop" role="presentation" onClick={onClose}>
      <div
        className="deck-wizard-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={t('deckWizardChooseTitle')}
        onClick={e => e.stopPropagation()}
      >
        {step.kind === 'library' && machina && helpOpen && (
          // MACHINA: Intake REPLACES the Forms content inside this same dialog (no second layer); Back / Esc / ALL FORMS return to Forms
          <HelpMeChoose embedded onBegin={(choice, landing) => beginChoice(choice, landing)} onBrowse={() => setHelpOpen(false)} onClose={() => setHelpOpen(false)} />
        )}

        {step.kind === 'library' && machina && !helpOpen && (
          <>
            <div className="deck-wizard-strip">
              <span className="eyebrow deck-wizard-eyebrow">{t('deckWizardChooseTitle')}</span>
              <button type="button" className="btn-quiet deck-wizard-close" aria-label={t('deckWizardClose')} onClick={onClose}>×</button>
            </div>
            <div className="deck-wizard-body forms-body" onKeyDown={moveRow}>
              {pagesFor && (
                <button type="button" ref={helpDoorRef} className="wz-help-door forms-intake" data-preset="help-me-choose" onClick={() => setHelpOpen(true)}>
                  <span className="forms-intake-word">{t('helpDoor')}</span><span className="forms-intake-hint">{t('formsIntakeHint')}</span>
                </button>
              )}
              {FORMS_GROUPS.map((g) => {
                const shown = g.decks.map((id) => visibleDecks.find((d) => d.id === id)).filter((d): d is DeckDefinition => !!d);
                if (shown.length === 0) return null;
                return (
                  <div className="forms-group" key={g.group} data-group={g.group}>
                    <div className="forms-kicker">{t(ROOM_TERM[g.room])}</div>
                    {shown.map((deck) => (
                      <button key={deck.id} type="button" className="forms-row" data-deck-id={deck.id} onClick={() => chooseDeck(deck)}>
                        <span className="forms-name">{t(deck.nameTerm)}</span>
                        <span className="forms-cover">{t(coverTermKey(deck.id) as DeskTermId)}</span>
                        <span className="forms-count">{blockRangeLabel(deck)}</span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
            <div className="deck-wizard-foot forms-foot">
              <span>{t('formsFoot')}</span><span>{t('formsFootBlocks')}</span>
            </div>
          </>
        )}

        {step.kind === 'library' && !machina && (
          <>
            <div className="deck-wizard-strip">
              <span className="eyebrow deck-wizard-eyebrow">{t('deckWizardChooseTitle')}</span>
              <button type="button" className="btn-quiet deck-wizard-close" aria-label={t('deckWizardClose')} onClick={onClose}>×</button>
            </div>
            <div className="deck-wizard-body">
              {pagesFor && (
                <button type="button" ref={helpDoorRef} className="wz-help-door deck-wizard-help-door" data-preset="help-me-choose" onClick={() => setHelpOpen(true)}>{t('helpDoor')}</button>
              )}
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
                {question.kind === 'pages' && (() => {
                  const pages = pagesFor ? pagesFor() : [];
                  const toggle = (id: string) => setPicked(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
                  return (
                    <>
                      {pages.length === 0 && <div className="deck-wizard-note"><p>{t('deckFromMyPagesNone')}</p></div>}
                      <div className="deck-wizard-pages" role="group" aria-label={t(question.promptTerm)}>
                        {pages.map(p => {
                          const at = picked.indexOf(p.id);
                          return (
                            <button key={p.id} type="button" className="deck-wizard-page-btn" data-page-id={p.id} aria-pressed={at >= 0} onClick={() => toggle(p.id)}>
                              <span className="deck-wizard-page-n" aria-hidden="true">{at >= 0 ? at + 1 : ''}</span>
                              <span className="deck-wizard-page-t">{p.title}</span>
                            </button>
                          );
                        })}
                      </div>
                      <button type="button" className="btn-brass deck-wizard-continue deck-wizard-deal" disabled={picked.length === 0} onClick={() => advance(deck, index, { ...answers, [question.id]: picked.join(',') })}>
                        {t('deckFromMyPagesDeal')}
                      </button>
                    </>
                  );
                })()}
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
      {helpOpen && !machina && <HelpMeChoose onBegin={(choice, landing) => beginChoice(choice, landing)} onBrowse={() => setHelpOpen(false)} onClose={() => setHelpOpen(false)} returnFocusTo={helpDoorRef.current} />}
    </div>,
    document.body,
  );
}
