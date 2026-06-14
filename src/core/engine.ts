import duckdb from 'duckdb';
import { ErrorCodes, GeoError } from './errors.js';

export type Row = Record<string, unknown>;

export class GeoEngine {
  private db = new duckdb.Database(':memory:');
  private conn = this.db.connect();
  private loaded = false;

  async autoLoad(): Promise<void> {
    if (this.loaded) return;
    await this.run('INSTALL spatial; LOAD spatial; INSTALL httpfs; LOAD httpfs;');
    this.loaded = true;
  }

  run(sql: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.conn.run(sql, (error) => (error ? reject(new GeoError(ErrorCodes.SqlExecution, error.message)) : resolve()));
    });
  }

  all<T extends Row = Row>(sql: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.conn.all(sql, (error, rows) => {
        if (error) reject(new GeoError(ErrorCodes.SqlExecution, error.message));
        else resolve((rows ?? []) as T[]);
      });
    });
  }

  close(): Promise<void> {
    return new Promise((resolve) => {
      this.conn.close(() => this.db.close(() => resolve()));
    });
  }
}

export function schemaFromRows(rows: Row[]): Record<string, string> {
  const schema: Record<string, string> = {};
  const first = rows[0] ?? {};
  for (const [key, value] of Object.entries(first)) {
    if (value === null || value === undefined) schema[key] = 'NULL';
    else if (Buffer.isBuffer(value) || value instanceof Uint8Array) schema[key] = 'BINARY';
    else schema[key] = typeof value;
  }
  return schema;
}
