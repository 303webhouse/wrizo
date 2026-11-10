// THE REFERENCE MODEL (writing audit, session 1; brief §6): the text a writer expects and where the caret (or selection) should be, kept BESIDE the app and never read from it.
// Plain text with '\n' between paragraphs; a selection is two offsets into that text: anchor `a` (where it began) and focus `f` (the end the caret is on). Collapsed when a === f.
// Every step the audit performs is applied here first; the app is then compared to this (verify.mjs). Pure: no DOM, no browser, so it is unit-tested in model-unit.mjs without one.
//
// ORACLE ASSUMPTIONS (a finding that rests on one of these says so):
//   - lines in the cases are short enough not to wrap, so Home/End are the logical line's start/end (a wrapped paragraph's visual lines are session 2's layout-aware oracle);
//   - Up/Down are NOT modelled here (the goal column is by x-position in a proportional face, not by character count): session 2 reads the neighbouring line's geometry for them;
//   - word movement and word deletion follow the platform the browser runs on: Windows (the box and Nick's machine) moves Ctrl+Right to the START of the next word; Linux (Actions) to the END of this one.
//     The model takes `platform` ('win' | 'linux'); a word-rule finding is reported with it, because the same keys are not the same act on the two.
//   - words are runs of letters, digits and underscore; the cases keep punctuation out of word operations.

const isSpace = (c) => c === ' ' || c === '\t' || c === ' ';
const isWord = (c) => /[\p{L}\p{N}_]/u.test(c);

/** Start of the word before p (Ctrl+Left, Ctrl+Backspace). A paragraph boundary is one step. */
export function prevWordStart(t, p) {
  if (p <= 0) return 0;
  if (t[p - 1] === '\n') return p - 1;
  let q = p;
  while (q > 0 && isSpace(t[q - 1])) q--;
  if (q === 0 || t[q - 1] === '\n') return q;
  const cls = isWord(t[q - 1]);
  while (q > 0 && t[q - 1] !== '\n' && !isSpace(t[q - 1]) && isWord(t[q - 1]) === cls) q--;
  return q;
}

/** End of this word / start of the next (Ctrl+Right, Ctrl+Delete): platform-dependent. */
export function nextWordStop(t, p, platform) {
  const n = t.length;
  if (p >= n) return n;
  if (t[p] === '\n') return p + 1;
  let q = p;
  if (platform === 'win') {
    if (!isSpace(t[q])) { const cls = isWord(t[q]); while (q < n && t[q] !== '\n' && !isSpace(t[q]) && isWord(t[q]) === cls) q++; }
    while (q < n && isSpace(t[q])) q++;
    return q;
  }
  while (q < n && isSpace(t[q])) q++;
  if (q < n && t[q] !== '\n') { const cls = isWord(t[q]); while (q < n && t[q] !== '\n' && !isSpace(t[q]) && isWord(t[q]) === cls) q++; }
  return q;
}

export class Model {
  constructor(text = '', a = text.length, f = a, platform = 'linux') { this.text = text; this.a = a; this.f = f; this.platform = platform; }
  clone() { return new Model(this.text, this.a, this.f, this.platform); }
  get start() { return Math.min(this.a, this.f); }
  get end() { return Math.max(this.a, this.f); }
  get collapsed() { return this.a === this.f; }
  snapshot() { return { text: this.text, a: this.a, f: this.f }; }
  lineStart(p) { const i = this.text.lastIndexOf('\n', p - 1); return i < 0 ? 0 : i + 1; }
  lineEnd(p) { const i = this.text.indexOf('\n', p); return i < 0 ? this.text.length : i; }

  replace(from, to, s) { this.text = this.text.slice(0, from) + s + this.text.slice(to); this.a = this.f = from + s.length; }
  /** type a run of characters ('\n' is an Enter) over the selection */
  type(s) { this.replace(this.start, this.end, s); }

  /** a keyboard step: { key, shift?, ctrl? } (the audit's steps use these names; 'a' with ctrl is select-all) */
  key({ key, shift = false, ctrl = false }) {
    const t = this.text, n = t.length;
    const move = (to) => { if (shift) this.f = to; else this.a = this.f = to; };
    switch (key) {
      case 'Enter': this.replace(this.start, this.end, '\n'); return;       // Shift+Enter is a line break the same way (the model has one kind of newline; a different stored shape would be its own finding)
      case 'Backspace':
        if (!this.collapsed) { this.replace(this.start, this.end, ''); return; }
        if (this.f === 0) return;
        this.replace(ctrl ? prevWordStart(t, this.f) : this.f - 1, this.f, ''); return;
      case 'Delete':
        if (!this.collapsed) { this.replace(this.start, this.end, ''); return; }
        if (this.f >= n) return;
        this.replace(this.f, ctrl ? nextWordStop(t, this.f, this.platform) : this.f + 1, ''); return;
      case 'ArrowLeft':
        if (!shift && !this.collapsed) { const s = ctrl ? prevWordStart(t, this.start) : this.start; this.a = this.f = s; return; }
        move(ctrl ? prevWordStart(t, this.f) : Math.max(0, this.f - 1)); return;
      case 'ArrowRight':
        if (!shift && !this.collapsed) { const e = ctrl ? nextWordStop(t, this.end, this.platform) : this.end; this.a = this.f = e; return; }
        move(ctrl ? nextWordStop(t, this.f, this.platform) : Math.min(n, this.f + 1)); return;
      case 'Home': move(ctrl ? 0 : this.lineStart(this.f)); return;
      case 'End': move(ctrl ? n : this.lineEnd(this.f)); return;
      case 'a': if (ctrl) { this.a = 0; this.f = n; return; } break;
      default: break;
    }
    throw new Error(`model: no rule for key ${key}${ctrl ? ' +ctrl' : ''}${shift ? ' +shift' : ''}`);
  }

  apply(step) {
    if (step.k === 'type') this.type(step.s);
    else if (step.k === 'key') this.key(step);
    else if (step.k === 'place') { this.a = step.a; this.f = step.f ?? step.a; }
    else throw new Error('model: unknown step ' + JSON.stringify(step));
    return this;
  }
}

/** a short human line for a step, for reports */
export function stepLabel(st) {
  if (st.k === 'type') return `type ${JSON.stringify(st.s)}`;
  if (st.k === 'key') return `${st.ctrl ? 'Ctrl+' : ''}${st.shift ? 'Shift+' : ''}${st.key}`;
  if (st.k === 'place') return `place ${st.a}${st.f !== undefined && st.f !== st.a ? '..' + st.f : ''}`;
  return JSON.stringify(st);
}
