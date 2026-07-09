// Copy-out is sacred (VW Slice 2): the writer's finished words flow OUT freely.
// "Copy page text" copies the DERIVED clean text (struck runs already excluded —
// the clean-save invariant's public face) so mobile writers don't fight long-press
// selection for a whole page. Tries the async Clipboard API, falls back to an
// off-screen textarea + execCommand for non-secure contexts.
export function copyText(text: string): void {
  // Test/inspection seam — the last copied text, for the harness.
  if (typeof window !== 'undefined') (window as unknown as { __wzLastCopy?: string }).__wzLastCopy = text;
  try {
    if (navigator.clipboard?.writeText) { void navigator.clipboard.writeText(text); return; }
  } catch { /* fall through to the legacy path */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  } catch { /* best-effort */ }
}
