// Run against a local Vite server: node tests/browser/cabinet-heading.mjs
import { chromium as playwright } from '@playwright/test';
import chromium from '@sparticuz/chromium';
import assert from 'node:assert/strict';

const base = process.env.TEST_REACT_BASE_URL || 'http://127.0.0.1:5173';
const browser = await playwright.launch({ executablePath: await chromium.executablePath(), args: chromium.args.filter(a => !['--disable-web-security', '--allow-running-insecure-content', '--disable-site-isolation-trials'].includes(a)), headless: true });
try {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  await page.route('https://images.pexels.com/**', r => r.fulfill({path:'tests/fixtures/remote-placeholder.jpg', contentType:'image/jpeg'}));
  for (const lang of ['fr', 'ar']) {
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base + '/#/cabinet');
      await page.evaluate(l => localStorage.setItem('cmcb-lang', l), lang);
      await page.reload();
      await page.locator('h1 span').waitFor();
      await page.evaluate(() => document.fonts.ready);
      const result = await page.locator('h1').evaluate(heading => {
        const phrase = heading.querySelector('span');
        const rects = [...phrase.getClientRects()].map(r => ({left:r.left, right:r.right, top:r.top}));
        return { text: phrase.textContent, lang: document.documentElement.lang, rects, headingOverflow: heading.scrollWidth > heading.clientWidth + 1, right: phrase.getBoundingClientRect().right, left: phrase.getBoundingClientRect().left };
      });
      assert.equal(result.lang, lang);
      assert.equal(result.text, lang === 'fr' ? "et l'intégrité." : 'و النزاهة.');
      assert(!result.headingOverflow, `${lang} ${width}: heading overflow`);
      if (lang === 'fr') {
        assert(result.rects.every(rect => Math.abs(rect.top - result.rects[0].top) < 1), `${lang} ${width}: phrase must stay on one line`);
        assert(result.left >= 0 && result.right <= width, `${lang} ${width}: phrase must fit viewport`);
        const intro = await page.locator('h2 + div > p').first().evaluate(p => {
          const first = getComputedStyle(p, '::first-letter');
          const range = document.createRange();
          range.setStart(p.firstChild, 0);
          range.setEnd(p.firstChild, 5);
          return { text: p.textContent.trim(), float: first.float, firstSize: first.fontSize, textSize: getComputedStyle(p).fontSize, lines: range.getClientRects().length };
        });
        assert(intro.text.startsWith('Fondé sur'));
        assert.equal(intro.float, 'none', `${width}: the F must not float`);
        assert.equal(intro.firstSize, intro.textSize, `${width}: the F must match the text size`);
        assert.equal(intro.lines, 1, `${width}: Fondé must stay on one line`);
      }
    }
  }
  console.log('PASS Cabinet heading: French phrase stays together and FR/AR fit mobile and desktop');
} finally { await browser.close(); }
