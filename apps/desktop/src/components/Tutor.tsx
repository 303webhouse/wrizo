import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDeskLexicon } from '../store/deskLexicon';
import type { JournalEntry, Project, Fact } from '../types';
import { generateId, getBinderPages, getJournalEntry, appendTutorMessage, advanceTutorCursor } from '../store/persistence';
import { getTutorDisclosureSeen, setTutorDisclosureSeen } from '../store/tutorDisclosure';
import { apiTutorChat } from '../store/api';
import { computeConsistencyObservations } from '../store/tutorConsistency';
import { computeStructureFacts, computeFragmentItems } from '../store/tutorLenses';
import { computeNudges } from '../store/tutorNudges';
import { estimateTurnCostUSD, formatEstimatedUSD } from '../store/tutorCostEstimates';
import { addTutorSessionCost } from '../store/tutorMeter';
import { useBibleFacts, getBibleFacts, addFact, editFact, deleteFact, FACT_TEXT_CAP } from '../store/tutorBible';

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
// `entry`/`project`/`pageText` — never an editor ref, never a page-text
// setter, never anything that could route a byte of Tutor output onto a
// writing surface. Every control below is inert with respect to the page:
// the grip/dock buttons toggle local UI state; the fragment items call
// `navigate()` (travel, not text insertion); the composer's own input
// talks ONLY to appendTutorMessage/apiTutorChat. No control in this file
// ever touches `editorRef`, `setText`, or any DOM node outside the
// `.wz-tutor-zone`-marked subtree — the ticket's own defense-in-depth A13
// harness walk (tu1.mjs) asserts this structurally, not by enumerating
// "these N buttons are fine."
//
// A14 — the room never knocks: nudges (below) are rendered ONLY inside the
// open panel. Nothing in this file renders a badge/toast/count/dot on the
// grip, and the grip's own markup is IDENTICAL whether computeNudges()
// returns [] or not — there is no code path that reads nudges outside the
// open-panel branch.
const DOCK_FLOOR_PX = 120;

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
}

interface DisplayMessage {
  id: string;
  role: 'writer' | 'tutor';
  text: string;
}

export function Tutor({ entry, project, pageText, pageKind }: TutorProps) {
  const { t } = useDeskLexicon();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [docked, setDocked] = useState(false);
  const [showDisclosure, setShowDisclosure] = useState(false);
  const [composerText, setComposerText] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<'idle' | 'offline' | 'error'>('idle');
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
  const nudges = panelVisible ? computeNudges(entry.id) : [];

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

  const send = async () => {
    const text = composerText.trim();
    if (!text || sending) return;
    setComposerText('');
    setStatus('idle');
    setDeltaTruncated(false);
    // TU2 S2 — read the cursor BEFORE this send's own appendTutorMessage
    // call below (which, via its lastRead-preserving spread, wouldn't
    // disturb it anyway — but reading it first keeps the delta's
    // provenance obviously tied to "what the Tutor had read as of the
    // moment the writer hit send," not an incidental side effect of
    // append ordering).
    const lastRead = getJournalEntry(entry.id)?.tutor?.lastRead;
    const { delta, truncated } = assembleTutorDelta(pageText, lastRead);
    if (truncated) setDeltaTruncated(true);
    const writerMsg = { id: generateId(), role: 'writer' as const, text, at: new Date().toISOString() };
    appendTutorMessage(entry.id, writerMsg);
    setSending(true);
    const history = [...(getJournalEntry(entry.id)?.tutor?.messages ?? [])].map((m) => ({ role: m.role, text: m.text }));
    // TU5 S4 — assemble the Bible at send time only (never ambiently): read the
    // project's saved facts fresh and join them; absent when there are none, so
    // JSON.stringify drops the key and the wire stays byte-free of any bible.
    const bible = entry.projectId ? assembleBible(getBibleFacts(entry.projectId)) : null;
    const result = await apiTutorChat(history, delta ?? undefined, bible ?? undefined);
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
          <span className="wz-tutor-grip-glyph" aria-hidden="true">{open ? '›' : '‹'}</span>
        </button>
      </div>

      <div className={`desk-frame-tutor-panel-anchor desk-frame-tutor-panel-anchor--${pageKind} wz-tutor-zone`}>
        <div className="wz-tutor-panel" aria-hidden={!open} data-open={open ? 'true' : 'false'} data-docked={docked ? 'true' : 'false'}>
          {open && (
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
                {messages.length === 0
                  ? <div className="wz-tutor-empty">{t('tutorConversationEmpty')}</div>
                  : messages.map((m) => (
                      <div key={m.id} className={`wz-tutor-msg wz-tutor-msg-${m.role}`}>{m.text}</div>
                    ))}
              </div>
              {status === 'offline' && <div className="wz-tutor-convo-status">{t('tutorConversationOffline')}</div>}
              {status === 'error' && <div className="wz-tutor-convo-status">{t('tutorConversationError')}</div>}
              {sending && <div className="wz-tutor-convo-status">{t('tutorConversationSending')}</div>}
              {deltaTruncated && <div className="wz-tutor-convo-status">{t('tutorDeltaTruncated')}</div>}
              <div className="wz-tutor-convo-row">
                <input
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

            {/* FX10 S1 — the lenses + nudges now read as sections AROUND
                the conversation above, not the panel's own lead content —
                a single wrapper (a quiet top divider, index.css) is the
                whole demotion; no section here grows its own scrollbar
                (S1's "no scroll-within-scroll" applies just as much to
                these as to the conversation log). */}
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
              <div className="wz-tutor-obs">{structure?.linkedBeatName ?? t('tutorStructureNoBeat')}</div>
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

            <div className="wz-tutor-section">
              <div className="wz-tutor-h">{t('tutorNudgesTitle')}</div>
              {nudges.length === 0
                ? <div className="wz-tutor-empty">{t('tutorNudgesEmpty')}</div>
                : nudges.map((n) => <div key={n} className="wz-tutor-obs">{n}</div>)}
            </div>

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
            {/* TU5 S6 — v3 body (deskLexicon's tutorDisclosureBodyV3), not the
                v2/v1 strings it supersedes: the panel always shows
                CURRENT_DISCLOSURE_VERSION's own copy, never an older version's —
                see store/tutorDisclosure.ts's header comment for why a
                v1/v2-acknowledged device still sees this exactly once. */}
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
