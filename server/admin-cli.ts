import { loadLocalEnv } from './config.js';
import { openDatabase, transaction } from './db.js';
import { hashPassword, validatePassword } from './password.js';
import { z } from 'zod';
loadLocalEnv();
const email = z.string().trim().toLowerCase().email().parse(process.env.ADMIN_EMAIL);
const password = process.env.ADMIN_PASSWORD ?? '';
validatePassword(password);
const db = openDatabase(process.env.DATABASE_PATH ?? 'data/cmcb.sqlite');
try {
  const hash = await hashPassword(password);
  transaction(db, () => {
    db.prepare('INSERT INTO admins (email,password_hash,created_at) VALUES (?, ?, ?) ON CONFLICT(email) DO UPDATE SET password_hash=excluded.password_hash').run(email, hash, new Date().toISOString());
    db.prepare('DELETE FROM sessions').run();
  });
  console.log(`Admin account saved for ${email}. Existing sessions were revoked.`);
} finally { db.close(); }
