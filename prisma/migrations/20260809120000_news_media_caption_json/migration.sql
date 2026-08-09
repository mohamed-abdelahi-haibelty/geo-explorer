-- Task 05 step 0: NewsMedia.caption is reader-facing text, so it follows the
-- same locale-keyed-JSON treatment MediaAsset.alt/caption got in
-- 20260806140000_localisation_schema. That migration didn't touch NewsMedia
-- because the table itself predates it (Task 01's initial schema) and no
-- News admin layer existed yet to populate real captions — same USING clause
-- shape, wrapping any existing plain-text value as its `fr` translation.
ALTER TABLE "NewsMedia" ALTER COLUMN "caption" TYPE JSONB
  USING (CASE WHEN "caption" IS NULL THEN NULL ELSE jsonb_build_object('fr', "caption") END);
