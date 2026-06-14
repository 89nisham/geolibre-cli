# geolibre-cli

Agent-native geospatial data intelligence from the command line.

`geolibre-cli` lets humans and AI agents inspect, query, convert, and lightly process geospatial data without a GUI or cloud subscription. It uses DuckDB Spatial under the hood and keeps outputs small enough for agents to read.

## Install

```bash
npm install
npm run build
npm link
```

## Commands

Inspect a file or URL:

```bash
geolibre inspect https://data.source.coop/giswqs/opengeos/countries.parquet
```

Run SQL with auto-wrapped file paths and URLs:

```bash
geolibre sql "SELECT NAME, POP_EST FROM https://data.source.coop/giswqs/opengeos/countries.parquet WHERE POP_EST > 50000000"
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
npm test
node scripts/attack.mjs
node scripts/mcp-smoke.mjs
```

## Limitations

- v0.1 is not a full GIS engine.
- CRS detection is best-effort and often reports `unknown`.
- Shapefile support depends on DuckDB Spatial/GDAL behavior and is not yet first-class.
- Raster operations are deferred.
- Vector operations beyond the buffer demo are deferred.

