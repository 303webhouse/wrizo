import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getJournalEntry, saveScriptDoc, saveJournalEntry, patchJournalEntry, flushNow, getDrawer, getProject, getBoardsPinning } from '../store/persistence';
import { describePageHome } from '../store/pageHome';
import { flattenScenes, groupIntoScenes, createEmptyScriptDoc, newElement } from '../store/scriptDoc';
import { serializeScriptDoc, plainScriptWords } from '../store/scriptText';
import { WIDTH_CH, INDENT_CH, RIGHT_ALIGN_TYPES, UPPERCASE_TYPES, SPACE_BEFORE, widthChFor } from '../store/scriptMetrics';
import { lineLedger, wrapToLines } from '../store/scriptLedger';
import { paginate, type Page, type Placed } from '../store/scriptPaginate';
import { ENTER_MAP, TAB_MAP, TYPE_CYCLE, cycleBackward } from '../store/scriptKeys';
import { computeAutocomplete, applyAutocomplete, type AutocompleteState } from '../store/scriptAutocomplete';
import { shouldPromoteToScene, applyAutoContd } from '../store/scriptSmartText';
import { notePasteBlocked, shadowAllows, extractIncomingText } from '../store/voiceWall';
import { copyText } from '../store/clipboard';
import { useDeskLexicon } from '../store/deskLexicon';
import { useActionToast } from './ActionToast';
import { exportPageFiles, exportBinderDocument, exportEverythingDocument } from '../store/pageExport';
import { triggerDownload } from '../store/download';
import { useSessionLog } from './useSessionLog';
import { useWayBack } from './useWayBack';
import { useChromeDissolve } from './useChromeDissolve';
import { useLexicon } from '../store/themeLexicon';
import { DeskFrame, useDeskFrameViewport } from './DeskFrame';
import { ModeStrip } from './ModeStrip';
import { Sliver, type SliverContent } from './Sliver';
import { Tutor } from './Tutor';
import { GoalGlow } from './GoalGlow';
import { useCascade } from './Cascade';
import type { PageFaceSubject } from './PageFace';
import { PortToBoardSheet } from './PortToBoardSheet';
import { PinToBoardSheet } from './PinToBoardSheet';
import { isScriptEmpty } from '../store/structureConvert';
import type { Scene, ScriptEl, ScriptElType, Project } from '../types';

// S1 — the Screenplay Room: a house-native block editor, one styled block per
// element, ONLY the active element a live contenteditable (the BoardTextBox
// single-live-editable pattern — seed once per edit session, keyed remount).
// The document is edited as a FLAT element array (far simpler than nested
// scene/body arrays mid-edit); a scene boundary is just "the next element
// with t==='scene'" — groupIntoScenes derives the persisted Scene[] shape at
// save time (store/scriptDoc.ts). Anti-Canva in its purest form: no styling
// toolbar, ever — format is semantic, driven entirely by the element type.

const AUTOSAVE_MS = 2000;

const GHOST_TEXT: Record<ScriptElType, string> = {
  scene: 'INT. LOCATION - DAY',
  action: 'Action.',
  character: 'CHARACTER',
  paren: '(beat)',
  dialogue: 'Dialogue.',
  transition: 'CUT TO:',
  shot: 'ANGLE ON',
  general: 'Note.',
};

// Chrome/Electron supports contentEditable="plaintext-only" (no nested HTML
// on paste/IME — exactly what a single-text-node element block wants); guard
// with a fallback to "true" for any environment that doesn't.
const PLAINTEXT_MODE: 'plaintext-only' | true = (() => {
  if (typeof document === 'undefined') return true;
  try {
    const d = document.createElement('div');
    (d as unknown as { contentEditable: string }).contentEditable = 'plaintext-only';
    return (d as unknown as { contentEditable: string }).contentEditable === 'plaintext-only' ? 'plaintext-only' : true;
  } catch {
    return true;
  }
})();

function wordCount(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

// Shared geometry for both the active and static renders of an element — one
// function so the two can never drift from each other visually.
// SC2 S1 — the page gains its vertical rhythm. Until now `elementStyle` set no
// vertical margin at all and `SPACE_BEFORE` sat dormant beside `PAGE_LINES`, so
// every element rendered flush against the next: a screenplay with no vertical
// rhythm, which is incorrect on its face rather than a matter of taste.
//
// THE SPACING IS IN LINE UNITS, NEVER px OR em (Fable, 2026-07-25). N blank
// lines of arithmetic must render as exactly N line-heights, so the margin is
// `calc(var(--script-line) * N)` where `--script-line` is the sheet's own line
// box (index.css). A px or em value could drift off the 12pt box and the
// ledger's count would stop matching the page.
//
// SUPPRESSION IS NOT HERE, DELIBERATELY. "The first element of a page
// contributes zero space" is the CONSUMER's rule, not the type's — this
// function stays a pure function of the element type, which is also what lets
// S5 freeze one style object per type for memoization. Document start is
// handled in CSS (`.script-sheet > *:first-child`); S2's paginator will apply
// the identical rule at every page top.
//
// SC2 S2b — ONE FROZEN OBJECT PER ELEMENT TYPE, precomputed at module level.
// The function's shape is unchanged; what changes is that two elements of the
// same type now receive the SAME object, not two equal ones. That is the
// precondition for S5's `React.memo` on StaticScriptElement: a memo whose style
// prop is a fresh object every render is a memo that never hits.
//
// It is ALSO the reason this must not become a function of position. S2b renders
// a SEQUENCE of pages, and the obvious way to zero a page-top element's space
// would be to branch this on "is it first on its page" — which would make the
// style depend on pagination, defeat the freeze, and put the same element's
// appearance at the mercy of a break above it. The page-top rule stays where it
// already lived: in CSS (`.script-sheet > *:first-child`), which becomes
// per-page for free the moment there is more than one sheet, and which the
// paginator's own `spaceBefore: 0` at every page top agrees with by
// construction.
function buildElementStyle(t: ScriptElType): React.CSSProperties {
  const rightAlign = RIGHT_ALIGN_TYPES.has(t);
  const space = SPACE_BEFORE[t];
  return {
    maxWidth: `${WIDTH_CH[t]}ch`,
    marginLeft: rightAlign ? 'auto' : `${INDENT_CH[t]}ch`,
    marginRight: rightAlign ? 0 : undefined,
    marginTop: space > 0 ? `calc(var(--script-line) * ${space})` : 0,
    textAlign: rightAlign ? 'right' : 'left',
    textTransform: UPPERCASE_TYPES.has(t) ? 'uppercase' : 'none',
  };
}

const EL_STYLE: Partial<Record<ScriptElType, React.CSSProperties>> = {};
const EL_STYLE_STATIC: Partial<Record<ScriptElType, React.CSSProperties>> = {};
for (const t of ['scene', 'action', 'character', 'paren', 'dialogue', 'transition', 'shot', 'general'] as ScriptElType[]) {
  EL_STYLE[t] = Object.freeze(buildElementStyle(t));
  EL_STYLE_STATIC[t] = Object.freeze({ ...buildElementStyle(t), cursor: 'text' });
}
// A doc may carry a type this build has no row for (scriptMetrics.ts names the
// mechanism and the live example). It gets `action`'s frame, computed once.
const elementStyle = (t: ScriptElType): React.CSSProperties => EL_STYLE[t] ?? (EL_STYLE.action as React.CSSProperties);
const elementStyleStatic = (t: ScriptElType): React.CSSProperties => EL_STYLE_STATIC[t] ?? (EL_STYLE_STATIC.action as React.CSSProperties);

// -- SC2 S2b — THE SCRIPT PAGE'S VERTICAL POLICY, STATED ---------------------
//
// Until now this surface had no vertical policy; it had a SIDE EFFECT. The page
// scrolled because `ActiveScriptElement` calls `node.focus()` on mount, and
// focusing an element below the fold scrolls it into view — so every Enter moved
// the box, and nobody had ever decided that it should. It is why the behaviour
// broke on SC2 S1, a change that had nothing to do with scrolling (sc1.mjs's own
// S3 park records the measurement). A paginated surface cannot leave that
// undecided: crossing a page break MUST have a stated answer.
//
// THE RULE, in three clauses. It is a rule, not a description of what happens:
//
//   1. FOCUS NEVER SCROLLS. Every focus() on this surface passes
//      `{ preventScroll: true }`. Placing the caret is not a request to move
//      the paper.
//   2. THE BOX MOVES ONLY TO KEEP THE CARET VISIBLE, AND ONLY BY THE MINIMUM.
//      If the caret is inside the scroll box's visible band, the box does not
//      move at all — not by a pixel, not to centre anything. If the caret is
//      above the band, the box scrolls up until the caret's own top sits on the
//      band's top edge; if below, down until its bottom sits on the band's
//      bottom edge. Nothing else moves the page.
//   3. NO ANIMATION, NO FRACTION, NO HOME. The page never repositions itself
//      for aesthetic reasons — no typewriter line, no quarter-down start, no
//      easing. A screenplay page stays where the writer put it.
//
// Clause 2 is measured off the CARET, not the element: an action block can be
// taller than the whole visible band, and scrolling its top into view would send
// the caret at its foot straight back off the bottom.
//
// OPEN AND DELIBERATELY UNANSWERED: whether a caret sitting flush on the band's
// bottom edge wants breathing room above the edge. That is Nick's call, it is on
// the ledger for the sitting, and inventing a number here would make it look
// ruled. Clause 2 gives it exactly zero until he says otherwise.
function scrollBoxOf(node: HTMLElement): HTMLElement | null {
  for (let p = node.parentElement; p; p = p.parentElement) {
    const oy = getComputedStyle(p).overflowY;
    if (oy === 'auto' || oy === 'scroll') return p;
  }
  return null;
}

function caretRectIn(node: HTMLElement): DOMRect {
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    if (node.contains(range.startContainer)) {
      const r = range.getBoundingClientRect();
      // A collapsed range in an EMPTY contenteditable can report all zeros;
      // the element's own box is the honest fallback for "where the caret is".
      if (r.height > 0 || r.width > 0 || r.top !== 0) return r;
    }
  }
  return node.getBoundingClientRect();
}

function keepCaretVisible(node: HTMLElement): void {
  const caret = caretRectIn(node);
  const box = scrollBoxOf(node);
  if (box) {
    const view = box.getBoundingClientRect();
    if (caret.top >= view.top && caret.bottom <= view.bottom) return;      // clause 2 — it does not move
    box.scrollTop += caret.top < view.top ? caret.top - view.top : caret.bottom - view.bottom;
    return;
  }
  // Below the framed gate there is no bounded cap; the window is the box.
  if (caret.top >= 0 && caret.bottom <= window.innerHeight) return;
  window.scrollBy(0, caret.top < 0 ? caret.top : caret.bottom - window.innerHeight);
}

// -- caret helpers: a live element here is always a single text node (or
// none, when empty) — plaintext-only guarantees no nested markup. ----------
function getCaretOffset(el: HTMLElement): number {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return 0;
  const range = sel.getRangeAt(0);
  if (!el.contains(range.startContainer)) return 0;
  const pre = range.cloneRange();
  pre.selectNodeContents(el);
  pre.setEnd(range.startContainer, range.startOffset);
  return pre.toString().length;
}

function setCaretOffset(el: HTMLElement, offset: number): void {
  const sel = window.getSelection();
  if (!sel) return;
  const textNode = el.firstChild;
  const range = document.createRange();
  if (!textNode) {
    range.setStart(el, 0);
  } else {
    const len = textNode.textContent?.length ?? 0;
    range.setStart(textNode, Math.max(0, Math.min(offset, len)));
  }
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

// Commit-processing for an element that's about to stop being active:
// auto (CONT'D) first (name-matching reads the raw typed case), then
// uppercase-on-commit for the types that display uppercase.
function commitElement(elements: ScriptEl[], index: number): ScriptEl[] {
  const el = elements[index];
  if (!el) return elements;
  let text = applyAutoContd(elements, index, el.text);
  if (UPPERCASE_TYPES.has(el.t)) text = text.toUpperCase();
  if (text === el.text) return elements;
  return elements.map((e, i) => (i === index ? { ...e, text } : e));
}

type CaretHint = 'start' | 'end' | number;

// -- the ONE live contenteditable block --------------------------------------
function ActiveScriptElement({
  el, caretHint, onInput, onKeyDown, elRef, docIndex, sessionKey, liveCaret, noteCaret,
}: {
  el: ScriptEl;
  caretHint: CaretHint;
  onInput: (text: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  elRef: React.MutableRefObject<HTMLDivElement | null>;
  docIndex: number;
  sessionKey: string;
  liveCaret: React.MutableRefObject<{ key: string; offset: number } | null>;
  noteCaret: () => void;
}) {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const [seed] = useState(() => el.text);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    node.textContent = seed;
    // SC2 S2b — clause 1 of the vertical policy (see the rule above). This
    // single argument is the whole of the defect Fable charged to this slice:
    // the page's scrolling was the browser's reflex to focus(), never a
    // decision. Clause 2 then makes the decision, explicitly, one line down.
    node.focus({ preventScroll: true });
    // SC2 S5 — THE CARET ACROSS THE BREAK, and this line is the fix.
    //
    // OBSERVED, not predicted (2026-07-29). Sheets are DOM parents keyed by page
    // index, so when the paginator moves the ACTIVE element to another sheet,
    // React deletes it from one parent's child list and inserts it into the
    // other's — it never moves a host node between parents. The live
    // contenteditable is destroyed and a fresh one mounts in its place. Proved
    // with an expando on the node (a property React cannot preserve across a
    // delete+insert): one Tab on the last element of a page and the expando was
    // gone, the element had crossed sheet 0 to sheet 1.
    //
    // What that cost: `caretHint` is written ONLY by `moveActive`, and `retype`,
    // `handleInput` and `acceptAutocomplete` never call it — so on a crossing
    // caused by a mutation rather than a navigation, the fresh instance restored
    // the caret to a hint left over from the last ACTIVATION. Measured: caret at
    // 12, restored to 9, and the writer's next two keystrokes landed at 9 —
    // inside the word they had just typed.
    //
    // So the remount is preferred-over: if this mount is the SAME edit session
    // as the one that just ended (same element id, same seedNonce — i.e. React
    // rebuilt us for a reason of its own rather than because the writer moved),
    // the live offset the writer actually had wins over the stale hint. On a
    // genuine activation the key does not match and `caretHint` governs exactly
    // as before.
    //
    // WHAT THIS DOES NOT FIX, stated so it is not read as more: a remount still
    // destroys a new DOM node's worth of browser state that no offset can
    // restore — an in-flight IME composition, a non-collapsed selection (only
    // the caret's start offset travels), and the element's native undo stack.
    // Those need the class dissolved, not the symptom closed.
    const remembered = liveCaret.current && liveCaret.current.key === sessionKey ? liveCaret.current.offset : null;
    const offset = remembered !== null
      ? Math.max(0, Math.min(remembered, seed.length))
      : caretHint === 'start' ? 0 : caretHint === 'end' ? seed.length : caretHint;
    setCaretOffset(node, offset);
    keepCaretVisible(node);

    // I0 pen discipline: the pen points, never types, never inks — the
    // recognizer hazard returns exactly at a live contenteditable and is
    // pre-empted here (BoardTextBox's pattern, verbatim).
    node.style.touchAction = 'none';
    node.setAttribute('handwriting', 'false');
    const neutralizePen = (e: PointerEvent) => {
      if (e.pointerType !== 'pen') return;
      e.preventDefault();
      e.stopPropagation();
    };
    const opts = { passive: false, capture: true } as const;
    node.addEventListener('pointerdown', neutralizePen, opts);
    node.addEventListener('pointermove', neutralizePen, opts);
    node.addEventListener('pointerup', neutralizePen, opts);

    // Voice Wall — foreign paste/drop blocked + whispered; an allowed
    // own-shadow paste proceeds natively (BoardTextBox's pattern, verbatim).
    const onBeforeInput = (e: InputEvent) => {
      const it = e.inputType || '';
      if (it === 'insertFromPaste' || it === 'insertFromDrop') {
        if (shadowAllows(extractIncomingText(e))) return;
        e.preventDefault();
        notePasteBlocked();
      }
    };
    const blockForeign = (e: Event) => {
      if (shadowAllows(extractIncomingText(e))) return;
      e.preventDefault();
      notePasteBlocked();
    };
    node.addEventListener('beforeinput', onBeforeInput as EventListener);
    node.addEventListener('paste', blockForeign);
    node.addEventListener('drop', blockForeign);

    return () => {
      node.removeEventListener('pointerdown', neutralizePen, opts);
      node.removeEventListener('pointermove', neutralizePen, opts);
      node.removeEventListener('pointerup', neutralizePen, opts);
      node.removeEventListener('beforeinput', onBeforeInput as EventListener);
      node.removeEventListener('paste', blockForeign);
      node.removeEventListener('drop', blockForeign);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={n => { nodeRef.current = n; elRef.current = n; }}
      className="script-el script-el-active"
      data-type={el.t}
      data-ghost={GHOST_TEXT[el.t]}
      contentEditable={PLAINTEXT_MODE}
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      aria-label={`Script ${el.t} — active`}
      onInput={() => onInput(nodeRef.current?.textContent ?? '')}
      onKeyDown={onKeyDown}
      onKeyUp={noteCaret}
      onMouseUp={noteCaret}
      style={elementStyle(el.t)}
      data-doc-index={docIndex}
    />
  );
}

// SC2 S2b — EVERY PROP IS NOW STABLE BY CONSTRUCTION, which is the whole point.
// `onActivate` used to be a fresh `(x, y) => activateAt(i, x, y)` closure per
// element per render — the second of the two things (with elementStyle's object)
// that would have made S5's React.memo a no-op. It is gone: activation is one
// delegated handler on the sequence, reading `data-doc-index` off the DOM, which
// is stable by construction rather than by discipline.
//
// `text` is a prop rather than `el.text` because a page break can cut an action
// block in half; for everything else it IS `el.text`, so identity is unchanged.
// `docIndex` is the DOCUMENT index — `activateAt` addresses the flat element
// array and must keep doing so; a page-local position would silently address
// the wrong element the moment a break moved above it.
function StaticScriptElement({ el, text, docIndex, continues, continuedFrom }: {
  el: ScriptEl;
  text: string;
  docIndex: number;
  continues: boolean;
  continuedFrom: boolean;
}) {
  return (
    <div
      className="script-el"
      data-type={el.t}
      data-doc-index={docIndex}
      data-continues={continues ? 'true' : undefined}
      data-continued-from={continuedFrom ? 'true' : undefined}
      style={elementStyleStatic(el.t)}
    >
      {text}
    </div>
  );
}

// SC2 S2b — the writer's own text for ONE part of a placed element.
//
// For everything that is not split this returns `el.text` BY IDENTITY, so the
// overwhelmingly common case adds nothing at all — no allocation, no work, and
// the prop identity S5's memo will depend on is unchanged.
//
// For the one permitted split (an action block longer than a whole page) it cuts
// the text at exactly the line the paginator counted to, using the SAME wrap
// function the count came from. That is why `wrapToLines` exists: a second
// slicing routine would have been the obvious way to add this, and the obvious
// way to end up rendering a break the arithmetic did not place.
function textOfPart(el: ScriptEl, p: Placed): string {
  if (!p.continues && !p.continuedFrom) return el.text;
  // join('') — never '\n'. The lines concatenate back to the writer's text
  // exactly (scriptLedger's own contract), so a part is a genuine SUBSTRING and
  // `pre-wrap` re-wraps it into the identical lines. Joining with '\n' also
  // renders correctly and is a lie about the text: it writes breaks the writer
  // never typed into the DOM.
  return wrapToLines(el.text, widthChFor(el.t)).slice(p.lineOffset, p.lineOffset + p.lines).join('');
}

function AutocompletePopover({ state, index, indentCh }: { state: AutocompleteState; index: number; indentCh: number }) {
  return (
    <div className="script-autocomplete" role="listbox" aria-label="Script autocomplete" style={{ marginLeft: `${indentCh}ch` }}>
      {state.options.map((o, i) => (
        <div key={o} className="script-autocomplete-opt" data-highlighted={i === index ? 'true' : 'false'} role="option" aria-selected={i === index}>
          {o}
        </div>
      ))}
    </div>
  );
}

export function ScriptEditor({ id }: { id: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const initialEntry = getJournalEntry(id);
  const initialDoc = initialEntry?.script ?? createEmptyScriptDoc();
  // AB1 S1/S2 — DeskFrame owns the viewport at >=1100px only; below that
  // this renders its exact pre-AB1 markup (findings 4 and 5 both live only
  // in the framed branch, since a <1100px script surface is untouched).
  const framed = useDeskFrameViewport();
  const [showPublish, setShowPublish] = useState(false);
  // E1 S2 — the same quiet confirmation line PageEditor.tsx's own Publish
  // dialog uses (ActionToast, reused — not a second pattern).
  const publishToast = useActionToast();
  const { t: dt } = useDeskLexicon();
  // AB2 S4 — the Structure picker's one-way warning (screenplay -> prose;
  // element types don't survive the trip). Switching an empty script is free.
  const [structureConfirm, setStructureConfirm] = useState(false);
  // AB2 S2 DoD — the typewriter option used to reach the script surface's
  // Draft posture through the rail, with its hold-band targeting the bounded
  // scroll-cap AB1's containment fix (finding 4) gives this surface.
  //
  // SC1 S3, AMENDED 2026-07-24 (Nick's word, via Fable): **the screenplay
  // surface does not run the typewriter at all**, interim, pending his own
  // revision of typewriter mode in a separate build. So this surface no
  // longer calls useTypewriterFade — the hook and its shared engine are
  // untouched and byte-identical for prose (ModeStage) and Journal
  // (JournalEntry), which keep it exactly as FX5 shipped it.
  //
  // This AMENDS AB2 S2's own definition of done ("the typewriter option
  // reaches the script surface's Draft posture") on the record — recorded in
  // the ledger and in the SC1 report, and carried in ab2.mjs's own park
  // cycle in the same commit, so it can never fail silently.
  //
  // The scroll cap itself stays exactly as it is: it is AB1's containment
  // fix (a bounded height + internal scroll for a sheet that grows with the
  // document), which has nothing to do with the typewriter. What goes with
  // the hook is the static `--tw-start-offset` padding that rode on
  // `[data-typewriter='true']` — the measured root of SC-V4 (an
  // unconditional 183px pushing a brand-new page's caret to 38.2% of the
  // box). See index.css's own rule.
  const scrollCapRef = useRef<HTMLDivElement>(null);
  // FX2 S2 gave this surface the Draft-open typewriter seed: on mount it wrote
  // the GLOBAL typewriter setting from the page's own line count, exactly as
  // PageEditor.tsx does for prose.
  //
  // SC1 S3, AMENDED 2026-07-24 — that seed retires here with the typewriter
  // itself. It was never a script-local value: `seedTypewriterDefault` writes
  // the shared `wrizo-writing-settings` store, so leaving it in place would
  // have a screenplay page — a surface that no longer runs the typewriter at
  // all — silently flip the writer's typewriter setting for PROSE and Journal
  // on open, purely as a side effect of opening a script. Prose keeps its own
  // identical seed in PageEditor.tsx, untouched.
  // AB1 S3 — the vanishing law, generalized to the script surface's own
  // DeskFrame chrome (the mode strip; the corner glyph via App.tsx's shared
  // isWriting session). Mounted unconditionally (rootRef omitted -> writes
  // --fade-dur onto <html>, same default every other caller relies on) but
  // only ever actually triggered when framed (see handleInput below) — below
  // the 1100px gate this never dissolves anything, matching pre-AB1
  // behavior exactly (script never had a dissolve engine before this).
  const scriptDissolve = useChromeDissolve({ surface: 'script', editorSelector: '.script-sheet' });

  // W2 — route + mount identity only (S1: element-level state — active index,
  // caret hint — is this surface's own thing; no scroll/caret capture here).
  useWayBack({ entryId: id });

  const [elements, setElements] = useState<ScriptEl[]>(() => flattenScenes(initialDoc.scenes));
  const [activeIndex, setActiveIndex] = useState(0);
  const [caretHint, setCaretHint] = useState<CaretHint>('end');
  const [seedNonce, setSeedNonce] = useState(0);
  const [acIndex, setAcIndex] = useState(0);
  const [acDismissed, setAcDismissed] = useState<string | null>(null);
  // CD1 S7 — the Page face's sending-verb sheets (mirrors PageEditor.tsx's
  // own wiring verbatim; the Screenplay Room never had a Page face before
  // this ticket — Move/Copy/Port-to-Board are genuinely new capability
  // here, same as they were for PageEditor in AB3). B2 S4 — Move/Copy
  // (`addOpen`, AddToSheet) RETIRES: superseded by the Places panel.
  const [portOpen, setPortOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false); // AB4 S2 — "Pin to a Board…" sheet

  const elementsRef = useRef(elements);
  elementsRef.current = elements;
  const scenesRef = useRef<Scene[]>(initialDoc.scenes);
  const lastSavedRef = useRef(elements);
  const activeElRef = useRef<HTMLDivElement | null>(null);
  // SC2 S5 — where the writer's caret ACTUALLY is, as against `caretHint`, which
  // is where the last ACTIVATION put it. Keyed by element id + seedNonce so it
  // can only ever be spent on a remount of the very same edit session; a genuine
  // activation carries a different key and falls through to the hint.
  const liveCaret = useRef<{ key: string; offset: number } | null>(null);

  // SC2 S2b — the projection. Derived from `elements` and nothing else, so it is
  // recomputed exactly when the document changes and not when the caret hint,
  // the autocomplete index or a dialog's open flag does. (This is NOT S5's
  // memoization — that one is React.memo on the element components, and the
  // seam for it is the frozen style objects and the delegated activation
  // handler, both already in place above.)
  const pages: Page[] = useMemo(() => {
    const projected = paginate(lineLedger(elements));
    // A screenplay is never nought pages: an empty document is one blank sheet.
    return projected.length ? projected : [{ index: 0, placed: [], linesUsed: 0 }];
  }, [elements]);

  // Document index by element id. The projection preserves document order, so a
  // running counter would also work — but it would be a counter whose
  // correctness depended on the traversal order of two nested maps, and this
  // cannot be got wrong by a later edit.
  const docIndexById = useMemo(() => {
    const m = new Map<string, number>();
    elements.forEach((el, i) => { if (!m.has(el.id)) m.set(el.id, i); });
    return m;
  }, [elements]);

  const project: Project | null = initialEntry?.projectId ? getProject(initialEntry.projectId) : null;
  const drawer = project?.drawerId ? getDrawer(project.drawerId) : null;
  const { t: lex, tMany: lexMany } = useLexicon();

  const activeEl = elements[activeIndex];
  const ac = activeEl ? computeAutocomplete(activeEl.t, activeEl.text, elements) : null;
  const acSig = ac ? `${activeIndex}:${ac.kind}:${ac.query}` : null;
  const acVisible = !!ac && acSig !== acDismissed;

  useEffect(() => { setAcIndex(0); }, [acSig]);

  // Autosave — debounced, through saveScriptDoc (doc + shadow in one write).
  useEffect(() => {
    if (elements === lastSavedRef.current) return;
    const h = setTimeout(() => {
      const scenes = groupIntoScenes(elementsRef.current, scenesRef.current);
      scenesRef.current = scenes;
      saveScriptDoc(id, { v: 1, scenes });
      lastSavedRef.current = elementsRef.current;
    }, AUTOSAVE_MS);
    return () => clearTimeout(h);
  }, [elements, id]);

  useEffect(() => {
    const doFlush = () => {
      if (elementsRef.current !== lastSavedRef.current) {
        const scenes = groupIntoScenes(elementsRef.current, scenesRef.current);
        scenesRef.current = scenes;
        saveScriptDoc(id, { v: 1, scenes });
        lastSavedRef.current = elementsRef.current;
      }
    };
    const onHide = () => { if (document.visibilityState === 'hidden') { doFlush(); flushNow(); } };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      doFlush();
      flushNow();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // F5 — TTFK for the Screenplay Room, same seam as every other surface.
  const noteSessionKeystroke = useSessionLog('script', {
    projectId: () => initialEntry?.projectId ?? null,
    words: () => elementsRef.current.reduce((n, e) => n + wordCount(e.text), 0),
  });
  const firedFirstKeystroke = useRef(false);
  const noteFirstKeystroke = () => { if (!firedFirstKeystroke.current) { firedFirstKeystroke.current = true; noteSessionKeystroke(); } };

  if (!initialEntry) return null;

  // CD1 S7 — star/tag mutations, mirroring PageEditor.tsx's own
  // patch-based closures (shared via store/persistence.ts's
  // patchJournalEntry so neither host can drift on the "merge live text"
  // discipline). The script's own "live text" is its serialized doc, not
  // ForwardOnlyEditor's textRef — recomputed from the live element/scene
  // state at click-time so a Star tap right after typing can't clobber an
  // unflushed edit (AUTOSAVE_MS is 2000ms).
  const liveScriptText = () => serializeScriptDoc({ v: 1, scenes: groupIntoScenes(elementsRef.current, scenesRef.current) });
  const toggleStar = () => { patchJournalEntry(id, liveScriptText(), { starred: !initialEntry.starred }); flushNow(); };
  const addTag = (tag: string) => {
    const tags = initialEntry.tags ?? [];
    if (!tags.includes(tag)) patchJournalEntry(id, liveScriptText(), { tags: [...tags, tag] });
    flushNow();
  };
  const removeTag = (tag: string) => {
    patchJournalEntry(id, liveScriptText(), { tags: (initialEntry.tags ?? []).filter(t => t !== tag) });
    flushNow();
  };

  // AB4 S2 — every board currently pinning this page, for the truthful
  // "Also pinned to <board>." membership line(s).
  const pinnedBoardTitles = getBoardsPinning(initialEntry.id).map(b => b.title);
  const { homeLabel, memberships } = describePageHome(initialEntry, project, pinnedBoardTitles);
  const pageFaceSubject: PageFaceSubject = {
    kind: 'page',
    entry: initialEntry,
    homeLabel,
    memberships,
    footer: initialEntry.projectId == null ? 'Saved automatically — even if you never file it to a Drawer or the Shelf.' : undefined,
    onToggleStar: toggleStar,
    onAddTag: addTag,
    onRemoveTag: removeTag,
    onOpenPortToBoard: () => setPortOpen(true),
    onOpenPin: () => setPinOpen(true),
  };

  // CD2 S1/S5/S7 — the cascade, replacing the Drawer whole; mirrors the
  // prose wiring exactly (S7's own standing "mirror the wiring" convention).
  const cascade = useCascade({ subject: pageFaceSubject, project, navigate });

  const moveActive = (nextIndex: number, hint: CaretHint) => {
    setActiveIndex(nextIndex);
    setCaretHint(hint);
    setSeedNonce(n => n + 1);
    setAcDismissed(null);
  };

  const noteCaret = () => {
    const node = activeElRef.current;
    const el = elements[activeIndex];
    if (!node || !el) return;
    liveCaret.current = { key: `${el.id}:${seedNonce}`, offset: getCaretOffset(node) };
  };

  const retype = (nextType: ScriptElType) => {
    setElements(prev => prev.map((e, i) => (i === activeIndex ? { ...e, t: nextType } : e)));
  };

  const handleInput = (text: string) => {
    noteFirstKeystroke();
    noteCaret();
    if (framed) scriptDissolve.noteWrite(); // AB1 S3 — see the hook's mount comment above
    setElements(prev => {
      const el = prev[activeIndex];
      if (!el) return prev;
      const promote = el.t === 'action' && shouldPromoteToScene(text);
      return prev.map((e, i) => (i === activeIndex ? { ...e, text, t: promote ? 'scene' : e.t } : e));
    });
    setAcDismissed(null);
  };

  const acceptAutocomplete = () => {
    if (!ac) return;
    const chosen = ac.options[acIndex] ?? ac.options[0];
    const newText = applyAutocomplete(activeEl.text, ac, chosen);
    setElements(prev => prev.map((e, i) => (i === activeIndex ? { ...e, text: newText } : e)));
    // Re-seed the live node directly too so the caret lands correctly without
    // waiting a render (the mount effect only seeds once per edit session).
    const node = activeElRef.current;
    if (node) { node.textContent = newText; setCaretOffset(node, newText.length); }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (acVisible && ac) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setAcIndex(i => (i + 1) % ac.options.length); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setAcIndex(i => (i - 1 + ac.options.length) % ac.options.length); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); acceptAutocomplete(); return; }
      if (e.key === 'Escape') { e.preventDefault(); setAcDismissed(acSig); return; }
    }

    const node = activeElRef.current;
    // The live DOM is ground truth for "what's actually typed right now" —
    // React state (`activeEl.text`) is only guaranteed current as of the
    // last processed input event, and Enter's keydown can in principle be
    // dispatched before that update flushes (e.g. a fast synthetic-event
    // harness). Reading textContent directly sidesteps any staleness.
    const offset = node ? getCaretOffset(node) : 0;
    const text = node?.textContent ?? activeEl?.text ?? '';

    if (e.key === 'Enter') {
      e.preventDefault();
      if (text.trim().length === 0) {
        retype(ENTER_MAP[activeEl.t]);
        return;
      }
      const atEnd = offset >= text.length;
      const head = atEnd ? text : text.slice(0, offset);
      const tail = atEnd ? '' : text.slice(offset).trim();
      const nextType = ENTER_MAP[activeEl.t];
      const newEl = newElement(nextType, tail);
      setElements(prev => {
        const withHead = prev.map((el, i) => (i === activeIndex ? { ...el, text: head } : el));
        const committed = commitElement(withHead, activeIndex);
        const next = [...committed];
        next.splice(activeIndex + 1, 0, newEl);
        return next;
      });
      moveActive(activeIndex + 1, 'start');
      return;
    }

    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      retype(TAB_MAP[activeEl.t]);
      return;
    }
    if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      retype(cycleBackward(activeEl.t));
      return;
    }
    if ((e.ctrlKey || e.metaKey) && /^[1-8]$/.test(e.key)) {
      e.preventDefault();
      retype(TYPE_CYCLE[Number(e.key) - 1]);
      return;
    }
    if (e.key === 'Backspace' && offset === 0 && activeIndex > 0) {
      e.preventDefault();
      const prevIndex = activeIndex - 1;
      const boundary = elements[prevIndex]?.text.length ?? 0;
      setElements(prev => {
        // `text` (read above from the live DOM, not `prev[activeIndex].text`)
        // is ground truth for what's actually typed right now — same
        // reasoning as Enter's own DOM read (Fable A2).
        const merged = prev[prevIndex].text + text;
        const next = prev.map((el, i) => (i === prevIndex ? { ...el, text: merged } : el));
        next.splice(activeIndex, 1);
        return next;
      });
      moveActive(prevIndex, boundary);
      return;
    }
    if (e.key === 'ArrowUp' && offset === 0 && activeIndex > 0) {
      e.preventDefault();
      setElements(prev => commitElement(prev.map((el, i) => (i === activeIndex ? { ...el, text } : el)), activeIndex));
      moveActive(activeIndex - 1, 'end');
      return;
    }
    if (e.key === 'ArrowDown' && offset >= text.length && activeIndex < elements.length - 1) {
      e.preventDefault();
      setElements(prev => commitElement(prev.map((el, i) => (i === activeIndex ? { ...el, text } : el)), activeIndex));
      moveActive(activeIndex + 1, 'start');
      return;
    }
  };

  const activateAt = (index: number, clientX: number, clientY: number) => {
    if (index === activeIndex) return;
    const domText = activeElRef.current?.textContent;
    setElements(prev => commitElement(
      domText != null ? prev.map((el, i) => (i === activeIndex ? { ...el, text: domText } : el)) : prev,
      activeIndex,
    ));
    let hint: CaretHint = 'end';
    const caretApi = (document as unknown as { caretRangeFromPoint?: (x: number, y: number) => Range | null }).caretRangeFromPoint;
    if (caretApi) {
      try {
        const range = caretApi.call(document, clientX, clientY);
        if (range) hint = range.startOffset;
      } catch { /* best-effort */ }
    }
    moveActive(index, hint);
  };

  // SC2 S2b — ONE delegated handler for the whole sequence, replacing the
  // per-element `(x, y) => activateAt(i, x, y)` closure. Two reasons, and the
  // second is the load-bearing one: (a) N elements no longer mean N new function
  // objects per render, which is the S5 memoization seam; (b) the index it reads
  // is the DOCUMENT index off the DOM, so it cannot drift from the flat element
  // array that `activateAt` addresses, however the pages above it break.
  const onSequenceClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement | null)?.closest?.('.script-el[data-doc-index]');
    if (!target) return;
    const index = Number(target.getAttribute('data-doc-index'));
    if (!Number.isInteger(index) || index < 0 || index >= elements.length) return;
    activateAt(index, e.clientX, e.clientY);
  };

  // copyScriptText is used by BOTH the legacy (<1100px) toolbar's own
  // pre-existing "Copy script text" button (which has no Publish dialog and
  // no toast mounted at all — untouched, per the "legacy unchanged"
  // invariant) AND the framed Publish dialog's "Copy Formatted" button.
  // Left exactly as it always was (fire-and-forget) so the legacy caller's
  // behavior is byte-identical; the framed dialog gets its own confirming
  // wrapper below instead of teaching this shared function about a toast
  // node that doesn't exist on the legacy branch.
  const copyScriptText = () => {
    const scenes = groupIntoScenes(elementsRef.current, scenesRef.current);
    copyText(serializeScriptDoc({ v: 1, scenes }));
  };

  // E1 S2 — the framed Publish dialog's own "Copy Formatted", which DOES
  // have a mounted toast: awaits copyText's own success/failure and says
  // so (the same fix/rationale as PageEditor.tsx's own doCopy).
  const publishCopyFormatted = async () => {
    const scenes = groupIntoScenes(elementsRef.current, scenesRef.current);
    const ok = await copyText(serializeScriptDoc({ v: 1, scenes }));
    publishToast.show(ok ? dt('publishCopyFormattedConfirm') : dt('publishCopyFailed'));
  };

  // AB2 S5 — "Copy My Words": the writer's own lines, screenplay convention
  // (uppercase sluglines, dialogue-block tightening) stripped back out. Only
  // ever rendered in the framed Publish dialog (no legacy equivalent
  // button exists), so it can safely await + confirm directly.
  const copyMyWords = async () => {
    const scenes = groupIntoScenes(elementsRef.current, scenesRef.current);
    const ok = await copyText(plainScriptWords({ v: 1, scenes }));
    publishToast.show(ok ? dt('publishCopyWordsConfirm') : dt('publishCopyFailed'));
  };

  // E1 S3 — the LIVE reconstructed doc (elementsRef/scenesRef), never a
  // stale persisted `entry.script` — matches what Copy already does above,
  // so a download the instant after typing can't lose the keystroke the
  // 2s autosave debounce hasn't flushed yet.
  const flushScriptNow = () => {
    const scenes = groupIntoScenes(elementsRef.current, scenesRef.current);
    scenesRef.current = scenes;
    saveScriptDoc(id, { v: 1, scenes });
    lastSavedRef.current = elementsRef.current;
    flushNow();
    return scenes;
  };
  const downloadThisPage = (format: 'md' | 'txt') => {
    const scenes = groupIntoScenes(elementsRef.current, scenesRef.current);
    const liveEntry = { ...initialEntry, script: { v: 1 as const, scenes } };
    const files = exportPageFiles(liveEntry);
    const ok = triggerDownload(`${files.base}.${format}`, format === 'md' ? files.md : files.txt, format === 'md' ? 'text/markdown' : 'text/plain');
    publishToast.show(ok ? dt('publishDownloadConfirm') : dt('publishDownloadFailed'));
  };
  const downloadBinder = () => {
    flushScriptNow();
    if (!project) return;
    const { filename, content } = exportBinderDocument(project);
    const ok = triggerDownload(filename, content, 'text/markdown');
    publishToast.show(ok ? dt('publishDownloadConfirm') : dt('publishDownloadFailed'));
  };
  const downloadEverything = () => {
    flushScriptNow();
    const { filename, content } = exportEverythingDocument();
    const ok = triggerDownload(filename, content, 'text/markdown');
    publishToast.show(ok ? dt('publishDownloadConfirm') : dt('publishDownloadFailed'));
  };

  // AB2 S4 — Structure picker, screenplay -> prose. entry.text (the derived
  // shadow, kept current by every autosave above) IS the prose rendering;
  // adopt it verbatim. Element types do not survive — the one-way warning
  // this gates. Mechanical only: no AI, nothing here rewrites a word.
  const convertToProse = () => {
    const scenes = groupIntoScenes(elementsRef.current, scenesRef.current);
    const doc = { v: 1 as const, scenes };
    saveScriptDoc(id, doc); // flush the live doc + its shadow first
    const latest = getJournalEntry(id);
    if (!latest) return;
    saveJournalEntry({ ...latest, pageType: 'manuscript', script: undefined });
  };
  const requestProse = () => {
    const scenes = groupIntoScenes(elementsRef.current, scenesRef.current);
    if (isScriptEmpty({ v: 1, scenes })) { convertToProse(); return; }
    setStructureConfirm(true);
  };
  const onSwitchStructure = (next: 'prose' | 'screenplay') => {
    if (next === 'screenplay') return; // already screenplay — nothing to do here
    requestProse();
  };
  const sliverContent: SliverContent = {
    kind: 'draft',
    structure: 'screenplay',
    onSwitchStructure,
  };
  // CD1 S6 — the goal system's live text for this surface: the script's
  // elements read as lines (matches the deterministic hard-newline
  // splitting store/lineEquivalents.ts already does for prose — one
  // element per line is the script's own natural "line" unit).
  const goalText = elements.map(e => e.text).join('\n');

  const title = elements.find(e => e.t === 'scene')?.text.trim() || 'Untitled';
  const backTo = project ? `/project/${project.id}` : '/journal';
  // AB4 S4 — "way back guaranteed" for a page-pin card's double-click
  // travel (BoardEditor.tsx), the same `location.state` precedent PageEditor/
  // JournalEntry use (mirrored from F2's own warm-start signal). Framed-only.
  const fromBoard = (location.state as { fromBoardId?: string } | null)?.fromBoardId ?? null;

  // Draft law only (S1, still true below the AB1 gate) — the Screenplay
  // Room's forward-only mode (script Free-write) is AB2, not this ticket;
  // framed (S2) shows all five ModeStrip strings with Free Write/Revise/
  // Workshop deferred and Draft the only live posture.
  // FX1 S2 — the script sheet's own width is no longer a bare inline
  // maxWidth: it lives inside `.mode-pagecol` (mounted below, in the framed
  // branch only), the SAME paper geometry class/width band prose uses (Law
  // 1). Legacy (<1100px) is untouched — it never wrapped in mode-pagecol and
  // keeps this inline width exactly as before.
  // SC1 S1 — and now legacy's inline width goes too. `maxWidth:'60ch'` capped
  // the sheet at the TEXT MEASURE (6.0in) where the page itself is 8.5in, so
  // the legacy paper was a page's measure with a page's margins crammed
  // inside it — the same "no page, only furniture" defect the framed branch
  // had, wearing an inline style instead of a missing one. The page's
  // geometry is single-sourced in `.script-sheet` now (index.css) and applies
  // to BOTH branches; an inline maxWidth here would be the one thing able to
  // override it. Legacy's markup shape is otherwise unchanged (no DeskFrame,
  // no `.mode-pagecol`, still `.script-page` — fx7.mjs S1's own assertion).
  //
  // SC2 S2b — THE SHEET SEQUENCE. The surface stops being one sheet that grows
  // and becomes a sequence of true 11in pages: `paginate(lineLedger(elements))`
  // projects the document into pages, and each page renders one `.script-sheet`.
  //
  // THE ELEMENTS ARRAY IS STILL THE EDIT MODEL; PAGES ARE ONLY A PROJECTION.
  // Nothing about pagination is stored, put in state, or persisted — it is
  // recomputed from `elements` and thrown away, which is what makes it unable to
  // drift (store a page array and the first edit above it makes every later page
  // a lie). It is also what makes the count viewport-invariant by construction:
  // no width, font or DOM measurement is an input to the arithmetic, so the same
  // document cannot paginate differently at 1100px and 2200px. A page count that
  // moves with the window is a clock that lies.
  //
  // Page NUMBERS are not here: they are S4's slice (R1), and nothing in SC2
  // shows an aggregate count anywhere.
  const scriptSheet = (
    <div className="script-sequence" onClick={onSequenceClick}>
      {pages.map((page) => (
        <div className="script-sheet" data-page-index={page.index} style={{ position: 'relative' }} key={page.index}>
          {/* SC2 S4 — THE PAGE NUMBER (R1, approved 2026-07-24). Top-right,
              inside the top margin, PAGE ONE BARE, from page two on.

              R1's bright line travels with it and is the harder half of this
              slice: the number lives ON THE PAGE ARTIFACT ONLY. No total, no
              "of N", no aggregate anywhere in the app — not in the sliver, not
              in the Tutor, not in a title, not in an aria-label. The committee
              put it plainly: a page number on a screenplay is not the app
              counting the writer, it is the document's own furniture, as
              intrinsic as a slugline's capitals. An aggregate would be the app
              counting, and that is the line R1 amends by exactly one line and
              nothing more. sc2.mjs asserts the absence as strictly as the
              presence.

              It is CHROME, not body: it sits in the top margin, outside the
              54-line block, so it costs no line the paginator counted. That is
              not asserted by inspection — page one carries no number and every
              other page does, so the standing cross-check that all sheets share
              one first-line offset IS the proof, and it fails the moment the
              number takes a line.

              The trailing period is the trade's own form (Final Draft, Fade In
              and Highland all render "2."). R1 ruled the position and the bare
              first page, not the punctuation — so this is a judgment call
              inside its "per the standard" wording, named here rather than
              left to look ruled, and vetoable in a line. */}
          {page.index > 0 && <div className="script-page-number">{page.index + 1}.</div>}
          {page.placed.map((p) => {
            const i = docIndexById.get(p.entry.id);
            const el = i === undefined ? undefined : elements[i];
            if (!el || i === undefined) return null;
            if (i === activeIndex) {
              // THE ONE LIVE BLOCK, AND ITS ONE STATED EXCEPTION. A
              // contenteditable cannot be cut in half, so an active element the
              // projection splits renders WHOLE on the page where it begins and
              // its continuation parts are skipped. The bound is exact and
              // small: it applies only while the caret is inside an ACTION
              // block longer than a full page (54 lines, ~3,200 characters),
              // and only to that one element. Everything else on every page,
              // and that element itself the moment the caret leaves it, renders
              // the projection exactly. Stated rather than hidden — the
              // alternative was to let pagination depend on where the caret is,
              // which would move the page count as the writer clicked around.
              if (p.continuedFrom) return null;
              return (
                <Fragment key={`${el.id}:${seedNonce}:wrap`}>
                  <ActiveScriptElement
                    key={`${el.id}:${seedNonce}`}
                    el={el}
                    docIndex={i}
                    sessionKey={`${el.id}:${seedNonce}`}
                    liveCaret={liveCaret}
                    noteCaret={noteCaret}
                    caretHint={caretHint}
                    onInput={handleInput}
                    onKeyDown={handleKeyDown}
                    elRef={activeElRef}
                  />
                  {/* Fable R1 — rendered as the active element's own flow-sibling
                      (not the sheet's last child) so its no-top/left absolute
                      position resolves to right beneath THIS block, wherever it
                      sits in the document, instead of the bottom of the sheet. */}
                  {acVisible && ac && <AutocompletePopover state={ac} index={acIndex} indentCh={INDENT_CH[el.t]} />}
                </Fragment>
              );
            }
            return (
              <StaticScriptElement
                key={p.continuedFrom ? `${el.id}:@${p.lineOffset}` : el.id}
                el={el}
                text={textOfPart(el, p)}
                docIndex={i}
                continues={p.continues}
                continuedFrom={p.continuedFrom}
              />
            );
          })}
        </div>
      ))}
    </div>
  );

  // CD1 S1/S7 — framed (>=1100px): the mode strip moves to this header row
  // (left-set; top-bar title/crumb retires — the Page face carries it now,
  // S7's new Drawer); ScriptEditor gains the drawer (Page + Places) and the
  // sliver (structure — script's hand tools), mirroring the prose wiring
  // exactly. AB1 S1/S2/S4's containment fix (finding 4) is unchanged —
  // .desk-frame-scroll-cap still gives the sheet a bounded height +
  // internal scroll. "Copy script text" leaves top chrome (S4, unchanged).
  if (framed) {
    return (
      <div className="desk-frame-host" data-chrome-receded={scriptDissolve.dissolved ? 'true' : 'false'}>
        {/* ab1.1 R1 (Fable review) — the nav row was the one piece of framed
            chrome that never recessed with the rest of the room. */}
        <div className="chrome-fade chrome-top sprint-nav">
          <ModeStrip mode="drafting" onSwitch={() => {}} onPublish={() => setShowPublish(true)} freeWriteEnabled={false} />
          <div className="sprint-actions">
            {/* cd1.1 (Fable review erratum) — the Pages/Plan flight toggle
                belongs beside Done on both hosts; a script page IS a "Pages"
                view (PageEditor.tsx's own toggle carries the same semantics). */}
            {project && (
              <div className="sprint-toggle" role="tablist" aria-label={`${lex('binder')} view`}>
                {/* CD4 S2 — the elder "Plan" flight tab (→ the legacy StructureBoard) is
                    retired on the script page bar too, same as PageEditor's — the legacy
                    beats control is dormant everywhere (secondary access stays; data
                    grandfathered). The script bar carries no PLAN → door, so it now holds
                    just "Pages". */}
                <button type="button" role="tab" aria-selected="true" className="sprint-toggle-btn active" onClick={() => { flushNow(); navigate(`/project/${project.id}`); }}>{lexMany('page')}</button>
              </div>
            )}
            {fromBoard && (
              <button type="button" className="btn-quiet wz-back-to-board" onClick={() => { flushNow(); navigate(`/page/${fromBoard}`); }}>
                ‹ Back to the board
              </button>
            )}
          </div>
        </div>

        <div style={{ height: 16 }} />

        <DeskFrame
          pageKind="screenplay"
          strip={cascade.strip}
          cascadeLayers={cascade.layers}
          sliver={<Sliver content={sliverContent} goalText={goalText} />}
          tutor={<Tutor entry={initialEntry} project={project} pageText={goalText} pageKind="screenplay" />}
          goalGlow={<GoalGlow text={goalText} />}
          dissolved={scriptDissolve.dissolved}
        >
          <div ref={scrollCapRef} className="desk-frame-scroll-cap" data-typewriter="false">
            <div className="mode-pagecol">{scriptSheet}</div>
          </div>
        </DeskFrame>

        {portOpen && <PortToBoardSheet sourceIds={[id]} onClose={() => setPortOpen(false)} />}
        {pinOpen && <PinToBoardSheet entryId={id} onClose={() => setPinOpen(false)} />}

        {showPublish && (
          <div className="sprint-modal-backdrop" onClick={() => setShowPublish(false)}>
            <div className="sprint-modal card" role="dialog" aria-label="Publish" onClick={e => e.stopPropagation()}>
              <div className="card-title">Publish</div>
              {/* E1 S4 — download, real and unmissable, ABOVE the (still
                  true) coming-soon line. */}
              <div style={{ fontWeight: 600, fontSize: 13, letterSpacing: '.02em', margin: '12px 0 6px' }}>{dt('publishDownloadTitle')}</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <button type="button" className="btn-quiet publish-download-page-md" onClick={() => downloadThisPage('md')}>{dt('publishDownloadPageMd')}</button>
                <button type="button" className="btn-quiet publish-download-page-txt" onClick={() => downloadThisPage('txt')}>{dt('publishDownloadPageTxt')}</button>
                {project && <button type="button" className="btn-quiet publish-download-binder" onClick={downloadBinder}>{dt('publishDownloadBinder')}</button>}
                <button type="button" className="btn-quiet publish-download-everything" onClick={downloadEverything}>{dt('publishDownloadEverything')}</button>
              </div>
              {/* AB2 S5 — copy-out comes home to Publish; "the existing
                  copy-script-text rendering" is Copy Formatted verbatim. */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button type="button" className="btn-quiet publish-copy-words" onClick={copyMyWords}>Copy My Words</button>
                <button type="button" className="btn-quiet publish-copy-formatted" onClick={publishCopyFormatted}>Copy Formatted</button>
              </div>
              <p style={{ color: 'var(--text-mid)', fontSize: 14, margin: '0 0 16px' }}>
                {dt('publishComingSoon')}
              </p>
              <button type="button" className="btn-quiet" onClick={() => setShowPublish(false)}>Close</button>
              {publishToast.node}
            </div>
          </div>
        )}

        {structureConfirm && (
          <div className="sprint-modal-backdrop structure-confirm-modal" onClick={() => setStructureConfirm(false)}>
            <div className="sprint-modal card" role="dialog" aria-label="Convert to Prose" onClick={e => e.stopPropagation()}>
              <div className="card-title">Convert to Prose?</div>
              <p style={{ color: 'var(--text-mid)', fontSize: 14, margin: '8px 0 16px' }}>
                This is one-way: element types (scene/character/dialogue/…) will not survive the trip — only the
                plain text carries over, verbatim.
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-quiet" onClick={() => setStructureConfirm(false)}>Cancel</button>
                <button
                  type="button"
                  className="btn-brass structure-confirm-prose"
                  onClick={() => { setStructureConfirm(false); convertToProse(); }}
                >
                  Convert
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="page script-page" style={{ maxWidth: 1100, paddingTop: '2.5rem' }}>
      <div className="sprint-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div className="sprint-crumb" aria-label="Location">
          {drawer && <><span className="crumb-item">{drawer.name}</span><span className="crumb-sep">/</span></>}
          {project && <><span className="crumb-item">{project.title}</span><span className="crumb-sep">/</span></>}
          <span className="crumb-here">{title}</span>
        </div>
        <div className="sprint-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" className="btn-quiet script-copy" onClick={copyScriptText} title="Copy the script's plain text">Copy script text</button>
        </div>
      </div>

      <div style={{ height: 16 }} />

      {/* Draft law only (S1) — no ModeSwitcher/ModeStage on this surface; the
          Screenplay Room's forward-only mode (script Free-write) is S4. */}
      {scriptSheet}
    </div>
  );
}
