import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { createApp } from '../server/app.js';
import { openDatabase, getArticles, getReservations } from '../server/db.js';
import { hashPassword } from '../server/password.js';
import { NotificationWorker, type Mailer } from '../server/mail.js';
import type { ArticleInput, ReservationInput } from '../src/lib/api-types.js';
const origin = 'http://localhost:5173';
const config = { port: 5173, production: false, databasePath: ':memory:', trustProxy: 0, appOrigin: origin, allowPreviewBearer: false, sessionCookie: { secure: false, sameSite: 'strict' as const, partitioned: false } };
let db: DatabaseSync;
let app: ReturnType<typeof createApp>;
let cookie = '';
let csrf = '';
const password = 'Test-admin-password-2026!';
const reservation: ReservationInput = { name: 'Client Test', email: 'client@example.com', phone: '+216 92 166 466', domain: 'Droit des affaires', urgency: 'normal', message: 'Je souhaite une consultation concernant un contrat.', lang: 'fr', consent: true, website: '' };
const article: ArticleInput = { id: 'test-article', expertiseId: 'affaires', image: '', status: 'draft', translations: { fr: { title: 'Test article', category: 'Droit', readTime: '5 min', excerpt: 'Résumé', imageAlt: '', intro: 'Introduction', sections: [{ heading: 'Section', paragraphs: ['Paragraphe'] }], keyPoints: ['Point'] } } };
const write = (method: 'post' | 'put' | 'patch' | 'delete', url: string) => request(app)[method](url).type('json').set('Origin', origin).set('Cookie', cookie).set('X-CSRF-Token', csrf).send({});
before(async () => {
  db = openDatabase(':memory:');
  db.prepare('INSERT INTO admins (email,password_hash,created_at) VALUES (?,?,?)').run('admin@example.com', await hashPassword(password), new Date().toISOString());
  app = createApp({ config, db, disableRateLimits: true });
  const login = await request(app).post('/api/auth/login').set('Origin', origin).send({ email: 'admin@example.com', password });
  assert.equal(login.status, 200);
  cookie = login.headers['set-cookie'][0].split(';')[0]; csrf = login.body.csrfToken;
});
after(() => db.close());

test('health and seeded bilingual articles are public; admin data is not', async () => {
  assert.equal((await request(app).get('/api/health')).status, 200);
  const fr = await request(app).get('/api/articles?lang=fr');
  const ar = await request(app).get('/api/articles?lang=ar');
  assert.equal(fr.body.articles.length, 4); assert.equal(ar.body.articles.length, 4);
  assert.equal(fr.body.articles[0].id, ar.body.articles[0].id);
  assert.notEqual(fr.body.articles[0].title, ar.body.articles[0].title);
  assert.equal((await request(app).get('/api/admin/reservations')).status, 401);
  assert.equal((await request(app).get('/api/admin/articles')).status, 401);
});
test('login uses an HTTP-only session and rejects bad credentials / origins / CSRF', async () => {
  const login = await request(app).post('/api/auth/login').set('Origin', origin).send({ email: 'admin@example.com', password });
  assert.match(login.headers['set-cookie'][0], /HttpOnly/); assert.match(login.headers['set-cookie'][0], /SameSite=Strict/);
  assert.equal((await request(app).post('/api/auth/login').set('Origin', origin).send({ email: 'admin@example.com', password: 'wrong' })).status, 401);
  assert.equal((await request(app).post('/api/reservations').set('Origin', 'https://evil.example').send({})).status, 403);
  assert.equal((await request(app).patch('/api/admin/reservations/x').set('Origin', origin).set('Cookie', cookie).set('Content-Type', 'text/plain').send('status=closed')).status, 415);
  assert.equal((await request(app).post('/api/admin/articles').set('Origin', origin).set('Cookie', cookie).send(article)).status, 403);
});
test('drafts stay private; publishing requires both languages; edits and deletes persist', async () => {
  assert.equal((await write('post', '/api/admin/articles').send(article)).status, 201);
  assert.equal((await request(app).get('/api/articles/test-article')).status, 404);
  assert.equal((await write('put', '/api/admin/articles/test-article').send({ ...article, status: 'published' })).status, 400);
  const ar = { ...article.translations.fr, title: 'مقال اختبار', category: 'قانون', excerpt: 'ملخص', intro: 'مقدمة', sections: [{ heading: 'قسم', paragraphs: ['فقرة'] }], keyPoints: ['نقطة'] };
  assert.equal((await write('put', '/api/admin/articles/test-article').send({ ...article, status: 'published', translations: { ...article.translations, ar } })).status, 200);
  assert.equal((await request(app).get('/api/articles/test-article?lang=ar')).body.article.title, ar.title);
  assert.equal((await write('post', '/api/admin/articles').send(article)).status, 409);
  assert.equal((await write('delete', '/api/admin/articles/test-article')).status, 200);
  assert.equal((await request(app).get('/api/articles/test-article')).status, 404);
});
test('authenticated image uploads validate bytes and remain usable in articles', async () => {
  const mediaPath = mkdtempSync(path.join(tmpdir(), 'cmcb-media-test-'));
  const localApp = createApp({ config: { ...config, mediaPath }, db, disableRateLimits: true });
  const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
  const upload = () => request(localApp).post('/api/admin/media').set('Origin', origin);
  try {
    assert.equal((await upload().send({ data: png })).status, 401);
    assert.equal((await upload().set('Cookie', cookie).send({ data: png })).status, 403);
    assert.equal((await upload().set('Cookie', cookie).set('X-CSRF-Token', csrf).send({ data: Buffer.from('<script>alert(1)</script>').toString('base64') })).status, 400);
    assert.equal((await upload().set('Cookie', cookie).set('X-CSRF-Token', csrf).send({ data: Buffer.alloc(2097153).toString('base64') })).status, 400);
    const result = await upload().set('Cookie', cookie).set('X-CSRF-Token', csrf).send({ data: png });
    assert.equal(result.status, 201); assert.match(result.body.url, /^\/media\/[a-f0-9]{32}\.png$/);
    const image = await request(localApp).get(result.body.url);
    assert.equal(image.status, 200); assert.equal(image.headers['content-type'], 'image/png');
    assert.equal(image.headers['x-content-type-options'], 'nosniff'); assert.deepEqual(image.body, Buffer.from(png, 'base64'));
    const saved = await request(localApp).post('/api/admin/articles').set('Origin', origin).set('Cookie', cookie).set('X-CSRF-Token', csrf).send({ ...article, id: 'image-test', image: result.body.url });
    assert.equal(saved.status, 201); assert.equal(saved.body.article.image, result.body.url);
    assert.equal((await request(localApp).delete('/api/admin/articles/image-test').set('Origin', origin).set('Cookie', cookie).set('X-CSRF-Token', csrf).send({})).status, 200);
    assert.equal((await request(localApp).get('/media/invalid.png')).status, 404);
  } finally { rmSync(mediaPath, { recursive: true, force: true }); }
});
test('article validation rejects script URLs, unknown fields and invalid slugs', async () => {
  assert.equal((await write('post', '/api/admin/articles').send({ ...article, image: 'javascript:alert(1)' })).status, 400);
  assert.equal((await write('post', '/api/admin/articles').send({ ...article, id: 'Bad Slug' })).status, 400);
  assert.equal((await write('post', '/api/admin/articles').send({ ...article, isAdmin: true })).status, 400);
});
test('submissions are durable, validated and idempotent across independent visitors', async () => {
  const key = randomUUID();
  const send = () => request(app).post('/api/reservations').set('Origin', origin).set('Idempotency-Key', key).send(reservation);
  const first = await send(); const retry = await send();
  assert.equal(first.status, 201); assert.equal(retry.status, 200); assert.equal(first.body.id, retry.body.id);
  assert.equal(getReservations(db).length, 1);
  assert.equal((await request(app).post('/api/reservations').set('Origin', origin).set('Idempotency-Key', key).send({ ...reservation, message: 'Different message for the same key.' })).status, 409);
  const otherVisitor = await request(app).post('/api/reservations').set('Origin', origin).set('Idempotency-Key', randomUUID()).send({ ...reservation, lang: 'ar', name: 'عميل آخر' });
  assert.equal(otherVisitor.status, 201);
  const adminView = await request(app).get('/api/admin/reservations').set('Cookie', cookie);
  assert.equal(adminView.body.total, 2);
  assert.equal(adminView.body.reservations[0].notification.status, 'disabled');
  assert.equal((await request(app).post('/api/reservations').set('Origin', origin).set('Idempotency-Key', randomUUID()).send({ ...reservation, consent: false })).status, 400);
  assert.equal((await request(app).post('/api/reservations').set('Origin', origin).set('Idempotency-Key', randomUUID()).send({ ...reservation, website: 'spam' })).status, 400);
});
test('admin filters, searches, updates status, and deletes requests', async () => {
  const id = getReservations(db)[0].id;
  assert.equal((await write('patch', `/api/admin/reservations/${id}`).send({ status: 'contacted' })).status, 200);
  assert.equal((await request(app).get('/api/admin/reservations?status=contacted').set('Cookie', cookie)).body.total, 1);
  assert.equal((await request(app).get('/api/admin/reservations?q=client@example.com').set('Cookie', cookie)).body.total, 2);
  assert.equal((await request(app).get('/api/admin/reservations?limit=1&page=2').set('Cookie', cookie)).body.reservations.length, 1);
  assert.equal((await write('delete', `/api/admin/reservations/${id}`)).status, 200);
  assert.equal((await write('delete', `/api/admin/reservations/${id}`)).status, 404);
});
test('logout revokes the session server-side', async () => {
  const login = await request(app).post('/api/auth/login').set('Origin', origin).send({ email: 'admin@example.com', password });
  const otherCookie = login.headers['set-cookie'][0].split(';')[0];
  assert.equal((await request(app).post('/api/auth/logout').set('Origin', origin).set('Cookie', otherCookie).set('X-CSRF-Token', login.body.csrfToken).send({})).status, 200);
  assert.equal((await request(app).get('/api/admin/articles').set('Cookie', otherCookie)).status, 401);
});
test('password change revokes every session and accepts the new password', async () => {
  assert.equal((await write('post', '/api/auth/password').send({ currentPassword: password, newPassword: 'New-secure-password-2026!' })).status, 200);
  assert.equal((await request(app).get('/api/admin/articles').set('Cookie', cookie)).status, 401);
  const changed = await request(app).post('/api/auth/login').set('Origin', origin).send({ email: 'admin@example.com', password: 'New-secure-password-2026!' });
  assert.equal(changed.status, 200); cookie = changed.headers['set-cookie'][0].split(';')[0]; csrf = changed.body.csrfToken;
});
test('expired sessions are rejected', async () => {
  db.prepare('UPDATE sessions SET expires_at=0').run();
  assert.equal((await request(app).get('/api/admin/articles').set('Cookie', cookie)).status, 401);
});
test('file-backed data survives closing and reopening the database', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'cmcb-test-'));
  const filename = path.join(directory, 'test.sqlite');
  try {
    const first = openDatabase(filename);
    createReservationForTest(first);
    first.close();
    const second = openDatabase(filename);
    assert.equal(getReservations(second).length, 1); assert.equal(getArticles(second).length, 4);
    second.close();
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
function createReservationForTest(database: DatabaseSync) {
  const now = new Date().toISOString();
  database.prepare('INSERT INTO reservations VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(randomUUID(), randomUUID(), 'hash', now, now, now, 'new', reservation.name, reservation.email, reservation.phone, reservation.domain, reservation.urgency, reservation.message, 'fr');
  database.prepare("INSERT INTO outbox (reservation_id,status) SELECT id,'disabled' FROM reservations").run();
}
test('notification outbox retries failures and records successful delivery', async () => {
  const local = openDatabase(':memory:');
  try {
    createReservationForTest(local);
    local.prepare("UPDATE outbox SET status='pending'").run();
    let attempts = 0;
    const mailer: Mailer = { async send() { attempts++; if (attempts === 1) throw new Error('SMTP offline'); } };
    const worker = new NotificationWorker(local, mailer);
    await worker.tick();
    assert.equal(getReservations(local)[0].notification.status, 'pending');
    local.prepare('UPDATE outbox SET next_attempt_at=0').run();
    await worker.tick();
    assert.equal(getReservations(local)[0].notification.status, 'sent');
    await worker.tick(); assert.equal(attempts, 2);
    worker.stop();
  } finally { local.close(); }
});
test('rate limiting rejects brute-force attempts', async () => {
  const local = openDatabase(':memory:');
  try {
    const limited = createApp({ config, db: local });
    for (let i = 0; i < 10; i++) await request(limited).post('/api/auth/login').set('Origin', origin).send({ email: 'missing@example.com', password: 'wrong' });
    assert.equal((await request(limited).post('/api/auth/login').set('Origin', origin).send({ email: 'missing@example.com', password: 'wrong' })).status, 429);
  } finally { local.close(); }
});

test('distributed account login attempts are limited across restarts', async () => {
  const local = openDatabase(':memory:');
  try {
    const proxyConfig = { ...config, trustProxy: 1 };
    let limited = createApp({ config: proxyConfig, db: local });
    for (let i = 0; i < 10; i++) {
      const response = await request(limited).post('/api/auth/login').set('Origin', origin).set('X-Forwarded-For', `192.0.2.${i + 1}`).send({ email: 'Missing@example.com', password: 'wrong' });
      assert.equal(response.status, 401);
    }
    limited = createApp({ config: proxyConfig, db: local });
    assert.equal((await request(limited).post('/api/auth/login').set('Origin', origin).set('X-Forwarded-For', '192.0.2.30').send({ email: 'missing@example.com', password: 'wrong' })).status, 429);
    assert.equal((await request(limited).post('/api/auth/login').set('Origin', origin).set('X-Forwarded-For', '192.0.2.31').send({ email: 'other@example.com', password: 'wrong' })).status, 401);
  } finally { local.close(); }
});
test('invalid NODE_ENV is rejected rather than enabling development settings', async () => {
  const { readConfig } = await import('../server/config.js');
  assert.throws(() => readConfig({ NODE_ENV: 'prodution', PREVIEW_BEARER_AUTH: 'true' }));
});

test('embedded preview opts into partitioned secure cookies without changing the default', async () => {
  const { readConfig } = await import('../server/config.js');
  const strict = readConfig({ NODE_ENV: 'development' });
  assert.deepEqual(strict.sessionCookie, { secure: false, sameSite: 'strict', partitioned: false });
  const embedded = readConfig({ NODE_ENV: 'development', SESSION_COOKIE_SAMESITE: 'none' });
  assert.deepEqual(embedded.sessionCookie, { secure: true, sameSite: 'none', partitioned: true });
  const local = openDatabase(':memory:');
  try {
    local.prepare('INSERT INTO admins (email,password_hash,created_at) VALUES (?,?,?)').run('admin@example.com', await hashPassword(password), new Date().toISOString());
    const embeddedApp = createApp({ config: { ...config, sessionCookie: embedded.sessionCookie }, db: local, disableRateLimits: true });
    const login = await request(embeddedApp).post('/api/auth/login').set('Origin', origin).send({ email: 'admin@example.com', password });
    assert.equal(login.status, 200);
    const raw = login.headers['set-cookie'][0];
    assert.match(raw, /SameSite=None/); assert.match(raw, /Secure/); assert.match(raw, /Partitioned/); assert.match(raw, /HttpOnly/);
    const session = await request(embeddedApp).get('/api/auth/session').set('Cookie', raw.split(';')[0]);
    assert.equal(session.body.authenticated, true);
  } finally { local.close(); }
});
test('failed login is distinguishable from an expired authenticated session', async () => {
  const failed = await request(app).post('/api/auth/login').set('Origin', origin).send({ email: 'admin@example.com', password: 'incorrect' });
  assert.equal(failed.status, 401); assert.equal(failed.body.error.code, 'INVALID_CREDENTIALS');
  const expired = await request(app).get('/api/admin/articles');
  assert.equal(expired.status, 401); assert.equal(expired.body.error.code, 'UNAUTHENTICATED');
});

test('preview Bearer transport is opt-in, development-only, cookie-independent and revocable', async () => {
  const { readConfig } = await import('../server/config.js');
  assert.equal(readConfig({ NODE_ENV: 'development' }).allowPreviewBearer, false);
  assert.equal(readConfig({ NODE_ENV: 'production', APP_ORIGIN: 'https://example.com', PREVIEW_BEARER_AUTH: 'true' }).allowPreviewBearer, false);
  const previewConfig = readConfig({ NODE_ENV: 'development', PREVIEW_BEARER_AUTH: 'true' });
  assert.equal(previewConfig.allowPreviewBearer, true);
  const local = openDatabase(':memory:');
  try {
    local.prepare('INSERT INTO admins (email,password_hash,created_at) VALUES (?,?,?)').run('admin@example.com', await hashPassword(password), new Date().toISOString());
    const preview = createApp({ config: { ...config, allowPreviewBearer: true }, db: local, disableRateLimits: true });
    const login = await previewRequest(preview).post('/api/auth/login').set('Origin', origin).set('X-Auth-Transport', 'bearer').send({ email: 'admin@example.com', password });
    assert.equal(login.status, 200);
    assert.match(login.body.sessionToken, /^[a-f0-9]{64}$/);
    assert.match(login.headers['set-cookie'][0], /Max-Age=0/);
    const auth = `Bearer ${login.body.sessionToken}`;
    const verified = await previewRequest(preview).get('/api/auth/session').set('Authorization', auth);
    assert.equal(verified.body.authenticated, true);
    assert.equal(verified.body.sessionToken, undefined);
    assert.equal((await previewRequest(preview).get('/api/admin/articles').set('Authorization', auth)).status, 200);
    assert.equal((await previewRequest(preview).post('/api/admin/articles').set('Origin', origin).set('Authorization', auth).send(article)).status, 403);
    assert.equal((await previewRequest(preview).post('/api/admin/articles').set('Origin', 'https://evil.example').set('Authorization', auth).set('X-CSRF-Token', login.body.csrfToken).send(article)).status, 403);
    assert.equal((await previewRequest(preview).post('/api/auth/logout').set('Origin', origin).set('Authorization', auth).set('X-CSRF-Token', login.body.csrfToken).send({})).status, 200);
    assert.equal((await previewRequest(preview).get('/api/admin/articles').set('Authorization', auth)).status, 401);
    const normal = await previewRequest(preview).post('/api/auth/login').set('Origin', origin).send({ email: 'admin@example.com', password });
    assert.equal(normal.body.sessionToken, undefined);
    assert.match(normal.headers['set-cookie'][0], /Max-Age=28800/);
  } finally { local.close(); }
});
function previewRequest(app: ReturnType<typeof createApp>) { return request(app); }

test('preview session survives proxies that strip Authorization and transport negotiation header', async () => {
  const local = openDatabase(':memory:');
  try {
    local.prepare('INSERT INTO admins (email,password_hash,created_at) VALUES (?,?,?)').run('admin@example.com', await hashPassword(password), new Date().toISOString());
    const preview = createApp({ config: { ...config, allowPreviewBearer: true }, db: local, disableRateLimits: true });
    const login = await request(preview).post('/api/auth/login').set('Origin', origin).send({ email: 'admin@example.com', password, transport: 'bearer' });
    assert.equal(login.status, 200); assert.match(login.body.sessionToken, /^[a-f0-9]{64}$/);
    const headers = { 'X-CMCB-Session': login.body.sessionToken };
    assert.equal((await request(preview).get('/api/auth/session').set(headers)).body.authenticated, true);
    assert.equal((await request(preview).get('/api/admin/articles').set(headers)).status, 200);
    assert.equal((await request(preview).post('/api/auth/logout').set('Origin', origin).set(headers).set('X-CSRF-Token', login.body.csrfToken).send({})).status, 200);
    assert.equal((await request(preview).get('/api/admin/articles').set(headers)).status, 401);
  } finally { local.close(); }
});
