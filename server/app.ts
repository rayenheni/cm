import express, { type Request, type Response, type NextFunction } from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { parseCookie, stringifySetCookie } from 'cookie';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import path from 'node:path';
import { InvalidImage, readImage, saveImage } from './media.js';
import type { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';
import type { Config } from './config.js';
import type { Mailer } from './mail.js';
import type { Article, } from './types.js';
import type { AuthState, ReservationInput } from '../src/lib/api-types.js';
import { createReservation, getAdmins, getArticles, getReservation, listReservations, saveArticle, transaction } from './db.js';
import { hashPassword, verifyPassword } from './password.js';
import { articleSchema, credentialsSchema, reservationPatchSchema, reservationSchema, listQuerySchema } from './validation.js';

class HttpError extends Error { constructor(public status: number, public code: string, message: string) { super(message); } }
const SESSION_COOKIE = 'cmcb_session';
const SESSION_MS = 8 * 60 * 60 * 1000;
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
interface Session { token_hash: string; admin_id: number; email: string; csrf_token: string; expires_at: number }
function sessionOf(req: Request, db: DatabaseSync, allowBearer = false): Session | undefined {
  let token: string | undefined;
  const authorization = req.get('authorization');
  // Some preview proxies remove Authorization/cookies; a dedicated header survives.
  if (allowBearer && req.get('x-cmcb-session')) token = req.get('x-cmcb-session');
  else if (allowBearer && authorization?.startsWith('Bearer ')) token = authorization.slice(7);
  else { try { token = parseCookie(req.headers.cookie ?? '')[SESSION_COOKIE]; } catch { return undefined; } }
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return undefined;
  return db.prepare('SELECT s.*,a.email FROM sessions s JOIN admins a ON a.id=s.admin_id WHERE token_hash=? AND expires_at>?').get(digest(token), Date.now()) as unknown as Session | undefined;
}
function setSessionCookie(res: Response, token: string, policy: Config['sessionCookie'], maxAge = SESSION_MS / 1000): void {
  res.setHeader('Set-Cookie', stringifySetCookie({ name: SESSION_COOKIE, value: token, httpOnly: true, ...policy, path: '/', maxAge }));
}
function newSession(db: DatabaseSync, res: Response, adminId: number, policy: Config['sessionCookie'], bearer = false): AuthState {
  const token = randomBytes(32).toString('hex');
  const csrf = randomBytes(32).toString('hex');
  db.prepare('DELETE FROM sessions WHERE expires_at<?').run(Date.now());
  db.prepare('INSERT INTO sessions VALUES (?, ?, ?, ?)').run(digest(token), adminId, csrf, Date.now() + SESSION_MS);
  if (bearer) setSessionCookie(res, '', policy, 0);
  else setSessionCookie(res, token, policy);
  const user = getAdmins(db).find(a => a.id === adminId)!;
  return { authenticated: true, user, csrfToken: csrf, ...(bearer ? { sessionToken: token } : {}) };
}
function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const session = sessionOf(req, res.locals.db as DatabaseSync, res.locals.allowPreviewBearer as boolean);
  if (!session) { next(new HttpError(401, 'UNAUTHENTICATED', 'Please sign in to continue.')); return; }
  res.locals.session = session;
  next();
}
function requireCsrf(req: Request, _res: Response, next: NextFunction): void {
  const token = req.get('X-CSRF-Token');
  if (!token || token !== (resSession(req).csrf_token)) { next(new HttpError(403, 'CSRF_REJECTED', 'Your session has changed. Sign in again.')); return; }
  next();
}
function resSession(req: Request): Session { return (req.res!.locals.session as Session); }
function localized(article: Article, lang: 'fr' | 'ar') {
  const tr = article.translations[lang]!;
  return { id: article.id, expertiseId: article.expertiseId, image: article.image || 'https://images.pexels.com/photos/261621/pexels-photo-261621.jpeg?auto=compress&cs=tinysrgb&w=1400', ...tr,
    date: new Intl.DateTimeFormat(lang === 'ar' ? 'ar-TN' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Tunis' }).format(new Date(article.publishedAt!)) };
}
export interface AppOptions { config: Config; db: DatabaseSync; mailer?: Mailer | null; disableRateLimits?: boolean; scriptHashes?: string[] }
export function createApp({ config, db, mailer = null, disableRateLimits = false, scriptHashes = [] }: AppOptions) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);
  app.use(helmet({
    contentSecurityPolicy: config.production ? { directives: {
      defaultSrc: ["'self'"], scriptSrc: ["'self'", ...scriptHashes],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'], fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'https:', 'data:'], connectSrc: ["'self'"], frameSrc: ['https://www.openstreetmap.org'],
      objectSrc: ["'none'"], baseUri: ["'self'"], formAction: ["'self'"], frameAncestors: ["'self'"], upgradeInsecureRequests: [],
    } } : false,
    frameguard: config.production ? { action: 'sameorigin' } : false,
    strictTransportSecurity: config.production,
    crossOriginEmbedderPolicy: false,
  }));
  app.use('/api', (_req, res, next) => {
    res.locals.db = db;
    res.locals.allowPreviewBearer = config.allowPreviewBearer;
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.use('/api', (req, _res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const origin = req.get('origin');
    let allowed = false;
    if (config.appOrigin) allowed = origin === config.appOrigin;
    else if (origin) {
      try { const source = new URL(origin); allowed = ['http:', 'https:'].includes(source.protocol) && source.host === req.get('host'); } catch { /* reject malformed origins */ }
    }
    if (!allowed) return next(new HttpError(403, 'ORIGIN_REJECTED', 'Cross-origin writes are not allowed.'));
    const length = req.get('content-length');
    if (req.get('content-type')?.split(';')[0].trim() !== 'application/json' || (length === undefined && !req.get('transfer-encoding')) || length === '0') return next(new HttpError(415, 'JSON_REQUIRED', 'Send a non-empty application/json body.'));
    next();
  });
  app.use('/api/admin/media', (req, res, next) => req.method === 'POST' ? requireAuth(req, res, next) : next(), (req, res, next) => req.method === 'POST' ? requireCsrf(req, res, next) : next(), express.json({ limit: '3mb' }));
  app.use(express.json({ limit: '256kb' }));
  const limit = (windowMs: number, max: number) => rateLimit({ windowMs, limit: max, standardHeaders: 'draft-8', legacyHeaders: false, skip: () => disableRateLimits, handler: (_req, _res, next) => next(new HttpError(429, 'RATE_LIMITED', 'Too many attempts. Please try again later.')) });
  if (!disableRateLimits) app.use('/api', limit(60000, 300));
  const loginLimit = limit(15 * 60000, 10);
  const contactLimit = limit(15 * 60000, 8);
  const mediaLimit = limit(15 * 60000, 30);
  const adminWrite = [requireAuth, requireCsrf];
  const mediaRoot = path.resolve(config.mediaPath ?? 'data/media');
  app.get('/media/:name', async (req, res) => {
    const image = await readImage(mediaRoot, req.params.name);
    if (!image) throw new HttpError(404, 'NOT_FOUND', 'Image introuvable.');
    res.set({ 'Content-Type': image.type, 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; sandbox", 'Cache-Control': 'public, max-age=31536000, immutable' }).send(image.bytes);
  });
  app.post('/api/admin/media', ...adminWrite, mediaLimit, async (req, res) => {
    const input = z.strictObject({ data: z.string().max(2796204) }).parse(req.body);
    try { res.status(201).json({ url: await saveImage(mediaRoot, input.data) }); }
    catch (error) { if (error instanceof InvalidImage) throw new HttpError(400, 'INVALID_IMAGE', error.message); throw error; }
  });
  const language = z.enum(['fr', 'ar']);
  app.get('/api/health', (_req, res) => { db.prepare('SELECT 1').get(); res.json({ status: 'ok' }); });
  app.get('/api/articles', (req, res) => {
    const lang = language.parse(req.query.lang ?? 'fr');
    res.json({ articles: getArticles(db, true).filter(a => a.translations[lang]).map(a => localized(a, lang)) });
  });
  app.get('/api/articles/:id', (req, res) => {
    const lang = language.parse(req.query.lang ?? 'fr');
    const article = getArticles(db, true).find(a => a.id === req.params.id && a.translations[lang]);
    if (!article) throw new HttpError(404, 'NOT_FOUND', 'Article not found.');
    res.json({ article: localized(article, lang) });
  });
  app.get('/api/auth/session', (req, res) => {
    const session = sessionOf(req, db, config.allowPreviewBearer);
    res.json({ authenticated: !!session, user: session ? { id: session.admin_id, email: session.email } : null, csrfToken: session?.csrf_token ?? null } satisfies AuthState);
  });
  app.post('/api/auth/login', loginLimit, async (req, res) => {
    const { email, password, transport } = credentialsSchema.parse(req.body);
    if (!disableRateLimits) {
      // Persist the account limit across application restarts and distinct IPs.
      const now = Date.now(), key = digest(`login-account:${email}`);
      const count = db.prepare(`INSERT INTO rate_limits (key,hits,reset_at) VALUES (?,1,?)
        ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN reset_at<=? THEN 1 ELSE hits+1 END,
        reset_at=CASE WHEN reset_at<=? THEN ? ELSE reset_at END RETURNING hits`).get(key, now + 900000, now, now, now + 900000) as { hits: number };
      if (Math.random() < 0.01) db.prepare('DELETE FROM rate_limits WHERE reset_at<?').run(now);
      if (count.hits > 10) throw new HttpError(429, 'RATE_LIMITED', 'Too many attempts. Please try again later.');
    }
    const admin = db.prepare('SELECT * FROM admins WHERE email=?').get(email) as unknown as { id: number; password_hash: string } | undefined;
    // Always perform a key derivation, including for unknown accounts.
    const valid = await verifyPassword(password, admin?.password_hash ?? 'scrypt$00000000000000000000000000000000$' + '00'.repeat(64));
    if (!admin || !valid) throw new HttpError(401, 'INVALID_CREDENTIALS', 'E-mail ou mot de passe incorrect.');
    const bearer = config.allowPreviewBearer && (req.get('X-Auth-Transport') === 'bearer' || transport === 'bearer');
    const old = sessionOf(req, db, config.allowPreviewBearer);
    if (old) db.prepare('DELETE FROM sessions WHERE token_hash=?').run(old.token_hash);
    res.json(newSession(db, res, admin.id, config.sessionCookie, bearer));
  });
  app.post('/api/auth/logout', (req, res) => {
    const session = sessionOf(req, db, config.allowPreviewBearer);
    if (session) {
      if (req.get('X-CSRF-Token') !== session.csrf_token) throw new HttpError(403, 'CSRF_REJECTED', 'Invalid session token.');
      db.prepare('DELETE FROM sessions WHERE token_hash=?').run(session.token_hash);
    }
    setSessionCookie(res, '', config.sessionCookie, 0);
    res.json({ ok: true });
  });
  app.post('/api/auth/password', requireAuth, requireCsrf, async (req, res) => {
    const input = z.strictObject({ currentPassword: z.string().min(1).max(128), newPassword: z.string().min(12).max(128) }).parse(req.body);
    const admin = db.prepare('SELECT password_hash FROM admins WHERE id=?').get(resSession(req).admin_id) as unknown as { password_hash: string };
    if (!await verifyPassword(input.currentPassword, admin.password_hash)) throw new HttpError(400, 'INVALID_PASSWORD', 'Current password is incorrect.');
    const hash = await hashPassword(input.newPassword);
    transaction(db, () => {
      db.prepare('UPDATE admins SET password_hash=? WHERE id=?').run(hash, resSession(req).admin_id);
      db.prepare('DELETE FROM sessions WHERE admin_id=?').run(resSession(req).admin_id);
    });
    setSessionCookie(res, '', config.sessionCookie, 0);
    res.json({ ok: true });
  });
  app.post('/api/reservations', contactLimit, (req, res) => {
    const input = reservationSchema.parse(req.body) as ReservationInput;
    const key = z.uuid().parse(req.get('Idempotency-Key'));
    const payloadHash = digest(JSON.stringify(input));
    type Existing = { id: string; payload_hash: string } | undefined;
    const existing = db.prepare('SELECT id,payload_hash FROM reservations WHERE idempotency_key=?').get(key) as Existing;
    if (existing) {
      if (existing.payload_hash !== payloadHash) throw new HttpError(409, 'IDEMPOTENCY_CONFLICT', 'This submission key was already used for a different request.');
      res.json({ id: existing.id, persisted: true }); return;
    }
    const id = randomUUID();
    try { createReservation(db, input, id, key, payloadHash, !!mailer); }
    catch (error) {
      // A concurrent retry may have committed after our lookup.
      const concurrent = db.prepare('SELECT id,payload_hash FROM reservations WHERE idempotency_key=?').get(key) as Existing;
      if (!concurrent || concurrent.payload_hash !== payloadHash) throw error;
      res.json({ id: concurrent.id, persisted: true }); return;
    }
    res.status(201).json({ id, persisted: true });
  });
  app.get('/api/admin/articles', requireAuth, (_req, res) => res.json({ articles: getArticles(db) }));
  app.post('/api/admin/articles', ...adminWrite, (req, res) => {
    const input = articleSchema.parse(req.body);
    if (db.prepare('SELECT id FROM articles WHERE id=?').get(input.id)) throw new HttpError(409, 'DUPLICATE_SLUG', 'An article with this slug already exists.');
    res.status(201).json({ article: saveArticle(db, input, true) });
  });
  app.put('/api/admin/articles/:id', ...adminWrite, (req, res) => {
    const input = articleSchema.parse(req.body);
    if (input.id !== req.params.id) throw new HttpError(400, 'IMMUTABLE_SLUG', 'Keep the original slug to preserve article links.');
    if (!db.prepare('SELECT id FROM articles WHERE id=?').get(input.id)) throw new HttpError(404, 'NOT_FOUND', 'Article not found.');
    res.json({ article: saveArticle(db, input, false) });
  });
  app.delete('/api/admin/articles/:id', ...adminWrite, (req, res) => {
    if (!db.prepare('DELETE FROM articles WHERE id=?').run(String(req.params.id)).changes) throw new HttpError(404, 'NOT_FOUND', 'Article not found.');
    res.json({ ok: true });
  });
  app.get('/api/admin/reservations', requireAuth, (req, res) => {
    const query = listQuerySchema.parse(req.query);
    res.json(listReservations(db, query));
  });
  app.patch('/api/admin/reservations/:id', ...adminWrite, (req, res) => {
    const { status } = reservationPatchSchema.parse(req.body);
    if (!db.prepare('UPDATE reservations SET status=?,updated_at=? WHERE id=?').run(status!, new Date().toISOString(), String(req.params.id)).changes) throw new HttpError(404, 'NOT_FOUND', 'Request not found.');
    res.json({ reservation: getReservation(db, String(req.params.id)) });
  });
  app.delete('/api/admin/reservations/:id', ...adminWrite, (req, res) => {
    if (!db.prepare('DELETE FROM reservations WHERE id=?').run(String(req.params.id)).changes) throw new HttpError(404, 'NOT_FOUND', 'Request not found.');
    res.json({ ok: true });
  });
  app.post('/api/admin/reservations/:id/retry', ...adminWrite, (req, res) => {
    if (!mailer) throw new HttpError(409, 'SMTP_DISABLED', 'Configure SMTP on the server first.');
    const result = db.prepare("UPDATE outbox SET status='pending',attempts=0,next_attempt_at=0,last_error=NULL WHERE reservation_id=? AND status IN ('failed','disabled','pending')").run(String(req.params.id));
    if (!result.changes) throw new HttpError(409, 'NOT_RETRYABLE', 'This request has no retryable notification.');
    res.json({ ok: true });
  });
  app.get('/api/admin/system', requireAuth, (_req, res) => res.json({ smtpConfigured: !!mailer, storage: 'sqlite', sessionHours: 8 }));
  app.use('/api', (_req, res) => { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'API endpoint not found.' } }); });
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof HttpError) { res.status(error.status).json({ error: { code: error.code, message: error.message } }); return; }
    if (error instanceof z.ZodError) {
      const fields: Record<string, string> = {};
      for (const issue of error.issues) fields[issue.path.join('.')] = issue.message;
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Please check the submitted fields.', fields } }); return;
    }
    if (error instanceof SyntaxError && 'status' in error && error.status === 400) { res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Invalid JSON body.' } }); return; }
    if (error instanceof Error && 'status' in error && error.status === 413) { res.status(413).json({ error: { code: 'BODY_TOO_LARGE', message: 'The submitted content is too large.' } }); return; }
    console.error('API request failed:', error instanceof Error ? error.name : 'UnknownError');
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'The server could not complete this request. Please try again.' } });
  });
  return app;
}
