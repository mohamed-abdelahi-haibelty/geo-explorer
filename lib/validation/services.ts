import { z } from "zod";
import { localizedTextSchema, localizedStringArraySchema, localeSchema } from "@/lib/validation/locale";
import { SERVICE_ICON_NAMES } from "@/lib/service-icons";

// A block's title/items carry all three locales at once (the locale-keyed
// JSON shape) — the form edits one locale's key at a time but always
// resubmits the full object, so other locales' text survives untouched.
export const serviceBlockInputSchema = z.object({
  id: z.string().optional(),
  title: localizedTextSchema(z.string().trim().min(1).max(120)),
  items: localizedStringArraySchema(z.string().trim().min(1).max(400)),
});

// Locale-independent fields (icon/hero/published) plus one locale's
// translation plus the full blocks array, submitted together on every save —
// same "shared fields resubmitted on every translation save" rule
// News/Article follow.
export const updateServiceSchema = z.object({
  serviceId: z.string().min(1),
  locale: localeSchema,
  translationId: z.string().min(1).optional(),
  title: z.string().trim().min(1).max(160),
  tagline: z.string().trim().max(200).optional(),
  summary: z.string().trim().max(2000).optional(),
  metaTitle: z.string().trim().max(70).optional(),
  metaDescription: z.string().trim().max(320).optional(),
  icon: z.enum(SERVICE_ICON_NAMES).optional(),
  heroId: z.string().min(1).optional(),
  published: z.boolean(),
  blocks: z.array(serviceBlockInputSchema).max(12),
  updatedAt: z.string().min(1).optional(),
  force: z.boolean().optional(),
});

export const reorderServicesSchema = z.object({ orderedIds: z.array(z.string().min(1)).min(1) });
export const toggleServicePublishedSchema = z.object({ serviceId: z.string().min(1), published: z.boolean() });

// Minimal on purpose — a new service is a bare FR title, everything else
// (icon, hero, blocks, EN/AR translations) is filled on the edit page
// updateServiceSchema already covers. Not one of the five original fixed
// lines; the client can grow the list from here.
export const createServiceSchema = z.object({
  title: z.string().trim().min(1, "Le titre est obligatoire.").max(160),
});

export const deleteServiceSchema = z.object({ serviceId: z.string().min(1) });
