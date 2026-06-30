import { useNavigate } from 'react-router-dom';
import { clearDraft, getJournalEntries } from '../store/persistence';
import { getResumeTarget } from '../store/resume';
import { deskOwnerName } from '../store/currentUser';
import { DrawersTree } from '../components/DrawersTree';

// The Desk — the authed home (B4). Answers one question (what now?): a single
// primary action (Keep writing if there's recent work, else Start something →
// the create flow), a quiet glance at recent drawers + On the Shelf below, and
// the create entry. The left rail owns navigation, so the home no longer
// duplicates it (no "Open a Drawer / Open the journal"). The logo is a single
// app-wide element (App.BrandMark), full opacity here, faded elsewhere.

const CUSTOMIZE_TIP =
  'Color themes and AI writing help unlock at writing milestones — and never expire.';

export function Desk() {
  const navigate = useNavigate();
  const resume = getResumeTarget();
  const entries = getJournalEntries()
    .filter(e => !e.deletedAt)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  const latestEntry = entries[0] || null;

  // Keep writing re-orients to the most recent work; a project opens its overview,
  // a journal page opens that page, whichever was touched most recently.
  const projectMs = resume ? new Date(resume.project.lastActivityAt || resume.project.updatedAt).getTime() : 0;
  const entryMs = latestEntry ? new Date(latestEntry.updatedAt).getTime() : 0;
  const keepWritingRoute =
    resume && projectMs >= entryMs ? `/project/${resume.project.id}`
    : latestEntry ? `/journal/${latestEntry.id}`
    : resume ? `/project/${resume.project.id}`
    : '/sprint';

  // One obvious action: resume if there's recent work, else start something.
  const hasWork = !!resume || !!latestEntry;
  const primary = hasWork
    ? { label: 'Keep writing', route: keepWritingRoute }
    : { label: 'Start something', route: '/project/new' };

  return (
    <div className="wz-home">
      <div className="wz-ambient" style={{ opacity: 0.5 }} />

      <section className="wz-desk">
        <header className="wz-deskhead">
          <span className="wz-deskname">{deskOwnerName()}’s</span>
          <span className="wz-desktitle">Writing Desk</span>
        </header>
        <p className="wz-desksub">Scribble, draft, plot, revise, or share (coming soon)</p>

        <button type="button" className="wz-btn wz-primary" onClick={() => navigate(primary.route)}>{primary.label}</button>
        <div className="wz-secondary">
          <span className="wz-link" onClick={() => { clearDraft('scratch'); navigate('/sprint'); }}>New page</span>
          <span className="wz-dot">·</span>
          <span className="wz-link" onClick={() => navigate('/project/new')}>Begin project</span>
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
