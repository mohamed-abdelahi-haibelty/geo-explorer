// Matches the `_slug_format` CHECK constraints added in
// prisma/migrations/20260801130500_raw_sql_constraints.
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents (é → e)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Appends -2, -3, … until `checkExists` reports no collision. Callers own the
// DB lookup so this stays a pure helper with no Prisma import.
export async function ensureUniqueSlug(
  base: string,
  checkExists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const root = slugify(base) || "sans-titre";
  let candidate = root;
  let attempt = 1;
  while (await checkExists(candidate)) {
    attempt += 1;
    candidate = `${root}-${attempt}`;
  }
  return candidate;
}
