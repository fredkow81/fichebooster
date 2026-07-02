import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/api/session";
import { handleApiError, jsonError } from "@/lib/api/response";
import { connectStoreSchema } from "@/lib/validations/store";
import { encryptSecret } from "@/lib/crypto";
import { verifyStoreConnection } from "@/lib/shopify/service";
import { assertStoreLimit } from "@/lib/billing/limits";

const STORE_SAFE_SELECT = {
  id: true,
  shopDomain: true,
  defaultMarket: true,
  defaultLanguage: true,
  isActive: true,
  lastSyncedAt: true,
  createdAt: true,
} as const;

export async function GET() {
  try {
    const userId = await requireUserId();
    const stores = await prisma.store.findMany({
      where: { userId },
      select: STORE_SAFE_SELECT,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ stores });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const input = connectStoreSchema.parse(body);

    const existing = await prisma.store.findUnique({ where: { shopDomain: input.shopDomain } });
    if (existing && existing.userId !== userId) {
      return jsonError("Cette boutique est déjà connectée par un autre compte.", 409);
    }
    if (!existing) {
      await assertStoreLimit(userId);
    }

    const verification = await verifyStoreConnection(input.shopDomain, input.accessToken);
    if (!verification.ok) {
      return jsonError(verification.error, 422);
    }

    const encryptedAccessToken = encryptSecret(input.accessToken);

    const store = await prisma.store.upsert({
      where: { shopDomain: input.shopDomain },
      create: {
        userId,
        shopDomain: input.shopDomain,
        encryptedAccessToken,
        defaultMarket: input.defaultMarket,
        defaultLanguage: input.defaultLanguage,
        lastSyncedAt: new Date(),
      },
      update: {
        encryptedAccessToken,
        defaultMarket: input.defaultMarket,
        defaultLanguage: input.defaultLanguage,
        isActive: true,
        lastSyncedAt: new Date(),
      },
      select: STORE_SAFE_SELECT,
    });

    return NextResponse.json({ store }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
