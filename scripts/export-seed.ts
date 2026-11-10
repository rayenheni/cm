import { writeFileSync } from 'node:fs';
import { ARTICLES } from '../src/data/content.ts';
import { ARTICLES_AR } from '../src/data/content.ar.ts';
const articles = ARTICLES.map(article => {
  const { id, expertiseId, image, category, readTime, title, excerpt, imageAlt, intro, sections, keyPoints } = article;
  const ar = ARTICLES_AR.find(a => a.id === id);
  if (!ar) throw new Error(`Missing Arabic article: ${id}`);
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const [day, month, year] = article.date.split(' ');
  const createdAt = new Date(Date.UTC(Number(year), months.indexOf(month), Number(day), 9)).toISOString();
  return { id, expertiseId, image, status: 'published', createdAt, updatedAt: createdAt, publishedAt: createdAt,
    translations: { fr: { category, readTime, title, excerpt, imageAlt, intro, sections, keyPoints }, ar: { category: ar.category, readTime: ar.readTime, title: ar.title, excerpt: ar.excerpt, imageAlt: ar.imageAlt, intro: ar.intro, sections: ar.sections, keyPoints: ar.keyPoints } } };
});
writeFileSync('server/seed.ts', '// Generated from the original site content by npm run seed:export.\nimport type { StoredArticle } from "../src/lib/api-types.js";\nexport const SEED_ARTICLES: StoredArticle[] = ' + JSON.stringify(articles, null, 2) + ';\n');
console.log(`Exported ${articles.length} bilingual articles.`);
