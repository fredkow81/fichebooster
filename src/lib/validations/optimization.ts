import { z } from "zod";

export const orientationSchema = z.object({
  storeId: z.string().min(1),
  shopifyProductId: z.string().min(1),
  niche: z.string().min(2, "Précisez la niche du produit"),
  collectionHint: z.string().optional(),
  targetMarket: z.string().default("France"),
  targetLanguage: z.string().default("fr"),
  tone: z.enum(["NATURAL", "PREMIUM", "EXPERT", "ACCESSIBLE"]).default("NATURAL"),
  objective: z
    .enum(["SEO", "GOOGLE_SHOPPING", "CONVERSION", "BALANCED"])
    .default("BALANCED"),
});

export type OrientationInput = z.infer<typeof orientationSchema>;

export const finalizeOptimizationSchema = z.object({
  optimizationId: z.string().min(1),
  finalHandle: z.string().min(1),
  finalTitle: z.string().min(1).max(70),
  finalMetaTitle: z.string().min(1).max(70),
  finalMetaDescription: z.string().min(1).max(160),
  finalDescriptionHtml: z.string().min(1),
  finalVariants: z.array(
    z.object({
      id: z.string(),
      originalName: z.string(),
      recommendedName: z.string(),
    }),
  ),
});

export type FinalizeOptimizationInput = z.infer<typeof finalizeOptimizationSchema>;

export const keywordCheckSchema = z.object({
  storeId: z.string().min(1),
  keyword: z.string().min(1),
  excludeProductId: z.string().optional(),
});
