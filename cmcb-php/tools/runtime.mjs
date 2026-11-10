import { PHP } from '@php-wasm/universal';
import { loadNodeRuntime, createNodeFsMountHandler } from '@php-wasm/node';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export async function runtime(sapi = 'cli-server') {
  const php = new PHP(await loadNodeRuntime('8.3', { emscriptenOptions: { processId: process.pid } }));
  await php.mount('/app', createNodeFsMountHandler(root));
  php.chdir('/app');
  await php.setSapiName(sapi);
  return php;
}
