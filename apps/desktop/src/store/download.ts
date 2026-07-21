// E1 S3 — the client-side file-writing mechanism every Download action uses:
// build a Blob, mint a throwaway object URL, click a detached <a download>,
// then release the URL. No server, no network dependency — this IS what
// "client-side by construction, works on a plane" means at the DOM level.
export function triggerDownload(filename: string, content: string, mime = 'text/markdown'): boolean {
  try {
    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Revoke on a short delay, not synchronously — some engines resolve the
    // blob: URL asynchronously right after the click; revoking immediately
    // has been observed elsewhere to race a genuinely slow disk write.
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  } catch {
    return false;
  }
}
