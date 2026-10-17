import { useRef } from 'react';
import { toggleHelp, useOpenHelp } from '../store/help';
import type { DeskTermId } from '../store/deskLexicon';

// HELP BUTTONS (Nick approved Oct 12, cursor/help-buttons @ d4d1c835;
// docs/mockups/help-buttons/index.html is the approved reference). The "?"
// trigger — a SEPARATE component from DrawerNote.tsx on purpose: DrawerNote's
// own "?" goes brass when open (the exact thing this ticket's token rule
// forbids) and opens a per-instance position:absolute pop; this one opens
// the ONE shared HelpPop.tsx overlay instead (mounted once, like
// ContextMenuHost.tsx), styled from the --help token, never brass.
//
// `subjectLabel` is whatever themed word already renders beside this button
// (e.g. the Sliver's own t('railTemplates')) — the accessible name is built
// from it ("What is Templates?"), so it is always in step with whatever the
// writer is actually reading, in either theme, without a second lexicon
// lookup of its own (the mockup's own aria-label pattern, carried over).
export function HelpButton({ helpKey, subjectLabel }: { helpKey: DeskTermId; subjectLabel: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  const open = useOpenHelp();
  const isOpen = open?.key === helpKey;
  return (
    <button
      ref={ref}
      type="button"
      className="wz-help"
      aria-expanded={isOpen}
      aria-label={`What is ${subjectLabel}?`}
      onClick={() => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        toggleHelp(helpKey, { left: r.left, right: r.right, top: r.top, bottom: r.bottom });
      }}
    >
      ?
    </button>
  );
}
