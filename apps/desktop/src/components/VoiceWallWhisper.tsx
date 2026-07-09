import { useEffect, useRef, useState } from 'react';
import { subscribeWhisper } from '../store/voiceWall';

// The single global whisper element (mounted once in App). Non-modal, auto-fading,
// calm — the wall's only voice, and only once per session. Reduced-motion just
// skips the fade transition (handled in CSS).
const HOLD_MS = 4200;
const FADE_MS = 700;

export function VoiceWallWhisper() {
  const [msg, setMsg] = useState<string | null>(null);
  const [shown, setShown] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
    const unsub = subscribeWhisper((m) => {
      clear();
      setMsg(m);
      setShown(true);
      timers.current.push(setTimeout(() => setShown(false), HOLD_MS));
      timers.current.push(setTimeout(() => setMsg(null), HOLD_MS + FADE_MS));
    });
    return () => { unsub(); clear(); };
  }, []);

  if (!msg) return null;
  return <div className="vw-whisper" data-shown={shown ? 'true' : 'false'} role="status">{msg}</div>;
}
