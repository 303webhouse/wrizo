import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { legacyProjectTarget } from '../store/legacyProjectRoute';
import { stageCascadeHandoff } from '../store/planTrail';
import { DESKFRAME_MIN_WIDTH } from './DeskFrame';

// #13 step 12a: the route element for `/project/:id`, its four old sub-routes and `/sprint` (store/legacyProjectRoute.ts has the ruling).
// A project with no pages opens its Drawer's first page with the Pages pop-out handed over open - only at frame width, where the rail
// mounts to take it (a staged handoff no rail takes would open on some later page). It replaces the history entry, so Back skips it.
export function LegacyProjectRedirect() {
  const { id } = useParams();
  const navigate = useNavigate();
  useEffect(() => {
    const target = legacyProjectTarget(id);
    if (target.openPages && window.matchMedia(`(min-width: ${DESKFRAME_MIN_WIDTH}px)`).matches) stageCascadeHandoff({ category: 'page', survey: null });
    navigate(target.route, { replace: true });
  }, [id, navigate]);
  return null;
}
