import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import type { Pool } from 'pg';
import { createNetlifyApp, healthErrorCategory, settings } from '../deploy/netlify/server.js';

const fake = (code: string) => Object.assign(new Error('never-log-password-or-hostname'), {code});

test('health categories use only a fixed allowlist and handle nested driver errors', () => {
  assert.equal(healthErrorCategory(fake('28P01')), 'DB_AUTHENTICATION');
  assert.equal(healthErrorCategory(fake('XX000')), 'DB_SERVER_ERROR');
  assert.equal(healthErrorCategory(fake('UNABLE_TO_VERIFY_LEAF_SIGNATURE')), 'DB_TLS_CERTIFICATE');
  assert.equal(healthErrorCategory(fake('ERR_TLS_CERT_ALTNAME_INVALID')), 'DB_TLS_CERTIFICATE');
  assert.equal(healthErrorCategory(fake('ENOTFOUND')), 'DB_DNS');
  assert.equal(healthErrorCategory(fake('ECONNREFUSED')), 'DB_NETWORK');
  assert.equal(healthErrorCategory(new Error('timeout exceeded when trying to connect')), 'DB_TIMEOUT');
  assert.equal(healthErrorCategory(new Error('wrapper', {cause: fake('CERT_HAS_EXPIRED')})), 'DB_TLS_CERTIFICATE');
  assert.equal(healthErrorCategory(new AggregateError([fake('EHOSTUNREACH')])), 'DB_NETWORK');
  assert.equal(healthErrorCategory(fake('private-value')), 'DB_UNKNOWN');
  assert.equal(healthErrorCategory(fake('__proto__')), 'DB_UNKNOWN');
  assert.equal(healthErrorCategory(null), 'DB_UNKNOWN');
});

test('health failure logs a category without leaking error properties to logs or response', async () => {
  const error = fake('28P01'); error.name = 'never-log-password-or-hostname';
  const db = { query: async () => { throw error; } } as unknown as Pool;
  const cfg = settings({APP_ORIGIN:'https://site.example',SUPABASE_URL:'https://project.supabase.co',SUPABASE_SECRET_KEY:'sb_secret_fake_test'});
  const app = createNetlifyApp(db,cfg);
  const logs: string[] = []; const original = console.error;
  console.error = (...args: unknown[]) => { logs.push(args.join(' ')); };
  try {
    const response = await request(app).get('/api/health');
    assert.equal(response.status, 500);
    assert.equal(response.body.error.code, 'INTERNAL_ERROR');
    assert.deepEqual(logs, ['CMCB health diagnostic: DB_AUTHENTICATION', 'Netlify API error: INTERNAL_ERROR']);
    assert(!JSON.stringify(response.body).includes('never-log-password-or-hostname'));
    assert(!logs.join().includes('never-log-password-or-hostname'));
  } finally { console.error = original; }
});
