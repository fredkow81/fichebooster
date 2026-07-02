import { z } from "zod";

export const draftUpdateSchema = z.object({
  finalHandle: z.string().optional(),
  finalTitle: z.string().optional(),
  finalMetaTitle: z.string().optional(),
  finalMetaDescription: z.string().optional(),
  finalDescriptionHtml: z.string().optional(),
  finalVariants: z
    .array(
      z.object({
        id: z.string(),
        originalName: z.string(),
        recommendedName: z.string(),
      }),
    )
    .optional(),
});

export type DraftUpdateInput = z.infer<typeof draftUpdateSchema>;
