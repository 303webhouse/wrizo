import { useEffect, useState } from 'react';
import { getTheme, THEME_CONFIG } from './theme';

// Mode-aware editor (Phase 2) — the writer's chrome settings, behind the gear in
// the writing studio. Real toggles, persisted; read by ModeStage (rails/glow/
// progress/typewriter) and QuickSprint (top-bar fade behaviour). A tiny
// module-level store with a subscriber set so every consumer stays in sync when
// the gear changes one value.
//
//   progress  — the progress bar's metric (or hidden). Off still warms the glow.
//   fadeDepth — recede depth: how faint the chrome goes while writing (8% / gone).
//   timer     — opt-in slim session clock in the incentive layer (off by default).
//   typewriter— the line-following fade: history scrolls up and fades as you write.
//
// Return timing (3-min wait / 2-min slow fade-in) is FIXED product behaviour, not
// a setting — the prototype's Preview/Real toggle was a demo affordance, not shipped.

// M1 — 'project' (the milestone circle-bar) joins the axis. Offered in the
// gear only when the current page belongs to a project with a StoryPlan
// (docs/progress-milestones-canon.md, Q3); on any other page this setting
// silently degrades to 'words' at render time — no greyed states, and the
// stored value itself is untouched (so it "comes back" the next time the
// writer is on a plan-linked page).
export type ProgressMetric = 'words' | 'time' | 'project' | 'off';
export type FadeDepth = 'partial' | 'full';
// M2 — the Rhizome (docs/wrizo-alpha/m2-rhizome-brief.md, S1). Bar (the
// shipped default) | Rhizome. Stored exactly like every other axis on this
// same object (client settings store, no schema, no new field kind). The
// CONTROL that sets this is offered only when `progress === 'words'` (the
// M1 R1 "offered only when it exists" precedent) — the stored value itself
// is untouched outside that context, so it resumes the moment the writer is
// back on Progress:Words, the same silent-degrade law M1 established for
// 'project'.
export type ProgressStyle = 'bar' | 'rhizome';

export interface WritingSettings {
  progress: ProgressMetric;
  fadeDepth: FadeDepth;
  timer: boolean;
  typewriter: boolean;
  progressStyle: ProgressStyle;
  // FX3 S5 — the sliver foot's new instruments panel (components/Sliver.tsx's
  // SliverInstrumentRow): a master on/off for the goal instruments (the
  // sliver's progress hairline + GoalGlow.tsx's paper glow), independent of
  // whether a target NUMBER is stored (store/writingGoal.ts) — clearing the
  // target already hides both (a standing CD1 S6 law, untouched); this is
  // an ADDITIONAL gate on top of that, for hiding them temporarily without
  // losing the stored target. Default true: byte-identical to pre-FX3
  // behavior (both instruments already showed whenever a target existed).
  instrumentsOn: boolean;
  // the Typewriter menu's adjustments; every default reproduces today's behaviour, so an older stored blob resolves unchanged [writingSettings §1]
  forwardLockUnit: 'words' | 'sentences';
  forwardLockCount: number;
  // O-FW2 RESOLVED BY MERGER (R3): the gear's old `fadeDepth` folds in here.
  // `fadeDepth` above is kept — it still drives useTypewriterFade — but its
  // CONTROL leaves the gear and becomes Line Fade's on/off + line count. No
  // second fade home survives.
  lineFadeOn: boolean;
  lineFadeLines: number;
  // Where the line being written sits on the sheet. 'center' is the built
  // behaviour (useTypewriterFade's ~62% hold band), so it is the default.
  writingLine: 'top' | 'center' | 'bottom';
  pageScroll: boolean;
  // GLITCH METER (brief docs/briefs/flux-flicker-meter-brief.md, rule 5): "Easy to turn off: a Flicker on/off switch; off means none
  // anywhere." Flux's Glitch meter only (components/GlitchMeter.tsx); the ambient Signal Loss texture has its own Ambiance dial. On by
  // default (the approved mockup's switch starts ON); a pre-meter stored blob merges to it through load()'s `{ ...DEFAULTS, ...parsed }`.
  flicker: boolean;
}

const KEY = 'wrizo-writing-settings';
const DEFAULTS: WritingSettings = {
  progress: 'words',
  fadeDepth: 'partial',
  timer: false,
  // FX2 S2 errata — the line below this comment used to claim ModeStage
  // "never" engages typewriter in Draft; that stopped being true when a
  // prior ticket (believed FX1) extended the gate to `mode === 'drafting'`
  // too (see ModeStage.tsx's own typewriterOn line) — trust the code, not
  // this comment, was the standing lesson. This default (true) is only
  // the FIRST-EVER-LOAD fallback before any page has opened; FX2 S2 adds a
  // real opening default on top of it (seedTypewriterDefault, below) that
  // fires once per Draft-mode page-open and sets this to ON/OFF based on
  // the page's own line count — Free Write is untouched by that seed and
  // keeps relying on this bare default.
  typewriter: true,
  instrumentsOn: true,
  // M2 S1 — Bar is the shipped default; a legacy device with no stored
  // style value falls through to this, byte-identical to pre-M2 in every
  // mode (the `{ ...DEFAULTS, ...parsed }` merge in `load()` below means a
  // pre-M2 stored blob, which never had this key, resolves here too).
  progressStyle: 'bar',
  // ITEM 83 M4 (R3) — every value here reproduces today's behaviour, so a
  // pre-M4 stored blob merges to byte-identical rendering.
  forwardLockUnit: 'words',
  forwardLockCount: 1,
  // Line Fade ON matches the shipped typewriter fade (fadeDepth 'partial');
  // the count is the band useTypewriterFade already holds.
  lineFadeOn: true,
  lineFadeLines: 3,
  writingLine: 'center',
  pageScroll: true,
  flicker: true,
};

function load(): WritingSettings {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<WritingSettings>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

let current: WritingSettings = load();
const subs = new Set<(s: WritingSettings) => void>();

export function getWritingSettings(): WritingSettings {
  return current;
}

export function setWritingSettings(patch: Partial<WritingSettings>): void {
  current = { ...current, ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(current)); } catch { /* ignore */ }
  subs.forEach(fn => fn(current));
}

// Subscribe a React component to the settings. Returns the live value; re-renders
// on any change made anywhere (the gear, another surface).
export function useWritingSettings(): WritingSettings {
  const [value, setValue] = useState(current);
  useEffect(() => {
    const fn = (s: WritingSettings) => setValue(s);
    subs.add(fn);
    // Re-sync in case it changed between module read and mount.
    setValue(current);
    return () => { subs.delete(fn); };
  }, []);
  return value;
}

// the typewriter is remembered per page on this device: a plain localStorage key per page, written on every toggle and read once at mount; no shared mirror, so one page's value never outlives its mount [writingSettings §2]
const pageKey = (id: string) => `wrizo-typewriter-page-${id}`;

export function readPageTypewriter(id: string): boolean | null {
  try {
    const v = localStorage.getItem(pageKey(id));
    return v === 'on' ? true : v === 'off' ? false : null;
  } catch { return null; }
}
function writePageTypewriter(id: string, on: boolean): void {
  try { localStorage.setItem(pageKey(id), on ? 'on' : 'off'); } catch { /* ignore */ }
}

// the pure read every Draft/Screenplay consumer asks: this page's saved value, else the theme's default for an empty page, else off; no side effect [writingSettings §3]
export function typewriterForPage(id: string, empty: boolean): boolean {
  const saved = readPageTypewriter(id);
  return saved ?? (empty ? THEME_CONFIG[getTheme()].typewriterDefault : false);
}

// The page whose Draft surface is mounted right now (set by holdTypewriterPage). The shared toggles (Sliver, ModeStage, JournalEntry) call
// setTypewriterExplicit without knowing a page; this is how a Draft page's toggle reaches its own key. Null on Free Write and everywhere else.
let heldPageId: string | null = null;
export function holdTypewriterPage(id: string): () => void {
  heldPageId = id;
  return () => { if (heldPageId === id) heldPageId = null; };
}

// FLUX3 S4 - the Jack In default: a SESSION overlay on Free Write's shared field, laid only by src/flux3/FluxJackedIn.tsx (Flux, under ?flux3=1).
// It is never saved and never written into `typewriter`, so no other theme's Typewriter changes; the writer's own toggle (below) clears it.
let freeWriteOverlay = false;
export function setFreeWriteOverlay(on: boolean): void {
  if (freeWriteOverlay === on) return;
  freeWriteOverlay = on;
  current = { ...current };   // a new value, so every reader re-renders; nothing is stored
  subs.forEach(fn => fn(current));
}
/** Free Write's Typewriter: the shared field, or the Jack In default's overlay while it lies. */
export function freeWriteTypewriter(s: WritingSettings): boolean {
  return s.typewriter || freeWriteOverlay;
}

/** The writer's toggle. Writes the live value and, on a held Draft/Screenplay page, that page's own memory. */
export function setTypewriterExplicit(on: boolean): void {
  freeWriteOverlay = false;
  setWritingSettings({ typewriter: on });
  if (heldPageId != null) writePageTypewriter(heldPageId, on);
}

// once per page mount, opening into Draft: resolves and saves this page's own value, never mirrored into the shared field [writingSettings §4]
export function enterPageTypewriter(id: string, empty: boolean): void {
  const saved = readPageTypewriter(id);
  if (saved == null) writePageTypewriter(id, empty ? THEME_CONFIG[getTheme()].typewriterDefault : false);
}
