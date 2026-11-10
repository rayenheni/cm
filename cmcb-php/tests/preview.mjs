// Simulates an embedded HTTPS preview whose proxy strips cookies and Authorization.
import { chromium as playwright } from '../../node_modules/@playwright/test/index.mjs';
import chromium from '../../node_modules/@sparticuz/chromium/build/index.js';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const env = Object.fromEntries(readFileSync('.env','utf8').split('\n').filter(l=>l.includes('=')).map(l=>[l.slice(0,l.indexOf('=')),l.slice(l.indexOf('=')+1)]));
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:8080';
const parent = createServer((_req,res)=>{res.setHeader('Content-Type','text/html');res.end(`<!doctype html><title>Preview simulation</title><iframe style="width:1300px;height:900px" src="${base}/admin"></iframe>`);});
await new Promise(resolve=>parent.listen(8082,'127.0.0.1',resolve));
const browser = await playwright.launch({executablePath:await chromium.executablePath(),args:chromium.args.filter(a=>!['--disable-web-security','--allow-running-insecure-content','--disable-site-isolation-trials'].includes(a)),headless:true});
try {
  const context = await browser.newContext({viewport:{width:1400,height:1000}});
  await context.route(base+'/**',route=>{const headers={...route.request().headers()};delete headers.cookie;delete headers.authorization;delete headers['x-auth-transport'];return route.continue({headers});});
  const page = await context.newPage(); const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8082/'); const frame=page.frameLocator('iframe');
  await frame.getByLabel('Adresse e-mail').fill(env.ADMIN_EMAIL); await frame.getByLabel('Mot de passe',{exact:true}).fill(env.ADMIN_PASSWORD); await frame.getByRole('button',{name:'Se connecter',exact:true}).click(); await frame.getByRole('button',{name:'Nouvel article'}).waitFor();
  await frame.getByRole('button',{name:'Réservations',exact:false}).last().click(); await frame.getByRole('heading',{name:'Demandes de consultation'}).waitFor();
  await frame.getByRole('button',{name:'Sécurité',exact:false}).last().click(); await frame.getByRole('heading',{name:'Sécurité et configuration'}).waitFor();
  const storage=await page.frames().find(f=>f.url().startsWith(base)).evaluate(()=>JSON.stringify({local:{...localStorage},session:{...sessionStorage}})); assert(!storage.includes('cmcb_session'));
  await frame.getByRole('button',{name:'Déconnexion',exact:true}).last().click(); await frame.getByRole('button',{name:'Se connecter',exact:true}).waitFor(); assert.deepEqual(errors,[]);
  console.log('PASS embedded preview: cookies/Authorization stripped, login, protected tabs, no token in browser storage, logout.');
} finally { await browser.close(); await new Promise(resolve=>parent.close(resolve)); }
