-- Locale-aware re-add of the raw-SQL constraints/search infrastructure that
-- 20260806140000_localisation_schema removed from Article/News. Prisma can't
-- express any of this (CHECK constraints, partial indexes, tsvector search)
-- — same pattern as 20260801130500_raw_sql_constraints, now targeting the
-- translation tables with a per-row search configuration.

-- 1. A translation with status PUBLISHED must have a publishedAt.
ALTER TABLE "ArticleTranslation" ADD CONSTRAINT article_translation_published_at_required
  CHECK (status <> 'PUBLISHED' OR "publishedAt" IS NOT NULL);
ALTER TABLE "NewsTranslation" ADD CONSTRAINT news_translation_published_at_required
  CHECK (status <> 'PUBLISHED' OR "publishedAt" IS NOT NULL);

-- 2. Slug format, same rule as every other slugged table.
ALTER TABLE "ArticleTranslation" ADD CONSTRAINT article_translation_slug_format
  CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
ALTER TABLE "NewsTranslation" ADD CONSTRAINT news_translation_slug_format
  CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

-- 3. Partial indexes for the public listing queries (the 99% read path),
-- now scoped per locale.
CREATE INDEX article_translation_public_idx ON "ArticleTranslation" (locale, "publishedAt" DESC)
  WHERE status = 'PUBLISHED';
CREATE INDEX news_translation_public_idx ON "NewsTranslation" (locale, "publishedAt" DESC)
  WHERE status = 'PUBLISHED';

-- 4. Full-text search, per-locale configuration.
--
-- Not a GENERATED ALWAYS AS column (unlike the single-language version this
-- replaces): `to_tsvector(regconfig, text)` requires the regconfig argument
-- to be IMMUTABLE to be usable in a generated column's expression, but the
-- text->regconfig cast (`'french'::regconfig`) is only STABLE — it depends
-- on the pg_ts_config catalog — even when the branch is a literal selected
-- via CASE. Postgres rejects it at DDL time ("generation expression is not
-- immutable"). A BEFORE INSERT/UPDATE trigger has no such restriction and
-- gets the identical stored, indexed result.
--
-- Postgres ships french/english/arabic text search configs in core
-- (verified against this instance: `SELECT cfgname FROM pg_ts_config`
-- includes all three) — no extension needed.
ALTER TABLE "ArticleTranslation" ADD COLUMN search_vector tsvector;
ALTER TABLE "NewsTranslation" ADD COLUMN search_vector tsvector;

CREATE FUNCTION translation_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector(
      (CASE NEW.locale WHEN 'FR' THEN 'french' WHEN 'EN' THEN 'english' ELSE 'arabic' END)::regconfig,
      coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector(
      (CASE NEW.locale WHEN 'FR' THEN 'french' WHEN 'EN' THEN 'english' ELSE 'arabic' END)::regconfig,
      coalesce(NEW."plainText", '')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER article_translation_search_vector_trigger
  BEFORE INSERT OR UPDATE OF locale, title, "plainText" ON "ArticleTranslation"
  FOR EACH ROW EXECUTE FUNCTION translation_search_vector_update();

CREATE TRIGGER news_translation_search_vector_trigger
  BEFORE INSERT OR UPDATE OF locale, title, "plainText" ON "NewsTranslation"
  FOR EACH ROW EXECUTE FUNCTION translation_search_vector_update();

-- Backfill the rows the data migration in 20260806140000 already inserted
-- (their INSERT ran before this trigger existed).
UPDATE "ArticleTranslation" SET search_vector =
  setweight(to_tsvector((CASE locale WHEN 'FR' THEN 'french' WHEN 'EN' THEN 'english' ELSE 'arabic' END)::regconfig, coalesce(title, '')), 'A') ||
  setweight(to_tsvector((CASE locale WHEN 'FR' THEN 'french' WHEN 'EN' THEN 'english' ELSE 'arabic' END)::regconfig, coalesce("plainText", '')), 'B');
UPDATE "NewsTranslation" SET search_vector =
  setweight(to_tsvector((CASE locale WHEN 'FR' THEN 'french' WHEN 'EN' THEN 'english' ELSE 'arabic' END)::regconfig, coalesce(title, '')), 'A') ||
  setweight(to_tsvector((CASE locale WHEN 'FR' THEN 'french' WHEN 'EN' THEN 'english' ELSE 'arabic' END)::regconfig, coalesce("plainText", '')), 'B');

CREATE INDEX article_translation_search_idx ON "ArticleTranslation" USING GIN (search_vector);
CREATE INDEX news_translation_search_idx ON "NewsTranslation" USING GIN (search_vector);
