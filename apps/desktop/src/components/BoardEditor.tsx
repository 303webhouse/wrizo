import { FluxBoardFrame, FluxCardCoord } from './FluxReadouts';
import { ThemeIcon } from './ThemeIcon';
import { liveBoxes } from '../store/boxTombstones';
import { openContextMenu, type ContextMenuItem } from '../store/contextMenu';
import { requestDelete } from '../store/deleteGate';
import { publishBoardSnapshot, registerBoardActions } from '../store/boardSelection';
import { getResumeTarget } from '../store/resume';
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { boardName, plainLines } from '../store/entryText';
import {
  getJournalEntry, saveBoardBoxes, flushNow, getDrawer, getProject,
  patchJournalEntry, getBoardsConnecting, generateId, createLooseHomePage, pinPageToBoard,
  getSystemKind, reconcileSystemBoard, restoreEntry, getJournalEntryIncludingDeleted, subscribe,
  stashDeletedBoxes, restoreDeletedBox, purgeDeletedBox, getTombstonedBox, softDeleteEntry,
  purgeEntry, emptyTrash, getDeletedEntries, getTrashedCards,
  getPairedPageId, pairBoardWithPage,
  setPinDisplayed, toggleEntryLink, isCardLinkedToEntry, livePinFor, getLinkPeersByCard, addPageLink,
  boardNestChain, pinAspectFor } from '../store/persistence';
import { SURVEY_DRAG_TYPE } from './CascadeSurvey';
import { useBoardMode, lastShownBeforeWalk } from '../store/boardMode';
import { StoryboardProjection, OutlineProjection } from './BoardProjection';
import { withLanes } from '../store/boardStructure';
import { BeginningsRow, type BeginningDoor } from './BeginningsRow';
import { useUnborn } from './UnbornSurface';
import { unbornHref, decodeDeckAnswers } from '../store/unbornPage';
import type { HelpLanding } from '../decks/helpMeChoose';
import { renderStroke } from '../store/ink';
import { notePasteBlocked, shadowAllows, extractIncomingText } from '../store/voiceWall';
import { getSelectionOffsets, getCaretOffset, setCaretOffset, setSelectionOffsets } from '../store/caretOffset';
import { applyFormat, formatShortcutAction, applyFontPick, fontFaceAt, clearFontSpans, type FormatAction } from '../store/draftFormat';
import { decorateEditorFor, decorateMarkdownForCard, readEditorPlainText, revealAtCaret } from '../store/draftDecoration';
import { attachHiddenMarkEditing, hiddenMarkEditingFor } from '../store/hiddenMarksEditing';
import { placeCaret } from '../store/hiddenMarksDom';
import { applyEmDash, findEmDashTrigger } from '../store/emDash';
import { classifyEditKind, createTextUndoStack, type EditKind, type TextUndoStack } from '../store/textUndo';
import { useWayBack } from './useWayBack';
import { useChromeDissolve } from './useChromeDissolve';
import { useLexicon } from '../store/themeLexicon';
import { useDeskLexicon, deskTerm } from '../store/deskLexicon';
import { describePageHome, boardDrawerLine } from '../store/pageHome';
import { routeForEntry } from '../store/routeForEntry';
import { useCascade } from './Cascade';
import { PortToBoardSheet } from './PortToBoardSheet';
import { PinToBoardSheet } from './PinToBoardSheet';
import { ExistingPagePicker } from './ExistingPagePicker';
import { Sliver, type SliverContent } from './Sliver';
import { Tutor } from './Tutor';
import { useActionToast } from './ActionToast';
import type { PageFaceSubject } from './PageFace';
import { DeskFrame, useDeskFrameViewport } from './DeskFrame';
import { DeckWizard } from './DeckWizard';
import { DECKS } from '../decks/library';
import { StepHelp } from './StepHelp';
import { Walk } from './Walk';
import { GraftPicker, type CameFrom } from './GraftPicker';
import { planWriteThis } from '../store/writePlace';
import { ShowAs } from './ShowAs';
import { BookFlip, BookThumbs } from './BookViews';
import { kindOf, homeViewOf, isDeck, withHomeView, doorHome, type BoardView } from '../store/boardKind';
import { addPlacement, viewsFor, walkOrder, setWalkPos } from '../store/walk';
import { useTheme } from '../store/theme';
import { getNotebookPages } from '../store/persistence';
import { promptToShow, bodyIsEmpty, pagesOfPlace, kindled, isLit, withLit } from '../store/guided';
import { fitDealtRows } from '../decks/rowFit';
import { DeckGaps } from './DeckGaps';
import { useDeckRewards } from './useDeckRewards';
import { KindleMark, LitMark } from './Walk';
import { GoalCelebration } from './WritingIncentives';
import { addChildren, sceneDoorFor, childTitleOf, childQuestionOf } from '../store/childSteps';
import { graftTo } from '../store/grafts';
import { usePlace } from '../store/usePlace';
import { materializeDeck } from '../decks/engine';
import type { DeckDefinition, DeckAnswers } from '../decks/types';
import { armStartHere, getStartHereCardId, noteDealtCardEdited } from '../store/deckHint';
import type { JournalEntry, Box, Project, StoredFace } from '../types';
import { TypeControl } from './TypeControl';
import { cardTypeStyle, ensureFaceLoaded } from '../store/fontRoster';
import { SIZE_DEFAULT } from '../store/fontSize';

import { registerFlush } from '../store/flushRegistry';

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
// ⚠ SUPERSEDED IN PART BY ITEM 138 (2026-09-24) — kept as written, marked here
// rather than rewritten, because the sentence was true when it was written and a
// reader tracing the freeform decision should find it. WHAT CHANGED: a page-pin
// DOES now take an aspect lock, on RESIZE only, and the aspect comes from the
// PINNED ENTRY's kind (page → vertical, board → horizontal) rather than from the
// card. The no-text-reflow half stands unchanged. See the `page-pin` branch in
// the resizing handler below, and `pinAspectFor` in store/persistence.ts.
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
// FX17 S3 (SV22) — THE STATED LIMIT. "The canvas extends downward — to a stated
// limit, then a hard stop with no stutter and no rubber-banding." This is that
// limit, and it is named here and in the ledger as the brief requires.
//
// THREE PAGE-WIDTHS TALL. Deliberately expressed in the board's OWN normalized
// coordinate system (every box's x/y/w/h is a fraction of pageWidthPx), not in
// pixels and not in screenfuls, for one concrete reason: a board's own extent
// must not change when the window does. A viewport-relative limit would mean the
// same board could be dragged further on a tall monitor than on a laptop, and a
// window resize would silently move the floor under saved cards. Three is
// generous — a canvas twice as tall as it is wide is already a large board — and
// it is one number, so a future ruling changes one line.
//
// THE BREATHING MARGIN is the same 0.08 the auto-height formula already adds
// below the lowest card. That shared term is what makes the stop exact rather
// than approximate: the drag clamp holds a card's BOTTOM at
// BOARD_MAX_Y - 0.08, at which point the height formula computes exactly
// (BOARD_MAX_Y - 0.08 + 0.08) * pageWidthPx = BOARD_MAX_Y * pageWidthPx. So the
// canvas reaches its limit at precisely the frame the card stops — no dead zone
// travelled before the stop, and nothing left to spring back from.
const BOARD_MAX_Y = 3;
const BOARD_BREATHING_ROOM = 0.08;
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
  // item 210: a card's face is plain text - the same reader as every other derived title
  const lines = plainLines(text);
  const title = lines[0] ? lines[0].slice(0, 100) : '';
  const excerpt = lines.slice(1, 4).join(' ').slice(0, 160);
  return { title, excerpt };
}

// AB4 S2 — a page-pin card: MEMBERSHIP, not capture. Reads the referenced
// entry LIVE at every render (getJournalEntryIncludingDeleted, the same "no
// cached snapshot" discipline the cascade's own panels use) — so it can
// never go stale, and pin/unpin never touches the referenced entry's own
// record.
// B1 S4 — deliberately the DELETED-INCLUSIVE read (not getJournalEntry):
// the Trash Board pins every soft-deleted page on purpose (S2's own
// reconcile), and this card must show its REAL title/excerpt — "the Trash
// is a place, not a blank" — never the generic "Missing page" a
// deletion-filtered read would report for every single Trash card. Travel
// (BoardEditor's own travelToPin, below) stays on the live-only read, so a
// deleted page can be SEEN here but not travelled into — Restore is the one
// interactive act a Trash card offers, and this is a read-only face.
// PW2 S2 — a board-card's second line names the DRAWER it lives in, the same
// fact the Plan panel's board rows carry, so one board reads the same on both
// of its faces. A board with no drawer says so rather than borrowing a name.
// ITEM 163 — the local copy is GONE, not corrected in place. It returned the
// drawer name bare; the ruled form is "in <drawer>", and the same fact was spelled
// twice more in CascadePanels. All three now call the one reader in
// store/pageHome.ts, so the next change lands once.

function BoardPinBox({ box }: { box: Box }) {
  const { t: lex } = useLexicon();
  const { t: dt } = useDeskLexicon();
  // BOARD CONTEXT MENU: a card on the TRASH board that stands for a deleted CARD (not a page): read the tombstoned source box for its face. Read-only; Restore / Delete live on its right-click menu.
  if (box.trashedFrom) {
    const src = getTombstonedBox(box.trashedFrom.boardId, box.trashedFrom.boxId);
    const srcPage = src?.kind === 'page-pin' && src.entryId ? getJournalEntryIncludingDeleted(src.entryId) : null;
    const text = src?.kind === 'text' ? src.text ?? '' : srcPage ? srcPage.text : '';
    const { title: tt, excerpt: ex } = notecardExcerpt(text);
    const title = tt || (src?.kind === 'ink' ? 'A sketch' : 'Untitled');
    return (
      <div className="board-text board-pin">
        <div className="board-pin-badge">{dt('trashCardBadge')}</div>
        <div className="board-pin-title">{title}</div>
        {ex && <div className="board-pin-excerpt">{ex}</div>}
      </div>
    );
  }
  const entry = box.entryId ? getJournalEntryIncludingDeleted(box.entryId) : null;
  if (!entry) {
    return <div className="board-text board-pin board-pin-missing">Missing page</div>;
  }
  const hasInk = (entry.strokes?.length ?? 0) > 0;
  const { title: rawTitle, excerpt } = notecardExcerpt(entry.text);
  const title = rawTitle || (hasInk ? 'A sketch' : 'Untitled');
  // PW2 S2 (item 128) — THE BOARD-CARD. A nested board rides the SAME page-pin
  // box as a page; only its face differs, because the membership is the same
  // relation and there is no second model to learn (125 generalizes unchanged).
  //
  // SHAPE TEACHES THE KIND, and spends no colour doing it: a DOUBLED EDGE — a
  // thing that holds things — drawn as a `::before` offset behind the card
  // (Journey D's `.brdcard`). That keeps the Plateau ember ceiling untouched,
  // and it is the job Pass 5 had routed to item 96 as colour-as-kind-signal;
  // shape does it instead, so a third kind costs no accent.
  //
  // THE BADGE IS THE NOUN (CA1): it reads `Board` — never "From a page", never
  // the pin's own wording — because covering the badge must still leave you
  // knowing what you are holding. Second line names its DRAWER, the same fact
  // a board row's second line carries in the Plan panel, so the two faces of
  // one board agree.
  if (entry.pageType === 'board') {
    return (
      <div className="board-text board-pin board-boardcard">
        <div className="board-pin-badge">{lex('board')}</div>
        <div className="board-pin-title">{title}</div>
        <div className="board-pin-excerpt">{boardDrawerLine(entry)}</div>
      </div>
    );
  }
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
  boxId, initialText, measureRef, sourceEntryId, typeStyle, prompt,
}: {
  boxId: string;
  initialText: string;
  measureRef: (id: string, el: HTMLDivElement | null) => void;
  sourceEntryId?: string;
  // W3 - a dealt step's QUESTION, shown only while the card has no body (store/guided.ts promptToShow decides). It rides as an ATTRIBUTE and is painted by a CSS pseudo-element
  // (.board-text[data-prompt]::after), so it is never a text node: never selectable, copyable, counted or read as the writer's words, and this element's textContent stays the stored text.
  prompt?: string | null;
  // ITEM 207 - the card's own face/size (store/fontRoster.ts cardTypeStyle); undefined on a card that never chose, so its
  // element carries no style attribute at all.
  typeStyle?: React.CSSProperties;
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
  // ITEM 118 (a-ii) — THE RESTING CARD RENDERS THROUGH THE DECORATION ENGINE.
  // This returned `{initialText}` as a bare text node, so decoration only ever
  // ran inside the opened popup: on the board itself every markdown marker was
  // literal and nothing was styled, bold and italic alike. That is the "NO
  // styling applied" half of Nick's own walkthrough report.
  //
  // The repair is not a new renderer — it is the popup's OWN engine
  // (decorateMarkdownForCard, already imported above for BoardCardPopup),
  // called with a NULL caret. The card register is reveal-adjacent-to-caret;
  // a resting card has no caret, so nothing is adjacent to anything and every
  // marker collapses to `.md-mark-hidden`. The writer gets words, not syntax —
  // FX5 S6's own recorded verdict ("asterisks visible on a card is a bug, not
  // a style choice"), which was written for the popup and applies with more
  // force to the card sitting in plain view.
  //
  // dangerouslySetInnerHTML is safe here for the same reason it is safe in
  // decorateEditorFor, which writes this identical HTML into a live
  // contenteditable: every text slice goes through escHtml (draftDecoration.ts
  // :13) and the only tags the engine can emit are its own <span class="md-*">.
  //
  // STORAGE IS UNTOUCHED. The marks are collapsed via `font-size:0`, never
  // display/visibility, so they remain real rendered characters — this
  // element's textContent still carries the stored text byte-for-byte. That
  // matters beyond tidiness: draftDecoration.ts's header records that an
  // always-hidden marker vanishes from innerText, which is how markdown
  // characters would get silently stripped out of a writer's saved words.
  //
  // Card auto-sizing is one-directional (the measure effect returns the box
  // unchanged unless measured > stored), so shorter decorated text can never
  // shrink a card. Asserted in item118.mjs rather than left as reasoning.
  return (
    <div
      ref={el => measureRef(boxId, el)}
      className="board-text"
      style={typeStyle}
      data-prompt={prompt ?? undefined}
      dangerouslySetInnerHTML={{ __html: decorateMarkdownForCard(initialText, null) }}
    />
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
export function BoardCardPopup({
  initialText, onCommit, onClose, fontFace, fontSize, onType, prompt, inline, autoFocus,
}: {
  initialText: string;
  // W1 - INLINE: the Walk's card IS this editor (the ordinary card writing engine: decoration, undo, hidden marks, the paste wall) mounted in place - no portal, no backdrop, no dock, no Esc-to-close (Esc belongs to the Walk,
  // which leaves for the board's last shown view). It takes the caret when asked (autoFocus): the Walk asks on every mount, so the caret lands in the card on opening and on stepping (Nick, Oct 25); the arrows then step only while the card is empty (store/walk.ts keyMaySteps).
  inline?: boolean;
  autoFocus?: boolean;
  // W3 - a dealt step's question, shown as the editor's placeholder while the body is empty (an attribute + CSS ::after, never text); the first keystroke into the body hides it.
  prompt?: string;
  onCommit: (text: string) => void;
  onClose: () => void;
  // ITEM 207 - the card's own face/size and the one funnel that writes them (BoardEditor.commitType).
  fontFace?: StoredFace;
  fontSize?: number;
  onType: (patch: { fontFace?: StoredFace; fontSize?: number }) => void;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const elRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef(initialText);
  const { t: lex } = useLexicon();
  // ITEM 83 M9 — the desk lexicon, for the dock's own strings (§1.4: every
  // user-facing string is themable, never a literal in JSX).
  const { t: dt } = useDeskLexicon();
  // ITEM 159 — THE STYLING DOCK STARTS CLOSED, like the Page's and the Board's.
  // Nick: "The styling tab starts open when a card is opened -- it should be
  // closed by default just like on the Page and Board."
  //
  // It had no open state AT ALL: the dock was always rendered, so there was no
  // flag to flip — the closed state had to be built. `Sliver` is the pattern
  // being matched, and it is `useState(false)` behind a grip; this is the same
  // shape at card scale, not a second mechanism.
  //
  // Declared HERE, with the other hooks, and not beside the dock markup it
  // serves — item 133's lesson, written into the code that learned it: state
  // belongs with the HOOKS, because proximity to its own feature is the pull
  // that puts it below an early return.
  const [dockOpen, setDockOpen] = useState(false);
  // FONT-SPAN: whether words are highlighted in the card, and their face - the dock's Typeface scopes and brass read it. Declared
  // with the hooks (item 133's lesson, above).
  const [fontSel, setFontSel] = useState<{ has: boolean; face: string | null | 'mixed' }>({ has: false, face: null });
  useEffect(() => {
    const onSel = () => {
      const el = elRef.current;
      if (!el) return;
      const fs = window.getSelection();
      const ranged = !!fs && fs.rangeCount > 0 && !fs.isCollapsed && !!fs.anchorNode && !!fs.focusNode && el.contains(fs.anchorNode) && el.contains(fs.focusNode);
      const fo = ranged ? getSelectionOffsets(el) : null;
      const cur = textRef.current;
      const lo = fo ? Math.min(fo.start, fo.end, cur.length) : 0;
      const hi = fo ? Math.min(Math.max(fo.start, fo.end), cur.length) : 0;
      const next = fo && hi > lo ? { has: true, face: fontFaceAt(cur, lo, hi) } : { has: false, face: null };
      setFontSel((prev) => (prev.has === next.has && prev.face === next.face ? prev : next));
    };
    document.addEventListener('selectionchange', onSel);
    return () => document.removeEventListener('selectionchange', onSel);
  }, []);
  // FX6 S1 — the real undo/redo stack (store/textUndo.ts's own header
  // comment carries the full mechanism-choice + coalescing-granularity +
  // em-dash-shim-fold reasoning, shared verbatim with ForwardOnlyEditor.
  // tsx's own drafting branch — not repeated here). A plain ref (not the
  // module's registry) since applyBoardFormat below lives in this SAME
  // component, unlike PageEditor.tsx's applyRailFormat which needed the
  // registry to reach across a component boundary.
  const undoStackRef = useRef<TextUndoStack | null>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    // W3 - the placeholder is an attribute pair read by CSS (.board-popup-editor[data-prompt][data-body-empty]::after): the question, and whether the body is empty right now.
    const syncPrompt = (plain: string) => {
      if (!prompt) return;
      el.setAttribute('data-prompt', prompt);
      el.setAttribute('data-body-empty', bodyIsEmpty(plain) ? 'true' : 'false');
    };
    syncPrompt(initialText);
    decorateEditorFor(el, initialText, initialText.length, setCaretOffset, text => decorateMarkdownForCard(text, initialText.length));
    if (!inline || autoFocus) el.focus();   // the Walk asks for it (autoFocus): the caret lands in the card on opening and on every step (Nick, Oct 25)

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
    // FX6 S1 — the real, walkable undo/redo stack (store/textUndo.ts's own
    // header comment carries the full mechanism-choice + coalescing-
    // granularity + em-dash-shim-fold reasoning, the SAME shape
    // ForwardOnlyEditor.tsx's drafting branch uses — not repeated here).
    const undoStack = createTextUndoStack({ text: initialText, caret: initialText.length });
    undoStackRef.current = undoStack;
    // Classified at beforeinput (before the DOM mutates — the SAME
    // discipline `justTypedSpace` above already uses), consumed by the
    // very next onInput call it precedes.
    let pendingKind: EditKind = 'atomic';
    const redecorate = (plain: string, caret: number | null) => {
      decorateEditorFor(el, plain, caret, setCaretOffset, text => decorateMarkdownForCard(text, caret));
      // ITEM 211 - the caret lands on the visible side of a hidden mark (store/hiddenMarksDom.ts), as on the page
      if (caret !== null) placeCaret(el, caret);
    };
    const commit = (plain: string) => { textRef.current = plain; syncPrompt(plain); onCommit(plain); };
    // ITEM 211, THE CARD PORT - the page's editing rules for marks that never show, from the ONE controller the page uses
    // (store/hiddenMarksEditing.ts): edits rebuilt so no lone mark survives, Enter computed, arrows over visible characters,
    // Backspace and Delete that never take a lone hidden mark, and the caret snap (a click keeps the side of a run's closing marks).
    const plainNow = () => readEditorPlainText(el.innerText, null).plain;
    const marks = attachHiddenMarkEditing({
      el,
      plainNow,
      busy: () => composing || applyingEmDash,
      commit: (r, kind) => {
        undoStack.record({ text: r.text, caret: r.caret }, kind);
        commit(r.text);
        redecorate(r.text, r.caret);
      },
    });

    const onInput = () => {
      if (applyingEmDash) return;
      let kind = pendingKind;
      let { plain, caret } = readEditorPlainText(el.innerText, getCaretOffset(el));
      if (!composing) {
        const wasRange = marks.pendingWasRange();
        const r = marks.repairInput(plain);
        if (r) { plain = r.text; caret = r.caret; redecorate(plain, caret); }
        if (wasRange) kind = 'atomic';
      }
      commit(plain);
      if (composing) return; // FX6 S1 — composed text records as ONE atomic step, at compositionend below
      const trigger = justTypedSpace ? findEmDashTrigger(plain, caret) : null;
      justTypedSpace = false;
      if (trigger) {
        applyingEmDash = true;
        const { applied } = applyEmDash(el, trigger.start, trigger.end);
        applyingEmDash = false;
        if (applied) {
          // FX6 S1 — the em-dash shim, folded into the real stack: see
          // ForwardOnlyEditor.tsx's own onInput comment for the full
          // "boundary then atomic, why two record() calls" reasoning — the
          // SAME two-step shape, verbatim.
          undoStack.record({ text: plain, caret }, 'boundary');
          const after = readEditorPlainText(el.innerText, getCaretOffset(el));
          commit(after.plain);
          // FX5 S7 — see ForwardOnlyEditor.tsx's own onInput comment: the
          // post-execCommand DOM caret lands short of where the writer's
          // own typing actually was (right after the em dash, before the
          // untouched trailing space and anything typed past it) — the
          // ORIGINAL caret shifted left by (hyphen count - 1) is always
          // correct, computed directly rather than trusted from the DOM.
          const afterCaret = caret - (trigger.end - trigger.start) + 1;
          undoStack.record({ text: after.plain, caret: afterCaret }, 'atomic');
          redecorate(after.plain, afterCaret);
          return;
        }
      }
      undoStack.record({ text: plain, caret }, kind);
      redecorate(plain, caret);
    };
    // FX6 S1 — the real undo/redo keybindings, the SAME contract
    // ForwardOnlyEditor.tsx's own onUndoRedoKeyDraft uses (see that file's
    // own comment — not repeated here).
    // WRITING-SURFACE S0 STEP 2 - Ctrl/Cmd+B/I/U on the card, the same map and the same formatter as the dock's buttons.
    const onFormatKey = (e: KeyboardEvent) => {
      const action = formatShortcutAction(e);
      if (!action) return;
      e.preventDefault();
      applyBoardFormatRef.current(action);
    };
    const onUndoRedoKey = (e: KeyboardEvent) => {
      if (e.isComposing) return;
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const key = e.key.toLowerCase();
      const wantsUndo = key === 'z' && !e.shiftKey;
      const wantsRedo = (key === 'z' && e.shiftKey) || key === 'y';
      if (!wantsUndo && !wantsRedo) return;
      e.preventDefault();
      const snap = wantsUndo ? undoStack.undo() : undoStack.redo();
      if (!snap) return;
      marks.reset();
      commit(snap.text);
      redecorate(snap.text, snap.caret);
    };
    // AB2's own proven fix for the Chromium trailing-newline-at-EOF caret
    // quirk (draftDecoration.ts's own header comment) — a literal Text-node
    // insertion via the Range API, not execCommand, which splits into a
    // <div> instead of inserting '\n'. Reused verbatim (ForwardOnlyEditor.
    // tsx's own onKeyDownDraft), adapted to this popup's own commit/
    // redecorate closures.
    const onKeyDown = (e: KeyboardEvent) => {
      // ITEM 211 - Enter is computed (store/hiddenMarks.ts enterAt): a run the caret is inside closes before the newline and opens
      // again after it, so neither line is left with one unpaired, visible mark. Recorded as a 'boundary' step (FX6 S1).
      marks.enter(e);
    };
    const onMarkKey = (e: KeyboardEvent) => { marks.markKey(e); };
    // TYPED-LITERAL: a composition's committed text is typed text too - captured at its start, escaped at its end
    const onCompStart = () => { marks.reset(); marks.noteComposition(); composing = true; };
    const onCompEnd = () => {
      composing = false;
      let { plain, caret } = readEditorPlainText(el.innerText, getCaretOffset(el));
      const lit = marks.repairInput(plain);
      if (lit) { plain = lit.text; caret = lit.caret; }
      // FX6 S1 — an IME-composed insertion is one atomic undo step (no
      // per-candidate-update recording happens above — onInput returns
      // early while `composing` is true).
      undoStack.record({ text: plain, caret }, 'atomic');
      commit(plain);
      redecorate(plain, caret);
    };
    const onBeforeInput = (e: InputEvent) => {
      const it = e.inputType || '';
      // FX5 S7 — captured before the DOM mutates, same discipline as
      // ForwardOnlyEditor.tsx's own onBeforeInputDraft: only a genuinely
      // just-typed space arms the em-dash trigger check in onInput.
      justTypedSpace = it === 'insertText' && e.data === ' ';
      // FX6 S1 — classify the upcoming edit for the undo stack (store/
      // textUndo.ts's own classifyEditKind — shared with ForwardOnlyEditor.
      // tsx so the two surfaces can't drift).
      pendingKind = classifyEditKind(it, e.data ?? null);
      marks.beforeInput(e);
      if (it === 'insertFromPaste' || it === 'insertFromDrop') {
        if (shadowAllows(extractIncomingText(e))) return; // own ink: native paste proceeds
        e.preventDefault();
        notePasteBlocked();
      }
    };
    const blockForeign = (e: Event) => {
      // IN-APP-COPY-FORMAT: own ink passes the wall; Wrizo's own markup is then pasted when its envelope can be trusted
      if (shadowAllows(extractIncomingText(e))) { if (e.type === 'paste') marks.paste(e as ClipboardEvent); return; }
      e.preventDefault();
      notePasteBlocked();
    };
    // REVEAL-ON-CLICK — this REPLACES the pair FX5 S6 built here (a keyup
    // against a NAV_KEYS list, plus a mouseup). FX5's diagnosis was right and
    // is preserved in revealAtCaret's own comment: a pure caret move fires no
    // 'input', so the reveal would otherwise show the PREVIOUS caret's
    // markers. What changes is the signal and the guards.
    //
    // THE SIGNAL: enumerating the paths that move a caret means the state
    // goes stale after whichever path nobody listed, and the list here was
    // already incomplete (Tab, PageUp/PageDown, a programmatic move, a
    // click-drag that ends outside the element). `selectionchange` fires for
    // all of them. Item 122 had already made this exact argument for Draft's
    // B/I/U button state; the decoration is the same problem.
    //
    // THE GUARDS, and why this is a fix and not just a swap: the old pair
    // redecorated UNCONDITIONALLY, and a redecorate restores a COLLAPSED
    // caret. So a mouseup ending a drag-selection collapsed that selection,
    // and shift+arrow could not extend one. revealAtCaret declines on a
    // non-collapsed selection, so selecting text on a card works.
    const onSelectionReveal = () => {
      if (composing || applyingEmDash) return;
      marks.selectionChange();
      revealAtCaret(el, getCaretOffset, setCaretOffset);
    };
    el.addEventListener('input', onInput);
    el.addEventListener('keydown', onKeyDown);
    el.addEventListener('keydown', onMarkKey);
    el.addEventListener('keydown', onUndoRedoKey);
    el.addEventListener('keydown', onFormatKey);
    document.addEventListener('selectionchange', onSelectionReveal);
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
      el.removeEventListener('keydown', onMarkKey);
      el.removeEventListener('keydown', onUndoRedoKey);
      marks.detach();
      el.removeEventListener('keydown', onFormatKey);
      document.removeEventListener('selectionchange', onSelectionReveal);
      el.removeEventListener('compositionstart', onCompStart);
      el.removeEventListener('compositionend', onCompEnd);
      el.removeEventListener('beforeinput', onBeforeInput as EventListener);
      el.removeEventListener('paste', blockForeign);
      el.removeEventListener('drop', blockForeign);
      undoStackRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // hb1.1's own focus-trap pattern (UnlockCeremony.tsx), reused verbatim:
  // Tab wraps within this dialog's own focusable elements while it's open.
  useEffect(() => {
    if (inline) return;   // W1: the Walk owns Esc and focus; there is no dialog to trap or close
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

  const applyBoardFormatRef = useRef<(action: FormatAction) => void>(() => {});
  const applyBoardFormat = (action: FormatAction) => {
    const el = elRef.current;
    if (!el) return;
    el.focus();
    const sel = getSelectionOffsets(el) ?? { start: textRef.current.length, end: textRef.current.length };
    const result = applyFormat(textRef.current, sel.start, sel.end, action);
    // A pending mark (an empty italic cannot be stored as `**`): nothing is written; the editor wraps the next text typed here.
    if (result.pending) { hiddenMarkEditingFor(el)?.setPending(result.pending, result.start); return; }
    // card-held-italic: a style pressed off at its run's end - nothing is written; what is typed next lands outside the run
    if (result.exitPending) { hiddenMarkEditingFor(el)?.setPendingExit(result.exitPending, result.start); return; }
    // FX6 S1 — a Bold/Italic toolbar click is a genuine edit that bypasses
    // the contenteditable's own input events entirely — record its own
    // atomic step (see ForwardOnlyEditor.tsx's applyRailFormat/PageEditor.
    // tsx for the SAME reasoning) or the click would be invisible to undo.
    undoStackRef.current?.record({ text: result.text, caret: result.start }, 'atomic');
    textRef.current = result.text;
    onCommit(result.text);
    const collapsed = result.end <= result.start;
    decorateEditorFor(el, result.text, result.start, setCaretOffset, text => decorateMarkdownForCard(text, collapsed ? result.start : null));
    if (!collapsed) setSelectionOffsets(el, result.start, result.end);
  };

  applyBoardFormatRef.current = applyBoardFormat;

  // FONT-SPAN (docs/font-span-plan.md; the approved mockup's card scene): a face for the HIGHLIGHTED words of this card only - the
  // dock's own road, as applyBoardFormat: one atomic undo step, the card's text committed, the highlight left on the same words.
  const applyBoardFont = (slug: string | null) => {
    const el = elRef.current;
    if (!el) return;
    el.focus();
    const sel = getSelectionOffsets(el);
    if (!sel || sel.start === sel.end) return;
    const cur = textRef.current;
    const result = applyFontPick(cur, Math.min(sel.start, cur.length), Math.min(sel.end, cur.length), slug);
    if (result.text !== cur) {
      undoStackRef.current?.record({ text: result.text, caret: result.start }, 'atomic');
      textRef.current = result.text;
      onCommit(result.text);
      decorateEditorFor(el, result.text, result.start, setCaretOffset, text => decorateMarkdownForCard(text, null));
    }
    setSelectionOffsets(el, result.start, result.end);
    setFontSel({ has: true, face: fontFaceAt(result.text, result.start, result.end) });
  };
  // FONT-SPAN: the Whole card pick - every word takes the card's new face, so the card's spans go (one undo step), then the face.
  const pickWholeCardFace = (face: StoredFace | undefined) => {   // undefined = "Default" (TOOLS #10 item 10): the card's face is cleared (fontFace absent = the theme's default)
    const el = elRef.current;
    const cur = textRef.current;
    const next = clearFontSpans(cur);
    if (el && next !== cur) {
      const caret = Math.min(getCaretOffset(el) ?? next.length, next.length);
      undoStackRef.current?.record({ text: next, caret }, 'atomic');
      textRef.current = next;
      onCommit(next);
      decorateEditorFor(el, next, caret, setCaretOffset, text => decorateMarkdownForCard(text, null));
    }
    onType({ fontFace: face });
  };

  // card-close-x (Fable, 2026-10-13): "While a pop-up is open, nothing behind it should be clickable." The backdrop is fixed at
  // z-index 210, but it rendered INSIDE `.desk-frame-stage`, whose `isolation:isolate` (FX4 S2) makes it a stacking context - so 210
  // only ranked within the stage, and the fixed rail (`.desk-frame-strip`, z-index 1 in the ROOT context) painted over the whole
  // stage, backdrop included: an outside click landed on the rail's own buttons (chat 1's run: elementFromPoint -> wz-strip, which
  // holds "Remove"). Portalled to <body>, the backdrop ranks in the root context, above the rail and the page's chrome (toasts and the stale-client banner
  // still sit above it, as they should). Nothing in this
  // component reads its DOM ancestors, its colours are :root tokens, and React events still bubble through the component tree.
  if (inline) {
    return (
      <div
        ref={elRef}
        className="board-popup-editor"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={`${lex('board')} text box`}
        style={cardTypeStyle(fontFace, fontSize)}
      />
    );
  }
  return createPortal(
    <div className="board-popup-backdrop" role="presentation" onClick={onClose}>
      <div
        ref={dialogRef}
        className="board-popup"
        role="dialog"
        aria-modal="true"
        aria-label={`Edit ${lex('board').toLowerCase()} card`}
        onClick={e => e.stopPropagation()}
      >
        {/* ITEM 83 M9 (R13.v/R14) — THE OPENED CARD'S TOOLS DOCK.
            The card is the paper here, so the dock is a CHILD OF THE CARD at
            `right:100%` — its right edge IS the card's left edge, by layout,
            at every size. Same anchor law as the page's Tools drawer; nothing
            is scripted, so nothing can drift.
            R14, verbatim: "the opened card's side menu is centered to the
            card's size, whatever it is, and may extend vertically beyond the
            card's height when its options need the room — the dock is the
            card's companion, not its prisoner." So: translateY(-50%) centring,
            and no height tie to the card.
            CONTENTS: styling only. NO FOOT — R14 keeps Typewriter/Progress/
            Full Screen on page-writing surfaces, and a card is not one.
            Links/tags are F10's default (IN) but need a data model no ticket
            in this brief creates, so they are deferred by §0 rather than
            faked; nothing renders for them. */}
        {/* ITEM 159 — THE GRIP. `onMouseDown` is prevented for the same reason
            the dock's own is: a card's Bold acts on the EDITOR's selection, and
            a mousedown that moved focus would collapse the very selection the
            next click is about to style. */}
        <button
          type="button"
          className="board-popup-dock-grip"
          aria-label={dockOpen ? dt('stylingClose') : dt('stylingOpen')}
          title={dockOpen ? dt('stylingClose') : dt('stylingOpen')}
          aria-expanded={dockOpen}
          onMouseDown={e => e.preventDefault()}
          onClick={() => setDockOpen(o => !o)}
        >
          <span className="board-popup-dock-grip-glyph" aria-hidden="true">{dockOpen ? '\u203a' : '\u2039'}</span>
        </button>
        {dockOpen && (
        <div className="board-popup-dock" onMouseDown={e => e.preventDefault()}>
          <div className="board-popup-dock-h">{dt('stylingHeading')}</div>
          <button type="button" className="mode-tbtn board-popup-tool" title={dt('stylingBold')} onClick={() => applyBoardFormat('bold')}><b>B</b></button>
          <button type="button" className="mode-tbtn board-popup-tool" title={dt('stylingItalic')} onClick={() => applyBoardFormat('italic')}><i>I</i></button>
          <button type="button" className="mode-tbtn board-popup-tool" title={dt('stylingUnderline')} onClick={() => applyBoardFormat('underline')}><u>U</u></button>
          {/* ITEM 207 - the card's face and size: the smallest form (-/+, no number, no heading). FONT-SPAN: the face is chosen through
              the two scopes - Selection / Whole card - over the roster as a list (the approved mockup's card scene). */}
          <TypeControl form="small" face={fontFace} size={fontSize ?? SIZE_DEFAULT} onPickFace={pickWholeCardFace} onSize={size => onType({ fontSize: size })}
            scope={{ has: fontSel.has, face: fontSel.face, wholeLabel: dt('typeScopeWholeCard'), onPickSelection: applyBoardFont }} />
        </div>
        )}
        <div className="board-popup-strip">
          <span className="eyebrow board-popup-eyebrow">Card</span>
          {/* card-close-x (Nick's live test, 2026-10-13) - the pop-up closes from an X in its
              top-right corner (the strip's right end; the eyebrow's margin-right:auto puts it
              there). It replaces the foot's "Close" button and keeps that button's class,
              board-popup-done, so every driver that closes a card still finds it. Esc and the
              backdrop click are unchanged. */}
          <button type="button" className="board-popup-close board-popup-done" aria-label={dt('boardPopupClose')} title={dt('boardPopupClose')} onClick={onClose}>
            <span aria-hidden="true">{'\u00d7'}</span>
          </button>
        </div>
        <div
          ref={elRef}
          className="board-popup-editor"
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label={`${lex('board')} text box`}
          style={cardTypeStyle(fontFace, fontSize)}
        />
        {/* CD4.1's foot "Close" button retired by card-close-x: the X in the strip above
            is the close control now (it carries the class board-popup-done). */}
      </div>
    </div>,
    document.body,
  );
}

type LastAction = { type: 'move' | 'resize' | 'remove' | 'ungroup'; before: Box[] } | null;

export function BoardEditor({ id }: { id: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useDeskLexicon();
  // B1 — a genuine defect found live while repairing this ticket's own
  // harness suite (j5.mjs): JournalEntry.tsx's single-page "Add to…" MOVES
  // verb carries its one-shot confirmation as router history state
  // (`{ actionToast }`) targeting '/journal', consumed by whichever
  // component mounts there next. Journal.tsx used to read it (its own
  // now-deleted effect); the Board never did — App.tsx's JournalBoardGate
  // now passes the state through the bridge, and this is the ONE-SHOT
  // consume-and-replace pattern Journal.tsx's own retired effect used,
  // reproduced verbatim (toast.show, then replace history so a later
  // back/refresh never re-shows it).
  const actionToast = useActionToast();
  useEffect(() => {
    const state = location.state as { actionToast?: string } | null;
    if (state?.actionToast) {
      actionToast.show(state.actionToast);
      navigate(location.pathname + location.search, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const initialEntry = getJournalEntry(id);
  // B1 S1/S3 — a plain, cheap, per-render check (persistence.ts's own
  // getSystemKind): every system-board guard in this component (S2's
  // reconcile effect, S3's arrange-never-author restrictions, S4's Restore
  // row) branches on this ONE value. A genuinely ordinary Board's own
  // behavior is untouched by every one of those branches (S3's own "User
  // Boards are untouched by this slice" law).
  const systemKind = getSystemKind(initialEntry);
  const isSystemBoard = !!systemKind;
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

  // PB1 (item 71) — non-null only while this board has no row yet. "A board is
  // born when it has a box": the two untitled create-board doors now open an
  // unborn surface, and the FIRST BOX writes the row. A titled board never
  // arrives here unborn — a name is content (ruling 3), so it is born at once.
  const unborn = useUnborn(id);
  const unbornRef = useRef(unborn);
  unbornRef.current = unborn;

  // W2 — route + mount identity only (S1: a Board's own view state — pan,
  // zoom, selection — already persists through its own store; no scroll/
  // caret to capture here).
  // B1 — a system Board doesn't participate in the way-back mechanism at
  // all (useWayBack.ts's own header comment carries the full race
  // diagnosis: the Journal Board sitting between a departure and the
  // writer's chip-click return would otherwise clobber the very
  // information that return needed, the moment its own arrival became
  // chip-visible). An ordinary Board's own behavior is untouched.
  // PAGE -> PLAN -> BACK (live bug, Oct 13): a page's PLAN board sits BETWEEN the page's departure and the writer's return, exactly as the Journal Board once did (B1 above) -
  // and an ordinary board that participates CAPTURES ON UNMOUNT, so leaving the Plan overwrote the one-slot store (which held the PAGE's scroll and caret) with the
  // BOARD's own entry. The page then mounted, found a slot naming someone else, and restored nothing: the writer landed at the top. A board that is a page's paired
  // Plan face takes no part in the way-back at all (the slot keeps the PAGE's own departure), decided ONCE per mount so a later unpairing cannot fire a stray capture.
  const [participatesInWayBack] = useState(() => !isSystemBoard && !getPairedPageId(id));
  // W2 - THE WALK'S CARET: a card written in the Walk is a writing surface, so "Write this" (and any departure from the Walk) keeps the caret in the card for the way back. Only while the Walk's card editor is mounted; every other board
  // view still hands this hook neither element nor offset, as before. The step itself and the view are the Deck's own device-local memory (setWalkPos, boardMode).
  const walkEditor = () => document.querySelector<HTMLElement>('.walk-card .board-popup-editor');
  useWayBack({ entryId: id, participatesInWayBack, editorEl: walkEditor, applyCaret: offset => { const el = walkEditor(); if (el) setCaretOffset(el, offset); } });

  // BM1 S3/S8 — the board's own mode, persisted per board (client-local, zero
  // schema, the FX9 family). A system Board is never a projection surface —
  // its cards are DERIVED, not a writer's plan — so it stays forced OPEN and
  // never shows the mode bar (keeping every system-board harness byte-identical,
  // and the bar's PAGE → door meaningless there). The flip preserves this: the
  // mode is read back from the store on every mount, so a round trip lands on
  // the same face (S8's "mode survives a round trip").

  const [boxes, setBoxes] = useState<Box[]>(() => liveBoxes(initialEntry?.boxes));
  // W1 (the Walk, board kinds and "Show as"; store/boardKind.ts): the board's KIND and HOME VIEW are read from its own board-meta (`boxes`, so a Preset-born deal that has not been saved yet already reads as a Deck). The view SHOWN is the
  // device-local "last shown as", else the home view, else Open - and only ever one of the views this kind OFFERS (a Board: Open / Storyboard / Outline / Walk; a Book - the Journal: Flip / Thumbnails; a Deck on a narrow screen: only the Walk;
  // Trash and the Shelf: Open, no choice). Switching a view writes nothing to the board.
  const theme = useTheme();
  const boardKind = kindOf({ boxes });
  const homeView = homeViewOf({ boxes });
  const narrowBoard = !framed;
  const deckBoard = isDeck({ boxes });
  const [boardModeRaw, setBoardModeRaw] = useBoardMode(id, homeView);
  const offeredViews: BoardView[] = isSystemBoard && boardKind !== 'book' ? ['open'] : viewsFor(boardKind, narrowBoard, deckBoard);
  const boardMode: BoardView = offeredViews.includes(boardModeRaw) ? boardModeRaw : offeredViews.includes(homeView) ? homeView : offeredViews[0];
  const setBoardMode = (m: BoardView) => setBoardModeRaw(m, boardMode);
  // a card added in the Walk: the Walk lands on it
  const [placeFor, setPlaceFor] = useState<{ box: Box; el: HTMLElement } | null>(null);   // W2 "Place a page...": the card and the door it was pressed on (the picker anchors under it)
  const [, setPlacedTick] = useState(0);   // a page was placed: the rail's leaf for the card is read again
  const [walkJumpId, setWalkJumpId] = useState<string | null>(null);   // LIVE boxes only: a deleted card is a tombstone in storage, carried through every save by saveBoardBoxes
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // FX4 S5 — the card popup (inline contenteditable editing RETIRES whole):
  // the id of the text card currently open in BoardCardPopup, or null. The
  // board itself blurs+dims behind it (the mockup's own treatment) while
  // open.
  const [popupBoxId, setPopupBoxId] = useState<string | null>(null);
  // B3 S3 — door 2: the Board's own Add flow gains "From a deck…" beside
  // its existing options. `deckWizardOpen` mounts DeckWizard.tsx (opt-in,
  // ONLY on this click — the anti-solicitation law S1 binds); the wizard's
  // own last act (onDeal) materializes the chosen deck's cards PURELY
  // in-memory (materializeDeck, decks/engine.ts) against this component's
  // own live `boxes` (boxesRef.current, not a fresh store read) and appends
  // them via the SAME setBoxes path any other card creation already uses —
  // BoardEditor's own existing debounced autosave effect persists them,
  // exactly like onAddCard above. A direct saveBoardBoxes call here instead
  // would race that same debounced autosave (the harness seeding/flushNow
  // race this project has already diagnosed once, generalized) — see
  // decks/engine.ts's own header comment for the full reasoning.
  const [deckWizardOpen, setDeckWizardOpen] = useState(() => !!unborn?.descriptor.deck);
  // W3 - From my pages' picker reads the writer's CURRENT PLACE (the Drawer she is in, or the Journal), so it works on a board that does not exist yet; the cards it deals are grafted once the board's row does
  // (a graft needs the row: an unborn board is born by its first box, in the effect below the autosave).
  const place = usePlace();
  const pendingGraftsRef = useRef<{ boxId: string; entryId: string }[]>([]);
  // BIG PROJECTS step 2 - a PRESET on the Boards tab opens a new board with its deck's wizard already running: the deck id rides the address (descriptor.deck), is read once while
  // the board is unborn, and is dropped when the wizard closes (so a later Templates press opens the library as it always did).
  const [startDeckId, setStartDeckId] = useState<string | null>(() => unborn?.descriptor.deck ?? null);
  // W4 - the librarian's pre-answered deal questions ride the address with the deck id (store/unbornPage.ts deckAnswers)
  const [startAnswers] = useState(() => decodeDeckAnswers(unborn?.descriptor.deckAnswers ?? null));
  // TOOLS #9 - Q3's landing for the librarian's pick: from the address (a pick made in the Boards pop-out) or told by the wizard's own "Begin" (a pick made inside it). Applied ONCE, by the deal that follows;
  // dropped when the wizard closes. `walkHelpId` is the one-shot for "a little": the first dealt card whose "?" the Walk opens once, then forgets (nothing stored).
  const landingRef = useRef<HelpLanding | null>(unborn?.descriptor.landing ?? null);
  const [walkHelpId, setWalkHelpId] = useState<string | null>(null);
  // B3 S1 — the "Start Here" hint's own id (store/deckHint.ts, keyed per
  // board, never schema). Read fresh on every mount of THIS board (the
  // lazy initializer re-runs whenever `id` changes — PageEditor.tsx's own
  // delegation already keys BoardEditor by id, so navigating to a
  // DIFFERENT board is a genuine remount, not a stale carry-over).
  const [startHereCardId, setStartHereCardId] = useState<string | null>(() => getStartHereCardId(id));
  // W5 (gaps, rewards, Lit) - ONLY on a Deck. The Deck's steps are the Walk's order; `kindled()` (store/guided.ts) is the single gate. The rewards hook decides and times the moments (store/deckRewards.ts);
  // Lit is the writer's own mark (`lit` on the card's box) and never counts, never completes, never celebrates.
  const deckSteps = deckBoard ? walkOrder(boxes) : [];
  const deckKindled = new Set(deckSteps.filter(b => kindled(id, b, boxes)).map(b => b.id));
  const deckLit = new Set(deckSteps.filter(b => isLit(b)).map(b => b.id));
  // a SUB-STEP (a card nested under a step by `parentId`) is walked and begun on its own, but the gaps line names MAIN steps only and a Deck completes when every main step is kindled (children never block it)
  const deckMain = deckSteps.filter(b => !b.parentId);
  const deckRewards = useDeckRewards(id, deckBoard, deckSteps.map(b => b.id), deckKindled, deckMain.map(b => b.id));
  const [walkCurId, setWalkCurId] = useState<string | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  // FX8 S3 — a small, read-only flag for the card-body cursor's own
  // `grab` -> `grabbing` swap during an actual active move-drag (CC's own
  // disclosed call, not required by the ticket — a static `grab` throughout
  // would have been acceptable too). Set true ONLY in `beginMove` below
  // (the real "past the 6px threshold, genuinely moving" phase — never
  // `pending`/`resizing`/`threadDrag`) and cleared in `finish` on every
  // gesture end (commit OR cancel alike). This does NOT touch the
  // selection/drag/threshold state machine itself — `phase` and its
  // transitions are completely unchanged; this is purely an additional,
  // read-only mirror of one of its existing transitions, the same shape
  // `threadArmedFrom` already uses to drive `data-thread-armed` in the JSX.
  const [isDragging, setIsDragging] = useState(false);
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
  // BIG PROJECTS STEP 3 (3a): connection mode entered from the graft KNOB - the knob is the origin circle, so the corner square does not morph
  const [connectFromKnob, setConnectFromKnob] = useState(false);
  // CONNECTOR-A (Nick's approved mockup v6): `threadArmedFrom` IS connection mode now - the card whose corner square was double-clicked or right-clicked. These are the rest of its
  // render state: the card the arm is over (its circle shows), and the brief flash after a link or unlink.
  const [connectTarget, setConnectTarget] = useState<string | null>(null);
  const [connectFlash, setConnectFlash] = useState<{ a: string; b: string; off: boolean; line: boolean } | null>(null);
  const connectEndRef = useRef<(() => void) | null>(null);
  const armTipRef = useRef<SVGCircleElement | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  // AB4 S2 — the Page face's sending sheets (Port, Pin) — Board never had
  // these before that ticket (S5's own "every surface carries the same
  // chrome system" closing line). B2 S4 — Move/Copy (AddToSheet, `addOpen`)
  // RETIRES here: superseded by the Places panel (PlacesPanel.tsx, mounted
  // inside CascadePanels.tsx's PagePanel), the SAME store paths, reached
  // through the Page category exactly as before.
  const [portOpen, setPortOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  // B2 S2 — the Shelf Board's own selected-card action ("Pin to a Board"):
  // the entryId of the card currently being pinned, or null. Reuses
  // PinToBoardSheet verbatim (S2's own words — "nothing new invented").
  const [shelfPinEntryId, setShelfPinEntryId] = useState<string | null>(null);
  // B2 S5 — the board-side "Existing page…" door (ExistingPagePicker.tsx).
  const [existingPageOpen, setExistingPageOpen] = useState(false);

  const boxesRef = useRef(boxes);
  // ITEM 207 - a card that wears a non-eager face fetches it when the board opens (or when a card arrives wearing one).
  const cardFaceNames = boxes.map(b => b.fontFace?.name ?? '').filter(Boolean).sort().join('|');
  useEffect(() => { cardFaceNames.split('|').forEach(n => { if (n) void ensureFaceLoaded(n); }); }, [cardFaceNames]);
  boxesRef.current = boxes;
  const selectedIdRef = useRef(selectedId);
  // Delete / Backspace on a selected card removes it (the "Remove" row is gone) - the key handler is a [] effect, so it calls the current render's removeSelected through this ref
  const removeSelectedRef = useRef<() => void>(() => {});
  const removeConnectionRef = useRef<(connId: string) => void>(() => {});
  const addConnectionRef = useRef<(a: string, b: string) => string | null>(() => null);
  // CONNECTOR-B: a thumbnail dropped on the board becomes a LINKED COPY - the pointer effect (a []-ish effect) reaches the board's state through this
  const linkedCopyRef = useRef<(entryId: string, x: number, y: number) => void>(() => {});
  const [linkTick, setLinkTick] = useState(0);
  const undoRef = useRef<() => void>(() => {});
  // the right-click menus are built from this render's state; the pointer effect (a []-ish effect) reaches them through this ref
  const ctxActionsRef = useRef<{ card: (x: number, y: number, boxId: string) => void; board: (x: number, y: number) => void }>({ card: () => {}, board: () => {} });
  selectedIdRef.current = selectedId;
  const popupBoxIdRef = useRef(popupBoxId);
  popupBoxIdRef.current = popupBoxId;
  // BOARD CLICK-TO-CREATE (Fable, Oct 14) - a click on EMPTY board space makes a card there; a click-drag sizes it first, with a ghost outline following the pointer; on release the card
  // pop-up opens, and a card made this way and closed while still empty is discarded. OPEN projection on an ordinary board only (STORYBOARD/OUTLINE have their own card doors, a system
  // board's cards are derived). These are refs because the gesture lives in the canvas's native pointer listeners (below), which must read the CURRENT answer, not a stale closure.
  const createAllowedRef = useRef(false);
  createAllowedRef.current = !isSystemBoard && boardMode === 'open';
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const freshEmptyIdsRef = useRef<Set<string>>(new Set());
  // the starters' fade (BeginningsRow): the first press anywhere on the board dismisses them; a board that gets cards and later empties again starts them fresh
  const [startersFaded, setStartersFaded] = useState(false);
  const threadArmedFromRef = useRef(threadArmedFrom);
  threadArmedFromRef.current = threadArmedFrom;
  const selectedConnectionIdRef = useRef(selectedConnectionId);
  selectedConnectionIdRef.current = selectedConnectionId;
  const lastActionRef = useRef<LastAction>(null);
  const lastSavedRef = useRef(boxes);
  const measureEls = useRef<Map<string, HTMLDivElement>>(new Map());
  // FX7 S7 — root-caused live (not guessed): the auto-grow effect below
  // (the "reflow floor" FX4 S4/FX5 S3 established — it only ever GROWS a
  // box's stored h, never shrinks it) re-runs on EVERY box change,
  // including every intermediate `setBoxes` call `onMove` (below) fires
  // WHILE a resize drag is still held. Dragging a corner handle changes
  // width AND height together, and narrowing the width can force the SAME
  // text to wrap into an extra line — which the auto-grow effect then
  // immediately measures and grows `h` right back up, mid-drag, fighting
  // the writer's own shrink in real time. Confirmed live with a genuinely
  // trusted step-by-step drag (intermediate reads, not just start/end):
  // `h` visibly reversed direction (shrank, then grew back) partway
  // through a single continuous downsize gesture on a card whose body
  // text needs more than one line at the narrower width — exactly Nick's
  // "once a card is upsized... it doesn't seem like it can be downsized."
  // This ref tracks whichever box id is ACTIVELY being resized right now
  // (set in beginResize, cleared in finish, below) so the effect can skip
  // touching it mid-drag — the writer's own pointer position is the ONLY
  // authority over w/h while a resize is held; the content-minimum floor
  // still applies (this ticket's own invariant: text is never clipped),
  // just reconciled ONCE, cleanly, the instant the drag ends, rather than
  // fighting every intermediate frame.
  const activeResizeIdRef = useRef<string | null>(null);
  // CARD-RESIZE-RELOCK (Nick, 2026-10-13: "after a card resize, an immediate second resize or a click on the corner does nothing").
  // When the last resize or move ENDED (performance.now()), so the canvas's double-click can tell a gesture's own second click from
  // a request to edit - see onDoubleClick below.
  const lastGestureEndRef = useRef(0);
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
  const pinnedBoardTitles = initialEntry ? getBoardsConnecting(initialEntry.id).map(b => b.title) : [];
  const { homeLabel: describedHomeLabel, memberships } = describePageHome(
    initialEntry ?? { id, text: '', projectId: null, createdAt: '', updatedAt: '' },
    project,
    pinnedBoardTitles,
  );
  // Independent review fix (2026-07-19) — describePageHome (pageHome.ts)
  // has never heard of origin:'system'; both system Boards fell through to
  // its generic else-branch and reported "In the Journal" as their OWN
  // home — flatly false for the Trash Board (S1: "no project home"), and
  // self-referential for the Journal Board. Overridden here, scoped to
  // system Boards only (pageHome.ts and every ordinary page's home label
  // stay byte-identical) — the SAME "told truthfully" law this function's
  // own header comment names, now honored for system Boards too.
  // B2 S1 — 'shelf' joins the systemKind->term lookup, the same 3-way shape
  // B1's own journal/trash pair already established.
  const homeLabel = systemKind
    ? t(systemKind === 'trash' ? 'boardHomeLabelTrash' : systemKind === 'shelf' ? 'boardHomeLabelShelf' : 'boardHomeLabelJournal')
    : describedHomeLabel;
  // B1 S3 — a system Board's own home/membership is never alterable via the
  // Page face's generic sending grammar: filing it into a project would
  // break S1's own "no project home" invariant; Pin is explicitly named
  // forbidden by the brief ("may NOT ... pin the system Board anywhere").
  // Pin stays an inert no-op here — the SAME "present but does nothing"
  // treatment S3 already gives hand-delete on a derived card, applied
  // consistently to the board's own Page face rather than hidden
  // (PageFace.tsx itself stays completely unchanged, shared by every
  // surface). Move/Copy retired whole (B2 S4 — superseded by the Places
  // panel, which is a Page-category concern, not a per-host one — nothing
  // to guard here anymore). Port to a Board is left untouched: it only
  // ever COPIES text elsewhere, never touches this board's own home, so
  // nothing to guard.
  const pageFaceSubject: PageFaceSubject = {
    kind: 'page',
    entry: initialEntry ?? { id, text: '', projectId: null, createdAt: '', updatedAt: '' },
    homeLabel,
    memberships,
    onToggleStar: toggleStar,
    onAddTag: addTag,
    onRemoveTag: removeTag,
    onOpenPortToBoard: () => setPortOpen(true),
    onOpenPin: isSystemBoard ? () => {} : () => setPinOpen(true),
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
  }, [boardMode === 'open']);   // W1: the wrap exists only while the board is shown Open - a board that mounts in the Walk (a Deck) or was shown another way must measure when Open arrives (it came back 700 px wide and never re-measured)
  // FX13 S2 (the board fits the room) — the WRAP's height is the DeskFrame
  // stage's ACTUAL available height, not a magic viewport ratio. The old
  // `maxHeight: 78vh` was the width-only-geometry law showing through: a fixed
  // fraction of the viewport that ignored the room the flex stage
  // (`.desk-frame-stage`, `flex:1; min-height:0`) actually leaves after the
  // board's own chrome, so on a short viewport (the 1366x768 leg) the wrap
  // overflowed the stage (measured: wrap bottom past the stage bottom below
  // ~700px) and left a page overflow at 768. Filling to the stage's own bottom
  // keeps every piece of the board's chrome in the room and reserves scrolling
  // for the CONTENT (the canvas) alone — the height floor the law was missing.
  // Legacy (<1100, no DeskFrame): stage is null, the 78vh fallback is kept, so
  // that path stays byte-identical.
  const [availHeightPx, setAvailHeightPx] = useState<number | null>(null);
  const lastAvailRef = useRef<number | null>(null);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const stage = el.closest('.desk-frame-stage');
    if (!stage) { setAvailHeightPx(null); return; }
    let raf = 0;
    const apply = () => {
      raf = 0;
      // Never collapse: a very short viewport gets a small wrap that scrolls its
      // content, never a fall-back to the width-only 78vh.
      const avail = Math.max(160, Math.round(stage.getBoundingClientRect().bottom - el.getBoundingClientRect().top - 2));
      // THRASH GUARD (the deskFrameActive race lineage): the ResizeObserver
      // watches the STAGE, never the wrap, and the stage is `flex:1;
      // min-height:0` — its height is fixed by the flex column, NOT by the
      // wrap's content — so the wrap's own height can never feed back into it.
      // Committing only when the room actually MOVED (>1px) makes a feedback
      // loop impossible by construction (once stable, setState never fires
      // again) and swallows sub-pixel jitter from a mid-transition measure.
      if (lastAvailRef.current === null || Math.abs(avail - lastAvailRef.current) > 1) {
        lastAvailRef.current = avail;
        setAvailHeightPx(avail);
      }
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(apply); };
    apply(); // initial synchronous measure (post-layout, in an effect)
    const ro = new ResizeObserver(schedule);
    ro.observe(stage);
    window.addEventListener('resize', schedule);
    return () => { if (raf) cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener('resize', schedule); };
  }, [boardMode === 'open']);   // W1: as the width measure above - re-attach when the wrap (re)mounts
  // FX4 S4 — the effective page width every normalized box coordinate
  // converts against: the persisted override once the writer has dragged
  // the canvas wider/narrower, else the wrap's own natural (auto-fit)
  // width — byte-identical to pre-FX4 in the untouched case.
  const pageWidthPx = canvasOverrideW != null ? Math.max(canvasOverrideW, CANVAS_MIN_W) : containerWidthPx;

  // B1 S2 — the reconcile. Runs once on mount (a system Board may have
  // qualifying pages the writer hasn't visited it since) and again on every
  // subsequent store change while mounted (persistence.ts's own subscribe —
  // the SAME notify() every write in the app already fires), so a capture
  // or a delete happening ANYWHERE reaches whichever system Board is
  // currently open without the writer lifting a finger. Applies directly
  // (saveBoardBoxes + setBoxes + lastSavedRef, mirroring undo()'s own
  // apply-and-mark-saved shape above) rather than going through the
  // debounced autosave effect below — a reconciled card set is not an
  // in-flight edit to coalesce, it's a fact that just became true.
  // Idempotent by construction (reconcileSystemBoard returns null when
  // nothing changed), so the notify() this effect's OWN save fires back
  // into itself resolves to a single further no-op check, not a loop.
  // Completely inert for an ordinary Board (`systemKind` falsy) — S3's own
  // "User Boards are untouched by this slice" law, held by one early return.
  useEffect(() => {
    if (!systemKind) return;
    const runReconcile = () => {
      const reconciled = reconcileSystemBoard(id);
      if (reconciled === null) return;
      saveBoardBoxes(id, reconciled);
      setBoxes(reconciled);
      lastSavedRef.current = reconciled;
    };
    runReconcile();
    return subscribe(runReconcile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, systemKind]);

  // Autosave — debounced, like PageEditor's text; flush on hide/unmount.
  // PB1 — on an UNBORN board the first box births the row synchronously,
  // carrying the boxes with it, instead of waiting for this debounce: the
  // board's content must reach disk on exactly the schedule it always did, and
  // a debounced birth would open a window in which the writer's first card
  // existed only in memory. Once born, `unbornRef` nulls itself and the
  // ordinary debounce below resumes for every later change.
  useEffect(() => {
    if (boxes === lastSavedRef.current) return;
    if (unbornRef.current) {
      if (boxes.length === 0) return; // still nothing in the room
      lastSavedRef.current = boxes;
      unbornRef.current.birthWith({ boxes });
      return;
    }
    const h = setTimeout(() => { saveBoardBoxes(id, boxesRef.current); lastSavedRef.current = boxesRef.current; }, AUTOSAVE_MS);
    return () => clearTimeout(h);
  }, [boxes, id]);

  // W3 - FROM MY PAGES: the dealt cards are GRAFTED to their pages through the ordinary Grafts path (store/grafts.ts graftTo) - but only once the cards are on a board whose ROW exists: an unborn board is born by
  // its first box (the effect above), and a graft is a record owned by the board's row, so it is made on the render after the birth. A page already pinned on this board comes back as a connection,
  // which is a box in this same array. Nothing is queued for any other deck. The pages themselves are never touched (it shows only).
  useEffect(() => {
    if (pendingGraftsRef.current.length === 0 || unbornRef.current || !getJournalEntry(id)) return;
    const todo = pendingGraftsRef.current;
    pendingGraftsRef.current = [];
    const connections: Box[] = [];
    let z = boxes.reduce((m, b) => Math.max(m, b.z), 0) + 1;
    for (const g of todo) {
      if (!boxes.some(b => b.id === g.boxId)) continue;
      const made = graftTo({ entryId: id, boxId: g.boxId }, { entryId: g.entryId }, boxes);
      if (made && made.made === 'connection') connections.push({ id: generateId(), kind: 'connection', x: 0, y: 0, w: 0, h: 0, z: z++, connA: made.a, connB: made.b });
    }
    if (connections.length) setBoxes(prev => [...prev, ...connections]);
  }, [boxes, id, unborn]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden' && !unbornRef.current && boxesRef.current !== lastSavedRef.current) {
        saveBoardBoxes(id, boxesRef.current);
        lastSavedRef.current = boxesRef.current;
        flushNow();
      }
    };
    document.addEventListener('visibilitychange', onHide);
    // LOGOUT FLUSH — the 2 s boxes debounce has no blur flush, so a sign-out would otherwise miss the last two seconds
    // of board edits. It flushes them first, the same way the hide handler does, so they are counted as unsaved.
    const unregisterFlush = registerFlush(() => {
      if (!unbornRef.current && boxesRef.current !== lastSavedRef.current) {
        saveBoardBoxes(id, boxesRef.current);
        lastSavedRef.current = boxesRef.current;
      }
    });
    return () => {
      unregisterFlush();
      document.removeEventListener('visibilitychange', onHide);
      // PB1 — an unborn board leaves nothing behind: no row was written, so
      // there is nothing to flush and nothing to clean up.
      if (!unbornRef.current && boxesRef.current !== lastSavedRef.current) saveBoardBoxes(id, boxesRef.current);
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
  // BUG 32b - a card is measured once the page's FONTS are in, never on the fallback face a lazy font leaves while it loads: the reflow below re-runs on `loadingdone` (and once `fonts.ready` settles),
  // so a card's height does not depend on load timing. (fontTick only re-triggers the effect.)
  const [fontTick, setFontTick] = useState(0);
  useEffect(() => {
    const f = typeof document !== 'undefined' ? document.fonts : undefined;
    if (!f) return;
    let live = true;
    const bump = () => { if (live) setFontTick(t => t + 1); };
    f.addEventListener('loadingdone', bump);
    f.ready.then(bump).catch(() => {});
    return () => { live = false; f.removeEventListener('loadingdone', bump); };
  }, []);

  useLayoutEffect(() => {
    if (pageWidthPx <= 0) return;
    let changed = false;
    const next = boxes.map(b => {
      if (b.kind !== 'text') return b;
      // FX7 S7 — skip whichever box is ACTIVELY being resized right now
      // (activeResizeIdRef, above) — see that ref's own header comment for
      // the full root-cause writeup (a diagonal drag narrows width while
      // shrinking height, which can force an extra text-wrap line that
      // this effect would otherwise measure and grow `h` back from, mid-
      // drag, fighting the writer's own pointer in real time). The floor
      // still applies — this box gets ONE final reconciliation pass the
      // instant `activeResizeIdRef` clears (finish(), below), since `boxes`
      // itself changes then too and re-triggers this same effect.
      if (b.id === activeResizeIdRef.current) return b;
      const el = measureEls.current.get(b.id);
      if (!el) return b;
      const measuredPx = el.scrollHeight;
      const storedPx = b.h * pageWidthPx;
      if (measuredPx - storedPx <= MEASURE_TOLERANCE_PX) return b;
      changed = true;
      return { ...b, h: measuredPx / pageWidthPx };
    });
    if (!changed) return;
    // BUG 32b - reading scrollHeight above forced layout, which is what STARTS a lazy font's load: if any font is still loading this pass measured the fallback face, so it is discarded (loadingdone re-runs it)
    if (typeof document !== 'undefined' && document.fonts && document.fonts.status === 'loading') return;
    // BUG 32b - OPENING A BOARD SAVES NOTHING: `boxes === lastSavedRef.current` means no writer's change is waiting, so this pass is a correction of the saved layout and is shown on SCREEN only (the saved
    // mark moves with it, so the autosave and the hide/logout flushes see nothing to write); the next writer act - an edit, a move, a deal - saves the board as it then is. rowFit (BUG 32: a dealt deck's rows
    // fit their cards, decks/rowFit.ts) applies on a plain open too, so an old board does not sit overlapping - on screen, never saved on its own.
    const fitted = fitDealtRows(boxes, next);
    if (boxes === lastSavedRef.current) lastSavedRef.current = fitted;
    setBoxes(fitted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boxes, pageWidthPx, popupBoxId, fontTick]);

  const measureRef = (boxId: string, el: HTMLDivElement | null) => {
    if (el) measureEls.current.set(boxId, el);
    else measureEls.current.delete(boxId);
  };

  const commitText = (boxId: string, text: string) => {
    if (framed) boardDissolve.noteWrite(); // AB1 S3 — see the hook's mount comment above
    setBoxes(prev => prev.map(b => (b.id === boxId ? { ...b, text } : b)));
    // B3 S1 — "vanishes the FIRST time the writer edits ANY dealt card's
    // content" (R6, as this brief's own S1 fences it): a genuine text
    // commit is exactly that edit. noteDealtCardEdited itself no-ops
    // unless a hint is currently active AND boxId is part of the deal it
    // was armed for, so this is safe to call on every commit, dealt card
    // or not. Re-reading (rather than unconditionally clearing local
    // state) keeps this component honest about storage's own truth.
    noteDealtCardEdited(id, boxId);
    setStartHereCardId(getStartHereCardId(id));
  };

  // ITEM 207 - a card's own face and size: the same functional setBoxes every card edit uses, touching this Box only.
  const commitType = (boxId: string, patch: { fontFace?: StoredFace; fontSize?: number }) => {
    if (patch.fontFace) void ensureFaceLoaded(patch.fontFace.name);
    // TOOLS #10 item 10: a fontFace patch of `undefined` CLEARS the card's face (the key goes; absent = Default), it never stores an empty one
    setBoxes(prev => prev.map(b => {
      if (b.id !== boxId) return b;
      const next = { ...b, ...patch };
      if ('fontFace' in patch && !patch.fontFace) delete next.fontFace;
      return next;
    }));
  };

  // W5 - LIT: the writer marks a step finished, or takes the mark back (the same door both ways). It stamps the card's `updatedAt` so the newer mark or unmark wins a sync merge; it touches nothing else and
  // celebrates nothing (the rewards hook never sees it: Lit changes no kindled set).
  const toggleLit = (box: Box) => {
    if (framed) boardDissolve.noteWrite();
    setBoxes(prev => withLit(prev, box.id, !isLit(box), new Date().toISOString()));
  };
  // W5 - a name on the gaps line: in the Walk the card comes up; in Open the board scrolls to it and focuses it (the card's own editor, else the card).
  const jumpToGap = (boxId: string) => {
    if (boardMode === 'walk') { setWalkJumpId(boxId); return; }
    setSelectedId(boxId);
    const el = canvasRef.current?.querySelector<HTMLElement>(`.board-box[data-box-id="${boxId}"]`);
    if (!el) return;
    el.scrollIntoView({ block: 'center', inline: 'nearest' });
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  };

  const snapshot = (type: NonNullable<LastAction>['type']) => {
    lastActionRef.current = { type, before: boxesRef.current };
    setCanUndo(true);
  };

  const undo = () => {
    const la = lastActionRef.current;
    if (!la) return;
    // the ids this Undo brings BACK (cards deleted since the snapshot): named to the save, which otherwise keeps a tombstone standing against a stale view of its card
    const liveNow = new Set(boxesRef.current.map(b => b.id));
    const restoredIds = la.before.filter(b => !liveNow.has(b.id)).map(b => b.id);
    setBoxes(la.before);
    lastSavedRef.current = boxesRef.current; // force the autosave effect to see a change
    saveBoardBoxes(id, la.before, restoredIds);
    lastActionRef.current = null;
    setCanUndo(false);
  };
  undoRef.current = undo;

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
  // B1 S3 — "hand-delete derived cards (Delete on one must be an inert
  // quiet no-op, harness-asserted)": on a system Board, EVERY visible card
  // is a derived page-pin (S3's own "may NOT Add cards" already makes any
  // other kind unreachable there), so Delete is inert here, whole — a quiet
  // early return, no undo snapshot, no removal. The action row's own Remove
  // button stays visibly present (the brief's own wording: "Delete ON ONE
  // must be an inert quiet no-op" describes the CLICK's effect, not the
  // button's presence) — clicking it on a system Board simply does nothing.
  //
  // BOARD CONTEXT MENU (Nick, Oct 15): a deleted card is a TOMBSTONE. The editor's own state drops it (and its connection boxes - they leave the VIEW, but stay in storage: liveBoxes hides a connection
  // whose endpoint is hidden, so they come back with Restore); storage keeps the card stamped deletedAt. The board is saved FIRST so a card made a moment ago is in storage to be stamped.
  const removeSelected = () => {
    if (!selectedBox) return;
    if (isSystemBoard) return;
    snapshot('remove');
    const idsToRemove = selectedIds;
    saveBoardBoxes(id, boxesRef.current);
    stashDeletedBoxes(id, [...idsToRemove]);
    setBoxes(prev => prev.filter(b => {
      if (idsToRemove.has(b.id)) return false;
      if (b.kind === 'connection' && (idsToRemove.has(b.connA ?? '') || idsToRemove.has(b.connB ?? ''))) return false;
      return true;
    }));
    lastSavedRef.current = boxesRef.current;
    setSelectedId(null);
    actionToast.show(`${t('toastCardDeleted')}  ·  Ctrl+Z`);
  };

  // every way to delete a card - the menu's Delete, the Delete / Backspace key - goes through ONE gate (store/deleteGate.ts): "Send to Trash?" unless the writer has turned asking off
  // (a system board's cards are derived, so a Delete there is the same quiet no-op as ever - it must not even ask)
  removeSelectedRef.current = () => { if (isSystemBoard) return; requestDelete(removeSelected); };
  removeConnectionRef.current = (connId: string) => removeConnection(connId);
  // BIG PROJECTS STEP 3: the Grafts picker's same-board pick (and its Undo) makes the SAME connection box the corner gesture makes
  addConnectionRef.current = (a: string, b: string) => {
    const cur = boxesRef.current;
    if (a === b || !cur.some(x => x.id === a) || !cur.some(x => x.id === b)) return null;
    if (cur.some(x => x.kind === 'connection' && ((x.connA === a && x.connB === b) || (x.connA === b && x.connB === a)))) return null;
    const conn: Box = { id: generateId(), kind: 'connection', x: 0, y: 0, w: 0, h: 0, z: cur.reduce((m, x) => Math.max(m, x.z), 0) + 1, connA: a, connB: b };
    setBoxes(prev => [...prev, conn]);
    return conn.id;
  };

  // ---- CONNECTOR-B: the Grafts / Links tab (the right drawer) reads the open board through a small seam ----
  useEffect(() => { publishBoardSnapshot({ boardId: id, boxes, selectedId }); }, [id, boxes, selectedId]);
  useEffect(() => {
    registerBoardActions({ removeConnection: (connId) => removeConnectionRef.current(connId), addConnection: (a, b) => addConnectionRef.current(a, b) });
    return () => { registerBoardActions(null); publishBoardSnapshot(null); };
  }, []);
  // a link made or removed anywhere redraws this board's footers
  useEffect(() => subscribe(() => setLinkTick(n => n + 1)), []);

  // ---- CONNECTOR-B: drag a rail thumbnail onto the board -> a LINKED COPY (a card made from the page or board, already tied to its original by a link record) ----
  linkedCopyRef.current = (entryId: string, cx: number, cy: number) => {
    if (isSystemBoard) return;
    const entry = getJournalEntryIncludingDeleted(entryId);
    const cv = canvasRef.current;
    if (!entry || !cv || entryId === id) return;
    const cr = cv.getBoundingClientRect(), W = cr.width || pageWidthPx;
    const w = 0.26, h = 0.14;
    const x = Math.min(Math.max((cx - cr.left) / W, 0), Math.max(1 - w, 0));
    const y = Math.min(Math.max((cy - cr.top) / W, 0), Math.max(BOARD_MAX_Y - BOARD_BREATHING_ROOM - h, 0));
    const words = entry.pageType === 'board' ? ((entry.text ?? '').trim().split('\n')[0] || 'Untitled board') : (entry.text ?? '').trim().slice(0, 800);
    const maxZ = boxesRef.current.reduce((m, b) => Math.max(m, b.z), 0);
    const box: Box = { id: generateId(), kind: 'text', x, y, w, h, z: maxZ + 1, text: words };
    const next = [...boxesRef.current, box];
    setBoxes(next);
    saveBoardBoxes(id, next);                       // the card exists in storage before the record that names it
    lastSavedRef.current = next;
    addPageLink(id, { aBoxId: box.id, bEntryId: entryId });
    setSelectedId(box.id);
  };
  useEffect(() => {
    let press: { x: number; y: number; entryId: string; label: string } | null = null;
    let ghost: HTMLElement | null = null;
    const finish = () => {
      window.removeEventListener('pointermove', onMove, true); window.removeEventListener('pointerup', onUp, true); window.removeEventListener('pointercancel', onCancel, true);
      ghost?.remove(); ghost = null; delete document.body.dataset.linkDrag; press = null;
    };
    function onMove(e: PointerEvent) {
      if (!press) return;
      if (!ghost) {
        if (Math.hypot(e.clientX - press.x, e.clientY - press.y) < 6) return;
        ghost = document.createElement('div'); ghost.className = 'wz-link-ghost'; ghost.textContent = press.label;
        document.body.appendChild(ghost); document.body.dataset.linkDrag = 'true';
      }
      e.preventDefault();
      ghost.style.left = `${e.clientX + 10}px`; ghost.style.top = `${e.clientY - 20}px`;
    }
    function onUp(e: PointerEvent) {
      const p = press, dragged = !!ghost;
      finish();
      if (!p || !dragged) return;
      // the thumbnail's own click (it travels to the page) must not fire for a drag
      const swallow = (ev: Event) => { ev.stopPropagation(); ev.preventDefault(); };
      window.addEventListener('click', swallow, true);
      setTimeout(() => window.removeEventListener('click', swallow, true), 80);
      const over = document.elementFromPoint(e.clientX, e.clientY);
      const cv = canvasRef.current;
      if (over && cv && cv.contains(over)) linkedCopyRef.current(p.entryId, e.clientX, e.clientY);   // dropped anywhere on the board (empty space or over a card): a card lands there
    }
    function onCancel() { finish(); }
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || e.pointerType === 'touch' || threadArmedFromRef.current != null || popupBoxIdRef.current) return;
      const el = (e.target as Element | null)?.closest?.('[data-link-entry]') as HTMLElement | null;
      if (!el || canvasRef.current?.contains(el)) return;
      if (el.closest('[draggable="true"]') || (e.target as Element).closest('.wz-cascade-thumb-menu-btn, .wz-cascade-thumb-menu, [data-reorder-grip]')) return;   // BIG PROJECTS 1a: a Pages pop-out row's reorder grip keeps its own drag   // a draggable survey row keeps its own (membership) drag
      const eid = el.dataset.linkEntry!;
      if (eid === id || !getJournalEntryIncludingDeleted(eid)) return;
      press = { x: e.clientX, y: e.clientY, entryId: eid, label: (el.textContent ?? '').trim().split('\n')[0].slice(0, 60) || 'Untitled' };
      window.addEventListener('pointermove', onMove, true); window.addEventListener('pointerup', onUp, true); window.addEventListener('pointercancel', onCancel, true);
    };
    document.addEventListener('pointerdown', onDown, true);
    return () => { document.removeEventListener('pointerdown', onDown, true); finish(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // the board itself: soft-delete (the Trash lists it; Restore brings it back), then leave it the way a Page's own delete does
  const deleteThisBoard = () => {
    if (isSystemBoard) return;
    softDeleteEntry(id);
    flushNow();
    navigate(getResumeTarget()?.route ?? '/', { replace: true });
  };

  // AB4 S3 — thread deletion: confirm-free (a thread is cheap; re-drawing is
  // one gesture, the brief's own words).
  const removeConnection = (connId: string) => {
    snapshot('remove');
    setBoxes(prev => prev.filter(b => b.id !== connId));
    setSelectedConnectionId(null);
  };

  // B1 S4 — Restore, the Trash Board's own selected-card action (a plain
  // button, the FX5 action-row precedent — "restore is a plain button, say
  // so": no confirmation, no undo entry, no special fidelity claim beyond a
  // click). Clears deletedAt via persistence.ts's restoreEntry and nothing
  // else — this component never touches the underlying entry's own
  // projectId/shelved/origin. The card's own removal from THIS board isn't
  // done here by hand: it happens through the SAME reconcile subscription
  // (above) that put it here in the first place — restoreEntry's own save
  // fires notify(), which re-runs reconcileSystemBoard, which finds the
  // restored page no longer deletedAt-bearing and drops its stale card —
  // one mechanism, not two. Deselecting here only prevents the action row
  // from pointing at a card that's about to disappear.
  const restoreSelected = (entryId: string) => {
    restoreEntry(entryId);
    setSelectedId(null);
    flushNow();
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
    // W1 - ADDING FOLLOWS THE VIEW SHOWN: Open places a card at a position; Storyboard, Outline and the Walk append it to the order (`seq`, after the last).
    const placement = addPlacement(boardMode, boxesRef.current);
    const box: Box = { id: generateId(), kind: 'text', x: 0.05, y, w: NEW_CARD_W, h: NEW_CARD_H, z: maxZ + 1, text: '', ...(placement.mode === 'append' ? { seq: placement.seq } : {}) };
    setBoxes(prev => [...prev, box]);
    setSelectedId(box.id);
    if (boardMode === 'walk') setWalkJumpId(box.id);
    // BG1 S1 — "opens it straight into edit mode" is an OPEN-canvas fact: the
    // popup (BoardCardPopup) is mounted inside `boardBody`, which only the OPEN
    // projection renders. BG1's row puts New Card in STORYBOARD and OUTLINE too,
    // where arming the popup would set a state nothing can render and then spring
    // it open on the next flip back to OPEN. Those two projections have their own
    // card affordances (OUTLINE edits text inline; STORYBOARD orders), so the card
    // simply arrives there.
    if (boardMode === 'open') setPopupBoxId(box.id);
  };

  // FX6 S2b — "New page card": the board-side door Nick reached for and
  // couldn't find. A blank card that starts a card is one thing (onAddCard,
  // above); this instead creates a REAL page and pins its own card to THIS
  // board in one act. Normal homing laws, untouched: createLooseHomePage
  // is the SAME "give me a blank page, no assumptions about where it
  // files" door Arrival.tsx's own Write door already uses (AB3 S4 — `loose`
  // is a legitimate, permanent home, never nudged to file) — a pin is
  // membership, not filing (AB4's own law, S3 below closes the self-pin
  // gap in the SAME spirit), so the new page's OWN home is independent of
  // the board it lands on; pinPageToBoard never touches it. Opens at
  // `/page/:id` (PageEditor, mode-aware) — the SAME editing surface every
  // other page in a project/board context already opens into, not the
  // Journal's own distinct capture UI. Travels straight to the fresh page
  // — matching Nick's own DoD wording, "makes a page-card on a board in
  // one act."
  //
  // ITEM 92 — THE CARD USED TO BE WRITTEN AND THEN ERASED BY THIS COMPONENT.
  // `pinPageToBoard` writes the BOARD's row in the STORE. This component holds
  // its cards in local state that is initialized once (`useState` above) and, on
  // a user board, never re-read — the `subscribe()` that would refresh it lives
  // inside the system-board-only reconcile effect. So after pinning, local
  // `boxes` still held the PRE-PIN array, and the unmount cleanup below
  // (`saveBoardBoxes(id, boxesRef.current)`) wrote that stale array straight back
  // over the pin — on the very `navigate` this handler performs. The card was
  // created and then destroyed by the surface that created it.
  //
  // This is the hazard the deck-wizard comment above already names: card
  // creation goes through the component's own state so a later save cannot
  // clobber it. The pin BOX itself is still built by `pinPageToBoard` — that
  // function owns stacking placement, the idempotent already-pinned check, and
  // the self-pin / system-board guards, and forking any of that into this
  // handler would be a second source of truth for what a pin is. What was
  // missing is the other half: telling this component what the store now says.
  //
  // The pin is APPENDED to this component's own live boxes — never assigned
  // from the store's copy. That distinction is the difference between a fix and
  // a second data-loss bug, and it was caught by staging item 92's actual
  // precondition: at the moment this door is used, local `boxes` may hold cards
  // the 2s autosave has not written yet, so the STORE's array is a strict subset
  // of the truth. Replacing local state with `updated.boxes` would have silently
  // dropped every unsaved card the writer had just placed. Appending to
  // `boxesRef.current` — "this component's own live boxes, not a fresh store
  // read", in the deck-wizard comment's own words — keeps both.
  //
  // `boxesRef.current` is assigned directly rather than only through `setBoxes`,
  // because it is assigned during RENDER and this handler batches its update
  // with a `navigate` that unmounts the component: there may be no further
  // render, and the unmount guard reads the REF. `lastSavedRef` is deliberately
  // left alone so that guard still sees a difference and writes the merged
  // array on the way out.
  //
  // `pinPageToBoard` still builds the box — it owns stacking placement, the
  // idempotent already-pinned check and the self-pin / system-board guards, and
  // forking those here would be a second definition of what a pin is. Its
  // placement is computed against the store's boxes, so a pin can land under an
  // unsaved neighbour; that is cosmetic and movable, and strictly better than
  // the alternatives (losing the card, or duplicating the placement rules).
  const onAddPageCard = () => {
    const page = createLooseHomePage();
    // PW1 S3 — BOARD-SIDE: the writer pressed a door ON THIS CANVAS asking for
    // a card here, so the card appears here. Arrangement they authored.
    const updated = pinPageToBoard(page.id, id, { display: true });
    const pin = liveBoxes(updated?.boxes).find(b => b.kind === 'page-pin' && b.entryId === page.id);
    if (pin) {
      const next = [...boxesRef.current, pin];
      setBoxes(next);
      boxesRef.current = next;
    }
    navigate(`/page/${page.id}`);
  };

  // B3 S3 — door 2's own click: opt-in, only ever reached by the writer's
  // own click on the sliver's "From a deck…" row (see sliverContent below —
  // absent whole on a system Board, the same law onAddCard/onAddPageCard/
  // onAddExistingPage already carry).
  const onAddFromDeck = () => setDeckWizardOpen(true);

  // BG1 S1 — "New Lane," STORYBOARD's own door. The lane-append mechanism
  // already existed (BoardProjection.tsx's own `addLane`) but was unreachable
  // from an EMPTY storyboard: that projection returns its empty line before it
  // renders the add-lane button, so a board with no cards had no way to lay a
  // lane at all. Lifted here, unchanged in substance (the board-meta `lanes[]`
  // registry via withLanes — the FX4 board-meta precedent, zero schema), and
  // passed DOWN to the projection so exactly one lane-append exists in the
  // codebase rather than two that can drift. Written through the functional
  // updater so it reads the live boxes, matching every other mutation here.
  const onAddLane = () => {
    setBoxes(prev => {
      const lanes = prev.find(b => b.kind === 'board-meta')?.lanes ?? [];
      return withLanes(prev, [...lanes, { id: generateId(), title: `${t('boardLaneDefault')} ${lanes.length + 1}` }], generateId);
    });
  };

  // B3 S1 — the wizard's own last act, landed here: materialize purely
  // in-memory against the LIVE boxes (boxesRef.current), append via the
  // same setBoxes path every other card creation already uses, arm the
  // Start Here hint on the freshly dealt set's own first card. No
  // navigation — "ends on the dealt board" and the writer is already on
  // it (door 2's whole point: dealing onto THIS board, alongside whatever
  // already lives there).
  const onDeckDealt = (deck: DeckDefinition, answers: DeckAnswers) => {
    const result = materializeDeck(deck, answers, boxesRef.current);
    if (result.dealtIds.length === 0) return;   // W3: nothing dealt (the page step offers no empty deal; this is the belt)
    // W3 - From my pages: each dealt card is to be GRAFTED to its page through the ordinary Grafts path - queued here, made by the effect below once the cards are on a board whose row exists.
    pendingGraftsRef.current = [...pendingGraftsRef.current, ...result.grafts];
    // W1 - a Preset (an UNBORN board whose address carries a deck) is born a DECK: its home view is the Walk, written with the first cards in the one birth. A deal onto an EXISTING board never touches that board's view.
    const presetBorn = !!unbornRef.current?.descriptor.deck;
    const dealtBoxes = result.boxes;   // ONE read of the deck result's boxes (box-tombstones T11 counts raw `.boxes` readers; the ternary below used to read it twice)
    setBoxes(prev => { const next = [...prev, ...dealtBoxes]; return presetBorn ? withHomeView(next, doorHome('preset').homeView, generateId) : next; });
    armStartHere(id, result.firstCardId, result.dealtIds);
    setStartHereCardId(result.firstCardId);
    // TOOLS #9 - Q3's landing, if the librarian made this deal: "everything" shows the board as Open; the Walk landings show it in the Walk (a Preset is born in it already; an existing board is shown in it only
    // if it offers the Walk), and "a little" also opens the first step's "?" once. This is the writer's own "last shown as" (store/boardMode.ts), never the board's home view - nothing new is stored.
    const landing = landingRef.current;
    landingRef.current = null;
    if (landing) {
      if (landing.view === 'open') setBoardMode('open');
      else {
        if (!presetBorn && offeredViews.includes('walk')) setBoardMode('walk');
        if (landing.helpOpen && (presetBorn || offeredViews.includes('walk')) && result.firstCardId) setWalkHelpId(result.firstCardId);
      }
    }
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
    navigate(routeForEntry(target), { state: { fromBoardId: id, fromBoardTitle: title } });
  };
  const travelToPin = (box: Box) => travelToEntry(box.entryId);

  // -- delegated pointer handling: select / move / resize / thread-drag -----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let phase: 'idle' | 'pending' | 'dragging' | 'resizing' | 'creating' = 'idle';
    // BOARD CLICK-TO-CREATE - the press that may become a card: where it began (client px), whether it has been dragged past the threshold, and the geometry the ghost shows
    let createOrigin: { x: number; y: number } | null = null;
    let createDragged = false;
    let startX = 0, startY = 0, ptype = 'mouse';
    let activePointerId: number | null = null;
    let longPressTimer: ReturnType<typeof setTimeout> | null = null;
    let movingIds: string[] = [];
    let startBoxes: Box[] = [];
    let resizingId: string | null = null;
    let resizeStart: { w: number; h: number; aspect: number; kind: Box['kind']; pinAspect: number | null } | null = null;

    const clearTimer = () => { if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; } };
    // CARD RESIZE RELOCK, THE SECOND CAUSE (chat 1's run, 2026-10-13): a resize or a move drags the mouse across the board, and the
    // browser selects the text it passes over. The next ordinary press inside that selection - on the corner, a moment later - starts
    // the browser's own drag of the selected text, which CANCELS the pointer: onCancel -> finish(false) reverts the resize, and the
    // corner looks locked until a click elsewhere clears the selection (Nick: "until he clicks another card"). Board text is never
    // selected for its own sake (a card is edited in its popup), so a gesture clears a selection that sits on the board when it starts
    // and when it ends. A selection anywhere else (the page beside a board) is left alone. The diagnosis is the harness's to prove,
    // not this comment's: card-resize-relock.mjs R4 (no selection left after a resize) and R5 (no dragstart / pointercancel).
    const clearBoardSelection = () => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && !sel.isCollapsed && sel.anchorNode && canvas.contains(sel.anchorNode)) sel.removeAllRanges();
    };
    // ...and a native drag that starts on a card is refused outright, so no selection, however it was made, can take the pointer.
    // (The board's one drop target, the survey's drag, starts OUTSIDE the canvas; this never sees it.)
    const onDragStart = (e: DragEvent) => {
      const t = e.target as Node | null;
      const el = t && (t.nodeType === 1 ? (t as HTMLElement) : t.parentElement);
      if (el && el.closest('.board-box')) e.preventDefault();
    };

    // ============================================================================================================================================================
    // CONNECTION MODE (connector-a; Nick's approved mockup v6, docs/mockups/connector on cursor/connector). It REPLACES the green tack and the thread-drag it armed.
    //   ENTER  double-click the selected card's corner square with the pointer unmoved between the clicks, or right-click it (the browser menu is suppressed only there). The square
    //          morphs to a 10px circle.
    //   ARM    a thin brass line from that circle to the pointer; over another card it snaps to THAT card's circle - open = not linked, solid = linked.
    //   COMMIT release on a card TOGGLES the link (a connection box, same board, stored exactly as before - no schema); a brief flash; then the lines hide.
    //   CANCEL Esc, or a release on empty board after a drag. Released AT the square without moving, the mode latches and a click finishes it.
    //   LINES  shown ONLY in this mode, only this card's own links (clipped to the board by the canvas itself); a click selects one, Delete removes it (the existing key handler).
    // The arm and the target circle move imperatively (no React render per pointermove, the preview line's old discipline); React only hears of the target card changing.
    // ============================================================================================================================================================
    // BIG PROJECTS STEP 3 (3a): `origin` - the door the mode was entered from. 'corner' is connector-a's square; 'knob' is the brass graft knob on the
    // card's right edge (the same mode, a second door: the arm and the origin circle sit at the knob instead of the corner).
    type Connect = { src: string; held: boolean; right: boolean; ox: number; oy: number; moved: boolean; px: number; py: number; target: string | null; railEntry: string | null; railEl: HTMLElement | null; origin: 'corner' | 'knob' };
    let connect: Connect | null = null;
    // the browser's context menu is suppressed ONLY: on the corner square, while the mode is on, and for a beat after a right-button gesture ends (Windows fires `contextmenu` AFTER `pointerup`, by which time the mode is already over)
    let ctxQuietUntil = 0;
    // the last press on a corner square: a SECOND one at the same spot, soon, with nothing moved in between, is a double-click (a resize in between is not)
    let handleClick: { t: number; x: number; y: number; moved: boolean; boxId: string } | null = null;
    let flashTimers: ReturnType<typeof setTimeout>[] = [];
    const LINKABLE = new Set<string>(['text', 'ink', 'page-pin']);

    const cornerOf = (boxId: string) => {
      const el = canvas.querySelector(`[data-box-id="${boxId}"]`) as HTMLElement | null;
      if (!el) return null;
      const r = el.getBoundingClientRect(), c = canvas.getBoundingClientRect();
      return { x: r.right - c.left, y: r.bottom - c.top };
    };
    // CONNECTOR-B: the arm lives in a VIEWPORT overlay (a portal on body, position:fixed) - it has to reach the rail's thumbnails, which are outside the board, and the board canvas clips. Its coordinates are CLIENT
    // coordinates, so there is no canvas offset to subtract. The lines between cards stay inside the canvas (clipped to the board, never over the rail).
    const cornerClient = (boxId: string) => {
      const el = canvas.querySelector(`[data-box-id="${boxId}"]`) as HTMLElement | null;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.right, y: r.bottom };
    };
    // the mode's origin point in client coordinates: the corner square, or - entered from the graft knob - the card's right edge at mid-height
    const originClient = () => {
      if (!connect) return null;
      if (connect.origin === 'corner') return cornerClient(connect.src);
      const el = canvas.querySelector(`[data-box-id="${connect.src}"]`) as HTMLElement | null;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.right, y: r.top + r.height / 2 };
    };
    const placeArm = () => {
      const line = previewLineRef.current, tip = armTipRef.current;
      if (!connect || !line) return;
      const from = originClient();
      if (!from) return;
      let to = { x: connect.px, y: connect.py };
      let snapped = false;
      const snap = connect.target ? cornerClient(connect.target) : null;
      if (snap) { to = snap; snapped = true; }
      else if (connect.railEl) { const r = connect.railEl.getBoundingClientRect(); to = { x: r.left + 9, y: r.top + r.height / 2 }; snapped = true; }   // a rail thumbnail: the arm lands on ITS circle
      line.setAttribute('x1', String(from.x)); line.setAttribute('y1', String(from.y));
      line.setAttribute('x2', String(to.x)); line.setAttribute('y2', String(to.y));
      line.style.display = 'block';
      if (tip) {
        // the tip rides the pointer; over a card or a thumbnail the circle on that one takes its place
        tip.setAttribute('cx', String(to.x)); tip.setAttribute('cy', String(to.y));
        tip.style.display = snapped ? 'none' : 'block';
      }
    };
    // ---- the rail: an element wearing data-link-entry stands for an ENTRY (a page or a board); outside the canvas it is a connector target ----
    const railEntryAt = (x: number, y: number): { el: HTMLElement; entryId: string } | null => {
      for (const el of document.elementsFromPoint(x, y)) {
        const th = (el as Element).closest?.('[data-link-entry]') as HTMLElement | null;
        if (!th || canvas.contains(th)) continue;
        const eid = th.dataset.linkEntry;
        if (!eid || eid === id || !getJournalEntryIncludingDeleted(eid)) continue;   // not an entry (a card's id in a survey), or this very board
        return { el: th, entryId: eid };
      }
      return null;
    };
    let railPaintAt = 0;
    const paintRail = () => {
      railPaintAt = performance.now();
      document.body.dataset.connecting = connect ? 'true' : 'false';
      for (const el of document.querySelectorAll<HTMLElement>('[data-link-entry]')) {
        if (canvas.contains(el)) continue;
        const eid = el.dataset.linkEntry!;
        const pin = connect ? livePinFor(id, eid) : null;
        const linked = !!connect && (pin ? !!pairBox(connect.src, pin.id) : isCardLinkedToEntry(id, connect.src, eid));
        const isTarget = !!connect && connect.railEntry === eid;
        if (isTarget) el.setAttribute('data-link-target', 'true'); else el.removeAttribute('data-link-target');
        if (connect && linked) el.setAttribute('data-link-peer', 'true'); else el.removeAttribute('data-link-peer');
        if ((isTarget || (connect && linked)) && linked) el.setAttribute('data-link-solid', 'true'); else el.removeAttribute('data-link-solid');
      }
    };
    const clearRailPaint = () => {
      document.body.dataset.connecting = 'false';
      for (const el of document.querySelectorAll<HTMLElement>('[data-link-entry]')) { el.removeAttribute('data-link-target'); el.removeAttribute('data-link-peer'); if (!el.hasAttribute('data-link-flash')) el.removeAttribute('data-link-solid'); }
    };
    const flashRail = (entryId: string, linked: boolean) => {
      for (const el of document.querySelectorAll<HTMLElement>('[data-link-entry]')) {
        if (canvas.contains(el) || el.dataset.linkEntry !== entryId) continue;
        el.setAttribute('data-link-flash', linked ? 'on' : 'off');
        if (linked) el.setAttribute('data-link-solid', 'true'); else el.removeAttribute('data-link-solid');
        flashTimers.push(setTimeout(() => { el.removeAttribute('data-link-flash'); el.removeAttribute('data-link-solid'); }, 1500));
      }
    };
    const targetAt = (x: number, y: number): string | null => {
      if (!connect) return null;
      for (const el of document.elementsFromPoint(x, y)) {
        if ((el as Element).closest?.('.board-connections')) continue;
        const b = (el as Element).closest?.('.board-box') as HTMLElement | null;
        if (!b || !canvas.contains(b)) continue;
        const id = b.dataset.boxId;
        if (!id || id === connect.src) continue;
        const box = boxesRef.current.find(q => q.id === id);
        if (box && LINKABLE.has(box.kind)) return id;
      }
      return null;
    };
    const pairBox = (a: string, b: string) => boxesRef.current.find(x => x.kind === 'connection' && ((x.connA === a && x.connB === b) || (x.connA === b && x.connB === a)));

    function endConnect() {
      document.removeEventListener('pointermove', cMove, true);
      document.removeEventListener('pointerup', cUp, true);
      document.removeEventListener('pointerdown', cDown, true);
      if (!connect) return;
      connect = null;
      threadArmedFromRef.current = null;
      setThreadArmedFrom(null);
      setConnectFromKnob(false);
      setConnectTarget(null);
      setSelectedConnectionId(null);
      const line = previewLineRef.current; if (line) line.style.display = 'none';
      clearRailPaint();
    }
    const clearFlashTimers = () => { flashTimers.forEach(clearTimeout); flashTimers = []; };
    const startFlash = (f: { a: string; b: string; off: boolean; line: boolean }) => {
      clearFlashTimers();
      setConnectFlash(f);
      // the line is brief (it is a confirmation, not a feature); the circles linger a little longer; then everything is hidden again
      flashTimers.push(setTimeout(() => setConnectFlash(cur => (cur ? { ...cur, line: false } : cur)), 650));
      flashTimers.push(setTimeout(() => setConnectFlash(null), 1500));
    };
    const commit = (tid: string) => {
      if (!connect) return;
      const src = connect.src;
      const existing = pairBox(src, tid);
      if (existing) {
        setBoxes(prev => prev.filter(x => x.id !== existing.id));     // linked already: releasing on it UNLINKS
      } else {
        const maxZ = boxesRef.current.reduce((m, x) => Math.max(m, x.z), 0);
        const conn: Box = { id: generateId(), kind: 'connection', x: 0, y: 0, w: 0, h: 0, z: maxZ + 1, connA: src, connB: tid };
        setBoxes(prev => [...prev, conn]);                              // not linked: releasing on it LINKS (the same box shape as ever)
      }
      endConnect();
      startFlash({ a: src, b: tid, off: !!existing, line: true });
    };
    // the connector's release on an ENTRY: if that entry is ALREADY a live pin card on this board it is a CARD (the one-truth rule: two cards of one board join by a connection box, never a record) - otherwise a
    // page_links record toggles (linked <-> unlinked), owned by this board. Then a brief flash on the thumbnail, and the mode is over.
    const commitEntry = (entryId: string) => {
      if (!connect) return;
      const pin = livePinFor(id, entryId);
      if (pin) { commit(pin.id); return; }
      const src = connect.src;
      const res = toggleEntryLink(id, src, entryId);
      endConnect();
      if (res) flashRail(entryId, res === 'linked');
    };
    function cMove(e: PointerEvent) {
      if (!connect) return;
      connect.px = e.clientX; connect.py = e.clientY;
      if (Math.hypot(e.clientX - connect.ox, e.clientY - connect.oy) > MOUSE_DRAG_THRESHOLD) connect.moved = true;
      const t = targetAt(e.clientX, e.clientY);
      if (t !== connect.target) { connect.target = t; setConnectTarget(t); }
      const rail = t ? null : railEntryAt(e.clientX, e.clientY);
      const railId = rail ? rail.entryId : null;
      if (railId !== connect.railEntry) { connect.railEntry = railId; connect.railEl = rail ? rail.el : null; paintRail(); }
      else if (performance.now() - railPaintAt > 200) paintRail();   // the rail may have changed under a still pointer (a panel opened)
      placeArm();
    }
    // a point on one of the mode's own circles (the origin's or a linked peer's) belongs to the CIRCLE, not to the line that ends there: the release that enters the mode lands exactly on the origin's
    // circle, where every line of this card begins, and it must not select one (it did: the first review run found the line already heavy, and a Delete then reached the wrong thing)
    const onModeCircle = (x: number, y: number): boolean => {
      if (!connect) return false;
      const c = canvas.getBoundingClientRect();
      const o = originClient();   // the knob's circle, when the mode began there
      if (o && Math.hypot(x - o.x, y - o.y) <= 14) return true;
      const ids =[connect.src, ...boxesRef.current.filter(b => b.kind === 'connection' && (b.connA === connect!.src || b.connB === connect!.src)).map(b => (b.connA === connect!.src ? b.connB : b.connA) as string)];
      return ids.some(id => { const p = cornerOf(id); return !!p && Math.hypot(x - c.left - p.x, y - c.top - p.y) <= 14; });
    };
    // THE CLICK THAT FOLLOWS A RELEASE ON A RAIL THUMBNAIL (ledger 86, a real product bug). The browser fires `click` on the tile right after this pointerup, and the tile's own onClick travels
    // to its page - so the writer left the board the moment the link was made (page-primacy line 3: leaving is an explicit act, never a side effect of a tool). The thumbnail DRAG swallows its own
    // follow-up click the same way (above); a connector release on the rail does too, whichever path made it - a latched click on the thumbnail, or the held path (press the corner, release over
    // it). A short beat tied to the release itself, never a lock: the writer's next deliberate click on a thumbnail still travels.
    const swallowReleaseClick = () => {
      const swallow = (ev: Event) => { ev.stopPropagation(); ev.preventDefault(); };
      window.addEventListener('click', swallow, true);
      setTimeout(() => window.removeEventListener('click', swallow, true), 100);
    };
    function cUp(e: PointerEvent) {
      if (!connect) return;
      // the browser fires `contextmenu` right after a right-button release (on Windows, after pointerup): that one belongs to THIS gesture and is suppressed. It is a short beat tied to the release itself -
      // an Esc that ends the mode, or the writer's NEXT right-click, is not inside it (the first review run lost a card's menu to a 500ms window that ran from the mode's end).
      if (connect.right) ctxQuietUntil = performance.now() + 250;
      const hit = onModeCircle(e.clientX, e.clientY) ? undefined : document.elementsFromPoint(e.clientX, e.clientY).find(n => (n as Element).classList?.contains('board-connection-hit')) as Element | undefined;
      if (hit) {                                   // a click on a line selects it; Delete removes it
        connect.held = false;
        const id = hit.closest('[data-connection-id]')?.getAttribute('data-connection-id');
        if (id) setSelectedConnectionId(id);
        return;
      }
      const t = targetAt(e.clientX, e.clientY);
      const rail = t ? null : railEntryAt(e.clientX, e.clientY);
      if (rail) swallowReleaseClick();   // the click the browser fires on the thumbnail after this release must not travel to its page
      if (connect.held) {
        connect.held = false;
        if (t) { commit(t); return; }
        if (rail) { commitEntry(rail.entryId); return; }
        if (connect.moved) { endConnect(); return; }   // released on nothing after a drag: cancel
        return;                                         // released at the square: the mode latches; a click finishes it
      }
      if (t) commit(t); else if (rail) commitEntry(rail.entryId); else endConnect();
    }
    function cDown(e: PointerEvent) {
      // connection mode owns every press: the board's own select / move / resize stand down (and a stray press cannot start a native drag)
      if (!connect) return;
      e.preventDefault(); e.stopPropagation();
    }
    const enterConnect = (src: string, held: boolean, e: PointerEvent, origin: 'corner' | 'knob' = 'corner') => {
      clearFlashTimers(); setConnectFlash(null);
      connect = { src, held, right: e.button === 2, ox: e.clientX, oy: e.clientY, moved: false, px: e.clientX, py: e.clientY, target: null, railEntry: null, railEl: null, origin };
      setConnectFromKnob(origin === 'knob');
      threadArmedFromRef.current = src;
      setSelectedConnectionId(null);
      setConnectTarget(null);
      setThreadArmedFrom(src);
      document.addEventListener('pointermove', cMove, true);
      document.addEventListener('pointerup', cUp, true);
      document.addEventListener('pointerdown', cDown, true);
      paintRail();
      requestAnimationFrame(placeArm);   // the arm element mounts with the state above; place it as soon as it exists
    };
    // a right-click on the square is suppressed ONLY there (the browser's own menu would cover the very thing being asked for) - plus while the mode is on, plus the beat after a right-drag lets go
    const onCtx = (e: Event) => {
      const t = e.target as Element | null;
      // THE RAIL TILE'S OWN MENU (ledger 87): a held right-button release over a rail thumbnail fires `contextmenu` ON THAT TILE, whose own onContextMenu opens its "Delete board" menu - a destructive menu under the pointer
      // right after a link gesture, and the writer's next click is spent dismissing it. preventDefault only stops the browser's own menu; this listener is document-capture, so stopping propagation here keeps the event from
      // ever reaching the tile's handler. Only in the three cases this gesture owns (the mode is on, the beat after a right-drag lets go, the corner square).        
      if (connect || performance.now() < ctxQuietUntil || t?.closest?.('.board-handle')) { e.preventDefault(); e.stopPropagation(); return; }
      // BOARD CONTEXT MENU: a right-click ON a card opens the card menu, on empty board the board menu (the corner square and a right-drag are connection mode, handled above). The card pop-up owns
      // its own right-clicks (the browser's spelling menu), and nothing opens while a thread is armed.
      if (popupBoxIdRef.current) return;
      const me = e as MouseEvent;
      if (!canvas.contains(t as Node | null)) return;
      const hit = document.elementFromPoint(me.clientX, me.clientY) as HTMLElement | null;   // not e.target: a held pointer retargets mouse events to the canvas
      const boxEl = hit?.closest?.('.board-box') as HTMLElement | null;
      e.preventDefault();
      if (boxEl?.dataset.boxId) { setSelectedId(boxEl.dataset.boxId); ctxActionsRef.current.card(me.clientX, me.clientY, boxEl.dataset.boxId); return; }
      if (hit === canvas || hit?.closest?.('.board-connections') || hit?.classList?.contains('board-canvas')) { setSelectedId(null); ctxActionsRef.current.board(me.clientX, me.clientY); }
    };

    // BOARD CLICK-TO-CREATE - the card the press would make, in the board's own units (x and BOTH y and h are fractions of the WIDTH, as every box here is). A plain press takes the
    // default card size with its top-left AT the press; a drag takes the rectangle between the press and the pointer. Always floored at the minimum card and clamped to the board.
    const createRectAt = (clientX: number, clientY: number) => {
      const cr = canvas.getBoundingClientRect();
      const W = cr.width || pageWidthPx;
      const ox = ((createOrigin as { x: number; y: number }).x - cr.left) / W;
      const oy = ((createOrigin as { x: number; y: number }).y - cr.top) / W;
      let x: number, y: number, w: number, h: number;
      if (!createDragged) { x = ox; y = oy; w = NEW_CARD_W; h = NEW_CARD_H; }
      else {
        const px = (clientX - cr.left) / W, py = (clientY - cr.top) / W;
        x = Math.min(ox, px); y = Math.min(oy, py); w = Math.abs(px - ox); h = Math.abs(py - oy);
      }
      w = Math.min(Math.max(w, MIN_TEXT_W), 1);
      h = Math.max(h, MIN_TEXT_H);
      x = Math.min(Math.max(x, 0), Math.max(1 - w, 0));
      y = Math.min(Math.max(y, 0), Math.max(BOARD_MAX_Y - BOARD_BREATHING_ROOM - h, 0));
      return { x, y, w, h };
    };
    const showGhost = (clientX: number, clientY: number) => {
      const g = ghostRef.current;
      if (!g || !createOrigin) return;
      const r = createRectAt(clientX, clientY);
      g.style.display = 'block';
      g.style.left = `${r.x * pageWidthPx}px`; g.style.top = `${r.y * pageWidthPx}px`;
      g.style.width = `${r.w * pageWidthPx}px`; g.style.height = `${r.h * pageWidthPx}px`;
    };
    const hideGhost = () => { const g = ghostRef.current; if (g) g.style.display = 'none'; };
    const finishCreate = (commit: boolean, e?: PointerEvent) => {
      if (activePointerId != null && canvas.hasPointerCapture(activePointerId)) {
        try { canvas.releasePointerCapture(activePointerId); } catch { /* already released */ }
      }
      hideGhost();
      const origin = createOrigin;
      phase = 'idle';
      if (!commit || !origin || !e) { createOrigin = null; createDragged = false; return; }
      const r = createRectAt(e.clientX, e.clientY);
      createOrigin = null; createDragged = false;
      const maxZ = boxesRef.current.reduce((m, b) => Math.max(m, b.z), 0);
      const box: Box = { id: generateId(), kind: 'text', x: r.x, y: r.y, w: r.w, h: r.h, z: maxZ + 1, text: '' };
      freshEmptyIdsRef.current.add(box.id);   // a card made by this gesture and closed still empty is discarded (the pop-up's onClose, below)
      setBoxes(prev => [...prev, box]);
      setSelectedId(box.id);
      setPopupBoxId(box.id);
    };

    const beginMove = (ids: string[]) => {
      phase = 'dragging';
      movingIds = ids;
      startBoxes = boxesRef.current;
      if (activePointerId != null) { try { canvas.setPointerCapture(activePointerId); } catch { /* gone */ } }
      setIsDragging(true); // FX8 S3 — see the state's own header comment above
    };

    const beginResize = (boxId: string) => {
      const box = boxesRef.current.find(b => b.id === boxId);
      if (!box) return;
      phase = 'resizing';
      canvas.dataset.resizing = 'true';   // CARD-RESIZE-AXIS: the whole canvas wears the diagonal arrow while the corner is held (see index.css)
      resizingId = boxId;
      startBoxes = boxesRef.current;
      // ITEM 138 — the LOCK's aspect, resolved from the PINNED ENTRY, never from
      // the box. A nested board's card is the same `page-pin` box as a page's, so
      // keying on `box.kind` here would flip every board card to tall and undo
      // Nick's wide-board ruling (138's ratified exclusion clause).
      // `getJournalEntryIncludingDeleted` because a Trash card is still a card
      // whose shape must stay lawful while it is on the wall.
      const pinnedEntry = box.kind === 'page-pin' && box.entryId
        ? getJournalEntryIncludingDeleted(box.entryId)
        : null;
      resizeStart = {
        w: box.w, h: box.h, aspect: box.h / box.w, kind: box.kind,
        // null for every non-pin box, so the branch below cannot reach them.
        pinAspect: box.kind === 'page-pin' ? pinAspectFor(pinnedEntry) : null,
      };
      // FX7 S7 — see activeResizeIdRef's own header comment (above, near
      // measureEls): the auto-grow reflow-floor effect stands down for
      // THIS box id until the drag ends (finish(), below).
      activeResizeIdRef.current = boxId;
      if (activePointerId != null) { try { canvas.setPointerCapture(activePointerId); } catch { /* gone */ } }
    };

    const finish = (commit: boolean) => {
      clearTimer();
      if (activePointerId != null && canvas.hasPointerCapture(activePointerId)) {
        try { canvas.releasePointerCapture(activePointerId); } catch { /* already released */ }
      }
      // FX8 S3 — `finish` is the ONE shared exit for every gesture this
      // effect drives (a plain click that never crossed the drag threshold,
      // a committed move, a committed resize, or a cancel/revert of either)
      // — clearing here unconditionally is safe and correct: it's already
      // false for a plain click (beginMove was never called), and a no-op
      // React state set when already false costs nothing.
      setIsDragging(false);
      if (commit && (phase === 'dragging' || phase === 'resizing') && boxesRef.current !== startBoxes) {
        lastActionRef.current = { type: phase === 'dragging' ? 'move' : 'resize', before: startBoxes };
        setCanUndo(true);
      } else if (!commit && (phase === 'dragging' || phase === 'resizing')) {
        setBoxes(startBoxes); // release outside canvas / cancel: revert to the pre-gesture snapshot
      }
      // FX7 S7 — re-arm the reflow-floor effect for this box. Its own
      // useLayoutEffect deps are `[boxes, pageWidthPx, popupBoxId]` — a
      // bare ref clear does NOT retrigger it (refs are invisible to a deps
      // array), and the COMMIT path above never itself calls setBoxes (the
      // box's own final position/size was already committed incrementally
      // by onMove, before this ever runs) — so without an explicit nudge
      // here, a box resized right up against its own content floor would
      // never get its one final reconciliation pass at all. A shallow
      // clone is enough: same content, new array reference, so the effect
      // re-evaluates this box (now that activeResizeIdRef no longer skips
      // it) on the very next render.
      const wasResizing = phase === 'resizing';
      if (phase === 'resizing' || phase === 'dragging') { lastGestureEndRef.current = performance.now(); clearBoardSelection(); }
      phase = 'idle';
      delete canvas.dataset.resizing;
      movingIds = [];
      resizingId = null;
      resizeStart = null;
      activeResizeIdRef.current = null;
      if (wasResizing) setBoxes(prev => prev.slice());
    };

    const onDown = (e: PointerEvent) => {
      if (popupBoxIdRef.current) return; // the card popup is open — board gestures stand down
      const target = e.target as HTMLElement;
      setStartersFaded(true);   // BOARD CLICK-TO-CREATE: the empty board's starters fade on the first press anywhere on the board

      // FX7 S8 — root-caused live (not guessed): the layer-toggle button's
      // own `onMouseDown={e => e.stopPropagation()}` (below, in the card's
      // JSX) fires on the MOUSEDOWN compatibility event, which is too late
      // to matter — this native `pointerdown` listener (capture-phase on
      // the canvas itself) always runs FIRST, and previously fell straight
      // through into the general "select + arm a pending drag + capture
      // the pointer immediately" branch below with no knowledge the press
      // actually landed on the toggle. Once capture engages, the SAME
      // retargeting S5's own fix addresses (above) also swallows the
      // button's own subsequent `click` — Chromium never even invokes the
      // button's onClick, because the retargeted event's propagation path
      // no longer passes through it at all. Confirmed live: a genuinely
      // trusted press-then-click on the toggle produced pointerdown/
      // mousedown correctly targeting `.board-layer-toggle`, then mouseup/
      // click BOTH retargeted to `.board-canvas` — the card's own z never
      // changed. This mirrors the EXISTING `.board-pin-grab` early-return
      // immediately below (the established pattern in this exact function
      // for "a control inside a card needs its own untouched click, not
      // the canvas's own select/drag machinery") — stand down whole, let
      // the click proceed natively to the button's own onClick.
      if (target.closest('.board-layer-toggle, .board-step-help')) return;   // W3: the step "?" inside a card needs its own untouched click, like the layer toggle

      // THE GREEN TACK IS RETIRED (connector-a): there is no pin to press. A card is connected from its corner square (below).
      const handleEl = target.closest('.board-handle') as HTMLElement | null;
      const boxEl = target.closest('.board-box') as HTMLElement | null;

      // Connection mode owns every press (see cDown); this is belt and braces for a press that arrives before its listeners do.
      if (connect) return;

      // BIG PROJECTS STEP 3 (3a) - THE GRAFT KNOB: a second door into the SAME connection mode, from the selected card's right edge. A press on it is
      // never a resize and never a move (it is a different hit target from the corner square); a press-drag lands on a card (a connection box) or a
      // rail row / thumbnail (a page link) exactly as the corner's held gesture does.
      const knobEl = target.closest('.board-graft-knob') as HTMLElement | null;
      if (knobEl) {
        const kBox = target.closest('.board-box') as HTMLElement | null;
        const kId = kBox?.dataset.boxId;
        if (!kId || kId !== selectedIdRef.current || e.button !== 0) return;
        e.preventDefault(); e.stopPropagation();
        clearBoardSelection();
        enterConnect(kId, true, e, 'knob');
        return;
      }

      if (handleEl && boxEl) {
        const boxId = boxEl.dataset.boxId!;
        if (boxId !== selectedIdRef.current) return; // handle only active on the selected box
        // CONNECTOR-A - THE CORNER SQUARE'S TWO NEW DOORS. Right-click: connection mode, button held. Double-click: a SECOND press at the same spot, soon after the first, with the pointer
        // unmoved in between (a first press that went on to RESIZE does not count - that is the writer resizing twice, and the card-resize-relock law below still holds for it).
        if (e.button === 2) { e.preventDefault(); enterConnect(boxId, true, e); return; }
        if (e.button !== 0) return;
        {
          const now = performance.now();
          if (handleClick && handleClick.boxId === boxId && now - handleClick.t < 450 && !handleClick.moved && Math.hypot(e.clientX - handleClick.x, e.clientY - handleClick.y) <= 4) {
            handleClick = null; e.preventDefault(); enterConnect(boxId, true, e); return;
          }
          handleClick = { t: now, x: e.clientX, y: e.clientY, moved: false, boxId };
        }
        // CARD RESIZE RELOCK — no selection already on the board may turn this press into a native drag (see clearBoardSelection above).
        clearBoardSelection();
        startX = e.clientX; startY = e.clientY; ptype = e.pointerType; activePointerId = e.pointerId;
        try { canvas.setPointerCapture(activePointerId); } catch { /* gone */ }
        beginResize(boxId);
        return;
      }

      if (!boxEl) {
        // RULING (Fable, Oct 14): with a card selected, the FIRST empty-space press only deselects - it makes nothing. The next press, with nothing selected, is the one that creates.
        const hadSelectedCard = selectedIdRef.current != null;
        setSelectedId(null);   // unchanged: a press on empty space deselects the selected card
        // BOARD CLICK-TO-CREATE: ...and, on GENUINELY empty canvas (the press landed on the canvas itself - not a door, a hairline, the resize handle or anything laid over it) with nothing selected, begins a card.
        if (!hadSelectedCard && createAllowedRef.current && target === canvas && (e.pointerType !== 'mouse' || e.button === 0)) {
          e.preventDefault();   // no native text-selection drag starting under the card being sized
          createOrigin = { x: e.clientX, y: e.clientY };
          createDragged = false;
          activePointerId = e.pointerId; startX = e.clientX; startY = e.clientY; ptype = e.pointerType;
          phase = 'creating';
          try { canvas.setPointerCapture(activePointerId); } catch { /* gone */ }
          showGhost(e.clientX, e.clientY);
        }
        return;
      }

      const boxId = boxEl.dataset.boxId!;
      clearBoardSelection(); // CARD RESIZE RELOCK — a press on a card body never lands inside a selection a gesture left behind
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
      if (phase === 'creating') {
        if (!createDragged && Math.hypot(e.clientX - startX, e.clientY - startY) > MOUSE_DRAG_THRESHOLD) createDragged = true;
        if (createDragged) e.preventDefault();
        showGhost(e.clientX, e.clientY);
        return;
      }
      // a press on the corner that has gone on to move is a resize, not the first half of a double-click
      if (handleClick && !handleClick.moved && Math.hypot(e.clientX - handleClick.x, e.clientY - handleClick.y) > 3) handleClick.moved = true;
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
        const dxRaw = (e.clientX - startX) / pageWidthPx;
        const dyRaw = (e.clientY - startY) / pageWidthPx;
        const ids = new Set(movingIds);
        // FX17 S3 (SV22) — THE HARD STOP, applied to the DELTA rather than to
        // each box. Clamping per box (the way the x-axis's own Math.max(0, …)
        // does) would let the lowest card in a multi-card selection hit the floor
        // while the others kept travelling — the selection would visibly deform
        // as it landed. Clamping the shared dy holds the group's shape: every
        // card stops at the same instant, which is what "a hard stop with no
        // rubber-banding" has to mean for more than one card.
        //
        // The bound is the lowest moving card's BOTTOM against
        // BOARD_MAX_Y - BOARD_BREATHING_ROOM (see those constants).
        //
        // The Math.max(0, …) is load-bearing, not defensive noise. A card can
        // already sit BELOW the limit without ever having been dragged there — an
        // older save from before this constant existed, or a deck load that placed
        // it. For such a card dyLimit is NEGATIVE, and clamping straight to it
        // would force the card UPWARD the instant the writer touched it, even
        // while dragging sideways: a silent correction of their layout, which is
        // worse than the unbounded growth this slice replaces. Flooring the bound
        // at 0 means such a card simply cannot travel FURTHER down, while still
        // moving freely up and sideways. A stop, never a correction — and no card
        // is ever relocated by the arrival of a limit.
        const movingStart = startBoxes.filter(b => ids.has(b.id));
        const lowestBottom = Math.max(...movingStart.map(b => b.y + b.h));
        const dyLimit = (BOARD_MAX_Y - BOARD_BREATHING_ROOM) - lowestBottom;
        const dy = Math.min(dyRaw, Math.max(0, dyLimit));
        // ITEM 118 (c) — THE RIGHT EDGE GETS THE SAME HARD STOP THE BOTTOM HAS.
        // FX17 S3 above fixed the DOWNWARD travel and said so in its own first
        // sentence — "the way the x-axis's own Math.max(0, …) does" — leaving
        // sideways travel with a lower bound and no upper one at all. Measured
        // on a populated board (item 118 S0 pass 3, Nick's own stage): a card
        // dragged 900px right ended up hanging 750px PAST the canvas, with the
        // canvas width unchanged at 1500. That is defect (c): "cards moved to
        // the board's edge begin to DISAPPEAR."
        //
        // WHY THE TWO AXES ARE NOT THE SAME BUG, measured rather than assumed.
        // The canvas HEIGHT is content-driven and grows to fit (the same probe
        // watched it go 1455 -> 2070px to contain a card dragged down, which is
        // why the bottom needed a far-away cap rather than a fitted one). The
        // WIDTH cannot grow: it is pageWidthPx, the container's width or the
        // writer's own canvasW override. So a card past the right edge is
        // outside a board that will never reach it — permanently clipped,
        // unreachable, and gone from the writer's view.
        //
        // The bound is therefore the canvas's own right edge, which in these
        // units is exactly 1 (x and w are both fractions of pageWidthPx).
        // Everything else here is FX17 S3's shape, deliberately: clamped on the
        // SHARED delta so a multi-card selection holds its shape instead of
        // deforming as its rightmost card lands, and floored at 0 so a card
        // already sitting past the edge — an older save, a deck load — is never
        // yanked back the instant the writer touches it. A stop, never a
        // correction; no card is relocated by the arrival of a limit.
        const rightmost = Math.max(...movingStart.map(b => b.x + b.w));
        const dxLimit = 1 - rightmost;
        const dx = Math.min(dxRaw, Math.max(0, dxLimit));
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
          // ITEM 138 — A PAGE-PIN TAKES ITS KIND'S ASPECT THE MOMENT IT IS
          // RESIZED. This supersedes AB4 S4's freeform-both-axes for this box
          // kind (that comment is marked at its own site).
          //
          // CONSTRAIN FORWARD, NEVER SNAP — and this line is where the whole
          // distinction lives. The lock is applied ONLY here, inside a resize the
          // writer is performing: not on load, not on a move, not when a limit
          // arrives. An existing wide card opens exactly as it was left and keeps
          // its stored geometry indefinitely; it takes the shape at the moment the
          // writer themselves changes that shape. "Resized only" counts as
          // touched (Nick's ruling) — a move alone is not a touch, which is why
          // this is in the resizing branch and nowhere near the moving one.
          //
          // The aspect is the KIND's canonical one, not the card's own captured
          // aspect (which is what `ink` preserves above): the point is to bring a
          // hand-widened page card back to the page silhouette, not to preserve
          // whatever it currently is.
          if (b.kind === 'page-pin' && resizeStart!.pinAspect != null) {
            // CARD-RESIZE-AXIS (Nick, Oct 15 3:18am): the card KEEPS its proportions - only its size changes - but the size follows the pointer on BOTH axes. The lock used to read dx alone, so a
            // sideways drag grew the (tall) card mostly downward, a vertical drag did nothing, and the corner ran away from the pointer. Now: the corner's target is where the pointer has taken it
            // (the corner moves by dx, dy). THE AXIS THE POINTER HAS MOVED MORE DRIVES THE SIZE (Fable, round 2: projecting the drag onto the diagonal made a sideways drag sluggish - 140px right
            // gave +48px wide - so the corner lagged the hand): the width changes by dx, or by dy / aspect, whichever has the larger MAGNITUDE (its own sign - so a drag that is mostly up shrinks it even
            // while it also moves right); the height follows at the aspect. The corner then stays UNDER THE POINTER on the dominant axis, and exactly on it for a drag along the diagonal.
            // MIN_PIN_H and the min width both floor it (the height floor implies a width floor at this aspect).
            const a = resizeStart!.pinAspect;
            const dyFrac = (e.clientY - startY) / pageWidthPx;
            // A DELTA from the start size, so an outward drag can never SHRINK an older, differently shaped card (item 138's grandfathered wide ones): it takes its kind's shape at the first pixel and grows.
            const byX = dx, byY = dyFrac / a;
            const toward = resizeStart!.w + (Math.abs(byX) >= Math.abs(byY) ? byX : byY);
            const w = Math.max(minW, MIN_PIN_H / a, toward);
            return { ...b, w, h: Math.max(MIN_PIN_H, w * a) };
          }
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
      if (phase === 'creating') { finishCreate(true, e); return; }
      finish(true);
    };
    const onCancel = () => {
      // A genuine pointercancel (not a plain release) always disarms
      // without ever committing — never trust wherever the OS happened to
      // report the pointer at cancel time.
      if (phase === 'creating') { finishCreate(false); return; }   // a touch drag that turned into a native scroll cancels the card, cleanly
      finish(false);
    };

    connectEndRef.current = endConnect;
    document.addEventListener('contextmenu', onCtx, true);
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove, { passive: false });
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onCancel);
    canvas.addEventListener('dragstart', onDragStart);
    return () => {
      clearTimer();
      canvas.removeEventListener('dragstart', onDragStart);
      endConnect();
      clearFlashTimers();
      delete canvas.dataset.resizing;
      document.removeEventListener('contextmenu', onCtx, true);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onCancel);
      // FX11 S1 (FX8 review A1) — a viewport resize changes pageWidthPx, which
      // re-runs this effect: the old listeners are torn down here and fresh ones
      // (a new closure, phase='idle') re-attached. Without clearing the flag, a
      // resize MID-DRAG left the React `isDragging` state true with no live
      // gesture to ever call finish() and clear it — leaving data-dragging='true'
      // on the canvas and every face stuck cursor:grabbing until the next drag
      // completed. Clearing it in the cleanup makes the re-attach start at rest.
      // (A no-op when no drag is in flight — React bails on an unchanged value.)
      setIsDragging(false);
    };
  }, [pageWidthPx, boardMode === 'open']);   // a Deck mounts in the Walk (no canvas: this effect bails at `if (!canvas) return`); re-attach when Open arrives, as the wrap effects above (walk-open-select.mjs)

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
        // CONNECTOR-A - Esc cancels connection mode (the pointer effect owns the mode, so it is asked to end it).
        if (threadArmedFromRef.current != null) {
          connectEndRef.current?.();
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
        return;
      }
      // BOARD CONTEXT MENU: Ctrl+Z / Cmd+Z undoes the board's last act (the toast on a deleted card names it). Typing anywhere editable keeps its own undo.
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'z') {
        const ae = document.activeElement as HTMLElement | null;
        const editable = !!ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.tagName === 'SELECT' || ae.isContentEditable);
        if (editable) return;
        e.preventDefault();
        undoRef.current();
        return;
      }
      // THE ROW IS GONE (Nick, Oct 15): the key is how a card is removed. A selected hairline takes the key first (above); typing anywhere editable never reaches this; a modified press is not a delete.
      // CONNECTOR-A: while connection mode is on the key belongs to the mode (a selected line, handled above) - it must never delete the card the mode is running from, or that card's links with it
      if ((e.key === 'Delete' || e.key === 'Backspace') && threadArmedFromRef.current == null && selectedIdRef.current && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const ae = document.activeElement as HTMLElement | null;
        const editable = !!ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.tagName === 'SELECT' || ae.isContentEditable);
        if (editable) return;
        e.preventDefault();
        removeSelectedRef.current();
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

  // ITEM 133 — THE RENAME STATE LIVES HERE, WITH EVERY OTHER HOOK, and above
  // the early return below. It was first written beside the `title` derivation
  // it serves — which reads better and is wrong: `if (!initialEntry) return
  // null` sits between, so on a render where the board's row is missing these
  // two useState calls would not run and React would see fewer hooks than the
  // render before. That is error #300 and the whole tree blanked — item 104's
  // class exactly. hooks-order.mjs caught it here rather than a writer finding
  // it when a board is deleted on another device mid-session.
  //
  // The lesson worth keeping beside the code: state belongs with the HOOKS,
  // not with the feature it describes. Proximity to its own feature is the
  // pull that put it in the wrong place.
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  if (!initialEntry) return null;

  // FX4 S4 — "minimums = content extents": the canvas can never be dragged
  // shorter than what the current layout actually needs; the persisted
  // override (once set) can only make it TALLER than that floor, never
  // shorter. contentMinHeightPx is the SAME formula the pre-FX4 auto-height
  // always used — byte-identical when canvasOverrideH is null.
  // FX17 S2 (SV21) — THE BOARD REACHES ITS FLOOR. Measured before the change,
  // at the 1366x768 leg: the stage ended at y=722 and the wrap at y=683, so 39px
  // of granted room went unused and the board visibly "stopped short". The cause
  // is that the canvas's floor was a FIXED CONSTANT (VIEWPORT_MIN_PX, 560) while
  // the wrap carries `maxHeight` rather than `height` — so with little content
  // the wrap shrink-wrapped to 560 and simply declined the room FX13 had already
  // measured for it. FX13 computed the room; nothing spent it.
  //
  // So the floor becomes the ROOM, when the room is known: availHeightPx is the
  // stage's own remaining height (see its effect above). Legacy (<1100px, no
  // DeskFrame) has no stage, availHeightPx stays null, and the constant floor is
  // kept — that path is byte-identical to pre-FX17.
  //
  // This deliberately does NOT reintroduce the S1 loop, and the reason is
  // structural rather than tuned: `avail` is measured from the STAGE's bottom
  // minus the WRAP's TOP, and observed on the stage (FX13's own guard, whose
  // comment states the wrap's height can never feed back into it). The stage is
  // `flex:1; min-height:0`, sized by the flex column and not by this content, and
  // the wrap's TOP does not move when its own height changes. So canvas height
  // depends on the room, and the room does not depend on the canvas height —
  // an acyclic edge, unlike S1's width<->height cycle. Re-verified empirically on
  // the frame clock all the same, because that is this ticket's standard.
  // The border term, and why it is not a fudge: `availHeightPx` is the wrap's
  // OUTER height (it is applied as `maxHeight`, and the wrap is border-box), so
  // the content box it actually offers is 2px smaller — 1px of border top and
  // bottom, declared on the wrap's own inline style below. Flooring the canvas at
  // the outer height therefore overflowed by exactly 2px and left the board with
  // a permanent, pointless 2px scroll (measured: scrollHeight 599 vs clientHeight
  // 597). A board that always has something to scroll has not reached its floor.
  // Subtracting the border here — rather than measuring the wrap's clientHeight —
  // keeps the dependency acyclic: clientHeight would shrink when a HORIZONTAL
  // scrollbar appeared, which is the same feedback shape S1 just closed on the
  // other axis, and would have re-opened it.
  const WRAP_BORDER_PX = 2;
  const contentMinHeightPx = Math.max(
    (maxBottom(boxes) + 0.08) * pageWidthPx,
    availHeightPx != null ? availHeightPx - WRAP_BORDER_PX : VIEWPORT_MIN_PX,
  );
  const canvasHeightPx = canvasOverrideH != null ? Math.max(canvasOverrideH, contentMinHeightPx) : contentMinHeightPx;
  // B1 — a system Board never has a project (S1), so the pre-B1 fallback
  // ('/journal') would send BOTH system Boards' own "Done" to the SAME
  // place — harmlessly circular for the Journal Board itself, but genuinely
  // WRONG for the Trash Board (it would land on the Journal Board instead
  // of anywhere sensible). Home ('/') is the correct, uniform fallback for
  // a page with no project and no natural "up" — the exact same reasoning
  // PageEditor.tsx's own backTo already applies to a loose-origin page.
  const backTo = project ? `/project/${project.id}` : isSystemBoard ? '/' : '/journal';
  // ITEM 133 — one derivation (store/entryText.ts's boardName), not this file's
  // own third reading of the same field.
  const title = boardName(initialEntry.text, 'Untitled');
  // ITEM 133 — commit through the EXISTING store path. `patchJournalEntry`
  // takes the current text and the changes, so the rename is an ordinary edit
  // of an ordinary field; nothing here is a naming-specific pipe.
  const commitRename = () => {
    const next = nameDraft.trim();
    setRenaming(false);
    if (!next) return;                       // empty reverts: the old name stands
    const live = getJournalEntry(id);
    if (!live || next === boardName(live.text, 'Untitled')) return;
    patchJournalEntry(id, next, {});
  };


  // AB4 S3 / FX4 S4 — connection and board-meta boxes are never positioned
  // cards: filtered out of the positioned-card render loop (they never
  // carry a real x/y/w/h) — connections draw as a separate SVG layer
  // (endpoints derived LIVE from the current boxes, so a drag/resize drags
  // the hairline with it for free); board-meta renders nothing at all (its
  // only job is carrying the canvas's own persisted dimensions).
  // PW1 S3 (item 125) — MEMBERSHIP IS NOT DISPLAY. A page-pin whose membership
  // is explicitly NOT displayed is withheld from the canvas here, at the one
  // gate every card already passes through. ABSENCE MEANS DISPLAYED: the test
  // is `=== false`, never falsiness, so every pin written before this field
  // existed (undefined) still renders — every already-arranged board reads
  // UNCHANGED on first launch, with no backfill and no migration. The card is
  // withheld from the WALL only; the membership itself is untouched and still
  // lists everywhere memberships list.
  const visibleBoxes = boxes.filter(b => b.kind !== 'connection' && b.kind !== 'board-meta'
    && !(b.kind === 'page-pin' && b.onCanvas === false));
  const connections = boxes.filter(b => b.kind === 'connection');
  const sorted = visibleBoxes.slice().sort((a, b) => a.z - b.z);

  // BG1 S1 — the board's beginnings. One door table, read per mode; the row
  // itself is BeginningsRow.tsx, shared with the page (S3's "one grammar").
  //
  // System boards (Journal/Shelf/Trash) render NO row — the same absent-not-
  // disabled law every Add-family control on this surface already carries (a
  // system board's cards are DERIVED; there is nothing here for a writer to
  // begin). Their declarative empty lines stay exactly as they were.
  //
  // A paired plan board is an ordinary board and takes OPEN's row through this
  // same table — no plan-board branch exists or should.
  //
  // No Import/Upload door: the Reference Seal doesn't exist yet, and a door
  // that opens on nothing is the dead end this ticket removes.
  const beginningDoors: BeginningDoor[] = isSystemBoard ? [] : (
    boardMode === 'storyboard'
      ? [
          { key: 'loadDeck', label: t('beginLoadDeck'), onOpen: onAddFromDeck },
          { key: 'newLane', label: t('beginNewLane'), onOpen: onAddLane },
          { key: 'newCard', label: t('beginNewCard'), onOpen: onAddCard },
        ]
      : boardMode === 'outline'
        ? [
            { key: 'newCard', label: t('beginNewCard'), onOpen: onAddCard },
            { key: 'loadDeck', label: t('beginLoadDeck'), onOpen: onAddFromDeck },
          ]
        : [
            // BIG PROJECTS step 2: New Card, Templates, Connect Pages - NO New Page on a board (a page is made from the Pages tab; this door's old act is parked below, verbatim):
            //   (the New Page door: label beginNewPageCard, handler onAddPageCard - still the sliver's own tool)
            { key: 'newCard', label: t('beginNewCard'), onOpen: onAddCard },
            { key: 'loadDeck', label: t('beginLoadDeck'), onOpen: onAddFromDeck },
            { key: 'connectPage', label: t('beginConnectPage'), onOpen: () => setExistingPageOpen(true) },
          ]
  );

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
  // B1 S4 — the Trash Board's own Restore, joining the row's existing
  // conditional buttons exactly the way ungroup/Edit-copy already do.
  // THE ROW NEVER MOVES THE CANVAS (Fable, Oct 15; page-primacy applied to the board; its PLACE is superseded by the INTERIM note below - it now sits inside the canvas). It used to sit IN FLOW above the canvas, so selecting any card mounted it and pushed the canvas down
  // by its own height (about 45px: Chat 1 measured the new card landing 45px below the press). It is an OVERLAY now: absolutely positioned, right-aligned, growing UP from the canvas's top edge
  // out of a zero-height slot (boardBody, below), over the quiet gap above the canvas - it adds no height whether it is there or not. Its own ground keeps it legible over what it overlaps.
  // The "Remove" button is DELETED (Nick, Oct 15): removing a card is the Delete key now (and a context menu is coming). The row survives ONLY for the conditional actions that have no other door yet - Ungroup, Edit copy, Restore (Trash), Pin to a Board (Shelf) - so an ordinary card shows NO row at all.
  // BOARD CONTEXT MENU (Nick approved the mockup, Oct 15): the interim action row is DELETED. Its actions - Ungroup, Edit copy, Restore (Trash), Pin to a Board… (Shelf) - are the top of the CARD menu,
  // where they apply; a separator; Delete last. A right-click on empty board offers New Card and Delete board. A right-click on a card's corner square stays connection mode (the pointer effect owns it).
  const openCardMenu = (x: number, y: number, boxId: string) => {
    const box = boxesRef.current.find(b => b.id === boxId);
    if (!box || box.kind === 'connection' || box.kind === 'board-meta') return;
    const items: ContextMenuItem[] = [];
    if (box.groupId) items.push({ label: t('ctxUngroup'), onSelect: ungroup });
    if (box.kind === 'text' && box.sourceEntryId) items.push({ label: t('boardEditCopy'), onSelect: () => setPopupBoxId(box.id) });
    // W5 - the writer's finished-mark, on a Deck's text cards: "Mark lit" / "Unmark" (Flux [LOCK] / [UNLOCK]) - the same door as the Walk's, last of the card's own acts
    if (deckBoard && box.kind === 'text' && !isSystemBoard) items.push({ label: isLit(box) ? t('walkUnlit') : t('walkLit'), onSelect: () => toggleLit(box) });
    if (systemKind === 'trash' && box.kind === 'page-pin' && box.entryId) items.push({ label: t('boardRestore'), onSelect: () => restoreSelected(box.entryId!) });
    if (systemKind === 'trash' && box.trashedFrom) {
      const from = box.trashedFrom;
      items.push({ label: t('boardRestore'), onSelect: () => { restoreDeletedBox(from.boardId, from.boxId); setSelectedId(null); flushNow(); actionToast.show(t('toastCardRestored')); } });
    }
    if (systemKind === 'shelf' && box.kind === 'page-pin' && box.entryId) items.push({ label: t('pageFacePin'), onSelect: () => setShelfPinEntryId(box.entryId!) });
    const deletable = !isSystemBoard;
    const purgeable = systemKind === 'trash' && !!box.trashedFrom;
    // DELETE FOR GOOD: a trashed PAGE or board, like a trashed card, can now be deleted for good from Trash - and it always asks
    const purgeablePage = systemKind === 'trash' && box.kind === 'page-pin' && !!box.entryId && !box.trashedFrom;
    if (items.length > 0 && (deletable || purgeable || purgeablePage)) items.push(null);
    if (deletable) items.push({ label: t('ctxDelete'), onSelect: () => removeSelectedRef.current() });
    // Trash only: a permanent delete of a trashed CARD leaves an id-only marker. It always asks - it is the one delete that cannot be undone.
    if (purgeable) items.push({ label: t('ctxDelete'), onSelect: () => requestDelete(() => { purgeDeletedBox(box.trashedFrom!.boardId, box.trashedFrom!.boxId); setSelectedId(null); flushNow(); }, { title: t('deleteDialogPurgeTitle'), always: true }) });
    if (purgeablePage) items.push({ label: t('ctxDelete'), onSelect: () => requestDelete(() => { purgeEntry(box.entryId!); setSelectedId(null); flushNow(); }, { title: t('deleteDialogPurgeTitle'), always: true }) });
    openContextMenu(x, y, items);
  };
  const openBoardMenu = (x: number, y: number) => {
    // DELETE FOR GOOD: Trash's own menu - Empty Trash, naming the count, always asking; greyed while Trash is empty. Every other built-in
    // place keeps no board menu, as before.
    if (systemKind === 'trash') {
      const n = getDeletedEntries().length + getTrashedCards().length;
      const title = n === 1 ? t('emptyTrashQuestionOne') : t('emptyTrashQuestionMany').replace('{n}', String(n));
      openContextMenu(x, y, [{ label: t('ctxEmptyTrash'), disabled: n === 0, onSelect: () => requestDelete(() => { emptyTrash(); setSelectedId(null); flushNow(); }, { title, always: true }) }]);
      return;
    }
    if (isSystemBoard) return;
    const items: ContextMenuItem[] = [
      { label: t('beginNewCard'), onSelect: () => {
        const cv = canvasRef.current;
        if (!cv) return;
        const cr = cv.getBoundingClientRect(), W = cr.width || pageWidthPx;
        const w = Math.min(NEW_CARD_W, 1), h = NEW_CARD_H;
        const px = Math.min(Math.max((x - cr.left) / W, 0), Math.max(1 - w, 0));
        const py = Math.min(Math.max((y - cr.top) / W, 0), Math.max(BOARD_MAX_Y - BOARD_BREATHING_ROOM - h, 0));
        const maxZ = boxesRef.current.reduce((m, b) => Math.max(m, b.z), 0);
        const box: Box = { id: generateId(), kind: 'text', x: px, y: py, w, h, z: maxZ + 1, text: '' };
        freshEmptyIdsRef.current.add(box.id);   // like a click-made card: closed still empty, it is discarded
        setBoxes(prev => [...prev, box]);
        setSelectedId(box.id);
        setPopupBoxId(box.id);
      } },
      { label: t('ctxDeleteBoard'), onSelect: () => requestDelete(deleteThisBoard) },
    ];
    openContextMenu(x, y, items);
  };
  ctxActionsRef.current = { card: openCardMenu, board: openBoardMenu };

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
  const footerOn = true;   // CONNECTOR-A: "Show grafts" is RETIRED - the card footers are simply on (a board's old footerOn:false is ignored)
  const boxLabel = (b: Box): string => {
    if (b.kind === 'page-pin') {
      // B1 S4 — the deleted-inclusive read (see BoardPinBox's own comment):
      // a thread naming a since-deleted card should still read its real
      // title, not "Untitled."
      const entry = b.entryId ? getJournalEntryIncludingDeleted(b.entryId) : null;
      return entry ? (notecardExcerpt(entry.text).title || t('boardThreadUntitled')) : t('boardThreadUntitled');
    }
    return notecardExcerpt(b.text ?? '').title || t('boardThreadUntitled');
  };
  // CONNECTOR-B: every card's page / board / other-board links, in ONE scan of the cache (the footers draw on every render); linkTick re-reads it when any link changes
  void linkTick;
  const linkPeersByCard = getLinkPeersByCard(id, boxes);
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
      {/* CONNECTOR-B: the connector's arm and its tip, in a VIEWPORT overlay so the arm can reach the rail's thumbnails (the board canvas clips); client coordinates, placed imperatively by the pointer effect */}
      {threadArmedFrom != null && createPortal(
        <svg className="board-connect-overlay" aria-hidden="true">
          <line ref={previewLineRef} className="board-connect-arm" x1="0" y1="0" x2="0" y2="0" style={{ display: 'none' }} />
          <circle ref={armTipRef} className="board-connect-tip" r={3.5} cx="0" cy="0" style={{ display: 'none' }} />
        </svg>,
        document.body,
      )}
      <div ref={wrapRef} className="board-canvas-wrap" style={{ overflow: 'auto', maxHeight: availHeightPx != null ? availHeightPx : '78vh', border: '1px solid var(--ink-border)' }}>
        <div
          ref={canvasRef}
          className="board-canvas"
          data-thread-armed={threadArmedFrom != null ? 'true' : 'false'}
          data-dragging={isDragging ? 'true' : 'false'}
          style={{ position: 'relative', width: pageWidthPx, height: canvasHeightPx, background: 'var(--paper)' }}
          // PW1 S3 (item 125) — the DRAG half of the two display acts (Nick,
          // Q4): a membership row dragged from the rail's survey lands WHERE
          // DROPPED. The writer choosing the position is the whole reason
          // display is opt-in, so the drop point IS the act; nothing here
          // arranges on the writer's behalf.
          //
          // ONLY this board's own memberships are accepted. The payload names
          // its board, and a mismatch is ignored outright: dragging a row from
          // some OTHER board's survey onto this canvas would be moving a card
          // between boards, which is CARD TRANSFER (item 123, still unbuilt) —
          // and a display act must never quietly become one.
          onDragOver={(e) => { if (e.dataTransfer.types.includes(SURVEY_DRAG_TYPE)) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; } }}
          onDrop={(e) => {
            const payload = e.dataTransfer.getData(SURVEY_DRAG_TYPE);
            if (!payload) return;
            const sep = payload.indexOf(':');
            if (sep < 0) return;
            const [srcBoardId, entryId] = [payload.slice(0, sep), payload.slice(sep + 1)];
            if (srcBoardId !== id || !entryId) return;
            e.preventDefault();
            // Normalized exactly as the RENDERER reads it, which is the only
            // definition that matters: this file's own box style is
            // `left: box.x * pageWidthPx, top: box.y * pageWidthPx` — BOTH axes
            // divide by the WIDTH. `y` is therefore a fraction of the width,
            // NOT of the height, and it legitimately exceeds 1 on a canvas
            // taller than it is wide. Dividing y by rect.height here would have
            // landed every dropped card near the top of the board, which looks
            // like a placement bug and is really a denominator bug.
            const rect = e.currentTarget.getBoundingClientRect();
            if (rect.width <= 0) return;
            // Clamp by the card's OWN measure, so a card dropped at the very
            // edge still lands wholly on the board rather than half outside it.
            const pin = boxes.find(b => b.kind === 'page-pin' && b.entryId === entryId);
            const w = pin?.w ?? 0;
            const h = pin?.h ?? 0;
            const x = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), Math.max(1 - w, 0));
            const y = Math.min(Math.max((e.clientY - rect.top) / rect.width, 0), Math.max(rect.height / rect.width - h, 0));
            setPinDisplayed(id, entryId, true, { x, y });
          }}
          onDoubleClick={(e) => {
            // FX7 S5 — root-caused live (not guessed): `e.target` here is
            // NOT reliable — `onDown` below (FX5 S4(a)'s own drag-friction
            // fix) calls `canvas.setPointerCapture()` on the VERY FIRST
            // pointerdown of ANY card click, so by the time the second
            // click's native `dblclick` fires, the browser has already
            // retargeted it (and its own `mouseup`/`click` predecessors) to
            // THIS canvas element — never the card the writer actually
            // double-clicked. Confirmed with a genuinely trusted CDP
            // double-click (isTrusted:true): `e.target.closest('.board-box')`
            // resolved to null every time, on EVERY card (dealt or
            // hand-typed alike — not a deck-specific defect at all), which
            // is exactly Nick's "double clicking on them did nothing."
            // `document.elementFromPoint` sidesteps the retargeting
            // entirely with a fresh hit-test at the event's own
            // coordinates — the SAME technique this file's own
            // `finishThreadDrag` (above) already uses for the identical
            // reason.
            const hitEl = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
            // CARD-RESIZE-RELOCK (Nick, 2026-10-13): a quick second press on the corner after a resize is, to the browser, the
            // second click of a double-click - and it lands HERE (the canvas holds the pointer). It opened the card's popup, and
            // with a popup open every board gesture stands down: the card read as "locked" until he clicked another card or
            // double-clicked in and out. So: a double-click on the resize corner opens nothing (CONNECTOR-A: the corner's double-click now
            // ENTERS CONNECTION MODE in the pointer effect, on the second pointerdown - so by the time the browser's dblclick lands here the mode has it, and this guard
            // REPLACES the old 'no action of its own' with 'the action is not an edit'), and a double-click whose second press made a resize or a move is that gesture's own
            // click, never a request to edit.
            // (The browser fires dblclick straight after its own second mouseup, so a gesture's own double-click arrives within
            // milliseconds of the gesture's end; 100ms catches it, and a writer's REAL double-click a moment after a drag - fx8 S3's
            // ~220ms, say - still opens the card.)
            if (hitEl?.closest('.board-handle, .board-step-help, .board-step-pop')) return;   // W3: a double-click on the step "?" (or in its popover) opens nothing
            if (performance.now() - lastGestureEndRef.current < 100) return;
            const boxEl = hitEl?.closest('.board-box') as HTMLElement | null;
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
            style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: threadArmedFrom != null ? 100000 : undefined }}
            aria-hidden="true"
          >
            {/* CONNECTOR-A: a line is drawn ONLY in connection mode - this card's own same-board links, corner circle to corner circle - or, for a moment, the one just made.
                The canvas wrap clips them to the board. */}
            {(() => {
              const anchor = (b: Box) => ({ x: (b.x + b.w) * pageWidthPx, y: (b.y + b.h) * pageWidthPx });
              const out: JSX.Element[] = [];
              if (threadArmedFrom != null) {
                const src = boxes.find(b => b.id === threadArmedFrom);
                if (src) {
                  const from = anchor(src);
                  connections.forEach(conn => {
                    if (conn.connA !== src.id && conn.connB !== src.id) return;
                    const other = boxes.find(b => b.id === (conn.connA === src.id ? conn.connB : conn.connA));
                    if (!other) return;
                    const to = anchor(other);
                    const selected = conn.id === selectedConnectionId;
                    out.push(
                      <g key={conn.id} data-connection-id={conn.id}>
                        <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} className="board-connection-hit"
                          style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                          onClick={() => { setSelectedConnectionId(conn.id); }} />
                        <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} className="board-connection-line" data-selected={selected ? 'true' : 'false'} />
                      </g>,
                    );
                  });
                }
              } else if (connectFlash && connectFlash.line && !connectFlash.off) {
                const a = boxes.find(b => b.id === connectFlash.a), b = boxes.find(b => b.id === connectFlash.b);
                if (a && b) {
                  const p = anchor(a), q = anchor(b);
                  out.push(<line key="flash" x1={p.x} y1={p.y} x2={q.x} y2={q.y} className="board-connection-line" data-selected="false" />);
                }
              }
              return out;
            })()}
          </svg>
          {/* FX6 S2c — the empty board's own quiet one-line pointer at
              both board-side tools (this canvas carried NO empty-state
              copy at all before this ticket).
              B1 S3 — suppressed on a system Board: neither tool it names
              exists there (Add is absent, whole), so the pointer would name
              doors that aren't in the room. An empty system Board (the
              Trash Board, most days) stays quiet instead — no text at all,
              matching the anti-solicitation law's own instinct rather than
              inventing a system-board-specific message nothing asked for. */}
          {/* B2 S2 — the Shelf Board's own empty state is the ONE exception
              to "an empty system Board stays quiet": "one quiet fact," per
              S2's own words, not the ordinary board's tool-naming line
              (which would name tools the Shelf structurally never has). */}
          {/* BG1 S1 — the row REPLACES FX6 S2c's one-line pointer on an ordinary
              board: that line named two tools and pointed at the sliver; these are
              the doors themselves, in the room. Same gate (`sorted.length === 0`
              — the render list, so a lone board-meta/connection box never counts
              as furniture), same centered placement, same "gone the instant there
              is furniture." The fx6 check it falsifies is PARKED verbatim in
              fx6.mjs with its successor named in bg1.mjs (A4).
              B1 S3/B2 S2 are untouched: a system Board still shows no row at all,
              and the Shelf still carries its own one quiet fact. */}
          {sorted.length === 0 && !isSystemBoard && <BeginningsRow surface="board" doors={beginningDoors} faded={startersFaded} />}
          {/* BOARD CLICK-TO-CREATE - the ghost outline of the card being made; moved imperatively (no render per pointermove), never takes the pointer */}
          {!isSystemBoard && <div ref={ghostRef} className="board-create-ghost" aria-hidden="true" style={{ display: 'none' }} />}
          {sorted.length === 0 && systemKind === 'shelf' && <div className="board-canvas-empty" aria-hidden="true">{t('shelfBoardEmpty')}</div>}
          {sorted.map(box => {
          const selected = selectedIds.has(box.id);
          const boxConnections = footerOn ? connectionsFor(box.id) : [];
          const boxLinkPeers = footerOn ? (linkPeersByCard.get(box.id) ?? []) : [];   // CONNECTOR-B: page / board / other-board-card links join the same footer
          // CONNECTOR-A - the circle a card shows while it is the arm's target, a linked peer of the card in connection mode, or the far end of the link just made. Open = not linked, solid = linked.
          const inMode = threadArmedFrom != null;
          const linkedToSrc = inMode && connections.some(c => (c.connA === threadArmedFrom && c.connB === box.id) || (c.connB === threadArmedFrom && c.connA === box.id));
          const isTarget = inMode && connectTarget === box.id;
          const isPeer = inMode && linkedToSrc;
          const isFlashB = !inMode && connectFlash != null && connectFlash.b === box.id;
          const hasAnyLink = connections.some(c => c.connA === box.id || c.connB === box.id);
          const circleSolid = isTarget ? linkedToSrc : isPeer ? true : isFlashB ? (connectFlash!.off ? hasAnyLink : true) : false;
          const handleInMode = inMode && threadArmedFrom === box.id && !connectFromKnob;   // entered from the knob, the KNOB is the origin circle
          const handleInFlash = !inMode && connectFlash != null && connectFlash.a === box.id;
          const handleSolid = (handleInMode && connectTarget != null && connections.some(c => (c.connA === box.id && c.connB === connectTarget) || (c.connB === box.id && c.connA === connectTarget)))
            || (handleInFlash && (connectFlash!.off ? hasAnyLink : true));
          const showLayerToggle = selected && box.id === selectedId && isOverlapping;
          return (
            <div
              key={box.id}
              className="board-box"
              data-box-id={box.id}
              data-kind={box.kind}
              data-selected={selected ? 'true' : 'false'}
              data-grouped={box.groupId ? 'true' : 'false'}
              data-target={isTarget || isFlashB ? 'true' : 'false'}
              data-peer={isPeer ? 'true' : 'false'}
              data-overlapping={selected && box.id === selectedId && isOverlapping ? 'true' : 'false'}
              data-kindled={deckBoard && deckKindled.has(box.id) ? 'true' : undefined}
              data-lit={deckBoard && deckLit.has(box.id) ? 'true' : undefined}
              data-fx={deckRewards.kindling.has(box.id) ? 'kindle' : undefined}
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
                  typeStyle={cardTypeStyle(box.fontFace, box.fontSize)}
                  prompt={promptToShow(box)}
                />
              )}
              {/* W3 / W11a - the step's "?" at its title's end (components/StepHelp.tsx): only on a card DEALT from a Tier 1 deck (deckStep), never on a ported mirror. */}
              {box.kind === 'text' && box.deckStep && !box.sourceEntryId && <StepHelp box={box} />}
              {/* W5 - a kindled step on a Deck wears its quiet mark (Arbor: a bronze root line; Flux: the lit edge), and a step the writer marked lit wears her leaf. Both are overlays: no layout of their own. */}
              {deckBoard && box.kind === 'text' && deckKindled.has(box.id) && <KindleMark />}
              {deckBoard && box.kind === 'text' && deckLit.has(box.id) && <LitMark />}
              {/* CONNECTOR-A - the green tack is RETIRED. The circle below is the card's end of a link: shown only while the card is a target, a peer, or the far end of a link just made. */}
              <span className="board-tcircle" data-solid={circleSolid ? 'true' : 'false'} aria-hidden="true" />
              {/* B3 S1 — "Start Here" (R6's own hint): quiet, brass, present
                  only on the currently-armed deal's own first card, and
                  only until the writer's first genuine edit to ANY dealt
                  card (store/deckHint.ts owns the whole lifecycle; this is
                  a pure read). Never affects the card's own
                  editable/movable/deletable/taggable-ness (M1) — an
                  overlay, not a lock. */}
              {box.id === startHereCardId && (
                <div className="board-start-here-hint" data-start-here="true" aria-hidden="true">{t('deckStartHereLabel')}</div>
              )}
              {/* FX5 S5 — the connections footer: one quiet line per thread,
                  hidden whole when the board's own footer toggle is off. */}
              {(boxConnections.length > 0 || boxLinkPeers.length > 0) && (
                <div className="board-card-footer">
                  {boxConnections.map(other => (
                    <div key={other.id} className="board-card-footer-line">— {t('boardThreadPrefix')}: {boxLabel(other)}</div>
                  ))}
                  {boxLinkPeers.map(p => (
                    <div key={p.key} className="board-card-footer-line" data-link-peer-line={p.kind}>— {t('boardThreadPrefix')}: {p.label}</div>
                  ))}
                </div>
              )}
              {selected && canResize && box.id === selectedId && (
                <div
                  className="board-handle"
                  data-handle="se"
                  data-circle={handleInMode || handleInFlash ? 'true' : 'false'}
                  data-solid={handleSolid ? 'true' : 'false'}
                  aria-hidden="true"
                />
              )}
              {/* BIG PROJECTS STEP 3 (3a) - the brass graft knob: on the SELECTED card's right edge at mid-height, apart from the resize corner; a
                  press-drag from it is connection mode from a second door (the pointerdown handler above). Not on a built-in place's derived cards. */}
              {selected && box.id === selectedId && !isSystemBoard && (box.kind === 'text' || box.kind === 'ink' || box.kind === 'page-pin') && (
                <div
                  className="board-graft-knob"
                  data-graft-knob="true"
                  data-active={inMode && threadArmedFrom === box.id && connectFromKnob ? 'true' : 'false'}
                  title={t('graftKnobTip')}
                  aria-label={t('graftKnobTip')}
                >
                  {/* the knob's glyph: the theme's INPUT icon through the shared seam (Flux: the arrow into a socket; a theme with no set draws the plain dot) */}
                  <ThemeIcon id="input" fallback={null} size={16} />
                </div>
              )}
              {!isSystemBoard && (box.kind === 'text' || box.kind === 'ink' || box.kind === 'page-pin') && <FluxCardCoord x={box.x} y={box.y} />}
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
  // B3 S1 — the deck wizard's own pop-out reuses this SAME blur condition
  // (`.board-canvas-blurred`, FX4 S5's existing rule, untouched): "a
  // pop-out over the faded board" applies identically whether the pop-out
  // is a card's own editor or the deck engine's own wizard — one blur
  // mechanism, not two. The board's own geometry (pageWidthPx,
  // canvasHeightPx, every box's x/y/w/h) never reads `deckWizardOpen`
  // anywhere — b3.mjs asserts this explicitly, not merely by omission.
  const boardBody = (
    <>
      <div className={`board-canvas-blur-wrap${(popupBox || deckWizardOpen) ? ' board-canvas-blurred' : ''}`}>
        {boardCanvas}
        <FluxBoardFrame />
      </div>
      {popupBox && (
        <BoardCardPopup
          initialText={popupBox.text ?? ''}
          prompt={popupBox.kind === 'text' && !popupBox.sourceEntryId ? popupBox.prompt : undefined}
          onCommit={text => commitText(popupBox.id, text)}
          fontFace={popupBox.fontFace}
          fontSize={popupBox.fontSize}
          onType={patch => commitType(popupBox.id, patch)}
          onClose={() => {
            // BOARD CLICK-TO-CREATE: a card this gesture made and the writer closed while it is STILL EMPTY is discarded (nothing was ever written, so nothing is kept). The
            // pop-up commits every keystroke into the box, so the box's text is already current here. Once closed, the card is an ordinary card for good.
            const closingId = popupBox.id;
            if (freshEmptyIdsRef.current.delete(closingId)) {
              const b = boxesRef.current.find(x => x.id === closingId);
              if (b && b.kind === 'text' && !(b.text ?? '').trim()) {
                setBoxes(prev => prev.filter(x => x.id !== closingId));
                setSelectedId(cur => (cur === closingId ? null : cur));
              }
            }
            setPopupBoxId(null);
          }}
        />
      )}
      {deckWizardOpen && (
        <DeckWizard decks={DECKS} startDeckId={startDeckId ?? undefined} startAnswers={startAnswers} pagesFor={() => pagesOfPlace(place)} onDeal={onDeckDealt} onLanding={(l) => { landingRef.current = l; }} onClose={() => { landingRef.current = null; setDeckWizardOpen(false); setStartDeckId(null); }} />
      )}
    </>
  );

  // AB4 S5 / FX4 S6 — the board's own hand tool(s). Connect toggle RETIRES
  // (replaced by the handle-drag gesture above) — the sliver carries Add
  // card alone now.
  // FX5 S5 — a second control joins it: the per-board connections-footer
  // toggle ("Add card + this, two controls" — the brief's own words).
  // FX6 S2b — a THIRD control joins them: New page card.
  // B1 S3 — "Add cards (the sliver's Add action must be absent on system
  // boards)": on a system Board, neither onAddCard NOR onAddPageCard is
  // passed at all — Sliver.tsx's own SliverToolsBody renders each button
  // only when its handler is present (undefined, not a no-op function), so
  // the buttons are genuinely ABSENT from the DOM here, not merely inert
  // (matching the brief's own distinct wording for Add vs. Delete: Add's
  // own affordance "must be absent," Delete's own click "must be inert").
  // The footer toggle survives — arranging (including hiding the footer) is
  // explicitly permitted by S3's "full FX5 hand."
  // B3 S3 — "From a deck…" joins the sliver's own board tools, the SAME
  // absent-not-disabled law every other Add-family control here already
  // carries: on a system Board, onAddFromDeck is never passed at all.
  // BM1 S3 — the board's own mode bar + the PAGE → door + the telos line.
  // Three tabs in the page-bar's tab grammar, but a DISTINCT `.board-mode-*`
  // class (never the page's writing-posture `.mode-tabs`/`.desk-mode-strip` —
  // the projection axis is a genuinely different control from Free Write/Draft,
  // so w1.mjs's "a board page never renders the mode tabs" and ab1.mjs's
  // ".desk-mode-strip absent on board" both stay literally true; bm1.mjs adds
  // the successor asserting THIS new control). Tabs + telos: non-system boards
  // only. The PAGE → door is never role=tab / aria-selected — a door has no
  // current state; clicking always travels (paired → the paired page via
  // routeForEntry; unpaired → the FX10 named return `backTo`, unchanged).
  // CD4 S1 (2026-07-24, Fable's ruling amending the brief) resolves the overlap
  // the BM1 line below flagged: the Board's own "Done" is REMOVED (both render
  // paths further down), and PAGE → becomes the Board's only exit — on EVERY
  // board now, system boards included. A system board is a permanently-unpaired
  // board, so travelToPage's own unpaired branch (navigate `backTo`, which for
  // a system board is already '/' — see the backTo line above) IS its exit: the
  // cold-load fallback lands at Arrival, itself a page (HB1's "Page is home").
  // No new navigation logic — the existing unpaired branch, trusted-pointer
  // proven in bm1.mjs, is reused as-is.
  const pairedPageId = isSystemBoard ? null : getPairedPageId(id);
  // ITEM 91 — AN UNPAIRED BOARD'S PAGE DOOR OPENS A PAGE, NOT AN EXIT.
  //
  // Nick's S11, verbatim: "board → Page rail lands on Wrizo landing (verdict:
  // New Page auto-linked back to the board)." The landing is literally what the
  // old `else` produced: `backTo` is `'/'` for a system board (see its own line
  // above), so the one universal control on the Board ejected the writer out of
  // the room instead of taking them to a page. CD4 S1 reasoned that an exit was
  // the honest behaviour for a permanently-unpaired board; Nick has overruled
  // that, and this is the successor. The b2.mjs assertions that encoded the old
  // ruling are PARKED with their originals quoted, never silently flipped.
  //
  // "Auto-linked back" means different things on the two kinds of board, and
  // getting that distinction wrong would fight a ruled law in one direction or
  // the other:
  //   - A USER board's membership is AUTHORED, so the link is a PIN, carried on
  //     the descriptor and applied by `birth()` (item 91's own seam). The board's
  //     binder rides along too, so a page made from a board inside a project is
  //     born in that project — Nick's "the board's binder/pin descriptor."
  //   - A SYSTEM board's membership is DERIVED and never authored (A16), and
  //     `reconcileSystemBoard` deletes any pin whose page does not qualify. So a
  //     pin here would be erased on the next reconcile — the exact class of
  //     defect item 92 is. The honest link is MEMBERSHIP: give the new page the
  //     origin that makes it belong, and the board adopts it by itself. Journal
  //     takes journal-origin; the Shelf takes loose (T3's own derivation).
  //   - TRASH has no creatable membership — a page cannot be authored already
  //     deleted — so it keeps the old exit. Named here rather than left to be
  //     rediscovered as a bug.
  //
  // Nothing is written by any of this: the door navigates to an UNBORN address,
  // so a writer who opens it and leaves still leaves no row behind (PB1).
  const unbornHrefFromThisBoard = (): string | null => {
    if (systemKind === 'trash') return null;
    if (systemKind === 'journal') return unbornHref({ origin: 'journal' });
    if (systemKind === 'shelf') return unbornHref({ origin: 'loose' });
    // ITEM 87 (clause 1) — a page opened FROM a board is a page to work on, so
    // this door declares Draft too, the same as the cascade's New Page.
    return unbornHref({ origin: 'loose', binderId: project?.id ?? null, pinBoardId: id });
  };
  const travelToPage = () => {
    flushNow();
    if (pairedPageId) {
      const page = getJournalEntry(pairedPageId);
      navigate(page ? routeForEntry(page) : backTo);
      return;
    }
    const href = unbornHrefFromThisBoard();
    navigate(href ?? backTo);
  };
  // W2 - THE WALK'S TWO DOORS (store/writePlace.ts; docs/guided-paths/w2-write-place-brief.md).
  // WRITE THIS: a NEW page for this card, in the Deck's own set. The door writes NOTHING for the page - it saves the board (so the card is in the row the graft will hang from), remembers the step, and opens an UNBORN address that names
  // the card; the page is born by the first keystroke, and in that act it is grafted to the card (unbornPage.ts birth). Leave without typing and no page exists. The page opens in Free Write with the return chip "‹ Back to <Deck>".
  const writeThis = (box: Box) => {
    if (unbornRef.current) unbornRef.current.birthWith({ boxes: boxesRef.current });
    else saveBoardBoxes(id, boxesRef.current);
    lastSavedRef.current = boxesRef.current;
    flushNow();
    setWalkPos(id, box.id);
    const plan = planWriteThis({ boardId: id, boardTitle: title, setId: project?.id ?? null, origin: initialEntry?.origin === 'journal' ? 'journal' : 'loose' }, box);
    navigate(plan.href, { state: plan.state });
  };
  // PLACE A PAGE: the graft picker, filtered to pages (a press grafts; nothing is placed without one), anchored under the door. An overlay: the Walk never moves.
  const walkDoors = [
    { key: 'write', label: t('walkWrite'), onOpen: (card: Box) => writeThis(card) },
    { key: 'place', label: t('walkPlace'), onOpen: (card: Box, el: HTMLElement) => setPlaceFor((p) => (p && p.box.id === card.id ? null : { box: card, el })) },
  ];
  const fromSt = location.state as { fromBoardId?: string; fromBoardTitle?: string } | null;
  const fromPage = fromSt?.fromBoardId && fromSt.fromBoardId !== id ? getJournalEntry(fromSt.fromBoardId) : null;
  const placeCameFrom: CameFrom | null = fromPage && fromPage.pageType !== 'board' ? { entryId: fromPage.id, title: fromSt?.fromBoardTitle || boardName(fromPage.text, 'Untitled') } : null;

  // Board-side explicit pairing (S2 — "an existing board gains a Write face
  // only by explicit pairing from its side"): v1 uses the brief's create-new
  // branch (a fresh loose page becomes this board's page face). A full page
  // chooser is a follow-up; the 1:1 guard lives in pairBoardWithPage.
  const pairWithNewPage = () => {
    const page = createLooseHomePage();
    pairBoardWithPage(id, page.id);
    setBoxes(prev => prev.slice()); // nudge a re-render so the PAGE → door resolves
  };
  // CD4 S1 — renders for EVERY board now (was `!isSystemBoard ? … : null`). The
  // mode TABS stay non-system only (a system board has no projections); the
  // PAGE → door is the one universal control (Fable's ruling: system boards
  // mount the same door, its unpaired branch IS their exit). role=tablist /
  // aria-label apply only when the tabs are present — a lone door is no tablist.
  // PW2 S2 — the nest chain for this board's own address (see the crumb below).
  const nestChain = boardNestChain(id);

  // W5 - THE GAPS LINE, in a Deck's header (the Walk and Open views): names of the steps with nothing yet, never a count; gone when every step is kindled. One line that never wraps, so the header's height - and with it
  // the page's place - cannot change when it appears or goes. In the Walk it reads on from the current step; in Open, from the first.
  const gapsLine = deckBoard && (boardMode === 'walk' || boardMode === 'open')
    ? <DeckGaps order={deckMain} kindledIds={deckKindled} fromIndex={boardMode === 'walk' ? deckMain.findIndex(b => b.id === (deckSteps.find(s => s.id === walkCurId)?.parentId ?? walkCurId)) : -1} deckName={title} flux={theme === 'flux'} onJump={jumpToGap} />
    : null;

  const boardModeBar = (
    <div
      className="board-mode-strip"
      style={{ display: 'flex', alignItems: 'center', gap: 4 }}
    >
      {/* W1 - "Show as" replaces the three view tabs (components/ShowAs.tsx): icons first, the word on hover; a Board offers four views, a Book (the Journal) two. */}
      {(!isSystemBoard || boardKind === 'book') && <ShowAs kind={boardKind} deck={deckBoard} narrow={narrowBoard} current={boardMode} onPick={setBoardMode} />}
      <button
        type="button"
        className="board-door"
        data-board-door="page"
        onClick={travelToPage}
      >
        {t('boardPageDoor')} <span aria-hidden="true">→</span>
      </button>
    </div>
  );
  // ITEM word-diet (Nick, Oct 13): REMOVE — the narration line is gone
  // whole; the board's own pairing is read from its visible context now,
  // not a standing sentence. boardTelos's lexicon entry is untouched (text
  // still there for whoever reads deskLexicon.ts), simply never rendered.
  const boardTelos = null;

  // The three views of one board. OPEN is the existing canvas (byte-identical);
  // STORYBOARD/OUTLINE render the ONE structure description (store/
  // boardStructure.ts). Order is single-sourced (seq on the shared boxes), so a
  // reorder in one projection is the board's truth in all three.
  // ADD SCENES - a top-level step of a Deck takes children (store/childSteps.ts): the door says which word, Add makes N ordinary text cards under the step (`parentId`, the step's lane, ordered right after it), and the Walk lands on the
  // first new child (the caret goes in the card: the Walk's own rule). Nothing is created until Add; the Deck's cards and every other board see none of this.
  const sceneWordOf = (box: Box) => sceneDoorFor(box, deckBoard);
  const addScenes = (parent: Box, n: number) => {
    const deckId = parent.deckStep?.deck;
    const title = deckId ? childTitleOf(deckId) : null;
    const question = deckId ? childQuestionOf(deckId) : null;
    if (!title || !question) return;
    const made = addChildren(boxesRef.current, parent.id, n, { title, question, newId: generateId });
    if (made.ids.length === 0) return;
    if (framed) boardDissolve.noteWrite();
    const kids = made.added;   // the new cards ALONE, appended to the LATEST list (a deck deal's shape); never the snapshot `made` was cut from
    setBoxes(prev => [...prev, ...kids]);
    if (boardMode === 'walk') setWalkJumpId(made.ids[0]);
  };
  // W1 - THE WALK (components/Walk.tsx): one card at a time on the board's own order, writing in the card with the ordinary card engine (the card editor, mounted INLINE). Esc leaves for the board's last shown view.
  // TOOLS #9 - Machina's Step readout row: "AGENDA · <the Deck's name>" for a Deck (a board whose cards carry a deck step), else "PLAN · <the board's name>". Words only; read from what is already on the board.
  const machinaReadout = (() => {
    if (theme !== 'machina') return undefined;
    const deckId = deckBoard ? liveBoxes(boxes).find((b) => b.deckStep)?.deckStep?.deck : undefined;
    const deck = deckId ? DECKS.find((d) => d.id === deckId) : undefined;
    return deck ? { kind: 'agenda' as const, name: t(deck.nameTerm) } : { kind: 'plan' as const, name: title };
  })();
  const walkKindled = new Set(boardMode === 'walk' ? walkOrder(boxes).filter(b => kindled(id, b, boxes)).map(b => b.id) : []);
  const walkContent = boardMode === 'walk' ? (
    <>
    <Walk
      boardId={id}
      boxes={boxes}
      extraDoors={walkDoors}
      kindledIds={walkKindled}
      deck={deckBoard}
      litIds={deckBoard ? deckLit : undefined}
      kindlingIds={deckBoard ? deckRewards.kindling : undefined}
      onToggleLit={deckBoard ? toggleLit : undefined}
      onCurrent={setWalkCurId}
      scenes={deckBoard ? { word: sceneWordOf, onAdd: addScenes } : undefined}
      startHereId={startHereCardId}
      helpCardId={walkHelpId}
      onHelpShown={() => setWalkHelpId(null)}
      jumpToId={walkJumpId}
      onJumped={() => setWalkJumpId(null)}
      receded={boardDissolve.dissolved}
      flux={theme === 'flux'}
      readout={theme === 'machina' ? machinaReadout : undefined}
      still={theme === 'machina'}
      narrow={narrowBoard}
      onExit={() => setBoardMode(lastShownBeforeWalk(id, homeView))}
      renderEditor={(box) => (
        <BoardCardPopup
          key={box.id}
          inline
          autoFocus
          initialText={box.text ?? ''}
          prompt={box.kind === 'text' && !box.sourceEntryId ? box.prompt : undefined}
          onCommit={text => commitText(box.id, text)}
          onClose={() => undefined}
          fontFace={box.fontFace}
          fontSize={box.fontSize}
          onType={patch => commitType(box.id, patch)}
        />
      )}
      empty={<BeginningsRow surface="projection" doors={beginningDoors} />}
    />
    {placeFor && (
      <GraftPicker mode="pages" title={t('walkPlace')} subject={{ entryId: id, boxId: placeFor.box.id }} boxes={boxes} anchor={placeFor.el} cameFrom={placeCameFrom}
        onClose={() => setPlaceFor(null)} onPicked={() => setPlacedTick((n) => n + 1)}
        beforePick={() => { if (unbornRef.current) unbornRef.current.birthWith({ boxes: boxesRef.current }); }} />
    )}
    </>
  ) : null;
  // W1 - THE JOURNAL AS A BOOK: Flip (one page at a time, the Walk's own chevrons and swipe) and Thumbnails (a grid of tall pages). The pages are the loose Journal in the writer's order (J1); nothing here writes a page or a pin.
  const bookPages = boardKind === 'book' ? getNotebookPages() : [];
  const flipContent = boardMode === 'flip' ? <BookFlip boardId={id} pages={bookPages} receded={boardDissolve.dissolved} onOpen={(pg) => { flushNow(); navigate(routeForEntry(pg)); }} /> : null;
  const thumbsContent = boardMode === 'thumbnails' ? <BookThumbs boardId={id} pages={bookPages} onPick={(pg) => { setWalkPos(id, pg.id); setBoardMode('flip'); }} /> : null;
  const boardContent = boardMode === 'open'
    ? boardBody
    : boardMode === 'walk' ? walkContent
    : boardMode === 'flip' ? flipContent
    : boardMode === 'thumbnails' ? thumbsContent
    : boardMode === 'storyboard'
      ? <StoryboardProjection boxes={boxes} setBoxes={setBoxes} labelFor={boxLabel} onEditText={commitText}
          sceneWord={deckBoard ? sceneWordOf : undefined} onAddScenes={addScenes}
          onAddLane={onAddLane}
          beginnings={<BeginningsRow surface="projection" doors={beginningDoors} />} />
      : <OutlineProjection boxes={boxes} setBoxes={setBoxes} labelFor={boxLabel} onEditText={commitText}
          sceneWord={deckBoard ? sceneWordOf : undefined} onAddScenes={addScenes}
          beginnings={<BeginningsRow surface="projection" doors={beginningDoors} />} />;

  const sliverContent: SliverContent = isSystemBoard
    ? { kind: 'board' }
    : {
        kind: 'board', onAddCard, onAddPageCard, onAddExistingPage: () => setExistingPageOpen(true),
        onAddFromDeck,
      };

  const pageFaceSheets = (
    <>
      {portOpen && <PortToBoardSheet sourceIds={[id]} onClose={() => setPortOpen(false)} />}
      {pinOpen && <PinToBoardSheet entryId={id} onClose={() => setPinOpen(false)} />}
      {shelfPinEntryId && <PinToBoardSheet entryId={shelfPinEntryId} onClose={() => setShelfPinEntryId(null)} />}
      {existingPageOpen && <ExistingPagePicker boardId={id} onClose={() => setExistingPageOpen(false)} />}
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
        {/* FX18 S3 (SV27): the board's top menu parallels the Page's mode strip — right-
            aligned. Crumb stays left (marginRight:auto); the mode bar + actions group right
            (actions' CSS margin-left:auto neutralized below so they stay adjacent). */}
        <div className="chrome-fade chrome-top sprint-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
          <div className="sprint-crumb" aria-label="Location" style={{ marginRight: 'auto' }}>
            {drawer && <><span className="crumb-item">{drawer.name}</span><span className="crumb-sep">/</span></>}
            {project && <><span className="crumb-item">{project.title}</span><span className="crumb-sep">/</span></>}
            {/* PW2 S2 (item 128) — THE NEST CHAIN. Once containers hold
                containers, this line is the only thing that answers "where am
                I" without opening anything.

                THE PARENT SEGMENT IS THE DOOR OUT, and that is what keeps the
                recursive container's own test passing: the address stays ONE
                LINE and the way back stays ONE PRESS at any depth. Each
                ancestor is pressable and travels to that board directly, so
                escaping three levels is one press, not three.

                Ordered outermost-first so the line reads the way an address
                reads. `boardNestChain` walks the SAME guarded walker S1 built
                (`getBoardsConnecting`, `seen`-terminated), so a graph that
                arrives already cyclic renders a finite crumb instead of
                hanging the surface — the read-safety half of S1's law, and the
                reason the guard had to land first. */}
            {nestChain.map((a) => (
              <Fragment key={a.id}>
                <button type="button" className="crumb-item wz-crumb-nest"
                  onClick={() => { flushNow(); navigate(`/page/${a.id}`); }}>{a.title}</button>
                <span className="crumb-sep">/</span>
              </Fragment>
            ))}
            {/* MERGE NOTE (PW2 x item 133): the nest chain above and the rename
                control below are COMPLEMENTARY — ancestors come before the name,
                and the name itself is now the rename control. PW2's plain title
                span was superseded by item 133 and is dropped; neither side's
                intent is altered. */}
            {/* ITEM 133 — THE NAME IS EDITED WHERE IT IS DISPLAYED. Nick could not
                name a board because a board's name was written once at birth and
                no surface could reach it again. This is that surface: the name in
                the board's own crumb, clicked.
                Enter or blur COMMITS, Escape REVERTS, and an empty name reverts to
                the previous one — a board is never left nameless by a stray click,
                and "clear it to rename it" is not a thing a writer should have to
                discover. Zero schema: `board.text` is a pure label, so writing it
                IS the rename, through the same patchJournalEntry every other edit
                uses. */}
            {renaming ? (
              <input
                className="crumb-here crumb-rename"
                value={nameDraft}
                autoFocus
                aria-label={t('boardRenameLabel')}
                onChange={ev => setNameDraft(ev.target.value)}
                onKeyDown={ev => {
                  if (ev.key === 'Enter') { ev.preventDefault(); commitRename(); }
                  else if (ev.key === 'Escape') { ev.preventDefault(); setRenaming(false); }
                }}
                onBlur={commitRename}
              />
            ) : (
              <button
                type="button"
                className="crumb-here crumb-rename-btn"
                title={t('boardRenameLabel')}
                // ITEM 133-B — THE DRAFT OPENS WITH AN EMPTY FALLBACK, so a nameless
                // board gives a nameless field. The first cut asked the question the
                // long way round: it derived the name with the crumb's own fallback
                // ('Untitled') and then compared the result against 'Untitled board'
                // to decide whether to open blank. Those two strings were the SAME
                // string when boardName() returned one stand-in for every caller; the
                // moment the fallback became a caller's parameter (which was itself a
                // correction — the crumb has always displayed plain 'Untitled') the
                // comparison could never be true again, and the open-blank branch went
                // dead. A writer naming a board for the first time found the stand-in
                // word sitting in the field, to be selected and deleted before they
                // could type their own.
                //
                // THE SENTINEL IS GONE RATHER THAN CORRECTED. Repairing the literal
                // would have left a magic string that has to be kept in step with a
                // fallback it cannot see — which is exactly the drift that produced
                // this, and item 136 is about to retire those stand-ins entirely.
                // Deriving with '' makes namelessness produce emptiness directly:
                // nothing to compare, nothing to keep in step.
                onClick={() => { setNameDraft(boardName(getJournalEntry(id)?.text, '')); setRenaming(true); }}
              >{title}</button>
            )}
            {gapsLine}
          </div>
          {boardModeBar}
          <div className="sprint-actions" style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 0 }}>
            {!isSystemBoard && !pairedPageId && <button type="button" className="btn-quiet board-pair" onClick={pairWithNewPage}>{t('boardPairWithPage')}</button>}
            {canUndo && <button type="button" className="btn-quiet" onClick={undo}>Undo</button>}
            {/* CD4 S1 — "Done" removed; PAGE → (boardModeBar) is the Board's only exit now. */}
          </div>
        </div>

        {boardTelos}

        <div style={{ height: 16 }} />

        {/* ITEM 83 M11 — R13.iv IS DEFERRED, AND THIS IS WHY.
            M6 removed the board's Tools sliver on R13.iv ("no Tools sliver on
            boards"), because R13 moves the board's acts into the cascade's own
            PAGE and PLAN faces. The Place-page list (R13.ii) was built; the
            ACTS WERE NOT RE-HOMED. The sliver was the only home for Add card,
            New page card, Existing page…, From a deck… and the
            connections-footer toggle, so removing it deleted real capability
            rather than relocating it — and the suite said so immediately, in
            ten separate files (fx13, b1, b2, b3, fx4, fx5, fx6, fx7 S9, m2,
            m4), every one of them reaching for a board tool that no longer
            existed.
            Implementing half of a ruling is worse than deferring it: the
            ruling says the acts MOVE, and until they have somewhere to move
            to, the sliver is where they live. Restored deliberately, with the
            harnesses as the evidence. R13.iv should land in one ticket
            TOGETHER with the Plan face's `＋ New card` and the rest — the
            absence and the new home in the same commit, so no state of the
            tree is ever missing a board's own tools. */}
        <DeskFrame
          pageKind="board"
          strip={cascade.strip}
          cascadeLayers={cascade.layers}
          sliver={<Sliver content={sliverContent} goalText="" />}
          // TU2 S4 — "Presence on Boards": the same room, following the same
          // prop pattern every other framed host already uses (entry/
          // project/pageText/pageKind — see PageEditor.tsx/JournalEntry.tsx/
          // ScriptEditor.tsx's own call sites). `initialEntry` is guaranteed
          // non-null here (the `if (!initialEntry) return null` guard above
          // already ran). `pageText` is `initialEntry.text` — a Board's own
          // text field is real (BoardEditor.tsx derives this very page's
          // `title` from it, above), just a single title line rather than a
          // running prose page; passing it (not a hardcoded `""`, unlike
          // `Sliver`'s own `goalText` above, which is genuinely N/A for
          // Board) keeps the Consistency lens's own scope and the listener's
          // delta assembly both honest about what "this page's text" means
          // here, without fabricating content that doesn't exist.
          tutor={<Tutor entry={initialEntry} project={project} pageText={initialEntry.text} pageKind="board" />}
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
          <div style={{ width: 'min(100%, 1100px)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {/* W5 - a Deck completes: the theme's existing goal celebration, once (an overlay on the stage's top edge; it takes no room) */}
            <GoalCelebration celebrating={deckRewards.deck} />
            {boardContent}
          </div>
        </DeskFrame>

        {pageFaceSheets}
        {actionToast.node}
      </div>
    );
  }

  return (
    <div className="page board-page" style={{ maxWidth: 1100, paddingTop: '2.5rem', position: 'relative' }}>
      <div className="sprint-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div className="sprint-crumb" aria-label="Location">
          {drawer && <><span className="crumb-item">{drawer.name}</span><span className="crumb-sep">/</span></>}
          {project && <><span className="crumb-item">{project.title}</span><span className="crumb-sep">/</span></>}
          <span className="crumb-here">{title}</span>
          {gapsLine}
        </div>
        {boardModeBar}
        <div className="sprint-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!isSystemBoard && !pairedPageId && <button type="button" className="btn-quiet board-pair" onClick={pairWithNewPage}>{t('boardPairWithPage')}</button>}
          {canUndo && <button type="button" className="btn-quiet" onClick={undo}>Undo</button>}
          {/* CD4 S1 — "Done" removed; PAGE → (boardModeBar) is the Board's only exit now. */}
        </div>
      </div>

      {boardTelos}

      <div style={{ height: 16 }} />

      <GoalCelebration celebrating={deckRewards.deck} />
      {boardContent}
      {actionToast.node}
    </div>
  );
}
