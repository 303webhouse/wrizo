import { useEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useDeskLexicon, type DeskTermId } from '../store/deskLexicon';
import { useTheme } from '../store/theme';
import { prefersReducedMotion, useAmbianceDial } from '../store/ambianceDial';
import { DECKS } from '../decks/library';
import { blocksFor } from '../decks/formCounts';
import { Q1, Q3, q2Options, pickFor, q3Landing, whyKeyFor, type HelpChoice, type HelpLanding } from '../decks/helpMeChoose';

// W4 - "HELP ME CHOOSE". The panel over the deck library: Arbor's olive librarian (frames 08), Flux's RUN DIAGNOSTIC (frame 09), and a plain, square, theme-tokened panel for every other theme (Machina's Intake,
// Nomad's Scout, Volant's one dialog - until each has a mockup). The LOGIC is decks/helpMeChoose.ts (a static table: no model, no scoring, the same answers give the same result); this file is the dress and the
// press-by-press flow. Three questions, ONE AT A TIME (Q2's answers depend on Q1; poems have no Q2), then the result: the pick and one alternative, each ONE press from dealing, and "browse" to the full library.
//
// LAWS: it NEVER opens itself (a host mounts it behind a press); NOTHING is stored (state is local to this mount - no localStorage, no sync key, no draft); Esc closes it and focus RETURNS to what opened it; the
// answers advance with a short slide (<= 300 ms), which is a cut under reduced motion or Ambiance 0. The questions and answers are deck content: every theme reads the same words, only the chrome words
// (kicker, Begin / [LOAD], Browse...) take theme overrides.
export interface HelpMeChooseProps {
  /** "Begin" / [LOAD]: deal this choice. The landing is Q3's (decks/helpMeChoose.ts q3Landing, behind the WALK_SHIPPED switch). */
  onBegin: (choice: HelpChoice, landing: HelpLanding) => void;
  /** "Browse the shelves" / BROWSE ALL STACKS: open the full library. */
  onBrowse: () => void;
  onClose: () => void;
  /** The door that opened this panel: focus returns to it on close (a click that did not focus the button - a script, assistive tech - leaves document.activeElement empty at mount). */
  returnFocusTo?: HTMLElement | null;
  /** Machina only: Intake REPLACES the content of the panel it is mounted in (the Forms dialog) instead of stacking over it as its own modal - no portal, no backdrop. The host restores focus; Back / Esc / ALL FORMS return to Forms. */
  embedded?: boolean;
}

type Variant = 'librarian' | 'diagnostic' | 'intake' | 'plain';
const key = (prefix: 'helpA' | 'helpH', id: string): DeskTermId => (prefix + id.split(/[^A-Za-z0-9]+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join('')) as DeskTermId;
const coverKey = (deckId: string): DeskTermId => ('helpCover' + deckId.split(/[^A-Za-z0-9]+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join('')) as DeskTermId;

// Line emblems (stroked in currentColor, 64 x 64) - the frames' own style. Q2's fiction answers wear the frames' four (a forked path, a compass, scales, an eye) plus two drawn in the same hand; the other answer sets are
// text-only tiles, where no emblem fits.
const EMBLEM: Record<string, ReactNode> = {
  'person-change': <><path d="M32 60V38" /><path d="M32 38L18 20M32 38L46 20" /><path d="M18 20L12 8M46 20L54 10" strokeDasharray="2 4" /><circle cx="32" cy="54" r="3.2" fill="currentColor" /><path d="M32 57.5v4" /></>,
  'events-pressure': <><path d="M6 54h14V42h14V30h14V18h8" /><path d="M6 58h52" /><circle cx="56" cy="18" r="2.6" fill="currentColor" /></>,
  'world-system': <><circle cx="32" cy="34" r="22" /><circle cx="32" cy="34" r="15" strokeDasharray="1.5 3" /><path d="M32 8v52M6 34h52" /><path d="M32 18l4 16-4 16-4-16z" fill="currentColor" fillOpacity=".35" /></>,
  'relationship-cast': <><circle cx="24" cy="32" r="14" /><circle cx="40" cy="32" r="14" /><circle cx="32" cy="32" r="2.4" fill="currentColor" /></>,
  'image-voice': <><path d="M6 34C14 20 22 14 32 14S50 20 58 34C50 48 42 54 32 54S14 48 6 34Z" /><circle cx="32" cy="34" r="9" /><circle cx="32" cy="34" r="3.5" fill="currentColor" /></>,
  position: <><path d="M32 10v46M18 58h28M14 20h36" /><path d="M14 20l-8 16h16zM50 20l-8 16h16z" /><circle cx="32" cy="10" r="2.5" fill="currentColor" /></>,
};
const DECK_EMBLEM: Record<string, ReactNode> = {
  'three-act': <><path d="M8 56V34a8 8 0 0 1 16 0v22M24 56V26a8 8 0 0 1 16 0v30M40 56V34a8 8 0 0 1 16 0v22" /><path d="M4 56h56" /></>,
  'story-circle': <><circle cx="32" cy="32" r="22" /><path d="M32 10v6M54 32h-6M32 54v-6M10 32h6" /><path d="M24 24l8 8 8-8" /></>,
  'hero-journey': <><path d="M6 50C16 50 18 20 32 20S48 50 58 50" /><path d="M6 56h52" /><circle cx="32" cy="20" r="3" fill="currentColor" /></>,
  worldbuilding: EMBLEM['world-system'],
  'character-study': EMBLEM['relationship-cast'],
  'scene-sequel': <><rect x="8" y="16" width="22" height="32" /><rect x="34" y="16" width="22" height="32" /><path d="M30 32h4" /></>,
  'feature-screenplay': <><rect x="10" y="12" width="44" height="40" /><path d="M10 22h44M10 42h44M22 12v10M34 12v10M46 12v10M22 42v10M34 42v10M46 42v10" /></>,
  'argument-essay': EMBLEM.position,
  'research-paper': <><path d="M16 8h32v48H16z" /><path d="M24 20h16M24 28h16M24 36h10" /></>,
  thesis: <><path d="M10 52h44M14 52V28M26 52V20M38 52V28M50 52V20" /><path d="M8 20h48" /></>,
  'business-proposal': <><path d="M8 20h48v32H8z" /><path d="M24 20v-6h16v6M8 34h48" /></>,
  grant: <><circle cx="32" cy="32" r="22" /><path d="M32 18v28M24 26c0-4 16-4 16 0s-16 4-16 8 16 4 16 0" /></>,
  'feature-story': <><path d="M10 12h44M10 22h28M10 32h44M10 42h44M10 52h28" /><path d="M44 22h10v6H44z" /></>,
  'from-my-pages': <><path d="M14 8h26l10 10v38H14z" /><path d="M40 8v10h10" /><path d="M22 30h20M22 38h20M22 46h12" /></>,
};
const GENERIC_EMBLEM = DECK_EMBLEM['from-my-pages'];

function Emblem({ children, size }: { children: ReactNode; size: number }) {
  return <svg viewBox="0 0 64 64" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>;
}

// the faint hand-drawn rule under the question (the frames' ink-scratch)
function Scratch() {
  return (
    <svg className="help-scratch" viewBox="0 0 300 14" width="300" height="14" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" aria-hidden="true">
      <path d="M2 8C30 6 46 9 70 7S118 5 150 7.5 210 9.5 240 7 280 6 298 7" /><path d="M118 10c6-1 10 0 14 .5" opacity=".6" /><circle cx="150" cy="7.4" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function HelpMeChoose({ onBegin, onBrowse, onClose, returnFocusTo, embedded = false }: HelpMeChooseProps) {
  const { t } = useDeskLexicon();
  const theme = useTheme();
  const dial = useAmbianceDial();
  const variant: Variant = theme === 'plateau' ? 'librarian' : theme === 'flux' ? 'diagnostic' : theme === 'machina' ? 'intake' : 'plain';
  const still = variant === 'intake' || prefersReducedMotion() || dial === 0;   // Machina: no motion, cuts only
  // Machina's Intake: which field's list is open under it (null = none). The first unanswered field opens by itself once the panel is up (it is already open by the writer's press), then the next after each answer.
  const [openField, setOpenField] = useState<0 | 1 | 2 | null>(0);
  const [q1, setQ1] = useState<string | null>(null);
  const [q2, setQ2] = useState<string | null>(null);
  const [q3, setQ3] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  // focus: remember what opened this, give it back on close; Esc closes (and nothing else hears it)
  useEffect(() => {
    openerRef.current = returnFocusTo ?? (document.activeElement as HTMLElement | null) ?? null;
    return () => { if (embedded) return; const el = openerRef.current; if (el && el.isConnected) el.focus(); };   // embedded: the opener is unmounted while Intake shows - the host puts focus back
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); onClose(); } };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const hasQ2 = q1 != null && q2Options(q1).length > 0;
  const step: 0 | 1 | 2 | 3 = q1 == null ? 0 : hasQ2 && q2 == null ? 1 : q3 == null ? 2 : 3;   // 3 = the result
  const answered = (q1 != null ? 1 : 0) + (q2 != null || (q1 != null && !hasQ2) ? 1 : 0) + (q3 != null ? 1 : 0);

  // each new step lands its first answer under focus (a keyboard writer never has to hunt for it)
  useEffect(() => {
    if (variant === 'intake') return;   // Intake keeps its own focus (the open field's list, then the Create Agenda press)
    const first = rootRef.current?.querySelector<HTMLElement>('[data-help-option], [data-help-begin]');
    first?.focus();
  }, [step]);

  // Machina's Intake focus: the open field's list lands on its chosen (else first) answer; the result lands on Create Agenda. Nothing else moves focus.
  useEffect(() => {
    if (variant !== 'intake') return;
    const root = rootRef.current;
    if (!root) return;
    const el = step === 3 ? root.querySelector<HTMLElement>('[data-help-begin]') : openField != null ? (root.querySelector<HTMLElement>('[data-help-list] [aria-selected="true"]') ?? root.querySelector<HTMLElement>('[data-help-list] [data-help-option]')) : null;
    el?.focus();
  }, [variant, step, openField]);

  const result = useMemo(() => (step === 3 && q1 != null ? pickFor(q1, hasQ2 ? q2 : null) : null), [step, q1, q2, hasQ2]);
  const landing = q3 != null ? q3Landing(q3) : null;
  const deckName = (c: HelpChoice) => { const d = DECKS.find((x) => x.id === c.deck); return d ? t(d.nameTerm) : c.deck; };

  const options: readonly string[] = step === 0 ? Q1 : step === 1 && q1 ? q2Options(q1) : step === 2 ? Q3 : [];
  const prompt: DeskTermId = step === 0 ? 'helpQ1Prompt' : step === 1 ? 'helpQ2Prompt' : 'helpQ3Prompt';
  const choose = (id: string) => { if (step === 0) { setQ1(id); setQ2(null); setQ3(null); } else if (step === 1) setQ2(id); else setQ3(id); };
  const back = () => { if (step === 3) setQ3(null); else if (step === 2) { if (hasQ2) setQ2(null); else setQ1(null); } else if (step === 1) setQ1(null); };
  const begin = (c: HelpChoice) => { if (landing) onBegin(c, landing); };
  // Intake: answer one FIELD (all three are on screen at once). The same state, the same resets as choose(); the next unanswered field's list opens, none when all three are set (the result appears in place).
  const chooseField = (f: 0 | 1 | 2, id: string) => {
    let n1 = q1, n2 = q2, n3 = q3;
    if (f === 0) { n1 = id; n2 = null; n3 = null; setQ1(id); setQ2(null); setQ3(null); } else if (f === 1) { n2 = id; setQ2(id); } else { n3 = id; setQ3(id); }
    const has2 = n1 != null && q2Options(n1).length > 0;
    setOpenField(n1 == null ? 0 : has2 && n2 == null ? 1 : n3 == null ? 2 : null);
  };
  const intakeBack = () => { setQ3(null); setOpenField(2); };
  const listKeys = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const rows = [...e.currentTarget.querySelectorAll<HTMLElement>('[data-help-option]')];
    const at = rows.indexOf(document.activeElement as HTMLElement);
    const next = rows[Math.max(0, Math.min(rows.length - 1, at + (e.key === 'ArrowDown' ? 1 : -1)))];
    if (next) { e.preventDefault(); next.focus(); }
  };

  const dots = (
    <div className="help-dots" aria-hidden="true">{[0, 1, 2].map((i) => <i key={i} className={i < answered ? 'f' : undefined} />)}</div>
  );
  const earlier = q1 != null && step < 3 ? (
    <div className="help-made">{t('helpMaking')} <b>{t(key('helpA', q1))}</b>{q2 != null && step === 2 ? <>, <b>{t(key('helpA', q2))}</b></> : null}</div>
  ) : null;

  let body: ReactNode;
  if (variant === 'librarian' && step < 3) {
    body = (
      <div className="help-step" key={step} data-still={still ? 'true' : 'false'}>
        <div className="help-kicker">{t('helpKicker')}</div>
        {dots}
        {earlier}
        <h2 className="help-q">{t(prompt)}</h2>
        <Scratch />
        <div className="help-tiles" role="group" aria-label={t(prompt)} data-count={options.length}>
          {options.map((id) => (
            <button key={id} type="button" className="help-tile" data-help-option={id} onClick={() => choose(id)}>
              {step === 1 && EMBLEM[id] ? <span className="help-emblem"><Emblem size={58}>{EMBLEM[id]}</Emblem></span> : null}
              <span className="help-tile-name">{t(key('helpA', id))}</span>
              <span className="help-tile-hint">{t(key('helpH', id))}</span>
            </button>
          ))}
        </div>
      </div>
    );
  } else if (variant === 'librarian' && result) {
    const pick = result.pick;
    body = (
      <div className="help-step help-result" key="result" data-still={still ? 'true' : 'false'}>
        <div className="help-book" aria-hidden="true">
          <span className="help-emblem"><Emblem size={80}>{DECK_EMBLEM[pick.deck] ?? GENERIC_EMBLEM}</Emblem></span>
          <span className="help-book-title">{deckName(pick)}</span>
          <span className="help-book-sub">{t(coverKey(pick.deck))}</span>
        </div>
        <div className="help-right">
          <div className="help-kicker">{t('helpPickKicker')}</div>
          <p className="help-why">{t(whyKeyFor(pick) as DeskTermId)}</p>
          <Scratch />
          <button type="button" className="help-begin" data-help-begin onClick={() => begin(pick)}>{t('helpBegin')}</button>
          {result.alt && (
            <button type="button" className="help-alt" data-help-alt onClick={() => begin(result.alt as HelpChoice)}>
              <span className="help-spine" aria-hidden="true"><span>{deckName(result.alt)}</span></span>
              <span className="help-alt-words">{t('helpAlt')} <b>{deckName(result.alt)}</b><br />{t(coverKey(result.alt.deck))}</span>
            </button>
          )}
          <button type="button" className="help-browse" data-help-browse onClick={onBrowse}>{t('helpBrowse')} →</button>
        </div>
      </div>
    );
  } else if (variant === 'diagnostic') {
    const lines: { id: DeskTermId; chosen: string | null; opts: readonly string[]; current: boolean; reset: () => void }[] = [
      { id: 'helpQ1Prompt', chosen: q1, opts: Q1, current: step === 0, reset: () => { setQ1(null); setQ2(null); setQ3(null); } },
      ...(q1 != null && hasQ2 ? [{ id: 'helpQ2Prompt' as DeskTermId, chosen: q2, opts: q2Options(q1), current: step === 1, reset: () => { setQ2(null); setQ3(null); } }] : []),
      ...(q1 != null && (!hasQ2 || q2 != null) ? [{ id: 'helpQ3Prompt' as DeskTermId, chosen: q3, opts: Q3 as readonly string[], current: step === 2, reset: () => setQ3(null) }] : []),
    ];
    body = (
      <div className="help-step" key={step === 3 ? 'result' : step} data-still={still ? 'true' : 'false'}>
        <div className="help-kicker">{t('helpKicker')}</div>
        {lines.map((l) => (
          <div key={l.id} className="help-line">
            <span className="help-prompt">&gt; {t(l.id)}</span>
            <span className="help-opts" role="group" aria-label={t(l.id)}>
              {l.chosen != null && !l.current
                ? <button type="button" className="help-opt help-opt-sel" onClick={l.reset} aria-label={`${t(l.id)} ${t(key('helpA', l.chosen))}`}>{t(key('helpA', l.chosen))}</button>
                : l.opts.map((id) => <button key={id} type="button" className="help-opt" data-help-option={id} onClick={() => choose(id)}>{t(key('helpA', id))}</button>)}
            </span>
          </div>
        ))}
        <div className="help-progress" aria-hidden="true">{[0, 1, 2].map((i) => <i key={i} data-on={i < answered ? 'true' : 'false'} />)}</div>
        {result && (
          <div className="help-resultlines">
            <div className="help-rline"><span>{t('helpPickKicker')}: {deckName(result.pick).toUpperCase()}</span><i className="help-leader" aria-hidden="true" /><button type="button" className="help-load" data-help-begin onClick={() => begin(result.pick)}>{t('helpBegin')}</button></div>
            <p className="help-why help-why-line">{t(whyKeyFor(result.pick) as DeskTermId)}</p>
            {result.alt && <div className="help-rline help-rline-alt"><span>{t('helpAlt')}: {deckName(result.alt).toUpperCase()}</span><i className="help-leader" aria-hidden="true" /><button type="button" className="help-load" data-help-alt onClick={() => begin(result.alt as HelpChoice)}>{t('helpBegin')}</button></div>}
          </div>
        )}
        {result && <button type="button" className="help-browse" data-help-browse onClick={onBrowse}>{t('helpBrowse')}</button>}
      </div>
    );
  } else if (variant === 'intake') {
    // MACHINA INTAKE (frames m5 / m6): ONE form, three fields visible at once - DOCUMENT (Q1) / CARRIED BY (Q2, its answers follow Document) / BRIEFING (Q3). An open list sits under its field with the chosen answer marked by the
    // carrier bar. The result appears IN PLACE the moment all three are set (no button asks for it): the answers as a readout, the recommended form, why, Create Agenda, the alternative. The same table; nothing stored.
    const fields: { n: 0 | 1 | 2; slug: string; label: string; ids: readonly string[]; value: string | null; enabled: boolean; na: boolean }[] = [
      { n: 0, slug: 'document', label: t('helpFieldDocument'), ids: Q1, value: q1, enabled: true, na: false },
      { n: 1, slug: 'carried', label: t('helpFieldCarried'), ids: q1 != null ? q2Options(q1) : [], value: q2, enabled: q1 != null && hasQ2, na: q1 != null && !hasQ2 },
      { n: 2, slug: 'briefing', label: t('helpFieldBriefing'), ids: Q3, value: q3, enabled: q1 != null && (!hasQ2 || q2 != null), na: false },
    ];
    const pickDeck = result ? DECKS.find((d) => d.id === result.pick.deck) : undefined;
    const blocks = result && pickDeck ? blocksFor(pickDeck, result.pick.answers) : '';
    body = (
      <div className="help-step" key="intake" data-still="true">
        <div className="help-intake-head">
          <span className="help-kicker">{t('helpKicker')}</span>
          <span className="help-fieldsnote">{answered > 0 ? t('helpFieldsCount').replace('{n}', String(answered)) : t('helpFieldsNote')}</span>
        </div>
        {step < 3 ? fields.map((f) => (
          <div key={f.slug} className="help-field" data-field={f.slug} data-open={openField === f.n ? 'true' : 'false'}>
            <div className="help-field-label">{f.label}</div>
            {f.na ? (
              <div className="help-select help-select-na">{t('helpNoCarried')}</div>
            ) : (
              <button type="button" className="help-select" data-help-field={f.slug} aria-haspopup="listbox" aria-expanded={openField === f.n} disabled={!f.enabled}
                onClick={() => setOpenField(openField === f.n ? null : f.n)}>
                <span className={f.value != null ? 'help-select-val' : 'help-select-ph'}>{f.value != null ? t(key('helpA', f.value)) : t('helpChoose')}</span>
                <span className="help-select-caret" aria-hidden="true">▾</span>
              </button>
            )}
            {openField === f.n && f.enabled && (
              <div className="help-optlist" role="listbox" aria-label={f.label} data-help-list onKeyDown={listKeys}>
                {f.ids.map((id) => (
                  <button key={id} type="button" role="option" aria-selected={id === f.value} className="help-optrow" data-help-option={id} data-chosen={id === f.value ? 'true' : 'false'} onClick={() => chooseField(f.n, id)}>
                    {t(key('helpA', id))}
                  </button>
                ))}
              </div>
            )}
          </div>
        )) : result ? (
          <>
            <div className="help-readout">
              {fields.map((f) => <div key={f.slug} className="help-readout-row"><span className="help-readout-k">{f.label}</span><span className="help-readout-v">{f.value != null ? t(key('helpA', f.value)) : '—'}</span></div>)}
            </div>
            <div className="help-rule" aria-hidden="true" />
            <div className="help-stepof">{t('helpPickKicker')}</div>
            <div className="help-pickline">
              <h2 className="help-q">{deckName(result.pick)}</h2>
              {blocks && <span className="help-blocks">{t('helpBlocksN').replace('{n}', blocks)}</span>}
            </div>
            <p className="help-why">{t(whyKeyFor(result.pick) as DeskTermId)}</p>
            <div className="help-actions">
              <button type="button" className="help-begin" data-help-begin onClick={() => begin(result.pick)}>{t('helpBegin')}</button>
              {result.alt && <button type="button" className="help-alt-plain" data-help-alt onClick={() => begin(result.alt as HelpChoice)}>{t('helpAlt')} {deckName(result.alt)} · {t(coverKey(result.alt.deck))}</button>}
            </div>
          </>
        ) : null}
      </div>
    );
  } else {
    // plain: Nomad's Scout, Volant's one dialog - the same questions in a square, theme-tokened panel
    body = (
      <div className="help-step" key={step === 3 ? 'result' : step} data-still={still ? 'true' : 'false'}>
        <div className="help-kicker">{t('helpKicker')}</div>
        {step < 3 ? (
          <>
            <div className="help-stepof">{t('helpStepOf').replace('{n}', String(Math.min(3, answered + 1)))}</div>
            {earlier}
            <h2 className="help-q">{t(prompt)}</h2>
            <div className="help-list" role="group" aria-label={t(prompt)}>
              {options.map((id) => (
                <button key={id} type="button" className="help-row" data-help-option={id} onClick={() => choose(id)}>
                  <span className="help-row-name">{t(key('helpA', id))}</span>
                  <span className="help-row-hint">{t(key('helpH', id))}</span>
                </button>
              ))}
            </div>
          </>
        ) : result ? (
          <>
            <div className="help-stepof">{t('helpPickKicker')}</div>
            <h2 className="help-q">{deckName(result.pick)}</h2>
            <p className="help-why">{t(whyKeyFor(result.pick) as DeskTermId)}</p>
            <button type="button" className="help-begin" data-help-begin onClick={() => begin(result.pick)}>{t('helpBegin')}</button>
            {result.alt && <button type="button" className="help-alt-plain" data-help-alt onClick={() => begin(result.alt as HelpChoice)}>{t('helpAlt')} {deckName(result.alt)} · {t(coverKey(result.alt.deck))}</button>}
            <button type="button" className="help-browse" data-help-browse onClick={onBrowse}>{t('helpBrowse')} →</button>
          </>
        ) : null}
      </div>
    );
  }

  // Machina embedded: the same panel, in place - no portal, no backdrop (its wrapper is display:contents), so it takes the host dialog's content instead of stacking over it
  const embeddedNow = embedded && variant === 'intake';
  const shell = (node: ReactElement, host: Element) => (embeddedNow ? node : createPortal(node, host));
  return shell(
    <div className={embeddedNow ? 'help-embedded-shell' : 'help-backdrop'} role="presentation" onClick={embeddedNow ? undefined : onClose}>
      <div ref={rootRef} className={`help-panel help-${variant}${embeddedNow ? ' help-embedded' : ''}`} role={embeddedNow ? 'region' : 'dialog'} aria-modal={embeddedNow ? undefined : true} aria-label={t('helpDialogLabel')} data-help-theme={variant} onClick={(e) => e.stopPropagation()}>
        {variant === 'diagnostic' && <><i className="help-br a" /><i className="help-br b" /><i className="help-br c" /><i className="help-br d" /></>}
        {body}
        {variant === 'intake' ? (
          <div className="help-foot help-foot-intake">
            <button type="button" className="help-browse help-browse-foot" data-help-browse onClick={onBrowse}>{t('helpBrowse')} →</button>
            {step === 3 ? <button type="button" className="help-back" onClick={intakeBack}>{t('helpBack')}</button> : embedded && <button type="button" className="help-back" data-help-to-forms onClick={onClose}>{t('helpBack')}</button>}
            <span className="help-esc">{t('helpClose')}</span>
          </div>
        ) : (
          <div className="help-foot">
            {step > 0 && <button type="button" className="help-back" onClick={back}>{t('helpBack')}</button>}
            <span className="help-esc">{t('helpClose')}</span>
            {variant === 'librarian' && step < 3 && <> · <button type="button" className="help-browse help-browse-foot" data-help-browse onClick={onBrowse}>{t('helpBrowse')}</button></>}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
