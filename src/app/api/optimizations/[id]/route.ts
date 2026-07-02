import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/api/session";
import { requireOwnedOptimization } from "@/lib/api/optimization-access";
import { handleApiError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    await requireOwnedOptimization(params.id, userId);

    const optimization = await prisma.productOptimization.findUnique({
      where: { id: params.id },
      include: {
        snapshot: true,
        keywordRecommendation: true,
        internalLinks: true,
      },
    });

    return NextResponse.json({ optimization });
  } catch (err) {
    return handleApiError(err);
  }
}
