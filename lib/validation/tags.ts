import { z } from "zod";

export const deleteTagSchema = z.object({ id: z.string().min(1) });
