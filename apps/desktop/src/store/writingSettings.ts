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
  // ITEM 83 M4 (R3) — THE TYPEWRITER MENU's own adjustments. Nick's ruling:
  // "the Typewriter toggle button should also include an option to open
  // additional Typewriter settings, which is where options like the 'Forward
  // Lock' and 'Line Fade' should be able to be turned on/off and adjusted
  // (Forward Lock should be customizable by number of words, number of
  // sentences, etc. Line Fade should be customizable by number of lines that
  // show, if the current line being written should be in the center of the
  // page or closer to the top or closer to the bottom)."
  //
  // NAMING, per F1's default: his latest words govern — "Forward Lock" and
  // "Line Fade", retiring Chamber 1's "Forward Momentum"/"Text Fade".
  //
  // Every default below reproduces TODAY's behaviour, so a device with a
  // pre-M4 stored blob (which has none of these keys) resolves through load()'s
  // `{ ...DEFAULTS, ...parsed }` merge to exactly what it does now.
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

// PHASE 1 (S5) - THE TYPEWRITER IS REMEMBERED PER PAGE, on this device (Nick, Oct 11). This REPLACES two things, both gone: FX2 S2's line-count seed
// ("opens ON under 10 line-equivalents", with item 87's empty-page amendment) and its session-only `explicitlySetThisSession` flag. The pattern is item
// 112-A's `wrizo-mode-page-<id>`: a plain localStorage key per page, WRITTEN ON EVERY TOGGLE and READ ONCE AT MOUNT. No database, no schema, no server.
//
// `typewriter` above stays the ONE global, persisted, live value every consumer reads; what is new is what puts a value INTO it when a page opens:
//   · a saved value for this page      -> that;
//   · none, and the page is EMPTY      -> the theme's default (store/theme.ts THEME_CONFIG: Arbor on, Flux off) - a new page;
//   · none, and the page holds text    -> OFF (a page that existed before this shipped is not surprised);
// and whichever applied is then saved, so the page remembers from its first open. FREE WRITE IS UNCHANGED: it never calls this and a toggle there writes no page value.
// Prose Draft and Screenplay pages both call it (ScriptEditor reads it too; that surface does not run the fade, per SC1 S3, but the toggle and the Format lock read the
// same value). Tab still indents - this touches nothing but the one boolean.
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

// The page whose Draft surface is mounted right now (set by holdTypewriterPage). The shared toggles (Sliver, ModeStage, JournalEntry) call
// setTypewriterExplicit without knowing a page; this is how a Draft page's toggle reaches its own key. Null on Free Write and everywhere else.
let heldPageId: string | null = null;
export function holdTypewriterPage(id: string): () => void {
  heldPageId = id;
  return () => { if (heldPageId === id) heldPageId = null; };
}

/** The writer's toggle. Writes the live value and, on a held Draft/Screenplay page, that page's own memory. */
export function setTypewriterExplicit(on: boolean): void {
  setWritingSettings({ typewriter: on });
  if (heldPageId != null) writePageTypewriter(heldPageId, on);
}

/** Once per page mount (PageEditor / ScriptEditor, when the page opens into Draft). `empty` = the page holds no text yet. */
export function enterPageTypewriter(id: string, empty: boolean): void {
  const saved = readPageTypewriter(id);
  const on = saved ?? (empty ? THEME_CONFIG[getTheme()].typewriterDefault : false);
  setWritingSettings({ typewriter: on });
  if (saved == null) writePageTypewriter(id, on);
}
