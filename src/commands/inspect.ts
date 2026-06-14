import { GeoEngine } from '../core/engine.js';
import { detectSourceType, displayName, relationForInput } from '../core/readers.js';
import { formatJson, formatTable } from '../core/output.js';

interface InspectOptions {
  format?: 'json' | 'table';
  sampleRows?: string;
  sample?: boolean;
  maxBytes?: string;
}

export async function inspectCommand(input: string, options: InspectOptions): Promise<string> {
  const engine = new GeoEngine();
  const sampleRows = Number(options.sampleRows ?? 3);
  const maxBytes = Number(options.maxBytes ?? 2048);

  try {
    await engine.autoLoad();
    const relation = relationForInput(input);
    const schemaRows = await engine.all<{ column_name: string; column_type: string }>(`DESCRIBE SELECT * FROM ${relation};`);
    const countRows = await engine.all<{ count: number }>(`SELECT COUNT(*) AS count FROM ${relation};`);
    let sampleQuery = `SELECT * FROM ${relation} LIMIT ${sampleRows};`;

    let extent: unknown = null;
    let crs = 'unknown';
    const geomColumn = schemaRows.find((row) => row.column_type.toUpperCase().includes('GEOMETRY'))?.column_name;
    if (geomColumn) {
      sampleQuery = `SELECT ST_AsText(${geomColumn}) AS ${geomColumn}_wkt, * EXCLUDE (${geomColumn}) FROM ${relation} LIMIT ${sampleRows};`;
      const extentRows = await engine.all<{ xmin: number; ymin: number; xmax: number; ymax: number }>(
        `SELECT ST_XMin(ST_Extent_Agg(${geomColumn})) AS xmin, ST_YMin(ST_Extent_Agg(${geomColumn})) AS ymin, ST_XMax(ST_Extent_Agg(${geomColumn})) AS xmax, ST_YMax(ST_Extent_Agg(${geomColumn})) AS ymax FROM ${relation};`,
      );
      const bounds = extentRows[0];
      extent = bounds ? [bounds.xmin, bounds.ymin, bounds.xmax, bounds.ymax] : null;
      try {
        const sridRows = await engine.all<{ srid: number }>(`SELECT ST_SRID(${geomColumn}) AS srid FROM ${relation} WHERE ${geomColumn} IS NOT NULL LIMIT 1;`);
        crs = sridRows[0]?.srid ? `EPSG:${sridRows[0].srid}` : 'unknown';
      } catch {
        crs = 'unknown';
      }
    }
    const sample = options.sample === false ? [] : await engine.all(sampleQuery);

    const data = {
      source: displayName(input),
      type: detectSourceType(input),
      features: countRows[0]?.count ?? 0,
      crs,
      extent,
      schema: Object.fromEntries(schemaRows.map((row) => [row.column_name, row.column_type])),
      sample,
      truncated: false,
    };

    return options.format === 'table' ? formatTable({ sample }) : formatJson(data, { maxBytes, sampleRows });
  } finally {
    await engine.close();
  }
}
