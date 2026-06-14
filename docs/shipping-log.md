# Shipping Log

## 2026-06-14 - v0.1.0

GEO-001 shipped as a local MVP and moved into stabilization.

Included:

- CLI commands: `inspect`, `sql`, `convert`, `process`
- MCP tools: `geolibre_inspect`, `geolibre_sql`, `geolibre_convert`
- MCP placeholders: `geolibre_vector`, `geolibre_compound`
- Token-capped JSON output
- Local fixtures and smoke scripts
- Attack harness
- GitHub CI workflow

Validation:

- Engine gate: PASS
- Local CLI smoke: PASS
- MCP smoke: PASS
- Attack harness: PASS
- `npm audit --audit-level=high`: PASS after `tar` override

Data note:

- Remote `countries.parquet` returned 176 observed features during validation. Feature count references now document the observed count instead of assuming 252.
