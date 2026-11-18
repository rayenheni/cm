// Run against the local app: node tests/browser/cabinet-portrait.mjs
import { chromium as playwright } from '@playwright/test';
import chromium from '@sparticuz/chromium';
import assert from 'node:assert/strict';

const base = process.env.TEST_REACT_BASE_URL || 'http://127.0.0.1:5173';
const browser = await playwright.launch({executablePath: await chromium.executablePath(), args: chromium.args.filter(a => !['--disable-web-security', '--allow-running-insecure-content', '--disable-site-isolation-trials'].includes(a)), headless: true});
try {
  const page = await browser.newPage({reducedMotion: 'reduce'});
  for (const lang of ['fr', 'ar', 'en']) for (const width of [320, 768, 1440]) {
    await page.setViewportSize({width, height: 900});
    await page.goto(base + '/#/cabinet');
    await page.evaluate(l => {localStorage.setItem('cmcb-lang', l); localStorage.setItem('cmcb-analytics-choice', 'no');}, lang);
    await page.reload();
    const img = page.locator('img[src*="portrait-cabinet"]').first();
    await img.scrollIntoViewIfNeeded();
    await img.evaluate(el => el.decode());
    const portrait = await img.evaluate(el => ({lang: document.documentElement.lang, alt: el.alt, width: el.naturalWidth, height: el.naturalHeight, rect: {width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height}}));
    assert.equal(portrait.lang, lang);
    assert.equal(portrait.width, 928);
    assert.equal(portrait.height, 1152);
    assert.ok(portrait.alt && portrait.rect.width > 0 && portrait.rect.height > 0);
    await page.goto(base + '/#/');
    const hero = page.locator('#accueil img').first();
    await hero.waitFor();
    assert.match(await hero.getAttribute('src'), /portrait-accueil-v2/);
  }
  console.log('PASS cabinet portrait and unchanged homepage in FR/AR/EN on mobile and desktop');
} finally { await browser.close(); }
