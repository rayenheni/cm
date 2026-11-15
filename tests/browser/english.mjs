// Run with a local application server: node tests/browser/english.mjs
import { chromium as playwright } from '@playwright/test';
import chromium from '@sparticuz/chromium';
import assert from 'node:assert/strict';
const base = process.env.TEST_REACT_BASE_URL || 'http://127.0.0.1:5173';
const browser = await playwright.launch({ executablePath: await chromium.executablePath(), args: chromium.args.filter(a => !['--disable-web-security','--allow-running-insecure-content','--disable-site-isolation-trials'].includes(a)), headless: true });
try {
  const page = await browser.newPage({reducedMotion:'reduce', locale:'fr-FR'});
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://images.pexels.com/**', r => r.fulfill({path:'tests/fixtures/remote-placeholder.jpg',contentType:'image/jpeg'}));
  await page.route('https://www.openstreetmap.org/**', r => r.fulfill({body:'',contentType:'text/html'}));
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({width,height:900});
    await page.goto(base+'/#/cabinet');
    await page.evaluate(()=>localStorage.setItem('cmcb-lang','fr')); await page.reload();
    if (width < 1024) {
      const menu=page.getByRole('button',{name:'Ouvrir le menu'}); await menu.click();
      const close=await page.getByRole('dialog').getByRole('button',{name:'Fermer le menu'}).boundingBox();
      assert(close && close.x >= 0 && close.x + close.width <= width, `${width}: close button fits viewport`);
    }
    const english=width < 1024 ? page.getByRole('dialog').getByRole('button',{name:'English'}) : page.getByRole('button',{name:'English'}).filter({visible:true}).first();
    await english.click();
    assert.equal(await page.locator('html').getAttribute('lang'),'en');
    assert.equal(await page.locator('html').getAttribute('dir'),'ltr');
    assert.equal(await page.evaluate(()=>localStorage.getItem('cmcb-lang')),'en');
    await page.reload();
    assert.equal(await page.locator('html').getAttribute('lang'),'en');
    for (const [path, expected] of [['/','The right advice'],['/cabinet','A firm founded on'],['/expertises','Five areas'],['/expertises/affaires','Business, Company'],['/expertises/famille','Family Law'],['/expertises/travail','Employment Law'],['/expertises/penal','Criminal Law'],['/expertises/mediation','Mediation'],['/articles','Legal insights'],['/faq','Your questions'],['/contact','Let’s discuss'],['/mentions-legales','Legal notice'],['/confidentialite','Privacy policy'],['/missing','could not be found']]) {
      await page.goto(base+'/#'+path);
      await page.locator('h1').waitFor();
      assert((await page.locator('h1').innerText()).includes(expected), `${width} ${path}: English heading`);
    }
    await page.goto(base+'/#/articles');
    await page.getByText('Starting a company in Tunisia: SUARL or SARL, how do you choose?', {exact:true}).waitFor();
    assert((await page.locator('body').innerText()).includes('Divorce by mutual consent in Tunisia: the key steps'));
    await page.goto(base+'/#/contact');
    assert.equal(await page.locator('#c-name').getAttribute('placeholder'),'Your full name');
  }
  await page.route('**/api/articles?lang=en', r => r.fulfill({json:{articles:[{id:'english-test',expertiseId:'affaires',image:'/test.jpg',category:'Business law',date:'1 March 2026',readTime:'5 min',title:'An English article',excerpt:'A short summary.',imageAlt:'Illustration',intro:'An English introduction.',sections:[{heading:'First section',paragraphs:['English content.']}],keyPoints:['Key point']}]}}));
  await page.goto(base+'/#/articles/english-test');
  await page.getByRole('heading',{name:'An English article'}).waitFor();
  assert((await page.locator('body').innerText()).includes('English content.'));
  let submitted;
  await page.route('**/api/reservations', async r => { submitted = r.request().postDataJSON(); await r.fulfill({status:201,json:{id:'test',persisted:true}}); });
  await page.goto(base+'/#/contact');
  await page.locator('#c-name').fill('Test Client');
  await page.locator('#c-email').fill('client@example.test');
  await page.locator('#c-domain').selectOption({label:'Business, Company & Commercial Law'});
  await page.locator('#c-message').fill('This is a test consultation message.');
  await page.locator('#c-consent').check();
  await page.getByRole('button',{name:'Send my request'}).click();
  await page.getByText('Your request has been recorded.').waitFor();
  assert.equal(submitted.lang,'en');
  assert.deepEqual(errors,[]);
  console.log('PASS English selection, public pages, articles and contact form on mobile and desktop');
} finally { await browser.close(); }
