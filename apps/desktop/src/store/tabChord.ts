// WRITING-SURFACE S0 STEP 3 - THE TAB KEY, AS A STATE MACHINE (Nick, 2026-09-25: "TAB + 1 indents the whole paragraph. All Tab
// keystrokes should keep indenting the text further, too, even if it has already been indented once.").
//
//   Tab            one first-line level (a leading tab), as many presses as the writer likes: 1, 2, 3 levels.
//   Shift+Tab      one first-line level back.
//   Tab HELD + 1   one whole-paragraph (block) level per press of the 1.
//   Shift+Tab HELD + 1   one block level back.
//
// TAB IS NOT A MODIFIER, so this cannot be the usual chord test. A writer typing a numbered list taps Tab and then 1 with the two
// keys overlapping for a few tens of milliseconds ("rollover"); that must be a tab followed by a typed 1, never a block indent
// that eats the 1. So a chord counts only when Tab has been HELD for CHORD_HOLD_MS before the 1 goes down. Under the threshold the
// pending Tab is applied FIRST and the 1 is left to type.
//
// THE THRESHOLD IS 200 ms: a deliberate hold is a decision a writer makes (well over 200 ms), and overlap between two consecutive
// keystrokes of one touch-typed sequence is a small fraction of that. It is a named constant so the number in the harness, the doc
// and the code are the same number; the harness measures both sides of it (a 60 ms rollover types the 1, a 400 ms hold chords).
//
// A Tab is applied when it is RELEASED (or the moment any other key proves it was a tap), not when it goes down - because at the
// moment it goes down nobody knows yet whether a 1 is coming. A tap is well under 100 ms, so the indent lands before the writer
// could notice. Auto-repeat (a held Tab sending keydown after keydown) is swallowed: one press, one level.
//
// PURE, so it can be proved without a browser: events in, {preventDefault, acts} out. The host performs the acts.
export const CHORD_HOLD_MS = 200;

export type TabAct = 'indent' | 'outdent' | 'block-indent' | 'block-outdent';

export interface TabKeyEvent {
  key: string;
  code: string;
  repeat: boolean;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  isComposing?: boolean;
  timeStamp: number;
}

export interface TabStep { preventDefault: boolean; acts: TabAct[] }

const NONE: TabStep = { preventDefault: false, acts: [] };
const isModifier = (k: string) => k === 'Shift' || k === 'Control' || k === 'Alt' || k === 'Meta' || k === 'CapsLock';
const isOne = (code: string) => code === 'Digit1' || code === 'Numpad1';

export interface TabChord {
  keydown(e: TabKeyEvent): TabStep;
  keyup(e: Pick<TabKeyEvent, 'key'>): TabStep;
  reset(): void;
}

/** `chordAllowed(shift)` says whether a held-Tab + 1 may act at all right now (Free Write allows it on a blank line only, and never
 *  for the outdent); when it says no, the 1 is simply typed and the pending Tab is applied first, as for any other key. */
export function createTabChord(chordAllowed: (shift: boolean) => boolean = () => true): TabChord {
  let down = false;
  let shift = false;
  let at = 0;
  let pending = false;       // the Tab has not been applied yet
  let chorded = false;       // a block act has fired while this Tab has been held

  const tabAct = (): TabAct => (shift ? 'outdent' : 'indent');
  const blockAct = (): TabAct => (shift ? 'block-outdent' : 'block-indent');
  const reset = () => { down = false; pending = false; chorded = false; };

  return {
    reset,
    keydown(e) {
      if (e.isComposing) return NONE;
      if (e.key === 'Tab') {
        if (e.ctrlKey || e.metaKey || e.altKey) return NONE;
        if (down) return { preventDefault: true, acts: [] };            // auto-repeat: one press, one level
        down = true; shift = e.shiftKey; at = e.timeStamp; pending = true; chorded = false;
        return { preventDefault: true, acts: [] };
      }
      if (!down || isModifier(e.key)) return NONE;
      if (isOne(e.code) && chordAllowed(shift)) {
        if (chorded) return e.repeat ? { preventDefault: true, acts: [] } : { preventDefault: true, acts: [blockAct()] };
        if (pending && e.timeStamp - at >= CHORD_HOLD_MS) {
          pending = false; chorded = true;
          return { preventDefault: true, acts: [blockAct()] };
        }
      }
      // any other key (or a 1 that arrived inside the rollover window): the Tab was a tap - apply it FIRST, then let the key type
      if (pending) { pending = false; return { preventDefault: false, acts: [tabAct()] }; }
      return NONE;
    },
    keyup(e) {
      if (e.key !== 'Tab' || !down) return NONE;
      const acts: TabAct[] = pending ? [tabAct()] : [];
      reset();
      return { preventDefault: true, acts };
    },
  };
}
