#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as z from 'zod/v4';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const cliPath = resolve(__dirname, '../cli.js');

function runCli(args: string[]): Promise<string> {
  return new Promise((resolvePromise, reject) => {
    execFile('node', [cliPath, ...args], { maxBuffer: 10 * 1024 * 1024, timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
      } else {
        resolvePromise(stdout.trim());
      }
    });
  });
}

function textResult(text: string) {
  return {
    content: [{ type: 'text' as const, text }],
  };
}

const server = new McpServer({
  name: 'geolibre-mcp',
  version: '0.1.0',
});

server.registerTool(
  'geolibre_inspect',
  {
    description:
      'Get token-efficient metadata about a geospatial file or URL: format, CRS, extent, feature count, schema, and sample rows.',
    inputSchema: {
      input: z.string().describe('File path or URL to inspect'),
      sample_rows: z.number().default(3).describe('Number of sample rows'),
      max_bytes: z.number().default(2048).describe('Maximum output size in bytes'),
    },
  },
  async ({ input, sample_rows, max_bytes }) =>
    textResult(await runCli(['inspect', input, '--sample-rows', String(sample_rows ?? 3), '--max-bytes', String(max_bytes ?? 2048)])),
);

server.registerTool(
  'geolibre_sql',
  {
    description:
      'Run DuckDB Spatial SELECT/WITH SQL against local or remote geospatial data. URLs in FROM/JOIN are auto-wrapped in readers.',
    inputSchema: {
      query: z.string().describe('DuckDB Spatial SQL query'),
      limit: z.number().default(10).describe('Maximum rows to return'),
      max_bytes: z.number().default(2048).describe('Maximum output size in bytes'),
    },
  },
  async ({ query, limit, max_bytes }) =>
    textResult(await runCli(['sql', query, '--limit', String(limit ?? 10), '--max-bytes', String(max_bytes ?? 2048)])),
);

server.registerTool(
  'geolibre_convert',
  {
    description: 'Convert between supported geospatial formats: GeoJSON, GeoParquet/Parquet, and CSV.',
    inputSchema: {
      input: z.string().describe('Source file path or URL'),
      to: z.enum(['geojson', 'parquet', 'csv']).describe('Target format'),
      output: z.string().describe('Output file path'),
    },
  },
  async ({ input, to, output }) => textResult(await runCli(['convert', input, '--to', to, '--output', output])),
);

server.registerTool(
  'geolibre_vector',
  {
    description:
      'Vector geometry operations: buffer, clip, dissolve, intersection, union, spatial_join. Placeholder for v0.2.',
    inputSchema: {
      operation: z.enum(['buffer', 'clip', 'dissolve', 'intersection', 'union', 'spatial_join']),
      input: z.string(),
      args: z.record(z.string(), z.unknown()).optional(),
    },
  },
  async ({ operation, input }) =>
    textResult(
      JSON.stringify(
        {
          ok: false,
          code: 'GEO_E099',
          tool: 'geolibre_vector',
          operation,
          input,
          message: 'Vector operations are not implemented in v0.1. Use geolibre_sql with DuckDB ST_* functions for now.',
        },
        null,
        2,
      ),
    ),
);

server.registerTool(
  'geolibre_compound',
  {
    description: 'Chain multiple spatial operations in one call. Placeholder for v0.2.',
    inputSchema: {
      input: z.string(),
      pipeline: z.array(z.object({ op: z.string(), args: z.record(z.string(), z.unknown()).optional() })),
      output: z.string(),
    },
  },
  async ({ input, pipeline, output }) =>
    textResult(
      JSON.stringify(
        {
          ok: false,
          code: 'GEO_E099',
          tool: 'geolibre_compound',
          input,
          pipeline,
          output,
          message: 'Compound pipelines are not implemented in v0.1. Use inspect/sql/convert as separate calls.',
        },
        null,
        2,
      ),
    ),
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
