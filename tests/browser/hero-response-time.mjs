// Run against a local server: node tests/browser/hero-response-time.mjs
import { chromium as playwright } from '@playwright/test';
import chromium from '@sparticuz/chromium';
import assert from 'node:assert/strict';
const base = process.env.TEST_REACT_BASE_URL || 'http://127.0.0.1:5173';
const browser = await playwright.launch({ executablePath: await chromium.executablePath(), args: chromium.args.filter(a => !['--disable-web-security','--allow-running-insecure-content','--disable-site-isolation-trials'].includes(a)), headless:true });
try {
  const page = await browser.newPage({reducedMotion:'reduce'});
  await page.route('https://images.pexels.com/**', r => r.fulfill({path:'tests/fixtures/remote-placeholder.jpg',contentType:'image/jpeg'}));
  for (const lang of ['ar','fr','en']) for (const width of [320, 390, 600, 768, 1024, 1440]) {
    await page.setViewportSize({width,height:900});
    await page.goto(base+'/#/');
    await page.evaluate(l => {localStorage.setItem('cmcb-lang',l); localStorage.setItem('cmcb-analytics-choice','no');}, lang);
    await page.reload();
    const dl=page.locator('#accueil dl');
    await dl.waitFor(); await page.evaluate(()=>document.fonts.ready);
    const data=await dl.evaluate(el => {
      const cells=[...el.querySelectorAll(':scope > div')];
      const span=cells[0].querySelector('dt span');
      const range=document.createRange();range.selectNodeContents(span);
      const textRects=[...range.getClientRects()].map(r=>({left:r.left,right:r.right,top:r.top}));
      const rects=cells.map(c=>{const r=c.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom}});
      const r=span.getBoundingClientRect();
      return {text:span.textContent, dir:span.dir, textRects, rects, left:r.left,right:r.right, viewport:innerWidth, overflow:el.scrollWidth>el.clientWidth+1};
    });
    assert.equal(data.text,lang==='ar'?'24 ساعة':'24 h');
    assert(data.textRects.every(r=>Math.abs(r.top-data.textRects[0].top)<1),`${lang} ${width}: value wraps`);
    assert(data.left>=-1 && data.right<=width+1,`${lang} ${width}: value outside viewport ${JSON.stringify(data)}`);
    if (lang === 'ar') assert(!data.overflow, `${lang} ${width}: statistics overflow ${JSON.stringify(data)}`);
    for(let i=0;i<data.rects.length;i++) for(let j=i+1;j<data.rects.length;j++) {
      const a=data.rects[i], b=data.rects[j];
      assert(a.right<=b.left+1 || b.right<=a.left+1 || a.bottom<=b.top+1 || b.bottom<=a.top+1,`${lang} ${width}: overlapping stats`);
    }
  }
  console.log('PASS response time: full Arabic hour, FR/EN unchanged and responsive layout');
} finally {await browser.close()}
