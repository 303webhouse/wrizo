import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getJournalEntry, saveBoardBoxes, flushNow, getDrawer, getProject,
  patchJournalEntry, getBoardsPinning, generateId,
} from '../store/persistence';
import { renderStroke } from '../store/ink';
import { notePasteBlocked, shadowAllows, extractIncomingText } from '../store/voiceWall';
import { getSelectionOffsets, getCaretOffset, setCaretOffset } from '../store/caretOffset';
import { applyFormat, type FormatAction } from '../store/draftFormat';
import { decorateEditorFor, decorateMarkdownForCard, readEditorPlainText } from '../store/draftDecoration';
import { applyEmDash, findEmDashTrigger, revertEmDash } from '../store/emDash';
import { useWayBack } from './useWayBack';
import { useChromeDissolve } from './useChromeDissolve';
import { useLexicon } from '../store/themeLexicon';
import { useDeskLexicon } from '../store/deskLexicon';
import { describePageHome } from '../store/pageHome';
import { useCascade } from './Cascade';
import { AddToSheet } from './AddToSheet';
import { PortToBoardSheet } from './PortToBoardSheet';
import { PinToBoardSheet } from './PinToBoardSheet';
import { Sliver, type SliverContent } from './Sliver';
import type { PageFaceSubject } from './PageFace';
import { DeskFrame, useDeskFrameViewport } from './DeskFrame';
import type { Box, Project } from '../types';

// J4 — the Board: a canvas of positioned boxes (I2/I3 realized). Boxes only
// ever arrive via a port (J4 Slice 2) or, AB4 S2/S5, a pin (a membership
// card) or the sliver's own "Add card" tool — this editor selects, moves,
// resizes, groups/ungroups, edits text in place, and removes.
//
// AB4 — the Wall. S2 adds a 'page-pin' box kind (a membership card
// referencing a page by id, never a copy — BoardPinBox below always reads
// the referenced entry LIVE). S3 adds a 'connection' box kind (a hairline
// between two other cards' ids) — see the `Box` interface's own header
// comment in types/index.ts for the full zero-schema reasoning on why a
// connection is stored as a plain element of the SAME `boxes` array rather
// than a new field or a restructured column. S4 extends corner-drag resize
// to page-pin cards and wires double-click travel with a guaranteed way
// back (a `location.state.fromBoardId` chip on the target surface — see
// JournalEntry.tsx/PageEditor.tsx/ScriptEditor.tsx's own matching comment,
// mirroring the F2 warm-start precedent for one-shot navigation signals).
// S5 finally wires the cascade (strip/cascadeLayers) and the sliver (Add
// card, Connect toggle) — BoardEditor declares `pageKind="board"` instead
// of the standing `pageKind="prose"` placeholder a prior ticket flagged.

const AUTOSAVE_MS = 2000;
const LONG_PRESS_MS = 350;         // mirrors the S25-verified Spread gesture
const MOUSE_DRAG_THRESHOLD = 6;
const TOUCH_CANCEL_THRESHOLD = 12;
const MIN_TEXT_W = 0.15;
const MIN_INK_W = 0.08;
// AB4 S4 — a page-pin card resizes freeform on both axes (no aspect lock —
// it's not a drawing; no text-reflow — it's not live prose).
// FX4 S4 — text now resizes freeform on both axes too (height was
// reflow-only before this ticket): MIN_TEXT_H is the same "about one
// line" floor persistence.ts's own BOARD_LINE_H already uses for a fresh
// port's height estimate — a card can never be dragged shorter than that,
// though in practice the reflow-as-minimum effect below usually grows it
// back up to fit real content well before this floor would bite.
const MIN_TEXT_H = 0.045;
const MIN_PIN_W = 0.15;
const MIN_PIN_H = 0.06;
const MEASURE_TOLERANCE_PX = 2;
const VIEWPORT_MIN_PX = 560;
// FX4 S4 — the board canvas's own both-axis resize floors: "minimums =
// content extents" (the brief's own words) — the canvas can never be
// dragged smaller than what's needed to actually contain the current
// layout. Width reuses VIEWPORT_MIN_PX (the same floor the canvas's own
// auto-fit height already respects); height is computed live from
// maxBottom(boxes), same formula the existing auto-height already uses.
const CANVAS_MIN_W = VIEWPORT_MIN_PX;
// AB4 S2/S5 — matches persistence.ts's own BOARD_STACK_GAP (not exported;
// this file has never imported the port's internal layout constants, so a
// local mirror is the established shape here, same as pageWidthPx's own
// normalized-coordinate convention throughout this file).
const ADD_CARD_GAP = 0.08;
const NEW_CARD_W = 0.4;
const NEW_CARD_H = 0.08;

function groupMembers(boxes: Box[], groupId: string | undefined): Box[] {
  if (!groupId) return [];
  return boxes.filter(b => b.groupId === groupId);
}

function maxBottom(boxes: Box[]): number {
  return boxes.reduce((m, b) => Math.max(m, b.y + b.h), 0);
}

// FX5 S4 (b/c) — plain axis-aligned rectangle overlap, in the SAME
// normalized (page-width-fraction) coordinates every box's own x/y/w/h
// already use. "OVERLAP IS PERMITTED" (S4's own words) was already true of
// the move/drag logic itself (no collision-avoidance code exists anywhere
// in this file — confirmed by reading it, not assumed); this helper is new
// only for S4 (c)'s own layer-order icon, which needs to know WHEN two
// cards genuinely overlap to decide whether to appear at all.
function boxesOverlap(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// -- ink box: paints via the shared renderStroke, box-local (already
// re-normalized at port time so sheetW = the box's own pixel width). -------
function BoardInkBox({ box, pageWidthPx }: { box: Box; pageWidthPx: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const wPx = Math.max(1, box.w * pageWidthPx);
    const hPx = Math.max(1, box.h * pageWidthPx);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(wPx * dpr));
    canvas.height = Math.max(1, Math.round(hPx * dpr));
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, wPx, hPx);
    const root = getComputedStyle(document.documentElement);
    const color = root.getPropertyValue('--ink-stroke').trim() || root.getPropertyValue('--ink-on-paper').trim() || '#1A1206';
    for (const s of box.strokes ?? []) renderStroke(ctx, s, wPx, color);
  }, [box.strokes, box.w, box.h, pageWidthPx]);
  return <canvas ref={ref} aria-hidden="true" className="board-ink-canvas" style={{ width: '100%', height: '100%', display: 'block' }} />;
}

// FX5 S3 (b) — shared with BoardPinBox below AND BoardTextBox's own ported-
// card face: a bounded notecard read (title + up to 3 lines, ~160 chars) of
// a longer text — "the Board organizes ideas, it doesn't read pages" (Nick's
// words), never a truncation of what's actually STORED, only of what's
// DISPLAYED on the card's own quiet face.
function notecardExcerpt(text: string): { title: string; excerpt: string } {
  const trimmed = text.trim();
  const lines = trimmed.split('\n').filter(l => l.trim());
  const title = lines[0] ? lines[0].slice(0, 100) : '';
  const excerpt = lines.slice(1, 4).join(' ').slice(0, 160);
  return { title, excerpt };
}

// AB4 S2 — a page-pin card: MEMBERSHIP, not capture. Reads the referenced
// entry LIVE at every render (getJournalEntry, the same "no cached
// snapshot" discipline the cascade's own panels use) — so it can never go
// stale, and pin/unpin never touches the referenced entry's own record.
function BoardPinBox({ box }: { box: Box }) {
  const { t: lex } = useLexicon();
  const entry = box.entryId ? getJournalEntry(box.entryId) : null;
  if (!entry) {
    return <div className="board-text board-pin board-pin-missing">Missing page</div>;
  }
  const hasInk = (entry.strokes?.length ?? 0) > 0;
  const { title: rawTitle, excerpt } = notecardExcerpt(entry.text);
  const title = rawTitle || (hasInk ? 'A sketch' : 'Untitled');
  return (
    <div className="board-text board-pin">
      <div className="board-pin-badge">{lex('board')} pin</div>
      <div className="board-pin-title">{title}</div>
      {excerpt && <div className="board-pin-excerpt">{excerpt}</div>}
    </div>
  );
}

// FX4 S5 — read-only prose ONLY now: inline contenteditable editing
// RETIRES whole (ab4.mjs's own inline-editing check parks per A4 — see
// fx4.mjs). Double-clicking a text card opens BoardCardPopup below instead
// (over a blurred board) — this component no longer has an "editing"
// branch or mode at all.
//
// FX5 S3 (b/c) — a genuine, diagnosed defect (found live via a seeded-box
// harness probe, not guessed): a PORTED page's box.text holds the FULL
// source content (Port's own "COPY, never move" law — untouched, nothing
// here ever truncates what's STORED), but rendering that full text verbatim
// on the card's own FACE made two things true at once, both matching the
// brief's own "content-minimum trap (full-text content inflating the
// reflow floor)" and Nick's "the Board organizes ideas, it doesn't read
// pages": (1) the initial estimated height (persistence.ts's
// estimateTextBoxHeight, proportional to the WHOLE source page's own line
// count) reached OVER SIX PAGE-WIDTHS TALL for a 60-line seed, measured
// live; (2) the reflow-as-minimum floor (FX4 S4's own law: it only ever
// GROWS, never shrinks) then permanently pins the card at whatever its own
// rendered DOM content's natural scrollHeight demands — for full raw text,
// that floor never comes down, so no amount of manual shrinking ever
// sticks. A card carrying `sourceEntryId` (i.e. genuinely PORTED from a
// page, not hand-typed via "Add card") now renders the SAME bounded
// notecard excerpt BoardPinBox already uses instead of the raw text — the
// reflow floor then measures against that SHORT excerpt's own natural
// height, "the clamp probably frees it," proven (see fx5.mjs's own S3
// section), not assumed. Hand-typed cards (no sourceEntryId) are
// completely untouched — their own organic grow-as-you-type is FX4 S4's
// intended, correct behavior, not a defect.
function BoardTextBox({
  boxId, initialText, measureRef, sourceEntryId,
}: {
  boxId: string;
  initialText: string;
  measureRef: (id: string, el: HTMLDivElement | null) => void;
  sourceEntryId?: string;
}) {
  const { t } = useDeskLexicon();
  if (sourceEntryId) {
    const { title, excerpt } = notecardExcerpt(initialText);
    return (
      <div ref={el => measureRef(boxId, el)} className="board-text board-ported">
        <div className="board-pin-badge">{t('boardPortedBadge')}</div>
        <div className="board-pin-title">{title || t('boardThreadUntitled')}</div>
        {excerpt && <div className="board-pin-excerpt">{excerpt}</div>}
      </div>
    );
  }
  return (
    <div
      ref={el => measureRef(boxId, el)}
      className="board-text"
    >
      {initialText}
    </div>
  );
}

// FX4 S5 — the card popup editor, over a blurred board (the mockup's
// treatment — board-card-studies.html's own `.editor`). Bold/Italic ONLY
// (S0's own frozen markdown set does not unfreeze in a fix ticket) —
// reuses store/draftFormat.ts's applyFormat and store/draftDecoration.ts's
// decorateMarkdown/decorateEditorFor verbatim, the SAME engine Draft mode
// already uses on entry.text, applied here to box.text instead (S0's own
// "no separate rich-text state" ruling extends naturally). No typewriter,
// no progress, anywhere in here — Nick's own word, and there is simply no
// code path here that could mount either (this component doesn't import
// useTypewriterFade or any progress instrument at all).
//
// Focus trap: hb1.1's own UnlockCeremony.tsx pattern, reused verbatim (Tab
// contained within the dialog's own focusable elements while it's open).
// Voice Wall stands: foreign paste/drop is blocked + whispered; an allowed
// own-ink paste proceeds natively (Draft's own law, unchanged here).
function BoardCardPopup({
  initialText, onCommit, onClose,
}: {
  initialText: string;
  onCommit: (text: string) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const elRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef(initialText);
  const { t: lex } = useLexicon();

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    decorateEditorFor(el, initialText, initialText.length, setCaretOffset, text => decorateMarkdownForCard(text, initialText.length));
    el.focus();

    // I0 pen discipline (park-sweep audit finding — the retired inline
    // BoardTextBox editing branch carried this same guard; the popup's own
    // contenteditable is exactly as reachable by a stylus and needs the
    // identical protection, not a weaker one just because the surface
    // changed). The pen is a Board POINTER, never a typing/handwriting
    // surface, everywhere on this app — j4.mjs's own "pen on an editing
    // text box produces ZERO characters" check is the live proof, re-homed
    // to the popup (fx4.mjs's own S5 section).
    el.style.touchAction = 'none';
    el.setAttribute('handwriting', 'false');
    const neutralizePen = (e: PointerEvent) => {
      if (e.pointerType !== 'pen') return;
      e.preventDefault();
      e.stopPropagation();
    };
    const penOpts = { passive: false, capture: true } as const;
    el.addEventListener('pointerdown', neutralizePen, penOpts);
    el.addEventListener('pointermove', neutralizePen, penOpts);
    el.addEventListener('pointerup', neutralizePen, penOpts);

    let composing = false;
    // FX5 S7 — the em-dash trigger flag + the applyEmDash reentrancy guard,
    // the SAME pair ForwardOnlyEditor.tsx's own drafting branch uses (see
    // that file's own comment for the full "why beforeinput, why the
    // guard" reasoning — not repeated here).
    let justTypedSpace = false;
    let applyingEmDash = false;
    // FX5 S7 — the one-step undo shim's own pending state, the SAME shape
    // ForwardOnlyEditor.tsx's drafting branch uses (see store/emDash.ts's
    // own header comment for why native undo — execCommand OR a real
    // Ctrl/Cmd+Z — does not work here either: this popup's own redecorate
    // rewrites the whole innerHTML on every input too).
    let lastEmDash: { offset: number; hyphens: string } | null = null;
    const redecorate = (plain: string, caret: number | null) =>
      decorateEditorFor(el, plain, caret, setCaretOffset, text => decorateMarkdownForCard(text, caret));
    const commit = (plain: string) => { textRef.current = plain; onCommit(plain); };

    const onInput = () => {
      if (applyingEmDash) return;
      const { plain, caret } = readEditorPlainText(el.innerText, getCaretOffset(el));
      commit(plain);
      if (composing) return;
      const trigger = justTypedSpace ? findEmDashTrigger(plain, caret) : null;
      justTypedSpace = false;
      if (trigger) {
        applyingEmDash = true;
        const { applied, hyphens } = applyEmDash(el, trigger.start, trigger.end);
        applyingEmDash = false;
        if (applied) {
          lastEmDash = { offset: trigger.start, hyphens };
          const after = readEditorPlainText(el.innerText, getCaretOffset(el));
          commit(after.plain);
          // FX5 S7 — see ForwardOnlyEditor.tsx's own onInput comment: the
          // post-execCommand DOM caret lands short of where the writer's
          // own typing actually was (right after the em dash, before the
          // untouched trailing space and anything typed past it) — the
          // ORIGINAL caret shifted left by (hyphen count - 1) is always
          // correct, computed directly rather than trusted from the DOM.
          redecorate(after.plain, caret - (trigger.end - trigger.start) + 1);
          return;
        }
      }
      lastEmDash = null; // any OTHER edit invalidates a pending em-dash undo
      redecorate(plain, caret);
    };
    const onUndoKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'z' || e.shiftKey) return;
      if (!lastEmDash) return;
      e.preventDefault();
      const { offset, hyphens } = lastEmDash;
      lastEmDash = null;
      applyingEmDash = true;
      const reverted = revertEmDash(el, offset, hyphens);
      applyingEmDash = false;
      if (reverted) {
        const { plain, caret } = readEditorPlainText(el.innerText, getCaretOffset(el));
        commit(plain);
        redecorate(plain, caret);
      }
    };
    // AB2's own proven fix for the Chromium trailing-newline-at-EOF caret
    // quirk (draftDecoration.ts's own header comment) — a literal Text-node
    // insertion via the Range API, not execCommand, which splits into a
    // <div> instead of inserting '\n'. Reused verbatim (ForwardOnlyEditor.
    // tsx's own onKeyDownDraft), adapted to this popup's own commit/
    // redecorate closures.
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.isComposing) return;
      e.preventDefault();
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      if (!el.contains(range.startContainer)) return;
      range.deleteContents();
      const textNode = document.createTextNode('\n');
      range.insertNode(textNode);
      range.setStart(textNode, 1);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      lastEmDash = null; // a genuine edit — invalidates a pending em-dash undo
      const { plain, caret } = readEditorPlainText(el.innerText, getCaretOffset(el));
      commit(plain);
      redecorate(plain, caret);
    };
    const onCompStart = () => { composing = true; };
    const onCompEnd = () => {
      composing = false;
      lastEmDash = null; // a genuine edit — invalidates a pending em-dash undo
      const { plain, caret } = readEditorPlainText(el.innerText, getCaretOffset(el));
      commit(plain);
      redecorate(plain, caret);
    };
    const onBeforeInput = (e: InputEvent) => {
      const it = e.inputType || '';
      // FX5 S7 — captured before the DOM mutates, same discipline as
      // ForwardOnlyEditor.tsx's own onBeforeInputDraft: only a genuinely
      // just-typed space arms the em-dash trigger check in onInput.
      justTypedSpace = it === 'insertText' && e.data === ' ';
      if (it === 'insertFromPaste' || it === 'insertFromDrop') {
        if (shadowAllows(extractIncomingText(e))) return; // own ink: native paste proceeds
        e.preventDefault();
        notePasteBlocked();
      }
    };
    const blockForeign = (e: Event) => {
      if (shadowAllows(extractIncomingText(e))) return;
      e.preventDefault();
      notePasteBlocked();
    };
    // FX5 S6 — reveal-adjacent-to-caret only updates on a TEXT change today
    // (every path above redecorates after committing new content). A pure
    // caret move — an arrow key, or a click that repositions without
    // typing — doesn't fire 'input' at all, so the reveal state would go
    // stale (still showing the PREVIOUS run's markers, or hiding the one
    // the caret just moved into). Re-running redecorate with the SAME text
    // but a freshly-read caret is a no-op for content, just refreshes which
    // markers are revealed.
    const NAV_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']);
    const onCaretMoveKey = (e: KeyboardEvent) => {
      if (!NAV_KEYS.has(e.key)) return;
      redecorate(textRef.current, getCaretOffset(el));
    };
    const onCaretMoveClick = () => { redecorate(textRef.current, getCaretOffset(el)); };
    el.addEventListener('input', onInput);
    el.addEventListener('keydown', onKeyDown);
    el.addEventListener('keydown', onUndoKey);
    el.addEventListener('keyup', onCaretMoveKey);
    el.addEventListener('mouseup', onCaretMoveClick);
    el.addEventListener('compositionstart', onCompStart);
    el.addEventListener('compositionend', onCompEnd);
    el.addEventListener('beforeinput', onBeforeInput as EventListener);
    el.addEventListener('paste', blockForeign);
    el.addEventListener('drop', blockForeign);
    return () => {
      el.removeEventListener('pointerdown', neutralizePen, penOpts);
      el.removeEventListener('pointermove', neutralizePen, penOpts);
      el.removeEventListener('pointerup', neutralizePen, penOpts);
      el.removeEventListener('input', onInput);
      el.removeEventListener('keydown', onKeyDown);
      el.removeEventListener('keydown', onUndoKey);
      el.removeEventListener('keyup', onCaretMoveKey);
      el.removeEventListener('mouseup', onCaretMoveClick);
      el.removeEventListener('compositionstart', onCompStart);
      el.removeEventListener('compositionend', onCompEnd);
      el.removeEventListener('beforeinput', onBeforeInput as EventListener);
      el.removeEventListener('paste', blockForeign);
      el.removeEventListener('drop', blockForeign);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // hb1.1's own focus-trap pattern (UnlockCeremony.tsx), reused verbatim:
  // Tab wraps within this dialog's own focusable elements while it's open.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key !== 'Tab') return;
      const dialogEl = dialogRef.current;
      if (!dialogEl) return;
      const focusable = [...dialogEl.querySelectorAll<HTMLElement>('button:not(:disabled), [contenteditable="true"]')];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  const applyBoardFormat = (action: FormatAction) => {
    const el = elRef.current;
    if (!el) return;
    el.focus();
    const sel = getSelectionOffsets(el) ?? { start: textRef.current.length, end: textRef.current.length };
    const result = applyFormat(textRef.current, sel.start, sel.end, action);
    textRef.current = result.text;
    onCommit(result.text);
    decorateEditorFor(el, result.text, result.start, setCaretOffset, text => decorateMarkdownForCard(text, result.start));
  };

  return (
    <div className="board-popup-backdrop" role="presentation" onClick={onClose}>
      <div
        ref={dialogRef}
        className="board-popup"
        role="dialog"
        aria-modal="true"
        aria-label={`Edit ${lex('board').toLowerCase()} card`}
        onClick={e => e.stopPropagation()}
      >
        <div className="board-popup-strip">
          <span className="eyebrow board-popup-eyebrow">Card</span>
          {/* onMouseDown preventDefault — a strip button sits OUTSIDE the
              contenteditable, so a normal click's mousedown would blur it
              and collapse whatever text was selected (the SAME reason
              Sliver.tsx's own Draft-format row does this). */}
          <div onMouseDown={e => e.preventDefault()} style={{ display: 'flex', gap: 4 }}>
            <button type="button" className="mode-tbtn board-popup-tool" title="Bold" onClick={() => applyBoardFormat('bold')}><b>B</b></button>
            <button type="button" className="mode-tbtn board-popup-tool" title="Italic" onClick={() => applyBoardFormat('italic')}><i>I</i></button>
          </div>
        </div>
        <div
          ref={elRef}
          className="board-popup-editor"
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label={`${lex('board')} text box`}
        />
        <div className="board-popup-foot">
          <button type="button" className="btn-brass board-popup-done" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

type LastAction = { type: 'move' | 'resize' | 'remove' | 'ungroup'; before: Box[] } | null;

export function BoardEditor({ id }: { id: string }) {
  const navigate = useNavigate();
  const { t } = useDeskLexicon();
  const initialEntry = getJournalEntry(id);
  // AB1 S1 — DeskFrame owns the viewport at >=1100px only; below that this
  // renders its exact pre-AB1 markup. No mode strip on Board (Trellis-side
  // by design — matches w1.mjs's existing "board never gets mode tabs"
  // assertion), so DeskFrame mounts here with no modeStrip prop.
  const framed = useDeskFrameViewport();
  // AB1 S3 — the vanishing law, generalized to Board too. A Board has no
  // live pen-stroke authoring (J4: ink boxes only ever arrive via a port,
  // never drawn here), but committing text inside a selected text box IS
  // real keydown/words-producing input (the brief's own S3 wording: "any
  // words-producing input (keydown, pen stroke) dissolves every non-page
  // zone together" does not carve Board out) — wired here the same way
  // ScriptEditor wires its own dissolve: mounted unconditionally (so its
  // begin/endSession bookkeeping is uniform) but only ever triggered when
  // framed, since Board had no dissolve engine at all before this ticket.
  const boardDissolve = useChromeDissolve({ surface: 'board', editorSelector: '.board-canvas' });

  // W2 — route + mount identity only (S1: a Board's own view state — pan,
  // zoom, selection — already persists through its own store; no scroll/
  // caret to capture here).
  useWayBack({ entryId: id });

  const [boxes, setBoxes] = useState<Box[]>(() => initialEntry?.boxes ?? []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // FX4 S5 — the card popup (inline contenteditable editing RETIRES whole):
  // the id of the text card currently open in BoardCardPopup, or null. The
  // board itself blurs+dims behind it (the mockup's own treatment) while
  // open.
  const [popupBoxId, setPopupBoxId] = useState<string | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  // FX4 S4 — the board canvas's own both-axis resize: a persisted override
  // riding the 'board-meta' box (types/index.ts). null on either axis means
  // "never resized" — auto-fit exactly as every pre-FX4 board already did
  // (the wrapper's own measured width; a content-driven height), so an
  // existing board with no board-meta element behaves byte-identically.
  const boardMetaInitial = (initialEntry?.boxes ?? []).find(b => b.kind === 'board-meta');
  const [canvasOverrideW, setCanvasOverrideW] = useState<number | null>(boardMetaInitial?.canvasW ?? null);
  const [canvasOverrideH, setCanvasOverrideH] = useState<number | null>(boardMetaInitial?.canvasH ?? null);
  // FX4 S6 — the handle-drag thread gesture, replacing AB4's connect-mode
  // toggle whole: double-clicking the brass resize handle on a selected
  // card arms a thread-drag FROM that card (threadArmedFrom); the very next
  // pointer-down/move/up anywhere on the canvas draws a live preview line
  // and, on release, mints a hairline if it lands inside a DIFFERENT card,
  // or cancels on release over empty board / Escape. The underlying
  // 'connection' Box creation/storage below is UNCHANGED from AB4 — only
  // the gesture that triggers it is new.
  const [threadArmedFrom, setThreadArmedFrom] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  // AB4 S2 — the Page face's sending sheets (Move/Copy, Port, Pin) — Board
  // never had these before this ticket (S5's own "every surface carries the
  // same chrome system" closing line).
  const [portOpen, setPortOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);

  const boxesRef = useRef(boxes);
  boxesRef.current = boxes;
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;
  const popupBoxIdRef = useRef(popupBoxId);
  popupBoxIdRef.current = popupBoxId;
  const threadArmedFromRef = useRef(threadArmedFrom);
  threadArmedFromRef.current = threadArmedFrom;
  const selectedConnectionIdRef = useRef(selectedConnectionId);
  selectedConnectionIdRef.current = selectedConnectionId;
  const lastActionRef = useRef<LastAction>(null);
  const lastSavedRef = useRef(boxes);
  const measureEls = useRef<Map<string, HTMLDivElement>>(new Map());
  // FX4 S6 — the live thread-drag preview line's own endpoint, updated
  // imperatively on pointermove (the same "don't trigger a React render on
  // every move" discipline JournalEntry.tsx's own eraser ring already uses)
  // — only the ARM/DISARM transitions (threadArmedFrom itself) go through
  // React state, since those are rare, discrete events.
  const previewLineRef = useRef<SVGLineElement | null>(null);
  // FX4 S4 — the canvas resize handle's own drag-start snapshot (plain
  // React pointer events + native setPointerCapture, not the delegated
  // canvas pointer-effect above — a separate, independent gesture on a
  // different element).
  const canvasResizeStartRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const project: Project | null = initialEntry?.projectId ? getProject(initialEntry.projectId) : null;
  const drawer = project?.drawerId ? getDrawer(project.drawerId) : null;

  // AB4 S5 — star/tag mutations + the Page face's subject, mirroring
  // JournalEntry.tsx/PageEditor.tsx/ScriptEditor.tsx's own patch-based
  // closures exactly (all four now share the identical shape). `initialEntry`
  // is re-read fresh every render (a plain call above, not useState — this
  // file's existing "no cached snapshot" discipline), so `.starred`/`.tags`
  // stay live across repeated toggles.
  const toggleStar = () => { if (!initialEntry) return; patchJournalEntry(id, initialEntry.text, { starred: !initialEntry.starred }); flushNow(); };
  const addTag = (tag: string) => {
    if (!initialEntry) return;
    const tags = initialEntry.tags ?? [];
    if (!tags.includes(tag)) patchJournalEntry(id, initialEntry.text, { tags: [...tags, tag] });
    flushNow();
  };
  const removeTag = (tag: string) => {
    if (!initialEntry) return;
    patchJournalEntry(id, initialEntry.text, { tags: (initialEntry.tags ?? []).filter(t => t !== tag) });
    flushNow();
  };

  // AB4 S5 — the cascade, replacing the standing "Board was never wired
  // into the cascade" gap (CD2's own note). `useCascade` is a HOOK: it must
  // run unconditionally, before the `if (!initialEntry) return null` guard
  // below (Rules of Hooks) — a harmless placeholder entry covers the
  // split-second `initialEntry` is genuinely null; nothing ever reads it,
  // since the component returns null right after this hook zone in that
  // case.
  const pinnedBoardTitles = initialEntry ? getBoardsPinning(initialEntry.id).map(b => b.title) : [];
  const { homeLabel, memberships } = describePageHome(
    initialEntry ?? { id, text: '', projectId: null, createdAt: '', updatedAt: '' },
    project,
    pinnedBoardTitles,
  );
  const pageFaceSubject: PageFaceSubject = {
    kind: 'page',
    entry: initialEntry ?? { id, text: '', projectId: null, createdAt: '', updatedAt: '' },
    homeLabel,
    memberships,
    onToggleStar: toggleStar,
    onAddTag: addTag,
    onRemoveTag: removeTag,
    onOpenMoveCopy: () => setAddOpen(true),
    onOpenPortToBoard: () => setPortOpen(true),
    onOpenPin: () => setPinOpen(true),
  };
  const cascade = useCascade({ subject: pageFaceSubject, project, navigate });

  // Measure the WRAP's own natural available width (unchanged mechanism) —
  // this feeds pageWidthPx only when the writer has never dragged the
  // canvas resize handle (canvasOverrideW is null), preserving pre-FX4
  // auto-fit behavior exactly. Once overridden, pageWidthPx comes from the
  // persisted override instead (below), and the wrap's own `overflow:auto`
  // (unchanged CSS) scrolls to it like any content wider than its box.
  const [containerWidthPx, setContainerWidthPx] = useState(700);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setContainerWidthPx(Math.max(320, el.clientWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // FX4 S4 — the effective page width every normalized box coordinate
  // converts against: the persisted override once the writer has dragged
  // the canvas wider/narrower, else the wrap's own natural (auto-fit)
  // width — byte-identical to pre-FX4 in the untouched case.
  const pageWidthPx = canvasOverrideW != null ? Math.max(canvasOverrideW, CANVAS_MIN_W) : containerWidthPx;

  // Autosave — debounced, like PageEditor's text; flush on hide/unmount.
  useEffect(() => {
    if (boxes === lastSavedRef.current) return;
    const h = setTimeout(() => { saveBoardBoxes(id, boxesRef.current); lastSavedRef.current = boxesRef.current; }, AUTOSAVE_MS);
    return () => clearTimeout(h);
  }, [boxes, id]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden' && boxesRef.current !== lastSavedRef.current) {
        saveBoardBoxes(id, boxesRef.current);
        lastSavedRef.current = boxesRef.current;
        flushNow();
      }
    };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      if (boxesRef.current !== lastSavedRef.current) saveBoardBoxes(id, boxesRef.current);
      flushNow();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Text reflow — measure each text box's actual rendered height and grow
  // `h` when content needs MORE room than currently allotted (the port-time
  // estimate, a width resize shrinking the wrap and forcing more wraps, or
  // a live edit adding text). page-pin/connection/board-meta boxes are
  // never measured here (kind !== 'text' short-circuits, same as ink
  // always has).
  //
  // FX4 S4 — reflow is now a MINIMUM floor, not a two-way dictate: `.board-
  // text` already carries `overflow:auto` (index.css, pre-existing), so for
  // a box the writer has deliberately made TALLER than its content needs,
  // `el.scrollHeight` reports the BOX's own (taller) rendered height back —
  // content that fits without scrolling never makes scrollHeight exceed
  // clientHeight — so this only ever fires (and only ever GROWS `h`) when
  // content genuinely overflows what's currently allotted; a manually
  // enlarged card's own extra whitespace is never clawed back.
  useLayoutEffect(() => {
    if (pageWidthPx <= 0) return;
    let changed = false;
    const next = boxes.map(b => {
      if (b.kind !== 'text') return b;
      const el = measureEls.current.get(b.id);
      if (!el) return b;
      const measuredPx = el.scrollHeight;
      const storedPx = b.h * pageWidthPx;
      if (measuredPx - storedPx <= MEASURE_TOLERANCE_PX) return b;
      changed = true;
      return { ...b, h: measuredPx / pageWidthPx };
    });
    if (changed) setBoxes(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boxes, pageWidthPx, popupBoxId]);

  const measureRef = (boxId: string, el: HTMLDivElement | null) => {
    if (el) measureEls.current.set(boxId, el);
    else measureEls.current.delete(boxId);
  };

  const commitText = (boxId: string, text: string) => {
    if (framed) boardDissolve.noteWrite(); // AB1 S3 — see the hook's mount comment above
    setBoxes(prev => prev.map(b => (b.id === boxId ? { ...b, text } : b)));
  };

  const snapshot = (type: NonNullable<LastAction>['type']) => {
    lastActionRef.current = { type, before: boxesRef.current };
    setCanUndo(true);
  };

  const undo = () => {
    const la = lastActionRef.current;
    if (!la) return;
    setBoxes(la.before);
    lastSavedRef.current = boxesRef.current; // force the autosave effect to see a change
    saveBoardBoxes(id, la.before);
    lastActionRef.current = null;
    setCanUndo(false);
  };

  const selectedBox = boxes.find(b => b.id === selectedId) ?? null;
  const selectedGroup = selectedBox ? groupMembers(boxes, selectedBox.groupId) : [];
  const selectedIds = new Set(selectedGroup.length > 0 ? selectedGroup.map(b => b.id) : selectedBox ? [selectedBox.id] : []);
  const canResize = !!selectedBox && !selectedBox.groupId;

  const ungroup = () => {
    if (!selectedBox?.groupId) return;
    snapshot('ungroup');
    const gid = selectedBox.groupId;
    setBoxes(prev => prev.map(b => (b.groupId === gid ? { ...b, groupId: undefined } : b)));
  };

  // AB4 S3 — removing a card also drops any hairline that referenced it (an
  // orphaned connection would point at nothing); one snapshot covers both,
  // so Undo restores the card AND its connections together.
  const removeSelected = () => {
    if (!selectedBox) return;
    snapshot('remove');
    const idsToRemove = selectedIds;
    setBoxes(prev => prev.filter(b => {
      if (idsToRemove.has(b.id)) return false;
      if (b.kind === 'connection' && (idsToRemove.has(b.connA ?? '') || idsToRemove.has(b.connB ?? ''))) return false;
      return true;
    }));
    setSelectedId(null);
  };

  // AB4 S3 — thread deletion: confirm-free (a thread is cheap; re-drawing is
  // one gesture, the brief's own words).
  const removeConnection = (connId: string) => {
    snapshot('remove');
    setBoxes(prev => prev.filter(b => b.id !== connId));
    setSelectedConnectionId(null);
  };

  // AB4 S5 — "Add card," the sliver's other hand tool: a blank text card,
  // dropped below the current content and opened straight into edit mode
  // (the anti-Canva guard still holds — content + position only; this just
  // adds ONE new way content can start, alongside a port and a pin).
  // FX4 S5 — "opens it straight into edit mode" now means the popup
  // (inline editing retired whole).
  const onAddCard = () => {
    const y = maxBottom(boxesRef.current) + ADD_CARD_GAP;
    const maxZ = boxesRef.current.reduce((m, b) => Math.max(m, b.z), 0);
    const box: Box = { id: generateId(), kind: 'text', x: 0.05, y, w: NEW_CARD_W, h: NEW_CARD_H, z: maxZ + 1, text: '' };
    setBoxes(prev => [...prev, box]);
    setSelectedId(box.id);
    setPopupBoxId(box.id);
  };

  // AB4 S4 — double-click travel from a page-pin card, "the board is one
  // Back away." `state.fromBoardId` is the guarantee: JournalEntry.tsx/
  // PageEditor.tsx/ScriptEditor.tsx's own framed nav row reads it and renders
  // a "‹ Back to the board" chip beside Done — the exact F2 warm-start
  // precedent for a one-shot `navigate(..., { state })` signal, applied to
  // routing instead of a landing glow. Framed-only by construction (every
  // target surface's chip only renders in ITS OWN framed branch).
  // FX5 S3 — generalized to any entryId (not just a page-pin's own
  // `entryId` field): a PORTED text card's own `sourceEntryId` (provenance,
  // AB4/FX4's existing field — "Provenance travels on every box") gets the
  // SAME quiet travel affordance now, since the brief's own S3(b) asks for
  // "a quiet 'open' affordance via the existing double-click travel" on a
  // page-representing card's face — this is that mechanism, reused rather
  // than reinvented, for the second box kind that also represents a page.
  const travelToEntry = (entryId: string | undefined) => {
    if (!entryId) return;
    const target = getJournalEntry(entryId);
    if (!target) return;
    flushNow();
    const route = target.pageType != null ? `/page/${target.id}` : `/journal/${target.id}`;
    navigate(route, { state: { fromBoardId: id, fromBoardTitle: title } });
  };
  const travelToPin = (box: Box) => travelToEntry(box.entryId);

  // -- delegated pointer handling: select / move / resize / thread-drag -----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let phase: 'idle' | 'pending' | 'dragging' | 'resizing' | 'threadDrag' = 'idle';
    let startX = 0, startY = 0, ptype = 'mouse';
    let activePointerId: number | null = null;
    let longPressTimer: ReturnType<typeof setTimeout> | null = null;
    let movingIds: string[] = [];
    let startBoxes: Box[] = [];
    let resizingId: string | null = null;
    let resizeStart: { w: number; h: number; aspect: number; kind: Box['kind'] } | null = null;

    const clearTimer = () => { if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; } };

    // FX4 S6 — the live preview line's endpoint, updated imperatively
    // (previewLineRef) so a thread-drag never triggers a React render on
    // every pointermove, matching JournalEntry.tsx's own eraser-ring
    // discipline for the identical reason.
    const updateThreadPreview = (x: number, y: number) => {
      const line = previewLineRef.current;
      if (!line) return;
      const canvasRect = canvas.getBoundingClientRect();
      line.setAttribute('x2', String(x - canvasRect.left));
      line.setAttribute('y2', String(y - canvasRect.top));
      line.style.display = 'block';
    };
    const hideThreadPreview = () => {
      const line = previewLineRef.current;
      if (line) line.style.display = 'none';
    };

    // FX4 S6 — the thread-drag's own commit: released inside a DIFFERENT
    // card mints a hairline (de-duped either order, same as AB4's own
    // connect-mode gesture); released on empty board, or on the SAME card
    // it started from, cancels. The 'connection' Box shape/creation is
    // UNCHANGED from AB4 — only this gesture triggers it now.
    const finishThreadDrag = (e: PointerEvent) => {
      clearTimer();
      if (activePointerId != null && canvas.hasPointerCapture(activePointerId)) {
        try { canvas.releasePointerCapture(activePointerId); } catch { /* already released */ }
      }
      hideThreadPreview();
      phase = 'idle';
      const from = threadArmedFromRef.current;
      threadArmedFromRef.current = null;
      setThreadArmedFrom(null);
      if (!from) return;
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      const targetBoxEl = el?.closest('.board-box') as HTMLElement | null;
      const targetId = targetBoxEl?.dataset.boxId;
      if (!targetId || targetId === from) return; // empty board or same card — cancel
      const exists = boxesRef.current.some(x => x.kind === 'connection' && ((x.connA === from && x.connB === targetId) || (x.connA === targetId && x.connB === from)));
      if (exists) return;
      const maxZ = boxesRef.current.reduce((m, x) => Math.max(m, x.z), 0);
      const conn: Box = { id: generateId(), kind: 'connection', x: 0, y: 0, w: 0, h: 0, z: maxZ + 1, connA: from, connB: targetId };
      setBoxes(prev => [...prev, conn]);
    };

    const beginMove = (ids: string[]) => {
      phase = 'dragging';
      movingIds = ids;
      startBoxes = boxesRef.current;
      if (activePointerId != null) { try { canvas.setPointerCapture(activePointerId); } catch { /* gone */ } }
    };

    const beginResize = (boxId: string) => {
      const box = boxesRef.current.find(b => b.id === boxId);
      if (!box) return;
      phase = 'resizing';
      resizingId = boxId;
      startBoxes = boxesRef.current;
      resizeStart = { w: box.w, h: box.h, aspect: box.h / box.w, kind: box.kind };
      if (activePointerId != null) { try { canvas.setPointerCapture(activePointerId); } catch { /* gone */ } }
    };

    const finish = (commit: boolean) => {
      clearTimer();
      if (activePointerId != null && canvas.hasPointerCapture(activePointerId)) {
        try { canvas.releasePointerCapture(activePointerId); } catch { /* already released */ }
      }
      if (commit && (phase === 'dragging' || phase === 'resizing') && boxesRef.current !== startBoxes) {
        lastActionRef.current = { type: phase === 'dragging' ? 'move' : 'resize', before: startBoxes };
        setCanUndo(true);
      } else if (!commit && (phase === 'dragging' || phase === 'resizing')) {
        setBoxes(startBoxes); // release outside canvas / cancel: revert to the pre-gesture snapshot
      }
      phase = 'idle';
      movingIds = [];
      resizingId = null;
      resizeStart = null;
    };

    const onDown = (e: PointerEvent) => {
      if (popupBoxIdRef.current) return; // the card popup is open — board gestures stand down
      const target = e.target as HTMLElement;
      const pinEl = target.closest('.board-pin-grab') as HTMLElement | null;
      const pinBoxEl = pinEl?.closest('.board-box') as HTMLElement | null;

      // FX5 S5 — the olive pin is the connection grab now; the dead handle-
      // double-click gesture (armThreadDrag on a .board-handle dblclick) is
      // REMOVED whole, not repaired (Nick's own ruling — the DoD names the
      // pin explicitly). Pointer-down ON the pin arms AND begins tracking
      // in the SAME gesture — one continuous drag, no separate two-step
      // arm-then-drag the old gesture needed (that two-step, double-click-
      // dependent shape is very likely WHY it read as "dead": a real hand's
      // double-click timing is far less reliable than a script's).
      if (pinEl && pinBoxEl) {
        e.preventDefault();
        e.stopPropagation();
        const boxId = pinBoxEl.dataset.boxId!;
        armThreadDrag(boxId);
        activePointerId = e.pointerId;
        phase = 'threadDrag';
        try { canvas.setPointerCapture(activePointerId); } catch { /* gone */ }
        updateThreadPreview(e.clientX, e.clientY);
        return;
      }

      const handleEl = target.closest('.board-handle') as HTMLElement | null;
      const boxEl = target.closest('.board-box') as HTMLElement | null;

      // Retained for defense-in-depth (an already-armed thread from a prior
      // gesture, e.g. re-pressing after Escape didn't fully clear a stale
      // ref — the pin above is the only path that ARMS one now).
      if (threadArmedFromRef.current != null) {
        e.preventDefault();
        activePointerId = e.pointerId;
        phase = 'threadDrag';
        try { canvas.setPointerCapture(activePointerId); } catch { /* gone */ }
        updateThreadPreview(e.clientX, e.clientY);
        return;
      }

      if (handleEl && boxEl) {
        const boxId = boxEl.dataset.boxId!;
        if (boxId !== selectedIdRef.current) return; // handle only active on the selected box
        startX = e.clientX; startY = e.clientY; ptype = e.pointerType; activePointerId = e.pointerId;
        try { canvas.setPointerCapture(activePointerId); } catch { /* gone */ }
        beginResize(boxId);
        return;
      }

      if (!boxEl) {
        setSelectedId(null);
        return;
      }

      const boxId = boxEl.dataset.boxId!;
      setSelectedId(boxId);
      setSelectedConnectionId(null); // AB4 S3 — selecting a box clears any connection selection
      startX = e.clientX; startY = e.clientY; ptype = e.pointerType; activePointerId = e.pointerId;
      phase = 'pending';
      // FX5 S4 (a) — the diagnosed drag-friction fix: capture the pointer
      // HERE, on the very first pointerdown, not only once the drag
      // threshold is crossed (the old code left `beginMove`/`beginResize`
      // as the ONLY setPointerCapture callers — found live by reading the
      // gesture state machine, not guessed). Between pointerdown and the
      // 6px MOUSE_DRAG_THRESHOLD being crossed, an uncaptured pointer's
      // move/up events route to whatever DOM element is actually under the
      // cursor at that instant, not necessarily this canvas — a fast real
      // drag can move far enough between two consecutive OS-delivered
      // pointermove events that hit-testing lands outside `.board-canvas`
      // (or over a DIFFERENT card, or past `.board-canvas-wrap`'s own
      // scrollable edge) before capture ever engages, silently dropping
      // the rest of the gesture — "cards can't easily be moved." A
      // synthetic harness dispatch (element.dispatchEvent on the origin
      // element for every step) can never reproduce this: it always
      // targets the origin node directly, bypassing the very hit-testing
      // capture exists to stabilize — this fix can only be PROVEN by
      // asserting capture engages immediately (see fx5.mjs's own S4
      // section), not by a synthetic full-gesture replay; real-hand
      // reliability rests on Nick's own hand, disclosed here per this
      // ticket's own standing discipline.
      try { canvas.setPointerCapture(activePointerId); } catch { /* gone */ }
      const box = boxesRef.current.find(b => b.id === boxId);
      const ids = box ? (box.groupId ? groupMembers(boxesRef.current, box.groupId).map(b => b.id) : [boxId]) : [boxId];
      if (ptype === 'touch' || ptype === 'pen') {
        longPressTimer = setTimeout(() => { if (phase === 'pending') beginMove(ids); }, LONG_PRESS_MS);
      } else {
        // mouse: stash the candidate ids; promoted to a real drag past the threshold in onMove
        movingIds = ids;
      }
    };

    const onMove = (e: PointerEvent) => {
      if (phase === 'threadDrag') {
        e.preventDefault();
        updateThreadPreview(e.clientX, e.clientY);
        return;
      }
      if (phase === 'pending') {
        const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
        if (ptype === 'mouse') {
          if (dist > MOUSE_DRAG_THRESHOLD) beginMove(movingIds);
        } else if (dist > TOUCH_CANCEL_THRESHOLD) {
          clearTimer();
          phase = 'idle';
        }
        return;
      }
      if (phase === 'dragging') {
        e.preventDefault();
        const dx = (e.clientX - startX) / pageWidthPx;
        const dy = (e.clientY - startY) / pageWidthPx;
        const ids = new Set(movingIds);
        setBoxes(startBoxes.map(b => (ids.has(b.id) ? { ...b, x: Math.max(0, b.x + dx), y: Math.max(0, b.y + dy) } : b)));
        return;
      }
      if (phase === 'resizing' && resizingId && resizeStart) {
        e.preventDefault();
        const dx = (e.clientX - startX) / pageWidthPx;
        const minW = resizeStart.kind === 'text' ? MIN_TEXT_W : resizeStart.kind === 'ink' ? MIN_INK_W : MIN_PIN_W;
        const newW = Math.max(minW, resizeStart.w + dx);
        setBoxes(startBoxes.map(b => {
          if (b.id !== resizingId) return b;
          if (b.kind === 'ink') return { ...b, w: newW, h: newW * resizeStart!.aspect };
          // FX4 S4 — text now resizes freeform on BOTH axes too (height was
          // reflow-only before this ticket): dragging taller sets an
          // explicit `h` the reflow-as-minimum effect above will only ever
          // GROW from, never shrink back — "height becomes free; reflow
          // becomes a minimum, not a dictate" (the brief's own words).
          // page-pin already resized both axes freeform (AB4 S4); text now
          // shares the identical branch, MIN_TEXT_H its own floor.
          const dy = (e.clientY - startY) / pageWidthPx;
          const minH = b.kind === 'text' ? MIN_TEXT_H : MIN_PIN_H;
          const newH = Math.max(minH, resizeStart!.h + dy);
          return { ...b, w: newW, h: newH };
        }));
      }
    };

    const onUp = (e: PointerEvent) => {
      if (phase === 'threadDrag') { finishThreadDrag(e); return; }
      finish(true);
    };
    const onCancel = () => {
      // A genuine pointercancel (not a plain release) always disarms
      // without ever committing — never trust wherever the OS happened to
      // report the pointer at cancel time.
      if (phase === 'threadDrag') {
        clearTimer();
        if (activePointerId != null && canvas.hasPointerCapture(activePointerId)) {
          try { canvas.releasePointerCapture(activePointerId); } catch { /* already released */ }
        }
        hideThreadPreview();
        phase = 'idle';
        threadArmedFromRef.current = null;
        setThreadArmedFrom(null);
        return;
      }
      finish(false);
    };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove, { passive: false });
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onCancel);
    return () => {
      clearTimer();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onCancel);
    };
  }, [pageWidthPx]);

  // Esc: while the card popup is open, IT owns Escape entirely (its own
  // focus-trap effect closes it — see BoardCardPopup above); this handler
  // stands down so the two can never double-handle the same keypress.
  // Otherwise: disarm a thread-drag, else deselect a connection, else
  // deselect a box. Delete/Backspace: remove a selected connection
  // (confirm-free, S3's own words) — guarded against a stray Backspace
  // while the writer is typing anywhere else on the page (the isEditable
  // check), so an unrelated edit can never eat a hairline.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (popupBoxIdRef.current) return;
      if (e.key === 'Escape') {
        // FX4 S6 — cancels the arm itself AND, if a drag is already in
        // progress (button held), the in-flight preview line too: the
        // pointer-effect's own `finishThreadDrag` reads threadArmedFromRef
        // to decide commit-vs-cancel on release, so nulling it here means
        // the eventual pointerup can never mint a connection even if the
        // writer releases over a card afterward.
        if (threadArmedFromRef.current != null) {
          threadArmedFromRef.current = null;
          setThreadArmedFrom(null);
          if (previewLineRef.current) previewLineRef.current.style.display = 'none';
          return;
        }
        if (selectedConnectionIdRef.current) { setSelectedConnectionId(null); return; }
        if (selectedIdRef.current) { setSelectedId(null); return; }
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedConnectionIdRef.current) {
        const ae = document.activeElement as HTMLElement | null;
        const editable = !!ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable);
        if (editable) return;
        e.preventDefault();
        removeConnection(selectedConnectionIdRef.current);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Harness inspection seam (matches the wrizoNotebook/wrizoVocab convention).
  useEffect(() => {
    (window as unknown as { wrizoBoard?: unknown }).wrizoBoard = () => boxesRef.current;
    return () => { delete (window as unknown as { wrizoBoard?: unknown }).wrizoBoard; };
  }, []);

  if (!initialEntry) return null;

  // FX4 S4 — "minimums = content extents": the canvas can never be dragged
  // shorter than what the current layout actually needs; the persisted
  // override (once set) can only make it TALLER than that floor, never
  // shorter. contentMinHeightPx is the SAME formula the pre-FX4 auto-height
  // always used — byte-identical when canvasOverrideH is null.
  const contentMinHeightPx = Math.max((maxBottom(boxes) + 0.08) * pageWidthPx, VIEWPORT_MIN_PX);
  const canvasHeightPx = canvasOverrideH != null ? Math.max(canvasOverrideH, contentMinHeightPx) : contentMinHeightPx;
  const backTo = project ? `/project/${project.id}` : '/journal';
  const title = initialEntry.text.trim() ? initialEntry.text.trim() : 'Untitled';

  // AB4 S3 / FX4 S4 — connection and board-meta boxes are never positioned
  // cards: filtered out of the positioned-card render loop (they never
  // carry a real x/y/w/h) — connections draw as a separate SVG layer
  // (endpoints derived LIVE from the current boxes, so a drag/resize drags
  // the hairline with it for free); board-meta renders nothing at all (its
  // only job is carrying the canvas's own persisted dimensions).
  const visibleBoxes = boxes.filter(b => b.kind !== 'connection' && b.kind !== 'board-meta');
  const connections = boxes.filter(b => b.kind === 'connection');
  const sorted = visibleBoxes.slice().sort((a, b) => a.z - b.z);

  // FX5 S4 (c) — the quiet layer icon: appears only on a SELECTED card that
  // genuinely overlaps at least one sibling (boxesOverlap, module-level).
  // A single toggle, the existing z field only (no new schema): if the
  // selected card is already at/above the FRONT of its own overlap group,
  // one click sends it BEHIND the whole group's back; otherwise one click
  // brings it above the group's own front.
  const overlapPeers = selectedBox ? visibleBoxes.filter(b => b.id !== selectedBox.id && boxesOverlap(selectedBox, b)) : [];
  const isOverlapping = overlapPeers.length > 0;
  const sendingToBack = isOverlapping && selectedBox!.z >= Math.max(...overlapPeers.map(p => p.z));
  const toggleLayer = () => {
    if (!selectedBox || overlapPeers.length === 0) return;
    const peerZs = overlapPeers.map(p => p.z);
    const nextZ = sendingToBack ? Math.min(...peerZs) - 1 : Math.max(...peerZs) + 1;
    snapshot('move'); // a z-only change is still a positional edit, same undo bucket as move/resize
    setBoxes(prev => prev.map(b => (b.id === selectedBox.id ? { ...b, z: nextZ } : b)));
  };

  // FX5 S3 — a selected, ported (sourceEntryId) text card gets an explicit
  // "Edit copy" action row button — double-click on its face now travels to
  // the source (below, matching page-pin's own affordance), so this is the
  // one remaining way to reach the popup that still edits the board's own
  // independent copy (Port's own "COPY, never move" law: the board's copy
  // stays fully editable, just not via the same gesture as a hand-typed
  // card anymore).
  const boardActionRow = selectedBox && (
    <div className="board-action-row" style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
      {selectedBox.groupId && <button type="button" className="btn-quiet" onClick={ungroup}>Ungroup</button>}
      {selectedBox.kind === 'text' && selectedBox.sourceEntryId && (
        <button type="button" className="btn-quiet" onClick={() => setPopupBoxId(selectedBox.id)}>{t('boardEditCopy')}</button>
      )}
      <button type="button" className="btn-quiet" onClick={removeSelected}>Remove</button>
    </div>
  );

  const boxCx = (b: Box) => (b.x + b.w / 2) * pageWidthPx;
  const boxCy = (b: Box) => (b.y + b.h / 2) * pageWidthPx;

  // FX5 S5 — the connections footer: "— thread: <card title/first words>"
  // for every OTHER card a given box is connected to, plus a single per-
  // board footer toggle (the board-meta 'footerOn' field — undefined/true
  // means "on," matching every board that predates this field). boxLabel
  // mirrors notecardExcerpt's own title logic (module scope, above) but
  // reads whichever content source a box actually carries (its own text,
  // or a page-pin/ported card's referenced entry).
  const boardMeta = boxes.find(b => b.kind === 'board-meta');
  const footerOn = boardMeta?.footerOn !== false;
  const toggleFooter = (on: boolean) => {
    setBoxes(prev => {
      const existing = prev.find(b => b.kind === 'board-meta');
      const meta: Box = existing
        ? { ...existing, footerOn: on }
        : { id: generateId(), kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 0, footerOn: on };
      return existing ? prev.map(b => (b.id === existing.id ? meta : b)) : [...prev, meta];
    });
  };
  const boxLabel = (b: Box): string => {
    if (b.kind === 'page-pin') {
      const entry = b.entryId ? getJournalEntry(b.entryId) : null;
      return entry ? (notecardExcerpt(entry.text).title || t('boardThreadUntitled')) : t('boardThreadUntitled');
    }
    return notecardExcerpt(b.text ?? '').title || t('boardThreadUntitled');
  };
  const connectionsFor = (boxId: string) => connections
    .map(c => (c.connA === boxId ? c.connB : c.connB === boxId ? c.connA : null))
    .filter((otherId): otherId is string => !!otherId)
    .map(otherId => boxes.find(b => b.id === otherId))
    .filter((b): b is Box => !!b);

  // FX4 S6 — double-clicking a selected card's own resize handle arms a
  // thread-drag FROM that card. stopPropagation keeps the canvas's own
  // onDoubleClick (text edit / page-pin travel, below) from ALSO firing —
  // the handle sits inside `.board-box`, so the event would otherwise
  // bubble into that handler too.
  const armThreadDrag = (boxId: string) => {
    threadArmedFromRef.current = boxId;
    setThreadArmedFrom(boxId);
  };

  // FX4 S4 — the canvas's own bottom-right resize handle: a plain pointer
  // drag (no long-press/threshold ceremony — "a quiet bottom-right drag,"
  // the brief's own words), committed to the SAME `boxes` array as a
  // 'board-meta' upsert on release, riding the EXISTING autosave/undo-
  // agnostic persistence path every other box mutation already uses (no
  // new save mechanism).
  const onCanvasHandleDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    canvasResizeStartRef.current = { x: e.clientX, y: e.clientY, w: pageWidthPx, h: canvasHeightPx };
    try { (e.target as Element).setPointerCapture(e.pointerId); } catch { /* gone */ }
  };
  const onCanvasHandleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = canvasResizeStartRef.current;
    if (!start) return;
    e.preventDefault();
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    setCanvasOverrideW(Math.max(CANVAS_MIN_W, start.w + dx));
    setCanvasOverrideH(Math.max(VIEWPORT_MIN_PX, start.h + dy));
  };
  const onCanvasHandleUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = canvasResizeStartRef.current;
    if (!start) return;
    canvasResizeStartRef.current = null;
    try { (e.target as Element).releasePointerCapture(e.pointerId); } catch { /* already released */ }
    // Persist as a 'board-meta' upsert — recompute the FINAL w/h directly
    // from this release event's own coordinates (the same math onMove just
    // used), rather than reading back React state that may not have
    // committed its last update yet — avoids a stale-closure race entirely.
    const w = Math.max(CANVAS_MIN_W, start.w + (e.clientX - start.x));
    const h = Math.max(VIEWPORT_MIN_PX, start.h + (e.clientY - start.y));
    setBoxes(prev => {
      const existing = prev.find(b => b.kind === 'board-meta');
      const meta: Box = existing
        ? { ...existing, canvasW: w, canvasH: h }
        : { id: generateId(), kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 0, canvasW: w, canvasH: h };
      return existing ? prev.map(b => (b.id === existing.id ? meta : b)) : [...prev, meta];
    });
  };

  const boardCanvas = (
    <div style={{ position: 'relative' }}>
      <div ref={wrapRef} className="board-canvas-wrap" style={{ overflow: 'auto', maxHeight: '78vh', border: '1px solid var(--ink-border)' }}>
        <div
          ref={canvasRef}
          className="board-canvas"
          data-thread-armed={threadArmedFrom != null ? 'true' : 'false'}
          style={{ position: 'relative', width: pageWidthPx, height: canvasHeightPx, background: 'var(--paper)' }}
          onDoubleClick={(e) => {
            const boxEl = (e.target as HTMLElement).closest('.board-box') as HTMLElement | null;
            const boxId = boxEl?.dataset.boxId;
            if (!boxId) return;
            const box = boxesRef.current.find(b => b.id === boxId);
            // FX5 S3 — a PORTED text card (sourceEntryId set) travels to its
            // own source now, matching page-pin's affordance exactly (the
            // brief's own "quiet 'open' affordance via the existing double-
            // click travel"); a hand-typed card (no sourceEntryId) keeps the
            // unchanged edit-popup behavior.
            if (box?.kind === 'text' && box.sourceEntryId) { travelToEntry(box.sourceEntryId); }
            else if (box?.kind === 'text') { setSelectedId(boxId); setPopupBoxId(boxId); }
            else if (box?.kind === 'page-pin') { travelToPin(box); }
          }}
        >
          {/* AB4 S3 / FX4 S6 — the threads layer: hairlines between cards,
              quiet at rest; a selected hairline goes brass, matching the
              selection treatment every other board element already
              carries. pointer-events:none on the group; each line opts
              back in via its own stroke so clicking elsewhere on the
              canvas is unaffected. The live preview line (FX4 S6) is a
              dashed olive line, hidden until a thread-drag is in progress
              — its own endpoint is updated imperatively (never through
              React state) by the pointer-effect above. */}
          <svg
            className="board-connections"
            data-thread-armed={threadArmedFrom != null ? 'true' : 'false'}
            width={pageWidthPx}
            height={canvasHeightPx}
            style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
            aria-hidden="true"
          >
            {connections.map(conn => {
              const a = boxes.find(b => b.id === conn.connA);
              const b = boxes.find(b => b.id === conn.connB);
              if (!a || !b) return null;
              const x1 = boxCx(a), y1 = boxCy(a), x2 = boxCx(b), y2 = boxCy(b);
              const selected = conn.id === selectedConnectionId;
              return (
                <g key={conn.id} data-connection-id={conn.id}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} className="board-connection-hit"
                    style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                    onClick={() => { setSelectedConnectionId(conn.id); setSelectedId(null); }} />
                  <line x1={x1} y1={y1} x2={x2} y2={y2} className="board-connection-line" data-selected={selected ? 'true' : 'false'} />
                </g>
              );
            })}
            {threadArmedFrom != null && (() => {
              const from = boxes.find(b => b.id === threadArmedFrom);
              if (!from) return null;
              const x1 = boxCx(from), y1 = boxCy(from);
              return <line ref={previewLineRef} className="board-thread-preview" x1={x1} y1={y1} x2={x1} y2={y1} style={{ display: 'none' }} />;
            })()}
          </svg>
          {sorted.map(box => {
          const selected = selectedIds.has(box.id);
          const boxConnections = footerOn ? connectionsFor(box.id) : [];
          const showLayerToggle = selected && box.id === selectedId && isOverlapping;
          return (
            <div
              key={box.id}
              className="board-box"
              data-box-id={box.id}
              data-kind={box.kind}
              data-selected={selected ? 'true' : 'false'}
              data-grouped={box.groupId ? 'true' : 'false'}
              data-thread-source={box.id === threadArmedFrom ? 'true' : 'false'}
              data-overlapping={selected && box.id === selectedId && isOverlapping ? 'true' : 'false'}
              style={{
                position: 'absolute',
                left: box.x * pageWidthPx, top: box.y * pageWidthPx,
                width: box.w * pageWidthPx, height: box.h * pageWidthPx,
                zIndex: box.z,
              }}
            >
              {box.kind === 'ink' ? (
                <BoardInkBox box={box} pageWidthPx={pageWidthPx} />
              ) : box.kind === 'page-pin' ? (
                <BoardPinBox box={box} />
              ) : (
                <BoardTextBox
                  boxId={box.id}
                  initialText={box.text ?? ''}
                  measureRef={measureRef}
                  sourceEntryId={box.sourceEntryId}
                />
              )}
              {/* FX5 S5 — the olive pin: the connection grab, on every card,
                  always (not gated on selection — the dead handle-double-
                  click gesture it replaces required a select-then-double-
                  click two-step; one continuous drag-from-here is the whole
                  point). Wired in the pointer-effect's own onDown above. */}
              <div className="board-pin-grab" data-pin="true" aria-hidden="true" title={t('boardThreadGrab')} />
              {/* FX5 S5 — the connections footer: one quiet line per thread,
                  hidden whole when the board's own footer toggle is off. */}
              {boxConnections.length > 0 && (
                <div className="board-card-footer">
                  {boxConnections.map(other => (
                    <div key={other.id} className="board-card-footer-line">— {t('boardThreadPrefix')}: {boxLabel(other)}</div>
                  ))}
                </div>
              )}
              {selected && canResize && box.id === selectedId && (
                <div
                  className="board-handle"
                  data-handle="se"
                  aria-hidden="true"
                />
              )}
              {/* FX5 S4 (c) — the quiet layer-order icon: only a selected
                  card that's genuinely overlapping a sibling gets it. */}
              {showLayerToggle && (
                <button
                  type="button"
                  className="board-layer-toggle"
                  data-layer-toggle="true"
                  title={sendingToBack ? t('boardLayerSendBack') : t('boardLayerBringFront')}
                  aria-label={sendingToBack ? t('boardLayerSendBack') : t('boardLayerBringFront')}
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); toggleLayer(); }}
                >
                  ⧉
                </button>
              )}
            </div>
          );
        })}
      </div>
      </div>
      {/* FX4 S4 — the board canvas's own quiet bottom-right resize handle,
          pinned to the WRAP's own visible corner (position:absolute against
          the outer position:relative wrapper, OUTSIDE the scrollable
          `.board-canvas-wrap`) so it stays reachable regardless of internal
          scroll position — a genuinely wider/taller canvas scrolls inside
          the wrap; the handle itself never scrolls away. */}
      <div
        className="board-canvas-resize-handle"
        aria-hidden="true"
        onPointerDown={onCanvasHandleDown}
        onPointerMove={onCanvasHandleMove}
        onPointerUp={onCanvasHandleUp}
        onPointerCancel={onCanvasHandleUp}
      />
    </div>
  );

  // FX4 S5 — the popup editor mounts over a BLURRED board (the mockup's own
  // treatment) whenever a text card is open; `.board-canvas-blurred`
  // carries the filter/dim, `.board-canvas-blur-wrap`'s own transition
  // (index.css) honors reduced-motion. The popup itself is a fixed
  // full-viewport overlay (the SAME z-index family `.board-sheet` already
  // uses for Move/Copy/Pin) so it always centers regardless of scroll
  // position within a tall/wide board.
  const popupBox = popupBoxId ? boxes.find(b => b.id === popupBoxId) : null;
  const boardBody = (
    <>
      {boardActionRow}
      <div className={`board-canvas-blur-wrap${popupBox ? ' board-canvas-blurred' : ''}`}>
        {boardCanvas}
      </div>
      {popupBox && (
        <BoardCardPopup
          initialText={popupBox.text ?? ''}
          onCommit={text => commitText(popupBox.id, text)}
          onClose={() => setPopupBoxId(null)}
        />
      )}
    </>
  );

  // AB4 S5 / FX4 S6 — the board's own hand tool(s). Connect toggle RETIRES
  // (replaced by the handle-drag gesture above) — the sliver carries Add
  // card alone now.
  // FX5 S5 — a second control joins it: the per-board connections-footer
  // toggle ("Add card + this, two controls" — the brief's own words).
  const sliverContent: SliverContent = {
    kind: 'board',
    onAddCard,
    footer: { on: footerOn, onToggle: toggleFooter },
  };

  const pageFaceSheets = (
    <>
      {portOpen && <PortToBoardSheet sourceIds={[id]} onClose={() => setPortOpen(false)} />}
      {addOpen && (
        <AddToSheet
          sourceIds={[id]}
          onClose={() => setAddOpen(false)}
          onDone={() => setAddOpen(false)}
        />
      )}
      {pinOpen && <PinToBoardSheet entryId={id} onClose={() => setPinOpen(false)} />}
    </>
  );

  // AB4 S5 — framed (>=1100px): DeskFrame now carries the strip, the
  // cascade's reach/survey layers, and the board's own sliver — the
  // standing gap CD2 left behind ("Board still passes nothing here...
  // AB4/the Wall stays out of this ticket's scope") closes here.
  if (framed) {
    return (
      <div className="desk-frame-host" data-chrome-receded={boardDissolve.dissolved ? 'true' : 'false'}>
        {/* ab1.1 R1 (Fable review) — the nav row was the one piece of framed
            chrome that never recessed with the rest of the room. */}
        <div className="chrome-fade chrome-top sprint-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div className="sprint-crumb" aria-label="Location">
            {drawer && <><span className="crumb-item">{drawer.name}</span><span className="crumb-sep">/</span></>}
            {project && <><span className="crumb-item">{project.title}</span><span className="crumb-sep">/</span></>}
            <span className="crumb-here">{title}</span>
          </div>
          <div className="sprint-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {canUndo && <button type="button" className="btn-quiet" onClick={undo}>Undo</button>}
            <button type="button" className="btn-quiet" onClick={() => { flushNow(); navigate(backTo); }}>Done</button>
          </div>
        </div>

        <div style={{ height: 16 }} />

        <DeskFrame
          pageKind="board"
          strip={cascade.strip}
          cascadeLayers={cascade.layers}
          sliver={<Sliver content={sliverContent} goalText="" />}
          dissolved={boardDissolve.dissolved}
        >
          {/* ab2.1 F2 (geometry-sanity sweep) caught the same class of bug
              as F1, previously unchecked here: .desk-frame-stage is a
              display:flex ROW expecting ONE child. boardActionRow and
              boardCanvas were passed as two separate children with no
              width-establishing wrapper (unlike PageEditorView's
              .mode-pagecol or ScriptEditor's .desk-frame-scroll-cap), so
              they laid out side by side, each shrinking to fit-content —
              .board-canvas-wrap rendered at ~2px. legacy's own
              board-page container caps at maxWidth:1100 (board wants more
              room than prose's 720/760 measure); mirrored here. */}
          <div style={{ width: 'min(100%, 1100px)', display: 'flex', flexDirection: 'column' }}>
            {boardBody}
          </div>
        </DeskFrame>

        {pageFaceSheets}
      </div>
    );
  }

  return (
    <div className="page board-page" style={{ maxWidth: 1100, paddingTop: '2.5rem' }}>
      <div className="sprint-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div className="sprint-crumb" aria-label="Location">
          {drawer && <><span className="crumb-item">{drawer.name}</span><span className="crumb-sep">/</span></>}
          {project && <><span className="crumb-item">{project.title}</span><span className="crumb-sep">/</span></>}
          <span className="crumb-here">{title}</span>
        </div>
        <div className="sprint-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {canUndo && <button type="button" className="btn-quiet" onClick={undo}>Undo</button>}
          <button type="button" className="btn-quiet" onClick={() => { flushNow(); navigate(backTo); }}>Done</button>
        </div>
      </div>

      <div style={{ height: 16 }} />

      {boardBody}
    </div>
  );
}
