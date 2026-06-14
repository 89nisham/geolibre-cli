import { writeFile } from 'node:fs/promises';
import buffer from '@turf/buffer';
import { feature, featureCollection } from '@turf/helpers';
import type { Feature, Geometry } from 'geojson';
import { GeoEngine, type Row } from '../core/engine.js';
import { ErrorCodes, GeoError } from '../core/errors.js';
import { formatJson } from '../core/output.js';
import { relationForInput } from '../core/readers.js';
import { assertSafeSql, stripTrailingSemicolon } from '../core/sql.js';

interface ProcessOptions {
  sql?: string;
  buffer?: string;
  output?: string;
  maxBytes?: string;
}

function parseDistance(value: string): { distance: number; units: 'kilometers' | 'meters' | 'miles' } {
  const match = value.match(/^(\d+(?:\.\d+)?)(m|km|mi)$/i);
  if (!match) throw new GeoError(ErrorCodes.UnsupportedFormat, 'Buffer distance must look like 500m, 5km, or 3mi', value);
  const amount = Number(match[1]);
  const unit = match[2]?.toLowerCase();
  if (unit === 'm') return { distance: amount / 1000, units: 'kilometers' };
  if (unit === 'km') return { distance: amount, units: 'kilometers' };
  return { distance: amount, units: 'miles' };
}

function rowToFeature(row: Row): Feature {
  const geometryText = row.__geometry_geojson;
  if (typeof geometryText !== 'string') {
    throw new GeoError(ErrorCodes.SqlExecution, 'Process query must include a geometry column named geom');
  }
  const geometry = JSON.parse(geometryText) as Geometry;
  const properties = { ...row };
  delete properties.__geometry_geojson;
  return feature(geometry, properties);
}

export async function processCommand(input: string, options: ProcessOptions): Promise<string> {
  if (!options.output) throw new GeoError(ErrorCodes.FileNotFound, '--output is required');
  if (!options.buffer) throw new GeoError(ErrorCodes.UnsupportedFormat, 'v0.1 process supports --buffer only');

  const engine = new GeoEngine();
  const maxBytes = Number(options.maxBytes ?? 2048);

  try {
    await engine.autoLoad();
    const relation = relationForInput(input);
    const baseSql = options.sql ? stripTrailingSemicolon(options.sql.replace(/\bFROM\s+input\b/i, 'FROM source')) : 'SELECT * FROM source';
    assertSafeSql(baseSql);

    const rows = await engine.all(`
      WITH source AS (SELECT * FROM ${relation})
      SELECT ST_AsGeoJSON(geom) AS __geometry_geojson, * EXCLUDE (geom)
      FROM (${baseSql}) AS process_query
    `);

    const distance = parseDistance(options.buffer);
    const features = rows.map(rowToFeature);
    const buffered = features.map((item) => buffer(item, distance.distance, { units: distance.units }));
    const collection = featureCollection(buffered.filter(Boolean) as Feature[]);

    await writeFile(options.output, `${JSON.stringify(collection)}\n`);

    return formatJson(
      {
        input,
        operations: [{ op: 'sql', query: options.sql ?? 'SELECT * FROM input' }, { op: 'buffer', distance: options.buffer }],
        output: options.output,
        features: collection.features.length,
      },
      { maxBytes },
    );
  } finally {
    await engine.close();
  }
}
