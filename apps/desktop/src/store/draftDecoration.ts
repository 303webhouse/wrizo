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

import { readMarks, type MarkKind, type MarkRun } from './markRuns';

function escHtml(s: string): string {
  return s.replace(/[&<>]/g, c => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : '&gt;'));
}



const H2 = /^(##\s+)([\s\S]*)$/;
const H1 = /^(#\s+)([\s\S]*)$/;

// ITEM 83 ERRATA E3 (2026-09-03) — the indent's leading tabs are MARKERS, not
// content. The indent itself needs no renderer: the editor is
// `white-space:pre-wrap` (ForwardOnlyEditor.tsx), so a leading tab already
// draws the level the writer asked for, and inventing a second indent
// mechanism on top of it would be two formulas for one number. What was
// missing is the REGISTER — every other convention in this file wears
// `.md-mark`, and the tab did not, so it read as text the writer had typed
// rather than as craft a control had applied.
//
// Split off ahead of the heading match, for two reasons. Character count stays
// 1:1 (only spans are added), which is what lets the caller restore a
// plain-text caret offset. And `# ` on an INDENTED line still reads as a
// heading — a whole-line `^#` match against a tab-prefixed line would silently
// have stopped matching the moment E3 made indents repeatable and common.
const LEADING_TABS = /^(\t+)([\s\S]*)$/;


// FX5 S6 — the CARD-surface display register (BoardEditor.tsx's
// BoardCardPopup ONLY — Draft mode's own decorateMarkdown/decorateInline
// above are NEVER called by this, and their own `.md-mark{opacity:.38}`
// dimmed-syntax rule in index.css is untouched by anything below). Nick's
// own verdict: asterisks visible on a card is a bug, not a style choice —
// "the popup shows words, not syntax." Bold/Italic markers are HIDDEN by
// default and reveal ONLY for the run the caret currently sits within or
// beside ("reveal-adjacent-to-caret," the brief's own named fallback).
//
// Why reveal-adjacent instead of hiding always: BoardCardPopup's own onInput
// derives the text that gets STORED from `el.innerText` (readEditorPlainText,
// above) — and `Element.innerText` is defined by spec to approximate
// RENDERED text, excluding anything `display:none` or `visibility:hidden`.
// An always-hidden marker built with either of those would vanish from
// `innerText` the moment it existed, silently stripping the markdown
// characters out of the STORED text on the very next keystroke — a real,
// provable way "storage stays markdown conventions untouched" would break,
// not a hypothetical. Reveal-adjacent keeps every marker a REAL, normally-
// rendered character at all times (visually collapsed via `.md-mark-hidden`
// — font-size:0, never display/visibility — see index.css), so `innerText`
// always reports it faithfully; only the VISUAL presentation toggles based
// on where the caret currently is.
function decorateInlineForCard(text: string, caret: number | null): string {
  // STEP 3: the runs come from store/markRuns.ts - the SAME reader the formatter toggles from - so the page can nest marks
  // (`__*x*__` paints underline AND italic, both collapsed) and cannot disagree with the formatter about what is a run. A run's
  // markers reveal while the caret is within or beside THAT run (the register's own rule, unchanged), and every character of the
  // text is still emitted exactly once, so the 1:1 count the caret restore depends on holds.
  const runs = readMarks(text);
  const cls: Record<MarkKind, string> = { bold: 'md-bold', italic: 'md-italic', underline: 'md-underline', strike: 'md-strike' };
  const emit = (lo: number, hi: number, within: MarkRun[]): string => {
    let out = '';
    let cur = lo;
    for (let i = 0; i < within.length; i++) {
      const r = within[i];
      const ml = r.mark.length;
      const end = r.close + ml;
      // the runs nested inside this one are the ones that follow it and end no later than it does
      const kids: MarkRun[] = [];
      while (i + 1 < within.length && within[i + 1].open >= r.open + ml && within[i + 1].close + within[i + 1].mark.length <= r.close) {
        kids.push(within[i + 1]);
        i++;
      }
      const reveal = caret !== null && caret >= r.open && caret <= end;
      const markCls = reveal ? 'md-mark' : 'md-mark md-mark-hidden';
      out += escHtml(text.slice(cur, r.open));
      out += `<span class="${cls[r.kind]}"><span class="${markCls}">${escHtml(r.mark)}</span>${emit(r.open + ml, r.close, kids)}<span class="${markCls}">${escHtml(r.mark)}</span></span>`;
      cur = end;
    }
    return out + escHtml(text.slice(cur, hi));
  };
  return emit(0, text.length, runs);
}

/** Same shape as decorateMarkdown (headings render identically, via the
 * SAME H1/H2 regexes above — not duplicated), but the bold/italic inline
 * pass is reveal-adjacent-to-caret. `caret` is a plain-text offset into the
 * FULL (multi-line) `text`, exactly what decorateEditorFor already tracks. */
// ITEM 122 — `decorateMarkdown` and `decorateInline` WERE HERE, and are DELETED.
// They rendered the retired iA register, where every marker stayed on screen at
// `.md-mark{opacity:.38}`. Nick's ruling retired that for Draft; Fable's ruling
// then retired the FUNCTIONS, because "SUPERSEDED-AS-DEFAULT is a trap in code,
// not a record" — a live export that produces the wrong register is something a
// future reader can reach for by habit, and the parks that mention them quote
// the past rather than calling it.
//
// WHAT THE DELETION COST, recorded because it was nearly missed: the two passes
// were NOT feature-equivalent. The deleted one handled the leading-tab indent
// and this one did not, so moving the default silently dropped Draft's indent
// marker — caught by item83f.mjs's E3 check reporting zero `.md-mark` elements,
// not by review. The indent is ported into the pass below, and it deliberately
// does NOT collapse: a tab IS the indentation, not syntax standing in for it.

// WRITING-SURFACE S0 STEP 1 - THE LINE DIRECTIVES RENDER. `- `, `> `, `>< ` and `>> ` are what the bullet, quote, centre and
// right-align tools STORE (store/draftFormat.ts LINE_DIRECTIVE), and until now nothing here recognised them: a writer pressed
// Bullet and saw a literal hyphen. Each is now a line wrapper (`.md-line`, an INLINE-BLOCK, never display:block - a block
// would make the '\n' this file joins lines with draw an extra blank line, and innerText would read one too many).
// Character count stays 1:1: the prefix is still a real character, collapsed with `.md-mark-hidden` (font-size:0, never
// display/visibility - see decorateInlineForCard's header) and revealed while the caret is within or beside it, so the
// writer can still reach and delete it. Prefixes may stack (`> - `, `>< ` over a heading) and may follow leading tabs.
const LINE_DIRECTIVES: Array<{ re: RegExp; cls: string }> = [
  { re: /^(>< )/, cls: 'md-align-center' },
  { re: /^(>> )/, cls: 'md-align-right' },
  { re: /^(> )/, cls: 'md-quote' },
  { re: /^(- )/, cls: 'md-bullet' },
];

function decorateLineForCard(rawLine: string, caret: number | null): string {
  let rest = rawLine;
  let at = caret;                    // caret relative to `rest`, or null
  let open = '';
  let close = '';
  let head = '';                     // what is emitted so far INSIDE the innermost open wrapper
  let tabs = 0;                      // leading tabs met before any directive (the indent LEVEL)
  for (;;) {
    const ind = rest.match(LEADING_TABS);
    if (ind) {
      // The indent mark never collapses (see decorateMarkdownForCard's own note): a tab IS the layout.
      head += `<span class="md-mark">${escHtml(ind[1])}</span>`;
      if (open === '') tabs += ind[1].length;
      rest = ind[2];
      at = at === null ? null : at - ind[1].length;
      continue;
    }
    const d = LINE_DIRECTIVES.find(x => x.re.test(rest));
    if (!d) break;
    const prefix = (rest.match(d.re) as RegExpMatchArray)[1];
    const reveal = at !== null && at >= 0 && at <= prefix.length;
    const markCls = reveal ? 'md-mark' : 'md-mark md-mark-hidden';
    open += head + `<span class="md-line ${d.cls}${reveal ? ' md-revealed' : ''}"><span class="${markCls}">${escHtml(prefix)}</span>`;
    head = '';
    close = '</span>' + close;
    rest = rest.slice(prefix.length);
    at = at === null ? null : at - prefix.length;
  }
  const h2 = rest.match(H2);
  const h1 = h2 ? null : rest.match(H1);
  let body: string;
  if (h2) body = `<span class="md-h2"><span class="md-mark">${escHtml(h2[1])}</span>${decorateInlineForCard(h2[2], at === null ? null : at - h2[1].length)}</span>`;
  else if (h1) body = `<span class="md-h1"><span class="md-mark">${escHtml(h1[1])}</span>${decorateInlineForCard(h1[2], at === null ? null : at - h1[1].length)}</span>`;
  else body = decorateInlineForCard(rest, at);
  // STEP 3, THE INDENT LOOK: an indented paragraph HANGS. The stored tabs are unchanged (the indent is still one tab per level,
  // exported and outdented as before); what changes is that the line's wrapped continuation lines return to the indent, not to
  // the margin - `padding-left` carries the level for every line and a matching negative `text-indent` lets the first line's own
  // tabs walk out to the same place. That is the outline reading Nick's indent ruling asked for ("the paragraph"), where the
  // bare tab only ever indented a paragraph's FIRST line. A line that also carries a directive (a bullet, a quote) keeps the
  // directive's own hanging and is left as it was.
  if (open === '' && tabs > 0) return `<span class="md-line md-indent" style="--md-n:${tabs}">${head}${body}</span>`;
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
const EOF_GUARD = '​';

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
  // ITEM 122 — THE DEFAULT REGISTER IS NOW REVEAL-ADJACENT, on Nick's ruling
  // that Draft's B/I/U must render the STYLE with no visible markers
  // ("bold renders bold"). FX5 S6 introduced this parameter with
  // `decorateMarkdown` as the default — the iA dimmed-syntax register, where
  // every marker stayed on screen at `opacity:.38`. That register is what the
  // ruling retires for Draft.
  //
  // WHY THE DEFAULT MOVES RATHER THAN EACH CALL SITE PASSING AN OVERRIDE:
  // there are four Draft call sites (ForwardOnlyEditor's redecorate and its
  // initial mount, its initial React html, and PageEditor's rail actions), and
  // they must agree or the markers flicker between registers as the writer
  // types. A default cannot be forgotten at a fifth site; four overrides can.
  // BoardCardPopup already passed this function explicitly, so the card is
  // unchanged either way — the two surfaces now simply share one register,
  // which is what "the same engine" was always supposed to mean.
  //
  // SAFE THROUGH THE LIVE ROUND-TRIP, MEASURED NOT ASSUMED (item 122 S0): the
  // collapsed marks use `font-size:0`, never display/visibility, so they remain
  // real rendered characters and survive `el.innerText` — which is what the
  // live editor reads back into the store on every keystroke. The two forbidden
  // techniques were run as controls in the same probe and BOTH stripped the
  // markers out of `innerText`. See this file's own header for why that
  // distinction is load-bearing rather than stylistic.
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
  const next = editorHtmlFor(plain, (t) => decorateMarkdownForCard(t, caret));
  if (next === lastDecorated.get(el)) return false;
  decorateEditorFor(el, plain, caret, setCaret);
  return true;
}
