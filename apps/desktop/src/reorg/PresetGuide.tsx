import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDeskLexicon, type DeskTermId } from '../store/deskLexicon';
import { useTheme } from '../store/theme';
import { PRESET_NOTES, STRUCTURE_NOTES, type PresetNote } from './presetNotes';
import { guideTree, walk, factsOf, kindOf, BLANK, NOT_SURE, type GuideAnswer, type GuideLanding, type GuidePick } from './presetGuide';

// THE GUIDE, ITS PANEL (PRESETS-B, Nov 25; the brief guide-brief-nov24.md). Its own small panel over the dimmed room: three questions at most, one press each, Back at every step, Esc closes; it ends on one preset, one alternative and "or just start Blank".
// The LOGIC is presetGuide.ts (a fixed table: no model, the same answers give the same result); this file is the dress and the press-by-press flow, on the Help me choose panel's own dresses (Arbor's librarian, Machina's intake, Flux's diagnostic: the
// `help-*` shells and tokens, and nothing new). LAWS: it NEVER opens itself (a host mounts it behind a press); NOTHING is stored (its state is local to this mount: no storage, no sync key, no draft); pressing Back or Close writes nothing (the host's
// `onStart` is the only way out that writes, and it is the host's); Esc closes it and focus RETURNS to what opened it; reduced motion means it simply appears (no slide: `data-still`).
export interface PresetGuideProps {
  /** Start: do this pick (the host makes the Doc and calls startGuide: presetGuideActs.ts). The pick's `kind` is `kindOf(pick)`. Blank is `BLANK`. */
  onStart: (pick: GuidePick) => void;
  onClose: () => void;
  /** The door that opened this panel: focus returns to it on close. */
  returnFocusTo?: HTMLElement | null;
}

type Variant = 'librarian' | 'diagnostic' | 'intake';
const NOTE_LINES: readonly { part: 'line' | 'does' | 'eg' | 'names' | 'must' | 'credit'; label: DeskTermId | null }[] = [
  { part: 'line', label: null }, { part: 'does', label: null }, { part: 'eg', label: 'reorgPreNoteEg' }, { part: 'names', label: 'reorgPreNoteNames' }, { part: 'must', label: null }, { part: 'credit', label: 'reorgPreNoteCredit' },
];
// a *starred* span in a note's word is italic (a book's title in a credit), as PresetNote.tsx draws it
const emph = (s: string) => s.split(/(\*[^*]+\*)/).map((p, i) => (/^\*[^*]+\*$/.test(p) ? <em key={i}>{p.slice(1, -1)}</em> : p));

export function PresetGuide({ onStart, onClose, returnFocusTo }: PresetGuideProps) {
  const { t } = useDeskLexicon();
  const theme = useTheme();
  const variant: Variant = theme === 'plateau' ? 'librarian' : theme === 'flux' ? 'diagnostic' : 'intake';
  const [path, setPath] = useState<string[]>([]);
  const [more, setMore] = useState(false);
  const [notSure, setNotSure] = useState(false);
  const [note, setNote] = useState<'pick' | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const tree = useMemo(() => guideTree(), []);
  const step = notSure ? null : walk(path, undefined, tree);
  const landing: GuideLanding | null = notSure ? NOT_SURE : step && step.kind === 'landing' ? step.landing : null;
  const said = step && step.kind === 'landing' ? step.said : [];
  const still = true;   // the Guide never slides: reduced motion means it simply appears, and a cut is the same for everyone (the brief: "reduced motion means it simply appears")
  const q = step && step.kind === 'question' ? step : null;
  const stepKey = notSure ? 'blank' : landing ? 'landing' : String(path.length);

  // focus: remember what opened this, give it back on close; Esc closes (and nothing else hears it)
  useEffect(() => {
    openerRef.current = returnFocusTo ?? (document.activeElement as HTMLElement | null) ?? null;
    return () => { const el = openerRef.current; if (el && el.isConnected) el.focus(); };
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); onClose(); } };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [onClose]);
  // each new step lands its first answer (or the landing's Start) under focus: a keyboard writer never has to hunt for it
  useEffect(() => {
    const first = rootRef.current?.querySelector<HTMLElement>('[data-guide-option], [data-guide-start], [data-guide-note-back]');
    first?.focus();
  }, [stepKey, more, note]);

  const choose = (a: GuideAnswer) => { setPath((p) => [...p, a.id]); setNote(null); };
  const back = () => {
    if (note) { setNote(null); return; }
    if (notSure) { setNotSure(false); return; }
    if (path.length) setPath((p) => p.slice(0, -1));
  };
  const keys = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const items = [...e.currentTarget.querySelectorAll<HTMLElement>('[data-guide-option]')];
    const at = items.indexOf(document.activeElement as HTMLElement);
    if (at < 0) return;
    const next = items[Math.max(0, Math.min(items.length - 1, at + (e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1)))];
    if (next) { e.preventDefault(); next.focus(); }
  };

  const total = q ? q.of : 3;
  const srLine = note ? t('guideKicker') : landing ? t('guideLandingSr') : q ? t('guideOpenedSr').replace('{n}', String(q.asked)).replace('{total}', String(q.of)).replace('{question}', t(q.question.word)) : '';
  const nameOf = (p: GuidePick): string => {
    const f = factsOf(p);
    if (!f.presetLabel) return t('guideBlank');
    return f.structureName ? t('guideInThePlan').replace('{preset}', f.presetLabel).replace('{structure}', t(f.structureName)) : f.presetLabel;
  };
  const noteOf = (p: GuidePick): { name: string; note: PresetNote }[] => {
    const out: { name: string; note: PresetNote }[] = [];
    const f = factsOf(p);
    const pn = p.preset ? PRESET_NOTES[p.preset] : undefined;
    if (pn && f.presetLabel) out.push({ name: f.presetLabel, note: pn });
    const sn = p.structure ? STRUCTURE_NOTES[p.structure as keyof typeof STRUCTURE_NOTES] : undefined;
    if (sn && f.structureName) out.push({ name: t(f.structureName), note: sn });
    return out;
  };

  // ---- the three bodies
  let body;
  if (note && landing) {
    const notes = noteOf(landing.pick);
    body = (
      <div className="help-step guide-step" key="note" data-still="true" data-guide-view="note">
        <div className="help-kicker">{t('guideKicker')}</div>
        {notes.map((n) => (
          <div key={n.name} className="guide-note" data-guide-note={n.name}>
            <h2 className="help-q">{n.name}</h2>
            {NOTE_LINES.map(({ part, label }) => {
              const k = n.note[part];
              if (!k) return null;
              return <p key={part} className="guide-note-line" data-note-part={part}>{label && <><strong>{t(label)}</strong>{': '}</>}{part === 'line' ? <strong>{emph(t(k))}</strong> : emph(t(k))}</p>;
            })}
          </div>
        ))}
        <div className="help-foot guide-foot"><button type="button" className="help-back guide-back" data-guide-note-back onClick={() => setNote(null)}>{t('guideNoteBack')}</button><button type="button" className="guide-close" data-guide-close onClick={onClose}>{t('guideClose')}</button></div>
      </div>
    );
  } else if (landing) {
    const f = factsOf(landing.pick);
    const hasNote = noteOf(landing.pick).length > 0;
    const parts = f.parts === 1 ? t('guidePartsOne') : t('guidePartsMany');
    const rows = f.planRows === 1 ? t('guidePlanRowsOne') : t('guidePlanRowsMany');
    const facts = [f.parts ? parts.replace('{n}', String(f.parts)) : '', f.planRows ? rows.replace('{n}', String(f.planRows)) : ''].filter(Boolean).join(' · ');
    const altName = landing.alt ? nameOf(landing.alt) : '';
    body = (
      <div className="help-step guide-step" key={landing.blank ? 'blank' : 'landing'} data-still="true" data-guide-view="landing">
        <div className="help-kicker">{t('guideKicker')}</div>
        {said.length > 0 && <p className="guide-said" data-guide-said="">{t('guideYouSaid').replace('{said}', said.map((w) => t(w)).join(' · '))}</p>}
        {landing.blank ? (
          <div className="guide-card" data-guide-pick="blank">
            <p className="guide-card-line">{t('guideBlankLine')}</p>
            <div className="guide-card-act"><button type="button" className="guide-start" data-guide-start onClick={() => onStart(BLANK)}>{t('guideStart')}</button></div>
          </div>
        ) : (
          <div className="guide-card" data-guide-pick={landing.pick.preset ?? ''} data-guide-structure={landing.pick.structure ?? ''}>
            <div className="guide-card-name">{nameOf(landing.pick)}</div>
            <div className="guide-card-facts">
              <span>{facts}</span>
              {hasNote && <button type="button" className="guide-why" data-guide-why aria-label={t('reorgPreNoteLabel').replace('{name}', nameOf(landing.pick))} onClick={() => setNote('pick')}>?</button>}
            </div>
            <div className="guide-card-act"><button type="button" className="guide-start" data-guide-start data-guide-kind={kindOf(landing.pick)} onClick={() => onStart(landing.pick)}>{t('guideStart')}</button></div>
          </div>
        )}
        {landing.alt && (
          <div className="guide-or" data-guide-alt={landing.alt.preset ?? ''}>
            <span><span className="guide-or-word">{t('guideOr')}</span> {altName}</span>
            <button type="button" className="guide-start guide-start-small" data-guide-start-alt onClick={() => onStart(landing.alt as GuidePick)}>{t('guideStart')}</button>
          </div>
        )}
        {!landing.blank && (
          <div className="guide-or" data-guide-blank="">
            <span><span className="guide-or-word">{t('guideOr')}</span> {t('guideBlank')}</span>
            <button type="button" className="guide-start guide-start-small" data-guide-start-blank onClick={() => onStart(BLANK)}>{t('guideStart')}</button>
          </div>
        )}
        <div className="help-foot guide-foot"><button type="button" className="help-back guide-back" data-guide-back onClick={back}>{t('guideBack')}</button><button type="button" className="guide-close" data-guide-close onClick={onClose}>{t('guideClose')}</button></div>
      </div>
    );
  } else if (q) {
    const first = path.length === 0;
    const shown = first && more ? [...q.question.answers, ...q.question.more] : q.question.answers;
    body = (
      <div className="help-step guide-step" key={stepKey} data-still="true" data-guide-view="question" data-guide-question={q.question.id}>
        <div className="guide-head"><span className="help-kicker">{t('guideKicker')}</span><span className="guide-stepof" data-guide-stepof="">{t('guideStepOf').replace('{n}', String(q.asked)).replace('{total}', String(total))}</span></div>
        <h2 className="help-q guide-q">{t(q.question.word)}</h2>
        <div className="guide-answers" role="group" aria-label={t(q.question.word)} data-count={shown.length} onKeyDown={keys}>
          {shown.map((a) => (
            <button key={a.id} type="button" className="guide-ans" data-guide-option={a.id} onClick={() => choose(a)}>{t(a.word)}</button>
          ))}
        </div>
        <div className="help-foot guide-foot">
          {!first && <button type="button" className="help-back guide-back" data-guide-back onClick={back}>{t('guideBack')}</button>}
          {first && !more && q.question.more.length > 0 && <button type="button" className="guide-else" data-guide-more aria-expanded="false" onClick={() => setMore(true)}>{t('guideSomethingElse')}</button>}
          {first && <button type="button" className="guide-else" data-guide-not-sure onClick={() => setNotSure(true)}>{t('guideNotSure')}</button>}
          <button type="button" className="guide-close" data-guide-close onClick={onClose}>{t('guideClose')}</button>
        </div>
      </div>
    );
  } else {
    body = null;
  }

  return createPortal(
    <div className="help-backdrop guide-backdrop" role="presentation" onClick={onClose}>
      <div ref={rootRef} className={`help-panel help-${variant} guide-panel`} role="dialog" aria-modal="true" aria-label={t('guideDialogLabel')} data-guide="" data-guide-theme={variant} data-still={still ? 'true' : 'false'} onClick={(e) => e.stopPropagation()}>
        {variant === 'diagnostic' && <><i className="help-br a" /><i className="help-br b" /><i className="help-br c" /><i className="help-br d" /></>}
        <div className="guide-sr" role="status" aria-live="polite">{srLine}</div>
        {body}
      </div>
    </div>,
    document.body,
  );
}
