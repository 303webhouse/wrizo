import { useNavigate } from 'react-router-dom';
import { clearDraft } from '../store/persistence';
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
  // The typed resume pointer (F1) is the single source: the most recently edited
  // surface — a binder chapter Page (mode-aware editor), a loose/shelf page, or a
  // legacy body — resolved with its correct route. (F2 renders the return card.)
  const resume = getResumeTarget();
  const primary = resume
    ? { label: 'Keep writing', route: resume.route }
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
