# RFC Draft: GEO-001 GeoLibre CLI Companion

Status: draft for GeoLibre discussion

Target submission date: 2026-06-19

Repository: https://github.com/89nisham/geolibre-cli

CI: https://github.com/89nisham/geolibre-cli/actions/workflows/ci.yml

Upstream context: https://github.com/opengeos/GeoLibre

## Summary

`geolibre-cli` is a small command-line and MCP companion for GeoLibre-style workflows. It gives humans and AI agents a headless way to inspect, query, convert, and lightly process geospatial files before opening a full desktop or browser GIS environment.

The v0.1.0 public release focuses on reliable terminal-first primitives:

- Inspect GeoJSON, Parquet, CSV, and URL inputs.
- Run read-only DuckDB SQL over local or remote geospatial data.
- Convert supported vector inputs to Parquet or GeoJSON.
- Return compact JSON or table output that fits agent context windows, CI logs, and issue comments.
- Expose the same core behavior through a thin MCP server.

## Problem

GeoLibre is a capable GIS workbench, but a contributor, analyst, or agent often needs a fast preflight step before a GUI session:

- What kind of file is this?
- How many features or rows are present?
- What is the schema and extent?
- Can this remote dataset be queried?
- Can this input be converted into a format that is easier to share or automate?

Today those checks often require opening a GIS app, writing one-off Python, or pasting large geometry payloads into an agent conversation. That creates friction for QA, transport-control-tower workflows, reproducible bug reports, and CI validation.

## Proposal

Treat `geolibre-cli` as an optional headless companion rather than a replacement for GeoLibre:

- Use the CLI for quick dataset preflight, conversion, and reproducible smoke commands.
- Use MCP tools for agent workflows that need bounded geospatial summaries.
- Keep GeoLibre as the rich visual analysis and editing surface.
- Align examples and future interoperability points with GeoLibre data workflows where useful.

The initial integration request is not to merge code into GeoLibre. It is to open discussion on whether the CLI should become a documented companion workflow, a future package under the GeoLibre ecosystem, or simply an external utility that follows GeoLibre conventions.

## Current v0.1.0 Behavior

Commands:

- `geolibre inspect <file-or-url>`
- `geolibre sql "<select-query>"`
- `geolibre convert <input> --to parquet|geojson --output <path>`
- `geolibre process <input> --sql "<select-query>" --buffer <distance> --output <path>`

MCP tools:

- `geolibre_inspect`
- `geolibre_sql`
- `geolibre_convert`
- `geolibre_vector` placeholder
- `geolibre_compound` placeholder

Validation already represented in the local CI workflow:

- `npm audit --audit-level=high`
- TypeScript build
- CLI smoke tests
- attack harness
- MCP smoke test

## Design Constraints

- Default output must stay small enough for agents to read safely.
- SQL remains read-only and scoped to `SELECT`/`WITH` queries.
- Remote dataset examples should not make tests depend on fixed upstream row counts.
- Geometry payloads should be summarized by default rather than dumped in full.
- MCP should stay thin; CLI behavior remains the product contract.

## Questions For GeoLibre Maintainers

1. Would a headless CLI companion be useful to GeoLibre users and contributors?
2. Should the CLI remain an external project, or should it eventually live under the OpenGeo/GeoLibre ecosystem?
3. Which file formats and GeoLibre workflows should be prioritized for v0.2?
4. Are there naming, command, or output conventions that should change before the CLI becomes more widely documented?
5. Should MCP support remain in this package, or be split into a separate adapter later?

## Non-Goals For This RFC

- Replacing GeoLibre's GUI.
- Adding full GIS editing workflows to the CLI.
- Opening public issues or upstream PRs before maintainers agree on direction.
- Depending on unstable remote dataset counts for test assertions.

## Suggested Next Step

By 2026-06-19, open a public GeoLibre discussion or issue with:

- A short problem statement.
- The v0.1.0 repository link.
- The CI workflow link.
- A stable local-fixture terminal transcript.
- The v0.2 roadmap summary.

