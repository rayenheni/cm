import { Pool } from 'pg';
import serverless from 'serverless-http';
import { createNetlifyApp, databaseUrl, settings } from '../../deploy/netlify/server.js';
import { databaseTlsOptions, DatabaseCaError } from '../../deploy/netlify/database-tls.js';

type Event = { path?: string; rawPath?: string; requestPath?: string; [key: string]: unknown };
export function normalizePath(event: Event): string {
  const raw = String(event.requestPath || event.path || event.rawPath || '/');
  return raw.replace(/^\/\.netlify\/functions\/api(?=\/|$)/, '/api');
}
let invoke: ReturnType<typeof serverless> | undefined;

export async function handler(event: Event, context: object) {
  try {
    if (!invoke) {
      const config = settings(process.env);
      // An empty search string is enforced by databaseUrl so a connection
      // parameter cannot override this certificate and hostname verification.
      const pool = new Pool({ connectionString: databaseUrl(process.env), ssl: databaseTlsOptions(process.env), max: 2, idleTimeoutMillis: 10000, connectionTimeoutMillis: 10000 });
      invoke = serverless(createNetlifyApp(pool, config));
    }
    const path = normalizePath(event);
    // Reject unexpected aliases rather than accidentally exposing app routes.
    if (!/^\/api(?:\/|$)/.test(path)) return { statusCode: 404, body: '{"error":{"code":"NOT_FOUND","message":"Not found."}}', headers: { 'content-type': 'application/json' } };
    return await invoke({ ...event, path, requestPath: path, ...(event.rawPath ? {rawPath:path} : {}) }, context);
  } catch (error) {
    console.error('Netlify bootstrap:', error instanceof DatabaseCaError ? 'INVALID_DB_CA' : 'CONFIG_ERROR');
    return { statusCode: 503, body: '{"error":{"code":"CONFIG_ERROR","message":"Service unavailable. Check private server logs."}}', headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } };
  }
}
