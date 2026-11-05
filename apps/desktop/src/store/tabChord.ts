// the Tab key as a state machine: Tab is not a modifier, so Tab+1 is a chord only after Tab has been HELD CHORD_HOLD_MS; under it, a pending Tab applies first and the 1 types [tabChord §1]
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
