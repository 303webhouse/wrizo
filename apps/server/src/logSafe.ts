// ITEM 224, ROUND 2 — every server log line names an error CODE and, where
// one exists, a RECORD ID — never the raw error object (whose message/stack
// can carry a user's own words, e.g. a thrown SDK error that echoes back
// part of the request body) and never a user-supplied value directly.
//
// `errorCode` reads whichever identifying field an error actually has
// (Postgres's own `.code`, an HTTP client's `.status`, or falls back to
// `.name`/the generic 'unknown') — never `.message`, which is exactly the
// field most likely to carry something a user typed.
export function errorCode(err: unknown): string {
  const e = err as { code?: unknown; status?: unknown; statusCode?: unknown; name?: unknown } | null | undefined;
  const code = e?.code ?? e?.status ?? e?.statusCode ?? e?.name;
  return code != null ? String(code) : 'unknown';
}

/** `extra` is for values the CALLER already knows are safe to log (a record
 *  id, a route name) — never pass anything read from the error itself here. */
export function logError(label: string, err: unknown, extra?: Record<string, string | number>): void {
  const parts = [`code=${errorCode(err)}`];
  if (extra) for (const [k, v] of Object.entries(extra)) parts.push(`${k}=${v}`);
  // eslint-disable-next-line no-console
  console.error(`[${label}] ${parts.join(' ')}`);
}
