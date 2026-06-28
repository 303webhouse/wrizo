import { useNavigate } from 'react-router-dom';
import { DrawersTree } from '../components/DrawersTree';

// Drawers D1 — the standalone full-browse Drawers surface (/drawers). Reachable
// from the top-bar "Open a Drawer" nav and the Desk link; renders the same
// DrawersTree full-height. The Page level inside a Binder is D2.
export function DrawersPage() {
  const navigate = useNavigate();
  return (
    <div className="page" style={{ maxWidth: 760, paddingTop: '3rem' }}>
      <div className="dz-pagehead">
        <h1 className="dz-pagetitle">Drawers</h1>
        <button type="button" className="btn-quiet" onClick={() => navigate('/')}>← Desk</button>
      </div>
      <DrawersTree />
    </div>
  );
}
