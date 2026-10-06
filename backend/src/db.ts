import pg from 'pg';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { config } from './config.js';

// las columnas date llegan como texto 'YYYY-MM-DD' (sin corrimientos de zona horaria)
pg.types.setTypeParser(1082, (v) => v);

export const pool = new pg.Pool({ ...(config.databaseUrl ? { connectionString: config.databaseUrl } : {}), max: 10 });

export async function q<T extends pg.QueryResultRow = any>(texto: string, params: unknown[] = []): Promise<T[]> {
  const r = await pool.query<T>(texto, params as any[]);
  return r.rows;
}

export async function tx<T>(fn: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    const r = await fn(c);
    await c.query('COMMIT');
    return r;
  } catch (e) {
    await c.query('ROLLBACK');
    throw e;
  } finally {
    c.release();
  }
}

export async function radicado(prefijo: string, c: { query: pg.PoolClient['query'] } = pool as any): Promise<string> {
  const r = await (c as any).query("SELECT nextval('seq_radicado') AS n");
  return `${prefijo}-${new Date().getFullYear()}-${String(r.rows[0].n).padStart(5, '0')}`;
}

/** Aplica en orden los archivos sql/NNN_*.sql que aún no se hayan ejecutado. */
export async function migrar(): Promise<void> {
  const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'sql');
  const c = await pool.connect();
  try {
    await c.query('SELECT pg_advisory_lock(727827)');
    await c.query('CREATE TABLE IF NOT EXISTS _migraciones (archivo text PRIMARY KEY, aplicado_en timestamptz NOT NULL DEFAULT now())');
    const hechas = new Set((await c.query('SELECT archivo FROM _migraciones')).rows.map((r) => r.archivo));
    const archivos = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();
    for (const archivo of archivos) {
      if (hechas.has(archivo)) continue;
      const sql = await readFile(path.join(dir, archivo), 'utf8');
      await c.query('BEGIN');
      try {
        await c.query(sql);
        await c.query('INSERT INTO _migraciones (archivo) VALUES ($1)', [archivo]);
        await c.query('COMMIT');
      } catch (e) {
        await c.query('ROLLBACK');
        throw e;
      }
    }
  } finally {
    await c.query('SELECT pg_advisory_unlock(727827)').catch(() => {});
    c.release();
  }
}
