// Copy-out is sacred (VW Slice 2): the writer's finished words flow OUT freely.
// "Copy page text" copies the DERIVED clean text (struck runs already excluded —
// the clean-save invariant's public face) so mobile writers don't fight long-press
// selection for a whole page. Tries the async Clipboard API, falls back to an
// off-screen textarea + execCommand for non-secure contexts.
//
// E1 S1/S2 — live diagnosis found a genuine silent-failure hole here: the
// async Clipboard API call was fire-and-forgotten (`void
// navigator.clipboard.writeText(text)`, never awaited, never `.catch()`ed).
// The outer try/catch only ever caught a SYNCHRONOUS throw from calling
// `.writeText` itself (rare); a genuine async rejection (permission denied,
// a non-focused document, etc. — reproduced live via the harness by forcing
// exactly this) became an unhandled promise rejection that the caller could
// never observe, AND the function had already `return`ed, so the
// execCommand fallback below never ran either. `copyText` now returns
// `Promise<boolean>` — true only once text has genuinely landed somewhere
// (the Clipboard API succeeded, or the execCommand fallback reported
// success) — so a caller can show an honest confirmation or an honest
// failure instead of assuming success just because nothing threw
// synchronously. Every existing fire-and-forget call site keeps compiling
// (a Promise return is a strict superset of `void`); PageEditor.tsx/
// ScriptEditor.tsx are the two call sites that now actually await it.
import { recordShadow } from './voiceWall';

export async function copyText(text: string): Promise<boolean> {
  // VW Slice 4 — this exact payload is the writer's own words; record it in
  // the own-ink shadow so pasting it back anywhere passes the wall silently.
  recordShadow(text);
  // Test/inspection seam — the last copied text, for the harness.
  if (typeof window !== 'undefined') (window as unknown as { __wzLastCopy?: string }).__wzLastCopy = text;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* fall through to the legacy path — a genuine async rejection lands here too */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
