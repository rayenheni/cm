// ONLY against an isolated disposable development database. This edits a seed article.
import { chromium as playwright } from '@playwright/test';
import chromium from '@sparticuz/chromium';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL, envFile=process.env.TEST_ENV_FILE;
if (!base || !envFile) throw new Error('Set TEST_BASE_URL and TEST_ENV_FILE for an isolated test server.');
const env=Object.fromEntries(readFileSync(envFile,'utf8').split(/\r?\n/).filter(l=>/^[A-Z0-9_]+=/.test(l)).map(l=>{const at=l.indexOf('=');return [l.slice(0,at),l.slice(at+1)]}));
const browser=await playwright.launch({executablePath:await chromium.executablePath(),args:chromium.args.filter(a=>!['--disable-web-security','--allow-running-insecure-content','--disable-site-isolation-trials'].includes(a)),headless:true});
try {
  const page=await browser.newPage({viewport:{width:1440,height:900},locale:'fr-FR'}), errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://images.pexels.com/**',r=>r.fulfill({path:'tests/fixtures/remote-placeholder.jpg',contentType:'image/jpeg'}));
  await page.goto(base+'/#/admin'); await page.getByRole('button',{name:'English'}).click();
  await page.getByLabel('Email address').fill(env.ADMIN_EMAIL); await page.getByLabel('Password',{exact:true}).fill(env.ADMIN_PASSWORD);
  await page.getByRole('button',{name:'Sign in',exact:true}).click(); await page.getByRole('button',{name:'New article'}).waitFor();
  const frBefore=await page.evaluate(async()=>{const r=await fetch('/api/articles/creer-sa-societe-suarl-sarl?lang=fr');return (await r.json()).article.title});
  const row=page.locator('tr').filter({hasText:'Starting a company in Tunisia'});
  await row.getByRole('button',{name:'Edit'}).click(); await page.getByRole('tab',{name:'English'}).click();
  const title=await page.locator('#article-title').inputValue(); await page.locator('#article-title').fill(title+' — test');
  await page.getByRole('button',{name:'Save and publish'}).click(); await page.getByRole('button',{name:'New article'}).waitFor();
  const result=await page.evaluate(async()=>{const [en,fr]=await Promise.all([fetch('/api/articles/creer-sa-societe-suarl-sarl?lang=en').then(r=>r.json()),fetch('/api/articles/creer-sa-societe-suarl-sarl?lang=fr').then(r=>r.json())]);return {en:en.article.title,fr:fr.article.title}});
  assert.equal(result.en,title+' — test'); assert.equal(result.fr,frBefore); assert.deepEqual(errors,[]);
  console.log('PASS English admin login, article edit and real persistence with French unchanged');
} finally {await browser.close()}
