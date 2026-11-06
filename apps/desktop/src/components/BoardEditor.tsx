import { FluxBoardFrame, FluxCardCoord } from './FluxReadouts';
import { ThemeIcon } from './ThemeIcon';
import { liveBoxes } from '../store/boxTombstones';
import { openContextMenu, type ContextMenuItem } from '../store/contextMenu';
import { requestDelete } from '../store/deleteGate';
import { publishBoardSnapshot, registerBoardActions } from '../store/boardSelection';
import { getResumeTarget } from '../store/resume';
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { DRAWER_MIN, useStandingHands } from '../store/menusDrawers';
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
import { applyFormat, formatShortcutAction, applyFontPick, fontFaceAt, clearFontSpans, applySizePick, fontSizeAt, clearSizeSpans, type FormatAction } from '../store/draftFormat';
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
import { CARD_H } from '../decks/layout';
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
import { AUTOSAVE_MS, LONG_PRESS_MS, MOUSE_DRAG_THRESHOLD, TOUCH_CANCEL_THRESHOLD, MIN_TEXT_W, MIN_INK_W, MIN_TEXT_H, MIN_PIN_W, MIN_PIN_H, MEASURE_TOLERANCE_PX, naturalPx, VIEWPORT_MIN_PX, CANVAS_MIN_W, BOARD_MAX_Y, BOARD_BREATHING_ROOM, ADD_CARD_GAP, NEW_CARD_W, NEW_CARD_H, groupMembers, maxBottom, boxesOverlap, notecardExcerpt } from './board/geometry';
import { BoardInkBox, BoardPinBox, BoardTextBox } from './board/BoardBoxes';
import { BoardCardPopup } from './board/BoardCardPopup';
export { BoardCardPopup } from './board/BoardCardPopup';
import { useBoardMeasure } from './board/useBoardMeasure';
import { useBoardBox } from './board/useBoardBox';
import { useBoardSave } from './board/useBoardSave';
import { useBoardReflow } from './board/useBoardReflow';
import { useRailLinkDrag } from './board/useRailLinkDrag';
import { useBoardGestures } from './board/useBoardGestures';
import { useBoardKeys } from './board/useBoardKeys';
import type { LastAction } from './board/geometry';
// FLUX3 S1 - the Schema Live view's two mount points (src/flux3/): the layer and readouts in the board frame, a node record on each card; both render only under ?flux3=1 in Flux
import { FLUX3 } from '../flux3/flag';
import { FluxSchema } from '../flux3/FluxSchema';
import { FluxNodeRecord } from '../flux3/FluxNodeRecord';

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

  // non-null only while this board has no row yet: the first box writes the row; a titled board is born at once [BoardEditor §20]
  const unborn = useUnborn(id);
  const unbornRef = useRef(unborn);
  unbornRef.current = unborn;

  // a system board and a page's paired Plan board take no part in the way-back (the slot keeps the page's own departure); decided once per mount [BoardEditor §21]
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
  // connection mode: threadArmedFrom is the card whose corner square was double- or right-clicked; these are the rest of its render state (the card under the arm, the flash after a link or unlink) [BoardEditor §22]
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
  // click-to-create: a click on empty board makes a card, a click-drag sizes it first; refs, because the canvas's native pointer listeners must read the current answer [BoardEditor §23]
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
  // the box being resized now: the auto-grow effect skips it mid-drag, so the pointer alone sets w/h, and the content floor is reconciled once when the drag ends [BoardEditor §24]
  const activeResizeIdRef = useRef<string | null>(null);
  // BUG 32c - the text cards the writer has acted on in THIS visit (an edit that changed the words, or a resize). Only these - and the dealt row they sit in - are ever fitted DOWN to their content; a card the writer has not acted on keeps its size, so a plain open shrinks nothing. Never stored.
  const touchedRef = useRef<Set<string>>(new Set());
  // when the last resize or move ended, so the canvas's double-click can tell a gesture's own second click from a request to edit [BoardEditor §25]
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
  // describePageHome knows nothing of system boards, so their home label comes from the lexicon here (trash, shelf, journal) [BoardEditor §26]
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

  const { containerWidthPx, widthMeasured, availHeightPx } = useBoardMeasure({ wrapRef, boardMode });
  // FX4 S4 — the effective page width every normalized box coordinate
  // converts against: the persisted override once the writer has dragged
  // the canvas wider/narrower, else the wrap's own natural (auto-fit)
  // width — byte-identical to pre-FX4 in the untouched case.
  const pageWidthPx = canvasOverrideW != null ? Math.max(canvasOverrideW, CANVAS_MIN_W) : containerWidthPx;

  const { boardBox } = useBoardBox({ wrapRef });

  useBoardSave({ systemKind, id, setBoxes, lastSavedRef, boxes, unbornRef, boxesRef, pendingGraftsRef, unborn });

  useBoardReflow({ pageWidthPx, widthMeasured, touchedRef, boxes, activeResizeIdRef, measureEls, lastSavedRef, setBoxes, popupBoxId });

  const measureRef = (boxId: string, el: HTMLDivElement | null) => {
    if (el) measureEls.current.set(boxId, el);
    else measureEls.current.delete(boxId);
  };

  // FIT TO TEXT: drops sizedByHand and fits the card to its content on the reflow's own floors; a dealt deck's rows follow (rowFit) [BoardEditor §29]
  const fitCard = (boxId: string) => {
    const el = measureEls.current.get(boxId);
    if (!el || pageWidthPx <= 0) return;
    touchedRef.current.add(boxId);
    setBoxes(prev => {
      const next = prev.map(b => {
        if (b.id !== boxId || b.kind !== 'text') return b;
        const { sizedByHand: _s, ...rest } = b; void _s;
        return { ...rest, h: Math.max(naturalPx(el), (b.deckStep ? CARD_H : MIN_TEXT_H) * pageWidthPx) / pageWidthPx };
      });
      return fitDealtRows(prev, next);
    });
  };

  const commitText = (boxId: string, text: string) => {
    if (boxesRef.current.some(b => b.id === boxId && b.text !== text)) touchedRef.current.add(boxId);   // BUG 32c: an edit that changed the words - the card is now fitted to them
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
    // a fontFace patch of `undefined` CLEARS the card's face (the key goes; absent = Default), it never stores an empty one [BoardEditor §30]
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

  // a removed card takes its hairlines in one undo snapshot; inert on a system board (its cards are derived); a deleted card is a tombstone (deletedAt), saved first so a fresh card is in storage to stamp [BoardEditor §31]
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
  useRailLinkDrag({ canvasRef, linkedCopyRef, threadArmedFromRef, popupBoxIdRef, id });

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

  // New page card: a real loose page, pinned here in one act; the pin is APPENDED to this component's live boxes (never replaced by the store's copy), so the unmount save neither erases it nor drops unsaved cards [BoardEditor §33]
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

  useBoardGestures({ canvasRef, previewLineRef, armTipRef, id, boxesRef, threadArmedFromRef, setThreadArmedFrom, setConnectFromKnob, setConnectTarget, setSelectedConnectionId, setConnectFlash, setBoxes, popupBoxIdRef, setSelectedId, ctxActionsRef, pageWidthPx, ghostRef, freshEmptyIdsRef, setPopupBoxId, setIsDragging, activeResizeIdRef, lastActionRef, setCanUndo, lastGestureEndRef, measureEls, touchedRef, setStartersFaded, selectedIdRef, createAllowedRef, connectEndRef, boardMode });

  useBoardKeys({ popupBoxIdRef, threadArmedFromRef, connectEndRef, selectedConnectionIdRef, setSelectedConnectionId, selectedIdRef, setSelectedId, removeConnection, undoRef, removeSelectedRef });

  // Harness inspection seam (matches the wrizoNotebook/wrizoVocab convention).
  useEffect(() => {
    (window as unknown as { wrizoBoard?: unknown }).wrizoBoard = () => boxesRef.current;
    return () => { delete (window as unknown as { wrizoBoard?: unknown }).wrizoBoard; };
  }, []);

  // the rename state lives with the other hooks, above the early return: hooks below `if (!initialEntry) return null` would change the hook count between renders [BoardEditor §46]
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


  // connection and board-meta boxes are never positioned cards; a page-pin with onCanvas === false is withheld from the wall (absence means displayed, so older pins still render) [BoardEditor §47]
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

  // the card menu leads with the conditional actions (Ungroup, Edit copy, Restore, Pin to a Board…), then a separator and Delete; a right-click on empty board offers New Card and Delete board [BoardEditor §48]
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
          // a survey row dropped on the canvas lands where dropped; only this board's own memberships are accepted, so a display act never becomes a card transfer [BoardEditor §49]
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
            // e.target is the canvas (it captured the pointer on the first press), so a fresh hit-test at the event's point finds the card that was double-clicked [BoardEditor §50]
            const hitEl = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
            // a double-click on the resize corner opens nothing (it enters connection mode), and one within 100ms of a resize or move is that gesture's own click, never a request to edit [BoardEditor §51]
            if (hitEl?.closest('.board-handle, .board-step-help, .board-step-pop, .board-fit')) return;   // W3: a double-click on the step "?" (or in its popover) opens nothing
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
          {/* on an empty ordinary board the doors themselves stand in the room (gated on the render list, so a lone board-meta or connection box never counts); a system board shows no row [BoardEditor §52] */}
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
              {FLUX3 && <FluxNodeRecord box={box} connections={connections} peers={linkPeersByCard.get(box.id)} />}
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
              {/* BUG 32d - FIT TO TEXT: only on a card the writer sized by hand, beside the resize grip, shown on card hover / focus (a real button, so Tab reaches it and :focus-within shows it), hidden in the recede. */}
              {box.kind === 'text' && box.sizedByHand && !box.groupId && !isSystemBoard && (
                <button
                  type="button"
                  className="board-fit"
                  data-fit-to-text="true"
                  title={t('boardFitToText')}
                  aria-label={t('boardFitToText')}
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); fitCard(box.id); }}
                >
                  <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" focusable="false"><path d="M2 1.5h8M2 10.5h8M4.2 3.2L6 5l1.8-1.8M4.2 8.8L6 7l1.8 1.8" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="square" /></svg>
                </button>
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
      {FLUX3 && <FluxSchema wrapRef={wrapRef} canvasRef={canvasRef} boxes={boxes} nodes={sorted} connections={connections} selectedId={selectedId} pageWidthPx={pageWidthPx} labelFor={boxLabel} />}
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

  // a system board's Add-family tools are ABSENT, never inert; the mode bar has its own .board-mode-* classes, and the PAGE door is every board's one exit, never a tab [BoardEditor §53]
  const pairedPageId = isSystemBoard ? null : getPairedPageId(id);
  // an unpaired board's PAGE door opens an unborn page linked back: a pin on a user board, the belonging origin on a system board (Journal, Shelf); Trash keeps the exit [BoardEditor §54]
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
  // the mode bar renders on every board, its tabs only on a non-system board (role=tablist only when they are present); nestChain is this board's crumb [BoardEditor §55]
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
  // the telos line is not rendered (its lexicon entry stays): a board's pairing reads from its visible context [BoardEditor §56]
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
        {/* the nav row recedes with the rest of the framed chrome [BoardEditor §57] */}
        {/* FX18 S3 (SV27): the board's top menu parallels the Page's mode strip — right-
            aligned. Crumb stays left (marginRight:auto); the mode bar + actions group right
            (actions' CSS margin-left:auto neutralized below so they stay adjacent). */}
        <div className="chrome-fade chrome-top sprint-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
          <div className="sprint-crumb" aria-label="Location" style={{ marginRight: 'auto' }}>
            {drawer && <><span className="crumb-item">{drawer.name}</span><span className="crumb-sep">/</span></>}
            {project && <><span className="crumb-item">{project.title}</span><span className="crumb-sep">/</span></>}
            {/* the nest chain, outermost first: each ancestor is pressable and travels straight there, so the way out is one press at any depth; boardNestChain's guarded walk keeps a cyclic graph finite [BoardEditor §58] */}
            {nestChain.map((a) => (
              <Fragment key={a.id}>
                <button type="button" className="crumb-item wz-crumb-nest"
                  onClick={() => { flushNow(); navigate(`/page/${a.id}`); }}>{a.title}</button>
                <span className="crumb-sep">/</span>
              </Fragment>
            ))}
            {/* ancestors come before the name, and the name itself is the rename control [BoardEditor §59] */}
            {/* the name is edited where it is displayed: Enter or blur commits, Escape reverts, an empty name reverts; board.text is a pure label, so writing it IS the rename [BoardEditor §60] */}
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
                // the draft derives with an empty fallback, so a nameless board opens a nameless field, with no sentinel string to keep in step [BoardEditor §61]
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

        {/* the board keeps its Tools sliver: it is the only home of Add card, New page card, Existing page…, From a deck… and the connections-footer toggle, until they have another [BoardEditor §62] */}
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
          <div className="board-area" style={boardBox
            ? { width: boardBox.w, marginLeft: boardBox.l, marginRight: boardBox.r, flex: '0 0 auto', display: 'flex', flexDirection: 'column', position: 'relative' }
            : { width: 'min(100%, 1100px)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
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
