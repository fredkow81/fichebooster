import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/api/session";
import { requireOwnedOptimization } from "@/lib/api/optimization-access";
import { handleApiError } from "@/lib/api/response";
import { getAiProvider } from "@/lib/ai";
import type { PromptContext } from "@/lib/ai/prompt";
import { listCollections, getSimilarProducts } from "@/lib/shopify/service";
import { pickMostRelevantCollection, rankSimilarProducts } from "@/lib/shopify/similarity";
import { getExistingKeywordList, getExistingKeywordUsages } from "@/lib/seo/keyword-repository";
import { checkCannibalization } from "@/lib/seo/keyword";
import { computeSeoScore } from "@/lib/seo/scoring";
import type { ShopifyProduct, ShopifyCollectionRef } from "@/lib/shopify/types";

export const maxDuration = 60;

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const { optimization, snapshot, store } = await requireOwnedOptimization(params.id, userId);

    await prisma.productOptimization.update({
      where: { id: optimization.id },
      data: { status: "ANALYZING", errorMessage: null },
    });

    const snapshotCollections = snapshot.collections as unknown as ShopifyCollectionRef[];
    const snapshotImages = snapshot.images as unknown as string[];
    const snapshotVariants = snapshot.variants as unknown as ShopifyProduct["variants"];

    const product: ShopifyProduct = {
      id: snapshot.shopifyProductId,
      title: snapshot.title,
      handle: snapshot.handle,
      descriptionHtml: snapshot.descriptionHtml,
      vendor: snapshot.vendor ?? "",
      productType: snapshot.productType ?? "",
      status: "ACTIVE",
      seo: { title: snapshot.metaTitle, description: snapshot.metaDescription },
      images: snapshotImages.map((url, i) => ({ id: `snapshot-${i}`, url, altText: null })),
      variants: snapshotVariants,
      collections: snapshotCollections,
      onlineStoreUrl: null,
      updatedAt: snapshot.capturedAt.toISOString(),
    };

    const collections = await listCollections(store);
    const primaryCollection = pickMostRelevantCollection(product.title, snapshotCollections);
    const similarCandidates = primaryCollection
      ? await getSimilarProducts(store, primaryCollection.id, product.id)
      : [];
    const similarProducts = rankSimilarProducts(product.title, similarCandidates, 8);

    const existingKeywordUsages = await getExistingKeywordUsages(store.id, product.id);

    const ctx: PromptContext = {
      product,
      storeDomain: store.shopDomain,
      collections,
      similarProducts,
      existingKeywords: existingKeywordUsages,
      orientation: {
        niche: optimization.niche,
        collectionHint: optimization.collectionHint ?? undefined,
        targetMarket: optimization.targetMarket,
        targetLanguage: optimization.targetLanguage,
        tone: optimization.tone,
        objective: optimization.objective,
      },
    };

    const result = await getAiProvider().generateOptimization(ctx, product.images.map((i) => i.url));

    // Server-side ground truth for cannibalization, independent of the AI's
    // own (fuzzier) self-assessment — see src/lib/seo/keyword.ts.
    const existingKeywordList = await getExistingKeywordList(store.id, product.id);
    const cannibalizationCheck = checkCannibalization(
      result.keyword.primary_keyword,
      existingKeywordList,
      product.id,
    );
    const finalRisk =
      cannibalizationCheck.risk === "HIGH" || result.keyword.cannibalization_risk === "HIGH"
        ? "HIGH"
        : cannibalizationCheck.risk === "MEDIUM" || result.keyword.cannibalization_risk === "MEDIUM"
          ? "MEDIUM"
          : "LOW";

    const recommendedVariants = result.variants.recommended_variants.map((v) => ({
      id: v.id ?? "",
      originalName: v.original_name,
      recommendedName: v.recommended_name,
    }));

    const scoreBefore = computeSeoScore({
      hasUniquePrimaryKeyword: false,
      title: snapshot.title,
      metaTitle: snapshot.metaTitle ?? "",
      metaDescription: snapshot.metaDescription ?? "",
      descriptionHtml: snapshot.descriptionHtml,
      hasInternalLinks: false,
      variantsConsistent: false,
      cannibalizationRisk: "LOW",
    });

    const scoreAfter = computeSeoScore({
      hasUniquePrimaryKeyword: finalRisk === "LOW",
      title: result.titles.balanced_title,
      metaTitle: result.meta.meta_title,
      metaDescription: result.meta.meta_description,
      descriptionHtml: result.description_html,
      hasInternalLinks: Boolean(
        result.internal_links.collection_link.url && result.internal_links.similar_product_link.url,
      ),
      variantsConsistent: true,
      cannibalizationRisk: finalRisk,
    });

    const updated = await prisma.productOptimization.update({
      where: { id: optimization.id },
      data: {
        status: "READY_FOR_REVIEW",
        imageAnalysis: result.image_analysis,
        recommendedHandle: result.handle.recommended_handle,
        recommendedTitleSeo: result.titles.seo_title,
        recommendedTitleShopping: result.titles.google_shopping_title,
        recommendedTitleBalanced: result.titles.balanced_title,
        recommendedMetaTitle: result.meta.meta_title,
        recommendedMetaDescription: result.meta.meta_description,
        recommendedVariants,
        recommendedDescriptionHtml: result.description_html,
        finalHandle: result.handle.recommended_handle,
        finalTitle: result.titles.balanced_title,
        finalMetaTitle: result.meta.meta_title,
        finalMetaDescription: result.meta.meta_description,
        finalVariants: recommendedVariants,
        finalDescriptionHtml: result.description_html,
        seoScoreBefore: scoreBefore.score,
        seoScoreAfter: scoreAfter.score,
        seoImprovements: scoreAfter.passed,
        seoRisks: scoreAfter.toImprove,
        errorMessage: null,
        keywordRecommendation: {
          upsert: {
            create: {
              primaryKeyword: result.keyword.primary_keyword,
              relevanceScore: result.keyword.relevance_score,
              transactionalIntentScore: result.keyword.transactional_intent_score,
              cannibalizationRisk: finalRisk,
              conflictingProductIds: cannibalizationCheck.conflictingProductIds,
              justification: result.keyword.justification,
            },
            update: {
              primaryKeyword: result.keyword.primary_keyword,
              relevanceScore: result.keyword.relevance_score,
              transactionalIntentScore: result.keyword.transactional_intent_score,
              cannibalizationRisk: finalRisk,
              conflictingProductIds: cannibalizationCheck.conflictingProductIds,
              justification: result.keyword.justification,
            },
          },
        },
      },
      include: { keywordRecommendation: true },
    });

    await prisma.internalLinkRecommendation.deleteMany({ where: { optimizationId: optimization.id } });
    await prisma.internalLinkRecommendation.createMany({
      data: [
        {
          optimizationId: optimization.id,
          type: "collection",
          targetUrl: result.internal_links.collection_link.url,
          targetHandle: result.internal_links.collection_link.url.split("/").pop() ?? "",
          anchorText: result.internal_links.collection_link.anchor,
          justification: result.internal_links.collection_link.justification,
        },
        {
          optimizationId: optimization.id,
          type: "similar_product",
          targetUrl: result.internal_links.similar_product_link.url,
          targetHandle: result.internal_links.similar_product_link.url.split("/").pop() ?? "",
          anchorText: result.internal_links.similar_product_link.anchor,
          justification: result.internal_links.similar_product_link.justification,
        },
      ],
    });

    await prisma.optimizationHistory.create({
      data: {
        storeId: store.id,
        optimizationId: optimization.id,
        userId,
        shopifyProductId: product.id,
        action: "draft_saved",
        keyword: result.keyword.primary_keyword,
        oldTitle: snapshot.title,
        newTitle: result.titles.balanced_title,
        oldHandle: snapshot.handle,
        newHandle: result.handle.recommended_handle,
        oldMetaDescription: snapshot.metaDescription,
        newMetaDescription: result.meta.meta_description,
        status: "READY_FOR_REVIEW",
      },
    });

    const internalLinks = await prisma.internalLinkRecommendation.findMany({
      where: { optimizationId: optimization.id },
    });

    return NextResponse.json({ optimization: updated, internalLinks });
  } catch (err) {
    await prisma.productOptimization
      .update({
        where: { id: params.id },
        data: {
          status: "ERROR",
          errorMessage: err instanceof Error ? err.message : "Erreur inconnue lors de l'analyse.",
        },
      })
      .catch(() => undefined);
    return handleApiError(err);
  }
}
