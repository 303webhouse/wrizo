import type { FreeWritePresetId } from '../../store/tutorFreeWriteDeck';

// the roster's three presets, in order; `id` keys the local deck, `term` the string of record [Tutor §8]
export const FREE_WRITE_PRESETS: { id: FreeWritePresetId; term: 'tutorFreeWritePrompt' | 'tutorFreeWriteUnblock' | 'tutorFreeWriteTips' }[] = [
  { id: 'writingPrompt', term: 'tutorFreeWritePrompt' },
  { id: 'unblock', term: 'tutorFreeWriteUnblock' },
  { id: 'tips', term: 'tutorFreeWriteTips' },
];

export const NO_DRAWS: Record<FreeWritePresetId, number> = { writingPrompt: 0, unblock: 0, tips: 0 };

// ITEM 84, THE DRAFT ROSTER — the four asks in the lock record's own order, and
// FIXED in it: no reshuffling between visits, because re-scanning is the tax the
// cognition bench named. `term` keys the string of record (deskLexicon, which
// carries the provenance note); `sendsSelection` marks TD4, the one chip that
// adds a payload. It is a per-ask boolean rather than an id comparison on
// purpose: the button law is per-press, so each button declares its own wire
// right here beside the words that name it, and any chip added later has to
// answer the question rather than inherit an answer.
type DraftAskId = 'drag' | 'loadBearing' | 'threadSlip' | 'stretch';
export const DRAFT_ASKS: {
  id: DraftAskId;
  term: 'tutorDraftAskDrag' | 'tutorDraftAskLoadBearing' | 'tutorDraftAskThreadSlip' | 'tutorDraftAskStretch';
  sendsSelection: boolean;
  // `label` overrides only the chip's face; pressAsk still sends `term`, word for word [Tutor §9]
  label?: 'tutorDraftAskStretchLabel';
}[] = [
  { id: 'drag', term: 'tutorDraftAskDrag', sendsSelection: false },
  { id: 'loadBearing', term: 'tutorDraftAskLoadBearing', sendsSelection: false },
  { id: 'threadSlip', term: 'tutorDraftAskThreadSlip', sendsSelection: false },
  { id: 'stretch', term: 'tutorDraftAskStretch', sendsSelection: true, label: 'tutorDraftAskStretchLabel' },
];
