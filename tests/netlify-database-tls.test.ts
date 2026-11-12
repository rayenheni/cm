import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { connect, createServer, type ConnectionOptions } from 'node:tls';
import { once } from 'node:events';
import { Client } from 'pg';
import { databaseTlsOptions, DatabaseCaError } from '../deploy/netlify/database-tls.js';
import { handler } from '../netlify/functions/api.js';

// All certificates are generated specifically for this test in a temp directory.
// The TLS listener is local; this does not connect to Supabase or PostgreSQL.
test('database TLS uses the configured CA and rejects wrong CA and hostname', async (t) => {
  if (spawnSync('openssl', ['version']).status !== 0) return t.skip('OpenSSL is needed to generate disposable test certificates');
  const dir = mkdtempSync(path.join(tmpdir(), 'cmcb-tls-test-'));
  const file = (name: string) => path.join(dir, name);
  const openssl = (...args: string[]) => execFileSync('openssl', args, {stdio:'ignore'});
  try {
    for (const name of ['ca', 'other']) {
      openssl('req','-x509','-newkey','rsa:2048','-nodes','-days','1','-subj',`/CN=${name}-test-only`,
        '-addext','basicConstraints=critical,CA:TRUE','-keyout',file(`${name}.key`),'-out',file(`${name}.pem`));
    }
    openssl('req','-new','-newkey','rsa:2048','-nodes','-subj','/CN=db.example.test','-keyout',file('server.key'),'-out',file('server.csr'));
    writeFileSync(file('ext.cnf'), 'basicConstraints=critical,CA:FALSE\nkeyUsage=digitalSignature,keyEncipherment\nextendedKeyUsage=serverAuth\nsubjectAltName=DNS:db.example.test,IP:127.0.0.1\n');
    openssl('x509','-req','-days','1','-in',file('server.csr'),'-CA',file('ca.pem'),'-CAkey',file('ca.key'),'-CAcreateserial','-extfile',file('ext.cnf'),'-out',file('server.pem'));
    const ca = readFileSync(file('ca.pem'),'utf8');
    const other = readFileSync(file('other.pem'),'utf8');
    const leaf = readFileSync(file('server.pem'),'utf8');
    const options = databaseTlsOptions({SUPABASE_DB_CA_PEM:ca});
    assert.equal(options.rejectUnauthorized, true);
    assert.equal(options.ca, ca);
    assert.deepEqual(databaseTlsOptions({}), {rejectUnauthorized:true});
    assert.deepEqual(databaseTlsOptions({SUPABASE_DB_CA_PEM:ca.replace(/\n/g,'\\n')}), options);
    for (const bad of ['', 'not-a-certificate', leaf, ca + '\n-----BEGIN PRIVATE KEY-----\nprivate\n-----END PRIVATE KEY-----', 'x'.repeat(17000)]) {
      assert.throws(() => databaseTlsOptions({SUPABASE_DB_CA_PEM:bad}), (err: unknown) => err instanceof DatabaseCaError && err.message === 'Invalid database CA certificate.');
    }
    const client = new Client({ connectionString:'postgres://user:password@db.example.test/test', ssl:options });
    const parameters = (client as unknown as {connectionParameters:{ssl:unknown}}).connectionParameters;
    assert.deepEqual(parameters.ssl, options, 'pg receives both the CA and verification requirement');

    const server = createServer({key:readFileSync(file('server.key')),cert:leaf}, socket => socket.end());
    server.on('tlsClientError', () => {});
    server.listen(0,'127.0.0.1'); await once(server,'listening');
    const addr = server.address(); assert(addr && typeof addr !== 'string');
    const handshake = (ssl: ConnectionOptions, servername: string) => new Promise<void>((resolve,reject) => {
      const socket = connect({ ...ssl, host:'127.0.0.1', port:addr.port, servername });
      socket.once('secureConnect', () => { socket.destroy(); resolve(); });
      socket.once('error', reject);
    });
    try {
      await handshake(options,'db.example.test');
      await assert.rejects(handshake(databaseTlsOptions({SUPABASE_DB_CA_PEM:other}),'db.example.test'));
      await assert.rejects(handshake(databaseTlsOptions({}),'db.example.test'));
      await assert.rejects(handshake(options,'wrong.example.test'), (err: unknown) => (err as NodeJS.ErrnoException).code === 'ERR_TLS_CERT_ALTNAME_INVALID');
    } finally { server.close(); await once(server,'close'); }

  } finally { rmSync(dir,{recursive:true,force:true}); }
});

test('invalid CA fails closed at function bootstrap without leaking its contents', async () => {
  const previous = {...process.env};
  Object.assign(process.env, {APP_ORIGIN:'https://site.example', SUPABASE_URL:'https://project.supabase.co', SUPABASE_SECRET_KEY:'sb_secret_fake_test', SUPABASE_DB_URL:'postgres://user:password@db.example.test/db', SUPABASE_DB_CA_PEM:'private-canary-not-a-certificate'});
  const logs: string[] = []; const original = console.error;
  console.error = (...args: unknown[]) => logs.push(args.join(' '));
  try {
    const result = await handler({path:'/api/health'}, {}) as {statusCode:number;body:string};
    assert.equal(result.statusCode,503);
    assert.deepEqual(logs,['Netlify bootstrap: INVALID_DB_CA']);
    assert(!result.body.includes('private-canary'));
    assert(!logs.join().includes('private-canary'));
  } finally { console.error = original; process.env = previous; }
});
