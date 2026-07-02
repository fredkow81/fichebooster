import { prisma } from "@/lib/prisma";
import type { ExistingKeywordUsage } from "@/lib/ai/prompt";
import type { KeywordUsage } from "./keyword";

/**
 * Builds the list of keywords already targeted by other products in the
 * store, used both to feed the AI prompt (avoid suggesting a duplicate)
 * and to run the deterministic cannibalization check server-side.
 */
export async function getExistingKeywordUsages(
  storeId: string,
  excludeShopifyProductId?: string,
): Promise<ExistingKeywordUsage[]> {
  const optimizations = await prisma.productOptimization.findMany({
    where: {
      storeId,
      shopifyProductId: excludeShopifyProductId ? { not: excludeShopifyProductId } : undefined,
      status: "PUBLISHED",
    },
    include: { keywordRecommendation: true },
  });

  return optimizations.map((opt) => ({
    productId: opt.shopifyProductId,
    title: opt.finalTitle ?? "",
    handle: opt.finalHandle ?? "",
    metaTitle: opt.finalMetaTitle,
    metaDescription: opt.finalMetaDescription,
  }));
}

export async function getExistingKeywordList(
  storeId: string,
  excludeShopifyProductId?: string,
): Promise<KeywordUsage[]> {
  const optimizations = await prisma.productOptimization.findMany({
    where: {
      storeId,
      shopifyProductId: excludeShopifyProductId ? { not: excludeShopifyProductId } : undefined,
      status: "PUBLISHED",
    },
    include: { keywordRecommendation: true },
  });

  return optimizations
    .filter((opt) => opt.keywordRecommendation)
    .map((opt) => ({
      productId: opt.shopifyProductId,
      keyword: opt.keywordRecommendation!.primaryKeyword,
    }));
}
