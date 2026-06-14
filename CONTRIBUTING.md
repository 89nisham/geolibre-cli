# Contributing

`geolibre-cli` is designed as a small headless companion to GeoLibre-style workflows.

## Architecture

- TypeScript CLI using Commander.
- DuckDB native binding with `spatial` and `httpfs`.
- Thin MCP server that shells out to the CLI.
- Output formatting lives in `src/core/output.ts` and is part of the product contract.

## Development

```bash
npm install
npm run build
npm test
```

Attack and MCP smoke tests:

```bash
node scripts/attack.mjs
node scripts/mcp-smoke.mjs
```

## Design Rules

- Keep default output under 2048 bytes.
- Prefer summaries over raw geometry dumps.
- Add durable error codes for agent recovery.
- Keep MCP thin; put behavior in the CLI.
- Do not add large GIS features unless the core inspect/sql/convert path remains reliable.

## Related Projects

- GeoLibre: https://github.com/opengeos/GeoLibre
- GeoAgent: https://github.com/opengeos/GeoAgent
- geoai-skills: https://github.com/opengeos/geoai-skills

