-- LocalBusiness JSON-LD needs real geo coordinates, not a parsed/geocoded
-- address string at render time.
ALTER TABLE "SiteSetting" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "SiteSetting" ADD COLUMN "longitude" DOUBLE PRECISION;
