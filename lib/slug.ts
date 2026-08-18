// Matches the `_slug_format` CHECK constraints (see
// prisma/migrations/20260818120000_unicode_slug_format).
//
// Unicode-aware on purpose: the old `[^a-z0-9]` filter deleted every Arabic
// character, so an Arabic title slugified to "" and ensureUniqueSlug() fell
// back to "sans-titre" — then "sans-titre-2", "sans-titre-3"… for every
// subsequent AR translation. Combining marks are still stripped after NFD, so
// Latin accents (é → e) and Arabic harakat both drop out of the slug.
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{Mn}+/gu, "")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

// The shape slugify() produces, and what the `_slug_format` CHECK constraints
// accept: lowercase or caseless letters (\p{Ll} for latin, \p{Lo} for Arabic
// and other unicased scripts), digits, single hyphens between them. Exported so
// the Zod schemas can't drift from slugify() and the database rule — they held
// four separate copies of an ASCII-only version, which rejected every Arabic
// slug the moment slugify() started producing them.
export const SLUG_REGEX = /^[\p{Ll}\p{Lo}\p{Lm}\p{N}]+(-[\p{Ll}\p{Lo}\p{Lm}\p{N}]+)*$/u;

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
