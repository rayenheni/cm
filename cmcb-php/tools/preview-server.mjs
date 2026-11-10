// Optional sandbox preview: HTTP transport in Node, ALL application logic in PHP.
// Production uses Apache/Nginx + PHP-FPM or php -S, never this adapter.
import http from 'node:http';
import { createReadStream, existsSync, statSync, realpathSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { runtime, root } from './runtime.mjs';
const envFile = resolve(root, '.env');
if (!existsSync(envFile)) {
  console.error('Missing cmcb-php/.env. Copy .env.example to .env, set ADMIN_EMAIL/ADMIN_PASSWORD, then run: npm run php -- bin/admin-create.php');
  process.exit(1);
}
mkdirSync(resolve(root, 'data'), { recursive: true });
const php = await runtime();
const port = Number(process.env.PORT || 8080);
// The public preview host is fixed by the sandbox, not supplied by the browser.
// A proxy may replace Host with its internal address, so PHP cannot reconstruct
// the external origin from Host. Keep ordinary localhost requests working too.
const sandboxId = process.env.E2B_SANDBOX_ID || '';
const previewOrigin = /^[a-z0-9-]+$/i.test(sandboxId) ? `https://${port}-${sandboxId}.e2b.app` : '';
function envSetting(name) {
  if (process.env[name] !== undefined) return process.env[name];
  let value;
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = line.trim().match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!match || match[1] !== name) continue;
    value = match[2].trim();
    if (value.length >= 2 && ((value[0] === '"' && value.endsWith('"')) || (value[0] === "'" && value.endsWith("'")))) value = value.slice(1, -1);
    else value = value.replace(/\s+#.*$/, '').trimEnd();
  }
  return value;
}
const mime = { '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8' };
const server = http.createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://preview').pathname);
    const publicRoot = resolve(root, 'public');
    const file = realpathSync(resolve(publicRoot, '.' + path));
    if (path !== '/' && file.startsWith(publicRoot + sep) && statSync(file).isFile() && mime[extname(file)] && !path.includes('/.')) {
      res.writeHead(200, { 'Content-Type': mime[extname(file)], 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'public, max-age=300' });
      createReadStream(file).pipe(res); return;
    }
  } catch {}
  let body;
  try {
    const chunks = []; let size = 0;
    const limit = new URL(req.url, 'http://preview').pathname === '/api/admin/media' ? 3 * 1024 * 1024 : 1048576;
    for await (const chunk of req) { size += chunk.length; if (size > limit) throw new Error('BODY_TOO_LARGE'); chunks.push(chunk); }
    body = Buffer.concat(chunks);
  } catch { res.writeHead(413, { 'Content-Type': 'application/json' }); res.end('{"error":{"code":"BODY_TOO_LARGE","message":"Contenu trop volumineux."}}'); return; }
  try {
    const headers = Object.fromEntries(Object.entries(req.headers).filter(([, v]) => typeof v === 'string').map(([k, v]) => [k, v]));
    const appEnv = envSetting('APP_ENV') || 'development';
    // Explicitly reset APP_ORIGIN on every request: the WASM runtime is reused.
    const phpEnv = { ...process.env, APP_ENV: appEnv, APP_ORIGIN: envSetting('APP_ORIGIN') || '' };
    // Only accept the exact sandbox URL, with the preview transport enabled and
    // no explicitly configured origin. Never trust arbitrary forwarded hosts.
    if (appEnv === 'development' && envSetting('PREVIEW_BEARER_AUTH') === 'true' && !envSetting('APP_ORIGIN') && previewOrigin && headers.origin === previewOrigin) {
      phpEnv.APP_ORIGIN = previewOrigin;
    }
    const response = await php.run({ scriptPath: '/app/public/index.php', relativeUri: req.url, method: req.method, headers, body,
      $_SERVER: { REQUEST_METHOD: req.method, REQUEST_URI: req.url, REMOTE_ADDR: req.socket.remoteAddress || '127.0.0.1', HTTPS: headers['x-forwarded-proto'] === 'https' ? 'on' : '', SCRIPT_NAME: '/index.php', PHP_SELF: '/index.php', SERVER_PROTOCOL: 'HTTP/1.1' },
      env: phpEnv,
    });
    const outHeaders = {};
    for (const [name, values] of Object.entries(response.headers)) { if (!['content-length', 'transfer-encoding', 'connection', 'status'].includes(name.toLowerCase())) outHeaders[name] = values.length === 1 ? values[0] : values; }
    res.writeHead(response.httpStatusCode || 200, outHeaders); res.end(Buffer.from(response.bytes));
    if (response.errors) console.error(response.errors.replace(/\x1b\[[0-9;]*m/g, ''));
  } catch (error) { console.error('Preview PHP failure:', error?.message || error); if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'application/json' }); res.end('{"error":{"code":"INTERNAL_ERROR","message":"Erreur du serveur PHP."}}'); }
});
server.listen(port, '0.0.0.0', () => console.log(`CMCB PHP 8.3 preview listening on 0.0.0.0:${port}. Application code: PHP; sandbox transport: WebAssembly.`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => { php.exit(); process.exit(0); }));
