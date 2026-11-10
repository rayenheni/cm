import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, chmodSync } from 'node:fs';
import path from 'node:path';
import type { StoredArticle, ArticleInput, Reservation, ReservationInput, AdminUser } from '../src/lib/api-types.js';
import { SEED_ARTICLES } from './seed.js';

export function openDatabase(filename: string): DatabaseSync {
  if (filename !== ':memory:') { mkdirSync(path.dirname(filename), { recursive: true }); chmodSync(path.dirname(filename), 0o700); }
  const db = new DatabaseSync(filename);
  if (filename !== ':memory:') chmodSync(filename, 0o600);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE, csrf_token TEXT NOT NULL, expires_at INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
    CREATE TABLE IF NOT EXISTS articles (id TEXT PRIMARY KEY, expertise_id TEXT NOT NULL, image TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('draft','published')), created_at TEXT NOT NULL, updated_at TEXT NOT NULL, published_at TEXT);
    CREATE TABLE IF NOT EXISTS article_translations (article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE, lang TEXT NOT NULL CHECK(lang IN ('fr','ar')), body TEXT NOT NULL, PRIMARY KEY(article_id,lang));
    CREATE TABLE IF NOT EXISTS reservations (id TEXT PRIMARY KEY, idempotency_key TEXT NOT NULL UNIQUE, payload_hash TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, consent_at TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('new','contacted','closed')), name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL, domain TEXT NOT NULL, urgency TEXT NOT NULL, message TEXT NOT NULL, lang TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS reservations_created ON reservations(created_at DESC);
    CREATE INDEX IF NOT EXISTS reservations_status ON reservations(status);
    CREATE TABLE IF NOT EXISTS outbox (reservation_id TEXT PRIMARY KEY REFERENCES reservations(id) ON DELETE CASCADE, status TEXT NOT NULL CHECK(status IN ('disabled','pending','sending','sent','failed')), attempts INTEGER NOT NULL DEFAULT 0, next_attempt_at INTEGER NOT NULL DEFAULT 0, last_error TEXT, sent_at TEXT);
    CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, hits INTEGER NOT NULL, reset_at INTEGER NOT NULL);
  `);
  if (!db.prepare("SELECT value FROM meta WHERE key='articles_seeded'").get()) {
    db.exec('BEGIN IMMEDIATE');
    try {
      for (const article of SEED_ARTICLES) {
        db.prepare('INSERT OR IGNORE INTO articles VALUES (?, ?, ?, ?, ?, ?, ?)').run(article.id, article.expertiseId, article.image, article.status, article.createdAt, article.updatedAt, article.publishedAt);
        for (const [lang, body] of Object.entries(article.translations)) db.prepare('INSERT OR IGNORE INTO article_translations VALUES (?, ?, ?)').run(article.id, lang, JSON.stringify(body));
      }
      db.prepare("INSERT INTO meta VALUES ('articles_seeded','1')").run();
      db.exec('COMMIT');
    } catch (error) { db.exec('ROLLBACK'); throw error; }
  }
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
  db.prepare("UPDATE outbox SET status='pending', next_attempt_at=0 WHERE status='sending'").run();
  return db;
}
export function transaction<T>(db: DatabaseSync, fn: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try { const result = fn(); db.exec('COMMIT'); return result; } catch (error) { db.exec('ROLLBACK'); throw error; }
}
export function getAdmins(db: DatabaseSync): AdminUser[] { return db.prepare('SELECT id,email FROM admins ORDER BY id').all() as unknown as AdminUser[]; }
export function getArticles(db: DatabaseSync, publishedOnly = false): StoredArticle[] {
  const rows = db.prepare(`SELECT * FROM articles ${publishedOnly ? "WHERE status='published'" : ''} ORDER BY COALESCE(published_at,created_at) DESC, id`).all() as unknown as { id: string; expertise_id: string; image: string; status: StoredArticle['status']; created_at: string; updated_at: string; published_at: string | null }[];
  const select = db.prepare('SELECT lang,body FROM article_translations WHERE article_id=?');
  return rows.map(row => {
    const translations: StoredArticle['translations'] = { fr: undefined as never };
    for (const tr of select.all(row.id) as unknown as { lang: 'fr' | 'ar'; body: string }[]) translations[tr.lang] = JSON.parse(tr.body);
    return { id: row.id, expertiseId: row.expertise_id, image: row.image, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at, publishedAt: row.published_at, translations };
  });
}
export function saveArticle(db: DatabaseSync, input: ArticleInput, create: boolean): StoredArticle {
  transaction(db, () => {
    const now = new Date().toISOString();
    const old = db.prepare('SELECT published_at FROM articles WHERE id=?').get(input.id) as { published_at: string | null } | undefined;
    if (create) db.prepare('INSERT INTO articles VALUES (?, ?, ?, ?, ?, ?, ?)').run(input.id, input.expertiseId, input.image, input.status, now, now, input.status === 'published' ? now : null);
    else {
      if (!old) throw new Error('Article not found.');
      db.prepare('UPDATE articles SET expertise_id=?,image=?,status=?,updated_at=?,published_at=? WHERE id=?').run(input.expertiseId, input.image, input.status, now, input.status === 'published' ? old.published_at ?? now : null, input.id);
      db.prepare('DELETE FROM article_translations WHERE article_id=?').run(input.id);
    }
    for (const [lang, body] of Object.entries(input.translations)) db.prepare('INSERT INTO article_translations VALUES (?, ?, ?)').run(input.id, lang, JSON.stringify(body));
  });
  return getArticles(db).find(a => a.id === input.id)!;
}
function mapReservation(row: Record<string, unknown>): Reservation {
  return {
    id: row.id as string, createdAt: row.created_at as string, updatedAt: row.updated_at as string, consentAt: row.consent_at as string,
    status: row.status as Reservation['status'], name: row.name as string, email: row.email as string, phone: row.phone as string, domain: row.domain as string,
    urgency: row.urgency as Reservation['urgency'], message: row.message as string, lang: row.lang as Reservation['lang'],
    notification: { status: row.notification_status as Reservation['notification']['status'], attempts: row.attempts as number },
  };
}
const RESERVATION_SELECT = 'SELECT r.*,o.status AS notification_status,o.attempts FROM reservations r JOIN outbox o ON o.reservation_id=r.id';
export function getReservation(db: DatabaseSync, id: string): Reservation | undefined {
  const row = db.prepare(RESERVATION_SELECT + ' WHERE r.id=?').get(id) as unknown as Record<string, unknown> | undefined;
  return row ? mapReservation(row) : undefined;
}
export function getReservations(db: DatabaseSync): Reservation[] {
  return (db.prepare(RESERVATION_SELECT + ' ORDER BY r.created_at DESC,r.id').all() as unknown as Record<string, unknown>[]).map(mapReservation);
}
export function listReservations(db: DatabaseSync, query: { page: number; limit: number; status?: string; q?: string }) {
  const conditions: string[] = []; const params: (string | number)[] = [];
  if (query.status) { conditions.push('r.status=?'); params.push(query.status); }
  if (query.q) {
    const pattern = '%' + query.q.toLowerCase().replace(/[\\%_]/g, '\\$&') + '%';
    conditions.push("(LOWER(r.name) LIKE ? ESCAPE '\\' OR LOWER(r.email) LIKE ? ESCAPE '\\' OR LOWER(r.domain) LIKE ? ESCAPE '\\' OR LOWER(r.message) LIKE ? ESCAPE '\\')");
    params.push(pattern, pattern, pattern, pattern);
  }
  const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';
  const total = (db.prepare('SELECT COUNT(*) AS n FROM reservations r' + where).get(...params) as unknown as { n: number }).n;
  const rows = db.prepare(RESERVATION_SELECT + where + ' ORDER BY r.created_at DESC,r.id LIMIT ? OFFSET ?').all(...params, query.limit, (query.page - 1) * query.limit) as unknown as Record<string, unknown>[];
  const counts = { new: 0, contacted: 0, closed: 0 };
  for (const row of db.prepare('SELECT status,COUNT(*) AS n FROM reservations GROUP BY status').all() as unknown as { status: keyof typeof counts; n: number }[]) counts[row.status] = row.n;
  return { reservations: rows.map(mapReservation), total, page: query.page, limit: query.limit, counts };
}
export function createReservation(db: DatabaseSync, input: ReservationInput, id: string, key: string, payloadHash: string, mailEnabled: boolean): Reservation {
  const now = new Date().toISOString();
  transaction(db, () => {
    db.prepare('INSERT INTO reservations VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(id, key, payloadHash, now, now, now, 'new', input.name, input.email, input.phone, input.domain, input.urgency, input.message, input.lang);
    db.prepare('INSERT INTO outbox (reservation_id,status) VALUES (?, ?)').run(id, mailEnabled ? 'pending' : 'disabled');
  });
  return getReservation(db, id)!;
}
