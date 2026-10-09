#!/usr/bin/env node
// Generates src/lib/dive/api.d.ts from the backend's OpenAPI document.
//
//   node scripts/api-types.mjs            dump the schema offline (uv, no server) and write the file
//   node scripts/api-types.mjs --check    regenerate in memory and fail if the committed file differs
//   node scripts/api-types.mjs --url URL  read the schema from a running backend instead
//
// The offline dump is the source of truth for CI; --url is a convenience for a backend you
// already have running (http://localhost:8300/api/openapi.json under `make up`).
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import openapiTS, { astToString } from 'openapi-typescript';
import * as prettier from 'prettier';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = resolve(root, 'src/lib/dive/api.d.ts');
const args = process.argv.slice(2);
const check = args.includes('--check');
const urlIndex = args.indexOf('--url');
const url = urlIndex >= 0 ? args[urlIndex + 1] : null;

const HEADER = `/**
 * Generated from the backend's OpenAPI document by scripts/api-types.mjs. Do not edit.
 * Regenerate with \`pnpm types\` (or \`make types\`); CI runs \`pnpm types:check\`.
 * Hand-written names that components import live in ./types.ts.
 */

`;

function fail(message) {
  console.error(`api-types: ${message}`);
  process.exit(1);
}

async function fromUrl(source) {
  let response;
  try {
    response = await fetch(source);
  } catch (error) {
    fail(
      `backend not reachable at ${source} (${error.cause?.code ?? error.message}); start it with \`make up\` or drop --url to dump the schema offline`,
    );
  }
  if (!response.ok) fail(`${source} answered ${response.status} ${response.statusText}`);
  return response.json();
}

function fromBackend() {
  const result = spawnSync(
    'uv',
    ['run', '--frozen', '--quiet', 'python', '-m', 'app.openapi_dump'],
    {
      cwd: resolve(root, 'backend'),
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  if (result.error)
    fail(`could not run uv (${result.error.message}); install it from https://docs.astral.sh/uv/`);
  if (result.status !== 0) fail(`dumping the OpenAPI document failed:\n${result.stderr}`);
  return JSON.parse(result.stdout);
}

const schema = url ? await fromUrl(url) : fromBackend();
const body = astToString(await openapiTS(schema, { defaultNonNullable: false }));
const options = (await prettier.resolveConfig(target)) ?? {};
const output = await prettier.format(HEADER + body, { ...options, filepath: target });

if (check) {
  let current = '';
  try {
    current = readFileSync(target, 'utf8');
  } catch {
    fail(`${target} is missing; run \`pnpm types\``);
  }
  if (current !== output)
    fail(
      'src/lib/dive/api.d.ts is out of date with the backend schemas; run `pnpm types` and commit the result',
    );
  console.log('api-types: src/lib/dive/api.d.ts is up to date');
} else {
  writeFileSync(target, output);
  console.log(`api-types: wrote ${target}`);
}
