import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeskLexicon } from '../store/deskLexicon';
import type { JournalEntry, Project, Fact } from '../types';
import { generateId, getBinderPages, getJournalEntry, appendTutorMessage, advanceTutorCursor, isUnborn } from '../store/persistence';
import { getTutorDisclosureSeen, setTutorDisclosureSeen } from '../store/tutorDisclosure';
import { apiTutorChat } from '../store/api';
import { computeConsistencyObservations } from '../store/tutorConsistency';
import { computeStructureFacts, computeFragmentItems } from '../store/tutorLenses';
// FX12 S1 — the computeNudges import is retired; store/tutorNudges.ts sleeps dormant.
import { estimateTurnCostUSD, formatEstimatedUSD } from '../store/tutorCostEstimates';
import { addTutorSessionCost } from '../store/tutorMeter';
import { useBibleFacts, getBibleFacts, addFact, editFact, deleteFact, FACT_TEXT_CAP } from '../store/tutorBible';
import type { EditorMode } from './ForwardOnlyEditor';
import { FREE_WRITE_POOLS, DRAW_CEILING, REFILL_WORDS, drawFrom, recentMemoryFor, type FreeWritePresetId } from '../store/tutorFreeWriteDeck';
import { useMonotonicWordCount } from './FirstRunGate';

// TU1 S2/S3/S4/S5 — the Tutor. The sliver, mirrored, on the paper's RIGHT
// edge — but rendered as TWO separate DeskFrame overlay anchors, not one
// (see index.css's own `.desk-frame-tutor-anchor`/`.desk-frame-tutor-panel-
// anchor` header comment for the full "why one anchor can't serve both
// jobs" writeup — the short version: the grip needs the FX2 clamp's small
// safe box, the ~300px open panel needs to be pinned to the STAGE's own
// right edge instead, or it silently clips against `.desk-frame-host`'s
// own overflow:hidden at ordinary widths, empirically confirmed before
// this shape was chosen). DeskFrame.tsx renders this component's whole
// return value BARE (no wrapping div) precisely so both anchors land as
// direct children of `.desk-frame-stage` — an intervening wrapper would
// break their `position:absolute` percentage math.
//
// A12 — the two-sides law: this is the ONE surface in the whole app the
// writer goes to when they DON'T know what they need. A13 is enforced
// architecturally, not just by prompt: this component receives only
// `entry`/`project`/`pageText`/`selectionText` — never an editor ref, never a
// page-text setter, never anything that could route a byte of Tutor output onto
// a writing surface. ITEM 84's TD4 added the fourth of those and changed nothing
// about the wall: `selectionText` is a STRING the host computed (see
// useSurfaceSelection.ts), read-only here exactly as `pageText` has always been.
// The Draft roster's own presses write to `composerText` — this panel's own
// input — and to nothing else. Every control below is inert with respect to the page:
// the grip/dock buttons toggle local UI state; the fragment items call
// `navigate()` (travel, not text insertion); the composer's own input
// talks ONLY to appendTutorMessage/apiTutorChat. No control in this file
// ever touches `editorRef`, `setText`, or any DOM node outside the
// `.wz-tutor-zone`-marked subtree — the ticket's own defense-in-depth A13
// harness walk (tu1.mjs) asserts this structurally, not by enumerating
// "these N buttons are fine."
//
// A14 — the room never knocks. Its PRINCIPLE stands as ratified law; FX12 S1 retired
// its current IMPLEMENTATION (the "Waiting for you" nudges), not the principle: the
// nudges section and its engine now sleep entire (no computation, no injection). What
// remains true and is even easier to see now: nothing in this file renders a
// badge/toast/count/dot on the grip, and the grip's own markup is unchanged — there is
// no knock anywhere. A later Tutor-panel ticket may return the letters under content
// law (the return gate on ledger item 64).
const DOCK_FLOOR_PX = 120;
// FX18 S2 (Fable's ruling, 2026-07-29) — the usable-panel floor: the smallest margin at
// which an OPEN panel can occupy the writing-surface margin without becoming a useless
// sliver. Below it the panel overlays the paper at natural open-w instead — the documented
// narrow-screen degradation (the measure-effect below sets the panel's inline width to
// natural open-w there). Distinct from DOCK_FLOOR_PX above: that gates whether the DOCK
// affordance is offered; this gates whether an open panel occupies the margin or overlays.
const USABLE_PANEL_FLOOR_PX = 280;

// TU2 S2 — the listener's delta assembly. No real tokenizer is available
// client-side, so the cap is a disclosed, documented character-based
// approximation: ~4 characters per token, the commonly-cited ballpark for
// English prose (both Anthropic's and OpenAI's own docs use figures in
// this neighborhood). 4000 tokens * 4 chars/token = 16000 chars is the
// hard ceiling on the WRITING itself; the honesty header line below rides
// on top of that, inside tutor.ts's own separate, more generous
// MAX_DELTA_CHARS wire cap (see that file's comment for the arithmetic).
const DELTA_TOKEN_CAP = 4000;
const CHARS_PER_TOKEN_APPROX = 4;
const DELTA_CHAR_CAP = DELTA_TOKEN_CAP * CHARS_PER_TOKEN_APPROX;

// ITEM 84, TD4 — the selected stretch's own cap, mirroring the delta's two-tier
// shape (client cap here, server backstop in tutor.ts). HEAD-BIASED, and that is
// the one place it deliberately differs from the delta: the delta keeps its TAIL
// because the newest writing is its whole point, while a selection's point is the
// stretch the writer started pointing at, so an over-long one keeps its OPENING.
// The header below is plain data read by the MODEL and is deliberately not a
// deskLexicon entry — its writer-facing twin is `tutorSelectionTruncated` — the
// same distinction DELTA_TRUNCATION_HEADER above already draws.
const SELECTION_CHAR_CAP = DELTA_CHAR_CAP;
const SELECTION_TRUNCATION_HEADER = 'opening of the selected stretch only; the rest was too long to travel';

// TU2 S5 — the session meter's own timing. Split into a fully-opaque hold
// plus a separate fade-out span (rather than one flat 4000ms) so the
// reduced-motion branch below has something concrete to SKIP: under
// ordinary motion the line holds, then visibly fades over METER_FADE_MS;
// under reduced motion it holds at full opacity for the exact same total
// window and is then simply removed — a REAL scheduled removal each time,
// never a CSS transition alone (which `prefers-reduced-motion` would just
// suppress, leaving the line stuck on-screen forever under that setting —
// the brief's own explicit "actually schedule/remove it" instruction).
const METER_VISIBLE_MS = 3600;
const METER_FADE_MS = 400;
const METER_TOTAL_MS = METER_VISIBLE_MS + METER_FADE_MS; // ~4s, the brief's own figure

// Plain data read by the MODEL as part of the delta block's own header —
// deliberately NOT a deskLexicon entry (deskLexicon is for writer-facing
// chrome; the writer never sees this exact string — see
// `tutorDeltaTruncated` in deskLexicon.ts for this same honesty's
// writer-facing twin, rendered in the panel instead).
const DELTA_TRUNCATION_HEADER = 'latest stretch only; earlier additions unread';

interface TutorDelta {
  delta: string | null;
  truncated: boolean;
}

// Writer-initiated, send-time only (never a timer, never on mount) — the
// ONE call site below (send()) is the only place this ever runs, per the
// brief's own invariant that the delta is assembled at send time, never
// before. `lastRead` absent covers BOTH grandfather cases the brief names
// as one: no thread yet (this page's very first-ever Tutor message) and a
// thread that predates TU2 (no cursor was ever persisted onto it) — both
// read the WHOLE page from the start, cap still applies, same code path
// either way. No new writing since the cursor (`newText` empty) returns
// `delta: null` — the caller sends no delta field at all and renders no
// "nothing new" UI, true silence per the brief's own words.
function assembleTutorDelta(pageText: string, lastRead: { at: string; chars: number } | undefined): TutorDelta {
  const newText = lastRead ? pageText.slice(lastRead.chars) : pageText;
  if (newText.length === 0) return { delta: null, truncated: false };
  const truncated = newText.length > DELTA_CHAR_CAP;
  const kept = truncated ? newText.slice(newText.length - DELTA_CHAR_CAP) : newText; // tail bias: keep the most recent writing
  const delta = truncated ? `[${DELTA_TRUNCATION_HEADER}]\n${kept}` : kept;
  return { delta, truncated };
}

// ITEM 84, TD4 — the stretch, capped. Pure and synchronous, called once at PRESS
// time and never again: what travels is frozen the moment the writer pressed the
// button that names it, which is also why this takes the stretch as an argument
// rather than reading any live selection of its own.
function capSelection(stretch: string): { text: string; truncated: boolean } {
  if (stretch.length <= SELECTION_CHAR_CAP) return { text: stretch, truncated: false };
  return { text: `[${SELECTION_TRUNCATION_HEADER}]\n${stretch.slice(0, SELECTION_CHAR_CAP)}`, truncated: true };
}

// TU5 S4 — the book's Bible's own send-time assembly, mirroring the delta's
// two-tier cap. The writer's saved facts (of THIS page's project) are joined
// into ONE block — a fact is a line — assembled ONLY here, at send time, never
// ambiently. Returns null (a true absent key, never an empty string) when the
// project has no facts. Client cap 8000 chars of CONTENT (server backstop 9000,
// tutor.ts's MAX_BIBLE_CHARS), with an honest truncation header line prepended
// when some facts don't fit; whole facts only — never a fact sliced mid-line
// (except the pathological case of a single fact somehow over the cap, which
// the 300-char per-fact store cap makes unreachable in practice).
const BIBLE_CHAR_CAP = 8000;
const BIBLE_TRUNCATION_HEADER = 'partial: some saved facts were not included this time';

function assembleBible(facts: Fact[]): string | null {
  if (facts.length === 0) return null;
  let body = '';
  let truncated = false;
  for (const f of facts) {
    const next = body ? `${body}\n${f.text}` : f.text;
    if (next.length > BIBLE_CHAR_CAP) { truncated = true; break; }
    body = next;
  }
  if (!body) { body = facts[0].text.slice(0, BIBLE_CHAR_CAP); truncated = true; }
  return truncated ? `[${BIBLE_TRUNCATION_HEADER}]\n${body}` : body;
}

// The margin genuinely available past the paper's right edge — the exact
// mirror of Cascade.tsx's own `availableCascadeMargin()` (see that file's
// header comment for the full "why measured geometry, not getComputedStyle
// on the calc() custom property" reasoning; it applies unchanged here,
// just flipped to the paper's RIGHT edge vs. the stage's right edge).
// TU2 S4 — `.board-canvas-wrap` joins the selector: Board's own framed
// wrapper (BoardEditor.tsx) carries neither `.mode-pagecol` (prose/script's
// own canonical-width class) nor `.entry-full` — without this, the query
// below matched NOTHING on a board-mounted panel, `paper` stayed null, and
// the function's own `if (!stage || !paper) return Infinity` early-out fired
// on every call, silently reporting "unlimited margin" regardless of the
// board canvas's true on-screen width. That would have made the dock
// affordance's own floor gate (DOCK_FLOOR_PX, Tutor.tsx's own call site)
// vacuously always-true on Board — a real correctness gap the geometry
// retrofit's own "Presence on Boards" clause would otherwise leave open.
function availableTutorMargin(): number {
  if (typeof document === 'undefined') return Infinity;
  const stage = document.querySelector('.desk-frame-stage');
  const paper = document.querySelector('.mode-pagecol, .entry-full, .board-canvas-wrap');
  if (!stage || !paper) return Infinity;
  const stageRect = stage.getBoundingClientRect();
  const paperRect = paper.getBoundingClientRect();
  const frameGapRaw = getComputedStyle(document.documentElement).getPropertyValue('--frame-gap').trim();
  const frameGap = parseFloat(frameGapRaw);
  const gap = Number.isFinite(frameGap) ? frameGap : 0;
  return (stageRect.right - paperRect.right) + gap;
}

export interface TutorProps {
  entry: JournalEntry;
  project: Project | null;
  // The host's own live text state — mirrors Sliver's `goalText` prop
  // exactly (the page's current raw text, computed fresh every render;
  // cheap). Used by the Consistency lens's own scope, and — as of TU2 S2 —
  // also read by `assembleTutorDelta` at send time ONLY, never on mount,
  // never on a timer: this is the one narrow, disclosed exception to TU1's
  // "only what the writer types into the composer ever leaves the device"
  // (see the v2 disclosure wording, S3). Still never touched by anything
  // that could WRITE through this prop — it is read-only here, always.
  pageText: string;
  // Selects the `--prose`/`--screenplay`/`--board` anchor modifier — mirrors
  // how DeskFrame.tsx itself applies `pageKind` to the sliver/goalGlow
  // anchors; threaded through here instead since this component now owns its
  // own anchor markup directly (see this file's own header comment). TU2 S4
  // — `'board'` joins the union: BoardEditor.tsx now mounts this component
  // (the two-anchor formulas below already reference `--tutor-paper-half`/
  // `--tutor-panel-paper-half` as plain custom properties, so a `--board`
  // modifier class overriding just those two — same technique
  // `.desk-frame-sliver-anchor--board` already established — is the whole
  // fix; no new geometry code, only a wider union and two CSS overrides).
  pageKind: 'prose' | 'screenplay' | 'board';
  // ITEM 84, THE DECK PHASE — THE MODE SEAM. The census's headline finding
  // was that this panel is MODE-BLIND: until this prop, not one branch in
  // this file read the writing mode, and the panel rendered identically in
  // Free Write, Draft and Revise. This is the first mode-aware layer the
  // Tutor has ever carried — new law, not renovated law.
  //
  // OPTIONAL on purpose, and absent means "no mode": BoardEditor mounts this
  // component from a surface that has no ModeStrip and no EditorMode at all,
  // so it passes nothing rather than being made to invent a mode it doesn't
  // have. The Free Write roster mounts on `'journal'` and NOWHERE else —
  // Draft ('drafting'), screenplay (Draft-only by its own law) and Board all
  // render exactly the panel they rendered before this ticket.
  mode?: EditorMode;
  // ITEM 84, TD4 — THE SELECTION, and it is a STRING. The build brief's §5 draws
  // this line and the component keeps to it exactly: "a read-only selection value
  // may reach the component as a prop; a reference to the editor may not." The
  // host owns the surface and computes this (useSurfaceSelection.ts); the panel
  // only ever reads it, exactly as it only ever reads `pageText`.
  //
  // OPTIONAL, and absent means "no stretch": Board and Free Write pass nothing,
  // because neither mounts the Draft roster. Absent leaves TD4's chip
  // disabled-visible, which is its lawful resting state.
  selectionText?: string;
}

// ITEM 84, THE DECK PHASE — the roster's three presets, in Nick's own ruled
// order. `id` keys the local deck; `term` keys the string of record.
const FREE_WRITE_PRESETS: { id: FreeWritePresetId; term: 'tutorFreeWritePrompt' | 'tutorFreeWriteUnblock' | 'tutorFreeWriteTips' }[] = [
  { id: 'writingPrompt', term: 'tutorFreeWritePrompt' },
  { id: 'unblock', term: 'tutorFreeWriteUnblock' },
  { id: 'tips', term: 'tutorFreeWriteTips' },
];

const NO_DRAWS: Record<FreeWritePresetId, number> = { writingPrompt: 0, unblock: 0, tips: 0 };

// ITEM 84, THE DRAFT ROSTER — the four asks in the lock record's own order, and
// FIXED in it: no reshuffling between visits, because re-scanning is the tax the
// cognition bench named. `term` keys the string of record (deskLexicon, which
// carries the provenance note); `sendsSelection` marks TD4, the one chip that
// adds a payload. It is a per-ask boolean rather than an id comparison on
// purpose: the button law is per-press, so each button declares its own wire
// right here beside the words that name it, and any chip added later has to
// answer the question rather than inherit an answer.
type DraftAskId = 'drag' | 'loadBearing' | 'threadSlip' | 'stretch';
const DRAFT_ASKS: {
  id: DraftAskId;
  term: 'tutorDraftAskDrag' | 'tutorDraftAskLoadBearing' | 'tutorDraftAskThreadSlip' | 'tutorDraftAskStretch';
  sendsSelection: boolean;
}[] = [
  { id: 'drag', term: 'tutorDraftAskDrag', sendsSelection: false },
  { id: 'loadBearing', term: 'tutorDraftAskLoadBearing', sendsSelection: false },
  { id: 'threadSlip', term: 'tutorDraftAskThreadSlip', sendsSelection: false },
  { id: 'stretch', term: 'tutorDraftAskStretch', sendsSelection: true },
];

interface DisplayMessage {
  id: string;
  role: 'writer' | 'tutor';
  text: string;
}

export function Tutor({ entry, project, pageText, pageKind, mode, selectionText }: TutorProps) {
  const { t } = useDeskLexicon();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [docked, setDocked] = useState(false);
  // FX18 S2 (Fable's ruling) — the OPEN panel's live width in px on a WRITING surface,
  // MEASURED (the FX13 measure-effect pattern), or null to defer to CSS. Occupy-margin uses
  // the TRUE geometric margin (stage.right - paper.right) so the panel sits FLUSH to the
  // paper's right edge — never dipping past its own grip into the paper (the CSS
  // --tutor-panel-margin calc adds --frame-gap and so overshot by 28px). Below the usable
  // floor it becomes natural open-w (overlay). null on Board (the --board CSS rule owns it)
  // and while docked (the docked CSS rule owns it).
  const [panelWidthPx, setPanelWidthPx] = useState(null);
  const [showDisclosure, setShowDisclosure] = useState(false);
  const [composerText, setComposerText] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<'idle' | 'offline' | 'error' | 'unborn'>('idle');
  // TU2 S2 — set per-send, alongside `status`; true only when THIS send's
  // delta had to be tail-capped. Not sticky across turns for the same
  // reason `status` isn't: it describes what just happened, not a
  // standing page property.
  const [deltaTruncated, setDeltaTruncated] = useState(false);
  // TU5 S3 — the book's Bible: writer-authored facts read off the project
  // record (reactive via the store's own subscribe seam). The gate is
  // `entry.projectId` — a loose/journal page has none, so the section below
  // never mounts (quiet absence, not a disabled door).
  const bibleFacts = useBibleFacts(entry.projectId);
  const [bibleInput, setBibleInput] = useState('');
  const [bibleEditingId, setBibleEditingId] = useState<string | null>(null);
  const [bibleEditText, setBibleEditText] = useState('');
  // TU2 S5 — the session meter's own display state: `null` when nothing has
  // rendered yet (no call has been made this mount) or once the removal
  // timer has fired; `fading` flips true only under ordinary motion, at
  // METER_VISIBLE_MS, to trigger the CSS opacity transition below — under
  // reduced motion it never flips, so the line holds at full opacity right
  // up until the same removal timer unmounts it outright (see
  // showMeterLine below).
  const [meterState, setMeterState] = useState<{ text: string; fading: boolean } | null>(null);
  const meterFadeTimeoutRef = useRef<number | null>(null);
  const meterRemoveTimeoutRef = useRef<number | null>(null);

  // ==========================================================================
  // ITEM 84, THE DECK PHASE — the Free Write roster's own state.
  // ==========================================================================
  // Free Write is mode key 'journal' (ModeStrip.tsx maps t('modeFreeWrite') to
  // exactly this value). Absent mode (Board) is not Free Write.
  const freeWrite = mode === 'journal';

  // THE STANDING DRAW — the whole of Nick's "only one is ever rendered at a
  // time", expressed as a mechanism rather than a rule anyone has to remember.
  // Exactly ONE drawn line can exist at once, for the WHOLE roster: a second
  // press REPLACES it, never stacks beside it. His reason is on the record and
  // belongs here: "We don't want a user spending time debating which prompt to
  // respond to — the goal in Free Write is to get writing without much
  // deliberation." A build that renders three at once satisfies the count and
  // defeats the purpose, so there is deliberately no array here to render.
  //
  // It is COMPONENT STATE, not a persisted message, for a reason store/
  // persistence.ts states in its own words: a Tutor thread "is born on its
  // first real message and not one keystroke sooner." A press sends nothing
  // and says nothing — it must not conjure a thread. The draw commits into the
  // real thread only when the writer engages (send(), below), immediately
  // ahead of their own message, so the model sees the spur it is answering and
  // the conversation continues in this same window. An unanswered spur
  // persists nothing, which is the honest outcome: it was a spur toward the
  // page, and the page is where it was answered.
  const [draw, setDraw] = useState<{ preset: FreeWritePresetId; text: string } | null>(null);
  // The anti-deliberation ceiling: three draws behind one ask, then that ask is
  // spent. Per preset, not per roster — "up to 3 prompts may exist behind an
  // ask" is a property of the ask.
  const [drawCounts, setDrawCounts] = useState<Record<FreeWritePresetId, number>>(NO_DRAWS);
  // FX15/idleNudges' no-near-repeat ring, one per preset — per MOUNT, like the
  // nudge engine's own recentRef (a deck that repeats itself within a sitting
  // reads as broken; across sittings nobody notices, and a persisted draw
  // history would be a store this feature has no business creating).
  const recentDrawsRef = useRef<Record<FreeWritePresetId, string[]>>({ writingPrompt: [], unblock: [], tips: [] });
  // THE REFILL ANCHOR — the page's word count at the moment each ask was SPENT
  // (its third draw), or null while that ask still has draws left. Nick's
  // hundred words are counted from here. A ref, not state, because it must not
  // itself cause a render: it is written in the press handler and read by the
  // effect that watches the count.
  const spentAnchorRef = useRef<Record<FreeWritePresetId, number | null>>({ writingPrompt: null, unblock: null, tips: null });
  // The note a spent ask answers a fourth press with — which preset was pressed,
  // or null. Nick's own words: "a note to the user if they try to use it a
  // fourth time before writing 100 words."
  const [refillNote, setRefillNote] = useState<FreeWritePresetId | null>(null);
  // HB1's own monotone reading of the page's words (F1's whitespace-delimited
  // instrument, at F1's own 100-word threshold). `active: true` — this count has
  // no gate to end; each ask's anchor is what turns the running max into a
  // delta. Never gated on `freeWrite`: a hook cannot be called conditionally,
  // and the cost is one word-count per page edit.
  const pageWords = useMonotonicWordCount(pageText, true);
  // (A) of the roster — "blank space with a flashing cursor where anything can
  // be asked." The composer already renders blank; what it never did was take
  // focus, so there was no cursor until the writer clicked. See the focus
  // effect below.
  const composerRef = useRef<HTMLInputElement | null>(null);

  // ==========================================================================
  // ITEM 84, THE DRAFT ROSTER — the Draft asks' own state.
  // ==========================================================================
  // Draft is mode key 'drafting' (ModeStrip.tsx maps t('modeDraft') to exactly
  // this value). The two rosters are SIBLINGS on one branch and can never
  // co-render: Free Write is not Draft, and an absent mode (Board) is neither.
  // Revise cannot reach here at all — `EditorMode` has no 'revise' member
  // (ForwardOnlyEditor.tsx) and the Revise tab is `live: false` (ModeStrip.tsx),
  // so the brief's "cannot render in Revise" holds by the TYPE, not by a branch.
  const drafting = mode === 'drafting';

  // THE ARMED SELECTION — the whole of the disclosure's "only then", expressed as
  // a mechanism rather than a rule anyone has to remember. It is FROZEN AT THE
  // PRESS, and it has to be: pressing a button collapses the page's own DOM
  // selection, so a send-time read would send nothing at all, or something else
  // the writer never pointed at. Null on every other path, so the wire key is
  // simply absent and asks 1-3 travel byte-identically to how they travelled
  // before this ticket existed.
  const [armedSelection, setArmedSelection] = useState<string | null>(null);
  // Set at the press that armed an over-long stretch, cleared by any press that
  // arms nothing — it describes what is standing ready to travel, so unlike
  // `deltaTruncated` (which describes what just happened) it is set BEFORE the
  // send rather than during it.
  const [selectionTruncated, setSelectionTruncated] = useState(false);
  const stretch = (selectionText ?? '').trim();
  const hasStretch = stretch.length > 0;

  // Staging must arrive VISIBLY EDITABLE — "cursor in the text, never styled as
  // final" — so the press places a real caret at the end of the staged string.
  // A TICK rather than a watch on `composerText`: pressing the same chip twice
  // stages an identical string, React bails on the identical value, and an effect
  // keyed on the text would silently skip placing the caret exactly then. The
  // effect runs after the DOM already carries the new value, so no timer is
  // needed and none is used (an animation frame here would be a race).
  const [stageTick, setStageTick] = useState(0);
  useEffect(() => {
    if (stageTick === 0) return; // nothing has been staged this mount
    const el = composerRef.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    const end = el.value.length;
    el.setSelectionRange(end, end);
  }, [stageTick]);

  // The vanishing law with the dock rider (A15), inherited whole via the
  // SAME mechanism Cascade.tsx already established (an explicit keydown
  // reset, not the ambient chrome-fade class — the ambient system has no
  // per-instance "survives while docked" concept, and the Tutor needs one,
  // same as the cascade's own reach panel/survey). Typing inside the
  // Tutor's OWN chrome (the composer, the disclosure) never counts as "the
  // writer resumed writing" — guarded by the `.wz-tutor-zone` closest()
  // check (the marker class both of this file's own anchors carry), the
  // exact precedent Cascade.tsx's own listener already uses.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (showDisclosure) return; // the disclosure has no Escape-dismiss, by design (hb1.1's own UnlockCeremony precedent)
      const target = e.target as HTMLElement | null;
      if (target?.closest?.('.wz-tutor-zone')) return;
      if (e.key === 'Escape') { setOpen(false); setDocked(false); return; }
      if (docked) return; // a docked panel survives keystrokes
      setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, docked, showDisclosure]);

  // FX18 S2 (Fable's ruling) — the writing-surface panel width, MEASURED not approximated (the
  // FX13 measure-effect pattern Fable named; the same geometry availableTutorMargin() reads,
  // minus the +frame-gap the dock heuristic adds — here we want the TRUE margin so the panel
  // sits flush to the paper). While open+undocked on a writing surface, on every mount/resize:
  // occupy the margin at min(geoMargin, open-w) when a usable panel fits (geoMargin >=
  // USABLE_PANEL_FLOOR_PX), else overlay at natural open-w (the documented narrow-screen
  // degradation). null on Board (the --board CSS rule sets open-w) and while docked (the docked
  // CSS rule owns the width). The paper rect is stable open<->closed (the panel is absolutely
  // positioned, never pushes it — fx10's "paper rect byte-identical" invariant), so one read on
  // open + a resize listener suffices.
  useEffect(() => {
    if (!open || docked || pageKind === 'board') { setPanelWidthPx(null); return; }
    const measure = () => {
      const stage = document.querySelector('.desk-frame-stage');
      const paper = document.querySelector('.mode-pagecol, .entry-full, .board-canvas-wrap');
      if (!stage || !paper) { setPanelWidthPx(null); return; }
      const openW = Math.max(320, Math.min(0.34 * window.innerWidth, 460)); // --tutor-panel-open-w
      const geoMargin = stage.getBoundingClientRect().right - paper.getBoundingClientRect().right;
      setPanelWidthPx(Math.round(geoMargin >= USABLE_PANEL_FLOOR_PX ? Math.min(geoMargin, openW) : openW));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [open, docked, pageKind]);

  const openDisclosureIfNeeded = () => {
    if (!getTutorDisclosureSeen()) setShowDisclosure(true);
  };

  const handleGripClick = () => {
    if (docked) { setDocked(false); return; } // reopening the grip while docked restores the panel (Cascade's own T5 rider, mirrored)
    setOpen((o) => {
      const next = !o;
      if (next) openDisclosureIfNeeded();
      return next;
    });
  };

  const handleDockButton = () => {
    if (docked) { setDocked(false); setOpen(false); return; } // the docked panel's own explicit close
    if (availableTutorMargin() >= DOCK_FLOOR_PX) { setDocked(true); return; }
    setOpen(false); // the dock affordance is unavailable below the floor — a plain close instead
  };

  const acknowledgeDisclosure = () => {
    setTutorDisclosureSeen(true);
    setShowDisclosure(false);
  };

  // TU5 S3 — the writer's own Bible edits. These handlers ONLY ever call the
  // writer-authored store functions (addFact/editFact/deleteFact) — never
  // anything that could place a byte on a page. A13 holds structurally: no
  // editorRef, no setText, nothing outside the store; the Tutor never calls
  // any of these — they fire only on the writer's own click/Enter.
  const addBibleFact = () => {
    if (!entry.projectId) return;
    const text = bibleInput.trim();
    if (!text) return;
    addFact(entry.projectId, text);
    setBibleInput('');
  };
  const startBibleEdit = (f: Fact) => { setBibleEditingId(f.id); setBibleEditText(f.text); };
  const cancelBibleEdit = () => { setBibleEditingId(null); setBibleEditText(''); };
  const commitBibleEdit = (id: string) => {
    if (!entry.projectId) return;
    const text = bibleEditText.trim();
    if (text) editFact(entry.projectId, id, text);
    setBibleEditingId(null);
    setBibleEditText('');
  };
  const removeBibleFact = (id: string) => {
    if (!entry.projectId) return;
    deleteFact(entry.projectId, id);
    if (bibleEditingId === id) cancelBibleEdit();
  };

  // --- S3/S4 — lenses + nudges, DERIVED, computed only while the panel is
  // actually visible (never on every keystroke while closed — the parent
  // host re-renders this component on every keystroke via its own `text`
  // state, so gating the heavier computations here is what keeps an idle
  // Tutor cheap). Nothing here is ever written back to storage.
  const panelVisible = open;
  // TU2 S4 — "Lenses on a Board should scope to the board's members where
  // meaningful" (the brief's own words). Of the three lenses, only
  // Consistency takes a multi-page SCOPE at all (Structure/Fragments each
  // compute facts about `entry` itself, or scan every entry app-wide by
  // recency/tag — neither reads a project's binder, so neither has a
  // "binder vs. board" distinction to make). The reasonable reading,
  // disclosed: a Board's own binder-wide scope (every OTHER page in the
  // same project) is the wrong default here — a board is a curated
  // grouping, and a name repeated across its own pinned members is exactly
  // the kind of thing Consistency exists to catch, while pulling in the
  // whole project binder would dilute that with pages the board's own
  // membership deliberately excludes. `page-pin` boxes (Box.entryId) ARE
  // the board's membership roster (AB4 S2's own definition); read those
  // entries' texts live (never cached/stored) instead of the binder when
  // `pageKind === 'board'`. A pin to a since-deleted entry (`getJournalEntry`
  // returning undefined) is filtered out rather than crashing — the same
  // tolerance BoardPinBox itself already extends to a missing referent.
  const consistencyScope = panelVisible
    ? (pageKind === 'board'
        ? [pageText, ...(entry.boxes ?? [])
            .filter((b) => b.kind === 'page-pin' && b.entryId)
            .map((b) => getJournalEntry(b.entryId!)?.text)
            .filter((t): t is string => t != null)]
        : entry.projectId
          ? [pageText, ...getBinderPages(entry.projectId).filter((p) => p.id !== entry.id).map((p) => p.text)]
          : [pageText])
    : [];
  const consistencyObservations = panelVisible ? computeConsistencyObservations(consistencyScope) : [];
  const structure = panelVisible ? computeStructureFacts(entry, project) : null;
  const fragments = panelVisible ? computeFragmentItems(entry) : [];
  // FX12 S1 — the nudge-generation engine sleeps entire: computeNudges is no longer
  // called here (its only call site), so no computation and no injection happen. The
  // engine (store/tutorNudges.ts) and its data are left dormant, untouched.

  // --- S5 — the conversation. Read fresh off the record every render (the
  // App.tsx force-render-on-any-write subscription already covers this —
  // appendTutorMessage's own saveJournalEntry call is what triggers it).
  const liveEntry = panelVisible ? getJournalEntry(entry.id) : null;
  const messages: DisplayMessage[] = (liveEntry?.tutor?.messages ?? entry.tutor?.messages ?? []).map((m) => ({ id: m.id, role: m.role, text: m.text }));

  // TU2 S5 — shows one meter line, replacing whatever line (if any) is
  // still showing, and restarts its own fade/removal clock from zero. Both
  // timeouts are re-armed from scratch on every call (the stale ones are
  // cleared first) so a second reply arriving mid-fade doesn't race its own
  // removal against the new line's — only ever one pair of timers live at
  // once, matching this component's own single-flight `sending` gate.
  const showMeterLine = (text: string) => {
    if (meterFadeTimeoutRef.current !== null) window.clearTimeout(meterFadeTimeoutRef.current);
    if (meterRemoveTimeoutRef.current !== null) window.clearTimeout(meterRemoveTimeoutRef.current);
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    setMeterState({ text, fading: false });
    if (!reduce) {
      meterFadeTimeoutRef.current = window.setTimeout(() => {
        setMeterState((s) => (s ? { ...s, fading: true } : s));
      }, METER_VISIBLE_MS);
    }
    // Unconditional: fires whether or not the fade timeout above was even
    // armed, which is exactly the "actually schedule/remove it" behavior
    // reduced-motion still needs — see METER_VISIBLE_MS's own comment.
    meterRemoveTimeoutRef.current = window.setTimeout(() => setMeterState(null), METER_TOTAL_MS);
  };

  // Both timers are per-MOUNT, not per-render — cleared on unmount only
  // (an empty dependency array), the same reason `showMeterLine` clears its
  // own stale pair on every call rather than relying on a per-effect
  // cleanup: this component can navigate away (a real route change unmounts
  // it, per this file's own header comment on why the session total lives
  // in tutorMeter.ts's module scope, not here) mid-fade, and a bare
  // `setTimeout` with no cleanup would otherwise fire `setState` on an
  // already-unmounted instance.
  useEffect(() => () => {
    if (meterFadeTimeoutRef.current !== null) window.clearTimeout(meterFadeTimeoutRef.current);
    if (meterRemoveTimeoutRef.current !== null) window.clearTimeout(meterRemoveTimeoutRef.current);
  }, []);

  // ITEM 84, THE DECK PHASE — (A) of the roster: the composer takes focus when
  // the panel opens in Free Write, so the roster's first member is genuinely
  // "blank space with a flashing cursor where anything can be asked" and not
  // just an input the writer must go find. Free Write only: this is the mode
  // whose whole posture is "start writing," and it is the mode whose roster
  // Nick redesigned around the cursor. `preventScroll` because the panel is its
  // own scroll column (FX10 S1) and a focus must never jump it. Held off while
  // the disclosure is up — that modal owns the room until it is acknowledged.
  useEffect(() => {
    if (!open || !freeWrite || showDisclosure) return;
    composerRef.current?.focus({ preventScroll: true });
  }, [open, freeWrite, showDisclosure]);

  // ITEM 84, THE DECK PHASE — THE REFILL, on Nick's own ruling (verbatim):
  // "It should reset after 100 words have been written with a note to the user
  // if they try to use it a fourth time before writing 100 words."
  //
  // WHAT THE COUNT IS ANCHORED TO: words written on THIS page since the THIRD
  // draw — the moment the ask was spent — not since each draw and not since the
  // panel opened. So the anchor is stamped exactly once per ask, when its third
  // draw lands (see pressPreset below), and cleared when the hundred arrives.
  //
  // THE INSTRUMENT IS HB1's, NOT A NEW ONE. `useMonotonicWordCount` is the
  // app's own ratified reading of "a hundred words" (F1's whitespace-delimited
  // instrument, at F1's own threshold of 100), and it is monotone for a reason
  // this feature needs just as much as the first-run gate did: under forward
  // lock the derived text can transiently SHRINK while a trailing run is struck
  // (FirstRunGate.tsx's own F1 note), and a raw count would make the writer
  // watch progress go backwards. `active` is passed `true` here because this
  // count has no gate to end — the running max IS the reading, and each ask's
  // own anchor is what makes it a delta. See the S0 addendum for the one caveat
  // carried openly: that file's header calls itself non-reusable, written when
  // it had a single caller.
  //
  // The standing draw deliberately SURVIVES a refill: the writer is writing
  // FROM it, and the panel dissolves on that same keystroke anyway (A15), so
  // clearing it would delete the spur at the moment it started working. Only
  // the ceiling resets — and the note, having been answered.
  useEffect(() => {
    const refilled: FreeWritePresetId[] = [];
    for (const p of FREE_WRITE_PRESETS) {
      const anchor = spentAnchorRef.current[p.id];
      if (anchor !== null && pageWords - anchor >= REFILL_WORDS) {
        spentAnchorRef.current[p.id] = null;
        refilled.push(p.id);
      }
    }
    if (refilled.length === 0) return;
    setDrawCounts((c) => {
      const next = { ...c };
      for (const id of refilled) next[id] = 0;
      return next;
    });
    setRefillNote((n) => (n !== null && refilled.includes(n) ? null : n));
  }, [pageWords]);

  // ITEM 84, THE DECK PHASE — THE PRESS. The whole of the deck law lives in
  // these few lines, and what matters most is what is NOT here: no fetch, no
  // await, no apiTutorChat, nothing asynchronous at all. The draw is a
  // synchronous read of a frozen local array, so "this press sent nothing" is a
  // structural fact rather than a promise — a model-composed line could not be
  // a member of the pool the harness checks against.
  //
  // THE BUTTON LAW (lock record §10): "a counsel's button names what its own
  // press sends." This press sends NOTHING, which is why this phase needs no
  // disclosure gate and no carve-out sentence — and why the harness asserts
  // zero network calls on press. That assertion IS this phase's disclosure
  // obligation, discharged by proof rather than by prose.
  const pressPreset = (id: FreeWritePresetId) => {
    if (!freeWrite) return;
    const used = drawCounts[id];
    // THE FOURTH PRESS ANSWERS. Nick's ruling asks for "a note to the user if
    // they try to use it a fourth time before writing 100 words" — so a spent
    // ask is not a dead control; it is one that says why. This is why the
    // button below is never `disabled`: a disabled control cannot speak, and
    // silence here would read as breakage rather than as a rule.
    if (used >= DRAW_CEILING) { setRefillNote(id); return; }
    const pool = FREE_WRITE_POOLS[id];
    const recent = recentDrawsRef.current[id];
    const text = drawFrom(pool, recent);
    recent.push(text);
    if (recent.length > recentMemoryFor(pool)) recent.shift();
    // The anchor is stamped on the THIRD draw only — the hundred words are
    // counted from the moment the ask was spent, not from each draw.
    if (used + 1 >= DRAW_CEILING) spentAnchorRef.current[id] = pageWords;
    setDraw({ preset: id, text });          // REPLACES — never appends
    setDrawCounts((c) => ({ ...c, [id]: c[id] + 1 }));
    setRefillNote(null);                    // a real draw answers any standing note
  };

  // ITEM 84, THE DRAFT ROSTER — THE PRESS. Staging, not sending: the ask lands in
  // the composer as ordinary editable text and NOTHING goes on the wire. As with
  // the deck phase's own press, what matters most is what is NOT here — no fetch,
  // no await, nothing asynchronous at all — so "this press sent nothing" is a
  // structural fact rather than a promise. The writer edits if they wish and
  // presses Send, which is the existing, unchanged send path. No auto-send exists
  // anywhere in this feature, ask 4 included.
  //
  // THE BUTTON LAW (lock record §10): "a counsel's button names what its own press
  // sends", and consent is PER-PRESS. That is why the else-branch below clears the
  // arm rather than leaving it: ask 1's button names no selection, so ask 1's press
  // must not inherit ask 4's payload. One chip cannot consent for another's wire,
  // and here that is a line of code rather than a paragraph of intent.
  const pressAsk = (ask: typeof DRAFT_ASKS[number]) => {
    if (!drafting) return;
    const text = t(ask.term);
    if (ask.sendsSelection) {
      // The chip is `disabled` without a stretch; this is the belt to that brace.
      if (!hasStretch) return;
      const capped = capSelection(stretch);
      setArmedSelection(capped.text);       // FROZEN — see the state's own note
      setSelectionTruncated(capped.truncated);
    } else {
      setArmedSelection(null);
      setSelectionTruncated(false);
    }
    setComposerText(text);                  // REPLACES — the composer stages one ask
    setStageTick((n) => n + 1);
  };

  const send = async () => {
    const text = composerText.trim();
    if (!text || sending) return;
    // E4 — THE UNBORN SURFACE REFUSES OUT LOUD, AND KEEPS THE WRITER'S WORDS.
    // Measured on the shipped build, on an unborn BOARD (which has mounted this
    // panel unconditionally all along): sending here wrote a REAL ROW —
    // `{pageType:'board', text:'', boxes:0, tutorMsgs:1}`. `getJournalEntry`
    // falls through to the unborn slot (persistence.ts:1667-1673), so
    // `appendTutorMessage` finds a record, and `saveJournalEntry` upserts it.
    // The surface was BORN BY A CHAT MESSAGE, with nothing written on it —
    // which is precisely what PB1 exists to prevent ("the row is written by the
    // first word"). E4 un-gates this panel on unborn PAGES too, so this had to
    // close first or the ticket would have spread the fault from boards to
    // pages.
    //
    // Refusing is the lawful branch of Fable's ruling ("must either work or
    // visibly refuse; silence is the defect"): PB1 is a standing law and a fix
    // lane does not overturn one to make a send succeed. The composer is NOT
    // cleared — the writer's sentence survives the refusal and sends itself the
    // moment there is a page to attach it to.
    if (isUnborn(entry.id)) { setStatus('unborn'); return; }
    setComposerText('');
    setStatus('idle');
    setDeltaTruncated(false);
    // ITEM 84, TD4 — THE ARMED SELECTION IS CONSUMED HERE, and cleared in the same
    // breath it is read. "Only then" means one press, one send: a second send
    // cannot re-carry a stretch the writer pressed for once, and a failed send
    // does not leave the wire armed behind it. Read into a local first for the
    // same reason `composerText` is — the state clear below must not race the
    // request that is about to be assembled from it.
    const selection = armedSelection;
    setArmedSelection(null);
    // TU2 S2 — read the cursor BEFORE this send's own appendTutorMessage
    // call below (which, via its lastRead-preserving spread, wouldn't
    // disturb it anyway — but reading it first keeps the delta's
    // provenance obviously tied to "what the Tutor had read as of the
    // moment the writer hit send," not an incidental side effect of
    // append ordering).
    const lastRead = getJournalEntry(entry.id)?.tutor?.lastRead;
    const { delta, truncated } = assembleTutorDelta(pageText, lastRead);
    if (truncated) setDeltaTruncated(true);
    // ITEM 84, THE DECK PHASE — THE STANDING DRAW COMMITS HERE, and only here.
    // Nick's requirement 3, verbatim: "Whether the user asks their own question
    // or selects a preset, the Tutor's response should be in the same
    // dialog/chat window where conversation can commence." The draw has been
    // rendering in that window all along; this is the moment it becomes part of
    // the thread, immediately AHEAD of the writer's own message, so the history
    // this send replays reads in the order it actually happened — the spur,
    // then the answer to it. Without this line the model would be answering a
    // reply to a prompt it never saw.
    //
    // Note what travels and what does not: the press itself put nothing on any
    // wire. The drawn line reaches the model here, on the writer's own Send, as
    // an ordinary turn of the conversation — the same way every Tutor turn
    // already travels in `messages` (TU2's wire law, unchanged; no new key, no
    // new payload class, nothing this ticket adds to the disclosure's
    // enumeration).
    //
    // A SEND DOES NOT REFILL THE DECK. Nick's refill ruling names exactly one
    // condition — a hundred words written — and conversation is not it. That is
    // the rule agreeing with its own reason: the goal in Free Write is to get
    // writing, and writing happens on the page, not in this composer. So the
    // draw commits here and the counts are left exactly as they stand.
    if (draw) {
      appendTutorMessage(entry.id, { id: generateId(), role: 'tutor', text: draw.text, at: new Date().toISOString() });
      setDraw(null);
    }
    const writerMsg = { id: generateId(), role: 'writer' as const, text, at: new Date().toISOString() };
    appendTutorMessage(entry.id, writerMsg);
    setSending(true);
    const history = [...(getJournalEntry(entry.id)?.tutor?.messages ?? [])].map((m) => ({ role: m.role, text: m.text }));
    // TU5 S4 — assemble the Bible at send time only (never ambiently): read the
    // project's saved facts fresh and join them; absent when there are none, so
    // JSON.stringify drops the key and the wire stays byte-free of any bible.
    const bible = entry.projectId ? assembleBible(getBibleFacts(entry.projectId)) : null;
    // ITEM 84, TD4 — `selection` is the ONE key this ticket adds, and it is absent
    // (never an empty string) unless the chip whose own words name it was the
    // press that staged this ask. `pageText` is not passed and never becomes a
    // key: it stays a render prop, per the lock record's own wire precision.
    const result = await apiTutorChat(history, delta ?? undefined, bible ?? undefined, selection ?? undefined);
    setSending(false);
    if (!result.ok) { setStatus('error'); return; }
    if (!result.configured) { setStatus('offline'); return; }
    if (result.reply) {
      appendTutorMessage(entry.id, { id: generateId(), role: 'tutor', text: result.reply, at: new Date().toISOString() });
      // Cursor advances to the page's current length ONLY here — a
      // successful reply received — never on the offline/error branches
      // above, and never pre-emptively before the call. `pageText` is
      // this render's own live prop, the same value `assembleTutorDelta`
      // just read from above.
      advanceTutorCursor(entry.id, pageText.length);
      // TU2 S5 — the session meter. `result.usage`/`result.model` are only
      // ever set on tutor.ts's own success branch (see api.ts's own
      // comment), so this is naturally absent on the offline/error paths
      // above — nothing to meter when no model call actually completed,
      // same reasoning as the cursor advance just above it.
      if (result.usage) {
        const { inputTokens, outputTokens } = result.usage;
        const totalTokens = inputTokens + outputTokens;
        const tokensStr = `${totalTokens.toLocaleString()} ${t('tutorMeterTokensUnit')}`;
        // `estimateTurnCostUSD` returns null for any model absent from the
        // cost table (store/tutorCostEstimates.ts) — deepseek-v4-pro,
        // anything TU6's later BYO-keys seam ever points this route at, or
        // simply an env override this build's table hasn't heard of. That
        // null is the brief's own "unknown provider" case: tokens only,
        // never an invented dollar figure.
        const turnCostUSD = result.model ? estimateTurnCostUSD(result.model, inputTokens, outputTokens) : null;
        const line = turnCostUSD === null
          ? `${t('tutorMeterTokensOnly')} ${tokensStr}`
          : `${t('tutorMeterTurnCost')} ${tokensStr}, ${formatEstimatedUSD(turnCostUSD)} · ${t('tutorMeterSessionTotal')} ${formatEstimatedUSD(addTutorSessionCost(turnCostUSD))}`;
        showMeterLine(line);
      }
    }
  };

  return (
    <>
      <div className={`desk-frame-tutor-anchor desk-frame-tutor-anchor--${pageKind} wz-tutor-zone`}>
        <button
          type="button"
          className="wz-tutor-grip"
          data-open={open ? 'true' : 'false'}
          data-docked={docked ? 'true' : 'false'}
          aria-expanded={open}
          aria-label={open ? t('tutorClose') : t('tutorOpen')}
          title={open ? t('tutorClose') : t('tutorOpen')}
          onClick={handleGripClick}
        >
          {/* FX18 S1 (SV25): the RIGHT drawer mirrors the left. Closed → '›' (points right/
              outward); open → '‹' (points left/inward, toward the panel that slides out).
              The mirror of Sliver.tsx's left grip; that literal is left untouched. */}
          <span className="wz-tutor-grip-glyph" aria-hidden="true">{open ? '‹' : '›'}</span>
        </button>
      </div>

      <div className={`desk-frame-tutor-panel-anchor desk-frame-tutor-panel-anchor--${pageKind} wz-tutor-zone`}>
        <div className="wz-tutor-panel" aria-hidden={!open} data-open={open ? 'true' : 'false'} data-docked={docked ? 'true' : 'false'} style={panelWidthPx != null ? { width: `${panelWidthPx}px`, maxWidth: `${panelWidthPx}px` } : undefined}>
          {/* E3 — THE COUNSEL FADES OUT, BECAUSE THERE IS NOW SOMETHING TO FADE.
              `{open && …}` used to wrap this body, so on close the CONTENT
              unmounted synchronously while the panel's own opacity transition
              ran on an EMPTY BOX. Measured, pre-fix: at the first frame after
              the close click the body was already gone (`content:false`) with
              panel opacity still `1.00`, which then faded 1.00 -> 0.13 over
              ~108ms. The writer sees the contents blink out and an empty
              rectangle dissolve — i.e. "it does not fade out" (E3, Nick
              2026-08-31).
              THE MIRROR WAS ALREADY EXACT EVERYWHERE ELSE. `.wz-sliver-panel`
              — the tool pop-out this panel is the mirror of — carries the
              identical transition (FX10 S1 copied it after reading it LIVE:
              `opacity var(--fade-dur,.2s) ease, transform var(--fade-dur,.2s)
              ease`), the identical `aria-hidden={!open}`, and the identical
              `pointer-events:none` when closed. The ONE difference was that
              Sliver.tsx renders `<SliverToolsBody />` UNCONDITIONALLY inside
              its faded panel. So this is that same shape, not a new one: no
              timing is copied here and no transition is added, because the
              fade this ticket wants has been declared on `.wz-tutor-panel` all
              along and simply had nothing inside it to carry.
              A11Y POSTURE IS INHERITED, NOT INVENTED: mounted-but-`aria-hidden`
              with `pointer-events:none` is exactly what the left hand has
              shipped since FX1. Adding anything further here (a `visibility`
              rule, an `inert`) would be DIVERGING from the mirror, which is
              the opposite of the ruling.
              The panel's own effects are already gated on `open`
              (`if (!open) return;`), so a closed body costs a render and no
              work — nothing is fetched, drawn, or measured while it is hidden. */}
          {(
            <div className="wz-tutor-body">
            <div className="wz-tutor-head">
              <span className="wz-tutor-head-title">{t('tutorTitle')}</span>
              <button type="button" className="wz-tutor-dock-btn" aria-label={docked ? t('tutorClose') : t('tutorDockClose')} onClick={handleDockButton}>
                {docked ? '×' : t('tutorDockClose')}
              </button>
            </div>

            {/* FX10 S1 — the conversation is now the panel's own center of
                gravity ("with the room this much wider, the composer and
                the exchange must read as the main event, the lenses as
                sections around it" — the brief's own words): moved to
                render directly under the head, ahead of every lens. The
                log lost its own private `max-height`/`overflow-y` (S1's
                "no scroll-within-scroll" — see index.css's own comment on
                `.wz-tutor-convo-log` for the full before/after) — it grows
                with its content now, the panel's single `overflow-y:auto`
                is the only scrollbar in this whole subtree. */}
            <div className="wz-tutor-convo">
              <div className="wz-tutor-h">{t('tutorConversationTitle')}</div>
              <div className="wz-tutor-convo-log">
                {messages.length === 0 && !draw
                  ? <div className="wz-tutor-empty">{t('tutorConversationEmpty')}</div>
                  : messages.map((m) => (
                      <div key={m.id} className={`wz-tutor-msg wz-tutor-msg-${m.role}`}>{m.text}</div>
                    ))}
                {/* ITEM 84, THE DECK PHASE — the standing draw, rendered as the
                    last turn INSIDE this same log: Nick's requirement 3 is that
                    a preset's response land "in the same dialog/chat window
                    where conversation can commence," so it gets no window, no
                    tray and no furniture of its own. There is ONE of these,
                    always — the state it reads cannot hold two. It is not yet a
                    persisted message (send() commits it); `data-drawn` is what
                    the harness reads to prove the rendered line is a verbatim
                    member of the local pool for the preset that was pressed. */}
                {draw && (
                  <div className="wz-tutor-msg wz-tutor-msg-tutor wz-tutor-draw" data-drawn={draw.preset}>{draw.text}</div>
                )}
              </div>
              {status === 'offline' && <div className="wz-tutor-convo-status">{t('tutorConversationOffline')}</div>}
              {status === 'error' && <div className="wz-tutor-convo-status">{t('tutorConversationError')}</div>}
              {status === 'unborn' && <div className="wz-tutor-convo-status">{t('tutorConversationUnborn')}</div>}
              {sending && <div className="wz-tutor-convo-status">{t('tutorConversationSending')}</div>}
              {deltaTruncated && <div className="wz-tutor-convo-status">{t('tutorDeltaTruncated')}</div>}
              {selectionTruncated && <div className="wz-tutor-convo-status">{t('tutorSelectionTruncated')}</div>}
              {/* ITEM 84, THE DECK PHASE — THE FREE WRITE ROSTER. Mounted where
                  the arc already ruled it mounts (lock record §1 line 1: the
                  shared chip row inside "Talk it through", above the composer,
                  below the messages) — the redesign changed the roster's
                  contents, never its mount.
                  MODE-AWARE, and this is the panel's first such branch: absent
                  outright in Draft, on screenplay and on Board — absent, not
                  disabled (G3), because a preset is not a transient gate on
                  real capability there, it simply is not that mode's furniture.
                  A spent ask IS the lawful `disabled` case: the capability is
                  real and the gate lifts the moment the writer moves on. */}
              {freeWrite && (
                <div className="wz-tutor-fw-roster" role="group" aria-label={t('tutorFreeWriteRoster')}>
                  {FREE_WRITE_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="wz-tutor-fw-preset"
                      data-preset={p.id}
                      // NEVER `disabled`, and that is Nick's ruling rather than
                      // a style call: a spent ask must answer a fourth press
                      // with a note, and a disabled control cannot answer
                      // anything. `data-spent` carries the quiet styling that
                      // `:disabled` used to.
                      data-spent={drawCounts[p.id] >= DRAW_CEILING ? 'true' : 'false'}
                      onClick={() => pressPreset(p.id)}
                    >
                      {t(p.term)}
                    </button>
                  ))}
                </div>
              )}
              {/* THE REFILL NOTE — what a spent ask says instead of drawing.
                  One line, no number: a live countdown would be pace/progress
                  content, which this mode bars outright (M1/CD4 — the meter
                  stays the only number in the room, and it is a cost, not a
                  score). The threshold is a rule, so it may be named; the
                  writer's distance from it is a score, so it may not. */}
              {freeWrite && refillNote !== null && (
                <div className="wz-tutor-fw-note" data-note-for={refillNote}>{t('tutorFreeWriteRefill')}</div>
              )}
              {/* ITEM 84, THE DRAFT ROSTER — mounted where the arc ruled the shared
                  chip row mounts (lock record §1 line 1: inside "Talk it through",
                  above the composer, below the messages), the same slot the Free
                  Write roster takes in its own mode. Chips render WITH the panel
                  and never animate in; the order is fixed and never reshuffles
                  between visits. Absent outright in Free Write and on Board — the
                  two rosters are one branch's two sides and never co-render. */}
              {drafting && (
                <div className="wz-tutor-draft-roster" role="group" aria-label={t('tutorDraftRoster')}>
                  {DRAFT_ASKS.map((ask) => {
                    // TD4 is the ONE lawful disabled-visible chip in this roster:
                    // its gate flips by the second as the writer selects and
                    // deselects, and layout stability outranks purity of absence
                    // for that case, so it holds its slot instead of appearing and
                    // vanishing. It is a TRANSIENT gate on real capability (never
                    // G3's locked door wearing paint), and it says why — the title
                    // below is the reason a disabled control otherwise cannot give.
                    const gated = ask.sendsSelection && !hasStretch;
                    return (
                      <button
                        key={ask.id}
                        type="button"
                        className="wz-tutor-draft-ask"
                        data-ask={ask.id}
                        // What the harness reads to prove, per button, that the
                        // wire carries exactly what the button names.
                        data-sends-selection={ask.sendsSelection ? 'true' : 'false'}
                        data-gated={gated ? 'true' : 'false'}
                        disabled={gated}
                        title={gated ? t('tutorDraftStretchNeedsSelection') : undefined}
                        onClick={() => pressAsk(ask)}
                      >
                        {t(ask.term)}
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="wz-tutor-convo-row">
                <input
                  ref={composerRef}
                  className="wz-tutor-convo-input"
                  type="text"
                  value={composerText}
                  placeholder={t('tutorConversationPlaceholder')}
                  onChange={(e) => setComposerText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void send(); } }}
                />
                <button type="button" className="wz-tutor-convo-send" disabled={!composerText.trim() || sending} onClick={() => void send()}>
                  {t('tutorConversationSend')}
                </button>
              </div>
            </div>

            {/* FX10 S1 — the lenses now read as sections AROUND the conversation
                above, not the panel's own lead content (FX12 S1 retired the fourth
                section, nudges) — a single wrapper (a quiet top divider, index.css) is
                the whole demotion; no section here grows its own scrollbar (S1's "no
                scroll-within-scroll" applies just as much to these as to the
                conversation log). */}
            <div className="wz-tutor-sections">
            <div className="wz-tutor-section">
              <div className="wz-tutor-h">{t('tutorLensConsistency')}</div>
              {consistencyObservations.length === 0
                ? <div className="wz-tutor-empty">{t('tutorLensConsistencyEmpty')}</div>
                : consistencyObservations.map((o) => <div key={o} className="wz-tutor-obs">{o}</div>)}
            </div>

            <div className="wz-tutor-section">
              <div className="wz-tutor-h">{t('tutorLensStructure')}</div>
              <div className="wz-tutor-obs">{structure?.homeLabel}</div>
              {structure?.memberships.map((m) => <div key={m} className="wz-tutor-obs">{m}</div>)}
              {/* FX12 S2 — the beats sentence dies (V3): the beats system is dormant
                  (CD4), so the Structure lens no longer speaks a dead language — the
                  "Not linked to a beat." line is retired. Home + memberships
                  (home-derived, true) survive; the Thread arc gives Structure its true
                  linked-language later. Silence over falsehood until then. */}
            </div>

            <div className="wz-tutor-section">
              <div className="wz-tutor-h">{t('tutorLensFragments')}</div>
              <div className="wz-tutor-note">{t('tutorLensFragmentsNote')}</div>
              {fragments.length === 0
                ? <div className="wz-tutor-empty">{t('tutorLensFragmentsEmpty')}</div>
                : (
                  <div className="wz-tutor-frag-list">
                    {fragments.map((f) => (
                      <button key={f.id} type="button" className="wz-tutor-frag-item" onClick={() => navigate(`/page/${f.id}`)}>
                        {f.title}
                      </button>
                    ))}
                  </div>
                )}
            </div>

            {/* FX12 S1 — the nudges sleep, whole: the "Waiting for you" section
                unrenders everywhere and the nudge-generation engine (tutorNudges.ts)
                sleeps entire — its only caller (computeNudges, above) is removed, so no
                computation and no injection happen on any surface. The engine and its
                data are UNTOUCHED (dormant, not deleted). A14's letters-frame survives
                as ratified law — this retires its current implementation, not its
                principle. RETURN GATE (ledger item 64): the nudges return only via a
                later Tutor-panel ticket under content law — no guilt-language, no counts,
                no repeats, deduplicated. The sleep must not become the grave. */}

            {/* TU5 S3 — the book's Bible, LAST in the cluster (Fable's ruling:
                the most at-rest thing sits deepest — lenses are verbs, nudges
                are letters on approach, the Bible is the shelf at the back).
                Only when the page rides a project (`entry.projectId`); a
                loose/journal page shows nothing here — quiet absence, not a
                disabled door. Writer-authored only; no control here can place
                text on a page (A13). No counts (the FX9 law travels). */}
            {entry.projectId && (
              <div className="wz-tutor-section">
                <div className="wz-tutor-h">{t('tutorBibleTitle')}</div>
                <div className="wz-tutor-note">{t('tutorBibleNote')}</div>
                {bibleFacts.length === 0
                  ? <div className="wz-tutor-empty">{t('tutorBibleEmpty')}</div>
                  : (
                    <div className="wz-tutor-bible-list">
                      {bibleFacts.map((f) => (
                        <div key={f.id} className="wz-tutor-bible-fact">
                          {bibleEditingId === f.id ? (
                            <div className="wz-tutor-bible-edit">
                              <input
                                className="wz-tutor-bible-input"
                                type="text"
                                value={bibleEditText}
                                maxLength={FACT_TEXT_CAP}
                                onChange={(e) => setBibleEditText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') { e.preventDefault(); commitBibleEdit(f.id); }
                                  if (e.key === 'Escape') { e.preventDefault(); cancelBibleEdit(); }
                                }}
                                autoFocus
                              />
                              <button type="button" className="wz-tutor-bible-btn" onClick={() => commitBibleEdit(f.id)}>{t('tutorBibleSave')}</button>
                              <button type="button" className="wz-tutor-bible-btn" onClick={cancelBibleEdit}>{t('tutorBibleCancel')}</button>
                            </div>
                          ) : (
                            <>
                              <span className="wz-tutor-bible-text">{f.text}</span>
                              <span className="wz-tutor-bible-actions">
                                <button type="button" className="wz-tutor-bible-btn" onClick={() => startBibleEdit(f)}>{t('tutorBibleEdit')}</button>
                                <button type="button" className="wz-tutor-bible-btn" onClick={() => removeBibleFact(f.id)}>{t('tutorBibleDelete')}</button>
                              </span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                <div className="wz-tutor-bible-row">
                  <input
                    className="wz-tutor-bible-input"
                    type="text"
                    value={bibleInput}
                    maxLength={FACT_TEXT_CAP}
                    placeholder={t('tutorBibleAddPlaceholder')}
                    onChange={(e) => setBibleInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addBibleFact(); } }}
                  />
                  <button type="button" className="wz-tutor-bible-add" disabled={!bibleInput.trim()} onClick={addBibleFact}>
                    {t('tutorBibleAdd')}
                  </button>
                </div>
              </div>
            )}
            </div>

            {/* TU2 S5 — the session meter's own quiet foot line. Absent
                (not just invisible — unmounted, `meterState === null`)
                whenever no call has been made this mount yet, and again
                once its own removal timer fires — see showMeterLine above
                for why this is a real scheduled unmount, not a CSS-only
                fade reduced-motion could leave stuck on-screen. */}
            {meterState && (
              <div className="wz-tutor-meter" data-fading={meterState.fading ? 'true' : 'false'}>
                {meterState.text}
              </div>
            )}
            </div>
          )}
        </div>
      </div>

      {showDisclosure && (
        <div className="wz-tutor-disclosure-backdrop wz-tutor-zone">
          <div className="wz-tutor-disclosure" role="dialog" aria-modal="true" aria-label={t('tutorDisclosureTitle')}>
            <div className="wz-tutor-disclosure-title">{t('tutorDisclosureTitle')}</div>
            {/* ITEM 84 — v4, in ANNOTATION FORM. open-threads.md's own ruling is
                "v3 → superseded by v4 in annotation form (v3 standing verbatim
                beneath)", so the ratified sentence leads and v3's text stands
                under it. v3 is REUSED HERE BY ID — never copied, never edited —
                which is what makes "verbatim" a fact about this line rather than a
                claim about it, and it is also why nothing v3 promised is withdrawn
                by the addition. The panel still shows exactly
                CURRENT_DISCLOSURE_VERSION's own copy; that copy is now these two
                lines together, and a v1/v2/v3-acknowledged device sees it exactly
                once (store/tutorDisclosure.ts's integer compare, unchanged).

                WHY V3 KEEPS `.wz-tutor-disclosure-body` AND V4 TAKES A NEW CLASS.
                "Annotation form" says which of these two is which: v3's
                enumeration remains THE BODY — the standing promise, unwithdrawn —
                and v4 is the sentence written above it. Naming them that way round
                is the structure the ruling describes, and it has the honest side
                effect that tu2/tu5's existing "the modal carries v3's wording
                exactly" checks stay TRUE rather than needing to be parked: v3's
                wording IS still carried, exactly, which is the whole point of
                "verbatim beneath". Only the two version-NUMBER checks park, because
                only they stop being true. */}
            <div className="wz-tutor-disclosure-annotation">{t('tutorDisclosureBodyV4')}</div>
            <div className="wz-tutor-disclosure-body">{t('tutorDisclosureBodyV3')}</div>
            <button type="button" className="wz-tutor-disclosure-ack" onClick={acknowledgeDisclosure} autoFocus>
              {t('tutorDisclosureAck')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
