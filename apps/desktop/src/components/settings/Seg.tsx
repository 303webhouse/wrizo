import type { ReactNode } from 'react';

// ITEM word-diet — `label` widened from `string` to `ReactNode` so a caller
// can attach a DrawerNote "?" beside it; every existing caller passes a
// plain string (still a valid ReactNode).
export function Seg({ label, value, opts, onPick, soon, soonTitle, disabled }: { label: ReactNode; value: string; opts: [string, string][]; onPick: (v: string) => void; soon?: string[]; soonTitle?: string; disabled?: boolean }) {
  return (
    <div className="mode-crow" data-disabled={disabled ? 'true' : undefined}>
      <span>{label}</span>
      <div className="mode-seg">
        {opts.map(([v, txt]) => soon?.includes(v)
          ? <button key={v} type="button" className="mode-seg-soon" aria-disabled="true" title={soonTitle}>{txt}</button>
          : <button key={v} type="button" className={value === v ? 'on' : ''} disabled={disabled} onClick={() => onPick(v)}>{txt}</button>
        )}
      </div>
    </div>
  );
}
