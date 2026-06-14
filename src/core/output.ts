import type { Row } from './engine.js';

export interface OutputOptions {
  maxBytes?: number;
  sampleRows?: number;
}

function simplifyValue(value: unknown): unknown {
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) return `<binary:${value.byteLength} bytes>`;
  if (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).length > 0 &&
    Object.keys(value).every((key) => /^\d+$/.test(key))
  ) {
    return `<binary:${Object.keys(value).length} bytes>`;
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'string' && value.length > 160) return `${value.slice(0, 157)}...`;
  return value;
}

export function simplifyRow(row: Row): Row {
  const next: Row = {};
  for (const [key, value] of Object.entries(row)) {
    next[key] = simplifyValue(value);
  }
  return next;
}

function simplifyData(value: unknown): unknown {
  const simplifiedScalar = simplifyValue(value);
  if (simplifiedScalar !== value) return simplifiedScalar;
  if (Array.isArray(value)) {
    return value.map((item) => (item && typeof item === 'object' ? simplifyData(item) : simplifyValue(item)));
  }
  if (value && typeof value === 'object') {
    const next: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      next[key] = simplifyData(child);
    }
    return next;
  }
  return simplifyValue(value);
}

export function formatJson(data: Record<string, unknown>, options: OutputOptions = {}): string {
  const maxBytes = options.maxBytes ?? 2048;
  const result: Record<string, unknown> = simplifyData(data) as Record<string, unknown>;
  const shrinkSchema = (maxEntries: number) => {
    if (result.schema && typeof result.schema === 'object' && !Array.isArray(result.schema)) {
      const entries = Object.entries(result.schema as Record<string, unknown>);
      if (entries.length > maxEntries) {
        result.schema = Object.fromEntries(entries.slice(0, maxEntries));
        result.schemaTruncated = true;
        result.schemaColumnsShown = maxEntries;
        result.schemaColumnsTotal = entries.length;
      }
    }
  };

  for (const key of ['rows', 'sample']) {
    const rows = result[key];
    if (Array.isArray(rows)) {
      result[key] = rows.slice(0, options.sampleRows ?? rows.length).map((row) =>
        row && typeof row === 'object' ? simplifyRow(row as Row) : simplifyValue(row),
      );
    }
  }

  let text = JSON.stringify({ ...result, bytes: 0 }, null, 2);
  if (Buffer.byteLength(text, 'utf8') > maxBytes) {
    shrinkSchema(16);
    for (const key of ['rows', 'sample']) {
      if (Array.isArray(result[key])) {
        result[key] = (result[key] as unknown[]).slice(0, 1);
      }
    }
    result.truncated = true;
    result.hint = 'Use --limit, --sample-rows, --no-sample, or --max-bytes to control output size';
  }

  text = JSON.stringify({ ...result, bytes: 0 }, null, 2);
  while (Buffer.byteLength(text, 'utf8') > maxBytes && Array.isArray(result.sample) && result.sample.length > 0) {
    result.sample = [];
    result.truncated = true;
    text = JSON.stringify({ ...result, bytes: 0 }, null, 2);
  }
  while (Buffer.byteLength(text, 'utf8') > maxBytes && result.schema && typeof result.schema === 'object') {
    const current = Object.keys(result.schema as Record<string, unknown>).length;
    if (current <= 4) break;
    shrinkSchema(Math.max(4, Math.floor(current / 2)));
    result.truncated = true;
    text = JSON.stringify({ ...result, bytes: 0 }, null, 2);
  }
  while (Buffer.byteLength(text, 'utf8') > maxBytes && Array.isArray(result.rows) && result.rows.length > 0) {
    result.rows = [];
    result.truncated = true;
    text = JSON.stringify({ ...result, bytes: 0 }, null, 2);
  }

  const bytes = Buffer.byteLength(text, 'utf8');
  return JSON.stringify({ ...result, bytes }, null, 2);
}

export function formatTable(data: Record<string, unknown>): string {
  if (Array.isArray(data.rows)) return consoleTable(data.rows as Row[]);
  if (Array.isArray(data.sample)) return consoleTable(data.sample as Row[]);
  return JSON.stringify(data, null, 2);
}

function consoleTable(rows: Row[]): string {
  if (rows.length === 0) return '(no rows)';
  const columns = Object.keys(rows[0] ?? {});
  const lines = [
    columns.join('\t'),
    ...rows.map((row) => columns.map((column) => String(simplifyValue(row[column]) ?? '')).join('\t')),
  ];
  return lines.join('\n');
}
