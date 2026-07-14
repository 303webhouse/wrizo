import { useEffect, useRef, useState } from 'react';
import { subscribeWhisper, recordShadow } from '../store/voiceWall';
import { useTheme } from '../store/theme';
import { t } from '../store/themeLexicon';

// The single global whisper element (mounted once in App). Non-modal, auto-fading,
// calm — the wall's only voice, and only once per session. Reduced-motion just
// skips the fade transition (handled in CSS).
const HOLD_MS = 4200;
const FADE_MS = 700;

// VW Slice 4 — the prose-surface set Slice 1 guards; a copy/cut originating
// inside one of these records the own-ink shadow. Kept alongside the whisper
// (the one global Voice Wall mount point) rather than a second wire-in.
// J4 review fix — .board-text joins the set: the blocking side (BoardEditor's
// paste/drop guard) already checked shadowAllows, but nothing recorded a copy
// FROM a board text box, so pasting your own board-copied words elsewhere
// blocked and whispered.
// S1 — .script-el-active joins the set: the same blocking/recording pattern,
// applied to the Screenplay Room's one live element block.
const PROSE_SURFACES = '.forward-only-editor, .entry-edit, .board-text, .script-el-active';

export function VoiceWallWhisper() {
  const theme = useTheme();
  const [msg, setMsg] = useState<string | null>(null);
  const [shown, setShown] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Capture phase, document-level: never preventDefault (copy-out stays free,
  // always) — purely an observer that records what left a prose surface.
  useEffect(() => {
    const onCopyOrCut = (e: ClipboardEvent) => {
      const target = e.target as Element | null;
      if (!target?.closest?.(PROSE_SURFACES)) return;
      const sel = String(document.getSelection() || '');
      if (sel) recordShadow(sel);
    };
    document.addEventListener('copy', onCopyOrCut, true);
    document.addEventListener('cut', onCopyOrCut, true);
    return () => {
      document.removeEventListener('copy', onCopyOrCut, true);
      document.removeEventListener('cut', onCopyOrCut, true);
    };
  }, []);

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
  // TH2 Slice 5 — the Firewall chip (canon §12): "the guard speaks only
  // when it acts." Same trigger/timing as Plateau's whisper (binds to the
  // Voice Wall's existing blocking events, per the brief — no new detection
  // logic), Flux just presents it as a terse technical chip instead of a
  // conversational line. No persistent status chip either way — both forms
  // fire only on the blocking event and fade.
  if (theme === 'flux') {
    return (
      <div className="flux-firewall-chip" data-shown={shown ? 'true' : 'false'} role="status">
        {t('voicewall').toUpperCase()} ▪ PASTE BLOCKED
      </div>
    );
  }
  return <div className="vw-whisper" data-shown={shown ? 'true' : 'false'} role="status">{msg}</div>;
}
