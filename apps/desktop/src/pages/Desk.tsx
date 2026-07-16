import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBinderPages, createLooseHomePage } from '../store/persistence';
import { firstLine } from '../store/entryText';
import { getResumeTarget, relativeDays } from '../store/resume';
import { describeTarget } from '../store/resumeVocab';
import { markDeskOpened } from '../store/sessionLog';
import { deskOwnerName } from '../store/currentUser';
import { DrawersTree } from '../components/DrawersTree';
import { useCatch } from '../components/useCatch';

// PARKED — HB1, 2026-07-16 (docs/wrizo-alpha/hb1-threshold-brief.md, flow
// §6: "The Desk room dies... Route / no longer renders it anywhere.").
// App.tsx no longer imports this component; components/Arrival.tsx is
// route '/' now. Park, don't delete (house law) — kept intact, unreachable
// from any UI. ReturnCard's resume-pointer logic is NOT orphaned: S5 rehomed
// it into Arrival's Open door (getResumeTarget/warmStart, same as here).
// Begin Project / Start writing rehomed onto Arrival's own doors + the
// Drawer's Places faces (already the AB3-era interim home for the recents/
// Shelf glance — DrawersTree below was already redundant with it before
// this ticket). CUSTOMIZE_TIP's premise (themes "unlock at writing
// milestones") is superseded by HB1's actual mechanic (the one-time 100-
// word threshold, not a recurring milestone) — left as-is, parked with the
// rest of this file, not rewritten for a component that no longer renders.
//
// Original header comment, preserved below for context:
// The Desk — the authed home (B4). Answers one question (what now?): a single
// primary action, a quiet glance at recent drawers + On the Shelf below, and the
// create entry. The left rail owns navigation, so the home no longer duplicates
// it. The logo is a single app-wide element (App.BrandMark), full opacity here.
//
// F2 — when there's recent work, the primary block becomes the RETURN CARD: a
// mirror of the writer's own last sentence, rendered only from the typed resume
// pointer (F1). No target → the plain "Start something" primary, unchanged.

const CUSTOMIZE_TIP =
  'Color themes and AI writing help unlock at writing milestones — and never expire.';

export function Desk() {
  const navigate = useNavigate();
  const doCatch = useCatch();
  const resume = getResumeTarget();

  // F5 Slice 2 — stamp the Desk→ink funnel origin. The next session that records
  // (page or authored journal) consumes it; the Desk renders nothing new.
  useEffect(() => { markDeskOpened(); }, []);

  return (
    <div className="wz-home">
      <div className="wz-ambient" style={{ opacity: 0.5 }} />

      <section className="wz-desk">
        <header className="wz-deskhead">
          <span className="wz-deskname">{deskOwnerName()}’s</span>
          <img className="wz-desktitle-img" src="/brand/writing-desk-title.png" alt="Writing Desk" />
        </header>
        <p className="wz-desksub">Scribble, draft, plot, revise, or share (coming soon)</p>

        {resume ? <ReturnCard /> : (
          <button type="button" className="wz-btn wz-primary" onClick={() => navigate('/project/new')}>Start something</button>
        )}

        <div className="wz-secondary">
          <button type="button" className="wz-catch" onClick={doCatch}>
            ＋ Catch a thought<span className="wz-kbd" aria-hidden="true">N</span>
          </button>
          <span className="wz-dot">·</span>
          <span className="wz-link" onClick={() => navigate('/project/new')}>Begin project</span>
          <span className="wz-dot">·</span>
          {/* AB3 S4 — the Desk's start-writing / home-base door: a blank page
              with no project and no Journal membership. `loose` is a
              legitimate PERMANENT home (the canon's "loose forever" clause)
              — starting here never files it, and this link never nudges it
              anywhere (anti-solicitation). */}
          <span
            className="wz-link wz-start-writing"
            onClick={() => { const page = createLooseHomePage(); navigate(`/page/${page.id}`); }}
          >
            Start writing
          </span>
        </div>

        {/* A quiet glance at recent drawers + On the Shelf (the rail owns the rest). */}
        <div className="wz-drawers">
          <DrawersTree />
        </div>

        <div className="wz-customize" tabIndex={0}>
          <span className="wz-cust-link">Customize</span>
          <div className="wz-tip"><b>Earned as you write.</b><br />{CUSTOMIZE_TIP}</div>
        </div>
      </section>
    </div>
  );
}

// The return card — pick-up-where-you-left-off, rendered purely from the typed
// pointer + its vocabulary. Orange lands only on the action and the tag.
function ReturnCard() {
  const navigate = useNavigate();
  const target = getResumeTarget();
  if (!target) return null;
  const vocab = describeTarget(target);

  // Fallback for a blank page (no last line): the page/project title, never empty
  // (F5 drive-by — an all-deleted page rendered an empty quote).
  const fallbackTitle = (target.entry ? firstLine(target.entry.text) : target.project?.title) || 'Untitled';
  const line = target.lastLine ? `“${target.lastLine}”` : fallbackTitle;

  // Bold the writer-meaningful crumb piece: the project (binder) or the page label.
  const boldIdx = target.entry && target.home === 'binder' ? vocab.crumb.length - 2 : vocab.crumb.length - 1;

  // Structural link: a support page (non-manuscript) offers a one-tap route back
  // to the binder's manuscript — a fact of the binder, never a prediction. Omit
  // when the binder has no manuscript page.
  let manuscriptLink: { route: string; title: string } | null = null;
  if (target.home === 'binder' && target.pageType && target.pageType !== 'manuscript' && target.project) {
    const ms = getBinderPages(target.project.id).find(p => p.pageType === 'manuscript');
    if (ms) manuscriptLink = { route: `/page/${ms.id}`, title: firstLine(ms.text).slice(0, 40) };
  }

  const keepWriting = () => navigate(target.route, { state: { warmStart: true } });

  return (
    <div className="wz-return">
      <div className="wz-return-top">
        <span className="wz-return-eyebrow">PICK UP WHERE YOU LEFT OFF</span>
        <span className="wz-return-tag">{vocab.tag}</span>
      </div>
      <div className="wz-return-crumb">
        {vocab.crumb.map((piece, i) => (
          <span key={i}>
            {i > 0 && <span className="wz-return-sep"> / </span>}
            {i === boldIdx ? <b>{piece}</b> : piece}
          </span>
        ))}
      </div>
      <div className="wz-return-line">{line}</div>
      <div className="wz-return-row">
        <span className="wz-return-when">{relativeDays(target.daysAgo)}</span>
        <button type="button" className="wz-btn wz-primary wz-return-go" onClick={keepWriting}>Keep writing</button>
      </div>
      <div className="wz-return-alt">
        {manuscriptLink ? (
          <button type="button" className="wz-return-altlink" onClick={() => navigate(manuscriptLink!.route, { state: { warmStart: true } })}>
            …or back to the manuscript → {manuscriptLink.title}
          </button>
        ) : vocab.note ? (
          <span className="wz-return-note">{vocab.note}</span>
        ) : null}
      </div>
    </div>
  );
}
