-- ServiceBlock.title/items were the last deferred piece of the
-- localisation pass. Both columns are NOT NULL text/text[] today, so —
-- like Tag.name in 20260806140000 — the cast is unconditional, no CASE
-- WHEN NULL guard needed. `to_jsonb` on a text[] column produces a proper
-- JSON array (verified against the live table: `to_jsonb(items)` →
-- `["a","b","c"]`, `to_jsonb('{}'::text[])` → `[]`).
ALTER TABLE "ServiceBlock" ALTER COLUMN "title" TYPE JSONB
  USING jsonb_build_object('fr', "title");

ALTER TABLE "ServiceBlock" ALTER COLUMN "items" TYPE JSONB
  USING jsonb_build_object('fr', to_jsonb("items"));
