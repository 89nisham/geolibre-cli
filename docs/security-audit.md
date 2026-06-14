# Security Audit Notes

Date: 2026-06-14

`npm audit` initially reported 5 high-severity findings inherited through the `duckdb` install-time dependency tree:

- `duckdb`
- `node-gyp`
- `make-fetch-happen`
- `cacache`
- `tar`

The vulnerable package was `tar@6.2.1`, pulled by `duckdb -> node-gyp@9.4.1`.

## Resolution

`package.json` now uses an npm override:

```json
"overrides": {
  "tar": "7.5.16"
}
```

Validation after the override:

- `npm audit --audit-level=high`: PASS, 0 vulnerabilities
- `npm test`: PASS
- `node scripts/attack.mjs`: PASS
- `node scripts/mcp-smoke.mjs`: PASS

## Revisit

Remove the override when `duckdb` upgrades its bundled `node-gyp` dependency to a version that no longer pulls vulnerable `tar` versions.
