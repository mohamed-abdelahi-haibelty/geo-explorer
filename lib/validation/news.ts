import { z } from "zod";
import type { JSONContent } from "@tiptap/core";
import { localeSchema } from "@/lib/validation/locale";

// Matches the `news_translation_slug_format` CHECK constraint
// (prisma/migrations/20260806140100_localisation_raw_sql).
const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const jsonContentSchema = z.custom<JSONContent>(
  (val) => typeof val === "object" && val !== null && "type" in (val as Record<string, unknown>),
  { message: "Contenu invalide." },
);

// Free-tier Cloudinary credits are the reason video has a fallback at all,
// so the fallback itself is restricted to the two hosts that reliably embed
// for free.
const ALLOWED_VIDEO_HOSTS = ["youtube.com", "www.youtube.com", "youtu.be", "vimeo.com", "www.vimeo.com"];

const externalVideoUrlSchema = z.url().refine(
  (value) => {
    try {
      return ALLOWED_VIDEO_HOSTS.includes(new URL(value).hostname);
    } catch {
      return false;
    }
  },
  { message: "Seuls les liens YouTube ou Vimeo sont acceptés." },
);

// Per-translation fields — one locale's worth (same shape as
// ArticleTranslation minus `subtitle`, which News never had).
const translatableNewsFields = {
  locale: localeSchema,
  title: z.string().trim().min(3, "Le titre doit contenir au moins 3 caractères.").max(200),
  slug: z.string().trim().regex(SLUG_REGEX, "Le slug ne peut contenir que des minuscules, chiffres et tirets.").optional(),
  excerpt: z.string().trim().max(320).optional(),
  contentJson: jsonContentSchema,
  metaTitle: z.string().trim().max(70).optional(),
  metaDescription: z.string().trim().max(320).optional(),
};

// Reader-facing, so locale-keyed — unlike `position`, which
// is structural and shared across every locale.
const galleryCaptionSchema = z
  .object({
    fr: z.string().trim().max(300).optional(),
    en: z.string().trim().max(300).optional(),
    ar: z.string().trim().max(300).optional(),
  })
  .default({});

const galleryItemSchema = z.object({
  mediaId: z.string().min(1),
  caption: galleryCaptionSchema,
});

// Locale-independent fields — live on the parent News, edited once regardless
// of which locale tab is active (mirroring the same rule
// for Article's cover/authors/tags). `position` is derived from array order
// at the action layer, not carried in the payload — same rule
// resolveTagIds/authorIds already follow for Article.
const sharedNewsFields = {
  coverId: z.string().min(1).optional(),
  eventDate: z.iso.date().optional(),
  location: z.string().trim().max(200).optional(),
  externalVideoUrl: externalVideoUrlSchema.optional(),
  media: z.array(galleryItemSchema).max(50).default([]),
};

export const createNewsSchema = z.object({
  ...translatableNewsFields,
  ...sharedNewsFields,
});

export const createNewsTranslationSchema = z.object({
  newsId: z.string().min(1),
  ...translatableNewsFields,
  ...sharedNewsFields,
});

export const updateNewsSchema = z.object({
  translationId: z.string().min(1),
  // Concurrent-edit guard, scoped to NewsTranslation.updatedAt
  // exactly like ArticleTranslation.
  updatedAt: z.string().min(1),
  force: z.boolean().optional(),
  ...translatableNewsFields,
  ...sharedNewsFields,
});

export const publishNewsSchema = z.object({ translationId: z.string().min(1) });
export const unpublishNewsSchema = z.object({ translationId: z.string().min(1) });
export const deleteNewsSchema = z.object({ newsId: z.string().min(1) });

export const listNewsAdminSchema = z.object({
  search: z.string().trim().max(200).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  sort: z.enum(["updated_desc", "updated_asc"]).default("updated_desc"),
  page: z.number().int().positive().default(1),
});

export const NEWS_PAGE_SIZE = 20;
