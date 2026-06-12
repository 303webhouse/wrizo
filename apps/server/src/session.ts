import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { pool } from './db';
import { env } from './env';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const PgStore = connectPgSimple(session);

export const sessionMiddleware = session({
  store: new PgStore({ pool, createTableIfMissing: true }),
  secret: env.sessionSecret,
  resave: false,
  saveUninitialized: false,
  rolling: true, // 30-day rolling: each response refreshes the cookie
  cookie: {
    httpOnly: true,
    secure: env.isProd,
    sameSite: 'lax',
    maxAge: THIRTY_DAYS_MS,
  },
});
