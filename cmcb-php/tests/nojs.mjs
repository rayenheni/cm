import { chromium as playwright } from '../../node_modules/@playwright/test/index.mjs';
import chromium from '../../node_modules/@sparticuz/chromium/build/index.js';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const env=Object.fromEntries(readFileSync('.env','utf8').split('\n').filter(l=>l.includes('=')).map(l=>[l.slice(0,l.indexOf('=')),l.slice(l.indexOf('=')+1)]));
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:8080';
const browser=await playwright.launch({executablePath:await chromium.executablePath(),args:chromium.args.filter(a=>!['--disable-web-security','--allow-running-insecure-content','--disable-site-isolation-trials'].includes(a)),headless:true});
try {
 const context=await browser.newContext({javaScriptEnabled:false}); const page=await context.newPage();
 await page.route('https://images.pexels.com/**',r=>r.fulfill({path:'../tests/fixtures/remote-placeholder.jpg',contentType:'image/jpeg'}));await page.route('https://www.openstreetmap.org/**',r=>r.fulfill({body:'',contentType:'text/html'}));
 await page.goto(base+'/articles?q=zzzz-no-match');assert.equal(await page.locator('#article-results > div:visible').count(),0);assert(await page.locator('#article-empty').isVisible());
 await page.goto(base+'/contact');await page.locator('#c-name').fill('Test sans JavaScript');await page.locator('#c-email').fill('nojs@example.test');await page.locator('#c-domain').selectOption({label:'Autre demande'});await page.locator('#c-message').fill('Demande de test sans JavaScript, à supprimer après vérification.');await page.locator('#c-consent').check();await page.locator('#consultation-form [type=submit]').click();await page.locator('#form-success:visible').waitFor();assert(page.url().includes('envoi=ok'));
 console.log('PASS no-JavaScript article filters and contact: CSRF form, server persistence, success redirect.');
 // Cleanup through a separate API client, never through the public database file.
 const login=await page.request.post(base+'/api/auth/login',{data:{email:env.ADMIN_EMAIL,password:env.ADMIN_PASSWORD,transport:'bearer'}});assert(login.ok(),'Cleanup login failed');const auth=await login.json();assert(auth.sessionToken);const headers={'X-CMCB-Session':auth.sessionToken,'X-CSRF-Token':auth.csrfToken};
 const list=await(await page.request.get(base+'/api/admin/reservations?q=nojs%40example.test',{headers})).json();for(const r of list.reservations||[])if(r.email==='nojs@example.test'&&r.name==='Test sans JavaScript'){const d=await page.request.delete(base+'/api/admin/reservations/'+r.id,{headers});assert(d.ok());}
 await page.request.post(base+'/api/auth/logout',{headers});
} finally {await browser.close();}
