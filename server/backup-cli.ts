import { backup } from 'node:sqlite';
import path from 'node:path';
import { mkdirSync, chmodSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { loadLocalEnv } from './config.js';
loadLocalEnv();
const source = path.resolve(process.env.DATABASE_PATH ?? 'data/cmcb.sqlite');
const directory = path.resolve('backups');
mkdirSync(directory, { recursive: true, mode: 0o700 });
const destination = path.join(directory, `cmcb-${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`);
chmodSync(directory, 0o700);
const db = new DatabaseSync(source, { readOnly: true });
try { await backup(db, destination); } finally { db.close(); }
chmodSync(destination, 0o600);
console.log(`Consistent SQLite backup created: ${destination}`);
