import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cancelDestructiveConfirm, submitDestructiveConfirm, usePendingDestructive } from '../store/destructiveGate';
import { useDeskLexicon } from '../store/deskLexicon';

// DELETE FOR GOOD (Fable's change 1, Oct 18) - the in-app typed confirmation that opens the account-wide destructive paths (store/destructiveGate.ts)
// for this page session. Mounted once (App.tsx), portalled to <body> like the "Send to Trash?" dialog, in its look.
//
// IT UNLOCKS ONLY ON THE WRITER'S OWN INPUT. A page script can fill the field and click the button, but those events carry isTrusted: false. So:
// the field's value counts as typed only while every input event since it was last empty (or wholly replaced by a trusted keystroke) was trusted,
// and the press must be trusted too. submitDestructiveConfirm refuses anything less.
export function DestructiveConfirm() {
  const req = usePendingDestructive();
  const { t } = useDeskLexicon();
  const [value, setValue] = useState('');
  const allTrusted = useRef(true);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setValue('');
    allTrusted.current = true;
    if (!req) return undefined;
    const raf = requestAnimationFrame(() => inputRef.current?.focus());
    const el = inputRef.current;
    // a trusted keystroke that replaces the WHOLE value starts the field over as the writer's own
    const onBefore = (e: Event) => {
      const input = e.currentTarget as HTMLInputElement;
      if (e.isTrusted && input.selectionStart === 0 && input.selectionEnd === input.value.length) allTrusted.current = true;
    };
    const onInput = (e: Event) => {
      const input = e.currentTarget as HTMLInputElement;
      if (!e.isTrusted) allTrusted.current = false;
      if (input.value === '') allTrusted.current = true;
    };
    el?.addEventListener('beforeinput', onBefore);
    el?.addEventListener('input', onInput);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); cancelDestructiveConfirm(); } };
    window.addEventListener('keydown', onKey, true);
    return () => {
      cancelAnimationFrame(raf);
      el?.removeEventListener('beforeinput', onBefore);
      el?.removeEventListener('input', onInput);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [req]);

  if (!req) return null;
  const submit = (trustedPress: boolean) => { submitDestructiveConfirm(inputRef.current?.value ?? value, trustedPress && allTrusted.current); };
  return createPortal(
    <div className="wz-delete-scrim">
      <div className="wz-delete-dialog wz-destructive" role="alertdialog" aria-modal="true" aria-labelledby="wz-destructive-title">
        <div className="wz-delete-title wz-destructive-title" id="wz-destructive-title">{req.title}</div>
        {req.lines.map((line, i) => <p key={i} className="wz-destructive-line">{line}</p>)}
        <label className="wz-destructive-label">
          <span>{t('destructiveTypeToGo').replace('{phrase}', req.phrase)}</span>
          <input ref={inputRef} className="wz-destructive-input" autoComplete="off" spellCheck={false} value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(e.nativeEvent.isTrusted); } }} />
        </label>
        <div className="wz-delete-btns">
          <button type="button" className="wz-delete-btn" onClick={() => cancelDestructiveConfirm()}>{t('deleteDialogCancel')}</button>
          <button type="button" className="wz-delete-btn wz-delete-go wz-destructive-go" disabled={value !== req.phrase}
            onClick={(e) => submit(e.nativeEvent.isTrusted)}>{t('destructiveGo')}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
