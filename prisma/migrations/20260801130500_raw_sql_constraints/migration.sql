-- 1. Un contenu PUBLISHED doit avoir une date de publication
ALTER TABLE "Article" ADD CONSTRAINT article_published_at_required
  CHECK (status <> 'PUBLISHED' OR "publishedAt" IS NOT NULL);
ALTER TABLE "News" ADD CONSTRAINT news_published_at_required
  CHECK (status <> 'PUBLISHED' OR "publishedAt" IS NOT NULL);

-- 2. Singleton des paramètres
ALTER TABLE "SiteSetting" ADD CONSTRAINT site_setting_singleton CHECK (id = 1);

-- 3. Format des slugs
ALTER TABLE "Article" ADD CONSTRAINT article_slug_format
  CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
ALTER TABLE "News" ADD CONSTRAINT news_slug_format
  CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
ALTER TABLE "Service" ADD CONSTRAINT service_slug_format
  CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
ALTER TABLE "Author" ADD CONSTRAINT author_slug_format
  CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
ALTER TABLE "Partner" ADD CONSTRAINT partner_slug_format
  CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
ALTER TABLE "Tag" ADD CONSTRAINT tag_slug_format
  CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

-- 4. Index partiels pour les listes publiques (le cas 99 % des lectures)
CREATE INDEX article_public_idx ON "Article" ("publishedAt" DESC)
  WHERE status = 'PUBLISHED';
CREATE INDEX news_public_idx ON "News" ("publishedAt" DESC)
  WHERE status = 'PUBLISHED';

-- 5. Recherche plein texte française sur les articles
ALTER TABLE "Article" ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('french', coalesce(title,'')), 'A') ||
    setweight(to_tsvector('french', coalesce("plainText",'')), 'B')
  ) STORED;
CREATE INDEX article_search_idx ON "Article" USING GIN (search_vector);

-- 6. Emails insensibles à la casse
CREATE EXTENSION IF NOT EXISTS citext;
ALTER TABLE "User" ALTER COLUMN email TYPE citext;
