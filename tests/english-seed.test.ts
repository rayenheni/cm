import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SEED_ARTICLES } from '../server/seed.js';
import { SEED_ENGLISH } from '../src/seed-english.js';
import { articleSchema } from '../server/validation.js';

test('all original articles have complete English translations for new installations', () => {
  assert.equal(SEED_ARTICLES.length, 4);
  assert.deepEqual(Object.keys(SEED_ENGLISH).sort(), SEED_ARTICLES.map(a => a.id).sort());
  for (const article of SEED_ARTICLES) {
    const en = article.translations.en;
    assert(en, `${article.id}: English translation`);
    assert.deepEqual(en, SEED_ENGLISH[article.id]);
    assert.equal(en.sections.length, article.translations.fr.sections.length);
    assert.deepEqual(en.sections.map(s => s.paragraphs.length), article.translations.fr.sections.map(s => s.paragraphs.length));
    assert.equal(en.keyPoints.length, article.translations.fr.keyPoints.length);
    const input = { id: article.id, expertiseId: article.expertiseId, image: article.image, status: article.status, translations: article.translations };
    assert(articleSchema.safeParse(input).success, `${article.id}: valid translated article`);
  }
});
