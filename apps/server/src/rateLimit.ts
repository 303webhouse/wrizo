import type { Request, Response, NextFunction } from 'express';

// Tiny fixed-window in-memory limiter (no new dependency). Sufficient for the
// auth endpoints at tester scale; resets per window per key.
//
// ITEM 224, ROUND 2 — two additions, both additive, neither changes the
// shape existing callers (authRouter) see:
//   - `keyFn`: what identifies "one caller" for this limiter's purposes.
//     Defaults to IP (byte-identical to every pre-existing use). The Tutor
//     route now passes a keyFn that reads the authenticated account instead
//     — an IP-keyed limit is the wrong unit once every caller is signed in
//     (one account behind many IPs, or many accounts behind one IP/NAT,
//     both defeat an IP key either direction).
//   - PRUNING: the map used to grow by one entry per distinct key EVER seen,
//     forever (a slow, unbounded leak at real scale). Each call now sweeps
//     every OTHER key's expired entry too, not just the one it's checking —
//     so the map's size is bounded by currently-active callers, not
//     lifetime history.
export function rateLimit(maxPerWindow: number, windowMs: number, keyFn?: (req: Request) => string) {
  const hits = new Map<string, { count: number; windowStart: number }>();
  const getKey = keyFn ?? ((req: Request) => req.ip || req.socket.remoteAddress || 'unknown');

  return function (req: Request, res: Response, next: NextFunction): void {
    const now = Date.now();
    for (const [k, v] of hits) {
      if (now - v.windowStart >= windowMs) hits.delete(k);
    }

    const key = getKey(req);
    const entry = hits.get(key);

    if (!entry || now - entry.windowStart >= windowMs) {
      hits.set(key, { count: 1, windowStart: now });
      next();
      return;
    }

    if (entry.count >= maxPerWindow) {
      res.status(429).json({ error: 'Too many requests. Try again shortly.' });
      return;
    }

    entry.count += 1;
    next();
  };
}
