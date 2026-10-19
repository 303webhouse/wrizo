import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { subscribePurgedElsewhere } from '../store/persistence';
import { useActionToast } from './ActionToast';
import { useDeskLexicon } from '../store/deskLexicon';

// DELETE FOR GOOD - Q3 (Fable, Oct 18: "yes, one quiet line"). A page or board open here that was deleted for good on another device: the app
// leaves it for the Desk and says so once, in the quiet action-toast line. Mounted once (App.tsx), inside the router; renders only the line.
export function PurgedElsewhereNotice() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useActionToast();
  const { t } = useDeskLexicon();
  useEffect(() => subscribePurgedElsewhere((ids) => {
    const open = /^\/page\/([^/?#]+)/.exec(location.pathname);
    if (!open || !ids.includes(decodeURIComponent(open[1]))) return;
    navigate('/');
    toast.show(t('purgedElsewhere'));
  }), [location.pathname, navigate, toast, t]);
  return toast.node;
}
