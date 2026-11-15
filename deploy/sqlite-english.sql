-- Optional manual migration for an existing local Node/SQLite installation.
-- Stop the application, make and verify a backup (including WAL), then apply
-- with foreign_keys enabled. This migration never runs automatically.
PRAGMA foreign_keys=ON;
BEGIN IMMEDIATE;
CREATE TABLE article_translations_english (
  article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  lang TEXT NOT NULL CHECK(lang IN ('fr','ar','en')),
  body TEXT NOT NULL,
  PRIMARY KEY(article_id,lang)
);
INSERT INTO article_translations_english SELECT article_id,lang,body FROM article_translations;
DROP TABLE article_translations;
ALTER TABLE article_translations_english RENAME TO article_translations;
COMMIT;
PRAGMA foreign_key_check;
