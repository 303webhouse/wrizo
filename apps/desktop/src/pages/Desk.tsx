import { useNavigate } from 'react-router-dom';
import { clearDraft, getJournalEntries } from '../store/persistence';
import { getResumeTarget } from '../store/resume';
import { deskOwnerName } from '../store/currentUser';
import { DrawersTree } from '../components/DrawersTree';

// The Desk — the authed home (replaces SessionLauncher), in the Wrizo / v6
// "launch" aesthetic. Account-create and returning sign-in both land here.
//
// Drawers D1: the flat recent-items list is replaced by the browsable Drawers
// tree (Drawer → Binder(Project), with an "Unsorted" group). "Keep writing"
// resume, "New page", "Begin project", and the Journal entry point are unchanged.

const CUSTOMIZE_TIP =
  'Color themes and AI writing help unlock at writing milestones — and never expire.';

export function Desk() {
  const navigate = useNavigate();
  const resume = getResumeTarget();
  const entries = getJournalEntries()
    .filter(e => !e.deletedAt)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  const latestEntry = entries[0] || null;

  // Keep writing re-orients rather than dropping into the exact last step: a
  // project opens its OVERVIEW (not /sprint or /beat); a standalone journal page
  // opens that page. Whichever was touched most recently wins.
  const projectMs = resume ? new Date(resume.project.lastActivityAt || resume.project.updatedAt).getTime() : 0;
  const entryMs = latestEntry ? new Date(latestEntry.updatedAt).getTime() : 0;
  const keepWritingRoute =
    resume && projectMs >= entryMs ? `/project/${resume.project.id}`
    : latestEntry ? `/journal/${latestEntry.id}`
    : resume ? `/project/${resume.project.id}`
    : '/sprint';

  return (
    <div className="wz-home">
      <div className="wz-ambient" style={{ opacity: 0.5 }} />
      <img className="wz-mark show" src="/brand/wrizo-logo.png" alt="" aria-hidden="true" />

      <section className="wz-desk">
        {/* Letterhead: name in Crimson, above the "Writing Desk" element (Figtree
            swappable slot → hand-drawn graphic later). */}
        <header className="wz-deskhead">
          <span className="wz-deskname">{deskOwnerName()}’s</span>
          <span className="wz-desktitle">Writing Desk</span>
        </header>
        <p className="wz-desksub">Scribble, draft, plot, revise, or share (coming soon)</p>

        <button type="button" className="wz-btn wz-primary" onClick={() => navigate(keepWritingRoute)}>Keep writing</button>
        <div className="wz-secondary">
          <span className="wz-link" onClick={() => { clearDraft('scratch'); navigate('/sprint'); }}>New page</span>
          <span className="wz-dot">·</span>
          <span className="wz-link" onClick={() => navigate('/project/new')}>Begin project</span>
        </div>

        {/* Drawers — the organizational surface (replaces the recent list). */}
        <div className="wz-drawers">
          <DrawersTree />
          <div className="wz-desk-links">
            <span className="wz-link" onClick={() => navigate('/drawers')}>Open a Drawer →</span>
            <span className="wz-dot">·</span>
            <span className="wz-link" onClick={() => navigate('/journal')}>Open the journal →</span>
          </div>
        </div>

        <div className="wz-customize" tabIndex={0}>
          <span className="wz-cust-link">Customize</span>
          <div className="wz-tip"><b>Earned as you write.</b><br />{CUSTOMIZE_TIP}</div>
        </div>
      </section>
    </div>
  );
}
