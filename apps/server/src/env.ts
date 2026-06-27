import dotenv from 'dotenv';
import { resolve } from 'path';

// Load apps/server/.env by explicit path so it works no matter the cwd
// (Railway runs `node apps/server/dist/index.js` from the repo root). On
// Railway there is no .env file and real env vars are injected — this is a
// harmless no-op there.
dotenv.config({ path: resolve(__dirname, '..', '.env') });

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var ${name} (see apps/server/.env.example)`);
  }
  return value;
}

export const env = {
  databaseUrl: required('DATABASE_URL'),
  sessionSecret: required('SESSION_SECRET'),
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  get isProd() {
    return this.nodeEnv === 'production';
  },
};
