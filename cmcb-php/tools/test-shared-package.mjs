// Run from cmcb-php with tools/node_modules/.bin/node tools/test-shared-package.mjs.
// Tests a package in a temporary directory; no live MySQL or Apache is used.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash, webcrypto } from 'node:crypto';
import vm from 'node:vm';
import { PHP } from '@php-wasm/universal';
import { loadNodeRuntime, createNodeFsMountHandler } from '@php-wasm/node';
const root = process.cwd();
const dir = mkdtempSync(path.join(tmpdir(), 'cmcb-shared-test-'));
let php;
try {
  const zip = path.join(dir, 'package.zip');
  execFileSync('python3', ['tools/build-shared-package.py', '--output', zip]);
  assert.notEqual(spawnSync('python3', ['tools/build-shared-package.py', '--output', zip]).status, 0, 'must not overwrite existing package');
  execFileSync('python3', ['-m', 'zipfile', '-e', zip, dir]);
  const site = path.join(dir, 'site');
  for (const name of ['.htaccess', 'index.php', 'install.php', '_cmcb/.htaccess', '_cmcb/PROTECTION_TEST.txt', '_cmcb/src/Config.php', '_cmcb/templates/home.php', 'assets/theme.css']) assert(readFileSync(path.join(site,name)).length > 0, name);
  assert(!readdirSync(path.join(site,'_cmcb')).includes('.env'));
  assert(!readdirSync(path.join(site,'_cmcb')).includes('.install-key'));
  const source = readFileSync(path.join(dir,'outils-local/preparer-cle.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert(source);
  let handler, blob, filename;
  const elements = Object.fromEntries(['generate','error','result','key'].map(id => [id, { hidden: true, textContent: '', disabled:false, addEventListener: (_event, fn) => {handler=fn;} }]));
  const document = { getElementById: id => elements[id], body: {append(){}}, createElement: () => ({set href(_v){},set download(v){filename=v;},click(){},remove(){}}) };
  vm.runInNewContext(source, {document, crypto:webcrypto, TextEncoder, Uint8Array, Blob, Error, URL:{createObjectURL: b => {blob=b;return 'blob:test';},revokeObjectURL(){}}, setTimeout: () => {} });
  await handler.call(elements.generate);
  const key = elements.key.textContent; assert.match(key, /^[a-f0-9]{64}$/); assert.equal(filename,'.install-key');
  assert.equal(await blob.text(), createHash('sha256').update(key).digest('hex'));
  assert.equal(elements.generate.disabled,true);
  console.log('PASS offline activation produces a private random key and a matching hash file.');

  php = new PHP(await loadNodeRuntime('8.3', { emscriptenOptions: {processId:process.pid} }));
  await php.mount('/web', createNodeFsMountHandler(site));
  php.chdir('/web'); await php.setSapiName('cli-server');
  const run = (script, uri) => php.run({scriptPath:'/web/'+script, relativeUri:uri, method:'GET', headers:{host:'cmcb.test'},
    $_SERVER:{REQUEST_METHOD:'GET',REQUEST_URI:uri,REMOTE_ADDR:'127.0.0.1',HTTP_HOST:'cmcb.test',SCRIPT_NAME:'/'+script},
    env:{APP_ENV:'development',DB_DRIVER:'sqlite',DATABASE_PATH:'/web/_cmcb/data/test.sqlite',PREVIEW_BEARER_AUTH:'false'} });
  const home = await run('index.php','/');
  assert.equal(home.httpStatusCode,200,home.text); assert(home.text.includes('/assets/theme.css'));
  const installer = await run('install.php','/install.php'); assert.equal(installer.httpStatusCode,404); assert(installer.text.includes('Installation fermée'));
  writeFileSync(path.join(site,'.htaccess'),'# missing protection');
  const blocked = await run('index.php','/'); assert.equal(blocked.httpStatusCode,503); assert(blocked.text.includes('Protection du dossier privé'));
  console.log('PASS packaged PHP boots at /, installer stays closed, and modified guard fails closed.');
  console.log('Apache .htaccess enforcement and real MySQL/TLS must be tested on the target host.');
} finally { php?.exit(); rmSync(dir,{recursive:true,force:true}); }
