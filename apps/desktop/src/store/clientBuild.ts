// B10.1 — WHICH BUILD IS THIS TAB RUNNING? The server reports the build it is serving (server/src/build.ts reads the entry
// bundle's name out of dist-web/index.html); this reads the same name out of the page's own entry <script>. Equal means
// current. Different means this tab was loaded before a deploy and is stale.
//
// THE GUARD IS WEB-ONLY, and the exemptions are decided here, in one place:
//   - not http(s) (Electron's file:// renderer has its own ./assets/index-*.js, which the selector would happily match — it
//     would go permanently "stale" against a server it does not even load from);
//   - Electron's renderer by name (its user-agent token, the way beforeUnloadGuard.ts excludes it), including the dev
//     renderer served over http://localhost;
//   - a script that is not same-origin with the page (nothing the server could be reporting on).
// Anything else that does not look like a hashed entry bundle (the Vite dev server, the test double's raw modules) yields
// null, and a null build switches the guard off: the stale check needs BOTH sides to know their build.
const ENTRY_RE = /\/assets\/(index-[A-Za-z0-9_-]+)\.js(?:$|[?#])/;

export interface BuildEnv {
  protocol: string;
  origin: string;
  href: string;
  userAgent: string;
  scriptSrcs: string[];
}

/** Pure, so it can be exercised without a browser. */
export function parseClientBuild(env: BuildEnv): string | null {
  if (env.protocol !== 'http:' && env.protocol !== 'https:') return null;
  if (/Electron\//.test(env.userAgent || '')) return null;
  for (const src of env.scriptSrcs) {
    let url: URL;
    try { url = new URL(src, env.href); } catch { continue; }
    if (url.origin !== env.origin) continue;
    const m = ENTRY_RE.exec(url.pathname);
    if (m) return m[1];
  }
  return null;
}

let cached: string | null | undefined;

/** This tab's build, or null when the guard does not apply. Read once: the entry script cannot change under a loaded page. */
export function getClientBuild(): string | null {
  if (cached !== undefined) return cached;
  try {
    const scripts = Array.from(document.querySelectorAll('script[type="module"][src]'))
      .map(s => s.getAttribute('src') || '');
    cached = parseClientBuild({
      protocol: location.protocol,
      origin: location.origin,
      href: location.href,
      userAgent: navigator.userAgent,
      scriptSrcs: scripts,
    });
  } catch {
    cached = null;
  }
  return cached;
}

/** True when both builds are known and they differ. An absent side never makes a tab stale. */
export function buildIsStale(clientBuild: string | null, serverBuild: unknown): boolean {
  return !!clientBuild && typeof serverBuild === 'string' && serverBuild.length > 0 && serverBuild !== clientBuild;
}
