import { useEffect, useRef, type MutableRefObject } from 'react';
import type { EditorMode } from '../../components/ForwardOnlyEditor';
import { enterPageTypewriter, holdTypewriterPage } from '../../store/writingSettings';

export function usePageTypewriter({ mode, id, initialText, textRef }: {
  mode: EditorMode;
  id: string;
  initialText: string;
  textRef: MutableRefObject<string>;
}) {
  // the Draft-open typewriter is decided once at mount (empty deps freeze `mode` and `initialText`; the component remounts per page, so a mode switch within one mount never re-runs it); an EMPTY page opens with the typewriter OFF, having no lines to follow [PageEditor §9]
  const typewriterEnteredRef = useRef(false);   // PHASE 1 (S5): has this mount read the page's typewriter memory yet?
  useEffect(() => {
    if (mode === 'drafting') { enterPageTypewriter(id, initialText.trim().length === 0); typewriterEnteredRef.current = true; }   // PHASE 1 (S5): read once at mount; replaces the line-count seed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {   // PHASE 1 (S5): a toggle on this Draft page writes ITS memory; a page opened in Free Write reads it the FIRST time it reaches Draft
    if (mode !== 'drafting') return undefined;
    if (!typewriterEnteredRef.current) { typewriterEnteredRef.current = true; enterPageTypewriter(id, textRef.current.trim().length === 0); }
    return holdTypewriterPage(id);
  }, [mode, id]);
}
