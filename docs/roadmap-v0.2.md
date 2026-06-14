# v0.2 Roadmap And Issue Candidates

Status: draft planning list, not opened as public issues

Milestone intent: make GEO-001 credible enough for GeoLibre maintainer review after the v0.1.0 public release.

## Release Themes

- Stronger confidence in CLI behavior through focused tests.
- Better format and URL handling for real GeoLibre-adjacent datasets.
- Clearer RFC handoff material for upstream discussion.
- No public upstream actions until the RFC is reviewed locally.

## Candidate Issues

### GEO-002: Focused Regression Tests

Add tests for behavior that v0.1.0 currently validates mostly through smoke commands.

Acceptance:

- URL auto-reader wrapping is covered.
- SQL blocking rejects non-read queries.
- Output truncation and byte limits are covered.
- Convert success and failure paths are covered.

### GEO-003: Clean Install Smoke

Validate the package from a clean Linux environment rather than only the working VPS checkout.

Acceptance:

- Fresh clone or clean package install succeeds.
- `npm ci`, `npm run build`, and `npm test` pass.
- Notes document Node version and platform.

### GEO-004: RFC Evidence Pack

Prepare the evidence needed for the GeoLibre RFC without contacting upstream yet.

Acceptance:

- RFC draft links to https://github.com/89nisham/geolibre-cli.
- RFC draft links to the CI workflow.
- Stable local-fixture transcript is referenced.
- Limitations and non-goals are explicit.

### GEO-005: Format Coverage Triage

Choose the next file-format work based on GeoLibre workflows rather than adding broad GIS support prematurely.

Acceptance:

- Shapefile, GeoPackage, FlatGeobuf, and raster needs are compared.
- One first-class v0.2 target is selected.
- Deferred formats are documented with reasons.

### GEO-006: MCP Contract Hardening

Make MCP responses easier for agents to depend on.

Acceptance:

- Tool output schemas are documented.
- Error codes are stable and documented.
- Placeholder tools either return clear not-implemented responses or move behind an experimental flag.

## RFC Gate For 2026-06-19

- Local CI-equivalent validation passes.
- Public repository and CI links are confirmed.
- README examples are current.
- RFC draft is concise enough for maintainer review.
- No GitHub issues, upstream comments, or public contact happen before local approval.

