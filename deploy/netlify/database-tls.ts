import { X509Certificate } from 'node:crypto';

export class DatabaseCaError extends Error {
  constructor() { super('Invalid database CA certificate.'); this.name = 'DatabaseCaError'; }
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
  // Accept real newlines as well as literal \n sequences from an env editor.
  const pem = value.replace(/\\n/g, '\n').trim();
  if (!/^-----BEGIN CERTIFICATE-----\s*[A-Za-z0-9+/=\r\n]+-----END CERTIFICATE-----$/.test(pem)) throw new DatabaseCaError();
  try {
    const cert = new X509Certificate(pem);
    if (!cert.ca) throw new DatabaseCaError();
    return { rejectUnauthorized: true, ca: cert.toString() };
  } catch {
    // Keep parsing errors generic: raw environment contents never enter logs.
    throw new DatabaseCaError();
  }
}
