import { existsSync } from 'node:fs';
import { GeoEngine } from '../core/engine.js';
import { detectSourceType, relationForInput, quoteSql } from '../core/readers.js';
import { formatJson } from '../core/output.js';
import { ErrorCodes, GeoError } from '../core/errors.js';

interface ConvertOptions {
  to?: string;
  output?: string;
  maxBytes?: string;
}

export async function convertCommand(input: string, options: ConvertOptions): Promise<string> {
  if (!options.to) throw new GeoError(ErrorCodes.UnsupportedFormat, '--to is required');
  if (!options.output) throw new GeoError(ErrorCodes.FileNotFound, '--output is required');

  const to = options.to.toLowerCase();
  if (!['parquet', 'geojson', 'csv'].includes(to)) {
    throw new GeoError(ErrorCodes.UnsupportedFormat, 'Supported output formats: parquet, geojson, csv', to);
  }

  const engine = new GeoEngine();
  const maxBytes = Number(options.maxBytes ?? 2048);

  try {
    await engine.autoLoad();
    const relation = relationForInput(input);
    const output = options.output;
    const outputSql = quoteSql(output);
    const countRows = await engine.all<{ count: number }>(`SELECT COUNT(*) AS count FROM ${relation};`);

    if (to === 'parquet') {
      await engine.run(`COPY (SELECT * FROM ${relation}) TO ${outputSql} (FORMAT PARQUET);`);
    } else if (to === 'csv') {
      await engine.run(`COPY (SELECT * FROM ${relation}) TO ${outputSql} (HEADER, DELIMITER ',');`);
    } else {
      await engine.run(`COPY (SELECT * FROM ${relation}) TO ${outputSql} WITH (FORMAT GDAL, DRIVER 'GeoJSON');`);
    }

    return formatJson(
      {
        input,
        output,
        inputFormat: detectSourceType(input),
        outputFormat: to,
        features: Number(countRows[0]?.count ?? 0),
        written: existsSync(output),
      },
      { maxBytes },
    );
  } finally {
    await engine.close();
  }
}
