import express, { type Request, type Response, type NextFunction } from 'express';
import helmet from 'helmet';
import { parseCookie, stringifySetCookie } from 'cookie';
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';
import { z } from 'zod';
import { articleSchema, credentialsSchema, reservationSchema, reservationPatchSchema, listQuerySchema } from '../../server/validation.js';
import { hashPassword, verifyPassword } from '../../server/password.js';
import { InvalidImage, parseImage } from '../../server/media.js';
import { SEED_ARTICLES } from '../../server/seed.js';
import type { Pool, PoolClient, QueryResultRow } from 'pg';
import type { StoredArticle } from '../../src/lib/api-types.js';

// PostgreSQL is the only durable backend. Nothing sensitive is written to the
// Netlify function filesystem. Service-role credentials stay server-side.
type DB = Pick<Pool, 'query' | 'connect'>;
interface Settings { origin: string; supabaseUrl: string; serviceKey: string; bucket: string; bootstrapHash?: string }
class HttpError extends Error { constructor(public status: number, public code: string, message: string) { super(message); } }
const digest = (s: string) => createHash('sha256').update(s).digest('hex');
const cookie = 'cmcb_session';
const sessionTime = 8 * 60 * 60 * 1000;
const bad = (status: number, code: string, message: string): never => { throw new HttpError(status, code, message); };
const iso = (v: unknown) => v instanceof Date ? v.toISOString() : new Date(String(v)).toISOString();

export function settings(env: NodeJS.ProcessEnv): Settings {
  const origin = env.APP_ORIGIN ?? ''; const url = env.SUPABASE_URL ?? '';
  const key = env.SUPABASE_SECRET_KEY ?? ''; const bucket = env.SUPABASE_MEDIA_BUCKET ?? 'cmcb-media';
  let a: URL, b: URL;
  try { a = new URL(origin); b = new URL(url); } catch { throw new Error('APP_ORIGIN and SUPABASE_URL must be valid URLs'); }
  if (a.protocol !== 'https:' || a.origin !== origin || a.username || a.password) throw new Error('APP_ORIGIN must be an HTTPS origin');
  if (b.protocol !== 'https:' || b.origin !== url || b.username || b.password || !b.hostname.endsWith('.supabase.co')) throw new Error('SUPABASE_URL must be the HTTPS Supabase project origin');
  if (!key.startsWith('sb_secret_') || !/^[a-z0-9][a-z0-9-]{2,62}$/.test(bucket)) throw new Error('Missing Supabase secret key or invalid bucket');
  const bootstrapHash = env.CMCB_BOOTSTRAP_KEY_HASH || undefined;
  if (bootstrapHash && !/^[a-f0-9]{64}$/.test(bootstrapHash)) throw new Error('Invalid CMCB_BOOTSTRAP_KEY_HASH');
  return { origin, supabaseUrl: url, serviceKey: key, bucket, bootstrapHash };
}
export function databaseUrl(env: NodeJS.ProcessEnv): string {
  const raw = env.SUPABASE_DB_URL ?? ''; let url: URL;
  try { url = new URL(raw); } catch { throw new Error('Missing or invalid SUPABASE_DB_URL'); }
  // Query parameters can override pg's TLS settings. Never permit TLS downgrade.
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname || !url.username || !url.password || !url.pathname || url.search || url.hash) throw new Error('Invalid SUPABASE_DB_URL; query parameters are not allowed');
  return raw;
}
async function tx<T>(db: DB, fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await db.connect();
  try { await client.query('BEGIN'); const result = await fn(client); await client.query('COMMIT'); return result; }
  catch (err) { await client.query('ROLLBACK'); throw err; }
  finally { client.release(); }
}
const rows = async <T extends QueryResultRow>(db: Pick<DB, 'query'>, sql: string, params: unknown[] = []): Promise<T[]> => (await db.query<T>(sql, params)).rows;
const one = async <T extends QueryResultRow>(db: Pick<DB, 'query'>, sql: string, params: unknown[] = []): Promise<T | undefined> => (await rows<T>(db, sql, params))[0];
interface Session extends QueryResultRow { token_hash: string; admin_id: string; email: string; csrf_token: string }
async function session(req: Request, db: DB): Promise<Session | undefined> {
  let token = ''; try { token = parseCookie(req.headers.cookie ?? '')[cookie] ?? ''; } catch { return undefined; }
  if (!/^[a-f0-9]{64}$/.test(token)) return undefined;
  return one<Session>(db, 'SELECT s.token_hash,s.admin_id,s.csrf_token,a.email FROM cmcb_private.sessions s JOIN cmcb_private.admins a ON a.id=s.admin_id WHERE s.token_hash=$1 AND s.expires_at>now()', [digest(token)]);
}
function setCookie(res: Response, token: string, maxAge: number) {
  res.setHeader('Set-Cookie', stringifySetCookie({ name: cookie, value: token, path: '/', httpOnly: true, secure: true, sameSite: 'strict', maxAge }));
}
async function throttle(db: DB, key: string, max: number, seconds = 900) {
  const r = await one<{ hits: number }>(db, `INSERT INTO cmcb_private.rate_limits(key,hits,reset_at) VALUES ($1,1,now()+($2::integer * interval '1 second'))
    ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN cmcb_private.rate_limits.reset_at<=now() THEN 1 ELSE cmcb_private.rate_limits.hits+1 END,
    reset_at=CASE WHEN cmcb_private.rate_limits.reset_at<=now() THEN now()+($2::integer * interval '1 second') ELSE cmcb_private.rate_limits.reset_at END RETURNING hits`, [digest(key), seconds]);
  if (!r || r.hits > max) bad(429, 'RATE_LIMITED', 'Trop de tentatives. Réessayez plus tard.');
}
async function articles(db: DB, publishedOnly: boolean): Promise<StoredArticle[]> {
  const list = await rows<{ id: string; expertise_id: string; image: string; status: 'draft'|'published'; created_at: Date; updated_at: Date; published_at: Date|null; translations: StoredArticle['translations'] }>(db,
    `SELECT a.*, COALESCE(jsonb_object_agg(t.lang,t.body) FILTER (WHERE t.lang IS NOT NULL),'{}'::jsonb) AS translations
     FROM cmcb_private.articles a LEFT JOIN cmcb_private.article_translations t ON t.article_id=a.id
     ${publishedOnly ? "WHERE a.status='published'" : ''} GROUP BY a.id ORDER BY COALESCE(a.published_at,a.created_at) DESC,a.id`);
  return list.map(a => ({ id: a.id, expertiseId: a.expertise_id, image: a.image, status: a.status, createdAt: iso(a.created_at), updatedAt: iso(a.updated_at), publishedAt: a.published_at ? iso(a.published_at) : null, translations: a.translations }));
}
function localized(a: StoredArticle, lang: 'fr'|'ar') {
  return { id: a.id, expertiseId: a.expertiseId, image: a.image || 'https://images.pexels.com/photos/261621/pexels-photo-261621.jpeg?auto=compress&cs=tinysrgb&w=1400', ...a.translations[lang]!, date: new Intl.DateTimeFormat(lang === 'ar' ? 'ar-TN' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Tunis' }).format(new Date(a.publishedAt!)) };
}
function mappedReservation(r: QueryResultRow) { return { id:r.id, createdAt:iso(r.created_at), updatedAt:iso(r.updated_at), consentAt:iso(r.consent_at), status:r.status, name:r.name, email:r.email, phone:r.phone, domain:r.domain, urgency:r.urgency, message:r.message, lang:r.lang, notification:{status:r.notification_status, attempts:r.attempts} }; }
const reservationSelect = 'SELECT r.*,o.status AS notification_status,o.attempts FROM cmcb_private.reservations r JOIN cmcb_private.outbox o ON o.reservation_id=r.id';

export function createNetlifyApp(db: DB, cfg: Settings, storageFetch: typeof fetch = fetch) {
  const app = express(); app.disable('x-powered-by');
  // Netlify terminates TLS; only the last (Netlify) proxy hop is trusted.
  app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  app.use('/api', (_req, res, next) => { res.setHeader('Cache-Control','no-store'); next(); });
  app.use('/api', (req, _res, next) => {
    if (['GET','HEAD','OPTIONS'].includes(req.method)) return next();
    if (req.get('origin') !== cfg.origin) return next(new HttpError(403,'ORIGIN_REJECTED','Cross-origin writes are not allowed.'));
    if (req.get('content-type')?.split(';')[0].trim() !== 'application/json') return next(new HttpError(415,'JSON_REQUIRED','Send an application/json body.'));
    next();
  });
  app.use('/api/admin/media', express.json({limit:'3mb'}));
  app.use(express.json({limit:'256kb'}));
  const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try { const s = await session(req,db); if (!s) return next(new HttpError(401,'UNAUTHENTICATED','Please sign in to continue.')); res.locals.session = s; next(); } catch (e) { next(e); }
  };
  const csrf = (req: Request, res: Response, next: NextFunction) => req.get('X-CSRF-Token') === (res.locals.session as Session).csrf_token ? next() : next(new HttpError(403,'CSRF_REJECTED','Invalid session token.'));
  // Netlify's connection IP header is supplied by its CDN. Do not use
  // X-Forwarded-For, which may include a value supplied by the caller. If the
  // header is missing, fail toward a shared limiter rather than trusting it.
  const rate = (kind: string, max: number) => async (req: Request, _res: Response, next: NextFunction) => { try { const ip=req.get('x-nf-client-connection-ip') ?? ''; await throttle(db, `${kind}:${isIP(ip) ? ip : 'unknown'}`, max); next(); } catch (e) { next(e); } };
  app.post('/api/setup',rate('setup-ip',10),async(req,res)=>{
    if(!cfg.bootstrapHash) return bad(404,'NOT_FOUND','Installation fermée.');
    const input=z.strictObject({key:z.string().regex(/^[a-f0-9]{64}$/),email:z.string().trim().toLowerCase().email().max(254),password:z.string().min(12).max(128)}).parse(req.body);
    const supplied=Buffer.from(digest(input.key),'hex'), expected=Buffer.from(cfg.bootstrapHash,'hex');
    if(!timingSafeEqual(supplied,expected)) return bad(403,'INVALID_KEY','Clé d’installation invalide.');
    const hash=await hashPassword(input.password);
    await tx(db,async c=>{
      // The unique marker serializes competing initializations. A failure rolls
      // back the marker, administrator, and all seed articles together.
      const marker=await c.query("INSERT INTO cmcb_private.meta(key,value) VALUES('admin_provisioned','1') ON CONFLICT DO NOTHING RETURNING key");
      if(!marker.rowCount) return bad(404,'NOT_FOUND','Installation fermée.');
      const count=await c.query('SELECT count(*)::integer AS n FROM cmcb_private.admins');
      if(count.rows[0].n) return bad(409,'ALREADY_INSTALLED','Un administrateur existe déjà.');
      await c.query('INSERT INTO cmcb_private.admins(email,password_hash) VALUES($1,$2)',[input.email,hash]);
      const seeded=await c.query("INSERT INTO cmcb_private.meta(key,value) VALUES('articles_seeded','1') ON CONFLICT DO NOTHING RETURNING key");
      if(seeded.rowCount) for(const a of SEED_ARTICLES){
        await c.query('INSERT INTO cmcb_private.articles(id,expertise_id,image,status,created_at,updated_at,published_at) VALUES($1,$2,$3,$4,$5,$6,$7)',[a.id,a.expertiseId,a.image,a.status,a.createdAt,a.updatedAt,a.publishedAt]);
        for(const [lang,body] of Object.entries(a.translations)) await c.query('INSERT INTO cmcb_private.article_translations(article_id,lang,body) VALUES($1,$2,$3::jsonb)',[a.id,lang,JSON.stringify(body)]);
      }
    }); res.status(201).json({ok:true});
  });
  app.get('/api/health', async (_req,res) => { await db.query('SELECT 1'); res.json({status:'ok'}); });
  app.get('/api/articles', async (req,res) => { const lang=z.enum(['fr','ar']).parse(req.query.lang ?? 'fr'); res.json({articles:(await articles(db,true)).filter(a=>a.translations[lang]).map(a=>localized(a,lang))}); });
  app.get('/api/articles/:id', async (req,res) => { const lang=z.enum(['fr','ar']).parse(req.query.lang ?? 'fr'); const a=(await articles(db,true)).find(v=>v.id===req.params.id && v.translations[lang]); if (!a) return bad(404,'NOT_FOUND','Article not found.'); res.json({article:localized(a,lang)}); });
  app.get('/api/auth/session', async (req,res) => { const s=await session(req,db); res.json({authenticated:!!s,user:s?{id:Number(s.admin_id),email:s.email}:null,csrfToken:s?.csrf_token ?? null}); });
  app.post('/api/auth/login', rate('login-ip',10), async (req,res) => {
    const {email,password}=credentialsSchema.parse(req.body); await throttle(db,`login-account:${email}`,10);
    const a=await one<{id:string;email:string;password_hash:string}>(db,'SELECT id,email,password_hash FROM cmcb_private.admins WHERE email=$1',[email]);
    const valid=await verifyPassword(password,a?.password_hash ?? 'scrypt$00000000000000000000000000000000$'+'00'.repeat(64));
    if (!a || !valid) return bad(401,'INVALID_CREDENTIALS','E-mail ou mot de passe incorrect.');
    const old=await session(req,db); const token=randomBytes(32).toString('hex'), csrfToken=randomBytes(32).toString('hex');
    await tx(db,async c=>{ if (old) await c.query('DELETE FROM cmcb_private.sessions WHERE token_hash=$1',[old.token_hash]); await c.query('INSERT INTO cmcb_private.sessions(token_hash,admin_id,csrf_token,expires_at) VALUES ($1,$2,$3,$4)',[digest(token),a.id,csrfToken,new Date(Date.now()+sessionTime)]); });
    setCookie(res,token,sessionTime/1000); res.json({authenticated:true,user:{id:Number(a.id),email:a.email},csrfToken});
  });
  app.post('/api/auth/logout', async (req,res) => { const s=await session(req,db); if (s) { if (req.get('X-CSRF-Token')!==s.csrf_token) return bad(403,'CSRF_REJECTED','Invalid session token.'); await db.query('DELETE FROM cmcb_private.sessions WHERE token_hash=$1',[s.token_hash]); } setCookie(res,'',0); res.json({ok:true}); });
  app.post('/api/auth/password',requireAuth,csrf,async (req,res)=>{
    const input=z.strictObject({currentPassword:z.string().min(1).max(128),newPassword:z.string().min(12).max(128)}).parse(req.body); const s=res.locals.session as Session;
    const a=await one<{password_hash:string}>(db,'SELECT password_hash FROM cmcb_private.admins WHERE id=$1',[s.admin_id]);
    if (!a || !await verifyPassword(input.currentPassword,a.password_hash)) return bad(400,'INVALID_PASSWORD','Current password is incorrect.');
    const hash=await hashPassword(input.newPassword); await tx(db,async c=>{ await c.query('UPDATE cmcb_private.admins SET password_hash=$1 WHERE id=$2',[hash,s.admin_id]); await c.query('DELETE FROM cmcb_private.sessions WHERE admin_id=$1',[s.admin_id]); }); setCookie(res,'',0); res.json({ok:true});
  });
  app.post('/api/admin/media',requireAuth,csrf,rate('media',30),async(req,res)=>{
    const input=z.strictObject({data:z.string().max(2796204)}).parse(req.body); let image:ReturnType<typeof parseImage>;
    try { image=parseImage(input.data); } catch(e) { if(e instanceof InvalidImage) return bad(400,'INVALID_IMAGE',e.message); throw e; }
    const name=`${randomBytes(16).toString('hex')}.${image.ext}`; const base=`${cfg.supabaseUrl}/storage/v1/object/${cfg.bucket}/${name}`;
    const response=await storageFetch(base,{method:'POST',headers:{apikey:cfg.serviceKey,'content-type':image.type,'x-upsert':'false'},body:new Uint8Array(image.bytes)});
    if(!response.ok) throw new Error('Image storage failed');
    res.status(201).json({url:`${cfg.supabaseUrl}/storage/v1/object/public/${cfg.bucket}/${name}`});
  });
  app.get('/api/admin/articles',requireAuth,async(_req,res)=>res.json({articles:await articles(db,false)}));
  const save=async(req:Request,res:Response,create:boolean)=>{
    const input=articleSchema.parse(req.body); if(!create && input.id!==req.params.id) return bad(400,'IMMUTABLE_SLUG','Keep the original slug.');
    await tx(db,async c=>{
      if(create) {
        const result=await c.query("INSERT INTO cmcb_private.articles(id,expertise_id,image,status,published_at) VALUES($1,$2,$3,$4,CASE WHEN $4='published' THEN now() ELSE NULL END) ON CONFLICT(id) DO NOTHING RETURNING id",[input.id,input.expertiseId,input.image,input.status]);
        if(!result.rowCount) return bad(409,'DUPLICATE_SLUG','An article with this slug already exists.');
      } else {
        const result=await c.query("UPDATE cmcb_private.articles SET expertise_id=$2,image=$3,status=$4,updated_at=now(),published_at=CASE WHEN $4='published' THEN COALESCE(published_at,now()) ELSE NULL END WHERE id=$1 RETURNING id",[input.id,input.expertiseId,input.image,input.status]);
        if(!result.rowCount) return bad(404,'NOT_FOUND','Article not found.'); await c.query('DELETE FROM cmcb_private.article_translations WHERE article_id=$1',[input.id]);
      }
      for(const [lang,body] of Object.entries(input.translations)) await c.query('INSERT INTO cmcb_private.article_translations(article_id,lang,body) VALUES($1,$2,$3::jsonb)',[input.id,lang,JSON.stringify(body)]);
    });
    res.status(create?201:200).json({article:(await articles(db,false)).find(a=>a.id===input.id)});
  };
  app.post('/api/admin/articles',requireAuth,csrf,(req,res)=>save(req,res,true));
  app.put('/api/admin/articles/:id',requireAuth,csrf,(req,res)=>save(req,res,false));
  app.delete('/api/admin/articles/:id',requireAuth,csrf,async(req,res)=>{ const r=await db.query('DELETE FROM cmcb_private.articles WHERE id=$1',[req.params.id]); if(!r.rowCount) return bad(404,'NOT_FOUND','Article not found.'); res.json({ok:true}); });
  app.post('/api/reservations',rate('contact',8),async(req,res)=>{
    const input=reservationSchema.parse(req.body); const key=z.uuid().parse(req.get('Idempotency-Key')); const hash=digest(JSON.stringify(input)); const id=randomUUID();
    const result=await tx(db,async c=>{
      const r=await c.query(`INSERT INTO cmcb_private.reservations(id,idempotency_key,payload_hash,consent_at,status,name,email,phone,domain,urgency,message,lang) VALUES($1,$2,$3,now(),'new',$4,$5,$6,$7,$8,$9,$10) ON CONFLICT(idempotency_key) DO NOTHING RETURNING id`,[id,key,hash,input.name,input.email,input.phone,input.domain,input.urgency,input.message,input.lang]);
      if(r.rowCount){ await c.query("INSERT INTO cmcb_private.outbox(reservation_id,status) VALUES($1,'disabled')",[id]); return {id,created:true}; }
      const existing=(await c.query('SELECT id,payload_hash FROM cmcb_private.reservations WHERE idempotency_key=$1',[key])).rows[0]; if(!existing || existing.payload_hash!==hash) return bad(409,'IDEMPOTENCY_CONFLICT','This submission key was already used.'); return {id:existing.id as string,created:false};
    }); res.status(result.created?201:200).json({id:result.id,persisted:true});
  });
  app.get('/api/admin/reservations',requireAuth,async(req,res)=>{
    const q=listQuerySchema.parse(req.query); const conditions:string[]=[]; const params:unknown[]=[];
    if(q.status){params.push(q.status);conditions.push(`r.status=$${params.length}`);}
    if(q.q){params.push('%'+q.q.toLowerCase().replace(/[\\%_]/g,'\\$&')+'%');conditions.push(`(lower(r.name) LIKE $${params.length} OR lower(r.email) LIKE $${params.length} OR lower(r.domain) LIKE $${params.length} OR lower(r.message) LIKE $${params.length})`);}
    const where=conditions.length?' WHERE '+conditions.join(' AND '):'';
    const total=await one<{n:number}>(db,'SELECT count(*)::integer AS n FROM cmcb_private.reservations r'+where,params);
    const all=await rows(db,reservationSelect+where+` ORDER BY r.created_at DESC,r.id LIMIT $${params.length+1} OFFSET $${params.length+2}`,[...params,q.limit,(q.page-1)*q.limit]);
    const counts={new:0,contacted:0,closed:0}; for(const r of await rows<{status:keyof typeof counts;n:number}>(db,'SELECT status,count(*)::integer AS n FROM cmcb_private.reservations GROUP BY status')) counts[r.status]=r.n;
    res.json({reservations:all.map(mappedReservation),total:total?.n ?? 0,page:q.page,limit:q.limit,counts});
  });
  app.patch('/api/admin/reservations/:id',requireAuth,csrf,async(req,res)=>{ const {status}=reservationPatchSchema.parse(req.body); const id=z.uuid().parse(req.params.id); const r=await db.query('UPDATE cmcb_private.reservations SET status=$1,updated_at=now() WHERE id=$2',[status,id]); if(!r.rowCount) return bad(404,'NOT_FOUND','Request not found.'); const item=await one(db,reservationSelect+' WHERE r.id=$1',[id]); res.json({reservation:mappedReservation(item!)}); });
  app.delete('/api/admin/reservations/:id',requireAuth,csrf,async(req,res)=>{ const id=z.uuid().parse(req.params.id); const r=await db.query('DELETE FROM cmcb_private.reservations WHERE id=$1',[id]); if(!r.rowCount) return bad(404,'NOT_FOUND','Request not found.'); res.json({ok:true}); });
  app.post('/api/admin/reservations/:id/retry',requireAuth,csrf,(_req,_res)=>bad(409,'SMTP_DISABLED','Email notifications are not configured.'));
  app.get('/api/admin/system',requireAuth,(_req,res)=>res.json({smtpConfigured:false,storage:'postgresql',sessionHours:8}));
  app.use('/api',(_req,res)=>res.status(404).json({error:{code:'NOT_FOUND',message:'API endpoint not found.'}}));
  app.use((error:unknown,_req:Request,res:Response,_next:NextFunction)=>{
    if(error instanceof HttpError) return res.status(error.status).json({error:{code:error.code,message:error.message}});
    if(error instanceof z.ZodError){const fields:Record<string,string>={}; for(const issue of error.issues) fields[issue.path.join('.')]=issue.message; return res.status(400).json({error:{code:'VALIDATION_ERROR',message:'Please check the submitted fields.',fields}});}
    if(error instanceof Error && 'status' in error && error.status===413) return res.status(413).json({error:{code:'BODY_TOO_LARGE',message:'The submitted content is too large.'}});
    if(error instanceof SyntaxError && 'status' in error && error.status===400) return res.status(400).json({error:{code:'INVALID_JSON',message:'Invalid JSON body.'}});
    console.error('Netlify API error:',error instanceof Error ? error.name : 'UnknownError'); return res.status(500).json({error:{code:'INTERNAL_ERROR',message:'The server could not complete this request.'}});
  });
  return app;
}
