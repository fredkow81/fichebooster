import { NextRequest, NextResponse } from "next/server";
import { requireUserId, requireOwnedStore } from "@/lib/api/session";
import { handleApiError, jsonError } from "@/lib/api/response";
import { getSimilarProducts } from "@/lib/shopify/service";

export async function GET(
  req: NextRequest,
  { params }: { params: { storeId: string; productId: string } },
) {
  try {
    const userId = await requireUserId();
    const store = await requireOwnedStore(params.storeId, userId);

    const collectionId = req.nextUrl.searchParams.get("collectionId");
    if (!collectionId) {
      return jsonError("Le paramètre collectionId est requis.", 422);
    }

    const productId = decodeURIComponent(params.productId);
    const similar = await getSimilarProducts(store, collectionId, productId);
    return NextResponse.json({ products: similar });
  } catch (err) {
    return handleApiError(err);
  }
}
