// Integration check for the sandbox proxy replacing Host with its internal address.
// Uses the existing development preview account, without printing its credentials.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomInt } from 'node:crypto';

const sandbox = process.env.E2B_SANDBOX_ID || '';
if (!/^[a-z0-9-]+$/i.test(sandbox)) throw new Error('E2B_SANDBOX_ID is required for this preview-specific test.');
const env = Object.fromEntries(readFileSync('.env', 'utf8').split(/\r?\n/).filter(line => /^[A-Z0-9_]+=/.test(line)).map(line => { const at = line.indexOf('='); return [line.slice(0, at), line.slice(at + 1)]; }));
assert.equal(env.APP_ENV, 'development');
assert.equal(env.PREVIEW_BEARER_AUTH, 'true');
assert(!env.APP_ORIGIN, 'This test requires the automatically derived preview origin.');
assert(env.ADMIN_EMAIL && env.ADMIN_PASSWORD, 'Preview account credentials must be present in the local .env.');
const port = process.env.PORT || '8080';
const base = `http://127.0.0.1:${port}`;
const origin = `https://${port}-${sandbox}.e2b.app`;
const ip = `192.0.2.${randomInt(1, 255)}`;
const common = { 'content-type': 'application/json', 'x-forwarded-proto': 'https', 'x-forwarded-for': ip };
const credentials = JSON.stringify({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD, transport: 'bearer' });
async function post(path, headers, body = credentials) {
  const res = await fetch(base + path, { method: 'POST', headers: { ...common, ...headers }, body });
  return { status: res.status, body: await res.json() };
}
const denied = await post('/api/auth/login', { origin: 'https://attacker.example', 'x-forwarded-host': 'attacker.example', 'sec-fetch-site': 'same-origin' });
assert.equal(denied.status, 403); assert.equal(denied.body.error.code, 'ORIGIN_REJECTED');
const deniedMetadata = await post('/api/auth/login', { origin, 'sec-fetch-site': 'cross-site' });
assert.equal(deniedMetadata.status, 403); assert.equal(deniedMetadata.body.error.code, 'ORIGIN_REJECTED');
const login = await post('/api/auth/login', { origin, 'sec-fetch-site': 'same-origin' });
assert.equal(login.status, 200); assert(login.body.sessionToken && login.body.csrfToken);
const session = await fetch(base + '/api/auth/session', { headers: { 'x-cmcb-session': login.body.sessionToken } });
assert.equal((await session.json()).authenticated, true);
const logout = await post('/api/auth/logout', { origin, 'sec-fetch-site': 'same-origin', 'x-cmcb-session': login.body.sessionToken, 'x-csrf-token': login.body.csrfToken }, '{}');
assert.equal(logout.status, 200);
// The next request must not inherit the previous request's external APP_ORIGIN.
const local = await post('/api/auth/login', { origin: base, 'sec-fetch-site': 'same-origin', 'x-forwarded-proto': 'http' }, JSON.stringify({ email: env.ADMIN_EMAIL, password: 'incorrect' }));
assert.equal(local.status, 401); assert.equal(local.body.error.code, 'INVALID_CREDENTIALS');
console.log('PASS preview proxy: login/session/logout, local request isolation, and cross-origin rejection.');
