import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, requireOwnedStore } from "@/lib/api/session";
import { handleApiError, jsonError } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const storeId = req.nextUrl.searchParams.get("storeId");
    if (!storeId) {
      return jsonError("Le paramètre storeId est requis.", 422);
    }
    await requireOwnedStore(storeId, userId);

    const history = await prisma.optimizationHistory.findMany({
      where: { storeId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { email: true, name: true } } },
    });

    return NextResponse.json({ history });
  } catch (err) {
    return handleApiError(err);
  }
}
