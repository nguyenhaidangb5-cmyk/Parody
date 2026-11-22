import { build } from 'esbuild';
import { pathToFileURL } from 'url';
import path from 'path';
const out = path.resolve('node_modules/.cache/validate.mjs');
await build({ entryPoints: ['tests/validate-data.ts'], bundle: true, platform: 'node', format: 'esm', outfile: out, logLevel: 'error' });
await import(pathToFileURL(out).href);
