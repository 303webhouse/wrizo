import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { EditorMode } from './ForwardOnlyEditor';
import { DrawerNote } from './DrawerNote';
import { useChromeDissolve } from './useChromeDissolve';
import { useWritingSettings, setWritingSettings, setTypewriterExplicit, typewriterForPage } from '../store/writingSettings';
import type { ProgressMetric, FadeDepth, ProgressStyle } from '../store/writingSettings';
import { useDeskLexicon } from '../store/deskLexicon';
import { useAssistResponse } from '../store/aiAssist';
import { ChromeHandle } from './WritingShell';
import { useTypewriterFade, CONTAINER_HOLD_BAND } from './useTypewriterFade';
import { AmbientGlow, MilestoneBar, ProgressBar, TypewriterToggle, useGoalProgress, WORD_GOAL, TIME_GOAL_MS } from './WritingIncentives';
import type { Milestones } from '../store/milestones';
import { useTheme, setTheme, type ThemeId } from '../store/theme';
import { useLexicon } from '../store/themeLexicon';
import { useThemePrefs, setThemePrefs, type PageTone } from '../store/themePrefs';
import { useAmbianceDial, setAmbianceDial } from '../store/ambianceDial';
import { FirstRunVeil } from './FirstRunGate';
import { usePageDress, dressVars } from '../store/pageDress';
import { setCaretOffset } from '../store/caretOffset';
import { editorPlainText, rowsFor, rowsOffsetOf } from '../store/lineRows';
import { tuckDrawers } from '../store/menusDrawers';
import { ZOOM_ANCHOR } from '../store/pageScale';

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

// AB2 S2 — exported so PageEditor.tsx (the framed host) can seed the
// sliver's (CD1: components/Sliver.tsx, formerly ToolRail) ink swatch list
// with the SAME three inks, when it lifts pen-color into a controlled prop
// below (the pen bar itself retires from the frame; its palette does not
// change).
export const PEN_INKS = ['#1a0f06', '#b8231f', '#1f4fb8']; // black-brown, red, blue

// FLUX-PAGE-INK — PEN_INKS is a fixed, theme-independent swatch list tuned for
// a light page. Flux's dark page (--paper:#0B2429) is the one combination
// where that assumption breaks: the default swatch measured 1.16:1 against it
// (Chat 1 ledger 62/72). Arbor has no dark-page variant (canon §11 debt,
// themePrefs.ts), so Flux dark is the only tone that needs a substitute. Each
// swatch keeps its hue family; only lightness moves, enough to clear 7:1
// against #0B2429 (black-brown reuses --ink-on-paper itself, ~13.9:1; red and
// blue are hand-lightened, ~7.4:1 and ~7.7:1).
// FLUX V2: the dark page is now #0E1C24 with --ink-on-paper #E8F6FA, so the default swatch follows it (still ~15:1; red and blue only gain contrast on the darker glass).
const PEN_INKS_FLUX_DARK: Record<string, string> = {
  '#1a0f06': '#E8F6FA',
  '#b8231f': '#FF9088',
  '#1f4fb8': '#8AB4FF',
};

// theme-leftovers (Fable, Oct 16): "Flux light Free Write's default pen ink
// is Arbor's #1A0F06; use Flux's ink instead." Not a contrast gap (Arbor's
// black-brown already carries on Flux light's paper) but an identity one —
// the default swatch was never re-pointed to Flux's own ink at all, only its
// dark-page variant was (above). #14231F is Flux light's own --ink-on-paper
// (index.css), the same "reuse the theme's own ink" move the dark case
// already makes. Scoped to the default swatch only, per the ticket's own
// wording — red/blue aren't named and aren't touched.
// FLUX V2: Flux light's --ink-on-paper is now #042632, and the default swatch is still that ink.
const PEN_INKS_FLUX_LIGHT: Record<string, string> = {
  '#1a0f06': '#042632',
};

function effectivePenInk(ink: string, theme: ThemeId, pageTone: PageTone): string {
  if (theme !== 'flux') return ink;
  if (pageTone === 'dark') return PEN_INKS_FLUX_DARK[ink] ?? ink;
  return PEN_INKS_FLUX_LIGHT[ink] ?? ink;
}

interface RailDef { heading: string; items: string[]; ai: 'sealed' | 'open'; tools: 'pen' | 'format'; }
const RAILS: Record<EditorMode, RailDef> = {
  journal:  { heading: 'capture', items: ['Spark deck', 'Fragments', 'Send → Drawer'], ai: 'sealed', tools: 'pen' },
  // "Pages" is intentionally NOT here (B5): the one pages door is ProjectHome,
  // reached via the Pages⟷Plan toggle — the SECTIONS stub was a duplicate.
  drafting: { heading: 'sections', items: ['Structure', 'Notes & Worldbuilding', 'Find'], ai: 'open', tools: 'format' },
  // ITEM 112-A — Revise's entry, and it is REQUIRED rather than decorative: this
  // record is TOTAL over EditorMode and is indexed UNGUARDED below (`const rail =
  // RAILS[mode]`), including on the framed path, where `rail.tools` decides whether
  // the editor is handed a pen ink. A missing key here is a TypeError on first
  // render, not a cosmetic gap.
  //
  // EMPTY `items` IS THE POINT, not an oversight. Revise's Desk-hand furniture is
  // 83's Type section, which is 112-C — this ticket ships the room, not the tenants
  // (§1) — and a stub row naming an unbuilt capability is the locked door wearing
  // paint that G3 forbids. `tools: 'format'` is what keeps the pen ink AWAY from
  // Revise (only 'pen' hands one down); it does not give Revise Draft's format bar
  // on the framed surface, where this whole legacy toolbar does not mount at all.
  // `ai: 'open'` matches Draft: the Counsel is never sealed on a surface that
  // accepts writing (item 119).
  revise: { heading: 'revise', items: [], ai: 'open', tools: 'format' },
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
  // AB1 S2 — true when a DeskFrame (>=1100px) hosts this ModeStage. The
  // rails, the incentive row (progress bar/laps/celebration/milestones), and
  // the ambient glow move to DeskFrame's own tracks or are parked entirely
  // (never mounted) — DeskFrame owns those zones now. The pen/format bar,
  // the page/scroll container, and the settings gear are unaffected: they
  // stay exactly as they render today. Default false keeps every existing
  // caller (QuickSprint, and this component below the 1100px gate) byte-
  // identical to pre-AB1 behavior.
  framed?: boolean;
  // AB2 S2 — when framed, ink color is owned by the host (the sliver is
  // DeskFrame's sibling, not ModeStage's child, so it can't reach ModeStage's
  // own internal `pen` state) and passed down as a controlled value. Absent
  // (every existing caller — QuickSprint, and this component below the
  // 1100px gate) falls through to the internal uncontrolled `pen` state,
  // byte-identical to pre-AB2 behavior.
  penColor?: string;
  // ITEM 121 I3 — the page's current instrument, when the host has one.
  // Undefined on every other host, which is what keeps `data-instrument`
  // off their paper entirely rather than present-and-empty.
  instrument?: 'text' | 'ink';
  // ITEM 126 B2 — what the page lets the writer do to its ink here. Kept SEPARATE
  // from `instrument` on purpose: `instrument` says which instrument the page IS
  // (Free Write only, R15), and a Draft page is not "in TEXT" — it is a word
  // processor with ink on it. Overloading one attribute to mean both would make
  // the two unable to disagree, and disagreeing is exactly what the harness needs
  // to be able to catch.
  inkPermission?: 'edit' | 'inert' | 'movable';
  // HB1 S3 — true only on the one page a first-run Write click produced,
  // while the veil holds. The reveal handle and the settings gear (which
  // exposes a Theme switch and the Typewriter toggle — exactly the two
  // things the gate forces and the ceremony is meant to earn) are the only
  // pieces of chrome ModeStage renders itself, outside DeskFrame's own
  // toolRail/sliver tracks the host already veils; this closes that gap.
  // Absent/false (every existing caller) is byte-identical to pre-HB1
  // behavior.
  firstRunGateActive?: boolean;
  // typewriter-scope (Fable Oct 21) — THIS page's own id, so the 'drafting'
  // branch of `typewriterOn` below can ask typewriterForPage directly instead
  // of the shared `typewriter` mirror. Optional: absent (QuickSprint, which
  // has no durable per-page memory of its own — a scratch surface) falls
  // through to the shared field exactly as every caller did before this.
  pageId?: string;
  // FLUX V2 - the theme's frame readouts (components/FluxReadouts.tsx), drawn inside the lit page in its own padding. Absent for every host that passes none, so nothing changes there.
  readouts?: React.ReactNode;
  children: (api: { noteWrite: () => void; penColor?: string }) => React.ReactNode;
}

export function ModeStage({ mode, words, pageId, surfaceRef, focused, pageTitle, onDissolveChange, onCelebrate, soundOn, onToggleSound, chromeRootRef, milestones, framed, penColor: penColorProp, instrument, inkPermission, firstRunGateActive, readouts, children }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const settings = useWritingSettings();
  // ITEM 83 M3 — the dress the visible sheet should wear (store/pageDress.ts).
  const pageDress = usePageDress();
  const { t: lex } = useLexicon();
  // ITEM 130 — the DESK lexicon, for the pen bar's own label. This component
  // already holds the THEME lexicon above; the two are different registers and
  // the bar's label is desk chrome, so it takes the desk one.
  const { t: deskT } = useDeskLexicon();
  // Typewriter engages in Free Write and Draft (writing postures) — never in
  // Format/Workshop/Publish (convention/delivery, revision-shaped work the
  // hold would fight). Gated by the persisted setting AND the bottom-right
  // icon, both toggling the same value. AB1 S2 froze this out entirely when
  // framed ("do not mount the typewriter effect or its toggle"); AB2 S2
  // returns it from parking — the EFFECT now engages framed too (its own
  // toggle button moves to the sliver, a DeskFrame sibling reading/writing
  // the same shared store — CD1: components/Sliver.tsx), independent of framed.
  // typewriter-scope (Fable Oct 21) — Draft reads THIS page's own value
  // (never the shared mirror another page could have left behind); Free
  // Write and every pageId-less caller (QuickSprint) keep reading the
  // shared field exactly as before.
  const typewriterOn = mode === 'drafting' && pageId != null
    ? typewriterForPage(pageId, words === 0)
    : (mode === 'journal' || mode === 'drafting') && settings.typewriter;
  // PAGE-SIZE (spec point 3) - THE ZOOM: on the framed prose page, Typewriter (Terminal Mode, and the themes' later names) is the SAME page scaled
  // ~1.6x (index.css `.mode-pagecol[data-zoom]`, --wz-zoom from DeskFrame's observer) - a transform, so no line ever reflows and the editor never
  // unmounts. The ruled exception to page primacy (docs/page-primacy-canon.md): the rect changes on purpose, and leaving returns it exactly.
  // Entering tucks both drawers (tools: they collapse, their grips stay); the Flux block caret is told the layout moved under it.
  const zoomed = !!framed && typewriterOn;
  const pagecolRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!zoomed) return;
    // focus that was INSIDE a drawer the zoom tucks would be stranded in an inert panel (the lane run on fb1e28fb: Enter on the Sliver's own
    // Typewriter toggle turned the zoom on, the drawer tucked, and the next key went nowhere). It goes to the page - where the writer is about to write.
    const a = document.activeElement as HTMLElement | null;
    const stranded = !!a?.closest?.('.wz-sliver, .wz-tutor-panel, .desk-frame-tutor-panel-anchor');
    tuckDrawers();
    if (stranded) (scrollRef.current?.querySelector('.forward-only-editor') as HTMLElement | null)?.focus();
  }, [zoomed]);
  useEffect(() => {
    // the caret moved under the Flux block caret; and the painted page's edge moved, which the Tutor's own width and grip measure against
    const raf = requestAnimationFrame(() => { document.dispatchEvent(new Event('wz-caret-moved')); document.dispatchEvent(new Event('wz-zoom-changed')); });
    return () => cancelAnimationFrame(raf);
  }, [zoomed]);
  // AB1 S3 fix (found while generalizing the vanishing law to DeskFrame,
  // pre-existing on this surface too — not new here) — this array literal
  // was previously rebuilt on every ModeStage render, so useChromeDissolve's
  // rootRef dependency changed identity every render, tearing down and
  // re-mounting its edge-dwell listener effect constantly and clearing any
  // in-flight dwell timer before EDGE_DWELL_MS could ever elapse — an
  // edge-reach resurface could never actually complete. Memoized on the one
  // input that should matter (chromeRootRef itself, a stable ref object).
  // POLISH #10 item 23: on the framed desk the root element joins the roots, so the engine's fade timing (--fade-dur) reaches the chrome that lives
  // outside the host too (the wordmark, the "...", Flux's glitch meter) - one curve for everything that recedes
  const htmlRef = useRef<HTMLElement>(typeof document !== 'undefined' ? document.documentElement : null);
  const dissolveRootRef = useMemo(
    () => (chromeRootRef ? (framed ? [stageRef, chromeRootRef, htmlRef] : [stageRef, chromeRootRef]) : stageRef),
    [chromeRootRef, framed],
  );
  const { dissolved, noteWrite: engineNote, resurface } = useChromeDissolve({
    surface: 'sprint',
    rootRef: dissolveRootRef,
  });

  // POLISH #10 item 23 (Nick, Oct 25): WHILE TYPING, EVERYTHING OFF THE PAGE GOES TO 0 - the framed desk announces it on the root element, so the
  // chrome that lives outside the desk's own tree (the wordmark, the ember dot, the progress lane, Flux's glitch meter) recedes with it (index.css)
  useEffect(() => {
    if (!framed || typeof document === 'undefined') return;
    const root = document.documentElement;
    if (dissolved) root.setAttribute('data-wz-writing', 'true'); else root.removeAttribute('data-wz-writing');
    return () => { root.removeAttribute('data-wz-writing'); };
  }, [framed, dissolved]);

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
  // FLUX-PAGE-INK — resolves the page-text colour actually handed to the
  // editor (below, at the render-prop hand-off): the same correction reaches
  // both the unframed bar's own `pen` state and the framed host's controlled
  // `penColorProp` (PageEditor.tsx), since both funnel through that one line.
  const penTheme = useTheme();
  const { page: penPageTone } = useThemePrefs();
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
  // FX3 S3 — CONTAINER_HOLD_BAND (not the shared default): this is a
  // container-mode call, one of the two "paper" surfaces the brief's S3
  // retunes; Journal's own window-scroll call is untouched (see
  // useTypewriterFade.ts's own comment).
  useTypewriterFade({ enabled: typewriterOn, containerRef: scrollRef, editorSelector: '.forward-only-editor', holdBand: CONTAINER_HOLD_BAND,
    // PAGE-SIZE - zoomed, the writing line is held at ZOOM_ANCHOR (60%) of the page column, the anchor Cursor's band mask is drawn against
    zoom: zoomed ? { holdRef: pagecolRef, anchor: ZOOM_ANCHOR } : undefined });

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
  // BLANK-PAGE CLICK (Fable, Oct 22; ledger 134 and her correction on 0e713e7a - "just let me write"). A press on the PAPER, off the text:
  //   - BELOW the last line (or on an empty page)  -> the caret at the END of the text;
  //   - BESIDE a line (a side margin, or the page's top padding) -> the NEAREST SPOT ON THAT LINE, by the browser's own caret-from-point at the
  //     press, clamped into the editor's box - never the end of the document;
  //   - ON the text -> the browser's own, never touched.
  // Why here: a bare focus() left a Draft page's caret at the START (Free Write was spared only by its forward lock). This handler sits on the
  // PAPER (.mode-page), not the scroller, because the paper's LEFT margin is .mode-page's padding, outside the scroller. A press on a control keeps
  // exactly what it did before (inside the scroller a plain focus, outside it nothing), and so does a press on any other element of the page.
  // The point is read at PRESS time (before focus can scroll a typewriter page) and turned into the editor's own plain offset (rowsOffsetOf), so a
  // re-render on focus cannot detach it; it is applied by the editor's own setCaretOffset on the NEXT frame, because the editor's own placement on
  // focus lands after a synchronous set and would overwrite it (PageEditor's onReachName, measured). If the browser cannot resolve the point, the
  // press is a plain focus - never the end.
  const onPaperPress = (e: React.MouseEvent<HTMLDivElement>) => {
    const scroll = scrollRef.current;
    const ed = scroll?.querySelector('.forward-only-editor') as HTMLElement | null;
    if (!scroll || !ed) return;
    const target = e.target as HTMLElement | null;
    if (target && ed.contains(target)) return;
    const inScroll = !!target && scroll.contains(target);
    if (target?.closest?.('button, a, input, textarea, select, [role="button"], [role="option"]')) { if (inScroll) focusEditor(); return; }
    if (!inScroll && target !== e.currentTarget) return;
    const rows = [...ed.querySelectorAll<HTMLElement>('.wz-row')].filter(r => r.getBoundingClientRect().height > 0);
    const lastBottom = rows.length ? rows[rows.length - 1].getBoundingClientRect().bottom : -Infinity;
    let offset: number | null;
    if (!rows.length || e.clientY > lastBottom) offset = editorPlainText(ed).length;
    else {
      const er = ed.getBoundingClientRect();
      const firstTop = rows[0].getBoundingClientRect().top;
      const x = Math.min(Math.max(e.clientX, er.left + 1), er.right - 1);
      const y = Math.min(Math.max(e.clientY, firstTop + 1), lastBottom - 1);
      const fromPoint = (document as unknown as { caretRangeFromPoint?: (x: number, y: number) => Range | null }).caretRangeFromPoint;
      let range: Range | null = null;
      try { range = fromPoint ? fromPoint.call(document, x, y) : null; } catch { range = null; }
      const R = rowsFor(ed);
      offset = range && R && ed.contains(range.startContainer) ? rowsOffsetOf(R, range.startContainer, range.startOffset) : null;
    }
    ed.focus();
    if (offset != null) { const at = offset; requestAnimationFrame(() => { if (ed.isConnected) setCaretOffset(ed, at); }); }
  };
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
      {/* Always-discoverable reveal handle (top-left ember dot). HB1 S3 —
          veiled during the first-run gate: it's the one other piece of
          chrome ModeStage renders outside DeskFrame's own toolRail/sliver
          tracks (which the host already veils), and its gear (below)
          exposes exactly the Theme switch and Typewriter toggle the gate
          forces and the ceremony is meant to earn. */}
      <FirstRunVeil active={!!firstRunGateActive}>
        <ChromeHandle onReveal={() => resurface(true)} />
      </FirstRunVeil>

      {/* Ambient ember — blooms as the rails dissolve; eased with progress.
          AB1 S2 — "do not mount the ambient glow" when framed (DeskFrame). */}
      {!framed && <AmbientGlow m={m} typing={activelyTyping} celebrating={celebrating} />}

      {/* Top-right chrome cluster: the sound toggle (if the host owns sound) +
          the settings gear — one-color tan glyphs, matched in size. HB1 S3 —
          veiled during the first-run gate (see above).
          FX3 S5 — "the paper sheds the gear... entirely": framed (DeskFrame)
          no longer mounts this at all — the SAME SettingsPanel/ThemePanel
          components (exported below) now render from the sliver's own foot
          instead (components/Sliver.tsx's SliverInstrumentRow), reached
          through a gear button there rather than here. Below the 1100px
          gate (every existing non-framed caller — QuickSprint) this is
          byte-identical to pre-FX3: the sound toggle was never wired for
          any framed caller either (PageEditor.tsx's framed ModeStage call
          passes neither prop), so nothing framed ever actually used this
          block for sound before now. */}
      {!framed && (
      <FirstRunVeil active={!!firstRunGateActive}>
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
          {gearOpen && <SettingsPanel settings={{ progress: settings.progress, fadeDepth: settings.fadeDepth, timer: settings.timer, typewriter: typewriterOn, progressStyle: settings.progressStyle }} hasMilestones={!!milestones && milestones.beats.length > 0} />}
          {gearOpen && <ThemePanel />}
        </div>
      </FirstRunVeil>
      )}

      <div className="mode-row" data-framed={framed ? 'true' : 'false'}>
        {/* LEFT rail — capture (Journal) / tools (Drafting). Frames only.
            AB1 S2 — when framed, DeskFrame's own tool-rail/corkboard tracks
            take over this job (the Journal capture stub relocates to the
            corkboard's Journal tab); ModeStage's own rail does not mount. */}
        {!framed && (
          <aside className="mode-rail left mode-dissolve" aria-label={`${rail.heading} rail`}>
            <div className="mode-rail-h">{rail.heading}</div>
            {rail.items.map(it => <div key={it} className="mode-rail-item">{it}</div>)}
          </aside>
        )}

        <div className="mode-pagecol" ref={pagecolRef} data-zoom={zoomed ? 'true' : undefined}>
          {/* Format / pen bar (top of page) — chrome, dissolves on write.
              AB2 S2/S3 — retires when framed: its ink swatches and Draft's
              format tools both have a home now in the sliver (CD1:
              components/Sliver.tsx, an overlay anchored inside DeskFrame's
              own stage, a sibling of this whole ModeStage). Below the gate
              this is unchanged. */}
          {!framed && (
          /* PHASE 1 (S5 follow-up) - the narrow-screen format bar follows the drawer's FORMAT rule: while the typewriter is actually RUNNING here (typewriterOn: Draft/Free Write and the
              setting) every format button is disabled and greyed, with the same lexicon tooltip. Revise runs no typewriter, so its bar stays usable. */
          <div className="mode-bar mode-dissolve" role="toolbar" aria-label={rail.tools === 'pen' ? 'Pen' : 'Format'}
            title={rail.tools === 'format' && typewriterOn ? deskT('formatLockedByTypewriter') : undefined}>
            {rail.tools === 'pen' ? (
              <>
                {/* ITEM 130 (2026-09-09) — 'Pen', from the lexicon.
                    This read 'ink' while this same bar's own aria-label read
                    'Pen' (above), so one control carried two names and only
                    assistive tech got the right one. It is the UNFRAMED bar:
                    the narrow shell is the only surface it reaches, which is
                    why the phone showed 'INK' beside text-colour swatches and
                    looked like the Ink wave's zone. It is not — that zone is
                    Sliver.tsx's, framed-only, and cannot render here. */}
                <span className="mode-tlabel">{deskT('modeBarPen')}</span>
                {/* FIX (Fable, Oct 17, ledger 88-90) — PEN_INKS is a fixed,
                    theme-independent set of IDS (the comparison/stored value
                    `choosePen`/`pen === ink` needs to keep working against,
                    unchanged); only the SWATCH'S OWN PAINTED COLOUR must go
                    through the same effectivePenInk() substitution the actual
                    ink on the page already gets (render-prop hand-off,
                    below) — otherwise the chip lies about what tapping it
                    will write in Flux, same species as splash-sweep's
                    page-outline fix: paint the theme's own ink, not Arbor's. */}
                {PEN_INKS.map(ink => (
                  <button
                    key={ink}
                    type="button"
                    className={`mode-swatch${pen === ink ? ' active' : ''}`}
                    style={{ background: effectivePenInk(ink, penTheme, penPageTone) }}
                    aria-label={`Ink ${ink}`}
                    aria-pressed={pen === ink}
                    onClick={() => choosePen(ink)}
                  />
                ))}
                {/* ITEM 130 (2026-09-09) — THE 'nib · fine ▾' BUTTON IS GONE.
                    It was `title="Nib styles — coming soon"`: a control
                    promising a capability this surface does not have. G3 in
                    miniature — progressive disclosure never shows a locked
                    door — so it is ABSENT, never grayed: what isn't built
                    doesn't render. Item 131 (phone ink) brings real nibs here
                    and this is where they land. Dating note, because the word
                    misled the first diagnosis: this button was introduced
                    d65065c on 2026-06-28, ten weeks BEFORE the Ink wave's own
                    nib (af3c79c, 2026-09-07). Same word, unrelated control. */}
              </>
            ) : (
              <>
                <span className="mode-tlabel">format</span>
                <button type="button" disabled={typewriterOn} className="mode-tbtn" title="Bold" onClick={() => exec('bold')}><b>B</b></button>
                <button type="button" disabled={typewriterOn} className="mode-tbtn" title="Italic" onClick={() => exec('italic')}><i>I</i></button>
                <button type="button" disabled={typewriterOn} className="mode-tbtn" title="Underline" onClick={() => exec('underline')}><u>U</u></button>
                <span className="mode-tdiv" />
                <button type="button" disabled={typewriterOn} className="mode-tbtn" title="Heading — coming soon">H</button>
                <button type="button" disabled={typewriterOn} className="mode-tbtn" title="Quote — coming soon">&ldquo;</button>
                <button type="button" disabled={typewriterOn} className="mode-tbtn" title="Bulleted list" onClick={() => exec('insertUnorderedList')}>&bull;</button>
                <button type="button" disabled={typewriterOn} className="mode-tbtn" title="Outdent" onClick={() => exec('outdent')}>&#8676;</button>
                <button type="button" disabled={typewriterOn} className="mode-tbtn" title="Indent" onClick={() => exec('indent')}>&#8677;</button>
                <button type="button" disabled={typewriterOn} className="mode-tbtn mode-tmore" title="More — coming soon">⋯ more</button>
              </>
            )}
          </div>
          )}

          {/* The lit page. Fixed height; the editor scrolls inside (typewriter). */}
          <div
            ref={surfaceRef}
            className={`mode-page${focused ? ' focused' : ''}`}
            data-page={pageNum}
            /* ITEM 121 I3 — which instrument the page currently IS. Additive
               and optional: absent on every host that does not pass it, so the
               attribute simply does not exist on Draft, Revise, the sprint or
               the script page and nothing about them changes. Free Write's own
               switch is the only writer; index.css reads it to put the caret to
               sleep, and the harness reads it to prove the switch and the paper
               never disagree. */
            data-instrument={instrument}
            /* ITEM 126 B2 — the paper wears its ink PERMISSION too, so a check can
               read it independently of the mode and catch the two disagreeing. */
            data-ink={inkPermission}
            /* ITEM 83 M3 (R6) — the paper is the preview: PAGE SETUP's margins
               and leading land here as CSS custom properties, live, as the
               writer chooses them. Empty object when the page carries no dress,
               so index.css's own values govern and the sheet renders exactly as
               it did before M3. */
            style={dressVars(pageDress)}
            onClick={onPaperPress}
          >
            <div
              aria-hidden="true"
              className="sprint-warmth-overlay"
              style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', borderRadius: 'var(--radius-md)', background: 'var(--ember)', opacity: 'calc(var(--sprint-warmth, 0) * var(--ambient-intensity))' }}
            />
            {readouts}
            {pageTitle && <div className="mode-page-title">{pageTitle}</div>}
            <div
              ref={scrollRef}
              className="mode-scroll"
              data-typewriter={typewriterOn ? 'true' : 'false'}
            >
              {children({ noteWrite, penColor: rail.tools === 'pen' ? effectivePenInk(penColorProp ?? pen, penTheme, penPageTone) : undefined })}
            </div>
            {!framed && <div className="mode-wordcount mode-dissolve">{words} words</div>}
          </div>

          {/* Incentive layer — progress bar (a repeating lap toward the word/
              time goal; celebrates + resets on completion) OR the M1
              milestone circle-bar (Progress: Project) + optional session
              timer + the typewriter toggle. Stays visible while writing
              (never carries the dissolve class). M1's silent-degrade rule:
              'project' with no milestones available renders as 'words'
              instead — the STORED setting is untouched, so it resumes on a
              plan-linked page without the writer doing anything.
              AB1 S2 — none of this mounts when framed (DeskFrame): the
              meter track stays empty/reserved for its later return. */}
          {!framed && (
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
                // FX2 S2 — a hand-click here must outrank any later
                // Draft-open seed for the rest of the session (see
                // setTypewriterExplicit's own comment).
                <TypewriterToggle on={typewriterOn} onToggle={() => setTypewriterExplicit(!typewriterOn)} />
              )}
            </div>
          )}
        </div>

        {/* RIGHT rail — AI frame. Sealed in Journal; open elsewhere. AB1 S2 —
            not mounted when framed (a reserved tool-rail/corkboard track
            takes its structural place; the assist channel's own DeskFrame
            home is a later ticket). */}
        {!framed && (rail.ai === 'sealed' ? (
          <aside className="mode-rail right sealed mode-dissolve" aria-label={`AI sealed in ${lex('journal')}`}>
            <div className="mode-lock" aria-hidden="true">▦</div>
            <div className="mode-seal-note">{lex('journal').toLowerCase()} is yours alone</div>
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
        ))}
      </div>

      {/* Connect AI — stub entry point (no provider wired in B3). */}
      {!framed && connectOpen && (
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
// M2 S1 — `framed` gates the NEW Progress-style (Bar|Rhizome) option the
// same "offered only when it exists" way: the growth engine itself (S2)
// only ever mounts on the framed (>=1100px) desk stage (this build's own
// judgment call — see RhizomeField.tsx's header comment for the full
// reasoning), so offering the control below that width would let a writer
// toggle a setting with no visible effect on their current device. The
// STORED value is untouched either way (same silent-degrade law as
// Progress:Project) — it simply resumes the instant the writer is back on
// a framed session.
// SC1 S3 (2026-07-24) — `typewriterAvailable` defaults TRUE, so every
// pre-SC1 caller (this file's own framed/unframed prose gear) is unchanged.
// Sliver.tsx passes false on a screenplay page, where the surface no longer
// runs the typewriter and the option must therefore not present itself: the
// icon toggle is the visible affordance, but this Seg is the second one
// behind the same gear, and hiding only the first would leave a live switch
// that does nothing one click deeper.
export function SettingsPanel({ settings, hasMilestones, framed, typewriterAvailable = true }: { settings: { progress: ProgressMetric; fadeDepth: FadeDepth; timer: boolean; typewriter: boolean; progressStyle: ProgressStyle }; hasMilestones?: boolean; framed?: boolean; typewriterAvailable?: boolean }) {
  const { t: deskLex } = useDeskLexicon();
  const machina = useTheme() === 'machina';
  const progressOpts: [string, string][] = [['words', 'Words'], ['time', 'Time'], ['off', 'Off']];
  // B2.1 S6 — the DISPLAY label only ("Project" -> "Drawer"); the stored
  // ProgressMetric value itself ('project', the setting persisted via
  // setWritingSettings) is a storage identifier and stays untouched, same
  // as every other internal id this fold leaves alone. Hardcoded inline,
  // not lexicon-routed, matching this exact Seg option family's own
  // established precedent (deskLexicon.ts's FX3 comment: 'On'/'Off'/
  // 'Lines'/'Words'/'Time' are deliberately inline here, not per-option
  // lexicon keys).
  if (hasMilestones) progressOpts.splice(2, 0, ['project', 'Drawer']);
  // MACHINA has ONE progress instrument (Run), so the style choice is not offered under it.
  const showProgressStyle = !!framed && settings.progress === 'words' && !machina;
  return (
    <div className="mode-settings" role="menu">
      <h4>settings</h4>
      <Seg label="Progress" value={settings.progress} opts={progressOpts} onPick={v => setWritingSettings({ progress: v as ProgressMetric })} />
      {/* M2 S1 — the Rhizome's own setting. Every string here routes through
          deskLexicon (the brief's own instruction for this ticket), unlike
          the neighboring Seg calls' inline option strings above/below. */}
      {showProgressStyle && (
        <Seg
          label={deskLex('progressStyleLabel')}
          value={settings.progressStyle}
          opts={[['bar', deskLex('progressStyleBar')], ['rhizome', deskLex('progressStyleRhizome')]]}
          onPick={v => setWritingSettings({ progressStyle: v as ProgressStyle })}
        />
      )}
      {/* ITEM word-diet (Nick, Oct 13) — the standing hint below retires;
          its explanation moves here, behind a "?" beside this row's own
          label, one plain sentence (recedeHint, deskLexicon.ts). */}
      <Seg label={<>{deskLex('fadeDepthLabel')} <DrawerNote label={`About ${deskLex('fadeDepthLabel')}`}>{deskLex('recedeHint')}</DrawerNote></>} value={settings.fadeDepth} opts={[['partial', deskLex('fadeDepthPartial')], ['full', deskLex('fadeDepthFull')]]} onPick={v => setWritingSettings({ fadeDepth: v as FadeDepth })} />
      <Seg label={deskLex('timerLabel')} value={settings.timer ? 'on' : 'off'} opts={[['on', 'On'], ['off', 'Off']]} onPick={v => setWritingSettings({ timer: v === 'on' })} />
      {/* FX2 S2 — routes through setTypewriterExplicit, not the bare
          setter: the gear is the OTHER hand-click surface (beside the
          sliver's own TypewriterToggle), and both must arm the same
          session-explicit flag so neither can be silently overridden by a
          later Draft-open seed. */}
      {typewriterAvailable && <Seg label="Typewriter" value={settings.typewriter ? 'on' : 'off'} opts={[['on', 'On'], ['off', 'Off']]} onPick={v => setTypewriterExplicit(v === 'on')} />}
    </div>
  );
}

// TH2 — the theme/prefs menu, a second panel beside SettingsPanel (kept
// separate: theme selection is cross-theme/account-level, not this surface's
// own writing-chrome behavior). Switching Theme is instant and lossless —
// only a data-theme attribute write, no reload, no unmount of the editor
// (PAGE IS PRIMARY holds trivially: nothing here touches the page's rect).
export function ThemePanel() {
  const theme = useTheme();
  const prefs = useThemePrefs();
  const dial = useAmbianceDial();
  // Fable's A3 (TH2 review) — picker order follows theme-arc.md's narrative
  // progression (Plateau -> Machina -> Flux -> Nomad -> Volant), not launch
  // order; later territories arrive here only by progressive disclosure
  // (engagement-facts the app already shows, never a solicited/gated
  // target — the M1 anti-gamification frame). Two entries make the order
  // moot today, but the law belongs at the site that will enforce it.
  const themeOpts: [string, string][] = [['plateau', 'Arbor'], ['flux', 'Flux']];
  return (
    <div className="mode-settings mode-theme-settings" role="menu">
      <h4>theme</h4>
      <Seg label="Theme" value={theme} opts={themeOpts} onPick={v => setTheme(v as ThemeId)} />
      <Seg label="Voice" value={prefs.voice} opts={[['serif', 'Serif'], ['sans', 'Sans']]} onPick={v => setThemePrefs({ voice: v as 'serif' | 'sans' })} />
      <Seg label="Page" value={prefs.page} opts={[['light', 'Light'], ['dark', 'Dark']]} onPick={v => setThemePrefs({ page: v as 'dark' | 'light' })} />
      <Seg label="Fade" value={prefs.fade} opts={[['on', 'On'], ['off', 'Off']]} onPick={v => setThemePrefs({ fade: v as 'on' | 'off' })} />
      {/* R2 (TH2 review) — a canon-level pref with no UI is a TH1 allowance,
          not a TH2 one, now that Flux actually schedules dial-scaled events. */}
      <Seg label="Ambiance" value={String(dial)} opts={[['0', '0'], ['25', '25'], ['50', '50'], ['75', '75'], ['100', '100']]} onPick={v => setAmbianceDial(Number(v))} />
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

export function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3.1" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V15z" />
    </svg>
  );
}

// `soon` lists options shown as stand-ins for unbuilt capability: dimmed, inert, titled `soonTitle`.
// PHASE 1 (S4): `disabled` greys the whole row and makes it unusable (real disabled buttons: unfocusable, unclickable, announced as unavailable). The row's
// value is untouched - a greyed row still SHOWS what it will do when its mode is back on.
// ITEM word-diet — `label` widened from `string` to `ReactNode` so a caller
// can attach a DrawerNote "?" beside it; every existing caller passes a
// plain string (still a valid ReactNode).
export function Seg({ label, value, opts, onPick, soon, soonTitle, disabled }: { label: ReactNode; value: string; opts: [string, string][]; onPick: (v: string) => void; soon?: string[]; soonTitle?: string; disabled?: boolean }) {
  return (
    <div className="mode-crow" data-disabled={disabled ? 'true' : undefined}>
      <span>{label}</span>
      <div className="mode-seg">
        {opts.map(([v, txt]) => soon?.includes(v)
          ? <button key={v} type="button" className="mode-seg-soon" aria-disabled="true" title={soonTitle}>{txt}</button>
          : <button key={v} type="button" className={value === v ? 'on' : ''} disabled={disabled} onClick={() => onPick(v)}>{txt}</button>
        )}
      </div>
    </div>
  );
}
