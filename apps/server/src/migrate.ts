import { readFileSync } from 'fs';
import { join } from 'path';
import { pool } from './db';

// Run the initial migration on boot if the schema is absent. A single guard on
// the `users` table is enough at this scale (W3).
export async function runMigrations(): Promise<void> {
  const { rows } = await pool.query(
    `select to_regclass('public.users') as exists`,
  );
  if (rows[0]?.exists) {
    return;
  }
  const sql = readFileSync(join(__dirname, '..', 'migrations', '001_init.sql'), 'utf8');
  await pool.query(sql);
  // eslint-disable-next-line no-console
  console.log('[migrate] applied 001_init.sql');
}
