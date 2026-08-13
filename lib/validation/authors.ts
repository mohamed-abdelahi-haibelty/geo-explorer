import { z } from "zod";
import { localizedTextSchema } from "@/lib/validation/locale";

// Matches the `author_slug_format` CHECK constraint (prisma/migrations/20260801130500_raw_sql_constraints).
const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// title/bio are locale-keyed JSON — {fr, en?, ar?}. Optional as a
// whole (an author can have no title/bio at all), but if present, fr is
// required — the admin always writes French first.
export const authorInputSchema = z.object({
  name: z.string().trim().min(2, "Le nom est obligatoire.").max(120),
  slug: z
    .string()
    .trim()
    .regex(SLUG_REGEX, "Le slug ne peut contenir que des minuscules, chiffres et tirets.")
    .optional(),
  title: localizedTextSchema(z.string().trim().max(120)).optional(),
  bio: localizedTextSchema(z.string().trim().max(3000)).optional(),
  email: z.email("Adresse e-mail invalide.").optional(),
  linkedin: z.url("URL LinkedIn invalide.").optional(),
  photoId: z.string().min(1).optional(),
});

export const createAuthorSchema = authorInputSchema;
export const updateAuthorSchema = authorInputSchema.extend({ id: z.string().min(1) });
export const deleteAuthorSchema = z.object({ id: z.string().min(1) });
