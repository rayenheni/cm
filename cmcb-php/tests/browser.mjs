// Optional browser regression; uses the preserved Node project's Playwright dev tools.
// Run from cmcb-php with PHP preview on :8080. Never modifies production content.
import { chromium as playwright } from '../../node_modules/@playwright/test/index.mjs';
import chromium from '../../node_modules/@sparticuz/chromium/build/index.js';
import { readFileSync, mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
const env = Object.fromEntries(readFileSync(process.env.TEST_ENV_FILE || '.env', 'utf8').split('\n').filter(l => l.includes('=')).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:8080';
const browser = await playwright.launch({ executablePath: await chromium.executablePath(), args: chromium.args.filter(a => !['--disable-web-security', '--allow-running-insecure-content', '--disable-site-isolation-trials'].includes(a)), headless: true });
const slug = 'browser-test-' + Date.now(); let admin;
const errors = [];
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage(); admin = page; page.on('pageerror', e => errors.push(e.message));
  // Avoid outbound image requests in the sandbox; layout and application behavior are still exercised.
  await page.route('https://images.pexels.com/**', r => r.fulfill({ path: '../tests/fixtures/remote-placeholder.jpg', contentType: 'image/jpeg' }));
  await page.route('https://www.openstreetmap.org/**', r => r.fulfill({ body: '', contentType: 'text/html' }));
  await page.goto(base + '/'); await page.getByRole('heading', { level: 1 }).waitFor();
  assert.equal(await page.locator('[data-pe-tab]').count(), 5);
  await page.goto(base + '/?lang=ar'); assert.equal(await page.locator('html').getAttribute('dir'), 'rtl');
  await page.goto(base + '/articles'); await page.locator('#article-search').fill('zzzz-no-match'); assert.equal(await page.locator('#article-results > div:visible').count(), 0);
  await page.goto(base + '/contact'); await page.locator('#c-name').fill('Test navigateur'); await page.locator('#c-email').fill('browser@example.test'); await page.locator('#c-domain').selectOption({ label: 'Autre demande' }); await page.locator('#c-message').fill('Demande de test automatique du navigateur, à supprimer après vérification.'); await page.locator('#c-consent').check(); await page.locator('#consultation-form [type=submit]').click(); await page.locator('#form-success').waitFor();
  console.log('PASS public FR/AR, article search, persisted contact');
  await page.goto(base + '/admin'); admin = page;
  await page.getByLabel('Adresse e-mail').fill(env.ADMIN_EMAIL); await page.getByLabel('Mot de passe', { exact: true }).fill('incorrect'); await page.getByRole('button', { name: 'Se connecter', exact: true }).click(); await page.getByRole('alert').filter({ hasText: 'E-mail ou mot de passe incorrect.' }).waitFor();
  await page.getByLabel('Mot de passe', { exact: true }).fill(env.ADMIN_PASSWORD); await page.getByRole('button', { name: 'Se connecter', exact: true }).click(); await page.getByRole('button', { name: 'Nouvel article' }).waitFor();
  await page.getByRole('button', { name: 'Nouvel article' }).click(); await page.locator('#article-form').waitFor(); assert(page.url().endsWith('#/articles/new')); assert.equal(await page.getByRole('dialog').count(), 0);
  await page.locator('[name=id]').fill(slug);
  page.once('dialog', dialog => dialog.dismiss()); await page.getByRole('button', { name: 'Retour aux articles' }).click(); await page.waitForTimeout(100);
  assert(page.url().endsWith('#/articles/new')); assert.equal(await page.locator('[name=id]').inputValue(), slug);
  page.once('dialog', dialog => dialog.accept()); await page.goBack(); await page.getByRole('button', { name: 'Nouvel article' }).waitFor();
  await page.getByRole('button', { name: 'Nouvel article' }).click(); await page.locator('#article-form').waitFor(); await page.locator('[name=id]').fill(slug); await page.locator('[name="fr-title"]').fill('Article de test navigateur'); await page.locator('[name="fr-category"]').fill('Test'); await page.locator('[name="fr-excerpt"]').fill('Résumé de test.'); await page.locator('[name="fr-intro"]').fill('Introduction de test.'); await page.locator('[name="fr-heading"]').fill('Section de test'); await page.locator('[name="fr-paragraphs"]').fill('Paragraphe de test.'); await page.locator('#article-image-file').setInputFiles('../tests/fixtures/remote-placeholder.jpg'); await page.waitForFunction(() => /^\/media\/[a-f0-9]{32}\.jpg$/.test(document.querySelector('#article-image')?.value || '')); await page.waitForFunction(() => document.querySelector('#image-preview')?.naturalWidth > 0); const imageUrl = await page.locator('#article-image').inputValue(); await page.locator('#article-form [type=submit]').click(); await page.getByText(slug, { exact: true }).waitFor();
  await page.locator(`[data-edit="${slug}"]`).click(); await page.locator('#article-form').waitFor(); assert(page.url().endsWith(`#/articles/${slug}/edit`)); assert.equal(await page.getByRole('dialog').count(), 0); assert.equal(await page.locator('#article-image').inputValue(), imageUrl); await page.locator('[name=includeAr]').check(); await page.locator('[name="ar-title"]').fill('مقال تجريبي'); await page.locator('[name="ar-category"]').fill('اختبار'); await page.locator('[name="ar-excerpt"]').fill('ملخص تجريبي.'); await page.locator('[name="ar-intro"]').fill('مقدمة تجريبية.'); await page.locator('[name="ar-heading"]').fill('قسم تجريبي'); await page.locator('[name="ar-paragraphs"]').fill('فقرة تجريبية.'); await page.locator('[name=status]').selectOption('published'); await page.locator('#article-form [type=submit]').click(); await page.getByText('Article de test navigateur', { exact: true }).waitFor();
  console.log('PASS admin login, bilingual create/edit/publish');
  // Bearer sessions intentionally live in memory: verify the public article via HTTP without discarding the admin session.
  const publicArticle = await page.request.get(base + '/articles/' + slug + '?lang=ar'); assert(publicArticle.ok()); assert((await publicArticle.text()).includes('مقال تجريبي')); const publicImage = await page.request.get(base + imageUrl); assert(publicImage.ok()); assert.equal(publicImage.headers()['content-type'], 'image/jpeg');
  await page.getByRole('button', {name:'Nouvel article'}).waitFor(); await page.getByRole('button', { name: 'Réservations', exact: false }).last().click(); await page.getByRole('heading', { name: 'Demandes de consultation' }).waitFor(); await page.locator('[name=q]').fill('browser@example.test'); await page.locator('#reservation-filters [type=submit]').click(); await page.getByText('Test navigateur', { exact: true }).waitFor(); await page.locator('[data-view]').first().click(); await page.locator('#request-status').selectOption('contacted'); await page.locator('#save-request').click(); await page.locator('.badge.contacted').waitFor();
  await page.getByRole('button', { name: 'Sécurité', exact: false }).last().click(); await page.getByRole('heading', { name: 'Sécurité et configuration' }).waitFor();
  mkdirSync('tools/test-results', { recursive: true }); await page.screenshot({ path: 'tools/test-results/admin.png', fullPage: true });
  await page.getByRole('button', { name: 'Déconnexion', exact: true }).last().click(); await page.getByRole('button', { name: 'Se connecter', exact: true }).waitFor(); assert.deepEqual(errors, []); console.log('PASS reservation management, settings, logout; no browser JS errors');
} finally {
  // Clean only records created by this run. Authenticate via API for cleanup even after UI logout.
  if (admin) {
    const login = await admin.request.post(base + '/api/auth/login', { data: { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD, transport: 'bearer' } });
    assert(login.ok(), 'Cleanup login failed'); const auth = await login.json(); const headers = { 'X-CMCB-Session': auth.sessionToken || '', 'X-CSRF-Token': auth.csrfToken || '' };
    const articles = await (await admin.request.get(base + '/api/admin/articles', { headers })).json();
    if ((articles.articles || []).some(a => a.id === slug)) await admin.request.delete(base + '/api/admin/articles/' + slug, { headers });
    const list = await admin.request.get(base + '/api/admin/reservations?q=browser%40example.test', { headers }); const data = await list.json();
    for (const r of data.reservations || []) if (r.email === 'browser@example.test' && r.name === 'Test navigateur') await admin.request.delete(base + '/api/admin/reservations/' + r.id, { headers });
    await admin.request.post(base + '/api/auth/logout', { headers });
  }
  await browser.close();
}
