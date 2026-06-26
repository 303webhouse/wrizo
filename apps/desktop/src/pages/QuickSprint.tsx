import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  clearDraft, createQuickSprintProject, flushNow, generateId, getDraft, getJournalEntry, getProject,
  getStoryPlanByProjectId, saveDraft, saveJournalEntry, saveSession, setBeatStatus, setCurrentBeat,
  setProjectSprintText,
} from '../store/persistence';
import type { JournalEntry } from '../types';
import { getFramework } from '../store/frameworks';
import { startAmbient, type AmbientHandle } from '../store/ambient';
import { pickEchoLine } from '../store/entryText';
import { ForwardOnlyEditor } from '../components/ForwardOnlyEditor';
import { useChromeFade, ChromeHandle } from '../components/WritingShell';

const DRAFT_KEY_PREFIX = 'writer-studio-quick-sprint-draft';
const AUTOSAVE_MS = 2000;
const SAVED_STAMP_MS = 2000;
const PRESETS = [5, 10, 20];
// Idle-nudge cadence (re-tuned): gaps SHORTEN as idle persists. First nudge at
// 3 min, second 2 min later, third 1 min after that — then it holds. The first
// two are ephemeral (dissolve after NUDGE_EPHEMERAL_MS); the third persists.
// Any keystroke resets the whole cycle to the 3-min countdown.
const NUDGE_GAP_1 = 180_000;       // 3 min idle → first nudge
const NUDGE_GAP_2 = 120_000;       // +2 min still idle → second
const NUDGE_GAP_3 = 60_000;        // +1 min still idle → third (holds)
const NUDGE_EPHEMERAL_MS = 10_000; // first two dissolve back out after 10s
const KEEP_GOING_SECONDS = 300;

// FIXME(home-port): this pool is CC's rewrite, NOT the canonical curated 25
// (4 registers). Reconcile to the canonical verbatim lines from the prototype /
// transcript (repo-claim 3). The cadence/mechanic below is pool-agnostic —
// swapping this array is the only change that reconciliation needs.
const NUDGES = [
  'Who wants what right now?',
  'What changes today if they fail?',
  'What risk are they avoiding?',
  'Use only concrete actions for the next paragraph.',
  'Cut one sentence and replace it with a sharper verb.',
  'What does your narrator notice that no one else would?',
  'Put something physical in their hands.',
  'What is the worst thing that could walk through the door right now?',
  'Say the thing the character will not say out loud.',
  'Write the next line as if no one will ever read it.',
  'What is the smallest detail that proves where we are?',
  'Let them be wrong about something.',
  'What are they pretending not to feel?',
  'Skip ahead to the part you actually want to write.',
  'Give the scene a sound.',
  'What would break this moment open?',
  'Whose turn is it to speak — and what do they want?',
  'Describe it the way a child would.',
  'What just changed that cannot change back?',
  'Trade one adjective for an action.',
  'What is at stake in the next sixty seconds?',
  'Let someone lie.',
  'What does the room smell like?',
  'Start the next sentence with a verb.',
  'What is the question this scene is really asking?',
];

function wordCount(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function getDraftKey(projectId?: string): string {
  return projectId ? `${DRAFT_KEY_PREFIX}-${projectId}` : DRAFT_KEY_PREFIX;
}

function reducedMotion(): boolean {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

interface FinishStats {
  words: number;
  minutes: number | null;
  byTimer: boolean;
}

export function QuickSprint() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const project = id ? getProject(id) : null;
  const draftId = id ?? 'scratch';

  // Beat → sprint bridge (A4)
  const plan = id ? getStoryPlanByProjectId(id) : null;
  const framework = plan ? getFramework(plan.frameworkId) : null;
  const currentBeat = framework?.beats.find(b => b.id === plan?.currentBeatId) || null;
  const currentBeatNote = plan?.beatNotes.find(bn => bn.beatId === plan?.currentBeatId) || null;

  const [presetMinutes, setPresetMinutes] = useState(10);
  const [showCustom, setShowCustom] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');
  const [totalSeconds, setTotalSeconds] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishStats, setFinishStats] = useState<FinishStats | null>(null);
  const [displayWords, setDisplayWords] = useState(0);
  const [draftText, setDraftText] = useState(() => {
    const draft = getDraft(draftId);
    if (draft) return draft.text;
    if (project?.sprintText) return project.sprintText;
    return localStorage.getItem(getDraftKey(id)) || '';
  });
  // Seed text for the forward-only editor — same resolution as draftText's
  // initializer, recomputed per surface so the editor (keyed by draftId)
  // re-seeds when the sprint surface changes.
  const seedText = useMemo(() => {
    const draft = getDraft(draftId);
    if (draft) return draft.text;
    const proj = id ? getProject(id) : null;
    if (proj?.sprintText) return proj.sprintText;
    return localStorage.getItem(getDraftKey(id)) || '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, draftId]);
  const [savedUntil, setSavedUntil] = useState<number | null>(null);
  const [currentNudge, setCurrentNudge] = useState('');
  const [nudgeShown, setNudgeShown] = useState(false); // opacity gate for the ephemeral dissolve
  const recentNudgeRef = useRef<number[]>([]); // recently-shown indices → avoid near repeats
  const nudgeTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]); // cadence + dissolve timers
  const [textareaFocused, setTextareaFocused] = useState(false);
  const [beatOpen, setBeatOpen] = useState(true);
  const [markBeatDone, setMarkBeatDone] = useState(false);
  const [soundOn, setSoundOn] = useState(false); // ambient sound bed (J5), off by default
  const [echoLine, setEchoLine] = useState<string | null>(null); // post-sprint echo (J7)

  // CW1 — chrome-fade / Middle Door. Driven by the editor's onForward (writing)
  // and global intent/idle signals. The editor, caret, and J5 warmth never fade.
  const { receded, noteForward, restore } = useChromeFade({ surface: 'sprint' });

  const surfaceRef = useRef<HTMLDivElement>(null);
  const ambientRef = useRef<AmbientHandle | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const draftTextRef = useRef(draftText);
  draftTextRef.current = draftText;
  const draftIdRef = useRef(draftId);
  draftIdRef.current = draftId;
  const lastSavedRef = useRef(draftText);
  const suppressFlushRef = useRef(false);
  const hasTypedRef = useRef(false);
  const sessionStartWordsRef = useRef(wordCount(draftText));
  const sprintStartMsRef = useRef<number | null>(null);
  const lastKeystrokeMsRef = useRef(0);
  // Session instrumentation (A9).
  const sessionStartedAtRef = useRef(new Date().toISOString());
  const firstKeystrokeAtRef = useRef<string | null>(null);
  // Journal entry committed for this sprint (J1). One entry per sprint: created
  // on the first completion, reused (text refreshed) if the sprint is extended
  // via "Keep going" and finished again — so a continuous sprint stays one entry.
  const journalEntryIdRef = useRef<string | null>(null);

  const markSaved = () => setSavedUntil(Date.now() + SAVED_STAMP_MS);

  // Persist the buffer if changed, then force pending writes to disk (A1).
  const flushDraft = () => {
    if (!suppressFlushRef.current) {
      const text = draftTextRef.current;
      if (text !== lastSavedRef.current) {
        saveDraft(draftIdRef.current, text);
        lastSavedRef.current = text;
      }
    }
    flushNow();
  };

  // Commit the current draft buffer to a permanent Journal entry (J1). Fired on
  // sprint completion, before any Save/Discard choice — so the words are kept
  // regardless of where the working copy goes (the Journal is the complete
  // record of every sprint). The volatile drafts buffer (A1) is left untouched;
  // this is an additive write. Empty text never produces an entry.
  const commitJournalEntry = () => {
    const text = draftTextRef.current;
    if (!text.trim()) return;
    const existingId = journalEntryIdRef.current;
    if (existingId) {
      const existing = getJournalEntry(existingId);
      if (existing) {
        saveJournalEntry({ ...existing, text }); // same createdAt; updatedAt restamped
        return;
      }
    }
    const now = new Date().toISOString();
    const entry: JournalEntry = {
      id: generateId(),
      text,
      projectId: id ?? null, // provenance at completion; never rewritten on save
      createdAt: now,
      updatedAt: now,
    };
    journalEntryIdRef.current = entry.id;
    saveJournalEntry(entry);
  };

  // Enter the finish moment. The textarea stays editable + focused behind the
  // card (A7) — never blurred or disabled, so no keystroke is lost at 0:00.
  // Both terminal paths (timer expiry and manual Finish) reach here, so this is
  // the single point that commits the sprint to the Journal (J1).
  const enterFinish = (byTimer: boolean) => {
    commitJournalEntry();
    ambientRef.current?.resolve(); // J5: settle the drift; any payoff is the finish moment (J7)
    setEchoLine(pickEchoLine(draftTextRef.current)); // J7: reflect one of the writer's own lines (or none)
    const words = Math.max(0, wordCount(draftTextRef.current) - sessionStartWordsRef.current);
    const minutes = sprintStartMsRef.current
      ? Math.max(1, Math.round((Date.now() - sprintStartMsRef.current) / 60000))
      : null;
    setFinishStats({ words, minutes, byTimer });
    setIsFinishing(true);
    setIsRunning(false);
  };

  // Timer tick.
  useEffect(() => {
    if (!isRunning || remainingSeconds === null) return;
    const tick = setInterval(() => {
      setRemainingSeconds(curr => (curr === null ? null : Math.max(0, curr - 1)));
    }, 1000);
    return () => clearInterval(tick);
  }, [isRunning, remainingSeconds]);

  // Timer reaches zero → finish card, but writing continues behind it (A7).
  useEffect(() => {
    if (isRunning && remainingSeconds === 0) {
      enterFinish(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds, isRunning]);

  // Count up the word total over the one 420ms finish moment.
  useEffect(() => {
    if (!isFinishing || !finishStats) return;
    if (reducedMotion()) {
      setDisplayWords(finishStats.words);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / 420);
      setDisplayWords(Math.round(p * finishStats.words));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [isFinishing, finishStats]);

  useEffect(() => {
    if (!savedUntil) return;
    const remaining = savedUntil - Date.now();
    if (remaining <= 0) {
      setSavedUntil(null);
      return;
    }
    const timeout = setTimeout(() => setSavedUntil(null), remaining);
    return () => clearTimeout(timeout);
  }, [savedUntil]);

  // Load the right buffer when the surface changes (A1).
  useEffect(() => {
    const draft = getDraft(draftId);
    const proj = id ? getProject(id) : null;
    const loaded = draft ? draft.text : (proj?.sprintText || localStorage.getItem(getDraftKey(id)) || '');
    setDraftText(loaded);
    lastSavedRef.current = loaded;
    sessionStartWordsRef.current = wordCount(loaded);
    suppressFlushRef.current = false;
  }, [id, draftId]);

  // Debounced autosave (A1).
  useEffect(() => {
    if (draftText === lastSavedRef.current) return;
    const handle = setTimeout(() => {
      saveDraft(draftId, draftText);
      lastSavedRef.current = draftText;
      markSaved();
    }, AUTOSAVE_MS);
    return () => clearTimeout(handle);
  }, [draftText, draftId]);

  // Flush on tab hide / route change (A1).
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flushDraft();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      flushDraft();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autofocus the page on mount (A8).
  useEffect(() => {
    editorRef.current?.focus();
  }, []);

  // Ambient felt-warmth drift (J5). Attaches to the writing surface; honors
  // reduced-motion internally (drift off, audio off). Torn down on unmount.
  useEffect(() => {
    if (!surfaceRef.current) return;
    const handle = startAmbient(surfaceRef.current);
    ambientRef.current = handle;
    return () => {
      handle.stop();
      ambientRef.current = null;
    };
  }, []);

  // Propagate the quiet sound toggle to the ambient bed (off by default).
  useEffect(() => {
    ambientRef.current?.setSoundEnabled(soundOn);
  }, [soundOn]);

  // Pick a prompt at random, avoiding the recently-shown ones so it doesn't
  // repeat within a session.
  const pickNudge = (): string => {
    const avoid = new Set(recentNudgeRef.current);
    const open = NUDGES.map((_, i) => i).filter(i => !avoid.has(i));
    const pool = open.length ? open : NUDGES.map((_, i) => i);
    const idx = pool[Math.floor(Math.random() * pool.length)];
    const recent = recentNudgeRef.current;
    recent.push(idx);
    if (recent.length > Math.min(NUDGES.length - 1, 12)) recent.shift();
    return NUDGES[idx];
  };

  const clearNudgeTimers = () => {
    nudgeTimersRef.current.forEach(clearTimeout);
    nudgeTimersRef.current = [];
  };

  // Surface one nudge. `held` → it persists (the third in the cadence, or the
  // manual button); otherwise it's ephemeral and dissolves after 10s.
  const showNudge = (held: boolean) => {
    setCurrentNudge(pickNudge());
    setNudgeShown(true);
    if (!held) {
      nudgeTimersRef.current.push(setTimeout(() => {
        setNudgeShown(false);                                                  // fade out
        nudgeTimersRef.current.push(setTimeout(() => setCurrentNudge(''), 320)); // then unmount
      }, NUDGE_EPHEMERAL_MS));
    }
  };

  // The re-tuned idle cadence (the §8 exception: nudges may surface on their own,
  // but only in the gaps). Resets on every keystroke (draftText change), so a
  // nudge only ever appears after real quiet — never mid-flow. Gaps shorten as
  // idle persists: 3 min → +2 min → +1 min, then the third holds. Reduced-motion
  // collapses the fades to instant via the global reset.
  useEffect(() => {
    if (!hasTypedRef.current) return;
    clearNudgeTimers();
    setNudgeShown(false);   // a keystroke dismisses any shown nudge (no-op re-render if already clear)
    setCurrentNudge('');
    const t = nudgeTimersRef.current;
    t.push(setTimeout(() => showNudge(false), NUDGE_GAP_1));                            // #1, ephemeral
    t.push(setTimeout(() => showNudge(false), NUDGE_GAP_1 + NUDGE_GAP_2));              // #2, ephemeral
    t.push(setTimeout(() => showNudge(true),  NUDGE_GAP_1 + NUDGE_GAP_2 + NUDGE_GAP_3)); // #3, holds
    return clearNudgeTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftText]);

  // Tidy timers on unmount.
  useEffect(() => clearNudgeTimers, []);

  const startTimer = (minutes: number) => {
    const secs = Math.round(minutes * 60);
    setPresetMinutes(minutes);
    setTotalSeconds(secs);
    setRemainingSeconds(secs);
    setIsRunning(true);
    setIsFinishing(false);
    setFinishStats(null);
    sprintStartMsRef.current = Date.now();
    sessionStartWordsRef.current = wordCount(draftTextRef.current);
    editorRef.current?.focus();
  };

  const handleCustomTimer = () => {
    const minutes = Number(customMinutes);
    if (!Number.isFinite(minutes) || minutes <= 0) return;
    startTimer(minutes);
    setShowCustom(false);
  };

  // The editor reports its derived text (unstruck spine prose) on every change —
  // strike included — and draftText mirrors it, so A1/J1/A9/finish/J7 keep
  // working off draftText unchanged.
  const handleEditorChange = (value: string) => setDraftText(value);
  // Forward keystrokes only (not strikes): the A8/A9 typing signals + J5 warmth.
  const handleForwardKeystroke = () => {
    hasTypedRef.current = true;
    if (firstKeystrokeAtRef.current === null) firstKeystrokeAtRef.current = new Date().toISOString();
    lastKeystrokeMsRef.current = Date.now();
    ambientRef.current?.noteKeystroke(); // J5: feed the felt-warmth drift
  };

  // Record a writing-session row on sprint save (A9). Returns the new id so the
  // Journal entry (J1) can be linked to its session.
  const recordSession = (projectId: string): string => {
    const now = new Date();
    const startedMs = new Date(sessionStartedAtRef.current).getTime();
    const sessionId = generateId();
    saveSession({
      id: sessionId,
      projectId,
      startedAt: sessionStartedAtRef.current,
      firstKeystrokeAt: firstKeystrokeAtRef.current,
      endedAt: now.toISOString(),
      words: Math.max(0, wordCount(draftTextRef.current) - sessionStartWordsRef.current),
      durationSec: Math.max(0, Math.round((now.getTime() - startedMs) / 1000)),
      updatedAt: now.toISOString(),
    });
    return sessionId;
  };

  // Back-link the Journal entry committed at finish (J1) to its session row,
  // when the sprint was saved. Provenance (projectId) is left as committed.
  const linkJournalSession = (sessionId: string) => {
    const entryId = journalEntryIdRef.current;
    if (!entryId) return;
    const entry = getJournalEntry(entryId);
    if (entry) saveJournalEntry({ ...entry, sessionId });
  };

  const handleSaveDraft = () => {
    saveDraft(draftId, draftText);
    lastSavedRef.current = draftText;
    if (id) setProjectSprintText(id, draftText);
    markSaved();
  };

  const handleGetNudge = () => showNudge(true); // on-demand → a held nudge until the next keystroke

  const handleKeepGoing = () => {
    setRemainingSeconds(s => (s ?? 0) + KEEP_GOING_SECONDS);
    setTotalSeconds(s => (s ?? 0) + KEEP_GOING_SECONDS);
    setIsRunning(true);
    setIsFinishing(false);
    setFinishStats(null);
    if (sprintStartMsRef.current === null) sprintStartMsRef.current = Date.now();
    editorRef.current?.focus();
  };

  const advanceBeatIfMarked = () => {
    if (!markBeatDone || !plan || !framework || !currentBeat) return;
    setBeatStatus(plan.id, currentBeat.id, 'complete');
    const beats = [...framework.beats].sort((a, b) => a.order - b.order);
    const idx = beats.findIndex(b => b.id === currentBeat.id);
    if (idx >= 0 && idx < beats.length - 1) {
      setCurrentBeat(plan.id, beats[idx + 1].id);
    }
  };

  const handleDiscard = () => {
    suppressFlushRef.current = true;
    // J1a: an explicit Discard overrides capture-by-default — soft-delete the
    // entry J1 committed at finish so the words truly leave the Journal.
    const entryId = journalEntryIdRef.current;
    if (entryId) {
      const entry = getJournalEntry(entryId);
      if (entry) saveJournalEntry({ ...entry, deletedAt: new Date().toISOString() });
    }
    clearDraft(draftId);
    localStorage.removeItem(getDraftKey(id));
    navigate(id ? `/project/${id}` : '/');
  };

  const handleSaveToProject = () => {
    suppressFlushRef.current = true;
    advanceBeatIfMarked();
    const projectId = id ?? createQuickSprintProject(draftText).id;
    if (id) setProjectSprintText(id, draftText);
    linkJournalSession(recordSession(projectId));
    clearDraft(draftId);
    localStorage.removeItem(getDraftKey(id));
    navigate(`/project/${projectId}`);
  };

  if (id && !project) {
    return <Navigate to="/" replace />;
  }

  const fillPct = totalSeconds && remainingSeconds !== null ? (remainingSeconds / totalSeconds) * 100 : 0;

  const pill = (active: boolean): React.CSSProperties => ({
    fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600,
    padding: '6px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
    border: `1px solid ${active ? 'var(--brass)' : 'var(--ink-border)'}`,
    background: active ? 'rgba(212,162,78,0.12)' : 'transparent',
    color: active ? 'var(--brass)' : 'var(--text-mid)',
  });

  return (
    <div className="page" data-chrome-receded={receded ? 'true' : 'false'} style={{ maxWidth: 820, paddingTop: '2.5rem' }}>
      {/* CW1: ever-present reveal handle so chrome is discoverable while receded. */}
      <ChromeHandle onReveal={restore} />
      {/* Top bar */}
      <div
        className="chrome-fade"
        style={{
          background: 'var(--ink-900)', borderRadius: 'var(--radius-md)',
          padding: '10px 16px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {PRESETS.map(m => (
            <button
              key={m}
              type="button"
              style={pill(presetMinutes === m && remainingSeconds !== null)}
              onClick={() => startTimer(m)}
            >
              {m} min
            </button>
          ))}
          <button type="button" style={pill(showCustom)} onClick={() => setShowCustom(v => !v)}>
            Custom
          </button>
          {showCustom && (
            <span style={{ display: 'inline-flex', gap: 6 }}>
              <input
                type="number"
                min={1}
                value={customMinutes}
                onChange={e => setCustomMinutes(e.target.value)}
                placeholder="min"
                style={{
                  width: 64, padding: '4px 8px', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--ink-border)', background: 'var(--ink-800)',
                  color: 'var(--text-hi)', fontFamily: 'var(--font-ui)',
                }}
              />
              <button type="button" className="btn-quiet" onClick={handleCustomTimer}>Set</button>
            </span>
          )}
          <button type="button" className="btn-quiet" onClick={handleGetNudge}>
            Take a nudge
          </button>
          <button
            type="button"
            className="btn-quiet sprint-sound-toggle"
            data-on={soundOn ? 'true' : 'false'}
            onClick={() => setSoundOn(v => !v)}
          >
            {soundOn ? 'Sound on' : 'Sound off'}
          </button>
        </div>
        {remainingSeconds !== null && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 32, lineHeight: 1, color: 'var(--text-hi)' }}>
            {formatClock(remainingSeconds)}
          </span>
        )}
      </div>
      {/* Timer hairline drains while running */}
      {remainingSeconds !== null && (
        <div className="hairline-timer chrome-fade" style={{ marginBottom: 16 }}>
          {/* idle = brass; warms to ember once the sprint is live (branding §4) */}
          <div className="hairline-timer__fill" style={{ width: `${fillPct}%`, background: isRunning ? 'var(--ember)' : undefined }} />
        </div>
      )}
      {remainingSeconds === null && <div style={{ height: 16 }} />}

      {/* Beat context strip (A4) */}
      {currentBeat && (
        <div className="chrome-fade" style={{
          border: '1px solid var(--ink-border)', borderRadius: 'var(--radius-md)',
          background: 'var(--ink-900)', padding: '12px 16px', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="eyebrow">DRAFTING · {currentBeat.name}</div>
            <button type="button" className="btn-quiet" onClick={() => setBeatOpen(o => !o)}>
              {beatOpen ? 'Hide' : 'Show'}
            </button>
          </div>
          {beatOpen && currentBeatNote && currentBeatNote.notes.length > 0 && (
            <ul style={{ margin: '8px 0 0', paddingLeft: 20, color: 'var(--text-mid)', fontSize: 14 }}>
              {currentBeatNote.notes.map((note, i) => (
                <li key={i} style={{ marginBottom: 2 }}>{note}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Nudge slip, tucked under the page's top edge. A surfaced nudge holds
          here (auto on idle or from the button); once the budget is spent it
          keeps the last one until the A6 reset returns the budget quietly. */}
      {currentNudge && (
        <div className="nudge-slip" data-shown={nudgeShown ? 'true' : 'false'} style={{ marginBottom: 12 }}>{currentNudge}</div>
      )}

      {/* The page */}
      <div
        ref={surfaceRef}
        className="paper-page"
        style={{
          maxWidth: '68ch', margin: '0 auto', minHeight: '60vh', position: 'relative',
          boxShadow: textareaFocused
            ? '0 0 0 1px rgba(243,237,225,0.10), 0 6px 40px rgba(212,162,78,0.18), 0 2px 12px rgba(0,0,0,0.45)'
            : 'var(--paper-glow)',
          transition: 'box-shadow var(--t-state) var(--ease)',
        }}
      >
        {/* Ambient warm overlay (J5): opacity drifts with --sprint-warmth, set
            continuously by the drift loop. Decorative, never interactive. */}
        <div
          aria-hidden="true"
          className="sprint-warmth-overlay"
          style={{
            position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
            borderRadius: 'var(--radius-md)', background: 'var(--ember)',
            opacity: 'calc(var(--sprint-warmth, 0) * var(--ambient-intensity))',
          }}
        />
        {/* CW2: the plain textarea is replaced by the reusable forward-only
            editor. It owns the sprint's in-memory fragment and reports derived
            prose up via onChange; draftText mirrors it, so every already-wired
            sprint feature keeps working untouched. Keyed by draftId so it
            re-seeds when the surface changes. */}
        <ForwardOnlyEditor
          key={draftId}
          ref={editorRef}
          initialText={seedText}
          onChange={handleEditorChange}
          onForward={() => { handleForwardKeystroke(); noteForward(); }}
          onFocus={() => setTextareaFocused(true)}
          onBlur={() => { setTextareaFocused(false); flushDraft(); }}
          placeholder="Write without stopping…"
          ariaLabel="Sprint writing surface"
          style={{
            position: 'relative', zIndex: 1,
            width: '100%', minHeight: '54vh', color: 'var(--ink-on-paper)',
            fontFamily: 'var(--font-prose)', fontSize: 17, lineHeight: 1.7,
          }}
        />
        <div className="chrome-fade" style={{
          position: 'absolute', bottom: 12, right: 16,
          fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink-on-paper-low)',
        }}>
          {wordCount(draftText)} words
        </div>
      </div>

      {/* Bottom bar (hidden during the finish moment so the card owns the brass) */}
      {!isFinishing && (
        <div
          className="sprint-bottombar chrome-fade"
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 16,
          }}
        >
          <span className={`saved-stamp${savedUntil ? '' : ' saved-stamp--hidden'}`}>Saved</span>
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" className="btn-quiet" onClick={handleSaveDraft}>Save</button>
            <button type="button" className="btn-brass" onClick={() => enterFinish(false)}>Finish</button>
          </div>
        </div>
      )}

      {/* Finish moment */}
      {isFinishing && finishStats && (
        <div
          className="card"
          style={{ marginTop: 16, animation: reducedMotion() ? undefined : 'finish-rise var(--t-moment) var(--ease)' }}
        >
          <div className="card-title">
            {finishStats.byTimer ? (
              'Time.'
            ) : (
              <><span style={{ color: 'var(--ember)' }}>{displayWords}</span> words down.</>
            )}
          </div>
          {finishStats.byTimer && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-mid)', marginTop: 4 }}>
              <span style={{ color: 'var(--ember)' }}>{displayWords}</span> words in {finishStats.minutes} minutes
            </div>
          )}

          {/* Post-sprint echo (J7): one of the writer's own lines, reflected
              back quietly. Skips gracefully when no substantial line exists. */}
          {echoLine && (
            <div className="sprint-echo" style={{ marginTop: 16 }}>
              <div className="eyebrow" style={{ marginBottom: 6 }}>YOU WROTE</div>
              <div className="sprint-echo-line" style={{ fontFamily: 'var(--font-prose)', fontStyle: 'italic', fontSize: 17, lineHeight: 1.5, color: 'var(--text-hi)' }}>
                “{echoLine}”
              </div>
            </div>
          )}

          {currentBeat && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '16px 0', color: 'var(--text-mid)', cursor: 'pointer' }}>
              <input type="checkbox" checked={markBeatDone} onChange={e => setMarkBeatDone(e.target.checked)} />
              Mark {currentBeat.name} done
            </label>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
            <button type="button" className="btn-brass" onClick={handleKeepGoing}>Keep going (+5 min)</button>
            <button type="button" className="btn-ghost" onClick={handleSaveToProject}>
              {id ? 'Save to project' : 'Save as project'}
            </button>
            <span style={{ flex: 1 }} />
            <button type="button" className="btn-brick" onClick={handleDiscard} style={{ marginLeft: 'var(--space-4)' }}>
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
