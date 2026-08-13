-- ContactMessage gets a `locale` column so the admin inbox (and a future
-- reply) knows which language the visitor was browsing in. No existing
-- rows (ContactMessage is new), so the `FR` default is a formality, not a
-- real backfill.
ALTER TABLE "ContactMessage" ADD COLUMN "locale" "Locale" NOT NULL DEFAULT 'FR';
