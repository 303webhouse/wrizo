import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createShelfPage, getProjects, getShelfPages, setPageHome } from '../store/persistence';
import { firstLine, snippet, formatStamp } from '../store/entryText';
import { PageFileMenu } from '../components/PageFileMenu';

// Pages & Shelf D2 — the Shelf: loose pages set aside for filing, kept out of the
// chronological Journal stream. Open a page (the existing page editor), file it
// into a Binder or send it to the Journal, or make a new one. Multi-select bulk
// file sets up the future AI "tidy the shelf" (a sorting task, not prose).
export function Shelf() {
  const navigate = useNavigate();
  const pages = getShelfPages();
  const binders = getProjects();
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [bulkOpen, setBulkOpen] = useState(false);

  const toggleSel = (id: string) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const bulkFile = (target: string) => {
    selected.forEach(id => setPageHome(id, target));
    setSelected(new Set());
    setBulkOpen(false);
  };

  return (
    <div className="page" style={{ maxWidth: 640, paddingTop: '3rem' }}>
      <Link to="/" className="btn-quiet" style={{ display: 'inline-block', marginBottom: 24 }}>← Home</Link>

      <div className="eyebrow" style={{ marginBottom: 8 }}>THE SHELF</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 28, letterSpacing: '-0.01em', color: 'var(--text-hi)', marginBottom: 20 }}>
        Loose pages, waiting for a home.
      </h1>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn-quiet shelf-new-page"
          onClick={() => { const page = createShelfPage(); navigate(`/journal/${page.id}`); }}
        >
          New shelf page
        </button>
        {selected.size > 0 && (
          <div className="dz-rowmove">
            <button type="button" className="btn-quiet shelf-bulk" onClick={() => setBulkOpen(o => !o)}>
              File {selected.size} selected…
            </button>
            {bulkOpen && (
              <div className="dz-menu" role="menu">
                <button type="button" className="dz-menu-item" onClick={() => bulkFile('journal')}>To Journal</button>
                {binders.map(b => (
                  <button type="button" key={b.id} className="dz-menu-item" onClick={() => bulkFile(b.id)}>{b.title || 'Untitled'}</button>
                ))}
                {binders.length === 0 && <span className="dz-menu-empty">No binders to file into</span>}
              </div>
            )}
          </div>
        )}
      </div>

      {pages.length === 0 ? (
        <p style={{ color: 'var(--text-mid)' }}>The shelf is empty. Loose pages you set aside for filing will gather here.</p>
      ) : (
        <div className="shelf-list">
          {pages.map(p => {
            const textEmpty = !p.text.trim();
            const label = textEmpty ? 'Untitled' : firstLine(p.text).slice(0, 80);
            return (
              <div key={p.id} className="shelf-row" data-selected={selected.has(p.id) ? 'true' : 'false'}>
                <input
                  type="checkbox"
                  className="shelf-check"
                  aria-label="Select page"
                  checked={selected.has(p.id)}
                  onChange={() => toggleSel(p.id)}
                />
                <button type="button" className="shelf-open" onClick={() => navigate(`/journal/${p.id}`)}>
                  <span className="shelf-label">{label}</span>
                  {!textEmpty && <span className="shelf-snippet">{snippet(p.text, 110)}</span>}
                  <span className="shelf-time">{formatStamp(p.updatedAt)}</span>
                </button>
                <PageFileMenu page={p} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
