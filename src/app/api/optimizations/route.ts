import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUserId, requireOwnedStore } from "@/lib/api/session";
import { handleApiError, jsonError } from "@/lib/api/response";
import { orientationSchema } from "@/lib/validations/optimization";
import { getProduct } from "@/lib/shopify/service";
import { assertOptimizationLimit } from "@/lib/billing/limits";

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const input = orientationSchema.parse(body);

    const store = await requireOwnedStore(input.storeId, userId);
    await assertOptimizationLimit(userId);

    const product = await getProduct(store, input.shopifyProductId);
    if (!product) {
      return jsonError("Produit introuvable dans cette boutique.", 404);
    }

    const snapshot = await prisma.productSnapshot.create({
      data: {
        storeId: store.id,
        shopifyProductId: product.id,
        title: product.title,
        handle: product.handle,
        descriptionHtml: product.descriptionHtml,
        metaTitle: product.seo.title,
        metaDescription: product.seo.description,
        vendor: product.vendor,
        productType: product.productType,
        images: product.images.map((i) => i.url),
        variants: product.variants as unknown as Prisma.InputJsonValue,
        collections: product.collections as unknown as Prisma.InputJsonValue,
      },
    });

    const optimization = await prisma.productOptimization.create({
      data: {
        storeId: store.id,
        snapshotId: snapshot.id,
        shopifyProductId: product.id,
        status: "DRAFT",
        niche: input.niche,
        collectionHint: input.collectionHint,
        targetMarket: input.targetMarket,
        targetLanguage: input.targetLanguage,
        tone: input.tone,
        objective: input.objective,
      },
    });

    return NextResponse.json({ optimization }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
