import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/api/session";
import { requireOwnedOptimization } from "@/lib/api/optimization-access";
import { handleApiError, jsonError } from "@/lib/api/response";
import { updateProduct } from "@/lib/shopify/service";
import { validateAll } from "@/lib/seo/validators";
import { extractGid } from "@/lib/utils";
import type { VariantPair } from "@/lib/seo/validators";

export const maxDuration = 30;

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const { optimization, snapshot, store } = await requireOwnedOptimization(params.id, userId);

    if (
      !optimization.finalTitle ||
      !optimization.finalHandle ||
      !optimization.finalMetaTitle ||
      !optimization.finalMetaDescription ||
      !optimization.finalDescriptionHtml
    ) {
      return jsonError(
        "Impossible de publier : certains champs recommandés n'ont pas encore été validés.",
        422,
      );
    }

    const finalVariants = (optimization.finalVariants as unknown as VariantPair[]) ?? [];

    const validation = validateAll({
      title: optimization.finalTitle,
      metaTitle: optimization.finalMetaTitle,
      metaDescription: optimization.finalMetaDescription,
      descriptionHtml: optimization.finalDescriptionHtml,
      handle: optimization.finalHandle,
      variants: finalVariants,
    });

    if (!validation.valid) {
      return jsonError(`Validation échouée avant publication : ${validation.errors.join(" | ")}`, 422);
    }

    try {
      await updateProduct(store, optimization.shopifyProductId, {
        title: optimization.finalTitle,
        handle: optimization.finalHandle,
        descriptionHtml: optimization.finalDescriptionHtml,
        seo: { title: optimization.finalMetaTitle, description: optimization.finalMetaDescription },
        variants: finalVariants
          .filter((v) => (v as unknown as { id?: string }).id)
          .map((v) => ({
            id: (v as unknown as { id: string }).id,
            title: v.recommendedName,
          })),
      });
    } catch (publishErr) {
      const message =
        publishErr instanceof Error ? publishErr.message : "Erreur lors de la publication Shopify.";
      await prisma.productOptimization.update({
        where: { id: optimization.id },
        data: { status: "ERROR", errorMessage: message },
      });
      await prisma.optimizationHistory.create({
        data: {
          storeId: store.id,
          optimizationId: optimization.id,
          userId,
          shopifyProductId: optimization.shopifyProductId,
          action: "error",
          oldTitle: snapshot.title,
          newTitle: optimization.finalTitle,
          oldHandle: snapshot.handle,
          newHandle: optimization.finalHandle,
          oldMetaDescription: snapshot.metaDescription,
          newMetaDescription: optimization.finalMetaDescription,
          status: "ERROR",
          errorMessage: message,
        },
      });
      throw publishErr;
    }

    const updated = await prisma.productOptimization.update({
      where: { id: optimization.id },
      data: { status: "PUBLISHED", publishedAt: new Date(), errorMessage: null },
    });

    await prisma.optimizationHistory.create({
      data: {
        storeId: store.id,
        optimizationId: optimization.id,
        userId,
        shopifyProductId: optimization.shopifyProductId,
        action: "published",
        keyword: undefined,
        oldTitle: snapshot.title,
        newTitle: optimization.finalTitle,
        oldHandle: snapshot.handle,
        newHandle: optimization.finalHandle,
        oldMetaDescription: snapshot.metaDescription,
        newMetaDescription: optimization.finalMetaDescription,
        status: "PUBLISHED",
      },
    });

    const numericId = extractGid(optimization.shopifyProductId);
    const adminUrl = `https://${store.shopDomain}/admin/products/${numericId}`;
    const storefrontUrl = `https://${store.shopDomain}/products/${optimization.finalHandle}`;

    return NextResponse.json({ optimization: updated, adminUrl, storefrontUrl });
  } catch (err) {
    return handleApiError(err);
  }
}
