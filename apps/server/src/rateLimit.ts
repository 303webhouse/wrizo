import type { Request, Response, NextFunction } from 'express';

// Tiny fixed-window in-memory limiter (no new dependency). Sufficient for the
// auth endpoints at tester scale; resets per window per IP.
export function rateLimit(maxPerWindow: number, windowMs: number) {
  const hits = new Map<string, { count: number; windowStart: number }>();

  return function (req: Request, res: Response, next: NextFunction): void {
    const now = Date.now();
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const entry = hits.get(ip);

    if (!entry || now - entry.windowStart >= windowMs) {
      hits.set(ip, { count: 1, windowStart: now });
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
