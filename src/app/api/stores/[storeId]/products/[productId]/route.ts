import { NextRequest, NextResponse } from "next/server";
import { requireUserId, requireOwnedStore } from "@/lib/api/session";
import { handleApiError, jsonError } from "@/lib/api/response";
import { getProduct } from "@/lib/shopify/service";

export async function GET(
  _req: NextRequest,
  { params }: { params: { storeId: string; productId: string } },
) {
  try {
    const userId = await requireUserId();
    const store = await requireOwnedStore(params.storeId, userId);

    const productId = decodeURIComponent(params.productId);
    const product = await getProduct(store, productId);
    if (!product) {
      return jsonError("Produit introuvable dans cette boutique.", 404);
    }

    return NextResponse.json({ product });
  } catch (err) {
    return handleApiError(err);
  }
}
