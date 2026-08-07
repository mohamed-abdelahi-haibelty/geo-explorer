import { z } from "zod";
import type { JSONContent } from "@tiptap/core";
import { localeSchema } from "@/lib/validation/locale";

// Matches the `article_translation_slug_format` CHECK constraint
// (prisma/migrations/20260806140100_localisation_raw_sql).
const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const jsonContentSchema = z.custom<JSONContent>(
  (val) => typeof val === "object" && val !== null && "type" in (val as Record<string, unknown>),
  { message: "Contenu invalide." },
);

// Per-translation fields — one locale's worth (Task 04a: "Fields move to
// ArticleTranslation").
const translatableArticleFields = {
  locale: localeSchema,
  title: z.string().trim().min(3, "Le titre doit contenir au moins 3 caractères.").max(200),
  subtitle: z.string().trim().max(300).optional(),
  slug: z.string().trim().regex(SLUG_REGEX, "Le slug ne peut contenir que des minuscules, chiffres et tirets.").optional(),
  excerpt: z.string().trim().max(320).optional(),
  contentJson: jsonContentSchema,
  metaTitle: z.string().trim().max(70).optional(),
  metaDescription: z.string().trim().max(320).optional(),
};

// Locale-independent fields — live on the parent Article, edited once
// regardless of which locale tab is active (Task 04a: "cover, authors, tags
// and PDF stay outside the tabs"). Resubmitted on every translation save.
const sharedArticleFields = {
  coverId: z.string().min(1).optional(),
  pdfUrl: z.url().optional(),
  pdfBytes: z.number().int().positive().optional(),
  featured: z.boolean().default(false),
  authorIds: z.array(z.string().min(1)).max(20).default([]),
  tagNames: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
};

// Brand-new article: creates the parent + its first translation together.
export const createArticleSchema = z.object({
  ...translatableArticleFields,
  ...sharedArticleFields,
});

// Fills a previously-empty locale tab on an existing article.
export const createArticleTranslationSchema = z.object({
  articleId: z.string().min(1),
  ...translatableArticleFields,
  ...sharedArticleFields,
});

export const updateArticleSchema = z.object({
  translationId: z.string().min(1),
  // ISO timestamp of the translation row as last seen by this client — the
  // concurrent-edit guard compares it against the stored row (Task 04 step 9,
  // scoped to ArticleTranslation.updatedAt per Task 04a).
  updatedAt: z.string().min(1),
  force: z.boolean().optional(),
  ...translatableArticleFields,
  ...sharedArticleFields,
});

export const publishArticleSchema = z.object({ translationId: z.string().min(1) });
export const unpublishArticleSchema = z.object({ translationId: z.string().min(1) });
export const deleteArticleSchema = z.object({ articleId: z.string().min(1) });

export const listArticlesAdminSchema = z.object({
  search: z.string().trim().max(200).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  authorId: z.string().min(1).optional(),
  sort: z.enum(["updated_desc", "updated_asc"]).default("updated_desc"),
  page: z.number().int().positive().default(1),
});

export const ARTICLES_PAGE_SIZE = 20;
