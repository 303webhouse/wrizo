import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { apiTutorWalk } from '../../store/api';
import { useDeskLexicon } from '../../store/deskLexicon';
import { DrawerNote } from '../../components/DrawerNote';
import type { PlanPreset } from '../backMenu/planPresets';
import type { PresetNote } from '../presetNotes';
import type { WalkStep } from './stepModel';
import { WALK_KINDS, walkBody, walkQuestions } from './walkAsk';
import { askWalk, retryWalk, subscribeWalkThreads, walkAiOff, walkThread } from './walkThreads';

// THE WALK'S BACK MENU, THE AI ALONE (PRESETS-B, Nov 27; guide-walk-spec.md section 3.8, frames B and H): the step and the structure, one lens named for the step holding the template's four questions, "Ask your own",
// and the answer. IT NEVER SPEAKS FIRST: every ask is a press of hers. What travels is her step alone (walkAsk.walkBody); the "?" says so. With the AI off it shows the structure's own "?" note and nothing else.
// A tool beside the card: it reads her Plan and writes nothing.

export interface WalkAiProps {
  pageId: string;
  step: WalkStep;
  steps: readonly WalkStep[];
  structure: PlanPreset;
  note: PresetNote | undefined;
  stepOf: string;
  style: CSSProperties;
}

export function WalkAi({ pageId, step, steps, structure, note, stepOf, style }: WalkAiProps) {
  const { t } = useDeskLexicon();
  const key = `${pageId}\u0001${step.id}`;
  const thread = useSyncExternalStore(subscribeWalkThreads, () => walkThread(key));
  const off = useSyncExternalStore(subscribeWalkThreads, walkAiOff);
  const [own, setOwn] = useState('');
  const [open, setOpen] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLInputElement>(null);
  const offRef = useRef<HTMLDivElement>(null);
  const index = steps.findIndex((s) => s.id === step.id);
  const name = t(structure.name);
  const next = steps[index + 1]?.title || undefined;
  const previous = steps[index - 1]?.title || undefined;
  const kind = WALK_KINDS[structure.id] ?? 'stories';
  const about = note ? [note.line, note.does, note.eg, note.must].map((k) => (k ? t(k) : '')).filter(Boolean).join(' ').replace(/\*/g, '') : '';
  const questions = walkQuestions({ step: step.title, structure: name, kind, next, previous });
  const sending = thread.status === 'sending';

  // her focus goes to the box at every press: the button she pressed greys or goes away, and a focus left nowhere is outside the walk
  const toBox = () => boxRef.current?.focus({ preventScroll: true });
  // her step as it stands now, the moment she presses
  const ask = (text: string) => {
    if (sending) return;
    setOpen(false);   // the questions fold away under the lens's name while she reads (frame H); pressing the name brings them back
    toBox();
    void askWalk(key, text, walkBody({ structure: name, kind, step: step.title, note: step.note, question: step.hint, about, before: previous, after: next }), apiTutorWalk);
  };
  const askOwn = () => { if (!own.trim() || sending) return; ask(own); setOwn(''); };

  // a long answer scrolls inside the menu, opening at her newest question, the box staying in reach
  useEffect(() => {
    const end = endRef.current;
    const last = end ? [...end.querySelectorAll('[data-walk-asked]')].pop() : undefined;
    if (end && last) end.scrollTop += last.getBoundingClientRect().top - end.getBoundingClientRect().top - 4;
  }, [thread.turns.length, key]);
  useEffect(() => { setOwn(''); setOpen(walkThread(key).turns.length === 0); }, [key]);
  // the box she was in goes away when the AI turns out to be off: her focus stays in the walk, where Escape and Tab still work
  useEffect(() => { if (off && (!document.activeElement || document.activeElement === document.body)) offRef.current?.focus({ preventScroll: true }); }, [off]);

  return (
    <aside className="wz-walk-ai" style={style} data-walk-ai="" aria-label={t('tutorTabTutor')}>
      <div className="wz-walk-small wz-walk-ai-head">{`${name} · ${stepOf}`}</div>
      {off ? (
        <div className="wz-walk-ai-scroll" ref={offRef} tabIndex={-1} data-walk-ai-off="">
          {note ? [note.line, note.does, note.eg].map((k) => (k ? <p key={k} className="wz-walk-ai-note">{t(k).replace(/\*/g, '')}</p> : null))
            : <p className="wz-walk-small">{t('tutorConversationOffline')}</p>}
        </div>
      ) : (
        <>
          <div className="wz-walk-ai-scroll" ref={endRef}>
            <section className="wz-lens">
              <button type="button" className="wz-lens-head" id="wz-walk-lens-head" aria-expanded={open} aria-controls="wz-walk-lens-body" onClick={() => setOpen((o) => !o)}>
                <span>{step.title}</span><span className="wz-lens-chev" aria-hidden="true">{open ? '▾' : '▸'}</span>
              </button>
              {open && (
                <ul className="wz-lens-prompts" id="wz-walk-lens-body" aria-labelledby="wz-walk-lens-head">
                  {questions.map((q) => (
                    <li key={q}><button type="button" className="wz-lens-prompt" data-walk-ask={q} aria-disabled={sending} onClick={() => ask(q)}>{q}</button></li>
                  ))}
                </ul>
              )}
            </section>
            <div className="wz-walk-actname">{t('reorgLensAskOwn')}</div>
            <div className="wz-walk-ai-thread" aria-live="polite" data-walk-thread="">
              {thread.turns.length === 0 && <p className="wz-walk-ai-empty">{t('tutorConversationEmpty')}</p>}
              {thread.turns.map((m, i) => (m.role === 'writer'
                ? <p key={i} className="wz-walk-ai-asked" data-walk-asked="">{`${t('guideWalkAsked')} ${m.text}`}</p>
                : <div key={i} className="wz-walk-ai-reply" data-walk-reply="">{m.text}</div>))}
              {sending && <p className="wz-walk-small">{t('tutorConversationSending')}</p>}
              {thread.status === 'error' && (
                <p className="wz-walk-small">{t('tutorConversationError')}{' '}
                  <button type="button" className="wz-walk-ai-retry" data-walk-retry="" onClick={() => { toBox(); void retryWalk(key, apiTutorWalk); }}>{t('tutorConversationRetry')}</button>
                </p>
              )}
            </div>
          </div>
          <div className="wz-walk-ai-row">
            <input ref={boxRef} type="text" className="wz-walk-ai-input" data-walk-own="" value={own} maxLength={4000} placeholder={t('guideWalkAskHint')} aria-label={t('guideWalkAskHint')}
              onChange={(e) => setOwn(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); askOwn(); } }} />
            <button type="button" className="wz-walk-ai-send" data-walk-send="" disabled={!own.trim() || sending} onClick={askOwn}>{t('tutorConversationSend')}</button>
            <DrawerNote label={t('guideWalkAskTravelsLabel')}>{t('guideWalkAskTravels')}</DrawerNote>
          </div>
        </>
      )}
    </aside>
  );
}
