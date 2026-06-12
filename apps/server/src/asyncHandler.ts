import type { Request, Response, NextFunction, RequestHandler } from 'express';

// Forward rejected promises from async route handlers to Express's error
// middleware instead of leaving the request hanging.
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
