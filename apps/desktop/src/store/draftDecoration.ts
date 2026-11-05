// AB2 S0/S3 — the iA register. Draft's markdown conventions (S0: bold `**`,
// italic `*`, headings `#`/`##`, spacing = blank lines) live in `entry.text`
// as plain characters — no rich-text state, no hidden model. This module is
// the DISPLAY pass only: given the plain text, it returns an HTML string
// where the convention characters stay in the DOM (dimmed via `.md-mark`)
// and the effect they request renders live (bold/italic weight, heading
// size) — "the marks show their work." Pure and total: malformed/unclosed
// markers simply fall through as plain escaped text (never throws, never
// hides a character). Character COUNT is always preserved 1:1 against the
// input (only <span> wrapping is added), which is what lets a caller restore
// a plain-text caret offset after re-decorating (see ForwardOnlyEditor.tsx).

import { closeMark, readEscapes, readLead, readMarks, type MarkKind, type MarkRun } from './markRuns';
import { ensureFaceLoaded, faceForSlug, faceStack } from './fontRoster';

function escHtml(s: string): string {
  return s.replace(/[&<>]/g, c => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : '&gt;'));
}



const H2 = /^(##\s+)([\s\S]*)$/;
const H1 = /^(#\s+)([\s\S]*)$/;

// an indent's leading tabs are MARKERS (they wear .md-mark); the tab itself draws the level under pre-wrap; split off before the heading match so an indented `# ` still reads as a heading, and the count stays 1:1 [draftDecoration §1]
const LEADING_TABS = /^(\t+)([\s\S]*)$/;


// the card's display register: markers hidden by font-size:0, never display:none or visibility:hidden, because the stored text is read from innerText [draftDecoration §2]
function decorateInlineForCard(text: string, caret: number | null): string {
  // STEP 3: the runs come from store/markRuns.ts - the SAME reader the formatter toggles from - so the page can nest marks
  // (`__*x*__` paints underline AND italic, both collapsed) and cannot disagree with the formatter about what is a run.
  // ITEM 211: on the page the marks never reveal. Every character is still emitted exactly once, so the 1:1 count the caret
  // restore depends on holds.
  const runs = readMarks(text);
  // TYPED-LITERAL: a typed formatting character is stored escaped (`\*`); its backslash is a hidden mark, so the page shows the character
  // alone and still holds every stored character (the 1:1 count the caret restore depends on). `seg` writes plain text with its escapes.
  const escapes = readEscapes(text);
  const ESC = '<span class="md-mark md-mark-hidden md-escape">\\</span>';
  const seg = (a: number, b: number): string => {
    let out = '';
    let from = a;
    for (const x of escapes) {
      if (x < a || x >= b) continue;
      out += escHtml(text.slice(from, x)) + ESC;
      from = x + 1;
    }
    return out + escHtml(text.slice(from, b));
  };
  const cls: Record<MarkKind, string> = { bold: 'md-bold', italic: 'md-italic', underline: 'md-underline', strike: 'md-strike' };
  const emit = (lo: number, hi: number, within: MarkRun[]): string => {
    let out = '';
    let cur = lo;
    for (let i = 0; i < within.length; i++) {
      const r = within[i];
      const ml = r.mark.length;
      const cm = closeMark(r);
      const end = r.close + cm.length;
      // the runs nested inside this one are the ones that follow it and end no later than it does
      const kids: MarkRun[] = [];
      while (i + 1 < within.length && within[i + 1].open >= r.open + ml && within[i + 1].close + closeMark(within[i + 1]).length <= r.close) {
        kids.push(within[i + 1]);
        i++;
      }
      // markers never show; the style still paints and the marks stay in the text, so storage, undo and innerText are unchanged [draftDecoration §3]
      void caret;   // kept in the signature: a caret move and a format press call the same painter
      const markCls = 'md-mark md-mark-hidden';
      out += seg(cur, r.open);   // TYPED-LITERAL: the text before a run, its escapes' backslashes hidden
      // FONT-SPAN: a font span paints its face (the roster's whole stack) on its words; its two marks are hidden like every other
      // mark. A face this build does not have loaded yet is fetched now (memoised; the stack's fallback shows meanwhile).
      let wrap: string;
      if (r.kind === 'font') {
        // a style span paints its face, its size (real points in page units), or both; its hidden marks keep their own zero size [draftDecoration §4]
        const style: string[] = [];
        let attrs = '';
        if (r.face) {
          const face = faceForSlug(r.face);
          void ensureFaceLoaded(face.name);
          attrs += ` data-face="${escHtml(face.name).replace(/"/g, '&quot;')}"`;
          style.push(`font-family:${escHtml(faceStack(face) ?? '').replace(/"/g, '&quot;')}`);
        }
        if (r.points != null) { attrs += ` data-size="${r.points}"`; style.push(`font-size:calc(${r.points} * var(--wz-pt, 1.33333px))`); }
        wrap = `<span class="md-font"${attrs} style="${style.join(';')}">`;
      } else wrap = `<span class="${cls[r.kind]}">`;
      out += `${wrap}<span class="${markCls}">${escHtml(r.mark)}</span>${emit(r.open + ml, r.close, kids)}<span class="${markCls}">${escHtml(cm)}</span></span>`;
      cur = end;
    }
    return out + seg(cur, hi);
  };
  return emit(0, text.length, runs);
}

/** Same shape as decorateMarkdown (headings render identically, via the
 * SAME H1/H2 regexes above — not duplicated), but the bold/italic inline
 * pass is reveal-adjacent-to-caret. `caret` is a plain-text offset into the
 * FULL (multi-line) `text`, exactly what decorateEditorFor already tracks. */
// the dimmed-syntax register is gone, functions included; its leading-tab indent is ported into the pass below and does not collapse (a tab IS the indentation) [draftDecoration §5]

// WRITING-SURFACE S0 STEP 1 - THE LINE DIRECTIVES RENDER. `- `, `> `, `>< ` and `>> ` are what the bullet, quote, centre and
// right-align tools STORE (store/draftFormat.ts LINE_DIRECTIVE), and until now nothing here recognised them: a writer pressed
// Bullet and saw a literal hyphen. Each is now a line wrapper (`.md-line`, an INLINE-BLOCK, never display:block - a block
// would make the '\n' this file joins lines with draw an extra blank line, and innerText would read one too many).
// Character count stays 1:1: the prefix is still a real character, collapsed with `.md-mark-hidden` (font-size:0, never
// display/visibility - see decorateInlineForCard's header) and revealed while the caret is within or beside it, so the
// writer can still reach and delete it. Prefixes may stack (`> - `, `>< ` over a heading) and may follow leading tabs.
const LINE_CLASS: Record<string, string> = {
  'align-center': 'md-align-center', 'align-right': 'md-align-right', block: 'md-block', quote: 'md-quote',
  bullet: 'md-bullet', 'bullet-circle': 'md-bullet md-bullet-circle', 'bullet-square': 'md-bullet md-bullet-square',
};

export function decorateLineForCard(rawLine: string, caret: number | null): string {
  // STEP 3: the line's structure comes from the ONE reader (store/markRuns.ts readLead), with positions - so the caret-adjacent
  // reveal is a comparison against a token's own span, and this file no longer owns a copy of the token list.
  const lead = readLead(rawLine);
  let open = '';
  let close = '';
  let head = '';                     // what is emitted so far INSIDE the innermost open wrapper
  let heading: { text: string; start: number; end: number } | null = null;
  let tabRun = '';                   // consecutive tabs are ONE mark span, as they always were (item83f's E3 counts spans)
  const flushTabs = () => { if (tabRun) { head += `<span class="md-mark">${escHtml(tabRun)}</span>`; tabRun = ''; } };
  for (const t of lead.tokens) {
    if (t.kind === 'tab') {
      // The indent mark never collapses (see decorateMarkdownForCard's own note): a tab IS the layout.
      tabRun += t.text;
    } else if (t.kind === 'heading') {
      flushTabs();
      heading = { text: t.text, start: t.start, end: t.end };
    } else {
      flushTabs();
      // A bullet's stored token (`- `, `-+ `, `-= `) is not something to edit by
      // hand. Showing it when the caret touches the mark puts `-=` on the page.
      // The glyph stays. Pressing the same style again removes the list.
      const isBullet = t.kind === 'bullet' || t.kind === 'bullet-circle' || t.kind === 'bullet-square';
      const reveal = !isBullet && caret !== null && caret >= t.start && caret <= t.end;
      const markCls = reveal ? 'md-mark' : 'md-mark md-mark-hidden';
      open += head + `<span class="md-line ${LINE_CLASS[t.kind]}${reveal ? ' md-revealed' : ''}"><span class="${markCls}">${escHtml(t.text)}</span>`;
      head = '';
      close = '</span>' + close;
    }
  }
  flushTabs();
  const at = caret === null ? null : caret - lead.length;
  const rest = rawLine.slice(lead.length);
  const inline = decorateInlineForCard(rest, at);
  // The hash is a mark, same as an asterisk: it stays in the text and it
  // does not show. The heading's size is the `.md-h1` / `.md-h2` wrapper.
  // Pressing Heading on a heading line removes it, which is how the mark comes off.
  const headCls = 'md-mark md-mark-hidden';
  const body = heading
    ? `<span class="md-h${heading.text.length - 1}"><span class="${headCls}">${escHtml(heading.text)}</span>${inline}</span>`
    : inline;
  return open + head + body + close;
}

export function decorateMarkdownForCard(text: string, caret: number | null): string {
  let consumed = 0;
  return text
    .split('\n')
    .map(rawLine => {
      const localCaret = caret === null ? null : caret - consumed;
      const effLine = localCaret !== null && localCaret >= 0 && localCaret <= rawLine.length ? localCaret : null;
      consumed += rawLine.length + 1; // +1 for the '\n' this split() consumed
      // ITEM 122 REGRESSION FIX — the leading-tab indent, ported from the
      // register this one replaced as the default. Its absence here is what
      // item83f.mjs's E3 check caught: switching the default dropped the indent
      // marker entirely and the run reported `{"marks":[],"textLength":23}`.
      // "One register shared" was too glib a claim — the two passes were NOT
      // feature-equivalent, and the suite is what proved it.
      //
      // THE INDENT MARK NEVER COLLAPSES, and that is the whole design point of
      // porting it rather than copying it. `**` is syntax standing in for an
      // effect the reader sees elsewhere (weight), so hiding it loses nothing.
      // A leading TAB *is* the effect: it has no ink of its own, and the
      // indentation the writer sees IS those characters. Collapsing it with
      // `md-mark-hidden` (font-size:0) would render the tab zero-width and
      // silently un-indent the paragraph — trading a missing marker for a
      // deleted layout. So it wears the plain `.md-mark` register, always
      // visible, exactly as it did before.
      return decorateLineForCard(rawLine, effLine);
    })
    .join('\n');
}

// AB2 fix (post-build review) — a documented Chromium contenteditable
// quirk, proven via the harness's own typeKeys driving against a bare,
// React-free contenteditable: a caret positioned at the very end of a text
// node whose OWN content ends in '\n', with nothing after it, causes the
// NEXT typed character to land BEFORE that trailing newline instead of
// after it — even though window.getSelection() correctly reports the caret
// at the true end. Chrome's native default Enter handling doesn't hit this
// (it never leaves a bare trailing '\n' text node), but decorateMarkdown's
// flat-text redecoration always does whenever the caret needs to land at
// the tail of trailing-newline content. The standard workaround (used by
// every serious contenteditable-based editor for exactly this class of
// quirk): append an invisible zero-width-space sentinel and park the caret
// INSIDE it instead — a text node that does NOT itself end in '\n', which
// resolves the quirk. The sentinel is transient and MUST be stripped via
// readEditorPlainText before the result ever reaches entry.text — every
// caller that redecorates a live contenteditable through this module
// (ForwardOnlyEditor.tsx's drafting branch, PageEditor.tsx's rail format
// actions) shares this one pair of helpers so neither path can drift back
// into the unguarded bug.
export const EOF_GUARD = '​';

/** Strip the EOF guard from raw DOM text, adjusting a raw caret offset to
 * account for any guard characters that preceded it. Wherever the guard
 * ends up in the string (not just the tail — once real typing continues
 * past it, it's no longer at the tail), it is removed. */
export function readEditorPlainText(raw: string, rawOffset: number | null): { plain: string; caret: number | null } {
  if (rawOffset === null) return { plain: raw.split(EOF_GUARD).join(''), caret: null };
  let removedBefore = 0;
  let plain = '';
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === EOF_GUARD) { if (i < rawOffset) removedBefore++; continue; }
    plain += raw[i];
  }
  return { plain, caret: rawOffset - removedBefore };
}

/** The exact HTML `decorateEditorFor` writes for a given plain text — split
 * out so `revealAtCaret` below can ask "would this change anything?" without
 * touching the DOM. One source for the string, so the comparison can never
 * drift from the thing it is comparing against. */
export function editorHtmlFor(plain: string, decorate: (text: string) => string): string {
  const needsGuard = plain.endsWith('\n');
  return decorate(plain) + (needsGuard ? `<span class="md-eof-guard" aria-hidden="true">${EOF_GUARD}</span>` : '');
}

// WHAT WAS LAST WRITTEN TO EACH LIVE EDITOR, kept because `revealAtCaret` must
// compare against OUR OWN OUTPUT and never against `el.innerHTML`. Reading the
// DOM back gives whatever the browser normalised our string into, which is not
// guaranteed to be byte-identical to what we set; a purely cosmetic difference
// there would make every comparison report "changed", and the guard that stops
// the listener recursing would become the thing that drives it. A WeakMap so a
// dismounted editor is not held alive by this bookkeeping.
const lastDecorated = new WeakMap<HTMLElement, string>();

/** Redecorate `el`'s innerHTML from `plain` and restore the caret at
 * `caret`, guarding against the trailing-newline-at-EOF quirk above. The
 * one place a live contenteditable's decorated DOM is ever written from
 * plain text + a caret offset — do not `el.innerHTML = decorateMarkdown(...)`
 * directly outside this helper. */
export function decorateEditorFor(
  el: HTMLElement,
  plain: string,
  caret: number | null,
  setCaretOffset: (el: HTMLElement, target: number) => void,
  // the default register is the one every Draft call site shares, so a fifth call site cannot forget it; the card passes it explicitly, so the two surfaces share one engine [draftDecoration §6]
  decorate: (text: string) => string = (t) => decorateMarkdownForCard(t, caret),
): void {
  if (caret === null) return;
  const needsGuard = plain.endsWith('\n');
  const html = editorHtmlFor(plain, decorate);
  lastDecorated.set(el, html);
  el.innerHTML = html;
  if (needsGuard && caret === plain.length) {
    const guardText = el.lastElementChild?.firstChild as Text | null;
    const sel = window.getSelection();
    if (guardText && sel) {
      const r = document.createRange();
      r.setStart(guardText, guardText.data.length);
      r.collapse(true);
      sel.removeAllRanges();
      sel.addRange(r);
      return;
    }
  }
  setCaretOffset(el, caret);
}

/** REVEAL-ON-CLICK — redecorate `el` for wherever the caret is NOW.
 *
 * The register has always computed the reveal FROM a caret offset:
 * `decorateMarkdownForCard(text, caret)` un-collapses the marker pair the
 * caret sits inside, which is the writer's escape hatch to the raw syntax.
 * What was missing is that nothing re-ran it when the caret moved WITHOUT an
 * edit. Both surfaces called their `redecorate` from the `input` handler and
 * once at mount, so on the page a writer who CLICKED into a `**bold**` word
 * saw nothing happen — the decoration still showed the reveal for wherever
 * the caret had been when they last typed.
 *
 * `selectionchange` is the only event that fires for every way a caret can
 * move: click, drag, arrow keys, Home/End, Tab, and the programmatic moves
 * the formatter itself makes. Item 122 reached exactly this conclusion for
 * Draft's B/I/U button state (PageEditor.tsx says so in its own words); this
 * is the same signal driving the same surface's decoration. The card surface
 * previously enumerated the paths instead — a keyup against a NAV_KEYS list
 * plus a mouseup — which is the shape that leaves the state stale after
 * whichever path nobody listed.
 *
 * FOUR THINGS IT REFUSES TO DO, each one a way this could damage the surface
 * it exists to serve:
 *
 *  1. A NON-COLLAPSED SELECTION IS LEFT ALONE. Redecorating rewrites
 *     `el.innerHTML` and then restores a COLLAPSED caret — so running it
 *     while the writer has text selected destroys the selection. And
 *     `selectionchange` fires on every character of a drag, so without this
 *     guard a sentence could not be selected at all: it would collapse under
 *     the mouse. (This is not hypothetical on the card, whose mouseup
 *     listener did exactly that; the harness measures it.)
 *  2. A CARET OUTSIDE `el` IS NOT OURS. `selectionchange` is a DOCUMENT
 *     event — it fires for every surface on the page, including the other
 *     editor when a card popup is open over a page.
 *  3. AN UNCHANGED DECORATION IS NOT REWRITTEN. This is both the performance
 *     guard (arrow-keying within one paragraph builds a string and compares
 *     it, but writes no DOM and disturbs no caret) and the reason the
 *     listener TERMINATES: redecorating restores the caret, restoring the
 *     caret fires `selectionchange`, and that is an infinite loop unless the
 *     second pass declines. It declines because the HTML it would write is
 *     the HTML just written. See `lastDecorated` above for why the
 *     comparison is against our own output rather than the live DOM.
 *  4. IT DOES NOT RUN MID-COMPOSITION or mid-em-dash-substitution — both
 *     callers pass those guards, for the same reason their `input` handlers
 *     already check them: the text on screen is not the writer's yet.
 *
 * Returns whether it actually redecorated, which is what the harness asserts
 * against rather than inferring from a repaint.
 */
export function revealAtCaret(
  el: HTMLElement,
  getCaret: (el: HTMLElement) => number | null,
  setCaret: (el: HTMLElement, target: number) => void,
): boolean {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return false;
  if (!sel.anchorNode || !el.contains(sel.anchorNode)) return false;
  const { plain, caret } = readEditorPlainText(el.innerText, getCaret(el));
  if (caret === null) return false;
  const decorate = (t: string) => decorateMarkdownForCard(t, caret);
  const next = editorHtmlFor(plain, decorate);
  if (next === lastDecorated.get(el)) return false;
  decorateEditorFor(el, plain, caret, setCaret, decorate);
  return true;
}
