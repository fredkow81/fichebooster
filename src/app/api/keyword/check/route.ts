import { NextRequest, NextResponse } from "next/server";
import { requireUserId, requireOwnedStore } from "@/lib/api/session";
import { handleApiError } from "@/lib/api/response";
import { keywordCheckSchema } from "@/lib/validations/optimization";
import { getExistingKeywordList } from "@/lib/seo/keyword-repository";
import { checkCannibalization, scoreTransactionalIntent } from "@/lib/seo/keyword";

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const input = keywordCheckSchema.parse(body);
    await requireOwnedStore(input.storeId, userId);

    const existing = await getExistingKeywordList(input.storeId, input.excludeProductId);
    const cannibalization = checkCannibalization(input.keyword, existing, input.excludeProductId);
    const transactionalIntentScore = scoreTransactionalIntent(input.keyword, "");

    return NextResponse.json({
      keyword: input.keyword,
      cannibalizationRisk: cannibalization.risk,
      isExactDuplicate: cannibalization.isExactDuplicate,
      conflictingProductIds: cannibalization.conflictingProductIds,
      transactionalIntentScore,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
