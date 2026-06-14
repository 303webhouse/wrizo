import { Link, Navigate, useParams } from 'react-router-dom';
import { getJournalEntry } from '../store/persistence';
import { firstLine, formatStamp } from '../store/entryText';

// J4 — the entry read view. Full text, read-only, on a lit paper page (prose
// belongs on paper). It reserves ONE primary-action slot for routing into a
// project: J4 leaves it a disabled placeholder; J2 fills it (the seam).

export function JournalEntry() {
  const { id } = useParams<{ id: string }>();
  const entry = id ? getJournalEntry(id) : null;
  if (!entry) return <Navigate to="/journal" replace />;

  return (
    <div className="page" style={{ maxWidth: 720, paddingTop: '3rem' }}>
      <Link to="/journal" className="btn-quiet" style={{ display: 'inline-block', marginBottom: 24 }}>← The journal</Link>

      <div className="eyebrow" style={{ marginBottom: 8, fontFamily: 'var(--font-mono)' }}>{formatStamp(entry.createdAt)}</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 24, letterSpacing: '-0.01em', color: 'var(--text-hi)', marginBottom: 20 }}>
        {firstLine(entry.text).slice(0, 100)}
      </h1>

      <div
        className="paper-page entry-full"
        style={{
          maxWidth: '68ch', whiteSpace: 'pre-wrap',
          color: 'var(--ink-on-paper)', fontFamily: 'var(--font-prose)', fontSize: 17, lineHeight: 1.7,
        }}
      >
        {entry.text}
      </div>

      {/* Reserved primary-action slot for routing (J2 fills this). J4: empty
          placeholder, disabled so it reads as deferred, not broken. */}
      <div className="entry-action-slot" style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" className="btn-ghost" disabled title="Coming with J2">
          Send to project
        </button>
      </div>
    </div>
  );
}
