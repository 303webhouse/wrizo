import { useRef } from 'react';
import { toggleHelp, useOpenHelp } from '../store/help';
import type { DeskTermId } from '../store/deskLexicon';

// a "?" separate from DrawerNote: it opens the one shared HelpPop overlay in the --help token, never brass; its accessible name is built from the label beside it [HelpButton §1]
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
