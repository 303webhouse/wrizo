import { liveBoxes } from '../store/boxTombstones';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeskLexicon } from '../store/deskLexicon';
import type { JournalEntry, Project, Fact } from '../types';
import { generateId, getBinderPages, getJournalEntry, appendTutorMessage, advanceTutorCursor, isUnborn } from '../store/persistence';
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
import { capTutorHistory } from '../store/tutorHistory';
import { drawerArrow, setDrawerInert } from '../store/drawerShell';
import { SideDrawer, type DrawerTabsConfig } from './SideDrawer';
import { isArbor2 } from '../arbor2/flag';
import { useTheme } from '../store/theme';
import { DrawerNote } from './DrawerNote';
import { HelpButton } from './HelpButton';
import { ConnectionsDrawerPanel } from './ConnectionsDrawerPanel';
import { RIGHT_TABS, type RightTab } from '../store/drawerSet';
import { requestOpen, noteClosed, registerDrawer } from '../store/menusDrawers';
import { DRAWER_MIN } from '../store/menusDrawers';
import { getLinkDock, setLinkDock, useLinkDock } from '../store/linkDock';
import { LinkDockReader } from './LinkDockReader';   // its own line: one-drawer.mjs O6 reads the line above verbatim
import { TUTOR_STAGE_EVENT } from '../store/tutorStage';

// the Tutor: two DeskFrame anchors (the grip's small safe box; the open panel pinned to the stage's edge), rendered bare; it receives only entry/project/pageText/selectionText - nothing that could write onto a page; no badge, toast or count ever knocks [Tutor §2]
const DOCK_FLOOR_PX = 120;
const BOARD_TAB_RIDES_EDGE = true;   // see the retired grip-move effect [Tutor §4]
const TUTOR_TAB_PX = 16;   // .wz-tutor-grip{ width:16px } - the drawer mirror counts the tab in the drawer's width, as the Tools drawer does
const USABLE_PANEL_FLOOR_PX = 280;   // the measure-effect's floor is DRAWER_MIN (200); this constant is kept as the record [Tutor §5]
void USABLE_PANEL_FLOOR_PX;

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
function capSelection(stretch: string): { text: string; truncated: boolean; wordsSent: number } {
  if (stretch.length <= SELECTION_CHAR_CAP) return { text: stretch, truncated: false, wordsSent: 0 };
  const kept = stretch.slice(0, SELECTION_CHAR_CAP);
  // the count is of the slice actually sent, never the whole stretch [Tutor §6]
  const wordsSent = kept.trim().split(/\s+/).filter(Boolean).length;
  return { text: `[${SELECTION_TRUNCATION_HEADER}]\n${kept}`, truncated: true, wordsSent };
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

// the margin past the paper's right edge, measured (the mirror of Cascade's availableCascadeMargin); .board-canvas-wrap is a paper too, or a board reads an unlimited margin; linkDockRoom: the true margin, so the page is never covered [Tutor §7]
function linkDockRoom(): boolean {
  const stage = document.querySelector('.desk-frame-stage');
  const paper = document.querySelector('.desk-frame-stage--prose .mode-page') ?? document.querySelector('.mode-pagecol, .entry-full, .board-canvas-wrap');
  return !!stage && !!paper && stage.getBoundingClientRect().right - paper.getBoundingClientRect().right >= DRAWER_MIN;
}
function availableTutorMargin(): number {
  if (typeof document === 'undefined') return Infinity;
  const stage = document.querySelector('.desk-frame-stage');
  // PAGE-SIZE - the prose page is PAINTED by a transform, ~1.6x and in a stage-wide column while zoomed: the margin is the painted page's (lane 3,
  // tu1 S2: read from the column it was ~0, and the dock control closed the panel)
  const paper = document.querySelector('.desk-frame-stage--prose .mode-page') ?? document.querySelector('.mode-pagecol, .entry-full, .board-canvas-wrap');
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
  //
  // ITEM 112-A — 'revise' joins the union, and it deliberately selects NEITHER
  // roster (see the `drafting` branch below). Revise's own roster is 112-D.
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

// the roster's three presets, in order; `id` keys the local deck, `term` the string of record [Tutor §8]
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
  // `label` overrides only the chip's face; pressAsk still sends `term`, word for word [Tutor §9]
  label?: 'tutorDraftAskStretchLabel';
}[] = [
  { id: 'drag', term: 'tutorDraftAskDrag', sendsSelection: false },
  { id: 'loadBearing', term: 'tutorDraftAskLoadBearing', sendsSelection: false },
  { id: 'threadSlip', term: 'tutorDraftAskThreadSlip', sendsSelection: false },
  { id: 'stretch', term: 'tutorDraftAskStretch', sendsSelection: true, label: 'tutorDraftAskStretchLabel' },
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
  // PHASE 1 (S3) - the right drawer's tab: the Tutor (today's contents, untouched) or the theme's links word (empty for now).
  const [rightTab, setRightTab] = useState<RightTab>('tutor');
  // ARBOR v2 MOCKUP (?arbor2=1, Arbor only; spec §9, Fable's ruling 3): a third cloth tab, BOARD - "connect this page to a board". It is a
  // VIEW of the Grafts pane (rightTab stays 'links'), showing only its board parts and the same "+ Graft..." picker: no new behaviour, no
  // new state beyond this in-session flag. Off the flag the drawer is byte-for-byte today's.
  const tutorTheme = useTheme();
  const arbor2 = isArbor2() && tutorTheme === 'plateau';
  const [arborBoard, setArborBoard] = useState(false);
  const [docked, setDocked] = useState(false);
  // one drawer at a time: a layout effect keyed on `open`, so every path announces and no frame shows both drawers open [Tutor §10]
  useLayoutEffect(() => {
    if (open) requestOpen('tutor');
    else noteClosed('tutor');
  }, [open]);
  useEffect(() => registerDrawer('tutor', () => setOpen(false)), []);
  // the open panel's width, measured: flush to the paper's right edge where a usable panel fits, natural open-w (overlay) below that; null on a board and while docked (CSS owns those) [Tutor §11]
  const [panelWidthPx, setPanelWidthPx] = useState(null);
  // how far the open panel stands in from the stage's edge, so its left edge meets its tab on the page's edge (the Tools drawer's mirror) [Tutor §12]
  const [panelOffsetPx, setPanelOffsetPx] = useState(0);
  // a linked card or page docked beside this page (this device's slot), carried by the Tutor's dock; a dock found on mount docks again [Tutor §13]
  const linkDock = useLinkDock(pageKind === 'board' ? null : entry.id);
  useEffect(() => {
    // K2: the reader stands beside the page or not at all - with no room for it (a drawer's narrowest, beside the page's edge), the page keeps the stage
    const onOpen = () => { if (linkDockRoom()) { setOpen(true); setDocked(true); } };
    document.addEventListener('wz-link-dock-open', onOpen);
    return () => document.removeEventListener('wz-link-dock-open', onOpen);
  }, []);
  const dockedOnMount = useRef(false);
  useEffect(() => {
    if (dockedOnMount.current || !linkDock) return;
    dockedOnMount.current = true;
    const id = setTimeout(() => { if (linkDockRoom()) { setOpen(true); setDocked(true); } }, 0);
    return () => clearTimeout(id);
  }, [linkDock]);
  // Undock: the reader goes and the docked panel's own content (the Grafts list) returns; the panel stays docked and open
  const closeLinkDock = () => { setLinkDock(entry.id, null); };
  // the grip's open position is measured from the panel's rendered rect, correct whichever of three regimes sized it [Tutor §14]
  const [gripLeftPx, setGripLeftPx] = useState<number | null>(null);
  const [showDisclosure, setShowDisclosure] = useState(false);
  const [composerText, setComposerText] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<'idle' | 'offline' | 'error' | 'unborn'>('idle');
  // A11Y AUDIT A8 — a DEDICATED polite live region for the Tutor's replies
  // only. Set EXACTLY ONCE per genuine reply (the result.reply success
  // branch below), never on the writer's own message, never on mount, never
  // on the draw/offline/error branches — so a screen reader announces each
  // new answer once and nothing else. Deliberately NOT `aria-live` on the
  // conversation log itself (`.wz-tutor-convo-log`, rendered below): that
  // div also gains the writer's OWN message on every send, which a live
  // region on the whole list would announce too — exactly what "nothing
  // else" rules out. Rendered inside `.wz-tutor-panel`, which carries
  // `aria-hidden` while closed — an aria-hidden ancestor already keeps a
  // live region inside it silent, so nothing new is needed to stay quiet
  // while the Tutor is closed.
  const [replyAnnouncement, setReplyAnnouncement] = useState('');
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

  // one standing draw for the whole roster - a second press replaces it; component state, not a message, because a press must not conjure a thread; it commits on the writer's Send [Tutor §15]
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
  // the page's word count when an ask was spent (its third draw); a ref because it must not cause a render [Tutor §16]
  const spentAnchorRef = useRef<Record<FreeWritePresetId, number | null>>({ writingPrompt: null, unblock: null, tips: null });
  // which spent ask was pressed a fourth time, so it answers with a note [Tutor §17]
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
  // ITEM word-diet — the last-attempted request, for "Try again" (see
  // `attemptSend`/`lastSendArgsRef.current` below).
  const lastSendArgsRef = useRef<{ history: { role: 'writer' | 'tutor'; text: string }[]; delta?: string; bible?: string; selection?: string } | null>(null);

  // ==========================================================================
  // ITEM 84, THE DRAFT ROSTER — the Draft asks' own state.
  // ==========================================================================
  // Draft is mode key 'drafting' (ModeStrip.tsx maps t('modeDraft') to exactly
  // this value). The two rosters are SIBLINGS on one branch and can never
  // co-render: Free Write is not Draft, and an absent mode (Board) is neither.
  //
  // ITEM 112-A — CORRECTED, BECAUSE ITS REASON EXPIRED. This comment used to
  // read: "Revise cannot reach here at all — `EditorMode` has no 'revise' member
  // and the Revise tab is `live: false`, so the brief's 'cannot render in Revise'
  // holds by the TYPE, not by a branch." Both halves of that reason are now false:
  // 'revise' IS an EditorMode and the tab IS live, so Revise reaches this line on
  // every render of a Revise page.
  //
  // THE CONCLUSION IS UNCHANGED, and now it holds by the branch. `drafting` is
  // false in Revise and `freeWrite` is false in Revise, so NEITHER roster renders
  // — which is what 112-A requires: the Revise Counsel roster is 112-D, and §6
  // forbids any of it appearing early. The panel itself DOES mount in Revise,
  // carrying its conversation, lenses and Bible exactly as on any other page —
  // that is the Counsel hand having content on day one (§4), and it is why only
  // the DESK drawer opens empty.
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
  // The {n} tutorSelectionTruncated names — set alongside selectionTruncated,
  // same lifetime (armed by the press, cleared by any press that arms nothing).
  const [selectionSentWords, setSelectionSentWords] = useState(0);
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
      // Esc closes the drawer from inside it too, unless a control already handled it; focus returns to the tab when it was in the drawer [Tutor §18]
      if (e.key === 'Escape' && !e.defaultPrevented) {
        const inDrawer = !!target?.closest?.('.wz-tutor-zone');
        if (getLinkDock(entry.id)) setLinkDock(entry.id, null);   // Esc leaves a docked reader with the dock [Tutor §19]
        setOpen(false); setDocked(false);
        if (inDrawer) document.querySelector<HTMLElement>('.wz-tutor-grip')?.focus();
        return;
      }
      if (target?.closest?.('.wz-tutor-zone')) return;
      if (e.key === 'Escape') { setOpen(false); setDocked(false); return; }
      if (docked) return; // a docked panel survives keystrokes
      setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, docked, showDisclosure]);

  // occupy the margin at min(margin, open-w) where a usable panel fits, else overlay at open-w; the paper rect is stable open or closed, so one read plus a resize listener suffices [Tutor §20]
  useLayoutEffect(() => {
    // the board joins the mirror (it narrows to the drawer); a docked link reader is measured like the open drawer, never by the docked CSS clamp [Tutor §21]
    // THE DRAWER ALIGNMENT (Nick, via Fable, Nov 1; the theme mockup's flag only - its drawerEdge.ts sets data-wz2-drawer-edge): closing keeps
    // the open geometry, so the drawer slides back from where it stood and its tab, on its outer edge, travels with it (it snapped to the
    // pre-open width first: 37 px apart at half the close, run 41336050132). The next open measures again.
    if (!open && document.documentElement.hasAttribute('data-wz2-drawer-edge')) return;
    if (!open || (docked && !linkDock)) { setPanelWidthPx(null); setPanelOffsetPx(0); return; }
    const measure = () => {
      const stage = document.querySelector('.desk-frame-stage');
      // PAGE-SIZE - the prose page is PAINTED larger than its column by a transform, so the margin is measured from the painted page itself
      const paper = document.querySelector('.desk-frame-stage--prose .mode-page') ?? document.querySelector('.mode-pagecol, .entry-full, .board-canvas-wrap');
      if (!stage || !paper) { setPanelWidthPx(null); return; }
      const openW = Math.max(320, Math.min(0.34 * window.innerWidth, 460)); // --tutor-panel-open-w
      const geoMargin = stage.getBoundingClientRect().right - paper.getBoundingClientRect().right;
      // a drawer narrows to fit beside the page down to DRAWER_MIN before it overlays; where it fits, tab and panel are anchored to the page's right edge, so the tab never moves [Tutor §22]
      if (geoMargin >= DRAWER_MIN) {
        const drawerW = Math.min(geoMargin, TUTOR_TAB_PX + openW);
        setPanelWidthPx(Math.round(drawerW - TUTOR_TAB_PX));
        setPanelOffsetPx(Math.max(0, Math.round(geoMargin - drawerW)));
      } else {
        setPanelWidthPx(Math.round(openW));
        setPanelOffsetPx(0);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    document.addEventListener('wz-zoom-changed', measure);   // PAGE-SIZE - the painted page's edge moves when the zoom toggles
    document.addEventListener('wz-board-moved', measure);    // the board narrows after the drawer opens [Tutor §23]
    return () => { window.removeEventListener('resize', measure); document.removeEventListener('wz-zoom-changed', measure); document.removeEventListener('wz-board-moved', measure); };
  }, [open, docked, pageKind, linkDock]);

  // on a writing surface the tab never moves (the CSS formula places it); the board narrows beside the drawer too, so this effect is inert, kept as the record of the move [Tutor §24]
  useEffect(() => {
    if (!open || pageKind !== 'board' || BOARD_TAB_RIDES_EDGE) { setGripLeftPx(null); return; }
    const GRIP_GUTTER_PX = 16;
    const GRIP_WIDTH_PX = 16; // .wz-tutor-grip{ width:16px }
    const measure = () => {
      const stage = document.querySelector('.desk-frame-stage');
      const panel = document.querySelector('.wz-tutor-panel');
      if (!stage || !panel) { setGripLeftPx(null); return; }
      const stageRect = stage.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      setGripLeftPx(Math.round(panelRect.left - GRIP_GUTTER_PX - GRIP_WIDTH_PX - stageRect.left));
    };
    measure();
    window.addEventListener('resize', measure);
    document.addEventListener('wz-zoom-changed', measure);   // PAGE-SIZE - the painted page's edge moves when the zoom toggles
    return () => { window.removeEventListener('resize', measure); document.removeEventListener('wz-zoom-changed', measure); };
  }, [open, docked, pageKind, panelWidthPx]);

  // the disclosure modal no longer opens (its text sits behind a "?" by the Ask box); showDisclosure stays declared and is never set, so the guards that read it are dormant [Tutor §25]
  const handleGripClick = () => {
    if (docked) { if (linkDock) setLinkDock(entry.id, null); setDocked(false); return; } // reopening the grip while docked restores the panel; a docked reader is left with it [Tutor §26]
    setOpen((o) => !o);
  };

  const handleDockButton = () => {
    if (docked) { setDocked(false); setOpen(false); return; } // the docked panel's own explicit close
    if (availableTutorMargin() >= DOCK_FLOOR_PX) { setDocked(true); return; }
    setOpen(false); // the dock affordance is unavailable below the floor — a plain close instead
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
        ? [pageText, ...liveBoxes(entry.boxes)
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

  // the composer takes focus when the panel opens in Free Write (blank space with a cursor); preventScroll, and held off while the disclosure is up [Tutor §27]
  useEffect(() => {
    if (!open || !freeWrite || showDisclosure) return;
    composerRef.current?.focus({ preventScroll: true });
  }, [open, freeWrite, showDisclosure]);

  // the refill: an ask's draws reset after 100 words written on this page since its third draw (HB1's monotone count, which never goes backwards under forward lock); the standing draw survives a refill [Tutor §28]
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
    // a spent ask answers a fourth press with a note, which is why the button is never `disabled` [Tutor §29]
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
      setSelectionSentWords(capped.wordsSent);
    } else {
      setArmedSelection(null);
      setSelectionTruncated(false);
      setSelectionSentWords(0);
    }
    setComposerText(text);                  // REPLACES — the composer stages one ask
    setStageTick((n) => n + 1);
  };

  // W3 / W11a - a step's "more" (components/StepHelp.tsx) STAGES an ask here: the drawer opens on the Tutor tab and the ask lands in the composer as ordinary editable text,
  // caret at the end - the same arrival as a roster chip's press. It is staging and nothing else: no fetch, no await, no auto-send. Like ask 1's press it names no selection, so any
  // armed one is cleared (one chip cannot consent for another's wire).
  useEffect(() => {
    const onStage = (e: Event) => {
      const text = (e as CustomEvent<{ text?: string }>).detail?.text;
      if (!text) return;
      setRightTab('tutor');
      setOpen(true);
      setArmedSelection(null);
      setSelectionTruncated(false);
      setSelectionSentWords(0);
      setComposerText(text);
      setStageTick((n) => n + 1);
    };
    window.addEventListener(TUTOR_STAGE_EVENT, onStage);
    return () => window.removeEventListener(TUTOR_STAGE_EVENT, onStage);
  }, []);

  const send = async () => {
    const text = composerText.trim();
    if (!text || sending) return;
    // an unborn surface refuses a send out loud and keeps the composer's text: a chat message must not birth the row [Tutor §30]
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
    // the standing draw commits into the thread here, just ahead of the writer's message, so the model sees the spur it answers; a send does not refill the deck [Tutor §31]
    if (draw) {
      appendTutorMessage(entry.id, { id: generateId(), role: 'tutor', text: draw.text, at: new Date().toISOString() });
      setDraw(null);
    }
    const writerMsg = { id: generateId(), role: 'writer' as const, text, at: new Date().toISOString() };
    appendTutorMessage(entry.id, writerMsg);
    setSending(true);
    // send only the most recent messages within the server's cap, ending with the writer's; the stored thread is untouched [Tutor §32]
    const fullHistory = getJournalEntry(entry.id)?.tutor?.messages ?? [];
    const history = capTutorHistory(fullHistory).map((m) => ({ role: m.role, text: m.text }));
    // TU5 S4 — assemble the Bible at send time only (never ambiently): read the
    // project's saved facts fresh and join them; absent when there are none, so
    // JSON.stringify drops the key and the wire stays byte-free of any bible.
    const bible = entry.projectId ? assembleBible(getBibleFacts(entry.projectId)) : null;
    // ITEM 84, TD4 — `selection` is the ONE key this ticket adds, and it is absent
    // (never an empty string) unless the chip whose own words name it was the
    // press that staged this ask. `pageText` is not passed and never becomes a
    // key: it stays a render prop, per the lock record's own wire precision.
    const args = { history, delta: delta ?? undefined, bible: bible ?? undefined, selection: selection ?? undefined };
    // ITEM word-diet — the EXACT request just assembled, kept for "Try
    // again" (tutorConversationError's own new button): a retry replays
    // this SAME call rather than re-reading armedSelection/re-assembling
    // the delta against `lastRead`, both of which the lines above already
    // consumed/advanced past — re-deriving them on retry would silently
    // send a DIFFERENT, smaller request than the one that actually failed.
    lastSendArgsRef.current = args;
    await attemptSend(args);
  };

  const attemptSend = async (args: { history: { role: 'writer' | 'tutor'; text: string }[]; delta?: string; bible?: string; selection?: string }) => {
    setSending(true);
    const result = await apiTutorChat(args.history, args.delta, args.bible, args.selection);
    setSending(false);
    if (!result.ok) { setStatus('error'); return; }
    if (!result.configured) { setStatus('offline'); return; }
    if (result.reply) {
      appendTutorMessage(entry.id, { id: generateId(), role: 'tutor', text: result.reply, at: new Date().toISOString() });
      // A11Y AUDIT A8 — the one and only place this fires: a genuine new
      // reply, received. A repeated identical reply (an edge case, not a
      // real one today) would not re-announce from React state alone
      // (same string, no change) — acceptable, since "the same answer
      // again" announced twice is not what "each new reply" asks for either.
      setReplyAnnouncement(result.reply);
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

  // the right drawer's tab row: TUTOR | the theme's links word (from the lexicon); its "?" is the shared HelpButton [Tutor §33]
  const arborRightTabs: DrawerTabsConfig<RightTab | 'board'> | undefined = arbor2 ? {
    items: [{ id: RIGHT_TABS[0], label: t('tutorTabTutor') }, { id: RIGHT_TABS[1], label: t('drawerLinks') }, { id: 'board', label: t('railBoard') }],
    // ARBOR v2 MOCKUP r18 (the Wrizors, Nov 4: a stray "?" stood in the room beside the GRAFTS folder tab): the Grafts "?" is drawn on the Grafts
    // pane's own first row instead (ConnectionsDrawerPanel's `help`), inside the drawer
    value: rightTab === 'links' && arborBoard ? 'board' : rightTab,
    onChange: (v: RightTab | 'board') => { setArborBoard(v === 'board'); setRightTab(v === 'board' ? 'links' : v); },
    label: t('drawerRightTabsLabel'),
  } : undefined;
  const rightTabs: DrawerTabsConfig<RightTab> = {
    items: [{ id: RIGHT_TABS[0], label: t('tutorTabTutor') }, { id: RIGHT_TABS[1], label: t('drawerLinks') }],
    notes: { links: <HelpButton helpKey="helpGrafts" subjectLabel={t('drawerLinks')} /> },
    value: rightTab,
    onChange: setRightTab,
    label: t('drawerRightTabsLabel'),
  };

  return (
    <>
      <div className={`desk-frame-tutor-anchor desk-frame-tutor-anchor--${pageKind} wz-tutor-zone`} style={gripLeftPx != null ? { left: `${gripLeftPx}px`, right: 'auto' } : undefined}>
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
          <span className="wz-tutor-grip-glyph" aria-hidden="true">{drawerArrow('right', open)}</span>
        </button>
      </div>

      <div className={`desk-frame-tutor-panel-anchor desk-frame-tutor-panel-anchor--${pageKind} wz-tutor-zone`}>
        <div className="wz-tutor-panel" ref={(el) => setDrawerInert(el, !open)} aria-hidden={!open} data-open={open ? 'true' : 'false'} data-docked={docked ? 'true' : 'false'} style={panelWidthPx != null ? { width: `${panelWidthPx}px`, maxWidth: `${panelWidthPx}px`, marginRight: `${panelOffsetPx}px` } : undefined}>
          {/* PHASE 1 - the sliding layer: the panel above is the clip and the scroller; <SideDrawer> is what slides in from behind the tab.
              No tab row yet (S3 adds TUTOR | the theme's links word). */}
          {/* while a linked card or page stands docked, the docked panel is its reader [Tutor §34] */}
          {linkDock && docked ? <LinkDockReader dock={linkDock} onClose={closeLinkDock} /> : (
          <SideDrawer side="right" idPrefix="wz-tutor" tabs={(arborRightTabs ?? rightTabs) as DrawerTabsConfig<string>}>
          {/* A11Y AUDIT A8 — the reply announcement, visually hidden. Lives at
              the panel's own top level (not inside the `{open && …}` content
              body below), so closing/reopening the Tutor never remounts it and
              never re-announces the last reply as if it were new. */}
          <div className="wz-sr-only" role="status" aria-live="polite">{replyAnnouncement}</div>
          {/* the body renders unconditionally inside the faded panel (the Sliver's shape), so the close fades the content instead of unmounting it and fading an empty box [Tutor §35] */}
          {rightTab === 'tutor' && (
            <div className="wz-tutor-body">
            {/* no standing header (the tab row names it); the dock toggle is icon-only, its full wording on aria-label and title [Tutor §36] */}
            <button type="button" className="wz-tutor-dock-btn" aria-label={docked ? t('tutorClose') : t('tutorDockClose')} title={docked ? t('tutorClose') : t('tutorDockClose')} onClick={handleDockButton}>
              {docked ? '×' : '⊙'}
            </button>

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
                {/* the standing draw is the log's last turn, in this same window; there is one, never two; data-drawn is what the harness reads [Tutor §37] */}
                {draw && (
                  <div className="wz-tutor-msg wz-tutor-msg-tutor wz-tutor-draw" data-drawn={draw.preset}>{draw.text}</div>
                )}
              </div>
              {status === 'offline' && <div className="wz-tutor-convo-status">{t('tutorConversationOffline')}</div>}
              {/* "Try again" replays the exact request that failed (lastSendArgsRef) [Tutor §38] */}
              {status === 'error' && (
                <div className="wz-tutor-convo-status">
                  {t('tutorConversationError')}{' '}
                  <button type="button" className="wz-tutor-retry" onClick={() => { if (lastSendArgsRef.current) { setStatus('idle'); attemptSend(lastSendArgsRef.current); } }}>
                    {t('tutorConversationRetry')}
                  </button>
                </div>
              )}
              {status === 'unborn' && <div className="wz-tutor-convo-status">{t('tutorConversationUnborn')}</div>}
              {sending && <div className="wz-tutor-convo-status">{t('tutorConversationSending')}</div>}
              {deltaTruncated && <div className="wz-tutor-convo-status">{t('tutorDeltaTruncated')}</div>}
              {selectionTruncated && <div className="wz-tutor-convo-status">{t('tutorSelectionTruncated').replace('{n}', () => String(selectionSentWords))}</div>}
              {/* the Free Write roster mounts in the shared chip row above the composer; absent outright in Draft, on screenplay and on a board [Tutor §39] */}
              {freeWrite && (
                <div className="wz-tutor-fw-roster" role="group" aria-label={t('tutorFreeWriteRoster')}>
                  {FREE_WRITE_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="wz-tutor-fw-preset"
                      data-preset={p.id}
                      // never `disabled`: a spent ask must answer a fourth press with a note; data-spent carries the quiet styling [Tutor §40]
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
              {/* the Draft roster takes the same slot in its own mode; chips render with the panel, never animate in, never reshuffle; the two rosters never co-render [Tutor §41] */}
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
                        {t(ask.label ?? ask.term)}
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
                {/* what travels when you ask: behind a "?" beside the Ask box, no standing text [Tutor §42] */}
                <DrawerNote label="What travels when you ask">{t('tutorDisclosureBodyV4')}</DrawerNote>
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
              {/* the note sits behind a "?" beside the lens heading [Tutor §43] */}
              <div className="wz-tutor-h">
                {t('tutorLensFragments')}{' '}
                <DrawerNote label="About Fragments">{t('tutorLensFragmentsNote')}</DrawerNote>
              </div>
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

            {/* the nudges sleep: their section does not render and the engine (tutorNudges.ts) has no caller; the engine and its data stay, dormant [Tutor §44] */}

            {/* the Bible sits last in the cluster, only when the page rides a project; writer-authored, and nothing here can place text on a page [Tutor §45] */}
            {entry.projectId && (
              <div className="wz-tutor-section">
                <div className="wz-tutor-h">{t('tutorBibleTitle')}</div>
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
          {rightTab === 'links' && <ConnectionsDrawerPanel only={arbor2 ? (arborBoard ? 'board' : 'grafts') : undefined}
            help={arbor2 && !arborBoard ? <HelpButton helpKey="helpGrafts" subjectLabel={t('drawerLinks')} /> : undefined} />}
          </SideDrawer>
          )}
        </div>
      </div>

    </>
  );
}
