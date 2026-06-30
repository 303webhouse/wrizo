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
const TYPEWRITER_BAND = 0.73; // hold the active line low (~73%) so ~2 more lines of context stay visible (B2 C1)

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
  soundOn?: boolean;              // ambient sound bed state (host owns it); absent → no mic shown
  onToggleSound?: () => void;     // toggling shows the mic in the gear cluster
  children: (api: { noteWrite: () => void; penColor?: string }) => React.ReactNode;
}

export function ModeStage({ mode, words, surfaceRef, focused, pageTitle, onDissolveChange, soundOn, onToggleSound, children }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const settings = useWritingSettings();
  // Typewriter engages ONLY in Free Write (Journal) — the line-hold helps
  // generation but fights revision, so it's never on in Draft/Format. The gear
  // toggle is the Free-Write preference (default on).
  const typewriterOn = mode === 'journal' && settings.typewriter;
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

  // Typewriter fade (B2): hold the active line low in the scroll viewport so
  // earlier lines ride up through the top gradient and fade. Driven by a mutation
  // observer (covers typing, strikes, IME, free edits) + input, on a rAF.
  //   • C2 — the top fade only applies once content has actually scrolled past
  //     (data-scrolled): on a fresh/short page the active line sits above the band,
  //     so nothing scrolls and line 1 stays full opacity.
  //   • C3 — a line advance gets a small upward jolt + overshoot-and-settle (a hint
  //     of mechanical paper-feed), not a smooth glide; honors reduced-motion.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !typewriterOn) return;
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let joltRaf = 0;
    let animating = false;
    const setScrolled = () => { el.dataset.scrolled = el.scrollTop > 4 ? 'true' : 'false'; };
    const lineHeight = () => {
      const ed = el.querySelector('.forward-only-editor') as HTMLElement | null;
      return ed ? (parseFloat(getComputedStyle(ed).lineHeight) || 28) : 28;
    };
    // C3: quick jolt to `target` — overshoot a few px, then settle.
    const jolt = (target: number) => {
      animating = true;
      const start = el.scrollTop;
      const over = Math.min(7, Math.abs(target - start) * 0.3);
      const t0 = performance.now();
      const dur = 130;
      cancelAnimationFrame(joltRaf);
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / dur);
        const pos = p < 0.6
          ? start + (target + over - start) * (p / 0.6)         // ride up past the mark
          : (target + over) + (target - (target + over)) * ((p - 0.6) / 0.4); // settle back
        el.scrollTop = pos;
        setScrolled();
        if (p < 1) { joltRaf = requestAnimationFrame(tick); }
        else { el.scrollTop = target; setScrolled(); animating = false; }
      };
      joltRaf = requestAnimationFrame(tick);
    };
    const band = () => {
      if (animating) return;
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
      const within = caretBottom - el.getBoundingClientRect().top;
      const delta = within - el.clientHeight * TYPEWRITER_BAND;
      // Caret above the band (fresh/short page): don't scroll, don't fade (C2).
      if (delta <= 1) { setScrolled(); return; }
      const target = el.scrollTop + delta;
      if (!reduce && delta >= lineHeight() * 0.5) jolt(target);
      else { el.scrollTop = target; setScrolled(); }
    };
    const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(band); };
    const mo = new MutationObserver(schedule);
    mo.observe(el, { childList: true, subtree: true, characterData: true });
    el.addEventListener('input', schedule);
    el.addEventListener('scroll', setScrolled, { passive: true });
    setScrolled();
    schedule();
    return () => {
      mo.disconnect();
      el.removeEventListener('input', schedule);
      el.removeEventListener('scroll', setScrolled);
      cancelAnimationFrame(raf);
      cancelAnimationFrame(joltRaf);
    };
  }, [typewriterOn]);

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

      {/* Top-right chrome cluster: the sound toggle (if the host owns sound) +
          the settings gear — one-color tan glyphs, matched in size. */}
      <div className="mode-gear-wrap mode-dissolve">
        {onToggleSound && (
          <button
            type="button"
            className={`mode-iconbtn mode-sound${soundOn ? '' : ' off'}`}
            aria-label={soundOn ? 'Sound on' : 'Sound off'}
            aria-pressed={!!soundOn}
            title={soundOn ? 'Sound on' : 'Sound off'}
            onClick={onToggleSound}
          >
            <MicIcon off={!soundOn} />
          </button>
        )}
        <button type="button" className="mode-iconbtn mode-gear" aria-label="Writing settings" aria-expanded={gearOpen} onClick={() => setGearOpen(o => !o)}>
          <GearIcon />
        </button>
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
              data-typewriter={typewriterOn ? 'true' : 'false'}
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

// One-color tan chrome icons (currentColor; sized for large screens).
function MicIcon({ off }: { off: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <line x1="12" y1="18" x2="12" y2="21.5" />
      {off && <line x1="4" y1="3.5" x2="20" y2="20.5" />}
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3.1" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V15z" />
    </svg>
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
