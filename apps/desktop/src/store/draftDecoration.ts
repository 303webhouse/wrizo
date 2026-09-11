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
  let out = '';
  let i = 0;
  while (i < text.length) {
    const boldStart = text.indexOf('**', i);
    const italicStart = text.indexOf('*', i);
    const underStart = text.indexOf('__', i);
    const strikeStart = text.indexOf('~~', i);
    // ITEM 122 — strike, same precedence, same reveal-adjacent marks.
    if (strikeStart !== -1
        && (boldStart === -1 || strikeStart < boldStart)
        && (italicStart === -1 || strikeStart < italicStart)
        && (underStart === -1 || strikeStart < underStart)) {
      const close = text.indexOf('~~', strikeStart + 2);
      if (close === -1) { out += escHtml(text.slice(i)); break; }
      out += escHtml(text.slice(i, strikeStart));
      const sEnd = close + 2;
      const sReveal = caret !== null && caret >= strikeStart && caret <= sEnd;
      const sCls = sReveal ? 'md-mark' : 'md-mark md-mark-hidden';
      out += `<span class="md-strike"><span class="${sCls}">~~</span>${escHtml(text.slice(strikeStart + 2, close))}<span class="${sCls}">~~</span></span>`;
      i = sEnd;
      continue;
    }
    // Same precedence as the Draft pass above, plus this register's own
    // reveal-adjacent-to-caret rule: the marks collapse unless the caret is
    // within or beside the run. Collapsed via `md-mark-hidden` (font-size:0),
    // never display/visibility — see this file's header for why that choice is
    // load-bearing rather than stylistic.
    if (underStart !== -1
        && (boldStart === -1 || underStart < boldStart)
        && (italicStart === -1 || underStart < italicStart)) {
      const close = text.indexOf('__', underStart + 2);
      if (close === -1) { out += escHtml(text.slice(i)); break; }
      out += escHtml(text.slice(i, underStart));
      const end = close + 2;
      const reveal = caret !== null && caret >= underStart && caret <= end;
      const markCls = reveal ? 'md-mark' : 'md-mark md-mark-hidden';
      out += `<span class="md-underline"><span class="${markCls}">__</span>${escHtml(text.slice(underStart + 2, close))}<span class="${markCls}">__</span></span>`;
      i = end;
      continue;
    }
    if (boldStart === -1 && italicStart === -1 && underStart === -1) { out += escHtml(text.slice(i)); break; }
    if (boldStart === -1 && italicStart === -1) { out += escHtml(text.slice(i)); break; }
    if (boldStart !== -1 && (italicStart === -1 || boldStart <= italicStart)) {
      const close = text.indexOf('**', boldStart + 2);
      if (close === -1) { out += escHtml(text.slice(i)); break; }
      out += escHtml(text.slice(i, boldStart));
      const inner = text.slice(boldStart + 2, close);
      const end = close + 2;
      const reveal = caret !== null && caret >= boldStart && caret <= end;
      const markCls = reveal ? 'md-mark' : 'md-mark md-mark-hidden';
      out += `<span class="md-bold"><span class="${markCls}">**</span>${escHtml(inner)}<span class="${markCls}">**</span></span>`;
      i = end;
      continue;
    }
    const close = text.indexOf('*', italicStart + 1);
    if (close === -1) { out += escHtml(text.slice(i)); break; }
    out += escHtml(text.slice(i, italicStart));
    const inner = text.slice(italicStart + 1, close);
    const end = close + 1;
    const reveal = caret !== null && caret >= italicStart && caret <= end;
    const markCls = reveal ? 'md-mark' : 'md-mark md-mark-hidden';
    out += `<span class="md-italic"><span class="${markCls}">*</span>${escHtml(inner)}<span class="${markCls}">*</span></span>`;
    i = end;
  }
  return out;
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
      const ind = rawLine.match(LEADING_TABS);
      const indent = ind ? `<span class="md-mark">${escHtml(ind[1])}</span>` : '';
      const line = ind ? ind[2] : rawLine;
      // The caret is measured against the FULL line, so every offset handed to
      // the inline pass shifts left by the indent it no longer contains.
      const indentLen = ind ? ind[1].length : 0;
      const effCaret = effLine === null ? null : effLine - indentLen;
      const h2 = line.match(H2);
      if (h2) return `${indent}<span class="md-h2"><span class="md-mark">${escHtml(h2[1])}</span>${decorateInlineForCard(h2[2], effCaret === null ? null : effCaret - h2[1].length)}</span>`;
      const h1 = line.match(H1);
      if (h1) return `${indent}<span class="md-h1"><span class="md-mark">${escHtml(h1[1])}</span>${decorateInlineForCard(h1[2], effCaret === null ? null : effCaret - h1[1].length)}</span>`;
      return indent + decorateInlineForCard(line, effCaret);
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
  el.innerHTML = decorate(plain) + (needsGuard ? `<span class="md-eof-guard" aria-hidden="true">${EOF_GUARD}</span>` : '');
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
