import { readFileSync } from 'fs';
import { resolve } from 'path';

// B10.1 - WHICH CLIENT BUILD IS THIS SERVER SERVING? The name of the entry bundle in the index.html it hands out
// (`index-DkqE6EFm`). The web client reads the same name out of its own entry <script> (desktop/src/store/clientBuild.ts),
// so the two agree by construction with no version file to keep in step. /api/sync reports it in every reply and
// /healthz reports it too (a deploy smoke can compare served against stamped); a client that finds it DIFFERENT from its
// own stops syncing and asks to be reloaded. Report-only: the server never refuses a request over it.
//
// Read once, lazily: a redeploy restarts the process, so the value cannot go stale under a running server. null when there
// is no built client next to the server (a bare server in a test, or a dev checkout) - and a null build switches the guard
// off on the client's side, since the check needs both sides to know theirs.
const INDEX_HTML = resolve(__dirname, '../../desktop/dist-web/index.html');
const ENTRY_RE = /\/assets\/(index-[A-Za-z0-9_-]+)\.js/;

export function parseBuild(html: string): string | null {
  const m = ENTRY_RE.exec(html);
  return m ? m[1] : null;
}

let cached: string | null | undefined;

export function getServerBuild(): string | null {
  if (cached !== undefined) return cached;
  try {
    cached = parseBuild(readFileSync(INDEX_HTML, 'utf8'));
  } catch {
    cached = null;
  }
  return cached;
}
