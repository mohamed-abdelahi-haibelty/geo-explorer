-- Slugs pouvant contenir n'importe quelle écriture, pas seulement l'ASCII.
--
-- slugify() supprimait tout caractère hors [a-z0-9] : un titre arabe donnait
-- une chaîne vide, ensureUniqueSlug() retombait sur "sans-titre", et chaque
-- traduction arabe entrait en collision — sans-titre, sans-titre-2,
-- sans-titre-3… Le CHECK ASCII ci-dessous verrouillait ce comportement côté
-- base : même corrigé côté application, un slug arabe aurait été rejeté.
--
-- [[:alnum:]] est sensible à l'Unicode dans une base UTF-8, donc l'arabe (et
-- toute autre écriture) passe désormais. `slug = lower(slug)` conserve la
-- règle de minuscules que l'ancienne classe ASCII imposait implicitement.
--
-- Élargissement strict : tous les slugs existants (ASCII minuscules) restent
-- valides, aucune donnée à migrer.

ALTER TABLE "ArticleTranslation" DROP CONSTRAINT article_translation_slug_format;
ALTER TABLE "ArticleTranslation" ADD CONSTRAINT article_translation_slug_format
  CHECK (slug ~ '^[[:alnum:]]+(-[[:alnum:]]+)*$' AND slug = lower(slug));

ALTER TABLE "NewsTranslation" DROP CONSTRAINT news_translation_slug_format;
ALTER TABLE "NewsTranslation" ADD CONSTRAINT news_translation_slug_format
  CHECK (slug ~ '^[[:alnum:]]+(-[[:alnum:]]+)*$' AND slug = lower(slug));

ALTER TABLE "Service" DROP CONSTRAINT service_slug_format;
ALTER TABLE "Service" ADD CONSTRAINT service_slug_format
  CHECK (slug ~ '^[[:alnum:]]+(-[[:alnum:]]+)*$' AND slug = lower(slug));

ALTER TABLE "Author" DROP CONSTRAINT author_slug_format;
ALTER TABLE "Author" ADD CONSTRAINT author_slug_format
  CHECK (slug ~ '^[[:alnum:]]+(-[[:alnum:]]+)*$' AND slug = lower(slug));

ALTER TABLE "Partner" DROP CONSTRAINT partner_slug_format;
ALTER TABLE "Partner" ADD CONSTRAINT partner_slug_format
  CHECK (slug ~ '^[[:alnum:]]+(-[[:alnum:]]+)*$' AND slug = lower(slug));

ALTER TABLE "Tag" DROP CONSTRAINT tag_slug_format;
ALTER TABLE "Tag" ADD CONSTRAINT tag_slug_format
  CHECK (slug ~ '^[[:alnum:]]+(-[[:alnum:]]+)*$' AND slug = lower(slug));
