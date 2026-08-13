import { z } from "zod";

// Every field is locale-independent factual data (company name, address,
// contacts) — no translation table, no JSON, unlike every other entity
// here. `contactRecipients` is the one field with a real invariant:
// the contact form needs somewhere to deliver to.
export const updateSiteSettingSchema = z.object({
  companyName: z.string().trim().min(1, "Le nom de l'entreprise est obligatoire.").max(200),
  tagline: z.string().trim().max(300).optional(),
  address: z.string().trim().max(300).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  phones: z.array(z.string().trim().min(1).max(40)).max(6).default([]),
  email: z.email("Adresse e-mail invalide.").optional(),
  siteUrl: z.url("URL invalide.").optional(),
  contactRecipients: z.array(z.email("Adresse e-mail invalide.")).min(1, "Au moins un destinataire est requis.").max(10),
  mapEmbedUrl: z.url("URL invalide.").optional(),
  linkedin: z.url("URL invalide.").optional(),
  facebook: z.url("URL invalide.").optional(),
  defaultOgImage: z.string().min(1).optional(),
  analyticsId: z.string().trim().max(60).optional(),
  updatedAt: z.string().min(1).optional(),
  force: z.boolean().optional(),
});
