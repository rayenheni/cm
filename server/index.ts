import { createServer } from 'node:http';
import path from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import express from 'express';
import { loadLocalEnv, readConfig } from './config.js';
import { openDatabase, getAdmins } from './db.js';
import { createApp } from './app.js';
import { createMailer, NotificationWorker } from './mail.js';
loadLocalEnv();
const config = readConfig();
const db = openDatabase(config.databasePath);
const mailer = createMailer(config.smtp);
const worker = new NotificationWorker(db, mailer);
const indexPath = path.resolve('dist/index.html');
const scriptHashes = config.production && existsSync(indexPath) ? [...readFileSync(indexPath, 'utf8').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(match => "'sha256-" + createHash('sha256').update(match[1]).digest('base64') + "'") : [];
const app = createApp({ config, db, mailer, scriptHashes });
const server = createServer(app);
let vite: { close: () => Promise<void> } | undefined;
if (config.production) {
  const dist = path.resolve('dist');
  app.use(express.static(dist, { index: false, maxAge: '1h' }));
  app.get('/{*path}', (_req, res) => { res.setHeader('Cache-Control', 'no-cache'); res.sendFile(path.join(dist, 'index.html')); });
} else {
  const { createServer: createViteServer } = await import('vite');
  const dev = await createViteServer({ server: { middlewareMode: true, hmr: { server } }, appType: 'spa' });
  vite = dev;
  app.use(dev.middlewares);
}
server.listen(config.port, '0.0.0.0', () => {
  console.log(`CMCB is listening on http://0.0.0.0:${config.port}`);
  if (!getAdmins(db).length) console.log('No admin account yet. Run npm run admin:create with ADMIN_EMAIL and ADMIN_PASSWORD.');
  if (!mailer) console.log('SMTP is not configured. Requests are saved; e-mail notifications are disabled.');
  worker.start();
});
server.on('error', error => { console.error(error); process.exitCode = 1; void shutdown(); });
let closing = false;
async function shutdown() {
  if (closing) return; closing = true;
  await worker.stop();
  await vite?.close();
  server.close(() => { db.close(); process.exit(process.exitCode ?? 0); });
  setTimeout(() => process.exit(process.exitCode ?? 0), 5000).unref();
}
process.on('SIGTERM', () => void shutdown());
process.on('SIGINT', () => void shutdown());
