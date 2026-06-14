#!/usr/bin/env node
import { Command } from 'commander';
import { inspectCommand } from './commands/inspect.js';
import { sqlCommand } from './commands/sql.js';
import { convertCommand } from './commands/convert.js';
import { processCommand } from './commands/process.js';
import { toAgentError } from './core/errors.js';

async function run(action: () => Promise<string>): Promise<void> {
  try {
    process.stdout.write(`${await action()}\n`);
  } catch (error) {
    process.stderr.write(`${JSON.stringify(toAgentError(error), null, 2)}\n`);
    process.exitCode = 1;
  }
}

const program = new Command();

program
  .name('geolibre')
  .description('Agent-native geospatial CLI')
  .version('0.1.0');

program
  .command('inspect')
  .argument('<input>', 'file path or URL')
  .option('--format <format>', 'json or table', 'json')
  .option('--sample-rows <n>', 'sample rows to include', '3')
  .option('--no-sample', 'skip sample rows')
  .option('--max-bytes <n>', 'maximum JSON output bytes', '2048')
  .action((input, options) => run(() => inspectCommand(input, options)));

program
  .command('sql')
  .argument('<query>', 'DuckDB Spatial SELECT/WITH query')
  .option('--format <format>', 'json or table', 'json')
  .option('--limit <n>', 'max rows to return', '10')
  .option('--max-bytes <n>', 'maximum JSON output bytes', '2048')
  .option('--no-count', 'skip total row count')
  .action((query, options) => run(() => sqlCommand(query, options)));

program
  .command('convert')
  .argument('<input>', 'file path or URL')
  .requiredOption('--to <format>', 'parquet, geojson, or csv')
  .requiredOption('--output <path>', 'output file path')
  .option('--max-bytes <n>', 'maximum JSON output bytes', '2048')
  .action((input, options) => run(() => convertCommand(input, options)));

program
  .command('process')
  .argument('<input>', 'file path or URL')
  .option('--sql <query>', 'optional SELECT query using FROM input')
  .option('--buffer <distance>', 'buffer distance such as 500m, 5km, or 3mi')
  .requiredOption('--output <path>', 'output GeoJSON path')
  .option('--max-bytes <n>', 'maximum JSON output bytes', '2048')
  .action((input, options) => run(() => processCommand(input, options)));

program.parseAsync();
