import type { DeskTermId } from '../../store/deskLexicon';

// SPRINT'S BACK MENU (Fable, Nov 20, 3:15 pm; Nick's 1:20 pm answer, claude/wrizors/machina-stage-menus-decide.md draft 3, F1): "The Back menu keeps its handle, but only its FEEDBACK
// tab can be used. PLAN and ASSETS show greyed, with a note ... Writing prompts only. The Consultant gives one prompt to get her writing and keep her writing; it never starts a
// back-and-forth. ... The rules the Consultant is given in SPRINT: one prompt at a time; short; aimed at getting her writing again; no questions back, no follow-ups, no conversation,
// no judging what she wrote; never prose for her page. Another prompt is her press, never the app's. The command-line default retires."
// The rules are not instructions to a model: the prompt is DECK-DRAWN (store/tutorFreeWriteDeck.ts, a frozen local pool of short statements), so a press sends nothing and no reply can
// start a conversation. This is only what the tab SHOWS in SPRINT - the one standing prompt and the one button that draws the next. The standing draw, its ceiling (three, then the
// refill note until 100 words are written) and the press stay Tutor's own (pressPreset), unchanged. No composer, no lenses, no Ask, no log: nothing to answer, nothing to type into.

interface Props {
  t: (term: DeskTermId) => string;
  /** The one standing prompt, or null before the first press. */
  prompt: string | null;
  /** The ceiling note stands in place of a draw (the fourth press before 100 more words). */
  refillNote: boolean;
  /** Her press: draw the next prompt (replaces the standing one). */
  onPress: () => void;
  /** The id the locked tabs point at (aria-describedby). */
  noteId: string;
  /** The Consultant is answering her press (SPRINT's prompts from the Consultant, behind ?sprint=consultant): the button reads busy and cannot be pressed again. */
  busy?: boolean;
  /** The switch is on: say what travels (one prompt's worth, nothing of her page). */
  travels?: boolean;
  /** Her own choice (writingSettings.consultant): drawn only when the Consultant is on in this build; undefined draws no switch. */
  use?: boolean;
  onUse?: (next: boolean) => void;
}

export function SprintFeedback({ t, prompt, refillNote, onPress, noteId, busy, travels, use, onUse }: Props) {
  return (
    <div className="wz-sprint-feedback">
      <p id={noteId} className="wz-sprint-note" role="note">{t('reorgSprintLocked')}</p>
      <div className="wz-sprint-prompt" role="status" aria-live="polite" data-drawn={prompt ? 'writingPrompt' : undefined}>
        {prompt ?? <span className="wz-sprint-empty">{t('reorgSprintEmpty')}</span>}
      </div>
      <button type="button" className="wz-sprint-press" data-preset="writingPrompt" aria-busy={busy ? 'true' : undefined} onClick={onPress}>
        {prompt ? t('reorgSprintAnother') : t('tutorFreeWritePrompt')}
      </button>
      {use !== undefined && onUse && (
        <button type="button" role="switch" className="wz-sprint-use" data-sprint-use aria-checked={use ? 'true' : 'false'} onClick={() => onUse(!use)}>
          <span className="wz-sprint-use-track" aria-hidden="true"><span className="wz-sprint-use-knob" /></span>
          <span>{t('reorgSprintUse')}</span>
        </button>
      )}
      {travels && <p className="wz-sprint-travels">{t('reorgSprintTravels')}</p>}
      {refillNote && <div className="wz-sprint-refill" data-note-for="writingPrompt">{t('tutorFreeWriteRefill')}</div>}
    </div>
  );
}
