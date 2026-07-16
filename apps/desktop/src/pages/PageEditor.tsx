import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { flushNow, getDrawer, getJournalEntry, getProject, saveJournalEntry, patchJournalEntry } from '../store/persistence';
import { describePageHome } from '../store/pageHome';
import { firstLine } from '../store/entryText';
import { ForwardOnlyEditor, type EditorMode } from '../components/ForwardOnlyEditor';
import { ModeSwitcher } from '../components/ModeSwitcher';
import { ModeStage, PEN_INKS } from '../components/ModeStage';
import { useWarmStart } from '../components/useWarmStart';
import { useSessionLog } from '../components/useSessionLog';
import { useFirstLineInvite } from '../components/useFirstLineInvite';
import { useWayBack } from '../components/useWayBack';
import { setCaretOffset, getSelectionOffsets } from '../store/caretOffset';
import { projectMilestones } from '../store/milestones';
import { copyText } from '../store/clipboard';
import { BoardEditor } from '../components/BoardEditor';
import { ScriptEditor } from '../components/ScriptEditor';
import { useLexicon } from '../store/themeLexicon';
import { DeskFrame, useDeskFrameViewport } from '../components/DeskFrame';
import { ModeStrip } from '../components/ModeStrip';
import { Sliver, CAPTURE_ITEMS, type SliverContent } from '../components/Sliver';
import { GoalGlow } from '../components/GoalGlow';
import { Drawer } from '../components/Drawer';
import type { PageFaceSubject } from '../components/PageFace';
import { AddToSheet } from '../components/AddToSheet';
import { PortToBoardSheet } from '../components/PortToBoardSheet';
import { useForwardLock, setForwardLock } from '../store/forwardLock';
import { applyFormat, stripMarkdownConventions, type FormatAction } from '../store/draftFormat';
import { decorateEditorFor } from '../store/draftDecoration';
import { proseTextToScriptDoc, isProseEmpty } from '../store/structureConvert';
import { serializeScriptDoc } from '../store/scriptText';
import { getFirstRunComplete, setFirstRunComplete } from '../store/firstRun';
import { setFirstRunGateActive } from '../store/firstRunGateActive';
import { useMonotonicWordCount, FirstRunVeil, FirstRunGateBanner, FirstRunGlow } from '../components/FirstRunGate';
import { UnlockCeremony } from '../components/UnlockCeremony';
import type { ThemeId } from '../store/theme';

// HB1 F1 — the gate's fixed instrument: 100 whitespace-delimited words.
const FIRST_RUN_WORD_TARGET = 100;

// B1 Slice 3 — the manuscript page editor. A binder Page (a JournalEntry with
// projectId set) opens in the mode-aware editor (Free write / Draft / Format),
// operating on the PAGE's text — never the project's single `sprintText` body.
// This is what makes "write a book" work without touching the legacy body-vs-page
// debt: new Books/Stories live entirely as project + chapter Pages.
//
// The mode-aware editor (ModeStage + ForwardOnlyEditor) is generic — it takes
// initialText + reports clean derived text up — so the page just autosaves that
// to entry.text. Switching modes re-seeds with the current CLEAN text (struck
// runs excluded), exactly as the sprint surface does.

const AUTOSAVE_MS = 2000;

function wordCount(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

function PageEditorView({ id }: { id: string }) {
  const navigate = useNavigate();
  const { t: lex, tMany: lexMany } = useLexicon();
  // AB1 S1 — DeskFrame owns the viewport at >=1100px only; below that this
  // component's legacy JSX (byte-identical to pre-AB1) renders instead. See
  // docs/wrizo-alpha/ab1-shell-inventory.md.
  const framed = useDeskFrameViewport();
  const entry = getJournalEntry(id);
  const project = entry?.projectId ? getProject(entry.projectId) : null;
  const drawer = project?.drawerId ? getDrawer(project.drawerId) : null;
  // M1 — null on any plan-less project (Journal pages never reach this
  // surface at all); ModeStage silently degrades Progress:Project to Words
  // when this is null, per the canon's no-greyed-states rule.
  const milestones = projectMilestones(id);

  // Per-page last-used mode. Default: a manuscript chapter opens in Free
  // write (forward-only generation); other untyped support pages open in
  // Draft (free edit). CD1 S8 (A7) — a LOOSE-origin page (the Desk's
  // start-writing/home-base door, origin==='loose' only — no pageType is
  // ever stamped there) ALSO opens in Free Write, matching the front-door
  // posture; this is deliberately narrower than "any untyped page" — a
  // filed-but-untyped support page (origin 'journal'/'project'/null) still
  // opens in Draft, unchanged.
  const modeKey = `wrizo-mode-page-${id}`;
  const [mode, setMode] = useState<EditorMode>(() => {
    const saved = localStorage.getItem(modeKey);
    if (saved === 'journal' || saved === 'drafting') return saved;
    return entry?.pageType === 'manuscript' || entry?.origin === 'loose' ? 'journal' : 'drafting';
  });

  const initialText = entry?.text ?? '';
  const [text, setText] = useState(initialText);
  const [modeSeed, setModeSeed] = useState(initialText);
  const [receded, setReceded] = useState(false);
  const [focused, setFocused] = useState(false);
  const [showPublish, setShowPublish] = useState(false); // Publish stub dialog (matches QuickSprint)
  // AB2 S2 — ink color, lifted out of ModeStage so the sliver (CD1:
  // components/Sliver.tsx, a DeskFrame sibling) can control it; ModeStage
  // falls back to its own internal state when this isn't passed
  // (unframed/below-the-gate, untouched).
  const [penColor, setPenColor] = useState(PEN_INKS[0]);
  const forwardLock = useForwardLock();
  // AB2 S4 — the Structure picker's one-time confirmation (prose page with
  // words -> screenplay). Switching an empty page is free (no modal).
  const [structureConfirm, setStructureConfirm] = useState(false);
  // AB3 S2 — the Page face's sending verbs. Genuinely new capability here
  // (PageEditor never had Move/Copy or Port-to-Board before this ticket —
  // "everything about a page" now includes typed/filed pages too, not just
  // the Journal's own authored surface).
  const [portOpen, setPortOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const textRef = useRef(text);
  textRef.current = text;
  const lastSavedRef = useRef(initialText);
  const editorRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // Warm start (F2) — captured once at mount (the hook strips the one-shot state).
  const location = useLocation();
  const warmRef = useRef(!!(location.state as { warmStart?: boolean } | null)?.warmStart);
  const warmWrapRef = useRef<HTMLDivElement>(null);
  const warm = useWarmStart(warmRef.current, editorRef, warmWrapRef);

  // HB1 S2/S3 — the first-run gate. Captured once at mount, the exact same
  // one-shot-navigation-state pattern as warmRef above (components/
  // Arrival.tsx's Write door sets this only on the page it just created,
  // only during first run) — never re-armed by a later reload of this same
  // page (location.state doesn't survive a reload; F3 rules that as an
  // accepted edge case, not a resume feature this ticket builds) and never
  // true on any OTHER page. F4 — framed (>=1100px) only; below the gate the
  // ref may be true but nothing ever reads it (legacy JSX stays untouched).
  const firstRunGateRequested = useRef(
    !!(location.state as { firstRunGate?: boolean } | null)?.firstRunGate && !getFirstRunComplete(),
  );
  const [gateUnlocked, setGateUnlocked] = useState(false);
  const gateActive = framed && firstRunGateRequested.current && !gateUnlocked;
  const gateWords = useMonotonicWordCount(text, gateActive);
  const gateReached = gateActive && gateWords >= FIRST_RUN_WORD_TARGET;

  useEffect(() => {
    setFirstRunGateActive(gateActive);
    return () => setFirstRunGateActive(false);
  }, [gateActive]);

  const handleChooseTheme = (themeId: ThemeId) => {
    void themeId; // setTheme already applied by UnlockCeremony itself
    setFirstRunComplete(true);
    setGateUnlocked(true);
  };

  // F5 — TTFK session for this chapter/support page. projectId carries the binder;
  // firstKeystroke rides the same onForward seam as the warm release below.
  const noteSessionKeystroke = useSessionLog('page', {
    projectId: () => entry?.projectId ?? null,
    words: () => wordCount(textRef.current),
  });

  // F6 — the first-line invitation on a truly empty page (entry.text.length === 0).
  const invite = useFirstLineInvite(() => textRef.current.length === 0);

  // W2 — the way back. Scroll lives on ModeStage's internal .mode-scroll box
  // (surfaceRef is the .mode-page ancestor the host already owns); caret
  // lives on the ForwardOnlyEditor host div (editorRef). Mode itself is
  // already restored independently via the per-page localStorage key above —
  // this hook doesn't need to touch it.
  useWayBack({
    entryId: id,
    mode,
    scrollEl: () => surfaceRef.current?.querySelector<HTMLElement>('.mode-scroll') ?? null,
    editorEl: () => editorRef.current,
    applyScrollY: y => { const el = surfaceRef.current?.querySelector<HTMLElement>('.mode-scroll'); if (el) el.scrollTop = y; },
    applyCaret: offset => { if (editorRef.current) setCaretOffset(editorRef.current, offset); },
  });

  const switchMode = (next: EditorMode) => {
    if (next === mode) return;
    setModeSeed(textRef.current); // carry the current clean text into the new mode
    setMode(next);
    localStorage.setItem(modeKey, next);
  };

  // Persist the page text to its JournalEntry (debounced), merging the latest
  // record so other metadata is never clobbered.
  const flush = () => {
    const latest = getJournalEntry(id);
    if (latest && latest.text !== textRef.current) {
      saveJournalEntry({ ...latest, text: textRef.current });
      lastSavedRef.current = textRef.current;
    }
  };

  useEffect(() => {
    if (text === lastSavedRef.current) return;
    const h = setTimeout(flush, AUTOSAVE_MS);
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, id]);

  // Flush on tab hide / unmount.
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') { flush(); flushNow(); } };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      flush();
      flushNow();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!entry) return <Navigate to="/" replace />;

  // Exit lands where the page lives: its binder, the Shelf if shelved, else
  // the Journal (F2 papercut — a shelved typed page returned to /journal
  // before). AB3 — a loose-origin page (the Desk's home-base door) homes
  // NOWHERE, not the Journal (it was never nudged there) — Done returns to
  // the Desk instead.
  const backTo = project ? `/project/${project.id}` : entry.shelved ? '/shelf' : entry.origin === 'loose' ? '/' : '/journal';
  const pageTitle = text.trim() ? firstLine(text).slice(0, 40) : 'Untitled';

  // AB3 S2 — star/tag mutations, new capability on this surface (mirrors
  // JournalEntry.tsx's own patch-based closures, now shared via
  // patchJournalEntry so both hosts can't drift on the "merge live text"
  // discipline).
  const toggleStar = () => { patchJournalEntry(id, textRef.current, { starred: !entry.starred }); flushNow(); };
  const addTag = (tag: string) => {
    const tags = entry.tags ?? [];
    if (!tags.includes(tag)) patchJournalEntry(id, textRef.current, { tags: [...tags, tag] });
    flushNow();
  };
  const removeTag = (tag: string) => {
    patchJournalEntry(id, textRef.current, { tags: (entry.tags ?? []).filter(t => t !== tag) });
    flushNow();
  };

  // AB3 S2 — the Page face's subject (canon amendment A1). `entry` here is
  // the render-time snapshot (re-fetched on every getJournalEntry(id) call
  // elsewhere in this component); star/tag edits above trigger the same
  // persistence-change re-render every other write in this app already
  // relies on (App.tsx's reactive-screens subscription), so the face reads
  // fresh values on the next render without any extra plumbing here.
  const { homeLabel, memberships } = describePageHome(entry, project);
  const pageFaceSubject: PageFaceSubject = {
    kind: 'page',
    entry,
    homeLabel,
    memberships,
    footer: entry.projectId == null ? 'Saved automatically — even if you never file it to a Drawer or the Shelf.' : undefined,
    onToggleStar: toggleStar,
    onAddTag: addTag,
    onRemoveTag: removeTag,
    onOpenMoveCopy: () => setAddOpen(true),
    onOpenPortToBoard: () => setPortOpen(true),
  };

  // The editor's own render-prop body — identical between the legacy and the
  // AB1-framed ModeStage instance, factored out so the two branches below
  // can't drift.
  const editorBody = ({ noteWrite, penColor }: { noteWrite: () => void; penColor?: string }) => (
    <div ref={warmWrapRef} style={{ position: 'relative', width: '100%', minHeight: '100%' }}>
      <ForwardOnlyEditor
        key={`${id}-${mode}`}
        ref={editorRef}
        initialText={modeSeed}
        mode={mode}
        autoFocus={initialText.trim() === ''}
        onChange={setText}
        onForward={() => { noteWrite(); warm.release(); noteSessionKeystroke(); invite.dismiss(); }}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); flush(); }}
        placeholder={invite.visible ? '' : 'Write…'}
        ariaLabel="Page writing surface"
        penColor={penColor}
        forwardLock={mode === 'journal' ? forwardLock : true}
        style={{
          width: '100%', minHeight: '100%', color: 'var(--ink-on-paper)',
          fontFamily: 'var(--font-prose)', fontSize: 17, lineHeight: 1.7,
        }}
      />
      {invite.node}
      {warm.rect && (
        <div
          aria-hidden="true"
          className={`wz-warm${warm.settled ? ' wz-warm--settled' : ''}`}
          style={{ position: 'absolute', top: warm.rect.top, left: warm.rect.left, width: warm.rect.width, height: warm.rect.height }}
        />
      )}
    </div>
  );

  // AB2 S3 — the rail's Bold/Italic/Heading/Spacing tools, operating on
  // entry.text directly (S0's ruling: markdown conventions, no separate
  // rich-text state). Reads the editor's current selection via the SAME
  // linear-offset technique the rest of this codebase uses for caret math
  // (store/caretOffset.ts), applies the transform (store/draftFormat.ts),
  // then imperatively re-decorates the DOM through the SAME guarded helper
  // ForwardOnlyEditor's own native listener uses on every keystroke
  // (store/draftDecoration.ts's decorateEditorFor) — not a bare
  // `el.innerHTML = decorateMarkdown(...)`, which would reintroduce the
  // Chromium trailing-newline-at-EOF caret quirk that helper guards against
  // (reachable here too: Spacing at the very end of the page inserts a
  // trailing blank line, landing the caret exactly in that state) — so a
  // rail click and a keystroke leave the surface in the identical state.
  const applyRailFormat = (action: FormatAction) => {
    const el = editorRef.current;
    if (!el || mode !== 'drafting') return;
    el.focus();
    const sel = getSelectionOffsets(el) ?? { start: textRef.current.length, end: textRef.current.length };
    const result = applyFormat(textRef.current, sel.start, sel.end, action);
    setText(result.text);
    decorateEditorFor(el, result.text, result.start, setCaretOffset);
  };

  // AB2 S4 — the Structure picker. Prose -> Screenplay: free on an empty
  // page, one plain confirmation otherwise (mechanical mapping only, no AI —
  // store/structureConvert.ts). Screenplay -> Prose has no code path here
  // (this surface only ever renders prose); ScriptEditor.tsx owns that
  // direction's one-way warning.
  const convertToScreenplay = () => {
    const latest = getJournalEntry(id);
    if (!latest) return;
    const doc = proseTextToScriptDoc(latest.text);
    saveJournalEntry({ ...latest, pageType: 'script', script: doc, text: serializeScriptDoc(doc) });
  };
  const requestScreenplay = () => {
    flush(); flushNow();
    const latest = getJournalEntry(id);
    if (!latest) return;
    if (isProseEmpty(latest.text)) { convertToScreenplay(); return; }
    setStructureConfirm(true);
  };
  const onSwitchStructure = (next: 'prose' | 'screenplay') => {
    if (next === 'prose') return; // already prose — nothing to do on this surface
    requestScreenplay();
  };

  // AB3 S4 — Journal furniture (ink/capture items) stays conditional on the
  // page's ORIGIN, not the editor's Free-Write MODE alone: a project- or
  // loose-origin page in Free Write mode gets none of it — only a
  // journal-origin page does. Canon amendment A2 (the grandfather clause): a
  // null-origin row (every page that existed before this ticket) behaves
  // EXACTLY as today, where mode alone decided it — so null reads as
  // "journal-equivalent" here, and only an EXPLICIT non-journal origin
  // ('project' | 'loose') suppresses the furniture.
  //
  // FX1 S3 (Nick's first-sitting verdict, provisional canon note) — the
  // forward lock SPLITS off this gate: it belongs to Free Write the
  // POSTURE, not the Journal the PLACE, so it now mounts on every page's
  // Free Write rail regardless of origin. Ink and capture items are
  // unchanged — still journal furniture, still origin-gated. This amends
  // Law 2's furniture list in practice (forward lock is mode furniture, not
  // journal furniture) pending Nick's feel-test and the committee pass's
  // formal canon-doc amendment; the canon doc itself is untouched this
  // ticket. The MECHANIC (ForwardOnlyEditor's `forwardLock` prop below) was
  // never origin-gated — only this rail control was — so no change was
  // needed there for loose/project pages to actually strike/erase per the
  // persisted setting.
  const journalFurniture = entry.origin == null || entry.origin === 'journal';

  const sliverContent: SliverContent = !framed
    ? { kind: 'empty' }
    : mode === 'journal'
      ? {
          kind: 'freewrite',
          ink: journalFurniture ? { penColor, inks: PEN_INKS, onChoosePen: setPenColor } : undefined,
          forwardLock: { on: forwardLock, onToggle: setForwardLock },
          captureItems: journalFurniture ? CAPTURE_ITEMS : [],
        }
      : {
          kind: 'draft',
          structure: 'prose',
          onSwitchStructure,
          format: { onFormat: applyRailFormat },
        };

  const structureConfirmDialog = structureConfirm && (
    <div className="sprint-modal-backdrop structure-confirm-modal" onClick={() => setStructureConfirm(false)}>
      <div className="sprint-modal card" role="dialog" aria-label="Convert to Screenplay" onClick={e => e.stopPropagation()}>
        <div className="card-title">Convert to Screenplay?</div>
        <p style={{ color: 'var(--text-mid)', fontSize: 14, margin: '8px 0 16px' }}>
          Each paragraph becomes an action line in a fresh script. Mechanical only — no AI — your words move verbatim.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn-quiet" onClick={() => setStructureConfirm(false)}>Cancel</button>
          <button
            type="button"
            className="btn-brass structure-confirm-screenplay"
            onClick={() => { setStructureConfirm(false); convertToScreenplay(); }}
          >
            Convert
          </button>
        </div>
      </div>
    </div>
  );

  const publishDialog = showPublish && (
    <div className="sprint-modal-backdrop" onClick={() => setShowPublish(false)}>
      <div className="sprint-modal card" role="dialog" aria-label={lex('publish')} onClick={e => e.stopPropagation()}>
        <div className="card-title">{lex('publish')}</div>
        <p style={{ color: 'var(--text-mid)', fontSize: 14, margin: '8px 0 16px' }}>
          Publishing options — tailored to this work's type, destination, and format — are coming soon.
        </p>
        {/* AB2 S5 — copy-out comes home to Publish (findings 2/3 of record die
            here). "Copy My Words" strips the markdown conventions back to
            honest plain text; "Copy Formatted" copies entry.text as stored —
            the conventions travel, markdown is the portable format. */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button type="button" className="btn-quiet publish-copy-words" onClick={() => copyText(stripMarkdownConventions(textRef.current))}>Copy My Words</button>
          <button type="button" className="btn-quiet publish-copy-formatted" onClick={() => copyText(textRef.current)}>Copy Formatted</button>
        </div>
        <button type="button" className="btn-quiet" onClick={() => setShowPublish(false)}>Close</button>
      </div>
    </div>
  );

  // AB3 S2 — the Page face's sending verbs, mounted once here (framed only —
  // the legacy/unframed branch below the gate stays byte-identical, no Page
  // face there).
  const pageFaceSheets = (
    <>
      {portOpen && <PortToBoardSheet sourceIds={[entry.id]} onClose={() => setPortOpen(false)} />}
      {addOpen && (
        <AddToSheet
          sourceIds={[entry.id]}
          onClose={() => setAddOpen(false)}
          onDone={() => setAddOpen(false)}
        />
      )}
    </>
  );

  // CD1 S1 — the framed (>=1100px) composition. The mode strip moves up
  // into this header row (left-set, engraved register via its own CSS);
  // the top-bar title retires (the crumb/breadcrumb it duplicated — the
  // Page face already carries the same title + "where it lives" chain via
  // describePageHome, S3). "Copy page text" already left top chrome
  // entirely in AB1/AB2 (S4) — its future home is a later ticket's Publish
  // surface.
  //
  // cd1.1 (Fable review erratum) — S1's brief read "Done alone" as scrapping
  // the Pages/Plan toggle too; that was Fable's own defect, not the build's.
  // "Done alone" meant no title and no Catch, never no doorways — the
  // toggle belongs beside Done here (and on ScriptEditor's own framed
  // header, which never had one before this ticket).
  if (framed) {
    return (
      <div ref={pageRef} className="desk-frame-host" data-chrome-receded={receded ? 'true' : 'false'}>
        <FirstRunVeil active={gateActive}>
          <div className="chrome-fade chrome-top sprint-nav">
            <ModeStrip mode={mode} onSwitch={switchMode} onPublish={() => setShowPublish(true)} />
            <div className="sprint-actions">
              {project && (
                <div className="sprint-toggle" role="tablist" aria-label={`${lex('binder')} view`}>
                  <button type="button" role="tab" aria-selected="true" className="sprint-toggle-btn active" onClick={() => { flush(); flushNow(); navigate(`/project/${project.id}`); }}>{lexMany('page')}</button>
                  <button type="button" role="tab" aria-selected="false" className="sprint-toggle-btn" onClick={() => { flush(); flushNow(); navigate(`/project/${project.id}/board`); }}>{lex('plan')}</button>
                </div>
              )}
              <button type="button" className="btn-quiet" onClick={() => { flush(); flushNow(); navigate(backTo); }}>Done</button>
            </div>
          </div>
        </FirstRunVeil>

        <div style={{ height: 16 }} />

        <DeskFrame
          pageKind="prose"
          toolRail={<FirstRunVeil active={gateActive}><Drawer subject={pageFaceSubject} /></FirstRunVeil>}
          sliver={<FirstRunVeil active={gateActive}><Sliver content={sliverContent} goalText={text} /></FirstRunVeil>}
          // HB1 S3 — the SAME progress-fraction seam GoalGlow already
          // defines (FirstRunGate.tsx's FirstRunGlow mirrors its rendering
          // contract exactly), fed the gate's own word fraction instead of
          // GoalGlow's line-equivalents one while the gate holds; the real
          // GoalGlow resumes the instant it doesn't (it renders nothing
          // anyway, absent a writer-set goal — first run never sets one).
          goalGlow={(gateActive || gateReached)
            ? <FirstRunGlow fraction={gateWords / FIRST_RUN_WORD_TARGET} />
            : <GoalGlow text={text} />}
          dissolved={receded}
        >
          <ModeStage
            mode={mode}
            words={wordCount(text)}
            surfaceRef={surfaceRef}
            focused={focused}
            onDissolveChange={setReceded}
            chromeRootRef={pageRef}
            milestones={milestones}
            penColor={penColor}
            framed
          >
            {editorBody}
          </ModeStage>
        </DeskFrame>

        {gateActive && <FirstRunGateBanner words={gateWords} target={FIRST_RUN_WORD_TARGET} />}
        {gateReached && <UnlockCeremony onChoose={handleChooseTheme} />}

        {publishDialog}
        {structureConfirmDialog}
        {pageFaceSheets}
      </div>
    );
  }

  return (
    <div ref={pageRef} className="page" data-chrome-receded={receded ? 'true' : 'false'} style={{ maxWidth: 1100, paddingTop: '2.5rem' }}>
      <div className="chrome-fade chrome-top sprint-nav">
        <div className="sprint-crumb" aria-label="Location">
          {drawer && <><span className="crumb-item">{drawer.name}</span><span className="crumb-sep">/</span></>}
          {project && <><span className="crumb-item">{project.title}</span><span className="crumb-sep">/</span></>}
          <span className="crumb-here">{pageTitle}</span>
          {entry.importedAt && <span className="page-imported-tag" title={`Imported into this ${lex('binder').toLowerCase()}`}>Imported</span>}
        </div>

        <ModeSwitcher
          mode={mode}
          onSwitch={switchMode}
          actions={[
            { label: 'Workshop', sub: 'coming soon', deferred: true },
            { label: lex('publish'), sub: 'export', onClick: () => setShowPublish(true) },
          ]}
        />

        <div className="sprint-actions">
          {project && (
            <div className="sprint-toggle" role="tablist" aria-label={`${lex('binder')} view`}>
              <button type="button" role="tab" aria-selected="true" className="sprint-toggle-btn active" onClick={() => { flush(); flushNow(); navigate(`/project/${project.id}`); }}>{lexMany('page')}</button>
              <button type="button" role="tab" aria-selected="false" className="sprint-toggle-btn" onClick={() => { flush(); flushNow(); navigate(`/project/${project.id}/board`); }}>{lex('plan')}</button>
            </div>
          )}
          <button type="button" className="btn-quiet page-copy" onClick={() => copyText(textRef.current)} title={`Copy the clean ${lex('page').toLowerCase()} text`}>Copy {lex('page').toLowerCase()} text</button>
          <button type="button" className="btn-quiet" onClick={() => { flush(); flushNow(); navigate(backTo); }}>Done</button>
        </div>
      </div>

      <div style={{ height: 16 }} />

      <ModeStage
        mode={mode}
        words={wordCount(text)}
        surfaceRef={surfaceRef}
        focused={focused}
        onDissolveChange={setReceded}
        chromeRootRef={pageRef}
        milestones={milestones}
      >
        {editorBody}
      </ModeStage>

      {publishDialog}
    </div>
  );
}

// Key by id so per-page refs/state re-seed cleanly on page→page navigation.
// J4 — /page/:id stays the one typed-page route; a pageType:'board' entry
// delegates to the BoardEditor here, before either component's hooks run.
// S1 — pageType:'script' delegates to ScriptEditor the same way. Below
// AB1's 1100px gate this is still Draft law only: neither delegate mounts
// ModeSwitcher/ModeStage there (a Board is Trellis-side by design; a script
// page ships Draft-only). At >=1100px each delegate owns its own DeskFrame
// instead (AB1 S1/S2) — Board still never gets a mode strip; Script does
// (Draft live, Free Write/Revise/Workshop deferred — script Free-write
// itself is still AB2).
export function PageEditor() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/" replace />;
  const entry = getJournalEntry(id);
  if (entry?.pageType === 'board') return <BoardEditor key={id} id={id} />;
  if (entry?.pageType === 'script') return <ScriptEditor key={id} id={id} />;
  return <PageEditorView key={id} id={id} />;
}
