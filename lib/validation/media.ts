import { z } from "zod";

// Single whitelisted folder for now. Extend this
// list (and the Cloudinary account's folder structure) if subfolders are ever needed.
export const ALLOWED_FOLDERS = ["geoexplorer"] as const;
export const CLOUDINARY_RESOURCE_TYPES = ["image", "video", "raw"] as const;
export type CloudinaryResourceType = (typeof CLOUDINARY_RESOURCE_TYPES)[number];

export const MEDIA_LIMITS = {
  image: { maxBytes: 10 * 1024 * 1024, formats: ["jpg", "jpeg", "png", "webp", "avif"] },
  video: { maxBytes: 100 * 1024 * 1024, maxDurationSeconds: 120, formats: ["mp4", "mov", "webm"] },
  raw: { maxBytes: 20 * 1024 * 1024, formats: ["pdf"] },
} as const;

export const signRequestSchema = z.object({
  folder: z.enum(ALLOWED_FOLDERS),
  resourceType: z.enum(CLOUDINARY_RESOURCE_TYPES),
});

const resourceTypeToMediaType = { image: "IMAGE", video: "VIDEO", raw: "RAW" } as const;

export const saveMediaAssetSchema = z
  .object({
    publicId: z.string().min(1),
    resourceType: z.enum(CLOUDINARY_RESOURCE_TYPES),
    format: z.string().min(1),
    url: z.url(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    duration: z.number().positive().optional(),
    bytes: z.number().int().positive(),
    folder: z.enum(ALLOWED_FOLDERS),
    originalFilename: z.string().optional(),
    alt: z.string().trim().max(300).optional(),
    caption: z.string().trim().max(500).optional(),
  })
  .refine((data) => data.resourceType !== "image" || !!data.alt, {
    message: "Le texte alternatif est obligatoire pour une image.",
    path: ["alt"],
  })
  .transform((data) => ({ ...data, type: resourceTypeToMediaType[data.resourceType] }));

export const updateMediaAssetSchema = z.object({
  id: z.string().min(1),
  alt: z.string().trim().max(300).optional(),
  caption: z.string().trim().max(500).optional(),
});

export const deleteMediaAssetSchema = z.object({ id: z.string().min(1) });

export const deleteMediaAssetsSchema = z.object({ ids: z.array(z.string().min(1)).min(1).max(100) });

export const mediaUsageBatchSchema = z.object({ ids: z.array(z.string().min(1)).min(1).max(100) });

export const searchMediaSchema = z.object({
  type: z.enum(["IMAGE", "VIDEO", "RAW"]).optional(),
  search: z.string().trim().max(200).optional(),
  page: z.number().int().positive().default(1),
});

export const MEDIA_PAGE_SIZE = 24;
