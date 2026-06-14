# Shipping Log

## 2026-06-14 - GEO-001 Overnight Orchestration Pass

GEO-001 received a multi-agent stabilization pass to make the MVP easier to share, test, and hand off for GeoLibre discussion.

Included:

- README Before/After section for the transport-control-tower use case
- Local-fixture quick start that does not depend on network datasets
- Screenshot-friendly terminal transcript in `docs/demo/terminal-transcript.md`
- Clearer validation commands and limitations
- Focused regression tests for SQL source rewriting, SQL blocking, output truncation, and convert formats
- GeoLibre RFC draft in `docs/rfc-geo-001-geolibre-cli.md`
- v0.2 roadmap draft in `docs/roadmap-v0.2.md`

Validation:

- README/demo commands use existing built CLI output
- Markdown link paths checked locally
- `npm run test:focused`: PASS
- `npm audit --audit-level=high`: PASS
- `npm test`: PASS
- `node scripts/attack.mjs`: PASS
- `node scripts/mcp-smoke.mjs`: PASS

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
