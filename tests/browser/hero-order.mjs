// Checks mobile/desktop hero order in both implementations, in French and Arabic.
import { chromium as playwright } from '@playwright/test';
import chromium from '@sparticuz/chromium';
import assert from 'node:assert/strict';
const bases = [
  ['PHP', process.env.TEST_PHP_BASE_URL || 'http://127.0.0.1:8080'],
  ['React', process.env.TEST_REACT_BASE_URL || 'http://127.0.0.1:5173'],
];
const browser = await playwright.launch({ executablePath: await chromium.executablePath(), args: chromium.args.filter(a => !['--disable-web-security','--allow-running-insecure-content','--disable-site-isolation-trials'].includes(a)), headless: true });
try {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('https://images.pexels.com/**', r => r.fulfill({path:'tests/fixtures/remote-placeholder.jpg',contentType:'image/jpeg'}));
  await page.route('https://www.openstreetmap.org/**', r => r.fulfill({body:'',contentType:'text/html'}));
  for (const [implementation, base] of bases) {
    for (const lang of ['fr', 'ar']) {
      for (const width of [320, 390, 768, 1024, 1440]) {
        await page.setViewportSize({width, height:900});
        await page.goto(implementation === 'PHP' ? `${base}/?lang=${lang}` : base + '/');
        if (implementation === 'React') {
          await page.evaluate(l => localStorage.setItem('cmcb-lang', l), lang);
          await page.reload();
        }
        await page.locator('#accueil h1').waitFor();
        await page.waitForFunction(() => document.querySelector('#accueil img')?.naturalWidth > 0);
        const result = await page.evaluate(() => {
          const image = document.querySelector('#accueil img');
          const heading = document.querySelector('#accueil h1');
          const i = image.getBoundingClientRect(), h = heading.getBoundingClientRect();
          return { image: {x:i.x,y:i.y,right:i.right,bottom:i.bottom,width:i.width,height:i.height}, heading:{x:h.x,y:h.y,right:h.right}, domBefore: !!(image.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING), overflow: document.documentElement.scrollWidth > innerWidth + 1, lang: document.documentElement.lang };
        });
        assert.equal(result.lang, lang, `${implementation} ${lang} ${width}: language`);
        assert(result.domBefore && result.image.width > 0 && result.image.height > 0, `${implementation} ${lang} ${width}: portrait exists before text in document`);
        assert(!result.overflow, `${implementation} ${lang} ${width}: horizontal overflow`);
        if (width < 1024) assert(result.image.bottom <= result.heading.y, `${implementation} ${lang} ${width}: image must appear above text`);
        else if (lang === 'fr') assert(result.heading.right <= result.image.x + 1, `${implementation} FR ${width}: desktop image on right`);
        else assert(result.image.right <= result.heading.x + 1, `${implementation} AR ${width}: desktop image on left`);
      }
    }
    console.log(`PASS ${implementation}: portrait above text on mobile, unchanged desktop layout, FR/AR`);
  }
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
