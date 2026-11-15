// Simulates setup; no request is sent to a real installation.
import { chromium as playwright } from '@playwright/test';
import chromium from '@sparticuz/chromium';
import assert from 'node:assert/strict';
const base=process.env.TEST_REACT_BASE_URL || 'http://127.0.0.1:5173';
const browser=await playwright.launch({executablePath:await chromium.executablePath(),args:chromium.args.filter(a=>!['--disable-web-security','--allow-running-insecure-content','--disable-site-isolation-trials'].includes(a)),headless:true});
try {
  const page=await browser.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/installation.html',r=>r.fulfill({path:'deploy/netlify/static/installation.html',contentType:'text/html'}));
  await page.route('**/installation.js',r=>r.fulfill({path:'deploy/netlify/static/installation.js',contentType:'application/javascript'}));
  await page.route('**/installation.css',r=>r.fulfill({path:'deploy/netlify/static/installation.css',contentType:'text/css'}));
  let payload; await page.route('**/api/setup',r=>{payload=r.request().postDataJSON();return r.fulfill({status:403,json:{error:{code:'INVALID_KEY',message:'Clé d’installation invalide.'}}});});
  await page.goto(base+'/installation.html');
  await page.getByRole('button',{name:'EN'}).click();
  assert.equal(await page.locator('html').getAttribute('lang'),'en');
  await page.getByLabel('Secret installation key').fill('a'.repeat(64));
  await page.getByLabel('Administrator email').fill('test@example.test');
  await page.getByLabel('Administrator password (12 to 128 characters)').fill('test-password-123');
  await page.getByLabel('Confirm the password').fill('test-password-321');
  await page.getByRole('button',{name:'Install'}).click();
  await page.getByText('The passwords do not match.').waitFor(); assert.equal(payload,undefined);
  await page.getByLabel('Confirm the password').fill('test-password-123');
  await page.getByRole('button',{name:'Install'}).click();
  await page.getByText('Invalid installation key.').waitFor(); assert.equal(payload.email,'test@example.test');
  await page.getByRole('button',{name:'FR'}).click();
  await page.getByText('Clé d’installation invalide.').waitFor();
  assert.deepEqual(errors,[]);
  console.log('PASS setup language, validation and safe error translation');
} finally { await browser.close(); }
