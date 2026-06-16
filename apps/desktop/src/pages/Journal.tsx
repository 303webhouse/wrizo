import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getJournalEntries, createJournalPage } from '../store/persistence';
import { firstLine, snippet, matchesQuery, formatStamp } from '../store/entryText';
import type { JournalEntry } from '../types';

// J4 — the notebook surface. A visible, browsable, searchable place for every
// finished sprint: a notebook to flip through, not an inbox to clear. Read-only;
// reads getJournalEntries() (newest-first, excludes soft-deleted). No counters,
// no badges. Routing into projects (J2) lands in the read view's reserved slot.

// Time spine: bucket an entry by how long ago it was written. Entries arrive
// newest-first, so buckets surface in this order naturally.
function bucketOf(iso: string, now: number): string {
  const days = Math.floor((now - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days <= 7) return 'Earlier this week';
  if (days <= 30) return 'Earlier this month';
  return 'Older';
}

const eyebrow: React.CSSProperties = { marginBottom: 8 };

export function Journal() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [starredOnly, setStarredOnly] = useState(false);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  // Snapshot once per render; reads are cheap and the page is read-only.
  const entries = useMemo(() => getJournalEntries(), []);
  const now = Date.now();

  const filtered = entries.filter(e =>
    matchesQuery(e.text, query)
    && (!starredOnly || e.starred)
    && (!tagFilter || (e.tags ?? []).includes(tagFilter)));

  // Unique tags across all entries, for the quiet tag-filter row.
  const allTags = [...new Set(entries.flatMap(e => e.tags ?? []))].sort();

  // Group the filtered list into ordered time buckets (the spine).
  const groups: { label: string; rows: JournalEntry[] }[] = [];
  for (const e of filtered) {
    const label = bucketOf(e.createdAt, now);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.rows.push(e);
    else groups.push({ label, rows: [e] });
  }

  // Resurfacing: user-invoked only. Opens one random past entry ("flip to a
  // page"). Nothing auto-rotates — this fires solely on click (§8).
  const surface = () => {
    if (entries.length === 0) return;
    const pick = entries[Math.floor(Math.random() * entries.length)];
    navigate(`/journal/${pick.id}`);
  };

  return (
    <div className="page" style={{ maxWidth: 640, paddingTop: '3rem' }}>
      <Link to="/" className="btn-quiet" style={{ display: 'inline-block', marginBottom: 24 }}>← Home</Link>

      <div className="eyebrow" style={eyebrow}>THE JOURNAL</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 28, letterSpacing: '-0.01em', color: 'var(--text-hi)', marginBottom: 20 }}>
        Everything you've written.
      </h1>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: allTags.length > 0 ? 12 : 24, flexWrap: 'wrap' }}>
        <input
          className="journal-search"
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search your pages"
          style={{
            flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--ink-border)', background: 'var(--ink-800)',
            color: 'var(--text-hi)', fontFamily: 'var(--font-ui)', fontSize: 15,
          }}
        />
        <button
          type="button"
          className="btn-quiet journal-starred-toggle"
          data-on={starredOnly ? 'true' : 'false'}
          onClick={() => setStarredOnly(v => !v)}
          style={{ color: starredOnly ? 'var(--brass)' : 'var(--text-mid)' }}
        >
          {starredOnly ? '★ Starred only' : '☆ Starred only'}
        </button>
        <button type="button" className="btn-quiet journal-surface" onClick={surface} disabled={entries.length === 0}>
          Surface a past page
        </button>
        <button
          type="button"
          className="btn-quiet journal-new-page"
          onClick={() => { const page = createJournalPage(); navigate(`/journal/${page.id}`); }}
        >
          New page
        </button>
      </div>

      {allTags.length > 0 && (
        <div className="journal-tag-filters" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 24 }}>
          {allTags.map(t => (
            <button
              key={t}
              type="button"
              className="btn-quiet journal-tag-filter"
              data-tag={t}
              data-active={tagFilter === t ? 'true' : 'false'}
              onClick={() => setTagFilter(tagFilter === t ? null : t)}
              style={{ border: '1px solid var(--ink-border)', borderRadius: 'var(--radius-sm)', padding: '3px 10px', fontSize: 13, color: tagFilter === t ? 'var(--brass)' : 'var(--text-mid)' }}
            >
              {t}
            </button>
          ))}
          {tagFilter && (
            <button type="button" className="btn-quiet journal-tag-clear" onClick={() => setTagFilter(null)} style={{ color: 'var(--text-low)' }}>clear</button>
          )}
        </div>
      )}

      {entries.length === 0 ? (
        <p style={{ color: 'var(--text-mid)' }}>No pages yet — your finished sprints will gather here.</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: 'var(--text-mid)' }}>Nothing matches “{query.trim()}”.</p>
      ) : (
        groups.map(group => (
          <div key={group.label} className="journal-group" style={{ marginBottom: 24 }}>
            <div className="eyebrow" style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span>{group.label}</span>
              <span style={{ flex: 1, height: 1, background: 'var(--ink-border)' }} />
            </div>
            {group.rows.map(entry => (
              <button
                key={entry.id}
                type="button"
                className="journal-row"
                onClick={() => navigate(`/journal/${entry.id}`)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
                  background: 'transparent', border: 'none', borderBottom: '1px solid var(--ink-border)',
                  padding: '12px 4px',
                }}
              >
                <div className="journal-label" style={{ color: 'var(--text-hi)', fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 600, marginBottom: 2 }}>
                  {entry.starred && <span className="journal-star" style={{ color: 'var(--brass)', marginRight: 6 }}>★</span>}
                  {firstLine(entry.text).slice(0, 80)}
                </div>
                <div className="journal-snippet" style={{ color: 'var(--text-mid)', fontSize: 14, marginBottom: 4 }}>
                  {snippet(entry.text, 120)}
                </div>
                {(entry.tags ?? []).length > 0 && (
                  <div className="journal-row-tags" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                    {(entry.tags ?? []).map(t => (
                      <span key={t} className="journal-row-tag" style={{ fontSize: 11, color: 'var(--text-low)', border: '1px solid var(--ink-border)', borderRadius: 'var(--radius-sm)', padding: '1px 6px' }}>{t}</span>
                    ))}
                  </div>
                )}
                <div className="journal-time" style={{ color: 'var(--text-low)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                  {formatStamp(entry.createdAt)}{(entry.routedProjectIds?.length ?? 0) > 0 ? ' · routed' : ''}
                </div>
              </button>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
