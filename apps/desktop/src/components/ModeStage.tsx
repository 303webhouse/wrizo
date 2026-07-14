import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import type { EditorMode } from './ForwardOnlyEditor';
import { useChromeDissolve } from './useChromeDissolve';
import { useWritingSettings, setWritingSettings } from '../store/writingSettings';
import type { ProgressMetric, FadeDepth } from '../store/writingSettings';
import { useAssistResponse } from '../store/aiAssist';
import { ChromeHandle } from './WritingShell';
import { useTypewriterFade } from './useTypewriterFade';
import { AmbientGlow, MilestoneBar, ProgressBar, TypewriterToggle, useGoalProgress, WORD_GOAL, TIME_GOAL_MS } from './WritingIncentives';
import type { Milestones } from '../store/milestones';
import { useTheme, setTheme, type ThemeId } from '../store/theme';
import { useThemePrefs, setThemePrefs } from '../store/themePrefs';

const ASSIST_INTRO_KEY = 'wrizo-assist-introduced';      // first pop-out fired (once)
const ASSIST_COLLAPSED_KEY = 'wrizo-assist-collapsed';   // persisted panel state

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

const PEN_INKS = ['#1a0f06', '#b8231f', '#1f4fb8']; // black-brown, red, blue

interface RailDef { heading: string; items: string[]; ai: 'sealed' | 'open'; tools: 'pen' | 'format'; }
const RAILS: Record<EditorMode, RailDef> = {
  journal:  { heading: 'capture', items: ['Spark deck', 'Fragments', 'Send → Drawer'], ai: 'sealed', tools: 'pen' },
  // "Pages" is intentionally NOT here (B5): the one pages door is ProjectHome,
  // reached via the Pages⟷Plan toggle — the SECTIONS stub was a duplicate.
  drafting: { heading: 'sections', items: ['Structure', 'Notes & Worldbuilding', 'Find'], ai: 'open', tools: 'format' },
};

interface Props {
  mode: EditorMode;
  words: number;
  surfaceRef?: React.RefObject<HTMLDivElement>; // J5 ambient warmth target (the page)
  focused?: boolean;                            // editor focus → page glow
  pageTitle?: string;
  onDissolveChange?: (dissolved: boolean) => void;
  // TH2 — the celebrate-summon rule (canon §10): fires once per lap
  // completion so the host can override its OWN bottom bar's fade for
  // ~2.5s. Cross-theme (lands behind the Fade pref, so Plateau gains it
  // too) but only Flux's sprint bar actually surges visually — see
  // WritingIncentives.tsx Slice 2.
  onCelebrate?: () => void;
  soundOn?: boolean;              // ambient sound bed state (host owns it); absent → no mic shown
  onToggleSound?: () => void;     // toggling shows the mic in the gear cluster
  // The host's own top bar (PageEditor's/QuickSprint's breadcrumb + mode tabs
  // row) is a SIBLING of .mode-stage in the DOM, not a descendant — pass its
  // ref so --fade-dur reaches it too and its .chrome-fade transition runs on
  // the same context-aware curve as the rest of this surface's chrome.
  chromeRootRef?: React.RefObject<HTMLElement>;
  // M1 — the host's own precomputed milestone projection (store/milestones.ts
  // is pure and needs the page/project context ModeStage doesn't have).
  // null/undefined = no plan to project (Journal never has one; a plan-less
  // project silently degrades the gear's Progress:Project option away — no
  // greyed states).
  milestones?: Milestones | null;
  children: (api: { noteWrite: () => void; penColor?: string }) => React.ReactNode;
}

export function ModeStage({ mode, words, surfaceRef, focused, pageTitle, onDissolveChange, onCelebrate, soundOn, onToggleSound, chromeRootRef, milestones, children }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const settings = useWritingSettings();
  // Typewriter engages in Free Write and Draft (writing postures) — never in
  // Format/Workshop/Publish (convention/delivery, revision-shaped work the
  // hold would fight). Gated by the persisted setting AND the bottom-right
  // icon, both toggling the same value.
  const typewriterOn = (mode === 'journal' || mode === 'drafting') && settings.typewriter;
  const { dissolved, noteWrite: engineNote, resurface } = useChromeDissolve({
    surface: 'sprint',
    rootRef: chromeRootRef ? [stageRef, chromeRootRef] : stageRef,
  });

  const firstWriteRef = useRef<number | null>(null);
  // TH2 — a short-lived "actively typing" signal for the glow's sputter
  // pause (canon §8/§6: RESPONSE persists, but its sputter pauses while keys
  // flow). Distinct from useChromeDissolve's 3-minute dissolve window —
  // this clears on a brief pause (~1.5s idle), not a long one.
  const [activelyTyping, setActivelyTyping] = useState(false);
  const typingIdleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noteWrite = useCallback(() => {
    if (firstWriteRef.current === null) firstWriteRef.current = Date.now();
    setActivelyTyping(true);
    if (typingIdleRef.current) clearTimeout(typingIdleRef.current);
    typingIdleRef.current = setTimeout(() => { typingIdleRef.current = null; setActivelyTyping(false); }, 1500);
    engineNote();
  }, [engineNote]);
  useEffect(() => () => { if (typingIdleRef.current) clearTimeout(typingIdleRef.current); }, []);

  const [pen, setPen] = useState(PEN_INKS[0]);
  const [gearOpen, setGearOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [, tick] = useReducer((n: number) => n + 1, 0);

  // B5 — in-document pagination. A page is the SHEET HEIGHT (not a line count, so
  // it survives the type scale): when the editor's content overflows the sheet,
  // flip to a fresh one with a page-turn (animation + soft sound). `pageNum` is
  // the current sheet (0-based), shown as "p.N" beside the progress bar. The bar
  // itself no longer tracks page fill — it's the word/time goal lap (see
  // WritingIncentives.tsx); a page turn and a goal-lap completion are
  // independent rewards now.
  const [pageNum, setPageNum] = useState(0);
  const pageNumRef = useRef(0);
  const soundOnRef = useRef(soundOn);
  soundOnRef.current = soundOn;

  // B3 — the AI assist frame. Collapsible (persisted); a future AI response shown
  // through the shared channel pops it out. Connect is a stub (no provider wired).
  const [assistCollapsed, setAssistCollapsed] = useState(() => localStorage.getItem(ASSIST_COLLAPSED_KEY) !== '0');
  const [connectOpen, setConnectOpen] = useState(false);
  const assistResponse = useAssistResponse();
  const collapseAssist = (v: boolean) => { setAssistCollapsed(v); localStorage.setItem(ASSIST_COLLAPSED_KEY, v ? '1' : '0'); };

  // Tell the host (top-bar fade) whenever the dissolve flips.
  useEffect(() => { onDissolveChange?.(dissolved); }, [dissolved, onDissolveChange]);

  // C6 — first-ever switch to a non-Free-Write mode pops the frame out (once,
  // remembered) so it introduces itself + the connect invitation; never re-nags.
  useEffect(() => {
    if (mode === 'journal') return;
    if (localStorage.getItem(ASSIST_INTRO_KEY)) return;
    localStorage.setItem(ASSIST_INTRO_KEY, '1');
    collapseAssist(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // A response coming through the channel pops the frame out (in an open mode).
  useEffect(() => {
    if (assistResponse && mode !== 'journal') collapseAssist(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assistResponse, mode]);

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

  // Typewriter fade (B2, shared engine — see useTypewriterFade.ts): hold the
  // active line low in the scroll viewport so earlier lines ride up through
  // the top gradient and fade, with a subtle jolt on line advance. C2/C3 live
  // in the shared hook now; JournalEntry uses the same engine (window-scroll
  // variant) for parity across the app's two writing surfaces.
  useTypewriterFade({ enabled: typewriterOn, containerRef: scrollRef, editorSelector: '.forward-only-editor' });

  // Pagination: watch the editor's content height against the sheet height. On
  // crossing a sheet boundary, flip (page-turn animation + soft sound). Height-
  // based, so the boundary always matches the visible sheet at any type scale.
  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    const flip = () => {
      const pageEl = scroll.closest('.mode-page') as HTMLElement | null;
      if (pageEl && !reduce) {
        pageEl.classList.remove('flipping');
        void pageEl.offsetWidth; // restart the animation
        pageEl.classList.add('flipping');
        setTimeout(() => pageEl.classList.remove('flipping'), 600);
      }
      if (soundOnRef.current && !reduce) playPageTurn();
    };
    const measure = () => {
      const ed = scroll.querySelector('.forward-only-editor') as HTMLElement | null;
      if (!ed) return;
      const sheet = scroll.clientHeight || 1;
      const content = ed.scrollHeight;
      const page = Math.floor(content / sheet);
      if (page !== pageNumRef.current) {
        const turned = page > pageNumRef.current;
        pageNumRef.current = page;
        setPageNum(page);
        if (turned) flip();
      }
    };
    const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(measure); };
    const mo = new MutationObserver(schedule);
    mo.observe(scroll, { childList: true, subtree: true, characterData: true });
    scroll.addEventListener('input', schedule);
    schedule();
    return () => { mo.disconnect(); scroll.removeEventListener('input', schedule); cancelAnimationFrame(raf); };
  }, []);

  // Glow warmth: cumulative for the session (never resets), eased so early
  // words give visible warmth. The progress BAR below is a repeating lap
  // instead — it fills, celebrates, and resets every WORD_GOAL/TIME_GOAL_MS.
  const elapsedForGoal = firstWriteRef.current ? Date.now() - firstWriteRef.current : 0;
  const goalValue = settings.progress === 'time' ? elapsedForGoal : words;
  const goalTarget = settings.progress === 'time' ? TIME_GOAL_MS : WORD_GOAL;
  const m = Math.pow(Math.min(1, goalValue / goalTarget), 0.55);
  const { frac: lapFrac, celebrating } = useGoalProgress(goalValue, goalTarget);
  // TH2 — fire the celebrate-summon rule once per lap, on the transition
  // into celebrating (not on every render while it stays true).
  const prevCelebratingRef = useRef(false);
  useEffect(() => {
    if (celebrating && !prevCelebratingRef.current) onCelebrate?.();
    prevCelebratingRef.current = celebrating;
  }, [celebrating, onCelebrate]);
  let label: string;
  let metricLabel: string;
  if (settings.progress === 'time') {
    const s = Math.floor(elapsedForGoal / 1000);
    label = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    metricLabel = 'session';
  } else {
    label = `${words} word${words === 1 ? '' : 's'}`;
    metricLabel = 'words';
  }

  // M1 — Progress:Project shows the milestone circle-bar in place of the
  // word/time lap bar. Silent degrade (no greyed states): 'project' with no
  // milestones to project (a plan-less project, or milestones not passed at
  // all) renders as if 'words' were selected — the stored setting itself is
  // untouched.
  const showMilestones = settings.progress === 'project' && !!milestones && milestones.beats.length > 0;
  const effectiveProgress = settings.progress === 'project' && !showMilestones ? 'words' : settings.progress;

  // Opt-in session timer (incentive layer): elapsed since the first keystroke.
  const elapsedMs = firstWriteRef.current ? Date.now() - firstWriteRef.current : 0;
  const es = Math.floor(elapsedMs / 1000);
  const elapsedClock = `${Math.floor(es / 60)}:${String(es % 60).padStart(2, '0')}`;

  const focusEditor = () => (scrollRef.current?.querySelector('.forward-only-editor') as HTMLElement | null)?.focus();
  const exec = (cmd: string) => { focusEditor(); try { document.execCommand(cmd, false); } catch { /* execCommand unsupported */ } };
  const choosePen = (ink: string) => { setPen(ink); focusEditor(); };

  const rail = RAILS[mode];

  return (
    <div
      ref={stageRef}
      className="mode-stage"
      data-writing={dissolved ? 'true' : 'false'}
      data-fade={settings.fadeDepth}
    >
      {/* Always-discoverable reveal handle (top-left ember dot). */}
      <ChromeHandle onReveal={() => resurface(true)} />

      {/* Ambient ember — blooms as the rails dissolve; eased with progress. */}
      <AmbientGlow m={m} typing={activelyTyping} celebrating={celebrating} />

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
        {gearOpen && <SettingsPanel settings={{ progress: settings.progress, fadeDepth: settings.fadeDepth, timer: settings.timer, typewriter: settings.typewriter }} hasMilestones={!!milestones && milestones.beats.length > 0} />}
        {gearOpen && <ThemePanel />}
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
            data-page={pageNum}
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

          {/* Incentive layer — progress bar (a repeating lap toward the word/
              time goal; celebrates + resets on completion) OR the M1
              milestone circle-bar (Progress: Project) + optional session
              timer + the typewriter toggle. Stays visible while writing
              (never carries the dissolve class). M1's silent-degrade rule:
              'project' with no milestones available renders as 'words'
              instead — the STORED setting is untouched, so it resumes on a
              plan-linked page without the writer doing anything. */}
          <div className="mode-incentive-row">
            {showMilestones ? (
              <MilestoneBar
                milestones={milestones!}
                rightSlot={<>
                  {pageNum > 0 && <span className="mode-pagenum">p.{pageNum + 1}</span>}
                  {settings.timer && <span className="mode-timer" aria-label="Session time">⏱ {elapsedClock}</span>}
                </>}
              />
            ) : (
              (effectiveProgress !== 'off' || settings.timer) && (
                <ProgressBar
                  frac={lapFrac}
                  celebrating={celebrating}
                  label={label}
                  metricLabel={metricLabel}
                  hidden={effectiveProgress === 'off'}
                  rightSlot={<>
                    {pageNum > 0 && <span className="mode-pagenum">p.{pageNum + 1}</span>}
                    {settings.timer && <span className="mode-timer" aria-label="Session time">⏱ {elapsedClock}</span>}
                  </>}
                />
              )
            )}
            {(mode === 'journal' || mode === 'drafting') && (
              <TypewriterToggle on={settings.typewriter} onToggle={() => setWritingSettings({ typewriter: !settings.typewriter })} />
            )}
          </div>
        </div>

        {/* RIGHT rail — AI frame. Sealed in Journal; open elsewhere. */}
        {rail.ai === 'sealed' ? (
          <aside className="mode-rail right sealed mode-dissolve" aria-label="AI sealed in Journal">
            <div className="mode-lock" aria-hidden="true">▦</div>
            <div className="mode-seal-note">journal is yours alone</div>
          </aside>
        ) : assistCollapsed ? (
          // Collapsed: a thin border carrying the persistent assist channel icon.
          <aside className={`mode-rail right assist collapsed mode-dissolve${drawerOpen ? ' drawer-open' : ''}`} aria-label="AI assist">
            <button type="button" className="assist-tab" aria-label="Open AI assist" title="AI assist" onClick={() => collapseAssist(false)}>
              <AssistIcon />
            </button>
          </aside>
        ) : (
          <aside className={`mode-rail right assist mode-dissolve${drawerOpen ? ' drawer-open' : ''}`} aria-label="AI assist">
            <button type="button" className="assist-collapse" aria-label="Collapse assist" title="Collapse" onClick={() => collapseAssist(true)}>›</button>
            <div className="mode-rail-h">assist</div>
            <div className="mode-ai-surface assist-body">
              {assistResponse ? (
                <div className="assist-response">{assistResponse}</div>
              ) : (
                <div className="assist-invite">
                  <p className="assist-invite-line">Connect your AI to help clear blocks in your own writing. It will never write for you.</p>
                  <button type="button" className="btn-quiet assist-connect" onClick={() => setConnectOpen(true)}>Connect AI</button>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Connect AI — stub entry point (no provider wired in B3). */}
      {connectOpen && (
        <div className="sprint-modal-backdrop" onClick={() => setConnectOpen(false)}>
          <div className="sprint-modal card" role="dialog" aria-label="Connect AI" onClick={e => e.stopPropagation()}>
            <div className="card-title">Connect your AI</div>
            <p style={{ color: 'var(--text-mid)', fontSize: 14, margin: '8px 0 14px' }}>
              Bring your own AI service (Claude · ChatGPT · Gemini · …) to the desk to help clear blocks. It clears the way — it never writes for you. Connecting is coming soon.
            </p>
            <button type="button" className="btn-quiet" onClick={() => setConnectOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// The persistent assist-channel mark (one-color tan, like the chrome icons).
function AssistIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z" />
      <path d="M18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8z" />
    </svg>
  );
}

// The gear menu — the writing-screen chrome settings, persisted. `hasMilestones`
// gates the Progress:Project option — offered ONLY when the current page
// belongs to a project with a StoryPlan (the canon's Q3 rule; no greyed
// states, the option simply isn't in the list otherwise).
function SettingsPanel({ settings, hasMilestones }: { settings: { progress: ProgressMetric; fadeDepth: FadeDepth; timer: boolean; typewriter: boolean }; hasMilestones?: boolean }) {
  const progressOpts: [string, string][] = [['words', 'Words'], ['time', 'Time'], ['off', 'Off']];
  if (hasMilestones) progressOpts.splice(2, 0, ['project', 'Project']);
  return (
    <div className="mode-settings" role="menu">
      <h4>settings</h4>
      <Seg label="Progress" value={settings.progress} opts={progressOpts} onPick={v => setWritingSettings({ progress: v as ProgressMetric })} />
      <Seg label="Recede depth" value={settings.fadeDepth} opts={[['partial', 'Partial'], ['full', 'Full']]} onPick={v => setWritingSettings({ fadeDepth: v as FadeDepth })} />
      <Seg label="Timer" value={settings.timer ? 'on' : 'off'} opts={[['on', 'On'], ['off', 'Off']]} onPick={v => setWritingSettings({ timer: v === 'on' })} />
      <Seg label="Typewriter" value={settings.typewriter ? 'on' : 'off'} opts={[['on', 'On'], ['off', 'Off']]} onPick={v => setWritingSettings({ typewriter: v === 'on' })} />
      <div className="mode-settings-hint">Type to dissolve the chrome. Stop, and after a pause it returns slowly. Reach an edge or press Esc to summon it back.</div>
    </div>
  );
}

// TH2 — the theme/prefs menu, a second panel beside SettingsPanel (kept
// separate: theme selection is cross-theme/account-level, not this surface's
// own writing-chrome behavior). Switching Theme is instant and lossless —
// only a data-theme attribute write, no reload, no unmount of the editor
// (PAGE IS PRIMARY holds trivially: nothing here touches the page's rect).
function ThemePanel() {
  const theme = useTheme();
  const prefs = useThemePrefs();
  const themeOpts: [string, string][] = [['plateau', 'Plateau'], ['flux', 'Flux']];
  return (
    <div className="mode-settings mode-theme-settings" role="menu">
      <h4>theme</h4>
      <Seg label="Theme" value={theme} opts={themeOpts} onPick={v => setTheme(v as ThemeId)} />
      <Seg label="Voice" value={prefs.voice} opts={[['serif', 'Serif'], ['sans', 'Sans']]} onPick={v => setThemePrefs({ voice: v as 'serif' | 'sans' })} />
      <Seg label="Page" value={prefs.page} opts={[['light', 'Light'], ['dark', 'Dark']]} onPick={v => setThemePrefs({ page: v as 'dark' | 'light' })} />
      <Seg label="Fade" value={prefs.fade} opts={[['on', 'On'], ['off', 'Off']]} onPick={v => setThemePrefs({ fade: v as 'on' | 'off' })} />
    </div>
  );
}

// A soft synthesized paper-rustle for the page turn (no asset; gated by the
// sound toggle + reduced-motion by the caller). Best-effort — never throws.
function playPageTurn(): void {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const dur = 0.2;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.5) * 0.22; // decaying noise
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 1700;
    src.connect(filt);
    filt.connect(ctx.destination);
    src.start();
    src.onended = () => { try { ctx.close(); } catch { /* ignore */ } };
  } catch {
    // audio unsupported / blocked — silent
  }
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
