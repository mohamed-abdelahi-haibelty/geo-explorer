-- Task 04a — Localisation Foundation. Hand-edited (not a plain `prisma migrate
-- dev` diff): combines schema changes with a same-migration data migration
-- (every existing Article/News/Service row becomes its FR translation), which
-- Prisma cannot generate on its own. Ordering matters — old columns are read
-- by the data migration before they're dropped.

-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('FR', 'EN', 'AR');

-- CreateTable (translation tables — PK only for now, indexes/FKs added below
-- once the data migration that reads the old flat columns has run)
CREATE TABLE "ArticleTranslation" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "excerpt" VARCHAR(320),
    "contentJson" JSONB NOT NULL,
    "contentHtml" TEXT NOT NULL,
    "plainText" TEXT NOT NULL,
    "readingTime" INTEGER NOT NULL DEFAULT 0,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "metaTitle" TEXT,
    "metaDescription" VARCHAR(320),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArticleTranslation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NewsTranslation" (
    "id" TEXT NOT NULL,
    "newsId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" VARCHAR(320),
    "contentJson" JSONB NOT NULL,
    "contentHtml" TEXT NOT NULL,
    "plainText" TEXT NOT NULL,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "metaTitle" TEXT,
    "metaDescription" VARCHAR(320),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsTranslation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServiceTranslation" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT NOT NULL,
    "tagline" TEXT,
    "summary" TEXT,
    "metaTitle" TEXT,
    "metaDescription" VARCHAR(320),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceTranslation_pkey" PRIMARY KEY ("id")
);

-- Drop raw-SQL objects (added in 20260801130500_raw_sql_constraints) that
-- reference columns this migration is about to move off Article/News —
-- their locale-aware replacements are re-added in
-- 20260806140100_localisation_raw_sql, after ArticleTranslation/
-- NewsTranslation are populated below.
DROP INDEX "article_search_idx";
ALTER TABLE "Article" DROP COLUMN "search_vector";
ALTER TABLE "Article" DROP CONSTRAINT "article_published_at_required";
ALTER TABLE "Article" DROP CONSTRAINT "article_slug_format";
DROP INDEX "article_public_idx";
ALTER TABLE "News" DROP CONSTRAINT "news_published_at_required";
ALTER TABLE "News" DROP CONSTRAINT "news_slug_format";
DROP INDEX "news_public_idx";

-- Data migration: every existing row becomes its FR translation. Timestamps
-- are copied verbatim (not re-stamped to "now") so createdAt/updatedAt keep
-- their original meaning on the translation row.
INSERT INTO "ArticleTranslation"
  ("id", "articleId", "locale", "slug", "title", "subtitle", "excerpt",
   "contentJson", "contentHtml", "plainText", "readingTime", "status",
   "publishedAt", "metaTitle", "metaDescription", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, "id", 'FR', "slug", "title", "subtitle", "excerpt",
       "contentJson", "contentHtml", "plainText", "readingTime", "status",
       "publishedAt", "metaTitle", "metaDescription", "createdAt", "updatedAt"
FROM "Article";

INSERT INTO "NewsTranslation"
  ("id", "newsId", "locale", "slug", "title", "excerpt",
   "contentJson", "contentHtml", "plainText", "status",
   "publishedAt", "metaTitle", "metaDescription", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, "id", 'FR', "slug", "title", "excerpt",
       "contentJson", "contentHtml", "plainText", "status",
       "publishedAt", "metaTitle", "metaDescription", "createdAt", "updatedAt"
FROM "News";

INSERT INTO "ServiceTranslation"
  ("id", "serviceId", "locale", "title", "tagline", "summary",
   "metaTitle", "metaDescription", "updatedAt")
SELECT gen_random_uuid()::text, "id", 'FR', "title", "tagline", "summary",
       "metaTitle", "metaDescription", "updatedAt"
FROM "Service";

-- Drop the now-migrated flat columns and their indexes from the parents.
DROP INDEX "Article_slug_key";
DROP INDEX "Article_status_publishedAt_idx";
DROP INDEX "Article_featured_publishedAt_idx";
ALTER TABLE "Article"
  DROP COLUMN "slug",
  DROP COLUMN "title",
  DROP COLUMN "subtitle",
  DROP COLUMN "excerpt",
  DROP COLUMN "contentJson",
  DROP COLUMN "contentHtml",
  DROP COLUMN "plainText",
  DROP COLUMN "readingTime",
  DROP COLUMN "status",
  DROP COLUMN "publishedAt",
  DROP COLUMN "metaTitle",
  DROP COLUMN "metaDescription";

DROP INDEX "News_slug_key";
DROP INDEX "News_status_publishedAt_idx";
ALTER TABLE "News"
  DROP COLUMN "slug",
  DROP COLUMN "title",
  DROP COLUMN "excerpt",
  DROP COLUMN "contentJson",
  DROP COLUMN "contentHtml",
  DROP COLUMN "plainText",
  DROP COLUMN "status",
  DROP COLUMN "publishedAt",
  DROP COLUMN "metaTitle",
  DROP COLUMN "metaDescription";

-- Service is structural, not a publication — slug/published/order/icon/hero
-- stay on the parent. Only the translatable text moves off.
ALTER TABLE "Service"
  DROP COLUMN "title",
  DROP COLUMN "tagline",
  DROP COLUMN "summary",
  DROP COLUMN "metaTitle",
  DROP COLUMN "metaDescription";

-- PageSection: add locale, defaulting existing rows to FR for free, and
-- widen the unique key.
ALTER TABLE "PageSection" ADD COLUMN "locale" "Locale" NOT NULL DEFAULT 'FR';
DROP INDEX "PageSection_page_key_key";
CREATE UNIQUE INDEX "PageSection_page_key_locale_key" ON "PageSection"("page", "key", "locale");

-- JSON conversions (short, never-searched strings — see architecture.md's
-- storage-strategy table). Existing values become the `fr` key.
ALTER TABLE "Author" ALTER COLUMN "title" TYPE JSONB
  USING (CASE WHEN "title" IS NULL THEN NULL ELSE jsonb_build_object('fr', "title") END);
ALTER TABLE "Author" ALTER COLUMN "bio" TYPE JSONB
  USING (CASE WHEN "bio" IS NULL THEN NULL ELSE jsonb_build_object('fr', "bio") END);

DROP INDEX "Tag_name_key";
ALTER TABLE "Tag" ALTER COLUMN "name" TYPE JSONB
  USING jsonb_build_object('fr', "name");

ALTER TABLE "Partner" ALTER COLUMN "category" TYPE JSONB
  USING (CASE WHEN "category" IS NULL THEN NULL ELSE jsonb_build_object('fr', "category") END);

ALTER TABLE "MediaAsset" ALTER COLUMN "alt" TYPE JSONB
  USING (CASE WHEN "alt" IS NULL THEN NULL ELSE jsonb_build_object('fr', "alt") END);
ALTER TABLE "MediaAsset" ALTER COLUMN "caption" TYPE JSONB
  USING (CASE WHEN "caption" IS NULL THEN NULL ELSE jsonb_build_object('fr', "caption") END);

-- CreateIndex (translation tables)
CREATE UNIQUE INDEX "ArticleTranslation_articleId_locale_key" ON "ArticleTranslation"("articleId", "locale");
CREATE UNIQUE INDEX "ArticleTranslation_locale_slug_key" ON "ArticleTranslation"("locale", "slug");
CREATE INDEX "ArticleTranslation_locale_status_publishedAt_idx" ON "ArticleTranslation"("locale", "status", "publishedAt" DESC);

CREATE UNIQUE INDEX "NewsTranslation_newsId_locale_key" ON "NewsTranslation"("newsId", "locale");
CREATE UNIQUE INDEX "NewsTranslation_locale_slug_key" ON "NewsTranslation"("locale", "slug");
CREATE INDEX "NewsTranslation_locale_status_publishedAt_idx" ON "NewsTranslation"("locale", "status", "publishedAt" DESC);

CREATE UNIQUE INDEX "ServiceTranslation_serviceId_locale_key" ON "ServiceTranslation"("serviceId", "locale");

-- AddForeignKey
ALTER TABLE "ArticleTranslation" ADD CONSTRAINT "ArticleTranslation_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NewsTranslation" ADD CONSTRAINT "NewsTranslation_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "News"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceTranslation" ADD CONSTRAINT "ServiceTranslation_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
