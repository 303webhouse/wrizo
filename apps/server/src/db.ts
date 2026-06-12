import { Pool } from 'pg';
import { env } from './env';

// Railway Postgres requires TLS; locally it usually does not. Enabling
// rejectUnauthorized:false in production matches Railway's self-signed chain.
export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.isProd ? { rejectUnauthorized: false } : undefined,
});
