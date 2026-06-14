# geolibre-cli

Agent-native geospatial data intelligence from the command line.

`geolibre-cli` lets humans and AI agents inspect, query, convert, and lightly process geospatial data without a GUI or cloud subscription. It uses DuckDB Spatial under the hood and keeps outputs small enough for agents to read.

## What GEO-001 Solves

Before `geolibre-cli`, a quick geospatial sanity check often meant opening a desktop GIS tool, writing one-off Python, or copying large geometry payloads into an agent chat. That slows down transport-control-tower work where the first question is usually simple: what is in this file, how large is it, and can I query it?

After GEO-001, the same handoff can happen from a terminal:

- Inspect GeoJSON, Parquet, CSV, and remote URL inputs.
- Query local or remote datasets with DuckDB SQL.
- Convert supported vector inputs to Parquet or GeoJSON.
- Return compact JSON or table output that is practical for agents, CI logs, and issue comments.

## Quick Start

```bash
npm install
npm run build
```

Run against the included demo fixtures:

```bash
node dist/cli.js inspect test/fixtures/points.geojson
node dist/cli.js sql "SELECT * FROM test/fixtures/data.csv LIMIT 2" --format table
node dist/cli.js convert test/fixtures/points.geojson --to parquet --output /tmp/geolibre-points.parquet
```

For a global local command during development:

```bash
npm link
geolibre inspect test/fixtures/points.geojson
```

## Demo Output

Screenshot-friendly terminal output is captured in [docs/demo/terminal-transcript.md](docs/demo/terminal-transcript.md). The short version:

```console
$ node dist/cli.js inspect test/fixtures/points.geojson --format table
geom_wkt	id	name
POINT (55.2708 25.2048)	1	Dubai
POINT (46.6753 24.7136)	2	Riyadh
POINT (51.531 25.2854)	3	Doha
```

## Common Commands

Inspect a file or URL:

```bash
geolibre inspect https://data.source.coop/giswqs/opengeos/countries.parquet
```

Run SQL with auto-wrapped file paths and URLs:

```bash
geolibre sql "SELECT NAME, POP_EST FROM https://data.source.coop/giswqs/opengeos/countries.parquet WHERE POP_EST > 50000000"
```

Run SQL against a local fixture without opening a GIS app:

```bash
node dist/cli.js sql "SELECT name, shipments FROM test/fixtures/data.csv ORDER BY shipments DESC LIMIT 3" --format table
```

Convert formats:

```bash
geolibre convert test/fixtures/points.geojson --to parquet --output /tmp/points.parquet
```

Run a small compound process:

```bash
geolibre process https://data.source.coop/giswqs/opengeos/countries.parquet \
  --sql "SELECT * FROM input WHERE CONTINENT = 'Europe'" \
  --buffer 50km \
  --output /tmp/europe-buffered.geojson
```

## Output Philosophy

Default JSON output is capped at 2048 bytes. Large rows, geometry blobs, wide schemas, and long strings are summarized so agents do not waste context on raw coordinates or massive schemas.

Common flags:

- `--max-bytes 2048`
- `--sample-rows 3`
- `--no-sample`
- `--limit 10`
- `--format json|table`

## MCP Server

Build and run:

```bash
npm run build
node dist/mcp/server.js
```

Tools exposed:

- `geolibre_inspect`
- `geolibre_sql`
- `geolibre_convert`
- `geolibre_vector` placeholder
- `geolibre_compound` placeholder

## Validation

```bash
npm run build
npm audit --audit-level=high
npm test
node scripts/attack.mjs
node scripts/mcp-smoke.mjs
```

GitHub CI runs the same audit, build, CLI smoke, attack harness, and MCP smoke checks.

## Data Notes

The public `countries.parquet` example is an upstream dataset and may change over time. During GEO-001 validation on 2026-06-14 it returned 176 observed features. Tests assert successful structured output and byte limits rather than a fixed feature count.

## Security Notes

`npm audit` is clean at the high-severity gate. The project currently uses an npm override to force `tar@7.5.16` because the current `duckdb` install-time dependency chain still pulls an older vulnerable `tar` through `node-gyp`. See `docs/security-audit.md`.

## Limitations

- v0.1 is not a full GIS engine.
- CRS detection is best-effort and often reports `unknown`.
- Shapefile support depends on DuckDB Spatial/GDAL behavior and is not yet first-class.
- Raster operations are deferred.
- Vector operations beyond the buffer demo are deferred.
- SQL support is scoped to `SELECT` and `WITH` read queries.
- Remote demo datasets can change or disappear; the local fixtures are the stable demo path.
- Output caps intentionally summarize large values, so use a higher `--max-bytes` when you need more raw detail.
