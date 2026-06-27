import { useNavigate } from 'react-router-dom';
import { clearDraft, getJournalEntries, getProjects } from '../store/persistence';
import { getResumeTarget, relativeDays } from '../store/resume';

// The Desk — the authed home (replaces SessionLauncher), in the Wrizo / v6
// "launch" aesthetic. Account-create and returning sign-in both land here.
//
// Two states, ONE shell (no regression of returning users):
//  - empty / first: the clean v6 launch screen.
//  - returning: the same screen + a restyled recent-work list, preserving what
//    SessionLauncher gave — resume-the-latest and reach the journal / projects.
// "Keep writing" resumes the most recent work (project sprint/beat via
// getResumeTarget, else the latest journal entry), or starts a fresh page.

const CUSTOMIZE_TIP =
  'Color themes and AI writing help unlock at writing milestones — and never expire.';

interface RecentRow { key: string; title: string; daysAgo: number; route: string }

function preview(text: string, n = 8): string {
  const w = text.trim().split(/\s+/).filter(Boolean);
  return w.slice(0, n).join(' ') + (w.length > n ? '…' : '') || 'Untitled page';
}
function daysSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

export function Desk() {
  const navigate = useNavigate();
  const resume = getResumeTarget();
  const projects = getProjects();
  const entries = getJournalEntries()
    .filter(e => !e.deletedAt)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  const latestEntry = entries[0] || null;

  const keepWritingRoute = resume?.route ?? (latestEntry ? `/journal/${latestEntry.id}` : '/sprint');
  const hasWork = !!resume || projects.length > 0 || entries.length > 0;

  // Unified recent-work list (projects + journal pages), newest first.
  const recent: RecentRow[] = [
    ...projects.map(p => ({
      key: `p:${p.id}`,
      title: p.title,
      daysAgo: daysSince(p.lastActivityAt || p.updatedAt),
      route: `/project/${p.id}`,
    })),
    ...entries.map(e => ({
      key: `e:${e.id}`,
      title: preview(e.text),
      daysAgo: daysSince(e.updatedAt),
      route: `/journal/${e.id}`,
    })),
  ]
    .sort((a, b) => a.daysAgo - b.daysAgo)
    .slice(0, 5);

  return (
    <div className="wz-home">
      <div className="wz-ambient" style={{ opacity: 0.5 }} />
      <img className="wz-mark show" src="/brand/wrizo-logo.png" alt="" aria-hidden="true" />

      <section className="wz-screen show wz-desk">
        {/* swappable Figtree bighead slot (hand-drawn art later) */}
        <div className="wz-bighead">You're ready to keep writing.</div>
        <div className="wz-sub">{hasWork ? "That's your work, waiting on your desk." : "That's your first page, waiting on your desk."}</div>

        <button type="button" className="wz-btn wz-primary" onClick={() => navigate(keepWritingRoute)}>Keep writing</button>
        <div className="wz-secondary">
          <span className="wz-link" onClick={() => { clearDraft('scratch'); navigate('/sprint'); }}>New page</span>
          <span className="wz-dot">·</span>
          <span className="wz-link" onClick={() => navigate('/project/new')}>Begin project</span>
        </div>

        {hasWork && (
          <div className="wz-recent">
            {recent.map(r => (
              <button type="button" key={r.key} className="wz-recent-row" onClick={() => navigate(r.route)}>
                <span className="wz-recent-title">{r.title}</span>
                <span className="wz-recent-when">{relativeDays(r.daysAgo)}</span>
              </button>
            ))}
            <span className="wz-link wz-journal-link" onClick={() => navigate('/journal')}>Open the journal →</span>
          </div>
        )}

        <div className="wz-customize" tabIndex={0}>
          <span className="wz-cust-link">Customize</span>
          <div className="wz-tip"><b>Earned as you write.</b><br />{CUSTOMIZE_TIP}</div>
        </div>
      </section>
    </div>
  );
}
