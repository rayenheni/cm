// Run against the local app: node tests/browser/hero-photo.mjs
import { chromium as playwright } from '@playwright/test';
import chromium from '@sparticuz/chromium';
import assert from 'node:assert/strict';

const base = process.env.TEST_REACT_BASE_URL || 'http://127.0.0.1:5173';
const browser = await playwright.launch({executablePath:await chromium.executablePath(),args:chromium.args.filter(a=>!['--disable-web-security','--allow-running-insecure-content','--disable-site-isolation-trials'].includes(a)),headless:true});
try {
  const page=await browser.newPage({reducedMotion:'reduce'});
  for (const lang of ['fr','ar','en']) for (const width of [320,768,1024,1440]) {
    await page.setViewportSize({width,height:900});
    await page.goto(base+'/#/');
    await page.evaluate(l=>{localStorage.setItem('cmcb-lang',l);localStorage.setItem('cmcb-analytics-choice','no');},lang);
    await page.reload();
    const portrait=page.locator('#accueil img').first(); await portrait.waitFor();
    const result=await portrait.evaluate(img=>{
      const photo=img.parentElement.parentElement;
      const rect=img.getBoundingClientRect();
      return {lang:document.documentElement.lang,alt:img.alt,src:img.currentSrc,loaded:img.complete && img.naturalWidth === 1199 && img.naturalHeight === 1312,text:photo.textContent.trim(),width:rect.width,height:rect.height};
    });
    assert.equal(result.lang,lang);
    assert.equal(result.text,'',`${lang} ${width}: unexpected text on photo`);
    assert.ok(result.alt && result.src.includes('portrait-accueil') && result.loaded && result.width>0 && result.height>0,`${lang} ${width}: portrait is missing`);
  }
  console.log('PASS hero portrait visible without overlaid text in FR/AR/EN on mobile and desktop');
} finally { await browser.close(); }
