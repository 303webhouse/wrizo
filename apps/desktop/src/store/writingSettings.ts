import { useEffect, useState } from 'react';

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

// FX2 S2 (docs/wrizo-alpha/fx2-second-sitting-brief.md) — the Draft-open
// typewriter default: Draft opens with typewriter ON unless the page
// already holds 10+ line-equivalents at mount; Free Write is unaffected.
// `typewriter` itself stays the ONE global, persisted value above (no
// per-page storage) — what's new is the SESSION-scoped (in-memory only; a
// fresh app load is a fresh session) bookkeeping needed to tell "the app
// auto-seeding a Draft-open default" apart from "the writer explicitly
// chose a value" — the latter must win for the rest of the session and
// never be silently re-imposed by a later page-open seed. A page-level ref
// (PageEditor.tsx's warmRef idiom) can't carry this: the flag has to
// survive across DIFFERENT pages/mounts within one session, not just one
// component's lifetime, so it lives at module scope instead, exactly like
// `current`/`subs` above.
let explicitlySetThisSession = false;

// The toggle's own click handlers (Sliver.tsx, ModeStage.tsx's SettingsPanel
// Seg) call this instead of the bare setter — it both writes the setting
// AND arms the flag that makes every later seedTypewriterDefault() a no-op,
// for the rest of this session.
export function setTypewriterExplicit(on: boolean): void {
  explicitlySetThisSession = true;
  setWritingSettings({ typewriter: on });
}

// The line-equivalents threshold (store/lineEquivalents.ts's canonical
// measure) below which a fresh Draft-open seeds typewriter ON rather than
// OFF. Shared here (not duplicated in PageEditor.tsx/ScriptEditor.tsx, its
// only two callers) so the two hosts can't drift on what "already holds
// substantial work" means.
export const DRAFT_TYPEWRITER_LINE_THRESHOLD = 10;

// Called once per surface mount, only when the EFFECTIVE mode at OPEN is
// Draft (PageEditor.tsx's per-page remembered mode, or ScriptEditor.tsx's
// always-Draft posture). Callers guard the "once per mount, never re-armed
// by a later mode switch" part themselves — an effect with empty deps is
// enough since both hosts already remount per page via `key={id}`
// (PageEditor.tsx's warmRef / Sliver.tsx's initialGoalTextRef are the same
// "captured once at mount" idiom for cases that need an explicit ref
// instead) — that guard is inherently per-component, not something this
// module-level store can own. A no-op once the writer has explicitly
// chosen a value this session — the one thing this whole mechanism exists
// to prevent.
export function seedTypewriterDefault(on: boolean): void {
  if (explicitlySetThisSession) return;
  setWritingSettings({ typewriter: on });
}
