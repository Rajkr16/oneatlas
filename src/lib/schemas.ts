import { z } from "zod";

const csv = z
  .string()
  .optional()
  .transform((v) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : []));

export const modelQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  lab: csv,
  provider: csv,
  capability: csv,
  type: csv,
  free: z.enum(["true", "false"]).optional(),
  sort: z.enum(["release", "input_price", "output_price", "context"]).default("release"),
  order: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(24),
});
export type ModelQuery = z.infer<typeof modelQuerySchema>;

export const compareQuerySchema = z.object({
  models: z
    .string()
    .transform((v) => v.split(",").map((s) => s.trim()).filter(Boolean))
    .pipe(z.array(z.string()).min(1).max(4)),
});

export const rankingQuerySchema = z.object({
  benchmark: z.string().optional(),
  category: z.string().optional(),
  type: z.enum(["text", "multimodal", "image"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});
export type RankingQuery = z.infer<typeof rankingQuerySchema>;

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(100),
});
