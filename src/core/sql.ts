import { ErrorCodes, GeoError } from './errors.js';

const blocked = /\b(drop|delete|update|insert|alter|create|copy|install|load|attach|detach|pragma)\b/i;

export function assertSafeSql(sql: string): void {
  const trimmed = sql.trim();
  if (!/^(select|with)\b/i.test(trimmed)) {
    throw new GeoError(ErrorCodes.UnsafeSql, 'Only SELECT/WITH queries are allowed in geolibre sql');
  }
  if (blocked.test(trimmed)) {
    throw new GeoError(ErrorCodes.UnsafeSql, 'Query contains a blocked SQL operation');
  }
}

export function stripTrailingSemicolon(sql: string): string {
  return sql.trim().replace(/;+$/, '');
}
