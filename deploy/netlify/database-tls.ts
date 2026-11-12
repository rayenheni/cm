import { X509Certificate } from 'node:crypto';

export class DatabaseCaError extends Error {
  constructor(public readonly reason: 'FORMAT' | 'NOT_AUTHORITY' = 'FORMAT') {
    super('Invalid database CA certificate.'); this.name = 'DatabaseCaError';
  }
}

/**
 * An operator may provide one trusted PEM CA from Supabase for this database.
 * When configured, it replaces Node's default trust roots for this connection;
 * when absent, the driver's default trust store remains in use. In both cases,
 * certificate-chain verification and pg/Node's hostname checks stay enabled.
 */
export function databaseTlsOptions(env: NodeJS.ProcessEnv): { rejectUnauthorized: true; ca?: string } {
  const value = env.SUPABASE_DB_CA_PEM;
  if (value === undefined) return { rejectUnauthorized: true };
  if (Buffer.byteLength(value, 'utf8') > 16384) throw new DatabaseCaError();
  // Some env editors strip or replace PEM line breaks. Rebuild the DER from
  // the complete, single PEM block; never accept other blocks or private keys.
  const pem = value.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n').trim();
  const match = /^-----BEGIN CERTIFICATE-----[ \t\r\n]*([A-Za-z0-9+/= \t\r\n]+?)[ \t\r\n]*-----END CERTIFICATE-----$/.exec(pem);
  if (!match) throw new DatabaseCaError('FORMAT');
  const base64 = match[1].replace(/[ \t\r\n]/g, '');
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) throw new DatabaseCaError('FORMAT');
  const bytes = Buffer.from(base64, 'base64');
  if (!bytes.length || bytes.toString('base64') !== base64) throw new DatabaseCaError('FORMAT');
  let cert: X509Certificate;
  try { cert = new X509Certificate(bytes); }
  catch { throw new DatabaseCaError('FORMAT'); }
  if (!cert.raw.equals(bytes)) throw new DatabaseCaError('FORMAT');
  if (!cert.ca) throw new DatabaseCaError('NOT_AUTHORITY');
  return { rejectUnauthorized: true, ca: cert.toString() };
}
