import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/api/session";
import { requireOwnedOptimization } from "@/lib/api/optimization-access";
import { handleApiError } from "@/lib/api/response";
import { draftUpdateSchema } from "@/lib/validations/draft";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const { optimization, snapshot, store } = await requireOwnedOptimization(params.id, userId);

    const body = await req.json();
    const input = draftUpdateSchema.parse(body);

    const updated = await prisma.productOptimization.update({
      where: { id: optimization.id },
      data: {
        ...(input.finalHandle !== undefined && { finalHandle: input.finalHandle }),
        ...(input.finalTitle !== undefined && { finalTitle: input.finalTitle }),
        ...(input.finalMetaTitle !== undefined && { finalMetaTitle: input.finalMetaTitle }),
        ...(input.finalMetaDescription !== undefined && {
          finalMetaDescription: input.finalMetaDescription,
        }),
        ...(input.finalDescriptionHtml !== undefined && {
          finalDescriptionHtml: input.finalDescriptionHtml,
        }),
        ...(input.finalVariants !== undefined && { finalVariants: input.finalVariants }),
      },
    });

    await prisma.optimizationHistory.create({
      data: {
        storeId: store.id,
        optimizationId: optimization.id,
        userId,
        shopifyProductId: optimization.shopifyProductId,
        action: "draft_saved",
        keyword: undefined,
        oldTitle: snapshot.title,
        newTitle: updated.finalTitle,
        oldHandle: snapshot.handle,
        newHandle: updated.finalHandle,
        oldMetaDescription: snapshot.metaDescription,
        newMetaDescription: updated.finalMetaDescription,
        status: updated.status,
      },
    });

    return NextResponse.json({ optimization: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
