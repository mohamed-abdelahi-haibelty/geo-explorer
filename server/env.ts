import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.url(),
  UPSTASH_REDIS_REST_URL: z.url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  REVALIDATE_SECRET: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  CONTACT_FROM_EMAIL: z.email(),
});

export const env = envSchema.parse(process.env);
