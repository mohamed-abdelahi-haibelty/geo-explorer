import { z } from "zod";
import { localeSchema } from "@/lib/validation/locale";

// The envelope around a PageSection write. `data`'s real shape depends on
// (page, key) — validated in a second pass against getSectionSchema(page,key)
// inside the action, since a single top-level Zod object can't statically
// branch on two sibling fields' values.
export const saveSectionSchema = z.object({
  page: z.enum(["HOME", "ABOUT", "SERVICES", "CONTACT"]),
  key: z.string().trim().min(1),
  locale: localeSchema,
  published: z.boolean(),
  data: z.unknown(),
  updatedAt: z.string().min(1).optional(),
  force: z.boolean().optional(),
});
