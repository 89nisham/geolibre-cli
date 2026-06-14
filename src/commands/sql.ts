import { GeoEngine, schemaFromRows } from '../core/engine.js';
import { formatJson, formatTable } from '../core/output.js';
import { rewriteSqlSources } from '../core/readers.js';
import { assertSafeSql, stripTrailingSemicolon } from '../core/sql.js';

interface SqlOptions {
  format?: 'json' | 'table';
  limit?: string;
  maxBytes?: string;
  count?: boolean;
}

export async function sqlCommand(query: string, options: SqlOptions): Promise<string> {
  assertSafeSql(query);
  const engine = new GeoEngine();
  const limit = Number(options.limit ?? 10);
  const maxBytes = Number(options.maxBytes ?? 2048);

  try {
    await engine.autoLoad();
    const rewritten = stripTrailingSemicolon(rewriteSqlSources(query));
    const rows = await engine.all(`SELECT * FROM (${rewritten}) AS geolibre_query LIMIT ${limit};`);
    let totalRows: number | null = null;

    if (options.count !== false) {
      const countRows = await engine.all<{ count: number }>(`SELECT COUNT(*) AS count FROM (${rewritten}) AS geolibre_count;`);
      totalRows = Number(countRows[0]?.count ?? 0);
    }

    const data = {
      query,
      rows,
      totalRows,
      shownRows: rows.length,
      truncated: totalRows === null ? false : totalRows > rows.length,
      schema: schemaFromRows(rows),
    };

    return options.format === 'table' ? formatTable({ rows }) : formatJson(data, { maxBytes });
  } finally {
    await engine.close();
  }
}
