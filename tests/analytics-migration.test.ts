import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('analytics migration preserves existing articles and protects its table', async () => {
  const db=new PGlite();
  try {
    await db.exec('CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE SCHEMA cmcb_private; CREATE TABLE cmcb_private.articles(id text PRIMARY KEY); INSERT INTO cmcb_private.articles VALUES (\'a\');');
    await db.exec(await readFile('deploy/netlify/003_article_analytics.sql','utf8'));
    assert.equal((await db.query('SELECT count(*)::int n FROM cmcb_private.articles')).rows[0].n,1);
    const permissions=await db.query("SELECT has_table_privilege('anon','cmcb_private.article_visitors','SELECT') AS allowed, relrowsecurity AS rls FROM pg_class WHERE oid='cmcb_private.article_visitors'::regclass");
    assert.deepEqual(permissions.rows,[{allowed:false,rls:true}]);
    await db.exec("INSERT INTO cmcb_private.article_visitors(article_id,visitor_hash) VALUES('a',repeat('a',64)); DELETE FROM cmcb_private.articles WHERE id='a'");
    assert.equal((await db.query('SELECT count(*)::int n FROM cmcb_private.article_visitors')).rows[0].n,0);
  } finally {await db.close()}
});
