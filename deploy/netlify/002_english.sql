-- Apply manually to an EXISTING CMCB Supabase database, after a verified backup.
-- This changes only the language constraints, not existing rows or permissions.
-- Do not run 001_initial_schema.sql again on an existing installation.
BEGIN;
ALTER TABLE cmcb_private.article_translations DROP CONSTRAINT article_translations_lang_check;
ALTER TABLE cmcb_private.article_translations ADD CONSTRAINT article_translations_lang_check CHECK (lang IN ('fr', 'ar', 'en'));
ALTER TABLE cmcb_private.reservations DROP CONSTRAINT reservations_lang_check;
ALTER TABLE cmcb_private.reservations ADD CONSTRAINT reservations_lang_check CHECK (lang IN ('fr', 'ar', 'en'));
COMMIT;
