# GEO-001 Stabilization Plan

Target window: 2026-06-14 through 2026-06-19

## Priority

1. Keep GitHub CI green on every push.
2. Add focused tests for URL auto-reader wrapping, SQL blocking, output truncation, and convert formats.
3. Validate install on one clean Linux environment beyond the VPS.
4. Re-run remote countries smoke daily and record feature count drift.
5. Prepare the GeoLibre RFC for opening by Friday, 2026-06-19.

## Known Data Note

The public `countries.parquet` dataset returned 176 observed features during GEO-001 validation. The original sprint brief expected 252, so tests must assert output shape, byte budget, and successful execution instead of a fixed upstream row count.

## Release Gate

Before the RFC opens:

- CI green on GitHub.
- `npm audit --audit-level=high` clean or documented with a clear mitigation.
- Fresh clone smoke test passes.
- README examples verified against current CLI behavior.
- RFC links point to the public GitHub repo and smoke transcript.
