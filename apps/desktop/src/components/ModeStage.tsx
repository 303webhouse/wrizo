import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import type { EditorMode } from './ForwardOnlyEditor';
import { useChromeDissolve } from './useChromeDissolve';
import { useWritingSettings, setWritingSettings } from '../store/writingSettings';
import type { ProgressMetric, FadeDepth } from '../store/writingSettings';
import { ChromeHandle } from './WritingShell';

// Mode-aware editor (Phase 2-3) — the writing studio chrome around the editor,
// built to the prototype (apps/desktop/scratch/wrizo-modes-hybrid.html):
//
//   • left rail   — capture (Journal) / tools (Drafting) FRAMES (stub panels)
//   • right rail  — AI: SEALED in Journal, OPEN elsewhere; drawer-open animation
//                   when leaving Journal ("a tool brought onto the desk")
//   • format/pen bar — working B/I/U/list/indent in Drafting; 3 inks in Journal
//   • glow + progress — ambient ember tied to progress (eased); the bar stays
//                   visible while writing, the glow blooms as the chrome dissolves
//   • settings gear — Progress / Fade depth / Top bar / Typewriter (persisted)
//   • typewriter fade — history scrolls up and fades through a top gradient as the
//                   writer moves down the draft; the active line holds at ~62%.
//
// The editor is passed in as a render-prop child so it stays owned by the host
// (QuickSprint): ModeStage hands it `noteWrite` (drives the dissolve) and the
// current pen ink. The dissolve engine also drives WritingSession, so the global
// header recedes in step; `onDissolveChange` lets the host fade its own top bar.

const WORD_GOAL = 250;
const TIME_GOAL_MS = 25 * 60 * 1000;
const PEN_INKS = ['#1a0f06', '#b8231f', '#1f4fb8']; // black-brown, red, blue
const TYPEWRITER_BAND = 0.62; // keep the active line at ~62% of the viewport

interface RailDef { heading: string; items: string[]; ai: 'sealed' | 'open'; tools: 'pen' | 'format'; }
const RAILS: Record<EditorMode, RailDef> = {
  journal:  { heading: 'capture', items: ['Spark deck', 'Fragments', 'Send → Drawer'], ai: 'sealed', tools: 'pen' },
  drafting: { heading: 'sections', items: ['Structure', 'Pages', 'Notes & Worldbuilding', 'Find'], ai: 'open', tools: 'format' },
};

interface Props {
  mode: EditorMode;
  words: number;
  surfaceRef?: React.RefObject<HTMLDivElement>; // J5 ambient warmth target (the page)
  focused?: boolean;                            // editor focus → page glow
  pageTitle?: string;
  onDissolveChange?: (dissolved: boolean) => void;
  children: (api: { noteWrite: () => void; penColor?: string }) => React.ReactNode;
}

export function ModeStage({ mode, words, surfaceRef, focused, pageTitle, onDissolveChange, children }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const settings = useWritingSettings();
  const { dissolved, noteWrite: engineNote, resurface } = useChromeDissolve({ surface: 'sprint', rootRef: stageRef });

  const firstWriteRef = useRef<number | null>(null);
  const noteWrite = useCallback(() => {
    if (firstWriteRef.current === null) firstWriteRef.current = Date.now();
    engineNote();
  }, [engineNote]);

  const [pen, setPen] = useState(PEN_INKS[0]);
  const [gearOpen, setGearOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [, tick] = useReducer((n: number) => n + 1, 0);

  // Tell the host (top-bar fade) whenever the dissolve flips.
  useEffect(() => { onDissolveChange?.(dissolved); }, [dissolved, onDissolveChange]);

  // Drawer-open: leaving Journal slides the AI panel onto the desk; only that
  // direction (Journal → other), per the prototype.
  const prevModeRef = useRef(mode);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (prevModeRef.current === 'journal' && mode !== 'journal') {
      setDrawerOpen(true);
      timer = setTimeout(() => setDrawerOpen(false), 700);
    }
    prevModeRef.current = mode;
    return () => { if (timer) clearTimeout(timer); };
  }, [mode]);

  // Tick once a second while a time readout is live (the Time progress metric, or
  // the opt-in session timer) so the bar / clock advance.
  useEffect(() => {
    if (settings.progress !== 'time' && !settings.timer) return;
    const i = setInterval(() => tick(), 1000);
    return () => clearInterval(i);
  }, [settings.progress, settings.timer]);

  // Typewriter fade: keep the caret/active line at ~62% of the scroll viewport, so
  // earlier lines ride up through the top gradient and fade. Driven by a mutation
  // observer (covers typing, strikes, IME, and free edits) + input, on a rAF.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !settings.typewriter) return;
    let raf = 0;
    const band = () => {
      const ed = el.querySelector('.forward-only-editor') as HTMLElement | null;
      let caretBottom: number | null = null;
      const sel = window.getSelection();
      if (sel && sel.rangeCount && ed && sel.anchorNode && ed.contains(sel.anchorNode)) {
        const rects = sel.getRangeAt(0).getClientRects();
        const r = rects[rects.length - 1];
        if (r && r.height) caretBottom = r.bottom;
      }
      if (caretBottom === null && ed) {
        const last = ed.lastElementChild as HTMLElement | null;
        caretBottom = (last ?? ed).getBoundingClientRect().bottom;
      }
      if (caretBottom === null) return;
      const cRect = el.getBoundingClientRect();
      const within = caretBottom - cRect.top;
      const target = el.clientHeight * TYPEWRITER_BAND;
      const delta = within - target;
      if (Math.abs(delta) > 1) el.scrollTop += delta;
    };
    const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(band); };
    const mo = new MutationObserver(schedule);
    mo.observe(el, { childList: true, subtree: true, characterData: true });
    el.addEventListener('input', schedule);
    schedule();
    return () => { mo.disconnect(); el.removeEventListener('input', schedule); cancelAnimationFrame(raf); };
  }, [settings.typewriter]);

  // Progress + eased glow.
  const wordsFrac = Math.min(1, words / WORD_GOAL);
  let displayFrac = wordsFrac;
  let label = `${words} word${words === 1 ? '' : 's'}`;
  let metricLabel = 'words';
  if (settings.progress === 'time') {
    const t = firstWriteRef.current ? Date.now() - firstWriteRef.current : 0;
    displayFrac = Math.min(1, t / TIME_GOAL_MS);
    const s = Math.floor(t / 1000);
    label = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    metricLabel = 'session';
  }
  const m = Math.pow(displayFrac, 0.55);

  // Opt-in session timer (incentive layer): elapsed since the first keystroke.
  const elapsedMs = firstWriteRef.current ? Date.now() - firstWriteRef.current : 0;
  const es = Math.floor(elapsedMs / 1000);
  const elapsedClock = `${Math.floor(es / 60)}:${String(es % 60).padStart(2, '0')}`;

  const focusEditor = () => (scrollRef.current?.querySelector('.forward-only-editor') as HTMLElement | null)?.focus();
  const exec = (cmd: string) => { focusEditor(); try { document.execCommand(cmd, false); } catch { /* execCommand unsupported */ } };
  const choosePen = (ink: string) => { setPen(ink); focusEditor(); };

  const rail = RAILS[mode];
  const stageStyle = { ['--m' as string]: m.toFixed(3) } as React.CSSProperties;

  return (
    <div
      ref={stageRef}
      className="mode-stage"
      data-writing={dissolved ? 'true' : 'false'}
      data-fade={settings.fadeDepth}
      style={stageStyle}
    >
      {/* Always-discoverable reveal handle (top-left ember dot). */}
      <ChromeHandle onReveal={() => resurface(true)} />

      {/* Ambient ember — blooms as the rails dissolve; eased with progress. */}
      <div aria-hidden="true" className="mode-glow" />

      {/* Settings gear (top-right). */}
      <div className="mode-gear-wrap mode-dissolve">
        <button type="button" className="mode-gear" aria-label="Writing settings" aria-expanded={gearOpen} onClick={() => setGearOpen(o => !o)}>⚙</button>
        {gearOpen && <SettingsPanel settings={{ progress: settings.progress, fadeDepth: settings.fadeDepth, timer: settings.timer, typewriter: settings.typewriter }} />}
      </div>

      <div className="mode-row">
        {/* LEFT rail — capture (Journal) / tools (Drafting). Frames only. */}
        <aside className="mode-rail left mode-dissolve" aria-label={`${rail.heading} rail`}>
          <div className="mode-rail-h">{rail.heading}</div>
          {rail.items.map(it => <div key={it} className="mode-rail-item">{it}</div>)}
        </aside>

        <div className="mode-pagecol">
          {/* Format / pen bar (top of page) — chrome, dissolves on write. */}
          <div className="mode-bar mode-dissolve" role="toolbar" aria-label={rail.tools === 'pen' ? 'Pen' : 'Format'}>
            {rail.tools === 'pen' ? (
              <>
                <span className="mode-tlabel">ink</span>
                {PEN_INKS.map(ink => (
                  <button
                    key={ink}
                    type="button"
                    className={`mode-swatch${pen === ink ? ' active' : ''}`}
                    style={{ background: ink }}
                    aria-label={`Ink ${ink}`}
                    aria-pressed={pen === ink}
                    onClick={() => choosePen(ink)}
                  />
                ))}
                <button type="button" className="mode-nib" title="Nib styles — coming soon">nib · fine ▾</button>
              </>
            ) : (
              <>
                <span className="mode-tlabel">format</span>
                <button type="button" className="mode-tbtn" title="Bold" onClick={() => exec('bold')}><b>B</b></button>
                <button type="button" className="mode-tbtn" title="Italic" onClick={() => exec('italic')}><i>I</i></button>
                <button type="button" className="mode-tbtn" title="Underline" onClick={() => exec('underline')}><u>U</u></button>
                <span className="mode-tdiv" />
                <button type="button" className="mode-tbtn" title="Heading — coming soon">H</button>
                <button type="button" className="mode-tbtn" title="Quote — coming soon">&ldquo;</button>
                <button type="button" className="mode-tbtn" title="Bulleted list" onClick={() => exec('insertUnorderedList')}>&bull;</button>
                <button type="button" className="mode-tbtn" title="Outdent" onClick={() => exec('outdent')}>&#8676;</button>
                <button type="button" className="mode-tbtn" title="Indent" onClick={() => exec('indent')}>&#8677;</button>
                <button type="button" className="mode-tbtn mode-tmore" title="More — coming soon">⋯ more</button>
              </>
            )}
          </div>

          {/* The lit page. Fixed height; the editor scrolls inside (typewriter). */}
          <div
            ref={surfaceRef}
            className={`mode-page${focused ? ' focused' : ''}`}
          >
            <div
              aria-hidden="true"
              className="sprint-warmth-overlay"
              style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', borderRadius: 'var(--radius-md)', background: 'var(--ember)', opacity: 'calc(var(--sprint-warmth, 0) * var(--ambient-intensity))' }}
            />
            {pageTitle && <div className="mode-page-title">{pageTitle}</div>}
            <div
              ref={scrollRef}
              className="mode-scroll"
              data-typewriter={settings.typewriter ? 'true' : 'false'}
              onClick={focusEditor}
            >
              {children({ noteWrite, penColor: rail.tools === 'pen' ? pen : undefined })}
            </div>
            <div className="mode-wordcount mode-dissolve">{words} words</div>
          </div>

          {/* Incentive layer — progress bar + optional session timer. Stays
              visible while writing (never carries the dissolve class). */}
          {(settings.progress !== 'off' || settings.timer) && (
            <div className="mode-progress">
              {settings.progress !== 'off' && (
                <div className="mode-ptrack"><div className="mode-pfill" style={{ width: `${(displayFrac * 100).toFixed(1)}%` }} /></div>
              )}
              <div className="mode-pmeta">
                <span>{settings.progress !== 'off' ? label : ''}</span>
                <span className="mode-pmetric">
                  {settings.timer && <span className="mode-timer" aria-label="Session time">⏱ {elapsedClock}</span>}
                  {settings.progress !== 'off' && <span>{metricLabel}</span>}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT rail — AI frame. Sealed in Journal; open elsewhere. */}
        {rail.ai === 'sealed' ? (
          <aside className="mode-rail right sealed mode-dissolve" aria-label="AI sealed in Journal">
            <div className="mode-lock" aria-hidden="true">▦</div>
            <div className="mode-seal-note">journal is yours alone</div>
          </aside>
        ) : (
          <aside className={`mode-rail right mode-dissolve${drawerOpen ? ' drawer-open' : ''}`} aria-label="AI assist">
            <div className="mode-rail-h">assist</div>
            <div className="mode-ai-surface">AI lives here in {mode === 'drafting' ? 'Draft' : 'Free write'} — frame only for now</div>
          </aside>
        )}
      </div>
    </div>
  );
}

// The gear menu — the writing-screen chrome settings, persisted.
function SettingsPanel({ settings }: { settings: { progress: ProgressMetric; fadeDepth: FadeDepth; timer: boolean; typewriter: boolean } }) {
  return (
    <div className="mode-settings" role="menu">
      <h4>settings</h4>
      <Seg label="Progress" value={settings.progress} opts={[['words', 'Words'], ['time', 'Time'], ['off', 'Off']]} onPick={v => setWritingSettings({ progress: v as ProgressMetric })} />
      <Seg label="Recede depth" value={settings.fadeDepth} opts={[['partial', 'Partial'], ['full', 'Full']]} onPick={v => setWritingSettings({ fadeDepth: v as FadeDepth })} />
      <Seg label="Timer" value={settings.timer ? 'on' : 'off'} opts={[['on', 'On'], ['off', 'Off']]} onPick={v => setWritingSettings({ timer: v === 'on' })} />
      <Seg label="Typewriter" value={settings.typewriter ? 'on' : 'off'} opts={[['on', 'On'], ['off', 'Off']]} onPick={v => setWritingSettings({ typewriter: v === 'on' })} />
      <div className="mode-settings-hint">Type to dissolve the chrome. Stop, and after a pause it returns slowly. Reach an edge or press Esc to summon it back.</div>
    </div>
  );
}

function Seg({ label, value, opts, onPick }: { label: string; value: string; opts: [string, string][]; onPick: (v: string) => void }) {
  return (
    <div className="mode-crow">
      <span>{label}</span>
      <div className="mode-seg">
        {opts.map(([v, txt]) => (
          <button key={v} type="button" className={value === v ? 'on' : ''} onClick={() => onPick(v)}>{txt}</button>
        ))}
      </div>
    </div>
  );
}
