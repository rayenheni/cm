import { chromium as playwright } from '../../node_modules/@playwright/test/index.mjs';
import chromium from '../../node_modules/@sparticuz/chromium/build/index.js';
import { mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:8080';
const browser=await playwright.launch({executablePath:await chromium.executablePath(),args:chromium.args.filter(a=>!['--disable-web-security','--allow-running-insecure-content','--disable-site-isolation-trials'].includes(a)),headless:true});
try{const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://images.pexels.com/**',r=>r.fulfill({path:'../tests/fixtures/remote-placeholder.jpg',contentType:'image/jpeg'}));await page.route('https://www.openstreetmap.org/**',r=>r.fulfill({body:'',contentType:'text/html'}));
for(const [path,name] of [['/','home'],['/?lang=ar','arabic'],['/contact','contact'],['/admin','admin']]){await page.goto(base+path);await page.waitForTimeout(300);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),path+' horizontal overflow');mkdirSync('tools/test-results',{recursive:true});await page.screenshot({path:'tools/test-results/mobile-'+name+'.png',fullPage:true});}
await page.goto(base+'/');await page.locator('.menu-toggle').click();assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'true');await page.locator('#navigation a[href="/expertises"]').click();await page.getByRole('heading',{level:1}).waitFor();assert.deepEqual(errors,[]);console.log('PASS mobile FR/AR/contact/admin: no horizontal overflow, menu navigation, no JS errors.');}finally{await browser.close()}
