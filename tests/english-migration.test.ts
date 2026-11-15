import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { PGlite } from '@electric-sql/pglite';

test('English migrations preserve existing translations and permit English', async () => {
  const sqlite = new DatabaseSync(':memory:');
  try {
    sqlite.exec(`PRAGMA foreign_keys=ON; CREATE TABLE articles (id TEXT PRIMARY KEY); CREATE TABLE article_translations (article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE, lang TEXT NOT NULL CHECK(lang IN ('fr','ar')), body TEXT NOT NULL, PRIMARY KEY(article_id,lang)); INSERT INTO articles VALUES ('a'); INSERT INTO article_translations VALUES ('a','fr','French'),('a','ar','Arabic');`);
    sqlite.exec(await readFile('deploy/sqlite-english.sql','utf8'));
    sqlite.exec("INSERT INTO article_translations VALUES ('a','en','English')");
    assert.equal(sqlite.prepare('SELECT count(*) AS n FROM article_translations').get()?.n, 3);
    assert.deepEqual(sqlite.prepare('PRAGMA foreign_key_check').all(), []);
  } finally { sqlite.close(); }
  const pg = new PGlite();
  try {
    await pg.exec('CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN;');
    const oldSchema = (await readFile('deploy/netlify/001_initial_schema.sql','utf8')).replaceAll("lang IN ('fr', 'ar', 'en')", "lang IN ('fr', 'ar')");
    await pg.exec(oldSchema);
    await pg.exec("INSERT INTO cmcb_private.articles(id,expertise_id,status) VALUES('a','affaires','published'); INSERT INTO cmcb_private.article_translations VALUES('a','fr','{}'),('a','ar','{}');");
    await pg.exec(await readFile('deploy/netlify/002_english.sql','utf8'));
    await pg.exec("INSERT INTO cmcb_private.article_translations VALUES('a','en','{}')");
    const result = await pg.query<{ n: number }>('SELECT count(*)::int AS n FROM cmcb_private.article_translations');
    assert.equal(result.rows[0].n, 3);
  } finally { await pg.close(); }
});
