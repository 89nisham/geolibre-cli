import { existsSync } from 'node:fs';
import { basename } from 'node:path';
import { ErrorCodes, GeoError } from './errors.js';

export type SourceType = 'geojson' | 'parquet' | 'csv' | 'shapefile' | 'unknown';

export function isUrl(input: string): boolean {
  return /^(https?|s3|gs|az):\/\//i.test(input);
}

export function quoteSql(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function normalizedInput(input: string): string {
  if (input.startsWith('s3://') || input.startsWith('gs://') || input.startsWith('az://')) {
    throw new GeoError(
      ErrorCodes.UnsupportedFormat,
      'Cloud object URLs are not yet rewritten automatically',
      input,
    );
  }
  return input;
}

export function detectSourceType(input: string): SourceType {
  const clean = input.split('?')[0]?.toLowerCase() ?? input.toLowerCase();
  if (clean.endsWith('.geojson') || clean.endsWith('.json')) return 'geojson';
  if (clean.endsWith('.parquet') || clean.endsWith('.geoparquet')) return 'parquet';
  if (clean.endsWith('.csv')) return 'csv';
  if (clean.endsWith('.shp') || clean.endsWith('.zip')) return 'shapefile';
  return 'unknown';
}

export function displayName(input: string): string {
  try {
    return isUrl(input) ? new URL(input).pathname.split('/').filter(Boolean).pop() || input : basename(input);
  } catch {
    return basename(input);
  }
}

export function relationForInput(input: string): string {
  const normalized = normalizedInput(input);
  const type = detectSourceType(normalized);

  if (!isUrl(normalized) && !existsSync(normalized)) {
    throw new GeoError(ErrorCodes.FileNotFound, 'Input file does not exist', normalized);
  }

  switch (type) {
    case 'geojson':
    case 'shapefile':
      return `ST_Read(${quoteSql(normalized)})`;
    case 'parquet':
      return `read_parquet(${quoteSql(normalized)})`;
    case 'csv':
      return `read_csv_auto(${quoteSql(normalized)})`;
    default:
      throw new GeoError(ErrorCodes.UnsupportedFormat, 'Unsupported or unknown source format', input);
  }
}

export function rewriteSqlSources(sql: string): string {
  let rewritten = sql.replace(
    /\b(FROM|JOIN)\s+(['"]?)(https?:\/\/[^\s'"),;]+)\2/gi,
    (_match, keyword: string, _quote: string, url: string) => `${keyword} ${relationForInput(url)}`,
  );

  rewritten = rewritten.replace(
    /\b(FROM|JOIN)\s+(['"]?)([^'"\s(),;]+\.(?:geojson|json|parquet|geoparquet|csv|shp|zip))\2/gi,
    (_match, keyword: string, _quote: string, filePath: string) => `${keyword} ${relationForInput(filePath)}`,
  );

  return rewritten;
}
