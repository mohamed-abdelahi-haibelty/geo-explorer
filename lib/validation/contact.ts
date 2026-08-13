import { z } from "zod";
import { localeSchema } from "@/lib/validation/locale";

// The visible form fields — shared between the client (React Hook Form's
// resolver) and the server action's own re-validation. Consent has no
// database column; it only gates submission.
export const contactFormSchema = z.object({
  name: z.string().trim().min(2, "Votre nom est obligatoire.").max(120),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  email: z.email("Adresse e-mail invalide."),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  projectType: z.string().trim().max(100).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Votre message est trop court.").max(4000),
  consent: z.boolean().refine((value) => value === true, {
    message: "L'accord de contact est requis.",
  }),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

// The action's full input: form fields plus the two silent bot checks and
// the visitor's browsing locale. `honeypot` and `startedAt` are never
// surfaced to the visitor as validation errors — per the
// security-sensitive-messaging rule, so they stay outside contactFormSchema
// and are checked procedurally in the action, not via zod refinements that
// would otherwise report a VALIDATION failure.
export const submitContactSchema = contactFormSchema.extend({
  // Never `.max(0)` — a filled honeypot must not surface as a VALIDATION
  // error (that would tell a bot the field exists). The action checks
  // emptiness itself, after this parse succeeds.
  honeypot: z.string().optional().default(""),
  startedAt: z.number(),
  locale: localeSchema,
});

export type SubmitContactInput = z.infer<typeof submitContactSchema>;

// Admin-only — mirrors the `ContactStatus` Prisma enum without importing
// it, same reasoning as localeSchema above (validation schemas stay safe to
// share with client components; server/generated/** is not).
export const contactStatusSchema = z.enum(["NEW", "READ", "ARCHIVED", "SPAM"]);

export const updateContactStatusSchema = z.object({
  id: z.string().min(1),
  status: contactStatusSchema,
});

export const MESSAGES_PAGE_SIZE = 20;
