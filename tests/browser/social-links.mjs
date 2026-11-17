// Run against the local app: node tests/browser/social-links.mjs
import { chromium as playwright } from '@playwright/test';
import chromium from '@sparticuz/chromium';
import assert from 'node:assert/strict';
const base=process.env.TEST_REACT_BASE_URL || 'http://127.0.0.1:5173';
const linkedIn='https://www.linkedin.com/in/bhiri-chaima/';
const facebook='https://www.facebook.com/profile.php?id=61596343180357';
const browser=await playwright.launch({executablePath:await chromium.executablePath(),args:chromium.args.filter(a=>!['--disable-web-security','--allow-running-insecure-content','--disable-site-isolation-trials'].includes(a)),headless:true});
try {
  const page=await browser.newPage({reducedMotion:'reduce'});
  await page.route('https://images.pexels.com/**',r=>r.fulfill({path:'tests/fixtures/remote-placeholder.jpg',contentType:'image/jpeg'}));
  for(const lang of ['fr','ar','en']) for(const width of [390,1440]) {
    await page.setViewportSize({width,height:900});
    await page.goto(base+'/#/');
    await page.evaluate(l=>{localStorage.setItem('cmcb-lang',l);localStorage.setItem('cmcb-analytics-choice','no');},lang);
    await page.reload();
    for(const route of ['/','/cabinet','/articles','/articles/creer-sa-societe-suarl-sarl']) {
      await page.goto(base+'/#'+route);
      if(route.startsWith('/articles/')) await page.locator('article').first().waitFor();
      const links=await page.locator('a[href*="linkedin.com"],a[href*="facebook.com"]').evaluateAll(els=>els.map(e=>e.getAttribute('href')));
      const li=links.filter(h=>h.includes('linkedin.com')&&!h.includes('/sharing/'));
      const fb=links.filter(h=>h.includes('facebook.com')&&!h.includes('/sharer/'));
      assert(li.length>0&&fb.length>0,`${lang} ${width} ${route}: missing social links`);
      assert(li.every(h=>h===linkedIn),`${lang} ${width} ${route}: wrong LinkedIn link`);
      assert(fb.every(h=>h===facebook),`${lang} ${width} ${route}: wrong Facebook link`);
      if(route.startsWith('/articles/')) {
        assert(links.some(h=>h.startsWith('https://www.linkedin.com/sharing/share-offsite/?url=')));
        assert(links.some(h=>h.startsWith('https://www.facebook.com/sharer/sharer.php?u=')));
      }
    }
  }
  console.log('PASS LinkedIn and Facebook profile links across languages, layouts and pages; article sharing retained');
} finally {await browser.close();}
