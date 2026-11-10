import { chromium as playwright } from '@playwright/test';
import chromium from '@sparticuz/chromium';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import assert from 'node:assert/strict';
const env = Object.fromEntries(readFileSync('.env','utf8').split('\n').filter(l=>l.includes('=')).map(l=>[l.slice(0,l.indexOf('=')),l.slice(l.indexOf('=')+1)]));
const parent = createServer((_req,res)=>{res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Arena preview simulation</title><iframe style="width:1200px;height:900px" src="http://127.0.0.1:5173/#/admin"></iframe>');});
await new Promise(resolve=>parent.listen(5175,'127.0.0.1',resolve));
const browser = await playwright.launch({ executablePath: await chromium.executablePath(), args: chromium.args.filter(a => !['--disable-web-security','--allow-running-insecure-content','--disable-site-isolation-trials'].includes(a)), headless: true });
try {
  const context = await browser.newContext({viewport:{width:1400,height:1000}});
  // Simulate a proxy/browser that refuses to send cookies into the embedded app.
  await context.route('http://127.0.0.1:5173/**', route => {
    const headers = {...route.request().headers()}; delete headers.cookie; delete headers.authorization; delete headers['x-auth-transport'];
    return route.continue({headers});
  });
  const page = await context.newPage();
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
  await page.goto('http://localhost:5175/');
  const frame = page.frameLocator('iframe');
  await frame.getByLabel('Adresse e-mail').fill(env.ADMIN_EMAIL);
  await frame.getByLabel('Mot de passe',{exact:true}).fill(env.ADMIN_PASSWORD);
  await frame.getByRole('button',{name:'Se connecter'}).click();
  await frame.getByRole('button',{name:'Nouvel article'}).waitFor();
  await frame.getByRole('button',{name:'Réservations'}).last().click();
  await frame.getByRole('heading',{name:'Demandes de consultation'}).waitFor();
  await frame.getByRole('button',{name:'Sécurité'}).last().click();
  await frame.getByRole('heading',{name:'Sécurité et configuration'}).waitFor();
  const storage = await page.frames().find(f=>f.url().includes('5173')).evaluate(()=>({local:{...localStorage},session:{...sessionStorage}}));
  assert(!JSON.stringify(storage).includes('cmcb_session'));
  assert.equal(await frame.getByRole('alert').filter({hasText:'cookie de session'}).count(),0);
  await frame.getByRole('button',{name:'Déconnexion'}).last().click();
  await page.waitForTimeout(700);
  await frame.getByRole('button',{name:'Se connecter'}).waitFor();
  assert.deepEqual(errors,[]);
  console.log('Embedded preview regression passed: cross-site iframe with cookies/Authorization/transport header stripped, login, protected articles/reservations/settings, no token in browser storage, logout.');
} finally { await browser.close(); await new Promise(resolve=>parent.close(resolve)); }
