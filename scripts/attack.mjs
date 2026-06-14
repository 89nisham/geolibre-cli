import { execFile } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const bin = new URL('../dist/cli.js', import.meta.url).pathname;

function runCase(name, args, expectFailure = false) {
  return new Promise((resolve) => {
    execFile('node', [bin, ...args], { timeout: 30000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      const output = stdout || stderr;
      const bytes = Buffer.byteLength(output, 'utf8');
      const ok = expectFailure ? Boolean(error) && stderr.includes('"ok": false') : !error;
      resolve({
        name,
        args: ['geolibre', ...args].join(' '),
        ok,
        exitCode: error?.code ?? 0,
        bytes,
        sample: output.slice(0, 500),
      });
    });
  });
}

const cases = [
  runCase('Malformed SQL', ['sql', 'SELECT * FRO'], true),
  runCase('Nonexistent file', ['inspect', '/no/such/file.geojson'], true),
  runCase('Bad URL', ['inspect', 'https://httpstat.us/404'], true),
  runCase('Huge output truncates', ['sql', 'SELECT i, repeat(\'x\', 500) AS payload FROM range(10000) t(i)', '--limit', '1000']),
  runCase('SQL destructive operation blocked', ['sql', 'DROP TABLE users'], true),
  runCase('Binary file unsupported', ['inspect', '/dev/urandom'], true),
  runCase('Empty result', ['sql', 'SELECT * FROM test/fixtures/data.csv WHERE 1=0']),
  runCase('Unicode attributes', ['sql', 'SELECT * FROM test/fixtures/unicode.csv']),
];

const concurrent = await Promise.all([
  runCase('Concurrent command A', ['sql', 'SELECT COUNT(*) AS count FROM test/fixtures/data.csv']),
  runCase('Concurrent command B', ['sql', 'SELECT COUNT(*) AS count FROM test/fixtures/points.geojson']),
]);

const results = [...(await Promise.all(cases)), ...concurrent];
const failed = results.filter((result) => !result.ok);

const lines = [
  '# GEO-001 Attack Results',
  '',
  `Date: ${new Date().toISOString()}`,
  '',
  `Verdict: ${failed.length === 0 ? 'PASS' : 'FAIL'}`,
  '',
  '| Case | Result | Exit | Bytes |',
  '| --- | --- | ---: | ---: |',
  ...results.map((result) => `| ${result.name} | ${result.ok ? 'PASS' : 'FAIL'} | ${result.exitCode} | ${result.bytes} |`),
  '',
  '## Samples',
  '',
  ...results.map((result) => `### ${result.name}\n\nCommand: \`${result.args}\`\n\n\`\`\`text\n${result.sample.trim()}\n\`\`\`\n`),
];

const missionDir = process.env.GEO_MISSION_DIR ?? '/home/jarvis/agent-lab/missions';
await mkdir(missionDir, { recursive: true });
await writeFile(join(missionDir, 'GEO-001-grok-attack.md'), lines.join('\n'));

if (failed.length) {
  process.exitCode = 1;
}
