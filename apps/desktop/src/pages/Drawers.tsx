import { useNavigate } from 'react-router-dom';
import { DrawersTree } from '../components/DrawersTree';
import { useLexicon } from '../store/themeLexicon';

// Drawers D1 — the standalone full-browse Drawers surface (/drawers). Reachable
// from the top-bar "Open a Drawer" nav and the Desk link; renders the same
// DrawersTree full-height. The Page level inside a Binder is D2.
export function DrawersPage() {
  const navigate = useNavigate();
  const { tMany: lexMany } = useLexicon();
  return (
    <div className="page" style={{ maxWidth: 760, paddingTop: '3rem' }}>
      <div className="dz-pagehead">
        <h1 className="dz-pagetitle">{lexMany('drawer')}</h1>
        <div className="dz-pagehead-actions">
          {/* VW — the Import door (Drawers edge). Picks a binder, then the paste surface. */}
          <button type="button" className="btn-quiet" onClick={() => navigate('/import')}>↓ Import a draft</button>
          <button type="button" className="btn-quiet" onClick={() => navigate('/')}>← Home</button>
        </div>
      </div>
      <DrawersTree />
    </div>
  );
}
