// CW1 — the Middle Door / chrome-fade shell. A reusable recede primitive: while
// the writer is actively writing, non-essential chrome fades below the attention
// threshold (PHILOSOPHY P8); on intent or genuine idle it eases back. The editor,
// the caret, and the J5 ambient warmth never fade — that's the surface, not
// chrome. Not QuickSprint-specific: the journal page (CW3) and the gate opt in
// with the same wire-up.
//
// CW4 — the writing-mode boolean is re-homed into WritingSession so the global
// header (App.tsx), and later the journal/gate/HOME, recede together with this
// surface from one source of truth. The recede MECHANICS still live here: the
// 500ms settle, the intent/idle restore, and the `.chrome-fade` /
// `data-chrome-receded` convention (styling + reduced-motion in index.css).
//
// Usage:
//   const { receded, noteForward, restore } = useChromeFade({ surface: 'sprint' });
//   <div className="page" data-chrome-receded={receded ? 'true' : 'false'}>
//     ...mark fading chrome with className="chrome-fade"...
//     <ChromeHandle onReveal={restore} />
//   <editor onForward={() => { ...; noteForward(); }} />

interface Options {
  settleMs?: number;       // delay before entering writing mode (a stray key shouldn't strobe)
  idleMs?: number;         // genuine-idle horizon → restore chrome
  editorSelector?: string; // a tap inside this is writing, not "tap outside text"
  surface?: string;        // names the active writing surface in the session (e.g. 'sprint')
}

export interface ChromeFade {
  receded: boolean;
  noteForward: () => void; // call on every forward keystroke (editor.onForward)
  restore: () => void;     // force chrome back (intent)
}

// The ever-present minimal affordance: a barely-there ember handle that stays
// visible even while receded, so chrome is always discoverable. Hover/focus/tap
// reveals everything — the sprint chrome and the global header together, since
// they share one writing-mode source of truth.
export function ChromeHandle({ onReveal, label = 'Show controls' }: { onReveal: () => void; label?: string }) {
  return (
    <button
      type="button"
      className="chrome-handle"
      aria-label={label}
      onPointerEnter={onReveal}
      onFocus={onReveal}
      onClick={onReveal}
    />
  );
}
