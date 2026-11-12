import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

// Isolated PostgreSQL-compatible WASM, not a live Supabase deployment.
test('Netlify schema is private, enforces relationships, and refuses reinstallation', async () => {
  const db = new PGlite();
  try {
    await db.exec('CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN;');
    const sql = await readFile('deploy/netlify/001_initial_schema.sql', 'utf8');
    await db.exec(sql);
    const access = await db.query<{ anon_access: boolean; authenticated_access: boolean }>(
      "SELECT has_schema_privilege('anon','cmcb_private','USAGE') AS anon_access, has_schema_privilege('authenticated','cmcb_private','USAGE') AS authenticated_access"
    );
    assert.deepEqual(access.rows, [{ anon_access: false, authenticated_access: false }]);
    const tables = await db.query<{ n: number }>("SELECT count(*)::integer AS n FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='cmcb_private' AND c.relkind='r' AND c.relrowsecurity");
    assert.equal(tables.rows[0].n, 8);
    await db.exec("INSERT INTO cmcb_private.admins(email,password_hash) VALUES ('admin@example.invalid','test-hash');");
    await assert.rejects(db.exec("SET ROLE anon; SELECT * FROM cmcb_private.admins;"));
    await db.exec('RESET ROLE');
    await assert.rejects(db.exec("INSERT INTO cmcb_private.article_translations(article_id,lang,body) VALUES ('missing','fr','{}');"));
    await db.exec("INSERT INTO cmcb_private.articles(id,expertise_id,status) VALUES ('test','famille','draft'); INSERT INTO cmcb_private.article_translations VALUES ('test','fr','{}'); DELETE FROM cmcb_private.articles WHERE id='test';");
    const translations = await db.query<{ n: number }>('SELECT count(*)::integer AS n FROM cmcb_private.article_translations');
    assert.equal(translations.rows[0].n, 0);
    await assert.rejects(db.exec(sql));
    await db.exec('ROLLBACK');
    const admins = await db.query<{ n: number }>('SELECT count(*)::integer AS n FROM cmcb_private.admins');
    assert.equal(admins.rows[0].n, 1, 'a failed reinstallation does not erase data');
  } finally { await db.close(); }
});
