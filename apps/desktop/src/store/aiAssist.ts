import { useEffect, useState } from 'react';

// B3 — the AI assist channel. The ASSIST frame is the SINGLE place any future AI
// response is shown: a feature calls `showAssistResponse(text)`, the frame pops
// out (in a non-Free-Write mode) and displays it. B3 builds the channel, not the
// contents — there is no caller yet, and no provider is wired (Connect is a stub).
//
// A tiny module-level pub/sub so the method is unit-testable independent of React:
// call showAssistResponse, assert subscribers receive it. The anti-slop boundary
// (AI clears blocks, never writes; never in Free Write) is enforced by the frame,
// not here — this is just the transport.

let current: string | null = null;
const subs = new Set<(text: string | null) => void>();

// Show an AI response in the assist frame, popping it out on demand. No caller in
// B3; this is the seam future AI features speak through.
export function showAssistResponse(text: string): void {
  current = text;
  subs.forEach(fn => fn(current));
}

export function clearAssistResponse(): void {
  current = null;
  subs.forEach(fn => fn(current));
}

export function getAssistResponse(): string | null {
  return current;
}

// Expose the channel on window — the single public seam an external/future AI
// integration calls to speak through the frame ("show response / pop out").
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoAssist?: unknown }).wrizoAssist = {
    show: showAssistResponse,
    clear: clearAssistResponse,
  };
}

// Subscribe a component to the live response (null when none).
export function useAssistResponse(): string | null {
  const [value, setValue] = useState(current);
  useEffect(() => {
    const fn = (t: string | null) => setValue(t);
    subs.add(fn);
    setValue(current);
    return () => { subs.delete(fn); };
  }, []);
  return value;
}
