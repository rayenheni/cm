-- Existing CMCB database only. Back up and test before applying.
BEGIN;
CREATE TABLE cmcb_private.article_visitors (
  article_id text NOT NULL REFERENCES cmcb_private.articles(id) ON DELETE CASCADE,
  visitor_hash text NOT NULL CHECK (visitor_hash ~ '^[a-f0-9]{64}$'),
  last_seen timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (article_id, visitor_hash)
);
CREATE INDEX article_visitors_last_seen ON cmcb_private.article_visitors(last_seen);
REVOKE ALL ON cmcb_private.article_visitors FROM PUBLIC, anon, authenticated;
ALTER TABLE cmcb_private.article_visitors ENABLE ROW LEVEL SECURITY;
COMMIT;
