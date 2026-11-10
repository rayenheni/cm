import { chromium as playwright } from '@playwright/test';
import chromium from '@sparticuz/chromium';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const env = Object.fromEntries(readFileSync('.env','utf8').split('\n').filter(l=>l.includes('=')).map(l=>[l.slice(0,l.indexOf('=')),l.slice(l.indexOf('=')+1)]));
const browser = await playwright.launch({ executablePath: await chromium.executablePath(), args: chromium.args.filter(a => !['--disable-web-security','--allow-running-insecure-content','--disable-site-isolation-trials'].includes(a)), headless: true });
const base = process.env.TEST_BASE_URL ?? 'http://127.0.0.1:5173';
try {
  const page = await browser.newPage();
  await page.route('https://fonts.googleapis.com/**', r => r.fulfill({body:'',contentType:'text/css'}));
  await page.goto(base + '/#/admin');
  await page.getByLabel('Adresse e-mail').fill(env.ADMIN_EMAIL);
  await page.getByLabel('Mot de passe', {exact:true}).fill('deliberately-incorrect-password');
  await page.getByRole('button', {name:'Se connecter'}).click();
  await page.getByRole('alert').filter({hasText:'E-mail ou mot de passe incorrect.'}).waitFor();
  assert.equal(await page.getByRole('alert').filter({hasText:'session a expiré'}).count(), 0);
  await page.getByLabel('Mot de passe', {exact:true}).fill(env.ADMIN_PASSWORD);
  await page.getByRole('button', {name:'Se connecter'}).click();
  await page.getByRole('button', {name:'Nouvel article'}).waitFor();
  await page.reload();
  await page.getByRole('button', {name:'Nouvel article'}).waitFor();
  assert.equal(await page.getByRole('alert').filter({hasText:'session a expiré'}).count(), 0);
  await page.getByRole('button', {name:'Déconnexion'}).last().click();
  await page.getByRole('button', {name:'Se connecter'}).waitFor();
  console.log('Login regression passed: incorrect password is not called expired; correct login survives reload; logout works.');
} finally { await browser.close(); }
