import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import request from 'supertest';
import type { Pool } from 'pg';
import { createNetlifyApp, settings, databaseUrl } from '../deploy/netlify/server.js';
import { normalizePath } from '../netlify/functions/api.js';
import serverless from 'serverless-http';

const origin='https://site.example';
const key='ab'.repeat(32);
const hash=createHash('sha256').update(key).digest('hex');
const env={APP_ORIGIN:origin,SUPABASE_URL:'https://project.supabase.co',SUPABASE_SECRET_KEY:'sb_secret_fake_test',CMCB_BOOTSTRAP_KEY_HASH:hash};

// Uses real PostgreSQL WASM in isolation. Netlify, Supabase and object storage
// remain untested in this suite. No real secret is needed.
test('Netlify API: setup, login, articles, media and reservations', async () => {
  const pg = new PGlite();
  await pg.exec('CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN;');
  await pg.exec(await readFile('deploy/netlify/001_initial_schema.sql','utf8'));
  const query = async (sql:string, args:unknown[] = []) => {
    const out=await pg.query(sql,args);
    return {rows:out.rows,rowCount:out.affectedRows ?? out.rows.length};
  };
  const db={query,connect:async()=>({query,release(){}})} as unknown as Pool;
  let uploaded='';
  const storage = (async (url: string | URL | Request, init?:RequestInit) => {
    uploaded=String(url); assert.equal((init?.headers as Record<string,string>).apikey,'sb_secret_fake_test');
    assert.equal((init?.headers as Record<string,string>).authorization,undefined);
    return new Response('',{status:200});
  }) as typeof fetch;
  const app=createNetlifyApp(db,settings(env),storage);
  const post = (url:string) => request(app).post(url).set('Origin',origin);
  try {
    const netlify = serverless(app);
    for (const p of ['/api/health','/.netlify/functions/api/health']) {
      const normalized = normalizePath({path:p});
      const event = {path:normalized,httpMethod:'GET',headers:{},requestContext:{identity:{sourceIp:'127.0.0.1'}},body:''};
      const response = await netlify(event, {}) as {statusCode:number;body:string};
      assert.equal(response.statusCode,200, response.body);
    }
    assert.equal((await request(app).get('/api/admin/articles')).status,401);
    const wireBody=JSON.stringify({key:'00'.repeat(32),email:'admin@example.test',password:'correct horse battery'});
    const wire = await netlify({path:'/api/setup',httpMethod:'POST',headers:{origin,'content-type':'application/json','content-length':String(Buffer.byteLength(wireBody))},requestContext:{identity:{sourceIp:'127.0.0.1'}},body:wireBody}, {}) as {statusCode:number};
    assert.equal(wire.statusCode,403);
    assert.equal((await post('/api/setup').send({key:'00'.repeat(32),email:'admin@example.test',password:'correct horse battery'})).status,403);
    const setup=await post('/api/setup').send({key,email:'admin@example.test',password:'correct horse battery'}); assert.equal(setup.status,201,JSON.stringify(setup.body));
    assert.equal((await post('/api/setup').send({key,email:'other@example.test',password:'correct horse battery'})).status,404);
    const pub=await request(app).get('/api/articles?lang=fr'); assert.equal(pub.status,200,JSON.stringify(pub.body)); assert.equal(pub.body.articles.length,4);
    assert.equal((await request(app).post('/api/auth/login').set('Origin','https://evil.example').send({email:'admin@example.test',password:'correct horse battery'})).status,403);
    const login=await post('/api/auth/login').send({email:'admin@example.test',password:'correct horse battery'}); assert.equal(login.status,200,JSON.stringify(login.body));
    const cookie=String(login.headers['set-cookie'][0]).split(';')[0], csrf=login.body.csrfToken;
    assert.match(login.headers['set-cookie'][0],/HttpOnly/i); assert.match(login.headers['set-cookie'][0],/Secure/i);
    const auth=(url:string)=>request(app).get(url).set('Cookie',cookie);
    const write=(method:'post'|'put'|'delete'|'patch',url:string)=>request(app)[method](url).set('Origin',origin).set('Cookie',cookie).set('X-CSRF-Token',csrf);
    const seed=await auth('/api/admin/articles'); assert.equal(seed.status,200); assert.equal(seed.body.articles.length,4);
    const example=seed.body.articles[0]; const article={id:'test-article',expertiseId:example.expertiseId,image:'',status:'draft',translations:example.translations};
    assert.equal((await request(app).post('/api/admin/articles').set('Origin',origin).set('Cookie',cookie).send(article)).status,403);
    const saved=await write('post','/api/admin/articles').send(article); assert.equal(saved.status,201,JSON.stringify(saved.body));
    assert.equal((await request(app).get('/api/articles/test-article?lang=fr')).status,404);
    const published=await write('put','/api/admin/articles/test-article').send({...article,status:'published'}); assert.equal(published.status,200,JSON.stringify(published.body));
    assert.equal((await request(app).get('/api/articles/test-article?lang=fr')).status,200);
    // One valid, tiny PNG (the same validation as the existing server).
    const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aNCUAAAAASUVORK5CYII=';
    const image=await write('post','/api/admin/media').send({data:png}); assert.equal(image.status,201,JSON.stringify(image.body)); assert.match(image.body.url,/^https:\/\/project\.supabase\.co\/storage\/v1\/object\/public\/cmcb-media\//); assert.match(uploaded,/\/object\/cmcb-media\//);
    const idempotencyKey=randomUUID(); const input={name:'Test Client',email:'client@example.test',phone:'',domain:'Droit',urgency:'normal',message:'Ceci est un message de test suffisamment long.',lang:'fr',consent:true,website:''};
    const submission=await post('/api/reservations').set('Idempotency-Key',idempotencyKey).send(input); assert.equal(submission.status,201,JSON.stringify(submission.body));
    const retry=await post('/api/reservations').set('Idempotency-Key',idempotencyKey).send(input); assert.equal(retry.status,200); assert.equal(retry.body.id,submission.body.id);
    const list=await auth('/api/admin/reservations'); assert.equal(list.status,200,JSON.stringify(list.body)); assert.equal(list.body.total,1); assert.equal(list.body.reservations[0].notification.status,'disabled');
    assert.equal((await write('patch',`/api/admin/reservations/${submission.body.id}`).send({status:'contacted'})).status,200);
    assert.equal((await write('delete',`/api/admin/reservations/${submission.body.id}`).send({})).status,200);
    assert.equal((await write('delete','/api/admin/articles/test-article').send({})).status,200);
    assert.equal((await write('post','/api/auth/logout').send({})).status,200);
    assert.equal((await auth('/api/admin/articles')).status,401);
    for (let i=0; i<10; i++) {
      const attempt=await post('/api/auth/login').set('x-nf-client-connection-ip','192.0.2.44').set('x-forwarded-for',`192.0.2.${i}`).send({email:`no${i}@example.test`,password:'incorrect'});
      assert.equal(attempt.status,401);
    }
    const blocked=await post('/api/auth/login').set('x-nf-client-connection-ip','192.0.2.44').set('x-forwarded-for','203.0.113.2').send({email:'another@example.test',password:'incorrect'});
    assert.equal(blocked.status,429);
  } finally { await pg.close(); }
});

test('Production configuration rejects invalid origins and downgrade options',()=>{
  assert.throws(()=>settings({...env,APP_ORIGIN:'http://site.example'}));
  assert.throws(()=>settings({...env,SUPABASE_URL:'https://other.example'}));
  assert.throws(()=>databaseUrl({SUPABASE_DB_URL:'postgres://a:b@db.example/test?sslmode=disable'}));
  assert.equal(databaseUrl({SUPABASE_DB_URL:'postgres://a:b@db.example/test'}),'postgres://a:b@db.example/test');
});
