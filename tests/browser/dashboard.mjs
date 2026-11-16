// Run only with an isolated test database and test administrator.
import { chromium as playwright } from '@playwright/test';
import chromium from '@sparticuz/chromium';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL, envFile=process.env.TEST_ENV_FILE;
if (!base || !envFile) throw new Error('Set TEST_BASE_URL and TEST_ENV_FILE for an isolated server.');
const env=Object.fromEntries(readFileSync(envFile,'utf8').split(/\r?\n/).filter(l=>/^[A-Z0-9_]+=/.test(l)).map(l=>{const at=l.indexOf('=');return [l.slice(0,at),l.slice(at+1)]}));
const browser=await playwright.launch({executablePath:await chromium.executablePath(),args:chromium.args.filter(a=>!['--disable-web-security','--allow-running-insecure-content','--disable-site-isolation-trials'].includes(a)),headless:true});
try {
  const page=await browser.newPage({viewport:{width:390,height:844},locale:'fr-FR'}), errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://images.pexels.com/**',r=>r.fulfill({path:'tests/fixtures/remote-placeholder.jpg',contentType:'image/jpeg'}));
  let posts=0; page.on('request',r=>{if(r.url().endsWith('/api/analytics/article')) posts++});
  await page.goto(base+'/#/articles/creer-sa-societe-suarl-sarl');
  await page.getByRole('heading',{name:/Créer sa société/i}).waitFor();
  await page.getByRole('region',{name:'Statistiques des articles'}).waitFor();
  assert.equal(posts,0); assert.equal(await page.evaluate(()=>localStorage.getItem('cmcb-analytics-token')),null);
  await page.getByRole('button',{name:'Refuser',exact:true}).click(); await page.reload();
  await page.getByRole('heading',{name:/Créer sa société/i}).waitFor(); assert.equal(posts,0);
  await page.getByRole('button',{name:'Paramètres des statistiques'}).click();
  const sent=page.waitForResponse(r=>r.url().endsWith('/api/analytics/article') && r.status()===204);
  await page.getByRole('button',{name:'Accepter',exact:true}).click(); await sent; assert.equal(posts,1);
  const saved=await page.evaluate(()=>localStorage.getItem('cmcb-analytics-token')); assert.ok(saved);
  const again=page.waitForResponse(r=>r.url().endsWith('/api/analytics/article') && r.status()===204);
  await page.reload(); await again; assert.equal(posts,2);
  await page.getByRole('button',{name:'Paramètres des statistiques'}).click(); await page.getByRole('button',{name:'Refuser',exact:true}).click();
  assert.equal(await page.evaluate(()=>localStorage.getItem('cmcb-analytics-token')),null);
  await page.reload(); await page.getByRole('heading',{name:/Créer sa société/i}).waitFor(); assert.equal(posts,2);
  await page.goto(base+'/#/admin'); await page.getByLabel('E-mail').fill(env.ADMIN_EMAIL); await page.getByLabel('Mot de passe',{exact:true}).fill(env.ADMIN_PASSWORD); await page.getByRole('button',{name:'Se connecter'}).click();
  await page.getByRole('button',{name:'Ouvrir le menu'}).click(); await page.getByRole('button',{name:/Tableau de bord/}).click();
  await page.getByRole('heading',{name:'Articles les plus consultés'}).waitFor();
  const row=page.locator('tr').filter({hasText:'Créer sa société'}); assert.equal((await row.locator('td').last().textContent())?.trim(),'1');
  await page.getByRole('button',{name:'English'}).click(); await page.getByRole('heading',{name:'Most-read articles'}).waitFor();
  assert.deepEqual(errors,[]); console.log('PASS consent, deduplication, withdrawal, mobile and private dashboard');
} finally {await browser.close()}
