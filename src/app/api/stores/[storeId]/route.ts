import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, requireOwnedStore } from "@/lib/api/session";
import { handleApiError } from "@/lib/api/response";

export async function GET(_req: NextRequest, { params }: { params: { storeId: string } }) {
  try {
    const userId = await requireUserId();
    const store = await requireOwnedStore(params.storeId, userId);
    return NextResponse.json({
      store: {
        id: store.id,
        shopDomain: store.shopDomain,
        defaultMarket: store.defaultMarket,
        defaultLanguage: store.defaultLanguage,
        isActive: store.isActive,
        lastSyncedAt: store.lastSyncedAt,
        createdAt: store.createdAt,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { storeId: string } }) {
  try {
    const userId = await requireUserId();
    await requireOwnedStore(params.storeId, userId);
    await prisma.store.delete({ where: { id: params.storeId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
