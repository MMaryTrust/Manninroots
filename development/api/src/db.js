// One tiny interface over PostgreSQL: query(text, params) and tx(fn).
// DATABASE_URL set   -> real PostgreSQL via pg (hosted or local).
// DATABASE_URL unset -> in-process PGlite (real Postgres engine, for local dev and tests only).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SCHEMA_FILE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../db/schema.sql');

export async function connect(url = process.env.DATABASE_URL) {
  if (url) {
    const { default: pg } = await import('pg');
    const ssl = /sslmode=require|neon\.tech|supabase\.co/.test(url) ? { rejectUnauthorized: false } : undefined;
    const pool = new pg.Pool({ connectionString: url, ssl, max: 10 });
    return {
      kind: 'pg',
      query: (text, params) => pool.query(text, params),
      exec: (text) => pool.query(text),
      async tx(fn) {
        const c = await pool.connect();
        try {
          await c.query('begin');
          const r = await fn({ query: (t, p) => c.query(t, p) });
          await c.query('commit');
          return r;
        } catch (e) {
          await c.query('rollback').catch(() => {});
          throw e;
        } finally {
          c.release();
        }
      },
      close: () => pool.end(),
    };
  }
  const { PGlite } = await import('@electric-sql/pglite');
  const dir = process.env.PGLITE_DIR; // optional persistent folder; default is in-memory
  const lite = dir ? new PGlite(dir) : new PGlite();
  await lite.waitReady;
  return {
    kind: 'pglite',
    query: (text, params) => lite.query(text, params),
    exec: (text) => lite.exec(text),
    tx: (fn) => lite.transaction((t) => fn({ query: (x, p) => t.query(x, p) })),
    close: () => lite.close(),
  };
}

export async function migrate(db) {
  await db.exec(fs.readFileSync(SCHEMA_FILE, 'utf8'));
}
