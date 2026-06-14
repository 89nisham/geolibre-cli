# GEO-001 Terminal Demo

This transcript is generated from the local fixtures in `test/fixtures/` so it is stable enough for README screenshots, release notes, and agent handoffs.

## Inspect A GeoJSON File

```console
$ node dist/cli.js inspect test/fixtures/points.geojson
{
  "source": "points.geojson",
  "type": "geojson",
  "features": 5,
  "crs": "unknown",
  "extent": [
    46.6753,
    23.588,
    58.4059,
    26.2285
  ],
  "schema": {
    "id": "INTEGER",
    "name": "VARCHAR",
    "geom": "GEOMETRY"
  },
  "sample": [
    {
      "geom_wkt": "POINT (55.2708 25.2048)",
      "id": 1,
      "name": "Dubai"
    },
    {
      "geom_wkt": "POINT (46.6753 24.7136)",
      "id": 2,
      "name": "Riyadh"
    },
    {
      "geom_wkt": "POINT (51.531 25.2854)",
      "id": 3,
      "name": "Doha"
    }
  ],
  "truncated": false,
  "bytes": 583
}
```

## Query A CSV Directly

```console
$ node dist/cli.js sql "SELECT * FROM test/fixtures/data.csv LIMIT 2" --format table
id	name	lat	lon	shipments
1	Dubai	25.2048	55.2708	120
2	Riyadh	24.7136	46.6753	98
```

## Convert To Parquet

```console
$ node dist/cli.js convert test/fixtures/points.geojson --to parquet --output /tmp/geolibre-points.parquet
{
  "input": "test/fixtures/points.geojson",
  "output": "/tmp/geolibre-points.parquet",
  "inputFormat": "geojson",
  "outputFormat": "parquet",
  "features": 5,
  "written": true,
  "bytes": 196
}
```
