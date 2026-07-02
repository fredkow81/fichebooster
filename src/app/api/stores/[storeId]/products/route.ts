import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, requireOwnedStore } from "@/lib/api/session";
import { handleApiError } from "@/lib/api/response";
import { listProducts } from "@/lib/shopify/service";

export async function GET(req: NextRequest, { params }: { params: { storeId: string } }) {
  try {
    const userId = await requireUserId();
    const store = await requireOwnedStore(params.storeId, userId);

    const search = req.nextUrl.searchParams.get("search") ?? undefined;
    const products = await listProducts(store, { search });

    const latestByProduct = await prisma.productOptimization.findMany({
      where: { storeId: store.id, shopifyProductId: { in: products.map((p) => p.id) } },
      orderBy: { updatedAt: "desc" },
      distinct: ["shopifyProductId"],
      select: { shopifyProductId: true, status: true, updatedAt: true },
    });
    const statusMap = new Map(latestByProduct.map((o) => [o.shopifyProductId, o]));

    const enriched = products.map((p) => ({
      ...p,
      optimizationStatus: statusMap.get(p.id)?.status ?? "NOT_OPTIMIZED",
      lastOptimizedAt: statusMap.get(p.id)?.updatedAt ?? null,
    }));

    return NextResponse.json({ products: enriched });
  } catch (err) {
    return handleApiError(err);
  }
}
