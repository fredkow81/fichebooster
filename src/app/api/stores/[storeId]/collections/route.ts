import { NextRequest, NextResponse } from "next/server";
import { requireUserId, requireOwnedStore } from "@/lib/api/session";
import { handleApiError } from "@/lib/api/response";
import { listCollections } from "@/lib/shopify/service";

export async function GET(_req: NextRequest, { params }: { params: { storeId: string } }) {
  try {
    const userId = await requireUserId();
    const store = await requireOwnedStore(params.storeId, userId);
    const collections = await listCollections(store);
    return NextResponse.json({ collections });
  } catch (err) {
    return handleApiError(err);
  }
}
