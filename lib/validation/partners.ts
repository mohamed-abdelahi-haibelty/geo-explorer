import { z } from "zod";
import { localizedTextSchema } from "@/lib/validation/locale";

// Matches the slug-format CHECK constraints every other slugged table has
// (prisma/migrations/20260801130500_raw_sql_constraints).
const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// `order` is deliberately absent — set only by reorderPartnersAction, so the
// create/edit dialog and the list's drag reorder never race to write the
// same field (same reasoning as Service's list-only order edits).
export const partnerInputSchema = z.object({
  name: z.string().trim().min(1, "Le nom est obligatoire.").max(120),
  slug: z
    .string()
    .trim()
    .regex(SLUG_REGEX, "Le slug ne peut contenir que des minuscules, chiffres et tirets.")
    .optional(),
  websiteUrl: z.url("URL invalide.").optional(),
  category: localizedTextSchema(z.string().trim().max(60)).optional(),
  logoId: z.string().min(1).optional(),
  published: z.boolean().default(true),
});

export const createPartnerSchema = partnerInputSchema;
export const updatePartnerSchema = partnerInputSchema.extend({ id: z.string().min(1) });
export const deletePartnerSchema = z.object({ id: z.string().min(1) });
export const reorderPartnersSchema = z.object({ orderedIds: z.array(z.string().min(1)).min(1) });
export const togglePartnerPublishedSchema = z.object({ id: z.string().min(1), published: z.boolean() });
