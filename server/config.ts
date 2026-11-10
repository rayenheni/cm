import path from 'node:path';

export interface Config {
  port: number;
  production: boolean;
  databasePath: string;
  mediaPath?: string;
  appOrigin?: string;
  trustProxy: number;
  sessionCookie: { secure: boolean; sameSite: 'strict' | 'none'; partitioned: boolean };
  allowPreviewBearer: boolean;
  smtp?: { host: string; port: number; secure: boolean; user: string; pass: string; from: string; to: string };
}
export function readConfig(env: NodeJS.ProcessEnv = process.env): Config {
  if (env.NODE_ENV && !['development', 'test', 'production'].includes(env.NODE_ENV)) throw new Error('NODE_ENV must be development, test or production.');
  const production = env.NODE_ENV === 'production';
  if (env.SESSION_COOKIE_SAMESITE && !['strict', 'none'].includes(env.SESSION_COOKIE_SAMESITE)) throw new Error('SESSION_COOKIE_SAMESITE must be strict or none.');
  const embedded = env.SESSION_COOKIE_SAMESITE === 'none';
  // Explicit, development-only escape hatch for previews whose proxy blocks cookies.
  const allowPreviewBearer = !production && env.PREVIEW_BEARER_AUTH === 'true';
  const sessionCookie = { secure: production || embedded, sameSite: embedded ? 'none' as const : 'strict' as const, partitioned: embedded };
  const port = Number(env.PORT ?? 5173);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be between 1 and 65535.');
  let appOrigin: string | undefined;
  if (env.APP_ORIGIN) {
    const url = new URL(env.APP_ORIGIN);
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== env.APP_ORIGIN.replace(/\/$/, '')) throw new Error('APP_ORIGIN must be an HTTP(S) origin without a path.');
    appOrigin = url.origin;
  }
  if (production && (!appOrigin || !appOrigin.startsWith('https://'))) throw new Error('Set APP_ORIGIN to your public HTTPS origin before starting production.');
  const trustProxy = Number(env.TRUST_PROXY ?? 0);
  if (!Number.isInteger(trustProxy) || trustProxy < 0) throw new Error('TRUST_PROXY must be a non-negative proxy hop count.');
  let smtp: Config['smtp'];
  if (env.SMTP_HOST) {
    const smtpPort = Number(env.SMTP_PORT ?? 587);
    if (!Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535) throw new Error('Invalid SMTP_PORT.');
    if (!env.SMTP_FROM || !env.NOTIFICATION_EMAIL) throw new Error('SMTP_FROM and NOTIFICATION_EMAIL are required when SMTP_HOST is set.');
    if ((env.SMTP_USER && !env.SMTP_PASS) || (!env.SMTP_USER && env.SMTP_PASS)) throw new Error('Set both SMTP_USER and SMTP_PASS, or neither.');
    smtp = { host: env.SMTP_HOST, port: smtpPort, secure: env.SMTP_SECURE === 'true', user: env.SMTP_USER ?? '', pass: env.SMTP_PASS ?? '', from: env.SMTP_FROM, to: env.NOTIFICATION_EMAIL };
  }
  return { port, production, databasePath: path.resolve(env.DATABASE_PATH ?? 'data/cmcb.sqlite'), mediaPath: path.resolve(env.MEDIA_PATH ?? 'data/media'), appOrigin, trustProxy, sessionCookie, allowPreviewBearer, smtp };
}
export function loadLocalEnv(): void {
  try { process.loadEnvFile(); } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}
