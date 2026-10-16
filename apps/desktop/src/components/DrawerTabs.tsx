import { useRef } from 'react';
import type { ReactNode } from 'react';

// PHASE 1 - THE DRAWER'S TAB ROW (TEXT | INK now; TUTOR | the theme's links word in S3).
//
// Tabs, not buttons-that-look-like-tabs: role=tablist / tab with aria-selected and a ROVING tabindex (only the chosen tab is in the Tab
// order; Left/Right/Home/End move between them and choose). The chosen tab wears a BRASS OUTLINE and nothing else - no fill (Nick,
// Oct 9: brass-outlined choices lose the light-orange background). The drawer's arrow tab stays olive; that is "where you are", this is
// "what you chose".
//
// Controlled: the host owns the value (for Free Write that is PageEditor's `instrument`, so the paper, the caret and the drawer agree).

export interface DrawerTabItem<T extends string> { id: T; label: ReactNode }

/** Which tab a key press chooses. Pure so it is tested without a DOM. Null = the key means nothing here. */
export function nextTab<T extends string>(ids: readonly T[], current: T, key: string): T | null {
  if (ids.length === 0) return null;
  const at = Math.max(0, ids.indexOf(current));
  if (key === 'ArrowRight' || key === 'ArrowDown') return ids[(at + 1) % ids.length];
  if (key === 'ArrowLeft' || key === 'ArrowUp') return ids[(at - 1 + ids.length) % ids.length];
  if (key === 'Home') return ids[0];
  if (key === 'End') return ids[ids.length - 1];
  return null;
}

interface Props<T extends string> {
  items: readonly DrawerTabItem<T>[];
  /** Small adornments beside a tab's word (the "?" note), keyed by tab. They live OUTSIDE the tablist: a tablist owns tabs and nothing else. */
  notes?: Partial<Record<T, ReactNode>>;
  value: T;
  onChange: (next: T) => void;
  /** Accessible name of the whole row. */
  label: string;
  /** Prefix for the tab ids, so a panel can name the tab that labels it. */
  idPrefix: string;
}

export function DrawerTabs<T extends string>({ items, notes, value, onChange, label, idPrefix }: Props<T>) {
  const refs = useRef(new Map<T, HTMLButtonElement>());
  const ids = items.map(i => i.id);
  const onKeyDown = (e: React.KeyboardEvent) => {
    const next = nextTab(ids, value, e.key);
    if (next === null) return;
    e.preventDefault();
    onChange(next);
    refs.current.get(next)?.focus();
  };
  const hasNotes = !!notes && items.some(it => notes[it.id] != null);
  return (
    <div className="wz-drawer-tabbar">
    <div className="wz-drawer-tabs" role="tablist" aria-label={label} onKeyDown={onKeyDown}>
      {items.map(it => (
        <button
          key={it.id}
          ref={el => { if (el) refs.current.set(it.id, el); else refs.current.delete(it.id); }}
          type="button"
          role="tab"
          id={`${idPrefix}-tab-${it.id}`}
          className="wz-drawer-tab"
          aria-selected={value === it.id}
          aria-controls={`${idPrefix}-panel`}
          tabIndex={value === it.id ? 0 : -1}
          data-on={value === it.id ? 'true' : 'false'}
          onClick={() => onChange(it.id)}
        >
          {it.label}
        </button>
      ))}
    </div>
    {hasNotes && notes && (
      <div className="wz-drawer-tabnotes" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map(it => <div key={it.id} className="wz-drawer-tabnote-cell">{notes[it.id] ?? null}</div>)}
      </div>
    )}
    </div>
  );
}
