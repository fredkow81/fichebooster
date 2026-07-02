import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/api/session";
import { handleApiError } from "@/lib/api/response";
import { computeSeoScore } from "@/lib/seo/scoring";

const scoreRequestSchema = z.object({
  hasUniquePrimaryKeyword: z.boolean(),
  title: z.string(),
  metaTitle: z.string(),
  metaDescription: z.string(),
  descriptionHtml: z.string(),
  hasInternalLinks: z.boolean(),
  variantsConsistent: z.boolean(),
  cannibalizationRisk: z.enum(["LOW", "MEDIUM", "HIGH"]),
});

export async function POST(req: NextRequest) {
  try {
    await requireUserId();
    const body = await req.json();
    const input = scoreRequestSchema.parse(body);
    const breakdown = computeSeoScore(input);
    return NextResponse.json(breakdown);
  } catch (err) {
    return handleApiError(err);
  }
}
