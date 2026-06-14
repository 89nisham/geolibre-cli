import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

import { formatJson } from '../dist/core/output.js';
import { rewriteSqlSources } from '../dist/core/readers.js';
import { assertSafeSql } from '../dist/core/sql.js';

const repoRoot = resolve(import.meta.dirname, '..');
const cli = join(repoRoot, 'dist/cli.js');
const fixtures = join(repoRoot, 'test/fixtures');

function runCli(args) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

function parseStdout(result) {
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

test('rewrites local paths and URLs in SQL FROM/JOIN clauses to DuckDB readers', () => {
  const rewrittenCsv = rewriteSqlSources('SELECT * FROM test/fixtures/data.csv LIMIT 1');
  assert.match(rewrittenCsv, /FROM read_csv_auto\('test\/fixtures\/data\.csv'\)/);

  const rewrittenGeoJson = rewriteSqlSources('SELECT * FROM "test/fixtures/points.geojson"');
  assert.match(rewrittenGeoJson, /FROM ST_Read\('test\/fixtures\/points\.geojson'\)/);

  const rewrittenParquetJoin = rewriteSqlSources(
    'SELECT * FROM test/fixtures/data.csv d JOIN test/fixtures/data.parquet p ON d.id = p.id',
  );
  assert.match(rewrittenParquetJoin, /FROM read_csv_auto\('test\/fixtures\/data\.csv'\) d/);
  assert.match(rewrittenParquetJoin, /JOIN read_parquet\('test\/fixtures\/data\.parquet'\) p/);

  const rewrittenRemote = rewriteSqlSources(
    'SELECT * FROM https://example.test/points.geojson?token=a JOIN https://example.test/data.csv d ON true',
  );
  assert.match(rewrittenRemote, /FROM ST_Read\('https:\/\/example\.test\/points\.geojson\?token=a'\)/);
  assert.match(rewrittenRemote, /JOIN read_csv_auto\('https:\/\/example\.test\/data\.csv'\) d/);
});

test('blocks unsafe SQL before execution', () => {
  assert.doesNotThrow(() => assertSafeSql('WITH rows AS (SELECT 1 AS id) SELECT * FROM rows'));
  assert.throws(() => assertSafeSql('DROP TABLE deliveries'), /Only SELECT\/WITH queries are allowed/);
  assert.throws(() => assertSafeSql('WITH changed AS (DELETE FROM deliveries) SELECT 1'), /blocked SQL operation/);

  const result = runCli(['sql', 'SELECT * FROM test/fixtures/data.csv; DROP TABLE deliveries']);
  assert.notEqual(result.status, 0);
  const error = JSON.parse(result.stderr);
  assert.equal(error.ok, false);
  assert.equal(error.code, 'GEO_E007');
});

test('formatJson truncates large agent output deterministically', () => {
  const rows = Array.from({ length: 12 }, (_, index) => ({
    id: index + 1,
    name: `Depot ${index + 1}`,
    notes: 'x'.repeat(220),
  }));

  const output = formatJson(
    {
      query: 'SELECT * FROM large_result',
      rows,
      totalRows: rows.length,
      schema: {
        id: 'number',
        name: 'string',
        notes: 'string',
      },
    },
    { maxBytes: 360 },
  );
  const parsed = JSON.parse(output);

  assert.equal(parsed.truncated, true);
  assert.match(parsed.hint, /--limit/);
  assert.equal(parsed.rows.length, 0);
  assert.ok(parsed.bytes <= Buffer.byteLength(output, 'utf8'));
});

test('converts local GeoJSON fixture to parquet, csv, and geojson outputs', () => {
  const dir = mkdtempSync(join(tmpdir(), 'geolibre-cli-'));
  const input = join(fixtures, 'points.geojson');

  for (const format of ['parquet', 'csv', 'geojson']) {
    const output = join(dir, `points.${format}`);
    const result = runCli(['convert', input, '--to', format, '--output', output]);
    const parsed = parseStdout(result);

    assert.equal(parsed.input, input);
    assert.equal(parsed.output, output);
    assert.equal(parsed.inputFormat, 'geojson');
    assert.equal(parsed.outputFormat, format);
    assert.equal(parsed.features, 5);
    assert.equal(parsed.written, true);
    assert.equal(existsSync(output), true);
    assert.ok(statSync(output).size > 0);
  }

  const csvHead = readFileSync(join(dir, 'points.csv'), 'utf8').split('\n')[0] ?? '';
  assert.match(csvHead, /id/);
  assert.match(csvHead, /name/);
});
