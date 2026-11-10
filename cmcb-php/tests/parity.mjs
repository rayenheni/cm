// Comparaison visuelle React (5173) / PHP (8080). Les polices Google et images distantes
// sont servies localement de façon identique aux deux versions (sandbox sans accès à ces hôtes).
import { chromium as playwright } from '../../node_modules/@playwright/test/index.mjs';
import chromium from '../../node_modules/@sparticuz/chromium/build/index.js';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const php = process.env.PHP_BASE_URL || 'http://127.0.0.1:8080';
const react = process.env.REACT_BASE_URL || 'http://127.0.0.1:5173';
const out = 'tools/test-results/parity'; mkdirSync(out, { recursive: true });
let fonts = readFileSync('public/assets/fonts.css', 'utf8');
for (const m of [...fonts.matchAll(/url\(\/assets\/fonts\/([^)]+)\)/g)]) fonts = fonts.replace(m[0], `url(data:font/woff2;base64,${readFileSync('public/assets/fonts/' + m[1]).toString('base64')})`);
const routes = [['/', 'home'], ['/cabinet', 'cabinet'], ['/expertises', 'expertises'], ['/expertises/affaires', 'expertise'], ['/articles', 'articles'], ['/articles/creer-sa-societe-suarl-sarl', 'article'], ['/faq', 'faq'], ['/contact', 'contact'], ['/mentions-legales', 'legal'], ['/confidentialite', 'privacy'], ['/page-introuvable', '404']];
const executablePath = await chromium.executablePath();
const launch = async () => {
  // The packaged sandbox Chromium occasionally segfaults during startup; retry
  // with a fresh process rather than treating that as a visual regression.
  for (let attempt = 0; ; attempt++) {
    try {
      return await playwright.launch({ executablePath, args: chromium.args.filter(a => !['--disable-web-security', '--allow-running-insecure-content', '--disable-site-isolation-trials'].includes(a)), headless: true });
    } catch (error) {
      if (attempt >= 2) throw error;
      await new Promise(resolve => setTimeout(resolve, 250 * (attempt + 1)));
    }
  }
};
const results = [];
async function shoot(base, path, file, isReact, lang = 'fr', viewport = { width: 1440, height: 1000 }, mobile = false) {
  const browser = await launch();
  try {
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce', isMobile: mobile, hasTouch: mobile });
    const page = await context.newPage();
    if (isReact) await page.addInitScript(l => localStorage.setItem('cmcb-lang', l), lang);
    await page.route('https://fonts.googleapis.com/**', r => r.fulfill({ body: fonts, contentType: 'text/css' }));
    await page.route('https://images.pexels.com/**', r => r.fulfill({ path: '../tests/fixtures/remote-placeholder.jpg', contentType: 'image/jpeg' }));
    await page.route('https://www.openstreetmap.org/**', r => r.fulfill({ body: '', contentType: 'text/html' }));
    await page.goto(base + (isReact ? '/#' + path : path), { waitUntil: 'load', timeout: 60000 });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => { for (const img of document.images) { img.loading = 'eager'; img.decoding = 'sync'; } });
    // Charge les images paresseuses et déclenche les révélations comme un vrai défilement.
    await page.evaluate(async () => {
      const step = innerHeight * 0.8;
      for (let y = 0; y <= document.documentElement.scrollHeight; y += step) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
      scrollTo(0, 0);
      await Promise.all([...document.images].map(img => img.loading === 'lazy' ? new Promise(r => { if (img.complete) return r(); img.addEventListener('load', r, { once: true }); img.addEventListener('error', r, { once: true }); setTimeout(r, 3000); }) : Promise.resolve()));
    });
    await page.waitForTimeout(900);
    await page.screenshot({ path: file, fullPage: true, caret: 'hide' });
  } finally {
    await browser.close();
  }
}
try {
  const devices = process.env.PARITY_FILTER ? [[1440, 1000, 'desktop']] : [[1440, 1000, 'desktop'], [390, 844, 'mobile']];
  for (const [width, height, device] of devices) {
    const langs = process.env.PARITY_FILTER ? [['fr', '']] : [['fr', ''], ['ar', '?lang=ar']];
    for (const [lang, suffix] of langs) {
      for (const [path, name] of routes.filter(([, n]) => !process.env.PARITY_FILTER || n === process.env.PARITY_FILTER)) {
        const key = `${device}-${name}-${lang}`;
        const rfile = `${out}/${key}-react.png`, pfile = `${out}/${key}-php.png`;
        await shoot(react, path, rfile, true, lang, { width, height }, device === 'mobile');
        await shoot(php, path + suffix, pfile, false, lang, { width, height }, device === 'mobile');
        let diff = 'n/a';
        try { diff = execFileSync('compare', ['-metric', 'AE', rfile, pfile, 'null:'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); } catch (e) { diff = (e.stderr || '').trim().split(' ')[0] || 'error'; }
        execFileSync('montage', [rfile, pfile, '-tile', '2x1', '-geometry', '+4+4', '-background', '#24070e', `${out}/${key}-side-by-side.jpg`]);
        results.push({ key, diff }); writeFileSync(`${out}/results.json`, JSON.stringify(results, null, 2)); console.log(key, diff);
      }
    }
  }
  writeFileSync(`${out}/results.json`, JSON.stringify(results, null, 2));
} finally {}
