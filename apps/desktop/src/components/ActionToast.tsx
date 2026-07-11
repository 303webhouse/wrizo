import { useEffect, useRef, useState } from 'react';

// J5 — a quiet, auto-fading confirmation line for a completed sheet action
// (FILE/COPY/LINK). Mirrors VoiceWallWhisper's hold/fade timing; scoped
// per-caller rather than a second global channel (this is action feedback,
// not the Voice Wall's once-per-session whisper).
const HOLD_MS = 4200;
const FADE_MS = 700;

export function useActionToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const [shown, setShown] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  const show = (message: string) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setMsg(message);
    setShown(true);
    timers.current.push(setTimeout(() => setShown(false), HOLD_MS));
    timers.current.push(setTimeout(() => setMsg(null), HOLD_MS + FADE_MS));
  };

  const node = msg ? <div className="action-toast" data-shown={shown ? 'true' : 'false'} role="status">{msg}</div> : null;
  return { show, node };
}
