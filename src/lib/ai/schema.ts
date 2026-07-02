import { z } from "zod";

// Strict schema for the structured JSON the AI provider must return.
// Kept in sync with the JSON contract in the prompt (see prompt.ts).

export const imageAnalysisSchema = z.object({
  product_type: z.string(),
  visible_materials: z.array(z.string()),
  colors: z.array(z.string()),
  style: z.string(),
  target_user: z.string(),
  important_visual_details: z.array(z.string()),
});

export const keywordSchema = z.object({
  primary_keyword: z.string(),
  transactional_intent_score: z.number().min(0).max(100),
  relevance_score: z.number().min(0).max(100),
  cannibalization_risk: z.enum(["LOW", "MEDIUM", "HIGH"]),
  justification: z.string(),
});

export const handleSchema = z.object({
  current_handle: z.string(),
  recommended_handle: z.string(),
});

export const titlesSchema = z.object({
  seo_title: z.string().max(70),
  google_shopping_title: z.string().max(70),
  balanced_title: z.string().max(70),
});

export const metaSchema = z.object({
  meta_title: z.string().max(70),
  meta_description: z.string().max(160),
});

export const variantSchema = z.object({
  // Always required (never null/optional): OpenAI's Structured Outputs
  // helper for Zod v3 emits an OpenAPI-style `nullable: true` for
  // nullable/optional fields, which OpenAI's own strict-mode validator then
  // rejects as an invalid JSON Schema. Every product variant we send in the
  // prompt already has a real Shopify id, so requiring a plain string here
  // (never actually empty in practice) sidesteps the incompatibility.
  id: z.string(),
  original_name: z.string(),
  recommended_name: z.string(),
});

export const variantsSchema = z.object({
  current_variants: z.array(variantSchema),
  recommended_variants: z.array(variantSchema),
});

export const internalLinkSchema = z.object({
  url: z.string(),
  anchor: z.string(),
  justification: z.string(),
});

export const internalLinksSchema = z.object({
  collection_link: internalLinkSchema,
  similar_product_link: internalLinkSchema,
});

export const seoScoreSchema = z.object({
  before: z.number().min(0).max(100),
  after: z.number().min(0).max(100),
  improvements: z.array(z.string()),
});

export const aiOptimizationSchema = z.object({
  image_analysis: imageAnalysisSchema,
  keyword: keywordSchema,
  handle: handleSchema,
  titles: titlesSchema,
  meta: metaSchema,
  variants: variantsSchema,
  description_html: z.string(),
  internal_links: internalLinksSchema,
  seo_score: seoScoreSchema,
});

export type AiOptimizationResult = z.infer<typeof aiOptimizationSchema>;

export function parseAiOptimizationResult(raw: unknown): AiOptimizationResult {
  const result = aiOptimizationSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `Réponse IA invalide : ${result.error.issues.map((i) => `${i.path.join(".")} - ${i.message}`).join("; ")}`,
    );
  }
  return result.data;
}
